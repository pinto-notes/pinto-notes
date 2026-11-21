import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "registro-ore-lavoro-note-iphone");
// Italian version of /blog/apple-notes-time-log-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "registro ore lavoro modello" returned [];
// "registro ore" suggested "registro ore lavoro", "registro ore lavoro pdf" and "registro ore".
// Apple Italian sources read 21 Nov 2026: it-it/guide/notes/apd0a136b9cc/mac,
// apd93c815aa0/mac and it-it/guide/iphone/iph1ac0b3a2/ios plus it-it/102296.
// Mac guide direct opens returned 429; search-served text and Italian pilot supply controls.
// No picture in the English post.
const ui = UI.it;
const TEMPLATE = `Registro ore, dal 16 al 20 novembre 2026

Ambito: solo lavoro al sito, alla newsletter e attività amministrative collegate. Non è l'intera settimana lavorativa.

Sessioni
Data\tInizio\tFine\tProgetto\tAttività\tMinuti
16 nov\t09:00\t10:10\tSito\tBozza pagina iniziale\t70
16 nov\t10:10\t10:25\tAmministrazione\tChiamata per la consegna\t15
16 nov\t10:25\t11:10\tSito\tRevisione pagina iniziale\t45
17 nov\t09:00\t09:40\tSito\tControllo layout su telefono\t40
17 nov\t14:00\t14:55\tSito\tModifiche chieste dal cliente\t55
18 nov\t10:00\t11:00\tSito\tPreparazione revisione\t60
19 nov\t09:15\t10:00\tNewsletter\tAggiornamento di novembre\t45
19 nov\t10:10\t10:40\tAmministrazione\tRisposte email di progetto\t30
20 nov\t09:00\t10:00\tSito\tPubblicazione modifiche approvate\t60
20 nov\t10:15\t10:45\tNewsletter\tRevisione oggetti email\t30

Totali giornalieri, calcolati a mano
16 nov: 130 minuti
17 nov: 95 minuti
18 nov: 60 minuti
19 nov: 75 minuti
20 nov: 90 minuti
Totale settimanale: 450 minuti, 7 ore e 30 minuti

Totali per progetto, calcolati a mano
Sito: 330 minuti
Newsletter: 75 minuti
Amministrazione: 45 minuti

Interruzioni e tempo non registrato
16 nov: la chiamata ha interrotto il lavoro al sito. I 15 minuti sono già in Amministrazione.
19 nov, dalle 10:40 alle 11:00: attività non registrata. 20 minuti esclusi dai totali.

Controllo settimanale
Controlla ogni durata rispetto all'ora di inizio e fine
Controlla che i totali giornalieri e quelli per progetto coincidano con il totale settimanale
`;
const PROMPT = `Leggi la mia nota Pinto Notes "Registro ore, dal 16 al 20 novembre 2026".
Aggiungi una sessione del 20 novembre, dalle 14:00 alle 14:35, per Sito: controllo dei link pubblicati, 35 minuti.
Conserva tutte le sessioni esistenti e il tempo non registrato. Non contare due volte la chiamata.
Proponi in chat i nuovi totali giornalieri, per progetto e settimanale. Non modificare i totali nella nota finché non li controllo.
Chiedimi chiarimenti sugli orari mancanti o sovrapposti. Non inventare attività né riempire i vuoti.`;
const FAQ = [
  { q: "Quali campi servono in un registro ore?", a: ["Per ogni sessione scrivi data, inizio, fine, progetto, attività e minuti. Aggiungi totali giornalieri e settimanali. Indica quali attività stai registrando, soprattutto se non è l'intera settimana."] },
  { q: "La colonna dei minuti si somma da sola?", a: ["No. Nelle tabelle di Note e Pinto Notes i minuti e i totali sono testo da inserire e controllare a mano."] },
  { q: "Come registro un'interruzione senza contare due volte il tempo?", a: ["Chiudi la riga della prima attività quando inizia l'interruzione. Aggiungi una riga per l'interruzione e un'altra quando riprendi il lavoro."] },
  { q: "Cosa scrivo se non ricordo un'attività?", a: ["Segna l'intervallo come sconosciuto e lascialo fuori dai totali. Se trovi una fonte attendibile, indica che la ricostruzione è una stima. Non attribuire un'attività precisa senza prove."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="registro-ore-lavoro-note-iphone"
  intro={<>Copia questo registro ore in Note di Apple per annotare il lavoro svolto. Inserisci i minuti di ogni sessione e somma i totali giornalieri per controllare la settimana.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia il registro" }, { href: "#preparare", label: "Crea la tabella" }, { href: "#registrare", label: "Registra il tempo" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Aggiungi una sessione con l'AI" }]}><p>Usa una riga per sessione completata, con orari, attività e minuti. L'esempio totalizza 450 minuti in cinque giorni. La chiamata è contata una sola volta; 20 minuti non registrati restano fuori dai totali.</p><div id="modello"><Keep title="Registro ore per Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Esempio fittizio. Sostituisci sessioni e totali. I passaggi qui sotto trasformano le righe separate da tabulazioni in una tabella." /></div><PostCta slug="it/registro-ore-lavoro-note-iphone" path="/it/blog/registro-ore-lavoro-note-iphone" position="answer" ui={ui.cta} title="Aggiungi sessioni con l'AI"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere il registro e aggiungere le sessioni che gli fornisci.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Crea la tabella e l'elenco di controllo</h2><p>Usa una nota iCloud o salvata sul dispositivo. Incolla prima il testo semplice; titoli e totali restano fuori dalla tabella.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Seleziona le righe delle sessioni", "Formato", "Tabella"] }, { on: "iPhone", steps: ["Nuova nota", "Aggiungi tabella"] }]} />
  <p>Sul Mac seleziona le undici righe da Data all'ultima sessione. Usa il pulsante della tabella o Formato &gt; Tabella. Le tabulazioni dividono le colonne; Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="https://support.apple.com/it-it/guide/notes/apd0a136b9cc/mac">guida Apple alle tabelle</a> e la nostra <a href="/blog/apple-notes-tables">guida ai limiti delle tabelle</a> (in inglese).</p>
  <p>Su iPhone tocca Nuova nota e incolla. Per una tabella più stretta usa Aggiungi tabella con le colonne Sessione e Minuti. Nella prima unisci data, orari, progetto e attività, per esempio "16 nov, 09:00 alle 10:10, Sito, bozza pagina iniziale". Metti 70 nella seconda e trasferisci le altre righe, poi elimina il testo semplice.</p>
  <p>Sul Mac seleziona le due righe sotto Controllo settimanale e usa il pulsante dell'elenco di controllo. Su iPhone crea l'elenco nello stesso punto e inserisci le voci una alla volta con Invio. Spunta solo dopo la verifica.</p>
  <h2 id="registrare">Registra il tempo effettivo</h2><p>Dichiara l'ambito: qui sono incluse solo alcune sessioni di progetto. Un pomeriggio vuoto non dice nulla sul resto del lavoro. Tieni le attività previste in una nota separata.</p>
  <p>Aggiungi una riga quando finisci un'attività o passi a un'altra. Usa nomi coerenti per i progetti. La sessione dalle 09:00 alle 10:10 dura 70 minuti. La chiamata occupa 15 minuti a parte, poi il lavoro al sito riprende. Contare anche l'intervallo intero fino alle 11:10 come lavoro al sito duplicherebbe la chiamata.</p>
  <p>Lascia visibili le lacune. I 20 minuti di giovedì non hanno un'attività registrata e non entrano nei totali. Se ricostruisci una sessione, indica se gli orari sono precisi o stimati.</p>
  <h2>Controlla a mano il totale settimanale</h2><p>130 + 95 + 60 + 75 + 90 fa 450 minuti, cioè 7 ore e 30 minuti. Anche 330 per Sito, 75 per Newsletter e 45 per Amministrazione fa 450. I 20 minuti sconosciuti sono esclusi. Dopo una modifica ricalcola i totali interessati. Conserva la settimana completata; trovi altri schemi nella <a href="/blog/apple-notes-templates">guida ai modelli</a> (in inglese).</p>
  <h2 id="limiti">I limiti di un registro in Note</h2><p>Non c'è un timer né il rilevamento automatico delle attività. Note e Pinto Notes non sommano la colonna. Se devi calcolare molte durate, può servirti un foglio di calcolo con formule.</p><p>Il totale descrive solo le sessioni annotate. Non spiega il tempo sconosciuto e non stabilisce quali minuti siano fatturabili. Tieni separata questa decisione.</p>
  <h2 id="pinto">Aggiungi una sessione con ChatGPT o Claude</h2><p>Puoi usare la stessa nota in Pinto Notes. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note. Fornisci i dati reali della sessione; il registro dipende sempre da ciò che annoti.</p><Keep title="Richiesta per l'AI collegata" text={PROMPT} copyLabel={ui.copy} note="Usala con l'esempio oppure sostituisci titolo e dettagli della sessione." /><p>Controlla che la nota abbia una sola nuova sessione di 35 minuti e che le righe precedenti siano integre. Nell'esempio il venerdì arriva a 125 minuti, Sito a 365 e la settimana a 485 minuti, cioè 8 ore e 5 minuti. Verifica i conti prima di aggiornare i totali. I 20 minuti sconosciuti restano esclusi.</p><p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
