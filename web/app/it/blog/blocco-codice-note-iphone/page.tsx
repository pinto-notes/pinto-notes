import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "blocco-codice-note-iphone");
// Italian version of /blog/apple-notes-code-block. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "note iphone codice" returned "codice note iphone"; "blocchi di codice
// note iphone" and "codice nelle note iphone" returned no suggestions.
// Apple it-it/guide/notes/apd46c25187e/mac and apd1955d3b21/mac read 21 Nov 2026:
// Monostile, Maiuscole-Comando-M, formato corpo, Maiuscole-Comando-B, Blocco citazione,
// Comando-apostrofo. it-it/guide/iphone/iph1ac0b3a2/ios read today: controls for
// formatting, but no name for the two styles in that page, so the iPhone steps describe
// finding the style without inventing a button name. No picture.
const ui = UI.it;
const SNIPPET = `{
  "timeoutSeconds": 30,
  "retryCount": 2
}`;
const FAQ = [
  { q: "Cosa somiglia di più a un blocco di codice in Note di Apple?", a: ["Il testo Monostile, con caratteri a spaziatura fissa, rientro e sfondo distinto. Le guide Apple documentano questo stile e Blocco citazione, ma non un comando Code Block o la colorazione della sintassi."] },
  { q: "Quale scorciatoia formatta il codice sul Mac?", a: ["Seleziona il frammento e premi Maiuscole-Comando-M per Monostile. Apple elenca Comando-apostrofo per Blocco citazione e Maiuscole-Comando-B per il formato corpo. Non sono modalità di colorazione del codice."] },
  { q: "Perché le vecchie guide parlano di Monospazio?", a: ["La guida Apple alle novità di iOS 17 spiega che lo stile Monospaced è diventato Monostyled. In italiano, la guida alle scorciatoie del Mac lo chiama Monostile."] },
  { q: "Blocco citazione colora il codice secondo la lingua?", a: ["No. Apple lo descrive come un testo separato da una barra di citazione. Per il codice, usa Monostile; le guide esaminate non documentano una colorazione della sintassi."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="blocco-codice-note-iphone"
  intro={<>Per un frammento di codice in Note di Apple usa Monostile. Apple documenta questo stile e Blocco citazione, ma non un comando dedicato ai blocchi di codice o alla colorazione della sintassi.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#mac", label: "Sul Mac" }, { href: "#iphone", label: "Su iPhone" },
    { href: "#citazione", label: "Blocco citazione" }, { href: "#limiti", label: "I limiti" },
    { href: "#pinto", label: "Pinto Notes" },
  ]}><p>Sul Mac, seleziona il codice e premi Maiuscole-Comando-M per applicare Monostile, chiamato Monospaced nelle vecchie guide inglesi. Su iPhone apri i controlli di formattazione e cerca lo stile per testo a spaziatura fissa. Le guide Apple esaminate non documentano una colorazione automatica per lingua.</p>
    <PostCta slug="it/blocco-codice-note-iphone" path="/it/blog/blocco-codice-note-iphone" position="answer" ui={ui.cta} title="Ti serve il comando Code Block?"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac e ha Code Block e Callout nel menu /.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="mac">Formatta un frammento di codice sul Mac</h2>
  <p>Monostile usa un carattere a spaziatura fissa, con testo rientrato e sfondo distinto. Separa un breve comando o una configurazione dalla spiegazione. La guida Apple alle scorciatoie usa il nome Monostile.</p>
  <Steps><li><strong>Incolla il frammento in una nota.</strong> Tieni la spiegazione sopra o sotto, così puoi selezionare solo il codice.</li><li><strong>Seleziona il codice.</strong> Apri i controlli di formattazione e applica Monostile, oppure premi Maiuscole-Comando-M.</li><li><strong>Formatta la spiegazione.</strong> Seleziona il testo normale e premi Maiuscole-Comando-B per il formato corpo.</li></Steps>
  <MenuPaths rows={[{ on: "Mac, codice", steps: ["Seleziona il testo", "Monostile"], keys: "⇧⌘M" }, { on: "Mac, spiegazione", steps: ["Seleziona il testo", "Formato corpo"], keys: "⇧⌘B" }]} />
  <p>Le scorciatoie vengono dalla <a href="https://support.apple.com/it-it/guide/notes/apd46c25187e/mac">guida Apple</a> e possono variare in base alla lingua e al layout della tastiera. Sul Mac, gli stili di paragrafo richiedono note iCloud o note salvate sul Mac.</p>
  <Keep title="Un frammento da provare" text={SNIPPET} code note="Incollalo in Note, selezionalo e applica Monostile. L'aspetto del codice su questa pagina web non è quello di Note." />
  <h2 id="iphone">Usa Monostile su iPhone</h2>
  <p>Nella nota seleziona il frammento, apri i controlli di formattazione e cerca lo stile per testo a spaziatura fissa. La <a href="https://support.apple.com/it-it/guide/iphone/iph1ac0b3a2/ios">guida Apple per iPhone</a> descrive i controlli e lo scorrimento della barra per raggiungere gli stili comuni, ma non nomina Monostile in quel passaggio.</p>
  <p>Se una vecchia guida parla di Monospaced, cerca lo stile aggiornato. Apple spiega il cambiamento e lo sfondo distinto nella <a href="https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf">guida alle novità di iOS 17</a>.</p>
  <h2 id="citazione">Blocco citazione serve per il testo citato</h2>
  <p>Blocco citazione separa un brano con una barra laterale. Usalo per un passo copiato dalla documentazione e lascia fuori la tua spiegazione. Per il codice scegli Monostile. Sul Mac, la <a href="https://support.apple.com/it-it/guide/notes/apd1955d3b21/mac">guida alla formattazione</a> include le citazioni; la scorciatoia è Comando-apostrofo. Su iPhone, scegli lo stile di citazione dai controlli di formattazione.</p>
  <h2 id="limiti">Dove si ferma: colorazione della sintassi</h2>
  <p>Le guide Apple esaminate documentano Monostile e Blocco citazione, non un comando Code Block dedicato o la colorazione che riconosce una lingua di programmazione. L'evidenziazione manuale del testo è un'altra funzione: colora ciò che selezioni, senza distinguere parole chiave e stringhe. Conserva una copia eseguibile nel progetto e usa la nota per spiegare perché hai salvato il frammento.</p>
  <h2 id="pinto">Code Block e Callout in Pinto Notes</h2>
  <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Scrivi <code>/</code> all'inizio di una riga e scegli Code Block per il codice o Callout per un avviso. Entrambi sono nel menu su iPhone e Mac. Dopo il collegamento, Claude Code e Codex possono leggere e modificare le note. La <a href="/blog/notes-in-claude-code-and-codex">guida al collegamento</a> è in inglese. Puoi <a href="/blog/move-from-apple-notes">importare le note di Apple sul Mac</a>; l'originale resta invariato.</p>
  </LocalPostPage>; }
