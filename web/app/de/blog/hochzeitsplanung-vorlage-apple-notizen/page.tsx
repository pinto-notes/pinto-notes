import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "hochzeitsplanung-vorlage-apple-notizen");

// German version of /blog/apple-notes-wedding-planner-template, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "hochzeitsplanung vorlage" returned the
// head, Excel and Word variants; "hochzeit checkliste vorlage" returned "checkliste hochzeit vorlage".
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd0a136b9cc/mac
// (Format > Tabelle), apd93c815aa0/mac (Checkliste), /guide/iphone/iph1ac0b3a2/ios
// (Neue Notiz, Format > Überschrift, Tabelle hinzufügen, Checkliste), iphe4d04f674/ios (sharing).
// The example is fictional and localized for Germany. No picture or shipped Pinto template.
const ui = UI.de;

const TEMPLATE = `Hochzeit von Maja und Sam, 19. Juni 2027

Ort: Gut Lindenhof
Maximale Gästezahl: 48
Antwort bis: 31. Mai 2027
Endgültige Gästezahl für den Veranstaltungsort: 5. Juni 2027
Zuletzt geprüft: 21. November 2026

Gäste, Beispielzeilen
Gast\tAntwort und Essen
Lena Ortiz\tJa; vegetarisch
Alex Chen\tJa; Hähnchen
Nora Patel\tAntwort ausstehend; Essen offen
Ben Weber\tNein; am 20. November abgesagt

Dienstleister
Anbieter\tEntscheidung und nächster Termin
Veranstaltungsort, Gut Lindenhof\tGebucht; Gästezahl bis 5. Juni melden
Catering, Olivenküche\tAngebot erhalten; Probeessen am 28. November
Fotostudio Juni\tIn engerer Wahl; Trauungsfotos anfragen

Nächste Schritte
Maja: Uhrzeit fürs Probeessen bis 24. November bestätigen
Sam: Fotostudio bis 25. November nach Trauungsfotos fragen
Maja: übrige Eingeladene bis 29. November ergänzen
Sam: Restzahlung und Frist bis 30. November im Budget notieren

Offene Fragen
Bietet das Catering neben vegetarisch auch ein veganes Hauptgericht an?
Wer nimmt die Blumen nach der Feier mit nach Hause?
`;

const FAQ = [
  { q: "Wie plane ich eine Hochzeit in Apple Notizen?", a: ["Kopiere die Vorlage in eine Notiz. Auf dem Mac wandelst du die Gäste- und Anbieterzeilen in Tabellen und die nächsten Schritte in eine Checkliste um. Ersetze die Beispieldaten."] },
  { q: "Kann mein Partner die Hochzeitsnotiz mitbearbeiten?", a: ["Ja, wenn sie in iCloud liegt. Beide brauchen einen Apple Account mit „Notizen“ in iCloud. Über „Teilen“ kannst du den Zugriff zum Bearbeiten freigeben."] },
  { q: "Sammelt die Gästeliste Antworten automatisch?", a: ["Nein. Trage jede Antwort selbst ein. „Antwort ausstehend“ ist etwas anderes als „Nein“. Die Vorlage verschickt keine Einladungen und zählt nicht automatisch."] },
  { q: "Kann ChatGPT den Plan in Pinto Notes ändern?", a: ["Nach dem Verbinden kann ChatGPT die Notiz lesen und mit den Antworten oder Angaben bearbeiten, die du ihm gibst. Die Vorlage empfängt keine Gästeantworten von selbst."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="hochzeitsplanung-vorlage-apple-notizen"
    intro={<>Kopiere diese Vorlage für die Hochzeitsplanung in Apple Notizen. Sie enthält Gäste mit Antworten und Essenswünschen, Dienstleister und eine Checkliste für die nächsten Schritte.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Vorlage" }, { href: "#einrichten", label: "Einrichten" },
      { href: "#pflege", label: "Aktuell halten" }, { href: "#grenzen", label: "Grenzen" }, { href: "#pinto-notes", label: "Mit KI ändern" },
    ]}><p>Nutze eine Notiz mit einer Tabelle für Gäste, einer für Dienstleister und einer Checkliste. Gib jeder Aufgabe eine Person und ein Datum. Kopiere den Text und formatiere die Zeilen anschließend in Notizen.</p>
      <PostCta slug="de/hochzeitsplanung-vorlage-apple-notizen" path="/de/blog/hochzeitsplanung-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Den Plan aktualisieren lassen?">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude die Notiz mit den Antworten und Anbieterangaben bearbeiten, die du ihnen gibst.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="vorlage">Gäste und nächste Entscheidungen</h2>
    <p>Die Gästezeilen für Majas und Sams Hochzeit sind Beispiele. Ergänze alle Eingeladenen. Eine Zeile pro Person hält Antwort und Essenswunsch eindeutig fest, auch bei Paaren.</p>
    <Keep title="Hochzeitsplanung für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text einfügen. Tabulatoren trennen die beiden Spalten jeder Tabelle. Tabellen und Checkliste danach einzeln formatieren." />
    <h2 id="einrichten">In Apple Notizen einrichten</h2>
    <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"] }, { on: "Mac", steps: ["Aufgaben markieren", "Checkliste"] }, { on: "iPhone", steps: ["Tabelle hinzufügen"] }, { on: "iPhone", steps: ["Checkliste"] }]} />
    <p>Füge auf dem Mac die Vorlage ein. Markiere die fünf Zeilen vom Spaltentitel „Gast“ bis Ben und klicke auf „Tabelle“. Die Tabulatoren trennen die Spalten. Wiederhole es für die vier Anbieterzeilen. Alternativ wähle „Format“, dann „Tabelle“. Mit der Tabulatortaste in der letzten Zelle entsteht eine neue Zeile. Apple beschreibt dies in der <a href="https://support.apple.com/de-de/guide/notes/apd0a136b9cc/mac">Tabellen-Anleitung</a>.</p>
    <p>Markiere nur die vier Zeilen unter „Nächste Schritte“ und klicke auf „Checkliste“. Jede Aufgabe bekommt einen eigenen Kreis. Antworten von Gästen bleiben Text: Eine ausstehende Antwort ist keine Absage.</p>
    <p>Auf dem iPhone erstellst du eine „Neue Notiz“. Tippe für jede Tabelle auf „Tabelle hinzufügen“ und trage die zwei Spalten ein. Mit „Checkliste“ legst du die Aufgaben an. Abschnittsnamen kannst du mit „Format“, „Überschrift“ gestalten. Du kannst Gäste und Anbieter auch als Text belassen. Siehe Apples <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Anleitung</a>.</p>
    <h2 id="pflege">Den Plan aktuell halten</h2>
    <p>Ändere eine Gästezeile, sobald eine Antwort kommt. Nutze „Ja“, „Nein“ oder „Antwort ausstehend“ und ergänze das Essen. Schreib Unverträglichkeiten mit den Worten der Gäste auf und kläre Unklares vor der Meldung ans Catering. Zähle bestätigte Gäste vor der Frist erneut. Die Gästegrenze oben ist die Kapazität, nicht die aktuelle Zahl.</p>
    <p>Halte den Stand eines Anbieters neben seinem Namen fest. Ein Angebot ist noch keine Buchung. Nach einer Entscheidung ändere den Status und ergänze die nächste Aufgabe. Kosten und Zahlungsfristen gehören in eine eigene <a href="/de/blog/budget-vorlage-apple-notizen">Budgetnotiz</a>.</p>
    <p>Geht die offenen Aufgaben einmal pro Woche gemeinsam durch. Gib neuen Aufgaben eine Person und ein Datum und ändere „Zuletzt geprüft“. Für gemeinsames Bearbeiten einer iCloud-Notiz unter iOS 27 nutze „Teilen“ und die Freigabeoptionen. Beide Personen brauchen einen Apple Account mit aktivierten iCloud-Notizen. Siehe Apples <a href="https://support.apple.com/de-de/guide/iphone/iphe4d04f674/27/ios/27">Anleitung zum Teilen</a>. Der genaue Name der Freigabeoption ist hier bewusst nicht vorgegeben.</p>
    <h2 id="grenzen">Wo die Vorlage aufhört</h2>
    <p>Die Notiz ist ein manuelles Protokoll. Es gibt kein Antwortformular, keine automatische Gästezahl und keinen Sitzplan. Ein eingetipptes Datum löst keinen Alarm aus. Lege wichtige Erinnerungen gesondert an.</p>
    <p>Für wenige Zeilen reicht die Notiz. Für Filter nach Essenswünschen oder Berechnungen in einer langen Gästeliste nutze eine Tabellenkalkulation. Die Notiz hält Entscheidungen und nächste Aufgaben. Mehr zu Grenzen von Tabellen steht im <a href="/blog/apple-notes-tables" hrefLang="en">Tabellenratgeber</a> (auf Englisch).</p>
    <h2 id="pinto-notes">Die Hochzeitsnotiz mit ChatGPT oder Claude ändern</h2>
    <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, mit Tabellen und Checklisten. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI deine Notizen lesen und bearbeiten. „Allow“ erteilt beide Rechte.</p>
    <p>Gib eine konkrete Änderung: „Nora hat zugesagt und möchte vegan essen. Ändere ihre Zeile und füge für Maja bis 24. November eine Aufgabe zur Bestätigung bei der Olivenküche hinzu.“ Vergleiche die Änderungen mit Noras Antwort. Die Angaben kommen von dir, nicht automatisch von Gästen oder Anbietern.</p>
    <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
