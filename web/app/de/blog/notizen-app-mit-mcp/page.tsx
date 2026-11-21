import { Figure } from "@/lib/blog";
import { MCP_URL } from "@/lib/facts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-app-mit-mcp");

// German version of /blog/best-notes-apps-with-mcp (21 Nov 2026). Google autocomplete hl=de,
// gl=de, read 21 Nov: „notizen app mit mcp“ and „notizen app mcp server“ returned no suggestions;
// „notizen app ki“ returned „notizen app ki“ and „notizen app ohne ki“. The precise MCP term
// is kept so the post does not promise a general AI feature. Apple's German Notes guide
// de-de/guide/notes/get-started-apd441e46563/mac read 21 Nov 2026: no MCP setup documented.
// Other apps' facts and documentation limits remain those of the English original.

const ui = UI.de;
const ROWS = [
  { app: "Pinto Notes", route: "Offizieller gehosteter MCP-Server", use: "Notizen suchen, lesen, erstellen und bearbeiten. Du erlaubst jede KI-App.", fit: "Apple-Notizen-Gefühl auf iPhone und Mac mit KI-Zugriff von anderswo.", limit: "Die Notizen-App läuft nur auf Apple-Geräten. Der Server braucht keinen laufenden Mac." },
  { app: "Obsidian", route: "MCP-Plugin aus der Community", use: "Eine lokale REST-API mit MCP sucht, liest und schreibt, auch in einzelnen Abschnitten.", fit: "Lokale Markdown-Dateien, die andere Werkzeuge bearbeiten können.", limit: "Das Plugin läuft in Obsidian auf deinem Computer. Es stammt von Adam Coddington, nicht von Obsidian." },
  { app: "Bear", route: "Offizieller lokaler MCP-Server", use: "Das mitgelieferte bearcli kann Notizen suchen, lesen, erstellen und bearbeiten.", fit: "Eine bestehende Bear-Sammlung mit einem lokalen KI-Client verbinden.", limit: "Nur Mac, Bear 2.8 oder neuer. Verschlüsselte Notizen bleiben für diese Werkzeuge unzugänglich." },
  { app: "Notesnook", route: "Community-Experiment; keine offizielle MCP-Einrichtung gefunden", use: "Ein Community-Autor kündigte eine lokale Brücke in Notesnooks Diskussionen an.", fit: "Quelloffene Notizen mit Notizbüchern, Tags und Web Clipper.", limit: "Die Brücke ist experimentell und inoffiziell. Notesnooks geprüfte Hilfe dokumentiert keine unterstützte MCP-Verbindung." },
  { app: "Notion", route: "Offizieller gehosteter MCP-Server", use: "Arbeitsbereich durchsuchen, Seiten erstellen und bearbeiten, Datenbanken verwalten.", fit: "Notizen zusammen mit Teamdokumenten und Projektdatenbanken.", limit: "Die Verbindung nutzt deine Notion-Berechtigungen. Prüfe den Zugriff deines Accounts." },
  { app: "Apple Notizen", route: "Keine offizielle MCP-Einrichtung im Notizen-Handbuch", use: "Apple erklärt die Nutzung von Notizen, aber keine MCP-Verbindung.", fit: "iCloud-Notizen mit Checklisten, Tabellen und Medien auf Apple-Geräten.", limit: "In den geprüften Unterlagen wurde kein MCP-Weg von Apple gefunden." },
];
const FAQ = [
  { q: "Welche Notizen-Apps dokumentieren einen eigenen MCP-Server?", a: ["Pinto Notes und Notion haben gehostete MCP-Server. Bear dokumentiert einen offiziellen lokalen Server auf dem Mac. Das Obsidian-Plugin und der Notesnook-Versuch sind Community-Projekte. Die Verbindungen der anderen Apps haben wir nicht selbst getestet."] },
  { q: "Läuft Bears MCP-Verbindung auf dem iPhone?", a: ["Nein. Laut Bear sind CLI, Claude Connector und MCP-Server nur für macOS und brauchen Bear 2.8 oder neuer. Der Claude Connector setzt die Desktop-App von Claude voraus."] },
  { q: "Ist Notesnook MCP eine offizielle Funktion?", a: ["In der am 21. November 2026 geprüften Notesnook-Hilfe war keine offizielle Einrichtung dokumentiert. Ein Community-Autor stellte eine experimentelle lokale Brücke vor. Sie ist inoffiziell und wurde hier nicht getestet."] },
  { q: "Dokumentiert Standard Notes eine MCP-Verbindung?", a: ["Im am 21. November 2026 geprüften Hilfeverzeichnis von Standard Notes stand keine MCP-Einrichtung. Das schließt ein Community-Projekt nicht aus. Eine Verbindung wurde hier nicht getestet."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notizen-app-mit-mcp"
    intro={<>Pinto Notes und Notion bieten gehostete MCP-Server. Bear hat einen offiziellen lokalen Server für Mac. Für Obsidian gibt es Community-Plugins, für Notesnook einen Community-Versuch. Apples Notizen-Handbuch beschreibt keine MCP-Einrichtung.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vergleich", label: "Sechs Apps" }, { href: "#gehostet", label: "Gehostete Verbindungen" },
      { href: "#lokal", label: "Lokale Verbindungen" }, { href: "#apple", label: "Apple Notizen" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Pinto Notes passt, wenn du eine App wie Apple Notizen mit gehostetem MCP für ChatGPT oder Claude suchst. Notion verbindet Seiten und Datenbanken eines Teams. Bear bietet einen offiziellen MCP-Weg zur bestehenden Sammlung auf dem Mac. Obsidian passt zu lokalen Markdown-Dateien. Notesnooks experimentelle Brücke solltest du vor einem Wechsel genau prüfen.</p>
      <PostCta slug="de/notizen-app-mit-mcp" path="/de/blog/notizen-app-mit-mcp" position="answer" ui={ui.cta} title="Verbinde deine Notizen mit deiner KI">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Über sein gehostetes MCP können ChatGPT oder Claude Notizen suchen, lesen und bearbeiten. Änderungen lassen sich rückgängig machen; frühere Versionen bleiben.</p>
      </PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="vergleich">Sechs Notizen-Apps mit ihren MCP-Verbindungen</h2>
    <p>MCP steht für Model Context Protocol. Eine kompatible KI-App kann darüber Werkzeuge für deine Notizen aufrufen. Diese Tabelle vergleicht die dokumentierten Wege, geprüft am 21. November 2026. Pinto Notes wird vom Anbieter dieser Seite veröffentlicht. Die anderen Verbindungen und Community-Server haben wir nicht selbst getestet.</p>
    <div className="tableWrap"><table><thead><tr><th scope="col">Notizen-App</th><th scope="col">MCP-Weg</th><th scope="col">Dokumentierte Funktionen</th><th scope="col">Geeignet für</th><th scope="col">Wichtig</th></tr></thead><tbody>
      {ROWS.map(row => <tr key={row.app}><th scope="row">{row.app}</th><td>{row.route}</td><td>{row.use}</td><td>{row.fit}</td><td>{row.limit}</td></tr>)}
    </tbody></table></div>
    <h2 id="gehostet">Pinto Notes und Notion verbinden sich über das Internet</h2>
    <p>Ein gehosteter MCP-Server stellt einer kompatiblen KI-App eine Internetadresse bereit. Du erlaubst die Verbindung und lässt die KI ihre Werkzeuge verwenden. Die Adresse von Pinto Notes ist <code>{MCP_URL}</code>. Du erlaubst jede KI-App einzeln. Änderungen zeigen eine Rückgängig-Option und frühere Versionen bleiben erhalten.</p>
    <p>Der <a href="https://developers.notion.com/guides/mcp/get-started-with-mcp">offizielle Notion-Server</a> liegt unter <code>https://mcp.notion.com/mcp</code>. Seine <a href="https://developers.notion.com/guides/mcp/overview">dokumentierten Werkzeuge</a> durchsuchen Arbeitsbereiche, bearbeiten Seiten und verwalten Datenbanken. Das passt, wenn Besprechungsnotizen zu gemeinsamen Projekten gehören. Die Verbindung folgt deinen Notion-Berechtigungen.</p>
    <h2 id="lokal">Bear und Obsidian verbinden sich auf deinem Computer</h2>
    <p>Bear hat einen eigenen Server. Die <a href="https://bear.app/faq/command-line-interface/">offizielle Anleitung</a> beschreibt <code>bearcli mcp-server</code>, das Bear auf dem Mac mitliefert. Den Claude Connector installierst du über Help, Advanced, Install Claude Connector. Beide Wege nutzen Bears lokale Datenbank. Tag-Filter können sichtbare Notizen einschränken. Verschlüsselte Notizen bleiben ausgeschlossen.</p>
    <p>Obsidian speichert <a href="https://obsidian.md/help/data-storage">einfache Markdown-Dateien in einem Ordner</a>. Sein Community-Verzeichnis führt <a href="https://community.obsidian.md/plugins/obsidian-local-rest-api">Local REST API with MCP</a> von Adam Coddington. Das Plugin stellt einen lokalen Server mit API-Schlüssel bereit und kann einzelne Überschriften oder Blöcke ändern. Dafür müssen Obsidian und der Computer laufen.</p>
    <p>Bear entwickelt seine Verbindung selbst; das Obsidian-Plugin kommt aus der Community. Keiner dieser beiden Wege ist gehostet. Der <a href="/blog/obsidian-mcp">englische Obsidian-MCP-Vergleich</a> beschreibt weitere Wege, darunter Server für die Dateien im Vault.</p>
    <h2 id="notesnook">Notesnook hat einen Community-Versuch</h2>
    <p><a href="https://notesnook.com/">Notesnook</a> ist quelloffen und bietet Notizbücher, Tags und einen Web Clipper. Die für diesen Vergleich geprüften <a href="https://notesnook.com/help/">Hilfeseiten</a> beschreiben keine offizielle MCP-Einrichtung.</p>
    <p>Ein Community-Autor veröffentlichte eine <a href="https://github.com/streetwriters/notesnook/discussions/10571">experimentelle lokale MCP-Brücke</a> im Repository des Anbieters. Er bezeichnet sie ausdrücklich als inoffiziell. Ein Beitrag im Diskussionsbereich macht daraus keine unterstützte Notesnook-Funktion. Wir haben sie nicht getestet. Wenn du Notesnook bereits nutzt, lies die aktuellen Anforderungen vor einem Versuch.</p>
    <h2 id="apple">Und Apple Notizen mit MCP?</h2>
    <p>Apple Notizen bietet iCloud-Notizen mit Checklisten, Tabellen und Medien. <a href="https://support.apple.com/de-de/guide/notes/get-started-apd441e46563/mac">Apples Handbuch</a> beschreibt diese Funktionen, aber keinen MCP-Server. In den geprüften Unterlagen fanden wir keine MCP-Einrichtung von Apple.</p>
    <p>Ein Suchtreffer für „Apple Notes MCP“ belegt deshalb nicht, was ein Community-Projekt tatsächlich kann.</p>
    <h2 id="pinto">Pinto Notes behält das Apple-Notizen-Gefühl</h2>
    <p>Pinto Notes läuft auf iPhone und Mac, nicht unter Windows, Android oder im Web. Über den gehosteten Server können ChatGPT und Claude auf Notizen zugreifen, ohne dass dein Mac eingeschaltet bleibt. Claude Code und Codex können sich ebenfalls verbinden. Der <a href="/blog/mcp-server">englische MCP-Leitfaden</a> erklärt Werkzeuge und Erlaubnis.</p>
    <Figure shot={SHOTS.aiEdit} caption="ChatGPT ergänzte fünf Zeilen in einer Einkaufsliste in Pinto Notes auf dem Mac. Die Änderungen sind markiert und lassen sich rückgängig machen." />
    <p>Eine KI kann Notizen suchen und lesen, neue erstellen und bestehende bearbeiten. Du siehst ihre Änderungen, kannst sie rückgängig machen und eine frühere Version wiederherstellen. <a href="/blog/move-from-apple-notes">Importiere Apple Notizen auf dem Mac</a>, wenn du deine Sammlung mitnehmen willst. Apple Notizen bleibt unverändert.</p>
  </LocalPostPage>;
}
