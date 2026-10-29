// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseLabel } from "@/lib/connect";
import { codeRequestError, consentWords, hereFrom, requestedLine, safeReturn, SESSION_KEY } from "@/lib/connect-browser";
import BrowserConnect from "./BrowserConnect";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ID = "5a0f6c1e-2b1d-4c36-9e0a-6b6f0c1a2b3c";
const SUPABASE = "https://ref.supabase.co";
const MCP = `${SUPABASE}/functions/v1/mcp`;
const CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";
const BACK = `${CHATGPT}?state=s1&iss=https%3A%2F%2Fmcp.pintonotes.com&code=amb_code_${"ab".repeat(32)}`;

describe("the consent's words", () => {
  it("names the company, word for word as the app's Allow sheet", () => {
    const gpt = consentWords({ verified_ai: "ChatGPT", redirect_host: "chatgpt.com", loopback: false, claimed_name: null, client_name: "ChatGPT" });
    expect(gpt.sharedLead).toBe("Shared with OpenAI.");
    expect(gpt.sent).toBe("The notes ChatGPT opens, with their text and files, are sent to OpenAI and handled under OpenAI’s privacy policy.");
    expect(gpt.lockedLead).toBe("Locked notes stay private.");
    expect(gpt.caution).toBeNull();
    const claude = consentWords({ verified_ai: "Claude", redirect_host: "claude.ai", loopback: false, claimed_name: null, client_name: "Claude" });
    expect(claude.sharedLead).toBe("Shared with Anthropic.");
    expect(claude.sent).toBe("The notes Claude opens, with their text and files, are sent to Anthropic and handled under Anthropic’s privacy policy.");
  });

  it("an app Pinto can't name gets the caution and its address, never a name as a title", () => {
    const w = consentWords({ verified_ai: null, redirect_host: "claude.example", loopback: false, claimed_name: "claude", client_name: "claude.example" });
    expect(w.title).toBe("Connect claude.example to your notes?");
    expect(w.caution?.lead).toBe("Pinto doesn’t recognize this app.");
    expect(w.caution?.detail).toContain("It calls itself Claude.");
    expect(w.sharedLead).toBe("Shared with claude.example.");
  });

  it("reads whether the page may answer; anything unknown goes to the app", () => {
    expect(hereFrom({ allow_here: true })).toBe("yes");
    expect(hereFrom({ allow_here: false, allow_here_why: "reauth" })).toBe("reauth");
    expect(hereFrom({ allow_here: false, allow_here_why: "paused" })).toBe("paused");
    for (const why of ["strict", "no_copy", "no_key", "off", undefined]) expect(hereFrom({ allow_here: false, allow_here_why: why })).toBe("app");
    // A server from before this says nothing at all.
    expect(hereFrom({})).toBe("app");
    expect(parseLabel({ redirect_host: "chatgpt.com", claimed_name: "ChatGPT", allow_here: true })?.allow_here).toBe(true);
    expect(parseLabel({ redirect_host: "chatgpt.com", claimed_name: "ChatGPT" })?.allow_here).toBeUndefined();
  });

  it("says when the request was made, from its expiry, and from which browser", () => {
    const now = Date.parse("2026-10-29T12:00:00Z");
    const at = (minutesAgo: number) => ({ expires_at: new Date(now + (10 - minutesAgo) * 60_000).toISOString() });
    expect(requestedLine(at(0), "Chrome on Windows", now)).toBe("Requested just now from Chrome on Windows");
    expect(requestedLine(at(1), "Safari on a Mac", now)).toBe("Requested 1 minute ago from Safari on a Mac");
    expect(requestedLine(at(4), "Safari on a Mac", now)).toBe("Requested 4 minutes ago from Safari on a Mac");
    expect(requestedLine({ expires_at: "" }, "a web browser", now)).toBe("Requested just now from a web browser");
  });

  it("follows only a web address back, and says when an email has no account", () => {
    expect(safeReturn(BACK)).toBe(BACK);
    expect(safeReturn("javascript:alert(1)")).toBeNull();
    expect(safeReturn("http://evil.example/cb")).toBeNull();
    expect(safeReturn("http://127.0.0.1:5000/cb")).toBe("http://127.0.0.1:5000/cb");
    expect(codeRequestError(422, { error_code: "otp_disabled", msg: "Signups not allowed for otp" }).noAccount).toBe(true);
    expect(codeRequestError(429, null).text).toContain("Wait a minute");
  });
});

type Call = { url: string; init: RequestInit; body: Record<string, unknown> };

/// A fake Supabase and MCP function. `here` is what /connect/request says about answering here;
/// `allow` what /connect/allow answers.
function fakeServer(o: { here?: Record<string, unknown>; allow?: { status: number; body: unknown } } = {}) {
  const calls: Call[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    calls.push({ url, init, body });
    const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
    const session = { access_token: "at-1", refresh_token: "rt-1", user: { id: "u1", email: "me@example.com" } };
    if (url === `${SUPABASE}/auth/v1/otp`) return json({});
    if (url === `${SUPABASE}/auth/v1/verify`) return body.token === "123456" ? json(session) : json({ error_code: "otp_expired", msg: "Token has expired or is invalid" }, 403);
    if (url === `${SUPABASE}/auth/v1/token?grant_type=refresh_token`) return body.refresh_token === "rt-old" ? json({ ...session, refresh_token: "rt-2" }) : json({ error_code: "refresh_token_not_found" }, 400);
    if (url.startsWith(`${SUPABASE}/auth/v1/logout`)) return new Response(null, { status: 204 });
    if (url === `${MCP}/connect/request?id=${ID}`) {
      return json({ id: ID, client_name: "ChatGPT", claimed_name: null, redirect_host: "chatgpt.com", redirect_uri: CHATGPT, verified_ai: "ChatGPT",
        loopback: false, wants_write: true, expires_at: new Date(Date.now() + 600_000).toISOString(), ...(o.here ?? { allow_here: true, allow_here_why: null }) });
    }
    if (url === `${MCP}/connect/allow`) return json(o.allow?.body ?? { redirect: BACK, client_name: "ChatGPT", can_write: body.write }, o.allow?.status ?? 200);
    if (url === `${MCP}/connect/decide`) return json({ redirect: `${CHATGPT}?state=s1&error=access_denied` });
    if (url === `${MCP}/connect/release`) return json({ released: true });
    return json({ error: "not_found" }, 404);
  });
  return { calls, fetch };
}

let root: Root;
let container: HTMLElement;
let assigned: string[];

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  assigned = [];
  localStorage.clear();
  vi.spyOn(window.location, "assign").mockImplementation((u: string | URL) => { assigned.push(String(u)); });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
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

const inApp = <p>the page as it was</p>;
function render() {
  act(() => root.render(<BrowserConnect requestId={ID} supabaseURL={SUPABASE} anonKey="anon" inApp={inApp} />));
}
const heading = () => container.querySelector("h1")?.textContent;
const button = (text: string) => [...container.querySelectorAll("button")].find((b) => b.textContent === text || b.querySelector("b")?.textContent === text)!;

function type(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => { set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
}
const submit = (form: HTMLFormElement) => act(() => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

describe("connecting on the page alone", () => {
  it("signs in with an emailed code, shows the consent, and Allow goes back to ChatGPT with the code", async () => {
    const server = fakeServer();
    vi.stubGlobal("fetch", server.fetch);
    render();
    await until(() => heading() === "Sign in to Pinto Notes");
    expect(container.textContent).toContain("Sign in with Google");

    type(container.querySelector<HTMLInputElement>("#connect-email")!, "me@example.com");
    submit(container.querySelector("form")!);
    await until(() => heading() === "Check your email");
    // Never makes an account: those start in the app.
    expect(server.calls.find((c) => c.url.endsWith("/auth/v1/otp"))!.body).toEqual({ email: "me@example.com", create_user: false });

    type(container.querySelector<HTMLInputElement>("#connect-code")!, "000000");
    submit(container.querySelector("form")!);
    await until(() => container.textContent!.includes("That code didn’t work"));
    type(container.querySelector<HTMLInputElement>("#connect-code")!, "123 456");
    submit(container.querySelector("form")!);
    await until(() => heading() === "Connect ChatGPT to your notes?");

    // What, who by company, and that it asks first: all on screen before Allow.
    const text = container.textContent!;
    expect(text).toContain("Shared with OpenAI. The notes ChatGPT opens, with their text and files, are sent to OpenAI and handled under OpenAI’s privacy policy.");
    expect(text).toContain("Locked notes stay private.");
    expect(text).toContain("Read and edit");
    expect(text).toContain("Read only");
    expect(container.querySelector("details")).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toContain("rt-1");
    // The wide sheet: when and from where under the title, no number to match, the access as a
    // radio group of its own, apart from the facts, and Don't Allow before Allow.
    expect(container.querySelector("[data-testid=connect-requested]")!.textContent).toMatch(/^Requested (just now|\d+ minutes? ago) from /);
    expect(text).not.toMatch(/Allow only if|shows \d+ too/);
    const group = container.querySelector("[role=radiogroup]")!;
    expect(group.getAttribute("aria-labelledby")).toBe("connect-access-label");
    expect(group.querySelectorAll("[role=radio]")).toHaveLength(2);
    expect(group.querySelector("[aria-checked=true]")!.textContent).toContain("Read and edit");
    expect(group.contains(container.querySelector("[data-testid=connect-shared]"))).toBe(false);
    const answers = [...container.querySelectorAll("button")].map((b) => b.textContent).filter((t) => t === "Allow" || t === "Don’t Allow");
    expect(answers).toEqual(["Don’t Allow", "Allow"]);
    expect(container.querySelector("img[src*='chatgpt'], img[alt*='ChatGPT']")).toBeNull();

    act(() => button("Read only").click());
    act(() => button("Allow").click());
    await until(() => assigned.length === 1);
    expect(assigned[0]).toBe(BACK);
    expect(heading()).toBe("Connected");
    const allow = server.calls.find((c) => c.url === `${MCP}/connect/allow`)!;
    expect(allow.body).toMatchObject({ id: ID, write: false, redirect_uri: CHATGPT });
    expect(new Headers(allow.init.headers).get("authorization")).toBe("Bearer at-1");
  });

  it("already signed in on this browser: just the consent", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    vi.stubGlobal("fetch", fakeServer().fetch);
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?");
    expect(container.textContent).toContain("Signed in as me@example.com.");
  });

  it("a sign-in too old to connect asks for a fresh one, with the email kept", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    vi.stubGlobal("fetch", fakeServer({ here: { allow_here: false, allow_here_why: "reauth" } }).fetch);
    render();
    await until(() => heading() === "Sign in again");
    expect(container.querySelector<HTMLInputElement>("#connect-email")!.value).toBe("me@example.com");
  });

  it("an account whose key is only on its devices continues to the page as it was", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    vi.stubGlobal("fetch", fakeServer({ here: { allow_here: false, allow_here_why: "strict" } }).fetch);
    render();
    await until(() => heading() === "Allow this in Pinto Notes");
    act(() => button("Continue").click());
    await until(() => container.textContent === "the page as it was");
  });

  it("a server that turns Allow down for the account sends it to the app, and an expired request says so", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    vi.stubGlobal("fetch", fakeServer({ allow: { status: 409, body: { error: "x", hint: "no_copy" } } }).fetch);
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?");
    act(() => button("Allow").click());
    await until(() => heading() === "Allow this in Pinto Notes");
    expect(assigned).toEqual([]);

    act(() => root.unmount());
    root = createRoot(container);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    vi.stubGlobal("fetch", fakeServer({ allow: { status: 404, body: { error: "gone", hint: "expired" } } }).fetch);
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?");
    act(() => button("Allow").click());
    await until(() => heading() === "This request has expired");
  });

  it("Don't allow sends ChatGPT access_denied; Use another account forgets the session and lets go of the request", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    const server = fakeServer();
    vi.stubGlobal("fetch", server.fetch);
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?");
    act(() => button("Use another account").click());
    await until(() => heading() === "Sign in to Pinto Notes");
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(server.calls.some((c) => c.url === `${MCP}/connect/release`)).toBe(true);

    act(() => root.unmount());
    root = createRoot(container);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "old", refresh_token: "rt-old", user_id: "u1", email: "me@example.com" }));
    render();
    await until(() => heading() === "Connect ChatGPT to your notes?");
    act(() => button("Don’t Allow").click());
    await until(() => assigned.length === 1);
    expect(assigned[0]).toContain("error=access_denied");
  });
});
