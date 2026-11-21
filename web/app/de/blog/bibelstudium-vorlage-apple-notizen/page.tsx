import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "bibelstudium-vorlage-apple-notizen");

// German version of /blog/apple-notes-bible-study-template. Google autocomplete hl=de, gl=de,
// read 21 Nov 2026: "bibelstudium vorlage" and "bibelstudium notizen" were suggested;
// "bibelstudium vorlage notizen" returned nothing. Apple support read 21 Nov 2026:
// support.apple.com/de-de/guide/notes/apd1955d3b21/mac (Überschrift), apd93c815aa0/mac
// (Checkliste), apd0a136b9cc/mac (Format, Tabelle), not9474646a9/mac (Notiz duplizieren),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// The unlabeled format and table icons are described by function. The verse is from the
// public-domain Lutherbibel 1912: ebible.org/deu1912/JAS01.htm, read 21 Nov 2026.
const ui = UI.de;

const TEMPLATE = `Bibelstudium: Jakobus 1,19-25, 21. November 2026

Bibelstelle
Jakobus 1,19-25
Übersetzung: Lutherbibel 1912
Auszug, Jakobus 1,22: "Seid aber Täter des Worts und nicht Hörer allein, wodurch ihr euch selbst betrügt."

Beobachtungen
Vers 19 stellt das Zuhören vor das Reden und warnt vor Zorn.
Die Verse 23 und 24 vergleichen einen vergesslichen Hörer mit jemandem, der in den Spiegel schaut und sein Bild gleich wieder vergisst.

Fragen
Wie verbindet das Spiegelbild Hören und Handeln?
Worauf bezieht sich das Bleiben in Vers 25?

Querverweise
Stelle\tWas ich vergleichen will
Lukas 6,46-49\tHören und Handeln mit Jakobus 1,22 vergleichen.
Sprüche 15,1\tReden und Zorn mit Jakobus 1,19 vergleichen.

Anwendung
Heute Abend Lea ausreden lassen, bevor ich antworte.
Morgen einen Moment notieren, in dem ich zugehört oder unterbrochen habe.

Gebet
Gott, hilf mir, geduldig zuzuhören und das Gelernte umzusetzen. Amen.
`;

const PROMPT = `Lies meine Pinto-Notes-Notiz "Bibelstudium: Jakobus 1,19-25, 21. November 2026".
Suche in meinen anderen Bibelstudien nach früheren Fragen zu Zuhören, Reden oder Hören und Handeln.
Zitiere passende Fragen im Chat wörtlich und nenne Titel und Datum der Quellnotiz.
Wenn du nichts findest, sag es. Erfinde keine Notizen oder Antworten.
Ändere meine Notizen nicht, während ich die Treffer prüfe.
Ergänze erst nach meiner Auswahl nur diese Frage und ihre Quelle unter Fragen in der Jakobus-Notiz.
Lass Bibelzitat, Beobachtungen, Anwendung und Gebet unverändert.
Kennzeichne eine eigene Deutung im Chat als "Deutung zum Prüfen" und trenne sie vom Bibeltext.`;

const FAQ = [
  { q: "Was gehört in eine Vorlage für das Bibelstudium?", a: ["Notiere Bibelstelle und Übersetzung. Trenne Beobachtungen, Fragen, Querverweise, Anwendung und Gebet. Kennzeichne ein Zitat, damit du es von deinen eigenen Worten unterscheiden kannst."] },
  { q: "Kann ich Querverweise als Tabelle in Apple Notizen führen?", a: ["Ja. Eine Spalte enthält die Bibelstelle, die andere den Grund für den Vergleich. Auf dem Mac wählst du Format, Tabelle. Auf dem iPhone fügst du eine Tabelle ein. Lies jede Stelle im Zusammenhang."] },
  { q: "Soll die Checkliste das Lesen oder die Anwendung festhalten?", a: ["Nutze sie für konkrete Schritte, etwa eine Stelle erneut lesen oder einer Frage nachgehen. Ein Haken zeigt nur, dass du etwas getan hast. Er misst weder Verständnis noch Glauben."] },
  { q: "Kann ich die Vorlage für eine andere Bibelstelle wiederverwenden?", a: ["Ja. Dupliziere auf dem Mac die Notiz über Ablage, Notiz duplizieren. Ändere Stelle und Datum und ersetze Zitat und eigene Gedanken. Die bisherige Studie bleibt erhalten."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="bibelstudium-vorlage-apple-notizen"
    intro={<>Kopiere diese Vorlage für das Bibelstudium in Apple Notizen, eine Notiz pro Bibelstelle. Das ausgefüllte Beispiel zu Jakobus 1,19-25 trennt Beobachtungen, Fragen, Querverweise, Anwendung und Gebet.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#studieren", label: "Bibelstelle bearbeiten" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Frühere Fragen finden" }]}>
      <p>Lege für jede Studie eine Notiz an. Schreib Bibelstelle und Übersetzung über deine eigenen Gedanken. Die Vorlage funktioniert als Klartext. Querverweise kannst du in eine Tabelle und die Anwendung in eine Checkliste umwandeln.</p>
      <div id="vorlage"><Keep title="Vorlage für Bibelstudium in Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Kopiere das Beispiel in eine neue Notiz und ersetze es durch deine Stelle und Antworten. Die Formatierungsschritte folgen unten." /></div>
      <PostCta slug="de/bibelstudium-vorlage-apple-notizen" path="/de/blog/bibelstudium-vorlage-apple-notizen" position="answer" title="Fragen aus früheren Studien suchen?" ui={ui.cta}><p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude deine Studiennotizen durchsuchen und frühere Fragen lesen.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Vorlage in Apple Notizen einrichten</h2>
      <p>Nutze eine iCloud-Notiz oder eine auf deinem Gerät gespeicherte Notiz. Laut Apple fehlen bei anderen E-Mail-Anbietern manche Funktionen. Füge den Klartext ein und formatiere ihn danach.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Taste zum Formatieren", "Überschrift"] }, { on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Formatierung", "Überschrift"] }]} />
      <p>Füge den Text auf dem Mac über Bearbeiten, Einsetzen ein. Klicke in eine Abschnittszeile wie Beobachtungen und wähle über die Taste zum Formatieren Überschrift. Markiere die beiden Zeilen unter Anwendung und klicke auf die Taste für Checklisten.</p>
      <p>Markiere unter Querverweise die drei Zeilen von Stelle bis Sprüche 15,1 und wandle sie über die Taste für Tabellen um. Zwischen den Spalten steht jeweils ein Tabulator. Alternativ wähle Format, Tabelle und trage die Angaben in eine leere Tabelle ein. Die Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Mehr dazu steht im <a href="/blog/apple-notes-tables">Leitfaden für Tabellen</a>.</p>
      <p>Erstelle auf dem iPhone mit der Verfassen-Taste eine Notiz und füge den Text ein. Markiere die Abschnittszeilen und formatiere sie als Überschrift. Setze für Anwendung den Cursor unter die Überschrift, tippe auf die Checklistentaste und gib die Schritte ein. Der Zeilenschalter fügt den nächsten Punkt hinzu. Lösche danach die Klartextzeilen.</p>
      <p>Füge für Querverweise an der gewünschten Stelle eine Tabelle ein und trage Stelle und Vergleich in getrennte Spalten ein. Lösche anschließend die alten Zeilen. Apple beschreibt die Schritte im <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Handbuch</a>.</p>

      <h2 id="studieren">Eine Bibelstelle mit der Vorlage bearbeiten</h2>
      <p>Ersetze zuerst die Stelle und nenne deine Übersetzung. Füge nur einen kurzen Auszug mit Versnummer ein. Das Beispiel zitiert <a href="https://ebible.org/deu1912/JAS01.htm">Jakobus 1,22 aus der gemeinfreien Lutherbibel 1912</a>. Trenne fremden Wortlaut von deinen Beobachtungen.</p>
      <p>Lies den ganzen Abschnitt, bevor du Beobachtungen einträgst. Notiere etwas, das sich am Text zeigen lässt, etwa das Spiegelbild. Schreib offene Punkte unter Fragen. Kennzeichne eine Deutung als deine eigene und notiere den zugehörigen Vers.</p>
      <p>Trag bei jedem Querverweis ein, warum du die Stellen vergleichen willst. Lies auch die umliegenden Verse. Wenn du einen Kommentar verwendest, notiere Titel und Seite oder Link neben der übernommenen Idee.</p>
      <p>Wähle eine Anwendung in deinen Worten. Die Szene beim Abendessen ist nur ein Beispiel. Schreib auch dein eigenes Gebet. Hake einen Schritt nach der Ausführung ab und ergänze einen datierten Satz zum Ergebnis oder zu offenen Fragen.</p>
      <p>Für die nächste Studie kannst du die Notiz auf dem Mac duplizieren. Ändere Titel und Datum und entferne alte Antworten. Auf dem iPhone kopierst du die Vorlage erneut in eine neue Notiz. Weitere Formate findest du im <a href="/blog/apple-notes-templates">Vorlagenleitfaden</a>.</p>

      <h2 id="grenzen">Was die Vorlage nicht übernimmt</h2>
      <p>Du füllst dieses Studienprotokoll selbst aus. Es sucht keine Verse und prüft Zitate nicht gegen deine Übersetzung. Lies jeden Querverweis in deiner Bibel und lass Fragen offen, wenn dir der Zusammenhang fehlt.</p>
      <h2 id="ki">Frühere Fragen mit ChatGPT oder Claude finden</h2>
      <p>Du kannst die Vorlage in Pinto Notes mit Überschriften, Checklisten und Tabellen nutzen. Wenn du <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT oder Claude verbindest</a> und Allow wählst, darf die KI Notizen lesen und bearbeiten. Lass sie zunächst nach früheren Fragen zum Thema suchen.</p>
      <Keep title="Frühere Fragen suchen lassen" text={PROMPT} copyLabel={ui.copy} note="Ersetze Titel und Thema. Für Treffer müssen ältere Studiennotizen vorhanden sein." />
      <p>Vergleiche jeden Treffer mit Titel, Datum und Wortlaut der Quelle. Wenn es keine passende Frage gibt, bleibt die Notiz unverändert. Prüfe nach einer Änderung, ob Zitat und eigene Antworten erhalten sind. Eine vorgeschlagene Deutung solltest du selbst am Bibeltext prüfen.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
