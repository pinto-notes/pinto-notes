import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "pdf-in-apple-notizen-markieren");

// German version of /blog/apple-notes-annotate-pdf, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „pdf in notizen bearbeiten iphone“;
// „pdf markieren notizen iphone“ returned no completions.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/iphone/iph8958dd125/ios
// („Anzeigen als“, „Übersicht“, „Links drehen“, „Seite zuschneiden“),
// https://support.apple.com/de-de/guide/iphone/draw-and-handwrite-with-markup-iph893c6f8bf/ios,
// https://support.apple.com/de-de/guide/notes/mark-up-attachments-apdef7f74190/mac
// („Markierung“, „Fertig“), https://support.apple.com/de-de/guide/mac-help/mark-up-files-mchl1fd88863/mac,
// https://support.apple.com/de-de/guide/preview/annotate-a-pdf-prvw11580/mac,
// https://support.apple.com/de-de/guide/iphone/export-or-print-notes-iphdf551cfa2/ios.
// The iPhone annotation button has no text label in the guide; its action is described instead.

const ui = UI.de;
const REVIEW = `PDF prüfen\n\nDokument:\nSeite:\nAnmerkung:\nNächster Schritt:\n`;
const faq = [
  { q: "Kann ich eine PDF in Apple Notizen auf dem iPhone markieren?", a: ["Ja. Öffne eine kleine PDF-Vorschau und tippe dann auf die Taste für Zeichenwerkzeuge. Bei mittlerer oder großer Vorschau ist die Taste direkt erreichbar. Wähle Stift, Marker oder Bleistift und zeichne mit dem Finger."] },
  { q: "Kann ich den vorhandenen Text einer PDF ändern?", a: ["Apples Notizen-Anleitungen beschreiben Anmerkungen und Seitenaktionen, aber kein Umschreiben vorhandener PDF-Wörter. Ein Textfeld liegt über der Seite. Auch Vorschau kann laut Apple den bestehenden PDF-Text nicht bearbeiten."] },
  { q: "Wo finde ich die PDF-Markierung am Mac?", a: ["Öffne die Notiz, klicke auf den Pfeil neben dem PDF-Titel und wähle „Markierung“. Ergänze die Anmerkungen und klicke auf „Fertig“."] },
  { q: "Bearbeitet „Teilen“ und „Markierung“ die angehängte PDF?", a: ["Wenn du auf dem iPhone die ganze Notiz als PDF exportierst, entsteht eine neue Datei der Notiz. Für den PDF-Anhang verwendest du dessen Zeichenwerkzeuge. Beim Export der ganzen Notiz ist von mehrseitigen Anhängen nur die erste Seite enthalten."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="pdf-in-apple-notizen-markieren"
    intro={<>In Apple Notizen kannst du PDF-Anhänge auf iPhone und Mac mit Anmerkungen versehen. Auf dem iPhone öffnest du die Zeichenwerkzeuge am Anhang. Auf dem Mac wählst du am Pfeil neben dem PDF-Titel „Markierung“.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#iphone", label: "iPhone" }, { href: "#mac", label: "Mac" },
      { href: "#grenzen", label: "Grenzen" }, { href: "#export", label: "Export" },
      { href: "#pinto", label: "Prüfnotizen" },
    ]}>
      <p>Bei kleiner PDF-Vorschau öffnest du zuerst den Anhang und dann die Zeichenwerkzeuge. Bei mittlerer oder großer Vorschau sind sie direkt erreichbar. Am Mac wählst du am Titelpfeil der PDF „Markierung“ und beendest die Arbeit mit „Fertig“.</p>
      <PostCta slug="de/pdf-in-apple-notizen-markieren" path="/de/blog/pdf-in-apple-notizen-markieren" position="answer" ui={ui.cta} title="Anmerkungen als Notiz festhalten">
        <p>Pinto Notes ist auf Englisch. Verbundenes ChatGPT oder Claude kann deine geschriebenen Prüfnotizen lesen und bearbeiten. Frühere Versionen bleiben erhalten.</p>
      </PostCta>
    </Answer>} faq={faq}>
    <h2 id="iphone">PDF auf dem iPhone markieren</h2>
    <p>Liegt die PDF noch in „Dateien“ oder „Mail“, halte die Datei gedrückt, teile sie mit „Notizen“, wähle eine Notiz und tippe auf „Sichern“.</p>
    <Steps><li>Suche die PDF in der Notiz.</li><li>Bei kleiner Vorschau öffne die PDF und tippe auf die Taste für Zeichenwerkzeuge. Bei mittlerer oder großer Vorschau tippe direkt darauf.</li><li>Wähle Stift, Marker oder Bleistift und schreibe mit dem Finger.</li><li>Tippe erneut auf das gewählte Werkzeug, um Strichstärke oder Deckkraft zu ändern. Über die Farbauswahl änderst du die Farbe.</li></Steps>
    <p>Im Menü der PDF kannst du unter „Anzeigen als“ zwischen „Klein“, „Mittel“ und „Groß“ wählen. Ist die Werkzeugleiste eingeklappt, tippe darauf. Apple beschreibt das unter <a href="https://support.apple.com/de-de/guide/iphone/iph8958dd125/ios">Mit PDFs in Notizen arbeiten</a> und <a href="https://support.apple.com/de-de/guide/iphone/draw-and-handwrite-with-markup-iph893c6f8bf/ios">Zeichnen mit Markierungen</a>.</p>
    <h2 id="mac">PDF in Notizen auf dem Mac markieren</h2>
    <Steps><li>Öffne die Notiz mit der PDF.</li><li>Klicke auf den Pfeil neben dem PDF-Titel und wähle „Markierung“.</li><li>Füge Anmerkungen mit den angebotenen Werkzeugen hinzu.</li><li>Klicke am Ende auf „Fertig“.</li></Steps>
    <p>Mit dem Textwerkzeug setzt du ein Textfeld auf die Seite. Weitere Werkzeuge markieren Text, zeichnen oder fügen eine Unterschrift hinzu. Welche verfügbar sind, hängt von der Datei ab. Apple erklärt das <a href="https://support.apple.com/de-de/guide/notes/mark-up-attachments-apdef7f74190/mac">Markieren von Anhängen</a> und die <a href="https://support.apple.com/de-de/guide/mac-help/mark-up-files-mchl1fd88863/mac">Werkzeuge</a>.</p>
    <h2 id="grenzen">Was „PDF bearbeiten“ hier bedeutet</h2>
    <p>Du kannst Feedback auf der Seite ergänzen. Ein Textfeld ersetzt aber nicht die ursprünglichen Wörter der PDF. Apples Notizen-Anleitung nennt keine Bearbeitung des bestehenden Textes. Auch <a href="https://support.apple.com/de-de/guide/preview/annotate-a-pdf-prvw11580/mac">Vorschau kann diesen Text nicht ändern</a>.</p>
    <p>Auf dem iPhone kannst du bei mittlerer oder großer Vorschau Seitenminiaturen öffnen. Im Menü einer Seite gibt es etwa „Links drehen“ und „Rechts drehen“. „Seite zuschneiden“ und „Filter“ gelten nur für gescannte Dokumente.</p>
    <h2 id="export">Den Anhang markieren oder die ganze Notiz exportieren?</h2>
    <p>Wenn du die ganze Notiz über „Teilen“ als PDF ausgibst, entsteht eine neue PDF der Notiz. Um den angehängten PDF-Inhalt zu markieren, nutze dessen eigene Zeichenwerkzeuge.</p>
    <p>Der Export der ganzen Notiz enthält laut Apple von einer mehrseitigen PDF oder einem Scan nur die erste Seite. Prüfe die versendete Datei. Die <a href="https://support.apple.com/de-de/guide/iphone/export-or-print-notes-iphdf551cfa2/ios">Exportanleitung</a> nennt diese Grenze; <a href="/de/blog/apple-notizen-als-pdf-exportieren">Apple Notizen als PDF exportieren</a> zeigt die Schritte.</p>
    <h2 id="pinto">Schriftliche Prüfnotizen behalten</h2>
    <p>Eine Markierung auf Seite 4 zeigt die Stelle. Eine Notiz daneben erklärt, was geändert werden soll und wer zuständig ist. Kopiere die Vorlage und wiederhole Seitenzahl und Anmerkung für jeden Punkt.</p>
    <Keep title="PDF-Prüfnotiz" text={REVIEW} />
    <p>Pinto Notes sieht auf iPhone und Mac ähnlich aus wie Apple Notizen. Verbundenes <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT oder Claude</a> kann den geschriebenen Notiztext lesen und bearbeiten. Du kannst etwa darum bitten, aus den Prüfnotizen eine Checkliste mit Seitenzahlen zu machen. Frühere Versionen bleiben erhalten.</p>
    <p>Apple Notizen kannst du auf dem Mac importieren. Die ursprünglichen Notizen bleiben bestehen.</p>
  </LocalPostPage>;
}
