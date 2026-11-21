import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "entscheidungsprotokoll-vorlage-apple-notizen");

// German version of /blog/apple-notes-decision-log-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "entscheidungsprotokoll" (vorlage, beispiel, englisch), "entscheidungsprotokoll vorlage",
// "decision log vorlage", "entscheidungstagebuch"; "entscheidungslog" only completes to "entscheidungslogik", so the post
// says Entscheidungsprotokoll and names the English "Decision Log" once. Apple's own German words, read 21 Nov 2026, from
// the Mac guide support.apple.com/de-de/guide/notes/apde615d29c2/mac (Bearbeiten, Link hinzufügen, Command-K),
// apdb54e469b6 (anpinnen), apd4e6e2c9a6 (teilen) and apdc88ed7f1d (Tags with #), and support.apple.com/de-de/102462
// (Apple Account). Bearbeiten, Als Markdown einsetzen is in Notes' de strings (MainMenu.loctable) on macOS 27.2. The
// template's headings and field names are plain German team words (Kontext, Optionen, Gewählt, Warum, Neu prüfen).
// Facts are the English post's; the picture is its English one, described in German. Links go to the German meeting
// notes post and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Entscheidungsprotokoll

Jede Entscheidung, die man sich merken sollte: was wir gewählt haben, was nicht und warum. Neueste zuerst.

## Offene Fragen
- Unterstützen wir Offline-Bearbeitung im ersten Release?
- Wer ist nach dem Launch für den Importer zuständig?

## Wir bleiben bei Postgres, 4. November
- Kontext: Die Notizen sind auf 2 Millionen Zeilen gewachsen, und die Suche wurde langsam.
- Optionen: eine Dokumentdatenbank, ein Suchdienst oder bessere Indizes.
- Gewählt: Postgres mit einem Trigramm-Index.
- Warum: nur eine Datenbank zu betreiben, und der Index macht die Suche 40-mal schneller.
- Neu prüfen: bei 20 Millionen Zeilen.

## Release jeden Dienstag, 2. November
- Kontext: Releases haben sich verschoben, sobald ein Fix nicht fertig war.
- Gewählt: jeden Dienstag ausliefern, was fertig ist.
- Warum: Kleine Releases lassen sich leichter zurücknehmen.
`;

const FAQ = [
  { q: "Was gehört in ein Entscheidungsprotokoll?", a: [
    "Zu jeder Entscheidung: das Datum, der Kontext, die Optionen, die ihr erwogen habt, was ihr gewählt habt, warum und wann ihr sie wieder anschaut. Das Warum und die Optionen schreibt man am leichtesten nicht auf, und genau sie braucht man später am meisten.",
  ] },
  { q: "Hat Apple Notizen eine Vorlage für ein Entscheidungsprotokoll?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz mit einer Überschrift pro Entscheidung, die neueste zuerst, funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Sollte ein Entscheidungsprotokoll eine Tabelle oder eine Liste sein?", a: [
    "In einer Tabellenkalkulation eine Tabelle. In Apple Notizen liest sich eine Überschrift pro Entscheidung besser: Die Spaltenbreite lässt sich nicht ziehen, und ein langes Warum wird in eine schmale Zelle gequetscht.",
  ] },
  { q: "Gibt es ein Entscheidungsprotokoll, das beantwortet, warum wir etwas gewählt haben?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für ein Entscheidungsprotokoll. Sag ChatGPT oder Claude, was ihr entschieden habt, und es schreibt den Kontext, die Optionen und das Warum auf. Fragst du später, warum ihr etwas gewählt habt, zitiert es den Eintrag.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="entscheidungsprotokoll-vorlage-apple-notizen"
      intro={<>
        Teams diskutieren geklärte Fragen neu, weil niemand aufgeschrieben hat, warum sie geklärt wurden. Ein Entscheidungsprotokoll
        (Decision Log) behebt das, und dafür brauchst du weder Confluence noch eine Tabellenkalkulation. Hier ist eine Vorlage für ein
        Entscheidungsprotokoll in Apple Notizen, wie du es führst und wo es aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#dranbleiben", label: "Dranbleiben" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Protokoll, das sich das Warum merkt" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für ein Entscheidungsprotokoll, aber eine Notiz erledigt das: oben die offenen Fragen, dann eine
            Überschrift pro Entscheidung mit ihrem Datum und darunter der Kontext, die Optionen, was ihr gewählt habt, warum und wann ihr sie
            neu prüft. Die neueste zuerst, damit du die letzten Entscheidungen als Erstes liest.
          </p>
          <PostCta template="decision-log" slug="de/entscheidungsprotokoll-vorlage-apple-notizen" path="/de/blog/entscheidungsprotokoll-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du Entscheidungen für dich protokollieren lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat ein kostenloses Entscheidungsprotokoll. Sag ChatGPT oder Claude, was ihr entschieden habt, und es schreibt die Optionen und das Warum auf und findet es wieder, wenn du fragst.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/decision-log-note" width={1520} height={1055} maxWidth={600}
        alt="Eine Notiz Decision log in Pinto Notes auf dem Mac: zwei offene Fragen, dann eine Entscheidung Stay on Postgres vom 4. November mit Kontext, Optionen, Wahl, Begründung und wann sie neu geprüft wird, und darunter eine Entscheidung Release every Tuesday."
        caption="Ein Entscheidungsprotokoll in Pinto Notes, so wie die Vorlage es schreibt. Derselbe Aufbau funktioniert in Apple Notizen. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Überschrift pro Entscheidung</h2>
      <p>
        Jeder Eintrag sind fünf kurze Zeilen. Kontext sagt, was die Entscheidung erzwungen hat. Optionen nennt, was ihr nicht genommen habt,
        und genau diese Zeile verhindert, dass dieselbe Idee im nächsten Quartal wiederkommt. Neu prüfen sagt, wann sich die Antwort ändern
        könnte, damit sie nicht als endgültig gilt. Kleine Entscheidungen können Optionen weglassen, wie das Release am Dienstag unten.
      </p>
      <Keep title="Entscheidungsprotokoll für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"], keys: "⌘K" },
      ]} />
      <ul>
        <li>
          <strong>Einmal einfügen.</strong> Leg auf einem Mac mit macOS 27 eine Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die
          Zeile mit # wird zum Titel und jede Zeile mit ## zu einer Überschrift. Ein normales Command-V lässt die Zeichen als Text stehen. Auf
          dem iPhone tippst du sie ab.
        </li>
        <li>
          <strong>Ein Protokoll pro Projekt.</strong> Bewahre es im Ordner des Projekts auf und pinne es oben an, dann liegt es neben den
          Notizen, die es erklärt.
        </li>
        <li>
          <strong>Mit dem Team teilen.</strong> Nutzen alle Apple Notizen, teile die Notiz, damit jede Person ihre eigenen Entscheidungen
          eintragen kann. Alle brauchen einen Apple Account.
        </li>
      </ul>

      <h2 id="dranbleiben">Dranbleiben</h2>
      <ul>
        <li>
          <strong>Am selben Tag eintragen.</strong> Das Warum ist am Ende des Meetings, in dem ihr entschieden habt, am klarsten. Eine Woche
          später ist es schon geraten.
        </li>
        <li>
          <strong>Geklärte Fragen nach unten holen.</strong> Ist eine offene Frage entschieden, lösch sie unter Offene Fragen und schreib
          ihren Eintrag ganz oben über die Entscheidungen.
        </li>
        <li>
          <strong>Von dort verlinken, wo es aufkam.</strong> Markiere in der Meeting-Notiz die Entscheidung und wähle Bearbeiten, Link
          hinzufügen, um auf das Protokoll zu zeigen. So bleiben das Meeting und die Gründe verbunden.
        </li>
        <li>
          <strong>Erst suchen, dann neu diskutieren.</strong> Die Suche liest jedes Wort in jeder Notiz, also findet „Postgres“ den Eintrag,
          bevor jemand ein Meeting dazu ansetzt. Ein Tag #entscheidung an Meeting-Notizen, die etwas verändert haben, hilft auch.
        </li>
      </ul>
      <p>
        Die meisten Entscheidungen fallen in einem Meeting, und die <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Vorlage für
        Meeting-Protokolle</a> hat genau dafür eine Überschrift Entscheidungen. Weitere Notizen zum Einfügen findest du in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo ein Entscheidungsprotokoll in Notizen aufhört</h2>
      <ul>
        <li><strong>Jemand muss es schreiben.</strong> Nach einem langen Meeting ist das Protokoll das Erste, was ausfällt.</li>
        <li><strong>Das Warum geht verloren.</strong> Nichts fragt nach dem Grund, wenn jemand nur die Wahl einträgt.</li>
        <li><strong>Die Suche findet Wörter, keine Antworten.</strong> Sie findet jede Notiz, in der Stripe steht. „Warum haben wir Stripe statt Paddle genommen?“ beantwortet sie nicht.</li>
        <li><strong>Teilen braucht einen Apple Account.</strong> Jede Person im Team braucht einen, um das geteilte Protokoll zu öffnen und zu bearbeiten.</li>
      </ul>

      <h2 id="pinto-notes">Ein Entscheidungsprotokoll, das sich das Warum merkt</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/decision-log">Decision log</a> ist eine Notiz mit
        offenen Fragen und Entscheidungen, die neueste zuerst.
      </p>
      <p>
        Erzähl deiner KI in deinen eigenen Worten von einer Entscheidung. Sie setzt oben einen Eintrag mit der Entscheidung in ein paar Worten
        und dem Datum ein, dann Kontext, erwogene Optionen, was ihr gewählt habt, warum und wann ihr sie neu prüft, je eine kurze Zeile. Hast
        du nicht gesagt, warum, fragt sie nach. Fragen, die ihr noch nicht geklärt habt, kommen unter die offenen Fragen und verschwinden von
        der Liste, sobald sie entschieden sind. Frag Monate später „Warum haben wir Stripe statt Paddle genommen?“, und sie findet den Eintrag
        und zitiert ihn, oder frag „Was ist noch nicht entschieden?“. Du kannst weiterhin jeden Eintrag selbst schreiben und bearbeiten, und
        jede frühere Version der Notiz bleibt erhalten. Dieser Teil funktioniert, sobald ChatGPT oder Claude verbunden ist.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        In <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Claude Code</a> (auf Englisch) hat die Vorlage eigene Anweisungen
        für die technischen Entscheidungen eines Projekts. Legt ihr euch auf eine Bibliothek, ein Schema oder eine Architektur fest, trägt
        Claude Code den Eintrag mit den betroffenen Dateien ein, und bevor es eine Änderung vorschlägt, liest es das Protokoll, um zu prüfen,
        dass es keine Entscheidung rückgängig macht.
      </p>
      <p>
        Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch)
        mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
