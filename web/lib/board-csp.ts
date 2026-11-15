// The content security policies of a shared whiteboard in the browser (next.config.ts headers).
//
// /s/<id>: the board's page. As strict as the rest of the site, plus what the board needs: its
// Supabase project over https and wss (the board's changes, its live channel), Automerge's
// WebAssembly ('wasm-unsafe-eval' lets the page compile WebAssembly, never run strings as script),
// and its canvas in a frame from this site (with the user-content origin a sealed note's page is
// framed from).
//
// /board/canvas.html: the canvas. Framed only by this site, talks to nothing but this site (the
// framing page fetches and opens the board), and loads only its own files.
export function boardPageCSP(supabaseURL: string, userContent: string, dev = process.env.NODE_ENV !== "production"): string {
  let api = "";
  try {
    const u = new URL(supabaseURL);
    api = ` ${u.origin} ${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}`;
  } catch { /* no project: the board can't open, and says so */ }
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' https: data:${dev ? " http://127.0.0.1:*" : ""}`,
    "media-src 'self' https:",
    "font-src 'self'",
    `connect-src 'self'${api}`,
    `frame-src 'self' ${userContent}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function boardCanvasCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    // The engine sets styles on its elements as it draws.
    "style-src 'self' 'unsafe-inline'",
    // Pictures on the board come as data URLs; the engine draws them through blobs.
    "img-src 'self' data: blob:",
    // The engine's fonts come from this site (/board/canvas/fonts). It also lists the app's own
    // address (amber-lib:) as each font's second source; no browser can load that, and allowing it
    // keeps the browser from reporting every font as blocked.
    "font-src 'self' data: amber-lib:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join("; ");
}
