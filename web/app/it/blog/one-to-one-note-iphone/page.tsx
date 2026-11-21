import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "one-to-one-note-iphone");

// Italian version of /blog/apple-notes-1-on-1-template (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: "one to one" gives one to one meeting and one to one manager template; "colloquio one to one" (con il
// capo), "riunione one to one" and "domande one to one" exist too. Italians say "one to one", so the slug, title and
// text use it instead of 1:1. Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/not9474646a9/mac (File > Duplica nota), apd93c815aa0/mac ("Aggiungere elenchi in
// Note sul Mac": "Ordina automaticamente gli elementi selezionati" in the Notes settings), apd58edc7964/mac ("Usare le
// cartelle smart": the rules), apdb54e469b6/mac ("Ordinare e mettere in evidenza le note sul Mac": in evidenza),
// not28c5f5468/mac ("Proteggere le note sul Mac": Proteggi nota), apd4e6e2c9a6/mac (a locked note can't be shared to
// work on together), not18ab658ed/mac (search reads the body of every note), and the iPhone guide
// it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button, which has no name, so it is described). Modifica > Incolla
// come Markdown is the Italian string in Notes' MainMenu.loctable on macOS 27 (not in the Italian guide yet); the Smart
// Folder rule values Cartelle, Elenchi di controllo and Non selezionati are the Italian strings in
// SmartFolderFilterRow.loctable and SmartFolderChecklistsFilterView.loctable. Facts are the English post's; the picture
// is its English one, described in Italian, so the example person stays Emma. The meeting notes link goes to its
// Italian version; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# One to one con Emma

Un giovedì sì e uno no. Aggiungi gli argomenti durante la settimana.

## Prossima volta
- Feedback sulla design review
- Il budget per la conferenza
- Gli obiettivi di Emma per il prossimo trimestre

## Follow-up
- [ ] Io: trovare a Emma un mentor nel team piattaforma
- [ ] Io: chiedere di una reperibilità più tranquilla
- [ ] Emma: bozza del piano di lancio entro il 20 nov

## One to one passati
5 novembre
- Reperibilità pesante: due chiamate di notte. Vuole una rotazione più tranquilla.
- Vuole guidare il lancio di primavera. Sembrava stanca ma positiva.
`;

const QUESTIONS = `Domande fisse
- Cosa hai in mente questa settimana?
- Cosa ti sta bloccando?
- Ti serve qualcosa da me?
- Feedback, in tutte e due le direzioni
- Come vanno i tuoi obiettivi?
`;

const FAQ = [
  { q: "Note di Apple ha un modello per i one to one?", a: [
    "No. Note di Apple non ha modelli. Una nota per persona, sempre la stessa, con le intestazioni per la prossima agenda, i follow-up e i one to one passati, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Cosa mettere nell’agenda di un one to one?", a: [
    "Prima i suoi argomenti, poi i tuoi, poi i follow-up dell’ultima volta. Aggiungi una o due domande fisse, come cosa lo sta bloccando e se gli serve qualcosa da te. Scrivi gli argomenti durante la settimana, quando saltano fuori.",
  ] },
  { q: "Meglio una nota per ogni one to one o una per persona?", a: [
    "Una per persona. L’agenda, i follow-up aperti e tutti i one to one passati restano insieme, dal più recente, così rileggi gli appunti dell’ultima volta prima del prossimo senza doverli cercare.",
  ] },
  { q: "Esiste un’app che scrive gli appunti dei one to one per me?", a: [
    "Pinto Notes ha un modello gratuito, 1:1 notes. Racconta a ChatGPT o a Claude com’è andato il one to one e lui scrive la sezione, aggiunge quello che ognuno di voi ha promesso come elenco di controllo e toglie gli argomenti affrontati.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="one-to-one-note-iphone"
      intro={<>
        Un buon one to one si costruisce nelle due settimane prima, quando saltano fuori gli argomenti. Ecco un modello per gli appunti
        dei one to one in Note di Apple da incollare: una nota per persona, sempre la stessa, con la prossima agenda, i follow-up e ogni
        incontro passato. Poi come tenerla aggiornata, e dove Note si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#agenda", label: "L’agenda" },
          { href: "#tra-un-incontro-e-l-altro", label: "Tra un incontro e l’altro" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "One to one che si scrivono da soli" },
        ]}>
          <p>
            Note di Apple non ha un modello per i one to one, ma una nota per persona fa il lavoro: un elenco Prossima volta a cui
            aggiungi durante la settimana, i follow-up come elenco di controllo con un nome su ognuno, e sotto i one to one passati, dal
            più recente. Leggi la parte alta prima di ogni incontro e scrivi la nuova sezione subito dopo.
          </p>
          <PostCta template="one-on-one-notes" slug="it/one-to-one-note-iphone" path="/it/blog/one-to-one-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi i one to one già scritti?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per i one to one. Racconta a ChatGPT o a Claude com’è andata e lui scrive gli appunti, aggiunge i follow-up e toglie quello che avete affrontato.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/one-on-one-notes-note" width={1520} height={1062} maxWidth={600}
        alt="Una nota 1:1 notes in Pinto Notes su un Mac: one to one con Emma un giovedì sì e uno no, tre argomenti sotto Next time, quattro follow-up di cui uno spuntato, e il one to one del 5 novembre sotto Past 1:1s."
        caption="Una nota per i one to one in Pinto Notes: cosa portare, cosa ha promesso ognuno, e gli incontri passati dal più recente. La stessa struttura funziona in Note di Apple." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per persona, sempre la stessa</h2>
      <p>
        Una nota per incontro sparpaglia i follow-up. Una nota per persona tiene tutta la storia in un posto: cosa vuoi sollevare, cosa
        avete detto di fare tu e lei, e come sono andati gli ultimi one to one. Metti un nome su ogni follow-up, &ldquo;Io&rdquo;
        compreso, così è chiaro chi deve cosa. Lascia una parola in ogni riga, perché un elemento vuoto dell’elenco di controllo si
        perde quando incolli.
      </p>
      <Keep title="Appunti dei one to one per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
        { on: "Mac", steps: ["File", "Duplica nota"] },
      ]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e i follow-up in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone, scrivilo a
        mano, seleziona i follow-up e tocca il pulsante dell’elenco di controllo. Per la persona successiva, togli le righe di esempio,
        tieni quella copia vuota in una cartella One to one e scegli File &gt; Duplica nota.
      </p>

      <h2 id="agenda">L’agenda: Prossima volta</h2>
      <p>
        Prossima volta è l’agenda, scritta in due settimane invece che in due minuti prima della chiamata. I suoi argomenti vengono
        prima: l’incontro è più suo che tuo. Qualche domanda fissa sotto raccoglie quello che nessuno dei due ha pensato di scrivere.
      </p>
      <Keep title="Domande fisse" text={QUESTIONS} copyLabel={ui.copy} />
      <p>
        Se volete aggiungere all’agenda tutti e due, condividi una nota che contiene solo Prossima volta, con il permesso di
        modificarla. Serve un Apple Account a testa. Il resto, compreso come ti è sembrata la persona, tienilo nella tua nota.
      </p>

      <h2 id="tra-un-incontro-e-l-altro">Tra un incontro e l’altro</h2>
      <ul>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza resta in cima alla sua cartella, così aggiungere un argomento dal
          telefono richiede pochi secondi.
        </li>
        <li>
          <strong>Scrivi subito dopo.</strong> Aggiungi la data come riga in cima a One to one passati, due o tre punti su cosa vi siete
          detti e come ti è sembrata la persona, e sposta le promesse in Follow-up. Cancella gli argomenti affrontati.
        </li>
        <li>
          <strong>Lascia scendere i follow-up fatti.</strong> Attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle
          impostazioni di Note, e quello che è fatto scende in fondo all’elenco.
        </li>
        <li>
          <strong>Vedi tutte le promesse aperte.</strong> Crea una cartella smart con due regole, Cartelle impostata sulla tua cartella
          One to one ed Elenchi di controllo impostata su Non selezionati. Ci trovi ogni persona a cui devi ancora qualcosa.
        </li>
        <li>
          <strong>Proteggila se è privata.</strong> Come ti è sembrata una persona è roba tua. Una nota protetta si apre con la tua
          password o con Face ID o Touch ID, ma non si può condividere per modificarla insieme.
        </li>
      </ul>
      <p>
        La ricerca legge ogni parola di ogni nota, quindi cercare &ldquo;reperibilità&rdquo; trova ogni volta che se n’è parlato.{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> (in inglese) passa in rassegna ogni regola che una
        cartella smart può usare. Per le riunioni di team, il modello per gli{" "}
        <a href="/it/blog/appunti-riunione-note-iphone">appunti di riunione nelle note di iPhone</a> mette in alto le azioni con i loro
        responsabili, e <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese) ha altre note da incollare.
      </p>

      <h2 id="limiti">Dove si fermano gli appunti dei one to one in Note</h2>
      <ul>
        <li><strong>Scriverli tocca a te.</strong> Subito dopo un one to one inizia la riunione successiva, e gli appunti aspettano finché ne hai dimenticato metà.</li>
        <li><strong>Il riordino è a mano.</strong> Spostare le promesse in Follow-up e cancellare gli argomenti affrontati è facile da saltare, e l’agenda si riempie di cose vecchie.</li>
        <li><strong>Nessuno schema.</strong> Se la reperibilità torna fuori in tre one to one di fila, è scritto nella nota, ma niente te lo fa notare.</li>
        <li><strong>La ricerca trova parole, non risposte.</strong> &ldquo;Cosa ho promesso a Emma l’ultima volta?&rdquo; vuol dire rileggere i follow-up da te.</li>
      </ul>
      <p>
        Per una o due persone, il modello basta. Con un team di sei, scrivere gli appunti è la parte che salta.
      </p>

      <h2 id="pinto-notes">Appunti dei one to one che si scrivono da soli</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/one-on-one-notes">1:1 notes</a> è una nota per persona, sempre la
        stessa, con la prossima volta, i follow-up e gli incontri passati, dal più recente.
      </p>
      <p>
        La prima volta, la tua AI ti chiede con chi è il one to one e scrive il suo nome. Durante la settimana, accenna a qualcosa da
        sollevare e finisce sotto la prossima volta. Dopo il one to one, raccontale com’è andato, per esempio &ldquo;Io ed Emma abbiamo
        appena fatto il nostro one to one. Vuole guidare il prossimo lancio e ha chiesto un mentor.&rdquo; Lei aggiunge una sezione in
        cima agli incontri passati con il nome e la data, cosa vi siete detti e come ti è sembrata, aggiunge quello che ognuno di voi ha
        promesso come righe dell’elenco di controllo tra i follow-up, e toglie gli argomenti affrontati. Prima del prossimo, chiedi
        &ldquo;cosa ho promesso l’ultima volta?&rdquo;. Puoi sempre scrivere e spuntare tutto da te, e ogni versione precedente della
        nota viene conservata. La parte con l’AI funziona quando ChatGPT o Claude sono collegati;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Gli appunti dei one to one che tieni già in Note di Apple arrivano con{" "}
        <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
