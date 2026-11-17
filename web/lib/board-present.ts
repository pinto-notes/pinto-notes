// Presenting a shared board from the browser (app/s/[id]/BoardPage.tsx), as the app presents
// (CanvasPresentBar): what the More menu says Present will walk, the keys that step, and the style
// bar's place beside an open thread.
import type { PageState } from "./board-host";
import { showsBar } from "./board-style";

/** What Present will walk: "3 frames", "1 frame", or the whole board when it has none. */
export const presentHint = (frames: number) => frames > 1 ? `${frames} frames` : frames === 1 ? "1 frame" : "Whole board";

/** A key while presenting: the arrows, Space and Page Up/Down step; Escape ends. */
export function presentKey(key: string): "next" | "prev" | "stop" | null {
  if (key === "ArrowRight" || key === "ArrowDown" || key === "PageDown" || key === " ") return "next";
  if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp") return "prev";
  return key === "Escape" ? "stop" : null;
}

/** The style bar shows for a selection or a drawing tool, never over an open thread or its
 *  composer: the thread is what you're reading (round 13, web-06: the bar covered its foot). */
export const styleBarShows = (state: PageState, canEdit: boolean, threadOpen: boolean) => showsBar(state, canEdit) && !threadOpen;
