import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "mood-tracker-note-iphone");

// Italian version of /blog/apple-notes-mood-tracker (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "mood tracker" gives mood tracker app and mood tracker pdf; "mood tracker iphone" exists; "diario dell'umore"
// gives diario dell umore app, so the text uses it once; "tracker umore" gives nothing. So the slug and title keep the
// English "mood tracker" plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato > Tabella, a
// table of two rows and two columns, the Tabulatore or A capo in the last cell adds a row, selected lines of text become
// a table with the table button), apdb54e469b6/mac ("Ordinare e mettere in evidenza le note sul Mac"), not18ab658ed/mac
// ("Cercare le note sul Mac": search reads the body of every note) and apda85974595/mac ("Risolvere operazioni in Note
// sul Mac": Risultati matematici, an expression ending in = gets its result). The table button has no name in the
// guide, so it is described. As in the English post, Paste as Markdown is not used for the table. The template uses
// the Italian decimal comma for hours of sleep. No medical advice, as in the English post. Facts are the English
// post's; the picture is its English one, described in Italian. The example person is Giulia. Links: the journal and
// the habit tracker go to their Italian versions; Tables in Apple Notes and Connecting ChatGPT go to English posts.

const ui = UI.it;

// Tabs between the columns: select those lines in Notes and press the table button.
const TEMPLATE = `Diario di umore ed energia

Data\tUmore (da 1 a 5)\tEnergia (da 1 a 5)\tSonno (ore)\tNota
4 nov\t4\t4\t7,5\tPalestra prima del lavoro
5 nov\t3\t2\t6\tRiunioni tutto il giorno
6 nov\t4\t3\t6,5\tPranzo con Giulia
7 nov\t4\t2\t5,5\tTrasloco di Giulia
8 nov\t4\t4\t8\tDormito fino a tardi

Tendenze
`;

const FAQ = [
  { q: "Note di Apple ha un mood tracker?", a: [
    "No. Note di Apple non ha un mood tracker e nemmeno dei modelli. Una tabella con una riga per ogni sera, con umore, energia, sonno e una nota breve, funziona come tale, e puoi incollare il modello di questa pagina e trasformarlo in una tabella.",
  ] },
  { q: "Cosa deve avere un mood tracker?", a: [
    "Tienilo abbastanza piccolo da compilarlo ogni sera: la data, umore ed energia da 1 a 5, le ore di sonno e una riga sulla giornata. La riga è la parte più importante, perché è quella che più avanti spiega un punteggio basso.",
  ] },
  { q: "Note di Apple può fare un grafico del mio umore?", a: [
    "No. Una tabella in Note non ordina, non somma e non disegna grafici. Le colonne le leggi tu, oppure copi le righe in un foglio di calcolo quando vuoi un grafico.",
  ] },
  { q: "Esiste un mood tracker che trova le tendenze per me?", a: [
    "Pinto Notes ha un modello gratuito, Mood and energy log. Racconta la tua giornata a ChatGPT o a Claude e lui segna i punteggi, e quando glielo chiedi scrive quello che nota e su quanti giorni si basa.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="mood-tracker-note-iphone"
      intro={<>
        Una brutta settimana sembra arrivata dal nulla finché non guardi le notti che l’hanno preceduta. Un mood tracker, o diario
        dell’umore, è il modo per guardarle. Ecco un tracker di umore ed energia per Note di Apple da incollare, un modo per tenerlo per
        più di una settimana, e dove si ferma una nota.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#ogni-sera", label: "Ogni sera" },
          { href: "#guardare-indietro", label: "Guardare indietro" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un diario che trova le tendenze" },
        ]}>
          <p>
            Note di Apple non ha un mood tracker, ma una tabella fa il lavoro: una riga per ogni sera con la data, umore ed energia da 1
            a 5, le ore di sonno e una riga sulla giornata. Dopo qualche settimana, leggi le colonne dall’alto in basso per vedere cosa
            hanno in comune le tue giornate buone.
          </p>
          <PostCta template="mood-energy-log" slug="it/mood-tracker-note-iphone" path="/it/blog/mood-tracker-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le tendenze le trovi qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un diario gratuito di umore ed energia. Racconta la tua giornata a ChatGPT o a Claude e lui aggiunge la riga, poi ti dice cosa nota quando glielo chiedi.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/mood-energy-log-note" width={1520} height={1057} maxWidth={600}
        alt="Una nota Mood and energy log in Pinto Notes su un Mac: una tabella Check-ins con cinque sere dal 4 all’8 novembre, ognuna con umore, energia, ore di sonno e una nota breve, e sotto tre tendenze."
        caption="Un diario di umore ed energia in Pinto Notes, dove umore ed energia sono scale da 1 a 5. In Note di Apple le stesse colonne funzionano come una tabella semplice. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una riga ogni sera</h2>
      <p>
        Cinque colonne, e ognuna si guadagna il suo posto. L’umore è come ti è sembrata la giornata. L’energia è quanta ne avevi, che non
        è la stessa cosa: una bella giornata può lasciarti a terra. Il sonno è il numero che più probabilmente spiega entrambi. La nota è
        una riga sulla giornata, così un 3 tra due settimane vuol dire ancora qualcosa. Cinque sere di esempio sono già compilate;
        sostituiscile con le tue.
      </p>
      <Keep title="Diario di umore ed energia per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Ogni riga della tabella ha una tabulazione tra le colonne. Incollalo, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla il modello in una nota nuova, seleziona le sei righe da Data all’ultima
          sera e premi il pulsante della tabella. Ogni tabulazione diventa una colonna, così hai Data, Umore, Energia, Sonno e Nota
          affiancati.
        </li>
        <li>
          <strong>Togli gli esempi, aggiungi le tue righe.</strong> Cancella le sere di esempio o scrivici sopra. Il Tabulatore
          nell’ultima cella aggiunge la riga successiva.
        </li>
        <li>
          <strong>Tieni la nota corta.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi una nota
          lunga schiaccia i numeri. Bastano poche parole.
        </li>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza sta in cima alla sua cartella, così la compilazione della sera è a
          un tocco di distanza.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega tutto quello che una tabella in Note sa fare e
        non sa fare.
      </p>

      <h2 id="ogni-sera">Ogni sera</h2>
      <ul>
        <li><strong>Stessa ora, ogni giorno.</strong> Compilalo mentre ti lavi i denti o metti il telefono in carica, così si appoggia a qualcosa che fai già.</li>
        <li><strong>Dai il voto a tutta la giornata.</strong> L’umore alle dieci di sera dopo una bella cena dice poco di un pomeriggio difficile. Ripensa alla giornata prima di scegliere un numero.</li>
        <li><strong>Usa tutta la scala.</strong> Se ogni giorno è un 3, il diario non può mostrarti niente. Un 1 o un 5 ogni tanto è onesto.</li>
        <li><strong>Scrivi cosa è stato diverso.</strong> &ldquo;Riunioni tutto il giorno&rdquo; o &ldquo;dormito fino a tardi&rdquo; è quello che cercherai più avanti.</li>
        <li><strong>Se salti un giorno, lascialo fuori.</strong> Un buco è meglio di un punteggio inventato tre giorni dopo.</li>
      </ul>
      <p>
        Se vuoi anche le parole oltre ai numeri, puoi rispondere a quattro domande brevi al giorno in un diario su iPhone, e l’<a href="/it/blog/habit-tracker-note-iphone">habit tracker</a> sta bene accanto a questa nota per
        cose come una passeggiata o niente schermi dopo le dieci.
      </p>

      <h2 id="guardare-indietro">Guardare indietro</h2>
      <p>
        Una volta a settimana, leggi la tabella dall’alto in basso e scrivi quello che noti sotto Tendenze. La ricerca legge ogni parola
        di ogni nota, quindi cercando &ldquo;riunioni&rdquo; trovi ogni giorno in cui l’hai scritto. Per un totale veloce, Risultati
        matematici fa le operazioni che scrivi, quindi 4+3+4+4+4= sotto la tabella somma l’umore della settimana.
      </p>
      <p>
        Lascia passare qualche settimana prima di trarre conclusioni; cinque giorni sono un inizio. Questo è un diario di come ti senti,
        non uno strumento per la salute. Se le giornate brutte continuano ad accumularsi, parlane con un medico.
      </p>

      <h2 id="limiti">Dove si ferma un mood tracker in Note</h2>
      <ul>
        <li><strong>Le tabelle non fanno conti.</strong> Una tabella in Note non può mettere in cima le tue giornate migliori, fare la media di una colonna o disegnare un grafico.</li>
        <li><strong>Le tendenze sono a occhio.</strong> Per vedere che l’energia cala dopo una notte corta devi leggere ogni riga e tenere tutto a mente.</li>
        <li><strong>La riga va scritta.</strong> In una sera stanca, cinque celle bastano per fartela saltare.</li>
      </ul>
      <p>
        Per un mese, una tabella in una nota è tutto quello che ti serve. Su più mesi, la parte utile, cioè capire cosa ti tira su e cosa
        ti svuota, resta a te.
      </p>

      <h2 id="pinto-notes">Un diario dell’umore che trova le tendenze</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/mood-energy-log">Mood and energy log</a> è una nota con una tabella
        Check-ins: la data, umore ed energia come scale da 1 a 5, il sonno in ore e una nota, e sotto la sezione Patterns.
      </p>
      <p>
        Ogni sera, racconta la tua giornata alla tua AI con le tue parole. Aggiunge la riga, con umore ed energia da 1 (basso) a 5
        (ottimo), il sonno e una riga breve. Quando non è sicura di un punteggio, te lo chiede invece di tirare a indovinare. Dopo
        qualche settimana, chiedi &ldquo;cosa hanno in comune le mie giornate migliori?&rdquo; o &ldquo;una notte corta cambia la mia
        energia il giorno dopo?&rdquo; e scrive quello che nota sotto Patterns, con il numero di giorni su cui si basa. Non dà consigli
        medici. Puoi sempre aggiungere e modificare ogni riga da te, e ogni versione precedente della nota viene conservata. Funziona
        quando ChatGPT o Claude è collegato; <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede
        un minuto.
      </p>
      <p>
        Un diario che tieni già in Note di Apple arriva con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
