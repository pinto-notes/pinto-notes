import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, FigurePair, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "obsidian-vs-note-apple");
// Italian version of /blog/apple-notes-vs-obsidian. Google autocomplete hl=it, gl=it, 21 Nov 2026:
// "obsidian vs apple note" suggested that exact query; "obsidian vs apple notes" suggested the reverse comparison,
// Reddit and 2026. "note iphone vs obsidian" had no suggestions. Italian title uses the app names.
// Apple it-it guides read 21 Nov 2026: notes/not201900c07/mac (File > Importa Markdown;
// File > Esporta in > PDF or Markdown), notes/apde615d29c2/mac (Modifica > Aggiungi link),
// 102537 (protezione delle note), and the Italian Notes guide on tags, tables and smart folders.
// Other app facts and screenshots follow the English post; prices omitted because the Italian market differs.
const ui = UI.it;
const FAQ = [
  { q: "È meglio Note di Apple o Obsidian?", a: ["Note di Apple è più semplice per gli appunti rapidi su iPhone e Mac. Obsidian è più adatto a chi vuole file Markdown, collegamenti tra note, plugin e accesso da Windows, Linux o Android."] },
  { q: "Obsidian si sincronizza con Note di Apple?", a: ["No. Il plugin Importer di Obsidian copia le note in un vault sul Mac. Note può importare file Markdown nel verso opposto. Dopo l'importazione le due copie non restano collegate."] },
  { q: "Obsidian è gratis?", a: ["Sì, la versione base è gratuita e non richiede un account. Obsidian Sync è un servizio a pagamento. Tra iPhone e Mac puoi anche sincronizzare il vault con iCloud."] },
  { q: "E Notion?", a: ["Note di Apple va bene per appunti personali rapidi, Obsidian per una raccolta di file collegati, Notion per pagine e database condivisi con un gruppo."] },
];
export default function Page() {
  return <LocalPostPage lang="it" slug="obsidian-vs-note-apple"
    intro={<>Note è già sul tuo iPhone. Obsidian ti lascia organizzare gli appunti come file. La scelta dipende da come scrivi e da quali dispositivi usi.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#confronto", label: "Il confronto" }, { href: "#note", label: "Quando scegliere Note" },
      { href: "#obsidian", label: "Quando scegliere Obsidian" }, { href: "#passare", label: "Spostare le note" },
      { href: "#pinto", label: "Un'altra possibilità" },
    ]}><p>Scegli <strong>Note di Apple</strong> se vuoi scrivere subito su iPhone e Mac, con sincronizzazione iCloud. Scegli <strong>Obsidian</strong> se vuoi file Markdown locali, link con riferimenti di ritorno, una vista a grafo e plugin. Obsidian funziona anche su Windows, Linux e Android.</p>
      <PostCta slug="it/obsidian-vs-note-apple" path="/it/blog/obsidian-vs-note-apple" position="answer" ui={ui.cta} title="Vuoi l'interfaccia di Note con file Markdown?"><p>Pinto Notes funziona su iPhone e Mac. Conserva le note come Markdown, con link tra note e versioni precedenti. Sul Mac importa Note di Apple e i vault di Obsidian. ChatGPT o Claude possono leggere e modificare le note dopo il collegamento.</p></PostCta>
    </Answer>}
    hero={<FigurePair items={[
      { src: "/blog/news/apple-notes-mac-groceries", width: 1600, height: 1000, alt: "Note di Apple sul Mac: cartelle, elenco delle note e lista della spesa con tre voci spuntate." },
      { src: "/blog/news/obsidian-mac-groceries", width: 1600, height: 1000, alt: "Obsidian sul Mac: cartelle del vault e lista della spesa aperta in una scheda." },
    ]} caption="La stessa lista in Note di Apple e Obsidian. In Obsidian è un file Markdown. Immagini: Pinto Notes." />}
    faq={FAQ}>
    <h2 id="confronto">Il confronto in breve</h2>
    <div className="tableWrap"><table><thead><tr><th></th><th>Note di Apple</th><th>Obsidian</th></tr></thead><tbody>
      <tr><th>Dispositivi</th><td>Dispositivi Apple e iCloud.com</td><td>Mac, Windows, Linux, iPhone e Android</td></tr>
      <tr><th>Archivio</th><td>Dentro Note, di solito su iCloud</td><td>File Markdown in una cartella locale</td></tr>
      <tr><th>Sincronizzazione</th><td>iCloud</td><td>Obsidian Sync, iCloud tra iPhone e Mac o altri servizi</td></tr>
      <tr><th>Link</th><td>Link tra note, senza elenco dei link in entrata</td><td>Link, riferimenti di ritorno e grafo</td></tr>
      <tr><th>Versioni</th><td>Nessuna cronologia delle modifiche</td><td>Copie locali per sette giorni; più a lungo con Sync</td></tr>
      <tr><th>Cifratura</th><td>Apple conserva le chiavi iCloud con la protezione standard; Protezione avanzata dei dati le tiene sui tuoi dispositivi</td><td>I file locali restano sul tuo disco; Obsidian Sync cifra le note durante la sincronizzazione</td></tr>
      <tr><th>Altro</th><td>Tabelle, tag, cartelle smart, registrazioni</td><td>Plugin, temi, Canvas e Publish</td></tr>
    </tbody></table></div>
    <h2 id="note">Quando Note di Apple è più comoda</h2>
    <p>Apri l'app e scrivi. Le note arrivano sugli altri dispositivi collegati allo stesso Apple Account. Puoi usare elenchi di controllo, tabelle, tag, cartelle smart, ricerca e note protette con password, Face ID o Touch ID. Le registrazioni possono avere trascrizioni e riepiloghi di Apple Intelligence sui dispositivi compatibili.</p>
    <p>Il testo non è una cartella di file Markdown che puoi aprire con qualsiasi editor. Note può esportare una nota alla volta in PDF o Markdown sul Mac, ma non offre una cronologia delle sue versioni. Per i link usa Modifica &gt; Aggiungi link; non mostra tutti i link che rimandano alla nota. Vedi <a href="/blog/apple-notes-backlinks">i riferimenti di ritorno</a> e <a href="/blog/apple-notes-version-history">la cronologia delle versioni</a>, in inglese.</p>
    <h2 id="obsidian">Quando Obsidian dà più controllo</h2>
    <p>Un vault è una cartella di file Markdown leggibili anche da altri editor. I link tra note, i riferimenti di ritorno e il grafo aiutano a seguire le relazioni. Puoi cambiare l'app con plugin e temi. Obsidian è gratuito senza registrazione, ma Obsidian Sync e Publish sono a pagamento.</p>
    <p>La sincronizzazione richiede una scelta: il servizio di Obsidian, iCloud tra dispositivi Apple o un altro servizio. Le copie locali di recupero durano sette giorni per impostazione predefinita e non si sincronizzano. Sync offre una cronologia più lunga. L'interfaccia e i plugin richiedono più tempo di una nota appena aperta su iPhone.</p>
    <h2 id="passare">Spostare le note tra le due app</h2>
    <p>Il plugin Importer di Obsidian importa le note di Apple su macOS. Salta quelle protette e può portare tabelle, immagini, disegni, scansioni e PDF. Per andare nella direzione opposta, Note sul Mac usa File &gt; Importa Markdown. Nessuno dei due passaggi crea una sincronizzazione continua. La guida <a href="/blog/move-apple-notes-to-obsidian-notion-keep">per uscire da Note di Apple</a> spiega le alternative.</p>
    <PostFigure src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Due schermate dell'importazione di un vault Obsidian in Pinto Notes sul Mac." caption="Pinto Notes importa il vault e mantiene i link tra le note. Dati di esempio." />
    <h2 id="pinto">Note familiari, file Markdown</h2>
    <Figure shot={SHOTS.aiEdit} caption="ChatGPT ha aggiunto cinque voci a una lista in Pinto Notes. Le modifiche sono evidenziate e si possono annullare." />
    <p>Pinto Notes usa file Markdown cifrati, link tra note e versioni precedenti, ma si presenta come Note di Apple su iPhone e Mac. Non ha il grafo né i plugin di Obsidian. Sul Mac può importare entrambe le app; l'importazione di Note di Apple non cambia gli originali. Se colleghi ChatGPT o Claude, puoi far leggere e modificare le note dalla chat. <a href="/blog/connect-chatgpt-to-your-notes">Ecco come collegare ChatGPT</a> (in inglese).</p>
  <p>Altre guide: <a href="/blog/obsidian-mcp">Obsidian e l’AI</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>;
}
