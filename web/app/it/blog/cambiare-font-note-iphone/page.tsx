import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "cambiare-font-note-iphone");
// Italian version of /blog/apple-notes-font. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "cambiare font note iphone" returned the exact phrase.
// Apple it-it read 21 Nov: notes/apd1955d3b21/mac (Font > Mostra font),
// mac-help/mchlp2544/mac (Colore testo), notes/apd97da26aed/mac (Note > Impostazioni,
// Le nuove note iniziano con, Dimensioni di default del testo), notes/apd8b73d28be/mac (Vista, zoom),
// iphone/iph1ac0b3a2/ios (Intestazione, Sottointestazione), iphone/iph3c076905a/ios
// (Schermo e dimensioni testo, Testo più grande), iphone/iph1f48544ab/ios (impostazioni per app).
// Apple's iPhone guide does not document a typeface picker; none is claimed.
const ui = UI.it;
const FAQ = [
  { q: "Come ingrandisco il testo di Note su iPhone?", a: ["Vai in Impostazioni > Accessibilità > Schermo e dimensioni testo > Testo più grande. Sposta il cursore; attiva Dimensioni maggiori se ti servono misure più grandi."] },
  { q: "Posso scegliere un altro font in Note sul Mac?", a: ["Sì. Seleziona il testo, fai clic tenendo premuto Ctrl e scegli Font > Mostra font. Scegli il carattere nella finestra Font. La dimensione di default è un'impostazione separata."] },
  { q: "Come cambio il colore del testo?", a: ["Sul Mac seleziona il testo e apri Font > Mostra font. Usa il controllo Colore testo. Su iPhone la guida Apple descrive l'evidenziazione, ma non lo stesso selettore di colore del carattere."] },
  { q: "Perché una nuova nota parte con testo grande?", a: ["Sul Mac controlla Note > Impostazioni > Le nuove note iniziano con. Questa voce sceglie lo stile del primo paragrafo. Dimensioni di default del testo regola invece la visualizzazione."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="cambiare-font-note-iphone"
  intro={<>Sul Mac puoi scegliere un font per il testo selezionato. Su iPhone puoi applicare stili e ingrandire il testo nelle impostazioni di accessibilità.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#font", label: "Font sul Mac" }, { href: "#mac", label: "Dimensione sul Mac" },
    { href: "#iphone", label: "Dimensione su iPhone" }, { href: "#colore", label: "Colore" },
  ]}><p>Su Mac seleziona il testo e scegli Font &gt; Mostra font dal menu che appare con Ctrl e clic. Per ingrandire tutte le note usa Note &gt; Impostazioni &gt; Dimensioni di default del testo. Su iPhone usa Impostazioni &gt; Accessibilità &gt; Schermo e dimensioni testo &gt; Testo più grande.</p>
    <PostCta slug="it/cambiare-font-note-iphone" path="/it/blog/cambiare-font-note-iphone" position="answer" ui={ui.cta} title="Vuoi lavorare sugli appunti con ChatGPT?"><p>Pinto Notes funziona su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude possono leggere e modificare le note. Le versioni precedenti restano disponibili.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="font">Cambiare font in Note sul Mac</h2>
  <Paths rows={[{ on: "Testo selezionato", steps: ["Ctrl e clic", "Font", "Mostra font"] }]} />
  <Steps><li>Apri una nota e seleziona il testo da cambiare.</li><li>Fai clic sulla selezione tenendo premuto Ctrl, poi scegli Font &gt; Mostra font.</li><li>Scegli carattere e dimensione nella finestra Font.</li></Steps>
  <p>La modifica riguarda il testo selezionato. Apple descrive il percorso nella <a href="https://support.apple.com/it-it/guide/notes/apd1955d3b21/mac">guida alla formattazione sul Mac</a>. Per intestazioni, grassetto o corsivo usa il pulsante di formattazione della nota.</p>
  <h2 id="mac">Ingrandire tutte le note sul Mac</h2>
  <Paths rows={[{ on: "Tutte le note", steps: ["Note", "Impostazioni", "Dimensioni di default del testo"] }, { on: "Una nota", steps: ["Vista", "Ingrandisci"] }]} />
  <p>In Note &gt; Impostazioni sposta il cursore Dimensioni di default del testo. Apple dice che cambia la visualizzazione del testo in tutte le note. Per una sola nota usa i comandi di zoom nel menu Vista. La <a href="https://support.apple.com/it-it/guide/notes/apd8b73d28be/mac">guida alla visualizzazione</a> spiega entrambi i casi.</p>
  <p>Le nuove note iniziano con, nella stessa finestra, sceglie lo stile del primo paragrafo. È distinto dalla dimensione di default. Vedi le <a href="https://support.apple.com/it-it/guide/notes/apd97da26aed/mac">impostazioni di Note</a>.</p>
  <h2 id="iphone">Ingrandire il testo su iPhone</h2>
  <Paths rows={[{ on: "Testo più grande", steps: ["Impostazioni", "Accessibilità", "Schermo e dimensioni testo", "Testo più grande"] }]} />
  <Steps><li>Apri Impostazioni &gt; Accessibilità &gt; Schermo e dimensioni testo.</li><li>Tocca Testo più grande e sposta il cursore.</li><li>Se serve, attiva Dimensioni maggiori.</li></Steps>
  <p>La dimensione scelta vale per le app supportate, tra cui Note. Nella stessa sezione puoi attivare Testo in grassetto. Apple spiega queste opzioni nella <a href="https://support.apple.com/it-it/guide/iphone/iph3c076905a/ios">guida alla leggibilità</a>. Per regolare solo Note, vai in Impostazioni &gt; Accessibilità &gt; Impostazioni per app, tocca Aggiungi app e scegli Note. Tocca Note per aprire le sue opzioni. Apple descrive il percorso nella <a href="https://support.apple.com/it-it/guide/iphone/iph1f48544ab/ios">guida alle impostazioni per app</a>.</p>
  <h2 id="stili">Intestazioni e stili su iPhone</h2>
  <p>Dentro una nota tocca il pulsante di formattazione per Intestazione, grassetto, corsivo ed evidenziazione. Per una sezione seleziona il testo e scegli Intestazione o Sottointestazione. Sono i passaggi della <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida a Note su iPhone</a>. Puoi usare le intestazioni anche nei <a href="/it/blog/ricette-note-iphone">modelli di ricette</a>.</p>
  <h2 id="colore">Colore del font ed evidenziazione</h2>
  <p>Sul Mac seleziona il testo, apri Font &gt; Mostra font e scegli il colore dal controllo Colore testo. Apple descrive la finestra nella <a href="https://support.apple.com/it-it/guide/mac-help/mchlp2544/mac">guida ai font</a>. Per evidenziare, seleziona il testo e usa il pulsante di evidenziazione; il cerchio colorato accanto cambia colore.</p>
  <p>Su iPhone la guida Apple elenca l'evidenziazione tra gli stili. Non descrive un selettore del font come quello del Mac. Sul Mac alcune funzioni dipendono dall'account: gli stili di paragrafo richiedono note iCloud o salvate sul Mac.</p>
  <h2 id="pinto">Se vuoi collegare ChatGPT agli appunti</h2>
  <p>Pinto Notes è per iPhone e Mac. Salva le note in Markdown, conserva le versioni precedenti e permette a <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT o Claude</a> di leggere e modificare gli appunti dopo il collegamento. Puoi <a href="/blog/move-from-apple-notes">importare Note di Apple</a> sul Mac senza cambiarle.</p>
  </LocalPostPage>; }
