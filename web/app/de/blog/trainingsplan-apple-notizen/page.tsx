import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "trainingsplan-apple-notizen");

// German version of /blog/apple-notes-workout-log-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "trainingsplan in apple notizen" (offered for both "trainingsplan apple" and "trainingsplan
// notizen"), "trainingsplan vorlage" (zum ausfüllen, kostenlos, krafttraining, leer), "trainingstagebuch vorlage",
// "trainingsplan iphone erstellen", "gym notizen"; "workout notizen iphone" has no suggestions. German searchers say
// Trainingsplan for what the English post calls a workout log, so the title uses it and the text calls the log a
// Trainingstagebuch where that fits. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd93c815aa0/mac (Format, Mehr, Alles deaktivieren), apd0a136b9cc (Format,
// Tabelle) and apdb54e469b6 (anpinnen). Bearbeiten, Als Markdown einsetzen and Ablage, Notiz duplizieren are Notes' de
// strings (MainMenu.loctable) on macOS 27.2. The template keeps Push and Pull, as German gyms say them, and writes
// 102,5 kg with a comma. Facts are the English post's; the picture is its English one, described in German. Links go to
// the German habit tracker post and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Training, Woche vom 23. November

## Plan
- Beine: Kniebeugen, Ausfallschritte, Wadenheben
- Push: Bankdrücken, Schulterdrücken, Dips
- Pull: Kreuzheben, Rudern, Klimmzüge

## Montag: Beine
- [ ] Kniebeugen 3 x 5 mit 100 kg
- [ ] Ausfallschritte 3 x 10 mit 16 kg
- [ ] Wadenheben 3 x 15

## Mittwoch: Push
- [ ] Bankdrücken 3 x 6 mit 70 kg
- [ ] Schulterdrücken 3 x 8 mit 40 kg
- [ ] Dips 3 x 10

## Freitag: Pull
- [ ] Kreuzheben 3 x 3 mit 120 kg
- [ ] Rudern 3 x 8 mit 60 kg
- [ ] Klimmzüge 3 x 6

## Bestwerte
- Kreuzheben: 120 kg x 3 (6. Nov.)
- Kniebeugen: 100 kg x 5 (2. Nov.)
- Bankdrücken: 70 kg x 6 (4. Nov.)
- 5 km Laufen: 29 min (5. Nov.)
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für einen Trainingsplan?", a: [
    "Nein. Apple Notizen hat keine Vorlagen und kein Trainingstagebuch. Eine Notiz pro Woche, mit einer Überschrift für jeden Trainingstag und den Sätzen als Checkliste, funktioniert als eines, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Soll ich mein Training als Checkliste oder als Tabelle notieren?", a: [
    "Eine Checkliste ist im Studio schneller: Hake jeden Satz ab und ändere das Gewicht, wenn es anders war. Eine Tabelle über Format, Tabelle ordnet Daten und Gewichte in Spalten, aber Notizen kann sie weder sortieren noch addieren, also hilft sie weniger, als sie aussieht.",
  ] },
  { q: "Wie halte ich meine Bestwerte in Apple Notizen fest?", a: [
    "Führ unten in der Notiz eine Liste Bestwerte und ändere eine Zeile mit Datum, wenn du sie übertriffst. Notizen erkennt keinen neuen Bestwert für dich, also schau nach jedem Training auf die Liste.",
  ] },
  { q: "Gibt es ein Trainingstagebuch, das meine Bestwerte für mich führt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für ein Trainingstagebuch: eine Zeile pro Training und eine Liste deiner Bestwerte. Sag ChatGPT oder Claude nach dem Training, was du gemacht hast, und es trägt das Training ein und aktualisiert deine Bestwerte.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="trainingsplan-apple-notizen"
      intro={<>
        Eine Fitness-App will einen Account, einen Plan und ein Abo, bevor du die erste Kniebeuge machst. Eine Notiz will nur die Sätze. Hier
        ist eine Trainingsvorlage für Apple Notizen zum Einfügen, wie du sie im Studio nutzt und wo sie nicht mehr reicht.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#im-studio", label: "Im Studio" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Log, das deine Bestwerte führt" },
        ]}>
          <p>
            Apple Notizen hat kein Trainingstagebuch, aber eine Notiz pro Woche erledigt das. Schreib deinen Plan oben hin, eine Überschrift
            für jeden Trainingstag mit den Sätzen als Checkliste und deine Bestwerte ganz unten. Kopiere die Vorlage unten und dupliziere sie
            jede Woche.
          </p>
          <PostCta template="workout-log" slug="de/trainingsplan-apple-notizen" path="/de/blog/trainingsplan-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du deine Bestwerte für dich führen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für ein Trainingstagebuch. Sag ChatGPT oder Claude nach dem Training, was du gemacht hast, und es trägt das Training ein und aktualisiert deine Bestwerte.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/workout-log-note" width={1520} height={1020} maxWidth={640}
        alt="Eine Notiz Workout log in Pinto Notes auf dem Mac: eine Tabelle Sessions mit einer Zeile pro Training, von einem Pull-Tag mit Deadlift 115 kg x 3 bis Deadlift 120 kg x 3, darunter eine Liste Personal bests."
        caption="Dasselbe Log in Pinto Notes: eine Zeile pro Training, und deine Bestwerte bleiben aktuell. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz pro Woche</h2>
      <p>
        Eine Woche mit Push, Pull und Beinen als Beispiel. Ändere den Plan und die Übungen auf deine, dann die Gewichte. Lass in jeder Zeile
        ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Trainingsplan für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Leg auf einem Mac mit macOS 27 eine neue Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die Zeile mit # wird zum Titel, jede
        Zeile mit ## zu einer Überschrift, und die Sätze werden zu Checklisten. Ein normales Command-V lässt die Zeichen als Text stehen. Auf
        dem iPhone tippst du die Zeilen, markierst die Sätze und tippst auf die Checklisten-Taste. Leg die Notiz in einen Ordner Gesundheit
        und pinne sie an, dann siehst du sie als Erstes, wenn du Notizen im Studio öffnest.
      </p>

      <h2 id="im-studio">Im Studio</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Ablage", "Notiz duplizieren"] },
        { on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] },
      ]} />
      <ul>
        <li>
          <strong>Hake jeden Satz ab, sobald er fertig ist.</strong> Waren Gewicht oder Wiederholungen anders, ändere die Zeile sofort:
          „Kniebeugen 3 x 5 mit 102,5 kg“. Diese geänderte Zeile ist dein Log.
        </li>
        <li>
          <strong>Schreib auf, wie es sich angefühlt hat.</strong> Ein Wort hinter der Zeile, etwa „leicht“ oder „letzte Wiederholung
          langsam“, sagt dir nächste Woche, ob du Gewicht drauflegen kannst.
        </li>
        <li>
          <strong>Die nächste Woche aus dieser.</strong> Wähle am Sonntag Ablage, Notiz duplizieren, ändere Datum und Gewichte, klicke in
          jeden Tag und wähle Format, Mehr, Alles deaktivieren.
        </li>
        <li>
          <strong>Ein neuer Bestwert kommt nach unten.</strong> Schlägt ein Satz eine Zeile unter Bestwerte, ändere diese Zeile und ihr Datum.
        </li>
      </ul>
      <p>
        Willst du die Wochen lieber in einem Raster sehen, legt Format, Tabelle eines an.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt, wie, und was Tabellen nicht können.
        Für Gewohnheiten statt Sätzen gibt es einen <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker in Apple
        Notizen</a>, und mehr Notizen zum Einfügen wie diese stehen in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes
        templates</a> (auf Englisch).
      </p>

      <p>
        Willst du neben dem Training auch festhalten, wie sich jeder Tag angefühlt hat, gibt es einen{" "}
        <a href="/de/blog/stimmungstracker-apple-notizen">Stimmungstracker in Apple Notizen</a> mit Energie und Schlaf.
      </p>

      <h2 id="grenzen">Wo ein Trainingstagebuch in Notizen aufhört</h2>
      <ul>
        <li><strong>Jede Woche ist eine eigene Notiz.</strong> Um zu sehen, wie dein Bankdrücken diesen Monat lief, öffnest du vier Notizen und liest sie nebeneinander.</li>
        <li><strong>Bestwerte von Hand.</strong> Notizen merkt nicht, dass 120 kg die 115 kg schlagen. Du prüfst die Liste und änderst sie selbst, oder eben nicht.</li>
        <li><strong>Tabellen zählen nicht.</strong> Eine Tabelle in Notizen kann weder nach Übung sortieren noch das Volumen einer Woche addieren.</li>
        <li><strong>Keine Antworten.</strong> „Was habe ich letzten Mittwoch gemacht?“ heißt scrollen.</li>
      </ul>
      <p>
        Für eine Woche ist eine Notiz das schnellste Log, das es gibt. Über Monate bleibt der nützliche Teil, nämlich zu sehen, dass du stärker
        wirst, an dir hängen.
      </p>

      <h2 id="pinto-notes">Ein Trainingstagebuch, das deine Bestwerte führt</h2>
      <p>
        Dafür gibt es Pinto Notes. Es sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem
        Chat, den du schon nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/workout-log">Trainingstagebuch</a>{" "}
        ist eine Notiz für dein ganzes Training: eine Tabelle mit einer Zeile pro Training, mit Datum, Workout, Übung, Ergebnis und wie
        anstrengend es war, von 1 bis 10, und darunter deine Bestwerte.
      </p>
      <p>
        Sag deiner KI nach dem Training, was du gemacht hast: „Kreuzheben, 120 für drei, hat sich wie eine Neun angefühlt“. Sie fügt die Zeile
        hinzu und ändert, wenn es ein neuer Bestwert ist, auch diese Zeile. Frag dann „Werde ich beim Bankdrücken stärker?“ oder „Was habe ich
        letzten Mittwoch gemacht?“, und sie antwortet aus dem ganzen Log. Du kannst jede Zeile weiterhin selbst hinzufügen und bearbeiten, und
        jede frühere Version der Notiz bleibt erhalten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a>{" "}
        (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Deine Apple Notizen kommen mit <a href="/blog/import-your-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch)
        mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
