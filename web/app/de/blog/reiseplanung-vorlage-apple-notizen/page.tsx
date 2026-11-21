import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "reiseplanung-vorlage-apple-notizen");

// German version of /blog/apple-notes-trip-planner-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "reiseplanung vorlage" (word, excel, pdf, kostenlos, numbers), "reiseplaner vorlage",
// "packliste iphone notizen", "packliste urlaub notizen iphone", "reiseplanung iphone"; "reiseplaner notizen" has no
// suggestions. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apde615d29c2/mac (Bearbeiten, Link hinzufügen, Link zu Abschnitt, ">>", Command-K),
// the iPhone guide de-de/guide/iphone/iph908d1558b/ios (Link hinzufügen, Link zu Abschnitt), the Mac guide
// apd0a136b9cc (Format, Tabelle) and apd93c815aa0 (Format, Mehr, Alles deaktivieren). Bearbeiten, Als Markdown
// einsetzen and Ablage, Notiz duplizieren are Notes' de strings (MainMenu.loctable) on macOS 27.2, and the field Link zu
// is in NotesUI's de strings there. Apple's German iPhone guide doesn't name the iOS 27 edit menu's Attach File, so the
// post describes that step without a menu name. The example trip starts in Frankfurt (FRA) instead of Stockholm, and
// the travel adapter, which Lisbon doesn't need from Germany, is a power bank. Facts are the English post's; the
// pictures are its English ones, described in German. Links go to English posts where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Lissabon, 22. bis 26. Oktober

## Buchungen
- [ ] Flug FRA nach LIS, Do. 22.10. 06:55, Buchungsnr. TP7XQ2
- [ ] Hotel Principe Real, 22. bis 26.10., Buchungsnr. 88412093
- [ ] Fado-Abendessen, Sa. 24.10. 20:00
- [ ] Flug LIS nach FRA, Mo. 26.10. 17:40

## Donnerstag, 22. Oktober
- 06:55 Flug nach Lissabon
- 13:00 Mittagessen im Time Out Market
- 15:00 Check-in im Hotel
- 19:30 Sonnenuntergang am Miradouro da Senhora do Monte

## Freitag, 23. Oktober
- 09:30 Mit der Tram 28 nach Alfama
- 12:00 Mittagessen in der Nähe der Burg
- Nachmittag frei

## Samstag, 24. Oktober
- 10:00 Tagesausflug nach Sintra
- 20:00 Fado-Abendessen

## Packliste
- [ ] Reisepass oder Personalausweis
- [ ] Unterlagen zur Reiseversicherung
- [ ] Ladekabel fürs Handy
- [ ] Powerbank
- [ ] Bequeme Schuhe
- [ ] Regenjacke
- [ ] Zahnbürste
- [ ] Sonnencreme

## Ideen
- Sardinen in der Dose mitbringen
- Maja nach ihrer Liste mit Bäckereien fragen
`;

const FAQ = [
  { q: "Hat Apple Notizen eine Vorlage für die Reiseplanung?", a: [
    "Nein. Apple Notizen hat keinen Reiseplaner und keine Vorlagen. Eine Notiz mit einer Überschrift für die Buchungen, einer Überschrift pro Tag und einer Packliste als Checkliste funktioniert als einer, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Kann ich meine Tickets in Apple Notizen aufbewahren?", a: [
    "Ja. Zieh auf dem Mac das PDF in die Notiz. Auf dem iPhone mit iOS 27 hängst du eine Datei über das Bearbeitungsmenü der Notiz an. Ein Haken: Eine Notiz mit einer angehängten Datei lässt sich nicht sperren.",
  ] },
  { q: "Wie nutze ich eine Packliste für die nächste Reise wieder?", a: [
    "Dupliziere die Notiz mit Ablage, Notiz duplizieren, klicke dann in die Packliste und wähle Format, Mehr, Alles deaktivieren. Ändere die Daten und lösche die alten Tage.",
  ] },
  { q: "Gibt es einen kostenlosen Reiseplaner, der wie eine Notiz funktioniert?", a: [
    "Pinto Notes hat eine kostenlose Vorlage für Reisepläne: eine Notiz, die eine kleine App ist, mit einem Countdown, jedem Tag als Zeitleiste, den Buchungen mit einem Häkchen für bezahlt und einer Packliste. ChatGPT oder Claude können eine Buchung eintragen, die du einfügst.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="reiseplanung-vorlage-apple-notizen"
      intro={<>
        Der Flug steckt in einer Mail, das Hotel in einer anderen, der Plan für Samstag in einem Chat und die Packliste in deinem Kopf. Apple
        Notizen kann das alles in einer Notiz halten. Hier ist eine Reisevorlage zum Einfügen, drei Wege, sie besser zu machen, und wo sie
        aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#einrichten", label: "Einrichten" },
          { href: "#besser", label: "Besser machen" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Reiseplan, der mitzählt" },
        ]}>
          <p>
            Apple Notizen hat keinen Reiseplaner, aber eine Notiz erledigt das. Gib ihr eine Checkliste mit den Buchungen, die du abhakst,
            sobald sie bezahlt sind, eine Überschrift für jeden Tag mit den Uhrzeiten vor den Plänen und eine Packliste als Checkliste. Kopiere
            die Vorlage unten.
          </p>
          <PostCta template="trip-plan" slug="de/reiseplanung-vorlage-apple-notizen" path="/de/blog/reiseplanung-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du Countdown und Buchungen für dich geführt?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Vorlage für Reisepläne: die Tage bis zur Abreise, jeder Tag als Zeitleiste, was noch zu bezahlen ist und was schon gepackt ist. Füg eine Buchungsmail in ChatGPT oder Claude ein, und sie landet im Plan.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/trip-booking" width={1200} height={750} maxWidth={560}
        alt="Ein gezeichneter Briefumschlag mit einem Pfeil zu einer Checklisten-Karte, zwei ihrer Einträge sind orange abgehakt."
        caption="Jede Buchungsmail wird zu einer Zeile im Plan." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz pro Reise</h2>
      <p>
        Vier Tage Lissabon, als Beispiel. Setz deine eigene Reise ein, bevor du einfügst: die Buchungen mit ihren Buchungsnummern, eine
        Überschrift pro Tag und das, was du immer vergisst einzupacken. Lass in jeder Zeile ein Wort stehen, denn ein leerer
        Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Reiseplanung für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />

      <h2 id="einrichten">Einrichten</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Dasselbe Markdown zweimal in Apple Notizen unter macOS 27 eingefügt: mit Command-V bleiben die Zeichen als Text stehen, mit Edit, Paste as Markdown werden daraus eine Überschrift, eine Liste und fetter Text."
        caption="Links normal eingefügt, rechts mit „Als Markdown einsetzen“. Mit Checklistenzeilen geht es genauso." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Leg auf einem Mac mit macOS 27 eine neue Notiz an und wähle Bearbeiten, Als Markdown einsetzen. Die Zeile mit # wird zum Titel, jede
        Zeile mit ## zu einer Überschrift, Buchungen und Packliste werden zu Checklisten, und die Pläne bleiben eine Liste. Ein normales
        Command-V lässt die Zeichen als Text stehen. Auf dem iPhone tippst du die Zeilen, markierst die Buchungen und die Packliste und tippst
        auf die Checklisten-Taste.
      </p>
      <p>
        Hake eine Buchung ab, sobald sie bezahlt ist. Was nicht abgehakt ist, musst du noch bezahlen. Willst du die Buchungen lieber als
        Tabelle mit Spalten für Datum und Buchungsnummer sehen, legt Format, Tabelle eine an.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (auf Englisch) zeigt, wie, und was Tabellen nicht können.
      </p>

      <h2 id="besser">Besser machen</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bearbeiten", "Link hinzufügen", "Link zu Abschnitt"], keys: "⌘K" },
        { on: "iPhone", steps: ["Link hinzufügen", "Link zu Abschnitt"] },
      ]} />
      <ul>
        <li>
          <strong>Ein Inhaltsverzeichnis oben.</strong> Unter macOS 27 und iOS 27 kann ein Link auf eine Überschrift zeigen, so kann die
          Notiz mit einem Link zu jedem Tag beginnen. Gib unter „Link zu“ den Titel der Reisenotiz ein, und ihre Überschriften erscheinen.{" "}
          <a href="/blog/apple-notes-ios-27" hrefLang="en">What&apos;s new in Apple Notes in iOS 27</a> (auf Englisch) hat die Details.
        </li>
        <li>
          <strong>Tickets in der Notiz.</strong> Zieh auf dem Mac das PDF eines Tickets oder einer Hotelbestätigung in die Notiz, unter die
          passende Buchung. Auf dem iPhone mit iOS 27 hängst du die Datei über das Bearbeitungsmenü der Notiz an. Eine Notiz mit einer Datei
          darin lässt sich nicht sperren, lass Passnummern also draußen.
        </li>
        <li>
          <strong>Dieselbe Liste beim nächsten Mal.</strong> Wenn du zurück bist, wähle Ablage, Notiz duplizieren, klicke dann in die Packliste
          und wähle Format, Mehr, Alles deaktivieren. Die Kopie ist der Anfang der nächsten Reise.
        </li>
      </ul>
      <p>
        Planst du oft so, hat <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (auf Englisch) eine Packliste und
        einen Wochenrückblick, die du genauso einfügst.
      </p>

      <h2 id="grenzen">Wo ein Reiseplaner in Notizen aufhört</h2>
      <ul>
        <li><strong>Kein Countdown.</strong> Die Daten sind Wörter. Notizen weiß nicht, dass die Reise in neun Tagen ist oder dass heute der zweite Tag ist.</li>
        <li><strong>Buchungen von Hand.</strong> Jede Bestätigungsmail überträgst du Zeile für Zeile: die Uhrzeit, die Buchungsnummer, den Tag, zu dem sie gehört.</li>
        <li><strong>Tage sortieren sich nicht.</strong> Kommt ein Abendessen am Freitag dazu, suchst du selbst die Überschrift Freitag und die richtige Stelle darin. Verschiebst du es auf Samstag, schneidest du aus und fügst ein.</li>
        <li><strong>Nichts wird gezählt.</strong> Wie viele Buchungen noch offen sind oder wie viel noch zu packen ist, heißt Häkchen zählen.</li>
      </ul>
      <p>
        Für ein Wochenende reicht die Notiz völlig. Für eine Woche mit Flügen, Zügen und ein paar gebuchten Abendessen hältst du den Plan am
        Ende von Hand in Ordnung.
      </p>

      <h2 id="pinto-notes">Ein Reiseplan, der mitzählt</h2>
      <Figure shot={{ ...SHOTS.tripApp, alt: "Die Reiseplan-App in einer Notiz in Pinto Notes auf dem Mac: Lissabon, noch 9 Tage, 3 von 5 Buchungen bezahlt, 5 von 14 Sachen gepackt und der erste Tag als Zeitleiste mit Flug und Hotel." }}
        caption="Die Vorlage Reiseplan in Pinto Notes auf dem Mac, mit Beispieldaten: noch 9 Tage, 3 von 5 Buchungen bezahlt, 5 von 14 Sachen gepackt und der erste Tag als Zeitleiste." />
      <p>
        Dafür gibt es Pinto Notes. Es sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und eine Notiz kann auch eine kleine
        App sein. Die kostenlose Vorlage <a href="/templates/trip-plan">Reiseplan</a> ist so eine. Du sagst, wohin es geht und wann, und sie
        zählt die Tage herunter und zeigt dann, welcher Tag der Reise gerade ist. Jeder Tag ist eine Zeitleiste mit seinen Buchungen an der
        richtigen Stelle. Buchungen haben eine Art, eine Uhrzeit, eine Buchungsnummer und ein Häkchen, sobald sie bezahlt sind, also sagt sie
        dir, was noch zu bezahlen ist. Die Packliste ist in Gruppen geordnet, ein Tippen pro Sache, und eine neue Reise übernimmt sie.
      </p>
      <p>
        Du kannst auch eine Buchungsbestätigung in ChatGPT oder Claude einfügen, im Chat, den du schon nutzt, und es trägt die Buchung am
        richtigen Tag ein. Frag, was du noch buchen musst, und es liest den Plan, um zu antworten.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch) dauert eine Minute.
      </p>
      <p>
        Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem Mac</a> (auf Englisch)
        mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
