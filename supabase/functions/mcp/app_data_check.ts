// Whether a note's app still opens over the data an AI is about to save (data.json, update_page_data).
//
// A change to the app's code is compiled, rendered, tested and smoke-checked before devices run it
// (saveProject). A change to its data wasn't checked at all, and the app reads it the moment it
// arrives. On 2026-11-26 ChatGPT made a meal plan from the template, then filled data.json with a
// week of dinners in a shape the app's code couldn't read (an amount as a number where the app
// expects text). The save answered "saved"; on the person's iPhone the app stopped drawing and
// nothing in it reacted to a tap. The same check the code's saves get now runs over the new data:
// when the app opened over the data before and doesn't over the new data, nothing is saved and the
// AI is told why, so it writes the data the way the app's docs say. The render sees a sample with
// the same shape (app_sample.ts: text stays text, numbers stay numbers), never the person's data.
import { sampleData, sampleNote } from "./app_sample.ts";
import { render, renderedFindings } from "./app_check.ts";
import { supplier } from "./app_blobs.ts";
import { closeStored } from "./data_ops.ts";
import { pageDataProblems, type PageData } from "./page.ts";
import { bodyOf, type Call, type Note, type Tx } from "./tools.ts";

/** What stops the app from opening at phone size over this data, as the render service sees it:
 *  script errors and a blank screen; empty when it opens. Null when there's no render service. */
async function opensOver(tx: Tx, c: Call, html: string, body: string, data: PageData): Promise<string[] | null> {
  const t = new Date().toISOString().slice(0, 10);
  // As devices get it: localStorage as the strings the app stored (the AI sees them parsed).
  const r = await render({ html, markdown: sampleNote(body, t), data: sampleData(closeStored(data), t), today: t, views: [{ width: 390, scheme: "light" }], interact: false, probes: false }, supplier(tx, c));
  if (typeof r === "string") return null;
  return renderedFindings(r).errors.filter((e) => /script error|blank/.test(e));
}

/** Why this data would stop the note's live app from opening, or nothing: also nothing when there's
 *  no app or no render service, or the data is malformed (storePageData says how). The data before
 *  is checked only when the new data fails: an app that was already broken isn't the data's doing. */
export async function dataBreaksApp(tx: Tx, c: Call, n: Note, before: PageData, next: PageData): Promise<string[]> {
  if ((Deno.env.get("PINTO_NO_TRY") ?? Deno.env.get("AMBER_NO_TRY")) === "1" || pageDataProblems(next).length) return [];
  const [row] = await tx<{ page_ct: string | null }[]>`select page_ct from public.note_pages where note_id = ${n.id}`;
  if (!row?.page_ct) return [];
  let html: string;
  try { html = await c.v.openPage(n.id, row.page_ct); } catch { return []; }
  // The note as the app reads it (a path's note may come without its text).
  const [{ body_ct } = { body_ct: null }] = n.body_ct ? [{ body_ct: n.body_ct }] : await tx<{ body_ct: string | null }[]>`select body_ct from public.notes where id = ${n.id}`;
  const body = body_ct ? await bodyOf(c.v, { id: n.id, body_ct }).catch(() => "") : "";
  const now = await opensOver(tx, c, html, body, next);
  if (!now?.length) return [];
  const was = await opensOver(tx, c, html, body, before);
  return was === null || was.length ? [] : now;
}

/** The refusal an AI gets for data the app can't open with. `docs` names where the app's data is
 *  described ("Home/Meal plan.app/docs/README.md"). */
export function dataRefusal(docs: string, problems: string[]): string {
  return `Not saved: with this data the app doesn't open for the person (checked over a sample with the same shape):\n- ${problems.join("\n- ")}\n` +
    `It opened with its data before this change. Give each value the type the app reads (text, number, list), as ${docs} describes it, ` +
    `or change the app's code to read this data, then save again.`;
}
