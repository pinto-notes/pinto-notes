// The render service's answers read for the save gate (app_check.ts), without a browser.
//   cd supabase/functions/mcp && deno test -A app_check.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { flakyTests, type Rendered } from "./app_check.ts";

const run = (tests: { name: string; ok: boolean; file?: string }[]): Rendered =>
  ({ views: [], interaction: { tried: "none", ok: null }, probes: {}, blocked: [], ms: 1, tests: tests.map((t) => ({ ...t, ms: 1 })) });

Deno.test("a test that fails and then passes over the same code is named as flaky; one that fails twice isn't (real-AI run, 8 Nov)", () => {
  const first = run([
    { file: "/tests/app.test.tsx", name: "Home › counts a glass each tap", ok: false },
    { file: "/tests/app.test.tsx", name: "Home › takes back a mistaken tap", ok: false },
    { file: "/tests/app.test.tsx", name: "Home › shows the goal", ok: true },
  ]);
  const again = run([
    { file: "/tests/app.test.tsx", name: "Home › counts a glass each tap", ok: true },
    { file: "/tests/app.test.tsx", name: "Home › takes back a mistaken tap", ok: false },
    { file: "/tests/app.test.tsx", name: "Home › shows the goal", ok: true },
  ]);
  assertEquals(flakyTests(first, again), ["/tests/app.test.tsx: Home › counts a glass each tap"]);
  // The second run didn't get to the tests (a file that didn't load): nothing is called flaky.
  assertEquals(flakyTests(first, { ...again, tests: undefined }), []);
});
