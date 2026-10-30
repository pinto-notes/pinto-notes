// deno test --allow-read --allow-write --allow-run --allow-env scripts/make-it-yours.test.ts (macOS: zsh)
//
// The two scripts a stranger runs on a fresh clone (docs/MAKE-IT-YOURS.md): make-it-yours.sh sets
// their identity, and deploy-backend.sh --dry-run shows what it would do to their Supabase project.
// Each runs in a copy of the files it reads, with a PATH that has no xcodegen or deno, so nothing
// in the checkout changes and nothing is regenerated.
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";

const root = new URL("..", import.meta.url).pathname;
const onMac = Deno.build.os === "darwin";

async function copy() {
  const dir = await Deno.makeTempDir();
  for (const d of ["scripts", "Config", "supabase", "Pane/Editor", "Pane/Resources/Assets.xcassets/AccentColor.colorset"]) {
    await Deno.mkdir(`${dir}/${d}`, { recursive: true });
  }
  for (const f of ["scripts/make-it-yours.sh", "scripts/deploy-backend.sh", "scripts/set-accent.sh", "Config/Identity.xcconfig", "supabase/config.toml",
    "Pane/Editor/Palette.swift", "Pane/Resources/Assets.xcassets/AccentColor.colorset/Contents.json"]) {
    await Deno.copyFile(`${root}${f}`, `${dir}/${f}`);
    await Deno.chmod(`${dir}/${f}`, 0o755);
  }
  return dir;
}

async function run(dir: string, script: string, ...args: string[]) {
  const out = await new Deno.Command(`${dir}/scripts/${script}`, {
    args,
    env: { PATH: "/usr/bin:/bin", HOME: dir },
    clearEnv: true,
  }).output();
  const dec = new TextDecoder();
  return { code: out.code, text: dec.decode(out.stdout) + dec.decode(out.stderr) };
}

const exists = (p: string) => Deno.stat(p).then(() => true, () => false);

Deno.test({ name: "make-it-yours writes the identity file a free account needs", ignore: !onMac, fn: async () => {
  const dir = await copy();
  const r = await run(dir, "make-it-yours.sh", "--name", "Kim's Notes", "--bundle-id", "com.kim.notes", "--personal-team", "ABCDE12345");
  assertEquals(r.code, 0, r.text);
  const local = await Deno.readTextFile(`${dir}/Config/Identity.local.xcconfig`);
  for (const line of ["PANE_BUNDLE_ID = com.kim.notes", "PANE_DISPLAY_NAME = Kim's Notes", "PANE_URL_SCHEME = kimnotes",
    "PANE_APP_GROUP = group.com.kim.notes", "PANE_IOS_TEAM = ABCDE12345", "PANE_IOS_ENTITLEMENTS = Pane-ios-personal.entitlements"]) {
    assertStringIncludes(local, line + "\n");
  }
  assertStringIncludes(r.text, "xcodegen generate", "says how to regenerate when XcodeGen is missing");
  // A fork never updates itself to Pinto Notes, and opens no links on Pinto Notes' site.
  assertStringIncludes(local, "PANE_UPDATE_FEED =\n");
  assertStringIncludes(local, "PANE_APPLINKS_HOST = \n");
} });

Deno.test({ name: "make-it-yours --site opens links on your own site", ignore: !onMac, fn: async () => {
  const dir = await copy();
  const r = await run(dir, "make-it-yours.sh", "--bundle-id", "com.kim.notes", "--site", "https://notes.kim.dev/");
  assertEquals(r.code, 0, r.text);
  assertStringIncludes(await Deno.readTextFile(`${dir}/Config/Identity.local.xcconfig`), "PANE_APPLINKS_HOST = notes.kim.dev\n");
  assertEquals((await run(dir, "make-it-yours.sh", "--bundle-id", "com.kim.notes", "--site", "notes.kim.dev")).code, 1);
} });

Deno.test({ name: "make-it-yours with no team signs nothing for an iPhone, and --reset goes back", ignore: !onMac, fn: async () => {
  const dir = await copy();
  assertEquals((await run(dir, "make-it-yours.sh", "--bundle-id", "org.example.notes")).code, 0);
  const local = await Deno.readTextFile(`${dir}/Config/Identity.local.xcconfig`);
  assertStringIncludes(local, "PANE_IOS_TEAM = \n");
  assert(!local.includes("PANE_IOS_ENTITLEMENTS"));
  assertEquals((await run(dir, "make-it-yours.sh", "--reset")).code, 0);
  assert(!(await exists(`${dir}/Config/Identity.local.xcconfig`)));
} });

Deno.test({ name: "make-it-yours run again changes only what's passed", ignore: !onMac, fn: async () => {
  const dir = await copy();
  await run(dir, "make-it-yours.sh", "--name", "Kim's Notes", "--bundle-id", "com.kim.notes", "--personal-team", "ABCDE12345");
  const r = await run(dir, "make-it-yours.sh", "--site", "https://notes.kim.dev");
  assertEquals(r.code, 0, r.text);
  const local = await Deno.readTextFile(`${dir}/Config/Identity.local.xcconfig`);
  for (const line of ["PANE_DISPLAY_NAME = Kim's Notes", "PANE_BUNDLE_ID = com.kim.notes", "PANE_URL_SCHEME = kimnotes",
    "PANE_IOS_TEAM = ABCDE12345", "PANE_IOS_ENTITLEMENTS = Pane-ios-personal.entitlements", "PANE_APPLINKS_HOST = notes.kim.dev"]) {
    assertStringIncludes(local, line + "\n");
  }
  // A paid team replaces the free one; --no-team clears it; a new bundle id gets its own scheme.
  await run(dir, "make-it-yours.sh", "--team", "FGHIJ67890");
  assert(!(await Deno.readTextFile(`${dir}/Config/Identity.local.xcconfig`)).includes("PANE_IOS_ENTITLEMENTS"));
  await run(dir, "make-it-yours.sh", "--no-team", "--bundle-id", "org.example.pad");
  const last = await Deno.readTextFile(`${dir}/Config/Identity.local.xcconfig`);
  for (const line of ["PANE_IOS_TEAM = ", "PANE_URL_SCHEME = examplepad", "PANE_DISPLAY_NAME = Kim's Notes", "PANE_APPLINKS_HOST = notes.kim.dev"]) {
    assertStringIncludes(last, line + "\n");
  }
  // Both links domains follow the site.
  assertStringIncludes(local, "PANE_APPLINKS_ALIAS = notes.kim.dev\n");
  // The local backend's own database: the one line of a tracked file it changes.
  assertEquals((await run(dir, "make-it-yours.sh", "--project-id", "kimnotes")).code, 0);
  assertStringIncludes(await Deno.readTextFile(`${dir}/supabase/config.toml`), 'project_id = "kimnotes"\n');
  assertEquals((await run(dir, "make-it-yours.sh", "--project-id", "Kim Notes")).code, 1);
  // The site's rule for a URL scheme (web/lib/app-scheme.ts): no + or . in it.
  assertEquals((await run(dir, "make-it-yours.sh", "--url-scheme", "kim.notes")).code, 1);
} });

Deno.test({ name: "set-accent keeps your accent out of tracked files, and amber takes it out again", ignore: !onMac, fn: async () => {
  const dir = await copy();
  const palette = `${dir}/Pane/Editor/Palette.swift`, asset = `${dir}/Pane/Resources/Assets.xcassets/AccentColor.colorset/Contents.json`;
  const own = `${dir}/Pane/Resources/Assets.xcassets/AccentColorLocal.colorset/Contents.json`, local = `${dir}/Config/Identity.local.xcconfig`;
  const tracked = async () => [await Deno.readTextFile(palette), await Deno.readTextFile(asset)];
  const before = await tracked();
  assertEquals((await run(dir, "set-accent.sh", "1E7A4C", "5CC48A")).code, 1, "needs make-it-yours first");
  await run(dir, "make-it-yours.sh", "--bundle-id", "com.kim.notes");
  assertEquals((await run(dir, "set-accent.sh", "#1e7a4c", "5CC48A")).code, 0);
  assertStringIncludes(await Deno.readTextFile(local), "PANE_ACCENT = 1E7A4C 5CC48A\nPANE_ACCENT_ASSET = AccentColorLocal\n");
  const colors = JSON.parse(await Deno.readTextFile(own)).colors.map((c: { color: { components: Record<string, string> } }) =>
    ["red", "green", "blue"].map((k) => c.color.components[k].slice(2)).join(""));
  assertEquals(colors, ["1E7A4C", "5CC48A"]);
  assertEquals(await tracked(), before, "no tracked file changes");
  // Renaming keeps the accent; a second accent replaces the first.
  await run(dir, "make-it-yours.sh", "--name", "Kim's Notes");
  assertStringIncludes(await Deno.readTextFile(local), "PANE_ACCENT = 1E7A4C 5CC48A\n");
  await run(dir, "set-accent.sh", "2255AA", "88AAEE");
  assertEquals((await Deno.readTextFile(local)).match(/^PANE_ACCENT = /gm)?.length, 1);
  assertEquals((await run(dir, "set-accent.sh", "green")).code, 1);
  assertEquals((await run(dir, "set-accent.sh", "amber")).code, 0);
  assert(!(await Deno.readTextFile(local)).includes("PANE_ACCENT"));
  assert(!(await exists(own)));
  assertEquals(await tracked(), before);
} });

Deno.test({ name: "deploy-backend uses the site make-it-yours stored, so --site is given once", ignore: !onMac, fn: async () => {
  const dir = await copy();
  await run(dir, "make-it-yours.sh", "--bundle-id", "com.kim.notes", "--site", "https://notes.kim.dev");
  const r = await run(dir, "deploy-backend.sh", "abcdefghijklmnopqrst", "--dry-run");
  assertEquals(r.code, 0, r.text);
  assertStringIncludes(r.text, "site https://notes.kim.dev");
  // Upstream's links host is never taken for your site.
  const bare = await copy();
  assert(!(await run(bare, "deploy-backend.sh", "abcdefghijklmnopqrst", "--dry-run")).text.includes("site https://ambernotes.app"));
} });

Deno.test({ name: "make-it-yours refuses upstream's bundle id and a malformed team", ignore: !onMac, fn: async () => {
  const dir = await copy();
  assertEquals((await run(dir, "make-it-yours.sh", "--bundle-id", "dev.emilwagman.pane")).code, 1);
  assertEquals((await run(dir, "make-it-yours.sh", "--bundle-id", "com.kim.notes", "--team", "kim")).code, 1);
  assertEquals((await run(dir, "make-it-yours.sh", "--bundle-id", "notes")).code, 1);
  assert(!(await exists(`${dir}/Config/Identity.local.xcconfig`)));
} });

Deno.test({ name: "deploy-backend --dry-run deploys every function the app needs and changes nothing", ignore: !onMac, fn: async () => {
  const dir = await copy();
  await run(dir, "make-it-yours.sh", "--bundle-id", "com.kim.notes");
  const r = await run(dir, "deploy-backend.sh", "abcdefghijklmnopqrst", "--site", "https://notes.example.org", "--dry-run");
  assertEquals(r.code, 0, r.text);
  for (const f of ["mcp", "account", "account-status", "share-files", "key"]) {
    assertStringIncludes(r.text, `supabase functions deploy ${f} --project-ref abcdefghijklmnopqrst`);
  }
  // The key copies are on, and secrets are named, never printed.
  assertStringIncludes(r.text, "KEY_COPY KEY_COPY_SECRET_1 ACCOUNT_STATUS_SALT MCP_PROXY_SECRET RATE_HASH_SECRET");
  assertStringIncludes(r.text, "select count(*) from cron.job");
  assertStringIncludes(r.text, "MCP_PROXY_SECRET  the BACKEND_PROXY_SECRET in .secrets/backend-abcdefghijklmnopqrst.env");
  assertStringIncludes(r.text, "APP_PAGES_ONLY=1");
  assertStringIncludes(r.text, "SITE_URL  https://notes.example.org");
  assertStringIncludes(r.text, "add a connector with this address, https://abcdefghijklmnopqrst.supabase.co/functions/v1/mcp");
  assert(!r.text.includes("external_apple_enabled"), "no Sign in with Apple without a paid team");
  assertStringIncludes(r.text, "CONNECT_PAGE_URL");
  assert(!/KEY_COPY_SECRET_1=/.test(r.text));
  assertStringIncludes(r.text, "com.kim.notes (kimnotes://)");
  // Never the whole local config.toml (its Apple client id and site are upstream's), and sign-ups stay on.
  assert(!r.text.includes("config push"));
  assertStringIncludes(r.text, "disable_signup");
  assert(!(await exists(`${dir}/.secrets`)));
  assert(!(await exists(`${dir}/Config/Backend.local.xcconfig`)));
} });

Deno.test({ name: "deploy-backend --dry-run works before make-it-yours, with upstream's identity", ignore: !onMac, fn: async () => {
  const dir = await copy();
  const r = await run(dir, "deploy-backend.sh", "abcdefghijklmnopqrst", "--dry-run");
  assertEquals(r.code, 0, r.text);
  assertStringIncludes(r.text, "dev.emilwagman.pane (ambernotes://)");
  assertStringIncludes(r.text, "→ Done.");
} });

Deno.test({ name: "deploy-backend refuses production and a malformed ref", ignore: !onMac, fn: async () => {
  const dir = await copy();
  const prod = await run(dir, "deploy-backend.sh", "rodegaeruhyybqilrnpn", "--dry-run");
  assertEquals(prod.code, 1);
  assertStringIncludes(prod.text, "production");
  assertEquals((await run(dir, "deploy-backend.sh", "short", "--dry-run")).code, 1);
  assertEquals((await run(dir, "deploy-backend.sh", "abcdefghijklmnopqrst", "--site", "http://plain.example", "--dry-run")).code, 1);
} });
