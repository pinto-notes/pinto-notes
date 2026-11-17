// The whiteboard page's side of the canvas (public/board/canvas.html): what the app's canvas
// controller does for a shared board (Pane/Model/CanvasBridge.swift), in the browser.
//
// The canvas is the app's own page (canvas-stack/src/canvas.jsx, built into Pane/Resources/Canvas),
// in a frame from this site. It takes commands (`{op: ...}`) and says what it has (its state, the
// elements you changed, your pointer, comment clicks), as it does in the app. Here:
// - When the page loads (its state's `load` changes): shared mode, read only for a viewer, the whole
//   drawing with every picture, the others' pointers and the comments' pins.
// - The document's drawing, whenever it changed elsewhere, with only the pictures the page doesn't
//   have yet (CanvasController.remote).
// - What you changed, into the session; your pointer and selection, to the others.
import type { BoardComments } from "./board-comments";
import { BoardFollow, pointsOf, presentingOf, viewOf } from "./board-follow";
import type { BoardPeer, BoardSession, Scene } from "./board-session";
import { chime, TeamModel, votesLeft } from "./board-team";

/** The votes command when nothing is on: a page that has just loaded shows this already. */
const NO_VOTES = JSON.stringify({ op: "votes", on: false, dots: [], results: null });

/** What the page says about itself (canvas.jsx stateOf); only what the page here reads. */
export type PageState = {
  tool?: string; selection?: string[]; zoom?: number; canUndo?: boolean; canRedo?: boolean; empty?: boolean; load?: string;
  /** The tool stays picked after drawing (Q, or the palette's lock). */
  locked?: boolean;
  /** Excalidraw's hint for what you're doing, for the line under the palette (canvas.jsx hintOf). */
  hint?: string | null;
  editing?: boolean; busy?: boolean; style?: Record<string, unknown>; bounds?: { x: number; y: number; width: number; height: number } | null;
  /** The frames in the order Present walks them, and what you present (canvas.jsx stateOf). */
  frames?: { id: string; name: string }[];
  present?: { index: number; count: number; name: string; frame: [number, number, number, number] | null } | null;
};

export type Box = [number, number, number, number];
/** Where the open thread's pin is, with the shape it's on and what's drawn near it (comments.js
 *  around), for the thread to open clear of them (board-placement.ts). */
export type Anchor = { id: string; x: number; y: number; width: number; height: number; on?: Box | null; near?: Box[] };

/** A change outlined on the board (an AI's, or Show change on its reply): a dashed box round each
 *  thing it changed and its name over them, as the app outlines one (CanvasAIHighlight). */
export type Outline = { by: string; boxes: Box[]; key: number };

/** How long an outline shows (the app's CanvasController.highlightTime). */
export const OUTLINE_FOR = 4000;

const boxOf = (v: unknown): Box | null => Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === "number" && Number.isFinite(n)) ? [v[0], v[1], v[2], v[3]] : null;

type Message = Record<string, unknown>;

export class BoardHost {
  private pageFiles = new Set<string>();
  private load: string | null = null;
  private lastComments = "";
  private viewOnly: boolean;
  state: PageState = {};
  /** Where the open thread's pin is in the frame (the popover's anchor), as the page says. */
  anchor: Anchor | null = null;
  /** The change outlined now, if any (it goes after OUTLINE_FOR). */
  outline: Outline | null = null;
  onOutline: ((o: Outline | null) => void) | null = null;
  private outlineBy: string | null = null;
  private outlineTimer: ReturnType<typeof setTimeout> | null = null;

  onState: ((s: PageState) => void) | null = null;
  /** The page asks for a picture (9, Excalidraw's key for one): the browser's file picker. */
  onPickImage: (() => void) | null = null;
  onAnchor: ((a: Anchor | null) => void) | null = null;
  /** A line to show for a moment: a picture that couldn't go on, an AI's change. */
  onNotice: ((line: string) => void) | null = null;
  /** Who's on the board changed (someone came, went or turned grey), not just where they point:
   *  the page's avatars draw again. */
  onPeople: (() => void) | null = null;
  private people = "";
  /** Following someone (board-follow.ts): the banner, Follow from an avatar. */
  readonly follow: BoardFollow;
  /** Voting and a timer (board-team.ts). */
  readonly team: TeamModel;
  /** The team bar draws again (voting, the totals, the timer). */
  onTeam: (() => void) | null = null;
  /** What the page was last told about votes; a new page has none, so nothing goes while nothing is on. */
  private lastVotes = NO_VOTES;

  constructor(private readonly send: (command: Message) => void, public session: BoardSession, readonly comments: BoardComments, viewOnly: boolean) {
    this.viewOnly = viewOnly;
    comments.viewOnly = viewOnly;
    this.follow = new BoardFollow((c) => { if (this.loaded) this.send(c); });
    this.team = new TeamModel();
    this.team.onPage = () => { this.sendVotes(); this.onTeam?.(); };
    this.team.onChime = () => chime();
    this.wire(session);
    comments.onChange = () => this.sendComments();
  }

  /** Your dots, the totals and whether a click votes, to the page when they changed. */
  sendVotes() {
    if (!this.loaded) return;
    const me = this.team.me;
    const color = me && this.team.myDots.length ? this.session.colorOf(me) : "#2D639A";
    const c = this.team.command(color, this.team.myDots.length ? this.session.darkOf(color) : undefined);
    const j = JSON.stringify(c);
    if (j === this.lastVotes) return;
    this.lastVotes = j;
    this.send(c);
  }

  /** Who may run voting and a timer (whoever can edit) and who may vote (edit or comment). */
  teamRoles() {
    this.team.me = this.session.me;
    this.team.canHost = !this.viewOnly && !!this.session.me;
    this.team.canVote = !!this.session.me && (!this.viewOnly || this.comments.canComment);
  }

  /** Another session for the same board (you joined, or signed out): the page keeps its drawing and
   *  takes the new one's, which merges by Excalidraw's rule. */
  swap(session: BoardSession, viewOnly: boolean) {
    this.session = session;
    this.wire(session);
    this.setViewOnly(viewOnly);
    if (this.loaded) { this.remote(session.scene()); this.peers(session.boardPeers()); this.sendComments(true); }
    session.follow(this.follow.following);
    this.follow.show(session.boardPeople());
  }

  private wire(session: BoardSession) {
    session.onScene = (scene) => this.remote(scene);
    session.onPeers = (peers) => this.peers(peers);
    session.onComments = (list) => this.comments.show(list);
    session.onRefused = (ids, why) => { this.send({ op: "refusePictures", ids }); this.onNotice?.(why); };
    session.onAI = (by, ids) => { this.showChange(by, ids, false); this.onNotice?.(`${by} changed the board`); };
    session.onPeople = (people) => this.follow.show(people);
    session.onLaser = (id, points) => { if (this.loaded) this.send({ op: "laser", id, points }); };
    this.follow.onFollow = (id) => session.follow(id);
    this.comments.onWrite = (changed) => session.commentLocal(changed);
    session.teamNow = () => ({ session: this.team.session(), dots: this.team.dots() });
    session.onTeam = (user, name, team, dots) => this.team.heard(user, name, team, dots);
    session.onLeft = (user) => this.team.left(user);
    this.team.onPublish = () => session.teamChanged();
    this.teamRoles();
  }

  get loaded() { return this.load !== null; }

  /** Editing turned on (you joined) or off (your access changed). */
  setViewOnly(view: boolean) {
    if (view === this.viewOnly) return;
    this.viewOnly = view;
    this.comments.viewOnly = view;
    this.teamRoles();
    if (this.loaded) { this.send({ op: "shared", on: true, viewOnly: view }); this.sendComments(); this.sendVotes(); }
    this.onTeam?.();
  }

  /** The document's drawing, with only the pictures the page doesn't have yet. */
  remote(scene: Scene) {
    if (!this.loaded) return;
    const files: Scene["files"] = {};
    for (const [id, f] of Object.entries(scene.files)) if (!this.pageFiles.has(id)) { files[id] = f; this.pageFiles.add(id); }
    this.send({ op: "remoteScene", scene: { ...scene, files } });
  }

  private peers(list: BoardPeer[]) {
    if (this.loaded) this.send({ op: "peers", peers: list });
    const people = list.map((p) => `${p.id}|${p.name}|${p.color}`).sort().join(",");
    if (people !== this.people) { this.people = people; this.onPeople?.(); }
  }

  private sendComments(force = false) {
    if (!this.loaded) return;
    const c = this.comments.command();
    const j = JSON.stringify(c);
    if (j === this.lastComments && !force) return;
    this.lastComments = j;
    this.send(c);
    if (!this.comments.openThread && !this.comments.draft && this.anchor) { this.anchor = null; this.onAnchor?.(null); }
  }

  /**
   * A change outlined and brought into view, named: an AI's as it lands, or Show change on its
   * reply (`all`: arrows too, as the app's Show change has them). The page moves the view and says
   * where each thing is (its `remote` message), and keeps saying as the view moves.
   */
  showChange(by: string, ids: string[], all = true) {
    if (!this.loaded || !ids.length) return;
    this.outlineBy = by;
    this.send({ op: "outline", ids, all });
  }

  private outlined(r: Record<string, unknown>) {
    const boxes = (Array.isArray(r.boxes) ? r.boxes : []).map(boxOf).filter((b): b is Box => !!b);
    if (r.follow === true) {
      if (!this.outline || !boxes.length) return;
      this.outline = { ...this.outline, boxes };
      this.onOutline?.(this.outline);
      return;
    }
    if (!this.outlineBy || !boxes.length || r.find === true) return;
    this.outline = { by: this.outlineBy, boxes, key: (this.outline?.key ?? 0) + 1 };
    this.onOutline?.(this.outline);
    if (this.outlineTimer) clearTimeout(this.outlineTimer);
    const key = this.outline.key;
    this.outlineTimer = setTimeout(() => { if (this.outline?.key === key) { this.outline = null; this.onOutline?.(null); } }, OUTLINE_FOR);
  }

  /** The page's messages (window.webkit.messageHandlers.amberCanvas in the app). */
  message(m: Message) {
    if (!m || typeof m !== "object") return;
    if (m.remote && typeof m.remote === "object") { this.outlined(m.remote as Record<string, unknown>); return; }
    if (m.board && typeof m.board === "object") {
      const b = m.board as { elements?: unknown; settings?: unknown; files?: unknown };
      const files = b.files && typeof b.files === "object" ? b.files as Record<string, { id?: unknown; dataURL?: unknown; mimeType?: unknown }> : {};
      for (const id of Object.keys(files)) this.pageFiles.add(id);
      if (Array.isArray(b.elements)) void this.session.local(b.elements as Record<string, unknown>[], (b.settings ?? {}) as Record<string, unknown>, files);
      return;
    }
    if (m.presence && typeof m.presence === "object") {
      const p = m.presence as { pointer?: unknown; sel?: unknown; present?: unknown; view?: unknown; laser?: unknown };
      const pointer = Array.isArray(p.pointer) && p.pointer.length === 2 && p.pointer.every((n) => typeof n === "number" && Number.isFinite(n)) ? [p.pointer[0], p.pointer[1]] as [number, number] : null;
      this.session.presence(pointer, Array.isArray(p.sel) ? p.sel.filter((s): s is string => typeof s === "string").slice(0, 500) : []);
      this.session.look(presentingOf(p.present), viewOf(p.view), Array.isArray(p.laser) ? pointsOf(p.laser) : null);
      return;
    }
    // You moved the board yourself (or pressed Escape) while following someone.
    if (m.unfollow === true) { this.follow.stop(); return; }
    if (m.comment && typeof m.comment === "object") { this.comments.fromPage(m.comment as Parameters<BoardComments["fromPage"]>[0]); return; }
    if (m.commentAt && typeof m.commentAt === "object") {
      const a = m.commentAt as Partial<Anchor>;
      const want = this.comments.openThread ?? (this.comments.draft ? "draft" : null);
      if (a.id !== want) return;
      const near = Array.isArray(a.near) ? a.near.map(boxOf).filter((b): b is Box => !!b).slice(0, 80) : [];
      const next = typeof a.x === "number" && typeof a.y === "number" ? { id: a.id as string, x: a.x, y: a.y, width: a.width ?? 24, height: a.height ?? 24, on: boxOf(a.on), near } : null;
      if (JSON.stringify(next) !== JSON.stringify(this.anchor)) { this.anchor = next; this.onAnchor?.(next); }
      return;
    }
    // Voting: a click on a shape, or on one of your dots.
    if (m.vote && typeof m.vote === "object") {
      const v = m.vote as { on?: unknown; off?: unknown };
      if (typeof v.on === "string") { if (!this.team.vote(v.on) && this.team.votingOpen && this.team.votesLeft === 0) this.onNotice?.(votesLeft(0)); }
      else if (typeof v.off === "string") this.team.unvote(v.off);
      return;
    }
    if (m.commentShapes && typeof m.commentShapes === "object") {
      this.comments.shapes = Object.fromEntries(Object.entries(m.commentShapes as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string"));
      this.comments.shapesReported = true;
      this.comments.onChange?.();
      return;
    }
    // 9 on the board: a picture, from the browser's file picker (the app shows its own panel).
    if (m.pickImage === true) { this.onPickImage?.(); return; }
    if ("open" in m || "error" in m || "commentHere" in m) return;
    // Otherwise the page's state.
    const s = m as PageState;
    if (typeof s.load === "string" && s.load !== this.load) {
      // The page is new (first load, or loaded again): everything it shows, again.
      this.load = s.load;
      this.pageFiles.clear();
      this.send({ op: "shared", on: true, viewOnly: this.viewOnly });
      this.remote(this.session.scene());
      this.peers(this.session.boardPeers());
      this.sendComments(true);
      this.follow.reload();
      this.teamRoles();
      this.lastVotes = NO_VOTES;
      this.sendVotes();
    }
    this.state = s;
    this.onState?.(s);
  }

  /** A command from the page's own controls (a tool, undo, zoom). */
  command(c: Message) { if (this.loaded) this.send(c); }
}
