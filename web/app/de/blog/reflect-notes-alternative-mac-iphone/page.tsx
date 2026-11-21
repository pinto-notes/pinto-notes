import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "reflect-notes-alternative-mac-iphone");

// German version of /blog/reflect-notes-alternative-for-mac-and-iphone. Google autocomplete
// hl=de, gl=de, read 21 Nov 2026: "reflect notes alternative" and "reflect notes free alternative".
// Reflect's reflect.academy/moving-to-reflect-open and reflect.academy/import-export-backups
// were read 21 Nov 2026. Its export labels and Pinto's English import label are retained.
// No Apple Notes steps or menu names occur in this post.
const ui = UI.de;

const IMPORT_CHECK = `Reflect-Import prüfen
- [ ] Eine lange Notiz vollständig neben dem Original lesen
- [ ] Eine Tagesnotiz und ihr Datum prüfen
- [ ] Einem Link zu einer anderen importierten Notiz folgen
- [ ] Prüfen, ob Backlinks weiterhin beim Finden helfen
- [ ] Tags und Ablageorte vergleichen
- [ ] Eine Tabelle und eine Checkliste prüfen
- [ ] Bilder und Anhänge der Auswahl öffnen
- [ ] Die Kopien auf dem iPhone öffnen
- [ ] Original-ZIP und Zugriff auf Reflect behalten`;

const FAQ = [
  { q: "Muss ich Reflect Classic bis zu einem bestimmten Datum verlassen?", a: [
    "Nein. Laut Reflects Migrationsanleitung, geprüft am 21. November 2026, gibt es keine Frist für den Wechsel zu Reflect Open. Vergleiche deine Möglichkeiten und prüfe den Export in Ruhe.",
  ] },
  { q: "Hat Pinto einen eigenen Reflect-Importer?", a: [
    "Nein. Nutze den Markdown-ZIP-Export von Reflect Classic und Pintos allgemeinen Markdown- und Textimport auf dem Mac. Teste erst einige Notizen. Ein frischer Reflect-Export wurde für diesen Leitfaden nicht in Pinto geprüft.",
  ] },
  { q: "Funktionieren Tagesnotizen und Backlinks danach genauso?", a: [
    "Das ist nicht geprüft. Importiere eine Tagesnotiz und zwei miteinander verlinkte Notizen. Vergleiche Datum, Navigation, Tags und Text mit Reflect, bevor du den Rest umziehst.",
  ] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="reflect-notes-alternative-mac-iphone"
    intro={<>Pinto Notes ist eine kostenlose Reflect-Notes-Alternative für Mac und iPhone, wenn du eine App wie Apple Notizen mit Zugriff für ChatGPT oder Claude suchst. Reflect Open ist ebenfalls eine Möglichkeit. Laut Reflect gibt es keine Frist für den Abschied von Classic.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#bleiben", label: "Bei Reflect bleiben?" }, { href: "#export", label: "Aus Classic exportieren" },
      { href: "#import", label: "Pinto testen" }, { href: "#pruefen", label: "Notizen prüfen" },
      { href: "#ki", label: "KI nutzen" },
    ]}>
      <p>Pinto Notes bietet Bearbeitung wie Apple Notizen auf Mac und iPhone. Nach dem Verbinden können ChatGPT oder Claude Notizen lesen und bearbeiten. Reflect Open passt, wenn du bei Reflect und Markdown-Dateien in einem eigenen Ordner bleiben willst. Für den Pinto-Test exportierst du Markdown aus Classic und prüfst zunächst einige Notizen.</p>
      <PostCta slug="de/reflect-notes-alternative-mac-iphone" path="/de/blog/reflect-notes-alternative-mac-iphone" position="answer" title="Teste Reflect-Notizen in Pinto Notes" ui={ui.cta}><p>Lade Pinto Notes kostenlos auf deinen Mac. Importiere einige Markdown-Notizen und vergleiche die Kopien. Danach kannst du ChatGPT oder Claude verbinden.</p></PostCta>
    </Answer>}
    hero={<></>}
    faq={FAQ}>
      <h2 id="bleiben">Wann solltest du bei Reflect bleiben?</h2>
      <p>Wenn Tagesnotizen und Backlinks zu deiner Arbeitsweise passen, bleib zunächst dort. Reflects <a href="https://reflect.academy/moving-to-reflect-open">Anleitung zu Reflect Open</a> beschreibt eine eigene App mit öffentlichem Quellcode. Sie speichert Markdown-Dateien in einem Ordner, der dir gehört. Allein der Besitz der Dateien ist kein Grund für Pinto.</p>
      <p>Reflect beschreibt einen Import in Open, der unter anderem Tagesnotizen, Backlinks und Tags übernimmt. Der Notizverlauf ist ausgenommen. Vergleiche diesen Reflect-spezifischen Weg mit dem allgemeinen Markdown-Import in andere Apps. Währenddessen kannst du Classic weiter verwenden. Lies vor dem Wechsel die aktuelle Anleitung.</p>
      <p>Pinto passt, wenn du eine App wie Apple Notizen und einen Zugriff für ChatGPT oder Claude willst. Es läuft nur auf Mac und iPhone. Eine Windows-, Android- oder Web-App gibt es nicht.</p>

      <h2 id="export">Markdown aus Reflect Classic exportieren</h2>
      <p>Reflects <a href="https://reflect.academy/import-export-backups">Exportanleitung</a> nennt Markdown zip als Format. Nutze es für diesen Test. Der in der Migrationshilfe genannte Reflect-Open-Export ist für Reflect Open bestimmt. Pinto verwendet hier das allgemeine Markdown-Format.</p>
      <Steps>
        <li>Öffne in Reflect Classic mit Befehl und Komma die Einstellungen deines Graphs. Wähle den Graph in der Seitenleiste.</li>
        <li>Wähle Markdown zip als Exportformat und klicke auf Export Reflect.</li>
        <li>Bewahre die ursprüngliche ZIP auf. Erstelle für den Test eine getrennte Arbeitskopie.</li>
      </Steps>
      <p>Entpacke die Arbeitskopie. Wähle eine Tagesnotiz, eine lange Projektnotiz und zwei miteinander verlinkte Notizen. Nimm auch ein Bild oder einen Anhang dazu. Belasse Dateien und zugehörige Anlagen in ihren relativen Ordnern, damit der Test die Links nicht selbst zerstört.</p>
      <p>Du nutzt schon Reflect Open? Laut Anleitung liegen die Notizen als Markdown in deinem gewählten Ordner. Kopiere einige Notizen und Anlagen in einen separaten Testordner. Lass deinen Arbeitsgraph unangetastet.</p>

      <h2 id="import">Den allgemeinen Pinto-Import auf dem Mac nutzen</h2>
      <p>Öffne Pinto Notes auf dem Mac. Wähle im Menü File die Option Import Markdown or Text und dann deinen Testordner. Folge den Importschritten. <a href="/blog/import-your-notes">Notizen importieren</a> beschreibt den Import eines Ordners oder einer ZIP mit Markdown- oder Textdateien. Aus jedem Ordner wird ein Ordner.</p>
      <p>Es gibt keinen eigenen Reflect-Importer. Das unterstützte Dateiformat macht einen Test möglich. Es belegt nicht, dass Organisation und Navigation aus Reflect übernommen werden. Ein frischer Reflect-Export wurde für diesen Leitfaden nicht in Pinto getestet.</p>

      <h2 id="pruefen">Prüfe, was du jeden Tag brauchst</h2>
      <p>Öffne die importierte Notiz neben dem Original in Reflect. Lies sie vollständig und teste Links und Anhänge. Prüfe bei einer Tagesnotiz, wie ihr Datum erscheint und wie du sie wiederfindest. Text allein reicht für die Entscheidung nicht.</p>
      <Keep title="Checkliste für den Reflect-Test" text={IMPORT_CHECK} copyLabel={ui.copy} note="Prüfe die Auswahl, bevor du den Rest deiner Sammlung importierst." />
      <p>Notiere nötige Korrekturen. Prüfe Tags und Backlinks getrennt von gewöhnlichen Links. Ein importiertes Tag-Wort bedeutet nicht, dass du Tags genauso durchsuchen kannst. Behalte Reflect für ältere Notizversionen. Ihre Übernahme in Pinto ist nicht geprüft.</p>
      <p>Wenn die Auswahl funktioniert, teste eine größere Menge und wiederhole die Checks. Falls dir fehlende Funktionen wichtiger sind, nutze Reflect weiter. Behalte den Originalexport in jedem Fall für spätere Vergleiche.</p>

      <h2 id="ki">ChatGPT oder Claude mit importierten Notizen nutzen</h2>
      <p><a href="/blog/connect-chatgpt-to-your-notes">Verbinde ChatGPT oder Claude</a> mit Pinto Notes und wähle Allow. Damit erlaubst du Lesen und Bearbeiten. Beginne mit einer bereits geprüften Projektnotiz.</p>
      <p>Lass die KI offene Aufgaben aus der Notiz im Chat zusammenfassen. Vergleiche die Antwort mit dem Original. Stimmt sie, lass einen von dir formulierten nächsten Schritt eintragen. Öffne die Notiz und prüfe, ob der ursprüngliche Text erhalten blieb und der Schritt an der richtigen Stelle steht. Eine KI kann Details übersehen oder die falsche Passage ändern.</p>
      <p>Pinto bewahrt jede frühere Notizversion auf. Das gilt für Änderungen in Pinto und stellt Reflects Verlauf nicht wieder her. Behalte Zugriff auf Reflect und den Export, bis du deine wichtigen Notizen geprüft hast.</p>
    </LocalPostPage>;
}
