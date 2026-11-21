import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-als-pdf-exportieren");

// German version of /blog/apple-notes-export-pdf, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen als pdf exportieren“, „apple notizen pdf export“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/not201900c07/mac, https://support.apple.com/de-de/guide/mac-help/mchlp1531/mac, https://support.apple.com/de-de/guide/iphone/iphdf551cfa2/ios, https://support.apple.com/de-de/102208.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-als-pdf-exportieren"
      intro={<>Eine einzelne Apple Notiz kannst du auf Mac und iPhone als PDF sichern. Für ganze Ordner beschreibt Apple keinen PDF-Export. Auch angehängte Scans brauchen Aufmerksamkeit.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#mac", label: "Eine Notiz auf dem Mac als PDF sichern" },
        { href: "#iphone", label: "Eine Notiz auf dem iPhone als PDF sichern" },
        { href: "#anhang", label: "Warum ein Scan nur eine Seite zeigt" },
        { href: "#ordner", label: "Einen Ordner oder alle Notizen exportieren" },
        { href: "#dateien", label: "Notizen, die schon Dateien sind" },
      ]}>
        <p>Auf dem Mac wählst du die Notiz und dann „Ablage“ &gt; „Exportieren als“ &gt; „PDF“. Auf dem iPhone öffnest du die Notiz, nutzt die Teilen-Taste und erstellst daraus über die Markierung eine PDF-Datei.</p>
        <PostCta slug="de/apple-notizen-als-pdf-exportieren" path="/de/blog/apple-notizen-als-pdf-exportieren" position="answer" ui={ui.cta} title="Deine Notizen dauerhaft als Dateien?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="mac">Eine Notiz auf dem Mac als PDF sichern</h2>
      <p>Öffne Notizen und wähle die Notiz. Gehe zu „Ablage“ &gt; „Exportieren als“ &gt; „PDF“. Vergib bei Bedarf einen Namen und Finder-Tags, wähle den Speicherort und klicke „Sichern“. Unter macOS 26 nennt Apple den Weg „Exportieren als“; ältere Versionen haben teils einen einzelnen PDF-Menüpunkt.</p>
      <p>Auch Drucken geht: „Ablage“ &gt; „Drucken“, dann das PDF-Menü im Druckfenster und „Als PDF sichern“. Dort können Sicherheitsoptionen ein Passwort für das Öffnen, Kopieren oder Drucken setzen.</p>
      <h2 id="iphone">Eine Notiz auf dem iPhone als PDF sichern</h2>
      <p>Öffne die Notiz und tippe auf die Teilen-Taste. Wähle die Markierungsfunktion; falls sie nicht erscheint, öffne zuerst die weiteren Aktionen. Du kannst auf den Seiten zeichnen und die PDF anschließend sichern.</p>
      <p>Zum Ausdrucken nutzt du im Teilen-Menü „Drucken“. Für ein weiter bearbeitbares Dokument beschreibt Apple außerdem das Öffnen in Pages. Eine gesperrte Notiz musst du vorher mit Passwort, Face ID oder Touch ID öffnen.</p>
      <h2 id="anhang">Warum ein Scan nur eine Seite zeigt</h2>
      <p>Apples iPhone-Anleitung sagt, dass die PDF die aktuelle Anzeige der Anhänge übernimmt. Ein mehrseitiger PDF-Anhang oder Scan erscheint beim Export der Notiz nur mit seiner ersten Seite. Brauchst du alle Seiten, gib die ursprüngliche Datei zusätzlich weiter.</p>
      <h2 id="ordner">Einen Ordner oder alle Notizen exportieren</h2>
      <p>Apple dokumentiert für Mac und iPhone nur den Export der geöffneten Notiz. Für Ordner oder die ganze Sammlung nennt Apple keinen PDF-Export. Wenige Notizen kannst du einzeln sichern.</p>
      <p>Bei privacy.apple.com kannst du eine Kopie deiner iCloud-Daten anfordern, einschließlich Notizen. Sobald sie bereitsteht, bleiben laut Apple 14 Tage zum Download. Apple nennt für die Notizen dort kein festes Dateiformat.</p>
      <p>Das freie Mac-Tool notes-exporter aus der englischen Vorlage kann eine Sammlung als PDF, Markdown, HTML, Word oder EPUB sichern. Es läuft mit Python im Terminal, nutzt Chrome für PDFs und überspringt gesperrte Notizen. Für ein Backup sind Markdown-Dateien oft nützlicher, weil Notizen sie auf dem Mac über „Ablage“ &gt; „Markdown importieren“ wieder einlesen kann. <a href="/blog/export-apple-notes-to-markdown" hrefLang="en">Markdown-Export</a> und <a href="/blog/back-up-apple-notes" hrefLang="en">Backup von Apple Notizen</a> erklären die Wege.</p>
      <h2 id="dateien">Notizen, die schon Dateien sind</h2>
      <p>Pinto Notes exportiert eine Notiz auf dem Mac als PDF und kann sie drucken. Die Notizen selbst liegen als Markdown-Dateien in Ordnern. Über „Settings“ &gt; „Account“ &gt; „Export Your Notes“ erhältst du eine ZIP-Datei mit allen Notizen und Anhängen.</p>
      <p>ChatGPT oder Claude können nach dem Verbinden die Notizen direkt lesen und bearbeiten; frühere Versionen bleiben erhalten. Deine Apple Notizen kannst du auf dem Mac importieren, ohne den Originalbestand zu ändern.</p>
      <Figure shot={SHOTS.welcome} caption="Eine Notiz in Pinto Notes auf dem Mac. Sie liegt als Markdown-Datei vor." />
    </LocalPostPage>
  );
}
