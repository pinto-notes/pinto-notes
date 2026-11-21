import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "nutzerinterview-vorlage-apple-notizen");

// German version of /blog/apple-notes-user-interview-template. Google autocomplete hl=de,
// gl=de, read 21 Nov 2026: "nutzerinterview vorlage" and "user interview vorlage"
// returned no suggestions; the descriptive local query was retained, without a volume claim.
// Apple support read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd1955d3b21/mac
// (Überschrift), apd93c815aa0/mac (Checkliste), apd0a136b9cc/mac (Format, Tabelle),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// Unlabeled icons are described by function.
const ui = UI.de;

const TEMPLATE = `Nutzerinterview, P07, Umbuchung

Datum: 21. November 2026, 09:00 Uhr
Interview: Mira. Protokoll: Theo.
Person: P07, wiederkehrende Kundin eines Töpferkurses. Fiktives Beispiel.

Ziel
Prüfen, ob eine wiederkehrende Kundin einen Workshop ohne Kontakt zum Support umbuchen kann.

Einwilligung
09:00 Uhr: P07 stimmte schriftlichen Notizen und anonymen Zitaten für die interne Produktbesprechung zu.
Keine Ton- oder Videoaufnahme. Vor jeder KI-Nutzung getrennt um Erlaubnis fragen.

Fragen und Antwortnotizen
F1. Erzählen Sie von der letzten Umbuchung eines Workshops.
Antwortnotizen: Sie schrieb dem Atelier eine E-Mail, wartete zwei Tage und bekam dann ein neues Ticket.

F2. Ihr Töpferkurs am Samstag fällt mit Ihrer Arbeit zusammen. Zeigen Sie, wie Sie ihn auf Sonntag verschieben würden.
Antwortnotizen: Öffnete Kurse, dann Konto. Suchte einen Link zur Buchung, öffnete Hilfe. Brachte die Umbuchung nicht zu Ende.

F3. Was hätten Sie unter Konto erwartet?
Antwortnotizen: Eine Ticketliste mit einer Option zum Ändern des Datums neben jeder Buchung.

Belegprotokoll
ID und Uhrzeit\tBeobachtung oder genaue Aussage
E1, 09:06\tF1, Zitat: "Ich habe eine E-Mail geschrieben, weil ich keine Möglichkeit zum Umbuchen gefunden habe."
E2, 09:13\tF2, Beobachtung: Öffnete Kurse, Konto und Hilfe. Schloss die Umbuchung nicht ab.
E3, 09:15\tF3, Zitat: "Das erwarte ich direkt neben meinem Ticket."

Deutung, noch zu prüfen
P07 erwartet die Umbuchung vielleicht neben einem Ticket unter Konto. Grundlage: E2 und E3.
Dieses Gespräch zeigt nicht, ob andere Kundinnen und Kunden denselben Weg erwarten.

Offene Fragen
Würde P07 einen Link Meine Buchungen unter Konto bemerken? Später mit einer neuen Aufgabe testen.
War die Umbuchung für dieses Ticket überhaupt möglich? Testumgebung prüfen.

Nächste Schritte
Theo: Regeln für die Testbuchung bis 23. November prüfen
Mira: Aufgabe zu Meine Buchungen bis 24. November in den Leitfaden für das nächste Interview aufnehmen
`;

const PROMPT = `Lies meine Pinto-Notes-Notiz "Nutzerinterview, P07, Umbuchung".
Erstelle eine separate Notiz "Ergebnisentwurf, P07, Umbuchung". Lass die Quellnotiz unverändert.
Nutze nur dieses Interview. Trenne berichtete Erfahrungen, beobachtete Handlungen, genaue Zitate und mögliche Deutungen.
Nenne für jede Erkenntnis P07, die Beleg-ID und die Zeilennummern, die du beim Lesen der Quelle erhältst.
Übernimm Zitate wortgetreu. Mach aus Antwortnotizen keine Zitate.
Führe offene Fragen und geplante nächste Schritte getrennt auf. Erfinde keine Antworten und verallgemeinere nicht auf andere Personen.
Lass Erkenntnisse ohne Beleg weg. Kennzeichne die neue Notiz als Entwurf, den ich prüfe.`;

const FAQ = [
  { q: "Was gehört in eine Vorlage für Nutzerinterviews?", a: ["Notiere Forschungsziel, Kennung der befragten Person, Einwilligung, Fragen und Antwortnotizen, Belegprotokoll und nächste Schritte. Trenne wörtliche Zitate und beobachtete Handlungen von Deutungen. Nutze eine Notiz pro Gespräch."] },
  { q: "Wie kennzeichne ich Zitate im Interviewprotokoll?", a: ["Gib jedem Zitat eine Beleg-ID und Uhrzeit. Übernimm die Worte genau. Zusammenfassungen stehen unter Antwortnotizen. Wenn der Wortlaut unklar ist, verwende keine Anführungszeichen."] },
  { q: "Brauche ich für diese Vorlage eine Tonaufnahme?", a: ["Nein. Das Beispiel nutzt schriftliche Notizen. Halte vorher fest, wozu die Person einwilligt. Die Beispielzeile ersetzt weder ihre Einwilligung noch die Erlaubnis, Gesprächsdaten mit einer KI zu teilen."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="nutzerinterview-vorlage-apple-notizen"
    intro={<>Kopiere diese Vorlage für Nutzerinterviews in Apple Notizen, eine Notiz pro Gespräch. Sie trennt Antworten von genauen Zitaten, beobachteten Handlungen und offenen Fragen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#gespraech", label: "Im Gespräch" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Ergebnisse entwerfen" }]}>
      <p>Oben stehen Ziel und Einwilligung, dann Fragen und Antworten. Ein eigenes Protokoll hält die Belege fest. Das ausgefüllte Beispiel begleitet eine Kundin bei der Umbuchung eines Töpferkurses. Ersetze die Angaben vor deinem Gespräch.</p>
      <div id="vorlage"><Keep title="Nutzerinterview in Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Füge den Klartext in eine neue Notiz ein. Unten steht, wie du das Belegprotokoll in eine Tabelle und die nächsten Schritte in eine Checkliste umwandelst." /></div>
      <PostCta slug="de/nutzerinterview-vorlage-apple-notizen" path="/de/blog/nutzerinterview-vorlage-apple-notizen" position="answer" title="Ergebnisse aus Interviewnotizen entwerfen?" ui={ui.cta}><p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude ein Interview lesen und einen getrennten Ergebnisentwurf erstellen, den du prüfst.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Auf Mac oder iPhone einrichten</h2>
      <p>Nutze eine iCloud-Notiz oder eine Notiz auf deinem Gerät. Bei anderen Anbietern fehlen manche Funktionen. Lass Fragen und Antworten als gewöhnlichen Text, damit du während des Gesprächs Platz zum Schreiben hast.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Taste zum Formatieren", "Überschrift"] }, { on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Formatierung", "Überschrift"] }]} />
      <p>Füge die Vorlage auf dem Mac ein. Wähle für Abschnittszeilen wie Ziel über die Taste zum Formatieren Überschrift. Markiere die zwei Aufgaben unter Nächste Schritte und wandle sie über die Checklistentaste um. Hake einen Punkt erst nach Erledigung ab. Apple erklärt <a href="https://support.apple.com/de-de/guide/notes/apd1955d3b21/mac">Formatierung</a> und <a href="https://support.apple.com/de-de/guide/notes/apd93c815aa0/mac">Checklisten</a>.</p>
      <p>Markiere die vier Zeilen von ID und Uhrzeit bis E3 und wandle sie mit der Taste für Tabellen um. Die Tabulatoren trennen zwei Spalten. Alternativ wähle Format, Tabelle und gib den Inhalt selbst ein. Die Tabulatortaste in der letzten Zelle ergänzt eine Zeile. Mehr steht in <a href="https://support.apple.com/de-de/guide/notes/apd0a136b9cc/mac">Apples Anleitung</a> und im <a href="/blog/apple-notes-tables">Tabellenleitfaden</a>.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge die Vorlage ein. Formatiere Abschnittszeilen als Überschriften. Füge für das Belegprotokoll eine Tabelle mit zwei Spalten ein und entferne danach den Klartext. Erstelle die nächsten Schritte über die Checklistentaste. Der Zeilenschalter ergänzt den nächsten Punkt. Apple beschreibt die <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">Formatierung</a> und <a href="https://support.apple.com/de-de/102296">Checklisten</a>.</p>
      <h2 id="gespraech">Antworten bei jeder Frage notieren</h2>
      <p>Ersetze vor dem Gespräch das Ziel. Lösche Beispielantworten, Belege und Deutungen. Behalte die Fragenkennungen und gib der Person eine Kennung. Ersetze die Einwilligungszeile durch das, wozu sie tatsächlich zustimmt, einschließlich der Nutzung von Notizen und Zitaten. Frag, bevor du mitschreibst.</p>
      <p>Schreibe während des Gesprächs kurze Antwortnotizen unter die Frage. Trage einen Satz nur dann als Zitat ins Belegprotokoll ein, wenn du seinen Wortlaut hast. Sonst fasse ihn ohne Anführungszeichen zusammen. Die Uhrzeiten trägst du selbst ein.</p>
      <p>Bei einer Aufgabe hältst du sichtbare Handlungen fest. In E2 öffnete P07 Kurse, Konto und Hilfe und hörte dann auf. "P07 war verwirrt" wäre eine Deutung. Schreibe solche Urteile mit ihren Belegen in den Abschnitt Deutung. Frag nach der Erwartung, statt einen Klick vorzuschlagen.</p>
      <h2>Gespräch vor dem Schreiben der Ergebnisse prüfen</h2>
      <p>Lies Antworten und Belege zeitnah zusammen. Fehlendes bleibt offen. Die Deutung im Beispiel stützt sich auf E2 und E3. Sie zeigt noch nicht, dass ein Link Meine Buchungen das Problem löst. Auch die Buchungsregeln müssen geprüft werden.</p>
      <p>Gib jedem nächsten Schritt eine Person und ein Datum. Hake ihn erst nach Erledigung ab. Kopiere für das nächste Gespräch eine geleerte Vorlage in eine neue Notiz und ändere die Kennung. Der <a href="/blog/apple-notes-templates">Vorlagenleitfaden</a> zeigt weitere Formate. Bewahre das fertige Interview als Quelle auf.</p>
      <h2 id="grenzen">Was die Vorlage nicht leisten kann</h2>
      <p>Sie hält nur fest, was du einträgst. Fehlende Zitate, Einwilligung und die Tragfähigkeit einer Deutung prüft sie nicht. Eine Person liefert Belege zu ihrem Gespräch. Vergleiche weitere Interviews, bevor du von einem Muster sprichst, und bewahre die zugehörigen Kennungen auf.</p>
      <h2 id="ki">Ergebnisse in einer getrennten Pinto-Notiz entwerfen</h2>
      <p>In Pinto Notes kannst du diese Vorlage mit Überschriften, Checkliste und Tabelle führen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> und Allow darf die KI lesen und bearbeiten. Probiere den Auftrag mit dem fiktiven Beispiel. Bei echten Interviews müssen Einwilligung und eure Regeln die Weitergabe an eine KI erlauben.</p>
      <Keep title="Einen Ergebnisentwurf anfordern" text={PROMPT} copyLabel={ui.copy} note="Speichere zuerst das fiktive Beispiel in Pinto Notes. Für eigene Gespräche ersetze beide Titel und die Personenkennung." />
      <p>Prüfe jede Aussage anhand der genannten Zeilen. Die frühere E-Mail ist eine berichtete Erfahrung aus F1. Die Klickfolge ist eine Beobachtung aus E2. Die Platzierung beim Ticket ist eine in E3 zitierte Erwartung. Prüfe Zitate und entferne unbelegte Aussagen. Eine KI kann falsch zitieren oder zu viel ableiten.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
