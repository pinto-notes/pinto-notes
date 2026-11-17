// Pure pieces of share-files: deno test supabase/functions/share-files/logic.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { contentDisposition, filePath, parseRequest, pictureHeaders, picturePath, RateLimiter, referencedFiles, sceneFilename, sceneHeaders, scenePath, servedType } from "./logic.ts";

const ID = "3f1c2b9a-1b7e-4c3a-9f0e-2a4b8c1d7e55";
const SLUG = "abcdefghijklmnopqrstuvwx";

Deno.test("the files a page embeds", () => {
  assertEquals(referencedFiles(`x\n![a.png](pane-file:${ID.toUpperCase()})\n[b](pane-file:${ID})\n[c](https://x)`), [ID]);
});

Deno.test("a file's address, relative to the Supabase URL", () => {
  assertEquals(filePath(SLUG, ID.toUpperCase()), `/functions/v1/share-files?slug=${SLUG}&file=${ID}`);
  const sub = "0b8f4a52-6a57-4b43-8d3c-5b2f8f1f9e10";
  assertEquals(filePath(SLUG, ID, sub), `/functions/v1/share-files?slug=${SLUG}&file=${ID}&sub=${sub}`);
});

Deno.test("shown in place only when a browser can't run it", () => {
  assertEquals(servedType("image/png", "a.png"), { type: "image/png", inline: true });
  assertEquals(servedType("public.jpeg", "a.jpg"), { type: "image/jpeg", inline: true });
  assertEquals(servedType("public.data", "trip.pdf"), { type: "application/pdf", inline: true });
  assertEquals(servedType("public.plain-text", "a.txt"), { type: "text/plain; charset=utf-8", inline: true });
  for (const [type, name] of [["text/html", "a.html"], ["image/svg+xml", "a.svg"], ["public.html", "a.html"], ["public.data", "x.js"], ["", "noext"]]) {
    assertEquals(servedType(type, name), { type: "application/octet-stream", inline: false }, `${type} ${name}`);
  }
});

Deno.test("a file name in the header can't break out of it", () => {
  assertEquals(contentDisposition("shown.png", true), `inline; filename="shown.png"; filename*=UTF-8''shown.png`);
  const d = contentDisposition('evil"; filename=x.html\r\nset-cookie: a=b.png', true);
  assert(!/[\r\n]/.test(d));
  assert(d.startsWith('inline; filename="evil__ filename=x.htmlset-cookie: a=b.png"; '), d);
  assertEquals(contentDisposition("Kvitto \u00e5\u00e4\u00f6.pdf", false), `attachment; filename="Kvitto aao.pdf"; filename*=UTF-8''Kvitto%20%C3%A5%C3%A4%C3%B6.pdf`);
  assertEquals(contentDisposition("", true), `inline; filename="file"; filename*=UTF-8''file`);
});

Deno.test("the per-address limit", () => {
  const rl = new RateLimiter(2, 1000);
  assert(rl.allow("ip", 0) && rl.allow("ip", 1));
  assert(!rl.allow("ip", 2));
  assert(rl.allow("ip", 1001));
});

Deno.test("a board's picture has an address of its own, with its version", () => {
  assertEquals(picturePath(SLUG, 1763100000123), `/functions/v1/share-files?slug=${SLUG}&picture=1763100000123`);
  const at = (q: string) => parseRequest(new URL(`http://x/functions/v1/share-files?${q}`));
  assertEquals(at(`slug=${SLUG}&picture=1763100000123`), { slug: SLUG, sub: null, kind: "picture" });
  assertEquals(at(`slug=${SLUG}`), { slug: SLUG, sub: null, kind: "list" });
  assertEquals(at(`slug=${SLUG}&file=${ID.toUpperCase()}`), { slug: SLUG, sub: null, kind: "file", file: ID });
  // Never with a file or on a sub-page, and only a number.
  for (const q of [`picture=1`, `slug=${SLUG}&picture=`, `slug=${SLUG}&picture=-1`, `slug=${SLUG}&picture=1e3`, `slug=${SLUG}&picture=${"1".repeat(21)}`,
    `slug=${SLUG}&picture=1&file=${ID}`, `slug=${SLUG}&picture=1&sub=${ID}`, `slug=${SLUG}&file=../../etc`]) {
    assertEquals(at(q), null, q);
  }
});

Deno.test("a board's picture is a PNG shown in place, cached a minute", () => {
  const h = pictureHeaders(1234);
  assertEquals(h["content-type"], "image/png");
  assertEquals(h["content-length"], "1234");
  assertEquals(h["x-content-type-options"], "nosniff");
  assertEquals(h["cache-control"], "private, max-age=60");
  assert(h["content-disposition"].startsWith('inline; filename="whiteboard.png"'));
});

// The page's "Download .excalidraw" (whiteboard council, round 3): the board's scene has an
// address of its own beside the picture's, and downloads under the board's name as JSON.
Deno.test("a board's scene has an address of its own, with its version", () => {
  assertEquals(scenePath(SLUG, 1763100000456), `/functions/v1/share-files?slug=${SLUG}&scene=1763100000456`);
  const at = (q: string) => parseRequest(new URL(`http://x/functions/v1/share-files?${q}`));
  assertEquals(at(`slug=${SLUG}&scene=1763100000456`), { slug: SLUG, sub: null, kind: "scene" });
  for (const q of [`scene=1`, `slug=${SLUG}&scene=`, `slug=${SLUG}&scene=abc`, `slug=${SLUG}&scene=${"1".repeat(21)}`,
    `slug=${SLUG}&scene=1&picture=1`, `slug=${SLUG}&scene=1&file=${ID}`, `slug=${SLUG}&scene=1&sub=${ID}`]) {
    assertEquals(at(q), null, q);
  }
});

Deno.test("a board's scene downloads as <board name>.excalidraw, JSON, cached a minute", () => {
  const h = sceneHeaders(4321, "Product launch");
  assertEquals(h["content-type"], "application/json");
  assertEquals(h["content-length"], "4321");
  assertEquals(h["x-content-type-options"], "nosniff");
  assertEquals(h["cache-control"], "private, max-age=60");
  assertEquals(h["content-disposition"], `attachment; filename="Product launch.excalidraw"; filename*=UTF-8''Product%20launch.excalidraw`);
  // As the app names its exports: no path or reserved characters, and a name when there's none.
  assertEquals(sceneFilename("Q3: plan/roadmap"), "Q3 planroadmap.excalidraw");
  assertEquals(sceneFilename('a\\b*?"<>|\nc'), "ab c.excalidraw");
  assertEquals(sceneFilename("  "), "Whiteboard.excalidraw");
  assertEquals(sceneFilename(null), "Whiteboard.excalidraw");
  assertEquals(sceneFilename("Café plan"), "Café plan.excalidraw");
  assert(sceneHeaders(1, "Café plan")["content-disposition"].includes(`filename*=UTF-8''Caf%C3%A9%20plan.excalidraw`));
});
