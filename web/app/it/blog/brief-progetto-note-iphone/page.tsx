import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "brief-progetto-note-iphone");

// Italian version of /blog/apple-notes-project-brief-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "brief progetto" returned "brief progetto" and "brief di progetto";
// "modello brief di progetto" returned no suggestions. Title uses the attested "brief di progetto".
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/not9474646a9/mac (Nuova nota,
// File > Duplica nota), apd1955d3b21/mac (Intestazione), apd93c815aa0/mac (checklist),
// apd0a136b9cc/mac (Formato > Tabella and selected text conversion), and
// it-it/guide/iphone/iph1ac0b3a2/ios (Intestazione, checklist and table icon buttons).
// The icon-only buttons are described, not assigned invented names. No picture in the English post.

const ui = UI.it;

const TEMPLATE = `Brief di progetto: pagina per il ritiro, Caffè Olmo

Responsabile: Sara Riva
Approva: Amir Khan, gestore del bar
Consegna prevista: 4 dicembre 2026
Stato: bozza, in attesa della revisione di Amir

Risultato
I clienti trovano il menu per il ritiro e ordinano dal sito del bar usando il telefono.
Nella prima settimana Amir conta le chiamate di chi non trova dove ordinare. Rivede il totale l'11 dicembre.

Compreso nel progetto
Una pagina per il ritiro con menu, prezzi e orari aggiornati.
Un link al servizio di ordinazione già in uso.
Un link Ritiro nel menu del sito.

Escluso dal progetto
Consegne a domicilio, un nuovo sistema di pagamento e modifiche al servizio di ordinazione.
Foto nuove e rifacimento del resto del sito.

Criteri di accettazione
Amir ha confrontato ogni voce e prezzo con il menu esposto al banco.
La pagina indica orari e punto di ritiro.
Il link Ritiro apre la pagina su iPhone e Mac di Sara.
Un ordine di prova raggiunge la schermata del servizio di ordinazione già in uso.

Questioni aperte
Domanda\tResponsabile e risposta entro
Chi aggiorna il menu dopo il lancio?\tAmir, entro il 25 novembre
Cosa mostrare quando il ritiro è chiuso?\tSara propone il testo, Amir approva entro il 26 novembre

Approvazione
Amir conferma ambito e criteri di accettazione entro il 27 novembre.
Dopo l'approvazione, annotare qui ogni modifica all'ambito, con data ed effetto sulla consegna.
`;

const FAQ = [
  { q: "Note di Apple include un modello di brief di progetto?", a: ["No. Copia il testo di questa pagina in una nota, sostituisci l'esempio e usa intestazioni, elenchi di controllo e tabelle di Note per formattarlo."] },
  { q: "Come si scrivono i criteri di accettazione?", a: ["Scrivi controlli che la persona incaricata possa eseguire. Un ordine di prova che arriva alla schermata giusta è più verificabile di una pagina 'facile da usare'."] },
  { q: "Che differenza c'è tra brief e piano di progetto?", a: ["Il brief fissa risultato, limiti, responsabili e condizioni di completamento. Il piano divide il lavoro concordato in attività e date. Il brief deve restare breve da esaminare prima di iniziare."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="brief-progetto-note-iphone"
    intro={<>Copia questo brief di progetto in Note di Apple per concordare cosa consegnare e come verificarlo. L'esempio riguarda la pagina per il ritiro di un bar.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modello", label: "Copia il brief" }, { href: "#impostazione", label: "Preparalo in Note" },
      { href: "#accordo", label: "Concorda l'ambito" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Rivedilo con l'AI" },
    ]}><p>Usa una nota per progetto. Metti in alto risultato e responsabile, poi ciò che è incluso ed escluso, e infine i criteri da verificare. Copia l'esempio e adattalo al tuo lavoro.</p>
      <PostCta slug="it/brief-progetto-note-iphone" path="/it/blog/brief-progetto-note-iphone" position="answer" ui={ui.cta} title="Vuoi controllare il brief?">
        <p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere il brief e modificarlo quando glielo chiedi.</p>
      </PostCta></Answer>}
    hero={<></>} faq={FAQ}>
    <h2 id="modello">Il modello: definisci quando il lavoro è finito</h2>
    <p>L'esempio usa il servizio di ordinazione già esistente. Aggiungere i pagamenti cambierebbe l'ambito del lavoro. Sostituisci nomi e date, poi riscrivi ogni criterio in modo che si possa verificare.</p>
    <Keep title="Brief di progetto per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
      note="Copia come testo normale. Aggiungi intestazioni, elenco di controllo e tabella con i passaggi qui sotto." />
    <h2 id="impostazione">Preparalo in Note di Apple</h2>
    <p>Sul Mac crea una nota e incolla il testo. Seleziona il nome di ogni sezione e scegli Intestazione dal controllo di formattazione. Usa note iCloud o salvate sul Mac per queste opzioni.</p>
    <Paths rows={[
      { on: "Mac", steps: ["Seleziona i criteri", "Pulsante dell'elenco di controllo"] },
      { on: "Mac", steps: ["Seleziona le righe delle domande", "Formato", "Tabella"] },
      { on: "iPhone", steps: ["Seleziona il nome della sezione", "Controllo di formattazione", "Intestazione"] },
    ]} />
    <p>Seleziona i quattro paragrafi sotto Criteri di accettazione e usa il pulsante dell'elenco di controllo. Ogni paragrafo diventa una voce. Spuntala soltanto dopo la verifica: assegnare un'attività non prova che il criterio sia soddisfatto.</p>
    <p>Tra domanda e responsabile c'è una tabulazione. Sul Mac seleziona le tre righe della sezione e trasformale in tabella. Ogni tabulazione diventa una colonna. Puoi anche creare una tabella vuota con Formato &gt; Tabella e inserire le voci. Il tasto Tabulatore nell'ultima cella aggiunge una riga. Altri esempi sono nella <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
    <p>Su iPhone incolla il testo e applica Intestazione ai nomi delle sezioni. Per i criteri, crea un elenco di controllo e inserisci una voce alla volta. Per le questioni, crea una tabella con il pulsante della tabella e inserisci domande e responsabili in celle separate.</p>
    <p>Per un nuovo progetto sul Mac, seleziona la nota e scegli File &gt; Duplica nota. Sostituisci l'esempio ed elimina la vecchia approvazione. Anche una copia richiede una nuova verifica dell'ambito.</p>
    <h2 id="accordo">Rivedi il brief prima di iniziare</h2>
    <p>Nel caso del bar, la consegna è una pagina per il ritiro. Il risultato atteso è che i clienti ordinino dal telefono. Il conteggio delle chiamate nella prima settimana aiuta Amir a valutare l'esito, ma è distinto dai controlli necessari per pubblicare la pagina.</p>
    <p>Fai leggere a chi approva sia le esclusioni sia le attività previste. Se ora servono le consegne a domicilio, aggiorna l'ambito e rivedi la data prima di aggiungere attività. Lascia lo stato su Bozza fino alla conferma.</p>
    <p>Assegna ogni questione aperta a una persona e indica quando serve la risposta. Poi aggiorna il brief. Se devi conservare il motivo di una scelta, usa un <a href="/it/blog/registro-decisioni-note-iphone">registro delle decisioni</a> separato.</p>
    <h2 id="limiti">I limiti</h2>
    <p>Date e nomi sono testo da aggiornare. La scadenza di una risposta non invia notifiche né raccoglie l'approvazione. Scrivi tu la data della conferma.</p>
    <p>Una spunta registra un controllo, ma non esegue l'ordine di prova e non verifica il menu. Se cambia l'ambito, ricontrolla i criteri interessati e togli le spunte non più valide. Tieni le attività quotidiane nel piano di progetto.</p>
    <h2 id="pinto-notes">Rivedi il brief con ChatGPT o Claude</h2>
    <p>Puoi copiare questo testo in Pinto Notes e modificarlo con intestazioni, elenchi di controllo e tabelle. Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese), l'AI può leggere e modificare la nota.</p>
    <p>Chiedi: «Leggi il brief del Caffè Olmo. Quali criteri sono troppo vaghi per essere verificati? Proponi un testo più preciso ed elenca le questioni aperte». Rivedi le proposte, poi chiedi di applicare quelle che accetti. L'approvazione e i controlli restano alle persone incaricate.</p>
    <p>Pinto conserva le versioni precedenti di una nota e può ripristinarne una. Il ripristino conserva anche il testo sostituito. Copia il modello qui sopra per iniziare.</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
