import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "modello-curriculum-note-iphone");
// Italian version of /blog/apple-notes-resume-template. Autocomplete hl=it, gl=it,
// 21 Nov 2026: "curriculum note iphone modello" returned []; "curriculum vitae"
// suggested "curriculum vitae", "curriculum vitae gratis", "curriculum vitae
// europeo gratis", "curriculum vitae europass", "curriculum vitae gratis pdf".
// Apple it-it read 21 Nov: notes/apd1955d3b21/mac, apd93c815aa0/mac,
// apd0a136b9cc/mac, not9474646a9/mac, iphone/iph1ac0b3a2/ios, 102296.
// The Mac heading control is Formattazione and the style is Intestazione.
const ui = UI.it;
const TEMPLATE = `Giulia Rossi, archivio per il curriculum
Aggiornato: 21 novembre 2026

Contatti
Bologna
giulia.rossi@example.com | 051 555 0142
Portfolio: https://example.com/giulia

Profilo
Coordinatrice delle attività di assistenza con esperienza nel servizio clienti dal 2020.
Tiene aggiornati i report del gruppo e scrive guide per le nuove persone dell'assistenza.

Esperienza
Emilia Forniture | Coordinatrice attività di assistenza
Bologna | gennaio 2023 a oggi

12 novembre 2026: Ho preparato una lista per smistare le richieste, usata da sei colleghi. Il tempo mediano della prima risposta del gruppo è passato da 14 ore a settembre a 9 ore a ottobre.
Prova: report delle richieste di settembre e ottobre, salvato il 2 novembre 2026.
Il mio contributo: ho scritto la lista e condotto la revisione settimanale. Il gruppo ha gestito le richieste.

28 giugno 2026: Ho scritto una guida per le nuove assunzioni e formato quattro addetti all'assistenza a giugno.
Prova: guida introduttiva e registro delle presenze alla formazione di giugno.
Esempio della guida: https://example.com/giulia/formazione

Casa Adriatica | Addetta al servizio clienti
Bologna | settembre 2020 a dicembre 2022

31 marzo 2022: Ho risolto da 35 a 45 richieste dei clienti a settimana nel mese di marzo.
Prova: report delle richieste di marzo. È un conteggio personale, non del gruppo.

Competenze
Report con Excel, smistamento richieste, formazione di nuovi colleghi, scrittura di guide

Istruzione
Laurea triennale in Scienze della comunicazione | Università di Bologna | luglio 2020

Dati da controllare prima dell'uso
Verificare i titoli professionali esatti nei documenti di lavoro
Ricontrollare i tempi di risposta e i mesi messi a confronto
Sostituire i contatti e i link di esempio
Togliere i link ai report interni dal curriculum da inviare alle aziende`;
const EVIDENCE = `Data del risultato\tProva da conservare
12 novembre 2026\tReport delle richieste di settembre e ottobre, salvato il 2 novembre
28 giugno 2026\tGuida introduttiva e registro della formazione di giugno
31 marzo 2022\tReport individuale delle richieste di marzo`;
const FAQ = [
  { q: "Cosa mettere nel modello di curriculum in Note?", a: ["Tieni contatti, profilo, ruoli con date, competenze e istruzione. Sotto ogni lavoro registra risultati datati e prove. Questa nota è un archivio da cui ricavare il curriculum finale."] },
  { q: "Posso inviare la nota direttamente a un'azienda?", a: ["Conserva l'archivio per te. Porta i dettagli pertinenti in un editor di documenti, togli prove interne e appunti di verifica, poi controlla il file richiesto dall'azienda."] },
  { q: "Come descrivere un risultato senza numeri?", a: ["Scrivi che cosa hai fatto, quando e quale prova puoi controllare. Non aggiungere percentuali di miglioramento senza una fonte."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="modello-curriculum-note-iphone"
  intro={<>Usa Note per conservare la storia lavorativa e i risultati con le relative prove. Da questo archivio copia solo i dettagli pertinenti in un documento per il curriculum da inviare.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" },
    { href: "#curriculum", label: "Scrivi il curriculum" }, { href: "#limiti", label: "Conosci i limiti" },
    { href: "#pinto", label: "Prepara una bozza con l'AI" },
  ]}><p>La nota è un archivio completo: lavori con date, risultati e prove. Sostituisci la storia inventata con la tua, poi prepara il documento finale in un editor.</p>
    <PostCta slug="it/modello-curriculum-note-iphone" path="/it/blog/modello-curriculum-note-iphone" position="answer" ui={ui.cta} title="Scegli i risultati con Pinto Notes"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo aver collegato ChatGPT o Claude, puoi chiedergli di leggere l'archivio e preparare una bozza separata da controllare.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="modello">Il modello: tutta la storia lavorativa</h2>
  <p>Giulia e tutti i dettagli sono inventati. Sostituisci anche contatti e link. Conserva i lavori più vecchi nell'archivio, anche quando non entrano nel curriculum di oggi.</p>
  <Keep title="Archivio per il curriculum in Note" text={TEMPLATE} note="Copia in una nuova nota. All'inizio intestazioni e righe di verifica sono testo semplice." />
  <h2 id="preparare">Aggiungi intestazioni e controlli</h2>
  <p>Usa una nota iCloud per queste funzioni. Alcune potrebbero non essere disponibili con altri provider. Tieni la data accanto a ogni risultato.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante Formattazione", "Intestazione"] }, { on: "iPhone", steps: ["Pulsante Formattazione", "Stile intestazione"] }]} />
  <p>Applica uno stile intestazione a sezioni come Esperienza. Sul Mac seleziona le quattro righe sotto Dati da controllare e trasformale in un elenco di controllo. Su iPhone tocca Elenco di controllo e inserisci una voce alla volta con Invio. Spunta solo dopo aver verificato.</p>
  <p>Conserva una prova che puoi ritrovare per ogni risultato. Specifica la tua parte nel lavoro di gruppo e il periodo coperto dai numeri. Tieni nelle note personali solo dati di lavoro che puoi conservare.</p>
  <Keep title="Indice facoltativo delle prove" text={EVIDENCE} note="Le colonne sono separate da tabulazioni. Incolla sotto l'archivio e crea una tabella." />
  <MenuPaths rows={[{ on: "Mac", steps: ["Formato", "Tabella"] }]} />
  <p>Sul Mac seleziona le righe dell'indice e usa il pulsante Tabella, oppure scegli Formato &gt; Tabella e riempi le celle. Tab nell'ultima cella aggiunge una riga. Su iPhone usa Aggiungi tabella. Leggi la <a href="/blog/apple-notes-tables">guida alle tabelle</a>.</p>
  <h2 id="curriculum">Scegli i dettagli per una candidatura</h2>
  <p>Sul Mac duplica la nota dal menu File e dai alla copia il nome del ruolo e la data. Per un lavoro nell'assistenza, Giulia potrebbe mettere in evidenza la lista di smistamento e i report. Per una posizione nella formazione, la guida conta di più.</p>
  <p>Controlla ogni frase con la sua prova. Il risultato sui tempi di risposta riguarda il gruppo: Giulia può descrivere la sua lista senza attribuirsi da sola tutto il cambiamento. Togli report interni e controlli dalla copia da inviare. Tieni le candidature in una <a href="/it/blog/candidature-lavoro-note-iphone">nota separata</a>.</p>
  <h2 id="limiti">Dove si ferma la nota</h2>
  <p>L'archivio contiene più dettagli di quanti servano a un'azienda. Per il documento finale controlla impaginazione, spaziatura e formato richiesto. Apri il file prima di inviarlo. Questo modello non promette punteggi nei sistemi di selezione o un PDF di una pagina.</p>
  <h2 id="pinto">Chiedi una bozza separata in Pinto Notes</h2>
  <p>Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> e scelto Allow, l'AI può leggere e modificare le note. Chiedi di leggere l'archivio e l'annuncio di lavoro, poi creare una nuova nota con i risultati pertinenti. Deve lasciare intatto l'archivio e segnalare dati mancanti senza inventare numeri o competenze.</p>
  <p>Controlla date, fonti e meriti del gruppo. Pinto conserva le versioni precedenti delle note. Finisci comunque il curriculum in un editor di documenti. Puoi <a href="/blog/move-from-apple-notes">importare le note di Apple sul Mac</a> senza modificarle nell'app originale.</p>
  </LocalPostPage>; }
