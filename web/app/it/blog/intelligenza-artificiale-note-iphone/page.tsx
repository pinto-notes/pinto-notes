import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "intelligenza-artificiale-note-iphone");
// Italian version of /blog/apple-notes-ai. Google autocomplete hl=it, gl=it, 21 Nov 2026:
// "apple note ai" suggested itself; "intelligenza artificiale note iphone" had no suggestions.
// Apple it-it read 21 Nov: 121115 (dispositivi e lingue di Apple Intelligence),
// iphone/iphbe11247b5/ios (registrazioni e trascrizioni), iphone/iph6f08da1d2/ios
// (Strumenti di scrittura), iphone/iphb8628c6b8/ios (ricerca), notes/apdb5106e334/mac
// (registrare e trascrivere), and iphone/iph00fd3c8c2/ios (estensione ChatGPT).
// Steps without verified localized button labels are described rather than named. Pictures follow English.
const ui = UI.it;
const FAQ = [
  { q: "Note di Apple può riassumere una registrazione?", a: ["Sì, con Apple Intelligence su un dispositivo e in una lingua supportati. La trascrizione da sola funziona già su iPhone 12 o successivo nelle lingue elencate da Apple."] },
  { q: "Note trascrive in italiano?", a: ["Sì. Apple elenca l'italiano tra le lingue della trascrizione su iPhone e Mac compatibili. Il riepilogo richiede anche Apple Intelligence."] },
  { q: "ChatGPT o Claude possono modificare le mie note?", a: ["L'estensione ChatGPT di Apple usa il testo che scegli di inviare agli Strumenti di scrittura, ma non dà accesso a tutto l'archivio di Note. Claude non ha un'estensione equivalente di Apple. Sul Mac esistono soluzioni limitate alla macchina."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="intelligenza-artificiale-note-iphone"
  intro={<>In Note l'AI compare negli Strumenti di scrittura, nelle registrazioni e in Siri. Le funzioni non richiedono tutte lo stesso iPhone o la stessa lingua.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#funzioni", label: "Cosa fa" }, { href: "#requisiti", label: "Dispositivi e lingue" },
    { href: "#ricerca", label: "Ricerca" }, { href: "#chatgpt", label: "ChatGPT e Claude" },
  ]}><p>Apple Intelligence può correggere, riscrivere e riassumere il testo scelto. Note può trascrivere una registrazione e, su dispositivi compatibili, riassumerla. Siri AI in versione beta può cercare e modificare note dove è disponibile. ChatGPT e Claude non ricevono accesso diretto a tutta la raccolta di Note.</p>
    <PostCta slug="it/intelligenza-artificiale-note-iphone" path="/it/blog/intelligenza-artificiale-note-iphone" position="answer" ui={ui.cta} title="Vuoi usare ChatGPT o Claude nelle tue note?"><p>Pinto Notes funziona su iPhone e Mac. Collega l'AI che usi già per cercare, leggere e modificare le note. Le modifiche si possono annullare.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Una nota di lezione sul Mac con registrazione audio, anteprima della trascrizione e appunti strutturati." caption="Una registrazione in Note con la sua trascrizione. Immagine: Apple." />}
  faq={FAQ}>
  <h2 id="funzioni">Cosa fa Apple Intelligence in Note</h2>
  <div className="tableWrap"><table><thead><tr><th>Funzione</th><th>Cosa fa</th></tr></thead><tbody>
    <tr><th>Strumenti di scrittura</th><td>Corregge, riscrive, riassume ed estrae punti chiave dal testo scelto</td></tr>
    <tr><th>Trascrizione</th><td>Scrive il parlato di una registrazione; puoi cercare e aggiungere il testo alla nota</td></tr>
    <tr><th>Riepilogo audio</th><td>Riassume la trascrizione sui dispositivi con Apple Intelligence</td></tr>
    <tr><th>Image Wand</th><td>Trasforma uno schizzo o il testo circostante in un'immagine su iPhone</td></tr>
    <tr><th>Siri AI, beta</th><td>Cerca e può agire nelle note, dove disponibile</td></tr>
  </tbody></table></div>
  <p>La trascrizione non richiede Apple Intelligence: su iPhone funziona dal modello 12 in poi, nelle lingue supportate. Per riscrivere o riassumere, seleziona il testo e apri Strumenti di scrittura. L'estensione ChatGPT, se attiva, può usare l'intera nota o solo la selezione che scegli di inviare.</p>
  <p>Per una registrazione, apri una nota e usa il pulsante degli allegati per avviare l'audio. Al termine apri la registrazione, consulta la trascrizione e aggiungila alla nota se vuoi. Sui dispositivi compatibili puoi richiedere un riepilogo. Se elimini la registrazione, elimini anche la trascrizione. La registrazione delle chiamate non è disponibile nell'Unione europea, quindi non è un modo per trascrivere una telefonata qui.</p>
  <h2 id="requisiti">Dispositivi e lingue</h2>
  <p>Per Apple Intelligence servono iPhone 15 Pro, 15 Pro Max, iPhone 16 o successivi, iPhone Air o Duo, oppure un Mac con M1 o successivo o MacBook Neo, con iOS 27 o macOS 27. Lingua del dispositivo e di Siri devono coincidere ed essere supportate. L'italiano è nella lista. Apple indica fino a 8 GB di spazio necessario, e fino a 14 GB su alcuni modelli più recenti.</p>
  <p>Le lingue dei riepiloghi audio hanno una lista più corta. Siri AI è ancora in beta e non è disponibile in italiano: Apple elenca inglese, francese, giapponese, coreano, portoghese e spagnolo. Nell'Unione europea la beta è sul Mac, non su iPhone. Alcune funzioni sui server possono avere limiti giornalieri.</p>
  <p>Per la trascrizione su iPhone, Apple elenca italiano, inglese, spagnolo, portoghese, francese, tedesco, giapponese, coreano e cinese semplificato e tradizionale. Se la trascrizione non compare, controlla il modello e la lingua rilevata. Apple dice che molte richieste di Apple Intelligence vengono elaborate sul dispositivo; quelle più grandi possono usare Private Cloud Compute, dove i dati non vengono conservati né resi accessibili ad Apple. Il resoconto di Apple Intelligence nelle impostazioni di privacy mostra le richieste inviate.</p>
  <h2 id="ricerca">La ricerca in Note è intelligente?</h2>
  <p>Anche senza AI, Note trova testo digitato e scritto a mano, testo nelle scansioni, oggetti nelle immagini e tag. Una nota protetta compare nei risultati soltanto con il titolo. Siri AI può cercare una nota dal contenuto quando la funzione è disponibile. Per la ricerca normale, apri Note e cerca una parola; per una sola nota, usa la ricerca interna e includi gli allegati se necessario.</p>
  <h2 id="chatgpt">ChatGPT e Claude nelle note</h2>
  <p>L'estensione ChatGPT negli Strumenti di scrittura riceve solo ciò che scegli di mandarle. Non può aprire liberamente tutta la raccolta. Apple non offre un'estensione analoga per Claude né un'API generale per Note. Sul Mac l'app ChatGPT può leggere la nota aperta e un'estensione di Claude può lavorare tramite l'app Note, ma l'accesso resta legato a quel Mac. <a href="/blog/claude-and-apple-notes">I limiti di Claude con Note</a> sono spiegati in inglese.</p>
  <Figure shot={SHOTS.aiEdit} caption="ChatGPT ha aggiunto cinque voci a una nota in Pinto Notes. Ogni modifica è evidenziata e annullabile." />
  <p>In Pinto Notes, ChatGPT o Claude collegati possono cercare, leggere e modificare le note da telefono, web o computer. L'app non ha una propria AI. Conserva ogni versione precedente, usa file Markdown e cifra le note; quelle protette restano chiuse all'AI. Importa Note di Apple sul Mac senza modificarle. <a href="/blog/connect-chatgpt-to-your-notes">La guida al collegamento</a> è in inglese.</p>
  <p>Altre guide: <a href="/blog/siri-ai-apple-notes">Siri AI e Note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
