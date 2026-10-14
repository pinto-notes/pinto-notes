import DownloadLink from "@/app/DownloadLink";
import PlatformNote from "@/app/PlatformNote";
import { APP_STORE_LIVE, APP_STORE_URL } from "./site";
import c from "./closing-band.module.css";

/// The ending every site page shares: a full-width band in the leaf's dark brown, the page's last
/// line as its title, one primary and at most one secondary, and one line of fine print. The
/// primary is the Mac download unless the page passes its own (a template's verb, an email). The
/// iPhone app is said in the fine print until it's on the App Store, never as a button that does
/// nothing. Visitors on other platforms get the platform note instead of the download.
type Action = { href: string; label: string; external?: boolean };

/// The band's fine print: the one place a page says what the download needs, and where the iPhone
/// app stands. `MAC_FINE` is for a band whose text already says it's free.
export const MAC_FINE = APP_STORE_LIVE ? "Requires macOS 26." : "Requires macOS 26. The iPhone app is coming soon.";
export const BAND_FINE = `Free. ${MAC_FINE}`;

/// The band's button styles, for a page whose primary is its own component (a template's Use button).
export const bandButton = { primary: c.primary, secondary: c.secondary };

export function ClosingBand({ title, text, primary, secondary, actions, fine = BAND_FINE, id = "closing" }: {
  title: React.ReactNode;
  text?: React.ReactNode;
  /// The one thing to do. Leave it out for the Mac download.
  primary?: Action;
  secondary?: Action;
  /// The page's own buttons, drawn with `bandButton`, in place of primary and secondary.
  actions?: React.ReactNode;
  fine?: React.ReactNode;
  id?: string;
}) {
  const ext = (x: Action) => (x.external ? { target: "_blank", rel: "noopener noreferrer" } : {});
  const second = secondary ?? (APP_STORE_LIVE && !primary ? { href: APP_STORE_URL, label: "Get it for iPhone", external: true } : undefined);
  return (
    <section className={c.band} aria-labelledby={id} data-closing-band="">
      <div className={c.inner}>
        <img src="/mark-256.png" alt="" width={88} height={88} className={c.icon} />
        <h2 id={id} className={c.title}>{title}</h2>
        {text && <p className={c.text}>{text}</p>}
        <div className={`${c.ctas} ${primary || actions ? "" : "pi-apple pi-not-ios"}`.trim()}>
          {actions ?? <>{primary
            ? <a className={c.primary} href={primary.href} {...ext(primary)}>{primary.label}</a>
            : <DownloadLink className={c.primary}>Download for Mac</DownloadLink>}
          {second && <a className={c.secondary} href={second.href} {...ext(second)}>{second.label}</a>}</>}
        </div>
        {!primary && !actions && <PlatformNote place="band" />}
        {fine && <p className={`${c.fine} ${primary || actions ? "" : "pi-apple pi-not-ios"}`.trim()}>{fine}</p>}
      </div>
    </section>
  );
}
