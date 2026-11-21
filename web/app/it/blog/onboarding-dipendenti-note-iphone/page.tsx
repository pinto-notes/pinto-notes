import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "onboarding-dipendenti-note-iphone");
// Italian version of /blog/apple-notes-employee-onboarding-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "checklist onboarding dipendenti" returned [];
// "onboarding dipendenti" suggested that exact phrase. Title uses the attested term.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd0a136b9cc/mac, apd93c815aa0/mac, it-it/guide/iphone/iph1ac0b3a2/ios
// and it-it/102296. Direct Mac opens returned 429; indexed Apple text and Italian pilot
// confirm labels. No picture in English.
const ui = UI.it;
const TEMPLATE = `Primo mese in Officina Olmo

Nome: Maya Rossi, addetta all'assistenza clienti
Inizio: 23 novembre 2026. Colloquio di fine mese: 18 dicembre.
Responsabile: Amina Conti. Collega di riferimento: Leo Martinelli.

Obiettivi del primo mese
Entro il colloquio, gestire le domande comuni sulle consegne con Leo che rivede le risposte.
Spiegare quando inoltrare una richiesta di rimborso. Confermare queste aspettative con Amina.

Persone
Persona\tCosa chiedere
Amina Conti, responsabile\tPriorità e feedback. Colloquio settimanale il venerdì.
Leo Martinelli, collega di riferimento\tBozze delle risposte e domande sulle consegne. Lavorare insieme il martedì.
Nadia Ferri, IT\tRichieste di accesso tramite il portale IT.

Sistemi e pagine utili
Manuale del team: intranet aziendale, Assistenza / Da qui.
Guida consegne: intranet aziendale, Assistenza / Domande sulle consegne.
Sistema ticket: richiesta IT 4821 inviata il 23 novembre. Accesso in attesa.
Calendario del team: aperto e verificato il 23 novembre.

Domande e risposte
Aperta, per Amina: quali rimborsi richiedono l'approvazione di un responsabile? Chiedere il 27 novembre.
Risposta del 23 novembre, Leo: dove sono gli esempi di risposta? Assistenza / Risposte di esempio.

Settimana 1, dal 23 al 27 novembre
Confermare con Amina gli obiettivi del primo mese
Provare l'accesso ai ticket dopo la chiusura della richiesta 4821
Leggere la guida consegne e osservare Leo mentre risponde a due domande

Settimana 2, dal 30 novembre al 4 dicembre
Preparare tre risposte sulle consegne da far rivedere a Leo
Chiedere ad Amina le regole per inoltrare i rimborsi

Settimana 3, dal 7 all'11 dicembre
Gestire cinque domande comuni sulle consegne con la revisione di Leo
Annotare un passaggio poco chiaro nella guida consegne

Settimana 4, dal 14 al 18 dicembre
Raccogliere due risposte riviste per il colloquio di fine mese
Rivedere i progressi con Amina e scegliere il prossimo obiettivo

Diario di apprendimento
23 novembre: ho trovato gli esempi di risposta con Leo. L'accesso ai ticket è ancora in attesa.

Appunti per il colloquio di fine mese
18 dicembre: portare le risposte riviste e le domande ancora aperte.
Dopo il colloquio: annotare qui feedback e prossimo obiettivo.
`;
const PROMPT = `Leggi la mia nota Pinto Notes "Primo mese in Officina Olmo".
Aggiungi questa risposta confermata sotto Domande e risposte:
27 novembre 2026, Amina: tutte le richieste di rimborso vanno al responsabile di turno per l'approvazione.
Sostituisci la domanda aperta sui rimborsi con questa risposta datata.
Lascia invariate le altre domande, lo stato degli accessi e gli elenchi settimanali.
Poi elenca in chat le domande senza risposta e la persona a cui intendevo farle.
Usa solo la nota e la risposta sopra. Non inventare regole aziendali né segnare formazione completata.
Chiedimi chiarimenti prima di modificare se non trovi la nota o la domanda giusta.`;
const FAQ = [
  { q: "Cosa mettere in una nota per il primo mese di lavoro?", a: ["Scrivi obiettivi del ruolo, persone da contattare, stato degli accessi, pagine utili e domande aperte. Aggiungi un elenco per ciascuna delle prime quattro settimane e risposte datate."] },
  { q: "Come tengo traccia di un accesso in attesa?", a: ["Indica sistema, numero e data della richiesta e persona o team incaricato. Lascia lo stato in attesa finché non provi l'accesso. Conserva le password nel gestore approvato dall'azienda, mai nella nota."] },
  { q: "Questa nota sostituisce il processo aziendale?", a: ["No. È un promemoria personale. Segui le procedure aziendali per documenti, formazione obbligatoria e accessi. Una spunta nella nota non invia dati a quei sistemi."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="onboarding-dipendenti-note-iphone"
  intro={<>Copia questo modello per il primo mese di lavoro in Note di Apple. Tieni persone, sistemi e domande aperte accanto alle attività delle prime quattro settimane.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#mese", label: "Usala ogni settimana" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Aggiungi risposte confermate" }]}><p>Usa una nota personale con obiettivi, persone, sistemi e domande ancora senza risposta. L'esempio segue una nuova addetta all'assistenza e include una tabella dei contatti e un elenco per ogni settimana.</p><div id="modello"><Keep title="Primo mese di lavoro in Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Esempio fittizio. Sostituisci nomi e date. Trasforma Persone in tabella e le attività settimanali in elenchi di controllo." /></div><PostCta slug="it/onboarding-dipendenti-note-iphone" path="/it/blog/onboarding-dipendenti-note-iphone" position="answer" ui={ui.cta} title="Aggiungi una risposta confermata"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere la tua nota e inserire le risposte che fornisci.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara la nota in Note</h2><p>Usa una nota iCloud o salvata sul dispositivo. Molte funzioni non sono disponibili con altri provider email. Incolla il testo semplice e sostituisci i nomi dei sistemi con i link reali del team.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante di formattazione", "Intestazione"] }, { on: "Mac", steps: ["Formato", "Tabella"] }, { on: "iPhone", steps: ["Formato", "Intestazione"] }]} />
  <p>Sul Mac applica Intestazione ai nomi delle sezioni. Seleziona solo le attività della prima settimana e usa il pulsante dell'elenco di controllo. Ripeti per le altre settimane. Per Persone seleziona le quattro righe da Persona a Nadia e usa il pulsante della tabella. Le tabulazioni dividono le colonne. Puoi anche scegliere Formato &gt; Tabella e inserire i dati; Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
  <p>Su iPhone tocca Nuova nota e incolla. Applica Intestazione tramite Formato. Per ogni settimana crea un Elenco di controllo e usa Invio per le nuove attività; poi elimina le righe semplici. Per le persone usa Aggiungi tabella e inserisci nomi e responsabilità in celle separate.</p>
  <h2 id="mese">Tieni aggiornata la nota per tutto il mese</h2><p>Sostituisci gli obiettivi con quelli concordati con chi ti segue. Maya deve preparare risposte che Leo rivedrà. Lascia ogni aspettativa come non confermata finché non ne parli con la responsabile.</p>
  <p>A fine giornata aggiungi le risposte accanto alle domande, con data e persona che le ha date. Tieni visibili le questioni aperte e quando chiedere. Se una richiesta IT risulta chiusa, prova ad aprire il sistema prima di cambiare lo stato nella nota.</p>
  <p>Ogni venerdì controlla le attività della settimana e dai una data realistica a quelle rimaste. Annota un'abilità acquisita nel diario e lascia spuntate le attività finite. Per le conversazioni più lunghe con la responsabile usa il <a href="/it/blog/one-to-one-note-iphone">modello per i colloqui individuali</a>.</p>
  <p>Prima del colloquio di fine mese scegli esempi che mostrino gli obiettivi concordati. Maya porta due risposte riviste e le domande aperte. Dopo annota feedback e prossimo obiettivo.</p>
  <h2 id="limiti">I limiti</h2><p>La nota non concede accessi né invia attestati di formazione. Usa il processo aziendale per le attività ufficiali. Conserva gli appunti di lavoro solo dove l'azienda lo permette; password e documenti del personale restano nei sistemi approvati. Le date non inviano promemoria: segui tu le richieste usando il loro numero.</p>
  <h2 id="pinto">Aggiungi una risposta con ChatGPT o Claude</h2><p>Puoi usare lo schema in Pinto Notes. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note. Fornisci solo una risposta che hai già verificato.</p><Keep title="Chiedi all'AI di aggiornare la nota" text={PROMPT} copyLabel={ui.copy} note="La risposta è un esempio. Sostituiscila con un'informazione confermata prima di usare la richiesta." /><p>Apri la nota modificata e verifica data, persona e testo. Nell'esempio i rimborsi passano al responsabile di turno; l'accesso ai ticket deve restare in attesa e nessuna attività settimanale va spuntata. Controlla anche l'elenco delle domande aperte. Pinto conserva le versioni precedenti delle note.</p><p>Puoi importare le note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
