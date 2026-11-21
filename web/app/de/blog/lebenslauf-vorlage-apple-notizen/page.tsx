import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "lebenslauf-vorlage-apple-notizen");
// German version of /blog/apple-notes-resume-template, 21 Nov 2026. Google autocomplete
// hl=de, gl=de, read 21 Nov: "lebenslauf vorlage" yielded itself, "lebenslauf vorlage
// kostenlos", "lebenslauf vorlage word"; the Apple Notizen seed yielded no suggestions.
// Apple German support read 21 Nov: de-de/guide/notes/apd1955d3b21/mac (Format,
// Überschrift), apd93c815aa0/mac (Checkliste; Format, Mehr, Alles deaktivieren),
// apd0a136b9cc/mac (Format, Tabelle), not9474646a9/mac (Notiz duplizieren), and
// de-ch/guide/iphone/iph1ac0b3a2/27/ios/27 (Neue Notiz, Format, Überschrift,
// Checkliste, Tabelle hinzufügen), and de-de/102296 (Zeilenschalter).
// Mac pages returned 429 in web reader; existing German
// pilot verified those names. Fictional career localized to Berlin and Hamburg. No pictures.
const ui = UI.de;
const TEMPLATE = `Mira Hoffmann, vollständiger Lebenslauf
Aktualisiert: 21. November 2026

Kontakt
Berlin
mira.hoffmann@example.com | 030 5550 1420
Arbeitsproben: https://example.com/mira

Kurzprofil
Koordinatorin im Kundenservice mit Erfahrung seit 2020.
Pflegt Teamberichte und schreibt Einarbeitungsanleitungen für den Support.

Berufserfahrung
Elbufer Versand | Koordinatorin im Kundenservice
Berlin | Januar 2023 bis heute

12. November 2026: Eine Checkliste zur Einordnung von Anfragen erstellt, die sechs Kolleginnen und Kollegen nutzen. Die mittlere Zeit bis zur ersten Antwort sank im Team von 14 Stunden im September auf 9 Stunden im Oktober.
Beleg: Berichte zu den Anfragen für September und Oktober, gespeichert am 2. November 2026.
Mein Beitrag: Checkliste geschrieben und wöchentliche Prüfung geleitet. Das Team bearbeitete die Anfragen.

28. Juni 2026: Anleitung für neue Mitarbeitende geschrieben und im Juni vier Personen im Support eingearbeitet.
Beleg: Einarbeitungsanleitung und Teilnahmeliste der Schulung im Juni.
Textprobe: https://example.com/mira/einarbeitung

Hafen Wohnen | Mitarbeiterin im Kundenservice
Hamburg | September 2020 bis Dezember 2022

31. März 2022: Im März jede Woche 35 bis 45 Kundenanfragen bearbeitet.
Beleg: Bericht über meine Anfragen im März. Das ist meine Zahl, nicht die des Teams.

Kenntnisse
Berichte in Excel, Einordnung von Supportanfragen, Einarbeitung, Anleitungen schreiben

Ausbildung
B. A. Kommunikationswissenschaft | Universität Hamburg | Mai 2020

Vor der Verwendung prüfen
Genaue Stellenbezeichnungen mit Arbeitszeugnissen abgleichen
Antwortzeiten und Vergleichsmonate erneut prüfen
Beispieldaten für Kontakt und Arbeitsproben ersetzen
Interne Beleglinks aus dem versendeten Lebenslauf entfernen
`;
const EVIDENCE = `Datum der Leistung\tBeleg, den ich behalte
12. November 2026\tBerichte zu den Anfragen für September und Oktober, gespeichert am 2. November
28. Juni 2026\tEinarbeitungsanleitung und Teilnahmeliste der Schulung im Juni
31. März 2022\tBericht über meine Anfragen im März
`;
const FAQ = [
  { q: "Was gehört in eine Lebenslaufvorlage in Apple Notizen?", a: ["Kontakt, Kurzprofil, Stellen mit Zeiträumen, Kenntnisse und Ausbildung. Ergänze datierte Leistungen und ihre Belege. Diese Vorlage ist eine vollständige Arbeitsnotiz für spätere Bewerbungen."] },
  { q: "Soll ich die ganze Notiz an Arbeitgeber schicken?", a: ["Nein. Übertrage passende Angaben in ein Dokument, entferne interne Belege und Prüfpunkte und kontrolliere die fertige Datei im gewünschten Format."] },
  { q: "Was schreibe ich ohne Kennzahl zu einer Leistung?", a: ["Beschreibe, was du wann getan hast und wie du es belegen kannst. Eine erfundene Verbesserung in Prozent gehört nicht dazu."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="lebenslauf-vorlage-apple-notizen"
  intro={<>Apple Notizen eignet sich als vollständige Arbeitsnotiz für den Lebenslauf. Sammle Stellen, Leistungen und Belege. Den fertigen Lebenslauf erstellst du danach in einem Dokumentenprogramm.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#vorlage", label: "Vorlage" }, { href: "#einrichten", label: "Einrichten" },
    { href: "#belege", label: "Belege" }, { href: "#anpassen", label: "Für eine Stelle anpassen" },
    { href: "#grenzen", label: "Grenzen" }, { href: "#pinto-notes", label: "Mit KI entwerfen" },
  ]}><p>Führe eine Notiz mit Kontaktdaten, Stellen, Daten und überprüfbaren Leistungen. Kopiere für jede Bewerbung nur das Passende in ein Dokumentenprogramm.</p>
    <PostCta slug="de/lebenslauf-vorlage-apple-notizen" path="/de/blog/lebenslauf-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Passende Leistungen auswählen"><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude die Arbeitsnotiz lesen und einen getrennten Entwurf für dich speichern.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="vorlage">Die vollständige Berufslaufbahn sammeln</h2>
  <p>Mira und alle Daten sind erfunden. Ersetze auch die Links. Behalte ältere Stellen und Leistungen in dieser Arbeitsnotiz, selbst wenn sie nicht in die aktuelle Bewerbung passen.</p>
  <Keep title="Arbeitsnotiz für den Lebenslauf" text={TEMPLATE} copyLabel={ui.copy} note="Normal einfügen. Überschriften und Prüfpunkte sind zuerst einfacher Text." />
  <h2 id="einrichten">Überschriften und Prüfliste ergänzen</h2>
  <p>Nutze dafür eine iCloud-Notiz. Bei anderen Anbietern stehen laut Apple nicht alle Funktionen zur Verfügung. Lass die Daten bei den Leistungen, damit sie beim Kopieren mitkommen.</p>
  <Paths rows={[{ on: "Mac", steps: ["Format", "Überschrift"] }, { on: "iPhone", steps: ["Format", "Überschrift"] }]} />
  <p>Markiere einen Abschnittsnamen wie „Berufserfahrung“ und wähle „Überschrift“. Auf dem Mac markierst du die vier Prüfpunkte und klickst auf „Checkliste“. Auf dem iPhone legst du die Liste mit der Checklisten-Taste an und gibst die Punkte einzeln ein. Hake sie erst nach der Prüfung ab.</p>
  <p>Auf dem Mac setzt Format, Mehr, Alles deaktivieren die Häkchen für eine neue Prüfung zurück. <a href="/blog/apple-notes-templates" hrefLang="en">Apple-Notizen-Vorlagen</a> (auf Englisch) zeigt wiederverwendbare Notizen.</p>
  <h2 id="belege">Belege so notieren, dass du sie wiederfindest</h2>
  <p>Halte deinen Anteil an Teamresultaten und die Zeiträume der Zahlen fest. Verweise auf eine Quelldatei oder einen Link. Speichere berufliche Unterlagen nur dann in privaten Notizen, wenn du das darfst.</p>
  <Keep title="Optionaler Belegindex" text={EVIDENCE} copyLabel={ui.copy} note="Ein Tabulator trennt Datum und Beleg. Unter der Arbeitsnotiz einfügen und als Tabelle formatieren." />
  <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"] }]} />
  <p>Auf dem Mac markierst du die vier eingefügten Zeilen und nutzt die Tabellen-Taste. Oder du wählst Format, Tabelle und füllst zwei Spalten selbst. Ein Tabulator in der letzten Zelle fügt eine Zeile hinzu. Auf dem iPhone nutzt du „Tabelle hinzufügen“. <a href="/blog/apple-notes-tables" hrefLang="en">Tabellen in Apple Notizen</a> (auf Englisch) erklärt die Tasten.</p>
  <h2 id="anpassen">Für eine Stelle auswählen</h2>
  <p>Dupliziere auf dem Mac die Arbeitsnotiz mit Ablage, Notiz duplizieren und benenne die Kopie nach Stelle und Datum. Für eine Koordinationsstelle stehen Checkliste und Berichte vorne, für eine Schulungsstelle die Einarbeitungsanleitung. Kontrolliere jede Angabe anhand des Belegs. Mira darf die Teamverbesserung nicht allein für sich beanspruchen.</p>
  <p>Entferne interne Berichte und Prüfpunkte aus der Bewerbungsfassung. Bewerbungen kannst du mit dem <a href="/de/blog/bewerbungstracker-apple-notizen">Bewerbungstracker</a> verfolgen.</p>
  <h2 id="grenzen">Die fertige Datei braucht ein Dokumentenprogramm</h2>
  <p>Diese Notiz enthält mehr als ein Arbeitgeber braucht. Prüfe im fertigen Dokument Seitenumbrüche, Abstände und Dateiformat. Öffne die Datei vor dem Versand. Die Vorlage verspricht weder einen Wert für Bewerbermanagementsysteme noch eine PDF-Datei mit genau einer Seite.</p>
  <h2 id="pinto-notes">Einen getrennten Entwurf mit KI schreiben</h2>
  <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI deine Pinto-Notiz lesen und bearbeiten. Bitte sie, Arbeitsnotiz und Stellenanzeige zu lesen und einen neuen Entwurf mit passenden Leistungen anzulegen. Die Arbeitsnotiz soll unverändert bleiben. Fehlende Angaben soll sie markieren statt Zahlen oder Kenntnisse zu erfinden.</p>
  <p>Prüfe Daten, Belege und Anteile am Teamergebnis. Pinto Notes bewahrt frühere Notizversionen. Den Lebenslauf stellst du weiterhin in einem Dokumentenprogramm fertig. Deine Apple Notizen kommen über <a href="/blog/move-from-apple-notes" hrefLang="en">einen Import auf dem Mac</a> mit und bleiben unverändert. Die App ist auf Englisch.</p>
</LocalPostPage>; }
