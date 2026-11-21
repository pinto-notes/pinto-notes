import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "importare-evernote-in-note-apple");
// Italian version of /blog/evernote-to-apple-notes. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "evernote note apple importare" and "passare da evernote a note iphone" had no suggestions;
// title uses the user's direct task, importare Evernote in Note di Apple.
// Apple it-it pages read 21 Nov: 102223 and notes/not201900c07/mac. Verified words: File > Importa in Note,
// File > Importa Markdown, Importa, Note importate, Sul mio Mac, and tag from ENEX on macOS 13+.
// Evernote steps and limits are from the English post; its export menu has no verified Italian label,
// so the action is described without inventing one. Pictures follow English.
const ui = UI.it;
const FAQ = [
  { q: "Note di Apple importa i file Evernote?", a: ["Sì. Sul Mac importa i file ENEX con File > Importa in Note. Ogni nota Evernote diventa una nota nuova; da macOS 13 arrivano anche i tag."] },
  { q: "Come arrivano le note su iPhone?", a: ["Importa gli ENEX in una cartella dell'account iCloud sul Mac. Le note si sincronizzano con gli altri dispositivi dello stesso Apple Account. Apple non documenta l'importazione ENEX direttamente su iPhone."] },
  { q: "Posso esportare dal sito Evernote?", a: ["No. Evernote indica l'app desktop per Mac o Windows. Puoi esportare un intero taccuino o fino a 100 note selezionate alla volta, anche con un account gratuito."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="importare-evernote-in-note-apple"
  intro={<>Note sul Mac può leggere i file esportati da Evernote. Servono le due app e un controllo finale, soprattutto se i taccuini contengono allegati.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#serve", label: "Cosa serve" }, { href: "#esporta", label: "Esporta da Evernote" },
    { href: "#importa", label: "Importa in Note" }, { href: "#controlla", label: "Cosa arriva" },
    { href: "#scelta", label: "Conviene cambiare?" }, { href: "#pinto", label: "Un'altra strada" },
  ]}><p>Nell'app Evernote per Mac o Windows esporta ogni taccuino in formato ENEX. Poi sul Mac apri Note, scegli una cartella iCloud e usa File &gt; Importa in Note. Le note finiscono in Note importate. Dopo la sincronizzazione compaiono anche su iPhone.</p>
    <PostCta slug="it/importare-evernote-in-note-apple" path="/it/blog/importare-evernote-in-note-apple" position="answer" ui={ui.cta} title="Vuoi portare Evernote in un'app che ChatGPT può leggere?"><p>Pinto Notes importa gli stessi file ENEX sul Mac. Ogni taccuino diventa una cartella, con i suoi tag. Puoi poi collegare ChatGPT o Claude alle note.</p></PostCta>
  </Answer>}
  faq={FAQ}>
  <h2 id="serve">Cosa serve</h2>
  <p>Ti serve un Mac per l'importazione in Note e l'app desktop di Evernote su Mac o Windows per esportare. Se esporti su Windows, copia gli ENEX sul Mac. Scegli iCloud come destinazione se vuoi vedere le note su iPhone; Sul mio Mac le lascia su quel computer. Apple richiede note iCloud aggiornate o note archiviate sul Mac.</p>
  <h2 id="esporta">1. Esporta i taccuini da Evernote</h2>
  <Steps><li>Apri l'app desktop di Evernote e seleziona un taccuino. Se vuoi soltanto alcune note, selezionale: il limite per questa modalità è 100.</li><li>Dal menu contestuale avvia l'esportazione e scegli ENEX. Lascia selezionati i tag e gli altri attributi che vuoi conservare, come la data di creazione.</li><li>Salva il file e ripeti per ogni taccuino. Evernote permette di scegliere una dimensione massima per ciascun ENEX, da 300 MB a 2 GB.</li></Steps>
  <p>L'esportazione è disponibile anche per gli account Free, ma non sul sito Evernote. Non chiudere ancora l'account: prima verifica l'importazione.</p>
  <h2 id="importa">2. Importa gli ENEX in Note sul Mac</h2>
  <Paths rows={[{ on: "Note sul Mac", steps: ["File", "Importa in Note"] }]} />
  <Steps><li>Apri Note e seleziona una cartella sotto iCloud, oppure sotto Sul mio Mac se non vuoi sincronizzarla.</li><li>Scegli File &gt; Importa in Note. Seleziona un ENEX, fai clic su Importa e conferma di nuovo.</li><li>Apri Note importate, rinomina la cartella con il nome del taccuino e poi importa il successivo.</li></Steps>
  <p>Importare un taccuino alla volta mantiene chiara la provenienza. Apple permette anche di importare una cartella di file e conservarne la struttura, ma non chiarisce se più ENEX selezionati insieme diventano cartelle separate.</p>
  <h2 id="controlla">Cosa arriva e cosa controllare</h2>
  <p>Ogni nota dell'ENEX diventa una nota nuova. Da macOS 13 arrivano anche i tag di Evernote. Apple dice che allegati o funzioni non supportate possono essere omessi, senza elencare tutti i casi. Prova un taccuino piccolo; confronta una nota con elenco, una tabella e un allegato; conta le note; controlla i tag. Lascia Evernote intatto finché hai finito.</p>
  <p>In Note, un tag è una parola con # e le cartelle smart possono raccogliere le note che lo contengono. <a href="/blog/apple-notes-tags-smart-folders">La guida ai tag</a> è in inglese.</p>
  <h2 id="scelta">Evernote o Note di Apple?</h2>
  <PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785} alt="Evernote sul Mac con una nota e il pannello dell'assistente AI che sposta la nota in un altro taccuino." caption="L'assistente AI di Evernote sposta una nota. Immagine: Evernote, Mac App Store." />
  <p>Evernote ha app per Windows e Android, ritagli web, scansioni, ricerca avanzata e funzioni AI proprie, comprese ricerca semantica e trascrizione. Il piano Free consente 50 note, un taccuino e un dispositivo. Note di Apple è già su iPhone e Mac e sincronizza con iCloud. Ha ricerca e trascrizioni sui dispositivi compatibili, ma non ha un'app Windows o Android né una cronologia delle versioni. Se queste mancanze contano, resta su Evernote.</p>
  <h2 id="pinto">Un'altra strada: Pinto Notes</h2>
  <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu File di Pinto Notes sul Mac con Evernote tra le fonti di importazione." caption="Evernote è una delle importazioni di Pinto Notes sul Mac." />
  <p>In Pinto Notes sul Mac scegli Evernote dal menu File e trascina tutti gli ENEX. Ogni taccuino diventa una cartella; tag, allegati e date di creazione e modifica arrivano con le note. Evernote non cambia. Puoi collegare ChatGPT o Claude e tornare a una versione precedente dopo una modifica. Pinto Notes è per iPhone e Mac, senza app Windows, Android o web. <a href="/blog/import-your-notes">La guida alle importazioni</a> è in inglese.</p>
  <p>Altre guide: <a href="/blog/apple-notes-version-history">la cronologia delle versioni di Note</a> (in inglese), <a href="/blog/best-notes-app-for-mac">le app per appunti sul Mac</a> (in inglese), <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
