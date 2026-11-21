import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "simplenote-alternative-iphone-mac");

// German version of /blog/simplenote-alternative-for-iphone-and-mac, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "simplenote alternative" returned itself, "simplenote alternative reddit" and
// "simplenote alternative free". "simplenote alternative iphone" returned none.
// No Apple menu steps occur in this post. Simplenote menu names follow its English source.
// Pinto menu names stay in English because the app is in English.

const ui = UI.de;
const CHECK = `Wechsel von Simplenote prüfen

- Behalte das ursprüngliche ZIP als Sicherung.
- Öffne die exportierten Textdateien und prüfe eine lange Notiz.
- Importiere zuerst einen kleinen Ordner in Pinto Notes auf dem Mac.
- Vergleiche den ganzen Text und die Markdown-Formatierung.
- Prüfe, ob du frühere Tags neu ordnen musst.
- Öffne die importierten Notizen auf dem iPhone.
- Behalte Simplenote, bis du alles geprüft hast.`;

const faq = [
  { q: "Gibt es eine kostenlose Simplenote-Alternative für iPhone und Mac?", a: ["Pinto Notes ist eine kostenlose Möglichkeit für iPhone und Mac. Es sieht aus wie Apple Notizen, importiert auf dem Mac Ordner mit Text- oder Markdown-Dateien und lässt verbundenes ChatGPT oder Claude Notizen lesen und bearbeiten."] },
  { q: "Warum kann ich in der Mac-App-Store-Version von Simplenote nicht exportieren?", a: ["Laut Simplenote unterstützt diese Version keinen Export. Nutze in der Web-App Settings, Tools, Export Notes oder in der Electron-App File, Export Notes."] },
  { q: "Kommen meine Simplenote-Tags und alten Versionen mit?", a: ["Dieser Weg importiert Textdateien. Er verspricht weder dieselbe Tag-Ordnung noch frühere Versionen aus Simplenote. Behalte die Sicherung und prüfe die Notizen. Pinto behält die Versionen, die du dort erstellst."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="simplenote-alternative-iphone-mac"
    intro={<>Pinto Notes ist eine Simplenote-Alternative für iPhone und Mac, wenn du die Bedienung von Apple Notizen und KI-Zugriff möchtest. Exportiere deine Simplenote-Notizen und importiere die Textdateien auf dem Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#wahl", label: "Wechseln oder bleiben?" },
      { href: "#export", label: "Notizen exportieren" },
      { href: "#import", label: "In Pinto importieren" },
      { href: "#pruefen", label: "Umzug prüfen" },
    ]}>
      <p>Pinto Notes passt, wenn du iPhone und Mac nutzt und verbundenes ChatGPT oder Claude deine Notizen lesen und bearbeiten soll. Simplenote ist weiterhin gut für Textnotizen auf Windows, Linux, Android und im Web. Der hier beschriebene Textimport übernimmt keine alte Versionsgeschichte.</p>
      <PostCta slug="de/simplenote-alternative-iphone-mac" path="/de/blog/simplenote-alternative-iphone-mac" position="answer" ui={ui.cta} title="Nimm deine Textnotizen zu Pinto Notes mit">
        <p>Importiere die Dateien auf dem Mac. Danach kannst du ChatGPT oder Claude mit deinen Notizen verbinden. Pinto Notes ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
      alt="Das Menü File in Pinto Notes auf dem Mac mit Import Markdown or Text."
      caption="Wähle Import Markdown or Text für exportierte Textdateien. Aufnahme: Pinto Notes auf dem Mac." />}
    faq={faq}>
    <h2 id="wahl">Was möchtest du an Simplenote ändern?</h2>
    <p><a href="https://simplenote.com/">Simplenote</a> bietet Tags, Suche, Markdown, geteilte Notizen, Veröffentlichung im Web und frühere Versionen. Wenn dir das für deine Textnotizen reicht, musst du nicht wechseln.</p>
    <p>Pinto Notes passt, wenn du eine App wie Apple Notizen möchtest und KI bei Bedarf auf deine Notizen zugreifen soll. Du schreibst weiterhin selbst. Nach dem Verbinden kann eine KI etwa eine Projektnotiz lesen und eine getroffene Entscheidung ergänzen.</p>
    <p>Pinto Notes gibt es für iPhone und Mac, nicht für Windows, Android oder das Web. Simplenote unterstützt mehr Geräte und funktioniert nach der Anmeldung und dem Herunterladen der Notizen auch offline.</p>

    <h2 id="export">Simplenote im Browser exportieren</h2>
    <ol>
      <li>Melde dich in der <a href="https://app.simplenote.com/">Simplenote-Web-App</a> an.</li>
      <li>Öffne links oben das Menü und dann Settings.</li>
      <li>Wähle Tools, danach Export Notes. Speichere das ZIP.</li>
    </ol>
    <p>In Simplenotes Electron-App kannst du File, Export Notes nutzen. Laut <a href="https://simplenote.com/help/#export">offizieller Exportanleitung</a> unterstützt die Mac-App-Store-Version diesen Export nicht. Fehlt der Befehl auf deinem Mac, nutze den Browser.</p>
    <p>Die <a href="https://github.com/Automattic/simplenote-electron/blob/trunk/lib/utils/export/README.md">Exportdokumentation</a> beschreibt ein ZIP mit einer Datei pro Notiz. Der Code schreibt Textdateien und eine JSON-Sicherung. Behalte das ZIP unverändert und entpacke eine Kopie, um die Textdateien zu prüfen.</p>

    <h2 id="import">Textdateien auf dem Mac importieren</h2>
    <p>Öffne in Pinto Notes das Menü File und wähle Import Markdown or Text. Du kannst einen Ordner oder ein ZIP mit Markdown- oder Textdateien wählen. Jeder Ordner wird wieder zu einem Ordner. Die <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> erklärt diesen Weg. Simplenote bleibt unverändert.</p>
    <p>Kopiere für einen ersten Test einige exportierte Textdateien in einen eigenen Ordner. Nimm eine lange Notiz und, falls vorhanden, eine mit Markdown. Vergleiche sie nach dem Import. Verwende die einzelnen Textdateien; die JSON-Sicherung ist für Pintos Import keine Notiz.</p>
    <p>Du verbindest kein Simplenote-Konto mit Pinto. Der Textimport stellt weder die Tag-Ordnung noch alte Versionen automatisch wieder her. Simplenotes Export hängt Tag-Namen an den Text, aber daraus werden nicht zwingend Pinto-Tags. Prüfe das Ergebnis, wenn du über Tags suchst.</p>

    <h2 id="pruefen">Prüfe den Wechsel, bevor du Simplenote verlässt</h2>
    <Keep title="Checkliste für den Wechsel" text={CHECK} note="Behalte sie beim Export und hake ab, was du geprüft hast." />
    <p>Öffne eine importierte Notiz auf iPhone und Mac. Vergleiche den ganzen Text, besonders nach langen Listen oder Codeblöcken. Prüfe wichtige Links. Ein lesbarer Titel sagt nichts über den übrigen Inhalt.</p>

    <h2 id="ki">Importierte Notizen mit KI nutzen</h2>
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> können sie deine Pinto-Notizen lesen und bearbeiten. Lass eine bestimmte Projektnotiz lesen, offene Fragen auflisten und eine neue Entscheidung ergänzen. Prüfe die Änderung am Original.</p>
    <p>Pinto behält jede frühere Version einer Notiz. Das gilt für Änderungen in Pinto, nicht für frühere Simplenote-Versionen aus dem Textimport. Die <a href="/blog/apple-notes-version-history" hrefLang="en">Anleitung zur Versionsgeschichte</a> erklärt, wie du nach einer Änderung alten Text wiederfindest.</p>
  </LocalPostPage>;
}
