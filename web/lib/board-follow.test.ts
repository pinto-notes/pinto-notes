// Following someone on a shared board in the browser (board-follow.ts): the banner, who follows
// whom, and where the page's view goes, as the app does it (Pane/Collab/BoardFollow.swift).
import { describe, expect, it } from "vitest";
import { banner, BoardFollow, type BoardPerson, followers, followersLine, pointsOf, presenter, presentingOf, step, target, viewOf, words } from "./board-follow";

const SARA = "22222222-2222-4222-8222-222222222222", MIA = "33333333-3333-4333-8333-333333333333", ME = "11111111-1111-4111-8111-111111111111";
const person = (id: string, name: string, over: Partial<BoardPerson> = {}): BoardPerson => ({
  id, name, color: "#2D6E36", dark: "#4BA35A", presenting: null, view: null, following: null, stale: false, ...over,
});

describe("following someone on a shared board", () => {
  it("reads what presence carries, and leaves out anything malformed", () => {
    expect(presentingOf({ frame: "f1", i: 0, n: 3 })).toEqual({ frame: "f1", i: 0, n: 3 });
    expect(presentingOf({ frame: null, i: 0, n: 1 })).toEqual({ frame: null, i: 0, n: 1 });
    for (const bad of [{ frame: "", i: 0, n: 1 }, { i: 3, n: 3 }, { i: -1, n: 2 }, { i: 0.5, n: 2 }, { i: 0, n: 0 }, "f1", null]) expect(presentingOf(bad)).toBeNull();
    expect(viewOf([1, 2, 300, 200])).toEqual([1, 2, 300, 200]);
    for (const bad of [[1, 2, 0, 200], [1, 2, 3], [1, 2, NaN, 4], "x", null]) expect(viewOf(bad)).toBeNull();
    expect(pointsOf([[1, 2], [3, "4"], [5, 6, 7], [8, 9]])).toEqual([[1, 2], [8, 9]]);
    expect(pointsOf(Array.from({ length: 500 }, (_, i) => [i, i])).length).toBe(120);
  });

  it("says who presents, then whom you follow; nothing while you present yourself", () => {
    const sara = person(SARA, "Sara", { presenting: { frame: "f1", i: 0, n: 2 } }), mia = person(MIA, "Mia");
    expect(banner([mia], null)).toBeNull();
    expect(banner([mia, sara], null)).toMatchObject({ kind: "presenting", line: "Sara is presenting", action: "Follow" });
    expect(banner([mia, sara], null, true)).toBeNull();
    expect(banner([mia, sara], MIA)).toMatchObject({ kind: "following", line: "Following Mia", action: "Stop following" });
    // Someone not heard from isn't offered; of two presenting, every device picks the same one.
    expect(presenter([{ ...sara, stale: true }])).toBeNull();
    expect(presenter([person(MIA, "Mia", { presenting: { frame: null, i: 0, n: 1 } }), sara])?.name).toBe("Sara");
  });

  it("names the frame and the step in the banner, as the app does (round 14)", () => {
    const names: Record<string, string> = { f2: "Launch" };
    const name = (id: string) => names[id];
    const b = banner([person(SARA, "Sara", { presenting: { frame: "f2", i: 1, n: 4 } })], null)!;
    expect(words(b, name)).toBe("Sara is presenting · Launch · 2 of 4");
    expect(step(b, () => undefined)).toBe("2 of 4");
    expect(words(banner([person(SARA, "Sara", { presenting: { frame: "f2", i: 0, n: 1 } })], null)!, name)).toBe("Sara is presenting · Launch");
    expect(words(banner([person(SARA, "Sara", { presenting: { frame: null, i: 0, n: 1 } })], null)!, name)).toBe("Sara is presenting");
    const following = banner([person(SARA, "Sara", { presenting: { frame: "f2", i: 2, n: 4 } })], SARA)!;
    expect(words(following, name)).toBe("Following Sara · Launch · 3 of 4");
    expect(words(banner([person(MIA, "Mia")], MIA)!, name)).toBe("Following Mia");
  });

  it("tells the presenter who follows", () => {
    const list = [person(SARA, "Sara", { following: ME }), person(MIA, "Mia", { following: ME }), person("44444444-4444-4444-8444-444444444444", "Ola", { following: ME, stale: true })];
    expect(followersLine(followers(ME, list.slice(0, 1)))).toBe("Sara is following");
    expect(followersLine(followers(ME, list))).toBe("2 following");
    expect(followersLine(followers(ME, []))).toBeNull();
    expect(followers(null, list)).toEqual([]);
  });

  it("moves the view to the frame on show, the whole board without frames, else what they see", () => {
    expect(target(person(SARA, "Sara", { presenting: { frame: "f2", i: 1, n: 3 } }))).toEqual({ op: "follow", frame: "f2" });
    expect(target(person(SARA, "Sara", { presenting: { frame: null, i: 0, n: 1 } }))).toEqual({ op: "follow", whole: true });
    expect(target(person(SARA, "Sara", { view: [0, 10, 800, 600] }))).toEqual({ op: "follow", view: [0, 10, 800, 600] });
    expect(target(person(SARA, "Sara"))).toBeNull();
  });

  it("follows a presenter frame by frame until her Done; an avatar's follow lasts until they go", () => {
    const sent: Record<string, unknown>[] = [], told: (string | null)[] = [];
    const f = new BoardFollow((c) => sent.push(c));
    f.onFollow = (id) => told.push(id);
    const at = (frame: string | null, i: number) => person(SARA, "Sara", { presenting: { frame, i, n: 3 }, view: [0, 0, 100, 100] });
    f.show([at("f1", 0)]);
    f.follow(SARA);
    expect([told, sent]).toEqual([[SARA], [{ op: "follow", frame: "f1" }]]);
    // The same step again sends nothing; the next step moves the view.
    f.show([at("f1", 0)]);
    f.show([at("f2", 1)]);
    expect(sent).toEqual([{ op: "follow", frame: "f1" }, { op: "follow", frame: "f2" }]);
    expect(f.banner?.kind).toBe("following");
    // A page loaded again is told again.
    f.reload();
    expect(sent.at(-1)).toEqual({ op: "follow", frame: "f2" });
    // Her Done ends it, where it is.
    f.show([person(SARA, "Sara", { view: [0, 0, 100, 100] })]);
    expect([f.following, told.at(-1), sent.at(-1)]).toEqual([null, null, { op: "follow", off: true }]);

    // From her avatar: her view, as she moves it, past a presentation, until she leaves.
    f.follow(SARA);
    expect(sent.at(-1)).toEqual({ op: "follow", view: [0, 0, 100, 100] });
    f.show([person(SARA, "Sara", { view: [50, 0, 100, 100] })]);
    expect(sent.at(-1)).toEqual({ op: "follow", view: [50, 0, 100, 100] });
    f.show([at("f3", 2)]);
    f.show([person(SARA, "Sara", { view: [60, 0, 100, 100] })]);
    expect([f.following, sent.at(-1)]).toEqual([SARA, { op: "follow", view: [60, 0, 100, 100] }]);
    f.show([]);
    expect([f.following, told.at(-1)]).toEqual([null, null]);
    // Stop when nobody's followed does nothing.
    const n = sent.length;
    f.stop();
    expect(sent.length).toBe(n);
  });
});
