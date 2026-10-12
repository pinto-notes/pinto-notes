// The email that says a new device got the account's key. A person with one device has no other
// screen to see the in-app notice on, so this is how they hear of a sign-in that wasn't theirs.
import { log } from "../_shared/log.ts";
import { HELLO, SENDER_NAME } from "../_shared/sender.ts";

export type Mail = { from: string; to: string; reply_to: string; subject: string; text: string; html: string };

const KINDS: Record<string, string> = { ios: "an iPhone or iPad", macos: "a Mac", android: "an Android device", windows: "a Windows PC", web: "a web browser" };

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function fetchedMail(to: string, platform: string, at: Date): Mail {
  const when = at.toISOString().slice(0, 16).replace("T", " at ") + " UTC";
  const lines = [
    `Someone signed in to Pinto Notes with your account on ${KINDS[platform] ?? "a new device"} and opened your notes there (${when}).`,
    "If that was you, there's nothing to do.",
    "If it wasn't, reset your password from the sign-in screen now, then reply to this email and we'll help you check your account. A new password keeps the next device out. A device that already opened your notes keeps what it has: the key can't be changed yet.",
    "To have a new device ask one of your own devices first, turn on Advanced protection in Settings › Security.",
  ];
  return {
    from: `${SENDER_NAME} <${HELLO}>`,
    to,
    reply_to: HELLO,
    subject: "A new device opened your notes",
    text: lines.join("\n\n") + "\n\nPinto Notes\n",
    html: lines.map((l) => `<p>${escape(l)}</p>`).join("") + "<p>Pinto Notes</p>",
  };
}

/** What became of the email: sent, written to the log instead (KEY_NOTICE_SEND=log), refused by
 *  Resend, or not sent because no Resend key is set. */
export type Outcome = "sent" | "logged" | "failed" | "off";

type Env = { get(name: string): string | undefined };

/** Sends the email, unless the function's KEY_NOTICE_SEND setting is "log": then it is rendered and
 *  written to the function log (subject, length, and a hash of its text; never the address) and
 *  Resend is not called. Staging is set to "log", so no test there spends the sending quota that
 *  production shares. Anything else, or nothing, sends. */
export async function deliver(env: Env, m: Mail, fetcher: typeof fetch = fetch): Promise<Outcome> {
  if ((env.get("KEY_NOTICE_SEND") ?? "").trim().toLowerCase() === "log") {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(m.text + m.html)));
    const code = Array.from(digest.subarray(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
    log("key_notice", { status: "logged", tool: m.subject, count: m.text.length, code });
    return "logged";
  }
  const key = (env.get("RESEND_LIFECYCLE_KEY") ?? "").trim();
  if (!key) { log("key_notice", { status: "off" }); return "off"; }
  const ok = await send(key, m, fetcher);
  log("key_notice", { status: ok ? "sent" : "failed" });
  return ok ? "sent" : "failed";
}

/// Sends through Resend (https://resend.com/docs/api-reference/emails/send-email). True when taken.
export async function send(key: string, m: Mail, fetcher: typeof fetch = fetch): Promise<boolean> {
  const res = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: m.from, to: [m.to], reply_to: m.reply_to, subject: m.subject, html: m.html, text: m.text }),
    signal: AbortSignal.timeout(8000),
  });
  await res.body?.cancel();
  return res.ok;
}
