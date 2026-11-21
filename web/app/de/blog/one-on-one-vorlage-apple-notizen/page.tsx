import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "one-on-one-vorlage-apple-notizen");

// German version of /blog/apple-notes-1-on-1-template (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "one on one gespräch", "one on one meeting", "1 zu 1 gespräch mit chef", "1 1 gespräche mitarbeiter",
// "1 1 gespräch mit vorgesetzten", "mitarbeitergespräch notizen", "jour fixe vorlage"; "1:1 gespräch vorlage", "1:1
// meeting vorlage" and "one on one vorlage" have no suggestions. The post says 1:1-Gespräch and One-on-One, the words
// German teams use for the regular talk with a manager. It doesn't say Mitarbeitergespräch, which mostly means the
// yearly review, or Jour fixe, which is any standing meeting. Apple's own German words, read 21 Nov 2026, from the Mac
// guide support.apple.com/de-de/guide/notes/apd58edc7964/mac (Neuer intelligenter Ordner, the rules Ordner and
// Checklisten), apd93c815aa0 (Markierte Einträge automatisch sortieren), apdb54e469b6 (anpinnen) and apd4e6e2c9a6
// (teilen, Kann bearbeiten, no locked notes), support.apple.com/de-de/102537 (Notizen sperren, Face ID) and
// de-de/102462 (Apple Account). Bearbeiten, Als Markdown einsetzen and Ablage, Notiz duplizieren are Notes' de strings
// (MainMenu.loctable) on macOS 27.2, and the rule value Nicht markiert is SmartFolderChecklistsFilterView there.
// On-call is Rufbereitschaft in the template. Facts are the English post's; the picture is its English one, described
// in German. Links go to the German meeting notes post and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# 1:1 mit Emma

Jeden zweiten Donnerstag. Themen unter der Woche ergänzen.

## Nächstes Mal
- Feedback zum Design-Review
- Das Konferenzbudget
- Emmas Ziele fürs nächste Quartal

## Offene Punkte
- [ ] Ich: für Emma einen Mentor aus dem Plattform-Team finden
- [ ] Ich: nach einer ruhigeren Rufbereitschaft fragen
- [ ] Emma: Entwurf für den Launch-Plan bis 20. Nov.

## Frühere 1:1s
5. November
- Die Rufbereitschaft war hart: zweimal nachts alarmiert. Sie möchte eine ruhigere Einteilung.
- Will den Launch im Frühjahr leiten. Wirkte müde, aber positiv.
`;

const QUESTIONS = `Feste Fragen
- Was beschäftigt dich diese Woche?
- Was steht dir im Weg?
- Brauchst du etwas von mir?
- Feedback, in beide Richtungen
- Wie läuft es mit deinen Zielen?
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für 1:1-Gespräche?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine fortlaufende Notiz pro Person, mit Überschriften für die nächste Agenda, die offenen Punkte und frühere 1:1s, funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Was gehört auf die Agenda eines 1:1-Gesprächs?", a: [
    "Zuerst ihre Themen, dann deine, dann die offenen Punkte vom letzten Mal. Nimm ein oder zwei feste Fragen dazu, etwa was ihr im Weg steht und ob sie etwas von dir braucht. Schreib Themen unter der Woche auf, wenn sie aufkommen.",
  ] },
  { q: "Eine Notiz pro 1:1 oder eine Notiz pro Person?", a: [
    "Eine pro Person. Die Agenda, die offenen Punkte und jedes frühere 1:1 bleiben zusammen, das neueste zuerst. So liest du die Notizen vom letzten Mal vor dem nächsten Gespräch, ohne sie zu suchen.",
  ] },
  { q: "Gibt es eine App, die meine 1:1-Notizen ausformuliert?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für 1:1-Notizen. Erzähl ChatGPT oder Claude, wie das 1:1 lief, und es schreibt den Abschnitt, trägt ein, was ihr beide zugesagt habt, als Checkliste ein und räumt die besprochenen Themen ab.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="one-on-one-vorlage-apple-notizen"
      intro={<>
        Ein gutes 1:1 entsteht in den zwei Wochen davor, wenn die Themen aufkommen. Hier ist eine Vorlage für One-on-Ones in Apple Notizen
        zum Einfügen: eine fortlaufende Notiz pro Person, mit der nächsten Agenda, den offenen Punkten und jedem früheren 1:1. Dazu, wie du
        sie pflegst und wo Notizen aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#agenda", label: "Die Agenda" },
          { href: "#zwischen-den-gespraechen", label: "Zwischen den 1:1s" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "1:1s, die sich selbst ausformulieren" },
        ]}>
          <p>
            Apple Notizen hat keine 1:1-Vorlage, aber eine Notiz pro Person erledigt das: eine Liste Nächstes Mal, die du unter der Woche
            ergänzt, die offenen Punkte als Checkliste mit einem Namen an jedem und darunter die früheren 1:1s, das neueste zuerst. Lies vor
            jedem Gespräch den oberen Teil und schreib den neuen Abschnitt direkt danach.
          </p>
          <PostCta template="one-on-one-notes" slug="de/one-on-one-vorlage-apple-notizen" path="/de/blog/one-on-one-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du deine 1:1s für dich ausformulieren lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für 1:1-Notizen. Erzähl ChatGPT oder Claude, wie es lief, und es schreibt es auf, trägt die offenen Punkte ein und räumt ab, was ihr besprochen habt.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/one-on-one-notes-note" width={1520} height={1062} maxWidth={600}
        alt="Eine Notiz 1:1 notes in Pinto Notes auf dem Mac: 1:1s mit Emma jeden zweiten Donnerstag, drei Themen unter Next time, vier Follow-ups, eines davon abgehakt, und das 1:1 vom 5. November unter Past 1:1s."
        caption="Eine fortlaufende 1:1-Notiz in Pinto Notes: was du ansprechen willst, was ihr beide zugesagt habt, und frühere 1:1s, das neueste zuerst. Derselbe Aufbau funktioniert in Apple Notizen." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine fortlaufende Notiz pro Person</h2>
      <p>
        Eine Notiz pro Gespräch verstreut die offenen Punkte. Eine Notiz pro Person hält die ganze Geschichte an einem Ort: was du ansprechen
        willst, was ihr beide zugesagt habt und wie die letzten 1:1s liefen. Schreib an jeden offenen Punkt einen Namen, auch „Ich“, damit
        klar ist, wer was schuldet. Lass in jeder Zeile ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="1:1-Notizen für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
        { on: "Mac", steps: ["Ablage", "Notiz duplizieren"] },
      ]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus den offenen Punkten eine Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone
        tippst du sie ab, markierst die offenen Punkte und tippst auf die Checklisten-Taste. Für die nächste Person löschst du die
        Beispielzeilen, bewahrst diese leere Kopie in einem Ordner 1:1s auf und wählst Ablage, Notiz duplizieren.
      </p>

      <h2 id="agenda">Die Agenda: Nächstes Mal</h2>
      <p>
        Nächstes Mal ist die Agenda, geschrieben über zwei Wochen statt zwei Minuten vor dem Call. Ihre Themen kommen zuerst. Es ist mehr ihr
        Gespräch als deins. Ein paar feste Fragen darunter fangen auf, woran keiner von euch beim Aufschreiben gedacht hat.
      </p>
      <Keep title="Feste Fragen" text={QUESTIONS} copyLabel={ui.copy} />
      <p>
        Wollt ihr beide Themen auf die Agenda setzen, teile eine Notiz, die nur Nächstes Mal enthält, und lass die andere Person sie
        bearbeiten. Ihr braucht beide einen Apple Account. Den Rest, auch wie sie gewirkt hat, behältst du in deiner eigenen Notiz.
      </p>

      <h2 id="zwischen-den-gespraechen">Zwischen den 1:1s</h2>
      <ul>
        <li>
          <strong>Pinne sie an.</strong> Pinne die Notiz oben in ihrem Ordner an, dann dauert ein neues Thema auf dem Telefon ein paar
          Sekunden.
        </li>
        <li>
          <strong>Schreib es direkt danach auf.</strong> Setz das Datum als Zeile ganz oben unter Frühere 1:1s, zwei oder drei Punkte dazu,
          worüber ihr gesprochen habt und wie die Person gewirkt hat, und verschieb jede Zusage in die offenen Punkte. Lösch die Themen, die
          ihr besprochen habt.
        </li>
        <li>
          <strong>Abgehakte Punkte nach unten rutschen lassen.</strong> Aktiviere in den Einstellungen von Notizen „Markierte Einträge
          automatisch sortieren“, dann wandert, was erledigt ist, ans Ende der Liste.
        </li>
        <li>
          <strong>Jede offene Zusage sehen.</strong> Leg einen intelligenten Ordner mit zwei Regeln an: Ordner mit deinem Ordner 1:1s und
          Checklisten mit Nicht markiert. Jede Person, der du noch etwas schuldest, steht darin.
        </li>
        <li>
          <strong>Sperr sie, wenn sie privat ist.</strong> Wie jemand gewirkt hat, ist für dich. Eine gesperrte Notiz öffnet sich mit deinem
          Passwort oder Face ID oder Touch ID, lässt sich aber nicht zum gemeinsamen Bearbeiten teilen.
        </li>
      </ul>
      <p>
        Die Suche liest jedes Wort in jeder Notiz, also findet „Rufbereitschaft“ jedes Mal, wenn es Thema war.{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (auf Englisch) geht jede Regel durch, die ein
        intelligenter Ordner nutzen kann. Für Team-Meetings stellt die <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Vorlage
        für Meeting-Protokolle</a> die Aufgaben mit Verantwortlichen nach oben, und <a href="/blog/apple-notes-templates" hrefLang="en">Apple
        Notes templates</a> (auf Englisch) hat weitere Notizen zum Einfügen.
      </p>

      <h2 id="grenzen">Wo 1:1-Notizen in Notizen aufhören</h2>
      <ul>
        <li><strong>Das Ausformulieren bleibt bei dir.</strong> Direkt nach einem 1:1 fängt das nächste Meeting an, und die Notizen warten, bis du die Hälfte vergessen hast.</li>
        <li><strong>Aufräumen geht nur von Hand.</strong> Zusagen in die offenen Punkte verschieben und besprochene Themen löschen lässt man leicht aus, und die Agenda füllt sich mit alten Punkten.</li>
        <li><strong>Keine Muster.</strong> Dass die Rufbereitschaft in drei 1:1s hintereinander Thema war, steht in der Notiz, aber nichts weist darauf hin.</li>
        <li><strong>Die Suche findet Wörter, keine Antworten.</strong> „Was habe ich Emma letztes Mal zugesagt?“ heißt, die offenen Punkte selbst durchzulesen.</li>
      </ul>
      <p>
        Für ein oder zwei Personen reicht die Vorlage. Bei einem Team von sechs ist das Ausformulieren der Teil, der liegen bleibt.
      </p>

      <h2 id="pinto-notes">1:1-Notizen, die sich selbst ausformulieren</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/one-on-one-notes">1:1 notes</a> ist eine fortlaufende
        Notiz pro Person mit dem nächsten Mal, den offenen Punkten und den früheren 1:1s, das neueste zuerst.
      </p>
      <p>
        Beim ersten Mal fragt deine KI, mit wem das 1:1 ist, und trägt den Namen ein. Erwähnst du unter der Woche etwas, das du ansprechen
        willst, kommt es unter Nächstes Mal. Erzähl ihr nach dem 1:1, wie es lief, etwa „Emma und ich hatten gerade unser 1:1. Sie will den
        nächsten Launch leiten und hat nach einem Mentor gefragt.“ Sie setzt ganz oben bei den früheren 1:1s einen Abschnitt mit ihrem Namen
        und dem Datum ein, worüber ihr gesprochen habt und wie sie gewirkt hat, trägt als Checklistenzeilen bei den offenen Punkten ein, was
        ihr beide zugesagt habt, und entfernt die besprochenen Themen. Frag vor dem nächsten Mal „Was habe ich letztes Mal zugesagt?“. Du
        kannst weiterhin alles selbst schreiben und abhaken, und jede frühere Version der Notiz bleibt erhalten. Der Teil mit der KI
        funktioniert, sobald ChatGPT oder Claude verbunden ist.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Deine 1:1-Notizen aus Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem
        Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
