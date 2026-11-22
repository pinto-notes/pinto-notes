import s from "./side-by-side.module.css";

/// The Apple Notes template posts' pattern "E" (22 Nov 2026, Emil: "helping people in other apps when we do help them, but
/// we also show immediately how much better it is in Pinto Notes"). Straight under the template to copy: two cards with the
/// same content and numbers. "In Apple Notes" is a real capture of the post's template pasted into Apple Notes on macOS 27;
/// the Pinto Notes card is the matching Pinto template, really rendered from the same data, with one button to its
/// template page. On a phone they stack and the Pinto card is warmer and larger, a phone screen in a frame; from 900 px
/// they sit side by side and the Pinto card shows a crop of the Mac app, large enough to read.
/// Pictures are AVIF with a WebP fallback; `width` and `height` are the file's pixels (2x).
type Img = { src: string; width: number; height: number };

export function SideBySide({ slug, apple, pinto }: {
  slug: string;
  apple: Img & { alt: string; line: string };
  pinto: { title: string; line: string; alt: string; phone: Img; desk: Img; href: string; button: string };
}) {
  return (
    <section className={s.vs} aria-label="The same template in Apple Notes and in Pinto Notes">
      <figure className={`${s.card} ${s.apple}`}>
        <p className={s.label}>In Apple Notes</p>
        <div className={s.shot} data-tall={apple.height > apple.width * 1.2 || undefined}>
          <picture>
            <source type="image/avif" srcSet={`${apple.src}.avif`} />
            <img src={`${apple.src}.webp`} alt={apple.alt} width={apple.width} height={apple.height} loading="lazy" decoding="async" />
          </picture>
        </div>
        <figcaption className={s.line}>{apple.line}</figcaption>
      </figure>
      <figure className={`${s.card} ${s.pinto}`}>
        <p className={s.label}>{pinto.title}</p>
        <div className={s.screen}>
          <picture>
            <source media="(min-width: 900px)" type="image/avif" srcSet={`${pinto.desk.src}.avif`} width={pinto.desk.width} height={pinto.desk.height} />
            <source media="(min-width: 900px)" type="image/webp" srcSet={`${pinto.desk.src}.webp`} width={pinto.desk.width} height={pinto.desk.height} />
            <source type="image/avif" srcSet={`${pinto.phone.src}.avif`} />
            <img src={`${pinto.phone.src}.webp`} alt={pinto.alt} width={pinto.phone.width} height={pinto.phone.height} loading="lazy" decoding="async" />
          </picture>
        </div>
        <figcaption className={s.line}>{pinto.line}</figcaption>
        <a className={s.button} href={pinto.href} data-cta={slug} data-cta-position="side-by-side" data-cta-action="template_page">{pinto.button}</a>
      </figure>
    </section>
  );
}
