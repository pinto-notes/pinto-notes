import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-schule-studium");

// German version of /blog/apple-notes-for-school (21 Nov 2026). Slug and title from Google's German autocomplete, read 21
// Nov: "apple notizen für schule" (the only suggestion for "apple notizen schule"), "apple notizen studium", "apple app
// notizen studium", "notizen app schule" (beste, gute, welche, kostenlos), "notizen app studium" (beste, welche, fürs
// studium), "notizen organisieren" (studium). German students search Schule and Studium separately, so the title names
// both; a class is a Fach and a lecture a Vorlesung. Apple's own German words, read 21 Nov 2026, from the Mac guide (macOS
// 27) de-de/guide/notes/apdb5106e334 (Taste „Anhang“, „Audio aufnehmen“, Taste „Transkription“, Taste „Mehr“, „In
// Transkript suchen“, „Transkript zu Notiz hinzufügen“, „Zusammenfassung“ with Apple Intelligence, M1 or later, deleting a
// recording deletes its transcript), apdd655f4242 (Abwärtspfeil, „Anhang umbenennen“, a scan named Gescanntes Dokument),
// apd558a85438 (Ablage, Neuer Ordner; drag a folder onto another), apda85974595 („Mathematische Ergebnisse“, order of
// operations, variables above, the key that keeps the answer, Format, Mathematische Ergebnisse: „Ergebnisse einfügen“,
// „Ergebnisse vorschlagen“, „Aus“), apd0a136b9cc (Format, Tabelle; Taste „Tabelle“; Tabulatortaste) and apd4e6e2c9a6
// (Einblendmenü, „Link teilen“, „Ordner teilen“, „Kopie senden“, notes added to a shared folder are shared, no locked
// notes, @ mentions); the iPhone guide (iOS 27) de-de/guide/iphone/iphbe11247b5 (Taste „Anhänge“, „Audio aufnehmen“,
// swipe down from the top to take notes while recording, iPhone 12 and later; summaries on iPhone 15 Pro or later),
// iph653f28965 (Taste „Anhänge“, „Dokumente scannen“, automatic capture at the page edges, Fertig, saved as a PDF; „Text
// scannen“), iphb8628c6b8 (search finds scanned text and handwriting), ipha61270292 (Taste „Neuer Ordner“, „Notiz
// anpinnen“) and iphe4d04f674 (Taste „Teilen“, the menu under the title, „Link teilen“; everyone signed in with Notizen on
// in iCloud). Bearbeiten, Als Markdown einsetzen, Bearbeiten, Link hinzufügen and Ablage, Notiz duplizieren are Notes' de
// strings (MainMenu.loctable, macOS 27.2), and the Smart Folder rule Checklisten, Nicht markiert is
// SmartFolderChecklistsFilterView there, as in the other German posts. Variable names in the Math Results example have
// no umlauts, since Apple says variables use the Latin alphabet; 1.5 hours became 2 hours to avoid a decimal comma.
// Facts are the English post's; the pictures are its English ones, described in German. Links go to the German Cornell
// and flashcards posts and to English posts where no German one exists.

const ui = UI.de;

const CLASS_NOTE = `# Biologie

## Diese Woche
- [ ] Kapitel 4 lesen
- [ ] Laborbericht zu Enzymen
- [ ] Karteikarten zur Zellatmung

## Vorlesungen
- Zellatmung, 3. November
- Fotosynthese, 10. November

## Prüfungen
- Klausur, 12. Dezember
`;

const LECTURE = `# Zellatmung, 3. November

## Notizen
- Glukose wird abgebaut, um ATP herzustellen, die Energie der Zelle.
- Drei Stufen: Glykolyse, Citratzyklus, Atmungskette.
- Das meiste ATP entsteht in der Atmungskette, in den Mitochondrien.

## Zu fragen
- [ ] Wo in der Zelle findet die Glykolyse statt?

## Zusammenfassung
Glukose wird in drei Stufen zu ATP, und das meiste davon entsteht in den Mitochondrien.
`;

// Tabs between the columns: select those lines in Notes and press the table button.
const TIMETABLE = `Tag\tFach\tRaum
Montag\tBiologie\tLabor 2
Dienstag\tWirtschaft\tHörsaal B
Donnerstag\tBiologie\tLabor 2
Freitag\tWirtschaft\tRaum 14
`;

const MATH = `strecke = 120
zeit = 2
strecke / zeit =
`;

const FAQ = [
  { q: "Ist Apple Notizen gut für Schule und Studium?", a: [
    "Zum Mitschreiben und Aufbewahren, ja. Es ist kostenlos auf iPhone und Mac, scannt Arbeitsblätter, nimmt Vorlesungen mit Transkript auf und rechnet. Beim Lernen ist es schwächer: Es gibt keine Vorlagen, Karteikarten oder Abfragen, und für eine geteilte Notiz braucht jede Person in der Gruppe einen Apple Account.",
  ] },
  { q: "Kann Apple Notizen eine Vorlesung aufnehmen und transkribieren?", a: [
    "Ja. Öffne in einer Notiz das Anhänge-Menü und wähle „Audio aufnehmen“. Notizen schreibt in unterstützten Sprachen ein Live-Transkript, auf einem iPhone 12 oder neuer oder einem Mac mit M1 oder neuer, und Apple Intelligence kann es zusammenfassen, wo es verfügbar ist.",
  ] },
  { q: "Kann ich in Apple Notizen für Prüfungen lernen?", a: [
    "Teilweise. Eine Tabelle mit zwei Spalten funktioniert wie Karteikarten: links eine Frage, rechts die Antwort, und du deckst die rechte Spalte ab, um dich zu prüfen. Nichts plant deine Wiederholungen oder merkt sich, welche Karten du nicht wusstest.",
  ] },
  { q: "Kann ich Apple Notizen mit anderen aus meinem Kurs teilen?", a: [
    "Ja, eine Notiz oder einen ganzen Ordner, mit „Link teilen“. Alle brauchen einen Apple Account mit Notizen in iCloud aktiviert, und eine gesperrte Notiz lässt sich nicht teilen. Allen anderen schickt „Kopie senden“ eine Kopie, die sie lesen, aber nicht bearbeiten können.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="apple-notizen-schule-studium"
      intro={<>
        Apple Notizen ist schon auf deinem iPhone und Mac, also landen viele Notizen aus Schule und Studium sowieso dort. Hier ist eine
        ehrliche Antwort darauf, ob es für Schule oder Uni reicht, dann ein Setup, das ein ganzes Semester hält, vom Ordner pro Fach bis zu
        Notizen, die du mit deiner Lerngruppe teilst.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#gut", label: "Gut für die Schule?" },
          { href: "#ordner", label: "Ein Ordner pro Fach" },
          { href: "#vorlesungen", label: "Eine Notiz pro Vorlesung" },
          { href: "#aufnehmen", label: "Vorlesung aufnehmen" },
          { href: "#lernen", label: "Cornell-Methode und Karteikarten" },
          { href: "#lerngruppe", label: "Lerngruppen" },
          { href: "#pinto-notes", label: "Notizen, die dich abfragen" },
        ]}>
          <p>
            Ja, zum Mitschreiben und Aufbewahren, vor allem wenn deine Lerngruppe auch iPhones und Macs nutzt. Es ist kostenlos, scannt
            Arbeitsblätter, nimmt Vorlesungen mit Transkript auf und rechnet. Beim Lernen fehlt etwas: keine Vorlagen, keine Karteikarten,
            keine Abfragen, also baust du die selbst.
          </p>
          <PostCta template="study-flashcards" slug="de/apple-notizen-schule-studium" path="/de/blog/apple-notizen-schule-studium" position="answer" ui={ui.cta}
            title="Willst du Notizen, die dich abfragen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat kostenlose Vorlagen für die Cornell-Methode und für Karteikarten. Füg deine Vorlesungsnotizen in ChatGPT oder Claude ein, und es schreibt die Fragen und fragt dich dann ab.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="gut">Ist Apple Notizen gut für die Schule?</h2>
      <p>
        Zum Festhalten ist es sehr gut. Es ist kostenlos, eine Notiz, die du auf dem Mac tippst, ist über iCloud auf deinem iPhone, und die
        Suche findet Wörter in getippten Notizen, Handschrift und gescannten Seiten. Es scannt ein Arbeitsblatt als PDF ein, nimmt eine
        Vorlesung auf und schreibt mit, was gesagt wurde, und rechnet eine Aufgabe aus, wenn du ein Gleichheitszeichen tippst.
      </p>
      <p>
        Beim Lernen bietet es weniger. Es gibt keine Vorlagen, keine Karteikarten und nichts, was dir Fragen stellt oder sich merkt, was du
        falsch hattest. Tabellen sortieren nicht und rechnen nicht zusammen. Eine Lerngruppe kann nur in einer Notiz arbeiten, wenn alle einen
        Apple Account haben. Besteht dein Studium vor allem aus Auswendiglernen, wie Medizin, schreib in Notizen mit und plane das
        Wiederholen woanders, wo es für dich geplant wird.
      </p>

      <h2 id="ordner">Ein Ordner pro Fach</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="Die Ordnerliste in Notizen auf dem iPhone mit iOS 27: Quick Notes und Shared, iCloud-Ordner wie Notes, Gift Ideas und Grocery List, darunter ein Bereich Tags."
        caption="Die Ordnerliste auf dem iPhone. Jedes Fach bekommt hier einen Ordner. Bild: Apple." />
      <Paths rows={[
        { on: "Mac", steps: ["Ablage", "Neuer Ordner"] },
        { on: "iPhone", steps: ["Ordnerliste", "Taste „Neuer Ordner“"] },
      ]} />
      <p>
        Leg einen Ordner für jedes Fach an. Um ein Semester zusammenzuhalten, leg einen Ordner für das Semester an und zieh jeden Fachordner
        darauf, dann werden sie zu Unterordnern. Im nächsten Semester fängst du einen neuen an, und die alten Fächer sind aus dem Weg.
      </p>
      <p>
        Führ in jedem Ordner eine Fachnotiz mit dem, was fällig ist, und einer Liste der Vorlesungen, und pinne sie an, damit sie oben bleibt
        (auf dem iPhone legst du den Finger auf die Notiz und tippst auf „Notiz anpinnen“). Markier den Namen einer Vorlesung und wähle
        Bearbeiten, Link hinzufügen (Command-K), um ihn mit der Notiz dieser Vorlesung zu verlinken.
      </p>
      <Keep title="Fachnotiz für Apple Notizen" text={CLASS_NOTE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus den Hausaufgaben eine Checkliste. Lass in jeder Zeile der Checkliste ein Wort stehen, denn ein leerer Eintrag
        übersteht das Einfügen nicht. Ein intelligenter Ordner mit der Regel Checklisten, Nicht markiert zeigt dann jede Notiz, in der noch
        etwas abzuhaken ist, Hausaufgaben eingeschlossen; <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Apple Notes tags
        and Smart Folders</a> (auf Englisch) zeigt, wie du einen anlegst.
      </p>

      <h2 id="vorlesungen">Eine Notiz pro Vorlesung</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="Der untere Teil des Menüs File in Notizen unter macOS 27: Export To, Pin Note, Lock Note, markiert Duplicate Note mit Command-D, und Print."
        caption="Ablage, Notiz duplizieren beginnt die nächste Vorlesung mit der letzten." />
      <p>
        Gib jeder Vorlesung eine eigene Notiz, benannt nach Thema und Datum. Kurze Notizen findest du leichter wieder und lernst leichter aus
        ihnen als aus einer langen Notiz pro Fach. Auf dem Mac kopiert Ablage, Notiz duplizieren (Command-D) die Notiz der letzten Woche mit
        ihren Überschriften, bereit zum Leeren und Füllen.
      </p>
      <Keep title="Vorlesungsnotiz für Apple Notizen" text={LECTURE} copyLabel={ui.copy} />
      <p>
        Schreib in der Vorlesung nur unter Notizen. Fragen kommen unter Zu fragen als Checkliste, damit du sie abhaken kannst, sobald du die
        Antwort hast. Schreib die Zusammenfassung am selben Abend, in zwei oder drei eigenen Sätzen.
      </p>

      <h2 id="scannen">Arbeitsblätter in die Vorlesungsnotiz scannen</h2>
      <Paths rows={[{ on: "iPhone", steps: ["Taste „Anhänge“", "Dokumente scannen"] }]} />
      <p>
        Öffne die Notiz der Vorlesung auf dem iPhone, tippe auf die Taste „Anhänge“, dann auf „Dokumente scannen“, und halte die Seite ins
        Bild. Das iPhone erfasst sie, sobald es die Seitenränder erkennt. Scanne die übrigen Seiten, tippe auf Fertig, und das Arbeitsblatt
        ist als PDF in der Notiz gesichert. Die Suche findet die Wörter darin später. Für ein einzelnes Zitat aus einem Buch tippt „Text
        scannen“ im selben Menü den Text stattdessen in die Notiz.
      </p>
      <p>
        Ein Scan heißt zuerst Gescanntes Dokument. Klick auf dem Mac auf den Pfeil neben seinem Namen und wähle „Anhang umbenennen“, um ihn
        „Arbeitsblatt Woche 3“ zu nennen.
      </p>

      <h2 id="aufnehmen">Eine Vorlesung aufnehmen, mit Transkript und Zusammenfassung</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Taste „Anhang“", "Audio aufnehmen"] },
        { on: "iPhone", steps: ["Taste „Anhänge“", "Audio aufnehmen"] },
      ]} />
      <p>
        Frag zuerst, ob du aufnehmen darfst: Viele Schulen und Hochschulen haben Regeln dazu. Öffne dann die Notiz der Vorlesung, wähle
        „Audio aufnehmen“ im Anhänge-Menü und drück die Aufnahmetaste. Du kannst weitertippen, während sie läuft (auf dem iPhone streichst
        du vom oberen Bildschirmrand nach unten, um zurück zur Notiz zu kommen).
      </p>
      <p>
        Öffne danach die Aufnahme und klick auf die Taste „Transkription“, um zu lesen, was gesagt wurde. Klick auf einen Satz, um diese
        Stelle zu hören. Die Taste „Mehr“ hat „In Transkript suchen“, für die Stelle, an der die Klausur zur Sprache kam, und „Transkript zu
        Notiz hinzufügen“. Klick dann auf „Zusammenfassung“, und Apple Intelligence schreibt eine kurze Zusammenfassung des Transkripts.
      </p>
      <p>
        Transkripte brauchen ein iPhone 12 oder neuer oder einen Mac mit M1 oder neuer, eingestellt auf eine unterstützte Sprache.
        Zusammenfassungen brauchen Apple Intelligence, auf dem iPhone also ein iPhone 15 Pro oder neuer, und das gibt es nicht in jeder
        Sprache und Region. Löschst du eine Aufnahme, wird ihr Transkript mit gelöscht.
      </p>

      <h2 id="tabellen">Tabellen für Stundenplan oder Leseliste</h2>
      <PostFigure src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="Eine Notiz Reading list in Apple Notizen unter macOS 27 mit einer Tabelle aus drei Spalten, Book, Author und Started, und vier Büchern. Lange Titel brechen in ihren Zellen um."
        caption="Eine Tabelle in Apple Notizen unter macOS 27. Notizen legt die Spaltenbreiten fest." />
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Tabelle"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Tabellen-Taste"] },
      ]} />
      <Keep title="Stundenplan für Apple Notizen" text={TIMETABLE} copyLabel={ui.copy}
        note="Jede Zeile hat einen Tab zwischen den Spalten. Füg sie ein und mach aus diesen Zeilen eine Tabelle." />
      <p>
        Füg den Stundenplan in eine neue Notiz ein, markier die fünf Zeilen und drück die Tabellen-Taste. Jeder Tab wird zu einer Spalte. Die
        Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Tabellen in Notizen können nicht sortieren, zusammenrechnen oder
        Spaltenbreiten ändern, also tipp Termine gleich in der Reihenfolge ihrer Daten.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) erklärt den Rest.
      </p>

      <h2 id="lernen">Cornell-Methode und Karteikarten</h2>
      <p>
        Eine Tabelle mit zwei Spalten ist auch der einfachste Weg, in Notizen zu lernen. Für die Cornell-Methode schreibst du links eine kurze
        Frage, rechts deine Notiz und unter die Tabelle eine Zusammenfassung; deck die rechte Spalte ab und antworte laut. Die{" "}
        <a href="/de/blog/cornell-methode-apple-notizen">Vorlage für die Cornell-Methode in Apple Notizen</a> hat eine zum Einfügen.
      </p>
      <p>
        Karteikarten funktionieren genauso: eine Zeile pro Karte, Frage und Antwort. Was Notizen nicht kann, ist entscheiden, welche Karten
        du heute siehst, oder die zurückbringen, die du nicht wusstest. <a href="/de/blog/karteikarten-apple-notizen">Karteikarten in Apple
        Notizen</a> zeigt den Aufbau und die Notlösungen.
      </p>

      <h2 id="rechnen">Mathematische Ergebnisse für Hausaufgaben</h2>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Eine Notiz namens Sequoia Group Expenses auf dem iPhone: jede Ausgabe mit Namen in einer eigenen Zeile, die Namen addiert zu 475 $ und 475 $ geteilt durch 5 ergibt 95 $ pro Person."
        caption="Apples eigenes Beispiel für Mathematische Ergebnisse auf dem iPhone: Zahlen benennen, dann mit den Namen rechnen. Bild: Apple." />
      <Paths rows={[{ on: "Mac", steps: ["Format", "Mathematische Ergebnisse"] }]} />
      <p>
        Tippe eine Aufgabe und ein Gleichheitszeichen, etwa (27/3)^2=, und Notizen schlägt die Antwort vor; drück den Zeilenschalter, um sie
        zu übernehmen. Notizen hält sich an die übliche Reihenfolge der Rechenarten, also setz Klammern, wo du sie brauchst. Du kannst auch
        eine Zahl in einer Zeile weiter oben benennen und dann den Namen verwenden:
      </p>
      <Keep title="Benannte Zahlen für Mathematische Ergebnisse" text={MATH} copyLabel={ui.copy}
        note="Notizen bietet die Antwort nach dem letzten Gleichheitszeichen an. Ändere oben eine Zahl, und die Antwort folgt." />
      <p>
        Format, Mathematische Ergebnisse legt fest, ob Antworten eingefügt, vorgeschlagen oder ausgeschaltet werden. Du bekommst die
        Antwort, nicht den Rechenweg, also eignet es sich am besten, um ein Ergebnis zu prüfen.
      </p>

      <h2 id="lerngruppe">Notizen mit einer Lerngruppe teilen</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Taste „Teilen“", "Einblendmenü", "Link teilen"] },
        { on: "iPhone", steps: ["Taste „Teilen“", "Menü unter dem Titel", "Link teilen"] },
      ]} />
      <p>
        „Link teilen“ lädt Leute ein, in derselben Notiz zu arbeiten, und alle sehen Änderungen, während sie passieren. Leg fest, ob sie
        bearbeiten oder nur ansehen können. Um ein ganzes Fach zu teilen, klick auf dem Mac bei gedrückter Control-Taste auf seinen Ordner
        und wähle „Ordner teilen“, oder öffne ihn auf dem iPhone und tippe auf die Taste „Teilen“. Jede Notiz, die du in einen geteilten
        Ordner legst, ist mit allen darin geteilt, also halte private Notizen woanders. Tippe @ und einen Namen, um jemandem Bescheid zu
        geben, dass du ihn brauchst.
      </p>
      <p>
        Alle brauchen einen Apple Account mit Notizen in iCloud aktiviert, und gesperrte Notizen lassen sich nicht teilen. Für jemanden ohne
        Apple Account schickt „Kopie senden“ im selben Menü eine Kopie, die er lesen, aber nicht bearbeiten kann.
      </p>

      <h2 id="grenzen">Wo Apple Notizen für die Schule aufhört</h2>
      <ul>
        <li><strong>Jede Notiz richtest du von Hand ein.</strong> Es gibt keine Vorlagen, also wird jede Fach- und Vorlesungsnotiz eingefügt oder dupliziert.</li>
        <li><strong>Nichts fragt dich ab.</strong> Eine Spalte abdecken funktioniert, aber Notizen stellt keine Fragen, zählt keine Punkte und bringt nicht zurück, was du nicht wusstest.</li>
        <li><strong>Tabellen enthalten nur Text.</strong> Keine sortierte Liste der Abgaben und keine Summe der Noten in einer Tabelle.</li>
        <li><strong>Gruppen brauchen Apple Accounts.</strong> Wer ein anderes Telefon hat, bekommt eine Kopie, nicht die geteilte Notiz.</li>
      </ul>

      <h2 id="pinto-notes">Notizen, die dich abfragen</h2>
      <Figure shot={{ ...SHOTS.flashcardsApp, alt: "Die Karteikarten-App in einer Notiz in Pinto Notes auf dem Mac: 8 Karten heute fällig, Themen zum Antippen, eine Taste Study now, eine Serie von 11 Tagen mit Kalender, was diese Woche ansteht und wie viele Karten in jedem Fach liegen." }}
        caption="Die Vorlage Study notes and flashcards in Pinto Notes auf dem Mac, mit Beispieldaten." />
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du
        schon nutzt, in deinen Notizen arbeiten. Zwei der kostenlosen Vorlagen sind fürs Lernen gemacht, und ein Tipp fügt jede davon zu
        deinen Notizen hinzu.
      </p>
      <p>
        <a href="/templates/cornell-notes">Cornell notes</a> führt einen Abschnitt pro Vorlesung mit einer Tabelle Cue und Notes und einer
        Zusammenfassung. Füg deine Vorlesungsnotizen in deine KI ein, und sie schreibt eine Frage für jede Zeile und die Zusammenfassung. Sag
        „frag mich zu Angebot und Nachfrage ab“, und sie stellt die Stichworte einzeln, ohne die Notizen zu zeigen, und behält die, die du
        nicht wusstest, unter Cues to revisit.
      </p>
      <p>
        <a href="/templates/study-flashcards">Study notes and flashcards</a> ist eine kleine App in einer Notiz. Füg ein Kapitel ein, und
        deine KI macht daraus fünf bis zehn Karten. Sag „frag mich zehn Karten Biologie ab“, und sie fragt eine Karte nach der anderen, die,
        die du am wenigsten kannst, zuerst, und sagt dir, ob du richtig lagst. Karten, die du nicht wusstest, kommen früher wieder, und
        Karten, die du kannst, warten länger. Du kannst Karten in der App selbst hinzufügen, bearbeiten und löschen, und jede frühere Version
        einer Notiz bleibt erhalten. Der KI-Teil funktioniert, sobald du <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT
        verbindest</a> (auf Englisch) oder Claude, was eine Minute dauert.
      </p>
      <p>
        Die Notizen, die du schon in Apple Notizen hast, kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf
        deinem Mac</a> (auf Englisch) herüber, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
