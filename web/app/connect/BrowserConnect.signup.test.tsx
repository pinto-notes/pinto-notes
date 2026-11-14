// @vitest-environment happy-dom
// Signing up on the connect page (Emil, 14 November 2026): someone with no Pinto Notes account
// starts connecting an AI, signs up right there (email code, Google or Apple), and goes straight on
// to the consent and Allow. The account's key is made out of sight (lib/account-key.ts): no key
// step, no recovery key, no extra click. A small card under the consent says where the notes live,
// for a new account only.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseLabel } from "@/lib/connect";
import { SESSION_KEY } from "@/lib/connect-browser";
import { APP_STORE_URL } from "@/lib/site";
import BrowserConnect from "./BrowserConnect";
import { NewAccountCard, newAccountWords, SIGN_IN_LEDE } from "./BrowserScreens";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ID = "5a0f6c1e-2b1d-4c36-9e0a-6b6f0c1a2b3c";
const USER = "7c0f1d2e-3a4b-4c5d-8e6f-0a1b2c3d4e5f";
const SUPABASE = "https://ref.supabase.co";
const MCP = `${SUPABASE}/functions/v1/mcp`;
const KEY = `${SUPABASE}/functions/v1/key`;
const CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";
const BACK = `${CHATGPT}?state=s1&code=amb_code_${"ab".repeat(32)}`;

type Call = { url: string; init: RequestInit; body: Record<string, unknown> };

/// A fake Supabase: auth, the MCP function's connect routes and the key function. `hasKey`: the
/// account has a key already (an existing account). The key function's create gives it one.
async function fakeServer(o: { hasKey: boolean; keyFunction?: "on" | "off" }) {
  const calls: Call[] = [];
  let hasKey = o.hasKey;
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const pub = Buffer.from(await crypto.subtle.exportKey("raw", pair.publicKey)).toString("base64");
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    calls.push({ url, init, body });
    const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
    const session = { access_token: "at-1", refresh_token: "rt-1", user: { id: USER, email: "new@example.com" } };
    if (url === `${SUPABASE}/auth/v1/otp`) return json({});
    if (url === `${SUPABASE}/auth/v1/verify`) return body.token === "123456" ? json(session) : json({ error_code: "otp_expired" }, 403);
    if (url === `${SUPABASE}/auth/v1/token?grant_type=refresh_token`) return json({ ...session, refresh_token: "rt-2" });
    if (url.startsWith(`${SUPABASE}/auth/v1/logout`)) return new Response(null, { status: 204 });
    if (url === `${MCP}/connect/request?id=${ID}`) {
      return json({ id: ID, client_name: "ChatGPT", claimed_name: null, redirect_host: "chatgpt.com", redirect_uri: CHATGPT, verified_ai: "ChatGPT",
        loopback: false, wants_write: true, expires_at: new Date(Date.now() + 600_000).toISOString(),
        ...(hasKey ? { allow_here: true, allow_here_why: null } : { allow_here: false, allow_here_why: "no_key" }) });
    }
    if (url === KEY && (init.method ?? "GET") === "GET") return o.keyFunction === "off" ? json({ hint: "off" }, 503) : json({ on: true, pub, ticket: "1.9999999999.dGlja2V0" });
    if (url === KEY && body.op === "create") {
      if (hasKey) return json({ hint: "key_exists" }, 409);
      hasKey = true;
      return json({ created: true });
    }
    if (url === `${MCP}/connect/allow`) return json({ redirect: BACK, client_name: "ChatGPT" });
    if (url === `${MCP}/connect/release`) return json({ released: true });
    return json({ error: "not_found" }, 404);
  });
  return { calls, fetch };
}

let root: Root;
let container: HTMLElement;
let assigned: string[];
/// Everything the page showed, at every change, so a test can say what never appeared.
let shown: string[];
let observer: MutationObserver;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  assigned = [];
  shown = [];
  localStorage.clear();
  document.documentElement.dataset.platform = "mac";
  observer = new MutationObserver(() => shown.push(container.textContent ?? ""));
  observer.observe(container, { childList: true, subtree: true, characterData: true });
  vi.spyOn(window.location, "assign").mockImplementation((u: string | URL) => { assigned.push(String(u)); });
});

afterEach(() => {
  observer.disconnect();
  act(() => root.unmount());
  container.remove();
  delete document.documentElement.dataset.platform;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function until(check: () => boolean, ms = 3000) {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error("timed out; page shows: " + container.textContent);
    await act(() => new Promise((r) => setTimeout(r, 10)));
  }
}

const LABEL = parseLabel({ claimed_name: "ChatGPT", redirect_host: "chatgpt.com", allow_here: true, verified_ai: "ChatGPT" });
const render = () => act(() => root.render(<BrowserConnect requestId={ID} supabaseURL={SUPABASE} anonKey="anon" inApp={<p>the page as it was</p>} label={LABEL} />));
const heading = () => container.querySelector("h1")?.textContent;
const button = (text: string) => [...container.querySelectorAll("button")].find((b) => b.textContent === text)!;
const card = () => container.querySelector("[data-testid=connect-get-app]");
function type(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => { set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
}
const submit = (form: HTMLFormElement) => act(() => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

/// Nothing about a key: no key step, no recovery key, no passphrase, no "making your key".
const KEY_WORDS = /recovery|passphrase|\bkey\b|encrypt|save this|write (this|it) down/i;

/// Signed in with Google or Apple on this page a moment ago: back with a session kept here.
const backFromGoogle = () => localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "at-0", refresh_token: "rt-0", user_id: USER, email: "new@example.com" }));

describe("signing up on the connect page", () => {
  it("a new Google or Apple account gets its key made out of sight, then the consent, Allow, and the card about the app", async () => {
    const server = await fakeServer({ hasKey: false });
    vi.stubGlobal("fetch", server.fetch);
    backFromGoogle();
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?" && !!button("Allow"));

    // The key went to the server's key function: a ticket, then one create with the row and the copy.
    const create = server.calls.find((c) => c.url === KEY && c.body.op === "create")!;
    expect(create).toBeTruthy();
    expect(create.body.key_id).toMatch(/^[0-9a-f]{16}$/);
    expect(create.body.verifier).toMatch(/^[0-9a-f]{64}$/);
    expect(String(create.body.recovery_wrap).startsWith(`amb2.${create.body.key_id}.`)).toBe(true);
    expect(String(create.body.box)).toMatch(/^amb2t\.[A-Za-z0-9+/]+={0,2}$/);
    expect(create.body.platform).toBe("web");
    expect(new Headers(create.init.headers).get("authorization")).toBe("Bearer at-1");
    // Standard, never strict: nothing in the request chooses a mode.
    expect(JSON.stringify(create.body)).not.toMatch(/strict|mode|choose/);

    // The card, under the consent, for this new account.
    expect(card()).toBeTruthy();
    expect(card()!.textContent).toContain("Pinto Notes is an app for iPhone and Mac. Your notes live there, with everything ChatGPT writes.");
    const link = card()!.querySelector("a")!;
    expect([link.textContent, link.getAttribute("href"), link.getAttribute("target")]).toEqual(["Download for Mac", "/download", "_blank"]);
    // Under the step: after Allow in the page's order.
    expect(button("Allow").compareDocumentPosition(card()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    act(() => button("Allow").click());
    await until(() => assigned.length === 1);
    expect(assigned[0]).toBe(BACK);
    expect(heading()).toBe("Connected");

    // At no moment a key, a recovery key, or a step about one.
    expect(shown.length).toBeGreaterThan(0);
    for (const t of shown) expect(t).not.toMatch(KEY_WORDS);
    // No extra button anywhere: the consent's two answers and Use another account.
  });

  it("an unknown email signs up with its code and goes straight to the consent, with no extra step", async () => {
    const server = await fakeServer({ hasKey: false });
    vi.stubGlobal("fetch", server.fetch);
    render();
    await until(() => !!container.querySelector("#connect-email"));
    expect(container.textContent).toContain(SIGN_IN_LEDE);
    expect(SIGN_IN_LEDE).toBe("Sign in or sign up, then choose Allow.");
    type(container.querySelector<HTMLInputElement>("#connect-email")!, "new@example.com");
    submit(container.querySelector("form")!);
    await until(() => heading() === "Check your email");
    expect(server.calls.find((c) => c.url.endsWith("/auth/v1/otp"))!.body).toEqual({ email: "new@example.com", create_user: true });
    expect(container.textContent).not.toContain("No Pinto Notes account uses this email.");

    type(container.querySelector<HTMLInputElement>("#connect-code")!, "123456");
    submit(container.querySelector("form")!);
    // The code's Sign in is the last thing pressed before the consent.
    await until(() => heading() === "Connect ChatGPT to your notes?" && !!button("Allow"));
    expect(server.calls.filter((c) => c.url === KEY && c.body.op === "create")).toHaveLength(1);
    expect(card()).toBeTruthy();
    for (const t of shown) expect(t).not.toMatch(KEY_WORDS);
    for (const t of shown) expect(t).not.toContain("No Pinto Notes account uses this email.");
  });

  it("a new account that switches to another account loses the card", async () => {
    const server = await fakeServer({ hasKey: false });
    vi.stubGlobal("fetch", server.fetch);
    backFromGoogle();
    render();
    await until(() => !!card());
    act(() => button("Use another account").click());
    await until(() => !!container.querySelector("#connect-email"));
    expect(card()).toBeNull();
    // The other account (it has its key) signs in with a code: the consent, without the card.
    type(container.querySelector<HTMLInputElement>("#connect-email")!, "me@example.com");
    submit(container.querySelector("form")!);
    await until(() => heading() === "Check your email");
    type(container.querySelector<HTMLInputElement>("#connect-code")!, "123456");
    submit(container.querySelector("form")!);
    await until(() => !!button("Allow"));
    expect(card()).toBeNull();
  });

  it("an existing account signing in never sees the card, and no key is made", async () => {
    const server = await fakeServer({ hasKey: true });
    vi.stubGlobal("fetch", server.fetch);
    backFromGoogle();
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?" && !!button("Allow"));
    expect(card()).toBeNull();
    expect(server.calls.some((c) => c.url === KEY)).toBe(false);
    act(() => button("Allow").click());
    await until(() => assigned.length === 1);
    expect(card()).toBeNull();
    for (const t of shown) expect(t).not.toContain("an app for iPhone and Mac");
  });

  it("an account another tab or the app gave a key a moment ago goes on to the consent, without the card", async () => {
    const server = await fakeServer({ hasKey: false });
    // The app makes the key between the page's first read and its create.
    const inner = server.fetch.getMockImplementation()!;
    let raced = false;
    server.fetch.mockImplementation(async (input, init) => {
      if (String(input) === KEY && !raced && init?.method === "POST") {
        raced = true;
        await inner(input, { ...init, body: JSON.stringify({ op: "create" }) });
        return new Response(JSON.stringify({ hint: "key_exists" }), { status: 409 });
      }
      return await inner(input, init);
    });
    vi.stubGlobal("fetch", server.fetch);
    backFromGoogle();
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?" && !!button("Allow"));
    expect(card()).toBeNull();
  });
});

describe("the card about the app", () => {
  it("names the app for iPhone and Mac, and links where the visitor can get it", () => {
    expect(newAccountWords("ios", "ChatGPT", true)).toEqual({
      line: "Pinto Notes is an app for iPhone and Mac. Your notes live there, with everything ChatGPT writes.",
      link: { text: "Get it on the App Store", href: APP_STORE_URL },
    });
    expect(newAccountWords("mac", "Claude").link).toEqual({ text: "Download for Mac", href: "/download" });
    expect(newAccountWords("other", null)).toEqual({
      line: "Pinto Notes is an app for iPhone and Mac. Your notes live there, with everything your AI writes.",
      link: { text: "Get Pinto Notes", href: "/download" },
    });
  });

  it("on Android, Windows or Linux it says plainly it's for iPhone and Mac, with no download that can't work there", () => {
    for (const p of ["android", "windows", "linux"] as const) {
      const w = newAccountWords(p, "ChatGPT");
      expect(w.line).toBe("Pinto Notes is an app for iPhone and Mac. Your notes live there, with everything ChatGPT writes, when you sign in on one.");
      expect(w.link).toBeNull();
      expect(w.line).not.toMatch(/Android|Windows|Linux|soon|coming/);
    }
    act(() => root.render(<NewAccountCard ai="ChatGPT" platform="android" />));
    expect(card()!.querySelector("a")).toBeNull();
    expect(card()!.textContent).toContain("an app for iPhone and Mac");
  });

  it("reads the platform the page marked before first paint", async () => {
    for (const [p, text, href] of [["ios", "Get it on the App Store", APP_STORE_URL], ["mac", "Download for Mac", "/download"]] as const) {
      document.documentElement.dataset.platform = p;
      act(() => root.render(<NewAccountCard key={p} ai={null} />));
      await until(() => card()?.getAttribute("data-platform") === p);
      const a = card()!.querySelector("a")!;
      expect([a.textContent, a.getAttribute("href"), a.getAttribute("rel")]).toEqual([text, href, "noopener noreferrer"]);
    }
    document.documentElement.dataset.platform = "android";
    act(() => root.render(<NewAccountCard key="android" ai={null} />));
    await until(() => card()?.getAttribute("data-platform") === "android");
    expect(card()!.querySelector("a")).toBeNull();
  });
});
