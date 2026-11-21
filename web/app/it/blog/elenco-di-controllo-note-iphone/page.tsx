import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "elenco-di-controllo-note-iphone");

// Italian version of /blog/apple-notes-checklist-sort (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "elenco di controllo note" gives elenco di controllo note iphone; "elenco di controllo" also lists elenco di
// controllo note iphone; "spuntare note iphone" gives elenco da spuntare note iphone; "note iphone elenco" gives elenco
// puntato and numerato; "checklist note iphone", "note iphone elementi selezionati" and "lista di controllo note
// iphone" give nothing useful. Apple's Italian name for a checklist is "elenco di controllo", the one people search, so
// the slug is elenco-di-controllo-note-iphone and the title says what the post answers: ticked items at the bottom.
// Apple's own Italian words, all read 21 Nov 2026, from the same pages the English post cites: support.apple.com/
// it-it/102296 ("Creare un elenco di controllo con Note", published 25 Feb 2025: the pulsante Elenco di controllo,
// Invio adds an item, tap the empty circle, drag to reorder, swipe right to indent and left to undo, Impostazioni > App
// > Note, "Ordina gli elementi selezionati", Manualmente or In automatico); the iPhone guide for iOS 16, it-it/guide/
// iphone/iph1ac0b3a2/16.0/ios/16.0 (the older path Impostazioni > Note > Ordina gli elementi selezionati, and that it
// applies to all your notes; its in-note Elenco di controllo menu isn't in the current guides, so it's left out; the
// iOS 27 page only says to tap the checklist button); the Mac guide it-it/guide/notes/apd93c815aa0/mac ("Aggiungere
// elenchi in Note sul Mac": click and hold an item and drag it, "Ordina automaticamente gli elementi selezionati",
// Formato > Altro > Seleziona tutti or Deseleziona tutti, Comando-click selects all or deselects all, Tabulatore and
// Maiuscole-Tabulatore, Maiuscole-A capo, Ctrl-Comando-Freccia su and Freccia giù), apd97da26aed/mac ("Modificare le
// impostazioni di Note sul Mac": Note > Impostazioni; the setting moves items down as they're selected and unselected
// items back to the top) and apd46c25187e/mac ("Abbreviazioni da tastiera e gesti": Maiuscole-Comando-L applies the
// checklist format, Maiuscole-Comando-U marks or unmarks an item). From the earlier Italian posts: the cartella smart
// rule Elenchi di controllo: Non selezionati and File > Nuova cartella smart (apd58edc7964/mac, Notes' SmartFolder
// loctables), File > Duplica nota (not9474646a9/mac), and that Note keeps items in the order you type them. Not on any
// Apple page in Italian either, so left out: why a ticked item looks grey or struck through, and the iPhone taps for
// Deseleziona tutti in iOS 27. Pictures: the English post's, described in Italian. Links go to the Italian grocery list
// and habit tracker posts; the rest go to English posts.

const ui = UI.it;

const FAQ = [
  { q: "Perché in Note gli elementi spuntati scendono in fondo?", a: [
    "Ordina gli elementi selezionati è impostato su In automatico. Su iPhone, vai in Impostazioni, App, Note, Ordina gli elementi selezionati e tocca Manualmente per lasciare gli elementi spuntati dove sono. Sul Mac, scegli Note, Impostazioni e deseleziona Ordina automaticamente gli elementi selezionati.",
  ] },
  { q: "Posso ordinare gli elementi spuntati in una sola nota?", a: [
    "L’impostazione vale per ogni elenco di controllo in ogni nota di quel dispositivo. Per mettere in ordine un solo elenco e lasciare stare gli altri, tieni l’impostazione disattivata e trascina giù a mano gli elementi spuntati.",
  ] },
  { q: "Note può ordinare un elenco di controllo in ordine alfabetico?", a: [
    "No. Note tiene gli elementi nell’ordine in cui li scrivi, e l’ordinamento che Apple descrive sposta in fondo solo gli elementi spuntati. Trascinali a mano, oppure sul Mac premi Ctrl-Comando-Freccia su o Freccia giù per spostare una riga alla volta.",
  ] },
  { q: "Qual è l’abbreviazione da tastiera per un elenco di controllo in Note?", a: [
    "Sul Mac, Maiuscole-Comando-L trasforma la riga in un elenco di controllo e Maiuscole-Comando-U spunta o toglie la spunta all’elemento in cui sei. Un clic su un elemento qualsiasi tenendo premuto Comando li spunta tutti.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="elenco-di-controllo-note-iphone"
      intro={<>
        Spunti un elemento in un elenco di controllo di Note, e lui scende in fondo oppure resta dov’è. Lo decide una sola impostazione,
        che su iPhone e su Mac sta in un posto diverso. Ecco dove trovarla, come spostare gli elementi a mano e come rimettere a zero un
        elenco.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "Su iPhone" },
          { href: "#mac", label: "Sul Mac" },
          { href: "#a-mano", label: "Spostare a mano" },
          { href: "#deseleziona-tutti", label: "Deseleziona tutti" },
          { href: "#abbreviazioni", label: "Abbreviazioni" },
          { href: "#pinto-notes", label: "Un elenco che si riordina" },
        ]}>
          <p>
            Su iPhone, vai in Impostazioni, App, Note, tocca Ordina gli elementi selezionati, poi In automatico per mandare in fondo gli
            elementi spuntati, o Manualmente per lasciarli dove sono. Sul Mac, scegli Note, Impostazioni e seleziona o deseleziona Ordina
            automaticamente gli elementi selezionati. È un solo interruttore per tutte le note, quindi va impostato una volta su ogni
            dispositivo.
          </p>
          <PostCta template="grocery-list" slug="it/elenco-di-controllo-note-iphone" path="/it/blog/elenco-di-controllo-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che le cose spuntate spariscano da sole?">
            <p>Pinto Notes funziona come Note di Apple e ha una lista della spesa gratuita. Di’ a ChatGPT o a Claude cosa ti serve e lui mette ogni cosa nel suo reparto, poi toglie le righe spuntate quando torni.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Una nota Groceries in Note di Apple su un Mac: otto elementi non spuntati, da Oat milk a Dark chocolate, poi Sourdough, Eggs e Spinach spuntati in fondo."
        caption="Un elenco di controllo della spesa in Note di Apple su un Mac, con gli elementi spuntati in fondo." />}
      faq={FAQ}
    >
      <h2 id="iphone">Mandare in fondo gli elementi spuntati su iPhone</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Impostazioni", "App", "Note", "Ordina gli elementi selezionati"] },
      ]} />
      <p>
        L’impostazione sta nell’app Impostazioni, non in Note. Apri Impostazioni, tocca App, poi Note, poi Ordina gli elementi selezionati,
        e scegli:
      </p>
      <ul>
        <li><strong>In automatico.</strong> Ogni elemento che spunti scende in fondo al suo elenco, così quello che resta da fare sta in alto.</li>
        <li><strong>Manualmente.</strong> Gli elementi spuntati restano dove sono. Sceglilo se il tuo elenco ha un ordine da tenere, come i passaggi di una ricetta.</li>
      </ul>
      <p>
        Nelle versioni più vecchie di iOS la stessa impostazione sta un livello più su, in Impostazioni, Note, Ordina gli elementi
        selezionati. In tutti e due i casi vale per ogni elenco di controllo in ogni nota di quell’iPhone.
      </p>

      <h2 id="mac">Mandare in fondo gli elementi spuntati sul Mac</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Note", "Impostazioni", "Ordina automaticamente gli elementi selezionati"] },
      ]} />
      <p>
        In Note, scegli Note &gt; Impostazioni e seleziona Ordina automaticamente gli elementi selezionati. Spunti un elemento e scende in
        fondo all’elenco. Togli la spunta e torna su, in cima. Deseleziona l’impostazione e gli elementi restano dove sono quando li spunti.
      </p>
      <p>
        Il Mac ha il suo interruttore, separato da quello dell’iPhone, quindi impostalo su tutti e due se vuoi che i tuoi elenchi si
        comportino allo stesso modo.
      </p>

      <h2 id="a-mano">Spostare un elemento a mano</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Trascina l’elemento"] },
        { on: "Mac", steps: ["Fai clic e tieni premuto", "Trascina"] },
        { on: "Mac", steps: ["Sposta l’elemento su"], keys: "⌃⌘↑" },
        { on: "Mac", steps: ["Sposta l’elemento giù"], keys: "⌃⌘↓" },
      ]} />
      <p>
        Con l’ordinamento su Manualmente, l’ordine lo decidi tu. Su iPhone, trascina un elemento dove vuoi. Sul Mac, fai clic su un
        elemento, tienilo premuto e trascinalo, oppure metti il cursore in una riga e premi Ctrl-Comando-Freccia su o Freccia giù per
        spostarla di un posto alla volta. Note non ha un ordinamento alfabetico per gli elenchi di controllo, quindi trascinare è anche il
        modo per metterli in ordine.
      </p>
      <p>
        Per raggruppare gli elementi, mettili in rientro. Su iPhone, fai scorrere un elemento verso destra per il rientro e verso sinistra
        per toglierlo. Sul Mac, premi Tabulatore per il rientro e Maiuscole-Tabulatore per toglierlo. Per la spesa, le intestazioni
        funzionano meglio dell’ordine: un’intestazione per reparto, come nel{" "}
        <a href="/it/blog/lista-spesa-note-iphone">modello di lista della spesa</a>.
      </p>

      <h2 id="deseleziona-tutti">Deselezionare tutto, o selezionare tutto</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Altro", "Deseleziona tutti"] },
        { on: "Mac", steps: ["Formato", "Altro", "Seleziona tutti"] },
      ]} />
      <p>
        Per riusare un elenco, fai clic al suo interno e scegli Formato &gt; Altro &gt; Deseleziona tutti. Seleziona tutti spunta tutto.
        C’è anche un modo più veloce: fai clic su un elemento qualsiasi tenendo premuto Comando. Se c’è almeno un elemento non spuntato,
        Note li spunta tutti, e se sono tutti spuntati, toglie la spunta a tutti.
      </p>
      <p>
        Deselezionare tutto cancella la traccia di quello che avevi spuntato. Per un elenco che tieni per la sua storia, come un{" "}
        <a href="/it/blog/habit-tracker-note-iphone">habit tracker</a>, scegli prima File &gt; Duplica nota e rimetti a zero la copia.
      </p>

      <h2 id="abbreviazioni">Abbreviazioni da tastiera per gli elenchi di controllo sul Mac</h2>
      <Paths rows={[
        { on: "Elenco di controllo", steps: ["Applica il formato elenco di controllo"], keys: "⇧⌘L" },
        { on: "Spunta", steps: ["Contrassegna o togli il contrassegno"], keys: "⇧⌘U" },
        { on: "Sposta", steps: ["Elemento su o giù"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        Maiuscole-Comando-L applica il formato elenco di controllo, come il pulsante Elenco di controllo. Maiuscole-Comando-U spunta o
        toglie la spunta all’elemento in cui c’è il cursore, così non ti serve il mouse. Maiuscole-A capo aggiunge una seconda riga dentro
        lo stesso elemento. Su iPhone, tocca il pulsante Elenco di controllo, e ogni Invio inizia l’elemento successivo.
      </p>

      <h2 id="elenchi-aperti">Trovare ogni elenco con qualcosa ancora da fare</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="La finestra New Smart Folder in Note di Apple su macOS 27, chiamata Open to-dos, con una sola regola: Checklists, Unchecked."
        caption="Una cartella smart con ogni nota che ha un elemento non spuntato. Note di Apple su macOS 27." />
      <p>
        Ordinare mette in ordine un elenco. Per vederli tutti, crea una cartella smart con la regola Elenchi di controllo: Non
        selezionati: elenca ogni nota che ha ancora un elemento non spuntato, da qualsiasi cartella. Sul Mac, scegli File &gt; Nuova
        cartella smart. I passaggi per iPhone sono in{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma l’ordinamento degli elenchi</h2>
      <ul>
        <li><strong>Tutte le note o nessuna.</strong> L’impostazione copre ogni elenco di controllo del dispositivo, quindi una lista della spesa e una ricetta si ordinano allo stesso modo.</li>
        <li><strong>Gli elementi spuntati si accumulano.</strong> Scendono in fondo e restano lì finché non li elimini o togli la spunta.</li>
        <li><strong>L’ordine è a mano.</strong> Note non ordina per nome o per reparto, e un elemento nuovo va dove lo scrivi.</li>
      </ul>
      <p>
        Per un elenco che usi ogni settimana, va bene così. Per un elenco che cambia ogni giorno, metterlo in ordine diventa un lavoro a sé.
      </p>

      <h2 id="pinto-notes">Un elenco che si riordina da solo</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Una nota Groceries in Pinto Notes su un Mac. Le cinque righe appena aggiunte da ChatGPT sono colorate, e una barra in basso dice che ChatGPT ha cambiato 5 righe, con Undo." }}
        caption="Una nota della spesa in Pinto Notes su un Mac. Le cinque righe appena aggiunte da ChatGPT sono colorate, con Undo in basso." />
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/grocery-list">Grocery list</a> è una lista sola, con un’intestazione per
        ogni reparto.
      </p>
      <p>
        Di’ alla tua AI cosa ti serve, anche in una frase lunga, e lei mette ogni cosa sotto il reparto giusto e salta quello che è già in
        lista. Spunta le cose mentre fai la spesa. Di’ &ldquo;sono tornato dal supermercato&rdquo; e toglie le righe spuntate e ti dice
        cosa manca. Puoi sempre aggiungere, spuntare e trascinare ogni elemento da solo, e ogni versione precedente di una nota viene
        conservata. Funziona una volta collegati ChatGPT o Claude, e{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Gli elenchi di controllo che hai già in Note di Apple arrivano con{" "}
        <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a> (in inglese), e Note di Apple resta com’era. L’app è in
        inglese.
      </p>
    </LocalPostPage>
  );
}
