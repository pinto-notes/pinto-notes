// The server's copy of an account's key, on the whole schema in an in-process Postgres (PGlite):
//   deno test -A supabase/functions/key/key.pglite.test.ts
// Who gets a key and who gets nothing: no session, another account's session, a strict account,
// a held one, too many tries, a wrong key, a row moved between accounts, a table without the secret.
import { assert, assertEquals, assertNotEquals, assertRejects } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { fromBase64, hex, keyIdOf, newDataKey, OpenError, recoveryKEK, toBase64, verifierOf, wrap } from "../_shared/e2ee.ts";
import { openAtRest, openTransport, sealTransport, secrets, type KeyMaterial } from "../_shared/keycopy.ts";
import { asUser, newUser, schemaDB, sqlFor } from "../mcp/pglite.ts";
import { handle, holdHours, LIMITS, resealAll, type Deps } from "./logic.ts";

const P256 = { name: "ECDH", namedCurve: "P-256" } as const;
const SECRET_1 = toBase64(crypto.getRandomValues(new Uint8Array(32)));
const SECRET_2 = toBase64(crypto.getRandomValues(new Uint8Array(32)));
const ON = { KEY_COPY: "on", KEY_COPY_SECRET_1: SECRET_1 };

type Account = { id: string; key: KeyMaterial; keyId: string };

/** An account with a key, made as a device makes it. */
async function account(pg: PGlite): Promise<Account> {
  const id = await newUser(pg);
  const key = { dataKey: newDataKey(), recovery: crypto.getRandomValues(new Uint8Array(16)) };
  const keyId = await keyIdOf(key.dataKey);
  await asUser(pg, id, `select * from public.create_account_key($1, $2, $3, 0)`,
    [keyId, await verifierOf(key.dataKey, id), await wrap(key.dataKey, await recoveryKEK(key.recovery, id), "recovery", id)]);
  return { id, key, keyId };
}

type World = { pg: PGlite; deps: Deps; mailed: string[]; env: Record<string, string>; clock: { now: number } };

/** The function with the database, where a token is the account's id ("token:<id>"). */
function world(pg: PGlite, vars: Record<string, string> = ON): World {
  const mailed: string[] = [], env = { ...vars }, clock = { now: Date.now() };
  const deps: Deps = {
    sql: sqlFor(pg),
    env: { get: (n) => env[n] },
    userFor: (t) => Promise.resolve(t.startsWith("token:") ? t.slice(6) : null),
    addressHash: crypto.randomUUID(),
    notify: (uid) => { mailed.push(uid); return Promise.resolve(); },
    now: () => clock.now,
  };
  return { pg, deps, mailed, env, clock };
}

async function call(w: World, who: string | null, body?: unknown): Promise<{ status: number; body: Record<string, any> }> {
  const headers: Record<string, string> = who ? { authorization: `Bearer token:${who}` } : {};
  const req = body === undefined ? new Request("http://x/key", { headers })
    : new Request("http://x/key", { method: "POST", headers, body: JSON.stringify(body) });
  const res = await handle(req, w.deps);
  return { status: res.status, body: await res.json() };
}

/** A device that holds the key stores a copy, as the app does: asks for a ticket, seals to it. */
async function store(w: World, a: Account, o: { choose?: boolean; key?: KeyMaterial } = {}) {
  const hello = await call(w, a.id);
  if (hello.status !== 200) return hello;
  const box = await sealTransport(o.key ?? a.key, fromBase64(hello.body.pub), "up", a.id);
  return await call(w, a.id, { op: "store", ticket: hello.body.ticket, box, choose: o.choose ?? true, platform: "ios" });
}

/** A device without the key asks for it, with a key pair of its own. */
async function fetchKey(w: World, uid: string) {
  const pair = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const pub = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
  const r = await call(w, uid, { op: "fetch", pub, platform: "macos" });
  return { ...r, pair, pub };
}

const state = async (pg: PGlite, uid: string) => (await asUser<{ s: any }>(pg, uid, `select public.account_key_state() as s`))[0].s;
const copies = async (pg: PGlite, uid: string) => (await pg.query<{ sealed: string; key_id: string; secret_version: number }>(
  `select sealed, key_id, secret_version from public.account_key_copies where user_id = $1`, [uid])).rows;
const events = async (pg: PGlite, uid: string) => (await pg.query<{ what: string; why: string | null }>(
  `select what, why from public.key_copy_events where user_id = $1 order by id`, [uid])).rows.map((r) => r.why ? `${r.what}:${r.why}` : r.what);

Deno.test("a new account stores a copy, and a second device gets the key by signing in", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  assertEquals((await state(pg, a.id)).copy, false);
  assertEquals((await state(pg, a.id)).protection, null);

  assertEquals((await store(w, a)).body, { stored: true });
  const s = await state(pg, a.id);
  assertEquals([s.copy, s.protection, s.generation, s.key.key_id], [true, "standard", 0, a.keyId]);

  const got = await fetchKey(w, a.id);
  assertEquals(got.status, 200);
  assertEquals([got.body.key_id, got.body.generation], [a.keyId, 0]);
  const k = await openTransport(got.body.sealed, got.pair.privateKey, "down", a.id, a.keyId);
  assertEquals(hex(k.dataKey), hex(a.key.dataKey));
  assertEquals(hex(k.recovery), hex(a.key.recovery));
  // Every device hears of it, the person gets an email, and it's written down.
  assertEquals((await pg.query(`select kind from public.account_notices where user_id = $1`, [a.id])).rows, [{ kind: "key_fetched" }]);
  assertEquals(w.mailed, [a.id]);
  assertEquals(await events(pg, a.id), ["stored", "fetched"]);
});

Deno.test("switched off, or with no secret, nothing is stored and nothing is handed out", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  assertEquals((await store(world(pg), a)).status, 200);
  const offs: Record<string, string>[] = [{}, { KEY_COPY: "on" }, { KEY_COPY_SECRET_1: SECRET_1 }, { KEY_COPY: "off", KEY_COPY_SECRET_1: SECRET_1 }];
  for (const vars of offs) {
    const w = world(pg, vars);
    assertEquals((await call(w, a.id)).body.hint, "off");
    assertEquals((await fetchKey(w, a.id)).status, 503);
    assertEquals((await call(w, a.id, { op: "store", ticket: "x", box: "x", choose: true })).status, 503);
  }
  assertEquals(await events(pg, a.id), ["stored"]);
});

Deno.test("no session, or another account's session, gets nothing of this account's", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg), b = await account(pg);
  await store(w, a);
  assertEquals((await call(w, null)).status, 401);
  assertEquals((await call(w, null, { op: "fetch", pub: "x" })).status, 401);
  const bad = await handle(new Request("http://x/key", { method: "POST", headers: { authorization: "Bearer nope" }, body: "{}" }), w.deps);
  assertEquals(bad.status, 401);
  // B is signed in as B: there is no way to name A. B has a key and no copy.
  const asB = await fetchKey(w, b.id);
  assertEquals([asB.status, asB.body.hint], [404, "no_copy"]);
  // An account with no key at all.
  const c = await newUser(pg);
  assertEquals((await fetchKey(w, c)).body.hint, "no_key");
  assertEquals((await store(w, { id: c, key: a.key, keyId: a.keyId })).body.hint, "no_key");
  // Someone who can write the database moves A's row to B: it doesn't open as B's.
  await pg.query(`insert into public.account_key_copies (user_id, key_id, sealed, secret_version)
    select $2, $3, sealed, secret_version from public.account_key_copies where user_id = $1`, [a.id, b.id, b.keyId]);
  const moved = await fetchKey(w, b.id);
  assertEquals([moved.status, moved.body.hint], [503, "unreadable"]);
  assert(!("sealed" in moved.body));
  // B's own key stored over A's account: refused, A's copy is as it was.
  const before = await copies(pg, a.id);
  const wrong = await store(w, a, { key: b.key });
  assertEquals([wrong.status, wrong.body.hint], [400, "wrong_key"]);
  // The right data key with a recovery key that isn't the account's: refused too.
  assertEquals((await store(w, a, { key: { dataKey: a.key.dataKey, recovery: b.key.recovery } })).body.hint, "wrong_key");
  assertEquals(await copies(pg, a.id), before);
  assertEquals(w.mailed, []);
});

Deno.test("a replayed request returns a box only the device that asked can open", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  await store(w, a);
  const first = await fetchKey(w, a.id);
  // The same request again, as someone who recorded it would send it.
  const again = await call(w, a.id, { op: "fetch", pub: first.pub, platform: "macos" });
  assertEquals(again.status, 200);
  assertNotEquals(again.body.sealed, first.body.sealed);
  const thief = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  await assertRejects(() => openTransport(again.body.sealed, thief.privateKey, "down", a.id, a.keyId), OpenError);
  assertEquals(hex((await openTransport(again.body.sealed, first.pair.privateKey, "down", a.id, a.keyId)).dataKey), hex(a.key.dataKey));
  // Not a public key, or none: nothing.
  for (const pub of ["", "AAAA", toBase64(new Uint8Array(65))]) assertEquals((await call(w, a.id, { op: "fetch", pub })).status, 400);
  assertEquals((await call(w, a.id, { op: "other" })).status, 400);
});

Deno.test("a ticket is for one account and five minutes", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg), b = await account(pg);
  const forB = (await call(w, b.id)).body;
  const box = await sealTransport(a.key, fromBase64(forB.pub), "up", a.id);
  assertEquals((await call(w, a.id, { op: "store", ticket: forB.ticket, box, choose: true })).body.hint, "wrong_key");
  const mine = (await call(w, a.id)).body;
  const late = await sealTransport(a.key, fromBase64(mine.pub), "up", a.id);
  w.clock.now += 6 * 60 * 1000;
  assertEquals((await call(w, a.id, { op: "store", ticket: mine.ticket, box: late, choose: true })).body.hint, "wrong_key");
  assertEquals(await copies(pg, a.id), []);
});

Deno.test("the table without the function's secret opens nothing", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  await store(w, a);
  // Everything a dump of the database holds about the key.
  const dump = JSON.stringify([
    (await pg.query(`select * from public.account_key_copies`)).rows, (await pg.query(`select * from public.account_keys`)).rows,
    (await pg.query(`select * from public.account_key_protection`)).rows, (await pg.query(`select * from public.key_copy_events`)).rows]);
  for (const secret of [a.key.dataKey, a.key.recovery]) {
    assert(!dump.includes(toBase64(secret)) && !dump.includes(hex(secret)) && !dump.includes(toBase64(secret).slice(0, 12)));
  }
  assert(!dump.includes(SECRET_1));
  const [row] = await copies(pg, a.id);
  // With every other secret there could be, and with the account's own public facts as the key.
  const guesses = [toBase64(new Uint8Array(32)), SECRET_2, toBase64(new TextEncoder().encode(a.id.padEnd(32, "0")).subarray(0, 32))];
  for (const g of guesses) {
    await assertRejects(() => openAtRest(row.sealed, secrets({ get: (n) => n === "KEY_COPY_SECRET_1" ? g : undefined })!, a.id, a.keyId), OpenError);
  }
  // And with the secret, it does: the secret is the whole difference.
  assertEquals(hex((await openAtRest(row.sealed, secrets(w.deps.env)!, a.id, a.keyId)).key.dataKey), hex(a.key.dataKey));
  // No client role reads the table, the service role included.
  for (const role of ["anon", "authenticated", "service_role"]) {
    await assertRejects(() => pg.transaction(async (tx) => { await tx.exec(`set local role ${role}`); await tx.query(`select 1 from public.account_key_copies`); }));
  }
  assertEquals((await asUser(pg, a.id, `select mode from public.account_key_protection`)).length, 1);
});

Deno.test("keep my key only on my devices: the copy goes at once, and a new device gets nothing", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg), device = crypto.randomUUID();
  await store(w, a);
  // Nothing else can open the notes yet: refused, the copy stays.
  await assertRejects(() => asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [device]), Error, "Save your recovery key first");
  assertEquals((await copies(pg, a.id)).length, 1);
  // This device's own row doesn't count as another device.
  const row = (id: string, seen = "now()") => pg.query(`insert into public.key_devices (user_id, device_id, platform, how, backed_up, key_id, epoch, name_ct, tag, seen_at)
    values ($1, $2, 'ios', 'signin', false, $3, repeat('0', 32), 'amb2.' || $3 || '.AAAA', repeat('0', 64), ${seen})`, [a.id, id, a.keyId]);
  await row(device);
  await assertRejects(() => asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [device]));
  // Nor one not seen for more than 30 days.
  const old = crypto.randomUUID();
  await row(old, "now() - interval '31 days'");
  await assertRejects(() => asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [device]));
  // A saved recovery key is enough.
  await asUser(pg, a.id, `select public.mark_recovery_key_saved()`);
  await asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [device]);
  assertEquals(await copies(pg, a.id), []);
  const s = await state(pg, a.id);
  assertEquals([s.copy, s.protection], [false, "strict"]);
  const got = await fetchKey(w, a.id);
  assertEquals([got.status, got.body.hint], [409, "strict"]);
  // A device that only renews a copy can't bring it back; the person choosing to can.
  assertEquals((await store(w, a, { choose: false })).body.hint, "strict");
  assertEquals(await copies(pg, a.id), []);
  assertEquals((await store(w, a, { choose: true })).body, { stored: true });
  assertEquals((await state(pg, a.id)).protection, "standard");
  assertEquals((await fetchKey(w, a.id)).status, 200);
  assertEquals(await events(pg, a.id), ["stored", "removed", "refused:strict", "refused:strict", "stored", "fetched"]);
});

Deno.test("another device seen lately is enough to go strict, and an account that hasn't chosen stores nothing silently", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  // An account from before: a device that only renews copies stores nothing.
  const silent = await store(w, a, { choose: false });
  assertEquals([silent.status, silent.body.hint], [409, "not_chosen"]);
  assertEquals(await copies(pg, a.id), []);
  await pg.query(`insert into public.key_devices (user_id, device_id, platform, how, backed_up, key_id, epoch, name_ct, tag)
    values ($1, gen_random_uuid(), 'macos', 'made', false, $2, repeat('0', 32), 'amb2.' || $2 || '.AAAA', repeat('0', 64))`, [a.id, a.keyId]);
  await asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [crypto.randomUUID()]);
  assertEquals((await state(pg, a.id)).protection, "strict");
  assertEquals(await events(pg, a.id), ["refused:not_chosen"], "no copy was there to remove");
});

Deno.test("a password reset holds nothing back by default, and holds the key for as long as the server is set to", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  await store(w, a);
  await pg.query(`update auth.users set encrypted_password = 'new' where id = $1`, [a.id]);
  assertEquals((await pg.query(`select 1 from public.account_recoveries where user_id = $1`, [a.id])).rows.length, 1, "the reset was noted");
  // No setting, or one that isn't a number of hours: no hold.
  for (const hours of [undefined, "0", "", "soon", "-3", "9999"]) {
    if (hours === undefined) delete w.env.KEY_COPY_HOLD_HOURS; else w.env.KEY_COPY_HOLD_HOURS = hours;
    assertEquals(holdHours(w.deps.env), 0);
  }
  assertEquals((await fetchKey(w, a.id)).status, 200);
  // Set, without a deploy: the next request is held, until the hours after the reset are over.
  w.env.KEY_COPY_HOLD_HOURS = "72";
  const held = await fetchKey(w, a.id);
  assertEquals([held.status, held.body.hint], [403, "paused_after_reset"]);
  assert(!("sealed" in held.body));
  assert(held.body.error.includes("72 hours"));
  const until = new Date(held.body.until).getTime();
  assert(Math.abs(until - (Date.now() + 72 * 3600 * 1000)) < 60_000, held.body.until);
  assertEquals(w.mailed, [a.id], "only the fetch that went through was mailed");
  // A device that holds the key still stores and renews its copy meanwhile.
  assertEquals((await store(w, a, { choose: false })).status, 200);
  w.env.KEY_COPY_HOLD_HOURS = "1";
  await pg.query(`update public.account_recoveries set at = now() - interval '61 minutes' where user_id = $1`, [a.id]);
  assertEquals((await fetchKey(w, a.id)).status, 200);
  assertEquals(await events(pg, a.id), ["stored", "fetched", "refused:paused", "stored", "fetched"]);
});

Deno.test("Advanced protection waits 72 hours after a password reset, like Start fresh and Delete Account", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  await store(w, a);
  await asUser(pg, a.id, `select public.mark_recovery_key_saved()`);
  await pg.query(`update auth.users set encrypted_password = 'new' where id = $1`, [a.id]);
  // Whoever reset the password can't take the copy away from a person whose device is gone.
  await assertRejects(() => asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [crypto.randomUUID()]), Error, "72 hours after a password reset");
  assertEquals((await copies(pg, a.id)).length, 1);
  assertEquals((await state(pg, a.id)).protection, "standard");
  await pg.query(`update public.account_recoveries set at = now() - interval '73 hours' where user_id = $1`, [a.id]);
  await asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [crypto.randomUUID()]);
  assertEquals(await copies(pg, a.id), []);
});

Deno.test("nothing in a request names another account: only the session does", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg), b = await account(pg), c = await account(pg);
  await store(w, a);
  await store(w, c);
  const aBefore = { copies: await copies(pg, a.id), events: await events(pg, a.id) };
  const pair = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const pub = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
  // A's id (and A's key id) everywhere a request can carry one, sent with another account's session.
  const named = { user_id: a.id, user: a.id, uid: a.id, id: a.id, sub: a.id, account: a.id, account_id: a.id, owner: a.id, key_id: a.keyId,
    target: a.id, as: a.id, claims: { sub: a.id }, user_metadata: { id: a.id } };
  const headers = (who: string) => ({ authorization: `Bearer token:${who}`, "x-user-id": a.id, "x-supabase-user": a.id, "x-forwarded-user": a.id,
    "x-account": a.id, cookie: `sb-user=${a.id}; sub=${a.id}`, "content-type": "application/json" });
  const url = `http://x/key/${a.id}?user_id=${a.id}&uid=${a.id}&sub=${a.id}&account=${a.id}#${a.id}`;
  const ask = async (who: string, body: Record<string, unknown>) => {
    const res = await handle(new Request(url, { method: "POST", headers: headers(who), body: JSON.stringify({ ...named, ...body }) }), w.deps);
    return { status: res.status, body: await res.json() as Record<string, any> };
  };
  // B has a key and no copy: it gets nothing, and nothing of A's.
  const asB = await ask(b.id, { op: "fetch", pub, platform: "web" });
  assertEquals([asB.status, asB.body.hint], [404, "no_copy"]);
  assert(!("sealed" in asB.body));
  // C has a copy of its own: what comes back is C's key and never A's.
  const asC = await ask(c.id, { op: "fetch", pub, platform: "web" });
  assertEquals([asC.status, asC.body.key_id], [200, c.keyId]);
  await assertRejects(() => openTransport(asC.body.sealed, pair.privateKey, "down", a.id, a.keyId), OpenError);
  const got = await openTransport(asC.body.sealed, pair.privateKey, "down", c.id, c.keyId);
  assertEquals(hex(got.dataKey), hex(c.key.dataKey));
  assertNotEquals(hex(got.dataKey), hex(a.key.dataKey));
  // The ticket request is the caller's too, whatever the address says.
  const hello = await handle(new Request(url, { headers: headers(b.id) }), w.deps);
  const ticket = await hello.json();
  // Storing over A as B: A's own key sealed for A, sent with B's session and B's ticket, is refused as not B's key.
  const box = await sealTransport(a.key, fromBase64(ticket.pub), "up", a.id);
  const wrong = await ask(b.id, { op: "store", ticket: ticket.ticket, box, choose: true });
  assertEquals([wrong.status, wrong.body.hint], [400, "wrong_key"]);
  // No session at all, with A named everywhere: nothing.
  const none = await handle(new Request(url, { method: "POST", headers: { ...headers(a.id), authorization: "" }, body: JSON.stringify({ ...named, op: "fetch", pub }) }), w.deps);
  assertEquals(none.status, 401);
  assert(!("sealed" in await none.json()));
  // A never heard of any of it: its copy, its log, its notices and its mail are as they were.
  assertEquals({ copies: await copies(pg, a.id), events: await events(pg, a.id) }, aBefore);
  assertEquals((await pg.query(`select 1 from public.account_notices where user_id = $1`, [a.id])).rows, []);
  assertEquals(w.mailed, [c.id]);
  assertEquals(await events(pg, b.id), ["refused:no_copy", "refused:wrong_key"]);
});

Deno.test("no row of the log of what happened and no log line ever holds key bytes", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg), b = await account(pg);
  const lines: string[] = [];
  const real = console.log;
  console.log = (...args: unknown[]) => { lines.push(args.map(String).join(" ")); };
  let sealedDown = "", ticket = "", box = "";
  try {
    // Everything the function does with a key: store, renew, fetch, a wrong key, a bad request,
    // strict, a missing secret, too many tries, no session, and an exception.
    const hello = (await call(w, a.id)).body;
    ticket = hello.ticket;
    box = await sealTransport(a.key, fromBase64(hello.pub), "up", a.id);
    assertEquals((await call(w, a.id, { op: "store", ticket, box, choose: true, platform: "ios" })).status, 200);
    assertEquals((await store(w, a, { choose: false })).status, 200);
    const got = await fetchKey(w, a.id);
    sealedDown = got.body.sealed;
    assertEquals((await store(w, a, { key: b.key })).body.hint, "wrong_key");
    assertEquals((await call(w, a.id, { op: "fetch", pub: toBase64(a.key.dataKey) })).status, 400);
    assertEquals((await call(w, a.id, { op: toBase64(a.key.dataKey), platform: toBase64(a.key.recovery) })).status, 400);
    assertEquals((await call(w, null, { op: "fetch" })).status, 401);
    await asUser(pg, a.id, `select public.mark_recovery_key_saved()`);
    await asUser(pg, a.id, `select public.keep_key_on_devices($1)`, [crypto.randomUUID()]);
    assertEquals((await fetchKey(w, a.id)).body.hint, "strict");
    assertEquals((await store(w, a)).status, 200);
    const lost = world(pg, { KEY_COPY: "on", KEY_COPY_SECRET_2: SECRET_2 });
    assertEquals((await fetchKey(lost, a.id)).body.hint, "unreadable");
    for (let i = 0; i < LIMITS.fetchPerHour + 1; i++) await fetchKey(w, a.id);
    const broken: Deps = { ...w.deps, addressHash: crypto.randomUUID(), sql: (() => { throw new Error(`failed on ${toBase64(a.key.dataKey)}`); }) as never };
    assertEquals((await handle(new Request("http://x/key", { headers: { authorization: `Bearer token:${a.id}` } }), broken)).status, 500);
  } finally {
    console.log = real;
  }
  const rows = (await pg.query(`select * from public.key_copy_events`)).rows;
  const notices = (await pg.query(`select * from public.account_notices`)).rows;
  assert(rows.length >= 8 && lines.length >= 10, `${rows.length} rows, ${lines.length} lines`);
  assert(new Set(rows.map((r: any) => r.what)).size >= 3 && rows.some((r: any) => r.why === "wrong_key") && rows.some((r: any) => r.why === "rate"));
  // The key as base64 (with and without padding, and the URL kind), as hex, and any 12 characters
  // from the start of any of them; and the boxes it travelled and rests in.
  const forms = (bytes: Uint8Array) => {
    const b64 = toBase64(bytes), bare = b64.replace(/=+$/, ""), urlKind = bare.replace(/\+/g, "-").replace(/\//g, "_");
    return [b64, bare, urlKind, hex(bytes), b64.slice(0, 12), urlKind.slice(0, 12), hex(bytes).slice(0, 12)];
  };
  const joined = new Uint8Array(48);
  joined.set(a.key.dataKey);
  joined.set(a.key.recovery, 32);
  const secret = [...forms(a.key.dataKey), ...forms(a.key.recovery), ...forms(joined), ...forms(b.key.dataKey), ...forms(fromBase64(SECRET_1)),
    SECRET_1, ticket, box, sealedDown, sealedDown.slice(6, 30), (await copies(pg, a.id))[0].sealed];
  for (const [what, text] of [...rows.map((r) => ["row", JSON.stringify(r)]), ...notices.map((r) => ["notice", JSON.stringify(r)]), ...lines.map((l) => ["line", l])]) {
    for (const s of secret) assert(s.length >= 12 && !text.includes(s), `a ${what} holds key bytes: ${text.slice(0, 80)}`);
    // A log line is a few known words: nothing in it is long enough to be a key.
    if (what === "line") {
      const fields = JSON.parse(text);
      assertEquals(Object.keys(fields).filter((k) => !["event", "status", "kind", "where", "code"].includes(k)), []);
      for (const v of Object.values(fields)) assert(String(v).length <= 24, text);
    }
  }
});

Deno.test("too many tries wait: per account by the hour and the day, and per address by the minute", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  await store(w, a);
  for (let i = 0; i < LIMITS.fetchPerHour; i++) assertEquals((await fetchKey(w, a.id)).status, 200);
  const over = await fetchKey(w, a.id);
  assertEquals([over.status, over.body.hint], [429, "rate"]);
  // An hour later the hour's count is fresh; the day's still counts.
  await pg.query(`update public.key_copy_events set at = at - interval '2 hours' where user_id = $1`, [a.id]);
  assertEquals((await fetchKey(w, a.id)).status, 200);
  await pg.query(`insert into public.key_copy_events (user_id, what, at) select $1, 'fetched', now() - interval '3 hours' from generate_series(1, $2::int)`,
    [a.id, LIMITS.fetchPerDay]);
  assertEquals((await fetchKey(w, a.id)).status, 429);
  // One address, many accounts.
  const b = await account(pg), here = world(pg);
  for (let i = 0; i < LIMITS.perAddressPerMinute; i++) assertEquals((await call(here, b.id)).status, 200);
  assertEquals((await call(here, b.id)).status, 429);
  assertEquals((await call(world(pg), b.id)).status, 200, "another address isn't held up");
});

Deno.test("Start fresh takes the copy with the key, and the account stays the kind it chose", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg);
  await store(w, a);
  const fresh = await pg.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`,
      [JSON.stringify({ sub: a.id, role: "authenticated", amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }] })]);
    await tx.exec(`set local role authenticated`);
    return (await tx.query<{ start_fresh: boolean }>(`select public.start_fresh($1)`, [a.keyId])).rows[0].start_fresh;
  });
  assertEquals(fresh, true);
  assertEquals(await copies(pg, a.id), []);
  const s = await state(pg, a.id);
  assertEquals([s.key, s.copy, s.protection, s.generation], [null, false, "standard", 1]);
  assertEquals((await fetchKey(w, a.id)).body.hint, "no_key");
  // The old key can't come back as the copy of the new one.
  const next = { dataKey: newDataKey(), recovery: crypto.getRandomValues(new Uint8Array(16)) };
  const nextId = await keyIdOf(next.dataKey);
  await asUser(pg, a.id, `select * from public.create_account_key($1, $2, $3, 1)`,
    [nextId, await verifierOf(next.dataKey, a.id), await wrap(next.dataKey, await recoveryKEK(next.recovery, a.id), "recovery", a.id)]);
  assertEquals((await store(w, a, { choose: false })).body.hint, "wrong_key");
  // A standard account's next device renews the copy without asking anyone.
  assertEquals((await store(w, { id: a.id, key: next, keyId: nextId }, { choose: false })).body, { stored: true });
  const got = await fetchKey(w, a.id);
  assertEquals([got.status, got.body.generation, got.body.key_id], [200, 1, nextId]);
});

Deno.test("a new secret: old copies still open, are sealed again as they're used, and the rest in one sweep", async () => {
  const pg = await schemaDB();
  const w = world(pg), a = await account(pg), b = await account(pg);
  await store(w, a);
  await store(w, b);
  w.env.KEY_COPY_SECRET_2 = SECRET_2;
  assertEquals((await fetchKey(w, a.id)).status, 200);
  assertEquals((await copies(pg, a.id))[0].secret_version, 2);
  assertEquals((await copies(pg, b.id))[0].secret_version, 1);
  assertEquals(await resealAll(w.deps.sql, w.deps.env), { resealed: 1, unreadable: 0 });
  assertEquals((await copies(pg, b.id))[0].secret_version, 2);
  // The old secret is deleted: everything still opens.
  delete w.env.KEY_COPY_SECRET_1;
  const got = await fetchKey(w, b.id);
  assertEquals(hex((await openTransport(got.body.sealed, got.pair.privateKey, "down", b.id, b.keyId)).dataKey), hex(b.key.dataKey));
  // A secret that's gone by mistake costs nobody their copy: the row stays, the device is told to wait.
  delete w.env.KEY_COPY_SECRET_2;
  w.env.KEY_COPY_SECRET_3 = toBase64(crypto.getRandomValues(new Uint8Array(32)));
  const lost = await fetchKey(w, a.id);
  assertEquals([lost.status, lost.body.hint], [503, "unreadable"]);
  assertEquals((await copies(pg, a.id)).length, 1);
  assertEquals(await resealAll(w.deps.sql, w.deps.env), { resealed: 0, unreadable: 2 });
});

Deno.test("a build from before this reads the same key state it always did", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const s = await state(pg, a.id);
  assertEquals(Object.keys(s.key).sort(), ["key_id", "recovery_saved_at", "recovery_wrap", "verifier"]);
  assertEquals(s.generation, 0);
  // The log of what happened to the copy is kept for 12 months.
  await store(world(pg), a);
  await pg.query(`insert into public.key_copy_events (user_id, what, at) values ($1, 'fetched', now() - interval '13 months')`, [a.id]);
  await pg.query(`select public.pane_forget_key_copy_events()`);
  assertEquals(await events(pg, a.id), ["stored"]);
  // Deleting the account takes everything of the copy with it.
  await pg.query(`delete from auth.users where id = $1`, [a.id]);
  for (const t of ["account_key_copies", "account_key_protection", "key_copy_events"]) {
    assertEquals((await pg.query(`select 1 from public.${t}`)).rows, [], t);
  }
});
