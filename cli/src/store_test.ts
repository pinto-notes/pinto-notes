import { assert, assertEquals } from "@std/assert";

const dir = await Deno.makeTempDir();
Deno.env.set("XDG_CONFIG_HOME", dir);
const tag = crypto.randomUUID().slice(0, 8);
// The old name's setting, read when the new one isn't set: pinto-cli-unit-… and, for amber's
// sign-ins, amber-cli-unit-….
Deno.env.set("AMBER_KEYCHAIN_SERVICE", `pinto-cli-unit-${tag}`);
const store = await import("./store.ts");
const CREDS = { access_token: "amb_at_x", refresh_token: "amb_rt_y", expires_at: 1, client_id: "c" };

const noKeychain = async (fn: () => Promise<void>) => {
  Deno.env.set("PINTO_NO_KEYCHAIN", "1");
  try { await fn(); } finally { Deno.env.delete("PINTO_NO_KEYCHAIN"); }
};

Deno.test("credentials on Linux (and with PINTO_NO_KEYCHAIN): a file only you can read", () => noKeychain(async () => {
  await store.saveCredentials("https://a", CREDS);
  await store.saveCredentials("https://b", { access_token: "pane_z" });
  assertEquals(await store.loadCredentials("https://a"), CREDS);
  assertEquals((await Deno.stat(`${dir}/pinto/credentials.json`)).mode! & 0o777, 0o600);
  assertEquals((await Deno.stat(`${dir}/pinto`)).mode! & 0o777, 0o700);
  await store.deleteCredentials("https://a");
  assertEquals(await store.loadCredentials("https://a"), null);
  assertEquals(await store.loadCredentials("https://b"), { access_token: "pane_z" });
  await store.deleteCredentials("https://b");
}));

Deno.test("what amber saved is read until pinto has its own, and signing out removes both", () => noKeychain(async () => {
  await Deno.mkdir(`${dir}/amber`, { recursive: true, mode: 0o700 });
  await Deno.writeTextFile(`${dir}/amber/credentials.json`, JSON.stringify({ [store.OLD_DEFAULT_SERVER]: CREDS }), { mode: 0o600 });
  await Deno.writeTextFile(`${dir}/amber/config.json`, JSON.stringify({ server: "http://127.0.0.1:8787/mcp" }));
  try {
    assertEquals(await store.loadCredentials(store.OLD_DEFAULT_SERVER), CREDS);
    assertEquals((await store.loadConfig()).server, "http://127.0.0.1:8787/mcp");
    // Signed in only at the old address: that's where pinto goes.
    assertEquals(await store.defaultServer(), store.OLD_DEFAULT_SERVER);
    await store.saveCredentials(store.DEFAULT_SERVER, { ...CREDS, access_token: "amb_at_new" });
    assertEquals(await store.defaultServer(), store.DEFAULT_SERVER);
    await store.saveConfig({});
    assertEquals(await store.loadConfig(), {});
    await store.deleteCredentials(store.OLD_DEFAULT_SERVER);
    assertEquals(await store.loadCredentials(store.OLD_DEFAULT_SERVER), null);
    assertEquals(JSON.parse(await Deno.readTextFile(`${dir}/amber/credentials.json`)), {});
  } finally {
    await store.deleteCredentials(store.DEFAULT_SERVER);
    await Deno.remove(`${dir}/amber`, { recursive: true });
    await Deno.remove(`${dir}/pinto/config.json`).catch(() => {});
  }
  assertEquals(await store.defaultServer(), store.DEFAULT_SERVER);
}));

Deno.test({ name: "credentials on macOS: the Keychain, nothing on disk", ignore: Deno.build.os !== "darwin", fn: async () => {
  await store.saveCredentials("https://k", CREDS);
  try {
    assertEquals(await store.loadCredentials("https://k"), CREDS);
    await store.saveCredentials("https://k", { ...CREDS, access_token: "amb_at_2" });
    assertEquals((await store.loadCredentials("https://k"))?.access_token, "amb_at_2");
    const onDisk = await Array.fromAsync(Deno.readDir(`${dir}/pinto`)).catch(() => []);
    for (const f of onDisk) assert(!(await Deno.readTextFile(`${dir}/pinto/${f.name}`).catch(() => "")).includes("amb_at_2"));
  } finally {
    await store.deleteCredentials("https://k");
  }
  assertEquals(await store.loadCredentials("https://k"), null);
} });

Deno.test({ name: "on macOS, amber's Keychain item is read and removed too", ignore: Deno.build.os !== "darwin", fn: async () => {
  const old = `amber-cli-unit-${tag}`;
  const value = btoa(JSON.stringify(CREDS));
  const sec = (...args: string[]) => new Deno.Command("/usr/bin/security", { args, stdout: "null", stderr: "null" }).output();
  await sec("add-generic-password", "-U", "-s", old, "-a", "https://old", "-w", value);
  try {
    assertEquals(await store.loadCredentials("https://old"), CREDS);
    await store.deleteCredentials("https://old");
    assertEquals(await store.loadCredentials("https://old"), null);
    assertEquals((await sec("find-generic-password", "-s", old, "-a", "https://old")).success, false);
  } finally {
    await sec("delete-generic-password", "-s", old, "-a", "https://old");
  }
} });

Deno.test("the refresh lock lets one holder in at a time", async () => {
  const order: string[] = [];
  const holder = (n: number) => store.withLock(async () => { order.push(`in ${n}`); await new Promise((r) => setTimeout(r, 30)); order.push(`out ${n}`); });
  // Separate processes are what matter; flock is per open file, so two opens in one process exercise it too.
  await Promise.all([holder(1), holder(2)]);
  assertEquals(order.length, 4);
  assert(order[1].startsWith("out") && order[2].startsWith("in"), order.join(", "));
});
