// Shared folders through the AI's file tools (shared_notes.ts, paths.ts, files_tools.ts): a shared
// folder shows at its place in every member's own folders (the owner's ids, or the ids a member's
// devices derive), its notes in it with their text, joined through the folder key the first time
// the AI looks; the AI reads, edits and makes notes there (a new note is a shared note in the folder
// for everyone), moves notes between its folders, and refuses what would take a note into or out of
// it for everyone.
//   cd supabase/functions/mcp && deno test -A shared_folders.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { account, app, toolContext } from "./sealed.ts";
import { ToolError } from "./tools.ts";
import { runFileTool } from "./files_tools.ts";
import { loadAutomerge } from "./shared_notes.ts";
import { aesKey, type Bytes, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import {
  bytes, derivedId, folderKeyContext, identityContext, linkKeys, newIdentity, noteKeyContext, open3, openFolderWrap, seal3, sealFolderName,
  sealFolderWrap, sealNoteKey, sharedFolderText, text,
} from "../_shared/collab.ts";

const A = await loadAutomerge();

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, p: Person, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, { ...await toolContext(pg, p.a), session: `s-${p.a.id}` }) as any;
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

/** A folder row as a device writes it, with an id of its choosing. */
async function localFolder(pg: PGlite, p: Person, id: string, name: string, parent: string | null) {
  await app(pg, p.id, `insert into public.folders (id, name_ct, parent_id, sort_index) values ($1, $2, $3, 0)`, [id, await p.a.vault.sealFolder(id, name), parent]);
}

/** Emil's "Recipes" (with "Dinner" in it) is shared; "Pancakes" is in it. Sara joined it by an edit
 *  link and Jonas by a view link; their devices made their folders for it, nothing more. */
async function world(pg: PGlite) {
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas");
  const root = crypto.randomUUID(), dinner = crypto.randomUUID();
  await localFolder(pg, emil, root, "Recipes", null);
  await localFolder(pg, emil, dinner, "Dinner", root);
  const fk = newDataKey();
  await app(pg, emil.id, `select public.collab_share_folder($1, $2, $3, $4)`, [root,
    await sealNoteKey(fk, emil.identity, emil.identity.publicRaw, { note: root, epoch: 1, from: emil.id, to: emil.id }),
    await seal(toBase64(fk), await aesKey(emil.a.dk), emil.a.keyId, folderKeyContext(root, 1)), await sealFolderName("Recipes", fk, root, 1, root)]);
  await app(pg, emil.id, `select public.collab_folder_put($1, $2, $3, $4, 0)`, [root, dinner, root, await sealFolderName("Dinner", fk, root, 1, dinner)]);
  // Pancakes: Emil's shared note, its document on the server, in Recipes.
  const id = crypto.randomUUID();
  const nk = newDataKey();
  const body = "Pancakes\n\n- 3 eggs\n- 5 dl milk\n";
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [id,
    await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id }),
    await seal(toBase64(nk), await aesKey(emil.a.dk), emil.a.keyId, noteKeyContext(id, 1)), await seal3("h", bytes(JSON.stringify({ title: "Pancakes" })), nk, id, 1)]);
  await app(pg, emil.id, `insert into public.notes (id, body_ct, head_ct, folder_id, shared_note_id) values ($1, $2, $3, $4, $1)`,
    [id, await emil.a.vault.sealBody(id, "Pancakes\n\nThis note is shared."), await emil.a.vault.sealHead(id, { title: "Pancakes" }), root]);
  const doc = A.change(A.init<{ body?: string }>(), (d) => { d.body = body; });
  await app(pg, emil.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, 1, $2)`, [id, await seal3("u", A.getLastLocalChange(doc)! as Bytes, nk, id, 1, emil.id)]);
  await app(pg, emil.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [root, id, root, await sealFolderWrap(nk, fk, root, 1, id, 1)]);
  const join = async (p: Person, role: string) => {
    const link = toBase64(crypto.getRandomValues(new Uint8Array(16))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    const keys = await linkKeys(crypto.getRandomValues(new Uint8Array(16)), link);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(keys.answer.match(/../g)!.map((h) => parseInt(h, 16))))), (b) => b.toString(16).padStart(2, "0")).join("");
    await app(pg, emil.id, `select public.collab_folder_create_link($1, $2, $3, 1, $4, $5)`, [link, root, role, hash, await seal(toBase64(fk), keys.key, "0000000000000000", `invite:${link}`)]);
    await app(pg, p.id, `select * from public.collab_folder_join_link($1, $2)`, [link, keys.answer]);
    await app(pg, p.id, `select public.collab_folder_accept($1, 1, $2)`, [root, await seal(toBase64(fk), await aesKey(p.a.dk), p.a.keyId, folderKeyContext(root, 1))]);
    // Their device's folders for it: ids derived with their data key.
    const r = await derivedId(p.a.dk, sharedFolderText(root)), d = await derivedId(p.a.dk, sharedFolderText(dinner));
    await localFolder(pg, p, r, "Recipes", null);
    await localFolder(pg, p, d, "Dinner", r);
    return { r, d };
  };
  const saraIds = await join(sara, "editor");
  const jonasIds = await join(jonas, "viewer");
  const pull = async () => {
    const rows = await app(pg, emil.id, `select author_id, ct from public.note_updates where note_id = $1 order by id`, [id]);
    let d = A.init<{ body?: string }>();
    const snaps = await app(pg, emil.id, `select upto, ct from public.note_snapshots where note_id = $1 order by upto desc limit 1`, [id]);
    if (snaps.length) d = A.loadIncremental(d, await open3("s", snaps[0].ct, nk, id, String(snaps[0].upto)));
    for (const r of rows) d = A.loadIncremental(d, await open3("u", r.ct, nk, id, r.author_id));
    return d.body;
  };
  return { emil, sara, jonas, root, dinner, fk, id, nk, body, saraIds, jonasIds, pull };
}

Deno.test("a member's AI finds the shared folder at its place, with its notes and their text", async () => {
  const pg = await schemaDB();
  const w = await world(pg);
  const top = await tool(pg, w.sara, "list");
  assertEquals(top.entries.find((e: { path: string }) => e.path === "Recipes/"), { path: "Recipes/", type: "folder", shared: "can edit", items: 2 });
  assertEquals(top.entries.some((e: { path: string }) => e.path === "Shared with me/"), false, "nothing lands in Shared with me");
  const inside = await tool(pg, w.sara, "list", { path: "Recipes/" });
  assertEquals(inside.entries.map((e: { path: string; shared?: string }) => [e.path, e.shared]), [["Recipes/Dinner/", "can edit"], ["Recipes/Pancakes.md", "can edit"]]);
  const read = await tool(pg, w.sara, "fetch", { id: "Recipes/Pancakes.md" });
  assertStringIncludes(read.text, "5 dl milk");
  // She joined the note through the folder, as her device would.
  const [m] = (await pg.query<{ role: string; via_folder: string }>(`select role, via_folder from public.note_members where note_id = $1 and user_id = $2`, [w.id, w.sara.id])).rows;
  assertEquals(m, { role: "editor", via_folder: w.root });
  // The owner sees it the same way, marked as his.
  assertEquals((await tool(pg, w.emil, "list")).entries.find((e: { path: string }) => e.path === "Recipes/")?.shared, "owner");
  // A viewer reads it too.
  assertStringIncludes((await tool(pg, w.jonas, "fetch", { id: "Recipes/Pancakes.md" })).text, "3 eggs");
});

Deno.test("the AI edits a note in a shared folder for everyone; a viewer's AI can't", async () => {
  const pg = await schemaDB();
  const w = await world(pg);
  await tool(pg, w.sara, "fetch", { id: "Recipes/Pancakes.md" });
  const out = await tool(pg, w.sara, "edit", { path: "Recipes/Pancakes.md", old_string: "- 3 eggs", new_string: "- 4 eggs" });
  assertEquals(out.edited, "Recipes/Pancakes.md");
  assertEquals(await w.pull(), "Pancakes\n\n- 4 eggs\n- 5 dl milk\n");
  await tool(pg, w.jonas, "fetch", { id: "Recipes/Pancakes.md" });
  assertStringIncludes(await fails(tool(pg, w.jonas, "edit", { path: "Recipes/Pancakes.md", old_string: "- 4 eggs", new_string: "- 6 eggs" })), "view only");
});

Deno.test("a note the AI makes in a shared folder is a shared note in it, for everyone", async () => {
  const pg = await schemaDB();
  const w = await world(pg);
  const made = await tool(pg, w.sara, "create", { path: "Recipes/Dinner/Waffles.md", content: "Waffles\n\n- 2 eggs\n" });
  assertEquals(made.created, "Recipes/Dinner/Waffles.md");
  // On the server: Sara's shared note, her pointer in her own Dinner folder, placed in the tree.
  const [s] = (await pg.query<{ id: string; owner_id: string; folder_root: string; folder_id: string; folder_wrap: string }>(
    `select id, owner_id, folder_root, folder_id, folder_wrap from public.shared_notes where owner_id = $1`, [w.sara.id])).rows;
  assertEquals([s.folder_root, s.folder_id], [w.root, w.dinner]);
  const [pointer] = (await pg.query<{ folder_id: string; shared_note_id: string; body_ct: string }>(`select folder_id, shared_note_id, body_ct from public.notes where id = $1`, [s.id])).rows;
  assertEquals([pointer.folder_id, pointer.shared_note_id], [w.saraIds.d, s.id]);
  assertStringIncludes(await w.sara.a.vault.openBody(s.id, pointer.body_ct), "This note is shared.");
  // Its key opens with the folder key; the first snapshot holds the text, and the change is gone with it.
  const { nk } = await openFolderWrap(s.folder_wrap, w.fk, w.root, s.id);
  const [snap] = (await pg.query<{ upto: string; ct: string }>(`select upto, ct from public.note_snapshots where note_id = $1`, [s.id])).rows;
  const doc = A.load<{ body?: string }>(await open3("s", snap.ct, nk, s.id, String(snap.upto)));
  assertEquals(doc.body, "Waffles\n\n- 2 eggs\n");
  const [h] = (await pg.query<{ head_ct: string }>(`select head_ct from public.shared_notes where id = $1`, [s.id])).rows;
  assertEquals(JSON.parse(text(await open3("h", h.head_ct, nk, s.id))).title, "Waffles");
  // Emil's and Jonas's AIs find it in their Dinner, with its text.
  for (const p of [w.emil, w.jonas]) {
    const list = await tool(pg, p, "list", { path: "Recipes/Dinner/" });
    assertEquals(list.entries.map((e: { path: string }) => e.path), ["Recipes/Dinner/Waffles.md"]);
    assertStringIncludes((await tool(pg, p, "fetch", { id: "Recipes/Dinner/Waffles.md" })).text, "2 eggs");
  }
  // Sara's AI can edit it straight away: it counts as read.
  await tool(pg, w.sara, "edit", { path: "Recipes/Dinner/Waffles.md", old_string: "- 2 eggs", new_string: "- 3 eggs" });
  assertStringIncludes((await tool(pg, w.emil, "fetch", { id: "Recipes/Dinner/Waffles.md" })).text, "3 eggs");
});

Deno.test("a viewer's AI can't make notes in a shared folder; nobody's AI makes folders in one", async () => {
  const pg = await schemaDB();
  const w = await world(pg);
  assertStringIncludes(await fails(tool(pg, w.jonas, "create", { path: "Recipes/Waffles.md", content: "Waffles\n" })), "view only");
  assertStringIncludes(await fails(tool(pg, w.sara, "create", { path: "Recipes/Lunch/Soup.md", content: "Soup\n" })), "Folders can't be made in a shared folder");
  assertStringIncludes(await fails(tool(pg, w.emil, "create", { path: "Recipes/Lunch/", type: "folder" })), "Folders can't be made in a shared folder");
});

Deno.test("moves between a shared folder's folders are for everyone; in, out and deletes are refused", async () => {
  const pg = await schemaDB();
  const w = await world(pg);
  await tool(pg, w.sara, "list");
  const moved = await tool(pg, w.sara, "move", { path: "Recipes/Pancakes.md", to: "Recipes/Dinner/" });
  assertEquals(moved.moved, "Recipes/Dinner/Pancakes.md");
  const [s] = (await pg.query<{ folder_id: string }>(`select folder_id from public.shared_notes where id = $1`, [w.id])).rows;
  assertEquals(s.folder_id, w.dinner);
  // Out of it, or a note of hers into it: refused.
  assertStringIncludes(await fails(tool(pg, w.sara, "move", { path: "Recipes/Dinner/Pancakes.md", to: "Notes/" })), "into or out of a shared folder");
  await tool(pg, w.sara, "create", { path: "Notes/Mine.md", content: "Mine\n" });
  assertStringIncludes(await fails(tool(pg, w.sara, "move", { path: "Notes/Mine.md", to: "Recipes/" })), "into or out of a shared folder");
  assertStringIncludes(await fails(tool(pg, w.sara, "delete", { path: "Recipes/Dinner/Pancakes.md" })), "in a shared folder");
  assertStringIncludes(await fails(tool(pg, w.sara, "delete", { path: "Recipes/Dinner/" })), "shared folder");
  assertStringIncludes(await fails(tool(pg, w.sara, "move", { path: "Recipes/Dinner/", to: "Notes/Dinner/" })), "shared folder");
  assertStringIncludes(await fails(tool(pg, w.jonas, "move", { path: "Recipes/Dinner/Pancakes.md", to: "Recipes/" })), "view only");
});
