import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "app-note-programmatori");
// Italian version of /blog/notes-app-for-developers. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "app per programmatori" returned itself; "appunti per sviluppatori" and
// "note per programmatori" returned no suggestions. The title combines app, note and programmatori.
// Apple it-it/guide/notes/apd46c25187e/mac, apde615d29c2/mac and not201900c07/mac
// read 21 Nov 2026: Monostile (Maiuscole-Comando-M), Modifica > Aggiungi link,
// File > Esporta in and Modifica > Copia come Markdown. Other app facts follow English.
const ui = UI.it;
const FAQ = [
  { q: "Cosa serve in un'app di note per programmatori?", a: ["Controlla la formattazione del codice, l'esportazione Markdown, la ricerca e i link tra note. Se un agente deve usare gli appunti, decidi se accederà ai file locali, a una CLI o a un collegamento MCP."] },
  { q: "Quale app lascia leggere i file locali a un agente?", a: ["Obsidian salva la libreria come normali file Markdown. Un agente con accesso alla cartella può leggerli direttamente. Obsidian ha anche una CLI ufficiale che usa l'app in esecuzione."] },
  { q: "Posso usare Note di Apple per appunti di programmazione?", a: ["Sì, per spiegazioni, elenchi e frammenti brevi. Sul Mac, Maiuscole-Comando-M applica Monostile. Puoi collegare note ed esportarne una in Markdown, ma l'esportazione crea una copia separata."] },
  { q: "Gemini CLI funziona con Pinto Notes?", a: ["Sì. La guida MCP di Pinto Notes elenca Gemini CLI insieme a Claude Code e Codex. Dopo il collegamento e l'autorizzazione, l'agente può cercare, leggere e modificare le note."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="app-note-programmatori"
  intro={<>Scegli Obsidian se vuoi file Markdown locali da tenere in Git. Scegli Pinto Notes se vuoi un'app simile a Note di Apple su iPhone e Mac, con appunti che un agente di programmazione può leggere e modificare.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#confronto", label: "Le sei app" }, { href: "#controlli", label: "Cosa provare" },
    { href: "#obsidian", label: "File locali" }, { href: "#pinto", label: "Pinto Notes" },
    { href: "#modelli", label: "Modelli per sviluppatori" },
  ]}><p>Obsidian serve una libreria personale di file; Notion i documenti di progetto condivisi. Joplin offre taccuini Markdown e un'app da terminale. Bear collega note con frammenti di codice; Note di Apple raccoglie appunti veloci. Pinto Notes collega Claude Code, Codex e Gemini CLI alle note tramite un server MCP ospitato.</p>
    <PostCta slug="it/app-note-programmatori" path="/it/blog/app-note-programmatori" position="answer" ui={ui.cta} title="Appunti di progetto che l'agente può usare"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Aggiungi Code Block dal menu /, poi collega l'agente per leggere e modificare i tuoi file Markdown.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600} alt="Nota di standup in Pinto Notes sul Mac, con un blocco relativo a una chiave API di staging e voci di giovedì e venerdì." caption="Un esempio del modello Daily standup in Pinto Notes. Un agente collegato può preparare la sezione di ieri dai commit." />}
  faq={FAQ}>
  <h2 id="confronto">Sei app di note per programmatori</h2>
  <div className="tableWrap"><table><thead><tr><th>App</th><th>Codice e Markdown</th><th>Come uno strumento accede alle note</th></tr></thead><tbody>
    <tr><th>Obsidian</th><td>Blocchi di codice delimitati; file Markdown locali</td><td>Legge la cartella o usa la CLI ufficiale</td></tr>
    <tr><th>Notion</th><td>Blocchi di codice con scelta della lingua; esportazione Markdown</td><td>MCP ufficiale per cercare e modificare pagine</td></tr>
    <tr><th>Joplin</th><td>Editor Markdown con blocchi di codice</td><td>App da terminale o MCP locale ufficiale tramite Web Clipper</td></tr>
    <tr><th>Bear</th><td>Markdown, blocchi di codice ed esportazione .md</td><td>bearcli e MCP locale ufficiali sul Mac</td></tr>
    <tr><th>Note di Apple</th><td>Testo Monostile; esportazione Markdown sul Mac</td><td>Esporta o copia il Markdown</td></tr>
    <tr><th>Pinto Notes</th><td>Code Block nel menu /; note come file Markdown</td><td>MCP ospitato per Claude Code, Codex e Gemini CLI</td></tr>
  </tbody></table></div>
  <p>Le funzioni provengono dalle guide dei produttori consultate il 21 novembre 2026. I collegamenti sono documentati, non sono il risultato di prove pratiche su tutte le app.</p>
  <h2 id="controlli">Cosa provare prima di trasferire gli appunti</h2>
  <ul><li>Incolla un frammento reale e ricopialo nell'editor. Controlla rientri e punteggiatura.</li><li>Decidi se ti serve una cartella di file per Git o se basta esportare in Markdown.</li><li>Cerca un nome di funzione e parte di un errore, anche con la punteggiatura.</li><li>Collega una decisione al bug che l'ha motivata e verifica come ritrovi il percorso.</li><li>Chiedi all'agente di leggere una nota e cambiare una riga. Controlla il risultato e come annullarlo.</li></ul>
  <h2 id="obsidian">Obsidian per una libreria Markdown locale</h2>
  <p>La libreria di Obsidian è una normale cartella sul disco. Puoi tenere i file Markdown in Git o farli leggere a un agente. I blocchi di codice accettano il nome della lingua e i link collegano il frammento alla spiegazione. La ricerca si può limitare per file o percorso. La <a href="https://obsidian.md/help/cli">CLI ufficiale</a> cerca, legge, crea e aggiunge testo alle note. Richiede Obsidian in esecuzione; il primo comando lo avvia se necessario.</p>
  <h2 id="notion">Notion per i documenti di progetto condivisi</h2>
  <p>In Notion scrivi <code>/code</code> per aggiungere un blocco, scegli la lingua e usa Copy per riportare il frammento nell'editor. Le menzioni di pagine creano link di ritorno. La ricerca nello spazio di lavoro trova il testo delle pagine; quella nei database copre titoli e proprietà. L'<a href="https://developers.notion.com/guides/mcp/overview">MCP ufficiale</a> cerca, crea e modifica pagine e gestisce database. Puoi esportare le pagine in Markdown e i database in CSV; le modifiche correnti restano nello spazio di lavoro.</p>
  <h2 id="joplin">Joplin per taccuini Markdown e terminale</h2>
  <p>Joplin è open source. Ha un'app da terminale, un editor Markdown, blocchi di codice e link tra note. La ricerca filtra per taccuino e tag. Un prefisso <code>/</code> attiva la ricerca di base, che comprende la punteggiatura ma può essere più lenta. Il <a href="https://joplinapp.org/help/apps/ai_mcp/">server MCP locale ufficiale</a> richiede Web Clipper attivo e l'abilitazione del server e dei singoli strumenti. Le note stanno nel database Joplin; puoi esportarle in Markdown.</p>
  <h2 id="bear">Bear per spiegazioni collegate ai frammenti</h2>
  <p>Bear combina Markdown e blocchi di codice colorati per lingua. Scrivi <code>[[</code> per collegare una nota, anche a una sua intestazione. La <a href="https://bear.app/faq/command-line-interface/">CLI e il server MCP ufficiali</a> cercano, leggono e modificano le note in locale sul Mac. Bear le conserva in SQLite e può esportare file .md. Gli strumenti di automazione sono solo per Mac.</p>
  <h2 id="note-apple">Note di Apple per appunti veloci di progetto</h2>
  <p>Note va bene per un registro delle indagini, un elenco o un frammento breve con una spiegazione. La ricerca trova parole e le note in evidenza restano visibili. Sul Mac, Maiuscole-Comando-M applica Monostile. Scegli Modifica &gt; Aggiungi link per collegare note. La <a href="https://support.apple.com/it-it/guide/notes/not201900c07/mac">guida Apple</a> indica File &gt; Esporta in &gt; Markdown per una nota e Modifica &gt; Copia come Markdown per il testo selezionato. Puoi dare la copia a un agente; poi devi riportare tu le sue modifiche in Note.</p>
  <h2 id="pinto">Pinto Notes per note modificabili dall'agente</h2>
  <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Scrivi <code>/</code> all'inizio di una riga e scegli <strong>Code Block</strong>. Le note sono file Markdown, con percorsi come <code>Work/Decision log.md</code>. Gli agenti possono cercarle, leggerle e modificarle tramite il server MCP ospitato.</p>
  <p>La <a href="/blog/mcp-server">guida MCP</a> elenca Claude Code, Codex e Gemini CLI; la <a href="/blog/notes-in-claude-code-and-codex">guida per Claude Code e Codex</a> mostra il primo collegamento. Le modifiche AI mostrano cosa è cambiato, si possono annullare e ogni versione precedente resta nella cronologia. Pinto Notes è solo per iPhone e Mac, senza app Windows, Android o web.</p>
  <h2 id="modelli">Inizia con un modello per sviluppatori</h2>
  <p>Questi modelli gratuiti danno all'agente una struttura e istruzioni per mantenerla aggiornata.</p>
  <ul><li><a href="/templates/bug-triage">Bug triage</a> registra gravità e passi per riprodurre il problema. Le istruzioni per Claude Code chiedono anche di esaminare il codice per una causa probabile.</li><li><a href="/templates/daily-standup">Daily standup</a> ha una sezione per giorno lavorativo. L'agente prepara ieri dai commit, poi chiede cosa viene dopo e cosa è bloccato.</li><li><a href="/templates/decision-log">Decision log</a> registra contesto, opzioni e motivi. L'agente nomina i file interessati e controlla le decisioni passate.</li></ul>
  <p>La parte AI funziona dopo il collegamento dell'agente. Per ChatGPT o Claude, segui la <a href="/blog/connect-chatgpt-to-your-notes">guida</a>, in inglese. Puoi <a href="/blog/move-from-apple-notes">importare Note di Apple sul Mac</a> in una volta; l'originale non cambia.</p>
  </LocalPostPage>; }
