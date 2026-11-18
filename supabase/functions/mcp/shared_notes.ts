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
import {
  type Identity, importIdentity, open3, openFolderWrap, openNoteKey as openWrap, seal3, sealFolderWrap, sealNoteKey, sharedFolderText,
} from "../_shared/collab.ts";
import { type Bytes, fromBase64, OpenError } from "../_shared/e2ee.ts";
import { previewOf, titleOf } from "./notes.ts";
import { type Call, checkSize, ToolError, type Tx } from "./tools.ts";

export type Role = "owner" | "editor" | "viewer";
/** A shared note this account is in, with its key opened. */
export type Shared = {
  id: string; role: Role; epoch: number; title: string; preview?: string; ownerId: string;
  created_at: Date; updated_at: Date; nk: Bytes;
  /** In a shared folder: its root, the tree's folder it's in, and this account's folder for that one. */
  folder?: { root: string; treeId: string; localId?: string };
};
type Doc = AM.Doc<{ body?: string }>;

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
  folder_root: string | null; folder_id: string | null;
};

const opened = new WeakMap<Call, Shared[]>();
/** After this call left or stopped sharing a note: the next look reads memberships again. */
export const forgetShared = (c: Call) => { opened.delete(c); folderCache.delete(c); };

// MARK: Shared folders (docs/Technical/collaboration-design.md, section 8)

/** A shared folder this account is an accepted member of, with its key (when it opens here) and
 *  where its folders are in this account's own folders: the owner's ids are the tree's; everyone
 *  else's are SharedFolders.folderID (HMAC of "pinto shared folder <id>" under the data key). */
export type SharedFolder = {
  root: string; role: Role; epoch: number; fk: Bytes | null;
  /** tree folder id → this account's folder id (when one of their devices made it). */
  local: Map<string, string>;
  /** this account's folder id → tree folder id. */
  tree: Map<string, string>;
};
const folderCache = new WeakMap<Call, SharedFolder[]>();

/** The caller's shared folders, once per call. */
export async function sharedFolders(tx: Tx, c: Call): Promise<SharedFolder[]> {
  const had = folderCache.get(c);
  if (had) return had;
  const ms = await tx<{ root: string; role: Role; epoch: number; key_wrap: string; wrapped_by: string | null; self_wrap: string | null; accepted_at: Date | null }[]>`
    select root, role, epoch, key_wrap, wrapped_by, self_wrap, accepted_at from public.collab_folder_memberships() where accepted_at is not null`;
  const out: SharedFolder[] = [];
  for (const m of ms) {
    const fk = await folderKey(tx, c, m).catch(() => null);
    const tree = await tx<{ id: string }[]>`select id from public.collab_folder_folders(${m.root}::uuid) where not deleted`;
    const candidates = new Map<string, string>(); // candidate local id → tree id
    for (const t of tree) {
      candidates.set(t.id, t.id);
      candidates.set(await c.v.derivedId(sharedFolderText(t.id)), t.id);
    }
    const mine = candidates.size
      ? await tx<{ id: string }[]>`select id from public.folders where deleted_at is null and id = any(${[...candidates.keys()]}::uuid[])`
      : [];
    const local = new Map<string, string>(), back = new Map<string, string>();
    for (const f of mine) {
      const t = candidates.get(f.id)!;
      // The owner's own folder (same id) wins over a derived one.
      if (!local.has(t) || f.id === t) local.set(t, f.id);
      back.set(f.id, t);
    }
    out.push({ root: m.root, role: m.role, epoch: Number(m.epoch), fk, local, tree: back });
  }
  folderCache.set(c, out);
  return out;
}

/** The identity key pair of the account, opened with its data key. */
async function myIdentity(tx: Tx, c: Call): Promise<Identity> {
  const [me] = await tx<{ public_key: string; private_wrap: string }[]>`select public_key, private_wrap from public.identity_keys where user_id = auth.uid()`;
  if (!me) throw new OpenError("no identity key");
  const d = await c.v.openIdentity(me.private_wrap);
  try {
    return await importIdentity(d, fromBase64(me.public_key));
  } finally {
    d.fill(0);
  }
}

/** FK at the folder's current epoch: the member's self_wrap, or their key_wrap opened with their identity. */
async function folderKey(tx: Tx, c: Call, m: { root: string; epoch: number; key_wrap: string; wrapped_by: string | null; self_wrap: string | null }): Promise<Bytes> {
  if (m.self_wrap) return await c.v.openFolderKey(m.root, Number(m.epoch), m.self_wrap);
  if (!m.wrapped_by || !m.key_wrap.startsWith("amb3k.")) throw new OpenError("no folder key here");
  const [from] = await tx<{ public_key: string | null }[]>`select public_key from public.collab_folder_members(${m.root}::uuid) where user_id = ${m.wrapped_by}::uuid`;
  if (!from?.public_key) throw new OpenError("no sealer key");
  return await openWrap(m.key_wrap, await myIdentity(tx, c), fromBase64(from.public_key), { note: m.root, epoch: Number(m.epoch), from: m.wrapped_by, to: c.ctx.userId });
}

/** The notes of the caller's shared folders that none of their devices joined yet: joined here with
 *  the key under FK, as a device does (collab_folder_join_note), so the AI reads them like any
 *  shared note. A note whose wrap is for an older key is left for a device. */
async function joinFolderNotes(tx: Tx, c: Call): Promise<void> {
  let identity: Identity | null = null;
  for (const f of await sharedFolders(tx, c)) {
    if (!f.fk) continue;
    const notes = await tx<{ note_id: string; folder_wrap: string | null; note_epoch: number; joined: boolean }[]>`
      select note_id, folder_wrap, note_epoch, joined from public.collab_folder_notes(${f.root}::uuid) where not joined`;
    for (const n of notes) {
      if (!n.folder_wrap) continue;
      const opened = await openFolderWrap(n.folder_wrap, f.fk, f.root, n.note_id).catch(() => null);
      if (!opened || opened.epoch !== f.epoch || opened.noteEpoch !== Number(n.note_epoch)) continue;
      identity ??= await myIdentity(tx, c).catch(() => null);
      if (!identity) return;
      const me = c.ctx.userId;
      const wrap = await sealNoteKey(opened.nk, identity, identity.publicRaw, { note: n.note_id, epoch: opened.noteEpoch, from: me, to: me });
      await tx`select public.collab_folder_join_note(${f.root}::uuid, ${n.note_id}::uuid, ${opened.noteEpoch}, ${wrap}, ${await c.v.sealNoteKey(n.note_id, opened.noteEpoch, opened.nk)})`;
    }
  }
}

/** The shared folder (and tree folder) one of this account's folders is, if any. */
export async function sharedFolderOf(tx: Tx, c: Call, localFolder: string | null): Promise<{ f: SharedFolder; treeId: string } | undefined> {
  if (!localFolder) return undefined;
  for (const f of await sharedFolders(tx, c)) {
    const t = f.tree.get(localFolder);
    if (t) return { f, treeId: t };
  }
  return undefined;
}

/** A new note made by the AI in a shared folder: a shared note of the caller's from the start, in
 *  one go, as a device makes one there. A new note key; the Automerge document with the text, as
 *  one change and the first snapshot; the shared_notes row with the caller as owner (collab_share,
 *  the key sealed to their own identity and data key); their notes row as its pointer (the
 *  placeholder text, shared_note_id); and the note put in the tree folder with its key under FK
 *  (collab_folder_note_add). */
export async function createInFolder(tx: Tx, c: Call, at: { f: SharedFolder; treeId: string }, localFolder: string, body: string, pinned: boolean): Promise<string> {
  const { f, treeId } = at;
  if (f.role === "viewer") throw new ToolError("This shared folder is view only for this person, so nothing can be made in it here. Ask its owner for Can edit.");
  if (!f.fk) throw new ToolError("This shared folder's newest key hasn't reached this person's devices yet. Open Pinto Notes once, then try again.");
  const identity = await myIdentity(tx, c).catch(() => null);
  if (!identity) throw new ToolError("Notes can be made in a shared folder here once Pinto Notes has opened it on one of this person's devices.");
  const A = await loadAutomerge();
  const me = c.ctx.userId;
  const id = crypto.randomUUID();
  const nk = crypto.getRandomValues(new Uint8Array(32)) as Bytes;
  const head = { title: titleOf(body), preview: previewOf(body) };
  const headCt = await seal3("h", new TextEncoder().encode(JSON.stringify(head)) as Bytes, nk, id, 1);
  const toSelf = await sealNoteKey(nk, identity, identity.publicRaw, { note: id, epoch: 1, from: me, to: me });
  await tx`select public.collab_share(${id}::uuid, ${toSelf}, ${await c.v.sealNoteKey(id, 1, nk)}, ${headCt})`;
  const placeholder = `${head.title}\n\nThis note is shared. Update Pinto Notes to open it.`;
  await tx`insert into public.notes (id, body_ct, head_ct, folder_id, parent_id, is_pinned, shared_note_id)
    values (${id}, ${await c.v.sealBody(id, placeholder)}, ${await c.v.sealHead(id, { title: head.title, preview: previewOf(placeholder) })}, ${localFolder}, null, ${pinned}, ${id})`;
  const doc = A.change(A.init<{ body?: string }>(), { message: await byline(tx, c), time: Math.floor(Date.now() / 1000) }, (d) => { d.body = body; });
  const change = A.getLastLocalChange(doc)!;
  const [row] = await tx<{ id: string }[]>`insert into public.note_updates (note_id, epoch, ct) values (${id}::uuid, 1, ${await seal3("u", change as Bytes, nk, id, 1, me)}) returning id`;
  const upto = Number(row.id);
  await tx`insert into public.note_snapshots (note_id, upto, epoch, ct) values (${id}::uuid, ${upto}, 1, ${await seal3("s", A.save(doc) as Bytes, nk, id, 1, String(upto))})`;
  await tx`select public.collab_folder_note_add(${f.root}::uuid, ${id}::uuid, ${treeId}::uuid, ${await sealFolderWrap(nk, f.fk, f.root, f.epoch, id, 1)})`;
  forgetShared(c);
  return id;
}
/** The shared notes this account is in and can open, once per call. A note whose key won't open
 *  here (a new key no device of theirs has opened yet, and no identity key to open it with) is left out. */
export async function sharedNotes(tx: Tx, c: Call, fresh = false): Promise<Shared[]> {
  const had = opened.get(c);
  if (had && !fresh) return had;
  await joinFolderNotes(tx, c);
  const folders = await sharedFolders(tx, c);
  const rows = await tx<Row[]>`
    select s.id, s.epoch, s.head_ct, s.owner_id, s.created_at, s.updated_at,
      (select max(u.created_at) from public.note_updates u where u.note_id = s.id) as last,
      m.role, m.epoch as member_epoch, m.self_wrap, m.key_wrap, m.wrapped_by, s.folder_root, s.folder_id
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
    const tree = r.folder_root ? folders.find((f) => f.root === r.folder_root) : undefined;
    out.push({
      ...(r.folder_root && r.folder_id ? { folder: { root: r.folder_root, treeId: r.folder_id, ...(tree?.local.get(r.folder_id) ? { localId: tree.local.get(r.folder_id) } : {}) } } : {}),
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
    if (hint === "not_member") throw new ToolError(`This person isn't in "${s.title}" anymore, so it can't be changed here.`);
    if (hint === "read_only") throw new ToolError(`"${s.title}" is view only for this person now, so it can't be changed here.`);
    if (hint === "stale_epoch") throw new ToolError(`Someone was removed from "${s.title}" and it has a new key. Open it once in Pinto Notes, then try again.`);
    throw e;
  }
  // The list's title and preview, sealed with NK as devices write them.
  const head = { title: titleOf(text), preview: previewOf(text) };
  await tx`update public.shared_notes set head_ct = ${await seal3("h", new TextEncoder().encode(JSON.stringify(head)) as Bytes, s.nk, s.id, s.epoch)} where id = ${s.id}::uuid`;
  // A snapshot covers what was loaded (`at.last`), never more: a change someone else committed
  // after the load has a smaller id than this one, isn't in this document, and compaction would
  // delete it. This change stays a change after the snapshot too; loading it twice changes nothing.
  if (at.since + 1 >= SNAPSHOT_EVERY && at.last > 0) {
    const saved = A.save(next);
    await tx`insert into public.note_snapshots (note_id, upto, epoch, ct)
      values (${s.id}::uuid, ${at.last}, ${s.epoch}, ${await seal3("s", saved as Bytes, s.nk, s.id, s.epoch, String(at.last))})
      on conflict (note_id, upto, epoch) do nothing`;
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
