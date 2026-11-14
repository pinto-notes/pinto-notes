// check_app and preview_app: what's wrong with a note's app, read from its HTML here and measured
// in a real browser by the render service (scripts/page-render/server.ts) when the server has one
// (RENDER_URL, RENDER_SECRET). The service gets a sample note and sample data unless the person
// turned on previews with real data.

import { pageProblems } from "./page.ts";
import { pageWarnings } from "./page_lint.ts";
import { libraryReport } from "./libraries.ts";
import { brokenImports, parseStored, projectProblems, sourceProblems, styleWarnings } from "./app_project.ts";

/** Findings that need only the HTML: the server's refusals and warnings. */
export function staticReport(html: string, body: string): { errors: string[]; warnings: string[] } {
  const p = parseStored(html);
  if (Object.keys(p.files).length > 1 || Object.keys(p.compiled).length) {
    return { errors: [...projectProblems(p), ...sourceProblems(p), ...brokenImports(p)], warnings: styleWarnings(p) };
  }
  return { errors: pageProblems(html), warnings: [...pageWarnings(html, body), ...libraryReport(html)] };
}

type View = {
  name: string; width: number; scheme: string; errors: string[]; overflowPx: number; textLength: number; contrast: number; bgLuminance: number;
  unnamedControls: string[]; smallTargets: number; smallText?: string[]; smallTextCount?: number; faintText?: string[]; faintCount?: number;
  headings?: string[]; excerpt?: string; png?: string;
  titleCount?: number; ghostFields?: string[]; sections?: number; nav?: boolean; junk?: string[]; under44?: string[]; under44Count?: number; clipped?: string[]; clippedCount?: number; usedWidth?: number; canvases?: number; svgShapes?: number; gridCols?: number; frames?: number;
};
export type Rendered = { views: View[]; interaction: { tried: string; ok: boolean | null; error?: string; framesPerSecond?: number }; probes: Record<string, { pass: boolean; detail?: string }>; blocked: string[]; ms: number;
  trial?: { step: Record<string, unknown>; ok: boolean; error?: string; png?: string; errors: string[]; screen: string[]; data: string[] }[];
  tests?: { name: string; ok: boolean; error?: string; ms: number; file?: string }[]; testErrors?: string[]; smoke?: { ok: boolean; problems: string[]; taps: number; slow?: { name: string; ms: number; width: number }[] } };

/** run_app_tests' answer: counts, and each failure with its message. */
export function testSummary(r: Rendered): { passed: number; failed: number; failures: string[] } {
  const t = r.tests ?? [];
  return { passed: t.filter((x) => x.ok).length, failed: t.filter((x) => !x.ok).length + (r.testErrors?.length ?? 0),
    failures: [...(r.testErrors ?? []), ...t.filter((x) => !x.ok).map((x) => `${x.file ? x.file + ": " : ""}${x.name}: ${x.error}`)] };
}

/** The tests that failed in the first run and passed in a second over the same code: they pass only
 *  sometimes. In the real-AI run (8 Nov) a save that changed only docs/README.md was held back by a
 *  test that had passed on the save before, and the AI couldn't tell it hadn't broken anything. */
export function flakyTests(first: Rendered, again: Rendered): string[] {
  const id = (x: { file?: string; name: string }) => `${x.file ? x.file + ": " : ""}${x.name}`;
  const passed = new Set((again.tests ?? []).filter((x) => x.ok).map(id));
  return (first.tests ?? []).filter((x) => !x.ok && passed.has(id(x))).map(id);
}

const same = (a: string, b: string) => a.toLowerCase().replace(/\s+/g, " ").trim() === b.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * The app owns the note's title: its first heading is the title (nothing around the app draws it),
 * and the title isn't shown twice.
 */
export function titleReport(r: Rendered, title: string): string[] {
  const v = r.views[0];
  if (!v?.headings) return [];
  const out: string[] = [];
  if (!v.headings.length || !same(v.headings[0], title)) {
    out.push(`The app's first heading should be the note's title ("${title}"), read from pinto.note.title: nothing around the app shows the title.${v.headings[0] ? ` Its first heading is "${v.headings[0]}".` : " It has no heading."}`);
  }
  const twice = Math.max(v.headings.filter((h) => same(h, title)).length, v.titleCount ?? 0);
  if (twice > 1) out.push(`The note's title is shown ${twice} times; show it once, as the first heading.`);
  return out;
}

/**
 * What the browser saw, in two kinds. errors: the app is broken for the person (a script error,
 * sideways scrolling, text you can't read, a blank screen, markup from its data running, something
 * it tried to load). notes: information for the AI's own judgment (small targets, faint text, a
 * crowded first screen, an empty wide window…), never a reason to call the app unfinished.
 */
export function renderedFindings(r: Rendered): { errors: string[]; notes: string[] } {
  const errors: string[] = [], notes: string[] = [];
  for (const v of r.views) {
    for (const e of [...new Set(v.errors)].slice(0, 3)) errors.push(`${v.name}: script error: ${e}`);
    if (v.overflowPx > 1) errors.push(`${v.name}: wider than the screen by ${v.overflowPx} px (content is cut off at the right edge).`);
    if (v.textLength < 10) errors.push(`${v.name}: shows almost no text (a blank screen?).`);
    if (v.contrast < 3) errors.push(`${v.name}: body text is hard to see (contrast ${v.contrast.toFixed(1)}:1 against its background${v.scheme === "dark" ? ", in dark mode" : ""}).`);
    else if (v.contrast < 4.5) notes.push(`${v.name}: body text contrast is ${v.contrast.toFixed(1)}:1 (4.5:1 reads well).`);
    if (v.junk?.length) notes.push(`${v.name}: shows ${v.junk.map((j) => `"${j}"`).join(", ")}, probably a value used before it was ready or a missing field.`);
    if ((v.faintCount ?? 0) > 0) notes.push(`${v.name}: ${v.faintCount} text element(s) with contrast under 4.5:1 (${(v.faintText ?? []).slice(0, 3).map((t) => `"${t}"`).join(", ")}).`);
    if ((v.smallTextCount ?? 0) > 0) notes.push(`${v.name}: ${v.smallTextCount} text element(s) under 12 px (${(v.smallText ?? []).slice(0, 3).map((t) => `"${t}"`).join(", ")}).`);
    if ((v.clippedCount ?? 0) > 0) notes.push(`${v.name}: ${v.clippedCount} text element(s) cut off by their box (${(v.clipped ?? []).slice(0, 3).map((t) => `"${t}"`).join(", ")}).`);
    if (v.ghostFields?.length) notes.push(`${v.name}: ${v.ghostFields.length} field(s) without a visible border or fill: ${v.ghostFields.slice(0, 3).join(", ")}.`);
    if (v.unnamedControls.length) notes.push(`${v.name}: ${v.unnamedControls.length} control(s) without a label VoiceOver can read: ${v.unnamedControls.slice(0, 2).join(" ")}`);
    if (v.width < 600 && (v.under44Count ?? 0) > 0) notes.push(`${v.name}: ${v.under44Count} control(s) smaller than 44 pt to tap (${(v.under44 ?? []).slice(0, 3).map((t) => `"${t}"`).join(", ")}).`);
    if (v.width < 600 && (v.sections ?? 0) > 5) notes.push(`${v.name}: the first screen stacks ${v.sections} separate sections.`);
    if (v.width >= 1100 && v.usedWidth !== undefined && v.usedWidth > 0 && v.usedWidth < 0.45) notes.push(`${v.name}: the content uses ${Math.round(v.usedWidth * 100)}% of the window's width.`);
  }
  if (r.interaction.tried !== "none" && r.interaction.ok === false) (/error/i.test(r.interaction.error ?? "") ? errors : notes).push(`Using the app's first control: ${r.interaction.error ?? "nothing changed"}.`);
  for (const [k, p] of Object.entries(r.probes ?? {})) {
    if (p.pass) continue;
    if (k === "escapes") errors.push("A value with < and & in it ran as HTML: the app puts its data into the page unescaped.");
    if (k === "empty") errors.push(`With no data the app breaks: ${p.detail ?? ""}.`);
    if (k === "large") (/ms to load/.test(p.detail ?? "") ? notes : errors).push(`With 400 records: ${p.detail ?? "it fails"}.`);
    if (k === "follows") notes.push(`A new record in its data didn't show on the first screen: ${p.detail ?? ""}.`);
  }
  if (r.blocked.length) errors.push(`The app tried to load ${r.blocked.slice(0, 2).join(", ")}: nothing outside the app loads.`);
  return { errors: [...new Set(errors)], notes: [...new Set(notes)] };
}

/** Everything the browser saw, errors first (for callers that want one list). */
export function renderedReport(r: Rendered): string[] {
  const f = renderedFindings(r);
  return [...f.errors, ...f.notes];
}

/** Calls the render service, or says why it can't. */
export async function render(payload: Record<string, unknown>): Promise<Rendered | string> {
  const url = Deno.env.get("RENDER_URL"), secret = Deno.env.get("RENDER_SECRET");
  if (!url || !secret) return "This server has no app renderer configured, so only the checks that need no browser ran.";
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30_000);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/render`, { method: "POST", headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" }, body: JSON.stringify(payload), signal: ctl.signal });
    if (!res.ok) { await res.body?.cancel(); return `The app renderer answered ${res.status}; only the checks that need no browser ran.`; }
    return await res.json() as Rendered;
  } catch {
    return "The app renderer didn't answer in time; only the checks that need no browser ran.";
  } finally {
    clearTimeout(timer);
  }
}
