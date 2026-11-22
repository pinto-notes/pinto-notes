import { readFileSync } from "node:fs";
import path from "node:path";
import type { PictureRecipe } from "./template-picture-body.mjs";
import { instructions, template, templates, type Template } from "./templates";

/// A template's page in layout D (Emil, 22 November 2026; modelled on how Notion's gallery lists a
/// template): the title, one line, Get template, then a gallery of slides, each a short chat over the
/// real app, and About, the facts, How to get it and More templates. Each page's words and pictures
/// are content/template-pages/<slug>.json, so the copy can be swapped without touching the page.
///
/// Truth: a slide's bubbles say what the template's tools really do (its demo calls and example, or
/// for an app, its prompt and sample data), and its pictures are the real app: the app templates
/// drawn by scripts/template-page-shots.ts (the render service's code), the rest by the Mac app
/// offscreen and the iPhone app on a headless simulator (PaneTests/HIG/TemplatePageShots.swift,
/// through web/scripts/template-page-shots.mjs), each at the step of the demo its slide is about.
/// The pages about talking to your AI (meeting notes, the journal, the planner and seven more) show
/// real chats instead: each slide is one exchange with Claude through the Pinto MCP on the local
/// stack, in a fresh chat after the first, shortened; under it is the note as that chat left it
/// (content/template-pages/saved/<slug>/after-chat<n>.md), so a later slide shows the AI answering
/// from the note alone.

export type Slide = {
  /// The thumbnail's words under the gallery.
  label: string;
  /// What the person says, and the reply. No speaker labels; the reply says what the tools did.
  you?: string;
  ai?: string;
  /// Instead of a chat: one line over the pictures ("Or tick and edit it yourself.").
  note?: string;
  /// Pictures, by name in public/templates/page/<slug>/: a Mac window with the phone over it, or the phone alone.
  mac?: string;
  phone: string;
  alt: string;
  /// A Before and After switch over the pictures: the before ones.
  before?: { mac: string; phone: string; alt: string };
};

export type TemplatePage = {
  /// One line under the title and the facts line.
  subtitle: string;
  /// Two sentences beside the gallery.
  about: string;
  /// The third step: its title ("Ask for the tracker") and the line shown in the prompt box.
  ask: { step: string; prompt: string };
  slides: Slide[];
  /// A plain-note template's pictures, for the tests that draw them ("mac-…" on the Mac, "phone-…" on
  /// the iPhone): the note as it starts ("note") or after the demo calls ("example"; only some of
  /// them with `steps`, then `edits`), or the note a demo call creates (`created`), scrolled to a
  /// heading with `from`. lib/template-picture-body.mjs makes the note from these.
  pictures?: Record<string, PictureRecipe>;
};

const DIR = path.join(process.cwd(), "content/template-pages");
const cache = new Map<string, TemplatePage>();

export function templatePage(slug: string): TemplatePage {
  let p = cache.get(slug);
  if (!p) { p = JSON.parse(readFileSync(path.join(DIR, `${slug}.json`), "utf8")) as TemplatePage; cache.set(slug, p); }
  return p;
}

/// The page's heading: what people search for, with both AIs named once.
export const heading = (t: Pick<Template, "title">) => `${t.title} template for ChatGPT and Claude`;
/// The template's name in a sentence ("the habit tracker template", "the 1:1 notes template", "the Cornell notes template").
export const named = (t: Pick<Template, "title">) => (/^[A-Z][a-z]/.test(t.title) && !/^Cornell/.test(t.title) ? t.title[0].toLowerCase() + t.title.slice(1) : t.title);

export const picture = (slug: string, name: string) => `/templates/page/${slug}/${name}.webp`;

/// The Get template button's line, and the facts beside the gallery. Only what's true of every
/// template: Pinto Notes is free on the Mac and on the iPhone, and both AIs connect to it.
export const INSTALLS = "Installs Pinto Notes, free on Mac and iPhone";
export const BYLINE = "Free · Mac and iPhone";

/// "November 2026", from the day the template was last checked.
export function updatedMonth(t: Pick<Template, "updated">): string {
  return new Date(`${t.updated}T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/// What the prompt box copies: the line it shows, then the whole prompt that makes this exact
/// template (its name and, for an app, its slug in create), so a visitor without the app yet keeps
/// the template they came for: they paste it once their AI is connected. A plain note's prompt
/// carries its markdown, since create only fetches app templates by name.
export function copiedPrompt(t: Template, page: TemplatePage): string {
  const whole = instructions(t).find((i) => i.client === "chatgpt")!.prompt;
  return `${page.ask.prompt}\n\n${whole}`;
}

/// Four more templates: the template's own related ones, then others from its category, then the rest, in gallery order.
export function moreTemplates(t: Template, count = 4): Template[] {
  const picked = t.related.map((r) => template(r)).filter((r): r is Template => Boolean(r));
  for (const o of [...templates().filter((x) => x.category === t.category), ...templates()]) {
    if (picked.length >= count) break;
    if (o.slug !== t.slug && !picked.includes(o)) picked.push(o);
  }
  return picked.slice(0, count);
}
