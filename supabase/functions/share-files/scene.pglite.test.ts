// A shared whiteboard's scene, for its page's "Download .excalidraw" (whiteboard council, round 3;
// 20261114230000_share_board_scene.sql), and how share-files serves it, on the whole schema in an
// in-process Postgres (PGlite). Needs no Docker or local stack:
//   deno test -A supabase/functions/share-files/scene.pglite.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { toBase64 } from "../_shared/e2ee.ts";
import { schemaDB, sqlFor } from "../mcp/pglite.ts";
import * as sealed from "../mcp/sealed.ts";
import { answer } from "./handler.ts";
import { scenePath } from "./logic.ts";

/** An .excalidraw file as the app exports it, with these words on the board. */
const file = (words: string[], pad = "") => JSON.stringify({
  type: "excalidraw", version: 2, source: "https://pintonotes.com",
  elements: words.map((text, i) => ({ type: "text", id: `t${i}`, x: 0, y: i * 40, text })),
  appState: { viewBackgroundColor: "#ffffff" }, files: {}, pad,
});

/** A 1×1 PNG, for the picture beside it. */
const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

async function refused(p: Promise<unknown>, text: string) {
  const e = await assertRejects(() => p);
  assertStringIncludes((e as Error).message, text);
}

/** A whiteboard shared by its owner, as the app shares one: the copy is its title and words. */
async function sharedBoard(pg: PGlite, title = "Launch plan") {
  const a = await sealed.account(pg);
  const note = await sealed.note(pg, a, title);
  const { slug } = await sealed.share(pg, a, note, { title, body: `${title}\n\nIdea\n\nShip it` });
  return { a, note, slug };
}

const publish = (pg: PGlite, me: string, slug: string, content: string | null) =>
  sealed.app(pg, me, `select public.publish_share_scene($1, $2)`, [slug, content]);
const publishPicture = (pg: PGlite, me: string, slug: string, content: Uint8Array | null) =>
  sealed.app(pg, me, `select public.publish_share_picture($1, $2)`, [slug, content && toBase64(content)]);
const page = async (pg: PGlite, slug: string) => (await pg.query<any>(`select public.shared_note($1) as p`, [slug])).rows[0].p;
const get = (pg: PGlite, slug: string, query = "") => answer(sqlFor(pg), new URL(`http://x/functions/v1/share-files?slug=${slug}${query}`));
const rows = async (pg: PGlite, slug: string) => (await pg.query(`select 1 from public.note_share_scenes where slug = $1`, [slug])).rows.length;

Deno.test("the owner publishes a board's scene, the page names it and share-files serves it as <name>.excalidraw", async () => {
  const pg = await schemaDB();
  const { a, slug } = await sharedBoard(pg, "Q3: plan/roadmap");
  assertEquals((await page(pg, slug)).scene, null, "no scene until the device sends one");

  const scene = file(["Idea", "Café"]);
  await publish(pg, a.id, slug, scene);
  const p = await page(pg, slug);
  assertEquals(p.scene.size, new TextEncoder().encode(scene).length);
  assert(Number.isInteger(p.scene.version) && p.scene.version > 0, JSON.stringify(p.scene));
  assertEquals(p.picture, null, "the scene and the picture are each their own");

  const res = await get(pg, slug, `&scene=${p.scene.version}`);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(res.headers.get("content-length"), String(p.scene.size));
  assertEquals(res.headers.get("x-content-type-options"), "nosniff");
  assertEquals(res.headers.get("cache-control"), "private, max-age=60");
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assert(res.headers.get("content-disposition")!.startsWith('attachment; filename="Q3 planroadmap.excalidraw"'), res.headers.get("content-disposition")!);
  assertEquals(await res.text(), scene, "byte for byte as the app made it");
  assertEquals(scenePath(slug, p.scene.version), `/functions/v1/share-files?slug=${slug}&scene=${p.scene.version}`);

  // A new scene replaces it, under a new version; the copy and the picture written again keep it.
  await new Promise((r) => setTimeout(r, 5));
  await publish(pg, a.id, slug, file(["Idea", "Draft"]));
  const q = await page(pg, slug);
  assert(q.scene.version > p.scene.version);
  await publishPicture(pg, a.id, slug, png);
  await sealed.app(pg, a.id, `select public.publish_share($1, $2, $3)`, [(await pg.query<any>(`select note_id from public.note_shares where slug = $1`, [slug])).rows[0].note_id, slug,
    JSON.stringify({ title: "Q3: plan/roadmap", body: "Q3: plan/roadmap\n\nIdea", pages: [], files: [] })]);
  assertEquals((await page(pg, slug)).scene?.version, q.scene.version);
  assertStringIncludes(await (await get(pg, slug, "&scene=1")).text(), "Draft");
  // Nothing drawn: the page offers no file, and the picture is its own.
  await publish(pg, a.id, slug, null);
  assertEquals((await page(pg, slug)).scene, null);
  assertEquals((await get(pg, slug, "&scene=1")).status, 404);
  assert((await page(pg, slug)).picture !== null);
});

Deno.test("only the link's owner publishes, signed in, an Excalidraw file of at most 4 MB, at the write rate", async () => {
  const pg = await schemaDB();
  const { a, slug } = await sharedBoard(pg);
  const b = await sealed.account(pg);
  await refused(publish(pg, b.id, slug, file(["x"])), "isn't shared");
  await refused(publish(pg, a.id, "x".repeat(24), file(["x"])), "isn't shared");
  const as = (role: string) => pg.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query(`select public.publish_share_scene($1, $2)`, [slug, file(["x"])]);
  });
  await refused(as("anon"), "permission denied");
  await refused(as("authenticated"), "not signed in");
  // Only an Excalidraw file: JSON of type "excalidraw" with a list of elements.
  for (const bad of ["<svg onload=alert(1)>", "[]", `"excalidraw"`, `{"type":"other","elements":[]}`, `{"type":"excalidraw"}`, `{"type":"excalidraw","elements":{}}`]) {
    await refused(publish(pg, a.id, slug, bad), "is an Excalidraw file");
  }
  const limit = 4 * 1024 * 1024, base = file(["x"]).length;
  await refused(publish(pg, a.id, slug, file(["x"], "y".repeat(limit - base + 1))), "too big");
  await publish(pg, a.id, slug, file(["x"], "y".repeat(limit - base)));
  assertEquals((await page(pg, slug)).scene.size, limit, "just at the limit is taken");
  // Nobody reads the table or the function that serves it but share-files.
  for (const who of [a.id, b.id]) {
    await refused(sealed.app(pg, who, `select * from public.note_share_scenes`), "permission denied");
    await refused(sealed.app(pg, who, `select * from public.shared_scene($1)`, [slug]), "permission denied");
  }
  // The write rate: an account out of writes is refused.
  await pg.query(`update public.pane_rate set tokens = -1000, at = clock_timestamp() where user_id = $1 and bucket = 'write'`, [a.id]);
  await refused(publish(pg, a.id, slug, file(["x"])), "Too many changes");
});

Deno.test("stopping the link, or locking, trashing or deleting the board, takes its scene down", async () => {
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
    // Another board's scene stays.
    const other = await sealed.note(pg, a, "Roadmap");
    const { slug: otherSlug } = await sealed.share(pg, a, other, { title: "Roadmap", body: "Roadmap" });
    await publish(pg, a.id, slug, file(["Idea"]));
    await publishPicture(pg, a.id, slug, png);
    await publish(pg, a.id, otherSlug, file(["Later"]));
    await change(pg, a, note);
    assertEquals(await rows(pg, slug), 0, what);
    assertEquals((await pg.query(`select 1 from public.note_share_pictures where slug = $1`, [slug])).rows.length, 0, `${what}: the picture too`);
    assertEquals(await rows(pg, otherSlug), 1, `${what}: not another link's`);
    assertEquals((await get(pg, slug, "&scene=1")).status, 404, what);
    if (what === "trashed") {
      // Back from the trash: the device publishes it again; until then the page offers no file.
      await sealed.app(pg, a.id, `update public.notes set trashed_at = null where id = $1`, [note]);
      await sealed.app(pg, a.id, `select public.publish_share($1, $2, $3)`, [note, slug, JSON.stringify({ title: "Launch plan", body: "Launch plan", pages: [], files: [] })]);
      assertEquals((await page(pg, slug)).scene, null);
      await publish(pg, a.id, slug, file(["Idea"]));
      assertEquals((await get(pg, slug, "&scene=1")).status, 200);
    } else if (what !== "deleted" && what !== "locked") {
      // A stopped link takes no scene again.
      await refused(publish(pg, a.id, slug, file(["Idea"])), "isn't shared");
    }
  }
});

Deno.test("share-files gives the scene only on the page's own address, and a note's page has none", async () => {
  const pg = await schemaDB();
  const { a, slug } = await sharedBoard(pg);
  await publish(pg, a.id, slug, file(["Idea"]));
  for (const q of ["&scene=", "&scene=abc", "&scene=1&picture=1", "&scene=1&file=3f1c2b9a-1b7e-4c3a-9f0e-2a4b8c1d7e55", "&scene=1&sub=3f1c2b9a-1b7e-4c3a-9f0e-2a4b8c1d7e55"]) {
    assertEquals((await get(pg, slug, q)).status, 404, q);
  }
  assertEquals((await get(pg, "y".repeat(24), "&scene=1")).status, 404, "a link that isn't there");
  assertEquals((await get(pg, slug, "&scene=1")).status, 200, "any version gets the current scene");
  assertEquals((await get(pg, slug, "&picture=1")).status, 404, "a scene isn't a picture");
  // A note shared as a note: no scene in its answer.
  const note = await sealed.note(pg, a, "Trip");
  const { slug: noteSlug } = await sealed.share(pg, a, note, { title: "Trip", body: "Trip\n\nDay one" });
  assertEquals((await page(pg, noteSlug)).scene, null);
  assertEquals((await get(pg, noteSlug, "&scene=1")).status, 404);
});
