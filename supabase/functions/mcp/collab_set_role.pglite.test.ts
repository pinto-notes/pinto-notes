// The owner changes someone's role after they joined (20261118110000_collab_set_role.sql): only the
// owner, never their own row, only to Can edit or Can view, and the next change from someone made a
// viewer is refused as read-only while someone made an editor can send.
//   cd supabase/functions/mcp && deno test -A collab_set_role.pglite.test.ts
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
  const id = await note(pg, emil.a, "Offsite plan\n\nThis note is shared.\n");
  const nk = newDataKey();
  const toSelf = await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id });
  const head = await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk, id, 1);
  await app(pg, emil.id, `select public.collab_share($1, $2, $3, $4)`, [id, toSelf, await selfWrap(emil, nk, id, 1), head]);
  for (const [p, role] of [[sara, "editor"], [jonas, "viewer"]] as const) {
    const wrap = await sealNoteKey(nk, emil.identity, p.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: p.id });
    await app(pg, emil.id, `select public.collab_invite($1, $2, $3, $4, 1)`, [id, p.id, role, wrap]);
    await app(pg, p.id, `select public.collab_accept($1, $2)`, [id, await selfWrap(p, nk, id, 1)]);
  }
  return { emil, sara, jonas, ola, id, nk };
}

async function push(pg: PGlite, me: Person, note: string, nk: Bytes, change: string): Promise<number> {
  const ct = await seal3("u", bytes(change), nk, note, 1, me.id);
  const [r] = await app(pg, me.id, `insert into public.note_updates (note_id, epoch, ct) values ($1, 1, $2) returning id`, [note, ct]);
  return Number(r.id);
}

const setRole = (pg: PGlite, as: Person, note: string, user: string, role: string | null) =>
  app(pg, as.id, `select public.collab_set_role($1, $2, $3)`, [note, user, role]);

/** Everyone's role, as the server keeps it. */
async function roles(pg: PGlite, note: string): Promise<Record<string, string>> {
  const rows = (await pg.query<{ display_name: string; role: string }>(
    `select p.display_name, m.role from public.note_members m join public.profiles p on p.user_id = m.user_id where m.note_id = $1`, [note])).rows;
  return Object.fromEntries(rows.map((r) => [r.display_name, r.role]));
}

Deno.test("the owner makes an editor a viewer and a viewer an editor", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, id } = await shared(pg);
  await setRole(pg, emil, id, sara.id, "viewer");
  await setRole(pg, emil, id, jonas.id, "editor");
  assertEquals(await roles(pg, id), { Emil: "owner", Sara: "viewer", Jonas: "editor" });
  // What everyone in the note reads (People) says so too.
  const members = await app(pg, jonas.id, `select user_id, role from public.collab_members($1)`, [id]);
  assertEquals(members.find((m: { user_id: string }) => m.user_id === sara.id)?.role, "viewer");
  // Choosing the role they already have changes nothing and isn't refused.
  await setRole(pg, emil, id, sara.id, "viewer");
  assertEquals((await roles(pg, id)).Sara, "viewer");
});

Deno.test("only the owner changes roles", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, ola, id } = await shared(pg);
  // An editor can't promote a viewer, nor themselves, nor demote the owner.
  await refused(setRole(pg, sara, id, jonas.id, "editor"), "Only the owner");
  await refused(setRole(pg, jonas, id, jonas.id, "editor"), "Only the owner");
  await refused(setRole(pg, sara, id, emil.id, "viewer"), "Only the owner");
  // Someone outside the note can't either.
  await refused(setRole(pg, ola, id, sara.id, "viewer"), "Only the owner");
  assertEquals(await roles(pg, id), { Emil: "owner", Sara: "editor", Jonas: "viewer" });
  // Nor can anyone signed out: the function isn't theirs to call.
  await refused(pg.transaction(async (tx) => {
    await tx.exec(`set local role anon`);
    await tx.query(`select public.collab_set_role($1, $2, 'viewer')`, [id, sara.id]);
  }), "permission denied for function collab_set_role");
});

Deno.test("the owner's own row never changes, nobody becomes an owner, and only people in the note", async () => {
  const pg = await schemaDB();
  const { emil, sara, ola, id } = await shared(pg);
  await refused(setRole(pg, emil, id, emil.id, "viewer"), "own role");
  await refused(setRole(pg, emil, id, emil.id, "editor"), "own role");
  await refused(setRole(pg, emil, id, sara.id, "owner"), "Unknown role");
  await refused(setRole(pg, emil, id, sara.id, "admin"), "Unknown role");
  await refused(setRole(pg, emil, id, sara.id, null), "Unknown role");
  // Someone who isn't in the note isn't added by it.
  await refused(setRole(pg, emil, id, ola.id, "editor"), "not in this note");
  assertEquals(await roles(pg, id), { Emil: "owner", Sara: "editor", Jonas: "viewer" });
  // And an owner can't reach into a note that isn't theirs: Sara's own note, with Emil not in it.
  const hers = await note(pg, sara.a, "Hers\n");
  await refused(setRole(pg, emil, hers, sara.id, "viewer"), "Only the owner");
});

Deno.test("someone made a viewer has their next change refused as read-only; made an editor again, they can send", async () => {
  const pg = await schemaDB();
  const { emil, sara, jonas, id, nk } = await shared(pg);
  await push(pg, sara, id, nk, "venue");
  await setRole(pg, emil, id, sara.id, "viewer");
  await refused(push(pg, sara, id, nk, "dates"), "view this note but not change it");
  const e = await assertRejects(() => push(pg, sara, id, nk, "dates"));
  assertEquals((e as { hint?: string }).hint, "read_only", "the app reads this as Collab.Failure.readOnly");
  // Her title and page writes are refused too: the policy asks the same role.
  const head = await seal3("h", bytes(JSON.stringify({ title: "Hers now" })), nk, id, 1);
  await app(pg, sara.id, `update public.shared_notes set head_ct = $2 where id = $1`, [id, head]);
  const [{ head_ct }] = (await pg.query<{ head_ct: string }>(`select head_ct from public.shared_notes where id = $1`, [id])).rows;
  assertEquals(head_ct === head, false, "a viewer's title write changes nothing");
  // A viewer made an editor sends at once.
  await refused(push(pg, jonas, id, nk, "agenda"), "view this note but not change it");
  await setRole(pg, emil, id, jonas.id, "editor");
  const u = await push(pg, jonas, id, nk, "agenda");
  const [{ author_id }] = (await pg.query<{ author_id: string }>(`select author_id from public.note_updates where id = $1`, [u])).rows;
  assertEquals(author_id, jonas.id);
  // And Sara again, made an editor.
  await setRole(pg, emil, id, sara.id, "editor");
  await push(pg, sara, id, nk, "dates");
});
