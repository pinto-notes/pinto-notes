// A note app's binary files, stored once each (note_app_blobs, 20261115090000_note_app_blobs.sql).
// The sealed project names a binary file by a keyed hash of its bytes, {"hash", "size"}; an older
// project holds the packed bytes themselves, which stays valid. The tools work on the packed bytes:
// openProject puts them in, storeProject takes them out again, so every other part of the app tools
// (edits, checks, the render service) sees the project as it always has.
import { fromBase64, toBase64 } from "../_shared/e2ee.ts";
import { type Project, parseStored, serialize, unpackBinary } from "./app_project.ts";
import { ToolError, type Call, type Tx } from "./tools.ts";

export type BlobRef = { hash: string; size: number };
export const isBlobRef = (v: unknown): v is BlobRef =>
  !!v && typeof v === "object" && typeof (v as BlobRef).hash === "string" && /^[0-9a-f]{64}$/.test((v as BlobRef).hash) && typeof (v as BlobRef).size === "number";

/** The hashes a stored project names (what note_pages.page_blobs holds for it). */
export function blobNames(stored: string | null): string[] {
  if (!stored || !stored.trimStart().startsWith("{")) return [];
  try {
    const binary = JSON.parse(stored)?.binary;
    if (!binary || typeof binary !== "object") return [];
    return [...new Set(Object.values(binary).filter(isBlobRef).map((r) => r.hash))].sort();
  } catch {
    return [];
  }
}

// Which packed bytes came from which stored file, so saving again doesn't hash them again. Bounded:
// a request holds a few apps at most.
const known = new Map<string, BlobRef>();
function remember(packed: string, ref: BlobRef) {
  known.delete(packed);
  known.set(packed, ref);
  while (known.size > 64) known.delete(known.keys().next().value!);
}

/** A sealed project, opened, with its binary files' packed bytes in place of their names. */
export async function openProject(tx: Tx, c: Call, noteId: string, box: string): Promise<Project> {
  let text: string;
  try { text = await c.v.openPage(noteId, box); } catch { throw new ToolError("This note's app can't be opened with this connection's key."); }
  return await withPacked(tx, c, parseStored(text));
}

/** The same project text with every named file's packed bytes in it (for the render service, which takes a whole project). */
export async function inlineStored(tx: Tx, c: Call, stored: string): Promise<string> {
  if (!blobNames(stored).length) return stored;
  return serialize(await withPacked(tx, c, parseStored(stored)));
}

async function withPacked(tx: Tx, c: Call, p: Project): Promise<Project> {
  const binary = p.binary as Record<string, unknown> | undefined;
  const names = [...new Set(Object.values(binary ?? {}).filter(isBlobRef).map((r) => r.hash))];
  if (!names.length) return p;
  const rows = await tx<{ hash: string; blob_ct: string }[]>`select hash, blob_ct from public.note_app_blobs where hash = any(${names}::text[])`;
  const packed = new Map<string, string>();
  for (const r of rows) {
    try { packed.set(r.hash, toBase64(await c.v.openBlob(r.hash, r.blob_ct))); } catch { throw new ToolError("This note's app can't be opened with this connection's key."); }
  }
  const out: Record<string, string> = {};
  for (const [path, v] of Object.entries(binary!)) {
    if (!isBlobRef(v)) { out[path] = v as string; continue; }
    const bytes = packed.get(v.hash);
    if (bytes === undefined) throw new ToolError(`${path} of this app is missing on the server. Restore an earlier version (history), or write the file again.`);
    remember(bytes, v);
    out[path] = bytes;
  }
  return { ...p, binary: out };
}

/**
 * The project as it's sealed: each binary file stored once (sent only if the account doesn't have
 * it yet) and named by its hash. Returns the text to seal and the names, for page_blobs/draft_blobs.
 */
export async function storeProject(tx: Tx, c: Call, p: Project): Promise<{ stored: string; blobs: string[] }> {
  const entries = Object.entries(p.binary ?? {});
  if (!entries.length) return { stored: serialize(p), blobs: [] };
  const refs: Record<string, BlobRef> = {};
  const fresh = new Map<string, string>();
  for (const [path, packed] of entries) {
    let ref = known.get(packed);
    if (!ref) {
      const bytes = await unpackBinary(packed);
      ref = { hash: await c.v.blobName(bytes), size: bytes.length };
      remember(packed, ref);
    }
    refs[path] = ref;
    fresh.set(ref.hash, packed);
  }
  const names = [...fresh.keys()].sort();
  const have = new Set((await tx<{ hash: string }[]>`select hash from public.note_app_blobs where hash = any(${names}::text[])`).map((r) => r.hash));
  for (const hash of names) {
    if (have.has(hash)) continue;
    const sealed = await c.v.sealBlob(hash, fromBase64(fresh.get(hash)!));
    await tx`insert into public.note_app_blobs (hash, blob_ct) values (${hash}, ${sealed}) on conflict do nothing`;
  }
  return { stored: serialize({ ...p, binary: refs as unknown as Record<string, string> }), blobs: names };
}
