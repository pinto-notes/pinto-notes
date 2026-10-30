import { renderCard } from "@/lib/og/render";

export { size, contentType } from "@/lib/og/render";
export const alt = "Pinto Notes: the notebook you and your AI share. A paper-cut scene of a woman at dusk planning tomorrow with ChatGPT, her Pinto note filling in on her phone.";

export default function OpenGraphImage() {
  return renderCard({
    theme: "cream",
    title: "The notebook | [you and your AI] | share.",
    sub: "Every chat starts from zero. Give ChatGPT and Claude your notes, and they finally know your life.",
    chips: ["Free", "Imports Apple Notes", "Open source"],
    // The home page's hero card, captured from the page (2x).
    art: { name: "home-hero", width: 880, height: 1013 },
  });
}
