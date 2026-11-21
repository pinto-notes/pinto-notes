import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "note-iphone-sparite");

// Italian version of /blog/apple-notes-disappeared (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "note iphone sparite" gives note iphone sparite dopo aggiornamento, cartelle note iphone sparite, app note
// iphone sparite, note icloud iphone sparite, recuperare note iphone sparite; "note sparite" gives note sparite da
// iphone, note sparite da icloud, note sparite su iphone; "note scomparse iphone" also exists, smaller. So the slug and
// title say "note iphone sparite". Apple's own Italian words, all read 21 Nov 2026, from the same pages the English
// post cites: support.apple.com/it-it/102476 ("Se non trovi le note": Account di Note, Eliminate di recente, Sposta,
// the Cestino in Mail, Tutti gli account, the search bar, locked notes show only their title), it-it/121669 ("Se non
// vengono visualizzate le note di iCloud nell'app Note": Sincronizza questo [dispositivo], restart, check again),
// it-it/118582 ("Eliminare le app Apple integrate": Notes is on the list, deleting a built-in app deletes its user
// data, the Scarica di nuovo button, the exact name in the App Store); the iPhone guide it-it/guide/iphone/
// iph7262fd4fe/ios (Impostazioni, App, Note, Account Note; Mostra tutto next to Salvate su iCloud; the Su iPhone
// account is in iCloud backups), iph904eee369/ios (Eliminate di recente for 30 days, Sposta, a shared note you
// deleted reopens from the original link), iph92579feda/ios (Account di default for Siri and the Notes widget),
// iph87abad19a/ios (libreria app: swipe left past every page, the search field, touch and hold until the icons move)
// and iph248b543ca/ios (an app removed from the Home Screen moves to the libreria app; iCloud data stays when you
// delete an app); the Mac guide it-it/guide/notes/not85d6f7b58/mac (Note > Account, turn off Note, notes unavailable
// while off), notc3b2d538b/mac (the Eliminate folder, no Eliminate folder for notes not upgraded or in other
// accounts), not5585d71a8/mac (drag a note out of Eliminate; a note the owner shared is deleted from everyone's
// devices) and apd8b73d28be/mac (Vista > Mostra barra laterale, the button over the account name); and the iCloud
// guide it-it/guide/icloud/mm8685520792 (Sincronizza questo Mac). Locked notes: "la password, Face ID o Touch ID"
// (it-it/guide/iphone/iphf177bb154/ios). Links go to the Italian posts on syncing and moving notes to iCloud; the rest
// go to English posts. Facts are the English post's; the pictures are its English ones, described in Italian.

const ui = UI.it;

const FAQ = [
  { q: "Perché sono sparite tutte le note dal mio iPhone?", a: [
    "Apple dice che le note mancanti possono essere state eliminate per errore, oppure che va cambiata un’impostazione. Controlla che Note sia attivo per iCloud (Impostazioni, il tuo nome, iCloud), guarda in Eliminate di recente e assicurati che Note sia attivo anche per gli altri account, come Gmail o Yahoo.",
  ] },
  { q: "Le note sono sparite dopo un aggiornamento. Cosa faccio?", a: [
    "I passaggi di Apple per le note mancanti partono dall’aggiornare ogni dispositivo all’ultima versione di iOS e macOS. Poi controlla che Note sia ancora attivo per iCloud e che tu abbia fatto l’accesso con lo stesso Apple Account di prima. Se le note mancano ancora, Apple dice di riavviare l’iPhone e controllare di nuovo l’impostazione.",
  ] },
  { q: "Come faccio a riavere l’app Note su iPhone?", a: [
    "Scorri verso sinistra oltre l’ultima pagina della schermata Home fino alla libreria app e cerca Note. Se c’è, tienila premuta per riportarla sulla schermata Home. Se l’hai eliminata, apri l’App Store, cerca Note e tocca il tasto Scarica di nuovo.",
  ] },
  { q: "Eliminare l’app Note elimina anche le note?", a: [
    "Apple dice che eliminare un’app integrata elimina anche i suoi dati su quel dispositivo, mentre i dati salvati su iCloud non vengono eliminati con l’app. Le note di iCloud sono anche su icloud.com/notes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="note-iphone-sparite"
      intro={<>
        Ieri le note c’erano, oggi l’elenco è vuoto o manca una cartella. Secondo Apple, le note mancanti sono state eliminate per
        errore oppure va cambiata un’impostazione. Questi controlli coprono tutti e due i casi, dal più veloce.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#controlli", label: "I controlli in ordine" },
          { href: "#sul-mac", label: "Sul Mac" },
          { href: "#app-sparita", label: "L’app non c’è più" },
          { href: "#pinto-notes", label: "Una seconda copia" },
        ]}>
          <p>
            Prima controlla che Note sia attivo per iCloud, poi apri Eliminate di recente, dove una nota eliminata resta per 30 giorni.
            Dopo, assicurati che Note sia attivo per gli altri account, come Gmail, e che ogni dispositivo usi lo stesso Apple Account.
            Se è sparita l’app Note, la trovi nella libreria app o nell’App Store.
          </p>
          <PostCta slug="it/note-iphone-sparite" path="/it/blog/note-iphone-sparite" position="answer" ui={ui.cta}
            title="Vuoi che ogni versione delle tue note resti?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac e tiene ogni versione precedente di ogni nota. Sul Mac può importare le tue note di Apple una volta, come seconda copia, e Note di Apple resta com’era.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Note di Apple su macOS 27 senza iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Pulsanti System Settings e Cancel."
        caption="Cosa mostra Note su un Mac dove Note è disattivato per iCloud. Le note sono ancora su iCloud: questo Mac semplicemente non le mostra." />}
      faq={FAQ}
    >
      <h2 id="controlli">I controlli, in ordine</h2>
      <p>
        L’<a href="https://support.apple.com/it-it/102476" rel="noopener">articolo di Apple sulle note che non trovi</a> mette un passaggio
        prima di tutti questi: aggiorna ogni dispositivo all’ultima versione di iOS o macOS, così il problema non dipende da un software
        vecchio. Poi scendi lungo l’elenco.
      </p>
      <Steps>
        <li id="icloud-attivo">
          <strong>Note è attivo per iCloud</strong>
          Se le note di iCloud non compaiono, la soluzione di Apple è controllare che Sincronizza questo iPhone sia attivo, poi guardare
          in Note. Se non si vedono ancora, riavvia l’iPhone e controlla di nuovo l’impostazione. Apple dice che a quel punto le note
          dovrebbero comparire e ricominciare a sincronizzarsi, e che quello che era già su iCloud torna al termine della sincronizzazione.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Mostra tutto", "Note", "Sincronizza questo iPhone"] },
            { on: "Mac, macOS 15 o successivo", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note", "Sincronizza questo Mac"] },
          ]} />
        </li>
        <li id="eliminate-di-recente">
          <strong>Eliminate di recente</strong>
          Una nota eliminata finisce in Eliminate di recente su iPhone, su iCloud.com e sugli altri dispositivi collegati allo stesso
          Apple Account, e ci resta 30 giorni. Su iPhone, torna all’elenco delle cartelle, tocca Eliminate di recente, scorri a sinistra
          sulla nota e tocca Sposta. La cartella compare solo quando contiene qualcosa. <a href="/blog/recover-deleted-apple-notes">How
          to recover deleted Apple Notes</a> (in inglese) ha tutte le strade, anche dopo i 30 giorni.
        </li>
        <li id="ricerca">
          <strong>Cerca con Tutti gli account selezionato</strong>
          Nell’elenco delle note, tocca la barra di ricerca e scrivi una parola o il titolo, con Tutti gli account selezionato. La ricerca
          vede solo il titolo di una nota protetta, quindi apri a mano le note protette, con la password, Face ID o Touch ID. Se la
          ricerca non trova niente, tocca l’icona indietro finché vedi l’elenco Cartelle, poi apri una cartella alla volta: una nota può
          stare dove non te l’aspetti.
        </li>
        <li id="altri-account">
          <strong>Note è attivo per Gmail, Yahoo e gli altri account</strong>
          Le note di un account email si vedono solo finché Note è attivo per quell’account. Controlla ogni account. Le note eliminate lì
          non vanno in Eliminate di recente: cercale nel Cestino di quell’account nell’app Mail, poi copiale in una nota nuova.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Impostazioni", "App", "Note", "Account Note", "L’account", "Note"] },
            { on: "Mac", steps: ["Note", "Account", "L’account", "Note"] },
          ]} />
        </li>
        <li id="stesso-account">
          <strong>Ogni dispositivo usa lo stesso Apple Account</strong>
          Su un dispositivo che non ha fatto l’accesso al tuo Apple Account, le note di iCloud non si vedono. Il nome in cima a
          Impostazioni su iPhone, o in cima alla barra laterale di Impostazioni di Sistema sul Mac, è l’account che quel dispositivo usa.
          Per vedere cosa c’è su iCloud, accedi a icloud.com/notes da un browser con lo stesso account.
        </li>
        <li id="su-iphone">
          <strong>Le note stavano su un solo dispositivo</strong>
          Le note nell’account Su iPhone compaiono solo su quell’iPhone, e quelle in Sul mio Mac solo su quel Mac. Se una nota manca
          sull’altro dispositivo, guarda l’intestazione sopra la sua cartella sul dispositivo che ce l’ha.{" "}
          <a href="/it/blog/spostare-note-iphone-su-icloud">Spostare le note su iCloud</a> le porta su tutti i dispositivi.
        </li>
        <li id="riavvia">
          <strong>Riavvia, poi controlla di nuovo</strong>
          Se dopo gli interruttori qui sopra le note mancano ancora, il passaggio successivo di Apple è riavviare e controllare di nuovo
          l’impostazione di iCloud. Se le note si vedono su un dispositivo e non sull’altro, leggi{" "}
          <a href="/it/blog/note-iphone-non-sincronizzate">note di iPhone non sincronizzate con il Mac</a>.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-recently-deleted" width={760} height={894} maxWidth={300}
        alt="La cartella Recently Deleted in Note su iPhone con quattro note, sotto una riga che dice che le note eliminate vengono rimosse dopo 30 giorni e che l’eliminazione definitiva da iCloud può richiedere fino a 40 giorni in più."
        caption="Eliminate di recente su iPhone. Compare solo quando contiene una nota. Immagine: Apple." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Le impostazioni di un account Gmail su iPhone, con gli interruttori Mail, Contacts, Calendars e Notes tutti attivi."
        caption="Le note di un account email si vedono solo finché il suo interruttore Note è attivo. Immagine: Apple." />

      <h2 id="sul-mac">Note o cartelle sparite sul Mac</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="La barra laterale di Note di Apple su macOS 27 con la sola sezione On My Mac: All on My Mac, Notes, una cartella e Recently Deleted. Nessuna sezione iCloud."
        caption="Se nella barra laterale non c’è l’intestazione iCloud, questo Mac non mostra le tue note di iCloud. Controlla prima Sincronizza questo Mac." />
      <ul>
        <li><strong>Niente barra laterale.</strong> Scegli Vista &gt; Mostra barra laterale.</li>
        <li><strong>Un account senza cartelle sotto.</strong> Tieni il puntatore sul nome dell’account nella barra laterale finché compare un pulsante, poi fai clic.</li>
        <li><strong>Manca un intero account.</strong> Scegli Note &gt; Account, seleziona l’account e attiva Note. Apple dice che le note di un account non sono disponibili mentre Note è disattivato.</li>
        <li><strong>Una nota eliminata.</strong> Fai clic su Eliminate e trascina la nota in un’altra cartella della barra laterale. Se le tue note di iCloud non sono aggiornate, o la nota stava in un altro tipo di account, la cartella Eliminate non c’è, e Apple dice che le note eliminate vengono rimosse da tutti i dispositivi che usano quell’account.</li>
        <li><strong>Una nota condivisa.</strong> Se il proprietario elimina una nota che aveva condiviso, Apple dice che sparisce anche dai dispositivi di tutti i partecipanti. Se hai eliminato tu una nota condivisa con te, puoi riaprirla dal link originale, a meno che il proprietario non abbia interrotto la condivisione.</li>
      </ul>

      <h2 id="app-sparita">Quando è sparita l’app Note</h2>
      <p>
        Un’app tolta dalla schermata Home non è eliminata. Passa nella libreria app, e puoi continuare a usarla da lì.
      </p>
      <Steps>
        <li>Dalla schermata Home, scorri verso sinistra oltre tutte le pagine fino alla libreria app.</li>
        <li>Tocca il campo di ricerca in alto e scrivi Note.</li>
        <li>Per rimetterla a posto, tieni premuta l’icona finché le icone iniziano a muoversi e l’app passa sulla schermata Home, poi solleva il dito.</li>
      </Steps>
      <p>
        Note è una delle app integrate che Apple ti lascia eliminare. Se non è nella libreria app, apri l’App Store, cerca Note con il suo
        nome esatto, tocca il tasto Scarica di nuovo e aprila dalla schermata Home quando ha finito. Apple dice che eliminare un’app
        integrata elimina anche i suoi dati sul dispositivo, mentre i dati salvati su iCloud non vengono eliminati con l’app. Le note in
        Su iPhone sono incluse nei backup di iCloud dell’iPhone.
      </p>

      <h2 id="la-prossima-volta">Perché non succeda di nuovo</h2>
      <ul>
        <li>Imposta iCloud come account di default in Impostazioni, App, Note, Account di default. Decide dove finiscono le note create con Siri e con il widget di Note.</li>
        <li>Tieni una copia tua delle note che non puoi perdere. <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> (in inglese) ha una routine.</li>
      </ul>

      <h2 id="pinto-notes">Una seconda copia, con ogni versione</h2>
      <p>
        Eliminate di recente copre una nota eliminata. Non copre una nota che qualcuno ha cambiato, perché Note di Apple non ha una{" "}
        <a href="/blog/apple-notes-version-history">cronologia delle versioni</a> (in inglese). Pinto Notes, l’app di note per iPhone e
        Mac, tiene ogni versione precedente di ogni nota, così un paragrafo sparito da una nota si può ripristinare.
      </p>
      <p>
        Non riporta indietro le note già perse in Note di Apple. <a href="/blog/move-from-apple-notes">Importare da Note di Apple</a>{" "}
        (in inglese) richiede una sola importazione sul Mac e ti dà una seconda copia, e Note di Apple resta com’era. L’app è in inglese.
      </p>
      <Figure shot={{ ...SHOTS.history, alt: "La cronologia delle versioni di una nota Groceries in Pinto Notes su un Mac: versioni tue da iPhone e Mac, di ChatGPT e di Claude Code, con le righe diverse colorate e un pulsante Restore This Version." }}
        caption="La cronologia delle versioni in Pinto Notes su un Mac: ogni versione precedente, chi l’ha fatta e Restore This Version." />
    </LocalPostPage>
  );
}
