// A note app's binary files stored once (app_blobs.ts, 20261115090000_note_app_blobs.sql): what the
// database keeps over saves, restores, older projects, devices old and new, clean-up and storage.
//   cd supabase/functions/mcp && deno test -A app_blobs.pglite.test.ts
//   DOOM_DIR=<the Doom app's folder> also measures Doom saved three times, before and after.
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import "./tools.ts";
import { asUser, schemaDB, sqlFor } from "./pglite.ts";
import { type Account, account, app, note, toolContext } from "./sealed.ts";
import { runFileTool } from "./files_tools.ts";
import { fromBase64, toBase64 } from "../_shared/e2ee.ts";
import { blobNames, openProject } from "./app_blobs.ts";
import { isBinaryBytes, packBinary, serialize, unpackBinary } from "./app_project.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
/** A device on 1.4: it says it writes page_blobs. */
const NEW_APP = { "request.headers": JSON.stringify({ "x-pane-device": "iPhone", "x-amber-client": "lock-aware/1 e2ee/1 shared/1 app-blobs/1" }) };
// deno-lint-ignore no-explicit-any
const device = (pg: PGlite, a: Account, sql: string, params: unknown[] = []) => asUser<any>(pg, a.id, sql, params, NEW_APP);
const q = async <T = Record<string, unknown>>(pg: PGlite, sql: string, params: unknown[] = []) => (await pg.query<T>(sql, params)).rows;
const blobs = async (pg: PGlite) => (await q<{ hash: string }>(pg, `select hash from public.note_app_blobs order by hash`)).map((r) => r.hash);
const page = async (pg: PGlite, id: string) => (await q<{ page_ct: string | null; page_blobs: string[] | null; draft_blobs: string[] | null }>(pg, `select page_ct, page_blobs, draft_blobs from public.note_pages where note_id = $1`, [id]))[0];
/** Time passes: the file tools' ten-minute coalescing is over, and every file was last used an hour ago. */
async function later(pg: PGlite) {
  await pg.exec(`set session_replication_role = replica;
    update public.note_pages set updated_at = updated_at - interval '11 minutes';
    update public.note_app_blobs set used_at = used_at - interval '1 hour';
    set session_replication_role = origin;`);
}
const noteId = async (pg: PGlite, title: string) => (await q<{ note_id: string }>(pg, `select note_id from public.note_pages`)).map((r) => r.note_id)[0] ?? title;
const raw = async (pg: PGlite, a: Account, path: string) => fromBase64((await tool(pg, a, "fetch", { id: path, raw: true })).content[1].resource.blob);
const WASM = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const WASM2 = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01]);
const WAD = new Uint8Array(1 << 20).map((_, i) => (i % 7 === 0 ? 0 : i % 251));

async function gameApp(pg: PGlite, a: Account) {
  await tool(pg, a, "create", { type: "app", path: "Games/Doom.md" });
  const id = await noteId(pg, "Doom");
  starter = (await page(pg, id)).page_ct!.length;
  await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(WASM) });
  await tool(pg, a, "write", { path: "Games/Doom.app/doom1.wad", content_base64: toBase64(WAD) });
  await tool(pg, a, "fetch", { id: "Games/Doom.app/src/screens/home.tsx" });
  return id;
}
/** The starter project's sealed size, before any binary file. */
let starter = 0;
const text = async (pg: PGlite, a: Account, path: string) => (await tool(pg, a, "fetch", { id: path })).text as string;

Deno.test("saving twice with one changed text file stores no file again; a changed binary file is stored once", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await gameApp(pg, a);
  const two = await blobs(pg);
  assertEquals(two.length, 2);
  // The project's text names them; it no longer holds them.
  const p = await page(pg, id);
  assertEquals(p.page_blobs, two);
  assert(p.page_ct!.length - starter < 1000, `the two files added ${p.page_ct!.length - starter} bytes to the app's text`);
  assertEquals(blobNames(await a.vault.openPage(id, p.page_ct!)), two);
  await later(pg);
  await tool(pg, a, "edit", { path: "Games/Doom.app/src/screens/home.tsx", old_string: "Nothing here yet", new_string: "Press start" });
  await later(pg);
  await tool(pg, a, "edit", { path: "Games/Doom.app/src/screens/home.tsx", old_string: "Press start", new_string: "Press Enter" });
  // Two saves, two versions kept, still the same two files.
  assertEquals(await blobs(pg), two);
  const versions = await q<{ page_blobs: string[]; n: number }>(pg, `select page_blobs, length(page_ct) as n from public.note_page_versions where note_id = $1 order by id`, [id]);
  assertEquals(versions.length, 2);
  for (const v of versions) { assertEquals(v.page_blobs, two); assert(v.n - starter < 1000, `a version holds ${v.n}`); }
  // A changed engine is one new file; the old one stays for the versions that name it.
  await later(pg);
  await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(WASM2) });
  assertEquals((await blobs(pg)).length, 3);
  assertEquals(await raw(pg, a, "Games/Doom.app/doom.wasm"), WASM2);
  assertEquals((await raw(pg, a, "Games/Doom.app/doom1.wad")).length, WAD.length);
});

Deno.test("restoring an earlier version gives back its exact files, and no bytes are copied", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await gameApp(pg, a);
  await later(pg);
  await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(WASM2) });
  await later(pg);
  await tool(pg, a, "edit", { path: "Games/Doom.app/src/screens/home.tsx", old_string: "Nothing here yet", new_string: "Press start" });
  const before = (await q<{ n: number }>(pg, `select count(*)::int as n from public.note_app_blobs`))[0].n;
  const h = await tool(pg, a, "history", { path: "Games/Doom.app/" });
  // The oldest version: the first engine.
  const first = h.versions[h.versions.length - 1].version;
  await tool(pg, a, "restore", { path: "Games/Doom.app/", version: first });
  assertEquals(await raw(pg, a, "Games/Doom.app/doom.wasm"), WASM);
  assertEquals(await raw(pg, a, "Games/Doom.app/doom1.wad"), WAD);
  const [v] = await q<{ page_blobs: string[] }>(pg, `select page_blobs from public.note_page_versions where id = $1`, [first]);
  assertEquals((await page(pg, id)).page_blobs, v.page_blobs);
  assertEquals((await q<{ n: number }>(pg, `select count(*)::int as n from public.note_app_blobs`))[0].n, before);
  // And forward again to the newest engine.
  const back = (await tool(pg, a, "history", { path: "Games/Doom.app/" })).versions[0].version;
  await tool(pg, a, "restore", { path: "Games/Doom.app/", version: back });
  assertStringIncludes(await text(pg, a, "Games/Doom.app/src/screens/home.tsx"), "Press start");
});

Deno.test("an app stored the old way, its files inside its text, still opens, saves and restores", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await note(pg, a, "Old game\n");
  const old = serialize({ amberApp: 1, files: { "/index.html": "<canvas></canvas><script src=\"main.js\"></script>", "/main.js": "fetch('data.wad')" }, compiled: {}, binary: { "/data.wad": await packBinary(WAD) } });
  // Written before blobs existed: the row has no names ('{}').
  await pg.query(`insert into public.note_pages (note_id, user_id, page_ct) values ($1, $2, $3)`, [id, a.id, await a.vault.sealPage(id, old)]);
  assertEquals((await page(pg, id)).page_blobs, []);
  assertEquals(await raw(pg, a, "Old game.app/data.wad"), WAD);
  await later(pg);
  assertStringIncludes(await text(pg, a, "Old game.app/main.js"), "fetch('data.wad')");
  await tool(pg, a, "edit", { path: "Old game.app/main.js", old_string: "fetch('data.wad')", new_string: "fetch('/data.wad')" });
  // Saved again, the file is stored apart; the old version keeps its text as it was.
  assertEquals((await blobs(pg)).length, 1);
  const [v] = await q<{ id: number; page_ct: string; page_blobs: string[] }>(pg, `select id, page_ct, page_blobs from public.note_page_versions where note_id = $1`, [id]);
  assertEquals(v.page_blobs, []);
  assertEquals(await a.vault.openPage(id, v.page_ct), old);
  await tool(pg, a, "restore", { path: "Old game.app/", version: v.id });
  assertEquals(await raw(pg, a, "Old game.app/data.wad"), WAD);
  assertStringIncludes(await text(pg, a, "Old game.app/main.js"), "fetch('data.wad')");
});

Deno.test("a device sends a file before the app that names it; an app naming a missing file is refused", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await note(pg, a, "Made here\n");
  const hash = await a.vault.blobName(WAD);
  const packed = fromBase64(await packBinary(WAD));
  const text = JSON.stringify({ amberApp: 1, files: { "/index.html": "<p>" }, compiled: {}, binary: { "/data.wad": { hash, size: WAD.length } } });
  const sealed = await a.vault.sealPage(id, text);
  const insertPage = () => device(pg, a, `insert into public.note_pages (note_id, page_ct, page_blobs) values ($1, $2, $3)`, [id, sealed, [hash]]);
  const e = await assertRejects(insertPage) as { code?: string; message: string };
  assertStringIncludes(e.message, "aren't on the server yet");
  await device(pg, a, `insert into public.note_app_blobs (hash, blob_ct) values ($1, $2)`, [hash, await a.vault.sealBlob(hash, packed)]);
  // Sending it twice is nothing.
  await device(pg, a, `insert into public.note_app_blobs (hash, blob_ct) values ($1, $2) on conflict do nothing`, [hash, await a.vault.sealBlob(hash, packed)]);
  await insertPage();
  assertEquals((await page(pg, id)).page_blobs, [hash]);
  assertEquals(await raw(pg, a, "Made here.app/data.wad"), WAD);
  // A file can't be renamed, rewritten or taken away by a device, nor sealed with an old key.
  await assertRejects(() => device(pg, a, `update public.note_app_blobs set blob_ct = blob_ct`));
  await assertRejects(() => device(pg, a, `delete from public.note_app_blobs`));
  await assertRejects(() => device(pg, a, `insert into public.note_app_blobs (hash, blob_ct) values ($1, $2)`, ["1".repeat(64), "amb2.0000000000000000.AAAA"]));
  // And another account sees none of them.
  const b = await account(pg);
  assertEquals((await device(pg, b, `select hash from public.note_app_blobs`)).length, 0);
  assertEquals(await unpackBinary(toBase64(await a.vault.openBlob(hash, (await q<{ blob_ct: string }>(pg, `select blob_ct from public.note_app_blobs`))[0].blob_ct))), WAD);
});

Deno.test("files nothing names go; one used in the last ten minutes stays; deleting the note takes them", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await gameApp(pg, a);
  const kept = await blobs(pg);
  // Ten more saves of a new engine each: the first engine leaves the last 10 versions, and goes.
  for (let i = 0; i < 11; i++) {
    await later(pg);
    await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(new Uint8Array([...WASM, i + 1])) });
  }
  const now = await blobs(pg);
  const firstEngine = kept.find((h) => !now.includes(h));
  assert(firstEngine, "the first engine is gone");
  assert(now.includes(kept.find((h) => h !== firstEngine)!), "the WAD every version names stays");
  // Every file a row names is still here.
  const named = await q<{ h: string }>(pg, `select distinct unnest(page_blobs) as h from public.note_page_versions union select unnest(page_blobs) from public.note_pages`);
  for (const { h } of named) assert(now.includes(h), h);
  // A file sent a moment ago, not yet named by its app, isn't taken.
  const fresh = await a.vault.blobName(new Uint8Array([9, 9, 9]));
  await device(pg, a, `insert into public.note_app_blobs (hash, blob_ct) values ($1, $2)`, [fresh, await a.vault.sealBlob(fresh, fromBase64(await packBinary(new Uint8Array([9, 9, 9]))))]);
  await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(WASM) });
  assert((await blobs(pg)).includes(fresh));
  // Deleting the note for good takes its versions and its files.
  await later(pg);
  await pg.query(`delete from public.notes where id = $1`, [id]);
  assertEquals(await blobs(pg), []);
});

Deno.test("an older app (1.3) that changes an app: nothing is cleaned up until its names are known again", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const id = await gameApp(pg, a);
  const [{ page_ct: firstCt }] = await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]);
  await later(pg);
  await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(WASM2) });
  // 1.3's Previous App: it puts back a page it kept, without saying which files it names.
  await app(pg, a.id, `update public.note_pages set page_ct = $2 where note_id = $1`, [id, firstCt]);
  assertEquals((await page(pg, id)).page_blobs, null);
  // Its data writes leave the names alone (and a data write from an app that knows keeps them too).
  await app(pg, a.id, `update public.note_pages set data_ct = $2 where note_id = $1`, [id, await a.vault.sealPageData(id, "{}")]);
  assertEquals((await page(pg, id)).page_blobs, null);
  // The app it put back still opens whole, from the MCP too.
  assertEquals(await raw(pg, a, "Games/Doom.app/doom.wasm"), WASM);
  // An orphan, old enough to go: kept while any row's names are unknown.
  const orphan = await a.vault.blobName(new Uint8Array([7]));
  await device(pg, a, `insert into public.note_app_blobs (hash, blob_ct) values ($1, $2)`, [orphan, await a.vault.sealBlob(orphan, fromBase64(await packBinary(new Uint8Array([7]))))]);
  for (let i = 0; i < 11; i++) {
    await later(pg);
    await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(new Uint8Array([...WASM2, i])) });
    if (i < 10) assert((await blobs(pg)).includes(orphan), `kept while the unknown row is among the versions (${i})`);
  }
  // The unknown row has left the last 10: clean-up runs again.
  assert(!(await blobs(pg)).includes(orphan));
  // Removing an app from 1.3 is fine: no page, no names.
  await app(pg, a.id, `update public.note_pages set page_ct = null where note_id = $1`, [id]);
  assertEquals((await page(pg, id)).page_blobs, []);
});

Deno.test("storage counts each file once, however many versions and notes name it", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  await gameApp(pg, a);
  await tool(pg, a, "create", { type: "app", path: "Games/Doom 2.md" });
  await tool(pg, a, "write", { path: "Games/Doom 2.app/doom1.wad", content_base64: toBase64(WAD) });
  for (let i = 0; i < 3; i++) {
    await later(pg);
    await tool(pg, a, "edit", { path: "Games/Doom.app/src/screens/home.tsx", old_string: i ? `Press ${i}` : "Nothing here yet", new_string: `Press ${i + 1}` });
  }
  // The WAD in two notes and four versions is one file.
  assertEquals((await blobs(pg)).length, 2);
  const [{ blobs: stored }] = await q<{ blobs: number }>(pg, `select sum(octet_length(blob_ct))::int as blobs from public.note_app_blobs`);
  const [parts] = await q<{ apps: number; versions: number }>(pg, `select apps::int, versions::int from public.pane_storage_parts($1)`, [a.id]);
  const [{ pages }] = await q<{ pages: number }>(pg, `select sum(coalesce(octet_length(page_ct), 0) + coalesce(octet_length(data_ct), 0) + coalesce(octet_length(draft_ct), 0))::int as pages from public.note_pages`);
  assertEquals(parts.apps, pages + stored);
  assert(parts.versions < 1_000_000, `versions ${parts.versions}`);
});

Deno.test("Doom saved three times: what the database holds, before and after", async () => {
  const dir = Deno.env.get("DOOM_DIR");
  if (!dir) return;
  const pg = await schemaDB();
  const a = await account(pg);
  // Save 1: the folder dropped on a note on a Mac (1.4): its two binary files sent, then the app.
  const id = await note(pg, a, "Doom\n");
  const files = [...Deno.readDirSync(dir)].filter((f) => f.isFile && !f.name.startsWith(".")).map((f) => f.name).sort();
  const project = { amberApp: 1 as const, files: {} as Record<string, string>, compiled: {}, binary: {} as Record<string, unknown> };
  for (const f of files) {
    const bytes = await Deno.readFile(`${dir}/${f}`);
    if (!isBinaryBytes(bytes)) { project.files[`/${f}`] = new TextDecoder().decode(bytes); continue; }
    const hash = await a.vault.blobName(bytes);
    await device(pg, a, `insert into public.note_app_blobs (hash, blob_ct) values ($1, $2)`, [hash, await a.vault.sealBlob(hash, fromBase64(await packBinary(bytes)))]);
    project.binary[`/${f}`] = { hash, size: bytes.length };
  }
  const stored = serialize(project as never);
  await device(pg, a, `insert into public.note_pages (note_id, page_ct, page_blobs) values ($1, $2, $3)`, [id, await a.vault.sealPage(id, stored), blobNames(stored)]);
  // Saves 2 and 3: an AI changes one line of main.js, each in a later session.
  await tool(pg, a, "fetch", { id: "Doom.app/main.js" });
  for (let i = 2; i <= 3; i++) {
    await later(pg);
    await tool(pg, a, "write", { path: "Doom.app/main.js", content: project.files["/main.js"] + `\n// save ${i}\n` });
  }
  const [after] = await q<{ pages: number; versions: number; blobs: number; rows: number }>(pg, `select
    (select sum(octet_length(page_ct)) from public.note_pages)::int as pages,
    (select coalesce(sum(octet_length(page_ct)), 0) from public.note_page_versions)::int as versions,
    (select sum(octet_length(blob_ct)) from public.note_app_blobs)::int as blobs,
    (select count(*) from public.note_page_versions where page_ct is not null)::int + 1 as rows`);
  // Before: every version held the whole project, its binary files packed inside, sealed.
  const [live] = await q<{ page_ct: string }>(pg, `select page_ct from public.note_pages where note_id = $1`, [id]);
  const whole = serialize(await openProject(sqlFor(pg) as never, { v: a.vault } as never, id, live.page_ct));
  const oneCopy = (await a.vault.sealPage(id, whole)).length;
  const beforeTotal = oneCopy * after.rows;
  const afterTotal = after.pages + after.versions + after.blobs;
  console.log(`Doom, ${files.length} files, ${after.rows} saves kept: before ${beforeTotal} bytes (${oneCopy} a save); after ${afterTotal} bytes (files once ${after.blobs}, the live app's text ${after.pages}, ${after.rows - 1} versions' text ${after.versions})`);
  assertEquals(after.rows, 3);
  assert(afterTotal < beforeTotal / 2.5, `${afterTotal} vs ${beforeTotal}`);
  assertEquals(await raw(pg, a, "Doom.app/doom1.wad"), await Deno.readFile(`${dir}/doom1.wad`));
});
