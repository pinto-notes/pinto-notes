// Shared notes' changes under real concurrency, which PGlite (one connection) can't show: a change
// whose insert commits late must never fall behind a pull cursor or under a snapshot, and a change
// sealed under the old key must not commit after a removal renewed it. Runs in a throwaway database
// made inside a real local Postgres (the local stack's), dropped at the end; never production.
//   COLLAB_PG_URL=postgresql://postgres:postgres@127.0.0.1:56422/postgres deno test -A collab_order.pg.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import postgres from "npm:postgres@3.4.5";
import { stubs } from "./pglite.ts";

const admin = Deno.env.get("COLLAB_PG_URL");
const local = admin !== undefined && /@(127\.0\.0\.1|localhost):/.test(admin);

async function freshDB() {
  const name = `collab_order_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const root = postgres(admin!, { max: 1, onnotice: () => {} });
  await root.unsafe(`create database ${name}`);
  const url = admin!.replace(/\/[^/?]*(\?|$)/, `/${name}$1`);
  const setup = postgres(url, { max: 1, onnotice: () => {} });
  const drop = async () => {
    await root.unsafe(`drop database if exists ${name} with (force)`);
    await root.end();
  };
  try {
  // The cluster already has Supabase's roles; everything else is made in this database.
  await setup.unsafe(stubs.replace(/create role (\w+);/g, (_, r) => `do $$ begin create role ${r}; exception when duplicate_object then null; end $$;`));
  const dir = new URL("../../migrations/", import.meta.url);
  for (const f of [...Deno.readDirSync(dir)].map((f) => f.name).filter((n) => n.endsWith(".sql")).sort()) {
    try {
      // pg_cron lives only in the cluster's own database: the schedules are left out here.
      await setup.unsafe((await Deno.readTextFile(new URL(f, dir))).replaceAll("name = 'pg_cron'", "name = 'pg_cron' and false"));
    } catch (e) {
      throw new Error(`${f}: ${(e as Error).message}`);
    }
  }
  } catch (e) {
    await setup.end();
    await drop();
    throw e;
  }
  await setup.end();
  return { url, drop };
}

/** One person's connection, as PostgREST runs it: their claims and the authenticated role, per transaction. */
function person(url: string, id: string) {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  const as = async (tx: postgres.TransactionSql) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: id, role: "authenticated" })}, true)`;
    await tx.unsafe(`set local role authenticated`);
  };
  return { id, sql, as };
}

const later = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test({ name: "a change that commits late is never skipped by a pull or compacted unseen", ignore: !local, sanitizeResources: false, sanitizeOps: false }, async () => {
  const { url, drop } = await freshDB();
  const db = postgres(url, { max: 1, onnotice: () => {} });
  const [emilID, saraID] = [crypto.randomUUID(), crypto.randomUUID()];
  await db`insert into auth.users (id, email) values (${emilID}, 'emil@example.com'), (${saraID}, 'sara@example.com')`;
  const note = crypto.randomUUID();
  await db`insert into public.shared_notes (id, owner_id) values (${note}, ${emilID})`;
  await db`insert into public.note_members (note_id, user_id, role, epoch, key_wrap, wrapped_by) values
    (${note}, ${emilID}, 'owner', 1, 'amb3k.AA==', ${emilID}), (${note}, ${saraID}, 'editor', 1, 'amb3k.AA==', ${emilID})`;
  const emil = person(url, emilID), sara = person(url, saraID);
  try {
    // Sara's change is in flight: inserted, not committed yet.
    let releaseSara!: () => void;
    const saraHolds = new Promise<void>((r) => (releaseSara = r));
    const saraDone = sara.sql.begin(async (tx) => {
      await sara.as(tx);
      await tx`insert into public.note_updates (note_id, epoch, ct) values (${note}, 1, 'amb3u.1.c2FyYQ==')`;
      await saraHolds;
    });
    await later(300);
    // Emil writes and pulls meanwhile; his pull's cursor is the newest id he sees.
    const emilWrites = emil.sql.begin(async (tx) => {
      await emil.as(tx);
      await tx`insert into public.note_updates (note_id, epoch, ct) values (${note}, 1, 'amb3u.1.ZW1pbA==')`;
    });
    await later(300);
    // Pulled on another connection, as from another device: Emil's write may be waiting.
    const reader = person(url, emilID);
    const seen = await reader.sql.begin(async (tx) => {
      await reader.as(tx);
      return await tx<{ id: string }[]>`select id from public.note_updates where note_id = ${note} order by id`;
    });
    await reader.sql.end();
    const cursor = seen.length ? BigInt(seen[seen.length - 1].id) : 0n;
    releaseSara();
    await saraDone;
    await emilWrites;
    // Everything stored is either at or before what the pull saw, or after its cursor: nothing
    // committed later with an id the cursor already passed.
    const all = await db<{ id: string; ct: string }[]>`select id, ct from public.note_updates where note_id = ${note} order by id`;
    const seenIDs = new Set(seen.map((r) => r.id));
    const skipped = all.filter((r) => BigInt(r.id) <= cursor && !seenIDs.has(r.id));
    assertEquals(skipped, [], "a change committed after the pull hides behind its cursor");
    assertEquals(all.length, 2);

    // And a snapshot whose upto is that cursor keeps every change it couldn't have held.
    await emil.sql.begin(async (tx) => {
      await emil.as(tx);
      await tx`insert into public.note_snapshots (note_id, upto, epoch, ct) values (${note}, ${cursor.toString()}, 1, 'amb3s.1.AA==')`;
    });
    const left = await db<{ ct: string }[]>`select ct from public.note_updates where note_id = ${note} and id > ${cursor.toString()}`;
    for (const r of all.filter((r) => !seenIDs.has(r.id))) assert(left.some((l) => l.ct === r.ct), `${r.ct} was compacted without being in the snapshot`);
  } finally {
    await Promise.all([emil.sql.end(), sara.sql.end(), db.end()]);
    await drop();
  }
});

Deno.test({ name: "a change for the old key can't commit after a removal renewed it", ignore: !local, sanitizeResources: false, sanitizeOps: false }, async () => {
  const { url, drop } = await freshDB();
  const db = postgres(url, { max: 1, onnotice: () => {} });
  const [emilID, saraID, jonasID] = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  await db`insert into auth.users (id, email) values (${emilID}, 'e@example.com'), (${saraID}, 's@example.com'), (${jonasID}, 'j@example.com')`;
  const note = crypto.randomUUID();
  await db`insert into public.shared_notes (id, owner_id) values (${note}, ${emilID})`;
  await db`insert into public.note_members (note_id, user_id, role, epoch, key_wrap, wrapped_by) values
    (${note}, ${emilID}, 'owner', 1, 'amb3k.AA==', ${emilID}), (${note}, ${saraID}, 'editor', 1, 'amb3k.AA==', ${emilID}),
    (${note}, ${jonasID}, 'editor', 1, 'amb3k.AA==', ${emilID})`;
  const emil = person(url, emilID), jonas = person(url, jonasID);
  try {
    let releaseJonas!: () => void;
    const jonasHolds = new Promise<void>((r) => (releaseJonas = r));
    const jonasDone = jonas.sql.begin(async (tx) => {
      await jonas.as(tx);
      await tx`insert into public.note_updates (note_id, epoch, ct) values (${note}, 1, 'amb3u.1.am9uYXM=')`;
      await jonasHolds;
    }).then(() => "committed", (e) => `refused: ${(e as { hint?: string }).hint}`);
    await later(300);
    // Emil removes Sara: a new key for Emil and Jonas.
    const wraps = JSON.stringify([{ user_id: emilID, key_wrap: "amb3k.AQ==" }, { user_id: jonasID, key_wrap: "amb3k.AQ==" }]);
    let removedAt = 0;
    const removal = emil.sql.begin(async (tx) => {
      await emil.as(tx);
      await tx`select public.collab_remove(${note}, ${saraID}, 2, ${wraps}::text::jsonb)`;
    }).then(() => (removedAt = performance.now()));
    await later(300);
    const releasedAt = performance.now();
    releaseJonas();
    const jonasResult = await jonasDone;
    await removal;
    const [{ epoch }] = await db<{ epoch: number }[]>`select epoch from public.shared_notes where id = ${note}`;
    assertEquals(epoch, 2);
    // Jonas's change is in only if it committed before the key changed, so the device that renewed
    // the key sees it when it catches up after the removal (and puts it in the snapshot it seals).
    assertEquals(jonasResult, "committed");
    assert(removedAt > releasedAt, "the removal finished while a change for the old key was still in flight");
  } finally {
    await Promise.all([emil.sql.end(), jonas.sql.end(), db.end()]);
    await drop();
  }
});
