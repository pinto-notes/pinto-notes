import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appFiles, createStep, instructions, markdownIn, publicTemplate, templates } from "./templates";

// Templates with apps (docs/Technical/templates.md): content/templates/<slug>.app/ is the app as the
// file tools list it, and public/templates/apps/ is what scripts/template-apps.ts compiled from it.
// These keep the two in step and the template's data saying it has an app.
const CONTENT = path.resolve(__dirname, "../content/templates");
const PUBLIC = path.resolve(__dirname, "../public");
const NOT_PROJECT = new Set(["data.json", "preview-light.png", "preview-dark.png"]);
const RUN = "Run deno run -A scripts/template-apps.ts";

/// The folder's files by relative path.
function tree(dir: string, prefix = ""): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  for (const name of readdirSync(path.join(dir, prefix))) {
    const rel = prefix + name;
    if (statSync(path.join(dir, rel)).isDirectory()) Object.assign(out, tree(dir, rel + "/"));
    else out[rel] = readFileSync(path.join(dir, rel));
  }
  return out;
}

/// localStorage as read shows it: parsed (the server's openStored).
function opened(d: { values: Record<string, unknown>; collections: Record<string, unknown> }) {
  const ls = d.values?.localStorage as Record<string, unknown> | undefined;
  if (!ls || typeof ls !== "object") return d;
  const parsed = Object.fromEntries(Object.entries(ls).map(([k, v]) => {
    if (typeof v === "string" && /^\s*[[{"]|^\s*(true|false|null|-?\d)/.test(v)) { try { return [k, JSON.parse(v)]; } catch { /* text */ } }
    return [k, v];
  }));
  return { ...d, values: { ...d.values, localStorage: parsed } };
}

const all = templates();
const apps = all.filter((t) => t.app);
const folders = readdirSync(CONTENT).filter((f) => f.endsWith(".app")).map((f) => f.replace(/\.app$/, ""));

describe("templates with apps", () => {
  it("say they have an app exactly when their folder is there", () => {
    expect(apps.map((t) => t.slug).sort()).toEqual(folders.sort());
  });

  it("serve what the generator compiled from the folder, unchanged since", () => {
    for (const t of apps) {
      const f = appFiles(t.slug);
      for (const p of Object.values(f)) expect(existsSync(path.join(PUBLIC, p)), `${p} is missing. ${RUN} ${t.slug}`).toBe(true);
      const files = tree(path.join(CONTENT, `${t.slug}.app`));
      const project = JSON.parse(readFileSync(path.join(PUBLIC, f.project), "utf8"));
      const source = Object.fromEntries(Object.entries(files).filter(([p]) => !NOT_PROJECT.has(p)).map(([p, b]) => [`/${p}`, b.toString("utf8")]));
      expect(project.files, `${t.slug}: the folder changed since it was compiled. ${RUN} ${t.slug}`).toEqual(source);
      expect(Object.keys(project.compiled).length, t.slug).toBeGreaterThan(0);
      const data = JSON.parse(readFileSync(path.join(PUBLIC, f.data), "utf8"));
      expect(opened(data), `${t.slug}: data.json changed since it was compiled. ${RUN} ${t.slug}`).toEqual(JSON.parse(files["data.json"].toString("utf8")));
      for (const scheme of ["light", "dark"] as const) {
        const pic = readFileSync(path.join(PUBLIC, f[scheme]));
        expect(pic.equals(files[`preview-${scheme}.png`]), `${t.slug}: preview-${scheme}.png changed. ${RUN} ${t.slug}`).toBe(true);
        expect(pic.subarray(1, 4).toString(), t.slug).toBe("PNG");
        expect(pic.length, t.slug).toBeLessThanOrEqual(400 * 1024);
      }
    }
  });

  it("name their app, data and pictures in the data the app fetches; other templates don't", () => {
    for (const t of all) {
      const p = publicTemplate(t) as Record<string, unknown>;
      if (t.app) {
        const f = appFiles(t.slug);
        expect([p.app, p.data, p.preview, p.previewDark]).toEqual([f.project, f.data, f.light, f.dark]);
      } else {
        for (const k of ["app", "data", "preview", "previewDark"]) expect(Object.keys(p), t.slug).not.toContain(k);
      }
    }
  });

  it("have the AI make the note with its app from the template, not from markdown", () => {
    for (const t of apps) {
      for (const i of instructions(t)) {
        expect(i.prompt.startsWith(createStep(t)), t.slug).toBe(true);
        expect(i.prompt).toContain(`create { type: "app", path: "${t.folder}/${t.title}.md", template: "${t.slug}" }`);
        expect(markdownIn(i.prompt), t.slug).toBeNull();
      }
    }
  });
});
