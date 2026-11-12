// AI use after connecting (ai_use.ts, migration 20261107170000_ai_use_daily.sql), through the request
// handler with real connections. By default on an in-process Postgres (PGlite). With AI_USE_PG_URL
// pointing at the LOCAL stack's Postgres, the same tests run in a throwaway database made there and
// dropped at the end (never production: anything but 127.0.0.1 or localhost is refused):
//   cd supabase/functions/mcp && deno test -A ai_use.pglite.test.ts
//   AI_USE_PG_URL=postgresql://postgres:postgres@127.0.0.1:56422/postgres deno test -A ai_use.pglite.test.ts
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import postgres from "npm:postgres@3.4.5";
import type { Sql } from "npm:postgres@3.4.5";
import { type Bytes, keyIdOf, newDataKey, recoveryKEK, tokenKey, Vault, verifierOf, wrap } from "../_shared/e2ee.ts";
import { schemaDB, sqlFor, stubs } from "./pglite.ts";
import { previewOf, titleOf } from "./notes.ts";
import { itemOf, TOOL_CATEGORY } from "./ai_use.ts";
import { tools as classicTools } from "./tools.ts";
import { FILE_TOOLS } from "./files_tools.ts";

Deno.env.delete("AMBER_MCP_TOOLS");
const SUPA = "https://proj.supabase.co";
Deno.env.set("SUPABASE_URL", SUPA);
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
const { handleRequest } = await import("./server.ts");

const PG_URL = Deno.env.get("AI_USE_PG_URL");
if (PG_URL && !/@(127\.0\.0\.1|localhost):/.test(PG_URL)) throw new Error("AI_USE_PG_URL must be the local stack (127.0.0.1)");

/** A database with every migration: PGlite, or a fresh one inside the local stack's Postgres. */
async function database(): Promise<{ sql: Sql; done: () => Promise<void> }> {
  if (!PG_URL) {
    const pg = await schemaDB();
    return { sql: sqlFor(pg), done: async () => await pg.close() };
  }
  const name = `ai_use_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const root = postgres(PG_URL, { max: 1, onnotice: () => {} });
  await root.unsafe(`create database ${name}`);
  const sql = postgres(PG_URL.replace(/\/[^/?]*(\?|$)/, `/${name}$1`), { max: 2, onnotice: () => {}, prepare: false });
  const done = async () => {
    await sql.end();
    await root.unsafe(`drop database if exists ${name} with (force)`);
    await root.end();
  };
  try {
    await sql.unsafe(stubs.replace(/create role (\w+);/g, (_, r) => `do $$ begin create role ${r}; exception when duplicate_object then null; end $$;`));
    const dir = new URL("../../migrations/", import.meta.url);
    for (const f of [...Deno.readDirSync(dir)].map((f) => f.name).filter((n) => n.endsWith(".sql")).sort()) {
      await sql.unsafe((await Deno.readTextFile(new URL(f, dir))).replaceAll("name = 'pg_cron'", "name = 'pg_cron' and false"));
    }
  } catch (e) {
    await done();
    throw e;
  }
  return { sql, done };
}

const APP_HEADERS = JSON.stringify({ "x-pane-device": "Mac", "x-amber-client": "lock-aware/1 e2ee/1" });
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

/** As the signed-in person, through the app (PostgREST's claims and role). */
// deno-lint-ignore no-explicit-any
async function asUser(sql: Sql, id: string, body: (tx: any) => Promise<any>) {
  // deno-lint-ignore no-explicit-any
  return await sql.begin(async (tx: any) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: id, role: "authenticated" })}, true)`;
    await tx`select set_config('request.headers', ${APP_HEADERS}, true)`;
    await tx.unsafe(`set local role authenticated`);
    return await body(tx);
  });
}

type Person = { id: string; dk: Bytes };

async function person(sql: Sql): Promise<Person> {
  const id = crypto.randomUUID();
  await sql`insert into auth.users (id, email) values (${id}, ${`${id}@pane.local`})`;
  const dk = newDataKey();
  const keyId = await keyIdOf(dk);
  const verifier = await verifierOf(dk, id);
  const recovery = await wrap(dk, await recoveryKEK(crypto.getRandomValues(new Uint8Array(16)), id), "recovery", id);
  await asUser(sql, id, (tx) => tx`select * from public.create_account_key(${keyId}, ${verifier}, ${recovery}, 0)`);
  return { id, dk };
}

/** A connection as the app's Connect an AI makes one for Claude Code or Codex. */
async function connect(sql: Sql, p: Person, name: string): Promise<string> {
  const token = `pane_${hex(32)}`;
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const dkWrap = await wrap(p.dk, await tokenKey(token, "pane"), "pane", p.id);
  await asUser(sql, p.id, (tx) => tx`select public.create_mcp_token(${name}, true, ${hash}, ${dkWrap})`);
  return token;
}

async function note(sql: Sql, p: Person, body: string) {
  const id = crypto.randomUUID();
  const vault = await Vault.from(p.dk.slice(), p.id);
  const bodyCt = await vault.sealBody(id, body);
  const headCt = await vault.sealHead(id, { title: titleOf(body), preview: previewOf(body) });
  await asUser(sql, p.id, (tx) => tx`insert into public.notes (id, body_ct, head_ct) values (${id}, ${bodyCt}, ${headCt})`);
}

/** Posts JSON-RPC (one message or a batch) as a client does, with `auth` as its header. */
// deno-lint-ignore no-explicit-any
async function post(sql: Sql, auth: string | null, body: unknown): Promise<{ status: number; json: any }> {
  const res = await handleRequest(new Request(`${SUPA}/functions/v1/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", "mcp-session-id": "s-1", ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  }), sql);
  return { status: res.status, json: res.status === 202 ? null : await res.json() };
}

let nextId = 1;
const call = (name: string, args: Record<string, unknown> = {}) => ({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } });

type Row = { user_id: string; ai: string; category: string; outcome: string; count: number; today: boolean };
const rows = async (sql: Sql, user?: string): Promise<Omit<Row, "user_id" | "today">[]> =>
  (await sql<Row[]>`select user_id, ai, category, outcome, count, day = (now() at time zone 'utc')::date as today
                     from public.ai_use_daily order by category, outcome`)
    .filter((r) => !user || r.user_id === user)
    .map((r) => { assert(r.today, "counted under today's UTC day"); return { ai: r.ai, category: r.category, outcome: r.outcome, count: Number(r.count) }; });

Deno.test("every tool either tool set serves has a category of its own, chosen on purpose", () => {
  const served = new Set([...FILE_TOOLS, ...classicTools].map((t) => t.name));
  assertEquals([...served].filter((n) => !(n in TOOL_CATEGORY)), [], "a tool without a category");
  assertEquals(Object.keys(TOOL_CATEGORY).filter((n) => !served.has(n)), [], "a category for a tool that isn't served");
  const used = new Set(Object.values(TOOL_CATEGORY));
  for (const c of ["read", "search", "edit", "create", "delete_move", "other"]) assert(used.has(c as never), c);
});

Deno.test("a tool call that works is counted for the connection's account, today, by the kind of AI and tool", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql);
    await note(sql, a, "Groceries\n\n- [ ] Milk");
    const token = await connect(sql, a, "Claude Code");
    const one = await post(sql, `Bearer ${token}`, call("fetch", { id: "Groceries.md" }));
    assertEquals(one.status, 200);
    assertEquals(one.json.result.isError, undefined, JSON.stringify(one.json));
    // A batch: each call counts.
    const two = await post(sql, `Bearer ${token}`, [call("search", { query: "milk" }), call("search", { query: "eggs" }), call("list")]);
    assertEquals(two.json.length, 3);
    assertEquals(await rows(sql, a.id), [
      { ai: "claude", category: "read", outcome: "ok", count: 2 },
      { ai: "claude", category: "search", outcome: "ok", count: 2 },
    ]);
    // Codex's token is ChatGPT's kind; anything the app didn't name is "other".
    await post(sql, `Bearer ${await connect(sql, a, "Codex")}`, call("list"));
    await post(sql, `Bearer ${await connect(sql, a, "My script")}`, call("list"));
    const kinds = (await sql<{ ai: string }[]>`select distinct ai from public.ai_use_daily order by ai`).map((r) => r.ai);
    assertEquals(kinds, ["chatgpt", "claude", "other"]);
    // Nothing but the counts: no names, paths or text.
    const kept = JSON.stringify(await sql`select * from public.ai_use_daily`);
    for (const s of ["Groceries", "milk", "Claude Code", "My script", token]) assert(!kept.includes(s), s);
  } finally {
    await done();
  }
});

Deno.test("a tool call that fails is counted as failed, apart from the ones that worked", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql);
    const token = await connect(sql, a, "Claude Code");
    const r = await post(sql, `Bearer ${token}`, call("edit", { path: "Nowhere.md", old_string: "a", new_string: "b" }));
    assertEquals(r.json.result.isError, true);
    await post(sql, `Bearer ${token}`, call("write", { path: "New.md", content: "New\n\nhello" }));
    assertEquals(await rows(sql, a.id), [
      { ai: "claude", category: "edit", outcome: "failed", count: 1 },
      { ai: "claude", category: "edit", outcome: "ok", count: 1 },
    ]);
    // Not a tool call (initialize, tools/list), or a tool that isn't served: nothing.
    await post(sql, `Bearer ${token}`, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    await post(sql, `Bearer ${token}`, call("no_such_tool"));
    assertEquals((await rows(sql, a.id)).length, 2);
  } finally {
    await done();
  }
});

Deno.test("nothing is counted for a request that isn't signed in, or with a token that isn't one", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql);
    const token = await connect(sql, a, "Claude Code");
    assertEquals((await post(sql, null, call("list"))).status, 401);
    assertEquals((await post(sql, `Bearer pane_${"0".repeat(64)}`, call("list"))).status, 401);
    assertEquals((await post(sql, `Bearer amb_at_${"0".repeat(64)}`, call("list"))).status, 401);
    // A disconnected connection counts nothing either.
    await asUser(sql, a.id, (tx) => tx`update public.mcp_tokens set revoked_at = now()`);
    assertEquals((await post(sql, `Bearer ${token}`, call("list"))).status, 401);
    assertEquals(await rows(sql), []);
  } finally {
    await done();
  }
});

Deno.test("a request counts only for the account that owns its connection; nobody else can add to or read the counts", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql), b = await person(sql);
    const aToken = await connect(sql, a, "Claude Code");
    const bToken = await connect(sql, b, "Codex");
    await post(sql, `Bearer ${bToken}`, call("list"));
    await post(sql, `Bearer ${bToken}`, call("list"));
    await post(sql, `Bearer ${aToken}`, call("search", { query: "x" }));
    assertEquals(await rows(sql, a.id), [{ ai: "claude", category: "search", outcome: "ok", count: 1 }]);
    assertEquals(await rows(sql, b.id), [{ ai: "chatgpt", category: "read", outcome: "ok", count: 2 }]);
    // The app's roles can't read the counts, add to them, or count for a connection of another account.
    const [bGrant] = await sql<{ id: string }[]>`select id from public.mcp_tokens where user_id = ${b.id}`;
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`select * from public.ai_use_daily`));
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`select * from public.ai_use_active_daily`));
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`select public.count_ai_use(${bGrant.id}::uuid, 'edit', false, 1)`));
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`insert into public.ai_use_daily (user_id, day, ai, category, outcome, count) values (${a.id}, current_date, 'claude', 'edit', 'ok', 1)`));
    assertEquals((await rows(sql)).reduce((n, r) => n + r.count, 0), 3);
  } finally {
    await done();
  }
});

Deno.test("a sign-in's kind is where its approval went; rows go with the account and after 365 days", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql);
    const kinds: Record<string, string> = {
      "claude.ai": "claude", "claude.com": "claude", "chatgpt.com": "chatgpt", "chat.openai.com": "chatgpt",
      "platform.openai.com": "chatgpt", "grok.com": "grok", "oauth-redirect.googleusercontent.com": "gemini",
      "127.0.0.1": "local", "localhost": "local", "glama.ai": "other", "grok.com.example.net": "other", "claude.ai.example.net": "other",
    };
    for (const [host, ai] of Object.entries(kinds)) {
      // The name a client gives itself never decides: every one here calls itself Claude.
      const [g] = await sql<{ id: string }[]>`insert into public.mcp_tokens (user_id, name, token_hash, kind, redirect_host)
        values (${a.id}, 'Claude', ${"oauth:" + crypto.randomUUID()}, 'oauth', ${host}) returning id`;
      await sql`select public.count_ai_use(${g.id}::uuid, 'read', false, 1)`;
      const [r] = await sql<{ ai: string }[]>`select ai from public.ai_use_daily where user_id = ${a.id} order by count desc, ai limit 1`;
      assert(r, host);
      assertEquals((await sql<{ ai: string }[]>`select public.ai_use_kind('oauth', 'Claude', ${host}) as ai`)[0].ai, ai, host);
    }
    // Kept 365 days.
    await sql`insert into public.ai_use_daily (user_id, day, ai, category, outcome, count) values
      (${a.id}, (now() at time zone 'utc')::date - 366, 'claude', 'edit', 'ok', 5),
      (${a.id}, (now() at time zone 'utc')::date - 364, 'claude', 'edit', 'ok', 5)`;
    await sql`select public.ai_use_forget()`;
    const days = (await sql<{ age: number }[]>`select ((now() at time zone 'utc')::date - day) as age from public.ai_use_daily where category = 'edit'`).map((r) => Number(r.age));
    assertEquals(days, [364]);
    // The daily active view: one account, counted once under each kind it used.
    const active = await sql<{ ai: string; accounts: number }[]>`select ai, accounts from public.ai_use_active_daily where day = (now() at time zone 'utc')::date order by ai`;
    assertEquals(active.map((r) => [r.ai, Number(r.accounts)]), [["chatgpt", 1], ["claude", 1], ["gemini", 1], ["grok", 1], ["local", 1], ["other", 1]]);
    // Deleting the account deletes its counts.
    await sql`delete from auth.users where id = ${a.id}`;
    assertEquals(await rows(sql), []);
  } finally {
    await done();
  }
});

type Minute = { ai: string; category: string; item: string; outcome: string; count: number };
const minutes = async (sql: Sql, user: string): Promise<Minute[]> =>
  (await sql<(Minute & { recent: boolean })[]>`select ai, category, item, outcome, count, minute > now() - interval '2 minutes' as recent
     from public.ai_use_minutes where user_id = ${user} order by category, item, outcome`)
    .map((r) => { assert(r.recent, "counted under this minute"); return { ai: r.ai, category: r.category, item: r.item, outcome: r.outcome, count: Number(r.count) }; });

Deno.test("what a call works on is told by the tool and the shape of its path only", () => {
  assertEquals(itemOf("create", { path: "Work/Acme.md", content: "x" }), "note");
  assertEquals(itemOf("create", { path: "Work/Clients/" }), "folder");
  assertEquals(itemOf("create", { type: "folder", path: "Work" }), "folder");
  assertEquals(itemOf("create", { type: "app", path: "Habits.md" }), "app");
  assertEquals(itemOf("fetch", { id: "Work/Acme.md" }), "note");
  assertEquals(itemOf("fetch", { id: "Work/Acme" }), "note");
  assertEquals(itemOf("write", { path: "To read/Paper.pdf" }), "file");
  assertEquals(itemOf("edit", { path: "Work/Habits.app/src/App.tsx" }), "app");
  assertEquals(itemOf("delete", { path: "Archive/" }), "folder");
  assertEquals(itemOf("search", { query: "milk" }), "none");
  assertEquals(itemOf("list", {}), "none");
  assertEquals(itemOf("create_folder", {}), "folder");
  assertEquals(itemOf("create_note", {}), "note");
  const served = new Set([...FILE_TOOLS, ...classicTools].map((t) => t.name));
  for (const t of served) assert(["note", "folder", "app", "file", "none"].includes(itemOf(t, {})), t);
});

Deno.test("each call is also kept by the minute, with what it made; the connection knows its first and last call", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql);
    await note(sql, a, "Groceries\n\n- [ ] Milk");
    const token = await connect(sql, a, "Claude Code");
    const stamps = async () => (await sql<{ first_tool_at: Date | null; last_tool_at: Date | null; last_used_at: Date | null }[]>`
      select first_tool_at, last_tool_at, last_used_at from public.mcp_tokens where user_id = ${a.id}`)[0];
    // Loading the tools is not use: last_used_at moves, the tool stamps don't.
    await post(sql, `Bearer ${token}`, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    let s = await stamps();
    assert(s.last_used_at);
    assertEquals([s.first_tool_at, s.last_tool_at], [null, null]);
    await post(sql, `Bearer ${token}`, [call("search", { query: "milk" }), call("fetch", { id: "Groceries.md" }), call("create", { path: "Plans/Week/" })]);
    s = await stamps();
    assert(s.first_tool_at && s.last_tool_at);
    const first = s.first_tool_at.getTime();
    await post(sql, `Bearer ${token}`, call("create", { path: "Plans/Monday.md", content: "Monday\n\nGym" }));
    s = await stamps();
    assertEquals(s.first_tool_at!.getTime(), first, "the first call stays the first");
    assert(s.last_tool_at!.getTime() >= first);
    assertEquals(await minutes(sql, a.id), [
      { ai: "claude", category: "create", item: "folder", outcome: "ok", count: 1 },
      { ai: "claude", category: "create", item: "note", outcome: "ok", count: 1 },
      { ai: "claude", category: "read", item: "note", outcome: "ok", count: 1 },
      { ai: "claude", category: "search", item: "none", outcome: "ok", count: 1 },
    ]);
    // The day's counts are as before.
    assertEquals(await rows(sql, a.id), [
      { ai: "claude", category: "create", outcome: "ok", count: 2 },
      { ai: "claude", category: "read", outcome: "ok", count: 1 },
      { ai: "claude", category: "search", outcome: "ok", count: 1 },
    ]);
    // The first-use view: connected, then used.
    const [f] = await sql<{ ai: string; first_tool_at: Date | null }[]>`select ai, first_tool_at from public.ai_first_use where user_id = ${a.id}`;
    assertEquals(f.ai, "claude");
    assert(f.first_tool_at);
    // Nothing but kinds and counts: no names, paths or text.
    const kept = JSON.stringify(await sql`select * from public.ai_use_minutes`);
    for (const t of ["Groceries", "milk", "Plans", "Week", "Monday", "Gym", "Claude Code", token]) assert(!kept.includes(t), t);
  } finally {
    await done();
  }
});

Deno.test("every kind of AI is counted by the minute, and nobody but the service role can read or add to it", async () => {
  const { sql, done } = await database();
  try {
    const a = await person(sql);
    const hosts = ["claude.ai", "chatgpt.com", "grok.com", "oauth-redirect.googleusercontent.com", "127.0.0.1", "glama.ai"];
    for (const host of hosts) {
      const [g] = await sql<{ id: string }[]>`insert into public.mcp_tokens (user_id, name, token_hash, kind, redirect_host)
        values (${a.id}, 'Claude', ${"oauth:" + crypto.randomUUID()}, 'oauth', ${host}) returning id`;
      await sql`select public.count_ai_use(${g.id}::uuid, 'read', 'note', false, 1)`;
    }
    const kinds = (await sql<{ ai: string }[]>`select distinct ai from public.ai_use_minutes where user_id = ${a.id} order by ai`).map((r) => r.ai);
    assertEquals(kinds, ["chatgpt", "claude", "gemini", "grok", "local", "other"]);
    const firsts = await sql<{ ai: string }[]>`select ai from public.ai_first_use where user_id = ${a.id} and first_tool_at is not null`;
    assertEquals(firsts.length, hosts.length);
    const [g] = await sql<{ id: string }[]>`select id from public.mcp_tokens where user_id = ${a.id} limit 1`;
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`select * from public.ai_use_minutes`));
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`select * from public.ai_first_use`));
    await assertRejects(() => asUser(sql, a.id, (tx) => tx`select public.count_ai_use(${g.id}::uuid, 'edit', 'note', false, 1)`));
    // Kept 365 days, and gone with the account.
    await sql`insert into public.ai_use_minutes (user_id, minute, ai, category, item, outcome, count) values
      (${a.id}, now() - interval '366 days', 'claude', 'edit', 'note', 'ok', 1)`;
    await sql`select public.ai_use_forget()`;
    assertEquals((await sql`select 1 from public.ai_use_minutes where minute < now() - interval '365 days'`).length, 0);
    await sql`delete from auth.users where id = ${a.id}`;
    assertEquals((await sql`select 1 from public.ai_use_minutes`).length, 0);
  } finally {
    await done();
  }
});
