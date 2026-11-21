import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "einkaufsliste-iphone-notizen");

// German version of /blog/apple-notes-grocery-list-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "einkaufsliste notizen iphone", "einkaufsliste iphone notizen", "apple notizen
// einkaufsliste erstellen", "iphone notizen einkaufsliste teilen", "einkaufsliste iphone erinnerungen", "einkaufsliste
// nach kategorien", "einkaufsliste nach laden sortieren". An aisle is an Abteilung here, the word German shoppers use for
// a part of the shop. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd93c815aa0/mac (Markierte Einträge automatisch sortieren; Format, Mehr, Alles
// deaktivieren), apd4e6e2c9a6 (teilen, Kann bearbeiten, no locked notes) and apdb54e469b6 (anpinnen);
// support.apple.com/de-de/102462 (Apple Account, no locked notes) and de-de/105086 (Erinnerungen, list type Einkäufe
// from iOS 17, Kategorien). Bearbeiten, Als Markdown einsetzen is in Notes' de strings (MainMenu.loctable) on macOS
// 27.2. Facts are the English post's; the picture is its English one, described in German. Links go to the German meal
// planner and recipe posts and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Einkaufsliste

## Obst und Gemüse
- [ ] Äpfel
- [ ] Spinat
- [ ] Zitronen

## Brot und Milchprodukte
- [ ] Haferdrink
- [ ] Eier

## Fleisch und Fisch
- [ ] Lachsfilets

## Vorrat
- [ ] Dosentomaten, 2 Dosen
- [ ] Reis

## Tiefkühl
- [ ] Erbsen

## Haushalt
- [ ] Spülmittel
`;

const FAQ = [
  { q: "Kann Apple Notizen eine Einkaufsliste sortieren?", a: [
    "Nicht nach Abteilungen. Notizen behält die Reihenfolge, in der du tippst. Leg für jede Abteilung eine Überschrift an und schreib die Sachen unter die richtige, und aktiviere „Markierte Einträge automatisch sortieren“, damit nach unten rutscht, was schon im Korb liegt.",
  ] },
  { q: "Notizen oder Erinnerungen für den Einkauf?", a: [
    "Erinnerungen hat ab iOS 17 den Listentyp Einkäufe, der Artikel beim Hinzufügen in Kategorien einteilt. Notizen ist besser, wenn die Liste neben einem Essensplan oder Rezepten steht oder wenn du eigene Abteilungen in der Reihenfolge deines Ladens willst.",
  ] },
  { q: "Kann meine Familie etwas zur selben Einkaufsliste hinzufügen?", a: [
    "Ja. Teile die Notiz und lass andere sie bearbeiten. Alle brauchen einen Apple Account, und eine gesperrte Notiz lässt sich nicht zum gemeinsamen Bearbeiten teilen. Häkchen und neue Sachen erscheinen auf jedem Telefon.",
  ] },
  { q: "Gibt es eine Einkaufsliste, die sich selbst sortiert?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für eine Einkaufsliste nach Abteilungen. Sag ChatGPT oder Claude, was du brauchst, auch in einem langen Satz, und es sortiert jede Sache in ihre Abteilung ein.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="einkaufsliste-iphone-notizen"
      intro={<>
        Eine Einkaufsliste in Apple Notizen wächst in der Reihenfolge, in der Sachen ausgehen, also läufst du zweimal durch den Laden. Eine
        Überschrift pro Abteilung löst das meiste davon. Hier ist eine Vorlage für die Einkaufsliste in Apple Notizen zum Einfügen, wie du sie
        teilst und wann Erinnerungen das bessere Werkzeug ist.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#teilen", label: "Teilen" },
          { href: "#erinnerungen", label: "Notizen oder Erinnerungen" },
          { href: "#pinto-notes", label: "Eine Liste, die sich selbst sortiert" },
        ]}>
          <p>
            Apple Notizen kann eine Einkaufsliste nicht nach Abteilungen sortieren, Überschriften schon. Leg eine Notiz mit einer Überschrift
            für jede Abteilung an und schreib die Sachen als Checkliste darunter, aktiviere „Markierte Einträge automatisch sortieren“ und
            teile die Notiz mit allen, die sonst noch einkaufen. Kopiere die Vorlage unten für den Anfang.
          </p>
          <PostCta template="grocery-list" slug="de/einkaufsliste-iphone-notizen" path="/de/blog/einkaufsliste-iphone-notizen" position="answer" ui={ui.cta}
            title="Willst du jede Sache für dich einsortieren lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Einkaufsliste nach Abteilungen. Sag ChatGPT oder Claude, was du brauchst, und es setzt jede Sache unter die richtige Abteilung.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/grocery-list-note" width={1520} height={1444} maxWidth={600}
        alt="Eine Notiz Grocery list in Pinto Notes auf dem Mac: die Überschriften Fruit and veg, Bread and dairy, Meat and fish und Cupboard, jede mit einer Checkliste, Bananas und Butter sind abgehakt."
        caption="Eine Einkaufsliste nach Abteilungen in Pinto Notes. Derselbe Aufbau funktioniert in Apple Notizen. Beispieldaten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Liste, eine Überschrift pro Abteilung</h2>
      <p>
        Bring die Abteilungen in die Reihenfolge, in der du durch deinen Laden gehst, dann läufst du ihn einmal ab. Benenne sie passend um:
        Feinkost, Baby, Tierbedarf. Lass in jeder Zeile ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Einkaufsliste für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] },
        { on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] },
      ]} />
      <ul>
        <li>
          <strong>Füg sie ein.</strong> Leg auf einem Mac mit macOS 27 eine neue Notiz an und wähle Bearbeiten, Als Markdown einsetzen: Jede
          Zeile mit ## wird zu einer Überschrift und die Sachen zu einer Checkliste. Auf dem iPhone tippst du die Abteilungen, dann die
          Sachen, markierst sie und tippst auf die Checklisten-Taste.
        </li>
        <li>
          <strong>Lass Abgehaktes nach unten rutschen.</strong> Aktiviere in den Einstellungen von Notizen „Markierte Einträge automatisch
          sortieren“. Im Laden rutscht alles, was du abhakst, ans Ende seiner Abteilung, und was noch fehlt, steht immer oben.
        </li>
        <li>
          <strong>Eine Liste, nicht eine pro Woche.</strong> Lösch die abgehakten Zeilen, wenn du zu Hause bist, oder wähle Format, Mehr,
          Alles deaktivieren für die Sachen, die du jede Woche kaufst.
        </li>
        <li>
          <strong>Pinne sie an.</strong> Eine angepinnte Notiz steht oben über deinen Notizen, also siehst du sie im Laden als Erstes.
        </li>
      </ul>

      <h2 id="teilen">Teile sie mit denen, für die du einkaufst</h2>
      <p>
        Teile die Notiz und lege fest, dass andere sie bearbeiten können. Wer zu Hause ist, trägt ein, was ausgegangen ist, und wer im Laden
        steht, hakt es ab. Die Änderungen erscheinen auf jedem Telefon. Alle brauchen einen Apple Account, und eine gesperrte Notiz lässt sich
        nicht zum gemeinsamen Bearbeiten teilen.
      </p>
      <p>
        Planst du zuerst die Abendessen, hält der <a href="/de/blog/essensplan-vorlage-apple-notizen">Essensplan für Apple Notizen</a> die
        Mahlzeiten der Woche und diese Liste in einer Notiz, und die <a href="/de/blog/rezepte-in-apple-notizen">Rezeptvorlage</a> führt die
        Zutaten jedes Rezepts als Checkliste, mit der du einkaufen kannst. Mehr Notizen zum Einfügen stehen in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="erinnerungen">Notizen oder Erinnerungen?</h2>
      <p>
        Fair gegenüber Erinnerungen: Seit iOS 17 hat es den Listentyp Einkäufe, der alles, was du hinzufügst, von selbst in Kategorien
        einteilt. Genau das kann Notizen nicht. Wenn du nur eine Liste willst, die sich sortiert, nimm Erinnerungen.
      </p>
      <p>
        Notizen gewinnt, wenn die Liste neben anderen Dingen steht: einem Essensplan, einem Rezept, einer Notiz darüber, wer zum Essen kommt.
        Außerdem bestimmst du die Abteilungen und ihre Reihenfolge selbst, wo Erinnerungen seine eigenen Kategorien wählt.
      </p>

      <h2 id="grenzen">Wo eine Einkaufsliste in Notizen aufhört</h2>
      <ul>
        <li><strong>Du sortierst.</strong> Jede Sache kommt von Hand unter ihre Abteilung, also landet ein schnelles Eintragen auf dem Weg nach draußen ganz unten.</li>
        <li><strong>Keine Prüfung auf Doppelte.</strong> Zwei Leute tragen Milch ein, und ihr kauft zwei.</li>
        <li><strong>Aufräumen von Hand.</strong> Nach dem Einkauf bleiben die abgehakten Zeilen stehen, bis du sie löschst.</li>
      </ul>

      <h2 id="pinto-notes">Eine Einkaufsliste, die sich selbst sortiert</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/grocery-list">Einkaufsliste</a> ist eine Liste nach
        Abteilungen: Obst und Gemüse, Brot und Milchprodukte, Fleisch und Fisch, Vorrat, Tiefkühl und Haushalt.
      </p>
      <p>
        Sag deiner KI, was du brauchst, auch in einem langen Satz: „Wir brauchen Eier, zwei Dosen Tomaten, Spinat und Spülmittel“. Sie setzt
        jede Sache unter ihre Abteilung und lässt weg, was schon auf der Liste steht. Wenn du sagst, dass du vom Einkaufen zurück bist, räumt
        sie die abgehakten Zeilen weg und sagt dir, was noch fehlt. Du kannst weiterhin jede Sache selbst eintippen und abhaken, und du kannst{" "}
        <a href="/blog/share-a-note-and-edit-it-together" hrefLang="en">die Notiz teilen und gemeinsam bearbeiten</a> (auf Englisch), wobei
        die Änderungen aller erscheinen, während sie tippen. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT
        verbinden</a> (auf Englisch) dauert eine Minute. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
