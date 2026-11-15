// Shared notes for the AI (docs/Technical/collaboration-design.md, "4. AI and collaboration"): a
// note several people edit together is an Automerge document, its changes and snapshots sealed with
// the note's own key (NK). The AI connection already opens the person's data key; through it, it
// opens their self_wrap (NK sealed under that key), reads the newest snapshot and the changes after
// it, and gives the text to the file tools like any note. A write is a diff from the text into
// Automerge splices, sealed as one change, so it merges with whatever people type meanwhile. The
// change's author is the person (note_updates.author_id, also in the seal's AAD), its client the AI
// (pane_writer(), set from pane.client), and its message says both: "Sara's Claude".
//
// Automerge is WebAssembly (3.6 MB), in automerge.gen.js as base64 with its JavaScript (4.9 MB; from
// npm the bundle carried the whole 45 MB package). It's imported the first time a call touches a
// shared note, as esbuild is for apps, so calls that don't pay nothing.

import type * as AM from "./automerge.gen.d.ts";
import { importIdentity, open3, openNoteKey as openWrap, seal3 } from "../_shared/collab.ts";
import { type Bytes, fromBase64, OpenError } from "../_shared/e2ee.ts";
import { previewOf, titleOf } from "./notes.ts";
import { type Call, checkSize, ToolError, type Tx } from "./tools.ts";
import { elementIds, json as commentJSON, merge as mergeComments, resolveRaw, type Stored as Comment, withShown } from "./board_comments.ts";

export type Role = "owner" | "editor" | "viewer";
/** A shared note this account is in, with its key opened. */
export type Shared = {
  id: string; role: Role; epoch: number; title: string; preview?: string; ownerId: string;
  created_at: Date; updated_at: Date; nk: Bytes;
};
/** A shared note's document: its text, and a whiteboard's drawing beside it (Pane/Collab/CollabBoard.swift):
 *  `board` maps each element's id to the element as JSON, `boardState` holds the scene's settings. */
type Doc = AM.Doc<{ body?: string; board?: Record<string, unknown>; boardState?: Record<string, unknown>; comments?: Record<string, unknown> }>;

/** Where shared notes others shared with you show, for the file tools. */
export const SHARED_DIR = "Shared with me/";
/** A device writes a snapshot after a few hundred changes; the AI does too, so a busy note stays small. */
export const SNAPSHOT_EVERY = 200;

let automerge: Promise<typeof AM> | null = null;
/** Automerge, loaded and its WebAssembly compiled once per isolate. */
export function loadAutomerge(): Promise<typeof AM> {
  if (automerge) return automerge;
  const loading = (async () => {
    const A = await import("./automerge.gen.js");
    await A.initializeBase64Wasm(A.automergeWasmBase64);
    return A;
  })();
  loading.catch(() => { automerge = null; });
  return automerge = loading;
}

type Row = {
  id: string; epoch: number; head_ct: string | null; owner_id: string; created_at: Date; updated_at: Date; last: Date | null;
  role: Role; member_epoch: number; self_wrap: string | null; key_wrap: string; wrapped_by: string;
};

const opened = new WeakMap<Call, Shared[]>();
/** After this call left or stopped sharing a note: the next look reads memberships again. */
export const forgetShared = (c: Call) => opened.delete(c);
/** The shared notes this account is in and can open, once per call. A note whose key won't open
 *  here (a new key no device of theirs has opened yet, and no identity key to open it with) is left out. */
export async function sharedNotes(tx: Tx, c: Call, fresh = false): Promise<Shared[]> {
  const had = opened.get(c);
  if (had && !fresh) return had;
  const rows = await tx<Row[]>`
    select s.id, s.epoch, s.head_ct, s.owner_id, s.created_at, s.updated_at,
      (select max(u.created_at) from public.note_updates u where u.note_id = s.id) as last,
      m.role, m.epoch as member_epoch, m.self_wrap, m.key_wrap, m.wrapped_by
    from public.note_members m join public.shared_notes s on s.id = m.note_id
    where m.user_id = auth.uid() and m.accepted_at is not null`;
  const out: Shared[] = [];
  for (const r of rows) {
    const nk = await noteKey(tx, c, r).catch(() => null);
    if (!nk) continue;
    let head: { title?: unknown; preview?: unknown } = {};
    if (r.head_ct) {
      try { head = JSON.parse(new TextDecoder().decode(await open3("h", r.head_ct, nk, r.id))); } catch { /* an unreadable head still lists */ }
    }
    const updated = r.last && +new Date(r.last) > +new Date(r.updated_at) ? r.last : r.updated_at;
    out.push({
      id: r.id, role: r.role, epoch: Number(r.epoch), ownerId: r.owner_id, created_at: r.created_at, updated_at: updated, nk,
      title: typeof head.title === "string" && head.title.trim() ? head.title : "Shared note",
      ...(typeof head.preview === "string" ? { preview: head.preview } : {}),
    });
  }
  opened.set(c, out);
  return out;
}

/** NK at the note's current epoch: the member's self_wrap, or, when the key was renewed and no device
 *  of theirs has re-sealed it yet, their key_wrap opened with their identity key. */
async function noteKey(tx: Tx, c: Call, r: Row): Promise<Bytes> {
  if (r.self_wrap && Number(r.member_epoch) === Number(r.epoch)) return await c.v.openNoteKey(r.id, Number(r.epoch), r.self_wrap);
  if (Number(r.member_epoch) !== Number(r.epoch)) throw new OpenError("no key for this epoch");
  const [me] = await tx<{ public_key: string; private_wrap: string }[]>`select public_key, private_wrap from public.identity_keys where user_id = auth.uid()`;
  if (!me) throw new OpenError("no identity key");
  const [from] = await tx<{ public_key: string | null }[]>`select public_key from public.collab_members(${r.id}::uuid) where user_id = ${r.wrapped_by}::uuid`;
  if (!from?.public_key) throw new OpenError("no sealer key");
  const d = await c.v.openIdentity(me.private_wrap);
  try {
    const identity = await importIdentity(d, fromBase64(me.public_key));
    return await openWrap(r.key_wrap, identity, fromBase64(from.public_key), { note: r.id, epoch: Number(r.epoch), from: r.wrapped_by, to: c.ctx.userId });
  } finally {
    d.fill(0);
  }
}

export type Loaded = { doc: Doc; text: string; last: number; since: number };

/** The document as the server has it: the newest snapshot this key opens, then every change after it. */
export async function loadDoc(tx: Tx, s: Shared): Promise<Loaded> {
  const A = await loadAutomerge();
  const snaps = await tx<{ upto: string; epoch: number; ct: string }[]>`
    select upto, epoch, ct from public.note_snapshots where note_id = ${s.id}::uuid order by upto desc, epoch desc limit 5`;
  const snap = snaps.find((x) => Number(x.epoch) === s.epoch);
  // A newer snapshot under an older key, and none under this one: what it covers is gone from the
  // changes, and this key can't open it.
  if (snaps.length && (!snap || Number(snap.upto) < Number(snaps[0].upto))) throw notYet(s);
  const upto = snap ? Number(snap.upto) : 0;
  let doc: Doc = A.init();
  if (snap) doc = A.loadIncremental(doc, await open3("s", snap.ct, s.nk, s.id, String(upto)));
  const updates = await tx<{ id: string; epoch: number; author_id: string; ct: string }[]>`
    select id, epoch, author_id, ct from public.note_updates where note_id = ${s.id}::uuid and id > ${upto} order by id`;
  let last = upto;
  for (const u of updates) {
    // Changes sealed with an older key: the first device to open the note after the key changed
    // writes a snapshot under the new one. Until then they can't be read here.
    if (Number(u.epoch) !== s.epoch) throw notYet(s);
    doc = A.loadIncremental(doc, await open3("u", u.ct, s.nk, s.id, u.author_id));
    last = Number(u.id);
  }
  if (A.getMissingDeps(doc, []).length) throw notYet(s);
  const body = doc.body;
  return { doc, text: typeof body === "string" ? body : "", last, since: updates.length };
}

const notYet = (s: Shared) => new ToolError(`"${s.title}" is shared, and its newest changes can't be read here yet. Open it once in Pinto Notes, then try again.`);

/** Who an AI change is from, as the note shows it: "Sara's Claude". */
async function byline(tx: Tx, c: Call): Promise<string> {
  const first = await firstName(tx);
  return first ? `${first}'s ${c.ctx.client}` : c.ctx.client;
}

/** The person's first name, as their profile has it (null with none). */
export async function firstName(tx: Tx): Promise<string | null> {
  const [p] = await tx<{ display_name: string | null }[]>`select display_name from public.profiles where user_id = auth.uid()`;
  return p?.display_name?.trim().split(/\s+/)[0] || null;
}

/** A viewer's AI reads but doesn't write; the server refuses its changes too. */
export function refuseViewer(s: Shared) {
  if (s.role === "viewer") throw new ToolError(`"${s.title}" was shared with this person as view only, so it can be read here but not changed. Ask its owner for Can edit.`);
}

/** Writes `text` into the shared note as one Automerge change from what was loaded, sealed with NK. */
export async function writeDoc(tx: Tx, c: Call, s: Shared, at: Loaded, text: string): Promise<{ changed: boolean; update?: number }> {
  refuseViewer(s);
  checkSize(text);
  if (text === at.text) return { changed: false };
  if (typeof at.doc.body !== "string") throw notYet(s);
  const A = await loadAutomerge();
  const message = await byline(tx, c);
  const next = A.change(at.doc, { message, time: Math.floor(Date.now() / 1000) }, (d) => A.updateText(d, ["body"], text));
  const stored = await commit(tx, c, s, at, next);
  if (!stored.changed) return stored;
  // The list's title and preview, sealed with NK as devices write them.
  const head = { title: titleOf(text), preview: previewOf(text) };
  await tx`update public.shared_notes set head_ct = ${await seal3("h", new TextEncoder().encode(JSON.stringify(head)) as Bytes, s.nk, s.id, s.epoch)} where id = ${s.id}::uuid`;
  s.title = head.title;
  s.preview = head.preview;
  return stored;
}

/** The change from what was loaded to `next`, sealed with NK and stored as this person's (the AI named),
 *  and a snapshot when one is due. */
async function commit(tx: Tx, c: Call, s: Shared, at: Loaded, next: Doc): Promise<{ changed: boolean; update?: number }> {
  const A = await loadAutomerge();
  const change = A.getLastLocalChange(next);
  if (!change) return { changed: false };
  const ct = await seal3("u", change as Bytes, s.nk, s.id, s.epoch, c.ctx.userId);
  // The server takes a change up to this size (a device sends a bigger one as a snapshot).
  if (ct.length > MAX_UPDATE) throw new ToolError(`That change to "${s.title}" is too big to send at once. Make it in a few smaller parts.`);
  let id: number;
  try {
    const [row] = await tx<{ id: string }[]>`insert into public.note_updates (note_id, epoch, ct) values (${s.id}::uuid, ${s.epoch}, ${ct}) returning id`;
    id = Number(row.id);
  } catch (e) {
    const hint = (e as { hint?: string }).hint;
    if (hint === "not_member") throw new ToolError(`This person isn't in "${s.title}" anymore, so it can't be changed here.`);
    if (hint === "read_only") throw new ToolError(`"${s.title}" is view only for this person now, so it can't be changed here.`);
    if (hint === "stale_epoch") throw new ToolError(`Someone was removed from "${s.title}" and it has a new key. Open it once in Pinto Notes, then try again.`);
    throw e;
  }
  // A snapshot covers what was loaded (`at.last`), never more: a change someone else committed
  // after the load has a smaller id than this one, isn't in this document, and compaction would
  // delete it. This change stays a change after the snapshot too; loading it twice changes nothing.
  if (at.since + 1 >= SNAPSHOT_EVERY && at.last > 0) {
    const saved = A.save(next);
    await tx`insert into public.note_snapshots (note_id, upto, epoch, ct)
      values (${s.id}::uuid, ${at.last}, ${s.epoch}, ${await seal3("s", saved as Bytes, s.nk, s.id, s.epoch, String(at.last))})
      on conflict (note_id, upto, epoch) do nothing`;
  }
  return { changed: true, update: id };
}

/** The biggest change a device sends as one (CollabSession.maxUpdate). */
const MAX_UPDATE = 262_144;

// MARK: Shared whiteboards

type El = Record<string, unknown>;
type Stamp = { v: number; n: number };
const stampOf = (e: El): Stamp => ({ v: typeof e.version === "number" ? e.version : 0, n: typeof e.versionNonce === "number" ? e.versionNonce : 0 });
/** Excalidraw's rule for two edits of one element (CollabBoard.Stamp): the newer, then the lower nonce. */
const beats = (a: Stamp, b: Stamp) => a.v > b.v || (a.v === b.v && a.n < b.n);
/** A scalar string as Automerge hands it back (an ImmutableString), or a plain one. */
const scalar = (v: unknown): string | null => typeof v === "string" ? v : v && typeof v === "object" && "val" in v && typeof (v as { val: unknown }).val === "string" ? (v as { val: string }).val : null;
/** JSON with every object's keys sorted, as the devices write elements. */
const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as El).sort().map((k) => [k, canon((v as El)[k])])) : v;
const nonce = () => crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646 + 1;

/** Whether a shared note is a whiteboard: its document holds a drawing. */
export const isBoard = (at: Loaded) => !!at.doc.board && typeof at.doc.board === "object";

/** Each element, as every device picks it among values written at once (CollabBoard.resolve). */
export async function boardElements(at: Loaded): Promise<Map<string, El>> {
  const A = await loadAutomerge();
  const board = at.doc.board ?? {};
  const out = new Map<string, El>();
  for (const id of Object.keys(board)) {
    // deno-lint-ignore no-explicit-any
    const all = A.getConflicts(board as any, id);
    const raws = (all ? Object.values(all) : [board[id]]).map(scalar).filter((x): x is string => x !== null).sort();
    let best: { raw: string; e: El; st: Stamp } | null = null;
    for (const raw of raws) {
      let e: unknown;
      try { e = JSON.parse(raw); } catch { continue; }
      if (!e || typeof e !== "object" || Array.isArray(e)) continue;
      const st = stampOf(e as El);
      if (best && !(beats(st, best.st) || (st.v === best.st.v && st.n === best.st.n && raw < best.raw))) continue;
      best = { raw, e: e as El, st };
    }
    if (best) out.set(id, best.e);
  }
  return out;
}

/** A shared board's comments (board_comments.ts), from every `comments` map in its document (two
 *  devices that made the map at once leave two), each one's values written at once resolved as
 *  every device resolves them. */
export async function boardComments(at: Loaded): Promise<Comment[]> {
  const A = await loadAutomerge();
  // deno-lint-ignore no-explicit-any
  const all = A.getConflicts(at.doc as any, "comments");
  const maps = (all ? Object.values(all) : [at.doc.comments]).filter((m): m is Record<string, unknown> => !!m && typeof m === "object" && !Array.isArray(m));
  const raws = new Map<string, Set<string>>();
  for (const m of maps) {
    for (const id of Object.keys(m)) {
      // deno-lint-ignore no-explicit-any
      const values = A.getConflicts(m as any, id);
      for (const v of values ? Object.values(values) : [m[id]]) {
        const s = scalar(v);
        if (s !== null) raws.set(id, (raws.get(id) ?? new Set()).add(s));
      }
    }
  }
  const out: Comment[] = [];
  for (const [id, r] of raws) {
    const c = resolveRaw([...r]);
    if (c && c.id === id) out.push(c);
  }
  return out;
}

/** A shared whiteboard's data.json: its drawing as a board of the person's own keeps it (`values.scene`),
 *  and its open comments in `collections.comments`. */
export async function boardData(at: Loaded) {
  const byIndex = (a: El, b: El) => {
    const x = typeof a.index === "string" ? a.index : null, y = typeof b.index === "string" ? b.index : null;
    if (x !== null && y !== null && x !== y) return x < y ? -1 : 1;
    if (x !== null && y === null) return -1;
    if (x === null && y !== null) return 1;
    return String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0;
  };
  const elements = [...(await boardElements(at)).values()].sort(byIndex);
  const st = at.doc.boardState ?? {};
  const appState: El = { viewBackgroundColor: scalar(st.viewBackgroundColor) ?? "#ffffff" };
  if (typeof st.gridModeEnabled === "boolean") appState.gridModeEnabled = st.gridModeEnabled;
  return withShown({ values: { scene: { type: "excalidraw", version: 2, source: "https://pintonotes.com", elements, appState, files: {} } }, collections: {} as Record<string, unknown> }, await boardComments(at));
}

/**
 * data.json written for a shared whiteboard: each element that changed goes into its document as
 * one change, newer than any device's copy so it wins everywhere, and merges with what people draw
 * meanwhile. An element left out is deleted (kept as `isDeleted`, so a device that was away can't
 * bring it back), unless it was drawn after `readAt`, when the AI last read the drawing; a copy older
 * than the board's isn't taken over someone's newer edit. One without an id gets one. A picture
 * already on the board (its `fileId` is one of the board's) is an element like any other, so an AI
 * can move, resize or delete it; a new one is left out and counted: its bytes are sealed by the
 * device that puts it there (note_files), and data.json carries none.
 */
export async function writeBoard(tx: Tx, c: Call, s: Shared, at: Loaded, data: unknown, readAt: Date = new Date()): Promise<{ changed: boolean; update?: number; pictures: number; refused: string[] }> {
  refuseViewer(s);
  const scene = (data as { values?: { scene?: { elements?: unknown; appState?: unknown } } })?.values?.scene;
  if (!scene || typeof scene !== "object" || !Array.isArray(scene.elements)) {
    throw new ToolError(`A whiteboard's data.json keeps its drawing in values.scene: { "values": { "scene": { "elements": [ … ], "appState": { … } } }, "collections": {} }. Nothing was saved.`);
  }
  if (!isBoard(at)) throw notYet(s);
  const current = await boardElements(at);
  const onBoard = new Set([...current.values()].filter((e) => e.type === "image" && typeof e.fileId === "string").map((e) => e.fileId as string));
  const now = Date.now();
  const puts: [string, string][] = [];
  const seen = new Set<string>();
  let pictures = 0, made = 0;
  for (const raw of scene.elements as unknown[]) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || typeof (raw as El).type !== "string") continue;
    const e: El = { ...(raw as El) };
    if (e.type === "image" && !(typeof e.fileId === "string" && onBoard.has(e.fileId))) { pictures++; continue; }
    if (typeof e.id !== "string" || !e.id || e.id.length > 200) e.id = `ai-${crypto.randomUUID().slice(0, 8)}-${made++}`;
    const id = e.id as string;
    seen.add(id);
    const had = current.get(id);
    if (had && JSON.stringify(canon(had)) === JSON.stringify(canon(e))) continue;
    // A copy older than the board's (someone changed it after this was read): theirs stays. A
    // short form (no version) written over an element is meant as a change to it.
    if (had && typeof e.version === "number" && e.version < stampOf(had).v) continue;
    if (had) {
      // Newer than the board's copy, whatever version it was read at.
      Object.assign(e, { version: Math.max(stampOf(had).v, stampOf(e).v) + 1, versionNonce: nonce(), updated: now });
    }
    puts.push([id, JSON.stringify(canon(e))]);
  }
  for (const [id, had] of current) {
    if (seen.has(id) || had.isDeleted === true) continue;
    // Drawn after this was read: never seen, so not left out on purpose.
    if (typeof had.updated === "number" && had.updated > +readAt) continue;
    puts.push([id, JSON.stringify(canon({ ...had, isDeleted: true, version: stampOf(had).v + 1, versionNonce: nonce(), updated: now }))]);
  }
  const appState = (scene.appState && typeof scene.appState === "object" ? scene.appState : {}) as El;
  const st = at.doc.boardState ?? {};
  const settings: [string, string | boolean][] = [];
  if (typeof appState.viewBackgroundColor === "string" && appState.viewBackgroundColor !== scalar(st.viewBackgroundColor)) settings.push(["viewBackgroundColor", appState.viewBackgroundColor]);
  if (typeof appState.gridModeEnabled === "boolean" && appState.gridModeEnabled !== st.gridModeEnabled) settings.push(["gridModeEnabled", appState.gridModeEnabled]);
  // Comments (board_comments.ts): new ones and replies, attributed to this person's AI, and threads
  // it resolved. On a shape of the drawing as it is after this write.
  const ids = elementIds({ values: { scene: { elements: [...current.values()] } } });
  for (const [id, json] of puts) { const e = JSON.parse(json) as El; if (e.isDeleted === true) ids.delete(id); else ids.add(id); }
  const first = await firstName(tx);
  const wanted = (data as { collections?: Record<string, unknown> })?.collections?.comments;
  const { changed: comments, refused } = mergeComments(await boardComments(at), wanted, { id: c.ctx.userId, name: first ?? "Someone", ai: c.ctx.client }, ids, new Date(now));
  if (!puts.length && !settings.length && !comments.length) return { changed: false, pictures, refused };
  const A = await loadAutomerge();
  const message = first ? `${first}'s ${c.ctx.client}` : c.ctx.client;
  const next = A.change(at.doc, { message, time: Math.floor(now / 1000) }, (d) => {
    // Scalar strings, as the devices write them (a plain string would be collaborative text).
    for (const [id, json] of puts) d.board![id] = new A.ImmutableString(json);
    if (settings.length) {
      if (!d.boardState) d.boardState = {};
      for (const [k, v] of settings) d.boardState[k] = typeof v === "string" ? new A.ImmutableString(v) : v;
    }
    if (comments.length) {
      if (!d.comments) d.comments = {};
      for (const cm of comments) d.comments[cm.id] = new A.ImmutableString(commentJSON(cm));
    }
  });
  return { ...await commit(tx, c, s, at, next), pictures, refused };
}

/** Who changed a shared note lately, newest first: "Sara", "Sara's Claude". */
export async function changesOf(tx: Tx, s: Shared, limit: number) {
  const [rows, people] = await Promise.all([
    tx<{ id: string; author_id: string; client: string | null; created_at: Date }[]>`
      select id, author_id, client, created_at from public.note_updates where note_id = ${s.id}::uuid order by id desc limit ${limit}`,
    tx<{ user_id: string; display_name: string | null }[]>`select user_id, display_name from public.collab_members(${s.id}::uuid)`,
  ]);
  const name = (id: string) => people.find((p) => p.user_id === id)?.display_name?.trim().split(/\s+/)[0] || "Someone";
  return rows.map((r) => ({ made_by: r.client ? `${name(r.author_id)}'s ${r.client}` : name(r.author_id), made: new Date(r.created_at).toISOString() }));
}
