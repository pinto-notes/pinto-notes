// A note's front matter (20261030200000_note_front_matter.sql) on the whole schema in an in-process
// Postgres (PGlite): sealed like the note's text, with the account's key while it's open and with
// the notes password's key while it's locked; cleared when the note is deleted for good; counted
// in the account's storage. Needs no Docker or local stack:
//   cd supabase/functions/mcp && deno test -A front_matter.pglite.test.ts
// front_matter.e2e.test.ts runs the same checks against the real local stack.
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { toBase64 } from "../_shared/e2ee.ts";
import { asUser } from "./pglite.ts";
import { type Account, account, app, note } from "./sealed.ts";
import { schemaDB } from "./pglite.ts";

/** A notes password's salt and its key id, as the app makes them (SHA-256 of the salt, 16 hex digits). */
const SALT = crypto.getRandomValues(new Uint8Array(16));
const PASSWORD_KEY = [...new Uint8Array(await crypto.subtle.digest("SHA-256", SALT)).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
/** A box as the app makes one: the key's id and an AES-GCM box. The server never opens it. */
const box = (key: string, bytes = 48) => `amb2.${key}.${toBase64(bytes <= 65536 ? crypto.getRandomValues(new Uint8Array(bytes)) : new Uint8Array(bytes).fill(7))}`;

async function refused(p: Promise<unknown>, text: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, text);
}

async function setUp() {
  const pg = await schemaDB();
  const a = await account(pg);
  return { pg, a };
}

const props = async (pg: PGlite, id: string) =>
  (await pg.query<{ props_ct: string | null; locked_props: string | null }>(`select props_ct, locked_props from public.notes where id = $1`, [id])).rows[0];

/** Notes password set up, as a device does before locking a note. */
const withPassword = (pg: PGlite, a: Account) =>
  app(pg, a.id, `insert into public.note_locks (salt, iterations, key_id, verifier, hint) values ($1, 600000, $2, 'v', null)`, [toBase64(SALT), PASSWORD_KEY]);

Deno.test("open front matter goes in sealed with the account's key, and only with it", async () => {
  const { pg, a } = await setUp();
  const id = await note(pg, a, "Porto\n\nFlights");
  const sealed = box(a.keyId);
  await app(pg, a.id, `update public.notes set props_ct = $2 where id = $1`, [id, sealed]);
  assertEquals((await props(pg, id)).props_ct, sealed);
  await refused(app(pg, a.id, `update public.notes set props_ct = $2 where id = $1`, [id, box("ffffffffffffffff")]), "old key");
  await refused(app(pg, a.id, `update public.notes set props_ct = 'aliases: [Oporto]' where id = $1`, [id]), "notes_props_sealed");
  // A build from before front matter sends none: the note keeps what it has.
  await app(pg, a.id, `update public.notes set is_pinned = true where id = $1`, [id]);
  assertEquals((await props(pg, id)).props_ct, sealed);
});

Deno.test("a locked note's front matter is sealed with the notes password, never with the account's key", async () => {
  const { pg, a } = await setUp();
  await withPassword(pg, a);
  const id = await note(pg, a, "Bank\n\nPIN");
  await app(pg, a.id, `update public.notes set props_ct = $2 where id = $1`, [id, box(a.keyId)]);
  const head = (await pg.query<{ head_ct: string }>(`select head_ct from public.notes where id = $1`, [id])).rows[0].head_ct;
  // Locking it and leaving the front matter readable with the account's key is refused.
  await refused(app(pg, a.id, `update public.notes set body_ct = null, locked_body = $2 where id = $1`, [id, box(PASSWORD_KEY)]), "notes_props_sealed");
  // Locked as the app locks it: both move to the password's boxes.
  const lockedProps = box(PASSWORD_KEY);
  await app(pg, a.id, `update public.notes set body_ct = null, head_ct = $2, locked_body = $3, props_ct = null, locked_props = $4 where id = $1`,
    [id, head, box(PASSWORD_KEY), lockedProps]);
  assertEquals(await props(pg, id), { props_ct: null, locked_props: lockedProps });
  // Another password's box, or an AI changing it, is refused.
  await refused(app(pg, a.id, `update public.notes set locked_props = $2 where id = $1`, [id, box("ffffffffffffffff")]), "different notes password");
  await refused(asUser(pg, a.id, `update public.notes set locked_props = $2 where id = $1`, [id, box(PASSWORD_KEY)], { "pane.source": "mcp", "pane.client": "Claude" }),
    "This note is locked");
  // Unlocked again: the password's box can't stay on an open note.
  await refused(app(pg, a.id, `update public.notes set locked_body = null, body_ct = $2 where id = $1`, [id, box(a.keyId)]), "notes_props_sealed");
  await app(pg, a.id, `update public.notes set locked_body = null, body_ct = $2, locked_props = null, props_ct = $3 where id = $1`, [id, box(a.keyId), box(a.keyId)]);
  assert((await props(pg, id)).props_ct?.startsWith(`amb2.${a.keyId}.`));
});

Deno.test("a note deleted for good keeps no front matter", async () => {
  const { pg, a } = await setUp();
  const id = await note(pg, a, "Gone soon");
  await app(pg, a.id, `update public.notes set props_ct = $2 where id = $1`, [id, box(a.keyId)]);
  await app(pg, a.id, `update public.notes set deleted_at = now(), body_ct = null, head_ct = null where id = $1`, [id]);
  assertEquals(await props(pg, id), { props_ct: null, locked_props: null });
});

Deno.test("front matter counts toward the account's storage", async () => {
  const { pg, a } = await setUp();
  const id = await note(pg, a, "Porto");
  const before = Number((await pg.query<{ notes: number }>(`select notes from public.pane_storage_parts($1)`, [a.id])).rows[0].notes);
  const sealed = box(a.keyId, 3000);
  await app(pg, a.id, `update public.notes set props_ct = $2 where id = $1`, [id, sealed]);
  const after = Number((await pg.query<{ notes: number }>(`select notes from public.pane_storage_parts($1)`, [a.id])).rows[0].notes);
  assertEquals(after - before, sealed.length);
  await refused(app(pg, a.id, `update public.notes set props_ct = $2 where id = $1`, [id, box(a.keyId, 160_000)]), "notes_props_sealed");
});
