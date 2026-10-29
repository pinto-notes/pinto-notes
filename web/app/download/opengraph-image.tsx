import { renderCard } from "@/lib/og/render";

export { size, contentType } from "@/lib/og/render";
export const alt = "Download Pinto Notes for Mac. Free, for macOS 26 or later.";

export default function OpenGraphImage() {
  return renderCard({
    theme: "cream",
    title: "Download it [for Mac].",
    sub: "Free. Import your Apple Notes and connect ChatGPT or Claude. The iPhone app is coming soon.",
    chips: ["macOS 26 or later", "Updates install themselves"],
    art: "icon",
    titleSize: 84,
  });
}
