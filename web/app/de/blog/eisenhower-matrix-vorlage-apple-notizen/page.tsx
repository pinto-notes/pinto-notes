import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "eisenhower-matrix-vorlage-apple-notizen");
// German version of /blog/apple-notes-eisenhower-matrix-template, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "eisenhower matrix vorlage" yielded itself,
// "eisenhower matrix vorlage kostenlos" and "eisenhower matrix vorlage onenote";
// the longer seed with "notizen" yielded no suggestions. Suggestions are not volumes.
// Apple German support read 21 Nov: de-de/guide/notes/apd1955d3b21/mac (Format,
// Überschrift), apd93c815aa0/mac (Checkliste), not9474646a9/mac (Notiz duplizieren),
// and de-ch/guide/iphone/iph1ac0b3a2/27/ios/27 (Neue Notiz, Format, Überschrift,
// Checkliste), and de-de/102296 (Zeilenschalter). Mac pages returned 429 in
// the web reader; existing German posts verified
// Ablage, Notiz duplizieren. No other menu name is assumed. No pictures.
const ui = UI.de;
const TEMPLATE = `Buchungsseite fürs Café, Woche ab 23. November

Ergebnis: Neue Buchungsseite am 27. November veröffentlichen.
Prüfung: 24. November, 09:00 Uhr.

Erledigen: wichtig und dringend
Buchungsformular auf dem Handy vor den heutigen Testbuchungen reparieren. Der Senden-Knopf funktioniert nicht.
Testlink bis 23. November, 17:00 Uhr an die Café-Inhaberin schicken. Morgen braucht sie ihn für ihre Rückmeldung.

Einplanen: wichtig, nicht dringend
Bestätigungsmails am 25. November um 10:00 Uhr testen, vor der Veröffentlichung.
Übergabeanleitung am 26. November um 14:00 Uhr schreiben, damit die Inhaberin Öffnungszeiten ändern kann.

Abgeben oder verkleinern: dringend, für das Ergebnis weniger wichtig
Jonas bitten, das Bannerbild bis 24. November anzupassen. Erst fragen, ob er Zeit hat.
Auf die optionale Einladung zum Startgespräch heute bis 16:00 Uhr antworten. Stattdessen um eine schriftliche Info bitten.

Streichen: weder wichtig noch dringend
Keine neuen Website-Designs suchen. Das aktuelle Design ist freigegeben.
Die internen Ordnersymbole lassen. Sie beeinflussen die Buchungsseite nicht.
`;
const PROMPT = `Lies meine Notiz „Buchungsseite fürs Café, Woche ab 23. November“. Schlage zuerst hier im Chat Änderungen an den vier Eisenhower-Listen vor. Beurteile die Wichtigkeit anhand des genannten Ergebnisses und die Dringlichkeit anhand der Fristen und Folgen in der Notiz. Begründe jeden Vorschlag. Frag bei fehlenden Angaben nach, statt Fristen zu erfinden oder anzunehmen, dass jemand eine Aufgabe übernehmen kann. Bearbeite die Notiz erst, wenn ich den Änderungen zustimme.`;
const FAQ = [
  { q: "Wie erstelle ich eine Eisenhower-Matrix in Apple Notizen?", a: ["Lege vier Überschriften mit je einer Checkliste an: Erledigen, Einplanen, Abgeben oder verkleinern, Streichen. Die Vorlage lässt sich als Text kopieren und mit den Notizen-Tasten formatieren."] },
  { q: "Brauche ich dafür eine Tabelle?", a: ["Nein. Vier getrennte Checklisten lassen Platz für Frist und Begründung jeder Aufgabe. Du kannst erledigte Punkte abhaken."] },
  { q: "Was mache ich mit dringenden, aber unwichtigen Aufgaben?", a: ["Prüfe die Folgen des Wartens und den Beitrag zum Ziel. Frag jemanden, ob er übernehmen kann, reduziere den Aufwand oder sage ab. Eine Frist allein macht eine Aufgabe nicht wichtig."] },
  { q: "Was gehört zu „Einplanen“?", a: ["Wichtige Arbeit, die noch warten kann. Schreib auf, wann du daran arbeiten willst. Einen Kalendereintrag musst du separat anlegen."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="eisenhower-matrix-vorlage-apple-notizen"
  intro={<>Vier Checklisten machen aus einer Apple Notiz eine Eisenhower-Matrix. Kopiere das ausgefüllte Beispiel und ordne deine Aufgaben nach Wichtigkeit und Dringlichkeit.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#vorlage", label: "Vorlage" }, { href: "#einrichten", label: "Einrichten" },
    { href: "#sortieren", label: "Aufgaben einordnen" }, { href: "#grenzen", label: "Grenzen" },
    { href: "#pinto-notes", label: "Mit KI prüfen" },
  ]}><p>Schreib das Ergebnis über vier Listen und bei jeder Aufgabe den Grund für ihren Platz. Im Beispiel geht es um die Buchungsseite eines Cafés.</p>
    <PostCta slug="de/eisenhower-matrix-vorlage-apple-notizen" path="/de/blog/eisenhower-matrix-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Prioritäten gegenprüfen"><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude deine Aufgaben lesen und Verschiebungen mit überprüfbaren Gründen vorschlagen.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="vorlage">Vier Listen mit Gründen</h2>
  <p>Das Beispiel hat ein Ergebnis: die Buchungsseite am 27. November veröffentlichen. Das defekte Formular verhindert heutige Tests. Die Übergabe ist wichtig, aber kann bis Donnerstag warten. Für das optionale Gespräch reicht heute eine kurze Antwort.</p>
  <Keep title="Eisenhower-Matrix für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text kopieren. Danach Überschriften und Aufgaben mit den Tasten in Notizen formatieren." />
  <h2 id="einrichten">Auf Mac oder iPhone einrichten</h2>
  <p>Nutze iCloud oder eine lokal gespeicherte Notiz. Bei anderen Accounts sind laut Apple manche Formatierungen nicht verfügbar. Die vier Listen lassen jeder Aufgabe Platz für Frist und Grund.</p>
  <Paths rows={[{ on: "Mac", steps: ["Format", "Überschrift"] }, { on: "iPhone", steps: ["Format", "Überschrift"] }]} />
  <p>Auf dem Mac fügst du den Text ein, ersetzt Ergebnis und Aufgaben und formatierst die vier Listennamen über Format als Überschriften. Markiere nur die Aufgaben unter einer Überschrift und klicke auf die Checklisten-Taste. Wiederhole das für alle vier Listen.</p>
  <p>Auf dem iPhone erstellst du eine neue Notiz, gibst Ergebnis und Prüftag ein und formatierst jeden Listennamen über „Format“ als „Überschrift“. Darunter legst du mit „Checkliste“ die Aufgaben an. Der Zeilenschalter fügt einen Eintrag hinzu. Hake eine gestrichene Aufgabe erst ab, wenn du dich zum Streichen entschieden hast.</p>
  <p>Für ein neues Projekt kannst du die Notiz auf dem Mac mit Ablage, Notiz duplizieren kopieren. <a href="/blog/apple-notes-templates" hrefLang="en">Apple-Notizen-Vorlagen</a> (auf Englisch) erklärt wiederverwendbare Notizen.</p>
  <h2 id="sortieren">Wichtig und dringend unterscheiden</h2>
  <p>Frag zuerst, ob eine Aufgabe dem Ergebnis dient oder eine wichtige Folge verhindert. Dann prüfe, welche Frist oder Abhängigkeit sie heute dringend macht. Schreib den Grund auf.</p>
  <ul><li>Erledigen: Das defekte Formular blockiert heutige Testbuchungen.</li><li>Einplanen: Die Übergabeanleitung braucht Zeit vor dem Start. Buche diese Zeit separat.</li><li>Abgeben oder verkleinern: Frag Jonas, bevor du ihm das Bannerbild zuordnest.</li><li>Streichen: Das genehmigte Design braucht keine neue Suche.</li></ul>
  <p>Wenn du allein arbeitest, kann die dritte Liste auch eine kleinere Lösung, eine abgesprochene Verschiebung oder eine Absage bedeuten. Ein Eintrag dort überträgt keine Verantwortung. Lies offene Punkte bei der nächsten Prüfung neu. Ein <a href="/de/blog/wochenrueckblick-vorlage-apple-notizen">Wochenrückblick</a> hilft, das Ergebnis erneut zu prüfen.</p>
  <h2 id="grenzen">Die Notiz handelt nicht für dich</h2>
  <p>Du ordnest und verschiebst die Aufgaben selbst. Ein Datum bucht keinen Kalendertermin, und Jonas bekommt durch seinen Namen keine Nachricht. KI kann die Gründe prüfen, braucht dafür aber echte Fristen und dein Ergebnis.</p>
  <h2 id="pinto-notes">Mit ChatGPT oder Claude prüfen</h2>
  <p>Pinto Notes hat Überschriften und Checklisten. Wenn du <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT oder Claude verbindest</a>, erlaubt ein „Allow“ das Lesen und Bearbeiten. Bitte zuerst nur um Vorschläge.</p>
  <Keep title="Prioritäten prüfen lassen" text={PROMPT} copyLabel={ui.copy} note="Ersetze den Notiztitel und prüfe jeden Vorschlag gegen deine Zusagen." />
  <p>Eine Verschiebung des defekten Formulars zu „Einplanen“ wäre hier falsch, weil der Test davon abhängt. Eine erfundene Frist für die Übergabe musst du korrigieren. Erst nach deiner Zustimmung soll die KI die Notiz ändern. Pinto Notes bewahrt frühere Versionen. Deine Apple Notizen kommen über <a href="/blog/move-from-apple-notes" hrefLang="en">einen Import auf dem Mac</a> mit und bleiben unverändert. Die App ist auf Englisch.</p>
</LocalPostPage>; }
