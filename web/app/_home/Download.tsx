import DownloadLink from "../DownloadLink";
import PlatformNote from "../PlatformNote";
import k from "./download.module.css";

/// The download button, with an optional quiet line under it. Hidden on iPhone and other systems,
/// where PlatformNote says what's coming instead (`note={false}` when the page says it itself).
export function Download({ className = "", quiet, note = true }: { className?: string; quiet?: React.ReactNode; note?: boolean }) {
  return (
    <div className={`${k.cta} ${className}`}>
      <div className="pi-apple pi-not-ios"><DownloadLink className={k.primary}><Apple /> Download for Mac</DownloadLink></div>
      {quiet && <p className={`${k.ctaQuiet} pi-apple pi-not-ios`}>{quiet}</p>}
      {note && <PlatformNote place="hero" />}
    </div>
  );
}

const Apple = () => <svg width="14" height="17" viewBox="0 0 15 18" aria-hidden="true" fill="currentColor"><path d="M12.3 9.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8C3.2 4.6 1.8 5.4 1 6.8c-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.3-.9-2.3-3.8zM10.1 3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z" /></svg>;
