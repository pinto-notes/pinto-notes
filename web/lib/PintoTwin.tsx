import DownloadLink from "@/app/DownloadLink";
import { APP_STORE_URL } from "./site";
import s from "./side-by-side.module.css";

/// The Pinto half of a side-by-side (lib/SideBySide.tsx), for a picker of templates (lib/TemplatePicker.tsx): the template
/// the reader just picked, drawn in Apple Notes above it, gets its Pinto Notes counterpart straight under it, with one line
/// on what Pinto does, one on what Apple Notes leaves to you, and a button that downloads Pinto Notes (experiment B42,
/// 25 Nov 2026, blog-growth/research/templates-hub-deep-pass-2026-11-25.md). Before, the templates post showed the Packing
/// list's side-by-side whichever template was picked, and each template's own Pinto line linked to its template page, whose
/// Use template fails without the app.
/// The button is the side-by-side's: the App Store on an iPhone, the Mac download on a Mac, the download page anywhere else,
/// counted as the post's blog_cta_clicked at position "picker", naming the Pinto template.
type Img = { src: string; width: number; height: number };
export type Twin = { label: string; line: string; apple: string; alt: string; phone: Img; desk: Img; frame?: boolean };

export function PintoTwin({ slug, template, twin, hidden }: { slug: string; template: string; twin: Twin; hidden?: boolean }) {
  const cta = (action: string) => ({ "data-cta": slug, "data-cta-position": "picker", "data-cta-action": action, "data-cta-template": template });
  return (
    <figure className={`${s.card} ${s.pinto} ${s.twin}`} hidden={hidden} aria-label={twin.label}>
      <p className={s.label}>{twin.label}</p>
      <div className={s.screen} data-frame={twin.frame === false ? "none" : undefined}>
        <picture>
          <source media="(min-width: 900px)" type="image/avif" srcSet={`${twin.desk.src}.avif`} width={twin.desk.width} height={twin.desk.height} />
          <source media="(min-width: 900px)" type="image/webp" srcSet={`${twin.desk.src}.webp`} width={twin.desk.width} height={twin.desk.height} />
          <source type="image/avif" srcSet={`${twin.phone.src}.avif`} />
          <img src={`${twin.phone.src}.webp`} alt={twin.alt} width={twin.phone.width} height={twin.phone.height} loading="lazy" decoding="async" />
        </picture>
      </div>
      <figcaption className={s.line}>{twin.line}</figcaption>
      <p className={s.notes}>In Apple Notes: {twin.apple}</p>
      <DownloadLink className={`${s.button} pi-apple pi-not-ios`} {...cta("download_mac")}>{GET}</DownloadLink>
      <a className={`${s.button} pi-ios-only`} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" {...cta("app_store")}>{GET}</a>
      <a className={`${s.button} pi-other-only`} href="/download" {...cta("download_page")}>{GET}</a>
    </figure>
  );
}

const GET = "Get Pinto Notes, free";
