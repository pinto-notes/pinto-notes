// Signing in on a shared whiteboard's page (BoardPage.tsx): an email code, as on the connect page
// (connect-browser.ts), and an account made with the same code for an email that has none, as the
// connect page makes one (create_user: true; the notes' key is made by board-keys.ts). The session
// is the site's, kept where the connect page keeps it, so one sign-in serves both.
export { codeDigits, CODE_LENGTH, forgetSession, loadSession, saveSession, SESSION_KEY, sessionFrom, type StoredSession, verifyError, verifyRequest } from "./connect-browser";

/** Asks Supabase to email a sign-in code, making the account if there's none for this email. */
export function signUpCodeRequest(supabaseURL: string, anonKey: string, email: string): [string, RequestInit] {
  return [`${supabaseURL.replace(/\/+$/, "")}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email: email.trim(), create_user: true }),
  }];
}

type AuthError = { error_code?: string; code?: string | number; msg?: string; message?: string; error_description?: string } | null;

/** Why no code was sent, in plain words. */
export function codeError(status: number, body: AuthError): string {
  const said = `${body?.error_code ?? ""} ${body?.msg ?? body?.message ?? body?.error_description ?? ""}`.toLowerCase();
  if (status === 429 || said.includes("rate limit") || said.includes("over_email_send")) return "We just sent a code. Wait a minute, then try again.";
  if (said.includes("invalid") && said.includes("email")) return "That doesn’t look like an email address.";
  // New accounts closed for this address (the sign-up hook), or sign-ups off.
  if (status === 403 || status === 422 || said.includes("signups not allowed") || said.includes("hook")) return "Pinto Notes can’t make an account for this email yet. Sign up in the app first.";
  return "Couldn’t send a code. Check your connection and try again.";
}

/** A plausible email: something@something.something. */
export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
