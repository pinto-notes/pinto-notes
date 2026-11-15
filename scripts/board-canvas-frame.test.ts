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

async function withBoard(f: (page: Page) => Promise<void>) {
  try { await Deno.stat(`${PUBLIC}/board/canvas/canvas.js`); } catch { throw new Error("No canvas in web/public/board: run pnpm -C web board:assets first."); }
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen() {} }, async (req) => {
    const path = new URL(req.url).pathname;
    if (path === "/") return new Response(PARENT, { headers: { "content-type": "text/html" } });
    try { return new Response(await Deno.readFile(PUBLIC + path), { headers: { "content-type": TYPES[path.split(".").pop()!] ?? "application/octet-stream" } }); }
    catch { return new Response("", { status: 404 }); }
  });
  const browser = await chromium.launch({ executablePath: SHELL, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`http://127.0.0.1:${server.addr.port}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (window as unknown as { got: { load?: string }[] }).got.some((m) => typeof m.load === "string"));
    // As BoardPage does for an Edit link before signing in, and then once you've joined.
    const cmd = (c: unknown) => page.evaluate((c) => (window as unknown as { cmd(c: unknown): void }).cmd(c), c);
    const scene = { elements: [box], appState: { viewBackgroundColor: "#ffffff" }, files: {} };
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
