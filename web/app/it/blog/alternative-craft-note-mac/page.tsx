import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "alternative-craft-note-mac");
// Italian version of /blog/craft-alternative-for-personal-notes. Autocomplete
// hl=it, gl=it, 21 Nov 2026: "alternativa craft note mac" returned [];
// "alternative craft" suggested craft fair and craft ideas, not a notes-app
// replacement. The title names Craft and note on Mac to disambiguate.
// No Apple Notes menu steps. Craft and Pinto facts follow the English post.
const ui = UI.it;
const CHECK = `Prova delle note personali da Craft
- [ ] Confronta tutto il testo con il documento originale
- [ ] Controlla intestazioni e voci spuntate
- [ ] Leggi ogni cella di una piccola tabella
- [ ] Apri un'immagine e un file allegato
- [ ] Segui un link a un altro documento importato
- [ ] Cerca il contenuto di una pagina o scheda annidata
- [ ] Apri e modifica la nota importata su iPhone
- [ ] Conserva gli originali in Craft e l'esportazione`;
const FAQ = [
  { q: "Quale alternativa a Craft va bene per le note personali?", a: ["Pinto Notes è una possibilità per chi usa Mac e iPhone e vuole un editor simile a Note di Apple. Prova una piccola esportazione Markdown. Se usi Collections o spazi condivisi, valuta di restare in Craft."] },
  { q: "Pinto ha uno strumento dedicato a Craft?", a: ["No. Il passaggio usa l'importazione generica di Markdown e testo. Non promette di ricreare spazi, schede e link interni di Craft."] },
  { q: "Serve lasciare Craft per usare ChatGPT o Claude?", a: ["No. Craft documenta collegamenti a entrambi tramite MCP e ha anche un assistente AI. Se ti serve solo questo accesso, prova prima quello di Craft."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="alternative-craft-note-mac"
  intro={<>Pinto Notes è un'alternativa a Craft per gli appunti personali su Mac e iPhone, con un editor simile a Note di Apple. Se usi spesso Collections o documenti condivisi, Craft può servirti ancora.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#scegliere", label: "Scegli in base alle note" }, { href: "#restare", label: "Quando tenere Craft" },
    { href: "#esportare", label: "Prova Markdown" }, { href: "#controllare", label: "Controlla le copie" },
    { href: "#pinto", label: "Usa Pinto Notes" },
  ]}><p>Per note di testo con intestazioni ed elenchi, prova a esportare qualche documento Craft in Markdown e a importarlo in Pinto. Craft offre già AI ed esportazione Markdown: da sole non richiedono un cambio di app.</p>
    <PostCta slug="it/alternative-craft-note-mac" path="/it/blog/alternative-craft-note-mac" position="answer" ui={ui.cta} title="Prova le tue note personali in Pinto"><p>Scarica Pinto Notes gratis sul Mac e importa pochi file Markdown. Collega ChatGPT o Claude se vuoi che legga e modifichi le note.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="scegliere">Parti dai documenti che usi davvero</h2>
  <p>Una lista di riparazioni di casa richiede meno di un archivio di progetti con campi collegati. Pinto Notes offre cartelle, elenchi di controllo, tabelle e link fra note. Funziona su Mac e iPhone, senza app per Windows o Android e senza versione web. Per un confronto più ampio leggi la <a href="/blog/best-notes-app-for-mac">guida alle app per Mac</a>.</p>
  <h2 id="restare">Quando conviene tenere Craft</h2>
  <p>Craft usa blocchi e schede. Le sue <a href="https://support.craft.do/en/organize-and-find/collections">Collections</a> hanno proprietà personalizzate, relazioni e viste tabella, galleria e Kanban. Cartelle e note collegate di Pinto non ricreano questa struttura.</p>
  <p>Craft offre spazi condivisi nei piani idonei e pubblicazione di documenti, come mostra la <a href="https://www.craft.do/pricing">pagina dei piani</a>. Se i colleghi lavorano lì, prova a spostare solo gli appunti privati.</p>
  <p>Craft offre un assistente AI e <a href="https://support.craft.do/en/integrate/mcp">collegamenti a ChatGPT e Claude</a>. Con gli accessi adatti, queste connessioni possono creare o aggiornare documenti. Provale prima se il tuo solo motivo per cambiare è l'AI.</p>
  <h2 id="esportare">Prova un'esportazione Markdown</h2>
  <p>Scegli un documento semplice con testo ed elenco, poi uno con allegato o pagina annidata. In Craft apri il documento, scegli Share, poi Export As e Markdown. Ripeti per il secondo e tieni i file e gli allegati nella stessa cartella. Sono i passaggi della <a href="https://support.craft.do/en/import-and-export/export/document">guida di Craft</a>.</p>
  <p>Sul Mac apri il menu File di Pinto Notes, scegli l'importazione Markdown o testo e seleziona la cartella. Pinto accetta anche uno ZIP; ogni cartella diventa una cartella. La <a href="/blog/import-your-notes">guida Pinto</a> è in inglese. L'esportazione conserva la struttura di base, ma non dimostra che schede e link interni funzionino allo stesso modo.</p>
  <h2 id="controllare">Confronta le copie</h2>
  <p>Leggi il primo e l'ultimo paragrafo, apri gli allegati e segui i link. Un titolo corretto nell'elenco delle note non basta.</p>
  <Keep title="Controlli dell'esportazione Craft" text={CHECK} note="Sono cose da verificare, non funzioni di cui si promette il trasferimento." />
  <p>Craft può esportare gli elementi delle Collections in Markdown con proprietà salvate come testo. Questo non equivale a migrare le viste Collections in Pinto. Tieni in Craft quelle importanti e le versioni precedenti dei documenti.</p>
  <h2 id="pinto">Scrivi e rivedi le note in Pinto</h2>
  <p>Quando il campione funziona, importa gli appunti personali che vuoi usare. Pinto conserva le versioni precedenti create lì; non recupera quelle di Craft. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> e scelto Allow, l'AI può leggere e modificare le note. Chiedile di proporre un prossimo passo da un elenco incompleto, poi controlla la proposta e la modifica.</p>
  </LocalPostPage>; }
