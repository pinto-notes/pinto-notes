import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "alternative-obsidian-mac");
// Italian version of /blog/obsidian-alternative-for-mac. Autocomplete hl=it, gl=it, 21 Nov 2026:
// "alternative a obsidian mac" returned []; "alternative obsidian" suggested itself,
// "alternative obsidian open source" and "alternative obsidian sync". Title adds Mac for this article.
// Apple it-it read 21 Nov: notes/not201900c07/mac, including File > Importa Markdown,
// Opzioni, and Conserva la struttura della cartella durante l’importazione.
// Bear and Joplin menu names in Italian were not verified; their steps are described.
const ui = UI.it;
const CHECK = `Prima di spostare un archivio Obsidian
- Conserva una copia di tutta la cartella, con allegati e impostazioni nascoste.
- Apri una nota con una foto e controlla che sia arrivata.
- Segui un link tra note, anche verso una sottocartella.
- Controlla le note incorporate e i contenuti generati dai plugin.
- Cerca una nota di cui ricordi il titolo.
- Apri le note importate su iPhone, se lo usi.
- Apri un file Markdown esportato in un altro editor prima di cambiare app.`;
const FAQ = [
  { q: "Quale app per Mac importa un archivio Obsidian?", a: ["Pinto Notes importa sottocartelle, immagini e link tra note. Bear importa cartelle Markdown con allegati; Joplin importa directory Markdown come taccuini; Note di Apple importa cartelle Markdown. Controlla sempre il risultato."] },
  { q: "Pinto modifica la stessa cartella che uso in Obsidian?", a: ["No. Pinto importa una copia nel proprio archivio e lascia intatta la cartella originale. Non la sincronizza. Puoi esportare la libreria Pinto come file Markdown in uno ZIP separato."] },
  { q: "Cosa succede alle note incorporate di Obsidian?", a: ["Diventano link alle note. Le immagini e gli altri file collegati arrivano come allegati. Pinto salta la cartella delle impostazioni .obsidian, quindi non trasferisce la configurazione dei plugin."] },
  { q: "Quale alternativa funziona anche su Android?", a: ["Joplin funziona su Mac e Android, supporta Markdown e offre più servizi di sincronizzazione. Pinto Notes è solo per iPhone e Mac. Se vuoi continuare a modificare la stessa cartella locale, puoi restare con Obsidian."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="alternative-obsidian-mac"
  intro={<>Pinto Notes può sostituire Obsidian sul Mac se cerchi l'interfaccia di Note di Apple e vuoi importare il tuo archivio. Bear punta su Markdown e tag, Note di Apple sugli appunti quotidiani, Joplin sui taccuini open source.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#scegliere", label: "Scegliere un'app" }, { href: "#restare", label: "Tenere Obsidian" },
    { href: "#pinto", label: "Spostare l'archivio" }, { href: "#controllare", label: "Controllare l'importazione" },
  ]}><p>Pinto Notes importa un archivio Obsidian con sottocartelle, foto e link tra note. Tieni Obsidian se devi modificare la stessa cartella del Finder con altri strumenti o usi spesso grafo, Canvas o plugin.</p>
    <PostCta slug="it/alternative-obsidian-mac" path="/it/blog/alternative-obsidian-mac" position="answer" ui={ui.cta} title="Porta il tuo archivio in Pinto Notes"><p>Importa le note sul Mac e leggile anche su iPhone. Puoi collegare ChatGPT o Claude per farle leggere e modificare.</p></PostCta>
  </Answer>} hero={<PostFigure priority src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Pinto Notes trova sul Mac l'archivio Second brain con 27 note e conferma l'importazione da Obsidian." caption="Un archivio Obsidian importato in Pinto Notes sul Mac. La cartella originale resta al suo posto. Immagine: Pinto Notes." />} faq={FAQ}>
  <h2 id="scegliere">Scegli in base a ciò che vuoi cambiare</h2>
  <p>Parti da quello che non ti serve più in Obsidian. Se vuoi solo un editor diverso, prova con poche note. Se vuoi cambiare anche l'organizzazione, importa prima una cartella piccola.</p>
  <ul><li><strong>Pinto Notes:</strong> interfaccia simile a Note di Apple, importazione da Obsidian e accesso per ChatGPT o Claude collegati. Solo iPhone e Mac.</li><li><strong>Note di Apple:</strong> cartelle, elenchi di controllo e ricerca per gli appunti quotidiani.</li><li><strong>Bear:</strong> Markdown, tag e tabelle. La sincronizzazione iCloud richiede Pro.</li><li><strong>Joplin:</strong> taccuini e note Markdown offline in un'app open source, disponibile anche per Windows, Linux e Android.</li></ul>
  <p>Note di Apple importa cartelle Markdown. Sul Mac scegli File &gt; Importa Markdown, poi la cartella. Se necessario apri Opzioni e seleziona "Conserva la struttura della cartella durante l’importazione". Controlla foto e <code>[[link]]</code>: la <a href="https://support.apple.com/it-it/guide/notes/not201900c07/mac">guida Apple</a> non promette di ricreare tutto l'archivio Obsidian. Leggi il <a href="/it/blog/obsidian-vs-note-apple">confronto tra Obsidian e Note</a>.</p>
  <p>Bear documenta l'importazione di cartelle Markdown con allegati referenziati, anche nelle sottocartelle. Leggi la sua <a href="https://bear.app/faq/import-your-notes/">guida</a> se vuoi organizzare la scrittura con i tag.</p>
  <p><a href="https://joplinapp.org/help/">Joplin</a> importa una directory Markdown mantenendo le cartelle come taccuini e sottotaccuini. Consulta le <a href="https://joplinapp.org/help/apps/import_export/">istruzioni</a>. Puoi scegliere un <a href="https://joplinapp.org/help/apps/sync/">servizio di sincronizzazione</a>, tra cui Dropbox o Nextcloud.</p>
  <h2 id="restare">Quando conviene tenere Obsidian</h2>
  <p>Un <a href="https://obsidian.md/help/data-storage">archivio Obsidian</a> è una cartella locale di file Markdown. Anche altri editor possono modificarli e Obsidian rileva i cambiamenti. Se lavori così con script o altri editor, importare copie cambia il tuo metodo di lavoro.</p>
  <p>Obsidian offre grafo, Canvas e plugin della community. I risultati generati da un plugin richiedono più del testo Markdown. Se dipendi da quelle funzioni, tieni Obsidian o salva i risultati necessari come testo nelle note. Le trovi nella <a href="https://obsidian.md/">pagina delle funzioni</a>.</p>
  <p>Se vuoi soltanto l'accesso dell'AI, leggi prima la <a href="/blog/obsidian-mcp">guida a Obsidian MCP</a>, in inglese. Potresti continuare con il tuo archivio.</p>
  <h2 id="pinto">Spostare un archivio Obsidian in Pinto Notes</h2>
  <p>Pinto Notes somiglia a Note di Apple su iPhone e Mac e conserva ogni versione precedente di una nota. Importa una copia nell'archivio interno: le modifiche successive in Pinto e Obsidian restano separate. Non ha app per Windows o Android né una versione web.</p>
  <ol><li>Fai una copia di tutta la cartella Obsidian, foto e allegati compresi.</li><li>Sul Mac, apri il menu File di Pinto Notes e scegli l'importazione da Obsidian.</li><li>Conferma la cartella trovata da Pinto oppure scegline un'altra.</li><li>Importa, poi apri alcune note e segui i link prima di cambiare app per il lavoro quotidiano.</li></ol>
  <p>Arrivano sottocartelle, foto e link tra note. L'archivio originale rimane dov'è. Una nota incorporata diventa un link. Pinto salta la cartella nascosta <code>.obsidian</code>, quindi non porta con sé plugin e Canvas. La <a href="/blog/import-your-notes">guida all'importazione</a> è in inglese.</p>
  <p>Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a>, puoi chiedergli di leggere una nota di progetto e aggiungere un riepilogo sotto un'intestazione. Controlla il risultato; la versione precedente resta nella cronologia.</p>
  <p>Puoi esportare la libreria come ZIP di file Markdown in cartelle, con allegati e link riscritti per le copie esportate. Apri prima le note protette con password, Face ID o Touch ID e controlla nel resoconto i file non scaricati. L'esportazione non sincronizza le modifiche con l'archivio Obsidian originale.</p>
  <h2 id="controllare">Controlla l'importazione prima di spostare tutto</h2>
  <p>Prova una cartella con due note collegate e una foto. Se usi plugin, includi una nota che ne dipende. Confronta la copia con l'originale.</p>
  <Keep title="Controlli per spostare l'archivio" text={CHECK} />
  <p>Conserva archivio originale e copia di sicurezza finché non hai controllato l'importazione e aperto un'esportazione. Poi scegli in quale app scrivere le nuove modifiche.</p>
  </LocalPostPage>; }
