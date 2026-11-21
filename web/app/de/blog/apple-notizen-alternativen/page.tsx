import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-alternativen");

// German version of /blog/apple-notes-alternatives, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „alternative zu apple notizen“; „apple notizen alternativen“ ohne Vorschläge.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/105119, https://support.apple.com/de-de/102223.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-alternativen"
      intro={<>Wenn du Apple Notizen verlässt, kann der Grund ein anderes Gerät, mehr Ordnung oder KI in deinen Notizen sein. Diese Apps lösen verschiedene Probleme.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vergleich", label: "Auf einen Blick" },
        { href: "#obsidian", label: "Obsidian: Notizen als Dateien" },
        { href: "#keep", label: "Google Keep: kurze Notizen" },
        { href: "#notion", label: "Notion: ein Arbeitsbereich für Teams" },
        { href: "#evernote", label: "Evernote: Web-Inhalte sammeln" },
      ]}>
        <p>Für Windows oder Android kommen Obsidian, Google Keep, Notion, Evernote und Joplin infrage. Auf iPhone und Mac passen Bear für längeres Schreiben und Pinto Notes für Notizen mit ChatGPT oder Claude.</p>
        <PostCta slug="de/apple-notizen-alternativen" path="/de/blog/apple-notizen-alternativen" position="answer" ui={ui.cta} title="Auf iPhone und Mac bleiben?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="vergleich">Auf einen Blick</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Geräte</th><th scope="col">Kostenlos?</th><th scope="col">Gut für</th></tr></thead><tbody>
        <tr><td>Obsidian</td><td>Mac, Windows, Linux, iPhone, Android</td><td>Ja</td><td>Eigene Markdown-Dateien</td></tr>
        <tr><td>Google Keep</td><td>Android, iPhone, Web</td><td>Ja</td><td>Kurze Listen und Erinnerungen</td></tr>
        <tr><td>Notion</td><td>Mac, Windows, iPhone, Android, Web</td><td>Ja, mit Grenzen</td><td>Teams und Datenbanken</td></tr>
        <tr><td>Evernote</td><td>Mac, Windows, iPhone, Android, Web</td><td>Bis 50 Notizen</td><td>Web-Archiv und KI</td></tr>
        <tr><td>Bear</td><td>Mac, iPhone</td><td>Auf einem Gerät</td><td>Schreiben mit Markdown</td></tr>
        <tr><td>Pinto Notes</td><td>Mac, iPhone</td><td>Ja</td><td>Apple-Gefühl mit ChatGPT oder Claude</td></tr>
        <tr><td>Joplin</td><td>Windows, Mac, Linux, Android, iPhone</td><td>Ja</td><td>Open Source</td></tr>
      </tbody></table></div>
      <h2 id="obsidian">Obsidian: Notizen als Dateien</h2>
      <p>Obsidian speichert Markdown-Dateien in einem Ordner. Jeder Texteditor kann sie lesen. Links, Rückverweise, Graph, Plugins und Designs helfen beim Aufbau einer Wissenssammlung. Es läuft offline auf vielen Plattformen.</p>
      <p>Die App ist kostenlos. Obsidian Sync kostet laut englischer Vorlage 4 $ monatlich bei jährlicher Zahlung oder 5 $ monatlich und bietet Verschlüsselung und Versionen. Du kannst auch einen eigenen Sync-Dienst einrichten. Das braucht etwas Arbeit.</p>
      <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} alt="Obsidian auf dem Mac mit Ordnern und einer Einkaufsliste." caption="Eine Markdown-Notiz in Obsidian." />
      <h2 id="keep">Google Keep: kurze Notizen</h2>
      <p>Keep läuft auf Android, iPhone und im Browser. Karten lassen sich mit Labels, Farben und Pins ordnen, teilen und mit Erinnerungen versehen. Auf dem Computer sind frühere Textversionen abrufbar. Es gibt keine Ordner und höchstens 50 Labels. <a href="/de/blog/apple-notizen-vs-google-keep">Apple Notizen vs Google Keep</a> vergleicht die beiden genauer.</p>
      <h2 id="notion">Notion: ein Arbeitsbereich für Teams</h2>
      <p>Notion verbindet Seiten, Datenbanken und Wikis. Es läuft auf Mac, Windows, iPhone, Android und im Browser. Der kostenlose Plan hat Grenzen und sieben Tage Seitenverlauf. Notion AI gehört zu Business und Enterprise; Free und Plus haben einen begrenzten Test. Für eine schnelle Notiz ist der Arbeitsbereich aufwendig. <a href="/de/blog/apple-notizen-vs-notion">Notion im Vergleich</a> zeigt die Unterschiede.</p>
      <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} alt="Eine Team-Seite in Notion." caption="Notion eignet sich für gemeinsame Projekte." />
      <h2 id="evernote">Evernote: Web-Inhalte sammeln</h2>
      <p>Evernote bietet Apps für Mac, Windows, iPhone und Android, eine Web-App und einen Web Clipper. Der kostenlose Plan erlaubt 50 Notizen in einem Notizbuch auf einem Gerät. Für eine große Sammlung brauchst du einen bezahlten Plan. <a href="/de/blog/evernote-in-apple-notizen-importieren">Von Evernote zu Apple Notizen</a> erklärt den Export.</p>
      <h2 id="bear">Bear: Schreiben auf Apple-Geräten</h2>
      <p>Bear ist eine Markdown-App für Mac und iPhone. Kostenlos kannst du auf einem Gerät schreiben. Bear Pro bringt iCloud-Sync, Designs und Suche in PDFs und Bildern. In der englischen Vorlage kostet Pro 2,99 $ monatlich oder 29,99 $ jährlich nach sieben Tagen Test. Windows und Android fehlen.</p>
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} alt="Bear auf Mac und iPhone mit verschachtelten Tags und einer Notiz." caption="Bear ordnet Notizen mit Tags." />
      <h2 id="pinto">Pinto Notes: Apple Notizen mit deiner KI</h2>
      <p>Pinto Notes sieht Apple Notizen ähnlich und läuft auf iPhone und Mac. Nach dem Verbinden können ChatGPT, Claude, Claude Code und Codex deine Notizen lesen und ändern. Die Notizen sind Markdown-Dateien und verschlüsselt; frühere Versionen bleiben erhalten.</p>
      <p>Windows, Android und eine Web-App fehlen. Wenn du deswegen Apple Notizen verlässt, wähle eine andere App aus dieser Liste.</p>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes auf dem Mac mit einer von ChatGPT geänderten Reise-Notiz." caption="ChatGPT hat eine Zeile ergänzt." />
      <h2 id="andere">Windows, Android und Open Source</h2>
      <p>Auf Windows kannst du iCloud-Notizen auch bei iCloud.com öffnen. Für tägliche Arbeit auf mehreren Plattformen ist eine passende App bequemer. Obsidian gibt dir Dateien, Keep kurze Listen, Notion Teamarbeit und Evernote ein Web-Archiv.</p>
      <p>Joplin ist kostenlos und Open Source. Es läuft auf Windows, Mac, Linux, Android und iPhone und hat auch eine Terminal-App. Markdown-Notizen synchronisieren über Nextcloud, Dropbox, OneDrive oder Joplin Cloud und können verschlüsselt werden. Evernote-Exporte lassen sich importieren.</p>
      <h2 id="umzug">Apple Notizen mitnehmen</h2>
      <p>Obsidian importiert Apple Notizen auf dem Mac. Notion nimmt Markdown-Dateien in einer ZIP-Datei. Google Keep hat keinen Import. Die <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">Anleitung für diese drei Wege</a> zeigt die Schritte.</p>
      <p>Pinto Notes importiert auf dem Mac Apple Notizen, Obsidian, Evernote, Google Keep und Bear. Außerdem gehen Ordner oder ZIP-Dateien mit Markdown oder Text. Die Original-App bleibt bestehen. Bei Apple Notizen kommen Ordner und Bilder mit; Checklisten und Pins brauchen vollen Festplattenzugriff. Ein Obsidian-Vault behält Unterordner und Links. Evernote-Notizbücher werden Ordner, Keep-Labels ebenfalls. Bear exportierst du als Markdown mit Anhängen.</p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} alt="Import-Menü von Pinto Notes auf dem Mac." caption="Pinto Notes kann mehrere Notizformate importieren." />
    </LocalPostPage>
  );
}
