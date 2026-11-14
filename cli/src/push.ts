// pinto push <folder> <note>: a web project's folder becomes the note's app, as when the folder is
// dropped on the note in Pinto Notes. Only the tools any AI has: list the app (create it if the
// note has none), read each file it replaces (the server's read-before-write), then one write with
// files: every file (text as text, the rest as base64) and a delete for each file the folder doesn't
// have, saved together as one version with one check (2026-11-16). A file bigger than one write
// carries goes first in pieces (write with offset and size), and its last piece comes with the rest.
// If everything doesn't fit in one write, it takes a few, index.html in the last.
import { type Mcp, ToolFailed } from "./client.ts";
import { encode, isBinary, type LocalFile, size, toBase64 } from "./files.ts";

export type Step = { path: string; bytes: number; binary: boolean; did: "created" | "replaced" | "unchanged" | "deleted" };
export type Pushed = { app: string; steps: Step[]; skipped: string[]; created_app: boolean; last: Record<string, any> | null; writes: number };

/** "Games/Doom", "Games/Doom.md", "Games/Doom.app/" → "Games/Doom". */
export const noteBase = (note: string) => note.trim().replace(/\/+$/, "").replace(/\.(app|md)$/i, "");

/** A failure: which file, the server's own words. */
export class PushFailed extends Error {}

/** What one write carries in file bytes (the server takes 10 MB of base64 bytes a write). */
export const WRITE_BYTES = 9 * 1024 * 1024;
/** A piece of a big file: 8 MB, two of the server's 4 MB parts, so a file sent again stores only
 *  the parts that changed. */
export const PIECE_BYTES = 8 * 1024 * 1024;

type Entry = { path: string; content?: string; content_base64?: string; offset?: number; size?: number; delete?: true };
const weight = (e: Entry) => e.content_base64 ? e.content_base64.length * 3 / 4 : 0;

export async function push(mcp: Pick<Mcp, "call">, files: LocalFile[], note: string, say: (line: string) => void = () => {}): Promise<Pushed> {
  if (!files.some((f) => f.path === "/index.html")) throw new PushFailed("The folder has no index.html at its top: that's the page the app opens.");
  const base = noteBase(note);
  // data.json in an app is its data (what the person keeps in it), not a file of the project.
  const skipped = files.filter((f) => f.path === "/data.json").map((f) => f.path);
  const local = files.filter((f) => f.path !== "/data.json");

  let created_app = false;
  let listing: { files?: { path: string; what?: string }[] };
  try {
    listing = await mcp.call("list", { path: `${base}.app`, limit: 1000 });
  } catch (e) {
    if (!(e instanceof ToolFailed)) throw e;
    // No app yet (or no note): create makes both, as an AI would.
    const made = await mcp.call("create", { type: "app", path: `${base}.md` });
    created_app = true;
    say(`Created ${made?.app ?? `${base}.app/`}`);
    listing = await mcp.call("list", { path: `${base}.app`, limit: 1000 });
  }
  const entries = (listing.files ?? []).filter((f) => !f.what);
  // The server spells the app's path (its case, its folder): use that from here on.
  const first = entries[0]?.path ?? `${base}.app/index.html`;
  const app = first.slice(0, first.toLowerCase().indexOf(".app/") + 4);
  const there = new Set(entries.map((f) => f.path.slice(app.length)));
  /** A tool call; a refusal names what it was about, in the server's words, and what was saved before it. */
  const call = async (tool: string, args: Record<string, unknown>, what: string, saved: number) => {
    try { return await mcp.call(tool, args); } catch (e) {
      throw new PushFailed(`${what}: ${(e as Error).message}${saved ? `\n(${saved} write${saved > 1 ? "s" : ""} before it were saved; each is in the app's history.)` : ""}`);
    }
  };

  // The server lets a file be replaced only after it was read in this session.
  for (const f of local) if (there.has(f.path)) await call("fetch", { id: `${app}${f.path}`, limit: 1 }, `${app}${f.path}`, 0);

  // Big files first, in pieces, all but the last (nothing is saved until the last piece comes).
  const list: Entry[] = [];
  for (const f of local) {
    if (isBinary(f.bytes) && f.bytes.length > WRITE_BYTES) {
      const last = Math.floor((f.bytes.length - 1) / PIECE_BYTES) * PIECE_BYTES;
      for (let at = 0; at < last; at += PIECE_BYTES) {
        await call("write", { path: `${app}${f.path}`, content_base64: toBase64(f.bytes.subarray(at, at + PIECE_BYTES)), offset: at, size: f.bytes.length }, `${app}${f.path}`, 0);
      }
      say(`  sent      ${f.path}  ${size(last)} of ${size(f.bytes.length)} in pieces`);
      list.push({ path: f.path, content_base64: toBase64(f.bytes.subarray(last)), offset: last, size: f.bytes.length });
    } else {
      list.push({ path: f.path, ...encode(f.bytes) });
    }
  }
  const keep = new Set(local.map((f) => f.path));
  for (const path of [...there].filter((p) => !keep.has(p) && p !== "/index.html").sort()) list.push({ path, delete: true });

  // As few writes as the bytes allow; index.html in the last, so the page goes live with its files.
  const page = list.find((e) => e.path === "/index.html")!;
  const batches: Entry[][] = [[]];
  for (const e of list.filter((x) => x !== page)) {
    const now = batches[batches.length - 1];
    if (now.length && now.reduce((s, x) => s + weight(x), 0) + weight(e) > WRITE_BYTES) batches.push([]);
    batches[batches.length - 1].push(e);
  }
  batches[batches.length - 1].push(page);

  const steps: Step[] = [];
  let last: Record<string, any> | null = null;
  let writes = 0;
  const byPath = new Map(local.map((f) => [f.path, f]));
  for (const batch of batches) {
    const r = await call("write", { path: app, files: batch }, `${app}/`, writes);
    writes++;
    if (!r?.unchanged) last = r;
    for (const d of r?.files ?? []) {
      const path = String(d.path).slice(app.length);
      const f = byPath.get(path);
      steps.push({ path, bytes: f?.bytes.length ?? 0, binary: f ? isBinary(f.bytes) : false, did: d.did });
      say(`  ${String(d.did).padEnd(9)} ${path}${f ? `  ${size(f.bytes.length)}${isBinary(f.bytes) ? ", binary" : ""}` : ""}`);
    }
  }
  return { app, steps, skipped, created_app, last, writes };
}
