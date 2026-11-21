import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "onboarding-mitarbeiter-vorlage-apple-notizen");

// German version of /blog/apple-notes-employee-onboarding-template. Google autocomplete hl=de,
// gl=de, read 21 Nov 2026: "onboarding mitarbeiter vorlage", "onboarding neuer mitarbeiter
// vorlage" and "checkliste onboarding neuer mitarbeiter vorlage". Apple support read
// 21 Nov 2026: support.apple.com/de-de/guide/notes/apd1955d3b21/mac (Überschrift),
// apd0a136b9cc/mac (Format, Tabelle), apd93c815aa0/mac (Checkliste),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// Unlabeled icons are described by function.
const ui = UI.de;

const TEMPLATE = `Mein erster Monat bei Elbwerkzeuge

Name: Maya Becker, Kundenservice
Start: 23. November 2026. Gespräch nach dem ersten Monat: 18. Dezember.
Vorgesetzte: Amina Yilmaz. Ansprechperson im Team: Leo Martin.

Woran ich den Fortschritt erkenne
Bis zum Gespräch gewöhnliche Fragen zu Lieferungen beantworten, Leo prüft meine Antworten.
Erklären können, wann eine Erstattung eskaliert werden muss. Erwartungen mit Amina bestätigen.

Personen
Person\tWobei sie hilft
Amina Yilmaz, Vorgesetzte\tPrioritäten und Rückmeldung. Wöchentliches Gespräch am Freitag.
Leo Martin, Ansprechperson\tAntwortentwürfe und Lieferfragen. Am Dienstag zusammenarbeiten.
Nora Weber, IT\tZugriffsanfragen über das IT-Portal.

Systeme und Nachschlageseiten
Teamhandbuch: Intranet, Kundenservice / Einstieg.
Lieferleitfaden: Intranet, Kundenservice / Lieferfragen.
Ticketsystem: IT-Anfrage 4821 am 23. November gestellt. Zugriff ausstehend.
Teamkalender: erfolgreich geöffnet, geprüft am 23. November.

Fragen und Antworten
Offen, an Amina: Welche Erstattungen brauchen die Freigabe einer Führungskraft? Am 27. November fragen.
Beantwortet am 23. November von Leo: Wo finde ich Beispielantworten? Kundenservice / Antwortbeispiele.

Woche 1, 23. bis 27. November
Erwartungen für den ersten Monat mit Amina bestätigen
Zugriff auf das Ticketsystem testen, sobald Anfrage 4821 erledigt ist
Lieferleitfaden lesen und Leo bei zwei Fragen begleiten

Woche 2, 30. November bis 4. Dezember
Drei Antworten zu Lieferungen entwerfen und von Leo prüfen lassen
Amina nach den Regeln für die Eskalation von Erstattungen fragen

Woche 3, 7. bis 11. Dezember
Fünf gewöhnliche Lieferfragen beantworten, Leo prüft die Antworten
Einen unklaren Schritt im Lieferleitfaden notieren

Woche 4, 14. bis 18. Dezember
Zwei geprüfte Antworten für das Monatsgespräch auswählen
Fortschritt mit Amina besprechen und das nächste Lernziel vereinbaren

Lernprotokoll
23. November: Antwortbeispiele mit Leo gefunden. Zugriff auf das Ticketsystem noch ausstehend.

Gespräch nach dem ersten Monat
18. Dezember: geprüfte Antworten und offene Fragen mitbringen.
Danach: Rückmeldung und nächstes Lernziel hier festhalten.
`;

const PROMPT = `Lies meine Pinto-Notes-Notiz "Mein erster Monat bei Elbwerkzeuge".
Ergänze unter Fragen und Antworten diese bestätigte Antwort:
27. November 2026, Amina: Alle Anfragen zu Erstattungen gehen zur Freigabe an die Schichtleitung.
Ersetze die offene Frage zur Freigabe von Erstattungen durch diese datierte Antwort.
Lass andere Fragen, den Zugriffsstatus und die Wochenchecklisten unverändert.
Liste danach im Chat alle offenen Fragen mit der vorgesehenen Ansprechperson auf.
Nutze nur die Notiz und die obige Antwort. Erfinde keine Firmenregeln und hake keine Schulung ab.
Frag mich vor der Änderung, wenn du Notiz oder Frage nicht eindeutig findest.`;

const FAQ = [
  { q: "Was gehört in eine Onboarding-Notiz für neue Mitarbeitende?", a: ["Halte Erwartungen an deine Rolle, Ansprechpersonen, Zugriffsstatus, Nachschlageseiten und offene Fragen fest. Ergänze für die ersten vier Wochen Checklisten und datierte Antworten."] },
  { q: "Wie halte ich ausstehende Zugriffe fest?", a: ["Notiere System, Anfragenummer, Datum und zuständiges Team. Lass den Status offen, bis du den Zugriff getestet hast. Passwörter gehören in den freigegebenen Passwortmanager deines Arbeitgebers."] },
  { q: "Ersetzt diese Checkliste den Onboarding-Prozess der Firma?", a: ["Nein. Sie ist deine persönliche Übersicht für den ersten Monat. Dokumente, Pflichtschulungen und Zugriffe erledigst du über die vorgesehenen Systeme. Ein Haken in der Notiz reicht dort nicht."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="onboarding-mitarbeiter-vorlage-apple-notizen"
    intro={<>Diese Onboarding-Vorlage für neue Mitarbeitende in Apple Notizen hält Ansprechpersonen und offene Fragen neben den Aufgaben der ersten vier Wochen fest.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#monat", label: "Wöchentlich nutzen" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Antworten ergänzen" }]}>
      <p>Führe eine Notiz für deinen ersten Monat mit Erwartungen, Personen, Systemen und Fragen. Das Beispiel begleitet eine neue Person im Kundenservice. Es enthält eine kleine Personentabelle und eine Liste für jede Woche.</p>
      <div id="vorlage"><Keep title="Onboarding-Vorlage für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Fiktives Beispiel. Ersetze Namen und Daten. Unten erfährst du, wie Personen zur Tabelle und Wochenaufgaben zu Checklisten werden." /></div>
      <PostCta slug="de/onboarding-mitarbeiter-vorlage-apple-notizen" path="/de/blog/onboarding-mitarbeiter-vorlage-apple-notizen" position="answer" title="Bestätigte Antworten mit KI ergänzen?" ui={ui.cta}><p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude deine Onboarding-Notiz lesen und mit den Antworten bearbeiten, die du ihnen gibst.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Vorlage in Apple Notizen einrichten</h2>
      <p>Nutze iCloud-Notizen oder Notizen auf deinem Gerät. Bei anderen E-Mail-Anbietern fehlen laut Apple viele Funktionen. Füge zuerst den Klartext ein. Ersetze die Systemnamen später durch echte Links deines Teams.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Taste zum Formatieren", "Überschrift"] }, { on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Formatierung", "Überschrift"] }]} />
      <p>Markiere auf dem Mac die Abschnittszeilen und wähle über die Taste zum Formatieren Überschrift. Markiere nur die Aufgaben unter Woche 1 und wandle sie mit der Checklistentaste um. Wiederhole das für die übrigen Wochen. Hake Aufgaben nach Erledigung ab.</p>
      <p>Für die Personentabelle markiere die vier Zeilen von Person bis Nora Weber und wandle sie mit der Taste für Tabellen um. Die Tabulatoren trennen die beiden Spalten. Alternativ wähle Format, Tabelle und trage Personen und Aufgaben selbst ein. Die Tabulatortaste in der letzten Zelle ergänzt eine Zeile. Mehr im <a href="/blog/apple-notes-tables">Tabellenleitfaden</a>.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge den Text ein. Formatiere die Abschnittszeilen als Überschriften. Ersetze die Aufgaben jeder Woche durch eine Checkliste. Der Zeilenschalter fügt den nächsten Punkt hinzu. Füge für Personen eine Tabelle mit zwei Spalten ein und lösche danach die alten Zeilen.</p>
      <h2 id="monat">Die Notiz im ersten Monat aktuell halten</h2>
      <p>Ersetze die Ziele durch Erwartungen, die du mit deiner Führungskraft vereinbart hast. Maya soll Antworten schreiben, die Leo prüft. Markiere Erwartungen als unbestätigt, solange ihr sie nicht besprochen habt.</p>
      <p>Ergänze abends bestätigte Antworten bei den passenden Fragen. Notiere Datum und Person. Offene Fragen brauchen eine Ansprechperson und einen Tag zum Nachfragen. Auch wenn eine IT-Anfrage als erledigt gilt, teste das System vor der Statusänderung in deiner Notiz.</p>
      <p>Prüfe freitags die Liste und verschiebe offene Aufgaben auf ein realistisches Datum. Halte im Lernprotokoll kurz fest, was du jetzt kannst. Lass erledigte Punkte abgehakt. Für längere Gespräche mit der Führungskraft gibt es die <a href="/de/blog/one-on-one-vorlage-apple-notizen">Vorlage für 1:1-Gespräche</a>.</p>
      <p>Wähle vor dem Monatsgespräch Beispiele zu den vereinbarten Erwartungen. Maya bringt zwei geprüfte Antworten und offene Fragen mit. Ergänze danach Rückmeldung und nächstes Lernziel.</p>
      <h2 id="grenzen">Was die Onboarding-Notiz nicht erledigt</h2>
      <p>Sie hält deine Angaben fest. Sie erteilt keine Zugriffe und reicht keine Schulungsnachweise ein. Erledige offizielle Aufgaben im Verfahren deines Arbeitgebers. Speichere Arbeitsnotizen nur an erlaubten Orten und Passwörter sowie Personalunterlagen in den dafür vorgesehenen Systemen.</p>
      <p>Die Wochendaten senden keine Erinnerungen. Du musst nachfragen und Antworten bestätigen. Die Anfragenummer neben einem offenen Zugriff hilft beim Nachfassen.</p>
      <h2 id="ki">Bestätigte Antwort mit ChatGPT oder Claude ergänzen</h2>
      <p>Du kannst denselben Aufbau mit Überschriften, Checklisten und Tabellen in Pinto Notes verwenden. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> und Allow darf die KI Notizen lesen und bearbeiten. Gib ihr eine bestätigte Antwort und lass sie bei der richtigen Frage eintragen.</p>
      <Keep title="Onboarding-Notiz aktualisieren lassen" text={PROMPT} copyLabel={ui.copy} note="Die Antwort ist nur ein Beispiel. Ersetze sie vor der Nutzung durch deine bestätigte Information." />
      <p>Prüfe Datum, Person und Wortlaut in der geänderten Notiz. Im Beispiel gehen Erstattungen an die Schichtleitung. Der Zugang zum Ticketsystem bleibt ausstehend und keine Wochenaufgabe wird abgehakt. Vergleiche auch die Liste offener Fragen. Pinto bewahrt frühere Versionen auf.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
