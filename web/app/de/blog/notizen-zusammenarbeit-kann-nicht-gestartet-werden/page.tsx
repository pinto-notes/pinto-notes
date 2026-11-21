import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-zusammenarbeit-kann-nicht-gestartet-werden");

// German version of /blog/apple-notes-unable-to-start-collaboration (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "notizen zusammenarbeit kann nicht gestartet werden", "iphone notizen zusammenarbeit kann
// nicht gestartet werden", "zusammenarbeit kann nicht gestartet werden" (icloud, "ein fehler ist aufgetreten die
// zusammenarbeit kann nicht gestartet werden"), "notizen zusammenarbeiten geht nicht", "apple notizen zusammenarbeiten
// funktioniert nicht", "iphone notizen teilen funktioniert nicht". That wording is what people type; Apple doesn't
// document the message, so the post doesn't quote it as an Apple string or say what causes it. Apple's own German words,
// read 21 Nov 2026, from support.apple.com/de-de/102462 (published 13 Nov 2026: device checks, „Dieses [Gerät]
// synchronisieren“ under „In iCloud gesichert“, Ordner „Alle iCloud“, Teilen-Taste, „Link teilen“ or „Kopie senden“ on iOS
// 27, „Personen, die du auswählst, können bearbeiten“, Taste „Zusammenarbeiten“, „Geteilte Notiz verwalten“,
// „Teilnehmer:in hinzufügen“, „Zusammenarbeiten“ on iOS 18 to 26, „Nur eingeladene Personen können bearbeiten“, pending
// requests, locked notes, Apple devices only on iOS 26 or earlier, 100 people); the iPhone guide (iOS 27)
// de-de/guide/iphone/iphe4d04f674 („Von dir ausgewählte Personen können bearbeiten“, „Von dir ausgewählte Personen“ or
// „Alle mit dem Link“, „Bearbeiten“ or „Nur anzeigen und laden“, request email to the owner, Stop sharing deletes the note
// from others' devices) and iphf177bb154 (Taste „Notizenaktionen“, „Entfernen“; notes shared in iCloud can't be locked;
// password, Face ID or Touch ID); the Mac guide (macOS 27) de-de/guide/notes/apd4e6e2c9a6 (upgraded iCloud notes, Einblendmenü,
// „Link teilen“, „Kann bearbeiten“ or „Kann ansehen und laden“, „Ordner teilen“, click the link then „Öffnen“, the
// invitation address must be on your Apple Account, Zwei-Faktor-Authentifizierung and iCloud-Schlüsselbund for instant
// changes), apd881ec5518 („Nicht mehr teilen“), glosedbd72f8 (Taste „Aktualisieren“ next to iCloud, no adding people until
// you upgrade, OS X 10.11 and iOS 9) and apd5be85b5ce (tags, mentions and title links need iOS 14.5 or macOS 11.3); the
// Mac guide de-de/guide/mac-help/mchl267b6234 (Bestätigungslink); the iCloud guide de-de/guide/icloud/mmc0cd6c83
// (participants need an Apple Account) and mmf181271571 („Einladung annehmen“, ask the owner to resend). Apple's German
// pages name the permission control two ways; the post gives both. The Mac message about a full owner's storage is the
// one the German sync post quotes from Notes' de strings. Facts are the English post's; the pictures are its English
// ones, described in German. Links go to the German iCloud and sync posts and to English posts where no German one exists.

const ui = UI.de;

const FAQ = [
  { q: "Was bedeutet es, wenn Notizen sagt, dass die Zusammenarbeit nicht gestartet werden kann?", a: [
    "Apple erklärt diese Meldung nicht. Apples Artikel zu Problemen bei der Zusammenarbeit nennt, was du prüfen kannst: beide auf dem neuesten iOS, mit einem Apple Account angemeldet und Notizen für iCloud aktiviert, die Notiz in iCloud und nicht gesperrt, und weniger als 100 Personen darin.",
  ] },
  { q: "Warum gibt es in Notizen unter iOS 27 kein „Zusammenarbeiten“ mehr?", a: [
    "In iOS 27 heißt die Option „Link teilen“. Tippe auf die Teilen-Taste, dann auf das Menü unter dem Notiztitel, und wähle „Link teilen“. „Zusammenarbeiten“ zeigen iOS 18 bis iOS 26 an derselben Stelle.",
  ] },
  { q: "Kann ich mit jemandem ohne iPhone an einer Notiz zusammenarbeiten?", a: [
    "Laut Apple brauchen Teilnehmende einen Apple Account, um eine geteilte Notiz anzusehen und zu bearbeiten. Unter iOS 26 oder älter geht Zusammenarbeit nur mit Personen, die ein Apple-Gerät haben und mit einem Apple Account angemeldet sind. Sonst schick eine Kopie der Notiz per E-Mail oder Nachricht.",
  ] },
  { q: "Warum kann ich eine Notiz nicht öffnen, die jemand mit mir geteilt hat?", a: [
    "Meistens ging die Einladung an eine E-Mail-Adresse oder Telefonnummer, die nicht zu deinem Apple Account gehört. Füg sie deinem Account hinzu, wenn Notizen danach fragt, oder bitte die Person, der die Notiz gehört, die Einladung noch einmal an die Adresse deines Apple Account zu senden.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-zusammenarbeit-kann-nicht-gestartet-werden"
      intro={<>Du tippst bei einer Notiz auf Teilen, und Notizen meldet, dass die Zusammenarbeit nicht gestartet werden kann, oder die Option „Zusammenarbeiten“ fehlt ganz. Hier sind Apples Checks, der wahrscheinlichste zuerst.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#checks", label: "Die Checks der Reihe nach" },
          { href: "#iphone", label: "Auf dem iPhone starten" },
          { href: "#mac", label: "Auf dem Mac starten" },
          { href: "#nicht-oeffnen", label: "Geteilte Notiz geht nicht auf" },
        ]}>
          <p>
            Zusammenarbeit in Apple Notizen braucht eine Notiz in iCloud, die nicht gesperrt ist, und alle müssen mit einem Apple Account
            angemeldet sein, mit Notizen für iCloud aktiviert. Apple verlangt außerdem bei beiden das neueste iOS. In iOS 27 heißt die
            Option „Link teilen“: Wenn du „Zusammenarbeiten“ suchst, ist es diese.
          </p>
          <PostCta slug="de/notizen-zusammenarbeit-kann-nicht-gestartet-werden" path="/de/blog/notizen-zusammenarbeit-kann-nicht-gestartet-werden" position="answer" ui={ui.cta}
            title="Willst du eine Notiz mit einem Link teilen?">
            <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Schick einen Link zu einer Notiz, und die Leute, die du einlädst, schreiben mit dir darin, ihren Cursor siehst du, während sie tippen. Geteilte Notizen sind verschlüsselt.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Zwei gezeichnete Notizen-Symbole, über jedem eine Person, verbunden durch eine gepunktete Linie mit einem Pause-Zeichen in der Mitte."
        caption="Eine geteilte Notiz braucht auf beiden Seiten dieselben paar Dinge, bevor es losgeht." />}
      faq={FAQ}
    >
      <h2 id="checks">Die Checks der Reihe nach</h2>
      <p>
        Apple dokumentiert diese Meldung nicht, also kann dir niemand allein an ihrem Wortlaut sagen, welcher Check fehlschlug. Das sind die
        Voraussetzungen, die Apple nennt, in der Reihenfolge, in der du sie am besten prüfst.
      </p>
      <Steps>
        <li id="option">
          <strong>Du wählst die richtige Option</strong>
          Tippe in iOS 27 auf die Teilen-Taste, dann auf das Menü unter dem Notiztitel, und wähle „Link teilen“. „Kopie senden“ schickt
          eine Kopie, die sonst niemand bearbeiten kann. In iOS 18 bis iOS 26 steht im selben Menü „Zusammenarbeiten“ oder „Kopie senden“.
        </li>
        <li id="in-icloud">
          <strong>Die Notiz liegt in iCloud</strong>
          Apples Schritte beginnen im Ordner „Alle iCloud“, und laut Apples Mac-Handbuch brauchst du aktualisierte iCloud-Notizen, um
          zusammenzuarbeiten. Eine Notiz unter „Auf meinem iPhone“, „Auf meinem Mac“ oder in einem Gmail-Account liegt nicht in iCloud.{" "}
          <a href="/de/blog/notizen-in-icloud-verschieben">Verschieb sie zuerst in einen iCloud-Ordner</a>.
        </li>
        <li id="gesperrt">
          <strong>Die Notiz ist nicht gesperrt</strong>
          An einer gesperrten Notiz kannst du nicht zusammenarbeiten, auch nicht an einem Ordner mit einer gesperrten Notiz darin. Öffne
          die Notiz und entsperre sie mit Passwort, Face ID oder Touch ID, dann tippe auf die Taste „Notizenaktionen“ und auf „Entfernen“.
        </li>
        <li id="icloud-an">
          <strong>Du bist angemeldet, mit Notizen für iCloud aktiviert</strong>
          Öffne Einstellungen, tippe auf deinen Namen, dann auf iCloud. Tippe unter „In iCloud gesichert“ auf Notizen und prüf, ob „Dieses
          iPhone synchronisieren“ aktiviert ist. Laut Apple brauchen die Leute, die du einlädst, das auch.
        </li>
        <li id="update">
          <strong>Ihr habt beide das neueste iOS</strong>
          Apple verlangt die neueste iOS-Version auf deinem iPhone und auf dem der anderen Person. Die Schritte mit „Zusammenarbeiten“ für
          iOS 26 und älter setzen iOS 18 oder neuer voraus.
        </li>
        <li id="andere-person">
          <strong>Die andere Person hat einen Apple Account</strong>
          Teilnehmende brauchen einen Apple Account, um eine geteilte Notiz anzusehen und zu bearbeiten. Unter iOS 26 oder älter kannst du
          laut Apple nur mit Personen zusammenarbeiten, die ein Apple-Gerät haben und mit einem Apple Account angemeldet sind. Wenn nicht,
          schick stattdessen eine Kopie.
        </li>
        <li id="anfrage">
          <strong>Deine Anfrage steht nicht mehr aus</strong>
          Hast du in iOS 27 Zugriff auf die Notiz einer anderen Person angefordert, ist die Anfrage vielleicht noch ausstehend. Die Person,
          der die Notiz gehört, sieht sie über die Taste „Zusammenarbeiten“, und laut Apple geht mit der Anfrage auch eine E-Mail an die
          Adresse ihres Apple Account.
        </li>
        <li id="limit">
          <strong>In der Notiz ist noch Platz</strong>
          Bis zu 100 Personen können an einer Notiz zusammenarbeiten.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="Das Menü More einer entsperrten Notiz in Notizen auf dem iPhone, oben ist Remove markiert, daneben Scan und Pin Note."
        caption="„Entfernen“ nimmt einer entsperrten Notiz die Sperre, damit du sie teilen kannst. Bild: Apple." />
      <p>
        Apples iPhone-Handbuch sagt außerdem, dass Notizen, die in iCloud geteilt werden, nicht gesperrt werden können. Solange sie geteilt
        ist, kannst du sie also nicht wieder sperren.
      </p>

      <h2 id="iphone">Zusammenarbeit auf dem iPhone starten</h2>
      <p className="label" id="iphone-ios-27"><strong>iOS 27</strong></p>
      <Steps>
        <li>Geh in Notizen zum Ordner „Alle iCloud“ und öffne die Notiz.</li>
        <li>Tippe oben auf dem Bildschirm auf die Teilen-Taste.</li>
        <li>Wähle unter dem Notiztitel „Link teilen“.</li>
        <li>Um zu ändern, wer mitmachen kann, tippe auf „Personen, die du auswählst, können bearbeiten“. Wähle „Von dir ausgewählte Personen“ oder „Alle mit dem Link“, und „Bearbeiten“ oder „Nur anzeigen und laden“.</li>
        <li>Wähle, wie du die Einladung sendest. Die erste Person tritt automatisch bei. Für weitere tippe auf die Taste „Zusammenarbeiten“, dann auf „Geteilte Notiz verwalten“ und auf „Teilnehmer:in hinzufügen“.</li>
      </Steps>
      <p className="label" id="iphone-ios-26"><strong>iOS 18 bis iOS 26</strong></p>
      <Steps>
        <li>Geh in Notizen zum Ordner „Alle iCloud“ und öffne die Notiz.</li>
        <li>Tippe auf die Teilen-Taste und wähle unter dem Notiztitel „Zusammenarbeiten“.</li>
        <li>Tippe auf „Nur eingeladene Personen können bearbeiten“, um festzulegen, wer zugreifen kann, was diese Personen dürfen und ob sie andere einladen können.</li>
        <li>Sende die Einladung mit Nachrichten oder Mail.</li>
      </Steps>
      <p>
        Die Schritte stammen aus Apples Artikel <a href="https://support.apple.com/de-de/102462" rel="noopener">Wenn du in der
        Notizen-App nicht mit anderen Personen zusammenarbeiten kannst</a> und aus dem iPhone-Handbuch, <a
        href="https://support.apple.com/de-de/guide/iphone/iphe4d04f674/ios" rel="noopener">Teilen von Notizen und Zusammenarbeiten auf
        dem iPhone</a>. Die beiden nennen die Einstellung leicht unterschiedlich: „Personen, die du auswählst, können bearbeiten“ und „Von
        dir ausgewählte Personen können bearbeiten“.
      </p>

      <h2 id="mac">Zusammenarbeit auf dem Mac starten</h2>
      <Steps>
        <li>Öffne die Notiz und klick in der Symbolleiste auf die Teilen-Taste.</li>
        <li>Klick auf das Einblendmenü und wähle „Link teilen“.</li>
        <li>Klick auf „Von dir ausgewählte Personen können bearbeiten“, um festzulegen, wer Zugriff hat, und wähle „Kann bearbeiten“ oder „Kann ansehen und laden“.</li>
        <li>Schick den Link, wie du willst. Um einen ganzen Ordner zu teilen, klick bei gedrückter Control-Taste darauf und wähle „Ordner teilen“.</li>
      </Steps>
      <p>
        Steht in der Seitenleiste von Notizen neben iCloud die Taste „Aktualisieren“, sind deine iCloud-Notizen nicht aktualisiert, und
        laut Apple kannst du dann keine Personen zu Notizen hinzufügen, bis du aktualisierst. Aktualisierte Notizen lassen sich auf Geräten
        mit älteren Versionen als OS X 10.11 oder iOS 9 nicht öffnen.
      </p>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notizen unter macOS 27 ohne iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Tasten System Settings und Cancel."
        caption="Das zeigt Notizen auf einem Mac, auf dem iCloud für Notizen deaktiviert ist. Aktiviere es, bevor du teilst." />
      <Paths rows={[
        { on: "Mac, macOS 15 oder neuer", steps: ["Systemeinstellungen", "Dein Name", "iCloud", "Notizen"] },
      ]} />

      <h2 id="nicht-oeffnen">Wenn du eine geteilte Notiz nicht öffnen kannst</h2>
      <ul>
        <li><strong>Öffne sie über den Link.</strong> Klick auf dem Mac auf den Link, den du bekommen hast, und dann auf „Öffnen“. Wähle auf icloud.com/notes den Link und dann „Einladung annehmen“. Nach dem ersten Mal bleibt die Notiz in deiner Notizenliste, auf jedem iPhone und Mac mit demselben Apple Account.</li>
        <li><strong>Prüf die Adresse, an die sie ging.</strong> Du kannst eine geteilte Notiz nur öffnen, wenn die E-Mail-Adresse oder Telefonnummer, an die die Einladung ging, zu deinem Apple Account gehört. Notizen fordert dich auf, sie hinzuzufügen, und auf dem Mac schicken die Systemeinstellungen zuerst einen Bestätigungslink an sie. Oder bitte die Person, der die Notiz gehört, die Einladung noch einmal an die Adresse zu senden, die du nutzt.</li>
        <li><strong>Aktualisiere das Gerät.</strong> Eine Notiz mit einem Tag, einer Erwähnung oder einem Link, der den Titel einer anderen Notiz zeigt, lässt sich nur unter iOS 14.5, macOS 11.3 oder neuer anzeigen. Auf älteren Geräten ist sie ausgeblendet, für dich und alle, mit denen sie geteilt ist.</li>
        <li><strong>Frag die Person, der die Notiz gehört.</strong> Beendet sie das Teilen, wird die Notiz laut Apple von den Geräten der anderen gelöscht.</li>
      </ul>

      <h2 id="aktualisiert-nicht">Wenn sie sich öffnet, aber nicht aktualisiert</h2>
      <p>
        Laut Apples Mac-Handbuch sehen Teilnehmende, die die Zwei-Faktor-Authentifizierung und den iCloud-Schlüsselbund aktiviert haben,
        Änderungen anderer sofort. Eine geteilte Notiz liegt in der iCloud der Person, der sie gehört. Ist deren Speicher voll, sagt Notizen
        auf dem Mac, dass deine Änderungen auf deinem Gerät gesichert sind und hochgeladen werden, sobald diese Person Platz schafft.{" "}
        <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a> hat die übrigen Sync-Checks.
      </p>

      <h2 id="pinto-notes">Eine Notiz in Pinto Notes teilen</h2>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="Das Teilen-Fenster in Pinto Notes auf dem iPhone: Emil als Eigentümer, Sara, die bearbeiten kann, und Jonas, der ansehen kann, eine Taste Invite People und Join by Link auf Can edit gestellt."
        caption="Share, dann Collaborate, in Pinto Notes auf dem iPhone." />
      <p>
        Pinto Notes, eine Notizen-App, die aussieht und funktioniert wie Apple Notizen auf iPhone und Mac, teilt eine Notiz mit einem Link.
        Tippe auf dem iPhone auf Share, dann auf Collaborate, dann auf Invite People, und schick den Link, wie du willst. Join by Link legt
        fest, ob der Link bearbeiten oder nur ansehen lässt, und Off heißt, dass nur die Leute die Notiz öffnen können, die schon darin
        sind. Der Cursor jeder Person erscheint mit ihrem Namen in der Notiz, während sie tippt, und die Notiz ist mit einem eigenen
        Schlüssel verschlüsselt. Hat jemand in der Notiz <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT oder Claude
        verbunden</a> (auf Englisch), kann auch diese KI darin schreiben, markiert mit dem Namen der Person, deren KI es war.
      </p>
      <p>
        Es hat eigene Grenzen. Alle schreiben aus Pinto Notes auf iPhone oder Mac; wer die App nicht hat und den Link öffnet, erfährt, wie
        er sie bekommt und beitritt. Eine Notiz mit Dateien, Fotos oder einer App darin lässt sich noch nicht teilen, und eine geteilte
        Notiz lässt sich nicht sperren. <a href="/blog/share-a-note-and-edit-it-together" hrefLang="en">Share a note and edit it
        together</a> (auf Englisch) hat die Details. Deine Apple Notizen kommen mit einem Import auf deinem Mac herüber (<a
        href="/blog/move-from-apple-notes" hrefLang="en">Umzug von Apple Notizen</a>, auf Englisch), und Apple Notizen bleibt, wie es
        war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
