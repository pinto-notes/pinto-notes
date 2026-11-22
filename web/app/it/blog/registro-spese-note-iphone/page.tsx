import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "registro-spese-note-iphone");
// Italian version of /blog/apple-notes-expense-tracker. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "registro spese note iphone" and "tenere traccia spese note iphone"
// returned no suggestions. Title uses the local task phrase, without a fabricated search claim.
// Apple it-it read 21 Nov: notes/apda85974595/mac (Formato > Risultati matematici,
// Inserire risultati, Suggerire risultati, No), notes/apd0a136b9cc/mac (Formato > Tabella),
// notes/not9474646a9/mac (File > Duplica nota), iphone/iph46efa613a/ios
// (espressioni con nome). The table behavior is the English post's macOS 27 test.
// Tabs in TEMPLATE match English structure. Hero and Pinto picture follow English.
const ui = UI.it;
const TEMPLATE = `Spese, novembre

Data\tCosa\tCategoria\tImporto
1 nov\tSpesa settimanale\tSpesa\t42
2 nov\tAbbonamento autobus\tTrasporti\t35
3 nov\tPizza con amici\tRistoranti\t23
5 nov\tLampadine\tCasa\t6
6 nov\tSpesa settimanale\tSpesa\t28
8 nov\tCinema\tSvago\t15

Spesa = 42 + 28
Trasporti = 35
Ristoranti = 23
Casa = 6
Svago = 15

Spesa + Trasporti + Ristoranti + Casa + Svago =
`;
const FAQ = [
  { q: "Posso registrare le spese in Note di Apple?", a: ["Sì. Metti un acquisto per riga in una tabella e, sotto, una somma per categoria. Risultati matematici può sommare i nomi delle categorie nella riga finale."] },
  { q: "Note ha un modello per le spese?", a: ["Non ha modelli propri. Incolla quello di questa pagina in una nota, trasforma le righe separate da tabulazioni in tabella e duplica la nota ogni mese sul Mac."] },
  { q: "Perché la somma non funziona nella tabella?", a: ["Risultati matematici non è disponibile dentro una tabella. Metti le righe delle somme sotto la tabella, come testo normale."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="registro-spese-note-iphone"
  intro={<>Un registro delle spese funziona se annoti ogni acquisto quando lo fai. Note di Apple può conservare la tabella e calcolare il totale, con un passaggio manuale in più.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#modello", label: "Il modello" }, { href: "#prepara", label: "Prepararlo" },
    { href: "#giorno", label: "Ogni giorno" }, { href: "#limiti", label: "I limiti" },
    { href: "#pinto", label: "Registro automatico" },
  ]}><p>Metti ogni acquisto in una riga della tabella, con data, descrizione, categoria e importo. Sotto scrivi una riga per categoria, per esempio Spesa = 42 + 28, e una somma finale con =. Risultati matematici propone il totale su iPhone e Mac.</p>
    <PostCta template="budget-log" slug="it/registro-spese-note-iphone" path="/it/blog/registro-spese-note-iphone" position="answer" ui={ui.cta} title="Vuoi inserire ogni spesa una sola volta?"><p>Il modello gratuito Budget and expenses di Pinto Notes calcola i totali. Puoi registrare una spesa con un tocco oppure dirla a ChatGPT o Claude dopo il collegamento.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360} alt="Una nota di Apple su iPhone con costi nominati e una somma totale, seguita dalla divisione tra cinque persone." caption="L'esempio Apple usa importi con un nome e li somma in fondo. Il modello qui sotto segue lo stesso metodo." />}
  faq={FAQ}>
  <h2 id="modello">Il modello: acquisti sopra, somme sotto</h2>
  <p>La tabella conserva lo storico: una riga per ogni spesa. Le righe sotto fanno i conti, perché Note non somma una colonna della tabella. Tieni i nomi delle categorie senza accenti e scrivili sempre allo stesso modo.</p>
  <Keep title="Registro delle spese per Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Le colonne sono separate da tabulazioni. Trasformale in tabella dopo l'incolla; premi A capo per inserire il risultato suggerito dopo =." />
  <h2 id="prepara">Preparare la nota</h2>
  <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"] }, { on: "Mac", steps: ["Formato", "Risultati matematici"] }]} />
  <p>Incolla il modello, seleziona soltanto le righe da Data all'ultima spesa e usa il pulsante Tabella. Ogni tabulazione diventa una colonna. Controlla che Formato &gt; Risultati matematici non sia impostato su No. Suggerire risultati propone la risposta da inserire con A capo; Inserire risultati la aggiunge subito. La funzione richiede note iCloud aggiornate o note salvate sul Mac.</p>
  <p>Una nota per mese è più semplice da verificare. Sul Mac, File &gt; Duplica nota copia il mese precedente; svuota la tabella, aggiorna le somme e cambia il titolo. Per capire perché una cella non somma, leggi <a href="/blog/apple-notes-tables">la guida alle tabelle</a> (in inglese).</p>
  <h2 id="giorno">Aggiungere una spesa</h2>
  <p>Vai nell'ultima cella della tabella e premi Tab per aggiungere una riga. Scrivi data, cosa hai comprato, categoria e importo. Poi aggiungi lo stesso importo alla riga della categoria sotto la tabella. Se cambi un valore, il totale si aggiorna. Metti in evidenza la nota del mese per trovarla subito; la ricerca ritrova una spesa dal suo nome.</p>
  <p>Un registro mostra cosa hai speso. Se vuoi stabilire prima un limite per ogni categoria, affiancalo al <a href="/it/blog/budget-mensile-note-iphone">budget mensile nelle note di iPhone</a>.</p>
  <h2 id="limiti">Dove il registro si ferma</h2>
  <p>Devi scrivere ogni importo due volte, nella tabella e nella somma della categoria. Se dimentichi la seconda, il totale è sbagliato. La tabella non ordina le righe per importo e non somma le colonne. Ogni mese è una nota separata, quindi per confrontare periodi devi aprirne più di una. Le spese ricorrenti vanno aggiunte a mano.</p>
  <h2 id="pinto">Un registro che fa i conti</h2>
  <Figure shot={SHOTS.budgetApp} caption="Budget and expenses in Pinto Notes sul Mac: spese del mese, categorie, bollette e ultimi sei mesi. Dati di esempio." />
  <p>Il modello <a href="/templates/budget-log">Budget and expenses</a> è una piccola app dentro una nota. Imposti un budget per categoria, aggiungi le spese una volta sola e vedi quanto resta. Puoi correggere o eliminare una voce con Annulla, inserire bollette mensili e confrontare gli ultimi sei mesi. I calcoli li fa il modello, non l'AI. Se colleghi ChatGPT o Claude, puoi dire cosa hai speso e lasciare che aggiunga data, voce, categoria e importo. Non si collega alla banca. Le note di Apple si importano sul Mac senza cambiarle.</p>
  <p>Altre guide: <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/budget-tracker-with-chatgpt-or-claude">un budget con ChatGPT o Claude</a> (in inglese), <a href="/blog/import-your-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
