// pinto push <folder> <note>: a web project's folder becomes the note's app, as when the folder is
// dropped on the note in Pinto Notes. Only the tools any AI has: list the app (create it if the
// note has none), read each file it replaces (the server's read-before-write), write every file
// (text as text, the rest as base64), then delete what the folder doesn't have.
import { type Mcp, ToolFailed } from "./client.ts";
import { encode, isBinary, type LocalFile, size } from "./files.ts";

export type Step = { path: string; bytes: number; binary: boolean; did: "created" | "replaced" | "unchanged" | "deleted" };
export type Pushed = { app: string; steps: Step[]; skipped: string[]; created_app: boolean; last: Record<string, any> | null };

/** "Games/Doom", "Games/Doom.md", "Games/Doom.app/" → "Games/Doom". */
export const noteBase = (note: string) => note.trim().replace(/\/+$/, "").replace(/\.(app|md)$/i, "");

/** A failure of one file: which, and the server's own words. */
export class PushFailed extends Error {}

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

  // index.html last, so the page goes live with its files already there.
  const order = [...local.filter((f) => f.path !== "/index.html"), ...local.filter((f) => f.path === "/index.html")];
  const steps: Step[] = [];
  let last: Record<string, any> | null = null;
  const attempt = async <T>(path: string, run: () => Promise<T>): Promise<T> => {
    try { return await run(); } catch (e) {
      const done = steps.filter((s) => s.did !== "unchanged").length;
      throw new PushFailed(`${app}${path}: ${(e as Error).message}${done ? `\n(${done} change${done > 1 ? "s" : ""} before it were saved; each is in the app's history.)` : ""}`);
    }
  };
  for (const f of order) {
    const binary = isBinary(f.bytes);
    const existed = there.has(f.path);
    const r = await attempt(f.path, async () => {
      // The server lets a file be replaced only after it was read in this session.
      if (existed) await mcp.call("fetch", { id: `${app}${f.path}`, limit: 1 });
      return await mcp.call("write", { path: `${app}${f.path}`, ...encode(f.bytes) });
    });
    const did = r?.unchanged ? "unchanged" : existed ? "replaced" : "created";
    if (did !== "unchanged") last = r;
    steps.push({ path: f.path, bytes: f.bytes.length, binary, did });
    say(`  ${did.padEnd(9)} ${f.path}  ${size(f.bytes.length)}${binary ? ", binary" : ""}`);
  }
  const keep = new Set(local.map((f) => f.path));
  for (const path of [...there].filter((p) => !keep.has(p) && p !== "/index.html").sort()) {
    last = await attempt(path, () => mcp.call("delete", { path: `${app}${path}` }));
    steps.push({ path, bytes: 0, binary: false, did: "deleted" });
    say(`  deleted   ${path}`);
  }
  return { app, steps, skipped, created_app, last };
}
