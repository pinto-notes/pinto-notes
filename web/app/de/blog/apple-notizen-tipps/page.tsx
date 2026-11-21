import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-tipps");

// German version of /blog/apple-notes-tips, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen tipps und tricks“, „apple notizen tipps“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/apdf028f7034/mac, https://support.apple.com/de-de/guide/notes/apd93c815aa0/mac, https://support.apple.com/de-de/guide/notes/apd1955d3b21/mac, https://support.apple.com/de-de/guide/notes/apd58edc7964/mac, https://support.apple.com/de-de/guide/notes/apde615d29c2/mac, https://support.apple.com/de-de/guide/iphone/iphb8628c6b8/ios.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-tipps"
      intro={<>Apple Notizen kann mehr als Text sammeln. Mit diesen 15 Tipps erfasst du Dinge schneller, ordnest lange Notizen und findest sie später wieder.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#schnell", label: "Schnell erfassen" },
        { href: "#struktur", label: "Notizen ordnen" },
        { href: "#finden", label: "Wiederfinden" },
        { href: "#ideen", label: "Ideen für deine Notizen" },
        { href: "#ki", label: "15. Deine KI in deinen Notizen" },
      ]}>
        <p>Nutze Schnellnotizen und Scans für den Eingang. Checklisten, Überschriften, Tabellen und Links geben Struktur. Tags, intelligente Ordner und Suche helfen beim Wiederfinden.</p>
        <PostCta slug="de/apple-notizen-tipps" path="/de/blog/apple-notizen-tipps" position="answer" ui={ui.cta} title="ChatGPT oder Claude in deinen Notizen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
      hero={<PostFigure src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} alt="Apple Notizen auf dem Mac mit Checkliste und intelligentem Ordner." caption="Checklisten und intelligente Ordner helfen bei offenen Aufgaben." />}
    >
      <h2 id="schnell">Schnell erfassen</h2>
      <p>1. Schnellnotiz: Auf dem Mac öffnet Fn oder Globus plus Q eine kleine Notiz. Auch die Ecke unten rechts und in Safari die Teilen-Aktion führen dorthin. Die Notizen landen unter „Schnellnotizen“. In den Einstellungen kannst du verhindern, dass immer die letzte geöffnet wird.</p>
      <p>2. Papier scannen: Öffne auf dem iPhone eine Notiz und die Anhang-Taste. Scanne ein Dokument als PDF. Für wenige Zeilen nutze die Texterkennung, damit du das Ergebnis bearbeiten kannst.</p>
      <p>3. Besprechung aufnehmen: Starte eine Audioaufnahme in der Notiz. Auf unterstützten Geräten erscheint ein Transkript; Apple Intelligence kann es zusammenfassen. Auf dem Mac braucht die Transkription M1 oder neuer und eine unterstützte Sprache.</p>
      <p>4. Markdown einfügen: Unter macOS 27 kann eine besondere Einfügeaktion # und - [ ] als Überschriften und Checklisten übernehmen. Die genaue deutsche Menübezeichnung ist in den geprüften Apple-Seiten nicht belegt. Normales Einfügen lässt die Zeichen als Text.</p>
      <p>5. Vorlagen duplizieren: Lege Beispielnotizen für Treffen oder Reisen in einem Vorlagenordner ab. Dupliziere sie über das Ablage-Menü und benenne die Kopie um. <a href="/blog/apple-notes-templates" hrefLang="en">Vorlagen für Apple Notizen</a> gibt weitere Beispiele.</p>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} alt="Normal eingefügter Markdown-Text und formatierter Text in Apple Notizen." caption="Eine besondere Einfügefunktion macht aus Markdown echte Formatierung." />
      <h2 id="struktur">Notizen ordnen</h2>
      <p>6. Checklisten: Markiere Zeilen und nutze die Checklisten-Taste. In den Einstellungen von Notizen kann Erledigtes automatisch nach unten wandern. Für wiederkehrende Listen entfernst du alle Häkchen über das Format-Menü.</p>
      <p>7. Klappbare Überschriften: Formatiere eine Zeile als Überschrift oder Unterüberschrift. Lange Abschnitte lassen sich darunter einklappen.</p>
      <p>8. Markieren: Wähle Text und die Hervorhebung im Format-Menü. Die Farbe hilft, offene Fragen oder Termine zu erkennen.</p>
      <p>9. Tabellen: Eine Tabelle beginnt mit zwei Zeilen und Spalten. Tab in der letzten Zelle fügt eine Zeile hinzu. Text mit Tab-Trennzeichen lässt sich ebenfalls in Spalten bringen. Tabellen sortieren und addieren nicht.</p>
      <p>10. Rechnen: Schreibe etwa „1200 - 350 =“. Mathematische Ergebnisse schlagen eine Zahl vor. Benannte Beträge lassen sich weiter unten zusammenzählen. Die Funktion lässt sich im Format-Menü steuern.</p>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} alt="Apple Notizen zeigt benannte Beträge und eine Summe." caption="Mathematische Ergebnisse addieren benannte Zahlen." />
      <h2 id="finden">Wiederfinden</h2>
      <p>11. Anheften: Eine häufig genutzte Notiz bleibt oben im Ordner. Auf dem Mac gibt es die Aktion im Ablage-Menü, auf dem iPhone beim langen Drücken auf eine Notiz.</p>
      <p>12. Verlinken: Markiere Wörter und wähle auf dem Mac „Bearbeiten“ &gt; „Link hinzufügen“. In macOS 27 kannst du auch auf eine Überschrift innerhalb der Zielnotiz verweisen. Eine Indexnotiz verbindet etwa alle Rezepte.</p>
      <p>13. Tags und intelligente Ordner: Mit #arbeit oder #rezepte markierst du Notizen. Ein intelligenter Ordner mit einer Regel für nicht erledigte Checklisten sammelt offene Aufgaben. Löscht du den Ordner, bleiben die Notizen.</p>
      <p>14. Suche: Notizen findet getippten und handgeschriebenen Text, Scans und Bildinhalte. In einer Notiz kannst du auch Anhänge durchsuchen. Gesperrte Notizen zeigen nur ihren Titel in Ergebnissen. Für die Sperre brauchst du Passwort, Face ID oder Touch ID; Notizen mit Tags, Audio oder PDF lassen sich nicht sperren.</p>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} alt="Intelligenter Ordner für offene Checklisten in Apple Notizen." caption="Eine Regel sammelt Notizen mit offenen Punkten." />
      <h2 id="ideen">Ideen für deine Notizen</h2>
      <ul>
        <li>Rezepte: eine Notiz pro Rezept, Zutaten als Checkliste und ein verlinktes Inhaltsverzeichnis.</li>
        <li>Packliste: Checkliste vor jeder Reise zurücksetzen.</li>
        <li>Einkaufsliste: Erledigtes nach unten sortieren.</li>
        <li>Monatsbudget: benannte Beträge addieren.</li>
        <li>Unterricht oder Treffen: Überschrift, Aufnahme und Scans je Termin.</li>
        <li>Leseliste: Tabelle mit Titel, Autor und kurzer Bewertung.</li>
        <li>Belege: Scans in einem Ordner, später per Suche finden.</li>
      </ul>
      <p>Dazu passen <a href="/de/blog/rezepte-in-apple-notizen">Rezepte in Apple Notizen</a>, eine <a href="/de/blog/einkaufsliste-iphone-notizen">Einkaufsliste</a> und der <a href="/de/blog/budget-vorlage-apple-notizen">Budgetplan</a>.</p>
      <h2 id="ki">15. Deine KI in deinen Notizen</h2>
      <p>Apple Notizen lässt ChatGPT oder Claude vom iPhone und Web aus nicht direkt auf deine Sammlung zugreifen. Außerdem gibt es keine Versionsgeschichte.</p>
      <p>Pinto Notes behält Ordner, Pins, Checklisten und Tabellen. Nach dem Verbinden können ChatGPT oder Claude Notizen lesen und bearbeiten. Änderungen sind sichtbar und frühere Versionen bleiben. Notizen sind Markdown-Dateien und verschlüsselt. Kostenlose Vorlagen legen fertige Notizen an. Es läuft nur auf iPhone und Mac.</p>
      <p>Auf dem Mac importiert Pinto Notes Apple Notizen, Obsidian, Evernote, Keep, Bear sowie Markdown und Text. Apple Notizen bleibt erhalten.</p>
      <PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} alt="Dialog zum Verknüpfen einer Überschrift in Apple Notizen auf dem Mac." caption="Ein Link kann auf eine bestimmte Überschrift zeigen." />
      <Figure shot={SHOTS.aiEdit} caption="ChatGPT hat eine Einkaufsliste ergänzt. Die Änderungen lassen sich zurücknehmen." />
    </LocalPostPage>
  );
}
