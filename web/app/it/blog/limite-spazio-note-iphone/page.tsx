import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "limite-spazio-note-iphone");
// Italian version of /blog/apple-notes-storage-limit. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "limite spazio note iphone" and "quanto spazio occupano le note iphone"
// returned no suggestions; this title uses the natural question without claiming a suggestion.
// Apple it-it read 21 Nov: 108922 (gestire spazio iCloud), 108047 (piani iCloud+),
// 103188 (limiti di altri dati iCloud, nessun numero per Note), 108429 (spazio iPhone),
// iphone/iph7262fd4fe/ios (account locali), notes/apde615d29c2/mac (Modifica > Aggiungi link).
// The English post's app messages have no verified Italian wording; described by effect, not quoted.
// Pictures follow English. No unpublished attachment or note-size number is invented.
const ui = UI.it;
const FAQ = [
  { q: "Note di Apple ha un limite di spazio?", a: ["Apple non pubblica un limite generale per Note. Le note iCloud usano lo spazio iCloud disponibile, che parte da 5 GB gratuiti. L'app ha anche limiti per allegati e lunghezza delle note, ma Apple non ne pubblica i numeri."] },
  { q: "Quanti allegati può avere una nota?", a: ["Apple non dà un numero. Quando raggiungi un limite, Note mostra un avviso. Per aggiungere altri file, crea una nuova nota e collega le due."] },
  { q: "Le note occupano spazio iCloud?", a: ["Sì, se sono sotto l'account iCloud. Le note sotto Su iPhone o Sul mio Mac occupano spazio del dispositivo; quelle Gmail sono nell'account di posta."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="limite-spazio-note-iphone"
  intro={<>iCloud è pieno, oppure Note non accetta più allegati. Sono due limiti diversi. Apple spiega come vedere lo spazio, ma non pubblica una dimensione massima per ogni nota.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#icloud", label: "Spazio iCloud" }, { href: "#interni", label: "Limiti della nota" },
    { href: "#allegati", label: "Troppi allegati" }, { href: "#controlla", label: "Controlla lo spazio" },
    { href: "#libera", label: "Fai spazio" },
  ]}><p>Le note in iCloud condividono lo spazio iCloud con foto, backup e altri dati. Hai 5 GB gratuiti; i piani iCloud+ vanno da 50 GB a 12 TB. L'app ha limiti per numero e dimensione degli allegati e per lunghezza della nota, ma Apple non ne indica i valori nelle guide.</p>
    <PostCta slug="it/limite-spazio-note-iphone" path="/it/blog/limite-spazio-note-iphone" position="answer" ui={ui.cta} title="Vuoi note che non usano lo spazio iCloud?"><p>Pinto Notes sincronizza tramite un proprio servizio cifrato. Lo spazio iCloud pieno non ferma le sue note; puoi collegare ChatGPT o Claude per lavorarci.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250} alt="Schermata iCloud di iPhone con indicazione dello spazio usato e Note tra le app che salvano dati." caption="Lo spazio iCloud include anche le note dell'account iCloud. Immagine: Apple." />}
  faq={FAQ}>
  <h2 id="icloud">Le note condividono lo spazio iCloud</h2>
  <p>Apple offre 5 GB di spazio iCloud gratuito e piani iCloud+ da 50 GB, 200 GB, 2 TB, 6 TB e 12 TB. Non riserva una quota separata a Note: i suoi dati rientrano nei documenti dello spazio iCloud. Una nota condivisa usa lo spazio del proprietario. Quando lo spazio è pieno, backup e sincronizzazione di iCloud possono fermarsi. Se le note non si aggiornano, controlla anche <a href="/it/blog/note-iphone-non-sincronizzate">le altre cause della mancata sincronizzazione</a>.</p>
  <h2 id="interni">Limiti dentro una nota</h2>
  <p>Le guide Apple spiegano come aggiungere foto, PDF e altri file, ma non danno una dimensione massima per nota, allegato o numero di allegati. La pagina dei limiti iCloud riguarda Contatti, Calendario, Promemoria, Preferiti e Mappe, non Note. L'app può avvisare quando ci sono troppi allegati, un file troppo grande, una nota troppo lunga, troppe cartelle annidate o una nota troppo grande da proteggere. Il numero per un allegato può comparire nell'avviso, ma non è pubblicato come limite generale. Negli account Exchange gli allegati non sono disponibili.</p>
  <h2 id="allegati">Se Note rifiuta altri allegati</h2>
  <p>Crea una seconda nota per i prossimi file e collegala alla prima. Sul Mac usa Modifica &gt; Aggiungi link. Su iPhone e Mac puoi aprire la vista degli allegati della raccolta, poi tornare alla nota che contiene ciascun file. Gli allegati delle note protette non compaiono finché non le apri.</p>
  <h2 id="controlla">Quanto spazio usa Note</h2>
  <p>Su iPhone, in Impostazioni &gt; Generali &gt; Spazio iPhone trovi lo spazio usato dall'app Note sul dispositivo. In Impostazioni, sotto il tuo nome e iCloud, controlli lo spazio iCloud. Il nome del comando per i dettagli di archiviazione cambia tra le versioni; apri il riepilogo dello spazio e guarda la categoria Documenti. I dati temporanei potrebbero non comparire nel totale dell'app.</p>
  <p>Le note sotto Su iPhone o Sul mio Mac stanno sul dispositivo, non nella quota iCloud. Le note di Gmail stanno nell'account di posta. <a href="/it/blog/dove-sono-salvate-note-iphone">Ecco come riconoscere l'account di ogni nota</a>.</p>
  <h2 id="libera">Fare spazio senza perdere note</h2>
  <p>Puoi eliminare altri dati iCloud che non ti servono o passare a un piano più grande. Puoi spostare note grandi su Sul mio Mac, ma poi non arrivano più su iPhone e alcuni allegati possono cambiare durante lo spostamento. Le note eliminate rimangono in Eliminate di recente per 30 giorni. Fai una copia prima di cancellare o spostare: <a href="/blog/back-up-apple-notes">la guida al backup</a> è in inglese.</p>
  <h2>Note fuori dalla quota iCloud</h2>
  <Figure shot={SHOTS.iphoneFiles} caption="Una nota con PDF, CSV, foto e link in Pinto Notes su iPhone." />
  <p>Pinto Notes sincronizza con un servizio cifrato separato da iCloud e può contenere immagini e file. Non dichiariamo un limite di spazio qui. Sul Mac importa testi e immagini dalle note di Apple; PDF e altri allegati rimangono in Note di Apple, che non viene modificata.</p>
  <p>Altre guide: <a href="/it/blog/spostare-note-iphone-su-icloud">spostare le note su iCloud</a>, <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
