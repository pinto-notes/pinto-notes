import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "redaktionsplan-vorlage-apple-notizen");

// German version of /blog/apple-notes-content-calendar (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "redaktionsplan" (social media, vorlage, erstellen), "redaktionsplan vorlage" (excel, 2026, kostenlos,
// social media, google sheets, word), "redaktionsplan erstellen", "content kalender vorlage", "content kalender" (2026,
// social media, instagram), "content plan vorlage"; "redaktionsplan notizen" has no suggestions. German searchers say
// Redaktionsplan far more than Content-Kalender, so the post uses it and names Content-Kalender once. The template's
// Voice heading is Tonalität, the word German marketing teams use. Apple's own German words, read 21 Nov 2026, from the
// Mac guide support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, the
// Tabulatortaste in the last cell adds a row, selected paragraphs become a table), apde615d29c2 (Bearbeiten, Link
// hinzufügen, Command-K), apdc88ed7f1d (Tags with #), apd58edc7964 (intelligente Ordner, the Tags rule), apdb54e469b6
// (anpinnen) and apd4e6e2c9a6 (teilen), and support.apple.com/de-de/102462 (Apple Account). Bearbeiten, Als Markdown
// einsetzen, Format, Tabelle and Ablage, Notiz duplizieren are Notes' de strings (MainMenu.loctable) on macOS 27.2, and
// the Smart Folder rule Tags is SmartFolderFilterRow there. Dates stay as 2026-11-03, as in the English post, so they
// read in order. The Pinto template's choices (Blog, Newsletter, LinkedIn, Instagram, YouTube; Idea, Drafting,
// Scheduled, Published) stay in English, as the app is. Facts are the English post's; the picture is its English one,
// described in German. Links go to the German meeting notes post and to English posts where no German one exists.

const ui = UI.de;

const SKELETON = `# Redaktionsplan

## Kalender
Füge die Tabelle hier ein.

## Ideen
- Drei Tools, die ich jeden Tag nutze
- Ein Tag im Support, in Zahlen
- Womit wir dieses Jahr aufgehört haben

## Tonalität
- Kurze Sätze. Eine Idee pro Beitrag.
- Zeig die Arbeit: Ein Screenshot oder eine Zahl schlägt jedes Adjektiv.
- Schließ mit einer Frage, nicht mit einem Verkaufsargument.
`;

// Tabs between the columns: select these lines in Notes and turn them into a table.
const TABLE = `Erscheint am\tTitel\tKanal\tStatus
2026-11-03\tFünf Fragen an jeden neuen Kunden\tBlog\tVeröffentlicht
2026-11-10\tWas uns 100 Kundengespräche gezeigt haben\tLinkedIn\tGeplant
2026-11-12\tNewsletter: drei Kundengeschichten\tNewsletter\tEntwurf
2026-11-17\tUnser Onboarding, vorher und nachher\tLinkedIn\tEntwurf
2026-11-19\tHinter den Kulissen: der Support\tInstagram\tIdee
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für einen Redaktionsplan?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz mit einer Tabelle der Beiträge (Datum, Titel, Kanal, Status) und einer Liste mit Ideen darunter funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Kann Apple Notizen eine Tabelle nach Datum sortieren?", a: [
    "Nein. Tabellen in Apple Notizen sortieren nicht. Schreib Daten als 2026-11-03, dann stehen sie in der richtigen Reihenfolge, und setz jeden neuen Beitrag von Hand an seinen Platz.",
  ] },
  { q: "Kann mein Team denselben Redaktionsplan in Apple Notizen bearbeiten?", a: [
    "Ja, wenn du die Notiz teilst. Alle brauchen einen Apple Account, und alle bearbeiten dieselbe Notiz.",
  ] },
  { q: "Gibt es eine Notizen-App, die Inhalte für mich plant?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für einen Content-Kalender. Sag ChatGPT oder Claude eine Idee, und es speichert sie, oder lass es die nächsten zwei Wochen planen, und es trägt die Beiträge in den Kalender ein.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="redaktionsplan-vorlage-apple-notizen"
      intro={<>
        Jede Woche zu posten fällt leichter, wenn der Plan und die Ideen an einem Ort stehen, den du sowieso öffnest. Apple Notizen kann
        dieser Ort sein, mit einer Notiz und einer Tabelle. Hier ist eine Vorlage für einen Redaktionsplan in Apple Notizen zum Einfügen,
        wie du ihn von Woche zu Woche pflegst und wo er aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#jede-woche", label: "Von Woche zu Woche" },
          { href: "#grenzen", label: "Wo er aufhört" },
          { href: "#pinto-notes", label: "Ein Plan, der mitplant" },
        ]}>
          <p>
            Apple Notizen hat keinen Redaktionsplan, aber eine Notiz erledigt das: eine Tabelle mit Erscheinungsdatum, Titel, Kanal und
            Status, dann eine Liste mit Ideen und ein paar Zeilen dazu, wie du schreibst. Pinne sie an und trag jede Idee ein, sobald sie
            dir kommt.
          </p>
          <PostCta template="content-calendar" slug="de/redaktionsplan-vorlage-apple-notizen" path="/de/blog/redaktionsplan-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du die nächsten zwei Wochen für dich planen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat einen kostenlosen Content-Kalender. Sag ChatGPT oder Claude eine Idee, und es speichert sie, oder lass es aus deinen Ideen zwei Wochen Beiträge planen.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/content-calendar-note" width={1520} height={1265} maxWidth={600}
        alt="Eine Notiz Content calendar in Pinto Notes auf dem Mac: eine Tabelle Calendar mit fünf Beiträgen vom 3. bis 19. November mit Titel, Kanal und Status, eine Liste Ideas mit drei Ideen und drei Zeilen unter Voice."
        caption="Ein Content-Kalender in Pinto Notes, in dem Channel und Status eine Auswahl sind. In Apple Notizen hält dieselbe Tabelle sie als getippte Wörter." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: Kalender, Ideen und Tonalität</h2>
      <p>
        Der Kalender ist eine Tabelle, eine Zeile pro Beitrag. Die Ideen sind eine einfache Liste, so kostet ein halber Gedanke nur eine
        Zeile. Die Tonalität sind drei Regeln, die du vor dem Schreiben liest, damit jeder Beitrag klingt wie der letzte. Die Notiz kommt in
        zwei Teilen: zuerst die Überschriften und Listen, dann die Tabelle.
      </p>
      <Keep title="Redaktionsplan für Apple Notizen" text={SKELETON} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel und aus jeder Zeile mit ## eine
        Überschrift. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du sie ein. Ersetze dann die Zeile
        unter Kalender durch die Tabelle.
      </p>
      <Keep title="Kalender-Tabelle" text={TABLE} copyLabel={ui.copy}
        note="In jeder Zeile steht ein Tabulator zwischen den Spalten. Füge sie ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füge die Tabellenzeilen unter Kalender ein, markiere die sechs Zeilen von
          Erscheint am bis zum letzten Beitrag und klicke in der Symbolleiste auf die Taste für Tabellen. Aus jedem Tabulator wird eine Spalte.
        </li>
        <li>
          <strong>Oder leer anfangen.</strong> Wähle Format, Tabelle für zwei Zeilen und zwei Spalten. Die Tabulatortaste in der letzten
          Zelle fügt die nächste Zeile hinzu.
        </li>
        <li>
          <strong>Kurze Titel.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also drückt ein langer
          Titel die anderen Spalten zusammen. Ein Arbeitstitel aus ein paar Wörtern reicht.
        </li>
        <li>
          <strong>Daten immer gleich schreiben.</strong> 2026-11-03 steht in der Spalte in der richtigen Reihenfolge und lässt sich leicht
          suchen.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) geht alles durch, was eine Tabelle in
        Notizen kann und nicht kann.
      </p>

      <h2 id="jede-woche">Von Woche zu Woche</h2>
      <ul>
        <li>
          <strong>Anpinnen.</strong> Eine angepinnte Notiz steht oben in ihrem Ordner, so landet eine Idee aus dem Zug direkt in der Liste.
        </li>
        <li>
          <strong>Einmal pro Woche planen.</strong> Verschieb zwei oder drei Ideen mit Datum und Entwurf in die Tabelle und lösch sie aus
          der Liste.
        </li>
        <li>
          <strong>Entwürfe in eigenen Notizen.</strong> Schreib jeden Beitrag in einer eigenen Notiz und verlinke sie aus dem Redaktionsplan
          mit Bearbeiten, Link hinzufügen (Command-K), dann bleibt der Plan kurz.
        </li>
        <li>
          <strong>Entwürfe taggen.</strong> Tipp #entwurf in jede Entwurfsnotiz, und ein intelligenter Ordner mit einer Regel Tags sammelt
          sie an einem Ort. Lies <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">tags and Smart Folders</a> (auf Englisch),
          falls einer nicht auftaucht.
        </li>
        <li>
          <strong>Jedes Quartal eine neue Notiz.</strong> Wähle Ablage, Notiz duplizieren und räum die veröffentlichten Zeilen aus, dann
          kommen Ideen und Tonalität mit.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"], keys: "⌘K" },
        { on: "Mac", steps: ["Ablage", "Notiz duplizieren"] },
      ]} />
      <p>
        Planst du Beiträge in einem Teammeeting, hält die <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Vorlage für
        Meeting-Protokolle</a> die Entscheidungen fest und wer was schreibt. Weitere Notizen zum Einfügen findest du in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo ein Redaktionsplan in Notizen aufhört</h2>
      <ul>
        <li><strong>Kein Sortieren.</strong> Tabellen in Notizen sortieren nicht. Rutscht ein Beitrag in eine andere Woche, verschiebst du seine Zeile von Hand.</li>
        <li><strong>Der Status ist nur ein Wort.</strong> Nichts verhindert einen Tippfehler, und du kannst dir nicht nur das Geplante anzeigen lassen.</li>
        <li><strong>Das Planen bleibt bei dir.</strong> Aus einer Liste mit Ideen zwei Wochen Beiträge über mehrere Kanäle zu machen ist der langsame Teil, jede Woche.</li>
        <li><strong>Die Tonalität ist eine Erinnerung.</strong> Die drei Regeln stehen in der Notiz, und jeden Entwurf daran zu halten, liegt bei dir.</li>
      </ul>
      <p>
        Für einen Kanal und einen Beitrag pro Woche reicht eine Notiz. Bei mehreren Kanälen wird das Aktuellhalten der Tabelle zur Arbeit.
      </p>

      <h2 id="pinto-notes">Ein Redaktionsplan, der mitplant</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/content-calendar">Content calendar</a> ist eine Notiz
        mit einer Tabelle Calendar, einer Liste Ideas und deiner Voice. In der Tabelle ist Channel eine Auswahl aus Blog, Newsletter,
        LinkedIn, Instagram oder YouTube, und Status ist Idea, Drafting, Scheduled oder Published.
      </p>
      <p>
        Sag deiner KI eine Idee, und sie trägt sie unter Ideas ein. Bitte sie „Plan die nächsten zwei Wochen: zwei LinkedIn-Beiträge und
        einen Newsletter“, und sie nimmt Ideen aus der Liste und legt für jeden Beitrag eine Zeile an, mit Datum, Arbeitstitel, Kanal und
        Drafting. Sie schreibt Entwürfe im Ton, der unter Voice steht, und wenn du sagst, dass ein Beitrag raus ist, setzt sie ihn auf
        Published. „Was ist diese Woche geplant?“ bekommt eine klare Antwort aus der Tabelle. Dieser Teil funktioniert, sobald ChatGPT oder
        Claude verbunden ist, und <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert
        eine Minute. Du kannst weiterhin jede Zeile selbst bearbeiten, und jede frühere Version der Notiz bleibt erhalten.
      </p>
      <p>
        Die Pläne, die du schon in Apple Notizen führst, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
