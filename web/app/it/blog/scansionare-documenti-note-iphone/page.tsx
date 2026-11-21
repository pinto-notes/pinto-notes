import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "scansionare-documenti-note-iphone");
// Italian version of /blog/apple-notes-scan-document. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "scansionare documenti note iphone" and "scansionare documenti con note iphone".
// Apple it-it read 21 Nov: 108963 and iphone/iph653f28965/ios (Allegati,
// Scansiona documenti, Salva la scansione, Fine, Scansiona testo, Inserisci),
// 102332 (Fotocamera Continuity), iphone/iph8958dd125/ios (PDF),
// iphone/iphdf551cfa2/ios (export), preview/prvw1509/mac (Riduci dimensioni file).
const ui = UI.it;
const FAQ = [
  { q: "Come unisco più pagine in un PDF con Note?", a: ["In Note su iPhone tocca Allegati, poi Scansiona documenti. Acquisisci tutte le pagine prima di toccare Fine. Note le salva insieme come PDF nella nota."] },
  { q: "Scansiona testo crea parole modificabili?", a: ["Sì. Tocca Allegati, Scansiona testo, seleziona le parole inquadrate e tocca Inserisci. Funziona nelle lingue supportate. Scansiona documenti crea invece un PDF."] },
  { q: "Come riduco un PDF scansionato?", a: ["Apri il PDF in Anteprima sul Mac. Scegli File > Esporta, poi Filtro Quartz > Riduci dimensioni file e salva una copia. Controlla che il testo piccolo resti leggibile."] },
  { q: "Posso scansionare in Note sul Mac usando iPhone?", a: ["Sì, con Fotocamera Continuity. Nella nota fai clic tenendo premuto Ctrl, scegli Scansiona documenti, scansiona su iPhone e tocca Salva. I dispositivi devono rispettare i requisiti di Continuity."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="scansionare-documenti-note-iphone"
  intro={<>Apri una nota su iPhone, tocca Allegati e scegli Scansiona documenti. Acquisisci le pagine, poi tocca Fine: Note salva un PDF nella nota.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#iphone", label: "Scansione su iPhone" }, { href: "#pdf", label: "Condividere il PDF" },
    { href: "#testo", label: "Scansionare testo" }, { href: "#mac", label: "Scansione sul Mac" },
    { href: "#dimensioni", label: "Ridurre il file" },
  ]}><p>Note integra uno scanner. Scansiona documenti salva una o più pagine come PDF. Se vuoi inserire parole modificabili, scegli Scansiona testo. Sul Mac puoi usare la fotocamera di iPhone tramite Continuity.</p>
    <PostCta slug="it/scansionare-documenti-note-iphone" path="/it/blog/scansionare-documenti-note-iphone" position="answer" ui={ui.cta} title="Conservi PDF insieme agli appunti?"><p>Pinto Notes raccoglie PDF e file nelle note e nelle cartelle su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude possono leggere e modificare il testo degli appunti.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="iphone">Scansionare un documento su iPhone</h2>
  <Paths rows={[{ on: "iPhone", steps: ["Note", "Allegati", "Scansiona documenti"] }]} />
  <Steps><li>Apri una nota o creane una nuova.</li><li>Tocca Allegati e poi Scansiona documenti.</li><li>Inquadra la pagina. In modalità automatica, tieni fermo iPhone mentre acquisisce il documento.</li><li>Per scattare manualmente, tocca il pulsante dell'otturatore o premi un tasto Volume. Regola gli angoli e tocca Salva la scansione.</li><li>Acquisisci le altre pagine, poi tocca Fine.</li></Steps>
  <p>Puoi anche aprire il menu Altro della nota e toccare Scansiona. Apple descrive i due percorsi nella <a href="https://support.apple.com/it-it/108963">guida alla scansione</a>, insieme a flash e filtri.</p>
  <h2 id="pdf">La scansione è già un PDF</h2>
  <p>Note salva il documento come PDF nella nota. Per avere più pagine nello stesso file, continua a scansionare prima di toccare Fine. Apri l'allegato e usa il menu del PDF per condividerlo o scaricarlo. La <a href="https://support.apple.com/it-it/guide/iphone/iph8958dd125/ios">guida ai PDF in Note</a> spiega le opzioni di visualizzazione.</p>
  <p>Se esporti l'intera nota come PDF, Apple dice che di ogni scansione con più pagine compare solo la prima. Condividi l'allegato PDF quando ti serve il documento completo. Vedi la <a href="https://support.apple.com/it-it/guide/iphone/iphdf551cfa2/ios">guida all'esportazione</a>.</p>
  <h2 id="testo">Inserire testo dalla fotocamera</h2>
  <Paths rows={[{ on: "iPhone", steps: ["Note", "Allegati", "Scansiona testo", "Inserisci"] }]} />
  <p>Inquadra il testo, seleziona le parole e tocca Inserisci. Apple indica questa funzione per le lingue supportate. Inserisce testo modificabile nella nota; non converte un PDF già scansionato in testo. I passaggi sono nella <a href="https://support.apple.com/it-it/guide/iphone/iph653f28965/ios">guida alla fotocamera di Note</a>.</p>
  <h2 id="mac">Scansionare direttamente in Note sul Mac</h2>
  <p>Con <a href="https://support.apple.com/it-it/102332">Fotocamera Continuity</a>, fai clic nella nota tenendo premuto Ctrl e scegli Scansiona documenti. Potresti dover aprire prima il sottomenu Inserisci da iPhone. Inquadra le pagine su iPhone, poi tocca Salva. Il PDF appare sul Mac. Servono Wi-Fi, Bluetooth, lo stesso Apple Account e l'autenticazione a due fattori; Apple elenca anche i requisiti di sistema nella guida.</p>
  <h2 id="dimensioni">Ridurre le dimensioni del PDF</h2>
  <p>Se il file è troppo grande, aprilo in Anteprima sul Mac. Scegli File &gt; Esporta, poi Filtro Quartz &gt; Riduci dimensioni file e salva una copia. La compressione può peggiorare la qualità e il risultato varia. Controlla testo piccolo e firme prima di inviarlo. Sono i passaggi della <a href="https://support.apple.com/it-it/guide/preview/prvw1509/mac">guida di Anteprima</a>.</p>
  <h2 id="pinto">Conservare il documento con gli appunti</h2>
  <p>Pinto Notes permette di tenere PDF e file nelle note e nelle cartelle su iPhone e Mac. Puoi collegare ChatGPT o Claude per leggere e modificare gli appunti testuali. L'app conserva le versioni precedenti e può <a href="/blog/move-from-apple-notes">importare Note di Apple</a> sul Mac senza cambiarle.</p>
  </LocalPostPage>; }
