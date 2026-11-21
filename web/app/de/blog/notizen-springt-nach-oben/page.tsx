import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-springt-nach-oben");

// German version of /blog/apple-notes-keeps-jumping-to-top (21 Nov 2026). Local problem wording:
// „Notizen springt nach oben“, „iPhone Notizen springt nach oben“ and „Apple Notizen springt nach oben“.
// Google autocomplete hl=de, gl=de, read 21 Nov: all three returned no suggestions; the direct
// symptom wording is retained rather than inventing a different problem. German Apple pages read
// 21 Nov 2026, same IDs as English: de-de/119876, de-de/guide/iphone/iph83bfec492/ios,
// de-de/118259, de-de/guide/mac-help/mchlp2579/mac and mchlp2522/mac, de-de/118575,
// de-de/108382, de-de/121669, de-de/guide/icloud/mm8685520792/icloud.
// None documents a fix for this exact jump. The fresh note and browser are suggestions to test.

const ui = UI.de;
const SUPPORT_RECORD = `Problem beim Scrollen in Notizen
Gerät und iOS- oder macOS-Version:
Eine Notiz oder mehrere:
Was ich unmittelbar vor dem Sprung getan habe:
Springt die Ansicht, die Schreibmarke oder beides?
Hakt auch das Tippen?
Was nach dem Neustart passiert ist:
Was nach dem Update passiert ist:
Was mit derselben Notiz auf einem anderen Gerät passiert:
`;
const FAQ = [
  { q: "Hat Apple eine Lösung für Notizen, die nach oben springen, veröffentlicht?", a: ["Die für diesen Artikel geprüften Apple-Seiten dokumentieren keine Lösung für genau diesen Fehler. Für Apps mit Problemen empfiehlt Apple, sie neu zu öffnen, das Gerät neu zu starten und Updates zu prüfen. Das garantiert keine Lösung für das Springen."] },
  { q: "Hilft es, iCloud auszuschalten?", a: ["Die geprüften Apple-Seiten nennen iCloud weder als Ursache noch empfehlen sie, es gegen das Springen auszuschalten. Apples Anleitung für fehlende Notizen empfiehlt vielmehr, die Synchronisierung zu prüfen und gegebenenfalls neu zu starten. Das betrifft fehlende Notizen, nicht die Scrollposition."] },
  { q: "Was kann ich bei Ruckeln und Springen versuchen?", a: ["Schreib den aktuellen Abschnitt testweise in einer neuen Notiz weiter und lass das Original unverändert. Du kannst dieselbe iCloud-Notiz auch auf einem anderen Gerät oder auf icloud.com/notes ausprobieren. Das sind Versuche ohne Erfolgsgarantie."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notizen-springt-nach-oben"
    intro={<>Wenn Notizen beim Schreiben nach oben springt, gibt Apple dafür keine eigene Lösung an. Beginne mit den allgemeinen Schritten für Apps: neu öffnen, Gerät neu starten und Updates prüfen. Falls es weiter passiert, probiere einen anderen Weg zum Weiterschreiben.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#neustart", label: "Notizen neu starten" }, { href: "#update", label: "Updates prüfen" },
      { href: "#icloud", label: "iCloud prüfen" }, { href: "#weiter", label: "Weiterschreiben" },
    ]}>
      <p>Schließe Notizen und öffne es wieder. Starte iPhone oder Mac neu und prüfe auf ein iOS- oder macOS-Update. Apple empfiehlt das bei Problemen mit Apps, verspricht damit aber keine Lösung für diesen Scrollfehler. Wenn Notizen auch auf einem anderen Gerät fehlen, prüfe die iCloud-Synchronisierung.</p>
      <PostCta slug="de/notizen-springt-nach-oben" path="/de/blog/notizen-springt-nach-oben" position="answer" ui={ui.cta} title="Teste eine Kopie in Pinto Notes">
        <p>Pinto Notes <a href="/blog/move-from-apple-notes">importiert Apple Notizen auf dem Mac</a> und lässt das Original unverändert. Probier dort eine Kopie der betroffenen Notiz aus, bevor du einen Wechsel erwägst. Es gibt keine Zusage, dass der Fehler dort ausbleibt.</p>
      </PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="neustart">Notizen schließen und das Gerät neu starten</h2>
    <p>Öffne auf dem iPhone den App-Umschalter, suche Notizen und streiche die App nach oben. Öffne sie danach wieder. Apple erklärt das in seiner <a href="https://support.apple.com/de-de/guide/iphone/iph83bfec492/ios">Anleitung zum Schließen einer App</a>. Springt die Ansicht weiter, starte das iPhone nach der <a href="https://support.apple.com/de-de/118259">Anleitung für dein Modell</a> neu.</p>
    <p>Auf dem Mac beendest du Notizen und öffnest es erneut. Für einen Neustart wählst du im Apple-Menü „Neustart“. Apple nennt das in seinen <a href="https://support.apple.com/de-de/guide/mac-help/mchlp2579/mac">allgemeinen Schritten bei App-Problemen</a>. Öffne anschließend die betroffene Notiz und wiederhole die Aktion, bei der sie sprang.</p>
    <p>Wenn Notizen einfriert oder ganz beendet wird, hilft der Beitrag <a href="/de/blog/notizen-app-funktioniert-nicht">Notizen funktioniert nicht</a> bei diesen anderen Symptomen.</p>
    <h2 id="update">Nach iOS- oder macOS-Updates suchen</h2>
    <p>Apple empfiehlt Updates, wenn eine App nicht wie erwartet funktioniert. Sichere dein Gerät vorher. Verbinde das iPhone mit Strom und WLAN. macOS-Updates enthalten auch Änderungen an der integrierten Notizen-App.</p>
    <Paths rows={[
      { on: "iPhone", steps: ["Einstellungen", "Allgemein", "Softwareupdate"] },
      { on: "Mac", steps: ["Apple-Menü", "Systemeinstellungen", "Allgemein", "Softwareupdate"] },
    ]} />
    <p>Folge Apples Anleitungen für <a href="https://support.apple.com/de-de/118575">iPhone-Updates</a> oder <a href="https://support.apple.com/de-de/108382">macOS-Updates</a>. Ein verfügbares Update ist einen Versuch wert, beweist aber keine Behebung dieses Fehlers.</p>
    <h2 id="icloud">iCloud prüfen, wenn außerdem Notizen fehlen</h2>
    <p>Eine springende Ansicht belegt kein Synchronisierungsproblem. Fehlt dieselbe Notiz aber auf einem anderen Gerät, sind Apples iCloud-Checks passend. Beide Geräte müssen denselben Apple Account verwenden, und Notizen muss in iCloud eingeschaltet sein.</p>
    <Paths rows={[
      { on: "iPhone", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen", "Dieses iPhone synchronisieren"] },
      { on: "Mac, macOS 15 oder neuer", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen", "Diesen Mac synchronisieren"] },
    ]} />
    <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
      alt="Notizen auf dem Mac fragt, ob iCloud für den Zugriff auf Notizen aller Geräte eingeschaltet werden soll."
      caption="Ein iCloud-Hinweis in Notizen unter macOS 27. Das prüft die Synchronisierung und behebt keinen Scrollfehler." />
    <p>Apples <a href="https://support.apple.com/de-de/121669">Artikel über fehlende iCloud-Notizen</a> empfiehlt einen Neustart und eine erneute Prüfung der Einstellung. Die <a href="https://support.apple.com/de-de/guide/icloud/mm8685520792/icloud">iCloud-Anleitung</a> nennt die Wege dorthin. Weitere Schritte stehen unter <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a>.</p>
    <h2 id="weiter">Währenddessen weiterschreiben</h2>
    <p>Diese Vorschläge sind keine von Apple dokumentierten Lösungen. Behalte die ursprüngliche Notiz, solange du vergleichst.</p>
    <ul>
      <li>Schreib den aktuellen Abschnitt in einer neuen Notiz und kopiere nur den nötigen Text hinein. Wenn es dort besser geht, füge später alles zusammen.</li>
      <li>Probier dieselbe Bearbeitung auf einem anderen Gerät. Geh nicht davon aus, dass es dort anders läuft.</li>
      <li>Öffne eine iCloud-Notiz testweise auf <a href="https://www.icloud.com/notes">icloud.com/notes</a>. Apple beschreibt den Zugriff im Browser. Wenn du dort bearbeiten kannst, kannst du vorerst dort weiterschreiben.</li>
    </ul>
    <p>Eine neue Notiz ohne Sprung beweist nicht, dass die Länge die Ursache war. Ein funktionierender Browser erklärt den App-Fehler auch nicht. Entscheidend ist, ob du deinen Text fertigstellen kannst.</p>
    <h2 id="noch-immer">Wenn Notizen weiter springt oder das Tippen hakt</h2>
    <p>Bevor du die App entfernst oder Accounts änderst, sichere wichtige Notizen separat. Apples <a href="https://support.apple.com/de-de/119876">allgemeine iPhone-Anleitung</a> warnt, dass beim Löschen einer App gespeicherte Daten verloren gehen können. <a href="/blog/back-up-apple-notes">Apple Notizen sichern</a> erklärt eine Kopie außerhalb der App.</p>
    <p>Notiere, wodurch der Sprung ausgelöst wird und ob die Ansicht oder die Schreibmarke springt. Gib diese Angaben an den <a href="https://support.apple.com/de-de/contact">Apple Support</a> weiter. Der Inhalt deiner Notiz muss dafür nicht in den Bericht.</p>
    <Keep title="Angaben für den Apple Support" text={SUPPORT_RECORD} />
  </LocalPostPage>;
}
