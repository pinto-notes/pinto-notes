import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "bewerbungstracker-apple-notizen");

// German version of /blog/apple-notes-job-search-tracker (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "bewerbungstracker" (vorlage, excel, notion), "bewerbungs tracker excel", "bewerbungen
// tracken" (excel), "bewerbungsübersicht vorlage" (excel), "bewerbungen übersicht" (excel, tabelle, arbeitsamt),
// "übersichtstabelle bewerbungen", "bewerbungsliste vorlage"; "jobsuche übersicht" and "bewerbungen notizen" have no
// suggestions. An interview is a Gespräch here. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, the Tabulatortaste
// in the last cell adds a row, selected paragraphs become a table), apd93c815aa0 (Markierte Einträge automatisch
// sortieren), apde615d29c2 (Bearbeiten, Link hinzufügen, Command-K) and apdb54e469b6 (anpinnen). Bearbeiten, Als
// Markdown einsetzen is in Notes' de strings (MainMenu.loctable) on macOS 27.2. Paste as Markdown is not used for the
// table, as in the English post. The Pinto template's Stage choices stay in English, since the app is in English. Facts
// are the English post's; the picture is its English one, described in German. Links go to the German meeting notes post
// and to English posts where no German one exists.

const ui = UI.de;

// Tabs between the columns: select those lines in Notes and turn them into a table.
const TABLE = `Bewerbungen

Firma\tStelle\tStatus\tNächster Schritt
Tideway\tSenior Designer\tGespräch\tErstes Gespräch, 12. Nov.
Marlow Studio\tDesign Lead\tBeworben\tNachfassen, 16. Nov.
Finch Bikes\tProduct Designer\tGemerkt\tBewerben bis 18. Nov.
Northlight\tUX Designer\tAbsage\tUm Feedback gebeten
`;

const REST = `## Gesprächsvorbereitung
Tideway, erstes Gespräch am 12. Nov.
1. Ein Projekt, auf das du stolz bist? Das neue Onboarding.
2. Wie arbeitest du mit der Entwicklung? Wöchentliche Reviews, kleine Releases.
3. Warum Tideway? Ich entwirre gern Logistik.

Meine Frage an sie: Wie teilen Design und Support, was sie hören?

## Diese Woche
- [ ] Portfolio-Link an Tideway schicken
- [ ] Onboarding-Projekt in den Lebenslauf aufnehmen

## Mit wem ich gesprochen habe
- Karin, Design-Managerin bei Tideway: Schlichte Prototypen sind ihr wichtiger als Feinschliff.
`;

const FAQ = [
  { q: "Kann ich Bewerbungen in Apple Notizen verfolgen?", a: [
    "Ja, mit einer Tabelle. Leg eine Zeile pro Stelle an, mit Firma, Stelle, Status und nächstem Schritt, und führ die Dinge zum Nachfassen als Checkliste darunter. Apple Notizen hat keine Vorlagen, also füg die von dieser Seite in eine neue Notiz ein.",
  ] },
  { q: "Kann Apple Notizen meine Bewerbungen nach Status sortieren?", a: [
    "Nein. Tabellen in Notizen lassen sich nicht sortieren und rechnen nicht zusammen. Nimm für den Status immer dieselben Wörter (Gemerkt, Beworben, Gespräch, Angebot, Absage), dann ist die Spalte schnell gelesen.",
  ] },
  { q: "Ist eine Tabellenkalkulation für die Jobsuche besser?", a: [
    "Eine Tabellenkalkulation sortiert und filtert, und das hilft ab ein paar Dutzend Bewerbungen. Eine Notiz hält die Tabelle neben deiner Gesprächsvorbereitung und den Leuten, mit denen du gesprochen hast, auf deinem Handy, zwischen zwei Gesprächen.",
  ] },
  { q: "Gibt es einen Bewerbungstracker, der sich selbst ausfüllt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für die Jobsuche. Füg eine Stellenanzeige in ChatGPT oder Claude ein, und es fügt die Zeile hinzu und hält dann Status und nächsten Schritt aktuell, wenn du ihm erzählst, was passiert ist.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="bewerbungstracker-apple-notizen"
      intro={<>
        Die meisten Bewerbungstracker sind Tabellenkalkulationen, und eine Tabellenkalkulation ist noch etwas, das du öffnen musst. Lebst du
        ohnehin in Apple Notizen, kann eine Notiz jede Bewerbung halten und was als Nächstes passiert. Hier ist eine Vorlage für einen
        Bewerbungstracker in Apple Notizen, wie du ihn aktuell hältst und wo er aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#jede-woche", label: "Woche für Woche" },
          { href: "#grenzen", label: "Wo er aufhört" },
          { href: "#pinto-notes", label: "Ein Tracker, der sich selbst aktualisiert" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für einen Bewerbungstracker, aber eine Notiz mit einer Tabelle erledigt das: eine Zeile pro
            Bewerbung mit Firma, Stelle, Status und nächstem Schritt. Unter der Tabelle stehen deine Gesprächsvorbereitung, eine Checkliste
            mit dem, was du diese Woche nachfassen willst, und die Leute, mit denen du gesprochen hast.
          </p>
          <PostCta template="job-hunt" slug="de/bewerbungstracker-apple-notizen" path="/de/blog/bewerbungstracker-apple-notizen" position="answer" ui={ui.cta}
            title="Soll der Tracker für dich aktuell bleiben?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für die Jobsuche. Füg eine Stellenanzeige in ChatGPT oder Claude ein, und es fügt die Zeile hinzu und hilft dir dann, dich auf das Gespräch vorzubereiten.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/job-hunt-note" width={1520} height={1514} maxWidth={600}
        alt="Eine Notiz Job hunt in Pinto Notes auf dem Mac: eine Tabelle Applications mit vier Stellen, Tideway bei Interview, eine Gesprächsvorbereitung mit drei Fragen und Antworten dazu, eine Checkliste This week mit einem abgehakten Eintrag und eine Notiz über Karin bei Tideway."
        caption="Ein Bewerbungstracker in Pinto Notes, mit Stage als Auswahlspalte. In Apple Notizen funktioniert dieselbe Tabelle, mit dem Status als getipptem Wort. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz, eine Zeile pro Stelle</h2>
      <p>
        Die Tabelle beantwortet die Frage, die du dir am häufigsten stellst: Wo steht jede Bewerbung, und was tue ich als Nächstes? Schreib
        zu jedem nächsten Schritt ein Datum, denn „nachfassen“ ohne Tag bleibt gern liegen. Alles, was nicht in eine Zeile passt, kommt unter
        die Tabelle.
      </p>
      <Keep title="Bewerbungstabelle für Apple Notizen" text={TABLE} copyLabel={ui.copy}
        note="Jede Tabellenzeile hat einen Tab zwischen den Spalten. Füg sie ein und mach dann aus diesen Zeilen eine Tabelle." />
      <Keep title="Vorbereitung und Nachfassen für Apple Notizen" text={REST} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen unter der Tabelle ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
      ]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füg die Tabellenvorlage in eine neue Notiz ein, markiere die fünf Zeilen von
          Firma bis Northlight und klicke in der Symbolleiste auf die Taste für Tabellen. Jeder Tab wird zu einer Spalte, so stehen Firma,
          Stelle, Status und Nächster Schritt nebeneinander.
        </li>
        <li>
          <strong>Den Rest dazu.</strong> Klick unter die Tabelle und wähle mit der zweiten Vorlage Bearbeiten, Als Markdown einsetzen. Unter
          macOS 27 wird jede Zeile mit ## zu einer Überschrift und das Nachfassen zu einer Checkliste. Ein normales Command-V lässt die
          Zeichen als Text stehen. Auf dem iPhone tippst du die Überschriften, markierst die Einträge zum Nachfassen und tippst auf die
          Checklisten-Taste.
        </li>
        <li>
          <strong>Eine Stelle hinzufügen.</strong> Klick in die letzte Zelle und drück die Tabulatortaste für eine neue Zeile. Notizen legt
          die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also halte jede Zelle bei ein paar Wörtern.
        </li>
        <li>
          <strong>Pinne sie an.</strong> Pinne die Notiz oben in ihrem Ordner an, dann siehst du sie als Erstes, wenn eine Personalvermittlerin
          anruft.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt alles, was eine Tabelle in Notizen
        kann und was nicht.
      </p>

      <h2 id="jede-woche">Woche für Woche</h2>
      <ul>
        <li>
          <strong>Nimm dieselben Status-Wörter.</strong> Gemerkt, Beworben, Gespräch, Angebot, Absage, Zurückgezogen. Die Tabelle sortiert
          nicht, also machen dieselben paar Wörter die Spalte schnell lesbar.
        </li>
        <li>
          <strong>Ändere die Zeile am Tag, an dem etwas passiert.</strong> Eine Antwort, eine Absage, ein Gesprächstermin: Aktualisier Status
          und Nächster Schritt, bevor du die E-Mail schließt.
        </li>
        <li>
          <strong>Plan das Nachfassen am Sonntag.</strong> Lies die Spalte Nächster Schritt hinunter und kopier, was fällig ist, unter Diese
          Woche. Ist „Markierte Einträge automatisch sortieren“ aktiviert, rutscht Abgehaktes nach unten.
        </li>
        <li>
          <strong>Gib langer Vorbereitung eine eigene Notiz.</strong> Wächst die Vorbereitung für eine Firma über ein paar Fragen hinaus,
          verschieb sie in eine eigene Notiz und verlinke sie unter Gesprächsvorbereitung mit Bearbeiten, Link hinzufügen (Command-K).
        </li>
        <li>
          <strong>Schreib auf, wen du getroffen hast.</strong> Eine Zeile zu jeder Person und was ihr wichtig war, ist das, was du vor dem
          zweiten Gespräch haben willst. Die Suche liest jedes Wort, also findet ein Name die Zeile.
        </li>
      </ul>
      <p>
        Für Notizen aus den Gesprächen selbst funktioniert eine Gesprächsnotiz
        in Apple Notizen so, wie es ist. Weitere Notizen zum Einfügen findest du in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo ein Bewerbungstracker in Notizen aufhört</h2>
      <ul>
        <li><strong>Jede Stelle tippst du von Hand.</strong> Firma, Stelle und der Link zur Anzeige kommen Zelle für Zelle aus der Ausschreibung.</li>
        <li><strong>Kein Sortieren oder Filtern.</strong> Bei dreißig Zeilen heißt es, die Spalte hinunterzulesen, um die mit Gespräch zu finden.</li>
        <li><strong>Daten sind nur Text.</strong> „Nachfassen, 16. Nov.“ steht in einer Zelle. Dass heute der 16. ist, musst du selbst merken.</li>
        <li><strong>Die Vorbereitung fängt bei einer leeren Seite an.</strong> Die wahrscheinlichen Fragen für jede Stelle und deine Antworten schreibst du selbst.</li>
      </ul>
      <p>
        Für eine Handvoll Bewerbungen ist die Notiz alles, was du brauchst. Bei zwanzig gleichzeitig ist es eine eigene Aufgabe, die Tabelle
        aktuell zu halten.
      </p>

      <h2 id="pinto-notes">Ein Bewerbungstracker, der sich selbst aktualisiert</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/job-hunt">Job hunt</a> ist eine Notiz mit einer Tabelle
        Applications, in der Stage eine Auswahl aus Saved, Applied, Interview, Offer, Rejected oder Withdrawn ist, und Abschnitten für die
        Gesprächsvorbereitung, das Nachfassen dieser Woche und die Leute, mit denen du gesprochen hast.
      </p>
      <p>
        Füg eine Stellenanzeige oder einen Link in deine KI ein, und sie fügt eine Zeile hinzu: die Firma, die Stelle mit Link zur Anzeige,
        Stage auf Saved und den nächsten Schritt. Sag ihr, dass du dich beworben oder eine Antwort bekommen hast, und sie ändert die Zeile.
        Sag „Ich habe am Donnerstag ein erstes Gespräch bei Tideway, hilf mir bei der Vorbereitung“, und sie schreibt fünf wahrscheinliche
        Fragen mit deinen Antworten dazu unter den Namen der Firma. Frag „Was sollte ich diese Woche nachfassen?“, und sie listet es als
        Checkliste auf. Du kannst weiterhin jede Zeile selbst bearbeiten, und jede frühere Version der Notiz bleibt erhalten. Dieser Teil
        funktioniert, sobald ChatGPT oder Claude verbunden ist; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT
        verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Notizen, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
