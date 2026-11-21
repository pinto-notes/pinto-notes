import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-widget-iphone-mac");

// German version of /blog/apple-notes-widget, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „notizen widget iphone“, „notizen widget sperrbildschirm iphone“,
// „notizen app widget iphone“, „notizen widget mac“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/iphone/iphb8f1bf206/ios,
// https://support.apple.com/de-de/118610, https://support.apple.com/de-de/guide/iphone/create-a-custom-lock-screen-iph4d0e6c351/ios,
// https://support.apple.com/de-de/guide/iphone/iph92579feda/ios,
// https://support.apple.com/de-de/guide/notes/apdc28344070/mac,
// https://support.apple.com/de-de/guide/mac-help/mchl52be5da5/mac.
// The iPhone Edit icon has no visible name in the guide; the step describes tapping it.

const ui = UI.de;
const faq = [
  { q: "Wie füge ich ein Notizen-Widget auf dem iPhone hinzu?", a: ["Halte eine freie Stelle auf dem Home-Bildschirm gedrückt. Öffne die Widget-Galerie, suche nach „Notizen“, wähle Größe und Stil und tippe auf „Widget hinzufügen“."] },
  { q: "Gibt es ein Notizen-Widget für den Sperrbildschirm?", a: ["Prüfe die Widget-Auswahl des Sperrbildschirms über „Anpassen“ und „Widgets hinzufügen“. Apples verlinkte Anleitungen bestätigen dort kein bestimmtes Notizen-Widget. Der Zugriff auf Notizen im Sperrbildschirm ist eine getrennte Einstellung."] },
  { q: "In welchem Account landen neue Widget-Notizen?", a: ["Das bestimmt „Standardaccount“ unter „Einstellungen“ > „Apps“ > „Notizen“. Apple nennt diesen Schalter ausdrücklich für Siri und das Notizen-Widget."] },
  { q: "Kann ich mehrere Notizen-Widgets am Mac verwenden?", a: ["Ja. Apple erlaubt mehrere Widgets für verschiedene Notizen und Ordner auf dem Schreibtisch oder in der Mitteilungszentrale."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notizen-widget-iphone-mac"
    intro={<>Auf dem iPhone fügst du ein Notizen-Widget über die Widget-Galerie des Home-Bildschirms hinzu. Auf dem Mac öffnest du mit gedrückter Control-Taste auf dem Schreibtisch „Widgets bearbeiten“. Der Sperrbildschirm hat eine eigene Auswahl.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#iphone", label: "iPhone" }, { href: "#sperrbildschirm", label: "Sperrbildschirm" },
      { href: "#mac", label: "Mac" }, { href: "#probleme", label: "Wenn es nicht klappt" },
    ]}>
      <p>Auf dem iPhone suchst du in der Widget-Galerie nach „Notizen“. Auf dem Mac gibt es Widgets für eine Notiz oder einen Ordner. Apples Anleitungen bestätigen kein Notizen-Widget für den Platz unter der Uhr auf dem Sperrbildschirm.</p>
      <PostCta slug="de/notizen-widget-iphone-mac" path="/de/blog/notizen-widget-iphone-mac" position="answer" ui={ui.cta} title="Notizen auch mit KI bearbeiten">
        <p>Pinto Notes ist auf Englisch und läuft auf iPhone und Mac. Verbundenes ChatGPT oder Claude kann Notizen lesen und bearbeiten. Frühere Versionen bleiben erhalten.</p>
      </PostCta>
    </Answer>} faq={faq}>
    <h2 id="iphone">Notizen-Widget auf dem iPhone hinzufügen</h2>
    <Steps><li>Öffne die gewünschte Seite des Home-Bildschirms.</li><li>Halte eine freie Stelle gedrückt, bis die Apps wackeln. Tippe auf die Taste zum Bearbeiten und öffne „Widget hinzufügen“.</li><li>Suche nach „Notizen“. Wähle Größe und Stil aus.</li><li>Tippe auf „Widget hinzufügen“, verschiebe das Widget und beende die Bearbeitung.</li></Steps>
    <p>Halte das Widget gedrückt und tippe auf „Widget bearbeiten“, um angebotene Optionen zu ändern. Apple beschreibt das in der <a href="https://support.apple.com/de-de/guide/iphone/iphb8f1bf206/ios">iPhone-Anleitung</a>. Nicht jede Größe hat dieselben Optionen.</p>
    <h2 id="sperrbildschirm">Notizen und der Sperrbildschirm</h2>
    <p>Home-Bildschirm und Sperrbildschirm haben getrennte Widget-Galerien. Apples <a href="https://support.apple.com/de-de/118610">Widget-Anleitung</a> beschreibt diese Schritte:</p>
    <Steps><li>Halte den Sperrbildschirm gedrückt und tippe auf „Anpassen“.</li><li>Tippe auf „Widgets hinzufügen“ und sieh dir die angebotenen Widgets an.</li><li>Setze ein Widget ein. Wenn kein Platz ist, entferne zuerst ein vorhandenes.</li><li>Schließe die Bearbeitung mit „Fertig“ ab.</li></Steps>
    <p>Diese Schritte belegen kein Notizen-Widget an dieser Stelle. Wenn „Notizen“ dort fehlt, hilft die Galerie des Home-Bildschirms nicht. Apple beschreibt getrennt die Option „Auf App ,Notizen‘ im Sperrbildschirm zugreifen“ unter „Einstellungen“ &gt; „Apps“ &gt; „Notizen“. Dort wählst du „Immer neue Notiz erstellen“, „Letzte Notiz fortsetzen“ oder schaltest den Zugriff aus. Das fügt kein Widget hinzu.</p>
    <p>Die Ansicht „Heute“ erreichst du mit einer Wischbewegung nach rechts. Für Zugriff bei gesperrtem iPhone prüfe unter „Einstellungen“ die Optionen bei „Face ID &amp; Code“ oder „Touch ID &amp; Code“. Apple nennt dort die Ansicht „Heute“ und die Suche.</p>
    <h2 id="mac">Notizen-Widget auf dem Mac hinzufügen</h2>
    <p>Apple beschreibt Widgets für eine Notiz und für einen Ordner. Beide passen auf den Schreibtisch oder in die Mitteilungszentrale. Mehrere Widgets können verschiedene Inhalte zeigen.</p>
    <Steps><li>Klicke mit gedrückter Control-Taste auf den Schreibtisch und wähle „Widgets bearbeiten“.</li><li>Suche in der Galerie nach „Notizen“ und wähle ein Widget.</li><li>Klicke zum automatischen Platzieren oder ziehe es auf den Schreibtisch.</li><li>Klicke auf „Fertig“.</li></Steps>
    <p>Für die Mitteilungszentrale klickst du auf Datum und Uhrzeit in der Menüleiste und dann unten auf „Widgets bearbeiten“. Größe und Bearbeitung eines Widgets öffnest du, soweit angeboten, über dessen Kontextmenü. <a href="https://support.apple.com/de-de/guide/mac-help/mchl52be5da5/mac">Apple zeigt die Mac-Schritte</a>.</p>
    <h2 id="probleme">Wenn das Widget nicht funktioniert</h2>
    <p>Prüfe die Einstellung, die zu deinem Problem passt. Apple verspricht damit keine allgemeine Reparatur für leere oder veraltete Widgets.</p>
    <ul><li>Falscher Inhalt: Halte das iPhone-Widget gedrückt und prüfe „Widget bearbeiten“. Auf dem Mac nutze die Bearbeitungsoption, falls vorhanden.</li><li>Notizen fehlen in Vorschlägen: Prüfe „Einstellungen“ &gt; „Apps“ &gt; „Notizen“ &gt; „Suchen“.</li><li>Neue Notizen landen im falschen Account: Prüfe dort „Standardaccount“.</li><li>Mac-Widgets sind unsichtbar: Prüfe in „Systemeinstellungen“ &gt; „Schreibtisch &amp; Dock“ die Anzeige von Widgets auf dem Schreibtisch.</li></ul>
    <p>Wenn die Notiz auch innerhalb der App fehlt, helfen die <a href="/de/blog/notizen-suche-funktioniert-nicht">Checks für die Notizen-Suche</a>. <a href="/de/blog/apple-notizen-tipps">Weitere Notizen-Tipps</a> zeigen Schnellnotizen und angeheftete Notizen.</p>
    <h2 id="pinto">ChatGPT oder Claude in der Notiz arbeiten lassen</h2>
    <p>Ein Widget öffnet eine Notiz schnell. Pinto Notes erlaubt verbundenem ChatGPT oder Claude außerdem, den Inhalt zu lesen und zu ändern. Frühere Versionen bleiben erhalten. Apple Notizen kannst du auf dem Mac importieren, ohne die Originale zu verändern.</p>
  </LocalPostPage>;
}
