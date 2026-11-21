import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "google-keep-in-apple-notizen-importieren");

// German version of /blog/google-keep-to-apple-notes, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „google keep mit apple notizen synchronisieren“; „google keep zu apple notizen“ ohne Vorschläge.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/102223, https://support.apple.com/de-de/guide/notes/not201900c07/mac, https://support.apple.com/de-de/guide/iphone/iph7262fd4fe/ios.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="google-keep-in-apple-notizen-importieren"
      intro={<>Google Keep und Apple Notizen synchronisieren nicht miteinander. Für wenige Notizen reicht Kopieren und Einfügen. Für eine ganze Sammlung brauchst du Google Takeout und einen Mac.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vorher", label: "Bevor du anfängst" },
        { href: "#wenige", label: "Wenige Notizen kopieren" },
        { href: "#alle", label: "Alle Notizen mit Takeout und Mac" },
        { href: "#ergebnis", label: "Was kommt mit?" },
        { href: "#sync", label: "Keep und Apple Notizen bleiben getrennt" },
      ]}>
        <p>Google Takeout liefert eine Kopie deiner Keep-Daten. Apple Notizen kann auf dem Mac die HTML-Dateien daraus importieren. Labels und Farben musst du danach selbst neu ordnen.</p>
        <PostCta slug="de/google-keep-in-apple-notizen-importieren" path="/de/blog/google-keep-in-apple-notizen-importieren" position="answer" ui={ui.cta} title="Keep-Notizen ohne HTML-Auswahl importieren?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="vorher">Bevor du anfängst</h2>
      <p>Keep nutzt Labels und Farben; Apple Notizen Ordner und Tags. Ein Import übernimmt diese Ordnung nicht automatisch. Teste erst eine kleine Auswahl und prüfe besonders Checklisten und Bilder.</p>
      <h2 id="wenige">Wenige Notizen kopieren</h2>
      <p>Öffne eine Notiz in Keep, markiere ihren Text und kopiere ihn. Erstelle in Apple Notizen eine neue Notiz und setze den Titel in die erste Zeile. Füge den Text darunter ein.</p>
      <p>Falls Checklisten als normale Zeilen ankommen, markiere sie und tippe auf die Checklisten-Taste. Bilder speicherst du bei Bedarf einzeln aus Keep und fügst sie in Notizen ein. Dieser Weg funktioniert auch auf dem iPhone, wird bei Hunderten Notizen aber mühsam.</p>
      <h2 id="alle">Alle Notizen mit Takeout und Mac</h2>
      <p>Öffne takeout.google.com, entferne die Auswahl bei allen Diensten außer Keep und fordere eine ZIP-Datei per E-Mail-Link an. Google braucht dafür Minuten bis Tage; der Link gilt ungefähr sieben Tage und jeder Download ist fünfmal möglich.</p>
      <p>Entpacke die ZIP-Datei auf dem Mac. Im Takeout-Ordner liegt ein Keep-Ordner. Öffne Apple Notizen, wähle einen Ordner unter iCloud und dann „Ablage“ &gt; „In ,Notizen’ importieren“. Wähle nur die HTML-Dateien aus und bestätige zweimal „Importieren“. JSON-Dateien gehören nicht zu Apples Importformaten. Jede HTML-Datei wird eine Notiz im Ordner „Importierte Notizen“.</p>
      <p>Auf dem iPhone beschreibt Apple das Teilen einer Datei aus der Dateien-App in Notizen, jeweils einzeln. Für eine große Sammlung ist der Mac einfacher.</p>
      <h2 id="ergebnis">Was kommt mit?</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">Inhalt</th><th scope="col">Kopieren und Einfügen</th><th scope="col">Takeout-Import</th></tr></thead><tbody>
        <tr><td>Text</td><td>Ja</td><td>Ja</td></tr>
        <tr><td>Checklisten</td><td>Eventuell als Zeilen</td><td>Testnotiz prüfen</td></tr>
        <tr><td>Bilder</td><td>Einzeln</td><td>Testnotiz prüfen</td></tr>
        <tr><td>Labels</td><td>Nein</td><td>Nein</td></tr>
        <tr><td>Farben und Erinnerungen</td><td>Nein</td><td>Nein</td></tr>
      </tbody></table></div>
      <p>Lege für wichtige Labels Ordner an oder ergänze Tags wie #rezepte. Die Suche findet Wörter in den importierten Notizen. Apple verspricht nicht, dass importierte HTML-Checklisten und Bilder genau wie in Keep aussehen.</p>
      <h2 id="sync">Keep und Apple Notizen bleiben getrennt</h2>
      <p>Du kannst in Apple Notizen ein Google-Konto aktivieren. Das speichert Apple-Notizen in diesem Konto, zeigt aber keine Google-Keep-Notizen an. Die beiden Apps teilen keinen Bestand. Bei anderen Konten als iCloud oder „Auf meinem iPhone“ stehen einige Funktionen nicht zur Verfügung.</p>
      <p>Von Apple Notizen zu Keep geht nur Kopieren und Einfügen, da Keep keinen Import anbietet. <a href="/de/blog/apple-notizen-vs-google-keep">Apple Notizen vs Google Keep</a> vergleicht die Apps.</p>
      <h2 id="pinto">Keep direkt in Pinto Notes importieren</h2>
      <p>Pinto Notes liest den Keep-Download auf dem Mac selbst. Es öffnet Google Takeout mit Keep als Auswahl. Nach dem Import werden Labels zu Ordnern oder Tags, Häkchen und Pins bleiben und Bilder kommen mit. Archivierte Notizen kannst du einschließen. Farben, Zeichnungen und Erinnerungen kommen nicht mit.</p>
      <p>Danach können ChatGPT oder Claude nach dem Verbinden Notizen bearbeiten. Frühere Versionen bleiben erhalten. Pinto Notes läuft auf iPhone und Mac, nicht auf Android oder Windows. Für Listen mit Android-Nutzern behalte Keep.</p>
      <PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} alt="Pinto Notes zeigt die Schritte für den Google-Keep-Import." caption="Der Keep-Import beginnt bei Google Takeout." />
    </LocalPostPage>
  );
}
