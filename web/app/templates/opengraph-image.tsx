import { renderCard } from "@/lib/og/render";

export { size, contentType } from "@/lib/og/render";
export const alt = "Pinto Notes templates: note templates that Claude and Claude Code fill in for you.";

export default function OpenGraphImage() {
  return renderCard({
    theme: "cream",
    title: "Templates [your AI] fills in.",
    sub: "Habit trackers, meeting notes, standups, meal plans and more, for Claude and Claude Code to fill in.",
    chips: ["Free", "Claude", "Claude Code", "Codex"],
    art: "icon",
    titleSize: 84,
  });
}
