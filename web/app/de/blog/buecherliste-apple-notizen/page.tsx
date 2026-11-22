import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "buecherliste-apple-notizen");

// German version of /blog/apple-notes-reading-list (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "bücherliste vorlage" (pdf, excel), "bücherliste erstellen", "bücherliste app" (kostenlos), "gelesene bücher
// liste", "buch tracker" (app, vorlage), "lese tracker vorlage", "leseliste vorlage". "Leseliste" alone is Safari's
// Leseliste in nearly every suggestion (leseliste iphone, leseliste löschen mac), so this post says Bücherliste. Apple's
// own German words, read 21 Nov 2026, from the Mac guide support.apple.com/de-de/guide/notes/apd0a136b9cc/mac
// ("Hinzufügen einer Tabelle": Format, Tabelle, the Tabulatortaste in the last cell adds a row, selected paragraphs become
// a table), apd93c815aa0 (Markierte Einträge automatisch sortieren), apdb54e469b6 (anpinnen) and apd4e6e2c9a6 (teilen),
// and support.apple.com/de-de/102462 (Apple Account). Bearbeiten, Als Markdown einsetzen is in Notes' de strings
// (MainMenu.loctable) on macOS 27.2. Paste as Markdown is not used for the table, as in the English post. The books are
// their German editions (Der Astronaut, Alles, was wir geben mussten, Die Wurzeln des Lebens); the Notes line is
// Anmerkungen, so it isn't read as the app's name. The Pinto template's Status choices stay in English, since the app is
// in English. Facts are the English post's; the picture is its English one, described in German. Links go to the German
// book notes post and to English posts where no German one exists.

const ui = UI.de;

// Tabs between the columns: select the six table lines in Notes and turn them into a table.
const TEMPLATE = `Bücherliste

Titel\tAutor\tStatus\tBewertung\tWarum
Der Astronaut\tAndy Weir\tGelesen\t5\tBuchclub
Piranesi\tSusanna Clarke\tLese ich\tNoch nicht\tVon Jonas
Krieg und Frieden\tLeo Tolstoi\tAbgebrochen\t2\tAufgegeben, S. 90
Alles, was wir geben mussten\tKazuo Ishiguro\tGelesen\t4\tUrlaubslektüre
Die Wurzeln des Lebens\tRichard Powers\tZu lesen\tNoch nicht\tVon Sara geliehen

Anmerkungen
Der Astronaut: Die Freundschaft trägt das ganze Buch. Mein Exemplar leihe ich als Nächstes Papa.
Alles, was wir geben mussten: Leise und seltsam. Ich habe noch wochenlang daran gedacht.
`;

const SIMPLE = `# Bücherliste

## Zu lesen
- [ ] Piranesi von Susanna Clarke (von Jonas)
- [ ] Die Wurzeln des Lebens von Richard Powers (von Sara geliehen)

## Gelesen
- Der Astronaut von Andy Weir: 5 von 5
- Alles, was wir geben mussten von Kazuo Ishiguro: 4 von 5
`;

const FAQ = [
  { q: "Wie mache ich eine Bücherliste in Apple Notizen?", a: [
    "Leg eine Notiz Bücherliste an, mit einer Tabelle aus Titel, Autor, Status, Bewertung und Warum. Einfacher geht es mit einer Checkliste der Bücher, die du lesen willst: Hake jedes ab, wenn du es fertig hast.",
  ] },
  { q: "Kann ich meine Bücherliste in Apple Notizen sortieren?", a: [
    "Nein. Tabellen in Notizen lassen sich nicht sortieren, also bleiben die Bücher in der Reihenfolge, in der du sie eingetragen hast. Eine Checkliste kann abgehakte Bücher nach unten schieben, wenn du in den Einstellungen von Notizen „Markierte Einträge automatisch sortieren“ aktivierst.",
  ] },
  { q: "Kann ich eine Bücherliste mit meinem Buchclub teilen?", a: [
    "Ja. Teile die Notiz, und alle können etwas eintragen, aber jede Person braucht einen Apple Account.",
  ] },
  { q: "Gibt es eine App für Bücherlisten, die wie Apple Notizen funktioniert?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für eine Bücherliste mit Status und einer Bewertung von 1 bis 5. Erzähl ChatGPT oder Claude von einem Buch, und es trägt es ein; frag, was du als Nächstes lesen sollst, und es schlägt eins aus deiner Liste vor.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="buecherliste-apple-notizen"
      intro={<>
        Bücher, die dir jemand empfiehlt, landen in Screenshots, Nachrichten und Browser-Tabs, und wenn du etwas zum Lesen suchst, sind sie
        weg. Apple Notizen kann sie in einer Notiz sammeln. Hier ist eine Vorlage für eine Bücherliste in Apple Notizen, eine einfachere
        Version als Checkliste und wo Notizen aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#checkliste", label: "Als einfache Checkliste" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Eine Liste, die sich selbst führt" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für eine Bücherliste, aber eine Notiz mit einer Tabelle erledigt das: Titel, Autor, Status, eine
            Bewertung bis 5 und warum du das Buch lesen wolltest. Füg eine Zeile hinzu, wenn dir jemand ein Buch empfiehlt, und schreib ein
            paar Zeilen unter Anmerkungen, wenn du eins fertig hast.
          </p>
          <PostCta template="reading-list" slug="de/buecherliste-apple-notizen" path="/de/blog/buecherliste-apple-notizen" position="answer" ui={ui.cta}
            title="Sollen deine Bücher für dich eingetragen werden?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für eine Bücherliste. Erzähl ChatGPT oder Claude von einem Buch, und es fügt die Zeile hinzu; frag, was du als Nächstes lesen sollst, und es wählt aus deiner Liste.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/reading-list-note" width={1520} height={1153} maxWidth={600}
        alt="Eine Notiz Reading list in Pinto Notes auf dem Mac: eine Tabelle Books mit fünf Büchern mit Titel, Autor, Status, Bewertung und Warum, von Project Hail Mary, gelesen mit einer 5, bis The Overstory, noch zu lesen, darunter Anmerkungen zu zwei Büchern."
        caption="Eine Bücherliste in Pinto Notes, in der Status eine Auswahl ist und Bewertung eine Skala von 1 bis 5. Beispieldaten. In Apple Notizen funktioniert dieselbe Tabelle mit getippten Wörtern." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Tabelle mit Büchern</h2>
      <p>
        Fünf Spalten reichen. Status ist eines von vier Wörtern: Zu lesen, Lese ich, Gelesen oder Abgebrochen. Für die Spalte Warum wirst du
        dir dankbar sein: In einem Jahr sagt dir „Von Jonas“ mehr als der Titel. Abgebrochene Bücher bleiben auf der Liste, damit du sie
        nicht aus Versehen wieder anfängst.
      </p>
      <Keep title="Bücherliste für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Jede Tabellenzeile hat einen Tab zwischen den Spalten. Füg sie ein und mach dann aus diesen Zeilen eine Tabelle." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Einfügen, dann die Tabelle machen.</strong> Füg die Vorlage in eine neue Notiz ein, markiere die sechs Zeilen von Titel bis
          Die Wurzeln des Lebens und klicke in der Symbolleiste auf die Taste für Tabellen. Jeder Tab wird zu einer Spalte, so stehen fünf
          Spalten nebeneinander.
        </li>
        <li>
          <strong>Ein Buch in einer Sekunde eintragen.</strong> Klick in die letzte Zelle und drück die Tabulatortaste: Eine neue Zeile für
          das nächste Buch erscheint.
        </li>
        <li>
          <strong>Halte die Zellen kurz.</strong> Notizen legt die Spaltenbreiten selbst fest, und du kannst sie nicht ziehen, also teilen
          sich fünf Spalten den Platz. Längere Gedanken kommen unter Anmerkungen, unter die Tabelle.
        </li>
        <li>
          <strong>Pinne sie an.</strong> Pinne die Notiz oben in ihrem Ordner an, dann siehst du sie als Erstes, wenn jemand sagt „Das musst
          du unbedingt lesen“.
        </li>
      </ul>
      <p>
        Die Suche liest jedes Wort in der Notiz, also findet die Suche nach einem Autor oder dem Namen einer Freundin die Liste. Um sie mit
        einem Buchclub zu teilen, teile die Notiz; jede Person braucht einen Apple Account.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt alles andere, was eine Tabelle kann
        und was nicht.
      </p>

      <h2 id="checkliste">Eine einfachere Version als Checkliste</h2>
      <p>
        Wenn dir eine Tabelle zu viel ist, funktioniert eine Checkliste. Bücher, die du lesen willst, stehen in einer Checkliste, und du
        hakst eins ab, wenn du es fertig hast. Lass in jeder Zeile ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das
        Einfügen nicht.
      </p>
      <Keep title="Bücher-Checkliste für Apple Notizen" text={SIMPLE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus den Zeilen mit ##
        Überschriften und aus den Büchern eine Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst
        du sie ein, markierst die Bücher und tippst auf die Checklisten-Taste. Aktiviere in den Einstellungen von Notizen „Markierte
        Einträge automatisch sortieren“, dann rutschen die Bücher, die du gelesen hast, nach unten. Willst du dir eins merken, schieb es mit
        einer Bewertung unter Gelesen.
      </p>
      <p>
        Willst du mehr festhalten als eine Bewertung, notiere zu jedem Buch in Apple Notizen Zitate, deine Gedanken und die Kernidee. Weitere Notizen zum Einfügen findest du in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo eine Bücherliste in Notizen aufhört</h2>
      <ul>
        <li><strong>Kein Sortieren oder Filtern.</strong> Tabellen lassen sich nicht sortieren, also liest du für jedes Buch unter Zu lesen die Spalte Status hinunter.</li>
        <li><strong>Status ist nur Text.</strong> Nichts verhindert, dass „Gelesen“ und „Fertig“ in derselben Spalte landen.</li>
        <li><strong>Jedes Buch tippst du von Hand.</strong> Eine Empfehlung in einer Nachricht steht erst auf der Liste, wenn du sie hinüberkopierst.</li>
        <li><strong>Die Liste kann nicht antworten.</strong> Sie weiß, was du gut bewertet hast, aber sie kann dir nicht sagen, welches Buch unter Zu lesen den Büchern am ähnlichsten ist, die du geliebt hast.</li>
      </ul>

      <h2 id="pinto-notes">Eine Bücherliste, die sich selbst führt</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/reading-list">Reading list</a> ist eine Notiz mit einer
        Tabelle Books und einem Abschnitt Notes. Status ist eine Auswahl aus To read, Reading, Finished oder Dropped, und Bewertung ist eine
        Skala von 1 bis 5, also wählst du sie aus, statt sie zu tippen.
      </p>
      <p>
        Erzähl deiner KI von einem Buch, und sie fügt eine Zeile hinzu: den Titel, den Autor, To read und wer es empfohlen hat oder warum du es
        lesen willst. Sag „Piranesi fertig, fünf Sterne“, und sie ändert den Status und die Bewertung. Deine Gedanken zu einem Buch kommen
        unter Notes, unter seinen Titel. Frag „Was soll ich als Nächstes lesen?“, und sie schlägt eins aus deinen Büchern unter To read vor,
        nach dem, was du gut bewertet hast. Du kannst weiterhin jede Zeile selbst hinzufügen und bearbeiten, und jede frühere Version der
        Notiz bleibt erhalten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine
        Minute.
      </p>
      <p>
        Die Bücherliste, die du schon in Apple Notizen führst, kommt mit <a href="/blog/import-your-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
