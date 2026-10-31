// Renaming a note through the file tools points the [[links]] to it at its new title, as the app
// does on a rename; fetch lists the notes that link to a note. On the whole schema in PGlite.
//   cd supabase/functions/mcp && deno test -A wikilinks.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, folder, lockedNote, note, notesPassword, opened, toolContext } from "./sealed.ts";
// tools.ts first: the modules it and files_tools.ts share load in its order.
import "./tools.ts";
import { runFileTool } from "./files_tools.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const body = async (pg: PGlite, a: Account, id: string) => (await opened(pg, a, id)).body!;

Deno.test("move to a new name: links to the note follow it, others and code stay", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const work = await folder(pg, a, "Work");
  const home = await folder(pg, a, "Home");
  await note(pg, a, "Plan\n\nWork's plan.", { folder: work });
  const homePlan = await note(pg, a, "Plan\n\nHome's plan.", { folder: home });
  const fromWork = await note(pg, a, "Standup\n\nSee [[Plan#Goals|goals]], [[ Plan]], [[Home/Plan]] and `[[Plan]]`.", { folder: work });
  const fromHome = await note(pg, a, "Chores\n\nSee [[Plan]].", { folder: home });
  const unrelated = await note(pg, a, "Ideas\n\nNo links, just a plan.", { folder: work });

  const moved = await tool(pg, a, "move", { path: "Work/Plan.md", to: "Work/Roadmap.md" });
  assertEquals(moved.moved, "Work/Roadmap.md");
  assertEquals(moved.links_updated, ["Work/Standup.md"]);
  assertEquals(await body(pg, a, fromWork), "Standup\n\nSee [[Roadmap#Goals|goals]], [[ Roadmap]], [[Home/Plan]] and `[[Plan]]`.");
  assertEquals(await body(pg, a, fromHome), "Chores\n\nSee [[Plan]].", "seen from Home, [[Plan]] is Home's plan");
  assertEquals(await body(pg, a, unrelated), "Ideas\n\nNo links, just a plan.");
  assertStringIncludes(await body(pg, a, homePlan), "Home's plan.");

  // The changed note keeps its version before (history), like any edit by the AI.
  const h = await tool(pg, a, "history", { path: "Work/Standup.md" });
  assertEquals(h.versions.map((v: { replaced_by: string; preview: string }) => [v.replaced_by, v.preview.includes("[[ Plan]]")]), [["Claude", true]],
    "the text before is kept, replaced by the AI");
});

Deno.test("edit and write that change the title retarget links; a locked note keeps its links", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const lockKey = await notesPassword(pg, a);
  await note(pg, a, "Groceries\n\n- [ ] Milk");
  const list = await note(pg, a, "Week\n\nShop: [[Groceries]] and [[groceries|food]].");
  await lockedNote(pg, a, lockKey, "Secret");

  await tool(pg, a, "fetch", { id: "Groceries.md" });
  const edited = await tool(pg, a, "edit", { path: "Groceries.md", old_string: "Groceries", new_string: "Shopping" });
  assertEquals([edited.edited, edited.renamed_from, edited.links_updated], ["Shopping.md", "Groceries.md", ["Week.md"]]);
  assertEquals(await body(pg, a, list), "Week\n\nShop: [[Shopping]] and [[Shopping|food]].");

  await tool(pg, a, "fetch", { id: "Shopping.md" });
  const written = await tool(pg, a, "write", { path: "Shopping.md", content: "Market\n\n- [ ] Milk" });
  assertEquals([written.written, written.links_updated], ["Market.md", ["Week.md"]]);
  assertEquals(await body(pg, a, list), "Week\n\nShop: [[Market]] and [[Market|food]].");

  // Same title, other text: nothing else is touched.
  await tool(pg, a, "fetch", { id: "Market.md" });
  const same = await tool(pg, a, "edit", { path: "Market.md", old_string: "Milk", new_string: "Oat milk" });
  assertEquals(same.links_updated, undefined);
});

Deno.test("fetch lists the notes that link here, with the lines around each link", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  await note(pg, a, "Recipes\n\nPasta.");
  await note(pg, a, "Groceries\n\n- [ ] Milk, see [[Recipes]]\n- [ ] Eggs\n\nMore in [[recipes#Pasta|pasta]].");
  await note(pg, a, "Ideas\n\nRecipes mentioned, not linked.");
  await note(pg, a, "Code\n\n`[[Recipes]]`");

  const read = await tool(pg, a, "fetch", { id: "Recipes.md" });
  assertEquals(read.metadata.linked_from, [{ path: "Groceries.md", lines: ["- [ ] Milk, see [[Recipes]]", "More in [[recipes#Pasta|pasta]]."] }]);
  const none = await tool(pg, a, "fetch", { id: "Ideas.md" });
  assertEquals(none.metadata.linked_from, undefined);
});
