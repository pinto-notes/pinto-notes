import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "piano-lezione-note-iphone");
// Italian version of /blog/apple-notes-lesson-plan-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "piano lezione modello" returned []; "piano lezione"
// suggested "piano lezione" but also piano-music queries. Title uses the clear school context.
// Apple Italian sources read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd93c815aa0/mac, apd0a136b9cc/mac; it-it/guide/iphone/iph1ac0b3a2/ios
// and it-it/102296. Mac direct opens returned 429; indexed text and Italian pilot
// confirm the labels. Example is a tutoring session for a pupil in quinta primaria.
// No picture in English.
const ui = UI.it;
const TEMPLATE = `Confrontare le frazioni, 20 novembre 2026
Ripetizione di matematica di 40 minuti. Alunna di quinta primaria, esempio fittizio.

Obiettivo
Confrontare due frazioni con denominatori diversi e spiegare la risposta usando interi della stessa grandezza.

Controllo delle conoscenze iniziali
Chiedi: qual è maggiore, 1/4 o 3/4? Disegna entrambe con rettangoli della stessa grandezza.
Se i quarti non sono chiari, usa la lezione per esercitarsi prima sulle parti uguali.

Materiali
Strisce di carta per le frazioni, tagliate da fogli della stessa grandezza
Matita e carta quadrettata
Quattro confronti con risposte verificate prima della lezione

Fasi e tempi
Minuti\tAttività
Da 0 a 5\tControlla i quarti e chiedi all'alunna di spiegare.
Da 5 a 12\tConfronta 1/2 e 2/3 con le strisce. Usa interi della stessa grandezza.
Da 12 a 20\tMostra il confronto su carta usando i sesti, poi risolvetene uno insieme.
Da 20 a 30\tL'alunna confronta 1/3 e 1/2, 2/5 e 3/5, 3/5 e 2/3, 3/4 e 5/6. Chiedi un disegno o frazioni equivalenti.
Da 30 a 36\tDiscutete una risposta. Se serve, tornate alle strisce e riducete il numero di domande.
Da 36 a 40\tFai la domanda finale senza aiuti e annota la spiegazione.

Esempio svolto
Qual è maggiore, 1/2 o 2/3?
1/2 = 3/6 e 2/3 = 4/6, quindi 2/3 è maggiore.
I sesti devono riferirsi a interi della stessa grandezza.
Soluzioni dei confronti, frazione maggiore in ogni coppia: 1/2, 3/5, 2/3, 5/6.

Verifica della comprensione
Domanda finale: qual è maggiore, 2/3 o 3/4? Spiega senza le strisce.
Risposta per l'insegnante: 2/3 = 8/12 e 3/4 = 9/12, quindi 3/4 è maggiore.
Ascolta se la spiegazione parla di parti uguali, non solo del denominatore più grande.

Dopo la lezione
20 novembre: ha confrontato metà e terzi con le strisce senza aiuto.
Su carta ha scelto 3/4 nella domanda finale, ma non ha saputo spiegare perché.
Prossima lezione: disegnare entrambe le frazioni in dodicesimi prima di nuovi confronti.
`;
const PROMPT = `Leggi il mio piano in Pinto Notes "Confrontare le frazioni, 20 novembre 2026".
Usa le osservazioni sotto Dopo la lezione per preparare un piano separato di 40 minuti per il 27 novembre.
Lascia invariati il piano e le osservazioni originali.
Inizia disegnando 2/3 e 3/4 come dodicesimi di rettangoli della stessa grandezza.
Includi obiettivo, materiali, fasi con tempi, esempio svolto e domanda finale con risposta per l'insegnante.
Il totale deve essere 40 minuti. Non inventare risultati dell'alunna né dichiarare un allineamento al programma scolastico.
Mostrami prima la bozza in chat. Chiedi i dati mancanti prima di salvarla in una nuova nota.`;
const FAQ = [
  { q: "Cosa mettere in un piano di lezione in Note?", a: ["Scrivi obiettivo, verifica iniziale, materiali, attività con tempi, esempio svolto e domanda finale. Dopo la lezione aggiungi osservazioni per preparare la successiva."] },
  { q: "Posso spuntare i materiali in Note?", a: ["Sì. Sul Mac seleziona le righe e usa il pulsante dell'elenco di controllo. Su iPhone crea l'elenco sotto Materiali e usa Invio per aggiungere ogni voce. Spunta quando hai preparato tutto."] },
  { q: "Come riuso il piano per un'altra classe?", a: ["Copialo in una nuova nota e cambia data, obiettivo ed esempi. Cancella le vecchie osservazioni dalla copia, ma conserva la nota originale."] },
  { q: "I tempi avviano un timer?", a: ["No. Sono testo nella tabella. Usa un orologio o un timer separato e adatta le attività in base alla verifica iniziale."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="piano-lezione-note-iphone"
  intro={<>Copia questo piano di lezione in Note di Apple. Obiettivo, materiali, attività con tempi e domanda finale stanno nella stessa nota, con uno spazio per le osservazioni dopo la lezione.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia il piano" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#lezione", label: "Usa il piano" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Prepara la prossima lezione" }]}><p>Usa una nota per ogni lezione e un obiettivo che l'alunna possa dimostrare. L'esempio pianifica 40 minuti sulle frazioni per una ripetizione di quinta primaria e annota ciò che richiede ancora esercizio.</p><div id="modello"><Keep title="Piano di lezione per Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Incolla in una nuova nota. Trasforma Materiali in elenco di controllo e Fasi e tempi in tabella a due colonne." /></div><PostCta slug="it/piano-lezione-note-iphone" path="/it/blog/piano-lezione-note-iphone" position="answer" ui={ui.cta} title="Prepara la prossima lezione"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere le osservazioni e proporre un nuovo piano da verificare.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara il piano in Note</h2><p>Usa una nota iCloud o salvata sul dispositivo. Molte funzioni non sono disponibili con altri provider email. Puoi leggere il testo prima di formattarlo.</p>
  <MenuPaths rows={[{ on: "Mac, titoli", steps: ["Seleziona il testo", "Pulsante di formattazione", "Intestazione"] }, { on: "Mac, tabella", steps: ["Formato", "Tabella"] }, { on: "iPhone, titoli", steps: ["Seleziona il testo", "Formato", "Intestazione"] }]} />
  <p>Sul Mac applica Intestazione a ogni sezione. Seleziona le tre righe dei materiali e trasformale in elenco di controllo. Per il programma, seleziona le sette righe da Minuti all'ultima attività e usa il pulsante della tabella. Le tabulazioni creano due colonne. Puoi anche scegliere Formato &gt; Tabella e inserire le righe; Tabulatore nell'ultima cella ne aggiunge una. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
  <p>Su iPhone tocca Nuova nota, incolla e applica Intestazione tramite Formato. Crea un elenco di controllo sotto Materiali, con Invio tra le voci, e rimuovi le righe semplici. Usa Aggiungi tabella per tempi e attività, poi elimina il programma in testo. I controlli sono nella <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple</a>. Trovi altri schemi nella <a href="/blog/apple-notes-templates">guida ai modelli</a> (in inglese).</p>
  <h2 id="lezione">Usa il piano durante la lezione</h2><p>L'obiettivo richiede sia di scegliere la frazione maggiore sia di spiegare il confronto. Verifica esempi e risposte prima di insegnare. Se l'alunna non sa rappresentare i quarti, fermati sulle parti uguali e riduci gli esercizi. I tempi sono una guida modificabile.</p>
  <p>Tieni la soluzione per l'insegnante sotto la domanda finale e fuori dalla vista dell'alunna, se condividi lo schermo. Fai la domanda senza suggerire la risposta. Dopo la lezione annota cosa ha fatto e quanto aiuto è servito. La scelta corretta di 3/4 senza spiegazione dà un punto di partenza concreto. Conserva queste note nell'originale e crea una copia per la lezione successiva. Per gli appunti dello studente c'è il <a href="/it/blog/metodo-cornell-note-iphone">metodo Cornell</a>.</p>
  <h2 id="limiti">I limiti</h2><p>La tabella non conduce la lezione né misura la comprensione. Scegli tu le attività, verifica la matematica e adatta il piano dopo aver ascoltato la risposta. Se la scuola richiede un modulo specifico, usa quello per la consegna: questo è un appunto di lavoro per una ripetizione.</p>
  <h2 id="pinto">Prepara la prossima lezione con ChatGPT o Claude</h2><p>Puoi usare lo stesso schema in Pinto Notes. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note. Chiedile una proposta basata sulle osservazioni.</p><Keep title="Chiedi un piano per la prossima lezione" text={PROMPT} copyLabel={ui.copy} note="Cambia titolo, data e attività iniziale secondo il tuo caso. Questa richiesta usa l'esempio sopra." /><p>Controlla la bozza prima di salvarla. Somma i tempi e risolvi tu ogni esercizio. Verifica che parta dalla difficoltà osservata, elimina eventuali risultati inventati e solo allora chiedi di salvare una nuova nota. Pinto conserva le versioni precedenti delle note modificate.</p><p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
