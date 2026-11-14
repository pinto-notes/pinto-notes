// Reads a shared note through the public RPC and the share-files function.
import { appURL } from "./app-scheme";
import { functionRegion } from "./mcp-proxy";
import type { SharedFile } from "./render";

export type SharedNote = {
  title: string;
  body: string;
  updated_at: string;
  include_subnotes: boolean;
  is_sub: boolean;
  root_title: string;
  subnotes: { id: string; title: string }[];
  /** Who shared it. No account id; the email is left out when it's an Apple relay address. */
  shared_by?: { name: string | null; email: string | null; avatar: string | null } | null;
  /** A shared whiteboard's picture (a PNG at 2x, published from the owner's device): its size in
   *  pixels and the version its address carries. Null for a note, or a board not drawn here yet. */
  picture?: { width: number; height: number; version: number } | null;
  /** A shared whiteboard's scene (its .excalidraw file, published beside the picture): its size in
   *  bytes and the version its address carries. Null for a note, or a board with none yet. */
  scene?: { size: number; version: number } | null;
};

/** A shared whiteboard as its page shows it: the picture's address (also what a tap opens, full
 *  size), its size on the page (half its pixels, so it's sharp on a 2x screen), what it says, for
 *  the alt text and the description, and its .excalidraw file's address when there is one. */
export type BoardPicture = { url: string; width: number; height: number; alt: string; words: string[]; download: string | null };

const URL_ = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const REGION = functionRegion(process.env.FUNCTION_REGION);

const SLUG = /^[A-Za-z0-9_-]{24,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const validSlug = (s: string) => SLUG.test(s);

/** A profile photo's public URL. Photos have random names, so the URL says nothing about the account. */
export function avatarURL(name: string | null | undefined): string | null {
  if (!name || !/^[0-9a-f]{32}\.(jpg|png)$/.test(name) || !URL_) return null;
  return `${URL_}/storage/v1/object/public/avatars/${name}`;
}
export const validSub = (s: string) => UUID.test(s);

/** The address of a shared board's picture, relative to the Supabase URL (as share-files serves it). */
export const picturePath = (slug: string, version: number) =>
  `/functions/v1/share-files?${new URLSearchParams({ slug, picture: String(Math.trunc(version)) })}`;

/** The address of a shared board's scene, its .excalidraw file (share-files logic.ts scenePath). */
export const scenePath = (slug: string, version: number) =>
  `/functions/v1/share-files?${new URLSearchParams({ slug, scene: String(Math.trunc(version)) })}`;

/** A shared note is a whiteboard: it has a picture or a scene. */
export const isBoard = (note: SharedNote) => !!note.picture || !!note.scene;

/** A board's words from its copy: the app writes its title, then one paragraph a word, escaped. */
export function boardWords(body: string): string[] {
  const rest = body.replace(/^\s*\n/, "").split("\n").slice(1).join("\n");
  return rest.split(/\n\s*\n/).map((w) => w.replace(/\\(.)/g, "$1").replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** What the picture says to someone who can't see it: the board's words, or that it's a drawing. */
export function boardAlt(words: string[]): string {
  const said = words.join(", ");
  if (!said) return "Whiteboard drawing";
  const alt = `Whiteboard drawing: ${said}`;
  return alt.length > 600 ? alt.slice(0, 599).trimEnd() + "…" : alt;
}

/** A shared note's board picture, or null when it has none. */
export function boardPicture(slug: string, note: SharedNote, base = URL_): BoardPicture | null {
  const p = note.picture;
  if (!p || !base || !(p.width > 0 && p.height > 0 && Number.isFinite(p.version))) return null;
  const words = boardWords(note.body);
  const c = note.scene;
  const download = c && c.size > 0 && Number.isFinite(c.version) ? base + scenePath(slug, c.version) : null;
  return { url: base + picturePath(slug, p.version), width: Math.max(1, Math.round(p.width / 2)), height: Math.max(1, Math.round(p.height / 2)), alt: boardAlt(words), words, download };
}

export async function sharedNote(slug: string, sub?: string): Promise<SharedNote | null> {
  if (!validSlug(slug) || (sub !== undefined && !validSub(sub)) || !URL_ || !KEY) return null;
  const res = await fetch(`${URL_}/rest/v1/rpc/shared_note`, {
    method: "POST",
    headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p_slug: slug, p_sub: sub ?? null }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as SharedNote | null;
}

export async function sharedFiles(slug: string, sub?: string): Promise<Record<string, SharedFile>> {
  if (!URL_) return {};
  const q = new URLSearchParams({ slug, ...(sub ? { sub } : {}) });
  const res = await fetch(`${URL_}/functions/v1/share-files?${q}`, {
    // This runs on Vercel, wherever that is: name the region the function works in.
    headers: { apikey: KEY, authorization: `Bearer ${KEY}`, ...(REGION ? { "x-region": REGION } : {}) },
    cache: "no-store",
  });
  if (!res.ok) return {};
  const { files } = (await res.json()) as { files: Record<string, { path: string; name: string; type: string; size: number }> };
  return Object.fromEntries(Object.entries(files).map(([id, f]) => [id, { url: URL_ + f.path, name: f.name, type: f.type, size: f.size }]));
}

/** A shared note's markdown as another person can keep it: photos and files stay with their owner
 * (their links only work on the share page), and sub-note links become their names. */
export function copyableMarkdown(body: string): string {
  return body
    .replace(/!?\[[^\]]*\]\(pane-file:[0-9a-f-]{36}\)[ \t]*/gi, "")
    .replace(/\[([^\]]*)\]\(pane-note:[0-9a-f-]{36}\)/gi, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/, "") + "\n";
}

/** The universal link for "Use this note", and a board's "Copy to Pinto Notes"
 *  (https://ambernotes.app/open/copy/<slug>): the app adds a copy to the visitor's notes. */
export const copyLink = (slug: string) => `/open/copy/${slug}`;
/** The app's own link for it, which "Use this note" tries from the note's page. */
export const copyAppLink = (slug: string) => appURL(`copy/${slug}`);
