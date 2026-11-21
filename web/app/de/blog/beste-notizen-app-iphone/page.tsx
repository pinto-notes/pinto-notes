import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "beste-notizen-app-iphone");

// German version of /blog/best-note-taking-app-for-iphone, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „beste notizen app iphone“, „beste notiz app iphone“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/iphone/iphbe11247b5/ios, https://support.apple.com/de-de/guide/iphone/iphf177bb154/ios, https://support.apple.com/de-de/guide/icloud/mm6704cac5/icloud.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="beste-notizen-app-iphone"
      intro={<>Die beste App hängt davon ab, ob du kurze Listen, lange Texte, Teamarbeit oder KI in deinen Notizen willst. Für viele reicht die vorinstallierte App Notizen.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vergleich", label: "Auf einen Blick" },
        { href: "#pinto", label: "1. Pinto Notes: für ChatGPT und Claude" },
        { href: "#apple", label: "2. Apple Notizen: wenn du nichts Neues brauchst" },
        { href: "#bear", label: "3. Bear: fürs Schreiben" },
        { href: "#obsidian", label: "4. Obsidian: für eigene Dateien" },
      ]}>
        <p>Apple Notizen ist kostenlos und für die meisten ein guter Start. Pinto Notes passt, wenn ChatGPT oder Claude deine Notizen vom iPhone aus lesen und ändern sollen. Bear ist fürs Schreiben, Obsidian für eigene Dateien, Notion für Teams, Keep für schnelle Listen und Evernote für eingebaute KI.</p>
        <PostCta slug="de/beste-notizen-app-iphone" path="/de/blog/beste-notizen-app-iphone" position="answer" ui={ui.cta} title="ChatGPT und Claude mit deinen Notizen nutzen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="vergleich">Auf einen Blick</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Preis</th><th scope="col">Weitere Geräte</th><th scope="col">Stärke</th></tr></thead><tbody>
        <tr><td>Pinto Notes</td><td>Kostenlos</td><td>Mac</td><td>ChatGPT und Claude in Notizen</td></tr>
        <tr><td>Apple Notizen</td><td>Kostenlos</td><td>Mac, iCloud.com</td><td>Bereits installiert</td></tr>
        <tr><td>Bear</td><td>Kostenlos auf einem Gerät; Pro ab 2,99 $ monatlich</td><td>Mac</td><td>Markdown und Schreiben</td></tr>
        <tr><td>Obsidian</td><td>Kostenlos; Sync ab 4 $ monatlich</td><td>Mac, Windows, Linux, Android</td><td>Eigene Dateien</td></tr>
        <tr><td>Notion</td><td>Kostenlos; Plus laut US App Store 11,99 $ monatlich</td><td>Mac, Windows, Android, Web</td><td>Teams und Datenbanken</td></tr>
        <tr><td>Google Keep</td><td>Kostenlos</td><td>Android, Web</td><td>Gemeinsame Listen</td></tr>
        <tr><td>Evernote</td><td>Kostenlos bis 50 Notizen</td><td>Mac, Windows, Android, Web</td><td>Eingebaute KI</td></tr>
      </tbody></table></div>
      <p>Preise stehen wie in der englischen Vorlage vom 21. November 2026. Prüfe vor einem Kauf den Preis in deinem App Store.</p>
      <h2 id="pinto">1. Pinto Notes: für ChatGPT und Claude</h2>
      <p>Pinto Notes bietet Ordner, Checklisten, Tabellen und Anhänge wie Fotos oder PDFs. Du kannst offline schreiben und Notizen mit Passwort, Face ID oder Touch ID sperren.</p>
      <p>ChatGPT und Claude lesen und bearbeiten nach dem Verbinden dieselben Notizen. Änderungen werden markiert und sind rückgängig zu machen; frühere Versionen bleiben. Die Notizen werden vor dem Sync auf deinem Gerät verschlüsselt. Ein Import aus Apple Notizen, Obsidian, Evernote, Keep oder Bear geht am einfachsten auf dem Mac.</p>
      <p>Es gibt nur Apps für iPhone und Mac. iOS 26 ist nötig. Die App ist neu und hat noch nicht die lange Entwicklungsgeschichte von Apple Notizen oder Bear.</p>
      <PostFigure src="/blog/launch/iphone-chatgpt-changed-groceries" width={660} height={1434} alt="Eine Einkaufsliste in Pinto Notes auf dem iPhone mit von ChatGPT ergänzten Zeilen." caption="Ergänzungen von ChatGPT sind markiert und lassen sich zurücknehmen." />
      <h2 id="apple">2. Apple Notizen: wenn du nichts Neues brauchst</h2>
      <p>Notizen ist vorinstalliert und synchronisiert kostenlos über iCloud. Checklisten, Tabellen, Tags, intelligente Ordner, Scans, Zeichnungen, PDFs und mathematische Ergebnisse sind dabei. Du kannst Notizen anheften und mit anderen Apple Accounts teilen.</p>
      <p>Aufnahmen werden auf unterstützten Geräten transkribiert; Apple Intelligence kann sie zusammenfassen. Eine Notiz lässt sich mit Gerätecode oder eigenem Passwort sperren und mit Face ID oder Touch ID öffnen. Tags sowie Audio-, Video-, PDF- und Dateianhänge schließen die Sperre aus.</p>
      <p>ChatGPT oder Claude können vom iPhone aus nicht direkt in Apple Notizen arbeiten. Die vorhandenen Umwege laufen auf einem Mac.</p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} alt="Ordneransicht von Apple Notizen auf dem iPhone." caption="Ordner und Tags in Apple Notizen." />
      <h2 id="bear">3. Bear: fürs Schreiben</h2>
      <p>Bear verwendet Markdown und Tags statt Ordnern. Kostenlos bleiben Notizen auf einem Gerät. Bear Pro synchronisiert über iCloud und ergänzt Designs, Suche in PDFs und Bildern sowie gesperrte Notizen. Laut englischer Vorlage kostet es 2,99 $ monatlich oder 29,99 $ jährlich. Der Claude-Connector und MCP-Server laufen nur auf dem Mac.</p>
      <p>Bear läuft nur auf Apple-Geräten. Für den Sync zwischen iPhone und Mac zahlst du.</p>
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} alt="Bear auf iPhone und Mac mit Tags und einer formatierten Notiz." caption="Bear nutzt Tags und Markdown." />
      <h2 id="obsidian">4. Obsidian: für eigene Dateien</h2>
      <p>Obsidian speichert Markdown-Dateien in einem Ordner. Die iPhone-App ist kostenlos und hat Tabs, Befehlspalette und Plugins. Ein Vault kann über iCloud synchronisieren oder über Obsidian Sync für 4 $ monatlich bei jährlicher Zahlung beziehungsweise 5 $ monatlich. Sync bietet Verschlüsselung und Versionen.</p>
      <p>Du musst dein System selbst einrichten. <a href="/de/blog/apple-notizen-vs-obsidian">Apple Notizen vs Obsidian</a> zeigt die Unterschiede.</p>
      <h2 id="notion">5. Notion: für Teams</h2>
      <p>Notion bietet Seiten, Datenbanken und Wikis auf iPhone, Android, Mac, Windows und im Web. Seiten lassen sich in der App offline bearbeiten. Notion AI arbeitet innerhalb der App, und über MCP können Claude, ChatGPT und Cursor auf Seiten zugreifen. Laut US App Store kostet Plus 11,99 $ monatlich oder 119,99 $ jährlich. Für eine schnelle Notiz ist die App schwerer als nötig.</p>
      <h2 id="keep">6. Google Keep: für schnelle Listen</h2>
      <p>Keep ist kostenlos. Du ordnest Karten mit bis zu 50 Labels, Farben und Pins. Erinnerungen, Sprachnotizen und gemeinsame Listen sind dabei. Es läuft auf iPhone, Android und keep.google.com. Ordner fehlen; im App-Store-Eintrag der englischen Vorlage standen keine KI-Funktionen. <a href="/de/blog/apple-notizen-vs-google-keep">Keep im Vergleich</a> hilft bei der Wahl.</p>
      <h2 id="evernote">7. Evernote: viel KI in der App</h2>
      <p>Evernote bietet einen KI-Assistenten zum Suchen und Ordnen, Transkription, KI-Bearbeitung und eine Verbindung zu externen KI-Apps. Der kostenlose Plan ist auf 50 Notizen in einem Notizbuch auf einem Gerät begrenzt. Die englische Vorlage nennt keinen Preis für die Bezahlpläne.</p>
      <p>Bei Google Keep können Erinnerungen zu einer Zeit oder an einem Ort erscheinen. Eine Sprachnotiz wird als Text erfasst, und gemeinsame Listen werden laufend aktualisiert. Bei Notion kann eine externe KI über MCP Seiten bearbeiten; Notion selbst hält die Notizen auf seinen Servern. Bei Evernote gehören KI-Suche, Transkription und KI-Bearbeitung zum Angebot, der kostenlose Plan bleibt aber klein.</p>
      <h2 id="wahl">Welche passt zu dir?</h2>
      <p>ChatGPT oder Claude im Alltag: Pinto Notes. Kostenlos und vertraut: Apple Notizen. Viel schreiben: Bear. Eigene Dateien: Obsidian. Im Team arbeiten: Notion. Listen mit Android teilen: Google Keep. KI direkt in der App: Evernote oder Notion. <a href="/de/blog/apple-notizen-alternativen">Alternativen zu Apple Notizen</a> vergleicht die Plattformen ausführlicher.</p>
    </LocalPostPage>
  );
}
