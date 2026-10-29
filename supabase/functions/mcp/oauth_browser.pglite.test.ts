// Allowing an AI on the web page (/connect/allow), on an in-process Postgres (PGlite) with every
// migration, with Supabase Auth faked. Needs no Docker or local stack:
//   cd supabase/functions/mcp && deno test -A oauth_browser.pglite.test.ts
// For an account whose key the server keeps a copy of, a signed-in page answers the request itself:
// the function opens the copy, makes the code and its wrap as a device would, and keeps only the
// code's hash. Who gets refused: another origin, no session, an old sign-in, Advanced protection,
// an account without a copy, another account, a changed return address, too many in an hour, and
// a server with the switch off. oauth.e2e.test.ts runs the same flow against the real stack.
import { assert, assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import type { Sql } from "npm:postgres@3.4.5";
import { type Bytes, keyIdOf, newDataKey, recoveryKEK, tokenKey, toBase64, unwrap, verifierOf, wrap } from "../_shared/e2ee.ts";
import { sealAtRest, secrets } from "../_shared/keycopy.ts";
import { asUser, newUser as plainUser, schemaDB, sqlFor } from "./pglite.ts";

const SUPA = "https://proj.supabase.co";
const FUNCTION = `${SUPA}/functions/v1/mcp`;
const SITE = "https://pintonotes.com";
const CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";
const SECRET = toBase64(crypto.getRandomValues(new Uint8Array(32)));

Deno.env.set("SUPABASE_URL", SUPA);
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("CONNECT_PAGE_URL", `${SITE}/connect`);
Deno.env.delete("MCP_PUBLIC_URL");
Deno.env.delete("MCP_ALIAS_URLS");
Deno.env.delete("KEY_COPY_SIGNIN_HOURS");
Deno.env.delete("KEY_COPY_HOLD_HOURS");

/// The switches as they are once this ships: the page answers, with the key copy on.
function switchOn() {
  Deno.env.set("CONNECT_IN_BROWSER", "on");
  Deno.env.set("KEY_COPY", "on");
  Deno.env.set("KEY_COPY_SECRET_1", SECRET);
}
function switchOff() {
  for (const n of ["CONNECT_IN_BROWSER", "KEY_COPY", "KEY_COPY_SECRET_1"]) Deno.env.delete(n);
}
/// CI runs this file in one process with oauth.pglite.test.ts, which expects the switches off: each
/// test here turns them on for itself and off again after.
function browserTest(name: string, fn: () => Promise<void>) {
  Deno.test(name, async () => {
    switchOn();
    try { await fn(); } finally { switchOff(); }
  });
}

const { handleOAuth, subpath, sha256Hex, resolveAccessToken, ALLOWS } = await import("./oauth.ts");

// MARK: Fake Supabase Auth: a session is an unsigned JWT whose `sub` is the account and whose
// `amr` says when it signed in. The function asks /auth/v1/user who it is, then reads `amr`.

function session(user: string, signedInSecondsAgo = 30): string {
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const at = Math.floor(Date.now() / 1000) - signedInSecondsAgo;
  return `${enc({ alg: "none" })}.${enc({ sub: user, amr: [{ method: "otp", timestamp: at }, { method: "token_refresh", timestamp: at + 10 }] })}.x`;
}

const realFetch = globalThis.fetch;
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url === `${SUPA}/auth/v1/user`) {
    const token = (new Headers(init?.headers).get("authorization") ?? "").replace(/^Bearer /, "");
    try {
      const sub = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
      return Promise.resolve(Response.json({ id: sub }));
    } catch {
      return Promise.resolve(Response.json({ msg: "invalid JWT" }, { status: 401 }));
    }
  }
  return realFetch(input, init);
};

// MARK: Accounts

type Account = { id: string; dk: Bytes };

/// An account as its first device makes it, and (unless `copy` is false) with the copy of its key
/// the `key` function keeps, sealed under the function's secret.
async function account(pg: PGlite, copy = true): Promise<Account> {
  const id = await plainUser(pg);
  const dk = newDataKey();
  const recovery = crypto.getRandomValues(new Uint8Array(16));
  const keyId = await keyIdOf(dk);
  await asUser(pg, id, `select * from public.create_account_key($1, $2, $3, 0)`,
    [keyId, await verifierOf(dk, id), await wrap(dk, await recoveryKEK(recovery, id), "recovery", id)]);
  if (copy) {
    const at = await sealAtRest({ dataKey: dk.slice(), recovery }, secrets({ get: (n) => Deno.env.get(n) })!, id);
    await pg.query(`insert into public.account_key_copies (user_id, key_id, sealed, secret_version) values ($1, $2, $3, $4)`, [id, at.keyId, at.sealed, at.version]);
    await pg.query(`insert into public.account_key_protection (user_id, mode) values ($1, 'standard')`, [id]);
  }
  return { id, dk };
}

// MARK: Requests

const call = (sql: Sql, req: Request) => handleOAuth(req, sql, subpath(req));

function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkce() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  return { verifier, challenge };
}

/// ChatGPT registers and starts a sign-in; the browser lands on the page with the request's id.
async function start(sql: Sql, scope = "notes:read notes:write") {
  const reg = await call(sql, new Request(`${FUNCTION}/register`, {
    method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" },
    body: JSON.stringify({ client_name: "ChatGPT", redirect_uris: [CHATGPT] }),
  }));
  const clientId = (await reg.json()).client_id as string;
  const { verifier, challenge } = await pkce();
  const q = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: CHATGPT, code_challenge: challenge,
    code_challenge_method: "S256", state: "xyz", scope, resource: FUNCTION });
  const res = await call(sql, new Request(`${FUNCTION}/authorize?${q}`, { headers: { "cf-connecting-ip": "203.0.113.9" } }));
  assertEquals(res.status, 302);
  const page = new URL(res.headers.get("location")!);
  assertEquals(page.origin + page.pathname, `${SITE}/connect`);
  return { clientId, verifier, id: page.searchParams.get("request")! };
}

let ip = 0;
/// A call from the page: its origin, the person's session, a caller address of its own (so the
/// per-address limits stay out of the way unless a test is about them).
function fromPage(path: string, token: string | null, body?: unknown, origin: string | null = SITE, from = `198.51.100.${++ip % 250}`) {
  const headers: Record<string, string> = { "cf-connecting-ip": from };
  if (token) headers.authorization = `Bearer ${token}`;
  if (origin) headers.origin = origin;
  if (body !== undefined) headers["content-type"] = "application/json";
  return new Request(`${FUNCTION}${path}`, { method: body === undefined ? "GET" : "POST", headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function allow(sql: Sql, id: string, token: string | null, extra: Record<string, unknown> = {}, origin: string | null = SITE) {
  const res = await call(sql, fromPage("/connect/allow", token, { id, write: true, redirect_uri: CHATGPT, from: "Safari on a Mac", ...extra }, origin));
  return { status: res.status, body: await res.json() };
}

async function exchange(sql: Sql, clientId: string, code: string, verifier: string) {
  const res = await call(sql, new Request(`${FUNCTION}/token`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "cf-connecting-ip": "203.0.113.9" },
    body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, code, code_verifier: verifier, redirect_uri: CHATGPT }),
  }));
  return { status: res.status, body: await res.json() };
}

async function db() {
  const pg = await schemaDB();
  return { pg, sql: sqlFor(pg) };
}

// MARK: Tests

browserTest("the page says it can answer, before sign-in and for the signed-in account", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { id } = await start(sql);
  const label = await (await call(sql, fromPage(`/connect/label?id=${id}`, null))).json();
  assertEquals(label.allow_here, true);
  // The page that answers itself names ChatGPT, mark and all, from sign-in on: its own callback.
  assertEquals(label.verified_ai, "ChatGPT");
  const described = await (await call(sql, fromPage(`/connect/request?id=${id}`, session(me.id)))).json();
  assertEquals(described.allow_here, true);
  assertEquals(described.allow_here_why, null);
  // Not asked from a device's browser: the callback names the AI, and so its company.
  assertEquals(described.verified_ai, "ChatGPT");
  assertEquals(described.redirect_uri, CHATGPT);
});

browserTest("Allow on the page connects: the code works once, the key reaches the tokens, only hashes are kept", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { clientId, verifier, id } = await start(sql);
  const { status, body } = await allow(sql, id, session(me.id));
  assertEquals(status, 200);
  assertEquals(body.client_name, "ChatGPT");
  assertEquals(body.can_write, true);
  const back = new URL(body.redirect);
  assertEquals(back.origin + back.pathname, CHATGPT);
  assertEquals(back.searchParams.get("state"), "xyz");
  assertEquals(back.searchParams.get("iss"), FUNCTION);
  const code = back.searchParams.get("code")!;
  assert(/^amb_code_[0-9a-f]{64}$/.test(code), code);

  // Only the code's hash is stored, and its wrap opens with the code to the account's key.
  const [r] = (await pg.query<{ code_hash: string; code_wrap: string; decided_at: Date | null }>(
    `select code_hash, code_wrap, decided_at from public.oauth_requests where id = $1`, [id])).rows;
  assertEquals(r.code_hash, await sha256Hex(code));
  assert(r.decided_at);
  assertEquals(await unwrap(r.code_wrap, await tokenKey(code, "code"), "code", me.id), me.dk);
  const dump = JSON.stringify((await pg.query(`select * from public.oauth_requests`)).rows);
  assert(!dump.includes(code), "the code itself is never stored");

  const tokens = await exchange(sql, clientId, code, verifier);
  assertEquals(tokens.status, 200);
  assertEquals(tokens.body.scope, "notes:read notes:write");
  const grant = await resolveAccessToken(sql, tokens.body.access_token, new Request(FUNCTION));
  assertEquals(grant?.user_id, me.id);
  assertEquals(grant?.can_write, true);
  assertEquals(await unwrap(grant!.dk_wrap!, await tokenKey(tokens.body.access_token, "access"), "access", me.id), me.dk);
  // Spent: the wrap went with it, and a second exchange cuts the connection off.
  const [after] = (await pg.query<{ code_wrap: string | null }>(`select code_wrap from public.oauth_requests where id = $1`, [id])).rows;
  assertEquals(after.code_wrap, null);
  assertEquals((await exchange(sql, clientId, code, verifier)).status, 400);

  // Every device hears of it, and the key copy's log says the server opened it to connect.
  const [notice] = (await pg.query<{ kind: string; what: string }>(`select kind, what from public.account_notices where user_id = $1`, [me.id])).rows;
  assertEquals(notice, { kind: "ai_connected", what: "Connected ChatGPT from Safari on a Mac" });
  const events = (await pg.query<{ what: string; platform: string }>(`select what, platform from public.key_copy_events where user_id = $1`, [me.id])).rows;
  assertEquals(events, [{ what: "connected", platform: "web" }]);
});

browserTest("Read only on the page, or a read-only request, connects read-only", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const chosen = await start(sql);
  assertEquals((await allow(sql, chosen.id, session(me.id), { write: false })).body.can_write, false);
  const asked = await start(sql, "notes:read");
  assertEquals((await allow(sql, asked.id, session(me.id), { write: true })).body.can_write, false);
});

browserTest("only the page's own origin, with a session, may allow", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { id } = await start(sql);
  // The apps send no Origin and answer through /connect/decide; any other site is refused.
  assertEquals((await allow(sql, id, session(me.id), {}, null)).status, 403);
  assertEquals((await allow(sql, id, session(me.id), {}, "https://evil.example")).status, 403);
  assertEquals((await allow(sql, id, null)).status, 401);
  assertEquals((await allow(sql, id, "not-a-session")).status, 401);
  // Nothing was decided by any of them.
  assertEquals((await allow(sql, id, session(me.id))).status, 200);
});

browserTest("an old sign-in is asked to sign in again, and nothing is opened", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { id } = await start(sql);
  const old = session(me.id, 2 * 3600);
  const described = await (await call(sql, fromPage(`/connect/request?id=${id}`, old))).json();
  assertEquals([described.allow_here, described.allow_here_why], [false, "reauth"]);
  const refused = await allow(sql, id, old);
  assertEquals([refused.status, refused.body.hint], [403, "reauth"]);
  assertEquals((await pg.query(`select 1 from public.key_copy_events where user_id = $1`, [me.id])).rows.length, 0);
  // Signing in again is enough.
  assertEquals((await allow(sql, id, session(me.id))).status, 200);
});

browserTest("Advanced protection and accounts without a copy are sent to the app, and the request stays open for it", async () => {
  const { pg, sql } = await db();
  const strict = await account(pg, false);
  await pg.query(`insert into public.account_key_protection (user_id, mode) values ($1, 'strict')`, [strict.id]);
  const unchosen = await account(pg, false);
  for (const [who, why] of [[strict, "strict"], [unchosen, "no_copy"]] as const) {
    const { id } = await start(sql);
    const described = await (await call(sql, fromPage(`/connect/request?id=${id}`, session(who.id)))).json();
    assertEquals([described.allow_here, described.allow_here_why], [false, why]);
    const refused = await allow(sql, id, session(who.id));
    assertEquals([refused.status, refused.body.hint], [409, why]);
    // Let go of, undecided: the app (or the recovery key) can still answer it.
    const [r] = (await pg.query<{ claimed_by: string | null; decided_at: Date | null }>(`select claimed_by, decided_at from public.oauth_requests where id = $1`, [id])).rows;
    assertEquals(r, { claimed_by: null, decided_at: null });
  }
  // An account whose devices haven't made a key yet.
  const keyless = await plainUser(pg);
  const { id } = await start(sql);
  assertEquals((await allow(sql, id, session(keyless))).body.hint, "no_key");
});

browserTest("a copy of an old key isn't used", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  // The account's key changed (Start fresh made a new one) and the copy wasn't renewed.
  await pg.query(`update public.account_key_copies set key_id = '0123456789abcdef' where user_id = $1`, [me.id]);
  const { id } = await start(sql);
  assertEquals((await allow(sql, id, session(me.id))).body.hint, "no_copy");
});

browserTest("another account can't answer a request someone opened, and a changed return address is refused", async () => {
  const { pg, sql } = await db();
  const me = await account(pg), other = await account(pg);
  const { id } = await start(sql);
  assertEquals((await call(sql, fromPage(`/connect/request?id=${id}`, session(me.id)))).status, 200);
  const theirs = await allow(sql, id, session(other.id));
  assertEquals([theirs.status, theirs.body.hint], [403, "not_yours"]);
  const changed = await allow(sql, id, session(me.id), { redirect_uri: "https://chatgpt.com/elsewhere" });
  assertEquals([changed.status, changed.body.hint], [409, "changed"]);
  assertEquals((await allow(sql, id, session(me.id))).status, 200);
  // Answered: a second Allow finds nothing open.
  assertEquals((await allow(sql, id, session(me.id))).status, 404);
});

browserTest("a few connections an hour per account, then the app", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  for (let i = 0; i < ALLOWS.perHour; i++) {
    const { id } = await start(sql);
    assertEquals((await allow(sql, id, session(me.id))).status, 200, `connection ${i + 1}`);
  }
  const { id } = await start(sql);
  const refused = await allow(sql, id, session(me.id));
  assertEquals([refused.status, refused.body.hint], [429, "rate"]);
  const [r] = (await pg.query<{ decided_at: Date | null; grant_id: string | null }>(`select decided_at, grant_id from public.oauth_requests where id = $1`, [id])).rows;
  assertEquals(r, { decided_at: null, grant_id: null });
});

browserTest("too many from one address are turned away before the session is looked at", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { id } = await start(sql);
  let last = 0;
  for (let i = 0; i < 31; i++) {
    last = (await call(sql, fromPage("/connect/allow", session(me.id), { id, redirect_uri: "https://chatgpt.com/elsewhere" }, SITE, "192.0.2.7"))).status;
  }
  assertEquals(last, 429);
});

browserTest("with the switch off the page doesn't answer, and says so before sign-in", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { id } = await start(sql);
  for (const off of [() => Deno.env.delete("CONNECT_IN_BROWSER"), () => Deno.env.set("KEY_COPY", "off"), () => Deno.env.delete("KEY_COPY_SECRET_1")]) {
    switchOn();
    off();
    try {
      const off = await (await call(sql, fromPage(`/connect/label?id=${id}`, null))).json();
      assertEquals(off.allow_here, false);
      // The old flow's page: no AI's mark before sign-in.
      assertEquals(off.verified_ai, null);
      const described = await (await call(sql, fromPage(`/connect/request?id=${id}`, session(me.id)))).json();
      assertEquals(described.allow_here_why, "off");
      const refused = await allow(sql, id, session(me.id));
      assertEquals([refused.status, refused.body.hint], [503, "off"]);
    } finally {
      switchOn();
    }
  }
});

browserTest("Don't allow on the page sends the AI an access_denied, as before", async () => {
  const { pg, sql } = await db();
  const me = await account(pg);
  const { id } = await start(sql);
  const res = await call(sql, fromPage("/connect/decide", session(me.id), { id, allow: false, redirect_uri: CHATGPT }));
  assertEquals(res.status, 200);
  const back = new URL((await res.json()).redirect);
  assertEquals(back.searchParams.get("error"), "access_denied");
  assertEquals(back.searchParams.get("code"), null);
  assertNotEquals((await pg.query(`select decided_at from public.oauth_requests where id = $1 and decided_at is not null`, [id])).rows.length, 0);
});
