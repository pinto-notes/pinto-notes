// An agent using pinto: `claude -p`, allowed only `pinto …` through Bash, against the local server
// (local_server.ts). Prints each command the agent ran with its output, then checks the note in
// Pinto Notes. Uses the Claude Code subscription on this machine; no API key.
//
//   deno run -A e2e/agent_demo.ts > e2e/agent-transcript.txt
const cli = new URL("..", import.meta.url).pathname;
const arch = Deno.build.arch === "aarch64" ? "arm64" : "x64";
const bin = `${cli}dist/pinto-${Deno.build.os === "darwin" ? "macos" : "linux"}-${arch}`;
const work = await Deno.makeTempDir({ prefix: "pinto-agent-" });
await Deno.mkdir(`${work}/bin`);
await Deno.symlink(bin, `${work}/bin/pinto`);

const l = Deno.listen({ port: 0, hostname: "127.0.0.1" });
const port = (l.addr as Deno.NetAddr).port;
l.close();
const origin = `http://127.0.0.1:${port}`;
const srv = new Deno.Command(Deno.execPath(), { args: ["run", "-A", `${cli}e2e/local_server.ts`, "--port", String(port)], stdout: "null", stderr: "null" }).spawn();
for (let i = 0; i < 240; i++) {
  try { if ((await fetch(`${origin}/__ready`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 250));
}
const env = {
  HOME: Deno.env.get("HOME")!, PATH: `${work}/bin:${Deno.env.get("PATH")}`, XDG_CONFIG_HOME: `${work}/config`,
  PINTO_SERVER: `${origin}/mcp`, PINTO_KEYCHAIN_SERVICE: "pinto-cli-agent", PINTO_BROWSER: `${cli}e2e/approve.sh`,
};
const run = async (cmd: string, args: string[], extra: Record<string, string> = {}) => {
  const o = await new Deno.Command(cmd, { args, env: { ...env, ...extra }, cwd: work, stdout: "piped", stderr: "piped" }).output();
  return new TextDecoder().decode(o.stdout) + new TextDecoder().decode(o.stderr);
};

console.log(`# An agent using pinto (${new Date().toISOString().slice(0, 16)}Z)\n`);
console.log("Signed in first with `pinto login` (approved through the local consent page). Then:\n");
const prompt = "My notes app is Pinto Notes, and the `pinto` command reads and edits my notes (start with `pinto help`). " +
  "Find my note about the Acme kickoff. Under Open questions, the rollout owner has been decided: replace the question about who owns the rollout " +
  "with a line saying Lee owns the rollout (decided 2026-10-06). Use pinto search and pinto edit, then read the note back to confirm.";
console.log(`$ claude -p --allowedTools 'Bash(pinto:*)' "${prompt}"\n`);
await run(bin, ["login"]);

const p = new Deno.Command("claude", {
  args: ["-p", prompt, "--allowedTools", "Bash(pinto:*)", "--output-format", "stream-json", "--verbose", "--max-turns", "12", "--strict-mcp-config"],
  // A clean environment: the Claude Code sign-in on this machine, never an API key from the parent.
  env: { ...env, USER: Deno.env.get("USER") ?? "", TERM: "dumb" }, clearEnv: true, cwd: work, stdout: "piped", stderr: "piped",
}).spawn();
const lines = (await new Response(p.stdout).text()).split("\n").filter(Boolean);
await p.status;
let commands = 0;
for (const raw of lines) {
  let m;
  try { m = JSON.parse(raw); } catch { continue; }
  for (const c of m.message?.content ?? []) {
    if (m.type === "assistant" && c.type === "tool_use") { console.log(`[agent runs] ${c.input.command}`); commands++; }
    if (m.type === "user" && c.type === "tool_result") {
      const t = Array.isArray(c.content) ? c.content.map((x: { text?: string }) => x.text ?? "").join("") : String(c.content);
      console.log(t.trimEnd().split("\n").map((x: string) => `  ${x}`).join("\n") + "\n");
    }
    if (m.type === "assistant" && c.type === "text" && c.text.trim()) console.log(`[agent says] ${c.text.trim()}\n`);
  }
  if (m.type === "result") console.log(`(${m.num_turns} turns, ${Math.round(m.duration_ms / 1000)} s)`);
}

console.log("\n## Checked from the other side\n");
const note = await run(bin, ["read", "Work/Clients/Acme.md"]);
console.log(`$ pinto read Work/Clients/Acme.md\n${note}`);
const history = await run(bin, ["history", "Work/Clients/Acme.md"]);
console.log(`$ pinto history Work/Clients/Acme.md\n${history}`);
const ok = /Lee owns the rollout/i.test(note) && !/Who owns the rollout\?/.test(note) && /Budget for Q1\?/.test(note);
console.log(`${ok ? "PASS" : "FAIL"} the agent changed only that line (${commands} pinto commands)`);

await run(bin, ["logout"]);
srv.kill("SIGTERM");
await srv.status;
await new Deno.Command("/usr/bin/security", { args: ["delete-generic-password", "-s", "pinto-cli-agent"], stdout: "null", stderr: "null" }).output().catch(() => {});
await Deno.remove(work, { recursive: true });
Deno.exit(ok ? 0 : 1);
