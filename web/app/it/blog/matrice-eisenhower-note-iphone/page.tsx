import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "matrice-eisenhower-note-iphone");
// Italian version of /blog/apple-notes-eisenhower-matrix-template. Autocomplete hl=it,
// gl=it, 21 Nov 2026: "matrice eisenhower note iphone" returned []; "matrice
// eisenhower" suggested "matrice eisenhower", "matrice eisenhower italiano",
// "matrice eisenhower pdf", "matrice eisenhower excel", "matrice eisenhower esempi".
// Apple it-it read 21 Nov: notes/apd93c815aa0/mac, apd1955d3b21/mac,
// not9474646a9/mac, iphone/iph1ac0b3a2/ios and 102296. The localized Mac
// heading control is Formattazione and the style is Intestazione.
const ui = UI.it;
const TEMPLATE = `Lancio prenotazioni del bar, settimana del 23 novembre

Risultato: pubblicare la nuova pagina delle prenotazioni il 27 novembre.
Verifica: 24 novembre, ore 9:00.

Da fare: urgente e importante
Correggere il modulo di prenotazione su telefono prima delle prove di oggi. Il pulsante di invio non funziona.
Inviare il link di prova alla titolare del bar entro le 17:00 del 23 novembre. Il suo parere serve domani.

Da pianificare: importante, non urgente
Provare le email di conferma il 25 novembre alle 10:00, prima del lancio.
Scrivere la guida per il passaggio di consegne il 26 novembre alle 14:00, così la titolare potrà aggiornare gli orari.

Da delegare o ridurre: urgente, poco importante per il risultato
Chiedere a Luca di ridimensionare il banner entro il 24 novembre. Verificare che possa occuparsene.
Rispondere all'invito facoltativo per la chiamata di lancio entro le 16:00 di oggi. Chiedere invece un aggiornamento scritto.

Da scartare: né urgente né importante
Non cercare altri temi per il sito. Il progetto attuale è approvato.
Lasciare come sono le icone delle cartelle interne. Non incidono sulle prenotazioni.`;
const PROMPT = `Leggi la mia nota "Lancio prenotazioni del bar, settimana del 23 novembre". Proponi qui in chat eventuali spostamenti tra le quattro liste della matrice Eisenhower. Valuta l'importanza rispetto al risultato indicato e l'urgenza rispetto alle scadenze e alle conseguenze scritte nella nota. Spiega ogni spostamento. Se manca un'informazione, chiedimela. Non inventare scadenze e non dare per scontato che un'altra persona possa accettare un compito. Non modificare la nota finché non approvo le proposte.`;
const FAQ = [
  { q: "Come creare una matrice Eisenhower in Note?", a: ["Usa una nota con quattro intestazioni: da fare, da pianificare, da delegare o ridurre, da scartare. Metti un elenco di controllo sotto ciascuna."] },
  { q: "Serve una tabella con quattro riquadri?", a: ["No. Quattro elenchi lasciano spazio per scadenza e motivo di ogni attività, e permettono di spuntarla."] },
  { q: "Dove va un'attività urgente ma poco importante?", a: ["Controlla cosa succede se aspetta e quanto aiuta il risultato. Puoi chiedere a una persona adatta di occuparsene, ridurre il lavoro o rinunciare."] },
  { q: "Che cosa va nella lista Da pianificare?", a: ["Il lavoro importante che non richiede un'azione immediata. Scrivere una data nella nota non prenota il tempo sul calendario."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="matrice-eisenhower-note-iphone"
  intro={<>Crea una matrice Eisenhower in Note con quattro elenchi: da fare, da pianificare, da delegare o ridurre, da scartare. Copia l'esempio e ordina le tue attività per urgenza e importanza.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" },
    { href: "#ordinare", label: "Ordina le attività" }, { href: "#limiti", label: "Conosci i limiti" },
    { href: "#pinto", label: "Rivedi con l'AI" },
  ]}><p>Scrivi il risultato da raggiungere sopra le quattro liste. Per ogni attività, indica perché si trova lì. L'esempio riguarda il lancio della pagina prenotazioni di un bar.</p>
    <PostCta slug="it/matrice-eisenhower-note-iphone" path="/it/blog/matrice-eisenhower-note-iphone" position="answer" ui={ui.cta} title="Controlla le priorità in Pinto Notes"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo aver collegato ChatGPT o Claude, puoi chiedergli di leggere la nota e proporre spostamenti motivati.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="modello">Il modello: quattro liste con un motivo</h2>
  <p>Il modulo guasto blocca le prove di oggi. La guida serve prima del lancio, ma può aspettare giovedì. Alla chiamata facoltativa basta dare una risposta oggi.</p>
  <Keep title="Matrice Eisenhower per Note" text={TEMPLATE} note="Il testo si copia senza formattazione. Trasforma i titoli in intestazioni e le attività in elenchi di controllo." />
  <h2 id="preparare">Prepara la nota su Mac o iPhone</h2>
  <p>Usa una nota su iCloud o sul dispositivo. Alcune funzioni di formattazione non sono disponibili con account di altri provider.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Pulsante Formattazione", "Intestazione"] }, { on: "iPhone", steps: ["Pulsante Formattazione", "Stile intestazione"] }]} />
  <p>Sul Mac incolla il testo e sostituisci risultato e attività. Applica uno stile intestazione ai quattro titoli. Seleziona solo i paragrafi delle attività sotto ciascuno e trasformali in elenchi di controllo.</p>
  <p>Su iPhone tocca Nuova nota, scrivi titolo, risultato e data della verifica. Usa Formattazione per ogni intestazione. Sotto, tocca Elenco di controllo e inserisci le attività; Invio ne aggiunge un'altra. Tocca il cerchio per segnare un'attività completata. Puoi spuntare anche una voce scartata quando hai deciso di non farla.</p>
  <p>Sul Mac puoi duplicare la nota dal menu File per un altro progetto. Leggi anche la <a href="/blog/apple-notes-templates">guida ai modelli per Note</a>.</p>
  <h2 id="ordinare">Valuta importanza e urgenza</h2>
  <p>Chiediti prima se l'attività aiuta il risultato. Poi considera scadenze e conseguenze se aspetta. Un termine, da solo, non rende importante un'attività.</p>
  <ul><li>Da fare: il modulo guasto impedisce le prove di oggi.</li><li>Da pianificare: la guida serve al lancio. Riserva il tempo sul calendario separatamente.</li><li>Da delegare o ridurre: chiedi a Luca prima di assegnargli il banner.</li><li>Da scartare: conserva la decisione di non cercare altri temi.</li></ul>
  <p>Se lavori da solo, la terza lista può significare fare una versione più piccola o declinare una richiesta. Spostare una riga non trasferisce la responsabilità. Alla verifica successiva rileggi le voci aperte. Puoi usare la <a href="/it/blog/weekly-review-note-iphone">revisione settimanale</a> per ripensare al risultato.</p>
  <h2 id="limiti">Dove si ferma la matrice</h2>
  <p>Le liste registrano le tue scelte. Non fissano appuntamenti sul calendario e non inviano richieste alle persone nominate. Sposta le attività quando cambiano i motivi.</p>
  <h2 id="pinto">Rivedi la nota con ChatGPT o Claude</h2>
  <p>Pinto Notes ha intestazioni ed elenchi di controllo. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> e scelto Allow, l'AI può leggere e modificare le note. Chiedi prima una proposta, senza modifiche.</p>
  <Keep title="Chiedi una verifica delle priorità" text={PROMPT} note="Sostituisci il titolo della nota. Controlla le proposte rispetto ai tuoi impegni." />
  <p>Se suggerisce di rinviare il modulo guasto, ricorda che le prove dipendono da quello. Correggi scadenze inventate. Dopo aver approvato i cambiamenti, chiedi di aggiornare la nota. Pinto conserva le versioni precedenti. Puoi <a href="/blog/move-from-apple-notes">importare le note di Apple sul Mac</a> senza modificarle nell'app originale.</p>
  </LocalPostPage>; }
