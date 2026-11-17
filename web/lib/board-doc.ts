// A shared whiteboard's document, in the browser: the same rules as the app's
// (Pane/Collab/CollabBoard.swift and BoardComments.swift) and the MCP server's
// (supabase/functions/mcp/shared_notes.ts and board_comments.ts), so a board edited here, in the
// app and by an AI ends the same everywhere.
//
// The document is Automerge. Its root holds `body` (the board's title, as text), and beside it:
// - `board`: each element's id → the element as JSON with sorted keys, a scalar string. Two edits of
//   one element at once leave two values; every device keeps the same one: the higher `version`,
//   then the lower `versionNonce`, then the lower JSON.
// - `boardState`: the scene's `viewBackgroundColor` and `gridModeEnabled`.
// - `comments`: each comment's id → its record as JSON with sorted keys. Two devices that made the
//   map at once leave two maps: both are read. Since Can comment (18 November 2026) a board's
//   comments travel in their own stream (note_comments, `foldComments`); this map is read as its
//   first layer, and an owner's or editor's device moves it into the stream (`toRestate`).
// Each change's message is "u:<account id>" (CollabHistory.stamp), so the app's history says who.
import type * as AM from "@automerge/automerge/slim";

export type Automerge = typeof AM;
export type El = Record<string, unknown>;
// deno-lint-ignore no-explicit-any
export type BoardDoc = AM.Doc<any>;

// MARK: Elements

export type Stamp = { v: number; n: number };
export const stampOf = (e: El): Stamp => ({ v: typeof e.version === "number" ? e.version : 0, n: typeof e.versionNonce === "number" ? e.versionNonce : 0 });
/** Excalidraw's rule for two edits of one element: the newer, then the lower nonce. */
export const beats = (a: Stamp, b: Stamp) => a.v > b.v || (a.v === b.v && a.n < b.n);

/** One element's values in the document (one, or more after two people changed it at once), and the one kept. */
export type Entry = { raw: string[]; element: El; stamp: Stamp };

/** A scalar string as Automerge hands it back (an ImmutableString), or a plain one. */
export const scalar = (v: unknown): string | null =>
  typeof v === "string" ? v : v && typeof v === "object" && "val" in v && typeof (v as { val: unknown }).val === "string" ? (v as { val: string }).val : null;

/** JSON with every object's keys sorted, as the devices write elements and comments. */
export const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as El).sort().map((k) => [k, canon((v as El)[k])])) : v;
export const encode = (v: unknown) => JSON.stringify(canon(v));

const byBytes = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Whether the document is a whiteboard's: it holds a drawing. */
export const isBoard = (doc: BoardDoc) => !!doc && typeof doc.board === "object" && doc.board !== null && !Array.isArray(doc.board);

/** The winner among values written for one element at once (CollabBoard.resolve). */
export function resolve(raws: string[]): Entry | null {
  const sorted = [...raws].sort(byBytes);
  let best: { raw: string; e: El; st: Stamp } | null = null;
  for (const raw of sorted) {
    let e: unknown;
    try { e = JSON.parse(raw); } catch { continue; }
    if (!e || typeof e !== "object" || Array.isArray(e)) continue;
    const st = stampOf(e as El);
    if (best && !(beats(st, best.st) || (st.v === best.st.v && st.n === best.st.n && raw < best.raw))) continue;
    best = { raw, e: e as El, st };
  }
  return best ? { raw: sorted, element: best.e, stamp: best.st } : null;
}

/** Every element as the document holds it now, each conflict resolved. `reuse`: entries read before;
 *  one whose values haven't changed isn't decoded again. */
export function entries(A: Automerge, doc: BoardDoc, reuse: Map<string, Entry> = new Map()): Map<string, Entry> {
  const out = new Map<string, Entry>();
  const board = doc?.board;
  if (!board || typeof board !== "object") return out;
  for (const id of Object.keys(board)) {
    const all = A.getConflicts(board, id);
    const raw = (all ? Object.values(all) : [board[id]]).map(scalar).filter((x): x is string => x !== null).sort(byBytes);
    const had = reuse.get(id);
    if (had && had.raw.length === raw.length && had.raw.every((r, i) => r === raw[i])) { out.set(id, had); continue; }
    const e = resolve(raw);
    if (e) out.set(id, e);
  }
  return out;
}

/** The elements in drawing order: by Excalidraw's fractional `index`, then id (CollabBoard.ordered). */
export function ordered(list: Map<string, Entry>): El[] {
  return [...list.entries()].sort(([ka, a], [kb, b]) => {
    const x = typeof a.element.index === "string" ? a.element.index : null, y = typeof b.element.index === "string" ? b.element.index : null;
    if (x !== null && y !== null && x !== y) return byBytes(x, y);
    if (x !== null && y === null) return -1;
    if (x === null && y !== null) return 1;
    return byBytes(ka, kb);
  }).map(([, e]) => e.element);
}

export type Settings = { viewBackgroundColor?: string; gridModeEnabled?: boolean };
export const SETTINGS = ["viewBackgroundColor", "gridModeEnabled"] as const;

/** The scene's settings as the document has them. */
export function settingsOf(doc: BoardDoc): Settings {
  const st = doc?.boardState;
  if (!st || typeof st !== "object") return {};
  const out: Settings = {};
  const bg = scalar(st.viewBackgroundColor);
  if (bg !== null) out.viewBackgroundColor = bg;
  if (typeof st.gridModeEnabled === "boolean") out.gridModeEnabled = st.gridModeEnabled;
  return out;
}

/** A picture's file id, when the element is a picture with one (CollabBoard.Pictures.fileID). */
export function fileIdOf(e: El): string | null {
  return e.type === "image" && typeof e.fileId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(e.fileId) ? e.fileId : null;
}

/** The file ids the pictures in use show (not deleted ones). */
export function inUse(elements: El[]): Set<string> {
  const out = new Set<string>();
  for (const e of elements) { if (e.isDeleted === true) continue; const id = fileIdOf(e); if (id) out.add(id); }
  return out;
}

export type Picture = { id: string; dataURL: string; mimeType: string; created: number };

/** The whole scene, as a board's data keeps it, with the pictures in use from `files` (CollabBoard.scene). */
export function scene(elements: El[], settings: Settings, files: Map<string, Picture> = new Map()) {
  const used = inUse(elements);
  const shown: Record<string, Picture> = {};
  for (const [id, f] of files) if (used.has(id)) shown[id] = f;
  return {
    type: "excalidraw", version: 2, source: "https://pintonotes.com", elements,
    appState: { viewBackgroundColor: "#ffffff", ...settings }, files: shown,
  };
}

const elementId = (e: El): string | null => typeof e.id === "string" && e.id.length > 0 && new TextEncoder().encode(e.id).length <= 200 ? e.id : null;
/** A picture goes in with the id of the file it shows; every other element as it is (CollabBoard.keeps). */
export const keeps = (e: El) => e.type !== "image" || fileIdOf(e) !== null;

/** What of `elements` (what the page says changed) the document takes: each element that wins over
 *  the document's copy (CollabBoard.winners). */
export function winners(elements: El[], current: Map<string, Entry>): [string, El][] {
  const out: [string, El][] = [];
  for (const e of elements) {
    if (!e || typeof e !== "object") continue;
    const id = elementId(e);
    if (!id || !keeps(e)) continue;
    const had = current.get(id);
    if (had && !beats(stampOf(e), had.stamp)) continue;
    out.push([id, e]);
  }
  return out;
}

/** The ids of elements that differ between two drawings (added, changed or deleted). */
export function changedIDs(before: Map<string, Entry>, after: Map<string, Entry>): string[] {
  const out: string[] = [];
  for (const [id, e] of after) {
    const was = before.get(id);
    if (!was) { if (e.element.isDeleted !== true) out.push(id); continue; }
    if (was.raw.length !== e.raw.length || was.raw.some((r, i) => r !== e.raw[i])) out.push(id);
  }
  return out.sort(byBytes);
}

// MARK: Comments (BoardComments.swift)

export const MAX_COMMENT = 5000;
/** An AI's pin and avatar: neutral graphite, never the accent; a light grey on a dark board (BoardComments.aiColor). */
export const AI_COLOR = "#48484A";
export const AI_DARK = "#D1D1D6";
/** What's shown for a deleted comment. */
export const DELETED_TEXT = "Comment deleted";

export type Comment = {
  id: string; thread?: string; on?: string; x: number; y: number;
  by: string; name: string; ai?: string; text: string; created: string; resolved: boolean; version: number;
  /** When its writer last changed it. */
  edited?: string;
  /** Deleted by its writer: no text kept. */
  deleted?: boolean;
  /** The people it mentions, by account id. */
  mentions?: string[];
  /** An AI's comment: the elements the write that added it changed (Show change). */
  changes?: string[];
};

/** The highest version a record may have; above it, it's ignored, and a write never goes past it. */
export const MAX_VERSION = 1_000_000_000;
/** The version a change of `c` takes: past everyone's, never past MAX_VERSION (a tie goes to the later write). */
export const nextVersion = (c: Comment) => Math.min(c.version + 1, MAX_VERSION);

/** A record as kept, checked (BoardComment.init?): anything malformed is left out. */
export function parseComment(r: unknown): Comment | null {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const o = r as El;
  const str = (k: string, max: number) => (typeof o[k] === "string" && (o[k] as string).length > 0 && [...(o[k] as string)].length <= max ? o[k] as string : undefined);
  const id = str("id", 200), by = str("by", 200), created = str("created", 64);
  const deleted = o.deleted === true;
  const text = deleted ? "" : typeof o.text === "string" && o.text.trim() && [...o.text].length <= MAX_COMMENT ? o.text : undefined;
  if (!id || !by || !created || text === undefined) return null;
  const thread = str("thread", 200);
  const num = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k]) ? o[k] as number : undefined);
  const c: Comment = {
    id, by, text, created, name: str("name", 200) ?? "Someone", x: num("x") ?? 1, y: num("y") ?? 0,
    resolved: !thread && o.resolved === true, version: typeof o.version === "number" ? Math.trunc(o.version) : 1,
  };
  if (thread) c.thread = thread;
  else { const on = str("on", 200); if (on) c.on = on; }
  const ai = str("ai", 80);
  if (ai) c.ai = ai;
  if (deleted) c.deleted = true;
  else {
    const edited = str("edited", 64);
    if (edited) c.edited = edited;
    const m = Array.isArray(o.mentions) ? o.mentions.filter((x): x is string => typeof x === "string" && x.length > 0 && [...x].length <= 200).slice(0, 50) : [];
    if (m.length) c.mentions = m;
    const ch = Array.isArray(o.changes) ? o.changes.filter((x): x is string => typeof x === "string" && x.length > 0 && [...x].length <= 200).slice(0, 200) : [];
    if (ch.length) c.changes = ch;
  }
  return c;
}

/** The record as it's kept: thread starts carry x and y, replies don't (BoardComment.record). */
export function commentRecord(c: Comment): El {
  const r: El = { id: c.id, by: c.by, name: c.name, created: c.created, version: c.version };
  if (c.deleted) r.deleted = true; else r.text = c.text;
  if (c.thread) r.thread = c.thread; else { r.x = c.x; r.y = c.y; }
  if (c.on) r.on = c.on;
  if (c.ai) r.ai = c.ai;
  if (c.resolved) r.resolved = true;
  if (c.edited && !c.deleted) r.edited = c.edited;
  if (c.mentions?.length && !c.deleted) r.mentions = c.mentions;
  if (c.changes?.length && !c.deleted) r.changes = c.changes;
  return r;
}
export const commentJSON = (c: Comment) => encode(commentRecord(c));

// MARK: The comment stream (BoardComments.fold, board_comments.ts fold)

/** One entry of a shared board's comment stream, opened: its author and their role (the server's
 *  stamps), and the records it holds. `moved`: comments restated by an owner's or editor's device. */
export type CommentEntry = { author: string; role: string; moved?: boolean; comments: unknown[] };

/** An entry's JSON, opened: anything malformed holds nothing. */
export function entryOf(plain: string, author: string, role: string): CommentEntry {
  try {
    const o = JSON.parse(plain);
    return { author, role, moved: o?.moved === true, comments: Array.isArray(o?.comments) ? o.comments.slice(0, 500) : [] };
  } catch {
    return { author, role, comments: [] };
  }
}

/** An entry as it's sealed. */
export const entryJSON = (comments: Comment[], moved = false) =>
  encode(moved ? { moved: true, comments: comments.map(commentRecord) } : { comments: comments.map(commentRecord) });

type Candidate = { c: Comment; trusted: boolean; own: boolean; order: number };
const wins = (a: Candidate, b: Candidate) => a.c.version !== b.c.version ? a.c.version > b.c.version : a.order > b.order;
const versionOf = (raw: unknown): number | null => {
  const v = raw && typeof raw === "object" ? (raw as El).version : undefined;
  if (typeof v !== "number") return 1;
  return Number.isInteger(v) && v >= 1 && v <= MAX_VERSION ? v : null;
};

/**
 * A shared board's comments, as every device reads them: `legacy`, the document's old map
 * (readComments), then the stream's entries in the server's order. Per comment id: its owner is the
 * writer the first trusted record names (the old map, or a moved entry from an owner or editor),
 * else the writer of the first entry that wrote it in their own name; its words are the owner's
 * record with the highest version (then the later one); whether a thread is resolved comes from
 * everyone's records for it the same way; its version is the highest anyone wrote. Pinned to the
 * app's and the MCP server's by supabase/functions/_shared/comment-vectors.json.
 */
export function foldComments(legacy: Comment[], entries: CommentEntry[]): Comment[] {
  const all = new Map<string, Candidate[]>();
  const add = (x: Candidate) => all.set(x.c.id, [...(all.get(x.c.id) ?? []), x]);
  let order = 0;
  for (const c of legacy) add({ c, trusted: true, own: true, order: order++ });
  for (const e of entries) {
    const author = e.author.toLowerCase();
    const trusts = e.moved === true && (e.role === "owner" || e.role === "editor");
    for (const raw of e.comments) {
      const v = versionOf(raw), c = v === null ? null : parseComment(raw);
      if (!c || v === null) { order++; continue; }
      c.version = v;
      const own = trusts || c.by.toLowerCase() === author;
      if (own || !c.thread) add({ c, trusted: trusts, own, order });
      order++;
    }
  }
  const out: Comment[] = [];
  for (const list of all.values()) {
    const first = list.find((x) => x.trusted) ?? list.find((x) => x.own);
    if (!first) continue;
    const owner = first.c.by.toLowerCase();
    let words: Candidate | null = null;
    for (const x of list) if (x.own && x.c.by.toLowerCase() === owner && (!words || wins(x, words))) words = x;
    if (!words) continue;
    const c: Comment = { ...words.c, version: Math.max(...list.map((x) => x.c.version)) };
    if (!c.thread) {
      let r: Candidate | null = null;
      for (const x of list) if (!x.c.thread && (!r || wins(x, r))) r = x;
      c.resolved = r?.c.resolved === true;
    }
    out.push(c);
  }
  return out.sort(commentOrder);
}

/** What an owner's or editor's device restates in a moved entry: what someone reading only the
 *  stream under the current key (`bare`) wouldn't see as everything it opened shows it (`full`). */
export function toRestate(full: Comment[], bare: Comment[]): Comment[] {
  const had = new Map(bare.map((c) => [c.id, commentJSON(c)]));
  return full.filter((c) => had.get(c.id) !== commentJSON(c));
}

/** Entries of at most about 45 KB of JSON each: sealed, each stays under the server's 64 KB. */
export function commentEntries(comments: Comment[], moved = false): string[] {
  const out: string[] = [];
  let part: Comment[] = [], size = 0;
  for (const c of comments) {
    const n = commentJSON(c).length + 1;
    if (part.length && (size + n > 45_000 || part.length >= 400)) { out.push(entryJSON(part, moved)); part = []; size = 0; }
    part.push(c);
    size += n;
  }
  if (part.length) out.push(entryJSON(part, moved));
  return out;
}

/** The winner among values written for one comment at once: the higher version, then the lower JSON. */
export function resolveComment(raws: string[]): Comment | null {
  let best: { raw: string; c: Comment } | null = null;
  for (const raw of raws) {
    let c: Comment | null = null;
    try { c = parseComment(JSON.parse(raw)); } catch { continue; }
    if (!c) continue;
    if (best && !(c.version > best.c.version || (c.version === best.c.version && raw < best.raw))) continue;
    best = { raw, c };
  }
  return best?.c ?? null;
}

const commentOrder = (a: Comment, b: Comment) => byBytes(a.created, b.created) || byBytes(a.id, b.id);

/** The document's comments from every `comments` map, each conflict resolved, oldest first. */
export function readComments(A: Automerge, doc: BoardDoc): Comment[] {
  if (!doc) return [];
  const all = A.getConflicts(doc, "comments");
  const maps = (all ? Object.values(all) : [doc.comments]).filter((m): m is El => !!m && typeof m === "object" && !Array.isArray(m) && !("val" in (m as object)));
  const raws = new Map<string, Set<string>>();
  for (const m of maps) {
    for (const id of Object.keys(m)) {
      const values = A.getConflicts(m, id);
      for (const v of values ? Object.values(values) : [m[id]]) {
        const s = scalar(v);
        if (s !== null) raws.set(id, (raws.get(id) ?? new Set()).add(s));
      }
    }
  }
  const out: Comment[] = [];
  for (const [id, r] of raws) {
    const c = resolveComment([...r].sort(byBytes));
    if (c && c.id === id) out.push(c);
  }
  return out.sort(commentOrder);
}

export type Thread = { first: Comment; replies: Comment[] };

/** The threads, oldest first, each with its replies oldest first. A reply whose thread isn't here
 *  waits. A deleted reply goes; a deleted thread start stays (as "Comment deleted") only while it
 *  has replies (BoardComments.threads). */
export function threads(list: Comment[]): Thread[] {
  const replies = new Map<string, Comment[]>();
  for (const c of list) if (c.thread && !c.deleted) replies.set(c.thread, [...(replies.get(c.thread) ?? []), c]);
  return list.filter((c) => !c.thread).sort(commentOrder).flatMap((first) => {
    const r = (replies.get(first.id) ?? []).sort(commentOrder);
    return first.deleted && !r.length ? [] : [{ first, replies: r }];
  });
}

// MARK: Mentions (BoardComments.mentionQuery and the rest)

export type Person = { id: string; name: string };

const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** The word being typed when it's a mention: "@Sa" at the end, after a space or at the start. */
export function mentionQuery(text: string): { at: number; query: string } | null {
  const at = text.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(text[at - 1])) return null;
  const query = text.slice(at + 1);
  if ([...query].length > 30 || /\s/.test(query)) return null;
  return { at, query };
}

/** The people whose name starts with what's typed after the @ (case and accents ignored). */
export const suggestions = (query: string, people: Person[]) => {
  const q = fold(query);
  return people.filter((p) => !q || fold(p.name).startsWith(q));
};

/** The text with the mention being typed made whole: "@Sara " in place of "@Sa". */
export function complete(text: string, p: Person): string {
  const m = mentionQuery(text);
  return m ? text.slice(0, m.at) + `@${p.name} ` : text;
}

/** Where "@Name" stands in the text as a word (not inside "@Name2" or an email address). */
export function mentionRanges(name: string, text: string): [number, number][] {
  if (!name) return [];
  const out: [number, number][] = [];
  const hay = text.toLowerCase(), needle = ("@" + name).toLowerCase();
  let from = 0;
  for (;;) {
    const i = hay.indexOf(needle, from);
    if (i < 0) break;
    const end = i + needle.length;
    if (!isWordChar(text[i - 1]) && !isWordChar(text[end])) out.push([i, end]);
    from = end;
  }
  return out;
}

/** The people a comment mentions: each whose "@Name" stands in it as a word. */
export function mentioned(text: string, people: Person[]): string[] {
  const out: string[] = [];
  for (const p of people) if (!out.includes(p.id) && mentionRanges(p.name, text).length) out.push(p.id);
  return out;
}

/** A new comment's id: "c-" and 16 hex digits (BoardComments.newID). */
export const newCommentID = () => "c-" + crypto.randomUUID().replaceAll("-", "").slice(0, 16);
/** When it was written, as the app stamps it: ISO 8601 to the second, in UTC. */
export const commentStamp = (d = new Date()) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

/** Who wrote it: "Sara", "Claude" (your own AI), "Sara's Claude" (BoardComments.byline). */
export function byline(c: Comment, me: string | null): string {
  if (!c.ai) return c.name;
  return me && c.by.toLowerCase() === me.toLowerCase() ? c.ai : `${c.name}'s ${c.ai}`;
}

/** When it was written, as Notes and Messages say it: "Now", "12 min ago", "09:14", "Yesterday", "12 Nov". */
export function when(c: Comment, now = new Date()): string {
  const d = new Date(c.created);
  if (Number.isNaN(+d)) return "";
  const secs = (+now - +d) / 1000;
  if (secs < 60) return "Now";
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  const day = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (day(d) === day(now)) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (day(d) === day(y)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** The letter on a pin and an avatar. */
export const initial = (c: Comment) => ((c.ai ?? c.name).trim()[0] ?? "?").toUpperCase();

/** The first word of a name ("Emil Wagman" is Emil), or "You" with none. */
export function firstName(full: string | null | undefined): string {
  const first = (full ?? "").trim().split(/\s+/)[0] ?? "";
  return !first || first === "Someone" ? "You" : first;
}

// MARK: People's colours (CollabSession.palette)

/** Green, teal, blue, indigo, violet and pink: a light shade (on white) and a dark one (on black). */
export const PALETTE: [string, string][] = [
  ["#2D6E36", "#368340"], ["#186B70", "#1C8086"], ["#2D639A", "#3677B9"],
  ["#5252C5", "#6868CD"], ["#8841AC", "#9C56BF"], ["#A43777", "#C1448D"],
];
export const STALE: [string, string] = ["#8E8E93", "#8E8E93"];

/** The colour an account id picks (CollabSession.paletteIndex, over the id as the app writes it, upper case). */
export function paletteIndex(user: string): number {
  let h = 7;
  for (const ch of user.toUpperCase()) h = (Math.imul(h, 31) + ch.codePointAt(0)!) >>> 0;
  return h % PALETTE.length;
}

/** Everyone's colour in one board, so no two share one: the owner first, then the others as they joined. */
export function slots(members: string[]): Map<string, number> {
  const out = new Map<string, number>(), taken = new Set<number>();
  for (const raw of members) {
    const id = raw.toLowerCase();
    if (out.has(id) || taken.size >= PALETTE.length) continue;
    const own = paletteIndex(id);
    let slot = own;
    for (let i = 0; i < PALETTE.length; i++) { const s = (own + i) % PALETTE.length; if (!taken.has(s)) { slot = s; break; } }
    out.set(id, slot);
    taken.add(slot);
  }
  return out;
}

/** A colour's dark-mode shade, as the palette pairs them; an AI's graphite goes light grey. */
export const darkOf = (color: string) => color.toUpperCase() === AI_COLOR ? AI_DARK : PALETTE.find(([light]) => light === color.toUpperCase())?.[1];

// MARK: Writing

export type LocalChange = {
  elements?: [string, El][];
  settings?: Settings;
  comments?: Comment[];
};

/**
 * The document with `change` in it, as one Automerge change by `me` (stamped "u:<ID>" as the app's
 * are), and that change's bytes; nothing when nothing changes. Elements and comments go in as scalar
 * strings, as every device writes them (a plain string would be collaborative text).
 */
export function put(A: Automerge, doc: BoardDoc, change: LocalChange, me: string, at = new Date()): { doc: BoardDoc; bytes: Uint8Array | null } {
  const elements = change.elements ?? [], comments = change.comments ?? [];
  const now = settingsOf(doc);
  const settings = SETTINGS.flatMap((k) => {
    const v = change.settings?.[k];
    return v !== undefined && v !== now[k] && (typeof v === "string" || typeof v === "boolean") ? [[k, v] as const] : [];
  });
  if (!elements.length && !settings.length && !comments.length) return { doc, bytes: null };
  const next = A.change(doc, { message: `u:${me.toUpperCase()}`, time: Math.floor(+at / 1000) }, (d) => {
    if (elements.length) {
      if (!d.board) d.board = {};
      for (const [id, e] of elements) d.board[id] = new A.ImmutableString(encode(e));
    }
    if (settings.length) {
      if (!d.boardState) d.boardState = {};
      for (const [k, v] of settings) d.boardState[k] = typeof v === "string" ? new A.ImmutableString(v) : v;
    }
    if (comments.length) {
      if (!d.comments) d.comments = {};
      for (const c of comments) d.comments[c.id] = new A.ImmutableString(commentJSON(c));
    }
  });
  return { doc: next, bytes: A.getLastLocalChange(next) ?? null };
}
