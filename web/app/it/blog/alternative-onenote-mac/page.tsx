import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "alternative-onenote-mac");
// Italian version of /blog/onenote-alternative-for-mac. Autocomplete hl=it, gl=it,
// 21 Nov 2026: "alternative a onenote mac" suggested "alternative onenote mac";
// "alternative onenote" suggested itself and "alternative onenote mac".
// No Apple menu names here. OneNote menu names in Italian were not verified;
// PDF and notebook export actions are described without invented labels.
const ui = UI.it;
const CHECK = `Controlli per passare da OneNote
Conserva l'accesso al taccuino originale.
Scegli cinque pagine di testo usate questa settimana.
Copia ciascuna in una nota o in un file di testo separato.
Controlla l'ordine di lettura e le tabelle.
Confronta link, foto e allegati con gli originali.
Tieni disegni e impaginazione nell'originale o in un PDF.
Prova le nuove note su Mac e iPhone prima di spostarne altre.`;
const FAQ = [
  { q: "Pinto Notes apre file .one o .onepkg?", a: ["No. Non ha un importatore diretto per OneNote. Importa cartelle o ZIP di file Markdown o di testo, ma il download di un taccuino OneNote è in un altro formato. Copia le pagine di testo che ti servono oppure prepara tu i file."] },
  { q: "Cosa posso salvare da OneNote su Mac?", a: ["Microsoft documenta il salvataggio in PDF della pagina aperta. L'esportazione web di un intero taccuino vale solo per OneDrive personale, non per account di lavoro o scuola né SharePoint. Nessuna delle due opzioni crea note Pinto modificabili."] },
  { q: "Un PDF di OneNote diventa una nota modificabile?", a: ["No. L'importatore Markdown e testo di Pinto non converte PDF in note modificabili. Tieni il PDF come copia di riferimento. Per continuare a modificare le parole, copia il testo o prepara un file Markdown o di testo."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="alternative-onenote-mac"
  intro={<>Pinto Notes è un'alternativa a OneNote per gli appunti personali scritti sul Mac. Somiglia a Note di Apple e permette di collegare l'AI. Non importa direttamente i taccuini OneNote: inizia con note nuove o poche pagine copiate.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#scegliere", label: "Cosa spostare" }, { href: "#salvare", label: "Salvare gli originali" },
    { href: "#testo", label: "Spostare il testo" }, { href: "#pinto", label: "Usare l'AI" },
  ]}><p>Pinto Notes va bene per appunti personali scritti su Mac e iPhone. Dopo il collegamento, ChatGPT o Claude possono leggerli e modificarli. Tieni OneNote per i taccuini che dipendono da impaginazione libera, disegni o pagine condivise. Pinto non importa un intero taccuino né i suoi file nativi.</p>
    <PostCta slug="it/alternative-onenote-mac" path="/it/blog/alternative-onenote-mac" position="answer" ui={ui.cta} title="Prova Pinto Notes con il prossimo appunto"><p>Il download per Mac è gratis. Scrivi una nota e collega ChatGPT o Claude per lavorarci.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="scegliere">Scegli gli appunti che vuoi continuare a usare</h2>
  <p>Inizia da un progetto attuale o da poche pagine personali. Lascia l'archivio in OneNote mentre provi la nuova app. Il testo di una riunione è diverso da una pagina di disegni disposti attorno a uno schema: copiarne le parole non ne conserva l'impaginazione.</p>
  <p>I taccuini, le sezioni e le pagine di OneNote danno una gerarchia all'archivio. Sul Mac puoi disegnare sulla pagina con mouse o trackpad e collaborare nei taccuini condivisi. Microsoft documenta <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac">la struttura</a>, <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">il disegno</a> e <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">la condivisione</a>.</p>
  <p>OneNote ha app per Windows e Android e una versione browser, secondo la <a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions">guida Microsoft</a>. Pinto è solo per iPhone e Mac. Leggi il <a href="/it/blog/onenote-vs-note-apple">confronto tra OneNote e Note di Apple</a> se stai valutando anche l'app Apple.</p>
  <h2 id="salvare">Salva gli originali prima di copiare il testo</h2>
  <p>Sul Mac apri una pagina OneNote e salvala come PDF dal menu File. La <a href="https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">guida Microsoft</a> descrive una copia statica della pagina: le modifiche successive non aggiornano il PDF. Aprilo e controllalo.</p>
  <p>Per un intero taccuino, Microsoft descrive un'esportazione separata da OneNote sul web. Fai clic con il tasto destro sul taccuino e avvia l'esportazione. La <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks">guida</a> limita la funzione agli account OneDrive personali, escludendo quelli di lavoro, scuola e SharePoint. Tieni il download come copia, non come file da importare in Pinto.</p>
  <h2 id="testo">Cosa può importare Pinto da OneNote</h2>
  <p>Non c'è un'importazione diretta da OneNote. Pinto non trasforma i file <code>.one</code> o <code>.onepkg</code> in note. Neppure l'importatore Markdown e testo converte i PDF di OneNote in note modificabili. Mettere il taccuino in uno ZIP non cambia il formato.</p>
  <p>Per poche pagine, copia il testo in note nuove separate. Comincia con una pagina breve e confrontala con l'originale. Controlla l'ordine dei blocchi, le tabelle e i link. Porta foto e allegati separatamente se ti servono: la copia del testo non li include necessariamente.</p>
  <p>Per più pagine, prepara una cartella di file Markdown o di testo, uno per nota. È un lavoro manuale, non una funzione di esportazione OneNote documentata da Microsoft. Sul Mac, usa l'importazione Markdown o testo nel menu File di Pinto e scegli la cartella. Come spiega la <a href="/blog/import-your-notes">guida all'importazione</a>, ogni cartella diventa una cartella.</p>
  <Keep title="Controlla poche pagine prima di continuare" text={CHECK} note="È un passaggio manuale, non una conversione automatica del taccuino." />
  <p>Tieni nell'originale o in un PDF verificato le pagine che dipendono da scrittura a mano, scansioni o impaginazione libera. Questo metodo sposta il testo, non quelle parti come contenuto Pinto modificabile.</p>
  <h2 id="pinto">Usa gli appunti con ChatGPT o Claude</h2>
  <p>Pinto Notes somiglia a Note di Apple su iPhone e Mac. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a>, l'AI può leggere e modificare le note. L'autorizzazione concede entrambe le funzioni. Ogni versione precedente resta disponibile.</p>
  <p>Prova una richiesta precisa sulle pagine copiate: "Leggi gli appunti sul progetto della cucina e aggiungi un elenco delle decisioni ancora da prendere." Controlla il risultato. Collegare l'AI non importa il resto dell'archivio OneNote.</p>
  <p>Scrivi i prossimi appunti personali in Pinto e verifica se coprono il tuo lavoro quotidiano. Puoi lasciare i taccuini condivisi in OneNote e spostare altre pagine dopo aver controllato le prime.</p>
  </LocalPostPage>; }
