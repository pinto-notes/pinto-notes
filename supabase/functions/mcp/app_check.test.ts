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

const view = (name: string, extra: Record<string, unknown>) =>
  ({ name, width: name.startsWith("390") ? 390 : 1280, scheme: name.endsWith("dark") ? "dark" : "light", errors: [], overflowPx: 0, textLength: 200, contrast: 18, bgLuminance: 1, unnamedControls: [], smallTargets: 0, ...extra });

// 2026-11-18 (arm D): the note about how much of a wide window an app uses pushed apps toward a
// sidebar inside a note that already has Pinto's own.
Deno.test("a narrow column on a wide window is the app's call: no note about the window's width", async () => {
  const { renderedFindings } = await import("./app_check.ts");
  const f = renderedFindings({ views: [view("1280-light", { usedWidth: 0.3 })], interaction: { tried: "none", ok: null }, probes: {}, blocked: [], ms: 1 } as never);
  assertEquals([...f.errors, ...f.notes].filter((n) => /width/.test(n)), []);
});

// 2026-11-18: B and C apps shipped secondary text under 4.5:1 (Budget 16 views' worth). The check
// said how many, not what to use. Now: one note per colour pair across the views, with the colour
// that reads, and never an error (a version isn't held back over it).
Deno.test("faint text gets one note per colour pair, with the colour to use, and holds nothing back", async () => {
  const { renderedFindings } = await import("./app_check.ts");
  const pair = { color: "#a3a3a3", background: "#ffffff", ratio: 2.5, use: "#737373", useRatio: 4.7, texts: ["3 left"], className: "text-muted-foreground" };
  const f = renderedFindings({ views: [
    view("1280-light", { faintCount: 2, faintText: ["3 left", "Due"], faintColors: [{ ...pair, texts: ["3 left", "Due"] }] }),
    view("390-light", { faintCount: 1, faintText: ["3 left"], faintColors: [pair] }),
  ], interaction: { tried: "none", ok: null }, probes: {}, blocked: [], ms: 1 } as never);
  assertEquals(f.errors, []);
  assertEquals(f.notes, ['Text in #a3a3a3 on #ffffff is 2.5:1 ("3 left", "Due"; text-muted-foreground; 1280-light, 390-light). #737373 reads at 4.7:1: use it where that colour is defined.']);
});
