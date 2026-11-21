import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "google-keep-alternative-iphone-mac");
// German version of /blog/google-keep-alternative-for-iphone-and-mac, 21 Nov 2026.
// Google autocomplete hl=de, gl=de, read 21 Nov: "google keep alternative" yielded
// itself, "google keep alternative ios", "google keep alternative open source" and
// "google keep alternative nextcloud"; the longer iPhone/Mac seed yielded none.
// No Apple menu steps. Apple's de-de/guide/notes/welcome/mac and de-ch/guide/iphone/
// iph1ac0b3a2/27/ios/27 read 21 Nov for folders, checklists and tables.
// Keep and Pinto facts follow the English original; no extra importer promises. No pictures.
const ui = UI.de;
const CHECK = `Google Keep Wechsel prüfen
- [ ] Lange Notiz mit dem Original in Keep vergleichen
- [ ] Abgehakte und offene Listenpunkte prüfen
- [ ] Importiertes Bild öffnen
- [ ] Notiz mit zwei Labels prüfen
- [ ] Angeheftete Notiz und ihre Daten vergleichen
- [ ] Archivierte Notizen prüfen, falls mit importiert
- [ ] Bedeutung wichtiger Notizfarben festhalten
- [ ] Wichtige Zeichnungen separat sichern
- [ ] Benötigte Erinnerungen in der künftigen App neu anlegen
- [ ] Geteilte Listen in Keep lassen, bis alle einem Wechsel zustimmen
- [ ] Ursprünglichen Takeout-Download behalten`;
const FAQ = [
  { q: "Werden Google-Keep-Labels zu Ordnern?", a: ["Standardmäßig ja. Das erste Label wird zum Ordner, weitere zu Tags. Du kannst stattdessen alle Labels als Tags importieren. Prüfe eine Notiz mit mehreren Labels."] },
  { q: "Kommen Farben und Erinnerungen mit?", a: ["Nein. Farben, Zeichnungen und Erinnerungen werden ausgelassen. Die Importübersicht meldet betroffene Notizen. Sichere wichtige Zeichnungen und richte benötigte Hinweise neu ein."] },
  { q: "Bleiben Pinto Notes und Keep verbunden?", a: ["Nein. Der Import liest eine exportierte Kopie. Spätere Änderungen und Freigaben für andere Personen werden nicht übertragen."] },
];
export default function Page() { return <LocalPostPage lang="de" slug="google-keep-alternative-iphone-mac"
  intro={<>Pinto Notes ist eine kostenlose Google-Keep-Alternative für iPhone und Mac mit direktem Takeout-Import. Wenn du Android oder gemeinsam bearbeitete Google-Listen brauchst, bleib bei Keep.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#wahl", label: "Alternative wählen" }, { href: "#keep", label: "Bei Keep bleiben" },
    { href: "#uebernahme", label: "Was mitkommt" }, { href: "#import", label: "Import" },
    { href: "#pruefen", label: "Ergebnis prüfen" },
  ]}><p>Pinto Notes passt zu persönlichen Notizen auf iPhone und Mac. Text, Checklisten, Bilder, Labels, Pins und Daten kommen beim Import mit. Farben, Zeichnungen und Erinnerungen nicht.</p>
    <PostCta slug="de/google-keep-alternative-iphone-mac" path="/de/blog/google-keep-alternative-iphone-mac" position="answer" ui={ui.cta} title="Keep-Notizen in Pinto Notes testen"><p>Lade Pinto Notes kostenlos auf deinen Mac und importiere deinen Google-Keep-Download. Nach dem Verbinden können ChatGPT oder Claude die importierten Notizen lesen und bearbeiten.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="wahl">Nach deinen Geräten und Notizen wählen</h2>
  <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen. Es läuft nur auf Mac und iPhone, ohne Windows-, Android- oder Web-App. Für Notizen im Browser bietet Keep bereits einen Zugang. Apple Notizen ist eine weitere Option für Ordner, Checklisten und Tabellen. Der <a href="/de/blog/apple-notizen-vs-google-keep">Vergleich mit Google Keep</a> und die <a href="/de/blog/google-keep-in-apple-notizen-importieren">deutsche Importanleitung für Apple Notizen</a> helfen bei dieser Wahl.</p>
  <h2 id="keep">Wann Google Keep besser passt</h2>
  <p>Keep hat Apps für iPhone und Android und läuft im Browser auf keep.google.com. Das beschreibt <a href="https://support.google.com/keep/answer/2888240?hl=de">Googles Anleitung</a>. Pinto ersetzt Keep daher nicht auf einem Android-Gerät.</p>
  <p>Andere Personen können eine geteilte Keep-Notiz bearbeiten, wie <a href="https://support.google.com/keep/answer/6101196?hl=de">Google erklärt</a>. Beim Import gehen diese Berechtigungen nicht mit. Persönliche Notizen kannst du umziehen und gemeinsame Listen vorerst in Keep lassen.</p>
  <h2 id="uebernahme">Was aus dem Takeout-Download mitkommt</h2>
  <p><a href="https://support.google.com/keep/answer/10017039?hl=de">Google nennt die Exportinhalte</a>. Pinto Notes übernimmt davon Folgendes:</p>
  <div className="tableWrap"><table><thead><tr><th scope="col">In Google Keep</th><th scope="col">Nach dem Import</th></tr></thead><tbody>
    <tr><th scope="row">Text und Checklisten</th><td>Text und Zustand der Häkchen kommen mit</td></tr>
    <tr><th scope="row">Labels</th><td>Standardmäßig Ordner, auf Wunsch Tags</td></tr>
    <tr><th scope="row">Pins und Daten</th><td>Anheftung sowie verfügbare Erstellungs- und Änderungsdaten</td></tr>
    <tr><th scope="row">Bilder</th><td>Als Anhänge, wenn Dateien im Download liegen</td></tr>
    <tr><th scope="row">Archiv</th><td>Standardmäßig ausgeschlossen, auf Wunsch in einem Archivordner</td></tr>
    <tr><th scope="row">Papierkorb</th><td>Wird übersprungen</td></tr>
    <tr><th scope="row">Farben, Zeichnungen, Erinnerungen</th><td>Werden ausgelassen und in der Übersicht gemeldet</td></tr>
    <tr><th scope="row">Freigaben</th><td>Werden nicht übertragen</td></tr>
  </tbody></table></div>
  <p>Bei der Ordnerwahl wird das erste Label einer Notiz zum Ordner, die weiteren zu Tags. Bei der Tagwahl bleiben alle Labels Tags. Wenn Rot bei dir „dringend“ bedeutet, schreib das vor dem Wechsel in wichtige Notizen. Sichere Zeichnungen separat und richte Erinnerungen in deiner künftigen App neu ein.</p>
  <h2 id="import">Auf dem Mac importieren</h2>
  <p>Öffne in Pinto Notes das Ablage-Menü und wähle Google Keep. Pinto öffnet Googles Downloadseite mit ausgewähltem Keep. Zieh den Download in Pinto. Die <a href="/blog/import-your-notes" hrefLang="en">Importanleitung</a> (auf Englisch) zeigt den Einstieg.</p>
  <p>Wähle in Google Takeout „Nächster Schritt“, einen einmaligen Export als ZIP und „Export erstellen“. Lade die Datei nach Googles E-Mail herunter. Die Vorbereitung kann Minuten bis Tage dauern. Laut <a href="https://support.google.com/accounts/answer/3024190?hl=de">Google</a> löscht der Download keine Daten.</p>
  <p>Pinto nimmt die ZIP-Datei, den entpackten Takeout-Ordner oder dessen Keep-Ordner an. Bei entpackten Dateien müssen Bilder neben den Notizdateien bleiben. Wähle Ordner oder Tags für Labels und entscheide, ob das Archiv mitkommt. Lies die Importübersicht.</p>
  <h2 id="pruefen">Wichtige Notizen vergleichen</h2>
  <p>Vergleiche eine lange Notiz, eine gemischte Checkliste, ein Bild und mehrere Labels mit Keep. Die Anzahl allein reicht nicht.</p>
  <Keep title="Prüfliste für den Keep-Import" text={CHECK} copyLabel={ui.copy} note="Mit dem Takeout-Download aufbewahren und die eigenen Notizen prüfen." />
  <p>Der Import verbindet die Apps nicht. Entscheide nach der Prüfung, wo du jede Notiz weiter bearbeitest. Sonst laufen die Kopien auseinander.</p>
  <h2 id="pinto-notes">KI für importierte Notizen nutzen</h2>
  <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Verbinden von ChatGPT oder Claude</a> und einem „Allow“ können sie Pinto-Notizen lesen und bearbeiten. Lass eine Projektnotiz suchen und nächste Schritte vorschlagen, dann prüfe das Ergebnis. Pinto bewahrt frühere Versionen von Änderungen dort, auch nach KI-Bearbeitungen. Die Versionen vor dem Import stellt es nicht wieder her. Die App ist auf Englisch.</p>
</LocalPostPage>; }
