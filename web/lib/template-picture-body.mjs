// What a plain-note template's picture shows: the note as it stands after some of the template's
// demo calls (content/templates/<slug>.json "demo", the calls that turn "note" into "example"), so
// a slide's picture is the note before or after the change its chat talks about. Used by
// web/scripts/template-page-shots.mjs, which hands the result to the app to draw, and by the tests.

/**
 * A picture's recipe, from content/template-pages/<slug>.json "pictures":
 * - of: "note" is the note as it starts; "example" is the note after the demo calls.
 * - steps: only these demo calls (a count from the first, or their indexes), not all of them.
 * - edits: [old, new] pairs applied after the calls, each found exactly once (a line ticked or
 *   not yet added, where one demo call adds several things at once).
 * - created: instead of the template's note, the note demo call <created> makes (a "create").
 * - from: the heading the picture is scrolled to.
 * @typedef {{ of: "example" | "note", steps?: number | number[], edits?: [string, string][], created?: number, from?: string }} PictureRecipe
 * @typedef {{ tool: string, args: { old_string?: string, new_string?: string, content?: string, id?: string } }} DemoCall
 */

/**
 * @param {{ slug: string, note: string, demo: DemoCall[] }} t
 * @param {PictureRecipe} pic
 * @returns {string}
 */
export function pictureBody(t, pic) {
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
