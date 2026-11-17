import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, FigurePair, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-passwort-vergessen");

// German version of /blog/forgot-apple-notes-password (language pilot, 17 Nov 2026). Slug and title from Google's
// German autocomplete ("notizen passwort vergessen", "iphone notizen passwort vergessen", "gesperrte notizen passwort
// vergessen"). Apple's own German words for every menu and button, from support.apple.com/de-de/102537
// ("Informationen zum Sperren oder Entsperren von Notizen", read 17 Nov), support.apple.com/de-de/guide/notes/apdb021fd5a9/mac
// ("Passwort für gesperrte Notizen ändern", read 17 Nov) and support.apple.com/de-de/guide/notes/apd97da26aed/mac
// ("Ändern von Einstellungen in der App Notizen auf dem Mac", read 17 Nov). Apple calls the hint Passworthinweis on
// iPhone and Merkhilfe on the Mac (the Mac app's own "Hint: %@" is "Merkhilfe: %@" in its de strings), so the post
// says Merkhilfe and names the iPhone word once. Facts are the English post's; the screenshots are its English ones,
// described in German. The ResetChooser and the links to other English posts are left out.

const ui = UI.de;

const FAQ = [
  { q: "Kann Apple meine gesperrten Notizen wiederherstellen, wenn ich das Passwort vergesse?", a: [
    "Nein. Apple sagt, dass es keinen Zugriff auf gesperrte Notizen hat und dir nicht helfen kann, sie zu öffnen, wenn du dein Passwort für Notizen vergessen hast. Gesperrte Notizen sind mit einem Schlüssel verschlüsselt, der aus diesem Passwort entsteht.",
  ] },
  { q: "Entsperrt das Zurücksetzen des Passworts meine alten Notizen?", a: [
    "Nein. Nach dem Zurücksetzen kannst du neue Notizen mit einem neuen Passwort sperren. Notizen, die du vorher gesperrt hast, behalten das alte Passwort und brauchen es weiterhin.",
  ] },
  { q: "Kann ich eine gesperrte Notiz mit Face ID oder Touch ID öffnen?", a: [
    "Probier es aus: Wenn du Face ID oder Touch ID für Notizen aktiviert hast, nennt Apple das als Weg, eine gesperrte Notiz anzusehen. Das Passwort ändern kannst du damit nicht, dafür brauchst du immer das aktuelle.",
  ] },
  { q: "Funktionieren Apps, die versprechen, Notizen zu entsperren?", a: [
    "Sie können eine gesperrte Notiz ohne ihr Passwort nicht entschlüsseln. Der Schlüssel entsteht aus dem Passwort, also kann ein Tool höchstens Passwörter raten. Sei vorsichtig, wenn eine App dafür das Passwort deines Apple Accounts will.",
  ] },
  { q: "Wie verhindere ich das beim nächsten Mal?", a: [
    "Nimm den Code deines Geräts statt eines eigenen Passworts für Notizen (ab iOS 16, mit aktiviertem iCloud-Schlüsselbund), oder speichere das Passwort für Notizen in einem Passwort-Manager.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="notizen-passwort-vergessen"
      intro={<>Du hast das Passwort für deine gesperrten Notizen vergessen? Hier steht, was sich zu probieren lohnt, in der Reihenfolge, in der ich vorgehen würde, und was du nicht als Erstes tun solltest.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#zuerst-probieren", label: "Probier zuerst das" },
          { href: "#zuruecksetzen-iphone", label: "Zurücksetzen auf dem iPhone" },
          { href: "#zuruecksetzen-mac", label: "Zurücksetzen auf dem Mac" },
          { href: "#naechstes-mal", label: "Damit es nicht wieder passiert" },
        ]}>
          <PostFigure src="/blog/macos27/notes-locked-hint" width={720} height={580} maxWidth={360}
            alt="Eine gesperrte Notiz in Apple Notizen unter macOS 27 fragt nach dem Passwort. Unter dem Feld steht die Merkhilfe City and year of the trip."
            caption="Nach einem falschen Passwort zeigt Notizen die Merkhilfe, die du festgelegt hast." />
          <p>
            Niemand kann eine gesperrte Notiz ohne ihr Passwort öffnen, weder Apple noch eine Entsperr-App. Probier zuerst Face ID oder
            Touch ID, die Merkhilfe und den Code deines Geräts. Klappt nichts davon, setz das Passwort zurück: Das ändert es nur für
            Notizen, die du ab jetzt sperrst. Die alten behalten ihr altes Passwort.
          </p>
          <PostCta slug="de/notizen-passwort-vergessen" path="/de/blog/notizen-passwort-vergessen" position="answer" ui={ui.cta}
            title="Willst du Notizen, die dich nie aussperren?">
            <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac, behält jede Version jeder Notiz, und ChatGPT oder Claude können darin arbeiten. Deine Apple Notizen importierst du in einem Schritt.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760}
        phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }}
        alt="Das Fenster von Apple Notizen unter macOS 27 mit einer gesperrten Notiz: This note is locked. Enter your notes password to view this note. Unter dem Passwortfeld: Hint: City and year of the trip."
        caption="Eine gesperrte Notiz in Notizen unter macOS 27, nach ein paar Fehlversuchen. Die Merkhilfe steht unter dem Passwortfeld. Auf dem iPhone sieht es genauso aus." />}
      faq={FAQ}
    >
      <h2 id="warum">Warum niemand sie für dich öffnen kann</h2>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300}
        alt="Eine gesperrte Notiz auf dem iPhone: ein graues Schloss, der Text This note is locked und eine Taste View Note."
        caption="Eine gesperrte Notiz auf dem iPhone. Bild: Apple." />
      <p>
        Eine gesperrte Notiz ist mit einem Schlüssel verschlüsselt, der aus deinem Passwort für Notizen entsteht. Apples
        Sicherheitshandbuch beschreibt es so: Der Schlüssel wird aus deiner Passphrase abgeleitet, und die Notiz und ihre Anhänge werden
        damit verschlüsselt. Apple sagt, dass es <a href="https://support.apple.com/de-de/102537" rel="noopener">keinen Zugriff auf
        gesperrte Notizen hat</a> und dir nicht helfen kann, wenn du das Passwort vergisst. Genau dafür sperrt man eine Notiz. Und
        deshalb bringt auch das Zurücksetzen des Passworts alte Notizen nicht zurück.
      </p>

      <h2 id="zuerst-probieren">Probier zuerst das</h2>
      <Steps>
        <li>
          <strong>Face ID oder Touch ID</strong>
          Wenn du es für Notizen aktiviert hast, öffne die gesperrte Notiz, tippe auf „Notiz anzeigen“ und nutze es. Apple nennt das als
          Weg, eine gesperrte Notiz anzusehen.
        </li>
        <li>
          <strong>Die Merkhilfe</strong>
          Gib ein paar Mal ein falsches Passwort ein, dann zeigt Notizen die Merkhilfe, falls du eine festgelegt hast. Auf dem iPhone
          heißt sie Passworthinweis.
        </li>
        <li>
          <strong>Dein Gerätecode oder das Anmeldepasswort des Mac</strong>
          Seit iOS 16 lassen sich Notizen mit dem Code des Geräts sperren statt mit einem eigenen Passwort. Wenn du das gewählt hast,
          nimm den Code deines iPhone, oder auf dem Mac dein Anmeldepasswort.
        </li>
        <li>
          <strong>Ältere Passwörter</strong>
          Wenn du dein Passwort für Notizen schon einmal zurückgesetzt hast, behalten ältere Notizen das Passwort, mit dem sie gesperrt
          wurden. Gibst du bei einer älteren Notiz das aktuelle ein, sagt Notizen, dass es falsch ist, und zeigt die Merkhilfe für das
          alte.
        </li>
        <li>
          <strong>Ein Passwort-Manager</strong>
          Wenn du einen nutzt, such darin nach „Notizen“. Vielleicht hast du das Passwort dort gespeichert, als du es festgelegt hast.
        </li>
      </Steps>
      <p>
        Setz nicht als Erstes zurück. Zurücksetzen ist sicher und löscht nichts. Aber sobald du zwei Passwörter hast, ist schwerer zu
        erkennen, welche Notiz welches braucht.
      </p>

      <h2 id="was-hilft">Was jede Option kann</h2>
      <PostFigure src="/blog/drawn/pw-keys" width={1200} height={750} maxWidth={560}
        alt="Ein gezeichnetes orangefarbenes Schloss, darum herum drei Wege, es zu öffnen: ein Gesichtsscan, sechs Code-Punkte und ein Passwortfeld."
        caption="Drei Wege hinein: Face ID, dein Code oder das Passwort für Notizen selbst." />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Öffnet alte gesperrte Notizen?</th><th scope="col">Gut zu wissen</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Face ID oder Touch ID</th><td>Ja, wenn es für Notizen aktiviert war</td><td>Ändert das Passwort nicht, dafür brauchst du immer das aktuelle</td></tr>
            <tr><th scope="row">Die Merkhilfe</th><td>Nur, wenn sie deinem Gedächtnis auf die Sprünge hilft</td><td>Erscheint nach zwei Fehlversuchen, falls du eine festgelegt hast</td></tr>
            <tr><th scope="row">Gerätecode</th><td>Ja, für Notizen, die damit gesperrt sind</td><td>Möglich seit iOS 16, mit aktiviertem iCloud-Schlüsselbund</td></tr>
            <tr><th scope="row">Passwort zurücksetzen</th><td>Nein</td><td>Legt ein Passwort für Notizen fest, die du ab jetzt sperrst</td></tr>
            <tr><th scope="row">Apple Support</th><td>Nein</td><td>Apple hat keinen Zugriff auf gesperrte Notizen</td></tr>
            <tr><th scope="row">Entsperr-Apps</th><td>Nein</td><td>Sie können nur Passwörter raten</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="zuruecksetzen">Passwort zurücksetzen (für neue Notizen)</h2>
      <p>
        Wenn nichts davon klappt, setz es zurück, damit du weiter neue Notizen sperren kannst. Die alten gesperrten Notizen bleiben, wie
        sie sind, und öffnen sich weiter mit dem alten Passwort, falls es dir je wieder einfällt.
      </p>
      <p className="label" id="zuruecksetzen-iphone"><strong>Auf dem iPhone</strong></p>
      <Steps>
        <li>Öffne Einstellungen, tippe auf Apps, dann auf Notizen und auf Passwort.</li>
        <li>Wähle den Account und tippe auf „Passwort zurücksetzen“.</li>
        <li>Gib das Passwort deines Apple Accounts ein, tippe auf OK und dann noch einmal auf „Passwort zurücksetzen“.</li>
        <li>Wähle deinen Gerätecode, oder gib ein neues Passwort und einen Passworthinweis ein. Tippe dann auf Fertig.</li>
      </Steps>
      <p className="label" id="zuruecksetzen-mac"><strong>Auf dem Mac</strong></p>
      <Steps>
        <li>Wähle in Notizen das Menü Notizen, dann Einstellungen, klicke auf „Passwort zurücksetzen“ und dann auf OK.</li>
        <li>Gib das Passwort ein, nach dem Notizen fragt. Bei meinem Test unter macOS 27 war es das Anmeldepasswort des Mac. Laut Apples Handbuch kann ein iCloud-Account nach deinem iCloud-Passwort fragen.</li>
        <li>Klicke noch einmal auf „Passwort zurücksetzen“, gib das neue Passwort zweimal ein und dazu eine Merkhilfe, und klicke auf „Passwort festlegen“.</li>
      </Steps>
      <p>
        Die Schritte sind von Apple: <a href="https://support.apple.com/de-de/102537" rel="noopener">Sperren oder Entsperren von
        Notizen</a> auf dem iPhone und <a href="https://support.apple.com/de-de/guide/notes/apdb021fd5a9/mac" rel="noopener">Passwort für
        gesperrte Notizen ändern</a> auf dem Mac. Kennst du das Passwort noch und willst nur ein neues, wähl stattdessen „Passwort
        ändern“: Dann wechseln alle gesperrten Notizen auf das neue Passwort, und du hast am Ende nicht zwei.
      </p>
      <Capture src="/blog/macos27/notes27-reset-password-confirm" width={1148} height={1420} maxWidth={420}
        alt="Apple Notizen unter macOS 27 fragt Reset Notes Password? und erklärt, dass das neue Passwort für Notizen gilt, die du ab jetzt sperrst, und dass Notizen mit Passwort nicht betroffen sind. Tasten Cancel und OK."
        caption="Beim Zurücksetzen unter macOS 27 sagt Apple es klar: Notizen, die schon ein Passwort haben, sind nicht betroffen." />

      <h2 id="getestet">Ich habe es auf einem Test-Mac ausprobiert, damit du es nicht musst</h2>
      <p>
        Ich habe eine Notiz mit einem Passwort gesperrt, es zurückgesetzt und ein neues festgelegt. Dann habe ich die alte Notiz geöffnet.
        Das neue Passwort ging nicht, und die angezeigte Merkhilfe war die alte. Diese Merkhilfe ist dein bester Hinweis: Du hast sie für
        genau das Passwort geschrieben, das du vergessen hast.
      </p>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-after-reset-old-note-rejects-new-password", width: 2000, height: 1320,
          alt: "Eine Notiz, die vor dem Zurücksetzen gesperrt wurde, in Apple Notizen unter macOS 27: That's not the correct password for this note. Try a different password. Die Merkhilfe ist noch die alte." },
        { src: "/blog/macos27/notes27-old-password-update-prompt", width: 2000, height: 1320,
          alt: "Dieselbe Notiz, mit dem alten Passwort geöffnet: Update password? Notizen bietet an, alle Notizen mit diesem alten Passwort auf das aktuelle umzustellen. Tasten Update Password und Not Now." },
      ]} caption="Nach dem Zurücksetzen lehnt die alte Notiz das neue Passwort ab und zeigt ihre alte Merkhilfe. Gib das alte ein, und Notizen bietet an, alle diese Notizen auf dein aktuelles Passwort umzustellen." />
      <p>
        Beim Zurücksetzen geht also nichts verloren. Fällt dir das alte Passwort später wieder ein, bietet Notizen an, alle Notizen, die es
        noch nutzen, in einem Schritt zu aktualisieren.
      </p>

      <h2 id="entsperr-apps">Über Entsperr-Apps</h2>
      <PostFigure src="/blog/drawn/pw-guess" width={1200} height={750} maxWidth={560}
        alt="Ein gezeichnetes orangefarbenes Schloss neben einem Haufen Schlüssel und einem Fragezeichen."
        caption="Eine Entsperr-App kann nur raten, Schlüssel für Schlüssel." />
      <p>
        Die Suchergebnisse dazu sind voll mit Apps, die versprechen, Notizen zu entsperren. Keine davon kann eine gesperrte Notiz ohne ihr
        Passwort entschlüsseln. Mehr als Passwörter für dich durchprobieren können sie nicht. Fragt eine nach dem Passwort deines Apple
        Accounts oder nach deinem Backup, überleg dir gut, was du da aus der Hand gibst.
      </p>

      <h2 id="naechstes-mal">Damit es nicht wieder passiert</h2>
      <ul>
        <li>Wechsle zum Gerätecode: Einstellungen, Apps, Notizen, Passwort, „Gerätecode verwenden“. Dafür muss der iCloud-Schlüsselbund aktiviert sein. Auf dem Mac heißt dieselbe Wahl „Anmeldepasswort verwenden“, im Menü „Gesperrte Notizen“ unter Notizen, Einstellungen.</li>
        <li>Oder speichere dein Passwort für Notizen in einem Passwort-Manager.</li>
        <li>Aktiviere Face ID oder Touch ID für Notizen, dann musst du es nur selten eintippen.</li>
        <li>Entsperre und exportiere alles, was du nicht verlieren darfst, und bewahre eine Kopie an einem sicheren Ort auf.</li>
      </ul>
      <Capture src="/blog/macos27/notes-create-password" width={1006} height={622} maxWidth={503}
        alt="Ein Passwort für Notizen anlegen, in Apple Notizen unter macOS 27: die Felder Password, Verify und Password Hint und die Warnung, dass du deine gesperrten Notizen nicht mehr ansehen kannst, wenn du dieses Passwort vergisst."
        caption="Wenn du doch ein eigenes Passwort festlegst, füll die Merkhilfe aus. Sie ist der einzige Hinweis, den Notizen dir später gibt." />

      <h2 id="pinto-notes">Wenn du zu einer anderen App wechselst</h2>
      <p>
        Gesperrte Notizen lassen sich ohne Passwort nicht lesen, deshalb lassen Export- und Import-Tools sie zurück. Das gilt auch für den
        Import aus Apple Notizen in Pinto Notes: Entsperre vorher die Notizen, die du brauchst, sonst bleiben sie in Notizen.
      </p>
      <p>
        Pinto Notes, die Notizen-App für iPhone und Mac, die ich entwickle, hat auch gesperrte Notizen, und sie funktionieren genauso: mit
        deinem Passwort für Notizen auf deinem Gerät verschlüsselt, unlesbar für uns und für jede KI, die du verbindest, und nicht
        wiederherstellbar, wenn du das Passwort vergisst. Das sagt die App dir, wenn du eins festlegst. Alles andere in Pinto Notes wird
        ebenfalls auf deinen Geräten verschlüsselt, und ChatGPT und Claude können deine anderen Notizen trotzdem nutzen, sobald du es
        erlaubst. Die App ist auf Englisch.
      </p>
      <Figure shot={{ ...SHOTS.notesPassword, alt: "Pinto Notes auf einem Mac: Create a password for your locked notes, mit den Feldern Password, Verify und Hint und der Warnung, dass sich gesperrte Notizen nicht wiederherstellen lassen, wenn du dieses Passwort vergisst, nicht einmal durch uns." }}
        caption="Ein Passwort für gesperrte Notizen in Pinto Notes auf einem Mac. Wie bei Apple lässt es sich nicht wiederherstellen, wenn du es vergisst." />
    </LocalPostPage>
  );
}
