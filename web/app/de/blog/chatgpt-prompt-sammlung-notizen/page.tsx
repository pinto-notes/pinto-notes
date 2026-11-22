import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "chatgpt-prompt-sammlung-notizen");

// German version of /blog/chatgpt-prompt-library-in-notes, read 21 Nov 2026.
// Google autocomplete (client=firefox, hl=de, gl=de), read 21 Nov 2026:
// "chatgpt prompt sammlung" returned itself; "chatgpt prompt bibliothek"
// returned itself. "chatgpt prompts speichern" also returned itself.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/apd558a85438/mac
// confirms "Ablage" > "Neuer Ordner"; https://support.apple.com/de-de/guide/notes/apdb54e469b6/mac
// confirms "Ablage" > "Notiz anpinnen". The cited pages do not give localized menu names for
// Paste as Markdown or Duplicate Note; those actions are described without invented labels.
// Pinto and ChatGPT claims follow the English post. This is an example, not a shipped template.

const ui = UI.de;
const TEMPLATE = `# Prompt: Wöchentlicher Projektstand

Status: Noch zu testen
Zuletzt getestet: JJJJ-MM-TT
Getestet mit: Verwendete App und Modell

## Wann verwenden
Aus ungeordneten Projektnotizen einen kurzen Stand für eine Kollegin schreiben.

## Wiederverwendbarer Prompt
Schreibe einen wöchentlichen Projektstand für [ZIELGRUPPE] und nutze nur [NOTIZEN].
Verwende zwei Überschriften: Fortschritt und Nächste Schritte.
Bleibe unter 150 Wörtern und schreibe kurze Sätze.
Übernimm Namen und Daten genau. Erfinde keine Fristen.
Falls eine Angabe für einen brauchbaren Text fehlt, frage zuerst nach.

## Beispieleingabe
Zielgruppe: Designteam
Notizen: Entwurf der Startseite fertig. Besprechung für Dienstag angesetzt.

## Beispielergebnis zum Vergleichen
Fortschritt: Der Entwurf der Startseite ist fertig.
Nächste Schritte: Den Entwurf am Dienstag besprechen.

## Notizen zum Test
Prüfen, ob Dienstag erhalten bleibt und keine Frist dazukommt.
Dieses Beispiel durch ein selbst geprüftes Ergebnis ersetzen.
`;

const RETRIEVE = `Suche in meinen Pinto Notes nach "Prompt: Wöchentlicher Projektstand" und lies die Notiz.
Zeige mir den Abschnitt Wiederverwendbarer Prompt, bevor du ihn nutzt.
Frage mich nach der Zielgruppe und den Notizen dieser Woche. Ändere den gespeicherten Prompt nicht.`;

const faq = [
  { q: "Wie lege ich eine ChatGPT-Prompt-Sammlung in Apple Notizen an?", a: ["Erstelle einen Ordner für Prompts und speichere je Aufgabe einen Prompt in einer eigenen Notiz. Halte Zweck, kopierbaren Text und ein geprüftes Beispiel fest. Suche später nach dem Aufgabennamen."] },
  { q: "Was gehört neben den wiederverwendbaren Prompt?", a: ["Speichere eine Beispieleingabe und ein brauchbares Ergebnis sowie Datum und verwendetes Modell. Notiere, was du geändert hast, wenn das Ergebnis nicht passte. Trenne die bleibenden Anweisungen von jeder neuen Eingabe."] },
  { q: "Kann ChatGPT einen Prompt aus Pinto Notes holen?", a: ["Ja, nachdem du Pinto Notes verbunden und Allow gewählt hast. ChatGPT kann die Notiz suchen und lesen. Lass dir erst die gespeicherten Anweisungen zeigen und gib dann die neue Eingabe. Allow erlaubt auch das Bearbeiten."] },
  { q: "Ersetzt die Sammlung Platzhalter automatisch?", a: ["Nein. Die Wörter in eckigen Klammern sind Erinnerungen. Ersetze sie vor dem Einfügen selbst oder lass verbundenes ChatGPT nach den fehlenden Angaben fragen. Die Vorlage ist eine gewöhnliche Notiz, die du selbst anlegst."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="chatgpt-prompt-sammlung-notizen"
    intro={<>Speichere jeden wiederverwendbaren ChatGPT-Prompt in einer eigenen Notiz, mit klarem Aufgabennamen und geprüftem Beispiel. Aus Apple Notizen kopierst du ihn selbst. Mit Pinto Notes kann verbundenes ChatGPT ihn für dich suchen und lesen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vorlage", label: "Vorlage kopieren" },
      { href: "#ordnen", label: "Prompts ordnen" },
      { href: "#testen", label: "Änderungen testen" },
      { href: "#pinto", label: "Mit ChatGPT abrufen" },
    ]}>
      <p>Lege für eine Prompt-Sammlung in Notizen einen Ordner an. Speichere pro Aufgabe eine Notiz. Trenne die wiederverwendbaren Anweisungen von der Eingabe für einen einzelnen Durchlauf und füge ein geprüftes Beispiel hinzu. Kopiere bei Bedarf die Anweisungen nach ChatGPT und gib neue Angaben dazu.</p>
      <PostCta slug="de/chatgpt-prompt-sammlung-notizen" path="/de/blog/chatgpt-prompt-sammlung-notizen" position="answer" ui={ui.cta} title="Lass ChatGPT deinen Prompt finden">
        <p>Pinto Notes funktioniert ähnlich wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden kann ChatGPT eine Prompt-Notiz suchen und lesen. Pinto Notes ist auf Englisch.</p>
      </PostCta>
    </Answer>}
    faq={faq}>
    <h2 id="vorlage">Eine Prompt-Notiz zum Kopieren</h2>
    <p>Die Anweisungen stehen vor dem Beispiel. So kopierst du nur den Teil, den du brauchst. Der wöchentliche Projektstand ist ein Ausgangspunkt; für andere Aufgaben kannst du die Abschnitte beibehalten.</p>
    <Keep title="Notiz für die Prompt-Sammlung" text={TEMPLATE}
      note="Auf einem Mac mit macOS 27 kannst du den Text in Notizen als Markdown einsetzen, damit Titel und Überschriften formatiert werden. Beim normalen Einfügen bleiben die Markdown-Zeichen als Text stehen." />
    <p>Ersetze <code>[ZIELGRUPPE]</code> und <code>[NOTIZEN]</code> in der Fassung, die du an ChatGPT schickst. In deiner Sammlung bleiben die Platzhalter stehen. Kopiere nur den Abschnitt „Wiederverwendbarer Prompt“ samt den aktuellen Angaben.</p>

    <h2 id="ordnen">Prompts nach Aufgabe wiederfinden</h2>
    <p>Wähle in Apple Notizen auf dem Mac „Ablage“ &gt; „Neuer Ordner“ und nenne ihn „Prompts“. Benenne jede Notiz nach ihrer Aufgabe, etwa „Prompt: Wöchentlicher Projektstand“ oder „Prompt: Codeänderung erklären“. Die Suche findet auch Wörter im Notiztext.</p>
    <p>Eine häufig genutzte Notiz kannst du mit „Ablage“ &gt; „Notiz anpinnen“ oben halten. Laut <a href="https://support.apple.com/de-de/guide/notes/apdb54e469b6/mac">Apple</a> geht das mit aktualisierten iCloud-Notizen oder lokal auf dem Mac gespeicherten Notizen. Eine Notiz pro Aufgabe hält Testergebnisse bei den richtigen Anweisungen. Die <a href="/blog/apple-notes-templates" hrefLang="en">Vorlagenanleitung</a> erklärt das Kopieren einer Grundnotiz.</p>
    <p>Dupliziere auf dem Mac deine Grundnotiz, gib der Kopie einen neuen Namen und entferne das alte Beispiel. Nutze einfache Statusangaben wie „Noch zu testen“ und „Getestet“.</p>

    <h2 id="testen">Festhalten, warum ein Prompt nützlich ist</h2>
    <p><a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt">OpenAIs Anleitung</a> empfiehlt klare Anweisungen und genug Kontext. Danach solltest du die Antwort prüfen und den Prompt anpassen. In der Notiz kannst du diese Versuche festhalten.</p>
    <ol>
      <li>Probiere den Prompt mit einer kurzen Beispieleingabe.</li>
      <li>Prüfe, ob Dienstag erhalten bleibt und keine Frist erfunden wird.</li>
      <li>Wenn das Ergebnis nicht passt, ändere eine Anweisung und teste dieselbe Eingabe erneut.</li>
      <li>Speichere ein brauchbares Ergebnis, deine Änderung, Datum und Modell.</li>
    </ol>
    <p>Teste eine zweite Eingabe, bevor du den Prompt als „Getestet“ markierst. Ein Projektstand ohne Besprechungstermin zeigt, ob ChatGPT einen erfindet. Ein gespeichertes Ergebnis hilft beim Vergleichen, garantiert aber keine spätere Antwort.</p>

    <h2 id="grenzen">Was die Sammlung nicht selbst erledigt</h2>
    <p>In Apple Notizen suchst du die Notiz und kopierst die Anweisungen selbst. Platzhalter sind normaler Text. Fülle sie für jeden Durchlauf aus und prüfe die Antwort. Eine gespeicherte Notiz startet nichts automatisch und fügt auch nichts in den Browser ein.</p>

    <h2 id="pinto">Gespeicherte Prompts mit ChatGPT abrufen</h2>
    <p>Nutze dieselbe Struktur als normale Notiz in Pinto Notes, einer App für iPhone und Mac mit der Bedienung von Apple Notizen. Folge der <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT-Anleitung</a> und wähle Allow in Pinto Notes. Diese Zustimmung erlaubt ChatGPT, deine Notizen zu lesen und zu bearbeiten.</p>
    <Keep title="Gespeicherten Prompt anfordern" text={RETRIEVE}
      note="Verbinde Pinto Notes zuerst. Diese Bitte holt die Anweisungen und fragt nach aktuellen Angaben." />
    <p>Prüfe, ob ChatGPT die richtige Notiz gefunden hat. Wenn du eine bessere Fassung bestätigst, lass die Anweisungen und das geprüfte Beispiel in derselben Notiz speichern. Pinto Notes behält frühere Versionen, falls die Änderung weniger nützlich ist.</p>
    <p>Du pflegst diese Sammlung selbst und entscheidest, wann du einen Prompt abrufst. Liegt sie schon in Apple Notizen, kannst du sie <a href="/blog/import-your-notes" hrefLang="en">auf dem Mac importieren</a>. Apple Notizen bleibt unverändert.</p>
  </LocalPostPage>;
}
