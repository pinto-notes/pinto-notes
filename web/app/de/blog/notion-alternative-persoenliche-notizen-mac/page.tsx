import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notion-alternative-persoenliche-notizen-mac");

// German version of /blog/notion-alternative-for-personal-notes-on-mac, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "notion alternative mac" returned itself; "notion alternative" returned
// "notion alternative kostenlos". "notion alternative private notizen" returned none.
// No Apple menu names occur in this post. Apple Notes feature terms follow the German comparison
// at /de/blog/apple-notizen-vs-notion; Notion and Pinto menu names follow the English source.

const ui = UI.de;
const faq = [
  { q: "Eignet sich Pinto Notes als persönliches Notizbuch statt Notion?", a: ["Ja, wenn du Textnotizen auf Mac und iPhone schreiben willst. Pinto bietet Ordner, Checklisten und Tabellen. Verbundenes ChatGPT oder Claude kann Notizen lesen und bearbeiten. Probiere erst einen kleinen Markdown-Export. Arbeit mit Datenbanken bleibt vorerst in Notion."] },
  { q: "Gibt es in Pinto einen direkten Notion-Import?", a: ["Nein. Exportiere zuerst die gewünschten Seiten aus Notion. Nutze dann auf dem Mac File, Import Markdown or Text für einen Ordner oder ein ZIP mit Markdown- oder Textdateien. Jeder Ordner wird wieder zu einem Ordner."] },
  { q: "Werden Notions Datenbankansichten übernommen?", a: ["Rechne nicht damit. Notion exportiert ganze Datenbankseiten als CSV, normale Seiten als Markdown und laut eigener Anleitung nicht alle Ansichten auf einmal. Prüfe Datenbankarbeit getrennt von persönlichen Textnotizen."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notion-alternative-persoenliche-notizen-mac"
    intro={<>Apple Notizen ist eine praktische Notion-Alternative für persönliche Notizen auf dem Mac. Pinto Notes bietet eine ähnliche Bedienung und lässt verbundenes ChatGPT oder Claude Notizen lesen und bearbeiten.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#auswahl", label: "Was umziehen soll" },
      { href: "#apple", label: "Apple Notizen" },
      { href: "#pinto", label: "Pinto Notes" },
      { href: "#export", label: "Notion-Export" },
      { href: "#probe", label: "Klein anfangen" },
    ]}>
      <p>Für ein persönliches Notizbuch bieten Apple Notizen Checklisten, Tabellen und Suche. Pinto Notes ergänzt verbundenen KI-Zugriff und behält jede frühere Version einer Notiz. Wenn deine Arbeit von Datenbank-Eigenschaften und Ansichten abhängt, behalte Notion dafür.</p>
      <PostCta slug="de/notion-alternative-persoenliche-notizen-mac" path="/de/blog/notion-alternative-persoenliche-notizen-mac" position="answer" ui={ui.cta} title="Probiere deine persönlichen Notizen in Pinto">
        <p>Importiere zuerst einen kleinen Ordner mit Markdown-Notizen. Danach können ChatGPT oder Claude sie lesen und bearbeiten. Pinto Notes ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    faq={faq}>
    <h2 id="auswahl">Trenne Notizen von Datenbankarbeit</h2>
    <p>Beginne mit Seiten, die du zum Schreiben oder Lesen öffnest: Tagebuch, Entwurf oder Packliste. Solche Inhalte passen in einen Notizordner. Du musst nicht gleich deinen ganzen Arbeitsbereich umziehen.</p>
    <p>Notion-Datenbanken enthalten mehr als Text. Jeder Eintrag ist eine Seite mit Eigenschaften. Du kannst Einträge filtern, sortieren und in verschiedenen Ansichten zeigen. Eine Leseliste nach Status oder ein Kalender kann auch allein nützlich sein. Die <a href="https://www.notion.com/help/intro-to-databases">Notion-Anleitung</a> erklärt das.</p>

    <h2 id="apple">Apple Notizen für ein selbst geordnetes Notizbuch</h2>
    <p>Apple Notizen bietet Checklisten und Tabellen. Du kannst häufig genutzte Notizen anpinnen, Tags hinzufügen und intelligente Ordner nach Regeln erstellen. Die Suche findet Wörter im Notiztext.</p>
    <p>Schreibe erst einige neue Notizen, bevor du alte verschiebst. Soll eine Tabelle eine Notion-Datenbank ersetzen, prüfe die Grenzen: Tabellen in Apple Notizen sortieren oder addieren ihren Inhalt nicht. <a href="/de/blog/apple-notizen-vs-notion">Apple Notizen oder Notion</a> vergleicht die Apps ausführlicher.</p>

    <h2 id="pinto">Pinto Notes mit KI-Zugriff</h2>
    <p>Pinto Notes sieht auf iPhone und Mac aus wie Apple Notizen und funktioniert ähnlich. Es hat Ordner, Checklisten und Tabellen. Deine Notizen sind Markdown-Dateien, die als formatierter Text erscheinen. Am Zeilenanfang öffnet / ein Menü für Überschriften, Checklisten und Tabellen.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> können sie deine Notizen lesen und bearbeiten. Lass etwa eine grobe Packliste in eine Checkliste umwandeln und bearbeite sie danach selbst weiter. Jede frühere Version bleibt erhalten.</p>
    <p>Auch <a href="https://www.notion.com/help/notion-mcp">Notion bietet eine MCP-Verbindung</a>, über die ChatGPT und Claude Seiten lesen und schreiben können. Wenn du allein deshalb wechseln willst, probiere sie zuerst. Pinto passt, wenn du auch den Editor für deine persönlichen Notizen möchtest.</p>
    <p>Pinto Notes kannst du kostenlos für Mac laden; es läuft auch auf iPhone. Eine App für Windows oder Android und eine Web-App gibt es nicht.</p>

    <h2 id="export">Persönliche Seiten als Markdown exportieren</h2>
    <p>Öffne auf dem Mac eine Notion-Seite, die du ausprobieren möchtest. Laut <a href="https://www.notion.com/help/export-your-content">Notions Exportanleitung</a> gehst du so vor:</p>
    <ol>
      <li>Öffne das Menü mit den drei Punkten und wähle Export.</li>
      <li>Wähle Markdown &amp; CSV.</li>
      <li>Aktiviere Include subpages, wenn Unterseiten mitkommen sollen.</li>
      <li>Starte den Export und behalte das heruntergeladene ZIP.</li>
    </ol>
    <p>Notion exportiert gewöhnliche Seiten als Markdown, ganze Datenbankseiten als CSV und Callout-Blöcke als HTML. Öffne den Download und prüfe seinen Inhalt vor dem Import.</p>
    <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
      alt="Das Menü File in Pinto Notes auf dem Mac mit Import Markdown or Text."
      caption="Für exportierte Dateien wählst du Import Markdown or Text. Aufnahme: Pinto Notes." />
    <p>Wähle in Pinto Notes auf dem Mac File, Import Markdown or Text. Du kannst einen Ordner oder ein ZIP mit Markdown- oder Textdateien importieren. Jeder Ordner wird wieder zu einem Ordner. Die <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> beschreibt den Weg. Einen eigenen Notion-Eintrag gibt es in der Importliste nicht.</p>

    <h2 id="probe">Erst wenige Seiten ausprobieren</h2>
    <p>Wähle typische Notizen, auch eine mit Bild oder Anhang, falls du solche nutzt. Vergleiche nach dem Import jede Kopie mit dem Original. Prüfe wichtige Notion-Blöcke.</p>
    <ul>
      <li>Sind alle erwarteten Notizen und Ordner da?</li>
      <li>Öffnen Bilder und Anhänge? Funktionieren Links zwischen Seiten?</li>
      <li>Stimmen Checklisten, Tabellen und der Text darunter?</li>
      <li>Kannst du eine neue Notiz schreiben und eine alte über die Suche finden?</li>
    </ul>
    <p>Schreibe die nächsten persönlichen Notizen in der neuen App. Behalte Notion-Seiten und Export, während du entscheidest. Datenbanken können in Notion bleiben.</p>

    <h2 id="grenzen">Wann ein Wechsel nicht hilft</h2>
    <p>Geht es nur um Arbeit ohne Internet, probiere zuerst Notions Offline-Option. Öffne in der Desktop- oder Mobil-App das Menü mit den drei Punkten und aktiviere Available offline. Laut <a href="https://www.notion.com/help/guides/working-offline-in-notion-everything-you-need-to-know">Notion</a> gilt das pro Seite und Gerät.</p>
    <p>Wenn du Eigenschaften und Ansichten täglich brauchst, lass diese Arbeit in Notion. Verschiebe nur die Notizen, die du künftig in einem Editor wie Apple Notizen schreiben möchtest.</p>
  </LocalPostPage>;
}
