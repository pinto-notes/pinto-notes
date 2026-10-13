// deno test --allow-read --allow-write --allow-run scripts/check-telemetry-key.test.ts (macOS: plutil)
//
// The iPhone and Mac 1.2 builds went to App Review without the PostHog key, so App Store users
// sent nothing. testflight.sh stops a release archive like that with check-telemetry-key.sh.
import { assert, assertEquals } from "jsr:@std/assert@1";

const script = new URL("./check-telemetry-key.sh", import.meta.url).pathname;
const onMac = Deno.build.os === "darwin";

async function archive(mac: boolean, entries: Record<string, string>) {
  const dir = await Deno.makeTempDir();
  const app = `${dir}/t.xcarchive/Products/Applications/Pinto Notes.app${mac ? "/Contents" : ""}`;
  await Deno.mkdir(app, { recursive: true });
  const body = Object.entries(entries).map(([k, v]) => `<key>${k}</key><string>${v}</string>`).join("");
  await Deno.writeTextFile(`${app}/Info.plist`, `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>${body}</dict></plist>`);
  // Archived Info.plists are binary.
  await new Deno.Command("plutil", { args: ["-convert", "binary1", `${app}/Info.plist`] }).output();
  return `${dir}/t.xcarchive`;
}

async function check(path: string) {
  const out = await new Deno.Command(script, { args: [path] }).output();
  const dec = new TextDecoder();
  return { code: out.code, text: dec.decode(out.stdout) + dec.decode(out.stderr) };
}

const KEY = "phc_testOnlyNotARealKey123";

Deno.test({ name: "an iPhone archive with the key passes, and the key is never printed", ignore: !onMac, fn: async () => {
  const r = await check(await archive(false, { PanePostHogKey: KEY, PanePostHogHost: "https://eu.i.posthog.com" }));
  assertEquals(r.code, 0);
  assert(r.text.includes("present"));
  assert(!r.text.includes(KEY));
} });

Deno.test({ name: "a Mac archive with the key passes", ignore: !onMac, fn: async () => {
  assertEquals((await check(await archive(true, { PanePostHogKey: KEY }))).code, 0);
} });

Deno.test({ name: "an archive from before telemetry, with no key entry, is stopped", ignore: !onMac, fn: async () => {
  const r = await check(await archive(false, { PaneSupabaseURL: "https://example.supabase.co" }));
  assertEquals(r.code, 1);
  assert(r.text.includes("absent"));
} });

Deno.test({ name: "an empty key (no Backend.local.xcconfig) or a key that isn't phc_ is stopped", ignore: !onMac, fn: async () => {
  assertEquals((await check(await archive(true, { PanePostHogKey: "" }))).code, 1);
  const r = await check(await archive(false, { PanePostHogKey: "phx_personalKeyNotForApps" }));
  assertEquals(r.code, 1);
  assert(!r.text.includes("phx_personalKeyNotForApps"));
} });
