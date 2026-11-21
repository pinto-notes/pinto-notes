import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "codeblock-apple-notizen");

// German version of /blog/apple-notes-code-block (21 Nov 2026). Google autocomplete hl=de, gl=de,
// read 21 Nov: "apple notizen codeblock" returned "apple notizen code block"; "codeblock apple notizen"
// and "code block notizen iphone" returned no suggestions. German Apple pages read 21 Nov 2026:
// de-de/guide/notes/apd1955d3b21/mac (Format controls, Zitatblock, manual highlighting),
// apd46c25187e/mac (Umschalt-Command-M: „Proportionales Textformat anwenden“;
// Umschalt-Command-B: Textformat; Command-': Zitatblock; keyboard layout caveat),
// de-de/guide/iphone/iph1ac0b3a2/ios (format controls). The German pages did not verify a
// German menu label for English „Monostyled“ on iPhone, so that step describes
// the style. The Mac shortcut list calls it „Proportionales Textformat“. Apple's English iOS 17 feature guide names the prior Monospaced style.
// No dedicated Code Block or syntax-highlighting command is documented in the checked pages.

const ui = UI.de;
const SNIPPET = `{
  "timeoutSeconds": 30,
  "retryCount": 2
}`;
const FAQ = [
  { q: "Was kommt einem Codeblock in Apple Notizen am nächsten?", a: ["Das Textformat, das Apple in der deutschen Mac-Kürzelliste „Proportionales Textformat“ nennt. Die englische Beschreibung von „Monostyled“ nennt Einzug, Hintergrund und eine Schrift mit fester Zeichenbreite. Apple dokumentiert außerdem Zitatblöcke, aber in den geprüften Formatierungsseiten keinen eigenen Codeblock-Befehl und keine Syntaxhervorhebung."] },
  { q: "Welche Mac-Tastenkombination formatiert ein Snippet?", a: ["Markiere den Code und drücke Umschalt-Command-M. Für einen Zitatblock nennt Apple Command-Apostroph, für normalen Text Umschalt-Command-B. Das sind Textformate, keine dokumentierte Syntaxhervorhebung."] },
  { q: "Warum steht in älteren Anleitungen „Monospaced“?", a: ["Laut Apples iOS-17-Übersicht wurde das frühere Format „Monospaced“ durch „Monostyled“ mit Einzug und eigenem Hintergrund ersetzt. Die deutsche Mac-Kürzelliste nennt ihn „Proportionales Textformat“; für das iPhone fehlt in der geprüften Anleitung ein Name."] },
  { q: "Hebt ein Zitatblock Programmiersprachen farblich hervor?", a: ["Apple beschreibt den Zitatblock als abgesetzten Text mit einem Balken. Syntaxhervorhebung ist dafür nicht dokumentiert. Für einen kurzen Codeschnipsel eignet sich das abgesetzte Textformat."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="codeblock-apple-notizen"
    intro={<>Für kurze Codeschnipsel bietet Apple Notizen ein abgesetztes Textformat. Apple dokumentiert außerdem Zitatblöcke, aber in den geprüften Anleitungen keinen eigenen Codeblock-Befehl und keine Syntaxhervorhebung.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Mac-Tastenkombination" }, { href: "#iphone", label: "Auf dem iPhone" },
      { href: "#zitatblock", label: "Zitatblock" }, { href: "#grenzen", label: "Grenzen" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Markiere auf dem Mac den Code und drücke Umschalt-Command-M. Auf dem iPhone öffnest du die Formatierungsoptionen und wählst das abgesetzte Textformat. Der Ausschnitt erhält eine eigene Darstellung. Apples Anleitungen beschreiben dabei keine Syntaxhervorhebung nach Programmiersprache.</p>
      <PostCta slug="de/codeblock-apple-notizen" path="/de/blog/codeblock-apple-notizen" position="answer" ui={ui.cta} title="Brauchst du einen Codeblock-Befehl?">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Sein /-Menü enthält Code Block und Callout.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="mac">Codeschnipsel auf dem Mac formatieren</h2>
    <p>Apple nennt den Stil in der deutschen Mac-Kürzelliste „Proportionales Textformat“. Die englische Beschreibung von „Monostyled“ nennt Einzug, einen eigenen Hintergrund und feste Zeichenbreite. So steht eine kurze Konfiguration oder ein Befehl getrennt von der Erklärung.</p>
    <Steps>
      <li><strong>Füge den Code in eine Notiz ein.</strong> Schreib die Erklärung darüber oder darunter, damit du nur den Code markieren kannst.</li>
      <li><strong>Markiere den Code und formatiere ihn.</strong> Öffne die Formatierung in der Symbolleiste und wähle das abgesetzte Format. Auf dem Mac geht es auch mit Umschalt-Command-M.</li>
      <li><strong>Formatiere die Erklärung als normalen Text.</strong> Markiere sie und drücke Umschalt-Command-B.</li>
    </Steps>
    <MenuPaths rows={[
      { on: "Mac, Code", steps: ["Text markieren", "Proportionales Textformat"], keys: "⇧⌘M" },
      { on: "Mac, Erklärung", steps: ["Text markieren", "Textformat"], keys: "⇧⌘B" },
    ]} />
    <p>Die Kürzel stehen in Apples <a href="https://support.apple.com/de-de/guide/notes/apd46c25187e/mac">Tastenkombinationen für Notizen</a>. Je nach Tastatursprache und Layout können sie abweichen. Absatzformate auf dem Mac setzen Notizen in iCloud oder unter „Auf meinem Mac“ voraus.</p>
    <Keep title="Ein kurzer Code zum Ausprobieren" text={SNIPPET} code note="Füge den Code in Notizen ein, markiere ihn und wende das Format an. Die Darstellung auf dieser Webseite zeigt nicht Apple Notizen." />
    <h2 id="iphone">Auf dem iPhone formatieren</h2>
    <p>Markiere den Codeschnipsel in der Notiz und öffne die Formatierungsoptionen. Wähle dort das abgesetzte Format. Apples <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Anleitung zur Formatierung</a> beschreibt die Formatierungsleiste. Du kannst über ihre Optionen streichen.</p>
    <p>Ältere Anleitungen nennen das Format „Monospaced“. Apple erklärt die Änderung zu „Monostyled“ in seiner <a href="https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf">englischen iOS-17-Übersicht</a>. Dort beschreibt Apple auch Einzug und Hintergrund. Die deutsche Mac-Kürzelliste nennt den Stil „Proportionales Textformat“. Ein iPhone-Menüname war in der geprüften Anleitung nicht angegeben.</p>
    <h2 id="zitatblock">Zitatblöcke sind für Zitate da</h2>
    <p>Ein Zitatblock setzt Text mit einem Balken ab. Nutze ihn für einen Auszug aus einer Dokumentation und schreibe deine Erklärung außerhalb des Zitats. Für Code ist das abgesetzte Format passender.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Text markieren", "Formatierung", "Zitatblock"], keys: "⌘'" }]} />
    <p>Apple führt Zitatblöcke in der <a href="https://support.apple.com/de-de/guide/notes/apd1955d3b21/mac">Mac-Formatierungsanleitung</a> auf. Die Tastenkombination steht im Kürzelverzeichnis. Weitere Möglichkeiten findest du in <a href="/de/blog/apple-notizen-tipps">Apple-Notizen-Tipps für iPhone und Mac</a>.</p>
    <h2 id="grenzen">Keine dokumentierte Syntaxhervorhebung</h2>
    <p>Apples Formatierungs- und Tastenkombinationsseiten beschreiben das Textformat und Zitatblöcke. Ein eigener Codeblock-Befehl oder eine Syntaxhervorhebung, die Programmiersprachen erkennt, ist dort nicht dokumentiert. Ein kurzes Snippet passt in eine Notiz, einen Codeeditor ersetzen diese Formate nicht.</p>
    <p>Notizen kann Text auch manuell farbig hervorheben. Das erkennt weder Schlüsselwörter noch Zeichenketten im Code. Bewahre lauffähigen Code im Projekt auf und nutze die Notiz für die Erklärung.</p>
    <h2 id="pinto">Code Block und Callout in Pinto Notes</h2>
    <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Tippe <code>/</code> am Zeilenanfang und wähle Code Block für den Ausschnitt oder Callout für einen Hinweis. Beide Befehle gibt es auf iPhone und Mac.</p>
    <p>Nach dem Verbinden können Claude Code und Codex deine Notizen lesen und bearbeiten. Der <a href="/blog/notes-in-claude-code-and-codex">englische Leitfaden</a> erklärt die Verbindung. Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> mit. Apple Notizen bleibt unverändert.</p>
  </LocalPostPage>;
}
