import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "annotare-pdf-note-iphone");
// Italian version of /blog/apple-notes-annotate-pdf. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "annotare pdf note iphone", "scrivere su pdf note iphone" and
// "modificare pdf note iphone" returned no suggestions. Title uses the direct task.
// Apple it-it read 21 Nov: iphone/iph8958dd125/ios (PDF previews, Visualizza come),
// iphone/iph893c6f8bf/ios (drawing tools), notes/apdef7f74190/mac (Modifica, Fine),
// mac-help/mchl1fd88863/mac (annotation tools), preview/prvw11580/mac (existing text),
// iphone/iphdf551cfa2/ios (whole-note PDF export). The iPhone annotation button is
// icon-only in Apple's localized guide, so its position is described rather than named.
const ui = UI.it;
const REVIEW = `Revisione PDF

Documento:
Pagina:
Commento:
Prossimo passo:
`;
const FAQ = [
  { q: "Posso annotare un PDF in Note su iPhone?", a: ["Sì. Se l'anteprima è piccola, apri il PDF e tocca il pulsante per annotare. Se è media o grande, tocca lo stesso pulsante direttamente nell'anteprima. Usa penna, pennarello o matita."] },
  { q: "Posso modificare il testo originale di un PDF?", a: ["Le guide Apple descrivono annotazioni e azioni sulle pagine, non la riscrittura delle parole già presenti. Sul Mac lo strumento Testo aggiunge una casella sopra la pagina. Anche Anteprima non modifica il testo originale."] },
  { q: "Dove trovo Modifica per il PDF sul Mac?", a: ["Apri la nota, fai clic sulla freccia accanto al titolo del PDF e scegli Modifica. Usa gli strumenti e poi fai clic su Fine."] },
  { q: "Condividi > Annota cambia l'allegato?", a: ["No. Esportare l'intera nota come PDF crea un altro documento. Per annotare l'allegato apri gli strumenti sul PDF stesso. Il PDF della nota comprende solo la prima pagina degli allegati con più pagine."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="annotare-pdf-note-iphone"
  intro={<>In Note puoi scrivere e disegnare su un PDF allegato. Su iPhone apri gli strumenti di annotazione del documento; sul Mac usa la freccia accanto al titolo e scegli Modifica.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#iphone", label: "Su iPhone" }, { href: "#mac", label: "Sul Mac" },
    { href: "#limiti", label: "Limiti" }, { href: "#esportare", label: "Allegato o nota?" },
  ]}><p>Su iPhone, se l'anteprima è piccola apri il PDF, poi tocca il pulsante per annotare. Con un'anteprima media o grande puoi toccarlo direttamente. Sul Mac apri il menu accanto al titolo del PDF, scegli Modifica e alla fine fai clic su Fine.</p>
    <PostCta slug="it/annotare-pdf-note-iphone" path="/it/blog/annotare-pdf-note-iphone" position="answer" ui={ui.cta} title="Conserva anche i commenti scritti"><p>Pinto Notes funziona su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude possono leggere e modificare le note di revisione che scrivi. Pinto conserva le versioni precedenti.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="iphone">Annotare un PDF su iPhone</h2>
  <p>Se il PDF è ancora in File o Mail, tieni premuto il documento, tocca Condividi e scegli Note. Seleziona la nota e tocca Salva.</p>
  <Steps><li>Trova il PDF nella nota.</li><li>Se l'anteprima è piccola, apri il PDF e tocca il pulsante per annotare. Con un'anteprima media o grande, tocca quel pulsante direttamente.</li><li>Scegli penna, pennarello o matita e scrivi con il dito.</li><li>Tocca di nuovo lo strumento scelto per cambiarne spessore o opacità. Usa il selettore dei colori per cambiare colore.</li></Steps>
  <p>Per cambiare la dimensione dell'anteprima, apri il menu del PDF, tocca Visualizza come e scegli Piccolo, Medio o Grande. Se la barra degli strumenti è ridotta, toccala per riaprirla. Apple mostra i passaggi nelle guide ai <a href="https://support.apple.com/it-it/guide/iphone/iph8958dd125/ios">PDF in Note</a> e agli <a href="https://support.apple.com/it-it/guide/iphone/iph893c6f8bf/ios">strumenti di annotazione</a>.</p>
  <h2 id="mac">Modificare un PDF in Note sul Mac</h2>
  <Paths rows={[{ on: "Mac", steps: ["Freccia accanto al titolo del PDF", "Modifica", "Fine"] }]} />
  <Steps><li>Apri la nota che contiene il PDF.</li><li>Fai clic sulla freccia accanto al titolo del PDF e scegli Modifica.</li><li>Aggiungi annotazioni con gli strumenti della barra.</li><li>Fai clic su Fine.</li></Steps>
  <p>Testo aggiunge una casella da spostare sulla pagina. Evidenzia selezione marca il testo selezionato. Schizzo serve per disegnare e Firma per firmare. Gli strumenti possono variare secondo il file. Apple li descrive nelle guide per <a href="https://support.apple.com/it-it/guide/notes/apdef7f74190/mac">modificare allegati in Note</a> e per <a href="https://support.apple.com/it-it/guide/mac-help/mchl1fd88863/mac">usare gli strumenti di modifica</a>.</p>
  <h2 id="limiti">Cosa significa modificare un PDF</h2>
  <p>Puoi aggiungere commenti e disegni alla pagina. Una casella di testo non sostituisce le parole originali del PDF. Le guide di Note non descrivono la riscrittura del testo esistente; Apple dice anche che <a href="https://support.apple.com/it-it/guide/preview/prvw11580/mac">Anteprima non lo modifica</a>.</p>
  <p>Su iPhone puoi mostrare le miniature delle pagine e usare il menu di una pagina per ruotarla. Filtri e Ritaglia pagina valgono solo per i documenti scansionati.</p>
  <h2 id="esportare">Annotare l'allegato o esportare la nota?</h2>
  <p>Su iPhone, Condividi &gt; Annota sull'intera nota crea un PDF nuovo con il testo della nota. Per scrivere sul PDF allegato usa invece i suoi strumenti di annotazione. Apple avverte che il PDF esportato della nota include solo la prima pagina di ogni allegato con più pagine o scansione. La <a href="https://support.apple.com/it-it/guide/iphone/iphdf551cfa2/ios">guida Apple</a> spiega il limite; la guida per <a href="/it/blog/salvare-note-iphone-pdf">salvare una nota come PDF</a> mostra i passaggi completi.</p>
  <h2 id="pinto">Conservare anche la revisione scritta</h2>
  <p>Un cerchio a pagina 4 indica dove intervenire. Una nota può spiegare cosa cambiare e chi deve farlo. Copia questo schema e ripeti pagina e commento per ogni punto.</p>
  <Keep title="Nota di revisione PDF" text={REVIEW} copyLabel="Copia" />
  <p>Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> a Pinto Notes, puoi chiedere di trasformare i commenti scritti in una lista di controllo mantenendo i numeri di pagina. Pinto Notes conserva le versioni precedenti. Puoi <a href="/blog/move-from-apple-notes">importare Note di Apple</a> sul Mac senza cambiarle.</p>
  </LocalPostPage>; }
