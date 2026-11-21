import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "evernote-alternative");

// German version of /blog/evernote-alternative (21 Nov 2026). Google autocomplete hl=de, gl=de,
// read 21 Nov: „evernote alternative“, „evernote alternative 2026“, „evernote alternative kostenlos“,
// „evernote alternative open source“, „evernote alternative mac“, „evernote alternative self hosted“;
// „evernote alternative mac“ also returned „best evernote alternative for mac“.
// German Apple pages read 21 Nov 2026: de-de/102223 (ENEX import on Mac, unsupported content),
// de-de/guide/notes/not201900c07/mac („Ablage“ > „In ,Notizen’ importieren“, tags).
// Other apps' facts and routes are from the English original; no local prices added.

const ui = UI.de;
const FAQ = [
  { q: "Welche kostenlosen Evernote-Alternativen importieren meine Notizbücher?", a: ["Apple Notizen, Pinto Notes, Obsidian und Joplin können Evernote-Dateien im Format .enex importieren. Obsidian Sync kostet extra; bei Joplin wählst du selbst einen Synchronisierungsdienst. Laut Evernote können auch kostenlose Accounts exportieren."] },
  { q: "Kann ich eine ENEX-Sicherung in Notion importieren?", a: ["Notions offizieller Import verbindet sich mit deinem Evernote-Account. Ein Upload einer .enex-Datei ist in der Anleitung nicht beschrieben. Apple Notizen, Pinto Notes, Obsidian, Bear und Joplin dokumentieren dagegen einen Dateiimport."] },
  { q: "Kann ich Evernote nur mit dem iPhone verlassen?", a: ["Evernote bietet den Export laut eigener Anleitung nur in der Desktop-App für Mac und Windows. Bear kann eine vorhandene .enex-Datei auf dem iPhone importieren, aber du musst sie erst exportieren. Notions Account-Import läuft am Desktop oder im Web."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="evernote-alternative"
    intro={<>Apple Notizen ist eine einfache Evernote-Alternative für persönliche Notizen auf Mac und iPhone. Pinto Notes ergänzt KI-Zugriff, Obsidian speichert Markdown-Dateien, Notion passt zu Teams, Bear zum Schreiben und Joplin zu offenen Notizbüchern.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vergleich", label: "Sechs Apps vergleichen" }, { href: "#export", label: "Aus Evernote exportieren" },
      { href: "#apple", label: "Importwege" }, { href: "#pruefen", label: "Import prüfen" },
    ]}>
      <p>Apple Notizen, Pinto Notes, Obsidian und Joplin sind kostenlose Optionen, die Evernotes .enex-Dateien lesen. Auch Bear importiert sie, für iCloud-Synchronisierung brauchst du dort Pro. Notion eignet sich für gemeinsame Arbeit, verbindet sich aber mit deinem Evernote-Account, statt eine .enex-Datei hochzuladen.</p>
      <PostCta slug="de/evernote-alternative" path="/de/blog/evernote-alternative" position="answer" ui={ui.cta} title="Nimm deine Evernote-Notizbücher mit">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Importiere deine Evernote-Notizbücher auf dem Mac. Danach können ChatGPT oder Claude deine Notizen lesen und bearbeiten, sobald du sie verbunden hast.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
      alt="Das Ablage-Menü von Pinto Notes auf dem Mac mit dem Import aus Evernote und weiteren Importoptionen."
      caption="Pinto Notes bietet auf dem Mac einen Evernote-Import im Ablage-Menü. Bild: Pinto Notes." />}
    faq={FAQ}>
    <h2 id="vergleich">Welche Evernote-Alternative passt zu dir?</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Geeignet für</th><th scope="col">Evernote-Import</th><th scope="col">Vorher prüfen</th></tr></thead><tbody>
      <tr><th scope="row">Apple Notizen</th><td>Persönliche Notizen auf Apple-Geräten</td><td>.enex auf dem Mac</td><td>Nicht unterstützte Anhänge oder Funktionen entfallen</td></tr>
      <tr><th scope="row">Pinto Notes</th><td>Apple-Notizen-Gefühl mit ChatGPT oder Claude</td><td>.enex auf dem Mac; Notizbücher werden Ordner</td><td>Nur iPhone und Mac</td></tr>
      <tr><th scope="row">Obsidian</th><td>Lokale Markdown-Dateien und verknüpfte Recherche</td><td>.enex über das offizielle Importer-Plugin</td><td>Synchronisierung gesondert wählen</td></tr>
      <tr><th scope="row">Notion</th><td>Teamseiten und Datenbanken</td><td>Evernote-Account auf Desktop oder im Web verbinden</td><td>Kein dokumentierter .enex-Upload</td></tr>
      <tr><th scope="row">Bear</th><td>Schreiben in Markdown mit Tags</td><td>.enex auf Mac oder iPhone</td><td>iCloud-Synchronisierung braucht Pro</td></tr>
      <tr><th scope="row">Joplin</th><td>Offene Notizbücher und Web Clipper</td><td>.enex in der Desktop-App</td><td>Synchronisierungsdienst und Importformat wählen</td></tr>
    </tbody></table></div>
    <p>Die Importwege stammen aus den Anleitungen der Anbieter, geprüft am 21. November 2026.</p>
    <h2 id="export">Zuerst aus Evernote exportieren</h2>
    <p>Wähle in Evernotes Desktop-App auf Mac oder Windows ein Notizbuch, dann Exportieren und ENEX. Lass Tags und weitere benötigte Eigenschaften aktiviert. Exportiere jedes Notizbuch einzeln und behalte die Dateien als Sicherung. Laut Evernote geht das auch mit einem kostenlosen Account, aber nicht in Evernote Web. Die <a href="https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML">Exportanleitung</a> zeigt die Schritte.</p>
    <h2 id="apple">Apple Notizen für den Alltag auf Apple-Geräten</h2>
    <p>Apple Notizen passt zu persönlichen Notizen, Checklisten und gesammelten Informationen. Du kannst Ordner und Tags nutzen und Inhalte durchsuchen. iCloud macht Notizen auf Geräten mit demselben Apple Account verfügbar.</p>
    <p>Wähle auf dem Mac einen Ordner unter iCloud oder „Auf meinem Mac“, dann Ablage und die Importfunktion für Notizen. Wähle deine .enex-Dateien. Für Notizen auf dem iPhone importierst du unter iCloud. Laut <a href="https://support.apple.com/de-de/guide/notes/not201900c07/mac">Apples Mac-Anleitung</a> kommen Tags ab macOS 13 mit. Nicht unterstützte Anhänge und Funktionen entfallen. Der <a href="/de/blog/evernote-in-apple-notizen-importieren">deutsche Importleitfaden</a> erklärt weitere Checks anhand von <a href="https://support.apple.com/de-de/102223">Apples Anleitung</a>.</p>
    <h2 id="pinto">Pinto Notes mit Apple-Notizen-Gefühl und KI-Zugriff</h2>
    <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Die Notizen sind Markdown-Dateien, frühere Versionen bleiben im Verlauf. Sobald du <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT oder Claude verbindest</a>, können sie deine Notizen lesen und bearbeiten.</p>
    <p>Exportiere auf dem Mac jedes Evernote-Notizbuch als .enex und importiere die Dateien gemeinsam. Aus jedem Notizbuch wird ein Ordner, Tags kommen mit. Wähle im Ablage-Menü von Pinto Notes „Import from Evernote“, wie oben gezeigt. <a href="/blog/import-your-notes">Notizen importieren</a> beschreibt den Vorgang. Evernote bleibt unverändert.</p>
    <p>Pinto Notes läuft nur auf iPhone und Mac. Eine Windows-, Android- oder Web-App gibt es nicht.</p>
    <h2 id="obsidian">Obsidian für Markdown-Dateien und verknüpfte Recherche</h2>
    <p>Obsidian speichert Notizen lokal als Markdown-Dateien. Links, Graph und Community-Plugins eignen sich für eine selbst organisierte Recherche. Die App läuft auf Mac, iPhone, Windows, Linux und Android. Sie ist kostenlos; Obsidian Sync ist ein optionaler Bezahldienst. Kläre die Synchronisierung vor dem Wechsel.</p>
    <p>Installiere den offiziellen Importer über Settings und Community Plugins und aktiviere ihn. Wähle im Importer „Evernote (.enex)“, deine Datei und „Import“, erst für die Vorschau und dann zum Abschluss. Die <a href="https://obsidian.md/help/import/evernote">Obsidian-Anleitung</a> erklärt, wie sich Notizbuchstapel über Dateinamen und Tag-Hierarchien über umbenannte Tags bewahren lassen. Ein normaler Export erhält diese Strukturen nicht.</p>
    <h2 id="notion">Notion für gemeinsame Arbeit</h2>
    <p>Notion bringt Notizen in einen Team-Arbeitsbereich. Sein Evernote-Importer macht aus Notizbüchern Seiten und aus Notizen Datenbankeinträge. Das ändert die Organisation, erlaubt aber Arbeit mit dem Team. Notion läuft auf Mac, iPhone, Windows, Android und im Web.</p>
    <p>Gehe am Desktop oder im Web zu Settings, Import, Third party imports, Evernote. Melde dich bei Evernote an, erlaube die Verbindung und wähle Notizbücher. Notions <a href="https://www.notion.com/help/import-data-into-notion">Anleitung</a> beschreibt diese Account-Verbindung, keinen .enex-Upload. Evernote Teams ist ausgenommen; Bilder können Nacharbeit brauchen. Behalte Zugriff auf Evernote, bis du das Ergebnis geprüft hast.</p>
    <h2 id="bear">Bear für Markdown und Tags</h2>
    <p>Bear eignet sich für Texte, die du mit Tags ordnest. Der Markdown-Editor bietet Tabellen und Aufgabenlisten. Bear läuft auf Mac und iPhone. Laut <a href="https://bear.app/">Bear</a> erfordert iCloud-Synchronisierung Pro. Berücksichtige das, wenn du beide Geräte nutzt.</p>
    <p>Wähle auf dem Mac File, Import From, Evernote und dann deine .enex-Datei. Auf dem iPhone öffnest du das Drei-Punkte-Menü in der Seitenleiste und wählst Import. Laut <a href="https://bear.app/faq/migrate-from-evernote/">Bear-Anleitung</a> enthält ENEX keine Notizbuchinformationen. Tags vor dem Export können Notizbuchnamen als Hinweis bewahren.</p>
    <h2 id="joplin">Joplin für offene Notizbücher und Web Clipper</h2>
    <p>Joplin ist kostenlos und quelloffen, bietet Notizbücher, Tags und einen Web Clipper. Notizen sind offline verfügbar. Die App läuft auf Mac, iPhone, Windows, Linux und Android. Für die Synchronisierung kannst du etwa Dropbox oder OneDrive statt Joplin Cloud wählen. Richte das getrennt vom Import ein.</p>
    <p>Wähle in der Desktop-App File, Import, ENEX. Joplin nimmt eine Datei oder einen Ordner mit Dateien an und erstellt pro Datei ein Notizbuch. Tags und Anhänge kommen mit. Die <a href="https://joplinapp.org/help/apps/import_export/">Importanleitung</a> erklärt Markdown und HTML: Bei Markdown können Farben und Schriftformatierung verloren gehen; auch Notizlinks brauchen eventuell Nacharbeit.</p>
    <h2 id="pruefen">Ein kleines Notizbuch vor dem Wechsel prüfen</h2>
    <p>Wähle eines mit den Arten von Notizen, die du wirklich aufhebst. Bevor du Evernote nicht mehr nutzt:</p>
    <ul>
      <li>Vergleiche die Anzahl der Notizen und öffne Beispiele mit Anhängen oder Tabellen.</li>
      <li>Prüfe Tags, Notizbuchstruktur und Links zwischen Notizen.</li>
      <li>Suche eine bekannte Notiz und öffne sie nach der Synchronisierung auf dem iPhone.</li>
      <li>Behalte die ursprünglichen .enex-Dateien, bis du mit dem Import zufrieden bist.</li>
    </ul>
  </LocalPostPage>;
}
