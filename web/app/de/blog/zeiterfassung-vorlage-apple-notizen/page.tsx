import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "zeiterfassung-vorlage-apple-notizen");

// German version of /blog/apple-notes-time-log-template. Google autocomplete hl=de, gl=de,
// read 21 Nov 2026: "zeiterfassung vorlage", "zeiterfassung vorlage excel" and
// "zeiterfassung vorlage kostenlos"; the Apple Notes-specific query returned no suggestion.
// Apple support read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd0a136b9cc/mac
// (Format, Tabelle; Tabulatortaste), apd93c815aa0/mac (Checkliste),
// guide/iphone/iph1ac0b3a2/ios (table), and /de-de/102296 (Verfassen-Taste,
// Checklistentaste, Zeilenschalter). Unlabeled icons are described by function.
const ui = UI.de;

const TEMPLATE = `Zeiterfassung, 16. bis 20. November 2026

Umfang: Nur Website, Newsletter und zugehörige Verwaltung. Keine vollständige Arbeitswoche.

Arbeitsblöcke
Datum\tBeginn\tEnde\tProjekt\tAufgabe\tMinuten
16.11.\t09:00\t10:10\tWebsite\tStartseite entwerfen\t70
16.11.\t10:10\t10:25\tVerwaltung\tAnruf zur Lieferung\t15
16.11.\t10:25\t11:10\tWebsite\tStartseite überarbeiten\t45
17.11.\t09:00\t09:40\tWebsite\tAnsicht auf dem Handy prüfen\t40
17.11.\t14:00\t14:55\tWebsite\tRückmeldung des Kunden einarbeiten\t55
18.11.\t10:00\t11:00\tWebsite\tAbnahme vorbereiten\t60
19.11.\t09:15\t10:00\tNewsletter\tNovember-Ausgabe schreiben\t45
19.11.\t10:10\t10:40\tVerwaltung\tProjekt-E-Mails bearbeiten\t30
20.11.\t09:00\t10:00\tWebsite\tFreigegebene Änderungen veröffentlichen\t60
20.11.\t10:15\t10:45\tNewsletter\tBetreffzeilen bearbeiten\t30

Tagessummen, von Hand addiert
16.11.: 130 Minuten
17.11.: 95 Minuten
18.11.: 60 Minuten
19.11.: 75 Minuten
20.11.: 90 Minuten
Wochensumme: 450 Minuten, 7 Stunden 30 Minuten

Projektsummen, von Hand addiert
Website: 330 Minuten
Newsletter: 75 Minuten
Verwaltung: 45 Minuten

Unterbrechungen und ungeklärte Zeit
16.11.: Der Anruf unterbrach die Website-Arbeit. Seine 15 Minuten stehen bereits unter Verwaltung.
19.11., 10:40 bis 11:00 Uhr: Tätigkeit nicht notiert. 20 Minuten ungeklärt und nicht in den Summen.

Wochenprüfung
Dauer jedes Arbeitsblocks mit Beginn und Ende vergleichen
Prüfen, ob Tages- und Projektsummen jeweils der Wochensumme entsprechen
`;

const PROMPT = `Lies meine Pinto-Notes-Notiz "Zeiterfassung, 16. bis 20. November 2026".
Ergänze am 20. November von 14:00 bis 14:35 Uhr einen Arbeitsblock für Website: veröffentlichte Links prüfen, 35 Minuten.
Lass alle bisherigen Einträge und die ungeklärte Zeit unverändert. Zähle den Anruf nicht doppelt.
Schlage neue Tages-, Projekt- und Wochensummen hier im Chat vor. Ändere die Summen in der Notiz erst nach meiner Prüfung.
Frag bei fehlenden oder überlappenden Zeiten nach. Erfinde keine Arbeitsblöcke und fülle keine Lücken.`;

const FAQ = [
  { q: "Welche Felder braucht eine Zeiterfassung in Apple Notizen?", a: ["Notiere für jeden Arbeitsblock Datum, Beginn, Ende, Projekt, Aufgabe und Minuten. Darunter stehen Tagessummen und Wochensumme. Beschreibe den Umfang, damit ein Teilausschnitt nicht wie eine ganze Arbeitswoche aussieht."] },
  { q: "Addiert die Tabelle die Minuten automatisch?", a: ["Nein. Minuten und Summen sind Text, den du einträgst und selbst prüfst. Weder die Tabelle in Apple Notizen noch dieselbe Vorlage in Pinto Notes summiert eine Spalte automatisch."] },
  { q: "Wie erfasse ich eine Unterbrechung ohne Doppelzählung?", a: ["Beende den ersten Arbeitsblock zu Beginn der Unterbrechung. Erfasse sie in einer eigenen Zeile und beginne danach einen neuen Arbeitsblock. Zähle nicht zugleich die gesamte Zeit als ursprüngliche Aufgabe."] },
  { q: "Was trage ich ein, wenn ich eine Tätigkeit vergessen habe?", a: ["Kennzeichne die Zeit als ungeklärt und lass sie aus Projektsummen heraus. Kannst du sie später aus einer verlässlichen Quelle rekonstruieren, markiere den Eintrag als Schätzung. Erfinde keine genaue Aufgabe."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="zeiterfassung-vorlage-apple-notizen"
    intro={<>Mit dieser Zeiterfassungsvorlage für Apple Notizen hältst du erledigte Arbeit in einer Tabelle fest. Trage die Minuten selbst ein und prüfe die Wochensumme anhand der Tagessummen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Vorlage kopieren" }, { href: "#tabelle", label: "Tabelle anlegen" }, { href: "#erfassen", label: "Zeit erfassen" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Eintrag mit KI ergänzen" }]}>
      <p>Eine Zeile steht für einen abgeschlossenen Arbeitsblock mit Datum, Zeiten, Projekt, Aufgabe und Minuten. Das Beispiel erfasst 450 Minuten an fünf Tagen. Eine Unterbrechung zählt einmal; ungeklärte Zeit bleibt getrennt.</p>
      <div id="vorlage"><Keep title="Zeiterfassung für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Ersetze die fiktiven Einträge und Summen durch deine eigenen. Unten steht, wie du die Zeilen in eine Tabelle umwandelst." /></div>
      <PostCta slug="de/zeiterfassung-vorlage-apple-notizen" path="/de/blog/zeiterfassung-vorlage-apple-notizen" position="answer" title="Arbeitsblöcke mit KI eintragen?" ui={ui.cta}><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude dein Protokoll lesen und die von dir genannten Arbeitsblöcke ergänzen.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="tabelle">Tabelle und Prüfliste anlegen</h2>
      <p>Nutze eine iCloud-Notiz oder eine auf dem Gerät gespeicherte Notiz. Füge zuerst den Klartext ein. Abschnittszeilen und Summen bleiben außerhalb der Tabelle.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Arbeitsblöcke markieren", "Format", "Tabelle"] }, { on: "iPhone", steps: ["Notiz erstellen", "Tabelle einfügen"] }]} />
      <p>Markiere auf dem Mac die elf Zeilen von Datum bis zum letzten Arbeitsblock und wähle Format, Tabelle. Jeder Tabulator trennt eine Spalte. Mit der Tabulatortaste in der letzten Zelle ergänzt du später eine Zeile. Apple erklärt das in der <a href="https://support.apple.com/de-de/guide/notes/apd0a136b9cc/mac">Mac-Anleitung für Tabellen</a>. Weitere Grenzen zeigt unser <a href="/blog/apple-notes-tables">Tabellenleitfaden</a>.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge den Text ein. Für eine schmale Tabelle füge zwei Spalten hinzu: Arbeitsblock und Minuten. In Arbeitsblock stehen Datum, Zeiten, Projekt und Aufgabe, etwa "16.11., 09:00 bis 10:10, Website, Startseite entwerfen". In Minuten steht 70. Übertrage alle Zeilen und lösche danach den Klartext. Apple beschreibt die Tabelle im <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Handbuch</a>.</p>
      <p>Markiere auf dem Mac die beiden Zeilen unter Wochenprüfung und nutze die Checklistentaste. Auf dem iPhone setze den Cursor unter die Überschrift, tippe auf die Checklistentaste und gib beide Punkte ein. Der Zeilenschalter ergänzt den nächsten Punkt. Lösche die ursprünglichen Zeilen und hake die Prüfung nach Erledigung ab.</p>

      <h2 id="erfassen">Tatsächliche Zeit erfassen</h2>
      <p>Ersetze das Beispiel durch deine Woche und benenne den Umfang. Hier geht es um ausgewählte Projektstunden. Ein leerer Nachmittag sagt nichts über andere Arbeit aus. Geplante Aufgaben gehören in eine andere Notiz, damit sie nicht in die Summen geraten.</p>
      <p>Trage einen Block ein, wenn du eine Aufgabe beendest oder wechselst. Verwende immer denselben Projektnamen. Von 09:00 bis 10:10 Uhr sind es 70 Minuten Website. Der Anruf bekommt 15 Minuten unter Verwaltung; danach beginnt ein neuer Website-Block. Die ganze Spanne bis 11:10 Uhr zusätzlich als Website zu zählen, wäre falsch.</p>
      <p>Ungeklärte Zeit bleibt sichtbar. Am Donnerstag fehlen 20 Minuten ohne aufgezeichnete Tätigkeit. Sie stehen nicht in den Projektsummen. Falls du eine Tätigkeit später rekonstruierst, kennzeichne genaue und geschätzte Zeiten.</p>
      <h2>Wochensumme von Hand prüfen</h2>
      <p>Die Tagessummen ergeben 130 + 95 + 60 + 75 + 90 = 450 Minuten, also 7 Stunden 30 Minuten. Auch 330 Minuten Website, 75 Minuten Newsletter und 45 Minuten Verwaltung ergeben 450. Die ungeklärten 20 Minuten fehlen in beiden Rechnungen.</p>
      <p>Hake die Prüfpunkte nach dem Vergleich ab. Ändert sich ein Arbeitsblock, rechne die betroffenen Summen neu. Bewahre die abgeschlossene Woche als Beleg auf. Weitere Formate bietet der <a href="/blog/apple-notes-templates">Vorlagenleitfaden</a>.</p>

      <h2 id="grenzen">Grenzen der Zeiterfassung in Notizen</h2>
      <p>Die Vorlage hat keinen Timer und erfasst keine Tätigkeiten automatisch. Minuten und Summen schreibst du selbst. Weder Notizen noch diese Vorlage in Pinto addiert Tabellenspalten. Für viele Arbeitsblöcke mit automatischer Berechnung eignet sich eher eine Tabelle mit Formeln.</p>
      <p>Eine Summe beschreibt nur erfasste Zeiten. Sie erklärt keine Lücken und bestimmt nicht, welche Minuten abrechenbar sind. Entscheide das getrennt von diesem Protokoll.</p>

      <h2 id="ki">Einen Arbeitsblock mit ChatGPT oder Claude ergänzen</h2>
      <p>Du kannst diese Vorlage mit Tabelle und Prüfliste auch in Pinto Notes nutzen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> und Allow darf die KI Notizen lesen und bearbeiten. Nenne ihr einen tatsächlichen Arbeitsblock und lass ihn anhängen.</p>
      <Keep title="Auftrag an die verbundene KI" text={PROMPT} copyLabel={ui.copy} note="Nutze das ausgefüllte Beispiel oder ersetze Titel und Angaben durch deine eigenen." />
      <p>Prüfe, ob genau ein Block mit 35 Minuten hinzugekommen ist und die alten Zeilen unverändert sind. Im Beispiel steigen Freitag auf 125 Minuten, Website auf 365 Minuten und die Wochensumme auf 485 Minuten, also 8 Stunden 5 Minuten. Prüfe selbst, bevor du die gespeicherten Summen ändern lässt. Die ungeklärte Zeit bleibt ausgenommen.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/import-your-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
