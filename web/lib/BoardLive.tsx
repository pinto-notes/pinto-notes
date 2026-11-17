"use client";

// A shared whiteboard's page follows the board while it's open: the app republishes its picture
// 2 s after a change, and the page asks for the current version every few seconds while it's
// visible (board-live.ts LIVE), never while hidden. A new version is loaded first, then swapped in
// with its size, so nothing jumps; the Edited line, the title and the .excalidraw link follow, and
// "Updated just now" shows for a few seconds. When the link stops showing the board (Stop Sharing,
// locked, deleted), the picture gives way to a line that says so. No websockets.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { editedDay, LIVE, liveDelay, livePath, nextBoard, shownVersion, type BoardMeta } from "./board-live";
import type { BoardPicture } from "./shared";
import s from "./note-page.module.css";

type Live = {
  board: BoardPicture;
  title: string;
  updatedAt: string;
  /** The link no longer shows the board. */
  gone: boolean;
  /** How many new pictures were swapped in: each one plays the fade once (and says so). */
  fresh: number;
  /** "Updated just now" is showing. */
  justNow: boolean;
};

const LiveContext = createContext<Live | null>(null);

export function BoardLive({ slug, board, title, updatedAt, children }: {
  slug: string; board: BoardPicture; title: string; updatedAt: string; children: React.ReactNode;
}) {
  const [live, setLive] = useState<Live>({ board, title, updatedAt, gone: false, fresh: 0, justNow: false });
  const first = useRef({ board, title, updatedAt });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let asking: AbortController | null = null;
    let done = false;
    let lastChange = Date.now();
    let version = shownVersion(first.current.board);
    let loading: number | null = null;
    let { title, updatedAt } = first.current;
    let download = first.current.board.download;
    const visible = () => document.visibilityState !== "hidden";

    const later = () => {
      clearTimeout(timer);
      timer = undefined;
      if (!done && visible()) timer = setTimeout(ask, liveDelay(Date.now() - lastChange));
    };

    const take = (meta: BoardMeta) => {
      if (meta.updated_at !== updatedAt || meta.title !== title) {
        ({ title, updated_at: updatedAt } = meta);
        lastChange = Date.now();
        setLive((l) => ({ ...l, title, updatedAt }));
      }
      const next = nextBoard(first.current.board, meta);
      if (!next) return; // No picture right now: keep showing the last one.
      const v = meta.picture!.version;
      if (v !== version) {
        if (v === loading) return;
        // Load it before showing it, so the old picture stays until the new one can take its place.
        loading = v;
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        img.onload = () => {
          if (done || loading !== v) return;
          loading = null;
          version = v;
          download = next.download;
          lastChange = Date.now();
          setLive((l) => ({ ...l, board: next, fresh: l.fresh + 1, justNow: true }));
        };
        img.onerror = () => { if (loading === v) loading = null; };
        img.src = next.url;
      } else if (next.download !== download) {
        download = next.download;
        setLive((l) => ({ ...l, board: { ...l.board, download: next.download } }));
      }
    };

    async function ask() {
      timer = undefined;
      if (asking || done || !visible()) return;
      const mine = (asking = new AbortController());
      try {
        const res = await fetch(livePath(slug), { cache: "no-store", signal: mine.signal, headers: { accept: "application/json" } });
        if (res.status === 404) {
          done = true;
          setLive((l) => ({ ...l, gone: true, justNow: false }));
          return;
        }
        if (res.ok) take((await res.json()) as BoardMeta);
      } catch {
        // Offline, or the tab was hidden mid-ask: ask again later.
      } finally {
        if (asking === mine) asking = null;
        later();
      }
    }

    const onVisibility = () => {
      clearTimeout(timer);
      timer = undefined;
      if (visible()) {
        // Back on the page: ask now, and start the quiet clock over.
        lastChange = Date.now();
        void ask();
      } else {
        asking?.abort();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    later();
    return () => {
      done = true;
      clearTimeout(timer);
      asking?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug]);

  // "Updated just now" for a few seconds after each new picture.
  useEffect(() => {
    if (!live.fresh) return;
    const t = setTimeout(() => setLive((l) => ({ ...l, justNow: false })), LIVE.shownFor);
    return () => clearTimeout(t);
  }, [live.fresh]);

  useEffect(() => {
    if (live.title !== first.current.title) document.title = `${live.title} · Pinto Notes`;
  }, [live.title]);

  return <LiveContext.Provider value={live}>{children}</LiveContext.Provider>;
}

const useLive = () => useContext(LiveContext);

export function LiveTitle({ className }: { className?: string }) {
  const live = useLive();
  return <h1 className={className}>{live?.title}</h1>;
}

/** "Edited 14 November 2026", then "· Updated just now" for a few seconds after a new picture. */
export function LiveEdited() {
  const live = useLive();
  if (!live) return null;
  return (
    <span className={s.bylineDate}>
      Edited {editedDay(live.updatedAt)}
      <span className={s.justNow} role="status">
        {live.justNow && <><span aria-hidden="true"> · </span>Updated just now</>}
      </span>
    </span>
  );
}

/** What the page is: a picture of the board that follows it. Gone with the board. */
export function LiveViewOnly() {
  const live = useLive();
  if (!live || live.gone) return null;
  return <span className={s.bylineNote}>View only. Changes show here as they&rsquo;re made.</span>;
}

/// A shared whiteboard's picture: large and centred, on the board's own light ground in light and
/// dark, at half its pixels so it's sharp on a 2x screen. Its words are its alt text. A tap or click
/// opens it full size in the browser's own image view, where a phone pinches to zoom and pans
/// (whiteboard council, round 3: on a phone its cards' words were too small to read); narrow
/// screens say so. Its .excalidraw file is under it, when the board's device published one.
export function LiveBoardFigure() {
  const live = useLive();
  if (!live) return null;
  if (live.gone) {
    return (
      <div className={s.board}>
        <p className={s.boardGone} role="status">This whiteboard is no longer shared.</p>
      </div>
    );
  }
  const { board, fresh } = live;
  // Two names for the same fade, so each new picture restarts it on the same element.
  const fade = fresh === 0 ? undefined : fresh % 2 ? s.freshA : s.freshB;
  return (
    <figure className={s.board}>
      <div className={s.boardFrame}>
        <a className={s.boardOpen} href={board.url} title="Open full size">
          <img className={fade} src={board.url} alt={board.alt} width={board.width} height={board.height} decoding="async" fetchPriority="high" referrerPolicy="no-referrer" />
          <span className={s.zoomHint}>Tap to zoom</span>
        </a>
        {board.download && (
          <figcaption className={s.boardFoot}>
            <a className={s.download} href={board.download} download rel="nofollow">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.5v8M3.5 6 7 9.5 10.5 6M2 12.5h10" /></svg>
              Download .excalidraw
            </a>
          </figcaption>
        )}
      </div>
    </figure>
  );
}
