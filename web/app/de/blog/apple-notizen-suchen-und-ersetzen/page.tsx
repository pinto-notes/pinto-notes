import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-suchen-und-ersetzen");

// German version of /blog/apple-notes-find-and-replace, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "apple notizen suchen und ersetzen"
// returned that exact phrase. Apple support, German, read 21 Nov 2026:
// support.apple.com/de-de/guide/notes/not18ab658ed/mac (Command-F inside a note),
// /guide/iphone/iphb8628c6b8/ios (Notizenaktionen > In Notiz suchen), iph1a9cae52c/ios
// (select text), /guide/textedit/txtef6cfde1a/mac (Bearbeiten > Suchen > Suchen,
// Ersetzen checkbox, Ersetzen, Alle, Fertig). The Notes guides do not name replacement controls.
// TextEdit facts stay those of the English source. No picture.
const ui = UI.de;

const RENAME = `Suche in meinem Ordner „Start“ in Pinto Notes nach Notizen mit „Hafen Pilot“.
Lies jede gefundene Notiz und zeige mir die Stellen, die du in „Hafen Vorschau“ ändern würdest.
Lass alte Zitate aus Besprechungen und Webadressen unverändert. Ändere noch nichts.
Wenn ich die Stellen bestätigt habe, aktualisiere die Notizen und liste alle geänderten Notizen auf.`;

const FAQ = [
  { q: "Was dokumentiert Apple zum Suchen und Ersetzen in Notizen?", a: ["Die aktuellen Anleitungen nennen Command-F innerhalb einer Notiz auf dem Mac und „Notizenaktionen“, „In Notiz suchen“ auf dem iPhone. Bedienelemente zum Ersetzen werden dort nicht beschrieben. Daraus folgt nicht, dass es sie nicht gibt."] },
  { q: "Wie suche ich auf dem Mac innerhalb einer Notiz?", a: ["Öffne die Notiz, drücke Command-F und gib den Text ein. Das ist eine andere Suche als die nach Notizen in einem Account."] },
  { q: "Wo finde ich „In Notiz suchen“ auf dem iPhone?", a: ["Öffne die Notiz und tippe auf „Notizenaktionen“, dann „In Notiz suchen“. Mit der Taste „Suchen“ öffnest du dort Suchoptionen."] },
  { q: "Kann eine verbundene KI einen Ausdruck in mehreren Pinto Notizen ändern?", a: ["Ja. ChatGPT oder Claude kann passende Notizen suchen und lesen, dann jede einzeln bearbeiten. Das Werkzeug ersetzt genauen Text jeweils in einer angegebenen Notiz. Mehrere Notizen erfordern mehrere Bearbeitungen."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="apple-notizen-suchen-und-ersetzen"
    intro={<>Innerhalb einer Apple Notiz suchst du auf dem Mac mit Command-F und auf dem iPhone über „Notizenaktionen“, „In Notiz suchen“. Apples Anleitungen beschreiben die Suche, aber keine Bedienelemente zum Ersetzen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Auf dem Mac suchen" }, { href: "#iphone", label: "Auf dem iPhone suchen" },
      { href: "#ersetzen", label: "Mehrfach ersetzen" }, { href: "#grenzen", label: "Mehrere Notizen" },
      { href: "#pinto-notes", label: "Mit KI umbenennen" },
    ]}><p>Suche zuerst innerhalb der Notiz. Einzelne Fundstellen kannst du selbst bearbeiten. Für einen von Apple beschriebenen Weg zum mehrfachen Ersetzen kopierst du reinen Text nach TextEdit auf dem Mac und nutzt dort „Ersetzen“ und „Alle“.</p>
      <PostCta slug="de/apple-notizen-suchen-und-ersetzen" path="/de/blog/apple-notizen-suchen-und-ersetzen" position="answer" ui={ui.cta} title="Einen Begriff in mehreren Notizen ändern?">
        <p>In Pinto Notes können verbundene ChatGPT oder Claude passende Notizen finden und einzeln bearbeiten. Frühere Versionen bleiben erhalten.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="mac">Text in einer Apple Notiz auf dem Mac suchen</h2>
    <Steps><li>Öffne die Notiz, die du prüfen möchtest.</li><li>Drücke Command-F, um das Suchfeld in der Notiz zu öffnen.</li><li>Gib das Wort oder den Ausdruck ein.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Notiz öffnen", "In der Notiz suchen"], keys: "⌘F" }]} />
    <p>So beschreibt es Apples <a href="https://support.apple.com/de-de/guide/notes/not18ab658ed/mac">Suchanleitung für Notizen auf dem Mac</a>. Die Suche innerhalb einer Notiz ist getrennt von der Suche nach Notizen im Account. Suche zum Beispiel nach „Hafen Pilot“ statt nur nach „Hafen“.</p>
    <p>Die Anleitung nennt weder Bedienelemente noch einen Kurzbefehl zum Ersetzen. Das belegt keine fehlende Funktion. Für wenige Korrekturen änderst du die gefundenen Stellen direkt. Der unten beschriebene Weg für viele Ersetzungen nutzt eine Textkopie in TextEdit.</p>
    <h2 id="iphone">Text in Apple Notizen auf dem iPhone suchen</h2>
    <Steps><li>Öffne die Notiz und tippe auf die Taste „Notizenaktionen“.</li><li>Tippe auf „In Notiz suchen“.</li><li>Gib den Suchtext ein. Die Taste „Suchen“ öffnet Suchoptionen.</li></Steps>
    <Paths rows={[{ on: "iPhone", steps: ["Notizenaktionen", "In Notiz suchen"] }]} />
    <p>Apple beschreibt die Schritte in <a href="https://support.apple.com/de-de/guide/iphone/iphb8628c6b8/ios">Notizen auf dem iPhone durchsuchen</a>. Auch dort fehlt eine beschriebene Tastenfolge zum Ersetzen.</p>
    <p>Für eine Korrektur kehre zur Bearbeitung zurück. Tippe zweimal auf ein Wort, ziehe die Auswahlgriffe über den ganzen Ausdruck und tippe den neuen Text. Apple erklärt die Auswahl in seiner <a href="https://support.apple.com/de-de/guide/iphone/iph1a9cae52c/ios">Anleitung zur Textbearbeitung</a>. Prüfe den Satz um jede Fundstelle.</p>
    <h2 id="ersetzen">Viele Stellen mit TextEdit auf dem Mac ersetzen</h2>
    <p>Für einen längeren Abschnitt gewöhnlichen Texts kannst du die Ersetzung in TextEdit vornehmen und den geprüften Text zurückkopieren. Behalte die ursprüngliche Notiz, bis alles stimmt. Anhänge und komplexe Formatierung lassen sich so nicht übertragen.</p>
    <Steps>
      <li>Kopiere den Abschnitt aus Notizen in ein TextEdit-Dokument.</li>
      <li>Wähle in TextEdit „Bearbeiten“, „Suchen“, „Suchen“ und gib den alten Ausdruck ein.</li>
      <li>Aktiviere neben „Fertig“ das Feld „Ersetzen“. Gib den neuen Ausdruck ins Feld darunter ein.</li>
      <li>Klicke für eine Fundstelle auf „Ersetzen“ oder für alle Fundstellen im TextEdit-Dokument auf „Alle“.</li>
      <li>Klicke auf „Fertig“, lies den geänderten Text und kopiere ihn an die richtige Stelle der Notiz zurück.</li>
    </Steps>
    <Paths rows={[{ on: "TextEdit auf dem Mac", steps: ["Bearbeiten", "Suchen", "Suchen", "Ersetzen"] }]} />
    <p>Diese Namen stammen aus Apples <a href="https://support.apple.com/de-de/guide/textedit/txtef6cfde1a/mac">TextEdit-Anleitung</a>. Sie bezeichnen Bedienelemente in TextEdit, nicht in Notizen.</p>
    <h2 id="grenzen">Mehrere Notizen ändern</h2>
    <p>Alle Notizen mit einem Namen zu finden und ihn überall zu ändern sind zwei Aufgaben. Die geprüften Apple Anleitungen nennen keinen einzigen Ersetzen-Befehl über mehrere Notizen. Suche den alten Ausdruck, öffne jede relevante Notiz und prüfe den Zusammenhang.</p>
    <p>In einem aktuellen Plan kann ein neuer Projektname passen, in einem alten Besprechungszitat nicht. Notiere vorab, welche Notizen du ändern willst. Findet die Suche eine bekannte Notiz nicht, gehe zuerst die <a href="/de/blog/notizen-suche-funktioniert-nicht">Schritte zur Fehlersuche</a> durch.</p>
    <h2 id="pinto-notes">Einen Ausdruck mit verbundener KI umbenennen</h2>
    <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI Notizen suchen, Treffer lesen und Text in jeder Notiz ersetzen. Lass dir die geplanten Änderungen zuerst zeigen.</p>
    <Keep title="Auftrag zum Umbenennen für deine KI" text={RENAME} copyLabel={ui.copy} note="Ordner und Ausdrücke anpassen. Das ist ein vorgeschlagener Ablauf, keine automatische Regel." />
    <p>Das Bearbeitungswerkzeug von Pinto ersetzt genauen Text in jeweils einer benannten Notiz, bei Bedarf jede Stelle dort. Die KI muss die aktuelle Version vor dem Bearbeiten lesen. Für mehrere Notizen sind Suche, Lesen und einzelne Bearbeitungen nötig.</p>
    <p>Gib erst nach der Prüfung frei, welche Stellen geändert werden sollen. Lies die fertigen Notizen und prüfe die Ausnahmen. Frühere Fassungen bleiben erhalten; mehr dazu in der <a href="/blog/apple-notes-version-history" hrefLang="en">Anleitung zur Versionsgeschichte</a> (auf Englisch).</p>
    <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
