// Data an AI saves for a note's app is checked like the app's code: the app has to still open over it
// (app_data_check.ts). The user's path from 2026-11-26: a new Pinto user on iPhone 1.4 asked
// ChatGPT to set up the meal plan. ChatGPT made it from the template (create { type: "app",
// template: "meal-plan" }), then filled data.json with the week's dinners. The save said "saved",
// but the app couldn't read the data (an amount as a number; the app expects text), so it stopped
// drawing on the iPhone and its tab bar and + buttons did nothing.
// Needs Playwright's WebKit, like app_runtime.pglite.test.ts.
//   cd supabase/functions/mcp && deno test -A app_data_check.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, toolContext } from "./sealed.ts";
import { runTool, ToolError } from "./tools.ts";
import { runFileTool } from "./files_tools.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError, and the save went through"); };
const unnumbered = (t: string) => t.split("\n").map((l) => l.replace(/^\s*\d+\t/, "")).join("\n");

const hasWebKit = [Deno.env.get("PLAYWRIGHT_BROWSERS_PATH"), `${Deno.env.get("HOME")}/.cache/ms-playwright`, `${Deno.env.get("HOME")}/Library/Caches/ms-playwright`].some((dir) => {
  if (!dir) return false;
  try { for (const e of Deno.readDirSync(dir)) if (e.name.startsWith("webkit-")) return true; } catch { /* none */ }
  return false;
});

const PUBLIC = new URL("../../../web/public/templates/apps/", import.meta.url);
const TEMPLATE = new URL("../../../web/content/templates/meal-plan.json", import.meta.url);

/** The site, serving the meal plan template as the generator wrote it, and a render service. */
async function setUp() {
  const template = JSON.parse(await Deno.readTextFile(TEMPLATE));
  const served: Record<string, string> = {
    "/templates/meal-plan.json": JSON.stringify({ version: 1, slug: "meal-plan", title: template.title, folder: template.folder, note: template.note, app: "/templates/apps/meal-plan.project.json", data: "/templates/apps/meal-plan.data.json" }),
    "/templates/apps/meal-plan.project.json": await Deno.readTextFile(new URL("meal-plan.project.json", PUBLIC)),
    "/templates/apps/meal-plan.data.json": await Deno.readTextFile(new URL("meal-plan.data.json", PUBLIC)),
  };
  const site = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, (req) => {
    const body = served[new URL(req.url).pathname];
    return body === undefined ? new Response("not found", { status: 404 }) : new Response(body, { headers: { "content-type": "application/json" } });
  });
  Deno.env.set("TEMPLATE_SITE_URL", `http://127.0.0.1:${site.addr.port}`);
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const renderer = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${renderer.addr.port}`);
  return async () => {
    await closeBrowser();
    await renderer.shutdown(); await site.shutdown();
    Deno.env.delete("RENDER_URL"); Deno.env.delete("TEMPLATE_SITE_URL");
  };
}

/** This week's Monday, as the app counts weeks. */
function monday(offset = 0) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A week of dinners the way an AI writes them from "plan dinners for this week". */
function week(amount: (n: number, unit?: string) => unknown) {
  return [
    { id: "d1", date: monday(0), dish: "Chicken tacos", cook: "Me", ingredients: [{ name: "Tortillas", qty: amount(8), aisle: "Bakery" }, { name: "Chicken thighs", qty: amount(500, "g"), aisle: "Meat and fish" }, { name: "Limes", qty: amount(2), aisle: "Fruit and veg" }] },
    { id: "d2", date: monday(1), dish: "Salmon with potatoes", cook: "Me", ingredients: [{ name: "Salmon fillets", qty: amount(2), aisle: "Meat and fish" }, { name: "Potatoes", qty: amount(1, "kg"), aisle: "Fruit and veg" }] },
    { id: "d3", date: monday(2), dish: "Pasta bake", cook: "Me", ingredients: [{ name: "Chopped tomatoes", qty: amount(2, "tins"), aisle: "Tins and jars" }, { name: "Mozzarella", qty: amount(1), aisle: "Dairy and eggs" }] },
  ];
}
const asNumber = (n: number, unit?: string) => (unit ? `${n} ${unit}` : n);   // "qty": 8, "qty": "500 g"
const asText = (n: number, unit?: string) => (unit ? `${n} ${unit}` : String(n)); // "qty": "8", as the app's docs say

Deno.test({
  name: "data an AI saves that the app can't open with isn't saved, and the AI is told why",
  ignore: !hasWebKit,
  sanitizeOps: false, sanitizeResources: false,
  fn: async () => {
    const stop = await setUp();
    try {
      const pg = await schemaDB();
      const a = await account(pg);
      const made = await tool(pg, a, "create", { type: "app", path: "Home/Meal plan.md", template: "meal-plan" });
      assertStringIncludes(made.live, "Live");
      const app = "Home/Meal plan.app";
      const read = async () => JSON.parse(unnumbered((await tool(pg, a, "fetch", { id: `${app}/data.json` })).text));
      const start = await read();
      assertEquals(start.values.dinners, []);

      // ChatGPT's week: one amount a number. The app can't draw over it, so it isn't saved.
      const broken = { ...start, values: { ...start.values, dinners: week(asNumber) } };
      const why = await fails(tool(pg, a, "write", { path: `${app}/data.json`, content: JSON.stringify(broken, null, 2) }));
      assertStringIncludes(why, "Not saved: with this data the app doesn't open");
      assertStringIncludes(why, `${app}/docs/README.md`);
      assertEquals((await read()).values.dinners, [], "the person's app keeps the data it opens with");
      // The same through edit, and through update_page_data.
      const edited = await fails(tool(pg, a, "edit", { path: `${app}/data.json`, old_string: `"dinners": []`, new_string: `"dinners": ${JSON.stringify(week(asNumber))}` }));
      assertStringIncludes(edited, "Not saved");
      const [{ note_id }] = (await pg.query(`select note_id from public.note_pages`)).rows as { note_id: string }[];
      // update_page_data is in the older tool set ("pages"), which some connections still get.
      Deno.env.set("AMBER_MCP_TOOLS", "pages");
      const updated = await fails(runTool("update_page_data", { id: note_id, values: { dinners: week(asNumber) } }, await toolContext(pg, a)).finally(() => Deno.env.delete("AMBER_MCP_TOOLS")));
      assertStringIncludes(updated, "Not saved");
      assertEquals((await read()).values.dinners, []);

      // The same week with the amounts as text, as the app's docs describe them: saved.
      const fixed = { ...start, values: { ...start.values, dinners: week(asText) } };
      const saved = await tool(pg, a, "write", { path: `${app}/data.json`, content: JSON.stringify(fixed, null, 2) });
      assertEquals(saved.saved, `${app}/data.json`);
      assertEquals((await read()).values.dinners.length, 3);
    } finally {
      await stop();
    }
  },
});
