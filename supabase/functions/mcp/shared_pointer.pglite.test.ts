// Shared notes in the library (20261014211500_notes_shared_pointer.sql): each member's notes row
// for a shared note is a pointer (`shared_note_id`), with an id of their own.
//   cd supabase/functions/mcp && deno test -A shared_pointer.pglite.test.ts
import { assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, newUser, schemaDB } from "./pglite.ts";

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
const box = (key: string) => `amb2.${key}.${b64(crypto.getRandomValues(new Uint8Array(48)))}`;

const app = (pg: PGlite, me: string, sql: string, params: unknown[] = []) =>
  asUser<any>(pg, me, sql, params, { "request.headers": JSON.stringify({ "x-pane-device": "Mac", "x-amber-client": "lock-aware/1 e2ee/1" }) });

/** An app that knows shared notes (20261015060000_collab_review_fixes.sql). */
const shared1 = (pg: PGlite, me: string, sql: string, params: unknown[] = []) =>
  asUser<any>(pg, me, sql, params, { "request.headers": JSON.stringify({ "x-pane-device": "Mac", "x-amber-client": "lock-aware/1 e2ee/1 shared/1" }) });

async function account(pg: PGlite) {
  const me = await newUser(pg);
  const key = hex(8);
  await app(pg, me, `select * from public.create_account_key($1, $2, $3, 0)`, [key, hex(32), box(key)]);
  return { me, key };
}

const pointer = (pg: PGlite, a: { me: string; key: string }, id: string, shared: string) =>
  app(pg, a.me, `insert into public.notes (id, head_ct, body_ct, shared_note_id) values ($1, $2, $3, $4) returning shared_note_id`,
    [id, box(a.key), box(a.key), shared]);

Deno.test("every member has a pointer of their own to the same shared note; one each", async () => {
  const pg = await schemaDB();
  const emil = await account(pg), sara = await account(pg);
  const shared = crypto.randomUUID();
  // The owner's pointer is their own note (same id as the shared note); the member's has its own id.
  assertEquals((await pointer(pg, emil, shared, shared))[0].shared_note_id, shared);
  const saras = crypto.randomUUID();
  assertEquals((await pointer(pg, sara, saras, shared))[0].shared_note_id, shared);
  // Sara can't make a second one for the same note.
  const e = await assertRejects(() => pointer(pg, sara, crypto.randomUUID(), shared));
  assertStringIncludes((e as Error).message, "notes_shared_pointer");
  // Once hers is deleted (she left), joining again makes a pointer again.
  await app(pg, sara.me, `update public.notes set deleted_at = now(), body_ct = null, head_ct = null where id = $1`, [saras]);
  await pointer(pg, sara, crypto.randomUUID(), shared);
  // An app that knows shared notes rewrites the placeholder (the title in it changed) and keeps the pointer.
  await shared1(pg, emil.me, `update public.notes set body_ct = $2, head_ct = $3 where id = $1`, [shared, box(emil.key), box(emil.key)]);
  const [row] = await app(pg, emil.me, `select shared_note_id from public.notes where id = $1`, [shared]);
  assertEquals(row.shared_note_id, shared);
  await pg.close();
});

// 20261015060000_collab_review_fixes.sql: an app from before shared notes can't type into a pointer row.
Deno.test("an old app's text in a shared note's pointer is refused, and everything else about the pointer still syncs", async () => {
  const pg = await schemaDB();
  const emil = await account(pg);
  const shared = crypto.randomUUID();
  await pointer(pg, emil, shared, shared);
  const e = await assertRejects(() => app(pg, emil.me, `update public.notes set body_ct = $2, head_ct = $3 where id = $1`, [shared, box(emil.key), box(emil.key)])) as { code?: string; hint?: string; message: string };
  assertEquals([e.code, e.hint], ["PT403", "shared_note"]);
  assertStringIncludes(e.message, "Your edit is kept on this device");
  // Pinning, trashing and deleting it are fine from any app.
  await app(pg, emil.me, `update public.notes set is_pinned = true, trashed_at = now() where id = $1`, [shared]);
  await app(pg, emil.me, `update public.notes set deleted_at = now(), body_ct = null, head_ct = null where id = $1`, [shared]);
  // An ordinary note is untouched by the rule.
  const plain = crypto.randomUUID();
  await app(pg, emil.me, `insert into public.notes (id, head_ct, body_ct) values ($1, $2, $3)`, [plain, box(emil.key), box(emil.key)]);
  await app(pg, emil.me, `update public.notes set body_ct = $2 where id = $1`, [plain, box(emil.key)]);
  await pg.close();
});
