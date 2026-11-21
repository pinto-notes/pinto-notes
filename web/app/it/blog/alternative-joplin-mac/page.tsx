import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "alternative-joplin-mac");
// Italian version of /blog/joplin-alternative-for-mac. Autocomplete hl=it,
// gl=it, 21 Nov 2026: "alternativa joplin mac" returned []; "alternative
// joplin" suggested itself, "joplin open source alternative", "best joplin
// alternative" and "joplin alternative self hosted".
// No Apple Notes menu steps. Joplin and Pinto facts follow the English post.
const ui = UI.it;
const CHECK = `Controlli del passaggio da Joplin a Pinto Notes
- [ ] Confronta il numero di note del taccuino di prova
- [ ] Leggi una nota lunga accanto all'originale in Joplin
- [ ] Apri un'immagine e un file allegato
- [ ] Segui un link tra due note importate
- [ ] Controlla una tabella e un elenco di controllo
- [ ] Verifica titolo, date e testo dei tag
- [ ] Conserva il backup JEX e l'esportazione Markdown`;
const FAQ = [
  { q: "Pinto importa un backup JEX di Joplin?", a: ["No. Questa procedura usa una cartella o uno ZIP di file Markdown o di testo. Conserva il JEX come backup da reimportare in Joplin e prepara un'esportazione Markdown separata."] },
  { q: "Quale formato Joplin usare per Pinto?", a: ["Prova Markdown + Front Matter. Joplin documenta titolo, date e tag in quel formato. Pinto legge quei campi e aggiunge i tag come testo. Conserva gli allegati nella cartella esportata."] },
  { q: "Posso continuare a usare Joplin su Linux?", a: ["Sì, ma l'importazione non sincronizza le due app. Pinto funziona solo su Mac e iPhone. Tieni Joplin se ti serve una libreria anche su Linux, Windows o Android."] },
  { q: "Devo lasciare Joplin per collegare Claude?", a: ["No. Joplin documenta un server MCP locale tramite Web Clipper, che può cercare e leggere note e, con gli strumenti abilitati, crearle o aggiornarle."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="alternative-joplin-mac"
  intro={<>Pinto Notes è un'alternativa a Joplin su Mac e iPhone se preferisci un editor simile a Note di Apple. Se usi Windows, Linux o Android, Joplin copre più dispositivi.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#scegliere", label: "Confronta le app" }, { href: "#restare", label: "Quando tenere Joplin" },
    { href: "#esportare", label: "Esporta e importa" }, { href: "#controllare", label: "Controlla le note" },
    { href: "#pinto", label: "Usa l'AI" },
  ]}><p>Importa prima un piccolo taccuino Joplin in Markdown e conserva un backup JEX separato. Entrambe le app possono dare accesso alle note a un'AI; confronta l'editor e il tipo di collegamento che preferisci.</p>
    <PostCta slug="it/alternative-joplin-mac" path="/it/blog/alternative-joplin-mac" position="answer" ui={ui.cta} title="Prova un taccuino Joplin in Pinto"><p>Scarica Pinto Notes gratis sul Mac e importa una cartella di file Markdown. Collega ChatGPT o Claude quando vuoi che legga e modifichi le note.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="scegliere">Confronta dispositivi ed editor</h2>
  <div className="tableWrap"><table><thead><tr><th scope="col">Ti serve</th><th scope="col">Joplin</th><th scope="col">Pinto Notes</th></tr></thead><tbody>
    <tr><th scope="row">Mac e iPhone</th><td>Disponibile</td><td>Disponibile</td></tr>
    <tr><th scope="row">Windows, Linux o Android</th><td>Disponibile</td><td>Nessuna app</td></tr>
    <tr><th scope="row">Scrittura</th><td>Editor Markdown e rich text</td><td>Simile a Note di Apple</td></tr>
    <tr><th scope="row">AI nelle note</th><td>MCP locale tramite Web Clipper</td><td>Collegamento ospitato per ChatGPT o Claude</td></tr>
  </tbody></table></div>
  <p>Joplin elenca le piattaforme nella <a href="https://joplinapp.org/help/install/">guida all'installazione</a>. Pinto non ha app Windows, Linux o Android né una versione web.</p>
  <h2 id="restare">Quando conviene tenere Joplin</h2>
  <p>Joplin offre editor <a href="https://joplinapp.org/help/apps/rich_text_editor/">Markdown e rich text</a>. Se non vuoi vedere i simboli Markdown, prova prima il secondo editor. Puoi anche scegliere tra servizi di <a href="https://joplinapp.org/help/apps/sync/">sincronizzazione</a> come Nextcloud, WebDAV e Dropbox. L'importazione in Pinto non trasferisce quella configurazione.</p>
  <p>Se usi <a href="https://joplinapp.org/help/apps/plugins/">plugin</a>, verifica cosa fanno: i file delle note non li portano con sé. Joplin offre anche un <a href="https://joplinapp.org/help/apps/ai_mcp/">server MCP</a> locale tramite Web Clipper. Può cercare e leggere le note e, quando abiliti gli strumenti necessari, crearle o aggiornarle. Provalo se vuoi soltanto collegare Claude.</p>
  <h2 id="esportare">Tieni JEX per Joplin, usa Markdown per Pinto</h2>
  <p>La <a href="https://joplinapp.org/help/apps/import_export/">guida Joplin</a> descrive JEX come backup con note e metadati da reimportare in Joplin. Conservane uno. Per Pinto prepara un'esportazione separata.</p>
  <Steps><li>Esporta un piccolo taccuino come Markdown + Front Matter in una cartella. Includi allegati e formattazione che usi spesso.</li><li>Tieni insieme la cartella e i file delle risorse. Apri un Markdown in un editor per verificare che contenga il testo.</li><li>Sul Mac, dal menu File di Pinto Notes scegli l'importazione Markdown o testo. Seleziona la cartella o uno ZIP e controlla il riepilogo.</li></Steps>
  <p>La <a href="https://joplinapp.org/help/dev/spec/interop_with_frontmatter/">guida al front matter</a> spiega titolo, date e tag. Pinto legge quei campi e aggiunge i tag come testo. Il percorso di <a href="/blog/import-your-notes">importazione Pinto</a> accetta cartelle e ZIP, trasforma le cartelle in cartelle e importa gli allegati collegati che trova. I file originali restano invariati. Non importa JEX.</p>
  <h2 id="controllare">Controlla le parti che usi</h2>
  <p>Confronta le copie con Joplin. Apri un link tra note e un allegato, oltre a verificare il numero di note.</p>
  <Keep title="Controlli dell'importazione Joplin" text={CHECK} note="Questa è una lista da usare, non un risultato di una prova sulla tua libreria." />
  <p>Plugin, allarmi delle attività, impostazioni e versioni precedenti di Joplin non sono garantiti da questo passaggio. Risolvi link e allegati mancanti prima di importare il resto.</p>
  <h2 id="pinto">Lavora con le note in Pinto</h2>
  <p>Pinto Notes funziona come Note di Apple su Mac e iPhone e conserva le versioni precedenti create lì, non quelle lasciate in Joplin. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> e scelto Allow, l'AI può leggere e modificare le note. Pinto usa un collegamento ospitato; quello documentato da Joplin è locale.</p>
  <p>Chiedi all'AI di trovare una nota importata, elencare il lavoro aperto e indicare le righe usate. Controlla la risposta prima di far aggiungere il prossimo passo. Usa il piccolo taccuino per qualche giorno anche su iPhone, poi valuta il resto, conservando l'esportazione originale.</p>
  </LocalPostPage>; }
