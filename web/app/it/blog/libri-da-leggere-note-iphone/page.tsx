import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "libri-da-leggere-note-iphone");

// Italian version of /blog/apple-notes-reading-list (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "lista libri da leggere" gives lista libri da leggere app; "app libri letti" gives app libri letti e da
// leggere and app lista libri letti; "lista di lettura" has no completions. So the slug and title say "libri da
// leggere" plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato > Tabella,
// the Tabulatore in the last cell adds a row, selected lines of text become a table with the table button),
// apd93c815aa0/mac ("Aggiungere elenchi in Note sul Mac": "Ordina automaticamente gli elementi selezionati" in the Notes
// settings), apdb54e469b6/mac (mettere in evidenza una nota: it stays at the top of the list), not18ab658ed/mac (search
// looks in the body of every note), apd4e6e2c9a6/mac (shared notes and the Apple Account), and the iPhone guide
// it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button). The table and checklist buttons have no name in the
// guides, so they are described. Modifica > Incolla come Markdown is new in macOS 27 and not in the Italian guide yet:
// it is the Italian string in Notes' MainMenu.loctable on macOS 27, like Formato > Tabella. As in the English post,
// Paste as Markdown is not used for the table. Facts are the English post's; the picture is its English one,
// described in Italian. The book notes link goes to its Italian version; the rest go to English posts. Pinto's
// template and its Status choices keep their English names, since the app is in English.

const ui = UI.it;

// Tabs between the columns: select the six table lines in Notes and press the table button.
const TEMPLATE = `Libri da leggere

Titolo\tAutore\tStato\tVoto\tPerché
Project Hail Mary\tAndy Weir\tLetto\t5\tGruppo di lettura
Piranesi\tSusanna Clarke\tIn lettura\tNon ancora\tDa Luca
Guerra e pace\tLev Tolstoj\tAbbandonato\t2\tMollato a p. 90
Non lasciarmi\tKazuo Ishiguro\tLetto\t4\tLettura delle vacanze
Il sussurro del mondo\tRichard Powers\tDa leggere\tNon ancora\tPrestato da Sara

Appunti
Project Hail Mary: L’amicizia regge tutto il libro. Ora presto la mia copia a papà.
Non lasciarmi: Silenzioso e strano. Ci ho ripensato per settimane.
`;

const SIMPLE = `# Libri da leggere

## Da leggere
- [ ] Piranesi di Susanna Clarke (da Luca)
- [ ] Il sussurro del mondo di Richard Powers (prestato da Sara)

## Letti
- Project Hail Mary di Andy Weir: 5 su 5
- Non lasciarmi di Kazuo Ishiguro: 4 su 5
`;

const FAQ = [
  { q: "Come faccio una lista di libri da leggere in Note di Apple?", a: [
    "Crea una nota chiamata Libri da leggere con una tabella di titolo, autore, stato, voto e perché. Per qualcosa di più semplice, usa un elenco di controllo dei libri da leggere e spunta ognuno quando lo finisci.",
  ] },
  { q: "Posso ordinare la mia lista di libri in Note di Apple?", a: [
    "No. Le tabelle in Note non si ordinano, quindi i libri restano nell’ordine in cui li hai aggiunti. Un elenco di controllo può spostare in fondo i libri spuntati, se attivi “Ordina automaticamente gli elementi selezionati” nelle impostazioni di Note.",
  ] },
  { q: "Posso condividere la lista con il mio gruppo di lettura?", a: [
    "Sì. Condividi la nota e tutti possono aggiungere libri, ma serve un Apple Account a testa.",
  ] },
  { q: "Esiste un’app per i libri da leggere che funziona come Note di Apple?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito per i libri, con lo stato e un voto da 1 a 5. Parla di un libro a ChatGPT o Claude e lui lo mette in lista; chiedi cosa leggere dopo e te ne propone uno dalla tua lista.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="libri-da-leggere-note-iphone"
      intro={<>
        I libri che ti consigliano finiscono tra screenshot, messaggi e schede del browser, e quando cerchi qualcosa da leggere sono
        spariti. Note di Apple può tenerli in una nota sola. Ecco un modello per i libri da leggere in Note di Apple, una versione più
        semplice come elenco di controllo e dove Note si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#elenco-di-controllo", label: "Un elenco più semplice" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Una lista che si aggiorna da sola" },
        ]}>
          <p>
            Note di Apple non ha un modello per i libri da leggere, ma una nota con una tabella basta: titolo, autore, stato, un voto su
            5 e perché lo volevi leggere. Aggiungi una riga quando qualcuno ti consiglia un libro, e scrivi qualche riga sotto Appunti
            quando ne finisci uno.
          </p>
          <PostCta template="reading-list" slug="it/libri-da-leggere-note-iphone" path="/it/blog/libri-da-leggere-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che i libri si mettano in lista da soli?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per i libri da leggere. Parla di un libro a ChatGPT o Claude e lui aggiunge la riga; chiedi cosa leggere dopo e sceglie dalla tua lista.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/reading-list-note" width={1520} height={1153} maxWidth={600}
        alt="Una nota Reading list in Pinto Notes su un Mac: una tabella Books di cinque libri con titolo, autore, stato, voto e perché, da Project Hail Mary, letto con un 5, a The Overstory, da leggere, poi gli appunti su due libri."
        caption="Una lista di libri in Pinto Notes, dove lo stato è una scelta e il voto una scala da 1 a 5. Dati di esempio. In Note di Apple la stessa tabella funziona con le parole scritte a mano." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una tabella di libri</h2>
      <p>
        Cinque colonne bastano. Lo stato è una di quattro parole: Da leggere, In lettura, Letto o Abbandonato. Perché è la colonna di
        cui ti ringrazierai: tra un anno, &ldquo;Da Luca&rdquo; ti dice più del titolo. I libri abbandonati restano nella lista, così non
        li riprendi per sbaglio.
      </p>
      <Keep title="Libri da leggere per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Ogni riga della tabella ha una tabulazione tra le colonne. Incollala, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla il modello in una nota nuova, seleziona le sei righe da Titolo a Il
          sussurro del mondo e premi il pulsante della tabella. Ogni tabulazione diventa una colonna, così hai cinque colonne una
          accanto all’altra.
        </li>
        <li>
          <strong>Aggiungi un libro in un secondo.</strong> Fai clic nell’ultima cella e premi il Tabulatore: compare una riga nuova per
          il libro successivo.
        </li>
        <li>
          <strong>Tieni le celle brevi.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi cinque
          colonne si dividono lo spazio. I pensieri più lunghi vanno sotto Appunti, dopo la tabella.
        </li>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza resta in cima alla cartella, così è la prima cosa che vedi quando
          un amico ti dice &ldquo;devi leggerlo&rdquo;.
        </li>
      </ul>
      <p>
        La ricerca legge ogni parola della nota, quindi cercando un autore o il nome di un amico trovi la lista. Per condividerla con un
        gruppo di lettura, condividi la nota; serve un Apple Account a testa. <a href="/blog/apple-notes-tables">Tables in Apple
        Notes</a> (in inglese) spiega tutto il resto che una tabella sa fare e non sa fare.
      </p>

      <h2 id="elenco-di-controllo">Una versione più semplice, come elenco di controllo</h2>
      <p>
        Se una tabella è più di quello che ti serve, funziona un elenco di controllo. I libri da leggere vanno in un elenco di controllo,
        e ne spunti uno quando lo finisci. Lascia una parola in ogni riga, perché un elemento vuoto dell’elenco di controllo si perde
        quando incolli.
      </p>
      <Keep title="Elenco dei libri per Note di Apple" text={SIMPLE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, le righe con ## in intestazioni e
        i libri in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone, scrivilo, seleziona i libri e
        tocca il pulsante dell’elenco di controllo. Attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle
        impostazioni di Note e i libri finiti scendono in fondo. Quando ne vuoi ricordare uno, spostalo sotto Letti con un voto.
      </p>
      <p>
        Per tenere più di un voto, puoi tenere una nota per ogni libro con citazioni, pensieri e l’idea centrale. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma una lista di libri in Note</h2>
      <ul>
        <li><strong>Niente ordinamento né filtri.</strong> Le tabelle non si ordinano, quindi per trovare tutti i libri Da leggere devi scorrere la colonna Stato.</li>
        <li><strong>Lo stato è solo testo.</strong> Niente impedisce che &ldquo;Letto&rdquo; e &ldquo;Finito&rdquo; finiscano nella stessa colonna.</li>
        <li><strong>Ogni libro si scrive a mano.</strong> Un consiglio arrivato in un messaggio non è nella lista finché non lo copi.</li>
        <li><strong>La lista non risponde.</strong> Sa quali libri hai votato bene, ma non può dirti quale dei Da leggere somiglia di più a quelli che hai amato.</li>
      </ul>

      <h2 id="pinto-notes">Una lista di libri che si aggiorna da sola</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/reading-list">Reading list</a> è una nota con una tabella Books e una
        sezione Notes. Status è una scelta tra To read, Reading, Finished o Dropped, e Rating è una scala da 1 a 5, quindi li scegli
        invece di scriverli.
      </p>
      <p>
        Parla di un libro alla tua AI e lei aggiunge una riga: il titolo, l’autore, To read, e chi te l’ha consigliato o perché lo vuoi
        leggere. Di’ &ldquo;finito Piranesi, cinque stelle&rdquo; e aggiorna lo stato e il voto. I tuoi pensieri su un libro vanno sotto
        Notes, sotto il suo titolo. Chiedi &ldquo;cosa leggo dopo?&rdquo; e ti propone uno dei tuoi libri To read, in base a quelli che
        hai votato meglio. Puoi sempre aggiungere e modificare ogni riga da te, e ogni versione precedente della nota viene
        conservata. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        La lista di libri che tieni già in Note di Apple arriva con <a href="/blog/import-your-notes">una sola importazione sul
        Mac</a>, e Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
