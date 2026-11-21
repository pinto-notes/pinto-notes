import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "karteikarten-apple-notizen");

// German version of /blog/apple-notes-flashcards (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "apple notizen karteikarten", "karteikarten aus notizen erstellen", "karteikarten notizen app", "karteikarten
// iphone" (app, anki, erstellen), "karteikarten vorlage" (word, pdf, goodnotes), "lernkarten iphone"; German searchers
// say Karteikarten far more than Lernkarten or flashcards. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, two rows and two
// columns, the Tabulatortaste in the last cell adds a row, selected paragraphs become a table) and apd93c815aa0 (Format,
// Mehr, Alles deaktivieren). Ablage, Notiz duplizieren is in Notes' de strings (MainMenu.loctable) on macOS 27.2.
// Paste as Markdown is not used for the table, as in the English post. The Pinto study app's buttons (Study now, Show
// answer, Again, Hard, Good, Easy) stay in English, since the app is in English. Facts are the English post's; the
// picture is its English one, described in German. Links go to the German Cornell post and to English posts where no
// German one exists.

const ui = UI.de;

// Tabs between the question and the answer: select those lines in Notes and turn them into a table.
const TEMPLATE = `Karteikarten Zellatmung

Frage\tAntwort
Was gewinnt die Zelle beim Abbau von Glukose?\tATP, die Energie der Zelle
Welche drei Stufen gibt es?\tGlykolyse, Citratzyklus, Atmungskette
Welche Stufe bildet das meiste ATP?\tDie Atmungskette
Wo läuft die Atmungskette ab?\tIn den Mitochondrien

Diesmal nicht gewusst
`;

const FAQ = [
  { q: "Kann man in Apple Notizen Karteikarten erstellen?", a: [
    "Ja, mit einer Tabelle mit zwei Spalten: links die Frage, rechts die Antwort, eine Zeile pro Karte. Notizen kann keine Antwort verbergen und keine Karte umdrehen, also deckst du die rechte Spalte ab, um dich abzufragen.",
  ] },
  { q: "Hat Apple Notizen eine Lernkartei mit Wiederholungen?", a: [
    "Nein. Notizen weiß nicht, welche Karten fällig sind oder welche du nicht wusstest. Eine Checkliste der verpassten Karten unter der Tabelle, die du beim nächsten Mal zuerst lernst, kommt dem von Hand am nächsten.",
  ] },
  { q: "Kann ich Karteikarten in Apple Notizen mischen?", a: [
    "Nein. Tabellen in Notizen lassen sich nicht sortieren oder mischen, also kommen die Karten in der Reihenfolge, in der du sie getippt hast. Ab und zu von der untersten Zeile aus anzufangen, ist der einfache Ausweg.",
  ] },
  { q: "Gibt es eine Karteikarten-App, die wie Apple Notizen funktioniert?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Lernnotizen und Karteikarten mit eigener Lern-App. Füg deine Notizen in ChatGPT oder Claude ein, und es macht die Karten; die App zeigt dir die fälligen, eine nach der anderen.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="karteikarten-apple-notizen"
      intro={<>
        Karteikarten funktionieren, weil du antworten musst, bevor du die Antwort siehst. Apple Notizen hat keinen Karteikarten-Modus, aber
        eine Tabelle mit zwei Spalten kommt nah heran. Hier ist eine Karteikarten-Vorlage für Apple Notizen zum Einfügen, wie du damit lernst
        und wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#lernen", label: "Damit lernen" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Karten, die wiederkommen" },
        ]}>
          <p>
            Apple Notizen hat keine Karteikarten, aber eine Tabelle mit zwei Spalten funktioniert: links die Frage, rechts die Antwort, eine
            Zeile pro Karte. Deck die rechte Spalte ab, um dich abzufragen, und führ unter der Tabelle eine kurze Checkliste mit den Karten,
            die du nicht wusstest.
          </p>
          <PostCta template="study-flashcards" slug="de/karteikarten-apple-notizen" path="/de/blog/karteikarten-apple-notizen" position="answer" ui={ui.cta}
            title="Sollen die Karten für dich entstehen und wiederkommen, wenn sie fällig sind?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Karteikarten-Vorlage mit einer Lern-App. Füg deine Notizen in ChatGPT oder Claude ein, und es macht die Karten; die, die du nicht weißt, kommen früher wieder.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/study-flashcards-note" width={1520} height={571} maxWidth={600}
        alt="Eine Notiz Study notes and flashcards in Pinto Notes auf dem Mac: eine Zeile dazu, wie die Karten funktionieren, dann eine Überschrift Notes mit einem Abschnitt Cell respiration aus drei Aufzählungspunkten."
        caption="Lernnotizen in Pinto Notes, die Notiz, aus der die Karteikarten entstehen. Beispieldaten. Überschriften und Aufzählungen funktionieren in Apple Notizen genauso; die Lern-App kommt nicht mit." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Tabelle pro Thema</h2>
      <p>
        Jede Zeile ist eine Karte. Halte die Frage kurz und die Antwort noch kürzer: Eine Karte, die einen ganzen Absatz als Antwort braucht,
        sind zwei Karten. Unter die Zeile Diesmal nicht gewusst, unter der Tabelle, kommen die Karten, die du nicht wusstest, damit die
        nächste Runde mit ihnen anfängt.
      </p>
      <Keep title="Karteikarten für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Jede Tabellenzeile hat einen Tab zwischen Frage und Antwort. Füg sie ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füg die Vorlage in eine neue Notiz ein, markiere die fünf Zeilen von Frage bis
          zur letzten Antwort und klicke in der Symbolleiste auf die Taste für Tabellen. Jeder Tab wird zu einer Spalte, so stehen Frage und
          Antwort nebeneinander.
        </li>
        <li>
          <strong>Oder leer anfangen.</strong> Wähle Format, Tabelle für zwei Zeilen und zwei Spalten. Tipp Frage und Antwort in die erste
          Zeile, und die Tabulatortaste in der letzten Zelle fügt die nächste Karte hinzu.
        </li>
        <li>
          <strong>Halte die Fragen kurz.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also quetscht
          eine lange Frage die Antwort zusammen.
        </li>
        <li>
          <strong>Eine Notiz pro Thema.</strong> Bewahre sie in einem Ordner Lernen auf, gib jeder einen Tag wie #biologie und wähle Ablage,
          Notiz duplizieren, um das nächste Thema mit demselben Aufbau zu beginnen.
        </li>
      </ul>
      <p>
        Eine Liste mit Zeilen wie „Frage: Antwort“ geht auch, aber dann steht die Antwort gut sichtbar neben der Frage. Mit der Tabelle
        verdeckst du eine ganze Spalte auf einmal. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch)
        zeigt alles, was eine Tabelle in Notizen kann und was nicht.
      </p>

      <h2 id="lernen">Damit lernen</h2>
      <ul>
        <li><strong>Deck die rechte Spalte ab.</strong> Halte eine Karte oder deine Hand über die Antworten und sag jede laut, bevor du hinschaust.</li>
        <li><strong>Schreib auf, was du nicht wusstest.</strong> Tipp die Frage unter Diesmal nicht gewusst und tipp auf die Checklisten-Taste. Hake sie ab, sobald du sie in einer späteren Runde richtig hast.</li>
        <li><strong>Fang mit den Fehlern an.</strong> Geh beim nächsten Mal zuerst die Checkliste durch und dann die Tabelle. Das sind die Karten, die Übung brauchen.</li>
        <li><strong>Für die nächste Runde zurücksetzen.</strong> Wenn jeder Fehler abgehakt ist, wähle Format, Mehr, Alles deaktivieren, oder lösch die abgehakten Zeilen und fang neu an.</li>
        <li><strong>Find eine Karte über jedes Wort.</strong> Die Suche liest jedes Wort in jeder Notiz, also findet „Mitochondrien“ die Karte, wo auch immer sie steht.</li>
      </ul>
      <p>
        Wenn du in Vorlesungen mitschreibst, stellt die Cornell-Methode in Apple
        Notizen die Fragen direkt neben deine Notizen, und so entsteht ein Kartenstapel schon beim Schreiben. Weitere Notizen zum
        Einfügen findest du in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo Karteikarten in Notizen aufhören</h2>
      <ul>
        <li><strong>Nichts ist fällig.</strong> Notizen weiß nicht, wann du eine Karte zuletzt gesehen hast, also lernst du entweder jedes Mal jede Karte oder führst selbst Buch.</li>
        <li><strong>Kein Umdrehen.</strong> Die Antwort steht immer auf der Seite. Abdecken funktioniert, aber ein schneller Blick passiert leicht.</li>
        <li><strong>Kein Mischen.</strong> Tabellen lassen sich nicht sortieren, also lernst du die Reihenfolge der Karten gleich mit.</li>
        <li><strong>Die Karten zu schreiben ist der langsame Teil.</strong> Aus einem Kapitel gute Fragen zu machen, dauert länger, als sie zu lernen.</li>
      </ul>
      <p>
        Für einen Test nächste Woche mit zwanzig Karten reicht eine Tabelle in Notizen. Für einen ganzen Kurs ist das Schwierige, zu wissen,
        welche Karten heute dran sind, und das überlässt Notizen dir.
      </p>

      <h2 id="pinto-notes">Karteikarten, die wiederkommen, wenn sie fällig sind</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und eine Notiz kann auch eine kleine App sein. Die
        kostenlose Vorlage <a href="/templates/study-flashcards">Study notes and flashcards</a> ist so eine: deine Notizen unter einer
        Überschrift pro Thema und eine Lern-App, die zeigt, wie viele Karten heute fällig sind. Tipp auf Study now, und sie fragt eine Karte
        nach der anderen ab. Tipp auf Show answer und sag dann, wie es lief (Again, Hard, Good oder Easy), und jede Taste zeigt, wann die
        Karte wiederkommt. Karten, die du nicht wusstest, kommen früher wieder; Karten, die du kannst, warten länger.
      </p>
      <p>
        Du kannst jede Karte in der App selbst hinzufügen, bearbeiten und löschen, oder du fügst eine Liste mit Fragen und Antworten ein, und
        sie macht die Karten daraus. Ist ChatGPT oder Claude verbunden, füg deine Vorlesungsnotizen oder ein Kapitel ein, und es macht fünf
        bis zehn Karten neben deinen. Sag „Frag mich Biologie ab, zehn Karten“, und es stellt sie im Chat, eine nach der anderen ohne die
        Antwort, und trägt jede Karte so ein, wie es die App tut. Frag „Welche Karten weiß ich immer wieder nicht?“, und es liest den Stapel,
        um zu antworten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Lernnotizen, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
