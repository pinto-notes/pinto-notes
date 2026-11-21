import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "projektsteckbrief-vorlage-apple-notizen");

// German version of /blog/apple-notes-project-brief-template, 21 Nov 2026.
// Google autocomplete, hl=de, gl=de, read 21 Nov: "projektsteckbrief vorlage" returned the head,
// "projektsteckbrief vorlage excel", "kostenlos", "word" and "pdf". The broad term guides the slug.
// Apple support, German, read 21 Nov 2026: support.apple.com/de-de/guide/notes/not9474646a9/mac
// (Neue Notiz, Ablage > Notiz duplizieren), apd93c815aa0/mac (Checkliste), apd0a136b9cc/mac
// (Format > Tabelle, Tabulator in final cell); /guide/iphone/iph1ac0b3a2/ios (Format > Überschrift,
// Checkliste, Tabelle hinzufügen). No picture. The example is fictional and localized for Germany.
const ui = UI.de;

const TEMPLATE = `Projektsteckbrief: Abholseite für Café Linden

Verantwortlich: Sarah Lind
Freigabe: Amir Khan, Caféleiter
Zieltermin: 4. Dezember 2026
Status: Entwurf, Amir prüft noch

Ergebnis
Gäste finden die Abholkarte auf der Caféwebsite und bestellen mit dem Handy.
In der ersten Woche zählt Amir Anrufe mit Fragen zur Bestellung. Auswertung am 11. Dezember.

Umfang
Eine Abholseite mit aktueller Karte, Preisen und Abholzeiten.
Ein Link zum bestehenden Bestelldienst.
Ein Link „Abholen“ in der Websitenavigation.

Nicht im Umfang
Lieferung, ein neues Bezahlsystem und Änderungen am Bestelldienst.
Fotos und eine Neugestaltung der übrigen Website.

Abnahmekriterien
Amir hat jedes Gericht und jeden Preis mit der Karte am Tresen verglichen.
Die Seite nennt Abholzeiten und den Ort der Abholung.
Der Link „Abholen“ öffnet die Seite auf Sarahs iPhone und Mac.
Eine Testbestellung über den Link erreicht die Bestellseite des vorhandenen Dienstes.

Offene Fragen
Frage\tZuständig und Antwort bis
Wer pflegt die Karte nach dem Start?\tAmir, bis 25. November
Was zeigt die Seite außerhalb der Abholzeiten?\tSarah schlägt Text vor, Amir gibt ihn bis 26. November frei

Freigabe
Amir bestätigt Umfang und Abnahmekriterien bis 27. November.
Danach jede Änderung des Umfangs hier mit Datum und Auswirkung auf den Zieltermin festhalten.
`;

const FAQ = [
  { q: "Gibt es in Apple Notizen eine Vorlage für einen Projektsteckbrief?", a: ["Nein. Kopiere dieses ausgefüllte Beispiel in eine Notiz, ersetze die Angaben und formatiere Überschriften, Checkliste und Tabelle."] },
  { q: "Was gehört zu den Abnahmekriterien?", a: ["Schreibe überprüfbare Bedingungen auf. Eine Testbestellung, die die Bestellseite erreicht, ist genauer als die Forderung nach einer leicht bedienbaren Seite."] },
  { q: "Wie unterscheidet sich der Steckbrief vom Projektplan?", a: ["Der Steckbrief hält Ergebnis, Grenzen, Verantwortung und Abnahme fest. Im Projektplan stehen Aufgaben und Termine für die Umsetzung."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="projektsteckbrief-vorlage-apple-notizen"
    intro={<>Mit diesem Projektsteckbrief für Apple Notizen klärst du, was geliefert wird und woran ihr die Fertigstellung erkennt. Das Beispiel beschreibt eine Abholseite für ein Café.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "In Notizen einrichten" },
      { href: "#abstimmen", label: "Umfang abstimmen" }, { href: "#grenzen", label: "Grenzen" },
      { href: "#pinto-notes", label: "Mit KI prüfen" },
    ]}><p>Lege für jedes Projekt eine Notiz an. Oben stehen Ergebnis und Verantwortung, darunter Umfang und Abnahmekriterien. Ersetze die Angaben zum Café durch dein Projekt.</p>
      <PostCta slug="de/projektsteckbrief-vorlage-apple-notizen" path="/de/blog/projektsteckbrief-vorlage-apple-notizen" position="answer" ui={ui.cta} title="Den Steckbrief prüfen lassen?">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude den Steckbrief lesen und auf deine Bitte bearbeiten.</p>
      </PostCta></Answer>}
    hero={<></>} faq={FAQ}>
    <h2 id="vorlage">Die Vorlage: Was bedeutet fertig?</h2>
    <p>Im Beispiel bleibt der bestehende Bestelldienst erhalten. Ein neues Bezahlsystem würde den Auftrag verändern. Ersetze Namen und Daten. Formuliere jedes Abnahmekriterium so, dass es jemand prüfen kann.</p>
    <Keep title="Projektsteckbrief für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Als Text kopieren. Mit den Schritten unten Überschriften, eine Checkliste und die Tabelle ergänzen." />
    <h2 id="einrichten">In Apple Notizen einrichten</h2>
    <p>Klicke auf dem Mac auf „Neue Notiz“ und füge den Text ein. Markiere die Abschnittsnamen und wähle über die Taste „Format“ den Stil „Überschrift“. Nutze eine iCloud-Notiz oder eine auf dem Mac gespeicherte Notiz.</p>
    <Paths rows={[{ on: "Mac", steps: ["Abnahmekriterien markieren", "Taste „Checkliste“"] }, { on: "Mac", steps: ["Fragenzeilen markieren", "Format", "Tabelle"] }, { on: "iPhone", steps: ["Abschnittsnamen markieren", "Format", "Überschrift"] }]} />
    <p>Markiere auf dem Mac die vier Absätze unter „Abnahmekriterien“ und klicke auf „Checkliste“. Jeder Absatz wird ein Eintrag. Hake ihn erst ab, wenn Amir das Ergebnis geprüft hat. Eine erledigte Aufgabe ist noch keine bestandene Abnahme.</p>
    <p>Zwischen Frage und zuständiger Person steht ein Tabulator. Markiere die drei Zeilen und klicke auf die Taste „Tabelle“. Alternativ wähle „Format“, dann „Tabelle“, und trage die Fragen in die Zellen ein. Mit der Tabulatortaste in der letzten Zelle fügst du eine Zeile hinzu. Mehr dazu steht im <a href="/blog/apple-notes-tables" hrefLang="en">Tabellenratgeber</a> (auf Englisch).</p>
    <p>Auf dem iPhone kannst du die Überschriften mit „Format“ gestalten. Für die Abnahmekriterien legst du mit „Checkliste“ neue Einträge an. Für die Fragen erstellst du mit „Tabelle hinzufügen“ zwei Spalten und überträgst die Inhalte.</p>
    <p>Für das nächste Projekt wähle auf dem Mac „Ablage“, dann „Notiz duplizieren“. Ersetze das Beispiel und entferne die alte Freigabe. Auch die Kopie braucht eine neue Prüfung des Umfangs.</p>
    <h2 id="abstimmen">Den Steckbrief vor dem Start abstimmen</h2>
    <p>Das Ergebnis ist eine Abholseite, mit der Gäste am Handy bestellen können. Die Zahl der Rückfragen in der ersten Woche zeigt Amir später, ob sie geholfen hat. Sie ist getrennt von den Abnahmekriterien.</p>
    <p>Der Freigebende sollte auch die ausgeschlossenen Arbeiten lesen. Wird Lieferung doch verlangt, ändere zuerst Umfang und Termin. Lass den Status auf „Entwurf“, bis Amir zustimmt. Gib jeder offenen Frage eine zuständige Person und ein Antwortdatum. Die Gründe für eine Entscheidung kannst du im <a href="/de/blog/entscheidungsprotokoll-vorlage-apple-notizen">Entscheidungsprotokoll</a> festhalten.</p>
    <h2 id="grenzen">Wo die Vorlage aufhört</h2>
    <p>Daten und Namen bleiben Text. Die Tabelle erinnert dich an eine Antwort, verschickt aber keine Benachrichtigung und holt keine Freigabe ein. Trage das Bestätigungsdatum selbst ein.</p>
    <p>Ein Häkchen führt keine Testbestellung durch und vergleicht keine Preise. Ändert sich der Umfang, prüfe betroffene Kriterien erneut und entferne unpassende Häkchen. Tägliche Aufgaben gehören in einen eigenen Plan.</p>
    <h2 id="pinto-notes">Den Steckbrief mit ChatGPT oder Claude prüfen</h2>
    <p>Du kannst die Vorlage mit Überschriften, Checklisten und Tabellen in Pinto Notes bearbeiten. Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> kann die KI die Notiz lesen und bearbeiten.</p>
    <p>Frag: „Lies den Steckbrief für Café Linden. Welche Abnahmekriterien sind zu ungenau? Schlage überprüfbare Formulierungen vor und nenne offene Fragen zum Umfang.“ Prüfe die Vorschläge und lass nur die vereinbarten Änderungen übernehmen. Amir entscheidet über Umfang und Abnahme.</p>
    <p>Pinto bewahrt frühere Versionen auf. Du kannst eine wiederherstellen; dabei bleibt auch der ersetzte Text erhalten. Deine Apple Notizen kommen per <a href="/blog/move-from-apple-notes" hrefLang="en">Import auf dem Mac</a> mit, ohne Apple Notizen zu ändern. Die App ist auf Englisch.</p>
  </LocalPostPage>;
}
