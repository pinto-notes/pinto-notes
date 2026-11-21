import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "lista-desideri-note-iphone");
// Italian version of /blog/apple-notes-wishlist-template. Autocomplete hl=it, gl=it,
// 21 Nov 2026: "lista desideri note iphone" returned []; "lista desideri" suggested
// "lista desideri amazon", "lista desideri", "lista desideri xbox". The title narrows it to Note.
// Apple it-it read 21 Nov: notes/not9474646a9/mac (nuova nota), apd93c815aa0/mac
// (elenchi), apd0a136b9cc/mac (Formato > Tabella), iphone/iph1ac0b3a2/ios
// (Formattazione, Aggiungi tabella), 102296 (Elenco di controllo).
// The localized Mac page did not clearly name the checklist control; describe it by purpose.
const ui = UI.it;
const TEMPLATE = `La mia lista dei desideri

Prossima verifica: 28 novembre 2026
Regola: aspettare almeno sette giorni prima di decidere. Ricontrollare il prezzo prima di comprare.

Lampada da scrivania con braccio regolabile
Link: https://example.com/lampada-scrivania
Prezzo visto: 65 €, spedizione inclusa
Visto il: 21 novembre 2026
Motivo: dopo il tramonto la scrivania resta in ombra.
Aspettare fino al: 28 novembre 2026
Decisione: aspetto. Prima misuro lo spazio accanto al monitor.

Macinacaffè manuale
Link: https://example.com/macinacaffe
Prezzo visto: 95 €, spedizione inclusa
Visto il: 20 novembre 2026
Motivo: provare il caffè macinato al momento nel fine settimana.
Aspettare fino al: 27 novembre 2026
Decisione: aspetto. Ne prendo uno in prestito per un fine settimana.

Supporto per portatile
Link: https://example.com/supporto-portatile
Prezzo visto: 39 €, spedizione inclusa
Visto il: 12 novembre 2026
Motivo: alzare lo schermo durante le videochiamate.
Aspettare fino al: 19 novembre 2026
Decisione: lascio perdere, 21 novembre. I libri sotto il portatile bastano.

Prima di decidere
Misurare lo spazio per la lampada.
Prendere in prestito un macinacaffè per il fine settimana.`;
const TABLE = `Articolo\tAttesa / decisione
Lampada da scrivania\t28 nov 2026 / aspetto, misuro lo spazio
Macinacaffè\t27 nov 2026 / aspetto, ne provo uno
Supporto portatile\t19 nov 2026 / lascio perdere, bastano i libri`;
const FAQ = [
  { q: "Come creare una lista dei desideri in Note?", a: ["Copia il modello in una nota. Per ogni acquisto possibile registra link, prezzo con data, motivo, giorno della verifica e decisione. Metti i controlli da fare in un elenco di controllo."] },
  { q: "Meglio una tabella o un elenco di controllo?", a: ["La tabella riassume articoli e decisioni. L'elenco di controllo serve alle azioni prima dell'acquisto, come misurare uno spazio."] },
  { q: "Cosa scrivere prima di comprare?", a: ["Annota a cosa serve l'oggetto, che cosa usi adesso, il prezzo con spedizione e quando deciderai. Quel giorno puoi comprare, aspettare o rinunciare."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="lista-desideri-note-iphone"
  intro={<>Conserva in Note i possibili acquisti, con link, prezzi datati e motivi. Questo modello per la lista dei desideri ti dà un giorno in cui ripensarci prima di comprare.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" },
    { href: "#decidere", label: "Rivedi la lista" }, { href: "#limiti", label: "Conosci i limiti" },
    { href: "#pinto", label: "Rivedi con l'AI" },
  ]}><p>Tieni un articolo per ogni possibile acquisto. Annota prezzo, data e motivo, poi controlla se ha ancora senso comprarlo dopo il periodo di attesa.</p>
    <PostCta slug="it/lista-desideri-note-iphone" path="/it/blog/lista-desideri-note-iphone" position="answer" ui={ui.cta} title="Rivedi la lista in Pinto Notes"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo aver collegato ChatGPT o Claude, puoi fargli leggere la lista e aggiornare le note di verifica.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="modello">Il modello: acquisti su cui riflettere</h2>
  <p>Due articoli sono ancora in attesa, uno è stato scartato. Prezzi e link sono esempi inventati. Sostituiscili con le pagine dei prodotti e i prezzi reali, spedizione inclusa.</p>
  <Keep title="Lista dei desideri per Note" text={TEMPLATE} note="Incolla come testo semplice. Le ultime due righe possono diventare un elenco di controllo." />
  <p>Per i regali destinati ad altri, usa la <a href="/it/blog/lista-regali-note-iphone">lista delle idee regalo</a>.</p>
  <h2 id="preparare">Prepara la nota su Mac o iPhone</h2>
  <MenuPaths rows={[{ on: "Mac", steps: ["Modifica", "Incolla"] }, { on: "Mac", steps: ["Seleziona le ultime due righe", "Crea un elenco di controllo"] }, { on: "iPhone", steps: ["Nuova nota", "Inserisci il testo"] }]} />
  <p>Sul Mac crea una nota e scegli Modifica &gt; Incolla. Seleziona le azioni sotto Prima di decidere e trasformale in un elenco di controllo. Spunta un'azione dopo averla fatta; non significa aver comprato l'articolo.</p>
  <p>Su iPhone tocca Nuova nota. Per i nomi degli articoli usa il pulsante Formattazione e uno stile intestazione. Sotto Prima di decidere usa Elenco di controllo; Invio aggiunge la voce successiva. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple</a> descrive i controlli.</p>
  <h3>Una tabella facoltativa per la verifica</h3>
  <Keep title="Riepilogo della lista" text={TABLE} note="Ogni riga separa articolo e decisione con una tabulazione. Incolla questo blocco sotto le schede complete." />
  <p>Sul Mac seleziona le quattro righe e usa il pulsante Tabella. In alternativa scegli Formato &gt; Tabella e riempi le due colonne. Tab nell'ultima cella aggiunge una riga. Su iPhone usa Aggiungi tabella. La <a href="https://support.apple.com/it-it/guide/notes/apd0a136b9cc/mac">guida Apple alle tabelle</a> spiega i passaggi. Se aggiornare due copie è troppo lavoro, lascia fuori il riepilogo.</p>
  <h2 id="decidere">Decidi quando finisce l'attesa</h2>
  <p>Sette giorni sono un esempio. Un oggetto essenziale rotto può richiedere una scelta prima; una spesa costosa può aspettare. Rileggi il motivo e controlla il prezzo attuale. Per la lampada misura lo spazio; per il macinacaffè prova quello preso in prestito.</p>
  <p>Scrivi "compro", "aspetto" o "lascio perdere" con data e motivo. Conserva gli articoli scartati per ricordare la decisione. Se compri, aggiungi data e importo pagato.</p>
  <h2 id="limiti">Dove si ferma la lista</h2>
  <p>Il prezzo è quello che hai visto, non quello attuale. La nota non controlla prezzi o disponibilità e la data non crea un promemoria. Impostane uno a parte se ti serve.</p>
  <h2 id="pinto">Rivedi la lista con ChatGPT o Claude</h2>
  <p>In Pinto Notes puoi usare intestazioni, link ed elenchi di controllo. <a href="/blog/connect-chatgpt-to-your-notes">Collega ChatGPT o Claude</a> e scegli Allow: un solo consenso permette di leggere e modificare le note.</p>
  <p>Chiedi di aggiungere una sezione con gli articoli la cui attesa è finita, usando solo prezzi e motivi già scritti. Fagli lasciare intatte le decisioni ed elencare i controlli ancora aperti. Controlla il risultato e verifica tu i prezzi attuali. Puoi <a href="/blog/move-from-apple-notes">importare le note di Apple sul Mac</a> senza modificarle nell'app originale.</p>
  </LocalPostPage>; }
