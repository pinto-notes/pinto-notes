import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "ausgaben-in-apple-notizen-erfassen");

// German version of /blog/apple-notes-expense-tracker, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „ausgaben tracker apple notizen“ ohne Vorschläge; „ausgaben app iphone“ und „beste ausgaben app iphone“ vorgeschlagen.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/notes/apda85974595/mac, https://support.apple.com/de-de/guide/iphone/iph46efa613a/ios, https://support.apple.com/de-de/guide/iphone/iphb9c2b948f/ios.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="ausgaben-in-apple-notizen-erfassen"
      intro={<>Apple Notizen hat keinen Ausgabentracker. Eine Tabelle als Liste und mathematische Ergebnisse unter der Tabelle reichen aber für einen einfachen Monatsüberblick.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vorlage", label: "Vorlage: Ausgaben und Summen" },
        { href: "#einrichten", label: "So richtest du die Notiz ein" },
        { href: "#alltag", label: "Im Alltag" },
        { href: "#grenzen", label: "Wo die Ausgabenliste aufhört" },
        { href: "#pinto", label: "Ausgaben mit KI erfassen" },
      ]}>
        <p>Schreibe jeden Kauf in eine Tabellenzeile. Unter der Tabelle gibst du jeder Kategorie eine Rechenzeile und addierst die Kategorien. In der Tabelle selbst rechnet Notizen nicht.</p>
        <PostCta slug="de/ausgaben-in-apple-notizen-erfassen" path="/de/blog/ausgaben-in-apple-notizen-erfassen" position="answer" ui={ui.cta} template="budget-log" title="Ausgaben nur einmal eintragen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
      hero={<PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} alt="Apple Notizen rechnet benannte Beträge in einer Notiz zusammen." caption="Benannte Zeilen können in Apple Notizen eine Summe bilden." />}
    >
      <h2 id="vorlage">Vorlage: Ausgaben und Summen</h2>
      <p>Die Tabelle enthält Datum, Ausgabe, Kategorie und Betrag. Die Zeilen darunter rechnen, weil eine Tabellenzelle keine Summe bildet. Benutze für Kategorie-Namen ein einzelnes Wort mit lateinischen Buchstaben und schreibe sie vor die Gesamtsumme.</p>
      <Keep title="Ausgaben in Apple Notizen" text={"Ausgaben, November\n\nDatum\tAusgabe\tKategorie\tBetrag\n1. Nov.\tWocheneinkauf\tLebensmittel\t412\n2. Nov.\tBuskarte\tFahrt\t85\n3. Nov.\tPizza mit Freunden\tEssen\t230\n5. Nov.\tGlühbirnen\tHaushalt\t64\n6. Nov.\tWocheneinkauf\tLebensmittel\t238\n8. Nov.\tKino\tFreizeit\t150\n\nLebensmittel = 412 + 238\nFahrt = 85\nEssen = 230\nHaushalt = 64\nFreizeit = 150\n\nLebensmittel + Fahrt + Essen + Haushalt + Freizeit ="} copyLabel={ui.copy} />
      <p>Ändere die Kategorien und Beträge nach deinem Alltag. Jedes Mal, wenn du eine Ausgabe einträgst, ergänze den Betrag auch in der passenden Rechenzeile.</p>
      <h2 id="einrichten">So richtest du die Notiz ein</h2>
      <p>Füge die Vorlage in eine neue Notiz ein. Markiere die Zeilen von „Datum“ bis zur letzten Ausgabe und nutze die Tabellen-Taste. Tabs trennen die Spalten.</p>
      <p>Auf dem Mac wählst du „Format“ &gt; „Mathematische Ergebnisse“. „Ergebnisse vorschlagen“ zeigt die Antwort nach einem Gleichheitszeichen, die du mit dem Zeilenschalter übernimmst. „Ergebnisse einfügen“ setzt sie sofort ein. Wenn nichts erscheint, prüfe, ob „Aus“ gewählt ist.</p>
      <p>Nutze eine aktualisierte iCloud-Notiz oder eine lokale Mac-Notiz. Lege jeden Monat eine neue Notiz an. Auf dem Mac kannst du die letzte duplizieren, Tabellenzeilen leeren, Summen zurücksetzen und den Titel ändern. <a href="/blog/apple-notes-tables" hrefLang="en">Tabellen in Apple Notizen</a> erklärt ihre Grenzen.</p>
      <h2 id="alltag">Im Alltag</h2>
      <p>Drücke in der letzten Tabellenzelle Tab, um eine Zeile hinzuzufügen. Trage Datum, Einkauf, Kategorie und Betrag ein. Ergänze den Betrag in der Rechenzeile, etwa „Lebensmittel = 4 + 12“. Die Gesamtsumme zieht mit.</p>
      <p>Hefte die Monatsnotiz an. Die Suche findet später Wörter wie „Kino“ in deiner Ausgabenliste. Für feste Grenzen pro Kategorie kannst du den <a href="/de/blog/budget-vorlage-apple-notizen">Budgetplan für Apple Notizen</a> daneben nutzen.</p>
      <h2 id="grenzen">Wo die Ausgabenliste aufhört</h2>
      <p>Du tippst jeden Betrag zweimal. Vergisst du die Rechenzeile, ist die Summe falsch. Die Tabelle sortiert und rechnet nicht. Monate liegen in getrennten Notizen; wiederkehrende Rechnungen trägst du jeden Monat neu ein.</p>
      <p>Für wenige Dutzend Käufe im Monat reicht das. Bei vielen Buchungen werden die Rechenzeilen schwer zu prüfen.</p>
      <h2 id="pinto">Ausgaben mit KI erfassen</h2>
      <p>Die kostenlose <a href="/templates/budget-log">Vorlage „Budget und Ausgaben“</a> in Pinto Notes setzt Monatsbudgets pro Kategorie. Du trägst eine Ausgabe einmal ein; die App zeigt verbleibendes Geld, Rechnungen, Kategorien und die letzten sechs Monate. Einträge lassen sich ändern oder mit Rückgängig entfernen.</p>
      <p>Nach dem Verbinden kannst du ChatGPT oder Claude Beträge und Kategorien im Chat nennen. Die KI trägt sie ein; die App rechnet. Sie verbindet sich nicht mit deiner Bank. Deine Apple Notizen kommen per Import auf dem Mac mit, ohne dort etwas zu ändern.</p>
      <Figure shot={SHOTS.budgetApp} caption="Die Vorlage „Budget und Ausgaben“ in Pinto Notes zeigt den Monat, Rechnungen und Budgets nach Kategorie." />
    </LocalPostPage>
  );
}
