import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-organisieren");

// German version of /blog/apple-notes-organize (21 Nov 2026). Slug and title from Google's German autocomplete, read 21
// Nov: "apple notizen organisieren", "notizen organisieren" (app, arbeit, studium, digitale), "notizen iphone
// organisieren", "notizen ordnen" (iphone, apple, alphabetisch), "apple notizen ordner" (erstellen, ordnerstruktur,
// alphabetisch sortieren, umbenennen, teilen), "notizen sortieren" (iphone, apple, alphabetisch), "notizen app ordner"
// (erstellen, intelligenter ordner, mit ordnerstruktur), "apple notizen tipps". Apple's own German words, read 21 Nov 2026,
// from the Mac guide (macOS 27) de-de/guide/notes/apd558a85438 (Ablage, Neuer Ordner; drag notes in, Option-Taste copies;
// drag a folder onto another for a Unterordner; „Ordner umbenennen“ and „Ordner löschen“ from the Taste „Mehr“ or
// Control-click; deleted folders' notes go to Zuletzt gelöscht for 30 days; no subfolder in „Alle [Account]“ or Notizen),
// apdb54e469b6 (Notizen, Einstellungen, „Notizen sortieren nach“; Taste „Mehr“, „Sortieren nach“ for one folder; the All
// folders and Zuletzt gelöscht use the default; Ablage, Notiz anpinnen; two-finger swipe and the Stecknadel; the Angepinnt
// and Notizen sections; pins show on every device with the same Apple Account; needs upgraded iCloud notes or notes on
// the Mac), apd000074a4e („Notizen nach Datum gruppieren“, „Nach Datum gruppieren“, not when sorted by title) and
// apde615d29c2 (Bearbeiten, Link hinzufügen); the iPhone guide (iOS 27) de-de/guide/iphone/ipha61270292 (Taste „Neuer
// Ordner“, finger on a folder to drag it, Taste „Ordner bewegen“, „Bewegen“, Taste „Ordneraktionen“, „Sortieren nach“,
// „Älteste zuerst“, „Absteigend“, Einstellungen, Apps, Notizen, „Sortieren nach“, „Nach Datum gruppieren“, „Notiz
// anpinnen“) and support.apple.com/de-de/118442 (21 Sep 2026: Mehr-Taste, „Notizen auswählen“, Taste „Ordner“). Bewegen
// in and the sort names Bearbeitungsdatum, Erstellungsdatum and Titel are Notes' de strings (Localizable.loctable, macOS
// 27.2), as in the German iCloud post; the Smart Folder rules Tags with „Nur
// Notizen ohne Tags“, Bearbeitungsdatum with „In den letzten“ and Checklisten with „Nicht markiert“ are the
// SmartFolder*.loctable strings there. Bearbeiten, Als Markdown einsetzen and Format, Mehr, Alles deaktivieren are as in
// the other German template posts (Notes' de strings and de-de/guide/notes/apd93c815aa0). Facts are the English post's;
// the pictures are its English ones, described in German. Links go to the German meeting notes post and to English posts
// where no German one exists.

const ui = UI.de;

const TIDY = `# Wöchentliches Aufräumen

- [ ] Jede Notiz im Ordner Notizen ablegen oder löschen
- [ ] Den Notizen in Ohne Tags ein Tag geben, wo eins fehlt
- [ ] Diese Woche nach Notizen im falschen Ordner durchsehen
- [ ] Erledigtes nicht mehr anpinnen
- [ ] Erledigte Listen in Offene Aufgaben leeren oder löschen
- [ ] Abgeschlossene Projekte ins Archiv bewegen
`;

const FAQ = [
  { q: "Wie organisiere ich Apple Notizen am besten?", a: [
    "Ein paar breite Ordner für die Bereiche deines Lebens, Tags für Themen quer dazu, eine angepinnte Übersichtsnotiz pro Ordner und zehn Minuten pro Woche, um abzulegen, was sich angesammelt hat. Die Suche findet jedes Wort, also muss das System nur das Durchblättern leicht machen.",
  ] },
  { q: "Wie sortiere ich Apple Notizen alphabetisch?", a: [
    "Sortier nach Titel. Öffne auf dem iPhone den Ordner, tippe auf die Taste „Ordneraktionen“, dann auf „Sortieren nach“, und wähle Titel. Klick auf dem Mac auf die Taste „Mehr“ des Ordners und wähle „Sortieren nach“, oder stell in Notizen, Einstellungen „Notizen sortieren nach“ für alle Ordner ein. Ein Ordner, der nach Titel sortiert ist, lässt sich nicht nach Datum gruppieren.",
  ] },
  { q: "Kann man in Apple Notizen Unterordner anlegen?", a: [
    "Ja. Zieh einen Ordner auf einen anderen, auf dem Mac oder iPhone (auf dem iPhone legst du zuerst den Finger darauf). Nur der Ordner „Alle“ eines Accounts und der Ordner Notizen können keine Unterordner aufnehmen.",
  ] },
  { q: "Ordner oder Tags in Apple Notizen?", a: [
    "Beides. Eine Notiz liegt in einem Ordner und kann viele Tags tragen. Apples eigener Tipp in Notizen: Ordner für breite Bereiche wie Arbeit, Tags für bestimmte Themen wie #steuern. Eine Notiz mit Tag lässt sich nicht sperren, also ordne gesperrte Notizen über Ordner.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="apple-notizen-organisieren"
      intro={<>
        Die meisten Sammlungen in Apple Notizen wachsen gleich: Alles landet in Notizen, sortiert nach der letzten Änderung, bis Scrollen
        nicht mehr hilft. So organisierst du Apple Notizen auf iPhone und Mac mit dem, was Notizen schon kann, mit einer Ordnerstruktur zum
        Übernehmen und mit zehn Minuten Aufräumen pro Woche, damit es so bleibt.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#ordner", label: "Ordner" },
          { href: "#sortieren", label: "Sortieren" },
          { href: "#anpinnen", label: "Anpinnen" },
          { href: "#tags", label: "Tags und intelligente Ordner" },
          { href: "#struktur", label: "Eine Struktur zum Übernehmen" },
          { href: "#links", label: "Links" },
          { href: "#aufraeumen", label: "Wöchentlich aufräumen" },
        ]}>
          <p>
            Leg eine Handvoll breiter Ordner an, mit Unterordnern nur dort, wo ein Ordner voll wird, und gib Notizen Tags für Themen, die
            über Ordner hinweg gehen. Sortier jeden Ordner so, wie du Dinge suchst (nach Bearbeitungsdatum, Erstellungsdatum oder Titel),
            und pinne die paar Notizen an, die du jeden Tag öffnest. Nimm dir dann zehn Minuten pro Woche, um abzulegen, was in Notizen
            gelandet ist.
          </p>
          <PostCta slug="de/apple-notizen-organisieren" path="/de/blog/apple-notizen-organisieren" position="answer" ui={ui.cta}
            title="Lieber nicht selbst ablegen?">
            <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen. Verbinde ChatGPT oder Claude, und sie bewegen Notizen in die richtigen Ordner, geben ihnen Tags und räumen auf, wenn du darum bittest.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="Die Ordnerliste in Notizen auf dem iPhone mit iOS 27: Quick Notes und Shared, iCloud-Ordner wie Notes, Gift Ideas, Grocery List und Sketches, darunter ein Bereich Tags."
        caption="Ordner für Bereiche, Tags für Themen, beides in einer Liste. Bild: Apple." />}
      faq={FAQ}
    >
      <h2 id="ordner">Ordner und Unterordner</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Ablage", "Neuer Ordner"] },
        { on: "iPhone", steps: ["Ordnerliste", "Taste „Neuer Ordner“"] },
      ]} />
      <p>
        Wähle auf dem Mac einen Ordner in dem Account, den du willst, wähle Ablage, Neuer Ordner und gib einen Namen ein. Tippe auf dem
        iPhone in der Ordnerliste auf die Taste „Neuer Ordner“. Für einen Unterordner ziehst du einen Ordner auf einen anderen (auf dem
        iPhone legst du zuerst den Finger darauf). Zieh ihn wieder heraus, um das rückgängig zu machen. Der Ordner „Alle“ und der Ordner
        Notizen können keine Unterordner aufnehmen, also bau deine Struktur daneben.
      </p>
      <p>
        Um eine Notiz auf dem Mac zu bewegen, zieh sie auf einen Ordner in der Seitenleiste, oder klick bei gedrückter Control-Taste darauf
        und wähle „Bewegen in“. Halte beim Loslassen die Option-Taste gedrückt, um sie stattdessen zu kopieren. Streich auf dem iPhone auf
        der Notiz nach links und tippe auf die Taste „Ordner bewegen“, oder leg den Finger auf sie und tippe auf „Bewegen“.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notizen auf dem iPhone mit iOS 27 im Auswahlmodus: 3 Selected, drei Notizen abgehakt und unten links eine Taste Folder, um sie zu bewegen."
        caption="Viele Notizen auf einmal ablegen: Notizen auswählen, dann die Taste „Ordner“. Bild: Apple." />
      <p>
        Für einen Stapel Notizen auf dem iPhone öffnest du den Ordner, tippst auf die Mehr-Taste, dann auf „Notizen auswählen“, hakst sie
        ab und tippst auf die Taste „Ordner“. Löschst du einen Ordner, landen seine Notizen in „Zuletzt gelöscht“ und bleiben dort 30 Tage,
        also lässt sich ein falsches Löschen rückgängig machen.
      </p>

      <h2 id="sortieren">Notizen nach Datum oder Titel sortieren</h2>
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Die allgemeinen Einstellungen von Apple Notizen auf einem Mac mit macOS 26: Sort notes by Date Edited, New notes start with Title und Default account auf iCloud gestellt." }}
        ground="sky" caption="Notizen, Einstellungen auf einem Mac mit macOS 26. „Notizen sortieren nach“ (hier Sort notes by) legt die Reihenfolge für alle Ordner fest." />
      <Paths rows={[
        { on: "Mac", steps: ["Notizen", "Einstellungen", "Notizen sortieren nach"] },
        { on: "Mac, ein Ordner", steps: ["Taste „Mehr“", "Sortieren nach"] },
        { on: "iPhone, ein Ordner", steps: ["Taste „Ordneraktionen“", "Sortieren nach"] },
        { on: "iPhone, alle Ordner", steps: ["Einstellungen", "Apps", "Notizen", "Sortieren nach"] },
      ]} />
      <p>
        Ein Ordner kann nach Bearbeitungsdatum, Erstellungsdatum oder Titel sortieren. Titel ist der Weg, Apple Notizen alphabetisch zu
        sortieren, und passt zu einem Ordner mit Notizen zum Nachschlagen wie Rezepten oder Anleitungen. Das Bearbeitungsdatum passt zu
        einem Arbeitsordner, in dem das, was du zuletzt angefasst hast, auch das ist, was du als Nächstes brauchst. Auf dem iPhone bietet
        „Sortieren nach“ außerdem „Älteste zuerst“ für ein Datum und „Absteigend“ für einen Titel.
      </p>
      <p>
        Eine Sortierung für einen Ordner gilt nur für diesen Ordner. Auf dem Mac folgen die Ordner „Alle“ und „Zuletzt gelöscht“ immer der
        Standardsortierfolge aus den Einstellungen. Notizen gruppiert eine Liste außerdem nach Daten wie Heute und Gestern; das schaltest du
        im selben Menü mit „Nach Datum gruppieren“ aus. Ein Ordner, der nach Titel sortiert ist, lässt sich nicht nach Datum gruppieren.
      </p>

      <h2 id="anpinnen">Pinne die Notizen an, die du jeden Tag öffnest</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Ablage", "Notiz anpinnen"] },
        { on: "iPhone", steps: ["Finger auf die Notiz legen", "Notiz anpinnen"] },
      ]} />
      <p>
        Eine angepinnte Notiz bleibt oben in ihrem Ordner, egal wie sortiert ist. Auf dem Mac kannst du auch mit zwei Fingern nach rechts
        streichen und auf die Stecknadel klicken, oder eine Notiz zwischen den Bereichen Angepinnt und Notizen ziehen. Streich auf dem iPhone
        nach rechts und tippe auf die Stecknadel. Eine angepinnte Notiz ist auf jedem Gerät mit demselben Apple Account angepinnt. Dafür
        brauchst du iCloud-Notizen oder Notizen auf deinem Mac.
      </p>
      <p>
        Pinne wenig an. Zwei oder drei pro Ordner reichen: die aktuelle Einkaufsliste, der Plan dieser Woche und eine Übersichtsnotiz für
        den Ordner (mehr dazu unten).
      </p>

      <h2 id="tags">Tags und intelligente Ordner</h2>
      <p>
        Eine Notiz liegt in einem Ordner, kann aber viele Tags tragen. Tippe irgendwo in der Notiz # und ein Wort, etwa #steuern. Apples
        eigener Tipp in Notizen lautet: Ordner für breite Bereiche, Tags für Themen. Das trägt: Ein Beleg kommt in Finanzen mit #steuern, und
        eine Notiz über die Steuerberaterin kommt in Arbeit, ebenfalls mit #steuern.
      </p>
      <p>
        Ein intelligenter Ordner ist ein gespeicherter Filter, der Notizen aus allen Ordnern nach Regeln wie Tags, Bearbeitungsdatum oder
        Checklisten zeigt. Drei lohnen sich für das wöchentliche Aufräumen unten: Ohne Tags (die Regel Tags auf „Nur Notizen ohne Tags“),
        Diese Woche (Bearbeitungsdatum in den letzten 7 Tagen) und Offene Aufgaben (Checklisten, Nicht markiert). Die Notizen bleiben, wo
        sie sind. Jede Regel, und warum ein Tag manchmal nicht entsteht, steht in{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Apple Notes tags and Smart Folders</a> (auf Englisch). Ein Haken:
        Eine Notiz mit Tag lässt sich nicht sperren.
      </p>

      <h2 id="struktur">Eine einfache Ordnerstruktur zum Übernehmen</h2>
      <p>
        Fang mit Ordnern für die Orte an, an denen du suchen würdest, und füg einen Unterordner erst hinzu, wenn ein Ordner zu lang zum
        Überfliegen wird. Zwei Ebenen reichen den meisten.
      </p>
      <ul>
        <li><strong>Notizen.</strong> Der eingebaute Ordner, als Eingang. Hier sammeln, später ablegen.</li>
        <li><strong>Zuhause.</strong> Wohnung, Auto, Anleitungen und Garantien.</li>
        <li><strong>Finanzen.</strong> Budgets, Belege, Abos. Gib allem für die Steuererklärung das Tag #steuern.</li>
        <li><strong>Gesundheit.</strong> Termine, Medikamente, Training.</li>
        <li><strong>Arbeit.</strong> Mit den Unterordnern Projekte, Meetings und Nachschlagen, wenn viel los ist.</li>
        <li><strong>Reisen.</strong> Eine Notiz pro Reise.</li>
        <li><strong>Rezepte.</strong> Nach Titel sortiert.</li>
        <li><strong>Ideen.</strong> Alles, worauf du zurückkommen willst.</li>
        <li><strong>Archiv.</strong> Abgeschlossene Projekte und alte Reisen, aus dem Weg und trotzdem durchsuchbar.</li>
      </ul>
      <p>
        Apple Notizen für die Arbeit organisierst du nach demselben Muster. Gib jedem Projekt einen Unterordner unter Arbeit, und markiere
        einen Kunden über Ordner hinweg mit einem Tag, etwa #acme. Meetings gehen am leichtesten mit einer Notiz pro Meeting im selben
        Aufbau, den dir die <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Vorlage für Meeting-Protokolle in Apple
        Notizen</a> gibt. Mehr Notizen zum Einfügen stehen in{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).
      </p>

      <h2 id="links">Notizen in einer Übersicht verlinken</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"], keys: "⌘K" },
        { on: "iPhone", steps: ["Link hinzufügen"] },
      ]} />
      <p>
        Ordner sortieren Notizen nach Datum oder Titel. Eine Übersichtsnotiz sortiert sie nach Bedeutung. Leg pro vollem Ordner eine Notiz
        an, etwa Übersicht Arbeit, mit einer Überschrift für jedes Projekt und einem Link zu jeder Notiz darunter, und pinne sie an. Zum
        Verlinken markierst du den Text, wählst „Link hinzufügen“ und wählst die Notiz, oder du tippst <code>&gt;&gt;</code> und den Titel
        der Notiz. Unter iOS 27 und macOS 27 kann ein Link auch zu einer Überschrift in einer Notiz springen, was{" "}
        <a href="/blog/apple-notes-ios-27" hrefLang="en">What&apos;s new in Apple Notes</a> (auf Englisch) beschreibt.
      </p>

      <h2 id="aufraeumen">Zehn Minuten Aufräumen pro Woche</h2>
      <p>
        Geh einmal pro Woche (Sonntagabend passt gut) den Eingang und die drei intelligenten Ordner durch. Füg diese Checkliste in eine
        Notiz ein und pinne sie an.
      </p>
      <Keep title="Wöchentliches Aufräumen für Apple Notizen" text={TIDY} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus den Zeilen eine Checkliste. Auf dem iPhone tippst du die
        Zeilen, markierst sie und tippst auf die Checklisten-Taste. Wenn du fertig bist, klick in die Liste und wähle Format, Mehr, Alles
        deaktivieren, und sie ist bereit für die nächste Woche.
      </p>

      <h2 id="grenzen">Wo das Organisieren in Apple Notizen aufhört</h2>
      <ul>
        <li><strong>Ablegen geht von Hand.</strong> Jede Notiz im Eingang wartet darauf, dass du sie bewegst.</li>
        <li><strong>Tags kommen von Hand dazu</strong>, eine Notiz oder eine markierte Gruppe nach der anderen.</li>
        <li><strong>Übersichtsnotizen veralten.</strong> Eine neue Notiz steht erst in der Übersicht, wenn du ihren Link einfügst.</li>
        <li><strong>Die Suche findet Wörter, keine Antworten.</strong> Sie findet jede Notiz, in der „Küche“ steht. Welche davon das Budget festgelegt hat, sagt sie nicht.</li>
      </ul>
      <p>
        Für ein paar hundert Notizen reichen Ordner, Anpinnen und ein wöchentliches Aufräumen. Darüber hinaus ist das Aufräumen die
        eigentliche Arbeit, und sie bleibt bei dir.
      </p>

      <h2 id="pinto-notes">Notizen, die sich selbst ablegen</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, mit Ordnern, Unterordnern, Anpinnen und einer Suche über
        jedes Wort. Sobald ChatGPT oder Claude verbunden ist, können sie das Aufräumen für dich übernehmen. Sag „leg alles aus Notizen in die
        richtigen Ordner“, „gib jeder Notiz über den Küchenumbau ein Tag“ oder „beweg meine abgeschlossenen Reisen ins Archiv“, und die
        Notizen wandern. Du kannst weiterhin alles selbst ablegen und bearbeiten, und jede frühere Version einer Notiz bleibt erhalten.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Für die wöchentliche Gewohnheit stellt dir die kostenlose Vorlage <a href="/templates/weekly-review">Weekly review</a> über deine KI
        am Sonntag fünf Fragen und schreibt die Woche in eine Notiz, die neueste Woche oben, mit deinen drei wichtigsten Punkten für die
        nächste Woche als Checkliste. Mehr gibt es unter <a href="/templates">Vorlagen</a>.
      </p>
      <p>
        Die Notizen, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) herüber, Ordner eingeschlossen, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
