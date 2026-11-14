// A note app's binary files, stored once each (note_app_blobs, 20261115090000_note_app_blobs.sql).
// The sealed project names a binary file by a keyed hash of its bytes, {"hash", "size"}, or a file
// over PART_BYTES by the hashes of its parts in order, {"size", "parts": [{"hash", "size"}, …]}
// (2026-11-16). An older project holds the packed bytes themselves, which stays valid.
//
// The tools keep a project's binary files as these names: a file's bytes are stored the moment they
// arrive (putBinary, in the same transaction as the save, so a refused save stores nothing) and read
// only when something needs them (fetch with raw, the render service). So a 60 MB disk image costs
// a request that edits a text file nothing, and no request holds more than a part or two of it.
import { type Binary, type BlobRef, isBlobRef, isPartsRef, MAX_BINARY_BYTES, packBytes, PART_BYTES, partsOf, type Project, parseStored, serialize, unpackBinary, unpackBytes } from "./app_project.ts";
import { ToolError, type Call, type Tx } from "./tools.ts";

export type { BlobRef } from "./app_project.ts";
export { isBlobRef } from "./app_project.ts";

/** The hashes a stored project names, parts included (what note_pages.page_blobs holds for it). */
export function blobNames(stored: string | null): string[] {
  if (!stored || !stored.trimStart().startsWith("{")) return [];
  try {
    const binary = JSON.parse(stored)?.binary;
    if (!binary || typeof binary !== "object") return [];
    return [...new Set(Object.values(binary as Record<string, Binary>).flatMap((v) => partsOf(v).map((r) => r.hash)))].sort();
  } catch {
    return [];
  }
}

/** A sealed project, opened. Binary files stay names; their bytes are read when they're needed. */
export async function openProject(_tx: Tx, c: Call, noteId: string, box: string): Promise<Project> {
  let text: string;
  try { text = await c.v.openPage(noteId, box); } catch { throw new ToolError("This note's app can't be opened with this connection's key."); }
  return parseStored(text);
}

/** Stores one part's bytes under its name, unless the account has it. */
async function putPart(tx: Tx, c: Call, bytes: Uint8Array, have?: Set<string>): Promise<BlobRef> {
  const ref = { hash: await c.v.blobName(bytes), size: bytes.length };
  const there = have?.has(ref.hash) ||
    (await tx<{ hash: string }[]>`select hash from public.note_app_blobs where hash = ${ref.hash}`).length > 0;
  if (!there) {
    // Counted toward the account's storage by the table's trigger (pane_app_blob_guard): over the
    // limit, the database refuses it and the whole save with it.
    const sealed = await c.v.sealBlob(ref.hash, await packBytes(bytes));
    await tx`insert into public.note_app_blobs (hash, blob_ct) values (${ref.hash}, ${sealed}) on conflict do nothing`;
  }
  have?.add(ref.hash);
  return ref;
}

/** A binary file's bytes stored apart, in parts of PART_BYTES, as the project names it. */
export async function putBinary(tx: Tx, c: Call, bytes: Uint8Array): Promise<Binary> {
  if (bytes.length > MAX_BINARY_BYTES) throw new ToolError(`The file is ${(bytes.length / 1048576).toFixed(1)} MB; a binary file can be at most ${MAX_BINARY_BYTES / 1048576} MB.`);
  if (bytes.length <= PART_BYTES) return await putPart(tx, c, bytes);
  const parts: BlobRef[] = [];
  for (let at = 0; at < bytes.length; at += PART_BYTES) parts.push(await putPart(tx, c, bytes.subarray(at, at + PART_BYTES)));
  return { size: bytes.length, parts };
}

/** Parts stored for a file that arrives in pieces (write with offset): each piece cut at the file's
 *  own PART_BYTES boundaries, so the parts are the ones putBinary makes from the whole file. */
export async function putPiece(tx: Tx, c: Call, bytes: Uint8Array, offset: number): Promise<{ at: number; parts: BlobRef[] }[]> {
  const out: { at: number; parts: BlobRef[] }[] = [];
  let at = offset;
  while (at < offset + bytes.length) {
    const end = Math.min(offset + bytes.length, (Math.floor(at / PART_BYTES) + 1) * PART_BYTES);
    out.push({ at, parts: [await putPart(tx, c, bytes.subarray(at - offset, end - offset))] });
    at = end;
  }
  return out;
}

/** A file named by its parts, in order: one name for a file of one part. */
export const refOf = (parts: BlobRef[]): Binary => parts.length === 1 ? parts[0] : { size: parts.reduce((n, p) => n + p.size, 0), parts };

/** One stored part's packed bytes, opened. */
export async function packedPart(tx: Tx, c: Call, hash: string): Promise<Uint8Array> {
  const [row] = await tx<{ blob_ct: string }[]>`select blob_ct from public.note_app_blobs where hash = ${hash}`;
  if (!row) throw new ToolError("A file of this app is missing on the server. Restore an earlier version (history), or write the file again.");
  try { return await c.v.openBlob(hash, row.blob_ct); } catch { throw new ToolError("This note's app can't be opened with this connection's key."); }
}

/** A binary file's bytes, refused past `max`. */
export async function binaryBytes(tx: Tx, c: Call, v: Binary, max = MAX_BINARY_BYTES): Promise<Uint8Array> {
  if (typeof v === "string") return await unpackBinary(v, max);
  const size = isPartsRef(v) || isBlobRef(v) ? v.size : NaN;
  if (!(size <= max)) throw new RangeError(`over ${max / 1048576} MB`);
  const out = new Uint8Array(size);
  let at = 0;
  for (const part of partsOf(v)) {
    const bytes = await unpackBytes(await packedPart(tx, c, part.hash), part.size);
    out.set(bytes, at);
    at += bytes.length;
  }
  return out;
}

/** Bytes from..to of a binary file, reading only the parts they're in. */
export async function binaryRange(tx: Tx, c: Call, v: Binary, from: number, to: number): Promise<Uint8Array> {
  if (typeof v === "string") return (await unpackBinary(v)).slice(from, to);
  const out = new Uint8Array(Math.max(0, to - from));
  let at = 0;
  for (const part of partsOf(v)) {
    const end = at + part.size;
    if (end > from && at < to) {
      const bytes = await unpackBytes(await packedPart(tx, c, part.hash), part.size);
      const a = Math.max(from, at), b = Math.min(to, end);
      out.set(bytes.subarray(a - at, b - at), a - from);
    }
    at = end;
  }
  return out;
}

/** The project as it's sealed: every binary file stored apart and named. Bytes still inside it (an
 *  older app's) are stored now. Returns the text to seal and the names, for page_blobs/draft_blobs. */
export async function storeProject(tx: Tx, c: Call, p: Project): Promise<{ stored: string; blobs: string[] }> {
  const binary: Record<string, Binary> = {};
  for (const [path, v] of Object.entries(p.binary ?? {})) binary[path] = typeof v === "string" ? await putBinary(tx, c, await unpackBinary(v)) : v;
  const names = [...new Set(Object.values(binary).flatMap((v) => partsOf(v).map((r) => r.hash)))].sort();
  return { stored: serialize({ ...p, ...(Object.keys(binary).length ? { binary } : {}) }), blobs: names };
}

/** For the render service, which keeps the parts it was sent for a while (scripts/page-render):
 *  sends each part it asks for, one at a time. */
export const supplier = (tx: Tx, c: Call) => async (hashes: string[], send: (hash: string, packed: Uint8Array) => Promise<void>) => {
  for (const hash of hashes) await send(hash, await packedPart(tx, c, hash));
};
