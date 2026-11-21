import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "evernote-in-apple-notizen-importieren");

// German version of /blog/evernote-to-apple-notes, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „evernote in apple notizen importieren“, „evernote zu apple notizen“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/102223, https://support.apple.com/de-de/guide/notes/not201900c07/mac.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="evernote-in-apple-notizen-importieren"
      intro={<>Du kannst Evernote-Notizen als ENEX-Dateien exportieren und auf dem Mac in Apple Notizen importieren. Arbeite Notizbuch für Notizbuch, damit die Ordner verständlich bleiben.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#vorbereitung", label: "Was du brauchst" },
        { href: "#export", label: "1. Notizbücher aus Evernote exportieren" },
        { href: "#import", label: "2. Auf dem Mac in Notizen importieren" },
        { href: "#ergebnis", label: "Was beim Import ankommt" },
        { href: "#vergleich", label: "Solltest du wechseln?" },
      ]}>
        <p>Du brauchst Evernotes Desktop-App für den Export und einen Mac für den Import in Notizen. Wähle in Notizen einen iCloud-Ordner, wenn die Notizen auch auf deinem iPhone erscheinen sollen.</p>
        <PostCta slug="de/evernote-in-apple-notizen-importieren" path="/de/blog/evernote-in-apple-notizen-importieren" position="answer" ui={ui.cta} title="Evernote-Notizen mit ChatGPT nutzen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="vorbereitung">Was du brauchst</h2>
      <p>Evernote exportiert aus der Desktop-App auf Mac oder Windows, auch mit einem kostenlosen Konto. In Evernote Web geht der Export laut Evernote nicht. Hast du unter Windows exportiert, kopiere die ENEX-Dateien danach auf den Mac.</p>
      <p>Apple importiert in aktualisierte iCloud-Notizen oder in den Bereich „Auf meinem Mac“. Wähle iCloud für den Sync aufs iPhone.</p>
      <h2 id="export">1. Notizbücher aus Evernote exportieren</h2>
      <p>Öffne Evernote auf dem Computer und wähle ein Notizbuch. Mit Rechtsklick öffnest du „Export“. Wähle ENEX und lass Tags und Erstellungsdatum eingeschaltet. Klicke „Export“ und wiederhole das für jedes Notizbuch.</p>
      <p>Für einzelne ausgewählte Notizen liegt die Grenze laut Evernote bei 100 pro Export. Für große Notizbücher lässt sich eine maximale ENEX-Größe zwischen 300 MB und 2 GB einstellen.</p>
      <h2 id="import">2. Auf dem Mac in Notizen importieren</h2>
      <p>Öffne Notizen und klicke in der Seitenleiste auf einen Ordner unter iCloud oder „Auf meinem Mac“. Wähle „Ablage“ &gt; „In ,Notizen’ importieren“. Wähle eine ENEX-Datei und bestätige „Importieren“ zweimal.</p>
      <p>Die Notizen erscheinen unter „Importierte Notizen“. Benenne diesen Ordner nach dem Evernote-Notizbuch und importiere erst dann die nächste Datei. Apple sagt nicht, ob mehrere gleichzeitig gewählte ENEX-Dateien getrennte Ordner ergeben. „Ordnerstruktur beim Import beibehalten“ ist für Ordner mit Dateien gedacht.</p>
      <h2 id="ergebnis">Was beim Import ankommt</h2>
      <p>Jede Notiz in einer ENEX-Datei wird eine Notiz. Seit macOS 13 können auch Evernote-Tags mitkommen. Nicht unterstützte Anhänge oder Funktionen lässt Apple weg, ohne sie im Supportartikel einzeln aufzulisten. Prüfe deshalb Stichproben, bevor du Evernote kündigst.</p>
      <p>Ein Tag ist in Apple Notizen ein Wort mit #. Intelligente Ordner können passende Notizen aus mehreren Ordnern sammeln.</p>
      <h2 id="vergleich">Solltest du wechseln?</h2>
      <p>Evernote läuft auch auf Windows und Android, hat einen Web Clipper, umfangreiche Suche und eigene KI-Funktionen. Der kostenlose Plan begrenzt auf 50 Notizen, ein Notizbuch und ein Gerät. Apple Notizen ist auf iPhone und Mac schon da und synchronisiert über iCloud. Es hat keine Windows- oder Android-App und keine Versionsgeschichte.</p>
      <p>Bleib bei Evernote, wenn du mehrere Plattformen, Web Clipping oder seine KI brauchst. Wechsle zu Apple Notizen für eine einfache Sammlung auf Apple-Geräten.</p>
      <h2 id="pinto">Ein weiterer Weg über Pinto Notes</h2>
      <p>Pinto Notes importiert dieselben ENEX-Dateien auf dem Mac. Jedes Notizbuch wird ein Ordner; Tags, Anhänge und Daten kommen mit. Evernote bleibt bestehen. Danach können ChatGPT oder Claude nach dem Verbinden die Notizen lesen und ändern. Frühere Versionen bleiben erhalten.</p>
      <p>Pinto Notes läuft nur auf iPhone und Mac. Wenn du schon nach Apple Notizen gewechselt bist, kannst du diese Notizen ebenfalls auf dem Mac importieren.</p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} alt="Import-Menü von Pinto Notes auf dem Mac mit Evernote." caption="Der Evernote-Import in Pinto Notes." />
      <PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785} alt="Evernote auf dem Mac mit einer Notiz und dem KI-Assistenten." caption="Evernotes KI-Assistent kann Notizen ordnen." />
    </LocalPostPage>
  );
}
