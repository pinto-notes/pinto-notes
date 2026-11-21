import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "inventario-casa-note-iphone");

// Italian version of /blog/apple-notes-home-inventory-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "inventario domestico" returned that phrase,
// "inventario domestico excel" and "app inventario domestico"; "inventario casa modello"
// returned only a holiday-rental variant. No exact Notes demand inferred.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd0a136b9cc/mac
// (Formato > Tabella and text conversion), apd93c815aa0/mac (checklist), not95edd2813/mac
// (attachments, Photos/Finder, Exchange limit), it-it/guide/iphone/iph1ac0b3a2/ios
// (Intestazione, table and checklist icons), iph23f4d9aa9/ios (attachments, Condividi > Note).
// Icon-only buttons are described. No picture in the English post.

const ui = UI.it;

const TEMPLATE = `Inventario del soggiorno
Stanza: soggiorno
Ultimo controllo: 21 novembre 2026

Oggetto\tScheda
S-01: radio DAB\tMatricola annotata; ricevuta e foto da allegare
S-02: tavolino in rovere\tNessuna matricola; ricevuta mancante; foto da allegare

S-01: radio DAB
Stanza e posizione: soggiorno, mensola accanto alla finestra
Marca e modello: Roberts Play 10
Numero di serie: ESEMPIO-S01-2047 (inventato)
Acquisto: 8 marzo 2025
Prezzo pagato: 59 €, non è una valutazione attuale
Ricevuta: S-01-ricevuta.pdf, da allegare sotto questa scheda
Foto: S-01-fronte.jpg e S-01-etichetta.jpg, da allegare sotto
Condizioni: piccolo graffio accanto alla manopola del volume

S-02: tavolino in rovere
Stanza e posizione: soggiorno, davanti al divano
Marca e modello: senza marca, rovere massello, 90 x 50 cm
Numero di serie: non presente
Acquisto: 12 giugno 2023, usato
Prezzo pagato: 75 €, non è una valutazione attuale
Ricevuta: mancante, pagato in contanti
Foto: S-02-tavolino.jpg, da allegare sotto questa scheda
Condizioni: alone d'acqua sull'angolo sinistro

Da completare
Allegare la ricevuta della radio
Allegare le foto del fronte e dell'etichetta della radio
Allegare la foto del tavolino
Confrontare il numero di serie della radio con l'etichetta
`;

const FAQ = [
  { q: "Posso fare un inventario di casa in Note di Apple?", a: ["Sì. Usa una nota per stanza, con una scheda per oggetto, numero di serie, ricevuta e foto. Copia il modello e sostituisci i dati inventati."] },
  { q: "Come aggiungo le foto delle ricevute?", a: ["Su iPhone usa il pulsante degli allegati nella nota e scegli una foto. Per un PDF in File, aprilo, tocca Condividi, poi Note e scegli la nota. Sul Mac trascina il file dal Finder nella nota."] },
  { q: "La nota calcola il valore per l'assicurazione?", a: ["No. Registra cosa possiedi e quanto hai pagato. Non calcola il valore attuale o il costo di sostituzione e non costituisce un'approvazione dell'assicurazione."] },
  { q: "Cosa scrivo se un oggetto non ha un numero di serie?", a: ["Scrivi 'non presente' se hai controllato, oppure 'da verificare' se devi ancora guardare. Descrizione e foto restano utili anche senza matricola."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="inventario-casa-note-iphone"
    intro={<>Copia questo inventario di casa in Note di Apple, una stanza per nota. Ogni oggetto ha spazio per numero di serie, ricevuta e foto.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modello", label: "Copia il modello" }, { href: "#impostazione", label: "Tabella e checklist" },
      { href: "#foto", label: "Ricevute e foto" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Usalo in Pinto Notes" },
    ]}><p>In Note di Apple puoi tenere una nota per stanza, con una breve tabella degli oggetti e le schede dettagliate sotto. Sostituisci i dati dell'esempio e allega ricevute e foto accanto all'oggetto giusto. La nota non valuta i beni.</p>
      <PostCta slug="it/inventario-casa-note-iphone" path="/it/blog/inventario-casa-note-iphone" position="answer" ui={ui.cta} title="Aggiorna le schede con l'AI">
        <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere e modificare l'inventario con i dati che gli fornisci.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modello">Il modello: una stanza alla volta</h2>
    <p>L'esempio del soggiorno contiene una radio e un tavolino usato. Numero di serie e nomi dei file sono inventati: copiare il testo non allega i file. Sostituisci anche marca e modello.</p>
    <Keep title="Inventario domestico per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
      note="Incolla come testo normale. Trasforma le tre righe con tabulazioni in una tabella e Da completare in un elenco di controllo." />
    <p>Ripeti il codice dell'oggetto sulla scheda e sugli allegati. S-01 collega la radio a ricevuta e foto. Scrivi «da verificare» per i dati ancora da controllare e «mancante» per una ricevuta che non trovi.</p>
    <h2 id="impostazione">Crea la tabella e l'elenco di controllo</h2>
    <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"] }, { on: "iPhone", steps: ["Pulsante della tabella"] }]} />
    <p>Sul Mac seleziona le tre righe da Oggetto a S-02 e usa il pulsante della tabella. Ogni tabulazione diventa una colonna. Puoi anche creare una tabella vuota con Formato &gt; Tabella e inserire le righe. Il tasto Tabulatore nell'ultima cella ne aggiunge una. Apple descrive i controlli nella <a href="https://support.apple.com/it-it/guide/notes/apd0a136b9cc/mac">guida per Mac</a>.</p>
    <p>Su iPhone crea una tabella e inserisci Oggetto e Scheda nelle due colonne. Trasferisci le due righe di esempio nelle celle, poi elimina le righe di testo. Per le sezioni, seleziona il nome e scegli Intestazione dal controllo di formattazione. Vedi la <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple per iPhone</a>.</p>
    <p>Sul Mac seleziona le quattro attività sotto Da completare e trasformale in elenco di controllo. Su iPhone avvia l'elenco e inserisci una voce per riga. Spunta solo dopo aver allegato il file o riempito il campo. La <a href="https://support.apple.com/it-it/guide/notes/apd93c815aa0/mac">guida Apple agli elenchi</a> spiega la conversione.</p>
    <p>Lascia la tabella breve e metti i dettagli sotto. Vedi anche le <a href="/blog/apple-notes-tables">tabelle</a> e gli <a href="/blog/apple-notes-templates">altri modelli per Note</a> (guide in inglese).</p>
    <h2 id="foto">Allega ricevute e foto all'oggetto giusto</h2>
    <p>Fotografa l'oggetto intero e l'etichetta con il numero di serie. Metti i file sotto la sua scheda, fuori dalla tabella. Scrivi anche la matricola e confrontala con la foto.</p>
    <p>Su iPhone usa il pulsante degli allegati e scegli una foto. Per una ricevuta PDF in File, aprila, tocca Condividi, poi Note, e scegli la nota della stanza. Apple descrive entrambi i percorsi nella <a href="https://support.apple.com/it-it/guide/iphone/iph23f4d9aa9/ios">guida agli allegati</a>.</p>
    <p>Sul Mac trascina i PDF dal Finder e le foto dall'app Foto. Usa una nota iCloud: Apple dice che le note Exchange non possono contenere file allegati. Vedi la <a href="https://support.apple.com/it-it/guide/notes/not95edd2813/mac">guida per Mac</a>.</p>
    <p>Se un oggetto esce di casa, registra quando lo vendi, doni o elimini. Dopo un acquisto, aggiungi la scheda finché hai ancora la ricevuta. Tieni riparazioni e attività ricorrenti in una <a href="/it/blog/manutenzione-casa-note-iphone">checklist di manutenzione</a> separata.</p>
    <h2 id="limiti">I limiti</h2>
    <p>Il prezzo pagato non è il valore attuale né una stima del costo di sostituzione. La nota non dà alcuna approvazione assicurativa. Chiedi alla compagnia quali documenti servono per un eventuale sinistro.</p>
    <p>Devi controllare etichette, allegare file e aggiornare la tabella. Un nome di file scritto non prova che l'allegato esista. Apri ricevute e foto dopo averle aggiunte e conserva una copia separata degli originali.</p>
    <h2 id="pinto-notes">Tieni l'inventario in Pinto Notes</h2>
    <p>Puoi usare lo stesso testo in Pinto Notes, che supporta tabelle e allegati. Non c'è un modello di inventario domestico pronto per questo articolo: copia quello qui sopra.</p>
    <p>Quando <a href="/blog/connect-chatgpt-to-your-notes">colleghi ChatGPT</a> (guida in inglese), può leggere e modificare le note; anche Claude può farlo. Il pulsante Consenti concede entrambe le autorizzazioni. Chiedi: «Elenca gli oggetti con ricevuta mancante o numero di serie da verificare. Non inventare dati». Controlla il risultato sulle schede.</p>
    <p>Pinto può esportare le note come file Markdown in uno ZIP con gli allegati recuperabili. Controlla il riepilogo: le note protette con password, Face ID o Touch ID possono essere saltate e i file non scaricabili sono indicati come mancanti. Apri ricevute e foto esportate prima di considerare completa la copia.</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
