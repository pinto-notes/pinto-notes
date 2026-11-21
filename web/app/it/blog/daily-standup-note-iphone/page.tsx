import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "daily-standup-note-iphone");

// Italian version of /blog/apple-notes-daily-standup-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "daily standup" gives daily standup template, meeting and agenda; "daily stand up", "daily scrum"
// and "daily meeting" exist too; "riunione giornaliera" has no completions. Italians use the English term, so the slug
// and title say "daily standup" plus "note di iPhone", and the text says daily scrum where the English does. Apple's
// own Italian words, all read 21 Nov: the Mac guide support.apple.com/it-it/guide/notes/apdb54e469b6/mac ("Ordinare e
// mettere in evidenza le note sul Mac": in evidenza), apd93c815aa0/mac ("Aggiungere elenchi in Note sul Mac": "Ordina
// automaticamente gli elementi selezionati" in the Notes settings), not18ab658ed/mac (search reads the body of every
// note), apdb5106e334/mac ("Registrare e trascrivere audio in Note sul Mac": transcript, and the riepilogo with Apple
// Intelligence), and the iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button, which has no name, so
// it is described). Modifica > Incolla come Markdown is the Italian string in Notes' MainMenu.loctable on macOS 27 (not
// in the Italian guide yet). Facts are the English post's; the picture is its English one, described in Italian. The
// example team is Sara, Marco and Elena, as in the Italian meeting notes post. The meeting notes link goes to its
// Italian version; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Appunti dello standup

## Blocchi
- In attesa delle chiavi API del fornitore di pagamenti per lo staging

## Venerdì 6 novembre
Ieri
- Risolto il conflitto di sincronizzazione quando due dispositivi modificano la stessa nota
- Aggiunti i test per le tabelle nell’importazione

Oggi
- [ ] Revisione della pull request dell’onboarding
- [ ] Iniziare l’esportazione in PDF

## Giovedì 5 novembre
Ieri
- In coppia con Elena sull’importazione

Oggi
- [x] Risolvere il conflitto di sincronizzazione
- [x] Scrivere i test per le tabelle nell’importazione
`;

const TEAM = `# Standup del team, settimana del 2 novembre

## Blocchi
- [ ] Sara: in attesa delle chiavi API del fornitore di pagamenti per lo staging

## Venerdì 6 novembre
- Sara: risolto il conflitto di sincronizzazione. Oggi la revisione dell’onboarding.
- Marco: spostato il totale nel checkout. Oggi il controllo dell’IVA.
- Elena: test dell’importazione fatti. Oggi l’esportazione in PDF.
`;

const FAQ = [
  { q: "Cosa deve contenere una nota del daily standup?", a: [
    "Tre cose: cosa hai fatto ieri, cosa farai oggi e cosa ti blocca. Pochi punti brevi per ciascuna. Tieni i blocchi in cima alla nota, perché sono la parte su cui qualcun altro può intervenire.",
  ] },
  { q: "Note di Apple ha un modello per lo standup?", a: [
    "No. Note di Apple non ha modelli. Una nota sempre aperta con un’intestazione per ogni giorno, dal più recente, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Come si prendono gli appunti del daily scrum?", a: [
    "Una nota per sprint o per settimana, un’intestazione per giorno e una riga per persona con cosa ha fatto e cosa farà. Scrivi i blocchi come elenco di controllo con il nome della persona davanti, e spunta ognuno quando si sblocca.",
  ] },
  { q: "Claude Code può scrivere il mio standup dai miei commit?", a: [
    "Con Pinto Notes collegato, sì. Il modello Daily standup ha istruzioni sue per Claude Code: legge i tuoi commit da ieri, li trasforma in pochi punti semplici, ti chiede cosa farai dopo e scrive la giornata nella tua nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="daily-standup-note-iphone"
      intro={<>
        Quasi ogni standup comincia con qualcuno che cerca di ricordarsi ieri. Una nota scritta man mano risolve il problema. Ecco un
        modello per gli appunti del daily standup in Note di Apple da incollare, una versione per tutto il team, e dove Note si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#ogni-giorno", label: "Ogni giorno" },
          { href: "#team", label: "Per un team" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Uno standup dai tuoi commit" },
        ]}>
          <p>
            Note di Apple non ha un modello per lo standup, ma una nota sempre aperta fa il lavoro: i blocchi in alto, poi
            un’intestazione per ogni giorno lavorativo, dal più recente, con Ieri e Oggi sotto ciascuno. Scrivi Oggi come elenco di
            controllo, e le righe spuntate sono l’Ieri di domani.
          </p>
          <PostCta template="daily-standup" slug="it/daily-standup-note-iphone" path="/it/blog/daily-standup-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che ieri lo scriva qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per lo standup. Racconta a ChatGPT o a Claude cosa hai fatto, oppure lascia che Claude Code scriva la bozza di ieri dai tuoi commit.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="Una nota Standup notes in Pinto Notes su un Mac: un blocco in attesa delle chiavi API dello staging, poi venerdì 6 novembre e giovedì 5 novembre, ognuno con i punti Yesterday e Today."
        caption="Appunti dello standup in Pinto Notes: i blocchi in alto, una sezione al giorno, dal più recente. La stessa struttura funziona in Note di Apple." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota, un’intestazione al giorno</h2>
      <p>
        Una sola nota per tutti gli standup tiene la traccia: quello che martedì hai detto che avresti fatto sta subito sotto quello che
        hai fatto mercoledì. I blocchi stanno sopra i giorni, così sono la prima cosa che vedi. Lascia una parola in ogni riga, perché
        un elemento vuoto dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Appunti dello standup per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e le righe di Oggi in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone,
        scrivilo a mano, seleziona le righe di Oggi e tocca il pulsante dell’elenco di controllo.
      </p>

      <h2 id="ogni-giorno">Ogni giorno</h2>
      <ul>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza resta in cima alla sua cartella, così è la prima cosa che apri al
          mattino.
        </li>
        <li>
          <strong>Parti dalle spunte di ieri.</strong> Aggiungi l’intestazione di oggi sotto Blocchi. Quello che hai spuntato sotto
          l’Oggi di ieri diventa il tuo Ieri, e quello che resta senza spunta passa avanti.
        </li>
        <li>
          <strong>Scrivi Oggi la sera prima.</strong> Due o tre righe finché sai ancora dove ti sei fermato ti salvano la mattina.
        </li>
        <li>
          <strong>Togli i blocchi risolti.</strong> Quando qualcosa si sblocca, cancella la sua riga. Un elenco di blocchi vecchi smette
          di essere letto.
        </li>
        <li>
          <strong>Cerca nel passato.</strong> La ricerca legge ogni parola di ogni nota, quindi cercare &ldquo;importazione&rdquo; trova
          ogni giorno in cui ci hai lavorato.
        </li>
      </ul>
      <p>
        Tieni i punti brevi e con parole semplici. Lo standup è per persone che non conoscono il codice dai nomi dei branch.
      </p>

      <h2 id="team">Per un team: una riga per persona</h2>
      <p>
        Se tocca a te prendere gli appunti del daily scrum, basta una riga per persona: cosa ha fatto e cosa farà. I blocchi hanno un
        nome davanti, così tutti vedono chi è fermo su cosa.
      </p>
      <Keep title="Standup del team per Note di Apple" text={TEAM} copyLabel={ui.copy}
        note="Inizia una nota nuova ogni settimana o sprint, così resta corta." />
      <p>
        Attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle impostazioni di Note, e i blocchi risolti scendono in
        fondo. Con Apple Intelligence, una registrazione in Note diventa una trascrizione e un riepilogo, utile se non riesci a scrivere
        mentre conduci la riunione. Per le riunioni più lunghe, il modello per gli{" "}
        <a href="/it/blog/appunti-riunione-note-iphone">appunti di riunione nelle note di iPhone</a> ha le decisioni e le azioni con i
        loro responsabili, e <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese) ha una revisione settimanale
        da incollare.
      </p>

      <h2 id="limiti">Dove si fermano gli appunti dello standup in Note</h2>
      <ul>
        <li><strong>Ieri è a memoria.</strong> Quello che hai fatto sta nei tuoi commit e nelle pull request, e Note non li vede.</li>
        <li><strong>La sprint review è a mano.</strong> Riassumere due settimane vuol dire leggere dieci giorni di punti e riscriverli.</li>
        <li><strong>I blocchi vecchi sono difficili da trovare.</strong> Quando cancelli un blocco, niente ricorda quanto hai aspettato.</li>
        <li><strong>La nota cresce.</strong> Una nota sempre aperta si allunga, e accorciarla è un lavoro in più.</li>
      </ul>

      <h2 id="pinto-notes">Uno standup dai tuoi commit</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/daily-standup">Daily standup</a> è una nota con i blocchi in alto e
        sotto i giorni, una sezione per giorno lavorativo, dal più recente.
      </p>
      <p>
        Ogni mattina, racconta alla tua AI cosa hai fatto e cosa farai. Lei aggiunge una sezione con il giorno della settimana e la
        data, e Ieri e Oggi come punti brevi. Quello che è bloccato va tra i blocchi, e quando dici che si è sbloccato, esce. In Claude
        Code, il modello ha istruzioni sue: lancia git log nel repository per i tuoi commit da ieri, li trasforma in due a cinque punti
        semplici senza gli hash, ti chiede cosa farai dopo e cosa ti blocca, poi scrive la giornata.{" "}
        <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and Codex</a> (in inglese) ha il comando unico per
        aggiungerlo.
      </p>
      <p>
        Più avanti, chiedi &ldquo;su cosa ero bloccato la settimana scorsa?&rdquo; oppure &ldquo;riassumi i miei standup da lunedì per
        la sprint review&rdquo;. Ogni versione precedente della nota viene conservata, quindi anche un blocco cancellato si ritrova. La
        parte con l’AI funziona quando ChatGPT o Claude sono collegati;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto. Le note che tieni già in
        Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple resta
        com’era.
      </p>
    </LocalPostPage>
  );
}
