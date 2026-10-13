// Templates with apps (docs/Technical/templates.md): the folder's rules, and the round trip. An app
// exported as a template's folder, compiled the way scripts/template-apps.ts compiles it for the
// site, and made again with create { type: "app", template } lists and reads back the same files
// and the same data.json.
//   cd supabase/functions/mcp && deno test -A template_apps.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, toolContext } from "./sealed.ts";
import { ToolError } from "./tools.ts";
import { runFileTool } from "./files_tools.ts";
import { linkProject, parseStored, serialize } from "./app_project.ts";
import { withFiles } from "./app_files.ts";
import { scaffold } from "./app_scaffold.ts";
import { fetchTemplateApp, fromTree, toTree, treeProblems } from "./template_apps.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a, true)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };
const unnumbered = (t: string) => t.split("\n").map((l) => l.replace(/^\s*\d+\t/, "")).join("\n");

const NOTE = "Water\n\nHow much water I drink. The app keeps the log.\n";
const DATA = { values: { settings: { goal: 8 }, localStorage: { streak: { best: 4 } } }, collections: { days: [{ id: "d1", date: "2026-10-01", glasses: 6 }] } };

/** A template's folder, as an export of a real app would make it. */
async function folder(): Promise<Record<string, string>> {
  const files = await scaffold("Water");
  files["/docs/README.md"] = files["/docs/README.md"].replace("(One or two sentences: who uses it and for what.)", "Counts glasses of water against a daily goal.");
  return toTree(files, fromTree({ "index.html": "", "data.json": JSON.stringify(DATA) }).data);
}

/** The site: /templates/<slug>.json and the files the generator writes. */
async function site(tree: Record<string, string>) {
  const { files, data } = fromTree(tree);
  const stored = serialize((await linkProject(await withFiles({ amberApp: 1, files: {}, compiled: {} }, files))).project);
  const served: Record<string, string> = {
    "/templates/water.json": JSON.stringify({ version: 1, slug: "water", title: "Water", folder: "Health", note: NOTE, app: "/templates/apps/water.project.json", data: "/templates/apps/water.data.json" }),
    "/templates/apps/water.project.json": stored,
    "/templates/apps/water.data.json": JSON.stringify(data),
    "/templates/plain.json": JSON.stringify({ version: 1, slug: "plain", title: "Plain", note: "Plain\n" }),
  };
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, (req) => {
    const body = served[new URL(req.url).pathname];
    return body === undefined ? new Response("not found", { status: 404 }) : new Response(body, { headers: { "content-type": "application/json" } });
  });
  Deno.env.set("TEMPLATE_SITE_URL", `http://127.0.0.1:${server.addr.port}`);
  return { server, stored };
}

Deno.test("a template's folder: only source, no secrets, data that reads", async () => {
  const tree = await folder();
  assertEquals(treeProblems(tree), []);
  assertEquals(treeProblems({ ...tree, "preview-light.png": "" }), []);
  const bad = (extra: Record<string, string>) => treeProblems({ ...tree, ...extra }).join("\n");
  assertStringIncludes(bad({ ".env": "X=1" }), ".env: dotfiles");
  assertStringIncludes(bad({ "node_modules/react/index.js": "" }), "node_modules");
  assertStringIncludes(bad({ "package-lock.json": "{}" }), "lock files");
  assertStringIncludes(bad({ "src/logo.png": "" }), "only text files");
  assertStringIncludes(bad({ "src/api.ts": `const key = "sk-ant-${"a".repeat(30)}"` }), "an OpenAI or Anthropic key");
  assertStringIncludes(bad({ "src/x.ts": `const t = "ghp_${"A".repeat(36)}"` }), "a GitHub token");
  assertStringIncludes(bad({ "docs/key.md": "-----BEGIN RSA PRIVATE KEY-----" }), "a private key");
  assertStringIncludes(bad({ "data.json": "{" }), "isn't JSON");
  assertStringIncludes(bad({ "data.json": "[]" }), "must be an object");
  assertStringIncludes(bad({ "data.json": JSON.stringify({ values: {}, collections: { days: [{ date: "x" }] } }) }), "needs a string \"id\"");
  assertStringIncludes(bad({ "data.json": JSON.stringify({ values: { photo: { $file: "abc" } }, collections: {} }) }), "files don't come along");
  const { "index.html": _, ...noIndex } = tree;
  assertStringIncludes(treeProblems(noIndex).join(), "index.html is missing");
  const { "data.json": __, ...noData } = tree;
  assertStringIncludes(treeProblems(noData).join(), "data.json is missing");
  // localStorage stays parsed in the folder (as read shows it) and is a string when stored.
  assertEquals(JSON.parse(tree["data.json"]).values.localStorage.streak, { best: 4 });
  assertEquals(fromTree(tree).data.values.localStorage, { streak: "{\"best\":4}" });
});

Deno.test("round trip: a template's app made with create comes back as the same folder", async () => {
  const tree = await folder();
  const { server, stored } = await site(tree);
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const made = await tool(pg, a, "create", { type: "app", path: "Health/Water.md", template: "water" });
    assertEquals([made.created, made.app], ["Health/Water.md", "Health/Water.app/"]);
    assertStringIncludes(made.live, "Live");
    // The note is the template's note.
    assertStringIncludes((await tool(pg, a, "fetch", { id: "Health/Water.md" })).text, "The app keeps the log.");

    // Every path the folder has, and nothing else; each file's text and data.json as they were.
    const listed = (await tool(pg, a, "list", { path: "Health/Water.app" })).files.map((f: { path: string }) => f.path.replace("Health/Water.app/", "")).sort();
    assertEquals(listed, Object.keys(tree).sort());
    for (const p of Object.keys(tree)) {
      const read = await tool(pg, a, "fetch", { id: `Health/Water.app/${p}` });
      if (p === "data.json") assertEquals(JSON.parse(unnumbered(read.text)), JSON.parse(tree[p]), p);
      else assertEquals(unnumbered(read.text), tree[p], p);
    }
    // What devices run is what the site serves for the app (the same compile).
    const [row] = (await pg.query(`select note_id, page_ct from public.note_pages`)).rows as { note_id: string; page_ct: string }[];
    assertEquals(parseStored(await a.vault.openPage(row.note_id, row.page_ct)), parseStored(stored));

    // Refusals: no such template, a template without an app, a note that's already there, a bad name.
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Health/Other.md", template: "nope" })), "There's no template \"nope\"");
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Plain.md", template: "plain" })), "has no app");
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Health/Water.md", template: "water" })), "already exists");
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "X.md", template: "../x" })), "isn't a template name");
  } finally {
    await server.shutdown();
    Deno.env.delete("TEMPLATE_SITE_URL");
  }
});

Deno.test("fetchTemplateApp: only paths on the site", async () => {
  const get = (async (url: string) => new Response(url.endsWith("t.json") ? JSON.stringify({ title: "T", note: "T\n", app: "https://evil.example/x.json" }) : "{}")) as typeof fetch;
  let message = "";
  try { await fetchTemplateApp("t", "https://pintonotes.com", get); } catch (e) { message = (e as Error).message; }
  assertStringIncludes(message, "isn't on the site");
});
