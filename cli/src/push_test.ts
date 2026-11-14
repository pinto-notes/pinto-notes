// pinto push against a stand-in for the server's file tools, with the rules that matter here: an app
// path needs a note with an app (create makes one, starter files included and counted as read), a
// file is replaced only after it was read, text sent as text stays text, /index.html can't be
// deleted, and the server's refusals come back as ToolFailed.
import { assert, assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { ToolFailed } from "./client.ts";
import type { LocalFile } from "./files.ts";
import { noteBase, push, PushFailed, WRITE_BYTES } from "./push.ts";

const te = new TextEncoder();
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const STARTER = ["/index.html", "/README.md", "/src/App.tsx", "/src/main.tsx", "/tests/app.test.tsx"];

function server(o: { refuse?: (path: string, bytes: Uint8Array) => string | null } = {}) {
  const apps = new Map<string, Map<string, Uint8Array>>(); // "Games/Doom.app" → files
  const read = new Set<string>();
  const staged = new Map<string, Uint8Array>();
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
        if (tool === "write" && Array.isArray(args.files)) {
          // Several files in one save: all of them or none.
          const app = String(args.path).replace(/\/$/, "");
          const files = apps.get(app);
          if (!files) throw new ToolError(`No app at "${app}".`);
          const next = new Map(files);
          const done: { path: string; did: string }[] = [];
          for (const f of args.files as Record<string, any>[]) {
            const file = String(f.path).startsWith("/") ? f.path : `/${f.path}`;
            const had = next.get(file);
            if (f.delete) {
              if (file === "/index.html") throw new ToolError("/index.html is the page the app opens; it can't be deleted. Nothing was saved.");
              next.delete(file);
              done.push({ path: app + file, did: "deleted" });
              continue;
            }
            if (had && !read.has(app + file)) throw new ToolError(`Read ${app}${file} first. Nothing was saved.`);
            let bytes = typeof f.content_base64 === "string" ? fromBase64(f.content_base64) : te.encode(f.content);
            if (f.offset !== undefined) {
              const got = staged.get(app + file) ?? new Uint8Array(f.size);
              got.set(bytes, f.offset);
              if (f.offset + bytes.length !== f.size) throw new ToolError(`${app}${file} isn't complete. Nothing was saved.`);
              bytes = got;
              staged.delete(app + file);
            }
            const refused = o.refuse?.(file, bytes);
            if (refused) throw new ToolError(`${refused} Nothing was saved.`);
            const same = had && had.length === bytes.length && had.every((b, i) => b === bytes[i]);
            next.set(file, bytes);
            done.push({ path: app + file, did: same ? "unchanged" : had ? "replaced" : "created" });
          }
          if (done.every((d) => d.did === "unchanged")) return { saved: `${app}/`, unchanged: true, files: done };
          apps.set(app, next);
          for (const d of done) if (d.did !== "deleted") read.add(d.path);
          return { saved: `${app}/`, files: done, live: "Live: the person's devices run this version." };
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
        if (tool === "write" && args.offset !== undefined) {
          // A piece: kept until the last one comes (here, always in a files write).
          if (files.has(file) && !read.has(app + file)) throw new ToolError(`Read ${app}${file} first.`);
          const got = staged.get(app + file) ?? new Uint8Array(args.size);
          got.set(fromBase64(args.content_base64), args.offset);
          staged.set(app + file, got);
          return { path: app + file, saved: false };
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
  // One write: the files the folder has (binary as base64, text as text), the starter's leftovers
  // deleted, index.html last.
  const writes = s.calls.filter((c) => c.tool === "write");
  assertEquals(writes.length, 1);
  assertEquals(r.writes, 1);
  assertEquals(writes[0].args.path, "Games/Doom.app");
  const sent = writes[0].args.files as Record<string, any>[];
  assertEquals(sent.map((f) => `${f.delete ? "delete " : ""}${f.path}`), ["/README.md", "/doom.js", "/doom.wasm", "/doom1.wad", "/main.js", "delete /src/App.tsx", "delete /src/main.tsx", "delete /tests/app.test.tsx", "/index.html"]);
  for (const f of sent.filter((x) => !x.delete)) assertEquals(typeof (/\.(wasm|wad)$/.test(f.path) ? f.content_base64 : f.content), "string", f.path);
  // The starter's index.html and README.md were read by create; nothing else needed a read.
  assertEquals(s.calls.filter((c) => c.tool === "fetch").map((c) => c.args.id), ["Games/Doom.app/README.md", "Games/Doom.app/index.html"]);
  assertEquals(s.calls.some((c) => c.tool === "delete"), false);
  // What the app holds is the folder, byte for byte.
  const app = s.apps.get("Games/Doom.app")!;
  assertEquals([...app.keys()].sort(), doom.map((f) => f.path));
  for (const f of doom) assertEquals(app.get(f.path), f.bytes, f.path);
  assertEquals(r.steps.map((x) => `${x.did} ${x.path}${x.binary ? " (binary)" : ""}`), [
    "replaced /README.md", "created /doom.js", "created /doom.wasm (binary)", "created /doom1.wad (binary)", "created /main.js",
    "deleted /src/App.tsx", "deleted /src/main.tsx", "deleted /tests/app.test.tsx", "replaced /index.html",
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
  // Every file read, then one write; the server says nothing changed, so nothing was saved.
  assertEquals(tools, ["list", ...doom.map(() => "fetch"), "write"]);
  assertEquals(r.steps.every((x) => x.did === "unchanged"), true);
  assertEquals(r.last, null);
  // One changed file: still one write, the rest unchanged.
  s.calls.length = 0;
  const changed = doom.map((f) => f.path === "/main.js" ? { ...f, bytes: te.encode("fetch('/doom1.wad'); // 2\n") } : f);
  const again = await push(s.mcp, changed, "Games/Doom.md");
  assertEquals(s.calls.filter((c) => c.tool === "write").length, 1);
  assertEquals(again.steps.filter((x) => x.did !== "unchanged").map((x) => `${x.did} ${x.path}`), ["replaced /main.js"]);
});

Deno.test("a file bigger than one write goes in pieces first, its last piece with the rest: still one save", async () => {
  const s = server();
  const disk = new Uint8Array(30 * 1024 * 1024 + 5).map((_, i) => i === 0 ? 0 : (i * 13) & 0xff);
  const r = await push(s.mcp, [...doom, { path: "/disk.img", bytes: disk }], "Games/Linux");
  const writes = s.calls.filter((c) => c.tool === "write");
  // 30 MB: three 8 MB pieces alone, then the last 6 MB with everything else (Doom's 4.6 MB too
  // much for one write with it: two saves, index.html in the second).
  const pieces = writes.filter((c) => c.args.offset !== undefined);
  assertEquals(pieces.map((c) => c.args.offset), [0, 8, 16].map((m) => m * 1024 * 1024));
  const saves = writes.filter((c) => Array.isArray(c.args.files));
  assertEquals(r.writes, saves.length);
  assertEquals(saves[saves.length - 1].args.files.at(-1).path, "/index.html");
  for (const w of saves) assert(w.args.files.reduce((n: number, f: Record<string, any>) => n + (f.content_base64?.length ?? 0) * 3 / 4, 0) <= WRITE_BYTES);
  assertEquals(s.apps.get("Games/Linux.app")!.get("/disk.img"), disk);
  for (const f of doom) assertEquals(s.apps.get("Games/Linux.app")!.get(f.path), f.bytes, f.path);
});

Deno.test("a folder without index.html isn't an app; data.json stays the app's data", async () => {
  const s = server();
  await assertRejects(() => push(s.mcp, doom.filter((f) => f.path !== "/index.html"), "Games/Doom"), PushFailed, "no index.html");
  assertEquals(s.calls.length, 0);
  const r = await push(s.mcp, [...doom, { path: "/data.json", bytes: te.encode("{}") }], "Games/Doom");
  assertEquals(r.skipped, ["/data.json"]);
  assertEquals(s.calls.some((c) => String(c.args.path ?? c.args.id).endsWith("/data.json")), false);
});

Deno.test("over a limit: the server's own words, and nothing of the push saved", async () => {
  const words = "Not saved:\n- /doom1.wad is 101.0 MB; a binary file can be at most 100 MB.";
  const s = server({ refuse: (path) => path === "/doom1.wad" ? words : null });
  const e = await assertRejects(() => push(s.mcp, doom, "Games/Doom"), PushFailed);
  assertStringIncludes(e.message, `Games/Doom.app/: ${words}`);
  assertStringIncludes(e.message, "Nothing was saved.");
  // The app is the starter, as create made it.
  assertEquals([...s.apps.get("Games/Doom.app")!.keys()].sort(), [...STARTER].sort());
});

Deno.test("a refusal from create (a locked or shared note) comes back as the server said it", async () => {
  const s = server();
  s.mcp.call = ((tool: string) => Promise.reject(new ToolError(tool === "create" ? '"Doom" is shared with other people, and shared notes can\'t have apps yet.' : "has no app"))) as typeof s.mcp.call;
  await assertRejects(() => push(s.mcp, doom, "Games/Doom"), ToolFailed, "shared notes can't have apps yet");
});
