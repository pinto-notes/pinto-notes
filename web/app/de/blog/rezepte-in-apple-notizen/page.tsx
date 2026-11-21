import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "rezepte-in-apple-notizen");

// German version of /blog/apple-notes-recipe-template (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "apple notizen rezepte", "rezepte in notizen iphone", "rezepte in notizen app", "rezepte iphone
// verwalten", "rezepte sammeln iphone", "rezeptvorlage" (zum ausfüllen, word, pdf), "rezeptbuch vorlage". Apple's own
// German words, read 21 Nov 2026, from the Mac guide support.apple.com/de-de/guide/notes/apde615d29c2/mac (Bearbeiten,
// Link hinzufügen, Command-K), the iPhone guide de-de/guide/iphone/iph908d1558b/ios (Link hinzufügen), the Mac guide
// apd93c815aa0 (Format, Mehr, Alles deaktivieren), apdb54e469b6 (anpinnen) and apda85974595 (Mathematische Ergebnisse).
// Bearbeiten, Als Markdown einsetzen is in Notes' de strings (MainMenu.loctable) on macOS 27.2. The recipe's last
// heading is Anmerkungen rather than Notizen, so it isn't read as the app's name. Facts are the English post's; the
// picture is its English one, described in German. Links go to the German meal planner and grocery list posts and to
// English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Linsensuppe mit Zitrone

Für 4 Personen, 35 Minuten. Von: Omas Karteikarte

## Zutaten
- [ ] 250 g rote Linsen
- [ ] 1 Zwiebel
- [ ] 2 Karotten
- [ ] 2 Knoblauchzehen
- [ ] 1 TL gemahlener Kreuzkümmel
- [ ] 2 Zitronen

Aus dem Vorrat: Olivenöl, Salz.

## Zubereitung
1. Zwiebel, Karotten und Knoblauch mit dem Kreuzkümmel in Olivenöl andünsten.
2. Linsen und einen Liter Wasser dazugeben. 20 Minuten köcheln lassen.
3. Die Hälfte pürieren, dann Zitronensaft und Salz nach Geschmack einrühren.

## Anmerkungen
- Gekocht am 14. Nov.: brauchte mehr Zitrone.
`;

const INDEX = `# Rezeptsammlung

## Unter der Woche
- Linsensuppe mit Zitrone

## Wochenende
- Brathähnchen mit Kartoffeln

## Backen
- Bananenbrot

## Will ich ausprobieren
- Sesamnudeln
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Rezeptvorlage?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine Notiz pro Rezept, mit den Zutaten als Checkliste und den Schritten als nummerierte Liste, funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Wie ordne ich Rezepte in Apple Notizen?", a: [
    "Leg jedes Rezept in einen Ordner Rezepte, eine Notiz pro Rezept, und führe eine Übersichtsnotiz, die unter Überschriften wie Unter der Woche, Wochenende und Backen auf sie verlinkt. Die Suche findet ein Rezept über jedes Wort darin, also auch über eine Zutat.",
  ] },
  { q: "Kann ich ein Rezept in Apple Notizen umrechnen?", a: [
    "Nicht von selbst. Notizen rechnet mit Mathematische Ergebnisse, was du tippst, aber eine Zutatenliste halbiert es nicht. Jede Menge änderst du von Hand.",
  ] },
  { q: "Gibt es eine Rezepte-App, die wie Apple Notizen funktioniert?", a: [
    "Pinto Notes sieht aus und funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für eine Rezeptsammlung. Füg ein Rezept in ChatGPT oder Claude ein, und es speichert eine saubere Kopie mit den Zutaten als Checkliste und sortiert sie in deine Sammlung ein.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="rezepte-in-apple-notizen"
      intro={<>
        Rezepte landen in Screenshots, offenen Tabs und auf der Rückseite eines Briefumschlags. Apple Notizen kann sie alle an einem Ort
        halten, wenn jedes Rezept gleich aufgebaut ist. Hier ist eine Rezeptvorlage für Apple Notizen zum Einfügen, eine Übersichtsnotiz, um
        sie wiederzufinden, und wo das nicht mehr reicht.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#rezeptsammlung", label: "Eine Rezeptsammlung" },
          { href: "#in-der-kueche", label: "In der Küche" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Eine Sammlung, die sich selbst ordnet" },
        ]}>
          <p>
            Apple Notizen hat keine Rezeptvorlage, aber eine Notiz pro Rezept erledigt das: Portionen und Zeit oben, die Zutaten als
            Checkliste, die Schritte als nummerierte Liste. Bewahre sie in einem Ordner Rezepte auf, mit einer Übersichtsnotiz, die auf jedes
            verlinkt, und kopiere die Vorlage unten für jedes neue.
          </p>
          <PostCta slug="de/rezepte-in-apple-notizen" path="/de/blog/rezepte-in-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du Rezepte für dich aufräumen lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Rezeptsammlung. Füg ein Rezept in ChatGPT oder Claude ein, und es speichert eine saubere Kopie, die Zutaten als Checkliste, und sortiert sie ein.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/recipe-note" width={1520} height={776} maxWidth={600}
        alt="Eine Notiz Lentil soup with lemon in Pinto Notes auf dem Mac: für 4 Personen, 35 Minuten, sechs Zutaten als Checkliste, Linsen und Zwiebel abgehakt, eine Zeile From the cupboard und drei nummerierte Schritte."
        caption="Ein Rezept in Pinto Notes, so wie die Rezeptsammlung es speichert. Derselbe Aufbau funktioniert in Apple Notizen." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz pro Rezept</h2>
      <p>
        Jedes Rezept bekommt dieselben vier Teile, so liest du es auf einen Blick, auch mit Mehl an den Händen. Die Vorratszeile hält Öl und
        Salz aus der Einkaufs-Checkliste heraus. Lass in jeder Zeile ein Wort stehen, denn ein leerer Checklisteneintrag übersteht das
        Einfügen nicht.
      </p>
      <Keep title="Rezept für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus den Zutaten eine Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du
        das Rezept ein, markierst die Zutaten und tippst auf die Checklisten-Taste.
      </p>

      <h2 id="rezeptsammlung">Eine Rezeptsammlung: eine Übersichtsnotiz</h2>
      <p>
        Ein Ordner voller Rezeptnotizen ist nach Datum sortiert, und das hilft nicht, wenn Dienstag ist und es schnell gehen soll. Führ noch
        eine Notiz, Rezeptsammlung, mit einer Überschrift für jede Art von Essen, und pinne sie oben im Ordner an.
      </p>
      <Keep title="Übersicht der Rezeptsammlung" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"], keys: "⌘K" },
        { on: "iPhone", steps: ["Link hinzufügen"] },
      ]} />
      <p>
        Mach dann aus jedem Namen einen Link: Markiere ihn, wähle Link hinzufügen und such die Notiz des Rezepts aus. Ein Tippen darauf öffnet
        das Rezept. Ideen, die du gefunden, aber noch nicht gekocht hast, kommen unter Will ich ausprobieren, dann wohnen sie nicht mehr in
        deinen Browser-Tabs.
      </p>

      <h2 id="in-der-kueche">In der Küche</h2>
      <ul>
        <li>
          <strong>Hake die Zutaten beim Einkaufen oder Kochen ab.</strong> Die Checkliste ist zugleich die Einkaufsliste, und in der Küche
          zeigt sie dir, was schon im Topf ist.
        </li>
        <li>
          <strong>Setz sie fürs nächste Mal zurück.</strong> Klicke in die Zutaten und wähle Format, Mehr, Alles deaktivieren.
        </li>
        <li>
          <strong>Schreib auf, was du geändert hast.</strong> Eine Zeile unter Anmerkungen, etwa „brauchte mehr Zitrone“, macht ein Rezept zu
          deinem.
        </li>
        <li>
          <strong>Such nach Zutaten.</strong> Die Suche in Notizen liest jedes Wort, also findet „Kichererbsen“ jedes Rezept, das welche
          braucht.
        </li>
      </ul>
      <p>
        Um das Kochen der Woche aus deiner Sammlung zu planen, bringt der <a href="/de/blog/essensplan-vorlage-apple-notizen">Essensplan für
        Apple Notizen</a> die Abendessen und den Einkauf in eine Notiz, und die <a href="/de/blog/einkaufsliste-iphone-notizen">Vorlage für
        die Einkaufsliste</a> sortiert den Einkauf nach Abteilungen. Mehr Notizen zum Einfügen stehen in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="grenzen">Wo eine Rezeptsammlung in Notizen aufhört</h2>
      <ul>
        <li><strong>Jedes Rezept tippst oder räumst du von Hand.</strong> Ein Rezept, das du aus einem Blog kopierst, kommt mit Lebensgeschichte, Werbung und Kommentaren.</li>
        <li><strong>Die Übersicht pflegst du von Hand.</strong> Ein neues Rezept ist erst in der Sammlung, wenn du seinen Link einträgst.</li>
        <li><strong>Kein Umrechnen.</strong> Für zwei aus einem Rezept für sechs zu kochen heißt, jede Menge selbst zu ändern.</li>
        <li><strong>Die Suche findet Wörter, keine Antworten.</strong> Sie findet Kichererbsen. Sie sagt dir nicht, was du mit Kichererbsen und dem Spinat machen kannst, der weg muss.</li>
      </ul>
      <p>
        Für ein paar Lieblingsrezepte reicht ein Ordner mit Notizen. Bei einer echten Sammlung ist das Einsortieren die Arbeit, und die bleibt
        bei dir.
      </p>

      <h2 id="pinto-notes">Eine Rezeptsammlung, die sich selbst ordnet</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/recipe-box">Rezeptsammlung</a> ist eine Notiz mit
        Abschnitten für unter der Woche, das Wochenende, Backen und was du ausprobieren willst, und einer Notiz für jedes Rezept darin.
      </p>
      <p>
        Füg ein Rezept in deine KI ein, mit der ganzen Seite. Sie speichert eine saubere Kopie als eigene Notiz: Portionen und Zeit, die
        Zutaten als Checkliste, was aus dem Vorrat kommt, und kurze nummerierte Schritte, ohne die Lebensgeschichte. Dann setzt sie den Link
        unter die passende Überschrift. Frag „Was kann ich mit Kichererbsen und Spinat machen?“, und sie sieht in der Sammlung nach, oder
        „Halbiere die Linsensuppe für zwei“, und sie rechnet. Du kannst jedes Rezept weiterhin selbst schreiben und bearbeiten, und jede
        frühere Version einer Notiz bleibt erhalten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a>{" "}
        (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Die Rezepte, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
