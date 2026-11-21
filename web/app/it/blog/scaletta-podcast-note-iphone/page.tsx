import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "scaletta-podcast-note-iphone");
// Italian version of /blog/apple-notes-podcast-planner-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "piano podcast modello" returned [];
// "scaletta podcast" suggested that exact phrase and "fuori scaletta podcast".
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd93c815aa0/mac, apd0a136b9cc/mac and it-it/guide/iphone/iph1ac0b3a2/ios.
// Direct Mac opens returned 429; indexed Apple text and Italian pilot verify labels.
// No picture in English.
const ui = UI.it;
const TEMPLATE = `Il banco delle riparazioni 12: la prima visita a un caffè delle riparazioni

Fase: preparazione
Prossimo passo: Bea manda le domande a Mina e conferma il permesso di registrare e pubblicare.
Registrazione: 24 novembre 2026, ore 10:00, ora italiana
Durata prevista: 18 minuti

Cosa promettiamo a chi ascolta
Aiutare chi viene per la prima volta a decidere cosa portare e cosa aspettarsi.

Ospite e informazioni
Mina Rossi, coordinatrice volontaria del caffè delle riparazioni di via Olmo, esempio fittizio.
Pronuncia del nome: confermare prima della registrazione.
Permesso di registrare e pubblicare: in attesa di conferma.
Informazioni date da Mina il 20 novembre: i visitatori prenotano un turno e portano un oggetto.
Link pubblico per prenotare: chiedere a Mina e controllare prima di pubblicare.

Frase iniziale
Hai una giacca strappata e hai prenotato un turno. Cosa succede quando entri?

Scaletta, minuti indicativi
1 minuto: apertura e presentazione dell'ospite.
4 minuti: prenotazione e scelta dell'oggetto da portare.
6 minuti: seguiamo una giacca strappata durante la visita, con un racconto di Mina.
5 minuti: cosa succede se i volontari non finiscono la riparazione?
2 minuti: riepilogo e una cosa da fare prima della prima visita.

Domande per l'ospite
Cosa dovrebbe dirvi una persona quando prenota?
Cosa succede tra l'arrivo con una giacca strappata e l'incontro con un volontario?
Puoi raccontare una visita in cui l'oggetto non è stato riparato quel giorno?
Cosa dovrebbe verificare una persona presso il proprio caffè delle riparazioni?

Prima di registrare
Confermare nome, ruolo e permesso di Mina per registrare e pubblicare.
Mandare la scaletta e chiedere se ci sono argomenti da evitare.
Fare una breve prova audio nell'app di registrazione e riascoltarla.

Bozza della descrizione, da rivedere dopo il montaggio
Titolo provvisorio: La prima visita a un caffè delle riparazioni, con Mina Rossi.
Descrizione: una conversazione su come prenotare e cosa portare a riparare.
Ospite: Mina Rossi, coordinatrice volontaria, caffè delle riparazioni di via Olmo.
Link da aggiungere: pagina prenotazioni e istruzioni per i visitatori, entrambe verificate.
Tempi dei capitoli: ricavarli dall'audio montato finale, se li usiamo.

Controlli per la pubblicazione
Ascoltare tutto l'audio montato nell'app audio.
Controllare nome dell'ospite, permessi ed eventuali citazioni.
Rivedere la descrizione e controllare ogni link pubblico.
Caricare audio finale e descrizione sulla piattaforma del podcast.
Aprire l'episodio pubblicato e annotare qui il link.
`;
const PIPELINE = `Il banco delle riparazioni, episodi in corso

Episodio\tFase e prossimo passo
11: Riparare uno zaino\tMontaggio. Alessio elimina l'introduzione ripetuta.
12: La prima visita a un caffè delle riparazioni\tPreparazione. Bea manda le domande a Mina e conferma il permesso.
13: Prendersi cura degli attrezzi in prestito\tIdea. Roberta cerca un'ospite che gestisca una biblioteca degli oggetti.
`;
const PROMPT = `Leggi la mia nota Pinto Notes "Il banco delle riparazioni 12: la prima visita a un caffè delle riparazioni".
Usa solo la sezione Ospite e informazioni per proporre due domande di approfondimento utili a chi viene per la prima volta.
Mostramele prima in chat. Chiedimi i dati mancanti; non inventare storie dell'ospite o regole di prenotazione.
Dopo che approvo il testo, aggiungi le domande sotto Domande per l'ospite.
Lascia invariati tempi della scaletta e stato del permesso. Non spuntare i controlli per la pubblicazione.`;
const FAQ = [
  { q: "Cosa includere nel piano di un episodio podcast?", a: ["Metti fase e prossimo passo sopra obiettivo per chi ascolta, dati dell'ospite e scaletta con tempi. Aggiungi domande, controlli per registrare, bozza della descrizione e controlli per pubblicare. Tieni gli altri episodi in una tabella separata."] },
  { q: "La scaletta deve contenere ogni parola da dire?", a: ["Per un'intervista bastano frase iniziale, domande e tempi indicativi. Lascia spazio alle domande nate durante la conversazione. Una puntata recitata può richiedere un copione completo."] },
  { q: "Posso usare i tempi previsti come capitoli?", a: ["Ricava i capitoli dall'audio montato finale. Le risposte, le pause e i tagli cambiano l'inizio di ogni argomento."] },
  { q: "Una spunta pubblica l'episodio?", a: ["No. Devi caricare audio e descrizione sulla piattaforma del podcast e controllare l'episodio pubblico prima di spuntare l'ultima voce."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="scaletta-podcast-note-iphone"
  intro={<>Copia questo piano per un episodio podcast in Note di Apple. Domande, scaletta con tempi, bozza della descrizione e controlli per pubblicare stanno nella stessa nota.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia il piano" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#episodi", label: "Segui gli episodi" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Prepara le domande" }]}><p>Usa una nota per episodio con fase e prossima azione in alto. L'esempio fittizio prepara un'intervista di 18 minuti; sostituisci ospite, programma e dettagli con i tuoi.</p><div id="modello"><Keep title="Piano di episodio podcast per Note" text={TEMPLATE} copyLabel={ui.copy} note="Incolla in una nuova nota. Trasforma i nomi delle sezioni in intestazioni e i controlli in elenchi di controllo." /></div><PostCta slug="it/scaletta-podcast-note-iphone" path="/it/blog/scaletta-podcast-note-iphone" position="answer" ui={ui.cta} title="Prepara domande per l'ospite"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere il piano e proporre domande dalle informazioni che fornisci.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara l'episodio su Mac o iPhone</h2><p>Usa una nota iCloud o salvata sul dispositivo. Alcune funzioni non sono disponibili con altri provider email. Lo schema è leggibile come testo semplice.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante di formattazione", "Intestazione"] }, { on: "iPhone", steps: ["Formato", "Intestazione"] }]} />
  <p>Sul Mac incolla e applica Intestazione ai nomi delle sezioni. Trasforma le tre righe sotto Prima di registrare e le cinque sotto Controlli per la pubblicazione in elenchi di controllo. Spunta ogni azione solo quando è finita.</p>
  <p>Su iPhone tocca Nuova nota, incolla e applica Intestazione tramite Formato. Sotto ciascun titolo crea un Elenco di controllo e inserisci ogni attività usando Invio tra le voci. Rimuovi poi il testo semplice.</p>
  <h2 id="episodi">Tieni un elenco degli episodi in corso</h2><p>In un'altra nota segui gli episodi attivi. Per ciascuno scrivi fase, prossimo passo e responsabile. Aggiorna il testo quando passi da idea a preparazione, registrazione, montaggio e pubblicazione.</p>
  <Keep title="Episodi in corso per Note di Apple" text={PIPELINE} copyLabel={ui.copy} note="Ogni riga ha una tabulazione tra episodio e fase. Tieni la scaletta dettagliata nella nota dell'episodio." />
  <p>Sul Mac seleziona le quattro righe da Episodio al numero 13 e usa il pulsante della tabella. Oppure scegli Formato &gt; Tabella e inserisci le due colonne; Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese). Su iPhone usa Aggiungi tabella, trasferisci le righe e cancella il testo semplice. Conserva uno schema vuoto per il prossimo episodio; la <a href="/blog/apple-notes-templates">guida ai modelli</a> (in inglese) spiega come riusarlo.</p>
  <h2>Registra seguendo la scaletta, poi rivedi la descrizione</h2><p>Prima di registrare verifica nome e permesso dell'ospite. Confronta ogni domanda con ciò che hai promesso a chi ascolta. La giacca strappata aiuta a descrivere una visita. La storia completa del caffè potrebbe richiedere un'altra puntata.</p>
  <p>I tempi sommano 18 minuti, ma sono indicativi. Lascia spazio alle risposte e annota i tagli per chi monta l'audio. Dopo il montaggio rivedi la descrizione, elimina gli argomenti tagliati, aggiungi i link citati e ricava i tempi dei capitoli dalla versione finale.</p>
  <h2 id="limiti">I limiti</h2><p>Aggiorni tu l'elenco degli episodi. La fase non verifica che l'audio sia pronto; la spunta registra lavoro fatto nei tuoi strumenti audio e sulla piattaforma. Conserva file originali e montati nel tuo normale flusso di lavoro e scrivi nella nota i nomi o i percorsi utili. Dopo la pubblicazione aggiungi il link pubblico e cambia la fase.</p>
  <h2 id="pinto">Prepara le domande con ChatGPT o Claude</h2><p>Puoi usare lo schema in Pinto Notes. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note. Chiedi prima una proposta in chat.</p><Keep title="Chiedi domande di approfondimento all'AI" text={PROMPT} copyLabel={ui.copy} note="Salva prima il piano in Pinto. Sostituisci le informazioni sull'ospite con dati verificati." /><p>Controlla ogni domanda sulle informazioni date dall'ospite. In questo esempio prenotazione e un solo oggetto sono fatti forniti; una quota o la promessa di riparare tutto sarebbero inventate. Dopo la modifica controlla che il permesso sia ancora in attesa e che i controlli per pubblicare siano senza spunta.</p><p>Puoi importare le note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
