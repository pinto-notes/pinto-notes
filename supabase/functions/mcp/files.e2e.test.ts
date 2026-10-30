// End-to-end: the file tools on the running server, the way an AI client uses them. LOCAL stack only:
//   scripts/mcp-e2e.sh            (supabase start first; scripts/dev-user.ts makes the account and tokens)
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";

const url = Deno.env.get("PANE_MCP_URL");
const token = Deno.env.get("PANE_TOKEN");
const enabled = Boolean(url && token && /127\.0\.0\.1/.test(url ?? ""));
let nextId = 1;

function session(auth: string) {
  let sid: string | null = null;
  // deno-lint-ignore no-explicit-any
  const rpc = async (method: string, params?: unknown): Promise<any> => {
    const res = await fetch(url!, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${auth}`, ...(sid ? { "mcp-session-id": sid } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    });
    sid ??= res.headers.get("mcp-session-id");
    return await res.json();
  };
  // deno-lint-ignore no-explicit-any
  const call = async (name: string, args: Record<string, unknown> = {}): Promise<{ error: boolean; text: string; data: any }> => {
    const { result, error } = await rpc("tools/call", { name, arguments: args });
    if (error) return { error: true, text: error.message, data: undefined };
    return { error: result.isError === true, text: result.content[0].text, data: result.structuredContent };
  };
  return { rpc, call };
}

Deno.test({ name: "files: the server serves the twelve file tools and their instructions", ignore: !enabled }, async () => {
  const { rpc } = session(token!);
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } });
  assertEquals(init.result.serverInfo.name, "pinto-notes");
  assertStringIncludes(init.result.instructions, "each note is a markdown file");
  const names = (await rpc("tools/list")).result.tools.map((t: { name: string }) => t.name);
  assertEquals(names, ["search", "list", "fetch", "create", "edit", "write", "move", "delete", "history", "restore", "pin", "see_app"]);
  const card = await (await fetch(`${url}/.well-known/mcp/server-card.json`)).json();
  assertEquals(card.tools.map((t: { name: string }) => t.name), names);
});

Deno.test({ name: "files: a full editing session (checklist, table, sub-note, move, history, delete and restore)", ignore: !enabled }, async () => {
  const { rpc, call } = session(token!);
  await rpc("initialize", { protocolVersion: "2025-06-18" });
  const stamp = crypto.randomUUID().slice(0, 8);
  const dir = `Travel ${stamp}`;
  const made = await call("create", { path: `${dir}/Trip.md`, content: `Trip\n\n## Packing\n- [ ] Passport\n- [ ] Charger\n\n## Costs\n| Item | EUR |\n| --- | --- |\n| Hotel | 300 |\n` });
  assert(!made.error, made.text);
  assertEquals(made.data.created, `${dir}/Trip.md`);
  const path = made.data.created as string;

  // Read before edit: refused until fetched in this session.
  const unread = await session(token!).call("edit", { path, old_string: "- [ ] Passport", new_string: "- [x] Passport" });
  assert(unread.error);
  assertStringIncludes(unread.text, "with fetch before");
  const read = await call("fetch", { id: path });
  assertStringIncludes(read.data.text, "- [ ] Passport");
  assert(!(await call("edit", { path, old_string: "- [ ] Passport", new_string: "- [x] Passport" })).error);
  const row = await call("edit", { path, old_string: "| Hotel | 300 |", new_string: "| Hotel | 300 |\n| Train | 45 |" });
  assertEquals(row.data.checks, "ok");
  const found = await call("search", { pattern: "Train", path: `${dir}/` });
  assertEquals(found.data.files, [path]);
  assertEquals((await call("search", { query: `passport` , path: `${dir}/` })).data.results[0].id, path);

  // A sub-note lives in the note's folder; moving the note takes it along.
  assertEquals((await call("create", { path: `${dir}/Trip/Day one.md`, content: "Day one\n\nLand at noon." })).data.created, `${dir}/Trip/Day one.md`);
  assertEquals((await call("move", { path, to: `Archive ${stamp}/` })).data.moved, `Archive ${stamp}/Trip.md`);
  assertEquals((await call("list", { path: `Archive ${stamp}/Trip/` })).data.entries.map((e: { path: string }) => e.path), [`Archive ${stamp}/Trip/Day one.md`]);

  // History and restore; delete to Recently Deleted and back.
  const moved = `Archive ${stamp}/Trip.md`;
  const h = await call("history", { path: moved });
  assert(h.data.versions.length >= 2, JSON.stringify(h.data));
  const back = await call("restore", { path: moved, version: h.data.versions[h.data.versions.length - 1].version });
  assert(!back.error, back.text);
  assertStringIncludes((await call("fetch", { id: moved })).data.text, "- [ ] Passport");
  assertStringIncludes((await call("delete", { path: moved })).data.now_at, "Recently Deleted/");
  assertEquals((await call("restore", { path: "Recently Deleted/Trip.md" })).data.restored, moved);
  assert(!(await call("pin", { path: moved, pinned: true })).error);
});

