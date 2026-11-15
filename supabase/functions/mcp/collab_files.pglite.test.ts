// Pictures on a whiteboard shared with people (20261116150000_collab_board_pictures.sql) on the
// whole schema in an in-process Postgres, sealed with the real format (`amb3f`, _shared/collab.ts):
// members read them, editors write them under the current key only, a viewer and anyone outside
// can't write, a new key after a removal has them sealed again for whoever stays, and they go
// with the shared note.
//   cd supabase/functions/mcp && deno test -A collab_files.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, newUser, schemaDB } from "./pglite.ts";
import { aesKey, hex, keyIdOf, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import {
  bytes, identityContext, newIdentity, noteKeyContext, open3, openNoteKey, pictureBytes, pictureOf, seal3, sealNoteKey,
} from "../_shared/collab.ts";

// deno-lint-ignore no-explicit-any
const app = (pg: PGlite, me: string, sql: string, params: unknown[] = []) => asUser<any>(pg, me, sql, params);

async function refused(p: Promise<unknown>, what: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, what);
}

async function person(pg: PGlite, name: string) {
  const id = await newUser(pg);
  await pg.query(`update auth.users set email = $2 where id = $1`, [id, `${name.toLowerCase()}@example.com`]);
  const dk = newDataKey(), keyId = await keyIdOf(dk);
  await app(pg, id, `select * from public.create_account_key($1, $2, $3, 0)`, [keyId, "00".repeat(32), `amb2.${keyId}.${toBase64(crypto.getRandomValues(new Uint8Array(48)))}`]);
  await app(pg, id, `insert into public.profiles (display_name) values ($1)`, [name]);
  const identity = await newIdentity();
  const privateWrap = await seal(toBase64(identity.d), await aesKey(dk), keyId, identityContext(id));
  await app(pg, id, `select public.collab_publish_identity($1, $2)`, [toBase64(identity.publicRaw), privateWrap]);
  return { id, name, dk, keyId, identity };
}
type Person = Awaited<ReturnType<typeof person>>;

const selfWrap = async (p: Person, nk: Uint8Array<ArrayBuffer>, note: string, epoch: number) =>
  await seal(toBase64(nk), await aesKey(p.dk), p.keyId, noteKeyContext(note, epoch));

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

/** A small picture's bytes (a PNG's first bytes and some more), and its box under `nk`. */
const png = (n = 64) => Uint8Array.from([0x89, 0x50, 0x4e, 0x47, ...crypto.getRandomValues(new Uint8Array(n))]) as Uint8Array<ArrayBuffer>;
const sealPicture = (data: Uint8Array<ArrayBuffer>, nk: Uint8Array<ArrayBuffer>, note: string, epoch: number, file: string) =>
  seal3("f", pictureBytes("image/png", data), nk, note, epoch, file);
const put = (pg: PGlite, p: Person, note: string, file: string, epoch: number, ct: string) =>
  app(pg, p.id, `select public.collab_put_file($1, $2, $3, $4)`, [note, file, epoch, ct]);
const read = async (pg: PGlite, p: Person, note: string, file: string) =>
  (await app(pg, p.id, `select file_id, epoch, ct from public.note_files where note_id = $1 and file_id = $2`, [note, file]))[0];

Deno.test("an editor's picture: every member reads it and opens it, nobody outside can", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas"), eve = await person(pg, "Eve");
  const { note, nk } = await board(pg, emil, [[sara, "editor"], [jonas, "viewer"]]);
  const shot = png(), file = "pinto-Shot01";
  await put(pg, sara, note, file, 1, await sealPicture(shot, nk, note, 1, file));

  for (const p of [emil, sara, jonas]) {
    const row = await read(pg, p, note, file);
    assertEquals(row.epoch, 1);
    const pic = pictureOf(await open3("f", row.ct, nk, note, file));
    assertEquals([pic.mimeType, hex(pic.data)], ["image/png", hex(shot)]);
  }
  // Sealed: the server holds no picture bytes, and the row says who put it there.
  const [stored] = await pg.query<{ ct: string; author_id: string }>(`select ct, author_id from public.note_files`).then((r) => r.rows);
  assert(!stored.ct.includes(toBase64(shot).slice(4, 40)));
  assertEquals(stored.author_id, sara.id);
  // The file id is in the sealed context, as it is (it can mix cases): moved to another id, it doesn't open.
  await assertRejects(() => open3("f", stored.ct, nk, note, "pinto-shot01"));
  await assertRejects(() => open3("f", stored.ct, nk, note, "other"));

  // Eve, outside the note: nothing to read, nothing to write. Jonas can view: reads, can't write.
  assertEquals(await app(pg, eve.id, `select * from public.note_files`), []);
  await refused(put(pg, eve, note, "eve", 1, await sealPicture(png(), nk, note, 1, "eve")), "not in this note");
  await refused(put(pg, jonas, note, "jonas", 1, await sealPicture(png(), nk, note, 1, "jonas")), "view this note but not change it");
  // And nobody writes the table directly, around the function's rules.
  await refused(app(pg, sara.id, `insert into public.note_files (note_id, file_id, epoch, ct, author_id) values ($1, 'x', 1, $2, $3)`,
    [note, await sealPicture(png(), nk, note, 1, "x"), sara.id]), "permission denied");
  await refused(app(pg, sara.id, `update public.note_files set epoch = 2 where note_id = $1`, [note]), "permission denied");
  await refused(app(pg, sara.id, `delete from public.note_files where note_id = $1`, [note]), "permission denied");
  assertEquals((await pg.query(`select 1 from public.note_files`)).rows.length, 1);
});

Deno.test("one key at a time: an old key is refused, a picture there under this key stays as it is", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara");
  const { note, nk } = await board(pg, emil, [[sara, "editor"]]);
  const first = png();
  await put(pg, emil, note, "a", 1, await sealPicture(first, nk, note, 1, "a"));
  // The same id again under the same key (two people pasting the same picture, or a retry): kept.
  await put(pg, sara, note, "a", 1, await sealPicture(png(), nk, note, 1, "a"));
  const row = await read(pg, emil, note, "a");
  assertEquals(hex(pictureOf(await open3("f", row.ct, nk, note, "a")).data), hex(first));
  // A box sealed for another key than the one it's sent under isn't taken.
  await refused(put(pg, emil, note, "b", 1, await sealPicture(png(), nk, note, 2, "b")), "isn't sealed for this note's key");
  await refused(put(pg, emil, note, "b", 2, await sealPicture(png(), nk, note, 2, "b")), "key changed");
  await refused(put(pg, emil, note, "bad id!", 1, await sealPicture(png(), nk, note, 1, "bad id!")), "note_files_file_id_check");
});

Deno.test("a removal: the old key writes nothing, pictures are sealed again for whoever stays", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), ola = await person(pg, "Ola");
  const { note, nk } = await board(pg, emil, [[sara, "editor"], [ola, "editor"]]);
  const shot = png(200);
  await put(pg, sara, note, "shot", 1, await sealPicture(shot, nk, note, 1, "shot"));

  // Emil removes Sara: a new key for Emil and Ola.
  const nk2 = newDataKey();
  const wraps = await Promise.all([emil, ola].map(async (p) => ({
    user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note, epoch: 2, from: emil.id, to: p.id }),
  })));
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [note, sara.id, JSON.stringify(wraps)]);
  // Sara reads nothing now and writes nothing, with either key.
  assertEquals(await app(pg, sara.id, `select * from public.note_files`), []);
  await refused(put(pg, sara, note, "late", 1, await sealPicture(png(), nk, note, 1, "late")), "not in this note");
  // Ola's device, still on the old key, is told to open the note again.
  await refused(put(pg, ola, note, "olas", 1, await sealPicture(png(), nk, note, 1, "olas")), "key changed");

  // Until it's sealed again, the stored picture is under the old key; the owner's device seals it again.
  assertEquals((await read(pg, ola, note, "shot")).epoch, 1);
  const old = await read(pg, emil, note, "shot");
  const plain = await open3("f", old.ct, nk, note, "shot");
  await put(pg, emil, note, "shot", 2, await seal3("f", plain, nk2, note, 2, "shot"));
  const again = await read(pg, ola, note, "shot");
  assertEquals(again.epoch, 2);
  assertEquals(hex(pictureOf(await open3("f", again.ct, nk2, note, "shot")).data), hex(shot));
  // Sara's key opens none of what's stored now.
  await assertRejects(() => open3("f", again.ct, nk, note, "shot"));
  // And it was put there by Sara: sealing it again doesn't make it Emil's.
  assertEquals((await pg.query<{ author_id: string }>(`select author_id from public.note_files`)).rows[0].author_id, sara.id);
  // Sealing it again once more under the same key changes nothing.
  await put(pg, ola, note, "shot", 2, await sealPicture(png(), nk2, note, 2, "shot"));
  assertEquals(hex(pictureOf(await open3("f", (await read(pg, emil, note, "shot")).ct, nk2, note, "shot")).data), hex(shot));
});

Deno.test("a board's pictures have a limit, and go with the shared note", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara");
  const { note, nk } = await board(pg, emil, [[sara, "editor"]]);
  // One picture's box is at most 4 MB.
  await refused(put(pg, emil, note, "huge", 1, `amb3f.1.${"A".repeat(4 * 1024 * 1024)}`), "too big");
  // 32 MB of pictures on one board, then no more: seven of 4 MB less a little go in, the ninth doesn't.
  const big = (i: number) => `amb3f.1.${"A".repeat(4 * 1024 * 1024 - 64 - i * 4)}`;
  for (let i = 0; i < 8; i++) await put(pg, emil, note, `p${i}`, 1, big(i));
  await refused(put(pg, sara, note, "p8", 1, big(8)), "no room for more pictures");
  // Sealing one again under a new key isn't refused for room: it replaces itself.
  const nk2 = newDataKey();
  const wraps = await Promise.all([emil, sara].map(async (p) => ({
    user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note, epoch: 2, from: emil.id, to: p.id }),
  })));
  await app(pg, emil.id, `select public.collab_remove($1, null, 2, $2)`, [note, JSON.stringify(wraps)]);
  await put(pg, emil, note, "p0", 2, `amb3f.2.${"A".repeat(4 * 1024 * 1024 - 64)}`);
  assertEquals((await read(pg, emil, note, "p0")).epoch, 2);

  // The shared note goes (the owner stopped sharing, or started fresh): its pictures go with it.
  await pg.query(`delete from public.shared_notes where id = $1`, [note]);
  assertEquals((await pg.query(`select 1 from public.note_files`)).rows.length, 0);
  assertEquals(nk.length, 32);
});
