import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "proteggere-cartella-note-iphone");
// Italian version of /blog/apple-notes-lock-folder. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "proteggere cartella note iphone" suggested itself; "bloccare cartella note iphone"
// returned none. Title follows the first phrase.
// Apple it-it read 21 Nov: 102537 (Altro > Proteggi, Visualizza nota, Rimuovi),
// iphone/iphf177bb154/ios (solo il titolo resta visibile), notes/not28c5f5468/mac
// (Note > Impostazioni, Note protette, Utilizza password di login, Usa password personalizzata,
// Proteggi nota), notes/apd58edc7964/mac (cartelle smart non proteggibili),
// iphone/iph00f208d05/ios (Richiedi Face ID/Touch ID/codice per l'app).
// No Apple source describes a folder lock, so none is named. Pictures follow English.
const ui = UI.it;
const FAQ = [
  { q: "Posso proteggere una cartella intera di Note?", a: ["No. Note protegge le singole note. Devi aprirle e applicare la protezione una per una; le nuove note della cartella non la ereditano."] },
  { q: "Come apro una nota protetta?", a: ["Tocca Visualizza nota e usa la password, Face ID o Touch ID, secondo le impostazioni del dispositivo. Il titolo resta visibile anche quando il contenuto è chiuso."] },
  { q: "Perché una nota non si può proteggere?", a: ["Succede con note condivise, tag, alcuni allegati, note rapide e note di account come Gmail o Yahoo. Apple elenca le eccezioni nelle sue guide."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="proteggere-cartella-note-iphone"
  intro={<>Hai una cartella di note riservate e vuoi chiuderla? Note di Apple non offre un lucchetto per la cartella. Puoi proteggere ogni nota e, su iPhone, bloccare l'accesso all'app.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#cosa", label: "Cosa si può proteggere" }, { href: "#metodo", label: "Scegli il metodo" },
    { href: "#note", label: "Proteggi le note" }, { href: "#limiti", label: "Eccezioni" },
    { href: "#app", label: "Blocca l'app" }, { href: "#pinto", label: "Pinto Notes" },
  ]}><p>Una cartella intera non si può proteggere. Metti le note riservate nella stessa cartella per trovarle, poi proteggile una per una. Le note nuove non si chiudono automaticamente. Puoi usare password, Face ID o Touch ID, con il codice del dispositivo dove previsto.</p>
    <PostCta slug="it/proteggere-cartella-note-iphone" path="/it/blog/proteggere-cartella-note-iphone" position="answer" ui={ui.cta} title="Vuoi note protette anche dalla tua AI?"><p>Pinto Notes protegge le singole note con password, Face ID o Touch ID. Quando sono chiuse, ChatGPT o Claude non ne leggono il contenuto.</p></PostCta>
  </Answer>}
  hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760} phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }} alt="Note sul Mac con una cartella aperta e una nota protetta nell'elenco; il contenuto chiede la password e mostra un suggerimento." caption="La cartella e il titolo restano visibili. Solo il contenuto della nota è protetto." />}
  faq={FAQ}>
  <h2 id="cosa">Cosa protegge Note di Apple</h2>
  <p>La protezione riguarda il contenuto di una nota, non la cartella. Il titolo resta nell'elenco e la ricerca vede solo quello. Una cartella smart non si può proteggere. Se condividi una cartella, le note al suo interno diventano condivise: una nota protetta non si può usare per collaborare.</p>
  <h2 id="metodo">Scegli come aprire le note</h2>
  <p>Su iPhone, in Impostazioni &gt; App &gt; Note &gt; Password scegli il codice del dispositivo o una password personalizzata. Attiva Face ID o Touch ID se disponibile. Sul Mac, in Note &gt; Impostazioni, per Note protette puoi usare la password di login o una password personalizzata e, se disponibile, Touch ID. Il metodo vale per l'account scelto. Se dimentichi una password personalizzata, Apple non può aprire le note già protette; reimpostarla serve solo per quelle future.</p>
  <h2 id="note">Proteggi ogni nota della cartella</h2>
  <Steps><li>Su iPhone apri una nota, tocca il pulsante Altro e scegli Proteggi. Ripeti per le altre note della cartella.</li><li>Sul Mac apri una nota, usa il pulsante delle altre azioni e scegli Proteggi nota. Ripeti per le altre.</li><li>Chiudi il contenuto dopo aver finito. Aprire una nota protetta può lasciare aperte anche le altre note protette dello stesso account per alcuni minuti.</li></Steps>
  <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300} alt="Una nota protetta su iPhone con lucchetto e pulsante Visualizza nota." caption="Tocca Visualizza nota e autenticati per aprirla. Immagine: Apple." />
  <p>Per togliere la protezione, apri la nota e usa il comando Rimuovi. Se vuoi ritrovare le note chiuse, dai loro titoli non sensibili: il titolo resta visibile.</p>
  <h2 id="limiti">Perché alcune note non si possono proteggere</h2>
  <p>Apple esclude le note di account IMAP come Gmail e Yahoo, le note condivise, quelle con tag e certi allegati come PDF, audio, video o documenti. Anche le note rapide e alcune note che usano funzioni recenti non si possono proteggere. Sposta una nota da Gmail a iCloud se l'account è il problema: <a href="/it/blog/spostare-note-iphone-su-icloud">ecco come</a>. Non rimuovere allegati senza averne una copia.</p>
  <h2 id="app">Bloccare tutta l'app su iPhone</h2>
  <p>Nella schermata Home tieni premuta l'icona di Note e scegli Richiedi Face ID, Richiedi Touch ID o Richiedi codice, secondo il telefono. L'app si blocca di nuovo quando la chiudi. Questo blocco vale solo su quell'iPhone e non si sincronizza con iCloud; non sostituisce la protezione delle singole note. Le app integrate non si possono nascondere.</p>
  <h2 id="pinto">Note protette in Pinto Notes</h2>
  <Figure shot={SHOTS.notesPassword} caption="Impostazione della password delle note protette in Pinto Notes sul Mac. La password non è recuperabile se la dimentichi." />
  <p>Pinto Notes protegge note singole, non cartelle. Le note chiuse sono cifrate una seconda volta con una chiave derivata dalla password; l'AI non può leggerne il contenuto. Sul telefono puoi aprirle con password, Face ID o Touch ID. Le note protette di Apple non entrano nell'importazione automatica: restano in Note. <a href="/it/blog/password-note-iphone-dimenticata">Se hai dimenticato la password delle note di Apple</a>, leggi la guida in italiano.</p>
  <p>Altre guide: <a href="/blog/apple-notes-tags-smart-folders">tag e cartelle smart</a> (in inglese), <a href="/blog/encrypted-notes-app-for-ai">note cifrate e AI</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
