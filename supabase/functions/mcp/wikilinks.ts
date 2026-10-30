// Obsidian's wiki links on the server, by the app's rules (Pane/Model/WikiLinks.swift): how a link
// is read, which note it resolves to, and how a rename points the links that led to a note at its
// new title. Pure, so it is unit-tested (wikilinks.test.ts); files_tools.ts does the reading and
// saving. Ranges are UTF-16 offsets, as in the app's NSString ranges.

export type Link = {
  /** The whole `[[…]]` (or `![[…]]`). */
  start: number;
  end: number;
  embed: boolean;
  /** The note part as written: "Projects/Kitchen remodel". */
  target: string;
  heading?: string;
  alias?: string;
  /** Where the target sits, before any `#heading` or `|alias` (spaces around it included). */
  targetStart: number;
  targetEnd: number;
};

const PATTERN = /(!?)\[\[([^\[\]\n]+?)\]\]/g;
const INLINE_CODE = /(`+)(?:(?!\1).)+?\1/g;

/** Every wiki link in `text`, outside fenced code blocks and inline code. */
export function links(text: string): Link[] {
  if (!text.includes("[[")) return [];
  const out: Link[] = [];
  let fence: string | null = null;
  let at = 0;
  for (const line of text.split("\n")) {
    const start = at;
    at += line.length + 1;
    const t = line.trim();
    if (fence) { if (t.startsWith(fence)) fence = null; continue; }
    if (t.startsWith("```")) { fence = "```"; continue; }
    if (t.startsWith("~~~")) { fence = "~~~"; continue; }
    if (!line.includes("[[")) continue;
    const code = [...line.matchAll(INLINE_CODE)].map((m) => [m.index!, m.index! + m[0].length]);
    for (const m of line.matchAll(PATTERN)) {
      if (code.some(([a, b]) => m.index! >= a && m.index! < b)) continue;
      const link = parse(m, start);
      if (link) out.push(link);
    }
  }
  return out;
}

function parse(m: RegExpMatchArray, lineStart: number): Link | null {
  const embed = m[1].length > 0;
  const inner = m[2];
  const innerStart = lineStart + m.index! + m[1].length + 2;
  const bar = inner.indexOf("|");
  const targetPart = bar < 0 ? inner : inner.slice(0, bar);
  const hash = targetPart.indexOf("#");
  const namePart = hash < 0 ? targetPart : targetPart.slice(0, hash);
  const target = namePart.trim();
  // `[[#Heading]]` points inside this note; `[[ ]]` at nothing.
  if (!target) return null;
  const heading = hash < 0 ? undefined : targetPart.slice(hash + 1).trim() || undefined;
  const alias = bar < 0 ? undefined : inner.slice(bar + 1).trim() || undefined;
  return {
    start: lineStart + m.index!, end: lineStart + m.index! + m[0].length, embed, target, heading, alias,
    targetStart: innerStart, targetEnd: innerStart + namePart.length,
  };
}

/** The last part of a link's target, without a `.md` ending. */
export function nameOf(target: string): string {
  const parts = target.split("/").filter(Boolean);
  return stripExtension(parts.length ? parts[parts.length - 1] : target).trim();
}

/** The folders written in front of the name ("Projects/Kitchen remodel" → ["Projects"]). */
export function foldersOf(target: string): string[] {
  return target.split("/").filter(Boolean).slice(0, -1).map((s) => s.trim());
}

export function stripExtension(s: string): string {
  return s.replace(/\.(md|markdown)$/i, "");
}

/** How titles are compared: case and spacing aside, and markdown's backslash escapes ("a\_b" is "a_b"). */
export function key(title: string): string {
  const unescaped = title.includes("\\") ? title.replace(/\\([!-/:-@\[-`{-~])/g, "$1") : title;
  return unescaped.split(/\s+/).filter(Boolean).join(" ").toLowerCase();
}

/** `text` with every link `pointsAt` picks retargeted to `newTitle`. The folders written in front
 *  of the name, the heading, the alias and the spaces before the name stay as they were. */
export function retarget(text: string, newTitle: string, pointsAt: (l: Link) => boolean): string {
  let out = text;
  for (const l of links(text).reverse()) {
    if (!pointsAt(l)) continue;
    const written = text.slice(l.targetStart, l.targetEnd);
    const lead = written.match(/^ */)![0];
    const folders = foldersOf(l.target);
    const prefix = folders.length ? folders.join("/") + "/" : "";
    out = out.slice(0, l.targetStart) + lead + prefix + newTitle + out.slice(l.targetEnd);
  }
  return out;
}

export type Entry = { id: string; title: string; folders: string[]; updated: number };

/** Every note's title and folders, resolving links the way the app's WikiIndex does: by name, case
 *  aside; folders written in front narrow it down; among notes with the same title the nearest to
 *  the linking note wins (same folder, then most folders in common, then the one edited last). */
export class WikiIndex {
  private byKey = new Map<string, Entry[]>();
  constructor(readonly entries: Entry[]) {
    for (const e of entries) {
      const k = key(e.title);
      const list = this.byKey.get(k);
      if (list) list.push(e); else this.byKey.set(k, [e]);
    }
  }

  titled(title: string): Entry[] { return this.byKey.get(key(title)) ?? []; }

  /** The note a link's target points at, seen from a note in `from` (its folder names). */
  resolve(target: string, from: string[] = []): string | undefined {
    // A title can have a slash in it ("Q1/Q2 plan").
    let hits = this.titled(stripExtension(target.trim()));
    const folders = foldersOf(target).map((f) => f.toLowerCase());
    if (!hits.length) {
      hits = this.titled(nameOf(target));
      if (folders.length) {
        const narrowed = hits.filter((e) => endsWith(e.folders.map((f) => f.toLowerCase()), folders));
        // Folders that don't match (the note was moved) don't lose the link.
        if (narrowed.length) hits = narrowed;
      }
    }
    if (hits.length <= 1) return hits[0]?.id;
    const here = from.map((f) => f.toLowerCase());
    const same = (e: Entry) => e.folders.length === here.length && e.folders.every((f, i) => f.toLowerCase() === here[i]);
    const shared = (e: Entry) => { let n = 0; while (n < e.folders.length && n < here.length && e.folders[n].toLowerCase() === here[n]) n++; return n; };
    let best = hits[0];
    for (const e of hits.slice(1)) {
      const better = same(e) !== same(best) ? same(e)
        : shared(e) !== shared(best) ? shared(e) > shared(best)
        : e.updated > best.updated;
      if (better) best = e;
    }
    return best.id;
  }

  /** The same index with one note's title swapped (to resolve links as they were before a rename). */
  withTitle(title: string, id: string): WikiIndex {
    return new WikiIndex(this.entries.map((e) => e.id === id ? { ...e, title } : e));
  }
}

function endsWith(a: string[], suffix: string[]): boolean {
  return suffix.length <= a.length && suffix.every((s, i) => a[a.length - suffix.length + i] === s);
}

/** A note's text after `id` was renamed from `oldTitle` to `newTitle`: the links that led to it
 *  under the old title (seen from `from`, the linking note's folders) name the new one. */
export function followRename(body: string, from: string[], before: WikiIndex, id: string, oldTitle: string, newTitle: string): string {
  const oldKey = key(oldTitle);
  if (!body.includes("[[")) return body;
  return retarget(body, newTitle, (l) => key(nameOf(l.target)) === oldKey && before.resolve(l.target, from) === id);
}

/** The lines of `body` with a link that resolves to `id`, each once, trimmed and cut to `max`
 *  characters around the link. */
export function linkLines(body: string, from: string[], index: WikiIndex, id: string, max = 240): string[] {
  const out: string[] = [];
  const hits = links(body).filter((l) => index.resolve(l.target, from) === id);
  for (const l of hits) {
    const s = body.lastIndexOf("\n", l.start - 1) + 1;
    const e = body.indexOf("\n", l.end);
    let line = body.slice(s, e < 0 ? body.length : e);
    if (line.length > max) {
      const at = Math.max(0, Math.min(l.start - s - Math.floor((max - (l.end - l.start)) / 2), line.length - max));
      line = (at > 0 ? "…" : "") + line.slice(at, at + max) + (at + max < line.length ? "…" : "");
    }
    line = line.trim();
    if (!out.includes(line)) out.push(line);
  }
  return out;
}
