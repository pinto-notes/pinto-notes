import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "onenote-alternative-mac");

// German version of /blog/onenote-alternative-for-mac, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "onenote alternative mac" returned itself, "onenote alternative mac kostenlos"
// and "onenote alternative für mac". No Apple menu steps occur in this post.
// Microsoft menu names follow its English source; Pinto is an English-language app.

const ui = UI.de;
const CHECK = `Wechsel von OneNote prüfen
Behalte Zugriff auf das ursprüngliche Notizbuch.
Wähle fünf Textseiten, die du diese Woche gebraucht hast.
Kopiere jede in eine eigene Notiz oder Textdatei.
Prüfe Lesereihenfolge und Tabellen.
Vergleiche Links, Bilder und Anhänge mit den Originalen.
Behalte Zeichnungen und Seitenlayout im Original oder in einem PDF.
Probiere die neuen Notizen auf Mac und iPhone, bevor du mehr verschiebst.`;

const faq = [
  { q: "Kann Pinto Notes .one- oder .onepkg-Dateien öffnen?", a: ["Nein. Es gibt keinen direkten OneNote-Import. Pinto kann Ordner oder ZIP-Dateien mit Markdown- oder Textdateien importieren. Eine heruntergeladene OneNote-Sammlung hat nicht dieses Format. Kopiere benötigte Textseiten oder erstelle selbst passende Dateien."] },
  { q: "Was kann ich vor dem Wechsel auf dem Mac aus OneNote sichern?", a: ["Microsoft beschreibt File, Save as PDF für die gerade geöffnete Seite. Der Export eines ganzen Notizbuchs im Web funktioniert nur mit privaten OneDrive-Konten, nicht mit Geschäfts- oder Schulkonten und nicht mit SharePoint. Keiner der beiden Wege erzeugt bearbeitbare Pinto-Notizen."] },
  { q: "Wird ein OneNote-PDF in Pinto zur bearbeitbaren Notiz?", a: ["Nein. Pintos Markdown- und Textimport wandelt PDF-Seiten nicht in bearbeitbare Notizen um. Behalte das PDF als Nachschlagekopie. Zum Bearbeiten kopierst du den Text in eine Notiz oder eine Markdown- beziehungsweise Textdatei."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="onenote-alternative-mac"
    intro={<>Pinto Notes ist eine OneNote-Alternative für Mac, wenn du persönliche Textnotizen mit der Bedienung von Apple Notizen und KI-Zugriff suchst. Einen direkten OneNote-Import gibt es nicht. Beginne mit neuen Notizen oder wenigen Seiten, die du noch brauchst.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#wahl", label: "Was umziehen soll" },
      { href: "#sichern", label: "Originale sichern" },
      { href: "#import", label: "Text übernehmen" },
      { href: "#ki", label: "Mit KI nutzen" },
    ]}>
      <p>Pinto Notes passt für persönliche Textnotizen auf Mac und iPhone. Verbundenes ChatGPT oder Claude kann sie lesen und bearbeiten. Behalte OneNote für freie Seitenlayouts, Zeichnungen oder geteilte Notizbücher, die du weiter brauchst. Pinto kann kein vollständiges OneNote-Notizbuch importieren.</p>
      <PostCta slug="de/onenote-alternative-mac" path="/de/blog/onenote-alternative-mac" position="answer" ui={ui.cta} title="Schreibe die nächste Textnotiz in Pinto Notes">
        <p>Pinto Notes funktioniert ähnlich wie Apple Notizen auf iPhone und Mac. Der Mac-Download ist kostenlos; die App ist auf Englisch. Du kannst ChatGPT oder Claude mit deinen Notizen verbinden.</p>
      </PostCta>
    </Answer>}
    faq={faq}>
    <h2 id="wahl">Wähle die Notizen aus, die du weiter nutzt</h2>
    <p>Beginne mit einem aktuellen Projekt oder einigen Nachschlageseiten. Lass das Archiv zunächst in OneNote. Eine getippte Besprechungsnotiz ist etwas anderes als Zeichnungen rund um ein Diagramm. Beim Kopieren des Textes geht das Seitenlayout verloren.</p>
    <p>OneNote ordnet Inhalte in Notizbücher, Abschnitte und Seiten. Auf dem Mac kannst du mit Maus oder Trackpad frei zeichnen; andere können in geteilten Notizbüchern mitarbeiten. Microsoft beschreibt <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac">die Struktur</a>, <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">das Zeichnen</a> und <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">das Teilen</a>.</p>
    <p>OneNote gibt es auch für Windows und Android sowie im Browser, wie <a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions">Microsofts Übersicht</a> zeigt. Pinto läuft nur auf iPhone und Mac. Falls du Apples eigene App erwägst, lies <a href="/de/blog/apple-notizen-vs-onenote">Apple Notizen oder OneNote</a>.</p>

    <h2 id="sichern">Originale sichern, bevor du Text übernimmst</h2>
    <p>Öffne auf dem Mac eine OneNote-Seite und wähle File, Save as PDF. Speichere die Datei und öffne sie zur Kontrolle. Laut <a href="https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">Microsofts Mac-Anleitung</a> ist das eine Momentaufnahme der aktuellen Seite. Spätere Änderungen in OneNote aktualisieren das PDF nicht.</p>
    <p>Für ein ganzes Notizbuch beschreibt Microsoft einen Export über OneNote im Web: Rechtsklick auf das Notizbuch, Export notebook wählen und Export bestätigen. Laut <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks">Exportanleitung</a> funktioniert das nur bei privaten OneDrive-Konten. Behalte den Download als Sicherung, nicht als Datei für Pinto.</p>

    <h2 id="import">Was Pinto von OneNote übernehmen kann</h2>
    <p>Pinto hat keinen direkten OneNote-Import. <code>.one</code> und <code>.onepkg</code> werden nicht zu Notizen. Auch OneNote-PDFs macht der Markdown- und Textimport nicht bearbeitbar. Ein ZIP ändert das Dateiformat nicht.</p>
    <p>Für wenige Seiten kopierst du den getippten Text jeweils in eine neue Notiz. Beginne mit einer kurzen Seite und vergleiche sie mit dem Original. Prüfe die Reihenfolge der Textblöcke, Tabellen und Links. Bilder und Anhänge musst du bei Bedarf getrennt übernehmen.</p>
    <p>Für mehr Seiten kannst du selbst einen Ordner mit einer Markdown- oder Textdatei pro Notiz vorbereiten. Das ist Handarbeit, keine hier beschriebene OneNote-Exportfunktion. Wähle in Pinto auf dem Mac File, Import Markdown or Text und dann den Ordner. Laut <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> geht auch ein ZIP; jeder Ordner wird wieder zu einem Ordner.</p>
    <Keep title="Prüfe zuerst wenige Seiten" text={CHECK} note="Diese Liste gilt für einen manuellen Wechsel, nicht für eine automatische Umwandlung." />
    <p>Seiten mit Handschrift, Scans oder freier Anordnung bleiben besser im Original oder in einer geprüften PDF-Kopie. Dieser Weg übernimmt getippten Text, nicht diese Inhalte als bearbeitbare Pinto-Notiz.</p>

    <h2 id="ki">Textnotizen mit ChatGPT oder Claude nutzen</h2>
    <p>Pinto Notes sieht auf iPhone und Mac aus wie Apple Notizen und funktioniert ähnlich. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> können sie Notizen lesen und bearbeiten. Eine Zustimmung gibt beide Möglichkeiten frei. Jede frühere Version bleibt erhalten.</p>
    <p>Probiere eine konkrete Bitte: „Lies meine Notizen zum Küchenprojekt und ergänze eine Checkliste der noch offenen Entscheidungen.“ Vergleiche das Ergebnis mit deinen Originalen. Die Verbindung importiert nicht den Rest deiner OneNote-Sammlung.</p>
    <p>Schreibe die nächsten persönlichen Notizen in Pinto. Geteilte Notizbücher können in OneNote bleiben. Weitere Textseiten übernimmst du, nachdem du die ersten geprüft hast.</p>
  </LocalPostPage>;
}
