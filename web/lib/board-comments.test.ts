// A shared whiteboard's comments in the browser, as the app's canvas controller handles them
// (PaneTests/Interaction/BoardCommentsTests and CanvasCommentTests): writing, editing, deleting,
// resolving, mentions, what's unseen, and the pins the page draws.
import { describe, expect, it } from "vitest";
import { BoardComments, clean, DELETED_LINE, ON_BOARD, ON_SHAPE, RESOLVED_LINE, Seen } from "./board-comments";
import type { Comment } from "./board-doc";

const ME = "11111111-AAAA-4AAA-8AAA-111111111111", SARA = "22222222-BBBB-4BBB-8BBB-222222222222";

class Memory {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

function make(store = new Memory()) {
  const c = new BoardComments("board-1", new Seen(store));
  c.author = { id: ME, name: "Emil" };
  c.mentionable = [{ id: SARA, name: "Sara" }];
  c.canComment = true;
  c.colorOf = (u) => (u.toLowerCase() === SARA.toLowerCase() ? "#B5445B" : "#2D639A");
  const written: Comment[][] = [];
  const confirmed: [string, () => void][] = [];
  c.onWrite = (w) => written.push(w);
  c.onConfirm = (line, undo) => confirmed.push([line, undo]);
  c.now = () => new Date("2026-11-15T10:00:00.250Z");
  return { c, written, confirmed, store };
}

const theirs = (over: Partial<Comment> = {}): Comment => ({
  id: "c-sara0000000000001", x: 40, y: 80, by: SARA, name: "Sara", text: "Looks good", created: "2026-11-15T09:00:00Z", resolved: false, version: 1, ...over,
});

describe("whiteboard comments in the browser", () => {
  it("cleans what's posted: trimmed, never empty, at most 5000 characters", () => {
    expect(clean("  hi  ")).toBe("hi");
    expect(clean(" \n ")).toBeNull();
    expect([...clean("é".repeat(6000))!].length).toBe(5000);
  });

  it("a new comment goes where the Comment tool put it, by you in upper case, its mention by id, and its thread stays open", () => {
    const { c, written } = make();
    c.fromPage({ new: { x: 12, y: 34, on: "shape-1" } });
    expect(c.command()).toMatchObject({ op: "comments", open: "draft", draft: { x: 12, y: 34, on: "shape-1" }, can: true });
    const posted = c.post("  @Sara does this read right?  ")!;
    expect(posted).toMatchObject({ x: 12, y: 34, on: "shape-1", by: ME, name: "Emil", text: "@Sara does this read right?", version: 1, resolved: false, created: "2026-11-15T10:00:00Z" });
    expect(posted.mentions).toEqual([SARA]);
    expect(posted.id).toMatch(/^c-[0-9a-f]{16}$/);
    expect(written).toEqual([[posted]]);
    expect(c.openThread).toBe(posted.id);
    expect(c.draft).toBeNull();
  });

  it("a viewer can't place or post a comment", () => {
    const { c, written } = make();
    c.canComment = false;
    c.fromPage({ new: { x: 1, y: 2 } });
    expect(c.draft).toBeNull();
    expect(c.post("hello")).toBeNull();
    c.show([theirs()]);
    expect(c.reply(theirs().id, "hi")).toBeNull();
    expect(written).toEqual([]);
  });

  it("a reply joins the thread; a reply to a thread that isn't there goes nowhere", () => {
    const { c, written } = make();
    c.show([theirs()]);
    const r = c.reply(theirs().id, "Yes, @Sara it does")!;
    expect(r).toMatchObject({ thread: theirs().id, x: 1, y: 0, by: ME, mentions: [SARA] });
    expect(c.threads[0].replies.map((x) => x.id)).toEqual([r.id]);
    expect(c.reply("c-nothere00000000", "hi")).toBeNull();
    expect(written.length).toBe(1);
  });

  it("an edit of your own: a higher version, stamped edited, its mentions read again; someone else's can't be", () => {
    const { c } = make();
    c.show([theirs()]);
    expect(c.edit(theirs().id, "changed")).toBeNull();
    c.fromPage({ new: { x: 0, y: 0 } });
    const mine = c.post("@Sara look")!;
    const edited = c.edit(mine.id, "Never mind")!;
    expect(edited).toMatchObject({ version: 2, text: "Never mind", edited: "2026-11-15T10:00:00Z" });
    expect(edited.mentions).toBeUndefined();
    expect(c.edit(mine.id, "Never mind")).toBeNull();
  });

  it("a delete keeps no words; a thread start with replies stays as Comment deleted; Undo brings it back", () => {
    const { c, confirmed } = make();
    c.fromPage({ new: { x: 0, y: 0 } });
    const mine = c.post("@Sara first")!;
    c.show([...c.comments, theirs({ id: "c-sara0000000000002", thread: mine.id, x: 1, y: 0, created: "2026-11-15T11:00:00Z" })]);
    c.delete(mine.id);
    const gone = c.comments.find((x) => x.id === mine.id)!;
    expect(gone).toMatchObject({ deleted: true, text: "", version: 2 });
    expect(gone.mentions).toBeUndefined();
    expect(c.threads.map((t) => t.first.id)).toEqual([mine.id]);
    expect(confirmed.at(-1)![0]).toBe(DELETED_LINE);
    confirmed.at(-1)![1]();
    expect(c.comments.find((x) => x.id === mine.id)).toMatchObject({ deleted: false, text: "@Sara first", version: 3, mentions: [SARA] });
  });

  it("a lone thread start, deleted, leaves the board and closes", () => {
    const { c } = make();
    c.fromPage({ new: { x: 0, y: 0 } });
    const mine = c.post("hello")!;
    c.delete(mine.id);
    expect(c.threads).toEqual([]);
    expect(c.openThread).toBeNull();
  });

  it("resolving takes the pin off the board and keeps the thread, with Undo; the open thread's pin stays shown", () => {
    const { c, confirmed } = make();
    c.show([theirs()]);
    c.open(theirs().id);
    c.resolve(theirs().id);
    expect(c.comments[0]).toMatchObject({ resolved: true, version: 2 });
    expect(c.openThread).toBeNull();
    expect(c.pins).toEqual([]);
    expect(confirmed.at(-1)![0]).toBe(RESOLVED_LINE);
    c.open(theirs().id);
    expect(c.pins.map((p) => p.id)).toEqual([theirs().id]);
    confirmed.at(-1)![1]();
    expect(c.comments[0]).toMatchObject({ resolved: false, version: 3 });
  });

  it("pins are in each writer's colour, an AI's in graphite, with the writer's letter", () => {
    const { c } = make();
    c.darkOf = (col) => (col === "#48484A" ? "#D1D1D6" : undefined);
    c.show([theirs({ on: "shape-9" }), theirs({ id: "c-ai00000000000001", ai: "Claude", created: "2026-11-15T09:30:00Z" })]);
    expect(c.pins).toEqual([
      { id: theirs().id, on: "shape-9", x: 40, y: 80, color: "#B5445B", letter: "S", open: false },
      { id: "c-ai00000000000001", x: 40, y: 80, color: "#48484A", dark: "#D1D1D6", letter: "C", open: false },
    ]);
    expect(c.byline(c.comments[1])).toBe("Sara's Claude");
    expect(c.command().shapes).toEqual(["shape-9"]);
  });

  it("says where a thread is: on the board, on a named shape, on a shape", () => {
    const { c } = make();
    c.shapes = { "shape-1": "Idea" };
    c.show([theirs(), theirs({ id: "c-sara0000000000003", on: "shape-1" }), theirs({ id: "c-sara0000000000004", on: "shape-2" })]);
    expect(c.threads.map((t) => c.place(t))).toEqual([ON_BOARD, "on Idea", ON_SHAPE]);
  });

  it("your own comments are yours whichever case the app wrote your id in", () => {
    const { c } = make();
    const lower = theirs({ by: ME.toLowerCase(), name: "Emil" });
    expect(c.isMine(lower)).toBe(true);
    expect(c.byline(lower)).toBe("Emil");
    expect(c.names([ME.toLowerCase(), SARA])).toEqual(["Emil", "Sara"]);
  });

  it("someone else's new comment shows the dot until you look; the first look at a board counts what's there as seen", () => {
    const store = new Memory();
    const { c } = make(store);
    c.show([theirs()]);
    expect(c.unseen).toBe(false);
    c.show([theirs(), theirs({ id: "c-sara0000000000005", created: "2026-11-15T09:10:00Z" })]);
    expect(c.unseen).toBe(true);
    c.markSeen();
    expect(c.unseen).toBe(false);
    // Kept in this browser: a page opened later remembers.
    const again = make(store).c;
    again.show([theirs(), theirs({ id: "c-sara0000000000005" }), theirs({ id: "c-sara0000000000006" })]);
    expect(again.unseen).toBe(true);
  });

  it("a mention of you keeps the dot until its thread is opened, and an edit of it brings it back", () => {
    const { c } = make();
    const ask = theirs({ text: "@Emil a look?", mentions: [ME] });
    c.show([ask]);
    c.markSeen();
    expect(c.unreadMention(c.threads[0])).toBe(true);
    expect(c.unseen).toBe(true);
    c.open(ask.id);
    expect(c.unseen).toBe(false);
    c.show([{ ...ask, version: 2, text: "@Emil a look, please?" }]);
    expect(c.unreadMention(c.threads[0])).toBe(true);
  });

  it("a thread that goes while it's open closes", () => {
    const { c } = make();
    c.show([theirs()]);
    c.open(theirs().id);
    c.show([]);
    expect(c.openThread).toBeNull();
  });

  it("the comments command names you by your letter and colour", () => {
    const { c } = make();
    expect(c.command().me).toMatchObject({ id: "me", color: "#2D639A", letter: "E" });
  });
});
