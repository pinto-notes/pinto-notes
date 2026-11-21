import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "planner-settimanale-note-iphone");

// Italian version of /blog/apple-notes-planner-template (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: "planner settimanale" is the big one (planner settimanale da stampare, pdf, da tavolo, stampabile, con
// orari); "planner settimanale iphone" exists; "planner settimanale app" gives planner settimanale app gratis;
// "planner giornaliero" gives planner giornaliero con orari and pdf; "to do list note iphone" exists; "planner note
// iphone" and "agenda settimanale note iphone" give nothing yet. So the slug and title say "planner settimanale" plus
// "note di iPhone", and the text names the planner giornaliero. Apple's own Italian words, all read 21 Nov 2026: the
// Mac guide support.apple.com/it-it/guide/notes/not9474646a9/mac (File > Duplica nota, Comando-D), apd93c815aa0/mac
// ("Aggiungere elenchi in Note sul Mac": Formato > Altro > Deseleziona tutti, "Ordina automaticamente gli elementi
// selezionati"), apd58edc7964/mac ("Usare le cartelle smart in Note sul Mac", with the rule value Non selezionati from
// Notes' SmartFolder loctables), apdb54e469b6/mac (mettere in evidenza: a note stays at the top of the list),
// apde615d29c2/mac (Modifica > Aggiungi link, Comando-K, a link to another note), and support.apple.com/it-it/102296
// (the pulsante Elenco di controllo on iPhone). Modifica > Incolla come Markdown is the Italian string in Notes'
// MainMenu.loctable on macOS 27 (not in the Italian guide yet), and an empty checklist item doesn't survive the paste
// (tried in the English apple-notes-templates post). Facts are the English post's; the picture is its Pinto Notes one,
// described in Italian. The habit tracker and meal planner links go to their Italian versions; the rest go to English
// posts. The PostCta keeps template="weekly-planner".

const ui = UI.it;

const WEEKLY = `# Settimana del 16 novembre

## Le tre cose della settimana
- [ ] Mandare il budget del quarto trimestre a Marco
- [ ] Prenotare i voli per Natale
- [ ] Correre tre volte

## Lunedì
- [ ] Riunione di team alle 9:00
- [ ] Finire la bozza del budget

## Martedì
- [ ] Dentista alle 8:30
- [ ] Corsa di 5 km

## Mercoledì
- [ ] Chiamare la mamma
- [ ] Restituire il pacco

## Giovedì
- [ ] Prenotare il tagliando dell’auto
- [ ] Cena con Sara alle 19:00

## Venerdì
- [ ] Ritirare i vestiti in lavanderia

## Sabato
- [ ] Mercato contadino

## Domenica
- [ ] Pianificare la settimana dopo

## Più avanti
- [ ] Rinnovare il passaporto
- [ ] Aggiustare la luce della bici
`;

const DAILY = `# Oggi

## Le tre cose di oggi
- [ ] Finire la bozza del budget
- [ ] Chiamare la mamma
- [ ] Corsa di 5 km

## Mattina
- [ ] Riunione di team alle 9:00
- [ ] Rispondere all’email di Marco

## Pomeriggio
- [ ] Rivedere le slide di Giulia
- [ ] Ritirare i vestiti in lavanderia

## Sera
- [ ] Cena con Sara alle 19:00

## Domani
- [ ] Quello che non è stato fatto
`;

const FAQ = [
  { q: "Note di Apple ha un modello di planner?", a: [
    "No. Note di Apple non ha modelli. Una nota per settimana, con un’intestazione per ogni giorno e le cose da fare di quel giorno come elenco di controllo, funziona da planner, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Come uso Note come planner?", a: [
    "Tieni una nota per settimana in una cartella Planner e metti in evidenza la nota di questa settimana. Metti per prime le tre cose che contano, ogni attività sotto il suo giorno, e quello che non ha un giorno sotto Più avanti. La domenica, duplica la nota per la settimana dopo e sposta quello che resta.",
  ] },
  { q: "Posso fare un planner giornaliero in Note su iPhone?", a: [
    "Sì. Scrivi le intestazioni e le attività, seleziona le attività e tocca il pulsante Elenco di controllo. Incolla come Markdown c’è sul Mac, quindi il modo più veloce è incollare il modello sul Mac e lasciare che la nota arrivi sull’iPhone.",
  ] },
  { q: "Esiste un planner che funziona come Note di Apple?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito di planner settimanale. Di’ a ChatGPT o a Claude cosa hai in programma questa settimana, e lui mette ogni attività sotto il suo giorno e tiene le tue tre cose più importanti.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="planner-settimanale-note-iphone"
      intro={<>
        Molte persone pianificano la settimana in Note di Apple: un elenco per giorno, le poche cose che contano di più e un mucchio di
        cose per un’altra volta. Funziona bene quando ogni settimana ha la stessa forma. Ecco un modello di planner settimanale per Note di
        Apple da incollare, una versione giornaliera, come far girare una settimana e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#settimanale", label: "Il planner settimanale" },
          { href: "#giornaliero", label: "Un planner giornaliero" },
          { href: "#come-usarlo", label: "Usare Note come planner" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Una settimana pianificata per te" },
        ]}>
          <p>
            Note di Apple non ha un modello di planner, ma una nota per settimana fa il lavoro: le tre cose che contano in alto,
            un’intestazione per ogni giorno con le sue cose da fare come elenco di controllo, e un elenco Più avanti per il resto. Incolla il
            modello settimanale qui sotto in una nota nuova, o quello giornaliero se pianifichi un giorno alla volta.
          </p>
          <PostCta template="weekly-planner" slug="it/planner-settimanale-note-iphone" path="/it/blog/planner-settimanale-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi la settimana già pianificata?">
            <p>Pinto Notes funziona come Note di Apple e ha un planner settimanale gratuito. Di’ a ChatGPT o a Claude cosa hai in programma e lui mette ogni attività sotto il suo giorno e tiene le tue tre cose più importanti.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="Una nota Weekly planner in Pinto Notes su un Mac: un elenco di controllo Top three this week con una cosa spuntata, un’intestazione per ogni giorno da Monday a Sunday con le cose da fare di quel giorno come elenco di controllo, i giorni fino a venerdì spuntati, e un elenco Later."
        caption="Una settimana in Pinto Notes, pianificata con il modello di planner settimanale. La stessa struttura funziona in Note di Apple. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="settimanale">Il modello di planner settimanale</h2>
      <p>
        Una nota tiene tutta la settimana. Le tre cose che contano vanno per prime, così sono la prima cosa che vedi quando la apri. Ogni
        giorno ha un’intestazione e il suo elenco di controllo, e Più avanti tiene quello che non ha ancora un giorno, così smette di
        affollare il lunedì. Metti le tue attività prima di incollare, e lascia una parola in ogni riga, perché un elemento vuoto
        dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Planner settimanale per Note di Apple" text={WEEKLY} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e le attività in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone, scrivilo,
        seleziona le attività e tocca il pulsante Elenco di controllo.
      </p>

      <h2 id="giornaliero">Una versione giornaliera</h2>
      <p>
        Se pianifichi un giorno alla volta, tieni una sola nota chiamata Oggi e mettila in evidenza in cima alla sua cartella. Le tre cose
        che contano vengono di nuovo per prime, poi la giornata in tre parti, e un elenco Domani per quello che non è stato fatto.
      </p>
      <Keep title="Planner giornaliero per Note di Apple" text={DAILY} copyLabel={ui.copy} />
      <p>
        Ogni mattina, cancella quello che hai spuntato ieri, sposta le righe di Domani dentro la giornata e scegli tre cose nuove. Se alcune
        righe si ripetono ogni giorno, come una corsa o la posta, fai clic nell’elenco e scegli Formato &gt; Altro &gt; Deseleziona tutti
        invece di riscriverle.
      </p>

      <h2 id="come-usarlo">Come usare Note come planner</h2>
      <ul>
        <li>
          <strong>Una nota per settimana.</strong> Tienile in una cartella Planner e metti in evidenza la nota di questa settimana, così
          sull’iPhone è a un tocco.
        </li>
        <li>
          <strong>La settimana dopo parte da questa.</strong> La domenica, scegli File &gt; Duplica nota, cambia la data nel titolo,
          cancella quello che è spuntato e sposta quello che resta sotto Lunedì.
        </li>
        <li>
          <strong>Lascia scendere quello che è fatto.</strong> Attiva Ordina automaticamente gli elementi selezionati, e le attività
          spuntate scendono in fondo a ogni giorno.
        </li>
        <li>
          <strong>Trova quello che è ancora aperto.</strong> Una cartella smart con la regola Elenchi di controllo: Non selezionati mostra
          ogni nota che ha ancora una cosa da fare, da tutte le cartelle (di più in{" "}
          <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a>, in inglese).
        </li>
        <li>
          <strong>Collega le cose più grandi.</strong> Seleziona un’attività, scegli Modifica &gt; Aggiungi link (Comando-K) e scegli la
          nota a cui appartiene, per esempio gli appunti della riunione di lunedì.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["File", "Duplica nota"] },
        { on: "Mac", steps: ["Modifica", "Aggiungi link"], keys: "⌘K" },
      ]} />
      <p>
        La stessa struttura, una nota a settimana, funziona per altre abitudini. L’<a href="/it/blog/habit-tracker-note-iphone">habit
        tracker nelle note di iPhone</a> spunta le abitudini giorno per giorno, il{" "}
        <a href="/it/blog/menu-settimanale-note-iphone">menu settimanale</a> pianifica le cene della settimana, e{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese) ha altre note da incollare.
      </p>

      <h2 id="limiti">Dove si ferma un planner in Note</h2>
      <ul>
        <li><strong>Niente si sposta da solo.</strong> Un’attività che non hai fatto mercoledì resta su mercoledì finché non la tagli e la incolli sotto oggi.</li>
        <li><strong>Una settimana nuova è a mano.</strong> Duplica la nota, cambia la data, cancella quello che è fatto e sposta il resto. Salta una volta e la settimana va avanti nella nota della settimana scorsa.</li>
        <li><strong>La pianificazione è tua.</strong> Un elenco di venti cose non si divide da solo nei giorni, e le tre cose più importanti non si scelgono da sole.</li>
        <li><strong>La ricerca trova parole, non risposte.</strong> Trova il dentista. Non sa dirti cosa resta questa settimana o cosa continua a essere rimandato.</li>
      </ul>
      <p>
        Per una settimana leggera, una nota e qualche minuto la domenica bastano. Per una settimana piena, spostare e mettere in ordine è il
        lavoro, e resta a te.
      </p>

      <h2 id="pinto-notes">Una settimana pianificata per te</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/weekly-planner">Weekly planner</a> è una nota con Top three this week,
        un’intestazione per ogni giorno da lunedì a domenica, e Later.
      </p>
      <p>
        Di’ alla tua AI cosa hai in programma questa settimana, tutto in un messaggio. Lei mette ogni attività sotto il suo giorno come
        elenco di controllo, mette sotto Later quello che non ha un giorno, e tiene tra le tre cose principali le tre che dici che contano
        di più. Chiedile di &ldquo;spostare a oggi quello che non ho finito&rdquo; e le attività non spuntate dei giorni prima arrivano a
        oggi. La domenica, dille che inizia una settimana nuova: toglie quello che è spuntato, sposta il resto a lunedì e ti chiede le tre
        cose della settimana dopo. Puoi sempre scrivere e spuntare tutto da solo, e ogni versione precedente di una nota viene conservata.
        La parte con l’AI funziona una volta collegati ChatGPT o Claude, e{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        I piani che hai già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a> (in
        inglese), e Note di Apple resta com’era. L’app è in inglese.
      </p>
    </LocalPostPage>
  );
}
