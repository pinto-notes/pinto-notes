import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "meeting-protokoll-vorlage-apple-notizen");

// German version of /blog/apple-notes-meeting-notes-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "meeting protokoll vorlage" (word, excel, pdf, onenote, kostenlos), "team meeting protokoll
// vorlage", "besprechungsprotokoll vorlage", "meeting notizen vorlage", "besprechungsnotizen vorlage", "meeting notizen
// ki"; "apple notizen protokoll" has no suggestions. Action items are Aufgaben here. Apple's own German words, read 21 Nov
// 2026, from the Mac guide support.apple.com/de-de/guide/notes/apd58edc7964/mac (Ablage, Neuer intelligenter Ordner, the
// rules Ordner and Checklisten, all criteria), apdc88ed7f1d (Tags with # in the Seitenleiste), apdb5106e334 (Audio
// aufnehmen, Transkript, a Zusammenfassung with Apple Intelligence) and apd4e6e2c9a6 (teilen, Kann bearbeiten), and
// support.apple.com/de-de/102462 (Apple Account). Bearbeiten, Als Markdown einsetzen and Ablage, Notiz duplizieren are
// Notes' de strings (MainMenu.loctable) on macOS 27.2; the rule value Nicht markiert is SmartFolderChecklistsFilterView
// and "allen der folgenden Filter" is FolderComposerViewController there. The template's notes heading is Mitschrift,
// so it isn't read as the app's name, and its VAT is Mehrwertsteuer. Facts are the English post's; the picture is its
// English one, described in German. Links go to English posts, since none of them has a German version.

const ui = UI.de;

const TEMPLATE = `# Produkt-Sync, 24. November

Dabei: Sara, Jonas, Emma

## Tagesordnung
- Preisseite
- Checkout-Design

## Mitschrift
- Der Vertrieb will die neuen Preise vor Dezember
- Zwei von drei Testpersonen haben im Checkout die Gesamtsumme übersehen

## Entscheidungen
- Die drei Tarife bleiben, kein Lifetime-Deal
- Die Gesamtsumme kommt über die Kartendaten

## Aufgaben
- [ ] Sara: neue Preise an den Vertrieb schicken (Fr.)
- [ ] Jonas: Gesamtsumme im Checkout verschieben (Mi.)
- [ ] Emma: Mehrwertsteuerregeln für Norwegen prüfen (nächste Woche)
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für Meeting-Protokolle?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz pro Meeting mit Überschriften für Tagesordnung, Mitschrift, Entscheidungen und Aufgaben funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Wie behalte ich die Aufgaben aus Meetings in Apple Notizen im Blick?", a: [
    "Schreib sie als Checkliste, mit dem Namen der Person vorne. Leg dann einen intelligenten Ordner mit zwei Regeln an, deinem Ordner Meetings und Checklisten: Nicht markiert, und jedes Meeting, in dem noch etwas offen ist, erscheint an einem Ort.",
  ] },
  { q: "Kann Apple Notizen ein Meeting aufnehmen und zusammenfassen?", a: [
    "Mit Apple Intelligence wird aus einer Aufnahme in Notizen ein Transkript und eine Zusammenfassung. Wer was bis wann erledigt, zieht es nicht heraus. Die Aufgaben schreibst du weiterhin selbst.",
  ] },
  { q: "Gibt es eine App für Meeting-Notizen, die die Aufgaben für mich schreibt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für Meeting-Notizen. Füg deine groben Notizen oder ein Transkript in ChatGPT oder Claude ein, und es schreibt die Zusammenfassung, die Entscheidungen und jede Aufgabe mit Person und Datum.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="meeting-protokoll-vorlage-apple-notizen"
      intro={<>
        Ein Meeting-Protokoll nützt vor allem durch den Teil, den die meisten weglassen: was entschieden wurde und wer als Nächstes was tut.
        Hier ist eine Vorlage für Meeting-Protokolle in Apple Notizen zum Einfügen, ein Weg, jede offene Aufgabe an einem Ort zu sehen, und
        wo Notizen nicht mehr reicht.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#offene-aufgaben", label: "Offene Aufgaben" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Notizen, die sich selbst ausformulieren" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für Meeting-Protokolle, aber eine Notiz pro Meeting erledigt das: wer dabei war, die
            Tagesordnung, deine Mitschrift, die Entscheidungen und die Aufgaben als Checkliste mit einem Namen an jeder. Bewahre sie in einem
            Ordner Meetings auf, und ein intelligenter Ordner zeigt jede Aufgabe, die noch offen ist.
          </p>
          <PostCta slug="de/meeting-protokoll-vorlage-apple-notizen" path="/de/blog/meeting-protokoll-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du die Aufgaben für dich schreiben lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Meeting-Notizen. Füg deine groben Notizen in ChatGPT oder Claude ein, und es schreibt die Zusammenfassung, die Entscheidungen und wer was tut.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/meeting-notes-note" width={1520} height={1110} maxWidth={620}
        alt="Eine Notiz Meeting notes in Pinto Notes auf dem Mac: Aufgaben mit Person und Datum an jeder, eine davon abgehakt, dann ein Abschnitt Pricing sync mit einer Zusammenfassung in zwei Zeilen und den Entscheidungen."
        caption="Meeting-Notizen in Pinto Notes: offene Aufgaben oben, jedes Meeting darunter. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz pro Meeting</h2>
      <p>
        Die Entscheidungen und die Aufgaben sind die Teile, wegen derer du zurückkommst, also bekommen sie eigene Überschriften. Schreib an
        jede Aufgabe einen Namen und einen Tag. „Mehrwertsteuer klären“ ohne Verantwortliche ist der Grund, warum nichts passiert. Lass in
        jeder Zeile ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Meeting-Protokoll für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
        { on: "Mac", steps: ["Ablage", "Notiz duplizieren"] },
      ]} />
      <ul>
        <li>
          <strong>Einmal einfügen.</strong> Leg auf einem Mac mit macOS 27 eine Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die
          Zeile mit # wird zum Titel, jede Zeile mit ## zu einer Überschrift und die Aufgaben zu einer Checkliste. Auf dem iPhone tippst du
          die Überschriften und tippst für die Aufgaben auf die Checklisten-Taste.
        </li>
        <li>
          <strong>Eine leere Kopie behalten.</strong> Lösch die Beispielzeilen und bewahre diese Notiz in einem Ordner Meetings auf. Wähle vor
          jedem Meeting Ablage, Notiz duplizieren und ändere den Titel.
        </li>
        <li>
          <strong>Regelmäßige Meetings taggen.</strong> Tipp #sync in die Notiz eines Meetings, und der Sync jeder Woche ist in der
          Seitenleiste nur einen Klick entfernt.
        </li>
        <li>
          <strong>Aufnehmen, wenn du nicht mitschreiben kannst.</strong> Mit Apple Intelligence wird aus einer Aufnahme in Notizen ein
          Transkript und eine Zusammenfassung. Kopiere die Entscheidungen und Aufgaben daraus in die Vorlage.
        </li>
      </ul>

      <h2 id="offene-aufgaben">Jede offene Aufgabe sehen</h2>
      <Paths rows={[{ on: "Mac", steps: ["Ablage", "Neuer intelligenter Ordner"] }]} />
      <p>
        Aufgaben, die über zwanzig Meeting-Notizen verstreut sind, erledigt niemand. Wähle auf dem Mac Ablage, Neuer intelligenter Ordner,
        nenn ihn Offene Aufgaben und gib ihm zwei Regeln, die beide zutreffen müssen (Notizen, die mit allen der folgenden Filter
        übereinstimmen): Ordner mit deinem Ordner Meetings und Checklisten mit Nicht markiert. Jedes Meeting, in dem noch etwas offen ist,
        steht in diesem Ordner, und ein Meeting fällt heraus, sobald seine letzte Aufgabe abgehakt ist.
      </p>
      <p>
        Nutzen die Leute im Meeting auch Apple Notizen, teile die Notiz und lass sie bearbeiten, dann hakt jede Person ihre eigenen Aufgaben
        ab. Alle brauchen einen Apple Account. Für das Ende der Woche hat <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes
        templates</a> (auf Englisch) einen Wochenrückblick zum Einfügen, und <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">tags
        and Smart Folders</a> (auf Englisch) geht jede Regel durch, die ein intelligenter Ordner nutzen kann.
      </p>

      <h2 id="grenzen">Wo Meeting-Protokolle in Notizen aufhören</h2>
      <ul>
        <li><strong>Das Ausformulieren bleibt bei dir.</strong> Grobe Notizen oder ein Transkript werden nicht von selbst zu Entscheidungen und Verantwortlichen.</li>
        <li><strong>Keine Liste nach Person.</strong> Ein intelligenter Ordner zeigt Meetings mit offenen Aufgaben, nicht „alles, was Sara noch erledigen muss“.</li>
        <li><strong>Keine Antworten über Meetings hinweg.</strong> „Was haben wir letzten Monat zu den Preisen entschieden?“ heißt Notizen öffnen, bis du es findest.</li>
      </ul>
      <p>
        Für ein paar Meetings pro Woche reichen die Vorlage und ein intelligenter Ordner. Bei mehr ist das Ausformulieren die Arbeit, für die
        niemand Zeit hat.
      </p>

      <h2 id="pinto-notes">Meeting-Notizen, die sich selbst ausformulieren</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/meeting-notes">Meeting-Notizen</a> ist eine Notiz für
        alle deine Meetings: oben die offenen Aufgaben, darunter ein kurzer Abschnitt pro Meeting, das neueste zuerst.
      </p>
      <p>
        Füg nach einem Meeting deine groben Notizen oder ein Transkript in deine KI ein. Sie schreibt eine Zusammenfassung in zwei Zeilen und
        die Entscheidungen und trägt jede Aufgabe als „Sara: neue Preise an den Vertrieb schicken (Fr.)“ ein. Ist etwas unklar, fragt sie,
        bevor sie es aufschreibt. Frag dann „Was ist für mich noch offen?“, oder sag ihr, dass Jonas sein Review erledigt hat, und sie hakt die
        Zeile ab. Du kannst weiterhin alles selbst tippen und abhaken, und jede frühere Version der Notiz bleibt erhalten.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute, und deine Apple
        Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch) mit. Die App ist
        auf Englisch.
      </p>
    </LocalPostPage>
  );
}
