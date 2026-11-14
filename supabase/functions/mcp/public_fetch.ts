// Fetching a link someone else handed over (a chat client's file link, a write's content_url, an
// app's request during its save check): only over HTTPS, only to public internet addresses.
// Every address the name resolves to is checked, the connection goes to the address that was
// checked (so a name can't answer once with a public address and then with a private one), and
// every redirect is followed by hand and checked the same way, so a public name can't point or
// bounce the server at itself, the cloud's metadata service or a private network. Nothing of the
// caller's goes along: no cookies, no credentials, no headers but the ones below.

export class NotPublic extends Error {}
/** The whole download (every hop and the body) took longer than its time. */
export class FetchTimeout extends Error {}

type Resolve = (host: string, type: "A" | "AAAA") => Promise<string[]>;
/** Where a checked address is dialled, and the roots its certificate is checked against. Tests
 *  send a made-up public address to a local server; nothing else changes. */
type Net = { resolve: Resolve; route: (ip: string, port: number) => { hostname: string; port: number }; caCerts?: string[]; timeoutMs: number };
export type PublicFetchOptions = { maxRedirects?: number; timeoutMs?: number; headers?: Record<string, string> };

const real: Net = { resolve: (host, type) => Deno.resolveDns(host, type), route: (hostname, port) => ({ hostname, port }), timeoutMs: 30_000 };
let net: Net = real;
/** For tests: DNS, dialling and trusted roots without the internet. Returns what puts the real ones back. */
export function useNetwork(n: Partial<Net>): () => void {
  const before = net;
  net = { ...net, ...n };
  return () => { net = before; };
}
/** For tests: answers DNS without the network. Returns what puts the real resolver back. */
export const useResolver = (resolve: Resolve) => useNetwork({ resolve });

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
  if ((g[0] & 0xfe00) === 0xfc00) return false; // unique local (and the metadata service's fd00:ec2::254)
  if ((g[0] & 0xffc0) === 0xfe80) return false; // link-local
  if ((g[0] & 0xffc0) === 0xfec0) return false; // site-local (old)
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

/** The public addresses to dial for a URL, or NotPublic saying why not. */
async function check(url: URL): Promise<string[]> {
  if (url.protocol !== "https:") throw new NotPublic(`${url.protocol.replace(/:$/, "")} isn't https: only https addresses are fetched.`);
  if (url.port !== "") throw new NotPublic(`${url.host} names a port: only https on its usual port is fetched.`);
  if (url.username || url.password) throw new NotPublic(`the address has a user name or password in it.`);
  const host = url.hostname;
  if (v4(host) || host.startsWith("[")) {
    if (!isPublicAddress(host)) throw new NotPublic(`${host} is a private, local or reserved address.`);
    return [host.replace(/^\[|\]$/g, "")];
  }
  if (!host.includes(".") || /(^|\.)localhost\.?$/i.test(host)) throw new NotPublic(`${host} isn't a public name.`);
  const answers = (await Promise.all((["A", "AAAA"] as const).map((t) => net.resolve(host, t).catch(() => [] as string[])))).flat();
  if (!answers.length) throw new NotPublic(`${host} doesn't resolve.`);
  if (!answers.every(isPublicAddress)) throw new NotPublic(`${host} points to a private, local or reserved address.`);
  return answers;
}

const concat = (a: Uint8Array, b: Uint8Array) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
const MAX_HEAD = 64 * 1024;

/** HTTP/1.1 over one TLS connection to a checked address: one GET, then the connection closes. */
async function getOnce(url: URL, ips: string[], headers: Record<string, string>, alive: (c: Deno.Conn | null) => void): Promise<Response> {
  let conn: Deno.Conn | null = null, last: unknown;
  for (const ip of ips) {
    try {
      const to = net.route(ip, 443);
      const tcp = await Deno.connect({ hostname: to.hostname, port: to.port });
      alive(tcp);
      try {
        conn = await Deno.startTls(tcp, { hostname: url.hostname.replace(/^\[|\]$/g, ""), ...(net.caCerts ? { caCerts: net.caCerts } : {}) });
      } catch (e) { try { tcp.close(); } catch { /* closed */ } throw e; }
      break;
    } catch (e) { last = e; }
  }
  if (!conn) throw last ?? new Error("no address to connect to");
  alive(conn);
  const c = conn;
  const close = () => { try { c.close(); } catch { /* already closed */ } };
  try {
    const lines = [`GET ${url.pathname}${url.search} HTTP/1.1`, `Host: ${url.host}`, "User-Agent: PintoNotes", "Accept: */*", "Accept-Encoding: identity", "Connection: close",
      ...Object.entries(headers).filter(([k, v]) => /^[A-Za-z0-9-]+$/.test(k) && !/[\r\n]/.test(v)).map(([k, v]) => `${k}: ${v}`)];
    const req = new TextEncoder().encode(lines.join("\r\n") + "\r\n\r\n");
    for (let at = 0; at < req.length;) at += await c.write(req.subarray(at));

    const reader = c.readable.getReader();
    let buf: Uint8Array = new Uint8Array(0);
    const more = async () => { const { done, value } = await reader.read(); if (done) return false; buf = concat(buf, value); return true; };
    const take = (n: number) => { const out = buf.subarray(0, n); buf = buf.subarray(n); return out; };
    const line = async (): Promise<string> => {
      for (;;) {
        const at = buf.findIndex((b, i) => b === 10 && i > 0 && buf[i - 1] === 13);
        if (at >= 0) return new TextDecoder().decode(take(at + 1)).slice(0, -2);
        if (buf.length > MAX_HEAD) throw new Error("the answer's headers are too long");
        if (!(await more())) throw new Error("the connection closed early");
      }
    };
    // The head (any 1xx answers before it skipped).
    let status = 0, reason = "";
    let h = new Headers();
    for (;;) {
      const m = /^HTTP\/1\.[01] (\d{3})(?: (.*))?$/.exec(await line());
      if (!m) throw new Error("the answer isn't HTTP");
      status = Number(m[1]); reason = m[2] ?? "";
      h = new Headers();
      let size = 0;
      for (;;) {
        const l = await line();
        if (!l) break;
        size += l.length;
        if (size > MAX_HEAD) throw new Error("the answer's headers are too long");
        const colon = l.indexOf(":");
        if (colon > 0) { try { h.append(l.slice(0, colon).trim(), l.slice(colon + 1).trim()); } catch { /* a header the web wouldn't take */ } }
      }
      if (status >= 200) break;
    }
    if (status > 599) throw new Error(`the answer's status ${status} isn't HTTP`);
    const empty = status === 204 || status === 205 || status === 304;
    const chunked = /chunked/i.test(h.get("transfer-encoding") ?? "");
    const length = h.has("content-length") ? Number(h.get("content-length")) : NaN;
    if (h.has("content-length") && !(Number.isSafeInteger(length) && length >= 0)) throw new Error("the answer's length isn't a number");
    let left = chunked ? 0 : Number.isFinite(length) ? length : Infinity;
    let chunkDone = false;
    const body = empty ? null : new ReadableStream<Uint8Array>({
      async pull(ctl) {
        try {
          if (chunked) {
            if (left === 0) {
              if (chunkDone) { ctl.close(); close(); return; }
              const size = parseInt((await line()).split(";")[0].trim(), 16);
              if (!Number.isFinite(size) || size < 0) throw new Error("a chunk's size isn't a number");
              if (size === 0) { while (await line()); chunkDone = true; ctl.close(); close(); return; }
              left = size;
            }
            if (!buf.length && !(await more())) throw new Error("the connection closed early");
            const part = take(Math.min(left, buf.length));
            left -= part.length;
            if (left === 0) { while (buf.length < 2) if (!(await more())) throw new Error("the connection closed early"); take(2); }
            ctl.enqueue(part.slice());
            return;
          }
          if (left === 0) { ctl.close(); close(); return; }
          if (!buf.length && !(await more())) {
            if (left === Infinity) { ctl.close(); close(); return; }
            throw new Error("the connection closed early");
          }
          const part = take(Math.min(left, buf.length));
          if (left !== Infinity) left -= part.length;
          ctl.enqueue(part.slice());
        } catch (e) { close(); ctl.error(e); }
      },
      cancel() { close(); },
    });
    if (!body) close();
    let out = body;
    const coding = (h.get("content-encoding") ?? "identity").toLowerCase().trim();
    if (out && coding !== "identity") {
      // Asked for as they are; a server that compresses anyway is unpacked like a browser does.
      if (coding !== "gzip" && coding !== "x-gzip" && coding !== "deflate") { close(); throw new Error(`the answer is packed as ${coding}`); }
      out = (out as ReadableStream<BufferSource>).pipeThrough(new DecompressionStream(coding === "deflate" ? "deflate" : "gzip"));
      h.delete("content-length");
    }
    return new Response(out, { status, statusText: reason.replace(/[^\t\x20-\x7e]/g, ""), headers: h });
  } catch (e) {
    close();
    throw e;
  }
}

/** GET a public https link, following at most `maxRedirects` redirects, each checked, all within
 *  `timeoutMs` (the body too: reading it past then fails with FetchTimeout). */
export async function publicFetch(link: string | URL, o: PublicFetchOptions = {}): Promise<Response> {
  const max = o.maxRedirects ?? 3, ms = o.timeoutMs ?? net.timeoutMs;
  let url: URL;
  try { url = new URL(link); } catch { throw new NotPublic("it isn't a web address."); }
  let conn: Deno.Conn | null = null, late = false;
  const timeout = () => new FetchTimeout(`took longer than ${ms >= 1000 ? `${Math.round(ms / 1000)} s` : `${ms} ms`}`);
  let fire: (e: unknown) => void = () => {};
  const deadline = new Promise<never>((_, reject) => { fire = reject; });
  deadline.catch(() => {});
  const timer = setTimeout(() => { late = true; try { conn?.close(); } catch { /* closed */ } fire(timeout()); }, ms);
  const done = () => clearTimeout(timer);
  const why = (e: unknown) => (late ? timeout() : e);
  try {
    for (let hop = 0; ; hop++) {
      const ips = await Promise.race([check(url), deadline]);
      const res = await Promise.race([getOnce(url, ips, o.headers ?? {}, (c) => { conn = c; }), deadline]);
      if (res.status < 300 || res.status > 399 || res.status === 304) {
        if (!res.body) { done(); return res; }
        // The body, failing with FetchTimeout past the time, and the timer stopped once it's read.
        const reader = res.body.getReader();
        const body = new ReadableStream<Uint8Array>({
          async pull(ctl) {
            try {
              const { done: end, value } = await reader.read();
              if (end) { done(); ctl.close(); } else ctl.enqueue(value);
            } catch (e) { done(); ctl.error(why(e)); }
          },
          cancel(r) { done(); return reader.cancel(r); },
        });
        return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
      }
      const next = res.headers.get("location");
      await res.body?.cancel();
      if (!next) throw new NotPublic(`${url.host} redirected without saying where.`);
      if (hop >= max) throw new NotPublic(`more than ${max} redirects.`);
      try { url = new URL(next, url); } catch { throw new NotPublic(`${url.host} redirected to something that isn't a web address.`); }
    }
  } catch (e) {
    done();
    throw why(e);
  }
}
