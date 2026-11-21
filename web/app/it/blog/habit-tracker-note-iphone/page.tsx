import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "habit-tracker-note-iphone");

// Italian version of /blog/apple-notes-habit-tracker (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: Italians search the English term, "habit tracker" (habit tracker app, template, pdf, da stampare),
// "habit tracker iphone" gives habit tracker iphone notes and habit tracker iphone gratis; "tracker abitudini" exists
// but is smaller. So the slug and title keep "habit tracker" plus "note di iPhone". Apple's own Italian words, all
// read 21 Nov: the Mac guide support.apple.com/it-it/guide/notes/apd93c815aa0/mac ("Aggiungere elenchi in Note sul
// Mac": elenco di controllo, Formato > Altro > Seleziona tutti o Deseleziona tutti, the Command-click, "Ordina
// automaticamente gli elementi selezionati" in the Notes settings), not9474646a9/mac (File > Duplica nota),
// apd58edc7964/mac ("Usare le cartelle smart": the Elenchi di controllo rule), and the iPhone guide
// it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button, which has no name, so it is described). Modifica > Incolla
// come Markdown is new in macOS 27 and not in the Italian guide yet: it is the Italian string in Notes'
// MainMenu.loctable on macOS 27, like Deseleziona tutti; the Smart Folder value Non selezionati is the Italian string
// in SmartFolderChecklistsFilterView.loctable. Facts are the English post's; the pictures are its English ones,
// described in Italian. The workout log link goes to its Italian version; the rest go to English posts.

const ui = UI.it;

const DAY = `- [ ] Camminare 20 minuti
- [ ] Leggere 10 pagine
- [ ] A letto entro le 23`;

const TEMPLATE = `# Abitudini, settimana del 16 novembre

## Lunedì
${DAY}

## Martedì
${DAY}

## Mercoledì
${DAY}

## Giovedì
${DAY}

## Venerdì
${DAY}

## Sabato
${DAY}

## Domenica
${DAY}

## Com’è andata la settimana
- Fatte:
- Saltate:
`;

const FAQ = [
  { q: "Note di Apple ha un habit tracker?", a: [
    "No. Note di Apple non ha un habit tracker e nemmeno dei modelli. Una nota con un’intestazione per ogni giorno e sotto un elenco di controllo con le tue abitudini funziona come tale: spunti le abitudini man mano e ogni settimana parti da una copia nuova.",
  ] },
  { q: "Come si azzera un elenco di controllo in Note di Apple?", a: [
    "Sul Mac, fai clic nell’elenco e scegli Formato > Altro > Deseleziona tutti. Azzerando perdi quello che avevi spuntato, quindi per un habit tracker duplica prima la nota e azzera la copia.",
  ] },
  { q: "Note di Apple può contare la mia serie di giorni?", a: [
    "No. Note non conta le spunte tra note o giorni diversi, quindi la serie la conti tu, scorrendo indietro le settimane.",
  ] },
  { q: "Esiste un habit tracker gratuito che funziona come una nota?", a: [
    "Pinto Notes ha un modello gratuito, Habit tracker: una nota che è una piccola app, con l’anello della settimana, una spunta per abitudine, le serie e una vista del mese. ChatGPT o Claude possono segnare quello che hai fatto.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="habit-tracker-note-iphone"
      intro={<>
        Vuoi seguire qualche abitudine nell’app che apri già tutti i giorni, senza iscriverti a un’altra. Note di Apple sa fare una
        versione semplice. Ecco un modello settimanale da incollare, come portarlo avanti e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#ogni-settimana", label: "Ogni settimana" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un tracker che conta" },
        ]}>
          <p>
            Note di Apple non ha un habit tracker, ma un elenco di controllo copre la parte di ogni giorno. Crea una nota per settimana
            con un’intestazione per ogni giorno e sotto le tue abitudini come elenco di controllo, spuntale man mano e il lunedì duplica
            la nota. Copia il modello qui sotto.
          </p>
          <PostCta slug="it/habit-tracker-note-iphone" path="/it/blog/habit-tracker-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le serie le conti qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per le abitudini: spunti un’abitudine con un tocco e vedi l’anello della settimana, le tue serie e il mese. ChatGPT o Claude possono segnare la giornata per te.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/template-copies" width={1200} height={750} maxWidth={560}
        alt="Tre schede disegnate con un elenco di controllo, aperte a ventaglio, con delle stanghette accanto."
        caption="Un habit tracker in Note è un elenco di controllo che copi ogni settimana." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una settimana di abitudini</h2>
      <p>
        Tre abitudini, sette giorni e uno spazio per dire com’è andata la settimana. Metti le tue abitudini prima di incollare, e lascia
        una parola in ogni riga, perché un elemento vuoto dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Habit tracker settimanale per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Lo stesso Markdown incollato due volte in Note di Apple su macOS 27: con Comando-V i simboli restano testo, con Incolla come Markdown diventano un’intestazione, un elenco e del testo in grassetto."
        caption="A sinistra l’incolla normale, a destra Incolla come Markdown. Lo stesso vale per le righe dell’elenco di controllo." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, crea una nota nuova e scegli Modifica &gt; Incolla come Markdown. La riga con # diventa il titolo, ogni
        giorno diventa un’intestazione e le righe <code>- [ ]</code> diventano un elenco di controllo da spuntare. Un Comando-V normale
        lascia i simboli come testo. Su iPhone, scrivi le abitudini come righe, selezionale e tocca il pulsante dell’elenco di
        controllo.
      </p>
      <p>
        Due impostazioni aiutano. Attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle impostazioni di Note, e
        quello che hai fatto scende in fondo a ogni giorno. E una cartella smart con la regola Elenchi di controllo, Non selezionati
        mostra ogni nota in cui resta qualcosa da spuntare; <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a>{" "}
        (in inglese) spiega come crearne una.
      </p>

      <h2 id="ogni-settimana">Ogni settimana</h2>
      <p>
        Il lunedì, seleziona la nota della settimana scorsa e scegli File &gt; Duplica nota, poi cambia la data nel titolo e togli tutte
        le spunte: fai clic nell’elenco di ogni giorno e scegli Formato &gt; Altro &gt; Deseleziona tutti. Tieni le note vecchie in una
        cartella Abitudini. Quella cartella è il tuo storico.
      </p>
      <p>
        Se segui anche altre routine così, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese) ha una revisione
        settimanale e una lista per oggi da incollare allo stesso modo. Se una delle tue abitudini è la palestra, una{" "}
        <a href="/it/blog/scheda-palestra-note-iphone">scheda palestra nelle note di iPhone</a> tiene le serie e i tuoi record.
      </p>

      <h2 id="limiti">Dove si ferma un habit tracker in Note</h2>
      <ul>
        <li><strong>Niente serie.</strong> Note non conta le spunte, quindi quanti giorni di fila hai camminato lo conti tu, scorrendo le settimane passate.</li>
        <li><strong>Niente settimana a colpo d’occhio.</strong> Ogni giorno è un elenco a sé. Per capire quale abitudine salti più spesso devi leggere tutta la nota.</li>
        <li><strong>Ogni abitudine, ogni giorno.</strong> Un’abitudine da tre volte a settimana, o otto bicchieri d’acqua, non sta in una sola spunta.</li>
        <li><strong>Una copia ogni lunedì.</strong> Se salti la copia, le spunte della settimana finiscono nella nota della settimana prima.</li>
      </ul>
      <p>
        Per tre abitudini e un po’ di disciplina, la nota funziona. Oltre, stai facendo a mano il lavoro che potrebbe fare un’app.
      </p>

      <h2 id="pinto-notes">Un habit tracker che conta per te</h2>
      <Figure shot={{ ...SHOTS.habitApp, alt: "L’app habit tracker in una nota di Pinto Notes su un Mac: l’anello della settimana al 62 per cento, 2 abitudini su 6 fatte oggi, una griglia con la settimana di ogni abitudine, e le abitudini con le spunte e le serie, tra cui Gym a 1 su 3 questa settimana." }}
        caption="Il modello Habit tracker in Pinto Notes su un Mac, con dati di esempio: l’anello della settimana, le abitudini di oggi con le loro serie, e Gym a 1 su 3 questa settimana." />
      <p>
        Per questo esiste Pinto Notes. Si presenta e funziona come Note di Apple su iPhone e Mac, e una nota può essere anche una piccola
        app. Il modello gratuito <a href="/templates/habit-tracker">Habit tracker</a> è una di queste. Scegli le tue abitudini una
        volta, le spunti con un tocco, e lui ti mostra l’anello della settimana, la serie e il record di ogni abitudine, e un mese che
        puoi completare anche dopo. Un’abitudine può essere di ogni giorno, di alcuni giorni feriali, di qualche volta a settimana, o
        un conteggio come i bicchieri d’acqua.
      </p>
      <p>
        Puoi anche dire a ChatGPT o a Claude cosa hai fatto, nella chat che usi già, e la giornata viene spuntata nella nota. Chiedi
        quale abitudine hai saltato di più questo mese e legge il tracker per risponderti.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Le tue note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple
        resta com’era.
      </p>
    </LocalPostPage>
  );
}
