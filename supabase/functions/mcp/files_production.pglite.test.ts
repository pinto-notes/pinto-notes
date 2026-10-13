// The file tools as production serves them (AMBER_MCP_TOOLS unset): through the request handler
// with a real connection token, locked notes, ChatGPT's search and fetch, an older one-file app,
// an app's tests on every save, and no readable text anywhere after every tool has run.
//   cd supabase/functions/mcp && deno test -A files_production.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB, sqlFor } from "./pglite.ts";
import { type Account, account, app, file, folder, lockedNote, note, notesPassword, opened, stubStorage, toolContext } from "./sealed.ts";
import { toBase64, tokenKey, wrap } from "../_shared/e2ee.ts";
import { parseStored } from "./app_project.ts";
import { LOCKED, ToolError } from "./tools.ts";

// Production: no setting at all.
Deno.env.delete("AMBER_MCP_TOOLS");
Deno.env.delete("AMBER_APP_REAL_PREVIEWS");
const SUPA = "https://proj.supabase.co";
Deno.env.set("SUPABASE_URL", SUPA);
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
const { handleRequest } = await import("./server.ts");
const { FILE_TOOLS, runFileTool } = await import("./files_tools.ts");

const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}, canWrite = true) => await runFileTool(name, args, await toolContext(pg, a, canWrite)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };

/** A connection made in the app's Settings › Connect an AI: a pane_ token holding the data key. */
async function connect(pg: PGlite, a: Account, canWrite: boolean): Promise<string> {
  const token = `pane_${hex(32)}`;
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await app(pg, a.id, `select public.create_mcp_token($1, $2, $3, $4)`, [canWrite ? "Claude Code" : "Codex", canWrite, hash, await wrap(a.dk, await tokenKey(token, "pane"), "pane", a.id)]);
  return token;
}

/** JSON-RPC to the server as a client sends it, one session. */
function client(pg: PGlite, token: string) {
  let id = 0, session: string | null = null;
  // deno-lint-ignore no-explicit-any
  return async (method: string, params: Record<string, unknown> = {}): Promise<any> => {
    const res = await handleRequest(new Request(`${SUPA}/functions/v1/mcp`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(session ? { "mcp-session-id": session } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
    }), sqlFor(pg));
    session ??= res.headers.get("mcp-session-id");
    assertEquals(res.status, 200);
    const body = await res.json();
    if (body.error) throw new Error(body.error.message);
    return body.result;
  };
}

Deno.test("a client connecting now gets the file tools, their instructions, prompts and the apps guide; read-only sees only reads", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  await note(pg, a, "Groceries\n\n- [ ] Milk\n");
  const rpc = client(pg, await connect(pg, a, true));
  const init = await rpc("initialize", { protocolVersion: "2025-06-18" });
  assertStringIncludes(init.instructions, "each note is a markdown file");
  assertEquals((await rpc("tools/list")).tools.map((t: { name: string }) => t.name), FILE_TOOLS.map((t) => t.name));
  assertEquals((await rpc("prompts/list")).prompts.map((p: { name: string }) => p.name), ["make_app", "add_data", "change_app"]);
  const prompt = await rpc("prompts/get", { name: "make_app", arguments: { note: "Groceries" } });
  assertStringIncludes(prompt.messages[0].content.text, "create (type \"app\")");
  const uris = (await rpc("resources/list")).resources.map((r: { uri: string }) => r.uri);
  assert(uris.includes("amber://guides/apps"), JSON.stringify(uris));
  assertStringIncludes((await rpc("resources/read", { uri: "amber://guides/apps" })).contents[0].text, "data.json");
  // A tool call goes to the file tools: edit after fetch, in one session.
  const read = await rpc("tools/call", { name: "fetch", arguments: { id: "Groceries.md" } });
  assertStringIncludes(read.structuredContent.text, "- [ ] Milk");
  const ticked = await rpc("tools/call", { name: "edit", arguments: { path: "Groceries.md", old_string: "- [ ] Milk", new_string: "- [x] Milk" } });
  assertEquals(ticked.isError, undefined, JSON.stringify(ticked));
  // An old tool name is unknown.
  await rpc("tools/call", { name: "read_note", arguments: { title: "Groceries" } }).then(() => { throw new Error("read_note answered"); }, (e) => assertStringIncludes(e.message, "Unknown tool"));

  const ro = client(pg, await connect(pg, a, false));
  const reads = (await ro("tools/list")).tools.map((t: { name: string }) => t.name);
  assertEquals(reads, ["search", "list", "fetch", "history", "see_app"]);
  const refused = await ro("tools/call", { name: "write", arguments: { path: "New.md", content: "New" } });
  assertEquals(refused.isError, true);
  assertStringIncludes(refused.content[0].text, "read-only");
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Groceries.md", old_string: "Milk", new_string: "Oat milk" }, false)), "read-only");
});

Deno.test("a locked note shows its title and nothing else: never read, searched or changed", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const key = await notesPassword(pg, a);
  await lockedNote(pg, a, key, "Diary");
  await note(pg, a, "Plans\n\nSee [[Diary]].");
  const top = await tool(pg, a, "list");
  assertEquals(top.entries.find((e: { path: string }) => e.path === "Diary.md")?.locked, true);
  const read = await tool(pg, a, "fetch", { id: "Diary.md" });
  assertEquals([read.text, read.metadata.locked], [LOCKED, true]);
  // Its name matches, as every name does; its text is never searched.
  assertEquals((await tool(pg, a, "search", { pattern: "Diary" })).files.sort(), ["Diary.md", "Plans.md"]);
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Diary.md", old_string: "x", new_string: "y" })), "locked");
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Diary.md", content: "Diary\n\nnew" })), "locked");
  assertStringIncludes(await fails(tool(pg, a, "move", { path: "Diary.md", to: "Private/Diary 2.md" })), "locked");
});

Deno.test("ChatGPT's search and fetch: results with id, title and url; fetch by the id gives the text", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const work = await folder(pg, a, "Work");
  await note(pg, a, "Acme\n\nDeposit for the Lisbon office.", { folder: work });
  const found = await tool(pg, a, "search", { query: "lisbon deposit" });
  const [first] = found.results;
  assertEquals([first.id, first.title], ["Work/Acme.md", "Acme"]);
  assert(first.url.startsWith("ambernotes://note/"));
  const doc = await tool(pg, a, "fetch", { id: first.id });
  assertEquals([doc.id, doc.title, doc.url], [first.id, "Acme", first.url]);
  assertStringIncludes(doc.text, "Deposit for the Lisbon office.");
});

Deno.test("an older one-file app (set_note_page) reads and edits as Note.app/index.html and stays one file", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await note(pg, a, "Counter\n");
  const html = `<!doctype html>\n<main><h1>Count</h1><button id="b">Add</button></main>\n<script>document.getElementById("b").onclick = () => amber.store.set("n", 1)</script>\n`;
  await app(pg, a.id, `insert into public.note_pages (note_id, page_ct) values ($1, $2)`, [id, await a.vault.sealPage(id, html)]);

  assertEquals((await tool(pg, a, "list")).entries.find((e: { path: string }) => e.path === "Counter.md")?.app, "Counter.app/");
  const listing = await tool(pg, a, "fetch", { id: "Counter.app/" });
  assertEquals(listing.text.split("\n"), ["Counter.app/index.html  (4 lines)", "Counter.app/data.json"]);
  assertStringIncludes(listing.metadata.one_file, "one HTML document");
  assertStringIncludes((await tool(pg, a, "fetch", { id: "Counter.app/index.html" })).text, "     2\t<main><h1>Count</h1>");
  const edited = await tool(pg, a, "edit", { path: "Counter.app/index.html", old_string: "<h1>Count</h1>", new_string: "<h1>Tally</h1>" });
  assertEquals(edited.saved, "Counter.app/index.html");
  assertStringIncludes(edited.live, "Live");
  // Stored as before: plain HTML, not a project, so every app version on every device opens it.
  const [row] = (await pg.query(`select page_ct from public.note_pages where note_id = $1`, [id])).rows as { page_ct: string }[];
  const stored = await a.vault.openPage(id, row.page_ct);
  assertEquals(stored, html.replace("<h1>Count</h1>", "<h1>Tally</h1>"));
  assertEquals(Object.keys(parseStored(stored).files), ["/index.html"]);
  // Its data is data.json, like a project's.
  await tool(pg, a, "fetch", { id: "Counter.app/data.json" });
  assertEquals((await tool(pg, a, "write", { path: "Counter.app/data.json", content: JSON.stringify({ values: { n: 3 }, collections: {} }) })).saved, "Counter.app/data.json");
  // A note with an app can't be given a second one, and index.html stays.
  assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Counter.md" })), "already has an app");
  assertStringIncludes(await fails(tool(pg, a, "delete", { path: "Counter.app/index.html" })), "can't be deleted");
  // The note's text is untouched.
  assertEquals((await opened(pg, a, id)).body, "Counter\n");
});

Deno.test("see_app never offers or takes real data unless real previews are served", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  await tool(pg, a, "create", { type: "app", path: "Habits.md" });
  const see = FILE_TOOLS.find((t) => t.name === "see_app")!;
  assert(!("data" in (see.inputSchema.properties as Record<string, unknown>)));
  assert(!/"real"/.test(see.description), see.description);
  assertStringIncludes(await fails(tool(pg, a, "see_app", { path: "Habits.app", data: "real" })), "sample");
});

// Needs a browser for the render service (scripts/page-render); CI's server job has none.
Deno.test({ name: "an app made with the file tools: its tests run on every save, and a failing version is held back", ignore: Deno.env.get("CI") === "true" }, async () => {
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${server.addr.port}`);
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const made = await tool(pg, a, "create", { type: "app", path: "Groceries.md" });
    assertEquals([made.app, made.tests, made.live.startsWith("Live")], ["Groceries.app/", "2 passed, 0 failed", true]);
    const red = await tool(pg, a, "edit", { path: "Groceries.app/tests/app.test.tsx", old_string: `expect(saved()).toEqual(["Milk"])`, new_string: `expect(saved()).toEqual(["Cheese"])` });
    assertEquals([red.tests, red.live.startsWith("Held back")], ["1 passed, 1 failed", true]);
    // The AI keeps working on the held-back version; fixed, it goes live.
    assertStringIncludes((await tool(pg, a, "fetch", { id: "Groceries.app/" })).metadata.held_back, "failed its checks");
    const green = await tool(pg, a, "edit", { path: "Groceries.app/tests/app.test.tsx", old_string: `toEqual(["Cheese"])`, new_string: `toEqual(["Milk"])` });
    assertEquals([green.tests, green.live.startsWith("Live")], ["2 passed, 0 failed", true]);
    // see_app with steps uses it on a throwaway copy.
    const seen = await tool(pg, a, "see_app", { path: "Groceries.app", steps: [{ type: "Milk", into: "New item" }, { tap: "Add" }] });
    const steps = (seen.structured ?? seen).steps as { failed?: string; data_changed?: string[] }[];
    assertEquals(steps.map((s) => !s.failed), [true, true]);
  } finally {
    await closeBrowser();
    await server.shutdown();
    Deno.env.delete("RENDER_URL");
  }
});

Deno.test("no text of the account is stored or logged readably after every file tool has run", async () => {
  const CANARY = `canary-${crypto.randomUUID()}`;
  const logged: string[] = [];
  const methods = ["log", "error", "warn", "info", "debug"] as const;
  const real = Object.fromEntries(methods.map((m) => [m, console[m]]));
  for (const m of methods) console[m] = (...args: unknown[]) => { logged.push(args.map((x) => (typeof x === "string" ? x : Deno.inspect(x))).join(" ")); };
  const enc = new TextEncoder();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const key = await notesPassword(pg, a);
    const travel = await folder(pg, a, `Travel ${CANARY}`);
    const ticket = await file(pg, a, `ticket-${CANARY}.txt`, "public.plain-text", enc.encode(`Ticket ${CANARY}\nSeat 12A`));
    const paper = await file(pg, a, `paper-${CANARY}.txt`, "public.plain-text", enc.encode(`Paper ${CANARY}`), { folder: travel });
    const trip = await note(pg, a, `Trip ${CANARY}\n\nPack the ${CANARY} bag.\n![ticket](pane-file:${ticket.id})\n\n## Log\n- day one\n- [ ] buy ${CANARY}`, { folder: travel });
    await note(pg, a, `Sub ${CANARY}\n\nInside`, { parent: trip, folder: travel });
    await note(pg, a, `Tracker ${CANARY}\n\n<!-- pane-table: Date=date; Note=text -->\n| Date | Note |\n| --- | --- |\n| 2026-09-01 | ${CANARY} |\n`, { folder: travel });
    await lockedNote(pg, a, key, `Locked ${CANARY}`);
    const unstub = stubStorage(SUPA, new Map([[ticket.path, ticket.sealed], [paper.path, paper.sealed]]));
    try {
      const rpc = client(pg, await connect(pg, a, true));
      await rpc("initialize", { protocolVersion: "2025-06-18" });
      const used = new Set<string>();
      // deno-lint-ignore no-explicit-any
      const call = async (name: string, args: Record<string, unknown>): Promise<any> => {
        used.add(name);
        const r = await rpc("tools/call", { name, arguments: args });
        assert(!r.isError, `${name}: ${r.content?.[0]?.text}`);
        return r.structuredContent ?? r;
      };
      const dir = `Travel ${CANARY}`;
      assert((await call("search", { query: `"${CANARY} bag"` })).results.length);
      await call("search", { pattern: CANARY, output: "content" });
      await call("list", { pattern: "**" });
      assertStringIncludes((await call("fetch", { id: `${dir}/Trip ${CANARY}.md` })).text, CANARY);
      await call("edit", { path: `${dir}/Trip ${CANARY}.md`, old_string: `- [ ] buy ${CANARY}`, new_string: `- [x] buy ${CANARY}` });
      await call("fetch", { id: `${dir}/Tracker ${CANARY}.md` });
      await call("edit", { path: `${dir}/Tracker ${CANARY}.md`, old_string: `| 2026-09-01 | ${CANARY} |`, new_string: `| 2026-09-01 | ${CANARY} |\n| 2026-09-02 | more ${CANARY} |` });
      await call("create", { path: `${dir}/Trip ${CANARY}/Child ${CANARY}.md`, content: `Child ${CANARY}\n\n${CANARY}` });
      await call("create", { type: "folder", path: `Folder ${CANARY}/` });
      await call("write", { path: `Folder ${CANARY}/New ${CANARY}.md`, content: `New ${CANARY}\n\nbody ${CANARY}` });
      await call("fetch", { id: `${dir}/paper-${CANARY}.txt` });
      await call("edit", { path: `${dir}/paper-${CANARY}.txt`, old_string: `Paper ${CANARY}`, new_string: `Paper ${CANARY} read` });
      await call("write", { path: `Folder ${CANARY}/notes-${CANARY}.txt`, content: `Notes ${CANARY}` });
      await call("move", { path: `Folder ${CANARY}/New ${CANARY}.md`, to: `${dir}/` });
      await call("pin", { path: `${dir}/New ${CANARY}.md`, pinned: true });
      const h = await call("history", { path: `${dir}/Trip ${CANARY}.md` });
      await call("restore", { path: `${dir}/Trip ${CANARY}.md`, version: h.versions[h.versions.length - 1].version });
      await call("create", { type: "app", path: `${dir}/Tracker ${CANARY}.md` });
      const base = `${dir}/Tracker ${CANARY}.app`;
      await call("write", { path: `${base}/src/canary.ts`, content: `export const c = "${CANARY}";` });
      await call("edit", { path: `${base}/README.md`, old_string: "## How this app runs", new_string: `For ${CANARY}\n\n## How this app runs` });
      await call("fetch", { id: `${base}/data.json` });
      await call("write", { path: `${base}/data.json`, content: JSON.stringify({ values: { note: CANARY }, collections: {} }) });
      await call("see_app", { path: base });
      await call("delete", { path: `${dir}/New ${CANARY}.md` });
      await call("restore", { path: `Recently Deleted/New ${CANARY}.md` });
      await call("delete", { path: `Folder ${CANARY}/` });
      assertEquals([...used].sort(), FILE_TOOLS.map((t) => t.name).sort(), "every tool ran");
    } finally {
      unstub();
    }

    const tables = (await pg.query<{ s: string; t: string }>(
      `select table_schema as s, table_name as t from information_schema.tables
       where table_schema in ('public', 'auth', 'storage') and table_type = 'BASE TABLE' order by 1, 2`)).rows;
    const canaryHex = [...enc.encode(CANARY)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const b64 = [0, 1, 2].map((k) => {
      const s = toBase64(new Uint8Array([...new Uint8Array(k), ...enc.encode(CANARY)])).replace(/=+$/, "");
      return s.slice(Math.ceil((8 * k) / 6), Math.floor((8 * (k + CANARY.length)) / 6));
    });
    let rows = 0;
    for (const { s, t } of tables) {
      for (const { row } of (await pg.query<{ row: string }>(`select x::text as row from "${s}"."${t}" x`)).rows) {
        rows++;
        assert(!row.includes(CANARY) && !row.toLowerCase().includes(canaryHex) && !b64.some((f) => row.includes(f)), `${s}.${t} holds the canary: ${row.slice(0, 300)}`);
      }
    }
    assert(rows > 30, `only ${rows} rows`);
  } finally {
    for (const m of methods) console[m] = real[m];
  }
  for (const line of logged) assert(!line.includes(CANARY), `logged: ${line}`);
});
