// Migrations are applied by their 14-digit version, so two files with the same version clash: one
// is skipped or recorded under the other's name on any database that has the first. Two clashes
// happened in one night (2026-10-14). Name a new one after the newest on every branch.
//   deno test -A supabase/functions/_shared/migrations.test.ts
import { assertEquals } from "jsr:@std/assert@1";

Deno.test("no two migrations share a version", () => {
  const dir = new URL("../../migrations/", import.meta.url);
  const byVersion = new Map<string, string[]>();
  for (const f of Deno.readDirSync(dir)) {
    if (!f.name.endsWith(".sql")) continue;
    const version = f.name.match(/^(\d{14})_/)?.[1] ?? `malformed: ${f.name}`;
    byVersion.set(version, [...(byVersion.get(version) ?? []), f.name]);
  }
  const clashes = [...byVersion].filter(([v, files]) => files.length > 1 || v.startsWith("malformed")).map(([, files]) => files.sort());
  assertEquals(clashes, []);
});
