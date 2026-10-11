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
  /** Tells the person a device got their key, by email. Best effort; never fails the request. */
  notify?: (uid: string, platform: string) => Promise<void>;
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

async function event(sql: Sql, uid: string, what: "stored" | "fetched", platform: string | null) {
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
    if (body.op === "fetch") return await fetchKey(deps, s, uid, body, platform, now);
    await refused(deps.sql, uid, platform, "bad_request");
    return refuse(400, "bad_request", "Not a request.");
  } catch (e) {
    logError("key", e);
    return refuse(500, "error", "Something went wrong. Try again.");
  }
}

/// A device that holds the key hands the server a copy. `choose`: the person just chose to (or
/// the account is new, where a copy is the default); without it a copy is only renewed for an
/// account that is already standard.
async function store(deps: Deps, s: Secrets, uid: string, body: Record<string, unknown>, platform: string | null, now: number): Promise<Response> {
  const { sql } = deps;
  const ticket = typeof body.ticket === "string" ? body.ticket : "", box = typeof body.box === "string" ? body.box : "";
  const choose = body.choose === true;
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
    const stored = await sql.begin(async (tx) => {
      const [still] = await tx`select 1 from public.account_keys where user_id = ${uid} and key_id = ${row.key_id} for update`;
      if (!still) return false;
      await tx`insert into public.account_key_copies as c (user_id, key_id, sealed, secret_version)
        values (${uid}, ${at.keyId}, ${at.sealed}, ${at.version})
        on conflict (user_id) do update set key_id = excluded.key_id, sealed = excluded.sealed,
          secret_version = excluded.secret_version, stored_at = now()`;
      await tx`insert into public.account_key_protection as p (user_id, mode) values (${uid}, 'standard')
        on conflict (user_id) do update set mode = 'standard', chosen_at = now() where p.mode <> 'standard'`;
      return true;
    });
    if (!stored) { await refused(sql, uid, platform, "no_key"); return refuse(409, "no_key", "This account's key changed. Try again."); }
    await event(sql, uid, "stored", platform);
    return json({ stored: true });
  } finally {
    wipe(k);
  }
}

/// A signed-in device without the key asks for it. The answer is sealed to `pub`, the public half
/// of a key pair the device made for this request, so a replayed request gets a box only that
/// device can open.
async function fetchKey(deps: Deps, s: Secrets, uid: string, body: Record<string, unknown>, platform: string | null, now: number): Promise<Response> {
  const { sql } = deps;
  let pub: Bytes;
  try {
    pub = fromBase64(typeof body.pub === "string" ? body.pub : "");
    await publicKey(pub);
  } catch {
    await refused(sql, uid, platform, "bad_request");
    return refuse(400, "bad_request", "Not a request.");
  }
  const [counts] = await sql<{ hour: number; day: number }[]>`
    select count(*) filter (where what = 'fetched' and at > now() - interval '1 hour')::int as hour,
           count(*) filter (where what = 'fetched')::int as day
    from public.key_copy_events where user_id = ${uid} and at > now() - interval '1 day'`;
  if (counts.hour >= LIMITS.fetchPerHour || counts.day >= LIMITS.fetchPerDay) {
    await refused(sql, uid, platform, "rate");
    return refuse(429, "rate", "Too many tries. Try again in an hour.");
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
    const sealed = await sealTransport(k, pub, "down", uid);
    if (version !== s.current) {
      const at = await sealAtRest(k, s, uid);
      await sql`update public.account_key_copies set sealed = ${at.sealed}, secret_version = ${at.version}
        where user_id = ${uid} and key_id = ${row.key_id}`;
    }
    await sql`update public.account_key_copies set opened_at = now() where user_id = ${uid}`;
    await event(sql, uid, "fetched", platform);
    await sql`insert into public.account_notices (user_id, kind, what) values (${uid}, 'key_fetched', 'A new device opened your notes')`;
    if (deps.notify) {
      try { await deps.notify(uid, platform ?? ""); } catch (e) { logError("key notify", e); }
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
