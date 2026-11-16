// The whiteboard's canvas as the site frames it (web/public/board: canvas.html, bridge.js and the
// app's canvas copied by `pnpm -C web board:assets`), in headless Chromium with no stack: a stand-in
// for the board's page frames it and talks to it the way BoardPage.tsx does (postMessage).
//
// - A click anywhere in the framing page (its toolbar, its title) and then a drag on the board draws
//   the shape. Until bridge.js took focus on a press, the focus moving mid-press ended the engine's
//   drag and the board drew nothing (2026-11-15, found by scripts/board-web-e2e.sh).
// - The engine's fonts load from the site, not from the app's own address.
//
//   deno test -A scripts/board-canvas-frame.test.ts
/// <reference lib="dom" />
import { assert, assertEquals } from "jsr:@std/assert@1";
import { chromium, type Page } from "npm:playwright-core@1.63.0";

const PUBLIC = new URL("../web/public", import.meta.url).pathname;
const SHELL = `${Deno.env.get("HOME")}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const TYPES: Record<string, string> = { html: "text/html", js: "text/javascript", css: "text/css", woff2: "font/woff2", wasm: "application/wasm", txt: "text/plain" };

const PARENT = `<!doctype html><html><body style="margin:0">
<iframe id="f" src="/board/canvas.html" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>
<div id="title" style="position:fixed;left:12px;top:12px;padding:12px;background:#fff;z-index:2">Launch plan</div>
<button id="rect" style="position:fixed;left:560px;bottom:16px;z-index:2">Rectangle</button>
<script>
  window.got = [];
  window.cmd = (c) => document.getElementById("f").contentWindow.postMessage({ pintoCommand: c }, location.origin);
  window.addEventListener("message", (e) => { if (e.data && e.data.pintoCanvas) window.got.push(e.data.pintoCanvas); });
  document.getElementById("rect").onclick = () => window.cmd({ op: "tool", tool: "rectangle" });
</script></body></html>`;

const box = { id: "mac-1", type: "rectangle", x: 40, y: 80, width: 100, height: 60, angle: 0, strokeColor: "#1e1e1e", backgroundColor: "transparent",
  fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100, seed: 7, version: 1, versionNonce: 1, isDeleted: false, index: "a0",
  boundElements: null, groupIds: [], frameId: null, roundness: null, updated: 1, link: null, locked: false };

type Opts = { viewport?: { width: number; height: number }; elements?: Record<string, unknown>[] };

async function withBoard(f: (page: Page) => Promise<void>, opts: Opts = {}) {
  try { await Deno.stat(`${PUBLIC}/board/canvas/canvas.js`); } catch { throw new Error("No canvas in web/public/board: run pnpm -C web board:assets first."); }
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen() {} }, async (req) => {
    const path = new URL(req.url).pathname;
    if (path === "/") return new Response(PARENT, { headers: { "content-type": "text/html" } });
    try { return new Response(await Deno.readFile(PUBLIC + path), { headers: { "content-type": TYPES[path.split(".").pop()!] ?? "application/octet-stream" } }); }
    catch { return new Response("", { status: 404 }); }
  });
  const browser = await chromium.launch({ executablePath: SHELL, headless: true });
  try {
    const page = await browser.newPage({ viewport: opts.viewport ?? { width: 1280, height: 800 } });
    await page.goto(`http://127.0.0.1:${server.addr.port}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (window as unknown as { got: { load?: string }[] }).got.some((m) => typeof m.load === "string"));
    // As BoardPage does for an Edit link before signing in, and then once you've joined.
    const cmd = (c: unknown) => page.evaluate((c) => (window as unknown as { cmd(c: unknown): void }).cmd(c), c);
    const scene = { elements: opts.elements ?? [box], appState: { viewBackgroundColor: "#ffffff" }, files: {} };
    await cmd({ op: "shared", on: true, viewOnly: true });
    await cmd({ op: "remoteScene", scene });
    await page.waitForTimeout(300);
    await cmd({ op: "shared", on: true, viewOnly: false });
    await cmd({ op: "remoteScene", scene });
    await page.waitForTimeout(300);
    await f(page);
  } finally {
    await browser.close();
    await server.shutdown();
  }
}

const shapes = (page: Page) => page.frames().find((x) => x.url().includes("canvas.html"))!.evaluate(() =>
  (window as unknown as { amber: { _canvas: { api: { getSceneElements(): { id: string; type: string }[] } } } }).amber._canvas.api.getSceneElements().map((e) => e.type));

/** The tool from the page's toolbar, once the canvas says it has it. */
async function pick(page: Page) {
  await page.click("#rect");
  await page.waitForFunction(() => (window as unknown as { got: { tool?: string }[] }).got.some((m) => m.tool === "rectangle"));
}

async function drag(page: Page) {
  await page.mouse.move(520, 420);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(520 + i * 16, 420 + i * 9);
  await page.mouse.up();
  await page.waitForTimeout(200);
}

Deno.test("a drag on the board draws a shape after the tool is picked on the page's toolbar", async () => {
  await withBoard(async (page) => {
    await pick(page);
    await drag(page);
    assertEquals(await shapes(page), ["rectangle", "rectangle"]);
  });
});

Deno.test("a drag on the board draws a shape after a click elsewhere on the page", async () => {
  await withBoard(async (page) => {
    await pick(page);
    await page.click("#title");
    await page.mouse.move(700, 300);
    await drag(page);
    assertEquals(await shapes(page), ["rectangle", "rectangle"]);
  });
});

Deno.test("the engine's fonts load from the site", async () => {
  await withBoard(async (page) => {
    const frame = page.frames().find((x) => x.url().includes("canvas.html"))!;
    const fonts = await frame.evaluate(async () => (await document.fonts.load("20px Excalifont")).map((f) => f.status));
    assert(fonts.length > 0 && fonts.every((s) => s === "loaded"), JSON.stringify(fonts));
  });
});

// Round 14: two frames side by side, the app's box in the first and the browser's yellow shape run
// out past its right edge, as scripts/board-web-e2e.sh draws them.
const frame = (id: string, name: string, x: number) => ({ ...box, id, type: "frame", name, x, y: 0, width: 520, height: 320, index: id === "launch" ? "a1" : "a2" });
const yellow = { ...box, id: "guest", x: 470, y: 180, width: 160, height: 90, backgroundColor: "#ffec99", fillStyle: "solid", frameId: "launch", index: "a3", seed: 9 };
const launchPlan = [{ ...box, frameId: "launch" }, frame("launch", "Launch", 0), frame("plan", "Plan", 700), yellow];

type View = { zoom: { value: number }; scrollX: number; scrollY: number; frameRendering: { clip: boolean; name: boolean; outline: boolean } };
const api = (page: Page) => page.frames().find((x) => x.url().includes("canvas.html"))!;
const view = (page: Page) => api(page).evaluate(() => {
  const a = (window as unknown as { amber: { _canvas: { api: { getAppState(): View; getSceneElements(): { x: number; y: number; width: number; height: number }[] } } } }).amber._canvas.api;
  const s = a.getAppState(), z = s.zoom.value, els = a.getSceneElements();
  const c = document.getElementById("canvas")!;
  const x1 = Math.min(...els.map((e) => e.x)), y1 = Math.min(...els.map((e) => e.y));
  const x2 = Math.max(...els.map((e) => e.x + e.width)), y2 = Math.max(...els.map((e) => e.y + e.height));
  return { l: (x1 + s.scrollX) * z, r: (x2 + s.scrollX) * z, t: (y1 + s.scrollY) * z, b: (y2 + s.scrollY) * z, W: c.clientWidth, H: c.clientHeight, z, frames: s.frameRendering };
});
/** The board's drawn colour at a point of the scene, as the page shows it. */
const inkAt = (page: Page, x: number, y: number) => api(page).evaluate(([x, y]) => {
  const a = (window as unknown as { amber: { _canvas: { api: { getAppState(): View } } } }).amber._canvas.api;
  const s = a.getAppState(), z = s.zoom.value;
  const c = document.querySelector("canvas.excalidraw__canvas:not(.interactive)") as HTMLCanvasElement;
  const k = c.width / c.clientWidth;
  const d = c.getContext("2d")!.getImageData(Math.round((x + s.scrollX) * z * k), Math.round((y + s.scrollY) * z * k), 1, 1).data;
  return [d[0], d[1], d[2]];
}, [x, y]);
const isYellow = ([r, g, b]: number[]) => r > 240 && g > 220 && g < 250 && b > 130 && b < 175;

Deno.test("a board opened on a phone shows whole, between the title and the tools (round 14, web-07)", async () => {
  await withBoard(async (page) => {
    const v = await view(page);
    // bridge.js's room: 76 at the top, 92 at the foot, 24 a side.
    assert(v.l >= 23 && v.r <= v.W - 23 && v.t >= 75 && v.b <= v.H - 91, `cut off: ${JSON.stringify(v)}`);
    assert(Math.abs((v.l + v.r) / 2 - v.W / 2) < 3, `not centred: ${JSON.stringify(v)}`);
    assert(v.z < 0.5, `fitted below 50% to show both frames whole: ${v.z}`);
  }, { viewport: { width: 390, height: 844 }, elements: launchPlan });
});

Deno.test("a shape run out past its frame's edge shows whole while you work, and Present cuts it there (round 14, web-04)", async () => {
  await withBoard(async (page) => {
    const v = await view(page);
    assertEquals(v.frames.clip, false);
    // Inside the frame and outside it, the yellow shape is drawn.
    assert(isYellow(await inkAt(page, 500, 225)), `inside: ${await inkAt(page, 500, 225)}`);
    assert(isYellow(await inkAt(page, 600, 225)), `outside the frame's edge: ${await inkAt(page, 600, 225)}`);
    // Present: only the frame shows, cut at its edge, with no name or outline; Done brings it all back.
    const cmd = (c: unknown) => page.evaluate((c) => (window as unknown as { cmd(c: unknown): void }).cmd(c), c);
    await cmd({ op: "present", to: "start" });
    await page.waitForTimeout(300);
    const p = await view(page);
    assertEquals([p.frames.clip, p.frames.name, p.frames.outline], [true, false, false]);
    assert(isYellow(await inkAt(page, 500, 225)), "presenting: the part inside the frame shows");
    assert(!isYellow(await inkAt(page, 600, 225)), "presenting: the part past the frame's edge is cut");
    await cmd({ op: "present", to: "stop" });
    await page.waitForTimeout(300);
    const after = await view(page);
    assertEquals([after.frames.clip, after.frames.name, after.frames.outline], [false, true, true]);
    assert(isYellow(await inkAt(page, 600, 225)), "after Done: drawn whole again");
  }, { elements: launchPlan });
});
