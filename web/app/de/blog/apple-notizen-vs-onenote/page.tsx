import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-vs-onenote");

// German version of /blog/apple-notes-vs-onenote, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen vs onenote“, „onenote oder apple notizen“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/102537, https://support.apple.com/de-de/108047, https://support.apple.com/de-de/105119, https://support.apple.com/de-de/102223, https://support.apple.com/de-de/guide/iphone/iphd939f0a1c/ios.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-vs-onenote"
      intro={<>Apple Notizen ist für schnelle Notizen auf iPhone und Mac. OneNote ist eher ein Ringordner mit freien Seiten. Beide sind kostenlos nutzbar, aber sie ordnen Informationen anders.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vergleich", label: "Auf einen Blick" },
        { href: "#apple", label: "Was Apple Notizen besser kann" },
        { href: "#onenote", label: "Was OneNote besser kann" },
        { href: "#wechsel", label: "Zwischen beiden wechseln" },
        { href: "#pinto", label: "Wenn du Apple Notizen mit KI willst" },
      ]}>
        <p>Apple Notizen für private Listen und schnellen Text auf Apple-Geräten. OneNote für Windows, Android, Zeichnungen auf freien Seiten und Microsoft 365 in Schule oder Arbeit.</p>
        <PostCta slug="de/apple-notizen-vs-onenote" path="/de/blog/apple-notizen-vs-onenote" position="answer" ui={ui.cta} title="Apple Notizen mit KI und Versionen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="vergleich">Auf einen Blick</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">Punkt</th><th scope="col">Apple Notizen</th><th scope="col">OneNote</th></tr></thead><tbody>
        <tr><td>Geräte</td><td>iPhone, Mac, iCloud.com</td><td>Windows, Mac, iPhone, Android, Web</td></tr>
        <tr><td>Ordnung</td><td>Ordner, Tags, intelligente Ordner</td><td>Notizbücher, Abschnitte, Seiten</td></tr>
        <tr><td>Seite</td><td>Text von oben nach unten</td><td>Textfelder und Zeichnungen frei platzierbar</td></tr>
        <tr><td>Versionen</td><td>Keine</td><td>Frühere Seitenversionen</td></tr>
        <tr><td>Gelöschtes</td><td>30 Tage</td><td>60 Tage</td></tr>
        <tr><td>Sperre</td><td>Einzelne Notiz</td><td>Ganzer Abschnitt</td></tr>
        <tr><td>Speicher</td><td>5 GB iCloud kostenlos, geteilt</td><td>5 GB OneDrive kostenlos, geteilt</td></tr>
      </tbody></table></div>
      <h2 id="apple">Was Apple Notizen besser kann</h2>
      <p>Die App ist auf iPhone und Mac vorinstalliert. Mit demselben Apple Account synchronisiert iCloud. Ordner, Tags, intelligente Ordner, Checklisten und Suche genügen oft. Die Suche findet auch Handschrift und Text in Scans. Mathematische Ergebnisse rechnen in der Notiz; Apple Intelligence kann Transkripte zusammenfassen.</p>
      <p>Auf dem iPhone zeichnest du mit dem Finger. Du sperrst einzelne Notizen mit Passwort, Face ID oder Touch ID. Nicht sperrbar sind etwa geteilte Notizen und solche mit Tags, PDF-, Audio- oder Video-Anhängen. Vergisst du das Passwort, kann Apple nicht helfen.</p>
      <p>Auf Windows gibt es iCloud.com, aber keine native App. Die Seiten sind nicht frei wie in OneNote. Gelöschte Notizen bleiben 30 Tage, eine Versionsgeschichte gibt es nicht. Zum Teilen brauchen alle einen Apple Account.</p>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Apple Notizen auf dem Mac mit Ordnern und Checkliste." caption="Eine Einkaufsliste in Apple Notizen." />
      <h2 id="onenote">Was OneNote besser kann</h2>
      <p>Ein Notizbuch enthält Abschnitte und Seiten. Du kannst Text, Markierungen und Zeichnungen frei auf der Seite platzieren. OneNote läuft auf Windows, Mac, iPhone, Android und im Browser. Microsoft nennt die unterstützten Apps kostenlos.</p>
      <p>Die Mac-App synchronisiert über OneDrive und hält eine lokale Kopie für die Offline-Nutzung. Ein kostenloses Microsoft-Konto hat 5 GB für OneDrive, Outlook und andere Dienste zusammen. Microsoft 365 Personal und Family bieten mehr Speicher.</p>
      <p>OneNote hält frühere Seitenversionen. Auf dem Mac findest du sie unter „View“ &gt; „Page Versions“ in OneNote und kannst eine alte Version wiederherstellen. Gelöschte Notizen bleiben 60 Tage. Text lässt sich aus Bildern kopieren, wobei die Erkennung 24 bis 48 Stunden dauern kann.</p>
      <p>Du teilst ganze Notizbücher mit Bearbeitungs- oder Leserechten. Copilot kann zusammenfassen und Aufgaben erstellen, hängt aber vom Microsoft-Plan ab. Auf dem Mac wandelt OneNote Handschrift nicht in Text um. Es sperrt Abschnitte statt einzelner Seiten; gesperrte Abschnitte fehlen in der Suche. Ein vergessenes Passwort kann auch Microsoft nicht zurückholen.</p>
      <p>Auf dem Mac findest du frühere Seiten unter „View“ &gt; „Page Versions“ und kannst eine alte Fassung wiederherstellen. Ein Bild lässt sich per Kontextmenü in Text umwandeln; Microsoft weist darauf hin, dass das 24 bis 48 Stunden dauern kann. Ein Notizbuch teilst du mit einem Link und gibst Bearbeitungs- oder Leserechte. OneNote für Mac exportiert jeweils nur eine Seite als PDF.</p>
      <h2 id="wechsel">Zwischen beiden wechseln</h2>
      <p>Keiner der beiden Dienste importiert das Format des anderen direkt. Apple Notizen importiert auf dem Mac TXT, RTF, HTML, Markdown und ENEX über „Ablage“ &gt; „In ,Notizen’ importieren“. OneNote für Mac exportiert jeweils eine Seite als PDF. Für viele Seiten bleibt nur Kopieren und Einfügen oder das Aufbewahren der PDFs.</p>
      <p>Bei Hunderten Seiten kann es sinnvoll sein, alte Notizbücher in OneNote lesbar zu lassen und neue Notizen in der gewählten App zu beginnen.</p>
      <h2 id="pinto">Wenn du Apple Notizen mit KI willst</h2>
      <p>Pinto Notes behält Ordner, Pins, Checklisten und Tabellen auf iPhone und Mac. ChatGPT, Claude, Claude Code und Codex können nach dem Verbinden lesen und bearbeiten. Frühere Versionen bleiben erhalten; die Markdown-Notizen sind verschlüsselt.</p>
      <p>Pinto Notes importiert Apple Notizen, Obsidian, Evernote, Google Keep, Bear und Textdateien auf dem Mac. Einen OneNote-Import gibt es nicht; hier gilt ebenfalls Kopieren und Einfügen. Es gibt keine Windows-, Android- oder Web-App und keine Handschrift.</p>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes auf dem Mac zeigt eine von ChatGPT geänderte Reise-Notiz." caption="Änderungen von ChatGPT lassen sich rückgängig machen." />
      <h2 id="wahl">Welche solltest du nehmen?</h2>
      <p>Apple Notizen für persönliche Notizen auf iPhone und Mac. OneNote für freie Seiten, Microsoft 365 und mehrere Plattformen. Pinto Notes für das vertraute Apple-Gefühl mit ChatGPT oder Claude. Mehr Apps stehen unter <a href="/de/blog/apple-notizen-alternativen">Alternativen zu Apple Notizen</a>.</p>
    </LocalPostPage>
  );
}
