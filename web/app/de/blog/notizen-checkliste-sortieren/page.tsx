import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-checkliste-sortieren");

// German version of /blog/apple-notes-checklist-sort (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "notizen checkliste sortieren" (apple, iphone, ios, mac, notizen app), "apple notizen checkliste automatisch
// sortieren", "apple notizen checkliste nicht sortieren", "apple notizen checkliste alphabetisch sortieren", "iphone
// notizen checkliste alphabetisch sortieren", "notizen checkliste" (erstellen, funktioniert nicht), "iphone notizen
// checkliste funktioniert nicht"; "checkliste abgehakt nach unten" has no suggestions, so the title says sortieren and
// the post explains nach unten. Apple's own German words, read 21 Nov 2026, from support.apple.com/de-de/102296
// (Checkliste: Einstellungen, Apps, Notizen, „Markierte Einträge sortieren“, „Manuell“ or „Automatisch“; drag to reorder;
// swipe right to indent, left to undo; Checklistentaste; tap the empty circle; published 25 Feb 2025), the iOS 16 iPhone
// guide de-de/guide/iphone/iph1ac0b3a2/16.0/ios/16.0 (the older path Einstellungen, Notizen, Markierte Einträge sortieren,
// for all notes; its in-note menu with „Markierte nach unten bewegen“ is not in the current guides, so it's left out), the
// Mac guide (macOS 27) de-de/guide/notes/apd93c815aa0 (hold an item and drag it; „Markierte Einträge automatisch
// sortieren“; Format, Mehr, „Alles aktivieren“ or „Alles deaktivieren“; Command-click checks or unchecks all;
// Tabulatortaste and Umschalt-Tabulatortaste; Control-Command-Aufwärtspfeil or -Abwärtspfeil), apd97da26aed (Notizen,
// Einstellungen; checked items move to the end, unchecked ones move up) and apd46c25187e (Umschalt-Command-L applies the
// Checklistenformat, Umschalt-Command-U marks or unmarks an item, Umschalt-Zeilenschalter). Notes' own de strings on
// macOS 27.2 call the menu items „Alles markieren“ and „Markierung aufheben“; the post uses the guide's „Alles
// aktivieren“ and „Alles deaktivieren“, as the other German posts do. Ablage, Notiz duplizieren and Ablage, Neuer
// intelligenter Ordner are Notes' de strings (Localizable.loctable), and the rule value Nicht markiert is
// SmartFolderChecklistsFilterView there. Not on any Apple page, so left out, as in the English post: why a ticked item
// looks grey or struck through, and the iPhone taps for unchecking all on iOS 27. Facts are the English post's; the
// pictures are its English ones, described in German. Links go to the German grocery list and habit tracker posts and to
// English posts where no German one exists.

const ui = UI.de;

const FAQ = [
  { q: "Warum rutschen abgehakte Einträge in Apple Notizen nach unten?", a: [
    "„Markierte Einträge sortieren“ steht auf Automatisch. Geh auf dem iPhone zu Einstellungen, Apps, Notizen, Markierte Einträge sortieren und tippe auf Manuell, damit abgehakte Einträge stehen bleiben. Wähle auf dem Mac Notizen, Einstellungen und deaktiviere „Markierte Einträge automatisch sortieren“.",
  ] },
  { q: "Kann ich abgehakte Einträge nur in einer Notiz sortieren?", a: [
    "Die Einstellung gilt für jede Checkliste in jeder Notiz auf diesem Gerät. Um eine Liste aufzuräumen und den Rest zu lassen, lass die Einstellung aus und zieh die abgehakten Einträge von Hand nach unten.",
  ] },
  { q: "Kann Apple Notizen eine Checkliste alphabetisch sortieren?", a: [
    "Nein. Notizen behält die Einträge in der Reihenfolge, in der du sie tippst, und die Sortierung, die Apple beschreibt, bewegt nur abgehakte Einträge nach unten. Zieh Einträge von Hand, oder drück auf dem Mac Control-Command-Aufwärtspfeil oder -Abwärtspfeil, um eine Zeile nach der anderen zu bewegen.",
  ] },
  { q: "Welcher Tastaturkurzbefehl macht in Apple Notizen eine Checkliste?", a: [
    "Auf dem Mac macht Umschalt-Command-L die Zeile zur Checkliste, und Umschalt-Command-U hakt den Eintrag ab, in dem du stehst, oder nimmt den Haken weg. Ein Klick mit gedrückter Command-Taste auf einen Eintrag hakt alle ab.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-checkliste-sortieren"
      intro={<>
        Hak in einer Checkliste in Apple Notizen etwas ab, und es rutscht entweder nach unten oder bleibt stehen. Eine Einstellung entscheidet
        das, und sie liegt auf dem iPhone an einer anderen Stelle als auf dem Mac. Hier steht, wo du sie findest, wie du Einträge von Hand
        bewegst und wie du eine Liste zurücksetzt.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "Auf dem iPhone" },
          { href: "#mac", label: "Auf dem Mac" },
          { href: "#von-hand", label: "Von Hand bewegen" },
          { href: "#alles-deaktivieren", label: "Alles deaktivieren" },
          { href: "#kurzbefehle", label: "Kurzbefehle" },
          { href: "#pinto-notes", label: "Eine Liste, die selbst aufräumt" },
        ]}>
          <p>
            Geh auf dem iPhone zu Einstellungen, Apps, Notizen, tippe auf „Markierte Einträge sortieren“ und dann auf Automatisch, damit
            abgehakte Einträge nach unten wandern, oder auf Manuell, damit sie stehen bleiben. Wähle auf dem Mac Notizen, Einstellungen und
            aktiviere oder deaktiviere „Markierte Einträge automatisch sortieren“. Es ist ein Schalter für alle deine Notizen, also stellst du
            ihn auf jedem Gerät einmal ein.
          </p>
          <PostCta template="grocery-list" slug="de/notizen-checkliste-sortieren" path="/de/blog/notizen-checkliste-sortieren" position="answer" ui={ui.cta}
            title="Willst du die abgehakten Einträge weggeräumt bekommen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Einkaufsliste. Sag ChatGPT oder Claude, was du brauchst, und es setzt jede Sache in ihre Abteilung und räumt die abgehakten Zeilen weg, wenn du zurück bist.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Eine Notiz Groceries in Apple Notizen auf dem Mac: acht nicht abgehakte Sachen von Oat milk bis Dark chocolate, darunter Sourdough, Eggs und Spinach abgehakt am Ende."
        caption="Eine Checkliste Groceries in Apple Notizen auf dem Mac, die abgehakten Einträge unten." />}
      faq={FAQ}
    >
      <h2 id="iphone">Abgehakte Einträge auf dem iPhone nach unten bewegen</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Einstellungen", "Apps", "Notizen", "Markierte Einträge sortieren"] },
      ]} />
      <p>
        Die Einstellung steckt in der Einstellungen-App, nicht in Notizen. Öffne Einstellungen, tippe auf Apps, dann auf Notizen, dann auf
        „Markierte Einträge sortieren“, und wähle:
      </p>
      <ul>
        <li><strong>Automatisch.</strong> Jeder Eintrag, den du abhakst, wandert ans Ende seiner Checkliste, also bleibt oben, was noch offen ist.</li>
        <li><strong>Manuell.</strong> Abgehakte Einträge bleiben, wo sie sind. Wähl das, wenn deine Liste eine Reihenfolge hat, die bleiben soll, etwa die Schritte eines Rezepts.</li>
      </ul>
      <p>
        Unter älteren iOS-Versionen liegt dieselbe Einstellung eine Ebene höher, unter Einstellungen, Notizen, Markierte Einträge
        sortieren. So oder so gilt sie für jede Checkliste in jeder Notiz auf diesem iPhone.
      </p>

      <h2 id="mac">Abgehakte Einträge auf dem Mac nach unten bewegen</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Notizen", "Einstellungen", "Markierte Einträge automatisch sortieren"] },
      ]} />
      <p>
        Wähle in Notizen Notizen, Einstellungen und aktiviere „Markierte Einträge automatisch sortieren“. Hakst du einen Eintrag ab, wandert er
        ans Ende der Liste. Nimmst du den Haken weg, wandert er wieder nach oben. Deaktivierst du die Einstellung, bleiben Einträge beim
        Abhaken stehen.
      </p>
      <p>
        Der Mac hat seinen eigenen Schalter, getrennt vom iPhone, also stell ihn auf beiden ein, wenn sich deine Listen überall gleich
        verhalten sollen.
      </p>

      <h2 id="von-hand">Einen Checklisteneintrag von Hand bewegen</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Eintrag ziehen"] },
        { on: "Mac", steps: ["Gedrückt halten", "Ziehen"] },
        { on: "Mac", steps: ["Eintrag nach oben"], keys: "⌃⌘↑" },
        { on: "Mac", steps: ["Eintrag nach unten"], keys: "⌃⌘↓" },
      ]} />
      <p>
        Mit der Sortierung auf Manuell bestimmst du die Reihenfolge. Zieh auf dem iPhone einen Eintrag an die Stelle, an der du ihn willst.
        Halte auf dem Mac einen Eintrag gedrückt und zieh ihn, oder setz den Cursor in eine Zeile und drück Control-Command-Aufwärtspfeil
        oder -Abwärtspfeil, um sie Platz für Platz zu bewegen. Notizen kann eine Checkliste nicht alphabetisch sortieren, also bringst du
        Einträge auch so in eine Reihenfolge.
      </p>
      <p>
        Um Einträge zu gruppieren, rück sie ein. Streich auf dem iPhone auf einem Eintrag nach rechts, um ihn einzurücken, und nach links,
        um das rückgängig zu machen. Drück auf dem Mac die Tabulatortaste zum Einrücken und Umschalt-Tabulatortaste zum Zurücknehmen. Für
        den Einkauf funktionieren Überschriften besser als eine Reihenfolge: eine Überschrift pro Abteilung, wie in der{" "}
        <a href="/de/blog/einkaufsliste-iphone-notizen">Einkaufsliste für iPhone Notizen</a>.
      </p>

      <h2 id="alles-deaktivieren">Alles deaktivieren, oder alles aktivieren</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] },
        { on: "Mac", steps: ["Format", "Mehr", "Alles aktivieren"] },
      ]} />
      <p>
        Um eine Liste wiederzuverwenden, klick hinein und wähle Format, Mehr, Alles deaktivieren. Alles aktivieren hakt alles ab. Es geht
        auch schneller: Klick mit gedrückter Command-Taste auf irgendeinen Eintrag. Ist ein Eintrag nicht abgehakt, hakt Notizen alle ab, und
        sind alle abgehakt, nimmt es alle Haken weg.
      </p>
      <p>
        Mit Alles deaktivieren verlierst du, was du abgehakt hattest. Für eine Liste, die du wegen ihres Verlaufs behältst, etwa einen{" "}
        <a href="/de/blog/habit-tracker-vorlage-apple-notizen">Habit Tracker</a>, wähle zuerst Ablage, Notiz duplizieren und setz die
        Kopie zurück.
      </p>

      <h2 id="kurzbefehle">Tastaturkurzbefehle für Checklisten auf dem Mac</h2>
      <Paths rows={[
        { on: "Checkliste", steps: ["Checklistenformat anwenden"], keys: "⇧⌘L" },
        { on: "Abhaken", steps: ["Eintrag markieren oder Markierung aufheben"], keys: "⇧⌘U" },
        { on: "Bewegen", steps: ["Eintrag nach oben oder unten"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        Umschalt-Command-L wendet das Checklistenformat an, wie die Taste „Checkliste“. Umschalt-Command-U hakt den Eintrag ab, in dem der
        Cursor steht, oder nimmt den Haken weg, also brauchst du die Maus nie. Umschalt-Zeilenschalter fügt eine zweite Zeile in einen
        Eintrag ein. Tippe auf dem iPhone auf die Checklisten-Taste, und jeder Zeilenschalter beginnt den nächsten Eintrag.
      </p>

      <h2 id="offene-listen">Jede Liste finden, in der noch etwas offen ist</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="Das Fenster New Smart Folder in Apple Notizen unter macOS 27, mit dem Namen Open to-dos und einer Regel: Checklists, Unchecked."
        caption="Ein intelligenter Ordner mit jeder Notiz, in der noch etwas nicht abgehakt ist. Apple Notizen unter macOS 27." />
      <p>
        Sortieren räumt eine Liste auf. Um alle zu sehen, leg einen intelligenten Ordner mit der Regel Checklisten, Nicht markiert an: Er
        zeigt jede Notiz, in der noch ein Eintrag offen ist, aus jedem Ordner. Wähle auf dem Mac Ablage, Neuer intelligenter Ordner. Die
        Schritte für das iPhone stehen in <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Apple Notes tags and Smart
        Folders</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo das Sortieren von Checklisten aufhört</h2>
      <ul>
        <li><strong>Alle Notizen oder keine.</strong> Die Einstellung gilt für jede Checkliste auf dem Gerät, also sortieren eine Einkaufsliste und ein Rezept gleich.</li>
        <li><strong>Abgehaktes stapelt sich.</strong> Es sinkt nach unten und bleibt dort, bis du es löschst oder den Haken wegnimmst.</li>
        <li><strong>Die Reihenfolge ist Handarbeit.</strong> Notizen sortiert weder nach Name noch nach Abteilung, und ein neuer Eintrag steht da, wo du ihn tippst.</li>
      </ul>
      <p>
        Für eine Liste, die du jede Woche nutzt, ist das in Ordnung. Für eine Liste, die sich jeden Tag ändert, wird das Aufräumen zur
        eigenen Aufgabe.
      </p>

      <h2 id="pinto-notes">Eine Liste, die selbst aufräumt</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Eine Notiz Groceries in Pinto Notes auf dem Mac. Die fünf Zeilen, die ChatGPT gerade hinzugefügt hat, sind farbig hinterlegt, und eine Leiste unten sagt, dass ChatGPT 5 Zeilen geändert hat, mit Undo." }}
        caption="Eine Notiz Groceries in Pinto Notes auf dem Mac. Die fünf Zeilen, die ChatGPT gerade hinzugefügt hat, sind farbig hinterlegt, unten steht Undo." />
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du
        schon nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/grocery-list">Einkaufsliste</a> ist eine Liste mit
        einer Überschrift pro Abteilung.
      </p>
      <p>
        Sag deiner KI, was du brauchst, auch in einem langen Satz, und sie setzt jede Sache unter die richtige Abteilung und lässt weg, was
        schon auf der Liste steht. Hak beim Einkaufen ab. Sag „Ich bin vom Einkaufen zurück“, und sie entfernt die abgehakten Zeilen und sagt
        dir, was noch fehlt. Du kannst weiterhin jede Sache selbst hinzufügen, abhaken und ziehen, und jede frühere Version einer Notiz
        bleibt erhalten. Das funktioniert, sobald ChatGPT oder Claude verbunden ist, und{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Checklisten, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) herüber, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
