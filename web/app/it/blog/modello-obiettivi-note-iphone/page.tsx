import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "modello-obiettivi-note-iphone");
// Italian version of /blog/apple-notes-goal-template. Autocomplete hl=it, gl=it, 21 Nov 2026:
// "modello obiettivi note iphone" and "obiettivi note" returned []; the title uses the local
// terms modello and obiettivi, without claiming an exact suggestion or search volume.
// Apple it-it read 21 Nov: notes/apd1955d3b21/mac (formattazione), apd93c815aa0/mac
// (elenchi), apd0a136b9cc/mac (tabelle), iphone/iph1ac0b3a2/ios (nuova nota,
// formattazione, tabelle), 102296 (elenco di controllo). Apple's localized page did not
// names the Mac heading control Formattazione and style Intestazione.
const ui = UI.it;
const TEMPLATE = `Finire il racconto L'ultimo traghetto

Risultato
Finire una bozza completa, con un finale, entro il 18 dicembre 2026.

Punto di partenza
14 novembre: 1.800 parole. Prima scena scritta; finale ancora da decidere.

Obiettivo
Circa 6.000 parole, tutte le scene scritte e nessuna parte mancante.
Una bozza completa comprende ogni scena e un finale.

Prove dei progressi
Data\tCosa è cambiato e dove controllare
14 novembre\t1.800 parole. File: L'ultimo traghetto, 14 nov.
21 novembre\t2.700 parole. Scena della stazione aggiunta; finale abbozzato. File: L'ultimo traghetto, 21 nov.

Tappe
29 novembre: arrivare a 3.000 parole e finire la scena centrale
13 dicembre: arrivare a circa 6.000 parole e scrivere il finale
18 dicembre: rileggere tutta la bozza e completare le parti mancanti

Prossima azione
Scrivere il dialogo alla stazione prima che parta il treno.

Prossima verifica
29 novembre 2026. Confrontare la bozza aggiornata con il punto di partenza.
Controllare se la scena centrale è finita, poi scegliere la prossima azione.`;
const PROMPT = `Leggi la mia nota di Pinto Notes "Finire il racconto L'ultimo traghetto".
Aggiungi questa prova sotto il 28 novembre 2026: la bozza ha 3.200 parole e la scena centrale è finita. La fonte è il file "L'ultimo traghetto, 28 nov".
Segna come completata la tappa del 29 novembre sulla base di questa prova.
Lascia invariati punto di partenza, risultato e obiettivo. Conserva anche le prove precedenti.
Sposta la prossima verifica al 6 dicembre 2026.
Suggerisci una sola prossima azione qui in chat. Se manca qualcosa, chiedi. Non inventare progressi né link alle fonti.`;
const FAQ = [
  { q: "Cosa mettere in una nota per un obiettivo?", a: ["Un risultato, il punto di partenza con data, un obiettivo misurabile, prove dei progressi, tappe e una data per la prossima verifica. Aggiungi la prossima azione."] },
  { q: "Conviene tenere tutti gli obiettivi nella stessa nota?", a: ["Se un risultato richiede settimane e più verifiche, dedicagli una nota. Così puoi conservare il punto di partenza quando cambi obiettivo."] },
  { q: "La data della verifica crea un avviso?", a: ["No. È solo testo. Se vuoi una notifica, crea un promemoria separato."] },
  { q: "Che differenza c'è con un tracker delle abitudini?", a: ["Qui registri un risultato e le prove dei progressi. Un tracker registra azioni ripetute. Scrivere ogni mattina è un'abitudine; finire il racconto entro il 18 dicembre è un obiettivo."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="modello-obiettivi-note-iphone"
  intro={<>Copia questo modello per gli obiettivi in una nota di Apple. Tieni insieme il punto di partenza, il risultato da raggiungere, le prove dei progressi e la prossima verifica.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" },
    { href: "#verificare", label: "Verifica i progressi" }, { href: "#limiti", label: "Conosci i limiti" },
    { href: "#pinto", label: "Aggiorna con l'AI" },
  ]}><p>Usa una nota per ogni obiettivo che richiede settimane. L'esempio segue la stesura di un racconto, con tappe da spuntare e prove in una tabella.</p>
    <div id="modello"><Keep title="Modello di obiettivo per Note" text={TEMPLATE} note="Copia il testo in una nuova nota. Puoi trasformare le tappe in un elenco di controllo e le prove in una tabella." /></div>
    <PostCta slug="it/modello-obiettivi-note-iphone" path="/it/blog/modello-obiettivi-note-iphone" position="answer" ui={ui.cta} title="Aggiorna il tuo obiettivo in Pinto Notes"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo aver collegato ChatGPT o Claude, puoi fargli leggere la nota e aggiungere le prove che gli fornisci.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara la nota in Note di Apple</h2>
  <p>Usa una nota su iCloud o salvata sul dispositivo. Apple avverte che alcune funzioni non sono disponibili con account di altri provider. Il testo resta leggibile anche senza formattazione.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante Formattazione", "Intestazione"] }, { on: "Mac", steps: ["Formato", "Tabella"] }, { on: "iPhone", steps: ["Pulsante Formattazione", "Stile intestazione"] }]} />
  <p>Sul Mac incolla il modello. Applica uno stile intestazione alle sezioni. Seleziona le tre tappe e usa il pulsante per l'elenco di controllo. Seleziona le righe delle prove e usa il pulsante Tabella. Le tabulazioni separano data e prova. Puoi anche scegliere Formato &gt; Tabella e riempire le celle. Il tasto Tab nell'ultima cella aggiunge una riga. Leggi la <a href="/blog/apple-notes-tables">guida alle tabelle</a>.</p>
  <p>Su iPhone tocca Nuova nota e incolla il testo. Usa Formattazione per le intestazioni. Crea le tappe con il pulsante Elenco di controllo; Invio aggiunge una voce. Per le prove, tocca Aggiungi tabella e inserisci date e risultati in colonne separate. Poi elimina le righe di testo duplicate.</p>
  <h2>Sostituisci l'esempio con un risultato preciso</h2>
  <p>"Scrivere di più" non dice quando avrai finito. "Finire una bozza entro il 18 dicembre" è verificabile. Conta le parole, ma controlla anche che il racconto abbia un finale. Registra il punto di partenza prima di iniziare e indica il file da cui viene.</p>
  <p>Scegli tappe che lasciano una prova. Se cambi scadenza o obiettivo, aggiungi una spiegazione datata e conserva quello iniziale.</p>
  <h2 id="verificare">Controlla le prove, poi scegli un'azione</h2>
  <p>Il 29 novembre apri la bozza. Verifica numero di parole e scena centrale prima di spuntare la tappa. Se le parole sono 3.200 ma la scena manca, lascia la tappa aperta e annotalo. Conserva le prove precedenti.</p>
  <p>Una <a href="/it/blog/weekly-review-note-iphone">revisione settimanale</a> può aiutarti a scegliere quale obiettivo seguire. Tieni le prove nella nota dell'obiettivo.</p>
  <h2 id="limiti">Dove si ferma il modello</h2>
  <p>La nota registra ciò che inserisci. Non legge la bozza, non misura i progressi e non invia avvisi. Confronta ogni tappa con la sua fonte.</p>
  <h2 id="pinto">Aggiorna la stessa nota con ChatGPT o Claude</h2>
  <p>In Pinto Notes puoi usare intestazioni, elenchi di controllo e tabelle. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> e scelto Allow, l'AI può leggere e modificare le note.</p>
  <Keep title="Chiedi all'AI di aggiornare l'obiettivo" text={PROMPT} note="Controlla tu la bozza e sostituisci risultati, fonte e date prima di usare il testo." />
  <p>Controlla la nota modificata: la nuova riga deve riportare 3.200 parole e la scena finita; solo la tappa del 29 novembre va spuntata. Pinto conserva le versioni precedenti. Puoi importare le note di Apple <a href="/blog/move-from-apple-notes">sul Mac</a> senza cambiarle nell'app originale.</p>
  </LocalPostPage>; }
