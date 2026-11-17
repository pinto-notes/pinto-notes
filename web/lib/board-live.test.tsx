// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIVE, liveDelay, livePath, nextBoard, versionURL, type BoardMeta } from "./board-live";
import { NotePage } from "./NotePage";
import { boardPicture, type SharedNote } from "./shared";

vi.mock("next/navigation", () => ({ usePathname: () => "/n/x", useRouter: () => ({ push: () => {} }), notFound: () => { throw new Error("not found"); } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SLUG = "boardBOARDboardBOARDboar";
const BASE = "https://db.example.co";
const board: SharedNote = {
  title: "Launch plan", body: "Launch plan\n\nIdea\n\nReady?", updated_at: "2026-11-14T10:00:00Z",
  include_subnotes: false, is_sub: false, root_title: "Launch plan", subnotes: [],
  shared_by: { name: "Emil W", email: null, avatar: null },
  picture: { width: 2228, height: 809, version: 100 },
  scene: { size: 5120, version: 200 },
};
const meta = (over: Partial<BoardMeta> = {}): BoardMeta => ({
  title: "Launch plan", updated_at: "2026-11-14T10:00:00Z", alt: "Whiteboard drawing: Idea, Ready?",
  picture: { version: 100, width: 2228, height: 809 }, scene: { version: 200, size: 5120 }, ...over,
});
const pictureAt = (v: number) => `${BASE}/functions/v1/share-files?slug=${SLUG}&picture=${v}`;
const sceneAt = (v: number) => `${BASE}/functions/v1/share-files?slug=${SLUG}&scene=${v}`;

/** Images the page preloads: each loads (or fails) when the test says so. */
class FakeImage {
  static made: FakeImage[] = [];
  src = "";
  referrerPolicy = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() { FakeImage.made.push(this); }
}

let answers: (() => Response)[] = [];
let fetched: string[] = [];
let visibility: DocumentVisibilityState = "visible";
let root: Root | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  FakeImage.made = [];
  fetched = [];
  answers = [];
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    fetched.push(String(url));
    const next = answers.length > 1 ? answers.shift()! : answers[0];
    return next ? next() : Response.json(meta());
  }));
});
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function render(note: SharedNote = board) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(<NotePage slug={SLUG} note={note} files={{}} board={boardPicture(SLUG, note, BASE)} />));
}
const wait = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const img = () => document.querySelector("main figure img");
const byline = () => document.querySelector("main p")!.textContent ?? "";
const setVisibility = (v: DocumentVisibilityState) => act(async () => {
  visibility = v;
  document.dispatchEvent(new Event("visibilitychange"));
  await vi.advanceTimersByTimeAsync(0);
});

// The board's page said "View only. Reload to see the latest changes.": a viewer had to reload to
// see the board as its owner drew it. The page now follows the board while it's open.
describe("a shared whiteboard's open page follows the board", () => {
  it("asks for the board every 5 s while visible, at its own address, never cached", async () => {
    render();
    expect(fetched).toEqual([]);
    await wait(LIVE.fast);
    expect(fetched).toEqual([`/api/shared/${SLUG}`]);
    expect((fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    await wait(LIVE.fast * 3);
    expect(fetched.length).toBe(4);
    expect(livePath("a b")).toBe("/api/shared/a%20b");
    expect(byline()).toContain("View only. Changes show here as they’re made.");
  });

  it("loads a new version first, then swaps it in with its size, date, file and a quiet note", async () => {
    render();
    expect(img()?.getAttribute("src")).toBe(pictureAt(100));
    answers = [() => Response.json(meta({ updated_at: "2026-11-15T09:00:00Z", picture: { version: 101, width: 1600, height: 1200 }, scene: { version: 201, size: 6000 } }))];
    await wait(LIVE.fast);
    // Preloading: the old picture stays until the new one has loaded.
    expect(FakeImage.made.map((i) => i.src)).toEqual([pictureAt(101)]);
    expect(FakeImage.made[0].referrerPolicy).toBe("no-referrer");
    expect(img()?.getAttribute("src")).toBe(pictureAt(100));
    expect(byline()).not.toContain("Updated just now");
    // Asking again while it loads doesn't load it twice.
    await wait(LIVE.fast);
    expect(FakeImage.made.length).toBe(1);

    const before = img();
    act(() => FakeImage.made[0].onload!());
    expect(img()).toBe(before);
    expect(img()?.getAttribute("src")).toBe(pictureAt(101));
    expect([img()?.getAttribute("width"), img()?.getAttribute("height")]).toEqual(["800", "600"]);
    expect(document.querySelector("main figure a:has(img)")?.getAttribute("href")).toBe(pictureAt(101));
    expect(document.querySelector("main figure figcaption a")?.getAttribute("href")).toBe(sceneAt(201));
    expect(byline()).toContain("Edited 15 November 2026");
    expect(byline()).toContain("Updated just now");
    expect(document.querySelector("[role=status]")?.textContent).toBe(" · Updated just now");
    expect(img()?.className).toMatch(/freshA/);
    // For a few seconds.
    await wait(LIVE.shownFor);
    expect(byline()).not.toContain("Updated just now");
    expect(byline()).toContain("Edited 15 November 2026");

    // The next one plays the fade again.
    answers = [() => Response.json(meta({ picture: { version: 102, width: 1600, height: 1200 } }))];
    await wait(LIVE.fast);
    act(() => FakeImage.made.at(-1)!.onload!());
    expect(img()?.getAttribute("src")).toBe(pictureAt(102));
    expect(img()?.className).toMatch(/freshB/);
  });

  it("keeps the picture it shows when a new one fails to load, and tries again", async () => {
    render();
    answers = [() => Response.json(meta({ picture: { version: 101, width: 2228, height: 809 } }))];
    await wait(LIVE.fast);
    act(() => FakeImage.made[0].onerror!());
    expect(img()?.getAttribute("src")).toBe(pictureAt(100));
    await wait(LIVE.fast);
    expect(FakeImage.made.length).toBe(2);
    act(() => FakeImage.made[1].onload!());
    expect(img()?.getAttribute("src")).toBe(pictureAt(101));
  });

  it("updates the title when the board is renamed", async () => {
    render();
    answers = [() => Response.json(meta({ title: "Launch plan v2", updated_at: "2026-11-14T11:00:00Z" }))];
    await wait(LIVE.fast);
    expect(document.querySelector("h1")?.textContent).toBe("Launch plan v2");
    expect(document.title).toBe("Launch plan v2 · Pinto Notes");
    expect(img()?.getAttribute("src")).toBe(pictureAt(100));
  });

  it("says the board is no longer shared when its link stops, and stops asking", async () => {
    render();
    answers = [() => Response.json({ error: "not_found" }, { status: 404 })];
    await wait(LIVE.fast);
    expect(img()).toBeNull();
    expect(document.querySelector("main figure")).toBeNull();
    expect(document.body.textContent).toContain("This whiteboard is no longer shared.");
    expect(byline()).not.toContain("View only");
    const asked = fetched.length;
    await wait(LIVE.slow * 4);
    expect(fetched.length).toBe(asked);
  });

  it("keeps the picture through a failed ask (offline, server error) and asks again", async () => {
    render();
    answers = [() => { throw new TypeError("offline"); }, () => Response.json({ error: "unavailable" }, { status: 503 }), () => Response.json(meta())];
    await wait(LIVE.fast * 3);
    expect(fetched.length).toBe(3);
    expect(img()?.getAttribute("src")).toBe(pictureAt(100));
    expect(document.body.textContent).not.toContain("no longer shared");
  });

  it("stops asking while the tab is hidden, and asks at once when it's back", async () => {
    render();
    await wait(LIVE.fast);
    expect(fetched.length).toBe(1);
    await setVisibility("hidden");
    await wait(LIVE.slow * 10);
    expect(fetched.length).toBe(1);
    await setVisibility("visible");
    expect(fetched.length).toBe(2);
    await wait(LIVE.fast);
    expect(fetched.length).toBe(3);
  });

  it("asks every 30 s once nothing has changed for 10 minutes, and every 5 s again after a change", async () => {
    expect([liveDelay(0), liveDelay(LIVE.quietAfter - 1), liveDelay(LIVE.quietAfter)]).toEqual([LIVE.fast, LIVE.fast, LIVE.slow]);
    render();
    await wait(LIVE.quietAfter);
    const quiet = fetched.length;
    expect(quiet).toBe(LIVE.quietAfter / LIVE.fast);
    await wait(LIVE.slow);
    expect(fetched.length).toBe(quiet + 1);
    answers = [() => Response.json(meta({ updated_at: "2026-11-14T12:00:00Z", picture: { version: 101, width: 2228, height: 809 } }))];
    await wait(LIVE.slow);
    act(() => FakeImage.made[0].onload!());
    answers = [() => Response.json(meta({ updated_at: "2026-11-14T12:00:00Z", picture: { version: 101, width: 2228, height: 809 } }))];
    const after = fetched.length;
    await wait(LIVE.fast * 2);
    expect(fetched.length).toBe(after + 2);
  });

  it("leaves a note's page alone", async () => {
    render({ ...board, title: "Trip", body: "Trip\n\nDay one", picture: null, scene: null });
    await wait(LIVE.slow * 4);
    expect(fetched).toEqual([]);
    expect(document.body.textContent).not.toContain("View only");
  });

  it("builds a version's addresses from the picture's", () => {
    expect(versionURL(pictureAt(100), "picture", 101)).toBe(pictureAt(101));
    expect(versionURL(pictureAt(100), "scene", 7.9)).toBe(sceneAt(7));
    const b = boardPicture(SLUG, board, BASE)!;
    expect(nextBoard(b, meta({ picture: null }))).toBeNull();
    expect(nextBoard(b, meta({ scene: null }))?.download).toBeNull();
    expect(nextBoard(b, meta({ alt: "Whiteboard drawing: New" }))?.alt).toBe("Whiteboard drawing: New");
  });

  it("fades a new picture in only when motion is welcome", () => {
    const css = readFileSync(join(process.cwd(), "lib", "note-page.module.css"), "utf8");
    const animations = [...css.matchAll(/animation: boardFresh/g)].map((m) => m.index!);
    expect(animations.length).toBe(2);
    const block = css.indexOf("@media (prefers-reduced-motion: no-preference) {\n  .board img.freshA");
    expect(block).toBeGreaterThan(0);
    const end = css.indexOf("\n}", block);
    for (const at of animations) expect(at > block && at < end).toBe(true);
  });
});

describe("what an open board's page asks (app/api/shared/[slug])", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  async function ask(rpc: () => Response) {
    vi.stubEnv("SUPABASE_URL", BASE);
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    vi.stubGlobal("fetch", vi.fn(async () => rpc()));
    vi.resetModules();
    const { GET } = await import("../app/api/shared/[slug]/route");
    return GET(new Request(`http://site/api/shared/${SLUG}`), { params: Promise.resolve({ slug: SLUG }) });
  }

  it("answers the board's versions, title and date, never its text, never cached", async () => {
    const res = await ask(() => Response.json(board));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      title: "Launch plan", updated_at: "2026-11-14T10:00:00Z", alt: "Whiteboard drawing: Idea, Ready?",
      picture: { version: 100, width: 2228, height: 809 }, scene: { version: 200, size: 5120 },
    });
  });

  it("is a 404 when the link no longer shows anything, and a 503 when it couldn't ask", async () => {
    expect((await ask(() => Response.json(null))).status).toBe(404);
    expect((await ask(() => new Response("boom", { status: 500 }))).status).toBe(503);
    expect((await ask(() => { throw new TypeError("offline"); })).status).toBe(503);
  });
});
