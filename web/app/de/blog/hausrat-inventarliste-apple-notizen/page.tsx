import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "hausrat-inventarliste-apple-notizen");

// German version of /blog/apple-notes-home-inventory-template, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "hausrat inventarliste vorlage" returned the
// head and "inventarliste hausrat vorlage excel". This is broader than Notes demand.
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd0a136b9cc/mac
// (Format > Tabelle), apd93c815aa0/mac (Checkliste), not95edd2813/mac (Anhänge);
// /guide/iphone/iph1ac0b3a2/ios (Tabelle hinzufügen), iph23f4d9aa9/ios (Anhänge).
// Fictional German room and EUR examples. No picture or ready-made Pinto template.
const ui = UI.de;

const TEMPLATE = `Inventarliste Wohnzimmer
Raum: Wohnzimmer
Zuletzt geprüft: 21. November 2026

Gegenstand\tNachweis
WZ-01: DAB-Radio\tSeriennummer notiert; Beleg und Fotos noch anhängen
WZ-02: Couchtisch aus Eiche\tKeine Seriennummer; Beleg fehlt; Foto noch anhängen

WZ-01: DAB-Radio
Raum und Standort: Wohnzimmer, Regal am Fenster
Marke/Modell: Roberts Play 10
Seriennummer: DEMO-WZ01-2047 (nur ein Beispiel)
Gekauft: 8. März 2025
Kaufpreis: 59 €, kein aktueller Wert
Beleg: WZ-01-beleg.pdf, unter diesem Eintrag anhängen
Fotos: WZ-01-vorne.jpg und WZ-01-typenschild.jpg, darunter anhängen
Zustand: Kleiner Kratzer neben dem Lautstärkeregler

WZ-02: Couchtisch aus Eiche
Raum und Standort: Wohnzimmer, vor dem Sofa
Marke/Modell: Ohne Marke, massive Eiche, 90 × 50 cm
Seriennummer: Nicht vorhanden
Gekauft: 12. Juni 2023, gebraucht
Kaufpreis: 75 €, kein aktueller Wert
Beleg: Fehlt, bar bezahlt
Foto: WZ-02-tisch.jpg, unter diesem Eintrag anhängen
Zustand: Wasserfleck an der linken Ecke

Noch zu erfassen
Beleg für das Radio anhängen
Radio von vorne und Typenschild fotografieren und anhängen
Foto vom Couchtisch anhängen
Seriennummer des Radios mit dem Typenschild vergleichen
`;

const FAQ = [
  { q: "Kann ich eine Inventarliste für den Hausrat in Apple Notizen führen?", a: ["Ja. Lege pro Zimmer eine Notiz an. Erfasse jeden Gegenstand mit Seriennummer, Beleg und Fotos. Ersetze die Beispiele durch deine eigenen Angaben."] },
  { q: "Wie füge ich Belegfotos hinzu?", a: ["Auf dem iPhone öffnest du in der Notiz die Anhänge und wählst ein Foto. Eine PDF-Datei aus „Dateien“ kannst du über „Teilen“ an die vorhandene Notiz senden. Auf dem Mac ziehst du Dateien aus dem Finder hinein."] },
  { q: "Berechnet die Liste einen Wiederbeschaffungswert?", a: ["Nein. Sie hält Gegenstände und Kaufpreise fest, ermittelt aber weder den aktuellen Wert noch Wiederbeschaffungskosten. Sie ist keine Freigabe der Versicherung."] },
  { q: "Was schreibe ich ohne Seriennummer?", a: ["Schreibe „Nicht vorhanden“, wenn du nachgesehen hast, oder „Noch nicht geprüft“, wenn die Prüfung aussteht. Beschreibung und Fotos bleiben wichtig."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="hausrat-inventarliste-apple-notizen"
    intro={<>Kopiere diese Inventarliste für den Hausrat in eine Apple Notiz pro Zimmer. Jeder Gegenstand bekommt Platz für Seriennummer, Kaufbeleg und Fotos.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Vorlage" }, { href: "#einrichten", label: "Tabelle und Checkliste" },
      { href: "#fotos", label: "Belege und Fotos" }, { href: "#grenzen", label: "Grenzen" }, { href: "#pinto-notes", label: "In Pinto Notes" },
    ]}><p>Eine Notiz pro Zimmer enthält eine kurze Tabelle und darunter die einzelnen Nachweise. Ersetze die Beispieldaten und hänge Belege und Fotos beim passenden Eintrag an. Die Notiz bewertet den Hausrat nicht.</p>
      <PostCta slug="de/hausrat-inventarliste-apple-notizen" path="/de/blog/hausrat-inventarliste-apple-notizen" position="answer" ui={ui.cta} title="Einträge aktualisieren lassen?">
        <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude Inventarnotizen mit deinen Angaben lesen und bearbeiten.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="vorlage">Die Vorlage: Zimmer für Zimmer</h2>
    <p>Das Wohnzimmerbeispiel enthält ein Radio und einen gebrauchten Tisch. Seriennummer und Dateinamen sind Beispiele. Beim Kopieren werden keine Dateien angehängt. Ersetze Marke, Modell und alle anderen Angaben.</p>
    <Keep title="Hausratliste für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text einfügen. Die drei Zeilen mit „Gegenstand“ und „Nachweis“ in eine Tabelle, die vier offenen Punkte in eine Checkliste umwandeln." />
    <p>Die Kennung WZ-01 steht sowohl am Eintrag als auch bei Beleg und Fotos. „Noch nicht geprüft“ bedeutet etwas anderes als „Fehlt“. Halte diesen Unterschied in jedem Feld fest.</p>
    <h2 id="einrichten">Tabelle und Checkliste anlegen</h2>
    <Paths rows={[{ on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Tabelle hinzufügen"] }]} />
    <p>Markiere auf dem Mac die drei Zeilen von „Gegenstand“ bis WZ-02 und klicke auf „Tabelle“. Die Tabulatoren trennen die Spalten. Du kannst auch über „Format“, „Tabelle“ eine leere Tabelle anlegen. Die Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Apple zeigt die Schritte in der <a href="https://support.apple.com/de-de/guide/notes/apd0a136b9cc/mac">Mac-Anleitung</a>.</p>
    <p>Auf dem iPhone tippe auf „Tabelle hinzufügen“ und trage die zwei Spalten und Beispielzeilen in die Zellen ein. Lösche danach die Textzeilen. Eine Abschnittsüberschrift formatierst du über „Format“, „Überschrift“. Siehe Apples <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Anleitung</a>.</p>
    <p>Markiere auf dem Mac die vier Zeilen unter „Noch zu erfassen“ und klicke auf „Checkliste“. Auf dem iPhone legst du mit der Taste „Checkliste“ jeden Punkt neu an. Hake ihn erst ab, wenn die Datei wirklich angehängt oder das Feld ausgefüllt ist. Weitere Tabellenfunktionen stehen im <a href="/blog/apple-notes-tables" hrefLang="en">Tabellenratgeber</a> (auf Englisch), andere Gliederungen in <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch).</p>
    <h2 id="fotos">Beleg und Fotos dem Gegenstand zuordnen</h2>
    <p>Fotografiere den ganzen Gegenstand und das Typenschild getrennt. Füge die Dateien unter seinem Eintrag ein, außerhalb der Tabelle. Vergleiche die eingetippte Seriennummer mit dem Foto, bevor du die Aufgabe abhakst.</p>
    <p>Auf dem iPhone öffne die Anhänge in der Notiz und wähle ein Foto. Eine PDF in „Dateien“ öffnest du dort und sendest sie über „Teilen“ an die vorhandene Zimmernotiz. Apple beschreibt beides in der <a href="https://support.apple.com/de-de/guide/iphone/iph23f4d9aa9/ios">Anleitung für Anhänge</a>.</p>
    <p>Auf dem Mac ziehst du Belegdateien aus dem Finder und Fotos aus „Fotos“ in die Notiz. Nutze für diese Vorlage iCloud-Notizen. Laut Apple können Exchange-Notizen keine Dateianhänge enthalten. Siehe die <a href="https://support.apple.com/de-de/guide/notes/not95edd2813/mac">Mac-Anleitung</a>.</p>
    <p>Wenn ein Gegenstand das Haus verlässt, notiere Verkauf, Spende oder Entsorgung mit Datum. Neue Käufe erfasst du, solange der Beleg da ist. Reparaturen und regelmäßige Arbeiten gehören in eine eigene <a href="/de/blog/haus-wartung-checkliste-apple-notizen">Checkliste zur Hauswartung</a>.</p>
    <h2 id="grenzen">Wo die Liste aufhört</h2>
    <p>Der Kaufpreis ist kein aktueller Wert und keine Schätzung der Wiederbeschaffungskosten. Die Notiz ist keine Freigabe deiner Versicherung. Kläre vor einem Schadenfall, welche Nachweise sie verlangt.</p>
    <p>Du musst jedes Schild prüfen, jede Datei anhängen und die Liste pflegen. Ein Dateiname im Text beweist keinen Anhang. Öffne Belege und Fotos nach dem Hinzufügen und bewahre die Originale getrennt auf.</p>
    <h2 id="pinto-notes">Die Inventarliste in Pinto Notes führen</h2>
    <p>Pinto Notes unterstützt Tabellen und Dateianhänge. Eine fertige Inventarvorlage für diesen Artikel gibt es nicht. Kopiere die Gliederung und trage deine Gegenstände ein.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI Notizen lesen und bearbeiten. Ein Klick auf „Allow“ erteilt beide Rechte. Frag nach Gegenständen, deren Text „Beleg fehlt“ oder „Seriennummer noch nicht geprüft“ enthält. Lass fehlende Angaben nicht raten und prüfe die Antwort.</p>
    <p>Pinto kann Notizen als Markdown-Dateien in einer ZIP-Datei exportieren, zusammen mit erreichbaren Anhängen. Prüfe den Exportbericht: Mit Passwort, Face ID oder Touch ID gesperrte Notizen können übersprungen werden, fehlende Dateien werden gemeldet. Öffne exportierte Belege und Fotos, bevor du die Kopie als vollständig ansiehst.</p>
    <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
