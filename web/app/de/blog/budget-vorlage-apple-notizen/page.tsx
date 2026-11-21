import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "budget-vorlage-apple-notizen");

// German version of /blog/apple-notes-budget-template (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "budget vorlage" (kostenlos, pdf, excel), "budgetplaner vorlage", "monatsbudget vorlage", "haushaltsbuch
// iphone", "apple notizen rechnen", "apple notizen tabelle summe", "apple notizen tabelle rechnen"; "budget iphone
// notizen" itself has no suggestions. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apda85974595/mac ("Mathematische Rechnungen mit der App Notizen auf dem Mac
// lösen": Variablen, Format, Mathematische Ergebnisse with Ergebnisse einfügen, Ergebnisse vorschlagen and Aus, the
// Zeilenschalter to keep a suggestion) and de-de/guide/notes/apd0a136b9cc/mac (Tabelle). Ablage, Notiz duplizieren is
// in Notes' de strings (MainMenu.loctable) on macOS 27.2. The variable names in the template have no umlauts, since
// Apple says variables work in the Latin alphabet. Facts are the English post's; the screenshots are its English ones,
// described in German. Links go to the English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `Budget, November

Einkommen = 3200

Miete = 1200
Essen = 450
Fahrtkosten = 120
Handy = 30
Freizeit = 150
Sparen = 500

Miete + Essen + Fahrtkosten + Handy + Freizeit + Sparen =
Einkommen - Miete - Essen - Fahrtkosten - Handy - Freizeit - Sparen =
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Budget-Vorlage?", a: [
    "Nein. Apple Notizen hat überhaupt keine Vorlagen. Du kannst aber eine Budget-Notiz anlegen, die selbst rechnet: Gib jedem Betrag in einer eigenen Zeile einen Namen, addiere dann die Namen mit einem Gleichheitszeichen am Ende, und Mathematische Ergebnisse trägt die Summe ein.",
  ] },
  { q: "Kann Apple Notizen rechnen?", a: [
    "Ja, mit Mathematische Ergebnisse. Tipp eine Rechnung mit einem Gleichheitszeichen am Ende, und Notizen schlägt das Ergebnis vor. Benannte Beträge wie Miete = 1200 kannst du in späteren Rechnungen verwenden, und änderst du einen, ändern sich alle Ergebnisse darunter.",
  ] },
  { q: "Warum rechnet meine Budget-Tabelle in Apple Notizen nicht?", a: [
    "Mathematische Ergebnisse funktioniert nicht in einer Tabelle. Behalte die Tabelle zum Lesen, wenn du willst, und schreib die benannten Beträge und die Rechnungen als normale Zeilen darunter.",
  ] },
  { q: "Gibt es eine kostenlose Budget-App, die wie eine Notiz funktioniert?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für Budget und Ausgaben: eine Notiz, die eine kleine App ist, mit dem, was diesen Monat übrig ist, jeder Kategorie gegen ihr Budget, monatlichen Rechnungen und den letzten sechs Monaten. ChatGPT oder Claude können eintragen, was du ausgegeben hast.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="budget-vorlage-apple-notizen"
      intro={<>
        Du willst ein Budget dort, wo du sowieso alles aufschreibst, und keine weitere App mit Anmeldung. Apple Notizen kann davon mehr,
        als du denkst. Hier ist eine Vorlage zum Einfügen, die sich selbst addiert, wo sie aufhört, und was du nimmst, wenn sie nicht
        mehr reicht.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#so-rechnet-sie", label: "So rechnet sie" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Budget, das sich selbst führt" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlagen, aber eine Budget-Notiz kann trotzdem rechnen. Schreib jeden Betrag mit einem Namen in eine
            eigene Zeile, etwa Miete = 1200, und addiere dann die Namen mit einem Gleichheitszeichen am Ende. Mathematische Ergebnisse
            trägt die Summe ein und was übrig bleibt. Kopiere die Vorlage unten in eine neue Notiz.
          </p>
          <PostCta template="budget-log" slug="de/budget-vorlage-apple-notizen" path="/de/blog/budget-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du ein Budget, das sich selbst führt?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Budget und Ausgaben: was diesen Monat übrig ist, jede Kategorie gegen ihr Budget und Rechnungen, die jeden Monat kommen. Sag ChatGPT oder Claude, was du ausgegeben hast, und es trägt es ein.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Eine Notiz namens Sequoia Group Expenses auf dem iPhone: jede Ausgabe mit Namen in einer eigenen Zeile, die Namen addiert zu 475 $ und 475 $ geteilt durch 5 ergibt 95 $ pro Person."
        caption="Apples eigenes Beispiel für den Trick, auf dem eine Budget-Notiz beruht: jeden Betrag benennen, dann die Namen addieren. Bild: Apple." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: ein Monatsbudget, das sich selbst addiert</h2>
      <p>
        Leg eine neue Notiz an und füge das hier ein. Ersetze Beträge und Namen durch deine eigenen. Jeder Name funktioniert, solange du ihn
        jedes Mal gleich schreibst.
      </p>
      <Keep title="Monatsbudget für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Notizen schlägt nach jedem Gleichheitszeichen das Ergebnis vor. Drück den Zeilenschalter, um es zu übernehmen." />
      <p>
        Die erste Rechnung ist, was du ausgeben willst. Die zweite ist, was übrig bleibt, wenn alles, auch das Sparen, von deinem Einkommen
        abgezogen ist. Liegt das zweite Ergebnis unter null, geht der Plan nicht auf.
      </p>
      <p>
        Leg eine Notiz pro Monat an. Auf dem Mac kopiert Ablage, Notiz duplizieren die vom letzten Monat, dann änderst du nur den Titel und
        die Beträge, die sich bewegt haben. Wenn du auch andere Vorlagen nutzt, zeigt <a href="/blog/apple-notes-templates" hrefLang="en">Apple
        Notes templates</a> (auf Englisch), wie du einen Ordner für Vorlagen einrichtest.
      </p>

      <h2 id="so-rechnet-sie">So rechnet sie</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="Eine Tabelle Moving budget in Apple Notizen unter macOS 27. In der Zelle Total steht 85+240+180= ohne Ergebnis. Unter der Tabelle sind Boxes = 85, Van = 240 und Cleaning = 180 benannt, und bei Boxes + Van + Cleaning = schlägt Notizen 505 vor."
        caption="Unter macOS 27: In einer Tabelle bleibt die Rechnung einfach stehen. Als benannte Zeilen darunter antwortet Notizen: 505." />
      <Paths rows={[{ on: "Mac", steps: ["Format", "Mathematische Ergebnisse"] }]} />
      <p>
        Notizen nennt das Mathematische Ergebnisse. Eine Zeile wie Miete = 1200 gibt der Zahl einen Namen, und jede spätere Zeile, die mit
        einem Gleichheitszeichen endet, bekommt ihr Ergebnis. Ändere Essen von 450 auf 500, und beide Summen ziehen mit. Mehr tut eine
        Tabellenkalkulation für ein Budget meist auch nicht. Erscheint auf dem Mac kein Ergebnis, prüf unter Format,
        Mathematische Ergebnisse, dass nicht „Aus“ gewählt ist.
      </p>
      <p>
        Ein Haken: In einer Tabelle funktioniert es nicht. Mathematische Ergebnisse schaltet sich ab, solange du in einer bist, und eine
        Zelle Summe bleibt einfach Text. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt,
        was Tabellen können und was nicht.
      </p>

      <p>
        Für Weihnachten und Geburtstage kannst du in Apple Notizen eine Geschenkideen-Liste mit einem Budget pro Person führen. Für Arbeiten am Haus, die Geld kosten, wenn du sie vergisst, kannst du eine Checkliste anlegen.
      </p>

      <h2 id="grenzen">Wo ein Budget in Apple Notizen aufhört</h2>
      <ul>
        <li><strong>Ausgaben trägst du von Hand ein.</strong> Um zu verfolgen, was du wirklich ausgegeben hast, schreibst du für jeden Einkauf eine Zeile und einen Namen mehr in die Rechnung. Nach ein paar Wochen wird die Rechnung lang.</li>
        <li><strong>Keine Monate nebeneinander.</strong> Jeder Monat ist eine eigene Notiz. Um diesen Monat mit den letzten sechs zu vergleichen, öffnest du sechs Notizen.</li>
        <li><strong>Keine wiederkehrenden Rechnungen.</strong> Miete und Abos tippst du in jede Monatsnotiz neu.</li>
        <li><strong>Keine Kategorien mit Limit.</strong> Du siehst, was insgesamt übrig ist, aber nicht, dass Essengehen drüber und Fahrtkosten drunter liegen.</li>
      </ul>
      <p>
        Für einen Plan, den du einmal im Monat machst, reicht die Notiz. Willst du Ausgaben eintragen, sobald sie anfallen, ist bei der Notiz
        Schluss.
      </p>

      <h2 id="pinto-notes">Eine Budget-Notiz, die sich selbst führt</h2>
      <Figure shot={{ ...SHOTS.budgetApp, alt: "Die Budget-App in einer Notiz in Pinto Notes auf dem Mac: 8.205 kr übrig im Oktober, nach Rechnungen etwa 410 kr pro Tag, ein Diagramm der letzten sechs Monate, die Rechnungen dieses Monats und jede Kategorie gegen ihr Budget mit dem, was übertragen wurde." }}
        caption="Die Vorlage Budget und Ausgaben in Pinto Notes auf dem Mac, mit Beispieldaten: was diesen Monat übrig ist, die letzten sechs Monate, Rechnungen und jede Kategorie gegen ihr Budget." />
      <p>
        Dafür gibt es Pinto Notes. Es sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und eine Notiz kann auch eine kleine
        App sein. Die kostenlose Vorlage <a href="/templates/budget-log">Budget und Ausgaben</a> ist so eine: Du legst einmal ein
        Monatsbudget pro Kategorie fest, und sie zeigt mit einem Balken, was diesen Monat übrig ist, jede Kategorie gegen ihr Budget mit
        dem, was übertragen wurde, deine monatlichen Rechnungen und die letzten sechs Monate. Eine Ausgabe trägst du mit einem Tippen ein,
        und sie rechnet.
      </p>
      <p>
        Du kannst auch ChatGPT oder Claude im Chat, den du schon nutzt, sagen, was du ausgegeben hast, und es trägt die Ausgabe in die Notiz
        ein. Die App rechnet, nicht die KI. <a href="/blog/budget-tracker-with-chatgpt-or-claude" hrefLang="en">A budget your AI can keep for
        you</a> (auf Englisch) zeigt, wie das funktioniert.
      </p>
      <p>
        Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch)
        mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
