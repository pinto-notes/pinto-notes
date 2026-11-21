import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "wunschliste-vorlage-apple-notizen");
// German version of /blog/apple-notes-wishlist-template, 21 Nov 2026. Google autocomplete hl=de,
// gl=de, read 21 Nov: "wunschliste vorlage" yielded "wunschliste vorlage", "wunschzettel vorlage",
// "wunschliste vorlage erwachsene"; "wunschliste vorlage apple notizen" yielded none.
// Apple German support read 21 Nov: de-de/guide/notes/not9474646a9/mac (new note/paste),
// apd93c815aa0/mac (Checkliste), apd0a136b9cc/mac (Format, Tabelle), and
// de-ch/guide/iphone/iph1ac0b3a2/27/ios/27 (Neue Notiz, Format, Überschrift,
// Tabelle hinzufügen, Checkliste), and de-de/102296 (Zeilenschalter).
// Mac pages returned 429 in web reader; German pilot verified menu words.
// Invented prices are in euros with German date formatting. No pictures.
const ui = UI.de;
const TEMPLATE = `Meine Wunschliste

Nächste Prüfung: 28. November 2026
Regel: Vor einer Entscheidung mindestens sieben Tage warten. Preis vor dem Kauf erneut prüfen.

Schreibtischlampe mit verstellbarem Arm
Link: https://example.com/schreibtischlampe
Gesehener Preis: 65 €, einschließlich Versand
Gesehen am: 21. November 2026
Grund: Nach Sonnenuntergang liegt mein Schreibtisch im Schatten.
Warten bis: 28. November 2026
Entscheidung: Warten. Erst Platz neben dem Monitor ausmessen.

Handkaffeemühle
Link: https://example.com/kaffeemuehle
Gesehener Preis: 95 €, einschließlich Versand
Gesehen am: 20. November 2026
Grund: Am Wochenende frisch gemahlenen Kaffee ausprobieren.
Warten bis: 27. November 2026
Entscheidung: Warten. Erst für ein Wochenende eine Mühle ausleihen.

Laptopständer
Link: https://example.com/laptopstaender
Gesehener Preis: 39 €, einschließlich Versand
Gesehen am: 12. November 2026
Grund: Bildschirm bei Videoanrufen höher stellen.
Warten bis: 19. November 2026
Entscheidung: Auslassen, 21. November. Die Bücher unter dem Laptop reichen.

Vor der Entscheidung
Platz für die Lampe ausmessen.
Fürs Wochenende eine Kaffeemühle ausleihen.
`;
const TABLE = `Artikel\tWarten bis / Entscheidung
Schreibtischlampe\t28.11.2026 / Warten, Platz ausmessen
Kaffeemühle\t27.11.2026 / Warten, erst ausleihen
Laptopständer\t19.11.2026 / Auslassen, Bücher reichen
`;
const FAQ = [
  { q: "Wie mache ich eine Wunschliste in Apple Notizen?", a: ["Kopiere die Vorlage in eine Notiz. Notiere für jeden Artikel Link, Preis mit Datum, Grund, Prüftag und Entscheidung. Offene Fragen kommen in eine Checkliste."] },
  { q: "Tabelle oder Checkliste für die Wunschliste?", a: ["Eine Tabelle zeigt Artikel und Entscheidungen kurz an. Gründe und Links bleiben bei den Einträgen. Die Checkliste ist für Dinge, die du vor dem Kauf prüfen willst."] },
  { q: "Was sollte vor dem Kauf auf der Liste stehen?", a: ["Schreib auf, wofür du den Artikel brauchst, was du schon nutzt, den Preis mit Versand und wann du neu entscheidest. Der Prüftag ist kein Kaufdatum."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="wunschliste-vorlage-apple-notizen"
  intro={<>Diese Wunschliste für Apple Notizen sammelt Links, Preise, Gründe und einen Tag zum Überdenken. Kopiere das Beispiel und entscheide erst nach der Wartezeit.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#vorlage", label: "Vorlage" }, { href: "#einrichten", label: "Einrichten" },
    { href: "#pruefen", label: "Entscheiden" }, { href: "#grenzen", label: "Grenzen" },
    { href: "#pinto-notes", label: "Mit KI prüfen" },
  ]}><p>Eine Notiz reicht für mögliche Anschaffungen. Halte bei jedem Artikel Link, gesehenen Preis, Grund, Wartezeit und Entscheidung fest. Aufgaben vor dem Kauf stehen in einer Checkliste.</p>
    <PostCta slug="de/wunschliste-vorlage-apple-notizen" path="/de/blog/wunschliste-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Wunschliste gemeinsam mit KI prüfen"><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude die Liste lesen und deine Prüfeinträge auf Wunsch bearbeiten.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="vorlage">Die Vorlage für Käufe, die warten können</h2>
  <p>Zwei Artikel warten noch, einer ist gestrichen. Die Preise sind erfunden, die Links Platzhalter. Ersetze sie durch echte Produktseiten und Preise einschließlich Versand.</p>
  <Keep title="Wunschliste für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als normalen Text einfügen. Die letzten zwei Zeilen werden danach zur Checkliste." />
  <p>Schreibe den Grund vor dem nächsten Artikel auf. „Der Schreibtisch ist abends zu dunkel“ lässt sich prüfen. Auch „gefällt mir“ kann ein Grund sein. Für Geschenke an andere gibt es eine <a href="/de/blog/geschenkideen-liste-apple-notizen">eigene Geschenkeliste</a>.</p>
  <h2 id="einrichten">Auf Mac und iPhone einrichten</h2>
  <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Einsetzen"] }, { on: "Mac", steps: ["Letzte zwei Zeilen markieren", "Checkliste"] }, { on: "iPhone", steps: ["Neue Notiz", "Text eingeben"] }]} />
  <p>Erstelle auf dem Mac eine Notiz und füge den Text ein. Markiere die zwei Aufgaben unter „Vor der Entscheidung“ und klicke auf „Checkliste“. Ein Häkchen heißt nur, dass die Prüfung erledigt ist, nicht dass du etwas gekauft hast.</p>
  <p>Auf dem iPhone tippst du auf „Neue Notiz“. Formatiere Artikelnamen über „Format“ als Überschriften. Unter „Vor der Entscheidung“ legst du mit der Checklisten-Taste Einträge an. Der Zeilenschalter fügt einen weiteren hinzu.</p>
  <h3>Eine optionale Tabelle für den Überblick</h3>
  <Keep title="Wunschliste im Überblick" text={TABLE} copyLabel={ui.copy} note="Ein Tabulator trennt Artikel und Entscheidung. Als eigenen Block unter die Einträge setzen." />
  <p>Auf dem Mac kannst du die vier eingefügten Zeilen markieren und die Tabellen-Taste nutzen. Oder du wählst Format, Tabelle und trägst die Werte von Hand ein. Ein Tabulator in der letzten Zelle fügt eine Zeile hinzu. Auf dem iPhone nutzt du „Tabelle hinzufügen“. Die <a href="/blog/apple-notes-tables" hrefLang="en">Tabellenanleitung</a> (auf Englisch) zeigt weitere Beispiele. Halte die Übersicht aktuell oder lass sie weg.</p>
  <h2 id="pruefen">Am Prüftag entscheiden</h2>
  <p>Sieben Tage sind ein Beispiel. Ersatz für etwas Nötiges kann schneller fällig sein, ein teures Hobbygerät später. Lies am Prüftag den Grund erneut, prüfe den aktuellen Preis und erledige offene Checks. Schreibe dann „Kaufen“, „Warten“ oder „Auslassen“ mit Datum und Begründung. Bei „Warten“ setze einen neuen Tag.</p>
  <p>Behalte gestrichene Artikel als Gedächtnisstütze. Nach einem Kauf notierst du den tatsächlich gezahlten Betrag und das Kaufdatum.</p>
  <h2 id="grenzen">Was die Liste nicht kann</h2>
  <p>Sie beobachtet weder Preise noch Lagerbestand. Ein Wartedatum löst keine Erinnerung aus. Stell sie separat ein, wenn du eine Benachrichtigung brauchst. Für wenige Links reicht die Notiz oft aus.</p>
  <h2 id="pinto-notes">Die Liste mit ChatGPT oder Claude prüfen</h2>
  <p>Auch Pinto Notes kann diese Liste mit Überschriften, Links und Checkliste halten. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinde ChatGPT oder Claude</a> und bestätige einmal „Allow“ für Lesen und Bearbeiten. Bitte die KI, fällige Prüftage aus der Notiz aufzuschreiben, ohne Entscheidungen zu ändern. Prüfe Daten und aktuelle Preise selbst. Deine Apple Notizen kommen über <a href="/blog/move-from-apple-notes" hrefLang="en">einen Import auf dem Mac</a> mit und bleiben unverändert. Die App ist auf Englisch.</p>
</LocalPostPage>; }
