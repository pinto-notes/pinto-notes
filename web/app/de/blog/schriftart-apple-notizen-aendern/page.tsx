import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "schriftart-apple-notizen-aendern");

// German version of /blog/apple-notes-font, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „schriftart in apple notizen ändern“,
// „apple notizen schriftgröße ändern“, „apple notizen schriftgröße ändern iphone“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/apd1955d3b21/mac
// („Schrift“ > „Schriften einblenden“), https://support.apple.com/de-de/guide/mac-help/mchlp2544/mac,
// https://support.apple.com/de-de/guide/notes/apd97da26aed/mac („Standardtextgröße“),
// https://support.apple.com/de-de/guide/notes/apd8b73d28be/mac („Darstellung“ > „Vergrößern“),
// https://support.apple.com/de-de/guide/iphone/iph3c076905a/ios („Anzeige & Textgröße“),
// https://support.apple.com/de-de/guide/iphone/iph1f48544ab/ios,
// https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios.

const ui = UI.de;
const faq = [
  { q: "Wie ändere ich die Schriftgröße auf dem iPhone?", a: ["Öffne „Einstellungen“ > „Bedienungshilfen“ > „Anzeige & Textgröße“ > „Größerer Text“ und verschiebe den Regler. Für Notizen allein nutze „App-spezifische Einstellungen“."] },
  { q: "Kann ich auf dem Mac eine andere Schriftart wählen?", a: ["Ja. Markiere Text, klicke mit gedrückter Control-Taste darauf und wähle „Schrift“ > „Schriften einblenden“. Das ändert die Auswahl. „Standardtextgröße“ ist eine getrennte Einstellung für alle Notizen."] },
  { q: "Wie ändere ich die Schriftfarbe?", a: ["Auf dem Mac öffnest du für markierten Text „Schrift“ > „Schriften einblenden“ und wählst dort die Textfarbe. Die iPhone-Anleitung beschreibt Hervorhebungen, aber keinen entsprechenden Weg zur Schriftfarbwahl."] },
  { q: "Warum beginnt eine neue Notiz mit großer Schrift?", a: ["Prüfe auf dem Mac unter „Notizen“ > „Einstellungen“ die Option „Neue Notizen beginnen mit“. Sie bestimmt den ersten Absatzstil. „Standardtextgröße“ regelt getrennt die allgemeine Anzeigegröße."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="schriftart-apple-notizen-aendern"
    intro={<>Auf dem Mac kannst du die Schriftart markierten Textes ändern. Auf dem iPhone wählst du Textstile in der Notiz und vergrößerst die Anzeige über die Bedienungshilfen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#schriftart", label: "Schriftart am Mac" }, { href: "#mac-groesse", label: "Größe am Mac" },
      { href: "#iphone", label: "Größe am iPhone" }, { href: "#farbe", label: "Farbe" },
    ]}>
      <p>Für markierten Text auf dem Mac: „Schrift“ &gt; „Schriften einblenden“. Für alle Notizen: „Notizen“ &gt; „Einstellungen“ &gt; „Standardtextgröße“. Auf dem iPhone findest du größere Schrift unter „Einstellungen“ &gt; „Bedienungshilfen“ &gt; „Anzeige &amp; Textgröße“.</p>
      <PostCta slug="de/schriftart-apple-notizen-aendern" path="/de/blog/schriftart-apple-notizen-aendern" position="answer" ui={ui.cta} title="Notizen mit KI bearbeiten">
        <p>Pinto Notes ist auf Englisch und läuft auf iPhone und Mac. Verbundenes ChatGPT oder Claude kann Notizen lesen und bearbeiten. Frühere Versionen bleiben erhalten.</p>
      </PostCta>
    </Answer>} faq={faq}>
    <h2 id="schriftart">Schriftart in Apple Notizen am Mac ändern</h2>
    <MenuPaths rows={[{ on: "Markierter Text", steps: ["Control-Klick", "Schrift", "Schriften einblenden"] }]} />
    <Steps><li>Öffne die Notiz und markiere den Text.</li><li>Klicke mit gedrückter Control-Taste darauf und wähle „Schrift“ &gt; „Schriften einblenden“.</li><li>Wähle im Fenster „Schriften“ Schriftart und Größe.</li></Steps>
    <p>Das ändert nur die Auswahl. Für Überschriften oder Fettdruck nutze die Formatierungstaste in der Notiz. Apple zeigt den Weg unter <a href="https://support.apple.com/de-de/guide/notes/apd1955d3b21/mac">Notizen formatieren</a>.</p>
    <h2 id="mac-groesse">Text in allen Mac-Notizen vergrößern</h2>
    <MenuPaths rows={[{ on: "Alle Notizen", steps: ["Notizen", "Einstellungen", "Standardtextgröße"] }, { on: "Eine Notiz", steps: ["Darstellung", "Vergrößern"] }]} />
    <p>Verschiebe unter „Notizen“ &gt; „Einstellungen“ den Regler „Standardtextgröße“. Für nur eine Notiz nutze „Darstellung“ &gt; „Vergrößern“ oder „Verkleinern“. Das steht in Apples <a href="https://support.apple.com/de-de/guide/notes/apd8b73d28be/mac">Anleitung zur Anzeige</a>.</p>
    <p>„Neue Notizen beginnen mit“ im selben Einstellungsfenster bestimmt den Stil der ersten Zeile einer neuen Notiz. Es ist nicht der Regler für die Anzeigegröße aller Notizen.</p>
    <h2 id="iphone">Schriftgröße auf dem iPhone ändern</h2>
    <MenuPaths rows={[{ on: "Größerer Text", steps: ["Einstellungen", "Bedienungshilfen", "Anzeige & Textgröße", "Größerer Text"] }, { on: "Nur Notizen", steps: ["Einstellungen", "Bedienungshilfen", "App-spezifische Einstellungen", "App hinzufügen", "Notizen"] }]} />
    <Steps><li>Öffne „Einstellungen“ &gt; „Bedienungshilfen“ &gt; „Anzeige &amp; Textgröße“.</li><li>Tippe auf „Größerer Text“ und verschiebe den Regler.</li><li>Für weitere Größen aktiviere „Größerer dynamischer Text“.</li></Steps>
    <p>Die Einstellung gilt für unterstützte Apps einschließlich Notizen. Dort findest du auch „Fetter Text“. Apple erklärt die Optionen unter <a href="https://support.apple.com/de-de/guide/iphone/iph3c076905a/ios">Text leichter lesbar machen</a>.</p>
    <p>Nur für Notizen: Öffne „App-spezifische Einstellungen“, tippe auf „App hinzufügen“, wähle „Notizen“ und öffne danach dessen Einstellungen. <a href="https://support.apple.com/de-de/guide/iphone/iph1f48544ab/ios">Apple beschreibt den Weg</a>.</p>
    <h2 id="stile">Überschriften und Textstile</h2>
    <p>In einer iPhone-Notiz öffnest du über die Formatierungstaste Stile wie Überschrift, Fett und Kursiv. Markiere für eine Abschnittsüberschrift den Text und wähle „Überschrift“ oder „Unterüberschrift“. Apples <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Anleitung</a> zeigt das. Für eine Rezeptnotiz könntest du etwa „Zutaten“ als Überschrift setzen. Weitere Beispiele findest du in der <a href="/blog/apple-notes-templates">Vorlagensammlung</a>.</p>
    <h2 id="farbe">Schriftfarbe und Hervorhebung</h2>
    <p>Auf dem Mac markierst du Text und öffnest „Schrift“ &gt; „Schriften einblenden“. Im Schriftfenster wählst du die Textfarbe. Apple erklärt die Farbauswahl unter <a href="https://support.apple.com/de-de/guide/mac-help/mchlp2544/mac">Schriftformatierung am Mac</a>.</p>
    <p>Für eine Hervorhebung markierst du Text und nutzt die Hervorheben-Taste bei der Formatierung. Über den farbigen Kreis daneben wählst du eine Farbe. Auf dem iPhone nennt Apple Hervorhebungen, aber keinen Schriftfarbenwähler wie auf dem Mac.</p>
    <h2 id="grenzen">Was auf dem iPhone anders ist</h2>
    <p>Apples iPhone-Anleitung beschreibt Stile und Anzeigegröße, aber keine freie Schriftartwahl wie im Mac-Schriftfenster. Einige Mac-Formatierungen hängen vom Account ab. Absatzstile benötigen iCloud-Notizen oder lokal auf dem Mac gespeicherte Notizen.</p>
    <h2 id="pinto">Wenn KI in deinen Notizen arbeiten soll</h2>
    <p>Pinto Notes speichert Markdown-Dateien und frühere Versionen. Verbundenes <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT oder Claude</a> kann die Notizen lesen und bearbeiten. Apple Notizen importierst du auf dem Mac, ohne dort etwas zu verändern.</p>
  </LocalPostPage>;
}
