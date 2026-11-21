import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "trascrivere-audio-note-iphone");
// Italian version of /blog/apple-notes-record-and-transcribe. Google autocomplete hl=it,
// gl=it, 21 Nov 2026: "trascrivere audio note iphone" returned "trascrivere note audio iphone"
// and "come trascrivere audio su note iphone".
// Apple it-it read 21 Nov: iphone/iphbe11247b5/ios (Registra audio, Trova nella trascrizione,
// Aggiungi trascrizione alla nota, Copia trascrizione), notes/apdb5106e334/mac (Mac),
// iphone/iph57c6590e9/ios (chiamate), 121115 (Apple Intelligence).
// iPhone and Mac recording controls are icon-only in Apple's localized guide; described by function.
const ui = UI.it;
const FOLLOW_UP = `Usa la mia nota "Appunti di riunione" in Pinto Notes. Incollerò qui la trascrizione.
Aggiungi nome e data della riunione, un riepilogo di due righe e le decisioni sotto Riunioni, dalla più recente.
Metti ogni attività in un elenco di controllo sotto Azioni, nel formato "Responsabile: attività (scadenza)".
Se qualcosa non è chiaro, chiedimi prima di scrivere.`;
const FAQ = [
  { q: "Serve Apple Intelligence per trascrivere audio?", a: ["No. La trascrizione funziona su iPhone 12 o successivo o su un Mac con M1 o successivo, con una lingua supportata. Apple Intelligence serve per il riepilogo."] },
  { q: "Dove finiscono le registrazioni delle chiamate?", a: ["Nella cartella delle registrazioni delle chiamate in Note. La funzione non è disponibile nell'Unione europea, quindi non puoi usarla in Italia."] },
  { q: "Posso scrivere mentre registro?", a: ["Sì. Su iPhone scorri verso il basso dalla schermata di registrazione. Sul Mac puoi continuare a modificare la nota."] },
  { q: "Se elimino l'audio perdo la trascrizione?", a: ["Sì. Apple dice che eliminando una registrazione elimini anche la trascrizione. Prima copiala o aggiungila al testo della nota."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="trascrivere-audio-note-iphone"
  intro={<>In Note puoi registrare audio e leggere la trascrizione. Servono iPhone 12 o successivo, oppure un Mac con M1 o successivo, e una lingua supportata.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#iphone", label: "Su iPhone" }, { href: "#mac", label: "Sul Mac" },
    { href: "#requisiti", label: "Requisiti" }, { href: "#testo", label: "Usare il testo" },
    { href: "#chiamate", label: "Chiamate" },
  ]}><p>In una nota scegli Registra audio e avvia la registrazione. Note trascrive le lingue supportate: puoi copiare il testo o aggiungerlo alla nota. La trascrizione non richiede Apple Intelligence; il riepilogo sì.</p>
    <PostCta slug="it/trascrivere-audio-note-iphone" path="/it/blog/trascrivere-audio-note-iphone" position="answer" template="meeting-notes" ui={ui.cta} title="Trasforma la trascrizione in attività"><p>Pinto Notes ha un modello gratuito per gli appunti di riunione. Dopo aver collegato ChatGPT o Claude, incolla la trascrizione per ottenere riepilogo, decisioni e attività con responsabili e scadenze.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Note sul Mac con registrazione audio di una lezione, anteprima della trascrizione e riepilogo." caption="Una registrazione e la sua trascrizione in Note sul Mac. Immagine: Apple." />}
  faq={FAQ}>
  <h2 id="iphone">Registrare e trascrivere su iPhone</h2>
  <Paths rows={[{ on: "iPhone", steps: ["Note", "Allegati", "Registra audio"] }]} />
  <Steps><li>Apri una nota, tocca il pulsante Allegati e scegli Registra audio.</li><li>Tocca il pulsante di registrazione. Per leggere le parole mentre parli, tocca il pulsante della trascrizione.</li><li>Per scrivere nella nota durante la registrazione, scorri verso il basso dalla parte alta dello schermo.</li><li>Quando hai finito, metti in pausa e tocca il pulsante per terminare.</li></Steps>
  <p>La <a href="https://support.apple.com/it-it/guide/iphone/iphbe11247b5/ios">guida Apple per iPhone</a> mostra questi controlli. Durante una riunione annota le decisioni, poi verifica le parole ascoltando l'audio.</p>
  <h2 id="mac">Registrare audio sul Mac</h2>
  <p>In una nota fai clic sul pulsante Allegati nella barra degli strumenti e scegli Registra audio. Avvia la registrazione e continua a scrivere nella nota, se serve. Puoi aprire la trascrizione in diretta. Alla fine metti in pausa e fai clic sul pulsante per terminare. Per riaprirla, fai doppio clic sulla registrazione. Apple spiega i passaggi nella <a href="https://support.apple.com/it-it/guide/notes/apdb5106e334/mac">guida per Mac</a>. Tutte le funzioni descritte sono disponibili con note iCloud; altri account potrebbero non averle.</p>
  <h2 id="requisiti">Dispositivi e lingue supportate</h2>
  <p>Le guide Apple per iOS 27 e macOS 27 richiedono iPhone 12 o successivo oppure un Mac con M1 o successivo. La trascrizione supporta l'italiano e altre nove lingue: inglese, spagnolo, portoghese, francese, tedesco, giapponese, coreano, cinese semplificato e tradizionale. Per l'inglese sul Mac Apple elenca anche le varianti regionali.</p>
  <p>Se non vedi il pulsante della trascrizione, il dispositivo potrebbe non rispettare i requisiti o non riconoscere una lingua supportata. La trascrizione delle chiamate ha requisiti separati. Anche il riepilogo richiede un dispositivo compatibile con <a href="https://support.apple.com/it-it/121115">Apple Intelligence</a>: iPhone 15 Pro o Pro Max, modelli iPhone 16 o successivi compatibili, iPhone Air o Duo, oppure un Mac con M1 o successivo o MacBook Neo. Le lingue di dispositivo e Siri devono coincidere. Controlla la <a href="https://www.apple.com/it/ios/feature-availability/#apple-intelligence-notes-transcription">disponibilità dei riepiloghi</a> e la guida alle <a href="/it/blog/intelligenza-artificiale-note-iphone">funzioni AI di Note</a>.</p>
  <h2 id="testo">Copiare e cercare nella trascrizione</h2>
  <p>Apri la registrazione e mostra la trascrizione. Nel menu Altro scegli Aggiungi trascrizione alla nota o Copia trascrizione. Trova nella trascrizione cerca le parole nell'audio; toccando il testo ascolti quel punto. Su un dispositivo compatibile puoi aprire il riepilogo della registrazione. Controlla nomi e decisioni confrontandoli con l'audio.</p>
  <h2 id="chiamate">Registrare una chiamata</h2>
  <p>La registrazione delle chiamate parte dall'app Telefono, non da Note. La <a href="https://support.apple.com/it-it/guide/iphone/iph57c6590e9/ios">guida Apple</a> indica che non è disponibile nell'Unione europea. Dove è disponibile, si avvia dal menu Altro durante una chiamata a due; entrambi sentono un avviso. La registrazione finisce nella cartella dedicata in Note. La trascrizione può richiedere tempo, distingue le persone che parlano e richiede iOS 18.1 o successivo per le chiamate Telefono e FaceTime.</p>
  <h2 id="limiti">Controllare il testo prima di usarlo</h2>
  <p>Una trascrizione può contenere errori. Tieni l'audio finché hai controllato parole, nomi e decisioni. Se elimini la registrazione, elimini anche la trascrizione; copia il testo prima. Il <a href="/it/blog/appunti-riunione-note-iphone">modello per appunti di riunione</a> aiuta a mettere in ordine attività e decisioni.</p>
  <h2 id="pinto">Dalla trascrizione alle attività</h2>
  <p>Il <a href="/templates/meeting-notes">modello gratuito di Pinto Notes</a> mette le azioni aperte in alto e le riunioni sotto, dalla più recente. Incolla la trascrizione verificata in ChatGPT o Claude dopo averlo <a href="/blog/connect-chatgpt-to-your-notes">collegato a Pinto Notes</a>. Il modello chiede un riepilogo di due righe, decisioni e attività con responsabile e scadenza. Se manca un dato, chiede chiarimenti.</p>
  <Keep title="Richiesta per ChatGPT o Claude" text={FOLLOW_UP} note="Aggiungi prima il modello per riunioni, poi incolla la richiesta e la trascrizione." copyLabel="Copia" />
  <p>Più tardi puoi chiedere quali attività sono ancora aperte o far spuntare quella completata. Pinto Notes conserva le versioni precedenti. Puoi <a href="/blog/move-from-apple-notes">importare Note di Apple</a> sul Mac senza cambiarle.</p>
  </LocalPostPage>; }
