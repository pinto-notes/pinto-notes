import { destination, requestWords, type ConnectLabel } from "@/lib/connect";
import { Shell, TopBar } from "@/lib/ui";
import styles from "./connect.module.css";

/// The frame every connect page sits in: the quiet top bar with the site's logo and nothing else to
/// leave by, then whatever the page says. That logo is the only one on the page, and no other
/// app's mark is here: nothing on these pages vouches for who is asking. With `request` (a page about one
/// connection request), the question with the app's name (requestWords) sits on a panel beside the
/// form; stacked on a phone.
export default function ConnectCard({ request = false, label = null, children }: {
  request?: boolean; label?: ConnectLabel | null; children: React.ReactNode;
}) {
  const to = label?.redirect_host ? destination(label.redirect_host, label.loopback) : null;
  const words = requestWords(label);
  return (
    <Shell>
      <TopBar />
      <main className={styles.page} data-layout={request ? "panel" : "card"}>
        <div className={styles.shell}>
          {request && (
            <aside className={styles.side}>
              <RequestPicture to={to} />
              <div className={styles.sideWords}>
                <p className={styles.sideText}><b className={styles.sideHost}>{words.title}</b></p>
                <p className={styles.sideNote}>{words.gets}</p>
                {words.who && <p className={styles.sideClaim}>{words.who}</p>}
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

/// A paper-cut note and a chat bubble, joined by a thread with a leaf knot (public/art/connect.webp):
/// the one picture on these pages, the same for every state. Decoration: no alt text, and no app's
/// mark, so nothing in it vouches for who is asking.
function RequestPicture({ to: _to }: { to: string | null }) {
  return <img className={`${styles.picture} ${styles.sidePicture} ${styles.sideArt}`} src="/art/connect.webp" alt="" width={1672} height={941} decoding="async" />;
}
