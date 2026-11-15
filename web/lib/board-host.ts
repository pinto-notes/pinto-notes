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
import type { BoardPeer, BoardSession, Scene } from "./board-session";

/** What the page says about itself (canvas.jsx stateOf); only what the page here reads. */
export type PageState = {
  tool?: string; selection?: string[]; zoom?: number; canUndo?: boolean; canRedo?: boolean; empty?: boolean; load?: string;
  editing?: boolean; busy?: boolean; style?: Record<string, unknown>; bounds?: { x: number; y: number; width: number; height: number } | null;
};

export type Anchor = { id: string; x: number; y: number; width: number; height: number };

type Message = Record<string, unknown>;

export class BoardHost {
  private pageFiles = new Set<string>();
  private load: string | null = null;
  private lastComments = "";
  private viewOnly: boolean;
  state: PageState = {};
  /** Where the open thread's pin is in the frame (the popover's anchor), as the page says. */
  anchor: Anchor | null = null;

  onState: ((s: PageState) => void) | null = null;
  onAnchor: ((a: Anchor | null) => void) | null = null;
  /** A line to show for a moment: a picture that couldn't go on, an AI's change. */
  onNotice: ((line: string) => void) | null = null;

  constructor(private readonly send: (command: Message) => void, public session: BoardSession, readonly comments: BoardComments, viewOnly: boolean) {
    this.viewOnly = viewOnly;
    this.wire(session);
    comments.onChange = () => this.sendComments();
  }

  /** Another session for the same board (you joined, or signed out): the page keeps its drawing and
   *  takes the new one's, which merges by Excalidraw's rule. */
  swap(session: BoardSession, viewOnly: boolean) {
    this.session = session;
    this.wire(session);
    this.setViewOnly(viewOnly);
    if (this.loaded) { this.remote(session.scene()); this.peers(session.boardPeers()); this.sendComments(true); }
  }

  private wire(session: BoardSession) {
    session.onScene = (scene) => this.remote(scene);
    session.onPeers = (peers) => this.peers(peers);
    session.onComments = (list) => this.comments.show(list);
    session.onRefused = (ids, why) => { this.send({ op: "refusePictures", ids }); this.onNotice?.(why); };
    session.onAI = (by, ids) => { this.send({ op: "outline", ids }); this.onNotice?.(`${by} changed the board`); };
    this.comments.onWrite = (changed) => session.commentLocal(changed);
  }

  get loaded() { return this.load !== null; }

  /** Editing turned on (you joined) or off (your access changed). */
  setViewOnly(view: boolean) {
    if (view === this.viewOnly) return;
    this.viewOnly = view;
    if (this.loaded) this.send({ op: "shared", on: true, viewOnly: view });
  }

  /** The document's drawing, with only the pictures the page doesn't have yet. */
  remote(scene: Scene) {
    if (!this.loaded) return;
    const files: Scene["files"] = {};
    for (const [id, f] of Object.entries(scene.files)) if (!this.pageFiles.has(id)) { files[id] = f; this.pageFiles.add(id); }
    this.send({ op: "remoteScene", scene: { ...scene, files } });
  }

  private peers(list: BoardPeer[]) { if (this.loaded) this.send({ op: "peers", peers: list }); }

  private sendComments(force = false) {
    if (!this.loaded) return;
    const c = this.comments.command();
    const j = JSON.stringify(c);
    if (j === this.lastComments && !force) return;
    this.lastComments = j;
    this.send(c);
    if (!this.comments.openThread && !this.comments.draft && this.anchor) { this.anchor = null; this.onAnchor?.(null); }
  }

  /** The page's messages (window.webkit.messageHandlers.amberCanvas in the app). */
  message(m: Message) {
    if (!m || typeof m !== "object") return;
    if (m.board && typeof m.board === "object") {
      const b = m.board as { elements?: unknown; settings?: unknown; files?: unknown };
      const files = b.files && typeof b.files === "object" ? b.files as Record<string, { id?: unknown; dataURL?: unknown; mimeType?: unknown }> : {};
      for (const id of Object.keys(files)) this.pageFiles.add(id);
      if (Array.isArray(b.elements)) void this.session.local(b.elements as Record<string, unknown>[], (b.settings ?? {}) as Record<string, unknown>, files);
      return;
    }
    if (m.presence && typeof m.presence === "object") {
      const p = m.presence as { pointer?: unknown; sel?: unknown };
      const pointer = Array.isArray(p.pointer) && p.pointer.length === 2 && p.pointer.every((n) => typeof n === "number" && Number.isFinite(n)) ? [p.pointer[0], p.pointer[1]] as [number, number] : null;
      this.session.presence(pointer, Array.isArray(p.sel) ? p.sel.filter((s): s is string => typeof s === "string").slice(0, 500) : []);
      return;
    }
    if (m.comment && typeof m.comment === "object") { this.comments.fromPage(m.comment as Parameters<BoardComments["fromPage"]>[0]); return; }
    if (m.commentAt && typeof m.commentAt === "object") {
      const a = m.commentAt as Partial<Anchor>;
      const want = this.comments.openThread ?? (this.comments.draft ? "draft" : null);
      if (a.id !== want) return;
      const next = typeof a.x === "number" && typeof a.y === "number" ? { id: a.id as string, x: a.x, y: a.y, width: a.width ?? 24, height: a.height ?? 24 } : null;
      if (JSON.stringify(next) !== JSON.stringify(this.anchor)) { this.anchor = next; this.onAnchor?.(next); }
      return;
    }
    if (m.commentShapes && typeof m.commentShapes === "object") {
      this.comments.shapes = Object.fromEntries(Object.entries(m.commentShapes as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string"));
      this.comments.onChange?.();
      return;
    }
    if ("remote" in m || "open" in m || "error" in m || "commentHere" in m) return;
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
    }
    this.state = s;
    this.onState?.(s);
  }

  /** A command from the page's own controls (a tool, undo, zoom). */
  command(c: Message) { if (this.loaded) this.send(c); }
}
