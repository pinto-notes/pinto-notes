import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "craft-alternative-private-notizen");
// German version of /blog/craft-alternative-for-personal-notes, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "craft alternative" yielded generic
// results including "craft alternative to notion"; "craft alternative notizen" yielded none.
// Local title says "private Notizen" to distinguish the note app from unrelated Craft results.
// No Apple menu steps. Apple's de-de/guide/notes/welcome/mac read 21 Nov for editor comparison.
// Craft and Pinto claims follow the English original, without a tested migration claim. No pictures.
const ui = UI.de;
const CHECK = `Private Craft-Notizen testweise importieren
- [ ] Vollständigen Text mit dem Original vergleichen
- [ ] Überschriften und abgehakte Listenpunkte prüfen
- [ ] Jede Zelle einer kleinen Tabelle lesen
- [ ] Bild und Dateianhang öffnen
- [ ] Link zu einem anderen importierten Dokument öffnen
- [ ] Inhalt einer Unterseite oder Karte finden
- [ ] Importierte Notiz auf dem iPhone öffnen und bearbeiten
- [ ] Craft-Originale und Export behalten`;
const FAQ = [
  { q: "Welche Craft-Alternative passt für private Notizen?", a: ["Pinto Notes passt, wenn du einen Editor wie Apple Notizen, Ordner und verbundenes ChatGPT oder Claude möchtest. Teste erst einen kleinen Markdown-Export. Für Collections, Karten und gemeinsame Bereiche kann Craft besser passen."] },
  { q: "Hat Pinto Notes einen Craft-Importer?", a: ["Nein. Auf dem Mac nutzt du den allgemeinen Import für Markdown und Text. Er verspricht keine vollständige Übernahme von Craft-Bereichen, Links oder Layouts."] },
  { q: "Muss ich Craft für ChatGPT oder Claude verlassen?", a: ["Nein. Craft dokumentiert Verbindungen für beide und hat einen eigenen KI-Assistenten. Teste sie, wenn KI-Zugriff dein einziger Wechselgrund ist."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="craft-alternative-private-notizen"
  intro={<>Pinto Notes ist eine Craft-Alternative für private Notizen auf Mac und iPhone. Der Editor funktioniert wie Apple Notizen. Wenn du Collections oder gemeinsam bearbeitete Dokumente brauchst, behalte Craft.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#wahl", label: "Notizen vergleichen" }, { href: "#craft", label: "Craft behalten" },
    { href: "#export", label: "Markdown testen" }, { href: "#pruefen", label: "Ergebnis prüfen" },
    { href: "#pinto-notes", label: "Pinto nutzen" },
  ]}><p>Teste zuerst wenige private Craft-Dokumente als Markdown in Pinto. Craft hat bereits KI und einen Markdown-Export; entscheidend ist, ob deine Dokumente im neuen Editor funktionieren.</p>
    <PostCta slug="de/craft-alternative-private-notizen" path="/de/blog/craft-alternative-private-notizen" position="answer" ui={ui.cta} title="Private Notizen in Pinto testen"><p>Lade Pinto Notes kostenlos auf den Mac und importiere einen kleinen Markdown-Ordner. Verbinde ChatGPT oder Claude, wenn sie die Notizen lesen und bearbeiten sollen.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="wahl">Mit einer Notiz anfangen, die du nutzt</h2>
  <p>Eine Liste für Reparaturen braucht andere Funktionen als eine Projektdatenbank mit verknüpften Datensätzen. Wenn deine Craft-Dokumente überwiegend Text, Überschriften und Kästchen enthalten, teste diese zuerst.</p>
  <p>Pinto Notes bietet Ordner, Checklisten, Tabellen und Links zwischen Notizen. Es läuft auf Mac und iPhone, nicht unter Windows, Android oder im Web. Der <a href="/blog/best-notes-app-for-mac" hrefLang="en">Vergleich von Mac-Notizapps</a> zeigt weitere Optionen.</p>
  <h2 id="craft">Wann Craft bleiben sollte</h2>
  <p>Craft arbeitet mit Blöcken und Karten. <a href="https://support.craft.do/en/organize-and-find/collections">Collections</a> haben eigene Felder und Beziehungen sowie Tabellen-, Galerie- und Kanban-Ansichten. Pintos Ordner und Notizlinks bilden das nicht nach.</p>
  <p>Laut <a href="https://www.craft.do/pricing">Crafts Tarifübersicht</a> gibt es auf geeigneten Tarifen gemeinsame Bereiche und die Veröffentlichung von Dokumenten. Wenn Kolleginnen und Kollegen dort arbeiten, lass die geteilten Dokumente in Craft und teste nur private Notizen.</p>
  <p>Craft hat auch einen KI-Assistenten und <a href="https://support.craft.do/en/integrate/mcp">Verbindungen für ChatGPT und Claude</a>. Bei passender Berechtigung können sie Dokumente anlegen und aktualisieren. Probier das vor einem Wechsel aus, wenn es dir nur um KI geht.</p>
  <h2 id="export">Einige Dokumente als Markdown testen</h2>
  <p>Nimm ein einfaches Dokument wie „Flurreparaturen“ mit Checkliste und Text. Nimm dazu eines mit Anhang oder Unterseite.</p>
  <ol><li>Öffne in Craft das erste Dokument und klicke rechts oben auf „Share“.</li><li>Wähle „Export As“ und „Markdown“. Wiederhole das für das zweite.</li><li>Lege Dateien und zugehörige Anhänge gemeinsam in einen Ordner.</li><li>Öffne auf dem Mac Pinto Notes, wähle im Ablage-Menü „Import Markdown or Text“ und diesen Ordner.</li></ol>
  <p>Die Schritte stehen in <a href="https://support.craft.do/en/import-and-export/export/document">Crafts Exportanleitung</a>. Pinto nimmt Ordner oder ZIP-Dateien mit Markdown oder Text an und macht aus Ordnern Ordner. Der <a href="/blog/import-your-notes" hrefLang="en">Importleitfaden</a> (auf Englisch) beschreibt den Weg. Ein Markdown-Export bewahrt grundlegende Struktur und Formatierung, bestätigt aber keine Umwandlung von Karten oder internen Links.</p>
  <h2 id="pruefen">Kopien vor dem Umzug prüfen</h2>
  <p>Lies jedes Dokument bis zum letzten Absatz, öffne Links und Anhänge und vergleiche es mit Craft.</p>
  <Keep title="Craft-Export prüfen" text={CHECK} copyLabel={ui.copy} note="Prüfpunkte, keine Zusage, dass alles übertragen wird." />
  <p>Craft kann Collection-Einträge als Markdown mit Feldwerten im Text exportieren. Das bestätigt keine Übernahme der Collection in Pinto. Behalte wichtige Collections und frühere Craft-Versionen, bis du die Kopien geprüft hast.</p>
  <h2 id="pinto-notes">In Pinto Notes weiterschreiben</h2>
  <p>Nach einer erfolgreichen Probe kannst du private Notizen in Pinto bearbeiten, ordnen und verlinken. Pinto bewahrt frühere Versionen ab der Bearbeitung dort, aber keine Versionen aus Craft.</p>
  <p>Wenn du <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT oder Claude verbindest</a>, erlaubt ein „Allow“ das Lesen und Bearbeiten. Bitte zunächst um einen Vorschlag zu offenen Punkten in „Flurreparaturen“. Prüfe ihn und lass dann erst die Notiz ändern. Öffne die Änderung anschließend. Die App ist auf Englisch.</p>
</LocalPostPage>; }
