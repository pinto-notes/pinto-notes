import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-app-funktioniert-nicht");

// German version of /blog/apple-notes-not-working (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "notizen app funktioniert nicht" (iphone, mac), "notizen app stürzt ab" ("notizen app stürzt immer ab was tun",
// iphone, apple), "notizen app hängt" ("notizen app hängt sich ständig auf", iphone), "notizen lässt sich nicht öffnen"
// ("notizen app lässt sich nicht öffnen"), "mac notizen stürzt ab", "notizen iphone funktioniert nicht". Apple's own German
// words and steps, read 21 Nov 2026, from support.apple.com/de-de/119876 (app stops responding, closes or won't open: close
// and reopen, restart, App Store „App-Updates“ then the iPhone software, delete and reload; published 31 Mar 2026), the
// iPhone guide (iOS 27) de-de/guide/iphone/iph83bfec492 (App-Umschalter, swipe up, Home-Bildschirm or App-Mediathek) and
// iph8903c3ee6 (force restart: Taste „Lauter“, Taste „Leiser“, Seitentaste until the Apple-Logo), de-de/118575 (back up,
// power, WLAN, Einstellungen, Allgemein, Softwareupdate; published 23 Sep 2026), de-de/118582 (integrierte Apps: deleting
// one removes verknüpfte Benutzerdaten, exact name in the App Store, Taste „Neuer Download“; published 23 Jun 2026); the
// Mac guide (macOS 27) de-de/guide/mac-help/mchlp2579 (Apple-Menü, „Sofort beenden“, unsaved changes may be lost,
// „Erneut öffnen“, „Neustart“, open another file, unplug new devices, uninstall other makers' plug-ins), de-de/102586
// (Befehlstaste-Q, Wahltaste-Befehlstaste-Esc, Ein-/Ausschalter up to 10 seconds; published 11 Dec 2025), de-de/108382
// (back up first, don't let the Mac sleep or close it during the install; published 14 Sep 2026), de-de/116946 (sicherer
// Modus, to find out whether software that loads at startup causes a problem; published 23 Dec 2025) and de-de/121669
// (Dieses [Gerät] synchronisieren, restart and check again; published 21 Mar 2025). The post writes Option and Command, as
// the other German posts and Apple's Notes guide do. The Mac's „unsupported features“ message is Notes' de string
// (Localizable.loctable, macOS 27.2), as in the German sync post. The Notes guide for Mac has no troubleshooting topic, so
// no Notes-specific cause is claimed. Facts are the English post's; the pictures are its English ones, described in
// German. Links go to the German sync post and to English posts where no German one exists.

const ui = UI.de;

const FAQ = [
  { q: "Warum stürzt Apple Notizen immer wieder ab?", a: [
    "Apple dokumentiert keine Ursache, die speziell Notizen betrifft. Apples Schritte sind die für jede App: schließen und wieder öffnen, das Gerät neu starten, dann die Software aktualisieren. Auf dem Mac rät Apple außerdem, ein gerade angeschlossenes Gerät zu trennen und Plug-ins anderer Hersteller zu entfernen.",
  ] },
  { q: "Löscht das Löschen der Notizen-App meine Notizen?", a: [
    "Laut Apple entfernt das Löschen einer integrierten App auch die verknüpften Benutzerdaten auf diesem Gerät. Notizen in iCloud liegen auch auf icloud.com/notes, also prüf sie zuerst dort. Notizen in „Auf meinem iPhone“ gibt es nur auf diesem Telefon, also lösch die App nicht, solange dort Notizen liegen.",
  ] },
  { q: "Wie beende ich Notizen auf dem Mac sofort?", a: [
    "Drück Option-Command-Esc oder wähle im Apple-Menü „Sofort beenden“, wähl Notizen aus und klick auf „Sofort beenden“. Apple warnt, dass nicht gesicherte Änderungen dabei verloren gehen können.",
  ] },
  { q: "Warum öffnet sich eine Notiz auf dem Mac nicht, seit ich das iPhone aktualisiert habe?", a: [
    "Eine Notiz aus einer neueren Version von Notizen kann Funktionen nutzen, die eine ältere nicht kennt. Der Mac sagt dann, dass die Notiz nicht unterstützte Funktionen verwendet, und bittet dich, auf die neueste Version von macOS zu aktualisieren. Nach dem Update öffnet der Mac die Notiz.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-app-funktioniert-nicht"
      intro={<>Notizen friert ein, schließt sich von selbst oder öffnet sich gar nicht. Hier sind Apples eigene Schritte, in Apples Reihenfolge, für iPhone und Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "Auf dem iPhone" },
          { href: "#mac", label: "Auf dem Mac" },
          { href: "#notizen-laden-nicht", label: "Notizen laden nicht" },
          { href: "#nach-update", label: "Nach einem Update" },
        ]}>
          <p>
            Schließ Notizen und öffne die App wieder, dann starte das Gerät neu. Friert sie danach noch ein oder beendet sich, aktualisiere
            iOS oder macOS. Das sind Apples Schritte für jede App, die nicht mehr reagiert. Öffnet sich Notizen, aber deine Notizen
            erscheinen nicht, prüf, ob Notizen auf diesem Gerät für iCloud aktiviert ist.
          </p>
          <PostCta slug="de/notizen-app-funktioniert-nicht" path="/de/blog/notizen-app-funktioniert-nicht" position="answer" ui={ui.cta}
            title="Willst du eine zweite Kopie deiner Notizen?">
            <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Es importiert deine Apple Notizen einmal auf dem Mac, als Kopie, und Apple Notizen bleibt, wie es war. Jede frühere Version einer Notiz bleibt erhalten.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="sicher">Prüf zuerst, ob deine Notizen sicher sind</h2>
      <p>
        Bevor du mehr versuchst als einen Neustart, öffne icloud.com/notes im Browser und melde dich mit deinem Apple Account an. Sind deine
        Notizen dort, liegen sie in iCloud, egal was die App auf deinem Gerät gerade tut. Apple führt iCloud Notizen außerdem auf seiner
        Systemstatus-Seite, unter apple.com/de/support/systemstatus. Steht dort eine Störung, warte, bis Apple sie als behoben markiert.
      </p>

      <h2 id="iphone">Auf dem iPhone: Notizen stürzt ab oder öffnet sich nicht</h2>
      <Steps>
        <li id="schliessen-iphone">
          <strong>Schließ Notizen und öffne die App wieder</strong>
          Öffne den App-Umschalter, streich zu Notizen und streich auf der App nach oben. Tippe dann auf dem Home-Bildschirm oder in der
          App-Mediathek auf Notizen.
        </li>
        <li id="neustart-iphone">
          <strong>Starte dein iPhone neu</strong>
          Das ist Apples nächster Schritt, wenn die App weiter nicht reagiert. Ist das iPhone selbst eingefroren und lässt sich nicht
          ausschalten, erzwinge einen Neustart: Drück kurz die Taste „Lauter“, dann kurz die Taste „Leiser“, dann halte die Seitentaste
          gedrückt, bis das Apple-Logo erscheint.
        </li>
        <li id="update-iphone">
          <strong>Aktualisiere iOS</strong>
          Apple rät, zuerst im App Store unter „App-Updates“ nachzusehen und die Software des iPhone zu aktualisieren, wenn es für die App
          nichts gibt. Mach vorher ein Backup des iPhone, schließ es an den Strom an und verbinde es mit dem WLAN.
          <Paths rows={[
            { on: "iPhone", steps: ["Einstellungen", "Allgemein", "Softwareupdate"] },
          ]} />
        </li>
        <li id="neu-laden">
          <strong>Notizen löschen und neu laden, als Letztes</strong>
          Notizen ist eine der integrierten Apps, die Apple löschen lässt. Laut Apple entfernt das Löschen auch die verknüpften
          Benutzerdaten auf dem Gerät, also prüf zuerst icloud.com/notes, und lass diesen Schritt aus, wenn du Notizen in „Auf meinem
          iPhone“ hast. Um die App zurückzuholen, such im App Store nach Notizen mit dem genauen Namen und tippe auf die Taste „Neuer
          Download“.
        </li>
      </Steps>
      <p>
        Die Schritte stammen aus Apples <a href="https://support.apple.com/de-de/119876" rel="noopener">Artikel zu Apps, die nicht mehr
        reagieren, unerwartet geschlossen oder nicht geöffnet werden</a>, mit den Details aus dem iPhone-Handbuch und aus Apples{" "}
        <a href="https://support.apple.com/de-de/118582" rel="noopener">Artikel zum Löschen integrierter Apps</a>.
      </p>

      <h2 id="mac">Auf dem Mac: Notizen friert ein oder wird beendet</h2>
      <Steps>
        <li id="sofort-beenden">
          <strong>Beende Notizen, notfalls sofort</strong>
          Probier zuerst Command-Q. Reagiert Notizen nicht, drück Option-Command-Esc oder wähle im Apple-Menü „Sofort beenden“, wähl
          Notizen aus und klick auf „Sofort beenden“. Apple warnt, dass nicht gesicherte Änderungen dabei verloren gehen können. Hat sich
          Notizen von selbst beendet, klick im Dialog, der dann erscheint, auf „Erneut öffnen“.
          <Paths rows={[
            { on: "Mac", steps: ["Apple-Menü", "Sofort beenden"], keys: "⌥⌘⎋" },
          ]} />
        </li>
        <li id="neustart-mac">
          <strong>Starte den Mac neu</strong>
          Wähle im Apple-Menü „Neustart“. Startet der Mac nicht neu, sagt Apple: Halte den Ein-/Ausschalter bis zu 10 Sekunden gedrückt,
          bis sich der Mac ausschaltet, und drück ihn dann noch einmal, um ihn einzuschalten.
        </li>
        <li id="andere-notiz">
          <strong>Öffne eine andere Notiz</strong>
          Apples Handbuch rät, eine andere Datei zu öffnen, denn vielleicht verursacht die ursprüngliche das Problem. In Notizen ist das
          eine andere Notiz.
        </li>
        <li id="update-mac">
          <strong>Aktualisiere macOS</strong>
          Laut Apple ist es sinnvoll, vorher ein Backup des Mac zu machen. Lass den Mac während der Installation nicht in den Ruhezustand
          gehen und klapp ihn nicht zu, bis sie fertig ist.
          <Paths rows={[
            { on: "Mac", steps: ["Systemeinstellungen", "Allgemein", "Softwareupdate"] },
          ]} />
        </li>
        <li id="zubehoer">
          <strong>Trenn Neues, entferne Zusätze</strong>
          Apple rät, ein gerade angeschlossenes Gerät zu trennen, etwa einen Drucker, und Plug-ins oder Optimierungen anderer Hersteller zu
          deinstallieren, die nach einem Update der App oder von macOS vielleicht nicht mehr funktionieren.
        </li>
      </Steps>
      <p>
        Die Schritte stammen aus Apples <a href="https://support.apple.com/de-de/guide/mac-help/mchlp2579/mac" rel="noopener">Eine App auf
        dem Mac ist blockiert oder wird unerwartet beendet</a> und <a href="https://support.apple.com/de-de/102586" rel="noopener">Das
        Beenden einer App auf dem Mac erzwingen</a>. Passiert es immer wieder, beschreibt Apples{" "}
        <a href="https://support.apple.com/de-de/116946" rel="noopener">Artikel zum sicheren Modus</a>, wie du prüfst, ob Software, die
        beim Starten des Mac geladen wird, ein Problem verursacht.
      </p>

      <h2 id="notizen-laden-nicht">Notizen öffnet sich, aber deine Notizen laden nicht</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notizen unter macOS 27 ohne iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Tasten System Settings und Cancel."
        caption="Das zeigt Notizen auf einem Mac, auf dem iCloud für Notizen deaktiviert ist." />
      <p>
        Läuft die App, aber die Liste ist leer, sind Apples Schritte: Stell sicher, dass „Dieses iPhone synchronisieren“ (oder „Diesen Mac
        synchronisieren“) für Notizen aktiviert ist, und sieh dann in Notizen nach. Erscheinen die Notizen noch nicht, starte das Gerät neu
        und prüf die Einstellung noch einmal. Laut Apple sollten Notizen, die schon in iCloud liegen, erscheinen, sobald die
        Synchronisierung fertig ist.
      </p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen"] },
        { on: "iPhone, iOS 26", steps: ["Einstellungen", "Dein Name", "iCloud", "Notizen"] },
        { on: "Mac, macOS 15 oder neuer", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen"] },
      ]} />
      <p>
        Das stammt aus <a href="https://support.apple.com/de-de/121669" rel="noopener">Wenn du deine iCloud-Notizen in der Notizen-App
        nicht siehst</a>. Erscheinen Notizen auf einem Gerät und auf dem anderen nicht, geht{" "}
        <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a> die übrigen Checks durch. Fehlt eine Notiz
        überall, sieh in „Zuletzt gelöscht“ nach, wo gelöschte Notizen 30 Tage bleiben:{" "}
        <a href="/blog/recover-deleted-apple-notes" hrefLang="en">How to recover deleted Apple Notes</a> (auf Englisch) zeigt, wo der
        Ordner auf jedem Gerät ist.
      </p>

      <h2 id="nach-update">Funktioniert nicht nach einem Update</h2>
      <p>
        Ist ein Gerät aktualisiert und das andere nicht, kann eine Notiz vom neueren Funktionen nutzen, die das ältere Notizen nicht kennt.
        Auf dem Mac zeigt Notizen dann „Diese Notiz verwendet nicht unterstützte Funktionen. Aktualisiere auf die neueste Version von
        macOS, um sie anzuzeigen oder zu bearbeiten.“ Die Notiz ist synchronisiert, aber dieser Mac kann sie nicht öffnen. Die Lösung ist,
        das Gerät zu aktualisieren, das hinterherhängt.
      </p>
      <p>
        Stürzt Notizen selbst seit einem Update ab, sind die Schritte oben trotzdem die, die Apple nennt. Sieh auch nach einem neueren
        Update, denn Apple zählt Softwareupdates zu den Lösungen für eine App, die sich unerwartet beendet.
      </p>

      <h2 id="naechstes-mal">Eine Kopie, fürs nächste Mal</h2>
      <p>
        Eine Kopie deiner Notizen außerhalb der Notizen-App lohnt sich, egal was schiefgeht.{" "}
        <a href="/blog/back-up-apple-notes" hrefLang="en">How to back up Apple Notes</a> (auf Englisch) zeigt, wie du eine behältst.
      </p>

      <h2 id="pinto-notes">Ein zweites Zuhause für deine Notizen</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="Das Fenster Import from Apple Notes in Pinto Notes auf dem Mac: Copies the notes you pick. Nothing in Apple Notes changes. Jede Notiz steht unter ihrem Ordner aus Apple Notizen, alle abgehakt, mit der Taste Import 8 Notes."
        caption="Import from Apple Notes in Pinto Notes auf dem Mac. Es kopiert deine Notizen und lässt Apple Notizen, wie es war." />
      <p>
        Pinto Notes repariert Apple Notizen nicht. Es ist eine Notizen-App, die aussieht und funktioniert wie Apple Notizen auf iPhone und
        Mac, und es kann eine zweite Kopie deiner Notizen halten: <a href="/blog/move-from-apple-notes" hrefLang="en">Der Umzug von Apple
        Notizen</a> (auf Englisch) ist ein einziger Import auf deinem Mac, und Apple Notizen bleibt, wie es war. Der Import liest deine
        Notizen über Apple Notizen, also muss sich Notizen auf diesem Mac öffnen lassen. Danach behält Pinto Notes jede frühere Version
        jeder Notiz. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
