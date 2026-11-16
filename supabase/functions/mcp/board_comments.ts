// Comments on a whiteboard (Pane/Collab/BoardComments.swift, 15 November 2026), as an AI reads and
// writes them through the file tools.
//
// They're kept beside the drawing, never in it: a board of the person's own keeps them in its page
// data (`collections.comments`), a shared board in its document (root map `comments`, each one's
// JSON under its id). Its data.json shows the open threads in `collections.comments`, readable:
//
//   { "id": "c-…", "by": "Sara", "created": "2026-11-15T09:12:00Z", "text": "…",
//     "on": "<element id>", "x": 1, "y": 0 }                     a thread (on a shape, or x and y on the board)
//   { "id": "c-…", "thread": "c-…", "by": "Emil's Claude", … }   a reply
//
// An AI adds a comment or a reply (a new entry: no id, or one that isn't there yet), and resolves
// a thread ("resolved": true). It never changes what someone wrote, and nothing is deleted by
// leaving it out. What it writes is the person's, and says which AI wrote it.
//
// People change and delete their own comments in the app (round 12): a change keeps the id with a
// higher version and "edited"; a deletion keeps only who and when ("deleted": true, no text). A
// deleted thread start with replies shows as { id, by, created, deleted: true }, so the replies
// still read in place; one without replies, and a deleted reply, aren't shown. "mentions" (account
// ids) is kept as it was written.
//
// On a shared board (Can comment, 18 November 2026) comments travel apart from the drawing, in the
// note's comment stream (note_comments): sealed entries `{"comments": [record, …]}`, each by one
// person (the server stamps who, and their role). `fold` reads them as every device does
// (BoardComments.fold in the app, foldComments in web/lib/board-doc.ts; the vectors in
// _shared/comment-vectors.json pin all three). An AI's comment keeps the ids of the elements the same
// write changed (`changes`), so Show change finds its change after the board is opened again.

export const MAX_TEXT = 5000;
/** A record's version past this is ignored: nobody can push a comment's version out of reach. */
export const MAX_VERSION = 1_000_000_000;
/** The most element ids an AI's comment keeps of its change. */
export const MAX_CHANGES = 200;
export const COLLECTION = "comments";

/** A comment as it's kept. */
export type Stored = {
  id: string; thread?: string; on?: string; x?: number; y?: number;
  by: string; name: string; ai?: string; text: string; created: string; resolved?: boolean; version?: number;
  edited?: string; deleted?: boolean; mentions?: string[];
  /** An AI's comment: the elements the write that added it changed (Show change). */
  changes?: string[];
};

/** A comment as data.json shows it. */
export type Shown = { id: string; thread?: string; on?: string; x?: number; y?: number; by: string; created: string; text?: string; edited?: string; deleted?: boolean };

/** Who's writing: the person's account, their first name, and their AI. */
export type Writer = { id: string; name: string; ai: string };

const str = (v: unknown, max: number): string | undefined => typeof v === "string" && v.length > 0 && v.length <= max ? v : undefined;
const num = (v: unknown): number | undefined => typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** A record as kept, checked (BoardComment.init?): anything malformed is left out. */
export function parseStored(r: unknown): Stored | null {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const o = r as Record<string, unknown>;
  const id = str(o.id, 200), by = str(o.by, 200), created = str(o.created, 64);
  const deleted = o.deleted === true;
  const text = deleted ? "" : typeof o.text === "string" && o.text.trim() && o.text.length <= MAX_TEXT ? o.text : undefined;
  if (!id || !by || !created || text === undefined) return null;
  const thread = str(o.thread, 200);
  const c: Stored = { id, by, name: str(o.name, 200) ?? "Someone", text, created, version: typeof o.version === "number" ? o.version : 1 };
  if (deleted) c.deleted = true;
  else {
    const edited = str(o.edited, 64);
    if (edited) c.edited = edited;
    const mentions = Array.isArray(o.mentions) ? o.mentions.filter((m): m is string => typeof m === "string" && m.length > 0 && m.length <= 200).slice(0, 50) : [];
    if (mentions.length) c.mentions = mentions;
    const changes = Array.isArray(o.changes) ? o.changes.filter((m): m is string => typeof m === "string" && m.length > 0 && m.length <= 200).slice(0, MAX_CHANGES) : [];
    if (changes.length) c.changes = changes;
  }
  if (thread) c.thread = thread;
  else {
    const on = str(o.on, 200);
    if (on) c.on = on;
    c.x = num(o.x) ?? 1;
    c.y = num(o.y) ?? 0;
    if (o.resolved === true) c.resolved = true;
  }
  const ai = str(o.ai, 80);
  if (ai) c.ai = ai;
  return c;
}

/** The record as it's kept: thread starts carry x and y, replies don't (BoardComment.record). */
export function record(c: Stored): Record<string, unknown> {
  const r: Record<string, unknown> = { id: c.id, by: c.by, name: c.name, created: c.created, version: c.version ?? 1 };
  if (c.deleted) r.deleted = true; else r.text = c.text;
  if (c.thread) r.thread = c.thread;
  else { r.x = c.x ?? 1; r.y = c.y ?? 0; }
  if (c.on) r.on = c.on;
  if (c.ai) r.ai = c.ai;
  if (c.resolved) r.resolved = true;
  if (c.edited && !c.deleted) r.edited = c.edited;
  if (c.mentions?.length && !c.deleted) r.mentions = c.mentions;
  if (c.changes?.length && !c.deleted) r.changes = c.changes;
  return r;
}

/** As the shared document keeps it: JSON with sorted keys. */
export const json = (c: Stored) => JSON.stringify(Object.fromEntries(Object.entries(record(c)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)));

/** The winner among values written for one comment at once (BoardComments.resolve): the higher
 *  version, then the lower JSON. */
export function resolveRaw(raws: string[]): Stored | null {
  let best: { raw: string; c: Stored } | null = null;
  for (const raw of [...raws].sort()) {
    let c: Stored | null = null;
    try { c = parseStored(JSON.parse(raw)); } catch { continue; }
    if (!c) continue;
    const v = c.version ?? 1, bv = best?.c.version ?? 1;
    if (best && !(v > bv || (v === bv && raw < best.raw))) continue;
    best = { raw, c };
  }
  return best?.c ?? null;
}

const order = (a: Stored, b: Stored) => a.created < b.created ? -1 : a.created > b.created ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** The threads, oldest first, with their replies oldest first (BoardComments.threads): a deleted
 *  reply goes, and a deleted thread start stays only while it has replies. */
export function threads(list: Stored[]) {
  const replies = new Map<string, Stored[]>();
  for (const c of list) if (c.thread && !c.deleted) replies.set(c.thread, [...(replies.get(c.thread) ?? []), c]);
  return list.filter((c) => !c.thread).sort(order)
    .map((first) => ({ first, replies: (replies.get(first.id) ?? []).sort(order) }))
    .filter((t) => !t.first.deleted || t.replies.length > 0);
}

/** Who wrote it, as anyone reading the board sees it: "Sara", "Sara's Claude". */
export const byline = (c: Stored) => c.ai ? `${c.name}'s ${c.ai}` : c.name;

/** The open threads and their replies, as data.json shows them. */
export function present(list: Stored[]): Shown[] {
  const out: Shown[] = [];
  for (const t of threads(list)) {
    if (t.first.resolved) continue;
    for (const c of [t.first, ...t.replies]) {
      const s: Shown = { id: c.id, ...(c.thread ? { thread: c.thread } : {}), by: byline(c), created: c.created };
      if (c.deleted) s.deleted = true; else s.text = c.text;
      if (c.edited) s.edited = c.edited;
      if (!c.thread) {
        if (c.on) s.on = c.on;
        s.x = c.x ?? 1;
        s.y = c.y ?? 0;
      }
      out.push(s);
    }
  }
  return out;
}

const newID = () => "c-" + crypto.randomUUID().replaceAll("-", "").slice(0, 16);

/**
 * What an AI's data.json asks of the comments: its new comments and replies, and threads it
 * resolved. `wanted` is `collections.comments` as it wrote it; `elements` the drawing's element ids
 * (a new thread on a shape must name one). Returns the records to keep (new, or changed), and what
 * it asked that couldn't be done.
 */
export function merge(stored: Stored[], wanted: unknown, who: Writer, elements: Set<string>, now = new Date(), changes: string[] = []): { changed: Stored[]; refused: string[] } {
  const changed: Stored[] = [], refused: string[] = [];
  if (wanted === undefined || wanted === null) return { changed, refused };
  if (!Array.isArray(wanted)) return { changed, refused: [`collections.${COLLECTION} must be a list of comments.`] };
  const byId = new Map(stored.map((c) => [c.id, c]));
  const made = new Map<string, Stored>();
  const created = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  for (const raw of wanted) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) { refused.push("A comment that isn't an object was left out."); continue; }
    const o = raw as Record<string, unknown>;
    const had = typeof o.id === "string" ? byId.get(o.id) : undefined;
    if (had) {
      // A thread resolved. What someone wrote stays as they wrote it.
      if (!had.thread && o.resolved === true && !had.resolved) {
        const c = { ...had, resolved: true, version: Math.min((had.version ?? 1) + 1, MAX_VERSION) };
        changed.push(c);
        byId.set(c.id, c);
      } else if (typeof o.text === "string" && o.text !== had.text && !(had.deleted && !o.text)) {
        refused.push(had.deleted ? `Comment ${had.id} was deleted by its writer: it stays deleted.` : `Comment ${had.id} is ${byline(had)}'s: its text stays as written. Reply to it instead.`);
      }
      continue;
    }
    const text = typeof o.text === "string" ? o.text.trim() : "";
    if (!text) { refused.push("A new comment without text was left out."); continue; }
    if (text.length > MAX_TEXT) { refused.push(`A comment is at most ${MAX_TEXT} characters; one was left out.`); continue; }
    const id = typeof o.id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(o.id) && !made.has(o.id) ? o.id : newID();
    const c: Stored = { id, by: who.id, name: who.name, ai: who.ai, text, created, version: 1 };
    if (typeof o.thread === "string" && o.thread) {
      const t = byId.get(o.thread) ?? made.get(o.thread);
      if (!t || t.thread) { refused.push(`A reply to ${o.thread} was left out: there's no thread with that id.`); continue; }
      if (t.deleted && !stored.some((r) => r.thread === t.id && !r.deleted)) { refused.push(`A reply to ${o.thread} was left out: that comment was deleted.`); continue; }
      c.thread = t.id;
    } else if (typeof o.on === "string" && o.on) {
      if (!elements.has(o.on)) { refused.push(`A comment on ${o.on} was left out: no element has that id.`); continue; }
      c.on = o.on;
      c.x = Math.min(1, Math.max(0, num(o.x) ?? 1));
      c.y = Math.min(1, Math.max(0, num(o.y) ?? 0));
    } else if (num(o.x) !== undefined && num(o.y) !== undefined) {
      c.x = num(o.x);
      c.y = num(o.y);
    } else {
      refused.push(`A new comment needs "on" (an element's id) or "x" and "y" (a spot on the board), or "thread" for a reply; "${text.slice(0, 40)}" was left out.`);
      continue;
    }
    if (o.resolved === true && !c.thread) c.resolved = true;
    // What this same write changed in the drawing: the comment speaks of it (Show change).
    if (changes.length) c.changes = changes.slice(0, MAX_CHANGES);
    made.set(c.id, c);
    changed.push(c);
  }
  return { changed, refused };
}

/** A board's data.json, with its comments as the AI sees them: `collections.comments` holds the
 *  open threads (left out when there are none). */
export function withShown<T extends { collections?: Record<string, unknown> }>(data: T, list: Stored[]): T {
  const shown = present(list);
  const collections = { ...(data.collections ?? {}) };
  delete collections[COLLECTION];
  if (shown.length) collections[COLLECTION] = shown;
  return { ...data, collections };
}

/** Whether page data is a whiteboard's: its drawing in values.scene. */
export function isBoardData(d: unknown): boolean {
  const scene = (d as { values?: { scene?: { elements?: unknown } } })?.values?.scene;
  return !!scene && typeof scene === "object" && Array.isArray(scene.elements);
}

/** The element ids of a board's data (for comments on shapes). */
export function elementIds(d: unknown): Set<string> {
  const els = (d as { values?: { scene?: { elements?: unknown[] } } })?.values?.scene?.elements;
  return new Set(Array.isArray(els) ? els.filter((e) => e && typeof e === "object" && !(e as { isDeleted?: boolean }).isDeleted).map((e) => String((e as { id?: unknown }).id)) : []);
}

/** A board of the person's own: its kept comments, from its page data. */
export function storedIn(d: { collections?: Record<string, unknown> }): Stored[] {
  const list = d.collections?.[COLLECTION];
  return Array.isArray(list) ? list.map(parseStored).filter((c): c is Stored => !!c) : [];
}

/** A board of the person's own: its page data with `changed` kept (each replaces its record, or is added). */
export function keepIn<T extends { collections?: Record<string, unknown> }>(d: T, changed: Stored[]): T {
  if (!changed.length) return d;
  const list = Array.isArray(d.collections?.[COLLECTION]) ? [...(d.collections![COLLECTION] as Record<string, unknown>[])] : [];
  for (const c of changed) {
    const i = list.findIndex((r) => r && r.id === c.id);
    if (i >= 0) list[i] = record(c); else list.push(record(c));
  }
  return { ...d, collections: { ...(d.collections ?? {}), [COLLECTION]: list } };
}

/** What a write said that wasn't done, for its answer. */
export const refusedLine = (refused: string[]) => refused.length ? { comments_left_out: refused.slice(0, 10) } : {};

/** What fetch says about the comments section. */
export const ABOUT = `collections.comments holds the board's open comments (resolved ones aren't shown): a thread is { id, by, created, text } with "on" (the element it's on; x and y say where on its box, 0 to 1) or x and y (a spot on the board); a reply has "thread" (its thread's id). "edited" says when its writer changed it; a thread start its writer deleted shows "deleted": true and no text, with its replies. Comments aren't part of the drawing. To comment, add an entry with text and "on" or x and y; to reply, add one with "thread" and text. It shows as this person's AI. Add "resolved": true to a thread to resolve it. What people wrote can't be changed, and leaving a comment out doesn't delete it.`;

// MARK: A shared board's comment stream

/** One entry of a shared board's comment stream, opened: who wrote it (the server's stamp, also in
 *  the seal's AAD), their role then, and what it holds. `moved`: the comments that were in the
 *  board's document (or under an older key), restated as they were by an owner's or editor's device. */
export type Entry = { author: string; role: string; moved?: boolean; comments: unknown[] };

/** An entry's JSON, opened, as kept: anything malformed holds nothing. */
export function entryOf(plain: string, author: string, role: string): Entry {
  try {
    const o = JSON.parse(plain);
    return { author, role, moved: o?.moved === true, comments: Array.isArray(o?.comments) ? o.comments.slice(0, 500) : [] };
  } catch {
    return { author, role, comments: [] };
  }
}

/** An entry as it's sealed. */
export const entryJSON = (comments: Stored[], moved = false) => JSON.stringify(moved ? { moved: true, comments: comments.map(record) } : { comments: comments.map(record) });

type Candidate = { c: Stored; trusted: boolean; own: boolean; order: number };
/** The higher version, then the later entry, then the later place in it. */
const beats = (a: Candidate, b: Candidate) => (a.c.version ?? 1) !== (b.c.version ?? 1) ? (a.c.version ?? 1) > (b.c.version ?? 1) : a.order > b.order;

/**
 * A shared board's comments, as every device reads them: `legacy`, the comments in its document's
 * old `comments` map (each id's values already resolved), then the stream's entries in the server's
 * order. Per comment id:
 *
 * - Its owner is the writer the first trusted record names (the old map, or a moved entry from an
 *   owner or editor), else the writer of the first entry that wrote it in their own name.
 * - Its words are the owner's record with the highest version (then the later one). Nobody else's
 *   record can change them: a record counts as words only from an entry its `by` wrote.
 * - Whether a thread is resolved is taken from everyone's records for it, the highest version (then
 *   the later one): anyone who may comment can resolve and reopen any thread.
 * - Its version is the highest anyone wrote for it, so the next write beats them all. A record with
 *   a version past MAX_VERSION is ignored.
 */
export function fold(legacy: Stored[], entries: Entry[]): Stored[] {
  const all = new Map<string, Candidate[]>();
  const add = (cand: Candidate) => all.set(cand.c.id, [...(all.get(cand.c.id) ?? []), cand]);
  let order = 0;
  for (const c of legacy) add({ c, trusted: true, own: true, order: order++ });
  for (const e of entries) {
    const author = e.author.toLowerCase();
    const trusts = e.moved === true && (e.role === "owner" || e.role === "editor");
    for (const raw of e.comments) {
      const c = parseStored(raw);
      const v = c?.version ?? 1;
      if (!c || v < 1 || v > MAX_VERSION || !Number.isInteger(v)) { order++; continue; }
      const own = trusts || c.by.toLowerCase() === author;
      // Someone else's reply says nothing anyone takes.
      if (own || !c.thread) add({ c, trusted: trusts, own, order });
      order++;
    }
  }
  const out: Stored[] = [];
  for (const list of all.values()) {
    const first = list.find((x) => x.trusted) ?? list.find((x) => x.own);
    if (!first) continue;
    const owner = first.c.by.toLowerCase();
    let words: Candidate | null = null;
    for (const x of list) if (x.own && x.c.by.toLowerCase() === owner && (!words || beats(x, words))) words = x;
    if (!words) continue;
    const c: Stored = { ...words.c, version: Math.max(...list.map((x) => x.c.version ?? 1)) };
    if (!c.thread) {
      let r: Candidate | null = null;
      for (const x of list) if (!x.c.thread && (!r || beats(x, r))) r = x;
      if (r?.c.resolved) c.resolved = true; else delete c.resolved;
    }
    out.push(c);
  }
  return out.sort(order_);
}
const order_ = (a: Stored, b: Stored) => a.created < b.created ? -1 : a.created > b.created ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Two folded comments say the same: words, place, writer, resolved, version. */
const same = (a: Stored, b: Stored) => JSON.stringify(record(a)) === JSON.stringify(record(b));

/**
 * What an owner's or editor's device restates in a moved entry: every comment that someone holding
 * only the note's current key, reading only the stream, wouldn't see as it is (`full`, everything
 * this device opened, the old map included, against `bare`, the stream's entries under the current
 * key alone). That moves the old map's comments into the stream, and carries comments over a new key.
 */
export function toRestate(full: Stored[], bare: Stored[]): Stored[] {
  const had = new Map(bare.map((c) => [c.id, c]));
  return full.filter((c) => { const b = had.get(c.id); return !b || !same(b, c); });
}
