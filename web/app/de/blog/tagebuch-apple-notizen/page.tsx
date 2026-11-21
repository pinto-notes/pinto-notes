import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "tagebuch-apple-notizen");

// German version of /blog/apple-notes-journal-template (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "tagebuch apple notizen" (tagebuch mit apple notizen), "tagebuch notizen app", "tagebuch iphone"
// (kostenlos, app, schreiben, digitales tagebuch iphone), "tagebuch vorlage" (zum ausdrucken, pdf, word, goodnotes),
// "journal vorlage"; German searchers say Tagebuch far more than Journal. Apple's own German words, read 21 Nov 2026,
// from the Mac guide support.apple.com/de-de/guide/notes/apdb54e469b6/mac (anpinnen), de-de/guide/notes/apdc88ed7f1d/mac
// (Tags with #) and de-de/guide/notes/apd58edc7964/mac (intelligente Ordner), and the pages the German password post
// cites for gesperrte Notizen (de-de/guide/notes/apdb021fd5a9/mac). Bearbeiten, Als Markdown einsetzen, Ablage, Notiz
// duplizieren and Notiz sperren are Notes' de strings (MainMenu.loctable) on macOS 27.2, and the Smart Folder rule Tags
// is SmartFolderFilterRow there. Return is the Zeilenschalter, as Apple's German Mac guide de-de/guide/notes/apda85974595/mac
// calls it. The Pinto template keeps its English name, Daily journal, as the app shows it. Facts are the English post's; the picture is its English
// one, described in German. Links go to the German mood tracker and habit tracker posts and to English posts where no
// German one exists.

const ui = UI.de;

const TEMPLATE = `# Tagebuch

Ein paar Zeilen am Tag, der neueste Tag zuerst.

## Fragen
1. Was ist heute passiert?
2. Was hat Energie gekostet, und was hat sie zurückgegeben?
3. Was will ich mir merken?
4. Was ist eine Sache für morgen?

## Sonntag, 8. November
- Heute: ruhiger Tag; das Bücherregal fertig gebaut und lange spazieren gewesen.
- Energie: nach dem Mittagessen wenig, besser nach dem Kaffee mit Jonas.
- Merken: die Bäckerei an der Ecke macht um sieben auf.
- Morgen: Mama anrufen.

## Samstag, 7. November
- Heute: Maja beim Umzug geholfen; ging schneller als befürchtet.
- Energie: die Treppen haben sie gekostet, die Pizza danach hat sie zurückgegeben.
- Merken: Maja sagt, die neue Wohnung hat abends Sonne.
- Morgen: dem Vermieter bis mittags antworten.
`;

const PROMPTS = `Mit wem habe ich heute gesprochen?
Was hat mich überrascht?
Was würde ich anders machen?
Worauf freue ich mich?
Was habe ich aufgeschoben, und warum?
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Tagebuch-Vorlage?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz mit ein paar Fragen oben und einer Überschrift für jeden Tag funktioniert als Tagebuch, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Eine Notiz pro Tag oder eine Notiz für das ganze Tagebuch?", a: [
    "Eine Notiz ist leichter durchzuhalten: Sie ist immer am selben Ort, und die letzten Tage stehen direkt unter den Fragen. Wird sie lang, fang für den nächsten Monat eine neue Notiz an.",
  ] },
  { q: "Kann ich mein Tagebuch in Apple Notizen sperren?", a: [
    "Ja. Apple Notizen kann eine Notiz sperren, und eine gesperrte Notiz öffnet sich mit einem Passwort oder Face ID oder Touch ID. Sperr die Tagebuch-Notiz selbst, dann ist jeder Tag darin mit gesperrt.",
  ] },
  { q: "Wie finde ich einen alten Tagebucheintrag?", a: [
    "Die Suche liest jedes Wort in jeder Notiz, also such nach einem Namen, einem Ort oder einem Wort, von dem du weißt, dass du es geschrieben hast. Mit einem Tag wie #reise an den Tagen, die zählen, sammelt ein intelligenter Ordner diese Notizen.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="tagebuch-apple-notizen"
      intro={<>
        Die meisten Tagebücher enden an der leeren Seite. Ein paar feste Fragen bringen dich darüber hinweg, und Apple Notizen ist am Ende
        des Tages sowieso auf deinem Telefon. Hier ist eine Tagebuch-Vorlage für Apple Notizen zum Einfügen, wie du dranbleibst, wie du alte
        Tage wiederfindest und wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#jeden-tag", label: "Jeden Tag" },
          { href: "#fragen", label: "Wenn du feststeckst" },
          { href: "#alte-tage", label: "Alte Tage finden" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Tagebuch, das fragt" },
        ]}>
          <p>
            Apple Notizen hat keine Tagebuch-Vorlage, aber eine Notiz erledigt das: vier kurze Fragen oben, dann eine Überschrift für jeden
            Tag, der neueste Tag zuerst. Beantworte die Fragen mit je einer Zeile, und die letzten Tage sind immer gleich da, wenn du die
            Notiz öffnest.
          </p>
          <PostCta template="daily-journal" slug="de/tagebuch-apple-notizen" path="/de/blog/tagebuch-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du den Eintrag für dich schreiben lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat ein kostenloses Tagebuch. Erzähl ChatGPT oder Claude von deinem Tag, und es schreibt den Eintrag in deinen Worten, der neueste Tag zuerst.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-journal-note" width={1520} height={1093} maxWidth={600}
        alt="Eine Notiz Daily journal in Pinto Notes auf dem Mac: vier nummerierte Fragen, dann Einträge für Sonntag, 8. November, und Samstag, 7. November, der neueste zuerst, jeder mit den Zeilen Today, Energy, Remember und Tomorrow."
        caption="Ein Tagebuch in Pinto Notes, der neueste Tag zuerst. Dasselbe Layout funktioniert in Apple Notizen." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz, der neueste Tag zuerst</h2>
      <p>
        Die Fragen stehen oben, damit du nie vor einer leeren Seite sitzt. Jeder Tag bekommt eine Überschrift mit Wochentag und Datum, und
        die Antworten stehen darunter, je eine kurze Zeile. Der neueste Tag kommt direkt unter die Fragen, so liest du heute und gestern,
        ohne zu scrollen. Zwei Beispieltage sind ausgefüllt. Ersetze sie durch deine.
      </p>
      <Keep title="Tagebuch für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel und aus jeder Zeile mit ## eine
        Überschrift. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du die Fragen einmal ab und fügst dann
        jeden Tag von Hand hinzu.
      </p>
      <p>
        Planst du deinen Tag auch am Morgen, ist der Daily plan in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes
        templates</a> (auf Englisch) die andere Hälfte: drei Dinge für heute und was du tust, wenn Zeit bleibt. Führ ihn in einer eigenen
        Notiz, dann bleibt das Tagebuch ein Protokoll dessen, was passiert ist.
      </p>

      <h2 id="jeden-tag">Jeden Tag</h2>
      <ul>
        <li>
          <strong>Pinne die Notiz an.</strong> Oben in ihrem Ordner angepinnt, ist sie das Erste, was du siehst, wenn du Notizen im Bett
          öffnest.
        </li>
        <li>
          <strong>Den Tag oben anfügen.</strong> Klicke ans Ende der letzten Frage, drück den Zeilenschalter und tipp die neue Überschrift.
          Der Tag davor rutscht darunter.
        </li>
        <li>
          <strong>Eine Zeile reicht.</strong> Überspring eine Frage, wenn es nichts zu sagen gibt. Ein Tagebuch, das du ein Jahr lang mit
          zwei Zeilen am Tag führst, schlägt eins, das du eine Woche lang mit zwei Seiten führst.
        </li>
        <li>
          <strong>Schreib in deinen eigenen Worten.</strong> „Die Treppen haben sie gekostet, die Pizza danach hat sie zurückgegeben“
          bedeutet dir in einem Jahr mehr als „müde“.
        </li>
        <li>
          <strong>Fang jeden Monat eine neue Notiz an.</strong> Wird die Notiz lang, wähle Ablage, Notiz duplizieren, benenne die Kopie
          nach dem neuen Monat und lösch die alten Tage daraus. Die Fragen kommen mit.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Ablage", "Notiz duplizieren"] }]} />

      <h2 id="fragen">Wenn die vier Fragen nicht passen</h2>
      <p>
        Die vier Fragen decken die meisten Tage ab. An den Tagen, an denen sie nicht passen, tausch eine gegen eine Frage aus dieser Liste,
        oder bewahre die Liste unten in der Notiz auf, um daraus zu wählen.
      </p>
      <Keep title="Fragen für zwischendurch" text={PROMPTS} copyLabel={ui.copy} />
      <p>
        Willst du festhalten, wie du dich fühlst, in Zahlen und in Worten, ist der{" "}
        <a href="/de/blog/stimmungstracker-apple-notizen">Stimmungstracker in Apple Notizen</a> eine Tabelle mit einer Zeile für jeden
        Abend. Für Gewohnheiten, die du abhakst, gibt es den <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker in Apple
        Notizen</a>.
      </p>

      <h2 id="alte-tage">Alte Tage finden</h2>
      <ul>
        <li>
          <strong>Such nach einem Wort.</strong> Die Suche in Notizen liest jedes Wort in jeder Notiz, also findet „Bäckerei“ oder der Name
          einer Freundin den Tag, an dem du es geschrieben hast.
        </li>
        <li>
          <strong>Gib wichtigen Tagen Tags.</strong> Tipp #reise oder #familie in die Zeile, und Notizen macht daraus ein Tag. Ein intelligenter Ordner
          mit einer Regel Tags sammelt dann jede Notiz, die es hat. <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and
          Smart Folders</a> (auf Englisch) erklärt, wie sie funktionieren und was du prüfst, wenn nicht.
        </li>
      </ul>
      <p>
        Ein Tagebuch ist privat. Du kannst die Notiz mit einem Passwort oder Face ID oder Touch ID sperren, dann öffnet sie sich nicht für den, der dein
        Telefon in die Hand nimmt.
      </p>

      <h2 id="grenzen">Wo ein Tagebuch in Notizen aufhört</h2>
      <ul>
        <li><strong>Die leere Zeile füllst immer noch du.</strong> Die Fragen helfen, aber an einem müden Abend stellt sie dir niemand.</li>
        <li><strong>Jeder Tag wird getippt.</strong> Erzählst du deinen Tag lieber, muss er hinterher aufgeschrieben werden.</li>
        <li><strong>Die Suche findet Wörter, keine Themen.</strong> Sie findet „Vermieter“. Sie sagt dir nicht, was dich die letzten drei Wochen beschäftigt hat.</li>
      </ul>
      <p>
        Für viele Menschen sind eine Notiz und vier Fragen das ganze Tagebuch, und das reicht. Was sie nicht kann, ist für dich
        zurückzuschauen.
      </p>

      <h2 id="pinto-notes">Ein Tagebuch, das die Fragen stellt</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/daily-journal">Daily journal</a> ist eine Notiz mit
        denselben vier Fragen und deinen Einträgen darunter, der neueste Tag zuerst.
      </p>
      <p>
        Sag, dass du Tagebuch schreiben willst, und deine KI stellt die Fragen nacheinander und überspringt jede, die du auslässt. Oder
        erzähl ihr deinen Tag am Stück, etwa „Heute war lang: Majas Umzug ist erledigt, ihre Kisten nicht, und ich liege auf dem Sofa“, und
        sie schreibt den Eintrag, ohne zu fragen. Jeder Tag bekommt eine Überschrift mit Wochentag und Datum und kurze Zeilen in deinen
        eigenen Worten für Today, Energy, Remember und Tomorrow. Ratschläge gibt sie nur, wenn du fragst. Frag später „Was hat mich diese
        Woche beschäftigt?“, und sie antwortet aus deinen Einträgen. Du kannst weiterhin jeden Tag selbst schreiben und bearbeiten, und jede
        frühere Version der Notiz bleibt erhalten. Das funktioniert, sobald ChatGPT oder Claude verbunden ist.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Ein Tagebuch, das du schon in Apple Notizen führst, kommt mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
