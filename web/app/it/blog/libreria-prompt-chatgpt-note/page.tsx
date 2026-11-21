import { PostCta } from "@/lib/PostCta";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "libreria-prompt-chatgpt-note");
// Italian version of /blog/chatgpt-prompt-library-in-notes. Autocomplete hl=it, gl=it,
// 21 Nov 2026: "libreria prompt chatgpt note" returned []; "libreria prompt chatgpt"
// suggested itself. Title combines that wording with Note for this workflow.
// Apple it-it read 21 Nov: notes/apd558a85438/mac (File > Nuova cartella),
// notes/apdb54e469b6/mac (File > In evidenza), notes/not9474646a9/4.13/mac/27
// (File > Duplica nota), and notes/not201900c07/mac (Markdown paste description).
// The localized guide did not give a Paste as Markdown menu name, so the step is described.
const ui = UI.it;
const TEMPLATE = `# Prompt: aggiornamento settimanale del progetto

Stato: da provare
Ultima prova: AAAA-MM-GG
Provato con: app e modello usati

## Quando usarlo
Trasformare appunti sparsi sul progetto in un aggiornamento per un collega.

## Prompt riutilizzabile
Scrivi un aggiornamento settimanale del progetto per [DESTINATARI] usando solo [APPUNTI].
Usa due intestazioni: Progressi e Prossimi passi.
Resta entro 150 parole. Scrivi frasi brevi.
Mantieni nomi e date così come sono. Non inventare scadenze.
Se manca un dettaglio necessario, chiedilo prima di scrivere.

## Esempio di input
Destinatari: gruppo di progettazione
Appunti: bozza della pagina iniziale completata. Revisione fissata per martedì.

## Esempio di risultato da confrontare
Progressi: la bozza della pagina iniziale è pronta.
Prossimi passi: rivedere la bozza martedì.

## Note sulla prova
Controlla che martedì resti martedì e che non compaiano nuove scadenze.
Sostituisci l'esempio con un risultato che hai verificato.
`;
const RETRIEVE = `Cerca nelle mie note di Pinto Notes "Prompt: aggiornamento settimanale del progetto" e leggi la nota.
Mostrami la sezione Prompt riutilizzabile prima di usarla.
Chiedimi i destinatari e gli appunti di questa settimana. Lascia invariato il prompt salvato.`;
const FAQ = [
  { q: "Come creo una libreria di prompt ChatGPT in Note?", a: ["Crea una cartella Prompt e salva un prompt riutilizzabile per nota. Scrivi a cosa serve, il testo da copiare e un risultato verificato. Cerca il nome dell'attività quando ti serve di nuovo."] },
  { q: "Cosa salvo insieme a un prompt riutilizzabile?", a: ["Salva un esempio di input, un risultato utile, la data e il modello provato. Annota le modifiche fatte quando un risultato non va bene. Tieni separate le istruzioni riutilizzabili dall'input di ogni prova."] },
  { q: "ChatGPT può recuperare un prompt in Pinto Notes?", a: ["Sì, dopo il collegamento e l'autorizzazione Allow. ChatGPT può cercare e leggere la nota. Chiedigli di mostrare le istruzioni salvate, poi fornisci l'input attuale. Allow concede anche la modifica."] },
  { q: "La libreria compila automaticamente le variabili?", a: ["No. Le parole tra parentesi quadre sono promemoria. Sostituiscile prima di incollare il prompt oppure chiedi a ChatGPT collegato di raccogliere i dati mancanti. Il modello è una normale nota che crei tu."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="libreria-prompt-chatgpt-note"
  intro={<>Salva ogni prompt ChatGPT riutilizzabile in una nota, con un nome chiaro e un risultato di esempio. In Note di Apple lo copi a mano. Se colleghi Pinto Notes, ChatGPT può cercare e leggere il prompt che gli indichi.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#modello", label: "Copiare il modello" }, { href: "#organizzare", label: "Organizzare" },
    { href: "#provare", label: "Provare le modifiche" }, { href: "#pinto", label: "Recuperare con ChatGPT" },
  ]}><p>Crea una cartella Prompt e salva una sola attività per nota. Separa le istruzioni riutilizzabili dai dati di ogni prova e conserva sotto un esempio controllato. Quando ti serve, copia le istruzioni in ChatGPT e aggiungi i dati aggiornati.</p>
    <PostCta slug="it/libreria-prompt-chatgpt-note" path="/it/blog/libreria-prompt-chatgpt-note" position="answer" ui={ui.cta} title="Chiedi a ChatGPT di trovare il prompt"><p>Pinto Notes somiglia a Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT può cercare una nota con il prompt e leggerne le istruzioni.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="modello">Una nota con prompt da copiare</h2>
  <p>Le istruzioni stanno sopra l'esempio, così puoi copiare solo la parte che ti serve. L'aggiornamento settimanale è un punto di partenza. Cambia l'attività e conserva le stesse sezioni per il prossimo prompt.</p>
  <Keep title="Nota per la libreria di prompt" text={TEMPLATE} note="Sul Mac con macOS 27, puoi incollare il Markdown in Note perché titoli e intestazioni siano formattati. Con l'incolla normale, i simboli Markdown restano testo." />
  <p>Sostituisci <code>[DESTINATARI]</code> e <code>[APPUNTI]</code> nel testo che invii a ChatGPT. Lasciali nella copia della libreria: ricordano quali dati cambiano ogni volta. Per usare il prompt, copia soltanto la sezione riutilizzabile con i valori aggiornati.</p>
  <h2 id="organizzare">Trova i prompt in base all'attività</h2>
  <p>In Note sul Mac scegli File &gt; Nuova cartella e chiamala Prompt. Dai a ogni nota il nome dell'attività, per esempio "Prompt: aggiornamento settimanale del progetto" o "Prompt: spiegare una modifica al codice". La ricerca trova anche le parole nel testo: includi quelle che ricorderai.</p>
  <p>Per un prompt frequente, seleziona la nota e scegli File &gt; In evidenza. Apple lo consente per le note iCloud aggiornate e per quelle conservate sul Mac. Tieni una nota per attività, così i risultati delle prove restano accanto alle istruzioni. La <a href="/blog/apple-notes-templates">guida ai modelli di Note</a> è in inglese.</p>
  <p>Per creare un nuovo prompt dal modello, scegli File &gt; Duplica nota sul Mac. Rinomina la copia ed elimina gli esempi precedenti prima di provarla. Usa stati semplici come "Da provare" e "Provato".</p>
  <h2 id="provare">Salva una prova che puoi controllare</h2>
  <p>La <a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt">guida di OpenAI ai prompt</a> consiglia istruzioni precise e contesto sufficiente, poi di leggere il risultato e correggere il prompt. La nota ti permette di registrare queste prove.</p>
  <ol><li>Usa il prompt con un esempio breve.</li><li>Confronta il risultato con l'input. Nell'esempio, martedì deve restare martedì e non deve comparire una scadenza nuova.</li><li>Se non va, cambia un'istruzione e riprova con lo stesso input.</li><li>Salva il risultato utile, la modifica, la data e il modello provato.</li></ol>
  <p>Prova un secondo input prima di segnare il prompt come provato. Un aggiornamento senza data di revisione verifica che non ne inventi una. Un risultato salvato serve a confrontare le prove future, non garantisce le risposte successive.</p>
  <h2 id="limiti">Cosa non fa questa libreria</h2>
  <p>Con Note di Apple cerchi la nota e copi tu le istruzioni. Le parole tra parentesi quadre sono testo normale: completale ogni volta e controlla la risposta. Salvare un prompt non programma un'esecuzione né lo inserisce nel browser.</p>
  <h2 id="pinto">Recupera un prompt salvato con ChatGPT</h2>
  <p>Puoi usare lo stesso modello come nota in Pinto Notes, un'app simile a Note di Apple per iPhone e Mac. Segui la <a href="/blog/connect-chatgpt-to-your-notes">guida al collegamento di ChatGPT</a> e scegli Allow in Pinto Notes. Il permesso consente a ChatGPT di leggere e modificare le note.</p>
  <Keep title="Chiedi un prompt salvato" text={RETRIEVE} note="Collega prima Pinto Notes. La richiesta fa leggere le istruzioni e chiede i dati nuovi." />
  <p>Verifica che ChatGPT abbia trovato la nota giusta prima di fornire i dettagli della settimana. Quando approvi una versione migliore del prompt, chiedigli di salvare nella nota le istruzioni riviste e l'esempio controllato. Pinto conserva le versioni precedenti.</p>
  <p>Gestisci tu la libreria e decidi quando recuperare o tenere una revisione. Se è già in Note di Apple, puoi <a href="/blog/move-from-apple-notes">importarla sul Mac</a>. Gli originali restano invariati. La guida è in inglese.</p>
  </LocalPostPage>; }
