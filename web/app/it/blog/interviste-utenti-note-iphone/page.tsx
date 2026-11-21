import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "interviste-utenti-note-iphone");
// Italian version of /blog/apple-notes-user-interview-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "modello intervista utenti" and "intervista utenti"
// returned []. The title uses the plain Italian term; no search demand is claimed.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd93c815aa0/mac, apd0a136b9cc/mac, it-it/guide/iphone/iph1ac0b3a2/ios
// and it-it/102296. Mac direct opens returned 429; indexed text and Italian pilot
// verify names. No picture, audio or transcription in English.
const ui = UI.it;
const TEMPLATE = `Intervista utente, P07, cambio prenotazione

Data: 21 novembre 2026, ore 09:00
Intervistatrice: Marta. Appunti: Teo.
Partecipante: P07, cliente già iscritta a un laboratorio. Esempio fittizio.

Obiettivo
Capire se una cliente può spostare la prenotazione di un laboratorio senza contattare l'assistenza.

Consenso
09:00: P07 ha accettato appunti scritti e citazioni anonime per la revisione interna del prodotto.
Nessuna registrazione audio o video. Chiedere un consenso separato prima di usare un'AI.

Domande e appunti sulle risposte
D1. Raccontami l'ultima volta che hai cambiato la prenotazione di un laboratorio.
Appunti: Ha scritto alla bottega, ha aspettato due giorni, poi ha ricevuto un nuovo biglietto.

D2. Il corso di ceramica di sabato coincide con il lavoro. Mostrami come lo sposteresti a domenica.
Appunti: Ha aperto Corsi, poi Account. Ha cercato un link alla prenotazione, poi ha aperto Aiuto. Si è fermata senza cambiare la data.

D3. Cosa ti aspettavi di trovare in Account?
Appunti: Un elenco dei biglietti con un'opzione per cambiare data accanto a ogni prenotazione.

Registro delle evidenze
ID e ora\tCosa è stato osservato o detto
E1, 09:06\tD1, citazione: "Ho scritto un'email perché non trovavo come cambiare la data."
E2, 09:13\tD2, osservazione: Ha aperto Corsi, Account, poi Aiuto. Non ha completato il cambio.
E3, 09:15\tD3, citazione: "Mi aspetto di trovarlo accanto al biglietto."

Interpretazione da verificare
P07 potrebbe aspettarsi il cambio della prenotazione accanto al biglietto in Account. Si basa su E2 ed E3.
Questa intervista non dice se gli altri clienti si aspettino lo stesso percorso.

Domande aperte
P07 noterebbe un link Le mie prenotazioni in Account? Provarlo con un altro compito.
L'opzione per cambiare data era disponibile per questa prenotazione? Controllare la prova.

Azioni successive
Teo: controllare le regole del cambio data entro il 23 novembre
Marta: aggiungere un compito su Le mie prenotazioni alla prossima intervista entro il 24 novembre
`;
const PROMPT = `Leggi la mia nota Pinto Notes "Intervista utente, P07, cambio prenotazione".
Crea una nota separata "Bozza risultati, P07, cambio prenotazione". Non modificare la nota di origine.
Usa solo questa intervista. Separa esperienza riferita, azioni osservate, citazioni esatte e possibili interpretazioni.
Per ogni risultato cita P07, l'ID dell'evidenza e i numeri di riga restituiti quando leggi la nota.
Conserva le citazioni identiche. Non trasformare gli appunti sulle risposte in citazioni.
Elenca separatamente domande irrisolte e azioni proposte. Non inventare risposte né generalizzare ad altri partecipanti.
Escludi i risultati senza prove nella fonte. Indica che la nuova nota è una bozza da controllare.`;
const FAQ = [
  { q: "Cosa includere in una scheda per interviste utenti?", a: ["Scrivi obiettivo, codice del partecipante, consenso, domande e appunti. Tieni un registro separato di citazioni esatte e azioni osservate, poi interpretazioni e azioni successive. Usa una nota per intervista."] },
  { q: "Come distinguo citazioni e appunti?", a: ["Dai a ogni citazione un ID e un'ora e trascrivi le parole esatte. Metti le parafrasi negli appunti, senza virgolette se non conosci la formulazione precisa."] },
  { q: "Serve registrare l'audio?", a: ["No. L'esempio usa appunti scritti. Registra ciò che la persona ha autorizzato prima di iniziare. Copiare la riga del consenso non vale come consenso per la tua intervista o per condividerla con un'AI."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="interviste-utenti-note-iphone"
  intro={<>Copia questa scheda per interviste utenti in Note di Apple. Una nota per sessione tiene separate risposte, citazioni esatte, azioni osservate e domande da approfondire.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia la scheda" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#intervista", label: "Prendi appunti" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Prepara i risultati" }]}><p>Metti obiettivo e consenso in alto, poi domande, registro delle evidenze e azioni successive. L'esempio segue una cliente che prova a spostare un corso di ceramica. Sostituisci tutti i dati prima della tua intervista.</p><div id="modello"><Keep title="Scheda intervista utenti per Note" text={TEMPLATE} copyLabel={ui.copy} note="Copia il testo in una nuova nota. Trasforma il registro in tabella e le azioni successive in elenco di controllo." /></div><PostCta slug="it/interviste-utenti-note-iphone" path="/it/blog/interviste-utenti-note-iphone" position="answer" ui={ui.cta} title="Prepara una bozza dei risultati"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere la nota dell'intervista e creare una bozza separata da verificare.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara la nota su Mac o iPhone</h2><p>Usa una nota iCloud o salvata sul dispositivo; alcuni controlli non sono disponibili con altri provider. Lascia domande e risposte come testo semplice per scrivere durante la conversazione.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante di formattazione", "Intestazione"] }, { on: "Mac", steps: ["Formato", "Tabella"] }, { on: "iPhone", steps: ["Formato", "Intestazione"] }]} />
  <p>Sul Mac incolla il testo, seleziona i nomi delle sezioni e applica Intestazione. Trasforma le due righe sotto Azioni successive in elenco di controllo. Seleziona le quattro righe da ID e ora a E3 e usa il pulsante della tabella. Le tabulazioni dividono le colonne. Puoi anche scegliere Formato &gt; Tabella e riempire le celle; Tabulatore nell'ultima cella aggiunge una riga. Vedi le <a href="https://support.apple.com/it-it/guide/notes/apd1955d3b21/mac">istruzioni di formattazione Apple</a>, quelle per gli <a href="https://support.apple.com/it-it/guide/notes/apd93c815aa0/mac">elenchi</a> e la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
  <p>Su iPhone tocca Nuova nota e incolla. Seleziona un titolo di sezione, poi Formato e Intestazione. Crea la tabella delle evidenze con Aggiungi tabella e rimuovi le righe semplici dopo averle controllate. Per le azioni usa Elenco di controllo e Invio tra le voci. Apple descrive i pulsanti nella <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida di iPhone</a>.</p>
  <h2 id="intervista">Prendi appunti per ogni domanda</h2><p>Prima della sessione cambia l'obiettivo, svuota risposte ed evidenze e assegna un codice al partecipante. Sostituisci il consenso di esempio con ciò che la persona autorizza davvero, incluso l'uso di note e citazioni. Chiedi prima di prendere appunti.</p>
  <p>Durante l'intervista scrivi appunti brevi sotto la domanda. Metti nel registro una frase tra virgolette solo se ne hai le parole esatte. Se perdi la formulazione, riassumi senza virgolette. Gli orari vanno inseriti a mano.</p>
  <p>Annota ciò che vedi durante una prova. In E2, P07 apre Corsi, Account e Aiuto, poi si ferma. Dire che è confusa sarebbe un'interpretazione. Tienila nella sezione apposita con le prove. Chiedi cosa si aspettava dopo il compito senza suggerirle dove toccare.</p>
  <h2>Rivedi la sessione prima dei risultati</h2><p>Rileggi appunti ed evidenze mentre ricordi la conversazione. Lascia sconosciuti i dettagli mancanti. E2 ed E3 suggeriscono un punto da provare, ma non dimostrano che il link Le mie prenotazioni risolverebbe il problema. Controlla anche le regole del cambio data.</p>
  <p>Dai a ogni azione una persona e una data. Spunta solo quando è finita. Per la prossima intervista copia una scheda vuota in una nuova nota e cambia il codice. Trovi altri schemi nella <a href="/blog/apple-notes-templates">guida ai modelli</a> (in inglese). Conserva la nota conclusa come fonte.</p>
  <h2 id="limiti">I limiti</h2><p>La scheda conserva ciò che scrivi. Non recupera citazioni perse, non verifica il consenso e non decide se un'interpretazione è fondata. Una sessione descrive quella persona; confronta più interviste prima di parlare di un comportamento ricorrente, mantenendo i codici delle fonti.</p>
  <h2 id="pinto">Prepara i risultati in una nota separata</h2><p>Puoi usare la scheda in Pinto Notes. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note. Per una sessione reale, verifica prima che consenso e regole della tua organizzazione permettano di condividere gli appunti con l'AI.</p><Keep title="Chiedi una bozza dei risultati" text={PROMPT} copyLabel={ui.copy} note="Salva prima l'esempio fittizio in Pinto. Per un'intervista reale cambia titoli e codice del partecipante." /><p>Controlla ogni risultato sulle righe citate. L'email di P07 è esperienza riferita; i tocchi in E2 sono osservati; E3 è un'aspettativa citata. Verifica le parole esatte e togli le conclusioni senza prove. L'AI può citare male o inferire troppo.</p><p>Puoi importare le note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
