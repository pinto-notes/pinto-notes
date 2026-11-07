// Fetching a link someone else handed over (a chat client's file link): only over HTTPS, only to
// public internet addresses. Every address the name resolves to is checked, and every redirect is
// followed by hand and checked the same way, so a public name can't point or bounce the server at
// itself, the cloud's metadata service or a private network.

export class NotPublic extends Error {}

type Resolve = (host: string, type: "A" | "AAAA") => Promise<string[]>;
export type PublicFetchOptions = { resolve?: Resolve; fetch?: typeof globalThis.fetch; maxRedirects?: number };

let defaultResolve: Resolve = (host, type) => Deno.resolveDns(host, type);
/** For tests: answers DNS without the network. Returns what puts the real resolver back. */
export function useResolver(r: Resolve): () => void {
  const before = defaultResolve;
  defaultResolve = r;
  return () => { defaultResolve = before; };
}

function v4(ip: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  return p.every((n) => n <= 255) ? p : null;
}

function publicV4([a, b, c]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false; // this network, private, loopback, multicast and reserved
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 169 && b === 254) return false; // link-local, the metadata service
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false; // protocol assignments, documentation
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

/** An IPv6 address as eight 16-bit groups, or null. */
function v6(ip: string): number[] | null {
  let s = ip.replace(/^\[|\]$/g, "").toLowerCase();
  const zone = s.indexOf("%");
  if (zone >= 0) s = s.slice(0, zone);
  if (!/^[0-9a-f:.]+$/.test(s) || !s.includes(":")) return null;
  // A dotted IPv4 tail (::ffff:10.0.0.1) as two groups.
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (tail) {
    const p = v4(tail[1]);
    if (!p) return null;
    s = s.slice(0, -tail[1].length) + `${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const part = (h: string) => (h ? h.split(":") : []);
  const head = part(halves[0]), rest = halves.length === 2 ? part(halves[1]) : [];
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const groups = [...head, ...Array(fill).fill("0"), ...rest].map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return groups.length === 8 && groups.every((g) => Number.isFinite(g)) ? groups : null;
}

function publicV6(g: number[]): boolean {
  const embedded = () => [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255];
  if (g.slice(0, 7).every((x) => x === 0)) return false; // :: and ::1
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return publicV4(embedded()); // IPv4-mapped
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return publicV4(embedded()); // NAT64
  if ((g[0] & 0xfe00) === 0xfc00) return false; // unique local
  if ((g[0] & 0xffc0) === 0xfe80) return false; // link-local
  if ((g[0] & 0xff00) === 0xff00) return false; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // documentation
  if (g[0] === 0x2001 && g[1] === 0) return false; // Teredo
  if (g[0] === 0x2002) return false; // 6to4
  if (g[0] === 0x0100 && g.slice(1, 4).every((x) => x === 0)) return false; // discard
  return true;
}

/** Whether an IP address is on the public internet. Anything that doesn't parse isn't. */
export function isPublicAddress(ip: string): boolean {
  const a = v4(ip);
  if (a) return publicV4(a);
  const b = v6(ip);
  return b ? publicV6(b) : false;
}

/** Throws NotPublic unless the URL is https on the default port and every address its host has is public. */
async function check(url: URL, resolve: Resolve): Promise<void> {
  if (url.protocol !== "https:" || url.port !== "" || url.username || url.password) throw new NotPublic(url.href);
  const host = url.hostname;
  if (v4(host) || host.startsWith("[")) {
    if (!isPublicAddress(host)) throw new NotPublic(url.href);
    return;
  }
  if (!host.includes(".") || /(^|\.)localhost\.?$/i.test(host)) throw new NotPublic(url.href);
  const answers = (await Promise.all((["A", "AAAA"] as const).map((t) => resolve(host, t).catch(() => [] as string[])))).flat();
  if (!answers.length || !answers.every(isPublicAddress)) throw new NotPublic(url.href);
}

/** GET a public https link, following at most `maxRedirects` redirects, each checked. */
export async function publicFetch(link: string | URL, o: PublicFetchOptions = {}): Promise<Response> {
  const resolve = o.resolve ?? defaultResolve, get = o.fetch ?? globalThis.fetch, max = o.maxRedirects ?? 3;
  let url = new URL(link);
  for (let hop = 0; ; hop++) {
    await check(url, resolve);
    const res = await get(url, { redirect: "manual" });
    if (res.status < 300 || res.status > 399 || res.status === 304) return res;
    const next = res.headers.get("location");
    await res.body?.cancel();
    if (!next || hop >= max) throw new NotPublic(url.href);
    url = new URL(next, url);
  }
}
