import type { Release } from "./changelog";

/// The changelog page's own words for each minor release: at most three short highlights, and every
/// change as one short line. content/changelog.json stays as it is, since the apps bundle it (its
/// highlights are the app's What's New card); a release with no entry here falls back to it.
/// Emil, 14 October 2026: "there is too much info on each release".
export type Line = { text: string; href?: string; link?: string };
type WebRelease = { highlights: string[]; items: Line[] };

export const CHANGELOG_WEB: Record<string, WebRelease> = {
  "1.2": {
    highlights: ["Amber Notes is now Pinto Notes.", "Keep writing offline. It syncs later.", "Files live in folders, with viewers."],
    items: [
      { text: "Amber Notes is now Pinto Notes. AI connections keep working." },
      { text: "The Mac app is renamed. Add it to your Dock again." },
      { text: "A Mac download asks for your key once.", href: "/blog/encrypted-notes-app-for-ai", link: "How the key works" },
      { text: "Write offline. Everything syncs when you're back." },
      { text: "Files live in folders, with 2 GB of storage." },
      { text: "Viewers for PDFs and pictures." },
      { text: "Edit HTML and code files, with a preview for HTML." },
      { text: "Edited files keep their earlier versions." },
      { text: "Settings is arranged in tabs." },
      { text: "Connect an AI by scanning a QR code." },
      { text: "On a Mac, one click allows an AI." },
      { text: "A shorter question: \"Allow Claude to use your notes?\"" },
      { text: "An AI's request waits until you answer it." },
      { text: "Each connected AI shows its icon and name." },
      { text: "A new leaf icon on iPhone and Mac." },
      { text: "Opens faster, and uses no processor time when idle." },
      { text: "Fixed: another account's folders left in the sidebar." },
    ],
  },
  "1.1": {
    highlights: ["Your notes are encrypted on your devices.", "Approve an AI by typing a number.", "Import from Evernote, Google Keep and Markdown."],
    items: [
      { text: "Everything is encrypted on your devices. We can't read it." },
      { text: "Your key syncs through iCloud Keychain." },
      { text: "Save a recovery key in Settings › Privacy & Security." },
      { text: "Approve an AI by typing a two-digit number." },
      { text: "Each device shows when an AI connects." },
      { text: "A notification when an AI asks to connect." },
      { text: "Export your notes as Markdown." },
      { text: "Connect Incredible." },
      { text: "Import from Evernote, Google Keep and Markdown files." },
      { text: "One Import Notes button for every source." },
      { text: "Templates from pintonotes.com open in the app." },
      { text: "\"Use this note\" copies a shared note into yours." },
      { text: "After updating, connect your AI apps once more." },
    ],
  },
  "1.0": {
    highlights: ["Notes, folders, checklists, tables and files.", "ChatGPT and Claude read and update notes.", "Import your notes from Apple Notes."],
    items: [
      { text: "Notes, folders, checklists, tables, photos and files." },
      { text: "ChatGPT and Claude read and update notes, with your approval." },
      { text: "Changes sync between Mac and iPhone in about a second." },
      { text: "Share a note as a web page." },
      { text: "Import from Apple Notes." },
      { text: "Sign in with Apple or email." },
    ],
  },
};

/// The patch releases of the Mac app, newest first within each minor. Dates are the release tags'
/// (mac-v<version>, UTC). Notes only where one was written for people: the GitHub release notes
/// (1.2.26 to 1.2.28, shortened to one line) and the release commits' titles (1.1.1, 1.1.2). The rest
/// shipped without a note, so they show their version and date only.
export type Patch = { version: string; date: string; note?: string };

export const PATCHES: Patch[] = [
  { version: "1.2.28", date: "2026-10-13", note: "A calmer main window and a quieter note list." },
  { version: "1.2.27", date: "2026-10-13", note: "Large libraries open, type and sync much faster." },
  { version: "1.2.26", date: "2026-10-13", note: "Connect Codex and Claude Code with one press, and four templates with apps." },
  ...["1.2.25", "1.2.24", "1.2.23", "1.2.22", "1.2.21", "1.2.20", "1.2.19", "1.2.18", "1.2.17", "1.2.16", "1.2.15", "1.2.14", "1.2.13"].map((version) => ({ version, date: "2026-10-13" })),
  ...["1.2.12", "1.2.11", "1.2.10", "1.2.9", "1.2.8", "1.2.7", "1.2.6"].map((version) => ({ version, date: "2026-10-12" })),
  ...["1.2.5", "1.2.4", "1.2.3", "1.2.2"].map((version) => ({ version, date: "2026-10-11" })),
  { version: "1.2.1", date: "2026-10-10" },
  { version: "1.1.2", date: "2026-10-01", note: "Smoother connecting and sign-in." },
  { version: "1.1.1", date: "2026-10-01", note: "Templates in the app." },
];

const parts = (v: string) => v.split(".").map(Number);
const atMost = (v: string, live: string) => {
  const [a, b = 0, c = 0] = parts(v), [x, y = 0, z = 0] = parts(live);
  return a !== x ? a < x : b !== y ? b < y : c <= z;
};

/// A minor release's words for the page, and its patches that people can get (none newer than `live`).
export function webRelease(r: Release, live: string | null): { highlights: string[]; items: Line[]; patches: Patch[] } {
  const own = CHANGELOG_WEB[r.version];
  const patches = PATCHES.filter((p) => p.version.startsWith(`${r.version}.`) && (!live || atMost(p.version, live)));
  return {
    highlights: (own?.highlights ?? r.highlights ?? r.items).slice(0, 3),
    items: own?.items ?? r.items.map((text) => ({ text })),
    patches,
  };
}
