// A shared whiteboard's comments in the browser: what the app's canvas controller does with them
// (Pane/Model/CanvasBridge.swift, the Comments part), for the page at /s/<id> (BoardPage.tsx).
//
// - The threads and their pins, each in its writer's colour (an AI's in graphite), with the open
//   thread's pin shown even when it's resolved.
// - Writing: a new comment where the Comment tool placed it, a reply, an edit of your own (a higher
//   version, stamped edited, its mentions read again), a delete of your own (no words kept; a thread
//   start with replies stays as "Comment deleted"), resolve and open again. Each goes into the
//   board's comment stream through `onWrite`, as one entry.
// - Mentions: "@Sara" names one of the board's other people; they get the dot until they open it.
// - What you've seen, per board, in this browser: a comment from someone else you haven't seen
//   shows the quiet dot on the Comments button.
import {
  type Comment, commentStamp, MAX_COMMENT, mentioned, newCommentID, nextVersion, type Person, type Thread, threads, AI_COLOR, initial,
} from "./board-doc";
import { aiGlyphFor, aiGlyphURL } from "./ai-glyphs";

export type Place = { on?: string; x: number; y: number };

/** A pin as the page draws it; an AI's has its mark (a data URL of its glyph), not a letter. */
export type Pin = { id: string; on?: string; x: number; y: number; color: string; dark?: string; letter: string; open: boolean; mark?: string };

/** What's posted: trimmed, never empty, at most 5000 characters (CanvasBridge.clean). */
export function clean(text: string): string | null {
  const t = text.trim();
  return t ? [...t].slice(0, MAX_COMMENT).join("") : null;
}

export const RESOLVED_LINE = "Comment resolved";
export const DELETED_LINE = "Comment deleted";
export const REOPENED_LINE = "Comment opened again";
export const ON_BOARD = "on the board";
export const ON_SHAPE = "on a shape";
export const SHOW_CHANGE = "Show change";
/** What an AI's reply says when what it changed is gone (CanvasController.changeGone). */
export const CHANGE_GONE = "That change is no longer on the board";

/** What you've seen on each board, kept in this browser (BoardComments.Seen). */
export class Seen {
  static readonly most = 500;
  constructor(private readonly store: Pick<Storage, "getItem" | "setItem"> | null) {}
  private read(key: string): string[] | null {
    try { const v = this.store?.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  private write(key: string, ids: Set<string>) {
    try { this.store?.setItem(key, JSON.stringify([...ids].sort().slice(-Seen.most))); } catch { /* private browsing */ }
  }
  /** Null: this board was never looked at here. */
  ids(board: string): Set<string> | null { const v = this.read(`pinto.board.seen.${board}`); return v ? new Set(v) : null; }
  set(ids: Set<string>, board: string) { this.write(`pinto.board.seen.${board}`, ids); }
  mentions(board: string): Set<string> { return new Set(this.read(`pinto.board.mentions.${board}`) ?? []); }
  setMentions(keys: Set<string>, board: string) { this.write(`pinto.board.mentions.${board}`, keys); }
  static mentionKey(c: Comment) { return `${c.id}#${c.version}`; }
}

export class BoardComments {
  comments: Comment[] = [];
  /** You: your account id (upper case, as the app writes it: UUID.uuidString) and first name. */
  author = { id: "", name: "You" };
  /** The board's other people you can mention, by first name. */
  mentionable: Person[] = [];
  /** You can write comments here (the owner, an editor or a commenter, signed in). */
  canComment = false;
  /** The board is view only here (Can view, or Can comment): comments are placed in view mode. */
  viewOnly = false;
  openThread: string | null = null;
  draft: Place | null = null;
  /** What each thread's shape is called ("Idea"), as the page says. */
  shapes: Record<string, string> = {};
  /** The page has said which of the shapes asked about are on the board (`shapes`). */
  shapesReported = false;
  unseen = false;
  /** Each writer's colour on this board. */
  colorOf: (user: string) => string = () => "#2D639A";
  darkOf: (color: string) => string | undefined = () => undefined;
  /** Your comments, to go into the document. */
  onWrite: ((changed: Comment[]) => void) | null = null;
  /** Something to say for a moment ("Comment resolved"), with an undo. */
  onConfirm: ((line: string, undo: () => void) => void) | null = null;
  /** Anything here changed: the page draws again. */
  onChange: (() => void) | null = null;
  now: () => Date = () => new Date();

  private seenIds: Set<string> | null = null;
  private mentionsSeen: Set<string> | null = null;

  constructor(readonly board: string, private readonly seen: Seen) {}

  get threads(): Thread[] { return threads(this.comments); }

  /** The board's comments, from its document (on opening, and whenever they change). */
  show(list: Comment[]) {
    this.comments = list;
    if (this.openThread && !this.threads.some((t) => t.first.id === this.openThread)) this.closeThread(false);
    this.updateUnseen();
    this.changed();
  }

  setCanComment(can: boolean) {
    if (can === this.canComment) return;
    this.canComment = can;
    if (!can) this.draft = null;
    this.changed();
  }

  isMine(c: Comment) { return c.by.toLowerCase() === this.author.id.toLowerCase() && !c.ai; }

  /** Who wrote it: you by your name, someone's AI as "Sara's Claude". */
  byline(c: Comment): string {
    if (this.isMine(c)) return this.author.name;
    if (!c.ai) return c.name;
    return c.by.toLowerCase() === this.author.id.toLowerCase() ? c.ai : `${c.name}'s ${c.ai}`;
  }

  color(c: Comment) { return c.ai ? AI_COLOR : this.colorOf(c.by); }

  place(t: Thread): string {
    if (!t.first.on) return ON_BOARD;
    const n = this.shapes[t.first.on];
    return n ? `on ${n}` : ON_SHAPE;
  }

  /** The first names of the people with these ids (you among them), for mentions to be set apart. */
  names(ids: string[] = []): string[] {
    return ids.flatMap((id) => id.toLowerCase() === this.author.id.toLowerCase() ? [this.author.name]
      : this.mentionable.filter((p) => p.id.toLowerCase() === id.toLowerCase()).map((p) => p.name));
  }

  mentionsMe(c: Comment) { return !c.deleted && !this.isMine(c) && (c.mentions ?? []).some((m) => m.toLowerCase() === this.author.id.toLowerCase()); }

  unreadMention(t: Thread): boolean {
    const seen = this.mentionsSeen ??= this.seen.mentions(this.board);
    return [t.first, ...t.replies].some((c) => this.mentionsMe(c) && !seen.has(Seen.mentionKey(c)));
  }

  private updateUnseen() {
    if (!this.seenIds) {
      // The first look at this board here: what it has now counts as seen.
      this.seenIds = this.seen.ids(this.board);
      if (!this.seenIds) { this.seenIds = new Set(this.comments.map((c) => c.id)); this.seen.set(this.seenIds, this.board); }
    }
    const ids = this.seenIds;
    this.unseen = this.comments.some((c) => !ids.has(c.id) && !this.isMine(c) && !c.deleted) || this.threads.some((t) => this.unreadMention(t));
  }

  /** You looked (the list, or a thread): every comment so far counts as seen. */
  markSeen() {
    const ids = new Set([...(this.seenIds ?? this.seen.ids(this.board) ?? []), ...this.comments.map((c) => c.id)]);
    this.seenIds = ids;
    this.seen.set(ids, this.board);
    if (this.openThread) this.readMentions(this.openThread);
    this.unseen = this.threads.some((t) => this.unreadMention(t));
    this.changed();
  }

  private readMentions(thread: string) {
    const t = this.threads.find((x) => x.first.id === thread);
    if (!t) return;
    const mine = [t.first, ...t.replies].filter((c) => this.mentionsMe(c)).map(Seen.mentionKey);
    if (!mine.length) return;
    const keys = this.mentionsSeen ??= this.seen.mentions(this.board);
    if (mine.every((k) => keys.has(k))) return;
    for (const k of mine) keys.add(k);
    this.seen.setMentions(keys, this.board);
  }

  /** The pins the page draws: every open thread, and the one open now even when it's resolved. */
  get pins(): Pin[] {
    return this.threads.filter((t) => !t.first.resolved || t.first.id === this.openThread).map((t) => {
      const color = this.color(t.first);
      const p: Pin = { id: t.first.id, x: t.first.x, y: t.first.y, color, letter: initial(t.first), open: t.first.id === this.openThread };
      if (t.first.on) p.on = t.first.on;
      const dark = this.darkOf(color);
      if (dark) p.dark = dark;
      // An AI's pin shows its mark, as in the app (BoardComments.markPicture).
      const glyph = aiGlyphFor(t.first.ai);
      if (glyph) p.mark = aiGlyphURL(glyph);
      return p;
    });
  }

  /**
   * What an AI's comment links to (CanvasController.changeLink): the things its write changed that
   * are still on the board, to outline and bring into view (Show change), or `gone` when none are.
   * Null for a person's comment, or one that names no change.
   */
  changeLink(c: Comment): { by: string; ids: string[] } | "gone" | null {
    if (!c.ai || c.deleted || !c.changes?.length) return null;
    // Before the page has said which are there, all of them: Show change outlines what is.
    const here = this.shapesReported ? c.changes.filter((id) => this.shapes[id] !== undefined) : c.changes;
    return here.length ? { by: this.byline(c), ids: here } : "gone";
  }

  /** The `comments` command for the page (CanvasCommand.comments). */
  command() {
    const color = this.colorOf(this.author.id);
    return {
      op: "comments", pins: this.pins,
      me: { id: "me", x: 0, y: 0, color, dark: this.darkOf(color), letter: (this.author.name.trim()[0] ?? "?").toUpperCase(), open: false },
      open: this.openThread ?? (this.draft ? "draft" : null),
      draft: this.draft ? { x: this.draft.x, y: this.draft.y, ...(this.draft.on ? { on: this.draft.on } : {}) } : null,
      can: this.canComment,
      inView: this.canComment && this.viewOnly,
      // The shapes threads are on, and what AIs' comments changed: a name back says it's on the board.
      shapes: [...new Set([...this.threads.flatMap((t) => (t.first.on ? [t.first.on] : [])),
        ...this.comments.filter((c) => c.ai && !c.deleted).flatMap((c) => c.changes ?? [])])].sort(),
    };
  }

  /** The page placed a new comment (the Comment tool), or a pin was clicked. */
  fromPage(m: { new?: { on?: unknown; x?: unknown; y?: unknown }; open?: unknown }) {
    if (m.new) {
      const x = Number(m.new.x), y = Number(m.new.y);
      if (!this.canComment || !Number.isFinite(x) || !Number.isFinite(y)) return;
      this.openThread = null;
      this.draft = { x, y, ...(typeof m.new.on === "string" ? { on: m.new.on } : {}) };
      this.changed();
    } else if (typeof m.open === "string") this.open(m.open);
  }

  open(id: string) {
    if (!this.comments.some((c) => c.id === id && !c.thread)) return;
    this.draft = null;
    this.openThread = id;
    this.markSeen();
  }

  closeThread(tell = true) {
    if (!this.openThread && !this.draft) return;
    this.openThread = null;
    this.draft = null;
    if (tell) this.changed();
  }

  /** Posts the comment being written. Its thread stays open, for a reply. */
  post(text: string): Comment | null {
    const place = this.draft, t = clean(text);
    if (!place || !this.canComment || !t) return null;
    const c: Comment = {
      id: newCommentID(), x: place.x, y: place.y, by: this.author.id, name: this.author.name, text: t,
      created: commentStamp(this.now()), resolved: false, version: 1,
    };
    if (place.on) c.on = place.on;
    const m = mentioned(t, this.mentionable);
    if (m.length) c.mentions = m;
    this.draft = null;
    this.openThread = c.id;
    this.apply([c]);
    return c;
  }

  reply(thread: string, text: string): Comment | null {
    const t = clean(text);
    if (!this.canComment || !t || !this.comments.some((c) => c.id === thread && !c.thread)) return null;
    const c: Comment = { id: newCommentID(), thread, x: 1, y: 0, by: this.author.id, name: this.author.name, text: t, created: commentStamp(this.now()), resolved: false, version: 1 };
    const m = mentioned(t, this.mentionable);
    if (m.length) c.mentions = m;
    this.apply([c]);
    return c;
  }

  /** A comment of yours, changed: its new words, marked edited. Null when nothing changes. */
  edit(id: string, text: string): Comment | null {
    const was = this.comments.find((c) => c.id === id), t = clean(text);
    if (!this.canComment || !was || !this.isMine(was) || was.deleted || !t || t === was.text) return null;
    const c: Comment = { ...was, text: t, edited: commentStamp(this.now()), version: nextVersion(was) };
    const m = mentioned(t, this.mentionable);
    if (m.length) c.mentions = m; else delete c.mentions;
    this.apply([c]);
    return c;
  }

  /** Deletes a comment of yours. Its words go; Undo puts them back. */
  delete(id: string) {
    const was = this.comments.find((c) => c.id === id);
    if (!this.canComment || !was || !this.isMine(was) || was.deleted) return;
    const c: Comment = { ...was, deleted: true, text: "", version: nextVersion(was) };
    delete c.edited;
    delete c.mentions;
    this.apply([c]);
    if (!c.thread && this.openThread === id && !this.threads.some((t) => t.first.id === id)) this.closeThread();
    this.onConfirm?.(DELETED_LINE, () => {
      const now = this.comments.find((x) => x.id === id);
      if (!now?.deleted) return;
      const back: Comment = { ...now, deleted: false, text: was.text, version: nextVersion(now) };
      if (was.edited) back.edited = was.edited;
      if (was.mentions?.length) back.mentions = was.mentions;
      this.apply([back]);
    });
  }

  /** Resolves a thread (it goes from the board and stays in the list), or opens it again. */
  resolve(thread: string, resolved = true) {
    const first = this.comments.find((c) => c.id === thread && !c.thread);
    if (!this.canComment || !first || first.resolved === resolved) return;
    this.apply([{ ...first, resolved, version: nextVersion(first) }]);
    if (resolved && this.openThread === thread) this.closeThread();
    this.onConfirm?.(resolved ? RESOLVED_LINE : REOPENED_LINE, () => this.resolve(thread, !resolved));
  }

  private apply(changed: Comment[]) {
    const list = [...this.comments];
    for (const c of changed) {
      const i = list.findIndex((x) => x.id === c.id);
      if (i >= 0) list[i] = c; else list.push(c);
    }
    this.comments = list;
    this.onWrite?.(changed);
    this.markSeen();
  }

  private changed() { this.onChange?.(); }
}
