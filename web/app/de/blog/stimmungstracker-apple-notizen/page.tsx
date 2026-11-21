import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "stimmungstracker-apple-notizen");

// German version of /blog/apple-notes-mood-tracker (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "stimmungstracker" (vorlage, app, bullet journal, pdf), "stimmungstracker vorlage", "stimmungstagebuch"
// (vorlage, app), "mood tracker vorlage" (kostenlos, deutsch, zum ausdrucken), "mood tracker app"; "stimmungstracker
// iphone" and "stimmung tracken iphone" have no suggestions. German searchers use Stimmungstracker and Mood Tracker about
// equally; the slug takes the German word. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, two rows and two
// columns, the Tabulatortaste in the last cell adds a row, selected paragraphs become a table), de-de/guide/notes/
// apdb54e469b6/mac (anpinnen) and de-de/guide/notes/apda85974595/mac (Mathematische Ergebnisse). The table button is
// described as the German Cornell post does. Paste as Markdown is not used for the table, as in the English post. The
// table's last column is Anmerkung rather than Notiz, so it isn't read as the app's name; sleep uses a decimal comma.
// The Pinto template keeps its English name, Mood and energy log, as the app shows it. No medical advice, as in the
// English post. Facts are the English post's; the picture is its English one, described in German. Links go to the
// German journal and habit tracker posts and to English posts where no German one exists.

const ui = UI.de;

// Tabs between the columns: select those lines in Notes and turn them into a table.
const TEMPLATE = `Stimmung und Energie

Datum\tStimmung (1 bis 5)\tEnergie (1 bis 5)\tSchlaf (Stunden)\tAnmerkung
4. Nov.\t4\t4\t7,5\tSport vor der Arbeit
5. Nov.\t3\t2\t6\tDen ganzen Tag Meetings
6. Nov.\t4\t3\t6,5\tMittagessen mit Maja
7. Nov.\t4\t2\t5,5\tMajas Umzugstag
8. Nov.\t4\t4\t8\tAusgeschlafen

Muster
`;

const FAQ = [
  { q: "Hat Apple Notizen einen Stimmungstracker?", a: [
    "Nein. Apple Notizen hat keinen Stimmungstracker und keine Vorlagen. Eine Tabelle mit einer Zeile für jeden Abend, mit Stimmung, Energie, Schlaf und einer kurzen Anmerkung, funktioniert als einer, und du kannst die Vorlage auf dieser Seite einfügen und in eine Tabelle umwandeln.",
  ] },
  { q: "Was gehört in einen Stimmungstracker?", a: [
    "Halte ihn so klein, dass du ihn jeden Abend ausfüllst: das Datum, Stimmung und Energie von 1 bis 5, die Stunden Schlaf und eine Zeile über den Tag. Die Zeile ist am wichtigsten, denn sie erklärt später einen niedrigen Wert.",
  ] },
  { q: "Kann Apple Notizen ein Diagramm meiner Stimmung zeichnen?", a: [
    "Nein. Eine Tabelle in Notizen sortiert nicht, rechnet nicht zusammen und zeichnet kein Diagramm. Du liest die Spalten selbst, oder du kopierst die Zeilen in eine Tabellenkalkulation, wenn du eine Grafik willst.",
  ] },
  { q: "Gibt es einen Stimmungstracker, der Muster für mich findet?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für ein Stimmungs- und Energieprotokoll. Erzähl ChatGPT oder Claude von deinem Tag, und es trägt die Werte ein. Wenn du fragst, schreibt es auf, was ihm auffällt und auf wie vielen Tagen das beruht.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="stimmungstracker-apple-notizen"
      intro={<>
        Eine schlechte Woche wirkt, als käme sie aus dem Nichts, bis du dir die Nächte davor ansiehst. Mit einem Stimmungstracker siehst du
        hin. Hier ist ein Tracker für Stimmung und Energie in Apple Notizen zum Einfügen, ein Weg, ihn länger als eine Woche
        durchzuhalten, und wo eine Notiz aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#abends", label: "Jeden Abend" },
          { href: "#zurueckschauen", label: "Zurückschauen" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Protokoll, das Muster findet" },
        ]}>
          <p>
            Apple Notizen hat keinen Stimmungstracker, aber eine Tabelle erledigt das: eine Zeile für jeden Abend mit dem Datum, Stimmung und
            Energie von 1 bis 5, den Stunden Schlaf und einer Zeile über den Tag. Lies nach ein paar Wochen die Spalten hinunter und sieh,
            was deine guten Tage gemeinsam haben.
          </p>
          <PostCta template="mood-energy-log" slug="de/stimmungstracker-apple-notizen" path="/de/blog/stimmungstracker-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du, dass die Muster für dich gefunden werden?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat ein kostenloses Stimmungs- und Energieprotokoll. Erzähl ChatGPT oder Claude von deinem Tag, und es trägt die Zeile ein und sagt dir, was ihm auffällt, wenn du fragst.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/mood-energy-log-note" width={1520} height={1057} maxWidth={600}
        alt="Eine Notiz Mood and energy log in Pinto Notes auf dem Mac: eine Tabelle Check-ins mit fünf Abenden vom 4. bis 8. November, jeder mit Stimmung, Energie, Stunden Schlaf und einer kurzen Anmerkung, und darunter drei Muster."
        caption="Ein Stimmungs- und Energieprotokoll in Pinto Notes, in dem Stimmung und Energie Skalen von 1 bis 5 sind. In Apple Notizen funktionieren dieselben Spalten als normale Tabelle. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Zeile pro Abend</h2>
      <p>
        Fünf Spalten, und jede hat ihren Grund. Stimmung ist, wie sich der Tag angefühlt hat. Energie ist, wie viel du hattest, und das ist
        nicht dasselbe: Ein guter Tag kann dich leer zurücklassen. Schlaf ist die Zahl, die beides am ehesten erklärt. Die Anmerkung ist eine
        Zeile über den Tag, damit eine 3 auch in zwei Wochen noch etwas bedeutet. Fünf Beispielabende sind ausgefüllt. Ersetze sie durch
        deine.
      </p>
      <Keep title="Stimmung und Energie für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Jede Tabellenzeile hat einen Tab zwischen den Spalten. Füg sie ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füg die Vorlage in eine neue Notiz ein, markiere die sechs Zeilen von Datum bis
          zum letzten Abend und klicke in der Symbolleiste auf die Taste für Tabellen. Jeder Tab wird zu einer Spalte, so stehen Datum,
          Stimmung, Energie, Schlaf und Anmerkung nebeneinander.
        </li>
        <li>
          <strong>Beispiele löschen, eigene Zeilen anfügen.</strong> Lösch die Beispielabende oder überschreib sie. Die Tabulatortaste in
          der letzten Zelle fügt die nächste Zeile hinzu.
        </li>
        <li>
          <strong>Halte die Anmerkung kurz.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also
          quetscht eine lange Anmerkung die Zahlen zusammen. Ein paar Wörter reichen.
        </li>
        <li>
          <strong>Anpinnen.</strong> Pinne die Notiz oben in ihrem Ordner an, dann ist der Eintrag am Abend nur einen Tipp entfernt.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt alles, was eine Tabelle in Notizen
        kann und was nicht.
      </p>

      <h2 id="abends">Jeden Abend</h2>
      <ul>
        <li><strong>Jeden Tag zur selben Zeit.</strong> Füll ihn aus, wenn du dir die Zähne putzt oder das Telefon ans Ladekabel hängst, dann hängt er an etwas, das du sowieso tust.</li>
        <li><strong>Bewerte den ganzen Tag.</strong> Die Stimmung um 22 Uhr nach einem schönen Abendessen sagt wenig über einen schweren Nachmittag. Denk an den ganzen Tag zurück, bevor du eine Zahl wählst.</li>
        <li><strong>Nutze die ganze Skala.</strong> Ist jeder Tag eine 3, kann das Protokoll dir nichts zeigen. Ab und zu eine 1 oder eine 5 ist ehrlich.</li>
        <li><strong>Schreib, was anders war.</strong> „Den ganzen Tag Meetings“ oder „ausgeschlafen“ ist das, wonach du später suchst.</li>
        <li><strong>Lass einen verpassten Tag weg.</strong> Eine Lücke ist besser als ein Wert, den du dir drei Tage später ausdenkst.</li>
      </ul>
      <p>
        Willst du Worte und nicht nur Zahlen, kannst du in Apple Notizen jeden Tag vier kurze Fragen beantworten, und der <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker</a> passt neben diese Notiz, für Dinge
        wie einen Spaziergang oder keine Bildschirme nach zehn.
      </p>

      <h2 id="zurueckschauen">Zurückschauen</h2>
      <p>
        Lies einmal pro Woche die Tabelle hinunter und schreib unter Muster, was dir auffällt. Die Suche liest jedes Wort in jeder Notiz,
        also findet eine Suche nach „Meetings“ jeden Tag, an dem du es geschrieben hast. Für eine schnelle Summe rechnet Mathematische
        Ergebnisse, was du tippst: 4+3+4+4+4= unter der Tabelle zählt die Stimmung der Woche zusammen.
      </p>
      <p>
        Gib ihm ein paar Wochen, bevor du Schlüsse ziehst. Fünf Tage sind ein Anfang. Das ist ein Tagebuch darüber, wie du dich gefühlt hast,
        und kein Gesundheitswerkzeug. Wenn sich schlechte Tage häufen, sprich mit einer Ärztin oder einem Arzt.
      </p>

      <h2 id="grenzen">Wo ein Stimmungstracker in Notizen aufhört</h2>
      <ul>
        <li><strong>Tabellen zählen nicht.</strong> Eine Tabelle in Notizen kann deine besten Tage nicht nach oben sortieren, keinen Durchschnitt einer Spalte bilden und kein Diagramm zeichnen.</li>
        <li><strong>Muster nach Augenmaß.</strong> Zu sehen, dass die Energie nach einer kurzen Nacht sinkt, heißt jede Zeile lesen und im Kopf behalten.</li>
        <li><strong>Die Zeile wird getippt.</strong> An einem müden Abend reichen fünf Zellen, damit du es auslässt.</li>
      </ul>
      <p>
        Für einen Monat ist eine Tabelle in einer Notiz alles, was du brauchst. Über Monate bleibt der nützliche Teil bei dir: zu sehen, was
        dich aufbaut und was dich auslaugt.
      </p>

      <h2 id="pinto-notes">Ein Stimmungsprotokoll, das Muster findet</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/mood-energy-log">Mood and energy log</a> ist eine
        Notiz mit einer Tabelle Check-ins: ein Datum, Stimmung und Energie als Skalen von 1 bis 5, Schlaf in Stunden und eine Anmerkung,
        darunter Patterns.
      </p>
      <p>
        Erzähl deiner KI jeden Abend in deinen eigenen Worten von deinem Tag. Sie fügt die Zeile hinzu, mit Stimmung und Energie von 1
        (niedrig) bis 5 (sehr gut), deinem Schlaf und einer kurzen Zeile. Ist sie sich bei einem Wert nicht sicher, fragt sie dich, statt zu
        raten. Frag nach ein paar Wochen „Was haben meine besten Tage gemeinsam?“ oder „Ändert eine kurze Nacht meine Energie am nächsten
        Tag?“, und sie schreibt unter Patterns, was ihr auffällt, und auf wie vielen Tagen das beruht. Medizinische Ratschläge gibt sie
        nicht. Du kannst weiterhin jede Zeile selbst hinzufügen und bearbeiten, und jede frühere Version der Notiz bleibt erhalten. Das
        funktioniert, sobald ChatGPT oder Claude verbunden ist. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT
        verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Ein Protokoll, das du schon in Apple Notizen führst, kommt mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
