// A shared whiteboard open in a browser: what the app's CollabSession does for a board
// (Pane/Collab/CollabSession.swift), for the page at /s/<id> (BoardPage.tsx).
//
// - The document: the newest snapshot and every change after it, from the server, opened with the
//   note key; then each change as it comes (relayed live to a member, or pulled every 2 seconds by
//   a viewer who isn't signed in). A pull every 20 seconds catches anything the relay lost.
// - What you draw (a member who can edit): each element that wins over the document's copy goes in
//   as one Automerge change, sealed under the note key with you as its author (`amb3u`), and up.
//   Changes wait in order and go again when the connection comes back. A snapshot goes up after
//   200 changes and 5 quiet seconds, so the document stays quick to open.
// - Pictures: fetched by file id and opened (`amb3f`), and given to the board with the drawing.
//   One you add goes up sealed before the change that shows it, while the board's pictures in use
//   fit in 4 MB.
// - Presence (a member): your pointer and selection, sealed (`amb3p`), at most ten times a second
//   while they move and every 2 seconds; the others' come back the same way and are drawn in each
//   person's colour, grey once nothing is heard from them for 6 seconds.
// - Comments: their own sealed stream (`amb3c`, note_comments; collaboration-design.md section 8),
//   so someone who can only comment can still write them. Every entry after the page's cursor is
//   pulled with the document, and a member's arrive live. The comments shown are the document's
//   old map and the stream, folded as the app folds them (board-doc.ts foldComments). Yours wait in
//   order and go up as entries; an owner's or editor's page moves into the stream what isn't there
//   yet (the old map, or comments under an older key).
import { dotsOf, sessionOf, type Dots, type TeamSession } from "./board-team";
import type { Bytes } from "./e2ee";
import { open3, pictureBytes, pictureOf, seal3 } from "./collab";
import { type BoardPerson, MOST_LASER_POINTS, type Presenting, pointsOf, presentingOf, type View, viewOf } from "./board-follow";
import {
  type Automerge, type BoardDoc, changedIDs, type Comment, darkOf, type El, type Entry, entries, fileIdOf, firstName, inUse, isBoard, ordered,
  commentEntries, type CommentEntry, entryOf, foldComments, PALETTE, paletteIndex, type Picture, put, readComments, scene, type Settings, settingsOf,
  slots, STALE, toRestate, winners,
} from "./board-doc";

export type Update = { id: number; author_id: string; epoch: number; ct: string; client?: string | null };
export type Snapshot = { upto: number; epoch: number; ct: string };
export type Pull = { snapshot: Snapshot | null; updates: Update[] };
/** One entry of the comment stream, as the server keeps it: its writer and their role are its stamps. */
export type CommentRow = { id: number; author_id: string; role: string; epoch: number; ct: string; client?: string | null };
export type Member = { user_id: string; role: string; display_name: string | null; public_key?: string | null; accepted?: boolean };

/** What the page's session needs from the server. A viewer who isn't signed in has only the first two. */
export interface Transport {
  /** The newest snapshot past `after` (any, for 0) and every change after it, oldest first. */
  pull(after: number): Promise<Pull>;
  /** One picture's sealed bytes, or null when the server doesn't have it (yet). */
  file(id: string): Promise<{ epoch: number; ct: string } | null>;
  send?(ct: string, epoch: number): Promise<Update>;
  snapshot?(ct: string, upto: number, epoch: number): Promise<void>;
  putFile?(id: string, epoch: number, ct: string): Promise<void>;
  members?(): Promise<Member[]>;
  /** The comment stream's entries after `after`, oldest first. */
  comments?(after: number): Promise<CommentRow[]>;
  /** One entry of yours into the comment stream (a member who may comment). */
  sendComment?(ct: string, epoch: number): Promise<CommentRow>;
  /** The note's live channel, or null when it can't join (not a member). */
  live?(events: LiveEvents): Promise<Live | null>;
}

export type LiveEvents = {
  update(u: Update): void;
  /** An entry of the comment stream, as it's stored. */
  comment?(row: CommentRow): void;
  presence(user: string, ct: string): void;
  leave(user: string): void;
  members(): void;
  /** Changes are relayed (again): anything stored meanwhile is pulled. */
  relaying(): void;
  /** The server isn't relaying changes: pulled every 2 seconds until it does. */
  notRelaying(why: string): void;
};
export type Live = { presence(ct: string): void; members?(): void; close(): void };

/** Someone else on the board, as the page draws them (BoardPeer.payload). */
export type Scene = ReturnType<typeof scene>;

export type BoardPeer = { id: string; name: string; color: string; dark: string; sel: string[]; flag: boolean; x?: number; y?: number };

type Peer = {
  id: string; name: string; pointer: [number, number] | null; sel: string[]; movedAt: number; heardAt: number;
  /** Following (board-follow.ts): what they present, what they see, whose view they follow. */
  presenting: Presenting | null; view: View | null; following: string | null;
};

export type Clock = { now(): number; every(ms: number, fn: () => void): () => void; after(ms: number, fn: () => void): () => void };
const realClock: Clock = {
  now: () => Date.now(),
  every: (ms, fn) => { const t = setInterval(fn, ms); return () => clearInterval(t); },
  after: (ms, fn) => { const t = setTimeout(fn, ms); return () => clearTimeout(t); },
};

export type SessionOptions = {
  A: Automerge;
  note: string;
  epoch: number;
  nk: Bytes;
  transport: Transport;
  /** The signed-in account (null: a viewer who isn't signed in). */
  me: string | null;
  /** Your name as others see it. */
  name: string;
  /** You can change the board (an editor or the owner, signed in). */
  canWrite: boolean;
  /** Your role on the board, a member's: your entries waiting to go are folded as the server will stamp them. */
  role?: string | null;
  /** You can comment (Can comment, or you can edit). Without it, as `canWrite`. */
  canComment?: boolean;
  clock?: Clock;
};

export type Status = "loading" | "live" | "offline" | "gone" | "removed" | "keyChanged";

export const MAX_UPDATE = 262_144;
export const MAX_SNAPSHOT = 4_194_304;
export const SNAPSHOT_EVERY = 200;
export const PICTURES_IN_USE = 4 * 1024 * 1024;
export const STALE_AFTER = 6000;
export const FLAG_FOR = 3000;
export const POINTER_EVERY = 100;
/** A few ids before the cursor are asked for again: a change committed late can have a lower id. */
export const REWIND = 64;
export const TOO_BIG = "This picture doesn’t fit: a whiteboard’s pictures can be 4 MB in all";
export const NOT_THERE = "This picture didn’t reach the board. Try adding it again.";
export const COMMENTS_FULL = "This whiteboard has no room for more comments.";
/** An entry sealed can be 64 KB: the server's limit. */
export const MAX_COMMENT_ENTRY = 65_536;

type Kept = { id: number; author: string; role: string; epoch: number; ct: string; entry: CommentEntry | null };

export class BoardSession {
  readonly A: Automerge;
  readonly note: string;
  epoch: number;
  private nk: Bytes;
  private keys = new Map<number, Bytes>();
  readonly transport: Transport;
  readonly me: string | null;
  name: string;
  canWrite: boolean;
  canComment: boolean;
  role: string | null;
  private clock: Clock;

  doc: BoardDoc;
  /** The last change every pull has had, in order: the next pull starts after it. */
  cursor = 0;
  snapshotUpto = 0;
  sinceSnapshot = 0;
  private applied = new Set<number>();
  board = new Map<string, Entry>();
  settings: Settings = {};
  comments: Comment[] = [];
  pictures = new Map<string, Picture>();
  private fetching = new Set<string>();
  private missingPictures = new Set<string>();
  members: Member[] = [];
  private peers = new Map<string, Peer>();
  status: Status = "loading";

  /** The comment stream as this page has it, in the server's order (opened when its key is here). */
  private stream: Kept[] = [];
  private streamIDs = new Set<number>();
  /** The newest entry a pull of the stream has had. */
  commentCursor = 0;
  private commentsPulled = false;
  /** Your comment entries (JSON), not yet stored, oldest first. */
  private pendingComments: string[] = [];
  private sendingComments: Promise<void> | null = null;
  private commentRetry: (() => void) | null = null;
  private commentDelay = 2000;
  /** One of your comments couldn't go (the board is full of them): why. */
  onCommentsRefused: ((why: string) => void) | null = null;

  /** Changes made here, not yet stored by the server, oldest first. */
  private pending: Uint8Array[] = [];
  private sending: Promise<void> | null = null;
  private pulling: Promise<void> | null = null;
  private pullAgain = false;
  private live: Live | null = null;
  private relayed = false;
  private stops: (() => void)[] = [];
  private snapshotTimer: (() => void) | null = null;
  private pointerTimer: (() => void) | null = null;
  private flagTimer: (() => void) | null = null;
  private pointerSentAt = 0;
  /** Beats are sealed one after another and read one after another: two at once can finish in
   *  either order, and an older beat read last undoes the newer one until the next. */
  private beatsOut: Promise<void> = Promise.resolve();
  private beatsIn: Promise<void> = Promise.resolve();
  private myPointer: [number, number] | null = null;
  private mySelection: string[] = [];
  private myPresenting: Presenting | null = null;
  private myView: View | null = null;
  private myLaserOn = false;
  private myLaser: [number, number][] = [];
  private myFollow: string | null = null;
  private closed = false;

  /** The whole drawing, whenever it changed from outside (another person, an AI) or a picture came. */
  onScene: ((scene: Scene) => void) | null = null;
  onPeers: ((peers: BoardPeer[]) => void) | null = null;
  /** Everyone else on the board, for following them (board-follow.ts). */
  onPeople: ((people: BoardPerson[]) => void) | null = null;
  /** Someone's laser trail since their last beat (board coordinates). */
  onLaser: ((id: string, points: [number, number][]) => void) | null = null;
  onComments: ((comments: Comment[]) => void) | null = null;
  onStatus: ((s: Status) => void) | null = null;
  /** Elements whose pictures couldn't go on the board, and why. */
  onRefused: ((ids: string[], why: string) => void) | null = null;
  /** What an AI just changed: its name and the ids. */
  onAI: ((by: string, ids: string[]) => void) | null = null;
  /** The board's people, when they're read (at the start, and when someone joins or leaves). */
  onMembers: ((members: Member[]) => void) | null = null;
  /** The board's key changed (someone was removed): the page opens the new one. */
  onKeyChanged: (() => void) | null = null;

  constructor(o: SessionOptions) {
    this.A = o.A;
    this.note = o.note.toLowerCase();
    this.epoch = o.epoch;
    this.nk = o.nk;
    this.keys.set(o.epoch, o.nk);
    this.transport = o.transport;
    this.me = o.me?.toLowerCase() ?? null;
    this.name = o.name;
    this.canWrite = o.canWrite && !!o.me && !!o.transport.send;
    this.canComment = (o.canComment ?? o.canWrite) && !!o.me && !!o.transport.sendComment;
    this.role = o.role ?? (this.canWrite ? "editor" : this.canComment ? "commenter" : null);
    this.clock = o.clock ?? realClock;
    this.doc = this.A.init();
  }

  private setStatus(s: Status) {
    if (this.status === s) return;
    this.status = s;
    this.onStatus?.(s);
  }

  /** A new key (after someone was removed): changes from here on are sealed with it. */
  rekey(nk: Bytes, epoch: number) {
    this.keys.set(epoch, nk);
    if (epoch >= this.epoch) { this.nk = nk; this.epoch = epoch; }
    if (this.status === "keyChanged") this.setStatus("live");
    void this.openStream();
    void this.flush();
    void this.flushComments();
    void this.catchUp();
  }

  // MARK: Opening

  /** The document from the server, then live: the relay for a member, pulls every 2 s otherwise. */
  async start(): Promise<void> {
    await this.catchUp(false);
    if (this.closed) return;
    if (this.transport.members) void this.refreshMembers();
    if (this.transport.live && this.me) {
      this.live = await this.transport.live({
        update: (u) => this.receive(u),
        comment: (row) => void this.receiveComment(row),
        presence: (user, ct) => { this.beatsIn = this.beatsIn.then(() => this.presenceIn(user, ct)).catch(() => {}); },
        leave: (user) => { if (this.peers.delete(user.toLowerCase())) { this.sendPeers(); this.onPeople?.(this.boardPeople()); } this.onLeft?.(user.toLowerCase()); void this.refreshMembers(); },
        members: () => void this.refreshMembers(),
        relaying: () => { this.relayed = true; void this.catchUp(); void this.flush(); void this.flushComments(); },
        notRelaying: () => { this.relayed = false; },
      }).catch(() => null);
      if (this.closed) { this.live?.close(); return; }
      if (this.live) this.sendPresence();
    }
    let ticks = 0;
    this.stops.push(this.clock.every(2000, () => {
      ticks++;
      if (this.live) {
        this.sendPresence();
        this.sendPeers();
        this.onPeople?.(this.boardPeople());
        if (ticks % 10 === 0) void this.catchUp();
        else if (!this.relayed) void this.catchUp(false);
      } else if (!this.hidden() || ticks % 15 === 0) void this.catchUp(ticks % 10 === 0);
    }));
  }

  /** The page is out of sight: a viewer pulls every 30 s then, not every 2. */
  hidden: () => boolean = () => false;

  close() {
    this.closed = true;
    for (const s of this.stops) s();
    this.stops = [];
    this.snapshotTimer?.();
    this.pointerTimer?.();
    this.flagTimer?.();
    this.commentRetry?.();
    this.live?.close();
    this.live = null;
  }

  get isBoard() { return isBoard(this.doc); }
  /** Nothing in the document yet (shared a moment ago, its first change still on its way). */
  get isEmpty() { return this.A.getHeads(this.doc).length === 0; }

  /** Tells the others' devices the board's people changed (you just joined): they read them again. */
  announceMembers() { this.live?.members?.(); }

  async refreshMembers() {
    if (!this.transport.members) return;
    try { this.members = await this.transport.members(); this.sendPeers(); this.onMembers?.(this.members); } catch { /* the next beat */ }
  }

  // MARK: Taking changes in

  /** Takes in every change the server has after the cursor. One at a time; asked again while running, it runs once more. */
  catchUp(rewinding = true): Promise<void> {
    if (this.pulling) { this.pullAgain = true; return this.pulling; }
    // Cleared once it's done, never before it's set (a run with nothing to wait for ends at once).
    const run = (async () => {
      do {
        this.pullAgain = false;
        await this.pull(rewinding);
      } while (this.pullAgain && !this.closed);
    })().finally(() => { if (this.pulling === run) this.pulling = null; });
    this.pulling = run;
    return run;
  }

  private async pull(rewinding: boolean) {
    const after = this.cursor > 0 ? Math.max(this.snapshotUpto, this.cursor - (rewinding ? REWIND : 0), 0) : 0;
    let p: Pull;
    try {
      p = await this.transport.pull(after);
    } catch (e) {
      const m = String((e as Error)?.message ?? "");
      if (/expired or was stopped/.test(m)) this.setStatus("gone");
      else if (/not_member|not in this note/.test(m)) this.setStatus("removed");
      else this.setStatus("offline");
      return;
    }
    if (this.closed) return;
    const beforeBoard = this.board;
    const beforeComments = this.comments;
    let changed = false;
    let ai: { by: string } | null = null;
    // A snapshot past what this page has; or, while it has nothing, any snapshot: the app shares a
    // board as a snapshot up to 0 with no changes after it (CollabSession.load takes it whatever
    // its position).
    const take = !!p.snapshot && (p.snapshot.upto > this.cursor || this.isEmpty);
    if (p.snapshot && !take) this.snapshotUpto = Math.max(this.snapshotUpto, p.snapshot.upto);
    if (p.snapshot && take) {
      const k = this.keys.get(p.snapshot.epoch);
      try {
        if (!k) throw new Error("no key");
        const saved = await open3("s", p.snapshot.ct, k, this.note, String(p.snapshot.upto));
        this.doc = this.A.loadIncremental(this.doc, saved);
        changed = true;
        this.cursor = Math.max(this.cursor, p.snapshot.upto);
        this.snapshotUpto = Math.max(this.snapshotUpto, p.snapshot.upto);
        this.sinceSnapshot = 0;
      } catch {
        // Sealed under a key this page doesn't have: someone was removed and the board has a new one.
        if (!k) { this.keyChanged(); return; }
      }
    }
    let newest = this.cursor;
    for (const u of p.updates) {
      newest = Math.max(newest, u.id);
      if (u.epoch !== this.epoch && !this.keys.has(u.epoch)) { this.keyChanged(); return; }
      if (await this.take(u)) {
        changed = true;
        if (u.client && u.author_id.toLowerCase() !== this.me) ai = { by: this.aiName(u) };
      }
    }
    this.cursor = newest;
    this.setStatus("live");
    if (changed) this.changed(beforeBoard, beforeComments, ai);
    this.scheduleSnapshot();
    await this.pullComments();
  }

  /** One change into the document. Returns whether it was new here. */
  private async take(u: Update): Promise<boolean> {
    if (this.applied.has(u.id)) return false;
    this.applied.add(u.id);
    this.sinceSnapshot++;
    const k = this.keys.get(u.epoch);
    if (!k) return false;
    try {
      const change = await open3("u", u.ct, k, this.note, u.author_id);
      this.doc = this.A.loadIncremental(this.doc, change);
      return true;
    } catch {
      return false;
    }
  }

  /** A change the channel relayed. */
  async receive(u: Update) {
    if (this.closed) return;
    if (u.epoch !== this.epoch && !this.keys.has(u.epoch)) { this.keyChanged(); return; }
    const beforeBoard = this.board, beforeComments = this.comments;
    if (await this.take(u)) this.changed(beforeBoard, beforeComments, u.client && u.author_id.toLowerCase() !== this.me ? { by: this.aiName(u) } : null);
    this.scheduleSnapshot();
  }

  private aiName(u: Update): string {
    const m = this.members.find((x) => x.user_id.toLowerCase() === u.author_id.toLowerCase());
    const who = m?.display_name?.trim().split(/\s+/)[0];
    return who ? `${who}'s ${u.client}` : String(u.client);
  }

  private keyChanged() {
    if (this.status === "keyChanged") return;
    this.setStatus("keyChanged");
    this.onKeyChanged?.();
  }

  /** The document moved: the drawing and comments read again, and to the page when they differ. */
  private changed(beforeBoard: Map<string, Entry>, beforeComments: Comment[], ai: { by: string } | null) {
    const board = entries(this.A, this.doc, this.board);
    const settings = settingsOf(this.doc);
    const moved = changedIDs(beforeBoard, board);
    const same = board.size === beforeBoard.size && moved.length === 0 && JSON.stringify(settings) === JSON.stringify(this.settings);
    this.board = board;
    this.settings = settings;
    if (!same) {
      this.onScene?.(this.scene());
      void this.fetchPictures();
      if (ai && moved.length) this.onAI?.(ai.by, moved);
    }
    this.commentsChanged(beforeComments);
  }

  // MARK: The comment stream

  /** The board's comments as every device folds them: the document's old map, the stream's
   *  entries this page opened, then yours still to send. */
  private foldedComments(): Comment[] {
    const mine = this.pendingComments.map((j) => entryOf(j, this.me ?? "", this.role ?? "commenter"));
    return foldComments(readComments(this.A, this.doc), [...this.opened(), ...mine]);
  }

  /** The stream's opened entries, in order; `epoch`: only those under that key. */
  private opened(epoch?: number): CommentEntry[] {
    return this.stream.filter((k) => k.entry && (epoch === undefined || k.epoch === epoch)).map((k) => k.entry!);
  }

  /** The comments changed (the old map, the stream, or yours): folded again, and to the page when
   *  they differ. An owner's or editor's page then moves what the stream doesn't hold yet. */
  private commentsChanged(before = this.comments) {
    const comments = this.foldedComments();
    if (JSON.stringify(comments) !== JSON.stringify(before)) {
      this.comments = comments;
      this.onComments?.(comments);
    }
    this.restateComments();
  }

  /** One entry into the stream here (from a pull, the channel, or your own send coming back),
   *  opened when its key is here. Returns whether it was new. */
  private async takeComment(row: CommentRow, plain?: string): Promise<boolean> {
    if (this.streamIDs.has(row.id) || this.closed) return false;
    this.streamIDs.add(row.id);
    const author = row.author_id.toLowerCase();
    const k: Kept = { id: row.id, author, role: row.role, epoch: row.epoch, ct: row.ct, entry: null };
    const i = this.stream.findIndex((x) => x.id > row.id);
    if (i < 0) this.stream.push(k); else this.stream.splice(i, 0, k);
    if (plain !== undefined) { k.entry = entryOf(plain, author, row.role); return true; }
    await this.openEntry(k);
    return true;
  }

  private async openEntry(k: Kept): Promise<boolean> {
    const key = this.keys.get(k.epoch);
    if (!key || k.entry) return false;
    try {
      k.entry = entryOf(new TextDecoder().decode(await open3("c", k.ct, key, this.note, k.author)), k.author, k.role);
      return true;
    } catch {
      return false;
    }
  }

  /** Entries kept sealed until a key that opens them came. */
  private async openStream() {
    let any = false;
    for (const k of this.stream) if (!k.entry && await this.openEntry(k)) any = true;
    if (any) this.commentsChanged();
  }

  /** Every entry after the cursor (ids follow commit order: the server takes the note's row first). */
  private async pullComments() {
    if (!this.transport.comments || this.closed) return;
    let rows: CommentRow[];
    try { rows = await this.transport.comments(this.commentCursor); } catch { return; }
    if (this.closed) return;
    // One under a newer key than this page has: someone was removed, and it opens once the new key is here.
    for (const r of rows) {
      if (r.epoch > this.epoch && !this.keys.has(r.epoch)) this.keyChanged();
      await this.takeComment(r);
    }
    if (rows.length) this.commentCursor = Math.max(this.commentCursor, rows[rows.length - 1].id);
    this.commentsPulled = true;
    this.commentsChanged();
  }

  /** An entry the channel relayed. The cursor stays: only pulls move it, so none is skipped. */
  async receiveComment(row: CommentRow) {
    if (this.closed) return;
    if (await this.takeComment(row)) this.commentsChanged();
  }

  /**
   * Comments of yours (a new one, a reply, an edit, a delete, a thread resolved or opened again):
   * one entry in the board's comment stream, up as soon as it can go. Your words are read only
   * from entries of yours; a resolve counts from anyone who may comment. A viewer's go nowhere.
   */
  commentLocal(list: Comment[]) {
    if (!this.canComment || !this.me || !list.length || this.closed) return;
    this.pendingComments.push(...commentEntries(list));
    this.commentsChanged();
    void this.flushComments();
  }

  /** Your comment entries waiting to go up. */
  get unsentComments() { return this.pendingComments.length; }

  /** Sends your waiting entries, oldest first. Offline, they stay and go again (2 s, then longer). */
  flushComments(): Promise<void> {
    if (this.sendingComments) return this.sendingComments;
    if (!this.pendingComments.length || this.closed) return Promise.resolve();
    if (!this.canComment || !this.transport.sendComment || !this.me) { this.pendingComments = []; this.commentsChanged(); return Promise.resolve(); }
    const me = this.me, send = this.transport.sendComment;
    const run = (async () => {
      while (this.pendingComments.length && !this.closed) {
        const entry = this.pendingComments[0];
        try {
          const ct = await seal3("c", new TextEncoder().encode(entry) as Bytes, this.nk, this.note, this.epoch, me);
          if (ct.length > MAX_COMMENT_ENTRY) { this.pendingComments.shift(); this.onCommentsRefused?.(COMMENTS_FULL); continue; }
          const row = await send(ct, this.epoch);
          if (this.pendingComments[0] === entry) this.pendingComments.shift();
          await this.takeComment({ ...row, id: Number(row.id), author_id: String(row.author_id) }, entry);
          this.commentDelay = 2000;
        } catch (e) {
          // The server's words, and its hint (board-rest.ts RestError).
          const m = `${(e as Error)?.message ?? ""} ${(e as { hint?: unknown })?.hint ?? ""}`;
          if (/stale_epoch|key changed/.test(m)) { this.keyChanged(); return; }
          if (/not_member|not in this note/.test(m)) { this.pendingComments = []; this.setStatus("removed"); return; }
          if (/read_only|but not comment|view this note but not change it/.test(m)) {
            this.canComment = false; this.canWrite = false; this.pendingComments = []; return;
          }
          if (/comments_full|no room for more comments/.test(m)) { this.pendingComments.shift(); this.onCommentsRefused?.(COMMENTS_FULL); continue; }
          const wait = this.commentDelay;
          this.commentDelay = Math.min(this.commentDelay * 2, 60_000);
          this.commentRetry?.();
          this.commentRetry = this.clock.after(wait, () => { this.commentRetry = null; void this.flushComments(); });
          return;
        }
      }
    })().finally(() => {
      if (this.sendingComments === run) this.sendingComments = null;
      if (!this.closed) this.commentsChanged();
    });
    this.sendingComments = run;
    return run;
  }

  /**
   * An owner's or editor's page puts into the stream, under the note's current key, every comment
   * that someone reading only the stream with that key wouldn't see as it is: the old map's, and
   * those under an older key (after someone was removed). One "moved" entry, nothing when there's
   * nothing new; only once the document and the stream are both read, with nothing of yours waiting.
   */
  private restateComments() {
    if (this.closed || !this.canWrite || !this.canComment || !this.commentsPulled || !this.isBoard) return;
    if (this.A.getMissingDeps(this.doc, []).length) return;
    if (this.sendingComments || this.pendingComments.length || this.status === "keyChanged") return;
    if (this.stream.some((k) => !k.entry && this.keys.has(k.epoch))) return;
    const full = foldComments(readComments(this.A, this.doc), this.opened());
    const bare = foldComments([], this.opened(this.epoch));
    const moved = toRestate(full, bare);
    if (!moved.length) return;
    this.pendingComments = commentEntries(moved, true);
    void this.flushComments();
  }

  /** The whole scene, with the pictures this page has. */
  scene(): Scene { return scene(ordered(this.board), this.settings, this.pictures); }

  // MARK: Pictures

  /** The pictures in use that this page doesn't have yet, fetched and opened; the scene goes again once they're in. */
  async fetchPictures(again = false): Promise<void> {
    const want = [...inUse([...this.board.values()].map((e) => e.element))]
      .filter((id) => !this.pictures.has(id) && !this.fetching.has(id) && (again || !this.missingPictures.has(id)));
    if (!want.length) return;
    for (const id of want) this.fetching.add(id);
    let got = false;
    await Promise.all(want.map(async (id) => {
      try {
        const row = await this.transport.file(id);
        const k = row ? this.keys.get(row.epoch) : undefined;
        if (!row || !k) { this.missingPictures.add(id); return; }
        const pic = pictureOf(await open3("f", row.ct, k, this.note, id));
        if (!pic.mimeType.startsWith("image/")) return;
        this.pictures.set(id, { id, dataURL: `data:${pic.mimeType};base64,${base64(pic.data)}`, mimeType: pic.mimeType, created: this.clock.now() });
        this.missingPictures.delete(id);
        got = true;
      } catch {
        this.missingPictures.add(id);
      } finally {
        this.fetching.delete(id);
      }
    }));
    if (got && !this.closed) this.onScene?.(this.scene());
    // One that wasn't there yet (its change outran it): asked again in a few seconds.
    if (this.missingPictures.size && !this.closed) this.stops.push(this.clock.after(4000, () => void this.fetchPictures(true)));
  }

  /** New pictures the page put on the board: sealed and stored before the change that shows them.
   *  Returns the ids of those that couldn't go (and says why). */
  private async admitPictures(files: Record<string, { id?: unknown; dataURL?: unknown; mimeType?: unknown }>, elements: El[]): Promise<Set<string>> {
    const refused = new Set<string>();
    const offered = Object.entries(files ?? {});
    if (!offered.length) return refused;
    const using = [...inUse([...this.board.values()].map((e) => e.element))];
    let room = PICTURES_IN_USE - using.reduce((n, id) => n + (this.pictures.get(id)?.dataURL.length ?? 0), 0);
    for (const [id, f] of offered) {
      const url = typeof f?.dataURL === "string" ? f.dataURL : "";
      const comma = url.indexOf(",");
      if (this.pictures.has(id)) continue;
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !url.startsWith("data:image/") || !url.slice(0, comma).includes(";base64")) { refused.add(id); continue; }
      if (url.length > room || !this.transport.putFile) { refused.add(id); this.onRefused?.(elementsShowing(elements, id), this.transport.putFile ? TOO_BIG : NOT_THERE); continue; }
      const mime = typeof f.mimeType === "string" ? f.mimeType : url.slice(5, url.indexOf(";"));
      try {
        const ct = await seal3("f", pictureBytes(mime, fromBase64Text(url.slice(comma + 1))), this.nk, this.note, this.epoch, id);
        await this.transport.putFile(id, this.epoch, ct);
        this.pictures.set(id, { id, dataURL: url, mimeType: mime, created: this.clock.now() });
        room -= url.length;
      } catch (e) {
        refused.add(id);
        this.onRefused?.(elementsShowing(elements, id), /files_full|too big/i.test(String((e as Error)?.message)) ? TOO_BIG : NOT_THERE);
      }
    }
    return refused;
  }

  // MARK: What's drawn here

  /**
   * What the page drew or changed (the elements it saw change since it last said, and its settings,
   * and the bytes of new pictures): each element that wins over the document's copy goes in, as one
   * change, and up. Something it changed that lost to the document's copy: the page gets the
   * document's back, so it ends the same.
   */
  async local(elements: El[], settings: Settings = {}, files: Record<string, { id?: unknown; dataURL?: unknown; mimeType?: unknown }> = {}): Promise<void> {
    if (!this.canWrite || !this.me || this.closed) return;
    const refused = await this.admitPictures(files, elements);
    const kept = elements.filter((e) => { const id = fileIdOf(e); return !id || !refused.has(id) || e.isDeleted === true; });
    const wins = winners(kept, this.board);
    if (wins.length < kept.filter((e) => typeof e.id === "string" && (e.type !== "image" || fileIdOf(e))).length) this.onScene?.(this.scene());
    // A change up to 256 KB sealed: a big paste goes as several.
    const batches: [string, El][][] = [];
    let batch: [string, El][] = [], size = 0;
    for (const w of wins) {
      const n = JSON.stringify(w[1]).length;
      if (batch.length && size + n > 150_000) { batches.push(batch); batch = []; size = 0; }
      batch.push(w);
      size += n;
    }
    if (batch.length || !batches.length) batches.push(batch);
    for (const [i, b] of batches.entries()) {
      const out = put(this.A, this.doc, { elements: b, settings: i === 0 ? settings : undefined }, this.me, new Date(this.clock.now()));
      if (!out.bytes) continue;
      this.doc = out.doc;
      this.pending.push(out.bytes);
    }
    this.board = entries(this.A, this.doc, this.board);
    this.settings = settingsOf(this.doc);
    void this.flush();
  }

  /** Sends the changes made here, in order. One at a time; a failure leaves them for the next try. */
  flush(): Promise<void> {
    if (this.sending) return this.sending;
    const run = (async () => {
      while (this.pending.length && !this.closed && this.transport.send && this.me) {
        const change = this.pending[0];
        try {
          const ct = await seal3("u", change as Bytes, this.nk, this.note, this.epoch, this.me);
          // Too big for one change (a huge paste): it goes in the next snapshot instead.
          if (ct.length > MAX_UPDATE) { this.pending.shift(); this.needsSnapshot = true; continue; }
          const row = await this.transport.send(ct, this.epoch);
          this.applied.add(Number(row.id));
          this.pending.shift();
          this.sinceSnapshot++;
        } catch (e) {
          const m = String((e as Error)?.message ?? "");
          if (/stale_epoch|key changed/.test(m)) { this.keyChanged(); break; }
          if (/read_only|not_member|view this note but not change it|not in this note/.test(m)) {
            this.canWrite = false;
            this.pending = [];
            this.setStatus(/not_member|not in this note/.test(m) ? "removed" : "live");
            break;
          }
          this.setStatus("offline");
          this.stops.push(this.clock.after(3000, () => void this.flush()));
          break;
        }
      }
    })().finally(() => { if (this.sending === run) this.sending = null; this.scheduleSnapshot(); });
    this.sending = run;
    return run;
  }

  get unsent() { return this.pending.length; }

  // MARK: Snapshots

  private scheduleSnapshot() {
    if (!this.canWrite || !this.transport.snapshot || (!this.needsSnapshot && this.sinceSnapshot < SNAPSHOT_EVERY) || this.closed) return;
    this.snapshotTimer?.();
    this.snapshotTimer = this.clock.after(5000, () => { this.snapshotTimer = null; void this.writeSnapshot(); });
  }

  /** One is due whatever the count: a change too big to send goes in it. */
  private needsSnapshot = false;

  /**
   * The whole document, sealed, with the newest change it covers (the cursor); the server then drops
   * the changes up to there. Only with everything up to that point in it: it pulls first, and
   * doesn't write one while a change of yours is still on its way (CollabSession.writeSnapshot).
   */
  async writeSnapshot(force = false): Promise<void> {
    if (!this.transport.snapshot || !this.canWrite || this.closed) return;
    if (!force && !this.needsSnapshot && this.sinceSnapshot < SNAPSHOT_EVERY) return;
    await this.catchUp();
    if (this.closed || this.cursor <= 0) return;
    if (this.pending.length || this.A.getMissingDeps(this.doc, []).length) { this.scheduleSnapshot(); return; }
    const upto = this.cursor;
    const saved = this.A.save(this.doc);
    if (saved.length > MAX_SNAPSHOT) return;
    try {
      await this.transport.snapshot(await seal3("s", saved as Bytes, this.nk, this.note, this.epoch, String(upto)), upto, this.epoch);
      this.snapshotUpto = Math.max(this.snapshotUpto, upto);
      this.sinceSnapshot = 0;
      this.needsSnapshot = false;
    } catch { this.scheduleSnapshot(); }
  }

  // MARK: Presence

  /** Your pointer (in the board's own coordinates; null off the board) and selection: out at most ten times a second. */
  presence(pointer: [number, number] | null, selection: string[]) {
    if (!this.live) return;
    const same = JSON.stringify([pointer, selection]) === JSON.stringify([this.myPointer, this.mySelection]);
    if (same) return;
    this.myPointer = pointer;
    this.mySelection = selection;
    this.presenceSoon();
  }

  /** What you present and see, and your laser's points since the page last said (null: off): with
   *  your pointer, at most ten times a second; the laser's points wait for the next beat. */
  look(presenting: Presenting | null, view: View | null, laser: [number, number][] | null) {
    if (!this.live) return;
    const v = view ? view.map(Math.round) as View : null;
    const same = JSON.stringify([presenting, v, laser !== null]) === JSON.stringify([this.myPresenting, this.myView, this.myLaserOn]);
    if (same && !laser?.length) return;
    this.myPresenting = presenting;
    this.myView = v;
    this.myLaserOn = laser !== null;
    if (laser) this.myLaser.push(...laser);
    if (this.myLaser.length > MOST_LASER_POINTS) this.myLaser.splice(0, this.myLaser.length - MOST_LASER_POINTS);
    this.presenceSoon();
  }

  /** Voting and a timer (board-team.ts): what your presence carries, read as each beat goes out;
   *  `teamChanged` sends one soon. Someone's beat with theirs, and someone gone. */
  teamNow: (() => { session: TeamSession | null; dots: Dots | null }) | null = null;
  onTeam: ((user: string, name: string, session: TeamSession | null, dots: Dots | null) => void) | null = null;
  onLeft: ((user: string) => void) | null = null;
  teamChanged() { if (this.live) this.presenceSoon(); }

  /** Whose view you follow (null: nobody), told to the others. */
  follow(id: string | null) {
    const next = id ? id.toLowerCase() : null;
    if (next === this.myFollow) return;
    this.myFollow = next;
    this.presenceSoon();
  }

  private presenceSoon() {
    const wait = POINTER_EVERY - (this.clock.now() - this.pointerSentAt);
    if (wait <= 0) { this.pointerSentAt = this.clock.now(); this.sendPresence(); return; }
    if (this.pointerTimer) return;
    this.pointerTimer = this.clock.after(wait, () => { this.pointerTimer = null; this.pointerSentAt = this.clock.now(); this.sendPresence(); });
  }

  private sendPresence() {
    if (!this.live || !this.me) return;
    const p: Record<string, unknown> = { name: this.name };
    if (this.myPointer) p.pointer = this.myPointer;
    if (this.mySelection.length) p.sel = this.mySelection;
    if (this.myPresenting) p.present = this.myPresenting;
    if (this.myView) p.view = this.myView;
    // The laser's points go once: the next beat carries the next ones.
    if (this.myLaserOn || this.myLaser.length) p.laser = this.myLaser.splice(0);
    if (this.myFollow) p.follow = this.myFollow;
    // Voting and a timer (board-team.ts): the session you run and your dots in this round.
    const team = this.teamNow?.();
    if (team?.session) p.team = team.session;
    if (team?.dots) p.dots = team.dots;
    const live = this.live, bytes = new TextEncoder().encode(JSON.stringify(p)) as Bytes, nk = this.nk, note = this.note, epoch = this.epoch, me = this.me;
    this.beatsOut = this.beatsOut.then(() => seal3("p", bytes, nk, note, epoch, me)).then((ct) => live.presence(ct)).catch(() => {});
  }

  private async presenceIn(user: string, ct: string) {
    const id = user.toLowerCase();
    if (id === this.me) return;
    let p: { name?: unknown; pointer?: unknown; sel?: unknown; present?: unknown; view?: unknown; laser?: unknown; follow?: unknown; team?: unknown; dots?: unknown };
    try { p = JSON.parse(new TextDecoder().decode(await open3("p", ct, this.nk, this.note, id))); } catch { return; }
    const now = this.clock.now();
    const had = this.peers.get(id);
    const pointer = Array.isArray(p.pointer) && p.pointer.length === 2 && p.pointer.every((n) => typeof n === "number" && Number.isFinite(n)) ? [p.pointer[0], p.pointer[1]] as [number, number] : null;
    const sel = Array.isArray(p.sel) ? p.sel.filter((s): s is string => typeof s === "string").slice(0, 500) : [];
    const moved = !had || JSON.stringify(had.pointer) !== JSON.stringify(pointer) || JSON.stringify(had.sel) !== JSON.stringify(sel);
    const presenting = presentingOf(p.present), view = viewOf(p.view);
    const following = typeof p.follow === "string" && /^[0-9a-f-]{36}$/i.test(p.follow) ? p.follow.toLowerCase() : null;
    const looked = !had || JSON.stringify([had.presenting, had.view, had.following]) !== JSON.stringify([presenting, view, following]);
    this.peers.set(id, { id, name: typeof p.name === "string" ? p.name : "Someone", pointer, sel, movedAt: moved ? now : had!.movedAt, heardAt: now, presenting, view, following });
    this.sendPeers();
    if (looked) this.onPeople?.(this.boardPeople());
    const trail = pointsOf(p.laser);
    if (trail.length) this.onLaser?.(id, trail);
    this.onTeam?.(id, typeof p.name === "string" ? p.name : "Someone", sessionOf(p.team), dotsOf(p.dots));
    // The name flag goes 3 seconds after the last move: drawn again then, not at the next beat.
    if (moved) { this.flagTimer?.(); this.flagTimer = this.clock.after(FLAG_FOR + 20, () => { this.flagTimer = null; this.sendPeers(); }); }
    if (!had) { void this.refreshMembers(); this.sendPresence(); }
  }

  /** Everyone else's pointer and selection for the board to draw, now (CollabSession.boardPeers). */
  boardPeers(now = this.clock.now()): BoardPeer[] {
    const order = [...this.members.filter((m) => m.role === "owner"), ...this.members.filter((m) => m.role !== "owner")].map((m) => m.user_id);
    const s = slots(order);
    const out: BoardPeer[] = [];
    for (const p of this.peers.values()) {
      if (!p.pointer && !p.sel.length) continue;
      const stale = now - p.heardAt >= STALE_AFTER;
      const [light, dark] = stale ? STALE : PALETTE[s.get(p.id) ?? paletteIndex(p.id)];
      const peer: BoardPeer = { id: p.id, name: p.name.split(/\s+/)[0] || p.name, color: light, dark, sel: p.sel, flag: !stale && now - p.movedAt < FLAG_FOR };
      if (p.pointer) { peer.x = p.pointer[0]; peer.y = p.pointer[1]; }
      out.push(peer);
    }
    return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  /** Everyone else on the board, for following them, whether or not their pointer is on it
   *  (CollabSession.boardPeople). */
  boardPeople(now = this.clock.now()): BoardPerson[] {
    const order = [...this.members.filter((m) => m.role === "owner"), ...this.members.filter((m) => m.role !== "owner")].map((m) => m.user_id);
    const s = slots(order);
    return [...this.peers.values()].map((p) => {
      const [light, dark] = PALETTE[s.get(p.id) ?? paletteIndex(p.id)];
      return { id: p.id, name: p.name.split(/\s+/)[0] || p.name, color: light, dark, presenting: p.presenting, view: p.view, following: p.following, stale: now - p.heardAt >= STALE_AFTER };
    }).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  private lastPeers = "";
  private sendPeers() {
    const peers = this.boardPeers();
    const j = JSON.stringify(peers);
    if (j === this.lastPeers) return;
    this.lastPeers = j;
    this.onPeers?.(peers);
  }

  /** Someone's colour on this board ("#RRGGBB"), for their comments' pins: the one their pointer has. */
  colorOf(user: string): string {
    const order = [...this.members.filter((m) => m.role === "owner"), ...this.members.filter((m) => m.role !== "owner")].map((m) => m.user_id);
    return PALETTE[slots(order).get(user.toLowerCase()) ?? paletteIndex(user)][0];
  }
  darkOf = darkOf;
  firstName = firstName;
}

/** The ids of the image elements showing a picture. */
const elementsShowing = (elements: El[], file: string) => elements.filter((e) => e.type === "image" && e.fileId === file && typeof e.id === "string").map((e) => e.id as string);

function base64(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64Text(s: string): Bytes {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out as Bytes;
}
