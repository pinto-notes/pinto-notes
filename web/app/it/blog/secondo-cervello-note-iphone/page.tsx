import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "secondo-cervello-note-iphone");
// Italian version of /blog/apple-notes-second-brain. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "secondo cervello note iphone" and "secondo cervello app" returned no
// suggestions; "second brain note" returned "second brain notes" and "second brain notes app".
// Apple it-it/guide/notes/apd558a85438/mac, not9474646a9/mac, apdc88ed7f1d/mac,
// apd58edc7964/mac, apdb54e469b6/mac, apde615d29c2/mac, and
// it-it/guide/iphone/iph908d1558b/ios read 21 Nov 2026. Verified: File > Nuova cartella,
// File > Duplica nota, File > Nuova cartella smart, File > In evidenza, Modifica >
// Aggiungi link. Where the
// iPhone guide gave no exact button label, the step is described instead. No pictures.
const ui = UI.it;
const HOME = `Pagina iniziale

Questa settimana
Scegliere le piante per il balcone

Progetti in corso
Giardino sul balcone

Informazioni utili
Piante da ombra
Note sull'irrigazione

Revisione settimanale
Leggere le note in In arrivo
Spostare quelle da conservare
Scrivere il prossimo passo di ogni progetto attivo
Spostare i progetti finiti in Archivio
`;
const FAQ = [
  { q: "Posso usare Note di Apple come secondo cervello?", a: ["Sì. Usa In arrivo per le note nuove, Progetti per i lavori attivi, Riferimenti per ciò che riuserai e Archivio per i lavori finiti. Una nota iniziale in evidenza collega le cose importanti della settimana. Rivedi regolarmente In arrivo."] },
  { q: "C'è un modello da copiare?", a: ["Copia la nota Pagina iniziale qui sotto, sostituisci gli esempi e aggiungi link veri. Sul Mac usa Modifica > Aggiungi link; su iPhone o Mac scrivi >> e il titolo. I titoli incollati da soli restano testo normale."] },
  { q: "Come raccolgo le note di un progetto in cartelle diverse?", a: ["Aggiungi lo stesso tag, per esempio #giardino. Sul Mac crea una cartella smart con una regola sui tag. Elencherà le note corrispondenti senza spostarle dalle loro cartelle."] },
  { q: "Ogni quanto devo riordinare?", a: ["Prova una volta a settimana: smista le note utili, aggiorna il prossimo passo dei progetti e archivia quelli finiti. Fallo prima se salvi note che ti servono oggi."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="secondo-cervello-note-iphone"
  intro={<>Note di Apple può diventare un posto dove conservare idee e ritrovarle. Inizia con una cartella In arrivo e una nota iniziale in evidenza. Una volta a settimana, sistema ciò che hai raccolto.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#cartelle", label: "Le cartelle" }, { href: "#iniziale", label: "La nota iniziale" },
    { href: "#tag", label: "Tag e cartelle smart" }, { href: "#abitudine", label: "La revisione" },
    { href: "#pinto", label: "Link di ritorno e AI" },
  ]}><p>Crea quattro cartelle: In arrivo, Progetti, Riferimenti e Archivio. Metti in evidenza una nota iniziale con link ai progetti attivi. Un tag condiviso e una cartella smart raccolgono note che stanno in cartelle diverse. Salva le nuove note in In arrivo e rivedile ogni settimana.</p>
    <PostCta slug="it/secondo-cervello-note-iphone" path="/it/blog/secondo-cervello-note-iphone" position="answer" ui={ui.cta} title="Fai lavorare l'AI sulle tue note"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Linked From mostra quali note rimandano a quella aperta. Dopo il collegamento, ChatGPT o Claude possono leggere e modificare le tue note.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="cartelle">Parti da quattro cartelle</h2>
  <MenuPaths rows={[{ on: "Mac", steps: ["File", "Nuova cartella"] }]} />
  <p>Sul Mac, seleziona una cartella sotto iCloud nella barra laterale, poi scegli File &gt; Nuova cartella. Ripeti per le quattro cartelle. Usa le note iCloud: Apple avverte che alcune funzioni non sono disponibili con altri provider.</p>
  <ul><li><strong>In arrivo</strong> raccoglie le note nuove che non hai ancora sistemato.</li><li><strong>Progetti</strong> contiene lavori con una conclusione, per esempio il giardino sul balcone. Tieni piano e prossimo passo in una nota.</li><li><strong>Riferimenti</strong> conserva informazioni da riusare, come una guida all'irrigazione.</li><li><strong>Archivio</strong> contiene i progetti finiti che potresti cercare ancora.</li></ul>
  <p>Parti dalla prossima nota nuova, senza riordinare subito tutta la libreria. Sul Mac trascina le note sulle cartelle nella barra laterale. Crea sottocartelle solo quando una cartella diventa difficile da scorrere.</p>
  <h2 id="iniziale">Copia una nota iniziale e mettila in evidenza</h2>
  <p>Tieni Pagina iniziale in Progetti. Incolla questo testo in una nuova nota e sostituisci gli esempi. I nomi sono segnaposto; poi aggiungerai i link veri.</p>
  <Keep title="Pagina iniziale per Note di Apple" text={HOME} note="Incolla come testo normale. Crea le note di progetto e di riferimento, poi sostituisci i nomi con link veri." />
  <MenuPaths rows={[{ on: "Mac", steps: ["Modifica", "Aggiungi link"] }]} />
  <p>Crea una nota Giardino sul balcone. Torna alla pagina iniziale, seleziona il nome, scegli Modifica &gt; Aggiungi link, digita il titolo e scegli la nota. Lascia attiva l'opzione che usa il titolo della nota, così il testo del link si aggiorna se la rinomini. Ripeti per i riferimenti.</p>
  <p>Su iPhone o Mac puoi anche scrivere <code>&gt;&gt;</code>, poi il titolo, e scegliere la nota. La <a href="https://support.apple.com/it-it/guide/notes/apde615d29c2/mac">guida Apple ai link</a> descrive il percorso sul Mac. Seleziona Pagina iniziale nell'elenco e scegli File &gt; In evidenza, così resta in cima alla cartella.</p>
  <h2 id="tag">Usa i tag per gli argomenti che attraversano le cartelle</h2>
  <p>Una cartella dice dove hai messo una nota. Un tag riunisce note conservate in posti diversi. Aggiungi <code>#giardino</code> al progetto e alla nota sulle piante da ombra. Su iPhone inserisci uno spazio dopo il tag per attivarlo. Inizia con tag che userai ancora.</p>
  <MenuPaths rows={[{ on: "Mac", steps: ["File", "Nuova cartella smart"] }]} />
  <p>Sul Mac scegli File &gt; Nuova cartella smart, chiamala Giardino e imposta una regola sui tag. Seleziona #giardino e conferma. Su iPhone crea una cartella dall'elenco delle cartelle, scegli di renderla smart e imposta il filtro per tag. Le note restano nelle cartelle originali. È un filtro salvato: il tag devi comunque aggiungerlo tu. La <a href="/blog/apple-notes-tags-smart-folders">guida a tag e cartelle smart</a> è in inglese.</p>
  <h2 id="abitudine">Raccogli prima, poi rivedi In arrivo</h2>
  <p>Sul Mac seleziona In arrivo e crea una nota. Usa un titolo che riconoscerai il mese prossimo, per esempio Piante per un balcone a nord. Aggiungi dettagli utili e, se c'è, il link alla fonte. Durante la revisione settimanale, sposta i riferimenti utili e i lavori attivi nelle rispettive cartelle. Scrivi il prossimo passo di ogni progetto, aggiungi o togli i suoi link dalla pagina iniziale e archivia i lavori conclusi.</p>
  <p>Se ripeti spesso le stesse intestazioni, conserva una nota vuota e duplicala sul Mac con File &gt; Duplica nota. Scrivi note su cui puoi agire, per esempio le piante scelte e il motivo, invece di accumulare link non letti.</p>
  <h2 id="limiti">Dove il sistema si ferma</h2>
  <p>La pagina iniziale va aggiornata a mano. Un progetto nuovo non compare da solo. Una cartella smart elenca solo le note che rispettano le regole. Devi decidere tu cosa conservare e come cambiare il piano. Note di Apple non mostra un elenco dei link in entrata: se un progetto collega un riferimento, il progetto non compare automaticamente in quella nota.</p>
  <h2 id="pinto">Pinto Notes aggiunge link di ritorno e accesso AI</h2>
  <p>In Pinto Notes, Linked From nel menu Altro di una nota elenca le note che la collegano. Conta solo i link veri. La <a href="/blog/apple-notes-backlinks">guida ai link di ritorno</a> è in inglese. Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a>, possono leggere e modificare le note. Puoi chiedere una bozza dei prossimi passi di un progetto, controllarla e correggerla. Puoi leggere e modificare anche le note scritte dall'AI. Le note di Apple arrivano con <a href="/blog/move-from-apple-notes">un'importazione sul Mac</a>; l'originale non cambia.</p>
  </LocalPostPage>; }
