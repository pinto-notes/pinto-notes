import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "daily-standup-vorlage-apple-notizen");

// German version of /blog/apple-notes-daily-standup-template (21 Nov 2026). Slug and title from Google's German
// autocomplete, read 21 Nov: "daily standup" (meeting, fragen, scrum), "daily stand up" (meeting, scrum), "stand up
// meeting vorlage", "standup meeting vorlage"; "daily standup vorlage" and "daily scrum vorlage" have no suggestions.
// German teams say Daily Standup, Daily Scrum, Blocker and Sprint Review in English, so the post and the template do
// too. Apple's own German words, read 21 Nov 2026, from the Mac guide
// support.apple.com/de-de/guide/notes/apd93c815aa0/mac (Markierte Einträge automatisch sortieren), apdb54e469b6
// (anpinnen) and apdb5106e334 (Audio aufnehmen, Transkript, a Zusammenfassung with Apple Intelligence). Bearbeiten, Als
// Markdown einsetzen is in Notes' de strings (MainMenu.loctable) on macOS 27.2. Facts are the English post's; the
// picture is its English one, described in German. Links go to the German meeting notes post and to English posts
// where no German one exists.

const ui = UI.de;

const TEMPLATE = `# Standup-Notizen

## Blocker
- Warte auf API-Keys für den Zahlungsanbieter in Staging

## Freitag, 6. November
Gestern
- Sync-Konflikt behoben, wenn zwei Geräte dieselbe Notiz bearbeiten
- Tests für die Tabellen im Importer geschrieben

Heute
- [ ] Pull Request fürs Onboarding reviewen
- [ ] Mit dem PDF-Export anfangen

## Donnerstag, 5. November
Gestern
- Mit Emma zusammen am Importer gearbeitet

Heute
- [x] Sync-Konflikt beheben
- [x] Tabellentests für den Importer schreiben
`;

const TEAM = `# Team-Standup, Woche vom 2. November

## Blocker
- [ ] Sara: wartet auf API-Keys für den Zahlungsanbieter in Staging

## Freitag, 6. November
- Sara: Sync-Konflikt behoben. Heute das Onboarding-Review.
- Jonas: Gesamtsumme im Checkout verschoben. Heute die Mehrwertsteuerprüfung.
- Emma: Importer-Tests fertig. Heute der PDF-Export.
`;

const FAQ = [
  { q: "Was gehört in eine Notiz fürs Daily Standup?", a: [
    "Drei Dinge: was du gestern gemacht hast, was du heute machst und was dich blockiert. Jeweils ein paar kurze Punkte. Halte die Blocker oben in der Notiz, denn bei ihnen kann jemand anderes etwas tun.",
  ] },
  { q: "Hat Apple Notizen eine Vorlage für Standups?", a: [
    "Nein. Apple Notizen hat keine Vorlagen. Eine fortlaufende Notiz mit einer Überschrift pro Tag, der neueste zuerst, funktioniert als eine, und die Vorlage auf dieser Seite kannst du direkt einfügen.",
  ] },
  { q: "Wie protokolliere ich ein Daily Scrum?", a: [
    "Eine Notiz pro Sprint oder pro Woche, eine Überschrift pro Tag und eine Zeile pro Person mit dem, was sie gemacht hat und was als Nächstes kommt. Schreib Blocker als Checkliste mit dem Namen der Person vorne und hake jeden ab, sobald er gelöst ist.",
  ] },
  { q: "Kann Claude Code mein Standup aus meinen Commits schreiben?", a: [
    "Mit verbundenem Pinto Notes, ja. Die Vorlage für Daily Standups hat eigene Anweisungen für Claude Code: Es liest deine Commits seit gestern, macht daraus ein paar verständliche Punkte, fragt, was als Nächstes kommt, und schreibt den Tag in deine Notiz.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="de"
      slug="daily-standup-vorlage-apple-notizen"
      intro={<>
        Die meisten Standups beginnen damit, dass jemand versucht, sich an gestern zu erinnern. Eine Notiz, die du nebenbei schreibst, behebt
        das. Hier ist eine Vorlage für Daily-Standup-Notizen in Apple Notizen zum Einfügen, eine Version für ein ganzes Team und wo Notizen
        aufhört.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#vorlage", label: "Die Vorlage" },
          { href: "#jeden-tag", label: "Jeden Tag" },
          { href: "#team", label: "Fürs Team" },
          { href: "#grenzen", label: "Wo sie aufhört" },
          { href: "#pinto-notes", label: "Ein Standup aus deinen Commits" },
        ]}>
          <p>
            Apple Notizen hat keine Standup-Vorlage, aber eine fortlaufende Notiz erledigt das: oben die Blocker, dann eine Überschrift pro
            Arbeitstag, der neueste zuerst, mit Gestern und Heute darunter. Schreib Heute als Checkliste, dann sind die abgehakten Zeilen das
            Gestern von morgen.
          </p>
          <PostCta template="daily-standup" slug="de/daily-standup-vorlage-apple-notizen" path="/de/blog/daily-standup-vorlage-apple-notizen" position="answer" ui={ui.cta}
            title="Willst du gestern für dich aufschreiben lassen?">
            <p>Pinto Notes funktioniert wie Apple Notizen und hat eine kostenlose Standup-Vorlage. Erzähl ChatGPT oder Claude, was du gemacht hast, oder lass Claude Code gestern aus deinen Commits entwerfen.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="Eine Notiz Standup notes in Pinto Notes auf dem Mac: ein Blocker, der auf API-Keys für Staging wartet, dann Freitag, 6. November, und Donnerstag, 5. November, jeweils mit Punkten unter Yesterday und Today."
        caption="Standup-Notizen in Pinto Notes: oben die Blocker, ein Abschnitt pro Tag, der neueste zuerst. Derselbe Aufbau funktioniert in Apple Notizen." />}
      faq={FAQ}
    >
      <h2 id="vorlage">Die Vorlage: eine Notiz, eine Überschrift pro Tag</h2>
      <p>
        Eine Notiz für alle Standups bewahrt die Spur: Was du am Dienstag vorhattest, steht direkt unter dem, was du am Mittwoch gemacht hast.
        Die Blocker stehen über den Tagen, damit du sie als Erstes siehst. Lass in jeder Zeile ein Wort stehen, denn ein leerer
        Checklisteneintrag übersteht das Einfügen nicht.
      </p>
      <Keep title="Standup-Notizen für Apple Notizen" text={TEMPLATE} copyLabel={ui.copy}
        note="Füge sie auf dem Mac mit Bearbeiten, Als Markdown einsetzen in eine neue Notiz ein." />
      <Paths rows={[{ on: "Mac", steps: ["Bearbeiten", "Als Markdown einsetzen"] }]} />
      <p>
        Auf einem Mac mit macOS 27 macht Bearbeiten, Als Markdown einsetzen aus der Zeile mit # den Titel, aus jeder Zeile mit ## eine
        Überschrift und aus den Zeilen unter Heute eine Checkliste. Ein normales Command-V lässt die Zeichen als Text stehen. Auf dem iPhone
        tippst du sie ab, markierst die Zeilen unter Heute und tippst auf die Checklisten-Taste.
      </p>

      <h2 id="jeden-tag">Jeden Tag</h2>
      <ul>
        <li>
          <strong>Pinne sie an.</strong> Pinne die Notiz oben in ihrem Ordner an, dann ist sie morgens das Erste, was du öffnest.
        </li>
        <li>
          <strong>Mit den Häkchen von gestern anfangen.</strong> Setz die Überschrift für heute unter die Blocker. Was du unter dem Heute von
          gestern abgehakt hast, wird dein Gestern, und was nicht abgehakt ist, nimmst du mit.
        </li>
        <li>
          <strong>Heute am Abend vorher schreiben.</strong> Zwei oder drei Zeilen, solange du noch weißt, wo du aufgehört hast, sparen dir den
          Morgen.
        </li>
        <li>
          <strong>Blocker ausräumen.</strong> Ist etwas nicht mehr blockiert, lösch die Zeile. Eine Liste alter Blocker liest niemand mehr.
        </li>
        <li>
          <strong>In der Vergangenheit suchen.</strong> Die Suche liest jedes Wort in jeder Notiz, also findet „Importer“ jeden Tag, an dem du
          daran gearbeitet hast.
        </li>
      </ul>
      <p>
        Halte die Punkte kurz und in verständlichen Worten. Das Standup ist für Leute, die den Code nicht an seinen Branch-Namen erkennen.
      </p>

      <h2 id="team">Fürs Team: eine Zeile pro Person</h2>
      <p>
        Schreibst du beim Daily Scrum das Protokoll, reicht eine Zeile pro Person: was sie gemacht hat und was als Nächstes kommt. Blocker
        bekommen vorne einen Namen, damit alle sehen, wer woran hängt.
      </p>
      <Keep title="Team-Standup für Apple Notizen" text={TEAM} copyLabel={ui.copy}
        note="Fang jede Woche oder jeden Sprint eine neue Notiz an, dann bleibt sie kurz." />
      <p>
        Aktiviere in den Einstellungen von Notizen „Markierte Einträge automatisch sortieren“, dann rutschen gelöste Blocker nach unten. Mit
        Apple Intelligence wird aus einer Aufnahme in Notizen ein Transkript und eine Zusammenfassung. Das hilft, wenn du nicht tippen kannst,
        während du das Meeting leitest. Für längere Meetings hat die <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Vorlage für
        Meeting-Protokolle</a> Entscheidungen und Aufgaben mit Verantwortlichen, und in <a href="/blog/apple-notes-templates"
        hrefLang="en">Apple Notes templates</a> (auf Englisch) findest du einen Wochenrückblick zum Einfügen.
      </p>

      <h2 id="grenzen">Wo Standup-Notizen in Notizen aufhören</h2>
      <ul>
        <li><strong>Gestern kommt aus dem Gedächtnis.</strong> Was du gemacht hast, steht in deinen Commits und Pull Requests, und die sieht Notizen nicht.</li>
        <li><strong>Das Sprint Review geht nur von Hand.</strong> Zwei Wochen zusammenzufassen heißt, zehn Tage voller Punkte zu lesen und neu zu schreiben.</li>
        <li><strong>Alte Blocker sind schwer zu finden.</strong> Sobald du einen Blocker löschst, weiß nichts mehr, wie lange du darauf gewartet hast.</li>
        <li><strong>Die Notiz wächst.</strong> Eine fortlaufende Notiz wird lang, und sie zu kürzen ist noch eine Aufgabe.</li>
      </ul>

      <h2 id="pinto-notes">Ein Standup aus deinen Commits</h2>
      <p>
        Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac, und ChatGPT oder Claude können aus dem Chat, den du schon
        nutzt, in deinen Notizen arbeiten. Die kostenlose Vorlage <a href="/templates/daily-standup">Daily standup</a> ist eine Notiz mit den
        Blockern oben und den Tagen darunter, ein Abschnitt pro Arbeitstag, der neueste zuerst.
      </p>
      <p>
        Erzähl deiner KI jeden Morgen, was du gemacht hast und was als Nächstes kommt. Sie setzt einen Abschnitt mit Wochentag und Datum ein,
        mit Gestern und Heute als kurze Punkte. Was blockiert ist, kommt unter die Blocker, und wenn du sagst, dass es gelöst ist, fliegt es
        raus. In Claude Code hat die Vorlage eigene Anweisungen: Es führt im Repo git log für deine eigenen Commits seit gestern aus, macht
        daraus zwei bis fünf verständliche Punkte ohne die Hashes, fragt, was als Nächstes kommt und was dich blockiert, und schreibt dann den
        Tag. <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Notes in Claude Code and Codex</a> (auf Englisch) hat den einen
        Befehl, mit dem du es hinzufügst.
      </p>
      <p>
        Frag später „Woran war ich letzte Woche blockiert?“ oder „Fass meine Standups seit Montag fürs Sprint Review zusammen“. Jede frühere
        Version der Notiz bleibt erhalten, also ist auch ein gelöschter Blocker noch zu finden. Der Teil mit der KI funktioniert, sobald
        ChatGPT oder Claude verbunden ist. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT verbinden</a> (auf Englisch)
        dauert eine Minute. Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes" hrefLang="en">einem Import auf deinem
        Mac</a> (auf Englisch) mit, und Apple Notizen bleibt, wie es war. Die App ist auf Englisch.
      </p>
    </LocalPostPage>
  );
}
