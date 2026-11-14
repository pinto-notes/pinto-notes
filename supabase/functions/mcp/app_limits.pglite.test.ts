// Note apps without the old size walls (2026-11-16, docs/Technical/note-app-limits.md): a binary file
// up to 100 MB stored apart in 4 MB parts, sent in pieces when one write can't carry it, the
// account's storage still holding, and several files in one save.
//   cd supabase/functions/mcp && deno test -A app_limits.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { ToolError } from "./tools.ts";
import { schemaDB } from "./pglite.ts";
import { type Account, account, app, file, toolContext } from "./sealed.ts";
import { runFileTool } from "./files_tools.ts";
import { fromBase64, toBase64 } from "../_shared/e2ee.ts";
import { parseStored, PART_BYTES } from "./app_project.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };
const q = async <T = Record<string, unknown>>(pg: PGlite, sql: string, params: unknown[] = []) => (await pg.query<T>(sql, params)).rows;
const MB = 1024 * 1024;
const sha = async (b: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource)), (x) => x.toString(16).padStart(2, "0")).join("");

/** Bytes that don't compress (a disk image's packed parts, a video): the worst case for storage. */
function noise(n: number): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
  // A disk image starts like one, and has a NUL early, so it's binary.
  out.set([0xeb, 0x63, 0x90, 0x00]);
  return out;
}

async function lab(pg: PGlite, a: Account) {
  await tool(pg, a, "create", { type: "app", path: "Lab.md" });
  const [{ note_id }] = await q<{ note_id: string }>(pg, `select note_id from public.note_pages`);
  return note_id;
}
const versions = async (pg: PGlite, id: string) => Number((await q<{ n: string }>(pg, `select count(*) as n from public.note_page_versions where note_id = $1`, [id]))[0].n);
const blobRows = async (pg: PGlite) => await q<{ hash: string; n: number }>(pg, `select hash, octet_length(blob_ct) as n from public.note_app_blobs order by hash`);
/** Time passes: the file tools' ten-minute coalescing is over, so each save keeps a version. */
const later = (pg: PGlite) => pg.exec(`set session_replication_role = replica; update public.note_pages set updated_at = updated_at - interval '11 minutes'; set session_replication_role = origin;`);
/** The file back through fetch with raw, 10 MB at a time. */
async function readBack(pg: PGlite, a: Account, path: string, size: number): Promise<Uint8Array> {
  const out = new Uint8Array(size);
  for (let at = 0; at < size;) {
    const r = await tool(pg, a, "fetch", { id: path, raw: true, offset: at, limit: 10 * MB });
    const bytes = fromBase64(r.content[1].resource.blob);
    out.set(bytes, at);
    at += bytes.length;
    if (!bytes.length) throw new Error("no bytes");
  }
  return out;
}

Deno.test("a 60 MB disk image that doesn't compress: sent in pieces, stored in 4 MB parts, read back exactly, one save", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await lab(pg, a);
  await later(pg);
  const before = await versions(pg, id);
  const disk = noise(60 * MB + 12345);
  const t0 = performance.now();
  // Pieces of 8 MB, the way pinto push sends them: each answer says what's still missing.
  const piece = 8 * MB;
  let last;
  for (let at = 0; at < disk.length; at += piece) {
    last = await tool(pg, a, "write", { path: "Lab.app/disk.img", content_base64: toBase64(disk.subarray(at, at + piece)), offset: at, size: disk.length });
    if (at + piece < disk.length) {
      assertEquals(last.saved, false);
      assertEquals(last.received, at + piece);
      assertEquals(last.missing, `${at + piece} to ${disk.length - 1}`);
    }
  }
  const ms = performance.now() - t0;
  assertEquals(last.saved, "Lab.app/disk.img");
  // Stored in parts of 4 MB, each its own row well under a row's limit, counted once.
  const rows = await blobRows(pg);
  assertEquals(rows.length, Math.ceil(disk.length / PART_BYTES));
  for (const r of rows) assert(r.n < 6 * MB, `a part is ${r.n} bytes sealed`);
  assertEquals((await q(pg, `select 1 from public.note_app_uploads`)).length, 0);
  const [pageRow] = await q<{ page_ct: string; page_blobs: string[] }>(pg, `select page_ct, page_blobs from public.note_pages where note_id = $1`, [id]);
  assertEquals(pageRow.page_blobs.length, rows.length);
  const entry = parseStored(await a.vault.openPage(id, pageRow.page_ct)).binary!["/disk.img"];
  assert(typeof entry === "object" && "parts" in entry && entry.size === disk.length);
  // One save for the whole file: one version kept, not one per piece.
  assertEquals(await versions(pg, id), before + 1);
  // The app's text holds names only.
  assert(pageRow.page_ct.length < 300_000, `the app's text is ${pageRow.page_ct.length}`);
  // Back exactly, 10 MB at a time; asking for all of it at once says how.
  assertStringIncludes(await fails(tool(pg, a, "fetch", { id: "Lab.app/disk.img", raw: true })), "offset and limit");
  assertEquals(await sha(await readBack(pg, a, "Lab.app/disk.img", disk.length)), await sha(disk));
  const listed = (await tool(pg, a, "list", { path: "Lab.app" })).structuredContent?.files ?? (await tool(pg, a, "list", { path: "Lab.app" })).files;
  assertEquals(listed.find((f: { path: string }) => f.path === "Lab.app/disk.img").bytes, disk.length);
  console.log(`60 MB in ${Math.ceil(disk.length / piece)} pieces: ${(ms / 1000).toFixed(1)} s on pglite`);
});

Deno.test("pieces: in any order, a retried piece replaces itself, a new size starts again, and a piece alone saves nothing", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await lab(pg, a);
  const [{ page_ct: before }] = await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]);
  const f = noise(9 * MB);
  const send = (from: number, to: number, size = f.length) => tool(pg, a, "write", { path: "Lab.app/data.bin", content_base64: toBase64(f.subarray(from, to)), offset: from, size });
  // The end first, then a stray piece of a different size (a new upload: what came before goes).
  assertEquals((await send(6 * MB, 9 * MB)).missing, `0 to ${6 * MB - 1}`);
  assertEquals((await send(0, 1 * MB, 20 * MB)).missing, `${1 * MB} to ${20 * MB - 1}`);
  assertEquals((await send(6 * MB, 9 * MB)).missing, `0 to ${6 * MB - 1}`);
  // The middle, sent twice (a retry), then the start.
  await send(3 * MB, 6 * MB);
  assertEquals((await send(3 * MB, 6 * MB)).missing, `0 to ${3 * MB - 1}`);
  // Nothing in the app until the last piece.
  assertEquals((await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]))[0].page_ct, before);
  const done = await send(0, 3 * MB);
  assertEquals(done.saved, "Lab.app/data.bin");
  assertEquals(await sha(await readBack(pg, a, "Lab.app/data.bin", f.length)), await sha(f));
  // What doesn't fit is said plainly.
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Lab.app/x.bin", content_base64: toBase64(f.subarray(0, 10)), offset: 0, size: 101 * MB })), "at most 100 MB");
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Lab.app/x.bin", content_base64: toBase64(f.subarray(0, 10)), offset: 5, size: 10 })), "doesn't fit");
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Lab.app/x.bin", content_base64: toBase64(noise(11 * MB)) })), "Send it in pieces");
});

Deno.test("the account's 2 GB still holds: a file that doesn't fit is refused part by part, and nothing of it is saved", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await lab(pg, a);
  const [{ page_ct: before }] = await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]);
  // The account already stores 2 GB less 20 MB (one big file, put in without the triggers).
  const big = await file(pg, a, "Archive.zip", "public.zip-archive", new Uint8Array(10));
  await pg.query(`set session_replication_role = replica`);
  await pg.query(`update public.attachments set size = $2 where id = $1`, [big.id, 2048 * MB - 20 * MB]);
  await pg.query(`set session_replication_role = default`);
  await pg.query(`update public.pane_usage set storage_at = null`);
  // 9 MB fits in one write (12 MB as it's stored: sealed, in base64); 12 MB doesn't fit in what's left.
  const nine = noise(9 * MB);
  assertEquals((await tool(pg, a, "write", { path: "Lab.app/nine.bin", content_base64: toBase64(nine) })).saved, "Lab.app/nine.bin");
  const rows = (await blobRows(pg)).length;
  const page = (await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]))[0].page_ct;
  assert(page !== before);
  const twelve = noise(12 * MB);
  const full = await fails(tool(pg, a, "write", { path: "Lab.app/twelve.bin", content_base64: toBase64(twelve.subarray(0, 8 * MB)), offset: 0, size: twelve.length }));
  assertStringIncludes(full, "Pinto Notes is full");
  // Nothing of it stays: no part, no upload, the app as it was.
  assertEquals((await blobRows(pg)).length, rows);
  assertEquals((await q(pg, `select 1 from public.note_app_uploads`)).length, 0);
  assertEquals((await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]))[0].page_ct, page);
  // The same through several files at once.
  await tool(pg, a, "fetch", { id: "Lab.app/index.html" });
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Lab.app", files: [{ path: "a.bin", content_base64: toBase64(noise(5 * MB)) }, { path: "b.bin", content_base64: toBase64(noise(4 * MB)) }] })), "Pinto Notes is full");
  assertEquals((await blobRows(pg)).length, rows);
  // Deleting the big file makes room again.
  await app(pg, a.id, `delete from public.attachments where id = $1`, [big.id]);
  await pg.query(`update public.pane_usage set storage_at = null`);
  assertEquals((await tool(pg, a, "write", { path: "Lab.app/twelve.bin", content_base64: toBase64(twelve.subarray(0, 8 * MB)), offset: 0, size: twelve.length })).saved, false);
});

Deno.test("several files in one write: one save and one version; one file that can't be saved stops all of them", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await lab(pg, a);
  await later(pg);
  for (const f of ["index.html", "src/App.tsx", "README.md"]) await tool(pg, a, "fetch", { id: `Lab.app/${f}` });
  const v0 = await versions(pg, id);
  const blob = noise(300_000);
  const r = await tool(pg, a, "write", {
    path: "Lab.app", files: [
      { path: "src/App.tsx", content: "export default function App() { return <h1>Lab</h1>; }\n" },
      { path: "src/data/levels.ts", content: "export const levels = [1, 2, 3];\n" },
      { path: "assets/level.bin", content_base64: toBase64(blob) },
      { path: "Lab.app/notes.txt", content: "plain text\n" },
      { path: "README.md", delete: true },
    ],
  });
  assertEquals(r.saved, "Lab.app/");
  assertEquals(r.files.map((f: { path: string; did: string }) => `${f.did} ${f.path}`), [
    "replaced Lab.app/src/App.tsx", "created Lab.app/src/data/levels.ts", "created Lab.app/assets/level.bin", "created Lab.app/notes.txt", "deleted Lab.app/README.md",
  ]);
  assertEquals(await versions(pg, id), v0 + 1);
  const p = parseStored(await a.vault.openPage(id, (await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]))[0].page_ct));
  assert(p.compiled["/src/App.tsx"]?.includes("Lab") && p.compiled["/src/data/levels.ts"] !== undefined, "both compiled in the one save");
  assertEquals(p.files["/README.md"], undefined);
  assertEquals(await sha(await readBack(pg, a, "Lab.app/assets/level.bin", blob.length)), await sha(blob));
  // Unchanged files are said, and a write that changes nothing saves nothing.
  const same = await tool(pg, a, "write", { path: "Lab.app", files: [{ path: "src/data/levels.ts", content: "export const levels = [1, 2, 3];\n" }] });
  assertEquals(same.unchanged, true);
  assertEquals(await versions(pg, id), v0 + 1);

  // One file that can't be saved (it doesn't compile) stops all of them: no text, no stored bytes.
  await later(pg);
  const blobsBefore = (await blobRows(pg)).length;
  const pageBefore = (await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]))[0].page_ct;
  const why = await fails(tool(pg, a, "write", {
    path: "Lab.app", files: [
      { path: "src/data/more.ts", content: "export const more = 1;\n" },
      { path: "assets/other.bin", content_base64: toBase64(noise(200_000)) },
      { path: "src/Broken.tsx", content: "export default function Broken( { return <p> }\n" },
    ],
  }));
  assertStringIncludes(why, "src/Broken.tsx");
  assertEquals((await blobRows(pg)).length, blobsBefore);
  assertEquals((await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]))[0].page_ct, pageBefore);
  assertEquals(await versions(pg, id), v0 + 1);
  // So does a file sent twice, and a piece that isn't the last.
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Lab.app", files: [{ path: "a.ts", content: "1" }, { path: "/a.ts", content: "2" }] })), "twice");
  assertStringIncludes(await fails(tool(pg, a, "write", { path: "Lab.app", files: [{ path: "big.bin", content_base64: toBase64(noise(100)), offset: 0, size: 1000 }] })), "isn't complete");
  assertEquals((await blobRows(pg)).length, blobsBefore);
  assertEquals((await q(pg, `select 1 from public.note_app_uploads`)).length, 0);
});

Deno.test("an upload nobody finishes keeps its parts through the clean-up for a day, then goes", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await lab(pg, a);
  const f = noise(6 * MB);
  await tool(pg, a, "write", { path: "Lab.app/half.bin", content_base64: toBase64(f.subarray(0, 4 * MB)), offset: 0, size: f.length });
  assertEquals((await blobRows(pg)).length, 1);
  // An hour later something else in the app changes, which runs the clean-up: the part stays.
  await pg.exec(`set session_replication_role = replica; update public.note_app_blobs set used_at = now() - interval '1 hour'; set session_replication_role = origin;`);
  await tool(pg, a, "fetch", { id: "Lab.app/index.html" });
  const html = (await tool(pg, a, "fetch", { id: "Lab.app/index.html", limit: 1 })).text;
  void html;
  await pg.query(`select public.pane_app_blobs_gc($1)`, [a.id]);
  assertEquals((await blobRows(pg)).length, 1);
  // A day later it goes, upload and part.
  await pg.exec(`update public.note_app_uploads set updated_at = now() - interval '25 hours'`);
  await pg.query(`select public.pane_app_blobs_gc($1)`, [a.id]);
  assertEquals((await q(pg, `select 1 from public.note_app_uploads`)).length, 0);
  assertEquals((await blobRows(pg)).length, 0);
  void id;
});
