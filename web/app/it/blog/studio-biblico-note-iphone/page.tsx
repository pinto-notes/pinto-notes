import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "studio-biblico-note-iphone");
// Italian version of /blog/apple-notes-bible-study-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "modello studio biblico note" returned [];
// "studio biblico" suggested "studio biblico", "studio biblico evangelico" and "studio biblico cattolico".
// Apple Italian sources read 21 Nov 2026: it-it/guide/notes/apd1955d3b21/mac,
// apd93c815aa0/mac, apd0a136b9cc/mac, not9474646a9/mac and
// it-it/guide/iphone/iph1ac0b3a2/ios, plus it-it/102296. Mac guide direct opens
// returned 429; search-served text and the Italian pilot verified the named controls.
// Giacomo 1:22 quotes Giovanni Diodati's 1649 public-domain text from
// https://getbible.life/giovanni/Giacomo/1?tab=chapters. No picture in English.
const ui = UI.it;
const TEMPLATE = `Studio biblico: Giacomo 1:19-25, 21 novembre 2026

Passo
Giacomo 1:19-25
Traduzione: Giovanni Diodati, edizione 1649
Citazione, Giacomo 1:22: "E siate facitori della parola, e non solo uditori; ingannando voi stessi."

Osservazioni
Il versetto 19 invita ad ascoltare prima di parlare e mette in guardia dall'ira.
Nei versetti 23-24 chi ascolta e dimentica è paragonato a una persona che si guarda allo specchio e poi dimentica il proprio aspetto.

Domande
Che rapporto c'è tra lo specchio e il passare all'azione?
A cosa si riferisce il verbo "perseverare" nel versetto 25?

Passi da confrontare
Riferimento\tCosa confrontare
Luca 6:46-49\tAscoltare e agire rispetto a Giacomo 1:22.
Proverbi 15:1\tLe parole e l'ira rispetto a Giacomo 1:19.

Applicazione
Stasera a cena lascerò finire di parlare Giulia prima di rispondere.
Domani annoterò un momento in cui ho ascoltato o interrotto qualcuno.

Preghiera
Dio, aiutami ad ascoltare con pazienza e a mettere in pratica ciò che imparo. Amen.
`;
const PROMPT = `Leggi la mia nota Pinto Notes "Studio biblico: Giacomo 1:19-25, 21 novembre 2026".
Cerca nelle altre mie note di studio domande precedenti sull'ascolto, sulle parole o sul passare all'azione.
In chat riporta le domande identiche all'originale, con titolo e data della nota da cui provengono.
Se non ne trovi, dillo. Non inventare note o risposte. Non modificare le note mentre controllo i risultati.
Quando scelgo una domanda, aggiungi solo quella e la sua fonte sotto Domande nella nota su Giacomo.
Lascia invariati la citazione, le osservazioni, l'applicazione e la preghiera.
Se proponi un'interpretazione, chiamala "Interpretazione da verificare" in chat e tienila separata dal testo biblico.`;
const FAQ = [
  { q: "Cosa mettere in una nota per lo studio biblico?", a: ["Indica passo e traduzione. Tieni separate osservazioni, domande, altri passi da confrontare, applicazione e preghiera. Etichetta sempre le citazioni per distinguerle dalle tue parole."] },
  { q: "Posso mettere i riferimenti in una tabella di Note?", a: ["Sì. Usa una colonna per il riferimento e una per il motivo del confronto. Leggi ogni passo nel suo contesto prima di trarre conclusioni."] },
  { q: "A cosa serve l'elenco di controllo?", a: ["A ricordare azioni concrete, come rileggere un passo o approfondire una domanda. La spunta registra l'azione, non misura la comprensione o la fede."] },
  { q: "Posso riusare questo schema?", a: ["Sì. Sul Mac seleziona la nota e scegli File > Duplica nota. Cambia passo, data, citazione e risposte. Conserva lo studio precedente come documento separato."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="studio-biblico-note-iphone"
  intro={<>Copia questo schema per lo studio biblico in Note di Apple e usa una nota per ogni passo. L'esempio su Giacomo 1:19-25 separa osservazioni, domande, confronti, applicazione e preghiera.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modello", label: "Copia il modello" }, { href: "#preparare", label: "Prepara la nota" }, { href: "#studiare", label: "Studia il passo" }, { href: "#limiti", label: "I limiti" }, { href: "#pinto", label: "Trova domande precedenti" }]}><p>Scrivi il riferimento e la traduzione sopra i tuoi appunti. Lo schema funziona come testo semplice. In Note puoi trasformare i riferimenti in tabella e le azioni in elenco di controllo.</p><div id="modello"><Keep title="Schema di studio biblico per Note" text={TEMPLATE} copyLabel={ui.copy} note="Copia in una nuova nota e sostituisci l'esempio con il tuo passo. I passaggi per formattarlo sono qui sotto." /></div><PostCta slug="it/studio-biblico-note-iphone" path="/it/blog/studio-biblico-note-iphone" position="answer" ui={ui.cta} title="Ritrova domande dai tuoi studi"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può cercare nelle tue note e leggere le domande precedenti.</p></PostCta></Answer>} hero={<></>} faq={FAQ}>
  <h2 id="preparare">Prepara la nota</h2><p>Usa una nota iCloud o salvata sul dispositivo. Alcune funzioni di Note non sono disponibili con altri provider email.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["Seleziona il nome della sezione", "Pulsante di formattazione", "Intestazione"] }, { on: "Mac", steps: ["Seleziona i riferimenti", "Formato", "Tabella"] }, { on: "iPhone", steps: ["Seleziona il nome della sezione", "Formato", "Intestazione"] }]} />
  <p>Sul Mac incolla il testo in una nuova nota. Seleziona i nomi delle sezioni e applica Intestazione. Seleziona le due righe sotto Applicazione e usa il pulsante dell'elenco di controllo. Seleziona le tre righe dei passi da confrontare e usa il pulsante della tabella, oppure scegli Formato &gt; Tabella e inserisci i dati. La tabulazione divide le colonne; il tasto Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
  <p>Su iPhone tocca Nuova nota e incolla. Seleziona i nomi delle sezioni, tocca Formato e poi Intestazione. Crea un elenco di controllo sotto Applicazione, una voce alla volta, e rimuovi le righe originali. Per i riferimenti usa Aggiungi tabella e metti riferimenti e collegamenti in celle separate. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple</a> mostra i controlli.</p>
  <h2 id="studiare">Usa lo schema per un altro passo</h2><p>Indica il passo e la traduzione. L'esempio cita <a href="https://getbible.life/giovanni/Giacomo/1?tab=chapters">Giacomo 1:22 nella traduzione di Giovanni Diodati del 1649</a>, di pubblico dominio. Etichetta il testo copiato e scrivi sotto le tue osservazioni. Leggi tutto il passo prima di annotare ripetizioni o immagini, come lo specchio in questo esempio.</p>
  <p>Tieni aperte le domande irrisolte. Se aggiungi un'interpretazione, indica che è tua e a quale versetto si riferisce. Nella tabella spiega perché confronti i passi e leggi anche i versetti vicini. Se usi un commentario, annota titolo e pagina o link.</p>
  <p>Scegli un'applicazione concreta e scrivi una preghiera tua. Spunta un'azione solo dopo averla svolta e aggiungi una nota con la data. Sul Mac usa File &gt; Duplica nota per il prossimo studio, cancellando le risposte vecchie. Su iPhone copia di nuovo lo schema. Trovi altri esempi nella <a href="/blog/apple-notes-templates">guida ai modelli</a> (in inglese).</p>
  <h2 id="limiti">I limiti</h2><p>La nota non cerca i versetti né verifica le citazioni. Controlla ogni riferimento nella Bibbia che usi e lascia aperte le domande che richiedono più contesto.</p>
  <h2 id="pinto">Trova domande precedenti con ChatGPT o Claude</h2><p>Puoi usare lo schema in Pinto Notes, con intestazioni, elenchi e tabelle. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese) e scelto Allow, l'AI può leggere e modificare le note.</p>
  <Keep title="Chiedi all'AI di cercare domande precedenti" text={PROMPT} copyLabel={ui.copy} note="Usa questo testo dopo aver collegato Pinto Notes. Cambia titolo e argomento; servono studi precedenti per trovare risultati." /><p>Verifica ogni domanda nella nota di origine, compresi data e testo. Dopo averne scelta una, controlla che la modifica conservi citazione e risposte personali. Leggi tu il passo prima di accettare un'interpretazione.</p><p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Gli originali non cambiano.</p>
  </LocalPostPage>; }
