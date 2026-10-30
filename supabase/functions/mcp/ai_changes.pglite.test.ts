// AI changes (20261030153000_ai_changes.sql) on the whole schema in an in-process Postgres (PGlite):
// every AI edit, note it made, move and delete across one person's notes, newest first, with the
// versions on each side of an edit; nobody else's; and an AI's text kept even when you were typing.
// Needs no Docker or local stack:
//   cd supabase/functions/mcp && deno test -A ai_changes.pglite.test.ts
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { previewOf, titleOf } from "./notes.ts";
import { asUser, schemaDB } from "./pglite.ts";
import { type Account, account, app, edit, folder, note } from "./sealed.ts";

const ai = (name: string) => ({ "pane.source": "mcp", "pane.agent": "mcp", "pane.client": name });

/** The AI writing new text, as the MCP tools do. */
async function aiEdit(pg: PGlite, a: Account, id: string, body: string, name = "ChatGPT") {
  await asUser(pg, a.id, `update public.notes set body_ct = $2, head_ct = $3, updated_at = now() where id = $1`,
    [id, await a.vault.sealBody(id, body), await a.vault.sealHead(id, { title: titleOf(body), preview: previewOf(body) })], ai(name));
}

/** The AI making a note, as create_note does. */
async function aiNote(pg: PGlite, a: Account, body: string, name = "Claude", folderId: string | null = null) {
  const id = crypto.randomUUID();
  await asUser(pg, a.id, `insert into public.notes (id, body_ct, head_ct, folder_id) values ($1, $2, $3, $4)`,
    [id, await a.vault.sealBody(id, body), await a.vault.sealHead(id, { title: titleOf(body), preview: previewOf(body) }), folderId], ai(name));
  return id;
}

type Change = { id: string; kind: string; note_id: string; ai: string; at: Date; before_version: string | null; after_version: string | null; current_version: string; from_folder: string | null; to_folder: string | null; trashed: boolean };

const changes = (pg: PGlite, a: Account, before: Date | null = null, limit = 50, by: string | null = null) =>
  app(pg, a.id, `select * from public.ai_changes($1, $2, $3)`, [before, limit, by]) as Promise<Change[]>;

/** The text of a version: the revision's, or the note's own when it has none. */
async function textAt(pg: PGlite, a: Account, id: string, version: string | null) {
  const [row] = version === null
    ? await app(pg, a.id, `select body_ct from public.notes where id = $1`, [id])
    : await app(pg, a.id, `select body_ct from public.note_revisions where note_id = $1 and version = $2`, [id, version]);
  return await a.vault.openBody(id, row.body_ct);
}

Deno.test("every AI change across the notes, newest first, with the text on each side of an edit", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const trips = await folder(pg, a, "Trips");
  const groceries = await note(pg, a, "Groceries\n\n- [ ] Oat milk");
  const lisbon = await note(pg, a, "Lisbon\n\n- Alfama");
  await aiEdit(pg, a, groceries, "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons");
  await edit(pg, a, groceries, "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Bread"); // you, after it
  await aiEdit(pg, a, lisbon, "Lisbon\n\n- Alfama\n- Belém", "Claude");
  await asUser(pg, a.id, `update public.notes set folder_id = $2, updated_at = now() where id = $1`, [lisbon, trips], ai("Claude"));
  const made = await aiNote(pg, a, "Packing\n\n- Passport");
  await asUser(pg, a.id, `update public.notes set trashed_at = now(), updated_at = now() where id = $1`, [made], ai("Claude"));
  // Your own edits, pins and moves aren't AI changes.
  await app(pg, a.id, `update public.notes set is_pinned = true where id = $1`, [groceries]);
  await app(pg, a.id, `update public.notes set folder_id = null where id = $1`, [groceries]);

  const list = await changes(pg, a);
  assertEquals(list.map((c) => [c.kind, c.ai]), [
    ["deleted", "Claude"], ["created", "Claude"], ["moved", "Claude"], ["edit", "Claude"], ["edit", "ChatGPT"],
  ]);
  for (let i = 1; i < list.length; i++) assert(list[i - 1].at >= list[i].at);

  // ChatGPT's edit: the text it replaced, and the text it wrote (kept because you changed it since).
  const g = list[4];
  assertEquals(g.note_id, groceries);
  assertEquals(await textAt(pg, a, groceries, g.before_version), "Groceries\n\n- [ ] Oat milk");
  assert(g.after_version !== null);
  assertEquals(await textAt(pg, a, groceries, g.after_version), "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons");
  // Claude's edit is still the note's text: no later version, the note's own text.
  const l = list[3];
  assertEquals(await textAt(pg, a, lisbon, l.before_version), "Lisbon\n\n- Alfama");
  assertEquals(l.after_version, null);
  assertEquals(await textAt(pg, a, lisbon, l.after_version), "Lisbon\n\n- Alfama\n- Belém");
  // The move names both folders; the note it made is in Recently Deleted now.
  assertEquals([list[2].from_folder, list[2].to_folder], [null, trips]);
  assertEquals([list[1].note_id, list[1].trashed, list[0].trashed], [made, true, true]);

  // Filtered by AI, and a page at a time.
  assertEquals((await changes(pg, a, null, 50, "ChatGPT")).map((c) => c.id), [g.id]);
  const first = await changes(pg, a, null, 2);
  assertEquals(first.map((c) => c.id), list.slice(0, 2).map((c) => c.id));
  const next = await changes(pg, a, first[1].at, 2);
  assertEquals(next.map((c) => c.id), list.slice(2, 4).map((c) => c.id));
});

Deno.test("a restore by the AI is a change; one from the app isn't", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await note(pg, a, "Plan\n\nOne");
  await edit(pg, a, id, "Plan\n\nTwo");
  const [{ version }] = await app(pg, a.id, `select min(version) as version from public.note_revisions where note_id = $1`, [id]);
  await asUser(pg, a.id, `select * from public.restore_note_version($1, $2)`, [id, version], { "pane.client": "Codex", "pane.agent": "mcp" });
  await app(pg, a.id, `select * from public.restore_note_version($1, $2)`, [id, version]);
  const list = await changes(pg, a);
  assertEquals(list.map((c) => [c.kind, c.ai]), [["restore", "Codex"]]);
});

Deno.test("someone else's AI changes never show, and nobody can write the log", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const b = await account(pg);
  const id = await note(pg, a, "Mine\n\nSecret plans");
  await aiEdit(pg, a, id, "Mine\n\nSecret plans, edited");
  await aiNote(pg, a, "Made for me");
  assertEquals((await changes(pg, a)).length, 2);
  assertEquals((await changes(pg, b)).length, 0);
  assertEquals((await app(pg, b.id, `select * from public.note_ai_events`)).length, 0);
  await assertRejects(() => app(pg, a.id, `insert into public.note_ai_events (note_id, user_id, kind, version) values ($1, $2, 'created', 1)`, [id, a.id]));
  await assertRejects(() => app(pg, a.id, `delete from public.note_ai_events`));
  // Signed out: nothing.
  await assertRejects(() => pg.query(`set role anon; select * from public.ai_changes()`));
  await pg.query(`reset role`);
});

Deno.test("deleting a note for good forgets its AI changes", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await aiNote(pg, a, "Scratch");
  await aiEdit(pg, a, id, "Scratch\n\nMore");
  assertEquals((await changes(pg, a)).length, 2);
  await app(pg, a.id, `update public.notes set deleted_at = now(), trashed_at = now() where id = $1`, [id]);
  assertEquals((await changes(pg, a)).length, 0);
  assertEquals((await pg.query(`select 1 from public.note_ai_events where note_id = $1`, [id])).rows.length, 0);
});

Deno.test("your typing right after an AI edit keeps the AI's text, even with typing just before it", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await note(pg, a, "Notes\n\nOne");
  await edit(pg, a, id, "Notes\n\nOne two"); // an app revision in the last minute
  await aiEdit(pg, a, id, "Notes\n\nOne two\nThree from the AI");
  await edit(pg, a, id, "Notes\n\nOne two\nThree from the AI\nFour");
  await edit(pg, a, id, "Notes\n\nOne two\nThree from the AI\nFour five"); // throttled: your own text
  const [c] = await changes(pg, a);
  assertEquals(await textAt(pg, a, id, c.after_version), "Notes\n\nOne two\nThree from the AI");
  const revs = await app(pg, a.id, `select count(*)::int as n from public.note_revisions where note_id = $1`, [id]);
  assertEquals(revs[0].n, 3);
});

Deno.test("an AI making a note: after_version follows it once it's edited", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await aiNote(pg, a, "Ideas\n\n- One");
  let [c] = await changes(pg, a);
  assertEquals([c.kind, c.after_version], ["created", null]);
  await edit(pg, a, id, "Ideas\n\n- One\n- Two");
  [c] = await changes(pg, a);
  assertEquals(await textAt(pg, a, id, c.after_version), "Ideas\n\n- One");
});
