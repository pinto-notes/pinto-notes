// Connecting an AI on the web page alone (BrowserConnect.tsx), for accounts whose key the server
// keeps a copy of: sign in, see who is asking and what is shared, Allow. No app and no number.
//
// 1. Sign in: an email code (Supabase's /auth/v1/otp, then /auth/v1/verify), Google or Apple
//    (the same round trip as before, lib/connect.ts). No password and no new accounts here: an
//    account starts in the app, which makes its notes' key.
// 2. /connect/request with the session: who is asking, the exact return address, and whether this
//    page may answer (allow_here). "reauth": the sign-in is too old for the server to open the key
//    copy (an hour, as for a new device), so the page asks for a fresh one. Anything else that
//    isn't yes ("strict", "no_copy", "no_key", "off") goes to the app, the way it worked before.
// 3. The consent: who, what is shared and with which company (the words the app's Allow sheet
//    uses, as App Review asked), locked notes stay private. Connecting is read and edit. Allow posts
//    /connect/allow; the server makes the code and answers with the AI's return address, code
//    included. Don't allow is /connect/decide with allow: false, as before.
//
// The session is kept in this browser (localStorage, SESSION_KEY) so a second AI connected soon
// after is just the consent and Allow. "Use another account" and a refused session remove it.

import type { ConnectRequest } from "./connect";

/// Who receives what a known AI opens: the company that makes it (ConnectTrust.makers in the app).
export const MAKERS: Record<"ChatGPT" | "Claude", string> = { ChatGPT: "OpenAI", Claude: "Anthropic" };

/// What the consent says, line by line, in reading order. The same words as the app's Allow sheet
/// (ConsentSheet in Pane/Views/ConnectAI.swift): App Review and the ChatGPT plugin's reviewers read
/// this page, and each line stays on screen, never behind a disclosure.
export type ConsentWords = {
  title: string;
  /// An app Pinto can't name: the caution, above everything else.
  caution: { lead: string; detail: string } | null;
  /// "Shared with OpenAI." and what that means.
  sharedLead: string;
  sent: string;
  lockedLead: string;
  lockedDetail: string;
  /// Under the buttons: a request from ChatGPT's or Claude's own address proves where the code
  /// goes, not whose account asked (the 2 October rule in the MCP function), so it is still said.
  started: string;
};

export function consentWords(r: Pick<ConnectRequest, "verified_ai" | "redirect_host" | "loopback" | "claimed_name" | "client_name">): ConsentWords {
  const ai = r.verified_ai ?? null;
  const maker = ai ? MAKERS[ai] : null;
  const where = r.loopback ? "this app" : r.redirect_host;
  const who = ai ?? (r.loopback ? "an app on this computer" : r.redirect_host);
  if (ai && maker) {
    return {
      title: `Connect ${ai} to your notes?`,
      caution: null,
      sharedLead: `Shared with ${maker}.`,
      sent: `The notes ${ai} opens, with their text and files, are sent to ${maker} and handled under ${maker}’s privacy policy.`,
      lockedLead: "Locked notes stay private.",
      lockedDetail: `${ai} can’t open them.`,
      started: `Allow it only if you just started connecting ${ai} yourself.`,
    };
  }
  const claim = r.claimed_name ? `It calls itself ${displayClaim(r.claimed_name)}. ` : "";
  return {
    title: `Connect ${who} to your notes?`,
    caution: { lead: "Pinto doesn’t recognize this app.", detail: `${claim}Only allow it if you just started connecting it yourself.` },
    sharedLead: `Shared with ${where}.`,
    sent: `The notes it opens, with their text and files, are sent to ${where}.`,
    lockedLead: "Locked notes stay private.",
    lockedDetail: "It can’t open them.",
    started: "Allow it only if you just started connecting it yourself.",
  };
}

/// What an app calls itself, as a name reads ("glama" is Glama); its own capitals stay.
const displayClaim = (name: string) => (name === name.toLowerCase() ? name.charAt(0).toUpperCase() + name.slice(1) : name);

/// How long a request lives on the server (oauth_requests.expires_at defaults to 10 minutes on),
/// so when it was made is its expiry less this.
const REQUEST_MINUTES = 10;

/// Under the consent's title, when and from where it was asked, as the app's Allow sheet says it
/// ("Requested just now from Chrome on Windows"). The browser is this one: the AI sent it here.
export function requestedLine(r: Pick<ConnectRequest, "expires_at">, browser: string, now = Date.now()): string {
  const made = Date.parse(r.expires_at) - REQUEST_MINUTES * 60_000;
  const minutes = Number.isFinite(made) ? Math.floor((now - made) / 60_000) : 0;
  const when = minutes < 1 ? "just now" : minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  return `Requested ${when} from ${browser}`;
}

/// The AI's name for the way back: "ChatGPT" for its own address, else the address.
export function backTo(r: Pick<ConnectRequest, "verified_ai" | "redirect_host" | "loopback">): string {
  return r.verified_ai ?? (r.loopback ? "the app" : r.redirect_host);
}

// MARK: Whether this page may answer

/// What /connect/request said about answering here: Allow on this page, a fresh sign-in first,
/// the app, or wait (a password reset was too recent).
export type Here = "yes" | "reauth" | "app" | "paused";

export function hereFrom(body: { allow_here?: unknown; allow_here_why?: unknown } | null | undefined): Here {
  if (body?.allow_here === true) return "yes";
  switch (body?.allow_here_why) {
    case "reauth": return "reauth";
    case "paused": return "paused";
    // strict, no_copy, no_key, off, or a server from before this that doesn't say.
    default: return "app";
  }
}

/// Why the account goes to the app, in one plain line.
export const IN_APP = {
  title: "Allow this in Pinto Notes",
  text: "Your account keeps its notes’ key on your iPhone and Mac only, so the app has to allow this.",
  button: "Continue",
} as const;

/// Why a fresh sign-in is asked for. The server opens the key copy only for a sign-in from the
/// last hour (KEY_COPY_SIGNIN_HOURS), as for a new device.
export const SIGN_IN_AGAIN = "To keep your notes safe, connecting needs a sign-in from the last hour.";

// MARK: Email codes (Supabase Auth)

export const CODE_LENGTH = 6;

/// Asks Supabase to email a sign-in code. Never makes an account: accounts start in the app.
export function codeRequest(supabaseURL: string, anonKey: string, email: string): [string, RequestInit] {
  return [`${supabaseURL.replace(/\/+$/, "")}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email: email.trim(), create_user: false }),
  }];
}

/// Trades the emailed code for a session.
export function verifyRequest(supabaseURL: string, anonKey: string, email: string, code: string): [string, RequestInit] {
  return [`${supabaseURL.replace(/\/+$/, "")}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ type: "email", email: email.trim(), token: code.replace(/\s+/g, "") }),
  }];
}

/// The digits of a typed or pasted code, at most CODE_LENGTH.
export const codeDigits = (typed: string) => typed.replace(/\D/g, "").slice(0, CODE_LENGTH);

type AuthError = { error_code?: string; code?: string | number; msg?: string; message?: string; error_description?: string } | null;

const said = (body: AuthError) => `${body?.error_code ?? ""} ${body?.msg ?? body?.message ?? body?.error_description ?? ""}`.toLowerCase();

/// Why no code was sent, in plain words. No account: the page says where accounts start.
export function codeRequestError(status: number, body: AuthError): { text: string; noAccount?: boolean } {
  const s = said(body);
  if (status === 429 || s.includes("rate limit") || s.includes("over_email_send")) return { text: "We just sent a code. Wait a minute, then try again." };
  if (s.includes("signups not allowed") || s.includes("otp_disabled") || s.includes("user not found")) {
    return { text: "No Pinto Notes account uses this email.", noAccount: true };
  }
  return { text: "Couldn’t send a code. Check your connection and try again." };
}

/// Why the code didn't sign in.
export function verifyError(status: number, body: AuthError): string {
  const s = said(body);
  if (status === 429 || s.includes("rate limit")) return "Too many tries. Wait a few minutes and try again.";
  if (s.includes("expired") || s.includes("invalid") || status === 403 || status === 400) return "That code didn’t work. Check the newest email from Pinto Notes, or send a new code.";
  return "Couldn’t sign in. Check your connection and try again.";
}

// MARK: The session kept in this browser

export const SESSION_KEY = "pinto.connect.session";

export type StoredSession = { access_token: string; refresh_token: string; user_id: string; email: string };

/// A session from a Supabase Auth token response, or null.
export function sessionFrom(body: { access_token?: unknown; refresh_token?: unknown; user?: { id?: unknown; email?: unknown } } | null, fallbackEmail = ""): StoredSession | null {
  if (typeof body?.access_token !== "string" || typeof body.refresh_token !== "string" || typeof body.user?.id !== "string") return null;
  return { access_token: body.access_token, refresh_token: body.refresh_token, user_id: body.user.id, email: typeof body.user.email === "string" ? body.user.email : fallbackEmail };
}

export function loadSession(store: Pick<Storage, "getItem"> | null): StoredSession | null {
  try {
    const raw = store?.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return typeof s?.refresh_token === "string" && typeof s?.user_id === "string"
      ? { access_token: String(s.access_token ?? ""), refresh_token: s.refresh_token, user_id: s.user_id, email: String(s.email ?? "") }
      : null;
  } catch {
    return null;
  }
}

export function saveSession(store: Pick<Storage, "setItem"> | null, s: StoredSession) {
  try { store?.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}

export function forgetSession(store: Pick<Storage, "removeItem"> | null) {
  try { store?.removeItem(SESSION_KEY); } catch {}
}

/// A stored session made fresh: its refresh token for a new access token (which keeps the time of
/// the sign-in it came from, so the server still knows how recent that was).
export function refreshRequest(supabaseURL: string, anonKey: string, refreshToken: string): [string, RequestInit] {
  return [`${supabaseURL.replace(/\/+$/, "")}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }];
}

/// Allow, on this page: the exact return address it showed.
export function allowRequest(mcp: string, token: string, b: { id: string; redirect_uri: string; from: string }): [string, RequestInit] {
  return [`${mcp}/connect/allow`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(b),
  }];
}

/// Don't allow: the AI hears access_denied (/connect/decide, as from the app).
export function denyRequest(mcp: string, token: string, b: { id: string; redirect_uri: string }): [string, RequestInit] {
  return [`${mcp}/connect/decide`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ ...b, allow: false }),
  }];
}

/// The page follows only a web address (or an app on this computer) back, never another scheme.
export function safeReturn(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return u.toString();
    if (u.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)) return u.toString();
    return null;
  } catch {
    return null;
  }
}

// MARK: Connect in the app counts as the Allow

// Connect in Pinto opens pintonotes.com/connect/start#t=<ticket>&to=<the AI's page>. The start page
// swaps the one-time ticket for a key kept in this browser (PRE_KEY) and goes on to ChatGPT or
// Claude. When their sign-in lands on /connect a few seconds later, the page sends that key with
// no sign-in or consent: the server answers once, for that AI's own callback, for the account that
// pressed Connect, within 10 minutes (supabase/functions/mcp/oauth.ts, preapprove). If it says no,
// the key goes and the page signs in and asks as before.

export const PRE_KEY = "pinto.connect.preapproval";

export type StoredPre = { key: string; ai: "ChatGPT" | "Claude"; expires_at: string };

/// The key this browser keeps for the AI asking now, if it's still in time.
export function loadPre(store: Pick<Storage, "getItem"> | null, ai: string | null | undefined, now = Date.now()): string | null {
  if (!ai) return null;
  try {
    const p = JSON.parse(store?.getItem(PRE_KEY) ?? "null");
    if (typeof p?.key !== "string" || p.ai !== ai) return null;
    return Date.parse(p.expires_at) > now ? p.key : null;
  } catch {
    return null;
  }
}

export function savePre(store: Pick<Storage, "setItem"> | null, p: StoredPre) {
  try { store?.setItem(PRE_KEY, JSON.stringify(p)); } catch {}
}

export function forgetPre(store: Pick<Storage, "removeItem"> | null) {
  try { store?.removeItem(PRE_KEY); } catch {}
}

/// The start page's ticket, for this browser's key.
export function redeemRequest(mcp: string, ticket: string): [string, RequestInit] {
  return [`${mcp}/connect/redeem`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticket }) }];
}

/// /connect/redeem's answer, or null.
export function preFrom(body: { key?: unknown; ai?: unknown; expires_at?: unknown } | null): StoredPre | null {
  if (typeof body?.key !== "string" || (body.ai !== "ChatGPT" && body.ai !== "Claude") || typeof body.expires_at !== "string") return null;
  return { key: body.key, ai: body.ai, expires_at: body.expires_at };
}

/// Allow by Connect in the app: the browser's key, and the session kept here, if any, so the server
/// can refuse a browser signed in to another account.
export function preAllowRequest(mcp: string, token: string | null, b: { id: string; from: string; preapproval: string }): [string, RequestInit] {
  return [`${mcp}/connect/allow`, {
    method: "POST",
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
    body: JSON.stringify(b),
  }];
}

/// Where the start page goes on to: the page the app named, on ChatGPT's or Claude's own site
/// only, else that AI's home.
const AI_SITES: Record<StoredPre["ai"], string[]> = { ChatGPT: ["chatgpt.com"], Claude: ["claude.ai", "claude.com"] };
export function startTarget(to: string | null, ai: StoredPre["ai"]): string {
  try {
    const u = new URL(to ?? "");
    if (u.protocol === "https:" && AI_SITES[ai].includes(u.hostname)) return u.toString();
  } catch {}
  return `https://${AI_SITES[ai][0]}/`;
}

/// The start page's fragment: the ticket and the AI's page.
export function startParams(hash: string): { ticket: string | null; to: string | null } {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const t = q.get("t");
  return { ticket: t && /^amb_pre_[0-9a-f]{64}$/.test(t) ? t : null, to: q.get("to") };
}
