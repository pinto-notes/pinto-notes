import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "appunti-riunione-note-iphone");

// Italian version of /blog/apple-notes-meeting-notes-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "appunti riunione" gives appunti riunione teams, ai, prendere appunti riunione, app appunti
// riunione; "template riunione" gives template verbale riunione and template minuta riunione; "verbale riunione" is
// mostly formal minutes (condominio, sicurezza). So the slug and title say "appunti di riunione" plus "note di iPhone",
// and the description also says verbale. Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/not9474646a9/mac (File > Duplica nota), apd58edc7964/mac ("Usare le cartelle
// smart": File > Nuova cartella smart, the rules, a note must meet all of them), apdc88ed7f1d/mac (tags with #),
// apdb5106e334/mac ("Registrare e trascrivere audio": transcript, and the riepilogo with Apple Intelligence),
// apd4e6e2c9a6/mac (sharing to edit together, Può modificare), and the iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios
// (the checklist button, which has no name, so it is described). Modifica > Incolla come Markdown is the Italian
// string in Notes' MainMenu.loctable on macOS 27 (not in the Italian guide yet); the Smart Folder rule values
// Cartelle, Elenchi di controllo and Non selezionati are the Italian strings in SmartFolderFilterRow.loctable and
// SmartFolderChecklistsFilterView.loctable. Facts are the English post's; the picture is its English one, described
// in Italian. The example people are Sara, Marco and Elena. Links go to English posts.

const ui = UI.it;

const TEMPLATE = `# Punto prodotto, 24 novembre

Presenti: Sara, Marco, Elena

## Ordine del giorno
- Pagina dei prezzi
- Design del checkout

## Appunti
- Le vendite vogliono i nuovi prezzi prima di dicembre
- Due tester su tre non hanno visto il totale nel checkout

## Decisioni
- Restano tre piani, niente abbonamento a vita
- Il totale va sopra i dati della carta

## Azioni
- [ ] Sara: mandare i nuovi prezzi alle vendite (ven)
- [ ] Marco: spostare il totale nel checkout (mer)
- [ ] Elena: verificare le regole IVA per la Norvegia (settimana prossima)
`;

const FAQ = [
  { q: "Note di Apple ha un modello per gli appunti di riunione?", a: [
    "No. Note di Apple non ha modelli. Una nota per riunione, con le intestazioni per ordine del giorno, appunti, decisioni e azioni, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Come tengo traccia delle azioni decise in riunione in Note di Apple?", a: [
    "Scrivile come elenco di controllo, con il nome della persona davanti. Poi crea una cartella smart con due regole, la tua cartella Riunioni ed Elenchi di controllo: Non selezionati, e ogni riunione con qualcosa ancora aperto compare in un posto solo.",
  ] },
  { q: "Note di Apple può registrare e riassumere una riunione?", a: [
    "Con Apple Intelligence, una registrazione in Note diventa una trascrizione e un riepilogo. Non tira fuori chi fa cosa entro quando; le azioni le scrivi comunque tu.",
  ] },
  { q: "Esiste un’app per gli appunti di riunione che scrive le azioni per me?", a: [
    "Pinto Notes ha un modello gratuito, Meeting notes. Incolla i tuoi appunti veloci o una trascrizione in ChatGPT o Claude, e lui scrive il riepilogo, le decisioni e ogni azione con il suo responsabile e la sua data.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="appunti-riunione-note-iphone"
      intro={<>
        Gli appunti di una riunione servono solo per la parte che quasi tutti saltano: cosa si è deciso, e chi fa cosa adesso. Ecco un
        modello di appunti di riunione per Note di Apple da incollare, un modo per vedere tutte le azioni ancora aperte in un posto solo,
        e dove Note smette di bastare.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#azioni", label: "Azioni aperte" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Appunti che si riordinano da soli" },
        ]}>
          <p>
            Note di Apple non ha un modello per le riunioni, ma una nota per riunione fa il lavoro: chi c’era, l’ordine del giorno, i
            tuoi appunti, le decisioni e le azioni come elenco di controllo con un nome su ognuna. Tienile in una cartella Riunioni, e
            una cartella smart ti mostra ogni azione ancora aperta.
          </p>
          <PostCta template="meeting-notes" slug="it/appunti-riunione-note-iphone" path="/it/blog/appunti-riunione-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi le azioni già scritte?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per le riunioni. Incolla i tuoi appunti veloci in ChatGPT o Claude e lui scrive il riepilogo, le decisioni e chi fa cosa.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/meeting-notes-note" width={1520} height={1110} maxWidth={620}
        alt="Una nota Meeting notes in Pinto Notes su un Mac: le azioni, ognuna con un responsabile e una data, una spuntata, poi una sezione Pricing sync con un riepilogo di due righe e le decisioni."
        caption="Appunti di riunione in Pinto Notes: le azioni aperte in alto, ogni riunione sotto. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per riunione</h2>
      <p>
        Le decisioni e le azioni sono le parti per cui tornerai sulla nota, quindi hanno un’intestazione tutta loro. Metti un nome e un
        giorno su ogni azione; &ldquo;guardare la questione IVA&rdquo; senza un responsabile è il modo in cui non succede niente. Lascia
        una parola in ogni riga, perché un elemento vuoto dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Appunti di riunione per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
        { on: "Mac", steps: ["File", "Duplica nota"] },
      ]} />
      <ul>
        <li>
          <strong>Incollalo una volta.</strong> Su un Mac con macOS 27, crea una nota e scegli Modifica &gt; Incolla come Markdown. La
          riga con # diventa il titolo, ogni riga con ## un’intestazione e le azioni un elenco di controllo. Su iPhone, scrivi le
          intestazioni e tocca il pulsante dell’elenco di controllo per le azioni.
        </li>
        <li>
          <strong>Tieni una copia vuota.</strong> Togli le righe di esempio e tieni quella nota in una cartella Riunioni. Prima di ogni
          riunione, scegli File &gt; Duplica nota e cambia il titolo.
        </li>
        <li>
          <strong>Metti un tag a quelle fisse.</strong> Scrivi #settimanale nella nota di una riunione che si ripete, e tutte le sue
          settimane sono a un tocco nella barra laterale.
        </li>
        <li>
          <strong>Registrala se non riesci a scrivere.</strong> Con Apple Intelligence, una registrazione in Note diventa una
          trascrizione e un riepilogo. Copia da lì le decisioni e le azioni nel modello.
        </li>
      </ul>

      <h2 id="azioni">Vedere tutte le azioni aperte</h2>
      <Paths rows={[{ on: "Mac", steps: ["File", "Nuova cartella smart"] }]} />
      <p>
        Azioni sparse in venti note di riunione sono azioni che nessuno fa. Sul Mac, scegli File &gt; Nuova cartella smart, chiamala
        Azioni aperte e dalle due regole che una nota deve rispettare tutte e due: Cartelle impostata sulla tua cartella Riunioni, ed
        Elenchi di controllo impostata su Non selezionati. Ogni riunione con qualcosa ancora aperto è in quella cartella, e una
        riunione ne esce quando la sua ultima azione viene spuntata.
      </p>
      <p>
        Se anche chi partecipa alla riunione usa Note di Apple, condividi la nota e, nei permessi, scegli Può modificare, così ognuno
        spunta le sue azioni. Serve un Apple Account a testa. Per la fine della settimana, il post{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese) ha una revisione settimanale da incollare, e{" "}
        <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> (in inglese) passa in rassegna ogni regola che una
        cartella smart può usare.
      </p>

      <p>
        Per i one to one, il modello per gli <a href="/it/blog/one-to-one-note-iphone">appunti dei one to one</a> tiene una nota per
        persona, con i follow-up e ogni incontro passato. Per le decisioni che dovrai spiegare mesi dopo, tieni un{" "}
        <a href="/it/blog/registro-decisioni-note-iphone">registro delle decisioni</a> con le opzioni e il perché.
      </p>

      <h2 id="limiti">Dove si fermano gli appunti di riunione in Note</h2>
      <ul>
        <li><strong>Riordinare gli appunti tocca a te.</strong> Appunti veloci o una trascrizione non diventano da soli decisioni e responsabili.</li>
        <li><strong>Niente elenco per persona.</strong> Una cartella smart mostra le riunioni con azioni aperte, non &ldquo;tutto quello che deve fare Sara&rdquo;.</li>
        <li><strong>Nessuna risposta tra una riunione e l’altra.</strong> &ldquo;Cosa avevamo deciso sui prezzi il mese scorso?&rdquo; vuol dire aprire note finché non lo trovi.</li>
      </ul>
      <p>
        Per un paio di riunioni a settimana, il modello e una cartella smart bastano. Con di più, riordinare gli appunti è il lavoro per
        cui nessuno ha tempo.
      </p>

      <h2 id="pinto-notes">Appunti di riunione che si riordinano da soli</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/meeting-notes">Meeting notes</a> è una nota per tutte le tue riunioni:
        le azioni aperte in alto, e sotto una breve sezione per ogni riunione, dalla più recente.
      </p>
      <p>
        Dopo una riunione, incolla i tuoi appunti veloci o una trascrizione nella tua AI. Lei scrive un riepilogo di due righe e le
        decisioni, e aggiunge ogni azione come &ldquo;Sara: mandare i nuovi prezzi alle vendite (ven)&rdquo;. Se qualcosa non è chiaro,
        chiede prima di scriverlo. Poi chiedi &ldquo;cosa resta aperto per me?&rdquo;, oppure dille che la revisione di Marco è fatta e
        spunta la riga. Puoi sempre scrivere e spuntare tutto da te, e ogni versione precedente della nota viene conservata.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto, e le tue note di Apple
        arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>.
      </p>
    </LocalPostPage>
  );
}
