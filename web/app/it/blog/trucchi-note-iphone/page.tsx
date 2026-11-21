import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "trucchi-note-iphone");
// Italian version of /blog/apple-notes-tips. Google autocomplete hl=it, gl=it, 21 Nov 2026:
// "trucchi note iphone" suggested itself; "note iphone consigli" returned none.
// Apple it-it pages read 21 Nov: notes/apdf028f7034/mac (nota rapida),
// notes/apd93c815aa0/mac (elenchi), notes/apd1955d3b21/mac (formattazione),
// notes/apd58edc7964/mac (cartelle smart), notes/not28c5f5468/mac (protezione),
// notes/apdb54e469b6/mac (note in evidenza), notes/apdb5106e334/mac (audio),
// iphone/iphb8628c6b8/ios (ricerca), iphone/iph653f28965/ios (scansione),
// notes/apde615d29c2/mac (Aggiungi link), notes/apda85974595/mac (Risultati matematici).
// The localized Apple guide does not name the Markdown paste command, so the step is described
// without a menu label. Screenshots follow English.
const ui = UI.it;
const FAQ = [
  { q: "Come trovare una nota senza ricordare il titolo?", a: ["Cerca una parola del testo, un tag o un oggetto in un'immagine. Note cerca anche nel testo scritto a mano e nelle scansioni. Delle note protette mostra solo il titolo."] },
  { q: "Note di Apple ha modelli?", a: ["Non ha una galleria di modelli. Puoi tenere una nota vuota come esempio e duplicarla sul Mac con File > Duplica nota."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="trucchi-note-iphone"
  intro={<>Note sembra un posto dove scrivere e basta, ma offre scorciatoie per catturare, ordinare e ritrovare le informazioni. Ecco quindici funzioni concrete.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#cattura", label: "Aggiungi in fretta" }, { href: "#ordina", label: "Dai una forma" },
    { href: "#trova", label: "Ritrova" }, { href: "#idee", label: "Cosa tenere" },
    { href: "#ai", label: "Con la tua AI" },
  ]}><p>Parti dalle note rapide, dalle scansioni e dalle registrazioni. Usa titoli, elenchi e tabelle per leggere meglio. Poi fissa le note importanti, collega quelle correlate e usa tag e cartelle smart. La ricerca trova anche testo nelle scansioni.</p>
    <PostCta slug="it/trucchi-note-iphone" path="/it/blog/trucchi-note-iphone" position="answer" ui={ui.cta} title="Vuoi che ChatGPT o Claude lavorino nelle note?"><p>Pinto Notes conserva cartelle, elenchi e tabelle in un'app per iPhone e Mac. La tua AI può leggere e modificare le note dopo il collegamento.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} maxWidth={700} alt="Note sul Mac con un piano per sabato, elenco di controllo, tag e cartella smart delle attività aperte." caption="Una nota con elenco, tag e cartella smart su macOS 27. Dati di esempio." />}
  faq={FAQ}>
  <h2 id="cattura">Aggiungi in fretta</h2>
  <h3>1. Apri una nota rapida da qualsiasi app</h3>
  <p>Sul Mac premi Fn o il tasto Globo insieme a Q. Puoi anche assegnare un angolo attivo. Da Safari condividi una pagina in una nota rapida. Le trovi nella cartella Note rapide.</p>
  <h3>2. Scansiona un foglio direttamente in Note</h3>
  <p>Su iPhone apri una nota, usa il pulsante degli allegati e scegli la scansione dei documenti. Il risultato entra come PDF. Puoi anche acquisire il testo e inserirlo nella nota.</p>
  <h3>3. Registra una riunione e leggi la trascrizione</h3>
  <p>Dal pulsante degli allegati avvia una registrazione. Aprila per leggere la trascrizione, se dispositivo e lingua sono supportati. Apple Intelligence può riassumerla su modelli compatibili.</p>
  <h3>4. Incolla Markdown come testo formattato</h3>
  <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640} alt="Lo stesso testo Markdown incollato in Note come testo semplice e come titolo, elenco e grassetto." caption="Su macOS 27 l'incolla come Markdown converte i simboli in formattazione." />
  <p>Sul Mac con macOS 27 scegli l'opzione che converte il testo incollato da Markdown. Un normale Comando-V lascia # e altri simboli nel testo.</p>
  <h3>5. Tieni una nota modello e duplicala</h3>
  <p>Note non ha una galleria di modelli. Prepara una nota vuota per le strutture che ripeti e sul Mac scegli File &gt; Duplica nota. <a href="/blog/apple-notes-templates">La raccolta dei modelli</a> è in inglese.</p>
  <h2 id="ordina">Dai una forma</h2>
  <h3>6. Fai scendere le voci spuntate</h3>
  <p>Su iPhone, in Impostazioni &gt; App &gt; Note, scegli Ordina gli elementi selezionati e poi In automatico. Sul Mac attiva l'ordinamento degli elementi selezionati nelle impostazioni di Note. Puoi ripartire da una lista deselezionando tutte le voci.</p>
  <h3>7. Comprimi le sezioni lunghe</h3>
  <p>Formatta una riga come intestazione e usa il comando accanto per comprimere o espandere la sezione. Funziona nelle note iCloud o Sul mio Mac compatibili.</p>
  <h3>8. Evidenzia il testo che conta</h3>
  <p>Seleziona il testo e usa il pulsante di evidenziazione. Il cerchio accanto permette di cambiare colore.</p>
  <h3>9. Usa una tabella per le colonne</h3>
  <p>Se hai dati ripetuti, inserisci una tabella con Formato &gt; Tabella sul Mac. Le tabelle di Note non ordinano né sommano le colonne. <a href="/blog/apple-notes-tables">I dettagli sulle tabelle</a> sono in inglese.</p>
  <h3>10. Lascia fare le somme a Note</h3>
  <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={320} alt="Nota di spese su iPhone con importi nominati e una somma totale." caption="Un segno di uguale alla fine dell'espressione fa comparire il risultato. Immagine: Apple." />
  <p>Scrivi una formula e termina con =. Dai un nome agli importi su righe precedenti per riusarli; su Mac controlla Formato &gt; Risultati matematici. Le somme non funzionano dentro le celle di una tabella.</p>
  <h2 id="trova">Ritrova</h2>
  <h3>11. Metti in evidenza le note aperte ogni giorno</h3>
  <p>Sul Mac seleziona la nota e mettila in evidenza dal menu File. Su iPhone tieni premuta la nota nell'elenco. Resterà in alto nella cartella.</p>
  <h3>12. Collega le note tra loro</h3>
  <PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} maxWidth={490} alt="Finestra Aggiungi link in Note sul Mac con una sezione della nota scelta come destinazione." caption="Un link può portare anche a una sezione della nota su macOS 27." />
  <p>Sul Mac scegli Modifica &gt; Aggiungi link e cerca un'altra nota. Puoi collegare una sezione, quando disponibile. Note non mostra un elenco dei link che tornano alla nota.</p>
  <h3>13. Tag e cartella smart per le attività aperte</h3>
  <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={640} alt="Creazione di una cartella smart con regola per gli elenchi di controllo non completati." caption="Una cartella smart riunisce note con attività ancora aperte." />
  <p>Scrivi # seguito da una parola per creare un tag. Sul Mac puoi creare una cartella smart e scegliere regole, comprese quelle per elenchi con voci non spuntate. <a href="/blog/apple-notes-tags-smart-folders">La guida ai tag</a> è in inglese.</p>
  <h3>14. Cerca nelle scansioni, nelle immagini e nei PDF</h3>
  <p>La ricerca trova parole digitate e scritte a mano, testo nelle scansioni, oggetti nelle immagini e tag. In una nota puoi cercare anche negli allegati. Una nota protetta mostra soltanto il titolo finché resta chiusa.</p>
  <h2 id="idee">Qualche idea per usare Note</h2>
  <p>Una <a href="/it/blog/ricette-note-iphone">raccolta di ricette</a>, una <a href="/it/blog/lista-spesa-note-iphone">lista della spesa</a>, un <a href="/it/blog/registro-spese-note-iphone">registro delle spese</a> o gli appunti di riunione sono esempi che sfruttano elenchi, ricerca e tabelle.</p>
  <h2 id="ai">15. Quando vuoi la tua AI nelle note</h2>
  <Figure shot={SHOTS.aiEdit} caption="ChatGPT ha aggiunto cinque voci in Pinto Notes; la modifica si può annullare." />
  <p>Apple Intelligence può lavorare sul testo aperto in Note. Per lasciare a ChatGPT o Claude l'accesso alle note dalla chat, Pinto Notes le rende disponibili dopo il collegamento. Ogni versione precedente resta recuperabile. Sul Mac puoi importare le note di Apple senza modificarle.</p>
  <p>Altre guide: <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
