import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "wochenrueckblick-vorlage-apple-notizen");

// German version of /blog/apple-notes-weekly-review-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "wochenrückblick vorlage" (kita, schule), "wochenreflexion vorlage" (pdf), "weekly review"
// (gtd, template, journal, notion); "wochenreview vorlage" and "wochenreview" have no suggestions, and "wochenrückblick"
// alone is mostly news reviews, so the slug pairs it with vorlage. Apple's own German words, read 21 Nov 2026, from the
// Mac guide support.apple.com/de-de/guide/notes/apd93c815aa0/mac (Markierte Einträge automatisch sortieren),
// de-de/guide/notes/apdb54e469b6/mac (anpinnen) and de-de/guide/notes/apdc88ed7f1d/mac (Tags with # in the Seitenleiste).
// Bearbeiten, Als Markdown einsetzen is in Notes' de strings (MainMenu.loctable) on macOS 27.2. The Pinto template keeps
// its English name, Weekly review, as the app shows it. Facts are the English post's; the picture is its English one,
// described in German. Links go to the German habit tracker and journal posts and to English posts where no German one
// exists.

const ui = UI.de;

const TEMPLATE = `# Wochenrückblick

Zwanzig Minuten am Sonntag. Die neueste Woche zuerst.

## Fragen
1. Was lief diese Woche gut?
2. Was nicht, und warum?
3. Was habe ich gelernt?
4. Wofür bin ich dankbar?
5. Was sind meine drei wichtigsten Dinge für nächste Woche?

## Woche vom 2. November
- Lief gut: den Bericht einen Tag früher abgegeben; viermal trainiert.
- Lief nicht: am Donnerstag keine konzentrierte Arbeit, zu viele Meetings.
- Gelernt: eine Agenda für 30 Minuten schlägt ein Meeting von 60 Minuten.
- Dankbar für: das Abendessen mit meiner Schwester.
- [ ] Donnerstagvormittage für konzentrierte Arbeit blocken
- [ ] Den Plan für Q4 an Jonas schicken
- [ ] Zahnarzttermin machen
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für den Wochenrückblick?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz mit deinen Fragen oben und einer Überschrift für jede Woche darunter funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Welche Fragen gehören in einen Wochenrückblick?", a: [
    "Fünf reichen: was gut lief, was nicht und warum, was du gelernt hast, wofür du dankbar bist und deine drei wichtigsten Dinge für nächste Woche. Die letzte ist der Teil, den du am Montag brauchst.",
  ] },
  { q: "Eine Notiz pro Woche oder eine Notiz für alle Wochen?", a: [
    "Eine Notiz für alle Wochen, die neueste oben. Die drei Dinge der letzten Woche stehen direkt unter denen dieser Woche, und die Suche findet ein Wort in allen.",
  ] },
  { q: "Gibt es einen Wochenrückblick, der mir die Fragen stellt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für den Wochenrückblick. Sag ChatGPT oder Claude, dass es Zeit für deinen Rückblick ist, und es stellt dir die fünf Fragen nacheinander und schreibt die Woche dann in deine Notiz.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="wochenrueckblick-vorlage-apple-notizen"
      intro={<>
        Ein Wochenrückblick sind zwanzig Minuten am Sonntag, die dir einen planlosen Montag ersparen. Er funktioniert nur, wenn die Fragen
        jede Woche dieselben sind, also gehören sie in eine Notiz, die du behältst. Hier ist eine Vorlage für den Wochenrückblick in Apple
        Notizen, wie daraus eine Gewohnheit wird und wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#sonntag", label: "Am Sonntag" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Rückblick, der fragt" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für den Wochenrückblick, aber eine Notiz erledigt das: fünf Fragen oben, dann eine Überschrift für
            jede Woche mit deinen Antworten als kurze Zeilen und den drei wichtigsten Dingen für nächste Woche als Checkliste. Schreib die
            neueste Woche oben hin, dann steht der Plan der letzten Woche direkt darunter.
          </p>
          <PostCta template="weekly-review" slug="de/wochenrueckblick-vorlage-apple-notizen" path="/de/blog/wochenrueckblick-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du dir die Fragen stellen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für den Wochenrückblick. ChatGPT oder Claude stellt dir die fünf Fragen und schreibt die Woche dann in deine Notiz.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-review-note" width={1520} height={989} maxWidth={600}
        alt="Eine Notiz Weekly review in Pinto Notes auf dem Mac: fünf nummerierte Fragen, dann ein Rückblick Week of 2 November mit dem, was gut lief, was nicht, was gelernt wurde, und einem Dank, und eine Checkliste der drei wichtigsten Dinge, in der Book the dentist abgehakt ist."
        caption="Ein Wochenrückblick in Pinto Notes, so wie die Vorlage ihn aufschreibt. Dasselbe Layout funktioniert in Apple Notizen, mit einer Überschrift für jede Woche. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: fünf Fragen, eine Notiz</h2>
      <p>
        Die Fragen stehen oben, damit du sie dir nie merken musst. Jede Woche bekommt eine Überschrift mit dem Datum des Montags, eine
        Zeile pro Antwort und die drei wichtigsten Dinge als Checkliste, die du im Lauf der Woche abhakst. Lass in jeder Zeile ein Wort
        stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Wochenrückblick für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <ul>
        <li>
          <strong>Einmal einfügen.</strong> Leg auf einem Mac mit macOS 27 eine Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die
          Zeile mit # wird zum Titel, jede Zeile mit ## zu einer Überschrift und die drei wichtigsten Dinge zu einer Checkliste. Ein
          normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du sie ab, markierst die drei Dinge und tippst auf
          die Checklisten-Taste.
        </li>
        <li>
          <strong>Die Beispielwoche als Anleitung behalten.</strong> Lass sie für deinen ersten Sonntag stehen und ersetze sie dann durch
          deine eigene.
        </li>
        <li>
          <strong>Anpinnen.</strong> Pinne die Notiz oben in ihrem Ordner an, dann ist sie da, wenn du am Sonntag Notizen öffnest.
        </li>
      </ul>

      <h2 id="sonntag">Am Sonntag</h2>
      <ul>
        <li>
          <strong>Fang mit den drei Dingen der letzten Woche an.</strong> Hake ab, was erledigt ist, bevor du etwas Neues schreibst. Was
          noch offen ist, kommt entweder unter die drei Dinge der nächsten Woche oder fällt bewusst weg.
        </li>
        <li>
          <strong>Die neue Woche oben anfügen.</strong> Kopiere den Block der letzten Woche, füg ihn unter den Fragen ein und ändere das
          Datum und die Zeilen. Ein paar Wörter pro Antwort reichen, solange du sie in einem Monat noch verstehst.
        </li>
        <li>
          <strong>Drei, nicht zehn.</strong> Drei Dinge, über die du dich freust, wenn sie bis Freitag erledigt sind. Ist Markierte
          Einträge automatisch sortieren aktiviert, rutscht, was abgehakt ist, ans Ende der Liste.
        </li>
        <li>
          <strong>Einmal im Monat zurückschauen.</strong> Die Suche liest jedes Wort, also zeigt eine Suche nach „Meetings“, wie oft sie
          das Problem waren. Mit einem Tag wie #rückblick in der Notiz ist sie in der Seitenleiste nur einen Klick entfernt.
        </li>
      </ul>
      <p>
        Einen kürzeren Wochenrückblick nach derselben Idee findest du unter den Notizen in <a href="/blog/apple-notes-templates"
        hrefLang="en">Apple Notes templates</a> (auf Englisch). Was du zwischen den Rückblicken jeden Tag tust, hält der{" "}
        <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker in Apple Notizen</a> daneben fest, und das{" "}
        <a href="/de/blog/tagebuch-apple-notizen">Tagebuch in Apple Notizen</a> ist für die Tage selbst.
      </p>

      <h2 id="grenzen">Wo ein Wochenrückblick in Notizen aufhört</h2>
      <ul>
        <li><strong>Die Fragen stellen sich nicht selbst.</strong> An einem müden Sonntag ist eine Liste mit Fragen schnell übersprungen.</li>
        <li><strong>Übertragen geht von Hand.</strong> Was letzte Woche nicht abgehakt wurde, bleibt, wo es ist, bis du es nach oben kopierst.</li>
        <li><strong>Muster heißt zurücklesen.</strong> Die Suche findet ein Wort. Sie sagt dir nicht, was in zwei Monaten Rückblicken immer wieder auftaucht.</li>
      </ul>
      <p>
        Wenn die Gewohnheit schon sitzt, ist die Notiz alles, was du brauchst. Wenn sie in vollen Wochen wegrutscht, fehlt das Fragen.
      </p>

      <h2 id="pinto-notes">Ein Wochenrückblick, der dich fragt</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/weekly-review">Weekly review</a> ist eine Notiz mit
        den fünf Fragen und einem Abschnitt Reviews, die neueste Woche zuerst.
      </p>
      <p>
        Sag deiner KI, dass es Zeit für deinen Wochenrückblick ist. Sie stellt die fünf Fragen nacheinander und fügt die Woche dann oben
        unter Reviews ein: eine Überschrift Week of mit dem Datum des Montags, deine Antworten als kurze Zeilen in deinen eigenen Worten und
        deine drei wichtigsten Dinge als Checkliste. Sag ihr, dass eins erledigt ist, und sie hakt es ab. Frag „Worauf wollte ich mich
        letzte Woche konzentrieren?“ oder „Was taucht in meinen Rückblicken immer wieder auf?“, und sie liest die Notiz zurück, um zu
        antworten. Du kannst weiterhin alles selbst schreiben und abhaken, und jede frühere Version der Notiz bleibt erhalten. Dieser Teil
        funktioniert, sobald ChatGPT oder Claude verbunden ist. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT
        verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Notizen, die du schon in Apple Notizen führst, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
