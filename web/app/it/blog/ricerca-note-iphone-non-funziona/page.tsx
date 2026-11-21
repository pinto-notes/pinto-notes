import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "ricerca-note-iphone-non-funziona");

// Italian version of /blog/apple-notes-search-not-working (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "note iphone cerca" gives cerca note iphone; "ricerca note iphone", "cerca note iphone non
// funziona", "ricerca note non funziona", "spotlight non trova note" and "note iphone non trova" give nothing yet,
// while "app note iphone" gives app note iphone non funziona. Italian people say "ricerca" for the feature, so the
// slug says ricerca-note-iphone-non-funziona and the title "Ricerca nelle note di iPhone non funziona". Apple's own
// Italian words, all read 21 Nov 2026, from the same pages the English post cites: the iPhone guide it-it/guide/
// iphone/iphb8628c6b8/ios ("Cercare nelle note su iPhone": tag, typed and handwritten text in supported languages,
// objects in images, scanned documents; locked notes show only the title; Trova nella nota, Includi allegati), the
// Mac guide it-it/guide/notes/not18ab658ed/mac ("Cercare le note sul Mac": body, attachment names, PDFs, drawings and
// handwriting, "bici", scanned text; Account attuale, Tutti gli account; natural language "note create la settimana
// scorsa" and "modificata oggi"; Risultati migliori; locked notes show only the title even when unlocked; the
// Eliminate folder is in the results; Comando-F; Vista > Mostra browser allegati; notes appear in Spotlight; some
// features aren't available with other providers), support.apple.com/it-it/102476 ("Se non trovi le note": update
// first, Impostazioni, App, Note, Account di Note, Tutti gli account, scroll to find the search bar, check other
// folders, the right word), it-it/102321 ("Informazioni sull'indicizzazione di Spotlight": indexing after an update,
// hours or even days, faster when not in use, on power and on Wi-Fi; the Impostazioni notification; the Mac
// indicator with Comando-Barra spaziatrice; the rebuild steps are for a disk or folder), the Mac help pages it-it/
// guide/mac-help/mchlp2962/mac and mchl54d95e8a/mac (Spotlight settings, Risultati dalle app), the iPhone guide pages
// iph3c511548/ios (Impostazioni, Cerca, an app, "Mostra app in Cerca"), iph92579feda/ios (Cerca in Note settings:
// content from Note in Cerca and widgets), iph83bfec492/ios (the elenco applicazioni, swipe the app up),
// iph841379c3d/ios (turn iPhone off and on) and iph3e504502/ios (Generali, Aggiornamento software), it-it/102586
// ("Come forzare l'uscita da un'app sul Mac": Comando-Q, Opzione-Comando-Esc, Uscita forzata, menu Apple > Riavvia)
// and the Mac help page mchlpx1065/mac (macOS updates improve built-in apps such as Note). Account Note in the path is
// the iPhone guide's word (iph7262fd4fe/ios), as in the other Italian posts. The iOS 27 iCloud path is the one in the
// Italian not-syncing post. Locked notes: "la password, Face ID o Touch ID" (iphf177bb154/ios). Links go to the
// Italian posts on the password and syncing; the rest go to English posts. Facts are the English post's; the picture
// is its Apple image, described in Italian.

const ui = UI.it;

const FAQ = [
  { q: "Perché Note non trova una nota che so che c’è?", a: [
    "Apple indica quattro cose: la nota è protetta, quindi la ricerca vede solo il titolo; la ricerca copre un solo account invece di Tutti gli account; Note è disattivato per l’account in cui sta la nota; oppure la parola che hai scritto non è quella nella nota. Anche una nota che non è ancora arrivata su questo dispositivo non può comparire.",
  ] },
  { q: "La ricerca di Note guarda dentro PDF e documenti scansionati?", a: [
    "Sì. Sul Mac, Apple elenca i PDF che hai allegato, i nomi degli allegati, il testo nei documenti scansionati, disegni e testo scritto a mano, e quello che c’è nelle immagini. Su iPhone la ricerca copre il testo scritto a mano nelle lingue supportate, gli oggetti nelle immagini e i documenti scansionati. Dentro una nota, Trova nella nota con Includi allegati cerca anche nei PDF.",
  ] },
  { q: "Perché le note non compaiono in Spotlight?", a: [
    "Su iPhone, apri Impostazioni, tocca Cerca, poi Note, e controlla Mostra app in Cerca. Anche Impostazioni, App, Note, Cerca decide se i contenuti di Note compaiono nella ricerca. Sul Mac, le app disattivate in Risultati dalle app, in Impostazioni di Sistema, Spotlight, non compaiono nei risultati di Spotlight.",
  ] },
  { q: "Perché la ricerca di Note ha smesso di funzionare dopo un aggiornamento?", a: [
    "Apple non documenta un problema della ricerca di Note legato agli aggiornamenti. Dice però che Spotlight ricostruisce il suo indice dopo un aggiornamento del software e che può richiedere ore o persino giorni. L’articolo di Apple sulle note che non trovi parte dall’aggiornare ogni dispositivo all’ultimo software, poi dal cercare con Tutti gli account selezionato.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="ricerca-note-iphone-non-funziona"
      intro={<>
        Hai cercato una parola che sai che sta in una nota, e Note non ha trovato niente. Il più delle volte la nota è protetta, sta in
        un altro account o non è ancora arrivata su questo dispositivo. Ecco i controlli di Apple, dal più probabile.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#cosa-cerca", label: "Cosa copre la ricerca" },
          { href: "#controlli", label: "I controlli in ordine" },
          { href: "#in-una-nota", label: "Dentro una nota o un PDF" },
          { href: "#spotlight", label: "Spotlight" },
          { href: "#dopo-aggiornamento", label: "Dopo un aggiornamento" },
        ]}>
          <p>
            Cerca con Tutti gli account selezionato, e ricorda che una nota protetta compare solo con il suo titolo. Poi controlla che
            Note sia attivo per l’account in cui sta la nota e che la nota sia arrivata su questo dispositivo. Se la ricerca continua a
            non trovarla, chiudi e riapri Note, riavvia e aggiorna all’ultima versione di iOS o macOS.
          </p>
          <PostCta slug="it/ricerca-note-iphone-non-funziona" path="/it/blog/ricerca-note-iphone-non-funziona" position="answer" ui={ui.cta}
            title="Vuoi trovare una nota da quello di cui parla?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac, e la sua ricerca legge ogni parola di ogni nota. Collega ChatGPT o Claude e puoi chiedergli di trovare una nota da quello di cui parla.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-search-results" width={760} height={894} maxWidth={300}
        alt="Note su iPhone che cerca Home: un risultato migliore, Home renovation project, un’altra nota, Kitchen remodel ideas, con il tag #Home, e nessun allegato trovato."
        caption="La ricerca di Note su iPhone, con Risultati migliori, note e allegati. Immagine: Apple." />}
      faq={FAQ}
    >
      <h2 id="cosa-cerca">Cosa copre la ricerca di Note</h2>
      <p>
        Prima di decidere che la ricerca è rotta, conviene sapere cosa legge. Sul Mac, Apple dice che la ricerca trova corrispondenze:
      </p>
      <ul>
        <li>nel corpo di ogni nota</li>
        <li>nei nomi degli allegati, e nei PDF che hai allegato</li>
        <li>nei disegni e nel testo scritto a mano</li>
        <li>dentro un’immagine (cerca &ldquo;bici&rdquo; per trovare la foto di una bici)</li>
        <li>nel testo di un documento scansionato</li>
      </ul>
      <p>
        Su iPhone, Apple elenca i tag, il testo digitato, il testo scritto a mano nelle lingue supportate, gli oggetti nelle immagini e il
        testo nei documenti scansionati. Due limiti valgono su entrambi. Una nota protetta mostra solo il titolo nei risultati, anche quando
        è sbloccata. E la guida di Apple per il Mac dice che alcune funzioni non sono disponibili negli account di altri provider, come un
        account Gmail. Sul Mac, le note nella cartella Eliminate compaiono nei risultati.
      </p>

      <h2 id="controlli">I controlli, in ordine</h2>
      <Steps>
        <li id="tutti-gli-account">
          <strong>Cerca in tutti gli account</strong>{" "}
          Su iPhone, tocca indietro finché vedi l’elenco delle note, tocca la barra di ricerca (potresti dover scorrere per trovarla) e
          assicurati che Tutti gli account sia selezionato. Sul Mac, fai clic sul pulsante di ricerca, poi sul menu accanto alla lente
          d’ingrandimento, e scegli Tutti gli account. La scelta compare solo se hai più di un account, per esempio iCloud e Sul mio Mac.
        </li>
        <li id="protetta">
          <strong>La nota potrebbe essere protetta</strong>{" "}
          La ricerca vede solo il titolo di una nota protetta. Se hai cercato una parola del testo, apri le note protette con la password,
          Face ID o Touch ID e guardale a mano. Password dimenticata? Leggi{" "}
          <a href="/it/blog/password-note-iphone-dimenticata">password delle note di iPhone dimenticata</a>.
        </li>
        <li id="account-attivo">
          <strong>Note è attivo per ogni account</strong>{" "}
          Una nota in un account Gmail, Yahoo o di un altro servizio compare solo finché Note è attivo per quell’account. Tocca l’account e
          controlla che Note sia attivo, poi ripeti per ogni account.
          <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "App", "Note", "Account Note"] }]} />
        </li>
        <li id="altre-parole">
          <strong>Prova altre parole, poi cerca a mano</strong>{" "}
          Il consiglio di Apple è che forse non stai usando la parola, la frase o il titolo che c’è nella nota. Provane un’altra, poi apri
          ogni cartella e scorri. Sul Mac puoi anche scrivere come parleresti, per esempio &ldquo;note create la settimana scorsa&rdquo; o
          &ldquo;modificata oggi&rdquo;.
        </li>
        <li id="sincronizzata">
          <strong>La nota è arrivata su questo dispositivo</strong>{" "}
          Se hai scritto la nota su un altro iPhone o Mac, deve arrivare su questo prima che la ricerca la trovi. Controlla che
          Sincronizza questo iPhone o Sincronizza questo Mac sia attivo per Note nelle impostazioni di iCloud, su entrambi.{" "}
          <a href="/it/blog/note-iphone-non-sincronizzate">Note di iPhone non sincronizzate con il Mac</a> ha il resto dei controlli.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Mostra tutto", "Note"] },
            { on: "Mac", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note"] },
          ]} />
        </li>
        <li id="riavvia">
          <strong>Chiudi e riapri Note, poi riavvia</strong>{" "}
          Su iPhone, apri l’elenco applicazioni, fai scorrere Note verso l’alto e aprila di nuovo. Se non basta, Apple suggerisce di
          spegnere e riaccendere l’iPhone. Sul Mac, premi Comando-Q in Note e riaprila; se Note non risponde, premi Opzione-Comando-Esc e
          fai clic su Uscita forzata. Se anche così non va, scegli Riavvia dal menu Apple.
        </li>
        <li id="aggiorna">
          <strong>Aggiorna all’ultimo software</strong>{" "}
          L’articolo di Apple sulle note che non trovi parte da qui: aggiorna ogni dispositivo all’ultima versione di iOS e macOS. Apple
          dice che gli aggiornamenti di macOS portano miglioramenti alle app integrate come Note.
          <Paths rows={[
            { on: "iPhone", steps: ["Impostazioni", "Generali", "Aggiornamento software"] },
            { on: "Mac", steps: ["Impostazioni di Sistema", "Generali", "Aggiornamento software"] },
          ]} />
        </li>
      </Steps>
      <p>
        Se la ricerca trova la nota in Eliminate di recente, spostala di nuovo in una cartella prima che passino i 30 giorni.{" "}
        <a href="/blog/recover-deleted-apple-notes">How to recover deleted Apple Notes</a> (in inglese) ha i passaggi.
      </p>

      <h2 id="in-una-nota">Cercare dentro una nota, o in un suo PDF</h2>
      <p>
        Le note lunghe e i PDF allegati hanno una ricerca loro. Su iPhone, apri la nota, apri il suo menu e tocca Trova nella nota. Per
        cercare anche nei PDF e negli altri allegati, apri le opzioni di ricerca e seleziona Includi allegati, poi scrivi quello che cerchi.
        Sul Mac, apri la nota e premi Comando-F. Per le note in iCloud o in Sul mio Mac, Vista &gt; Mostra browser allegati ti fa sfogliare
        tutti gli allegati.
      </p>

      <h2 id="spotlight">Quando le note non compaiono in Spotlight</h2>
      <p>
        Spotlight è la ricerca di tutto il dispositivo, e la guida di Apple per il Mac dice che le note sono incluse nei suoi risultati. Se
        non ci sono:
      </p>
      <ul>
        <li><strong>iPhone:</strong> apri Impostazioni, tocca Cerca, scorri in basso, tocca Note e attiva Mostra app in Cerca. In Impostazioni, App, Note, l’impostazione Cerca decide se i contenuti di Note compaiono nella ricerca e nei widget.</li>
        <li><strong>Mac:</strong> apri Impostazioni di Sistema, fai clic su Spotlight e guarda Risultati dalle app. Le app disattivate lì non compaiono nei risultati di Spotlight.</li>
      </ul>
      <p>
        Apple ha anche dei passaggi per ricostruire una parte dell’indice di Spotlight sul Mac, dalle impostazioni sulla privacy della
        ricerca. Sono scritti per i file di un disco o di una cartella, e Apple non dice che aiutino Note.
      </p>

      <h2 id="dopo-aggiornamento">Se è iniziato dopo un aggiornamento</h2>
      <p>
        Apple dice che Spotlight ricostruisce il suo indice dopo che installi un aggiornamento del software, e che può richiedere ore o
        persino giorni. Va più veloce quando il dispositivo non è in uso, è collegato all’alimentazione ed è su Wi-Fi. Mentre lavora,
        iPhone mostra in Impostazioni una notifica che dice che la ricerca e Siri sono in fase di ottimizzazione, e sul Mac, premendo
        Comando-Barra spaziatrice, compare un indicatore di avanzamento in cima a Spotlight.
      </p>
      <p>
        Apple non dice se la ricerca dentro l’app Note aspetta questo indice, quindi i controlli qui sopra vengono comunque prima.
      </p>

      <h2 id="pinto-notes">Trovare una nota da quello di cui parla</h2>
      <p>
        Ogni controllo qui sopra dà per scontato che ricordi una parola che sta nella nota. Quando ricordi solo di cosa parlava, una
        ricerca per parole non aiuta. Pinto Notes, l’app di note per iPhone e Mac, si presenta e funziona come Note di Apple, e la sua
        ricerca legge ogni parola di ogni nota. Quando <a href="/blog/connect-chatgpt-to-your-notes">colleghi ChatGPT o Claude</a>{" "}
        (in inglese), cosa che richiede un minuto, puoi anche chiedergli di trovare la nota da quello di cui parla, con parole tue.
      </p>
      <p>
        Non sistema la ricerca di Note di Apple. <a href="/blog/move-from-apple-notes">Passare da Note di Apple</a> (in inglese) richiede
        una sola importazione sul Mac, e Note di Apple resta com’era. L’app è in inglese.
      </p>
    </LocalPostPage>
  );
}
