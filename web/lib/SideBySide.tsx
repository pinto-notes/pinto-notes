import DownloadLink from "@/app/DownloadLink";
import { APP_STORE_URL } from "./site";
import s from "./side-by-side.module.css";

/// The Apple Notes template posts' pattern "E" (22 Nov 2026, Emil: "helping people in other apps when we do help them, but
/// we also show immediately how much better it is in Pinto Notes"). Straight under the template to copy: two cards with the
/// same content and numbers. "In Apple Notes" is a real capture of the post's template pasted into Apple Notes on macOS 27;
/// the Pinto Notes card is the matching Pinto template, really rendered from the same data, with one button that
/// downloads Pinto Notes. On a phone they stack and the Pinto card is warmer and larger, a phone screen in a frame; from 900 px
/// they sit side by side and the Pinto card shows a crop of the Mac app, large enough to read.
/// `frame: false` for pictures of the Mac app (the plain-note templates, drawn at phone width): no phone frame, so they
/// don't pass for the iPhone app.
/// Pictures are AVIF with a WebP fallback; `width` and `height` are the file's pixels (2x).
/// The button (experiment B39, 24 Nov 2026) is a plain download, as in the post's download card: the App Store on an
/// iPhone, the Mac download on a Mac, the download page anywhere else. It used to open the template's page, whose Use
/// template needs the app: 15 of 20 people who tapped it got "not found". `template` names the Pinto template in the
/// click's tracking (blog_cta_clicked, template).
type Img = { src: string; width: number; height: number };

export function SideBySide({ slug, apple, pinto }: {
  slug: string;
  apple: Img & { alt: string; line: string };
  pinto: { title: string; line: string; alt: string; phone: Img; desk: Img; template?: string; frame?: boolean };
}) {
  const cta = (action: string) => ({
    "data-cta": slug, "data-cta-position": "side-by-side", "data-cta-action": action, ...(pinto.template ? { "data-cta-template": pinto.template } : {}),
  });
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
        <div className={s.screen} data-frame={pinto.frame === false ? "none" : undefined}>
          <picture>
            <source media="(min-width: 900px)" type="image/avif" srcSet={`${pinto.desk.src}.avif`} width={pinto.desk.width} height={pinto.desk.height} />
            <source media="(min-width: 900px)" type="image/webp" srcSet={`${pinto.desk.src}.webp`} width={pinto.desk.width} height={pinto.desk.height} />
            <source type="image/avif" srcSet={`${pinto.phone.src}.avif`} />
            <img src={`${pinto.phone.src}.webp`} alt={pinto.alt} width={pinto.phone.width} height={pinto.phone.height} loading="lazy" decoding="async" />
          </picture>
        </div>
        <figcaption className={s.line}>{pinto.line}</figcaption>
        <DownloadLink className={`${s.button} pi-apple pi-not-ios`} {...cta("download_mac")}>{GET}</DownloadLink>
        <a className={`${s.button} pi-ios-only`} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" {...cta("app_store")}>{GET}</a>
        <a className={`${s.button} pi-other-only`} href="/download" {...cta("download_page")}>{GET}</a>
      </figure>
    </section>
  );
}

const GET = "Get Pinto Notes, free";
