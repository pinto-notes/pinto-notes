// The browser side of a whiteboard edited at once in the app and in a browser, on a LOCAL stack
// only (scripts/board-web-e2e.sh starts everything; never staging or production). Headless
// Chromium, no window. The app's side is PaneTests/Collab/BoardWebLiveTests.swift; the two meet
// through files in <dir> (that test says what each one writes).
//
//   deno run -A scripts/board-web-e2e.ts <site url> <dir> <email>
//   env: API_URL, MAILPIT_URL (from `supabase status -o env`)
//
// Pictures go to build/repro/board-web/.
/// <reference lib="dom" />
import { chromium, type Frame, type Page } from "npm:playwright-core@1.63.0";

const [site, dir, email] = Deno.args;
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
  await present.click();
  const presentBar = page.getByRole("toolbar", { name: "Presenting" });
  await presentBar.waitFor({ timeout: 10_000 });
  await until("the first frame, named", 10, async () => /Launch/.test((await presentBar.textContent()) ?? "") && /1 of 2/.test((await presentBar.textContent()) ?? ""));
  if (!(await page.locator("[data-present-mask]").count())) problems.push("presenting: nothing covers the rest of the board");
  if (await page.getByRole("navigation", { name: "Tools" }).count()) problems.push("presenting: the tools still show");
  await write("presenting.json", "{}");
  await until("the app follows", 60, async () => /Emil is following/.test((await presentBar.textContent()) ?? ""));
  await sleep(600);
  await page.screenshot({ path: `${OUT}11-presenting-followed.png` });
  await page.keyboard.press("ArrowRight");
  await until("the second frame", 10, async () => /Plan/.test((await presentBar.textContent()) ?? "") && /2 of 2/.test((await presentBar.textContent()) ?? ""));
  await until("the app saw the second step", 60, () => exists("followed.txt"));
  await presentBar.getByRole("button", { name: "Done" }).click();
  await page.getByRole("navigation", { name: "Tools" }).waitFor({ timeout: 10_000 });
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
  log("phone opening view:", JSON.stringify(opened.v));
  if (!opened.ok) problems.push(`phone: the board didn't open whole: ${JSON.stringify(opened.v)}`);
  // While you work a frame doesn't cut what runs over its edge (round 14, web-09: a sliver).
  if (opened.v.clip !== false) problems.push("phone: frames cut the shapes that run over their edges");
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
  // The toolbar fits the phone, whole: nothing scrolled or cut off (round 12), the rest in More Tools.
  const tools = await page2.getByRole("navigation", { name: "Tools" }).evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { left: r.left, right: r.right, scroll: n.scrollWidth - n.clientWidth, buttons: n.querySelectorAll("button").length };
  });
  if (tools.left < 0 || tools.right > 390 || tools.scroll > 0) problems.push(`phone width: the toolbar doesn't fit: ${JSON.stringify(tools)}`);
  await page2.getByRole("button", { name: "More tools" }).click();
  await page2.getByRole("menu", { name: "More tools" }).waitFor();
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
