import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import s from "./s.module.css";

/** The download buttons (the Mac's, the iPhone's, and what other systems see), as on every screen of
 *  this page that offers them. */
export const Cta = ({ className = "" }: { className?: string }) => (
  <div className={`${x.ctas} ${s.ctas} ${className}`} data-cta>
    <Download note={false} />
    <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
      Get it for iPhone
    </a>
    <a className={x.offMac} href="/download">Download for Mac</a>
    <p className={`${x.fine} ${x.offApple}`} data-off-apple>
      Pinto Notes is for iPhone and Mac.{" "}
      <a href={mailLink(SITE_URL)} onClick={(e) => sendLink(navigator, e, SITE_URL)}>Send myself the link</a>
    </p>
  </div>
);
