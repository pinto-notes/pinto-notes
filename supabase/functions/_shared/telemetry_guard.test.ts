// Nothing reaches a usage table except through the telemetry gate (telemetry.ts). Reads the
// migrations and the edge functions' code; needs no database. Run by scripts/prepush.sh --tests.
//   cd supabase/functions && deno test -A _shared/telemetry_guard.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  ANONYMOUS_USAGE_TABLES, createdTables, latestFunctions, REGISTERED_TABLES, TELEMETRY_GATE, USAGE_TABLES, writes,
} from "./telemetry.ts";

const migrationsDir = new URL("../../migrations/", import.meta.url);
const migrations: [string, string][] = [...Deno.readDirSync(migrationsDir)]
  .map((f) => f.name).filter((n) => n.endsWith(".sql")).sort()
  .map((n) => [n, Deno.readTextFileSync(new URL(n, migrationsDir))]);
const functions = latestFunctions(migrations);

Deno.test("every table the migrations make is sorted into usage or not usage", () => {
  const made = createdTables(migrations);
  const unsorted = [...made].filter((t) => !REGISTERED_TABLES.has(t));
  assertEquals(unsorted, [], `New tables must be added to supabase/functions/_shared/telemetry.ts: in USAGE_TABLES (written only through ${TELEMETRY_GATE}) or NOT_USAGE_TABLES with a reason.`);
  const gone = [...REGISTERED_TABLES].filter((t) => !made.has(t));
  assertEquals(gone, [], "telemetry.ts lists tables no migration makes");
});

Deno.test("every function that writes a usage table calls the gate", () => {
  const ungated: string[] = [];
  for (const table of Object.keys(USAGE_TABLES)) {
    for (const f of functions.values()) {
      if (writes(f.body, table) && !f.body.includes(TELEMETRY_GATE)) ungated.push(`${f.name} (${f.file}) writes ${table}`);
    }
  }
  assertEquals(ungated, [], `These write usage without ${TELEMETRY_GATE}user):`);
});

Deno.test("every usage table has a gated writer (the register isn't stale)", () => {
  for (const table of Object.keys(USAGE_TABLES)) {
    assert([...functions.values()].some((f) => writes(f.body, table) && f.body.includes(TELEMETRY_GATE)), `${table} has no gated writer`);
  }
});

Deno.test("an anonymous usage table has only its one writer", () => {
  for (const [table, writer] of Object.entries(ANONYMOUS_USAGE_TABLES)) {
    const writers = [...functions.values()].filter((f) => writes(f.body, table)).map((f) => f.name);
    assertEquals(writers, [writer], `${table} may be written only by ${writer} (the website gates its calls)`);
  }
});

Deno.test("no migration after the gate writes usage outside a function", () => {
  const strip = (sql: string) => sql.replace(/\bas\s+(\$\w*\$)[\s\S]*?\1/gi, "");
  for (const [file, text] of migrations.filter(([f]) => f >= "20261125120000")) {
    for (const table of [...Object.keys(USAGE_TABLES), ...Object.keys(ANONYMOUS_USAGE_TABLES)]) {
      assert(!writes(strip(text), table), `${file} writes ${table} outside a gated function`);
    }
  }
});

Deno.test("edge functions never write a usage table with their own SQL", () => {
  const root = new URL("../", import.meta.url);
  const bad: string[] = [];
  const walk = (dir: URL) => {
    for (const e of Deno.readDirSync(dir)) {
      const u = new URL(e.name + (e.isDirectory ? "/" : ""), dir);
      if (e.isDirectory) { walk(u); continue; }
      if (!/\.(ts|js)$/.test(e.name) || /\.test\.ts$|\.gen\.|pglite\.ts$/.test(e.name)) continue;
      const text = Deno.readTextFileSync(u);
      for (const table of [...Object.keys(USAGE_TABLES), ...Object.keys(ANONYMOUS_USAGE_TABLES)]) {
        if (writes(text, table)) bad.push(`${u.pathname.split("/functions/")[1]} writes ${table}`);
      }
      // No analytics service from the server: the edge functions hold no PostHog key.
      if (/posthog/i.test(text)) bad.push(`${u.pathname.split("/functions/")[1]} mentions PostHog`);
    }
  };
  walk(root);
  assertEquals(bad, [], "Call the gated SQL function instead (telemetry.ts)");
});

Deno.test("the parser sees through create or replace and drop", () => {
  const f = latestFunctions([
    ["a.sql", "create function public.w() returns void language sql as $$ insert into public.pane_devices values (1) $$;"],
    ["b.sql", "create or replace function public.w() returns void language plpgsql as $f$ begin if not public.telemetry_allowed(auth.uid()) then return; end if; insert into public.pane_devices values (1); end $f$;"],
    ["c.sql", "create function public.x() returns void language sql as $$ update public.pane_devices set last_seen = now() $$; drop function public.x();"],
  ]);
  assert(f.get("w")!.body.includes(TELEMETRY_GATE));
  assert(!f.has("x"));
  assert(writes("insert into public.pane_devices as d (user_id)", "pane_devices"));
  assert(!writes("delete from public.pane_devices", "pane_devices"));
});
