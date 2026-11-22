import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "cursor-mit-notizen-verbinden");

// German version of /blog/connect-notes-to-cursor, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "cursor notizen verbinden" and "cursor mcp notizen" returned no suggestions;
// "cursor apple notizen" returned an unrelated cursor-position query. Descriptive title used.
// No Apple menu steps occur. Cursor and Pinto UI names follow the English source.
// Commands, config and install link are unchanged from the English post.

const ui = UI.de;
const CONFIG = JSON.stringify({ mcpServers: { "pinto-notes": { url: MCP_URL } } }, null, 2);
const CURSOR_INSTALL = "cursor://anysphere.cursor-deeplink/mcp/install?" + new URLSearchParams({
  name: "pinto-notes",
  config: Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64"),
}).toString();

const BRIEF = `Konzept für die Website-Suche

Ziel: Besucher sollen veröffentlichte Hilfeartikel durchsuchen können.
Erste Version: Artikeltitel durchsuchen und passende Links zeigen.
Beibehalten: Das bestehende Layout der Hilfeseite.
Nicht enthalten: Suche in Anhängen.
Offene Frage: Sollen Ergebnisse beim Tippen erscheinen oder erst nach einem Klick auf Suchen?

Entscheidungen
Noch keine Entscheidung zur Umsetzung.

Nächster Schritt
Prüfen, wie die Hilfeartikel geladen werden.`;

const READ_PROMPT = `Suche in meinen Pinto Notes nach "Konzept für die Website-Suche" und lies die ganze Notiz. Nenne mir das Ziel, was in der ersten Version fehlt und welche Frage offen ist. Ändere weder die Notiz noch den Code.`;
const UPDATE_PROMPT = `Lies "Konzept für die Website-Suche" in Pinto Notes erneut. Ersetze unter Entscheidungen "Noch keine Entscheidung zur Umsetzung." durch "Ergebnisse erst nach einem Klick auf Suchen zeigen." Ersetze unter Nächster Schritt den Text durch "Ein Suchfeld und eine Schaltfläche im bestehenden Layout der Hilfeseite ergänzen." Lass den übrigen Text unverändert. Zeige mir deine Änderungen.`;

const faq = [
  { q: "Wie verbinde ich Pinto Notes mit Cursor?", a: ["Öffne auf dem Mac den Link zum Hinzufügen von Pinto Notes, bestätige den Server in Cursor und melde dich an. Wähle Allow, wenn Pinto Notes fragt. Damit kann Cursor deine Notizen lesen und bearbeiten."] },
  { q: "Wo speichert Cursor die MCP-Konfiguration?", a: ["Cursor nennt .cursor/mcp.json für ein Projekt und ~/.cursor/mcp.json für alle Projekte. Wenn du bereits Server nutzt, ergänze pinto-notes im vorhandenen mcpServers-Objekt."] },
  { q: "Kann Cursor eine Projektnotiz vom iPhone aktualisieren?", a: ["Ja. Speichere sie in Pinto Notes und verbinde Cursor mit demselben Konto. Lass Cursor die Notiz vor jeder Änderung lesen. Prüfe das Ergebnis danach in Pinto Notes."] },
  { q: "Erhält Cursor damit auch Zugriff auf Apple Notizen?", a: ["Nein. Die Verbindung greift auf dein Pinto-Notes-Konto zu. Bestehende Apple Notizen kannst du auf dem Mac importieren; die Originale bleiben unverändert."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="cursor-mit-notizen-verbinden"
    intro={<>Verbinde Pinto Notes über MCP mit Cursor, melde dich an und wähle Allow. Cursor kann dann ein Projektkonzept lesen, das du auf dem iPhone geschrieben hast, und es bei der Arbeit am Mac aktualisieren.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#verbinden", label: "Cursor verbinden" },
      { href: "#manuell", label: "Manuell einrichten" },
      { href: "#konzept", label: "Konzept ausprobieren" },
      { href: "#probleme", label: "Verbindung prüfen" },
    ]}>
      <p>Nutze auf dem Mac den Installationslink unten, melde dich an und wähle Allow in Pinto Notes. Diese eine Zustimmung erlaubt Cursor, deine Notizen zu lesen und zu bearbeiten. Beginne mit einer genau benannten Notiz.</p>
      <PostCta slug="de/cursor-mit-notizen-verbinden" path="/de/blog/cursor-mit-notizen-verbinden" position="answer" ui={ui.cta} title="Nimm dein Projektkonzept zu Cursor mit">
        <p>Schreibe das Konzept in Pinto Notes auf dem iPhone. Cursor kann es lesen und nach deiner Entscheidung ergänzen. Pinto Notes ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    faq={faq}>
    <h2 id="verbinden">Cursor auf dem Mac verbinden</h2>
    <p>Du brauchst Cursor auf dem Mac und ein Pinto-Notes-Konto. Diese Anleitung verbindet Cursor mit diesem Konto. Pinto Notes läuft auf iPhone und Mac; es hat keine App für Windows oder Android und keine Web-App für Notizen.</p>
    <ol>
      <li>Öffne <a href={CURSOR_INSTALL}>Add Pinto Notes to Cursor</a>. Der Link trägt die Serveradresse ein.</li>
      <li>Bestätige den Server in Cursor und folge den Schritten zur Anmeldung.</li>
      <li>Wähle Allow in Pinto Notes. Damit erlaubst du Lesen und Bearbeiten.</li>
    </ol>
    <p>Der Link nutzt dieselbe Konfiguration wie Pintos eigener Cursor-Link. <a href="https://cursor.com/docs/mcp">Cursors MCP-Anleitung</a> beschreibt entfernte Server und die Anmeldung im Browser. Für diesen Artikel wurden Anleitung und Link-Code geprüft, aber keine Cursor-Verbindung live getestet.</p>

    <h2 id="manuell">Server manuell hinzufügen</h2>
    <p>Cursor nutzt <code>.cursor/mcp.json</code> für ein Projekt oder <code>~/.cursor/mcp.json</code> für alle Projekte. Füge diese Konfiguration hinzu. Wenn bereits Server eingetragen sind, ergänze <code>pinto-notes</code> im bestehenden <code>mcpServers</code>-Objekt.</p>
    <Keep title="Pinto-Notes-MCP-Konfiguration" text={CONFIG} code />
    <p>Aktiviere den Server in Cursor unter Customize. Melde dich an und wähle Allow. Die <a href="/blog/mcp-server" hrefLang="en">Pinto-Notes-MCP-Anleitung</a> erklärt die Werkzeuge und den Zugriff.</p>

    <h2 id="konzept">Ein Konzept vom iPhone lesen</h2>
    <p>Schreibe in Pinto Notes auf dem iPhone eine Notiz, bevor du den Code öffnest. Halte fest, was die Änderung leisten soll und was warten kann. Dieses Beispiel kannst du für dein Projekt anpassen.</p>
    <Keep title="Beispiel für ein Projektkonzept" text={BRIEF} />
    <p>Bitte Cursor auf dem Mac, diese Notiz zu suchen:</p>
    <Keep title="Prüfen, ob Cursor das Konzept gelesen hat" text={READ_PROMPT} />
    <p>Prüfe das Ergebnis des Werkzeugs und die Antwort. Cursor soll die tatsächliche Notiz und die Frage nach dem Zeitpunkt der Suchergebnisse nennen. Eine allgemeine Antwort zur Website-Suche belegt keinen Zugriff auf deine Notiz.</p>

    <h2 id="entscheidung">Eine Entscheidung im Konzept festhalten</h2>
    <p>Wenn du dich entschieden hast, bitte Cursor um eine genaue Änderung. Hier sollen Ergebnisse erst nach dem Klick auf Suchen erscheinen.</p>
    <Keep title="Entscheidung und nächsten Schritt speichern" text={UPDATE_PROMPT} />
    <p>Pintos Bearbeitungswerkzeug verlangt, dass der Agent eine Notiz vor der Änderung liest. Öffne das Konzept danach in Pinto Notes und prüfe es. Frühere Versionen bleiben erhalten. Formuliere genau, welcher Abschnitt geändert werden soll.</p>

    <h2 id="probleme">Wenn Cursor deine Notizen nicht findet</h2>
    <p>Prüfe, ob die Anmeldung für das Pinto-Konto mit dem Konzept abgeschlossen ist. In Cursor muss der Server unter Customize aktiviert sein. Bei Verbindungsfehlern öffne Output und wähle MCP Logs. Cursor fragt standardmäßig vor Werkzeugaufrufen nach Zustimmung.</p>
    <p>Wiederhole zunächst die Leseanfrage. Haben mehrere Notizen ähnliche Namen, gib den genauen Titel an und lass Cursor den Fund zeigen. Nutze keine erratene Zusammenfassung als Projektanforderung.</p>

    <h2 id="pinto">Entscheidungen beim ursprünglichen Konzept behalten</h2>
    <p>Nutze dieselbe Notiz für die Anforderung vom iPhone und die Entscheidungen beim Programmieren. Bitte Cursor ausdrücklich, Änderungen zurückzuschreiben.</p>
    <p>Die <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Anleitung für Claude Code und Codex</a> verbindet weitere Agenten mit Pinto Notes. Liegen deine Konzepte in Apple Notizen, kannst du sie <a href="/blog/import-your-notes" hrefLang="en">auf dem Mac importieren</a>. Apple Notizen bleibt unverändert.</p>
  </LocalPostPage>;
}
