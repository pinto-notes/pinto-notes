import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "arbeitsanweisung-vorlage-apple-notizen");

// German version of /blog/apple-notes-sop-template, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "arbeitsanweisung vorlage" returned the
// head, Word, Excel and PDF variants. The broad result is not exact Apple Notes demand.
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd93c815aa0/mac
// (Checkliste), apd0a136b9cc/mac (Format > Tabelle), not9474646a9/mac
// (Ablage > Notiz duplizieren), /guide/iphone/iph1ac0b3a2/ios (Format > Überschrift,
// Checkliste, Tabelle hinzufügen). The uncheck-all menu name is not verified; described as a step.
// Fictional German client and dates. No picture or shipped Pinto template.
const ui = UI.de;

const TEMPLATE = `Arbeitsanweisung: wöchentlichen Kundenbericht versenden

Auslöser: Freitag um 14:00 Uhr, wenn die Wochenarbeit erfasst ist.
Verantwortlich: Maja, Kundenbetreuung. Vertretung: Leo.
Ergebnis: Studio Nordstraße erhält bis 16:00 Uhr einen korrekten Bericht.
Grundlagen: Arbeitsprotokoll dieser Woche und aktuelle Kundenkontaktliste.
Version: 1.2, geändert am 20. November 2026.
Prüftermin: 18. Dezember 2026. Maja ist zuständig.

Ablauf
1. Arbeitsprotokoll von Studio Nordstraße öffnen. Montag bis Freitag dieser Woche verwenden.
2. Erledigte Arbeiten in einen neuen Bericht übertragen. Offenes unter „Nächste Woche“ auflisten.
3. Stunden je erledigter Arbeit addieren. Summe mit dem Arbeitsprotokoll vergleichen.
4. Bericht als PDF mit dem Namen Nordstrasse-Woche-bis-2026-11-20.pdf exportieren. Datum jede Woche ändern.
5. PDF öffnen, jede Seite lesen und Kunde und Woche prüfen.
6. Die Prüfungen unten abschließen. PDF an die Berichtskontaktperson der aktuellen Liste mailen.
7. Versandzeit und absendende Person in einer datierten Ausführungsnotiz festhalten. Ausnahmen dort vermerken.

Ausnahmen
Wenn\tDann
Stunden passen nicht zum Arbeitsprotokoll\tStoppen. Die erfassende Person korrigiert das Original, dann erneut exportieren.
Maja ist abwesend\tLeo führt den Ablauf aus und notiert seinen Namen.
Bericht kann nicht bis 16:00 Uhr versandt werden\tKunden vor 16:00 Uhr mit neuer Lieferzeit kontaktieren. In der Ausführungsnotiz festhalten.

Prüfungen vor dem Versand
Kundenname und Berichtswoche passen zum Arbeitsprotokoll.
Stunden stimmen mit der Quelle überein; offene Arbeiten zählen nicht als erledigt.
Die exportierte PDF lässt sich öffnen und enthält alle Seiten.
Empfänger steht in der aktuellen Kundenkontaktliste.

Ausführung
20. November 2026, 15:42 Uhr. Maja hat den Bericht gesendet. Keine Ausnahmen.

Änderungen
20. November 2026, v1.2. PDF-Prüfung nach einem leeren Export ergänzt.
`;

const FAQ = [
  { q: "Kann ich eine Arbeitsanweisung in Apple Notizen schreiben?", a: ["Ja. Nutze eine Notiz pro Ablauf mit Auslöser, Verantwortung, nummerierten Schritten, Ausnahmen, Abschlussprüfung und Prüftermin. Die ausgefüllte Vorlage kannst du anpassen."] },
  { q: "Checkliste oder nummerierte Schritte?", a: ["Nummern zeigen die Reihenfolge. Eine eigene Checkliste dient der Prüfung vor dem Abschluss. Lass die Hauptvorlage ohne Häkchen und erfasse jeden Durchlauf getrennt mit Datum."] },
  { q: "Wie oft muss ich die Anweisung prüfen?", a: ["Lege einen passenden Termin und eine verantwortliche Person fest. Prüfe früher, wenn eine Ausnahme einen fehlenden Schritt zeigt oder sich eine Grundlage ändert. Für den Termin brauchst du eine gesonderte Erinnerung."] },
  { q: "Kann Pinto Notes eine frühere Fassung wiederherstellen?", a: ["Ja. Pinto Notes bewahrt frühere Notizversionen auf. Beim Wiederherstellen bleibt auch der ersetzte Text erhalten. Das Änderungsprotokoll erklärt weiter, warum ein Schritt geändert wurde."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="arbeitsanweisung-vorlage-apple-notizen"
    intro={<>Kopiere diese Arbeitsanweisung in Apple Notizen. Sie hält für eine wiederkehrende Aufgabe Auslöser, Zuständigkeit, Schritte, Ausnahmen und Prüfungen fest.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Anweisung kopieren" }, { href: "#einrichten", label: "Einrichten" },
      { href: "#anwenden", label: "Anwenden und prüfen" }, { href: "#grenzen", label: "Grenzen" },
      { href: "#pinto-notes", label: "Frühere Fassungen" },
    ]}><p>Nutze eine Notiz pro Arbeitsablauf, mit nummerierten Schritten und einer getrennten Abschlusscheckliste. Ersetze Namen und Zeiten im Beispiel und teste die Anweisung bei einer echten Ausführung. Die Hauptanweisung und datierte Ausführungen bleiben getrennt.</p>
      <PostCta slug="de/arbeitsanweisung-vorlage-apple-notizen" path="/de/blog/arbeitsanweisung-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Frühere Fassungen behalten?">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac und bewahrt wiederherstellbare Versionen auf. Nach dem Verbinden können ChatGPT oder Claude die Anweisung lesen und bearbeiten.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="vorlage">Ein wöchentlicher Kundenbericht als Beispiel</h2>
    <p>Hier verschickt Maja jeden Freitag einen Bericht. Passe Kunden, Quellen und Frist an. Arbeitest du allein, trage deinen Namen ein und streiche die Vertretung, wenn es keine gibt.</p>
    <Keep title="Arbeitsanweisung für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="In eine neue Notiz einfügen. Die vier Prüfungen in eine Checkliste und die vier Zeilen unter „Ausnahmen“ in eine Tabelle umwandeln." />
    <p>Jeder Schritt braucht eine Handlung und ein sichtbares Ergebnis. „Bericht prüfen“ ist zu ungenau. „Exportierte PDF öffnen“ sagt, welche Datei gemeint ist. Halte Bedingungen zum Stoppen beim Ablauf fest.</p>
    <h2 id="einrichten">In Apple Notizen einrichten</h2>
    <Paths rows={[{ on: "Mac", steps: ["Ausnahmen markieren", "Format", "Tabelle"] }, { on: "iPhone", steps: ["Format", "Überschrift"] }]} />
    <ol>
      <li>Füge die Vorlage in eine neue Notiz ein. Auf dem iPhone tippe zuerst auf „Neue Notiz“. Die erste Zeile wird der Titel. Markiere Abschnittsnamen und wähle über „Format“ den Stil „Überschrift“.</li>
      <li>Markiere auf dem Mac die vier Prüfungen und klicke auf „Checkliste“. Auf dem iPhone legst du mit der Taste „Checkliste“ vier Einträge an. Die nummerierten Ablaufschritte bleiben Anweisungen.</li>
      <li>Markiere auf dem Mac die vier Zeilen von „Wenn“ bis zur letzten Ausnahme und klicke auf „Tabelle“. Tabulatoren trennen Bedingung und Reaktion. Alternativ wähle „Format“, dann „Tabelle“.</li>
      <li>Auf dem iPhone erstellst du mit „Tabelle hinzufügen“ zwei Spalten und überträgst die Ausnahmen. Auf dem Mac fügt die Tabulatortaste in der letzten Zelle eine Zeile hinzu. Mehr dazu im <a href="/blog/apple-notes-tables" hrefLang="en">Tabellenratgeber</a> (auf Englisch).</li>
    </ol>
    <p>Nutze für die Checkliste eine iCloud-Notiz oder eine auf dem Mac gespeicherte Notiz. Bei anderen Accountanbietern sind manche Funktionen nicht verfügbar. Weitere Gliederungen stehen unter <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).</p>
    <h2 id="anwenden">Einmal ausführen und Unklares verbessern</h2>
    <p>Probiere die Schritte mit dem echten Arbeitsprotokoll und dem exportierten Bericht. Wird dich jemand vertreten, lass diese Person die Notiz ohne mündliche Hilfe verwenden. Ergänze fehlende Dateinamen oder Entscheidungen vor dem nächsten Durchlauf.</p>
    <p>Die Hauptnotiz bleibt die Anweisung. Für jeden Freitag kannst du sie auf dem Mac über „Ablage“, „Notiz duplizieren“ kopieren. Gib der Kopie einen datierten Titel und entferne den Beispielverlauf. Entferne vor dem Start alle Häkchen in der Kopie. Eine Kopie einer geteilten Notiz ist nicht geteilt.</p>
    <p>Notiere, wer den Ablauf erledigt hat und welche Ausnahmen vorkamen. Ergänze wiederkehrende Ausnahmen in der Hauptnotiz, erhöhe die Versionsnummer und begründe die Änderung. Am Prüftermin vergleicht Maja den Ablauf mit den aktuellen Quellen, auch wenn niemand ein Problem gemeldet hat.</p>
    <h2 id="grenzen">Wo die Vorlage aufhört</h2>
    <p>Ein Häkchen beweist weder einen richtigen Anhang noch den Empfang beim Kunden. Bewahre gesendete Nachricht oder andere nötige Nachweise auf. Der eingetippte Prüftermin braucht eine gesonderte Erinnerung.</p>
    <p>Datierte Kopien können verwechselt werden. Benenne die aktuelle Hauptnotiz eindeutig. Für formelle Freigaben oder ein kontrolliertes Prüfprotokoll reicht diese Vorlage allein nicht.</p>
    <h2 id="pinto-notes">Die Anweisung mit früheren Fassungen bearbeiten</h2>
    <p>Du kannst die Vorlage in Pinto Notes nutzen. Die App sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Ihre <a href="/blog/apple-notes-version-history" hrefLang="en">Versionsgeschichte</a> erlaubt die Wiederherstellung einer früheren Fassung. Dabei bleibt der ersetzte Text erhalten. Warum ein Schritt geändert wurde, steht weiter im Änderungsprotokoll.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI die Anweisung lesen und bearbeiten. Lass sie eine Ausnahme für ein verspätetes Arbeitsprotokoll entwerfen, ohne die Versandfrist zu ändern. Bitte zuerst um Annahmen und prüfe die Formulierung am echten Ablauf.</p>
    <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
