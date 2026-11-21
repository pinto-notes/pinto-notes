import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "incollare-senza-formattazione-note-mac");

// Italian version of /blog/apple-notes-paste-without-formatting, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "incolla senza formattazione mac" returned that
// phrase, "copia incolla senza formattazione mac" and a shortcut variant;
// "incollare senza formattazione iphone" returned none. Exact Notes seed returned none.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/not9474646a9/26/mac/26
// (Modifica > Incolla e adegua lo stile; Incolla con stile originale), it-it/102553
// (Opzione-Maiuscole-Comando-V), it-it/guide/notes/apd46c25187e/mac
// (Maiuscole-Comando-B applies formato corpo), it-it/guide/iphone/iph1a9cae52c/ios
// (text selection/paste), iph1ac0b3a2/ios (formatting controls). No iPhone equivalent
// is documented by these pages; no invented command. No picture in the English post.

const ui = UI.it;

const FAQ = [
  { q: "Quale scorciatoia incolla adattando lo stile in Note sul Mac?", a: ["Opzione-Maiuscole-Comando-V. Oppure scegli Modifica > Incolla e adegua lo stile. Il testo prende lo stile circostante. Se la scorciatoia cambia con la tastiera, controlla il menu Modifica."] },
  { q: "Apple documenta lo stesso comando per Note su iPhone?", a: ["Le guide iPhone consultate descrivono l'incolla normale e i controlli di formattazione, ma non un comando equivalente per adeguare lo stile o incollare sempre come testo normale."] },
  { q: "Perché il testo resta un'intestazione dopo aver adeguato lo stile?", a: ["Il comando usa lo stile del punto in cui incolli. Se è un'intestazione, il testo può restare un'intestazione. Sul Mac applica il formato corpo con Maiuscole-Comando-B prima di incollare di nuovo."] },
  { q: "Come tolgo lo stile da un testo già incollato?", a: ["Copia soltanto il passaggio interessato e tienilo selezionato nella nota. Se vuoi un paragrafo normale, applica il formato corpo con Maiuscole-Comando-B, poi scegli Modifica > Incolla e adegua lo stile."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="incollare-senza-formattazione-note-mac"
    intro={<>Per incollare in Note sul Mac senza mantenere la formattazione originale, scegli Modifica &gt; Incolla e adegua lo stile o premi Opzione-Maiuscole-Comando-V. Le guide Apple per iPhone non indicano un comando equivalente.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Scorciatoia Mac" }, { href: "#gia-incollato", label: "Correggi il testo" },
      { href: "#iphone", label: "Su iPhone" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Pinto Notes" },
    ]}><p>Sul Mac Incolla e adegua lo stile usa la formattazione intorno al cursore. Premi Opzione-Maiuscole-Comando-V al posto di Comando-V. Su iPhone Apple descrive l'incolla normale e i controlli per modificare il testo dopo.</p>
      <PostCta slug="it/incollare-senza-formattazione-note-mac" path="/it/blog/incollare-senza-formattazione-note-mac" position="answer" ui={ui.cta} title="Prova le note in Markdown">
        <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, con Markdown sotto il testo formattato. Sul Mac converte il testo ricco supportato in Markdown e, se non ci riesce, incolla testo normale.</p>
      </PostCta></Answer>} hero={<></>} faq={FAQ}>
    <h2 id="mac">Incolla senza lo stile originale sul Mac</h2>
    <Steps><li>Seleziona il testo nella pagina o nel documento di origine e premi Comando-C.</li><li>Apri la nota e fai clic nel punto in cui vuoi incollare.</li><li>Scegli Modifica &gt; Incolla e adegua lo stile oppure premi Opzione-Maiuscole-Comando-V.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla e adegua lo stile"], keys: "⌥⇧⌘V" }]} />
    <p>La <a href="https://support.apple.com/it-it/guide/notes/not9474646a9/26/mac/26">guida di Note per macOS 26</a> documenta il menu. L'<a href="https://support.apple.com/it-it/102553">articolo Apple su copia e incolla</a> dà la scorciatoia. Controlla il menu Modifica se la tua tastiera usa una combinazione diversa.</p>
    <p>Per esempio, puoi copiare un paragrafo di una ricetta nei tuoi appunti di cucina. Il testo assume lo stile della nota anziché quello della pagina. Se invece vuoi mantenere lo stile di origine, Apple indica Modifica &gt; Incolla con stile originale.</p>
    <h2 id="gia-incollato">Correggi un testo già incollato</h2>
    <p>Seleziona solo il passaggio interessato, così il resto della nota resta intatto.</p>
    <Steps><li>Seleziona il testo e premi Comando-C per copiarlo.</li><li>Lascialo selezionato. Se vuoi testo normale, premi Maiuscole-Comando-B per applicare il formato corpo.</li><li>Scegli Modifica &gt; Incolla e adegua lo stile per sostituire la selezione.</li></Steps>
    <p>Apple elenca Maiuscole-Comando-B nelle <a href="https://support.apple.com/it-it/guide/notes/apd46c25187e/mac">abbreviazioni di Note</a>. Per cambiare carattere o dimensione, vedi la <a href="/it/blog/cambiare-font-note-iphone">guida al testo in Note</a>.</p>
    <h2 id="iphone">Cosa documenta Apple per iPhone</h2>
    <p>La <a href="https://support.apple.com/it-it/guide/iphone/iph1a9cae52c/ios">guida Apple alla modifica del testo</a> spiega selezione, copia e incolla. Non descrive Incolla e adegua lo stile. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida alla formattazione di Note</a> mostra come cambiare il testo dopo l'incolla.</p>
    <Steps><li>Tocca la nota per posizionare il cursore. Apple documenta anche il gesto di allargare tre dita per incollare.</li><li>Per selezionare il testo incollato, tocca due volte una parola e trascina i punti di selezione.</li><li>Usa il controllo di formattazione per cambiare grassetto, corsivo o altri stili indesiderati.</li></Steps>
    <p>Questi controlli modificano il testo selezionato. Le pagine Apple consultate non li descrivono come un unico comando che elimina tutti gli stili di origine. Se ti serve incollare adeguando lo stile, usa il comando sul Mac.</p>
    <h2 id="limiti">I limiti dell'adeguamento dello stile</h2>
    <p>Il comando usa lo stile del punto di destinazione. Se il cursore è in un'intestazione, anche il testo incollato può apparire come intestazione. Sul Mac applica prima il formato corpo con Maiuscole-Comando-B se vuoi un paragrafo normale.</p>
    <p>Controlla il risultato prima di sostituire un passaggio lungo. Valuta se vuoi conservare link o struttura degli elenchi oltre alle parole. Per un testo con stile separato, vedi <a href="/it/blog/blocco-codice-note-iphone">Monostile in Note</a>.</p>
    <p>Se un comando Incolla non è disponibile, Apple dice che l'app non può usarlo con l'elemento o nel punto attuale. Fai clic nel testo della nota e copia una selezione di testo prima di riprovare.</p>
    <h2 id="pinto-notes">Come Pinto Notes incolla il testo</h2>
    <p>Pinto Notes conserva il testo della nota come Markdown e lo mostra formattato. Sul Mac il suo editor gestisce prima file e immagini, poi prova a convertire il testo ricco in Markdown. Se non ottiene Markdown, incolla testo normale.</p>
    <p>Il testo ricco può mantenere la struttura tramite Markdown, quindi controlla cosa arriva nella nota. Questo è il comportamento dell'editor sul Mac. Se il solo problema è lo stile copiato, prova prima il comando di Note di Apple.</p>
    <p>Se vuoi anche far leggere e modificare le note a ChatGPT o Claude, Pinto lo permette <a href="/blog/connect-chatgpt-to-your-notes">dopo il collegamento</a> (guida in inglese). Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese); le originali non cambiano.</p>
  </LocalPostPage>;
}
