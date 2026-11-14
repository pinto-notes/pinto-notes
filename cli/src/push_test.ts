// pinto push against a stand-in for the server's file tools, with the rules that matter here: an app
// path needs a note with an app (create makes one, starter files included and counted as read), a
// file is replaced only after it was read, text sent as text stays text, /index.html can't be
// deleted, and the server's refusals come back as ToolFailed.
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { ToolFailed } from "./client.ts";
import type { LocalFile } from "./files.ts";
import { noteBase, push, PushFailed } from "./push.ts";

const te = new TextEncoder();
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const STARTER = ["/index.html", "/README.md", "/src/App.tsx", "/src/main.tsx", "/tests/app.test.tsx"];

function server(o: { refuse?: (path: string, bytes: Uint8Array) => string | null } = {}) {
  const apps = new Map<string, Map<string, Uint8Array>>(); // "Games/Doom.app" → files
  const read = new Set<string>();
  const calls: { tool: string; args: Record<string, any> }[] = [];
  const split = (p: string) => { const i = p.indexOf(".app/"); return [p.slice(0, i + 4), p.slice(i + 4)]; };
  const mcp = {
    call(tool: string, args: Record<string, any> = {}): Promise<any> {
      calls.push({ tool, args });
      const r = (() => {
        if (tool === "list") {
          const files = apps.get(String(args.path).replace(/\/$/, ""));
          if (!files) throw new ToolError(`"${String(args.path).replace(/\.app$/, ".md")}" has no app. Make one with create { type: "app", path: … }.`);
          return { path: `${args.path}/`, files: [...[...files.keys()].sort().map((f) => ({ path: `${args.path}${f}`, lines: 1 })), { path: `${args.path}/data.json`, what: "the app's data" }] };
        }
        if (tool === "create") {
          const app = String(args.path).replace(/\.md$/, ".app");
          if (apps.has(app)) throw new ToolError("already has an app");
          apps.set(app, new Map(STARTER.map((f) => [f, te.encode(`starter ${f}`)])));
          for (const f of STARTER) read.add(app + f);
          return { app: `${app}/`, next: "Read README.md" };
        }
        const [app, file] = split(String(args.id ?? args.path));
        const files = apps.get(app);
        if (!files) throw new ToolError(`No app at "${app}".`);
        if (tool === "fetch") { if (!files.has(file)) throw new ToolError(`No ${app}${file}.`); read.add(app + file); return { id: app + file, text: "     1\t…" }; }
        if (tool === "delete") {
          if (file === "/index.html") throw new ToolError("/index.html is the page the app opens; it can't be deleted.");
          files.delete(file);
          return { saved: app + file, live: "Live: the person's devices run this version." };
        }
        if (tool === "write") {
          const bytes = typeof args.content_base64 === "string" ? fromBase64(args.content_base64) : te.encode(args.content);
          if (files.has(file) && !read.has(app + file)) throw new ToolError(`Read ${app}${file} first.`);
          const refused = o.refuse?.(file, bytes);
          if (refused) throw new ToolError(refused);
          if (typeof args.content === "string" && files.has(file) && new TextDecoder().decode(files.get(file)) === args.content) return { path: app + file, unchanged: true };
          files.set(file, bytes);
          read.add(app + file);
          return { saved: app + file, live: "Live: the person's devices run this version.", files: files.size };
        }
        throw new Error(`unexpected ${tool}`);
      })();
      return Promise.resolve(r);
    },
  };
  return { mcp, apps, calls };
}
class ToolError extends ToolFailed {}

// Doom's shape: a page, its scripts, a 438 KB wasm and a 4 MB game file (both binary).
const wasm = new Uint8Array(438_214).map((_, i) => i === 0 ? 0 : (i * 31) & 0xff);
const wad = new Uint8Array(4_196_020).map((_, i) => (i * 7) & 0xff);
const doom: LocalFile[] = [
  { path: "/README.md", bytes: te.encode("# Doom\n") },
  { path: "/doom.js", bytes: te.encode("// emscripten glue\n") },
  { path: "/doom.wasm", bytes: wasm },
  { path: "/doom1.wad", bytes: wad },
  { path: "/index.html", bytes: te.encode("<!doctype html><canvas></canvas><script src=main.js></script>") },
  { path: "/main.js", bytes: te.encode("fetch('/doom1.wad')\n") },
];

Deno.test("a note's name, however it's written", () => {
  for (const n of ["Games/Doom", "Games/Doom.md", "Games/Doom.app", "Games/Doom.app/", " Games/Doom "]) assertEquals(noteBase(n), "Games/Doom");
});

Deno.test("push into a note with no app: create, every file written, the starter's leftovers deleted", async () => {
  const s = server();
  const r = await push(s.mcp, doom, "Games/Doom");
  assertEquals(r.app, "Games/Doom.app");
  assertEquals(r.created_app, true);
  assertEquals(s.calls.slice(0, 3).map((c) => c.tool), ["list", "create", "list"]);
  assertEquals(s.calls[1].args, { type: "app", path: "Games/Doom.md" });
  // The files the folder has: written, binary as base64, text as text, index.html last.
  const writes = s.calls.filter((c) => c.tool === "write");
  assertEquals(writes.map((c) => c.args.path), ["/README.md", "/doom.js", "/doom.wasm", "/doom1.wad", "/main.js", "/index.html"].map((p) => `Games/Doom.app${p}`));
  for (const w of writes) assertEquals(typeof (/\.(wasm|wad)$/.test(w.args.path) ? w.args.content_base64 : w.args.content), "string", w.args.path);
  // The starter's index.html and README.md were read by create; nothing else needed a read.
  assertEquals(s.calls.filter((c) => c.tool === "fetch").map((c) => c.args.id), ["Games/Doom.app/README.md", "Games/Doom.app/index.html"]);
  assertEquals(s.calls.filter((c) => c.tool === "delete").map((c) => c.args.path), ["/src/App.tsx", "/src/main.tsx", "/tests/app.test.tsx"].map((p) => `Games/Doom.app${p}`));
  // What the app holds is the folder, byte for byte.
  const app = s.apps.get("Games/Doom.app")!;
  assertEquals([...app.keys()].sort(), doom.map((f) => f.path));
  for (const f of doom) assertEquals(app.get(f.path), f.bytes, f.path);
  assertEquals(r.steps.map((x) => `${x.did} ${x.path}${x.binary ? " (binary)" : ""}`), [
    "replaced /README.md", "created /doom.js", "created /doom.wasm (binary)", "created /doom1.wad (binary)", "created /main.js", "replaced /index.html",
    "deleted /src/App.tsx", "deleted /src/main.tsx", "deleted /tests/app.test.tsx",
  ]);
  assertEquals(r.last?.live, "Live: the person's devices run this version.");
});

Deno.test("push again: each file is read before it's replaced; unchanged text stays as it is; nothing deleted", async () => {
  const s = server();
  await push(s.mcp, doom, "Games/Doom.md");
  s.calls.length = 0;
  const r = await push(s.mcp, doom, "Games/Doom.md");
  assertEquals(r.created_app, false);
  const tools = s.calls.map((c) => c.tool);
  assertEquals(tools.filter((t) => t === "fetch").length, 6);
  assertEquals(tools.includes("delete") || tools.includes("create"), false);
  // Each write comes right after the read of the same file.
  for (const [i, c] of s.calls.entries()) if (c.tool === "write") assertEquals(s.calls[i - 1], { tool: "fetch", args: { id: c.args.path, limit: 1 } });
  assertEquals(r.steps.filter((x) => x.did === "unchanged").map((x) => x.path), ["/README.md", "/doom.js", "/main.js", "/index.html"]);
  assertEquals(r.steps.filter((x) => x.did === "replaced").map((x) => x.path), ["/doom.wasm", "/doom1.wad"]);
});

Deno.test("a folder without index.html isn't an app; data.json stays the app's data", async () => {
  const s = server();
  await assertRejects(() => push(s.mcp, doom.filter((f) => f.path !== "/index.html"), "Games/Doom"), PushFailed, "no index.html");
  assertEquals(s.calls.length, 0);
  const r = await push(s.mcp, [...doom, { path: "/data.json", bytes: te.encode("{}") }], "Games/Doom");
  assertEquals(r.skipped, ["/data.json"]);
  assertEquals(s.calls.some((c) => String(c.args.path ?? c.args.id).endsWith("/data.json")), false);
});

Deno.test("over a limit: the file, the server's own words, and what was already saved", async () => {
  const words = "Not saved:\n- /doom1.wad is 9000 KB stored (compressed); a file can be at most 8 MB.";
  const s = server({ refuse: (path) => path === "/doom1.wad" ? words : null });
  const e = await assertRejects(() => push(s.mcp, doom, "Games/Doom"), PushFailed);
  assertStringIncludes(e.message, `Games/Doom.app/doom1.wad: ${words}`);
  assertStringIncludes(e.message, "(3 changes before it were saved; each is in the app's history.)");
});

Deno.test("a refusal from create (a locked or shared note) comes back as the server said it", async () => {
  const s = server();
  s.mcp.call = ((tool: string) => Promise.reject(new ToolError(tool === "create" ? '"Doom" is shared with other people, and shared notes can\'t have apps yet.' : "has no app"))) as typeof s.mcp.call;
  await assertRejects(() => push(s.mcp, doom, "Games/Doom"), ToolFailed, "shared notes can't have apps yet");
});
