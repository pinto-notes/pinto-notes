import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "buchnotizen-vorlage-apple-notizen");

// German version of /blog/apple-notes-book-notes-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "buchnotizen", "buch notizen machen", "bücher notizen machen", "bücher lesen notizen
// machen", "apple bücher notizen machen", "notizen zu büchern machen", "buch zusammenfassung vorlage",
// "buchzusammenfassung vorlage"; "buchnotizen vorlage" itself has no suggestions. The big idea is die Kernidee here.
// Apple's own German words, read 21 Nov 2026, from the Mac guide support.apple.com/de-de/guide/notes/apde615d29c2/mac
// (Bearbeiten, Link hinzufügen, Command-K), the iPhone guide de-de/guide/iphone/iph908d1558b/ios (Link hinzufügen),
// de-de/guide/notes/apdc88ed7f1d/mac (Tags with #) and apd58edc7964/mac (intelligente Ordner). Bearbeiten, Als Markdown
// einsetzen and Ablage, Notiz duplizieren are Notes' de strings (MainMenu.loctable) on macOS 27.2; the Smart Folder rule
// names Tags and Checklisten are SmartFolderFilterRow there, and Nicht markiert is SmartFolderChecklistsFilterView. The
// books are their German editions (4000 Wochen, Konzentriert arbeiten); the quote is translated for the example. Facts
// are the English post's; the picture is its English one, described in German. Links go to the German reading list
// post and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# 4000 Wochen von Oliver Burkeman

## Sätze, die bleiben sollen
- „Der Tag, an dem du endlich alles im Griff hast, wird nie kommen.“ (S. 31)

## Meine Gedanken
- Die To-do-Liste ist absichtlich endlos. Sie abzuarbeiten ist nicht das Ziel.
- Such dir deine drei großen Projekte aus; alles andere wartet.
- Nein zu guten Dingen zu sagen ist der schwere Teil.

## Die Kernidee
Das Leben ist kurz und Aufmerksamkeit begrenzt. Wer alles schaffen will, sorgt dafür, dass das Wichtige zu kurz kommt. Entscheide bewusst, was du vernachlässigst.

## Was ich anders mache
- [ ] Eine Liste mit drei aktiven Projekten führen, nicht mehr
- [ ] Das Wichtigste zuerst erledigen, vor den E-Mails
- [ ] Einen Abend pro Woche nichts planen
`;

const INDEX = `# Bücher

## 2026
- 4000 Wochen von Oliver Burkeman
- Konzentriert arbeiten von Cal Newport
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für Buchnotizen?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz pro Buch mit Überschriften für die Zitate, deine Gedanken, die Kernidee und was du anders machen willst, funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Wie mache ich mir Notizen zu einem Buch?", a: [
    "Schreib die Sätze auf, bei denen du hängen bleibst, mit der Seitenzahl, und einen kurzen eigenen Gedanken daneben. Wenn du fertig bist, schreib die Kernidee des Buchs in drei Sätzen auf und ein oder zwei Dinge, die du ändern willst.",
  ] },
  { q: "Wie finde ich ein Zitat in Apple Notizen wieder?", a: [
    "Die Suche liest jedes Wort in jeder Notiz, also finden ein paar Wörter aus dem Zitat es. Gibst du jeder Buchnotiz den Tag #bücher, kann ein intelligenter Ordner sie außerdem an einem Ort sammeln.",
  ] },
  { q: "Gibt es eine App für Buchnotizen, die wie Apple Notizen funktioniert?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Buchnotizen. Schick ChatGPT oder Claude beim Lesen deine Markierungen, und es legt sie unter dem Buch ab; wenn du fertig bist, schreibt es die Kernidee auf.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="buchnotizen-vorlage-apple-notizen"
      intro={<>
        Ein Jahr nach einem guten Buch erinnern sich die meisten an das Cover und eine Idee, wenn überhaupt. Eine Seite Notizen pro Buch
        ändert das. Hier ist eine Vorlage für Buchnotizen in Apple Notizen zum Einfügen, eine Übersicht, die sie zusammenhält, und wo
        Notizen aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#beim-lesen", label: "Beim Lesen" },
          { href: "#uebersicht", label: "Zusammenhalten" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Notizen, die die Kernidee schreiben" },
        ]}>
          <p>
            Apple Notizen hat keine Vorlage für Buchnotizen, aber eine Notiz pro Buch erledigt das: die Sätze, die bleiben sollen, mit ihren
            Seitenzahlen, deine eigenen Gedanken, die Kernidee in drei Sätzen, sobald du fertig bist, und eine Checkliste mit dem, was du
            anders machen willst. Kopier die Vorlage unten für jedes neue Buch.
          </p>
          <PostCta template="book-notes" slug="de/buchnotizen-vorlage-apple-notizen" path="/de/blog/buchnotizen-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Sollen deine Markierungen für dich abgelegt werden?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Buchnotizen. Schick ChatGPT oder Claude beim Lesen eine Markierung, und es legt sie ab; wenn du fertig bist, schreibt es die Kernidee auf.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/book-notes-note" width={1520} height={1255} maxWidth={600}
        alt="Eine Notiz Book notes in Pinto Notes auf dem Mac: Four Thousand Weeks von Oliver Burkeman mit einem Zitat von Seite 31, vier Gedanken, der Kernidee und einer Checkliste mit drei Dingen, die anders werden sollen, darunter Deep Work von Cal Newport."
        caption="Buchnotizen in Pinto Notes, ein Abschnitt pro Buch, so wie die Vorlage sie ablegt. Beispieldaten. Überschriften, Aufzählungen und Checkliste funktionieren in Apple Notizen genauso." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz pro Buch</h2>
      <p>
        Vier Teile, in der Reihenfolge, in der du sie füllst. Die Zitate und deine Gedanken entstehen beim Lesen. Die Kernidee und die
        Checkliste kommen, wenn du fertig bist, und wegen ihnen kommst du zurück. Lass in jeder Zeile ein Wort stehen, denn ein leerer
        Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Buchnotizen für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus dem letzten Teil eine Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst
        du sie ein, markierst die letzten Zeilen und tippst auf die Checklisten-Taste. Wähle für das nächste Buch Ablage, Notiz duplizieren
        und ersetz die Wörter.
      </p>

      <h2 id="beim-lesen">Beim Lesen</h2>
      <ul>
        <li>
          <strong>Zuerst die Seitenzahl.</strong> Tipp die Seite vor dem Zitat. Das dauert eine Sekunde, und so findest du den Satz im Buch
          wieder.
        </li>
        <li>
          <strong>Deine Worte, keine Zusammenfassung.</strong> Ein Gedanke wie „Nein zu guten Dingen zu sagen ist der schwere Teil“ ist mehr
          wert als eine ordentliche Nacherzählung des Kapitels.
        </li>
        <li>
          <strong>Schreib die Kernidee innerhalb eines Tages.</strong> Drei Sätze, aus dem Gedächtnis, bevor du das nächste Buch anfängst.
          Kannst du es nicht, ist das Buch nicht hängen geblieben, und auch das ist gut zu wissen.
        </li>
        <li>
          <strong>Halte die Checkliste klein.</strong> Zwei bis vier Dinge, die du wirklich ausprobierst. Hake sie ab, wenn sie zur
          Gewohnheit werden.
        </li>
      </ul>

      <h2 id="uebersicht">Zusammenhalten</h2>
      <p>
        Tipp #bücher unter den Titel jeder Buchnotiz: Das macht daraus einen Tag. Ein intelligenter Ordner mit der Regel Tags und dem Tag
        bücher sammelt jede Buchnotiz an einem Ort, und kommt die Regel Checklisten mit Nicht markiert dazu, zeigt er nur die Bücher, in denen
        noch etwas steht, das du nicht ausprobiert hast. Wie du einen anlegst, steht in{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">tags and Smart Folders</a> (auf Englisch).
      </p>
      <Keep title="Bücherübersicht für Apple Notizen" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"], keys: "⌘K" },
        { on: "iPhone", steps: ["Link hinzufügen"] },
      ]} />
      <p>
        Für eine Übersicht nach Jahr führst du eine weitere Notiz, Bücher, und machst aus jedem Titel einen Link: Markiere ihn, wähle Link
        hinzufügen und such die Notiz des Buchs aus. Die Suche liest jedes Wort in jeder Notiz, also finden ein paar Wörter aus einem Zitat
        es, auch wenn du das Buch vergessen hast. Bücher, die du noch nicht gelesen hast, gehören auf eine{" "}
        <a href="/de/blog/buecherliste-apple-notizen">Bücherliste in Apple Notizen</a>, und weitere Notizen zum Einfügen findest du in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo Buchnotizen in Notizen aufhören</h2>
      <ul>
        <li><strong>Jedes Zitat tippst du von Hand.</strong> Einen Satz aus einem gedruckten Buch zu übernehmen heißt: Buch weglegen, Notiz suchen, tippen.</li>
        <li><strong>Die Kernidee ist der Teil, den die meisten auslassen.</strong> Nichts erinnert dich daran, sie zu schreiben, und eine Woche später fällt es schwerer.</li>
        <li><strong>Die Übersicht ist Handarbeit.</strong> Ein neues Buch steht erst darin, wenn du seinen Link einträgst.</li>
        <li><strong>Bücher bleiben getrennt.</strong> Die Suche findet Wörter. Sie kann dir nicht sagen, was drei Bücher über Konzentration gemeinsam hatten.</li>
      </ul>

      <h2 id="pinto-notes">Buchnotizen, die die Kernidee aufschreiben</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/book-notes">Book notes</a> ist eine Notiz mit einem
        Abschnitt pro Buch, das neueste zuerst: die Zitate, deine Gedanken, die Kernidee und was du anders machen willst.
      </p>
      <p>
        Sag deiner KI, welches Buch du liest, und sie legt den Abschnitt dafür an. Schick ihr beim Lesen eine Markierung, etwa „Seite 31: Der
        Tag, an dem du endlich alles im Griff hast, wird nie kommen“, und sie legt sie als Zitat mit der Seitenzahl ab. Deine eigenen
        Gedanken kommen als Aufzählungspunkte dazu, in deinen Worten, ohne Glätten. Sag „Ich bin durch, fass es zusammen“, und sie schreibt
        die Kernidee in drei Sätzen und zwei bis vier Dinge, die du anders machen willst, als Checkliste. Du kannst weiterhin jede Zeile
        selbst schreiben und bearbeiten, und jede frühere Version der Notiz bleibt erhalten.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Buchnotizen, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
