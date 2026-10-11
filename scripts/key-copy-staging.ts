// The server's copy of an account's key, against the real staging project: the auth server, the
// gateway and the deployed `key` function (docs/Technical/recoverable-key.md). Never production.
//
//   deno run -A scripts/key-copy-staging.ts
//
// It makes throwaway accounts through the admin API, acts as their devices, and deletes them at
// the end. Output is one JSON line per check and a summary; no key, secret or token is printed.
import { fromBase64, hex, keyIdOf, newDataKey, OpenError, recoveryKEK, toBase64, verifierOf, wrap } from "../supabase/functions/_shared/e2ee.ts";
import { openAtRest, openTransport, sealTransport, secrets, type KeyMaterial } from "../supabase/functions/_shared/keycopy.ts";

const PRODUCTION_REF = "rodegaeruhyybqilrnpn";
const ROOT = new URL("..", import.meta.url).pathname;
const common = new TextDecoder().decode((await new Deno.Command("git", { args: ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"] }).output()).stdout).trim();
const SECRETS = Deno.env.get("AMBER_SECRETS") ?? `${common.replace(/\/\.git$/, "")}/.secrets`;
const env = Object.fromEntries((await Deno.readTextFile(`${SECRETS}/staging.env`)).split("\n").filter((l) => l.includes("="))
  .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, "")]));
const REF = env.STAGING_REF;
if (!REF || REF === PRODUCTION_REF) throw new Error("not the staging project");
const BASE = `https://${REF}.supabase.co`;
const P256 = { name: "ECDH", namedCurve: "P-256" } as const;

async function managementToken(): Promise<string> {
  const fromEnv = Deno.env.get("SUPABASE_ACCESS_TOKEN");
  if (fromEnv) return fromEnv;
  const out = await new Deno.Command("security", { args: ["find-generic-password", "-s", "Supabase CLI", "-a", "access-token", "-w"], stdout: "piped", stderr: "null" }).output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  return raw.startsWith("go-keyring-base64:") ? atob(raw.slice("go-keyring-base64:".length)) : raw;
}
async function api(method: string, path: string, body?: unknown) {
  const r = await fetch(`https://api.supabase.com${path}`, { method, headers: { authorization: `Bearer ${await managementToken()}`, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status}`);
  return await r.json();
}
/** SQL on staging through the Management API, as someone holding the whole database would run it. */
const sql = (query: string, write = false): Promise<Record<string, any>[]> => api("POST", `/v1/projects/${REF}/database/query`, { query, read_only: !write });
const list = await api("GET", `/v1/projects/${REF}/api-keys?reveal=true`) as { name: string; api_key: string }[];
const ANON = list.find((k) => k.name === "anon")!.api_key, SERVICE = list.find((k) => k.name === "service_role")!.api_key;

// MARK: Accounts and devices

type Account = { id: string; email: string; password: string; key: KeyMaterial; keyId: string };
const made: string[] = [];

async function admin(method: string, path: string, body?: unknown) {
  const r = await fetch(`${BASE}/auth/v1/admin${path}`, { method, headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) throw new Error(`admin ${method} ${path}: ${r.status}`);
  return await r.json();
}

/** A sign-in: a session of its own, as each device has. */
async function signIn(a: Pick<Account, "email" | "password">): Promise<string> {
  const r = await fetch(`${BASE}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: ANON, "content-type": "application/json" }, body: JSON.stringify({ email: a.email, password: a.password }) });
  if (!r.ok) throw new Error(`sign in: ${r.status}`);
  return (await r.json()).access_token;
}

async function rpc(token: string, name: string, args: Record<string, unknown> = {}) {
  const r = await fetch(`${BASE}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: ANON, authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(args) });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
}

/** An account whose first device made its key, as every build since 1.1 does. */
async function account(): Promise<Account & { token: string }> {
  // Resend's own sink address: the function mails the account when a device gets its key, and a
  // made-up domain would bounce against the sending domain.
  const email = `delivered+keycopy-${crypto.randomUUID().slice(0, 13)}@resend.dev`;
  const password = toBase64(crypto.getRandomValues(new Uint8Array(24)));
  const u = await admin("POST", "/users", { email, password, email_confirm: true });
  made.push(u.id);
  const key = { dataKey: newDataKey(), recovery: crypto.getRandomValues(new Uint8Array(16)) };
  const keyId = await keyIdOf(key.dataKey);
  const token = await signIn({ email, password });
  const r = await rpc(token, "create_account_key", { p_key_id: keyId, p_verifier: await verifierOf(key.dataKey, u.id),
    p_recovery_wrap: await wrap(key.dataKey, await recoveryKEK(key.recovery, u.id), "recovery", u.id), p_generation: 0 });
  if (r.status !== 200) throw new Error(`create_account_key: ${r.status}`);
  return { id: u.id, email, password, key, keyId, token };
}

// The function takes 30 requests a minute from one address: this stays under it, so the only
// "too many tries" below is the one that's asked for.
const sent: number[] = [];
async function paced() {
  const now = Date.now();
  while (sent.length && sent[0] < now - 60_000) sent.shift();
  if (sent.length >= 24) await new Promise((r) => setTimeout(r, sent[0] + 61_000 - now));
  sent.push(Date.now());
}

async function key(token: string | null, body?: unknown, bearer?: string, more: { path?: string; headers?: Record<string, string> } = {}) {
  await paced();
  const headers: Record<string, string> = { apikey: ANON, "content-type": "application/json", ...(more.headers ?? {}) };
  if (bearer ?? token) headers.authorization = `Bearer ${bearer ?? token}`;
  const r = await fetch(`${BASE}/functions/v1/key${more.path ?? ""}`, body === undefined ? { headers } : { method: "POST", headers, body: JSON.stringify(body) });
  const text = await r.text();
  let parsed: Record<string, any> = {};
  try { parsed = JSON.parse(text); } catch { /* the gateway's own refusal */ }
  return { status: r.status, body: parsed, region: r.headers.get("x-amber-region") };
}

async function store(a: Account, token: string, choose: boolean, k: KeyMaterial = a.key) {
  const hello = await key(token);
  if (hello.status !== 200) return hello;
  return await key(token, { op: "store", ticket: hello.body.ticket, box: await sealTransport(k, fromBase64(hello.body.pub), "up", a.id), choose, platform: "ios" });
}

async function fetchKey(token: string) {
  const pair = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const pub = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
  return { ...(await key(token, { op: "fetch", pub, platform: "macos" })), pair, pub };
}

const state = async (token: string) => (await rpc(token, "account_key_state")).body;

// MARK: The checks

const results: { check: string; ok: boolean; detail?: unknown }[] = [];
function check(name: string, ok: boolean, detail?: unknown) {
  results.push({ check: name, ok, detail });
  console.log(JSON.stringify({ check: name, ok, ...(detail === undefined ? {} : { detail }) }));
}
const opens = async (sealed: string, priv: CryptoKey, a: Account) => {
  try {
    const k = await openTransport(sealed, priv, "down", a.id, a.keyId);
    return hex(k.dataKey) === hex(a.key.dataKey) && hex(k.recovery) === hex(a.key.recovery);
  } catch (e) {
    if (e instanceof OpenError) return false;
    throw e;
  }
};

try {
  // 1. A new account on device A; device B signs in and has the key, with no linking.
  const a = await account();
  const stored = await store(a, a.token, true);
  check("new account: device A stores a copy", stored.status === 200 && stored.body.stored === true, { status: stored.status, region: stored.region });
  const sA = await state(a.token);
  check("new account: the key state says standard, with a copy", sA.copy === true && sA.protection === "standard" && sA.key.key_id === a.keyId);
  const deviceB = await signIn(a);
  const got = await fetchKey(deviceB);
  check("device B signs in and gets the key, no other device involved", got.status === 200 && await opens(got.body.sealed, got.pair.privateKey, a), { status: got.status, region: got.region });
  const notices = await sql(`select kind from public.account_notices where user_id = '${a.id}'`);
  check("every device is told: a key_fetched notice", notices.length === 1 && notices[0].kind === "key_fetched");

  // 2. An account from before: no copy until a device that holds the key chooses, then B opens.
  const old = await account();
  const sOld = await state(old.token);
  check("an account from before has no copy and has not chosen", sOld.copy === false && sOld.protection === null);
  const oldB = await signIn(old);
  const before = await fetchKey(oldB);
  check("its second device gets nothing yet", before.status === 404 && before.body.hint === "no_copy", { status: before.status, hint: before.body.hint });
  const silent = await store(old, old.token, false);
  check("a device never stores a copy silently for it", silent.status === 409 && silent.body.hint === "not_chosen", { status: silent.status, hint: silent.body.hint });
  check("nothing was stored", (await sql(`select 1 from public.account_key_copies where user_id = '${old.id}'`)).length === 0);
  const chosen = await store(old, old.token, true);
  const after = await fetchKey(oldB);
  check("once its device comes online and the person chooses, the copy is stored and the second device opens",
    chosen.status === 200 && after.status === 200 && await opens(after.body.sealed, after.pair.privateKey, old));

  // 3. Wrong or replayed requests get nothing.
  const none = await key(null, { op: "fetch", pub: got.pub });
  const anon = await key(null, { op: "fetch", pub: got.pub }, ANON);
  const junk = await key(null, { op: "fetch", pub: got.pub }, "eyJhbGciOiJIUzI1NiJ9.e30.nothing");
  check("no session, the public key as a session, a made-up session: refused", [none, anon, junk].every((r) => r.status === 401 && !("sealed" in r.body)),
    { statuses: [none.status, anon.status, junk.status] });
  const other = await account();
  const asOther = await fetchKey(other.token);
  check("another account's session gets nothing of this account's", asOther.status === 404 && asOther.body.hint === "no_copy");
  // The other account's session, with this account's id everywhere a request can carry one.
  const named = { user_id: a.id, user: a.id, uid: a.id, id: a.id, sub: a.id, account: a.id, account_id: a.id, key_id: a.keyId, claims: { sub: a.id } };
  const naming = { path: `/${a.id}?user_id=${a.id}&uid=${a.id}&sub=${a.id}`, headers: { "x-user-id": a.id, "x-supabase-user": a.id, "x-account": a.id } };
  const asNamed = await key(other.token, { ...named, op: "fetch", pub: got.pub, platform: "web" }, undefined, naming);
  await store(other, other.token, true);
  const ownPair = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const ownPub = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", ownPair.publicKey)));
  const asNamedWithCopy = await key(other.token, { ...named, op: "fetch", pub: ownPub, platform: "web" }, undefined, naming);
  check("naming this account in the body, the address and the headers changes nothing: the caller gets its own key or nothing",
    asNamed.status === 404 && asNamed.body.hint === "no_copy" && asNamedWithCopy.status === 200 && asNamedWithCopy.body.key_id === other.keyId
      && !(await opens(asNamedWithCopy.body.sealed, ownPair.privateKey, a)) && await opens(asNamedWithCopy.body.sealed, ownPair.privateKey, other),
    { statuses: [asNamed.status, asNamedWithCopy.status] });
  const wrong = await store(a, a.token, true, other.key);
  check("another key can't be stored as this account's", wrong.status === 400 && wrong.body.hint === "wrong_key");
  const replay = await key(deviceB, { op: "fetch", pub: got.pub, platform: "macos" });
  const thief = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  check("a replayed request returns a box that opens only for the device that first asked",
    replay.status === 200 && replay.body.sealed !== got.body.sealed && !(await opens(replay.body.sealed, thief.privateKey, a)) && await opens(replay.body.sealed, got.pair.privateKey, a));
  const moved = await opens(got.body.sealed, got.pair.privateKey, other);
  check("a box for one account doesn't open as another's", moved === false);

  // 4. The database without the function's secret.
  const rows = await sql(`select * from public.account_key_copies where user_id = '${a.id}'`);
  const dump = JSON.stringify([rows, await sql(`select * from public.account_keys where user_id = '${a.id}'`),
    await sql(`select * from public.key_copy_events where user_id = '${a.id}'`), await sql(`select * from public.account_key_protection where user_id = '${a.id}'`)]);
  const leaks = [a.key.dataKey, a.key.recovery].some((s) => dump.includes(toBase64(s)) || dump.includes(hex(s)) || dump.includes(toBase64(s).slice(0, 12)));
  check("a dump of every key table holds no key bytes", rows.length === 1 && !leaks, { columns: Object.keys(rows[0] ?? {}), sealed_length: String(rows[0]?.sealed ?? "").length, sealed_prefix: String(rows[0]?.sealed ?? "").slice(0, 8) });
  // Everything the database itself could offer as a key: nothing opens the row.
  const facts = await sql(`select k.key_id, k.verifier, k.recovery_wrap, u.encrypted_password, u.id::text as id from public.account_keys k join auth.users u on u.id = k.user_id where k.user_id = '${a.id}'`);
  const guesses: Uint8Array[] = [new Uint8Array(32), new TextEncoder().encode(SERVICE).slice(0, 32), new TextEncoder().encode(ANON).slice(0, 32),
    ...Object.values(facts[0]).map((v) => new Uint8Array(new TextEncoder().encode(String(v).padEnd(32, "0")).slice(0, 32)))];
  let opened = 0;
  for (const g of guesses) {
    try { await openAtRest(rows[0].sealed, secrets({ get: (n) => n === `KEY_COPY_SECRET_${rows[0].secret_version}` ? toBase64(g) : undefined })!, a.id, a.keyId); opened++; } catch { /* as it should be */ }
  }
  check("the sealed row opens with nothing the database holds (the service key, the account's own rows)", opened === 0, { tried: guesses.length });
  const viaService = await fetch(`${BASE}/rest/v1/account_key_copies?select=sealed`, { headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` } });
  const viaUser = await fetch(`${BASE}/rest/v1/account_key_copies?select=sealed`, { headers: { apikey: ANON, authorization: `Bearer ${a.token}` } });
  await viaService.body?.cancel(); await viaUser.body?.cancel();
  check("no API role reads the table, the service role included", viaService.status >= 400 && viaUser.status >= 400, { service: viaService.status, user: viaUser.status });

  // 5. Advanced protection (keep my key only on my devices): the copy goes, and device B is asked to link.
  const early = await rpc(a.token, "keep_key_on_devices", { p_device: crypto.randomUUID() });
  check("strict is refused while nothing else could open the notes", early.status >= 400 && early.body?.hint === "needs_recovery_key", { status: early.status });
  await rpc(a.token, "mark_recovery_key_saved");
  const strict = await rpc(a.token, "keep_key_on_devices", { p_device: crypto.randomUUID() });
  const gone = await sql(`select 1 from public.account_key_copies where user_id = '${a.id}'`);
  const sStrict = await state(a.token);
  check("turning strict on deletes the copy at once", strict.status < 300 && gone.length === 0 && sStrict.copy === false && sStrict.protection === "strict");
  const deviceC = await signIn(a);
  const refused = await fetchKey(deviceC);
  check("a new device of a strict account gets nothing (it shows the linking screen)", refused.status === 409 && refused.body.hint === "strict" && !("sealed" in refused.body));
  const renew = await store(a, a.token, false);
  check("a device can't bring the copy back without the person choosing", renew.status === 409 && renew.body.hint === "strict");

  // 6. A password reset. By default nothing is held: whoever signs in with the new password gets
  // the notes. (The reset ends the account's sessions; a new device signs in with the new password.)
  const reset = toBase64(crypto.getRandomValues(new Uint8Array(24)));
  await admin("PUT", `/users/${old.id}`, { password: reset });
  const afterReset = await signIn({ email: old.email, password: reset });
  const noted = await sql(`select 1 from public.account_recoveries where user_id = '${old.id}'`);
  const open = await fetchKey(afterReset);
  check("after a password reset, with no hold set, signing in opens the notes", noted.length === 1 && open.status === 200 && await opens(open.body.sealed, open.pair.privateKey, old), { status: open.status });
  // Taking the copy away is held, like Start fresh and Delete Account.
  await rpc(afterReset, "mark_recovery_key_saved");
  const strictHeld = await rpc(afterReset, "keep_key_on_devices", { p_device: crypto.randomUUID() });
  check("Advanced protection can't be turned on for 72 hours after a password reset, and the copy stays",
    strictHeld.status >= 400 && strictHeld.body?.hint === "paused_after_reset" && (await sql(`select 1 from public.account_key_copies where user_id = '${old.id}'`)).length === 1, { status: strictHeld.status });
  // The hold on handing the key out is a setting: turned on without a deploy, and off again.
  if (Deno.args.includes("--hold")) {
    await api("POST", `/v1/projects/${REF}/secrets`, [{ name: "KEY_COPY_HOLD_HOURS", value: "72" }]).catch(() => null);
    // A fetch that goes through counts toward the account's five an hour, so this asks seldom.
    let waited = 30;
    await new Promise((r) => setTimeout(r, 30_000));
    let held = await fetchKey(afterReset);
    while (held.status === 200 && waited < 90) { await new Promise((r) => setTimeout(r, 30_000)); waited += 30; held = await fetchKey(afterReset); }
    const hours = held.body.until ? (new Date(held.body.until).getTime() - Date.now()) / 3600000 : 0;
    check("with KEY_COPY_HOLD_HOURS=72 set and nothing deployed, the same device is told to wait", held.status === 403 && held.body.hint === "paused_after_reset" && hours > 71 && hours <= 72,
      { status: held.status, hours: Math.round(hours * 10) / 10, seconds_until_it_took: waited });
    await api("DELETE", `/v1/projects/${REF}/secrets`, ["KEY_COPY_HOLD_HOURS"]).catch(() => null);
    await new Promise((r) => setTimeout(r, 30_000));
    let back = await fetchKey(afterReset); waited = 30;
    while (back.status === 403 && waited < 120) { await new Promise((r) => setTimeout(r, 30_000)); waited += 30; back = await fetchKey(afterReset); }
    check("with the setting removed, there is no hold again", back.status === 200 || back.status === 429, { status: back.status });
  }

  // 7. Too many tries.
  const many = await account();
  await store(many, many.token, true);
  const statuses: number[] = [];
  for (let i = 0; i < 7; i++) statuses.push((await fetchKey(many.token)).status);
  check("the sixth fetch in an hour waits", statuses.slice(0, 5).every((s) => s === 200) && statuses.slice(5).every((s) => s === 429), { statuses });

  // 8. What a build from before reads is unchanged.
  check("the key state still has what builds since 1.1 read", ["key_id", "verifier", "recovery_wrap", "recovery_saved_at"].every((k) => k in sOld.key) && sOld.generation === 0);
  check("the work is done in the home region", got.region === "eu-central-1", { region: got.region });
  check("the log of what happened", JSON.stringify((await sql(`select what, why from public.key_copy_events where user_id = '${a.id}' order by id`)).map((r) => r.why ? `${r.what}:${r.why}` : r.what))
    === JSON.stringify(["stored", "fetched", "refused:wrong_key", "fetched", "removed", "refused:strict", "refused:strict"]));
  const everyRow = JSON.stringify(await sql(`select * from public.key_copy_events where user_id in (${made.map((i) => `'${i}'`).join(",")})`));
  const inRows = [a, old, other, many].some((x) => [x.key.dataKey, x.key.recovery].some((b) => everyRow.includes(toBase64(b)) || everyRow.includes(toBase64(b).replace(/=+$/, "")) || everyRow.includes(hex(b))));
  check("no row of the log of what happened holds key bytes", !inRows, { rows: JSON.parse(everyRow).length });
} finally {
  for (const id of made) { try { await admin("DELETE", `/users/${id}`); } catch { console.error("could not delete a test account"); } }
  const left = made.length ? await sql(`select count(*)::int n from public.account_key_copies where user_id in (${made.map((i) => `'${i}'`).join(",")})`) : [{ n: 0 }];
  check("the test accounts and their copies are gone", left[0].n === 0, { accounts: made.length });
}
const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ checks: results.length, failed: failed.map((r) => r.check) }));
if (failed.length) Deno.exit(1);
