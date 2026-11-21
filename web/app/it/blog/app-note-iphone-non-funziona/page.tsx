import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "app-note-iphone-non-funziona");

// Italian version of /blog/apple-notes-not-working (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "app note non funziona" gives app note iphone non funziona and perche l app note non funziona; "note iphone
// non funziona" exists; "app note iphone" gives app note iphone non funziona; "app note non si apre" shows up under
// "note non si apre"; "note iphone si chiude", "app note si blocca" and "note iphone crash" give nothing yet. So the slug
// says app-note-iphone-non-funziona and the title adds "si chiude". Apple's own Italian words, all read 21 Nov 2026,
// from the same pages the English post cites: support.apple.com/it-it/119876 ("Se un'app su iPhone smette di
// rispondere, si chiude inaspettatamente o non si apre", published 31 Mar 2026: close and reopen, restart, App Store,
// profile icon, Aggiornamenti app, then update the software, delete and download again), the iPhone guide it-it/guide/
// iphone/iph83bfec492/ios (the elenco applicazioni, swipe right to find the app, swipe it up, reopen from the Home
// Screen or the libreria app) and iph8903c3ee6/ios (force restart: volume up, volume down, hold the side button until
// the Apple logo), it-it/118575 ("Aggiorna l'iPhone", published 23 Sep 2026: back up, plug in, Wi-Fi, Impostazioni,
// Generali, Aggiornamento software), it-it/118582 ("Eliminare le app Apple integrate", published 23 Jun 2026: Notes is
// on the list, deleting a built-in app deletes its user data, the exact name in the App Store, the Scarica di nuovo
// button), the Mac help page it-it/guide/mac-help/mchlp2579/mac ("Se un'app si blocca o si chiude inaspettatamente sul
// Mac": menu Apple > Uscita forzata, you may lose unsaved changes, Riapri, menu Apple > Riavvia, open another file,
// unplug peripherals such as the printer, uninstall third-party add-ons or plug-ins), it-it/102586 ("Come forzare
// l'uscita da un'app sul Mac", published 11 Dec 2025: Comando-Q, Opzione-Comando-Esc, hold the power button for 10
// seconds), it-it/108382 ("Aggiornare macOS sul Mac", published 14 Sep 2026: back up first, Impostazioni di Sistema,
// Generali, Aggiornamento software, don't sleep the Mac or close the lid), it-it/116946 ("Avviare il Mac in modalità
// sicura": a way to tell whether software that loads at startup causes a problem; it doesn't name apps) and it-it/
// 121669 ("Se non vengono visualizzate le note di iCloud nell'app Note"). Apple's Notes guide for Mac has no
// troubleshooting topic in Italian either, so no Notes-specific cause is claimed. From the Italian not-syncing post:
// the iCloud paths, icloud.com/notes, Note di iCloud on apple.com/it/support/systemstatus, and the macOS message
// about unsupported features (Notes' Localizable.loctable on macOS 27). Links go to the Italian not-syncing post; the
// rest go to English posts. Facts are the English post's; the pictures are its English ones, described in Italian.

const ui = UI.it;

const FAQ = [
  { q: "Perché l’app Note continua a chiudersi?", a: [
    "Apple non documenta una causa che riguardi solo Note. I suoi passaggi sono quelli per qualsiasi app: chiudila e riaprila, riavvia il dispositivo, poi aggiorna il software. Sul Mac, Apple suggerisce anche di scollegare un dispositivo appena collegato e di togliere i plugin di terze parti.",
  ] },
  { q: "Se elimino l’app Note perdo le note?", a: [
    "Apple dice che eliminare un’app integrata elimina anche i suoi dati su quel dispositivo. Le note di iCloud sono anche su icloud.com/notes, quindi controllale lì prima. Le note in Su iPhone stanno solo su quel telefono: non eliminare l’app finché hai note lì.",
  ] },
  { q: "Come forzo l’uscita da Note sul Mac?", a: [
    "Premi Opzione-Comando-Esc, oppure scegli Uscita forzata dal menu Apple, poi seleziona Note e fai clic su Uscita forzata. Apple avverte che potresti perdere le modifiche non salvate.",
  ] },
  { q: "Perché una nota non si apre sul Mac dopo che ho aggiornato l’iPhone?", a: [
    "Una nota creata con una versione più nuova di Note può usare funzioni che una versione più vecchia non ha. Il Mac allora dice che la nota utilizza funzionalità non supportate e ti chiede di aggiornare all’ultima versione di macOS. Aggiornare il Mac gli permette di aprirla.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="app-note-iphone-non-funziona"
      intro={<>
        Note si blocca, si chiude da sola o non si apre proprio. Ecco i passaggi di Apple, nell’ordine in cui li dà Apple, per iPhone e
        Mac.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "Su iPhone" },
          { href: "#mac", label: "Sul Mac" },
          { href: "#note-non-caricano", label: "Le note non si caricano" },
          { href: "#dopo-aggiornamento", label: "Dopo un aggiornamento" },
        ]}>
          <p>
            Chiudi Note e riaprila, poi riavvia il dispositivo. Se si blocca o si chiude ancora, aggiorna iOS o macOS. Sono i passaggi di
            Apple per qualsiasi app che smette di rispondere. Se Note si apre ma le tue note non compaiono, controlla che Note sia attivo
            per iCloud su quel dispositivo.
          </p>
          <PostCta slug="it/app-note-iphone-non-funziona" path="/it/blog/app-note-iphone-non-funziona" position="answer" ui={ui.cta}
            title="Vuoi una seconda copia delle tue note?">
            <p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Importa le tue note di Apple una volta sul Mac, come copia, e Note di Apple resta com’era. Ogni versione precedente di una nota viene conservata.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="al-sicuro">Prima, controlla che le note siano al sicuro</h2>
      <p>
        Prima di provare qualcosa di più di un riavvio, apri icloud.com/notes in un browser e accedi con il tuo Apple Account. Se le note
        sono lì, sono salvate su iCloud, qualunque cosa stia facendo l’app sul dispositivo. Apple elenca anche Note di iCloud nella sua
        pagina Stato del sistema, su apple.com/it/support/systemstatus. Se lì c’è un disservizio, aspetta che Apple lo segni come risolto.
      </p>

      <h2 id="iphone">Su iPhone: Note si chiude da sola o non si apre</h2>
      <Steps>
        <li id="chiudi-iphone">
          <strong>Chiudi Note e riaprila</strong>{" "}
          Apri l’elenco applicazioni, scorri fino a Note, poi falla scorrere verso l’alto. Poi tocca Note sulla schermata Home o nella
          libreria app.
        </li>
        <li id="riavvia-iphone">
          <strong>Riavvia l’iPhone</strong>
          È il passaggio successivo di Apple se l’app non risponde ancora. Se è l’iPhone stesso a essere bloccato e non si spegne, forza il
          riavvio: premi e rilascia rapidamente il tasto per alzare il volume, poi quello per abbassarlo, poi tieni premuto il tasto laterale
          finché compare il logo Apple.
        </li>
        <li id="aggiorna-iphone">
          <strong>Aggiorna iOS</strong>{" "}
          Apple suggerisce di guardare prima in Aggiornamenti app nell’App Store, e di aggiornare il software dell’iPhone se per l’app non
          c’è niente. Prima fai il backup dell’iPhone, collegalo all’alimentazione e connettiti al Wi-Fi.
          <Paths rows={[
            { on: "iPhone", steps: ["Impostazioni", "Generali", "Aggiornamento software"] },
          ]} />
        </li>
        <li id="scarica-di-nuovo">
          <strong>Elimina Note e scaricala di nuovo, per ultimo</strong>{" "}
          Note è una delle app integrate che Apple ti lascia eliminare. Apple dice che eliminarne una elimina anche i suoi dati sul
          dispositivo, quindi controlla prima icloud.com/notes, e salta questo passaggio se tieni note in Su iPhone. Per riaverla, cerca
          Note nell’App Store con il suo nome esatto e tocca Scarica di nuovo.
        </li>
      </Steps>
      <p>
        I passaggi vengono da <a href="https://support.apple.com/it-it/119876" rel="noopener">Se un’app su iPhone smette di rispondere,
        si chiude inaspettatamente o non si apre</a>, con i dettagli della guida di iPhone e di{" "}
        <a href="https://support.apple.com/it-it/118582" rel="noopener">Eliminare le app Apple integrate</a>.
      </p>

      <h2 id="mac">Sul Mac: Note si blocca o si chiude</h2>
      <Steps>
        <li id="uscita-forzata">
          <strong>Esci da Note, o forza l’uscita</strong>{" "}
          Prova prima Comando-Q. Se Note non risponde, premi Opzione-Comando-Esc, oppure scegli Uscita forzata dal menu Apple, seleziona
          Note e fai clic su Uscita forzata. Apple avverte che potresti perdere le modifiche non salvate. Se Note si è chiusa da sola, fai
          clic su Riapri nella finestra che compare.
          <Paths rows={[
            { on: "Mac", steps: ["Menu Apple", "Uscita forzata"], keys: "⌥⌘⎋" },
          ]} />
        </li>
        <li id="riavvia-mac">
          <strong>Riavvia il Mac</strong>{" "}
          Scegli Riavvia dal menu Apple. Se il Mac non si riavvia, Apple dice di tenere premuto il tasto di accensione per 10 secondi, finché
          si spegne, poi premerlo di nuovo per riaccenderlo.
        </li>
        <li id="altra-nota">
          <strong>Apri un’altra nota</strong>{" "}
          La guida di Apple suggerisce di aprire un altro file, perché il problema può essere in quello che era aperto. In Note, vuol dire
          un’altra nota.
        </li>
        <li id="aggiorna-mac">
          <strong>Aggiorna macOS</strong>{" "}
          Apple dice che conviene fare prima il backup del Mac. Non mettere il Mac in standby e non chiudere il coperchio finché
          l’installazione non è finita.
          <Paths rows={[
            { on: "Mac", steps: ["Impostazioni di Sistema", "Generali", "Aggiornamento software"] },
          ]} />
        </li>
        <li id="periferiche">
          <strong>Scollega quello che è nuovo, togli i componenti aggiuntivi</strong>{" "}
          Apple suggerisce di scollegare un dispositivo appena collegato, come una stampante, e di disinstallare componenti aggiuntivi o
          plugin di terze parti, che possono smettere di funzionare dopo un aggiornamento dell’app o di macOS.
        </li>
      </Steps>
      <p>
        I passaggi vengono da <a href="https://support.apple.com/it-it/guide/mac-help/mchlp2579/mac" rel="noopener">Se un’app si blocca o
        si chiude inaspettatamente sul Mac</a> e da <a href="https://support.apple.com/it-it/102586" rel="noopener">Come forzare l’uscita
        da un’app sul Mac</a>. Se continua a succedere, l’articolo di Apple sulla{" "}
        <a href="https://support.apple.com/it-it/116946" rel="noopener">modalità sicura</a> spiega come capire se il problema viene da un
        software che si carica all’avvio del Mac.
      </p>

      <h2 id="note-non-caricano">Note si apre, ma le note non si caricano</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Note di Apple su macOS 27 senza iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Pulsanti System Settings e Cancel."
        caption="Cosa mostra Note su un Mac dove iCloud è disattivato per Note." />
      <p>
        Se l’app funziona ma l’elenco è vuoto, i passaggi di Apple sono controllare che Sincronizza questo iPhone (o Sincronizza questo
        Mac) sia attivo per Note, poi guardare nell’app Note. Se le note non compaiono ancora, riavvia il dispositivo e controlla di nuovo
        l’impostazione. Apple dice che, finita la sincronizzazione, le note già su iCloud dovrebbero comparire.
      </p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Mostra tutto", "Note"] },
        { on: "iPhone, iOS 26", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Note"] },
        { on: "Mac, macOS 15 o successivo", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note"] },
      ]} />
      <p>
        Viene da <a href="https://support.apple.com/it-it/121669" rel="noopener">Se non vengono visualizzate le note di iCloud nell’app
        Note</a>. Se le note si vedono su un dispositivo e non sull’altro,{" "}
        <a href="/it/blog/note-iphone-non-sincronizzate">note di iPhone non sincronizzate con il Mac</a> ha il resto dei controlli. Se manca
        una nota ovunque, guarda in Eliminate di recente, dove le note eliminate restano 30 giorni:{" "}
        <a href="/blog/recover-deleted-apple-notes">how to recover deleted Apple Notes</a> (in inglese) mostra dov’è su ogni dispositivo.
      </p>

      <h2 id="dopo-aggiornamento">Non funziona dopo un aggiornamento</h2>
      <p>
        Quando un dispositivo è aggiornato e l’altro no, una nota creata su quello più nuovo può usare funzioni che il Note più vecchio non
        ha. Sul Mac, Note allora mostra &ldquo;Questa nota utilizza funzionalità non supportate. Per visualizzarla o modificarla, aggiorna
        all’ultima versione di macOS.&rdquo; La nota si è sincronizzata, ma quel Mac non riesce ad aprirla. La soluzione è aggiornare il
        dispositivo rimasto indietro.
      </p>
      <p>
        Se è Note stessa ad aver cominciato a chiudersi dopo un aggiornamento, i passaggi qui sopra restano quelli che dà Apple. Controlla
        anche se c’è un aggiornamento più recente, perché Apple mette gli aggiornamenti del software tra le soluzioni per un’app che si
        chiude.
      </p>

      <h2 id="la-prossima-volta">Tieni una copia, per la prossima volta</h2>
      <p>
        Una copia delle note fuori dall’app Note è utile qualunque cosa vada storta.{" "}
        <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> (in inglese) spiega come tenerne una.
      </p>

      <h2 id="pinto-notes">Una seconda casa per le tue note</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="Il foglio Import from Apple Notes in Pinto Notes su un Mac: Copies the notes you pick. Nothing in Apple Notes changes. Ogni nota è elencata sotto la sua cartella di Note di Apple, tutte spuntate, con Import 8 Notes."
        caption="Import from Apple Notes in Pinto Notes su un Mac. Copia le tue note e lascia Note di Apple com’era." />
      <p>
        Pinto Notes non sistema Note di Apple. È un’app di note che si presenta e funziona come Note di Apple su iPhone e Mac, e può tenere
        una seconda copia delle tue note: <a href="/blog/move-from-apple-notes">passare da Note di Apple</a> (in inglese) è una sola
        importazione sul Mac, e Note di Apple resta com’era. L’importazione legge le note attraverso Note di Apple, quindi Note deve aprirsi
        su quel Mac. Da lì in poi, Pinto Notes conserva ogni versione precedente di ogni nota. L’app è in inglese.
      </p>
    </LocalPostPage>
  );
}
