import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "organizzare-matrimonio-note-iphone");

// Italian version of /blog/apple-notes-wedding-planner-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "lista matrimonio" returned "lista matrimonio cose da fare"
// and "lista matrimonio invitati"; "organizzare matrimonio" returned that phrase and
// "organizzare matrimonio civile". Exact Notes seed returned no suggestion.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd0a136b9cc/mac (Formato > Tabella),
// apd93c815aa0/mac (checklist), it-it/guide/iphone/iph1ac0b3a2/ios (Intestazione,
// icon-only table/checklist controls), iphe4d04f674/27/ios/27 (Condividi un link,
// Apple Account, iCloud and Modifica permission). No picture in the English post.

const ui = UI.it;

const TEMPLATE = `Matrimonio di Giulia e Samuele, 19 giugno 2027

Luogo: Villa dei Gelsi, Bologna
Limite invitati: 48
Conferma entro: 31 maggio 2027
Numero definitivo alla villa entro: 5 giugno 2027
Ultima revisione: 21 novembre 2026

Invitati, righe di esempio
Invitato\tRisposta e menu
Lena Rossi\tSì; vegetariano
Alessio Chen\tSì; carne
Nora Patel\tIn attesa; menu da definire
Benedetto Carli\tNo; ha declinato il 20 novembre

Fornitori
Fornitore\tDecisione e prossima data
Villa dei Gelsi\tPrenotata; inviare il numero definitivo entro il 5 giugno
Catering Ulivo\tPreventivo ricevuto; degustazione il 28 novembre
Studio Giugno, foto\tIn valutazione; chiedere la copertura della cerimonia

Prossime azioni
Giulia: confermare l'ora della degustazione con Catering Ulivo entro il 24 novembre
Samuele: chiedere a Studio Giugno della copertura della cerimonia entro il 25 novembre
Giulia: aggiungere gli invitati mancanti all'elenco entro il 29 novembre
Samuele: segnare saldo e scadenza della villa nel budget entro il 30 novembre

Questioni aperte
Il catering può offrire un piatto vegano oltre a quello vegetariano?
Chi porterà a casa i fiori dopo il ricevimento?
`;

const FAQ = [
  { q: "Come preparo un piano per il matrimonio in Note di Apple?", a: ["Incolla questo modello in una nota. Sul Mac trasforma i blocchi con tabulazioni in tabelle e le prossime azioni in elenco di controllo. Sostituisci i dati inventati."] },
  { q: "Il mio partner può modificare la stessa nota?", a: ["Sì, se è una nota iCloud. Entrambi devono avere un Apple Account con Note attivo su iCloud. Su iOS 27 apri il menu di condivisione sotto il titolo, scegli Condividi un link e consenti la modifica."] },
  { q: "La lista raccoglie le conferme degli invitati?", a: ["No. Inserisci tu ogni risposta. Tieni In attesa distinto da No. Il modello non invia inviti, non raccoglie risposte e non aggiorna il totale da solo."] },
  { q: "ChatGPT può aggiornare il piano in Pinto Notes?", a: ["Dopo il collegamento può leggere e modificare le note con le risposte e i dettagli dei fornitori che gli comunichi. Il modello non riceve direttamente le risposte degli invitati."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="organizzare-matrimonio-note-iphone"
    intro={<>Copia questo piano per il matrimonio in Note di Apple. Include invitati e risposte, fornitori e prossime azioni. L'esempio mostra come prepararlo su iPhone e Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modello", label: "Copia il modello" }, { href: "#impostazione", label: "Preparalo" },
      { href: "#aggiornare", label: "Tienilo aggiornato" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Aggiornalo con l'AI" },
    ]}><p>Usa una nota con una tabella per gli invitati, una per i fornitori e un elenco di controllo con persona e data per ogni attività. Copia il modello e poi crea tabelle ed elenco con i controlli di Note.</p>
      <PostCta slug="it/organizzare-matrimonio-note-iphone" path="/it/blog/organizzare-matrimonio-note-iphone" position="answer" ui={ui.cta} title="Aggiorna il piano con l'AI">
        <p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere la nota e aggiornarla con le risposte e i dettagli che gli dai.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modello">Il modello: invitati e prossime decisioni</h2>
    <p>Questo esempio è per il matrimonio di Giulia e Samuele. Le righe degli invitati sono solo un campione. Aggiungi tutte le persone, una per riga anche se sono una coppia, così ogni risposta e scelta del menu ha un nome.</p>
    <Keep title="Piano del matrimonio per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
      note="Incolla come testo normale. Le colonne sono separate da tabulazioni. Prepara tabelle ed elenco separatamente." />
    <h2 id="impostazione">Preparalo in Note di Apple</h2>
    <Paths rows={[
      { on: "Mac, tabelle", steps: ["Formato", "Tabella"] },
      { on: "Mac, attività", steps: ["Seleziona le righe", "Pulsante dell'elenco di controllo"] },
      { on: "iPhone, tabelle", steps: ["Pulsante della tabella"] },
      { on: "iPhone, attività", steps: ["Pulsante dell'elenco di controllo"] },
    ]} />
    <p>Sul Mac seleziona le cinque righe da Invitato a Benedetto e trasformale in tabella. Ogni tabulazione diventa una colonna. Ripeti con le quattro righe dei fornitori. Puoi anche scegliere Formato &gt; Tabella. Il tasto Tabulatore nell'ultima cella aggiunge una riga. Apple descrive i controlli nella <a href="https://support.apple.com/it-it/guide/notes/apd0a136b9cc/mac">guida alle tabelle</a>.</p>
    <p>Seleziona solo le quattro prossime azioni e usa il pulsante dell'elenco di controllo. Lascia le risposte degli invitati come testo: non aver risposto è diverso da aver declinato.</p>
    <p>Su iPhone crea una nota. Per ciascuna tabella usa il pulsante della tabella e inserisci due colonne. Per le attività avvia un elenco di controllo. Per i nomi delle sezioni seleziona il testo e scegli Intestazione dal controllo di formattazione. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple</a> mostra i pulsanti. Se preferisci, tieni gli elenchi come testo normale.</p>
    <h2 id="aggiornare">Tieni aggiornato il piano</h2>
    <p>Quando arriva una risposta, cambia subito la riga: Sì, No o In attesa, poi il menu. Riporta le esigenze alimentari con le parole dell'invitato e chiarisci i dubbi prima di inviare la lista al catering. Riconta i sì prima della scadenza della villa. Il limite in alto è la capienza, non il numero confermato.</p>
    <p>Accanto a ogni fornitore scrivi lo stato. Un preventivo ricevuto non equivale a una prenotazione. Dopo una decisione, aggiorna lo stato e aggiungi l'azione successiva. Tieni costi e pagamenti in una nota di <a href="/it/blog/budget-mensile-note-iphone">budget</a> separata.</p>
    <p>Rivedete le attività aperte una volta alla settimana. Assegnate persona e data alle nuove voci e aggiornate Ultima revisione. Per modificare insieme una nota iCloud su iOS 27, apri la condivisione, tocca il menu sotto il titolo e scegli Condividi un link. Entrambi devono avere un Apple Account con Note attivo su iCloud. La <a href="https://support.apple.com/it-it/guide/iphone/iphe4d04f674/27/ios/27">guida Apple alla condivisione</a> spiega i permessi.</p>
    <h2 id="limiti">I limiti</h2>
    <p>Questo è un registro manuale. Non contiene un modulo per le risposte, un conteggio automatico o una pianta dei tavoli. Una data scritta non crea un avviso. Imposta promemoria separati per le scadenze importanti.</p>
    <p>Poche righe funzionano bene in una nota. Se devi filtrare molti invitati per menu o confrontare totali, usa un foglio di calcolo per quella parte. Tieni la nota per decisioni e prossime azioni. La <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese) ne spiega i limiti.</p>
    <h2 id="pinto-notes">Aggiorna la nota con ChatGPT o Claude</h2>
    <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, con tabelle ed elenchi di controllo. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese), l'AI può leggere e modificare le note. Il pulsante Consenti concede entrambe le autorizzazioni.</p>
    <p>Per esempio: «Nella nota del matrimonio di Giulia e Samuele, Nora ha risposto sì e vuole il menu vegano. Aggiungi per Giulia l'attività di confermare l'opzione con Catering Ulivo entro il 24 novembre». Controlla riga e attività sulla risposta ricevuta. Sei tu a fornire le informazioni.</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
