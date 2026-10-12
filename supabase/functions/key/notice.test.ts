// The email that says a new device opened the notes: what it says, and that it is sent.
//   deno test -A supabase/functions/key/notice.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { deliver, fetchedMail, send } from "./notice.ts";

Deno.test("the email says which kind of device, when, and what to do if it wasn't you", () => {
  const m = fetchedMail("ada@example.com", "macos", new Date("2026-10-11T14:05:09Z"));
  assertEquals(m.subject, "A new device opened your notes");
  assertEquals(m.to, "ada@example.com");
  assert(m.from.includes("pintonotes.com") && m.reply_to.includes("pintonotes.com"));
  assert(m.text.includes("on a Mac") && m.text.includes("2026-10-11 at 14:05 UTC"));
  assert(m.text.includes("reset your password") && m.text.includes("Advanced protection"));
  assert(m.html.startsWith("<p>Someone signed in") && m.html.includes("Settings › Security"));
  // A kind of device we don't know is "a new device", and nothing the caller sent is echoed.
  const other = fetchedMail("ada@example.com", "<script>", new Date(0));
  assert(other.text.includes("on a new device") && !other.html.includes("<script>"));
  // Nothing public carries a dash that isn't a hyphen.
  for (const text of [m.subject, m.text, m.html]) assert(!/[\u2013\u2014]/.test(text));
});

Deno.test("it is sent through Resend with the lifecycle key, and a refusal is said", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const stub = (status: number) => ((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    return Promise.resolve(new Response("{}", { status }));
  }) as typeof fetch;
  const m = fetchedMail("ada@example.com", "ios", new Date("2026-10-11T14:05:09Z"));
  assertEquals(await send("re_test", m, stub(200)), true);
  assertEquals(calls[0].url, "https://api.resend.com/emails");
  assertEquals((calls[0].init.headers as Record<string, string>).authorization, "Bearer re_test");
  const body = JSON.parse(String(calls[0].init.body));
  assertEquals([body.to, body.subject, body.from, body.reply_to], [["ada@example.com"], m.subject, m.from, m.reply_to]);
  assert(body.text.includes("an iPhone or iPad") && body.html.includes("<p>"));
  assertEquals(await send("re_test", m, stub(422)), false);
});

Deno.test("with KEY_NOTICE_SEND=log the email is rendered and logged, and Resend is never called", async () => {
  let called = 0;
  const never = (() => { called++; return Promise.resolve(new Response("{}")); }) as typeof fetch;
  const m = fetchedMail("ada@example.com", "macos", new Date("2026-10-11T14:05:09Z"));
  const lines: string[] = [];
  const real = console.log;
  console.log = (...a: unknown[]) => { lines.push(a.map(String).join(" ")); };
  try {
    for (const v of ["log", "LOG", " log "]) {
      const env = { get: (n: string) => n === "KEY_NOTICE_SEND" ? v : n === "RESEND_LIFECYCLE_KEY" ? "re_test" : undefined };
      assertEquals(await deliver(env, m, never), "logged");
    }
    // Unset, or anything else: sent as before; and with no Resend key, off.
    const sends = { get: (n: string) => n === "RESEND_LIFECYCLE_KEY" ? "re_test" : n === "KEY_NOTICE_SEND" ? "send" : undefined };
    assertEquals(await deliver(sends, m, never), "sent");
    assertEquals(await deliver({ get: () => undefined }, m, never), "off");
  } finally {
    console.log = real;
  }
  assertEquals(called, 1, "only the one that was asked to send called Resend");
  const logged = lines.map((l) => JSON.parse(l)).filter((l) => l.status === "logged");
  assertEquals(logged.length, 3);
  assertEquals(logged[0].tool, "A new device opened your notes");
  assert(logged[0].count > 100 && /^[0-9a-f]{12}$/.test(logged[0].code));
  assert(!lines.join("\n").includes("ada@example.com"), "never the address");
});
