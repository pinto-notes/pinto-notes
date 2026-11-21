import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "wochenplaner-vorlage-apple-notizen");

// German version of /blog/apple-notes-planner-template (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "wochenplaner vorlage" (pdf, kostenlos, goodnotes, zum ausdrucken), "tagesplaner vorlage", "wochenplan
// notizen" (apple notizen wochenplan); "apple notizen planer" and "wochenplaner apple notizen" return no suggestions, so
// the title leads with Wochenplaner and Vorlage, the words people type. Apple's own German words, read 21 Nov 2026, from
// the Mac guide (macOS 27) support.apple.com/de-de/guide/notes/apd93c815aa0 (Markierte Einträge automatisch sortieren;
// Format, Mehr, Alles deaktivieren), apd58edc7964 (intelligente Ordner), apde615d29c2 (Bearbeiten, Link hinzufügen,
// Command-K) and apdb54e469b6 (anpinnen); the iPhone guide (iOS 27) de-de/guide/iphone/ipha61270292 („Notiz anpinnen“).
// Bearbeiten, Als Markdown einsetzen, Ablage, Notiz duplizieren and Ablage, Notiz anpinnen are Notes' de strings
// (MainMenu.loctable, macOS 27.2), and the Smart Folder rule Checklisten, Nicht markiert is SmartFolderChecklistsFilterView
// there, as in the other German posts. Facts are the English post's; the picture is its English one, described in
// German. The Pinto template stays /templates/weekly-planner (the app is in English). Links go to the German habit
// tracker and meal plan posts and to English posts where no German one exists.

const ui = UI.de;

const WEEKLY = `# Woche ab 16. November

## Top 3 diese Woche
- [ ] Budget für Q4 an Jonas schicken
- [ ] Flüge für Weihnachten nach Hause buchen
- [ ] Dreimal laufen gehen

## Montag
- [ ] Teammeeting um 9:00
- [ ] Budgetentwurf fertig machen

## Dienstag
- [ ] Zahnarzt um 8:30
- [ ] 5 km laufen

## Mittwoch
- [ ] Mama anrufen
- [ ] Paket zurückschicken

## Donnerstag
- [ ] Inspektion fürs Auto buchen
- [ ] Abendessen mit Sara um 19:00

## Freitag
- [ ] Sachen von der Reinigung abholen

## Samstag
- [ ] Wochenmarkt

## Sonntag
- [ ] Nächste Woche planen

## Später
- [ ] Reisepass verlängern
- [ ] Fahrradlicht reparieren
`;

const DAILY = `# Heute

## Top 3
- [ ] Budgetentwurf fertig machen
- [ ] Mama anrufen
- [ ] 5 km laufen

## Vormittag
- [ ] Teammeeting um 9:00
- [ ] Mail von Jonas beantworten

## Nachmittag
- [ ] Emmas Folien durchsehen
- [ ] Sachen von der Reinigung abholen

## Abend
- [ ] Abendessen mit Sara um 19:00

## Morgen
- [ ] Alles, was heute liegen geblieben ist
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für einen Planer?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz pro Woche mit einer Überschrift für jeden Tag und den Aufgaben des Tages als Checkliste funktioniert als Planer, und du kannst die Vorlage auf dieser Seite direkt einfügen.",
  ] },
  { q: "Wie nutze ich Apple Notizen als Planer?", a: [
    "Führ eine Notiz pro Woche in einem Ordner Planer und pinne die Notiz dieser Woche oben an. Schreib deine Top 3 nach oben, jede Aufgabe unter ihren Tag und alles ohne Tag unter Später. Dupliziere die Notiz am Sonntag für die nächste Woche und verschieb, was übrig ist.",
  ] },
  { q: "Kann ich in Notizen auf dem iPhone einen Tagesplaner anlegen?", a: [
    "Ja. Tippe die Überschriften und Aufgaben, markier die Aufgaben und tippe auf die Checklisten-Taste. Als Markdown einsetzen gibt es auf dem Mac, also geht es am schnellsten, wenn du die Vorlage auf einem Mac einfügst und die Notiz auf dein iPhone synchronisieren lässt.",
  ] },
  { q: "Gibt es eine Planer-App, die wie Apple Notizen funktioniert?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für einen Wochenplaner. Sag ChatGPT oder Claude, was diese Woche ansteht, und es setzt jede Aufgabe unter ihren Tag und hält deine Top 3 aktuell.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="wochenplaner-vorlage-apple-notizen"
      intro={<>
        Viele planen ihre Woche in Apple Notizen: eine Liste pro Tag, ein paar Dinge, die am meisten zählen, und ein Stapel für irgendwann.
        Das funktioniert gut, sobald jede Woche gleich aussieht. Hier ist eine Vorlage für einen Wochenplaner in Apple Notizen zum Einfügen,
        eine Version für den Tag, wie du eine Woche damit führst und wo es aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#wochenplaner", label: "Der Wochenplaner" },
          { href: "#tagesplaner", label: "Ein Tagesplaner" },
          { href: "#so-gehts", label: "Notizen als Planer nutzen" },
          { href: "#grenzen", label: "Wo es aufhört" },
          { href: "#pinto-notes", label: "Eine Woche, für dich geplant" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für einen Planer, aber eine Notiz pro Woche erledigt das: deine Top 3 oben, eine Überschrift für
            jeden Tag mit seinen Aufgaben als Checkliste und eine Liste Später für den Rest. Füg die Wochenvorlage unten in eine neue Notiz
            ein, oder die für den Tag, wenn du Tag für Tag planst.
          </p>
          <PostCta template="weekly-planner" slug="de/wochenplaner-vorlage-apple-notizen" path="/de/blog/wochenplaner-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du die Woche für dich planen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat einen kostenlosen Wochenplaner. Sag ChatGPT oder Claude, was ansteht, und es setzt jede Aufgabe unter ihren Tag und hält deine Top 3 aktuell.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="Eine Notiz Weekly planner in Pinto Notes auf dem Mac: eine Checkliste Top three this week mit einem abgehakten Eintrag, eine Überschrift für jeden Tag von Montag bis Sonntag mit den Aufgaben des Tages als Checkliste, die Tage bis Freitag abgehakt, und eine Liste Later."
        caption="Eine Woche in Pinto Notes, geplant mit der Vorlage für den Wochenplaner. Derselbe Aufbau funktioniert in Apple Notizen. Beispieldaten, die App ist auf Englisch." />}
      faq={FAQ}
    >
      <h2 id="wochenplaner">Die Vorlage für den Wochenplaner</h2>
      <p>
        Eine Notiz hält die ganze Woche. Die Top 3 stehen zuerst, damit du sie als Erstes siehst, wenn du die Notiz öffnest. Jeder Tag bekommt
        eine Überschrift und eine eigene Checkliste, und unter Später steht, was noch keinen Tag hat, damit es nicht den Montag verstopft.
        Setz deine eigenen Aufgaben ein, bevor du einfügst, und lass in jeder Zeile ein Wort stehen, denn ein leerer Eintrag in der
        Checkliste übersteht das Einfügen nicht.
      </p>
      <Keep title="Wochenplaner für Apple Notizen" text={WEEKLY} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus den Aufgaben eine Checkliste. Ein einfaches Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du
        es ein, markierst die Aufgaben und tippst auf die Checklisten-Taste.
      </p>

      <h2 id="tagesplaner">Eine Version als Tagesplaner</h2>
      <p>
        Planst du einen Tag nach dem anderen, führ eine einzige Notiz namens Heute und pinne sie oben in ihrem Ordner an. Wieder kommen die Top
        3 zuerst, dann der Tag in drei Teilen und eine Liste Morgen für das, was liegen geblieben ist.
      </p>
      <Keep title="Tagesplaner für Apple Notizen" text={DAILY} copyLabel={ui.copy} />
      <p>
        Lösch jeden Morgen, was du gestern abgehakt hast, zieh die Zeilen unter Morgen in den Tag hoch und such dir neue Top 3 aus. Wiederholen
        sich manche Zeilen jeden Tag, wie Laufen oder das Postfach, klick in die Checkliste und wähle Format, Mehr, Alles deaktivieren, statt
        sie neu zu tippen.
      </p>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] }]} />

      <h2 id="so-gehts">So nutzt du Apple Notizen als Planer</h2>
      <ul>
        <li>
          <strong>Eine Notiz pro Woche.</strong> Bewahr sie in einem Ordner Planer auf und pinne die Notiz dieser Woche oben an, dann ist sie
          auf deinem iPhone einen Tipp entfernt (auf dem iPhone legst du den Finger auf die Notiz und tippst auf „Notiz anpinnen“).
        </li>
        <li>
          <strong>Fang die nächste Woche mit dieser an.</strong> Wähle am Sonntag Ablage, Notiz duplizieren, ändere das Datum im Titel, lösch,
          was abgehakt ist, und verschieb den Rest unter Montag.
        </li>
        <li>
          <strong>Lass Erledigtes nach unten rutschen.</strong> Aktiviere in den Einstellungen von Notizen „Markierte Einträge automatisch
          sortieren“, dann wandern abgehakte Aufgaben an das Ende jedes Tages.
        </li>
        <li>
          <strong>Finde, was noch offen ist.</strong> Ein intelligenter Ordner mit der Regel Checklisten, Nicht markiert zeigt jede Notiz, in
          der noch eine Aufgabe offen ist, über alle deine Ordner hinweg (mehr in <a href="/blog/apple-notes-tags-smart-folders"
          hrefLang="en">Apple Notes tags and Smart Folders</a>, auf Englisch).
        </li>
        <li>
          <strong>Verlinke die größeren Dinge.</strong> Markier eine Aufgabe, wähle Bearbeiten, Link hinzufügen (Command-K) und such die
          Notiz aus, zu der sie gehört, etwa das Protokoll für das Meeting am Montag.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Ablage", "Notiz duplizieren"] },
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"], keys: "⌘K" },
      ]} />
      <p>
        Derselbe Aufbau mit einer Notiz pro Woche funktioniert auch für andere Routinen. Der{" "}
        <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker für Apple Notizen</a> hakt Gewohnheiten Tag für Tag ab, der{" "}
        <a href="/de/blog/essensplan-vorlage-apple-notizen">Essensplan</a> plant die Abendessen der Woche, und{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch) hat weitere Notizen zum Einfügen.
      </p>

      <h2 id="grenzen">Wo ein Planer in Notizen aufhört</h2>
      <ul>
        <li><strong>Nichts bewegt sich von selbst.</strong> Eine Aufgabe, zu der du am Mittwoch nicht gekommen bist, bleibt am Mittwoch, bis du sie ausschneidest und unter heute einfügst.</li>
        <li><strong>Eine neue Woche machst du von Hand.</strong> Notiz duplizieren, Datum ändern, Erledigtes löschen, den Rest verschieben. Lässt du das einmal aus, läuft die Woche in der Notiz der letzten weiter.</li>
        <li><strong>Das Planen bleibt bei dir.</strong> Eine Liste mit zwanzig Dingen verteilt sich nicht von selbst auf die Tage, und die Top 3 suchen sich nicht selbst aus.</li>
        <li><strong>Die Suche findet Wörter, keine Antworten.</strong> Sie findet den Zahnarzt. Sie kann dir nicht sagen, was diese Woche noch offen ist oder was ständig verschoben wird.</li>
      </ul>
      <p>
        Für eine ruhige Woche reichen eine Notiz und ein paar Minuten am Sonntag. In einer vollen Woche ist das Verschieben und Sortieren die
        eigentliche Arbeit, und die bleibt an dir hängen.
      </p>

      <h2 id="pinto-notes">Eine Woche, für dich geplant</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du
        schon nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/weekly-planner">Weekly planner</a> ist eine
        Notiz mit Top three this week, einer Überschrift für jeden Tag von Montag bis Sonntag und Later. Die App ist auf Englisch.
      </p>
      <p>
        Sag deiner KI in einer Nachricht, was diese Woche ansteht. Sie setzt jede Aufgabe als Checkliste unter ihren Tag, legt ab, was keinen
        Tag hat, unter Later, und hält die Top 3 bei den drei Dingen, die dir am wichtigsten sind. Bitte sie, „verschieb, was ich nicht
        geschafft habe, auf heute“, und die offenen Aufgaben der letzten Tage kommen mit. Sag ihr am Sonntag, dass eine neue Woche anfängt:
        Sie räumt ab, was abgehakt ist, verschiebt den Rest auf Montag und fragt nach den Top 3 der nächsten Woche. Du kannst weiterhin alles
        selbst tippen und abhaken, und jede frühere Version einer Notiz bleibt erhalten. Der KI-Teil funktioniert, sobald ChatGPT oder Claude
        verbunden ist, und <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine
        Minute.
      </p>
      <p>
        Die Pläne, die du schon in Apple Notizen führst, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) herüber, und Apple Notizen bleibt, wie es war.
      </p>
    </LocalPostPage>
  );
}
