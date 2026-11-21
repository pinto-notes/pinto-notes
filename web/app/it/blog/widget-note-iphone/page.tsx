import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "widget-note-iphone");
// Italian version of /blog/apple-notes-widget. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "widget note iphone", "widget note per iphone" and "note widget iphone lock screen".
// Apple it-it read 21 Nov: 118610 and iphone/iphb8f1bf206/ios (pulsante in alto, Aggiungi widget,
// Modifica widget, vista Oggi), iphone/iph4d0e6c351/ios (schermata di blocco),
// iphone/iph92579feda/ios (Accesso dalla schermata di blocco, Account di default),
// notes/apdc28344070/mac (widget Nota, Cartella), mac-help/mchl52be5da5/mac (Modifica widget).
// The iOS 27 add-widget control is icon-only; described by its position. Apple does not
// verify a dedicated Notes widget under the Lock Screen clock.
const ui = UI.it;
const FAQ = [
  { q: "Come aggiungo il widget Note su iPhone?", a: ["Tieni premuta la schermata Home, tocca il pulsante in alto e poi Aggiungi widget. Cerca Note, scegli un formato, tocca Aggiungi widget e poi Fine."] },
  { q: "Posso mettere Note sulla schermata di blocco?", a: ["Controlla i widget disponibili nella galleria della schermata di blocco. Le guide Apple qui citate non confermano un widget Note sotto l'orologio. In Impostazioni > App > Note, Accesso dalla schermata di blocco è un'opzione diversa."] },
  { q: "In quale account finiscono le note create dal widget?", a: ["Nell'Account di default impostato in Impostazioni > App > Note. Apple dice che vale per le note create con Siri e con il widget Note."] },
  { q: "Posso mettere più widget Note sul Mac?", a: ["Sì. Apple indica che puoi aggiungerne più di uno per aprire note o cartelle diverse, sulla scrivania o in Centro Notifiche."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="widget-note-iphone"
  intro={<>Su iPhone tieni premuta la schermata Home, tocca il pulsante in alto, poi Aggiungi widget e cerca Note. Sul Mac fai clic sulla scrivania tenendo premuto Ctrl e scegli Modifica widget.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#iphone", label: "Su iPhone" }, { href: "#blocco", label: "Schermata di blocco" },
    { href: "#mac", label: "Sul Mac" }, { href: "#problemi", label: "Se non funziona" },
  ]}><p>Aggiungi Note dalla galleria dei widget della schermata Home. Sul Mac puoi mostrare una nota o una cartella sulla scrivania o in Centro Notifiche. Per la schermata di blocco, controlla la galleria disponibile sul tuo iPhone.</p>
    <PostCta slug="it/widget-note-iphone" path="/it/blog/widget-note-iphone" position="answer" ui={ui.cta} title="Vuoi far modificare gli appunti a ChatGPT?"><p>Pinto Notes funziona su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude possono leggere e modificare le note. Ogni versione precedente resta disponibile.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="iphone">Aggiungere il widget Note su iPhone</h2>
  <Paths rows={[{ on: "Schermata Home", steps: ["Tieni premuto", "Pulsante in alto", "Aggiungi widget", "Note"] }]} />
  <Steps><li>Vai alla pagina della schermata Home dove vuoi il widget.</li><li>Tieni premuto uno spazio vuoto finché le app iniziano a muoversi. Tocca il pulsante in alto e poi Aggiungi widget.</li><li>Cerca Note. Scorri i formati disponibili.</li><li>Tocca Aggiungi widget, spostalo dove vuoi e tocca Fine.</li></Steps>
  <p>Per cambiare cosa mostra, tieni premuto il widget e tocca Modifica widget, se l'opzione è disponibile. La <a href="https://support.apple.com/it-it/guide/iphone/iphb8f1bf206/ios">guida Apple ai widget</a> descrive le opzioni della galleria.</p>
  <h2 id="blocco">Note e schermata di blocco</h2>
  <p>La galleria della schermata Home e quella della schermata di blocco hanno scelte diverse. Secondo la <a href="https://support.apple.com/it-it/118610">guida Apple</a>, tieni premuta la schermata di blocco, tocca Personalizza e poi Aggiungi widget. Scegli tra quelli disponibili. Se manca spazio, togli un widget già presente, poi tocca Fine.</p>
  <p>Queste istruzioni non confermano un widget Note sotto l'orologio. Apple documenta separatamente Accesso dalla schermata di blocco in Impostazioni &gt; App &gt; Note. Puoi scegliere Crea sempre una nuova nota, Torna all'ultima nota o disattivare l'accesso. Questa opzione non aggiunge un widget. Vedi le <a href="https://support.apple.com/it-it/guide/iphone/iph92579feda/ios">impostazioni di Note</a>.</p>
  <p>La vista Oggi si apre scorrendo verso destra dalla schermata di blocco. Se non la vedi mentre iPhone è bloccato, vai in Impostazioni &gt; Face ID e codice, oppure Touch ID e codice, e controlla Vista Oggi e ricerca sotto Consenti accesso se bloccato.</p>
  <h2 id="mac">Aggiungere un widget Note sul Mac</h2>
  <p>La <a href="https://support.apple.com/it-it/guide/notes/apdc28344070/mac">guida di Note per Mac</a> descrive widget per una nota o una cartella. Puoi aggiungerne più di uno sulla scrivania o in Centro Notifiche.</p>
  <Steps><li>Fai clic sullo sfondo della scrivania tenendo premuto Ctrl, poi scegli Modifica widget.</li><li>Cerca Note nella galleria e scegli un widget.</li><li>Fai clic per inserirlo automaticamente o trascinalo sulla scrivania.</li><li>Fai clic su Fine.</li></Steps>
  <p>Per Centro Notifiche fai clic su data e ora nella barra dei menu, poi su Modifica widget. Puoi cambiare dimensione o modificare il widget dal suo menu, quando l'opzione compare. La <a href="https://support.apple.com/it-it/guide/mac-help/mchl52be5da5/mac">guida ai widget sul Mac</a> mostra i controlli.</p>
  <h2 id="problemi">Se il widget mostra la nota sbagliata</h2>
  <p>Controlla l'impostazione legata al problema. Le guide Apple descrivono questi controlli, senza promettere che risolvano ogni widget vuoto o non aggiornato.</p>
  <ul><li>Contenuto sbagliato: tieni premuto il widget su iPhone e prova Modifica widget. Sul Mac usa la voce di modifica, se presente.</li><li>Note assenti dai suggerimenti: su iPhone controlla Impostazioni &gt; App &gt; Note &gt; Cerca.</li><li>Nuova nota nell'account sbagliato: controlla Account di default in Impostazioni &gt; App &gt; Note.</li><li>Widget nascosti sul Mac: apri Impostazioni di Sistema &gt; Scrivania e Dock e controlla le opzioni dei widget sulla scrivania.</li></ul>
  <p>Se manca anche la nota nell'app, segui la guida alla <a href="/it/blog/ricerca-note-iphone-non-funziona">ricerca in Note</a>. Altri modi per raggiungere una nota sono nei <a href="/it/blog/trucchi-note-iphone">trucchi per Note su iPhone</a>.</p>
  <h2 id="pinto">Modificare gli appunti con ChatGPT o Claude</h2>
  <p>Un widget apre in fretta una nota. Pinto Notes permette anche di <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT o Claude</a> perché possano leggerla e modificarla. Funziona su iPhone e Mac, conserva le versioni precedenti e <a href="/blog/move-from-apple-notes">importa Note di Apple</a> sul Mac senza cambiarle.</p>
  </LocalPostPage>; }
