// Files and photos in shared notes (20261118130000_shared_note_files.sql): every member reads the
// sealed file keys and the bytes, an owner or editor adds them, a viewer or someone outside the note
// can't, a key is added only under the note's current key, a new key is followed by the owner
// sealing every file key again, and stopping sharing takes the rows with it.
//   cd supabase/functions/mcp && deno test -A shared_note_files.pglite.test.ts
import { assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { account, app, note } from "./sealed.ts";
import { aesKey, type Bytes, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import { bytes, identityContext, newIdentity, noteKeyContext, seal3, sealNoteKey } from "../_shared/collab.ts";

async function refused(p: Promise<unknown>, what: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, what);
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
const selfWrap = async (p: Person, nk: Bytes, id: string, epoch: number) => await seal(toBase64(nk), await aesKey(p.a.dk), p.a.keyId, noteKeyContext(id, epoch));

/** Emil shares his note with Sara (an editor) and Jonas (a viewer); Ola isn't in it. */
async function shared(pg: PGlite) {
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas"), ola = await person(pg, "Ola");
  const id = await note(pg, emil.a, "Lasagne\n\nThis note is shared.\n");
  const nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Lasagne" })), nk, id, 1);
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [id, toSelf, await selfWrap(emil, nk, id, 1), head]);
  for (const [p, role] of [[sara, "editor"], [jonas, "viewer"]] as const) {
    const wrap = await sealNoteKey(nk, emil.identity, p.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: p.id });
    await app(pg, emil.id, `select public.collab_invite($1, $2, $3, $4, 1)`, [id, p.id, role, wrap]);
    await app(pg, p.id, `select public.collab_accept($1, $2)`, [id, await selfWrap(p, nk, id, 1)]);
  }
  return { emil, sara, jonas, ola, id, nk };
}

/** A sealed file key as the app makes it (the server only checks its shape and epoch). */
const keyCt = (epoch: number) => `amb3x.${epoch}.${toBase64(crypto.getRandomValues(new Uint8Array(120)))}`;

const addFile = (pg: PGlite, as: Person, note: string, file: string, epoch = 1, ct = keyCt(epoch)) =>
  app(pg, as.id, `insert into public.shared_note_files (note_id, id, blob, epoch, key_ct) values ($1, $2, $3, $4, $5) returning added_by`,
    [note, file, crypto.randomUUID(), epoch, ct]);

const files = (pg: PGlite, as: Person, note: string) =>
  app(pg, as.id, `select id, epoch, added_by from public.shared_note_files where note_id = $1 order by created_at`, [note]);

/** Storage as Supabase runs it: row level security on, the app's role granted. */
async function storageOn(pg: PGlite) {
  await pg.exec(`alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;`);
}

const upload = (pg: PGlite, as: Person, name: string, size = 1000) =>
  app(pg, as.id, `insert into storage.objects (bucket_id, name, owner_id, metadata) values ('files', $1, $2, $3)`,
    [name, as.id, JSON.stringify({ size })]);

const visible = async (pg: PGlite, as: Person, name: string) =>
  (await app(pg, as.id, `select name from storage.objects where bucket_id = 'files' and name = $1`, [name])).length === 1;

Deno.test("an editor adds a file every member reads; a viewer and someone outside can't add one", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, ola, id } = await shared(pg);
  const photo = crypto.randomUUID();
  const [row] = await addFile(pg, sara, id, photo);
  assertEquals(row.added_by, sara.id, "the server says who added it");
  for (const p of [emil, sara, jonas]) assertEquals((await files(pg, p, id)).map((r) => r.id), [photo], `${p.name} sees it`);
  assertEquals(await files(pg, ola, id), [], "someone outside the note sees nothing");
  await refused(addFile(pg, jonas, id, crypto.randomUUID()), "");
  await refused(addFile(pg, ola, id, crypto.randomUUID()), "");
  // The same file twice in one note: the first stays.
  await refused(addFile(pg, emil, id, photo), "duplicate");
});

Deno.test("a file key goes in only under the note's current key, and is sealed again under a new one", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, id } = await shared(pg);
  const photo = crypto.randomUUID();
  await addFile(pg, sara, id, photo);
  await refused(addFile(pg, sara, id, crypto.randomUUID(), 1, keyCt(2)), "epoch");
  // Emil removes Jonas: epoch 2.
  const nk2 = newDataKey();
  const wraps = await Promise.all([emil, sara].map(async (p) => ({ user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note: id, epoch: 2, from: emil.id, to: p.id }) })));
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [id, jonas.id, JSON.stringify(wraps)]);
  // Under the old key now: refused. Jonas sees nothing anymore.
  await refused(addFile(pg, sara, id, crypto.randomUUID(), 1), "key changed");
  assertEquals(await files(pg, jonas, id), []);
  // Emil seals the file key again under the new one; back to the old one is refused.
  await app(pg, emil.id, `update public.shared_note_files set epoch = 2, key_ct = $3 where note_id = $1 and id = $2`, [id, photo, keyCt(2)]);
  assertEquals((await files(pg, sara, id)).map((r) => r.epoch), [2]);
  await refused(app(pg, emil.id, `update public.shared_note_files set epoch = 1, key_ct = $3 where note_id = $1 and id = $2`, [id, photo, keyCt(1)]), "key changed");
  // Who added it and which bytes hold it never change.
  await refused(app(pg, emil.id, `update public.shared_note_files set blob = gen_random_uuid() where note_id = $1`, [id]), "permission denied");
  assertEquals((await files(pg, emil, id))[0].added_by, sara.id);
  await addFile(pg, sara, id, crypto.randomUUID(), 2);
});

Deno.test("the bytes: members read them, an owner or editor adds them in the owner's folder for the note", async () => {
  const pg = await schemaDB();
  await storageOn(pg);
  const { emil, sara, jonas, ola, id } = await shared(pg);
  const at = `${emil.id}/shared/${id}/${crypto.randomUUID()}`;
  await upload(pg, sara, at);
  for (const p of [emil, sara, jonas]) assertEquals(await visible(pg, p, at), true, `${p.name} reads it`);
  assertEquals(await visible(pg, ola, at), false, "someone outside the note doesn't");
  await upload(pg, emil, `${emil.id}/shared/${id}/${crypto.randomUUID()}`);
  await refused(upload(pg, jonas, `${emil.id}/shared/${id}/${crypto.randomUUID()}`), "row-level security");
  await refused(upload(pg, ola, `${emil.id}/shared/${id}/${crypto.randomUUID()}`), "row-level security");
  // Under Sara's own folder it's her own file (her own policies): nobody else in the note reads it.
  const own = `${sara.id}/shared/${id}/${crypto.randomUUID()}`;
  await upload(pg, sara, own);
  assertEquals(await visible(pg, emil, own), false);
  // Not that shape: refused.
  await refused(upload(pg, sara, `${emil.id}/shared/${id}/${crypto.randomUUID()}/x`), "row-level security");
  await refused(upload(pg, sara, `${emil.id}/${crypto.randomUUID()}`), "row-level security");
  // Sara's own files stay hers: Emil can't read them.
  const hers = `${sara.id}/${crypto.randomUUID()}`;
  await upload(pg, sara, hers);
  assertEquals(await visible(pg, emil, hers), false);
  // Someone removed reads nothing more.
  const nk2 = newDataKey();
  const wraps = await Promise.all([emil, sara].map(async (p) => ({ user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note: id, epoch: 2, from: emil.id, to: p.id }) })));
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [id, jonas.id, JSON.stringify(wraps)]);
  assertEquals(await visible(pg, jonas, at), false, "Jonas was removed");
});

Deno.test("an editor's upload counts toward the owner's storage, and is refused once it's full", async () => {
  const pg = await schemaDB();
  await storageOn(pg);
  const { emil, sara, id } = await shared(pg);
  const full = (await pg.query<{ n: string }>(`select public.pane_limit('files_bytes')::text as n`)).rows[0].n;
  await upload(pg, emil, `${emil.id}/${crypto.randomUUID()}`, Number(full));
  await refused(upload(pg, sara, `${emil.id}/shared/${id}/${crypto.randomUUID()}`), "row-level security");
});

Deno.test("stopping sharing takes the note's file rows; the owner deletes the folder", async () => {
  const pg = await schemaDB();
  await storageOn(pg);
  const { emil, sara, id } = await shared(pg);
  await addFile(pg, sara, id, crypto.randomUUID());
  const at = `${emil.id}/shared/${id}/${crypto.randomUUID()}`;
  await upload(pg, sara, at);
  const body = await emil.a.vault.sealBody(id, "Lasagne\n");
  const head = await emil.a.vault.sealHead(id, { title: "Lasagne", preview: "" });
  await app(pg, emil.id, `select public.collab_unshare($1, $2, $3, $4)`, [id, body, head, 0]);
  assertEquals((await pg.query(`select 1 from public.shared_note_files where note_id = $1`, [id])).rows.length, 0);
  assertEquals(await visible(pg, sara, at), false, "Sara reads nothing of it now");
  assertEquals(await visible(pg, emil, at), true, "the bytes are in Emil's folder");
  await app(pg, emil.id, `delete from storage.objects where name = $1`, [at]);
  assertEquals(await visible(pg, emil, at), false);
});
