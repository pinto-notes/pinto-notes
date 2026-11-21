import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "procedura-operativa-standard-note-iphone");

// Italian version of /blog/apple-notes-sop-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "procedura operativa standard" returned that phrase,
// "procedura operativa standard modello" and "procedura operativa standard pdf";
// "modello sop" was unrelated. Exact Notes seed returned no suggestion.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd93c815aa0/mac
// (checklist and Formato > Altro > Deseleziona tutti), apd0a136b9cc/mac
// (Formato > Tabella), not9474646a9/mac (File > Duplica nota),
// it-it/guide/iphone/iph1ac0b3a2/ios (Intestazione, table and checklist icon buttons).
// Icon-only buttons are described. No picture in the English post.

const ui = UI.it;

const TEMPLATE = `Procedura: inviare il rapporto settimanale al cliente

Quando: venerdì alle 14:00, dopo aver registrato il lavoro della settimana.
Responsabile: Giulia, referente del cliente. Sostituto: Leone.
Risultato: Studio Strada Nord riceve un rapporto corretto entro le 16:00.
Materiale: registro del lavoro settimanale ed elenco aggiornato dei contatti del cliente.
Versione: 1.2, aggiornata il 20 novembre 2026.
Revisione: 18 dicembre 2026. Giulia ne è responsabile.

Passaggi
1. Apri il registro di Studio Strada Nord. Usa i dati da lunedì a venerdì di questa settimana.
2. Copia il lavoro completato in un nuovo rapporto. Metti quello incompleto sotto Prossima settimana.
3. Aggiungi le ore per ogni lavoro finito. Confronta il totale con il registro.
4. Esporta il rapporto in PDF come StudioStradaNord-settimana-2026-11-20.pdf. Cambia la data ogni settimana.
5. Apri il PDF esportato. Leggi ogni pagina e controlla cliente e settimana.
6. Esegui i controlli qui sotto. Invia il PDF per email al contatto nell'elenco aggiornato.
7. In una nota datata, registra ora d'invio e mittente. Annota lì le eccezioni.

Eccezioni
Se\tCosa fare
Le ore non coincidono con il registro\tFermati. Chiedi a chi le ha registrate di correggere il dato, poi esporta di nuovo.
Giulia è assente\tLeone esegue la procedura e scrive il proprio nome nella nota dell'esecuzione.
Il rapporto non può partire entro le 16:00\tAvvisa il cliente prima delle 16:00 con una nuova ora. Registrala nella nota.

Controlli prima dell'invio
Nome del cliente e settimana coincidono con il registro.
Le ore coincidono con la fonte; il lavoro incompleto non è contato come finito.
Il PDF esportato si apre e contiene tutte le pagine.
Il destinatario corrisponde all'elenco aggiornato dei contatti.

Registro dell'esecuzione
20 novembre 2026, 15:42. Giulia ha inviato il rapporto. Nessuna eccezione.

Registro delle modifiche
20 novembre 2026, v1.2. Aggiunto il controllo di apertura del PDF dopo un'esportazione vuota.
`;

const FAQ = [
  { q: "Posso scrivere una procedura operativa standard in Note?", a: ["Sì. Tieni una procedura per nota, con momento di avvio, responsabile, passaggi numerati, eccezioni, controlli e data di revisione. Puoi copiare e adattare l'esempio."] },
  { q: "I passaggi vanno numerati o spuntati?", a: ["Usa i numeri se l'ordine conta. Tieni un elenco di controllo separato per le verifiche finali. Lascia intatta la procedura principale e registra ogni esecuzione in una nota datata."] },
  { q: "Ogni quanto rivedo la procedura?", a: ["Scegli una data adatta al lavoro e assegna la revisione. Anticipala se un'eccezione rivela un passaggio mancante o cambia una fonte. La data scritta richiede un promemoria separato."] },
  { q: "Pinto Notes può ripristinare una versione precedente?", a: ["Sì. Pinto conserva le versioni delle note e può ripristinarne una. Il ripristino conserva anche il testo sostituito. Tieni comunque un registro scritto dei motivi delle modifiche."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="procedura-operativa-standard-note-iphone"
    intro={<>Copia questa procedura operativa standard in Note di Apple per un'attività ricorrente. Contiene responsabile, passaggi, eccezioni, controlli e data di revisione.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modello", label: "Copia la procedura" }, { href: "#impostazione", label: "Preparala" },
      { href: "#uso", label: "Esegui e rivedi" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Versioni precedenti" },
    ]}><p>Usa una nota per procedura, con passaggi numerati e una checklist per i controlli finali. Copia l'esempio del rapporto settimanale, sostituisci i dettagli e provalo durante un'esecuzione reale. Tieni separata la procedura dal registro delle esecuzioni.</p>
      <PostCta slug="it/procedura-operativa-standard-note-iphone" path="/it/blog/procedura-operativa-standard-note-iphone" position="answer" ui={ui.cta} title="Conserva le versioni della procedura">
        <p>Pinto Notes funziona come Note di Apple su iPhone e Mac e conserva le versioni precedenti delle note. Dopo il collegamento, ChatGPT o Claude può leggere e modificare la procedura.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modello">Il modello: inviare un rapporto ogni settimana</h2>
    <p>La persona dell'esempio invia lo stesso tipo di rapporto ogni venerdì. Cambia cliente, documenti e scadenza. Se lavori da solo, metti il tuo nome come responsabile e togli il sostituto se non c'è.</p>
    <Keep title="Procedura per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
      note="Incolla in una nota. Trasforma i quattro controlli in una checklist e le quattro righe delle eccezioni in una tabella." />
    <p>Ogni passaggio deve indicare un'azione e un risultato verificabile. «Controlla il rapporto» è vago. «Apri il PDF esportato» dice quale file guardare. Tieni vicine ai passaggi le condizioni che impongono di fermarsi.</p>
    <h2 id="impostazione">Preparala in Note di Apple</h2>
    <Paths rows={[{ on: "Mac, eccezioni", steps: ["Formato", "Tabella"] }, { on: "iPhone, sezioni", steps: ["Controllo di formattazione", "Intestazione"] }]} />
    <ol>
      <li>Incolla il testo in una nuova nota. Su iPhone usa il pulsante per creare una nota. La prima riga diventa il titolo. Seleziona i nomi delle sezioni e applica Intestazione.</li>
      <li>Sul Mac seleziona i quattro paragrafi sotto Controlli prima dell'invio e usa il pulsante dell'elenco di controllo. Su iPhone crea un elenco e inserisci i quattro controlli. Lascia i passaggi numerati nell'ordine previsto.</li>
      <li>Sul Mac seleziona le quattro righe da Se all'ultima eccezione e trasformale in tabella. La tabulazione divide condizione e risposta in due colonne. Puoi anche scegliere Formato &gt; Tabella.</li>
      <li>Su iPhone crea una tabella e inserisci le coppie di eccezioni in due colonne. Sul Mac il tasto Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</li>
    </ol>
    <p>Per la checklist sul Mac usa una nota iCloud o salvata sul dispositivo. Alcune funzioni non sono disponibili con account di altri provider. Altri esempi sono nei <a href="/blog/apple-notes-templates">modelli per Note</a> (in inglese).</p>
    <h2 id="uso">Provala e correggi ciò che non è chiaro</h2>
    <p>Segui i passaggi usando il registro e il rapporto veri. Se un'altra persona dovrà sostituirti, chiedile di seguire la nota senza spiegazioni. Annota dove si ferma e precisa il file o la decisione mancante.</p>
    <p>La nota principale resta la procedura. Per registrare ogni venerdì, sul Mac selezionala e scegli File &gt; Duplica nota. Intitola la copia «Rapporto cliente, 27 novembre 2026» ed elimina il registro di esempio. Prima di iniziare, usa Formato &gt; Altro &gt; Deseleziona tutti per azzerare la checklist. Una copia di una nota condivisa non è condivisa.</p>
    <p>Registra chi ha eseguito il lavoro e le eccezioni. Se una situazione può ripetersi, aggiungi la risposta alla procedura principale, aumenta il numero di versione e spiega il motivo. Alla data prevista, il responsabile confronta i passaggi con i documenti correnti.</p>
    <h2 id="limiti">I limiti</h2>
    <p>Una spunta indica che qualcuno ha segnato un controllo, ma non prova che il PDF fosse giusto o che il cliente l'abbia ricevuto. Conserva il messaggio inviato o le prove necessarie. Per la revisione serve un promemoria separato.</p>
    <p>Le copie datate possono confondere. Indica al team qual è la procedura principale, per non usare una vecchia esecuzione come istruzione. Questo modello non fornisce approvazioni formali né un registro di controllo certificato.</p>
    <h2 id="pinto-notes">Rivedi la procedura conservando le versioni</h2>
    <p>Puoi usare il modello in Pinto Notes, che si presenta e funziona come Note di Apple su iPhone e Mac. La <a href="/blog/apple-notes-version-history">cronologia delle versioni</a> (guida in inglese) permette di ripristinare una nota precedente e conserva anche il testo sostituito. Il registro scritto spiega perché hai cambiato un passaggio.</p>
    <p>Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese), può leggere e modificare la procedura. Chiedigli una bozza di eccezione per un registro del lavoro in ritardo, senza cambiare la scadenza. Fagli elencare le ipotesi prima di modificare la nota, poi verifica il testo sul lavoro reale.</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
