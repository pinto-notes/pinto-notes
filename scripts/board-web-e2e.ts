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
  await page.screenshot({ path: `${OUT}01-view-before-sign-in.png` });

  // 2. Sign in to edit: an email code, and an account made with it; then a name.
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
  for (let i = 0; i < 8; i++) { await page.mouse.move(700 + i * 10, 300 + i * 6); await sleep(120); }
  await write("browser.json", JSON.stringify({ user, element: drawn.id }));
  log("drew", drawn.id);

  // 4. The app's move, its pointer and its comment arrive; the reply goes back.
  const mac = JSON.parse(await until("mac.json", 120, async () => (await exists("mac.json")) && await Deno.readTextFile(file("mac.json")))) as { comment: string };
  await until("the app's move", 30, async () => (await elements(page)).some((e) => e.id === "mac-1" && e.x === 260));
  const pointer = await until("the app's pointer on the board", 30, () => canvas(page).evaluate(() => {
    const p = [...document.querySelectorAll<HTMLElement>(".pinto-peer")].find((n) => n.style.display !== "none" && n.offsetParent !== null);
    return p ? (p.textContent ?? "").trim() || "shown" : null;
  }));
  log("the app's pointer:", pointer);
  await page.screenshot({ path: `${OUT}04-board-with-the-apps-pointer.png` });
  const pin = canvas(page).locator(`.pinto-pin[data-comment="${mac.comment}"]`);
  await pin.waitFor({ timeout: 30_000 });
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
  await page.screenshot({ path: `${OUT}06-thread.png` });

  // 5. The app says it has all of it.
  await until("done.txt", 120, () => exists("done.txt"));

  // Phone width, for looking: the board, its title and Comments, nothing cut off.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape");
  await sleep(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) problems.push("phone width: the page scrolls sideways");
  await page.screenshot({ path: `${OUT}07-phone.png` });
  await context.close();
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
