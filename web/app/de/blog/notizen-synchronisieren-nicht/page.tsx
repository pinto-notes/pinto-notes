import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-synchronisieren-nicht");

// German version of /blog/apple-notes-not-syncing (language pilot, 17 Nov 2026). Slug and title from Google's German
// autocomplete ("notizen synchronisieren nicht", "notizen synchronisieren nicht iphone", "notizen synchronisieren nicht
// mac", "notizen werden nicht synchronisiert icloud"). Apple's own German words, read 17 Nov, from
// support.apple.com/de-de/121669 ("Wenn du deine iCloud-Notizen in der Notizen-App nicht siehst"), de-de/108922
// ("iCloud-Speicher auf deinem Apple-Gerät verwalten"), de-de/102462 ("Wenn du in der Notizen-App nicht mit anderen
// Personen zusammenarbeiten kannst"), the iCloud guide de-de/guide/icloud/mm8685520792 ("iCloud für Notizen auf all
// deinen Geräten einrichten": Dieses iPhone synchronisieren, Diesen Mac synchronisieren, Alle anzeigen), the iPhone guide
// de-de/guide/iphone/iph92579feda (Standardaccount) and the Mac guide de-de/guide/notes/apd97da26aed (Standardaccount).
// The Mac app's messages (unsupported features, a full owner's storage, account security, the Aktualisieren button) are
// the de strings in Notes' Localizable.loctable on macOS 27.2. Apple's German status page lists the row as iCloud
// Notizen. Facts are the English post's; the screenshots are its English ones, described in German. The SyncChooser
// and the links to other English posts are left out.

const ui = UI.de;

const FAQ = [
  { q: "Warum synchronisieren meine Notizen nicht zwischen iPhone und Mac?", a: [
    "Meistens ist Notizen auf einem der Geräte für iCloud deaktiviert, oder die beiden sind mit verschiedenen Apple Accounts angemeldet. Notizen in „Auf meinem iPhone“ oder in Gmail synchronisieren nie über iCloud, und ein voller iCloud-Speicher stoppt die Synchronisierung ebenfalls. Apples eigene Lösung: in den iCloud-Einstellungen „Dieses iPhone synchronisieren“ prüfen und das Gerät neu starten, wenn danach noch Notizen fehlen.",
  ] },
  { q: "Wie erzwinge ich, dass Notizen synchronisiert?", a: [
    "Apple dokumentiert keine Taste, die eine Synchronisierung erzwingt. Apple rät, zu prüfen, ob Notizen für iCloud aktiviert ist, und das Gerät neu zu starten. Ob eine Notiz überhaupt in iCloud angekommen ist, siehst du unter icloud.com/notes im Browser.",
  ] },
  { q: "Synchronisieren Notizen aus „Auf meinem iPhone“ mit meinem Mac?", a: [
    "Nein. „Auf meinem iPhone“ ist für Notizen, die nur auf diesem Telefon bleiben, und „Auf meinem Mac“ ist dasselbe auf dem Mac. Bewege die Notizen in einen iCloud-Ordner, dann erscheinen sie auf jedem Gerät, das mit demselben Apple Account angemeldet ist.",
  ] },
  { q: "Warum aktualisiert sich eine geteilte Notiz nicht?", a: [
    "Prüf, ob alle mit ihrem Apple Account angemeldet sind und Notizen in iCloud aktiviert haben, und ob die Notiz gesperrt ist, denn gesperrte Notizen lassen sich nicht teilen. Ist der iCloud-Speicher der Person voll, der die Notiz gehört, behält Notizen deine Änderungen auf deinem Gerät und lädt sie hoch, sobald diese Person Platz schafft.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-synchronisieren-nicht"
      intro={<>Eine Notiz, die du auf dem iPhone geschrieben hast, fehlt auf dem Mac, oder umgekehrt. Ein Blick auf icloud.com zeigt dir, welches der beiden Geräte du dir vornehmen musst.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#welche-notizen", label: "Welche Notizen synchronisieren" },
          { href: "#checks", label: "Die Checks der Reihe nach" },
          { href: "#geteilt", label: "Geteilte Notizen" },
          { href: "#verschwunden", label: "Überall verschwunden" },
        ]}>
          <p>
            Apple Notizen synchronisiert über iCloud. Eine Notiz kommt nur dann auf deinem anderen Gerät an, wenn sie unter der Überschrift
            iCloud liegt und beide Geräte mit demselben Apple Account angemeldet sind, mit aktiviertem iCloud für Notizen. Prüf zuerst
            diese drei Dinge. Ein voller iCloud-Speicher und ein Mac mit älterem macOS als dein iPhone kommen danach.
          </p>
          <PostCta slug="de/notizen-synchronisieren-nicht" path="/de/blog/notizen-synchronisieren-nicht" position="answer" ui={ui.cta}
            title="Willst du sehen, wann deine Notizen synchronisiert wurden?">
            <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac und zeigt in den Einstellungen, wann es zuletzt synchronisiert hat. Deine Apple Notizen importierst du in einem Schritt, ohne sie zu verändern.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/notes-same-note-three-devices" width={814} height={412} maxWidth={600}
        alt="Dieselbe handgeschriebene Notiz, Urban planner, gleichzeitig in Notizen auf einem MacBook, einem Tablet und einem iPhone geöffnet."
        caption="So soll es aussehen: eine Notiz, auf jedem Gerät gleich. Bild: Apple." />}
      faq={FAQ}
    >
      <h2 id="welche-notizen">Welche Notizen synchronisieren, und wohin</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="Die Seitenleiste von Apple Notizen unter macOS 27 nur mit dem Bereich On My Mac: All on My Mac, Notes, ein Ordner und Recently Deleted. Kein Bereich iCloud."
        caption="Liegen deine Notizen unter „Auf meinem Mac“ (oder „Auf meinem iPhone“ auf dem Telefon), verlassen sie dieses Gerät nie. Danach suchst du als Erstes." />
      <p>
        Notizen ordnet Ordner nach Accounts, und die Überschrift, unter der eine Notiz liegt, bestimmt, wohin sie geht. Neue Notizen landen
        im Standardaccount: auf dem Mac unter Notizen, Einstellungen, Standardaccount, auf dem iPhone unter Einstellungen, Apps, Notizen,
        Standardaccount. Stell ihn auf iCloud, sonst landet die nächste Notiz, die Siri anlegt, vielleicht wieder am falschen Ort.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Die Notiz liegt unter</th><th scope="col">Kommt auf deinen anderen Geräten an?</th><th scope="col">Gut zu wissen</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">iCloud</th><td>Ja</td><td>Auf jedem Gerät mit demselben Apple Account, auf dem iCloud für Notizen aktiviert ist</td></tr>
            <tr><th scope="row">Auf meinem iPhone</th><td>Nein</td><td>Bleibt auf diesem iPhone. <a href="/de/blog/notizen-in-icloud-verschieben">Bewege sie in einen iCloud-Ordner</a></td></tr>
            <tr><th scope="row">Auf meinem Mac</th><td>Nein</td><td>Bleibt auf diesem Mac</td></tr>
            <tr><th scope="row">Gmail oder ein anderer E-Mail-Account</th><td>Nur über diesen E-Mail-Account</td><td>Geht nie über iCloud</td></tr>
            <tr><th scope="row">Eine mit dir geteilte Notiz</th><td>Ja</td><td>Sie liegt in der iCloud der Person, der sie gehört, also zählt deren Speicher</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="checks">Die Checks der Reihe nach</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notizen unter macOS 27 ohne iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Tasten System Settings und Cancel."
        caption="Das zeigt Notizen auf einem Mac, auf dem iCloud für Notizen aus ist. Einen anderen Sync-Status gibt es in Notizen unter macOS 27 nicht, ich habe nachgesehen." />
      <Steps>
        <li id="icloud-an">
          <strong>Notizen ist für iCloud aktiviert, auf beiden Geräten</strong>
          Der Schalter heißt „Dieses iPhone synchronisieren“ oder „Diesen Mac synchronisieren“. Apple sagt: Fehlen danach noch Notizen,
          starte das Gerät neu und prüf die Einstellung noch einmal.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen"] },
            { on: "iPhone, iOS 26", steps: ["Einstellungen", "Dein Name", "iCloud", "Notizen"] },
            { on: "Mac, macOS 15 oder neuer", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen"] },
          ]} />
        </li>
        <li id="gleicher-account">
          <strong>Beide Geräte nutzen denselben Apple Account</strong>
          Der Name oben in den Einstellungen auf dem iPhone und oben in den Systemeinstellungen auf dem Mac ist der Account, mit dem das
          Gerät synchronisiert. Ein Arbeits-Mac, der mit einem Apple Account der Firma angemeldet ist, zeigt die Notizen von deinem
          privaten iPhone nicht.
        </li>
        <li id="icloud-hat-sie">
          <strong>iCloud hat die Notiz</strong>
          Öffne icloud.com/notes im Browser und melde dich mit demselben Apple Account an. Ist die Notiz da, liegt das Problem bei dem
          Gerät, auf dem sie fehlt. Ist sie nicht da, hat das Gerät, auf dem du sie geschrieben hast, sie noch nicht hochgeladen. Fang
          dann mit diesem an.
        </li>
        <li id="status">
          <strong>iCloud Notizen läuft</strong>
          Apple führt iCloud Notizen auf seiner Systemstatus-Seite, unter apple.com/de/support/systemstatus. Steht dort eine Störung,
          hilft keine Einstellung auf deiner Seite. Warte, bis Apple sie als behoben markiert.
        </li>
        <li id="speicher">
          <strong>Dein iCloud-Speicher ist nicht voll</strong>
          Laut Apple bleiben iCloud-Apps auf deinen Geräten nicht mehr auf dem neuesten Stand, wenn dein iCloud-Speicher voll ist, und
          Notizen ist eine davon. Öffne Einstellungen, tippe auf deinen Namen und dann auf iCloud, um zu sehen, wie viel du nutzt. Wenn
          du Platz schaffst oder einen größeren Speicherplan nimmst, geht die Synchronisierung weiter.
        </li>
        <li id="update">
          <strong>Kein Gerät hängt bei Updates hinterher</strong>
          Eine Notiz aus einer neueren Version von Notizen kann Funktionen nutzen, die eine ältere nicht kennt. Auf dem Mac zeigt Notizen
          sie dann mit der Meldung „Diese Notiz verwendet nicht unterstützte Funktionen. Aktualisiere auf die neueste Version von macOS,
          um sie anzuzeigen oder zu bearbeiten.“ Die Notiz ist synchronisiert, aber dieser Mac kann sie nicht öffnen. Seit iOS 27 am
          14. September erschienen ist, ist ein iPhone mit iOS 27 neben einem Mac, der noch auf macOS 26 läuft, der wahrscheinliche
          Fall. Die Lösung ist, den Mac auf macOS 27 zu aktualisieren.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="Der iCloud-Bildschirm in den Einstellungen auf dem iPhone: 4,1 von 50 GB Speicher belegt, und unter Saved to iCloud Photos, Drive, Passwords, Notes mit 29 Objekten, Messages und Mail."
        caption="Einstellungen, dein Name, iCloud: wie voll dein Speicher ist und was Notizen dort ablegt. Bild: Apple." />
      <p>
        Apple dokumentiert keine Taste, die eine Synchronisierung erzwingt, es gibt also nichts zu drücken. Für viel ältere Geräte sagt
        Apples Mac-Handbuch: Aktualisierte iCloud-Notizen lassen sich vor OS X 10.11 oder iOS 9 nicht öffnen, und die Seitenleiste von
        Notizen zeigt neben iCloud eine Taste „Aktualisieren“, bis du aktualisierst.
      </p>

      <h2 id="geteilt">Wenn sich eine geteilte Notiz nicht aktualisiert</h2>
      <PostFigure src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Zwei gezeichnete Notizen-Symbole, über jedem eine Person, verbunden durch eine gepunktete Linie mit einem Pause-Zeichen in der Mitte."
        caption="Eine geteilte Notiz wartet, wenn eine Seite nicht synchronisieren kann." />
      <ul>
        <li>Alle müssen mit einem Apple Account angemeldet sein, mit aktiviertem iCloud für Notizen. <a href="https://support.apple.com/de-de/102462" rel="noopener">Apples Anleitung zur Zusammenarbeit in Notizen</a> verlangt außerdem die neueste iOS-Version.</li>
        <li>An einer gesperrten Notiz kannst du nicht zusammenarbeiten, auch nicht an einem Ordner, der eine enthält.</li>
        <li>Eine geteilte Notiz liegt in der iCloud der Person, der sie gehört. Ist deren Speicher voll, sagt Notizen auf dem Mac, dass deine Änderungen nicht hochgeladen werden können, auf deinem Gerät gesichert sind und hochgeladen werden, sobald diese Person Platz schafft.</li>
        <li>Bittet Notizen dich, die Accountsicherheit zu aktualisieren, „um Änderungen in Echtzeit zu sehen und die neuesten Funktionen zur Zusammenarbeit nutzen zu können“, siehst du die Änderungen der anderen erst live, wenn du es tust.</li>
      </ul>
      <p>
        In iOS 27 ist das Teilen umgezogen: Tippe auf die Teilen-Taste, dann auf „Link teilen“ oder „Kopie senden“, und leg unter
        „Personen, die du auswählst, können bearbeiten“ fest, wer bearbeiten darf.
      </p>

      <h2 id="verschwunden">Wenn Notizen auf allen Geräten verschwunden sind</h2>
      <PostFigure src="/blog/macos27/notes-recently-deleted-window" width={1520} height={1003} maxWidth={560}
        alt="Apple Notizen unter macOS 27 im Ordner Recently Deleted mit zwei Notizen, Fresh pasta dough und Gift ideas, unter dem Hinweis, dass gelöschte Notizen nach 30 Tagen von deinen Geräten entfernt werden."
        caption="Eine Notiz, die du auf irgendeinem Gerät löschst, wartet hier 30 Tage." />
      <p>
        Löschst du eine Notiz auf einem Gerät, ist sie überall weg, und das kann wie ein Sync-Problem aussehen. Gelöschte Notizen bleiben
        30 Tage im Ordner „Zuletzt gelöscht“, auf jedem Gerät, das mit demselben Apple Account angemeldet ist. Eine eigene Kopie deiner
        Notizen hilft außerdem.
      </p>

      <h2 id="pinto-notes">Eine Notizen-App, die ihren Sync zeigt</h2>
      <PostFigure src="/blog/drawn/sync-ok" width={1200} height={750} maxWidth={560}
        alt="Eine gezeichnete weiße Wolke mit einem grünen Haken und einer kleinen Uhr daneben."
        caption="Pinto Notes zeigt, wann es zuletzt synchronisiert hat, und warum nicht, wenn es gerade nicht geht." />
      <p>
        Apple Notizen zeigt nicht an, wann es zuletzt synchronisiert hat, deshalb braucht es sechs Checks. Pinto Notes, die Notizen-App
        für iPhone und Mac, die ich entwickle, synchronisiert über einen eigenen verschlüsselten Dienst statt über iCloud, also spielt dein
        iCloud-Speicher keine Rolle. In den Einstellungen steht der Sync-Status, etwa „last synced 9:41“ oder der Grund, warum gerade
        nichts synchronisiert, neben einer Taste Sync Now. Wurde dieselbe Notiz auf zwei Geräten geändert, bevor sie synchronisiert haben,
        gewinnt die neuere Änderung, und die andere bleibt als Konfliktkopie erhalten. So geht keine verloren.
      </p>
      <p>
        Apple Notizen repariert es dir nicht, und es gibt keine Version für Windows, Android oder das Web. Der Umzug von Apple Notizen ist
        ein Import auf deinem Mac und lässt Notizen, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
