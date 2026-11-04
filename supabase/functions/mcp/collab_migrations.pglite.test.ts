// The collaboration migrations were renamed on 2026-11-04 (from 20261014211500… 20261015080000 to
// 20261104100000… 20261104101000), so production applies them after everything release 1.3 added.
// Staging already ran them under their old names, before the release's later migrations, and runs
// them again under the new ones. Both roads must end in the same database, and running them twice
// must not fail.
//   deno test -A supabase/functions/mcp/collab_migrations.pglite.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { pg_trgm } from "npm:@electric-sql/pglite@0.2.17/contrib/pg_trgm";
import { stubs } from "./pglite.ts";

const dir = new URL("../../migrations/", import.meta.url);
const all = [...Deno.readDirSync(dir)].map((f) => f.name).filter((n) => n.endsWith(".sql")).sort();

/** The renamed files, and the name each had before. */
const renamed = new Map<string, string>(
  all.map((n) => [n, (Deno.readTextFileSync(new URL(n, dir)).match(/^-- Renamed on 2026-11-04 from (\d{14}_\w+)\.sql/) ?? [])[1]] as const)
    .filter((e): e is [string, string] => !!e[1]),
);

async function fresh(): Promise<PGlite> {
  const pg = new PGlite({ extensions: { pg_trgm } });
  await pg.exec(stubs);
  return pg;
}

async function run(pg: PGlite, files: string[]) {
  for (const f of files) {
    try {
      await pg.exec(await Deno.readTextFile(new URL(f, dir)));
    } catch (e) {
      throw new Error(`${f}: ${(e as Error).message}`);
    }
  }
}

/** What the migrations made: functions with their arguments and bodies, triggers, indexes, columns
 *  and policies in public. Two databases that agree here behave the same. */
async function shape(pg: PGlite): Promise<string[]> {
  const rows = await pg.query<{ line: string }>(`
    select 'function ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' || md5(pg_get_functiondef(p.oid)) as line
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
    union all
    select 'trigger ' || c.relname || '.' || t.tgname || ' ' || md5(pg_get_triggerdef(t.oid))
      from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and not t.tgisinternal
    union all
    select 'index ' || indexname || ' ' || md5(indexdef) from pg_indexes where schemaname = 'public'
    union all
    select 'column ' || table_name || '.' || column_name || ' ' || data_type || ' ' || coalesce(column_default, '') || ' ' || is_identity || ' ' || coalesce(identity_generation, '')
      from information_schema.columns where table_schema = 'public'
    union all
    select 'policy ' || tablename || '.' || policyname || ' ' || md5(coalesce(qual, '') || coalesce(with_check, '')) from pg_policies
    union all
    select 'grant ' || routine_name || ' ' || grantee from information_schema.routine_privileges where routine_schema = 'public'`);
  return rows.rows.map((r) => r.line).sort();
}

Deno.test("the collaboration migrations come after every migration release 1.3 has", () => {
  assertEquals(renamed.size, 11);
  const others = all.filter((n) => !renamed.has(n));
  const newestBefore = others.filter((n) => n < "20261104").at(-1)!;
  assertEquals(newestBefore, "20261102180100_connect_preapprovals.sql");
  for (const n of renamed.keys()) assert(n > newestBefore, n);
  // Their old names are gone, so no database here sees one twice under two versions.
  for (const old of renamed.values()) assert(!all.some((n) => n.startsWith(old.slice(0, 14))), old);
});

Deno.test("staging (old names first, the release's later migrations, then the new names) ends like production", async () => {
  const production = await fresh();
  await run(production, all);

  // Staging's order: each renamed file at its old place, then every file under its new name.
  const staging = await fresh();
  const old = all.map((n) => ({ sort: renamed.get(n) ? `${renamed.get(n)}.sql` : n, file: n })).sort((a, b) => a.sort < b.sort ? -1 : 1);
  await run(staging, old.map((o) => o.file));
  await run(staging, [...renamed.keys()]);

  assertEquals(await shape(staging), await shape(production));
});

Deno.test("running the collaboration migrations twice changes nothing", async () => {
  const pg = await fresh();
  await run(pg, all);
  const once = await shape(pg);
  await run(pg, [...renamed.keys()]);
  assertEquals(await shape(pg), once);
  // One collab_unshare (with p_upto), one collab_open_link (with the note's head).
  const fns = await pg.query<{ sig: string }>(`select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('collab_unshare', 'collab_open_link') order by 1`);
  assertEquals(fns.rows.map((r) => r.sig), ["collab_open_link(p_link text, p_answer text)", "collab_unshare(p_note uuid, p_body_ct text, p_head_ct text, p_upto bigint)"]);
});
