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

type Opts = { viewport?: { width: number; height: number }; elements?: Record<string, unknown>[]; colorScheme?: "light" | "dark" };

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
    const page = await browser.newPage({ viewport: opts.viewport ?? { width: 1280, height: 800 }, colorScheme: opts.colorScheme ?? "light" });
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
// In the engine's order: what's in a frame just below the frame, so the frame's line is drawn
// after it (the cause of round 15's line through the yellow shape, web-04).
const launchPlan = [{ ...box, frameId: "launch" }, { ...yellow, index: "a0V" }, frame("launch", "Launch", 0), frame("plan", "Plan", 700)];

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

Deno.test("a frame cuts what's in it at its edge, and Present shows only the frame (round 16; round 14, web-04)", async () => {
  await withBoard(async (page) => {
    // As in Excalidraw: the frame holds its shapes, so its edge is never drawn through one (round
    // 15: the frame's line ran through the yellow shape).
    const v = await view(page);
    assertEquals(v.frames.clip, true);
    assert(isYellow(await inkAt(page, 500, 225)), `inside: ${await inkAt(page, 500, 225)}`);
    assert(!isYellow(await inkAt(page, 600, 225)), `cut at the frame's edge: ${await inkAt(page, 600, 225)}`);
    const cmd = (c: unknown) => page.evaluate((c) => (window as unknown as { cmd(c: unknown): void }).cmd(c), c);
    await cmd({ op: "present", to: "start" });
    await page.waitForTimeout(300);
    const p = await view(page);
    assertEquals([p.frames.clip, p.frames.name, p.frames.outline], [true, false, false]);
    assert(isYellow(await inkAt(page, 500, 225)), "presenting: the part inside the frame shows");
    await cmd({ op: "present", to: "stop" });
    await page.waitForTimeout(300);
    const after = await view(page);
    assertEquals([after.frames.clip, after.frames.name, after.frames.outline], [true, true, true]);
  }, { elements: launchPlan });
});

/** Scene to window points in the board's frame (it fills the page). */
const onScreen = (page: Page, x: number, y: number) => api(page).evaluate(([x, y]) => {
  const s = (window as unknown as { amber: { _canvas: { api: { getAppState(): View } } } }).amber._canvas.api.getAppState();
  return [(x + s.scrollX) * s.zoom.value, (y + s.scrollY) * s.zoom.value];
}, [x, y]);
const frameOf = (page: Page, id: string) => api(page).evaluate((id) =>
  (window as unknown as { amber: { _canvas: { api: { getSceneElements(): { id: string; frameId: string | null }[] } } } }).amber._canvas.api.getSceneElements().find((e) => e.id === id)?.frameId ?? null, id);

Deno.test("a shape dragged mostly out of its frame leaves it and shows whole, over the frame's edge (round 16)", async () => {
  await withBoard(async (page) => {
    // The cause (round 15): kept in the frame and drawn uncut, the shape had the frame's edge
    // drawn over it, since the engine draws a frame's line above what's in it.
    const clip = (on: boolean) => api(page).evaluate((on) => {
      const a = (window as unknown as { amber: { _canvas: { api: { getAppState(): View; updateScene(u: unknown): void } } } }).amber._canvas.api;
      a.updateScene({ appState: { frameRendering: { ...a.getAppState().frameRendering, clip: on } } });
    }, on);
    await clip(false);
    await page.waitForTimeout(200);
    assert(!isYellow(await inkAt(page, 520, 225)), `uncut in its frame, the frame's line crosses it: ${await inkAt(page, 520, 225)}`);
    await clip(true);
    await page.waitForTimeout(200);
    // The yellow shape, two thirds out: dragged a little further right with the mouse.
    const [x0, y0] = await onScreen(page, 500, 225);
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(x0 + i * 3, y0);
    await page.mouse.up();
    await page.waitForTimeout(300);
    assertEquals(await frameOf(page, "guest"), null, "out of the frame");
    // Whole: past the edge, and on the edge itself, where the frame's line would cross it.
    const s = await view(page);
    const dx = 24 / s.z;
    assert(isYellow(await inkAt(page, 600 + dx, 225)), `past the edge: ${await inkAt(page, 600 + dx, 225)}`);
    assert(isYellow(await inkAt(page, 520, 225)), `on the frame's edge, over its line: ${await inkAt(page, 520, 225)}`);
    assertEquals(await frameOf(page, "mac-1"), "launch", "the box well inside stays in");
  }, { elements: launchPlan });
});

Deno.test("voting: a click on a shape votes for it, your dots show on it, one on your dot takes it back, and the totals show (round 16)", async () => {
  await withBoard(async (page) => {
    const cmd = (c: unknown) => page.evaluate((c) => (window as unknown as { cmd(c: unknown): void }).cmd(c), c);
    const got = () => page.evaluate(() => (window as unknown as { got: { vote?: { on?: string; off?: string } }[] }).got.filter((m) => m.vote).map((m) => m.vote));
    const selected = () => api(page).evaluate(() => Object.keys((window as unknown as { amber: { _canvas: { api: { getAppState(): { selectedElementIds: Record<string, boolean> } } } } }).amber._canvas.api.getAppState().selectedElementIds));
    // Not voting: a click selects, as always.
    let [x, y] = await onScreen(page, 500, 225);
    await page.mouse.click(x, y);
    await page.waitForTimeout(200);
    assertEquals(await got(), []);
    assertEquals(await selected(), ["guest"]);
    await api(page).evaluate(() => (window as unknown as { amber: { _canvas: { api: { updateScene(u: unknown): void } } } }).amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }));
    await cmd({ op: "votes", on: true, dots: [], results: null });
    await page.waitForTimeout(100);
    [x, y] = await onScreen(page, 500, 225);
    await page.mouse.click(x, y);
    await page.waitForTimeout(200);
    assertEquals(await got(), [{ on: "guest" }], "a vote for the shape under the click");
    // Two dots of yours on it, in your colour, at its top right corner.
    await cmd({ op: "votes", on: true, dots: [{ on: "guest", color: "#5252C5", dark: "#6868CD" }, { on: "guest", color: "#5252C5", dark: "#6868CD" }], results: null });
    await page.waitForTimeout(150);
    const dots = await api(page).evaluate(() => [...document.querySelectorAll(".pinto-vote-dot")].filter((n) => (n as HTMLElement).style.display !== "none").map((n) => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, bg: getComputedStyle(n).backgroundColor }; }));
    assertEquals(dots.length, 2);
    const [rx, ry] = await onScreen(page, 470 + 160, 180);
    assert(dots.every((d) => d.x < rx && d.x > rx - 60 && d.y > ry && d.y < ry + 30), `at the top right corner: ${JSON.stringify(dots)} vs ${rx},${ry}`);
    assert(dots.every((d) => d.bg === "rgb(82, 82, 197)"), JSON.stringify(dots));
    // A click on your dot takes it back.
    await page.mouse.click(dots[0].x + 7, dots[0].y + 7);
    await page.waitForTimeout(150);
    assertEquals((await got()).at(-1), { off: "guest" });
    assertEquals(await selected(), [], "nothing selected by voting");
    // Ended: the totals, no dots; clicks select again.
    await cmd({ op: "votes", on: false, dots: [], results: { guest: 4 } });
    await page.waitForTimeout(150);
    const totals = await api(page).evaluate(() => [...document.querySelectorAll(".pinto-vote-total")].filter((n) => (n as HTMLElement).style.display !== "none").map((n) => n.textContent));
    assertEquals(totals, ["4"]);
    // Every total looks the same, never in the colour of a dot drawn there before (round 16: one
    // total came out in Cleo's violet).
    await cmd({ op: "votes", on: false, dots: [], results: { guest: 4, "mac-1": 2 } });
    await page.waitForTimeout(150);
    const looks = await api(page).evaluate(() => [...document.querySelectorAll(".pinto-vote-total")].filter((n) => (n as HTMLElement).style.display !== "none").map((n) => getComputedStyle(n).backgroundColor));
    assertEquals(looks.length, 2);
    assert(looks.every((b) => b === looks[0]) && looks[0] !== "rgb(82, 82, 197)", `the totals' colours: ${JSON.stringify(looks)}`);
    assertEquals(await api(page).evaluate(() => [...document.querySelectorAll(".pinto-vote-dot")].filter((n) => (n as HTMLElement).style.display !== "none").length), 0);
    // Not part of the drawing.
    const kept = await api(page).evaluate(() => JSON.stringify((window as unknown as { amber: { _canvas: { scene(): unknown } } }).amber._canvas.scene()));
    assert(!kept.includes("pinto-vote") && !kept.includes("results"));
  }, { elements: launchPlan });
});

// MARK: Round 16, final polish

const command = (page: Page) => (c: unknown) => page.evaluate((c) => (window as unknown as { cmd(c: unknown): void }).cmd(c), c);
/** What the page shows of a kind of thing: each one's box, in the page's points. */
const shownBoxes = (page: Page, selector: string) => api(page).evaluate((sel) =>
  [...document.querySelectorAll(sel)].filter((n) => getComputedStyle(n).display !== "none" && (n as HTMLElement).offsetParent !== null)
    .map((n) => { const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }), selector);
const overlaps = (a: number[], b: number[]) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
const sara = { id: "5a000000-0000-4000-8000-000000000002", name: "Sara", color: "#5252C5", dark: "#6868CD", x: 520, y: 225, sel: ["guest"], flag: true };

Deno.test("while voting, the others' pointers, names and selections are hidden, and back with the results (round 16, web-15)", async () => {
  await withBoard(async (page) => {
    const cmd = command(page);
    await cmd({ op: "peers", peers: [sara] });
    await page.waitForTimeout(200);
    assertEquals((await shownBoxes(page, ".pinto-peer-pointer")).length, 1, "Sara's pointer before voting");
    assertEquals((await shownBoxes(page, ".pinto-peer-box")).length, 1, "and her selection");
    await cmd({ op: "votes", on: true, dots: [], results: null });
    await page.waitForTimeout(150);
    for (const kind of [".pinto-peer-pointer", ".pinto-peer-box", ".pinto-peer-flag"]) assertEquals((await shownBoxes(page, kind)).length, 0, `${kind} while voting`);
    // She moves on: still hidden.
    await cmd({ op: "peers", peers: [{ ...sara, x: 80, y: 100, sel: ["mac-1"] }] });
    await page.waitForTimeout(150);
    assertEquals((await shownBoxes(page, ".pinto-peer-pointer")).length, 0);
    await cmd({ op: "votes", on: false, dots: [], results: { guest: 2 } });
    await page.waitForTimeout(150);
    assertEquals((await shownBoxes(page, ".pinto-vote-total")).length, 1);
    assertEquals((await shownBoxes(page, ".pinto-peer-pointer")).length, 1, "her pointer is back with the results");
    assertEquals((await shownBoxes(page, ".pinto-peer-box")).length, 1, "and her selection");
  }, { elements: launchPlan });
});

Deno.test("a vote's total never sits on a comment pin; an AI's pin shows its mark (round 16, web-16)", async () => {
  await withBoard(async (page) => {
    const cmd = command(page);
    const mark = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>')}`;
    // As web-16: Emil's pin at the box's top right corner, and an AI's on the yellow shape's.
    await cmd({ op: "comments", pins: [{ id: "c-emil", on: "mac-1", x: 1, y: 0, color: "#186B70", letter: "E", open: false },
      { id: "c-ai", on: "guest", x: 1, y: 0, color: "#48484A", dark: "#D1D1D6", letter: "C", open: false, mark }], me: { color: "#8841AC", letter: "C" }, open: null, can: true });
    await cmd({ op: "votes", on: false, dots: [], results: { "mac-1": 2, guest: 12 } });
    await page.waitForTimeout(200);
    const pins = await shownBoxes(page, ".pinto-pin");
    const totals = await shownBoxes(page, ".pinto-vote-total");
    assertEquals([pins.length, totals.length], [2, 2]);
    for (const t of totals) for (const p of pins) assert(!overlaps(t, p), `a total ${JSON.stringify(t)} on a pin ${JSON.stringify(p)}`);
    // Each still on its own shape's edge: within its width, at its top or bottom.
    for (const [id, x1, y1, x2, y2] of [["mac-1", 40, 80, 140, 140], ["guest", 470, 180, 630, 270]] as const) {
      const [l, t] = await onScreen(page, x1, y1), [r, b] = await onScreen(page, x2, y2);
      const on = await api(page).evaluate((id) => { const n = [...document.querySelectorAll(".pinto-vote-total")].find((x) => (x as HTMLElement).dataset.on === id)!; const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }, id);
      assert(on[0] >= l - 11 && on[0] + on[2] <= r + 11, `${id}'s total along its edge: ${JSON.stringify(on)} for ${l}..${r}`);
      assert(Math.abs(on[1] - (t - 10)) < 1.5 || Math.abs(on[1] + on[3] - (b + 10)) < 1.5, `${id}'s total at its top or bottom: ${JSON.stringify(on)} for ${t}..${b}`);
    }
    // The AI's pin: its mark, not a letter.
    const ai = await api(page).evaluate(() => { const b = document.querySelector('.pinto-pin[data-comment="c-ai"]')!; return { text: b.textContent, mark: !!b.querySelector(".pinto-pin-mark"), mask: getComputedStyle(b.querySelector(".pinto-pin-mark")!).webkitMaskImage || getComputedStyle(b.querySelector(".pinto-pin-mark")!).maskImage }; });
    assert(ai.mark && ai.text === "" && ai.mask.startsWith("url("), JSON.stringify(ai));
  }, { elements: launchPlan });
});

Deno.test("comment pins are hidden while presenting, and back on Done (round 16)", async () => {
  await withBoard(async (page) => {
    const cmd = command(page);
    await cmd({ op: "comments", pins: [{ id: "c-1", on: "mac-1", x: 1, y: 0, color: "#186B70", letter: "E", open: false },
      { id: "c-2", x: 900, y: 120, color: "#5252C5", letter: "S", open: false }], me: { color: "#8841AC", letter: "C" }, open: null, can: true });
    await page.waitForTimeout(150);
    assertEquals((await shownBoxes(page, ".pinto-pin")).length, 2);
    await cmd({ op: "present", to: "start" });
    await page.waitForTimeout(300);
    assertEquals((await shownBoxes(page, ".pinto-pin")).length, 0, "no pin on the frame presented");
    await cmd({ op: "present", to: "next" });
    await page.waitForTimeout(300);
    assertEquals((await shownBoxes(page, ".pinto-pin")).length, 0, "nor on the next");
    await cmd({ op: "present", to: "stop" });
    await page.waitForTimeout(300);
    assertEquals((await shownBoxes(page, ".pinto-pin")).length, 2, "back on Done");
  }, { elements: launchPlan });
});

/** WCAG's contrast ratio of two colours ("#rrggbb" or "rgb(r, g, b)"). */
function contrast(a: string, b: string) {
  const rgb = (c: string) => c.startsWith("#") ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const lum = (c: string) => { const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** A drawing colour as a dark board shows it: invert, then hue-rotate(180deg) (pinto.css). */
function darkShown(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => 255 - parseInt(hex.slice(i, i + 2), 16));
  const c = [-0.574 * r + 1.43 * g + 0.144 * b, 0.426 * r + 0.43 * g + 0.144 * b, 0.426 * r + 1.43 * g - 0.856 * b].map((v) => Math.round(Math.min(255, Math.max(0, v))));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

Deno.test("a vote's dot stands 3:1 against its sticky on a dark board, every person's colour (round 16, 47-voting-1 dark)", async () => {
  const fills = ["#a5d8ff", "#b2f2bb", "#ffc9c9", "#ffec99", "#eebefa"];
  const stickies = fills.map((f, i) => ({ ...box, id: `s${i}`, x: i * 180, y: 0, width: 160, height: 100, backgroundColor: f, fillStyle: "solid", index: `a${i}`, seed: 10 + i }));
  const palette = [["#2D6E36", "#368340"], ["#186B70", "#1C8086"], ["#2D639A", "#3677B9"], ["#5252C5", "#6868CD"], ["#8841AC", "#9C56BF"], ["#A43777", "#C1448D"]];
  await withBoard(async (page) => {
    const cmd = command(page);
    for (const [color, dark] of palette) {
      await cmd({ op: "votes", on: true, dots: fills.map((_, i) => ({ on: `s${i}`, color, dark })), results: null });
      await page.waitForTimeout(100);
      const got = await api(page).evaluate(() => [...document.querySelectorAll(".pinto-vote-dot")].filter((n) => (n as HTMLElement).style.display !== "none").map((n) => [(n as HTMLElement).dataset.on!, getComputedStyle(n).backgroundColor]));
      assertEquals(got.length, fills.length);
      for (const [on, bg] of got) {
        const ground = darkShown(fills[Number(on.slice(1))]);
        assert(contrast(bg, ground) >= 3, `${dark}'s dot ${bg} on ${fills[Number(on.slice(1))]} (shown ${ground}): ${contrast(bg, ground).toFixed(2)}:1`);
      }
    }
  }, { elements: stickies, colorScheme: "dark" });
});

Deno.test("Zoom to Fit on a phone gives the board's first view back, and a menu opening moves nothing (round 16, web-07 to web-08)", async () => {
  await withBoard(async (page) => {
    const cmd = command(page);
    const opened = await view(page);
    await api(page).evaluate(() => (window as unknown as { amber: { _canvas: { api: { updateScene(u: unknown): void } } } }).amber._canvas.api.updateScene({ appState: { zoom: { value: 1.5 }, scrollX: 0, scrollY: 0 } }));
    await page.waitForTimeout(200);
    await cmd({ op: "action", name: "zoomToFit" });
    await page.waitForTimeout(300);
    const fitted = await view(page);
    assert(Math.abs(fitted.z - opened.z) < 0.002, `the same zoom: ${opened.z} then ${fitted.z}`);
    for (const k of ["l", "r", "t", "b"] as const) assert(Math.abs(fitted[k] - opened[k]) < 1.5, `the same place (${k}): ${JSON.stringify({ opened, fitted })}`);
  }, { viewport: { width: 390, height: 844 }, elements: launchPlan });
});
