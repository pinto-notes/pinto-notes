import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "to-do-liste-apple-notizen");

// German version of /blog/apple-notes-to-do-list, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „to do liste apple notizen“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/102296, https://support.apple.com/de-de/guide/notes/apd93c815aa0/mac, https://support.apple.com/de-de/102484.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="to-do-liste-apple-notizen"
      intro={<>Für eine einfache To-do-Liste reichen die Checklisten in Apple Notizen. Jeder Punkt bekommt einen Kreis zum Abhaken. Mit einer Vorlage ordnest du Aufgaben nach heute, dieser Woche und später.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#iphone", label: "Eine To-do-Liste auf dem iPhone erstellen" },
        { href: "#mac", label: "Eine To-do-Liste auf dem Mac erstellen" },
        { href: "#vorlage", label: "Vorlage für eine To-do-Liste" },
        { href: "#sortieren", label: "Erledigte Punkte nach unten sortieren" },
        { href: "#mehr", label: "Mehrere Listen im Blick behalten" },
      ]}>
        <p>Erstelle eine Notiz und tippe auf die Checklisten-Taste. Auf dem Mac geht auch Umschalt-Befehl-L. Erledigte Punkte können automatisch nach unten wandern. Für Termine und Benachrichtigungen brauchst du die App Erinnerungen.</p>
        <PostCta slug="de/to-do-liste-apple-notizen" path="/de/blog/to-do-liste-apple-notizen" position="answer" ui={ui.cta} template="weekly-planner" title="Soll ChatGPT deine Aufgaben sortieren?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
      hero={<PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Eine Einkaufsliste als Checkliste in Apple Notizen auf dem Mac." caption="Abgehakte Punkte stehen unten." />}
    >
      <h2 id="iphone">Eine To-do-Liste auf dem iPhone erstellen</h2>
      <p>Öffne Notizen und erstelle eine Notiz. Schreibe einen Titel, wechsle in die nächste Zeile und tippe auf die Checklisten-Taste. Gib eine Aufgabe ein; mit dem Zeilenschalter entsteht die nächste. Tippe auf den Kreis, um sie abzuhaken.</p>
      <p>Du kannst bestehende Zeilen markieren und mit der Checklisten-Taste umwandeln. Ziehe einen Punkt, um ihn zu verschieben. Wische nach rechts zum Einrücken und nach links, um es zurückzunehmen.</p>
      <h2 id="mac">Eine To-do-Liste auf dem Mac erstellen</h2>
      <p>Klicke in einer Notiz auf die Checklisten-Taste oder drücke Umschalt-Befehl-L. Jede neue Zeile ist ein Punkt. Markierte Textzeilen kannst du ebenfalls in eine Checkliste umwandeln. Mit einem Klick auf den Kreis oder Umschalt-Befehl-U hakst du ab.</p>
      <p>Ziehe Punkte mit der Maus oder verschiebe sie mit Control-Befehl-Pfeil. Tab rückt ein, Umschalt-Tab zurück. In iCloud erscheint dieselbe Liste auf deinem iPhone.</p>
      <h2 id="vorlage">Vorlage für eine To-do-Liste</h2>
      <p>Die Abschnitte trennen Wichtiges für heute von späteren Aufgaben. Ersetze die Beispiele durch deine eigenen. Lass in jeder Checklisten-Zeile mindestens ein Wort, weil leere Punkte beim Einfügen verschwinden.</p>
      <Keep title="To-do-Liste für Apple Notizen" text={"# Aufgaben\n\n## Heute\n- [ ] Budget für Q4 an Jonas senden\n- [ ] Mama anrufen\n- [ ] Paket zurückschicken\n\n## Diese Woche\n- [ ] Weihnachtsreise buchen\n- [ ] Emmas Folien prüfen\n- [ ] Autowerkstatt anrufen\n\n## Unterwegs\n- [ ] Kleidung aus der Reinigung holen\n- [ ] Fahrradlicht kaufen\n\n## Warte auf\n- [ ] Jonas: Freigabe des Budgets\n\n## Irgendwann\n- [ ] Reisepass erneuern\n- [ ] Garage aufräumen"} copyLabel={ui.copy} />
      <p>Auf dem Mac mit macOS 27 kann die Einfügefunktion für Markdown aus den Zeichen Überschriften und Checklisten machen. Für die genaue deutsche Menübezeichnung gibt die geprüfte Apple-Seite keinen Beleg; füge den Text sonst normal ein und markiere die Zeilen für die Checklisten-Taste. Auf dem iPhone ist das der einfache Weg.</p>
      <h2 id="sortieren">Erledigte Punkte nach unten sortieren</h2>
      <p>Auf dem iPhone wählst du „Einstellungen“ &gt; „Apps“ &gt; „Notizen“ &gt; „Markierte Einträge sortieren“ &gt; „Automatisch“. Auf dem Mac aktivierst du in den Einstellungen von Notizen „Markierte Einträge automatisch sortieren“. Jede Geräteoption gilt für alle Listen dort.</p>
      <p>Prioritäten und Namen sortiert Notizen nicht. Schiebe wichtige Aufgaben selbst nach oben. Für eine wiederkehrende Liste wählst du auf dem Mac „Format“ &gt; „Mehr“ &gt; „Alles deaktivieren“. <a href="/blog/apple-notes-checklist-sort" hrefLang="en">Checklisten sortieren</a> zeigt die Details.</p>
      <h2 id="mehr">Mehrere Listen im Blick behalten</h2>
      <p>Hefte deine Hauptliste an. Auf dem Mac wählst du die Notiz und die Anheft-Aktion im Ablage-Menü; auf dem iPhone hältst du sie in der Liste gedrückt.</p>
      <p>Mit einem Tag wie #todo sammelst du Listen. Ein intelligenter Ordner mit der Regel für nicht erledigte Checklisten zeigt Notizen mit offenen Punkten. Du kannst eine Liste über die Teilen-Taste zur Zusammenarbeit freigeben; alle brauchen einen Apple Account.</p>
      <p>Aufgaben mit Termin, Uhrzeit oder ortsbezogenem Hinweis gehören in Erinnerungen.</p>
      <h2 id="grenzen">Wo Checklisten aufhören</h2>
      <p>Notizen hat in Checklisten keine Fälligkeit und keine Benachrichtigung. Abgehakte Punkte bleiben, bis du sie entfernst oder zurücksetzt. Eine unerledigte Aufgabe wandert nicht selbst von gestern nach heute. Reihenfolge und Überschriften pflegst du von Hand.</p>
      <h2 id="pinto">Eine Liste, die deine KI pflegt</h2>
      <p>Pinto Notes bietet Checklisten auf iPhone und Mac. Nach dem Verbinden kann ChatGPT oder Claude Aufgaben hinzufügen, Erledigtes entfernen und sagen, was offen ist.</p>
      <p>Die kostenlose <a href="/templates/weekly-planner">Wochenplaner-Vorlage</a> hat drei wichtigste Aufgaben, einen Abschnitt pro Tag und „Später“. Die KI kann Unerledigtes auf heute verschieben oder eine neue Woche vorbereiten. Du kannst alles auch selbst tippen und abhaken; frühere Versionen bleiben erhalten. Apple Notizen lassen sich auf dem Mac importieren, ohne dort etwas zu ändern.</p>
      <PostFigure src="/blog/launch/weekly-planner-note" width={1520} height={2058} alt="Wochenplaner in Pinto Notes mit Aufgaben nach Tagen." caption="Die kostenlose Wochenplaner-Vorlage." />
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} alt="Intelligenter Ordner für offene Checklisten in Apple Notizen." caption="Der Ordner sammelt Notizen mit offenen Aufgaben." />
    </LocalPostPage>
  );
}
