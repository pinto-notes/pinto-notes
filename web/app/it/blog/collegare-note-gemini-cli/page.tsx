import { PostCta } from "@/lib/PostCta";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "collegare-note-gemini-cli");
// Italian version of /blog/connect-notes-to-gemini-cli. Autocomplete hl=it, gl=it,
// 21 Nov 2026: "collegare note a gemini cli" returned []; "gemini cli note" suggested
// NotebookLM-related queries and release notes, not this connection. No demand inferred.
// No Apple menu names occur. Commands, extension URL and MCP_URL import match English.
const ui = UI.it;
const ADD = `gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const EXTENSION = "gemini extensions install https://github.com/pinto-notes/pinto-notes";
const BRIEF = `Correzione del modulo di contatto

Mostrare una conferma chiara dopo l'invio di un messaggio.
Lasciare l'indirizzo email nel modulo se l'invio non riesce.

Risultati della sessione
`;
const READ = `Trova in Pinto Notes la nota "Correzione del modulo di contatto" e leggila.
Dimmi i requisiti prima di modificare il codice.
Se trovi più note con quel titolo, mostrami i percorsi e chiedimi quale usare.`;
const SAVE = `Rileggi "Correzione del modulo di contatto" in Pinto Notes.
Sotto "Risultati della sessione", aggiungi la data di oggi, le modifiche fatte e i controlli eseguiti davvero.
Indica chiaramente quali controlli non abbiamo eseguito. Lascia invariati i requisiti e le voci precedenti.
Alla fine mostrami il percorso della nota.`;
const FAQ = [
  { q: "Quale comando collega Pinto Notes a Gemini CLI?", a: [`Esegui gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}. Avvia Gemini CLI, usa /mcp auth pinto-notes e autorizza il collegamento in Pinto Notes sul Mac.`] },
  { q: "Come verifico gli strumenti delle note?", a: ["Digita /mcp in Gemini CLI per vedere il server e gli strumenti. Poi chiedigli di cercare una nota con il titolo esatto e leggerla. Confronta la risposta con la nota in Pinto Notes."] },
  { q: "Gemini CLI può aggiungere il risultato a una nota su iPhone?", a: ["Dopo il collegamento e l'autorizzazione può cercare, leggere e modificare le note Pinto. Chiedigli prima di leggere la nota, poi di aggiungere il risultato sotto un'intestazione. La nota si sincronizza tra iPhone e Mac."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="collegare-note-gemini-cli"
  intro={<>Collega Gemini CLI a Pinto Notes tramite MCP, accedi e autorizzalo sul Mac. Potrà leggere una nota scritta su iPhone e aggiungere il risultato della sessione alla stessa nota.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#collegare", label: "Collegare" }, { href: "#leggere", label: "Leggere una nota" },
    { href: "#salvare", label: "Salvare il risultato" }, { href: "#controllare", label: "Controllare la connessione" },
  ]}><p>Esegui <code>gemini mcp add --scope user --transport http pinto-notes {MCP_URL}</code>, poi accedi con <code>/mcp auth pinto-notes</code> dentro Gemini CLI. In Pinto Notes sul Mac scegli Allow: concedi sia la lettura sia la modifica delle note.</p>
    <PostCta slug="it/collegare-note-gemini-cli" path="/it/blog/collegare-note-gemini-cli" position="answer" ui={ui.cta} title="Porta gli appunti di progetto in Gemini CLI"><p>Pinto Notes si scarica gratis sul Mac. Scrivi una nota su iPhone, falla leggere a Gemini CLI e salva lì il risultato.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="collegare">Collega Gemini CLI sul Mac</h2>
  <p>Questi passi sono per Gemini CLI nel Terminale del Mac. Installa Pinto Notes e accedi. Ti serve anche Gemini CLI installato.</p>
  <Keep title="Aggiungi il server delle note" text={ADD} code note="Esegui nel Terminale. Con l'ambito utente, il collegamento è disponibile in tutti i progetti." />
  <p>Avvia Gemini CLI con <code>gemini</code>, poi inserisci nella sessione:</p>
  <Keep title="Accedi a Pinto Notes" text="/mcp auth pinto-notes" code note="Completa l'accesso nel browser, poi scegli Allow quando Pinto Notes lo chiede sul Mac." />
  <p>Google documenta comando HTTP e accesso nella <a href="https://geminicli.com/docs/tools/mcp-server/" rel="noopener">guida MCP di Gemini CLI</a>. Questi passi seguono la documentazione; per l'articolo non è stata provata una connessione reale.</p>
  <p>Preferisci un'estensione? Il README di Pinto dà questo comando alternativo:</p>
  <Keep title="Alternativa: installa l'estensione Pinto" text={EXTENSION} code note="Scegli questa strada oppure il comando diretto. Le richieste qui sotto valgono per entrambe." />
  <p>Google spiega come <a href="https://geminicli.com/docs/extensions/" rel="noopener">installare estensioni da GitHub</a>. Con questa strada, usa <code>/mcp</code> per trovare il nome del server e poi <code>/mcp auth</code> per accedere.</p>
  <h2 id="leggere">Leggi una nota salvata su iPhone</h2>
  <p>Crea in Pinto Notes su iPhone una nota chiamata "Correzione del modulo di contatto". Puoi copiare questo esempio o usare il tuo progetto.</p>
  <Keep title="Esempio di nota in Pinto Notes" text={BRIEF} />
  <p>Sul Mac chiedi a Gemini CLI di trovare quella nota. Il titolo preciso aiuta a controllare che sia la nota giusta.</p>
  <Keep title="Leggi la nota prima di lavorare" text={READ} />
  <p>Cerca una chiamata <code>search</code> di Pinto seguita da <code>fetch</code>. Confronta la risposta con i due requisiti. Ripetere la richiesta non dimostra che Gemini abbia letto la nota.</p>
  <h2 id="salvare">Aggiungi il risultato alla stessa nota</h2>
  <p>Alla fine della sessione di lavoro, chiedi a Gemini CLI di registrare ciò che è successo davvero. Lascia i requisiti sopra i risultati, così la prossima sessione troverà entrambi.</p>
  <Keep title="Salva il risultato della sessione" text={SAVE} />
  <p>Lo strumento <code>edit</code> di Pinto cambia testo corrispondente in una nota già letta. Chiedi di aggiungere il risultato sotto un'intestazione, poi controlla la nota. La versione precedente resta nella cronologia e puoi annullare le modifiche dell'AI.</p>
  <p>Apri la stessa nota su iPhone e leggi la voce nuova. Se un controllo è fallito o è stato saltato, conservalo nella nota per la prossima sessione.</p>
  <h2 id="controllare">Se il collegamento non funziona</h2>
  <p>Digita <code>/mcp</code> in Gemini CLI per vedere server e strumenti, oppure esegui <code>gemini mcp list</code> nel Terminale. Se devi accedere, usa <code>/mcp auth pinto-notes</code> per il collegamento diretto. Per l'estensione usa il nome mostrato nell'elenco.</p>
  <p>Completa l'autorizzazione di Pinto prima di cercare una nota. Allow copre lettura e modifica. Se trovi più note con lo stesso titolo, chiedi i percorsi e scegli quella giusta prima di modificare.</p>
  <p>La <a href="/blog/mcp-server">guida al server MCP</a> elenca gli strumenti. La <a href="/blog/notes-in-claude-code-and-codex">guida per Claude Code e Codex</a> dà i comandi per altri agenti. Sono in inglese.</p>
  <h2 id="pinto">Tieni insieme nota e risultato</h2>
  <p>Pinto Notes somiglia a Note di Apple su iPhone e Mac. Puoi scrivere la nota, farla modificare a un'AI autorizzata e tornare a una versione precedente.</p>
  <p>Se le note sono in Note di Apple, puoi <a href="/blog/move-from-apple-notes">importarle sul Mac</a> in un unico passaggio. Gli originali restano invariati. La guida è in inglese.</p>
  </LocalPostPage>; }
