// Shared folders (20261118120000_shared_folders.sql): the tree under the folder key, links, notes
// joined through the folder with every shared-note guard still in force, roles, removal and
// leaving with their reasons, a new folder key, taking notes out, stopping sharing, Start fresh and
// account deletion.
//   cd supabase/functions/mcp && deno test -A collab_folders.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, schemaDB } from "./pglite.ts";
import { account, app, note } from "./sealed.ts";
import { aesKey, type Bytes, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import {
  bytes, folderKeyContext, identityContext, linkKeys, newIdentity, noteKeyContext, openFolderName, openFolderWrap, openNoteKey, seal3,
  sealFolderName, sealFolderWrap, sealNoteKey,
} from "../_shared/collab.ts";

async function refused(p: Promise<unknown>, what: string, hint?: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, what);
  if (hint) assertEquals((e as { hint?: string }).hint, hint);
}

async function person(pg: PGlite, name: string) {
  const a = await account(pg);
  await app(pg, a.id, `insert into public.profiles (display_name) values ($1)`, [name]);
  const identity = await newIdentity();
  const privateWrap = await seal(toBase64(identity.d), await aesKey(a.dk), a.keyId, identityContext(a.id));
  await app(pg, a.id, `select public.collab_publish_identity($1, $2)`, [toBase64(identity.publicRaw), privateWrap]);
  return { a, id: a.id, name, identity };
}
type Person = Awaited<ReturnType<typeof person>>;
const selfNote = async (p: Person, nk: Bytes, id: string, epoch: number) => await seal(toBase64(nk), await aesKey(p.a.dk), p.a.keyId, noteKeyContext(id, epoch));
const selfFolder = async (p: Person, fk: Bytes, root: string, epoch: number) => await seal(toBase64(fk), await aesKey(p.a.dk), p.a.keyId, folderKeyContext(root, epoch));
const linkId = () => toBase64(crypto.getRandomValues(new Uint8Array(16))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

/** Someone shares a note on its own (collab_share), as the app does before putting it in a folder. */
async function sharedNote(pg: PGlite, p: Person, title: string) {
  const id = await note(pg, p.a, `${title}\n`);
  const nk = newDataKey();
  const toSelf = await sealNoteKey(nk, p.identity, p.identity.publicRaw, { note: id, epoch: 1, from: p.id, to: p.id });
  await app(pg, p.id, `select public.collab_share($1, $2, $3, $4)`, [id, toSelf, await selfNote(p, nk, id, 1), await seal3("h", bytes(JSON.stringify({ title })), nk, id, 1)]);
  await pg.query(`update public.notes set shared_note_id = $1 where id = $1`, [id]);
  return { id, nk, epoch: 1 };
}

/** A member's device joins by the folder's link and accepts: the folder key under their data key. */
async function joinByLink(pg: PGlite, p: Person, link: { id: string; answer: string; key: CryptoKey }, fk: Bytes, root: string) {
  const [row] = await app(pg, p.id, `select * from public.collab_folder_join_link($1, $2)`, [link.id, link.answer]);
  assertEquals(row.root, root);
  await app(pg, p.id, `select public.collab_folder_accept($1, $2, $3)`, [root, row.epoch, await selfFolder(p, fk, root, row.epoch)]);
  return row;
}

/** Emil shares "Recipes" with a subfolder "Dinner"; Sara joins by an edit link, Jonas by a view link. */
async function folderWorld(pg: PGlite) {
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas"), ola = await person(pg, "Ola");
  const root = crypto.randomUUID(), dinner = crypto.randomUUID();
  const fk = newDataKey();
  const toSelf = await sealNoteKey(fk, emil.identity, emil.identity.publicRaw, { note: root, epoch: 1, from: emil.id, to: emil.id });
  await app(pg, emil.id, `select public.collab_share_folder($1, $2, $3, $4)`, [root, toSelf, await selfFolder(emil, fk, root, 1), await sealFolderName("Recipes", fk, root, 1, root)]);
  await app(pg, emil.id, `select public.collab_folder_put($1, $2, $3, $4, $5)`, [root, dinner, root, await sealFolderName("Dinner", fk, root, 1, dinner), 1]);
  const makeLink = async (role: string) => {
    const id = linkId();
    const keys = await linkKeys(crypto.getRandomValues(new Uint8Array(16)), id);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(keys.answer.match(/../g)!.map((h) => parseInt(h, 16)))));
    const answerHash = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
    const box = await seal(toBase64(fk), keys.key, "0000000000000000", `invite:${id}`);
    await app(pg, emil.id, `select public.collab_folder_create_link($1, $2, $3, 1, $4, $5)`, [id, root, role, answerHash, box]);
    return { id, answer: keys.answer, key: keys.key, box };
  };
  const edit = await makeLink("editor");
  await joinByLink(pg, sara, edit, fk, root);
  const view = await makeLink("viewer");
  await joinByLink(pg, jonas, view, fk, root);
  return { emil, sara, jonas, ola, root, dinner, fk, edit, view, makeLink };
}
type World = Awaited<ReturnType<typeof folderWorld>>;

/** A note of `p`'s put into the folder, and every other member joining it through the folder. */
async function noteInFolder(pg: PGlite, w: World, p: Person, title: string, folder = w.root, joiners: Person[] = []) {
  const n = await sharedNote(pg, p, title);
  await app(pg, p.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, n.id, folder, await sealFolderWrap(n.nk, w.fk, w.root, 1, n.id, 1)]);
  for (const j of joiners) await joinNote(pg, w, j, n.id);
  return n;
}

async function joinNote(pg: PGlite, w: World, p: Person, noteId: string, fk = w.fk) {
  const rows = await app(pg, p.id, `select * from public.collab_folder_notes($1)`, [w.root]);
  const r = rows.find((x: { note_id: string }) => x.note_id === noteId);
  const { nk, noteEpoch } = await openFolderWrap(r.folder_wrap, fk, w.root, noteId);
  const wrap = await sealNoteKey(nk, p.identity, p.identity.publicRaw, { note: noteId, epoch: noteEpoch, from: p.id, to: p.id });
  await app(pg, p.id, `select public.collab_folder_join_note($1, $2, $3, $4, $5)`, [w.root, noteId, noteEpoch, wrap, await selfNote(p, nk, noteId, noteEpoch)]);
  return nk;
}

const push = async (pg: PGlite, p: Person, noteId: string, nk: Bytes, epoch = 1) =>
  await app(pg, p.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, $2, $3) returning id`, [noteId, epoch, await seal3("u", bytes("x"), nk, noteId, epoch, p.id)]);

const noteRole = async (pg: PGlite, noteId: string, user: string) =>
  (await pg.query<{ role: string; via_folder: string | null }>(`select role, via_folder from public.note_members where note_id = $1 and user_id = $2`, [noteId, user])).rows[0];
const ended = async (pg: PGlite, noteId: string, user: string) =>
  (await pg.query<{ reason: string }>(`select reason from public.note_access_ended where note_id = $1 and user_id = $2`, [noteId, user])).rows[0]?.reason;
const sharedRow = async (pg: PGlite, noteId: string) =>
  (await pg.query<{ folder_root: string | null; folder_id: string | null; folder_wrap: string | null; rekey_after: string | null; epoch: number }>(
    `select folder_root, folder_id, folder_wrap, rekey_after, epoch from public.shared_notes where id = $1`, [noteId])).rows[0];
const rootRow = async (pg: PGlite, root: string) =>
  (await pg.query<{ epoch: number; rekey_after: string | null }>(`select epoch, rekey_after from public.shared_folders where id = $1`, [root])).rows[0];

Deno.test("the owner shares a folder; members list its tree and open its names", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  for (const p of [w.emil, w.sara, w.jonas]) {
    const tree = await app(pg, p.id, `select * from public.collab_folder_folders($1)`, [w.root]);
    assertEquals(tree.map((f: { id: string; parent_id: string | null; deleted: boolean }) => [f.id, f.parent_id, f.deleted]), [[w.root, null, false], [w.dinner, w.root, false]]);
    assertEquals(await openFolderName(tree[1].name, w.fk, w.root, w.dinner), "Dinner");
  }
  // Someone outside sees nothing.
  assertEquals(await app(pg, w.ola.id, `select * from public.collab_folder_folders($1)`, [w.root]), []);
  assertEquals(await app(pg, w.ola.id, `select * from public.collab_folder_members($1)`, [w.root]), []);
  // People, as collab_members: names, roles and public keys, never wraps.
  const people = await app(pg, w.jonas.id, `select * from public.collab_folder_members($1)`, [w.root]);
  assertEquals(people.map((m: { display_name: string; role: string; accepted: boolean }) => [m.display_name, m.role, m.accepted]),
    [["Emil", "owner", true], ["Sara", "editor", true], ["Jonas", "viewer", true]]);
  assertEquals(Object.keys(people[0]).sort(), ["accepted", "avatar_path", "display_name", "public_key", "role", "user_id"]);
  // Memberships carry the wraps the device opens.
  const [mine] = await app(pg, w.sara.id, `select * from public.collab_folder_memberships()`);
  assertEquals([mine.root, mine.role, mine.epoch, mine.owner_id, mine.wrapped_by], [w.root, "editor", 1, w.emil.id, null]);
  assertEquals(mine.key_wrap, w.edit.box, "after a link join the membership holds the link's box");
  assert(mine.self_wrap.startsWith("amb2."));
  // Sharing again with the same wraps is a retry; anyone else's id is refused.
  const [own] = await app(pg, w.emil.id, `select key_wrap, self_wrap from public.collab_folder_memberships()`);
  await app(pg, w.emil.id, `select public.collab_share_folder($1, $2, $3, $4)`, [w.root, own.key_wrap, own.self_wrap, await sealFolderName("Recipes", w.fk, w.root, 1, w.root)]);
  await refused(app(pg, w.sara.id, `select public.collab_share_folder($1, $2, $3, $4)`, [w.root, own.key_wrap, own.self_wrap, await sealFolderName("X", w.fk, w.root, 1, w.root)]), "someone else", "not_owner");
  await refused(app(pg, w.emil.id, `select public.collab_share_folder($1, $2, $3, $4)`, [w.dinner, own.key_wrap, own.self_wrap, await sealFolderName("X", w.fk, w.dinner, 1, w.dinner)]), "someone else", "not_owner");
});

Deno.test("editors change the tree, viewers can't, and the tree stays a tree", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const name = (s: string, id: string, epoch = 1) => sealFolderName(s, w.fk, w.root, epoch, id);
  const put = (p: Person, id: string, parent: string | null, n: string) => app(pg, p.id, `select public.collab_folder_put($1, $2, $3, $4, 0)`, [w.root, id, parent, n]);
  const lunch = crypto.randomUUID(), soups = crypto.randomUUID();
  await put(w.sara, lunch, w.root, await name("Lunch", lunch));
  await put(w.sara, soups, lunch, await name("Soups", soups));
  await refused(put(w.jonas, crypto.randomUUID(), w.root, await name("Mine", w.root)), "view this shared folder", "read_only");
  await refused(put(w.ola, crypto.randomUUID(), w.root, await name("Mine", w.root)), "not in this shared folder", "not_member");
  // A folder can't go inside itself or one of its own.
  await refused(put(w.sara, lunch, soups, await name("Lunch", lunch)), "inside itself", "cycle");
  await refused(put(w.sara, lunch, lunch, await name("Lunch", lunch)), "inside itself", "cycle");
  // The parent must be in this tree, and the root has none.
  await refused(put(w.sara, crypto.randomUUID(), crypto.randomUUID(), await name("X", w.root)), "isn't in this shared folder", "bad_parent");
  await refused(put(w.sara, w.root, w.dinner, await name("Recipes", w.root)), "no parent", "root_parent");
  // A name for an old key is refused.
  await refused(put(w.sara, soups, lunch, await name("Soups", soups, 2)), "key changed", "stale_epoch");
  // Rename the root, move Soups under Dinner.
  await put(w.sara, w.root, null, await name("Family recipes", w.root));
  await put(w.sara, soups, w.dinner, await name("Soups", soups));
  // Dropping Dinner takes Soups with it; never the root.
  await app(pg, w.sara.id, `select public.collab_folder_drop($1, $2)`, [w.root, w.dinner]);
  await refused(app(pg, w.sara.id, `select public.collab_folder_drop($1, $2)`, [w.root, w.root]), "Stop Sharing", "root");
  await refused(app(pg, w.jonas.id, `select public.collab_folder_drop($1, $2)`, [w.root, lunch]), "view this shared folder", "read_only");
  const tree = await app(pg, w.jonas.id, `select * from public.collab_folder_folders($1)`, [w.root]);
  const byId = Object.fromEntries(tree.map((f: { id: string; deleted: boolean; parent_id: string }) => [f.id, [f.deleted, f.parent_id]]));
  assertEquals(byId[w.dinner], [true, w.root]);
  assertEquals(byId[soups], [true, w.dinner]);
  assertEquals(byId[lunch], [false, w.root]);
  assertEquals(await openFolderName(tree.find((f: { id: string }) => f.id === w.root).name, w.fk, w.root, w.root), "Family recipes");
  // Into a deleted folder: no. Bringing Dinner back: yes.
  await refused(put(w.sara, crypto.randomUUID(), w.dinner, await name("X", w.root)), "isn't in this shared folder", "bad_parent");
  await put(w.sara, w.dinner, w.root, await name("Dinner", w.dinner));
  // A folder of another shared folder can't be taken into this one.
  const other = crypto.randomUUID();
  const fk2 = newDataKey();
  await app(pg, w.ola.id, `select public.collab_share_folder($1, $2, $3, $4)`, [other,
    await sealNoteKey(fk2, w.ola.identity, w.ola.identity.publicRaw, { note: other, epoch: 1, from: w.ola.id, to: w.ola.id }),
    await selfFolder(w.ola, fk2, other, 1), await sealFolderName("Ola's", fk2, other, 1, other)]);
  await refused(put(w.sara, other, w.root, await name("Taken", other)), "another shared folder", "other_folder");
});

Deno.test("links: only the owner makes them, only the secret opens them, the kind is told and joining twice is one join", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  assertEquals((await app(pg, w.ola.id, `select public.collab_link_kind($1) as k`, [w.view.id]))[0].k, "folder");
  assertEquals((await app(pg, w.ola.id, `select public.collab_link_kind($1) as k`, [linkId()]))[0].k, null);
  await refused(app(pg, w.ola.id, `select * from public.collab_folder_open_link($1, $2)`, [w.view.id, "00".repeat(32)]), "expired or was stopped");
  // The edit link was replaced by the view link: one link per folder.
  await refused(app(pg, w.ola.id, `select * from public.collab_folder_open_link($1, $2)`, [w.edit.id, w.edit.answer]), "expired or was stopped");
  const [seen] = await app(pg, w.ola.id, `select * from public.collab_folder_open_link($1, $2)`, [w.view.id, w.view.answer]);
  assertEquals([seen.root, seen.role, seen.epoch, seen.owner_name], [w.root, "viewer", 1, "Emil"]);
  assertEquals(await openFolderName(seen.folder_name, w.fk, w.root, w.root), "Recipes");
  // Joining makes an unaccepted member until they accept; joining again changes nothing.
  await app(pg, w.ola.id, `select * from public.collab_folder_join_link($1, $2)`, [w.view.id, w.view.answer]);
  await app(pg, w.ola.id, `select * from public.collab_folder_join_link($1, $2)`, [w.view.id, w.view.answer]);
  const [m] = await app(pg, w.ola.id, `select * from public.collab_folder_memberships()`);
  assertEquals([m.role, m.accepted_at, m.self_wrap], ["viewer", null, null]);
  // Not accepted: no notes, no tree changes, no channel.
  assertEquals((await app(pg, w.ola.id, `select public.collab_folder_joined($1) as j`, [w.root]))[0].j, false);
  await refused(app(pg, w.ola.id, `select public.collab_folder_accept($1, 2, $2)`, [w.root, await selfFolder(w.ola, w.fk, w.root, 2)]), "key changed", "stale_epoch");
  await app(pg, w.ola.id, `select public.collab_folder_accept($1, 1, $2)`, [w.root, await selfFolder(w.ola, w.fk, w.root, 1)]);
  assertEquals((await app(pg, w.ola.id, `select public.collab_folder_joined($1) as j`, [w.root]))[0].j, true);
  // Only the owner makes or stops links.
  await refused(app(pg, w.sara.id, `select public.collab_folder_stop_link($1)`, [w.root]), "Only the owner", "not_owner");
  await refused(app(pg, w.sara.id, `select public.collab_folder_create_link($1, $2, 'editor', 1, $3, $4)`, [linkId(), w.root, "ab".repeat(32), w.view.box]), "Only the owner", "not_owner");
  await app(pg, w.emil.id, `select public.collab_folder_stop_link($1)`, [w.root]);
  await refused(app(pg, w.ola.id, `select * from public.collab_folder_open_link($1, $2)`, [w.view.id, w.view.answer]), "expired or was stopped");
  assertEquals((await app(pg, w.ola.id, `select public.collab_link_kind($1) as k`, [w.view.id]))[0].k, null);
  // A note's link says note.
  const n = await sharedNote(pg, w.emil, "Note link");
  const nl = linkId();
  await app(pg, w.emil.id, `select public.collab_create_link($1, $2, 'editor', 1, $3, $4)`, [nl, n.id, "ab".repeat(32), w.view.box]);
  assertEquals((await app(pg, w.ola.id, `select public.collab_link_kind($1) as k`, [nl]))[0].k, "note");
  // A folder link can't take a note link's id.
  await refused(app(pg, w.emil.id, `select public.collab_folder_create_link($1, $2, 'editor', 1, $3, $4)`, [nl, w.root, "ab".repeat(32), w.view.box]), "taken", "link_taken");
});

Deno.test("a member joins a note through the folder with the folder's role, and the note's guards hold", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const n = await noteInFolder(pg, w, w.emil, "Pancakes", w.dinner);
  const listed = await app(pg, w.sara.id, `select * from public.collab_folder_notes($1)`, [w.root]);
  assertEquals(listed.map((r: Record<string, unknown>) => [r.note_id, r.folder_id, r.owner_id, r.note_epoch, r.joined]), [[n.id, w.dinner, w.emil.id, 1, false]]);
  assertEquals(await app(pg, w.ola.id, `select * from public.collab_folder_notes($1)`, [w.root]), []);
  // Someone outside the folder can't join.
  await refused(app(pg, w.ola.id, `select public.collab_folder_join_note($1, $2, 1, $3, $4)`, [w.root, n.id, listed[0].folder_wrap, "x"]), "not in this shared folder", "not_member");
  const nk = await joinNote(pg, w, w.sara, n.id);
  await joinNote(pg, w, w.jonas, n.id);
  assertEquals(await noteRole(pg, n.id, w.sara.id), { role: "editor", via_folder: w.root });
  assertEquals(await noteRole(pg, n.id, w.jonas.id), { role: "viewer", via_folder: w.root });
  assertEquals((await app(pg, w.sara.id, `select joined from public.collab_folder_notes($1)`, [w.root]))[0].joined, true);
  // Her wrap opens for her, sealed by herself; collab_members shows her as accepted.
  const [mine] = await app(pg, w.sara.id, `select key_wrap, wrapped_by, invited_by from public.note_members where note_id = $1 and user_id = $2`, [n.id, w.sara.id]);
  assertEquals([mine.wrapped_by, mine.invited_by], [w.sara.id, w.emil.id]);
  await openNoteKey(mine.key_wrap, w.sara.identity, w.sara.identity.publicRaw, { note: n.id, epoch: 1, from: w.sara.id, to: w.sara.id });
  // Sara writes; Jonas, a viewer, is refused like any viewer.
  await push(pg, w.sara, n.id, nk);
  await refused(push(pg, w.jonas, n.id, nk), "view this note but not change it", "read_only");
  // Joining again refreshes the wraps; the note's epoch must be its current one.
  await joinNote(pg, w, w.sara, n.id);
  await refused(app(pg, w.sara.id, `select public.collab_folder_join_note($1, $2, 2, $3, $4)`, [w.root, n.id, mine.key_wrap, null]), "key changed", "stale_epoch");
  // The owner of the note isn't changed by joining.
  await joinNote(pg, w, w.emil, n.id);
  assertEquals(await noteRole(pg, n.id, w.emil.id), { role: "owner", via_folder: null });
});

Deno.test("putting notes in: editors of the note and the folder only, one shared folder at a time, wraps for the current keys", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const jn = await sharedNote(pg, w.jonas, "Jonas's");
  await refused(app(pg, w.jonas.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, jn.id, w.root, await sealFolderWrap(jn.nk, w.fk, w.root, 1, jn.id, 1)]), "view this shared folder", "read_only");
  const sn = await sharedNote(pg, w.sara, "Sara's");
  await refused(app(pg, w.sara.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, sn.id, w.root, await sealFolderWrap(sn.nk, w.fk, w.root, 2, sn.id, 1)]), "key changed", "stale_epoch");
  await refused(app(pg, w.sara.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, sn.id, w.root, await sealFolderWrap(sn.nk, w.fk, w.root, 1, sn.id, 2)]), "key changed", "stale_epoch");
  await refused(app(pg, w.sara.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, sn.id, crypto.randomUUID(), await sealFolderWrap(sn.nk, w.fk, w.root, 1, sn.id, 1)]), "isn't in this shared folder", "bad_folder");
  // Not her note to put in: Emil's, which she isn't in.
  const en = await sharedNote(pg, w.emil, "Emil's");
  await refused(app(pg, w.sara.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, en.id, w.root, await sealFolderWrap(en.nk, w.fk, w.root, 1, en.id, 1)]), "not in this note", "not_member");
  await app(pg, w.sara.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [w.root, sn.id, w.root, await sealFolderWrap(sn.nk, w.fk, w.root, 1, sn.id, 1)]);
  // Moves inside the folder are anyone's who can edit; the note stays in one shared folder.
  await app(pg, w.emil.id, `select public.collab_folder_note_move($1, $2, $3)`, [w.root, sn.id, w.dinner]);
  assertEquals((await sharedRow(pg, sn.id)).folder_id, w.dinner);
  await refused(app(pg, w.jonas.id, `select public.collab_folder_note_move($1, $2, $3)`, [w.root, sn.id, w.root]), "view this shared folder", "read_only");
  const other = crypto.randomUUID();
  const fk2 = newDataKey();
  await app(pg, w.sara.id, `select public.collab_share_folder($1, $2, $3, $4)`, [other,
    await sealNoteKey(fk2, w.sara.identity, w.sara.identity.publicRaw, { note: other, epoch: 1, from: w.sara.id, to: w.sara.id }),
    await selfFolder(w.sara, fk2, other, 1), await sealFolderName("Hers", fk2, other, 1, other)]);
  await refused(app(pg, w.sara.id, `select public.collab_folder_note_add($1, $2, $3, $4)`, [other, sn.id, other, await sealFolderWrap(sn.nk, fk2, other, 1, sn.id, 1)]), "another shared folder", "other_folder");
  // Rewrap: a member of the note and the folder; for the current keys.
  await app(pg, w.sara.id, `select public.collab_folder_note_rewrap($1, $2, $3)`, [w.root, sn.id, await sealFolderWrap(sn.nk, w.fk, w.root, 1, sn.id, 1)]);
  await refused(app(pg, w.jonas.id, `select public.collab_folder_note_rewrap($1, $2, $3)`, [w.root, sn.id, await sealFolderWrap(sn.nk, w.fk, w.root, 1, sn.id, 1)]), "not in this note", "not_member");
});

Deno.test("the owner changes a member's role, and their notes through the folder follow", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const n = await noteInFolder(pg, w, w.emil, "Pancakes", w.root, [w.sara, w.jonas]);
  await app(pg, w.emil.id, `select public.collab_folder_set_role($1, $2, 'viewer')`, [w.root, w.sara.id]);
  await app(pg, w.emil.id, `select public.collab_folder_set_role($1, $2, 'editor')`, [w.root, w.jonas.id]);
  assertEquals((await noteRole(pg, n.id, w.sara.id)).role, "viewer");
  assertEquals((await noteRole(pg, n.id, w.jonas.id)).role, "editor");
  await refused(push(pg, w.sara, n.id, n.nk), "view this note", "read_only");
  await push(pg, w.jonas, n.id, n.nk);
  await refused(app(pg, w.sara.id, `select public.collab_folder_set_role($1, $2, 'editor')`, [w.root, w.sara.id]), "Only the owner", "not_owner");
  await refused(app(pg, w.emil.id, `select public.collab_folder_set_role($1, $2, 'viewer')`, [w.root, w.emil.id]), "own role", "owner_row");
  await refused(app(pg, w.emil.id, `select public.collab_folder_set_role($1, $2, 'owner')`, [w.root, w.sara.id]), "Unknown role");
  await refused(app(pg, w.emil.id, `select public.collab_folder_set_role($1, $2, 'editor')`, [w.root, w.ola.id]), "not in this shared folder", "not_member");
});

Deno.test("removing someone ends their folder and its notes ('removed'), their own notes leave with them, the link stops; a new key follows", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const emils = await noteInFolder(pg, w, w.emil, "Pancakes", w.root, [w.sara, w.jonas]);
  const saras = await noteInFolder(pg, w, w.sara, "Waffles", w.dinner, [w.emil, w.jonas]);
  await refused(app(pg, w.sara.id, `select public.collab_folder_remove($1, $2)`, [w.root, w.jonas.id]), "Only the owner", "not_owner");
  await refused(app(pg, w.emil.id, `select public.collab_folder_remove($1, $2)`, [w.root, w.emil.id]), "can't remove themselves");
  await app(pg, w.emil.id, `select public.collab_folder_remove($1, $2)`, [w.root, w.sara.id]);
  // Sara: out of the folder and Emil's note, with the reason; she can't write there any more.
  assertEquals((await app(pg, w.sara.id, `select * from public.collab_folder_memberships()`)).filter((m: { root: string }) => m.root === w.root), []);
  assertEquals(await app(pg, w.sara.id, `select * from public.collab_folder_access_ended()`).then((r) => r.map((x: { root: string; reason: string }) => [x.root, x.reason])), [[w.root, "removed"]]);
  assertEquals(await noteRole(pg, emils.id, w.sara.id), undefined);
  assertEquals(await ended(pg, emils.id, w.sara.id), "removed");
  await refused(push(pg, w.sara, emils.id, emils.nk), "not in this note", "not_member");
  // Her own note left the folder with her: still hers, the folder's members out of it ('moved').
  assertEquals((await sharedRow(pg, saras.id)).folder_root, null);
  assertEquals(await noteRole(pg, saras.id, w.emil.id), undefined);
  assertEquals(await ended(pg, saras.id, w.emil.id), "moved");
  assertEquals(await ended(pg, saras.id, w.jonas.id), "moved");
  assertEquals((await noteRole(pg, saras.id, w.sara.id)).role, "owner");
  // New keys asked for: the folder and Emil's note; the link is gone.
  assert((await rootRow(pg, w.root)).rekey_after);
  assert((await sharedRow(pg, emils.id)).rekey_after);
  assertEquals((await app(pg, w.emil.id, `select rekey_after from public.collab_folder_memberships()`))[0].rekey_after !== null, true);
  await refused(app(pg, w.ola.id, `select * from public.collab_folder_open_link($1, $2)`, [w.view.id, w.view.answer]), "expired or was stopped");
  // Joining again by a new link: the reason goes.
  const l = await w.makeLink("editor");
  await joinByLink(pg, w.sara, l, w.fk, w.root);
  assertEquals(await app(pg, w.sara.id, `select * from public.collab_folder_access_ended()`), []);
});

Deno.test("a new folder key: every member's wrap in one call, names and note wraps resealed, rekey_after cleared", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const n = await noteInFolder(pg, w, w.emil, "Pancakes", w.dinner, [w.sara, w.jonas]);
  await app(pg, w.jonas.id, `select public.collab_folder_leave($1)`, [w.root]);
  assertEquals(await ended(pg, n.id, w.jonas.id), "left");
  assertEquals((await app(pg, w.jonas.id, `select * from public.collab_folder_access_ended()`))[0].reason, "left");
  assert((await rootRow(pg, w.root)).rekey_after);
  await refused(app(pg, w.emil.id, `select public.collab_folder_leave($1)`, [w.root]), "can't leave");
  const fk2 = newDataKey();
  const wrapFor = (p: Person) => sealNoteKey(fk2, w.emil.identity, p.identity.publicRaw, { note: w.root, epoch: 2, from: w.emil.id, to: p.id });
  const selfWrap = await selfFolder(w.emil, fk2, w.root, 2);
  const noteWraps = JSON.stringify([{ note_id: n.id, folder_wrap: await sealFolderWrap(n.nk, fk2, w.root, 2, n.id, 1) }]);
  const names = JSON.stringify([{ id: w.root, name: await sealFolderName("Recipes", fk2, w.root, 2, w.root) }, { id: w.dinner, name: await sealFolderName("Dinner", fk2, w.root, 2, w.dinner) }]);
  const rekey = (p: Person, epoch: number, wraps: unknown[], nw = noteWraps, nm: string | null = names) =>
    app(pg, p.id, `select public.collab_folder_rekey($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb)`, [w.root, epoch, JSON.stringify(wraps), selfWrap, nw, nm]);
  await refused(rekey(w.sara, 2, []), "Only the owner", "not_owner");
  await refused(rekey(w.emil, 3, [{ user_id: w.sara.id, key_wrap: await wrapFor(w.sara) }]), "key changed", "stale_epoch");
  await refused(rekey(w.emil, 2, []), "Every remaining member", "wraps_incomplete");
  await refused(rekey(w.emil, 2, [{ user_id: w.sara.id, key_wrap: await wrapFor(w.sara) }], JSON.stringify([{ note_id: n.id, folder_wrap: await sealFolderWrap(n.nk, fk2, w.root, 1, n.id, 1) }])), "isn't sealed for the new folder key", "bad_wrap");
  await refused(rekey(w.emil, 2, [{ user_id: w.sara.id, key_wrap: await wrapFor(w.sara) }], noteWraps, JSON.stringify([{ id: w.dinner, name: await sealFolderName("Dinner", w.fk, w.root, 1, w.dinner) }])), "name isn't sealed", "bad_name");
  await rekey(w.emil, 2, [{ user_id: w.sara.id, key_wrap: await wrapFor(w.sara) }]);
  assertEquals(await rootRow(pg, w.root), { epoch: 2, rekey_after: null });
  const [sm] = await app(pg, w.sara.id, `select * from public.collab_folder_memberships()`);
  assertEquals([sm.epoch, sm.self_wrap, sm.wrapped_by, sm.accepted_at !== null], [2, null, w.emil.id, true]);
  const opened = await openNoteKey(sm.key_wrap, w.sara.identity, w.emil.identity.publicRaw, { note: w.root, epoch: 2, from: w.emil.id, to: w.sara.id });
  assertEquals(toBase64(opened), toBase64(fk2));
  await app(pg, w.sara.id, `select public.collab_folder_accept($1, 2, $2)`, [w.root, await selfFolder(w.sara, fk2, w.root, 2)]);
  const tree = await app(pg, w.sara.id, `select * from public.collab_folder_folders($1)`, [w.root]);
  assertEquals(await openFolderName(tree.find((f: { id: string }) => f.id === w.dinner).name, fk2, w.root, w.dinner), "Dinner");
  const [nr] = await app(pg, w.sara.id, `select * from public.collab_folder_notes($1)`, [w.root]);
  assertEquals(toBase64((await openFolderWrap(nr.folder_wrap, fk2, w.root, n.id)).nk), toBase64(n.nk));
  // Names and placements after this need the new key.
  await refused(app(pg, w.sara.id, `select public.collab_folder_put($1, $2, $3, $4, 0)`, [w.root, w.dinner, w.root, await sealFolderName("Dinner", w.fk, w.root, 1, w.dinner)]), "key changed", "stale_epoch");
});

Deno.test("taking a note out: its maker keeps it and the folder's members leave it; anyone else's take ends it for everyone ('moved')", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const mine = await noteInFolder(pg, w, w.emil, "Pancakes", w.root, [w.sara, w.jonas]);
  const theirs = await noteInFolder(pg, w, w.emil, "Waffles", w.root, [w.sara, w.jonas]);
  const saraPointer = crypto.randomUUID();
  await app(pg, w.sara.id, `insert into public.notes (id, body_ct, head_ct, shared_note_id) values ($1, $2, $3, $4)`,
    [saraPointer, await w.sara.a.vault.sealBody(saraPointer, "Waffles\n"), await w.sara.a.vault.sealHead(saraPointer, { title: "Waffles" }), theirs.id]);
  await refused(app(pg, w.jonas.id, `select public.collab_folder_note_remove($1, $2)`, [w.root, mine.id]), "view this shared folder", "read_only");
  // The maker moves it out.
  await app(pg, w.emil.id, `select public.collab_folder_note_remove($1, $2)`, [w.root, mine.id]);
  const row = await sharedRow(pg, mine.id);
  assertEquals([row.folder_root, row.folder_id, row.folder_wrap, row.rekey_after !== null], [null, null, null, true]);
  assertEquals([await ended(pg, mine.id, w.sara.id), await ended(pg, mine.id, w.jonas.id)], ["moved", "moved"]);
  assertEquals((await noteRole(pg, mine.id, w.emil.id)).role, "owner");
  // Sara moves Emil's note out: her device kept a copy; the shared note goes for everyone.
  await app(pg, w.sara.id, `select public.collab_folder_note_remove($1, $2)`, [w.root, theirs.id]);
  assertEquals(await sharedRow(pg, theirs.id), undefined);
  assertEquals([await ended(pg, theirs.id, w.emil.id), await ended(pg, theirs.id, w.jonas.id), await ended(pg, theirs.id, w.sara.id)], ["moved", "moved", "moved"]);
  const [{ by_user }] = (await pg.query<{ by_user: string }>(`select by_user from public.note_access_ended where note_id = $1 and user_id = $2`, [theirs.id, w.emil.id])).rows;
  assertEquals(by_user, w.sara.id);
  const pointers = (await pg.query<{ deleted: boolean }>(`select deleted_at is not null as deleted from public.notes where shared_note_id = $1 or id = $1`, [theirs.id])).rows;
  assertEquals(pointers.map((p) => p.deleted), [true, true]);
  // What Emil reads about it: moved, by Sara.
  assertEquals((await app(pg, w.emil.id, `select reason, by_name from public.collab_access_ended($1)`, [theirs.id]))[0], { reason: "moved", by_name: "Sara" });
});

Deno.test("stopping sharing a folder: everyone else's access ends 'unshared', notes leave the folder, the tree goes", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const emils = await noteInFolder(pg, w, w.emil, "Pancakes", w.root, [w.sara, w.jonas]);
  const saras = await noteInFolder(pg, w, w.sara, "Waffles", w.root, [w.emil]);
  await refused(app(pg, w.sara.id, `select public.collab_unshare_folder($1)`, [w.root]), "Only the owner", "not_owner");
  await app(pg, w.emil.id, `select public.collab_unshare_folder($1)`, [w.root]);
  assertEquals((await pg.query(`select 1 from public.shared_folders where root_id = $1`, [w.root])).rows.length, 0);
  assertEquals((await pg.query(`select 1 from public.folder_members where folder_id = $1`, [w.root])).rows.length, 0);
  for (const p of [w.sara, w.jonas]) assertEquals((await app(pg, p.id, `select reason from public.collab_folder_access_ended()`))[0].reason, "unshared");
  assertEquals([await ended(pg, emils.id, w.sara.id), await ended(pg, emils.id, w.jonas.id), await ended(pg, saras.id, w.emil.id)], ["unshared", "unshared", "unshared"]);
  assertEquals([(await sharedRow(pg, emils.id)).folder_root, (await sharedRow(pg, saras.id)).folder_root], [null, null]);
  // Each note stays its maker's.
  assertEquals([(await noteRole(pg, emils.id, w.emil.id)).role, (await noteRole(pg, saras.id, w.sara.id)).role], ["owner", "owner"]);
});

Deno.test("Start fresh: the owner's folders end for everyone; a member's leave marks them for a new key", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const n = await noteInFolder(pg, w, w.sara, "Waffles", w.root, [w.emil, w.jonas]);
  const fresh = (id: string) => ({ "request.jwt.claims": JSON.stringify({ sub: id, role: "authenticated", amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) - 30 }] }) });
  const signedIn = fresh(w.sara.id);
  assertEquals((await asUser<{ done: boolean }>(pg, w.sara.id, `select public.start_fresh($1) as done`, [w.sara.a.keyId], signedIn))[0].done, true);
  assertEquals((await pg.query(`select 1 from public.folder_members where user_id = $1`, [w.sara.id])).rows.length, 0);
  assert((await rootRow(pg, w.root)).rekey_after);
  assertEquals(await sharedRow(pg, n.id), undefined, "her shared notes go with her keys, as before");
  // Emil starts fresh: his folder ends for Jonas.
  const emilClaims = fresh(w.emil.id);
  const jn = await noteInFolder(pg, w, w.jonas, "Jonas's", w.root, []).catch(() => null);
  assertEquals(jn, null, "a viewer can't put notes in");
  await asUser(pg, w.emil.id, `select public.start_fresh($1)`, [w.emil.a.keyId], emilClaims);
  assertEquals((await pg.query(`select 1 from public.shared_folders where root_id = $1`, [w.root])).rows.length, 0);
  assertEquals((await app(pg, w.jonas.id, `select reason from public.collab_folder_access_ended()`))[0].reason, "unshared");
});

Deno.test("deleting an account cascades: the owner's folder goes, a member's rows go, notes in others' folders end cleanly", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  const emils = await noteInFolder(pg, w, w.emil, "Pancakes", w.root, [w.sara, w.jonas]);
  const saras = await noteInFolder(pg, w, w.sara, "Waffles", w.root, [w.emil, w.jonas]);
  await pg.query(`delete from auth.users where id = $1`, [w.sara.id]);
  assertEquals(await sharedRow(pg, saras.id), undefined);
  assertEquals((await pg.query(`select 1 from public.folder_members where user_id = $1`, [w.sara.id])).rows.length, 0);
  assertEquals(await noteRole(pg, emils.id, w.sara.id), undefined);
  await pg.query(`delete from auth.users where id = $1`, [w.emil.id]);
  assertEquals((await pg.query(`select 1 from public.shared_folders`)).rows.length, 0);
  assertEquals((await pg.query(`select 1 from public.folder_members`)).rows.length, 0);
  assertEquals((await pg.query(`select 1 from public.folder_invite_links`)).rows.length, 0);
});

Deno.test("nothing is reachable signed out or straight from the tables", async () => {
  const pg = await schemaDB();
  const w = await folderWorld(pg);
  for (const t of ["shared_folders", "folder_members", "folder_invite_links", "folder_access_ended"]) {
    await refused(app(pg, w.emil.id, `select * from public.${t}`), "permission denied");
  }
  await refused(pg.transaction(async (tx) => {
    await tx.exec(`set local role anon`);
    await tx.query(`select * from public.collab_folder_folders($1)`, [w.root]);
  }), "permission denied for function");
  // The internal helpers aren't callable by anyone signed in.
  await refused(app(pg, w.emil.id, `select public.collab_folder_drop_member($1, $2, 'removed')`, [w.root, w.sara.id]), "permission denied");
  await refused(app(pg, w.emil.id, `select public.collab_folder_end_note($1, $2, 'moved', null, true)`, [w.root, w.root]), "permission denied");
});
