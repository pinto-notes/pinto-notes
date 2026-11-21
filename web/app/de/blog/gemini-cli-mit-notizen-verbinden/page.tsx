import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "gemini-cli-mit-notizen-verbinden");

// German version of /blog/connect-notes-to-gemini-cli, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "gemini cli notizen verbinden" and "gemini cli mcp notizen" returned none;
// "gemini cli mcp" returned itself and server/configuration variants. Descriptive title used.
// No Apple menu steps occur. Commands, extension URL and MCP_URL import match the English post.

const ui = UI.de;
const ADD = `gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const EXTENSION = "gemini extensions install https://github.com/pinto-notes/pinto-notes";
const BRIEF = `Kontaktformular korrigieren

Nach dem Senden einer Nachricht eine klare Bestätigung zeigen.
Nach einem fehlgeschlagenen Versand die E-Mail-Adresse im Formular behalten.

Ergebnisse der Sitzung
`;
const READ = `Finde meine Pinto-Notes-Notiz "Kontaktformular korrigieren" und lies sie.
Nenne mir ihre Anforderungen, bevor du Code änderst.
Falls mehrere Notizen passen, zeige mir ihre Pfade und frage, welche du nutzen sollst.`;
const SAVE = `Lies "Kontaktformular korrigieren" in Pinto Notes erneut.
Ergänze unter "Ergebnisse der Sitzung" das heutige Datum, was wir geändert haben und welche Prüfungen wir wirklich ausgeführt haben.
Schreibe deutlich, welche Prüfungen wir nicht ausgeführt haben. Lass die Anforderungen und frühere Einträge unverändert.
Zeige mir zum Schluss den Pfad der Notiz.`;

const faq = [
  { q: "Mit welchem Befehl verbinde ich Pinto Notes mit Gemini CLI?", a: [`Führe gemini mcp add --scope user --transport http pinto-notes ${MCP_URL} aus. Starte Gemini CLI, melde dich mit /mcp auth pinto-notes an und bestätige die Verbindung in Pinto Notes auf dem Mac.`] },
  { q: "Wie prüfe ich, ob Gemini CLI die Notizwerkzeuge gefunden hat?", a: ["Gib /mcp in Gemini CLI ein. Suche dann eine Notiz mit ihrem genauen Titel und lass sie lesen. Vergleiche die Antwort mit der Notiz in Pinto Notes."] },
  { q: "Kann Gemini CLI eine Notiz vom iPhone ergänzen?", a: ["Nach dem Verbinden und Bestätigen kann es Pinto-Notizen suchen, lesen und bearbeiten. Lass es die benannte Notiz zuerst lesen und dann unter einer Überschrift ergänzen. Die Notiz wird zwischen iPhone und Mac synchronisiert."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="gemini-cli-mit-notizen-verbinden"
    intro={<>Verbinde Gemini CLI über MCP mit Pinto Notes, melde dich an und bestätige den Zugriff auf dem Mac. Danach kann Gemini CLI ein Konzept vom iPhone lesen und das Ergebnis der Arbeit in derselben Notiz festhalten.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#verbinden", label: "Verbinden" },
      { href: "#lesen", label: "Notiz lesen" },
      { href: "#speichern", label: "Ergebnis speichern" },
      { href: "#pruefen", label: "Verbindung prüfen" },
    ]}>
      <p>Führe <code>gemini mcp add --scope user --transport http pinto-notes {MCP_URL}</code> aus. Melde dich danach in Gemini CLI mit <code>/mcp auth pinto-notes</code> an. Wähle Allow in Pinto Notes auf dem Mac. Diese Zustimmung erlaubt Lesen und Bearbeiten.</p>
      <PostCta slug="de/gemini-cli-mit-notizen-verbinden" path="/de/blog/gemini-cli-mit-notizen-verbinden" position="answer" ui={ui.cta} title="Gib Gemini CLI deine Projektnotizen">
        <p>Pinto Notes kannst du kostenlos für Mac laden. Halte ein Konzept auf dem iPhone fest und lass Gemini CLI das Ergebnis ergänzen. Pinto Notes ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    faq={faq}>
    <h2 id="verbinden">Gemini CLI auf dem Mac verbinden</h2>
    <p>Diese Schritte gelten für Gemini CLI im Terminal auf dem Mac. Installiere Pinto Notes und melde dich dort an. Auch Gemini CLI muss installiert sein.</p>
    <Keep title="Notizserver hinzufügen" text={ADD} code note="Führe den Befehl im Terminal aus. Mit dem Benutzergeltungsbereich steht die Verbindung in allen Projekten bereit." />
    <p>Starte Gemini CLI mit <code>gemini</code> und gib in der Sitzung diesen Befehl ein:</p>
    <Keep title="Bei Pinto Notes anmelden" text="/mcp auth pinto-notes" code note="Schließe die Anmeldung im Browser ab und bestätige die Verbindung in Pinto Notes auf dem Mac." />
    <p>Google beschreibt den HTTP-Befehl und die Anmeldung in der <a href="https://geminicli.com/docs/tools/mcp-server/">Gemini-CLI-MCP-Anleitung</a>. Dieser Ablauf beruht auf der Dokumentation; für den Artikel wurde keine Verbindung live getestet.</p>
    <p>Du kannst stattdessen die Erweiterung aus Pintos README installieren:</p>
    <Keep title="Alternative: Pinto-Erweiterung installieren" text={EXTENSION} code note="Nutze diesen Weg oder den direkten Serverbefehl. Die folgenden Beispiele funktionieren mit beiden Verbindungen." />
    <p>Google erklärt die <a href="https://geminicli.com/docs/extensions/">Installation von GitHub-Erweiterungen</a>. Nutze bei diesem Weg <code>/mcp</code>, um den Servernamen zu finden, und danach <code>/mcp auth</code> für die Anmeldung.</p>

    <h2 id="lesen">Ein Konzept vom iPhone lesen</h2>
    <p>Lege in Pinto Notes auf dem iPhone eine Notiz mit dem Titel „Kontaktformular korrigieren“ an. Für den ersten Versuch kannst du dieses Beispiel nutzen:</p>
    <Keep title="Beispiel für eine Projektnotiz" text={BRIEF} />
    <p>Bitte Gemini CLI auf dem Mac, genau diese Notiz zu finden:</p>
    <Keep title="Konzept vor der Arbeit lesen" text={READ} />
    <p>Achte auf einen Pinto-Aufruf von <code>search</code> und danach <code>fetch</code>. Vergleiche die Antwort mit beiden Anforderungen. Wiederholt Gemini CLI nur deine Frage, ist das noch kein Nachweis, dass es die Notiz gelesen hat.</p>

    <h2 id="speichern">Das Ergebnis in derselben Notiz festhalten</h2>
    <p>Bitte Gemini CLI nach der Arbeit, nur das tatsächlich Geschehene einzutragen. Lass die ursprünglichen Anforderungen über den Ergebnissen stehen, damit die nächste Sitzung beides lesen kann.</p>
    <Keep title="Ergebnis der Sitzung speichern" text={SAVE} />
    <p>Pintos Werkzeug <code>edit</code> ändert passenden Text in einer zuvor gelesenen Notiz. Bitte um eine Ergänzung unter der Überschrift und prüfe sie danach in Pinto Notes. Die frühere Version bleibt erhalten; KI-Änderungen lassen sich rückgängig machen.</p>
    <p>Öffne auf dem iPhone dieselbe Notiz und lies den neuen Eintrag. Fehlgeschlagene oder ausgelassene Prüfungen gehören ebenfalls hinein.</p>

    <h2 id="pruefen">Wenn die Verbindung Probleme macht</h2>
    <p>Gib <code>/mcp</code> in Gemini CLI ein, um Server und Werkzeuge zu prüfen. Im Terminal geht auch <code>gemini mcp list</code>. Für die direkte Verbindung meldest du dich mit <code>/mcp auth pinto-notes</code> an. Bei der Erweiterung nutze den Namen aus der Serverliste.</p>
    <p>Bestätige den Zugriff in Pinto Notes, bevor du eine Notiz anforderst. Allow erlaubt Lesen und Bearbeiten. Wenn mehrere Titel passen, lass dir die Pfade zeigen und wähle vor der Änderung den richtigen.</p>
    <p>Die <a href="/blog/mcp-server" hrefLang="en">Pinto-MCP-Anleitung</a> listet die Notizwerkzeuge auf. Für andere Programmieragenten gibt es die <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Anleitung für Claude Code und Codex</a>.</p>

    <h2 id="pinto">Konzept und Ergebnis zusammenhalten</h2>
    <p>Pinto Notes sieht auf iPhone und Mac aus wie Apple Notizen und funktioniert ähnlich. Du kannst selbst schreiben, eine bestätigte KI Änderungen vornehmen lassen und bei Bedarf zu einer früheren Version zurückkehren.</p>
    <p>Wenn deine Notizen in Apple Notizen liegen, kannst du sie <a href="/blog/move-from-apple-notes" hrefLang="en">auf dem Mac importieren</a>. Apple Notizen bleibt unverändert.</p>
  </LocalPostPage>;
}
