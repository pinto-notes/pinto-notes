// Single binaries for macOS and Linux, Apple silicon / arm64 and Intel / x64, in cli/dist/, each
// also packed as pinto-<os>-<arch>.tar.gz (holding one file, pinto; install.sh adds amber, its old
// name, as a link) for downloads, with SHA256SUMS of the archives for install.sh and the formula.
//   deno task compile                     every target
//   deno task compile pinto-macos-arm64   one
const targets = [
  ["x86_64-unknown-linux-gnu", "pinto-linux-x64"],
  ["aarch64-unknown-linux-gnu", "pinto-linux-arm64"],
  ["aarch64-apple-darwin", "pinto-macos-arm64"],
  ["x86_64-apple-darwin", "pinto-macos-x64"],
].filter(([, name]) => !Deno.args.length || Deno.args.includes(name));
const root = new URL("..", import.meta.url).pathname;
const run = async (cmd: string, args: string[], cwd = root) => {
  // COPYFILE_DISABLE and --no-xattrs: no macOS metadata in the archives (GNU tar warns about it).
  const out = await new Deno.Command(cmd, { args, cwd, env: { COPYFILE_DISABLE: "1" }, stdout: "inherit", stderr: "inherit" }).output();
  if (!out.success) Deno.exit(out.code || 1);
};
const sums: string[] = [];
for (const [target, name] of targets) {
  await run(Deno.execPath(), ["compile", "--no-lock", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-run", "--target", target, "--output", `dist/${name}`, "main.ts"]);
  const stage = await Deno.makeTempDir();
  await Deno.copyFile(`${root}dist/${name}`, `${stage}/pinto`);
  await Deno.chmod(`${stage}/pinto`, 0o755);
  await run("tar", ["--no-xattrs", "--no-mac-metadata", "-czf", `${root}dist/${name}.tar.gz`, "-C", stage, "pinto"]);
  await Deno.remove(stage, { recursive: true });
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", await Deno.readFile(`${root}dist/${name}.tar.gz`)));
  sums.push(`${Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("")}  ${name}.tar.gz`);
}
await Deno.writeTextFile(`${root}dist/SHA256SUMS`, sums.join("\n") + "\n");
