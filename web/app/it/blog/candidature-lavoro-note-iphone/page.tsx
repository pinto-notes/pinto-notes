import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "candidature-lavoro-note-iphone");

// Italian version of /blog/apple-notes-job-search-tracker (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "candidature lavoro", "tracker candidature" (tracker candidature excel), "candidature inviate"
// (with linkedin and indeed) and "excel candidature template". So the slug says "candidature lavoro" and the title
// "candidature di lavoro" and "tracker", plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac
// guide support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato >
// Tabella, the Tabulatore in the last cell adds a row, selected lines of text become a table with the table button),
// apd93c815aa0/mac ("Ordina automaticamente gli elementi selezionati" in the Notes settings), apde615d29c2/mac
// (Modifica > Aggiungi link, Comando-K, links to another note), apdb54e469b6/mac (mettere in evidenza una nota: it
// stays at the top of the list), not18ab658ed/mac (search looks in the body of every note), and the iPhone guide
// it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button). The table and checklist buttons have no name in the
// guides, so they are described. Modifica > Incolla come Markdown is new in macOS 27 and not in the Italian guide yet:
// it is the Italian string in Notes' MainMenu.loctable on macOS 27, like Formato > Tabella. As in the English post,
// Paste as Markdown is not used for the table. Facts are the English post's; the picture is its English one, described
// in Italian. The meeting notes link goes to its Italian version; the rest go to English posts. Pinto's template and
// its Stage choices keep their English names, since the app is in English.

const ui = UI.it;

// Tabs between the columns: select those lines in Notes and press the table button.
const TABLE = `Candidature

Azienda\tRuolo\tFase\tProssimo passo
Tideway\tSenior designer\tColloquio\tPrimo colloquio, 12 nov
Marlow Studio\tDesign lead\tInviata\tFollow-up, 16 nov
Finch Bikes\tProduct designer\tSalvata\tCandidarsi entro il 18 nov
Northlight\tUX designer\tScartata\tChiesto un riscontro
`;

const REST = `## Preparazione colloqui
Tideway, primo colloquio 12 nov
1. Un progetto di cui vai fiero? Il redesign dell’onboarding.
2. Come lavori con gli sviluppatori? Revisioni settimanali, rilasci piccoli.
3. Perché Tideway? Mi piace sbrogliare la logistica.

Da chiedere a loro: come si passano design e assistenza clienti quello che sentono?

## Questa settimana
- [ ] Mandare il link al portfolio a Tideway
- [ ] Aggiungere il progetto di onboarding al CV

## Persone con cui ho parlato
- Karin, design manager da Tideway: tiene più a prototipi semplici che alla rifinitura.
`;

const FAQ = [
  { q: "Posso tenere traccia delle candidature in Note di Apple?", a: [
    "Sì, con una tabella. Fai una riga per ogni lavoro con l’azienda, il ruolo, la fase e il prossimo passo, e tieni i follow-up come elenco di controllo sotto. Note di Apple non ha modelli, quindi incolla quello di questa pagina in una nota nuova.",
  ] },
  { q: "Note di Apple può ordinare le candidature per fase?", a: [
    "No. Le tabelle in Note non si ordinano e non fanno somme. Usa sempre le stesse parole per la fase (Salvata, Inviata, Colloquio, Offerta, Scartata) così la colonna si legge in fretta.",
  ] },
  { q: "Per cercare lavoro è meglio un foglio di calcolo?", a: [
    "Un foglio di calcolo ordina e filtra, e questo aiuta oltre qualche decina di candidature. Una nota tiene la tabella accanto alla preparazione dei colloqui e alle persone con cui hai parlato, sul telefono tra un colloquio e l’altro.",
  ] },
  { q: "Esiste un tracker delle candidature che si compila da solo?", a: [
    "Pinto Notes ha un modello gratuito, Job hunt. Incolla un annuncio in ChatGPT o Claude e lui aggiunge la riga, poi tiene aggiornati la fase e il prossimo passo man mano che gli racconti cosa è successo.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="candidature-lavoro-note-iphone"
      intro={<>
        Quasi tutti i tracker per le candidature sono fogli di calcolo, e un foglio di calcolo è una cosa in più da aprire. Se vivi già
        in Note di Apple, una nota può tenere ogni candidatura e cosa succede dopo. Ecco un tracker delle candidature per Note di Apple,
        come tenerlo aggiornato e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#settimana", label: "Settimana dopo settimana" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un tracker che si aggiorna da solo" },
        ]}>
          <p>
            Note di Apple non ha un modello per le candidature, ma una nota con una tabella basta: una riga per candidatura con l’azienda,
            il ruolo, la fase e il prossimo passo. Sotto la tabella tieni la preparazione dei colloqui, un elenco di controllo dei
            follow-up della settimana e le persone con cui hai parlato.
          </p>
          <PostCta template="job-hunt" slug="it/candidature-lavoro-note-iphone" path="/it/blog/candidature-lavoro-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che il tracker lo aggiorni qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per cercare lavoro. Incolla un annuncio in ChatGPT o Claude e lui aggiunge la riga, poi ti aiuta a prepararti per il colloquio.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/job-hunt-note" width={1520} height={1514} maxWidth={600}
        alt="Una nota Job hunt in Pinto Notes su un Mac: una tabella Applications di quattro lavori con Tideway alla fase Interview, la preparazione di un colloquio con tre domande e i punti da toccare, un elenco di controllo This week con un elemento spuntato e una nota su Karin di Tideway."
        caption="Un tracker delle candidature in Pinto Notes, con la fase come colonna a scelta. In Note di Apple la stessa tabella funziona, con la fase scritta a parole. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota, una riga per lavoro</h2>
      <p>
        La tabella risponde alla domanda che ti fai più spesso: a che punto è ogni candidatura, e cosa devo fare adesso. Metti una data in
        ogni prossimo passo, perché un &ldquo;follow-up&rdquo; senza giorno di solito resta da fare. Tutto quello che non sta in una riga va
        sotto la tabella.
      </p>
      <Keep title="Tabella delle candidature per Note di Apple" text={TABLE} copyLabel={ui.copy}
        note="Ogni riga della tabella ha una tabulazione tra le colonne. Incollala, poi trasforma quelle righe in una tabella." />
      <Keep title="Preparazione e follow-up per Note di Apple" text={REST} copyLabel={ui.copy}
        note="Sul Mac, incollalo sotto la tabella con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla il modello della tabella in una nota nuova, seleziona le cinque righe da
          Azienda a Northlight e premi il pulsante della tabella. Ogni tabulazione diventa una colonna, così hai Azienda, Ruolo, Fase e
          Prossimo passo una accanto all’altra.
        </li>
        <li>
          <strong>Aggiungi il resto.</strong> Fai clic sotto la tabella e scegli Modifica &gt; Incolla come Markdown con il secondo
          modello. Su macOS 27 ogni riga con ## diventa un’intestazione e i follow-up un elenco di controllo. Un Comando-V normale lascia
          i simboli come testo. Su iPhone, scrivi le intestazioni, seleziona i follow-up e tocca il pulsante dell’elenco di controllo.
        </li>
        <li>
          <strong>Aggiungi un lavoro.</strong> Fai clic nell’ultima cella e premi il Tabulatore per una riga nuova. Note decide da solo
          la larghezza delle colonne e non puoi trascinarle, quindi tieni ogni cella a poche parole.
        </li>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza resta in cima alla cartella, così è la prima cosa che vedi quando
          chiama un recruiter.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega tutto quello che una tabella in Note sa fare e
        non sa fare.
      </p>

      <h2 id="settimana">Settimana dopo settimana</h2>
      <ul>
        <li>
          <strong>Usa sempre le stesse parole per la fase.</strong> Salvata, Inviata, Colloquio, Offerta, Scartata, Ritirata. La tabella
          non si ordina, quindi sono quelle poche parole sempre uguali a rendere la colonna veloce da scorrere.
        </li>
        <li>
          <strong>Cambia la riga il giorno in cui succede qualcosa.</strong> Una risposta, un rifiuto, la data di un colloquio: aggiorna
          Fase e Prossimo passo prima di chiudere l’email.
        </li>
        <li>
          <strong>Pianifica i follow-up la domenica.</strong> Scorri la colonna Prossimo passo e copia quello che scade in Questa
          settimana. Con &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; attivo, quelli spuntati scendono in fondo.
        </li>
        <li>
          <strong>Dai una nota sua alla preparazione lunga.</strong> Quando la preparazione per un’azienda supera qualche domanda,
          spostala in una nota a parte e collegala da Preparazione colloqui con Modifica &gt; Aggiungi link (Comando-K).
        </li>
        <li>
          <strong>Annota chi hai conosciuto.</strong> Una riga su ogni persona, e su cosa le stava a cuore, è quello che vorrai rileggere
          prima del secondo colloquio. La ricerca legge ogni parola, quindi un nome la trova.
        </li>
      </ul>
      <p>
        Per gli appunti dei colloqui stessi, puoi usare una nota di riunione su iPhone. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma un tracker delle candidature in Note</h2>
      <ul>
        <li><strong>Ogni lavoro si scrive a mano.</strong> L’azienda, il ruolo e il link all’annuncio escono dall’offerta una cella alla volta.</li>
        <li><strong>Niente ordinamento né filtri.</strong> Con trenta righe, trovare quelle alla fase Colloquio vuol dire scorrere la colonna.</li>
        <li><strong>Le date sono solo testo.</strong> &ldquo;Follow-up, 16 nov&rdquo; sta in una cella. Accorgerti che è il 16 tocca a te.</li>
        <li><strong>La preparazione parte da una pagina bianca.</strong> Le domande probabili per ogni ruolo, e le tue risposte, le scrivi tu.</li>
      </ul>
      <p>
        Per una manciata di candidature, la nota è tutto quello che serve. Quando sono venti insieme, tenere aggiornata la tabella è un
        lavoro a sé.
      </p>

      <h2 id="pinto-notes">Un tracker delle candidature che si aggiorna da solo</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/job-hunt">Job hunt</a> è una nota con una tabella Applications, dove
        Stage è una scelta tra Saved, Applied, Interview, Offer, Rejected o Withdrawn, e le sezioni per la preparazione dei colloqui, i
        follow-up della settimana e le persone con cui hai parlato.
      </p>
      <p>
        Incolla un annuncio o un link nella tua AI e lei aggiunge una riga: l’azienda, il ruolo con il link all’annuncio, la fase Saved e
        il prossimo passo. Dille che ti sei candidato o che ti hanno risposto e cambia quella riga. Di’ &ldquo;giovedì ho un primo
        colloquio con Tideway, aiutami a prepararmi&rdquo; e scrive cinque domande probabili con i tuoi punti da toccare sotto il nome
        dell’azienda. Chiedi &ldquo;quali follow-up devo fare questa settimana?&rdquo; e te li elenca come elenco di controllo. Puoi
        sempre modificare ogni riga da te, e ogni versione precedente della nota viene conservata. Questa parte funziona quando ChatGPT o
        Claude sono collegati; <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Le note che tieni già in Note di Apple arrivano con <a href="/blog/import-your-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
