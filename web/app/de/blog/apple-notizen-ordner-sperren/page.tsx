import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-ordner-sperren");

// German version of /blog/apple-notes-lock-folder, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen ordner sperren“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/102537, https://support.apple.com/de-de/guide/iphone/iphf177bb154/ios, https://support.apple.com/de-de/guide/notes/not28c5f5468/mac, https://support.apple.com/de-de/guide/notes/apd58edc7964/mac, https://support.apple.com/de-de/guide/iphone/iph00f208d05/ios.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-ordner-sperren"
      intro={<>In Apple Notizen gibt es keine Sperre für einen ganzen Ordner. Du kannst jede Notiz darin einzeln sperren. Neue Notizen bleiben offen, bis du sie ebenfalls schützt.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#moeglich", label: "Was Apple Notizen sperrt" },
        { href: "#methode", label: "Zuerst die Passwortmethode wählen" },
        { href: "#sperren", label: "Jede Notiz im Ordner sperren" },
        { href: "#oeffnen", label: "Gesperrte Notizen öffnen und schließen" },
        { href: "#ausnahmen", label: "Warum sich eine Notiz nicht sperren lässt" },
      ]}>
        <p>Lege einen normalen Ordner an und sperre jede Notiz darin. Der Ordnername und die Titel bleiben sichtbar. Zum Öffnen nutzt du Passwort, Face ID oder Touch ID.</p>
        <PostCta slug="de/apple-notizen-ordner-sperren" path="/de/blog/apple-notizen-ordner-sperren" position="answer" ui={ui.cta} title="Notizen auch vor KI schützen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="moeglich">Was Apple Notizen sperrt</h2>
      <p>Apples Anleitungen beschreiben eine Sperre pro Notiz, keine Ordnersperre. Auch intelligente Ordner lassen sich nicht sperren. Alle gesperrten Notizen eines Accounts nutzen dieselbe Passwortmethode. Neue Notizen in einem Ordner werden nicht automatisch geschützt.</p>
      <h2 id="methode">Zuerst die Passwortmethode wählen</h2>
      <p>Du kannst den Gerätecode oder ein eigenes Notizen-Passwort nutzen; auf dem Mac auch das Anmeldepasswort. Face ID oder Touch ID können das Öffnen erleichtern. Die Option mit Gerätecode setzt den iCloud-Schlüsselbund und mindestens iOS 16 oder macOS 13 voraus.</p>
      <p>Ein eigenes vergessenes Passwort kann Apple nicht wiederherstellen. Lege einen Hinweis an und bewahre das Passwort sicher auf. Die <a href="/de/blog/notizen-passwort-vergessen">Anleitung bei vergessenem Notizen-Passwort</a> erklärt die Grenzen.</p>
      <h2 id="sperren">Jede Notiz im Ordner sperren</h2>
      <p>Auf dem iPhone öffnest du eine Notiz, tippst auf die Mehr-Taste und wählst „Sperren“. Wiederhole das für alle Notizen im Ordner.</p>
      <p>Auf dem Mac wählst du eine Notiz. Klicke auf die Taste „Mehr“ neben dem Suchfeld und wähle „Notiz sperren“. Gib das Passwort ein oder nutze Touch ID. Dann gehst du zur nächsten Notiz. Nach der ersten Eingabe fragt Notizen in dieser Sitzung nicht jedes Mal erneut.</p>
      <p>Sperre auch neue Notizen direkt nach dem Schreiben.</p>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} alt="Eine gesperrte Notiz auf dem iPhone." caption="Eine gesperrte Notiz zeigt nur ihren Titel." />
      <h2 id="oeffnen">Gesperrte Notizen öffnen und schließen</h2>
      <p>Auf dem iPhone öffnest du die Notiz und verwendest Passwort, Face ID oder Touch ID. Eine Entsperrung öffnet gesperrte Notizen des Accounts für einige Minuten. Über das offene Schloss oder die Aktion zum sofortigen Sperren schließt du sie wieder. Beim Schließen der App oder Ruhezustand sperren sie sich ebenfalls.</p>
      <p>Auf dem Mac öffnest du eine gesperrte Notiz mit Passwort oder Touch ID. Über die Schloss-Taste neben dem Suchfeld schließt du alle auf einmal. Nach Inaktivität oder dem Beenden der App schließen sie sich ebenfalls.</p>
      <h2 id="ausnahmen">Warum sich eine Notiz nicht sperren lässt</h2>
      <ul>
        <li>Sie hat einen Tag. Auch #privat und ein intelligenter Ordner ersetzen keinen gesperrten Ordner.</li>
        <li>Sie enthält Video, Audio, PDF oder ein anderes Dokument. Tabellen, Bilder, Zeichnungen, Scans, Karten und Webanhänge sind auf dem Mac erlaubt.</li>
        <li>Sie ist geteilt oder liegt in einem geteilten Ordner.</li>
        <li>Sie ist eine Schnellnotiz oder verwendet neuere Funktionen, die ein altes Gerät nicht kennt.</li>
        <li>Sie liegt in Gmail oder Yahoo. Nur iCloud-Notizen und lokale Notizen lassen sich sperren. Mit einem verwalteten Apple Account ist die Sperre nicht verfügbar.</li>
      </ul>
      <h2 id="app">Die ganze App auf dem iPhone sperren</h2>
      <p>Für alle Ordner zusammen kannst du die App auf dem iPhone sperren. Halte das Notizen-Symbol auf dem Home-Bildschirm gedrückt und wähle die Option, Face ID, Touch ID oder einen Code zum Öffnen zu verlangen. Bestätige sie noch einmal.</p>
      <p>Die App-Sperre gilt nur auf diesem iPhone und wird nicht zum Mac synchronisiert. Inhalte fehlen dann in Suche und Mitteilungsvorschauen. Eingebaute Apps wie Notizen lassen sich sperren, aber nicht verstecken.</p>
      <h2 id="grenzen">Die Grenzen der Sperre</h2>
      <p>Titel bleiben in der Liste und in Suchergebnissen sichtbar. Sperren funktioniert einzeln; ein Ordner kann gesperrte und offene Notizen enthalten. Ein eigenes vergessenes Passwort holt Apple nicht zurück.</p>
      <h2 id="pinto">Gesperrte Notizen in Pinto Notes</h2>
      <p>Pinto Notes sperrt ebenfalls einzelne Notizen mit einem eigenen Passwort und öffnet sie per Passwort, Face ID oder Touch ID. Eine gesperrte Notiz wird mit einem zusätzlichen Schlüssel verschlüsselt, der nur auf deinen Geräten liegt. Vergisst du das Passwort, kann auch Pinto Notes sie nicht wiederherstellen.</p>
      <p>Verbindest du ChatGPT oder Claude, sehen sie bei gesperrten Notizen nur den Titel. Beim Import aus Apple Notizen bleiben gesperrte Notizen zurück; entsperre die gewünschten Notizen vorher und sperre sie danach wieder.</p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} alt="Import-Menü von Pinto Notes auf dem Mac." caption="Gesperrte Apple Notizen müssen vor dem Import entsperrt werden." />
    </LocalPostPage>
  );
}
