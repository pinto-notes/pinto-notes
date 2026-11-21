import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "cornell-methode-apple-notizen");

// German version of /blog/apple-notes-cornell-notes-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "cornell methode" (vorlage, notizen, lernen, beispiel), "cornell methode vorlage" (word,
// pdf, goodnotes, onenote, pages), "cornell methode notizen", "cornell notizen vorlage", "cornell notes vorlage"; German
// searchers say Cornell-Methode far more than Cornell notes. The cue column is the Stichwortspalte, so a cue is a
// Stichwort. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, two rows and two
// columns, the Tabulatortaste in the last cell adds a row, selected paragraphs become a table) and Notes' de strings
// (MainMenu.loctable) on macOS 27.2 for Ablage, Notiz duplizieren. Paste as Markdown is not used for the table, as in the
// English post. Facts are the English post's; the picture is its English one, described in German. Links go to the
// German habit tracker post and to English posts where no German one exists.

const ui = UI.de;

// Tabs between the cue and the note: select those lines in Notes and turn them into a table.
const TEMPLATE = `Angebot und Nachfrage, 5. November

Stichwort\tNotizen
Was verschiebt die Nachfragekurve?\tEinkommen, Vorlieben, Preise verwandter Güter
Was bewegt sich entlang der Kurve?\tNur der eigene Preis des Guts
Was ist der Gleichgewichtspreis?\tWo die Nachfrage dem Angebot entspricht
Was bewirkt ein Höchstpreis?\tKnappheit, wenn er unter dem Gleichgewicht liegt

Zusammenfassung: Der eigene Preis eines Guts bewegt dich entlang der Nachfragekurve; Einkommen, Vorlieben und Preise verwandter Güter verschieben sie. Der Preis pendelt sich dort ein, wo die Nachfrage dem Angebot entspricht.
`;

const FAQ = [
  { q: "Kann man die Cornell-Methode in Apple Notizen nutzen?", a: [
    "Ja, mit einer Tabelle. Leg eine Tabelle mit zwei Spalten an, schreib Fragen in die linke Spalte und deine Notizen in die rechte, und darunter eine Zusammenfassung in zwei oder drei Sätzen. Zum Lernen deckst du die rechte Spalte ab und beantwortest die Fragen.",
  ] },
  { q: "Wie lege ich in Apple Notizen eine Tabelle mit zwei Spalten an?", a: [
    "Wähle auf dem Mac Format, Tabelle oder drück Option-Command-T. Du bekommst zwei Zeilen und zwei Spalten, und die Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Du kannst auch Zeilen mit einem Tab zwischen den beiden Teilen tippen, sie markieren und in eine Tabelle umwandeln.",
  ] },
  { q: "Kann ich die Stichwortspalte schmaler machen?", a: [
    "Nein. Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen. Halte die Stichworte kurz, eine Frage aus wenigen Wörtern, dann bekommt die Notizenspalte den Platz.",
  ] },
  { q: "Gibt es eine App für die Cornell-Methode, die mich abfragt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für die Cornell-Methode. Füg deine Vorlesungsnotizen in ChatGPT oder Claude ein, und es schreibt die Stichworte und die Zusammenfassung, fragt dich dann zu den Stichworten ab und merkt sich die, die du nicht wusstest.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="cornell-methode-apple-notizen"
      intro={<>
        Die Cornell-Methode funktioniert, weil sie deine Notizen in Fragen verwandelt, mit denen du dich selbst prüfen kannst. Apple Notizen
        hat das Layout nicht eingebaut, aber eine Tabelle mit zwei Spalten bringt dich hin. Hier ist eine Vorlage für die Cornell-Methode in
        Apple Notizen, wie du damit lernst und wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#lernen", label: "Damit lernen" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Notizen, die dich abfragen" },
        ]}>
          <p>
            Apple Notizen hat keine Cornell-Vorlage, aber eine Tabelle mit zwei Spalten funktioniert: links eine kurze Frage, rechts deine
            Notiz, eine Zeile pro Gedanke, und unter der Tabelle eine Zusammenfassung in zwei oder drei Sätzen. Nimm eine Notiz pro Vorlesung,
            und deck zum Lernen die rechte Spalte ab.
          </p>
          <PostCta slug="de/cornell-methode-apple-notizen" path="/de/blog/cornell-methode-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du die Stichworte geschrieben bekommen, und ein Quiz?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für die Cornell-Methode. Füg deine Vorlesungsnotizen in ChatGPT oder Claude ein, und es schreibt Stichworte und Zusammenfassung und fragt dich dann ab.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/cornell-notes-note" width={1520} height={1010} maxWidth={620}
        alt="Eine Notiz Cornell notes in Pinto Notes auf dem Mac: eine Vorlesung Supply and demand mit einer Tabelle Cue und Notes aus vier Zeilen, einer Zusammenfassung und einer Checkliste Cues to revisit."
        caption="Cornell-Notizen in Pinto Notes: Stichworte links, Notizen rechts, eine Zusammenfassung und die Stichworte, die du nicht wusstest. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: Stichworte, Notizen, Zusammenfassung</h2>
      <p>
        Die ursprüngliche Cornell-Seite hat drei Teile, und eine Notiz kann alle halten. Die Notizenspalte ist, was du in der Vorlesung
        mitgeschrieben hast, in kurzen Zeilen. Die Stichwortspalte ist eine Frage, die jede Zeile beantwortet, geschrieben nach der Vorlesung.
        Die Zusammenfassung sind zwei oder drei Sätze in deinen eigenen Worten, und genau dort passiert das meiste Behalten.
      </p>
      <Keep title="Cornell-Methode für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Jede Tabellenzeile hat einen Tab zwischen Stichwort und Notiz. Füg sie ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füg die Vorlage in eine neue Notiz ein, markiere die fünf Zeilen von Stichwort
          bis zur letzten Notiz und klicke in der Symbolleiste auf die Taste für Tabellen. Jeder Tab wird zu einer Spalte, so stehen Stichwort
          und Notizen nebeneinander.
        </li>
        <li>
          <strong>Oder leer anfangen.</strong> Wähle Format, Tabelle für zwei Zeilen und zwei Spalten. Tipp Stichwort und Notizen in die erste
          Zeile, und die Tabulatortaste in der letzten Zelle fügt die nächste Zeile hinzu.
        </li>
        <li>
          <strong>Halte die Stichworte kurz.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also
          quetscht ein langes Stichwort deine Notizen zusammen. Ein paar Wörter, als Frage.
        </li>
        <li>
          <strong>Eine Notiz pro Vorlesung.</strong> Bewahre sie in einem Ordner pro Kurs auf, und wähle Ablage, Notiz duplizieren, um die
          nächste Vorlesung mit der letzten zu beginnen.
        </li>
      </ul>
      <p>
        Füll in der Vorlesung nur die Notizenspalte aus. Schreib die Stichworte und die Zusammenfassung noch am selben Abend, solange du noch
        weißt, was die Vorlesung gemeint hat. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt
        alles, was eine Tabelle in Notizen kann und was nicht.
      </p>

      <h2 id="lernen">Damit lernen</h2>
      <ul>
        <li><strong>Deck die rechte Spalte ab.</strong> Halte eine Karte oder deine Hand über die Notizen und beantworte jedes Stichwort laut.</li>
        <li><strong>Markiere, was du nicht wusstest.</strong> Führ unter der Zusammenfassung eine kurze Checkliste mit den Stichworten, die du falsch hattest, und hake jedes ab, sobald du es richtig weißt.</li>
        <li><strong>Lies zuerst die Zusammenfassungen.</strong> Vor einer Prüfung bringen dich die Zusammenfassungen aller Vorlesungen am schnellsten zurück in einen Kurs.</li>
      </ul>
      <p>
        Weitere Notizen, die du genauso einfügst, findest du in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes
        templates</a> (auf Englisch), und um eine Lernwoche im Griff zu behalten, funktioniert der{" "}
        <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker in Apple Notizen</a> auch für Lerneinheiten.
      </p>

      <h2 id="grenzen">Wo die Cornell-Methode in Notizen aufhört</h2>
      <ul>
        <li><strong>Die Stichworte bleiben bei dir.</strong> Aus jeder Zeile deiner Notizen eine gute Frage zu machen, ist der langsame Teil, und genau den lassen viele weg.</li>
        <li><strong>Kein Quiz.</strong> Eine Spalte mit der Hand abzudecken funktioniert, aber nichts stellt dir die Fragen oder merkt sich, welche du nicht wusstest.</li>
        <li><strong>Vorlesungen bleiben getrennt.</strong> Ein Thema zu wiederholen, das sich über drei Vorlesungen zog, heißt drei Notizen öffnen.</li>
      </ul>

      <h2 id="pinto-notes">Cornell-Notizen, die dich abfragen</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/cornell-notes">Cornell-Notizen</a> ist eine Notiz pro
        Kurs: ein Abschnitt pro Vorlesung mit einer Tabelle aus Stichworten und Notizen und einer Zusammenfassung, dazu eine Liste mit
        Stichworten zum Wiederholen.
      </p>
      <p>
        Füg deine Notizen aus der Vorlesung oder vom Lesen in deine KI ein. Sie setzt deine Notizen in kurzen Zeilen nach rechts, schreibt
        links eine Frage zu jeder und schließt mit einer Zusammenfassung in einfachen Sätzen. Sag „Frag mich zu Angebot und Nachfrage ab“, und
        sie stellt die Stichworte einzeln, ohne die Antworten zu zeigen, setzt dann die, die du nicht wusstest, auf die Liste zum Wiederholen
        und hakt sie ab, wenn du sie später richtig hast. Du kannst jede Zeile weiterhin selbst schreiben und bearbeiten, und jede frühere
        Version der Notiz bleibt erhalten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch)
        dauert eine Minute. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
