// Shared notes through the file tools (shared_notes.ts): a member's AI reads a shared note's
// Automerge document with the key their self_wrap opens, writes edits as sealed changes that merge
// with people typing, says whose AI it was, and a viewer's AI can't write.
//   cd supabase/functions/mcp && deno test -A shared_notes.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, app, edit, note, opened, toolContext } from "./sealed.ts";
import { ToolError } from "./tools.ts";
import { runFileTool } from "./files_tools.ts";
import { loadAutomerge, SNAPSHOT_EVERY } from "./shared_notes.ts";
import { aesKey, type Bytes, fromBase64, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import { bytes, identityContext, newIdentity, noteKeyContext, open3, openNoteKey, seal3, sealNoteKey, text } from "../_shared/collab.ts";

const A = await loadAutomerge();
type Doc = ReturnType<typeof A.init<{ body?: string }>>;

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, p: Person, name: string, args: Record<string, unknown> = {}, client = "Claude") => await runFileTool(name, args, { ...await toolContext(pg, p.a, true, client), session: `s-${p.a.id}` }) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };

/** An account as the app makes it, with a profile name and a published identity key. */
async function person(pg: PGlite, name: string) {
  const a = await account(pg);
  await pg.query(`update auth.users set email = $2 where id = $1`, [a.id, `${name.toLowerCase()}@example.com`]);
  await app(pg, a.id, `insert into public.profiles (display_name) values ($1)`, [`${name} Lind`]);
  const identity = await newIdentity();
  const privateWrap = await seal(toBase64(identity.d), await aesKey(a.dk), a.keyId, identityContext(a.id));
  await app(pg, a.id, `select public.collab_publish_identity($1, $2)`, [toBase64(identity.publicRaw), privateWrap]);
  return { a, id: a.id, name, identity };
}
type Person = Awaited<ReturnType<typeof person>>;
const selfWrap = async (p: Person, nk: Bytes, id: string, epoch: number) => await seal(toBase64(nk), await aesKey(p.a.dk), p.a.keyId, noteKeyContext(id, epoch));

/** A device of someone in the note: its own copy of the document, sending sealed changes. */
class Device {
  doc: Doc;
  constructor(readonly pg: PGlite, readonly p: Person, readonly id: string, public nk: Bytes, public epoch = 1, doc?: Doc) { this.doc = doc ?? A.init(); }
  async type(fn: (d: { body?: string }) => void) {
    this.doc = A.change(this.doc, fn);
    const ct = await seal3("u", A.getLastLocalChange(this.doc)! as Bytes, this.nk, this.id, this.epoch, this.p.id);
    await app(this.pg, this.p.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, $2, $3)`, [this.id, this.epoch, ct]);
  }
  /** Catches up with everything on the server it doesn't have. */
  async pull() {
    const rows = await app(this.pg, this.p.id, `select epoch, author_id, ct from public.note_updates where note_id = $1 order by id`, [this.id]);
    for (const r of rows) if (r.epoch === this.epoch) this.doc = A.loadIncremental(this.doc, await open3("u", r.ct, this.nk, this.id, r.author_id));
    return this.doc.body;
  }
}

/** Emil shares his note "Offsite plan": its row stays in his library, its text becomes a document. */
async function shared(pg: PGlite) {
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), eve = await person(pg, "Eve");
  const body = "Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n";
  const id = await note(pg, emil.a, "Offsite plan\n\n(older text)\n");
  await edit(pg, emil.a, id, "Offsite plan\n\n(old text from before it was shared)\n");
  const nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk, id, 1);
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [id, toSelf, await selfWrap(emil, nk, id, 1), head]);
  // His row becomes the pointer, as the app makes it (SharedLibrary): found by shared_note_id.
  await pg.query(`update public.notes set shared_note_id = $1 where id = $1`, [id]);
  const mac = new Device(pg, emil, id, nk);
  await mac.type((d) => { d.body = body; });
  for (const [p, role] of [[sara, "editor"], [eve, "viewer"]] as const) {
    const wrap = await sealNoteKey(nk, emil.identity, p.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: p.id });
    await app(pg, emil.id, `select public.collab_invite($1, $2, $3, $4, 1)`, [id, p.id, role, wrap]);
    await app(pg, p.id, `select public.collab_accept($1, $2)`, [id, await selfWrap(p, nk, id, 1)]);
  }
  return { emil, sara, eve, id, nk, mac, body };
}

Deno.test("a member's AI finds a shared note under Shared with me/ and reads it", async () => {
  const pg = await schemaDB();
  const { sara, body } = await shared(pg);
  const top = await tool(pg, sara, "list");
  const dir = top.entries.find((e: { path: string }) => e.path === "Shared with me/");
  assertEquals([dir?.type, dir?.items], ["folder", 1]);
  const inside = await tool(pg, sara, "list", { path: "Shared with me/" });
  assertEquals(inside.entries.map((e: { path: string; shared: string }) => [e.path, e.shared]), [["Shared with me/Offsite plan.md", "can edit"]]);
  const read = await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  assertEquals(read.title, "Offsite plan");
  assertEquals(read.text, body.split("\n").map((l, i) => `${String(i + 1).padStart(6)}\t${l}`).join("\n"));
  assertStringIncludes(read.metadata.shared, "can edit");
  // A unique title finds it too, and search reads the document.
  assertEquals((await tool(pg, sara, "fetch", { id: "Offsite plan" })).id, "Shared with me/Offsite plan.md");
  const found = await tool(pg, sara, "search", { pattern: "venue", output: "content" });
  assertEquals(found.lines, ["Shared with me/Offsite plan.md:3: - [ ] Book the venue"]);
  const ranked = await tool(pg, sara, "search", { query: "venue" });
  assertEquals(ranked.results.map((r: { id: string }) => r.id), ["Shared with me/Offsite plan.md"]);
});

Deno.test("an AI's edit is one sealed change by the person, named for their AI, and merges with typing", async () => {
  const pg = await schemaDB();
  const { emil, sara, id, nk, mac } = await shared(pg);
  assertStringIncludes(await fails(tool(pg, sara, "edit", { path: "Shared with me/Offsite plan.md", old_string: "- [ ] Pick dates", new_string: "- [x] Pick dates" })), "Read Shared with me/Offsite plan.md with fetch");
  await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  // Emil types on his Mac after Sara's AI read the note.
  await mac.type((d) => A.splice(d, ["body"], d.body!.length, 0, "- [ ] Order lunch\n"));
  const out = await tool(pg, sara, "edit", { path: "Shared with me/Offsite plan.md", old_string: "- [ ] Pick dates", new_string: "- [x] Pick dates: 3-4 November" });
  assertEquals([out.edited, out.checks], ["Shared with me/Offsite plan.md", "ok"]);
  // Both survive, on Emil's Mac and for Sara's AI.
  const merged = "Offsite plan\n\n- [ ] Book the venue\n- [x] Pick dates: 3-4 November\n- [ ] Order lunch\n";
  assertEquals(await mac.pull(), merged);
  assertStringIncludes((await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" })).text, "3-4 November");

  // Stored as Sara's change, from Claude, sealed with the note key under her id; the server sees no text.
  const [u] = (await pg.query<{ author_id: string; client: string; ct: string; epoch: number }>(`select author_id, client, ct, epoch from public.note_updates where note_id = $1 order by id desc limit 1`, [id])).rows;
  assertEquals([u.author_id, u.client, u.epoch], [sara.id, "Claude", 1]);
  assert(!u.ct.includes("November"));
  const change = A.decodeChange(await open3("u", u.ct, nk, id, sara.id));
  assertEquals(change.message, "Sara's Claude");
  // The list's title and preview follow, sealed with the note key.
  const [s] = (await pg.query<{ head_ct: string }>(`select head_ct from public.shared_notes where id = $1`, [id])).rows;
  assertEquals(JSON.parse(text(await open3("h", s.head_ct, nk, id))).title, "Offsite plan");
  // History says who.
  const h = await tool(pg, emil, "history", { path: "Offsite plan.md" });
  assertEquals(h.changes.map((c: { made_by: string }) => c.made_by), ["Sara's Claude", "Emil", "Emil"]);
  // A device's change has no client: "Mac" is where Emil typed, not an AI.
  const clients = (await pg.query<{ client: string | null }>(`select client from public.note_updates where note_id = $1 order by id`, [id])).rows;
  assertEquals(clients.map((r) => r.client), [null, null, "Claude"]);
});

Deno.test("write replaces the whole text only when nobody typed since it was read", async () => {
  const pg = await schemaDB();
  const { sara, mac } = await shared(pg);
  await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  await mac.type((d) => A.splice(d, ["body"], 0, 0, "x"));
  assertStringIncludes(await fails(tool(pg, sara, "write", { path: "Shared with me/Offsite plan.md", content: "Offsite plan\n\nNew text\n" })), "changed since you read it");
  await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  const w = await tool(pg, sara, "write", { path: "Shared with me/Offsite plan.md", content: "Offsite plan\n\nNew text\n" });
  assertEquals(w.written, "Shared with me/Offsite plan.md");
  assertEquals(await mac.pull(), "Offsite plan\n\nNew text\n");
  // A new first line is a new name.
  const r = await tool(pg, sara, "edit", { path: "Shared with me/Offsite plan.md", old_string: "Offsite plan", new_string: "Offsite 2026" });
  assertEquals([r.edited, r.renamed_from], ["Shared with me/Offsite 2026.md", "Shared with me/Offsite plan.md"]);
});

Deno.test("a viewer's AI reads but can't write, and the server refuses it too", async () => {
  const pg = await schemaDB();
  const { eve, id, nk } = await shared(pg);
  const read = await tool(pg, eve, "fetch", { id: "Shared with me/Offsite plan.md" });
  assertEquals(read.metadata.read_only, true);
  assertStringIncludes(await fails(tool(pg, eve, "edit", { path: "Shared with me/Offsite plan.md", old_string: "Pick dates", new_string: "Dates" })), "view only");
  assertStringIncludes(await fails(tool(pg, eve, "write", { path: "Shared with me/Offsite plan.md", content: "Mine\n" })), "view only");
  // Even a change sealed properly is refused by the database.
  const ct = await seal3("u", bytes("anything"), nk, id, 1, eve.id);
  const e = await app(pg, eve.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, 1, $2)`, [id, ct]).then(() => null, (e) => e);
  assertStringIncludes(String(e?.message), "view this note but not change it");
});

Deno.test("the owner's AI reads and writes the document at the note's own path, never its old row", async () => {
  const pg = await schemaDB();
  const { emil, id, mac } = await shared(pg);
  const top = await tool(pg, emil, "list");
  assert(top.entries.some((e: { path: string; shared?: string }) => e.path === "Offsite plan.md" && e.shared === "owner"));
  assert(!top.entries.some((e: { path: string }) => e.path === "Shared with me/"));
  const read = await tool(pg, emil, "fetch", { id: "Offsite plan.md" });
  assertStringIncludes(read.text, "Book the venue");
  assert(!read.text.includes("old text"));
  await tool(pg, emil, "edit", { path: "Offsite plan.md", old_string: "Book the venue", new_string: "Book the venue (Fäviken?)" });
  assertStringIncludes(await mac.pull() ?? "", "(Fäviken?)");
  // The row itself is untouched: one note, one sync engine.
  assertStringIncludes((await opened(pg, emil.a, id)).body!, "old text");
  // Restoring a version, apps and sub-notes are for Pinto Notes, for now.
  assertStringIncludes(await fails(tool(pg, emil, "restore", { path: "Offsite plan.md", version: 1 })), "can't be restored yet");
  // The classic tools can't write a version into the pointer either.
  const { runTool } = await import("./tools.ts");
  const [rev] = (await pg.query<{ id: string }>(`select id from public.note_revisions where note_id = $1 order by id limit 1`, [id])).rows;
  assert(rev, "the row had a version before it was shared");
  const e = await runTool("restore_revision", { id, revision_id: Number(rev.id) }, await toolContext(pg, emil.a)).then(() => null, (e) => e);
  assertStringIncludes(String(e?.message), "shared with other people");
  assertStringIncludes(await fails(tool(pg, emil, "create", { path: "Offsite plan/Agenda.md", content: "Agenda" })), "can't have sub-notes");
  assertStringIncludes(await fails(tool(pg, emil, "create", { type: "app", path: "Offsite plan.md" })), "can't have apps");
  assertStringIncludes(await fails(tool(pg, emil, "move", { path: "Offsite plan.md", to: "Offsite.md" })), "first line");
});

Deno.test("Shared with me/ takes nothing new", async () => {
  const pg = await schemaDB();
  const { sara } = await shared(pg);
  assertStringIncludes(await fails(tool(pg, sara, "create", { path: "Shared with me/Mine.md", content: "Mine" })), "nothing new can be made");
  assertStringIncludes(await fails(tool(pg, sara, "move", { path: "Shared with me/Offsite plan.md", to: "Work/" })), "once Pinto Notes has opened it");
  assertStringIncludes(await fails(tool(pg, sara, "pin", { path: "Shared with me/Offsite plan.md", pinned: true })), "once Pinto Notes has opened it");
  // Her own notes are as they were.
  await note(pg, sara.a, "Groceries\n\n- [ ] Milk\n");
  await tool(pg, sara, "fetch", { id: "Groceries.md" });
  assertEquals((await tool(pg, sara, "edit", { path: "Groceries.md", old_string: "- [ ] Milk", new_string: "- [x] Milk" })).checks, "ok");
});

Deno.test("after someone is removed, the AI opens the new key with the identity key until a device re-seals it", async () => {
  const pg = await schemaDB();
  const { emil, sara, eve, id, mac } = await shared(pg);
  // Emil removes Eve: a new key for Emil and Sara; self_wraps are made again by their devices.
  const nk2 = newDataKey();
  const wraps = await Promise.all([emil, sara].map(async (p) => ({ user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note: id, epoch: 2, from: emil.id, to: p.id }) })));
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [id, eve.id, JSON.stringify(wraps)]);
  // Eve's AI no longer sees it.
  assert(!(await tool(pg, eve, "list")).entries.some((e: { path: string }) => e.path === "Shared with me/"));
  // The title and the changes so far are under the old key: until a device writes a snapshot under
  // the new one, the note lists under a stand-in name and can't be read.
  assertEquals((await tool(pg, sara, "list", { path: "Shared with me/" })).entries.map((e: { path: string }) => e.path), ["Shared with me/Shared note.md"]);
  assertStringIncludes(await fails(tool(pg, sara, "fetch", { id: "Shared with me/Shared note.md" })), "Open it once in Pinto Notes");
  // Emil's Mac opens it and writes that snapshot, and the title under the new key.
  const [{ max }] = (await pg.query<{ max: string }>(`select max(id) as max from public.note_updates where note_id = $1`, [id])).rows;
  await app(pg, emil.id, `insert into public.note_snapshots (note_id, upto, epoch, ct) values ($1, $2, 2, $3)`, [id, max, await seal3("s", A.save(mac.doc) as Bytes, nk2, id, 2, String(max))]);
  await app(pg, emil.id, `update public.shared_notes set head_ct = $2 where id = $1`, [id, await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk2, id, 2)]);
  const read = await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  assertStringIncludes(read.text, "Book the venue");
  const out = await tool(pg, sara, "edit", { path: "Shared with me/Offsite plan.md", old_string: "Book the venue", new_string: "Venue booked" });
  assertEquals(out.checks, "ok");
  const [u] = (await pg.query<{ epoch: number }>(`select epoch from public.note_updates where note_id = $1 order by id desc limit 1`, [id])).rows;
  assertEquals(u.epoch, 2);
  // Sara's wrap still opens only as sealed by Emil.
  const [row] = await app(pg, sara.id, `select key_wrap from public.note_members where note_id = $1 and user_id = $2`, [id, sara.id]);
  assertEquals(toBase64(await openNoteKey(row.key_wrap, sara.identity, emil.identity.publicRaw, { note: id, epoch: 2, from: emil.id, to: sara.id })), toBase64(nk2));
});

Deno.test("a busy note gets a snapshot from the AI, and loads from it", async () => {
  const pg = await schemaDB();
  const { sara, id, mac } = await shared(pg);
  for (let i = 0; i < SNAPSHOT_EVERY - 2; i++) await mac.type((d) => A.splice(d, ["body"], d.body!.length, 0, "."));
  await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  await tool(pg, sara, "edit", { path: "Shared with me/Offsite plan.md", old_string: "Book the venue", new_string: "Venue" });
  const snaps = (await pg.query<{ upto: string; author_id: string }>(`select upto, author_id from public.note_snapshots where note_id = $1`, [id])).rows;
  assertEquals(snaps.map((s) => s.author_id), [sara.id]);
  // Compaction dropped what it covers: what the AI loaded. Its own change stays after the snapshot.
  const left = (await pg.query<{ author_id: string }>(`select author_id from public.note_updates where note_id = $1`, [id])).rows;
  assertEquals(left.map((r) => r.author_id), [sara.id]);
  const read = await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  assertStringIncludes(read.text, "- [ ] Venue");
});

Deno.test("a note key that doesn't open leaves the note out instead of failing the account", async () => {
  const pg = await schemaDB();
  const { sara, id } = await shared(pg);
  await pg.query(`update public.note_members set self_wrap = $3 where note_id = $1 and user_id = $2`,
    [id, sara.id, await seal(toBase64(newDataKey()), await aesKey(newDataKey()), "0000000000000000", noteKeyContext(id, 1))]);
  const top = await tool(pg, sara, "list");
  assert(!top.entries.some((e: { path: string }) => e.path === "Shared with me/"));
  assert(fromBase64(toBase64(new Uint8Array([1]))).length === 1);
});

Deno.test("a member's pointer row places the note; its placeholder body is never read or written", async () => {
  const pg = await schemaDB();
  const { sara, id, mac } = await shared(pg);
  // Sara's iPhone puts the note in her library: a pointer of her own, outside any folder for now.
  const pointer = await note(pg, sara.a, "Offsite plan\n\nThis note is shared. Open it in Pinto Notes.\n");
  await app(pg, sara.id, `update public.notes set shared_note_id = $2 where id = $1`, [pointer, id]);
  const inside = await tool(pg, sara, "list", { path: "Shared with me/" });
  assertEquals(inside.entries.map((e: { path: string }) => e.path), ["Shared with me/Offsite plan.md"]);
  const read = await tool(pg, sara, "fetch", { id: "Shared with me/Offsite plan.md" });
  assertStringIncludes(read.text, "Book the venue");
  assert(!read.text.includes("This note is shared"));
  // She moves it into Work: the pointer moves, the text stays the document's.
  const work = await tool(pg, sara, "create", { type: "folder", path: "Work/" });
  assertEquals(work.created, "Work/");
  assertEquals((await tool(pg, sara, "move", { path: "Shared with me/Offsite plan.md", to: "Work/" })).moved, "Work/Offsite plan.md");
  assert(!(await tool(pg, sara, "list")).entries.some((e: { path: string }) => e.path === "Shared with me/"));
  await tool(pg, sara, "fetch", { id: "Work/Offsite plan.md" });
  await tool(pg, sara, "edit", { path: "Work/Offsite plan.md", old_string: "Pick dates", new_string: "Pick dates (Friday?)" });
  assertStringIncludes(await mac.pull() ?? "", "(Friday?)");
  assertStringIncludes((await opened(pg, sara.a, pointer)).body!, "This note is shared");
  // Pinning is the pointer's, like any note.
  assertEquals((await tool(pg, sara, "pin", { path: "Work/Offsite plan.md", pinned: true })).pinned, true);
});

Deno.test("a member's delete leaves the note: it goes from their notes, and the others keep it", async () => {
  const pg = await schemaDB();
  const { emil, sara, eve, id, mac } = await shared(pg);
  // Sara's iPhone had placed it in her library.
  const pointer = await note(pg, sara.a, "Offsite plan\n\nThis note is shared.\n");
  await app(pg, sara.id, `update public.notes set shared_note_id = $2 where id = $1`, [pointer, id]);
  const out = await tool(pg, sara, "delete", { path: "Shared with me/Offsite plan.md" });
  assertEquals(out.left, "Shared with me/Offsite plan.md");
  assert(!(await tool(pg, sara, "list")).entries.some((e: { path: string }) => e.path === "Shared with me/"));
  assert(!(await tool(pg, sara, "list", { path: "Recently Deleted/" })).entries.length);
  assertEquals((await pg.query(`select 1 from public.note_members where note_id = $1 and user_id = $2`, [id, sara.id])).rows.length, 0);
  const [row] = (await pg.query<{ deleted_at: Date | null }>(`select deleted_at from public.notes where id = $1`, [pointer])).rows;
  assert(row.deleted_at);
  // Her AI can't write to it any more; Emil and Eve still have it.
  const e = await app(pg, sara.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, 1, $2)`, [id, await seal3("u", bytes("x"), mac.nk, id, 1, sara.id)]).then(() => null, (e) => e);
  assert(e);
  assertStringIncludes((await tool(pg, emil, "fetch", { id: "Offsite plan.md" })).text, "Book the venue");
  assertEquals((await tool(pg, eve, "list", { path: "Shared with me/" })).entries.length, 1);
  // A viewer leaves the same way.
  assertEquals((await tool(pg, eve, "delete", { path: "Shared with me/Offsite plan.md" })).left, "Shared with me/Offsite plan.md");
});

Deno.test("the owner's delete stops sharing for everyone, keeps the text in Recently Deleted, and restores unshared", async () => {
  const pg = await schemaDB();
  const { emil, sara, id, mac } = await shared(pg);
  const pointer = await note(pg, sara.a, "Offsite plan\n\nThis note is shared.\n");
  await app(pg, sara.id, `update public.notes set shared_note_id = $2 where id = $1`, [pointer, id]);
  await mac.type((d) => A.splice(d, ["body"], d.body!.length, 0, "- [ ] Order lunch\n"));
  const out = await tool(pg, emil, "delete", { path: "Offsite plan.md" });
  assertEquals([out.deleted, out.now_at], ["Offsite plan.md", "Recently Deleted/Offsite plan.md"]);
  // Nobody else has it: the shared document, its members and changes are gone, Sara's pointer too.
  assertEquals((await pg.query(`select 1 from public.shared_notes where id = $1`, [id])).rows.length, 0);
  assertEquals((await pg.query(`select 1 from public.note_updates where note_id = $1`, [id])).rows.length, 0);
  assert(!(await tool(pg, sara, "list")).entries.some((e: { path: string }) => e.path === "Shared with me/"));
  const [sp] = (await pg.query<{ deleted_at: Date | null }>(`select deleted_at from public.notes where id = $1`, [pointer])).rows;
  assert(sp.deleted_at);
  // Emil's row holds the merged text, as his own note again.
  const own = await opened(pg, emil.a, id);
  assertEquals(own.body, "Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n- [ ] Order lunch\n");
  const [r] = (await pg.query<{ shared_note_id: string | null }>(`select shared_note_id from public.notes where id = $1`, [id])).rows;
  assertEquals(r.shared_note_id, null);
  // Restore brings it back for him only, unshared, and it's an ordinary note.
  // (A note restored from outside any folder goes to Notes, as for any note.)
  assertEquals((await tool(pg, emil, "restore", { path: "Recently Deleted/Offsite plan.md" })).restored, "Notes/Offsite plan.md");
  const back = await tool(pg, emil, "list", { path: "Notes/" });
  const e = back.entries.find((x: { path: string }) => x.path === "Notes/Offsite plan.md");
  assertEquals(e.shared, undefined);
  await tool(pg, emil, "fetch", { id: "Notes/Offsite plan.md" });
  assertEquals((await tool(pg, emil, "edit", { path: "Notes/Offsite plan.md", old_string: "Order lunch", new_string: "Order lunch for 8" })).checks, "ok");
  assertStringIncludes((await opened(pg, emil.a, id)).body!, "Order lunch for 8");
  // Only the owner can stop sharing.
  const { sara: s2, id: id2 } = await shared(pg);
  const refused = await app(pg, s2.id, `select public.collab_unshare($1, 'x', 'y', 0)`, [id2]).then(() => null, (e) => e);
  assertStringIncludes(String(refused?.message), "Only the owner");
});
