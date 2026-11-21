import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "habit-tracker-vorlage-apple-notizen");

// German version of /blog/apple-notes-habit-tracker (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "habit tracker vorlage" (pdf, kostenlos, kostenlos deutsch, goodnotes), "gewohnheitstracker vorlage",
// "habit tracker apple notes", "habit tracker apple notes template", "habit tracker iphone notes"; German searchers use
// the English "Habit Tracker" more than "Gewohnheitstracker". Apple's own German words, read 21 Nov 2026, from the Mac
// guide support.apple.com/de-de/guide/notes/apd93c815aa0/mac ("Hinzufügen von Listen": Format, Mehr, Alles aktivieren
// and Alles deaktivieren; Markierte Einträge automatisch sortieren) and de-de/guide/notes/apd58edc7964/mac (intelligente
// Ordner, the Checklisten rule). Bearbeiten, Als Markdown einsetzen and Ablage, Notiz duplizieren are Notes' de strings
// (MainMenu.loctable) on macOS 27.2, and the Smart Folder value Nicht markiert is SmartFolderChecklistsFilterView there.
// Facts are the English post's; the pictures are its English ones, described in German. Links go to the German workout
// post and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Gewohnheiten, Woche vom 16. November

## Montag
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## Dienstag
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## Mittwoch
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## Donnerstag
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## Freitag
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## Samstag
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## Sonntag
- [ ] 20 Minuten spazieren
- [ ] 10 Seiten lesen
- [ ] Um 23 Uhr im Bett

## So lief die Woche
- Geschafft:
- Verpasst:
`;

const FAQ = [
  { q: "Hat Apple Notizen einen Habit Tracker?", a: [
    "Nein. Apple Notizen hat keinen Habit Tracker und keine Vorlagen. Eine Notiz mit einer Überschrift für jeden Tag und deinen Gewohnheiten als Checkliste darunter funktioniert als einer: Du hakst die Gewohnheiten ab, wenn du sie erledigt hast, und fängst jede Woche mit einer frischen Kopie an.",
  ] },
  { q: "Wie setze ich eine Checkliste in Apple Notizen zurück?", a: [
    "Klicke auf dem Mac in die Checkliste und wähle Format, Mehr, Alles deaktivieren. Dabei geht verloren, was du abgehakt hast. Dupliziere bei einem Habit Tracker deshalb zuerst die Notiz und setze die Kopie zurück.",
  ] },
  { q: "Kann Apple Notizen meine Serie zählen?", a: [
    "Nein. Notizen zählt keine Häkchen über Notizen oder Tage hinweg. Eine Serie zählst du selbst, indem du durch die Wochen zurückscrollst.",
  ] },
  { q: "Gibt es einen kostenlosen Habit Tracker, der wie eine Notiz funktioniert?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für einen Habit Tracker: eine Notiz, die eine kleine App ist, mit einem Ring für diese Woche, einem Häkchen pro Gewohnheit, Serien und einer Monatsansicht. ChatGPT oder Claude können eintragen, was du gemacht hast.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="habit-tracker-vorlage-apple-notizen"
      intro={<>
        Du willst ein paar Gewohnheiten in der App verfolgen, die du sowieso jeden Tag öffnest, statt dich bei noch einer anzumelden. Apple
        Notizen kann eine einfache Version davon. Hier ist eine Wochenvorlage zum Einfügen, wie du sie am Laufen hältst und wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#jede-woche", label: "Jede Woche" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Tracker, der zählt" },
        ]}>
          <p>
            Apple Notizen hat keinen Habit Tracker, aber eine Checkliste erledigt den täglichen Teil. Leg pro Woche eine Notiz an, mit einer
            Überschrift für jeden Tag und deinen Gewohnheiten als Checkliste darunter. Hake sie im Lauf des Tages ab und dupliziere die Notiz
            am Montag. Kopiere die Vorlage unten.
          </p>
          <PostCta template="habit-tracker" slug="de/habit-tracker-vorlage-apple-notizen" path="/de/blog/habit-tracker-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du, dass deine Serien für dich gezählt werden?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für einen Habit Tracker: Hake eine Gewohnheit mit einem Tippen ab und sieh den Ring dieser Woche, deine Serien und den Monat. ChatGPT oder Claude können den Tag für dich eintragen.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/template-copies" width={1200} height={750} maxWidth={560}
        alt="Drei gezeichnete Checklisten-Karten, aufgefächert, mit Strichlisten daneben."
        caption="Ein Habit Tracker in Notizen ist eine Checkliste, die du jede Woche kopierst." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Woche Gewohnheiten</h2>
      <p>
        Drei Gewohnheiten, sieben Tage und ein Platz dafür, wie die Woche lief. Setz deine eigenen Gewohnheiten ein, bevor du einfügst. Lass
        in jeder Zeile ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Wöchentlicher Habit Tracker für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Dasselbe Markdown zweimal in Apple Notizen unter macOS 27 eingefügt: mit Command-V bleiben die Zeichen als Text stehen, mit Edit, Paste as Markdown werden daraus eine Überschrift, eine Liste und fetter Text."
        caption="Links normal eingefügt, rechts mit „Als Markdown einsetzen“. Mit Checklistenzeilen geht es genauso." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Leg auf einem Mac mit macOS 27 eine neue Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die Zeile mit # wird zum Titel, jeder
        Tag zu einer Überschrift, und die Zeilen mit <code>- [ ]</code> werden zu einer Checkliste, die du abhaken kannst. Ein normales
        Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du die Gewohnheiten als Zeilen, markierst sie und tippst auf die
        Checklisten-Taste.
      </p>
      <p>
        Zwei Einstellungen helfen. Aktiviere in den Einstellungen von Notizen „Markierte Einträge automatisch sortieren“, dann rutscht, was
        du erledigt hast, an das Ende des Tages. Und ein intelligenter Ordner mit der Regel Checklisten, Nicht markiert zeigt jede Notiz, in
        der noch etwas abzuhaken ist.
      </p>

      <h2 id="jede-woche">Jede Woche</h2>
      <p>
        Wähle am Montag die Notiz der letzten Woche aus und dann Ablage, Notiz duplizieren. Ändere das Datum im Titel und entferne alle
        Häkchen: Klicke in die Checkliste jedes Tages und wähle Format, Mehr, Alles deaktivieren. Bewahre die alten Notizen in einem Ordner
        Gewohnheiten auf. Dieser Ordner ist dein Verlauf.
      </p>
      <p>
        Wenn du auch andere Routinen so führst, findest du in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a>{" "}
        (auf Englisch) einen Wochenrückblick und eine Liste für heute, die du genauso einfügst. Ist eine deiner Gewohnheiten das
        Fitnessstudio, hält ein <a href="/de/blog/trainingsplan-apple-notizen">Trainingsplan in Apple Notizen</a> die Sätze und deine
        Bestwerte fest.
      </p>

      <p>
        Um auf die ganze Woche zurückzublicken, stellt ein Wochenrückblick jeden Sonntag fünf Fragen.
      </p>

      <h2 id="grenzen">Wo ein Habit Tracker in Notizen aufhört</h2>
      <ul>
        <li><strong>Keine Serien.</strong> Notizen zählt keine Häkchen. Wie viele Tage hintereinander du spazieren warst, zählst du selbst, indem du durch alte Wochen zurückscrollst.</li>
        <li><strong>Keine Woche auf einen Blick.</strong> Jeder Tag ist eine eigene Checkliste. Welche Gewohnheit du immer wieder auslässt, siehst du erst, wenn du die ganze Notiz liest.</li>
        <li><strong>Jede Gewohnheit, jeden Tag.</strong> Eine Gewohnheit, die du dreimal pro Woche willst, oder acht Gläser Wasser passen nicht in ein einzelnes Häkchen.</li>
        <li><strong>Jeden Montag eine Kopie.</strong> Vergisst du das Duplizieren, landen die Häkchen der Woche in der Notiz der letzten Woche.</li>
      </ul>
      <p>
        Für drei Gewohnheiten und etwas Disziplin funktioniert die Notiz. Darüber hinaus machst du das Zählen, das eine App für dich erledigen
        könnte.
      </p>

      <h2 id="pinto-notes">Ein Habit Tracker, der für dich zählt</h2>
      <Figure shot={{ ...SHOTS.habitApp, alt: "Die Habit-Tracker-App in einer Notiz in Pinto Notes auf dem Mac: der Ring dieser Woche bei 62 Prozent, heute 2 von 6 Gewohnheiten erledigt, ein Raster mit der Woche jeder Gewohnheit und die Gewohnheiten mit ihren Häkchen und Serien, darunter Gym bei 1 von 3 diese Woche." }}
        caption="Die Vorlage Habit Tracker in Pinto Notes auf dem Mac, mit Beispieldaten: der Ring dieser Woche, die Gewohnheiten von heute mit ihren Serien und Gym bei 1 von 3 diese Woche." />
      <p>
        Dafür gibt es Pinto Notes. Es sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und eine Notiz kann auch eine kleine
        App sein. Die kostenlose Vorlage <a href="/templates/habit-tracker">Habit Tracker</a> ist so eine. Du wählst deine Gewohnheiten
        einmal aus, hakst sie mit einem Tippen ab, und sie zeigt den Ring dieser Woche, die Serie und die beste Serie jeder Gewohnheit und
        einen Monat, den du auch nachträglich ausfüllen kannst. Eine Gewohnheit kann täglich sein, an bestimmten Wochentagen, ein paarmal pro
        Woche oder eine Anzahl wie Gläser Wasser.
      </p>
      <p>
        Du kannst auch ChatGPT oder Claude im Chat, den du schon nutzt, sagen, was du gemacht hast, und es hakt den Tag in der Notiz ab. Frag,
        welche Gewohnheit du diesen Monat am häufigsten ausgelassen hast, und es liest den Tracker, um zu antworten.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch)
        mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
