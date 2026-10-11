import { destination, type ConnectLabel } from "@/lib/connect";
import { Shell, TopBar } from "@/lib/ui";
import styles from "./connect.module.css";

/// The frame every connect page sits in: the quiet top bar with the site's logo and nothing else to
/// leave by, then whatever the page says. That logo is the only one on the page, and no other
/// app's mark is here: nothing on these pages vouches for who is asking. With `request` (a page about one
/// connection request), where access would go sits on a panel beside the form; stacked on a phone.
export default function ConnectCard({ request = false, label = null, children }: {
  request?: boolean; label?: ConnectLabel | null; children: React.ReactNode;
}) {
  const to = label?.redirect_host ? destination(label.redirect_host, label.loopback) : null;
  return (
    <Shell>
      <TopBar />
      <main className={styles.page} data-layout={request ? "panel" : "card"}>
        <div className={styles.shell}>
          {request && (
            <aside className={styles.side}>
              <RequestPicture to={to} />
              <div className={styles.sideWords}>
                <p className={styles.sideText}>
                  {to ? <><span className={styles.sideCaption}>Access goes to</span> <b className={styles.sideHost}>{to}</b></> : <b className={styles.sideHost}>An app wants to use your notes</b>}
                </p>
                <p className={styles.sideNote}>It can read your notes, and edit them if you say so. Nothing is shared until you allow it.</p>
                {label?.claimed_name && <p className={styles.sideClaim}>It calls itself &ldquo;{label.claimed_name}&rdquo;.</p>}
              </div>
            </aside>
          )}
          <div className={styles.card}>
            {children}
          </div>
        </div>
        <p className={styles.foot}>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a>
        </p>
      </main>
    </Shell>
  );
}

/// A note on one side (a heading, two lines and a short checklist, no logo), where access would go on the other, and a dotted line between them:
/// not joined yet. Flat cut paper, in the picture colours of DeviceLead.tsx.
function RequestPicture({ to }: { to: string | null }) {
  return (
    <svg className={`${styles.picture} ${styles.sidePicture}`} viewBox="0 0 300 150" role="presentation" focusable="false" aria-hidden="true">
      <g transform="rotate(-5 62 78)">
        <rect className={styles.pShadow} x="22" y="30" width="84" height="104" rx="12" />
        <rect className={styles.pPaper} x="18" y="24" width="84" height="104" rx="12" />
        <rect className={styles.pBar} x="28" y="40" width="44" height="6" rx="3" />
        <rect className={styles.pBarSoft} x="28" y="56" width="62" height="5" rx="2.5" />
        <rect className={styles.pBarSoft} x="28" y="68" width="54" height="5" rx="2.5" />
        {[0, 1].map((i) => (
          <g key={i}>
            <circle className={styles.pCheck} cx="32" cy={90.5 + i * 14} r="4" />
            <rect className={styles.pBarSoft} x="42" y={88 + i * 14} width={i ? 30 : 42} height="5" rx="2.5" />
          </g>
        ))}
      </g>
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} className={styles.pDash} cx={124 + i * 12} cy="78" r="2.6" />)}
      <rect className={styles.pShadow} x="186" y="40" width="104" height="82" rx="13" />
      <rect className={styles.pBody} x="182" y="34" width="104" height="82" rx="13" />
      <rect className={styles.pScreen} x="187" y="52" width="94" height="59" rx="8" />
      {[0, 1, 2].map((i) => <circle key={i} className={styles.pDot} cx={193 + i * 8} cy="43" r="2.3" />)}
      <rect className={styles.pPaper} x="196" y="62" width="76" height="16" rx="8" />
      <rect className={styles.pBar} x="203" y="68" width="44" height="4" rx="2" />
      <rect className={styles.pBarSoft} x="196" y="88" width="60" height="5" rx="2.5" />
      <rect className={styles.pBarSoft} x="196" y="99" width="42" height="5" rx="2.5" />
    </svg>
  );
}
