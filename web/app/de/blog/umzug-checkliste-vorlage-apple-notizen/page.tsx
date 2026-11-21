import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "umzug-checkliste-vorlage-apple-notizen");

// German version of /blog/apple-notes-moving-checklist-template, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "umzug checkliste vorlage" suggested
// "checkliste umzug vorlage". Apple Notes demand is not inferred from that broad phrase.
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd93c815aa0/mac
// (Checkliste), apd0a136b9cc/mac (Format > Tabelle), /guide/iphone/iph1ac0b3a2/ios
// (Format > Überschrift, Checkliste, Tabelle hinzufügen), /102296 (Checklisten).
// Fictional German addresses, providers and phone numbers. No picture or shipped Pinto template.
const ui = UI.de;

const TEMPLATE = `Umzug, 5. Dezember 2026

Von: Lindenstraße 18, 2. Stock, Berlin
Nach: Birkenweg 42, 4. Stock, Berlin
Schlüssel: um 08:00 Uhr bei der Hausverwaltung abholen

Wen benachrichtigen?
Mara: Adresse bei der Bank bis 28. November ändern
Theo: Lohnbuchhaltung beim Arbeitgeber bis 30. November informieren
Mara: Hausratversicherung bis 28. November über den Umzug informieren
Theo: Nachsendeauftrag bei der Deutschen Post bis 30. November einrichten
Beide: Lieferadressen vor der nächsten Bestellung ändern

Versorgung und Anschlüsse
Theo: Strombeginn am Birkenweg für 5. Dezember bestätigen lassen
Mara: Ende des Stromvertrags in der Lindenstraße klären
Theo: Internetanschluss für 7. Dezember, 09:00 bis 12:00 Uhr bestätigen
Mara: beim Wasserversorger nach der Abmeldung fragen
Beide: Zählerstände vor der Schlüsselrückgabe festhalten

Bevor der Transporter kommt
Mara: Haltefläche mit der Umzugsfirma am 3. Dezember bestätigen
Theo: K01 und S01 packen und die Kistenliste ergänzen
Mara: Tasche mit Wasserkocher außerhalb der Kisten lassen
Beide: Schlüssel und Ladekabel in die Tagestasche legen

Am Umzugstag
08:00 Mara holt die neuen Schlüssel ab
09:00 Theo empfängt den Transporter in der Lindenstraße
12:30 Beide prüfen die alte Wohnung und notieren Zählerstände
15:00 Mara gibt der Hausverwaltung die alten Schlüssel zurück

Kontakte am Umzugstag, fiktive Beispiele
Umzugsfirma: Alex, 030 555 0147, Buchung M0526
Neue Hausverwaltung: Robin, 030 555 0182, Schlüssel um 08:00 Uhr
Alte Hausverwaltung: Sam, 030 555 0114, Rückgabe um 15:00 Uhr

Erster Abend
K01 mit Tassen und Wasserkocher finden
S01 mit Bettwäsche und Handtüchern finden
Tagestasche auspacken, bevor andere Kisten geöffnet werden
`;

const BOXES = `Kiste\tZimmer\tInhalt
K01\tKüche\tWasserkocher, zwei Tassen, Tee, Teelöffel
K02\tKüche\tTeller, Schüsseln, Geschirrtücher
S01\tSchlafzimmer\tBettwäsche, zwei Kissen, Handtücher
W01\tWohnzimmer\tSchreibtischkabel, Router, Steckdosenleiste`;

const FAQ = [
  { q: "Wie erstelle ich eine Umzugscheckliste in Apple Notizen?", a: ["Kopiere die Vorlage in eine Notiz. Auf dem Mac markierst du die Aufgaben unter jeder Überschrift und klickst auf „Checkliste“. Zeitplan und Kontakte bleiben Text, Kisten bekommen eine eigene Tabelle."] },
  { q: "Wen sollte ich über die neue Adresse informieren?", a: ["Beginne mit Bank, Arbeitgeber, Hausratversicherung, Nachsendeauftrag und regelmäßigen Lieferdiensten. Ergänze weitere Stellen, die deine Adresse nutzen, mit zuständiger Person und Termin."] },
  { q: "Wie beschrifte ich Umzugskisten?", a: ["Nimm einen Buchstaben für das Zimmer und eine Nummer, etwa K01 für die erste Küchenkiste. Schreibe denselben Code auf die Kiste und in die Notiz."] },
  { q: "Kann Claude die Liste in Pinto Notes ändern?", a: ["Ja. Nach dem Verbinden kann Claude die Notiz lesen und bearbeiten. Die Vorlage steht auf dieser Seite; Pinto hat keine fertige Umzugsvorlage."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="umzug-checkliste-vorlage-apple-notizen"
    intro={<>Kopiere diese Umzugscheckliste in Apple Notizen. Sie hält Adressänderungen, Versorger, Termine und Kontakte zusammen. Die Kistenliste hilft dir, Wasserkocher und Bettwäsche gleich zu finden.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Checkliste" }, { href: "#einrichten", label: "Einrichten" },
      { href: "#kisten", label: "Kistenliste" }, { href: "#grenzen", label: "Grenzen" }, { href: "#pinto-notes", label: "Mit KI ändern" },
    ]}><p>Nutze eine Notiz für den Umzug. Gib jeder Aufgabe eine zuständige Person, behalte Zeitplan und Kontakte darunter und verwende dieselben Kistencodes in Notiz und auf Kartons.</p>
      <PostCta slug="de/umzug-checkliste-vorlage-apple-notizen" path="/de/blog/umzug-checkliste-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Die Umzugsnotiz aktualisieren lassen?">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude Aufgaben und Kisteninhalte auf deine Bitte ändern.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="vorlage">Eine Notiz für den Umzug</h2>
    <p>Im fiktiven Beispiel ziehen Mara und Theo am 5. Dezember um. Jede Meldung hat eine zuständige Person und einen Termin. Aufgaben für Versorger bleiben offen, bis diese sie bestätigt haben. Ersetze Adressen, Kontakte und Zeiten.</p>
    <Keep title="Umzugscheckliste für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text einfügen. Wandle die Aufgabengruppen mit den Schritten unten in Checklisten um." />
    <h2 id="einrichten">Aufgaben als Checklisten anlegen</h2>
    <p>Nutze eine iCloud-Notiz oder eine auf dem Gerät gespeicherte Notiz. Markiere auf dem Mac nur die Aufgaben unter „Wen benachrichtigen?“ und klicke auf „Checkliste“. Wiederhole das für Anschlüsse, Vorbereitung und den ersten Abend. Die Überschrift bleibt außerhalb der Auswahl. Klicke auf einen Kreis, wenn die Aufgabe erledigt ist.</p>
    <p>Auf dem iPhone beginnst du eine Gruppe mit der Taste „Checkliste“ und gibst die Aufgaben ein. Der Zeilenschalter erzeugt den nächsten Eintrag. Für Überschriften markierst du den Text und wählst über „Format“ den Stil „Überschrift“. Apple erklärt dies in seiner <a href="https://support.apple.com/de-de/102296">Checklisten-Anleitung</a>.</p>
    <p>Lass Zeitplan und Kontakte als Text stehen. Die Uhrzeit der Schlüsselabholung soll sichtbar bleiben, auch wenn sie vorbei ist. Weitere Vorlagen findest du unter <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).</p>
    <h2 id="kisten">Eine Kistenliste fürs Auspacken</h2>
    <p>Schreibe K01 auf die Küchenkiste und in die passende Zeile. Notiere das Zielzimmer und genug Inhalt, um einzelne Dinge zu finden. „Küchensachen“ hilft beim Wasserkocher nicht. Ändere den Eintrag, wenn etwas in eine andere Kiste kommt.</p>
    <Keep title="Inhalt der Umzugskisten" text={BOXES} copyLabel={ui.copy} note="Tabulatoren trennen die Spalten. Auf dem Mac die Zeilen markieren und über die Tabellentaste umwandeln." />
    <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"] }]} />
    <p>Markiere auf dem Mac die fünf Zeilen von „Kiste“ bis W01 und klicke auf „Tabelle“. Jeder Tabulator wird eine Spaltengrenze. Mit der Tabulatortaste in der letzten Zelle entsteht eine neue Zeile. Siehe <a href="/blog/apple-notes-tables" hrefLang="en">Tabellen in Apple Notizen</a> (auf Englisch).</p>
    <p>Auf dem iPhone erstellst du über „Tabelle hinzufügen“ eine Tabelle und trägst die Kisten ein. Du kannst sie auf dem kleinen Bildschirm auch als einfache Zeilen führen. Stell die Kisten für den ersten Abend im Transporter zusammen.</p>
    <h2 id="grenzen">Wo die Liste aufhört</h2>
    <p>Die Daten sind Text. Verschiebt sich der Umzug auf den 12. Dezember, musst du Termine für Strom, Internet und Schlüssel selbst prüfen. Stelle Erinnerungen gesondert ein. Ein Häkchen benachrichtigt keinen Versorger und ändert keinen Vertrag.</p>
    <p>Die Kistenliste kennt nur deine Einträge und druckt keine Etiketten. Vergleiche Kisten und Notiz, bevor der Transporter fährt. Kläre das Verfahren direkt mit jedem Anbieter.</p>
    <h2 id="pinto-notes">Die Umzugsnotiz mit KI aktualisieren</h2>
    <p>Pinto Notes ist eine kostenlose Notizen-App für iPhone und Mac, die wie Apple Notizen aussieht und funktioniert. Du kannst die Gliederung mit Überschriften, Checklisten und Tabelle selbst anlegen. Eine fertige Umzugsvorlage gibt es in Pinto nicht.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI die Notiz lesen und bearbeiten. Bitte sie etwa, den Internettermin auf den 8. Dezember von 10:00 bis 13:00 Uhr zu ändern, ohne das Umzugsdatum anzutasten. Oder lass den Router von W01 nach K02 verschieben. Vergleiche die Änderung mit Bestätigung oder Kiste.</p>
    <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
