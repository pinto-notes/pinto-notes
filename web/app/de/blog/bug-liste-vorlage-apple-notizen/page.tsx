import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "bug-liste-vorlage-apple-notizen");

// German version of /blog/apple-notes-bug-triage-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "bug liste" (vorlage), "bug liste vorlage", "fehlerliste vorlage", "bug report vorlage",
// "bug report" (deutsch, template), "bug triage" (definition, matrix, meeting, process); "bug tracking vorlage" and "bug
// triage vorlage" have no suggestions. German developers use the English "Bug" and "Triage", so the post does too, and
// severity is Schweregrad. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, two rows and two
// columns, the Tabulatortaste in the last cell adds a row, selected paragraphs become a table), apd93c815aa0
// (Markierte Einträge automatisch sortieren) and apd4e6e2c9a6 (teilen, Kann bearbeiten), and
// support.apple.com/de-de/102462 (Apple Account). Format, Tabelle and Bearbeiten, Als Markdown einsetzen are Notes' de
// strings (MainMenu.loctable) on macOS 27.2. Paste as Markdown is not used for the table, as in the English post. The
// Pinto template's choices (P0 to P3, New, Confirmed, In progress, Fixed, Won't fix) stay in English, as the app is.
// Facts are the English post's; the picture is its English one, described in German. Links go to English posts, since
// none of them has a German version.

const ui = UI.de;

// Tabs between the columns: select those lines in Notes and turn them into a table.
const TABLE = `Bug-Triage

Bug\tSchweregrad\tBereich\tStatus\tGemeldet\tLink
Gespeicherte Karten scheitern im Checkout\tP1\tCheckout\tIn Arbeit\t04.11.2026\t#412
Suche findet ä, ö und ü nicht\tP2\tSuche\tBehoben\t02.11.2026\t#407
Bestellmail kommt doppelt\tP2\tE-Mail\tNeu\t06.11.2026\t#418
Logo im Footer auf Handys unscharf\tP3\tDesign\tBestätigt\t05.11.2026\tkeiner
`;

const RULES = `## Schweregrad
- P0: Datenverlust, eine Sicherheitslücke oder alle sind blockiert. Alles stehen und liegen lassen.
- P1: Ein Hauptablauf ist für viele kaputt. Diese Woche.
- P2: Kaputt, aber es gibt einen Workaround. Einplanen.
- P3: Feinschliff. Wenn Zeit ist.

## Details
Gespeicherte Karten scheitern im Checkout
1. Mit einem Konto mit gespeicherter Karte anmelden.
2. Irgendetwas in den Warenkorb legen und zum Checkout gehen.
3. Die gespeicherte Karte wählen und auf Bezahlen tippen.
Erwartet: Die Bestellung wird aufgegeben.
Passiert: „Zahlung fehlgeschlagen“, und keine Bestellung.
`;

const LIST = `# Bugs nach Schweregrad

## P1
- [ ] Gespeicherte Karten scheitern im Checkout (Checkout, #412)

## P2
- [ ] Bestellmail kommt doppelt (E-Mail, #418)
- [x] Suche findet ä, ö und ü nicht (Suche, #407)

## P3
- [ ] Logo im Footer auf Handys unscharf (Design)
`;

const FAQ = [
  { q: "Was ist Bug-Triage?", a: [
    "Für jeden neuen Bug-Report zu entscheiden, wie schlimm er ist und wann er behoben wird. Die meisten Teams geben jedem Bug einen Schweregrad von P0 bis P3, einen Bereich und einen Status und gehen die neuen an einem festen Tag durch.",
  ] },
  { q: "Was gehört in eine Vorlage für Bug-Triage?", a: [
    "Ein kurzer Titel, der Schweregrad, der Bereich, der Status, das Datum der Meldung und ein Link zum Report. Dann für jeden Bug, den du nachstellen kannst, die Schritte, was erwartet war und was passiert ist.",
  ] },
  { q: "Kann ich Bugs in Apple Notizen verwalten?", a: [
    "Für ein kleines Projekt ja: eine Tabelle mit einer Zeile pro Bug oder eine Checkliste unter einer Überschrift pro Schweregrad. Tabellen in Notizen sortieren und filtern nicht, ab ein paar Dutzend Bugs ist ein Issue-Tracker also besser.",
  ] },
  { q: "Gibt es eine Vorlage für Bug-Triage, die Reports für mich einträgt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für Bug-Triage. Füg einen Report oder ein GitHub-Issue in ChatGPT, Claude oder Claude Code ein, und es legt eine Zeile nach deinen Regeln für den Schweregrad an, mit den Schritten zum Nachstellen.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="bug-liste-vorlage-apple-notizen"
      intro={<>
        Nicht jedes Team braucht einen Issue-Tracker. Eine Entwicklerin allein oder ein Team zu dritt kann jeden Bug in einer Notiz führen,
        wenn jeder einen Schweregrad bekommt und die schlimmsten oben stehen. Hier ist eine Vorlage für eine Bug-Liste in Apple Notizen, eine
        Checklisten-Version, die besser sortiert, und wo eine Notiz aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#nach-schweregrad", label: "Als Checkliste" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Bugs, die sich selbst eintragen" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für Bug-Triage, aber eine Notiz erledigt das: eine Tabelle mit einer Zeile pro Bug (Titel,
            Schweregrad, Bereich, Status, Datum, Link), darunter die Regeln für den Schweregrad und weiter unten die Schritte zum Nachstellen
            jedes Bugs. Gib jedem Bug beim Eingang einen Schweregrad von P0 bis P3 und arbeite von oben nach unten.
          </p>
          <PostCta template="bug-triage" slug="de/bug-liste-vorlage-apple-notizen" path="/de/blog/bug-liste-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du Bug-Reports für dich eintragen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Bug-Triage. Füg einen Report in ChatGPT oder Claude ein, und es legt eine Zeile nach deinen Regeln für den Schweregrad an, mit den Schritten zum Nachstellen.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/bug-triage-note" width={1520} height={1363} maxWidth={600}
        alt="Eine Notiz Bug triage in Pinto Notes auf dem Mac: eine Tabelle mit vier Bugs mit Schweregrad P1 bis P3, Bereich, Status, Datum und Issue-Nummer, die Schritte zum Nachstellen des Checkout-Bugs mit gespeicherter Karte und die Regeln für den Schweregrad."
        caption="Eine Bug-Triage-Notiz in Pinto Notes, mit Severity und Status als Auswahl. In Apple Notizen kommen Tabelle, Details und Regeln als einfacher Text mit." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Tabelle und die Regeln</h2>
      <p>
        Die Tabelle ist die Liste, auf die du jeden Morgen schaust. Der Schweregrad sagt, wann ein Bug behoben wird, und die Regeln halten das
        ehrlich: P1 heißt, ein Hauptablauf ist für viele kaputt, und eine laute Kundin ändert daran nichts. Halte die Titel kurz, denn sechs
        Spalten teilen sich die Breite.
      </p>
      <Keep title="Bug-Tabelle für Apple Notizen" text={TABLE} copyLabel={ui.copy}
        note="In jeder Tabellenzeile steht ein Tabulator zwischen den Spalten. Füge sie ein und mach dann aus diesen Zeilen eine Tabelle." />
      <Keep title="Regeln für den Schweregrad und Details" text={RULES} copyLabel={ui.copy}
        note="Füge sie unter der Tabelle mit Bearbeiten, Als Markdown einsetzen ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
      ]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füge die Tabellenvorlage in eine neue Notiz ein, markiere die fünf Zeilen von
          Bug bis zum letzten Bug und klicke in der Symbolleiste auf die Taste für Tabellen. Aus jedem Tabulator wird eine Spalte, so stehen die sechs Spalten
          nebeneinander.
        </li>
        <li>
          <strong>Oder leer anfangen.</strong> Wähle Format, Tabelle für zwei Zeilen und zwei Spalten. Die Tabulatortaste in der letzten
          Zelle fügt die nächste Zeile hinzu.
        </li>
        <li>
          <strong>Regeln und Details dazu.</strong> Klicke unter die Tabelle und wähle Bearbeiten, Als Markdown einsetzen. Die Zeilen mit ##
          werden zu Überschriften.
        </li>
        <li>
          <strong>Status überschreiben.</strong> Von In Arbeit zu Behoben ist eine Zelle. Lass behobene Bugs eine Woche drin, damit alle
          sehen, was sich geändert hat.
        </li>
      </ul>
      <p>
        Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also drückt ein langer Titel den Rest zusammen.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) geht alles durch, was eine Tabelle in
        Notizen kann und nicht kann. Melden auch andere Bugs, teile die Notiz und lass sie bearbeiten. Alle brauchen einen Apple Account.
      </p>

      <h2 id="nach-schweregrad">Eine Checkliste, die sich selbst sortiert</h2>
      <p>
        Tabellen in Notizen sortieren nicht, also landet ein neuer P1 ganz unten. Stört dich das, gib jedem Schweregrad eine Überschrift und
        jedem Bug eine Checklistenzeile darunter. Die schlimmsten Bugs stehen dann immer oben, und ein Häkchen markiert einen Bug als
        behoben.
      </p>
      <Keep title="Bugs nach Schweregrad für Apple Notizen" text={LIST} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <p>
        Aktiviere in den Einstellungen von Notizen „Markierte Einträge automatisch sortieren“, dann rutschen behobene Bugs an das Ende ihrer
        Überschrift. Die Suche liest jedes Wort in jeder Notiz, also findet „Checkout“ den Bug und seine Details. Weitere Notizen zum
        Einfügen findest du in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo Bug-Triage in Notizen aufhört</h2>
      <ul>
        <li><strong>Kein Sortieren, kein Filtern.</strong> „Jeder offene P1“ heißt, die ganze Tabelle zu lesen.</li>
        <li><strong>Jeder Report wird abgetippt.</strong> Bugs kommen per E-Mail, Chat und GitHub, und jeder ist ein Titel, ein Schweregrad und Schritte, die du von Hand schreibst.</li>
        <li><strong>Der Schweregrad ist jedes Mal eine Abwägung.</strong> Die Regeln stehen in der Notiz, aber du hältst sie trotzdem gegen jeden Report.</li>
        <li><strong>Keine Verbindung zum Code.</strong> Herauszufinden, in welchen Dateien ein Bug steckt, bleibt eine eigene Aufgabe.</li>
      </ul>
      <p>
        Für ein Nebenprojekt oder eine kleine App reicht eine Notiz. Meldet ein Team Dutzende Bugs pro Woche, nimm einen Issue-Tracker.
      </p>

      <h2 id="pinto-notes">Bugs, die sich selbst eintragen</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/bug-triage">Bug triage</a> ist eine Notiz mit einer
        Tabelle Bugs, einem Abschnitt Details und den Regeln für den Schweregrad. In der Tabelle ist Severity eine Auswahl von P0 bis P3 und
        Status eine Auswahl aus New, Confirmed, In progress, Fixed und Won&apos;t fix.
      </p>
      <p>
        Füg einen Bug-Report in deine KI ein. Sie folgt den Regeln unter Severity und legt eine Zeile an, mit kurzem Titel, Schweregrad,
        Bereich, Status New, dem heutigen Datum und dem Link, und hält die Zeilen mit den schlimmsten zuerst. Steht im Report, wie man den
        Bug nachstellt, kommen die Schritte, was erwartet war und was passiert ist unter Details. In Claude Code hat die Vorlage eigene
        Anweisungen: Füg ein GitHub-Issue ein, und es liest es mit gh issue view, legt die Zeile an, sucht dann in deiner Codebasis nach der
        wahrscheinlichen Ursache und schreibt die betroffenen Dateien in die Details.{" "}
        <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Notes in Claude Code and Codex</a> (auf Englisch) hat den einen Befehl,
        mit dem du es hinzufügst.
      </p>
      <p>
        Frag „Was ist P1 und noch offen?“, oder sag „Der Checkout mit gespeicherter Karte ist behoben, markier ihn“, und es setzt den Status.
        Du kannst weiterhin jede Zeile selbst bearbeiten, und jede frühere Version der Notiz bleibt erhalten. Der KI-Teil funktioniert, sobald
        ChatGPT oder Claude verbunden ist. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch)
        dauert eine Minute. Die Notizen, die du schon in Apple Notizen führst, kommen mit{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie
        es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
