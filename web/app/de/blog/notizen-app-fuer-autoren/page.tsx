import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "notizen-app-fuer-autoren");

// German version of /blog/notes-app-for-writers (21 Nov 2026). Google autocomplete hl=de,
// gl=de, read 21 Nov: „notizen app für autoren“ returned „notizen app für autoren“;
// „notizen app für schriftsteller“ returned no suggestions. German Apple pages read 21 Nov 2026:
// de-de/guide/notes/not9474646a9/mac (automatic saving, Ablage > Notiz duplizieren),
// not201900c07/mac (Ablage > Exportieren > PDF or Markdown),
// apde615d29c2/mac (Bearbeiten > Link hinzufügen). Other app facts remain the English post's.

const ui = UI.de;
const FAQ = [
  { q: "Kann ich einen Roman in Apple Notizen entwerfen?", a: ["Ja. Nimm eine Notiz pro Szene und eine Indexnotiz mit Links. Vor einer Überarbeitung kannst du auf dem Mac unter Ablage eine Notiz duplizieren. Für Wortziele und das Zusammenstellen eines Manuskripts sind Ulysses oder Scrivener passende Schreib-Apps."] },
  { q: "Welche Apps zeigen Autoren die Wortzahl?", a: ["Bear zeigt sie im Info Panel. Obsidian hat ein Kern-Plugin für die Wortzahl. Ulysses und Scrivener bieten als Schreib-Apps auch Wortziele."] },
  { q: "Reicht eine Notizen-App für Artikel?", a: ["Das kann reichen. Schreib und exportiere einen ganzen Artikel, bevor du deine Sammlung umziehst. Prüfe, wie du frühere Fassungen bewahrst und ob die exportierte Datei im Zielsystem funktioniert."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="notizen-app-fuer-autoren"
    intro={<>Apple Notizen passt zu Ideen und kurzen Entwürfen. Bear bietet Schreibstatistiken, Pinto Notes Versionsverlauf und verbundene KI, Obsidian verknüpft Recherchedateien. Für ein ganzes Manuskript kommen Ulysses oder Scrivener infrage.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#vergleich", label: "Sechs Apps vergleichen" }, { href: "#apple", label: "In Apple Notizen schreiben" },
      { href: "#pinto", label: "Pinto Notes" }, { href: "#schreibapps", label: "Ulysses und Scrivener" },
      { href: "#entwurf", label: "Einen Entwurf testen" },
    ]}>
      <p>Apple Notizen eignet sich zum Festhalten von Ideen und für Entwürfe in einer vertrauten App. Bear verbindet Markdown mit Wortzahl, Obsidian verknüpft Recherche in Markdown-Dateien. Pinto Notes bietet die Arbeitsweise von Apple Notizen mit früheren Versionen und KI-Zugriff. Ulysses und Scrivener haben Werkzeuge für Manuskripte.</p>
      <PostCta slug="de/notizen-app-fuer-autoren" path="/de/blog/notizen-app-fuer-autoren" position="answer" ui={ui.cta} title="Bewahre frühere Entwürfe in Pinto Notes">
        <p>Pinto Notes funktioniert wie Apple Notizen auf iPhone und Mac, behält frühere Fassungen und lässt ChatGPT oder Claude nach dem Verbinden deine Notizen lesen und bearbeiten.</p>
      </PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="vergleich">Sechs Apps für verschiedene Texte</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Gut für</th><th scope="col">Frühere Texte</th><th scope="col">Export</th></tr></thead><tbody>
      <tr><th scope="row">Apple Notizen</th><td>Ideen und kurze Entwürfe</td><td>Notiz vor dem Umschreiben duplizieren</td><td>Ausgewählte Notiz auf dem Mac als PDF oder Markdown</td></tr>
      <tr><th scope="row">Pinto Notes</th><td>Apple-Notizen-Gefühl mit KI-Zugriff</td><td>Versionsverlauf mit Wiederherstellung</td><td>Sammlung als Markdown im ZIP; PDF auf dem Mac</td></tr>
      <tr><th scope="row">Bear</th><td>Markdown-Entwürfe mit Wortzahl</td><td>Manuelle Sicherung der Sammlung</td><td>Markdown; DOCX, PDF und ePub erfordern Pro</td></tr>
      <tr><th scope="row">Obsidian</th><td>Recherche mit Links zu Entwürfen</td><td>Lokale Wiederherstellungspunkte; eigener Verlauf bei Sync</td><td>Notizen sind bereits Markdown-Dateien</td></tr>
      <tr><th scope="row">Ulysses</th><td>Konzentriertes Schreiben mit Zielen</td><td>Automatische lokale Sicherungen der Sammlung</td><td>DOCX, PDF, ePub, HTML oder Text</td></tr>
      <tr><th scope="row">Scrivener</th><td>Kapitel und Recherche in einem Projekt</td><td>Snapshots vor Überarbeitungen</td><td>Zusammenstellen als Word, PDF oder ePub</td></tr>
    </tbody></table></div>
    <p>Eine Sicherung der Sammlung, ein Wiederherstellungspunkt und eine selbst erstellte Kopie schützen unterschiedliche Dinge. Prüfe, was du brauchst.</p>
    <h2 id="apple">Mit Apple Notizen anfangen</h2>
    <p>Apple Notizen speichert beim Schreiben. Ein Ordner pro Projekt und eine Notiz pro Szene oder Artikel sind ein einfacher Anfang. Trenne Recherche vom Entwurf, damit du Quellen wiederfindest. Tags und angeheftete Notizen halten die Gliederung sichtbar.</p>
    <p>Für einen Index auf dem Mac schreibst du Szenentitel in eine Notiz. Markiere einen Titel, wähle Bearbeiten, Link hinzufügen und die Zielnotiz. Vor einer größeren Überarbeitung wählst du den Entwurf und dann Ablage, Notiz duplizieren. Gib der Kopie ein Datum und einen klaren Namen. Das bewahrt eine Fassung von Hand. Der <a href="/blog/apple-notes-version-history">englische Leitfaden zum Versionsverlauf</a> erklärt die Grenzen beim Wiederfinden älterer Texte.</p>
    <p>Für die Weitergabe an einen Editor wählst du auf dem Mac die Notiz und dann Ablage, Exportieren, PDF oder Markdown. Der <a href="/blog/export-apple-notes-to-markdown">englische Markdown-Leitfaden</a> erklärt, was du am Ergebnis prüfen solltest. Für Wortziele oder Buchausgabe vergleiche die Schreib-Apps unten.</p>
    <h2 id="pinto">Pinto Notes für frühere Fassungen und verbundene KI</h2>
    <p>Pinto Notes sieht aus und funktioniert wie Apple Notizen auf iPhone und Mac. Es speichert Notizen als Markdown und hat einen Versionsverlauf. Auf dem Mac öffnest du File, Version History, wählst eine frühere Version und „Restore This Version“. Auch der ersetzte Text bleibt danach als Version erhalten.</p>
    <Figure shot={SHOTS.history} caption="Versionsverlauf einer Einkaufsliste in Pinto Notes auf dem Mac. Frühere Texte und die Schaltfläche „Restore This Version“ sind sichtbar." />
    <p>Nach dem <a href="/blog/connect-chatgpt-to-your-notes">Verbinden von ChatGPT oder Claude</a> können sie Notizen lesen und bearbeiten. Du könntest die KI deine Recherchen lesen und eine Gliederung vorschlagen lassen. Prüfe den Vorschlag selbst und behalte die Quellen für Zitate und Fakten.</p>
    <p>Auf dem Mac speichert File, Export All Notes ein ZIP mit Markdown-Dateien in ihren Ordnern. Entsperre gesperrte Notizen vorher mit Passwort, Face ID oder Touch ID, wenn sie mitkommen sollen. File, Export as PDF speichert die offene Notiz als PDF. Für eine direkte Word- oder E-Book-Ausgabe bieten Ulysses und Scrivener diese Formate.</p>
    <p>Pinto Notes läuft nur auf iPhone und Mac, nicht unter Windows, Android oder im Web. Deine Apple Notizen kommen mit <a href="/blog/move-from-apple-notes">einem Import auf dem Mac</a> mit. Dort ändert sich nichts.</p>
    <h2 id="bear">Bear für Markdown-Entwürfe mit Wortzahl</h2>
    <p>Bear kombiniert Markdown mit Tags. Das Info Panel zeigt Wortzahl und geschätzte Lesezeit. Auf dem Mac hält Edit, Typewriter Mode die aktuelle Zeile in der Mitte. Du kannst auch Seitenleiste und Notizenliste ausblenden. Bears <a href="https://blog.bear.app/2023/07/get-started-with-bear/">Einführung</a> und die <a href="https://bear.app/faq/typewriter-mode/">Anleitung zum Schreibmaschinenmodus</a> erklären das.</p>
    <p>Markdown-Export gibt es in der kostenlosen Version. DOCX, PDF und ePub erfordern Pro. Bear beschreibt auch manuelle Sicherungen der ganzen Sammlung. Eine Wiederherstellung ersetzt die aktuelle Sammlung, keine einzelne Textstelle. Prüfe <a href="https://bear.app/faq/export-your-notes/">Exportformate</a> und <a href="https://bear.app/faq/backup-restore/">Sicherung</a> vor dem Umzug.</p>
    <h2 id="obsidian">Obsidian für Recherche in verknüpften Dateien</h2>
    <p>Obsidian speichert Notizen als normale Markdown-Dateien in einem Ordner. Du kannst Quellen mit Entwürfen verlinken und Dateien in anderen Texteditoren öffnen. Das Kern-Plugin für die Wortzahl zeigt Wörter und Zeichen der aktuellen Notiz. Obsidian erklärt <a href="https://obsidian.md/help/data-storage">Speicherung</a> und <a href="https://obsidian.md/help/plugins/word-count">Wortzähler</a>.</p>
    <p>File Recovery bewahrt lokale Momentaufnahmen standardmäßig sieben Tage. Sie bleiben auf dem Gerät und sind laut Obsidian keine vollständige Sicherung. Obsidian Sync hat einen eigenen Versionsverlauf. Beachte die <a href="https://obsidian.md/help/plugins/file-recovery">Grenzen der Wiederherstellung</a> und sichere deine Arbeit gesondert.</p>
    <h2 id="schreibapps">Ulysses und Scrivener für längere Texte</h2>
    <h3>Ulysses für konzentriertes Schreiben und Wortziele</h3>
    <p>Ulysses ist eher eine Schreib-App als eine Notizen-App. Sein ruhiger Editor und Projekte passen zu Artikeln und Manuskripten in Abschnitten. Du kannst Wortziele für Blatt, Gruppe oder Projekt setzen, auch täglich. Es exportiert DOCX, PDF, ePub, HTML und Text. Sieh dir <a href="https://help.ulysses.app/goals">Ziele</a> und <a href="https://help.ulysses.app/export">Export</a> an.</p>
    <p>Automatische Sicherungen bewahren die Sammlung lokal. Sie synchronisieren nicht zwischen Geräten und schließen External Folders aus. Das ist wichtig, wenn Entwürfe außerhalb der Sammlung liegen. Die <a href="https://help.ulysses.app/en_US/backups">Sicherungsanleitung</a> erklärt die Wiederherstellung.</p>
    <h3>Scrivener für ein Manuskript aus Abschnitten</h3>
    <p>Auch Scrivener ist eher eine Schreib-App. Du schreibst in Abschnitten, ordnest sie neu und hältst Recherche neben dem Entwurf. Der Kompositionsmodus blendet den Rest der Oberfläche aus. Wortziele gelten für Manuskript, Abschnitt oder Sitzung. Vor einer Überarbeitung kannst du einen Snapshot zum Vergleichen und Zurückkehren erstellen.</p>
    <p>Compile fügt Abschnitte zu einem Word-Dokument, PDF oder ePub zusammen. Das hilft, wenn Szenen ein Manuskript werden sollen. Probiere es mit einem Beispiel, bevor du ein ganzes Projekt übernimmst. Die <a href="https://www.literatureandlatte.com/scrivener/overview">Scrivener-Übersicht</a> beschreibt die Werkzeuge.</p>
    <h2 id="entwurf">Teste einen ganzen Entwurf vor dem Wechsel</h2>
    <p>Nimm einen kurzen Text, an dem du schon arbeitest. Schreib zwanzig Minuten, überarbeite einen Absatz und hole seine frühere Fassung zurück. Exportiere den Entwurf und öffne ihn dort, wo du ihn abgeben oder veröffentlichen wirst. Entscheide anhand dieser Schritte, welche App zu deinen Texten passt.</p>
  </LocalPostPage>;
}
