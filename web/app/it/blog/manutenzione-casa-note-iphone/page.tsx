import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "manutenzione-casa-note-iphone");

// Italian version of /blog/apple-notes-home-maintenance-checklist (21 Nov 2026). Search words, Google autocomplete
// (hl=it, gl=it) on 21 Nov: "manutenzione casa", "manutenzione ordinaria casa", "checklist manutenzione", "app scadenze
// casa" (from "scadenze casa") and "manutenzione caldaia ogni quanto". So the slug says "manutenzione casa" plus "note
// iphone", and the title says "manutenzione della casa" and "checklist". Apple's own Italian words, all read 21 Nov: the
// Mac guide support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato >
// Tabella, the Tabulatore or A capo in the last cell adds a row, selected lines of text become a table with the table
// button), apd93c815aa0/mac ("Aggiungere elenchi in Note sul Mac": Formato > Altro > Deseleziona tutti, "Ordina
// automaticamente gli elementi selezionati" in the Notes settings), apd58edc7964/mac ("Usare le cartelle smart": the
// Elenchi di controllo rule), apdb54e469b6/mac ("Ordinare e mettere in evidenza le note sul Mac": a note in evidenza
// stays at the top of the list), not18ab658ed/mac ("Cercare le note sul Mac": search looks in the body of every note),
// apd4e6e2c9a6/mac ("Collaborare con note e cartelle condivise": Apple Account), and the iPhone guide
// it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button). The table and checklist buttons have no name in the
// guides, so they are described. Modifica > Incolla come Markdown is new in macOS 27 and not in the Italian guide yet:
// it is the Italian string in Notes' MainMenu.loctable on macOS 27, like Formato > Tabella; the Smart Folder value Non
// selezionati is the Italian string in SmartFolderChecklistsFilterView.loctable. As in the English post, Paste as
// Markdown is not used for the table. The example jobs are the English ones in Italian words (the kettle is the coffee
// machine, the boiler service is the caldaia); dates keep the year. Facts are the English post's; the picture is its
// English one, described in Italian. All links go to English posts, none of which has an Italian version yet. Pinto's
// template and its Every choices keep their English names, since the app is in English.

const ui = UI.it;

const NOTE = `# Manutenzione della casa

I lavori che fanno funzionare la casa, ogni quanto vanno fatti e l’ultima volta che li hai fatti.

## Lavori
Incolla la tabella dei lavori sotto questa riga.

## Questo mese
- [ ] Provare i rilevatori di fumo (scadenza 14 nov)
- [ ] Manutenzione della caldaia (scadenza 20 nov)
- [ ] Pulire le grondaie (scadenza 24 nov)

## Chi chiamare
- Idraulico: Rossi Impianti, 02 4650 0427
- Elettricista: Elettro Pronto, 02 4650 0463

## Elettrodomestici
- Lavastoviglie: Bosch Serie 4, garanzia fino al 2028
- Caldaia: Vaillant ecoTEC, installata nel 2021
`;

// Tabs between the columns: select those lines in Notes and press the table button.
const JOBS = `Lavoro\tOgni quanto\tUltima volta\tScadenza
Decalcificare la macchina del caffè\t1 mese\t1 nov 2026\t1 dic 2026
Pulire il filtro della lavastoviglie\t1 mese\t5 nov 2026\t5 dic 2026
Provare i rilevatori di fumo\t3 mesi\t14 ago 2026\t14 nov 2026
Manutenzione della caldaia\t1 anno\t20 nov 2025\t20 nov 2026
Pulire le grondaie\t6 mesi\t24 mag 2026\t24 nov 2026
`;

const FAQ = [
  { q: "Note di Apple ha un modello per la manutenzione della casa?", a: [
    "No. Note di Apple non ha nessun modello. Una nota con una tabella dei lavori, un elenco di controllo per questo mese e i numeri da chiamare funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Cosa deve contenere una checklist per la manutenzione della casa?", a: [
    "Ogni lavoro che si ripete, ogni quanto va fatto e quando l’hai fatto l’ultima volta. Comincia da quelli che costano cari se li dimentichi: i rilevatori di fumo, la manutenzione della caldaia, le grondaie e i filtri.",
  ] },
  { q: "Note di Apple può ricordarmi quando scade un lavoro?", a: [
    "La nota non te lo dice da sola. La apri e leggi la colonna Scadenza. Un elenco di controllo per questo mese, fatto all’inizio di ogni mese, tiene i lavori in scadenza in un elenco breve.",
  ] },
  { q: "Esiste un’app per la manutenzione della casa che tiene le scadenze?", a: [
    "Pinto Notes ha un modello gratuito per la manutenzione della casa. Di’ a ChatGPT o a Claude quando hai fatto un lavoro e aggiorna le date, e chiedigli cosa scade questo mese e scrive l’elenco di controllo.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="manutenzione-casa-note-iphone"
      intro={<>
        Nessuno dimentica il rilevatore di fumo apposta. Sfugge perché l’ultima prova è così lontana che nessuno se la ricorda. Ecco una
        checklist per la manutenzione della casa da incollare in Note di Apple, un modo per seguirla ogni mese e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#ogni-mese", label: "Ogni mese" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Una lista che sa cosa scade" },
        ]}>
          <p>
            Note di Apple non ha un modello per la manutenzione della casa, ma basta una nota: una tabella di ogni lavoro che si ripete,
            con ogni quanto va fatto e l’ultima volta che l’hai fatto, poi un elenco di controllo di quello che scade questo mese, le
            persone da chiamare e i modelli dei tuoi elettrodomestici.
          </p>
          <PostCta template="home-maintenance" slug="it/manutenzione-casa-note-iphone" path="/it/blog/manutenzione-casa-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le date le tenga qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per la manutenzione della casa. Di’ a ChatGPT o a Claude che un lavoro è fatto e aggiorna le date, oppure chiedi cosa scade questo mese.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/home-maintenance-note" width={1520} height={1557} maxWidth={600}
        alt="Una nota Home maintenance in Pinto Notes su un Mac: una tabella Jobs con cinque lavori, da Descale the kettle a Clear the gutters, con ogni quanto e l’ultima e la prossima data, un elenco di controllo This month con due lavori su cinque spuntati, Who to call e Appliances."
        caption="Una nota per la manutenzione della casa in Pinto Notes, dove Every è una scelta da un elenco. In Note di Apple le stesse colonne funzionano come una tabella semplice, con l’elenco di controllo e gli elenchi sotto. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: lavori, questo mese, chi chiamare</h2>
      <p>
        La tabella è il registro: ogni lavoro che si ripete, ogni quanto, quando è stato fatto l’ultima volta e quando scade il
        prossimo. L’elenco di controllo è quello su cui lavori questo mese. Chi chiamare ed Elettrodomestici sono quello che cerchi
        quando qualcosa si rompe. I lavori di esempio sono un punto di partenza: aggiungi i tuoi e cancella quelli che non ti
        riguardano.
      </p>
      <Keep title="Nota per la manutenzione della casa per Note di Apple" text={NOTE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Keep title="Tabella dei lavori per Note di Apple" text={JOBS} copyLabel={ui.copy}
        note="Ogni riga ha una tabulazione tra le colonne. Incollala sotto Lavori, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
        { on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" },
      ]} />
      <ul>
        <li>
          <strong>Incolla la nota.</strong> Su un Mac con macOS 27, crea una nota nuova e scegli Modifica &gt; Incolla come Markdown.
          La riga con # diventa il titolo, le righe con ## le intestazioni e i lavori di questo mese un elenco di controllo. Un
          Comando-V normale lascia i simboli come testo.
        </li>
        <li>
          <strong>Poi la tabella.</strong> Sostituisci la riga sotto Lavori con la tabella dei lavori, seleziona le sue sei righe da
          Lavoro all’ultimo lavoro e premi il pulsante della tabella. Ogni tabulazione diventa una colonna.
        </li>
        <li>
          <strong>Aggiungi un lavoro.</strong> Il Tabulatore nell’ultima cella aggiunge una riga. Scrivi le date con l’anno, così un
          lavoro da fare una volta l’anno ha ancora senso il novembre dopo.
        </li>
        <li>
          <strong>Tieni corti i nomi dei lavori.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi
          un lavoro con un nome lungo schiaccia le date.
        </li>
      </ul>
      <p>
        Metti la nota in evidenza, così resta in cima alla cartella. Su iPhone, scrivi le intestazioni una volta, seleziona i lavori di
        questo mese e tocca il pulsante dell’elenco di controllo. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in
        inglese) spiega tutto quello che una tabella in Note sa fare e non sa fare.
      </p>

      <h2 id="ogni-mese">Ogni mese</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Altro", "Deseleziona tutti"] }]} />
      <ul>
        <li>
          <strong>Scrivi l’elenco di questo mese.</strong> Il primo del mese, scorri la colonna Scadenza e scrivi una riga
          dell’elenco di controllo per ogni lavoro che cade questo mese, con la sua data.
        </li>
        <li>
          <strong>Spunta, poi aggiorna la riga.</strong> Quando un lavoro è fatto, spuntalo e cambia Ultima volta e Scadenza nella
          tabella. La spunta vale per questo mese. La riga è quella che leggerai l’anno prossimo.
        </li>
        <li>
          <strong>Lascia scendere i lavori fatti.</strong> Con &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; attivo, i
          lavori fatti scendono in fondo e quello che resta sta in cima.
        </li>
        <li>
          <strong>Riusa l’elenco.</strong> Se ogni mese tornano gli stessi lavori, tienili e scegli Formato &gt; Altro &gt; Deseleziona
          tutti per ricominciare.
        </li>
      </ul>
      <p>
        Una cartella smart con la regola Elenchi di controllo, Non selezionati mostra ogni nota che ha ancora elementi aperti, così un
        lavoro rimasto dal mese scorso resta sotto gli occhi. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart
        Folders</a> (in inglese) spiega come crearne una. Quando perde un tubo, la ricerca legge ogni parola di ogni nota, quindi
        &ldquo;idraulico&rdquo; o &ldquo;Bosch&rdquo; trova subito il numero o il modello. Per gestire la casa con qualcun altro, per
        condividere la nota serve un Apple Account per ogni persona. Altre note da incollare come questa sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma una lista di manutenzione in Note</h2>
      <ul>
        <li><strong>La scadenza la calcoli tu.</strong> Note non capisce che un lavoro ogni 3 mesi fatto il 14 agosto scade il 14 novembre. La data la scrivi tu.</li>
        <li><strong>La tabella non si ordina.</strong> Non sa mettere in cima il prossimo lavoro, quindi leggi ogni riga per trovare cosa scade.</li>
        <li><strong>L’elenco del mese si copia a mano.</strong> Se salti il primo del mese, nessuno lo scrive al posto tuo.</li>
        <li><strong>Le date si sfasano.</strong> Un lavoro spuntato ma non aggiornato nella tabella sembrerà in ritardo l’anno prossimo.</li>
      </ul>
      <p>
        Per un appartamento con cinque lavori, una nota basta e avanza. Per una casa con trenta, tenere giuste le date è il lavoro vero,
        e resta a te.
      </p>

      <h2 id="pinto-notes">Una lista che sa cosa scade</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/home-maintenance">Home maintenance</a> è la stessa nota: una tabella
        Jobs in cui Every è una scelta tra Month, 3 months, 6 months o Year, un elenco di controllo This month, Who to call e Appliances.
      </p>
      <p>
        Racconta alla tua AI un lavoro che vuoi tenere d’occhio e quando l’hai fatto l’ultima volta, e lei aggiunge la riga con
        entrambe le date, anno compreso. Chiedi &ldquo;cosa scade questo mese?&rdquo; e scrive l’elenco di controllo sotto This month.
        Di’ &ldquo;oggi è stata fatta la manutenzione della caldaia&rdquo; e cambia Last done e Next due e spunta il lavoro. Nomina il
        modello di un elettrodomestico o la data di fine garanzia e finisce sotto Appliances. Puoi sempre aggiungere e modificare ogni
        riga da te, e ogni versione precedente della nota viene conservata. Questa parte funziona quando ChatGPT o Claude sono
        collegati; <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Le liste che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e
        Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
