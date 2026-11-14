// End to end: the compiled pinto pushes a web project (Doom by default) into a note of the local
// test account, and every file is then checked from the other side through the MCP read tools
// (list, fetch with raw: true): there, with the same size and SHA-256. Also: a second push changes
// only the binary files, pinto write --file round-trips one file, the old name amber still works,
// and what the server says about a file over its limit. Local only: local_server.ts (the real MCP
// server on in-process Postgres with every migration), nothing remote. Prints a transcript; exits
// non-zero if a check fails.
//
//   deno task compile pinto-macos-arm64 && deno run -A e2e/push.ts [--project <folder>]
import { parseArgs } from "@std/cli/parse-args";
import { readFolder } from "../src/files.ts";

const args = parseArgs(Deno.args, { string: ["project", "bin"] });
const cli = new URL("..", import.meta.url).pathname;
const arch = Deno.build.arch === "aarch64" ? "arm64" : "x64";
const bin = args.bin ?? `${cli}dist/pinto-${Deno.build.os === "darwin" ? "macos" : "linux"}-${arch}`;
const project = args.project ?? `${Deno.env.get("HOME")}/content-tools/projects/pinto-doom/2026-11-15-sound/project`;
const work = await Deno.makeTempDir({ prefix: "pinto-push-e2e-" });
const port = 20000 + Math.floor(Math.random() * 20000);
const server = `http://127.0.0.1:${port}/mcp`;
let failed = 0;
const say = (s = "") => console.log(s);
const check = (ok: boolean, what: string) => { say(`  ${ok ? "PASS" : "FAIL"} ${what}`); if (!ok) failed++; };
const sha = async (b: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource)), (x) => x.toString(16).padStart(2, "0")).join("");
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// The server, as a child process this script started (stopped by its own handle at the end).
const child = new Deno.Command(Deno.execPath(), { args: ["run", "-A", `${cli}e2e/local_server.ts`, "--port", String(port), "--token-file", `${work}/token`], stdout: "null", stderr: "piped" }).spawn();
try {
  for (let i = 0; i < 240; i++) {
    if (await fetch(`http://127.0.0.1:${port}/__ready`).then((r) => r.text()).catch(() => null) === "ok") break;
    await new Promise((r) => setTimeout(r, 250));
  }
  const token = (await Deno.readTextFile(`${work}/token`)).trim();
  const base = { HOME: Deno.env.get("HOME")!, PATH: Deno.env.get("PATH")!, XDG_CONFIG_HOME: `${work}/config`, PINTO_NO_KEYCHAIN: "1", NO_COLOR: "1" };
  const env = { ...base, PINTO_SERVER: server, PINTO_TOKEN: token };
  const run = async (argv: string[], o: { as?: string; env?: Record<string, string> } = {}) => {
    say(`$ ${o.as ?? "pinto"} ${argv.map((a) => /[\s"']/.test(a) ? JSON.stringify(a) : a).join(" ").replaceAll(work, ".").replaceAll(project, "<doom project>")}`);
    const t = performance.now();
    const p = await new Deno.Command(o.as ? `${work}/bin/${o.as}` : bin, { args: argv, env: o.env ?? env, clearEnv: true, stdout: "piped", stderr: "piped" }).output();
    const out = new TextDecoder().decode(p.stdout).replaceAll(token, "<token>"), err = new TextDecoder().decode(p.stderr).replaceAll(token, "<token>");
    if (out.trim()) say(out.trimEnd().replaceAll(work, ".").replaceAll(project, "<doom project>").split("\n").map((l) => `  ${l}`).join("\n"));
    if (err.trim()) say(err.trimEnd().split("\n").map((l) => `  (stderr) ${l}`).join("\n"));
    return { code: p.code, out, err, ms: performance.now() - t };
  };

  // The checker: the MCP read tools, called directly (raw: true answers with the bytes as a resource).
  let session: string | null = null, id = 0;
  const rpc = async (method: string, params?: unknown) => {
    const res = await fetch(server, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json, text/event-stream", ...(session ? { "mcp-session-id": session, "mcp-protocol-version": "2025-06-18" } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
    session = res.headers.get("mcp-session-id") ?? session;
    return (await res.json()).result;
  };
  await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "push-e2e-checker", version: "1" } });
  const tool = async (name: string, a: Record<string, unknown>) => {
    const r = await rpc("tools/call", { name, arguments: a });
    if (r.isError) throw new Error(r.content?.[0]?.text);
    return r;
  };
  /** The app's files as the server holds them: path → bytes (binary: raw; text: read in parts,
   *  line numbers off). fetch shows at most 4,000 characters of a line: such a file is "cut", and
   *  its lines are counted instead (the second push checks its text exactly). */
  const served = async (app: string) => {
    const list = (await tool("list", { path: app, limit: 1000 })).structuredContent.files.filter((f: { what?: string }) => !f.what);
    const got = new Map<string, { bytes: Uint8Array; binary: boolean; lines?: number; cut?: boolean }>();
    for (const f of list) {
      const r = await tool("fetch", { id: f.path, raw: true });
      const blob = r.content.find((c: { type: string }) => c.type === "resource")?.resource?.blob;
      if (blob) { got.set(f.path.slice(app.length), { bytes: fromBase64(blob), binary: true }); continue; }
      const parts: string[] = [];
      for (let offset = 1; ;) {
        const m = (await tool("fetch", { id: f.path, offset })).structuredContent;
        parts.push(m.text);
        const next = String(m.metadata?.truncated ?? "").match(/offset (\d+)/);
        if (!next) break;
        offset = Number(next[1]);
      }
      const text = parts.join("\n");
      got.set(f.path.slice(app.length), { bytes: new TextEncoder().encode(text.split("\n").map((l) => l.replace(/^ *\d+\t/, "")).join("\n")), binary: false, lines: f.lines, cut: text.includes("… (line cut)") });
    }
    return got;
  };

  const local = await readFolder(project);
  say(`# pinto push, end to end (${new Date().toISOString().slice(0, 16)}Z), against local_server.ts on 127.0.0.1:${port}\n`);
  say(`The folder: ${local.map((f) => `${f.path.slice(1)} (${f.bytes.length} B)`).join(", ")}\n`);

  say("## A note that doesn't exist yet becomes Doom\n");
  const first = await run(["push", project, "Games/Doom"]);
  check(first.code === 0, `push exits 0 (${(first.ms / 1000).toFixed(1)} s)`);
  const app = await served("Games/Doom.app");
  check(app.size === local.length, `the app has ${app.size} files; the folder has ${local.length}`);
  const cut: string[] = [];
  for (const f of local) {
    const there = app.get(f.path);
    const lines = new TextDecoder().decode(f.bytes).split("\n").length;
    if (there?.cut) {
      cut.push(f.path);
      check(there.lines === lines, `${f.path.slice(1)}: text, ${lines} lines there and here (a line over 4,000 characters: fetch shows it cut; checked exactly below)`);
      continue;
    }
    const same = !!there && there.bytes.length === f.bytes.length && await sha(there.bytes) === await sha(f.bytes);
    check(same, `${f.path.slice(1)}: ${there?.binary ? "binary" : "text"}, ${f.bytes.length} bytes, sha256 ${(await sha(f.bytes)).slice(0, 12)}… ${same ? "same there" : `differs (${there?.bytes.length ?? "missing"} bytes there)`}`);
  }
  const listing = await run(["list", "Games/Doom.app"]);
  check(/doom1\.wad/.test(listing.out), "pinto list shows the app's files");

  say("\n## The same folder again\n");
  const again = await run(["push", project, "Games/Doom"]);
  check(again.code === 0 && /0 created/.test(again.out) && /0 deleted/.test(again.out), "nothing created or deleted");
  // The server compares a text file it's sent with what it holds, exactly, and answers unchanged.
  const texts = local.filter((f) => !/\.(wasm|wad)$/.test(f.path)).map((f) => f.path);
  check(texts.every((p) => new RegExp(`unchanged +${p.replace(/[.]/g, "\\.")} `).test(again.out)), `the server holds every text file exactly as sent (${texts.length} answered unchanged, ${cut.map((p) => p.slice(1)).join(", ") || "none"} among them)`);

  say("\n## One file: pinto write --file, after pinto read\n");
  await run(["read", "Games/Doom.app/doom.wasm"]);
  const wasm = local.find((f) => f.path === "/doom.wasm")!;
  await Deno.writeFile(`${work}/doom.wasm`, wasm.bytes);
  const w = await run(["write", "Games/Doom.app/doom.wasm", "--file", `${work}/doom.wasm`]);
  check(w.code === 0, "write --file exits 0");
  const back = (await served("Games/Doom.app")).get("/doom.wasm")!.bytes;
  check(await sha(back) === await sha(wasm.bytes), `doom.wasm read back raw: ${back.length} bytes, same hash`);

  say("\n## The old name\n");
  await Deno.mkdir(`${work}/bin`);
  await Deno.symlink(bin, `${work}/bin/amber`);
  const old = await run(["status"], { as: "amber", env: { ...base, AMBER_TOKEN: token, AMBER_SERVER: server } });
  check(old.code === 0 && /AMBER_TOKEN/.test(old.out), "amber status works, with AMBER_TOKEN and AMBER_SERVER");

  say("\n## Over a limit: what the server says\n");
  await Deno.mkdir(`${work}/big`);
  await Deno.writeTextFile(`${work}/big/index.html`, "<!doctype html><p>big</p>");
  // 9 MB that doesn't compress (random bytes): over the 8 MB a file can be once stored.
  const big = new Uint8Array(9 * 1024 * 1024);
  for (let i = 0; i < big.length; i += 65536) crypto.getRandomValues(big.subarray(i, i + 65536));
  await Deno.writeFile(`${work}/big/data.bin`, big);
  const over = await run(["push", `${work}/big`, "Games/Big"]);
  check(over.code === 1 && /data\.bin/.test(over.err) && /at most/.test(over.err), "refused, naming the file and the limit in the server's words");
} finally {
  child.kill("SIGTERM");
  await child.status;
  await Deno.remove(work, { recursive: true }).catch(() => {});
}
say(`\n${failed ? `${failed} FAILED` : "All checks passed."}`);
Deno.exit(failed ? 1 : 0);
