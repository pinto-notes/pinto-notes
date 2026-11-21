import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "unterrichtsplanung-vorlage-apple-notizen");

// German version of /blog/apple-notes-lesson-plan-template. Google autocomplete hl=de,
// gl=de, read 21 Nov 2026: "unterrichtsplanung vorlage", "unterrichtsplanung vorlage lehrer"
// and "unterrichtsplanung vorlage grundschule". The example fits maths tutoring in Germany.
// Apple support read 21 Nov 2026: support.apple.com/de-de/guide/notes/apd1955d3b21/mac
// (Überschrift), apd93c815aa0/mac (Checkliste), apd0a136b9cc/mac (Format, Tabelle),
// guide/iphone/iph1ac0b3a2/ios and /de-de/102296 (Verfassen-Taste, Checklistentaste).
// Unlabeled icons are described by function.
const ui = UI.de;

const TEMPLATE = `Brüche vergleichen, 20. November 2026
40 Minuten Mathe-Nachhilfe für ein Kind in Klasse 4.

Lernziel
Zwei Brüche mit verschiedenen Nennern vergleichen und die Antwort mit gleich großen Ganzen erklären.

Vorwissen prüfen
Frage: Was ist größer, 1/4 oder 3/4? Beide als gleich große Rechtecke zeichnen.
Falls Viertel noch unklar sind, zuerst gleich große Teile üben.

Material
Bruchstreifen aus gleich großen Papierbögen
Bleistift und kariertes Papier
Vier Vergleichsaufgaben, deren Lösungen vor der Stunde geprüft wurden

Ablauf
Minuten\tAktivität
0 bis 5\tVorwissen zu Vierteln prüfen und erklären lassen.
5 bis 12\t1/2 und 2/3 mit Bruchstreifen vergleichen. Die Ganzen gleich groß halten.
12 bis 20\tDenselben Vergleich mit Sechsteln auf Papier zeigen, dann eine Aufgabe gemeinsam lösen.
20 bis 30\tDas Kind vergleicht 1/3 mit 1/2, 2/5 mit 3/5, 3/5 mit 2/3 und 3/4 mit 5/6. Eine Zeichnung oder gleichnamige Brüche verlangen.
30 bis 36\tEine Antwort besprechen. Bei Schwierigkeiten zu Streifen zurückkehren und weniger Aufgaben bearbeiten.
36 bis 40\tAbschlussfrage ohne Hilfe stellen und die Erklärung notieren.

Beispielrechnung
Was ist größer, 1/2 oder 2/3?
1/2 = 3/6 und 2/3 = 4/6. Also ist 2/3 größer.
Die Sechstel müssen sich auf gleich große Ganze beziehen.
Lösungen der vier Aufgaben, jeweils der größere Bruch: 1/2, 3/5, 2/3, 5/6.

Verständnis prüfen
Abschlussfrage: Was ist größer, 2/3 oder 3/4? Erkläre es ohne Bruchstreifen.
Lösung für die Lehrkraft: 2/3 = 8/12 und 3/4 = 9/12. Also ist 3/4 größer.
Auf eine Erklärung mit gleich großen Teilen achten, nicht nur auf den größeren Nenner.

Nach der Stunde
20. November: Hälften und Drittel mit Streifen ohne Hilfe verglichen.
Auf Papier 3/4 als Lösung gewählt, aber noch nicht erklärt, warum.
Nächste Stunde: beide Brüche zuerst als Zwölftel gleich großer Rechtecke zeichnen.
`;

const PROMPT = `Lies meine Pinto-Notes-Unterrichtsplanung "Brüche vergleichen, 20. November 2026".
Erstelle aus den Beobachtungen unter Nach der Stunde einen getrennten Entwurf für 40 Minuten am 27. November.
Lass die ursprüngliche Planung und Beobachtungen unverändert.
Beginne damit, 2/3 und 3/4 als Zwölftel gleich großer Rechtecke zu zeichnen.
Nenne Lernziel, Material, Ablauf mit Minuten, Beispielrechnung und Abschlussfrage samt Lösung für die Lehrkraft.
Die Aktivitäten müssen zusammen 40 Minuten dauern. Erfinde keine Lernergebnisse und behaupte keine Lehrplanübereinstimmung.
Zeig mir den Entwurf zuerst im Chat. Frag bei fehlenden Angaben nach, bevor du eine neue Notiz speicherst.`;

const FAQ = [
  { q: "Was gehört in eine Unterrichtsplanung in Apple Notizen?", a: ["Lernziel, Vorwissensfrage, Material, zeitlicher Ablauf, Beispiel und Abschlussfrage stehen in einer Notiz. Notiere danach Beobachtungen, damit die nächste Stunde daran anknüpft."] },
  { q: "Kann ich Material in Apple Notizen abhaken?", a: ["Ja. Markiere die Materialzeilen auf dem Mac und nutze die Checklistentaste. Auf dem iPhone beginnst du an der gewünschten Stelle eine Checkliste und fügst mit dem Zeilenschalter weitere Punkte hinzu. Hake vorbereitetes Material ab."] },
  { q: "Wie nutze ich die Planung für eine andere Stunde?", a: ["Kopiere den Aufbau in eine neue Notiz. Ändere Datum, Ziel und Beispiele und entferne frühere Beobachtungen aus der Kopie. Bewahre die ursprüngliche Notiz als Protokoll der Stunde auf."] },
  { q: "Starten die Zeitangaben einen Timer?", a: ["Nein. Die Minuten sind Text in der Tabelle. Nutze eine Uhr oder einen separaten Timer und passe die Aktivitäten an, falls das Vorwissen mehr Übung erfordert."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="unterrichtsplanung-vorlage-apple-notizen"
    intro={<>Diese Vorlage für die Unterrichtsplanung in Apple Notizen hält ein Lernziel, Material, einen Ablauf mit Zeiten und eine Abschlussfrage fest. Nach der Stunde bleibt Platz für Beobachtungen.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#vorlage", label: "Vorlage kopieren" }, { href: "#einrichten", label: "Einrichten" }, { href: "#stunde", label: "In der Stunde nutzen" }, { href: "#grenzen", label: "Grenzen" }, { href: "#ki", label: "Nächste Stunde entwerfen" }]}>
      <p>Nutze eine Notiz pro Stunde. Das Beispiel plant 40 Minuten Nachhilfe zu Brüchen für Klasse 4 und hält danach fest, was noch geübt werden muss. Ersetze Thema und Aufgaben durch deine eigenen.</p>
      <div id="vorlage"><Keep title="Unterrichtsplanung für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy} note="Kopiere die Vorlage in eine neue Notiz. Unten wird aus Material eine Checkliste und aus dem Ablauf eine Tabelle mit zwei Spalten." /></div>
      <PostCta slug="de/unterrichtsplanung-vorlage-apple-notizen" path="/de/blog/unterrichtsplanung-vorlage-apple-notizen" position="answer" title="Die nächste Stunde aus Beobachtungen planen?" ui={ui.cta}><p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Nach dem Verbinden können ChatGPT oder Claude deine Unterrichtsnotiz lesen und einen Entwurf für die nächste Stunde vorschlagen.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="einrichten">Vorlage in Apple Notizen einrichten</h2>
      <p>Nutze eine iCloud-Notiz oder eine Notiz auf deinem Gerät. Bei anderen E-Mail-Anbietern fehlen laut Apple viele Funktionen. Die Vorlage ist zunächst Klartext.</p>
      <MenuPaths rows={[{ on: "Mac, Überschriften", steps: ["Text markieren", "Taste zum Formatieren", "Überschrift"] }, { on: "Mac, Tabelle", steps: ["Format", "Tabelle"] }, { on: "iPhone, Überschriften", steps: ["Text markieren", "Formatierung", "Überschrift"] }]} />
      <p>Füge den Text auf dem Mac in eine neue Notiz ein. Markiere Abschnittszeilen wie Lernziel und wähle über die Taste zum Formatieren Überschrift. Markiere die drei Materialzeilen und wandle sie über die Checklistentaste um. Hake vorbereitetes Material ab.</p>
      <p>Markiere für den Ablauf die sieben Zeilen von Minuten bis zum letzten Eintrag und wandle sie mit der Taste für Tabellen um. Tabulatoren trennen Minuten und Aktivität. Alternativ wähle Format, Tabelle und trage den Ablauf selbst ein. Die Tabulatortaste in der letzten Zelle fügt eine Zeile hinzu. Der <a href="/blog/apple-notes-tables">Tabellenleitfaden</a> erklärt weitere Schritte.</p>
      <p>Erstelle auf dem iPhone eine Notiz und füge den Text ein. Formatiere Abschnittszeilen als Überschriften. Erstelle das Material über die Checklistentaste neu und lösche die alten Zeilen. Füge für den Ablauf eine Tabelle hinzu, übertrage Minuten und Aktivitäten in getrennte Spalten und entferne danach die Klartextzeilen.</p>
      <p>Apple beschreibt <a href="https://support.apple.com/de-de/guide/notes/apd93c815aa0/mac">Listen auf dem Mac</a> und die <a href="https://support.apple.com/de-de/guide/iphone/iph1ac0b3a2/ios">Formatierung auf dem iPhone</a>. Andere wiederverwendbare Aufbauten stehen im <a href="/blog/apple-notes-templates">Vorlagenleitfaden</a>.</p>
      <h2 id="stunde">Plan während der Stunde verwenden</h2>
      <p>Das Lernziel sollte sich zeigen lassen. Im Beispiel muss das Kind den größeren Bruch nennen und den Vergleich erklären. Prüfe die Beispielrechnung und alle Aufgabenlösungen vor der Stunde.</p>
      <p>Nutze die ersten fünf Minuten für eine Entscheidung. Wenn das Kind Viertel nicht als gleiche Teile zeichnen kann, übe zuerst das und kürze die Vergleichsaufgaben. Die Zeitangaben helfen bei der Planung, lassen sich aber in der Stunde ändern.</p>
      <p>Die Lösung für die Lehrkraft steht unter der Abschlussfrage. Stelle die Frage ohne Hilfe und halte die Lösung beim Teilen des Bildschirms außer Sicht.</p>
      <p>Notiere danach, was das Kind mit und ohne Hilfe konnte. "3/4 gewählt, aber die Begründung fehlte" ist ein Ansatz für die nächste Stunde. Bewahre die Beobachtung in der ursprünglichen Notiz und kopiere den Aufbau für die nächste. Für eigene Lernnotizen des Kindes gibt es die <a href="/de/blog/cornell-methode-apple-notizen">Cornell-Vorlage</a>.</p>
      <h2 id="grenzen">Grenzen einer Unterrichtsplanung in Notizen</h2>
      <p>Die Notiz enthält den Plan und deine Beobachtungen. Die Tabelle führt die Stunde nicht durch und misst kein Verständnis. Du wählst Aktivitäten, prüfst die Mathematik und entscheidest nach der Antwort des Kindes, was als Nächstes kommt.</p>
      <p>Wenn deine Schule ein bestimmtes Formular verlangt, nutze es für die Abgabe. Dieses Beispiel ist eine Arbeitsnotiz für Nachhilfe.</p>
      <h2 id="ki">Nächste Stunde mit ChatGPT oder Claude entwerfen</h2>
      <p>In Pinto Notes kannst du denselben Aufbau mit Überschriften, Checkliste und Tabelle verwenden. Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> und Allow darf die KI lesen und bearbeiten. Lass aus deinen Beobachtungen einen neuen Plan vorschlagen.</p>
      <Keep title="Plan für die nächste Stunde anfordern" text={PROMPT} copyLabel={ui.copy} note="Ersetze Titel, Datum und Anfangsaufgabe. Der Auftrag nutzt das ausgefüllte Beispiel." />
      <p>Prüfe vor dem Speichern die Summe der Minuten und rechne jede Bruchaufgabe selbst nach. Der Entwurf sollte mit der noch fehlenden Erklärung beginnen. Entferne erfundene Beobachtungen. Pinto bewahrt frühere Notizversionen auf, falls du nach einer Änderung zurückkehren musst.</p>
      <p>Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> nach Pinto. In Apple Notizen ändert sich nichts.</p>
    </LocalPostPage>;
}
