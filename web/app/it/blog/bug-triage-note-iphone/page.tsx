import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "bug-triage-note-iphone");

// Italian version of /blog/apple-notes-bug-triage-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "bug triage" gives bug triage meeting and process; "bug tracking" gives tools and software; no
// Italian phrase has completions ("gestione bug", "segnalazione bug template" give nothing). So the slug and title keep
// "bug triage" plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato > Tabella, a
// table of two rows and two columns, the Tabulatore or A capo in the last cell adds a row, selected lines of text
// become a table with the table button, which has no name in the guide, so it is described), apd93c815aa0/mac
// ("Aggiungere elenchi in Note sul Mac": "Ordina automaticamente gli elementi selezionati" in the Notes settings),
// not18ab658ed/mac (search reads the body of every note) and apd4e6e2c9a6/mac (sharing a note to work on it together).
// Modifica > Incolla come Markdown and Formato > Tabella are the Italian strings in Notes' MainMenu.loctable on macOS
// 27. As in the English post, Paste as Markdown is not used for the table. Facts are the English post's; the picture is
// its English one, described in Italian. The example search bug uses Italian accents instead of the Swedish letters.
// Links go to English posts, none of which has an Italian version yet.

const ui = UI.it;

// Tabs between the columns: select those lines in Notes and press the table button.
const TABLE = `Bug triage

Bug\tGravità\tArea\tStato\tSegnalato\tLink
Carte salvate rifiutate al checkout\tP1\tCheckout\tIn corso\t2026-11-04\t#412
La ricerca ignora à, è e ò\tP2\tRicerca\tRisolto\t2026-11-02\t#407
Email dell’ordine arriva due volte\tP2\tEmail\tNuovo\t2026-11-06\t#418
Logo del footer sfocato sui telefoni\tP3\tDesign\tConfermato\t2026-11-05\tnessuno
`;

const RULES = `## Gravità
- P0: dati persi, una falla di sicurezza, o tutti bloccati. Si molla tutto.
- P1: un flusso principale è rotto per molte persone. Questa settimana.
- P2: rotto, ma c’è un modo per aggirarlo. Da pianificare.
- P3: rifiniture. Quando c’è tempo.

## Dettagli
Carte salvate rifiutate al checkout
1. Accedi a un account con una carta salvata.
2. Metti qualcosa nel carrello e vai al checkout.
3. Scegli la carta salvata e seleziona Paga.
Atteso: l’ordine viene effettuato.
Cosa è successo: “Pagamento non riuscito”, e nessun ordine.
`;

const LIST = `# Bug per gravità

## P1
- [ ] Carte salvate rifiutate al checkout (Checkout, #412)

## P2
- [ ] Email dell’ordine arriva due volte (Email, #418)
- [x] La ricerca ignora à, è e ò (Ricerca, #407)

## P3
- [ ] Logo del footer sfocato sui telefoni (Design)
`;

const FAQ = [
  { q: "Cos’è il bug triage?", a: [
    "Decidere, per ogni nuova segnalazione di bug, quanto è grave e quando verrà corretto. Quasi tutti i team danno a ogni bug una gravità da P0 a P3, un’area e uno stato, e passano in rassegna quelli nuovi in un giorno fisso.",
  ] },
  { q: "Cosa deve contenere un modello di bug triage?", a: [
    "Un titolo breve, la gravità, l’area, lo stato, la data della segnalazione e un link alla segnalazione. Poi, per ogni bug che riesci a riprodurre, i passi, cosa ti aspettavi e cosa è successo.",
  ] },
  { q: "Posso tenere traccia dei bug in Note di Apple?", a: [
    "Per un progetto piccolo, sì: una tabella con una riga per bug, o un elenco di controllo sotto un’intestazione per ogni gravità. Le tabelle in Note non si ordinano e non si filtrano, quindi oltre un paio di dozzine di bug funziona meglio un sistema di tracciamento dei bug.",
  ] },
  { q: "Esiste un modello di bug triage che registra le segnalazioni per me?", a: [
    "Pinto Notes ha un modello gratuito, Bug triage. Incolla una segnalazione o una issue di GitHub in ChatGPT, Claude o Claude Code e lui aggiunge una riga secondo le tue regole di gravità, con i passi per riprodurlo.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="bug-triage-note-iphone"
      intro={<>
        Non tutti i team hanno bisogno di un sistema di tracciamento dei bug. Uno sviluppatore da solo o un team di tre persone può
        tenere tutti i bug in una nota, se ognuno ha una gravità e i peggiori stanno in cima. Ecco un modello di bug triage per Note di
        Apple, una versione a elenco di controllo che si ordina meglio, e dove una nota si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#per-gravita", label: "Una versione a elenco" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Bug che si registrano da soli" },
        ]}>
          <p>
            Note di Apple non ha un modello per il bug triage, ma una nota fa il lavoro: una tabella con una riga per bug (titolo,
            gravità, area, stato, data, link), sotto le regole di gravità, e più giù i passi per riprodurre ogni bug. Dai a ogni bug una
            gravità da P0 a P3 quando arriva, e correggi partendo dall’alto.
          </p>
          <PostCta template="bug-triage" slug="it/bug-triage-note-iphone" path="/it/blog/bug-triage-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le segnalazioni le registri qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per il bug triage. Incolla una segnalazione in ChatGPT o Claude e lui aggiunge una riga secondo le tue regole di gravità, con i passi per riprodurlo.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/bug-triage-note" width={1520} height={1363} maxWidth={600}
        alt="Una nota Bug triage in Pinto Notes su un Mac: una tabella di quattro bug con gravità da P1 a P3, area, stato, data e numero della issue, i passi per riprodurre il bug del checkout con carta salvata, e le regole di gravità."
        caption="Una nota di bug triage in Pinto Notes, con gravità e stato come scelte. In Note di Apple la tabella, i dettagli e le regole arrivano come testo semplice." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una tabella e le regole</h2>
      <p>
        La tabella è l’elenco che guardi ogni mattina. La gravità dice quando un bug viene corretto, e le regole la tengono onesta: P1
        vuol dire che un flusso principale è rotto per molte persone, e un cliente che alza la voce non cambia le cose. Tieni i titoli
        brevi, perché sei colonne si dividono la larghezza.
      </p>
      <Keep title="Tabella di bug triage per Note di Apple" text={TABLE} copyLabel={ui.copy}
        note="Ogni riga della tabella ha una tabulazione tra le colonne. Incollala, poi trasforma quelle righe in una tabella." />
      <Keep title="Regole di gravità e dettagli" text={RULES} copyLabel={ui.copy}
        note="Incollalo sotto la tabella con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla il modello della tabella in una nota nuova, seleziona le cinque righe
          da Bug all’ultimo bug e premi il pulsante della tabella. Ogni tabulazione diventa una colonna, così hai le sei colonne una
          accanto all’altra.
        </li>
        <li>
          <strong>Oppure parti da zero.</strong> Scegli Formato &gt; Tabella per due righe e due colonne, e il Tabulatore nell’ultima
          cella aggiunge la riga successiva.
        </li>
        <li>
          <strong>Aggiungi le regole e i dettagli.</strong> Fai clic sotto la tabella e scegli Modifica &gt; Incolla come Markdown. Le
          righe con ## diventano intestazioni.
        </li>
        <li>
          <strong>Cambia uno stato scrivendoci sopra.</strong> Da In corso a Risolto è una cella. Lascia i bug risolti per una
          settimana, così si vede cosa è cambiato.
        </li>
      </ul>
      <p>
        Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi un titolo lungo schiaccia il resto.{" "}
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega tutto quello che una tabella in Note sa fare e
        non sa fare. Se anche altri segnalano bug, condividi la nota con il permesso di modificarla; serve un Apple Account a testa.
      </p>

      <h2 id="per-gravita">Una versione a elenco che si ordina da sola</h2>
      <p>
        Le tabelle in Note non si ordinano, quindi un nuovo P1 finisce in fondo. Se ti dà fastidio, dai a ogni gravità
        un’intestazione e a ogni bug una riga dell’elenco di controllo sotto. I bug peggiori stanno sempre in cima, e spuntare una riga
        la segna come risolta.
      </p>
      <Keep title="Bug per gravità per Note di Apple" text={LIST} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <p>
        Attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle impostazioni di Note, e i bug risolti scendono in
        fondo alla loro intestazione. La ricerca legge ogni parola di ogni nota, quindi cercare &ldquo;checkout&rdquo; trova il bug e i
        suoi dettagli. Altre note da incollare sono in <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma il bug triage in Note</h2>
      <ul>
        <li><strong>Niente ordinamento né filtri.</strong> &ldquo;Tutti i P1 aperti&rdquo; vuol dire leggere tutta la tabella.</li>
        <li><strong>Ogni segnalazione va riscritta.</strong> I bug arrivano per email, in chat e su GitHub, e ognuno è un titolo, una gravità e dei passi che scrivi a mano.</li>
        <li><strong>La gravità è ogni volta una valutazione.</strong> Le regole sono nella nota, ma devi comunque confrontarle con ogni segnalazione.</li>
        <li><strong>Nessun legame con il codice.</strong> Capire in quali file sta un bug resta un lavoro a parte.</li>
      </ul>
      <p>
        Per un progetto personale o una piccola app, una nota basta. Con un team che apre decine di bug a settimana, usa un sistema di
        tracciamento dei bug.
      </p>

      <h2 id="pinto-notes">Bug che si registrano da soli</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/bug-triage">Bug triage</a> è una nota con una tabella dei bug, una
        sezione per i dettagli e le regole di gravità. Nella tabella, la gravità è una scelta da P0 a P3 e lo stato una scelta tra
        nuovo, confermato, in corso, risolto e non verrà risolto.
      </p>
      <p>
        Incolla una segnalazione di bug nella tua AI. Lei segue le regole di gravità e aggiunge una riga con un titolo breve, la
        gravità, l’area, lo stato nuovo, la data di oggi e il link, e tiene le righe dalla peggiore. Se la segnalazione dice come
        riprodurlo, i passi, cosa ci si aspettava e cosa è successo finiscono nei dettagli. In Claude Code, il modello ha istruzioni
        sue: incolla una issue di GitHub e la legge con gh issue view, registra la riga, poi cerca nel tuo codice la causa probabile e
        aggiunge ai dettagli i file coinvolti. <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and Codex</a> (in
        inglese) ha il comando unico per aggiungerlo.
      </p>
      <p>
        Chiedi &ldquo;cosa c’è di P1 ancora aperto?&rdquo;, oppure di’ &ldquo;abbiamo sistemato il checkout con carta salvata,
        segnalalo come risolto&rdquo; e lei cambia lo stato. Puoi sempre modificare ogni riga da te, e ogni versione precedente della nota viene
        conservata. La parte con l’AI funziona quando ChatGPT o Claude sono collegati;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto. Le note che tieni già in
        Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple resta
        com’era.
      </p>
    </LocalPostPage>
  );
}
