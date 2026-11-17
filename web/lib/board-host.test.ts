// The whiteboard page's side of the canvas, as the app's canvas controller does it
// (PaneTests/Interaction/CanvasSharedTests): what goes to the page when it loads, pictures sent once,
// what the page says going into the session, and comments' pins.
import { describe, expect, it, vi } from "vitest";
import { BoardComments, Seen } from "./board-comments";
import { BoardHost, OUTLINE_FOR } from "./board-host";
import type { BoardSession, Scene } from "./board-session";
import type { BoardPerson } from "./board-follow";

const picture = (id: string) => ({ id, dataURL: "data:image/png;base64,AAAA", mimeType: "image/png", created: 1 });

function fakeSession(scene: Scene) {
  const calls = { local: [] as unknown[][], presence: [] as unknown[][], comments: [] as unknown[], look: [] as unknown[][], follow: [] as unknown[] };
  const s = {
    scene: () => scene,
    boardPeers: () => [{ id: "u2", name: "Sara", color: "#B5445B", pointer: [1, 2] }],
    local: async (...a: unknown[]) => { calls.local.push(a); },
    presence: (...a: unknown[]) => { calls.presence.push(a); },
    commentLocal: (c: unknown) => { calls.comments.push(c); },
    look: (...a: unknown[]) => { calls.look.push(a); },
    follow: (id: unknown) => { calls.follow.push(id); },
    boardPeople: () => [] as BoardPerson[],
    onPeople: null as null | ((p: BoardPerson[]) => void),
    onLaser: null as null | ((id: string, pts: [number, number][]) => void),
    onScene: null as null | ((s: Scene) => void),
    onPeers: null as null | ((p: unknown[]) => void),
    onComments: null as null | ((c: unknown[]) => void),
    onRefused: null as null | ((ids: string[], why: string) => void),
    onAI: null as null | ((by: string, ids: string[]) => void),
  };
  return { s, calls, session: s as unknown as BoardSession };
}

function make(viewOnly = false) {
  const scene: Scene = { elements: [{ id: "a", type: "rectangle" }], appState: { viewBackgroundColor: "#ffffff" }, files: { f1: picture("f1") } } as unknown as Scene;
  const sent: Record<string, unknown>[] = [];
  const f = fakeSession(scene);
  const comments = new BoardComments("b", new Seen(null));
  comments.author = { id: "U1", name: "Emil" };
  const host = new BoardHost((c) => sent.push(c), f.session, comments, viewOnly);
  return { host, sent, ...f, comments, scene };
}

describe("the whiteboard page and its canvas", () => {
  it("sends nothing until the page has loaded; on load: shared mode, the whole drawing, the pointers, the pins", () => {
    const { host, sent } = make(true);
    host.remote({ elements: [], appState: {}, files: {} } as unknown as Scene);
    host.command({ op: "tool", tool: "rectangle" });
    expect(sent).toEqual([]);
    host.message({ load: "1", tool: "selection" });
    expect(sent.map((c) => c.op)).toEqual(["shared", "remoteScene", "peers", "comments"]);
    expect(sent[0]).toEqual({ op: "shared", on: true, viewOnly: true });
    expect((sent[1].scene as Scene).files).toHaveProperty("f1");
    expect(host.state.tool).toBe("selection");
  });

  it("a picture goes to the page once; a page loaded again gets everything again", () => {
    const { host, sent, scene } = make();
    host.message({ load: "1" });
    sent.length = 0;
    host.remote(scene);
    expect((sent[0].scene as Scene).files).toEqual({});
    sent.length = 0;
    host.message({ load: "1", tool: "hand" });
    expect(sent).toEqual([]);
    host.message({ load: "2" });
    expect((sent.find((c) => c.op === "remoteScene")!.scene as Scene).files).toHaveProperty("f1");
  });

  it("a picture the page already has, from the person drawing, isn't sent back", () => {
    const { host, sent, s } = make();
    host.message({ load: "1" });
    host.message({ board: { elements: [{ id: "b" }], settings: {}, files: { f2: picture("f2") } } });
    sent.length = 0;
    s.onScene!({ elements: [], appState: {}, files: { f1: picture("f1"), f2: picture("f2") } } as unknown as Scene);
    expect((sent[0].scene as Scene).files).toEqual({});
  });

  it("what the person draws, and their pointer and selection, go into the session; a bad pointer is no pointer", () => {
    const { host, calls } = make();
    host.message({ load: "1" });
    host.message({ board: { elements: [{ id: "b", type: "ellipse" }], settings: { gridModeEnabled: true } } });
    expect(calls.local).toEqual([[[{ id: "b", type: "ellipse" }], { gridModeEnabled: true }, {}]]);
    host.message({ presence: { pointer: [10, 20], sel: ["b", 3] } });
    host.message({ presence: { pointer: [Infinity, 1], sel: [] } });
    expect(calls.presence).toEqual([[[10, 20], ["b"]], [null, []]]);
  });

  it("following: what the page presents and sees goes into the session; the laser and the view come back to the page", () => {
    const { host, sent, calls, s } = make();
    host.message({ presence: { pointer: [1, 2], sel: [], present: { frame: "f1", i: 0, n: 2 }, view: [0, 0, 800, 600], laser: [[1, 2], ["x", 3]] } });
    host.message({ presence: { pointer: [1, 2], sel: [], present: { i: 9, n: 2 }, view: "x" } });
    expect(calls.look).toEqual([[{ frame: "f1", i: 0, n: 2 }, [0, 0, 800, 600], [[1, 2]]], [null, null, null]]);
    // Nothing reaches a page that hasn't loaded; once it has, the laser and the view do.
    const sara: BoardPerson = { id: "u2", name: "Sara", color: "#B5445B", dark: "#E07A8F", presenting: { frame: "f2", i: 1, n: 2 }, view: null, following: null, stale: false };
    s.onPeople!([sara]);
    host.follow.follow("u2");
    s.onLaser!("u2", [[5, 6]]);
    expect(sent).toEqual([]);
    expect(calls.follow).toEqual(["u2"]);
    host.message({ load: "1" });
    expect(sent.filter((c) => c.op === "follow")).toEqual([{ op: "follow", frame: "f2" }]);
    s.onLaser!("u2", [[5, 6]]);
    expect(sent.at(-1)).toEqual({ op: "laser", id: "u2", points: [[5, 6]] });
    // Moving the board yourself (or Escape) stops it, and tells the others.
    host.message({ unfollow: true });
    expect([host.follow.following, calls.follow.at(-1), sent.at(-1)]).toEqual([null, null, { op: "follow", off: true }]);
  });

  it("joining turns editing on in the page; the same mode again sends nothing", () => {
    const { host, sent } = make(true);
    host.message({ load: "1" });
    sent.length = 0;
    host.setViewOnly(true);
    host.setViewOnly(false);
    expect(sent).toEqual([{ op: "shared", on: true, viewOnly: false }]);
  });

  it("another session (you joined) takes over: the page gets its drawing and pointers, and your comments go to it", () => {
    const { host, sent, comments } = make(true);
    host.message({ load: "1" });
    sent.length = 0;
    const next = fakeSession({ elements: [{ id: "z" }], appState: {}, files: {} } as unknown as Scene);
    host.swap(next.session, false);
    expect(sent.map((c) => c.op)).toEqual(["shared", "remoteScene", "peers", "comments"]);
    comments.canComment = true;
    comments.fromPage({ new: { x: 1, y: 1 } });
    comments.post("hello");
    expect(next.calls.comments.length).toBe(1);
    // Whom you follow carries over to the new session.
    expect(next.calls.follow).toEqual([null]);
  });

  it("the comments' pins go only when they change; a pin click opens its thread; the anchor follows the open one", () => {
    const { host, sent, s, comments } = make();
    host.message({ load: "1" });
    const c = { id: "c-0000000000000001", x: 5, y: 6, by: "U2", name: "Sara", text: "hi", created: "2026-11-15T09:00:00Z", resolved: false, version: 1 };
    sent.length = 0;
    s.onComments!([c]);
    s.onComments!([c]);
    expect(sent.filter((x) => x.op === "comments").length).toBe(1);
    const anchors: unknown[] = [];
    host.onAnchor = (a) => anchors.push(a);
    host.message({ comment: { open: c.id } });
    expect(comments.openThread).toBe(c.id);
    host.message({ commentAt: { id: "someone-else", x: 1, y: 1 } });
    host.message({ commentAt: { id: c.id, x: 100, y: 200, width: 24, height: 24 } });
    expect(anchors).toEqual([{ id: c.id, x: 100, y: 200, width: 24, height: 24, on: null, near: [] }]);
    comments.closeThread();
    expect(anchors.at(-1)).toBeNull();
  });

  it("the page's avatars draw again when someone comes, goes or turns grey, not on every pointer move", () => {
    const { host, s } = make();
    let drawn = 0;
    host.onPeople = () => drawn++;
    host.message({ load: "1" });
    const sara = { id: "u2", name: "Sara", color: "#B5445B", dark: "#E07A8F", sel: [], flag: false, x: 1, y: 2 };
    s.onPeers!([sara]);
    s.onPeers!([{ ...sara, x: 5, y: 9, flag: true }]);
    expect(drawn).toBe(1);
    s.onPeers!([{ ...sara, color: "#8E8E93" }]);
    s.onPeers!([]);
    expect(drawn).toBe(3);
  });

  it("refused pictures and an AI's change are said, and the page is told", () => {
    const { host, sent, s } = make();
    const notices: string[] = [];
    host.onNotice = (l) => notices.push(l);
    host.message({ load: "1" });
    sent.length = 0;
    s.onRefused!(["f9"], "That picture is too big");
    s.onAI!("Sara's Claude", ["a"]);
    expect(sent).toEqual([{ op: "refusePictures", ids: ["f9"] }, { op: "outline", ids: ["a"], all: false }]);
    expect(notices).toEqual(["That picture is too big", "Sara's Claude changed the board"]);
  });

  // Round 15: the browser drew no outline at all (the page's `remote` message was dropped). Show
  // change, and an AI's change as it lands, are outlined with the AI's name, follow the view, and go.
  it("outlines a change by name: a box for each thing, kept up as the view moves, gone after a while", () => {
    vi.useFakeTimers();
    try {
      const { host, sent } = make();
      host.message({ load: "1" });
      sent.length = 0;
      const seen: unknown[] = [];
      host.onOutline = (o) => seen.push(o);
      host.showChange("Claude", ["inbox", "inbox-idea"]);
      expect(sent).toEqual([{ op: "outline", ids: ["inbox", "inbox-idea"], all: true }]);
      host.message({ remote: { x: 10, y: 20, width: 100, height: 200, boxes: [[10, 20, 100, 60], [55, 80, 2, 140]], ids: ["inbox", "inbox-idea"] } });
      expect(host.outline).toMatchObject({ by: "Claude", boxes: [[10, 20, 100, 60], [55, 80, 2, 140]] });
      host.message({ remote: { follow: true, boxes: [[30, 20, 100, 60], [75, 80, 2, 140]] } });
      expect(host.outline?.boxes[0]).toEqual([30, 20, 100, 60]);
      vi.advanceTimersByTime(OUTLINE_FOR + 10);
      expect(host.outline).toBeNull();
      expect(seen.at(-1)).toBeNull();
      // A search's match isn't an AI's change.
      host.message({ remote: { boxes: [[1, 2, 3, 4]], find: true } });
      expect(host.outline).toBeNull();
    } finally { vi.useRealTimers(); }
  });

  it("keeps what's round the open pin, for the thread to open clear of it", () => {
    const { host, comments } = make();
    host.message({ load: "1" });
    comments.show([{ id: "c1", x: 1, y: 0, on: "a", by: "U2", name: "Sara", text: "Hi", created: "2026-11-15T09:00:00Z", resolved: false, version: 1 }]);
    comments.openThread = "c1";
    host.message({ commentAt: { id: "c1", x: 40, y: 50, width: 24, height: 24, on: [30, 60, 200, 100], near: [[300, 60, 80, 80], ["x"]] } });
    expect(host.anchor).toEqual({ id: "c1", x: 40, y: 50, width: 24, height: 24, on: [30, 60, 200, 100], near: [[300, 60, 80, 80]] });
  });
});
