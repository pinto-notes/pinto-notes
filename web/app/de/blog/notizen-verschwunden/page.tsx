import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-verschwunden");

// German version of /blog/apple-notes-disappeared (21 Nov 2026). Slug and title from Google's German autocomplete, read
// 21 Nov: "notizen verschwunden" (iphone, apple, nach update), "iphone notizen verschwunden" (nach update, alle, plötzlich,
// ordner, app), "notizen weg" (iphone, was tun, nach update, apple), "notizen app verschwunden" (iphone), "apple notizen
// verschwunden", "mac notizen verschwunden", "notizen nach update weg iphone". People say verschwunden or weg, far more
// than fehlen. Apple's own German words and steps, read 21 Nov 2026, from support.apple.com/de-de/102476 (fehlende Notizen:
// update first, Notizen-Accounts, Ordner „Zuletzt gelöscht“, Bewegen, Papierkorb in Mail, Alle Accounts, locked notes
// searched by title only, Zurück-Symbol, other folders, published 26 May 2026), de-de/121669 (Dieses [Gerät]
// synchronisieren, restart and check again, published 21 Mar 2025), de-de/118582 (integrierte Apps löschen: verknüpfte
// Benutzerdaten, App Store, exact name, Taste „Neuer Download“, published 23 Jun 2026); the iPhone guide (iOS 27)
// de-de/guide/iphone/iph7262fd4fe („Alle anzeigen“ neben „In iCloud gesichert“, Notizen-Accounts, Auf meinem iPhone in
// iPhone backups), iph904eee369 (Zuletzt gelöscht, 30 days, swipe left, Bewegen, shared notes and the original link),
// iph92579feda (Standardaccount, Siri and the Widget „Notizen“), iph87abad19a (App-Mediathek, Suchfeld, finger on the app
// until the apps jiggle), iph248b543ca (removed from the Home-Bildschirm means moved to the App-Mediathek; app data
// stored in iCloud isn't deleted with the app); the Mac guide (macOS 27) de-de/guide/notes/not85d6f7b58 (Notizen,
// Accounts; a disabled account's notes aren't available), notc3b2d538b (no Zuletzt gelöscht without upgraded iCloud
// notes or with other accounts), not5585d71a8 (deleting a shared note), apd8b73d28be (Darstellung, Seitenleiste
// einblenden; Taste „Einblenden“ next to the account name); the iCloud guide de-de/guide/icloud/mm8685520792 (Diesen Mac
// synchronisieren on macOS 15 or later; no Apple Account on a device means no iCloud notes). Facts are the English
// post's; the pictures are its English ones, described in German. Links go to the German sync and iCloud posts and to
// English posts where no German one exists.

const ui = UI.de;

const FAQ = [
  { q: "Warum sind alle meine Notizen auf dem iPhone verschwunden?", a: [
    "Laut Apple wurden fehlende Notizen vielleicht versehentlich gelöscht, oder eine Einstellung muss geändert werden. Prüf, ob Notizen für iCloud aktiviert ist (Einstellungen, dein Name, iCloud), sieh in „Zuletzt gelöscht“ nach und stell sicher, dass Notizen für jeden anderen Account aktiviert ist, etwa Gmail oder Yahoo.",
  ] },
  { q: "Meine Notizen sind nach einem Update weg. Was tun?", a: [
    "Apples Schritte bei fehlenden Notizen beginnen damit, jedes Gerät auf das neueste iOS und macOS zu aktualisieren. Prüf danach, ob Notizen noch für iCloud aktiviert ist und ob du mit demselben Apple Account angemeldet bist wie vorher. Fehlen dann noch Notizen, rät Apple, das iPhone neu zu starten und die Einstellung noch einmal zu prüfen.",
  ] },
  { q: "Wie bekomme ich die Notizen-App zurück aufs iPhone?", a: [
    "Streich auf dem Home-Bildschirm über deine letzte Seite hinaus nach links bis zur App-Mediathek und such nach Notizen. Ist die App dort, leg den Finger darauf, um sie zurück auf den Home-Bildschirm zu holen. Wurde sie gelöscht, öffne den App Store, such nach Notizen und tippe auf die Taste „Neuer Download“.",
  ] },
  { q: "Löscht das Löschen der Notizen-App meine Notizen?", a: [
    "Laut Apple entfernt das Löschen einer integrierten App auch die verknüpften Daten auf diesem Gerät, während Daten, die in iCloud gesichert sind, beim Löschen einer App nicht gelöscht werden. Notizen in iCloud findest du außerdem unter icloud.com/notes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-verschwunden"
      intro={<>Gestern waren deine Notizen noch da, und jetzt ist die Liste leer oder ein Ordner fehlt. Apple sagt selbst: Fehlende Notizen wurden entweder versehentlich gelöscht, oder eine Einstellung muss geändert werden. Diese Checks gehen beides durch, die schnellsten zuerst.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#checks", label: "Die Checks der Reihe nach" },
          { href: "#auf-dem-mac", label: "Auf dem Mac" },
          { href: "#app-weg", label: "Die App ist weg" },
          { href: "#pinto-notes", label: "Eine zweite Kopie" },
        ]}>
          <p>
            Prüf zuerst, ob Notizen für iCloud aktiviert ist, und öffne dann „Zuletzt gelöscht“, wo eine gelöschte Notiz 30 Tage wartet.
            Stell danach sicher, dass Notizen auch für deine anderen Accounts aktiviert ist, etwa Gmail, und dass jedes Gerät mit demselben
            Apple Account angemeldet ist. Fehlt die Notizen-App selbst, findest du sie in der App-Mediathek oder im App Store.
          </p>
          <PostCta slug="de/notizen-verschwunden" path="/de/blog/notizen-verschwunden" position="answer" ui={ui.cta}
            title="Willst du jede Version deiner Notizen behalten?">
            <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac und behält jede frühere Version jeder Notiz. Auf dem Mac importiert es deine Apple Notizen einmal, als zweite Kopie, und Apple Notizen bleibt, wie es war.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notizen unter macOS 27 ohne iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Tasten System Settings und Cancel."
        caption="Das zeigt Notizen auf einem Mac, auf dem Notizen für iCloud deaktiviert ist. Die Notizen liegen weiter in iCloud, dieser Mac zeigt sie nur nicht an." />}
      faq={FAQ}
    >
      <h2 id="checks">Die Checks der Reihe nach</h2>
      <p>
        <a href="https://support.apple.com/de-de/102476" rel="noopener">Apples Artikel zu fehlenden Notizen</a> beginnt mit einem Schritt
        vor allen anderen: Aktualisiere jedes Gerät auf die neueste Version von iOS oder macOS, damit das Problem nicht an älterer Software
        liegt. Dann arbeite die Liste ab.
      </p>
      <Steps>
        <li id="icloud-an">
          <strong>Notizen ist für iCloud aktiviert</strong>{" "}
          Erscheinen deine iCloud-Notizen nicht, ist Apples Lösung, „Dieses iPhone synchronisieren“ zu aktivieren und dann in Notizen
          nachzusehen. Fehlen sie danach noch, starte das iPhone neu und prüf die Einstellung noch einmal. Laut Apple sollten die Notizen
          dann erscheinen und synchronisieren, und Inhalte, die vorher mit iCloud synchronisiert waren, sollten auftauchen, sobald die
          Synchronisierung fertig ist.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen", "Dieses iPhone synchronisieren"] },
            { on: "Mac, macOS 15 oder neuer", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen", "Diesen Mac synchronisieren"] },
          ]} />
        </li>
        <li id="zuletzt-geloescht">
          <strong>Zuletzt gelöscht</strong>{" "}
          Eine gelöschte Notiz landet im Ordner „Zuletzt gelöscht“, auf deinem iPhone, auf iCloud.com und auf deinen anderen Geräten mit
          demselben Apple Account, und bleibt dort 30 Tage. Geh auf dem iPhone zurück zur Ordnerliste, tippe auf „Zuletzt gelöscht“,
          streich auf der Notiz nach links und tippe auf „Bewegen“. Der Ordner erscheint nur, wenn etwas darin liegt.{" "}
          <a href="/blog/recover-deleted-apple-notes" hrefLang="en">How to recover deleted Apple Notes</a> (auf Englisch) zeigt jeden Weg,
          auch nach den 30 Tagen.
        </li>
        <li id="suche">
          <strong>Such mit „Alle Accounts“</strong>{" "}
          Tippe in der Notizenliste auf die Suchleiste und gib ein Wort oder den Titel ein, mit „Alle Accounts“ ausgewählt. Bei einer
          gesperrten Notiz durchsucht die Suche nur den Titel, also öffne gesperrte Notizen von Hand, mit Passwort, Face ID oder Touch ID.
          Findet die Suche nichts, tippe auf das Zurück-Symbol, bis deine Ordnerliste erscheint, und öffne jeden Ordner: Eine Notiz kann in
          einem liegen, mit dem du nicht gerechnet hast.
        </li>
        <li id="andere-accounts">
          <strong>Notizen ist für Gmail, Yahoo und andere Accounts aktiviert</strong>{" "}
          Notizen aus einem E-Mail-Account erscheinen nur, solange Notizen für diesen Account aktiviert ist. Prüf jeden Account. Ihre
          gelöschten Notizen landen nicht in „Zuletzt gelöscht“: Sieh in der Mail-App im Papierkorb dieses Accounts nach und kopiere die
          Notiz dann in eine neue.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Einstellungen", "Apps", "Notizen", "Notizen-Accounts", "Der Account", "Notizen"] },
            { on: "Mac", steps: ["Notizen", "Accounts", "Der Account", "Notizen"] },
          ]} />
        </li>
        <li id="gleicher-account">
          <strong>Jedes Gerät nutzt denselben Apple Account</strong>{" "}
          Laut Apple kannst du auf einem Gerät, auf dem du nicht mit deinem Apple Account angemeldet bist, nicht auf deine iCloud-Notizen
          zugreifen. Der Name oben in den Einstellungen auf dem iPhone oder oben in der Seitenleiste der Systemeinstellungen auf dem Mac
          ist der Account, den dieses Gerät nutzt. Was in iCloud liegt, siehst du, wenn du dich unter icloud.com/notes im Browser mit
          demselben Account anmeldest.
        </li>
        <li id="ein-geraet">
          <strong>Die Notizen lagen nur auf einem Gerät</strong>{" "}
          Notizen im Account „Auf meinem iPhone“ erscheinen nur auf diesem iPhone, Notizen in „Auf meinem Mac“ nur auf diesem Mac. Fehlt
          eine Notiz auf deinem anderen Gerät, sieh auf dem Gerät, das sie hat, nach der Überschrift über ihrem Ordner.{" "}
          <a href="/de/blog/notizen-in-icloud-verschieben">Notizen in iCloud verschieben</a> bringt sie auf jedes Gerät.
        </li>
        <li id="neustart">
          <strong>Neu starten, dann noch einmal prüfen</strong>{" "}
          Fehlen nach den Schaltern oben immer noch Notizen, ist Apples nächster Schritt ein Neustart und danach noch einmal ein Blick auf
          die iCloud-Einstellung. Erscheinen Notizen auf einem Gerät und auf dem anderen nicht, lies{" "}
          <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a>.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-recently-deleted" width={760} height={894} maxWidth={300}
        alt="Der Ordner Recently Deleted in Notizen auf dem iPhone mit vier Notizen, unter dem Hinweis, dass gelöschte Notizen nach 30 Tagen entfernt werden und das endgültige Löschen aus iCloud bis zu 40 weitere Tage dauern kann."
        caption="„Zuletzt gelöscht“ auf dem iPhone. Der Ordner erscheint nur, wenn eine Notiz darin liegt. Bild: Apple." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Die Einstellungen eines Gmail-Accounts auf dem iPhone mit Schaltern für Mail, Contacts, Calendars und Notes, alle aktiviert."
        caption="Die Notizen eines E-Mail-Accounts erscheinen nur, solange sein Schalter für Notizen aktiviert ist. Bild: Apple." />

      <h2 id="auf-dem-mac">Notizen oder Ordner fehlen auf dem Mac</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="Die Seitenleiste von Apple Notizen unter macOS 27 nur mit dem Bereich On My Mac: All on My Mac, Notes, ein Ordner und Recently Deleted. Kein Bereich iCloud."
        caption="Keine Überschrift iCloud in der Seitenleiste heißt: Dieser Mac zeigt deine iCloud-Notizen nicht. Prüf zuerst „Diesen Mac synchronisieren“." />
      <ul>
        <li><strong>Keine Seitenleiste.</strong> Wähle Darstellung, Seitenleiste einblenden.</li>
        <li><strong>Ein Account ohne Ordner darunter.</strong> Beweg den Zeiger über den Accountnamen in der Seitenleiste, bis die Taste „Einblenden“ erscheint, und klick darauf.</li>
        <li><strong>Ein ganzer Account fehlt.</strong> Wähle Notizen, Accounts, wähl den Account aus und aktiviere Notizen. Laut Apple sind die Notizen eines Accounts nicht verfügbar, solange Notizen für ihn deaktiviert ist.</li>
        <li><strong>Eine gelöschte Notiz.</strong> Klick auf „Zuletzt gelöscht“ und beweg die Notiz in einen anderen Ordner in der Seitenleiste. Hast du deine iCloud-Notizen nicht aktualisiert oder lag die Notiz in einem anderen Account, gibt es keinen Ordner „Zuletzt gelöscht“, und laut Apple werden gelöschte Notizen dann unwiderruflich von allen Geräten mit diesem Account entfernt.</li>
        <li><strong>Eine geteilte Notiz.</strong> Löscht die Person, der die Notiz gehört, eine geteilte Notiz, wird sie laut Apple auch von den Geräten aller Teilnehmenden gelöscht. Hast du eine Notiz gelöscht, die jemand mit dir geteilt hat, kannst du sie vielleicht über den ursprünglichen Link wieder öffnen, sofern das Teilen nicht beendet wurde.</li>
      </ul>

      <h2 id="app-weg">Wenn die Notizen-App selbst weg ist</h2>
      <p>
        Eine App, die du vom Home-Bildschirm entfernst, ist nicht gelöscht. Sie wandert in die App-Mediathek, und du kannst sie dort
        weiter nutzen.
      </p>
      <Steps>
        <li>Streich auf dem Home-Bildschirm über alle Seiten nach links, bis du zur App-Mediathek kommst.</li>
        <li>Tippe oben auf das Suchfeld und gib Notizen ein.</li>
        <li>Um die App zurückzuholen, leg den Finger auf das Symbol, bis die Apps wackeln und sie auf den Home-Bildschirm wandert, und heb dann den Finger.</li>
      </Steps>
      <p>
        Notizen ist eine der integrierten Apps, die Apple löschen lässt. Ist sie nicht in der App-Mediathek, öffne den App Store, such nach
        Notizen mit dem genauen Namen, tippe auf die Taste „Neuer Download“ und öffne die App vom Home-Bildschirm, wenn sie fertig ist.
        Laut Apple entfernt das Löschen einer integrierten App auch ihre verknüpften Daten auf dem Gerät, während Daten, die in iCloud
        gesichert sind, mit der App nicht gelöscht werden. Notizen in „Auf meinem iPhone“ sind in deinen iPhone-Backups in iCloud enthalten.
      </p>

      <h2 id="naechstes-mal">Damit es nicht wieder passiert</h2>
      <ul>
        <li>Stell unter Einstellungen, Apps, Notizen, Standardaccount iCloud ein. Der Standardaccount bestimmt, wo Notizen landen, die du mit Siri und dem Widget „Notizen“ erstellst.</li>
        <li>Behalte eine eigene Kopie der Notizen, die du nicht verlieren darfst. <a href="/blog/back-up-apple-notes" hrefLang="en">How to back up Apple Notes</a> (auf Englisch) hat eine Routine dafür.</li>
      </ul>

      <h2 id="pinto-notes">Eine zweite Kopie, mit jeder Version</h2>
      <p>
        „Zuletzt gelöscht“ hilft bei einer Notiz, die gelöscht wurde. Es hilft nicht bei einer Notiz, die jemand geändert hat, denn Apple
        Notizen hat <a href="/blog/apple-notes-version-history" hrefLang="en">keinen Versionsverlauf</a> (auf Englisch). Pinto Notes, die
        Notizen-App für iPhone und Mac, behält jede frühere Version jeder Notiz, also lässt sich ein Absatz zurückholen, der aus einer Notiz
        verschwunden ist.
      </p>
      <p>
        Notizen, die in Apple Notizen schon verloren sind, holt es nicht zurück.{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">Der Import aus Apple Notizen</a> (auf Englisch) ist ein einziger Import auf
        deinem Mac und gibt dir eine zweite Kopie, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
      <Figure shot={{ ...SHOTS.history, alt: "Der Versionsverlauf einer Notiz Groceries in Pinto Notes auf dem Mac: Versionen von dir auf iPhone und Mac, von ChatGPT und Claude Code, die geänderten Zeilen farbig hinterlegt und eine Taste Restore This Version." }}
        caption="Der Versionsverlauf in Pinto Notes auf dem Mac: jede frühere Version, wer sie gemacht hat, und Restore This Version." />
    </LocalPostPage>
  );
}
