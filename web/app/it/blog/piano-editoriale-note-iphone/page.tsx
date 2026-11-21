import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "piano-editoriale-note-iphone");

// Italian version of /blog/apple-notes-content-calendar (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: "piano editoriale" gives piano editoriale social, template and instagram; "calendario editoriale" gives
// calendario editoriale social, template and excel. So the slug and title say "piano editoriale" plus "note di
// iPhone", and the text also says "calendario editoriale". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato > Tabella, a
// table of two rows and two columns, the Tabulatore or A capo in the last cell adds a row, selected lines of text
// become a table with the table button), not9474646a9/mac (File > Duplica nota), apde615d29c2/mac ("Aggiungere link in
// Notes sul Mac": Modifica > Aggiungi link, Comando-K, links to another note), apdc88ed7f1d/mac ("Utilizzare i tag in
// Note sul Mac": type #word in a note), apd58edc7964/mac ("Usare le cartelle smart": the Tag rule), apdb54e469b6/mac
// ("Ordinare e mettere in evidenza le note sul Mac": a note in evidenza stays at the top of the list), and
// apd4e6e2c9a6/mac ("Collaborare con note e cartelle condivise": Apple Account). The table button has no name in the
// guide, so it is described. Modifica > Incolla come Markdown is new in macOS 27 and not in the Italian guide yet: it
// is the Italian string in Notes' MainMenu.loctable on macOS 27, like Formato > Tabella. As in the English post, Paste
// as Markdown is not used for the table. Facts are the English post's; the picture is its English one, described in
// Italian. The meeting notes link goes to its Italian version; the rest go to English posts. Pinto's template and its
// Channel and Status choices keep their English names, since the app is in English.

const ui = UI.it;

const SKELETON = `# Piano editoriale

## Calendario
Incolla qui la tabella.

## Idee
- Tre strumenti che uso ogni giorno
- Una giornata in assistenza, in numeri
- Cosa abbiamo smesso di fare quest’anno

## Tono
- Frasi brevi. Un’idea per post.
- Mostra il lavoro: uno screenshot o un numero vale più di un aggettivo.
- Chiudi con una domanda, non con una vendita.
`;

// Tabs between the columns: select these lines in Notes and press the table button.
const TABLE = `Data di uscita\tTitolo\tCanale\tStato
2026-11-03\tCinque domande per ogni nuovo cliente\tBlog\tPubblicato
2026-11-10\tCosa ci hanno insegnato 100 chiamate con i clienti\tLinkedIn\tProgrammato
2026-11-12\tNewsletter: tre storie di clienti\tNewsletter\tIn stesura
2026-11-17\tIl nostro onboarding, prima e dopo\tLinkedIn\tIn stesura
2026-11-19\tDietro le quinte: l’assistenza clienti\tInstagram\tIdea
`;

const FAQ = [
  { q: "Note di Apple ha un modello per il piano editoriale?", a: [
    "No. Note di Apple non ha nessun modello. Una nota con una tabella dei post (data, titolo, canale, stato) e sotto un elenco di idee funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Note di Apple sa ordinare una tabella per data?", a: [
    "No. Le tabelle in Note di Apple non si ordinano. Scrivi le date come 2026-11-03, così si leggono in ordine, e aggiungi ogni post nuovo al suo posto a mano.",
  ] },
  { q: "Il mio team può modificare lo stesso calendario editoriale in Note di Apple?", a: [
    "Sì, se condividi la nota. Ogni persona ha bisogno di un Apple Account, e tutti modificano la stessa nota.",
  ] },
  { q: "Esiste un’app di note che pianifica i contenuti per me?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito per il calendario editoriale. Di’ un’idea a ChatGPT o a Claude e la salva, oppure chiedi di pianificare le prossime due settimane e aggiunge i post al calendario.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="piano-editoriale-note-iphone"
      intro={<>
        Pubblicare ogni settimana è più facile quando il piano e le idee stanno in un posto che apri già. Note di Apple può essere quel
        posto, con una nota e una tabella. Ecco un piano editoriale da incollare in Note di Apple, come tenerlo aggiornato settimana
        dopo settimana e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#settimana", label: "Settimana dopo settimana" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un calendario che pianifica con te" },
        ]}>
          <p>
            Note di Apple non ha un calendario editoriale, ma basta una nota: una tabella con la data di uscita, il titolo, il canale e
            lo stato, poi un elenco di idee e qualche riga su come scrivi. Mettila in evidenza, e aggiungi ogni idea nel momento in cui
            ti viene.
          </p>
          <PostCta template="content-calendar" slug="it/piano-editoriale-note-iphone" path="/it/blog/piano-editoriale-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che qualcuno ti pianifichi le prossime due settimane?">
            <p>Pinto Notes funziona come Note di Apple e ha un calendario editoriale gratuito. Di’ un’idea a ChatGPT o a Claude e la salva, oppure chiedi di pianificare due settimane di post partendo dalle tue idee.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/content-calendar-note" width={1520} height={1265} maxWidth={600}
        alt="Una nota Content calendar in Pinto Notes su un Mac: una tabella Calendar con cinque post dal 3 al 19 novembre con titolo, canale e stato, un elenco Ideas di tre idee e tre righe Voice."
        caption="Un calendario editoriale in Pinto Notes, dove Channel e Status sono scelte. In Note di Apple la stessa tabella li tiene come parole scritte a mano." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: un calendario, le idee e un tono</h2>
      <p>
        Il calendario è una tabella, una riga per post. Le idee sono un elenco semplice, così un pensiero a metà costa una riga. Il tono
        sono tre regole che leggi prima di scrivere, così ogni post suona come il precedente. La nota arriva in due parti: prima le
        intestazioni e gli elenchi, poi la tabella.
      </p>
      <Keep title="Piano editoriale per Note di Apple" text={SKELETON} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo e ogni riga con ## in
        un’intestazione. Un Comando-V normale lascia i simboli come testo. Su iPhone, scrivilo a mano. Poi sostituisci la riga sotto
        Calendario con la tabella.
      </p>
      <Keep title="Tabella del calendario" text={TABLE} copyLabel={ui.copy}
        note="Ogni riga ha una tabulazione tra le colonne. Incollala, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla le righe della tabella sotto Calendario, seleziona le sei righe da
          Data di uscita all’ultimo post e premi il pulsante della tabella. Ogni tabulazione diventa una colonna.
        </li>
        <li>
          <strong>Oppure parti da zero.</strong> Scegli Formato &gt; Tabella per due righe e due colonne, e il Tabulatore nell’ultima
          cella aggiunge la riga successiva.
        </li>
        <li>
          <strong>Tieni corti i titoli.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi un titolo
          lungo schiaccia le altre colonne. Basta un titolo provvisorio di poche parole.
        </li>
        <li>
          <strong>Scrivi le date sempre allo stesso modo.</strong> 2026-11-03 si legge in ordine lungo la colonna ed è facile da
          cercare.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega tutto quello che una tabella in Note sa fare e
        non sa fare.
      </p>

      <h2 id="settimana">Settimana dopo settimana</h2>
      <ul>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza resta in cima alla cartella, così un’idea avuta in treno finisce
          subito nell’elenco.
        </li>
        <li>
          <strong>Pianifica una volta a settimana.</strong> Sposta due o tre idee nella tabella con una data e In stesura, e cancellale
          dall’elenco.
        </li>
        <li>
          <strong>Scrivi le bozze in note a parte.</strong> Scrivi ogni post in una nota sua e collegala dalla nota del calendario con
          Modifica &gt; Aggiungi link (Comando-K), così il calendario resta corto.
        </li>
        <li>
          <strong>Metti un tag alle bozze.</strong> Scrivi #bozza in ogni nota di bozza, e una cartella smart con una regola Tag le
          raccoglie in un posto solo. Leggi <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> (in inglese) se
          non compare.
        </li>
        <li>
          <strong>Ogni trimestre, una nota nuova.</strong> Scegli File &gt; Duplica nota, poi togli le righe già pubblicate, e le idee e
          il tono vengono con te.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Aggiungi link"], keys: "⌘K" },
        { on: "Mac", steps: ["File", "Duplica nota"] },
      ]} />
      <p>
        Se pianifichi i post in una riunione del team, gli <a href="/it/blog/appunti-riunione-note-iphone">appunti di riunione nelle
        note di iPhone</a> tengono le decisioni e chi scrive cosa. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma un piano editoriale in Note</h2>
      <ul>
        <li><strong>Niente ordinamento.</strong> Le tabelle in Note non si ordinano, quindi un post spostato a un’altra settimana vuol dire spostare la sua riga a mano.</li>
        <li><strong>Lo stato è solo una parola.</strong> Niente ferma un errore di battitura, e non puoi mostrare solo quello che è programmato.</li>
        <li><strong>La pianificazione è tua.</strong> Trasformare un elenco di idee in due settimane di post su più canali è la parte lenta, ogni settimana.</li>
        <li><strong>Il tono è un promemoria.</strong> Le tre regole stanno nella nota, e far rispettare ogni bozza tocca a te.</li>
      </ul>
      <p>
        Per un canale e un post a settimana, una nota è tutto quello che serve. Con più canali, tenere aggiornata la tabella diventa il
        lavoro.
      </p>

      <h2 id="pinto-notes">Un calendario editoriale che pianifica con te</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/content-calendar">Content calendar</a> è una nota con una tabella
        Calendar, un elenco Ideas e il tuo tono sotto Voice. Nella tabella, Channel è una scelta tra Blog, Newsletter, LinkedIn,
        Instagram o YouTube, e Status è Idea, Drafting, Scheduled o Published.
      </p>
      <p>
        Di’ un’idea alla tua AI e lei la aggiunge sotto Ideas. Chiedi &ldquo;pianifica le prossime due settimane: due post su LinkedIn e
        una newsletter&rdquo; e sceglie le idee dall’elenco e aggiunge una riga per ogni post, con una data, un titolo provvisorio, il
        canale e Drafting. Scrive le bozze nel tono che trovi sotto Voice, e quando dici che un post è uscito lo segna come Published.
        &ldquo;Cosa è in programma questa settimana?&rdquo; riceve una risposta diretta dalla tabella. Questa parte funziona quando
        ChatGPT o Claude sono collegati; <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un
        minuto. Puoi sempre modificare ogni riga da te, e ogni versione precedente della nota viene conservata.
      </p>
      <p>
        I piani che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
