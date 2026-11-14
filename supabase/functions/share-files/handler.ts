// What share-files answers, given a database (index.ts serves it; handler.pglite.test.ts runs it
// on the whole schema in PGlite). index.ts says what each request is for.

import type { Sql } from "npm:postgres@3.4.5";
import { log } from "../_shared/log.ts";
import { contentDisposition, filePath, parseRequest, pictureHeaders, referencedFiles, servedType } from "./logic.ts";

const headers = { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" };
export const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

/** Answers one GET for a shared page's files or its board's picture. */
export async function answer(sql: Sql, url: URL): Promise<Response> {
  const asked = parseRequest(url);
  if (!asked) return reply({ error: "not found" }, 404);
  try {
    switch (asked.kind) {
      case "list": return await list(sql, asked.slug, asked.sub);
      case "file": return await bytes(sql, asked.slug, asked.sub, asked.file);
      case "picture": return await picture(sql, asked.slug);
    }
  } catch {
    log(asked.kind === "list" ? "share_files_list" : asked.kind === "file" ? "share_files_get" : "share_picture_get", { status: 500 });
    return reply({ error: "unavailable" }, 500);
  }
}

/** The files the page embeds, with the address each one is served at. */
async function list(sql: Sql, slug: string, sub: string | null): Promise<Response> {
  const [row] = await sql<{ page: { body: string } | null }[]>`select public.shared_note(${slug}, ${sub}::uuid) as page`;
  if (!row?.page) return reply({ error: "not found" }, 404);
  const ids = referencedFiles(row.page.body);
  if (ids.length === 0) return reply({ files: {} });
  const rows = await sql<{ attachment_id: string; filename: string; content_type: string; size: string }[]>`
    select attachment_id, filename, content_type, size from public.note_share_files
    where slug = ${slug} and attachment_id = any(${ids}::uuid[])`;
  const files: Record<string, { path: string; name: string; type: string; size: number }> = {};
  for (const f of rows) {
    files[f.attachment_id] = { path: filePath(slug, f.attachment_id, sub), name: f.filename, type: f.content_type, size: Number(f.size) };
  }
  return reply({ files });
}

/** One file's bytes, when the page embeds it. */
async function bytes(sql: Sql, slug: string, sub: string | null, file: string): Promise<Response> {
  const [f] = await sql<{ filename: string; content_type: string; content: Uint8Array }[]>`
    select filename, content_type, content from public.shared_file(${slug}, ${sub}::uuid, ${file}::uuid)`;
  if (!f) return reply({ error: "not found" }, 404);
  const { type, inline } = servedType(f.content_type, f.filename);
  const body = new Uint8Array(f.content);
  return new Response(body, {
    headers: {
      "content-type": type,
      "content-length": String(body.byteLength),
      "content-disposition": contentDisposition(f.filename, inline),
      "x-content-type-options": "nosniff",
      // Short: Stop Sharing takes the file down within a minute.
      "cache-control": "private, max-age=60",
      "access-control-allow-origin": "*",
      "cross-origin-resource-policy": "cross-origin",
    },
  });
}

/** A shared board's picture, while its page shows. Any version gets the current one: the version in
 *  the address is only there so a new picture is a new address. */
async function picture(sql: Sql, slug: string): Promise<Response> {
  const [p] = await sql<{ content: Uint8Array }[]>`select content from public.shared_picture(${slug})`;
  if (!p) return reply({ error: "not found" }, 404);
  const body = new Uint8Array(p.content);
  return new Response(body, { headers: pictureHeaders(body.byteLength) });
}
