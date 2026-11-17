// A shared whiteboard's page follows the board while it's open (BoardLive.tsx). The pieces that
// aren't React: how often it asks, what it asks, and the addresses a new version is served at.
// No "use client" here, so the note's page (a server component) can use them too.
import type { BoardPicture } from "./shared";

/** What app/api/shared/[slug] answers for a shared page. */
export type BoardMeta = {
  title: string;
  updated_at: string;
  alt: string;
  picture: { version: number; width: number; height: number } | null;
  scene: { version: number; size: number } | null;
};

/** How often an open, visible page asks: every 5 s, then every 30 s once nothing has changed for
 *  10 minutes. The app republishes 2 s after a change, so a change shows within about 7 s. */
export const LIVE = { fast: 5_000, slow: 30_000, quietAfter: 10 * 60_000, shownFor: 4_000 } as const;

export const liveDelay = (sinceChange: number) => (sinceChange >= LIVE.quietAfter ? LIVE.slow : LIVE.fast);

/** Where the page asks. Same origin, so the page's connect-src 'self' covers it. */
export const livePath = (slug: string) => `/api/shared/${encodeURIComponent(slug)}`;

/** "14 November 2026": the day a shared note was last edited. */
export function editedDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** The address of one version of the board's picture or scene: share-files serves either at the
 *  picture's address with its version swapped (shared.ts picturePath, scenePath). */
export function versionURL(pictureURL: string, kind: "picture" | "scene", version: number): string {
  const u = new URL(pictureURL);
  u.searchParams.delete("picture");
  u.searchParams.delete("scene");
  u.searchParams.set(kind, String(Math.trunc(version)));
  return u.toString();
}

/** The board as the page shows it after a new version, or null when there's no picture to show. */
export function nextBoard(current: BoardPicture, meta: BoardMeta): BoardPicture | null {
  const p = meta.picture;
  if (!p || !(p.width > 0 && p.height > 0 && Number.isFinite(p.version))) return null;
  const c = meta.scene;
  return {
    ...current,
    url: versionURL(current.url, "picture", p.version),
    width: Math.max(1, Math.round(p.width / 2)),
    height: Math.max(1, Math.round(p.height / 2)),
    alt: meta.alt || current.alt,
    download: c && c.size > 0 && Number.isFinite(c.version) ? versionURL(current.url, "scene", c.version) : null,
  };
}

/** The picture's version from its address. */
export function shownVersion(board: BoardPicture): number | null {
  const v = Number(new URL(board.url).searchParams.get("picture"));
  return Number.isFinite(v) ? v : null;
}
