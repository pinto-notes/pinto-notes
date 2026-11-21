import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "apple-notizen-speicherplatz-limit");

// German version of /blog/apple-notes-storage-limit, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen speicherplatz“, „apple notizen viel speicherplatz“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/108922, https://support.apple.com/de-de/108047, https://support.apple.com/de-de/103188, https://support.apple.com/de-de/108429, https://support.apple.com/de-de/guide/notes/apde615d29c2/mac.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="apple-notizen-speicherplatz-limit"
      intro={<>Apple nennt kein eigenes Speicherlimit nur für Notizen. iCloud-Notizen teilen sich den Speicher mit Fotos, Backups und anderen Daten. Daneben hat die App Grenzen für einzelne Notizen und Anhänge.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#icloud", label: "Notizen teilen den iCloud-Speicher" },
        { href: "#grenzen", label: "Grenzen innerhalb einer Notiz" },
        { href: "#anhaenge", label: "Wenn zu viele Anhänge erreicht sind" },
        { href: "#pruefen", label: "Verbrauch nachsehen" },
        { href: "#platz", label: "Platz schaffen" },
      ]}>
        <p>Mit einem Apple Account bekommst du 5 GB iCloud-Speicher. iCloud+ bietet mehr. Wenn der Platz voll ist, können Notizen und andere Daten nicht mehr richtig synchronisieren. Für einzelne Notizen veröffentlicht Apple keine pauschale Höchstzahl an Anhängen.</p>
        <PostCta slug="de/apple-notizen-speicherplatz-limit" path="/de/blog/apple-notizen-speicherplatz-limit" position="answer" ui={ui.cta} title="Notizen ohne iCloud-Speicher nutzen?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="icloud">Notizen teilen den iCloud-Speicher</h2>
      <p>Apple bietet 5 GB kostenlos sowie iCloud+-Pläne mit 50 GB, 200 GB, 2 TB, 6 TB und 12 TB. Notizen zählen laut Apple zu den Dokumenten im gemeinsamen Speicher. Bei einer geteilten Notiz zählt der Speicher des Eigentümers.</p>
      <p>Wenn iCloud voll ist, stoppen Backups und die Aktualisierung von iCloud Drive und anderen Apps. Das kann wie ein Sync-Fehler aussehen. <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a> hilft bei der Prüfung. Beim Verschieben in volle iCloud zeigt Notizen auf dem Mac eine Speicherwarnung.</p>
      <h2 id="grenzen">Grenzen innerhalb einer Notiz</h2>
      <p>Apple veröffentlicht in seinen iCloud-Grenzen keine Zahl für Notizen. Die Notizen-Anleitungen zeigen Anhänge, aber keine feste Größe oder Anzahl. Die App selbst meldet unter macOS 27.2 unter anderem zu viele Anhänge, zu große Anhänge, zu lange Notizen, zu viele Ordnerebenen oder eine Notiz, die zum Sperren zu groß ist.</p>
      <p>Für diese Meldungen nennt Apple überwiegend keine allgemeine Zahl. Bei einem Exchange-Account kannst du laut Apple keine Dateien anhängen. Unbestätigte Zahlen aus Foren helfen hier nicht.</p>
      <div className="tableWrap"><table><thead><tr><th scope="col">Grenze</th><th scope="col">Meldung sinngemäß</th><th scope="col">Zahl von Apple</th></tr></thead><tbody>
        <tr><td>Anhänge</td><td>Maximale Anzahl an Anhängen erreicht</td><td>Keine veröffentlicht</td></tr>
        <tr><td>Einzelner Anhang</td><td>Einige Anhänge sind zu groß; die App zeigt eine Größe an</td><td>Nur in der Meldung</td></tr>
        <tr><td>Notizlänge</td><td>Maximale Länge der Notiz erreicht</td><td>Keine veröffentlicht</td></tr>
        <tr><td>Ordnertiefe</td><td>Notizen ist auf eine bestimmte Zahl an Ordnerebenen begrenzt</td><td>Nur in der Meldung</td></tr>
        <tr><td>Notiz sperren</td><td>Die Notiz ist zum Sperren zu groß</td><td>Keine veröffentlicht</td></tr>
      </tbody></table></div>
      <h2 id="anhaenge">Wenn zu viele Anhänge erreicht sind</h2>
      <p>Lege für weitere Dateien eine zweite Notiz an und verknüpfe sie auf dem Mac über „Bearbeiten“ &gt; „Link hinzufügen“. Auf dem iPhone kannst du in der Anhangsübersicht eine Vorschau gedrückt halten, um zur Notiz zu springen. Auf dem Mac öffnet ein Klick mit gedrückter Control-Taste weitere Aktionen.</p>
      <p>Gesperrte Notizen erscheinen nicht in der gemeinsamen Anhangsübersicht; öffne sie einzeln.</p>
      <h2 id="pruefen">Verbrauch nachsehen</h2>
      <p>Der iPhone-Speicher zeigt den Platz pro App. In den iCloud-Einstellungen stehen die größten Speicherverbraucher oben; Notizen zählt Apple dort zu Dokumenten. Zwischengespeicherte Daten müssen in der iPhone-Anzeige nicht vollständig enthalten sein. Je nach Version heißt die Schaltfläche für iCloud „Speicher“ oder „Accountspeicher verwalten“.</p>
      <p>Nur Notizen unter iCloud nutzen iCloud-Speicher. „Auf meinem iPhone“ und „Auf meinem Mac“ bleiben lokal. Gmail-Notizen liegen beim Mailanbieter. <a href="/de/blog/wo-werden-apple-notizen-gespeichert">Wo Apple Notizen gespeichert werden</a> erklärt die Bereiche.</p>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} alt="iCloud-Speicheransicht auf dem iPhone mit Notizen." caption="Notizen nutzen den gemeinsamen iCloud-Speicher." />
      <h2 id="platz">Platz schaffen</h2>
      <p>Du kannst iCloud-Daten löschen, die du nicht brauchst, oder einen größeren Plan wählen. Große Notizen lassen sich nach „Auf meinem Mac“ verschieben, synchronisieren dann aber nicht mehr. Bei einem Wechsel zwischen Accounts können Anhänge verloren gehen; prüfe sie.</p>
      <p>Gelöschte Notizen bleiben 30 Tage in „Zuletzt gelöscht“. Sichere wichtige Inhalte vorher. Die <a href="/blog/back-up-apple-notes" hrefLang="en">Backup-Anleitung</a> zeigt die Wege.</p>
      <h2 id="pinto">Notizen ohne iCloud-Verbrauch</h2>
      <p>Pinto Notes synchronisiert über einen eigenen verschlüsselten Dienst. Ein voller iCloud-Speicher blockiert diesen Sync nicht. Notizen können Bilder, PDFs und Dateien enthalten. Die App läuft kostenlos auf iPhone und Mac.</p>
      <p>Markdown-Notizen lassen sich nach dem Verbinden von ChatGPT oder Claude bearbeiten. Beim Import aus Apple Notizen kommen Text und Bilder mit; PDFs und andere Anhänge bleiben laut englischer Vorlage in Apple Notizen. Der Originalbestand wird nicht geändert.</p>
      <Figure shot={SHOTS.iphoneFiles} caption="Eine Notiz mit PDF, CSV-Datei, Foto und Link in Pinto Notes auf dem iPhone." />
    </LocalPostPage>
  );
}
