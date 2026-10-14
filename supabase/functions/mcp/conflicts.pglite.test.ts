// "Changed on another device" refusals (20261014230000_conflicts_not_retried.sql) on the whole schema
// in an in-process Postgres (PGlite). They answer PT409: PostgREST retries 40001
// (serialization_failure) by itself, at once and without end, so a 40001 refusal never reached the
// app and the request hung until the gateway gave up. Needs no Docker or local stack:
//   cd supabase/functions/mcp && deno test -A conflicts.pglite.test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { toBase64 } from "../_shared/e2ee.ts";
import { schemaDB } from "./pglite.ts";
import { account, app, lockedNote, note, notesPassword, share } from "./sealed.ts";

async function answers(p: Promise<unknown>, code: string, hint: string) {
  const e = await assertRejects(() => p) as { code?: string; hint?: string };
  assertEquals([e.code, e.hint], [code, hint]);
}

Deno.test("no function refuses with 40001, which PostgREST retries without end", async () => {
  const pg = await schemaDB();
  const rows = await pg.query<{ name: string }>(
    `select p.proname as name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosrc ~ '40001|serialization_failure'
       -- Fixed on collab/core (20261014221000_collab_stale_key_answers); drop this line once it's on dev.
       and p.proname not in ('collab_invite', 'collab_remove', 'collab_update_guard')
     order by 1`,
  );
  assertEquals(rows.rows.map((r) => r.name), []);
});

Deno.test("a note that changed during a password change answers PT409 notes_changed", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const key = await notesPassword(pg, a);
  const id = await lockedNote(pg, a, key, "Diary");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const next = [...new Uint8Array(await crypto.subtle.digest("SHA-256", salt))].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  const box = () => `amb2.${next}.${toBase64(crypto.getRandomValues(new Uint8Array(48)))}`;
  const [{ salt: oldSalt }] = await app(pg, a.id, `select salt from public.note_locks`);
  const settings = { salt: toBase64(salt), iterations: 600000, key_id: next, verifier: "v2", previous: [{ salt: oldSalt, iterations: 600000, key_id: key, proof: box() }] };
  const [{ version }] = await app(pg, a.id, `select version from public.notes where id = $1`, [id]);
  const stale = [{ id, version: Number(version) - 1, locked_body: box() }];
  await answers(app(pg, a.id, `select public.change_notes_password($1, $2, $3)`, [JSON.stringify(settings), key, JSON.stringify(stale)]), "PT409", "notes_changed");
  await answers(app(pg, a.id, `select public.change_notes_password($1, $2, $3)`, [JSON.stringify(settings), next, "[]"]), "PT409", "changed_elsewhere");
});

Deno.test("a key made before a Start fresh answers PT409 stale_generation", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  await pg.query(`delete from public.account_keys where user_id = $1`, [a.id]);
  await pg.query(`insert into public.account_key_resets (user_id, generation) values ($1, 1)`, [a.id]);
  await answers(app(pg, a.id, `select * from public.create_account_key($1, $2, $3, 0)`, [a.keyId, "00".repeat(32), `amb2.${a.keyId}.AAAA`]), "PT409", "stale_generation");
});

Deno.test("sharing under a slug another device replaced answers PT409 share_changed", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await note(pg, a, "# Trip");
  await share(pg, a, id, { title: "Trip", body: "# Trip" });
  const [{ slug }] = await app(pg, a.id, `select public.share_slug($1) as slug`, [id]);
  const other = slug.split("").reverse().join("");
  await answers(app(pg, a.id, `select public.share_note($1, $2, false, repeat('ab', 32), $3)`, [id, other, JSON.stringify({ title: "Trip", body: "# Trip", pages: [], files: [] })]), "PT409", "share_changed");
});
