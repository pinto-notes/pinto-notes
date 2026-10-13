// Templates with apps (docs/Technical/templates.md): checks each web/content/templates/<slug>.app/,
// compiles it with the server's own code (as a save does), runs its tests and the smoke check in
// headless WebKit (as the save gate does), and writes what the site serves to
// web/public/templates/apps/. --pictures draws preview-light.png and preview-dark.png from the app
// itself, over its own data, at 1280 px; without it, missing pictures are drawn and others kept.
//   deno run -A scripts/template-apps.ts [<slug>…] [--pictures] [--no-render]
// The server's modules import each other; loading tools.ts first gives them their usual order.
import "../supabase/functions/mcp/tools.ts";
import { brokenImports, linkProject, projectProblems, serialize, sourceProblems, isTest } from "../supabase/functions/mcp/app_project.ts";
import { withFiles } from "../supabase/functions/mcp/app_files.ts";
import { render as renderService, testSummary, type Rendered } from "../supabase/functions/mcp/app_check.ts";
import { declaredHosts, hostDeclared } from "../supabase/functions/mcp/page.ts";
import { fromTree, PREVIEWS, treeProblems } from "../supabase/functions/mcp/template_apps.ts";

const ROOT = new URL("../web/", import.meta.url);
const CONTENT = new URL("content/templates/", ROOT);
const OUT = new URL("public/templates/apps/", ROOT);
const MAX_PICTURE = 400 * 1024;

const args = Deno.args.filter((a) => !a.startsWith("--"));
const pictures = Deno.args.includes("--pictures");
const noRender = Deno.args.includes("--no-render");

/** The folder's files by relative path: text, and the pictures as bytes. */
async function readTree(dir: URL, prefix = ""): Promise<{ text: Record<string, string>; pictures: Record<string, Uint8Array> }> {
  const text: Record<string, string> = {}, pics: Record<string, Uint8Array> = {};
  for await (const e of Deno.readDir(new URL(prefix, dir))) {
    const rel = prefix + e.name;
    if (e.isDirectory) {
      const sub = await readTree(dir, rel + "/");
      Object.assign(text, sub.text); Object.assign(pics, sub.pictures);
    } else if ((PREVIEWS as readonly string[]).includes(rel)) pics[rel] = await Deno.readFile(new URL(rel, dir));
    else text[rel] = await Deno.readTextFile(new URL(rel, dir));
  }
  return { text, pictures: pics };
}

const slugs = args.length ? args : [...Deno.readDirSync(CONTENT)].filter((e) => e.isDirectory && e.name.endsWith(".app")).map((e) => e.name.replace(/\.app$/, "")).sort();
// The render service, in this process, called the way the server's save calls it (app_check.ts).
let service: Deno.HttpServer | null = null;
const render = async (html: string, markdown: string, data: unknown, opts: Record<string, unknown>): Promise<Rendered> => {
  if (!service) {
    Deno.env.set("RENDER_SECRET", Deno.env.get("RENDER_SECRET") ?? crypto.randomUUID());
    const { handle } = await import("./page-render/server.ts");
    service = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
    Deno.env.set("RENDER_URL", `http://127.0.0.1:${service.addr.port}`);
  }
  const r = await renderService({ html, markdown, data, today: new Date().toISOString().slice(0, 10), interact: false, probes: false, ...opts });
  if (typeof r === "string") throw new Error(r);
  return r;
};

let failed = 0;
await Deno.mkdir(OUT, { recursive: true });
for (const slug of slugs) {
  const fail = (why: string[]) => { console.error(`✗ ${slug}\n  - ${why.join("\n  - ")}`); failed++; };
  const dir = new URL(`${slug}.app/`, CONTENT);
  let template: { app?: boolean; note?: string };
  try { template = JSON.parse(await Deno.readTextFile(new URL(`${slug}.json`, CONTENT))); } catch { fail([`web/content/templates/${slug}.json is missing or isn't JSON.`]); continue; }
  if (template.app !== true) { fail([`${slug}.json needs "app": true, since ${slug}.app/ exists.`]); continue; }
  const tree = await readTree(dir);
  const problems = treeProblems(tree.text);
  if (problems.length) { fail(problems); continue; }

  // Compiled and linked exactly as a save on the server does it.
  const { files, data } = fromTree(tree.text);
  let project;
  try { project = await withFiles({ amberApp: 1, files: {}, compiled: {} }, files); } catch (e) { fail([(e as Error).message]); continue; }
  const linked = await linkProject(project);
  if (linked.error) { fail([`The CSS doesn't compile: ${linked.error}`]); continue; }
  const p = linked.project;
  const declared = declaredHosts(p.files["/index.html"] ?? "");
  const refused = [...projectProblems(p), ...sourceProblems(p, (h) => hostDeclared(declared, h)), ...brokenImports(p)];
  if (refused.length) { fail(refused); continue; }
  const stored = serialize(p);
  const note = template.note ?? "";

  if (!noRender) {
    // The save gate: the app's own tests and the smoke check, over the template's data.
    const gate: string[] = [];
    if (Object.keys(p.files).some(isTest)) {
      const t = testSummary(await render(stored, note, data, { tests: true }));
      gate.push(...t.failures.map((f) => `test failed: ${f}`));
      console.log(`  ${slug}: tests ${t.passed} passed, ${t.failed} failed`);
    }
    const smoke = (await render(stored, note, data, { smoke: true })).smoke;
    if (smoke && !smoke.ok) gate.push(...smoke.problems.map((m: string) => `smoke check: ${m}`));
    if (gate.length) { fail(gate); continue; }
    // The site's pictures, from the app itself.
    for (const scheme of ["light", "dark"] as const) {
      const name = `preview-${scheme}.png`;
      if (!pictures && tree.pictures[name]) continue;
      const view = (await render(stored, note, data, { views: [{ width: 1280, scheme }], capture: true })).views[0];
      if (!view?.png) { fail([`${name} couldn't be drawn.`]); continue; }
      tree.pictures[name] = Uint8Array.from(atob(view.png), (ch) => ch.charCodeAt(0));
      await Deno.writeFile(new URL(name, dir), tree.pictures[name]);
    }
  }
  const pics = PREVIEWS.filter((n) => !tree.pictures[n] || tree.pictures[n].length > MAX_PICTURE || tree.pictures[n][1] !== 0x50);
  if (pics.length) { fail(pics.map((n) => `${n}: a PNG under ${MAX_PICTURE / 1024} KB is required (run with --pictures to draw it).`)); continue; }

  await Deno.writeTextFile(new URL(`${slug}.project.json`, OUT), stored);
  await Deno.writeTextFile(new URL(`${slug}.data.json`, OUT), JSON.stringify(data));
  await Deno.writeFile(new URL(`${slug}-light.png`, OUT), tree.pictures["preview-light.png"]);
  await Deno.writeFile(new URL(`${slug}-dark.png`, OUT), tree.pictures["preview-dark.png"]);
  console.log(`✓ ${slug}: ${Object.keys(files).length} files, ${Math.round(new TextEncoder().encode(stored).length / 1024)} KB compiled`);
}
if (service) {
  await service.shutdown();
  await (await import("./page-render/render.ts")).closeBrowser();
}
if (failed) Deno.exit(1);
