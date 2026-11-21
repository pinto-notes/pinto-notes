import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "podcast-planung-vorlage-apple-notizen");

// German version of /blog/apple-notes-podcast-planner-template. Google autocomplete hl=de,
// gl=de, read 21 Nov 2026: "podcast vorlage", "vorlage podcast konzept" and
// "podcast planung"; "podcast folgenplanung" returned no suggestions.
// Apple support read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd1955d3b21/mac
// (Überschrift), apd93c815aa0/mac (Checkliste), apd0a136b9cc/mac (Format, Tabelle),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// Unlabeled icons are described by function. All episode details are fictional.
const ui = UI.de;

const TEMPLATE = `An der Werkbank 12: Zum ersten Mal im Repair-Café

Stand: Vorbereitung
Nächster Schritt: Bea schickt Mina die Fragen und klärt die Erlaubnis zur Aufnahme und Veröffentlichung.
Aufnahme: 24. November 2026, 10:00 Uhr, Berlin
Ziellänge: 18 Minuten

Was die Folge den Hörenden bringt
Wer zum ersten Mal ins Repair-Café geht, erfährt, was mitzubringen ist und was dort passiert.

Gast und Hintergrund
Mina Kaya, ehrenamtliche Koordinatorin im fiktiven Repair-Café am Kottbusser Tor.
Aussprache des Namens: vor der Aufnahme klären.
Erlaubnis zur Aufnahme und Veröffentlichung: noch ausstehend.
Vorabinfo von Mina, 20. November: Gäste buchen einen Termin und bringen einen Gegenstand mit.
Öffentlicher Buchungslink: bei Mina erfragen und vor Veröffentlichung prüfen.

Einstieg
Du hast eine zerrissene Jacke und einen Termin im Repair-Café. Was passiert, wenn du ankommst?

Ablauf, ungefähre Minuten
1 Minute: Einstieg und Vorstellung des Gasts.
4 Minuten: Termin buchen und Gegenstand auswählen.
6 Minuten: Eine zerrissene Jacke durch den Besuch begleiten, mit einer Geschichte von Mina.
5 Minuten: Was passiert, wenn die Ehrenamtlichen eine Reparatur nicht abschließen können?
2 Minuten: Rückblick und ein Schritt vor dem ersten Besuch.

Fragen an den Gast
Was sollten Gäste bei der Buchung angeben?
Was passiert zwischen der Ankunft mit einer zerrissenen Jacke und dem Platz bei einer helfenden Person?
Kannst du einen Besuch beschreiben, bei dem ein Gegenstand nicht am selben Tag repariert wurde?
Was sollten Menschen vor dem Besuch bei ihrem Repair-Café vor Ort prüfen?

Vor der Aufnahme
Minas Namen, Rolle und Erlaubnis zur Aufnahme und Veröffentlichung bestätigen.
Ablauf schicken und nach Themen fragen, die Mina auslassen möchte.
Kurzen Tontest in der Aufnahme-App machen und anhören.

Entwurf der Shownotes, nach dem Schnitt überarbeiten
Arbeitstitel: Zum ersten Mal im Repair-Café, mit Mina Kaya.
Beschreibung: Ein Gespräch über die Terminbuchung und einen Gegenstand zur Reparatur.
Gastnennung: Mina Kaya, ehrenamtliche Koordinatorin, Repair-Café am Kottbusser Tor.
Links ergänzen: geprüfte Buchungsseite und Hinweise für Gäste.
Kapitelzeiten: gegebenenfalls aus der fertig geschnittenen Aufnahme ergänzen.

Checkliste zur Veröffentlichung
Die fertig geschnittene Aufnahme vollständig anhören.
Gastnennung, Erlaubnis und alle Zitate prüfen.
Beschreibung überarbeiten und jeden öffentlichen Link prüfen.
Fertige Tondatei und Shownotes beim Podcast-Host hochladen.
Veröffentlichte Folge prüfen und ihren Link hier eintragen.
`;

const PIPELINE = `An der Werkbank, Folgenübersicht

Folge\tStand und nächster Schritt
11: Einen Rucksack flicken\tSchnitt. Alex entfernt den doppelten Einstieg.
12: Zum ersten Mal im Repair-Café\tVorbereitung. Bea schickt Mina die Fragen und klärt die Erlaubnis.
13: Geliehene Werkzeuge pflegen\tIdee. Robin sucht einen Gast aus einer Leihwerkstatt.
`;

const PROMPT = `Lies meine Pinto-Notes-Folgennotiz "An der Werkbank 12: Zum ersten Mal im Repair-Café".
Schlage nur anhand des Abschnitts Gast und Hintergrund zwei Nachfragen für Erstbesucher vor.
Zeig sie zuerst im Chat. Frag nach fehlenden Angaben und erfinde keine Geschichten oder Buchungsregeln.
Ergänze die Fragen erst nach meiner Freigabe unter Fragen an den Gast.
Lass die Minuten im Ablauf und den Erlaubnisstatus unverändert. Hake nichts in der Veröffentlichungsliste ab.`;

const FAQ = [
  { q: "Was gehört in eine Podcast-Planung in Apple Notizen?", a: ["Oben stehen Stand und nächster Schritt, darunter Ziel für die Hörenden, Gast, Ablauf mit Zeiten, Fragen, Aufnahmeprüfung, Shownotes und Veröffentlichungsliste. Eine getrennte kurze Tabelle kann andere Folgen verfolgen."] },
  { q: "Muss ich für den Ablauf jedes Wort aufschreiben?", a: ["Für dieses Interview genügen Einstieg, Fragen und eine Zeitvorgabe pro Abschnitt. Lass Platz für Nachfragen. Eine geskriptete Folge braucht womöglich ein eigenes vollständiges Skript."] },
  { q: "Kann ich die geplanten Zeiten als Kapitelzeiten nehmen?", a: ["Nutze die fertig geschnittene Aufnahme für Kapitelzeiten. Die Minuten im Ablauf sind nur Schätzungen. Antworten, Pausen und Schnitte verändern die Anfangspunkte."] },
  { q: "Lädt ein Haken in der Liste die Folge hoch?", a: ["Nein. Du erledigst die Punkte selbst. Lade Tondatei und Shownotes beim Podcast-Host hoch und prüfe die öffentliche Folge, bevor du den letzten Punkt abhakst."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="podcast-planung-vorlage-apple-notizen"
    intro={<>Kopiere diese Vorlage für die Podcast-Planung in Apple Notizen, eine Notiz pro Folge. Fragen und Ablauf stehen neben Shownotes und der Checkliste zur Veröffentlichung.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Folgenplan kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#folgen", label: "Folgen verfolgen" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Fragen vorbereiten" }]}>
      <p>Führe eine Notiz pro Folge. Stand und nächster Schritt stehen oben. Das ausgefüllte Beispiel plant ein 18-minütiges Interview. Ersetze Sendung und Gast durch deine Angaben.</p>
      <div id="vorlage"><Keep title="Podcast-Folgenplan für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Füge die Vorlage in eine neue Notiz ein. Formatiere Abschnittszeilen als Überschriften und die Aufnahme- und Veröffentlichungsaufgaben als Checklisten." /></div>
      <PostCta slug="de/podcast-planung-vorlage-apple-notizen" path="/de/blog/podcast-planung-vorlage-apple-notizen" position="answer" title="Fragen für den Gast vorbereiten?" ui={ui.cta}><p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude deinen Folgenplan lesen und aus deinen Hintergrundangaben Fragen vorschlagen.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Folgennotiz auf Mac oder iPhone einrichten</h2>
      <p>Nutze eine iCloud-Notiz oder eine Notiz auf deinem Gerät. Bei anderen E-Mail-Anbietern fehlen laut Apple manche Funktionen. Die Vorlage ist Klartext und lässt sich vor dem Formatieren lesen.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Taste zum Formatieren", "Überschrift"] }, { on: "iPhone", steps: ["Formatierung", "Überschrift"] }]} />
      <p>Füge den Text auf dem Mac in eine neue Notiz ein. Markiere eine Abschnittszeile wie Fragen an den Gast und wähle über die Taste zum Formatieren Überschrift. Markiere die drei Zeilen unter Vor der Aufnahme und wandle sie mit der Checklistentaste um. Wiederhole es mit den fünf Zeilen zur Veröffentlichung. Hake Aufgaben nach Erledigung ab.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge den Text ein. Formatiere die Abschnittszeilen als Überschriften. Setze für jede Checkliste den Cursor unter die Überschrift und tippe auf die Checklistentaste. Der Zeilenschalter fügt den nächsten Punkt hinzu. Lösche danach die alten Klartextzeilen.</p>
      <h2 id="folgen">Eine kleine Folgenübersicht führen</h2>
      <p>Führe eine zweite Notiz für laufende Folgen. Jede braucht einen Stand, einen nächsten Schritt und eine zuständige Person. Ändere den Text, wenn eine Folge von Idee über Vorbereitung, Aufnahme und Schnitt zur Veröffentlichung kommt.</p>
      <Keep title="Folgenübersicht für Apple Notizen" text={PIPELINE} copyLabel={ui.copy} note="Ein Tabulator trennt Folge und Stand. Der ausführliche Ablauf bleibt in der Notiz der jeweiligen Folge." />
      <p>Markiere auf dem Mac die vier Zeilen von Folge bis Folge 13 und wandle sie mit der Taste für Tabellen um. Alternativ wähle Format, Tabelle und gib die Zeilen selbst ein. Die Tabulatortaste in der letzten Zelle ergänzt eine Zeile. Mehr im <a href="/blog/apple-notes-tables">Tabellenleitfaden</a>.</p>
      <p>Füge auf dem iPhone eine Tabelle hinzu und trage Folge und Stand in getrennte Spalten ein. Entferne danach die Klartextzeilen. Bewahre einen leeren Folgenplan für das nächste Interview auf. Der <a href="/blog/apple-notes-templates">Vorlagenleitfaden</a> erklärt das Wiederverwenden.</p>
      <h2>Ablauf während der Aufnahme nutzen, Shownotes danach ändern</h2>
      <p>Bestätige vor der Aufnahme Namen und Erlaubnis des Gasts. Prüfe jede Frage gegen das Ziel der Folge. Eine Geschichte über die zerrissene Jacke zeigt den Besuch anschaulich. Eine lange Geschichte über die Gründung des Cafés braucht womöglich eine eigene Folge.</p>
      <p>Die Abschnitte ergeben zusammen 18 Minuten. Nutze die Zahlen als Orientierung und lass Raum für Nachfragen. Notiere danach Schnitte für die Bearbeitung. Überarbeite die Shownotes anhand der fertigen Tondatei, entferne gestrichene Themen und ergänze tatsächlich genannte Links. Erst daraus ergeben sich Kapitelzeiten.</p>
      <h2 id="grenzen">Was der Folgenplan nicht erledigt</h2>
      <p>Du aktualisierst die Übersicht selbst. Ein Stand zeigt Fortschritt, prüft aber keine Tondatei. Die Veröffentlichungsliste dokumentiert Aufgaben in deinen Audio-Werkzeugen und beim Podcast-Host. Durch das Einfügen der Vorlage werden diese Werkzeuge nicht verbunden.</p>
      <p>Bewahre Aufnahme und Schnitt in deinem üblichen Arbeitsablauf auf. Notiere Dateinamen oder Speicherorte, damit die Bearbeitung die richtige Version findet. Trage nach der Veröffentlichung den öffentlichen Link ein und ändere den Stand der Folge.</p>
      <h2 id="ki">Gastfragen mit ChatGPT oder Claude vorbereiten</h2>
      <p>Du kannst diese Vorlage mit Überschriften, Checklisten und Tabellen in Pinto Notes nutzen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> und Allow darf die KI Notizen lesen und bearbeiten. Lass sie anhand der Gastinformationen Nachfragen vorschlagen, bevor sie etwas einträgt.</p>
      <Keep title="Nachfragen vorbereiten lassen" text={PROMPT} copyLabel={ui.copy} note="Speichere zuerst den ausgefüllten Folgenplan. Ersetze die Hintergrundangaben durch geprüfte Informationen." />
      <p>Vergleiche jede Frage mit den Angaben des Gasts. Terminbuchung und ein mitgebrachter Gegenstand sind im fiktiven Beispiel genannt. Eine Buchungsgebühr oder eine Garantie für jede Reparatur wäre erfunden. Prüfe nach der Änderung, ob die Erlaubnis weiter aussteht und die Veröffentlichungsliste offen bleibt.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
