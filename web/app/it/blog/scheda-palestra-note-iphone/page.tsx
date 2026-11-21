import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "scheda-palestra-note-iphone");

// Italian version of /blog/apple-notes-workout-log-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "scheda palestra" is the big one (scheda palestra uomo, donna, 3 volte a settimana), "scheda palestra
// app" gives app scheda palestra iphone, "diario allenamento" gives diario allenamento palestra, pdf, excel, app;
// "allenamento note iphone" gives nothing. So the slug and title say "scheda palestra" plus "note di iPhone", and the
// text also says diario di allenamento. Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/not9474646a9/mac (File > Duplica nota), apd93c815aa0/mac (Formato > Altro >
// Deseleziona tutti), apd0a136b9cc/mac (Formato > Tabella), apdb54e469b6/mac (mettere in evidenza una nota), and the
// iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button, which has no name, so it is described).
// Modifica > Incolla come Markdown is the Italian string in Notes' MainMenu.loctable on macOS 27 (not in the Italian
// guide yet). Facts are the English post's; the picture is its English one, described in Italian. The habit tracker
// link goes to its Italian version; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Allenamento, settimana del 23 novembre

## Programma
- Gambe: squat, affondi, calf raise
- Spinta: panca piana, lento avanti, dip
- Tirata: stacco, rematore, trazioni

## Lunedì: gambe
- [ ] Squat 3 x 5 a 100 kg
- [ ] Affondi 3 x 10 a 16 kg
- [ ] Calf raise 3 x 15

## Mercoledì: spinta
- [ ] Panca piana 3 x 6 a 70 kg
- [ ] Lento avanti 3 x 8 a 40 kg
- [ ] Dip 3 x 10

## Venerdì: tirata
- [ ] Stacco 3 x 3 a 120 kg
- [ ] Rematore 3 x 8 a 60 kg
- [ ] Trazioni 3 x 6

## Record personali
- Stacco: 120 kg x 3 (6 nov)
- Squat: 100 kg x 5 (2 nov)
- Panca piana: 70 kg x 6 (4 nov)
- Corsa 5 km: 29 min (5 nov)
`;

const FAQ = [
  { q: "Note di Apple ha un modello per la scheda di allenamento?", a: [
    "No. Note di Apple non ha modelli e nemmeno un diario di allenamento. Una nota per settimana, con un’intestazione per ogni giorno di allenamento e le serie come elenco di controllo, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Meglio segnare gli allenamenti in un elenco di controllo o in una tabella?", a: [
    "In palestra l’elenco di controllo è più veloce: spunti ogni serie e cambi il peso se era diverso. Una tabella, da Formato > Tabella, mette in fila date e pesi, ma Note non sa ordinarla né sommarla, quindi aiuta meno di quanto sembri.",
  ] },
  { q: "Come tengo i record personali in Note di Apple?", a: [
    "Tieni un elenco Record personali in fondo alla nota e cambia una riga quando la superi, con la data. Note non si accorge da solo di un nuovo record, quindi controlla l’elenco dopo ogni allenamento.",
  ] },
  { q: "Esiste un diario di allenamento che tiene i record per me?", a: [
    "Pinto Notes ha un modello gratuito, Workout log: una riga per ogni allenamento e un elenco di record personali. Dopo l’allenamento di’ a ChatGPT o a Claude cosa hai fatto, e lui registra la sessione e aggiorna i tuoi record.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="scheda-palestra-note-iphone"
      intro={<>
        Un’app per la palestra vuole un account, un piano e un abbonamento prima del tuo primo squat. A una nota bastano le serie. Ecco
        una scheda per Note di Apple da incollare, come usarla in palestra e quando smette di bastare.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararla", label: "Prepararla" },
          { href: "#in-palestra", label: "In palestra" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un diario che tiene i record" },
        ]}>
          <p>
            Note di Apple non ha un diario di allenamento, ma una nota per settimana fa il lavoro. Metti il programma in alto,
            un’intestazione per ogni giorno di allenamento con le serie come elenco di controllo, e i tuoi record personali in fondo.
            Copia il modello qui sotto e duplicalo ogni settimana.
          </p>
          <PostCta template="workout-log" slug="it/scheda-palestra-note-iphone" path="/it/blog/scheda-palestra-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che i record li tenga qualcun altro?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per gli allenamenti. Dopo l’allenamento di’ a ChatGPT o a Claude cosa hai fatto, e lui registra la sessione e aggiorna i tuoi record personali.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/workout-log-note" width={1520} height={1020} maxWidth={640}
        alt="Una nota Workout log in Pinto Notes su un Mac: una tabella Sessions con una riga per ogni allenamento, da un giorno Pull con Deadlift 115 kg x 3 fino a Deadlift 120 kg x 3, e sotto un elenco Personal bests."
        caption="Lo stesso diario in Pinto Notes: una riga per ogni allenamento, e i tuoi record sempre aggiornati. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per settimana</h2>
      <p>
        Una settimana spinta, tirata e gambe come esempio. Cambia il programma e gli esercizi con i tuoi, poi i pesi. Lascia una parola
        in ogni riga, perché un elemento vuoto dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Scheda palestra per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollala in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararla">Prepararla</h2>
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, crea una nota nuova e scegli Modifica &gt; Incolla come Markdown. La riga con # diventa il titolo, ogni
        riga con ## un’intestazione, e le serie diventano elenchi di controllo. Un Comando-V normale lascia i simboli come testo. Su
        iPhone, scrivi le righe, seleziona le serie e tocca il pulsante dell’elenco di controllo. Metti la nota in una cartella Salute e
        mettila in evidenza, così è la prima cosa che vedi quando apri Note in palestra.
      </p>

      <h2 id="in-palestra">In palestra</h2>
      <Paths rows={[
        { on: "Mac", steps: ["File", "Duplica nota"] },
        { on: "Mac", steps: ["Formato", "Altro", "Deseleziona tutti"] },
      ]} />
      <ul>
        <li>
          <strong>Spunta ogni serie appena la finisci.</strong> Se il peso o le ripetizioni erano diversi, cambia la riga lì per lì:
          &ldquo;Squat 3 x 5 a 102,5 kg&rdquo;. Quella riga modificata è il tuo diario.
        </li>
        <li>
          <strong>Scrivi come è andata.</strong> Una parola dopo la riga, come &ldquo;facile&rdquo; o &ldquo;ultima ripetizione
          lenta&rdquo;, dice a te della settimana prossima se aggiungere peso.
        </li>
        <li>
          <strong>La prossima settimana parte da questa.</strong> La domenica, scegli File &gt; Duplica nota, cambia la data e i pesi,
          poi fai clic in ogni giorno e scegli Formato &gt; Altro &gt; Deseleziona tutti.
        </li>
        <li>
          <strong>Un nuovo record va in fondo.</strong> Quando una serie supera una riga di Record personali, cambia quella riga e la sua
          data.
        </li>
      </ul>
      <p>
        Se preferisci vedere le settimane in una griglia, Formato &gt; Tabella ne crea una;{" "}
        <a href="/blog/apple-notes-tables">tables in Apple Notes</a> (in inglese) spiega come, e cosa le tabelle non sanno fare. Per
        seguire abitudini invece di serie, c’è un <a href="/it/blog/habit-tracker-note-iphone">habit tracker nelle note di iPhone</a>,
        e altre note da incollare come questa sono in <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <p>
        Per segnare anche come ti sei sentito ogni giorno, oltre a cosa hai allenato, c’è un{" "}
        <a href="/it/blog/mood-tracker-note-iphone">mood tracker nelle note di iPhone</a> con energia e sonno.
      </p>

      <h2 id="limiti">Dove si ferma una scheda in Note</h2>
      <ul>
        <li><strong>Ogni settimana è una nota a sé.</strong> Per vedere com’è andata la panca questo mese, apri quattro note e le leggi una accanto all’altra.</li>
        <li><strong>I record sono a mano.</strong> Note non si accorge che 120 kg battono 115 kg. Controlli l’elenco e lo cambi tu, oppure no.</li>
        <li><strong>Le tabelle non contano.</strong> Una tabella in Note non sa ordinare per esercizio né sommare il volume di una settimana.</li>
        <li><strong>Nessuna risposta.</strong> &ldquo;Cosa ho fatto mercoledì scorso?&rdquo; vuol dire scorrere.</li>
      </ul>
      <p>
        Per una settimana, una nota è il diario più veloce che ci sia. Su più mesi, la parte utile, vedere che stai diventando più forte,
        resta a te.
      </p>

      <h2 id="pinto-notes">Un diario di allenamento che tiene i tuoi record</h2>
      <p>
        Per questo esiste Pinto Notes. Si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare
        nelle tue note dalla chat che usi già. Il modello gratuito <a href="/templates/workout-log">Workout log</a> è una nota per tutti
        i tuoi allenamenti: una tabella con una riga per sessione, con la data, l’allenamento, l’esercizio, il risultato e quanto è stato
        duro da 1 a 10, e sotto i tuoi record personali.
      </p>
      <p>
        Dopo l’allenamento, di’ alla tua AI cosa hai fatto: &ldquo;stacco, 120 per tre, fatica da nove&rdquo;. Lei aggiunge la riga e,
        se è un nuovo record, cambia anche quella riga. Poi chiedi &ldquo;sto migliorando sulla panca?&rdquo; o &ldquo;cosa ho fatto
        mercoledì scorso?&rdquo; e ti risponde guardando tutto il diario. Puoi sempre aggiungere e modificare ogni riga da te, e ogni
        versione precedente della nota viene conservata. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in
        inglese) richiede un minuto.
      </p>
      <p>
        Le tue note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple
        resta com’era.
      </p>
    </LocalPostPage>
  );
}
