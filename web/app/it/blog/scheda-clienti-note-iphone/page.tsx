import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "scheda-clienti-note-iphone");

// Italian version of /blog/apple-notes-client-tracker-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "scheda cliente modello" returned "scheda cliente modello",
// "scheda anagrafica cliente modello" and Word/Excel variants. Exact Notes seed returned none.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd0a136b9cc/mac (Formato > Tabella),
// apd93c815aa0/mac (convert paragraphs to checklist), apde615d29c2/mac (Modifica > Aggiungi link),
// it-it/guide/iphone/iph1ac0b3a2/ios (table and checklist icons), iph908d1558b/ios
// (Avanti > Aggiungi link). Unnamed icon buttons are described. No picture in the English post.

const ui = UI.it;

const TEMPLATE = `Ceramiche del Porto

Contatto
Mara Riva, titolare
mara@ceramichedelporto.example
Preferisce l'email. Per le telefonate, martedì pomeriggio.

Collaborazione
Testi per il sito della collezione invernale.
Mara approva i testi. Leone fornisce le foto dei prodotti.

Situazione attuale
Prima bozza inviata il 18 novembre 2026.
In attesa dei commenti di Mara prima di rivedere le pagine prodotto.
Ultimo contatto: 20 novembre 2026, email di Mara.
Prossimo sollecito: 24 novembre 2026, chiedere i commenti se non arrivano.

Prossime azioni
Chiedere a Mara i commenti il 24 novembre
Confermare quando Leone può inviare le foto degli smalti

Registro dei contatti
20 novembre 2026: Mara conta di leggere la bozza lunedì.
18 novembre 2026: inviata la prima bozza. Mancano due foto degli smalti.

Da ricordare
Usare l'italiano formale. Tenere le istruzioni di cura in ogni pagina prodotto.

Note collegate
Ceramiche del Porto, incontro iniziale, 12 novembre 2026
`;

const INDEX = `Clienti

Cliente\tUltimo contatto\tProssimo sollecito
Ceramiche del Porto\t20 nov 2026\t24 nov, commenti alla bozza
Studio Betulla\t19 nov 2026\t25 nov, disponibilità di gennaio
`;

const FAQ = [
  { q: "Posso seguire i clienti con Note di Apple?", a: ["Sì. Usa una nota per cliente con recapiti, lavoro in corso, ultimo contatto e prossimo sollecito. Una nota indice con una tabella riunisce le date e i link alle schede."] },
  { q: "Cosa deve contenere una scheda cliente tra un incontro e l'altro?", a: ["Scrivi la situazione attuale, la data dell'ultimo scambio e una prossima azione precisa. Aggiungi una breve riga datata dopo ogni contatto. Tieni i dettagli degli incontri in note separate."] },
  { q: "La data del sollecito invia un avviso?", a: ["No. È testo nel modello. Imposta un promemoria separato per le scadenze importanti e consulta l'indice di persona."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="scheda-clienti-note-iphone"
    intro={<>Tieni una scheda per ogni cliente in Note di Apple e una tabella con le date dei prossimi contatti. Copia gli esempi e sostituisci i dati.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#scheda", label: "La scheda cliente" }, { href: "#indice", label: "L'indice" },
      { href: "#aggiornare", label: "Tienila aggiornata" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Usala con l'AI" },
    ]}><p>Una nota per cliente raccoglie recapiti, contatti datati e prossima azione. Una tabella indice mostra quando risentire ciascuno e rimanda alle schede. Devi aggiornarla tu.</p>
      <PostCta slug="it/scheda-clienti-note-iphone" path="/it/blog/scheda-clienti-note-iphone" position="answer" ui={ui.cta} title="Rileggi la storia di un cliente con l'AI">
        <p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Una volta collegato, ChatGPT o Claude può leggere le schede e aggiornare la prossima azione con le informazioni che gli dai.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="scheda">Il modello: una nota per cliente</h2>
    <p>L'esempio riguarda una professionista che aspetta i commenti a una bozza. Le preferenze di contatto sono in alto. La situazione attuale indica subito cosa manca.</p>
    <Keep title="Scheda cliente per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
      note="Incolla come testo normale. Trasforma le due prossime azioni in un elenco di controllo." />
    <p>Sul Mac seleziona le due azioni e usa il pulsante dell'elenco di controllo. Su iPhone avvia l'elenco sotto Prossime azioni e inserisci una voce per riga. Lascia il registro dei contatti come testo datato. Apple spiega i controlli nelle guide per <a href="https://support.apple.com/it-it/guide/notes/apd93c815aa0/mac">Mac</a> e <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">iPhone</a>.</p>
    <p>Per un altro cliente copia la struttura in una nuova nota e sostituisci tutti i dati. Nel registro conserva gli accordi e ciò che aspetti, senza incollare l'intera catena di email.</p>
    <h2 id="indice">L'indice: date e link</h2>
    <p>Crea una nota Clienti. Ogni riga rimanda a una scheda. Nell'ultima colonna basta un motivo breve; il contesto sta nella scheda. Le date dell'esempio corrispondono.</p>
    <Keep title="Indice clienti per Note di Apple" text={INDEX} copyLabel={ui.copy}
      note="Le colonne sono separate da tabulazioni. Sul Mac seleziona le righe e trasformale in tabella." />
    <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"] }]} />
    <p>Seleziona le tre righe dalla riga Cliente all'ultimo cliente e usa il pulsante della tabella. Ogni tabulazione diventa una colonna. Il tasto Tabulatore nell'ultima cella aggiunge una riga. Su iPhone crea una tabella e inserisci le celle a mano. Vedi la <a href="https://support.apple.com/it-it/guide/notes/apd0a136b9cc/mac">guida Apple per Mac</a> e la nostra <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
    <Paths rows={[{ on: "Mac", steps: ["Modifica", "Aggiungi link"] }, { on: "iPhone", steps: ["Avanti", "Aggiungi link"] }]} />
    <p>Trasforma ogni nome in un link. Sul Mac selezionalo, scegli Modifica &gt; Aggiungi link, digita il titolo della scheda, scegli la corrispondenza e conferma. Su iPhone seleziona il nome, tocca Avanti nel menu di modifica e poi Aggiungi link. Digita il titolo, scegli la nota e tocca Fine. Apple dà i passaggi per <a href="https://support.apple.com/it-it/guide/notes/apde615d29c2/mac">Mac</a> e <a href="https://support.apple.com/it-it/guide/iphone/iph908d1558b/ios">iPhone</a>.</p>
    <h2 id="aggiornare">Tieni aggiornata la scheda</h2>
    <p>Dopo una chiamata o un'email, aggiungi una riga con la data. Se gli accordi cambiano, riscrivi la situazione attuale. Spunta l'azione completata e dai una data alla successiva. Aggiorna anche l'indice.</p>
    <p>Prima di chiamare, leggi Situazione attuale e Da ricordare. Se servono ordine del giorno o decisioni dettagliate, usa <a href="/it/blog/appunti-riunione-note-iphone">una nota di riunione</a> separata e collegala sotto Note collegate.</p>
    <h2 id="limiti">I limiti</h2>
    <p>Indice e schede sono testi separati: cambiare una data in una nota non cambia l'altra. Una data scritta non crea un avviso. Imposta un promemoria a parte se serve.</p>
    <p>Questo modello non registra le email, non consulta i contatti e non calcola previsioni di vendita. Se ti serve una pipeline condivisa con responsabili assegnati e solleciti automatici, usa un CRM.</p>
    <h2 id="pinto-notes">Usa le schede con ChatGPT o Claude</h2>
    <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Ha tabelle, elenchi di controllo e link tra note. Crea le schede, poi <a href="/blog/connect-chatgpt-to-your-notes">collega ChatGPT o Claude</a> (guida in inglese) per farle leggere e modificare.</p>
    <p>Prima di rispondere a Mara, chiedi: «Leggi Ceramiche del Porto. Cosa aspettiamo e cosa ha detto Mara sui tempi? Scrivi una breve email usando solo i dati della nota». Controlla la bozza. Dopo la risposta, comunica i nuovi dettagli e chiedi di aggiornare sia la scheda sia l'indice. Non sono solleciti automatici.</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
