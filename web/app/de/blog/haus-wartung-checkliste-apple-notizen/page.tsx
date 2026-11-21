import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "haus-wartung-checkliste-apple-notizen");

// German version of /blog/apple-notes-home-maintenance-checklist (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "haus wartung checkliste", "checkliste hauswartung", "haus checkliste" (wartung), "haus
// instandhaltung checkliste", "wartungsplan haus" (excel, haustechnik), "wartungsplan vorlage"; "wartungsplan eigenheim"
// and "wartungskalender haus" have no suggestions. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, the Tabulatortaste
// in the last cell adds a row, selected paragraphs become a table), apd93c815aa0 (Markierte Einträge automatisch
// sortieren; Format, Mehr, Alles deaktivieren), apd58edc7964 (intelligente Ordner, the Checklisten rule), apdb54e469b6
// (anpinnen) and apd4e6e2c9a6 (teilen), and support.apple.com/de-de/102462 (Apple Account). Bearbeiten, Als Markdown
// einsetzen and Format, Tabelle are Notes' de strings (MainMenu.loctable) on macOS 27.2, and the rule value Nicht
// markiert is SmartFolderChecklistsFilterView there. Paste as Markdown is not used for the table, as in the English post.
// The example's boiler is the Heizung and its plumber an Installateur, with German phone numbers. The Pinto template's
// choices (Month, 3 months, 6 months, Year) stay in English, as the app is. Facts are the English post's; the picture is
// its English one, described in German. Links go to English posts, since none of them has a German version.

const ui = UI.de;

const NOTE = `# Wartung im Haus

Die Arbeiten, die das Zuhause am Laufen halten, wie oft sie fällig sind und wann sie zuletzt erledigt wurden.

## Arbeiten
Füge die Tabelle mit den Arbeiten unter dieser Zeile ein.

## Diesen Monat
- [ ] Rauchmelder testen (fällig 14.11.)
- [ ] Heizung warten lassen (fällig 20.11.)
- [ ] Dachrinnen reinigen (fällig 24.11.)

## Wen ich anrufe
- Installateur: Nordin & Sohn, 030 4650 0427
- Elektriker: Volt Fix, 030 4650 0463

## Geräte
- Spülmaschine: Bosch Serie 4, Garantie bis 2028
- Heizung: Vaillant ecoTEC, eingebaut 2021
`;

// Tabs between the columns: select those lines in Notes and turn them into a table.
const JOBS = `Arbeit\tRhythmus\tZuletzt erledigt\tNächstes Mal
Wasserkocher entkalken\tMonatlich\t01.11.2026\t01.12.2026
Spülmaschinensieb reinigen\tMonatlich\t05.11.2026\t05.12.2026
Rauchmelder testen\tAlle 3 Monate\t14.08.2026\t14.11.2026
Heizung warten lassen\tJährlich\t20.11.2025\t20.11.2026
Dachrinnen reinigen\tAlle 6 Monate\t24.05.2026\t24.11.2026
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für die Wartung im Haus?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz mit einer Tabelle der Arbeiten, einer Checkliste für diesen Monat und den Nummern, die du anrufst, funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Was gehört auf eine Checkliste für die Wartung im Haus?", a: [
    "Jede Arbeit, die sich wiederholt, wie oft sie fällig ist und wann du sie zuletzt erledigt hast. Fang mit denen an, die Geld kosten, wenn man sie vergisst: die Rauchmelder, die Wartung der Heizung, die Dachrinnen und die Filter.",
  ] },
  { q: "Kann Apple Notizen mich erinnern, wenn eine Arbeit fällig ist?", a: [
    "Die Notiz sagt es dir nicht von selbst. Du öffnest sie und liest die Spalte Nächstes Mal. Eine Checkliste für diesen Monat, am Monatsanfang angelegt, hält die fälligen Arbeiten in einer kurzen Liste.",
  ] },
  { q: "Gibt es eine App für die Wartung im Haus, die weiß, was fällig ist?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für die Wartung im Haus. Sag ChatGPT oder Claude, wann eine Arbeit erledigt ist, und es aktualisiert die Daten. Frag, was diesen Monat fällig ist, und es schreibt die Checkliste.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="haus-wartung-checkliste-apple-notizen"
      intro={<>
        Niemand vergisst den Rauchmelder mit Absicht. Er rutscht durch, weil der letzte Test so lange her ist, dass sich keiner mehr daran
        erinnert. Hier ist eine Checkliste für die Wartung im Haus zum Einfügen in Apple Notizen, ein Weg, sie jeden Monat abzuarbeiten, und
        wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#jeden-monat", label: "Jeden Monat" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Eine Liste, die weiß, was fällig ist" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für die Wartung im Haus, aber eine Notiz erledigt das: eine Tabelle mit jeder Arbeit, die sich
            wiederholt, wie oft und wann du sie zuletzt erledigt hast, dann eine Checkliste mit dem, was diesen Monat fällig ist, die Leute,
            die du anrufst, und die Modellnummern deiner Geräte.
          </p>
          <PostCta template="home-maintenance" slug="de/haus-wartung-checkliste-apple-notizen" path="/de/blog/haus-wartung-checkliste-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du die Daten für dich pflegen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für die Wartung im Haus. Sag ChatGPT oder Claude, dass eine Arbeit erledigt ist, und es aktualisiert die Daten, oder frag, was diesen Monat fällig ist.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/home-maintenance-note" width={1520} height={1557} maxWidth={600}
        alt="Eine Notiz Home maintenance in Pinto Notes auf dem Mac: eine Tabelle Jobs mit fünf Arbeiten von Descale the kettle bis Clear the gutters, mit Rhythmus, letztem und nächstem Datum, eine Checkliste This month mit zwei von fünf abgehakt, Who to call und Appliances."
        caption="Eine Wartungsnotiz in Pinto Notes, in der Every eine Auswahlliste ist. In Apple Notizen funktionieren dieselben Spalten als einfache Tabelle, mit der Checkliste und den Listen darunter. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: Arbeiten, dieser Monat, wen du anrufst</h2>
      <p>
        Die Tabelle ist das Protokoll: jede Arbeit, die sich wiederholt, wie oft, wann sie zuletzt erledigt wurde und wann sie das nächste Mal
        fällig ist. Die Checkliste ist das, woran du diesen Monat arbeitest. Wen ich anrufe und Geräte suchst du, wenn etwas kaputtgeht. Die
        Beispielarbeiten sind ein Anfang: Ergänze deine und lösch, was nicht passt.
      </p>
      <Keep title="Wartungsnotiz für Apple Notizen" text={NOTE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Keep title="Tabelle mit den Arbeiten für Apple Notizen" text={JOBS} copyLabel={ui.copy}
        note="In jeder Zeile steht ein Tabulator zwischen den Spalten. Füge sie unter Arbeiten ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
        { on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" },
      ]} />
      <ul>
        <li>
          <strong>Die Notiz einfügen.</strong> Leg auf einem Mac mit macOS 27 eine neue Notiz an und wähle Bearbeiten, Als Markdown
          einsetzen. Die Zeile mit # wird zum Titel, die Zeilen mit ## zu Überschriften und die Arbeiten für diesen Monat zu einer
          Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen.
        </li>
        <li>
          <strong>Dann die Tabelle.</strong> Ersetze die Zeile unter Arbeiten durch die Tabelle mit den Arbeiten, markiere ihre sechs Zeilen
          von Arbeit bis zur letzten Arbeit und klicke in der Symbolleiste auf die Taste für Tabellen. Aus jedem Tabulator wird eine Spalte.
        </li>
        <li>
          <strong>Eine Arbeit hinzufügen.</strong> Die Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Schreib die Daten mit
          Jahr, damit eine Arbeit, die einmal im Jahr ansteht, auch im nächsten November noch Sinn ergibt.
        </li>
        <li>
          <strong>Kurze Namen für die Arbeiten.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also
          drückt ein langer Name die Daten zusammen.
        </li>
      </ul>
      <p>
        Pinne die Notiz oben in ihrem Ordner an. Auf dem iPhone tippst du die Überschriften einmal ein, markierst die Arbeiten für diesen
        Monat und tippst auf die Checklisten-Taste. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf
        Englisch) geht alles durch, was eine Tabelle in Notizen kann und nicht kann.
      </p>

      <h2 id="jeden-monat">Jeden Monat</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] }]} />
      <ul>
        <li>
          <strong>Die Liste für diesen Monat anlegen.</strong> Lies am Monatsersten die Spalte Nächstes Mal durch und schreib für jede
          Arbeit, die in diesen Monat fällt, eine Checklistenzeile mit ihrem Datum.
        </li>
        <li>
          <strong>Abhaken, dann die Zeile aktualisieren.</strong> Ist eine Arbeit erledigt, hake sie ab und ändere Zuletzt erledigt und
          Nächstes Mal in der Tabelle. Das Häkchen gilt für diesen Monat. Die Zeile ist das, was du nächstes Jahr liest.
        </li>
        <li>
          <strong>Erledigtes nach unten rutschen lassen.</strong> Mit „Markierte Einträge automatisch sortieren“ wandern erledigte Arbeiten
          nach unten, und was übrig ist, bleibt oben.
        </li>
        <li>
          <strong>Die Liste wiederverwenden.</strong> Stehen jeden Monat dieselben Arbeiten an, behalte sie und wähle Format, Mehr, Alles
          deaktivieren, um neu anzufangen.
        </li>
      </ul>
      <p>
        Ein intelligenter Ordner mit der Regel Checklisten, Nicht markiert zeigt jede Notiz, in der noch etwas offen ist, also bleibt eine
        Arbeit vom letzten Monat im Blick. Wie du einen anlegst, steht in{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">tags and Smart Folders</a> (auf Englisch). Tropft ein Rohr, liest die
        Suche jedes Wort in jeder Notiz, also findet „Installateur“ oder „Bosch“ sofort die Nummer oder das Modell. Willst du das Haus mit
        jemandem zusammen führen, braucht beim Teilen der Notiz jede Person einen Apple Account. Weitere Notizen wie diese zum Einfügen
        findest du in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo eine Wartungsliste in Notizen aufhört</h2>
      <ul>
        <li><strong>Nächstes Mal rechnest du selbst.</strong> Notizen rechnet nicht aus, dass eine Arbeit alle 3 Monate, erledigt am 14. August, am 14. November fällig ist. Du schreibst das Datum.</li>
        <li><strong>Die Tabelle sortiert nicht.</strong> Sie kann die nächste Arbeit nicht nach oben stellen, also liest du jede Zeile, um zu sehen, was fällig ist.</li>
        <li><strong>Die Monatsliste wird von Hand abgeschrieben.</strong> Lässt du den Monatsersten aus, schreibt niemand die Liste für dich.</li>
        <li><strong>Die Daten verrutschen.</strong> Eine Arbeit, die du abgehakt, aber in der Tabelle nicht aktualisiert hast, sieht nächstes Jahr überfällig aus.</li>
      </ul>
      <p>
        Für eine Wohnung mit fünf Arbeiten reicht eine Notiz völlig. Für ein Haus mit dreißig ist das Pflegen der Daten die eigentliche Arbeit,
        und die bleibt bei dir.
      </p>

      <h2 id="pinto-notes">Eine Liste, die weiß, was fällig ist</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/home-maintenance">Home maintenance</a> ist dieselbe
        Notiz: eine Tabelle Jobs, in der Every eine Auswahl aus Month, 3 months, 6 months oder Year ist, eine Checkliste This month, Who to
        call und Appliances.
      </p>
      <p>
        Erzähl deiner KI von einer Arbeit, die du im Blick behalten willst, und wann du sie zuletzt erledigt hast, und sie legt die Zeile mit
        beiden Daten an, mit Jahr. Frag „Was ist diesen Monat fällig?“, und sie schreibt die Checkliste unter This month. Sag „Die Heizung
        wurde heute gewartet“, und sie ändert das letzte und das nächste Datum und hakt die Arbeit ab. Erwähnst du eine Modellnummer oder ein
        Garantiedatum, kommt es unter Appliances. Du kannst weiterhin jede Zeile selbst hinzufügen und bearbeiten, und jede frühere Version
        der Notiz bleibt erhalten. Das funktioniert, sobald ChatGPT oder Claude verbunden ist.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Listen, die du schon in Apple Notizen führst, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
