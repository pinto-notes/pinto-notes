import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "geschenkideen-liste-apple-notizen");

// German version of /blog/apple-notes-gift-ideas (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "geschenkideen liste" (frauen, weihnachten, männer), "geschenkideen sammeln", "geschenkeliste" (erstellen,
// weihnachten vorlage), "geschenkeliste vorlage", "geschenkeliste app", "geschenkideen app"; "geschenkideen notizen"
// and "geschenkideen notieren" have no suggestions. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd0a136b9cc/mac ("Hinzufügen einer Tabelle": Format, Tabelle, two rows and two
// columns, the Tabulatortaste in the last cell adds a row), de-de/guide/notes/apd93c815aa0/mac (Markierte Einträge
// automatisch sortieren; Format, Mehr, Alles deaktivieren), de-de/guide/notes/apdb54e469b6/mac (anpinnen) and
// de-de/guide/notes/apda85974595/mac (Mathematische Ergebnisse). Bearbeiten, Als Markdown einsetzen and Notiz sperren
// are Notes' de strings (MainMenu.loctable) on macOS 27.2. The table button is described as the German Cornell post
// does. The English example budgets are Swedish kronor; here they are in euros at about a tenth, so the sums in the
// text follow (50 + 250 =, ideas under 50 euros). The Pinto template keeps its English name, Gift ideas, as the app shows
// it. Facts are the English post's; the picture is its English one, described in German. Links go to the German budget
// post and to English posts where no German one exists.

const ui = UI.de;

const SKELETON = `# Geschenkideen

## Ideen
Hier die Tabelle einfügen.

## Größen und Vorlieben
- Maja: kocht viel, hat schon eine Küchenmaschine.
- Jonas: Größe M, mag alles in Grün.
- Mama: keine Sachen mehr; sie unternimmt lieber etwas zusammen.
- Papa: hat jeden Schal, den sein Verein verkauft.

## Weihnachten
- [ ] Mama
- [ ] Papa
- [ ] Jonas
`;

// Tabs between the columns: select these lines in Notes and turn them into a table.
const TABLE = `Person\tAnlass\tIdee\tBudget (€)\tStatus
Maja\tEinweihung\tEin gutes Kochmesser\t90\tIdee
Papa\tWeihnachten\tKarten fürs Fußballspiel\t50\tGekauft
Jonas\tGeburtstag\tEine grüne Wollmütze\t30\tIdee
Mama\tWeihnachten\tEin Wochenende weg\t250\tIdee
Emma\tDankeschön\tGutes Olivenöl\t20\tVerschenkt
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für eine Geschenkeliste?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz mit einer Tabelle der Ideen nach Person und einer Liste mit Größen und Vorlieben funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Wie führe ich eine Geschenkeliste für Weihnachten auf dem iPhone?", a: [
    "Führ eine Notiz mit einer Checkliste aller, für die du etwas kaufst, und hake jeden Namen ab, sobald das Geschenk gekauft ist. Pinne die Notiz an, dann ist sie oben, wenn du im Laden stehst.",
  ] },
  { q: "Kann ich eine Geschenkeliste in Apple Notizen verstecken?", a: [
    "Ja. Sperr die Notiz mit einem Passwort oder Face ID oder Touch ID, dann bleibt ihr Inhalt verborgen, bis du sie entsperrst.",
  ] },
  { q: "Gibt es eine App für Geschenkideen, die sich merkt, was Leute mögen?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Geschenkideen. Sag ChatGPT oder Claude, was jemandem gefallen würde, und es speichert das und schlägt vor einem Geburtstag Geschenke im Budget vor.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="geschenkideen-liste-apple-notizen"
      intro={<>
        Die perfekte Geschenkidee kommt im März, nebenbei, und im Dezember ist sie weg. Eine Notiz, in die du sie schreibst, sobald du sie
        hörst, löst das. Hier ist eine Liste für Geschenkideen in Apple Notizen, nach Person, mit Budgets und Größen, bereit für Weihnachten
        und jeden Geburtstag danach.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#das-jahr", label: "Übers Jahr" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Eine Liste, die Geschenke vorschlägt" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für eine Geschenkeliste, aber eine Notiz erledigt das: eine Tabelle mit der Person, dem Anlass,
            der Idee, einem Budget und ob es gekauft ist, dann eine Liste mit Größen und Vorlieben für jede Person. Pinne sie an und schreib
            eine Idee auf, sobald du sie hörst.
          </p>
          <PostCta template="gift-ideas" slug="de/geschenkideen-liste-apple-notizen" path="/de/blog/geschenkideen-liste-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du Geschenkideen speichern, sobald du sie hörst?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Liste für Geschenkideen. Sag ChatGPT oder Claude, was jemandem gefallen würde, und es trägt die Idee ein und schlägt vor einem Geburtstag Geschenke im Budget vor.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/gift-ideas-note" width={1520} height={1057} maxWidth={600}
        alt="Eine Notiz Gift ideas in Pinto Notes auf dem Mac: eine Tabelle Ideas mit fünf Geschenken für Maja, Dad, Jonas, Mum und Emma mit dem Anlass, einem Budget in Kronen und einem Status, und eine Liste Sizes and likes für vier Personen."
        caption="Eine Liste mit Geschenkideen in Pinto Notes, in der Budget eine Zahl und Status eine Auswahl ist. In Apple Notizen hält dieselbe Tabelle sie als getippten Text." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: Ideen nach Person, Größen und Vorlieben</h2>
      <p>
        Die Tabelle hält jede Idee, eine Zeile pro Idee, so siehst du auf einen Blick, für wen du etwas hast und für wen nicht. Die Liste mit
        Größen und Vorlieben ist das, was du übers Jahr über die Leute erfährst: eine Größe, eine Lieblingsfarbe, was sie schon haben. Die
        Checkliste Weihnachten zeigt, für wen du noch ein Geschenk brauchst. Die Notiz kommt in zwei Teilen: zuerst die Überschriften und
        Listen, dann die Tabelle.
      </p>
      <Keep title="Geschenkideen für Apple Notizen" text={SKELETON} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus den Namen unter Weihnachten eine Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem
        iPhone tippst du sie ab, markierst die Namen und tippst auf die Checklisten-Taste. Ersetze dann die Zeile unter Ideen durch die
        Tabelle.
      </p>
      <Keep title="Tabelle für die Ideen" text={TABLE} copyLabel={ui.copy}
        note="Jede Zeile hat einen Tab zwischen den Spalten. Füg sie ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füg die Tabellenzeilen unter Ideen ein, markiere die sechs Zeilen von Person
          bis zum letzten Geschenk und klicke in der Symbolleiste auf die Taste für Tabellen. Jeder Tab wird zu einer Spalte.
        </li>
        <li>
          <strong>Oder leer anfangen.</strong> Wähle Format, Tabelle für zwei Zeilen und zwei Spalten, und die Tabulatortaste in der letzten
          Zelle fügt die nächste Zeile hinzu.
        </li>
        <li>
          <strong>Halte jede Idee kurz.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen. „Eine grüne
          Wollmütze“ reicht, die Einzelheiten kommen unter Größen und Vorlieben.
        </li>
        <li>
          <strong>Sperr sie, wenn die Familie deinen Mac mitbenutzt.</strong> Eine gesperrte Notiz öffnet sich nur mit deinem Passwort oder
          Face ID oder Touch ID.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt alles, was eine Tabelle in Notizen
        kann und was nicht.
      </p>

      <h2 id="das-jahr">Übers Jahr, und an Weihnachten</h2>
      <ul>
        <li>
          <strong>Anpinnen.</strong> Eine angepinnte Notiz steht oben in ihrem Ordner, so landet eine Idee vom Abendessen darin, bevor du sie
          vergisst.
        </li>
        <li>
          <strong>Nach Namen suchen.</strong> Die Suche in Notizen liest jedes Wort, also findet eine Suche nach „Jonas“ seine Zeile und
          seine Größe.
        </li>
        <li>
          <strong>Die Budgets selbst zusammenrechnen.</strong> Tabellen rechnen nicht, aber Mathematische Ergebnisse rechnet, was du tippst.
          Tipp unter der Tabelle 50 + 250 =, und Notizen gibt dir die Summe für Weihnachten bisher.
        </li>
        <li>
          <strong>Namen beim Kaufen abhaken.</strong> Ist „Markierte Einträge automatisch sortieren“ aktiviert, rücken die Leute, die noch
          fehlen, in der Liste Weihnachten nach oben.
        </li>
        <li>
          <strong>Nächsten Dezember zurücksetzen.</strong> Klicke in die Liste Weihnachten und wähle Format, Mehr, Alles deaktivieren.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] }]} />
      <p>
        Um die Ausgaben der ganzen Saison im Blick zu behalten, rechnet sich die <a href="/de/blog/budget-vorlage-apple-notizen">Budget-Vorlage
        für Apple Notizen</a> mit Mathematische Ergebnisse selbst zusammen. Weitere Notizen zum Einfügen findest du in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo eine Geschenkeliste in Notizen aufhört</h2>
      <ul>
        <li><strong>Ideen kommen woanders an.</strong> Eine Freundin erwähnt in einer Nachricht ein Buch, und es landet nur in der Notiz, wenn du anhältst und es hinüberkopierst.</li>
        <li><strong>Kein Sortieren.</strong> Tabellen in Notizen sortieren nicht, also heißt alles für eine Person oder einen Anlass sehen, die ganze Tabelle lesen.</li>
        <li><strong>Die Summe des Budgets geht von Hand.</strong> Du tippst die Rechnung jedes Mal neu, wenn sich eine Idee ändert.</li>
        <li><strong>Das Aussuchen bleibt bei dir.</strong> Größen, Vorlieben und Budgets stehen alle in der Notiz, und daraus drei Wochen vor einem Geburtstag ein Geschenk zu machen, bleibt deine Sache.</li>
      </ul>
      <p>
        Für eine Handvoll Leute ist eine Notiz alles, was du brauchst. Für ein Familien-Weihnachten und ein Jahr voller Geburtstage ist das
        Aktuellhalten die Arbeit.
      </p>

      <h2 id="pinto-notes">Eine Geschenkeliste, die Geschenke vorschlägt</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/gift-ideas">Gift ideas</a> ist eine Notiz mit einer
        Tabelle Ideas und einer Liste Sizes and likes. In der Tabelle ist Budget eine Zahl und Status eine Auswahl aus Idea, Bought oder
        Given.
      </p>
      <p>
        Erwähne etwas, das jemandem gefallen würde, und deine KI fügt eine Zeile hinzu: die Person, den Anlass, wenn du einen genannt hast,
        die Idee, das Budget, wenn du eins genannt hast, und Idea als Status. Sag „Jonas trägt Größe M und mag alles in Grün“, und es kommt
        unter Sizes and likes. Frag „Papa hat in drei Wochen Geburtstag. Ideen unter 50 Euro?“, und sie schlägt drei Geschenke im Budget
        vor, die zu dem passen, was in der Notiz steht. Kaufst du eins, setzt sie den Status auf Bought. Dieser Teil funktioniert, sobald
        ChatGPT oder Claude verbunden ist, und <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf
        Englisch) dauert eine Minute. Du kannst weiterhin jede Zeile selbst bearbeiten, und jede frühere Version der Notiz bleibt erhalten.
      </p>
      <p>
        Die Listen, die du schon in Apple Notizen führst, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
