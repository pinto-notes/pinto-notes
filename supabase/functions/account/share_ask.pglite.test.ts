// The share ask's answers on the whole schema in an in-process Postgres (PGlite):
//   deno test -A supabase/functions/account/share_ask.pglite.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { asUser, newUser, schemaDB } from "../mcp/pglite.ts";

type State = { decided: boolean; choice: string | null; asked: number; days: number };

Deno.test("Not now may be asked once more after 30 days; any other answer is final", async () => {
  const pg = await schemaDB();
  const me = await newUser(pg), other = await newUser(pg);
  const state = async (u: string) => (await asUser<{ s: State }>(pg, u, `select public.pane_share_ask_state() as s`))[0].s;
  const decide = (u: string, c: string) => asUser(pg, u, `select public.pane_share_ask_decide($1)`, [c]);

  assertEquals((await state(me)).asked, 0);
  assert(!(await state(me)).decided);
  await decide(me, "dismissed");
  let s = await state(me);
  assert(s.decided && s.choice === "dismissed" && s.asked === 1, "an answer exists, as old apps read it");
  // Too soon: nothing changes.
  await decide(me, "shared_x");
  assertEquals((await state(me)).choice, "dismissed");
  // 31 days later: the second answer counts.
  await pg.query(`update public.pane_share_ask set decided_at = now() - interval '31 days' where user_id = $1`, [me]);
  await decide(me, "dismissed");
  s = await state(me);
  assertEquals([s.choice, s.asked], ["dismissed", 2]);
  // After two answers, never again.
  await pg.query(`update public.pane_share_ask set decided_at = now() - interval '90 days' where user_id = $1`, [me]);
  await decide(me, "shared_x");
  assertEquals((await state(me)).choice, "dismissed");

  // A share is final at once.
  await decide(other, "shared_linkedin");
  await pg.query(`update public.pane_share_ask set decided_at = now() - interval '90 days' where user_id = $1`, [other]);
  await decide(other, "dismissed");
  s = await state(other);
  assertEquals([s.choice, s.asked], ["shared_linkedin", 1]);
  await pg.close();
});
