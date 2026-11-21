import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "kundenkartei-vorlage-apple-notizen");

// German version of /blog/apple-notes-client-tracker-template, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "kundenkartei vorlage" returned the head,
// "kundenkartei vorlage excel", "kostenlos", "pdf" and "word". No exact Notes demand inferred.
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd0a136b9cc/mac
// (Format > Tabelle), apd93c815aa0/mac (Checkliste), apde615d29c2/mac (links),
// /guide/iphone/iph1ac0b3a2/ios (Checkliste, Tabelle hinzufügen), iph908d1558b/ios (links).
// The filled examples are fictional and use German names and dates. No picture.
const ui = UI.de;

const TEMPLATE = `Keramikwerkstatt am Kanal

Kontakt
Mara Ehlers, Inhaberin
mara@kanalkeramik.example
Bevorzugt E-Mail. Telefonate dienstags am Nachmittag.

Zusammenarbeit
Texte für die Winterkollektion der Website.
Mara gibt die Texte frei. Leon liefert Produktfotos.

Aktueller Stand
Ersten Entwurf am 18. November 2026 gesendet.
Vor der Überarbeitung der Produktseiten auf Maras Rückmeldung warten.
Letzter Kontakt: 20. November 2026, E-Mail von Mara.
Nächste Nachfrage: 24. November 2026, falls noch keine Kommentare da sind.

Nächste Schritte
Mara am 24. November nach Kommentaren fragen
Mit Leon klären, wann die Fotos der Glasuren kommen

Kontaktverlauf
20. November 2026: Mara will den Entwurf am Montag lesen.
18. November 2026: Ersten Entwurf gesendet. Zwei Fotos fehlen noch.

Fürs nächste Mal
Deutsche Rechtschreibung verwenden. Pflegehinweise auf jeder Produktseite lassen.

Verwandte Notizen
Keramikwerkstatt am Kanal, Auftakt, 12. November 2026
`;

const INDEX = `Kunden

Kunde\tLetzter Kontakt\tNächste Nachfrage
Keramikwerkstatt am Kanal\t20.11.2026\t24.11., Kommentare zum Entwurf
Birkenstudio\t19.11.2026\t25.11., Termine im Januar
`;

const FAQ = [
  { q: "Kann ich Kundenkontakte in Apple Notizen verwalten?", a: ["Ja. Lege pro Kunde eine Notiz mit Kontaktdaten, laufender Arbeit und nächster Nachfrage an. Eine eigene Übersicht zeigt die Termine und verlinkt die Kundennotizen."] },
  { q: "Was gehört zwischen zwei Gesprächen in die Kundennotiz?", a: ["Notiere den aktuellen Stand, den letzten Kontakt und den nächsten konkreten Schritt. Ergänze nach jedem Austausch eine kurze Zeile mit Datum. Ausführliche Besprechungen bleiben in eigenen Notizen."] },
  { q: "Erinnert mich das Datum an die Nachfrage?", a: ["Nein. Das Datum ist nur Text. Lege für wichtige Fristen eine gesonderte Erinnerung an und prüfe die Übersicht selbst."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="kundenkartei-vorlage-apple-notizen"
    intro={<>Mit dieser Kundenkartei in Apple Notizen führst du pro Kunde eine Notiz. Eine zweite Notiz zeigt, wann du nachfragen musst. Kopiere die ausgefüllten Beispiele und ersetze die Angaben.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Kundennotiz" }, { href: "#uebersicht", label: "Übersicht" },
      { href: "#pflege", label: "Aktuell halten" }, { href: "#grenzen", label: "Grenzen" }, { href: "#pinto-notes", label: "Mit KI nutzen" },
    ]}><p>Schreibe Kontaktangaben, Verlauf und nächste Nachfrage in eine Notiz pro Kunde. Eine verlinkte Übersicht bündelt die Termine. Du pflegst beide Notizen selbst.</p>
      <PostCta slug="de/kundenkartei-vorlage-apple-notizen" path="/de/blog/kundenkartei-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Den Kundenverlauf nachlesen lassen?">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude Kundennotizen lesen und den nächsten Schritt mit deinen neuen Angaben aktualisieren.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="vorlage">Eine Notiz pro Kunde</h2>
    <p>Im Beispiel wartet eine freie Texterin auf Rückmeldung. Die bevorzugte Kontaktart steht oben. Der aktuelle Stand zeigt den nächsten Schritt, ohne dass du alle E-Mails nachlesen musst.</p>
    <Keep title="Kundennotiz für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text einfügen. Die zwei Zeilen unter „Nächste Schritte“ kannst du in eine Checkliste umwandeln." />
    <p>Markiere auf dem Mac die zwei Aufgabenzeilen und klicke auf „Checkliste“. Auf dem iPhone startest du unter der Überschrift mit der Taste „Checkliste“ und gibst die Aufgaben einzeln ein. Der Kontaktverlauf bleibt datierter Text. Apple beschreibt die Tasten in den Anleitungen für <a href="https://support.apple.com/de-de/guide/notes/apd93c815aa0/mac">Mac</a> und <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone</a>.</p>
    <p>Für einen neuen Kunden kopierst du die Gliederung und ersetzt alle Beispieldaten. Halte den Verlauf kurz: Was wurde vereinbart, worauf wartest du? Ein ganzer E-Mail-Verlauf hilft hier selten.</p>
    <h2 id="uebersicht">Alle Nachfragen in einer Übersicht</h2>
    <p>Lege eine zweite Notiz namens „Kunden“ an. Jede Zeile gehört zu einer Kundennotiz. In der letzten Spalte reicht ein knapper nächster Schritt. Die Daten passen zum Beispiel oben.</p>
    <Keep title="Kundenübersicht für Apple Notizen" text={INDEX} copyLabel={ui.copy} note="Zwischen den Spalten stehen Tabulatoren. Auf dem Mac kannst du die Zeilen nach dem Einfügen in eine Tabelle umwandeln." />
    <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"] }]} />
    <p>Markiere die drei Zeilen vom Spaltentitel bis zum Birkenstudio und klicke auf die Taste „Tabelle“. Jeder Tabulator trennt eine Spalte. Mit der Tabulatortaste in der letzten Zelle kommt eine Zeile hinzu. Auf dem iPhone erstellst du über „Tabelle hinzufügen“ eine Tabelle und trägst die Werte ein. Siehe Apples <a href="https://support.apple.com/de-de/guide/notes/apd0a136b9cc/mac">Anleitung für Tabellen</a> und unseren <a href="/blog/apple-notes-tables" hrefLang="en">Tabellenratgeber</a> (auf Englisch).</p>
    <p>Verlinke jeden Kundennamen mit seiner Notiz. Markiere auf dem Mac den Namen, wähle „Bearbeiten“, dann „Link hinzufügen“, und suche nach dem Notiztitel. Wähle die Notiz und bestätige. Auf dem iPhone markierst du den Namen und wählst im Bearbeitungsmenü „Link hinzufügen“. Apples Anleitungen zeigen die Schritte für <a href="https://support.apple.com/de-de/guide/notes/apde615d29c2/mac">Mac</a> und <a href="https://support.apple.com/de-de/guide/iphone/iph908d1558b/ios">iPhone</a>.</p>
    <h2 id="pflege">Den Kontaktverlauf aktuell halten</h2>
    <p>Nach einem Gespräch oder einer E-Mail ergänze eine datierte Zeile. Ändert sich die Vereinbarung, schreib den aktuellen Stand neu. Hake erledigte Schritte ab und gib dem nächsten ein Datum. Aktualisiere zugleich die Übersicht.</p>
    <p>Lies vor einem Anruf „Aktueller Stand“ und „Fürs nächste Mal“. Für eine Tagesordnung oder ausführliche Beschlüsse nimm ein eigenes <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Meeting-Protokoll</a> und verlinke es unter „Verwandte Notizen“.</p>
    <h2 id="grenzen">Wo die Kartei aufhört</h2>
    <p>Übersicht und Kundennotiz sind getrennt. Eine Datumsänderung überträgt sich nicht von selbst. Eine eingetippte Nachfrage löst keinen Alarm aus. Lege wichtige Erinnerungen gesondert an.</p>
    <p>Die Vorlage erfasst keine E-Mails, sucht keine Kontakte und erstellt keine Umsatzprognose. Für eine gemeinsame Vertriebspipeline mit Zuständigkeiten und automatischen Nachfragen brauchst du ein CRM.</p>
    <h2 id="pinto-notes">Die Kartei mit ChatGPT oder Claude nutzen</h2>
    <p>In Pinto Notes kannst du diese Notizen mit Tabellen, Checklisten und Links anlegen. Die App sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI sie lesen und bearbeiten.</p>
    <p>Frag vor einer Antwort: „Lies Keramikwerkstatt am Kanal. Worauf warten wir, und was sagte Mara zum Zeitplan? Entwirf eine kurze Nachfrage nur mit den Angaben aus der Notiz.“ Prüfe den Entwurf. Gib nach Maras Antwort die neuen Fakten an und lass sowohl Kundennotiz als auch Übersicht aktualisieren. Das sind Aufträge im Chat, keine automatischen Nachfragen.</p>
    <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
