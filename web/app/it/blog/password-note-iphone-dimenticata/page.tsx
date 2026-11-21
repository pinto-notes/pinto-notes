import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, FigurePair, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "password-note-iphone-dimenticata");

// Italian version of /blog/forgot-apple-notes-password (language pilot, 17 Nov 2026). Apple's own Italian words
// for every menu and button, from support.apple.com/it-it/102537 ("Come proteggere le note o rimuovere la
// protezione su iPhone", read 17 Nov), support.apple.com/it-it/guide/notes/apdb021fd5a9/mac ("Modificare la
// password delle note protette", read 17 Nov) and support.apple.com/it-it/guide/notes/apd97da26aed/mac
// ("Modificare le impostazioni di Note sul Mac", read 17 Nov). The Mac dialog texts quoted in the alt text are
// the Italian strings in Notes' Localizable.loctable on macOS 27, read 17 Nov. Apple's Italian says "note
// protette" for locked notes; people also search "note bloccate", so the post names both once.
// Facts are the English post's; the screenshots are its English ones, described in Italian.

const ui = UI.it;

const FAQ = [
  { q: "Apple può recuperare le mie note protette se dimentico la password?", a: [
    "No. Apple dice che non ha accesso alle note protette e che non può aiutarti ad aprirle se dimentichi la password di Note. Le note protette sono cifrate con una chiave che nasce da quella password.",
  ] },
  { q: "Reimpostare la password di Note sblocca le note vecchie?", a: [
    "No. Reimpostarla ti permette di proteggere le note nuove con una password nuova. Le note che hai protetto prima tengono la vecchia password, e serve quella per aprirle.",
  ] },
  { q: "Posso aprire una nota protetta con Face ID o Touch ID?", a: [
    "Provaci: se hai attivato Face ID o Touch ID per Note, Apple lo indica come un modo per vedere una nota protetta. Funziona anche per Modifica password: se Face ID apre ancora le tue note, puoi impostarne una nuova senza ricordare quella vecchia.",
  ] },
  { q: "Le app che promettono di sbloccare Note funzionano?", a: [
    "Non possono decifrare una nota protetta senza la sua password. La chiave nasce dalla password, quindi il massimo che uno strumento può fare è tirare a indovinare. Diffida di chiunque ti chieda la password del tuo Apple Account per farlo.",
  ] },
  { q: "Come evito che succeda di nuovo?", a: [
    "Usa il codice del dispositivo al posto di una password separata (iOS 16 o successivo, con il portachiavi iCloud attivo), oppure salva la password di Note in un gestore di password.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="password-note-iphone-dimenticata"
      intro={<>Hai dimenticato la password delle note protette sul tuo iPhone? Ecco cosa vale la pena provare, nell’ordine in cui provarlo, e l’unica cosa da non fare per prima.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#prova-prima", label: "Prova prima questo" },
          { href: "#reimposta-iphone", label: "Reimpostare su iPhone" },
          { href: "#reimposta-mac", label: "Reimpostare sul Mac" },
          { href: "#la-prossima-volta", label: "Perché non succeda più" },
        ]}>
          <PostFigure src="/blog/macos27/notes-locked-hint" width={720} height={580} maxWidth={360}
            alt="Una nota protetta in Note di Apple su macOS 27 che chiede la password, con il suggerimento City and year of the trip sotto il campo."
            caption="Dopo una password sbagliata, Note mostra il suggerimento che hai impostato." />
          <p>
            Nessuno può aprire una nota protetta senza la sua password: né Apple né un’app di sblocco. Prova prima Face ID o Touch ID,
            il suggerimento e il codice del tuo dispositivo. Se niente funziona, reimposta la password. Cambia solo per le note che
            proteggerai d’ora in poi, e quelle vecchie restano con la vecchia password.
          </p>
          <PostCta slug="it/password-note-iphone-dimenticata" path="/it/blog/password-note-iphone-dimenticata" position="answer" ui={ui.cta}
            title="Vuoi note che non restino mai chiuse fuori?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac, tiene ogni versione di ogni nota e ChatGPT o Claude possono lavorare nelle tue note. Importa le tue note di Apple in un solo passaggio.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760}
        phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }}
        alt="La finestra di Note di Apple su macOS 27 con una nota protetta selezionata: This note is locked. Enter your notes password to view this note. Sotto il campo della password, il suggerimento City and year of the trip."
        caption="Una nota protetta in Note su macOS 27, dopo qualche tentativo sbagliato. Il suggerimento compare sotto il campo della password. Su iPhone si vede allo stesso modo." />}
      faq={FAQ}
    >
      <h2 id="perche">Perché nessuno può aprirla al posto tuo</h2>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300}
        alt="Una nota protetta su iPhone: un lucchetto grigio, la scritta This note is locked e un pulsante View Note."
        caption="Una nota protetta su iPhone. Immagine: Apple." />
      <p>
        Una nota protetta (molti dicono bloccata) è cifrata con una chiave che nasce dalla password delle tue note. La guida alla
        sicurezza di Apple lo descrive così: la chiave deriva dalla tua password, e con quella vengono cifrati la nota e i suoi allegati.
        Apple dice <a href="https://support.apple.com/it-it/102537" rel="noopener">di non avere accesso alle note protette</a> e di non
        poterti aiutare se dimentichi la password. È proprio lo scopo di proteggere una nota, ed è anche il motivo per cui reimpostare la
        password non ti restituisce le note vecchie.
      </p>

      <h2 id="prova-prima">Prova prima questo</h2>
      <Steps>
        <li>
          <strong>Face ID o Touch ID</strong>{" "}
          Se l’hai attivato per Note, tocca la nota protetta, poi Visualizza nota, e usalo. Apple lo indica come un modo per vedere una
          nota protetta.
        </li>
        <li>
          <strong>Il suggerimento</strong>{" "}
          Inserisci un paio di volte una password sbagliata e Note mostra il suggerimento per la password, se ne avevi impostato uno.
        </li>
        <li>
          <strong>Il codice di iPhone o la password di login del Mac</strong>{" "}
          Da iOS 16 puoi proteggere le note con il codice del dispositivo invece che con una password separata. Se avevi scelto così, usa
          il codice del tuo iPhone, o la password di login sul Mac.
        </li>
        <li>
          <strong>Le password precedenti</strong>{" "}
          Se hai già reimpostato la password di Note in passato, le note più vecchie tengono la password con cui le avevi protette. Se
          inserisci quella attuale su una nota vecchia, Note ti dice che è sbagliata e ti mostra il suggerimento della vecchia.
        </li>
        <li>
          <strong>Un gestore di password</strong>{" "}
          Se ne usi uno, cerca &ldquo;note&rdquo;: forse avevi salvato lì la password quando l’hai creata.
        </li>
      </Steps>
      <p>
        Non reimpostarla per prima cosa. Reimpostare è sicuro e non cancella niente, ma quando hai due password diventa più difficile
        capire quale nota vuole quale.
      </p>

      <h2 id="cosa-funziona">Cosa può fare ogni opzione</h2>
      <PostFigure src="/blog/drawn/pw-keys" width={1200} height={750} maxWidth={560}
        alt="Un lucchetto arancione disegnato, con intorno tre modi per aprirlo: una scansione del viso, sei puntini di un codice e un campo password."
        caption="Tre modi per entrare: Face ID, il tuo codice o la password delle note." />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Apre le note protette vecchie?</th><th scope="col">Buono a sapersi</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Face ID o Touch ID</th><td>Sì, se era attivo per Note</td><td>Funziona anche per Modifica password, che passa tutte le note alla nuova</td></tr>
            <tr><th scope="row">Il suggerimento</th><td>Solo se ti rinfresca la memoria</td><td>Compare dopo un paio di tentativi sbagliati, se ne avevi impostato uno</td></tr>
            <tr><th scope="row">Codice del dispositivo</th><td>Sì, per le note protette con il codice</td><td>Un’opzione da iOS 16, con il portachiavi iCloud attivo</td></tr>
            <tr><th scope="row">Reimposta password</th><td>No</td><td>Imposta una password per le note che proteggi d’ora in poi</td></tr>
            <tr><th scope="row">Supporto Apple</th><td>No</td><td>Apple non ha accesso alle note protette</td></tr>
            <tr><th scope="row">App di sblocco</th><td>No</td><td>Possono solo tirare a indovinare</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="reimposta">Reimpostare la password (per le note nuove)</h2>
      <p>
        Se niente di tutto questo funziona, reimpostala, così puoi continuare a proteggere le note nuove. Le note protette vecchie restano
        come sono, e si aprono ancora con la vecchia password se un giorno te la ricordi.
      </p>
      <p className="label" id="reimposta-iphone"><strong>Su iPhone</strong></p>
      <Steps>
        <li>Apri Impostazioni, tocca App, poi Note, poi Password.</li>
        <li>Scegli l’account di Note, poi tocca Reimposta password.</li>
        <li>Inserisci la password del tuo Apple Account e tocca OK, poi tocca di nuovo Reimposta password.</li>
        <li>Scegli il codice del dispositivo, oppure inserisci una nuova password e un suggerimento, poi tocca Fine.</li>
      </Steps>
      <p className="label" id="reimposta-mac"><strong>Sul Mac</strong></p>
      <Steps>
        <li>In Note, scegli Note, Impostazioni, fai clic su Reimposta password e poi su OK.</li>
        <li>Inserisci la password che Note ti chiede. Nella mia prova su macOS 27 era la password di login del Mac; la guida di Apple dice che un account iCloud può chiedere la password di iCloud.</li>
        <li>Fai di nuovo clic su Reimposta password, inserisci la nuova password nei campi Password e Verifica, aggiungi un suggerimento e fai clic su Imposta password.</li>
      </Steps>
      <p>
        I passaggi sono di Apple: <a href="https://support.apple.com/it-it/102537" rel="noopener">Come proteggere le note o rimuovere la
        protezione su iPhone</a> e <a href="https://support.apple.com/it-it/guide/notes/apdb021fd5a9/mac" rel="noopener">Modificare la
        password delle note protette</a> sul Mac. Se conosci ancora la password e ne vuoi solo una nuova, scegli invece Cambia password:
        così tutte le note protette passano alla nuova e non ti ritrovi con due.
      </p>
      <Capture src="/blog/macos27/notes27-reset-password-confirm" width={1148} height={1420} maxWidth={420}
        alt="Note di Apple su macOS 27 chiede Reset Notes Password? e spiega che la nuova password vale per le note che proteggerai d’ora in poi, mentre quelle che hanno già una password non cambiano. Pulsanti Cancel e OK."
        caption="Quando reimposti su macOS 27, Apple lo dice chiaro: le note che hanno già una password non cambiano." />

      <h2 id="provato">L’abbiamo provato su un Mac di prova</h2>
      <p>
        Abbiamo protetto una nota con una password, l’abbiamo reimpostata e ne abbiamo messa una nuova. Poi abbiamo aperto la nota vecchia. La password nuova
        non funzionava, e il suggerimento che compariva era quello vecchio. Quel suggerimento è il tuo indizio migliore: l’hai scritto
        tu, per la password che hai dimenticato.
      </p>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-after-reset-old-note-rejects-new-password", width: 2000, height: 1320,
          alt: "Una nota protetta prima della reimpostazione, in Note di Apple su macOS 27: That's not the correct password for this note. Try a different password. Il suggerimento è ancora quello vecchio." },
        { src: "/blog/macos27/notes27-old-password-update-prompt", width: 2000, height: 1320,
          alt: "La stessa nota aperta con la vecchia password: Update password? Note propone di passare alla password attuale tutte le note che usano quella vecchia, con i pulsanti Update Password e Not Now." },
      ]} caption="Dopo la reimpostazione, la nota vecchia rifiuta la password nuova e mostra il suo vecchio suggerimento. Scrivi la vecchia e Note propone di passare tutte quelle note alla tua password attuale." />
      <p>
        Quindi reimpostare non ti fa perdere niente. Se più avanti ti torna in mente la vecchia password, Note propone di aggiornare in un
        solo passaggio tutte le note che la usano ancora.
      </p>

      <h2 id="app-di-sblocco">Sulle app di sblocco</h2>
      <PostFigure src="/blog/drawn/pw-guess" width={1200} height={750} maxWidth={560}
        alt="Un lucchetto arancione disegnato accanto a un mucchio di chiavi e a un punto interrogativo."
        caption="Un’app di sblocco può solo tirare a indovinare, una chiave alla volta." />
      <p>
        I risultati di ricerca sono pieni di app che promettono di sbloccare Note. Nessuna può decifrare una nota protetta senza la sua
        password; al massimo provano password al posto tuo. Se una ti chiede la password del tuo Apple Account o il tuo backup, pensa
        bene a cosa stai consegnando.
      </p>

      <h2 id="la-prossima-volta">Perché non succeda più</h2>
      <ul>
        <li>Passa al codice del dispositivo: Impostazioni, App, Note, Password, Utilizza codice dispositivo. Serve il portachiavi iCloud attivo. Sul Mac la stessa scelta si chiama Utilizza password di login, nel menu Note protette di Note, Impostazioni.</li>
        <li>Oppure salva la password di Note in un gestore di password.</li>
        <li>Attiva Face ID o Touch ID per Note, così devi scriverla di rado.</li>
        <li>Sblocca ed esporta quello che non puoi permetterti di perdere, e tieni una copia in un posto sicuro.</li>
      </ul>
      <Capture src="/blog/macos27/notes-create-password" width={1006} height={622} maxWidth={503}
        alt="La creazione della password delle note in Note di Apple su macOS 27: i campi Password, Verify e Password Hint, e l’avviso che se dimentichi questa password non potrai vedere le note protette."
        caption="Se usi una password separata, compila il suggerimento. È l’unico indizio che Note ti darà in seguito." />

      <h2 id="pinto-notes">Se passi a un’altra app</h2>
      <p>
        Le note protette non si possono leggere senza la password, quindi gli strumenti di esportazione e importazione le lasciano
        indietro. Vale anche per l’importazione da Note di Apple in Pinto Notes: sblocca prima le note che ti servono, altrimenti restano
        in Note.
      </p>
      <p>
        Pinto Notes, l’app di note per iPhone e Mac, ha anche lei le note protette, e funzionano allo stesso modo:
        cifrate con la password delle tue note sul tuo dispositivo, illeggibili per noi e per qualsiasi IA che colleghi, e impossibili da
        recuperare se dimentichi la password. Te lo dice quando la imposti. Anche tutto il resto in Pinto Notes è cifrato sui tuoi
        dispositivi, e ChatGPT e Claude possono comunque usare le altre note quando lo approvi tu. L’app è in inglese.
      </p>
      <Figure shot={{ ...SHOTS.notesPassword, alt: "Pinto Notes su un Mac: Create a password for your locked notes, con i campi Password, Verify e Hint, e l’avviso che se dimentichi questa password le note protette non si possono recuperare, nemmeno da noi." }}
        caption="La password delle note in Pinto Notes su un Mac. Come quella di Apple, non si può recuperare se la dimentichi." />
    </LocalPostPage>
  );
}
