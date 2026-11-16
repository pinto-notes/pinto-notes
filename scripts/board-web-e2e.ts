// The browser side of a whiteboard edited at once in the app and in a browser, on a LOCAL stack
// only (scripts/board-web-e2e.sh starts everything; never staging or production). Headless
// Chromium, no window. The app's side is PaneTests/Collab/BoardWebLiveTests.swift; the two meet
// through files in <dir> (that test says what each one writes).
//
//   deno run -A scripts/board-web-e2e.ts <site url> <dir> <email> <commenter's email>
//   env: API_URL, MAILPIT_URL (from `supabase status -o env`)
//
// Pictures go to build/repro/board-web/.
/// <reference lib="dom" />
import { chromium, type Frame, type Page } from "npm:playwright-core@1.63.0";

const [site, dir, email, commenterEmail] = Deno.args;
const API = Deno.env.get("API_URL")!, MAIL = Deno.env.get("MAILPIT_URL")!;
for (const u of [API, site, MAIL]) if (!/^http:\/\/127\.0\.0\.1:\d+\/?$/.test(u)) throw new Error(`not a local address: ${u}`);
const OUT = new URL("../build/repro/board-web/", import.meta.url).pathname;
await Deno.mkdir(OUT, { recursive: true });
const SHELL = `${Deno.env.get("HOME")}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;

const log = (...a: unknown[]) => console.error("[browser]", ...a);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until<T>(what: string, seconds: number, f: () => Promise<T | null | undefined | false>): Promise<T> {
  const end = Date.now() + seconds * 1000;
  for (;;) {
    const v = await f().catch(() => null);
    if (v) return v as T;
    if (Date.now() > end) throw new Error(`timed out: ${what}`);
    await sleep(200);
  }
}
const file = (name: string) => `${dir}/${name}`;
const exists = async (name: string) => { try { await Deno.stat(file(name)); return true; } catch { return false; } };
const write = (name: string, body: string) => Deno.writeTextFile(file(name) + ".tmp", body).then(() => Deno.rename(file(name) + ".tmp", file(name)));

/** The sign-in code Mailpit has for this address (the local stack's mailbox; nothing is sent). */
async function codeFor(address: string, after: number): Promise<string> {
  return await until("the sign-in email", 60, async () => {
    const found = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
    const m = (found.messages ?? []).find((x: { Created: string }) => Date.parse(x.Created) >= after - 2000);
    if (!m) return null;
    const msg = await (await fetch(`${MAIL}/api/v1/message/${m.ID}`)).json();
    return /\b(\d{6})\b/.exec(`${msg.Text ?? ""} ${msg.HTML ?? ""}`)?.[1] ?? null;
  });
}

const canvas = (page: Page): Frame => page.frames().find((f) => f.url().includes("/board/canvas.html"))!;
type El = { id: string; type: string; x: number; isDeleted?: boolean };
const elements = (page: Page) => canvas(page).evaluate(() => {
  const c = (window as unknown as { amber: { _canvas?: { api: { getSceneElements(): El[] } } } }).amber._canvas;
  return c ? c.api.getSceneElements().map((e) => ({ id: e.id, type: e.type, x: Math.round(e.x) })) : [];
});

/** Where an element's middle is on the page (the board is in a frame). */
async function onPage(page: Page, id: string): Promise<{ x: number; y: number }> {
  const box = (await page.locator('iframe').first().boundingBox())!;
  const p = await canvas(page).evaluate((id) => {
    const api = (window as unknown as { amber: { _canvas: { api: { getAppState(): { zoom: { value: number }; scrollX: number; scrollY: number; offsetLeft: number; offsetTop: number }; getSceneElements(): { id: string; x: number; y: number; width: number; height: number }[] } } } }).amber._canvas.api;
    const s = api.getAppState(), z = s.zoom.value, e = api.getSceneElements().find((x) => x.id === id)!;
    return { x: (e.x + e.width * 0.3 + s.scrollX) * z + s.offsetLeft, y: (e.y + e.height * 0.4 + s.scrollY) * z + s.offsetTop };
  }, id);
  return { x: box.x + p.x, y: box.y + p.y };
}

/** The whole drawing's box on the board's frame, and whether it all shows. */
async function wholeIn(page: Page) {
  const v = await canvas(page).evaluate(() => {
    const api = (window as unknown as { amber: { _canvas: { api: { getAppState(): { zoom: { value: number }; scrollX: number; scrollY: number }; getSceneElements(): { x: number; y: number; width: number; height: number }[] } } } }).amber._canvas.api;
    const s = api.getAppState(), z = s.zoom.value, els = api.getSceneElements();
    const c = document.querySelector("#canvas") as HTMLElement | null, W = c?.clientWidth ?? innerWidth, H = c?.clientHeight ?? innerHeight;
    const x1 = Math.min(...els.map((e) => e.x)), y1 = Math.min(...els.map((e) => e.y));
    const x2 = Math.max(...els.map((e) => e.x + e.width)), y2 = Math.max(...els.map((e) => e.y + e.height));
    return { l: (x1 + s.scrollX) * z, r: (x2 + s.scrollX) * z, t: (y1 + s.scrollY) * z, b: (y2 + s.scrollY) * z, W, H, z };
  });
  return { v, ok: v.l >= 0 && v.t >= 0 && v.r <= v.W && v.b <= v.H };
}

type Rect = { x: number; y: number; width: number; height: number };
const overlaps = (a: Rect, b: Rect) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;

/** On the page: the boxes of the board's shapes (not frames or their words in shapes) and its pins. */
async function drawnOnPage(page: Page): Promise<{ id: string; kind: string; r: Rect }[]> {
  const box = (await page.locator('iframe').first().boundingBox())!;
  const got = await canvas(page).evaluate(() => {
    type E = { id: string; type: string; x: number; y: number; width: number; height: number; containerId?: string | null; isDeleted?: boolean; customData?: Record<string, unknown> };
    const api = (window as unknown as { amber: { _canvas: { api: { getAppState(): { zoom: { value: number }; scrollX: number; scrollY: number }; getSceneElements(): E[] } } } }).amber._canvas.api;
    const s = api.getAppState(), z = s.zoom.value;
    const shapes = api.getSceneElements().filter((e) => !e.isDeleted && e.type !== "frame" && !e.containerId && !(e.customData && (e.customData.pintoHint || e.customData.pintoTitle)))
      .map((e) => ({ id: e.id, kind: e.type, r: { x: (e.x + s.scrollX) * z, y: (e.y + s.scrollY) * z, width: e.width * z, height: e.height * z } }));
    const pins = [...document.querySelectorAll(".pinto-pin")].map((n, i) => { const r = n.getBoundingClientRect(); return { id: `pin${i}`, kind: "pin", r: { x: r.x, y: r.y, width: r.width, height: r.height } }; });
    return [...shapes, ...pins];
  });
  return got.map((g) => ({ ...g, r: { ...g.r, x: g.r.x + box.x, y: g.r.y + box.y } }));
}

/** What a comment's box covers: the shape it's on, the shapes near it, the pins (round 15, comment-role-2, web-05, web-06). */
async function covers(page: Page, card: Rect, own: string) {
  const all = await drawnOnPage(page);
  return all.filter((d) => overlaps(card, d.r)).map((d) => `${d.kind}${d.id === own ? " (the one it's on)" : ""} ${d.id}`);
}

/** How many comment pins show on the board. */
const pinsShown = (page: Page) => canvas(page).locator(".pinto-pin:visible").count();

/** The board's view: where it's scrolled and how far it's zoomed. */
const viewOf = (page: Page) => canvas(page).evaluate(() => {
  const s = (window as unknown as { amber: { _canvas: { api: { getAppState(): { zoom: { value: number }; scrollX: number; scrollY: number } } } } }).amber._canvas.api.getAppState();
  return { z: Math.round(s.zoom.value * 1000) / 1000, x: Math.round(s.scrollX), y: Math.round(s.scrollY) };
});

/** Signs up with an email code in the board's sheet, then gives a name. */
async function signUp(page: Page, address: string, name: string, button: string) {
  await page.getByRole("button", { name: button }).click();
  await page.getByLabel("Email", { exact: true }).fill(address);
  const asked = Date.now();
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Code", { exact: true }).waitFor();
  await page.getByLabel("Code", { exact: true }).fill(await codeFor(address, asked));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).waitFor({ timeout: 20_000 });
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Picks an element, as a click on it does. */
async function select(page: Page, id: string) {
  await canvas(page).evaluate((id) => {
    const c = (window as unknown as { amber: { _canvas?: { api: { updateScene(s: unknown): void } } } }).amber._canvas;
    c?.api.updateScene({ appState: { selectedElementIds: { [id]: true } } });
  }, id);
  await sleep(400);
}

const browser = await chromium.launch({ executablePath: SHELL, headless: true });
const problems: string[] = [];
const said: string[] = [];
let current: Page | null = null;
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: "light" });
  const page = await context.newPage();
  current = page;
  page.on("console", (m) => { said.push(`${m.type()}: ${m.text().slice(0, 300)}`); if (m.type() === "error") problems.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`page: ${e.message}`));

  const link = (await until("link.txt", 600, async () => (await exists("link.txt")) && (await Deno.readTextFile(file("link.txt"))).trim()));
  const at = new URL(link);
  const url = `${site.replace(/\/$/, "")}${at.pathname}${at.hash}`;
  log("opening", at.pathname);
  await page.goto(url);

  // 1. The board, live and read only, before signing in.
  await until("the app's box on the board", 30, async () => (await elements(page)).some((e) => e.id === "mac-1"));
  await page.getByRole("button", { name: "Sign in to edit" }).waitFor();
  if (await page.getByRole("navigation", { name: "Tools" }).count()) throw new Error("tools showed before signing in");
  // The engine's own fonts load from the site.
  const fonts = await canvas(page).evaluate(async () => (await document.fonts.load("20px Excalifont")).map((f) => f.status));
  if (!fonts.length || fonts.some((st) => st !== "loaded")) throw new Error(`the engine's font didn't load: ${JSON.stringify(fonts)}`);
  // It opens with the whole drawing in view, centred between the title bar and the tools (round
  // 13, web-01 and web-04: it opened at the engine's corner, the drawing off to one side).
  const view = await canvas(page).evaluate(() => {
    const api = (window as unknown as { amber: { _canvas: { api: { getAppState(): { zoom: { value: number }; scrollX: number; scrollY: number }; getSceneElements(): { x: number; y: number; width: number; height: number }[] } } } }).amber._canvas.api;
    const s = api.getAppState(), z = s.zoom.value, els = api.getSceneElements();
    const c = document.querySelector("#canvas") as HTMLElement | null, W = c?.clientWidth ?? innerWidth, H = c?.clientHeight ?? innerHeight;
    const x1 = Math.min(...els.map((e) => e.x)), y1 = Math.min(...els.map((e) => e.y));
    const x2 = Math.max(...els.map((e) => e.x + e.width)), y2 = Math.max(...els.map((e) => e.y + e.height));
    return { l: (x1 + s.scrollX) * z, r: (x2 + s.scrollX) * z, t: (y1 + s.scrollY) * z, b: (y2 + s.scrollY) * z, W, H, z };
  });
  log("opening view:", JSON.stringify(view));
  if (view.l < 0 || view.t < 0 || view.r > view.W || view.b > view.H) problems.push(`the board didn't open whole: ${JSON.stringify(view)}`);
  if (Math.abs((view.l + view.r) / 2 - view.W / 2) > 4 || Math.abs((view.t + view.b) / 2 - (76 + (view.H - 76 - 92) / 2)) > 4 || view.z > 1)
    problems.push(`the board didn't open centred, at 100% or less: ${JSON.stringify(view)}`);
  await page.screenshot({ path: `${OUT}01-view-before-sign-in.png` });

  // 2. Sign in to edit: an email code; then a name (her account has none yet).
  await page.getByRole("button", { name: "Sign in to edit" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.screenshot({ path: `${OUT}02-sign-in.png` });
  const asked = Date.now();
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Code", { exact: true }).waitFor();
  await page.getByLabel("Code", { exact: true }).fill(await codeFor(email, asked));
  await page.screenshot({ path: `${OUT}03-code.png` });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).waitFor({ timeout: 20_000 });
  await page.getByLabel("Name", { exact: true }).fill("Sara Berg");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("navigation", { name: "Tools" }).waitFor({ timeout: 60_000 });
  log("joined");
  const user = await page.evaluate(() => JSON.parse(localStorage.getItem("pinto.connect.session") ?? "{}").user_id as string);

  // 3. Draws a rectangle with the pointer, as a person does, and moves the pointer over the board.
  const before = new Set((await elements(page)).map((e) => e.id));
  await page.getByRole("button", { name: "Rectangle (R)" }).click();
  // Pressed once the canvas says it has the tool.
  await page.locator('nav[aria-label="Tools"] button[aria-label="Rectangle (R)"][aria-pressed="true"]').waitFor();
  await page.mouse.move(520, 420);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(520 + i * 16, 420 + i * 9);
  await page.mouse.up();
  const drawn = await until("the browser's rectangle", 10, async () => (await elements(page)).find((e) => !before.has(e.id) && e.type === "rectangle"));
  // Picked, it has the app's bar over it: its colours, width and line, and More (round 12).
  await select(page, drawn.id);
  const bar = page.getByRole("toolbar", { name: "Selection" });
  await bar.waitFor();
  await bar.getByRole("button", { name: "Fill" }).click();
  await page.getByRole("menuitemradio", { name: "Yellow" }).click();
  await until("the rectangle's yellow fill", 10, () => canvas(page).evaluate((id) => {
    const c = (window as unknown as { amber: { _canvas?: { api: { getSceneElements(): { id: string; backgroundColor: string }[] } } } }).amber._canvas;
    return c?.api.getSceneElements().find((e) => e.id === id)?.backgroundColor === "#ffec99";
  }, drawn.id));
  await bar.getByRole("button", { name: "More" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).waitFor();
  await page.screenshot({ path: `${OUT}03b-selected-shape-style-bar.png` });
  await page.keyboard.press("Escape");
  for (let i = 0; i < 8; i++) { await page.mouse.move(700 + i * 10, 300 + i * 6); await sleep(120); }
  await write("browser.json", JSON.stringify({ user, element: drawn.id }));
  log("drew", drawn.id);

  // 4. The app's move, its pointer and its comment arrive; the reply goes back.
  const mac = JSON.parse(await until("mac.json", 120, async () => (await exists("mac.json")) && await Deno.readTextFile(file("mac.json")))) as { comment: string; colors: { emil: string; sara: string } };
  await until("the app's move", 30, async () => (await elements(page)).some((e) => e.id === "mac-1" && e.x === 260));
  const pointer = await until("the app's pointer on the board", 30, () => canvas(page).evaluate(() => {
    const p = [...document.querySelectorAll<HTMLElement>(".pinto-peer")].find((n) => n.style.display !== "none" && n.offsetParent !== null);
    return p ? (p.textContent ?? "").trim() || "shown" : null;
  }));
  log("the app's pointer:", pointer);
  // Each person has the colour the app gives them, here too (round 14: Sara was purple on the Mac
  // and teal in the browser): Emil's avatar, pointer and flag, and her own avatar.
  const hex = (css: string) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css); return m ? "#" + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase() : css.toUpperCase(); };
  const avatars = await page.locator("ul[data-people] > li button").evaluateAll((b) => b.map((n) => ({ me: (n.parentElement as HTMLElement).dataset.me !== undefined, bg: getComputedStyle(n).backgroundColor })));
  const emilAvatar = avatars.find((a) => !a.me), saraAvatar = avatars.find((a) => a.me);
  const flag = await canvas(page).evaluate(() => {
    const p = [...document.querySelectorAll<HTMLElement>(".pinto-peer")].find((n) => n.style.display !== "none" && n.offsetParent !== null);
    const f = p?.querySelector<HTMLElement>(".pinto-peer-flag");
    return f ? getComputedStyle(f).backgroundColor : "";
  });
  const seen = { emilAvatar: hex(emilAvatar?.bg ?? ""), emilFlag: hex(flag), saraAvatar: hex(saraAvatar?.bg ?? "") };
  log("colours:", JSON.stringify({ app: mac.colors, browser: seen }));
  if (seen.emilAvatar !== mac.colors.emil || seen.emilFlag !== mac.colors.emil || seen.saraAvatar !== mac.colors.sara)
    problems.push(`a person's colour differs from the app's: ${JSON.stringify({ app: mac.colors, browser: seen })}`);
  // Everyone in one group, you last, as the app's toolbar groups them (round 13, web-04).
  const group = await page.locator("ul[data-people] > li").evaluateAll((li) => li.map((n) => (n as HTMLElement).dataset.me !== undefined ? "me" : (n.textContent ?? "").trim()));
  if (group.length < 2 || group.at(-1) !== "me" || group.filter((x) => x === "me").length !== 1) problems.push(`the avatars aren't one group with you last: ${JSON.stringify(group)}`);
  await page.screenshot({ path: `${OUT}04-board-with-the-apps-pointer.png` });
  const pin = canvas(page).locator(`.pinto-pin[data-comment="${mac.comment}"]`);
  await pin.waitFor({ timeout: 30_000 });
  const pinColour = hex(await pin.evaluate((n) => getComputedStyle(n).backgroundColor));
  if (pinColour !== mac.colors.emil) problems.push(`Emil's comment pin isn't his colour: ${pinColour}, the app's ${mac.colors.emil}`);
  await pin.click();
  const thread = page.getByRole("dialog", { name: "Comment", exact: true });
  await thread.waitFor();
  await thread.getByText("does this read right?").waitFor();
  const reply = thread.getByLabel("Reply", { exact: true });
  await reply.click();
  await reply.pressSequentially("Yes, @Em");
  await thread.getByRole("option", { name: "@Emil" }).waitFor();
  await reply.press("Enter");
  await reply.pressSequentially("it reads right.");
  await page.screenshot({ path: `${OUT}05-reply.png` });
  await reply.press("Enter");
  await thread.getByText("it reads right.").waitFor();
  await sleep(1500);
  await write("reply.json", "{}");
  // A shape picked while the thread is open: its style bar waits, never over the thread (round 13,
  // web-06: the bar covered the thread's foot).
  await select(page, drawn.id);
  const card = await thread.boundingBox();
  const styleBar = page.getByRole("toolbar", { name: "Selection" });
  const barBox = (await styleBar.count()) ? await styleBar.boundingBox() : null;
  if (card && barBox && !(barBox.x >= card.x + card.width || barBox.x + barBox.width <= card.x || barBox.y >= card.y + card.height || barBox.y + barBox.height <= card.y))
    problems.push(`the style bar is over the open thread: ${JSON.stringify({ card, barBox })}`);
  await page.screenshot({ path: `${OUT}06-thread.png` });

  // 5. The app says it has all of it.
  await until("done.txt", 120, () => exists("done.txt"));
  await page.keyboard.press("Escape");
  await sleep(500);

  // 6. Present, from the board's More menu (someone who can edit), as the app presents: the first
  // frame alone, the Present bar; the app follows, and the bar says so (round 14).
  const more = page.locator('header button[aria-label="More"]');
  await more.click();
  const present = page.getByRole("menuitem", { name: /Present/ });
  await present.waitFor();
  if (!/2 frames/.test((await present.textContent()) ?? "")) problems.push(`Present doesn't say what it walks: ${await present.textContent()}`);
  await page.screenshot({ path: `${OUT}10-more-present.png` });
  // Comment pins are on the board until it's presented (round 16: they showed over the talk).
  const pinsBefore = await pinsShown(page);
  if (!pinsBefore) problems.push("no comment pin on the board before presenting, so hiding them isn't tested");
  await present.click();
  const presentBar = page.getByRole("toolbar", { name: "Presenting" });
  await presentBar.waitFor({ timeout: 10_000 });
  await until("the first frame, named", 10, async () => /Launch/.test((await presentBar.textContent()) ?? "") && /1 of 2/.test((await presentBar.textContent()) ?? ""));
  if (!(await page.locator("[data-present-mask]").count())) problems.push("presenting: nothing covers the rest of the board");
  if (await page.getByRole("navigation", { name: "Tools" }).count()) problems.push("presenting: the tools still show");
  await write("presenting.json", "{}");
  await until("the app follows", 60, async () => /Emil is following/.test((await presentBar.textContent()) ?? ""));
  await sleep(600);
  if (await pinsShown(page)) problems.push(`presenting: ${await pinsShown(page)} comment pins show over the talk`);
  await page.screenshot({ path: `${OUT}11-presenting-followed.png` });
  await page.keyboard.press("ArrowRight");
  await until("the second frame", 10, async () => /Plan/.test((await presentBar.textContent()) ?? "") && /2 of 2/.test((await presentBar.textContent()) ?? ""));
  await until("the app saw the second step", 60, () => exists("followed.txt"));
  await presentBar.getByRole("button", { name: "Done" }).click();
  await page.getByRole("navigation", { name: "Tools" }).waitFor({ timeout: 10_000 });
  if (!(await until("the pins back after Done", 5, async () => (await pinsShown(page)) === pinsBefore).catch(() => false)))
    problems.push(`after Done: ${await pinsShown(page)} comment pins, ${pinsBefore} before presenting`);
  await write("presented.json", "{}");

  // On a phone: the link opened there, as a guest opens it, signed in (round 14, web-07: the
  // board opened at 100% with both frames cut off at the sides). It opens whole, centred between
  // the title and the tools; Zoom to Fit is one tap away above the tools.
  const signedIn = await context.storageState();
  await context.close();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "light", storageState: signedIn });
  const phonePage = await phoneContext.newPage();
  current = phonePage;
  phonePage.on("console", (m) => { said.push(`${m.type()}: ${m.text().slice(0, 300)}`); if (m.type() === "error") problems.push(`console: ${m.text()}`); });
  phonePage.on("pageerror", (e) => problems.push(`page: ${e.message}`));
  await phonePage.goto(url);
  await phonePage.getByRole("navigation", { name: "Tools" }).waitFor({ timeout: 60_000 });
  await until("the board on the phone", 30, async () => (await elements(phonePage)).some((e) => e.id === drawn.id));
  await sleep(600);
  const whole = async () => {
    const v = await canvas(phonePage).evaluate(() => {
      const api = (window as unknown as { amber: { _canvas: { api: { getAppState(): { zoom: { value: number }; scrollX: number; scrollY: number; frameRendering: { clip: boolean } }; getSceneElements(): { x: number; y: number; width: number; height: number }[] } } } }).amber._canvas.api;
      const s = api.getAppState(), z = s.zoom.value, els = api.getSceneElements();
      const c = document.querySelector("#canvas") as HTMLElement | null, W = c?.clientWidth ?? innerWidth, H = c?.clientHeight ?? innerHeight;
      const x1 = Math.min(...els.map((e) => e.x)), y1 = Math.min(...els.map((e) => e.y));
      const x2 = Math.max(...els.map((e) => e.x + e.width)), y2 = Math.max(...els.map((e) => e.y + e.height));
      return { l: (x1 + s.scrollX) * z, r: (x2 + s.scrollX) * z, t: (y1 + s.scrollY) * z, b: (y2 + s.scrollY) * z, W, H, z, clip: s.frameRendering.clip };
    });
    return { v, ok: v.l >= 0 && v.t >= 0 && v.r <= v.W && v.b <= v.H };
  };
  const opened = await whole();
  const openedView = await viewOf(phonePage);
  log("phone opening view:", JSON.stringify(opened.v));
  if (!opened.ok) problems.push(`phone: the board didn't open whole: ${JSON.stringify(opened.v)}`);
  // A frame holds what's in it, as in Excalidraw, so its edge is never drawn through a shape; a
  // shape run mostly out of a frame leaves it (round 16; round 15: the edge crossed the yellow shape).
  if (opened.v.clip !== true) problems.push("phone: frames don't hold what's in them, so their edges run through shapes");
  const page2 = phonePage;
  const overflow = await page2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) problems.push("phone width: the page scrolls sideways");
  const fit = page2.getByRole("button", { name: "Zoom to fit" });
  if (!(await fit.isVisible())) problems.push("phone: Zoom to Fit isn't on the screen");
  const fitBox = await fit.boundingBox(), toolsBox = await page2.getByRole("navigation", { name: "Tools" }).boundingBox();
  if (fitBox && toolsBox && fitBox.y + fitBox.height > toolsBox.y) problems.push(`phone: Zoom to Fit isn't above the tools: ${JSON.stringify({ fitBox, toolsBox })}`);
  await page2.screenshot({ path: `${OUT}07-phone.png` });
  // Zoomed in on one corner, then Zoom to Fit: the whole board again.
  await canvas(page2).evaluate(() => {
    const api = (window as unknown as { amber: { _canvas: { api: { updateScene(s: unknown): void } } } }).amber._canvas.api;
    api.updateScene({ appState: { zoom: { value: 1.5 }, scrollX: 0, scrollY: 0 } });
  });
  await sleep(300);
  if ((await whole()).ok) problems.push("phone: zooming in didn't cut the board off, so Zoom to Fit isn't tested");
  await fit.click();
  await sleep(600);
  if (!(await whole()).ok) problems.push(`phone: Zoom to Fit didn't bring the whole board back: ${JSON.stringify((await whole()).v)}`);
  // Zoom to Fit gives the view the board opened with, not a smaller one (round 16, web-07 to web-08).
  const fitted = await viewOf(page2);
  if (JSON.stringify(fitted) !== JSON.stringify(openedView)) problems.push(`phone: Zoom to Fit differs from the opening view: ${JSON.stringify({ fitted, openedView })}`);
  // The toolbar fits the phone, whole: nothing scrolled or cut off (round 12), the rest in More Tools.
  const tools = await page2.getByRole("navigation", { name: "Tools" }).evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { left: r.left, right: r.right, scroll: n.scrollWidth - n.clientWidth, buttons: n.querySelectorAll("button").length };
  });
  if (tools.left < 0 || tools.right > 390 || tools.scroll > 0) problems.push(`phone width: the toolbar doesn't fit: ${JSON.stringify(tools)}`);
  await page2.getByRole("button", { name: "More tools" }).click();
  await page2.getByRole("menu", { name: "More tools" }).waitFor();
  await sleep(400);
  // Opening More Tools leaves the board as it was (round 16: it shrank).
  const withMenu = await viewOf(page2);
  if (JSON.stringify(withMenu) !== JSON.stringify(fitted)) problems.push(`phone: opening More Tools changed the board's view: ${JSON.stringify({ withMenu, fitted })}`);
  // More Tools shows the shapes before one is picked, not two lines (round 13, web-08).
  const shapes = await page2.locator('button[aria-label="More tools"] > svg').first().evaluate((svg) => ({ circle: svg.querySelectorAll("circle").length, rect: svg.querySelectorAll("rect").length }));
  if (!shapes.circle || !shapes.rect) problems.push(`More Tools' icon isn't the shapes: ${JSON.stringify(shapes)}`);
  // A touch screen has no keys: no letters beside the tools (round 14, web-08).
  const letters = await page2.locator('[role="menu"][aria-label="More tools"] kbd').evaluateAll((k) => k.filter((n) => getComputedStyle(n).display !== "none").length);
  if (letters) problems.push(`phone: More Tools shows ${letters} keyboard letters`);
  await page2.screenshot({ path: `${OUT}08-phone-more-tools.png` });
  await page2.getByRole("menuitemradio", { name: /Rectangle/ }).click();
  // The folded tool, once picked, shows on More Tools.
  // (The board says which tool it has a moment after the click.)
  if (!(await page2.getByRole("button", { name: "More tools", pressed: true }).waitFor({ timeout: 5000 }).then(() => true, () => false)))
    problems.push("phone width: More Tools doesn't show the picked tool");
  // A shape picked at phone width (with Select, as you pick one): its bar sits over the toolbar,
  // inside the window.
  await page2.getByRole("button", { name: "Select (V)" }).click();
  await select(page2, drawn.id);
  const dock = await page2.getByRole("toolbar", { name: "Selection" }).evaluate((n) => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right }; });
  if (dock.left < 0 || dock.right > 390) problems.push(`phone width: the selection's bar doesn't fit: ${JSON.stringify(dock)}`);
  await page2.screenshot({ path: `${OUT}09-phone-selected.png` });
  await phoneContext.close();

  // 7. Can comment: the app turned the link to Can comment. Cleo opens it in another browser,
  // signs in to comment, has no drawing tools (a key and a drag draw nothing), and comments on the
  // app's box with the Comment button; she edits it from its ⋯ menu. The app has it live.
  const linkC = (await until("comment-link.txt", 300, async () => (await exists("comment-link.txt")) && (await Deno.readTextFile(file("comment-link.txt"))).trim()));
  const atC = new URL(linkC);
  const second = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: "light" });
  const cpage = await second.newPage();
  current = cpage;
  cpage.on("console", (m) => { said.push(`cleo ${m.type()}: ${m.text().slice(0, 300)}`); if (m.type() === "error") problems.push(`console (cleo): ${m.text()}`); });
  cpage.on("pageerror", (e) => problems.push(`page (cleo): ${e.message}`));
  await cpage.goto(`${site.replace(/\/$/, "")}${atC.pathname}${atC.hash}`);
  await until("the board, for Cleo", 30, async () => (await elements(cpage)).some((e) => e.id === "mac-1"));
  await cpage.getByRole("button", { name: "Sign in to comment" }).waitFor();
  if (!(await cpage.getByText("View only until you sign in").count())) problems.push("a Comment link before signing in doesn't say view only");
  await signUp(cpage, commenterEmail, "Cleo Lind", "Sign in to comment");
  await cpage.locator("[data-comment-bar]").waitFor({ timeout: 60_000 });
  await cpage.getByRole("status").filter({ hasText: "Can comment" }).first().waitFor({ timeout: 10_000 });
  log("cleo joined, can comment");
  // Her board opens fitted, as an editor's does (round 15, comment-role-2: at 100%, Plan cut off).
  await sleep(600);
  const cv = await wholeIn(cpage);
  if (!cv.ok) problems.push(`the commenter's board didn't open whole: ${JSON.stringify(cv.v)}`);
  if (await cpage.getByRole("button", { name: "Rectangle (R)" }).count()) problems.push("a commenter has the drawing tools");
  if (await cpage.locator('header button[aria-label="More"]').count()) problems.push("a commenter has the board's More menu");
  const had = (await elements(cpage)).length;
  await cpage.mouse.click(900, 600);
  await cpage.keyboard.press("r");
  await cpage.mouse.move(880, 560); await cpage.mouse.down();
  for (let i = 1; i <= 8; i++) await cpage.mouse.move(880 + i * 15, 560 + i * 8);
  await cpage.mouse.up();
  await sleep(1000);
  if ((await elements(cpage)).length !== had) problems.push("a commenter drew on the board");
  // Her drag moved the view, as it does on a board you can't draw on: Zoom to Fit brings it all back.
  await cpage.getByRole("button", { name: "Zoom to fit" }).click();
  await sleep(600);
  if (!(await wholeIn(cpage)).ok) problems.push(`Zoom to Fit didn't bring the commenter's board back: ${JSON.stringify((await wholeIn(cpage)).v)}`);
  // The Comment button, then a click on the app's box.
  await cpage.getByRole("button", { name: "Comment (C)" }).click();
  await cpage.locator('[data-comment-bar] button[aria-pressed="true"]').waitFor({ timeout: 5000 });
  const spot = await onPage(cpage, "mac-1");
  await cpage.mouse.click(spot.x, spot.y);
  const draft = cpage.getByRole("dialog", { name: "New Comment" });
  await draft.waitFor({ timeout: 10_000 });
  const first = "Can this box be bigger?";
  await draft.getByLabel("Add a comment", { exact: true }).fill(first);
  // Beside the box, clear of it, of what's drawn near it and of the pins, as the app places it.
  await sleep(300);
  const under = await covers(cpage, (await draft.boundingBox())!, "mac-1");
  if (under.length) problems.push(`the new comment's box covers ${under.join(", ")}`);
  await cpage.screenshot({ path: `${OUT}12-commenter-commenting.png` });
  await draft.getByLabel("Add a comment", { exact: true }).press("Enter");
  const mine = cpage.getByRole("dialog", { name: "Comment", exact: true });
  await mine.getByText(first).waitFor();
  await sleep(300);
  const underThread = await covers(cpage, (await mine.boundingBox())!, "mac-1");
  if (underThread.length) problems.push(`her comment's thread covers ${underThread.join(", ")}`);
  // Her own comment's Edit and Delete are in its ⋯ menu (round 14, web-06).
  if (await mine.getByRole("button", { name: "Edit", exact: true }).count()) problems.push("Edit shows outside the ⋯ menu");
  await mine.locator("[data-comment-more]").click();
  await cpage.getByRole("menu", { name: "Comment" }).waitFor();
  await cpage.screenshot({ path: `${OUT}13-comment-more-menu.png` });
  await cpage.getByRole("menuitem", { name: "Edit" }).click();
  const words = "Can this box be twice as wide?";
  const field = mine.getByLabel("Comment", { exact: true });
  await field.fill(words);
  await mine.getByRole("button", { name: "Save" }).click();
  await mine.getByText(words).waitFor();
  await mine.getByText("Edited").waitFor();
  const cleo = await cpage.evaluate(() => JSON.parse(localStorage.getItem("pinto.connect.session") ?? "{}").user_id as string);
  // TestPeople.cleo's id, so she's violet here as in the app's pictures.
  if (cleo !== "c1e00000-0000-4000-8000-000000000002") problems.push(`Cleo signed in as ${cleo}, not the test's account`);
  await write("commenter.json", JSON.stringify({ user: cleo, text: words }));
  log("cleo commented");
  await until("commented.txt", 120, () => exists("commented.txt"));

  // 8. Show change on an AI's reply, in her browser (round 16, as the app's): the app's AI replied
  // to her comment naming a box it added; Show change outlines it with the AI's name and brings it
  // into view. Once the box is gone, her thread says the change is no longer on the board.
  const ai = JSON.parse(await until("ai.json", 120, async () => (await exists("ai.json")) && await Deno.readTextFile(file("ai.json")))) as { thread: string; reply: string };
  await until("the AI's box", 30, async () => (await elements(cpage)).some((e) => e.id === "ai-1"));
  // The view moved on so the AI's box is just off the right edge (her pin still shows), so Show
  // change has to bring it back.
  await canvas(cpage).evaluate(() => {
    const api = (window as unknown as { amber: { _canvas: { api: { updateScene(u: unknown): void; getAppState(): { scrollX: number; zoom: { value: number } }; getSceneElements(): { id: string; x: number }[] } } } }).amber._canvas.api;
    const s = api.getAppState(), z = s.zoom.value, box = api.getSceneElements().find((e) => e.id === "ai-1")!;
    const W = (document.querySelector("#canvas") as HTMLElement | null)?.clientWidth ?? innerWidth;
    api.updateScene({ appState: { scrollX: W / z - box.x + 40 } });
  });
  await sleep(400);
  if (!(await mine.isVisible())) await canvas(cpage).locator(`.pinto-pin[data-comment="${ai.thread}"]`).click();
  await mine.getByText("I added a box on Plan").waitFor({ timeout: 30_000 });
  // The AI's reply shows the AI's own mark, as in the app, not a grey letter (round 16).
  const marks = await mine.locator("[data-ai-mark]").evaluateAll((n) => n.map((x) => ({ mark: (x as HTMLElement).dataset.aiMark, text: (x.textContent ?? "").trim(), svg: !!x.querySelector("svg path") })));
  if (marks.length !== 1 || marks[0].mark !== "claude" || marks[0].text || !marks[0].svg) problems.push(`the AI's reply doesn't show Claude's mark: ${JSON.stringify(marks)}`);
  await cpage.screenshot({ path: `${OUT}14a-ai-reply-thread.png` });
  const offAt = await onPage(cpage, "ai-1"), offFrame = (await cpage.locator("iframe").first().boundingBox())!;
  if (offAt.x < offFrame.x + offFrame.width) problems.push(`the AI's box wasn't moved out of view first: ${JSON.stringify({ offAt, offFrame })}`);
  await mine.locator("[data-show-change]").click();
  const outline = cpage.locator("[data-outline]");
  await outline.waitFor({ timeout: 10_000 });
  const tag = (await outline.locator("b").textContent())?.trim() ?? "";
  if (!/Claude$/.test(tag)) problems.push(`Show change doesn't name the AI: ${tag}`);
  await sleep(800);
  const aiAt = await onPage(cpage, "ai-1");
  const frameBox = (await cpage.locator("iframe").first().boundingBox())!;
  if (aiAt.x < frameBox.x || aiAt.x > frameBox.x + frameBox.width || aiAt.y < frameBox.y || aiAt.y > frameBox.y + frameBox.height)
    problems.push(`Show change didn't bring the change into view: ${JSON.stringify({ aiAt, frameBox })}`);
  await cpage.screenshot({ path: `${OUT}14-commenter-show-change.png` });
  await write("shown.json", "{}");
  await until("the AI's box gone", 60, async () => !(await elements(cpage)).some((e) => e.id === "ai-1"));
  await sleep(4500);
  await canvas(cpage).locator(`.pinto-pin[data-comment="${ai.thread}"]`).click();
  const again = cpage.getByRole("dialog", { name: "Comment", exact: true });
  await again.locator("[data-change-gone]").waitFor({ timeout: 10_000 });
  if (await again.locator("[data-show-change]").count()) problems.push("Show change still offered for a change that's gone");
  await cpage.screenshot({ path: `${OUT}15-commenter-change-gone.png` });
  await write("gone-seen.json", "{}");
  await again.getByRole("button", { name: "Close" }).click();
  await again.waitFor({ state: "detached", timeout: 5000 });
  log("show change: outlined, in view, gone");

  // 9. Voting and a timer between two browsers (round 16): Sara, who edits, starts voting with
  // three votes each; Cleo, who comments, sees it and votes for the app's box; Sara votes and sees
  // how many are in; she ends it and both see the totals; then her timer counts down on Cleo's board.
  const third = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: "light", storageState: signedIn });
  const spage = await third.newPage();
  current = spage;
  spage.on("console", (m) => { said.push(`sara ${m.type()}: ${m.text().slice(0, 300)}`); if (m.type() === "error") problems.push(`console (sara): ${m.text()}`); });
  spage.on("pageerror", (e) => problems.push(`page (sara): ${e.message}`));
  await spage.goto(url);
  await spage.getByRole("navigation", { name: "Tools" }).waitFor({ timeout: 60_000 });
  await until("the board, for Sara", 30, async () => (await elements(spage)).some((e) => e.id === drawn.id));
  await sleep(800);
  await spage.locator('header button[aria-label="More"]').click();
  await spage.locator("[data-start-voting]").click();
  await spage.locator('[data-votes="3"]').click();
  await spage.locator("[data-team-voting]").waitFor({ timeout: 10_000 });
  await cpage.locator("[data-votes-left]").filter({ hasText: "3 votes left" }).waitFor({ timeout: 20_000 });
  if (!(await cpage.getByText("Sara started it").count())) problems.push("Cleo's bar doesn't say who started voting");
  // While voting, nobody's pointer or selection shows on anyone's board (round 16): Sara's pointer
  // is over Cleo's board, hidden until the results.
  for (let i = 0; i < 6; i++) { await spage.mouse.move(640 + i * 12, 380 + i * 8); await sleep(150); }
  await sleep(1500);
  const peersShown = (p: Page) => canvas(p).evaluate(() => [...document.querySelectorAll<HTMLElement>(".pinto-peer-pointer, .pinto-peer-box")].filter((n) => n.offsetParent !== null).length);
  if (await peersShown(cpage)) problems.push(`voting: ${await peersShown(cpage)} of other people's pointers and selections show on Cleo's board`);
  const cleoVote = await onPage(cpage, "mac-1");
  await cpage.mouse.click(cleoVote.x, cleoVote.y);
  await cpage.locator("[data-votes-left]").filter({ hasText: "2 votes left" }).waitFor({ timeout: 10_000 });
  if ((await canvas(cpage).locator(".pinto-vote-dot:visible").count()) !== 1) problems.push("Cleo's vote has no dot on her board");
  if (await cpage.getByRole("dialog", { name: "New Comment" }).count()) problems.push("a vote started a comment");
  for (const id of [drawn.id, drawn.id, "mac-1"]) {
    const at = await onPage(spage, id);
    await spage.mouse.click(at.x, at.y);
    await sleep(250);
  }
  await spage.locator("[data-votes-left]").filter({ hasText: "No votes left" }).waitFor({ timeout: 10_000 });
  await spage.locator("[data-votes-in]").filter({ hasText: "4 votes in" }).waitFor({ timeout: 20_000 });
  const selectedNow = await canvas(spage).evaluate(() => Object.keys((window as unknown as { amber: { _canvas: { api: { getAppState(): { selectedElementIds: Record<string, boolean> } } } } }).amber._canvas.api.getAppState().selectedElementIds));
  if (selectedNow.length) problems.push(`a vote selected ${selectedNow.join(", ")}`);
  await spage.screenshot({ path: `${OUT}16-voting-placing.png` });
  await cpage.screenshot({ path: `${OUT}17-commenter-voting.png` });
  await spage.locator("[data-team-bar]").getByRole("button", { name: "End voting" }).click();
  await cpage.locator("[data-team-results]").filter({ hasText: "Results: 4 votes" }).waitFor({ timeout: 20_000 });
  const totals = await canvas(cpage).locator(".pinto-vote-total:visible").evaluateAll((n) => n.map((x) => `${(x as HTMLElement).dataset.on}:${x.textContent}`).sort());
  if (JSON.stringify(totals) !== JSON.stringify([`${drawn.id}:2`, "mac-1:2"].sort())) problems.push(`the totals on Cleo's board: ${JSON.stringify(totals)}`);
  // A total never sits on a comment pin (round 16, web-16).
  const onPins = await canvas(cpage).evaluate(() => {
    const r = (n: Element) => n.getBoundingClientRect();
    const pins = [...document.querySelectorAll(".pinto-pin")].map(r).filter((b) => b.width > 0);
    return [...document.querySelectorAll(".pinto-vote-total")].map(r).filter((t) => t.width > 0 && pins.some((p) => Math.min(t.right, p.right) - Math.max(t.left, p.left) > 0 && Math.min(t.bottom, p.bottom) - Math.max(t.top, p.top) > 0)).length;
  });
  if (onPins) problems.push(`results: ${onPins} vote totals sit on a comment pin`);
  // The results are shown, so the pointers are back.
  for (let i = 0; i < 6; i++) { await spage.mouse.move(700 - i * 12, 420 - i * 8); await sleep(150); }
  if (!(await until("Sara's pointer back on Cleo's board", 15, () => peersShown(cpage)).catch(() => 0))) problems.push("results: other people's pointers don't come back");
  await cpage.screenshot({ path: `${OUT}18-voting-results.png` });
  await spage.locator("[data-team-bar]").getByRole("button", { name: "Done" }).click();
  await cpage.locator("[data-team-bar]").waitFor({ state: "detached", timeout: 20_000 });
  await spage.locator('header button[aria-label="More"]').click();
  await spage.locator("[data-timer]").click();
  await spage.locator('[data-minutes="1"]').click();
  const clockC = cpage.locator('[data-team-timer="running"]');
  await clockC.waitFor({ timeout: 20_000 });
  await sleep(1200);
  const shown = (await clockC.textContent())?.trim() ?? "";
  if (!/^(1:00|0:5\d)$/.test(shown)) problems.push(`Cleo's timer shows ${shown}`);
  await cpage.screenshot({ path: `${OUT}19-commenter-timer.png` });
  await spage.locator("[data-team-bar]").getByRole("button", { name: "Stop" }).click();
  await cpage.locator("[data-team-bar]").waitFor({ state: "detached", timeout: 20_000 });
  log("voting and timer: live between the two browsers");
  await third.close();
  await second.close();
} catch (e) {
  // What the page had when it stopped: a picture, the canvas's state, and its last lines.
  log("failed:", (e as Error).message);
  const page = current;
  if (page) {
    await page.screenshot({ path: `${OUT}failed.png` }).catch(() => {});
    const state = await canvas(page)?.evaluate(() => {
      const api = (window as unknown as { amber: { _canvas?: { api: { getAppState(): Record<string, unknown>; getSceneElements(): { id: string; type: string }[] } } } }).amber._canvas?.api;
      if (!api) return "no canvas api";
      const s = api.getAppState();
      return JSON.stringify({ view: s.viewModeEnabled, tool: s.activeTool, elements: api.getSceneElements().map((x) => `${x.id}:${x.type}`) });
    }).catch((x) => String(x));
    log("canvas:", state);
    log("tools pressed:", await page.locator("nav[aria-label=Tools] button[aria-pressed=true]").getAttribute("aria-label").catch(() => "none"));
  }
  log("last lines:\n" + said.slice(-30).join("\n"));
  throw e;
} finally {
  await browser.close();
}
const real = problems.filter((p) => !/favicon|Failed to load resource: the server responded with a status of 404/.test(p));
if (real.length) { log("problems:\n" + real.join("\n")); Deno.exit(1); }
log("ok");
