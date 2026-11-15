// A whiteboard drawn in a browser (web/lib/board-*.ts) reads on the server as one drawn in the app:
// a member's AI sees its elements, settings and comments in data.json (shared_notes.ts boardData),
// from the same sealed snapshot and change the app's tests open (collab-vectors.json "web",
// PaneTests/CollabCryptoTests whatTheBrowserBoardSealsOpensHere).
//   cd supabase/functions/mcp && deno test -A board_web.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { boardData, loadAutomerge, type Loaded } from "./shared_notes.ts";
import { fromBase64 } from "../_shared/e2ee.ts";
import { open3 } from "../_shared/collab.ts";

const v = JSON.parse(await Deno.readTextFile(new URL("../_shared/collab-vectors.json", import.meta.url)));
const A = await loadAutomerge();

Deno.test("a board the browser wrote reads on the server as the app's: its drawing, settings and comment", async () => {
  const nk = fromBase64(v.note_key);
  let doc = A.loadIncremental(A.init(), await open3("s", v.web.board_snapshot, nk, v.note, String(v.web.board_upto)));
  doc = A.loadIncremental(doc, await open3("u", v.web.board_change, nk, v.note, v.web.user));
  const data = await boardData({ doc, text: "", last: v.web.board_upto + 1, since: 1 } as unknown as Loaded);
  const scene = data.values.scene;
  assertEquals(scene.elements.map((e: Record<string, unknown>) => [e.id, e.x, e.version]), [["box-1", 240, 4], ["note-2", 320, 2]]);
  assertEquals(scene.elements[1].text, "Hej från webben");
  assertEquals(scene.appState, { viewBackgroundColor: "#fffce8", gridModeEnabled: true });
  // The comment, as an AI reads it: by its writer's first name, on its shape.
  const shown = (data.collections as Record<string, { id: string; on?: string; by: string; text?: string }[]>).comments;
  assertEquals(shown.map((c) => [c.id, c.on, c.by, c.text]), [["c-0123456789abcdef", "box-1", "Sara", "Kan vi flytta den här?"]]);
});

Deno.test("the browser's change is sealed to its author: under anyone else's id it doesn't open", async () => {
  const nk = fromBase64(v.note_key);
  let failed = false;
  try { await open3("u", v.web.board_change, nk, v.note, v.from); } catch { failed = true; }
  assertEquals(failed, true);
});
