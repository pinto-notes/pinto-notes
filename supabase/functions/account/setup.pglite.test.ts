// The account's setup marks on the whole schema in an in-process Postgres (PGlite):
//   deno test -A supabase/functions/account/setup.pglite.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { asUser, newUser, schemaDB } from "../mcp/pglite.ts";

type State = { imported: boolean; dismissed: boolean; celebrated: boolean; templates_closed: boolean; connected: boolean; ai_edits: number };

Deno.test("closing the Templates card is kept per account, and survives the old reset", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg), other = await newUser(pg);
  const state = async (u: string) => (await asUser<{ s: State }>(pg, u, `select public.pane_setup_state() as s`))[0].s;

  assertEquals((await state(me)).templates_closed, false);
  await asUser(pg, me, `select public.pane_setup_mark('templates_closed')`);
  assertEquals((await state(me)).templates_closed, true);
  assertEquals((await state(other)).templates_closed, false, "another account still sees the card");

  // The first-run flow's end, and the marks from before, still work beside it.
  await asUser(pg, me, `select public.pane_setup_mark('dismissed')`);
  await asUser(pg, me, `select public.pane_setup_mark('imported')`);
  const s = await state(me);
  assert(s.dismissed && s.imported && s.templates_closed && !s.celebrated);

  // An older app's Show Setup Guide clears its own three marks, not this one.
  await asUser(pg, me, `select public.pane_setup_mark('reset')`);
  const after = await state(me);
  assert(!after.dismissed && !after.imported && after.templates_closed);

  let refused = false;
  try { await asUser(pg, me, `select public.pane_setup_mark('anything')`); } catch { refused = true; }
  assert(refused, "only known marks are accepted");
  await pg.close();
});
