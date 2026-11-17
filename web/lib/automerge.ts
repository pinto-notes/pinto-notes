// Automerge for the whiteboard page: the slim build, with its WebAssembly fetched once from the
// site (public/board/automerge.wasm, copied from the package by scripts/board-assets.mjs before a
// build), so the page's own script stays small and the engine loads only on a board.
import * as A from "@automerge/automerge/slim";

let ready: Promise<typeof A> | null = null;

/** Automerge, its WebAssembly compiled once. `wasm`: where it is (a URL), or its bytes (tests). */
export function loadAutomerge(wasm: string | Uint8Array = "/board/automerge.wasm"): Promise<typeof A> {
  if (ready) return ready;
  const loading = (A.isWasmInitialized() ? Promise.resolve() : A.initializeWasm(wasm)).then(() => A);
  loading.catch(() => { ready = null; });
  return ready = loading;
}
