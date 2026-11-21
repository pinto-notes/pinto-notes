import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "obsidian-alternative-mac");

// German version of /blog/obsidian-alternative-for-mac, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "obsidian alternative mac" returned itself and "obsidian alternative macos".
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/not201900c07/mac
// confirms "Ablage" > "Markdown importieren" and "Ordnerstruktur beim Import beibehalten".
// Other apps' facts and Pinto claims follow the English post.

const ui = UI.de;
const CHECK = `Vor dem Wechsel von Obsidian
- Sichere den ganzen Vault, auch Anhänge und den versteckten Einstellungsordner.
- Öffne eine Notiz mit Bild und prüfe das importierte Bild.
- Folge einem Link zu einer Notiz in einem Unterordner.
- Prüfe eingebettete Notizen und Inhalte aus Plugins.
- Suche nach einer Notiz, deren Titel du kennst.
- Öffne importierte Notizen auf deinem iPhone, falls du eines nutzt.
- Öffne eine exportierte Markdown-Datei in einem anderen Editor.`;

const faq = [
  { q: "Welche Mac-App importiert einen Obsidian-Vault?", a: ["Pinto Notes importiert auf dem Mac Unterordner, Bilder und Links zwischen Notizen. Bear bietet einen Markdown-Ordnerimport mit Anhängen. Joplin importiert ein Markdown-Verzeichnis in Notizbücher. Apple Notizen kann Markdown-Dateien importieren. Prüfe in jedem Fall Links und Anhänge."] },
  { q: "Kann Pinto meinen Vault im Finder direkt bearbeiten?", a: ["Nein. Pinto importiert eine Kopie in seine eigene Sammlung. Der ursprüngliche Vault bleibt bestehen und wird nicht synchronisiert. Du kannst Pintos Sammlung getrennt als ZIP mit Markdown-Dateien exportieren."] },
  { q: "Was passiert mit eingebetteten Obsidian-Notizen?", a: ["Pinto macht daraus Links zu den Notizen. Bilder und andere verlinkte Dateien werden als Anhänge importiert. Der versteckte Obsidian-Einstellungsordner wird übersprungen; Plugins ziehen nicht mit um."] },
  { q: "Welche Alternative läuft auf Mac und Android?", a: ["Joplin läuft auf beiden, unterstützt Markdown und bietet mehrere Sync-Dienste. Pinto Notes läuft nur auf iPhone und Mac. Wenn du denselben lokalen Markdown-Ordner weiterbearbeiten willst, kannst du auch bei Obsidian bleiben."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="obsidian-alternative-mac"
    intro={<>Pinto Notes ist eine Obsidian-Alternative für Mac, wenn du die Bedienung von Apple Notizen und einen Import für deinen Vault suchst. Bear passt für Markdown und Tags, Apple Notizen für den Alltag und Joplin für offene Notizbücher.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#wahl", label: "Alternative wählen" },
      { href: "#bleiben", label: "Bei Obsidian bleiben" },
      { href: "#umzug", label: "Vault importieren" },
      { href: "#pruefen", label: "Import prüfen" },
    ]}>
      <p>Pinto Notes importiert einen Obsidian-Vault mit Unterordnern, Bildern und Links zwischen Notizen. Bleib bei Obsidian, wenn andere Programme denselben Finder-Ordner bearbeiten sollen oder du Graph, Canvas und Plugins brauchst.</p>
      <PostCta slug="de/obsidian-alternative-mac" path="/de/blog/obsidian-alternative-mac" position="answer" ui={ui.cta} title="Nimm deinen Vault zu Pinto Notes mit">
        <p>Importiere ihn auf dem Mac und lies die Notizen danach auch auf dem iPhone. Verbundenes ChatGPT oder Claude kann sie lesen und bearbeiten. Pinto Notes ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640}
      alt="Pinto Notes findet auf dem Mac den Obsidian-Vault Second brain mit 27 Notizen und bestätigt den Import."
      caption="Ein Obsidian-Vault in Pinto Notes. Das Original bleibt an seinem Ort. Aufnahme: Pinto Notes." />}
    faq={faq}>
    <h2 id="wahl">Wähle nach dem, was du ändern willst</h2>
    <p>Vielleicht genügt dir ein anderer Editor. Wenn du auch die Organisation ändern möchtest, probiere zuerst einen kleinen Ordner aus.</p>
    <ul>
      <li><strong>Pinto Notes:</strong> Bedienung wie Apple Notizen, Obsidian-Import und Zugriff für verbundenes ChatGPT oder Claude. Nur für iPhone und Mac.</li>
      <li><strong>Apple Notizen:</strong> Ordner, Checklisten und Suche für alltägliche Notizen.</li>
      <li><strong>Bear:</strong> Markdown, Tags und Tabellen. iCloud-Sync erfordert Bear Pro.</li>
      <li><strong>Joplin:</strong> offene App mit Notizbüchern und Offline-Markdown. Auch für Windows, Linux und Android.</li>
    </ul>
    <p>Apple Notizen importiert Markdown-Dateien. Wähle auf dem Mac „Ablage“ &gt; „Markdown importieren“ und dann die Dateien. Laut <a href="https://support.apple.com/de-de/guide/notes/not201900c07/mac">Apple-Anleitung</a> kannst du beim Import eines Ordners die „Ordnerstruktur beim Import beibehalten“, bei Bedarf unter „Optionen“. Prüfe Bilder und <code>[[Links]]</code> danach. Der Import verspricht keinen identischen Obsidian-Vault. Mehr dazu steht in <a href="/de/blog/apple-notizen-vs-obsidian">Apple Notizen oder Obsidian</a>.</p>
    <p><a href="https://bear.app/faq/import-your-notes/">Bear</a> bietet für Markdown mit Anhängen File, Import From, Markdown Folder. Es liest referenzierte Anhänge im Ordner und seinen Unterordnern. <a href="https://joplinapp.org/help/apps/import_export/">Joplin</a> importiert Markdown-Verzeichnisse als Notizbücher und Unterordner als untergeordnete Notizbücher. Dort wählst du auch einen <a href="https://joplinapp.org/help/apps/sync/">Sync-Dienst</a> wie Dropbox oder Nextcloud.</p>

    <h2 id="bleiben">Wann Obsidian besser passt</h2>
    <p>Ein <a href="https://obsidian.md/help/data-storage">Obsidian-Vault</a> ist ein lokaler Ordner mit Markdown-Dateien. Andere Editoren können sie ändern; Obsidian übernimmt die Änderungen. Ein Import in eine andere Sammlung ändert diesen Ablauf.</p>
    <p>Obsidian bietet außerdem Graph, Canvas und Community-Plugins. Von Plugins erzeugte Ansichten bestehen nicht allein aus dem Markdown-Text. Behalte Obsidian, wenn du diese Funktionen brauchst, oder sichere wichtige Ergebnisse als gewöhnlichen Notiztext. Die <a href="https://obsidian.md/">Obsidian-Seite</a> beschreibt sie.</p>
    <p>Geht es dir nur um KI-Zugriff, lies zuerst die <a href="/blog/obsidian-mcp" hrefLang="en">Obsidian-MCP-Anleitung</a>. Vielleicht kannst du deinen Vault behalten.</p>

    <h2 id="umzug">Den Vault in Pinto Notes importieren</h2>
    <p>Pinto Notes sieht auf iPhone und Mac aus wie Apple Notizen und funktioniert ähnlich. Es behält jede frühere Version einer Notiz. Der Import erstellt eine eigene Sammlung; spätere Änderungen in Pinto und Obsidian bleiben getrennt. Eine App für Windows oder Android und eine Web-App gibt es nicht.</p>
    <ol>
      <li>Sichere den ganzen Vault samt Bildern und weiteren Anhängen.</li>
      <li>Öffne auf dem Mac in Pinto Notes das Menü File und wähle Import from Obsidian.</li>
      <li>Bestätige den gefundenen Vault oder wähle einen anderen Ordner.</li>
      <li>Importiere ihn. Öffne einige Notizen und folge ihren Links.</li>
    </ol>
    <p>Unterordner, Bilder und Links zwischen Notizen kommen mit. Der ursprüngliche Vault bleibt bestehen. Die <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> beschreibt die Wege. Eingebettete Notizen werden zu Links. Der versteckte Ordner <code>.obsidian</code> wird übersprungen. Plugins und Canvas werden nicht übernommen.</p>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> können sie importierte Notizen lesen und bearbeiten. Lass eine bestimmte Projektnotiz lesen und unter einer Überschrift zusammenfassen. Prüfe die Änderung; die frühere Version bleibt erhalten.</p>
    <p>Du kannst Pintos Sammlung als ZIP mit Markdown-Dateien in Ordnern exportieren. Anhänge und Links werden für die exportierten Kopien angepasst. Öffne gesperrte Notizen zuerst mit Passwort, Face ID oder Touch ID und prüfe den Exportbericht auf Dateien, die nicht geladen wurden. Der Export synchronisiert nichts zurück in deinen Vault.</p>

    <h2 id="pruefen">Den Import prüfen</h2>
    <p>Probiere einen Ordner mit zwei verlinkten Notizen und einem Bild. Nutzt du ein Plugin, nimm eine davon abhängige Notiz dazu. Vergleiche Original und importierte Kopie.</p>
    <Keep title="Checkliste für den Vault-Umzug" text={CHECK} />
    <p>Behalte Vault und Sicherung, bis du die importierten Notizen und einen Export geprüft hast. Entscheide dann, in welcher App du künftig schreibst.</p>
  </LocalPostPage>;
}
