// Templates that carry a note app (docs/Technical/templates.md). The template's app is a folder
// that mirrors what `list "<Note>.app"` shows: every project file at its path, plus data.json as
// `read "<Note>.app/data.json"` gives it. scripts/template-apps.ts checks and compiles that folder
// for the site; `create { type: "app", template }` fetches it back from the site. Pure, except the
// fetch, which takes its fetch function.
import { cleanPath, MAX_FILE_BYTES, MAX_FILES, parseStored } from "./app_project.ts";
import { closeStored, openStored } from "./data_ops.ts";
import { pageDataProblems, type PageData } from "./page.ts";

/** In the template's folder but not project files: the data and the site's two pictures. */
export const DATA_FILE = "data.json";
export const PREVIEWS = ["preview-light.png", "preview-dark.png"] as const;
export const MAX_DATA_BYTES = 1024 * 1024;

const TEXT = /\.(md|json|html|css|ts|tsx|js|jsx|svg|txt)$/;
const NOT_SOURCE = /(^|\/)(node_modules|dist|build|\.[^/]+)(\/|$)|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$/;

/** Things that look like keys, tokens or private keys. A template is public: none may ship. */
const SECRETS: [string, RegExp][] = [
  ["an OpenAI or Anthropic key", /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/],
  ["a Stripe key", /\b[sr]k_(?:live|test)_[A-Za-z0-9]{10,}/],
  ["a GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ["a Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["an AWS key", /\bAKIA[0-9A-Z]{16}\b/],
  ["a Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["a private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["a JSON web token", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
];

const bytes = (s: string) => new TextEncoder().encode(s).length;

/** What's wrong with a template's folder, by its paths relative to the folder ("src/App.tsx").
 *  The pictures are checked by whoever reads them (they aren't text). */
export function treeProblems(tree: Record<string, string>): string[] {
  const out: string[] = [];
  const names = Object.keys(tree).filter((p) => !(PREVIEWS as readonly string[]).includes(p));
  const files = names.filter((p) => p !== DATA_FILE);
  if (!files.includes("index.html")) out.push("index.html is missing: it's the page the app opens.");
  if (!names.includes(DATA_FILE)) out.push("data.json is missing: the app's starting data, as read \"<Note>.app/data.json\" shows it ({ \"values\": {}, \"collections\": {} } for none).");
  if (files.length > MAX_FILES) out.push(`${files.length} files; at most ${MAX_FILES}.`);
  for (const p of names) {
    if (NOT_SOURCE.test(p)) { out.push(`${p}: dotfiles, node_modules, build output and lock files don't belong in a template.`); continue; }
    if (!TEXT.test(p)) { out.push(`${p}: only text files (.md .json .html .css .ts .tsx .js .jsx .svg .txt).`); continue; }
    try { cleanPath(p); } catch (e) { out.push((e as Error).message); continue; }
    const text = tree[p];
    if (p !== DATA_FILE && bytes(text) > MAX_FILE_BYTES) out.push(`${p} is over ${MAX_FILE_BYTES / 1024} KB.`);
    for (const [what, re] of SECRETS) if (re.test(text)) out.push(`${p} holds what looks like ${what}. Templates are public: take it out.`);
  }
  if (names.includes(DATA_FILE)) {
    const text = tree[DATA_FILE];
    if (bytes(text) > MAX_DATA_BYTES) out.push(`data.json is over ${MAX_DATA_BYTES / 1024 / 1024} MB.`);
    let d: unknown;
    try { d = JSON.parse(text); } catch (e) { out.push(`data.json isn't JSON: ${(e as Error).message}`); }
    if (d !== undefined) {
      if (!d || typeof d !== "object" || Array.isArray(d)) out.push("data.json must be an object: { \"values\": { … }, \"collections\": { … } }.");
      else {
        out.push(...pageDataProblems(closeStored(normalData(d as Partial<PageData>))).map((m) => `data.json: ${m}`));
        if (/"\$file"\s*:/.test(text)) out.push("data.json points at files ($file): a template's files don't come along. Leave them out.");
      }
    }
  }
  return out;
}

const normalData = (d: Partial<PageData>): PageData => ({ ...d, values: d.values ?? {}, collections: d.collections ?? {} }) as PageData;

/** The folder as a project and its data, in the stored form (page_ct's files, data_ct's JSON). */
export function fromTree(tree: Record<string, string>): { files: Record<string, string>; data: PageData } {
  const files: Record<string, string> = {};
  for (const [p, text] of Object.entries(tree)) if (p !== DATA_FILE && !(PREVIEWS as readonly string[]).includes(p)) files[cleanPath(p)] = text;
  return { files, data: closeStored(normalData(JSON.parse(tree[DATA_FILE] ?? "{}"))) };
}

/** A stored app back as the template's folder: what list and read would show. */
export function toTree(files: Record<string, string>, data: PageData): Record<string, string> {
  const tree: Record<string, string> = {};
  for (const [p, text] of Object.entries(files)) tree[p.replace(/^\//, "")] = text;
  tree[DATA_FILE] = JSON.stringify(openStored(normalData(data)), null, 2);
  return tree;
}

/** A template as the site serves it (/templates/<slug>.json) with its app and data fetched. */
export type TemplateApp = { slug: string; title: string; folder: string | null; note: string; files: Record<string, string>; data: PageData };

export const validSlug = (s: string) => s.length <= 64 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

/** The site the server fetches templates from. */
export const templateSite = () => (Deno.env.get("TEMPLATE_SITE_URL") ?? "https://pintonotes.com").replace(/\/$/, "");

/** Fetches a template with an app from the site. Throws a message for the AI when it can't. */
export async function fetchTemplateApp(slug: string, site = templateSite(), get: typeof fetch = fetch): Promise<TemplateApp> {
  if (!validSlug(slug)) throw new Error(`"${slug}" isn't a template name: lowercase words joined by hyphens, as in pintonotes.com/templates/<name>.`);
  const at = async (path: string) => {
    if (!path.startsWith("/") || path.startsWith("//")) throw new Error(`The template points at ${path}, which isn't on the site.`);
    const res = await get(`${site}${path}`, { headers: { accept: "application/json" }, redirect: "follow" });
    if (res.status === 404) { await res.body?.cancel(); throw new Error(`There's no template "${slug}". See pintonotes.com/templates for the names.`); }
    if (!res.ok) { await res.body?.cancel(); throw new Error(`The template couldn't be fetched (the site answered ${res.status}). Try again.`); }
    const text = await res.text();
    if (bytes(text) > 8 * 1024 * 1024) throw new Error("The template is too big.");
    return text;
  };
  const t = JSON.parse(await at(`/templates/${slug}.json`)) as { slug?: string; title?: string; folder?: string; note?: string; app?: string; data?: string };
  if (typeof t.note !== "string" || typeof t.title !== "string") throw new Error(`The template "${slug}" didn't read.`);
  if (typeof t.app !== "string") throw new Error(`The template "${slug}" has no app: make its note with create (type "note").`);
  const project = parseStored(await at(t.app));
  const data = typeof t.data === "string" ? normalData(JSON.parse(await at(t.data))) : { values: {}, collections: {} };
  return { slug, title: t.title, folder: t.folder?.trim() || null, note: t.note, files: project.files, data };
}
