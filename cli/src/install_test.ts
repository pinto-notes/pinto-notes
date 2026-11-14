// install.sh against a local "release" (file:///…): it installs pinto, links amber (the old name)
// to it, and leaves an amber that isn't this tool alone. The binary is a stand-in shell script.
import { assertEquals, assertStringIncludes } from "@std/assert";

const script = new URL("../install.sh", import.meta.url).pathname;
const os = Deno.build.os === "darwin" ? "macos" : "linux";
const arch = Deno.build.arch === "aarch64" ? "arm64" : "x64";

async function release(): Promise<string> {
  const dir = await Deno.makeTempDir();
  const stage = await Deno.makeTempDir();
  await Deno.writeTextFile(`${stage}/pinto`, "#!/bin/sh\ncase \"$1\" in --version) echo 0.3.0 ;; *) echo 'pinto: your Pinto Notes from the terminal' ;; esac\n", { mode: 0o755 });
  const name = `pinto-${os}-${arch}.tar.gz`;
  const tar = await new Deno.Command("tar", { args: ["-czf", `${dir}/${name}`, "-C", stage, "pinto"], env: { COPYFILE_DISABLE: "1" } }).output();
  assertEquals(tar.success, true);
  const sum = new Uint8Array(await crypto.subtle.digest("SHA-256", await Deno.readFile(`${dir}/${name}`)));
  await Deno.writeTextFile(`${dir}/SHA256SUMS`, `${Array.from(sum, (b) => b.toString(16).padStart(2, "0")).join("")}  ${name}\n`);
  await Deno.remove(stage, { recursive: true });
  return dir;
}

const install = (env: Record<string, string>) =>
  new Deno.Command("sh", { args: [script], env: { PATH: Deno.env.get("PATH")!, HOME: Deno.env.get("HOME")!, ...env }, clearEnv: true, stdout: "piped", stderr: "piped" }).output();

Deno.test("install.sh: pinto, and amber as a link to it", async () => {
  const from = await release(), to = await Deno.makeTempDir();
  try {
    const o = await install({ PINTO_DOWNLOAD_BASE: `file://${from}`, PINTO_INSTALL_DIR: to });
    assertEquals(o.success, true, new TextDecoder().decode(o.stderr));
    assertStringIncludes(new TextDecoder().decode(o.stdout), `Installed pinto 0.3.0 to ${to}/pinto`);
    assertEquals(await Deno.readLink(`${to}/amber`), "pinto");
    const viaOldName = await new Deno.Command(`${to}/amber`, { args: ["--version"], stdout: "piped" }).output();
    assertEquals(new TextDecoder().decode(viaOldName.stdout).trim(), "0.3.0");
    // Again, with the old setting names: the link is kept, nothing breaks.
    const again = await install({ AMBER_DOWNLOAD_BASE: `file://${from}`, AMBER_INSTALL_DIR: to });
    assertEquals(again.success, true, new TextDecoder().decode(again.stderr));
    assertEquals(await Deno.readLink(`${to}/amber`), "pinto");
  } finally {
    await Deno.remove(from, { recursive: true });
    await Deno.remove(to, { recursive: true });
  }
});

Deno.test("install.sh: another tool's amber stays", async () => {
  const from = await release(), to = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${to}/amber`, "#!/bin/sh\necho 'Amber - a Crystal web framework'\n", { mode: 0o755 });
    const o = await install({ PINTO_DOWNLOAD_BASE: `file://${from}`, PINTO_INSTALL_DIR: to });
    assertEquals(o.success, true, new TextDecoder().decode(o.stderr));
    assertStringIncludes(await Deno.readTextFile(`${to}/amber`), "Crystal");
  } finally {
    await Deno.remove(from, { recursive: true });
    await Deno.remove(to, { recursive: true });
  }
});
