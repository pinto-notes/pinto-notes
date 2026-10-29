"use client";

import { useEffect, useRef, useState } from "react";
import { didntFinish, functionURL, oauthSignInURL, pkcePair, returnURL, startsWithWrite, type ConnectRequest, type OAuthProvider } from "@/lib/connect";
import { browserFrom } from "@/lib/connect-flow";
import {
  allowRequest, backTo, codeDigits, codeRequest, codeRequestError, consentWords, denyRequest, forgetSession, hereFrom, loadSession,
  refreshRequest, requestedLine, safeReturn, saveSession, sessionFrom, verifyError, verifyRequest, type StoredSession,
} from "@/lib/connect-browser";
import { EndedScreen, LeavingScreen, WorkingScreen } from "./ConnectScreens";
import { BrowserSignInScreen, CodeScreen, ConnectedScreen, ConsentScreen, InAppScreen } from "./BrowserScreens";

// The connect page for a server that lets the page answer itself (/connect/label's allow_here):
// sign in, the consent, Allow. Accounts whose key is only on their devices go on to the app's way
// (`inApp`, the page as it was). See lib/connect-browser.ts for the whole flow.

type View =
  | { kind: "loading" }
  | { kind: "signIn"; again?: boolean }
  | { kind: "code" }
  | { kind: "consent"; request: ConnectRequest }
  | { kind: "inApp" }
  | { kind: "legacy" }
  | { kind: "connected"; to: string; href: string }
  | { kind: "leaving"; to: string }
  | { kind: "ended"; title: string; text: string; retry?: boolean };

/// The PKCE verifier for one Google or Apple round trip, and which one (sessionStorage, removed on return).
const OAUTH_PKCE = "pinto.connect.pkce";
const OFFLINE = "Couldn't reach Pinto Notes. Check your connection and try again.";
const EXPIRED: View = { kind: "ended", title: "This request has expired", text: "Start connecting again from ChatGPT, Claude or the other app you were using." };

const local = () => { try { return window.localStorage; } catch { return null; } };

export default function BrowserConnect({ requestId, supabaseURL, anonKey, authCode, authError, inApp }: {
  requestId: string;
  supabaseURL: string;
  anonKey: string;
  /// Back from Google or Apple: Supabase's one-time code, or why it failed.
  authCode?: string;
  authError?: string;
  /// The page as it was (a QR code, a notification, the recovery key), for accounts the server
  /// keeps no key copy for. An element, mounted only once the account turns out to need it.
  inApp: React.ReactNode;
}) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [write, setWrite] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [answering, setAnswering] = useState<"allow" | "deny" | null>(null);
  const [ready, setReady] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [resent, setResent] = useState(false);
  const session = useRef<StoredSession | null>(null);
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const mcp = functionURL(supabaseURL);
  const base = supabaseURL.replace(/\/+$/, "");

  useEffect(() => {
    setReady(true);
    void (async () => {
      if (authCode) return await finishOAuth(authCode);
      if (authError) {
        window.history.replaceState(null, "", returnURL(window.location.origin, requestId));
        setFailure(didntFinish(takeSaved().provider));
        return setView({ kind: "signIn" });
      }
      const stored = loadSession(local());
      if (!stored) return setView({ kind: "signIn" });
      setEmail(stored.email);
      // Kept from an earlier visit: made fresh, then straight to the consent.
      const fresh = await refresh(stored);
      if (!fresh) {
        forgetSession(local());
        return setView({ kind: "signIn" });
      }
      await signedInAs(fresh);
    })();
    // Runs once, for the address the page was opened with.
  }, []);

  // MARK: The session

  async function refresh(s: StoredSession): Promise<StoredSession | null> {
    try {
      const res = await fetch(...refreshRequest(base, anonKey, s.refresh_token));
      return res.ok ? sessionFrom(await res.json().catch(() => null), s.email) : null;
    } catch {
      return null;
    }
  }

  async function signedInAs(s: StoredSession) {
    session.current = s;
    saveSession(local(), s);
    setSignedIn(s.email);
    setEmail(s.email);
    await loadRequest(s);
  }

  async function signOut() {
    const s = session.current;
    session.current = null;
    setSignedIn(null);
    forgetSession(local());
    if (!s) return;
    // Lets go of the request too, so another account can answer it.
    await Promise.allSettled([
      fetch(`${mcp}/connect/release`, { method: "POST", headers: { authorization: `Bearer ${s.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ id: requestId }) }),
      fetch(`${base}/auth/v1/logout?scope=local`, { method: "POST", headers: { apikey: anonKey, authorization: `Bearer ${s.access_token}` } }),
    ]);
  }

  async function switchAccount() {
    setFailure(null);
    setCode("");
    setEmail("");
    setView({ kind: "loading" });
    await signOut();
    setView({ kind: "signIn" });
  }

  // MARK: Who is asking, and whether this page may answer

  async function loadRequest(s: StoredSession) {
    setView({ kind: "loading" });
    try {
      const res = await fetch(`${mcp}/connect/request?id=${requestId}`, { headers: { authorization: `Bearer ${s.access_token}` }, cache: "no-store" });
      const body = await res.json().catch(() => null) as (ConnectRequest & { error?: string; allow_here?: unknown; allow_here_why?: unknown }) | null;
      if (res.status === 401) {
        forgetSession(local());
        session.current = null;
        setSignedIn(null);
        return setView({ kind: "signIn" });
      }
      if (res.status === 404) return setView(EXPIRED);
      if (!res.ok || !body || typeof body.redirect_uri !== "string") {
        return setView({ kind: "ended", title: "Couldn't connect", text: body?.error ?? OFFLINE, retry: res.status !== 403 });
      }
      switch (hereFrom(body)) {
        case "yes":
          setWrite(startsWithWrite(body));
          return setView({ kind: "consent", request: body });
        case "reauth":
          return setView({ kind: "signIn", again: true });
        case "paused":
          return setView({ kind: "ended", title: "Allow this in Pinto Notes", text: "Your password was reset a short while ago, so connecting on the web waits for now. Allow it in Pinto Notes on your iPhone or Mac." });
        case "app":
          return setView({ kind: "inApp" });
      }
    } catch {
      setView({ kind: "ended", title: "Couldn't connect", text: OFFLINE, retry: true });
    }
  }

  // MARK: Signing in

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    setNoAccount(false);
    try {
      const res = await fetch(...codeRequest(base, anonKey, email));
      if (res.ok) {
        setCode("");
        setView({ kind: "code" });
        return true;
      }
      const why = codeRequestError(res.status, await res.json().catch(() => null));
      if (why.noAccount) setNoAccount(true);
      else setFailure(why.text);
      return false;
    } catch {
      setFailure(OFFLINE);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setFailure(null);
    if (await sendCode()) {
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const res = await fetch(...verifyRequest(base, anonKey, email, code));
      const body = await res.json().catch(() => null);
      const s = res.ok ? sessionFrom(body, email.trim()) : null;
      if (!s) {
        setFailure(verifyError(res.status, body));
        return;
      }
      setCode("");
      await signedInAs(s);
    } catch {
      setFailure(OFFLINE);
    } finally {
      setBusy(false);
    }
  }

  async function signInWith(provider: OAuthProvider) {
    setBusy(true);
    const { verifier, challenge } = await pkcePair();
    try { sessionStorage.setItem(OAUTH_PKCE, JSON.stringify({ verifier, request: requestId, provider })); } catch {}
    window.location.assign(oauthSignInURL(provider, supabaseURL, returnURL(window.location.origin, requestId), challenge));
  }

  async function finishOAuth(authCode: string) {
    // The code leaves the address bar (and the history) before anything else happens.
    window.history.replaceState(null, "", returnURL(window.location.origin, requestId));
    const saved = takeSaved();
    if (!saved.verifier || saved.request !== requestId) {
      setFailure(didntFinish(saved.provider));
      return setView({ kind: "signIn" });
    }
    try {
      const res = await fetch(`${base}/auth/v1/token?grant_type=pkce`, {
        method: "POST",
        headers: { apikey: anonKey, "content-type": "application/json" },
        body: JSON.stringify({ auth_code: authCode, code_verifier: saved.verifier }),
      });
      const s = res.ok ? sessionFrom(await res.json().catch(() => null)) : null;
      if (!s) {
        setFailure(didntFinish(saved.provider));
        return setView({ kind: "signIn" });
      }
      await signedInAs(s);
    } catch {
      setFailure(OFFLINE);
      setView({ kind: "signIn" });
    }
  }

  function differentEmail() {
    setNoAccount(false);
    setFailure(null);
    setCode("");
    setEmail("");
    setView({ kind: "signIn" });
    setTimeout(() => document.getElementById("connect-email")?.focus(), 0);
  }

  // MARK: The answer

  async function answer(r: ConnectRequest, allow: boolean) {
    const s = session.current;
    if (!s || answering) return;
    setAnswering(allow ? "allow" : "deny");
    setFailure(null);
    try {
      const res = await fetch(...(allow
        ? allowRequest(mcp, s.access_token, { id: requestId, write: write && r.wants_write, redirect_uri: r.redirect_uri, from: browserFrom(navigator.userAgent) })
        : denyRequest(mcp, s.access_token, { id: requestId, redirect_uri: r.redirect_uri })));
      const body = await res.json().catch(() => null) as { redirect?: unknown; error?: string; hint?: string } | null;
      const to = safeReturn(body?.redirect);
      if (res.ok && to) {
        if (allow) setView({ kind: "connected", to: backTo(r), href: to });
        else setView({ kind: "leaving", to: backTo(r) });
        window.location.assign(to);
        return;
      }
      if (res.status === 404) return setView(EXPIRED);
      if (body?.hint === "reauth") return setView({ kind: "signIn", again: true });
      if (["strict", "no_copy", "no_key", "off", "unreadable", "rate"].includes(body?.hint ?? "")) {
        if (body?.hint === "rate") return setView({ kind: "ended", title: "Allow this in Pinto Notes", text: body?.error ?? OFFLINE });
        return setView({ kind: "inApp" });
      }
      setFailure(body?.error ?? OFFLINE);
    } catch {
      setFailure(OFFLINE);
    } finally {
      setAnswering(null);
    }
  }

  // MARK: The page

  switch (view.kind) {
    case "loading":
      return <WorkingScreen text="Loading…" />;
    case "signIn":
      return (
        <BrowserSignInScreen
          email={email} onEmail={(v) => { setEmail(v); setNoAccount(false); }} onSubmit={(e) => void sendCode(e)}
          onGoogle={() => void signInWith("google")} onApple={() => void signInWith("apple")}
          busy={busy} ready={ready} failure={failure} again={view.again} noAccount={noAccount} onDifferent={differentEmail}
        />
      );
    case "code":
      return (
        <CodeScreen
          email={email.trim()} code={code} onCode={(v) => setCode(codeDigits(v))} onSubmit={(e) => void submitCode(e)}
          onResend={() => void resend()} onDifferent={differentEmail} busy={busy} ready={ready} failure={failure} resent={resent}
        />
      );
    case "consent": {
      const r = view.request;
      return (
        <ConsentScreen
          words={consentWords(r)} mark={r.verified_ai ?? null} requested={requestedLine(r, browserFrom(navigator.userAgent))} canWrite={r.wants_write} write={write && r.wants_write} onWrite={setWrite}
          onAllow={() => void answer(r, true)} onDeny={() => void answer(r, false)} busy={answering} failure={failure}
          email={signedIn ?? email} onSwitch={() => void switchAccount()}
        />
      );
    }
    case "inApp":
      return <InAppScreen email={signedIn} onSwitch={() => void switchAccount()} onContinue={() => setView({ kind: "legacy" })} />;
    case "legacy":
      return <>{inApp}</>;
    case "connected":
      return <ConnectedScreen to={view.to} href={view.href} />;
    case "leaving":
      return <LeavingScreen allowed={false} host={view.to} />;
    case "ended":
      return <EndedScreen title={view.title} text={view.text} onRetry={view.retry ? () => { const s = session.current; if (s) void loadRequest(s); else setView({ kind: "signIn" }); } : undefined} />;
  }
}

/// The round trip's PKCE verifier, request and provider, read once and removed.
function takeSaved(): { verifier?: string; request?: string; provider?: OAuthProvider } {
  let saved: { verifier?: string; request?: string; provider?: OAuthProvider } = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(OAUTH_PKCE) ?? "{}") ?? {};
  } catch {}
  try { sessionStorage.removeItem(OAUTH_PKCE); } catch {}
  return saved;
}
