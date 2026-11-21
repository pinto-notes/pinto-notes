import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-vs-obsidian");

// German version of /blog/apple-notes-vs-obsidian, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen vs obsidian“, „obsidian vs apple notizen“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/not201900c07/mac, https://support.apple.com/de-de/guide/notes/apde615d29c2/mac, https://support.apple.com/de-de/102651.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-vs-obsidian"
      intro={<>Apple Notizen ist schon auf deinem iPhone und Mac. Obsidian gibt dir Dateien, Links und Erweiterungen. Die Wahl hängt davon ab, wie du deine Notizen nutzt.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vergleich", label: "Auf einen Blick" },
        { href: "#apple-notizen", label: "Was Apple Notizen besser kann" },
        { href: "#obsidian", label: "Was Obsidian besser kann" },
        { href: "#wechsel", label: "Zwischen den Apps wechseln" },
        { href: "#notion", label: "Und Notion?" },
      ]}>
        <p>Für schnelle Notizen auf Apple-Geräten reicht Apple Notizen. Obsidian passt, wenn du Markdown-Dateien, Rückverweise, Plugins oder Apps für Windows, Linux und Android willst. Obsidian ist kostenlos. Für seinen Sync zahlst du, sofern du nicht iCloud oder einen anderen Dienst nutzt.</p>
        <PostCta slug="de/apple-notizen-vs-obsidian" path="/de/blog/apple-notizen-vs-obsidian" position="answer" ui={ui.cta} title="Notizen mit Markdown und KI?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
      hero={<PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Ordner und eine Einkaufsliste in Apple Notizen auf dem Mac." caption="Eine Einkaufsliste in Apple Notizen." />}
      faq={[
        { q: "Ist Obsidian kostenlos?", a: ["Ja. Die App ist kostenlos. Obsidian Sync kostet 4 $ monatlich bei jährlicher Zahlung oder 5 $ bei monatlicher Zahlung."] },
        { q: "Synchronisieren Obsidian und Apple Notizen miteinander?", a: ["Nein. Der Import kopiert Notizen einmalig; danach sind es getrennte Bestände."] },
      ]}
    >
      <h2 id="vergleich">Auf einen Blick</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">Punkt</th><th scope="col">Apple Notizen</th><th scope="col">Obsidian</th></tr></thead><tbody>
        <tr><td>Preis</td><td>Kostenlos</td><td>Kostenlos; Sync ab 4 $ pro Monat bei jährlicher Zahlung</td></tr>
        <tr><td>Geräte</td><td>Apple-Geräte und iCloud.com im Browser</td><td>Mac, Windows, Linux, iPhone, Android</td></tr>
        <tr><td>Speicherort</td><td>In Notizen, meist mit iCloud</td><td>Markdown-Dateien in einem Ordner</td></tr>
        <tr><td>Links</td><td>Links zwischen Notizen, keine Rückverweise</td><td>[[Links]], Rückverweise und Graph</td></tr>
        <tr><td>Versionen</td><td>Keine</td><td>Lokale Kopien für 7 Tage; mit Sync 1 oder 12 Monate</td></tr>
        <tr><td>Extras</td><td>Tabellen, Tags, Checklisten, Aufnahmen</td><td>Plugins, Canvas und Publish</td></tr>
      </tbody></table></div>
      <p>Die Preise stammen aus der englischen Vorlage und Obsidian-Seiten vom 21. November 2026.</p>
      <h2 id="apple-notizen">Was Apple Notizen besser kann</h2>
      <p>Du öffnest die App und schreibst los. iCloud synchronisiert Notizen ohne Aufpreis. Auf fremden Computern erreichst du iCloud-Notizen über icloud.com/notes.</p>
      <p>Checklisten, Tabellen, Tags, intelligente Ordner, angeheftete Notizen und mathematische Ergebnisse sind eingebaut. Aufnahmen können ein Transkript und mit Apple Intelligence eine Zusammenfassung erhalten. Einzelne Notizen lassen sich mit Passwort, Face ID oder Touch ID sperren. Teilen setzt einen Apple Account voraus.</p>
      <p>Notizen liegen jedoch in der App statt als normale Dateien. Auf dem Mac exportierst du jeweils die ausgewählte Notiz über „Ablage“ &gt; „Exportieren als“ als PDF oder Markdown. Es gibt keine App für Windows oder Android und keine Versionsgeschichte. Für Links wählst du „Bearbeiten“ &gt; „Link hinzufügen“; <a href="/blog/apple-notes-backlinks" hrefLang="en">Rückverweise</a> zeigt Notizen nicht an.</p>
      <h2 id="obsidian">Was Obsidian besser kann</h2>
      <p>Ein Vault ist ein gewöhnlicher Ordner mit Markdown-Dateien. Jeder Texteditor kann sie lesen. Du kannst den Ordner selbst sichern.</p>
      <p>Mit [[ verknüpfst du Notizen. Obsidian zeigt Rückverweise und einen Graphen; Canvas ist eine freie Fläche für Ideen. Es läuft auf Mac, Windows, Linux, iPhone und Android und hat viele Plugins.</p>
      <p>Obsidian Sync verschlüsselt die übertragenen Notizen und speichert frühere Versionen. Alternativ synchronisierst du den Vault zwischen iPhone und Mac mit iCloud. Nutze nicht zwei Sync-Dienste für denselben Vault. Ohne Sync bleiben frühere Kopien lokal, standardmäßig sieben Tage. Für ein eigenes System und Plugins brauchst du Zeit.</p>
      <p>Obsidian Publish kostet laut englischer Vorlage 8 $ pro Website und Monat bei jährlicher Zahlung oder 10 $ monatlich. Obsidian Sync kostet 4 $ pro Nutzer und Monat bei jährlicher Zahlung oder 5 $ monatlich. Mit Sync sind die Notizen verschlüsselt; ohne den Dienst liegen die Dateien auf deiner Festplatte. Die lokale Dateiwiederherstellung behält standardmäßig sieben Tage, Sync je nach Plan einen oder zwölf Monate.</p>
      <p>Apple hält bei normalem iCloud-Datenschutz die Schlüssel. Mit erweitertem Datenschutz liegen sie auf deinen vertrauenswürdigen Geräten. Obsidian bietet mit seiner Kommandozeile eine weitere Art der KI-Anbindung, solange die App auf dem Computer läuft; Community-Plugins können MCP ergänzen. [[Obsidian-MCP im Vergleich|/blog/obsidian-mcp]] erklärt das.</p>
      <h2 id="wechsel">Zwischen den Apps wechseln</h2>
      <p>Obsidian importiert Apple Notizen auf dem Mac mit seinem Importer. Gesperrte Notizen werden übersprungen; entsperre sie vorher. Tabellen, Bilder, Zeichnungen, Scans und PDFs können mitkommen. Die <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">Anleitung zum Wechsel</a> erklärt die Schritte.</p>
      <p>In die andere Richtung wählst du auf dem Mac in Notizen „Ablage“ &gt; „Markdown importieren“. Prüfe danach Links im Format [[Titel]]. Ein Import ist eine Kopie; die beiden Apps bleiben nicht synchron.</p>
      <h2 id="notion">Und Notion?</h2>
      <p>Notion ist für gemeinsame Seiten und Datenbanken gebaut. Der kostenlose Plan enthält einen Test von Notion AI. Es läuft auf Mac, Windows und Mobilgeräten. Für persönliche Notizen passen Apple Notizen oder Obsidian oft besser; für ein Team ist <a href="/de/blog/apple-notizen-vs-notion">Notion im Vergleich</a> einen Blick wert.</p>
      <h2 id="pinto">Apple-Gefühl mit Markdown</h2>
      <p>Pinto Notes behält Ordner, Checklisten und Tabellen auf iPhone und Mac. Notizen sind Markdown-Dateien mit [[Links]] und Rückverweisen. Jede frühere Version bleibt erhalten. ChatGPT, Claude, Claude Code und Codex können nach dem Verbinden suchen und bearbeiten. Die Notizen sind verschlüsselt.</p>
      <p>Auf dem Mac importierst du Apple Notizen oder einen Obsidian-Vault. Unterordner, Bilder und Links kommen mit; die Originale bleiben. Pinto Notes hat keine Windows-, Android-, Linux- oder Web-App, keinen Graphen und keine Obsidian-Plugins.</p>
      <PostFigure src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} alt="Import eines Obsidian-Vaults in Pinto Notes auf dem Mac." caption="Der Vault bleibt nach dem Import an seinem bisherigen Ort." />
      <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} alt="Obsidian auf dem Mac mit einer Einkaufsliste als Markdown-Datei." caption="Dieselbe Liste in Obsidian." />
      <Figure shot={SHOTS.aiEdit} caption="ChatGPT hat eine Einkaufsliste ergänzt. Die Änderungen lassen sich zurücknehmen." />
    </LocalPostPage>
  );
}
