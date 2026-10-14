// Shared notes for the AI (docs/Technical/collaboration-design.md, "4. AI and collaboration"): a
// note several people edit together is an Automerge document, its changes and snapshots sealed with
// the note's own key (NK). The AI connection already opens the person's data key; through it, it
// opens their self_wrap (NK sealed under that key), reads the newest snapshot and the changes after
// it, and gives the text to the file tools like any note. A write is a diff from the text into
// Automerge splices, sealed as one change, so it merges with whatever people type meanwhile. The
// change's author is the person (note_updates.author_id, also in the seal's AAD), its client the AI
// (pane_writer(), set from pane.client), and its message says both: "Sara's Claude".
//
// Automerge is WebAssembly (3.6 MB, 4.9 MB as the base64 module it loads from). It's imported the
// first time a call touches a shared note, as esbuild is for apps, so calls that don't pay nothing.

import type * as AM from "npm:@automerge/automerge@3.5.0/slim";
import { importIdentity, open3, openNoteKey as openWrap, seal3 } from "../_shared/collab.ts";
import { type Bytes, fromBase64, OpenError } from "../_shared/e2ee.ts";
import { previewOf, titleOf } from "./notes.ts";
import { type Call, checkSize, ToolError, type Tx } from "./tools.ts";

export type Role = "owner" | "editor" | "viewer";
/** A shared note this account is in, with its key opened. */
export type Shared = {
  id: string; role: Role; epoch: number; title: string; preview?: string; ownerId: string;
  created_at: Date; updated_at: Date; nk: Bytes;
};
type Doc = AM.Doc<{ body?: string }>;

/** Where shared notes others shared with you show, for the file tools. */
export const SHARED_DIR = "Shared with me/";
/** A device writes a snapshot after a few hundred changes; the AI does too, so a busy note stays small. */
export const SNAPSHOT_EVERY = 200;

let automerge: Promise<typeof AM> | null = null;
/** Automerge, loaded and its WebAssembly compiled once per isolate. */
export function loadAutomerge(): Promise<typeof AM> {
  automerge ??= (async () => {
    const [A, { automergeWasmBase64 }] = await Promise.all([
      import("npm:@automerge/automerge@3.5.0/slim"),
      import("npm:@automerge/automerge@3.5.0/automerge.wasm.base64"),
    ]);
    await A.initializeBase64Wasm(automergeWasmBase64);
    return A;
  })();
  automerge.catch(() => { automerge = null; });
  return automerge;
}

type Row = {
  id: string; epoch: number; head_ct: string | null; owner_id: string; created_at: Date; updated_at: Date; last: Date | null;
  role: Role; member_epoch: number; self_wrap: string | null; key_wrap: string; wrapped_by: string;
};

const opened = new WeakMap<Call, Shared[]>();
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
  const [p] = await tx<{ display_name: string | null }[]>`select display_name from public.profiles where user_id = auth.uid()`;
  const first = p?.display_name?.trim().split(/\s+/)[0];
  return first ? `${first}'s ${c.ctx.client}` : c.ctx.client;
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
  const change = A.getLastLocalChange(next);
  if (!change) return { changed: false };
  const ct = await seal3("u", change as Bytes, s.nk, s.id, s.epoch, c.ctx.userId);
  let id: number;
  try {
    const [row] = await tx<{ id: string }[]>`insert into public.note_updates (note_id, epoch, ct) values (${s.id}::uuid, ${s.epoch}, ${ct}) returning id`;
    id = Number(row.id);
  } catch (e) {
    const hint = (e as { hint?: string }).hint;
    if (hint === "read_only") throw new ToolError(`"${s.title}" is view only for this person now, so it can't be changed here.`);
    if (hint === "stale_epoch") throw new ToolError(`Someone was removed from "${s.title}" and it has a new key. Open it once in Pinto Notes, then try again.`);
    throw e;
  }
  // The list's title and preview, sealed with NK as devices write them.
  const head = { title: titleOf(text), preview: previewOf(text) };
  await tx`update public.shared_notes set head_ct = ${await seal3("h", new TextEncoder().encode(JSON.stringify(head)) as Bytes, s.nk, s.id, s.epoch)} where id = ${s.id}::uuid`;
  if (at.since + 1 >= SNAPSHOT_EVERY) {
    const saved = A.save(next);
    await tx`insert into public.note_snapshots (note_id, upto, epoch, ct)
      values (${s.id}::uuid, ${id}, ${s.epoch}, ${await seal3("s", saved as Bytes, s.nk, s.id, s.epoch, String(id))})`;
  }
  s.title = head.title;
  s.preview = head.preview;
  return { changed: true, update: id };
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
