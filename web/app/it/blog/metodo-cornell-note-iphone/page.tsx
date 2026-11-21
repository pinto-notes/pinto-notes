import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "metodo-cornell-note-iphone");

// Italian version of /blog/apple-notes-cornell-notes-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "metodo cornell" gives metodo cornell appunti, esempi, pdf, template, studio, app; "appunti cornell"
// gives appunti metodo cornell, schema and modello appunti cornell; the English "cornell notes" is suggested too. So the
// slug and title say "metodo Cornell" plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella in Note sul Mac": Formato > Tabella, a
// table of two rows and two columns, the Tabulatore or A capo in the last cell adds a row, selected lines of text
// become a table with the table button) and not9474646a9/mac (File > Duplica nota). The table button has no name in
// the guide, so it is described. As in the English post, Paste as Markdown is not used for the table. Facts are the
// English post's; the picture is its English one, described in Italian. The habit tracker link goes to its Italian
// version; the rest go to English posts.

const ui = UI.it;

// Tabs between the cue (spunto) and the note: select those lines in Notes and press the table button.
const TEMPLATE = `Domanda e offerta, 5 novembre

Spunto\tAppunti
Cosa sposta la curva di domanda?\tReddito, gusti, prezzi di beni collegati
Cosa fa muovere lungo la curva?\tSolo il prezzo del bene stesso
Qual è il prezzo di equilibrio?\tQuello in cui domanda e offerta si incontrano
Cosa provoca un prezzo massimo?\tUna carenza, se è sotto l’equilibrio

Riassunto: il prezzo del bene stesso ti fa muovere lungo la curva di domanda; reddito, gusti e prezzi dei beni collegati la spostano. Il prezzo si ferma dove domanda e offerta si incontrano.
`;

const FAQ = [
  { q: "Si possono prendere appunti con il metodo Cornell in Note di Apple?", a: [
    "Sì, con una tabella. Crea una tabella a due colonne, metti le domande nella colonna di sinistra e i tuoi appunti in quella di destra, e scrivi sotto un riassunto di due o tre frasi. Per ripassare, copri la colonna di destra e rispondi alle domande.",
  ] },
  { q: "Come faccio una tabella a due colonne in Note di Apple?", a: [
    "Sul Mac, scegli Formato > Tabella, o premi Opzione-Comando-T. Ottieni due righe e due colonne, e il Tabulatore nell’ultima cella aggiunge una riga. Puoi anche scrivere le righe con una tabulazione tra le due parti, selezionarle e premere il pulsante della tabella.",
  ] },
  { q: "Posso stringere la colonna degli spunti?", a: [
    "No. Note decide da solo la larghezza delle colonne e non puoi trascinarle. Tieni gli spunti corti, una domanda di poche parole, e lo spazio va alla colonna degli appunti.",
  ] },
  { q: "Esiste un’app per il metodo Cornell che mi interroga?", a: [
    "Pinto Notes ha un modello gratuito, Cornell notes. Incolla gli appunti della lezione in ChatGPT o Claude e lui scrive le domande e il riassunto, poi ti interroga sulle domande e tiene quelle che hai sbagliato.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="metodo-cornell-note-iphone"
      intro={<>
        Il metodo Cornell funziona perché trasforma i tuoi appunti in domande su cui metterti alla prova. Note di Apple non ha questo
        layout già pronto, ma una tabella a due colonne ci arriva. Ecco un modello Cornell per Note di Apple, come ripassare con lui e
        dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#ripassare", label: "Ripassare" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Appunti che ti interrogano" },
        ]}>
          <p>
            Note di Apple non ha un modello Cornell, ma una tabella a due colonne funziona: una domanda breve a sinistra, il tuo appunto
            a destra, una riga per ogni idea, e un riassunto di due o tre frasi sotto la tabella. Usa una nota per lezione, e copri la
            colonna di destra per ripassare.
          </p>
          <PostCta slug="it/metodo-cornell-note-iphone" path="/it/blog/metodo-cornell-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi le domande già scritte, e un’interrogazione?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello Cornell gratuito. Incolla gli appunti della lezione in ChatGPT o Claude e lui scrive le domande e il riassunto, poi ti interroga.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/cornell-notes-note" width={1520} height={1010} maxWidth={620}
        alt="Una nota Cornell notes in Pinto Notes su un Mac: una lezione Supply and demand con una tabella Cue e Notes di quattro righe, un riassunto e un elenco di controllo Cues to revisit."
        caption="Il metodo Cornell in Pinto Notes: domande a sinistra, appunti a destra, un riassunto e le domande che hai sbagliato. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: domande, appunti, riassunto</h2>
      <p>
        La pagina Cornell originale ha tre parti, e una nota può contenerle tutte. La colonna degli appunti è quello che hai scritto a
        lezione, in righe brevi. La colonna degli spunti ha una domanda a cui risponde ogni riga, scritta dopo la lezione. Il riassunto
        sono due o tre frasi con parole tue, ed è lì che succede gran parte del ricordare.
      </p>
      <Keep title="Metodo Cornell per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Ogni riga della tabella ha una tabulazione tra lo spunto e l’appunto. Incollala, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla il modello in una nota nuova, seleziona le cinque righe da Spunto
          all’ultimo appunto e premi il pulsante della tabella. Ogni tabulazione diventa una colonna, così hai Spunto e Appunti uno
          accanto all’altro.
        </li>
        <li>
          <strong>Oppure parti da zero.</strong> Scegli Formato &gt; Tabella per due righe e due colonne. Scrivi Spunto e Appunti nella
          prima riga, e il Tabulatore nell’ultima cella aggiunge la riga successiva.
        </li>
        <li>
          <strong>Tieni gli spunti corti.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi uno
          spunto lungo schiaccia i tuoi appunti. Poche parole, in forma di domanda.
        </li>
        <li>
          <strong>Una nota per lezione.</strong> Tienile in una cartella per ogni corso, e scegli File &gt; Duplica nota per iniziare la
          lezione dopo partendo dall’ultima.
        </li>
      </ul>
      <p>
        A lezione, compila solo la colonna degli appunti. Scrivi le domande e il riassunto la sera stessa, finché ricordi ancora cosa
        voleva dire la lezione. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega tutto quello che una
        tabella in Note sa fare e non sa fare.
      </p>

      <h2 id="ripassare">Ripassare</h2>
      <ul>
        <li><strong>Copri la colonna di destra.</strong> Tieni un foglio o la mano sopra gli appunti e rispondi ad alta voce a ogni domanda.</li>
        <li><strong>Segna cosa hai sbagliato.</strong> Tieni sotto il riassunto un breve elenco di controllo delle domande sbagliate, e spunta ognuna quando la sai.</li>
        <li><strong>Leggi prima i riassunti.</strong> Prima di un esame, i riassunti di tutte le lezioni sono il modo più veloce per rientrare in un corso.</li>
      </ul>
      <p>
        Per altre note da incollare allo stesso modo, c’è <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese),
        e per tenere in pista una settimana di studio, l’<a href="/it/blog/habit-tracker-note-iphone">habit tracker nelle note di
        iPhone</a> funziona anche per le sessioni di ripasso.
      </p>

      <h2 id="limiti">Dove si ferma il metodo Cornell in Note</h2>
      <ul>
        <li><strong>Le domande sono tue.</strong> Trasformare ogni riga di appunti in una buona domanda è la parte lenta, ed è quella che si salta.</li>
        <li><strong>Nessuna interrogazione.</strong> Coprire una colonna con la mano funziona, ma nessuno ti fa le domande o ricorda quali hai sbagliato.</li>
        <li><strong>Le lezioni restano separate.</strong> Ripassare un argomento spalmato su tre lezioni vuol dire aprire tre note.</li>
      </ul>

      <h2 id="pinto-notes">Appunti Cornell che ti interrogano</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/cornell-notes">Cornell notes</a> è una nota per corso: una sezione per
        lezione con una tabella di domande e appunti e un riassunto, più un elenco di domande da ripassare.
      </p>
      <p>
        Incolla nella tua AI gli appunti della lezione o di una lettura. Lei mette i tuoi appunti a destra in righe brevi, scrive una
        domanda per ognuno a sinistra e chiude con un riassunto in frasi semplici. Di’ &ldquo;interrogami su domanda e offerta&rdquo; e ti
        fa le domande una alla volta senza mostrare le risposte, poi aggiunge quelle sbagliate all’elenco da ripassare e le spunta quando
        più avanti rispondi giusto. Puoi sempre scrivere e modificare ogni riga da te, e ogni versione precedente della nota viene
        conservata. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
    </LocalPostPage>
  );
}
