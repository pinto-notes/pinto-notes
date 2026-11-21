import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "alternative-evernote");
// Italian version of /blog/evernote-alternative. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "alternativa a evernote" returned that query, "alternativa a evernote gratis",
// "app alternativa a evernote" and "alternativa evernote open source".
// Apple it-it/guide/notes/not201900c07/mac and it-it/102223 read 21 Nov 2026:
// File > Importa in Note, iCloud, Sul mio Mac, Note importate. No menu labels for other apps
// are translated as if they came from Apple. Other app facts and the picture follow English.
const ui = UI.it;
const FAQ = [
  { q: "Quali alternative gratis importano i taccuini Evernote?", a: ["Note di Apple, Pinto Notes, Obsidian e Joplin accettano file .enex. Obsidian Sync è un servizio a pagamento facoltativo; Joplin ti lascia scegliere la sincronizzazione. Evernote permette anche agli account gratuiti di esportare."] },
  { q: "Posso importare un backup ENEX in Notion?", a: ["L'importazione ufficiale di Notion si collega all'account Evernote. La guida non documenta il caricamento di un file .enex. Se hai soltanto il backup, Note di Apple, Pinto Notes, Obsidian, Bear e Joplin documentano l'importazione da file."] },
  { q: "Posso lasciare Evernote usando soltanto iPhone?", a: ["Evernote permette di esportare solo nell'app desktop per Mac o Windows. Bear importa un file .enex già ottenuto anche su iPhone. L'importazione da account di Notion funziona da desktop o web, non nell'app mobile."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="alternative-evernote"
  intro={<>Note di Apple è un'alternativa semplice a Evernote per gli appunti personali su Mac e iPhone. Pinto Notes aggiunge l'accesso dell'AI, Obsidian conserva file Markdown, Notion serve i gruppi, Bear la scrittura e Joplin offre taccuini open source.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#confronto", label: "Le sei alternative" }, { href: "#esporta", label: "Esporta da Evernote" },
    { href: "#note-apple", label: "Come importare" }, { href: "#controlli", label: "Controlla il risultato" },
  ]}><p>Note di Apple, Pinto Notes, Obsidian e Joplin sono opzioni gratuite che accettano i file .enex di Evernote. Li importa anche Bear, ma per la sincronizzazione iCloud serve Pro. Notion è adatto al lavoro condiviso: la sua importazione ufficiale si collega all'account Evernote, non a un file .enex.</p>
    <PostCta slug="it/alternative-evernote" path="/it/blog/alternative-evernote" position="answer" ui={ui.cta} title="Porta i taccuini Evernote in Pinto Notes"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Importa i taccuini Evernote sul Mac, poi collega ChatGPT o Claude per leggere e modificare le tue note.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu File di Pinto Notes sul Mac, con Import from Evernote e altre opzioni di importazione." caption="Nel menu File di Pinto Notes sul Mac c'è l'importazione da Evernote. Immagine: Pinto Notes." />}
  faq={FAQ}>
  <h2 id="confronto">Quale alternativa a Evernote fa per te?</h2>
  <div className="tableWrap"><table><thead><tr><th>App</th><th>La scegli per</th><th>Importazione Evernote</th><th>Controlla prima</th></tr></thead><tbody>
    <tr><th>Note di Apple</th><td>Appunti personali sui dispositivi Apple</td><td>.enex sul Mac</td><td>Allegati e funzioni non supportati vengono omessi</td></tr>
    <tr><th>Pinto Notes</th><td>Note simili a quelle di Apple, con ChatGPT o Claude</td><td>.enex sul Mac; i taccuini diventano cartelle</td><td>Solo iPhone e Mac</td></tr>
    <tr><th>Obsidian</th><td>File Markdown locali e ricerca collegata</td><td>.enex con il plugin Importer ufficiale</td><td>La sincronizzazione va scelta a parte</td></tr>
    <tr><th>Notion</th><td>Pagine e database condivisi</td><td>Collegamento all'account Evernote da desktop o web</td><td>Nessun caricamento .enex documentato</td></tr>
    <tr><th>Bear</th><td>Scrittura Markdown organizzata con tag</td><td>.enex su Mac o iPhone</td><td>iCloud richiede Pro</td></tr>
    <tr><th>Joplin</th><td>Taccuini open source e web clipper</td><td>.enex nell'app desktop</td><td>Scegli servizio di sincronizzazione e formato</td></tr>
  </tbody></table></div>
  <p>Le procedure seguenti vengono dalle guide dei produttori consultate il 21 novembre 2026.</p>
  <h2 id="esporta">Per prima cosa, esporta da Evernote</h2>
  <p>Nell'app desktop Evernote per Mac o Windows, seleziona un taccuino, scegli Export e il formato ENEX. Mantieni selezionati i tag e gli altri attributi che ti servono. Esporta ogni taccuino separatamente e conserva i file come backup. Evernote dice che anche gli account gratuiti possono esportare; Evernote Web non lo permette. Vedi la <a href="https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML">guida di Evernote</a>.</p>
  <h2 id="note-apple">Note di Apple per gli appunti di ogni giorno</h2>
  <p>Note di Apple va bene per appunti personali, elenchi e informazioni da conservare. Usa cartelle, tag e ricerca. Con iCloud, le note sono disponibili sui dispositivi collegati allo stesso Apple Account.</p>
  <p>Sul Mac, seleziona una cartella sotto iCloud o Sul mio Mac. Poi scegli File &gt; Importa in Note e seleziona i file .enex. Scegli iCloud se vuoi le note anche su iPhone. Secondo la <a href="https://support.apple.com/it-it/guide/notes/not201900c07/mac">guida Apple</a>, i tag si importano da macOS 13. Allegati e funzioni non supportati vengono omessi. La <a href="/it/blog/importare-evernote-in-note-apple">guida per passare da Evernote a Note</a> include i controlli, sulla base delle <a href="https://support.apple.com/it-it/102223">istruzioni Apple</a>.</p>
  <h2 id="pinto">Pinto Notes per note familiari e accesso AI</h2>
  <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Le note sono file Markdown e ogni versione precedente resta nella cronologia. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a>, possono leggere e modificare le note.</p>
  <p>Esporta ogni taccuino Evernote in un file .enex sul Mac e importali tutti insieme. Ogni taccuino diventa una cartella e arrivano anche i tag. Nel menu File di Pinto Notes scegli Import from Evernote, come nell'immagine. La <a href="/blog/import-your-notes">guida all'importazione</a> è in inglese. Evernote resta com'era. Pinto Notes è solo per iPhone e Mac: non ha app Windows, Android o web.</p>
  <h2 id="obsidian">Obsidian per file Markdown e ricerche collegate</h2>
  <p>Obsidian salva file Markdown locali. Link, grafico e plugin della comunità aiutano a organizzare una raccolta di ricerche. Funziona su Mac, iPhone, Windows, Linux e Android. L'app è gratuita; Obsidian Sync è un servizio a pagamento facoltativo.</p>
  <p>Installa e attiva Importer dalle impostazioni dei plugin della comunità. Aprilo, scegli Evernote (.enex), seleziona il file, usa Import per l'anteprima e di nuovo per finire. La <a href="https://obsidian.md/help/import/evernote">guida di Obsidian</a> spiega come conservare pile di taccuini con i nomi dei file e gerarchie di tag rinominandoli. Un'esportazione normale non conserva queste strutture.</p>
  <h2 id="notion">Notion per le note di un gruppo</h2>
  <p>Notion trasforma i taccuini in pagine e le note in elementi di database. È utile se vuoi lavorarci con il gruppo, ma cambia l'organizzazione della libreria. Funziona su Mac, iPhone, Windows, Android e web.</p>
  <p>Da desktop o web apri Settings, Import, Third party imports, Evernote. Accedi a Evernote, autorizza e scegli i taccuini. La <a href="https://www.notion.com/help/import-data-into-notion">guida ufficiale</a> documenta il collegamento all'account, non il caricamento di un .enex. Esclude Evernote Teams e avverte che le immagini potrebbero richiedere correzioni. Conserva l'accesso a Evernote finché non hai verificato il risultato.</p>
  <h2 id="bear">Bear per scrivere in Markdown con i tag</h2>
  <p>Bear offre un editor Markdown con tabelle ed elenchi da spuntare su Mac e iPhone. La sincronizzazione iCloud richiede Pro, secondo la <a href="https://bear.app/">pagina delle funzioni</a>. Sul Mac scegli File, Import From, Evernote e il file .enex. Su iPhone, usa il menu a tre punti nella barra laterale e poi Import. La <a href="https://bear.app/faq/migrate-from-evernote/">guida di Bear</a> spiega che .enex non contiene i nomi dei taccuini. Suggerisce di aggiungere tag prima di esportare per conservarli come riferimento.</p>
  <h2 id="joplin">Joplin per taccuini open source</h2>
  <p>Joplin è gratuito e open source, con taccuini, tag, web clipper e note disponibili senza connessione. Funziona su Mac, iPhone, Windows, Linux e Android. Puoi scegliere un servizio come Dropbox o OneDrive invece di Joplin Cloud; impostalo separatamente dall'importazione.</p>
  <p>Nell'app desktop scegli File, Import, ENEX. Joplin accetta un file o una cartella di file e crea un taccuino per ognuno. Importa tag e allegati. La <a href="https://joplinapp.org/help/apps/import_export/">guida</a> distingue Markdown e HTML: il Markdown può perdere colori e formattazione dei caratteri, mentre HTML li conserva meglio. Anche i link tra note possono richiedere correzioni.</p>
  <h2 id="controlli">Prova un piccolo taccuino prima di spostare tutto</h2>
  <p>Scegline uno con i tipi di note che usi davvero. Confronta il numero di note e apri quelle con allegati o tabelle. Controlla tag, cartelle e link tra note. Cerca una nota che conosci e aprila su iPhone dopo aver configurato la sincronizzazione. Conserva gli .enex originali finché il risultato ti soddisfa.</p>
  </LocalPostPage>; }
