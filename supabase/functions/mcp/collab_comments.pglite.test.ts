// Can comment on a shared whiteboard (20261118100000_collab_board_comment_role.sql) on the whole
// schema in an in-process Postgres, sealed with the real formats (_shared/collab.ts): a commenter
// writes comment entries and nothing of the drawing; a viewer writes neither; an editor and the
// owner write both; nobody outside reads or writes; entries are append only, stamped with their
// writer and role, in commit order, under the current key; a Can comment link joins as a
// commenter; and a link reader who isn't signed in reads the entries with the link's proof.
//   cd supabase/functions/mcp && deno test -A collab_comments.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, newUser, schemaDB } from "./pglite.ts";
import { aesKey, hex, keyIdOf, newDataKey, open, seal, toBase64 } from "../_shared/e2ee.ts";
import {
  bytes, identityContext, linkKeys, newIdentity, noteKeyContext, open3, openNoteKey, pictureBytes, seal3, sealNoteKey, text,
} from "../_shared/collab.ts";

// deno-lint-ignore no-explicit-any
const app = (pg: PGlite, me: string, sql: string, params: unknown[] = []) => asUser<any>(pg, me, sql, params);

/** As someone who isn't signed in, like the browser through PostgREST with the anon key. */
// deno-lint-ignore no-explicit-any
async function anon(pg: PGlite, sql: string, params: unknown[] = []): Promise<any[]> {
  return await pg.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ role: "anon" })]);
    await tx.exec(`set local role anon`);
    return (await tx.query(sql, params)).rows;
  });
}

async function refused(p: Promise<unknown>, what: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, what);
}

async function person(pg: PGlite, name: string) {
  const id = await newUser(pg);
  const dk = newDataKey(), keyId = await keyIdOf(dk);
  await app(pg, id, `select * from public.create_account_key($1, $2, $3, 0)`, [keyId, "00".repeat(32), `amb2.${keyId}.${toBase64(crypto.getRandomValues(new Uint8Array(48)))}`]);
  await app(pg, id, `insert into public.profiles (display_name) values ($1)`, [name]);
  const identity = await newIdentity();
  await app(pg, id, `select public.collab_publish_identity($1, $2)`,
    [toBase64(identity.publicRaw), await seal(toBase64(identity.d), await aesKey(dk), keyId, identityContext(id))]);
  return { id, name, dk, keyId, identity };
}
type Person = Awaited<ReturnType<typeof person>>;
type Key = Uint8Array<ArrayBuffer>;

const selfWrap = async (p: Person, nk: Key, note: string, epoch: number) => await seal(toBase64(nk), await aesKey(p.dk), p.keyId, noteKeyContext(note, epoch));

/** Emil's board, shared; `people` invited with their roles and accepted. */
async function board(pg: PGlite, emil: Person, people: [Person, string][]) {
  const note = crypto.randomUUID(), nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note, epoch: 1, from: emil.id, to: emil.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Launch plan" })), nk, note, 1);
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [note, toSelf, await selfWrap(emil, nk, note, 1), head]);
  for (const [p, role] of people) {
    const wrap = await sealNoteKey(nk, emil.identity, p.identity.publicRaw, { note, epoch: 1, from: emil.id, to: p.id });
    await app(pg, emil.id, `select public.collab_invite($1, $2, $3, $4, 1)`, [note, p.id, role, wrap]);
    const [row] = await app(pg, p.id, `select * from public.note_members where note_id = $1 and user_id = $2`, [note, p.id]);
    const opened = await openNoteKey(row.key_wrap, p.identity, emil.identity.publicRaw, { note, epoch: 1, from: emil.id, to: p.id });
    await app(pg, p.id, `select public.collab_accept($1, $2)`, [note, await selfWrap(p, opened, note, 1)]);
  }
  return { note, nk };
}

/** A comment entry from `p` as a device seals it: `{"comments": [record]}` under the note key, its author in the AAD. */
async function entry(p: Person, nk: Key, note: string, epoch: number, words: string) {
  const record = { id: "c-" + crypto.randomUUID().replaceAll("-", "").slice(0, 16), by: p.id.toUpperCase(), name: p.name, text: words, created: "2026-11-18T09:00:00Z", version: 1, x: 1, y: 0 };
  return await seal3("c", bytes(JSON.stringify({ comments: [record] })), nk, note, epoch, p.id);
}
const comment = async (pg: PGlite, p: Person, note: string, epoch: number, ct: string) =>
  Number((await app(pg, p.id, `insert into public.note_comments (note_id, epoch, ct) values ($1, $2, $3) returning id`, [note, epoch, ct]))[0].id);
/** A drawing change from `p` (its bytes stand in for an Automerge change), sealed as a device seals it. */
const change = async (pg: PGlite, p: Person, note: string, nk: Key, words: string) =>
  await app(pg, p.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, 1, $2) returning id`, [note, await seal3("u", bytes(words), nk, note, 1, p.id)]);
const snapshot = async (pg: PGlite, p: Person, note: string, nk: Key) =>
  await app(pg, p.id, `insert into public.note_snapshots (note_id, upto, epoch, ct) values ($1, 0, 1, $2)`, [note, await seal3("s", bytes("saved"), nk, note, 1, "0")]);
const picture = async (pg: PGlite, p: Person, note: string, nk: Key) =>
  await app(pg, p.id, `select public.collab_put_file($1, 'shot', 1, $2)`, [note, await seal3("f", pictureBytes("image/png", bytes("png")), nk, note, 1, "shot")]);
const said = async (pg: PGlite, p: Person, note: string, nk: Key) =>
  await Promise.all((await app(pg, p.id, `select author_id, ct from public.note_comments where note_id = $1 order by id`, [note]))
    .map(async (r: { author_id: string; ct: string }) => JSON.parse(text(await open3("c", r.ct, nk, note, r.author_id))).comments[0].text));

Deno.test("roles: a commenter comments and can't draw; a viewer does neither; an editor and the owner do both", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), cleo = await person(pg, "Cleo"), vik = await person(pg, "Vik"), eve = await person(pg, "Eve");
  const { note, nk } = await board(pg, emil, [[sara, "editor"], [cleo, "commenter"], [vik, "viewer"]]);
  const roles = await app(pg, emil.id, `select user_id, role from public.collab_members($1)`, [note]);
  assertEquals(roles.find((r: { user_id: string }) => r.user_id === cleo.id).role, "commenter");

  // Cleo, a commenter: comments go in, stamped as hers and as a commenter's.
  const id = await comment(pg, cleo, note, 1, await entry(cleo, nk, note, 1, "Can we move Publish up?"));
  const [row] = await app(pg, emil.id, `select author_id, role, client from public.note_comments where id = $1`, [id]);
  assertEquals([row.author_id, row.role, row.client], [cleo.id, "commenter", null]);
  // …and nothing of the drawing: no change, no snapshot, no picture, no title.
  await refused(change(pg, cleo, note, nk, "a box"), "view this note but not change it");
  await refused(snapshot(pg, cleo, note, nk), "view this note but not change it");
  await refused(picture(pg, cleo, note, nk), "view this note but not change it");
  const headBefore = (await pg.query<{ head_ct: string }>(`select head_ct from public.shared_notes where id = $1`, [note])).rows[0].head_ct;
  await app(pg, cleo.id, `update public.shared_notes set head_ct = $2 where id = $1`, [note, await seal3("h", bytes(`{"title":"Cleo's"}`), nk, note, 1)]);
  assertEquals((await pg.query<{ head_ct: string }>(`select head_ct from public.shared_notes where id = $1`, [note])).rows[0].head_ct, headBefore);
  // Nor the link, nor who's in it.
  await refused(app(pg, cleo.id, `select public.collab_stop_link($1)`, [note]), "Only the owner");
  await refused(app(pg, cleo.id, `select public.collab_invite($1, $2, 'editor', 'amb3k.AAAA', 1)`, [note, eve.id]), "Only the owner");

  // Vik, a viewer: neither.
  await refused(comment(pg, vik, note, 1, await entry(vik, nk, note, 1, "Viewer here")), "view this whiteboard but not comment on it");
  await refused(change(pg, vik, note, nk, "a box"), "view this note but not change it");
  // Eve, outside: neither, and reads nothing.
  await refused(comment(pg, eve, note, 1, await entry(eve, nk, note, 1, "Hi")), "not in this note");
  assertEquals(await app(pg, eve.id, `select * from public.note_comments`), []);

  // Sara, an editor, and Emil, the owner: both.
  await comment(pg, sara, note, 1, await entry(sara, nk, note, 1, "Agreed"));
  await change(pg, sara, note, nk, "Sara's box");
  await comment(pg, emil, note, 1, await entry(emil, nk, note, 1, "Done"));
  await change(pg, emil, note, nk, "Emil's arrow");
  assertEquals((await app(pg, emil.id, `select role from public.note_comments where note_id = $1 order by id`, [note])).map((r: { role: string }) => r.role),
    ["commenter", "editor", "owner"]);

  // Every member reads every entry, the viewer too, and each opens with its writer's id only.
  for (const p of [emil, sara, cleo, vik]) assertEquals(await said(pg, p, note, nk), ["Can we move Publish up?", "Agreed", "Done"]);
  const [first] = await app(pg, vik.id, `select ct from public.note_comments where id = $1`, [id]);
  await assertRejects(() => open3("c", first.ct, nk, note, emil.id), Error, "doesn't open");
  // A comment box isn't a change box, nor the other way round: neither stands in for the other.
  await assertRejects(() => open3("u", first.ct, nk, note, cleo.id));
  // The server holds no words.
  const all = (await pg.query<{ ct: string }>(`select ct from public.note_comments`)).rows.map((r) => r.ct).join("");
  assert(!all.includes("Publish") && !all.includes(toBase64(bytes("Can we move Publish up?")).slice(0, 12)));
});

Deno.test("append only and honest: no updates or deletes, the writer is the session's, ids in order, one key", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), cleo = await person(pg, "Cleo");
  const { note, nk } = await board(pg, emil, [[cleo, "commenter"]]);
  const a = await comment(pg, cleo, note, 1, await entry(cleo, nk, note, 1, "First"));
  const b = await comment(pg, emil, note, 1, await entry(emil, nk, note, 1, "Second"));
  assert(b > a);

  // Nobody changes or takes away an entry, their own included, the owner included.
  for (const p of [cleo, emil]) {
    await refused(app(pg, p.id, `update public.note_comments set ct = ct where note_id = $1`, [note]), "permission denied");
    await refused(app(pg, p.id, `delete from public.note_comments where note_id = $1`, [note]), "permission denied");
  }
  // Writing as someone else, or as another role, or under a chosen id: the server stamps its own.
  await refused(app(pg, cleo.id, `insert into public.note_comments (note_id, epoch, ct, author_id) values ($1, 1, $2, $3)`,
    [note, await entry(cleo, nk, note, 1, "As Emil"), emil.id]), "permission denied");
  await refused(app(pg, cleo.id, `insert into public.note_comments (note_id, epoch, ct, role) values ($1, 1, $2, 'owner')`,
    [note, await entry(cleo, nk, note, 1, "As owner")]), "permission denied");
  await refused(app(pg, cleo.id, `insert into public.note_comments (id, note_id, epoch, ct) values (1, $1, 1, $2)`,
    [note, await entry(cleo, nk, note, 1, "At 1")]), "permission denied");
  // A box sealed as someone else lands as Cleo's, and so opens for nobody.
  const forged = await seal3("c", bytes(`{"comments":[]}`), nk, note, 1, emil.id);
  const f = await comment(pg, cleo, note, 1, forged);
  const [row] = await app(pg, emil.id, `select author_id, ct from public.note_comments where id = $1`, [f]);
  assertEquals(row.author_id, cleo.id);
  await assertRejects(() => open3("c", row.ct, nk, note, row.author_id));

  // Only under the note's current key, and in a box sealed for that key.
  await refused(comment(pg, cleo, note, 2, await entry(cleo, nk, note, 2, "Future key")), "key changed");
  await refused(comment(pg, cleo, note, 1, await entry(cleo, nk, note, 2, "Wrong box")), "isn't sealed for this note's key");
  await refused(app(pg, cleo.id, `insert into public.note_comments (note_id, epoch, ct) values ($1, 1, 'amb3u.1.AAAA')`, [note]), "note_comments_ct_check");
  // An entry is at most 64 KB.
  await refused(comment(pg, cleo, note, 1, await seal3("c", crypto.getRandomValues(new Uint8Array(50_000)) as Key, nk, note, 1, cleo.id)), "note_comments_ct_check");
});

Deno.test("a board has room for 16 MB of comment entries", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), cleo = await person(pg, "Cleo");
  const { note, nk } = await board(pg, emil, [[cleo, "commenter"]]);
  // Filled to the edge directly (the table's own rules don't apply to the server's role).
  const big = await seal3("c", crypto.getRandomValues(new Uint8Array(40_000)) as Key, nk, note, 1, emil.id);
  const rows = Math.floor(16_777_216 / big.length);
  await pg.query(`alter table public.note_comments disable trigger note_comments_guard`);
  await pg.query(`insert into public.note_comments (note_id, author_id, role, epoch, ct) select $1, $2, 'owner', 1, $3 from generate_series(1, $4)`, [note, emil.id, big, rows]);
  await pg.query(`alter table public.note_comments enable trigger note_comments_guard`);
  await refused(comment(pg, cleo, note, 1, big), "no room for more comments");
});

Deno.test("removed: a commenter taken out reads and writes nothing; the new key writes", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), cleo = await person(pg, "Cleo");
  const { note, nk } = await board(pg, emil, [[cleo, "commenter"]]);
  await comment(pg, cleo, note, 1, await entry(cleo, nk, note, 1, "Before"));
  const nk2 = newDataKey() as Key;
  const wraps = [{ user_id: emil.id, key_wrap: await sealNoteKey(nk2, emil.identity, emil.identity.publicRaw, { note, epoch: 2, from: emil.id, to: emil.id }) }];
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [note, cleo.id, JSON.stringify(wraps)]);
  assertEquals(await app(pg, cleo.id, `select * from public.note_comments`), []);
  await refused(comment(pg, cleo, note, 1, await entry(cleo, nk, note, 1, "After")), "not in this note");
  // Emil's device on the old key is told to open it again; under the new key it goes in.
  await refused(comment(pg, emil, note, 1, await entry(emil, nk, note, 1, "Old key")), "key changed");
  await comment(pg, emil, note, 2, await entry(emil, nk2, note, 2, "New key"));
  // The entries go with the shared note.
  await app(pg, emil.id, `delete from public.shared_notes where id = $1`, [note]).catch(() => {});
  await pg.query(`delete from public.shared_notes where id = $1`, [note]);
  assertEquals((await pg.query(`select 1 from public.note_comments`)).rows.length, 0);
});

/** A link for Emil's note with `role` (ShareModel.setAccess). */
async function makeLink(pg: PGlite, owner: Person, note: string, nk: Key, role: string) {
  const secret = crypto.getRandomValues(new Uint8Array(16));
  const id = toBase64(crypto.getRandomValues(new Uint8Array(16))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  const lk = await linkKeys(secret, id);
  const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(lk.answer.match(/../g)!.map((h) => parseInt(h, 16))))));
  await app(pg, owner.id, `select public.collab_create_link($1, $2, $3, 1, $4, $5)`, [id, note, role, answerHash, await seal(toBase64(nk), lk.key, await keyIdOf(nk), `invite:${id.toLowerCase()}`)]);
  return { link: id, answer: lk.answer, key: lk.key };
}

Deno.test("a Can comment link: whoever joins with it is a commenter, and a reader who isn't signed in reads the comments", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), cleo = await person(pg, "Cleo");
  const { note, nk } = await board(pg, emil, []);
  const l = await makeLink(pg, emil, note, nk, "commenter");
  await comment(pg, emil, note, 1, await entry(emil, nk, note, 1, "Thoughts?"));

  // Before signing in: the link's proof reads the entries, and nothing writes.
  const read = async (after = 0) => (await anon(pg, `select public.collab_link_comments($1, $2, $3) as r`, [l.link, l.answer, after]))[0].r;
  const r = await read();
  assertEquals([r.comments.length, r.more], [1, false]);
  assertEquals(JSON.parse(text(await open3("c", r.comments[0].ct, nk, note, r.comments[0].author_id))).comments[0].text, "Thoughts?");
  assertEquals(r.comments[0].role, "owner");
  assertEquals((await read(r.comments[0].id)).comments, []);
  await refused(anon(pg, `select public.collab_link_comments($1, $2, 0)`, [l.link, "00".repeat(32)]), "expired or was stopped");
  await refused(anon(pg, `insert into public.note_comments (note_id, epoch, ct) values ($1, 1, 'amb3c.1.AAAA')`, [note]), "permission denied");

  // Joining with it, as the app and the browser join (ShareModel.join, board-keys.ts).
  const [opened] = await app(pg, cleo.id, `select * from public.collab_open_link($1, $2)`, [l.link, l.answer]);
  assertEquals(opened.role, "commenter");
  const nkOpened = await open(opened.key_wrap, l.key, `invite:${l.link.toLowerCase()}`).then((b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) as Key);
  assertEquals(hex(nkOpened), hex(nk));
  const wrap = await sealNoteKey(nkOpened, cleo.identity, cleo.identity.publicRaw, { note, epoch: 1, from: cleo.id, to: cleo.id });
  await app(pg, cleo.id, `select public.collab_join_link($1, $2, $3, $4)`, [l.link, l.answer, wrap, await selfWrap(cleo, nkOpened, note, 1)]);
  const [me] = await app(pg, cleo.id, `select role from public.note_members where note_id = $1 and user_id = $2`, [note, cleo.id]);
  assertEquals(me.role, "commenter");
  await comment(pg, cleo, note, 1, await entry(cleo, nk, note, 1, "Move Publish up"));
  await refused(change(pg, cleo, note, nk, "a box"), "view this note but not change it");
  assertEquals((await read()).comments.length, 2);

  // The role names the server takes: an unknown one is refused, for links and invites alike.
  await refused(makeLink(pg, emil, note, nk, "owner"), "note_invite_links_role_check");
  await refused(app(pg, emil.id, `select public.collab_invite($1, $2, 'boss', 'amb3k.AAAA', 1)`, [note, cleo.id]), "Unknown role");
});

Deno.test("an AI's entry says which AI, as a change does", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), cleo = await person(pg, "Cleo");
  const { note, nk } = await board(pg, emil, [[cleo, "commenter"]]);
  const ct = await entry(cleo, nk, note, 1, "Claude here");
  await asUser(pg, cleo.id, `insert into public.note_comments (note_id, epoch, ct) values ($1, 1, $2)`, [note, ct], { "pane.source": "mcp", "pane.client": "Claude" });
  await comment(pg, cleo, note, 1, await entry(cleo, nk, note, 1, "Cleo here"));
  assertEquals((await app(pg, emil.id, `select client from public.note_comments order by id`)).map((r: { client: string | null }) => r.client), ["Claude", null]);
});
