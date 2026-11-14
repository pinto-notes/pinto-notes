// An app's binary files arrive here as their parts (2026-11-16): the MCP server sends a project that
// names its binary files ({"hash", "size"} or {"size", "parts": […]}, app_project.ts), and the
// parts' packed bytes once each (PUT /parts/<hash>). They're kept in memory for a while, so a save's
// three or four renders (the views, the tests, a second test run, the smoke check) send a 60 MB disk
// image once, not four times, and a render request stays small.
//
// Kept: at most MAX_KEPT bytes, each part for KEEP_MS after it was last used, and nothing on disk.
// A part's name is a keyed hash of its bytes in one account (no one else can name it).
import { type Binary, isBlobRef, isPartsRef, partsOf, unpackBinary, unpackBytes } from "../../supabase/functions/mcp/app_project.ts";

export const MAX_PART = 8 * 1024 * 1024;
const MAX_KEPT = 1024 * 1024 * 1024;
const KEEP_MS = 30 * 60 * 1000;
const kept = new Map<string, { packed: Uint8Array; used: number }>();
let total = 0;

function tidy(now = Date.now()) {
  for (const [hash, p] of kept) {
    if (total <= MAX_KEPT && now - p.used < KEEP_MS) break;
    kept.delete(hash);
    total -= p.packed.length;
  }
}

export function putPart(hash: string, packed: Uint8Array) {
  if (!/^[0-9a-f]{64}$/.test(hash) || packed.length > MAX_PART) return false;
  const was = kept.get(hash);
  if (was) { kept.delete(hash); total -= was.packed.length; }
  kept.set(hash, { packed, used: Date.now() });
  total += packed.length;
  tidy();
  return true;
}

/** The parts a stored project names that aren't kept here. */
export function missingParts(stored: string): string[] {
  if (!stored.trimStart().startsWith("{") || !stored.includes('"amberApp"')) return [];
  let binary: Record<string, Binary> = {};
  try { binary = JSON.parse(stored)?.binary ?? {}; } catch { return []; }
  const now = Date.now();
  const missing = new Set<string>();
  for (const v of Object.values(binary)) {
    for (const part of partsOf(v)) {
      const p = kept.get(part.hash);
      if (!p) { missing.add(part.hash); continue; }
      // Just used: to the back of the line.
      kept.delete(part.hash);
      kept.set(part.hash, { ...p, used: now });
    }
  }
  return [...missing];
}

/** A binary file's bytes, whichever way the project holds it. */
export async function binaryBytes(v: Binary): Promise<Uint8Array> {
  if (typeof v === "string") return await unpackBinary(v);
  if (!isBlobRef(v) && !isPartsRef(v)) throw new Error("not a file");
  const out = new Uint8Array(v.size);
  let at = 0;
  for (const part of partsOf(v)) {
    const p = kept.get(part.hash);
    if (!p) throw new Error("a part of it wasn't sent");
    const bytes = await unpackBytes(p.packed, part.size);
    out.set(bytes, at);
    at += bytes.length;
  }
  return out;
}
