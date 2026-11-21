import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "note-iphone-non-sincronizzate");

// Italian version of /blog/apple-notes-not-syncing (language pilot, 17 Nov 2026). Apple's own Italian words for
// every menu and setting, all read 17 Nov: support.apple.com/it-it/121669 ("Se non vengono visualizzate le note
// di iCloud nell'app Note"), it-it/108922 ("Gestire lo spazio di archiviazione su iCloud"), it-it/102462 ("Se non
// riesci a collaborare nell'app Note", with the iOS 27 sharing labels), the iCloud guide it-it/guide/icloud/
// mm8685520792 ("Configurare iCloud per Note su tutti i dispositivi", for Sincronizza questo Mac and Salvati su
// iCloud), the iPhone guide it-it/guide/iphone/iph7262fd4fe/ios (Mostra tutto, Account di default, the Su iPhone
// account) and the Mac guide it-it/guide/notes/apd97da26aed/mac (Account di default). The Mac app's messages
// (unsupported features, a shared note whose owner's storage is full, the account security upgrade, Sul mio
// Mac, Eliminate) are the Italian strings in Notes' Localizable.loctable on macOS 27. Apple's System Status page
// in Italian lists the service as Note di iCloud. The interactive SyncChooser is English only and left out.
// Facts are the English post's; the screenshots are its English ones, described in Italian.

const ui = UI.it;

const FAQ = [
  { q: "Perché le note non si sincronizzano tra iPhone e Mac?", a: [
    "Il più delle volte Note è disattivato per iCloud su uno dei due dispositivi, oppure i due usano Apple Account diversi. Le note in Su iPhone o in Gmail non passano mai da iCloud, e anche uno spazio iCloud esaurito ferma la sincronizzazione. La soluzione di Apple è controllare Sincronizza questo iPhone nelle impostazioni di iCloud, poi riavviare il dispositivo se le note mancano ancora.",
  ] },
  { q: "Come forzo la sincronizzazione di Note?", a: [
    "Apple non documenta un pulsante che forza la sincronizzazione. Apple consiglia di controllare che Note sia attivo per iCloud e di riavviare il dispositivo. Aprire icloud.com/notes in un browser ti dice se una nota è arrivata su iCloud oppure no.",
  ] },
  { q: "Le note in Su iPhone arrivano sul Mac?", a: [
    "No. Su iPhone è l’account per le note che restano solo su quel telefono, e Sul mio Mac è lo stesso sul Mac. Sposta le note in una cartella di iCloud e compaiono su tutti i dispositivi collegati allo stesso Apple Account.",
  ] },
  { q: "Perché una nota condivisa non si aggiorna?", a: [
    "Controlla che tutti abbiano fatto l’accesso al proprio Apple Account con Note attivo in iCloud, e che la nota non sia protetta, perché le note protette non si possono condividere. Se lo spazio iCloud del proprietario è esaurito, Note tiene le tue modifiche sul dispositivo e le carica quando il proprietario libera spazio.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="note-iphone-non-sincronizzate"
      intro={<>Una nota scritta su iPhone non compare sul Mac, o il contrario. Un’occhiata a icloud.com ti dice quale dei due dispositivi sistemare.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#dove-stanno", label: "Quali note si sincronizzano" },
          { href: "#controlli", label: "I controlli in ordine" },
          { href: "#condivise", label: "Note condivise" },
          { href: "#sparite", label: "Note sparite ovunque" },
        ]}>
          <p>
            Note di Apple si sincronizza con iCloud. Una nota arriva sull’altro dispositivo solo se sta sotto l’intestazione iCloud, e se
            entrambi i dispositivi usano lo stesso Apple Account con Note attivo per iCloud. Controlla prima queste tre cose. Lo spazio
            iCloud esaurito e un Mac con una versione di macOS più vecchia del tuo iPhone vengono dopo.
          </p>
          <PostCta slug="it/note-iphone-non-sincronizzate" path="/it/blog/note-iphone-non-sincronizzate" position="answer" ui={ui.cta}
            title="Vuoi note che ti dicono quando si sono sincronizzate?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac e tiene ogni versione di ogni nota. Importa le tue note di Apple in un solo passaggio, senza modificarle.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/notes-same-note-three-devices" width={814} height={412} maxWidth={600}
        alt="La stessa nota scritta a mano, Urban planner, aperta in Note su un MacBook, un tablet e un iPhone nello stesso momento."
        caption="Come dovrebbe essere: una nota, uguale su ogni dispositivo. Immagine: Apple." />}
      faq={FAQ}
    >
      <h2 id="dove-stanno">Quali note si sincronizzano, e dove</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="La barra laterale di Note di Apple su macOS 27 con la sola sezione On My Mac: All on My Mac, Notes, una cartella e Recently Deleted. Nessuna sezione iCloud."
        caption="Se le tue note stanno sotto Sul mio Mac (o Su iPhone sul telefono), non lasciano mai quel dispositivo. È la prima cosa da cercare." />
      <p>
        Note raggruppa le cartelle per account, e l’intestazione sotto cui sta una nota decide dove va. Le note nuove finiscono
        nell’account di default: sul Mac è Account di default in Note, Impostazioni, e su iPhone è Account di default in Impostazioni,
        App, Note. Impostalo su iCloud, altrimenti la prossima nota creata da Siri può finire di nuovo nel posto sbagliato.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">La nota sta sotto</th><th scope="col">Arriva sugli altri dispositivi?</th><th scope="col">Buono a sapersi</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">iCloud</th><td>Sì</td><td>Su ogni dispositivo con lo stesso Apple Account e Note attivo per iCloud</td></tr>
            <tr><th scope="row">Su iPhone</th><td>No</td><td>Resta su quell’iPhone. <a href="/it/blog/spostare-note-iphone-su-icloud">Spostala in una cartella di iCloud</a></td></tr>
            <tr><th scope="row">Sul mio Mac</th><td>No</td><td>Resta su quel Mac</td></tr>
            <tr><th scope="row">Gmail o un altro account email</th><td>Solo tramite quell’account email</td><td>Non passa mai da iCloud</td></tr>
            <tr><th scope="row">Una nota condivisa con te</th><td>Sì</td><td>Sta nell’iCloud del proprietario, quindi conta il suo spazio</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="controlli">I controlli, in ordine</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Note di Apple su macOS 27 senza iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Pulsanti System Settings e Cancel."
        caption="Cosa mostra Note su un Mac dove iCloud è disattivato per Note. In Note su macOS 27 non c’è nessun altro stato della sincronizzazione: ho cercato." />
      <Steps>
        <li id="icloud-attivo">
          <strong>Note è attivo per iCloud, su entrambi i dispositivi</strong>
          L’interruttore si chiama Sincronizza questo iPhone o Sincronizza questo Mac. Apple dice che se le note mancano ancora dopo
          averlo attivato, devi riavviare il dispositivo e controllare di nuovo l’impostazione.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Mostra tutto", "Note"] },
            { on: "iPhone, iOS 26", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Note"] },
            { on: "Mac, macOS 15 o successivo", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note"] },
          ]} />
        </li>
        <li id="stesso-account">
          <strong>I due dispositivi usano lo stesso Apple Account</strong>
          Il nome in cima a Impostazioni su iPhone, e in cima a Impostazioni di Sistema sul Mac, è l’account con cui quel dispositivo si
          sincronizza. Un Mac di lavoro collegato all’Apple Account dell’azienda non mostra le note del tuo iPhone personale.
        </li>
        <li id="su-icloud">
          <strong>La nota è su iCloud</strong>
          Apri icloud.com/notes in un browser e accedi con lo stesso Apple Account. Se la nota c’è, il dispositivo da sistemare è quello
          dove manca. Se non c’è, il dispositivo dove l’hai scritta non l’ha ancora caricata: parti da quello.
        </li>
        <li id="stato">
          <strong>Note di iCloud funziona</strong>
          Apple elenca Note di iCloud nella sua pagina Stato del sistema, su apple.com/it/support/systemstatus. Se lì c’è un disservizio,
          nessuna impostazione dalla tua parte lo risolve. Aspetta che Apple lo segni come risolto.
        </li>
        <li id="spazio">
          <strong>Lo spazio iCloud non è esaurito</strong>
          Apple dice che quando esaurisci lo spazio su iCloud, le app di iCloud non restano aggiornate sui tuoi dispositivi, e Note è una
          di queste. Apri Impostazioni, tocca il tuo nome, poi iCloud, per vedere quanto spazio usi. Liberare un po’ di spazio o passare a
          un piano più grande fa ripartire la sincronizzazione.
        </li>
        <li id="aggiornamenti">
          <strong>Nessuno dei due dispositivi è indietro con gli aggiornamenti</strong>
          Una nota creata con una versione più nuova di Note può usare funzioni che una versione più vecchia non ha. Sul Mac, Note la
          mostra allora con il messaggio &ldquo;Questa nota utilizza funzionalità non supportate. Per visualizzarla o modificarla, aggiorna
          all’ultima versione di macOS.&rdquo; La nota si è sincronizzata, ma questo Mac non riesce ad aprirla. Da quando iOS 27 è uscito, il
          14 settembre, la situazione più probabile è un iPhone con iOS 27 e un Mac ancora con macOS 26: la soluzione è aggiornare il Mac
          a macOS 27.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="La schermata iCloud nelle Impostazioni di iPhone: spazio usato 4,1 GB su 50 GB, e sotto Saved to iCloud le voci Photos, Drive, Passwords, Notes con 29 elementi, Messages e Mail."
        caption="Impostazioni, il tuo nome, iCloud: quanto è pieno lo spazio, e cosa ci tiene Note. Immagine: Apple." />
      <p>
        Apple non documenta un pulsante che forza la sincronizzazione, quindi non c’è niente da premere. Per i dispositivi molto vecchi, la
        guida di Apple per il Mac dice che le note di iCloud aggiornate non si aprono sulle versioni precedenti a OS X 10.11 o iOS 9, e che
        la barra laterale di Note mostra un pulsante Aggiorna accanto a iCloud finché non esegui l’aggiornamento.
      </p>

      <h2 id="condivise">Quando una nota condivisa non si aggiorna</h2>
      <PostFigure src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Due icone di note disegnate, ciascuna con una persona sopra, unite da una linea tratteggiata con un simbolo di pausa al centro."
        caption="Una nota condivisa resta in attesa quando una delle due parti non riesce a sincronizzarsi." />
      <ul>
        <li>Tutti devono aver fatto l’accesso a un Apple Account con Note attivo per iCloud. La guida di Apple su come collaborare in Note chiede anche l’ultima versione di iOS.</li>
        <li>Non puoi collaborare su una nota protetta, né su una cartella che ne contiene una.</li>
        <li>Una nota condivisa sta nell’iCloud del suo proprietario. Quando il suo spazio è esaurito, Note sul Mac dice che le tue modifiche non si possono caricare, che sono salvate sul tuo dispositivo e che verranno caricate quando il proprietario libera spazio.</li>
        <li>Se Note ti chiede di aggiornare la sicurezza dell’account &ldquo;per visualizzare le modifiche in tempo reale e utilizzare le ultime funzionalità di collaborazione&rdquo;, le modifiche degli altri non compaiono in tempo reale finché non lo fai.</li>
      </ul>
      <p>
        Su iOS 27 la condivisione si è spostata: tocca il pulsante Condividi, poi Condividi un link o Invia una copia, e scegli chi può
        modificare in Le persone che scegli possono modificare il contenuto.
      </p>

      <h2 id="sparite">Se le note sono sparite da tutti i dispositivi</h2>
      <PostFigure src="/blog/macos27/notes-recently-deleted-window" width={1520} height={1003} maxWidth={560}
        alt="Note di Apple su macOS 27 aperto su Recently Deleted con due note, Fresh pasta dough e Gift ideas, sotto una riga che dice che le note eliminate vengono rimosse dai dispositivi dopo 30 giorni."
        caption="Una nota eliminata su qualsiasi dispositivo aspetta qui per 30 giorni." />
      <p>
        Eliminare una nota su un dispositivo la elimina ovunque, e questo può sembrare un problema di sincronizzazione. Le note eliminate
        restano 30 giorni in Eliminate di recente (sul Mac la cartella si chiama Eliminate), su ogni dispositivo collegato allo stesso
        Apple Account. Anche tenere una copia tua delle note aiuta.
      </p>

      <h2 id="pinto-notes">Un’app di note che ti mostra la sincronizzazione</h2>
      <PostFigure src="/blog/drawn/sync-ok" width={1200} height={750} maxWidth={560}
        alt="Una nuvola bianca disegnata con un segno di spunta verde e un piccolo orologio accanto."
        caption="Pinto Notes mostra quando si è sincronizzato l’ultima volta, e perché quando non ci riesce." />
      <p>
        Note di Apple non mostra quando si è sincronizzato l’ultima volta, ed è per questo che servono sei controlli. Pinto Notes, l’app di
        note per iPhone e Mac, si sincronizza con un suo servizio cifrato invece che con iCloud, quindi lo spazio iCloud non
        lo riguarda. Nelle sue impostazioni vedi lo stato della sincronizzazione, per esempio l’ora dell’ultima sincronizzazione o il
        motivo per cui adesso non riesce, accanto a un pulsante Sync Now. Se la stessa nota è cambiata su due dispositivi prima che si
        sincronizzassero, vince la modifica più recente e l’altra resta come copia in conflitto, così non perdi nessuna delle due.
      </p>
      <p>
        Non ti sistema Note di Apple, e non ha versioni per Windows, Android o il web. L’app è in inglese. Passare da Note di Apple
        richiede una sola importazione sul Mac, e Note resta com’era.
      </p>
    </LocalPostPage>
  );
}
