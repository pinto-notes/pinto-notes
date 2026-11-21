import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "note-condivise-iphone-non-funziona");

// Italian version of /blog/apple-notes-unable-to-start-collaboration (21 Nov 2026). Search words, Google autocomplete
// (hl=it, gl=it) on 21 Nov: "impossibile avviare la collaborazione" (with or without "note") and "non riesco a
// collaborare note" give nothing; "note condivise iphone" gives note condivise iphone non si aggiorna, note condivise
// iphone non funziona, note condivise iphone come fare, creare note condivise iphone; "collaborare note iphone" and
// "collaborazione note iphone" exist; "condividere note iphone" gives non riesco a condividere note iphone. So the slug
// and title say "note condivise iphone non funziona", and the text names "collaborare" too. The words of the error
// message aren't in Notes' Italian strings on this Mac (macOS 27.2, the app's .loctable files) or in Apple's Italian
// pages, so the post describes the message and doesn't quote it. Apple's own Italian words, all read 21 Nov 2026, from
// the same pages the English post cites: support.apple.com/it-it/102462 ("Se non riesci a collaborare nell'app Note",
// published 13 Nov 2026: the device checks, Salvati su iCloud, Sincronizza questo [dispositivo], the Tutto iCloud
// folder, the pulsante Condividi, Condividi un link or Invia una copia, "Le persone che scegli possono modificare il
// contenuto", the pulsante Collabora, Gestisci nota condivisa, Aggiungi partecipante; on iOS 26 or earlier Collabora or
// Invia copia, "Solo le persone invitate possono eseguire modifiche.", Messaggi or Mail; pending requests; locked notes;
// Apple devices only on iOS 26 or earlier; 100 people); the iPhone guide it-it/guide/iphone/iphe4d04f674/ios
// ("Condividere note e collaborare su iPhone": participants signed in with Note on in iCloud, Persone che scegli,
// Chiunque disponga del link, Modifica or Solo visualizzazione e download, an access request emails the owner,
// stopping sharing removes the note from the others' devices) and iphf177bb154/ios ("Proteggere le note su iPhone":
// the note's menu, Rimuovi; notes shared in iCloud can't be locked; open with Face ID, Touch ID, the passcode or the
// Notes password); the Mac guide it-it/guide/notes/apd4e6e2c9a6/mac ("Collaborare con note e cartelle condivise":
// upgraded iCloud notes, the menu a comparsa, Condividi un link, Può modificare or Può visualizzare e scaricare,
// Condividi cartella, click the link then Apri, the invitation address must be on your Apple Account, two-factor and
// the portachiavi iCloud for instant changes, mentions need iOS 14.5 or macOS 11.3), apd881ec5518/mac (Interrompi
// condivisione), glosedbd72f8/mac ("Note di iCloud aggiornate": the Aggiorna button, no adding people until you
// upgrade, OS X 10.11 and iOS 9) and apd5be85b5ce/mac ("Perché le note sono nascoste su alcuni dispositivi"); the Mac
// help page it-it/guide/mac-help/mchl267b6234/mac ("Invia link di verifica"); and the iCloud guide it-it/guide/icloud/
// mmc0cd6c83 (participants need an Apple Account) and mmf181271571 ("Accetta invito", ask the owner to send it again).
// The Upgrade button's Italian name, Aggiorna, is also the string in Notes' Localizable.loctable on macOS 27. The Mac
// iCloud path and the owner's-storage message are from the Italian not-syncing post. Pinto side: the facts in
// share-a-note-and-edit-it-together (1.4); the app's buttons stay in English. Links go to the Italian posts on moving
// notes to iCloud and on syncing; the rest go to English posts. Facts are the English post's; the pictures are its
// English ones, described in Italian.

const ui = UI.it;

const FAQ = [
  { q: "Cosa vuol dire quando Note non riesce ad avviare la collaborazione?", a: [
    "Apple non spiega quel messaggio. Il suo articolo sui problemi di collaborazione elenca cosa controllare: entrambi con l’ultima versione di iOS, con l’accesso a un Apple Account e Note attivo per iCloud, la nota su iCloud e non protetta, e meno di 100 persone nella nota.",
  ] },
  { q: "Perché in Note su iOS 27 non c’è l’opzione Collabora?", a: [
    "Su iOS 27 si chiama Condividi un link. Tocca il pulsante Condividi, poi il menu sotto il titolo della nota, e scegli Condividi un link. Collabora è quello che compare nello stesso punto da iOS 18 a iOS 26.",
  ] },
  { q: "Posso collaborare su una nota con chi non ha un iPhone?", a: [
    "Apple dice che i partecipanti hanno bisogno di un Apple Account per vedere e modificare una nota condivisa. Su iOS 26 o precedenti, puoi collaborare solo con chi ha un dispositivo Apple collegato a un Apple Account. Altrimenti, invia una copia della nota per email o con un messaggio.",
  ] },
  { q: "Perché non riesco ad aprire una nota che qualcuno ha condiviso con me?", a: [
    "Il più delle volte l’invito è arrivato a un indirizzo email o a un numero di telefono che non è associato al tuo Apple Account. Aggiungilo al tuo account quando Note te lo chiede, oppure chiedi al proprietario di inviarti di nuovo l’invito all’indirizzo che usa il tuo Apple Account.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="note-condivise-iphone-non-funziona"
      intro={<>
        Tocchi Condividi su una nota e Note dice che non riesce ad avviare la collaborazione, oppure l’opzione Collabora non c’è proprio.
        Ecco i controlli di Apple, dal più probabile.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#controlli", label: "I controlli in ordine" },
          { href: "#iphone", label: "Iniziare su iPhone" },
          { href: "#mac", label: "Iniziare sul Mac" },
          { href: "#non-si-apre", label: "Una nota condivisa non si apre" },
        ]}>
          <p>
            Per collaborare in Note di Apple serve una nota su iCloud che non sia protetta, e tutti devono aver fatto l’accesso a un Apple
            Account con Note attivo per iCloud. Apple chiede anche che entrambi abbiate l’ultima versione di iOS. Su iOS 27 l’opzione si
            chiama Condividi un link: se cerchi Collabora, è quella.
          </p>
          <PostCta slug="it/note-condivise-iphone-non-funziona" path="/it/blog/note-condivise-iphone-non-funziona" position="answer" ui={ui.cta}
            title="Vuoi condividere una nota con un link?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Invii il link a una nota, e le persone che inviti ci scrivono con te, con il loro cursore visibile mentre scrivono. Le note condivise sono cifrate.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Due icone di note disegnate, ciascuna con una persona sopra, unite da una linea tratteggiata con un simbolo di pausa al centro."
        caption="Una nota condivisa ha bisogno delle stesse poche cose da tutte e due le parti prima di partire." />}
      faq={FAQ}
    >
      <h2 id="controlli">I controlli, in ordine</h2>
      <p>
        Apple non documenta il messaggio che dice che la collaborazione non si può avviare, quindi dal messaggio da solo nessuno può dirti
        quale controllo è fallito. Questi sono i requisiti che Apple elenca, nell’ordine in cui conviene provarli.
      </p>
      <Steps>
        <li id="opzione">
          <strong>Stai scegliendo l’opzione giusta</strong>
          Su iOS 27, tocca il pulsante Condividi, poi il menu sotto il titolo della nota, e scegli Condividi un link. Invia una copia manda
          una copia che nessun altro può modificare. Da iOS 18 a iOS 26 lo stesso menu dice Collabora o Invia copia.
        </li>
        <li id="su-icloud">
          <strong>La nota è su iCloud</strong>
          I passaggi di Apple partono dalla cartella Tutto iCloud, e la guida per il Mac dice che per collaborare servono le note di
          iCloud aggiornate. Una nota sotto Su iPhone, Sul mio Mac o un account Gmail non è su iCloud.{" "}
          <a href="/it/blog/spostare-note-iphone-su-icloud">Spostala in una cartella di iCloud</a> prima.
        </li>
        <li id="protetta">
          <strong>La nota non è protetta</strong>
          Non puoi collaborare su una nota protetta, né su una cartella che contiene una nota protetta. Apri la nota e sbloccala con la
          password, Face ID o Touch ID, poi apri il menu della nota e tocca Rimuovi.
        </li>
        <li id="icloud-attivo">
          <strong>Hai fatto l’accesso, con Note attivo per iCloud</strong>
          Apri Impostazioni, tocca il tuo nome, poi iCloud. Sotto Salvati su iCloud, tocca Note e controlla che Sincronizza questo iPhone
          sia attivo. Apple dice che serve anche alle persone che inviti.
        </li>
        <li id="aggiorna">
          <strong>Entrambi avete l’ultima versione di iOS</strong>
          Apple chiede l’ultima versione di iOS sul tuo iPhone e su quello dell’altra persona. I passaggi con Collabora, per iOS 26 e
          precedenti, richiedono iOS 18 o successivo.
        </li>
        <li id="altra-persona">
          <strong>L’altra persona ha un Apple Account</strong>
          I partecipanti hanno bisogno di un Apple Account per vedere e modificare una nota condivisa. Su iOS 26 o precedenti, Apple dice
          che puoi collaborare solo con chi ha un dispositivo Apple collegato a un Apple Account. Se non ce l’ha, invia una copia.
        </li>
        <li id="in-sospeso">
          <strong>La tua richiesta non è ancora in sospeso</strong>
          Se su iOS 27 hai chiesto l’accesso alla nota di qualcuno, la richiesta può essere in sospeso. Il proprietario la vede toccando il
          pulsante Collabora, e Apple dice che la richiesta manda anche un’email all’indirizzo dell’Apple Account del proprietario.
        </li>
        <li id="limite">
          <strong>La nota ha ancora posto</strong>
          Fino a 100 persone possono collaborare a una nota.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="Il menu More di una nota sbloccata in Note su iPhone, con Remove evidenziato in alto accanto a Scan e Pin Note."
        caption="Rimuovi toglie la protezione da una nota sbloccata, così si può condividere. Immagine: Apple." />
      <p>
        La guida di Apple per iPhone dice anche che le note condivise su iCloud non si possono proteggere, quindi non puoi rimettere la
        protezione finché la nota è condivisa.
      </p>

      <h2 id="iphone">Iniziare a collaborare su iPhone</h2>
      <p className="label" id="iphone-ios-27"><strong>iOS 27</strong></p>
      <Steps>
        <li>In Note, vai nella cartella Tutto iCloud e apri la nota.</li>
        <li>Tocca il pulsante Condividi in alto.</li>
        <li>Sotto il titolo della nota, scegli Condividi un link.</li>
        <li>Per cambiare chi può entrare, tocca &ldquo;Le persone che scegli possono modificare il contenuto&rdquo;. Scegli Persone che scegli o Chiunque disponga del link, e Modifica o Solo visualizzazione e download.</li>
        <li>Scegli come inviare l’invito. Il primo partecipante entra automaticamente. Per aggiungerne altri, tocca il pulsante Collabora, poi Gestisci nota condivisa, poi Aggiungi partecipante.</li>
      </Steps>
      <p className="label" id="iphone-ios-26"><strong>Da iOS 18 a iOS 26</strong></p>
      <Steps>
        <li>In Note, vai nella cartella Tutto iCloud e apri la nota.</li>
        <li>Tocca il pulsante Condividi, poi scegli Collabora sotto il titolo della nota.</li>
        <li>Tocca &ldquo;Solo le persone invitate possono eseguire modifiche.&rdquo; per scegliere chi può accedere, cosa può fare e se può invitare altri.</li>
        <li>Invia l’invito con Messaggi o Mail.</li>
      </Steps>
      <p>
        I passaggi vengono da <a href="https://support.apple.com/it-it/102462" rel="noopener">Se non riesci a collaborare nell’app
        Note</a> e dalla pagina <a href="https://support.apple.com/it-it/guide/iphone/iphe4d04f674/ios" rel="noopener">Condividere note e
        collaborare su iPhone</a> della guida di Apple.
      </p>

      <h2 id="mac">Iniziare a collaborare sul Mac</h2>
      <Steps>
        <li>Apri la nota, poi fai clic sul pulsante Condividi nella barra strumenti.</li>
        <li>Fai clic sul menu a comparsa e scegli Condividi un link.</li>
        <li>Fai clic su &ldquo;Le persone che scegli possono modificare il contenuto&rdquo; per scegliere chi può accedere, e Può modificare o Può visualizzare e scaricare.</li>
        <li>Invia il link come preferisci. Per condividere una cartella intera, fai clic sulla cartella tenendo premuto il tasto Ctrl e scegli Condividi cartella.</li>
      </Steps>
      <p>
        Se accanto a iCloud nella barra laterale di Note c’è un pulsante Aggiorna, le tue note di iCloud non sono state aggiornate, e Apple
        dice che non puoi aggiungere persone alle note finché non le aggiorni. Le note aggiornate non si aprono sui dispositivi più vecchi
        di OS X 10.11 o iOS 9.
      </p>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Note di Apple su macOS 27 senza iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Pulsanti System Settings e Cancel."
        caption="Cosa mostra Note su un Mac dove iCloud è disattivato per Note. Attivalo prima di condividere." />
      <Paths rows={[
        { on: "Mac, macOS 15 o successivo", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note"] },
      ]} />

      <h2 id="non-si-apre">Quando non riesci ad aprire una nota condivisa con te</h2>
      <ul>
        <li><strong>Aprila dal link.</strong> Sul Mac, fai clic sul link che hai ricevuto, poi su Apri. Su icloud.com/notes, seleziona il link, poi Accetta invito. Dopo la prima volta, la nota resta nell’elenco delle note su ogni iPhone e Mac collegato allo stesso Apple Account.</li>
        <li><strong>Controlla l’indirizzo a cui è arrivata.</strong> Puoi aprire una nota condivisa solo se l’indirizzo email o il numero di telefono a cui è arrivato l’invito è associato al tuo Apple Account. Note ti chiede di aggiungerlo, e sul Mac Impostazioni di Sistema ti manda prima un link di verifica con Invia link di verifica. Oppure chiedi al proprietario di inviarti di nuovo l’invito all’indirizzo che usi.</li>
        <li><strong>Aggiorna il dispositivo.</strong> Una nota con un tag, una menzione o un link che mostra il titolo di un’altra nota si vede solo su iOS 14.5, macOS 11.3 o successivi. Sui dispositivi più vecchi è nascosta, per te e per tutti quelli con cui è condivisa.</li>
        <li><strong>Chiedi al proprietario.</strong> Quando il proprietario interrompe la condivisione, Apple dice che la nota viene rimossa dai dispositivi delle altre persone.</li>
      </ul>

      <h2 id="non-si-aggiorna">Quando si apre ma non si aggiorna</h2>
      <p>
        La guida di Apple per il Mac dice che chi ha attivato l’autenticazione a due fattori e il portachiavi iCloud vede subito le
        modifiche degli altri. Una nota condivisa sta nell’iCloud del suo proprietario, quindi quando il suo spazio è esaurito, Note sul Mac
        dice che le tue modifiche sono salvate sul tuo dispositivo e verranno caricate quando il proprietario libera spazio.{" "}
        <a href="/it/blog/note-iphone-non-sincronizzate">Note di iPhone non sincronizzate con il Mac</a> ha il resto dei controlli sulla
        sincronizzazione.
      </p>

      <h2 id="pinto-notes">Condividere una nota in Pinto Notes</h2>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="Il foglio Share di Pinto Notes su iPhone: Emil come proprietario, Sara che può modificare e Jonas che può vedere, un pulsante Invite People, e Join by Link impostato su Can edit."
        caption="Share, poi Collaborate, in Pinto Notes su iPhone." />
      <p>
        Pinto Notes, un’app di note che si presenta e funziona come Note di Apple su iPhone e Mac, condivide una nota con un link. Su
        iPhone, tocca Share, poi Collaborate, poi Invite People, e invia il link come preferisci. Join by Link decide se il link permette di
        modificare o solo di vedere, e Off vuol dire che solo chi è già nella nota può aprirla. Il cursore di ognuno compare nella nota con
        il suo nome mentre scrive, e la nota è cifrata con una chiave tutta sua. Se qualcuno nella nota ha{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a> (in inglese), anche la sua AI può scriverci, con il
        segno di chi è.
      </p>
      <p>
        Ha i suoi limiti. Tutti scrivono da Pinto Notes su iPhone o Mac; chi apre il link senza l’app trova le istruzioni per scaricarla ed
        entrare. Una nota con file, foto o un’app dentro non si può ancora condividere, e una nota condivisa non si può proteggere.{" "}
        <a href="/blog/share-a-note-and-edit-it-together">Share a note and edit it together</a> (in inglese) ha i dettagli. Le tue note di
        Apple arrivano con una sola importazione sul Mac (<a href="/blog/move-from-apple-notes">passare da Note di Apple</a>, in inglese),
        e Note di Apple resta com’era. L’app è in inglese.
      </p>
    </LocalPostPage>
  );
}
