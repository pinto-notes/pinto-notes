import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "joplin-alternative-mac");
// German version of /blog/joplin-alternative-for-mac, 21 Nov 2026. Google autocomplete
// hl=de, gl=de, read 21 Nov: "joplin alternative" yielded itself, "joplin alternative
// open source", "joplin alternative linux" and "joplin alternative free"; the Mac seed
// yielded none. No Apple menu steps. Apple's de-de/guide/notes/welcome/mac read 21 Nov
// for the editor comparison. Joplin and Pinto facts follow the English original. No pictures.
const ui = UI.de;
const CHECK = `Joplin nach Pinto Notes prüfen
- [ ] Notizanzahl im Probe-Notizbuch vergleichen
- [ ] Lange Notiz neben dem Joplin-Original lesen
- [ ] Bild und Dateianhang öffnen
- [ ] Link zwischen zwei importierten Notizen öffnen
- [ ] Tabelle und Checkliste prüfen
- [ ] Titel, Daten und Tag-Text prüfen
- [ ] JEX-Sicherung und Markdown-Export behalten`;
const FAQ = [
  { q: "Importiert Pinto eine JEX-Sicherung?", a: ["Dieser Weg nutzt einen Ordner oder eine ZIP-Datei mit Markdown oder Text, kein JEX. Behalte JEX als Sicherung für Joplin und exportiere Markdown gesondert."] },
  { q: "Welches Joplin-Format sollte ich wählen?", a: ["Teste Markdown + Front Matter. Es enthält laut Joplin Titel, Daten und Tags. Pinto liest diese Felder und ergänzt Tags als Text. Lass Anhänge bei den Dateien und prüfe erst ein kleines Notizbuch."] },
  { q: "Kann ich Joplin unter Linux weiter nutzen?", a: ["Ja, aber der Import synchronisiert die beiden Apps nicht. Pinto läuft nur auf Mac und iPhone. Für eine Bibliothek über Linux, Windows und Android bleibt Joplin passend."] },
  { q: "Muss ich Joplin für Claude verlassen?", a: ["Nein. Joplin dokumentiert einen lokalen MCP-Server über Web Clipper. Er kann Notizen suchen und lesen sowie mit aktivierten Werkzeugen anlegen und ändern."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="joplin-alternative-mac"
  intro={<>Pinto Notes ist eine Joplin-Alternative für Mac und iPhone, wenn du einen Editor wie Apple Notizen möchtest. Für Windows, Linux oder Android ist Joplin weiterhin nötig.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#vergleich", label: "Apps vergleichen" }, { href: "#joplin", label: "Joplin behalten" },
    { href: "#export", label: "Exportieren und importieren" }, { href: "#pruefen", label: "Notizen prüfen" },
    { href: "#pinto-notes", label: "KI nutzen" },
  ]}><p>Teste ein kleines Joplin-Notizbuch als Markdown in Pinto und behalte eine getrennte JEX-Sicherung. Beide Apps können KI Zugriff auf Notizen geben. Vergleiche deshalb Editor und Verbindung.</p>
    <PostCta slug="de/joplin-alternative-mac" path="/de/blog/joplin-alternative-mac" position="answer" ui={ui.cta} title="Ein Joplin-Notizbuch testen"><p>Lade Pinto Notes kostenlos auf den Mac und importiere einen Ordner mit Markdown-Notizen. Verbinde ChatGPT oder Claude, wenn sie darin lesen und bearbeiten sollen.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="vergleich">Geräte und Editor vergleichen</h2>
  <div className="tableWrap"><table><thead><tr><th scope="col">Du brauchst</th><th scope="col">Joplin</th><th scope="col">Pinto Notes</th></tr></thead><tbody>
    <tr><th scope="row">Mac und iPhone</th><td>Auf beiden verfügbar</td><td>Auf beiden verfügbar</td></tr>
    <tr><th scope="row">Windows, Linux oder Android</th><td>Auf allen verfügbar</td><td>Keine App dafür</td></tr>
    <tr><th scope="row">Editor</th><td>Markdown und Rich Text</td><td>Funktioniert wie Apple Notizen</td></tr>
    <tr><th scope="row">KI für Notizen</th><td>Lokales MCP über Web Clipper</td><td>Gehostete Verbindung für ChatGPT oder Claude</td></tr>
  </tbody></table></div>
  <p>Joplin nennt seine Geräte in der <a href="https://joplinapp.org/help/install/">Installationsanleitung</a>. Pinto hat keine Windows-, Linux-, Android- oder Web-App.</p>
  <h2 id="joplin">Gründe, bei Joplin zu bleiben</h2>
  <p>Joplin hat <a href="https://joplinapp.org/help/apps/rich_text_editor/">Markdown und Rich Text</a>. Wenn dich nur Markdown-Zeichen stören, probiere Rich Text. Für die Synchronisierung kannst du laut <a href="https://joplinapp.org/help/apps/sync/">Joplin</a> unter anderem Nextcloud, WebDAV oder Dropbox wählen. Der Import in Pinto übernimmt diese Einrichtung nicht.</p>
  <p>Prüfe auch, ob du <a href="https://joplinapp.org/help/apps/plugins/">Plugins</a> brauchst. Der Notizimport bringt sie nicht mit. Joplins <a href="https://joplinapp.org/help/apps/ai_mcp/">lokaler MCP-Server</a> über Web Clipper kann Notizen suchen und lesen sowie mit aktivierten Werkzeugen anlegen oder ändern. Wenn du Joplin magst und nur Claude Zugriff geben willst, teste das zuerst.</p>
  <h2 id="export">Markdown für Pinto, JEX für Joplin</h2>
  <p>JEX ist laut <a href="https://joplinapp.org/help/apps/import_export/">Joplin</a> eine Sicherung mit Notizen und Metadaten für den erneuten Import in Joplin. Behalte eine solche Datei. Für Pinto brauchst du einen getrennten Markdown-Export.</p>
  <Steps><li>Exportiere ein kleines Notizbuch als „Markdown + Front Matter“ in einen eigenen Ordner. Wähle Beispiele mit Anhängen und Formatierung.</li><li>Behalte Ressourcen und Markdown-Dateien zusammen. Öffne eine Datei im Texteditor und prüfe ihren Text.</li><li>Wähle in Pinto Notes auf dem Mac im Ablage-Menü „Import Markdown or Text“. Nimm den Ordner oder eine ZIP-Datei davon.</li></Steps>
  <p><a href="https://joplinapp.org/help/dev/spec/interop_with_frontmatter/">Joplins Front-Matter-Anleitung</a> beschreibt Titel, Daten und Tags. Pinto liest sie und schreibt Tags als Text in die Notiz. Der <a href="/blog/import-your-notes" hrefLang="en">Pinto-Import</a> macht aus Ordnern Ordner und übernimmt auffindbare verlinkte Bilder und Dateien. Quelldateien bleiben unverändert. JEX liest dieser Weg nicht.</p>
  <h2 id="pruefen">Wichtige Teile des Notizbuchs prüfen</h2>
  <p>Vergleiche Kopien und Originale. Öffne einen Notizlink und einen Anhang. Die Notizanzahl allein reicht nicht.</p>
  <Keep title="Joplin-Import prüfen" text={CHECK} copyLabel={ui.copy} note="Die Liste ist ein Prüfschema, kein bestandener Importbericht." />
  <p>Der Markdown-Weg überträgt weder Plugin-Verhalten noch Joplin-Aufgabenalarme oder frühere Versionen. Wenn ein Link oder Anhang fehlt, kläre das vor weiteren Notizbüchern.</p>
  <h2 id="pinto-notes">Importierte Notizen in Pinto nutzen</h2>
  <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac und bewahrt frühere Versionen ab der Bearbeitung dort. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> erlaubt ein „Allow“ Lesen und Bearbeiten. Pintos Verbindung ist gehostet, Joplins dokumentierte MCP-Verbindung lokal. Lass offene Arbeit aus einer Notiz mit Quellenzeilen nennen und prüfe die Antwort vor einer Änderung.</p>
  <p>Nutze die Probe einige Tage und öffne sie auf dem iPhone. Erst danach übernimmst du mehr. Behalte den Export als Sicherung. Die App ist auf Englisch.</p>
</LocalPostPage>; }
