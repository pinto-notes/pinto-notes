import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-windows");

// German version of /blog/apple-notes-on-windows, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen windows“, „apple notizen windows 11“,
// „apple notizen windows app“, „apple notizen auf windows öffnen“, „apple notizen auf windows nutzen“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/105119,
// https://support.apple.com/de-de/guide/icloud/mm8685520792/icloud,
// https://support.apple.com/de-de/guide/icloud/mmc0cd6edf/icloud,
// https://support.apple.com/de-de/guide/icloud/mmcd9c9e9b71/icloud,
// https://support.apple.com/de-de/guide/icloud/mm000b55f946/icloud,
// https://support.apple.com/de-de/guide/icloud/mmc8a8e49dbd/icloud.
// The browser toolbar's icon-only controls are described by action, not assigned invented German names.

const ui = UI.de;
const faq = [
  { q: "Wie nutze ich Apple Notizen unter Windows 11?", a: ["Öffne icloud.com/notes im Browser und melde dich mit dem Apple Account deiner Notizen an. Apple empfiehlt aktuelle Versionen von Firefox, Chrome, Edge oder Opera. Sichtbar sind nur Notizen aus iCloud."] },
  { q: "Brauche ich iCloud für Windows?", a: ["Nein. Apples Anleitung für Notizen nutzt iCloud.com im Browser. Die Windows-App von iCloud führt Notizen nicht unter ihren Funktionen auf."] },
  { q: "Kann ich unter Windows Anhänge hinzufügen?", a: ["Apple beschreibt das Hinzufügen von Anhängen in Notizen auf iPhone oder Mac. Auf iCloud.com kannst du vorhandene Anhänge ansehen und herunterladen."] },
  { q: "Warum öffnet sich eine gesperrte Notiz nicht?", a: ["Auf iCloud.com lassen sich Notizen mit einem eigenen Notizen-Passwort öffnen. Wenn die Sperre den Gerätecode oder das Mac-Anmeldepasswort verwendet, geht das dort nicht. Anhänge erscheinen in gesperrten Notizen nur als Platzhalter."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="apple-notizen-windows"
    intro={<>Apple Notizen gibt es unter Windows über icloud.com/notes im Browser. Melde dich mit deinem Apple Account an. Die Notizen müssen in iCloud liegen, damit sie dort erscheinen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#oeffnen", label: "Notizen öffnen" }, { href: "#fehlen", label: "Fehlende Notizen" },
      { href: "#bearbeiten", label: "Bearbeiten" }, { href: "#grenzen", label: "Grenzen" },
      { href: "#app", label: "Windows-App?" },
    ]}>
      <p>Auf <a href="https://www.icloud.com/notes">iCloud.com</a> kannst du iCloud-Notizen lesen und bearbeiten. Änderungen erscheinen auf deinen Apple-Geräten, wenn Notizen dort mit iCloud synchronisiert wird. Ein Download ist dafür nicht nötig.</p>
      <PostCta slug="de/apple-notizen-windows" path="/de/blog/apple-notizen-windows" position="answer" ui={ui.cta} title="Auch auf iPhone oder Mac schreiben?">
        <p>Pinto Notes ist auf Englisch und läuft auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude Notizen lesen und ändern. Für Windows gibt es weder eine App noch eine Webfassung.</p>
      </PostCta>
    </Answer>} faq={faq}>
    <h2 id="oeffnen">Apple Notizen auf Windows öffnen</h2>
    <Steps><li>Öffne <a href="https://www.icloud.com/notes">icloud.com/notes</a> im Browser.</li><li>Melde dich mit dem Apple Account an, den du für iCloud-Notizen verwendest.</li><li>Wähle einen Ordner und dann eine Notiz aus.</li></Steps>
    <p>Apple nennt Notizen unter den <a href="https://support.apple.com/de-de/105119">iCloud.com-Funktionen für Windows-PCs</a>. Empfohlen werden aktuelle Versionen von Firefox, Chrome, Edge oder Opera.</p>
    <h2 id="fehlen">Wenn Notizen vom iPhone fehlen</h2>
    <p>Auf iCloud.com stehen nur Notizen aus iCloud. Notizen aus Google oder Yahoo erscheinen dort nicht. Schau auf dem iPhone oder Mac in der Ordnerliste unter iCloud nach. <a href="/de/blog/wo-werden-apple-notizen-gespeichert">Wo Apple Notizen gespeichert werden</a> erklärt die Accounts.</p>
    <p>Aktiviere die Synchronisierung von Notizen in den iCloud-Einstellungen deines Geräts. Melde dich dort und im Windows-Browser mit demselben Apple Account an. Auf dem iPhone findest du die Einstellung unter deinem Namen in „Einstellungen“ und „iCloud“. Auf dem Mac liegt sie unter deinem Namen in „Systemeinstellungen“ und „iCloud“. <a href="https://support.apple.com/de-de/guide/icloud/mm8685520792/icloud">Apple zeigt die Schritte</a> für beide Geräte.</p>
    <p>Wenn iCloud.com den Datenzugriff verweigert, prüfe den Webzugriff auf deinem Apple-Gerät. Der erweiterte Datenschutz schaltet ihn zunächst aus. Du kannst den Zugriff in den iCloud-Einstellungen wieder erlauben und vorübergehend mit einem vertrauenswürdigen Gerät bestätigen. <a href="https://support.apple.com/de-de/guide/icloud/mmc8a8e49dbd/icloud">Apple erklärt den Webzugriff</a>.</p>
    <h2 id="bearbeiten">Im Browser schreiben und Listen anlegen</h2>
    <Steps><li>Klicke in der Symbolleiste auf die Taste zum Erstellen einer Notiz.</li><li>Schreibe deinen Text. iCloud.com sichert Änderungen automatisch.</li><li>Markiere Text und wähle in der Symbolleiste einen Stil, wenn du ihn formatieren willst.</li></Steps>
    <p>Für eine Checkliste setze den Cursor in eine leere Zeile oder markiere vorhandene Zeilen. Klicke dann auf die Checklisten-Taste. Ein Klick auf den leeren Kreis hakt einen Eintrag ab. Aufzählungen und nummerierte Listen wählst du über die Formatierung. Apple beschreibt das <a href="https://support.apple.com/de-de/guide/icloud/mmc0cd6edf/icloud">Erstellen</a> und <a href="https://support.apple.com/de-de/guide/icloud/mmcd9c9e9b71/icloud">Bearbeiten von Listen</a>.</p>
    <h2 id="grenzen">Grenzen der Browserfassung</h2>
    <h3>Anhänge und Scans</h3>
    <p>Anhänge fügst du laut Apple in der App auf iPhone oder Mac hinzu. Unter Windows kannst du sie danach auf iCloud.com öffnen und herunterladen. Doppelklicke einen Anhang. Bei einem Scan öffnest du die Miniatur und nutzt anschließend die Download-Taste.</p>
    <h3>Gesperrte Notizen</h3>
    <p>Auf Apple-Geräten öffnest du gesperrte Notizen mit Passwort, Face ID oder Touch ID. Im Browser funktioniert ein eigenes Notizen-Passwort. Eine Sperre mit Gerätecode oder Mac-Anmeldepasswort lässt sich auf iCloud.com nicht öffnen. Anhänge in gesperrten Notizen werden dort als Platzhalter angezeigt. Sperren und Passwortänderungen erledigst du auf einem Apple-Gerät. <a href="https://support.apple.com/de-de/guide/icloud/mm000b55f946/icloud">Apple nennt die Einschränkungen</a>.</p>
    <h2 id="app">Gibt es Apple Notizen als Windows-App?</h2>
    <p>Apples dokumentierter Weg führt über den Browser. Die <a href="https://support.apple.com/de-de/guide/icloud/mm6be2394337/icloud">Funktionen von iCloud für Windows</a> umfassen Fotos und Dateien, aber keine Notizen. Weitere Möglichkeiten findest du bei den <a href="/de/blog/apple-notizen-alternativen">Alternativen zu Apple Notizen</a>.</p>
    <h2 id="pinto">Pinto Notes, wenn du auch einen Mac nutzt</h2>
    <p>Pinto Notes läuft auf iPhone und Mac, nicht auf Windows, Android oder im Web. Es speichert Markdown-Dateien und behält frühere Versionen. ChatGPT oder Claude können nach dem Verbinden Notizen lesen und bearbeiten.</p>
    <Figure shot={SHOTS.welcome} caption="Die Willkommensnotiz in Pinto Notes auf dem Mac." />
    <p>Apple Notizen kannst du auf dem Mac importieren. Die Originale in Apple Notizen bleiben bestehen.</p>
  </LocalPostPage>;
}
