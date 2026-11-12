import { DirectDownloadLink, MacAppStoreBadge } from "../DownloadLink";
import PlatformNote from "../PlatformNote";
import k from "./download.module.css";

/// The Mac App Store badge, the direct download a small link under it, and an optional quiet line.
/// Hidden on iPhone and other systems, where PlatformNote says what's coming instead (`note={false}`
/// when the page says it itself).
export function Download({ className = "", quiet, note = true }: { className?: string; quiet?: React.ReactNode; note?: boolean }) {
  return (
    <div className={`${k.cta} ${className}`}>
      <div className={`${k.mac} pi-apple pi-not-ios`}>
        <MacAppStoreBadge className={k.badge} height={50} />
        <DirectDownloadLink className={k.direct} />
      </div>
      {quiet && <p className={`${k.ctaQuiet} pi-apple pi-not-ios`}>{quiet}</p>}
      {note && <PlatformNote place="hero" />}
    </div>
  );
}
