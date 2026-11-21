import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-second-brain");

// German version of /blog/apple-notes-second-brain (21 Nov 2026). Google autocomplete hl=de, gl=de,
// read 21 Nov: "apple notizen second brain" and "second brain mit apple notizen" returned no suggestions;
// "beste notizen app für mac" returned "beste notizen app für mac". "Second Brain" remains the term
// in the source query; the heading explains the method in German. Apple de-de pages read 21 Nov 2026:
// guide/notes/apd558a85438/mac (Ablage > Neuer Ordner), not9474646a9/mac (Ablage > Notiz duplizieren),
// apdc88ed7f1d/mac (tags), apd58edc7964/mac (Ablage > Neuer intelligenter Ordner),
// apdb54e469b6/mac (pinning), apde615d29c2/mac (Bearbeiten > Link hinzufügen),
// guide/iphone/iph908d1558b/ios (>> note links), de-de/102288 (tags, smart folders on iPhone).
// No German iPhone label for the smart-folder conversion was verified, so that step is described.

const ui = UI.de;
const HOME = `Start

Diese Woche
Pflanzen für den Balkon auswählen

Aktuelle Projekte
Balkon bepflanzen

Nützliche Nachschlagewerke
Pflanzen für Schatten
Gießplan

Wochenrückblick
Notizen im Eingang lesen
Nützliches einsortieren
Für jedes laufende Projekt den nächsten Schritt festhalten
Abgeschlossene Projekte ins Archiv verschieben
`;
const FAQ = [
  { q: "Kann ich Apple Notizen als Second Brain nutzen?", a: ["Ja. Sammle neue Notizen im Eingang, laufende Vorhaben in Projekte, wiederverwendbare Informationen in Nachschlagen und Erledigtes im Archiv. Eine angeheftete Startnotiz verlinkt, was diese Woche zählt. Sieh den Eingang regelmäßig durch."] },
  { q: "Gibt es eine Vorlage für ein Second Brain in Apple Notizen?", a: ["Kopiere die Startnotiz von dieser Seite. Ersetze die Beispiele durch eigene Projekte und füge echte Notizlinks hinzu. Auf dem Mac geht das über Bearbeiten und Link hinzufügen, auf iPhone und Mac auch mit >> und dem Titel. Eingefügte Titel allein sind nur Text."] },
  { q: "Wie sammle ich Projektnotizen aus mehreren Ordnern?", a: ["Gib den zusammengehörenden Notizen dasselbe Tag, etwa #garten. Erstelle auf dem Mac unter Ablage einen neuen intelligenten Ordner mit einer Tag-Regel. Die Notizen bleiben dabei in ihren ursprünglichen Ordnern."] },
  { q: "Wie oft sollte ich die Notizen durchsehen?", a: ["Probier es einmal pro Woche. Sortiere Nützliches ein, notiere den nächsten Projektschritt und archiviere Abgeschlossenes. Wenn du heute eine Notiz brauchst, sieh früher nach."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="apple-notizen-second-brain"
    intro={<>Apple Notizen kann dein Second Brain sein: ein Ort, an dem du Dinge aufhebst und wiederfindest. Fang mit einem Eingang und einer angehefteten Startnotiz an. Einmal pro Woche sortierst du Neues ein.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#ordner", label: "Vier Ordner" }, { href: "#start", label: "Startnotiz kopieren" },
      { href: "#tags", label: "Tags und intelligente Ordner" }, { href: "#alltag", label: "Im Alltag" },
      { href: "#pinto", label: "Rücklinks und KI" },
    ]}>
      <p>Lege Eingang, Projekte, Nachschlagen und Archiv an. Hefte eine Startnotiz mit Links zu laufenden Projekten an. Ein gemeinsames Tag und ein intelligenter Ordner sammeln verwandte Notizen über Ordner hinweg. Neue Notizen kommen zuerst in den Eingang. Geh sie wöchentlich durch.</p>
      <PostCta slug="de/apple-notizen-second-brain" path="/de/blog/apple-notizen-second-brain" position="answer" ui={ui.cta} title="Lass deine KI mit deinen Notizen arbeiten">
        <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. „Linked From“ zeigt, welche Notizen auf die offene Notiz verlinken. Nach dem Verbinden können ChatGPT oder Claude deine Notizen lesen und bearbeiten.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="ordner">Fang mit vier Ordnern an</h2>
    <MenuPaths rows={[{ on: "Mac", steps: ["Ablage", "Neuer Ordner"] }]} />
    <p>Wähle auf dem Mac in der Seitenleiste einen Ordner unter iCloud und dann Ablage, Neuer Ordner. Wiederhole das für die folgenden Ordner. Apple weist darauf hin, dass bei Accounts anderer Anbieter manche Funktionen fehlen.</p>
    <ul>
      <li><strong>Eingang:</strong> neue Gedanken, die du noch nicht einsortiert hast.</li>
      <li><strong>Projekte:</strong> Vorhaben mit einem Ende, etwa den Balkon bepflanzen. Halte Plan und nächsten Schritt in einer Notiz fest.</li>
      <li><strong>Nachschlagen:</strong> Informationen, die du wieder brauchen wirst, etwa Pflanzen für Schatten.</li>
      <li><strong>Archiv:</strong> abgeschlossene Projekte, die du später nachsehen möchtest.</li>
    </ul>
    <p>Beginne mit der nächsten neuen Notiz. Du musst nicht zuerst die ganze Sammlung sortieren. Auf dem Mac kannst du eine Notiz aus der Liste auf einen Ordner ziehen. Unterordner helfen, wenn ein Ordner zu unübersichtlich wird.</p>
    <h2 id="start">Kopiere eine Startnotiz und hefte sie an</h2>
    <p>Lege „Start“ in Projekte ab. Kopiere diesen Text in eine neue Notiz und ersetze die Beispiele. Die Projektnamen sind zunächst Platzhalter. Danach verlinkst du die echten Notizen.</p>
    <Keep title="Startnotiz für dein Second Brain" text={HOME} note="Als Text einfügen. Projekt- und Nachschlagenotizen anlegen, dann ihre Titel durch echte Notizlinks ersetzen." />
    <MenuPaths rows={[{ on: "Mac", steps: ["Bearbeiten", "Link hinzufügen"] }]} />
    <p>Erstelle eine Notiz „Balkon bepflanzen“. Markiere den Namen in „Start“, wähle Bearbeiten, Link hinzufügen, tippe den Titel und wähle die Notiz. Lass die Option für den Notiztitel eingeschaltet, damit der Linkname bei einer Umbenennung mitgeht. Wiederhole das für wichtige Nachschlagenotizen.</p>
    <p>Auf iPhone und Mac kannst du auch <code>&gt;&gt;</code> und dann den Titel der Zielnotiz tippen. Apple beschreibt das <a href="https://support.apple.com/de-de/guide/notes/apde615d29c2/mac">Verlinken auf dem Mac</a>. Wähle „Start“ in der Notizenliste und dann Ablage, Notiz anpinnen. So bleibt sie oben im Ordner.</p>
    <h2 id="tags">Tags verbinden Themen über Ordner hinweg</h2>
    <p>Ordner legen den Ablageort fest. Ein Tag sammelt Notizen aus mehreren Ordnern. Gib dem Balkonprojekt und „Pflanzen für Schatten“ das Tag <code>#garten</code>. Auf dem iPhone aktiviert ein Leerzeichen nach dem Tag dieses Tag. Verwende zunächst nur Tags, die du wieder brauchen wirst.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Ablage", "Neuer intelligenter Ordner"] }]} />
    <p>Erstelle auf dem Mac einen intelligenten Ordner namens „Garten“ und wähle Tags als Kriterium. Wähle #garten und bestätige. Auf dem iPhone legst du in der Ordnerliste einen neuen Ordner an, wandelst ihn in einen intelligenten Ordner um und wählst den Tag-Filter. Die Notizen bleiben an ihrem ursprünglichen Ort.</p>
    <p>Der Ordner ist ein gespeicherter Filter. Du musst das Tag weiter selbst hinzufügen. Der <a href="/blog/apple-notes-tags-smart-folders">englische Leitfaden zu Tags und intelligenten Ordnern</a> erklärt die Regeln.</p>
    <h2 id="alltag">Erst festhalten, dann einsortieren</h2>
    <p>Wähle auf dem Mac den Eingang und erstelle eine neue Notiz. Gib ihr einen Titel, den du nächsten Monat noch verstehst, etwa „Pflanzen für den Nordbalkon“. Notiere die nützlichen Details und gegebenenfalls die Quelle. Das Einsortieren kann bis zum Wochenrückblick warten.</p>
    <p>Öffne einmal pro Woche den Eingang. Verschiebe wiederverwendbare Informationen nach Nachschlagen, laufende Arbeit nach Projekte. Schreib für jedes Projekt den nächsten Schritt auf. Verlinke wichtige Projekte in „Start“. Verschiebe abgeschlossene Vorhaben ins Archiv und entferne ihren Link aus „Start“.</p>
    <p>Wenn du oft dieselben Überschriften brauchst, behalte eine leere Projektnotiz als Vorlage. Mit Ablage, Notiz duplizieren erstellst du auf dem Mac eine Kopie. Halte Ergebnisse und Entscheidungen fest, nicht bloß ungelesene Links.</p>
    <h2 id="grenzen">Wo das System an seine Grenzen kommt</h2>
    <p>Die Startnotiz pflegt sich nicht selbst. Ein neues Projekt erscheint dort erst, wenn du es verlinkst. Ein intelligenter Ordner zeigt nur Notizen, die seine Regeln erfüllen. Apple Notizen zeigt außerdem keine Liste der Notizen, die auf die gerade offene Notiz verlinken.</p>
    <h2 id="pinto">Rücklinks und KI in Pinto Notes</h2>
    <p>In Pinto Notes zeigt „Linked From“ im Mehr-Menü einer Notiz, welche Notizen darauf verlinken. Es zählen nur echte Links. So findest du von einer Nachschlagenotiz zurück zu den Projekten, die sie verwenden. Der <a href="/blog/apple-notes-backlinks">englische Rücklink-Leitfaden</a> zeigt das.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> kann die KI deine Notizen lesen und bearbeiten. Du könntest sie beim Wochenrückblick einen Entwurf der nächsten Schritte schreiben lassen. Vergleiche ihn mit den Notizen und korrigiere ihn. Auch von der KI angelegte Notizen kannst du selbst lesen und bearbeiten.</p>
    <p>Deine Apple Notizen gelangen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> zu Pinto Notes. Apple Notizen bleibt unverändert.</p>
  </LocalPostPage>;
}
