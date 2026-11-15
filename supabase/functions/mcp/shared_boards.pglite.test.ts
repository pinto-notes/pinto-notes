// Shared whiteboards through the file tools (shared_notes.ts, writeBoard): a board shared with people
// keeps its drawing in the note's Automerge document, one element per key of `board`
// (Pane/Collab/CollabBoard.swift). A member's AI reads it as the board's data.json, and what it
// writes goes in as one sealed change, newer than every device's copy, merged with what people draw.
//   cd supabase/functions/mcp && deno test -A shared_boards.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { account, app, note, toolContext } from "./sealed.ts";
import { ToolError } from "./tools.ts";
import { runFileTool } from "./files_tools.ts";
import { loadAutomerge } from "./shared_notes.ts";
import { aesKey, type Bytes, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import { bytes, identityContext, newIdentity, noteKeyContext, open3, seal3, sealNoteKey } from "../_shared/collab.ts";

const A = await loadAutomerge();
type Board = { body?: string; board?: Record<string, unknown>; boardState?: Record<string, unknown> };
type Doc = ReturnType<typeof A.init<Board>>;

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, p: Person, name: string, args: Record<string, unknown> = {}, client = "Claude") => await runFileTool(name, args, { ...await toolContext(pg, p.a, client), session: `s-${p.a.id}` }) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };

async function person(pg: PGlite, name: string) {
  const a = await account(pg);
  await app(pg, a.id, `insert into public.profiles (display_name) values ($1)`, [`${name} Lind`]);
  const identity = await newIdentity();
  const privateWrap = await seal(toBase64(identity.d), await aesKey(a.dk), a.keyId, identityContext(a.id));
  await app(pg, a.id, `select public.collab_publish_identity($1, $2)`, [toBase64(identity.publicRaw), privateWrap]);
  return { a, id: a.id, name, identity };
}
type Person = Awaited<ReturnType<typeof person>>;
const selfWrap = async (p: Person, nk: Bytes, id: string, epoch: number) => await seal(toBase64(nk), await aesKey(p.a.dk), p.a.keyId, noteKeyContext(id, epoch));

/** A shape as a board saves it. */
const shape = (id: string, o: Record<string, unknown> = {}) => ({
  id, type: "rectangle", x: 0, y: 0, width: 120, height: 60, angle: 0, version: 1, versionNonce: 1, index: "a0", isDeleted: false, seed: 7,
  strokeColor: "#1e1e1e", backgroundColor: "transparent", updated: 1, ...o,
});
const raw = (e: unknown) => new A.ImmutableString(JSON.stringify(e));

/** A device in the board: its own copy of the document, sending sealed changes as CollabSession does. */
class Device {
  doc: Doc;
  constructor(readonly pg: PGlite, readonly p: Person, readonly id: string, readonly nk: Bytes, doc?: Doc) { this.doc = doc ?? A.init(); }
  async draw(fn: (d: Board) => void) {
    this.doc = A.change(this.doc, fn);
    const ct = await seal3("u", A.getLastLocalChange(this.doc)! as Bytes, this.nk, this.id, 1, this.p.id);
    await app(this.pg, this.p.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, $2, $3)`, [this.id, 1, ct]);
  }
  async pull() {
    const rows = await app(this.pg, this.p.id, `select epoch, author_id, ct from public.note_updates where note_id = $1 order by id`, [this.id]);
    for (const r of rows) this.doc = A.loadIncremental(this.doc, await open3("u", r.ct, this.nk, this.id, r.author_id));
    return this.doc;
  }
  /** Each element as the devices resolve it: the higher version, then the lower nonce. */
  elements(): Record<string, Record<string, unknown>> {
    const out: Record<string, Record<string, unknown>> = {};
    for (const id of Object.keys(this.doc.board ?? {})) {
      // deno-lint-ignore no-explicit-any
      const conflicts = A.getConflicts(this.doc.board as any, id); // none when only one device wrote it
      const all = (conflicts ? Object.values(conflicts) : [this.doc.board![id]]).map((v) => JSON.parse(String((v as { val: string }).val ?? v)));
      all.sort((x, y) => (y.version - x.version) || (x.versionNonce - y.versionNonce));
      out[id] = all[0];
    }
    return out;
  }
}

const CANVAS = JSON.stringify({ amberApp: 1, files: { "/index.html": `<!doctype html>\n<meta name="pinto-canvas" content="1">\n<div id="canvas"></div>`, "/README.md": "# Whiteboard\n" } });

/** Emil's whiteboard "Launch plan", shared: Sara can edit, Eve can view. Each has it in their notes
 *  as a board (a pointer with the canvas page, as their devices make it). */
async function board(pg: PGlite) {
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), eve = await person(pg, "Eve");
  const id = await note(pg, emil.a, "Launch plan");
  await app(pg, emil.id, `insert into public.note_pages (note_id, page_ct) values ($1, $2)`, [id, await emil.a.vault.sealPage(id, CANVAS)]);
  const nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id });
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [id, toSelf, await selfWrap(emil, nk, id, 1), await seal3("h", bytes(JSON.stringify({ title: "Launch plan" })), nk, id, 1)]);
  await pg.query(`update public.notes set shared_note_id = $1 where id = $1`, [id]);
  const mac = new Device(pg, emil, id, nk);
  await mac.draw((d) => {
    d.body = "Launch plan";
    d.board = { a: raw(shape("a", { x: 10 })), b: raw(shape("b", { x: 200, index: "a1" })) };
    d.boardState = { viewBackgroundColor: new A.ImmutableString("#ffffff") };
  });
  const pointers: Record<string, string> = {};
  for (const [p, role] of [[sara, "editor"], [eve, "viewer"]] as const) {
    const wrap = await sealNoteKey(nk, emil.identity, p.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: p.id });
    await app(pg, emil.id, `select public.collab_invite($1, $2, $3, $4, 1)`, [id, p.id, role, wrap]);
    await app(pg, p.id, `select public.collab_accept($1, $2)`, [id, await selfWrap(p, nk, id, 1)]);
    const pointer = await note(pg, p.a, "Launch plan\n\nThis note is shared. Open it in Pinto Notes.\n");
    await app(pg, p.id, `update public.notes set shared_note_id = $2 where id = $1`, [pointer, id]);
    await app(pg, p.id, `insert into public.note_pages (note_id, page_ct) values ($1, $2)`, [pointer, await p.a.vault.sealPage(pointer, CANVAS)]);
    pointers[p.name] = pointer;
  }
  return { emil, sara, eve, id, nk, mac, pointers };
}

const DATA = "Shared with me/Launch plan.app/data.json";

Deno.test("a member's AI reads a shared whiteboard's drawing as its data.json", async () => {
  const pg = await schemaDB();
  const { sara } = await board(pg);
  const read = await tool(pg, sara, "fetch", { id: DATA });
  const json = JSON.parse(read.text.split("\n").map((l: string) => l.replace(/^\s*\d+\t/, "")).join("\n"));
  assertEquals(json.values.scene.elements.map((e: { id: string; x: number }) => [e.id, e.x]), [["a", 10], ["b", 200]]);
  assertEquals(json.values.scene.appState.viewBackgroundColor, "#ffffff");
  assertStringIncludes(read.metadata.shared, "draw");
  assertStringIncludes(read.metadata.about, "an AI can't add a new picture");
});

Deno.test("an AI's drawing is one sealed change by the person, newer than every copy, merged with people drawing", async () => {
  const pg = await schemaDB();
  const { sara, id, nk, mac } = await board(pg);
  assertStringIncludes(await fails(tool(pg, sara, "edit", { path: DATA, old_string: `"x": 200`, new_string: `"x": 260` })), "Read Shared with me/Launch plan.app/data.json with fetch");
  const read = await tool(pg, sara, "fetch", { id: DATA });
  const scene = JSON.parse(read.text.split("\n").map((l: string) => l.replace(/^\s*\d+\t/, "")).join("\n")).values.scene;
  // Emil moves "a" on his Mac after Sara's AI read the board.
  await mac.draw((d) => { d.board!.a = raw(shape("a", { x: 40, version: 2, versionNonce: 5 })); });
  // Her AI moves "b" and adds a sticky (with no id) and a label in the short form, from what it read.
  scene.elements[1].x = 260;
  scene.elements.push({ type: "rectangle", x: 0, y: 200, width: 180, height: 70, backgroundColor: "#fff3bf", label: { text: "Budget" } });
  const out = await tool(pg, sara, "write", { path: DATA, content: JSON.stringify({ values: { scene }, collections: {} }) });
  assertEquals(out.saved, DATA);
  assertStringIncludes(out.shared, "merged with what others draw");

  const els = (await mac.pull(), mac.elements());
  assertEquals(els.a.x, 40, "Emil's move stays: the AI's copy of it was older");
  assertEquals([els.b.x, els.b.version], [260, 2], "the AI's move is newer than the board's copy");
  assert(els.b.versionNonce !== 1);
  const sticky = Object.values(els).find((e) => (e.label as { text?: string } | undefined)?.text === "Budget");
  assert(sticky && typeof sticky.id === "string" && sticky.id.startsWith("ai-"), "a new element gets an id");

  // One change, Sara's, from Claude, named for her AI; the server sees none of the drawing.
  const [u] = (await pg.query<{ author_id: string; client: string; ct: string }>(`select author_id, client, ct from public.note_updates where note_id = $1 order by id desc limit 1`, [id])).rows;
  assertEquals([u.author_id, u.client], [sara.id, "Claude"]);
  assert(!u.ct.includes("Budget"));
  assertEquals(A.decodeChange(await open3("u", u.ct, nk, id, sara.id)).message, "Sara's Claude");
  // Stored as the devices store them: scalar strings, not text.
  assert(A.isImmutableString((mac.doc.board as Record<string, unknown>).b));
});

Deno.test("an element left out of data.json is deleted, unless someone drew it after the AI read the board", async () => {
  const pg = await schemaDB();
  const { sara, mac } = await board(pg);
  const read = await tool(pg, sara, "fetch", { id: DATA });
  const scene = JSON.parse(read.text.split("\n").map((l: string) => l.replace(/^\s*\d+\t/, "")).join("\n")).values.scene;
  // Emil draws "c" after the AI read the board.
  await mac.draw((d) => { d.board!.c = raw(shape("c", { index: "a2", updated: Date.now() + 1000 })); });
  // The AI writes the board back without "a".
  scene.elements = scene.elements.filter((e: { id: string }) => e.id !== "a");
  await tool(pg, sara, "write", { path: DATA, content: JSON.stringify({ values: { scene }, collections: {} }) });
  const els = (await mac.pull(), mac.elements());
  assertEquals([els.a.isDeleted, els.a.version], [true, 2], "kept as deleted, so a device that was away can't bring it back");
  assertEquals(els.c.isDeleted, false, "Emil's new shape stays: the AI never saw it");
  assertEquals(els.b.version, 1, "untouched");
});

Deno.test("an AI doesn't put a new picture on a shared whiteboard, and is told", async () => {
  const pg = await schemaDB();
  const { sara, mac } = await board(pg);
  await tool(pg, sara, "fetch", { id: DATA });
  const out = await tool(pg, sara, "edit", { path: DATA, old_string: `"elements": [`, new_string: `"elements": [\n{ "type": "image", "id": "pic", "fileId": "f1", "x": 0, "y": 0, "width": 10, "height": 10 },` });
  assertEquals(out.unchanged, true);
  assertStringIncludes(out.pictures, "A new picture was left out: an AI can't put a new picture on a shared whiteboard");
  assertEquals(Object.keys((await mac.pull(), mac.elements())).sort(), ["a", "b"]);
});

Deno.test("a picture people put on a shared whiteboard: an AI reads it, moves it and deletes it like any element", async () => {
  const pg = await schemaDB();
  const { sara, mac } = await board(pg);
  // Emil pastes a screenshot on his Mac: the image element goes in the document (its bytes in note_files).
  await mac.draw((d) => { d.board!.pic = raw(shape("pic", { type: "image", fileId: "pinto-shot", status: "saved", index: "a2" })); });
  const read = async () => JSON.parse((await tool(pg, sara, "fetch", { id: DATA })).text.split("\n").map((l: string) => l.replace(/^\s*\d+\t/, "")).join("\n")).values.scene;
  const scene = await read();
  const pic = scene.elements.find((e: { id: string }) => e.id === "pic");
  assertEquals([pic.type, pic.fileId], ["image", "pinto-shot"]);
  assertEquals(scene.files, {}, "its bytes aren't in data.json");

  // Moved: taken as any element's change.
  pic.x = 300;
  const out = await tool(pg, sara, "write", { path: DATA, content: JSON.stringify({ values: { scene }, collections: {} }) });
  assertEquals([out.saved, out.pictures], [DATA, undefined]);
  let els = (await mac.pull(), mac.elements());
  assertEquals([els.pic.x, els.pic.version, els.pic.fileId], [300, 2, "pinto-shot"]);

  // Left out of the next write: deleted, as any element is.
  const again = await read();
  again.elements = again.elements.filter((e: { id: string }) => e.id !== "pic");
  await tool(pg, sara, "write", { path: DATA, content: JSON.stringify({ values: { scene: again }, collections: {} }) });
  els = (await mac.pull(), mac.elements());
  assertEquals([els.pic.isDeleted, els.pic.version], [true, 3]);
});

Deno.test("a viewer's AI reads a shared whiteboard but doesn't change it, nor anyone's AI its page", async () => {
  const pg = await schemaDB();
  const { eve, sara } = await board(pg);
  const read = await tool(pg, eve, "fetch", { id: DATA });
  assertEquals(read.metadata.read_only, true);
  assertStringIncludes(await fails(tool(pg, eve, "edit", { path: DATA, old_string: `"x": 200`, new_string: `"x": 260` })), "view only");
  assertStringIncludes(await fails(tool(pg, sara, "write", { path: "Shared with me/Launch plan.app/index.html", content: "<p>hi</p>" })), "its page stays as it is");
});
