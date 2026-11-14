// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotePage } from "./NotePage";
import { boardAlt, boardPicture, boardWords, isBoard, picturePath, scenePath, type SharedNote } from "./shared";

vi.mock("next/navigation", () => ({ usePathname: () => "/n/x", useRouter: () => ({ push: () => {} }), notFound: () => { throw new Error("not found"); } }));

const doc = (el: React.ReactElement) => new DOMParser().parseFromString(`<!doctype html><body>${renderToStaticMarkup(el)}</body>`, "text/html");

const SLUG = "boardBOARDboardBOARDboar";
const BASE = "https://db.example.co";
// What shared_note answers for a whiteboard: the app's copy (its title, then its words, escaped)
// and the picture the device published (20261114210000_share_board_picture.sql).
const board: SharedNote = {
  title: "Launch plan", body: "Launch plan\n\nIdea\n\n1\\. Draft \\*it\\*\n\nReady?", updated_at: "2026-11-14T10:00:00Z",
  include_subnotes: false, is_sub: false, root_title: "Launch plan", subnotes: [],
  shared_by: { name: "Emil W", email: null, avatar: null },
  picture: { width: 2228, height: 809, version: 1763114400123 },
  scene: { size: 5120, version: 1763114400456 },
};

// A shared whiteboard showed an empty page titled "Whiteboard" (its drawing is sealed page data, its
// text only its title). Its page now shows its picture under its title, with its words as the
// picture's description, and nothing else of the note page changes.
describe("a shared whiteboard's page", () => {
  it("reads the board's words from its copy, and names its picture's address", () => {
    expect(boardWords(board.body)).toEqual(["Idea", "1. Draft *it*", "Ready?"]);
    expect(boardWords("Whiteboard")).toEqual([]);
    expect(boardAlt(["Idea", "Ready?"])).toBe("Whiteboard drawing: Idea, Ready?");
    expect(boardAlt([])).toBe("Whiteboard drawing");
    expect(boardAlt(["x".repeat(800)]).length).toBe(600);
    // The address share-files serves it at (logic.ts picturePath).
    expect(picturePath(SLUG, 1763114400123)).toBe(`/functions/v1/share-files?slug=${SLUG}&picture=1763114400123`);
    const b = boardPicture(SLUG, board, BASE)!;
    expect(b.url).toBe(`${BASE}/functions/v1/share-files?slug=${SLUG}&picture=1763114400123`);
    expect([b.width, b.height]).toEqual([1114, 405]);
    expect(boardPicture(SLUG, { ...board, picture: null }, BASE)).toBeNull();
    expect(boardPicture(SLUG, board, "")).toBeNull();
  });

  it("shows the picture large and centred under the title, sharp at 2x, its words as alt text", () => {
    const d = doc(<NotePage slug={SLUG} note={board} files={{}} board={boardPicture(SLUG, board, BASE)} />);
    const h1 = d.querySelector("h1");
    expect(h1?.textContent).toBe("Launch plan");
    const imgs = [...d.querySelectorAll("main figure img")];
    expect(imgs.length).toBe(1);
    const img = imgs[0];
    expect(img.getAttribute("src")).toBe(`${BASE}/functions/v1/share-files?slug=${SLUG}&picture=1763114400123`);
    expect([img.getAttribute("width"), img.getAttribute("height")]).toEqual(["1114", "405"]);
    expect(img.getAttribute("alt")).toBe("Whiteboard drawing: Idea, 1. Draft *it*, Ready?");
    // The title, then who shared it, then the board.
    expect(h1!.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(d.body.textContent).toContain("Shared by Emil W");
    // The words aren't printed again under the picture.
    expect(d.querySelector("article.note")).toBeNull();
    // The rest of the page is the note page's own.
    expect(d.querySelector('aside[aria-label="About Pinto Notes"]')).not.toBeNull();
    expect(d.querySelector(`a[href="/report/${SLUG}"]`)).not.toBeNull();
  });

  it("is on the board's own light ground, wider than the text and never wider than the window", () => {
    const css = readFileSync(join(process.cwd(), "lib", "note-page.module.css"), "utf8");
    const rule = (sel: string) => css.match(new RegExp(`\\n\\${sel} \\{([^}]*)\\}`))?.[1] ?? "";
    expect(rule(".board img")).toMatch(/background: #fff;/);
    expect(rule(".board img")).toMatch(/max-width: 100%/);
    expect(rule(".board img")).toMatch(/height: auto/);
    expect(rule(".board")).toMatch(/width: min\(1120px, calc\(100vw - 2 \* var\(--gutter, 20px\)\)\)/);
  });

  it("a note's page, and a board with no picture yet, show their text as before", () => {
    const note: SharedNote = { ...board, title: "Trip", body: "Trip\n\nDay one", picture: null };
    const d = doc(<NotePage slug={SLUG} note={note} files={{}} board={boardPicture(SLUG, note, BASE)} />);
    expect(d.querySelector("figure")).toBeNull();
    expect(d.querySelector("article.note")?.textContent).toContain("Day one");
    const notYet = doc(<NotePage slug={SLUG} note={{ ...board, picture: null }} files={{}} />);
    expect(notYet.querySelector("article.note")?.textContent).toContain("Ready?");
  });

  it("brings no drawing engine to the web", () => {
    const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
    expect(pkg).not.toMatch(/excalidraw/i);
    // The page names the board's file (.excalidraw) but loads nothing of the engine.
    for (const f of ["lib/NotePage.tsx", "lib/shared.ts", "app/n/[slug]/page.tsx"]) {
      expect(readFileSync(join(process.cwd(), f), "utf8"), f).not.toMatch(/(from\s+|import\(\s*|require\(\s*)["'][^"']*excalidraw/i);
    }
  });
});

describe("a shared whiteboard's link", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

  async function page(answer: SharedNote) {
    vi.stubEnv("SUPABASE_URL", BASE);
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    const asked: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      asked.push(String(url));
      return new Response(String(url).includes("/rpc/shared_note") ? JSON.stringify(answer) : JSON.stringify({ files: {} }), { status: 200 });
    }));
    vi.resetModules();
    const mod = await import("../app/n/[slug]/page");
    return { mod, asked };
  }

  it("is described by its words and previews as its picture", async () => {
    const { mod, asked } = await page(board);
    const meta = await mod.generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(meta.title).toBe("Launch plan · Pinto Notes");
    expect(meta.description).toBe("Idea · 1. Draft it · Ready?");
    const images = (meta.openGraph as { images?: { url: string; width: number; height: number; alt: string }[] }).images;
    expect(images).toEqual([{ url: `${BASE}/functions/v1/share-files?slug=${SLUG}&picture=1763114400123`, width: 2228, height: 809, alt: "Whiteboard drawing: Idea, 1. Draft *it*, Ready?" }]);
    const d = doc(await mod.default({ params: Promise.resolve({ slug: SLUG }) }));
    expect(d.querySelector("main figure img")?.getAttribute("width")).toBe("1114");
    expect(asked.some((u) => u.includes("share-files?slug=") && !u.includes("picture="))).toBe(false);
  });

  it("a note's link is as before: its text describes it, with no picture", async () => {
    const { mod } = await page({ ...board, title: "Trip", body: "Trip\n\nDay one by the sea.", picture: null });
    const meta = await mod.generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(meta.description).toBe("Day one by the sea.");
    expect((meta.openGraph as { images?: unknown }).images).toBeUndefined();
  });
});

// The whiteboard council, round 3, on the page (20, 21): it didn't say what it was, the button
// said "Use this note", the picture was too small to read on a phone, and the board's own file
// (the format is the promise) couldn't be had.
describe("a shared whiteboard's page says what it is and what it offers", () => {
  const render = (note: SharedNote) => doc(<NotePage slug={SLUG} note={note} files={{}} board={boardPicture(SLUG, note, BASE)} />);

  it("says under who shared it that it's view only, and how it stays current", () => {
    const d = render(board);
    const byline = d.querySelector("main p")!;
    expect(byline.textContent).toContain("Shared by Emil W");
    expect(byline.textContent).toContain("View only. Changes show here as they’re made.");
    expect(byline.textContent).not.toContain("Reload");
    // A note's page doesn't say it.
    const note = render({ ...board, title: "Trip", body: "Trip\n\nDay one", picture: null, scene: null });
    expect(note.body.textContent).not.toContain("View only");
    expect(isBoard(board) && isBoard({ ...board, picture: null }) && !isBoard({ ...board, picture: null, scene: null })).toBe(true);
  });

  it("offers Copy to Pinto Notes for a board with its file, nothing for one without, and Use this note for a note", () => {
    const button = (d: Document) => d.querySelector("header a[href^='/open/copy/']");
    const b = button(render(board));
    expect(b?.textContent).toBe("Copy to Pinto Notes");
    expect(b?.getAttribute("href")).toBe(`/open/copy/${SLUG}`);
    // Without its file the app couldn't copy the drawing, only its words: no button.
    const noFile = render({ ...board, scene: null });
    expect(button(noFile)).toBeNull();
    expect(noFile.body.textContent).not.toContain("Use this note");
    expect(button(render({ ...board, title: "Trip", body: "Trip\n\nDay one", picture: null, scene: null }))?.textContent).toBe("Use this note");
  });

  it("opens the picture full size on a tap, with a hint on narrow screens only", () => {
    const d = render(board);
    const open = d.querySelector("main figure a:has(img)");
    expect(open?.getAttribute("href")).toBe(`${BASE}/functions/v1/share-files?slug=${SLUG}&picture=1763114400123`);
    expect(open?.querySelector("img")?.getAttribute("src")).toBe(open?.getAttribute("href"));
    expect(open?.textContent).toBe("Tap to zoom");
    const css = readFileSync(join(process.cwd(), "lib", "note-page.module.css"), "utf8");
    expect(css).toMatch(/\n\.zoomHint \{ display: none; \}/);
    expect(css).toMatch(/@media \(max-width: 640px\) \{\s*\.zoomHint \{\s*display: block;/);
    expect(css).toMatch(/\.boardOpen \{[^}]*cursor: zoom-in/);
  });

  it("offers the board's .excalidraw file under the picture, when there is one", () => {
    expect(scenePath(SLUG, 1763114400456)).toBe(`/functions/v1/share-files?slug=${SLUG}&scene=1763114400456`);
    expect(boardPicture(SLUG, board, BASE)?.download).toBe(`${BASE}/functions/v1/share-files?slug=${SLUG}&scene=1763114400456`);
    const link = [...render(board).querySelectorAll("main figure figcaption a")];
    expect(link.map((a) => [a.textContent?.trim(), a.getAttribute("href"), a.hasAttribute("download")])).toEqual([
      ["Download .excalidraw", `${BASE}/functions/v1/share-files?slug=${SLUG}&scene=1763114400456`, true],
    ]);
    expect(boardPicture(SLUG, { ...board, scene: null }, BASE)?.download).toBeNull();
    expect(render({ ...board, scene: null }).querySelector("figcaption")).toBeNull();
    expect(boardPicture(SLUG, { ...board, scene: { size: 0, version: 1 } }, BASE)?.download).toBeNull();
  });
});
