import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "flashcard-note-iphone");

// Italian version of /blog/apple-notes-flashcards (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "flashcard" gives flashcards and flashcard per studiare; "flashcard per studiare" gives app flashcard per
// studiare and creare flashcard per studiare; "flashcard app" gives flashcard app ios and flashcard app gratis.
// Italians use the English word, so the slug and title say "flashcard" plus "note di iPhone". Apple's own Italian
// words, all read 21 Nov: the Mac guide support.apple.com/it-it/guide/notes/apd0a136b9cc/mac ("Aggiungere una tabella
// in Note sul Mac": Formato > Tabella, a table of two rows and two columns, the Tabulatore or A capo in the last cell
// adds a row, selected lines of text become a table with the table button), apd93c815aa0/mac ("Aggiungere elenchi in
// Note sul Mac": the checklist button, Formato > Altro > Deseleziona tutti), not9474646a9/mac (File > Duplica nota),
// apdc88ed7f1d/mac (a tag is # followed by a word) and not18ab658ed/mac (search looks in the body of every note). The
// table and checklist buttons have no name in the guide, so they are described. The same menu names are the Italian
// strings in Notes' MainMenu.loctable on macOS 27. As in the English post, Paste as Markdown is not used for the table.
// Facts are the English post's; the picture is its English one, described in Italian. The Cornell notes link goes to
// its Italian version; the rest go to English posts. Pinto's template and its study app buttons keep their English
// names, since the app is in English.

const ui = UI.it;

// Tabs between the question and the answer: select those lines in Notes and press the table button.
const TEMPLATE = `Flashcard di respirazione cellulare

Domanda\tRisposta
Cosa produce la cellula scomponendo il glucosio?\tATP, l’energia della cellula
Quali sono le tre fasi?\tGlicolisi, ciclo di Krebs, catena di trasporto degli elettroni
Quale fase produce più ATP?\tLa catena di trasporto degli elettroni
Dove avviene la catena di trasporto degli elettroni?\tNei mitocondri

Sbagliate questa volta
`;

const FAQ = [
  { q: "Si possono fare flashcard in Note di Apple?", a: [
    "Sì, con una tabella a due colonne: la domanda a sinistra, la risposta a destra, una riga per carta. Note non sa nascondere una risposta né girare una carta, quindi per metterti alla prova copri la colonna di destra.",
  ] },
  { q: "Note di Apple ha la ripetizione dilazionata?", a: [
    "No. Note non sa quali carte sono da ripassare né quali hai sbagliato. Un elenco di controllo delle carte sbagliate sotto la tabella, da studiare per primo la volta dopo, è quanto di più vicino puoi fare a mano.",
  ] },
  { q: "Posso mescolare le flashcard in Note di Apple?", a: [
    "No. Le tabelle in Note non si ordinano né si mescolano, quindi le carte arrivano nell’ordine in cui le hai scritte. Partire ogni tanto dall’ultima riga è il rimedio più semplice.",
  ] },
  { q: "Esiste un’app di flashcard che funziona come Note di Apple?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito per appunti di studio e flashcard, con la sua app per studiare. Incolla i tuoi appunti in ChatGPT o Claude e lui crea le carte; l’app ti mostra quelle da ripassare, una alla volta.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="flashcard-note-iphone"
      intro={<>
        Le flashcard funzionano perché ti fanno rispondere prima di vedere la risposta. Note di Apple non ha una modalità flashcard, ma
        una tabella a due colonne ci arriva vicino. Ecco un modello di flashcard da incollare in Note di Apple, come studiarci e dove
        si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#studiare", label: "Studiarci" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Carte che tornano quando serve" },
        ]}>
          <p>
            Note di Apple non ha le flashcard, ma una tabella a due colonne funziona: la domanda a sinistra, la risposta a destra, una
            riga per carta. Copri la colonna di destra per metterti alla prova, e tieni sotto la tabella un breve elenco di controllo
            delle carte che hai sbagliato.
          </p>
          <PostCta template="study-flashcards" slug="it/flashcard-note-iphone" path="/it/blog/flashcard-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi le carte già fatte, e riproposte quando serve?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello di flashcard gratuito con un’app per studiare. Incolla i tuoi appunti in ChatGPT o Claude e lui crea le carte; quelle che sbagli tornano prima.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/study-flashcards-note" width={1520} height={571} maxWidth={600}
        alt="Una nota Study notes and flashcards in Pinto Notes su un Mac: una riga su come funzionano le carte, poi un’intestazione Notes con una sezione Cell respiration di tre punti elenco."
        caption="Appunti di studio in Pinto Notes, la nota da cui nascono le flashcard. Dati di esempio. Intestazioni ed elenchi puntati funzionano allo stesso modo in Note di Apple; l’app per studiare non passa." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una tabella per argomento</h2>
      <p>
        Ogni riga è una carta. Tieni la domanda breve e la risposta ancora più breve: una carta che chiede un paragrafo per rispondere
        sono due carte. La riga sotto la tabella è dove vanno le carte sbagliate, così la sessione dopo parte da quelle.
      </p>
      <Keep title="Flashcard per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Ogni riga della tabella ha una tabulazione tra la domanda e la risposta. Incollala, poi trasforma quelle righe in una tabella." />

      <h2 id="prepararlo">Prepararlo</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Incolla, poi crea la tabella.</strong> Incolla il modello in una nota nuova, seleziona le cinque righe da Domanda
          all’ultima risposta e premi il pulsante della tabella. Ogni tabulazione diventa una colonna, così hai Domanda e Risposta una
          accanto all’altra.
        </li>
        <li>
          <strong>Oppure parti da zero.</strong> Scegli Formato &gt; Tabella per due righe e due colonne. Scrivi Domanda e Risposta nella
          prima riga, e il Tabulatore nell’ultima cella aggiunge la carta successiva.
        </li>
        <li>
          <strong>Tieni le domande brevi.</strong> Note decide da solo la larghezza delle colonne e non puoi trascinarle, quindi una
          domanda lunga schiaccia la risposta.
        </li>
        <li>
          <strong>Una nota per argomento.</strong> Tienile in una cartella Studio, aggiungi a ognuna un tag come #biologia e scegli File
          &gt; Duplica nota per iniziare l’argomento dopo con la stessa struttura.
        </li>
      </ul>
      <p>
        Funziona anche un elenco di righe &ldquo;domanda: risposta&rdquo;, ma la risposta resta in bella vista accanto alla domanda. La
        tabella ti permette di nascondere un’intera colonna in un colpo. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a>{" "}
        (in inglese) spiega tutto quello che una tabella in Note sa fare e non sa fare.
      </p>

      <h2 id="studiare">Studiarci</h2>
      <ul>
        <li><strong>Copri la colonna di destra.</strong> Tieni un foglio o la mano sopra le risposte e di’ ognuna ad alta voce prima di guardare.</li>
        <li><strong>Segna cosa hai sbagliato.</strong> Scrivi la domanda sotto Sbagliate questa volta e premi il pulsante dell’elenco di controllo. Spuntala quando, in una sessione successiva, rispondi giusto.</li>
        <li><strong>Parti dagli errori.</strong> La volta dopo, passa l’elenco di controllo prima della tabella. Sono le carte che hanno bisogno di esercizio.</li>
        <li><strong>Azzera per il giro dopo.</strong> Quando ogni errore è spuntato, scegli Formato &gt; Altro &gt; Deseleziona tutti, oppure cancella le righe spuntate e ricomincia.</li>
        <li><strong>Trova una carta da qualsiasi parola.</strong> La ricerca legge ogni parola di ogni nota, quindi &ldquo;mitocondri&rdquo; trova la carta ovunque sia.</li>
      </ul>
      <p>
        Se prendi appunti a lezione, il metodo Cornell nelle note di iPhone mette le
        domande proprio accanto ai tuoi appunti, cioè un mazzo di flashcard costruito mentre scrivi. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si fermano le flashcard in Note</h2>
      <ul>
        <li><strong>Niente è da ripassare.</strong> Note non sa quando hai visto una carta l’ultima volta, quindi o studi ogni carta ogni volta o tieni il conto da solo.</li>
        <li><strong>Niente carta da girare.</strong> La risposta è sempre sulla pagina. Coprirla funziona, ma basta un’occhiata.</li>
        <li><strong>Niente mescolare.</strong> Le tabelle non si ordinano, quindi impari l’ordine delle carte insieme alle risposte.</li>
        <li><strong>Creare le carte è la parte lenta.</strong> Trasformare un capitolo in buone domande richiede più tempo che studiarle.</li>
      </ul>
      <p>
        Per una verifica la settimana prossima con venti carte, una tabella in Note basta. Per un corso intero, la parte difficile è
        sapere quali carte studiare oggi, e Note lo lascia a te.
      </p>

      <h2 id="pinto-notes">Flashcard che tornano quando serve</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e una nota può essere anche una piccola app. Il modello
        gratuito <a href="/templates/study-flashcards">Study notes and flashcards</a> è una di queste: i tuoi appunti sotto
        un’intestazione per argomento, e un’app per studiare che ti mostra quante carte sono da ripassare oggi. Premi Study now e ti fa
        una carta alla volta. Premi Show answer, poi di’ com’è andata (Again, Hard, Good o Easy), e ogni pulsante ti dice quando la
        carta tornerà. Le carte che sbagli tornano prima; quelle che sai aspettano di più.
      </p>
      <p>
        Puoi aggiungere, modificare ed eliminare ogni carta nell’app da te, oppure incollare un elenco di righe con domanda e risposta e
        lei crea le carte. Con ChatGPT o Claude collegati, incolla gli appunti della lezione o un capitolo e lui crea da cinque a dieci
        carte accanto alle tue. Di’ &ldquo;interrogami su biologia, dieci carte&rdquo; e te le fa nella chat, una alla volta senza la
        risposta, e aggiorna ogni carta come fa l’app. Chiedi &ldquo;quali carte continuo a sbagliare?&rdquo; e legge il mazzo per
        risponderti. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Gli appunti di studio che tieni già in Note di Apple arrivano con <a href="/blog/import-your-notes">una sola importazione
        sul Mac</a>, e Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
