import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import s from "@/lib/post-parts.module.css";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "spostare-note-iphone-su-icloud");

// Italian version of /blog/move-apple-notes-to-icloud (language pilot, 17 Nov 2026). Apple's own Italian words for
// every menu, button and setting, all read 17 Nov: support.apple.com/it-it/118442 ("Come usare Note su iPhone":
// pulsante Altro, Seleziona note, pulsante Cartella), it-it/102476 ("Se non trovi le note": Eliminate di recente,
// the Cestino in Mail), it-it/102537 (Visualizza nota, Rimuovi, IMAP notes can't be locked), it-it/108770 ("Cosa
// include il backup di iCloud?"), the iPhone guide it-it/guide/iphone/iph7262fd4fe/ios (the Su iPhone account,
// Account Note, Mostra tutto) and ipha61270292/ios (Sposta), and the Mac guide it-it/guide/notes/notc3b2d538b/mac
// ("Informazioni su account e cartelle", the warning about formatting and attachments), apd558a85438/mac (Vista,
// Mostra barra laterale on macOS 27; Vista, Mostra cartelle in its macOS 26 version; the Option key to copy) and
// apd97da26aed/mac (Account di default, Abilita account "Sul mio Mac"). Sposta in and the message about turning
// off local notes are the Italian strings in Notes' Localizable.loctable on macOS 27. The checklist uses Keep with
// the Italian Copy label, since Checklist's button is English only.
// Facts are the English post's; the screenshots are its English ones, described in Italian.

const ui = UI.it;

const AFTER_TITLE = "Dopo aver spostato le note su iCloud";
const AFTER = [
  "Imposta iCloud come account di default, così Siri e il widget smettono di usare quello vecchio",
  "Apri qualche nota spostata e controlla formattazione, allegati e disegni",
  "Proteggi di nuovo le note che hai sbloccato per lo spostamento",
  "Disattiva Note per l’account Gmail, o Sul mio Mac, quando è vuoto",
];

const FAQ = [
  { q: "Perché alcune mie note sono in Su iPhone?", a: [
    "Su iPhone è un account per le note che restano solo su quel telefono. Compare quando lo attivi in Impostazioni, App, Note, e le note nuove create da Siri o dal widget di Note vanno nell’account impostato lì come Account di default.",
  ] },
  { q: "Spostare le note su iCloud le toglie dal mio iPhone?", a: [
    "No. Le note di iCloud restano sul tuo iPhone e compaiono anche su tutti gli altri dispositivi collegati allo stesso Apple Account con Note attivo per iCloud.",
  ] },
  { q: "Posso spostare le note di Gmail su iCloud?", a: [
    "Sì. Le note di Gmail compaiono in Note come un account a parte, e le sposti in una cartella di iCloud come quelle di Su iPhone. Dopo puoi disattivare Note per l’account Gmail.",
  ] },
  { q: "Perché non posso proteggere le note di Gmail?", a: [
    "Apple dice che le note che si sincronizzano via IMAP, con account come Gmail e Yahoo, non si possono proteggere. Quando una nota è su iCloud puoi proteggerla, a meno che non abbia tag o un file allegato, come un PDF o una registrazione.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="spostare-note-iphone-su-icloud"
      intro={<>Alcune tue note stanno sotto Su iPhone o Gmail, e per questo non compaiono mai sugli altri dispositivi. Spostarle su iCloud richiede qualche tocco su iPhone, o un trascinamento sul Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#dove", label: "Dove stanno le note" },
          { href: "#prima", label: "Cosa si può perdere" },
          { href: "#iphone", label: "Su iPhone" },
          { href: "#mac", label: "Sul Mac" },
          { href: "#gmail", label: "Note di Gmail" },
          { href: "#dopo", label: "Dopo lo spostamento" },
        ]}>
          <p>
            Su iPhone, apri la cartella sotto Su iPhone o Gmail, tocca il pulsante Altro, poi Seleziona note, scegli le note, tocca il
            pulsante Cartella e scegli una cartella sotto iCloud. Sul Mac, trascina le note su una cartella di iCloud nella barra laterale,
            e tieni premuto il tasto Opzione se vuoi copiarle invece di spostarle. Prima togli la protezione alle note protette, e dopo
            imposta iCloud come account di default, altrimenti le note nuove continuano a finire nel vecchio account.
          </p>
          <PostCta slug="it/spostare-note-iphone-su-icloud" path="/it/blog/spostare-note-iphone-su-icloud" position="answer" ui={ui.cta}
            title="Vuoi note senza account da mettere in ordine?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac, tiene ogni versione di ogni nota e ChatGPT o Claude possono lavorare nelle tue note. Importa le tue note di Apple in un solo passaggio, senza modificarle.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="dove">Guarda dove stanno le tue note</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="L’elenco Cartelle in Note su iPhone con iOS 27: Quick Notes e Shared in alto, poi l’intestazione iCloud con le sue cartelle, e Tags sotto."
        caption="L’intestazione sopra una cartella, qui iCloud, è l’account in cui stanno le sue note. Immagine: Apple." />
      <p>
        Note raggruppa le cartelle per account, sotto intestazioni come iCloud, Su iPhone e Gmail. L’intestazione sotto cui sta una nota
        decide se arriva sugli altri tuoi dispositivi: ci arrivano solo le note di iCloud, con tutte le funzioni.
      </p>
      <p>Su iPhone, torna all’elenco Cartelle in Note. Sul Mac gli stessi gruppi sono nella barra laterale. Se è nascosta:</p>
      <Paths rows={[
        { on: "Mac, macOS 27", steps: ["Vista", "Mostra barra laterale"] },
        { on: "Mac, macOS 26", steps: ["Vista", "Mostra cartelle"] },
      ]} />
      <p>Se non c’è nessuna intestazione iCloud, Note è disattivato per iCloud. Attivalo qui:</p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Mostra tutto", "Note"] },
        { on: "iPhone, iOS 26", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Note"] },
      ]} />
      <p>
        Se le tue note sono già sotto iCloud e ancora non arrivano sugli altri dispositivi, il problema è altrove:{" "}
        <a href="/it/blog/note-iphone-non-sincronizzate">note di iPhone non sincronizzate con il Mac</a> ti aiuta a trovarlo.
      </p>

      <h2 id="prima">Prima di spostare: cosa si può perdere</h2>
      <p>
        La guida di Apple avverte che spostando le note da un account all’altro puoi perdere per sempre formattazione e allegati. Quindi
        tieni gli originali finché non hai controllato le note spostate.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Nella nota</th><th scope="col">Cosa dice Apple</th><th scope="col">Cosa fare prima</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Formattazione e allegati</th><td>Si possono perdere per sempre nello spostamento</td><td>Sul Mac, tieni premuto il tasto Opzione mentre trascini: Note copia invece di spostare</td></tr>
            <tr><th scope="row">Disegni</th><td>Possono diventare file di immagine che non modifichi più come disegni</td><td>Lo stesso: prima copia, poi controlla</td></tr>
            <tr><th scope="row">La protezione</th><td>Le note protette si spostano solo tra iCloud e l’account sul tuo Mac, e può servire sbloccarle prima</td><td>Togli la protezione, sposta la nota, proteggila di nuovo in iCloud</td></tr>
            <tr><th scope="row">La condivisione</th><td>Si possono condividere solo le note di iCloud, quindi una nota condivisa è già lì</td><td>Niente</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        La guida di Apple per iPhone descrive solo lo spostamento, senza un modo per copiare. Quindi su iPhone fai prima un backup: le note
        in Su iPhone fanno parte del backup del tuo iPhone.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="Il menu More di una nota sbloccata in Note su iPhone, con Remove evidenziato in alto accanto a Scan e Pin Note."
        caption="Sblocca la nota, poi Altro, Rimuovi, prima di spostarla. Immagine: Apple." />
      <p>
        Per togliere la protezione a una nota su iPhone, tocca la nota protetta, tocca Visualizza nota e sbloccala, poi tocca il pulsante
        Altro e scegli Rimuovi. Ogni account può avere la sua password per le note. Se hai perso la password di una nota protetta, nessuno
        può aprirla, e <a href="/it/blog/password-note-iphone-dimenticata">cosa fare se hai dimenticato la password delle note</a> spiega
        perché.
      </p>
      <p>
        Un’ultima cosa se usi due Apple Account: la guida di Apple per il Mac dice che una nota condivisa si può spostare solo tra cartelle
        dello stesso account iCloud.
      </p>

      <h2 id="iphone">Spostare le note su iPhone</h2>
      <Steps>
        <li>
          <strong>Apri la cartella che contiene le note</strong>
          Per esempio Note sotto Su iPhone, oppure Note sotto Gmail.
        </li>
        <li>
          <strong>Tocca il pulsante Altro, poi Seleziona note</strong>
          Tocca ogni nota che vuoi spostare.
        </li>
        <li>
          <strong>Tocca il pulsante Cartella e scegli una cartella sotto iCloud</strong>
          Le note lasciano il vecchio account e compaiono in quella cartella.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Note su iPhone con iOS 27 in modalità selezione: 3 Selected, tre note spuntate e in basso a sinistra un pulsante Folder per spostarle."
        caption="Seleziona note, poi il pulsante Cartella in basso a sinistra. Immagine: Apple." />
      <p>
        Per una sola nota, tienila premuta, tocca Sposta e scegli la cartella. Per portare di là un’intera cartella, crea sotto iCloud una
        cartella con lo stesso nome e sposta lì le sue note.
      </p>

      <h2 id="mac">Spostare le note sul Mac</h2>
      <Steps>
        <li>
          <strong>Seleziona le note nell’elenco</strong>
          Possono venire da Sul mio Mac, da Gmail o da qualsiasi altro account nella barra laterale.
        </li>
        <li>
          <strong>Trascinale su una cartella sotto iCloud nella barra laterale, oppure fai clic tenendo premuto Ctrl e scegli Sposta in</strong>
          Tieni premuto il tasto Opzione quando le rilasci per ottenere delle copie e tenere gli originali.
        </li>
      </Steps>
      <PostFigure src="/blog/macos27/notes27-note-context-move-to-submenu" width={1416} height={960} maxWidth={600}
        alt="Note di Apple su macOS 27: clic con il tasto Ctrl su una nota, Move to, e l’elenco delle cartelle in cui spostarla."
        caption="Niente trascinamento: fai clic su una nota tenendo premuto Ctrl, scegli Sposta in, poi la cartella." />
      <p>
        Sul mio Mac è l’account locale del Mac, come Su iPhone. Quando è vuoto puoi disattivarlo deselezionando Abilita account &ldquo;Sul
        mio Mac&rdquo; in Note, Impostazioni. Note non lo disattiva finché contiene ancora note, e ti chiede di spostarle o eliminarle
        prima.
      </p>

      <h2 id="gmail">Le note di Gmail sono diverse</h2>
      <p>
        Le note di un account Gmail stanno nel tuo account Google e si sincronizzano con Note via IMAP, il protocollo che usa Mail. Apple
        dice che lì molte funzioni di Note non ci sono. In pratica:
      </p>
      <ul>
        <li>Non si possono proteggere.</li>
        <li>Su macOS 26, Note rifiuta i tag e le note in evidenza in un account IMAP, con un messaggio che dice che non sono supportati.</li>
        <li>Quando ne elimini una, di solito Gmail la tiene nel Cestino di quell’account nell’app Mail, invece che in Eliminate di recente.</li>
      </ul>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Le impostazioni di un account Gmail su iPhone, con gli interruttori Mail, Contacts, Calendars e Notes, tutti attivi."
        caption="Disattiva Note qui quando l’account Gmail non contiene più note. Mail continua a funzionare. Immagine: Apple." />
      <p>
        Apple dice che le note spostate su iCloud da un altro account possono usare tutte le funzioni. Per far smettere all’account Gmail di
        sincronizzare le note quando è vuoto, disattiva Note per quell’account. Mail continua a funzionare, e le note rimaste in Gmail
        restano nel tuo account Google.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Impostazioni", "App", "Note", "Account Note", "Gmail", "Note"] },
      ]} />

      <h2 id="dopo">Dopo lo spostamento</h2>
      <p>Quattro cose, e la prima è quella che tutti saltano.</p>
      <Keep title={AFTER_TITLE} text={[AFTER_TITLE, ...AFTER].join("\n")} copyLabel={ui.copy}
        note="Copia ti dà righe semplici. In Note di Apple, selezionale e tocca il pulsante dell’elenco di controllo.">
        <ul className={s.ticks}>{AFTER.map((it) => <li key={it}>{it}</li>)}</ul>
      </Keep>
      <p>L’account di default si imposta qui:</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Impostazioni", "App", "Note", "Account di default"] },
        { on: "Mac", steps: ["Note", "Impostazioni", "Account di default"] },
      ]} />
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Le impostazioni generali di Note di Apple su un Mac con macOS 26: Sort notes by Date Edited, New notes start with Title, e Default account impostato su iCloud, che Siri usa per creare le note." }}
        ground="sky" caption="Note, Impostazioni su un Mac con macOS 26. L’account di default è dove finiscono le note nuove, e Note dice che Siri lo usa per creare le note." />
      <p>
        Lo spostamento cambia anche cosa contiene il backup iCloud del tuo iPhone. Le note in Su iPhone ne fanno parte, e Apple lascia fuori
        le note che sono già archiviate su iCloud. Eliminare una nota su iCloud la toglie da tutti i dispositivi dopo 30 giorni in Eliminate
        di recente, quindi tieni anche una copia tua.
      </p>

      <h2 id="pinto-notes">Un’app di note senza account da sistemare</h2>
      <Figure shot={{ ...SHOTS.consent, alt: "Pinto Notes chiede \"Allow ChatGPT to use your notes?\": le note che ChatGPT apre vanno a OpenAI, le note protette restano private, un numero da confrontare, e i pulsanti Allow e Don't Allow." }}
        caption="Un’IA riceve le tue note solo dopo che l’hai permesso sul tuo dispositivo." />
      <p>
        Pinto Notes, l’app di note per iPhone e Mac, non ha Su iPhone né account email. Accedi una volta, e ogni nota si
        sincronizza tra i tuoi dispositivi. ChatGPT e Claude possono leggere e modificare quelle note dopo che li hai approvati.
      </p>
      <p>
        Non ti mette in ordine Note di Apple, e non ha versioni per Windows, Android o il web. L’app è in inglese. Passare da Note di Apple
        richiede una sola importazione sul Mac, e Note resta com’era.
      </p>
    </LocalPostPage>
  );
}
