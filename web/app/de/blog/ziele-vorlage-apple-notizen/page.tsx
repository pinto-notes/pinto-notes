import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "ziele-vorlage-apple-notizen");
// German version of /blog/apple-notes-goal-template, 21 Nov 2026. Google autocomplete hl=de, gl=de,
// read 21 Nov: "ziele vorlage" yielded "ziele vorlage pdf", "vorlage ziele formulieren" and
// "ziele setzen vorlage"; "zielplanung vorlage" yielded itself and "persönliche zielplanung vorlage pdf".
// "ziele vorlage apple notizen" yielded no suggestions. These are suggestions, not search volumes.
// Apple German support read 21 Nov: de-de/guide/notes/apd1955d3b21/mac (Format, Überschrift),
// apd93c815aa0/mac (Checkliste), apd0a136b9cc/mac (Format, Tabelle), and
// de-ch/guide/iphone/iph1ac0b3a2/27/ios/27 (Neue Notiz, Format, Überschrift, Checkliste,
// Tabelle hinzufügen), and de-de/102296 (Checkliste, Zeilenschalter).
// The de-de Mac pages returned 429 in the web reader; existing German
// pilot posts verified Format, Tabelle. No unverified menu name is used. No pictures.
const ui = UI.de;
const TEMPLATE = `Die letzte Fähre fertigschreiben

Ergebnis
Bis 18. Dezember 2026 einen vollständigen Entwurf der Kurzgeschichte mit Ende schreiben.

Ausgangslage
14. November: 1.800 Wörter. Einstieg geschrieben, Ende noch offen.

Ziel
Etwa 6.000 Wörter, alle Szenen geschrieben, keine Lücken.
Ein fertiger Entwurf enthält jede Szene und ein Ende.

Belege
Datum\tWas sich geändert hat und wo ich es prüfe
14. November\t1.800 Wörter. Datei: Die letzte Fähre, 14.11.
21. November\t2.700 Wörter. Bahnhofsszene ergänzt, Ende skizziert. Datei: Die letzte Fähre, 21.11.

Etappen
29. November: 3.000 Wörter und die mittlere Szene abschließen
13. Dezember: etwa 6.000 Wörter erreichen und das Ende schreiben
18. Dezember: den ganzen Entwurf lesen und Lücken schließen

Nächster Schritt
Das Gespräch am Bahnhof schreiben, bevor der Zug abfährt.

Nächste Prüfung
29. November 2026. Neuen Entwurf mit der Ausgangslage vergleichen.
Prüfen, ob die mittlere Szene fertig ist, dann den nächsten Schritt wählen.
`;
const PROMPT = `Lies meine Zielnotiz „Die letzte Fähre fertigschreiben“ in Pinto Notes.
Ergänze unter dem 28. November 2026 diesen Beleg: Der Entwurf hat 3.200 Wörter und die mittlere Szene ist fertig. Quelle ist meine Datei „Die letzte Fähre, 28.11.“.
Markiere die Etappe vom 29. November anhand dieses Belegs als erledigt.
Lass Ausgangslage, Ergebnis, Ziel und frühere Belege unverändert.
Setze die nächste Prüfung auf den 6. Dezember 2026.
Schlage hier im Chat einen nächsten Schritt vor. Frag bei Unklarheiten nach. Erfinde weder Fortschritt noch Quellenlinks.`;
const FAQ = [
  { q: "Was gehört in eine Zielvorlage für Apple Notizen?", a: ["Ein Ergebnis, eine datierte Ausgangslage, ein Ziel mit Termin, überprüfbare Belege, Etappen, ein nächster Schritt und ein Datum zur Prüfung."] },
  { q: "Soll ich alle Ziele in einer Notiz sammeln?", a: ["Für ein Ziel über mehrere Wochen ist eine eigene Notiz sinnvoll. So bleiben Ausgangslage, Änderungen und Belege zusammen."] },
  { q: "Erinnert mich die Notiz am Prüftag?", a: ["Nein. Das Datum ist Text. Wenn du eine Benachrichtigung brauchst, stell eine Erinnerung separat ein."] },
  { q: "Wie unterscheidet sich das von einem Habit Tracker?", a: ["Eine Zielnotiz hält ein Ergebnis und Belege fest. Ein Habit Tracker zählt wiederholte Handlungen. Jeden Morgen schreiben ist eine Gewohnheit, ein fertiger Entwurf bis zum 18. Dezember ein Ziel."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="ziele-vorlage-apple-notizen"
  intro={<>Diese Vorlage hält ein Ziel, die Ausgangslage, Etappen und überprüfbare Fortschritte in einer Apple Notiz fest. Kopiere das ausgefüllte Beispiel und ersetze es durch dein Vorhaben.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "Einrichten" },
    { href: "#pruefen", label: "Fortschritt prüfen" }, { href: "#grenzen", label: "Grenzen" },
    { href: "#pinto-notes", label: "Mit KI aktualisieren" },
  ]}><p>Nimm für ein mehrwöchiges Ziel eine eigene Notiz. Halte einen messbaren Anfang, ein Ergebnis und Belege mit Datum fest. Das Beispiel verfolgt einen Kurzgeschichtenentwurf.</p>
    <div id="vorlage"><Keep title="Zielvorlage für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text einfügen. Die Etappen werden danach zur Checkliste, die Belege zur Tabelle." /></div>
    <PostCta slug="de/ziele-vorlage-apple-notizen" path="/de/blog/ziele-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Zielnotiz mit KI aktualisieren"><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude die Notiz lesen und deine geprüften Belege ergänzen.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="einrichten">In Apple Notizen einrichten</h2>
  <p>Nutze eine iCloud-Notiz oder eine auf deinem Gerät. Bei anderen Anbietern stehen manche Funktionen laut Apple nicht zur Verfügung. Der kopierte Text bleibt vor dem Formatieren lesbar.</p>
  <Paths rows={[{ on: "Mac", steps: ["Format", "Überschrift"] }, { on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Format", "Überschrift"] }]} />
  <p>Füge den Text auf dem Mac in eine neue Notiz ein. Markiere jede Abschnittsbezeichnung und wähle über Format die Überschrift. Markiere die drei Etappen und klicke auf die Taste „Checkliste“.</p>
  <p>Für die Belege markierst du die drei Zeilen ab „Datum“ und nutzt die Tabellen-Taste. Tabulatoren trennen die Spalten. Du kannst auch Format, Tabelle wählen und die Einträge von Hand eingeben. Ein Tabulator in der letzten Zelle fügt eine Zeile hinzu. <a href="/blog/apple-notes-tables" hrefLang="en">Tabellen in Apple Notizen</a> (auf Englisch) erklärt mehr.</p>
  <p>Auf dem iPhone erstellst du eine neue Notiz, formatierst die Abschnittsnamen mit „Format“ und „Überschrift“ und legst die Etappen über die Checklisten-Taste an. Für die Belege nutzt du „Tabelle hinzufügen“ und trägst Daten und Belege in getrennte Spalten ein. Danach löschst du die Textzeilen.</p>
  <h2>Ein Ergebnis statt eines vagen Vorhabens</h2>
  <p>„Mehr schreiben“ hat kein klares Ende. Ein vollständiger Entwurf bis zum 18. Dezember schon. Die Wortzahl zeigt den Fortschritt, ersetzt aber kein Ende. Notiere die Ausgangslage vor dem ersten Schritt und behalte sie auch bei Änderungen.</p>
  <p>Wähle Etappen, die du prüfen kannst. Eine fertige Szene zählt, eine bloße Schreibstunde gehört in den Kalender. Wenn du Ziel oder Termin änderst, notiere Datum und Grund und lass das ursprüngliche Ziel stehen.</p>
  <h2 id="pruefen">Belege prüfen und einen Schritt wählen</h2>
  <p>Öffne am 29. November den Entwurf. Prüfe Wortzahl und mittlere Szene, ergänze einen datierten Beleg mit Dateiname oder Link und hake die Etappe nur ab, wenn beides stimmt. Bei 3.200 Wörtern ohne fertige Szene bleibt sie offen.</p>
  <p>Aktualisiere den nächsten Schritt und Prüftag. Behalte ältere Zeilen, auch nach einer langsamen Woche. Am Ende prüfst du das ganze Ziel. Ein <a href="/de/blog/wochenrueckblick-vorlage-apple-notizen">Wochenrückblick</a> hilft bei der Wahl des nächsten Ziels.</p>
  <h2 id="grenzen">Was die Vorlage nicht erledigt</h2>
  <p>Die Notiz prüft den Entwurf nicht selbst, misst keinen Fortschritt und meldet sich am Prüftag nicht. Du vergleichst Belege und Etappen selbst. Ein datierter Beleg mit Quelle ist nützlicher als ein langer Wochenbericht.</p>
  <h2 id="pinto-notes">Dieselbe Notiz mit ChatGPT oder Claude pflegen</h2>
  <p>Pinto Notes hat Überschriften, Checklisten und Tabellen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> und einem „Allow“ kann die KI deine Notiz lesen und bearbeiten. Gib ihr nur ein Ergebnis, das du selbst geprüft hast.</p>
  <Keep title="Zielnotiz aktualisieren lassen" text={PROMPT} copyLabel={ui.copy} note="Ersetze Ergebnis, Quelle und Daten, nachdem du sie selbst geprüft hast." />
  <p>Kontrolliere die neue Zeile, das Häkchen und den nächsten Prüftag. Ausgangslage und alte Belege müssen bleiben. Pinto Notes bewahrt frühere Versionen. Deine Apple Notizen kommen über <a href="/blog/move-from-apple-notes" hrefLang="en">einen Import auf dem Mac</a> mit; Apple Notizen bleibt unverändert. Die App ist auf Englisch.</p>
</LocalPostPage>; }
