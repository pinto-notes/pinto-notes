import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-app-fuer-entwickler");

// German version of /blog/notes-app-for-developers (21 Nov 2026). Google autocomplete hl=de,
// gl=de, read 21 Nov: „notizen app für entwickler“ and „notizen app programmierer“ returned no
// suggestions; „notizen app für autoren“ returned exactly that, and „beste notizen app für mac“
// returned „beste notizen app für mac“. „Entwickler“ keeps the source audience without inventing
// search evidence. German Apple pages read 21 Nov 2026: de-de/guide/notes/apd46c25187e/mac
// (Umschalt-Command-M, label „Proportionales Textformat“), apde615d29c2/mac
// (Bearbeiten > Link hinzufügen), not201900c07/mac (Ablage > Exportieren > Markdown;
// Bearbeiten > Als Markdown kopieren). No clear German label for English Monostyled was verified,
// so the German Mac label is used and the iPhone label is not guessed. Other apps' facts are the English post's.

const ui = UI.de;
const FAQ = [
  { q: "Worauf sollten Entwickler bei einer Notizen-App achten?", a: ["Prüfe die Formatierung von Code, den Markdown-Export, Suche und Links zwischen Notizen. Soll ein Coding-Agent mitlesen, entscheide, ob er über lokale Dateien, ein Kommandozeilenprogramm oder MCP zugreift."] },
  { q: "Bei welcher App kann ein Coding-Agent lokale Dateien lesen?", a: ["Obsidian speichert seinen Vault als normale Markdown-Dateien. Ein Agent mit Zugriff auf den Ordner kann sie direkt lesen. Obsidian bietet außerdem eine offizielle CLI für die laufende App."] },
  { q: "Taugt Apple Notizen für Programmiernotizen?", a: ["Ja, für Erklärungen, Checklisten und kurze Codeschnipsel. Auf dem Mac wendet Umschalt-Command-M „Proportionales Textformat“ an. Du kannst Notizen verlinken und als Markdown exportieren. Der Export ist allerdings eine separate Kopie."] },
  { q: "Kann Gemini CLI mit Pinto Notes arbeiten?", a: ["Ja. Pinto Notes nennt Gemini CLI neben Claude Code und Codex in seiner MCP-Einrichtung. Nach Verbindung und Erlaubnis kann der Agent Notizen suchen, lesen und bearbeiten."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notizen-app-fuer-entwickler"
    intro={<>Obsidian passt, wenn du lokale Markdown-Dateien in Git verwalten willst. Pinto Notes passt, wenn du eine App wie Apple Notizen auf iPhone und Mac möchtest, deren Notizen dein Coding-Agent lesen und bearbeiten kann.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vergleich", label: "Apps vergleichen" }, { href: "#pruefen", label: "Worauf achten?" },
      { href: "#obsidian", label: "Lokale Dateien" }, { href: "#pinto", label: "Pinto Notes" },
      { href: "#vorlagen", label: "Vorlagen" },
    ]}>
      <p>Obsidian eignet sich für persönliche Dateien, Notion für gemeinsame Projektdokumente. Joplin bietet Markdown-Notizbücher und eine Terminal-App. Bear verknüpft Erklärungen und Codeschnipsel; Apple Notizen hält schnelle Projektgedanken fest. Pinto Notes verbindet Claude Code, Codex und Gemini CLI über einen gehosteten MCP-Server.</p>
      <PostCta slug="de/notizen-app-fuer-entwickler" path="/de/blog/notizen-app-fuer-entwickler" position="answer" ui={ui.cta} title="Projektnotizen für deinen Coding-Agenten">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Füge über das /-Menü einen Code Block hinzu und verbinde deinen Agenten. Er kann deine Markdown-Notizen dann lesen und bearbeiten.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
      alt="Standup-Notiz in Pinto Notes auf dem Mac mit einem Blocker zum Staging-API-Schlüssel und Einträgen für Donnerstag und Freitag."
      caption="Eine ausgefüllte Standup-Vorlage in Pinto Notes. Ein verbundener Coding-Agent kann den Rückblick aus Commits entwerfen." />}
    faq={FAQ}>
    <h2 id="vergleich">Sechs Notizen-Apps für Entwickler</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Code und Markdown</th><th scope="col">Zugriff für Werkzeuge</th></tr></thead><tbody>
      <tr><th scope="row">Obsidian</th><td>Codeblöcke; lokale Markdown-Dateien</td><td>Vault direkt lesen oder offizielle CLI nutzen</td></tr>
      <tr><th scope="row">Notion</th><td>Codeblöcke mit Sprachformatierung; Markdown-Export</td><td>Offizielles MCP durchsucht und bearbeitet Seiten</td></tr>
      <tr><th scope="row">Joplin</th><td>Markdown-Editor mit Codeblöcken</td><td>Terminal-App oder lokales MCP über Web Clipper</td></tr>
      <tr><th scope="row">Bear</th><td>Markdown mit Codeblöcken; .md-Export</td><td>Offizielles bearcli und lokales MCP auf dem Mac</td></tr>
      <tr><th scope="row">Apple Notizen</th><td>„Proportionales Textformat“; Markdown-Export auf dem Mac</td><td>Markdown exportieren oder kopieren</td></tr>
      <tr><th scope="row">Pinto Notes</th><td>Code Block im /-Menü; Notizen als Markdown-Dateien</td><td>Gehostetes MCP für Claude Code, Codex und Gemini CLI</td></tr>
    </tbody></table></div>
    <p>Die Funktionen wurden am 21. November 2026 anhand der Herstellerdokumentation geprüft. Die Verbindungen sind dokumentierte Wege, kein Praxistest aller Apps.</p>
    <h2 id="pruefen">Das solltest du vor einem Umzug testen</h2>
    <ul>
      <li>Füge einen echten Codeschnipsel ein und kopiere ihn in deinen Editor zurück. Prüfe Einrückung und Satzzeichen.</li>
      <li>Entscheide, ob du normale Dateien für Git brauchst oder ob ein Markdown-Export reicht.</li>
      <li>Suche nach einem Funktionsnamen und einem Teil einer Fehlermeldung, auch mit Satzzeichen.</li>
      <li>Verlinke eine Entscheidungsnotiz mit dem zugehörigen Fehlerbericht. Prüfe den Rückweg.</li>
      <li>Lass den Agenten eine Notiz lesen und eine Zeile ändern. Prüf das Ergebnis und wie du es rückgängig machst.</li>
    </ul>
    <h2 id="obsidian">Obsidian für lokale Markdown-Dateien</h2>
    <p>Ein Obsidian-Vault ist ein normaler Ordner mit Markdown-Dateien. Du kannst ihn in Git verwalten oder einem Coding-Agenten zum Lesen geben. Codeblöcke können eine Programmiersprache angeben. Notizlinks verbinden Schnipsel mit Erklärungen. Die Suche lässt sich nach Datei und Pfad eingrenzen.</p>
    <p>Die <a href="https://obsidian.md/help/cli">offizielle CLI</a> kann Notizen suchen, lesen und erstellen sowie Text anhängen. Sie braucht die laufende Obsidian-App; der erste Befehl startet sie nötigenfalls. Direkter Dateizugriff lässt Terminalwerkzeuge mit denselben Dateien arbeiten.</p>
    <h2 id="notion">Notion für gemeinsame Projektdokumente</h2>
    <p>Notion passt zu Projektnotizen neben Aufgaben und Datenbanken eines Teams. Mit <code>/code</code> fügst du einen Codeblock ein, wählst die Sprache und kopierst den Schnipsel zurück in den Editor. Seitenverweise erzeugen Rücklinks. Die Suche im Arbeitsbereich findet Seitentext; die Datenbanksuche erfasst Titel und Eigenschaften.</p>
    <p>Notions <a href="https://developers.notion.com/guides/mcp/overview">offizielles MCP</a> lässt einen Assistenten Seiten suchen, erstellen und bearbeiten sowie Datenbanken verwalten. Seiten lassen sich als Markdown, Datenbanken als CSV exportieren. Das sind Kopien; weitere Änderungen finden im Arbeitsbereich statt.</p>
    <h2 id="joplin">Joplin für Markdown und Terminal</h2>
    <p>Joplin ist quelloffen und hat eine Terminal-App sowie einen Markdown-Editor. Es unterstützt Codeblöcke und Notizlinks. Die Suche bietet Filter für Notizbücher und Tags. Ein <code>/</code> vor der Suchanfrage schließt per Basissuche auch Satzzeichen ein; laut Joplin kann das langsamer sein.</p>
    <p>Joplin dokumentiert einen <a href="https://joplinapp.org/help/apps/ai_mcp/">offiziellen lokalen MCP-Server</a>. Web Clipper muss laufen, und du schaltest Server und einzelne Werkzeuge ein. Notizen liegen in Joplins Datenbank; Markdown-Export ist möglich. Terminal-App und MCP arbeiten mit den aktuellen Notizen.</p>
    <h2 id="bear">Bear für verlinkte Erklärungen und Code</h2>
    <p>Bear kombiniert Markdown mit Codeblöcken, die je nach Programmiersprache einfärben. Mit <code>[[</code> verlinkst du eine andere Notiz oder eine Überschrift darin. So kann eine Snippet-Sammlung Beispiele mit Erklärungen und verwandten Notizen verbinden.</p>
    <p>Bears <a href="https://bear.app/faq/command-line-interface/">offizielle CLI und sein MCP-Server</a> können Notizen lokal auf dem Mac suchen, lesen und bearbeiten. Bear speichert Notizen in SQLite und kann .md-Dateien exportieren. Die Automatisierungswerkzeuge laufen nur auf dem Mac.</p>
    <h2 id="apple">Apple Notizen für schnelle Projektnotizen</h2>
    <p>Apple Notizen reicht für ein Untersuchungstagebuch, Checklisten und kurze Codeschnipsel mit Erklärung. Die Suche findet Wörter in Notizen, angeheftete Notizen halten aktuelle Projekte sichtbar. Auf dem Mac wendet Umschalt-Command-M „Proportionales Textformat“ an. Über Bearbeiten, Link hinzufügen verknüpfst du Notizen.</p>
    <p>Apples <a href="https://support.apple.com/de-de/guide/notes/not201900c07/mac">Exportanleitung</a> beschreibt Ablage, Exportieren, Markdown für eine ausgewählte Notiz sowie Bearbeiten, Als Markdown kopieren für markierten Inhalt. Gib die Kopie deinem Agenten als Kontext. Änderungen an der Kopie musst du selbst nach Notizen übertragen.</p>
    <h2 id="pinto">Pinto Notes für Notizen, die der Agent bearbeiten kann</h2>
    <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Tippe <code>/</code> am Zeilenanfang und wähle Code Block. Notizen sind Markdown-Dateien mit Pfaden wie <code>Work/Decision log.md</code>. Agenten können sie über den gehosteten MCP-Server suchen, lesen und bearbeiten.</p>
    <p>Der <a href="/blog/mcp-server">englische MCP-Leitfaden</a> nennt Claude Code, Codex und Gemini CLI samt Verbindungsschritten. Der <a href="/blog/notes-in-claude-code-and-codex">Leitfaden für Claude Code und Codex</a> zeigt Einrichtung und erste Frage. KI-Änderungen sind markiert und rückgängig zu machen; frühere Versionen bleiben. Pinto Notes läuft nur auf Apple-Geräten, nicht unter Windows, Android oder im Web.</p>
    <h2 id="vorlagen">Mit einer Entwicklervorlage anfangen</h2>
    <p>Diese kostenlosen Pinto-Vorlagen geben dem Agenten eine Notizstruktur und Anweisungen für ihre Pflege.</p>
    <ul>
      <li><a href="/templates/bug-triage">Bug triage</a> ordnet Fehler nach Schwere und ergänzt gelieferte Reproduktionsschritte. Die Claude-Code-Anweisung lässt ihn auch im Code nach einer möglichen Ursache suchen.</li>
      <li><a href="/templates/daily-standup">Daily standup</a> hat einen Abschnitt pro Arbeitstag. Der Agent entwirft den gestrigen Rückblick aus Commits und fragt nach dem Nächsten und nach Blockern.</li>
      <li><a href="/templates/decision-log">Decision log</a> hält Kontext, Optionen und Entscheidungsgrund fest. Der Agent soll betroffene Dateien nennen und frühere Entscheidungen prüfen.</li>
    </ul>
    <p>Der KI-Teil funktioniert nach der Verbindung. Für ChatGPT oder Claude hilft der <a href="/blog/connect-chatgpt-to-your-notes">englische Verbindungsleitfaden</a>. Deine Apple Notizen kannst du <a href="/blog/move-from-apple-notes">auf dem Mac in einem Schritt importieren</a>. Sie bleiben dort unverändert.</p>
  </LocalPostPage>;
}
