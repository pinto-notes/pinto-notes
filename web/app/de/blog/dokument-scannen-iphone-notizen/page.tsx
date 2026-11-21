import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "dokument-scannen-iphone-notizen");

// German version of /blog/apple-notes-scan-document, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „dokument scannen iphone notizen app“,
// „dokument scannen über notizen iphone“, „iphone notizen dokument scannen pdf“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/108963
// („Anhang-Taste“, „Dokumente scannen“, „Scan behalten“, „Fertig“),
// https://support.apple.com/de-de/guide/iphone/iph653f28965/ios („Text scannen“, „Einfügen“),
// https://support.apple.com/de-de/102332, https://support.apple.com/de-de/guide/iphone/iph8958dd125/ios,
// https://support.apple.com/de-de/guide/iphone/iphdf551cfa2/ios,
// https://support.apple.com/de-de/guide/preview/prvw1509/mac.

const ui = UI.de;
const faq = [
  { q: "Wie scanne ich mehrere Seiten in eine PDF?", a: ["Tippe in einer iPhone-Notiz auf die Anhang-Taste und „Dokumente scannen“. Erfasse alle Seiten, bevor du auf „Fertig“ tippst. Die Seiten landen zusammen als PDF in der Notiz."] },
  { q: "Macht „Text scannen“ eine bearbeitbare Notiz?", a: ["Es fügt die ausgewählten Wörter in die Notiz ein. Richte die Kamera auf den Text, wähle die Wörter aus und tippe auf „Einfügen“. „Dokumente scannen“ speichert stattdessen eine PDF."] },
  { q: "Wie verkleinere ich einen Scan?", a: ["Öffne die PDF auf dem Mac in Vorschau. Wähle „Ablage“ > „Exportieren“ und im Quartz-Filter „Dateigröße reduzieren“. Speichere eine Kopie und prüfe, ob kleine Schrift lesbar bleibt."] },
  { q: "Kann ich vom iPhone direkt in eine Mac-Notiz scannen?", a: ["Ja, mit der Integrationskamera. Öffne die Notiz am Mac, klicke mit gedrückter Control-Taste hinein und wähle die Scan-Funktion für dein iPhone. Beide Geräte brauchen WLAN, Bluetooth und denselben Apple Account mit Zwei-Faktor-Authentifizierung."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="dokument-scannen-iphone-notizen"
    intro={<>Öffne eine Notiz auf dem iPhone. Tippe auf die Anhang-Taste und „Dokumente scannen“. Erfasse die Seiten und tippe auf „Fertig“. Der Scan liegt als PDF in der Notiz.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#iphone", label: "Auf dem iPhone scannen" }, { href: "#pdf", label: "PDF teilen" },
      { href: "#text", label: "Text scannen" }, { href: "#mac", label: "In den Mac scannen" },
      { href: "#groesse", label: "Dateigröße" },
    ]}>
      <p>„Dokumente scannen“ speichert eine oder mehrere Seiten als PDF. „Text scannen“ übernimmt Wörter in die Notiz. Mit der Integrationskamera kannst du einen Scan vom iPhone direkt in eine Mac-Notiz einfügen.</p>
      <PostCta slug="de/dokument-scannen-iphone-notizen" path="/de/blog/dokument-scannen-iphone-notizen" position="answer" ui={ui.cta} title="PDFs und Notizen zusammenhalten">
        <p>Pinto Notes ist auf Englisch und läuft auf iPhone und Mac. PDFs und andere Dateien können bei deinen Notizen liegen. Verbundene KI kann den geschriebenen Notiztext lesen und bearbeiten.</p>
      </PostCta>
    </Answer>} faq={faq}>
    <h2 id="iphone">Ein Dokument auf dem iPhone scannen</h2>
    <MenuPaths rows={[{ on: "iPhone", steps: ["Anhang-Taste", "Dokumente scannen"] }]} />
    <Steps><li>Öffne Notizen und wähle eine Notiz aus oder erstelle eine neue.</li><li>Tippe auf die Anhang-Taste und „Dokumente scannen“.</li><li>Halte die Kamera über die Seite. Im Modus „Automatisch“ erfasst das iPhone sie selbst.</li><li>Für einen manuellen Scan tippe auf den Auslöser oder drücke eine Lautstärketaste. Ziehe die Ecken zurecht und tippe auf „Scan behalten“.</li><li>Scanne weitere Seiten und tippe zum Schluss auf „Fertig“.</li></Steps>
    <p>In einer geöffneten Notiz kannst du auch über die Mehr-Taste „Scannen“ wählen. Apple zeigt beide Wege in der <a href="https://support.apple.com/de-de/108963">Scan-Anleitung</a>, einschließlich Blitz und Bildfiltern unter iOS 26.</p>
    <h2 id="pdf">Der Scan ist bereits eine PDF</h2>
    <p>Wenn du mehrere Seiten vor „Fertig“ erfasst, liegen sie in einer PDF. Zum Versenden öffnest du das Menü der gescannten PDF in der Notiz und wählst die Teilen-Funktion. „Übersicht“ öffnet sie bildschirmfüllend. <a href="https://support.apple.com/de-de/guide/iphone/iph8958dd125/ios">Apple erklärt das PDF-Menü</a>.</p>
    <p>Teile die gescannte Datei selbst, wenn alle Seiten ankommen sollen. Ein PDF-Export der ganzen Notiz enthält laut Apple nur die erste Seite eines mehrseitigen Scans. <a href="/de/blog/apple-notizen-als-pdf-exportieren">Apple Notizen als PDF exportieren</a> erklärt den Unterschied.</p>
    <h2 id="text">Wörter statt einer PDF scannen</h2>
    <MenuPaths rows={[{ on: "iPhone", steps: ["Anhang-Taste", "Text scannen", "Einfügen"] }]} />
    <p>Für bearbeitbaren Text tippe in der Notiz auf die Anhang-Taste und „Text scannen“. Richte die Kamera auf die gedruckten Wörter, wähle sie aus und tippe auf „Einfügen“. Apple nennt dafür unterstützte Sprachen. Es ist kein Verfahren, um eine vorhandene Scan-PDF in bearbeitbaren Text umzuwandeln. Vergleiche die eingefügten Wörter mit der Vorlage.</p>
    <h2 id="mac">Mit der Integrationskamera in eine Mac-Notiz scannen</h2>
    <p>WLAN und Bluetooth müssen auf beiden Geräten eingeschaltet sein. Beide verwenden denselben Apple Account mit Zwei-Faktor-Authentifizierung.</p>
    <Steps><li>Öffne die Notiz am Mac und klicke mit gedrückter Control-Taste an die Einfügestelle.</li><li>Wähle die Funktion zum Scannen von Dokumenten. Falls ein Untermenü erscheint, wähle dort dein iPhone.</li><li>Erfasse die Seiten auf dem iPhone und passe bei Bedarf die Ecken an.</li><li>Tippe auf dem iPhone auf „Sichern“. Die PDF erscheint in der Mac-Notiz.</li></Steps>
    <p><a href="https://support.apple.com/de-de/102332">Apple nennt die Voraussetzungen</a>: ein unterstützter Mac ab macOS Mojave 10.14 und ein iPhone ab iOS 12. Falls die Funktion fehlt, prüfe dort Geräte und Account.</p>
    <h2 id="groesse">Die Scan-Datei verkleinern</h2>
    <p>Ist die PDF für einen Upload zu groß, öffne sie auf dem Mac in Vorschau. Wähle „Ablage“ &gt; „Exportieren“ und unter „Quartz-Filter“ die Option „Dateigröße reduzieren“. Speichere unter einem anderen Namen. Größe und Bildqualität können sich laut <a href="https://support.apple.com/de-de/guide/preview/prvw1509/mac">Apple</a> ändern. Prüfe kleine Schrift in der Kopie.</p>
    <h2 id="grenzen">Was die beiden Scanarten unterscheiden</h2>
    <p>„Dokumente scannen“ bewahrt die Seite als PDF. „Text scannen“ fügt ausgewählte Wörter ein. „Anzeigen als“ ändert nur die Vorschaugröße einer PDF in Notizen, nicht die Dateigröße.</p>
    <h2 id="pinto">Die PDF bei deinen Arbeitsnotizen behalten</h2>
    <p>Pinto Notes kann auf dem iPhone Fotos, PDFs und Dateien in Notizen und Ordnern halten, wie <a href="/blog/pinto-notes-for-iphone">Pinto Notes für iPhone</a> zeigt. Scanne das Dokument mit Apple Notizen und lege die Datei neben deine schriftlichen Anmerkungen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden</a> können ChatGPT oder Claude deine Notizen bearbeiten; frühere Versionen bleiben erhalten. Apple Notizen lassen sich auf dem Mac importieren, ohne die Originale zu verändern.</p>
  </LocalPostPage>;
}
