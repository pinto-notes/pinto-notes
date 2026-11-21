import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "upnote-alternative-iphone-mac");
// German version of /blog/upnote-alternative-for-iphone-and-mac, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "upnote alternative" yielded itself,
// "upnote alternative open source", "upnote alternative reddit" and "upnote alternative free".
// No Apple menu steps. German Apple Notes overview de-de/guide/notes/welcome/mac read 21 Nov
// for the comparison. UpNote and Pinto facts follow English original. No pictures.
const ui = UI.de;
const CHECK = `UpNote-Probeimport
- [ ] Zahl exportierter Dateien mit importierten Notizen vergleichen
- [ ] Eine lange Notiz ganz lesen
- [ ] Tabelle und Checkliste prüfen
- [ ] Bilder und Anhänge der Probe öffnen
- [ ] Link zu einer anderen Notiz öffnen
- [ ] Speicherort der Notizen aus jedem Notizbuch prüfen
- [ ] Eine Notiz mit einklappbarem Abschnitt vergleichen
- [ ] Importierte Notizen auf dem iPhone öffnen
- [ ] Originalexport und UpNote-Bibliothek behalten`;
const FAQ = [
  { q: "Kann Pinto Notes einen UpNote-Export importieren?", a: ["Auf dem Mac nimmt Pinto einen Ordner oder eine ZIP-Datei mit Markdown- oder Textdateien an. Es gibt keinen eigenen UpNote-Importer. Prüfe zuerst eine kleine Probe."] },
  { q: "Ist der Markdown-Export in UpNote Free enthalten?", a: ["UpNote führt den Export als Premium-Funktion. Prüfe deinen Tarif, bevor du den Wechsel planst."] },
  { q: "Bleiben einklappbare Abschnitte erhalten?", a: ["Für diesen Weg ist das nicht bestätigt. Vergleiche eine solche Notiz einschließlich ihres ganzen Textes und behalte das Original."] },
  { q: "Ersetzt Pinto UpNote unter Windows?", a: ["Nein. Pinto läuft nur auf Mac und iPhone. Es hat keine App für Windows, Linux, Android oder den Browser."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="upnote-alternative-iphone-mac"
  intro={<>Pinto Notes ist eine kostenlose UpNote-Alternative für iPhone und Mac, wenn du den Editor von Apple Notizen und Zugriff für ChatGPT oder Claude möchtest. Teste zuerst einen kleinen Markdown-Export.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#upnote", label: "Bei UpNote bleiben" }, { href: "#export", label: "Probe exportieren" },
    { href: "#import", label: "Auf dem Mac importieren" }, { href: "#pruefen", label: "Prüfen" },
    { href: "#pinto-notes", label: "KI nutzen" },
  ]}><p>Wenn du iPhone und Mac nutzt, kannst du Markdown- oder Textdateien auf dem Mac in Pinto übernehmen. Vergleiche die Kopien. Für Windows, Linux oder Android bleibt UpNote die passende App.</p>
    <PostCta slug="de/upnote-alternative-iphone-mac" path="/de/blog/upnote-alternative-iphone-mac" position="answer" ui={ui.cta} title="Ein paar UpNote-Notizen testen"><p>Lade Pinto Notes kostenlos auf den Mac, importiere eine kleine Markdown-Probe und prüfe sie, bevor du den Rest übernimmst.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="upnote">Wann UpNote bleiben sollte</h2>
  <p>UpNote läuft auf Mac, iPhone, Windows, Linux und Android. Pinto Notes hat keine App für Windows, Linux, Android oder den Browser. UpNote bietet außerdem verschachtelte Notizbücher, einklappbare Abschnitte und einen Web Clipper für Chrome, Safari und Firefox, wie <a href="https://getupnote.com/">UpNote selbst beschreibt</a>. Ein Markdown-Import verspricht nicht, diese Arbeitsweise nachzubilden.</p>
  <h2 id="export">Eine kleine Probe aus UpNote exportieren</h2>
  <p>Wähle eine lange Notiz, eine Checkliste, einen Anhang oder Notizlink und bei Bedarf einen einklappbaren Abschnitt.</p>
  <Steps><li>Markiere auf dem Mac die Probe in UpNotes Notizliste.</li><li>Klicke rechts auf „Export“ und wähle Markdown und getrennte Dateien.</li><li>Lass den gesamten Exportordner zusammen, einschließlich des Ordners „Files“ für Anhänge.</li></Steps>
  <p>Diese Schritte kommen aus <a href="https://help.getupnote.com/import-and-export/export-notes">UpNotes Exportanleitung</a>. Textdateien sind ebenfalls möglich. UpNote führt Export unter Premium. Nach bestandener Probe ist „File, Export all notes“ auf dem Mac der Weg für alle Notizen.</p>
  <h2 id="import">Markdown und Text in Pinto importieren</h2>
  <p>Öffne in Pinto Notes auf dem Mac das Ablage-Menü und wähle „Import Markdown or Text“. Wähle den Exportordner. Laut <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> sind Ordner oder ZIP-Dateien möglich. Jeder Ordner wird zum Ordner. Das verspricht nicht, jede UpNote-Notizbuchzuordnung zu erhalten. Prüfe die Orte und bewahre Original und Export auf.</p>
  <h2 id="pruefen">Importierte Kopien vergleichen</h2>
  <p>Lies eine lange Notiz bis zum Ende, folge Links und öffne Anhänge und eingeklappte Inhalte. Für diesen Beitrag wurde kein frischer UpNote-Export durchgespielt. Ein richtiger Titel in der Liste sagt noch wenig über den Rest.</p>
  <Keep title="UpNote-Probe prüfen" text={CHECK} copyLabel={ui.copy} note="Erst mit der Probe arbeiten, dann die wichtigen Teile der Bibliothek prüfen." />
  <p>Notiere, was du reparieren musst. Falls ein Link oder Anhang fehlt, behalte das Original. Wenn du auf verlorene Funktionen täglich angewiesen bist, nutze UpNote weiter.</p>
  <h2 id="pinto-notes">Mit KI in importierten Notizen arbeiten</h2>
  <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> können sie Notizen lesen und bearbeiten. Lass zuerst offene Aufgaben aus einer importierten Notiz im Chat zusammenfassen. Prüfe die Antwort, bevor die KI etwas ergänzt. Pinto bewahrt frühere Versionen ab dem Import, nicht UpNotes ältere Versionen.</p>
  <h2 id="erneut-exportieren">Auch aus Pinto wieder exportieren</h2>
  <p>Pinto exportiert die Bibliothek als Markdown-Dateien in Ordnern innerhalb einer ZIP-Datei. Derzeit mit Passwort, Face ID oder Touch ID gesperrte Notizen bleiben draußen; nicht ladbare Dateien werden gemeldet. Prüfe die Zusammenfassung und öffne einige Dateien. Behalte den UpNote-Export gesondert. Die App ist auf Englisch.</p>
</LocalPostPage>; }
