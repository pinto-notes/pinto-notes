import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-ohne-formatierung-einfuegen");

// German version of /blog/apple-notes-paste-without-formatting, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "apple notizen ohne formatierung einfügen"
// returned none; "mac einfügen ohne formatierung" returned the head, "mac text einfügen ohne
// formatierung" and "mac tastenkombination einfügen ohne formatierung". Broad Mac demand only.
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/not9474646a9/26/mac/26
// (Bearbeiten > Einsetzen und Stil anpassen, Einsetzen und Stil beibehalten), /102553 (Option-Umschalt-
// Befehl-V), /guide/notes/apd46c25187e/mac (Umschalt-Command-B, Textformat),
// /guide/iphone/iph1a9cae52c/ios (text selection and paste), iph1ac0b3a2/ios (Format).
// iPhone guides do not name a matching-style paste command. Pinto behavior follows English source.
// No picture.
const ui = UI.de;

const FAQ = [
  { q: "Wie füge ich Text in Apple Notizen auf dem Mac mit passendem Stil ein?", a: ["Drücke Option-Umschalt-Befehl-V oder wähle „Bearbeiten“, „Einsetzen und Stil anpassen“. Der eingefügte Text übernimmt den Stil an der Einfügestelle. Prüfe bei abweichender Tastatur das Menü."] },
  { q: "Beschreibt Apple den gleichen Befehl für Notizen auf dem iPhone?", a: ["Die geprüften iPhone-Anleitungen nennen ihn nicht. Sie beschreiben gewöhnliches Einfügen und die Taste „Format“. Dort steht kein allgemeiner Befehl zum Einfügen als unformatierter Text."] },
  { q: "Warum bleibt der Text eine Überschrift?", a: ["„Einsetzen und Stil anpassen“ übernimmt den Stil an der Einfügestelle. Steht der Cursor in einer Überschrift, kann auch der neue Text eine Überschrift sein. Auf dem Mac wählst du vorher mit Umschalt-Command-B das Textformat."] },
  { q: "Wie korrigiere ich bereits eingefügten Text?", a: ["Kopiere nur den betroffenen Abschnitt, lass ihn ausgewählt, wähle bei Bedarf mit Umschalt-Command-B das Textformat und ersetze die Auswahl über „Bearbeiten“, „Einsetzen und Stil anpassen“."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="apple-notizen-ohne-formatierung-einfuegen"
    intro={<>Auf dem Mac fügst du Text in Apple Notizen ohne den Stil der Quelle über „Bearbeiten“, „Einsetzen und Stil anpassen“ ein. Der Kurzbefehl ist Option-Umschalt-Befehl-V. Apples iPhone-Anleitungen nennen keinen entsprechenden Befehl.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Mac-Kurzbefehl" }, { href: "#bereits-eingefuegt", label: "Text korrigieren" },
      { href: "#iphone", label: "Auf dem iPhone" }, { href: "#grenzen", label: "Grenzen" }, { href: "#pinto-notes", label: "Pinto Notes" },
    ]}><p>„Einsetzen und Stil anpassen“ übernimmt auf dem Mac den Stil um den Cursor. Nutze Option-Umschalt-Befehl-V statt Command-V. Auf dem iPhone beschreibt Apple gewöhnliches Einfügen und Formatieren, aber keinen gleichnamigen Befehl.</p>
      <PostCta slug="de/apple-notizen-ohne-formatierung-einfuegen" path="/de/blog/apple-notizen-ohne-formatierung-einfuegen" position="answer" ui={ui.cta} title="Notizen mit Markdown schreiben?">
        <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, mit Markdown als Textformat. Der Mac-Editor wandelt unterstützten formatierten Text in Markdown um und fällt sonst auf reinen Text zurück.</p>
      </PostCta></Answer>} hero={<></>} faq={FAQ}>
    <h2 id="mac">Auf dem Mac ohne Quellformatierung einfügen</h2>
    <Steps><li>Markiere den Text in der Quelle und drücke Command-C.</li><li>Öffne die Notiz und klicke an die gewünschte Stelle.</li><li>Wähle „Bearbeiten“, „Einsetzen und Stil anpassen“ oder drücke Option-Umschalt-Befehl-V.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Einsetzen und Stil anpassen"], keys: "⌥⇧⌘V" }]} />
    <p>Apples <a href="https://support.apple.com/de-de/guide/notes/not9474646a9/26/mac/26">Notizen-Anleitung für macOS 26</a> nennt den Menüpfad. Der <a href="https://support.apple.com/de-de/102553">aktuelle Artikel zum Kopieren und Einfügen</a> nennt den Kurzbefehl. Prüfe das Menü, wenn deine Tastatur anders belegt ist.</p>
    <p>Fügst du einen Absatz von einer Rezeptseite in deine Kochnotiz ein, kann er so wie der übrige Notiztext aussehen. Willst du stattdessen den Quellstil behalten, nennt Apple in der Notizen-Anleitung „Bearbeiten“, „Einsetzen und Stil beibehalten“.</p>
    <h2 id="bereits-eingefuegt">Bereits eingefügten Text korrigieren</h2>
    <p>Markiere nur den betroffenen Abschnitt, damit der übrige Text stehen bleibt.</p>
    <Steps><li>Kopiere den markierten Abschnitt mit Command-C.</li><li>Lass ihn markiert. Für gewöhnlichen Fließtext wähle mit Umschalt-Command-B das Textformat.</li><li>Wähle „Bearbeiten“, „Einsetzen und Stil anpassen“, um die Auswahl durch die Kopie zu ersetzen.</li></Steps>
    <p>Apple nennt Umschalt-Command-B in den <a href="https://support.apple.com/de-de/guide/notes/apd46c25187e/mac">Notizen-Kurzbefehlen</a>. Für Schriftart und Schriftgröße siehe <a href="/de/blog/schriftart-apple-notizen-aendern">Schriftart in Apple Notizen ändern</a>.</p>
    <h2 id="iphone">Was Apple für das iPhone beschreibt</h2>
    <p>Apples <a href="https://support.apple.com/de-de/guide/iphone/iph1a9cae52c/ios">Anleitung zur Textbearbeitung</a> erklärt Auswählen, Kopieren und Einfügen. „Einsetzen und Stil anpassen“ wird dort nicht beschrieben. Die <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">Anleitung für Notizen</a> zeigt, wie du Text nach dem Einfügen formatierst.</p>
    <Steps><li>Tippe in die Notiz, um die Einfügemarke zu setzen. Apple beschreibt auch das Aufziehen mit drei Fingern zum Einfügen.</li><li>Tippe zweimal auf ein Wort und ziehe die Auswahlgriffe über den eingefügten Abschnitt.</li><li>Tippe auf „Format“ und ändere unerwünschte Formatierungen wie fett oder kursiv.</li></Steps>
    <p>Damit änderst du den ausgewählten Text. Apple bezeichnet diese Schritte nicht als einen Befehl, der alle Quellstile entfernt. Wenn du Text mit passendem Zielstil einfügen willst, nutze den Mac-Befehl.</p>
    <h2 id="grenzen">Wo die Stilanpassung aufhört</h2>
    <p>Der Befehl übernimmt den Zielstil. Steht der Cursor in einer Überschrift, kann der eingefügte Absatz ebenfalls eine Überschrift werden. Für Fließtext wähle vorher mit Umschalt-Command-B das Textformat.</p>
    <p>Prüfe das Ergebnis, bevor du einen langen Abschnitt ersetzt. Entscheide, ob Links und Listenstruktur erhalten bleiben sollen. Für Text mit einem eigenen Stil erklärt <a href="/de/blog/codeblock-apple-notizen">Monospace in Apple Notizen</a> eine andere Formatierung.</p>
    <p>Ist ein Einfügebefehl ausgegraut, kann die App ihn laut Apple am aktuellen Ort oder mit dem aktuellen Inhalt nicht nutzen. Klicke in den Notiztext und kopiere eine Textauswahl, bevor du es erneut versuchst.</p>
    <h2 id="pinto-notes">Wie Pinto Notes eingefügten Text verarbeitet</h2>
    <p>Pinto Notes speichert Notiztext als Markdown und zeigt ihn formatiert an. Der Mac-Editor verarbeitet zuerst Dateien und Bilder. Danach versucht er, formatierten Text in Markdown umzuwandeln. Wenn daraus kein Markdown entsteht, fügt er reinen Text ein.</p>
    <p>Formatierte Inhalte können ihre Struktur als Markdown behalten. Prüfe daher, was in der Notiz ankommt. Das beschreibt den Mac-Editor. Wenn dich nur der Quellstil stört, probiere zuerst den Mac-Befehl in Apple Notizen.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI deine Notizen lesen und bearbeiten. Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
