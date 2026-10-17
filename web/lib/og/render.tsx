import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import grounds from "./covers/grounds.json";

/// Share cards (1200 × 630) in the site's own look: the page theme's colours, the app icon and name,
/// a headline with the amber marker, and a real capture of the app on the right. Rendered at build.
/// Inter (SIL Open Font License, Inter-OFL.txt) stands in for SF Pro, which can't be bundled.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const THEMES = {
  cream: { bg: "#fff4e6", ink: "#2a1d10", muted: "#74604c", mark: "rgba(240, 144, 26, 0.38)", chip: "#f7e5cc", shadow: "rgba(60, 20, 0, 0.5)" },
  leaf: { bg: "#2e180a", ink: "#fbeedd", muted: "#d9bf9f", mark: "rgba(245, 165, 58, 0.34)", chip: "#40240f", shadow: "rgba(0, 0, 0, 0.55)" },
};

const here = (f: string) => path.join(process.cwd(), "lib", "og", f);
const file = (f: string) => fs.readFileSync(here(f));
const dataUrl = (p: string, type: string) => `data:${type};base64,${fs.readFileSync(p).toString("base64")}`;

/// A blog post's cover: the JPEG copy in lib/og/covers (the renderer can't read WebP), named like the
/// card picture in public/blog.
export type Cover = { name: string; width: number; height: number };

type Card = {
  theme: keyof typeof THEMES;
  /// The headline, with the words to mark between [ and ].
  title: string;
  sub: string;
  /// Small labels under the sub line.
  chips?: string[];
  /// The iPhone capture, the big app icon, or a blog post's cover.
  art: "phone" | "icon" | Cover;
  titleSize?: number;
};

export function renderCard({ theme, title, sub, chips = [], art, titleSize = 74 }: Card) {
  const t = THEMES[theme];
  const mark = dataUrl(path.join(process.cwd(), "public", "mark.png"), "image/png");
  // Words wrap one by one; the marked phrase stays together, like "your AI" on the site, and "|" breaks the line.
  const words = title.split(/(\[[^\]]+\]\S*|\|)/).filter(Boolean).flatMap((p) => (p.startsWith("[") || p === "|" ? [p] : p.trim().split(/\s+/).filter(Boolean)));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: t.bg, position: "relative", overflow: "hidden", fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 64px 72px", width: art === "phone" ? 780 : typeof art === "object" ? 640 : 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={mark} width={64} height={64} style={{ borderRadius: 15, boxShadow: "0 2px 6px rgba(60,30,5,0.18)" }} />
            <div style={{ fontSize: 32, fontWeight: 800, color: t.ink, letterSpacing: -0.6 }}>Pinto Notes</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontSize: titleSize, fontWeight: 800, lineHeight: 1.02, letterSpacing: -titleSize * 0.042, color: t.ink }}>
              {words.map((w, i) => {
                if (w === "|") return <div key={i} style={{ width: "100%", height: 0 }} />;
                const m = w.match(/^\[([^\]]+)\](.*)$/);
                if (!m) return <span key={i} style={{ marginRight: titleSize * 0.26 }}>{w}</span>;
                return (
                  <span key={i} style={{ display: "flex", marginRight: titleSize * 0.26 }}>
                    <span style={{ backgroundImage: `linear-gradient(transparent 52%, ${t.mark} 52%, ${t.mark} 88%, transparent 88%)`, padding: "0 6px", margin: "0 -6px" }}>{m[1]}</span>
                    {m[2] && <span style={{ marginLeft: 6 }}>{m[2]}</span>}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 27, lineHeight: 1.38, color: t.muted, fontWeight: 600, maxWidth: 680 }}>{sub}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {chips.map((c) => (
              <div key={c} style={{ display: "flex", fontSize: 21, fontWeight: 600, color: t.ink, background: t.chip, borderRadius: 12, padding: "8px 16px" }}>{c}</div>
            ))}
          </div>
        </div>

        {typeof art === "object" ? (
          // A post's cover, in a rounded panel on the right, centred top to bottom.
          <div style={{ position: "absolute", right: 64, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
            <img
              src={dataUrl(here(`covers/${art.name}.jpg`), "image/jpeg")}
              width={440}
              height={Math.round((440 * art.height) / art.width)}
              style={{ borderRadius: 24, boxShadow: `0 30px 60px -18px ${t.shadow}, 0 0 0 1px rgba(60,20,0,0.08)` }}
            />
          </div>
        ) : art === "phone" ? (
          // The iPhone capture in a dark body, running off the bottom edge.
          <div style={{ position: "absolute", right: 64, top: 58, display: "flex", width: 330, height: 700, borderRadius: 56, background: "#17120d", padding: 11, boxShadow: "0 30px 60px -18px rgba(60,20,0,0.45)" }}>
            <img src={dataUrl(here("iphone-lisbon.png"), "image/png")} width={308} height={670} style={{ borderRadius: 46 }} />
          </div>
        ) : (
          <div style={{ position: "absolute", right: 90, top: 150, display: "flex" }}>
            <img src={mark} width={330} height={330} style={{ borderRadius: 74, boxShadow: `0 36px 70px -20px ${t.shadow}` }} />
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: file("Inter-SemiBold.ttf"), weight: 600, style: "normal" },
        { name: "Inter", data: file("Inter-ExtraBold.ttf"), weight: 800, style: "normal" },
      ],
    },
  );
}

/// A template's share card, in the gallery card's look: the template's paper-cut cover on the right,
/// its flat ground carried across the card under the app's name, the title and the tagline, in ink
/// or cream, whichever reads on that ground.
export function renderTemplateCard({ slug, title, tagline, ground, ink }: { slug: string; title: string; tagline: string; ground: string; ink: "dark" | "light" }) {
  const color = ink === "dark" ? "#2a1d10" : "#fff4e6";
  const mark = dataUrl(path.join(process.cwd(), "public", "mark.png"), "image/png");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: ground, position: "relative", overflow: "hidden", fontFamily: "Inter" }}>
        <img src={dataUrl(here(`template-covers/${slug}.jpg`), "image/jpeg")} width={630} height={630} style={{ position: "absolute", right: -50, top: 0 }} />
        {/* The cover's left edge melts into the ground, so the card reads as one picture. */}
        <div style={{ position: "absolute", left: 620, top: 0, width: 150, height: 630, backgroundImage: `linear-gradient(90deg, ${ground}, ${ground}00)` }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 0 60px 68px", width: 600, color }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={mark} width={56} height={56} style={{ borderRadius: 13, boxShadow: "0 2px 6px rgba(40,20,0,0.25)" }} />
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>Pinto Notes</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: title.length > 18 ? 62 : 74, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>{title}</div>
            <div style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 600, opacity: 0.9 }}>{tagline}</div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#2a1d10", background: "#fffaf3", borderRadius: 12, padding: "10px 18px" }}>Free template for your AI</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: file("Inter-SemiBold.ttf"), weight: 600, style: "normal" },
        { name: "Inter", data: file("Inter-ExtraBold.ttf"), weight: 800, style: "normal" },
      ],
    },
  );
}

/// A blog post's share card, in the template cards' look: the post's cover large on the right, its own
/// ground colour (sampled from the cover's left edge, lib/og/covers/grounds.json) carried across the
/// card under the app's name, the title and the post's kind. Light ink on dark covers.
export function renderPostCard({ cover, title, kind }: { cover: string; title: string; kind: string }) {
  const g = (grounds as Record<string, { ground: string; ink: "dark" | "light"; w: number; h: number }>)[cover];
  const ground = g?.ground ?? "#fff4e6", ink = g?.ink ?? "dark";
  const color = ink === "dark" ? "#2a1d10" : "#fff4e6";
  const mark = dataUrl(path.join(process.cwd(), "public", "mark.png"), "image/png");
  // The whole cover, as wide as the right half and centred top to bottom; the ground (its own edge
  // colour) fills around it, and every edge melts into the ground, so the card reads as one picture.
  // Drawn a fifth larger than the half it sits in, so the drawing reads at share size; the box clips it.
  const boxW = 660, w = Math.round(boxW * 1.2), h = g ? Math.round((w * g.h) / g.w) : 494, boxH = Math.min(630, h), top = Math.round((630 - boxH) / 2);
  const titleSize = title.length > 64 ? 46 : title.length > 44 ? 52 : title.length > 28 ? 58 : 68;
  const melt = (dir: string) => `linear-gradient(${dir}, ${ground}, ${ground}00)`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: ground, position: "relative", overflow: "hidden", fontFamily: "Inter" }}>
        <div style={{ position: "absolute", right: 0, top, width: boxW, height: boxH, display: "flex", overflow: "hidden" }}>
          <img src={dataUrl(here(`covers/covers/${cover}.jpg`), "image/jpeg")} width={w} height={h} style={{ position: "absolute", left: Math.round((boxW - w) / 2), top: Math.round((boxH - h) / 2) }} />
        </div>
        <div style={{ position: "absolute", left: 1200 - boxW, top, width: 90, height: boxH, backgroundImage: melt("90deg") }} />
        <div style={{ position: "absolute", left: 1200 - boxW, top, width: boxW, height: 40, backgroundImage: melt("180deg") }} />
        <div style={{ position: "absolute", left: 1200 - boxW, top: top + boxH - 40, width: boxW, height: 40, backgroundImage: melt("0deg") }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 0 60px 64px", width: 520, color }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={mark} width={56} height={56} style={{ borderRadius: 13, boxShadow: "0 2px 6px rgba(40,20,0,0.25)" }} />
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>Pinto Notes</div>
          </div>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.05, letterSpacing: -titleSize * 0.04 }}>{title}</div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#2a1d10", background: "#fffaf3", borderRadius: 12, padding: "10px 18px" }}>{kind}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: file("Inter-SemiBold.ttf"), weight: 600, style: "normal" },
        { name: "Inter", data: file("Inter-ExtraBold.ttf"), weight: 800, style: "normal" },
      ],
    },
  );
}
