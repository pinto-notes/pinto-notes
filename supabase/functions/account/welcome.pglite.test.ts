// The Welcome note is written once per account, by the one device that claims it:
//   deno test -A supabase/functions/account/welcome.pglite.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { asUser, migrateFrom, newUser, schemaDB } from "../mcp/pglite.ts";

const MIGRATION = "20261028170000_welcome_note.sql";
const claim = async (pg: Awaited<ReturnType<typeof schemaDB>>, u: string) =>
  (await asUser<{ won: boolean }>(pg, u, `select public.claim_welcome_note() as won`))[0].won;

Deno.test("a new account's first claim wins, and every claim after it loses", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg), other = await newUser(pg);
  assertEquals(await claim(pg, me), true, "the first device writes the note");
  assertEquals(await claim(pg, me), false, "a second device, or the same one again, doesn't");
  assertEquals(await claim(pg, me), false);
  assertEquals(await claim(pg, other), true, "each account has its own");
  await pg.close();
});

Deno.test("two devices claiming at once: exactly one wins", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg);
  const results = await Promise.all(Array.from({ length: 6 }, () => claim(pg, me)));
  assertEquals(results.filter(Boolean).length, 1);
  await pg.close();
});

Deno.test("accounts that exist when the migration runs never get one", async () => {
  const pg = await schemaDB(MIGRATION);
  const before = await newUser(pg);
  await migrateFrom(pg, MIGRATION);
  const after = await newUser(pg);
  assertEquals(await claim(pg, before), false, "an existing account is marked as done");
  assertEquals(await claim(pg, after), true, "an account made after it gets its note");
  await pg.close();
});

Deno.test("nobody can read or change the table directly, and a signed-out caller is refused", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg);
  let read = false;
  try { await asUser(pg, me, `select * from public.account_welcome`); read = true; } catch { /* refused */ }
  assert(!read, "the table isn't readable from the API");
  let wrote = false;
  try { await asUser(pg, me, `insert into public.account_welcome (user_id) values ('${me}')`); wrote = true; } catch { /* refused */ }
  assert(!wrote, "nor writable: only the claim writes it");
  let anon = false;
  try { await pg.query(`select public.claim_welcome_note()`); anon = true; } catch { /* refused */ }
  assert(!anon, "no account, no claim");
  await pg.close();
});

Deno.test("deleting the account deletes its claim", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg);
  await claim(pg, me);
  await pg.query(`delete from auth.users where id = $1`, [me]);
  assertEquals((await pg.query<{ n: number }>(`select count(*)::int as n from public.account_welcome where user_id = $1`, [me])).rows[0].n, 0);
  await pg.close();
});

// The note is written by Pinto, from the device that won the claim: like any note the app saves,
// its author is the app, never an AI, on the note and on the first version history keeps of it.
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
const box = (key: string) => `amb2.${key}.${btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48))))}`;
const app = (pg: Awaited<ReturnType<typeof schemaDB>>, me: string, sql: string, params: unknown[] = []) =>
  asUser<Record<string, unknown>>(pg, me, sql, params, { "request.headers": JSON.stringify({ "x-pane-device": "iPhone", "x-amber-client": "lock-aware/1 e2ee/1" }) });

Deno.test("the Welcome note, and the first version of it, name no AI", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg);
  const key = hex(8);
  await app(pg, me, `select * from public.create_account_key($1, $2, $3, $4)`, [key, hex(32), box(key), 0]);
  assertEquals(await claim(pg, me), true);
  const id = crypto.randomUUID();
  await app(pg, me, `insert into public.notes (id, head_ct, body_ct) values ($1, $2, $3)`, [id, box(key), box(key)]);
  const [note] = await app(pg, me, `select ai_editor, ai_edited_at, body_source from public.notes where id = $1`, [id]);
  assertEquals(note.ai_editor, null);
  assertEquals(note.ai_edited_at, null);
  assertEquals(note.body_source, "app");
  // A tick on the device keeps the first text as a version: its author is the app too.
  await app(pg, me, `update public.notes set body_ct = $2 where id = $1`, [id, box(key)]);
  const revisions = await app(pg, me, `select source, body_source from public.note_revisions where note_id = $1 order by version`, [id]);
  assert(revisions.length >= 1, "the first text is kept");
  for (const r of revisions) {
    assertEquals(r.source, "app");
    assertEquals(r.body_source, "app");
  }
  await pg.close();
});
