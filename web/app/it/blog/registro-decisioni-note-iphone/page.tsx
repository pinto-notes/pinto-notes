import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "registro-decisioni-note-iphone");

// Italian version of /blog/apple-notes-decision-log-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "decision log" gives decision log template; "registro delle decisioni" exists but is mostly the
// condominium administrator's; "diario delle decisioni" exists too. So the slug and title say "registro delle
// decisioni" plus "note di iPhone", and the text names "decision log" once. Apple's own Italian words, all read 21 Nov:
// the Mac guide support.apple.com/it-it/guide/notes/apde615d29c2/mac ("Aggiungere link in Notes sul Mac": Modifica >
// Aggiungi link, Comando-K, a link to another note), apdb54e469b6/mac ("Ordinare e mettere in evidenza le note sul
// Mac": a note in evidenza stays at the top), not18ab658ed/mac ("Cercare le note sul Mac": search reads the body of
// every note), apdc88ed7f1d/mac (tags with #) and apd4e6e2c9a6/mac (sharing a note to work on it together). Modifica >
// Incolla come Markdown is the Italian string in Notes' MainMenu.loctable on macOS 27 (not in the Italian guide yet),
// as is "Aggiungi link…". Facts are the English post's; the picture is its English one, described in Italian. The
// meeting notes link goes to its Italian version; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Registro delle decisioni

Ogni decisione da ricordare: cosa abbiamo scelto, cosa no, e perché. Dalla più recente.

## Domande aperte
- Supportiamo la modifica offline nella prima versione?
- Chi segue l’importazione dopo il lancio?

## Restiamo su Postgres, 4 novembre
- Contesto: le note sono arrivate a 2 milioni di righe e la ricerca è diventata lenta.
- Opzioni: un database a documenti, un servizio di ricerca, o indici migliori.
- Scelta: Postgres con un indice a trigrammi.
- Perché: un solo database da gestire, e con l’indice la ricerca è 40 volte più veloce.
- Da rivedere: a 20 milioni di righe.

## Una release ogni martedì, 2 novembre
- Contesto: le release slittavano ogni volta che una correzione non era pronta.
- Scelta: ogni martedì esce quello che è pronto.
- Perché: le release piccole si annullano più facilmente.
`;

const FAQ = [
  { q: "Cosa si scrive in un registro delle decisioni?", a: [
    "Per ogni decisione: la data, il contesto, le opzioni considerate, cosa hai scelto, perché, e quando riguardarla. Il perché e le opzioni sono le parti che ci si dimentica di scrivere e che poi servono di più.",
  ] },
  { q: "Note di Apple ha un modello per il registro delle decisioni?", a: [
    "No. Note di Apple non ha modelli. Una nota con un’intestazione per ogni decisione, dalla più recente, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Meglio un registro delle decisioni in tabella o a elenco?", a: [
    "In un foglio di calcolo, una tabella. In Note di Apple si legge meglio un’intestazione per decisione: la larghezza delle colonne non si può trascinare, e un perché lungo finisce schiacciato in una cella stretta.",
  ] },
  { q: "Esiste un registro delle decisioni che risponde al perché di una scelta?", a: [
    "Pinto Notes ha un modello gratuito, Decision log. Di’ a ChatGPT o a Claude cosa avete deciso e lui scrive il contesto, le opzioni e il perché. Più avanti, chiedi perché avete scelto qualcosa e ti cita la voce.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="registro-decisioni-note-iphone"
      intro={<>
        I team tornano a discutere questioni già chiuse perché nessuno ha scritto perché erano state chiuse. Un registro delle decisioni,
        il decision log, risolve il problema, e non serve Confluence né un foglio di calcolo. Ecco un modello di registro delle
        decisioni per Note di Apple, come tenerlo aggiornato e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#tenerlo-vivo", label: "Tenerlo vivo" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un registro che ricorda il perché" },
        ]}>
          <p>
            Note di Apple non ha un modello per il registro delle decisioni, ma una nota fa il lavoro: le domande aperte in alto, poi
            un’intestazione per ogni decisione con la sua data, e sotto il contesto, le opzioni, cosa hai scelto, perché e quando
            rivederla. Dalla più recente, così le ultime decisioni sono la prima cosa che leggi.
          </p>
          <PostCta template="decision-log" slug="it/registro-decisioni-note-iphone" path="/it/blog/registro-decisioni-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le decisioni le scriva qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un registro delle decisioni gratuito. Di’ a ChatGPT o a Claude cosa avete deciso e lui scrive le opzioni e il perché, poi lo ritrova quando lo chiedi.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/decision-log-note" width={1520} height={1055} maxWidth={600}
        alt="Una nota Decision log in Pinto Notes su un Mac: due domande aperte, poi la decisione Stay on Postgres del 4 novembre con contesto, opzioni, scelta, motivo e quando rivederla, e sotto la decisione Release every Tuesday."
        caption="Un registro delle decisioni in Pinto Notes, come lo scrive il modello. La stessa struttura funziona in Note di Apple. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: un’intestazione per decisione</h2>
      <p>
        Ogni voce sono cinque righe brevi. Contesto dice cosa ha reso necessaria la scelta. Opzioni elenca quello che non hai scelto, ed
        è la riga che impedisce alla stessa idea di tornare il trimestre dopo. Da rivedere dice quando la risposta potrebbe cambiare,
        così nessuno la tratta come definitiva. Le decisioni piccole possono saltare le opzioni, come quella del martedì qui sotto.
      </p>
      <Keep title="Registro delle decisioni per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
        { on: "Mac", steps: ["Modifica", "Aggiungi link"], keys: "⌘K" },
      ]} />
      <ul>
        <li>
          <strong>Incollalo una volta.</strong> Su un Mac con macOS 27, crea una nota e scegli Modifica &gt; Incolla come Markdown. La
          riga con # diventa il titolo e ogni riga con ## un’intestazione. Un Comando-V normale lascia i simboli come testo. Su iPhone,
          scrivilo a mano.
        </li>
        <li>
          <strong>Un registro per progetto.</strong> Tienilo nella cartella del progetto e mettilo in evidenza, così resta in cima,
          vicino alle note che spiega.
        </li>
        <li>
          <strong>Condividilo con il team.</strong> Se tutti usano Note di Apple, condividi la nota così ognuno può aggiungere le sue
          decisioni. Serve un Apple Account a testa.
        </li>
      </ul>

      <h2 id="tenerlo-vivo">Tenerlo vivo</h2>
      <ul>
        <li>
          <strong>Scrivilo il giorno stesso.</strong> Il perché è chiarissimo alla fine della riunione in cui avete deciso. Una
          settimana dopo è già un’ipotesi.
        </li>
        <li>
          <strong>Sposta le domande quando sono chiuse.</strong> Quando una domanda aperta viene decisa, cancellala da Domande aperte e
          scrivi la sua voce in cima alle decisioni.
        </li>
        <li>
          <strong>Metti un link da dove è nata.</strong> Nella nota della riunione, seleziona la decisione e scegli Modifica &gt;
          Aggiungi link per puntare al registro, così la riunione e i motivi restano collegati.
        </li>
        <li>
          <strong>Cerca prima di ridiscutere.</strong> La ricerca legge ogni parola di ogni nota, quindi &ldquo;Postgres&rdquo; trova la
          voce prima che qualcuno fissi una riunione sull’argomento. Aiuta anche un tag #decisione sulle note di riunione che hanno
          cambiato qualcosa.
        </li>
      </ul>
      <p>
        Quasi tutte le decisioni nascono in una riunione, e il modello per gli{" "}
        <a href="/it/blog/appunti-riunione-note-iphone">appunti di riunione nelle note di iPhone</a> ha un’intestazione Decisioni
        proprio per questo. Altre note da incollare sono in <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in
        inglese).
      </p>

      <h2 id="limiti">Dove si ferma un registro delle decisioni in Note</h2>
      <ul>
        <li><strong>Qualcuno deve scriverlo.</strong> Dopo una riunione lunga, il registro è la prima cosa che si salta.</li>
        <li><strong>Il perché si perde.</strong> Nessuno chiede il motivo quando qualcuno scrive solo la scelta.</li>
        <li><strong>La ricerca trova parole, non risposte.</strong> Trova ogni nota che dice Stripe. Non sa rispondere a &ldquo;perché abbiamo scelto Stripe invece di Paddle?&rdquo;</li>
        <li><strong>Per condividere serve un Apple Account.</strong> Ogni persona del team ne ha bisogno per aprire e modificare il registro condiviso.</li>
      </ul>

      <h2 id="pinto-notes">Un registro delle decisioni che ricorda il perché</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/decision-log">Decision log</a> è una nota con le domande aperte e le
        decisioni, dalla più recente.
      </p>
      <p>
        Racconta una decisione alla tua AI con parole tue. Lei aggiunge una voce in cima con la decisione in poche parole e la data, poi
        il contesto, le opzioni considerate, cosa avete scelto, perché e quando rivederla, una riga breve ciascuno. Se non hai detto
        perché, te lo chiede. Le questioni non ancora decise vanno tra le domande aperte, ed escono dall’elenco quando sono decise. Mesi
        dopo, chiedi &ldquo;perché abbiamo scelto Stripe invece di Paddle?&rdquo; e lei trova la voce e te la cita, oppure chiedi
        &ldquo;cosa resta ancora da decidere?&rdquo;. Puoi sempre scrivere e modificare ogni voce da te, e ogni versione precedente
        della nota viene conservata. Questa parte funziona quando ChatGPT o Claude sono collegati;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        In <a href="/blog/notes-in-claude-code-and-codex">Claude Code</a> (in inglese), il modello ha istruzioni sue per le decisioni
        tecniche di un progetto. Quando scegli una libreria, uno schema o un’architettura, scrive la voce con i file che tocca, e prima
        di proporre una modifica legge il registro per controllare di non disfare una decisione.
      </p>
      <p>
        Le note che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
