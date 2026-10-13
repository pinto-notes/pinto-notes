import h from "./page-hero.module.css";

/// A site page's opening: its one display headline, one line under it, the page's actions, and
/// paper-craft art drawn for the page. One alignment per page: a centred hero gets centred section
/// heads under it (`data-align` on the hero; the page's own sections follow it). `art` sits under
/// the text when centred, and beside it when left-aligned on wide screens.
export type HeroArt = { src: string; alt: string; width: number; height: number };

export function PageHero({ title, lede, align = "center", art, artSlot, children, small }: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "center" | "left";
  art?: HeroArt;
  /// Anything drawn in the art's place (a capture set into the art, a player).
  artSlot?: React.ReactNode;
  children?: React.ReactNode;
  /// A quieter title for pages that are mostly reading (help, changelog).
  small?: boolean;
}) {
  const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });
  const picture = artSlot ?? (art && (
    <img className={h.art} src={art.src} alt={art.alt} width={art.width} height={art.height} fetchPriority="high" decoding="async" />
  ));
  return (
    <section className={h.hero} data-align={align} data-art={picture ? "" : undefined}>
      <div className={h.text}>
        <h1 className={`${h.title} ${small ? h.small : ""} rise`} {...rise(0)}>{title}</h1>
        {lede && <p className={`${h.lede} rise`} {...rise(1)}>{lede}</p>}
        {children && <div className={`${h.actions} rise`} {...rise(2)}>{children}</div>}
      </div>
      {picture && <div className={`${h.picture} rise-soft`} {...rise(3)}>{picture}</div>}
    </section>
  );
}
