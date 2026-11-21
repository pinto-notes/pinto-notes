import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "bear-alternative-kostenlos");

// German version of /blog/bear-notes-alternative-free, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "bear notes alternative" returned that phrase and "bear notes alternative reddit";
// "bear alternative notizen kostenlos" returned no suggestions. Kept the unambiguous app name.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/not201900c07/mac
// gives "Ablage" > "Markdown importieren" and "Ordnerstruktur beim Import beibehalten".
// Bear facts and Pinto claims follow the English post. Bear's own menu names remain as documented there.

const ui = UI.de;
const CHECK = `Bear-Import prüfen
- [ ] Text mit der Notiz in Bear vergleichen
- [ ] Ein Bild in der importierten Notiz öffnen
- [ ] Checkliste und Tabelle prüfen
- [ ] Einem Link zu einer anderen Notiz folgen
- [ ] Prüfen, wie Tags erscheinen
- [ ] Den ursprünglichen Export behalten`;

const faq = [
  { q: "Kann ich Bear ohne Pro nutzen?", a: ["Ja. Mit Bear Free kannst du Notizen lokal schreiben und als Markdown exportieren. Für die Synchronisierung über iCloud brauchst du Bear Pro. Wenn du nur ein Gerät nutzt, kann die kostenlose Version reichen."] },
  { q: "Brauche ich für den Markdown-Export ein Bear-Abo?", a: ["Nein. Bear nennt Markdown und TextBundle als kostenlose Exportformate. Wähle auf dem Mac einige Notizen aus und nutze File, Export Notes. Probiere den Import erst mit wenigen Notizen."] },
  { q: "Übernimmt Pinto Notes alle Bear-Funktionen?", a: ["Das ist nicht versprochen. Pinto importiert auf dem Mac Markdown samt Anhängen und Bildern. Prüfe insbesondere Tags und Links. Bear-Einstellungen und ältere Bear-Versionen werden nicht als Teil des Imports zugesagt."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="bear-alternative-kostenlos"
    intro={<>Pinto Notes ist eine kostenlose Bear-Alternative für iPhone und Mac. Du kannst Bear-Notizen auf dem Mac importieren. Apple Notizen ist eine weitere kostenlose Wahl, wenn du Ordner und geteilte Notizen möchtest.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#optionen", label: "Kostenlose Optionen" },
      { href: "#bear", label: "Bei Bear bleiben" },
      { href: "#import", label: "Export und Import" },
      { href: "#pruefen", label: "Notizen prüfen" },
      { href: "#ki", label: "Pinto und KI" },
    ]}>
      <p>Pinto Notes passt, wenn du eine App wie Apple Notizen mit Bear-Import und Zugriff für verbundenes ChatGPT oder Claude suchst. Apple Notizen bietet Ordner und geteilte iCloud-Notizen. Bear selbst ist für lokale Notizen kostenlos; iCloud-Sync gehört zu Pro.</p>
      <PostCta slug="de/bear-alternative-kostenlos" path="/de/blog/bear-alternative-kostenlos" position="answer" ui={ui.cta} title="Probiere deine Bear-Notizen in Pinto Notes">
        <p>Lade Pinto Notes kostenlos auf deinen Mac und importiere zunächst einige Bear-Notizen. Nach dem Verbinden können ChatGPT oder Claude sie lesen und bearbeiten. Die App ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    faq={faq}>
    <h2 id="optionen">Was du kostenlos bekommst</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Geeignet für</th><th scope="col">Vor dem Wechsel prüfen</th></tr></thead><tbody>
      <tr><th scope="row">Bear Free</th><td>Lokale Markdown-Notizen</td><td>iCloud-Sync braucht Pro</td></tr>
      <tr><th scope="row">Apple Notizen</th><td>Ordner und geteilte Notizen</td><td>Darstellung importierter Markdown-Dateien</td></tr>
      <tr><th scope="row">Pinto Notes</th><td>Bedienung wie Apple Notizen, mit verbundenem ChatGPT oder Claude</td><td>Nur für iPhone und Mac</td></tr>
    </tbody></table></div>
    <p>Apple bietet <a href="https://apps.apple.com/us/app/notes/id1110145109">Notizen kostenlos</a> an, mit iCloud-Sync und Zusammenarbeit. Alle, die eine Notiz teilen, brauchen einen Apple Account. Mehr zu den Unterschieden steht in <a href="/de/blog/apple-notizen-vs-bear">Apple Notizen oder Bear</a>.</p>
    <p>Pinto Notes hat keine App für Windows oder Android und keine Web-App. Wenn du diese Geräte brauchst, probiere die wichtigsten Notizen aus, bevor du wechselst.</p>

    <h2 id="bear">Wann Bear die bessere Wahl bleibt</h2>
    <p>Bear hat einen Markdown-Editor mit Tags und einklappbaren Überschriften. Wenn du nur lokal schreibst, kannst du beim kostenlosen Plan bleiben. Laut <a href="https://bear.app/#pricing">Bear</a> benötigen iCloud-Sync und die Suche in Bildern und PDFs Pro.</p>
    <p>Auch Bear hat einen Zugang für KI. Die <a href="https://bear.app/faq/command-line-interface/">offizielle Anleitung</a> beschreibt ab Bear 2.8 auf dem Mac einen Claude-Connector, einen lokalen MCP-Server und eine Kommandozeile. Damit lassen sich Notizen suchen, lesen, erstellen und bearbeiten. Wenn es dir nur um KI geht, prüfe diese Möglichkeit zuerst.</p>

    <h2 id="import">Erst einige Notizen exportieren</h2>
    <p>Wähle in Bear auf dem Mac mit gedrückter Command-Taste einige Notizen aus und nutze File, Export Notes. Laut <a href="https://bear.app/faq/export-your-notes/">Bear-Anleitung</a> sind Markdown und TextBundle kostenlose Exportformate. Nimm eine Notiz mit Bild dazu.</p>
    <p>Für Pinto Notes exportierst du Markdown samt Anhängen und wählst danach den Ordner. Bilder kommen mit. Öffne in Pinto Notes auf dem Mac das Menü File und wähle Bear. Die <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> zeigt die Schritte. Deine Notizen in Bear bleiben unverändert.</p>
    <p>Für Apple Notizen wählst du auf dem Mac „Ablage“ &gt; „Markdown importieren“ und danach die Dateien oder den Ordner. Du kannst „Ordnerstruktur beim Import beibehalten“ wählen, bei Bedarf unter „Optionen“. So beschreibt es <a href="https://support.apple.com/de-de/guide/notes/not201900c07/mac">Apple</a>. Prüfe die Kopien, bevor du die ganze Sammlung importierst.</p>

    <h2 id="pruefen">Vergleiche die Notizen selbst</h2>
    <p>Öffne das Original und die importierte Kopie nebeneinander. Text kann stimmen, während ein Link woanders hinführt. Prüfe die Teile, die du tatsächlich nutzt.</p>
    <Keep title="Checkliste für den Bear-Import" text={CHECK} note="Behalte sie zusammen mit dem Export, während du die neue App ausprobierst." />
    <p>Bear bietet beim Export eine Option, Tags zu behalten. Aktiviere sie, wenn du den Tag-Text brauchst. Prüfe dann, wie die Ziel-App damit umgeht. Das Tag im Text bedeutet nicht dieselbe Organisation in der Seitenleiste. Bear-Einstellungen und ältere Versionen gehören nicht zur exportierten Notiz.</p>

    <h2 id="ki">Importierte Notizen mit KI nutzen</h2>
    <p>Pinto Notes sieht auf iPhone und Mac aus wie Apple Notizen und funktioniert ähnlich. Es behält jede frühere Version einer Notiz in Pinto. Das ist keine Zusage, alte Bear-Versionen zu importieren.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> können sie deine Notizen lesen und bearbeiten. Lass eine importierte Projektnotiz suchen und offene Aufgaben zusammenfassen. Bitte dann um einen nächsten Schritt in derselben Notiz. Prüfe die Änderung in Pinto Notes.</p>
  </LocalPostPage>;
}
