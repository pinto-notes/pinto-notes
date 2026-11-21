import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-vs-notion");

// German version of /blog/apple-notes-vs-notion, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen vs notion“, „notion vs apple notizen“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/102223, https://support.apple.com/de-de/102484, https://support.apple.com/de-de/105119, https://support.apple.com/de-de/guide/notes/not201900c07/mac.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-vs-notion"
      intro={<>Apple Notizen ist die Notiz-App auf deinem iPhone und Mac. Notion verbindet Seiten, Datenbanken und Zusammenarbeit. Beide erfüllen verschiedene Aufgaben.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vergleich", label: "Auf einen Blick" },
        { href: "#apple", label: "Wann Apple Notizen passt" },
        { href: "#notion", label: "Wann Notion passt" },
        { href: "#erinnerungen", label: "Notion, Notizen und Erinnerungen" },
        { href: "#wechsel", label: "So wechselst du" },
      ]}>
        <p>Für private Notizen, Listen und Checklisten auf Apple-Geräten nimm Apple Notizen. Für Datenbanken, Projektboards, ein Team-Wiki oder Windows und Android eignet sich Notion. Dafür musst du mehr einrichten.</p>
        <PostCta slug="de/apple-notizen-vs-notion" path="/de/blog/apple-notizen-vs-notion" position="answer" ui={ui.cta} title="Apple Notizen mit deiner KI?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
      faq={[
        { q: "Ist Notion privat kostenlos?", a: ["Ja. Der Free-Plan richtet sich an Einzelpersonen, hat aber eine Grenze von 5 MB pro Datei und sieben Tage Seitenverlauf."] },
        { q: "Kann Notion Erinnerungen ersetzen?", a: ["Teilweise. Notion erinnert an Uhrzeiten, aber nicht wiederkehrend oder abhängig von deinem Standort."] },
      ]}
    >
      <h2 id="vergleich">Auf einen Blick</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">Punkt</th><th scope="col">Apple Notizen</th><th scope="col">Notion</th></tr></thead><tbody>
        <tr><td>Preis</td><td>Kostenlos</td><td>Kostenlos; Plus 10 $ pro Mitglied und Monat bei jährlicher Zahlung</td></tr>
        <tr><td>Geräte</td><td>iPhone, Mac; iCloud.com unter Windows</td><td>Mac, Windows, iPhone, Android, Web</td></tr>
        <tr><td>Ordnung</td><td>Ordner, Tags, intelligente Ordner</td><td>Seiten und Datenbanken</td></tr>
        <tr><td>Tabellen</td><td>Einfach, ohne Sortierung oder Summen</td><td>Ansichten, Filter, Formeln</td></tr>
        <tr><td>Vorlagen</td><td>Notiz duplizieren</td><td>Galerie mit Vorlagen</td></tr>
        <tr><td>Versionen</td><td>Keine</td><td>7 Tage kostenlos, 30 mit Plus, 90 mit Business</td></tr>
        <tr><td>KI</td><td>Apple Intelligence auf passenden Geräten</td><td>Notion AI mit Business; begrenzter Test bei Free und Plus</td></tr>
      </tbody></table></div>
      <p>Die US-Dollar-Preise stammen aus der englischen Vorlage vom 21. November 2026.</p>
      <h2 id="apple">Wann Apple Notizen passt</h2>
      <p>Du öffnest die App und schreibst. Checklisten können Erledigtes nach unten schieben. Tags und intelligente Ordner sammeln Notizen. Die Suche, mathematische Ergebnisse, angeheftete Notizen und gesperrte Notizen gehören dazu. Sperren geht mit Passwort, Face ID oder Touch ID.</p>
      <p>Auf Windows öffnest du iCloud.com im Browser. Es gibt keine echten Vorlagen und keine Versionsgeschichte. Eine Notiz kannst du auf dem Mac über „Ablage“ duplizieren. Für geteilte Notizen brauchen alle einen Apple Account.</p>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Eine Einkaufsliste in Apple Notizen auf dem Mac." caption="Apple Notizen mit Ordnern und Checkliste." />
      <h2 id="notion">Wann Notion passt</h2>
      <p>Eine Datenbank enthält Seiten mit Eigenschaften wie Datum oder Status. Du zeigst sie als Tabelle, Liste, Board, Kalender oder Galerie und kannst filtern, sortieren und gruppieren. Das hilft bei Projekten, Leselisten und Team-Wikis.</p>
      <p>Notion läuft auch auf Windows und Android. Du kannst Seiten pro Gerät offline verfügbar machen. Der kostenlose Plan erlaubt Dateien bis 5 MB und sieben Tage Seitenverlauf; bei zwei oder mehr Mitgliedern gilt eine Blockgrenze.</p>
      <p>Notion AI schreibt, fasst zusammen und beantwortet Fragen. Business und Enterprise enthalten es; Free und Plus bieten eine begrenzte Probe. Über Notion MCP können Claude, ChatGPT und Cursor Seiten lesen und ändern, auf die du selbst Zugriff hast.</p>
      <p>Notion exportiert PDF, HTML, Markdown und CSV. Für eine schnelle Einkaufsliste ist die Einrichtung oft zu viel.</p>
      <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} alt="Eine Team-Seite mit Agenda und Aufgaben in Notion." caption="Eine Team-Besprechung in Notion." />
      <p>Notion Plus kostet laut US-Daten der englischen Vorlage 120 $ im Jahr oder 12 $ monatlich pro Mitglied. Business kostet 240 $ im Jahr oder 24 $ monatlich. Auf Plus bleiben frühere Seiten 30 Tage, auf Business 90 Tage erhalten. Eine Seite muss auf jedem Gerät einzeln als offline verfügbar markiert werden. Beim Export kannst du PDF, HTML, Markdown und CSV wählen.</p>
      <h2 id="erinnerungen">Notion, Notizen und Erinnerungen</h2>
      <p>Auf Apple-Geräten übernimmt die App Erinnerungen Aufgaben mit Termin, Uhrzeit oder Ort. Siri kann sie anlegen, Listen lassen sich teilen und geplante Erinnerungen erscheinen seit iOS 18 auch im Kalender.</p>
      <p>In Notion setzt du @remind in einer Seite oder ein Datum in einer Datenbank. Benachrichtigungen kommen als Push oder E-Mail. Wiederkehrende Erinnerungen gibt es laut Notion noch nicht. Für ortsbezogene Hinweise ist Apples Erinnerungen-App besser.</p>
      <h2 id="wechsel">So wechselst du</h2>
      <p>Notion hat keinen direkten Import für Apple Notizen. Exportiere auf dem Mac Markdown-Dateien, packe sie in eine ZIP-Datei und importiere sie in Notion. Die <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">Wechselanleitung</a> zeigt die Grenzen.</p>
      <p>Zurück exportierst du Notion-Seiten als Markdown. In Apple Notizen wählst du „Ablage“ &gt; „Markdown importieren“. CSV-Datenbanken gehören nicht zu Apples Importformaten.</p>
      <h2 id="entscheidung">Welche App solltest du nehmen?</h2>
      <p>Apple Notizen für schnelle private Notizen. Notion für Projekte und Teamarbeit. Erinnerungen für Aufgaben mit Termin oder Ort. Wenn dir Apple Notizen gefällt und du ChatGPT oder Claude in deinen Notizen nutzen willst, probier Pinto Notes. Es speichert frühere Versionen und importiert Apple Notizen auf dem Mac. Für Datenbanken mit Board- und Kalenderansicht bleibt Notion stärker.</p>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes auf dem Mac mit einer von ChatGPT bearbeiteten Notiz." caption="ChatGPT ergänzt eine Notiz. Die Änderung lässt sich zurücknehmen." />
    </LocalPostPage>
  );
}
