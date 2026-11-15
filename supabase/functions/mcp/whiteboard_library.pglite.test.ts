// The whiteboard library in the database (20261117120000_whiteboard_library.sql): one row an item,
// sealed with the account's key, readable and writable only by its owner; a removal that stays;
// shapes that never change after they went up; renames that can say which version they read; the
// account's room; and Start fresh taking the library with the old key.
//   cd supabase/functions/mcp && deno test -A whiteboard_library.pglite.test.ts
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { aesKey, open, seal } from "../_shared/e2ee.ts";
import { asUser, schemaDB } from "./pglite.ts";
import { type Account, account, app } from "./sealed.ts";

type Row = { id: string; head_ct: string | null; body_ct: string | null; deleted_at: string | null; version: number; server_updated_at: string };

const headOf = (id: string) => `library-head:${id}`;
const bodyOf = (id: string) => `library:${id}`;
const boxes = async (a: Account, id: string, name: string) => {
  const key = await aesKey(a.dk.slice());
  return {
    head: await seal(JSON.stringify({ name, source: null, place: Date.now(), edited: Date.now() }), key, a.keyId, headOf(id)),
    body: await seal(JSON.stringify({ elements: [{ type: "rectangle", id: "r", x: 0, y: 0, width: 80, height: 40 }], created: Date.now() }), key, a.keyId, bodyOf(id)),
  };
};

/** An item going up as the app sends it: an upsert of its id and both boxes. */
async function send(pg: PGlite, a: Account, id: string, name: string): Promise<Row> {
  const b = await boxes(a, id, name);
  const [r] = await app(pg, a.id, `insert into public.whiteboard_library (id, head_ct, body_ct) values ($1, $2, $3)
    on conflict (id) do update set head_ct = excluded.head_ct, body_ct = excluded.body_ct returning *`, [id, b.head, b.body]);
  return r;
}

const rows = async (pg: PGlite, a: Account) => await app(pg, a.id, `select * from public.whiteboard_library order by server_updated_at`) as Row[];
const one = async (pg: PGlite, a: Account, id: string) => (await app(pg, a.id, `select * from public.whiteboard_library where id = $1`, [id]))[0] as Row | undefined;

Deno.test("an item is its owner's alone: another account and anon see and change nothing", async () => {
  const pg = await schemaDB();
  const a = await account(pg), b = await account(pg);
  const id = crypto.randomUUID();
  await send(pg, a, id, "Server");
  assertEquals((await rows(pg, a)).length, 1);
  assertEquals((await rows(pg, b)).length, 0, "B sees none of A's library");
  const updated = await app(pg, b.id, `update public.whiteboard_library set deleted_at = now() where id = $1 returning id`, [id]);
  assertEquals(updated.length, 0, "B can't remove it");
  await assertRejects(() => send(pg, b, id, "Mine now"), Error, "row-level security", "nor write over it");
  // Nor put an item in B's library, even sealed with B's key.
  const forB = crypto.randomUUID(), theirs = await boxes(b, forB, "Planted");
  await assertRejects(() => app(pg, a.id, `insert into public.whiteboard_library (id, user_id, head_ct, body_ct) values ($1, $2, $3, $4)`, [forB, b.id, theirs.head, theirs.body]),
    Error, "row-level security");
  const asAnon = (sql: string) => pg.transaction(async (tx) => { await tx.exec(`set local role anon`); return (await tx.query(sql)).rows; });
  await assertRejects(() => asAnon(`select * from public.whiteboard_library`), Error, "permission denied");
  const [r] = (await pg.query<Row>(`select * from public.whiteboard_library where id = $1`, [id])).rows;
  assertEquals(r.deleted_at, null);
  const opened = JSON.parse(await open(r.head_ct!, await aesKey(a.dk.slice()), headOf(id)));
  assertEquals(opened.name, "Server", "A's own name, sealed with A's key");
});

Deno.test("only boxes sealed with the account's current key go in; nothing goes in before it has one", async () => {
  const pg = await schemaDB();
  const a = await account(pg), other = await account(pg);
  const id = crypto.randomUUID();
  const theirs = await boxes(other, id, "Theirs");
  await assertRejects(() => app(pg, a.id, `insert into public.whiteboard_library (id, head_ct, body_ct) values ($1, $2, $3)`, [id, theirs.head, theirs.body]), Error, "old key");
  await assertRejects(() => app(pg, a.id, `insert into public.whiteboard_library (id, head_ct, body_ct) values ($1, 'Server', '[]')`, [id]), Error, undefined, "text that isn't a box");
  // Half an item (a name without its shapes) isn't one.
  const mine = await boxes(a, id, "Server");
  await assertRejects(() => app(pg, a.id, `insert into public.whiteboard_library (id, head_ct) values ($1, $2)`, [id, mine.head]), Error, "whiteboard_library_whole");
  // An account whose first device hasn't made a key yet.
  const [{ id: fresh }] = (await pg.query<{ id: string }>(`insert into auth.users (id, email) values (gen_random_uuid(), 'new@pane.local') returning id`)).rows;
  await assertRejects(() => app(pg, fresh, `insert into public.whiteboard_library (id, head_ct, body_ct) values ($1, $2, $3)`, [crypto.randomUUID(), mine.head, mine.body]), Error, "Set up encryption");
});

Deno.test("every write is a new version and stamp; a rename that read an older version changes nothing; the shapes stay", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = crypto.randomUUID();
  const first = await send(pg, a, id, "Server");
  assertEquals(first.version, 1);
  const renamed = await boxes(a, id, "Web server");
  const [r2] = await app(pg, a.id, `update public.whiteboard_library set head_ct = $2 where id = $1 and version = 1 returning *`, [id, renamed.head]);
  assertEquals(r2.version, 2);
  assert(r2.server_updated_at > first.server_updated_at, "stamped again, so the other devices pull it");
  assertEquals(r2.body_ct, first.body_ct);
  // A second device renaming from version 1: nothing changes; it reads the row again and decides.
  const late = await boxes(a, id, "Database");
  assertEquals((await app(pg, a.id, `update public.whiteboard_library set head_ct = $2 where id = $1 and version = 1 returning *`, [id, late.head])).length, 0);
  assertEquals((await one(pg, a, id))!.head_ct, renamed.head);
  // The item going up again (an answer that got lost): the name is the new one, the shapes are the first.
  const again = await send(pg, a, id, "Web server");
  assertEquals([again.version, again.body_ct], [3, first.body_ct], "an item's shapes never change after it went up");
});

Deno.test("removed stays removed: the row stays empty, and a rename or sending it again doesn't bring it back", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = crypto.randomUUID();
  await send(pg, a, id, "Server");
  // As the app removes: an upsert of the id and when.
  await app(pg, a.id, `insert into public.whiteboard_library (id, deleted_at) values ($1, now()) on conflict (id) do update set deleted_at = excluded.deleted_at`, [id]);
  let r = (await one(pg, a, id))!;
  assert(r.deleted_at);
  assertEquals([r.head_ct, r.body_ct, r.version], [null, null, 2], "nothing of it is kept");
  // Renamed on a device that hadn't heard yet: stays removed.
  const renamed = await boxes(a, id, "Web server");
  const [after] = await app(pg, a.id, `update public.whiteboard_library set head_ct = $2 where id = $1 returning *`, [id, renamed.head]);
  assertEquals([after.head_ct, after.body_ct, !!after.deleted_at], [null, null, true]);
  await send(pg, a, id, "Server");
  r = (await one(pg, a, id))!;
  assertEquals([r.head_ct, r.body_ct, !!r.deleted_at], [null, null, true]);
  assertEquals(await app(pg, a.id, `update public.whiteboard_library set deleted_at = null where id = $1 returning deleted_at`, [id]).then((x) => !!x[0].deleted_at), true);
  // Removed before it ever went up: a row that says so.
  const never = crypto.randomUUID();
  await app(pg, a.id, `insert into public.whiteboard_library (id, deleted_at) values ($1, now()) on conflict (id) do update set deleted_at = excluded.deleted_at`, [never]);
  assert((await one(pg, a, never))!.deleted_at);
  // A device can't delete rows (the others would never hear that it went).
  await assertRejects(() => app(pg, a.id, `delete from public.whiteboard_library where id = $1`, [id]), Error, "permission denied");
});

Deno.test("the account's library has room for 200 MB; what's removed takes none", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const first = crypto.randomUUID();
  const sent = await send(pg, a, first, "Server");
  const size = sent.head_ct!.length + sent.body_ct!.length;
  // A smaller room, as the test can afford: two items' worth.
  await pg.exec(`create or replace function public.pane_library_cap() returns bigint language sql immutable set search_path = '' as $$ select ${size * 2 + 50}::bigint $$`);
  await send(pg, a, crypto.randomUUID(), "Database");
  await assertRejects(() => send(pg, a, crypto.randomUUID(), "Cache"), Error, "library is full");
  await app(pg, a.id, `update public.whiteboard_library set deleted_at = now() where id = $1`, [first]);
  await send(pg, a, crypto.randomUUID(), "Cache");
  // Another account's library takes none of this one's room.
  const b = await account(pg);
  await send(pg, b, crypto.randomUUID(), "Theirs");
});

Deno.test("start fresh takes the library with the old key; the devices send theirs again sealed anew", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  await send(pg, a, crypto.randomUUID(), "Server");
  await send(pg, a, crypto.randomUUID(), "Database");
  const b = await account(pg);
  await send(pg, b, crypto.randomUUID(), "Theirs");
  const signedIn = { "request.jwt.claims": JSON.stringify({ sub: a.id, role: "authenticated", amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) - 30 }] }) };
  const [{ done }] = await asUser<{ done: boolean }>(pg, a.id, `select public.start_fresh($1) as done`, [a.keyId], signedIn);
  assertEquals(done, true);
  assertEquals((await pg.query(`select 1 from public.whiteboard_library where user_id = $1`, [a.id])).rows.length, 0);
  assertEquals((await rows(pg, b)).length, 1, "nobody else's");
});
