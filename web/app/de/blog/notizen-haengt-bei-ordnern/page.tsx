import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-haengt-bei-ordnern");

// German version of /blog/apple-notes-stuck-on-folders (21 Nov 2026). Local problem wording:
// „Notizen hängt bei Ordnern“, „iPhone Notizen hängt bei Ordnern“ and „Apple Notizen Ordner lädt nicht“.
// Google autocomplete hl=de, gl=de, read 21 Nov: these queries returned no suggestions; the title
// keeps the direct symptom wording. German Apple pages read 21 Nov 2026, same IDs as English:
// de-de/121669 (iCloud switch, restart), de-de/118446 (service status, account, network),
// de-de/guide/icloud/mm8685520792/icloud (iCloud paths, web), de-de/118575 and /108382
// (updates), de-de/121115 (Apple Intelligence setup). No specific Folders or Sichern fix or
// sync deadline in those pages. The picture shows an iCloud prompt, not a frozen folder view.

const ui = UI.de;
const FAQ = [
  { q: "Was tun, wenn Notizen die Ordneransicht nicht verlässt?", a: ["Prüfe bei fehlenden iCloud-Notizen Apples Systemstatus, deinen Apple Account und die Notizen-Einstellung in iCloud. Apple empfiehlt einen Neustart des iPhone und eine erneute Prüfung der Einstellung, wenn Notizen weiter fehlen. Reagiert der Bildschirm gar nicht, nutze Apples allgemeine Schritte für hängende Apps."] },
  { q: "Bedeutet „Vorbereiten“ bei Apple Intelligence, dass Notizen synchronisiert?", a: ["Eine Meldung in den Apple-Intelligence-Einstellungen betrifft dessen Einrichtung. Laut Apple kann ein Wechsel der Siri-Sprache die Funktion vorübergehend ausschalten, bis die Sprache geladen ist und zur Gerätesprache passt. Das sagt nichts darüber, ob eine Notiz iCloud erreicht hat."] },
  { q: "Nennt Apple eine Höchstdauer für die Notizen-Synchronisierung?", a: ["Die hier verlinkten Apple-Seiten nennen keine Frist. Eine langsame Übertragung belegt keine bestimmte Ursache. Prüfe iCloud-Störungen, die Verbindung, denselben Apple Account und ob Notizen auf jedem Gerät aktiviert ist."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notizen-haengt-bei-ordnern"
    intro={<>Bleibt Apple Notizen in der Ordneransicht hängen und lädt keine Notizen, prüfe zuerst iCloud und die Notizen-Einstellung. Reagiert die App nicht auf Tippen, folge den Schritten für eine hängende App.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#ordner", label: "Ordner öffnen nicht" }, { href: "#icloud", label: "iCloud prüfen" },
      { href: "#sichern", label: "Sichern hängt" }, { href: "#vorbereiten", label: "Vorbereiten hängt" },
    ]}>
      <p>Sieh bei Apples Systemstatus nach. Vergewissere dich dann, dass alle Geräte denselben Apple Account verwenden und Notizen für iCloud aktiviert ist. Prüfe auch Verbindung und Updates. Apples verlinkte Seiten nennen diese allgemeinen Schritte, aber keine eigene Lösung für eine hängende Ordneransicht.</p>
      <PostCta slug="de/notizen-haengt-bei-ordnern" path="/de/blog/notizen-haengt-bei-ordnern" position="answer" ui={ui.cta} title="Teste deine Notizen in Pinto Notes">
        <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Du kannst <a href="/blog/move-from-apple-notes">Apple Notizen auf dem Mac importieren</a>. Das Original bleibt unverändert. Pinto Notes repariert Apple Notizen nicht.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
      alt="Notizen unter macOS 27 fragt, ob iCloud eingeschaltet werden soll. Die Schaltflächen führen zu den Systemeinstellungen oder brechen ab."
      caption="Ein iCloud-Hinweis in Notizen unter macOS 27. Er unterscheidet sich von einer nicht reagierenden Ordneransicht." />}
    faq={FAQ}>
    <h2 id="ordner">Wenn sich ein Ordner nicht öffnen lässt</h2>
    <p>Wähle „Alle iCloud-Notizen“ oder einen Ordner unter iCloud. Dort solltest du laut Apples Einrichtungshilfe nach iCloud-Notizen suchen. Öffnen sich die Ordner, aber die Notizen fehlen, geh die folgenden Checks durch.</p>
    <p>Reagiert Notizen überhaupt nicht, lies <a href="/de/blog/notizen-app-funktioniert-nicht">Notizen funktioniert nicht</a>. Dort stehen Apples Schritte zum Schließen, Neustarten und Aktualisieren. Aus einem eingefrorenen Bildschirm lässt sich nicht ablesen, ob die letzten Änderungen hochgeladen wurden.</p>
    <h2 id="icloud">iCloud prüfen, bevor du weitere Einstellungen änderst</h2>
    <Steps>
      <li id="status"><strong>Apples Systemstatus prüfen.</strong> Öffne <a href="https://www.apple.com/de/support/systemstatus/">Apple Systemstatus</a> und suche nach iCloud-Notizen. Meldet Apple eine Störung, prüfe deren Status, bevor du Einstellungen änderst.</li>
      <li id="account"><strong>Apple Account prüfen.</strong> Auf allen Geräten muss derselbe Account angemeldet sein. Er steht oben in Einstellungen auf dem iPhone und in den Systemeinstellungen auf dem Mac.</li>
      <li id="schalter"><strong>Notizen für iCloud einschalten.</strong> Aktiviere „Dieses iPhone synchronisieren“ oder „Diesen Mac synchronisieren“, falls es ausgeschaltet ist. Apple empfiehlt auf dem iPhone einen Neustart und eine erneute Prüfung, wenn Notizen noch fehlen.
        <Paths rows={[
          { on: "iPhone", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen", "Dieses iPhone synchronisieren"] },
          { on: "Mac, macOS 15 oder neuer", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen", "Diesen Mac synchronisieren"] },
        ]} />
      </li>
      <li id="netz"><strong>Verbindung prüfen.</strong> Apple verlangt eine stabile Internetverbindung. Ohne WLAN prüfst du auf dem iPhone, ob mobile Daten in Einstellungen eingeschaltet sind. Sind sie aus, ist iCloud möglicherweise nicht darüber erreichbar.</li>
      <li id="updates"><strong>Softwareupdates prüfen.</strong> Apple nennt iOS- und macOS-Updates bei iCloud-Problemen. Sichere dein Gerät vor der Installation.
        <Paths rows={[
          { on: "iPhone", steps: ["Einstellungen", "Allgemein", "Softwareupdate"] },
          { on: "Mac", steps: ["Apple-Menü", "Systemeinstellungen", "Allgemein", "Softwareupdate"] },
        ]} />
      </li>
    </Steps>
    <p>Diese Checks stammen aus Apples Hinweisen zu <a href="https://support.apple.com/de-de/118446">iCloud-Verbindungen</a>, <a href="https://support.apple.com/de-de/121669">fehlenden iCloud-Notizen</a> und der <a href="https://support.apple.com/de-de/guide/icloud/mm8685520792/icloud">Einrichtung von Notizen</a>. Die Updatewege stehen in Apples Anleitungen für <a href="https://support.apple.com/de-de/118575">iPhone</a> und <a href="https://support.apple.com/de-de/108382">Mac</a>.</p>
    <h2 id="sichern">Wenn iCloud-Notizen beim Sichern hängen</h2>
    <p>Öffne <a href="https://www.icloud.com/notes">iCloud-Notizen im Browser</a> und melde dich mit demselben Apple Account an. Prüfe die Notiz und ihre letzte Änderung. Eine ältere Version dort belegt nur, dass der ältere Inhalt iCloud erreicht hat. Sichere neuen Text separat, solange du ihn noch lesen kannst.</p>
    <p>Apples hier verlinkte Seiten nennen weder eine Frist für die Synchronisierung noch eine eigene Lösung für „Sichern“. Weitere Checks zu Speicherplatz und Notizen auf nur einem Gerät stehen unter <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a>.</p>
    <h2 id="vorbereiten">Prüfe, wo „Vorbereiten“ erscheint</h2>
    <p>Steht die Meldung in den Apple-Intelligence-Einstellungen, lies Apples <a href="https://support.apple.com/de-de/121115">Einrichtungsseite</a>. Nach einem Wechsel der Siri-Sprache kann Apple Intelligence fehlen, bis die neue Sprache geladen ist und zur Gerätesprache passt. Das betrifft die Einrichtung von Apple Intelligence, nicht den Upload einer Notiz.</p>
    <p>Erscheint „Vorbereiten“ innerhalb von Notizen bei einem Scan oder PDF, sagt diese Einrichtungsseite nichts über die Ursache. Notiere den genauen Text und was du gerade getan hast. Helfen die Checks nicht, gib diese Angaben an den <a href="https://getsupport.apple.com/">Apple Support</a>.</p>
  </LocalPostPage>;
}
