/// The landing pages as the footer links them (app/SiteChrome.tsx): short names only, so the
/// pages' copy stays out of the browser bundle. landings.test.ts checks this list against
/// lib/landings.ts, so a new page shows up here too.
export const LANDING_LINKS: { href: string; label: string }[] = [
  { href: "/for/chatgpt", label: "For ChatGPT" },
  { href: "/for/claude", label: "For Claude" },
  { href: "/for/claude-code", label: "For Claude Code and Codex" },
  { href: "/alternatives/apple-notes", label: "Apple Notes alternative" },
  { href: "/alternatives/notion", label: "Notion alternative" },
  { href: "/alternatives/obsidian", label: "Obsidian alternative" },
];
