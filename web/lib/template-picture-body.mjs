// What a plain-note template's picture shows: the note as it stands after some of the template's
// demo calls (content/templates/<slug>.json "demo", the calls that turn "note" into "example"), so
// a slide's picture is the note before or after the change its chat talks about. Used by
// web/scripts/template-page-shots.mjs, which hands the result to the app to draw, and by the tests.
// A page about talking to your AI draws the note as a real chat left it instead (`saved`).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/// Notes as real chats left them: content/template-pages/saved/<slug>/<name>.md, each the note pulled
/// from the local stack after a chat with Claude through the Pinto MCP (the transcripts are kept with
/// the report that made them).
export const SAVED = path.join(path.dirname(fileURLToPath(import.meta.url)), "../content/template-pages/saved");

/**
 * A picture's recipe, from content/template-pages/<slug>.json "pictures":
 * - of: "note" is the note as it starts; "example" is the note after the demo calls.
 * - steps: only these demo calls (a count from the first, or their indexes), not all of them.
 * - edits: [old, new] pairs applied after the calls, each found exactly once (a line ticked or
 *   not yet added, where one demo call adds several things at once).
 * - created: instead of the template's note, the note demo call <created> makes (a "create").
 * - saved: instead, the note as a real chat left it (SAVED/<slug>/<saved>.md).
 * - from: the heading the picture is scrolled to.
 * - icon: an emoji put before the title, as Add Icon does (the app draws it large as the note's icon).
 * - cover: a ready-made cover (the app's CoverPattern, by its raw value), set by the app as Add
 *   Cover sets one, so the note is drawn with a banner above its title.
 * - gallery: instead of one note, a folder of notes as the Mac's gallery view shows it, each card a
 *   recipe of its own (`template` takes the note from another template, as "Reading" holds both).
 * - size: the window's size in points, in place of the usual one (a wider gallery shows more cards).
 * Covers and the gallery are experiments (Settings › Experimental in the app): only the picture is
 * drawn with them on.
 * @typedef {{ of?: "example" | "note", steps?: number | number[], edits?: [string, string][], created?: number, saved?: string, from?: string, icon?: string, cover?: string, template?: string, size?: [number, number], gallery?: { folder: string, notes: PictureRecipe[] } }} PictureRecipe
 * @typedef {{ tool: string, args: { old_string?: string, new_string?: string, content?: string, id?: string } }} DemoCall
 */

/**
 * @param {{ slug: string, note: string, demo: DemoCall[] }} t
 * @param {PictureRecipe} pic
 * @returns {string}
 */
export function pictureBody(t, pic) {
  const body = noteBody(t, pic);
  return pic.icon ? `${pic.icon} ${body}` : body;
}

/**
 * @param {{ slug: string, note: string, demo: DemoCall[] }} t
 * @param {PictureRecipe} pic
 * @returns {string}
 */
function noteBody(t, pic) {
  if (pic.saved !== undefined) return readFileSync(path.join(SAVED, t.slug, `${pic.saved}.md`), "utf8");
  if (pic.created !== undefined) {
    const call = t.demo[pic.created];
    if (call?.tool !== "create" || !call.args.content) throw new Error(`${t.slug}: demo call ${pic.created} creates no note`);
    return call.args.content;
  }
  let body = t.note;
  if (pic.of === "example") {
    const all = t.demo.map((_, i) => i);
    const picked = pic.steps === undefined ? all : typeof pic.steps === "number" ? all.slice(0, pic.steps) : pic.steps;
    for (const i of picked) {
      const { tool, args } = t.demo[i];
      if (tool === "create") {
        // A sub-note: Pinto links it at the foot of this note, and the next edit moves the link.
        body = `${body.replace(/\n*$/, "")}\n\n[${(args.content ?? "").split("\n")[0]}](pane-note:${args.id})`;
        continue;
      }
      if (!body.endsWith("\n")) body += "\n"; // a saved note ends with a line break
      if (!body.includes(args.old_string ?? "\u0000")) throw new Error(`${t.slug}: demo call ${i} doesn't apply after ${JSON.stringify(picked)}`);
      body = body.replace(args.old_string, () => args.new_string ?? "");
    }
  }
  for (const [from, to] of pic.edits ?? []) {
    if (body.split(from).length !== 2) throw new Error(`${t.slug}: ${JSON.stringify(from)} isn't in the note exactly once`);
    body = body.replace(from, () => to);
  }
  return body;
}
