import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "diario-note-iphone");

// Italian version of /blog/apple-notes-journal-template (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: "diario iphone" gives diario iphone app, diario iphone su mac and diario iphone icloud; "diario personale
// app" and "diario giornaliero app" exist; "journaling" gives journaling come si fa. So the slug and title say "diario"
// plus "note di iPhone". Apple's own Journal app is called Diario in Italian; the English post never mentions it, so
// this one doesn't either, and "diario" here always means the note. Apple's own Italian words, all read 21 Nov: the Mac
// guide support.apple.com/it-it/guide/notes/not9474646a9/mac (File > Duplica nota), apdb54e469b6/mac ("Ordinare e
// mettere in evidenza le note sul Mac": a note in evidenza stays at the top), apd93c815aa0/mac (press A capo at the end
// of a line), not18ab658ed/mac ("Cercare le note sul Mac": search reads the body of every note), apdc88ed7f1d/mac
// ("Utilizzare i tag in Note sul Mac": # and a word), apd58edc7964/mac ("Usare le cartelle smart": the Tag rule) and
// not28c5f5468/mac ("Proteggere le note sul Mac": Proteggi nota, note protette; Notes' Localizable.loctable on macOS
// 27 also says Proteggi nota). Modifica > Incolla come Markdown is new in macOS 27 and not in the Italian guide yet: it
// is the Italian string in Notes' MainMenu.loctable on macOS 27. Facts are the English post's; the picture is its
// English one, described in Italian. The Pinto template writes the labels Today, Energy, Remember and Tomorrow in
// English, so they stay English where the post describes it. The example people are Marco and Giulia. Links: the mood
// tracker and the habit tracker go to their Italian versions; Apple Notes templates, tags and Smart Folders, and
// Connecting ChatGPT go to English posts.

const ui = UI.it;

const TEMPLATE = `# Diario

Qualche riga al giorno, il giorno più recente in alto.

## Domande
1. Cosa è successo oggi?
2. Cosa mi ha tolto energia, e cosa me l’ha ridata?
3. Cosa voglio ricordare?
4. Qual è una cosa da fare domani?

## Domenica 8 novembre
- Oggi: giornata tranquilla; finita la libreria e fatta una lunga passeggiata.
- Energia: bassa dopo pranzo, meglio dopo il caffè con Marco.
- Da ricordare: il forno all’angolo apre alle sette.
- Domani: chiamare la mamma.

## Sabato 7 novembre
- Oggi: aiutato Giulia a traslocare; è andata più in fretta di quanto temevamo.
- Energia: le scale me l’hanno tolta, la pizza dopo me l’ha ridata.
- Da ricordare: Giulia dice che la casa nuova prende il sole la sera.
- Domani: rispondere al padrone di casa entro mezzogiorno.
`;

const PROMPTS = `Con chi ho parlato oggi?
Cosa mi ha sorpreso?
Cosa farei in modo diverso?
Cosa aspetto con piacere?
Cosa ho rimandato, e perché?
`;

const FAQ = [
  { q: "Note di Apple ha un modello per il diario?", a: [
    "No. Note di Apple non ha modelli. Una nota con qualche domanda in alto e un’intestazione per ogni giorno funziona come diario, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Meglio una nota al giorno o una nota per tutto il diario?", a: [
    "Una nota sola è più facile da tenere: è sempre nello stesso posto, e gli ultimi giorni sono subito sotto le domande. Quando diventa lunga, inizia una nota nuova per il mese dopo.",
  ] },
  { q: "Posso proteggere il mio diario in Note di Apple?", a: [
    "Sì. Note di Apple può proteggere una nota, e una nota protetta si apre con una password o con Face ID o Touch ID. Proteggi la nota del diario, e con lei ogni giorno che contiene.",
  ] },
  { q: "Come ritrovo una vecchia pagina del diario?", a: [
    "La ricerca legge ogni parola di ogni nota, quindi cerca un nome, un posto o una parola che ricordi di aver scritto. Un tag come #viaggio sui giorni che contano permette a una cartella smart di raccogliere quelle note.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="diario-note-iphone"
      intro={<>
        Quasi tutti i diari si fermano alla pagina bianca. Qualche domanda fissa ti aiuta a superarla, e Note di Apple è già sul tuo
        telefono a fine giornata. Ecco un modello di diario per Note di Apple da incollare, come portarlo avanti, come ritrovare i giorni
        passati e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#ogni-giorno", label: "Ogni giorno" },
          { href: "#altre-domande", label: "Quando non sai cosa scrivere" },
          { href: "#giorni-passati", label: "Ritrovare i giorni passati" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un diario che ti fa le domande" },
        ]}>
          <p>
            Note di Apple non ha un modello per il diario, ma basta una nota: quattro domande brevi in alto, poi un’intestazione per ogni
            giorno, con il più recente per primo. Rispondi alle domande con una riga ciascuna, e quando la apri hai sempre davanti gli
            ultimi giorni.
          </p>
          <PostCta template="daily-journal" slug="it/diario-note-iphone" path="/it/blog/diario-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che la pagina la scriva qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un diario gratuito. Racconta la tua giornata a ChatGPT o a Claude e lui scrive la pagina con le tue parole, con il giorno più recente in alto.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-journal-note" width={1520} height={1093} maxWidth={600}
        alt="Una nota Daily journal in Pinto Notes su un Mac: quattro domande numerate, poi le pagine di domenica 8 novembre e sabato 7 novembre, la più recente in alto, ognuna con le righe Today, Energy, Remember e Tomorrow."
        caption="Un diario in Pinto Notes, con il giorno più recente in alto. Lo stesso schema funziona in Note di Apple." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota, il giorno più recente in alto</h2>
      <p>
        Le domande stanno in alto, così non ti trovi mai davanti a una pagina bianca. Ogni giorno ha un’intestazione con il giorno della
        settimana e la data, e sotto le risposte, una riga breve ciascuna. Il giorno più recente va subito sotto le domande, così leggi
        oggi e ieri senza scorrere. Due giorni di esempio sono già compilati; sostituiscili con i tuoi.
      </p>
      <Keep title="Diario per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo e ogni riga con ## in
        un’intestazione. Un Comando-V normale lascia i simboli come testo. Su iPhone, scrivi le domande una volta, poi aggiungi ogni
        giorno a mano.
      </p>
      <p>
        Se la mattina pianifichi anche la giornata, il Daily plan in <a href="/blog/apple-notes-templates">Apple Notes templates</a>{" "}
        (in inglese) è l’altra metà: tre cose per oggi, e cosa fare se avanza tempo. Tienilo in una nota a parte, così il diario resta il
        racconto di quello che è successo.
      </p>

      <h2 id="ogni-giorno">Ogni giorno</h2>
      <ul>
        <li>
          <strong>Metti la nota in evidenza.</strong> In evidenza in cima alla sua cartella, è la prima cosa che vedi quando apri Note a
          letto.
        </li>
        <li>
          <strong>Aggiungi il giorno in alto.</strong> Fai clic alla fine dell’ultima domanda, premi A capo e scrivi la nuova
          intestazione. Il giorno prima scivola sotto.
        </li>
        <li>
          <strong>Basta una riga.</strong> Salta una domanda quando non hai niente da dire. Un diario che tieni per un anno con due righe
          al giorno vale più di uno che tieni per una settimana con due pagine.
        </li>
        <li>
          <strong>Scrivi con le tue parole.</strong> &ldquo;Le scale me l’hanno tolta, la pizza dopo me l’ha ridata&rdquo; tra un anno
          ti dirà più di &ldquo;stanco&rdquo;.
        </li>
        <li>
          <strong>Inizia una nota nuova ogni mese.</strong> Quando la nota diventa lunga, scegli File &gt; Duplica nota, dai alla copia
          il nome del nuovo mese e cancella da lei i giorni vecchi. Le domande vengono con lei.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["File", "Duplica nota"] }]} />

      <h2 id="altre-domande">Quando le quattro domande non vanno bene</h2>
      <p>
        Le quattro domande coprono quasi tutti i giorni. Nei giorni in cui non bastano, sostituiscine una con una domanda di questo
        elenco, oppure tieni l’elenco in fondo alla nota per pescare da lì.
      </p>
      <Keep title="Domande di riserva per il diario" text={PROMPTS} copyLabel={ui.copy} />
      <p>
        Se vuoi seguire come ti senti anche in numeri, oltre che a parole, il{" "}
        <a href="/it/blog/mood-tracker-note-iphone">mood tracker nelle note di iPhone</a> è una tabella con una riga per ogni sera. Per
        le abitudini da spuntare c’è l’<a href="/it/blog/habit-tracker-note-iphone">habit tracker nelle note di iPhone</a>.
      </p>

      <h2 id="giorni-passati">Ritrovare i giorni passati</h2>
      <ul>
        <li>
          <strong>Cerca una parola.</strong> La ricerca di Note legge ogni parola di ogni nota, quindi &ldquo;forno&rdquo; o il nome di
          un amico trova il giorno in cui l’hai scritto.
        </li>
        <li>
          <strong>Metti un tag ai giorni che contano.</strong> Scrivi #viaggio o #famiglia sulla riga e diventa un tag. Una cartella
          smart con una regola Tag raccoglie poi tutte le note che lo hanno.{" "}
          <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> (in inglese) spiega come funzionano e cosa
          controllare quando non funzionano.
        </li>
      </ul>
      <p>
        Un diario è privato. Puoi proteggere la nota con una password o con Face ID o Touch ID, così non si apre per chiunque prenda in mano il tuo
        telefono.
      </p>

      <h2 id="limiti">Dove si ferma un diario in Note</h2>
      <ul>
        <li><strong>La riga vuota resta da riempire a te.</strong> Le domande aiutano, ma in una sera stanca nessuno te le fa.</li>
        <li><strong>Ogni giorno va scritto.</strong> Se preferisci raccontare la giornata a voce, poi devi metterla per iscritto.</li>
        <li><strong>La ricerca trova parole, non temi.</strong> Trova &ldquo;padrone di casa&rdquo;. Non può dirti cosa ti è girato in testa nelle ultime tre settimane.</li>
      </ul>
      <p>
        Per tanti, una nota e quattro domande sono tutto il diario, e bastano. Quello che la nota non sa fare è guardare indietro al
        posto tuo.
      </p>

      <h2 id="pinto-notes">Un diario che ti fa le domande</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/daily-journal">Daily journal</a> è una nota con le stesse quattro
        domande e sotto le tue pagine, con il giorno più recente in alto.
      </p>
      <p>
        Di’ che vuoi scrivere il diario e la tua AI ti fa le domande una alla volta, saltando quelle che lasci perdere. Oppure raccontale
        la giornata tutta insieme, tipo &ldquo;giornata lunga: il trasloco di Giulia è fatto, i suoi scatoloni no, e io sono sul
        divano&rdquo;, e scrive la pagina senza chiederti niente. Ogni giorno ha un’intestazione con il giorno della settimana e la data,
        e righe brevi con le tue parole per Today, Energy, Remember e Tomorrow. Non aggiunge consigli se non li chiedi. Più avanti, chiedi
        &ldquo;cosa mi è girato in testa questa settimana?&rdquo; e risponde dalle tue pagine. Puoi sempre scrivere e modificare ogni
        giorno da te, e ogni versione precedente della nota viene conservata. Funziona quando ChatGPT o Claude è collegato;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Un diario che tieni già in Note di Apple arriva con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
