import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-vs-bear");

// German version of /blog/apple-notes-vs-bear, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „bear notizen“, „bear notizen app“;
// „apple notes vs bear“ returned „apple notes vs bear app“. German comparison queries returned no completions.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/not201900c07/mac
// (Ablage > Exportieren; Ablage > Markdown importieren), https://support.apple.com/de-de/guide/notes/apd4e6e2c9a6/mac,
// https://support.apple.com/de-de/guide/icloud/mm8685520792/icloud. Bear facts and links follow the English post.

const ui = UI.de;
const faq = [
  { q: "Bear oder Apple Notizen zum Schreiben?", a: ["Bear eignet sich für Markdown, Inhaltsverzeichnisse und Rückverweise. Apple Notizen passt besser, wenn du Ordner und gemeinsam bearbeitete iCloud-Notizen brauchst. Beide haben Tabellen und Checklisten."] },
  { q: "Brauche ich Bear Pro für die Synchronisierung?", a: ["Ja. Die kostenlose Version speichert Notizen lokal. Für die Synchronisierung über iCloud brauchst du Bear Pro. Prüfe den aktuellen Preis auf der Website von Bear."] },
  { q: "Kann ich Bear-Notizen in Apple Notizen übernehmen?", a: ["Ja. Exportiere sie in Bear als Markdown. Auf dem Mac wählst du in Notizen „Ablage“ > „Markdown importieren“. Prüfe danach Bilder, Tabellen und Links an einigen Notizen."] },
  { q: "Kann Claude Bear-Notizen bearbeiten?", a: ["Ja. Bear ab Version 2.8 bietet auf dem Mac einen Claude Connector, einen lokalen MCP-Server und ein Kommandozeilenwerkzeug. Verschlüsselte Notizen können diese Werkzeuge laut Bear nicht lesen oder ändern."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="apple-notizen-vs-bear"
    intro={<>Apple Notizen passt zu geteilten Listen und Ordnern. Bear ist für Menschen interessant, die in Markdown schreiben und ihre Notizen mit verschachtelten Tags ordnen. Beim Wechsel unterscheiden sich auch Synchronisierung und Import.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vergleich", label: "Vergleich" }, { href: "#apple", label: "Apple Notizen" },
      { href: "#bear", label: "Bear" }, { href: "#wechsel", label: "Notizen umziehen" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Apple Notizen bietet Ordner, intelligente Ordner und gemeinsame Bearbeitung über iCloud. Bear bietet Markdown, verschachtelte Tags und Rückverweise. Beide laufen auf iPhone und Mac. Bei Bear ist für die Synchronisierung ein Pro-Abo nötig.</p>
      <PostCta slug="de/apple-notizen-vs-bear" path="/de/blog/apple-notizen-vs-bear" position="answer" ui={ui.cta} title="Notizen mit KI bearbeiten">
        <p>Pinto Notes ist auf Englisch und läuft auf iPhone und Mac. Es behält frühere Versionen und lässt ChatGPT oder Claude nach dem Verbinden Notizen lesen und bearbeiten. Auf dem Mac kannst du Apple Notizen und Bear importieren.</p>
      </PostCta>
    </Answer>} faq={faq}>
    <h2 id="vergleich">Auf einen Blick</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Punkt</th><th scope="col">Apple Notizen</th><th scope="col">Bear</th></tr></thead><tbody>
      <tr><th scope="row">Ordnung</th><td>Ordner, Tags, intelligente Ordner</td><td>Tags, auch verschachtelt wie #arbeit/projekt</td></tr>
      <tr><th scope="row">Schreiben</th><td>Formatierter Text, Checklisten, Tabellen</td><td>Markdown, Tabellen, Aufgaben, Designs</td></tr>
      <tr><th scope="row">Verknüpfungen</th><td>Links zwischen Notizen</td><td>Wiki-Links, Rückverweise, Links zu Überschriften</td></tr>
      <tr><th scope="row">Synchronisierung</th><td>iCloud, wenn Notizen auf jedem Gerät aktiviert ist</td><td>iCloud mit Bear Pro</td></tr>
      <tr><th scope="row">Export am Mac</th><td>PDF oder Markdown</td><td>Markdown und weitere Formate; PDF und Word mit Pro</td></tr>
    </tbody></table></div>
    <p>Bear lässt sich kostenlos mit lokalen Notizen nutzen. Pro ergänzt die Suche in Bildern und PDFs sowie weitere Designs. Die <a href="https://bear.app/#pricing">Preise stehen bei Bear</a>.</p>
    <h2 id="apple">Apple Notizen für Ordner und gemeinsame Notizen</h2>
    <p>Für Arbeit und Privates kannst du eigene Ordner anlegen. Checklisten und Tabellen stehen direkt in der Notiz. Häufig verwendete Notizen heftest du an. Ein Tag kann Notizen aus mehreren Ordnern verbinden. Intelligente Ordner sammeln sie nach Regeln, etwa nach Tag oder offener Checkliste. Mehr dazu steht im <a href="/blog/apple-notes-tags-smart-folders">englischen Guide zu Tags und intelligenten Ordnern</a>.</p>
    <p>Eine Einkaufsliste oder Projektnotiz lässt sich über iCloud gemeinsam bearbeiten. Alle Beteiligten brauchen einen Apple Account. Du kannst Bearbeitung oder bloßes Lesen erlauben. Für deine eigenen Geräte meldest du dich mit demselben Account an und aktivierst Notizen in iCloud.</p>
    <p>Teste diese Möglichkeiten mit echten Notizen. Wenn du wissen willst, welche anderen Notizen auf einen Text verweisen, bietet Bear Rückverweise. Für offene Aufgaben kann ein intelligenter Ordner schon reichen.</p>
    <h2 id="bear">Bear für Markdown und verknüpfte Texte</h2>
    <p>Bear schreibt Markdown direkt im Editor. Der Infobereich zeigt ein Inhaltsverzeichnis aus deinen Überschriften. Mit [[ suchst und verlinkst du andere Notizen. Rückverweise zeigen Links und auch Erwähnungen ohne Link. Bear erklärt das im <a href="https://bear.app/faq/how-to-use-the-info-panel-table-of-contents-and-backlinks-in-bear/">Handbuch zum Infobereich</a>.</p>
    <p>Mit #arbeit/projekt liegt ein Projekt unter Arbeit. Weitere Tags können dieselbe Notiz an mehreren Stellen auffindbar machen. Ein Klick auf einen Tag in der Seitenleiste zeigt die passenden Notizen. Probier das vor einem großen Import aus.</p>
    <p>Bear speichert Notizen in einer Datenbank, nicht als Ordner voller Markdown-Dateien. Mehrere Notizen lassen sich auch kostenlos als Markdown exportieren. Pro bietet zusätzlich PDF, Word und HTML. Apple Notizen kann ebenfalls Markdown exportieren.</p>
    <p>Bear ab Version 2.8 hat auf dem Mac einen Claude Connector, einen lokalen MCP-Server und ein Kommandozeilenwerkzeug. Sie können Notizen suchen, lesen, erstellen und ändern. Tag-Filter begrenzen den Zugriff. Laut <a href="https://bear.app/faq/command-line-interface/">Bear</a> sind verschlüsselte Notizen ausgeschlossen.</p>
    <h2 id="wechsel">Zwischen Apple Notizen und Bear wechseln</h2>
    <p>Für Bear exportierst du zunächst eine Notiz auf dem Mac als Markdown. Unter macOS 27 bietet Apple dafür eine Exportoption im Menü „Ablage“. Bears <a href="https://bear.app/faq/migrate-from-apple-notes/">Umzugsanleitung</a> importiert anschließend den Markdown-Ordner. Der ältere Weg über Automator wandelt Aufgabenlisten in Aufzählungen um und lässt Anhänge außer Fotos aus.</p>
    <p>Zurück zu Apple Notizen: Wähle in Bear Notizen aus und exportiere sie als Markdown. In Apple Notizen wählst du „Ablage“ &gt; „Markdown importieren“. Apples <a href="https://support.apple.com/de-de/guide/notes/not201900c07/mac">Anleitung</a> beschreibt auch den Import einer Ordnerstruktur. Prüfe Bear-spezifische Wiki-Links danach einzeln.</p>
    <p>Beginne mit einer Notiz mit Bild, Tabelle und Checkliste. Vergleiche die Kopien und behalte die Originale während des Tests. Der Import richtet keine laufende Synchronisierung zwischen den Apps ein.</p>
    <h2 id="pinto">Apple Notizen mit KI-Verbindung</h2>
    <p>Pinto Notes sieht auf iPhone und Mac ähnlich aus wie Apple Notizen. Es speichert Notizen als Markdown-Dateien und behält frühere Versionen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> kann die KI Listen ergänzen und Entwürfe bearbeiten.</p>
    <Figure shot={SHOTS.aiEdit} caption="Eine Einkaufsliste in Pinto Notes auf dem Mac, nachdem ChatGPT Einträge ergänzt hat." />
    <p>Aus Bear exportierst du Markdown mit Anhängen und wählst den Ordner in Pinto Notes aus. Bilder kommen mit. Die <a href="/blog/import-your-notes">Importanleitung</a> zeigt den Weg. Apple Notizen übernimmst du mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a>. Die ursprünglichen Notizen bleiben dort bestehen.</p>
  </LocalPostPage>;
}
