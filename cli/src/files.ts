// Local files on their way to the server: text goes as text (content), anything else as its bytes
// in base64 (content_base64), the way the write tool takes them.

/** Not text: a NUL early on, or bytes that aren't UTF-8. The server's own rule (isBinaryBytes). */
export function isBinary(bytes: Uint8Array): boolean {
  if (bytes.subarray(0, 8192).includes(0)) return true;
  try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); return false; } catch { return true; }
}

export function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** What write takes for these bytes: { content } for text, { content_base64 } for the rest. */
export function encode(bytes: Uint8Array): { content: string } | { content_base64: string } {
  return isBinary(bytes) ? { content_base64: toBase64(bytes) } : { content: new TextDecoder().decode(bytes) };
}

export type LocalFile = { path: string; bytes: Uint8Array };

/** Every file in a folder, as "/path" from its top, sorted. Hidden files and folders (".git",
 *  ".DS_Store") are left out, as when the folder is dropped on a note in Pinto Notes. */
export async function readFolder(dir: string): Promise<LocalFile[]> {
  const root = dir.replace(/\/+$/, "") || "/";
  const out: LocalFile[] = [];
  const walk = async (rel: string) => {
    for await (const e of Deno.readDir(`${root}${rel}`)) {
      if (e.name.startsWith(".")) continue;
      const path = `${rel}/${e.name}`;
      const info = e.isSymlink ? await Deno.stat(`${root}${path}`) : e;
      if (info.isDirectory) await walk(path);
      else if (info.isFile) out.push({ path, bytes: await Deno.readFile(`${root}${path}`) });
    }
  };
  await walk("");
  return out.sort((a, b) => a.path < b.path ? -1 : 1);
}

export const size = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
