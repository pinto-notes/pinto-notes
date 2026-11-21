import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "trovare-sostituire-testo-note-iphone");

// Italian version of /blog/apple-notes-find-and-replace, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "trova e sostituisci note iphone" and
// "cerca e sostituisci note mac" returned no suggestions. "trova e sostituisci"
// is the common Italian command phrase; the title pairs it with the app and devices.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/search-your-notes-not18ab658ed/mac
// (Comando-F within a note), it-it/guide/iphone/iphb8628c6b8/ios (Trova nella nota,
// the preceding icon has no text name), iph1a9cae52c/ios (select and edit text),
// it-it/guide/textedit/find-and-replace-text-txtef6cfde1a/mac (Modifica > Trova > Trova,
// Sostituisci, Tutti, Fine), it-it/guide/notes/not9474646a9/mac (copy a note).
// The Notes guides give no replacement menu names; none are invented. No picture in the English post.

const ui = UI.it;

const RENAME = `Nella cartella Lancio di Pinto Notes, trova le note che contengono "Prova Porto".
Leggi ogni nota trovata e mostrami i passaggi che cambieresti in "Anteprima Porto".
Lascia inalterate le citazioni di vecchie riunioni e gli indirizzi web. Non modificare ancora nulla.
Dopo la mia approvazione, aggiorna le note e indicami quali hai cambiato.`;

const FAQ = [
  { q: "Cosa documenta Apple su trova e sostituisci in Note?", a: ["Le guide attuali spiegano Comando-F in una nota sul Mac e Trova nella nota su iPhone. Non descrivono i comandi di sostituzione. Questo non prova che la funzione manchi."] },
  { q: "Come cerco dentro una sola nota sul Mac?", a: ["Apri la nota, premi Comando-F e digita il testo. Apple distingue questa ricerca da quella tra tutte le note dell'account."] },
  { q: "Dove si trova Trova nella nota su iPhone?", a: ["Apri una nota, tocca il pulsante delle azioni della nota e scegli Trova nella nota. Inserisci il testo nel campo di ricerca."] },
  { q: "Un'AI collegata può cambiare una frase in più note di Pinto?", a: ["Sì. ChatGPT o Claude può cercare e leggere le note, poi modificarle una alla volta. Lo strumento di modifica sostituisce il testo esatto in una nota per chiamata."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="trovare-sostituire-testo-note-iphone"
    intro={<>Per trovare testo in una nota di Apple sul Mac premi Comando-F. Su iPhone apri le azioni della nota e scegli Trova nella nota. Le guide Apple spiegano la ricerca, ma non i comandi di sostituzione.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Cerca sul Mac" }, { href: "#iphone", label: "Cerca su iPhone" },
      { href: "#sostituire", label: "Sostituzione in TextEdit" }, { href: "#limiti", label: "Più note" },
      { href: "#pinto-notes", label: "Rinomina con l'AI" },
    ]}><p>Su Mac usa Comando-F nella nota; su iPhone scegli Trova nella nota. Puoi correggere a mano le parole trovate. Per sostituire molte occorrenze con comandi documentati da Apple, lavora su una copia del testo in TextEdit sul Mac.</p>
      <PostCta slug="it/trovare-sostituire-testo-note-iphone" path="/it/blog/trovare-sostituire-testo-note-iphone" position="answer" ui={ui.cta} title="Cambia una frase in più note">
        <p>In Pinto Notes, ChatGPT o Claude collegato può trovare una frase e modificare ogni nota pertinente. Le versioni precedenti restano disponibili.</p>
      </PostCta></Answer>} hero={<></>} faq={FAQ}>
    <h2 id="mac">Trova testo dentro una nota sul Mac</h2>
    <Steps><li>Apri la nota da controllare.</li><li>Premi Comando-F per aprire la ricerca nella nota.</li><li>Digita la parola o la frase.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Apri una nota", "Cerca nella nota"], keys: "⌘F" }]} />
    <p>Questo percorso è nella <a href="https://support.apple.com/it-it/guide/notes/search-your-notes-not18ab658ed/mac">guida Apple alla ricerca sul Mac</a>. Cercare nella nota è diverso dal cercare tutte le note. Usa la frase esatta che vuoi modificare, per esempio «Prova Porto» invece di «Porto».</p>
    <p>La guida non indica i controlli o la scorciatoia per sostituire. Questo non dimostra che Note ne sia priva: significa che non possiamo verificarli da quella pagina. Per poche correzioni, modifica a mano. Per molte occorrenze puoi lavorare su una copia in TextEdit.</p>
    <h2 id="iphone">Trova testo in Note su iPhone</h2>
    <Steps><li>Apri la nota e tocca il pulsante delle azioni della nota.</li><li>Scegli Trova nella nota.</li><li>Digita la frase. Il pulsante delle opzioni di ricerca apre altre opzioni.</li></Steps>
    <Paths rows={[{ on: "iPhone", steps: ["Apri le azioni della nota", "Trova nella nota"] }]} />
    <p>Apple descrive questi passaggi nella <a href="https://support.apple.com/it-it/guide/iphone/iphb8628c6b8/ios">guida alla ricerca su iPhone</a>, senza indicare una sequenza per sostituire il testo.</p>
    <p>Per correggere una frase, torna alla modifica della nota. Tocca due volte una parola, estendi la selezione con le maniglie e scrivi il nuovo testo. Apple spiega la selezione nella <a href="https://support.apple.com/it-it/guide/iphone/iph1a9cae52c/ios">guida alla modifica del testo</a>. Controlla la frase intorno a ogni occorrenza.</p>
    <h2 id="sostituire">Sostituire molte occorrenze sul Mac con TextEdit</h2>
    <p>Per un lungo passaggio di testo normale puoi fare la sostituzione in TextEdit e riportare il risultato nella nota. Conserva l'originale finché non hai controllato il testo. Questo metodo non trasferisce allegati né conserva una struttura complessa.</p>
    <Steps>
      <li>Copia il passaggio da Note in un documento TextEdit.</li>
      <li>In TextEdit scegli Modifica &gt; Trova &gt; Trova e digita la vecchia frase.</li>
      <li>Seleziona il riquadro Sostituisci accanto a Fine. Digita la nuova frase nel campo Sostituisci.</li>
      <li>Fai clic su Sostituisci per un'occorrenza o su Tutti per tutte quelle del documento.</li>
      <li>Fai clic su Fine, rileggi il risultato e copialo nel punto giusto della nota.</li>
    </Steps>
    <Paths rows={[{ on: "TextEdit sul Mac", steps: ["Modifica", "Trova", "Trova", "Riquadro Sostituisci"] }]} />
    <p>I nomi vengono dalla <a href="https://support.apple.com/it-it/guide/textedit/find-and-replace-text-txtef6cfde1a/mac">guida Apple a TextEdit</a>. Il pulsante si chiama Tutti. Questi sono controlli di TextEdit, non nomi di menu di Note.</p>
    <h2 id="limiti">Cambiare più note</h2>
    <p>Trovare ogni nota con un nome e cambiarlo sono lavori distinti. Le guide di Note consultate non documentano un unico comando di sostituzione tra note. Cerca la vecchia frase, apri le note pertinenti e controlla il contesto prima di modificarle.</p>
    <p>Un nuovo nome può servire nel piano attuale, ma una citazione di una vecchia riunione deve conservare quello originale. Segna le note da cambiare. Se la ricerca non trova una nota esistente, segui prima i <a href="/it/blog/ricerca-note-iphone-non-funziona">controlli per la ricerca</a>.</p>
    <h2 id="pinto-notes">Rinomina una frase con un'AI collegata</h2>
    <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (guida in inglese), può cercare, leggere e modificare le note. Prima chiedi di mostrarti le modifiche proposte.</p>
    <Keep title="Richiesta di modifica per l'AI collegata" text={RENAME} copyLabel={ui.copy}
      note="Sostituisci cartella e frasi con le tue. È un metodo suggerito, non una regola automatica." />
    <p>Lo strumento di Pinto sostituisce testo esatto in una nota indicata e può cambiare tutte le occorrenze dentro quella nota. Prima di modificare deve leggere la versione attuale. Per cambiare più note servono più modifiche.</p>
    <p>Dopo aver esaminato i passaggi proposti, indica quali applicare. Leggi le note risultanti e controlla le eccezioni. Pinto conserva le versioni precedenti, come spiega la <a href="/blog/apple-notes-version-history">guida alla cronologia</a> (in inglese).</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
