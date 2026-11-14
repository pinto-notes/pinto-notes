import { assertEquals } from "@std/assert";
import { encode, isBinary, readFolder, toBase64 } from "./files.ts";

const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

Deno.test("text goes as text, anything else as base64 of its bytes", () => {
  assertEquals(encode(new TextEncoder().encode("<!doctype html>\nHéllo")), { content: "<!doctype html>\nHéllo" });
  // A .wasm starts with \0asm; a byte that isn't UTF-8 is binary too.
  const wasm = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]);
  assertEquals(encode(wasm), { content_base64: "AGFzbQEAAAA=" });
  assertEquals(isBinary(new Uint8Array([0x49, 0x57, 0x41, 0x44, 0xff])), true);
  assertEquals(isBinary(new Uint8Array()), false);
});

Deno.test("a game-sized file survives the trip: 5 MB of every byte value", () => {
  const big = new Uint8Array(5 * 1024 * 1024).map((_, i) => (i * 7919) & 0xff);
  const sent = encode(big);
  assertEquals("content_base64" in sent, true);
  assertEquals(fromBase64((sent as { content_base64: string }).content_base64), big);
  assertEquals(toBase64(new TextEncoder().encode("Man")), "TWFu");
});

Deno.test("a folder: every file from its top, hidden ones left out, links followed", async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${dir}/art/sprites`, { recursive: true });
    await Deno.mkdir(`${dir}/.git`);
    await Deno.writeTextFile(`${dir}/index.html`, "<p>hi</p>");
    await Deno.writeFile(`${dir}/art/sprites/a.png`, new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0]));
    await Deno.writeTextFile(`${dir}/.DS_Store`, "x");
    await Deno.writeTextFile(`${dir}/.git/HEAD`, "ref");
    await Deno.symlink(`${dir}/index.html`, `${dir}/copy.html`);
    const files = await readFolder(`${dir}/`);
    assertEquals(files.map((f) => f.path), ["/art/sprites/a.png", "/copy.html", "/index.html"]);
    assertEquals(new TextDecoder().decode(files[1].bytes), "<p>hi</p>");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
