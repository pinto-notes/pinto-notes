import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./ai-connect.module.css";

/// The AIs a post can name. Each mark is the app's own logo, unaltered, in its own colour, on a plain
/// paper disc with clear space around it: we only say which apps connect.
const AIS = {
  chatgpt: { name: "ChatGPT", glyph: "openai", color: "#0d0d0d" },
  claude: { name: "Claude", glyph: "claude", color: "#d97757" },
  "claude-code": { name: "Claude Code", glyph: "claude", color: "#d97757" },
  codex: { name: "Codex", glyph: "openai", color: "#0d0d0d" },
  grok: { name: "Grok", glyph: "grok", color: "#0d0d0d" },
  gemini: { name: "Gemini", glyph: "gemini", color: "#3b7cf0" },
} as const;
export type ConnectAI = keyof typeof AIS;

/// The graphic that ends a rebuilt post: the AIs' marks on paper discs, joined by a thread to a
/// paper-cut note in the middle. Two AIs sit one each side; three or four split left and right.
/// Pure HTML over one picture, so it stays sharp at any width and reads at phone width.
export function AIConnect({ ais = ["chatgpt", "claude"], caption }: { ais?: ConnectAI[]; caption?: string }) {
  const list = ais.slice(0, 4);
  const left = list.filter((_, i) => i % 2 === 0);
  const right = list.filter((_, i) => i % 2 === 1);
  const names = list.map((a) => AIS[a].name);
  const label = `${names.slice(0, -1).join(", ")}${names.length > 1 ? " and " : ""}${names.at(-1)} connect to a note in Pinto Notes`;
  const side = (items: ConnectAI[], where: "l" | "r") => items.map((a, i) => {
    const y = items.length === 1 ? 50 : 27 + i * 46;
    return (
      <span key={a} className={s.ai} data-side={where} style={{ "--y": `${y}%` } as React.CSSProperties}>
        <span className={s.disc}><AIGlyph name={AIS[a].glyph} size={40} color={AIS[a].color} /></span>
        <span className={s.name}>{AIS[a].name}</span>
      </span>
    );
  });
  const thread = (items: ConnectAI[], where: "l" | "r") => items.map((a, i) => {
    const y = items.length === 1 ? 50 : 27 + i * 46;
    const [x1, x2] = where === "l" ? [24, 35] : [76, 65];
    const mid = (x1 + x2) / 2;
    return <path key={a} d={`M ${x1} ${y} C ${mid} ${y}, ${mid} 50, ${x2} 50`} />;
  });
  return (
    <figure className={s.figure}>
      <div className={s.art} role="img" aria-label={label} data-count={list.length}>
        <img src="/art/ai-connect.webp" alt="" width={1672} height={941} loading="lazy" decoding="async" />
        <svg className={s.threads} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {thread(left, "l")}{thread(right, "r")}
        </svg>
        {side(left, "l")}{side(right, "r")}
      </div>
      {caption && <figcaption className={s.caption}>{caption}</figcaption>}
    </figure>
  );
}
