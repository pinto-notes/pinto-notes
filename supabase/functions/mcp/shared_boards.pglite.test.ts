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
type Board = { body?: string; board?: Record<string, unknown>; boardState?: Record<string, unknown>; comments?: Record<string, unknown> };
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
  assertStringIncludes(read.metadata.about, "Pictures can't go on a shared whiteboard yet");
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

Deno.test("pictures aren't put on a shared whiteboard, and the AI is told", async () => {
  const pg = await schemaDB();
  const { sara, mac } = await board(pg);
  await tool(pg, sara, "fetch", { id: DATA });
  const out = await tool(pg, sara, "edit", { path: DATA, old_string: `"elements": [`, new_string: `"elements": [\n{ "type": "image", "id": "pic", "fileId": "f1", "x": 0, "y": 0, "width": 10, "height": 10 },` });
  assertEquals(out.unchanged, true);
  assertStringIncludes(out.pictures, "pictures can't go on a shared whiteboard yet");
  assertEquals(Object.keys((await mac.pull(), mac.elements())).sort(), ["a", "b"]);
});

Deno.test("a viewer's AI reads a shared whiteboard but doesn't change it, nor anyone's AI its page", async () => {
  const pg = await schemaDB();
  const { eve, sara } = await board(pg);
  const read = await tool(pg, eve, "fetch", { id: DATA });
  assertEquals(read.metadata.read_only, true);
  assertStringIncludes(await fails(tool(pg, eve, "edit", { path: DATA, old_string: `"x": 200`, new_string: `"x": 260` })), "view only");
  assertStringIncludes(await fails(tool(pg, sara, "write", { path: "Shared with me/Launch plan.app/index.html", content: "<p>hi</p>" })), "its page stays as it is");
});

// MARK: Comments (board_comments.ts, Pane/Collab/BoardComments.swift)

const lines = (text: string) => JSON.parse(text.split("\n").map((l: string) => l.replace(/^\s*\d+\t/, "")).join("\n"));
const comment = (o: Record<string, unknown>) => ({ version: 1, created: "2026-11-15T09:00:00Z", ...o });
/** The comments in a device's copy, each as every device resolves it. */
function commentsOf(d: Device): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const id of Object.keys(d.doc.comments ?? {})) {
    // deno-lint-ignore no-explicit-any
    const all = A.getConflicts(d.doc.comments as any, id);
    const vals = (all ? Object.values(all) : [d.doc.comments![id]]).map((v) => String((v as { val: string }).val ?? v)).sort();
    const parsed = vals.map((v) => JSON.parse(v)).sort((x, y) => (y.version ?? 1) - (x.version ?? 1));
    out[id] = parsed[0];
  }
  return out;
}

Deno.test("a member's AI sees a shared board's open comments and replies as its person's AI, in one sealed change", async () => {
  const pg = await schemaDB();
  const { emil, sara, id, nk, mac } = await board(pg);
  // Emil comments on shape "a" on his Mac; an older thread was resolved, with a reply in it.
  await mac.draw((d) => {
    d.comments = {
      "c-1": raw(comment({ id: "c-1", on: "a", x: 1, y: 0, by: emil.id, name: "Emil", text: "Make this one bigger?" })),
      "c-old": raw(comment({ id: "c-old", x: 500, y: 40, by: emil.id, name: "Emil", text: "Old idea", resolved: true, version: 2, created: "2026-11-14T09:00:00Z" })),
      "c-old-r": raw(comment({ id: "c-old-r", thread: "c-old", by: emil.id, name: "Emil", text: "Dropped", created: "2026-11-14T10:00:00Z" })),
    };
  });
  const read = await tool(pg, sara, "fetch", { id: DATA });
  const json = lines(read.text);
  assertEquals(json.collections.comments, [{ id: "c-1", by: "Emil", created: "2026-11-15T09:00:00Z", text: "Make this one bigger?", on: "a", x: 1, y: 0 }], "open threads only");
  assertStringIncludes(read.metadata.about, "collections.comments holds the board's open comments");
  assertEquals(json.values.scene.elements.length, 2, "comments aren't elements");

  // Her AI replies, starts a thread on "b", and tries to change Emil's words.
  json.collections.comments[0].text = "Make it smaller";
  json.collections.comments.push({ thread: "c-1", text: "Done: it's twice as wide now." }, { on: "b", text: "Who owns this step?" });
  const out = await tool(pg, sara, "write", { path: DATA, content: JSON.stringify(json) });
  assertEquals(out.saved, DATA);
  assertEquals(out.comments_left_out.length, 1);
  assertStringIncludes(out.comments_left_out[0], "is Emil's: its text stays as written");

  const all = (await mac.pull(), commentsOf(mac));
  assertEquals(all["c-1"].text, "Make this one bigger?");
  assertEquals(Object.keys(all).length, 5, "nothing deleted: the resolved thread and its reply stay");
  const mine = Object.values(all).filter((c) => c.by === sara.id);
  assertEquals(mine.map((c) => [c.name, c.ai, c.thread ?? null, c.on ?? null, c.text]).sort(), [
    ["Sara", "Claude", null, "b", "Who owns this step?"],
    ["Sara", "Claude", "c-1", null, "Done: it's twice as wide now."],
  ]);
  assert(A.isImmutableString((mac.doc.comments as Record<string, unknown>)[String(mine[0].id)]), "kept as the devices keep them");
  // One change, hers, named for her AI; sealed, so the server sees no comment.
  const [u] = (await pg.query<{ author_id: string; client: string; ct: string }>(`select author_id, client, ct from public.note_updates where note_id = $1 order by id desc limit 1`, [id])).rows;
  assertEquals([u.author_id, u.client], [sara.id, "Claude"]);
  assert(!u.ct.includes("twice as wide"));
  assertEquals(A.decodeChange(await open3("u", u.ct, nk, id, sara.id)).message, "Sara's Claude");

  // Resolving: an edit, on what it read (its own write counts as read).
  const again = await tool(pg, sara, "fetch", { id: DATA });
  assertEquals(lines(again.text).collections.comments.length, 3);
  const edit = await tool(pg, sara, "edit", { path: DATA, old_string: `"id": "c-1",`, new_string: `"id": "c-1", "resolved": true,` });
  assertEquals(edit.saved, DATA);
  const after = (await mac.pull(), commentsOf(mac));
  assertEquals([after["c-1"].resolved, after["c-1"].version], [true, 2]);
  assertEquals(lines((await tool(pg, sara, "fetch", { id: DATA })).text).collections.comments.map((c: { text: string }) => c.text), ["Who owns this step?"], "the resolved thread and its replies go from data.json");
});

Deno.test("comments alone are a change: an AI replying on a shared board it doesn't draw on", async () => {
  const pg = await schemaDB();
  const { emil, sara, mac } = await board(pg);
  await mac.draw((d) => { d.comments = { "c-1": raw(comment({ id: "c-1", x: 40, y: 40, by: emil.id, name: "Emil", text: "Anyone?" })) }; });
  await tool(pg, sara, "fetch", { id: DATA });
  const out = await tool(pg, sara, "edit", { path: DATA, old_string: `"text": "Anyone?"`, new_string: `"text": "Anyone?"\n      }, {\n        "thread": "c-1", "text": "Here"` });
  assertEquals(out.saved, DATA);
  const all = (await mac.pull(), commentsOf(mac));
  assertEquals(Object.values(all).map((c) => c.text).sort(), ["Anyone?", "Here"]);
  assertEquals((await mac.pull(), mac.elements()).a.version, 1, "the drawing untouched");
});

Deno.test("a board shared before comments: the AI's first comment makes the comments map", async () => {
  const pg = await schemaDB();
  const { sara, mac } = await board(pg);
  const json = lines((await tool(pg, sara, "fetch", { id: DATA })).text);
  assertEquals(json.collections, {});
  json.collections.comments = [{ x: 10, y: 20, text: "First" }];
  await tool(pg, sara, "write", { path: DATA, content: JSON.stringify(json) });
  assertEquals(Object.values((await mac.pull(), commentsOf(mac))).map((c) => [c.text, c.x, c.y]), [["First", 10, 20]]);
});

Deno.test("a viewer's AI reads a shared board's comments but doesn't comment", async () => {
  const pg = await schemaDB();
  const { emil, eve, mac } = await board(pg);
  await mac.draw((d) => { d.comments = { "c-1": raw(comment({ id: "c-1", on: "b", x: 1, y: 0, by: emil.id, name: "Emil", text: "Check the numbers" })) }; });
  const json = lines((await tool(pg, eve, "fetch", { id: DATA })).text);
  assertEquals(json.collections.comments.map((c: { text: string }) => c.text), ["Check the numbers"]);
  json.collections.comments.push({ thread: "c-1", text: "They look fine" });
  assertStringIncludes(await fails(tool(pg, eve, "write", { path: DATA, content: JSON.stringify(json) })), "view only");
  assertEquals(Object.keys((await mac.pull(), commentsOf(mac))), ["c-1"]);
});

Deno.test("a board of the person's own: its AI reads open comments in data.json and replies, kept in its page data", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil");
  const id = await note(pg, emil.a, "Roadmap");
  const data = {
    values: { scene: { type: "excalidraw", version: 2, elements: [shape("a"), shape("b", { x: 200 })], appState: {}, files: {} } },
    collections: { comments: [
      comment({ id: "c-1", on: "a", x: 1, y: 0, by: emil.id, name: "Emil", text: "Split this in two" }),
      comment({ id: "c-2", x: 0, y: 300, by: emil.id, name: "Emil", text: "Done already", resolved: true, version: 2 }),
    ] },
  };
  await app(pg, emil.id, `insert into public.note_pages (note_id, page_ct, data_ct) values ($1, $2, $3)`, [id, await emil.a.vault.sealPage(id, CANVAS), await emil.a.vault.sealPageData(id, JSON.stringify(data))]);
  const path = "Roadmap.app/data.json";
  const read = await tool(pg, emil, "fetch", { id: path });
  const json = lines(read.text);
  assertEquals(json.collections.comments.map((c: { id: string; by: string }) => [c.id, c.by]), [["c-1", "Emil"]]);
  assertStringIncludes(read.metadata.about, "collections.comments");
  // A reply, through edit (on what fetch showed).
  const out = await tool(pg, emil, "edit", { path, old_string: `"text": "Split this in two"`, new_string: `"text": "Split this in two"\n      }, {\n        "thread": "c-1", "text": "Split: see a and a2"` });
  assertEquals(out.saved, path);
  // And another straight after: what it saved counts as read.
  const again = await tool(pg, emil, "edit", { path, old_string: `"text": "Split: see a and a2"`, new_string: `"text": "Split: see a and a2"\n      }, {\n        "on": "b", "text": "Is this still needed?"` });
  assertEquals(again.saved, path);
  const [row] = (await pg.query<{ data_ct: string }>(`select data_ct from public.note_pages where note_id = $1`, [id])).rows;
  const kept = JSON.parse(await emil.a.vault.openPageData(id, row.data_ct)).collections.comments as Record<string, unknown>[];
  assertEquals(kept.length, 4, "the resolved thread stays");
  const ai = kept.filter((c) => c.ai === "Claude");
  assertEquals(ai.map((c) => [c.by, c.name, c.thread ?? null, c.on ?? null]), [[emil.id, "Emil", "c-1", null], [emil.id, "Emil", null, "b"]]);
  assertEquals(kept.find((c) => c.id === "c-2")?.resolved, true);
});
