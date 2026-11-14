// write's content_url (2026-11-14): the server downloads a file from a public https address and
// stores it like content_base64 would, for an app's files and a folder's files alike. The internet
// here is a local https server (test_https.ts); nothing leaves the machine.
//   cd supabase/functions/mcp && deno test -A write_from_url.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, folder, note, stubStorage, toolContext } from "./sealed.ts";
import { ToolError } from "./tools.ts";
import { runFileTool } from "./files_tools.ts";
import { fromBase64, toBase64 } from "../_shared/e2ee.ts";
import { testWeb } from "./test_https.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };
const q = async <T = Record<string, unknown>>(pg: PGlite, sql: string, params: unknown[] = []) => (await pg.query<T>(sql, params)).rows;
const raw = async (pg: PGlite, a: Account, path: string) => fromBase64((await tool(pg, a, "fetch", { id: path, raw: true })).content[1].resource.blob);
const sha256 = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");

const WASM = new Uint8Array(438_000).map((_, i) => (i < 8 ? [0x00, 0x61, 0x73, 0x6d, 0x01, 0, 0, 0][i] : (i * 31) % 256));
// A game's data, like the shareware WAD: zeros in it, 1 MB.
const WAD = new Uint8Array(1 << 20).map((_, i) => (i % 7 === 0 ? 0 : i % 251));
const PDF = new TextEncoder().encode("%PDF-1.4 a paper about attention");
const MB = 1024 * 1024;

const BASE = "https://proj.supabase.co";
function storage() {
  Deno.env.set("SUPABASE_URL", BASE);
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  const objects = new Map<string, Uint8Array>();
  return { objects, unstub: stubStorage(BASE, objects) };
}

/** The stand-in internet: a CDN with the files, a host that points inside, and some unhelpful answers. */
async function internet(o: { timeoutMs?: number } = {}) {
  let sent = 0;
  let release = () => {};
  const held = new Promise<void>((r) => { release = r; });
  const web = await testWeb({
    "cdn.example.com": ["93.184.216.34", "2606:2800:220:1::1"],
    "inside.example.com": ["10.0.0.7"],
    "meta.example.com": ["169.254.169.254"],
    "cgnat.example.com": ["100.64.0.1"],
    "multicast.example.com": ["224.0.0.251"],
    "loop.example.com": ["127.0.0.1"],
    "v6inside.example.com": ["fd00::7"],
    "v6link.example.com": ["fe80::1"],
    "v6mapped.example.com": ["::ffff:192.168.0.1"],
  }, async (req) => {
    const p = new URL(req.url).pathname;
    if (p === "/doom.wasm") return new Response(WASM, { headers: { "content-type": "application/wasm" } });
    if (p === "/doom1.wad") return new Response(new Blob([WAD]).stream()); // streamed, no length given
    if (p === "/paper.pdf") return new Response(PDF, { headers: { "content-type": "application/pdf" } });
    if (p === "/data.js") return new Response("export const levels = 3;\n", { headers: { "content-type": "text/javascript" } });
    if (p === "/to-inside") return new Response(null, { status: 302, headers: { location: "https://inside.example.com/secret" } });
    if (p === "/to-meta") return new Response(null, { status: 301, headers: { location: "https://169.254.169.254/latest/meta-data/" } });
    if (p === "/to-cdn") return new Response(null, { status: 302, headers: { location: "/doom.wasm" } });
    if (p === "/huge") {
      // Endless, without a length: the download has to stop by itself.
      return new Response(new ReadableStream({ pull(c) { sent += 64 * 1024; c.enqueue(new Uint8Array(64 * 1024).fill(1)); } }));
    }
    if (p === "/huge-declared") return new Response(new Uint8Array(11 * MB));
    if (p === "/slow") { await held; return new Response("late"); }
    return new Response("not here", { status: 404, statusText: "Not Found" });
  }, o);
  return { web, sent: () => sent, release };
}

/** Time passes: the file tools' ten-minute coalescing is over (as in app_blobs.pglite.test.ts). */
async function later(pg: PGlite) {
  await pg.exec(`set session_replication_role = replica;
    update public.note_pages set updated_at = updated_at - interval '11 minutes';
    set session_replication_role = origin;`);
}

async function gameApp(pg: PGlite, a: Account) {
  await tool(pg, a, "create", { type: "app", path: "Games/Doom.md" });
  return ((await q<{ note_id: string }>(pg, `select note_id from public.note_pages`))[0]).note_id;
}

Deno.test("an app's files from addresses: the exact bytes, the hash it says, stored once like content_base64, in every version", async () => {
  const net = await internet();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const id = await gameApp(pg, a);
    const wasm = await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_url: "https://cdn.example.com/doom.wasm" });
    assertEquals([wasm.saved, wasm.bytes, wasm.sha256, wasm.downloaded_from, wasm.content_type],
      ["Games/Doom.app/doom.wasm", WASM.length, await sha256(WASM), "https://cdn.example.com/doom.wasm", "application/wasm"]);
    const wad = await tool(pg, a, "write", { path: "Games/Doom.app/doom1.wad", content_url: "https://cdn.example.com/doom1.wad" });
    assertEquals([wad.bytes, wad.sha256], [WAD.length, await sha256(WAD)]);
    // Read back exactly; listed as binary files like any other.
    assertEquals(await raw(pg, a, "Games/Doom.app/doom.wasm"), WASM);
    assertEquals(await raw(pg, a, "Games/Doom.app/doom1.wad"), WAD);
    const listed = (await tool(pg, a, "list", { path: "Games/Doom.app" })).files as { path: string; binary?: boolean }[];
    assert(listed.some((f) => f.path === "Games/Doom.app/doom1.wad" && f.binary));
    // The same path as content_base64: the same bytes in another app are the same stored file.
    const stored = async () => (await q<{ hash: string }>(pg, `select hash from public.note_app_blobs order by hash`)).map((r) => r.hash);
    const before = await stored();
    assertEquals(before.length, 2);
    await tool(pg, a, "create", { type: "app", path: "Games/Doom 2.md" });
    await tool(pg, a, "write", { path: "Games/Doom 2.app/doom1.wad", content_base64: toBase64(WAD) });
    assertEquals(await stored(), before, "stored once, by the same keyed hash");
    // An app version like any other: a text change keeps the version before it, which names the
    // downloaded files; the engine is then deleted, and restoring that version brings back the same bytes.
    await later(pg);
    await tool(pg, a, "fetch", { id: "Games/Doom.app/src/screens/home.tsx" });
    await tool(pg, a, "edit", { path: "Games/Doom.app/src/screens/home.tsx", old_string: "Nothing here yet", new_string: "Press start" });
    const [kept] = await q<{ id: string; page_blobs: string[] }>(pg, `select id::text, page_blobs from public.note_page_versions where note_id = $1 order by id desc limit 1`, [id]);
    assertEquals([...kept.page_blobs].sort(), before);
    await later(pg);
    await tool(pg, a, "delete", { path: "Games/Doom.app/doom.wasm" });
    await tool(pg, a, "restore", { path: "Games/Doom.app/", version: Number(kept.id) });
    assertEquals(await raw(pg, a, "Games/Doom.app/doom.wasm"), WASM);
    assertEquals(await raw(pg, a, "Games/Doom.app/doom1.wad"), WAD);
    // A redirect to a public place is followed; text from an address stays editable text.
    assertEquals((await tool(pg, a, "write", { path: "Games/Doom.app/engine.wasm", content_url: "https://cdn.example.com/to-cdn" })).sha256, await sha256(WASM));
    await tool(pg, a, "write", { path: "Games/Doom.app/src/levels.js", content_url: "https://cdn.example.com/data.js" });
    assertStringIncludes((await tool(pg, a, "fetch", { id: "Games/Doom.app/src/levels.js" })).text, "export const levels = 3;");
    // Replacing a file means reading it first, as with content_base64.
    await tool(pg, a, "fetch", { id: "Games/Doom.app/doom.wasm" });
    assertEquals((await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_url: "https://cdn.example.com/doom.wasm" })).bytes, WASM.length);
    // Every connection went to an address that was checked.
    assertEquals(new Set(net.web.dialled), new Set(["93.184.216.34"]));
  } finally { net.release(); await net.web.close(); }
});

Deno.test("a folder's file and a note's file from an address: stored sealed, read back exactly", async () => {
  const { objects, unstub } = storage();
  const net = await internet();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const toRead = await folder(pg, a, "To read");
    const made = await tool(pg, a, "write", { path: "To read/Attention.pdf", content_url: "https://cdn.example.com/paper.pdf" });
    assertEquals([made.created, made.bytes, made.sha256, made.content_type], ["To read/Attention.pdf", PDF.length, await sha256(PDF), "application/pdf"]);
    assertEquals(objects.size, 1);
    // Sealed in storage, not the plain bytes.
    const [only] = [...objects.values()];
    assert(!new TextDecoder().decode(only).includes("attention"), "stored sealed");
    assertEquals(await raw(pg, a, "To read/Attention.pdf"), PDF);
    // An existing file, read first, gets new bytes; the old ones stay in history.
    await tool(pg, a, "fetch", { id: "To read/Attention.pdf" });
    const w = await tool(pg, a, "write", { path: "To read/Attention.pdf", content_url: "https://cdn.example.com/doom1.wad" });
    assertEquals([w.written, w.sha256], ["To read/Attention.pdf", await sha256(WAD)]);
    assertEquals(await raw(pg, a, "To read/Attention.pdf"), WAD);
    // Into a note's folder: the note shows it, like any file added there.
    await note(pg, a, "Reading plan\n\nOne paper a week.", { folder: toRead });
    const att = await tool(pg, a, "write", { path: "To read/Reading plan/Scan.pdf", content_url: "https://cdn.example.com/paper.pdf" });
    assertEquals([att.bytes, att.sha256], [PDF.length, await sha256(PDF)]);
    assertStringIncludes((await tool(pg, a, "fetch", { id: "To read/Reading plan.md" })).text, "Scan.pdf");
    assertEquals(await raw(pg, a, att.created), PDF);
  } finally { unstub(); net.release(); await net.web.close(); }
});

Deno.test("refused: private, loopback, link-local, metadata, CGNAT, multicast and IPv6 inside addresses, redirects inside, plain http", async () => {
  const net = await internet();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    await gameApp(pg, a);
    const write = (url: string) => fails(tool(pg, a, "write", { path: "Games/Doom.app/x.bin", content_url: url }));
    for (const host of ["inside", "meta", "cgnat", "multicast", "loop", "v6inside", "v6link", "v6mapped"]) {
      const why = await write(`https://${host}.example.com/x`);
      assertStringIncludes(why, "content_url was refused", host);
      assertStringIncludes(why, "private, local or reserved address", host);
      assertStringIncludes(why, "Nothing was saved", host);
    }
    for (const url of ["https://127.0.0.1/x", "https://169.254.169.254/latest/meta-data/", "https://10.0.0.1/x", "https://[::1]/x", "https://[fd00:ec2::254]/x", "https://localhost/x"]) {
      assertStringIncludes(await write(url), "content_url was refused", url);
    }
    assertStringIncludes(await write("http://cdn.example.com/doom.wasm"), "http isn't https");
    assertStringIncludes(await write("https://cdn.example.com:8443/doom.wasm"), "port");
    assertStringIncludes(await write("file:///etc/passwd"), "isn't https");
    assertStringIncludes(await write("not a link"), "isn't a web address");
    // A public address that redirects inside: refused at the hop, and the inside never asked.
    for (const p of ["to-inside", "to-meta"]) assertStringIncludes(await write(`https://cdn.example.com/${p}`), "content_url was refused", p);
    assert(!net.web.asked.some((x) => /secret|meta-data/.test(x.url)), net.web.asked.map((x) => x.url).join(" "));
    assertEquals(new Set(net.web.dialled), new Set(["93.184.216.34"]));
    // Nothing was stored by any of it.
    assert(!((await tool(pg, a, "list", { path: "Games/Doom.app" })).files as { path: string }[]).some((f) => f.path.endsWith("x.bin")));
    assertEquals((await q(pg, `select hash from public.note_app_blobs`)).length, 0);
  } finally { net.release(); await net.web.close(); }
});

Deno.test("too big stops early, a slow server times out, a failed answer says its status, and only one source", async () => {
  const net = await internet({ timeoutMs: 400 });
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    await gameApp(pg, a);
    const write = (args: Record<string, unknown>) => fails(tool(pg, a, "write", { path: "Games/Doom.app/x.bin", ...args }));
    const big = await write({ content_url: "https://cdn.example.com/huge" });
    assertStringIncludes(big, "over 10 MB, so the download stopped there");
    // It stopped reading near the limit; it didn't take what the server would keep sending.
    assert(net.sent() < 13 * MB, `the server sent ${net.sent()} bytes`);
    assertStringIncludes(await write({ content_url: "https://cdn.example.com/huge-declared" }), "over 10 MB");
    assertStringIncludes(await write({ content_url: "https://cdn.example.com/slow" }), "took longer than 400 ms, so it stopped");
    assertStringIncludes(await write({ content_url: "https://cdn.example.com/gone" }), "cdn.example.com answered 404 Not Found");
    assertStringIncludes(await write({ content_url: "https://cdn.example.com/doom.wasm", content_base64: toBase64(WASM) }), "Give one of content, content_base64 or content_url");
    assertStringIncludes(await write({ content_url: "https://cdn.example.com/doom.wasm", content: "text" }), "Give one of");
    assertEquals((await q(pg, `select hash from public.note_app_blobs`)).length, 0);
  } finally { net.release(); await net.web.close(); }
});
