import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "retrospettiva-team-note-iphone");
// Italian version of /blog/apple-notes-retrospective-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "modello retrospettiva team" returned [];
// "retrospettiva team" suggested "retrospettiva team" and "retrospettiva di team".
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd0a136b9cc/mac, apd93c815aa0/mac, it-it/guide/iphone/iph1ac0b3a2/ios.
// Direct Mac opens returned 429; indexed text and Italian pilot verify labels.
// No picture in English.
const ui = UI.it;
const TEMPLATE = `Retrospettiva dell'aggiornamento delle pagine di aiuto di novembre

Periodo del progetto: dal 9 al 20 novembre 2026
Riunione di revisione: 23 novembre 2026
Persone: Sara, testi; Luca, grafica

Risultati previsti e osservati
Piano\tRisultato e fonte
Pubblicare 8 pagine aggiornate entro il 20 novembre\t8 pagine online il 20 novembre. Fonte: elenco di controllo della pubblicazione.
Una revisione per pagina\t3 pagine su 8 hanno richiesto una seconda revisione. Fonte: registro delle revisioni.

Cosa ha funzionato
Sara ha provato ogni serie di istruzioni prima di inviare la bozza a Luca.
L'elenco di pubblicazione indicava chi doveva controllare ogni pagina online.

Cosa non ha funzionato
Due schermate mostravano ancora la navigazione precedente alla prima revisione.
La pagina delle impostazioni dell'account ha cambiato ambito dopo che Sara l'aveva scritta.

Cause ancora incerte
Pensiamo che concordare prima le scalette possa ridurre le seconde revisioni.
Il registro non indica perché ogni pagina abbia richiesto un'altra revisione.

Cosa ripetere
Provare le istruzioni prima della revisione e assegnare il controllo finale a una persona.

Prossimo esperimento
Concordare le scalette prima di scrivere l'aggiornamento di dicembre.
Responsabile: Luca
Punto di partenza: a novembre 3 pagine su 8 hanno richiesto una seconda revisione.
Verifica: a dicembre non più di 1 pagina su 6 deve richiedere una seconda revisione.
Data della verifica: 7 dicembre 2026

Azioni
Luca: concordare tutte e sei le scalette con Sara entro il 25 novembre 2026.
Sara: registrare numero e motivi delle seconde revisioni entro il 4 dicembre 2026.

Esito della verifica
In attesa. Il 7 dicembre confrontare il registro con il criterio sopra.
`;
const PROMPT = `Leggi la mia nota Pinto Notes "Retrospettiva dell'aggiornamento delle pagine di aiuto di novembre".
Proponi un esperimento alternativo basato su Cosa non ha funzionato.
Separa le osservazioni dalle possibili cause. Non dire che la nota dimostra una causa.
Mostra in chat il cambiamento proposto e come verificarne l'esito.
Se lo scelgo, chiedimi responsabile e data della verifica. Non inventarli.
Solo dopo che li fornisco, sostituisci Prossimo esperimento e Azioni nella nota.
Conserva risultati, osservazioni e punto di partenza originali.`;
const FAQ = [
  { q: "Cosa includere in una retrospettiva in Note?", a: ["Indica progetto e date, confronta piano e risultati, poi scrivi cosa ha funzionato e cosa no. Chiudi con un esperimento, azioni con responsabili e una data di verifica. Tieni separate le cause ipotizzate dai fatti."] },
  { q: "Posso usare il modello da sola?", a: ["Sì. Rivedi un lavoro concluso, per esempio un numero della newsletter, e assegna a te stessa l'azione da provare la volta dopo."] },
  { q: "Quante azioni scegliere per un piccolo team?", a: ["Inizia con un cambiamento verificabile nel progetto successivo. Dai un responsabile e una data alle azioni necessarie. Annota separatamente le idee su cui non avete ancora deciso."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="retrospettiva-team-note-iphone"
  intro={<>Copia questo modello di retrospettiva in Note di Apple dopo un progetto o uno sprint. Registra risultati, problemi e azioni da verificare al prossimo incontro.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#riunione", label: "Conduci la revisione" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Proponi un esperimento" }]}><p>Metti piano e risultati in una tabella, osservazioni in sezioni separate e azioni concordate in un elenco di controllo. L'esempio termina con un solo cambiamento da provare e una data in cui misurarlo.</p><div id="modello"><Keep title="Retrospettiva per Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Copia in una nuova nota. Trasforma i risultati in tabella e le due azioni in elenco di controllo." /></div><PostCta slug="it/retrospettiva-team-note-iphone" path="/it/blog/retrospettiva-team-note-iphone" position="answer" ui={ui.cta} title="Valuta il prossimo esperimento"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere la retrospettiva e salvare le modifiche che approvi.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara la nota in Note di Apple</h2><p>Usa una nota iCloud o salvata sul dispositivo. Alcune funzioni non sono disponibili con altri provider email.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante di formattazione", "Intestazione"] }, { on: "Mac", steps: ["Formato", "Tabella"] }, { on: "iPhone", steps: ["Formato", "Intestazione"] }]} />
  <p>Sul Mac incolla, seleziona ogni nome di sezione e applica Intestazione. Seleziona le tre righe da Piano alla seconda voce del risultato e usa il pulsante della tabella. Le tabulazioni creano le colonne. Puoi scegliere Formato &gt; Tabella e inserire i dati; Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese). Trasforma le due azioni in elenco di controllo e spunta solo quando sono finite.</p>
  <p>Su iPhone tocca Nuova nota e incolla. Applica Intestazione tramite Formato. Usa Aggiungi tabella per piano e risultato, poi rimuovi le righe semplici. Sostituisci le due azioni con un Elenco di controllo, usando Invio tra le voci. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple</a> descrive questi controlli.</p>
  <h2 id="riunione">Rivedi un progetto concluso</h2><p>Prima delle cause confronta risultati e piano. Le otto pagine sono state pubblicate nei tempi, ma tre hanno richiesto un'altra revisione. Registra entrambi i fatti e sostituisci le fonti di esempio con i documenti controllati. La <a href="/blog/apple-notes-templates">guida ai modelli</a> (in inglese) spiega come riusare una nota di base.</p>
  <p>In un piccolo team lascia a ciascuno qualche minuto per scrivere osservazioni prima della discussione. Cita un evento, come le due schermate vecchie, senza giudicare la persona. Se lavori da sola, usa le stesse sezioni e assegna a te le azioni.</p>
  <p>Lascia le cause incerte nella sezione apposita. Il cambio di ambito potrebbe aver aumentato il lavoro, ma questa nota non lo dimostra. Sara annoterà i motivi delle revisioni per avere più dati. Per le discussioni in corso usa gli <a href="/it/blog/appunti-riunione-note-iphone">appunti di riunione</a>.</p>
  <h2>Scegli un cambiamento e verifica l'esito</h2><p>Qui Luca concorda le scalette prima delle bozze e Sara registra le seconde revisioni. Chiedi a ciascuno di accettare l'incarico prima di scriverlo. Il 7 dicembre registra il conteggio, anche se l'esperimento non ha aiutato. Un gruppo diverso di pagine non dimostra da solo la causa di un miglioramento. Decidi poi se tenere il cambiamento.</p>
  <h2 id="limiti">I limiti</h2><p>Nomi e date sono testo: non assegnano lavoro né inviano notifiche. Metti la verifica in calendario se ti serve un avviso. La nota non offre votazioni anonime e non prova le cause di un ritardo. Lascia visibili le spiegazioni non risolte.</p>
  <h2 id="pinto">Proponi un esperimento con ChatGPT o Claude</h2><p>Puoi usare lo schema in Pinto Notes. <a href="/blog/connect-chatgpt-to-your-notes">Collega ChatGPT o Claude</a> (guida in inglese) e scegli Allow. L'AI può leggere e modificare le note. Chiedile una proposta basata sulle osservazioni.</p><Keep title="Chiedi un altro esperimento all'AI" text={PROMPT} copyLabel={ui.copy} note="Sostituisci il titolo della nota. Controlla la proposta sulle osservazioni prima di sceglierla." /><p>Verifica che la proposta riguardi un problema registrato e tratti le cause come incerte. Dopo il salvataggio controlla responsabile, data, risultati originali e punto di partenza. L'esperimento e la misura restano a carico del team.</p><p>Puoi importare le note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
