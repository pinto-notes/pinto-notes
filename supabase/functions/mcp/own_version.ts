// "Make my own version of <link>": the person gives their AI a link to an app and gets their own
// version of it as a note app, with the same features and workflow and a name, look and words of
// its own (Emil, 17 November 2026). Pinto Notes has no AI of its own, so this is what makes it one
// step for whichever AI the person uses: create { type: "app", original: link } reads the app's
// public pages here (its site, the pages about its features and how it works, its App Store
// listing and a few screenshots) and answers with them and the method below, so the AI needs no
// other tool and asks nothing back.
//
// Public pages only, the way a browser with no account sees them: publicFetch sends no cookies or
// credentials, sign-in, sign-up, account and checkout pages are never followed, and pages the
// site's robots.txt keeps out are skipped. The person's own link is read like a link they opened.
//
// The test (~/content-tools/projects/pinto-app-clone/2026-11-17-test/REPORT.md): five apps built
// from a link in 4 to 9 minutes, about 55% of their listed features. What was missing: features on
// pages the AI never opened, screenshots it couldn't read, and platform features left out with no
// stand-in. Each part below answers one of those.

import { FetchTimeout, NotPublic, publicFetch } from "./public_fetch.ts";
import { readCapped } from "./tools.ts";
import { toBase64 } from "../_shared/e2ee.ts";

/** The method, as the AI reads it in create's answer (and the MCP prompt points at it). */
export const OWN_VERSION_GUIDE = `## Making the person's own version of an app

The person gave you a link to an app and wants their own version of it, as this note's app: the same features and the same way of working, with a name, a look and words of its own. Below are the app's public pages, read for you: its site, its pages about features and help, and its App Store listing with screenshots. Use public pages only. Never sign in, sign up or make an account anywhere, and never ask the person for theirs.

1. List what it does. In docs/README.md, under "## Features of the original", write every feature the pages name, one line each, as a checklist: "- [x]" for each one you build, "- [ ]" with the reason for each one you leave out. Keep the link there too, so a later change can read the pages again. This list is how the person sees what they got.
2. Build every feature a note app can do. Start with what someone does in it every day, then go down the list. Leave out only what needs something a note app doesn't have (notifications, widgets, a watch, health data, blocking other apps, the original's own servers or other people's accounts), and build the nearest thing that works instead: what's due shows when the app opens; a file the original imports or exports (a bank's CSV, a deck) comes in with device.files.pick() and goes out with share(). Where the pages don't say how something works, choose the simplest thing that works and note it under "## Decisions".
3. Make it its own. Give it a plain name for what it does ("Habits", "Budget", "Flashcards"), never the original's name, and rename the note to it. Copy no logo, icon, picture, colour scheme or text: write every word yourself, and design a look that fits what it does. The screenshots show how it works; build that way of working, not that look. Inside the app, never mention the original.
4. Build it in one go: every file (screens, lib, tests, docs/README.md, and a data.json with a few realistic examples) in one write with files, then fix what the check reports.
5. Test each feature you check off, like tests/app.test.tsx does: each test starts with no data.
6. Look at it with see_app, on iPhone and Mac, light and dark, and fix what looks wrong.
7. Tell the person in a few lines what their app does, and what the original has that this one can't.`;

/** One page that was read. */
export type Source = { url: string; kind: "link" | "page" | "app-store"; title: string; text: string };
/** A screenshot from the App Store listing, ready to show the AI. */
export type Screenshot = { url: string; data: string; mimeType: string };
/** What was read about the app, and what couldn't be. */
export type Study = { link: string; sources: Source[]; screenshots: Screenshot[]; missed: { url: string; why: string }[]; ms: number };

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15 PintoNotes";
const HEADERS = { "user-agent": UA, "accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5", "accept-language": "en" };
/** Limits: each page's HTML, each page's text, all the text, pages beyond the link, screenshots. */
export const LIMITS = { htmlBytes: 3 * 1048576, pageChars: 12_000, storeChars: 8_000, totalChars: 45_000, extraPages: 4, screenshots: 4, shotBytes: 400 * 1024, timeoutMs: 10_000 };

/** Where the App Store listing is looked up (Apple's public lookup); tests point it at their own server. */
let lookupBase = "https://itunes.apple.com/lookup";
export function useLookup(base: string): () => void {
  const before = lookupBase;
  lookupBase = base;
  return () => { lookupBase = before; };
}

/** The App Store id in a link to a listing ("apps.apple.com/us/app/name/id123456"), and its country. */
export function appStoreId(link: string): { id: string; country: string } | null {
  let u: URL;
  try { u = new URL(link); } catch { return null; }
  if (!/^(apps|itunes)\.apple\.com$/i.test(u.hostname)) return null;
  const m = /\/id(\d{5,})/.exec(u.pathname);
  if (!m) return null;
  const cc = /^\/([a-z]{2})\//i.exec(u.pathname)?.[1]?.toLowerCase() ?? "us";
  return { id: m[1], country: cc };
}

// MARK: HTML to text

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", hellip: "…", trade: "™", reg: "®", copy: "©", middot: "·", bull: "•", times: "×", euro: "€", pound: "£",
};
export function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all;
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}

const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : undefined;
};
const strip = (html: string) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

/** What a page says, as plain text with its headings and lists kept, and where it links to. */
export function readPage(html: string, base: string): { title: string; text: string; links: { href: string; text: string }[] } {
  const head = /<head[\s\S]*?<\/head>/i.exec(html)?.[0] ?? "";
  const title = strip(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head || html)?.[1] ?? "");
  const metas: string[] = [];
  for (const m of (head || html).matchAll(/<meta\b[^>]*>/gi)) {
    const key = (attr(m[0], "name") ?? attr(m[0], "property") ?? "").toLowerCase();
    const content = attr(m[0], "content");
    if (content && ["description", "og:description", "twitter:description"].includes(key) && !metas.includes(content.trim())) metas.push(content.trim());
  }
  // Structured data often lists what an app is, what it costs and its features.
  const structured: string[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { structured.push(...ldText(JSON.parse(m[1]))); } catch { /* not JSON */ }
  }
  let body = /<body[\s\S]*<\/body>/i.exec(html)?.[0] ?? html;
  body = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|canvas|select)\b[\s\S]*?<\/\1>/gi, " ");
  const links: { href: string; text: string }[] = [];
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(`<a ${m[1]}>`, "href");
    if (!href) continue;
    try { links.push({ href: new URL(href, base).href, text: strip(m[2]) || attr(`<a ${m[1]}>`, "aria-label") || "" }); } catch { /* not a link */ }
  }
  const text = body
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n: string, t: string) => `\n\n${"#".repeat(Math.min(Number(n) + 1, 6))} ${strip(t)}\n`)
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|tr|ul|ol|dl|dd|dt|table|figure|blockquote|li|nav|main|aside)>/gi, "\n")
    .replace(/<(td|th)\b[^>]*>/gi, " | ")
    .replace(/<img\b[^>]*>/gi, (tag) => { const alt = attr(tag, "alt")?.trim(); return alt && alt.length > 3 ? ` [picture: ${alt}] ` : " "; })
    .replace(/<[^>]*>/g, " ");
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of decode(text).split("\n")) {
    const line = raw.replace(/[ \t ]+/g, " ").trim();
    if (!line || line === "-" || line === "|") continue;
    // Menus and footers repeat: each line once.
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
  }
  const top = [...metas, ...structured.filter((s) => !metas.includes(s))];
  return { title, text: [...(top.length ? [top.join("\n"), ""] : []), lines.join("\n").replace(/\n(#+ )/g, "\n\n$1")].join("\n").trim(), links };
}

/** The useful parts of schema.org data: a name, a description, a price, a feature list. */
function ldText(v: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 4 || !v || typeof v !== "object") return out;
  if (Array.isArray(v)) { for (const x of v) ldText(x, out, depth + 1); return out; }
  const o = v as Record<string, unknown>;
  const kind = String(o["@type"] ?? "");
  if (/Application|Product|WebApplication|SoftwareApplication|MobileApplication/i.test(kind)) {
    if (typeof o.description === "string") out.push(decode(o.description).trim());
    const offers = (Array.isArray(o.offers) ? o.offers : o.offers ? [o.offers] : []) as Record<string, unknown>[];
    for (const of of offers) if (of && of.price !== undefined) out.push(`Price: ${of.price}${of.priceCurrency ? ` ${of.priceCurrency}` : ""}`);
    const f = o.featureList;
    if (typeof f === "string") out.push(`Features: ${decode(f)}`);
    else if (Array.isArray(f)) out.push(`Features:\n${f.map((x) => `- ${decode(String(x))}`).join("\n")}`);
  }
  if (o["@graph"]) ldText(o["@graph"], out, depth + 1);
  return out;
}

// MARK: Which pages to read

/** The site a host belongs to ("help.example.co.uk" → "example.co.uk"), near enough for picking pages. */
export function siteOf(host: string): string {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  const two = parts.slice(-2);
  return (two[0].length <= 3 && two[1].length === 2 && parts.length > 2 ? parts.slice(-3) : two).join(".");
}

const NEVER = /(log-?in|sign-?in|sign-?up|signup|register|account|my-?account|checkout|cart|basket|subscribe|password|oauth|auth\/|privacy|terms|legal|cookie|gdpr|careers|jobs|press|affiliate|status\.|investor|unsubscribe)/i;
const FILES = /\.(pdf|zip|dmg|pkg|exe|msi|apk|png|jpe?g|gif|webp|svg|mp4|mov|mp3|xml|rss|json|ics)(\?|#|$)/i;
const WANT: [RegExp, number][] = [
  [/features?/i, 6], [/how[- ]?it[- ]?works|tour|overview|what[- ]?is/i, 5], [/user[- ]?guide|manual|guide|getting[- ]?started|tutorial/i, 4],
  [/help|support|faq|questions|docs|documentation|knowledge/i, 3], [/whats[- ]?new|release[- ]?notes|changelog|updates/i, 3], [/pricing|plans|compare/i, 2], [/learn|tips/i, 1],
];

/** The pages beyond the link worth reading: on the same site, about features, help or pricing, best first. */
export function pickPages(links: { href: string; text: string }[], from: string, most = LIMITS.extraPages): string[] {
  const home = new URL(from);
  const site = siteOf(home.hostname);
  const scored = new Map<string, number>();
  for (const l of links) {
    let u: URL;
    try { u = new URL(l.href); } catch { continue; }
    if (u.protocol !== "https:" || siteOf(u.hostname) !== site) continue;
    u.hash = "";
    // Tracking and language switches add nothing.
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|lang$|hl$|locale$)/i.test(k)) u.searchParams.delete(k);
    const href = u.href.replace(/\/$/, "");
    // The same page with and without www is one page.
    const same = (x: string) => x.replace(/^https:\/\/www\./, "https://");
    if (same(href) === same(home.href.replace(/#.*$/, "").replace(/\/$/, ""))) continue;
    const key = [...scored.keys()].find((k) => same(k) === same(href)) ?? href;
    const where = `${u.hostname} ${u.pathname} ${l.text}`;
    if (NEVER.test(where) || FILES.test(u.pathname)) continue;
    // A blog post or a single help article is narrower than the section it sits in.
    const depth = u.pathname.split("/").filter(Boolean).length;
    let score = 0;
    for (const [re, n] of WANT) if (re.test(where)) score = Math.max(score, n);
    if (!score) continue;
    score -= Math.max(0, depth - 2);
    if (/\/(blog|news|stories|podcast)\b/i.test(u.pathname)) score -= 3;
    if (score > 0) scored.set(key, Math.max(scored.get(key) ?? 0, score));
  }
  return [...scored].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).slice(0, most).map(([u]) => u);
}

/** robots.txt's rules for every robot ("User-agent: *"): whether a path may be read. */
export function robotsAllow(robots: string, path: string): boolean {
  let mine = false, inGroup = false;
  const rules: { allow: boolean; prefix: string }[] = [];
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const [, field, value] = m;
    if (/^user-agent$/i.test(field)) {
      if (!inGroup) mine = false;
      inGroup = true;
      if (value.trim() === "*") mine = true;
    } else {
      inGroup = false;
      if (mine && /^(dis)?allow$/i.test(field) && value.trim()) rules.push({ allow: /^allow$/i.test(field), prefix: value.trim().replace(/\*.*$/, "").replace(/\$$/, "") });
    }
  }
  const best = rules.filter((r) => path.startsWith(r.prefix)).sort((a, b) => b.prefix.length - a.prefix.length || Number(b.allow) - Number(a.allow))[0];
  return best ? best.allow : true;
}

// MARK: Reading

class Skip extends Error {}

async function get(url: string, cap: number): Promise<{ bytes: Uint8Array; type: string; url: string }> {
  let res: Response;
  try {
    res = await publicFetch(url, { headers: HEADERS, timeoutMs: LIMITS.timeoutMs, maxRedirects: 5 });
  } catch (e) {
    if (e instanceof NotPublic) throw new Skip(`not a public address: ${e.message}`);
    if (e instanceof FetchTimeout) throw new Skip(`it ${e.message}`);
    throw new Skip(String((e as Error)?.message ?? e).slice(0, 160));
  }
  if (!res.ok) {
    await res.body?.cancel().catch(() => {});
    throw new Skip(`it answered ${res.status}`);
  }
  const type = res.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  try {
    return { bytes: await readCapped(res, cap), type, url: res.url || url };
  } catch (e) {
    throw new Skip(e instanceof RangeError ? "it was too big" : String((e as Error)?.message ?? e).slice(0, 160));
  }
}

async function page(url: string, kind: Source["kind"]): Promise<{ source: Source; links: { href: string; text: string }[] }> {
  const got = await get(url, LIMITS.htmlBytes);
  if (got.type && !/html|xml|text\/plain/.test(got.type)) throw new Skip(`it's ${got.type}, not a page`);
  const html = new TextDecoder().decode(got.bytes);
  const read = readPage(html, url);
  if (read.text.length < 40) throw new Skip("it shows nothing without JavaScript");
  return { source: { url, kind, title: read.title, text: cut(read.text, LIMITS.pageChars) }, links: read.links };
}

const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, "")}\n(cut here: the page goes on)`);

type Listing = { source: Source; shots: string[]; seller?: string };
async function listing(id: string, country: string, url: string): Promise<Listing> {
  const got = await get(`${lookupBase}?id=${id}&country=${country}&entity=software`, 2 * 1048576);
  let r: Record<string, unknown> | undefined;
  try { r = (JSON.parse(new TextDecoder().decode(got.bytes)) as { results?: Record<string, unknown>[] }).results?.[0]; } catch { throw new Skip("the App Store's answer didn't read"); }
  if (!r) throw new Skip("the App Store has no app with that id");
  const s = (k: string) => (typeof r![k] === "string" ? String(r![k]).trim() : "");
  const price = s("formattedPrice") || (typeof r.price === "number" ? `${r.price} ${s("currency")}` : "");
  const lines = [
    `Name: ${s("trackName")}`,
    price && `Price: ${price} (in-app purchases and subscriptions aren't in the listing's data)`,
    Array.isArray(r.genres) && `Category: ${(r.genres as string[]).join(", ")}`,
    typeof r.averageUserRating === "number" && `Rating: ${(r.averageUserRating as number).toFixed(1)} from ${r.userRatingCount ?? "?"} ratings`,
    Array.isArray(r.supportedDevices) && `Runs on: ${[...new Set((r.supportedDevices as string[]).map((d) => d.replace(/[^A-Za-z].*$/, "").replace(/^(iPhone|iPad|iPod|Watch|Apple|Mac).*/, "$1")))].filter(Boolean).join(", ")}`,
    "", "### Description", s("description"),
    s("releaseNotes") && "\n### What's new in the latest version", s("releaseNotes"),
  ].filter((x) => x !== false && x !== undefined && x !== "") as string[];
  const shots = [...((r.screenshotUrls as string[] | undefined) ?? []), ...((r.ipadScreenshotUrls as string[] | undefined) ?? [])];
  return { source: { url, kind: "app-store", title: s("trackName"), text: cut(lines.join("\n"), LIMITS.storeChars) }, shots, ...(s("sellerUrl") ? { seller: s("sellerUrl") } : {}) };
}

/** A screenshot small enough to show: Apple's image server makes any width ("…/300x0w.jpg"). */
async function screenshot(url: string): Promise<Screenshot> {
  const small = url.replace(/\/\d+x\d+[a-z]*\.(png|jpe?g|webp)$/i, "/300x0w.jpg");
  let got;
  try { got = await get(small, LIMITS.shotBytes); } catch (e) { if (small === url) throw e; got = await get(url, LIMITS.shotBytes); }
  const type = /^image\/(png|jpeg|gif|webp)$/.test(got.type) ? got.type : /\.png$/i.test(url) ? "image/png" : "image/jpeg";
  return { url, data: toBase64(got.bytes), mimeType: type };
}

/** Each site's robots.txt, for an hour. */
const robotsCache = new Map<string, { at: number; text: Promise<string> }>();
async function allowed(url: string): Promise<boolean> {
  const u = new URL(url);
  let hit = robotsCache.get(u.origin);
  if (!hit || Date.now() - hit.at > 3_600_000) {
    hit = { at: Date.now(), text: get(`${u.origin}/robots.txt`, 256 * 1024).then((g) => new TextDecoder().decode(g.bytes)).catch(() => "") };
    robotsCache.set(u.origin, hit);
    if (robotsCache.size > 200) robotsCache.delete(robotsCache.keys().next().value!);
  }
  return robotsAllow(await hit.text, u.pathname + u.search);
}

/** The link the person gave, checked: a public https web address. Throws with what to give instead. */
export function checkLink(raw: unknown): string {
  const link = String(raw ?? "").trim();
  let u: URL;
  try { u = new URL(/^[a-z]+:\/\//i.test(link) ? link : `https://${link}`); } catch { throw new Error(`"${link.slice(0, 200)}" isn't a link. Give the app's website or its App Store page, like https://example.com.`); }
  if (u.protocol === "http:") u.protocol = "https:";
  if (u.protocol !== "https:") throw new Error("original takes a web link (https://…): the app's website or its App Store page.");
  if (u.username || u.password) throw new Error("original takes a public link, without a name or password in it.");
  return u.href;
}

/** Reads the app's public pages: the link, then (together) the best pages it links to on its own
 *  site and its App Store listing, then a few screenshots. Throws only when nothing at all could
 *  be read. */
export async function study(raw: unknown): Promise<Study> {
  const t0 = performance.now();
  const link = checkLink(raw);
  const sources: Source[] = [], missed: Study["missed"] = [], shots: Screenshot[] = [];
  const miss = (url: string, e: unknown): void => { missed.push({ url, why: e instanceof Skip ? e.message : String((e as Error)?.message ?? e).slice(0, 160) }); };

  let links: { href: string; text: string }[] = [];
  let store = appStoreId(link);
  let site: string | undefined;
  let listed: Listing | undefined;
  if (store) {
    // A listing: the listing first, then the developer's own site from it.
    try { listed = await listing(store.id, store.country, link); sources.push(listed.source); site = listed.seller; } catch (e) { miss(link, e); }
  } else {
    try {
      const p = await page(link, "link");
      sources.push(p.source);
      links = p.links;
      site = link;
    } catch (e) { miss(link, e); }
    const found = links.map((l) => appStoreId(l.href)).find(Boolean);
    if (found) store = found;
  }

  const more: Promise<void>[] = [];
  if (store && !listed) {
    const url = `https://apps.apple.com/${store.country}/app/id${store.id}`;
    more.push(listing(store.id, store.country, url).then((l) => { listed = l; sources.push(l.source); }, (e) => miss(url, e)));
  }
  if (site && site !== link) {
    // The developer's site, found through the listing: read it, then pick from it below.
    more.push(page(site, "page").then((p) => { sources.push(p.source); links = p.links; }, (e) => miss(site!, e)));
  }
  await Promise.all(more);

  if (site) {
    const extra = pickPages(links, site);
    const read = await Promise.all(extra.map(async (url) => {
      try {
        if (!(await allowed(url))) throw new Skip("its robots.txt asks robots not to read it");
        return (await page(url, "page")).source;
      } catch (e) { miss(url, e); return null; }
    }));
    for (const s of read) if (s) sources.push(s);
  }

  if (listed?.shots.length) {
    const got = await Promise.all(listed.shots.slice(0, LIMITS.screenshots).map((u) => screenshot(u).catch((e) => { miss(u, e); return null; })));
    for (const s of got) if (s) shots.push(s);
  }

  if (!sources.length) {
    const why = missed.map((m) => `${m.url}: ${m.why}`).join("; ");
    throw new Error(`Nothing could be read from ${new URL(link).host} (${why}). Nothing was made. Give the app's App Store page or another page about it.`);
  }
  // All the text together stays readable in one answer: later pages are cut first.
  let left = LIMITS.totalChars;
  for (const s of sources) {
    s.text = left <= 0 ? "(left out: the pages above already fill the answer)" : cut(s.text, left);
    left -= s.text.length;
  }
  return { link, sources, screenshots: shots, missed, ms: Math.round(performance.now() - t0) };
}

/** The pages as the AI reads them in create's answer, after the method. */
export function studyText(s: Study): string {
  const parts = [OWN_VERSION_GUIDE, "", `## What the public pages say about ${s.link}`];
  for (const src of s.sources) {
    parts.push("", `### ${src.kind === "app-store" ? "App Store listing" : src.kind === "link" ? "The page you were given" : "Page"}: ${src.title || src.url}`, src.url, "", src.text);
  }
  if (s.missed.length) parts.push("", "### Couldn't be read", ...s.missed.map((m) => `- ${m.url}: ${m.why}`));
  if (s.screenshots.length) parts.push("", `### Screenshots from the App Store listing (${s.screenshots.length}, below)`, "They show how it works. Build that way of working with a look of your own.");
  return parts.join("\n");
}
