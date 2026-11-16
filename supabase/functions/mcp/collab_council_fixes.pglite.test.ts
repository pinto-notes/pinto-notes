// Shared-note fixes from the 1.4 review council (20261116130000_collab_council_fixes.sql):
// stopping sharing sees changes already in a snapshot, a compacted note can be re-sealed under a new
// key, making a link again renews it, and the owner deleting the note for good (from any app,
// 1.3 included) ends the sharing.
//   cd supabase/functions/mcp && deno test -A collab_council_fixes.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, APP, app, note } from "./sealed.ts";
import { aesKey, type Bytes, hex, keyIdOf, newDataKey, seal, toBase64 } from "../_shared/e2ee.ts";
import { bytes, identityContext, linkKeys, newIdentity, noteKeyContext, seal3, sealNoteKey } from "../_shared/collab.ts";
import { asUser } from "./pglite.ts";

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

/** Emil shares his note with Sara and Jonas (editors). His row is the pointer, with the note's id;
 *  theirs have ids of their own. */
async function shared(pg: PGlite) {
  const emil = await person(pg, "Emil"), sara = await person(pg, "Sara"), jonas = await person(pg, "Jonas");
  const id = await note(pg, emil.a, "Offsite plan\n\nThis note is shared.\n");
  const nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk, id, 1);
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [id, toSelf, await selfWrap(emil, nk, id, 1), head]);
  await pg.query(`update public.notes set shared_note_id = $1 where id = $1`, [id]);
  const pointers: Record<string, string> = {};
  for (const p of [sara, jonas]) {
    const wrap = await sealNoteKey(nk, emil.identity, p.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: p.id });
    await app(pg, emil.id, `select public.collab_invite($1, $2, 'editor', $3, 1)`, [id, p.id, wrap]);
    await app(pg, p.id, `select public.collab_accept($1, $2)`, [id, await selfWrap(p, nk, id, 1)]);
    pointers[p.id] = await note(pg, p.a, "Offsite plan\n\nThis note is shared.\n");
    await pg.query(`update public.notes set shared_note_id = $2 where id = $1`, [pointers[p.id], id]);
  }
  return { emil, sara, jonas, id, nk, pointers };
}

async function push(pg: PGlite, me: Person, note: string, nk: Bytes, epoch: number, change: string): Promise<number> {
  const ct = await seal3("u", bytes(change), nk, note, epoch, me.id);
  const [r] = await app(pg, me.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, $2, $3) returning id`, [note, epoch, ct]);
  return Number(r.id);
}

async function snapshot(pg: PGlite, me: Person, note: string, nk: Bytes, epoch: number, upto: number) {
  const ct = await seal3("s", bytes(`doc up to ${upto}`), nk, note, epoch, String(upto));
  await app(pg, me.id, `insert into public.note_snapshots (note_id, upto, epoch, ct) values ($1, $2, $3, $4)`, [note, upto, epoch, ct]);
}

const count = async (pg: PGlite, sql: string, params: unknown[]) => (await pg.query(sql, params)).rows.length;

Deno.test("stopping sharing is refused when a newer change is already in a snapshot", async () => {
  const pg = await schemaDB();
  const { emil, sara, id, nk } = await shared(pg);
  const u1 = await push(pg, emil, id, nk, 1, "venue");
  // Emil's device pulled through u1. Then Sara types and her device snapshots: u2's row is compacted away.
  const u2 = await push(pg, sara, id, nk, 1, "dates");
  await snapshot(pg, sara, id, nk, 1, u2);
  assertEquals(await count(pg, `select 1 from public.note_updates where note_id = $1`, [id]), 0);
  const body = await emil.a.vault.sealBody(id, "Offsite plan\n\nvenue\n");
  const head = await emil.a.vault.sealHead(id, { title: "Offsite plan", preview: "venue" });
  await refused(app(pg, emil.id, `select public.collab_unshare($1, $2, $3, $4)`, [id, body, head, u1]), "changed meanwhile");
  assertEquals(await count(pg, `select 1 from public.note_snapshots where note_id = $1`, [id]), 1, "Sara's edit is still there");
  // Loaded again, through the snapshot: now it stops.
  await app(pg, emil.id, `select public.collab_unshare($1, $2, $3, $4)`, [id, body, head, u2]);
  assertEquals(await count(pg, `select 1 from public.shared_notes where id = $1`, [id]), 0);
});

Deno.test("after compaction, removing someone re-seals the snapshot at the same point under the new key", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, id, nk } = await shared(pg);
  await push(pg, emil, id, nk, 1, "venue");
  const u2 = await push(pg, sara, id, nk, 1, "dates");
  await snapshot(pg, emil, id, nk, 1, u2);
  assertEquals(await count(pg, `select 1 from public.note_updates where note_id = $1`, [id]), 0);
  // Emil removes Jonas: a new key, epoch 2, and his device re-seals the document where it was.
  const nk2 = newDataKey();
  const wraps = await Promise.all([emil, sara].map(async (p) => ({ user_id: p.id, key_wrap: await sealNoteKey(nk2, emil.identity, p.identity.publicRaw, { note: id, epoch: 2, from: emil.id, to: p.id }) })));
  await app(pg, emil.id, `select public.collab_remove($1, $2, 2, $3)`, [id, jonas.id, JSON.stringify(wraps)]);
  await snapshot(pg, emil, id, nk2, 2, u2);
  const snaps = (await pg.query<{ upto: string; epoch: number }>(`select upto, epoch from public.note_snapshots where note_id = $1 order by epoch`, [id])).rows;
  assertEquals(snaps.map((s) => [Number(s.upto), s.epoch]), [[u2, 1], [u2, 2]]);
  // Still nothing past the newest change.
  await refused(snapshot(pg, emil, id, nk2, 2, u2 + 1), "doesn't have");
});

Deno.test("making the link again gives it another 7 days, so a link shared after a week still works", async () => {
  const pg = await schemaDB();
  const { emil, sara, id, nk } = await shared(pg);
  const link = "Cd".repeat(11), secret = crypto.getRandomValues(new Uint8Array(16));
  const { answer, key } = await linkKeys(secret, link);
  const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(answer.match(/../g)!, (h) => parseInt(h, 16)))));
  const wrap = await seal(toBase64(nk), key, await keyIdOf(nk), `invite:${link}`);
  const make = (role: string) => app(pg, emil.id, `select public.collab_create_link($1, $2, $3, 1, $4, $5)`, [link, id, role, answerHash, wrap]);
  const opens = () => app(pg, sara.id, `select * from public.collab_open_link($1, $2)`, [link, answer]);
  await make("editor");
  await opens();
  // A week on.
  await pg.query(`update public.note_invite_links set expires_at = now() - interval '1 minute' where id = $1`, [link]);
  await refused(opens(), "expired");
  await make("editor");
  assertEquals((await opens()).length, 1);
  // Changing its access renews it too.
  await pg.query(`update public.note_invite_links set expires_at = now() - interval '1 minute' where id = $1`, [link]);
  await make("viewer");
  const [{ role }] = await opens();
  assertEquals(role, "viewer");
  const [{ days }] = (await pg.query<{ days: number }>(`select extract(epoch from expires_at - now()) / 86400 as days from public.note_invite_links where id = $1`, [link])).rows;
  assert(days > 6.9 && days <= 7, String(days));
});

/** What Pinto Notes 1.3 sends when a note is deleted for good (Library.purge): the row emptied and
 *  deleted_at set, from an app that doesn't say shared/1 and never calls collab_unshare. */
async function purgeAs13(pg: PGlite, a: Account, id: string) {
  await asUser(pg, a.id, `update public.notes set deleted_at = now(), body_ct = $2, head_ct = $3, locked_body = null, updated_at = now() where id = $1`,
    [id, await a.vault.sealBody(id, ""), await a.vault.sealHead(id, { title: "", preview: "" })], APP);
}

const ended = async (pg: PGlite, p: Person, note: string) =>
  (await app(pg, p.id, `select reason, by_name from public.collab_access_ended($1)`, [note])).map((r: any) => [r.reason, r.by_name]);

Deno.test("the owner deleting the note for good on 1.3 ends the sharing for everyone", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, id, nk, pointers } = await shared(pg);
  await push(pg, sara, id, nk, 1, "venue");
  // Moved to Recently Deleted: still shared (1.3 doesn't stop sharing there, and 1.4 does it itself).
  await asUser(pg, emil.id, `update public.notes set trashed_at = now() where id = $1`, [id], APP);
  assertEquals(await count(pg, `select 1 from public.shared_notes where id = $1`, [id]), 1);
  assertEquals(await count(pg, `select 1 from public.note_members where note_id = $1`, [id]), 3);

  await purgeAs13(pg, emil.a, id);
  assertEquals(await count(pg, `select 1 from public.shared_notes where id = $1`, [id]), 0);
  assertEquals(await count(pg, `select 1 from public.note_members where note_id = $1`, [id]), 0);
  assertEquals(await count(pg, `select 1 from public.note_updates where note_id = $1`, [id]), 0);
  for (const p of [sara, jonas]) {
    assertEquals(await ended(pg, p, id), [["unshared", "Emil"]]);
    const [row] = (await pg.query<{ deleted_at: Date | null }>(`select deleted_at from public.notes where id = $1`, [pointers[p.id]])).rows;
    assert(row.deleted_at, "their pointer goes too");
  }
  await refused(push(pg, sara, id, nk, 1, "after"), "");
});

Deno.test("the owner's row going (the server's 30-day purge, or the row itself deleted) ends the sharing", async () => {
  const pg = await schemaDB();
  const one = await shared(pg);
  await pg.query(`update public.notes set trashed_at = now() - interval '31 days' where id = $1`, [one.id]);
  await pg.query(`update public.notes set deleted_at = now(), body_ct = null, head_ct = null where id = $1`, [one.id]);
  assertEquals(await count(pg, `select 1 from public.shared_notes where id = $1`, [one.id]), 0);
  assertEquals(await ended(pg, one.sara, one.id), [["unshared", null]]);

  const two = await shared(pg);
  await pg.query(`delete from public.notes where id = $1`, [two.id]);
  assertEquals(await count(pg, `select 1 from public.shared_notes where id = $1`, [two.id]), 0);
  assertEquals(await count(pg, `select 1 from public.note_members where note_id = $1`, [two.id]), 0);
});

Deno.test("a member deleting their pointer for good, or the owner's collab_unshare, doesn't end it twice", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, id, nk, pointers } = await shared(pg);
  await purgeAs13(pg, sara.a, pointers[sara.id]);
  assertEquals(await count(pg, `select 1 from public.shared_notes where id = $1`, [id]), 1, "Emil and Jonas keep it");
  await push(pg, jonas, id, nk, 1, "still here");
  // The owner stops sharing on 1.4: his row is his note again, live, and nothing else fires.
  const body = await emil.a.vault.sealBody(id, "Offsite plan\n\nstill here\n");
  const head = await emil.a.vault.sealHead(id, { title: "Offsite plan", preview: "still here" });
  await app(pg, emil.id, `select public.collab_unshare($1, $2, $3, $4)`, [id, body, head, 9_000_000_000]);
  const [own] = (await pg.query<{ deleted_at: Date | null; shared_note_id: string | null }>(`select deleted_at, shared_note_id from public.notes where id = $1`, [id])).rows;
  assertEquals([own.deleted_at, own.shared_note_id], [null, null]);
  // Deleting that ordinary note later touches nothing shared.
  await purgeAs13(pg, emil.a, id);
});
