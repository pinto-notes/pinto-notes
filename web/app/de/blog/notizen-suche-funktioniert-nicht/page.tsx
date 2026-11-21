import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-suche-funktioniert-nicht");

// German version of /blog/apple-notes-search-not-working (21 Nov 2026). Slug and title from Google's German autocomplete,
// read 21 Nov: "notizen suche funktioniert nicht" (iphone, apple, mac), "iphone notizen suche funktioniert nicht",
// "apple notizen suche funktioniert nicht", "notizen suche" (notizen suchen, iphone notizen suche funktioniert nicht),
// "notizen durchsuchen" (iphone, apple). Apple's own German words, read 21 Nov 2026, from the iPhone guide (iOS 27)
// de-de/guide/iphone/iphb8628c6b8 (Tags, handwriting in supported languages, objects in images, scanned text; locked notes
// show only their title; Taste „Notizenaktionen“, „In Notiz suchen“, „Anhänge einbeziehen“), iph3c511548 (Einstellungen,
// Suchen, an app, „App in ‚Suche‘ anzeigen“), iph92579feda (Einstellungen, Apps, Notizen, Suchen), iph83bfec492
// (App-Umschalter), iph841379c3d (turn iPhone off and on) and iph3e504502 (Allgemein, Softwareupdate); the Mac guide (macOS
// 27) de-de/guide/notes/not18ab658ed (what search finds, Taste „Suchen“, the Abwärtspfeil next to the magnifying glass,
// „Aktueller Account“, natural language examples „letzte Woche erstellt“ and „heute geändert“, Toptreffer, locked notes show
// only the title even when unlocked, Zuletzt gelöscht in results, Command-F, Darstellung, Anhangsübersicht einblenden,
// Spotlight includes notes, some features unavailable in other providers' accounts). That page says „Alle Konten“ in one
// step; the post says „Alle Accounts“, as support.apple.com/de-de/102476 and Notes' own de strings (Localizable.loctable,
// macOS 27.2) do. Also de-de/102476 (fehlende Notizen: update first, Notizen-Accounts, scroll to the Suchleiste, try other
// words, published 26 May 2026), de-de/102321 (Spotlight-Indizierung: after a software update, hours or even days, faster
// when idle, on power and on WLAN, the Settings notice and the Mac progress bar, the rebuild steps are for a disk or
// folder, „Datenschutz der Suchfunktion“, published 31 Aug 2026), de-de/guide/mac-help/mchl54d95e8a („Ergebnisse aus
// Apps“), mchlp2962 (unexpected search results), mchlpx1065 (macOS updates improve built-in apps like Notizen) and
// de-de/102586 (Command-Q, Wahltaste-Befehlstaste-Esc, „Sofort beenden“, „Neustart“, published 11 Dec 2025). The iCloud
// paths are the ones the German sync post verified. Facts are the English post's; the picture is its English one,
// described in German. Links go to the German sync and password posts and to English posts where no German one exists.

const ui = UI.de;

const FAQ = [
  { q: "Warum findet Notizen eine Notiz nicht, die es sicher gibt?", a: [
    "Apple nennt vier Gründe: Die Notiz ist gesperrt, dann sieht die Suche nur ihren Titel; die Suche läuft über einen Account statt über „Alle Accounts“; Notizen ist für den Account deaktiviert, in dem die Notiz liegt; oder das Wort, das du tippst, steht so nicht in der Notiz. Eine Notiz, die noch nicht auf dieses Gerät synchronisiert ist, taucht ebenfalls nicht auf.",
  ] },
  { q: "Durchsucht Apple Notizen PDFs und gescannte Dokumente?", a: [
    "Ja. Für den Mac nennt Apple angehängte PDFs, Dateinamen von Anhängen, Text in gescannten Dokumenten, Zeichnungen und Handschrift und den Inhalt von Bildern. Auf dem iPhone findet die Suche Handschrift in unterstützten Sprachen, Objekte in Bildern und gescannte Dokumente. Innerhalb einer Notiz durchsucht „In Notiz suchen“ mit „Anhänge einbeziehen“ auch PDFs.",
  ] },
  { q: "Warum erscheinen meine Notizen nicht in Spotlight?", a: [
    "Öffne auf dem iPhone Einstellungen, tippe auf Suchen, dann auf Notizen, und prüf „App in ‚Suche‘ anzeigen“. Unter Einstellungen, Apps, Notizen legt die Option Suchen außerdem fest, ob Inhalte aus Notizen in der Suche erscheinen. Auf dem Mac erscheinen Apps, die in den Systemeinstellungen unter Spotlight bei „Ergebnisse aus Apps“ deaktiviert sind, nicht in den Ergebnissen.",
  ] },
  { q: "Warum funktioniert die Suche in Notizen seit einem Update nicht mehr?", a: [
    "Apple dokumentiert kein Suchproblem in Notizen, das mit Updates zusammenhängt. Apple sagt aber, dass Spotlight seinen Index nach einem Softwareupdate neu aufbaut und dass das Stunden oder sogar Tage dauern kann. Apples Artikel zu fehlenden Notizen beginnt damit, jedes Gerät auf die neueste Software zu aktualisieren und dann mit „Alle Accounts“ zu suchen.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-suche-funktioniert-nicht"
      intro={<>Du hast ein Wort getippt, das sicher in einer Notiz steht, und Notizen findet nichts. Meistens ist die Notiz gesperrt, liegt in einem anderen Account oder ist noch nicht auf diesem Gerät angekommen. Hier sind Apples Checks, der wahrscheinlichste zuerst.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#was-sie-findet", label: "Was die Suche findet" },
          { href: "#checks", label: "Die Checks der Reihe nach" },
          { href: "#in-einer-notiz", label: "In einer Notiz oder einem PDF" },
          { href: "#spotlight", label: "Spotlight" },
          { href: "#nach-update", label: "Nach einem Update" },
        ]}>
          <p>
            Such mit „Alle Accounts“, und denk daran, dass eine gesperrte Notiz nur über ihren Titel auftaucht. Prüf dann, ob Notizen für den
            Account der Notiz aktiviert ist und ob die Notiz auf dieses Gerät synchronisiert ist. Findet die Suche sie immer noch nicht,
            beende Notizen und öffne die App neu, starte das Gerät neu und aktualisiere auf das neueste iOS oder macOS.
          </p>
          <PostCta slug="de/notizen-suche-funktioniert-nicht" path="/de/blog/notizen-suche-funktioniert-nicht" position="answer" ui={ui.cta}
            title="Willst du eine Notiz über ihr Thema finden?">
            <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und seine Suche liest jedes Wort in jeder Notiz. Verbinde ChatGPT oder Claude, und du kannst eine Notiz über das finden lassen, worum es darin geht.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-search-results" width={760} height={894} maxWidth={300}
        alt="Notizen auf dem iPhone mit der Suche nach Home: ein Toptreffer, Home renovation project, eine weitere Notiz, Kitchen remodel ideas, mit dem Tag #Home, und keine Anhänge gefunden."
        caption="Die Suche in Notizen auf dem iPhone, mit Toptreffern, Notizen und Anhängen. Bild: Apple." />}
      faq={FAQ}
    >
      <h2 id="was-sie-findet">Was die Suche in Notizen findet</h2>
      <p>
        Bevor du die Suche für kaputt hältst, hilft es zu wissen, was sie liest. Auf dem Mac findet die Suche laut Apple Treffer in:
      </p>
      <ul>
        <li>dem Text jeder Notiz</li>
        <li>den Dateinamen von Anhängen und in PDFs, die du angehängt hast</li>
        <li>Zeichnungen und handschriftlichem Text</li>
        <li>dem Inhalt eines Bilds (such nach „Fahrrad“, um ein Foto von einem zu finden)</li>
        <li>Text in einem gescannten Dokument</li>
      </ul>
      <p>
        Für das iPhone nennt Apple Tags, getippten Text, Handschrift in unterstützten Sprachen, Objekte in Bildern und Text in gescannten
        Dokumenten. Zwei Grenzen gelten auf beiden. Eine gesperrte Notiz zeigt in den Ergebnissen nur ihren Titel, auch wenn sie entsperrt
        ist. Und laut Apples Mac-Handbuch sind einige Funktionen in Accounts anderer Anbieter nicht verfügbar, etwa in einem Gmail-Account.
        Notizen in „Zuletzt gelöscht“ tauchen auf dem Mac in den Ergebnissen auf.
      </p>

      <h2 id="checks">Die Checks der Reihe nach</h2>
      <Steps>
        <li id="alle-accounts">
          <strong>Such in allen Accounts</strong>
          Tippe auf dem iPhone auf das Zurück-Symbol, bis deine Notizenliste erscheint, tippe auf die Suchleiste (vielleicht musst du
          dafür scrollen) und stell sicher, dass „Alle Accounts“ ausgewählt ist. Klick auf dem Mac auf die Taste „Suchen“, dann auf den
          Abwärtspfeil neben der Lupe, und wähle „Alle Accounts“. Diese Auswahl gibt es nur, wenn du mehr als einen Account hast, etwa
          iCloud und „Auf meinem Mac“.
        </li>
        <li id="gesperrt">
          <strong>Die Notiz ist vielleicht gesperrt</strong>
          Bei einer gesperrten Notiz sieht die Suche nur den Titel. Hast du nach einem Wort aus ihrem Text gesucht, öffne deine gesperrten
          Notizen mit Passwort, Face ID oder Touch ID und sieh sie von Hand durch. Passwort vergessen? Lies{" "}
          <a href="/de/blog/notizen-passwort-vergessen">Notizen-Passwort vergessen</a>.
        </li>
        <li id="account-an">
          <strong>Notizen ist für jeden Account aktiviert</strong>
          Eine Notiz in einem Gmail-, Yahoo- oder anderen Account erscheint nur, solange Notizen für diesen Account aktiviert ist. Tippe auf
          den Account, stell sicher, dass Notizen aktiviert ist, und wiederhole das für jeden Account.
          <Paths rows={[{ on: "iPhone", steps: ["Einstellungen", "Apps", "Notizen", "Notizen-Accounts"] }]} />
        </li>
        <li id="andere-woerter">
          <strong>Probier andere Wörter, dann such von Hand</strong>
          Apple rät selbst: Vielleicht suchst du nach einem Wort, einer Wortfolge oder einem Titel, der so nicht in der Notiz vorkommt.
          Probier ein anderes, öffne dann jeden Ordner und scroll. Auf dem Mac kannst du auch so tippen, wie du es sagen würdest, etwa
          „letzte Woche erstellt“ oder „heute geändert“.
        </li>
        <li id="synchronisiert">
          <strong>Die Notiz ist auf diesem Gerät angekommen</strong>
          Hast du die Notiz auf einem anderen iPhone oder Mac geschrieben, muss sie erst hier ankommen, bevor die Suche sie findet. Prüf auf
          beiden Geräten in den iCloud-Einstellungen, ob „Dieses iPhone synchronisieren“ oder „Diesen Mac synchronisieren“ für Notizen
          aktiviert ist. <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a> hat die übrigen Checks dazu.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Einstellungen", "Dein Name", "iCloud", "Alle anzeigen", "Notizen"] },
            { on: "Mac", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen"] },
          ]} />
        </li>
        <li id="neustart">
          <strong>Beende Notizen, öffne die App neu, dann starte neu</strong>
          Öffne auf dem iPhone den App-Umschalter, streich auf Notizen nach oben und öffne die App wieder. Hilft das nicht, rät Apple, das
          iPhone aus- und wieder einzuschalten. Drück auf dem Mac in Notizen Command-Q und öffne die App wieder; reagiert Notizen nicht,
          drück Option-Command-Esc und klick auf „Sofort beenden“. Klappt auch das nicht, wähle im Apple-Menü „Neustart“.
        </li>
        <li id="update">
          <strong>Aktualisiere auf die neueste Software</strong>
          Hier beginnt Apples Artikel zu fehlenden Notizen: Aktualisiere jedes Gerät auf das neueste iOS und macOS. Laut Apple enthalten
          macOS-Updates Verbesserungen für integrierte Apps wie Notizen.
          <Paths rows={[
            { on: "iPhone", steps: ["Einstellungen", "Allgemein", "Softwareupdate"] },
            { on: "Mac", steps: ["Systemeinstellungen", "Allgemein", "Softwareupdate"] },
          ]} />
        </li>
      </Steps>
      <p>
        Findet die Suche die Notiz in „Zuletzt gelöscht“, beweg sie zurück in einen Ordner, bevor die 30 Tage um sind.{" "}
        <a href="/blog/recover-deleted-apple-notes" hrefLang="en">How to recover deleted Apple Notes</a> (auf Englisch) hat die Schritte.
      </p>

      <h2 id="in-einer-notiz">In einer Notiz suchen, oder in einem PDF darin</h2>
      <p>
        Lange Notizen und angehängte PDFs haben ihre eigene Suche. Öffne auf dem iPhone die Notiz, tippe auf die Taste „Notizenaktionen“
        und dann auf „In Notiz suchen“. Um auch PDFs und andere Anhänge zu durchsuchen, öffne die Suchoptionen und wähle „Anhänge
        einbeziehen“, dann gib ein, was du suchst. Öffne auf dem Mac die Notiz und drück Command-F. Bei Notizen in iCloud oder „Auf meinem
        Mac“ kannst du mit Darstellung, Anhangsübersicht einblenden jeden Anhang durchsehen.
      </p>

      <h2 id="spotlight">Wenn Notizen nicht in Spotlight erscheinen</h2>
      <p>
        Spotlight ist die Suche für das ganze Gerät, und laut Apples Mac-Handbuch gehören Notizen zu den Ergebnissen. Wenn nicht:
      </p>
      <ul>
        <li><strong>iPhone:</strong> Öffne Einstellungen, tippe auf Suchen, scroll nach unten, tippe auf Notizen und aktiviere „App in ‚Suche‘ anzeigen“. Unter Einstellungen, Apps, Notizen legt die Option Suchen fest, ob Inhalte aus Notizen in der Suche und in Widgets erscheinen.</li>
        <li><strong>Mac:</strong> Öffne die Systemeinstellungen, klick auf Spotlight und sieh unter „Ergebnisse aus Apps“ nach. Apps, die dort deaktiviert sind, erscheinen nicht in den Spotlight-Ergebnissen.</li>
      </ul>
      <p>
        Apple beschreibt außerdem, wie du auf dem Mac einen Teil des Spotlight-Index neu aufbaust, über „Datenschutz der Suchfunktion“. Die
        Schritte sind für Dateien auf einer Festplatte oder in einem Ordner gedacht, und Apple sagt nicht, dass sie bei Notizen helfen.
      </p>

      <h2 id="nach-update">Wenn es nach einem Update anfing</h2>
      <p>
        Laut Apple baut Spotlight seinen Index nach der Installation eines Softwareupdates neu auf, und das kann Stunden oder sogar Tage
        dauern. Es geht schneller, wenn das Gerät nicht benutzt wird, am Strom hängt und im WLAN ist. Solange es läuft, zeigt das iPhone in
        der Einstellungen-App eine Mitteilung, dass die Suche und Siri optimiert werden, und auf dem Mac zeigt Command-Leertaste oben in
        Spotlight einen Fortschrittsbalken.
      </p>
      <p>
        Apple sagt nicht, ob die Suche in der Notizen-App auf diesen Index wartet, also kommen die Checks oben trotzdem zuerst.
      </p>

      <h2 id="pinto-notes">Eine Notiz über ihr Thema finden</h2>
      <p>
        Jeder Check oben setzt voraus, dass du dich an ein Wort aus der Notiz erinnerst. Weißt du nur noch, worum es ging, hilft eine
        Wortsuche nicht. Pinto Notes, die Notizen-App für iPhone und Mac, sieht aus und funktioniert wie Apple Notizen, und seine Suche liest
        jedes Wort in jeder Notiz. Wenn du <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT oder Claude
        verbindest</a> (auf Englisch), was eine Minute dauert, kannst du die Notiz auch in deinen eigenen Worten über ihr Thema finden
        lassen.
      </p>
      <p>
        Die Suche in Apple Notizen repariert es nicht. <a href="/blog/move-from-apple-notes" hrefLang="en">Der Umzug von Apple
        Notizen</a> (auf Englisch) ist ein einziger Import auf deinem Mac, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
