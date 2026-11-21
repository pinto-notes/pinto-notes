import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "lista-regali-note-iphone");

// Italian version of /blog/apple-notes-gift-ideas (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "lista regali" gives lista regali natale and lista regali compleanno; "idee regalo" gives idee regalo natale;
// "budget regali natale" is suggested too. So the slug and title say "lista regali" plus "note di iPhone", and the text
// says "idee regalo" and uses euro budgets. Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato > Tabella, a
// table of two rows and two columns, the Tabulatore or A capo in the last cell adds a row, selected lines of text
// become a table with the table button), apd93c815aa0/mac ("Aggiungere elenchi in Note sul Mac": Formato > Altro >
// Deseleziona tutti, "Ordina automaticamente gli elementi selezionati" in the Notes settings), apda85974595/mac
// ("Risolvere operazioni in Note sul Mac": Risultati matematici, an expression ending in = gets its result),
// not28c5f5468/mac ("Proteggere le note sul Mac": a nota protetta opens only with its password; Proteggi nota is the
// Italian string in Notes' MainMenu.loctable), apdb54e469b6/mac ("Ordinare e mettere in evidenza le note sul Mac": a
// note in evidenza stays at the top of the list), not18ab658ed/mac ("Cercare le note sul Mac": search looks in the body
// of every note), and the iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button). The table and
// checklist buttons have no name in the guides, so they are described. Modifica > Incolla come Markdown is new in
// macOS 27 and not in the Italian guide yet: it is the Italian string in Notes' MainMenu.loctable on macOS 27, like
// Formato > Tabella. As in the English post, Paste as Markdown is not used for the table. The English example people
// (Maja, Dad, Jonas, Mum, Emma) become Sara, Papà, Luca, Mamma and Giulia, with budgets in euro; the picture is the
// English one, with its own names and kr, described as it is. Facts are the English post's. The budget link goes to
// its Italian version; the rest go to English posts. Pinto's template and its Status choices keep their English names,
// since the app is in English.

const ui = UI.it;

const SKELETON = `# Idee regalo

## Idee
Incolla qui la tabella.

## Taglie e gusti
- Sara: cucina tanto, ha già una planetaria.
- Luca: taglia M, adora tutto ciò che è verde.
- Mamma: basta oggetti, preferisce fare qualcosa insieme.
- Papà: ha già tutte le sciarpe della sua squadra.

## Natale
- [ ] Mamma
- [ ] Papà
- [ ] Luca
`;

// Tabs between the columns: select these lines in Notes and press the table button.
const TABLE = `Persona\tOccasione\tIdea\tBudget\tStato
Sara\tCasa nuova\tUn buon coltello da cuoco\t90\tIdea
Papà\tNatale\tBiglietti per la partita\t120\tComprato
Luca\tCompleanno\tUn berretto di lana verde\t30\tIdea
Mamma\tNatale\tUn weekend fuori\t300\tIdea
Giulia\tRingraziamento\tUn buon olio d’oliva\t20\tRegalato
`;

const FAQ = [
  { q: "Note di Apple ha un modello per la lista dei regali?", a: [
    "No. Note di Apple non ha nessun modello. Una nota con una tabella delle idee per persona e un elenco di taglie e gusti funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Come tengo la lista dei regali di Natale su iPhone?", a: [
    "Tieni una nota con un elenco di controllo di tutte le persone a cui fai un regalo e spunta ogni nome quando hai comprato il suo. Metti la nota in evidenza, così è in cima quando sei in un negozio.",
  ] },
  { q: "Posso nascondere una lista dei regali in Note di Apple?", a: [
    "Sì. Proteggi la nota con una password o con Face ID o Touch ID, e il contenuto resta nascosto finché non la sblocchi.",
  ] },
  { q: "Esiste un’app per le idee regalo che ricorda cosa piace alle persone?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito per le idee regalo. Di’ a ChatGPT o a Claude cosa piacerebbe a qualcuno e lo salva, poi prima di un compleanno ti suggerisce regali nel budget.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="lista-regali-note-iphone"
      intro={<>
        L’idea regalo perfetta arriva a marzo, di passaggio, e a dicembre è sparita. Una nota in cui la scrivi appena la senti risolve
        il problema. Ecco una lista di idee regalo per Note di Apple, persona per persona, con budget e taglie, pronta per Natale e per
        ogni compleanno dopo.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#durante-l-anno", label: "Durante l’anno" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Una lista che suggerisce regali" },
        ]}>
          <p>
            Note di Apple non ha un modello per la lista dei regali, ma basta una nota: una tabella con la persona, l’occasione, l’idea,
            un budget e se l’hai già comprato, poi un elenco di taglie e gusti per ogni persona. Mettila in evidenza, e aggiungi
            un’idea nel momento in cui la senti.
          </p>
          <PostCta template="gift-ideas" slug="it/lista-regali-note-iphone" path="/it/blog/lista-regali-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi salvare le idee regalo appena le senti?">
            <p>Pinto Notes funziona come Note di Apple e ha una lista di idee regalo gratuita. Di’ a ChatGPT o a Claude cosa piacerebbe a qualcuno e aggiunge l’idea, poi prima di un compleanno ti suggerisce regali nel budget.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/gift-ideas-note" width={1520} height={1057} maxWidth={600}
        alt="Una nota Gift ideas in Pinto Notes su un Mac: una tabella Ideas con cinque regali per Maja, Dad, Jonas, Mum ed Emma, con l’occasione, un budget in corone e uno stato, e un elenco Sizes and likes per quattro persone."
        caption="Una lista di idee regalo in Pinto Notes, dove Budget è un numero e Status è una scelta. In Note di Apple la stessa tabella li tiene come testo scritto a mano." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: idee per persona, taglie e gusti</h2>
      <p>
        La tabella tiene ogni idea, una riga ciascuna, così vedi subito chi ha già qualcosa e chi no. L’elenco di taglie e gusti è
        quello che impari sulle persone durante l’anno: una taglia, un colore preferito, cosa hanno già. L’elenco di controllo di Natale
        è chi aspetta ancora un regalo. La nota arriva in due parti: prima le intestazioni e gli elenchi, poi la tabella.
      </p>
      <Keep title="Idee regalo per Note di Apple" text={SKELETON} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e i nomi sotto Natale in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone,
        scrivila a mano, seleziona i nomi e tocca il pulsante dell’elenco di controllo. Poi sostituisci la riga sotto Idee con la
        tabella.
      </p>
      <Keep title="Tabella delle idee" text={TABLE} copyLabel={ui.copy}
        note="Ogni riga ha una tabulazione tra le colonne. Incollala, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla le righe della tabella sotto Idee, seleziona le sei righe da Persona
          all’ultimo regalo e premi il pulsante della tabella. Ogni tabulazione diventa una colonna.
        </li>
        <li>
          <strong>Oppure parti da zero.</strong> Scegli Formato &gt; Tabella per due righe e due colonne, e il Tabulatore nell’ultima
          cella aggiunge la riga successiva.
        </li>
        <li>
          <strong>Tieni corta ogni idea.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle. &ldquo;Un
          berretto di lana verde&rdquo; basta, e i dettagli vanno sotto Taglie e gusti.
        </li>
        <li>
          <strong>Proteggila se in famiglia usate lo stesso Mac.</strong> Una nota protetta si apre solo con la tua password o con
          Face ID o Touch ID.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega tutto quello che una tabella in Note sa fare e
        non sa fare.
      </p>

      <h2 id="durante-l-anno">Durante l’anno, e a Natale</h2>
      <ul>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza resta in cima alla cartella, così un’idea sentita a cena finisce
          nella nota prima che te la dimentichi.
        </li>
        <li>
          <strong>Cerca per nome.</strong> La ricerca di Note legge ogni parola, quindi cercando &ldquo;Luca&rdquo; trovi la sua riga
          e la sua taglia.
        </li>
        <li>
          <strong>Somma i budget da te.</strong> Le tabelle non fanno somme, ma Risultati matematici calcola le operazioni che scrivi.
          Sotto la tabella scrivi 120 + 300 = e Note ti dà il totale di Natale fino a qui.
        </li>
        <li>
          <strong>Spunta i nomi man mano che compri.</strong> Con &ldquo;Ordina automaticamente gli elementi selezionati&rdquo;
          attivo, le persone che mancano salgono in cima all’elenco di Natale.
        </li>
        <li>
          <strong>Azzerala il dicembre dopo.</strong> Fai clic nell’elenco di Natale e scegli Formato &gt; Altro &gt; Deseleziona tutti.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Altro", "Deseleziona tutti"] }]} />
      <p>
        Per tenere sotto controllo la spesa di tutta la stagione, il <a href="/it/blog/budget-mensile-note-iphone">budget mensile nelle
        note di iPhone</a> fa le somme da solo con Risultati matematici. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma una lista regali in Note</h2>
      <ul>
        <li><strong>Le idee arrivano altrove.</strong> Un’amica cita un libro in un messaggio, e arriva nella nota solo se ti fermi a copiarlo.</li>
        <li><strong>Niente ordinamento.</strong> Le tabelle in Note non si ordinano, quindi per vedere tutto di una persona o di un’occasione devi leggere tutta la tabella.</li>
        <li><strong>Il totale del budget è a mano.</strong> Riscrivi la somma ogni volta che cambia un’idea.</li>
        <li><strong>La scelta è tua.</strong> Taglie, gusti e budget sono tutti nella nota, ma trovare il regalo giusto tre settimane prima di un compleanno resta compito tuo.</li>
      </ul>
      <p>
        Per una manciata di persone, una nota è tutto quello che serve. Per un Natale in famiglia e un anno di compleanni, tenerla
        aggiornata è il lavoro.
      </p>

      <h2 id="pinto-notes">Una lista che suggerisce regali</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/gift-ideas">Gift ideas</a> è una nota con una tabella Ideas e un
        elenco Sizes and likes. Nella tabella, Budget è un numero e Status è una scelta tra Idea, Bought o Given.
      </p>
      <p>
        Nomina qualcosa che piacerebbe a qualcuno e la tua AI aggiunge una riga: la persona, l’occasione se l’hai detta, l’idea, il
        budget se l’hai dato, e Idea come stato. Di’ &ldquo;Luca porta la M e adora tutto ciò che è verde&rdquo; e finisce sotto Sizes
        and likes. Chiedi &ldquo;tra tre settimane è il compleanno di papà. Idee sotto i 50 euro?&rdquo; e ti suggerisce tre regali nel
        budget che si adattano a quello che c’è nella nota. Quando ne compri uno, imposta lo stato su Bought. Questa parte funziona
        quando ChatGPT o Claude sono collegati; <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese)
        richiede un minuto. Puoi sempre modificare ogni riga da te, e ogni versione precedente della nota viene conservata.
      </p>
      <p>
        Le liste che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
