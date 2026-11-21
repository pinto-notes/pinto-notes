import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "passaggio-consegne-lavoro-note-iphone");
// Italian version of /blog/apple-notes-work-handover-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "modello passaggio consegne lavoro" returned [];
// "passaggio consegne" suggested "passaggio consegne" and several job-specific variants.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd0a136b9cc/mac, apd93c815aa0/mac and it-it/guide/iphone/iph1ac0b3a2/ios.
// Direct Mac opens returned 429; indexed Apple text and Italian pilot supply menu labels.
// No picture in English.
const ui = UI.it;
const TEMPLATE = `Passaggio consegne per il laboratorio Olmo, dal 30 novembre al 4 dicembre

Copertura
Assente: Sara, dal 30 novembre al 4 dicembre 2026. Rientra il 7 dicembre.
Responsabile della copertura: Luca. Laboratorio: 10 dicembre.
Ultimo aggiornamento: 27 novembre, ore 15:00, ora italiana.
Sara non sarà disponibile durante le ferie. Per le decisioni urgenti contattare Emma.

Lavori in corso
Attività\tStato, responsabile e prossimo passo
Pagina iscrizioni\tTesto approvato, pagina non pubblicata. Luca: chiedere a Emma l'ultimo controllo entro il 30 novembre alle 10:00, poi pubblicare entro le 12:00.
Prenotazione sala\t18 posti riservati, caparra non approvata. Luca: chiedere a Emma l'approvazione entro il 1 dicembre alle 15:00.
Email ai partecipanti\tBozza pronta. Nadia: inviarla dopo la conferma della sala, entro il 3 dicembre alle 10:00. Non inviarla senza conferma.

Documenti principali
Piano progetto: laboratorio Olmo, aggiornato il 27 novembre.
Preventivo sala: R218, datato 26 novembre.
Bozza email: partecipanti laboratorio Olmo, versione 2.
Sostituire questi nomi con link funzionanti ai documenti del team.

Accessi da organizzare
Luca ha bisogno del ruolo di editor delle iscrizioni e dell'accesso alla cartella del laboratorio.
Sara ha aperto la richiesta IT-248 il 27 novembre; l'approvazione è ancora in attesa.
Procedura accessi: https://example.com/it/temporary-access
Luca: sollecitare l'IT e provare entrambi gli accessi entro il 27 novembre alle 16:00.
Usare il proprio account. Non inserire password, codici di recupero o token nella nota.

Contatti
Emma, approvazione budget e urgenze: emma@example.com
Nadia, messaggi ai partecipanti: nadia@example.com
Marco, prenotazione sala e preventivo R218: marco@example.com
Servizio IT, richiesta IT-248: it@example.com

Rischi e domande aperte
La prenotazione scade il 2 dicembre alle 12:00. Luca: se manca l'approvazione il 1 dicembre alle 15:00, contattare Emma quel giorno. Non pagare senza approvazione.
Possiamo accettare 22 partecipanti? Emma decide entro il 30 novembre alle 15:00. Il limite resta 18 finché non approva il cambio.
Le slide possono aspettare il rientro di Sara. Non richiedono copertura.

Controlli prima delle ferie
Luca: aprire ogni link ai documenti con il proprio account
Luca: provare la modifica delle iscrizioni e l'accesso alla cartella
Luca e Nadia: confermare insieme prossimi passi e scadenze
Luca: annotare qui le domande senza risposta entro il 27 novembre alle 16:30

Al rientro
Luca: aggiungere entro il 7 dicembre alle 09:00 un riepilogo datato dei lavori conclusi e aperti.
Sara: rivederlo con Luca prima di riprendere le attività.
`;
const PROMPT = `Leggi le mie note Pinto Notes "Piano laboratorio Olmo", "Prenotazione sala R218" ed "Email partecipanti laboratorio Olmo".
Prepara una nota separata "Passaggio consegne laboratorio Olmo, dal 30 novembre al 4 dicembre" usando lo schema che incollo sotto.
Sara è assente dal 30 novembre al 4 dicembre 2026 e torna il 7 dicembre. Luca la sostituisce.
Per ogni lavoro aperto indica stato, responsabile, prossimo passo, scadenza e titolo della nota di origine.
Separa i fatti confermati dalle domande. Se mancano responsabile, scadenza o approvazione, scrivi "Da confermare" e chiedimi chiarimenti.
Includi richieste di accesso e approvatori. Non inserire password, codici di recupero o token.
Non presumere che un accesso funzioni o che qualcuno abbia accettato il compito. Lascia i controlli senza spunta.
Non modificare le note di origine. Verificherò la bozza e confermerò gli incarichi con le persone coinvolte.`;
const FAQ = [
  { q: "Cosa includere in un passaggio di consegne?", a: ["Indica periodo di assenza, lavori aperti, responsabile e prossimo passo, link ai documenti, accessi, contatti e rischi. Chi sostituisce la persona assente deve poter verificare ogni voce prima della partenza."] },
  { q: "Devo mettere le password nella nota?", a: ["No. Indica sistema, ruolo richiesto, approvatore e link alla procedura aziendale. La persona che subentra usa il proprio account. Non inserire password, codici di recupero o token."] },
  { q: "Come verifico che la consegna sia pronta?", a: ["Chiedi a chi ti sostituisce di aprire i link, provare gli accessi e confermare attività e scadenze. Registra le domande irrisolte. Un nome scritto nella nota non prova che la persona abbia accettato l'incarico."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="passaggio-consegne-lavoro-note-iphone"
  intro={<>Copia questo modello di passaggio consegne in Note di Apple prima delle ferie. Riunisce lavori aperti, responsabili, prossime azioni, accessi e rischi in una nota.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia la consegna" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#verificare", label: "Controlla con chi subentra" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Prepara una bozza con l'AI" }]}><p>Usa una nota per il periodo di assenza. Assegna a ogni attività aperta una persona, un prossimo passo e una scadenza. Sostituisci nomi, indirizzi e link dell'esempio. Usa la procedura aziendale per gli accessi e non mettere password nella nota.</p><div id="modello"><Keep title="Passaggio consegne per Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Copia in una nuova nota. Trasforma Lavori in corso in tabella e Controlli prima delle ferie in elenco di controllo." /></div><PostCta slug="it/passaggio-consegne-lavoro-note-iphone" path="/it/blog/passaggio-consegne-lavoro-note-iphone" position="answer" ui={ui.cta} title="Prepara le consegne dalle note di progetto"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere le note di progetto e preparare una bozza da verificare.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara il passaggio in Note</h2><p>Usa una nota iCloud o salvata sul dispositivo. Alcune funzioni non sono disponibili con altri provider email. Il testo resta leggibile prima di aggiungere intestazioni, tabelle ed elenchi.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante di formattazione", "Intestazione"] }, { on: "Mac", steps: ["Formato", "Tabella"] }, { on: "iPhone", steps: ["Formato", "Intestazione"] }]} />
  <p>Sul Mac incolla il modello e applica Intestazione ai nomi delle sezioni. Seleziona le quattro righe da Attività a Email ai partecipanti e usa il pulsante della tabella. Le tabulazioni dividono le colonne. Puoi anche creare una tabella con Formato &gt; Tabella e riempirla. Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese). Seleziona le quattro righe dei controlli e trasformale in elenco di controllo.</p>
  <p>Su iPhone tocca Nuova nota, incolla e applica Intestazione ai nomi delle sezioni tramite Formato. Usa Aggiungi tabella per le attività e inserisci le due colonne a mano; elimina poi le righe semplici. Per i controlli usa il pulsante Elenco di controllo, una voce per volta con Invio. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple</a> mostra i controlli.</p>
  <h2>Assegna un prossimo passo a ogni attività</h2><p>Nell'esempio la sala è riservata ma la caparra non è approvata. Luca deve ottenere una decisione prima che la prenotazione scada. Tieni vicine la scadenza per l'approvazione e quella della prenotazione. Le slide di Sara possono aspettare. Sostituisci i nomi dei documenti con link veri e il link di esempio con la procedura aziendale. Puoi usare gli <a href="/it/blog/appunti-riunione-note-iphone">appunti di riunione</a> per recuperare le decisioni.</p>
  <h2 id="verificare">Rivedi la nota con chi ti sostituisce</h2><p>Luca deve aprire i documenti e provare gli accessi con il proprio account. Una richiesta in attesa non equivale all'accesso. Anche Nadia deve confermare la scadenza dell'email. Lascia visibili le domande aperte. Il limite rimane 18 partecipanti finché Emma non approva il cambio; registra risposta e data. Al rientro annota ciò che è finito e ciò che resta.</p>
  <h2 id="limiti">I limiti</h2><p>La nota registra incarichi, ma non concede accessi, non conferma l'accettazione di un compito e non avvisa quando scade la prenotazione. Usa gli strumenti aziendali per queste azioni e aggiorna la nota dopo. Se serve un passaggio formale, segui anche quella procedura.</p>
  <h2 id="pinto">Prepara la bozza dalle note di progetto</h2><p>Puoi usare questo schema in Pinto Notes con intestazioni, tabelle ed elenchi. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note. Condividi solo informazioni lavorative che la tua organizzazione permette di usare con l'AI.</p><Keep title="Chiedi all'AI una bozza di consegna" text={PROMPT} copyLabel={ui.copy} note="Sostituisci titoli, nomi e date. Incolla poi lo schema delle consegne dopo la richiesta." /><p>Confronta ogni responsabile, scadenza e approvazione con le note di origine e chiedi conferma alle persone. Nell'esempio la caparra resta non approvata, gli accessi in attesa e il limite a 18. Spunta i controlli solo dopo che Luca li ha eseguiti.</p><p>Puoi importare le note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
