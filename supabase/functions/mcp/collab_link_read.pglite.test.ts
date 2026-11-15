// A shared whiteboard read with its link by someone who isn't signed in, in a browser
// (20261117100000_collab_link_read.sql), on the whole schema in an in-process Postgres, sealed
// with the real formats (_shared/collab.ts): the link's answer opens the note key and the
// document, the same changes a member reads; a wrong answer, a stopped link and a link from before
// a new key read nothing; and nothing here writes.
//   cd supabase/functions/mcp && deno test -A collab_link_read.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, newUser, schemaDB } from "./pglite.ts";
import { aesKey, hex, keyIdOf, newDataKey, open, seal, toBase64, fromBase64 } from "../_shared/e2ee.ts";
import {
  bytes, identityContext, linkKeys, newIdentity, noteKeyContext, open3, pictureBytes, pictureOf, seal3, sealNoteKey, text,
} from "../_shared/collab.ts";

// deno-lint-ignore no-explicit-any
const app = (pg: PGlite, me: string, sql: string, params: unknown[] = []) => asUser<any>(pg, me, sql, params);

/** Runs `sql` as someone who isn't signed in, like the browser through PostgREST with the anon key. */
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

/** Emil's shared board and its link (ShareModel.setAccess): `<id>#<secret>`, the answer's hash and the note key sealed under the link's key. */
async function sharedBoard(pg: PGlite, emil: Person, role: "editor" | "viewer") {
  const note = crypto.randomUUID(), nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note, epoch: 1, from: emil.id, to: emil.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Launch plan" })), nk, note, 1);
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`,
    [note, toSelf, await seal(toBase64(nk), await aesKey(emil.dk), emil.keyId, noteKeyContext(note, 1)), head]);
  const link = await makeLink(pg, emil, note, nk, 1, role);
  return { note, nk, ...link };
}

async function makeLink(pg: PGlite, owner: Person, note: string, nk: Uint8Array<ArrayBuffer>, epoch: number, role: string) {
  const secret = crypto.getRandomValues(new Uint8Array(16));
  const id = toBase64(crypto.getRandomValues(new Uint8Array(16))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  const lk = await linkKeys(secret, id);
  const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(lk.answer.match(/../g)!.map((h) => parseInt(h, 16))))));
  const wrap = await seal(toBase64(nk), lk.key, await keyIdOf(nk), `invite:${id.toLowerCase()}`);
  await app(pg, owner.id, `select public.collab_create_link($1, $2, $3, $4, $5, $6)`, [id, note, role, epoch, answerHash, wrap]);
  return { link: id, secret, answer: lk.answer, linkKey: lk.key };
}

/** A change from `p` (its bytes stand in for an Automerge change), sealed as a device seals it. */
async function change(pg: PGlite, p: Person, note: string, nk: Uint8Array<ArrayBuffer>, epoch: number, what: string) {
  const ct = await seal3("u", bytes(what), nk, note, epoch, p.id);
  const [row] = await app(pg, p.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, $2, $3) returning id`, [note, epoch, ct]);
  return Number(row.id);
}

// deno-lint-ignore no-explicit-any
const pull = async (pg: PGlite, link: string, answer: string, after = 0): Promise<any> =>
  (await anon(pg, `select public.collab_link_pull($1, $2, $3) as r`, [link, answer, after]))[0].r;

/** What a pull's changes say, opened with the note key and each one's author, as the browser opens them. */
// deno-lint-ignore no-explicit-any
const said = async (rows: any[], nk: Uint8Array<ArrayBuffer>, note: string) =>
  await Promise.all(rows.map(async (u) => text(await open3("u", u.ct, nk, note, u.author_id))));

Deno.test("an Edit link, not signed in: opens the note key, reads the board's changes and pictures, writes nothing", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara");
  const { note, nk, link, answer, linkKey } = await sharedBoard(pg, emil, "editor");
  // Sara joins with the link in the app, and draws.
  await app(pg, sara.id, `select public.collab_join_link($1, $2, $3, $4)`, [link, answer,
    await sealNoteKey(nk, sara.identity, sara.identity.publicRaw, { note, epoch: 1, from: sara.id, to: sara.id }),
    await seal(toBase64(nk), await aesKey(sara.dk), sara.keyId, noteKeyContext(note, 1))]);
  const a = await change(pg, emil, note, nk, 1, "emil draws a box");
  const b = await change(pg, sara, note, nk, 1, "sara adds a label");

  // The link, opened in a browser: the note key, the title, who shared it.
  const [opened] = await anon(pg, `select * from public.collab_open_link($1, $2)`, [link, answer]);
  assertEquals([opened.note_id, opened.role, opened.epoch, opened.owner_name], [note, "editor", 1, "Emil"]);
  const nkOpened = fromBase64(await open(opened.key_wrap, linkKey, `invite:${link.toLowerCase()}`));
  assertEquals(hex(nkOpened), hex(nk));
  assertEquals(JSON.parse(text(await open3("h", opened.head_ct, nkOpened, note))).title, "Launch plan");

  // Every change, oldest first, each opening under its author; then only what's new.
  const first = await pull(pg, link, answer);
  assertEquals([first.epoch, first.snapshot, first.more], [1, null, false]);
  assertEquals(first.updates.map((u: { id: number }) => Number(u.id)), [a, b]);
  assertEquals(await said(first.updates, nkOpened, note), ["emil draws a box", "sara adds a label"]);
  assertEquals((await pull(pg, link, answer, b)).updates, []);
  const c = await change(pg, sara, note, nk, 1, "sara moves it");
  assertEquals(await said((await pull(pg, link, answer, b)).updates, nkOpened, note), ["sara moves it"]);

  // A snapshot: who's behind it gets it and only the changes after; who's past it, just the changes.
  const snap = await seal3("s", bytes("the board so far"), nk, note, 1, String(c));
  await app(pg, emil.id, `insert into public.note_snapshots (note_id, upto, epoch, ct) values ($1, $2, 1, $3)`, [note, c, snap]);
  const d = await change(pg, emil, note, nk, 1, "emil writes a sticky");
  const fresh = await pull(pg, link, answer);
  assertEquals(Number(fresh.snapshot.upto), c);
  assertEquals(text(await open3("s", fresh.snapshot.ct, nkOpened, note, String(fresh.snapshot.upto))), "the board so far");
  assertEquals(await said(fresh.updates, nkOpened, note), ["emil writes a sticky"]);
  assertEquals(Number((await pull(pg, link, answer, b)).snapshot.upto), c);
  const caughtUp = await pull(pg, link, answer, c);
  assertEquals([caughtUp.snapshot, caughtUp.updates.map((u: { id: number }) => Number(u.id))], [null, [d]]);

  // A picture on the board, by its file id; one that isn't there is nothing.
  const shot = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  await app(pg, sara.id, `select public.collab_put_file($1, $2, 1, $3)`, [note, "Pic-Ab_9", await seal3("f", pictureBytes("image/png", shot), nk, note, 1, "Pic-Ab_9")]);
  const [pic] = await anon(pg, `select * from public.collab_link_file($1, $2, $3)`, [link, answer, "Pic-Ab_9"]);
  assertEquals(hex(pictureOf(await open3("f", pic.ct, nkOpened, note, pic.file_id)).data), hex(shot));
  assertEquals(await anon(pg, `select * from public.collab_link_file($1, $2, 'other')`, [link, answer]), []);

  // Not signed in, the link reads and that's all: no table, no join, no change, no picture.
  for (const table of ["note_updates", "note_snapshots", "note_files", "note_invite_links", "note_members", "shared_notes", "identity_keys"]) {
    await refused(anon(pg, `select * from public.${table}`), "permission denied");
  }
  await refused(anon(pg, `select public.collab_join_link($1, $2, 'x', 'y')`, [link, answer]), "permission denied");
  await refused(anon(pg, `insert into public.note_updates (note_id, epoch, ct) values ($1, 1, 'x')`, [note]), "permission denied");
  await refused(anon(pg, `select public.collab_put_file($1, 'x', 1, 'x')`, [note]), "permission denied");
  await refused(anon(pg, `select * from public.collab_link_note($1, $2)`, [link, answer]), "permission denied");
});

Deno.test("only the link's answer reads, and only while the link and its key are the note's", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara");
  const { note, nk, link, answer } = await sharedBoard(pg, emil, "viewer");
  await change(pg, emil, note, nk, 1, "a box");
  // A View link reads too: the board, live, without joining.
  assertEquals((await pull(pg, link, answer)).updates.length, 1);
  // A wrong answer, a made-up link, a malformed one: the same refusal, nothing read.
  const wrong = answer.replace(/^./, (c) => (c === "0" ? "1" : "0"));
  for (const [l, a] of [[link, wrong], ["A".repeat(22), answer], [link, "not hex"], ["short", answer]]) {
    await refused(pull(pg, l, a), "expired or was stopped");
    await refused(anon(pg, `select * from public.collab_link_file($1, $2, 'x')`, [l, a]), "expired or was stopped");
    // (collab_open_link, from before, says a malformed answer isn't hex; it still opens nothing.)
    await assertRejects(() => anon(pg, `select * from public.collab_open_link($1, $2)`, [l, a]));
  }

  // Sara is in the note; Emil removes her: a new key, and the old link stops reading.
  await app(pg, sara.id, `select public.collab_join_link($1, $2, $3, $4)`, [link, answer,
    await sealNoteKey(nk, sara.identity, sara.identity.publicRaw, { note, epoch: 1, from: sara.id, to: sara.id }),
    await seal(toBase64(nk), await aesKey(sara.dk), sara.keyId, noteKeyContext(note, 1))]);
  const nk2 = newDataKey();
  const wraps = [{ user_id: emil.id, key_wrap: await sealNoteKey(nk2, emil.identity, emil.identity.publicRaw, { note, epoch: 2, from: emil.id, to: emil.id }) }];
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [note, sara.id, JSON.stringify(wraps)]);
  await refused(pull(pg, link, answer), "expired or was stopped");
  // The new link (the app makes one with the new key) reads the board under it, from a snapshot
  // sealed again with the new key: never the old key's changes.
  const fresh = await makeLink(pg, emil, note, nk2, 2, "viewer");
  const [{ upto }] = await pg.query<{ upto: number }>(`select max(id) upto from public.note_updates where note_id = $1`, [note]).then((r) => r.rows);
  await app(pg, emil.id, `insert into public.note_snapshots (note_id, upto, epoch, ct) values ($1, $2, 2, $3)`,
    [note, upto, await seal3("s", bytes("sealed again"), nk2, note, 2, String(upto))]);
  const got = await pull(pg, fresh.link, fresh.answer);
  assertEquals([got.epoch, got.snapshot.epoch, got.updates], [2, 2, []]);
  assertEquals(text(await open3("s", got.snapshot.ct, nk2, note, String(got.snapshot.upto))), "sealed again");

  // Emil turns the link off: it reads nothing more.
  await app(pg, emil.id, `select public.collab_stop_link($1)`, [note]);
  await refused(pull(pg, fresh.link, fresh.answer), "expired or was stopped");
  await refused(anon(pg, `select * from public.collab_open_link($1, $2)`, [fresh.link, fresh.answer]), "expired or was stopped");
});

Deno.test("a long board reads in pages of 200 changes", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil");
  const { note, nk, link, answer } = await sharedBoard(pg, emil, "editor");
  const ct = await seal3("u", bytes("a stroke"), nk, note, 1, emil.id);
  await app(pg, emil.id, `insert into public.note_updates (note_id, epoch, ct) select $1, 1, $2 from generate_series(1, 230)`, [note, ct]);
  const one = await pull(pg, link, answer);
  assertEquals([one.updates.length, one.more], [200, true]);
  const two = await pull(pg, link, answer, Number(one.updates.at(-1).id));
  assertEquals([two.updates.length, two.more], [30, false]);
  assert(Number(two.updates[0].id) > Number(one.updates.at(-1).id));
});
