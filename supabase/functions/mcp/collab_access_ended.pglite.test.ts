// Why access to a shared note ended (20261112120000_collab_access_ended.sql): removed by the owner,
// the owner stopped sharing, or you left. The member's device asks collab_access_ended to say which.
//   cd supabase/functions/mcp && deno test -A collab_access_ended.pglite.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { asUser, newUser, schemaDB } from "./pglite.ts";
import { aesKey, keyIdOf, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import { bytes, identityContext, newIdentity, noteKeyContext, openNoteKey, seal3, sealNoteKey } from "../_shared/collab.ts";

const app = (pg: PGlite, me: string, sql: string, params: unknown[] = []) => asUser<any>(pg, me, sql, params);

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

async function share(pg: PGlite, owner: Person) {
  const note = crypto.randomUUID(), nk = newDataKey();
  const toSelf = await sealNoteKey(nk, owner.identity, owner.identity.publicRaw, { note, epoch: 1, from: owner.id, to: owner.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Groceries" })), nk, note, 1);
  await app(pg, owner.id, `select public.collab_share($1, $2, $3, $4)`, [note, toSelf, await selfWrap(owner, nk, note, 1), head]);
  return { note, nk };
}

/** The owner invites someone, who accepts: they're in the note. */
async function add(pg: PGlite, owner: Person, who: Person, note: string, nk: Uint8Array<ArrayBuffer>, epoch = 1) {
  const wrap = await sealNoteKey(nk, owner.identity, who.identity.publicRaw, { note, epoch, from: owner.id, to: who.id });
  await app(pg, owner.id, `select public.collab_invite($1, $2, 'editor', $3, $4)`, [note, who.id, wrap, epoch]);
  const [row] = await app(pg, who.id, `select * from public.note_members where note_id = $1 and user_id = $2`, [note, who.id]);
  const opened = await openNoteKey(row.key_wrap, who.identity, owner.identity.publicRaw, { note, epoch, from: owner.id, to: who.id });
  await app(pg, who.id, `select public.collab_accept($1, $2)`, [note, await selfWrap(who, opened, note, epoch)]);
}

const ended = async (pg: PGlite, me: Person, note: string) =>
  (await app(pg, me.id, `select reason, by_name from public.collab_access_ended($1)`, [note])).map((r: any) => ({ reason: r.reason, by: r.by_name }));

Deno.test("removed by the owner: the reason and the owner's name, only for the one removed", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas");
  const { note, nk } = await share(pg, emil);
  await add(pg, emil, sara, note, nk);
  await add(pg, emil, jonas, note, nk);
  assertEquals(await ended(pg, sara, note), [], "nothing while you're in the note");

  const nk2 = newDataKey();
  const wraps = [emil, jonas].map(async (p) => ({ user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note, epoch: 2, from: emil.id, to: p.id }) }));
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [note, sara.id, JSON.stringify(await Promise.all(wraps))]);
  assertEquals(await ended(pg, sara, note), [{ reason: "removed", by: "Emil" }]);
  assertEquals(await ended(pg, jonas, note), [], "someone still in it isn't told anything");
  assertEquals(await app(pg, sara.id, `select * from public.note_access_ended`).catch(() => "refused"), "refused", "the table itself isn't readable");
});

Deno.test("you left: the reason says so, so your other devices don't tell you that you lost it", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara");
  const { note, nk } = await share(pg, emil);
  await add(pg, emil, sara, note, nk);
  await app(pg, sara.id, `select public.collab_leave($1)`, [note]);
  assertEquals(await ended(pg, sara, note), [{ reason: "left", by: null }]);
});

Deno.test("the owner stopped sharing (or deleted the note): everyone in it hears unshared, from them", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas");
  const { note, nk } = await share(pg, emil);
  await add(pg, emil, sara, note, nk);
  await add(pg, emil, jonas, note, nk);
  const body = await seal("Groceries", await aesKey(emil.dk), emil.keyId, `body:${note}`);
  await app(pg, emil.id, `select public.collab_unshare($1, $2, $3, $4)`, [note, body, body, 9_000_000_000]);
  assertEquals(await ended(pg, sara, note), [{ reason: "unshared", by: "Emil" }]);
  assertEquals(await ended(pg, jonas, note), [{ reason: "unshared", by: "Emil" }]);
  assertEquals(await ended(pg, emil, note), [], "the owner has nothing to be told");
});

Deno.test("joining again clears the old reason; a new removal writes a new one", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara");
  const { note, nk } = await share(pg, emil);
  await add(pg, emil, sara, note, nk);
  await app(pg, sara.id, `select public.collab_leave($1)`, [note]);
  await add(pg, emil, sara, note, nk);
  assertEquals(await ended(pg, sara, note), []);
  assertEquals((await pg.query(`select * from public.note_access_ended`)).rows.length, 0);
  const nk2 = newDataKey();
  const wraps = [{ user_id: emil.id, key_wrap: await sealNoteKey(nk2, emil.identity, emil.identity.publicRaw, { note, epoch: 2, from: emil.id, to: emil.id }) }];
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [note, sara.id, JSON.stringify(wraps)]);
  assertEquals(await ended(pg, sara, note), [{ reason: "removed", by: "Emil" }]);
});

Deno.test("account deletion: the deleted member's rows go; an owner's deletion leaves unshared with no name", async () => {
  const pg = await schemaDB();
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas");
  const { note, nk } = await share(pg, emil);
  await add(pg, emil, sara, note, nk);
  await add(pg, emil, jonas, note, nk);
  // Sara deletes her account (forget.ts deletes the auth row): nothing is kept for her.
  await pg.query(`delete from auth.users where id = $1`, [sara.id]);
  assertEquals((await pg.query(`select * from public.note_access_ended where user_id = $1`, [sara.id])).rows.length, 0);
  // Emil deletes his: the note goes for Jonas, who's told it stopped being shared.
  await pg.query(`delete from auth.users where id = $1`, [emil.id]);
  assertEquals(await ended(pg, jonas, note), [{ reason: "unshared", by: null }]);

});
