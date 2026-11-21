import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "note-iphone-su-windows");
// Italian version of /blog/apple-notes-on-windows. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "note iphone su windows" returned that phrase, "note iphone su pc windows"
// and "sincronizzare note iphone su windows".
// Apple it-it read 21 Nov: 105119 (browser), icloud/mm8685520792/icloud (sync),
// mm6704cac5/icloud (iCloud notes only), mmc0cd6edf/icloud (create), mmcd9c9e9b71/icloud
// (lists), mm198698c442/icloud (attachments), mm000b55f946/icloud (locked notes),
// mmc8a8e49dbd/icloud (web access), mm6be2394337/icloud (Windows features).
// iCloud.com uses icon-only controls in Apple's Italian guide. The steps describe their position.
const ui = UI.it;
const FAQ = [
  { q: "Come apro Note di iPhone su Windows 11?", a: ["Vai su icloud.com/notes nel browser e accedi con il tuo Apple Account. Apple consiglia le versioni recenti di Firefox, Chrome, Edge o Opera. Vedrai solo le note archiviate in iCloud."] },
  { q: "Serve iCloud per Windows?", a: ["No. Per Note Apple indica iCloud.com nel browser. L'app iCloud per Windows gestisce altri dati, ma Apple non elenca Note tra le sue funzioni."] },
  { q: "Posso aggiungere allegati da Windows?", a: ["Apple indica di aggiungerli in Note su iPhone o Mac. Su iCloud.com puoi visualizzare o scaricare gli allegati già presenti nelle note iCloud."] },
  { q: "Perché una nota protetta non si apre su Windows?", a: ["Su iCloud.com si apre una nota protetta con una password specifica di Note. Se l'hai protetta con il codice del dispositivo o la password di accesso al Mac, Apple dice che non puoi aprirla sul sito. Su iPhone e Mac le note possono essere protette con password, Face ID o Touch ID."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="note-iphone-su-windows"
  intro={<>Per aprire le note di iPhone su Windows, vai su icloud.com/notes e accedi con il tuo Apple Account. Le note devono trovarsi in iCloud.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#aprire", label: "Aprire le note" }, { href: "#mancano", label: "Note mancanti" },
    { href: "#scrivere", label: "Scrivere" }, { href: "#limiti", label: "Limiti" },
  ]}><p>Su Windows, anche Windows 11, usa <a href="https://www.icloud.com/notes">Note su iCloud.com</a>. Puoi leggere e modificare le note iCloud. Le modifiche arrivano sui dispositivi Apple con la sincronizzazione attiva. Non devi installare un'app.</p>
    <PostCta slug="it/note-iphone-su-windows" path="/it/blog/note-iphone-su-windows" position="answer" ui={ui.cta} title="Prendi appunti anche su Mac o iPhone?"><p>Pinto Notes funziona su Mac e iPhone e permette di collegare ChatGPT o Claude agli appunti. Non ha un'app Windows o una versione web.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="aprire">Aprire Note sul PC Windows</h2>
  <Steps><li>Apri <a href="https://www.icloud.com/notes">icloud.com/notes</a> nel browser.</li><li>Accedi con l'Apple Account usato per le note iCloud.</li><li>Seleziona una cartella e poi la nota da leggere o modificare.</li></Steps>
  <p>Apple elenca Note tra le <a href="https://support.apple.com/it-it/105119">funzioni disponibili su iCloud.com per Windows</a> e consiglia versioni recenti di Firefox, Chrome, Edge o Opera.</p>
  <h2 id="mancano">Se non trovi le note di iPhone</h2>
  <p>iCloud.com mostra le note salvate in iCloud, non quelle di Google, Yahoo o altri account. Su iPhone o Mac cerca la nota sotto l'intestazione iCloud. La guida su <a href="/it/blog/dove-sono-salvate-note-iphone">dove sono salvate le note</a> distingue gli account.</p>
  <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Vedi tutto o Mostra tutto", "Note", "Sincronizza questo iPhone"] }, { on: "Mac con macOS 15 o successivo", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note", "Sincronizza questo Mac"] }]} />
  <p>Attiva la sincronizzazione e usa lo stesso Apple Account sul dispositivo e nel browser. La <a href="https://support.apple.com/it-it/guide/icloud/mm8685520792/icloud">guida Apple per Note e iCloud</a> mostra il percorso completo. Se l'accesso ai dati su iCloud.com è disattivato, controlla le impostazioni di accesso web. Con la Protezione avanzata dei dati serve anche l'approvazione temporanea da un dispositivo autorizzato. Apple descrive i passaggi nella <a href="https://support.apple.com/it-it/guide/icloud/mmc8a8e49dbd/icloud">guida all'accesso web</a>.</p>
  <h2 id="scrivere">Scrivere e modificare nel browser</h2>
  <Steps><li>Per una nuova nota, seleziona il pulsante nell'angolo in alto a destra della barra di Note.</li><li>Scrivi. iCloud.com salva automaticamente le modifiche.</li><li>Per formattare, seleziona il testo e usa il pulsante di formattazione nella barra degli strumenti.</li></Steps>
  <p>Puoi aggiungere un elenco di controllo da una riga vuota o convertire righe già scritte. Tocca il cerchio accanto a un elemento per spuntarlo. Apple spiega <a href="https://support.apple.com/it-it/guide/icloud/mmc0cd6edf/icloud">come creare note</a> e <a href="https://support.apple.com/it-it/guide/icloud/mmcd9c9e9b71/icloud">come modificare elenchi</a>.</p>
  <h2 id="limiti">Cosa cambia nel browser</h2>
  <h3>Allegati e scansioni</h3>
  <p>Aggiungi gli allegati nell'app Note su iPhone o Mac. Su Windows puoi visualizzarli e scaricarli. Apri un allegato con doppio clic; per una scansione, apri la miniatura e poi scarica il documento. Sono i passaggi della <a href="https://support.apple.com/it-it/guide/icloud/mm198698c442/icloud">guida Apple agli allegati</a>.</p>
  <h3>Note protette</h3>
  <p>Su un dispositivo Apple puoi proteggere le note con password, Face ID o Touch ID. Sul sito si aprono quelle protette con una password specifica di Note. Le note protette con il codice del dispositivo o la password di accesso del Mac non si aprono su iCloud.com. Gli allegati di una nota protetta appaiono come segnaposto. Per cambiare il blocco usa l'app Note su un dispositivo Apple. Vedi la <a href="https://support.apple.com/it-it/guide/icloud/mm000b55f946/icloud">guida alle note protette</a>.</p>
  <h2 id="download">Esiste Note per Windows da scaricare?</h2>
  <p>Apple documenta l'uso nel browser. La <a href="https://support.apple.com/it-it/guide/icloud/mm6be2394337/icloud">guida a iCloud per Windows</a> elenca foto, file e altre funzioni, ma non Note. Se ti serve un'app Windows, leggi le <a href="/it/blog/alternative-note-apple">alternative a Note di Apple</a>.</p>
  <h2 id="pinto">Se usi anche un Mac o un iPhone</h2>
  <p>Pinto Notes è per iPhone e Mac. Conserva gli appunti come file Markdown e tutte le versioni precedenti. Dopo il collegamento, ChatGPT o Claude possono leggerli e modificarli.</p>
  <Figure shot={SHOTS.welcome} caption="La nota di benvenuto in Pinto Notes sul Mac. La schermata è in inglese." />
  <p>Puoi <a href="/blog/move-from-apple-notes">importare le note di Apple</a> sul Mac senza modificarle. La guida al <a href="/blog/connect-chatgpt-to-your-notes">collegamento di ChatGPT e Claude</a> è in inglese.</p>
  </LocalPostPage>; }
