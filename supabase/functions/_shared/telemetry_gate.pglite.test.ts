// The account's Share diagnostics and usage choice stops every usage writer on the server
// (migration 20261125120000_telemetry_choice.sql, telemetry.ts). On an in-process Postgres.
//   cd supabase/functions && deno test -A _shared/telemetry_gate.pglite.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, newUser, schemaDB, sqlFor } from "../mcp/pglite.ts";
import { recordClick } from "../lifecycle/run.ts";
import { USAGE_TABLES } from "./telemetry.ts";

const count = async (pg: PGlite, table: string, user: string) =>
  Number((await pg.query<{ n: number }>(`select count(*)::int as n from public.${table} where user_id = $1`, [user])).rows[0].n);

/** Every usage writer, once, for `user`. Returns the rows each usage table has for them after. */
async function useEverything(pg: PGlite, user: string): Promise<Record<string, number>> {
  const [grant] = (await pg.query<{ id: string }>(
    `insert into public.mcp_tokens (user_id, name, token_hash, kind) values ($1, 'Claude', $2, 'token') returning id`,
    [user, crypto.randomUUID()],
  )).rows;
  await pg.query(`select public.count_ai_use($1::uuid, 'read', false, 2)`, [grant.id]);
  await asUser(pg, user, `select public.pane_tip_event('shareLink', 'shown')`);
  await asUser(pg, user, `select public.pane_feature_used('menuBar')`);
  await asUser(pg, user, `select public.pane_active_days_add(array[(now() at time zone 'utc')::date])`);
  await asUser(pg, user, `select public.pane_seen_device(gen_random_uuid(), 'macos')`);
  await asUser(pg, user, `select public.pane_heard_from_answer('friend', null)`);
  const [send] = (await pg.query<{ id: number }>(
    `insert into public.email_sends (user_id, kind, status) values ($1, 'stuck', 'sent') returning id`, [user])).rows;
  assert(await recordClick(sqlFor(pg), Number(send.id), "https://pintonotes.com/blog/x"), "the click redirect still works");
  const out: Record<string, number> = {};
  for (const table of Object.keys(USAGE_TABLES)) {
    out[table] = table === "email_clicks"
      ? Number((await pg.query<{ n: number }>(`select count(*)::int as n from public.email_clicks c join public.email_sends s on s.id = c.send_id where s.user_id = $1`, [user])).rows[0].n)
      : await count(pg, table, user);
  }
  return out;
}

Deno.test("on (the default): every usage writer records", async () => {
  const pg = await schemaDB();
  try {
    const user = await newUser(pg);
    const rows = await useEverything(pg, user);
    // pane_activity is written by the AI edit trigger, which needs a note an AI wrote: the static
    // guard (telemetry_guard.test.ts) checks that trigger calls the gate.
    for (const [table, n] of Object.entries(rows)) if (table !== "pane_activity") assert(n > 0, `${table} recorded nothing`);
  } finally {
    await pg.close();
  }
});

Deno.test("off: no usage writer records anything about the account", async () => {
  const pg = await schemaDB();
  try {
    const user = await newUser(pg);
    const other = await newUser(pg);
    const [choice] = await asUser<{ c: { share: boolean } }>(pg, user, `select public.telemetry_choice_set(false) as c`);
    assertEquals(choice.c.share, false);
    const rows = await useEverything(pg, user);
    assertEquals(Object.values(rows).reduce((a, b) => a + b, 0), 0, JSON.stringify(rows));
    // The heard-from question isn't asked either.
    const [state] = await asUser<{ s: { ask: boolean } }>(pg, user, `select public.pane_heard_from_state() as s`);
    assertEquals(state.s.ask, false);
    // Someone else's choice is their own.
    const theirs = await useEverything(pg, other);
    assert(theirs.pane_devices > 0);
  } finally {
    await pg.close();
  }
});

Deno.test("the latest choice wins, and only the account reads its own", async () => {
  const pg = await schemaDB();
  try {
    const user = await newUser(pg);
    const [none] = await asUser<{ c: { share: boolean | null } }>(pg, user, `select public.telemetry_choice_get() as c`);
    assertEquals(none.c.share, null);
    await asUser(pg, user, `select public.telemetry_choice_set(false, now())`);
    // A device that was offline sends an older "on": the newer "off" stands.
    const [stale] = await asUser<{ c: { share: boolean } }>(pg, user, `select public.telemetry_choice_set(true, now() - interval '1 hour') as c`);
    assertEquals(stale.c.share, false);
    const [later] = await asUser<{ c: { share: boolean } }>(pg, user, `select public.telemetry_choice_set(true, now() + interval '1 hour') as c`);
    assertEquals(later.c.share, true, "a time in the future counts as now");
    const [gate] = (await pg.query<{ ok: boolean }>(`select public.telemetry_allowed($1) as ok`, [user])).rows;
    assertEquals(gate.ok, true);
    // The gate itself isn't callable by the app.
    let refused = false;
    try { await asUser(pg, user, `select public.telemetry_allowed($1)`, [user]); } catch { refused = true; }
    assert(refused);
  } finally {
    await pg.close();
  }
});
