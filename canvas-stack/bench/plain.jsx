// Plain Excalidraw, the same version as the board's, with nothing of Pinto's: what the board is
// measured against (scripts/board-perf.sh). Full window, as excalidraw.com draws it.
//
//   await window.__boardOpen(scene)   shows `scene`, fitted; resolves when its first frame is drawn
import React from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

window.EXCALIDRAW_ASSET_PATH = new URL("./", location.href).href;

let root = null;
window.__boardOpen = (scene) => new Promise((resolve) => {
  const t0 = performance.now();
  if (root) { root.unmount(); window.__excalidrawAPI = null; }
  root = createRoot(document.getElementById("root"));
  const shown = (api) => {
    if (!api || window.__excalidrawAPI === api) return;
    window.__excalidrawAPI = api;
    // The drawing is in once the engine holds it all (it may drop what it can't restore: then once
    // it stops growing), then a frame drawn with it.
    let before = -1, still = 0;
    const wait = () => {
      const n = api.getSceneElements().length;
      still = n > 0 && n === before ? still + 1 : 0;
      before = n;
      if (n < scene.elements.length && still < 3) { requestAnimationFrame(wait); return; }
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - t0)));
    };
    wait();
  };
  root.render(
    <div style={{ position: "fixed", inset: 0 }}>
      <Excalidraw excalidrawAPI={shown} initialData={{ elements: scene.elements, appState: scene.appState, files: scene.files, scrollToContent: true }} />
    </div>,
  );
});

// The benchmark puts the drawing in before the page starts (window.__boardScene): shown at once,
// and the moment its first frame is drawn kept (epoch ms), for the open time.
if (window.__boardScene) window.__boardOpen(window.__boardScene).then(() => { window.__boardShownAt = performance.timeOrigin + performance.now(); });
