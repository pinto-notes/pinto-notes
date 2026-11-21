import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "weekly-review-note-iphone");

// Italian version of /blog/apple-notes-weekly-review-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "weekly review" gives weekly review template, weekly review gtd and weekly review questions;
// "revisione settimanale", "review settimanale" and "riflessione settimanale" give nothing. So Italians search the
// English term, and the slug and title keep "weekly review" plus "note di iPhone". Apple's own Italian words, all read
// 21 Nov: the Mac guide support.apple.com/it-it/guide/notes/apd93c815aa0/mac ("Aggiungere elenchi in Note sul Mac":
// elenco di controllo, "Ordina automaticamente gli elementi selezionati" in the Notes settings), apdb54e469b6/mac
// ("Ordinare e mettere in evidenza le note sul Mac": a note in evidenza stays at the top of the list), not18ab658ed/mac
// ("Cercare le note sul Mac": search reads the body of every note), apdc88ed7f1d/mac ("Utilizzare i tag in Note sul
// Mac": # and a word, the Tag section of the sidebar), and the iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios (the
// checklist button, which has no name, so it is described). Modifica > Incolla come Markdown is new in macOS 27 and not
// in the Italian guide yet: it is the Italian string in Notes' MainMenu.loctable on macOS 27. Facts are the English
// post's; the picture is its English one, described in Italian. The example person is Marco. Links: the habit tracker
// and the journal go to their Italian versions; Apple Notes templates and Connecting ChatGPT go to English posts.

const ui = UI.it;

const TEMPLATE = `# Weekly review

Venti minuti la domenica. La settimana più recente in alto.

## Domande
1. Cosa è andato bene questa settimana?
2. Cosa non è andato, e perché?
3. Cosa ho imparato?
4. Per cosa provo gratitudine?
5. Quali sono le mie tre priorità per la prossima settimana?

## Settimana del 2 novembre
- Bene: relazione consegnata un giorno prima; quattro allenamenti.
- Male: niente lavoro concentrato giovedì, troppe riunioni.
- Imparato: un ordine del giorno da 30 minuti batte una riunione da 60.
- Gratitudine: la cena con mia sorella.
- [ ] Bloccare il giovedì mattina per il lavoro concentrato
- [ ] Mandare il piano del quarto trimestre a Marco
- [ ] Prenotare il dentista
`;

const FAQ = [
  { q: "Note di Apple ha un modello per la weekly review?", a: [
    "No. Note di Apple non ha modelli. Una nota con le domande in alto e sotto un’intestazione per ogni settimana funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Quali domande mettere in una weekly review?", a: [
    "Cinque bastano: cosa è andato bene, cosa no e perché, cosa hai imparato, per cosa provi gratitudine, e le tue tre priorità per la prossima settimana. L’ultima è la parte che userai il lunedì.",
  ] },
  { q: "Una nota a settimana o una nota per tutte le settimane?", a: [
    "Una nota per tutte le settimane, con la più recente in alto. Le tre priorità della settimana scorsa sono subito sotto quelle di questa, e la ricerca trova una parola in tutte.",
  ] },
  { q: "Esiste una weekly review che mi fa le domande?", a: [
    "Pinto Notes ha un modello gratuito, Weekly review. Di’ a ChatGPT o a Claude che è ora della tua review e ti fa le cinque domande una alla volta, poi scrive la settimana nella tua nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="weekly-review-note-iphone"
      intro={<>
        Una weekly review sono venti minuti la domenica che ti risparmiano un lunedì confuso. Funziona solo se le domande sono le stesse
        ogni settimana, quindi il loro posto è una nota che tieni. Ecco un modello di weekly review per Note di Apple, come farla
        diventare un’abitudine e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#domenica", label: "La domenica" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Una review che ti fa le domande" },
        ]}>
          <p>
            Note di Apple non ha un modello per la weekly review, ma basta una nota: cinque domande in alto, poi un’intestazione per ogni
            settimana con le risposte in righe brevi e le tre priorità della settimana dopo come elenco di controllo. Aggiungi la
            settimana nuova in alto, così il piano della settimana scorsa resta subito sotto.
          </p>
          <PostCta template="weekly-review" slug="it/weekly-review-note-iphone" path="/it/blog/weekly-review-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le domande te le faccia qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per la weekly review. ChatGPT o Claude ti fa le cinque domande, poi scrive la settimana nella tua nota.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-review-note" width={1520} height={989} maxWidth={600}
        alt="Una nota Weekly review in Pinto Notes su un Mac: cinque domande numerate, poi la review della settimana del 2 novembre con cosa è andato bene, cosa no, cosa si è imparato e un grazie, e un elenco di controllo con le tre priorità, dove Book the dentist è spuntato."
        caption="Una weekly review in Pinto Notes, scritta come la scrive il modello. Lo stesso schema funziona in Note di Apple, con un’intestazione per ogni settimana. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: cinque domande, una nota</h2>
      <p>
        Le domande stanno in alto, così non devi mai ricordarle. Ogni settimana ha un’intestazione con la data del lunedì, una riga per
        ogni risposta e le tre priorità come elenco di controllo da spuntare durante la settimana. Lascia una parola in ogni riga, perché
        un elemento vuoto dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Weekly review per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <ul>
        <li>
          <strong>Incollalo una volta.</strong> Su un Mac con macOS 27, crea una nota e scegli Modifica &gt; Incolla come Markdown. La
          riga con # diventa il titolo, ogni riga con ## un’intestazione e le tre priorità un elenco di controllo. Un Comando-V normale
          lascia i simboli come testo. Su iPhone, scrivilo, seleziona le tre priorità e tocca il pulsante dell’elenco di controllo.
        </li>
        <li>
          <strong>Tieni la settimana di esempio come guida.</strong> Lasciala lì per la prima domenica, poi sostituiscila con la tua.
        </li>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza sta in cima alla sua cartella, così la trovi lì quando apri Note la
          domenica.
        </li>
      </ul>

      <h2 id="domenica">La domenica</h2>
      <ul>
        <li>
          <strong>Parti dalle tre priorità della settimana scorsa.</strong> Spunta quello che hai fatto prima di scrivere qualcosa di
          nuovo. Quello che resta aperto passa alle tre della settimana dopo, oppure lo lasci cadere di proposito.
        </li>
        <li>
          <strong>Aggiungi la settimana nuova in alto.</strong> Copia il blocco della settimana scorsa, incollalo sotto le domande e
          cambia la data e le righe. Bastano poche parole per risposta, purché tra un mese tu le capisca ancora.
        </li>
        <li>
          <strong>Scegline tre, non dieci.</strong> Tre cose che ti farebbe piacere aver fatto entro venerdì. Con &ldquo;Ordina
          automaticamente gli elementi selezionati&rdquo; attivo, quelle spuntate scendono in fondo all’elenco.
        </li>
        <li>
          <strong>Guarda indietro una volta al mese.</strong> La ricerca legge ogni parola, quindi cercando &ldquo;riunioni&rdquo; vedi
          quante volte erano loro il problema. Un tag come #review nella nota la tiene a un tocco di distanza nella barra laterale.
        </li>
      </ul>
      <p>
        Una weekly review più breve, con la stessa idea, è una delle note in <a href="/blog/apple-notes-templates">Apple Notes
        templates</a> (in inglese). Per seguire quello che fai ogni giorno tra una review e l’altra,
        l’<a href="/it/blog/habit-tracker-note-iphone">habit tracker nelle note di iPhone</a> le sta bene accanto, e il{" "}
        <a href="/it/blog/diario-note-iphone">diario nelle note di iPhone</a> è per i giorni stessi.
      </p>

      <h2 id="limiti">Dove si ferma una weekly review in Note</h2>
      <ul>
        <li><strong>Le domande non si fanno da sole.</strong> In una domenica stanca, un elenco di domande è facile da saltare.</li>
        <li><strong>Riportare le cose è a mano.</strong> Le voci non spuntate della settimana scorsa restano dove sono finché non le copi in alto.</li>
        <li><strong>Per vedere cosa si ripete devi rileggere.</strong> La ricerca trova una parola. Non può dirti cosa torna sempre in due mesi di review.</li>
      </ul>
      <p>
        Se l’abitudine regge già, la nota è tutto quello che ti serve. Se salta nelle settimane piene, quello che manca è qualcuno che ti
        faccia le domande.
      </p>

      <h2 id="pinto-notes">Una weekly review che ti fa le domande</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/weekly-review">Weekly review</a> è una nota con le cinque domande e una
        sezione Reviews, con la settimana più recente in alto.
      </p>
      <p>
        Di’ alla tua AI che è ora della weekly review. Ti fa le cinque domande una alla volta, poi aggiunge la settimana in cima a
        Reviews: un’intestazione con la data del lunedì, le tue risposte in righe brevi con le tue parole, e le tre priorità come elenco
        di controllo. Dille che una è fatta e la spunta. Chiedi &ldquo;su cosa avevo detto di concentrarmi la settimana scorsa?&rdquo; o
        &ldquo;cosa torna sempre nelle mie review?&rdquo; e rilegge la nota per risponderti. Puoi sempre scrivere e spuntare tutto da
        te, e ogni versione precedente della nota viene conservata. Questa parte funziona quando ChatGPT o Claude è collegato;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Le note che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
