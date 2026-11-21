import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "arbeitsuebergabe-vorlage-apple-notizen");

// German version of /blog/apple-notes-work-handover-template. Google autocomplete hl=de,
// gl=de, read 21 Nov 2026: "arbeitsübergabe vorlage" and "arbeitsübergabe protokoll vorlage".
// Apple support read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd1955d3b21/mac
// (Überschrift), apd0a136b9cc/mac (Format, Tabelle), apd93c815aa0/mac (Checkliste),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// Unlabeled format and table icons are described by function.
const ui = UI.de;

const TEMPLATE = `Arbeitsübergabe Workshop Elbe, 30. November bis 4. Dezember

Vertretung
Abwesend: Lena, 30. November bis 4. Dezember 2026. Zurück am 7. Dezember.
Vertretung: Jonas. Workshop: 10. Dezember.
Zuletzt aktualisiert: 27. November, 15:00 Uhr, Hamburg.
Lena ist während des Urlaubs nicht erreichbar. Dringende Entscheidungen an Emma geben.

Laufende Aufgaben
Aufgabe\tStand, zuständige Person und nächster Schritt
Anmeldeseite\tText freigegeben, Seite unveröffentlicht. Jonas: Emma am 30. November bis 10:00 Uhr um die letzte Prüfung bitten, dann bis 12:00 Uhr veröffentlichen.
Raumbuchung\t18 Plätze reserviert, Anzahlung nicht freigegeben. Jonas: Emma bis 1. Dezember, 15:00 Uhr um Freigabe bitten.
Mail an Teilnehmende\tEntwurf fertig. Nora: nach der Raumbestätigung bis 3. Dezember, 10:00 Uhr versenden. Ohne Bestätigung warten.

Wichtige Unterlagen
Projektplan: Workshopplan Elbe, aktualisiert am 27. November.
Raumangebot: R218 vom 26. November.
Mailentwurf: Workshop Elbe, Version 2.
Ersetze diese Namen durch die Links zu den Unterlagen deines Teams.

Zugriff organisieren
Jonas braucht die Rolle für die Bearbeitung der Anmeldeseite und Zugriff auf den Workshopordner.
Lena stellte am 27. November Anfrage IT-248. Die Freigabe steht noch aus.
Zugriffsprozess: https://example.com/it/temporary-access
Jonas: bei der IT nachfragen und beide Zugänge bis 27. November, 16:00 Uhr testen.
Nutze dein eigenes Konto. Keine Passwörter, Wiederherstellungscodes oder Zugriffstoken in dieser Notiz.

Kontakte
Emma, Budgetfreigabe und Eskalation: emma@example.com
Nora, Nachrichten an Teilnehmende: nora@example.com
Luis, Raumbuchung, Angebot R218: luis@example.com
IT-Service, Anfrage IT-248: it@example.com

Offene Risiken und Fragen
Raumreservierung läuft am 2. Dezember um 12:00 Uhr ab. Jonas: Falls die Freigabe am 1. Dezember um 15:00 Uhr fehlt, Emma noch am selben Tag kontaktieren. Ohne Freigabe nicht zahlen.
Sind 22 Teilnehmende möglich? Emma entscheidet bis 30. November, 15:00 Uhr. Bis dahin bleibt die Grenze bei 18.
Die Gestaltung der Folien kann bis zu Lenas Rückkehr warten. Keine Aufgabe für die Vertretung.

Prüfung vor dem Urlaub
Jonas: jeden Link mit dem eigenen Konto öffnen
Jonas: Bearbeitung der Anmeldeseite und Zugriff auf den Workshopordner testen
Jonas und Nora: nächste Schritte und Fristen gemeinsam bestätigen
Jonas: offene Fragen bis 27. November, 16:30 Uhr hier notieren

Nach der Rückkehr
Jonas: erledigte und offene Arbeit bis 7. Dezember, 09:00 Uhr mit Datum zusammenfassen.
Lena: Zusammenfassung mit Jonas besprechen, bevor sie die Arbeit wieder übernimmt.
`;

const PROMPT = `Lies meine Pinto-Notes-Projektnotizen "Workshopplan Elbe", "Raumbuchung R218" und "Workshop Elbe, Mailentwurf".
Erstelle eine separate Notiz "Übergabe Workshop Elbe, 30. November bis 4. Dezember" nach der Vorlage, die ich unten einfüge.
Lena ist vom 30. November bis 4. Dezember 2026 weg und ab 7. Dezember zurück. Jonas vertritt sie.
Nenne für jeden offenen Punkt Stand, zuständige Person, nächsten Schritt, Frist und Titel der Quellnotiz.
Trenne bestätigte Fakten von Fragen. Falls Zuständigkeit, Frist oder Freigabe fehlen, schreib "Muss bestätigt werden" und frag mich im Chat.
Nenne nötige Zugriffe und ihre Freigabe. Lass Passwörter, Wiederherstellungscodes und Zugriffstoken weg.
Unterstelle weder funktionierenden Zugriff noch eine angenommene Aufgabe. Lass die Prüfliste offen.
Ändere die Quellnotizen nicht. Ich prüfe den Entwurf und bestätige die Zuständigkeiten mit dem Team.`;

const FAQ = [
  { q: "Was gehört in eine Arbeitsübergabe?", a: ["Notiere Vertretungszeit, laufende Aufgaben mit Zuständigkeit und nächstem Schritt, Links zu Unterlagen, benötigte Zugriffe, Kontakte und Risiken. Eine Prüfliste hilft der Vertretung vor deiner Abwesenheit."] },
  { q: "Soll ich Passwörter in die Übergabenotiz schreiben?", a: ["Nein. Notiere System, benötigte Rolle, Freigabestelle und den Link zum vorgesehenen Zugriffsprozess. Die Vertretung nutzt ihr eigenes Konto. Passwörter, Wiederherstellungscodes und Zugriffstoken gehören nicht in die Notiz."] },
  { q: "Wann ist die Urlaubsübergabe fertig?", a: ["Die Vertretung sollte jeden Link öffnen, Zugriffe testen und nächste Schritte samt Fristen bestätigen. Halte offene Fragen vor dem Urlaub fest. Ein Name in der Notiz beweist noch keine Zusage."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="arbeitsuebergabe-vorlage-apple-notizen"
    intro={<>Diese Vorlage für eine Arbeitsübergabe in Apple Notizen hilft bei einer Woche Urlaub. Laufende Aufgaben stehen neben der Vertretung und dem nächsten Schritt. Darunter folgen Zugriffe, Kontakte und Risiken.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Übergabe kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#abstimmen", label: "Mit Vertretung prüfen" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Entwurf mit KI" }]}>
      <p>Nutze eine Notiz für die ganze Vertretungszeit. Jede offene Aufgabe braucht eine zuständige Person und einen datierten nächsten Schritt. Das Beispiel übergibt einen Workshop für eine Woche. Ersetze Angaben und Beispieladressen. Verlinke euren Zugriffsprozess und lass Passwörter weg.</p>
      <div id="vorlage"><Keep title="Arbeitsübergabe für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Kopiere die Vorlage in eine neue Notiz. Unten erfährst du, wie aus den laufenden Aufgaben eine Tabelle und aus der Prüfung eine Checkliste wird." /></div>
      <PostCta slug="de/arbeitsuebergabe-vorlage-apple-notizen" path="/de/blog/arbeitsuebergabe-vorlage-apple-notizen" position="answer" title="Übergabe aus Projektnotizen entwerfen?" ui={ui.cta}><p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude Projektnotizen lesen und daraus einen Entwurf erstellen, den du prüfst.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Übergabe in Apple Notizen einrichten</h2>
      <p>Nutze iCloud-Notizen oder Notizen auf deinem Gerät. Bei anderen E-Mail-Anbietern fehlen laut Apple manche Funktionen. Der Klartext lässt sich vor dem Formatieren lesen.</p>
      <MenuPaths rows={[{ on: "Mac", steps: ["Taste zum Formatieren", "Überschrift"] }, { on: "Mac", steps: ["Format", "Tabelle"] }, { on: "iPhone", steps: ["Formatierung", "Überschrift"] }]} />
      <p>Füge den Text auf dem Mac in eine neue Notiz ein. Markiere eine Abschnittszeile und wähle über die Taste zum Formatieren Überschrift. Markiere die vier Zeilen von Aufgabe bis Mail an Teilnehmende und wandle sie mit der Taste für Tabellen um. Tabulatoren trennen die Spalten. Alternativ wähle Format, Tabelle und fülle die leere Tabelle. Die Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Mehr im <a href="/blog/apple-notes-tables">Tabellenleitfaden</a>.</p>
      <p>Markiere die vier Zeilen unter Prüfung vor dem Urlaub und wandle sie in eine Checkliste um. Die Vertretung hakt jeden Punkt nach der Prüfung ab.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge den Text ein. Formatiere die Abschnittszeilen als Überschriften. Füge für laufende Aufgaben eine Tabelle mit zwei Spalten ein und übertrage die Einträge. Lösche die alten Zeilen. Erstelle die Prüfliste über die Checklistentaste. Der Zeilenschalter fügt den nächsten Punkt hinzu. Die Schritte stehen im <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">iPhone-Handbuch</a>.</p>
      <h2>Jede offene Aufgabe braucht einen nächsten Schritt</h2>
      <p>Schreib auf, was die Vertretung tun soll. Im Beispiel ist der Raum reserviert, doch Jonas braucht vor Ablauf der Reservierung eine Entscheidung zur Anzahlung. Die Frist für die Freigabe steht bei der Aufgabe, das Ende der Reservierung unter Risiken. Beide Termine zählen.</p>
      <p>Trenne Aufgaben, die warten können. Lenas Foliengestaltung braucht keine Vertretung. Ersetze die Unterlagennamen durch funktionierende Links und example.com durch euren Zugriffsprozess. Ein <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Besprechungsprotokoll mit Aufgaben</a> kann Entscheidungen als Quelle festhalten.</p>
      <h2 id="abstimmen">Notiz mit der Vertretung prüfen</h2>
      <p>Geht jeden nächsten Schritt vor dem Urlaub gemeinsam durch. Jonas sollte die Anmeldeseite mit seinem eigenen Konto öffnen, statt Lenas Zugriff zu prüfen. Eine ausstehende Anfrage braucht weiterhin eine Freigabe. Auch Nora muss die Frist für die Mail bestätigen.</p>
      <p>Lass unbeantwortete Fragen sichtbar. Bis Emma über 22 Plätze entschieden hat, gilt die Grenze von 18. Notiere ihre Antwort mit Datum. Nach der Vertretung trägt Jonas erledigte und offene Arbeit ein, bevor Lena übernimmt.</p>
      <h2 id="grenzen">Was die Übergabenotiz nicht erledigt</h2>
      <p>Die Notiz hält Zuständigkeiten fest. Sie erteilt keinen Zugriff, bestätigt keine Zusage und erinnert nicht an das Ende der Raumreservierung. Nutzt dafür eure üblichen Werkzeuge und aktualisiert die Notiz danach. Falls ein formelles Übergabeprotokoll vorgeschrieben ist, verwendet auch dieses.</p>
      <h2 id="ki">Übergabe aus Projektnotizen entwerfen</h2>
      <p>In Pinto Notes kannst du die Vorlage mit Überschriften, Tabelle und Checkliste nutzen. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> und Allow darf die KI Notizen lesen und bearbeiten. Lass sie benannte Projektnotizen lesen und einen separaten Entwurf erstellen. Verwende nur Arbeitsdaten, die du mit der KI teilen darfst.</p>
      <Keep title="Entwurf von der KI erstellen lassen" text={PROMPT} copyLabel={ui.copy} note="Ersetze Titel, Namen und Daten und füge die Vorlage nach dem Auftrag ein. Verbinde Pinto Notes vorher." />
      <p>Prüfe Zuständigkeiten, Fristen und Freigaben anhand der Quellen und lass das Team seine Aufgaben bestätigen. Im Beispiel bleiben die Anzahlung ohne Freigabe, der Zugriff ausstehend und die Teilnehmergrenze bei 18. Hake erst ab, was die Vertretung wirklich geprüft hat.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
