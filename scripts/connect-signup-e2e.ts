// Signing up on the web connect page, end to end, on a LOCAL stack only (scripts/connect-signup-e2e.sh
// starts everything; never staging or production): a brand-new person starts connecting ChatGPT,
// signs up on /connect in headless Chromium (no window), allows it, and the AI's tokens then write a
// note and read it back over MCP. Captures go to build/repro/<phase>/.
//
//   deno run -A scripts/connect-signup-e2e.ts <phase: before|after> <site url>
//   env: API_URL, ANON_KEY, SERVICE_ROLE_KEY, MAILPIT_URL (from `supabase status -o env`)
//
// Two people, each brand new:
//   email   types an address with no account on an Android phone, gets the code from Mailpit (the
//           local stack's mailbox; nothing is sent), and signs up with it.
//   google  comes back from Sign in with Google with a new account, on an iPhone: the page's kept
//           session, as the round trip leaves it (Google itself can't run on a local stack).
// "before" records the dead end; "after" goes through to the AI's note and prints, as JSON, what
// the app-side test needs (scripts/connect-signup-e2e.sh passes it on to ConnectSignupLiveTests).
import { chromium, type Page } from "npm:playwright-core@1.63.0";

const [phase, site] = Deno.args;
if (phase !== "before" && phase !== "after") throw new Error("phase: before or after");
const API = Deno.env.get("API_URL")!, ANON = Deno.env.get("ANON_KEY")!, SERVICE = Deno.env.get("SERVICE_ROLE_KEY")!;
const MAIL = Deno.env.get("MAILPIT_URL")!;
for (const u of [API, site, MAIL]) if (!/^http:\/\/127\.0\.0\.1:\d+\/?$/.test(u)) throw new Error(`not a local address: ${u}`);
const MCP = `${API}/functions/v1/mcp`;
const OUT = new URL(`../build/repro/${phase}/`, import.meta.url).pathname;
await Deno.mkdir(OUT, { recursive: true });
const CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";
const SHELL = `${Deno.env.get("HOME")}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const run = crypto.randomUUID().slice(0, 8);
const admin = { authorization: `Bearer ${SERVICE}`, apikey: SERVICE, "content-type": "application/json" };

const DEVICES = {
  android: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36" },
  iphone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1" },
};

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/// What ChatGPT does: registers, then sends the person to /authorize, which lands on /connect.
async function startConnecting() {
  const reg = await (await fetch(`${MCP}/register`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_name: "ChatGPT", redirect_uris: [CHATGPT], token_endpoint_auth_method: "none" }) })).json();
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const q = new URLSearchParams({ response_type: "code", client_id: reg.client_id, redirect_uri: CHATGPT, code_challenge: challenge,
    code_challenge_method: "S256", state: `s-${run}`, scope: "notes:read notes:write", resource: MCP });
  const res = await fetch(`${MCP}/authorize?${q}`, { redirect: "manual" });
  const to = new URL(res.headers.get("location")!);
  const request = to.searchParams.get("request");
  if (!request) throw new Error(`authorize went to ${to}`);
  return { client: reg.client_id as string, verifier, request };
}

/// Everything the page showed, at every change: nothing about a key may ever appear.
const KEY_WORDS = /recovery|passphrase|\bkey\b|encrypt/i;
async function watchText(page: Page) {
  const seen: string[] = [];
  await page.exposeFunction("__seen", (t: string) => { seen.push(t); });
  await page.addInitScript(() => {
    const send = () => (window as unknown as { __seen(t: string): void }).__seen(document.querySelector("main")?.textContent ?? "");
    new MutationObserver(send).observe(document, { childList: true, subtree: true, characterData: true });
  });
  return seen;
}

async function codeFor(email: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) {
      const m = await (await fetch(`${MAIL}/api/v1/message/${id}`)).json();
      const code = /\b(\d{6})\b/.exec(m.Text ?? "")?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("no code arrived");
}

async function browser() {
  return await chromium.launch({ executablePath: SHELL, headless: true });
}

/// The way back to ChatGPT, answered here: nothing leaves this machine.
async function catchReturn(page: Page): Promise<() => string | null> {
  let back: string | null = null;
  await page.route("https://chatgpt.com/**", (route) => {
    back = route.request().url();
    return route.fulfill({ status: 200, contentType: "text/html", body: "<title>ChatGPT</title><p>Back at ChatGPT (stand-in)</p>" });
  });
  return () => back;
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}${name}.png`, fullPage: true });
const text = (page: Page) => page.locator("main").innerText();

async function emailPerson(log: Record<string, unknown>) {
  const b = await browser();
  const ctx = await b.newContext(DEVICES.android);
  const page = await ctx.newPage();
  const seen = await watchText(page);
  const back = await catchReturn(page);
  const { client, verifier, request } = await startConnecting();
  const email = `signup-${run}@pane.local`;
  await page.goto(`${site}/connect?request=${request}`);
  await page.locator("#connect-email").waitFor();
  await shot(page, "android-1-sign-in");
  await page.fill("#connect-email", email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  if (phase === "before") {
    await page.getByText("No Pinto Notes account uses this email.").first().waitFor();
    await shot(page, "android-2-dead-end");
    log.email = { dead_end: (await text(page)).includes("Accounts start in the app") };
    await b.close();
    return;
  }
  await page.getByRole("heading", { name: "Check your email" }).waitFor();
  await shot(page, "android-2-code");
  await page.fill("#connect-code", await codeFor(email));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Allow", exact: true }).waitFor({ timeout: 20_000 })
    .catch(async (e) => { await shot(page, "android-failed"); throw e; });
  const card = page.locator("[data-testid=connect-get-app]");
  await card.waitFor();
  await shot(page, "android-3-consent-with-card");
  await page.emulateMedia({ colorScheme: "dark" });
  // The buttons' colours ease for 0.15 s: the picture after they settle.
  await page.waitForTimeout(600);
  await shot(page, "android-3-consent-with-card-dark");
  await page.emulateMedia({ colorScheme: "light" });
  const cardText = await card.innerText();
  const cardLinks = await card.locator("a").count();
  await page.getByRole("button", { name: "Allow", exact: true }).click();
  for (let i = 0; i < 100 && !back(); i++) await page.waitForTimeout(100);
  const returned = back();
  if (!returned) throw new Error("never went back to ChatGPT");
  const code = new URL(returned).searchParams.get("code")!;
  await page.goto(`${site}/connect?request=${request}`).catch(() => {});
  await b.close();

  // ChatGPT's side: the code for tokens, then a note written and read back.
  const tok = await (await fetch(`${MCP}/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: CHATGPT, client_id: client, code_verifier: verifier }) })).json();
  if (!tok.access_token) throw new Error(`token: ${JSON.stringify(tok)}`);
  const words = `Groceries for Saturday, written by ChatGPT (${run})`;
  let sid: string | null = null, id = 1;
  const rpc = async (method: string, params: unknown) => {
    const res = await fetch(MCP, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream",
      authorization: `Bearer ${tok.access_token}`, ...(sid ? { "mcp-session-id": sid } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }) });
    sid ??= res.headers.get("mcp-session-id");
    const raw = await res.text();
    const json = raw.startsWith("{") ? JSON.parse(raw) : JSON.parse(raw.split("\n").find((l) => l.startsWith("data:"))!.slice(5));
    if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
    return json.result;
  };
  await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "connect-signup-e2e", version: "1" } });
  const made = await rpc("tools/call", { name: "create", arguments: { path: "Groceries.md", content: `${words}\n\n- [ ] milk\n- [ ] eggs` } });
  const read = await rpc("tools/call", { name: "fetch", arguments: { path: "Groceries.md" } });
  const readText = JSON.stringify(read);
  const user = await (await fetch(`${API}/auth/v1/admin/users?per_page=200`, { headers: admin })).json();
  const uid = user.users.find((u: { email: string }) => u.email === email)?.id;
  log.email = {
    email, user_id: uid, card: cardText, card_links: cardLinks, returned_to: new URL(returned).origin + new URL(returned).pathname,
    token_scope: tok.scope, mcp_create_error: made.isError ?? false, mcp_read_back: readText.includes(words), words,
    key_words_seen: seen.filter((t) => KEY_WORDS.test(t)),
  };
}

async function googlePerson(log: Record<string, unknown>) {
  // A new account, as Sign in with Google makes one, and the session its round trip leaves on the page.
  const email = `google-${run}@pane.local`, password = crypto.randomUUID();
  const made = await (await fetch(`${API}/auth/v1/admin/users`, { method: "POST", headers: admin,
    body: JSON.stringify({ email, password, email_confirm: true, app_metadata: { provider: "google", providers: ["google"] } }) })).json();
  const s = await (await fetch(`${API}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password }) })).json();
  const b = await browser();
  const ctx = await b.newContext(DEVICES.iphone);
  await ctx.addInitScript((v) => { try { localStorage.setItem("pinto.connect.session", v); } catch {} },
    JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token, user_id: made.id, email }));
  const page = await ctx.newPage();
  const seen = await watchText(page);
  await catchReturn(page);
  const { request } = await startConnecting();
  await page.goto(`${site}/connect?request=${request}`);
  if (phase === "before") {
    await page.getByText("No Pinto Notes account uses this email.").first().waitFor({ timeout: 20_000 });
    await shot(page, "iphone-google-dead-end");
    log.google = { dead_end: true };
  } else {
    await page.getByRole("button", { name: "Allow", exact: true }).waitFor({ timeout: 20_000 });
    const card = page.locator("[data-testid=connect-get-app]");
    await card.waitFor();
    await shot(page, "iphone-google-consent-with-card");
    log.google = { card: await card.innerText(), card_link: await card.locator("a").getAttribute("href"), key_words_seen: seen.filter((t) => KEY_WORDS.test(t)) };
    // The same page in dark mode.
    const dark = await b.newContext({ ...DEVICES.iphone, colorScheme: "dark" });
    await dark.addInitScript((v) => { try { localStorage.setItem("pinto.connect.session", v); } catch {} },
      JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token, user_id: made.id, email }));
    const p2 = await dark.newPage();
    // An account that has its key now (made a moment ago) is an existing one: no card.
    const again = await startConnecting();
    await p2.goto(`${site}/connect?request=${again.request}`);
    await p2.getByRole("button", { name: "Allow", exact: true }).waitFor({ timeout: 20_000 });
    await shot(p2, "iphone-existing-account-dark-no-card");
    (log.google as Record<string, unknown>).existing_has_card = await p2.locator("[data-testid=connect-get-app]").count() > 0;
  }
  await b.close();
  await fetch(`${API}/auth/v1/admin/users/${made.id}`, { method: "DELETE", headers: admin });
}

const log: Record<string, unknown> = { phase, run };
await emailPerson(log);
await googlePerson(log);
await Deno.writeTextFile(`${OUT}result.json`, JSON.stringify(log, null, 2) + "\n");
console.log(JSON.stringify(log));
