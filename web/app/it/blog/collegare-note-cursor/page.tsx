import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "collegare-note-cursor");
// Italian version of /blog/connect-notes-to-cursor. Autocomplete hl=it, gl=it,
// 21 Nov 2026: "collegare note a cursor" and "cursor note mcp" returned [].
// Title names the task directly; no autocomplete demand inferred. No Apple menu names occur.
// Commands, configuration, install link and MCP_URL import match the English post.
const ui = UI.it;
const CONFIG = JSON.stringify({ mcpServers: { "pinto-notes": { url: MCP_URL } } }, null, 2);
const CURSOR_INSTALL = "cursor://anysphere.cursor-deeplink/mcp/install?" + new URLSearchParams({
  name: "pinto-notes",
  config: Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64"),
}).toString();
const BRIEF = `Ricerca nel sito

Obiettivo: permettere ai visitatori di cercare negli articoli di assistenza pubblicati.
Prima versione: cercare nei titoli e mostrare i link corrispondenti.
Da mantenere: l'impaginazione attuale della pagina di assistenza.
Da escludere: ricerca negli allegati.
Domanda aperta: mostrare i risultati durante la digitazione o dopo il clic su Cerca?

Decisioni
Nessuna decisione sull'implementazione.

Prossimo passo
Controllare come vengono caricati gli articoli di assistenza.`;
const READ_PROMPT = `Cerca nelle mie note di Pinto Notes "Ricerca nel sito" e leggi la nota completa. Dimmi l'obiettivo, cosa è escluso dalla prima versione e quale domanda è ancora aperta. Non modificare la nota né il codice.`;
const UPDATE_PROMPT = `Rileggi "Ricerca nel sito" in Pinto Notes. Sotto Decisioni, sostituisci "Nessuna decisione sull'implementazione." con "Mostrare i risultati dopo il clic su Cerca." Sostituisci il testo sotto Prossimo passo con "Aggiungere un campo di ricerca e un pulsante usando l'impaginazione attuale della pagina di assistenza." Lascia invariato il resto. Mostrami le modifiche.`;
const FAQ = [
  { q: "Come collego Pinto Notes a Cursor?", a: ["Sul Mac apri il link per aggiungere Pinto Notes a Cursor, conferma il server, accedi e scegli Allow quando Pinto Notes lo chiede. Cursor potrà leggere e modificare le note."] },
  { q: "Dove salva Cursor la configurazione MCP?", a: ["Cursor usa .cursor/mcp.json per un progetto e ~/.cursor/mcp.json per tutti i progetti. Se hai già altri server, aggiungi pinto-notes all'oggetto mcpServers esistente."] },
  { q: "Cursor può aggiornare una nota scritta su iPhone?", a: ["Sì. Tieni la nota in Pinto Notes, collega Cursor allo stesso account e chiedigli di leggerla prima di modificarla. Aprila poi in Pinto Notes per controllare il risultato."] },
  { q: "Il collegamento include anche Note di Apple?", a: ["No. Cursor accede al tuo account Pinto Notes. Per portare le note di Apple in Pinto, importale sul Mac. Gli originali restano invariati."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="collegare-note-cursor"
  intro={<>Collega Pinto Notes a Cursor tramite MCP, accedi e scegli Allow. Cursor potrà leggere una nota di progetto scritta su iPhone e aggiornarla mentre lavori sul Mac.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#collegare", label: "Collegare Cursor" }, { href: "#manuale", label: "Configurazione manuale" },
    { href: "#progetto", label: "Provare una nota" }, { href: "#problemi", label: "Se non funziona" },
  ]}><p>Sul Mac usa il link qui sotto per aggiungere Pinto Notes a Cursor. Completa l'accesso e scegli Allow. Questa autorizzazione permette a Cursor sia di leggere sia di modificare le note. Inizia chiedendogli di leggere una nota con un titolo preciso.</p>
    <PostCta slug="it/collegare-note-cursor" path="/it/blog/collegare-note-cursor" position="answer" ui={ui.cta} title="Porta la nota di progetto in Cursor"><p>Scrivi la nota in Pinto Notes su iPhone. Cursor potrà leggerla e registrare una decisione dopo che l'avrai presa.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="collegare">Collega Cursor sul Mac</h2>
  <p>Ti servono Cursor installato sul Mac e un account Pinto Notes. Questa guida collega Cursor a quell'account. Pinto Notes funziona su iPhone e Mac, senza app Windows o Android né versione web.</p>
  <ol><li><a href={CURSOR_INSTALL}>Aggiungi Pinto Notes a Cursor</a>. Il link compila l'indirizzo del server.</li><li>Conferma il server in Cursor e segui le istruzioni per accedere.</li><li>Quando Pinto Notes lo chiede, scegli Allow. L'autorizzazione consente lettura e modifica.</li></ol>
  <p>Il link usa la stessa configurazione di installazione di Pinto Notes. La <a href="https://cursor.com/docs/mcp">guida MCP di Cursor</a> descrive i server remoti e l'accesso nel browser. Questa guida si basa sulla documentazione e sul codice del link; non è stata provata una connessione reale in Cursor.</p>
  <h2 id="manuale">Aggiungi il server manualmente</h2>
  <p>Cursor supporta <code>.cursor/mcp.json</code> per un progetto e <code>~/.cursor/mcp.json</code> per tutti i progetti. Aggiungi la configurazione. Se il file contiene già server, inserisci la voce <code>pinto-notes</code> nell'oggetto <code>mcpServers</code> esistente.</p>
  <Keep title="Configurazione MCP di Pinto Notes" text={CONFIG} code />
  <p>Attiva il server nell'area Customize di Cursor, poi completa l'accesso e scegli Allow. La <a href="/blog/mcp-server">guida al server MCP di Pinto Notes</a> spiega strumenti e permessi.</p>
  <h2 id="progetto">Leggi una nota scritta sul telefono</h2>
  <p>Prima di aprire il codice, scrivi in Pinto Notes su iPhone cosa deve fare la modifica e cosa può aspettare. Ecco un esempio da adattare al tuo progetto.</p>
  <Keep title="Esempio di nota di progetto" text={BRIEF} />
  <p>Su Cursor nel Mac, chiedi di trovare la nota:</p>
  <Keep title="Verifica che Cursor legga la nota" text={READ_PROMPT} />
  <p>Controlla anche il risultato dello strumento. Deve mostrare la nota reale e la domanda sui risultati della ricerca. Una risposta generica non prova che Cursor l'abbia letta.</p>
  <h2 id="aggiornare">Salva una decisione nella stessa nota</h2>
  <p>Dopo aver deciso come deve funzionare la ricerca, chiedi a Cursor di aggiornare la nota. Indica la decisione nel messaggio. Nell'esempio, i risultati compaiono dopo il clic su Cerca.</p>
  <Keep title="Registra decisione e prossimo passo" text={UPDATE_PROMPT} />
  <p>Lo strumento di modifica di Pinto richiede che l'agente legga la nota prima di cambiarla. Aprila poi in Pinto Notes e controlla. Le versioni precedenti restano disponibili. Sii preciso quando vuoi cambiare una sola sezione.</p>
  <h2 id="problemi">Se Cursor non trova le note</h2>
  <p>Controlla che l'accesso sia terminato per l'account Pinto Notes giusto. In Cursor verifica che il server sia attivo in Customize. Per errori di connessione apri Output e seleziona MCP Logs. Per impostazione predefinita, Cursor chiede conferma prima di usare gli strumenti.</p>
  <p>Ripeti prima la richiesta di lettura. Se più note hanno titoli simili, indica il titolo esatto e chiedi a Cursor di mostrare la nota trovata. Non usare un riepilogo inventato come requisito del progetto.</p>
  <h2 id="pinto">Tieni le decisioni accanto alla richiesta</h2>
  <p>Usa la stessa nota per la richiesta raccolta sul telefono e le decisioni prese mentre programmi. Chiedi esplicitamente a Cursor di aggiornarla quando cambia qualcosa.</p>
  <p>Se usi altri agenti, la <a href="/blog/notes-in-claude-code-and-codex">guida per Claude Code e Codex</a> spiega come collegarli. Puoi anche <a href="/blog/move-from-apple-notes">importare Note di Apple</a> sul Mac senza cambiarle. Le guide sono in inglese.</p>
  </LocalPostPage>; }
