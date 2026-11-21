import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "retrospektive-vorlage-apple-notizen");

// German version of /blog/apple-notes-retrospective-template. Google autocomplete hl=de,
// gl=de, read 21 Nov 2026: "retrospektive vorlagen", "sprint retrospektive vorlage"
// and "scrum retrospektive vorlage". Apple support read 21 Nov 2026:
// support.apple.com/de-de/guide/notes/apd1955d3b21/mac (Überschrift),
// apd0a136b9cc/mac (Format, Tabelle), apd93c815aa0/mac (Checkliste),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// Unlabeled icons are described by function.
const ui = UI.de;

const TEMPLATE = `Rückblick: Hilfeseiten im November überarbeitet

Projektzeit: 9. bis 20. November 2026
Rückblick: 23. November 2026
Beteiligte: Sara, Text; Jonas, Gestaltung

Geplantes und tatsächliches Ergebnis
Plan\tErgebnis und Quelle
8 überarbeitete Hilfeseiten bis 20. November veröffentlichen\t8 Seiten am 20. November online. Quelle: Checkliste zur Veröffentlichung.
Eine Freigaberunde pro Seite\t3 von 8 Seiten brauchten eine zweite Runde. Quelle: Freigabeprotokoll.

Was gut lief
Sara prüfte jede Anleitung, bevor sie den Entwurf an Jonas gab.
In der Checkliste war für jede veröffentlichte Seite eine prüfende Person benannt.

Was nicht gut lief
Zwei Screenshots zeigten bei der ersten Prüfung noch die alte Navigation.
Der Umfang der Seite zu Kontoeinstellungen änderte sich, nachdem Sara sie geschrieben hatte.

Ursachen noch unklar
Vielleicht verringern früher abgestimmte Gliederungen die zweite Freigaberunde.
Im Protokoll steht nicht, warum jede betroffene Seite eine weitere Runde brauchte.

Was wir beibehalten
Anleitungen vor der Freigabe testen und für die Veröffentlichung eine prüfende Person benennen.

Nächster Versuch
Die Gliederungen vor dem Schreiben der Dezember-Aktualisierung abstimmen.
Verantwortlich: Jonas
Ausgangswert: 3 von 8 Seiten brauchten im November eine zweite Freigaberunde.
Prüfung: Höchstens 1 von 6 Dezember-Seiten braucht eine zweite Runde.
Prüftermin: 7. Dezember 2026

Aufgaben
Jonas: bis 25. November alle sechs Gliederungen mit Sara abstimmen.
Sara: bis 4. Dezember Zahl und Gründe der zweiten Freigaberunden notieren.

Ergebnis der Prüfung
Noch offen. Am 7. Dezember das Freigabeprotokoll mit dem Prüfkriterium vergleichen.
`;

const PROMPT = `Lies meine Pinto-Notes-Notiz "Rückblick: Hilfeseiten im November überarbeitet".
Schlage auf Grundlage von Was nicht gut lief einen anderen Versuch vor.
Trenne Beobachtungen von möglichen Ursachen. Behaupte nicht, die Notiz beweise eine Ursache.
Zeig mir die geplante Änderung und ein Prüfkriterium zuerst im Chat.
Wenn ich den Versuch wähle, frag nach verantwortlicher Person und Prüftermin. Erfinde beides nicht.
Ersetze erst danach Nächster Versuch und Aufgaben in der Notiz.
Lass die ursprünglichen Ergebnisse, Beobachtungen und den Ausgangswert unverändert.`;

const FAQ = [
  { q: "Was gehört in eine Retrospektive in Apple Notizen?", a: ["Benenne das abgeschlossene Projekt und die Daten. Vergleiche Plan und Ergebnis, notiere gute und schwierige Punkte und schließe mit einem Versuch, Aufgaben mit Zuständigkeiten und einem Prüftermin ab. Trenne mögliche Ursachen von Beobachtungen."] },
  { q: "Funktioniert die Vorlage auch allein?", a: ["Ja. Trage deinen Namen bei den Aufgaben ein und prüfe eine abgeschlossene Arbeit. Vergleiche etwa einen Newsletter mit dem Plan und teste eine Änderung bei der nächsten Ausgabe."] },
  { q: "Wie viele Aufgaben sollte ein kleines Team festlegen?", a: ["Beginnt mit einer Änderung für das nächste Projekt. Jede dafür nötige Aufgabe bekommt eine Person und ein Datum. Nicht beschlossene Ideen bleiben getrennt stehen."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="retrospektive-vorlage-apple-notizen"
    intro={<>Kopiere diese Vorlage für eine Retrospektive in Apple Notizen nach einem Projekt oder Sprint. Halte fest, was gut lief, was nicht, und wer bis zum nächsten Rückblick welche Aufgabe übernimmt.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#rueckblick", label: "Rückblick durchführen" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "KI nutzen" }]}>
      <p>Eine Tabelle vergleicht Plan und Ergebnis. Beobachtungen stehen in eigenen Abschnitten, beschlossene Aufgaben in einer Checkliste. Das Beispiel endet mit einer Änderung für das nächste Projekt, einer verantwortlichen Person und einem Prüftermin.</p>
      <div id="vorlage"><Keep title="Retrospektive für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Kopiere die Vorlage in eine neue Notiz. Unten wird aus den Ergebnissen eine Tabelle und aus den beiden Aufgaben eine Checkliste." /></div>
      <PostCta slug="de/retrospektive-vorlage-apple-notizen" path="/de/blog/retrospektive-vorlage-apple-notizen" position="answer" title="Einen weiteren Versuch entwerfen?" ui={ui.cta}><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude den Rückblick lesen und beschlossene Änderungen speichern.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Retrospektive in Apple Notizen einrichten</h2>
      <p>Nutze eine iCloud-Notiz oder eine Notiz auf deinem Gerät. Bei anderen E-Mail-Anbietern fehlen laut Apple manche Funktionen.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Taste zum Formatieren", "Überschrift"] }, { on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Formatierung", "Überschrift"] }]} />
      <p>Füge den Text auf dem Mac in eine neue Notiz ein. Formatiere die Abschnittszeilen über die Taste zum Formatieren als Überschrift. Markiere die drei Zeilen von Plan bis zur zweiten Freigaberunde und wandle sie mit der Taste für Tabellen um. Tabulatoren trennen die Spalten. Alternativ wähle Format, Tabelle und trage die Ergebnisse selbst ein. Die Tabulatortaste in der letzten Zelle ergänzt eine Zeile. Mehr im <a href="/blog/apple-notes-tables">Tabellenleitfaden</a>.</p>
      <p>Markiere die beiden Aufgaben und wandle sie mit der Checklistentaste um. Ein Haken folgt erst nach Erledigung.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge den Text ein. Formatiere die Abschnittszeilen als Überschriften. Füge für Plan und Ergebnis eine Tabelle mit zwei Spalten hinzu und lösche danach die Klartextzeilen. Erstelle die Aufgaben mit der Checklistentaste. Der Zeilenschalter ergänzt den zweiten Punkt.</p>
      <h2 id="rueckblick">Ein abgeschlossenes Projekt besprechen</h2>
      <p>Vergleicht vor den Ursachen erst Plan und Ergebnis. Im Beispiel gingen alle acht Seiten pünktlich online, aber drei brauchten eine weitere Freigabe. Beides gehört ins Protokoll. Ersetze die Quellennamen durch eure Unterlagen. Der <a href="/blog/apple-notes-templates">Vorlagenleitfaden</a> zeigt, wie du eine Basisnotiz wiederverwendest.</p>
      <p>Gib in einem kleinen Team allen Zeit, Beobachtungen aufzuschreiben. Benenne ein Ereignis wie die zwei veralteten Screenshots, statt eine Person als nachlässig zu bezeichnen. Allein kannst du dieselben Abschnitte nutzen und deinen Namen bei den Aufgaben eintragen.</p>
      <p>Unklare Ursachen stehen separat. Die späte Änderung des Umfangs könnte zusätzliche Prüfungen erklären, doch diese Notiz belegt das nicht. Sara erfasst im nächsten Durchgang die Gründe für zweite Runden. Für laufende Gespräche eignet sich das <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Besprechungsprotokoll</a>.</p>
      <h2>Eine Änderung wählen und später prüfen</h2>
      <p>Hier sollen Gliederungen vor dem Schreiben abgestimmt werden. Jonas übernimmt diese Änderung. Sara zählt die nötigen zweiten Freigaberunden. Frag beide, bevor du ihre Namen und Fristen einträgst.</p>
      <p>Trage am 7. Dezember unter Ergebnis der Prüfung die Zahl und den Verlauf ein, auch wenn der Versuch nichts verbessert hat. Weniger zweite Runden sind ein Hinweis für die Besprechung. Ein anderer Satz von Seiten beweist aber keine Ursache. Entscheidet dann, ob ihr die Änderung beibehaltet.</p>
      <h2 id="grenzen">Grenzen einer Retrospektive in Notizen</h2>
      <p>Namen und Termine sind hier Text. Sie weisen keine Aufgaben zu und erzeugen keine Erinnerung. Trag den Prüftermin bei Bedarf in euren Kalender ein und öffne die Aufgabenliste beim nächsten Treffen.</p>
      <p>Das Protokoll bietet keine anonyme Abstimmung und belegt keine Ursache für eine Verzögerung. Offene Erklärungen bleiben sichtbar.</p>
      <h2 id="ki">Einen Versuch mit ChatGPT oder Claude entwerfen</h2>
      <p>Du kannst diesen Aufbau mit Überschriften, Checkliste und Tabelle in Pinto Notes verwenden. <a href="/blog/connect-chatgpt-to-your-notes">Verbinde ChatGPT oder Claude</a> und wähle Allow. Damit erlaubst du Lesen und Bearbeiten. Lass danach eine Änderung für den nächsten Versuch vorschlagen.</p>
      <Keep title="Einen anderen Versuch vorschlagen lassen" text={PROMPT} copyLabel={ui.copy} note="Ersetze den Titel durch deine Notiz. Prüfe den Vorschlag anhand der Beobachtungen." />
      <p>Der Vorschlag sollte zu einer Beobachtung passen und mögliche Ursachen als unsicher kennzeichnen. Prüfe nach dem Speichern Zuständigkeit und Datum. Die ursprünglichen Ergebnisse und der Ausgangswert müssen bleiben. Die Durchführung und Auswertung liegen bei euch.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
