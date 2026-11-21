import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "essensplan-vorlage-apple-notizen");

// German version of /blog/apple-notes-meal-planner-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "apple notizen essensplan", "essensplan vorlage", "essensplaner vorlage", "wochenplan essen
// vorlage" (pdf, zum ausdrucken, app), "essensplan iphone erstellen". Apple's own German words, read 21 Nov 2026, from
// the Mac guide support.apple.com/de-de/guide/notes/apd93c815aa0/mac (Markierte Einträge automatisch sortieren; Format,
// Mehr, Alles deaktivieren), apd4e6e2c9a6 (teilen: Link teilen, Kann bearbeiten, no locked notes), apde615d29c2 (Link
// hinzufügen) and apd0a136b9cc (Format, Tabelle); support.apple.com/de-de/102462 (up to 100 people, Apple Account, no
// locked notes) and de-de/105086 (Erinnerungen, list type Einkäufe from iOS 17, items sorted into Kategorien).
// Bearbeiten, Als Markdown einsetzen and Ablage, Notiz duplizieren are Notes' de strings (MainMenu.loctable) on macOS
// 27.2. Facts are the English post's; the pictures are its English ones, described in German. Links go to the German
// grocery list post and to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Essensplan, Woche vom 23. November

## Abendessen
- Montag: Zitronenhähnchen mit Reis
- Dienstag: Pasta mit Tomaten und Basilikum (Oskar kocht)
- Mittwoch: Fischtacos
- Donnerstag: Kichererbsen-Curry (Oskar kocht)
- Freitag: selbstgemachte Pizza
- Samstag: mit Freunden essen gehen
- Sonntag: Brathähnchen mit Kartoffeln

## Obst und Gemüse
- [ ] Zitronen
- [ ] Basilikum
- [ ] Kirschtomaten
- [ ] Limetten
- [ ] Kartoffeln

## Fleisch und Fisch
- [ ] Hähnchenschenkel
- [ ] Weißfischfilet
- [ ] Ganzes Hähnchen

## Alles andere
- [ ] Tortillas
- [ ] Kichererbsen
- [ ] Kokosmilch
- [ ] Pizzateig
- [ ] Mozzarella

## Immer im Vorrat
- Olivenöl, Salz, Pfeffer
- Reis, Nudeln, Haferflocken
- Zwiebeln, Knoblauch
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für einen Essensplan?", a: [
    "Nein. Apple Notizen hat keinen Essensplaner und keine Vorlagen. Eine Notiz mit den Abendessen der Woche oben und der Einkaufsliste als Checklisten darunter funktioniert als einer, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Kann ich einen Essensplan in Apple Notizen mit meinem Partner oder meiner Partnerin teilen?", a: [
    "Ja. Teile die Notiz und lege fest, dass andere sie bearbeiten können. Ihr braucht beide einen Apple Account, und eine gesperrte Notiz lässt sich nicht zum gemeinsamen Bearbeiten teilen. Häkchen erscheinen auf beiden Telefonen.",
  ] },
  { q: "Gehört die Einkaufsliste in Notizen oder in Erinnerungen?", a: [
    "Erinnerungen hat ab iOS 17 den Listentyp Einkäufe, der Artikel beim Hinzufügen nach Kategorien sortiert. Notizen hält die Liste neben den Abendessen, aus denen sie entstanden ist. Wenn du zuerst die Woche planst, sparst du dir mit beidem in einer Notiz das Abschreiben.",
  ] },
  { q: "Gibt es einen Essensplaner, der die Einkaufsliste für mich schreibt?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für einen Essensplan: die Abendessen der Woche, wer kocht, und die Einkäufe nach Abteilungen. ChatGPT oder Claude können darin die Woche planen und die Liste schreiben, ohne das, was immer im Vorrat ist.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="essensplan-vorlage-apple-notizen"
      intro={<>
        Um sechs entscheiden, was es zum Abendessen gibt, und dann merken, dass kein Reis mehr da ist. Ein Essensplan löst beides, und Apple
        Notizen kann einen halten, direkt neben der Einkaufsliste, die er braucht. Hier ist eine Vorlage zum Einfügen, wie du sie einrichtest,
        damit die Liste im Laden funktioniert, und wo sie aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#besser", label: "Besser machen" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Plan, der die Liste schreibt" },
        ]}>
          <p>
            Apple Notizen hat keinen Essensplaner, aber eine Notiz erledigt das. Schreib die Abendessen der Woche oben hin, eine Zeile pro
            Tag, und die Einkäufe darunter als Checklisten, mit einer Überschrift pro Abteilung. Kopiere die Vorlage unten.
          </p>
          <PostCta slug="de/essensplan-vorlage-apple-notizen" path="/de/blog/essensplan-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du die Einkaufsliste für dich schreiben lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für einen Essensplan. Sag ChatGPT oder Claude, worauf du diese Woche Lust hast, und es plant die Abendessen und schreibt die Einkaufsliste nach Abteilungen, ohne das, was schon im Vorrat ist.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Eine Notiz Groceries in Apple Notizen auf dem Mac: eine Checkliste mit acht Sachen zum Kaufen, Sourdough, Eggs und Spinach sind abgehakt und nach unten sortiert."
        caption="Eine Einkaufsliste als Checkliste in Apple Notizen auf dem Mac. Mit „Markierte Einträge automatisch sortieren“ rutscht, was schon im Korb liegt, nach unten." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz pro Woche</h2>
      <p>
        Eine Woche Abendessen für zwei, als Beispiel. Ändere zuerst die Abendessen, dann die Einkäufe, die sie brauchen. Lass in jeder Zeile
        ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das Einfügen nicht. Die letzte Überschrift ist eine einfache Liste mit
        dem, was du immer da hast, damit du nicht jede Woche Olivenöl kaufst.
      </p>
      <Keep title="Essensplan für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Dasselbe Markdown zweimal in Apple Notizen unter macOS 27 eingefügt: mit Command-V bleiben die Zeichen als Text stehen, mit Edit, Paste as Markdown werden daraus eine Überschrift, eine Liste und fetter Text."
        caption="Links normal eingefügt, rechts mit „Als Markdown einsetzen“. Mit Checklistenzeilen geht es genauso." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Leg auf einem Mac mit macOS 27 eine neue Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die Zeile mit # wird zum Titel, jede
        Zeile mit ## zu einer Überschrift, die Abendessen bleiben eine Liste, und die Einkäufe werden zu Checklisten. Ein normales Command-V
        lässt die Zeichen als Text stehen. Auf dem iPhone tippst du die Zeilen, markierst die Einkäufe und tippst auf die Checklisten-Taste.
      </p>
      <p>
        Aktiviere dann in den Einstellungen von Notizen „Markierte Einträge automatisch sortieren“. Im Laden rutscht alles, was du abhakst, ans
        Ende seiner Liste, und was noch fehlt, bleibt oben.
      </p>

      <h2 id="besser">Besser machen</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Ablage", "Notiz duplizieren"] },
        { on: "Mac", steps: ["Format", "Mehr", "Alles deaktivieren"] },
      ]} />
      <ul>
        <li>
          <strong>Die nächste Woche aus dieser.</strong> Wähle am Sonntag Ablage, Notiz duplizieren, ändere die Abendessen, klicke in jede
          Abteilung und wähle Format, Mehr, Alles deaktivieren. Die meisten Wochen teilen sich die Hälfte ihrer Einkäufe.
        </li>
        <li>
          <strong>Rezepte nur ein Tippen entfernt.</strong> Leg jedes Rezept in eine eigene Notiz und verlinke es mit Link hinzufügen von
          seinem Abendessen aus. Unter iOS 27 und macOS 27 kann ein Link auch auf eine Überschrift zeigen, so öffnet sich „Zutaten“ genau da,
          wo du es brauchst. <a href="/blog/apple-notes-ios-27" hrefLang="en">What&apos;s new in Apple Notes in iOS 27</a> (auf Englisch) hat
          die Details.
        </li>
        <li>
          <strong>Geteilt mit allen, die kochen.</strong> Teile die Notiz und lass andere sie bearbeiten. Wer gerade im Laden ist, hakt ab,
          und das andere Telefon sieht es. Ihr braucht beide einen Apple Account, und eine gesperrte Notiz lässt sich so nicht teilen.
        </li>
      </ul>
      <p>
        Willst du die Woche lieber als Raster mit einer Spalte dafür, wer kocht, legt Format, Tabelle eine an.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt, wie. Mehr Notizen zum Einfügen
        findest du in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo ein Essensplan in Notizen aufhört</h2>
      <ul>
        <li><strong>Die Liste schreibst du von Hand.</strong> Notizen weiß nicht, dass ein Curry Kokosmilch braucht. Du liest jedes Rezept und tippst ab, was es braucht, jede Woche.</li>
        <li><strong>Keine Sortierung nach Abteilungen.</strong> Wo die Zitronen hinkommen, entscheidest du. Erinnerungen hat eine Einkaufsliste, die Artikel beim Hinzufügen nach Kategorien sortiert, aber dann liegt die Liste getrennt von den Abendessen. Die <a href="/de/blog/einkaufsliste-iphone-notizen">Vorlage für die Einkaufsliste</a> hat die Abteilungen schon fertig.</li>
        <li><strong>Kein Gedächtnis für das, was du hast.</strong> Notizen kann dir nicht sagen, dass zu Hause noch Reis ist. Die Vorratsliste hilft nur, wenn du sie liest, bevor du die Einkäufe aufschreibst.</li>
        <li><strong>Keine Ideen.</strong> Wenn niemand weiß, was es geben soll, wartet die Notiz.</li>
      </ul>
      <p>
        Teilen kann Notizen gut. Die Abendessen planen und daraus eine Liste machen, das bleibt deine Arbeit.
      </p>

      <h2 id="pinto-notes">Ein Essensplan, der die Einkaufsliste schreibt</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Eine Notiz Groceries in Pinto Notes auf dem Mac. Die fünf Zeilen, die ChatGPT gerade hinzugefügt hat, sind farbig hinterlegt, und eine Leiste unten sagt, dass ChatGPT 5 Zeilen geändert hat, mit Undo." }}
        caption="Eine Einkaufsliste in Pinto Notes auf dem Mac. Die fünf Zeilen, die ChatGPT gerade hinzugefügt hat, sind farbig hinterlegt, unten steht Undo zum Rückgängigmachen." />
      <p>
        Dafür gibt es Pinto Notes. Es sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem
        Chat, den du schon nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/meal-plan">Essensplan</a> ist eine
        Notiz mit den Abendessen der Woche und wer kocht, den Einkäufen nach Abteilungen und dem, was immer im Vorrat ist.
      </p>
      <p>
        Bitte deine KI am Wochenende, die Woche zu planen. Sie fragt, an welchen Abenden du kochst und was wegfallen soll, schlägt Abendessen
        vor, trägt die Woche ein, schreibt dann die Einkaufsliste nach Abteilungen und lässt weg, was schon im Vorrat ist. Sag am Mittwoch
        „Haferdrink dazu“, und er landet in der richtigen Abteilung. Jede Zeile, die sie hinzufügt, ist farbig hinterlegt, mit Undo, und
        jede frühere Version der Notiz bleibt erhalten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a>{" "}
        (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch)
        mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
