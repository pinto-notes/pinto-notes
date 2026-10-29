import { useEffect, useRef } from "react";
import { GOOGLE_ON_WEB, APPLE_ON_WEB } from "@/lib/connect";
import { ACCESS, CODE_LENGTH, IN_APP, SIGN_IN_AGAIN, type ConsentWords } from "@/lib/connect-browser";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { ErrorLine, SignInButtons, Spinner } from "./ConnectScreens";
import styles from "./connect.module.css";

// The screens of connecting on the web page alone (BrowserConnect.tsx), from props only. Who is
// asking is the frame's to say (ConnectCard), so these name the step. See lib/connect-browser.ts.

/// Sign in: Google and Apple, or an email code. `again`: signed in, but too long ago to connect.
export function BrowserSignInScreen({ email, onEmail, onSubmit, onGoogle, onApple, busy, ready, failure, again = false, noAccount = false, onDifferent }: {
  email: string; onEmail: (v: string) => void; onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void; onApple: () => void; busy: boolean; ready: boolean; failure: string | null;
  again?: boolean; noAccount?: boolean; onDifferent: () => void;
}) {
  return (
    <>
      <h1 className={styles.title}>{again ? "Sign in again" : "Sign in to Pinto Notes"}</h1>
      <p className={styles.lede}>{again ? SIGN_IN_AGAIN : "Then you choose what it can do with your notes."}</p>
      {APPLE_ON_WEB && <SignInButtons onApple={onApple} onGoogle={GOOGLE_ON_WEB ? onGoogle : undefined} busy={busy} />}
      <form className={styles.form} method="post" onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email" id="connect-email" autoComplete="username" inputMode="email" required
            value={email} onChange={(e) => onEmail(e.target.value)} readOnly={busy}
          />
        </label>
        {noAccount ? (
          <div className={styles.said} role="status">
            <p><b>No Pinto Notes account uses this email.</b></p>
            <p>Accounts start in the app on your iPhone or Mac, which makes your notes&apos; key. Get Pinto Notes, sign up there, then connect again.</p>
            <a className={styles.primary} href={APP_STORE_LIVE ? APP_STORE_URL : "/download"}>Get Pinto Notes</a>
            <div className={styles.formLinks}>
              <button type="button" className={styles.link} onClick={onDifferent}>Use a different email</button>
            </div>
          </div>
        ) : (
          <>
            <ErrorLine text={failure} />
            <button type="submit" className={styles.secondary} disabled={!ready || busy || !email.includes("@")} aria-busy={busy}>
              {busy ? <><Spinner /> Sending…</> : "Email me a code"}
            </button>
          </>
        )}
      </form>
    </>
  );
}

/// The code from the email: six digits, filled by the keyboard's suggestion where it offers one.
export function CodeScreen({ email, code, onCode, onSubmit, onResend, onDifferent, busy, ready, failure, resent }: {
  email: string; code: string; onCode: (v: string) => void; onSubmit: (e: React.FormEvent) => void;
  onResend: () => void; onDifferent: () => void; busy: boolean; ready: boolean; failure: string | null;
  /// "Sent a new code", for a moment after Send a new code.
  resent: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  return (
    <>
      <h1 className={styles.title}>Check your email</h1>
      <p className={styles.lede}>Enter the {CODE_LENGTH}-digit code we sent to <b>{email}</b>.</p>
      <form className={styles.form} method="post" onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>Code</span>
          <input
            ref={input} type="text" id="connect-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
            maxLength={CODE_LENGTH + 2} required className={styles.otp} value={code} onChange={(e) => onCode(e.target.value)}
          />
        </label>
        <ErrorLine text={failure} />
        <button type="submit" className={styles.primary} disabled={!ready || busy || code.length !== CODE_LENGTH} aria-busy={busy}>
          {busy ? <><Spinner /> Signing in…</> : "Sign in"}
        </button>
        <div className={styles.formLinks}>
          {resent ? <p className={styles.linkSaid} role="status">Sent a new code</p>
            : <button type="button" className={styles.link} onClick={onResend} disabled={busy}>Send a new code</button>}
          <button type="button" className={styles.link} onClick={onDifferent} disabled={busy}>Use a different email</button>
        </div>
      </form>
    </>
  );
}

/// The consent, in the Mac's wide Allow sheet (ConsentSheet in Pane/Views/ConnectAI.swift): who asks
/// on the left, what it gets and the answer on the right; one column on a phone. The access choice
/// is a pair of bordered rows with a selected state, so it reads as a control; the facts under it
/// stay plain text with a glyph. No number: Allow here is the answer, and nothing else must match.
/// The pair at the top is a plain chat glyph, never the AI's mark (the 2 October rule).
export function ConsentScreen({ words, canWrite, write, onWrite, onAllow, onDeny, busy, failure, email, onSwitch, requested }: {
  words: ConsentWords; canWrite: boolean; write: boolean; onWrite: (write: boolean) => void;
  onAllow: () => void; onDeny: () => void;
  /// Which answer is on its way.
  busy: "allow" | "deny" | null; failure: string | null; email: string; onSwitch: () => void;
  /// "Requested just now from Chrome on Windows" (requestedLine).
  requested: string;
}) {
  const options = canWrite ? [true, false] : [false];
  return (
    <div className={styles.wide} data-testid="connect-consent">
      <section className={styles.wideWho}>
        <PairMark />
        <h1 className={styles.wideTitle}>{words.title}</h1>
        <p className={styles.requested} data-testid="connect-requested">{requested}</p>
        {words.caution && (
          <p className={styles.warn} data-testid="connect-unknown"><b>{words.caution.lead}</b> {words.caution.detail}</p>
        )}
      </section>
      <section className={styles.wideWhat}>
        <p className={styles.accessLabel} id="connect-access-label">Access</p>
        <div className={styles.access} role="radiogroup" aria-labelledby="connect-access-label">
          {options.map((edit) => {
            const a = edit ? ACCESS.edit : ACCESS.read;
            const on = write === edit || options.length === 1;
            return (
              <button
                key={a.title} type="button" role="radio" aria-checked={on} className={styles.accessRow}
                onClick={() => onWrite(edit)} disabled={busy !== null}
              >
                <span className={styles.accessDot} aria-hidden="true" />
                <span className={styles.accessWords}>
                  <b>{a.title}</b>
                  <span>{a.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
        <ul className={styles.facts}>
          <li data-testid="connect-shared">
            <ShareGlyph />
            <p><b>{words.sharedLead}</b> {words.sent}</p>
          </li>
          <li data-testid="connect-locked">
            <LockGlyph />
            <p><b>{words.lockedLead}</b> {words.lockedDetail}</p>
          </li>
        </ul>
        <ErrorLine text={failure} />
        <div className={styles.answers}>
          <button type="button" className={styles.secondary} onClick={onDeny} disabled={busy !== null} aria-busy={busy === "deny"}>
            {busy === "deny" ? <><Spinner /> Declining…</> : "Don’t Allow"}
          </button>
          <button type="button" className={styles.primary} onClick={onAllow} disabled={busy !== null} aria-busy={busy === "allow"}>
            {busy === "allow" ? <><Spinner /> Allowing…</> : "Allow"}
          </button>
        </div>
        <p className={styles.signedAs}>
          Signed in as <b>{email}</b>.{" "}
          <button type="button" className={styles.inlineLink} onClick={onSwitch} disabled={busy !== null}>Use another account</button>
        </p>
      </section>
    </div>
  );
}

/// A plain chat glyph, three dots, and Pinto's icon: the app's pair, without the AI's mark.
function PairMark() {
  return (
    <div className={styles.pair} aria-hidden="true">
      <span className={styles.pairTile}>
        <svg viewBox="0 0 20 20" width={20} height={20} focusable="false">
          <path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={styles.pairDots}>···</span>
      <img className={styles.pairIcon} src="/icon-96.png" alt="" width={40} height={40} decoding="async" />
    </div>
  );
}

/// Allowed: on the way back to the AI, with a link in case the browser doesn't go by itself.
export function ConnectedScreen({ to, href }: { to: string; href: string }) {
  return (
    <>
      <DoneMark />
      <h1 className={styles.title}>Connected</h1>
      <p className={styles.status} role="status"><Spinner /> Taking you back to {to}…</p>
      <a className={styles.secondary} href={href}>Back to {to}</a>
    </>
  );
}

/// An account whose key is only on its devices: the app answers, as before.
export function InAppScreen({ onContinue, email, onSwitch }: { onContinue: () => void; email: string | null; onSwitch: () => void }) {
  return (
    <>
      <h1 className={styles.title}>{IN_APP.title}</h1>
      <p className={styles.lede}>{IN_APP.text}</p>
      <button type="button" className={styles.primary} onClick={onContinue}>{IN_APP.button}</button>
      {email && (
        <p className={styles.signedAs}>
          Signed in as <b>{email}</b>.{" "}
          <button type="button" className={styles.inlineLink} onClick={onSwitch}>Use another account</button>
        </p>
      )}
    </>
  );
}

/// A tick on an amber disc of cut paper, as the other connect screens show it.
function DoneMark() {
  return (
    <svg className={styles.done} viewBox="0 0 64 64" width={64} height={64} aria-hidden="true" focusable="false">
      <circle className={styles.pShadow} cx="34" cy="35" r="26" />
      <circle className={styles.pDisc} cx="32" cy="32" r="26" />
      <path className={styles.doneTick} d="M21 33.5l7.5 7.5L43.5 25" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg className={styles.factGlyph} viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" focusable="false">
      <path d="M17.5 2.5 9 11M17.5 2.5l-5 15-3.5-6.5-6.5-3.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg className={styles.factGlyph} viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" focusable="false">
      <rect x="4" y="9" width="12" height="8.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
