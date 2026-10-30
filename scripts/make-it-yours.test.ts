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
  for (const d of ["scripts", "Config"]) await Deno.mkdir(`${dir}/${d}`);
  for (const f of ["scripts/make-it-yours.sh", "scripts/deploy-backend.sh", "Config/Identity.xcconfig"]) {
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
  assertStringIncludes(r.text, "KEY_COPY KEY_COPY_SECRET_1 ACCOUNT_STATUS_SALT");
  assertStringIncludes(r.text, "CONNECT_PAGE_URL");
  assert(!/KEY_COPY_SECRET_1=/.test(r.text));
  assertStringIncludes(r.text, "com.kim.notes (kimnotes://)");
  // Never the whole local config.toml (its Apple client id and site are upstream's), and sign-ups stay on.
  assert(!r.text.includes("config push"));
  assertStringIncludes(r.text, "disable_signup");
  assert(!(await exists(`${dir}/.secrets`)));
  assert(!(await exists(`${dir}/Config/Backend.local.xcconfig`)));
} });

Deno.test({ name: "deploy-backend refuses production and a malformed ref", ignore: !onMac, fn: async () => {
  const dir = await copy();
  const prod = await run(dir, "deploy-backend.sh", "rodegaeruhyybqilrnpn", "--dry-run");
  assertEquals(prod.code, 1);
  assertStringIncludes(prod.text, "production");
  assertEquals((await run(dir, "deploy-backend.sh", "short", "--dry-run")).code, 1);
  assertEquals((await run(dir, "deploy-backend.sh", "abcdefghijklmnopqrst", "--site", "http://plain.example", "--dry-run")).code, 1);
} });
