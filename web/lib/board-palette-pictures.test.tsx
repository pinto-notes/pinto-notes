// @vitest-environment happy-dom
// Pictures of the browser board's tools for Emil (17 November 2026), drawn only when EMIL_SHOTS
// names a folder: the real palette, zoom corner and top bar, with the board's real stylesheet, as a
// page (web-board-<state>.html) the app's tests photograph offscreen, light and dark
// (CanvasToolPaletteTests.theBrowserBoardsPictures). The board itself is a frame from the site
// and needs a live board, so the drawing here is a stand-in.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";
import s from "@/app/s/[id]/board.module.css";
import { Icon, ToolBar, TOOLS, ZoomControl } from "@/app/s/[id]/BoardControls";
import type { PageState } from "./board-host";

const out = process.env.EMIL_SHOTS;

/** The stylesheet with its class names as the test's renderer writes them (`_name_<hash>`). */
function css(): string {
  const hash = String(s.tool).split("_").pop();
  const text = readFileSync(join(process.cwd(), "app", "s", "[id]", "board.module.css"), "utf8");
  return text.replace(/\.(?=[a-zA-Z])([a-zA-Z][\w-]*)/g, (_, name: string) => `._${name}_${hash}`);
}

function page(state: PageState, width: number, height: number): string {
  const nothing = () => {};
  const body = renderToStaticMarkup(
    <div className={s.board}>
      {/* A stand-in for the drawing: a box and an arrow, as the board's own test drawing. */}
      <svg style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} width="520" height="200" viewBox="0 0 520 200" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <rect x="10" y="40" width="250" height="130" rx="4" />
        <path d="M330 105h170m0 0l-18-12m18 12l-18 12" />
      </svg>
      <header className={s.top}>
        <div className={s.titleBox}>
          <h1 className={s.title}>Publishing flow</h1>
          <p className={s.status}>Live</p>
        </div>
        <div className={s.right}>
          <ul className={s.people} aria-label="On the board now">
            <li><button className={s.avatar} style={{ background: "#B5445B" }}>S</button></li>
            <li data-me><button className={`${s.avatar} ${s.me}`} style={{ background: "#2D639A" }}>E</button></li>
          </ul>
          <button className={s.iconButton} aria-label="Comments"><Icon>{TOOLS.find((t) => t.tool === "comment")!.icon}</Icon></button>
          <button className={s.iconButton} aria-label="More"><Icon><path d="M5 11h.01M11 11h.01M17 11h.01" strokeWidth="2.6" /></Icon></button>
        </div>
      </header>
      <ToolBar state={state} command={nothing} width={width} side={200} />
      <ZoomControl zoom={1} command={nothing} width={width} overTools history={width > 600 ? { canUndo: true, canRedo: false } : undefined} />
    </div>,
  );
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>html, body { margin: 0; } svg { color: inherit; }</style><style>${css()}</style>
<style>/* The stand-in drawing in the board's ink. */ ._board_${String(s.tool).split("_").pop()} > svg { color: var(--ink); }</style>
</head><body style="width:${width}px;height:${height}px">${body}</body></html>`;
}

describe.skipIf(!out)("pictures of the browser board's tools", () => {
  it("writes the pages: Select with its hint, the pencil with the lock on, and a phone", () => {
    // Excalidraw's own words for each (canvas.jsx hintOf).
    writeFileSync(join(out!, "web-board-select.html"), page({ tool: "selection", hint: "To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool", canUndo: true }, 1280, 720));
    writeFileSync(join(out!, "web-board-pencil-locked.html"), page({ tool: "freedraw", locked: true, hint: "Click and drag, release when you're finished", canUndo: true }, 1280, 720));
    writeFileSync(join(out!, "web-board-phone.html"), page({ tool: "selection", canUndo: true }, 390, 760));
  });
});
