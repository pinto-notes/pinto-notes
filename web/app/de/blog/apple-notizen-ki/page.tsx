import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-ki");

// German version of /blog/apple-notes-ai, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen ki“, „apple notizen ki stift“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/121115, https://support.apple.com/de-de/127893, https://support.apple.com/de-de/guide/iphone/iphbe11247b5/ios, https://support.apple.com/de-de/guide/iphone/iph6f08da1d2/ios, https://support.apple.com/de-de/guide/iphone/iphb8628c6b8/ios.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-ki"
      intro={<>Apple Notizen hat KI-Funktionen für Text, Aufnahmen und auf unterstützten Geräten die Suche mit Siri AI. ChatGPT und Claude haben aber keinen direkten Zugriff auf deine ganze Notizsammlung vom iPhone aus.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#funktionen", label: "Was Apple Intelligence in Notizen macht" },
        { href: "#text", label: "Text umschreiben und zusammenfassen" },
        { href: "#aufnahme", label: "Aufnehmen, transkribieren, zusammenfassen" },
        { href: "#geraete", label: "Geräte und Sprachen" },
        { href: "#suche", label: "Gibt es eine KI-Suche?" },
      ]}>
        <p>Apple Intelligence kann Text umschreiben und zusammenfassen, Aufnahmen auswerten und mit Siri AI in Notizen suchen. Die Transkription selbst braucht nicht immer Apple Intelligence. Was verfügbar ist, hängt von Gerät, Sprache und Region ab.</p>
        <PostCta slug="de/apple-notizen-ki" path="/de/blog/apple-notizen-ki" position="answer" ui={ui.cta} title="ChatGPT oder Claude mit deinen Notizen verbinden?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="funktionen">Was Apple Intelligence in Notizen macht</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">Funktion</th><th scope="col">Aufgabe</th><th scope="col">Gerät</th></tr></thead><tbody>
        <tr><td>Schreibwerkzeuge</td><td>Korrigieren, umschreiben, zusammenfassen</td><td>iPhone und Mac mit Apple Intelligence</td></tr>
        <tr><td>Transkript</td><td>Gesprochenes aufschreiben und suchen</td><td>iPhone 12 oder neuer, Mac mit M1 oder neuer</td></tr>
        <tr><td>Aufnahme-Zusammenfassung</td><td>Transkript kürzen</td><td>Unterstütztes iPhone oder Mac</td></tr>
        <tr><td>Anrufaufnahme</td><td>Aufnahme und Transkript in Notizen</td><td>iPhone, je nach Region</td></tr>
        <tr><td>Bildkreation</td><td>Skizze oder Text als Bild</td><td>iPhone</td></tr>
        <tr><td>Siri AI Beta</td><td>Notizen finden, suchen und bearbeiten</td><td>iOS 27 und macOS 27, eingeschränkt</td></tr>
      </tbody></table></div>
      <p>Ein iPhone 12 kann eine Aufnahme transkribieren, auch ohne Apple Intelligence. Für die Zusammenfassung ist Apple Intelligence nötig. <a href="/blog/siri-ai-apple-notes" hrefLang="en">Siri AI und Apple Notizen</a> beschreibt die Beta.</p>
      <h2 id="text">Text umschreiben und zusammenfassen</h2>
      <p>Markiere Text in einer Notiz und öffne die Schreibwerkzeuge. Wähle Korrektur, Umschreiben, Zusammenfassen oder Kernpunkte. Du kannst auch eine gewünschte Änderung beschreiben. Sind Apples ChatGPT-Funktionen aktiviert, kann „Verfassen“ Text auf Grundlage der gewählten Stelle oder der Notiz erzeugen.</p>
      <p>Die genaue deutsche Bezeichnung einzelner neuer Optionen ist in den geprüften Supportseiten nicht für jede Version belegt. Folge deshalb den Funktionen im Menü, statt einen ungesicherten Menüpfad zu verwenden.</p>
      <h2 id="aufnahme">Aufnehmen, transkribieren, zusammenfassen</h2>
      <p>Öffne eine Notiz und tippe auf die Anhang-Taste. Wähle die Audioaufnahme und starte sie. Du kannst währenddessen weiterschreiben. Öffne danach die Aufnahme und zeige das Transkript an. Du kannst darin suchen oder den Text zur Notiz hinzufügen. Auf unterstützten Geräten lässt sich eine Zusammenfassung erstellen.</p>
      <p>Löschst du die Aufnahme, verschwindet auch ihr Transkript. Anrufaufnahmen liegen in einem eigenen Ordner und kennzeichnen Sprecher. Sie sind in der EU nicht verfügbar; die andere Person wird über die Aufnahme informiert.</p>
      <PostFigure src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} alt="Apple Notizen auf dem Mac mit Aufnahme, Transkript und Zusammenfassung." caption="Eine Aufnahme kann in Notizen transkribiert und zusammengefasst werden." />
      <h2 id="geraete">Geräte und Sprachen</h2>
      <p>Laut englischem Post brauchst du ein iPhone 15 Pro, 15 Pro Max, iPhone 16 oder neuer, iPhone Air oder Duo mit iOS 27. Auf dem Mac brauchst du M1 oder neuer oder ein MacBook Neo mit macOS 27. Geräte- und Siri-Sprache müssen übereinstimmen und unterstützt sein. Deutsch gehört zur Liste.</p>
      <p>Apple Intelligence kann bis zu 8 GB Speicher brauchen, auf manchen neuen Geräten bis zu 14 GB. Geräte aus China werden nicht unterstützt. Für manche Funktionen gelten tägliche Grenzen. Zusammenfassungen von Aufnahmen haben weniger Sprachen. Siri AI ist Beta; in der EU steht es laut englischem Post auf dem Mac, nicht auf dem iPhone, bereit.</p>
      <p>Apple nennt für viele KI-Funktionen Englisch, Dänisch, Niederländisch, Französisch, Deutsch, Italienisch, Norwegisch, Portugiesisch, Spanisch, Schwedisch, Türkisch, Vietnamesisch, vereinfachtes und traditionelles Chinesisch, Japanisch und Koreanisch. Zusammenfassungen von Aufnahmen unterstützen weniger Sprachen und nur bestimmte Regionen. Siri AI läuft als Beta in Englisch, Französisch, Japanisch, Koreanisch, Portugiesisch und Spanisch.</p>
      <h2 id="suche">Gibt es eine KI-Suche?</h2>
      <p>Die normale Suche findet Text, Handschrift, gescannte Wörter, Bildinhalte und Tags. Bei gesperrten Notizen erscheint nur der Titel. Innerhalb einer Notiz kannst du auch Anhänge in die Suche einbeziehen.</p>
      <p>Siri AI kann unter iOS 27 Fragen zu Inhalten deiner Notizen beantworten, ohne dass du den Titel kennst. Es bezieht auch andere Apple-Apps ein.</p>
      <h2 id="grenzen">Was ChatGPT und Claude nicht können</h2>
      <p>Apples ChatGPT-Erweiterung erhält nur den Text, den du freigibst. Die Antwort erscheint in Schreibwerkzeugen oder Siri. Eine entsprechende Claude-Erweiterung für die ganze Sammlung gibt es nicht. Apple Notizen bietet keine öffentliche API dafür.</p>
      <p>Auf dem Mac kann die ChatGPT-App die offene Notiz lesen. Claude kann über eine Desktop-Erweiterung die Notizen-App steuern. Beides hängt an diesem Mac. Auf dem iPhone oder im Web haben die Chat-Apps so keinen Zugriff auf deine Apple Notizen.</p>
      <h2 id="pinto">ChatGPT oder Claude in deinen Notizen</h2>
      <p>Pinto Notes läuft auf iPhone und Mac und behält Ordner, Checklisten, Tabellen und Pins. Es hat keine eigene KI. Stattdessen können ChatGPT, Claude, Claude Code und Codex nach dem Verbinden deine Notizen suchen, lesen und ändern, auch vom Web oder Handy aus.</p>
      <p>Änderungen werden markiert und lassen sich zurücknehmen. Frühere Versionen bleiben erhalten. Die Notizen sind Markdown-Dateien und verschlüsselt; gesperrte Notizen bleiben für KI geschlossen. Pinto Notes hat keine Windows-, Android- oder Web-App.</p>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes auf dem Mac mit von ChatGPT geänderter Notiz." caption="Eine von ChatGPT ergänzte Zeile bleibt erkennbar." />
    </LocalPostPage>
  );
}
