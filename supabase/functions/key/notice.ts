// The email that says a new device got the account's key. A person with one device has no other
// screen to see the in-app notice on, so this is how they hear of a sign-in that wasn't theirs.
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
