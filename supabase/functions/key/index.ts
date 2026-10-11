// The server's copy of an account's key (docs/Technical/recoverable-key.md): a device that holds
// the key stores a copy, and a signed-in device without it gets it, with no other device and no
// recovery key. Accounts that chose "Keep my key only on my devices" have no copy and get nothing.
//
//   GET  /functions/v1/key     Authorization: Bearer <the user's access token>
//   → 200 { on: true, pub, ticket }     a public key to seal a copy to, and the ticket to send back
//   POST /functions/v1/key     { op: "store", ticket, box, choose?, from?, platform? }
//   → 200 { stored: true }
//   POST /functions/v1/key     { op: "fetch", pub, platform? }
//   → 200 { sealed, key_id, generation }     the key, sealed to `pub`
//   → 403 { hint: "paused_after_reset", until } after a password reset, only while KEY_COPY_HOLD_HOURS is set (default 0: no hold)
//   → 403 { hint: "reauth" } when the session's sign-in is older than KEY_COPY_SIGNIN_HOURS (default 1)
//   → 404 { hint: "no_copy" | "no_key" }, 409 { hint: "strict" | "not_chosen" | "ticket_used" }, 429 { hint: "rate" }
//   → 503 { hint: "off" } while KEY_COPY isn't "on" or no KEY_COPY_SECRET_<n> is set
//
// The copies are sealed under KEY_COPY_SECRET_<n> (base64 of 32 random bytes), which exists only
// in this function's environment: `supabase secrets set KEY_COPY_SECRET_1=$(openssl rand -base64 32)`.
// The caller is whoever the access token says; there is no way to name another account. The work
// happens in the home region only (_shared/region.ts).
import { clientAddress } from "../_shared/client.ts";
import { connect, readiness } from "../_shared/db.ts";
import { dailyHash, hashSecret } from "../_shared/hash.ts";
import { log } from "../_shared/log.ts";
import { atHome } from "../_shared/region.ts";
import { handle } from "./logic.ts";
import { fetchedMail, send } from "./notice.ts";

const sql = connect(Deno.env, 1);
const ready = readiness(sql);
const API = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

/** The user the access token belongs to, checked by the auth server (not just decoded). */
async function userFor(token: string): Promise<string | null> {
  const r = await fetch(`${API}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } });
  // The auth server being down is not "this session is no good": the device tries again
  // instead of showing its person the linking screen.
  if (r.status >= 500) { await r.body?.cancel(); throw new Error(`auth ${r.status}`); }
  if (!r.ok) { await r.body?.cancel(); return null; }
  const u = await r.json();
  return typeof u?.id === "string" ? u.id : null;
}

async function notify(uid: string, platform: string) {
  const key = (Deno.env.get("RESEND_LIFECYCLE_KEY") ?? "").trim();
  if (!key) { log("key_notice", { status: "off" }); return; }
  const [row] = await sql<{ email: string | null }[]>`select email from auth.users where id = ${uid}`;
  if (!row?.email) return;
  log("key_notice", { status: (await send(key, fetchedMail(row.email, platform, new Date()))) ? "sent" : "failed" });
}

Deno.serve(atHome("key", async (req) => {
  await ready();
  return await handle(req, { sql, env: Deno.env, userFor, addressHash: await dailyHash(hashSecret(), clientAddress(req)), notify });
}));
