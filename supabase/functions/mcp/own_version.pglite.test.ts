// "Make my own version of <link>" through the file tools: create { type: "app", original } makes the
// app and answers with the method, the app's public pages and its screenshots, in one call; a link
// that can't be read makes nothing. The internet is a local https server (test_https.ts).
//   cd supabase/functions/mcp && deno test -A own_version.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, toolContext } from "./sealed.ts";
import { Content, ToolError } from "./tools.ts";
import { FILE_PROMPTS, FILE_TOOLS, ownVersionPrompt, runFileTool } from "./files_tools.ts";
import { FILE_APP_INSTRUCTIONS } from "./page_guide.ts";
import { ownVersionAsk, useLookup } from "./own_version.ts";
import { testWeb } from "./test_https.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };
const q = async <T = Record<string, unknown>>(pg: PGlite, sql: string, params: unknown[] = []) => (await pg.query<T>(sql, params)).rows;

const html = (body: string, title: string) => new Response(`<html><head><title>${title}</title></head><body>${body}</body></html>`, { headers: { "content-type": "text/html" } });

async function internet() {
  const web = await testWeb({ "tally.example.com": ["93.184.216.34"], "lookup.example.com": ["93.184.216.36"], "img.example.com": ["93.184.216.37"], "js.example.com": ["93.184.216.38"] }, (req) => {
    const u = new URL(req.url);
    const host = req.headers.get("host")?.split(":")[0];
    if (host === "lookup.example.com") {
      return Response.json({ resultCount: 1, results: [{ trackName: "Tally: Habit Tracker", formattedPrice: "$5.99", description: "Track up to 24 habits.", screenshotUrls: ["https://img.example.com/s/1/392x696bb.png", "https://img.example.com/s/2/392x696bb.png"] }] });
    }
    if (host === "img.example.com") return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2]), { headers: { "content-type": "image/jpeg" } });
    if (host === "js.example.com") return html("<div id=root></div>", "App");
    if (u.pathname === "/robots.txt") return new Response("", { status: 404 });
    if (u.pathname === "/features") return html("<h1>Features</h1><ul><li>Timed habits</li><li>Habits to break</li></ul>", "Tally features");
    return html(`<h1>Form good habits</h1><p>Every day you complete a task, your streak grows.</p><a href="/features">Features</a><a href="https://apps.apple.com/us/app/tally/id963034692">App Store</a>`, "Tally");
  });
  const restore = useLookup("https://lookup.example.com/lookup");
  return { web, close: async () => { restore(); await web.close(); } };
}

Deno.test("create with original: the app, then the method and the original's pages and screenshots, in one answer", async () => {
  const net = await internet();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const out = await tool(pg, a, "create", { type: "app", path: "New app.md", original: "https://tally.example.com/" });
    assert(out instanceof Content, "text and pictures");
    const [head, guide, ...pictures] = out.content as { type: string; text?: string; data?: string; mimeType?: string }[];
    const made = JSON.parse(head.text!);
    assertEquals([made.app, made.original, made.read, made.screenshots], ["Notes/New app.app/", "https://tally.example.com/", ["https://tally.example.com/", "https://apps.apple.com/us/app/id963034692", "https://tally.example.com/features"], 2]);
    // One short ask, not a method (Emil, 17 Nov: no rules for how the AI builds; the rerun showed
    // which lines earn their place): what to make, the features list, the rename, public pages only.
    assertEquals(made.next, ownVersionAsk("New app"));
    for (const s of ["own name and look", "everything it does that a note app can do", "docs/README.md", "rename the note \"New app\"", "never sign in"]) assertStringIncludes(made.next, s);
    for (const s of ["one write", "see_app", "test", "data.json"]) assert(!made.next.includes(s), `no rule about ${s}`);
    assert(guide.text!.startsWith("## What the public pages say about https://tally.example.com/"), "the pages, no method");
    for (const s of ["### App Store listing: Tally: Habit Tracker", "Price: $5.99", "- Habits to break"]) assertStringIncludes(guide.text!, s);
    assertEquals(pictures.map((p) => [p.type, p.mimeType]), [["image", "image/jpeg"], ["image", "image/jpeg"]]);
    // A real app, ready for the AI to build: the starter's files, readable and writable.
    const files = (await tool(pg, a, "list", { path: "Notes/New app.app" })).files as { path: string }[];
    assert(files.some((f) => f.path === "Notes/New app.app/README.md"));
    assertEquals((await q(pg, `select note_id from public.note_pages`)).length, 1);
  } finally { await net.close(); }
});

Deno.test("create with original that can't be read, or with a template too, makes nothing and says what to give", async () => {
  const net = await internet();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const before = (await q(pg, `select id from public.notes`)).length;
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Mine.md", original: "https://js.example.com/" })), "Nothing was made. Give the app's App Store page");
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Mine.md", original: "ftp://tally.example.com" })), "original takes a web link");
    assertStringIncludes(await fails(tool(pg, a, "create", { type: "app", path: "Mine.md", original: "https://tally.example.com/", template: "water" })), "Give template or original, not both.");
    assertEquals((await q(pg, `select id from public.notes`)).length, before, "no note was made");
    assertEquals((await q(pg, `select note_id from public.note_pages`)).length, 0);
  } finally { await net.close(); }
});

Deno.test("an AI is told where to start: the instructions, create's description, and a prompt the person can pick", () => {
  assertStringIncludes(FILE_APP_INSTRUCTIONS, "own version of an app");
  assertStringIncludes(FILE_APP_INSTRUCTIONS, "start it with create, type app and original: the link");
  const create = FILE_TOOLS.find((t) => t.name === "create")!;
  assertStringIncludes(create.description, "With original (a link to an app's website or App Store page)");
  assert("original" in (create.inputSchema.properties as Record<string, unknown>));
  const p = FILE_PROMPTS.find((x) => x.name === "own_version")!;
  assertEquals(p.arguments.map((x) => [x.name, x.required]), [["link", true], ["note", false]]);
  assertEquals(p.text({ link: "https://tally.example.com" }), ownVersionPrompt("https://tally.example.com"));
  assertEquals(ownVersionPrompt(" https://tally.example.com ", "New app"),
    `In Pinto Notes, make my own version of the app at https://tally.example.com, as my note "New app". Start it with create (type "app", original "https://tally.example.com") and follow what its answer says, all the way to a tested app.`);
  // The product never calls it cloning.
  for (const t of [FILE_APP_INSTRUCTIONS, create.description, p.description, p.title, ownVersionAsk("New app"), ownVersionPrompt("x")]) assert(!/clon/i.test(t), t);
});
