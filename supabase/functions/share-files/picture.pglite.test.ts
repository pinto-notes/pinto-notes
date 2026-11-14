// A shared whiteboard's picture (20261114210000_share_board_picture.sql) and how share-files serves
// it, on the whole schema in an in-process Postgres (PGlite). Needs no Docker or local stack:
//   deno test -A supabase/functions/share-files/picture.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { toBase64 } from "../_shared/e2ee.ts";
import { schemaDB, sqlFor } from "../mcp/pglite.ts";
import * as sealed from "../mcp/sealed.ts";
import { answer } from "./handler.ts";
import { picturePath } from "./logic.ts";

/** A 1×1 PNG with its header saying `w`×`h` (the server reads the size from the header). */
function png(w: number, h: number, pad = 0): Uint8Array {
  const one = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
  const out = new Uint8Array(one.length + pad);
  out.set(one);
  const v = new DataView(out.buffer);
  v.setUint32(16, w);
  v.setUint32(20, h);
  return out;
}

async function refused(p: Promise<unknown>, text: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, text);
}

/** A whiteboard shared by its owner, as the app shares one: the copy is its title and words. */
async function sharedBoard(pg: PGlite) {
  const a = await sealed.account(pg);
  const note = await sealed.note(pg, a, "Launch plan");
  const { slug } = await sealed.share(pg, a, note, { title: "Launch plan", body: "Launch plan\n\nIdea\n\nDraft\n\nShip it" });
  return { a, note, slug };
}

const publish = (pg: PGlite, me: string, slug: string, content: Uint8Array | null) =>
  sealed.app(pg, me, `select public.publish_share_picture($1, $2)`, [slug, content && toBase64(content)]);
const page = async (pg: PGlite, slug: string) => (await pg.query<any>(`select public.shared_note($1) as p`, [slug])).rows[0].p;
const get = (pg: PGlite, slug: string, query = "") => answer(sqlFor(pg), new URL(`http://x/functions/v1/share-files?slug=${slug}${query}`));

Deno.test("the owner publishes a board's picture, the page names it and share-files serves it", async () => {
  const pg = await schemaDB();
  const { a, slug } = await sharedBoard(pg);
  assertEquals((await page(pg, slug)).picture, null, "no picture until the device sends one");

  const picture = png(1800, 1000);
  await publish(pg, a.id, slug, picture);
  const p = await page(pg, slug);
  assertEquals([p.picture.width, p.picture.height], [1800, 1000]);
  assert(Number.isInteger(p.picture.version) && p.picture.version > 0, JSON.stringify(p.picture));
  assertEquals(p.body, "Launch plan\n\nIdea\n\nDraft\n\nShip it", "the words stay the page's text");

  const res = await get(pg, slug, `&picture=${p.picture.version}`);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "image/png");
  assertEquals(res.headers.get("content-length"), String(picture.length));
  assertEquals(res.headers.get("x-content-type-options"), "nosniff");
  assertEquals(res.headers.get("cache-control"), "private, max-age=60");
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assert(res.headers.get("content-disposition")!.startsWith('inline; filename="whiteboard.png"'));
  assertEquals(new Uint8Array(await res.arrayBuffer()), picture);
  assertEquals(picturePath(slug, p.picture.version), `/functions/v1/share-files?slug=${slug}&picture=${p.picture.version}`);

  // A new picture replaces it, under a new version; the copy written again keeps it.
  await new Promise((r) => setTimeout(r, 5));
  await publish(pg, a.id, slug, png(900, 500));
  const q = await page(pg, slug);
  assertEquals([q.picture.width, q.picture.height], [900, 500]);
  assert(q.picture.version > p.picture.version);
  await sealed.app(pg, a.id, `select public.publish_share($1, $2, $3)`, [(await pg.query<any>(`select note_id from public.note_shares where slug = $1`, [slug])).rows[0].note_id, slug,
    JSON.stringify({ title: "Launch plan", body: "Launch plan\n\nIdea", pages: [], files: [] })]);
  assertEquals((await page(pg, slug)).picture?.width, 900);
  // Nothing drawn: the page has no picture.
  await publish(pg, a.id, slug, null);
  assertEquals((await page(pg, slug)).picture, null);
  assertEquals((await get(pg, slug, "&picture=1")).status, 404);
});

Deno.test("only the link's owner publishes, signed in, a PNG of at most 4 MB, at the write rate", async () => {
  const pg = await schemaDB();
  const { a, slug } = await sharedBoard(pg);
  const b = await sealed.account(pg);
  await refused(publish(pg, b.id, slug, png(10, 10)), "isn't shared");
  await refused(publish(pg, a.id, "x".repeat(24), png(10, 10)), "isn't shared");
  const as = (role: string) => pg.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query(`select public.publish_share_picture($1, $2)`, [slug, toBase64(png(10, 10))]);
  });
  await refused(as("anon"), "permission denied");
  await refused(as("authenticated"), "not signed in");
  await refused(publish(pg, a.id, slug, new TextEncoder().encode("<svg onload=alert(1)>")), "is a PNG");
  await refused(publish(pg, a.id, slug, png(0, 10)), "is a PNG");
  await refused(publish(pg, a.id, slug, png(40000, 10)), "is a PNG");
  await refused(publish(pg, a.id, slug, png(4000, 4000, 4 * 1024 * 1024)), "too big");
  await publish(pg, a.id, slug, png(4000, 4000, 4 * 1024 * 1024 - 200));
  assertEquals((await page(pg, slug)).picture.width, 4000, "just under the limit is taken");
  // Nobody reads the table or the function that serves it but share-files.
  for (const who of [a.id, b.id]) {
    await refused(sealed.app(pg, who, `select * from public.note_share_pictures`), "permission denied");
    await refused(sealed.app(pg, who, `select * from public.shared_picture($1)`, [slug]), "permission denied");
  }
  // The write rate: an account out of writes is refused.
  await pg.query(`update public.pane_rate set tokens = -1000, at = clock_timestamp() where user_id = $1 and bucket = 'write'`, [a.id]);
  await refused(publish(pg, a.id, slug, png(10, 10)), "Too many changes");
});

Deno.test("stopping the link, or locking, trashing or deleting the board, takes its picture down", async () => {
  const cases: [string, (pg: PGlite, a: sealed.Account, note: string) => Promise<unknown>][] = [
    ["stopped", (pg, a, note) => sealed.app(pg, a.id, `select public.unshare_note($1)`, [note])],
    ["reported", (pg, _a, note) => pg.query(`update public.note_shares set revoked_at = now() where note_id = $1`, [note])],
    ["locked", async (pg, a, note) => {
      const lockKey = await sealed.notesPassword(pg, a);
      return sealed.app(pg, a.id, `update public.notes set locked_body = $2, body_ct = null where id = $1`, [note, `amb2.${lockKey}.${toBase64(crypto.getRandomValues(new Uint8Array(48)))}`]);
    }],
    ["trashed", (pg, a, note) => sealed.app(pg, a.id, `update public.notes set trashed_at = now() where id = $1`, [note])],
    ["deleted", (pg, a, note) => sealed.app(pg, a.id, `update public.notes set deleted_at = now() where id = $1`, [note])],
  ];
  for (const [what, change] of cases) {
    const pg = await schemaDB();
    const { a, note, slug } = await sharedBoard(pg);
    // Another board's picture stays.
    const other = await sealed.note(pg, a, "Roadmap");
    const { slug: otherSlug } = await sealed.share(pg, a, other, { title: "Roadmap", body: "Roadmap" });
    await publish(pg, a.id, slug, png(20, 10));
    await publish(pg, a.id, otherSlug, png(30, 10));
    const version = (await page(pg, slug)).picture.version;
    await change(pg, a, note);
    assertEquals((await pg.query(`select 1 from public.note_share_pictures where slug = $1`, [slug])).rows.length, 0, what);
    assertEquals((await pg.query(`select 1 from public.note_share_pictures where slug = $1`, [otherSlug])).rows.length, 1, `${what}: not another link's`);
    assertEquals((await get(pg, slug, `&picture=${version}`)).status, 404, what);
    if (what === "trashed") {
      // Back from the trash: the device publishes it again; until then the page shows no picture.
      await sealed.app(pg, a.id, `update public.notes set trashed_at = null where id = $1`, [note]);
      await sealed.app(pg, a.id, `select public.publish_share($1, $2, $3)`, [note, slug, JSON.stringify({ title: "Launch plan", body: "Launch plan", pages: [], files: [] })]);
      assertEquals((await page(pg, slug)).picture, null);
      await publish(pg, a.id, slug, png(20, 10));
      assertEquals((await page(pg, slug)).picture.width, 20);
    } else if (what !== "deleted" && what !== "locked") {
      // A stopped link takes no picture again.
      await refused(publish(pg, a.id, slug, png(20, 10)), "isn't shared");
    }
  }
});

Deno.test("share-files asks for the picture only on the page's own address", async () => {
  const pg = await schemaDB();
  const { a, slug } = await sharedBoard(pg);
  await publish(pg, a.id, slug, png(20, 10));
  for (const q of ["&picture=", "&picture=abc", "&picture=1&file=3f1c2b9a-1b7e-4c3a-9f0e-2a4b8c1d7e55", "&picture=1&sub=3f1c2b9a-1b7e-4c3a-9f0e-2a4b8c1d7e55", `&picture=${"9".repeat(21)}`]) {
    assertEquals((await get(pg, slug, q)).status, 404, q);
  }
  assertEquals((await get(pg, "short", "&picture=1")).status, 404);
  assertEquals((await get(pg, "y".repeat(24), "&picture=1")).status, 404, "a link that isn't there");
  // Any version gets the current picture (the version only makes a new picture a new address).
  assertEquals((await get(pg, slug, "&picture=1")).status, 200);
  // The page's file list is as before.
  const list = await get(pg, slug);
  assertEquals([list.status, await list.json()], [200, { files: {} }]);
});
