// Comments on a whiteboard as an AI reads and writes them (board_comments.ts).
//   cd supabase/functions/mcp && deno test -A board_comments.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { json, keepIn, merge, parseStored, present, resolveRaw, type Stored, storedIn, withShown } from "./board_comments.ts";

const emil = "11111111-1111-4111-8111-111111111111";
const me = { id: "22222222-2222-4222-8222-222222222222", name: "Sara", ai: "Claude" };
const at = new Date("2026-11-15T10:00:00.000Z");

const thread = (id: string, o: Partial<Stored> = {}): Stored => ({ id, on: "box", x: 1, y: 0, by: emil, name: "Emil", text: `About ${id}`, created: `2026-11-15T09:0${id.length % 10}:00Z`, version: 1, ...o });
const reply = (id: string, to: string, o: Partial<Stored> = {}): Stored => ({ id, thread: to, by: emil, name: "Emil", text: `Re ${to}`, created: "2026-11-15T09:30:00Z", version: 1, ...o });

Deno.test("data.json shows open threads and their replies, readable; resolved ones not at all", () => {
  const list = [
    thread("c-open"),
    reply("c-r1", "c-open", { by: me.id, name: "Sara", ai: "Claude" }),
    thread("c-done", { resolved: true, version: 2 }),
    reply("c-r2", "c-done"),
    thread("c-spot", { on: undefined, x: 420, y: -80, created: "2026-11-15T09:45:00Z" }),
  ];
  assertEquals(present(list), [
    { id: "c-open", by: "Emil", created: "2026-11-15T09:06:00Z", text: "About c-open", on: "box", x: 1, y: 0 },
    { id: "c-r1", thread: "c-open", by: "Sara's Claude", created: "2026-11-15T09:30:00Z", text: "Re c-open" },
    { id: "c-spot", by: "Emil", created: "2026-11-15T09:45:00Z", text: "About c-spot", x: 420, y: -80 },
  ]);
  // In collections.comments, beside the drawing; none at all leaves the section out.
  const d = withShown({ values: { scene: { elements: [] } }, collections: { comments: list.map((c) => ({ ...c })) } }, list);
  assertEquals((d.collections.comments as unknown[]).length, 3);
  assertEquals(withShown({ values: {}, collections: {} }, [thread("x", { resolved: true })]).collections, {});
});

Deno.test("an AI's new comments and replies are its person's, stamped by the server; resolving bumps the version", () => {
  const stored = [thread("c-1"), thread("c-2")];
  const { changed, refused } = merge(stored, [
    ...present(stored),
    { thread: "c-1", text: "  Done, it's bigger now.  " },
    { on: "box", x: 0.5, y: 2, text: "Who owns this?" },
    { x: 300, y: 40, text: "Room for the budget here" },
    { id: "c-2", resolved: true },
  ], me, new Set(["box"]), at);
  assertEquals(refused, []);
  const [r, onShape, onSpot, resolved] = changed;
  assertEquals({ ...r, id: "" }, { id: "", thread: "c-1", by: me.id, name: "Sara", ai: "Claude", text: "Done, it's bigger now.", created: "2026-11-15T10:00:00Z", version: 1 });
  assert(/^c-[0-9a-f]{16}$/.test(r.id), r.id);
  assertEquals([onShape.on, onShape.x, onShape.y], ["box", 0.5, 1], "a place on a shape is kept on its box");
  assertEquals([onSpot.on, onSpot.x, onSpot.y], [undefined, 300, 40]);
  assertEquals([resolved.id, resolved.resolved, resolved.version, resolved.text], ["c-2", true, 2, "About c-2"]);
});

Deno.test("an AI can't change what someone wrote, reply to nothing, or comment on a shape that isn't there", () => {
  const stored = [thread("c-1"), reply("c-r", "c-1")];
  const { changed, refused } = merge(stored, [
    { id: "c-1", text: "Something else", on: "box", x: 1, y: 0 },
    { thread: "c-nope", text: "Hello?" },
    { thread: "c-r", text: "A reply to a reply" },
    { on: "gone", text: "On a deleted shape" },
    { text: "Nowhere" },
    { on: "box", text: "   " },
    "not a comment",
  ], me, new Set(["box"]), at);
  assertEquals(changed, []);
  assertEquals(refused.length, 7);
  assertStringIncludes(refused[0], "is Emil's: its text stays as written");
  assertStringIncludes(refused[1], "no thread with that id");
  assertStringIncludes(refused[3], "no element has that id");
  assertStringIncludes(refused[4], `needs "on"`);
  // Leaving comments out deletes nothing; no section at all asks nothing.
  assertEquals(merge(stored, [], me, new Set(), at).changed, []);
  assertEquals(merge(stored, undefined, me, new Set(), at), { changed: [], refused: [] });
});

Deno.test("a reply can go to a thread the same write starts", () => {
  const { changed } = merge([], [{ id: "c-new", on: "box", text: "First" }, { thread: "c-new", text: "Second" }], me, new Set(["box"]), at);
  assertEquals(changed.map((c) => [c.id, c.thread]), [["c-new", undefined], [changed[1].id, "c-new"]]);
});

Deno.test("values written at once for one comment: every reader keeps the same one (higher version, then lower JSON)", () => {
  const open = thread("c-1"), done = { ...thread("c-1"), resolved: true, version: 2 }, other = { ...thread("c-1"), text: "B" };
  assertEquals(resolveRaw([json(open), json(done)])?.resolved, true);
  assertEquals(resolveRaw([json(done), json(open)])?.resolved, true);
  const tie = resolveRaw([json(other), json(open)])!;
  assertEquals(tie.text, json(open) < json(other) ? open.text : "B");
  assertEquals(resolveRaw(["{not json", json(open)])?.id, "c-1");
  assertEquals(resolveRaw(["{}"]), null);
});

Deno.test("records are kept as the app keeps them: sorted keys, thread starts with x and y, malformed ones left out", () => {
  assertEquals(json(reply("c-r", "c-1", { ai: "Claude" })), `{"ai":"Claude","by":"${emil}","created":"2026-11-15T09:30:00Z","id":"c-r","name":"Emil","text":"Re c-1","thread":"c-1","version":1}`);
  assertEquals(json(thread("c-1")), `{"by":"${emil}","created":"2026-11-15T09:03:00Z","id":"c-1","name":"Emil","on":"box","text":"About c-1","version":1,"x":1,"y":0}`);
  assertEquals(parseStored({ id: "c", by: "x", created: "t", text: "  " }), null);
  assertEquals(parseStored({ id: "c", by: "x", created: "t", text: "a".repeat(5001) }), null);
  assertEquals(parseStored({ id: "c", thread: "t", by: "x", created: "t", text: "hi", resolved: true })?.resolved, undefined, "a reply is never resolved");
  // A board of one's own keeps them in its page data, each by id.
  const d = keepIn({ values: {}, collections: { comments: [{ id: "c-1", text: "old" }] } as Record<string, unknown> }, [thread("c-1"), thread("c-2")]);
  assertEquals(storedIn(d).map((c) => [c.id, c.text]), [["c-1", "About c-1"], ["c-2", "About c-2"]]);
});

Deno.test("edited, deleted and mentions (round 12): kept as written, shown as the app shows them", () => {
  const sara = "33333333-3333-4333-8333-333333333333";
  const list = [
    thread("c-gone", { deleted: true, text: "", version: 3 }),
    reply("c-gone-1", "c-gone", { by: sara, name: "Sara" }),
    thread("c-alone", { deleted: true, text: "", version: 2, created: "2026-11-15T09:20:00Z" }),
    thread("c-changed", { text: "Ask @Sara first", edited: "2026-11-15T09:40:00Z", mentions: [sara], version: 2, created: "2026-11-15T09:21:00Z" }),
    reply("c-r-gone", "c-changed", { deleted: true, text: "", version: 2 }),
  ];
  // A deleted start with replies shows, without text, with its reply; one without replies, and a
  // deleted reply, don't.
  assertEquals(present(list), [
    { id: "c-gone", by: "Emil", created: "2026-11-15T09:06:00Z", deleted: true, on: "box", x: 1, y: 0 },
    { id: "c-gone-1", thread: "c-gone", by: "Sara", created: "2026-11-15T09:30:00Z", text: "Re c-gone" },
    { id: "c-changed", by: "Emil", created: "2026-11-15T09:21:00Z", text: "Ask @Sara first", edited: "2026-11-15T09:40:00Z", on: "box", x: 1, y: 0 },
  ]);
  // Kept as the app keeps them: a deletion has no text; a change keeps "edited" and "mentions".
  const raw = JSON.parse(json(list[0]));
  assertEquals(raw.deleted, true);
  assert(!("text" in raw));
  assertEquals(parseStored(raw)?.deleted, true);
  assertEquals(parseStored(JSON.parse(json(list[3])))?.mentions, [sara]);
  assertEquals(parseStored(JSON.parse(json(list[3])))?.edited, "2026-11-15T09:40:00Z");
  // An AI resolving the changed thread keeps its edit and mentions.
  const { changed } = merge(list, [{ id: "c-changed", resolved: true }], me, new Set(["box"]), at);
  assertEquals(changed[0].mentions, [sara]);
  assertEquals(changed[0].edited, "2026-11-15T09:40:00Z");
  assertEquals(changed[0].version, 3);
  // It can't bring back a deleted comment's words, or reply to one that's gone.
  const r = merge(list, [{ id: "c-gone", text: "back" }, { thread: "c-alone", text: "hello?" }, { thread: "c-gone", text: "Still here" }], me, new Set(["box"]), at);
  assertEquals(r.changed.map((c) => c.thread), ["c-gone"]);
  assertEquals(r.refused.length, 2);
  assertStringIncludes(r.refused[0], "stays deleted");
  assertStringIncludes(r.refused[1], "deleted");
});
