import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "spostare-google-keep-su-note-iphone");
// Italian version of /blog/google-keep-to-apple-notes. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "google keep note apple importare" and "spostare google keep su note iphone"
// returned no suggestions. The title uses the ordinary task phrase, not a fabricated search claim.
// Apple it-it read 21 Nov: 102223 and notes/not201900c07/mac (File > Importa in Note, Note importate),
// iphone/iph7262fd4fe/ios (account Note), iphone/iph1ac0b3a2/ios (elenco di controllo).
// Google Takeout and Keep facts follow English. Its page did not name file types; HTML/JSON are from
// Pinto Notes' importer and readers are asked to inspect their own download.
const ui = UI.it;
const FAQ = [
  { q: "Note di Apple importa Google Keep?", a: ["Non direttamente. Sul Mac puoi importare i file HTML di un download Google Takeout con File > Importa in Note. Su iPhone, per poche note, copia e incolla."] },
  { q: "Google Keep si sincronizza con Note?", a: ["No. Aggiungere Google tra gli account di Note non porta le note di Keep: sono due raccolte diverse."] },
  { q: "Takeout elimina le note da Keep?", a: ["No, crea una copia da scaricare. Le note già eliminate non compaiono nel download."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="spostare-google-keep-su-note-iphone"
  intro={<>Google Keep e Note di Apple non si sincronizzano. Puoi spostare poche note copiandole, oppure scaricare l'archivio di Keep e importare i file su un Mac.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#prima", label: "Prima di iniziare" }, { href: "#poche", label: "Poche note" },
    { href: "#tutte", label: "Tutte le note" }, { href: "#arriva", label: "Cosa arriva" },
    { href: "#gmail", label: "Gmail e sincronizzazione" }, { href: "#pinto", label: "Pinto Notes" },
  ]}><p>Per poche note, copia il testo da Keep e incollalo in Note. Per tutte, usa Google Takeout, apri il download sul Mac e importa i file HTML con File &gt; Importa in Note. Etichette, colori e promemoria non diventano automaticamente cartelle, tag o avvisi in Note.</p>
    <PostCta slug="it/spostare-google-keep-su-note-iphone" path="/it/blog/spostare-google-keep-su-note-iphone" position="answer" ui={ui.cta} title="Vuoi importare Keep senza scegliere i file uno per uno?"><p>Pinto Notes importa il download completo sul Mac. Può trasformare le etichette in cartelle o tag e mantiene elenchi, voci spuntate e immagini.</p></PostCta>
  </Answer>}
  faq={FAQ}>
  <h2 id="prima">Prima di iniziare</h2>
  <p>Keep usa etichette e colori; Note usa cartelle e tag. Prova prima una nota con elenco, immagine ed etichetta. Controlla anche l'Archivio di Keep. Tieni Keep com'è finché non hai verificato il risultato.</p>
  <h2 id="poche">Poche note: copia e incolla</h2>
  <Steps><li>Apri la nota in Keep e copia il testo.</li><li>Crea una nota in Note e incolla il testo. Metti il titolo sulla prima riga: Note lo usa come titolo della nota.</li><li>Se le voci dell'elenco arrivano come righe normali, selezionale e tocca il pulsante per l'elenco di controllo. Salva a parte le immagini che non sono arrivate.</li></Steps>
  <p>Funziona anche su iPhone ed è pratico per poche decine di note. Per centinaia diventa un lavoro lungo.</p>
  <h2 id="tutte">Tutte le note: Google Takeout e un Mac</h2>
  <Steps><li>Su takeout.google.com seleziona soltanto Keep e richiedi il download. Google offre un link via email e un archivio ZIP o TGZ.</li><li>Quando arriva, scarica e apri l'archivio sul Mac. Google indica un'attesa da pochi minuti a qualche giorno; il link scade dopo circa sette giorni e il download si può ripetere cinque volte.</li><li>Apri la cartella Takeout/Keep. Nei download letti dall'importatore di Pinto Notes c'è un file HTML e uno JSON per nota; verifica il contenuto del tuo archivio.</li><li>In Note seleziona una cartella iCloud, poi File &gt; Importa in Note. Scegli i file HTML, fai clic su Importa e conferma. Le note arrivano in Note importate.</li></Steps>
  <Paths rows={[{ on: "Note sul Mac", steps: ["File", "Importa in Note"] }]} />
  <p>Apple elenca HTML tra i formati importabili, non JSON. Google non specifica i tipi di file nella sua guida a Takeout. Su iPhone Apple descrive la condivisione di un file dall'app File verso Note, uno alla volta; per una raccolta intera il Mac è più comodo.</p>
  <h2 id="arriva">Cosa arriva</h2>
  <div className="tableWrap"><table><thead><tr><th>Da Keep</th><th>In Note</th></tr></thead><tbody>
    <tr><th>Testo</th><td>Arriva con copia o HTML</td></tr><tr><th>Elenchi</th><td>Controlla una nota di prova; potrebbero essere righe semplici</td></tr>
    <tr><th>Immagini</th><td>Controlla una nota di prova o aggiungile a mano</td></tr><tr><th>Etichette</th><td>Non diventano tag o cartelle</td></tr>
    <tr><th>Colori e promemoria</th><td>Non arrivano come funzioni di Note</td></tr>
  </tbody></table></div>
  <p>Per ricreare un'etichetta, sposta le note in una cartella oppure scrivi un tag come #ricette in ognuna. Una cartella smart può raccoglierle. <a href="/blog/apple-notes-tags-smart-folders">La guida ai tag</a> è in inglese.</p>
  <h2 id="gmail">Gmail non collega Keep a Note</h2>
  <p>Note può usare un account Google per sincronizzare le proprie note tramite quell'account, ma Keep non le mostra. Anche le note di Keep restano fuori da Note. Le funzioni di Note possono essere limitate negli account diversi da iCloud o da quello locale. Se vuoi scegliere tra le due app, leggi <a href="/it/blog/google-keep-vs-note-apple">Google Keep o Note di Apple</a>.</p>
  <h2 id="pinto">Importare Keep in Pinto Notes</h2>
  <PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} maxWidth={640} kind="plain" alt="Guida all'importazione di Google Keep in Pinto Notes sul Mac, con Keep selezionato in Google Takeout." caption="Pinto Notes guida il download di Keep e importa l'archivio sul Mac." />
  <p>Dal menu File di Pinto Notes sul Mac scegli l'importazione da Google Keep e consegna l'archivio Takeout. Le etichette possono diventare cartelle o tag, gli elenchi mantengono le spunte, le note fissate restano tali e le immagini arrivano. Le note archiviate entrano solo se selezioni l'opzione; cestino, colori, disegni e promemoria non arrivano. Il riepilogo segnala le perdite. Dopo l'importazione puoi collegare ChatGPT o Claude; Pinto Notes conserva le versioni precedenti. Funziona su iPhone e Mac, non su Android o Windows.</p>
  <p>Altre guide: <a href="/blog/move-apple-notes-to-obsidian-notion-keep">uscire da Note di Apple</a> (in inglese), <a href="/blog/import-your-notes">i formati di importazione</a> (in inglese), <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
