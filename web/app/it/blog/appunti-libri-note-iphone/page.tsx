import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "appunti-libri-note-iphone");

// Italian version of /blog/apple-notes-book-notes-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "appunti libri", "appunti di lettura" (i miei appunti di lettura) and "come prendere appunti libro"
// (come prendere appunti dal libro); "scheda libro" is school worksheets, so it is not used. So the slug says "appunti
// libri" and the title "appunti di lettura", plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac
// guide support.apple.com/it-it/guide/notes/apde615d29c2/mac ("Aggiungere link in Notes sul Mac": Modifica > Aggiungi
// link, Comando-K, links to another note), apdc88ed7f1d/mac (a tag is # followed by a word), apd58edc7964/mac ("Usare le
// cartelle smart": the Tag and Elenchi di controllo rules), not9474646a9/mac (File > Duplica nota), not18ab658ed/mac
// (search looks in the body of every note), and the iPhone guide it-it/guide/iphone/iph908d1558b/ios (Aggiungi link)
// and iph1ac0b3a2/ios (the checklist button, which has no name, so it is described). Tag, Elenchi di controllo and Non
// selezionati are also the Italian strings in SmartFolderFilterRow.loctable and SmartFolderChecklistsFilterView.loctable
// on macOS 27. Modifica > Incolla come Markdown is new in macOS 27 and not in the Italian guide yet: it is the Italian
// string in Notes' MainMenu.loctable. The iPhone guide reaches Aggiungi link from a button
// without a name, so the iPhone row shows only Aggiungi link. Facts are the English post's; the picture is its English one,
// described in Italian. The book keeps its English title in the template, as in the picture. The reading list link goes
// to its Italian version; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Four Thousand Weeks di Oliver Burkeman

## Righe da tenere
- “Il giorno in cui avrai finalmente tutto sotto controllo non arriverà mai.” (p. 31)

## I miei pensieri
- La lista delle cose da fare è infinita per natura. Finirla non è l’obiettivo.
- Scegli i tuoi tre grandi progetti; tutto il resto aspetta.
- Dire di no alle cose buone è la parte difficile.

## L’idea centrale
La vita è breve e l’attenzione è limitata. Provare a fare tutto garantisce che le cose importanti vengano schiacciate. Scegli cosa trascurare, di proposito.

## Cosa farò di diverso
- [ ] Tenere una lista di tre progetti attivi, non di più
- [ ] Fare per prima la cosa più importante, prima della posta
- [ ] Tenere una sera a settimana senza niente in programma
`;

const INDEX = `# Libri

## 2026
- Four Thousand Weeks di Oliver Burkeman
- Deep Work di Cal Newport
`;

const FAQ = [
  { q: "Note di Apple ha un modello per gli appunti dei libri?", a: [
    "No. Note di Apple non ha nessun modello. Una nota per libro, con le intestazioni per le citazioni, i tuoi pensieri, l’idea centrale e cosa farai di diverso, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Come si prendono appunti da un libro?", a: [
    "Scrivi le righe che ti fermano, con il numero di pagina, e accanto un breve pensiero tuo. Quando finisci, scrivi l’idea centrale del libro in tre frasi e una o due cose che cambierai.",
  ] },
  { q: "Come ritrovo una citazione in Note di Apple?", a: [
    "La ricerca legge ogni parola di ogni nota, quindi bastano poche parole della citazione per trovarla. Se metti a ogni nota di libro il tag #libri, una cartella smart può anche raccoglierle tutte in un posto.",
  ] },
  { q: "Esiste un’app per gli appunti dei libri che funziona come Note di Apple?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito per gli appunti dei libri. Manda a ChatGPT o Claude le tue sottolineature mentre leggi e lui le mette sotto il libro; quando finisci, scrive l’idea centrale.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="appunti-libri-note-iphone"
      intro={<>
        Un anno dopo un bel libro, di solito ricordi la copertina e un’idea, se va bene. Una pagina di appunti per libro cambia le cose.
        Ecco un modello per gli appunti di lettura da incollare in Note di Apple, un indice per tenerli insieme e dove Note si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#mentre-leggi", label: "Mentre leggi" },
          { href: "#indice", label: "Tenerli insieme" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Appunti che scrivono l’idea centrale" },
        ]}>
          <p>
            Note di Apple non ha un modello per gli appunti dei libri, ma una nota per libro basta: le righe da tenere con il numero di
            pagina, i tuoi pensieri, l’idea centrale in tre frasi quando finisci e un elenco di controllo di cosa farai di diverso.
            Copia il modello qui sotto per ogni libro nuovo.
          </p>
          <PostCta template="book-notes" slug="it/appunti-libri-note-iphone" path="/it/blog/appunti-libri-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le sottolineature si mettano in ordine da sole?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per gli appunti dei libri. Manda a ChatGPT o Claude una sottolineatura mentre leggi e lui la archivia; quando finisci, scrive l’idea centrale.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/book-notes-note" width={1520} height={1255} maxWidth={600}
        alt="Una nota Book notes in Pinto Notes su un Mac: Four Thousand Weeks di Oliver Burkeman con una citazione da pagina 31, quattro pensieri, l’idea centrale e un elenco di controllo di tre cose da fare diversamente, poi Deep Work di Cal Newport."
        caption="Appunti di lettura in Pinto Notes, una sezione per libro, come li salva il modello. Dati di esempio. Intestazioni, elenchi ed elenco di controllo funzionano allo stesso modo in Note di Apple." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per libro</h2>
      <p>
        Quattro parti, nell’ordine in cui le riempi. Le citazioni e i tuoi pensieri arrivano mentre leggi. L’idea centrale e l’elenco
        di controllo arrivano quando finisci, e sono le parti per cui ci tornerai. Lascia una parola in ogni riga, perché un elemento
        vuoto dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Appunti di lettura per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e l’ultima parte in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone,
        scrivilo, seleziona le ultime righe e tocca il pulsante dell’elenco di controllo. Per il libro dopo, scegli File &gt; Duplica
        nota e sostituisci le parole.
      </p>

      <h2 id="mentre-leggi">Mentre leggi</h2>
      <ul>
        <li>
          <strong>Prima il numero di pagina.</strong> Scrivi la pagina prima della citazione. Ci vuole un secondo, ed è così che ritrovi
          la riga nel libro.
        </li>
        <li>
          <strong>Parole tue, non un riassunto.</strong> Un pensiero come &ldquo;dire di no alle cose buone è la parte difficile&rdquo;
          vale più di una parafrasi ordinata del capitolo.
        </li>
        <li>
          <strong>Scrivi l’idea centrale entro un giorno.</strong> Tre frasi, a memoria, prima di iniziare il libro dopo. Se non ci
          riesci, il libro non ti è rimasto, e anche questo è utile saperlo.
        </li>
        <li>
          <strong>Tieni l’elenco di controllo corto.</strong> Da due a quattro cose che proverai davvero. Spuntale quando diventano
          abitudini.
        </li>
      </ul>

      <h2 id="indice">Tenerli insieme</h2>
      <p>
        Scrivi #libri sotto il titolo di ogni nota di libro: così diventa un tag. Una cartella smart con la regola Tag impostata su libri
        raccoglie ogni nota di libro in un posto, e aggiungendo la regola Elenchi di controllo: Non selezionati vedi solo i libri con
        qualcosa che non hai ancora provato. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> (in inglese)
        spiega come crearne una.
      </p>
      <Keep title="Indice dei libri per Note di Apple" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Aggiungi link"], keys: "⌘K" },
        { on: "iPhone", steps: ["Aggiungi link"] },
      ]} />
      <p>
        Per un indice per anno, tieni un’altra nota, Libri, e trasforma ogni titolo in un link: selezionalo, scegli Aggiungi link e
        scegli la nota del libro. La ricerca legge ogni parola di ogni nota, quindi poche parole di una citazione la trovano anche
        quando hai dimenticato il libro. I libri che non hai ancora letto vanno nella{" "}
        <a href="/it/blog/libri-da-leggere-note-iphone">lista dei libri da leggere</a>, e altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si fermano gli appunti di lettura in Note</h2>
      <ul>
        <li><strong>Ogni citazione si scrive a mano.</strong> Copiare una riga da un libro di carta vuol dire posare il libro, trovare la nota e scriverla.</li>
        <li><strong>L’idea centrale è la parte che si salta.</strong> Niente ti ricorda di scriverla, e una settimana dopo è più difficile.</li>
        <li><strong>L’indice è a mano.</strong> Un libro nuovo non c’è finché non aggiungi il suo link.</li>
        <li><strong>I libri restano separati.</strong> La ricerca trova parole. Non sa dirti cosa avevano in comune tre libri sulla concentrazione.</li>
      </ul>

      <h2 id="pinto-notes">Appunti di lettura che scrivono l’idea centrale</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/book-notes">Book notes</a> è una nota con una sezione per libro, dal
        più recente: le citazioni, i tuoi pensieri, l’idea centrale e cosa farai di diverso.
      </p>
      <p>
        Di’ alla tua AI quale libro stai leggendo e lei apre la sezione del libro. Mandale una sottolineatura mentre vai avanti, come
        &ldquo;pagina 31: il giorno in cui avrai finalmente tutto sotto controllo non arriverà mai&rdquo;, e la archivia come citazione
        con il numero di pagina. I tuoi pensieri entrano come elenco puntato, con le tue parole, senza ritocchi. Di’ &ldquo;l’ho finito,
        chiudilo tu&rdquo; e scrive l’idea centrale in tre frasi e da due a quattro cose da fare diversamente come elenco di controllo.
        Puoi sempre scrivere e modificare ogni riga da te, e ogni versione precedente della nota viene conservata.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Gli appunti di lettura che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione
        sul Mac</a>, e Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
