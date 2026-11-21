import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Paths, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "salvare-note-iphone-pdf");
// Italian version of /blog/apple-notes-export-pdf. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "esportare note iphone pdf" suggested "esportare note iphone in pdf";
// "come salvare note iphone in pdf" suggested itself. Title follows the Italian wording.
// Apple it-it read 21 Nov: notes/not201900c07/mac (File > Esporta in > PDF, File > Stampa),
// iphone/iphdf551cfa2/ios (Condividi, Annota, Visualizza altro, fine del PDF),
// mac-help/mchlp1531/mac (Stampa > PDF > Salva come PDF, Opzioni di sicurezza),
// 108306 (macOS Tahoe/Sequoia menu variants), and 102208 (privacy.apple.com).
// The iPhone guide does not specify the destination of the PDF; none is invented. Picture follows English.
const ui = UI.it;
const FAQ = [
  { q: "Come salvo una nota di iPhone come PDF?", a: ["Apri la nota, tocca Condividi e poi Annota. Se non vedi Annota, apri le altre azioni. Quando hai finito, tocca il comando per salvare il PDF."] },
  { q: "Posso esportare una cartella intera?", a: ["Apple documenta l'esportazione di una nota alla volta, non un comando per una cartella. Per una copia completa valuta la richiesta dei tuoi dati Apple o uno strumento esterno, controllando il formato ottenuto."] },
  { q: "Perché un PDF allegato perde pagine?", a: ["Apple dice che, quando esporti la nota da iPhone, un PDF o una scansione allegata con più pagine compare solo con la prima pagina nel PDF risultante."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="salvare-note-iphone-pdf"
  intro={<>Puoi salvare una nota come PDF da iPhone o Mac. Il percorso cambia e, se la nota contiene un PDF allegato con più pagine, il risultato può sorprendere.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#mac", label: "Sul Mac" }, { href: "#iphone", label: "Su iPhone" },
    { href: "#allegati", label: "Allegati con più pagine" }, { href: "#tutte", label: "Una cartella o tutte" },
  ]}><p>Sul Mac seleziona una nota e scegli File &gt; Esporta in &gt; PDF. Su iPhone apri la nota, tocca Condividi e poi Annota, quindi salva il PDF. Apple descrive questi passaggi per una nota alla volta.</p>
    <PostCta slug="it/salvare-note-iphone-pdf" path="/it/blog/salvare-note-iphone-pdf" position="answer" ui={ui.cta} title="Vuoi che le note siano file fin dall'inizio?"><p>Pinto Notes conserva le note come file Markdown. Sul Mac puoi esportare una nota in PDF o stamparla, oltre a conservare le versioni precedenti.</p></PostCta>
  </Answer>}
  hero={<Capture priority src="/blog/macos27/notes-export-to" width={770} height={795} maxWidth={385} alt="Menu File di Note sul Mac aperto su Esporta in, con PDF e Markdown, e Stampa in fondo." caption="File, Esporta in, PDF in Note su macOS 27." />}
  faq={FAQ}>
  <h2 id="mac">Esportare una nota in PDF sul Mac</h2>
  <Paths rows={[{ on: "macOS 27", steps: ["File", "Esporta in", "PDF"] }]} />
  <Steps><li>Apri Note sul Mac e seleziona la nota da esportare.</li><li>Dal menu File scegli Esporta in, poi PDF. Dai un nome al file e scegli dove salvarlo.</li><li>Fai clic su Salva e apri il PDF per controllarlo.</li></Steps>
  <p>Il nome del menu cambia con macOS: nelle versioni precedenti Apple documenta Esporta come o Esporta come PDF. Puoi anche scegliere File &gt; Stampa, poi il menu PDF e Salva come PDF. In questa finestra, Opzioni di sicurezza permette di richiedere una password per aprire, copiare o stampare il documento.</p>
  <h2 id="iphone">Esportare una nota in PDF su iPhone</h2>
  <Steps><li>Apri la nota e tocca il pulsante Condividi.</li><li>Scegli Annota. Se l'azione non compare, apri le altre azioni del menu.</li><li>Se vuoi, annota le pagine. Tocca il pulsante finale per salvare il PDF.</li></Steps>
  <p>La guida Apple non indica una destinazione unica per il PDF salvato, quindi segui la schermata che compare sul tuo telefono. Per stampare invece, usa Condividi e poi Stampa.</p>
  <h2 id="allegati">Perché un allegato mostra solo la prima pagina</h2>
  <p>L'esportazione usa le impostazioni di visualizzazione correnti degli allegati. Apple dice che, se la nota contiene un PDF o un documento scansionato con più pagine, nel PDF della nota compare solo la prima pagina dell'allegato. Se ti servono tutte le pagine, conserva anche il file allegato originale.</p>
  <h2 id="tutte">Una cartella o tutte le note</h2>
  <p>Apple non documenta un comando per esportare più note o una cartella in PDF. Sul Mac puoi ripetere l'esportazione nota per nota. Per una copia dei dati iCloud puoi andare su privacy.apple.com e richiederla, ma Apple non specifica il formato delle note in quella procedura. Esistono strumenti esterni per esportare in massa, da valutare prima su una piccola raccolta. Per una copia modificabile, <a href="/blog/export-apple-notes-to-markdown">l'esportazione Markdown</a> è spiegata in inglese.</p>
  <h2>Quando le note sono già file</h2>
  <Figure shot={SHOTS.welcome} caption="Una nota in Pinto Notes sul Mac. Il contenuto è conservato come Markdown." />
  <p>Pinto Notes tiene le note come file Markdown e sul Mac permette File &gt; Esporta come PDF o File &gt; Stampa per la nota aperta. Nelle impostazioni dell'account puoi esportare tutte le note con le loro cartelle. Non promette l'esportazione PDF da iPhone. Puoi importare le note di Apple sul Mac senza modificarle. <a href="/blog/back-up-apple-notes">La guida al backup di Note</a> è in inglese.</p>
  <p>Altre guide: <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
