// @vitest-environment happy-dom
// Who wrote a comment in a browser thread: a person's initial on their colour; an AI's own mark,
// Claude's or ChatGPT's, as the app shows it (BoardCommentAvatar). Round 16: an AI's reply showed
// a grey "C" beside a person's initial.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "@/app/s/[id]/BoardPage";
import { AI_GLYPHS, aiGlyphFor } from "./ai-glyphs";
import type { BoardController } from "./board-controller";
import type { Comment } from "./board-doc";

vi.mock("next/navigation", () => ({ usePathname: () => "/s/x", useRouter: () => ({ push: () => {} }), notFound: () => { throw new Error("not found"); } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null, host: HTMLDivElement | null = null;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; });
function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
}

const ctl = { comments: { color: (c: Comment) => (c.ai ? "#48484A" : "#B5445B") } } as unknown as BoardController;
const comment = (over: Partial<Comment> = {}): Comment => ({
  id: "c-1", by: "22222222-BBBB-4BBB-8BBB-222222222222", name: "Sara", text: "Done", created: "2026-11-16T09:00:00Z", resolved: false, version: 1, ...over,
} as Comment);

describe("who wrote a comment, in a browser thread", () => {
  it("an AI's reply shows its own mark, white on graphite, and no letter", () => {
    for (const [ai, glyph] of [["Claude", "claude"], ["ChatGPT", "openai"]] as const) {
      const h = mount(<Avatar ctl={ctl} c={comment({ ai })} />);
      const span = h.querySelector("span")!;
      expect(span.dataset.aiMark).toBe(glyph);
      expect(span.textContent).toBe("");
      const path = span.querySelector("svg path");
      expect(path?.getAttribute("d")).toBe(AI_GLYPHS[glyph]);
      expect(span.querySelector("svg")?.getAttribute("fill")).toBe("#FFFFFF");
      expect(span.style.background).toMatch(/#48484A|rgb\(72, 72, 74\)/i);
      act(() => root?.unmount()); host?.remove(); root = null; host = null;
    }
  });

  it("a person's shows their initial on their colour", () => {
    const h = mount(<Avatar ctl={ctl} c={comment()} />);
    const span = h.querySelector("span")!;
    expect(span.textContent).toBe("S");
    expect(span.dataset.aiMark).toBeUndefined();
    expect(span.querySelector("svg")).toBeNull();
  });

  it("an AI without a mark here keeps its initial", () => {
    expect(aiGlyphFor("Some new AI")).toBeNull();
    const h = mount(<Avatar ctl={ctl} c={comment({ ai: "Mystery" })} />);
    expect(h.querySelector("span")!.textContent).toBe("M");
  });

  it("names the AIs as the app does", () => {
    expect(["ChatGPT", "Codex", "Claude", "Claude Code", "Gemini", "Grok", "Cursor"].map(aiGlyphFor)).toEqual(["openai", "openai", "claude", "claude", "gemini", "grok", "cursor"]);
  });
});
