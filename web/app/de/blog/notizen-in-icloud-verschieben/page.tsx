import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure, Steps } from "@/lib/PostParts";
import s from "@/lib/post-parts.module.css";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-in-icloud-verschieben");

// German version of /blog/move-apple-notes-to-icloud (language pilot, 17 Nov 2026). Slug and title from Google's German
// autocomplete ("notizen in icloud verschieben", "iphone notizen in icloud verschieben", "notizen auf meinem iphone in
// icloud verschieben", "lokale notizen in icloud verschieben"). Apple's own German words, read 17 Nov, from
// support.apple.com/de-de/118442 ("Notizen ... verwenden": Mehr-Taste, Notizen auswählen, Taste Ordner),
// de-de/102537 (Notiz anzeigen, Entfernen, IMAP accounts can't be locked), de-de/102476 (Gmail keeps deleted notes in
// the Papierkorb in Mail), de-de/108770 (Was bewirkt das iCloud-Backup?), the iPhone guide de-de/guide/iphone/ipha61270292
// (Bewegen), iph7262fd4fe (Auf meinem iPhone, Notizen-Accounts) and iph92579feda (Standardaccount), and the Mac guide
// de-de/guide/notes/notc3b2d538b (Accounts und Ordner), apd558a85438 (Darstellung, Seitenleiste einblenden on macOS 27,
// Ordner einblenden on macOS 26, Option-Taste) and apd97da26aed (Standardaccount, Account Auf meinem Mac aktivieren).
// The Mac app's Move to is "Bewegen in" in Notes' de strings on macOS 27.2. Facts are the English post's; the
// screenshots are its English ones, described in German. Links to other English posts are left out, and the two links
// to German posts point at this pilot's own translations. The checklist is Keep with a German Copy label.

const ui = UI.de;

const AFTER = {
  title: "Nach dem Umzug in iCloud",
  items: [
    "iCloud als Standardaccount festlegen, damit Siri und das Widget den alten nicht mehr nutzen",
    "Ein paar bewegte Notizen öffnen und Formatierung, Anhänge und Zeichnungen prüfen",
    "Die Notizen wieder sperren, die du für den Umzug entsperrt hast",
    "Notizen für den Gmail-Account oder „Auf meinem Mac“ abschalten, sobald er leer ist",
  ],
};

const FAQ = [
  { q: "Warum liegen manche meiner Notizen unter „Auf meinem iPhone“?", a: [
    "„Auf meinem iPhone“ ist ein Account für Notizen, die nur auf diesem Telefon bleiben. Er erscheint, sobald er unter Einstellungen, Apps, Notizen aktiviert ist. Neue Notizen von Siri oder dem Notizen-Widget landen in dem Account, der dort als Standardaccount eingestellt ist.",
  ] },
  { q: "Verschwinden die Notizen von meinem iPhone, wenn ich sie in iCloud verschiebe?", a: [
    "Nein. iCloud-Notizen bleiben auf deinem iPhone und erscheinen zusätzlich auf jedem anderen Gerät, das mit demselben Apple Account angemeldet ist und iCloud für Notizen aktiviert hat.",
  ] },
  { q: "Kann ich Gmail-Notizen in iCloud verschieben?", a: [
    "Ja. Gmail-Notizen erscheinen in Notizen als eigener Account, und du bewegst sie genauso in einen iCloud-Ordner wie Notizen aus „Auf meinem iPhone“. Danach kannst du Notizen für den Gmail-Account deaktivieren.",
  ] },
  { q: "Warum kann ich meine Gmail-Notizen nicht sperren?", a: [
    "Laut Apple lassen sich Notizen, die über IMAP synchronisieren, etwa mit Gmail oder Yahoo, nicht sperren. Liegt eine Notiz in iCloud, kannst du sie sperren, außer sie hat Tags oder eine angehängte Datei wie ein PDF oder eine Aufnahme.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-in-icloud-verschieben"
      intro={<>Ein Teil deiner Notizen liegt unter „Auf meinem iPhone“ oder Gmail und taucht deshalb nie auf deinen anderen Geräten auf. Sie in iCloud zu verschieben, kostet auf dem iPhone ein paar Taps und auf dem Mac einmal Ziehen.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#wo", label: "Wo deine Notizen liegen" },
          { href: "#vorher", label: "Was verloren gehen kann" },
          { href: "#iphone", label: "Auf dem iPhone" },
          { href: "#mac", label: "Auf dem Mac" },
          { href: "#gmail", label: "Gmail-Notizen" },
          { href: "#danach", label: "Nach dem Umzug" },
        ]}>
          <p>
            Öffne auf dem iPhone den Ordner unter „Auf meinem iPhone“ oder Gmail, tippe auf die Mehr-Taste, dann auf „Notizen auswählen“,
            wähle die Notizen aus, tippe auf die Taste „Ordner“ und wähle einen Ordner unter iCloud. Auf dem Mac ziehst du die Notizen auf
            einen iCloud-Ordner in der Seitenleiste. Halte dabei die Option-Taste gedrückt, wenn du sie kopieren statt bewegen willst.
            Entferne vorher die Sperre von gesperrten Notizen, und mach iCloud danach zum Standardaccount, sonst landen neue Notizen weiter
            im alten.
          </p>
          <PostCta slug="de/notizen-in-icloud-verschieben" path="/de/blog/notizen-in-icloud-verschieben" position="answer" ui={ui.cta}
            title="Eine Notizen-App ohne Accounts zum Aufräumen">
            <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac: Du meldest dich einmal an, und jede Notiz synchronisiert. Deine Apple Notizen importierst du in einem Schritt, ohne sie zu verändern.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="wo">Sieh nach, wo deine Notizen liegen</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="Die Ordnerliste in Notizen auf dem iPhone mit iOS 27: oben Quick Notes und Shared, dann die Überschrift iCloud mit ihren Ordnern, darunter Tags."
        caption="Die Überschrift über einem Ordner, hier iCloud, ist der Account, in dem seine Notizen liegen. Bild: Apple." />
      <p>
        Notizen ordnet Ordner nach Accounts, unter Überschriften wie iCloud, „Auf meinem iPhone“ und Gmail. Die Überschrift, unter der
        eine Notiz liegt, entscheidet, ob sie auf deinen anderen Geräten ankommt: Das tun nur iCloud-Notizen, mit allen Funktionen.
      </p>
      <p>Geh auf dem iPhone in Notizen zurück zur Ordnerliste. Auf dem Mac stehen dieselben Gruppen in der Seitenleiste. Ist sie ausgeblendet:</p>
      <Paths rows={[
        { on: "Mac, macOS 27", steps: ["Darstellung", "Seitenleiste einblenden"] },
        { on: "Mac, macOS 26", steps: ["Darstellung", "Ordner einblenden"] },
      ]} />
      <p>Gibt es gar keine Überschrift iCloud, ist Notizen für iCloud deaktiviert. Hier aktivierst du es:</p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen"] },
        { on: "iPhone, iOS 26", steps: ["Einstellungen", "Dein Name", "iCloud", "Notizen"] },
      ]} />
      <p>
        Liegen deine Notizen schon unter iCloud und kommen trotzdem nicht auf deinen anderen Geräten an, liegt das Problem woanders:{" "}
        <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht? 6 Checks für iPhone und Mac</a> findet es.
      </p>

      <h2 id="vorher">Bevor du etwas bewegst: was verloren gehen kann</h2>
      <p>
        <a href="https://support.apple.com/de-de/guide/notes/notc3b2d538b/mac" rel="noopener">Apples Handbuch</a> warnt, dass beim
        Bewegen von Notizen von einem Account in einen anderen Formatierungen und Anhänge unwiderruflich verloren gehen können. Behalte
        also die Originale, bis du dir die bewegten Notizen angesehen hast.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">In der Notiz</th><th scope="col">Was Apple sagt</th><th scope="col">Was du vorher tust</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Formatierungen und Anhänge</th><td>Können beim Bewegen für immer verloren gehen</td><td>Halte auf dem Mac beim Ziehen die Option-Taste gedrückt. Dann kopiert Notizen, statt zu bewegen</td></tr>
            <tr><th scope="row">Zeichnungen</th><td>Können zu Bilddateien werden, die du nicht mehr als Zeichnung bearbeiten kannst</td><td>Genauso: erst kopieren, dann prüfen</td></tr>
            <tr><th scope="row">Eine Sperre</th><td>Gesperrte Notizen lassen sich nur zwischen iCloud und dem Account auf deinem Mac bewegen und müssen dafür eventuell entsperrt werden</td><td>Sperre entfernen, Notiz bewegen, in iCloud wieder sperren</td></tr>
            <tr><th scope="row">Teilen</th><td>Nur iCloud-Notizen lassen sich teilen, eine geteilte Notiz liegt also schon dort</td><td>Nichts</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Apples iPhone-Handbuch beschreibt nur das Bewegen, eine Möglichkeit zum Kopieren nennt es nicht. Mach auf dem iPhone deshalb zuerst
        ein Backup: Notizen in „Auf meinem iPhone“ sind Teil deines iPhone-Backups.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="Das Menü More einer entsperrten Notiz in Notizen auf dem iPhone, oben ist Remove markiert, daneben Scan und Pin Note."
        caption="Notiz entsperren, dann Mehr, Entfernen, bevor du sie bewegst. Bild: Apple." />
      <p>
        Um die Sperre einer Notiz auf dem iPhone zu entfernen, tippe auf die gesperrte Notiz, dann auf „Notiz anzeigen“, und entsperre
        sie. Tippe dann auf die Mehr-Taste und wähle „Entfernen“. Jeder Account kann sein eigenes Passwort für Notizen haben. Hast du das
        Passwort einer gesperrten Notiz verloren, kann niemand sie öffnen. Warum, erklärt <a href="/de/blog/notizen-passwort-vergessen">Notizen-Passwort
        vergessen? Probier zuerst diese 5 Dinge</a>.
      </p>
      <p>
        Noch etwas, wenn du zwei Apple Accounts nutzt: Laut Apples Mac-Handbuch lässt sich eine geteilte Notiz nur zwischen Ordnern
        desselben iCloud-Accounts bewegen.
      </p>

      <h2 id="iphone">Notizen auf dem iPhone bewegen</h2>
      <Steps>
        <li>
          <strong>Öffne den Ordner mit den Notizen</strong>{" "}
          Zum Beispiel den Ordner Notizen unter „Auf meinem iPhone“ oder unter Gmail.
        </li>
        <li>
          <strong>Tippe auf die Mehr-Taste, dann auf „Notizen auswählen“</strong>{" "}
          Tippe jede Notiz an, die du bewegen willst.
        </li>
        <li>
          <strong>Tippe auf die Taste „Ordner“ und wähle einen Ordner unter iCloud</strong>{" "}
          Die Notizen verlassen den alten Account und erscheinen in diesem Ordner.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notizen auf dem iPhone mit iOS 27 im Auswahlmodus: 3 Selected, drei Notizen abgehakt und unten links eine Taste Folder, um sie zu bewegen."
        caption="Notizen auswählen, dann die Taste „Ordner“ unten links. Bild: Apple." />
      <p>
        Für eine einzelne Notiz legst du den Finger darauf, tippst auf „Bewegen“ und wählst den Ordner. Um einen ganzen Ordner umzuziehen,
        leg unter iCloud einen Ordner mit demselben Namen an und bewege seine Notizen hinein.
      </p>

      <h2 id="mac">Notizen auf dem Mac bewegen</h2>
      <Steps>
        <li>
          <strong>Wähle die Notizen in der Liste aus</strong>{" "}
          Sie können aus „Auf meinem Mac“, Gmail oder jedem anderen Account in der Seitenleiste kommen.
        </li>
        <li>
          <strong>Zieh sie auf einen Ordner unter iCloud in der Seitenleiste, oder klicke bei gedrückter Control-Taste und wähle „Bewegen in“</strong>{" "}
          Halte beim Loslassen die Option-Taste gedrückt, dann bekommst du Kopien und behältst die Originale.
        </li>
      </Steps>
      <PostFigure src="/blog/macos27/notes27-note-context-move-to-submenu" width={1416} height={960} maxWidth={600}
        alt="Apple Notizen unter macOS 27: Klick mit gedrückter Control-Taste auf eine Notiz, Move to und die Liste der Ordner, in die sie gehen kann."
        caption="Ganz ohne Ziehen: Klicke bei gedrückter Control-Taste auf eine Notiz, wähle „Bewegen in“ und dann den Ordner." />
      <p>
        „Auf meinem Mac“ ist der lokale Account des Mac, wie „Auf meinem iPhone“. Ist er leer, kannst du ihn abschalten: Entferne unter
        Notizen, Einstellungen das Häkchen bei „Account ‚Auf meinem Mac‘ aktivieren“. Solange er noch Notizen enthält, schaltet Notizen
        ihn nicht ab und bittet dich, sie erst zu bewegen oder zu löschen.
      </p>

      <h2 id="gmail">Gmail-Notizen sind anders</h2>
      <p>
        Notizen in einem Gmail-Account liegen in deinem Google-Account und synchronisieren mit Notizen über IMAP, das Protokoll, das auch
        Mail nutzt. Laut Apple funktionieren dort viele Funktionen von Notizen nicht. In der Praxis heißt das:
      </p>
      <ul>
        <li>Sie lassen sich nicht sperren.</li>
        <li>Unter macOS 26 lehnt Notizen Tags und das Anpinnen in einem IMAP-Account ab, mit einer Meldung, dass sie dort nicht unterstützt werden.</li>
        <li>Löschst du eine, behält Gmail sie meist im Papierkorb dieses Accounts in der Mail-App statt in „Zuletzt gelöscht“.</li>
      </ul>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Die Einstellungen eines Gmail-Accounts auf dem iPhone mit Schaltern für Mail, Contacts, Calendars und Notes, alle aktiviert."
        caption="Schalte hier Notizen aus, sobald der Gmail-Account keine Notizen mehr enthält. Mail funktioniert weiter. Bild: Apple." />
      <p>
        Laut Apple können Notizen, die du aus einem anderen Account in iCloud bewegst, alle Funktionen nutzen. Damit der Gmail-Account
        keine Notizen mehr synchronisiert, wenn er leer ist, deaktiviere Notizen für ihn. Mail funktioniert weiter, und Notizen, die noch in
        Gmail liegen, bleiben in deinem Google-Account.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Einstellungen", "Apps", "Notizen", "Notizen-Accounts", "Gmail", "Notizen"] },
      ]} />

      <h2 id="danach">Nach dem Umzug</h2>
      <p>Vier Dinge, und das erste überspringen die meisten.</p>
      <Keep title={AFTER.title} text={[AFTER.title, ...AFTER.items].join("\n")} copyLabel={ui.copy}
        note="Kopieren gibt dir einfache Zeilen. Markiere sie in Notizen und tippe auf die Checklisten-Taste.">
        <ul className={s.ticks}>{AFTER.items.map((it) => <li key={it}>{it}</li>)}</ul>
      </Keep>
      <p>Den Standardaccount legst du hier fest:</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Einstellungen", "Apps", "Notizen", "Standardaccount"] },
        { on: "Mac", steps: ["Notizen", "Einstellungen", "Standardaccount"] },
      ]} />
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Die allgemeinen Einstellungen von Apple Notizen auf einem Mac mit macOS 26: Sort notes by Date Edited, New notes start with Title und Default account auf iCloud gestellt, den Siri beim Erstellen von Notizen nutzt." }}
        ground="sky" caption="Notizen, Einstellungen auf einem Mac mit macOS 26. Im Standardaccount (hier Default account) landen neue Notizen, und Notizen sagt dazu, dass Siri ihn beim Erstellen von Notizen nutzt." />
      <p>
        Der Umzug ändert auch, was im iCloud-Backup deines iPhone steckt. Notizen in „Auf meinem iPhone“ sind darin enthalten, Notizen, die
        schon in iCloud liegen, lässt Apple weg. Löschst du eine Notiz in iCloud, verschwindet sie nach 30 Tagen in „Zuletzt gelöscht“ von
        allen Geräten. Behalte also auch eine eigene Kopie.
      </p>

      <h2 id="pinto-notes">Eine Notizen-App ohne Accounts zum Sortieren</h2>
      <Figure shot={{ ...SHOTS.consent, alt: "Pinto Notes fragt Allow ChatGPT to use your notes?: Die Notizen, die ChatGPT öffnet, gehen an OpenAI, gesperrte Notizen bleiben privat, dazu eine Nummer zum Abgleichen und die Tasten Allow und Don't Allow." }}
        caption="Eine KI bekommt deine Notizen erst, wenn du es auf deinem Gerät erlaubst." />
      <p>
        Pinto Notes, die Notizen-App für iPhone und Mac, hat kein „Auf meinem iPhone“ und keine Mail-Accounts. Du meldest
        dich einmal an, und jede Notiz synchronisiert zwischen deinen Geräten. ChatGPT und Claude können diese Notizen lesen und bearbeiten,
        nachdem du es erlaubt hast.
      </p>
      <p>
        Apple Notizen räumt es dir nicht auf, und es gibt keine Version für Windows, Android oder das Web. Der Umzug von Apple Notizen ist
        ein Import auf deinem Mac und lässt Notizen, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
