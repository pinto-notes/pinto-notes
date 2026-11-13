// A canvas note: the drawing board, in the note-page sandbox (Pane/Views/NotePageView.swift).
//
// The drawing is a standard Excalidraw scene ({ type: "excalidraw", elements, appState, files }),
// kept unchanged as the page's data: amber.data.values.scene. The app syncs, seals and versions it
// like any app's data, and an AI reads and edits it as "<Note>.app/data.json".
//
// - Saves after a short pause in drawing, and at once when the page is hidden or the app asks
//   (amber._flush, before the view goes away).
// - A scene changed elsewhere (another device, an AI) is merged in by element id: what changed there
//   since this page last saved comes in; what you changed here stays.
// - Elements an AI wrote in the short "skeleton" form ({ type, x, y, width, height, label }) are
//   filled out on load and saved back in full.
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  Excalidraw, MainMenu, WelcomeScreen, restore, restoreElements, convertToExcalidrawElements, CaptureUpdateAction,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./pinto.css";

const amber = window.amber;
const SAVE_DELAY = 300;
// Deleted elements are kept a while so another device's copy can't bring them back, then dropped.
const KEEP_DELETED_MS = 7 * 24 * 3600 * 1000;

const emptyScene = () => ({ type: "excalidraw", version: 2, source: "https://pintonotes.com", elements: [], appState: {}, files: {} });

/** Full elements as stored; the short form an AI may write is converted. */
export function normalize(elements) {
  const list = Array.isArray(elements) ? elements.filter((e) => e && typeof e === "object" && typeof e.type === "string") : [];
  const full = [], skeletons = [];
  for (const e of list) (typeof e.seed === "number" && typeof e.version === "number" ? full : skeletons).push(e);
  const converted = skeletons.length ? convertToExcalidrawElements(skeletons, { regenerateIds: false }) : [];
  return { elements: restoreElements([...full, ...converted], null, { repairBindings: true, refreshDimensions: false }), converted: skeletons.length > 0 };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Three-way, by element id: base is what this page last saved (or received). */
export function merge(local, remote, base) {
  const byId = (l) => new Map(l.map((e) => [e.id, e]));
  const L = byId(local), R = byId(remote), B = byId(base);
  const out = [];
  for (const id of new Set([...L.keys(), ...R.keys()])) {
    const l = L.get(id), r = R.get(id), b = B.get(id);
    if (!r) { if (!b || !same(l, b)) out.push(l); continue; }   // gone there: kept only if new or changed here
    if (!l) { out.push(r); continue; }
    if (same(r, b)) { out.push(l); continue; }                  // unchanged there
    if (same(l, b)) { out.push(r.version > l.version ? r : { ...r, version: l.version + 1 }); continue; }
    out.push(r.version > l.version ? r : l);                    // changed on both: the newer edit
  }
  return restoreElements(out, null, { repairBindings: true, refreshDimensions: false });
}

function sceneFrom(elements, appState, files) {
  const now = Date.now();
  const kept = elements.filter((e) => !e.isDeleted || now - (e.updated || 0) < KEEP_DELETED_MS);
  const used = new Set(kept.filter((e) => !e.isDeleted && e.fileId).map((e) => e.fileId));
  const ownFiles = Object.fromEntries(Object.entries(files || {}).filter(([id]) => used.has(id)));
  return {
    ...emptyScene(),
    elements: kept,
    appState: { viewBackgroundColor: appState.viewBackgroundColor, gridSize: appState.gridSize, gridStep: appState.gridStep, gridModeEnabled: appState.gridModeEnabled },
    files: ownFiles,
  };
}

const prefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

function Canvas({ initial }) {
  const [api, setApi] = useState(null);
  const [theme, setTheme] = useState(prefersDark() ? "dark" : "light");

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setTheme(m.matches ? "dark" : "light");
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!api) return;
    let timer = null;
    let lastSent = JSON.stringify(initial.stored);
    let base = initial.elements;
    let lastVersion = null;

    const save = () => {
      timer = null;
      const scene = sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles());
      const json = JSON.stringify(scene);
      if (json === lastSent) return;
      lastSent = json;
      base = scene.elements;
      amber.store.set("scene", scene);
    };
    const flush = () => { if (timer) { clearTimeout(timer); save(); } };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(save, SAVE_DELAY); };

    const off = api.onChange((elements, appState, files) => {
      // Pans and zooms change nothing that's kept.
      const v = JSON.stringify([elements.map((e) => [e.id, e.version]), appState.viewBackgroundColor, appState.gridModeEnabled, Object.keys(files || {}).length]);
      if (v === lastVersion) return;
      if (lastVersion !== null) schedule();
      lastVersion = v;
    });

    // From elsewhere: another device or an AI.
    const unlisten = amber.onChange((note, data) => {
      const scene = data && data.values && data.values.scene;
      if (!scene || JSON.stringify(scene) === lastSent) return;
      const { elements: remote } = normalize(scene.elements);
      const merged = merge(api.getSceneElementsIncludingDeleted(), remote, base);
      const files = Object.values(scene.files || {});
      if (files.length) api.addFiles(files);
      const bg = scene.appState && scene.appState.viewBackgroundColor;
      api.updateScene({ elements: merged, ...(bg ? { appState: { viewBackgroundColor: bg } } : {}), captureUpdate: CaptureUpdateAction.NEVER });
      base = remote;
      lastSent = JSON.stringify(scene);
      if (scene.elements.some((e) => e && typeof e.seed !== "number")) remeasure();
      // Ours had changes theirs didn't (or theirs was in the short form): saved back merged.
      if (!same(merged.map((e) => [e.id, e.version]), remote.map((e) => [e.id, e.version]))) schedule();
    });

    // Text an AI wrote was measured before the hand-drawn font arrived: measured again once it has.
    const remeasure = () => document.fonts.load("20px Excalifont").then(() => {
      const els = restoreElements(api.getSceneElementsIncludingDeleted(), null, { refreshDimensions: true, repairBindings: true });
      api.updateScene({ elements: els, captureUpdate: CaptureUpdateAction.NEVER });
    }).catch(() => {});
    if (initial.converted) remeasure().then(schedule);
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    Object.defineProperty(amber, "_flush", { value: flush, configurable: true });
    // For the app's tests: the scene as it would be saved now.
    Object.defineProperty(amber, "_canvas", { value: { api, scene: () => sceneFrom(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles()), save }, configurable: true });
    return () => { off(); unlisten(); removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); flush(); };
  }, [api]);

  const setRef = useCallback((a) => setApi(a), []);

  return (
    <Excalidraw
      excalidrawAPI={setRef}
      initialData={{ elements: initial.elements, appState: { ...initial.appState, theme }, files: initial.files, scrollToContent: true }}
      theme={theme}
      aiEnabled={false}
      autoFocus
      handleKeyboardGlobally
      UIOptions={{
        canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: false, toggleTheme: null, changeViewBackgroundColor: true, clearCanvas: true },
        tools: { image: false },
      }}
      validateEmbeddable={false}
    >
      <MainMenu>
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
      <WelcomeScreen>
        <WelcomeScreen.Center>
          <WelcomeScreen.Center.Heading>Draw anything. Your AI can draw here too.</WelcomeScreen.Center.Heading>
        </WelcomeScreen.Center>
        <WelcomeScreen.Hints.ToolbarHint>Pick a tool and start drawing</WelcomeScreen.Hints.ToolbarHint>
        <WelcomeScreen.Hints.MenuHint>Background and clear</WelcomeScreen.Hints.MenuHint>
      </WelcomeScreen>
    </Excalidraw>
  );
}

function start() {
  const stored = (amber && amber.data && amber.data.values && amber.data.values.scene) || emptyScene();
  const { elements, converted } = normalize(stored.elements);
  const restored = restore({ ...stored, elements }, null, null);
  const initial = { stored, elements: restored.elements, appState: { viewBackgroundColor: restored.appState.viewBackgroundColor, gridModeEnabled: restored.appState.gridModeEnabled }, files: restored.files, converted };
  const el = document.getElementById("canvas");
  // Drawn before the page's load event: the app checks something showed.
  flushSync(() => createRoot(el).render(<Canvas initial={initial} />));
}

window.EXCALIDRAW_ASSET_PATH = "amber-lib:///canvas/";
start();
