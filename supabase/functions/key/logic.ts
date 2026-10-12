// The `key` function's work, apart from the server around it (index.ts), so the tests run it
// against the whole schema in an in-process Postgres (key.pglite.test.ts).
//
// Nothing here logs or returns key material: a key leaves only sealed to the public key a device
// sent with its request, and every answer about why something was refused is a short fixed hint.
import type { Sql } from "npm:postgres@3.4.5";
import { fromBase64, hex, OpenError, recoveryKEK, unwrap, verifierOf, type Bytes } from "../_shared/e2ee.ts";
import { type KeyMaterial, newTicket, openAtRest, openTicket, openTransport, publicKey, sameHex, sealAtRest, sealTransport,
  SecretMissing, secrets, type Env, type Secrets } from "../_shared/keycopy.ts";
import { log, logError } from "../_shared/log.ts";

export type Deps = {
  sql: Sql;
  env: Env;
  /** The account an access token belongs to, as the auth server says (never just decoded). */
  userFor(token: string): Promise<string | null>;
  /** The caller's address, hashed (for "too many from one place"). */
  addressHash: string;
  /** When the session behind an access token was signed in to (not refreshed), in milliseconds,
   *  or null when the token doesn't say. Read only after `userFor` accepted the token. */
  signedInAt?: (token: string) => number | null;
  /** Tells the person a device got their key, by email. Best effort; never fails the request. */
  notify?: (uid: string, platform: string) => Promise<string | void>;
  now?: () => number;
};

/** How many times an account's key is handed out, and stored, before it has to wait.
 *  `refusedRowsPerHour`: every refusal is a log line; this many of them an hour are also rows in
 *  key_copy_events, so a client that asks in a loop can't fill the table. */
export const LIMITS = { fetchPerHour: 5, fetchPerDay: 20, storePerHour: 10, perAddressPerMinute: 30, refusedRowsPerHour: 30 };

/** KEY_COPY_HOLD_HOURS: how long after a password reset (or a sign-in by emailed link) the key is
 *  kept from a new device. 0, the default, is no hold. A function secret, so it can be turned on
 *  without a deploy: `supabase secrets set KEY_COPY_HOLD_HOURS=72`. Anything that isn't a whole
 *  number of hours from 0 to 720 counts as 0. */
export function holdHours(env: Env): number {
  const text = (env.get("KEY_COPY_HOLD_HOURS") ?? "").trim();
  if (!/^[0-9]{1,3}$/.test(text)) return 0;
  const n = Number(text);
  return n <= 720 ? n : 0;
}

/** KEY_COPY_SIGNIN_HOURS: how recent the sign-in behind a session has to be for it to get the key.
 *  1 hour by default: a new device fetches seconds after signing in, and an old session, a token
 *  taken from a backup or a refresh token read out of the database gets nothing. A function
 *  secret, 1 to 720; anything else counts as 1. */
export function signInHours(env: Env): number {
  const text = (env.get("KEY_COPY_SIGNIN_HOURS") ?? "").trim();
  if (!/^[0-9]{1,3}$/.test(text)) return 1;
  const n = Number(text);
  return n >= 1 && n <= 720 ? n : 1;
}

/** The newest sign-in in an access token's `amr` claim, as `pane_signed_in_at()` reads it in SQL:
 *  a refresh doesn't count. Milliseconds, or null. The token was verified by the auth server first. */
export function signedInAtOf(token: string): number | null {
  try {
    const part = token.split(".")[1] ?? "";
    const text = atob(part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - part.length % 4) % 4));
    const amr = JSON.parse(text)?.amr;
    if (!Array.isArray(amr)) return null;
    let newest = 0;
    for (const a of amr) {
      if (a?.method !== "token_refresh" && typeof a?.timestamp === "number" && a.timestamp > newest) newest = a.timestamp;
    }
    return newest > 0 ? newest * 1000 : null;
  } catch {
    return null;
  }
}

const sha256Hex = async (text: string) => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));

const PLATFORMS = new Set(["ios", "macos", "android", "windows", "web"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const refuse = (status: number, hint: string, error: string, more: Record<string, unknown> = {}) => json({ error, hint, ...more }, status);

/** On only when KEY_COPY says so and there's a secret to seal with. Off, the function answers
 *  503 "off" to everything and no device stores or gets a key: today's behaviour. */
export function switchedOn(env: Env): Secrets | null {
  if ((env.get("KEY_COPY") ?? "").trim().toLowerCase() !== "on") return null;
  return secrets(env);
}

type KeyRow = { key_id: string; verifier: string; recovery_wrap: string };

async function event(sql: Sql, uid: string, what: "stored", platform: string | null) {
  await sql`insert into public.key_copy_events (user_id, what, platform) values (${uid}, ${what}, ${platform})`;
  log("key_copy", { status: what });
}

/** A refusal to an account: always a log line, and a row in the account's log of what happened
 *  (up to LIMITS.refusedRowsPerHour an hour). Neither carries anything of the request but why. */
async function refused(sql: Sql, uid: string, platform: string | null, why: string) {
  log("key_copy", { status: "refused", kind: why });
  await sql`insert into public.key_copy_events (user_id, what, why, platform)
    select ${uid}, 'refused', ${why}, ${platform}
    where (select count(*) from public.key_copy_events e where e.user_id = ${uid} and e.what = 'refused' and e.at > now() - interval '1 hour') < ${LIMITS.refusedRowsPerHour}`;
}

/** Whether these bytes are the account's key: its id, its verifier, and its recovery key opens
 *  the account's recovery wrap to the same data key. */
async function isAccountsKey(k: KeyMaterial, row: KeyRow, uid: string): Promise<boolean> {
  if (!sameHex(await verifierOf(k.dataKey, uid), row.verifier)) return false;
  try {
    const opened = await unwrap(row.recovery_wrap, await recoveryKEK(k.recovery, uid), "recovery", uid);
    return sameHex(hex(opened), hex(k.dataKey));
  } catch {
    return false;
  }
}

async function tooManyFromHere(sql: Sql, addressHash: string): Promise<boolean> {
  const [{ n }] = await sql<{ n: number }[]>`
    with recent as (select count(*)::int n from public.oauth_rate where bucket = 'key' and ip_hash = ${addressHash} and at > now() - interval '1 minute')
    insert into public.oauth_rate (bucket, ip_hash) select 'key', ${addressHash} returning (select n from recent)`;
  return n >= LIMITS.perAddressPerMinute;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "GET" && req.method !== "POST") return refuse(405, "method", "Use GET or POST.");
  const now = deps.now?.() ?? Date.now();
  try {
    // Before the session is looked at: a flood of made-up tokens from one place is held up here
    // and never reaches the auth server.
    if (await tooManyFromHere(deps.sql, deps.addressHash)) {
      log("key_copy", { status: "refused", kind: "rate_address" });
      return refuse(429, "rate", "Too many tries. Wait a minute.");
    }
    // The account is whoever the session says, and nothing else: no field of the request, no
    // header and no part of the address is ever read as an account.
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const uid = token ? await deps.userFor(token) : null;
    if (!uid) {
      log("key_copy", { status: "refused", kind: "sign_in" });
      return refuse(401, "sign_in", "Sign in again.");
    }
    const s = switchedOn(deps.env);
    if (!s) return refuse(503, "off", "Not available.");
    if (req.method === "GET") return json({ on: true, ...(await newTicket(s, uid, now)) });
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { body = null as never; }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      await refused(deps.sql, uid, null, "bad_request");
      return refuse(400, "bad_request", "Not a request.");
    }
    const platform = typeof body.platform === "string" && PLATFORMS.has(body.platform) ? body.platform : null;
    if (body.op === "store") return await store(deps, s, uid, body, platform, now);
    if (body.op === "fetch") return await fetchKey(deps, s, uid, body, platform, now, (deps.signedInAt ?? signedInAtOf)(token));
    await refused(deps.sql, uid, platform, "bad_request");
    return refuse(400, "bad_request", "Not a request.");
  } catch (e) {
    logError("key", e);
    return refuse(500, "error", "Something went wrong. Try again.");
  }
}

/// A device that holds the key hands the server a copy. `choose`: the person just chose to (or
/// the account is new, where a copy is the default); without it a copy is only renewed for an
/// account that is already standard. `from`: the mode the device saw when the person chose
/// ("standard", "strict", or absent for an account that hadn't chosen). An account that is strict
/// by the time the copy would go in gets one only when the choice was to turn strict off
/// (`from: "strict"`): a renewal that raced the switch, a device that hadn't heard, or a choice
/// made before the switch was turned leaves it strict. A ticket stores once.
async function store(deps: Deps, s: Secrets, uid: string, body: Record<string, unknown>, platform: string | null, now: number): Promise<Response> {
  const { sql } = deps;
  const ticket = typeof body.ticket === "string" ? body.ticket : "", box = typeof body.box === "string" ? body.box : "";
  const choose = body.choose === true;
  const from = body.from === "strict" || body.from === "standard" ? body.from : null;
  const [row] = await sql<KeyRow[]>`select key_id, verifier, recovery_wrap from public.account_keys where user_id = ${uid}`;
  if (!row) { await refused(sql, uid, platform, "no_key"); return refuse(409, "no_key", "This account has no key yet."); }
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int n from public.key_copy_events where user_id = ${uid} and (what = 'stored' or (what = 'refused' and why = 'wrong_key')) and at > now() - interval '1 hour'`;
  if (n >= LIMITS.storePerHour) { await refused(sql, uid, platform, "rate"); return refuse(429, "rate", "Too many tries. Try again in an hour."); }
  const [mode] = await sql<{ mode: string }[]>`select mode from public.account_key_protection where user_id = ${uid}`;
  if (!choose && mode?.mode !== "standard") {
    const why = mode?.mode === "strict" ? "strict" : "not_chosen";
    await refused(sql, uid, platform, why);
    return refuse(409, why, "This account keeps its key on its devices only.");
  }
  let k: KeyMaterial;
  try {
    k = await openTransport(box, await openTicket(ticket, s, uid, now), "up", uid, row.key_id);
  } catch (e) {
    if (!(e instanceof OpenError)) throw e;
    await refused(sql, uid, platform, "wrong_key");
    return refuse(400, "wrong_key", "That isn't this account's key.");
  }
  try {
    if (!(await isAccountsKey(k, row, uid))) {
      await refused(sql, uid, platform, "wrong_key");
      return refuse(400, "wrong_key", "That isn't this account's key.");
    }
    const at = await sealAtRest(k, s, uid);
    // The copy and the mode go in together, and only for the key the account still has: a Start
    // fresh between the read above and here leaves nothing behind.
    const ticketHash = await sha256Hex(ticket);
    const stored = await sql.begin(async (tx) => {
      const [still] = await tx`select 1 from public.account_keys where user_id = ${uid} and key_id = ${row.key_id} for update`;
      if (!still) return "no_key";
      // The mode as it is now, under the same lock keep_key_on_devices takes: what was read
      // before the key was opened may be a moment old, and that moment is the switch being turned.
      const [now_] = await tx<{ mode: string }[]>`select mode from public.account_key_protection where user_id = ${uid}`;
      if (now_?.mode === "strict" && !(choose && from === "strict")) return "strict";
      if (!choose && now_?.mode !== "standard") return "not_chosen";
      await tx`delete from public.key_copy_tickets where at < now() - interval '15 minutes'`;
      const used = await tx`insert into public.key_copy_tickets (hash, user_id) values (${ticketHash}, ${uid}) on conflict do nothing returning 1`;
      if (used.length === 0) return "used";
      await tx`insert into public.account_key_copies as c (user_id, key_id, sealed, secret_version)
        values (${uid}, ${at.keyId}, ${at.sealed}, ${at.version})
        on conflict (user_id) do update set key_id = excluded.key_id, sealed = excluded.sealed,
          secret_version = excluded.secret_version, stored_at = now()`;
      await tx`insert into public.account_key_protection as p (user_id, mode) values (${uid}, 'standard')
        on conflict (user_id) do update set mode = 'standard', chosen_at = now() where p.mode <> 'standard'`;
      return "stored";
    });
    if (stored === "no_key") { await refused(sql, uid, platform, "no_key"); return refuse(409, "no_key", "This account's key changed. Try again."); }
    if (stored === "strict" || stored === "not_chosen") {
      await refused(sql, uid, platform, stored);
      return refuse(409, stored, "This account keeps its key on its devices only.");
    }
    if (stored === "used") { await refused(sql, uid, platform, "ticket_used"); return refuse(409, "ticket_used", "Ask again."); }
    await event(sql, uid, "stored", platform);
    return json({ stored: true });
  } finally {
    wipe(k);
  }
}

/// A signed-in device without the key asks for it. The answer is sealed to `pub`, the public half
/// of a key pair the device made for this request, so a replayed request gets a box only that
/// device can open.
async function fetchKey(deps: Deps, s: Secrets, uid: string, body: Record<string, unknown>, platform: string | null, now: number, signedIn: number | null): Promise<Response> {
  const { sql } = deps;
  let pub: Bytes;
  try {
    pub = fromBase64(typeof body.pub === "string" ? body.pub : "");
    await publicKey(pub);
  } catch {
    await refused(sql, uid, platform, "bad_request");
    return refuse(400, "bad_request", "Not a request.");
  }
  // Only a session signed in to lately gets the key (signInHours): a device asks seconds after
  // signing in, and a session from long ago, however it was come by, is told to sign in again.
  const window = signInHours(deps.env) * 3600_000;
  if (signedIn === null || signedIn < now - window) {
    await refused(sql, uid, platform, "reauth");
    return refuse(403, "reauth", "Sign in again to open your notes.");
  }
  const [row] = await sql<(KeyRow & { mode: string | null; sealed: string | null; copy_key_id: string | null; generation: number; reset_at: Date | null })[]>`
    select k.key_id, k.verifier, k.recovery_wrap,
           (select p.mode from public.account_key_protection p where p.user_id = k.user_id) as mode,
           c.sealed, c.key_id as copy_key_id,
           coalesce((select r.generation from public.account_key_resets r where r.user_id = k.user_id), 0) as generation,
           (select a.at from public.account_recoveries a where a.user_id = k.user_id) as reset_at
    from public.account_keys k left join public.account_key_copies c on c.user_id = k.user_id
    where k.user_id = ${uid}`;
  if (!row) { await refused(sql, uid, platform, "no_key"); return refuse(404, "no_key", "This account has no key yet."); }
  if (row.mode === "strict") { await refused(sql, uid, platform, "strict"); return refuse(409, "strict", "This account keeps its key on its devices only."); }
  // Exactly standard: a copy beside no choice can only be a write to the database, and isn't handed out.
  if (row.mode !== "standard") { await refused(sql, uid, platform, "not_chosen"); return refuse(409, "not_chosen", "This account keeps its key on its devices only."); }
  if (!row.sealed || row.copy_key_id !== row.key_id) { await refused(sql, uid, platform, "no_copy"); return refuse(404, "no_copy", "No copy of this account's key is kept."); }
  // A hold after a password reset or an emailed sign-in link, when one is set (holdHours; none
  // by default): whoever got into the mailbox doesn't get the notes at once.
  const hold = holdHours(deps.env);
  const until = hold > 0 && row.reset_at ? new Date(row.reset_at).getTime() + hold * 3600_000 : 0;
  if (until > now) {
    await refused(sql, uid, platform, "paused");
    return refuse(403, "paused_after_reset", `Your notes open on a new device ${hold} hours after a password reset, to protect them.`,
      { until: new Date(until).toISOString() });
  }
  let k: KeyMaterial, version: number;
  try {
    ({ key: k, version } = await openAtRest(row.sealed, s, uid, row.key_id));
  } catch (e) {
    if (!(e instanceof OpenError) && !(e instanceof SecretMissing)) throw e;
    // A copy this function can't open is left where it is: a secret that's missing by mistake
    // must not cost anyone their copy.
    await refused(sql, uid, platform, "unreadable");
    return refuse(503, "unreadable", "Not available right now. Try again later.");
  }
  try {
    // Never hand out anything that isn't the account's key, whatever the table said.
    if (!(await isAccountsKey(k, row, uid))) {
      await refused(sql, uid, platform, "unreadable");
      return refuse(503, "unreadable", "Not available right now. Try again later.");
    }
    // Counted and written down in one step, one request at a time for the account: of many sent
    // at once, only as many as the limit get an answer (and an email).
    const taken = await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtextextended(${"key-copy " + uid}, 0))`;
      const [counts] = await tx<{ hour: number; day: number }[]>`
        select count(*) filter (where what = 'fetched' and at > now() - interval '1 hour')::int as hour,
               count(*) filter (where what = 'fetched')::int as day
        from public.key_copy_events where user_id = ${uid} and at > now() - interval '1 day'`;
      if (counts.hour >= LIMITS.fetchPerHour || counts.day >= LIMITS.fetchPerDay) return null;
      const [e] = await tx<{ id: number }[]>`insert into public.key_copy_events (user_id, what, platform) values (${uid}, 'fetched', ${platform}) returning id`;
      return e.id;
    });
    if (taken === null) {
      await refused(sql, uid, platform, "rate");
      return refuse(429, "rate", "Too many tries. Try again in an hour.");
    }
    let sealed: string;
    try {
      sealed = await sealTransport(k, pub, "down", uid);
    } catch (e) {
      await sql`delete from public.key_copy_events where id = ${taken}`;
      throw e;
    }
    log("key_copy", { status: "fetched" });
    if (version !== s.current) {
      const at = await sealAtRest(k, s, uid);
      await sql`update public.account_key_copies set sealed = ${at.sealed}, secret_version = ${at.version}
        where user_id = ${uid} and key_id = ${row.key_id}`;
    }
    await sql`update public.account_key_copies set opened_at = now() where user_id = ${uid}`;
    await sql`insert into public.account_notices (user_id, kind, what) values (${uid}, 'key_fetched', 'A new device opened your notes')`;
    if (deps.notify) {
      // What became of the email is written down too ("mailed": sent, logged, failed, off), so a
      // test can check it was rendered and not sent, and support can see a person was told.
      let outcome: string | void = "failed";
      try { outcome = await deps.notify(uid, platform ?? ""); } catch (e) { logError("key notify", e); }
      if (typeof outcome === "string") {
        await sql`insert into public.key_copy_events (user_id, what, why, platform) values (${uid}, 'mailed', ${outcome}, ${platform})`;
      }
    }
    return json({ sealed, key_id: row.key_id, generation: row.generation });
  } finally {
    wipe(k);
  }
}

function wipe(k: KeyMaterial) {
  k.dataKey.fill(0);
  k.recovery.fill(0);
}

/// Seals every copy that an older secret sealed under the newest one, so the old secret can be
/// deleted. For the operator (scripts/key-copy-rotate.ts), never for a client. Returns how many.
export async function resealAll(sql: Sql, env: Env): Promise<{ resealed: number; unreadable: number }> {
  const s = secrets(env);
  if (!s) throw new Error("no KEY_COPY_SECRET_<n> is set");
  const rows = await sql<{ user_id: string; key_id: string; sealed: string }[]>`
    select user_id, key_id, sealed from public.account_key_copies where secret_version <> ${s.current}`;
  let resealed = 0, unreadable = 0;
  for (const r of rows) {
    try {
      const { key } = await openAtRest(r.sealed, s, r.user_id, r.key_id);
      const at = await sealAtRest(key, s, r.user_id);
      wipe(key);
      await sql`update public.account_key_copies set sealed = ${at.sealed}, secret_version = ${at.version}
        where user_id = ${r.user_id} and key_id = ${r.key_id} and sealed = ${r.sealed}`;
      resealed++;
    } catch {
      unreadable++;
    }
  }
  return { resealed, unreadable };
}
