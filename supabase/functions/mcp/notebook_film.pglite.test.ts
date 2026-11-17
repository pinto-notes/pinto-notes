// The notebook film is offered once per account (20261111213000_notebook_film_seen.sql): the device
// that shows it marks the profile, the others read it. On the whole schema in PGlite, no Docker:
//   deno test -A supabase/functions/mcp/notebook_film.pglite.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { asUser, newUser, schemaDB } from "./pglite.ts";

Deno.test("a device marks the film seen on the account, and only the account can read or set it", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg), other = await newUser(pg);
  const seen = async (as: string, of: string) =>
    (await asUser<{ notebook_film_seen_at: string | null }>(pg, as, `select notebook_film_seen_at from public.profiles where user_id = $1`, [of]))[0]?.notebook_film_seen_at ?? null;

  assertEquals(await seen(me, me), null, "not seen before any device showed it");
  // As the app does it: an upsert of the one column, with or without a profile row yet.
  await asUser(pg, me, `insert into public.profiles (user_id, notebook_film_seen_at) values ($1, now())
                        on conflict (user_id) do update set notebook_film_seen_at = excluded.notebook_film_seen_at`, [me]);
  assertEquals((await seen(me, me)) !== null, true, "another device of mine sees it was shown");

  // A name set earlier survives the mark.
  await asUser(pg, other, `insert into public.profiles (user_id, display_name) values ($1, 'Sam')`, [other]);
  await asUser(pg, other, `insert into public.profiles (user_id, notebook_film_seen_at) values ($1, now())
                           on conflict (user_id) do update set notebook_film_seen_at = excluded.notebook_film_seen_at`, [other]);
  const [row] = await asUser<{ display_name: string }>(pg, other, `select display_name from public.profiles where user_id = $1`, [other]);
  assertEquals(row.display_name, "Sam");

  // Nobody reads or sets another account's.
  assertEquals(await seen(other, me), null);
  await asUser(pg, other, `update public.profiles set notebook_film_seen_at = null where user_id = $1`, [me]);
  assertEquals((await seen(me, me)) !== null, true);
  await pg.close();
});
