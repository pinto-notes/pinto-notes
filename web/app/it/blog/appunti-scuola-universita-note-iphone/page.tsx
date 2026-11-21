import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "appunti-scuola-universita-note-iphone");

// Italian version of /blog/apple-notes-for-school (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "note iphone per la scuola", "note iphone scuola", "note iphone università", "app note per studenti" and
// "appunti università iphone" give nothing yet; "app per appunti università" gives app per prendere appunti
// università, app per prendere appunti università mac, app per prendere appunti università gratis, migliori app per
// appunti università; "prendere appunti iphone" gives app per prendere appunti iphone and dove prendere appunti su
// iphone; "app note università" exists. Italians say "appunti" for class notes and "scuola" or "università", so the
// slug is appunti-scuola-universita-note-iphone and the title says both. Apple's own Italian words, all read 21 Nov
// 2026, from the same pages the English post cites: the Mac guide it-it/guide/notes/apdb5106e334/mac ("Registrare e
// trascrivere audio in Note sul Mac": the attachments button in the toolbar, Registra audio, edit the note while
// recording, the transcription button, Trova nella trascrizione, Aggiungi trascrizione alla nota, Riepilogo with Apple
// Intelligence, transcription on a Mac with M1 or later in listed languages, Italian included; deleting the recording
// deletes the transcript); the iPhone guide it-it/guide/iphone/iphbe11247b5/ios (the same on iPhone, swipe down from
// the top to take notes while recording, iPhone 12 and later, summaries on iPhone 15 Pro or later) and iph653f28965/ios
// ("Scansiona documenti", automatic capture when iPhone finds the edges of the page, saved as a PDF, "Scansiona testo"
// and Inserisci); iphb8628c6b8/ios (search finds scanned and handwritten text); the Mac guide apdd655f4242/mac (a scan
// is named Documenti scansionati, "Rinomina allegato" from the button next to its name), apd558a85438/mac (File >
// Nuova cartella, drag a folder onto another for a sottocartella), apda85974595/mac ("Risolvere operazioni in Note sul
// Mac": an expression and =, (27/3)^2=, variables defined above in the Latin alphabet, A capo inserts the answer, the
// standard order of operations, Formato > Risultati matematici), apd4e6e2c9a6/mac (Condividi un link, Condividi
// cartella, Può modificare or Può visualizzare e scaricare, Invia una copia, notes added to a shared folder are shared,
// no locked notes, @ mentions) and the iPhone guide iphe4d04f674/ios (the menu under the note's title, Condividi un
// link, participants signed in with Note on in iCloud) and ipha61270292/ios (Nuova cartella; touch and hold a note to
// put it in evidenza). The math options Inserisci risultati, Suggerisci risultati and No are the Italian strings in
// Notes' MainMenu.loctable on macOS 27. From the earlier Italian posts and their sources: Modifica > Incolla come
// Markdown and an empty checklist item doesn't survive the paste; File > Duplica nota and Comando-D (not9474646a9/mac);
// Formato > Tabella, Opzione-Comando-T, tab-separated lines plus the table button, no sort, no sum, fixed widths
// (apd0a136b9cc/mac); Modifica > Aggiungi link, Comando-K (apde615d29c2/mac); the cartella smart rule Elenchi di
// controllo: Non selezionati. Pinto side: the cornell-notes and study-flashcards templates, names in English as in
// the app. Pictures: the English post's, described in Italian. Links go to the Italian Cornell and flashcard posts;
// the rest go to English posts. The math example uses whole numbers, since the decimal sign depends on the region.

const ui = UI.it;

const CLASS_NOTE = `# Biologia

## Questa settimana
- [ ] Leggere il capitolo 4
- [ ] Relazione di laboratorio sugli enzimi
- [ ] Flashcard sulla respirazione cellulare

## Lezioni
- Respirazione cellulare, 3 novembre
- Fotosintesi, 10 novembre

## Esami
- Prova intermedia, 12 dicembre
`;

const LECTURE = `# Respirazione cellulare, 3 novembre

## Appunti
- Il glucosio viene scomposto per produrre ATP, l’energia della cellula.
- Tre fasi: glicolisi, ciclo di Krebs, catena di trasporto degli elettroni.
- La maggior parte dell’ATP viene dalla catena di trasporto degli elettroni, nei mitocondri.

## Da chiedere
- [ ] In quale parte della cellula avviene la glicolisi?

## Riassunto
Il glucosio diventa ATP in tre fasi, e la maggior parte si produce nei mitocondri.
`;

// Tabs between the columns: select those lines in Notes and press the table button.
const TIMETABLE = `Giorno\tCorso\tAula
Lunedì\tBiologia\tLaboratorio 2
Martedì\tEconomia\tAula B
Giovedì\tBiologia\tLaboratorio 2
Venerdì\tEconomia\tAula 14
`;

const MATH = `distanza = 120
tempo = 2
distanza / tempo =
`;

const FAQ = [
  { q: "Note di Apple va bene per la scuola e l’università?", a: [
    "Per prendere appunti e conservarli, sì. È gratis su iPhone e Mac, scansiona le dispense, registra le lezioni con una trascrizione e fa i conti. Va meno bene per ripassare: non ha modelli, flashcard né quiz, e per una nota condivisa serve un Apple Account a ogni persona del gruppo.",
  ] },
  { q: "Note può registrare una lezione e trascriverla?", a: [
    "Sì. In una nota, apri il menu degli allegati e scegli Registra audio. Note scrive una trascrizione in tempo reale nelle lingue supportate, su un iPhone 12 o successivo o su un Mac con chip M1 o successivo, e Apple Intelligence può farne un riepilogo dove è disponibile.",
  ] },
  { q: "Posso ripassare per gli esami in Note?", a: [
    "In parte. Una tabella a due colonne funziona come flashcard: la domanda a sinistra, la risposta a destra, e copri la colonna destra per metterti alla prova. Niente però pianifica i ripassi o ricorda le carte che hai sbagliato.",
  ] },
  { q: "Posso condividere le note con i compagni di corso?", a: [
    "Sì, una nota o una cartella intera, con Condividi un link. Tutti hanno bisogno di un Apple Account con Note attivo su iCloud, e una nota protetta non si può condividere. Per chiunque altro, Invia una copia manda una copia che si può leggere ma non modificare.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="appunti-scuola-universita-note-iphone"
      intro={<>
        Note di Apple è già sul tuo iPhone e sul tuo Mac, quindi molti appunti di scuola e università finiscono lì comunque. Ecco una
        risposta onesta sul fatto che basti per studiare, poi un sistema che regge un semestre intero, da una cartella per corso alle note
        che condividi con il tuo gruppo di studio.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#va-bene", label: "Va bene per studiare?" },
          { href: "#cartelle", label: "Una cartella per corso" },
          { href: "#lezioni", label: "Una nota per lezione" },
          { href: "#registrare", label: "Registrare una lezione" },
          { href: "#ripasso", label: "Metodo Cornell e flashcard" },
          { href: "#gruppo", label: "Gruppi di studio" },
          { href: "#pinto-notes", label: "Note che ti interrogano" },
        ]}>
          <p>
            Sì, per prendere appunti e conservarli, soprattutto se anche il tuo gruppo di studio usa iPhone e Mac. È gratis, scansiona le
            dispense, registra le lezioni con una trascrizione e fa i conti. Dove non arriva è il ripasso: niente modelli, flashcard o
            quiz, quindi quelli li costruisci tu.
          </p>
          <PostCta template="study-flashcards" slug="it/appunti-scuola-universita-note-iphone" path="/it/blog/appunti-scuola-universita-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi appunti che ti interrogano?">
            <p>Pinto Notes funziona come Note di Apple e ha modelli gratuiti per il metodo Cornell e per le flashcard. Incolla gli appunti della lezione in ChatGPT o in Claude e lui scrive le domande, poi ti interroga.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="va-bene">Note di Apple va bene per studiare?</h2>
      <p>
        Per scrivere le cose, va molto bene. È gratis, una nota che scrivi sul Mac arriva sull’iPhone tramite iCloud, e la ricerca trova le
        parole negli appunti digitati, nella scrittura a mano e nelle pagine scansionate. Scansiona una dispensa in un PDF, registra una
        lezione e scrive quello che è stato detto, e ti dà il risultato di un’operazione quando scrivi un segno di uguale.
      </p>
      <p>
        Per il ripasso, ti dà di meno. Non ci sono modelli, né flashcard, né niente che ti faccia domande o ricordi cosa hai sbagliato. Le
        tabelle non si ordinano e non fanno somme. Un gruppo di studio può lavorare nella stessa nota solo se tutti hanno un Apple Account.
        Se il tuo corso è soprattutto da imparare a memoria, come medicina, prendi gli appunti in Note e pianifica il ripasso in un posto
        che lo programma per te.
      </p>

      <h2 id="cartelle">Una cartella per corso</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="L’elenco Folders in Note su iPhone con iOS 27: Quick Notes e Shared, cartelle di iCloud come Notes, Gift Ideas e Grocery List, e una sezione Tags sotto."
        caption="L’elenco delle cartelle su iPhone. Ogni corso ha qui la sua cartella. Immagine: Apple." />
      <Paths rows={[
        { on: "Mac", steps: ["File", "Nuova cartella"] },
        { on: "iPhone", steps: ["Elenco delle cartelle", "Nuova cartella"] },
      ]} />
      <p>
        Crea una cartella per ogni corso. Per tenere insieme un semestre, crea una cartella per il semestre e trascinaci sopra ogni cartella
        dei corsi, che diventano sottocartelle. Il semestre dopo ne crei una nuova, e i corsi vecchi restano fuori dai piedi.
      </p>
      <p>
        In ogni cartella, tieni una nota del corso con le scadenze e un elenco delle lezioni, e mettila in evidenza perché resti in cima
        (su iPhone, tieni premuta la nota e mettila in evidenza). Seleziona il nome di una lezione e scegli Modifica &gt; Aggiungi link
        (Comando-K) per collegarlo alla nota di quella lezione.
      </p>
      <Keep title="Nota del corso per Note di Apple" text={CLASS_NOTE} copyLabel={ui.copy}
        note="Sul Mac, incollala in una nota nuova con Modifica > Incolla come Markdown." />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e i compiti in un elenco di controllo. Lascia una parola in ogni riga dell’elenco, perché un elemento vuoto si perde
        quando incolli. Una cartella smart con la regola Elenchi di controllo: Non selezionati elenca poi ogni nota con qualcosa ancora da
        spuntare, compiti compresi; <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> (in inglese) spiega come
        crearla.
      </p>

      <h2 id="lezioni">Una nota per ogni lezione</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="La parte bassa del menu File di Note su macOS 27: Export To, Pin Note, Lock Note, Duplicate Note con Command-D, evidenziato, e Print."
        caption="File > Duplica nota fa partire la lezione successiva dall’ultima." />
      <p>
        Dai a ogni lezione la sua nota, con l’argomento e la data nel titolo. Le note brevi si ritrovano e si ripassano meglio di una nota
        lunga per corso. Sul Mac, File &gt; Duplica nota (Comando-D) copia la nota della settimana scorsa con le sue intestazioni, pronta
        da svuotare e riempire.
      </p>
      <Keep title="Nota della lezione per Note di Apple" text={LECTURE} copyLabel={ui.copy} />
      <p>
        A lezione, scrivi solo sotto Appunti. Le domande vanno sotto Da chiedere come elenco di controllo, così le spunti quando hai la
        risposta. Scrivi il riassunto la sera stessa, in due o tre frasi tue.
      </p>

      <h2 id="scansione">Scansionare le dispense nella nota della lezione</h2>
      <Paths rows={[{ on: "iPhone", steps: ["Pulsante degli allegati", "Scansiona documenti"] }]} />
      <p>
        Apri la nota della lezione sull’iPhone, tocca il pulsante degli allegati, poi Scansiona documenti, e inquadra la pagina. L’iPhone
        scatta da solo quando trova i bordi della pagina. Scansiona le altre pagine, conferma quando hai finito, e la dispensa viene salvata nella nota come
        PDF. La ricerca poi trova le parole che contiene. Per una sola citazione da un libro, Scansiona testo, nello stesso menu, scrive
        invece il testo nella nota.
      </p>
      <p>
        Una scansione si chiama Documenti scansionati. Sul Mac, fai clic sul pulsante accanto al suo nome e scegli Rinomina allegato per
        chiamarla &ldquo;Dispensa settimana 3&rdquo;.
      </p>

      <h2 id="registrare">Registrare una lezione, con trascrizione e riepilogo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Pulsante degli allegati", "Registra audio"] },
        { on: "iPhone", steps: ["Pulsante degli allegati", "Registra audio"] },
      ]} />
      <p>
        Prima chiedi al docente: molte scuole e università hanno regole sulle registrazioni. Poi apri la nota della lezione, scegli
        Registra audio dal menu degli allegati e premi il pulsante di registrazione. Puoi continuare a scrivere mentre registra (su iPhone,
        scorri verso il basso dalla parte superiore dello schermo per tornare alla nota).
      </p>
      <p>
        Dopo, apri la registrazione e fai clic sul pulsante della trascrizione per leggere quello che è stato detto. Fai clic su una frase
        per riascoltare quel momento. Il menu della trascrizione ha Trova nella trascrizione, per il punto in cui si è parlato
        dell’esame, e Aggiungi trascrizione alla nota. Poi fai clic su Riepilogo e Apple Intelligence scrive un breve riepilogo della
        trascrizione.
      </p>
      <p>
        Le trascrizioni richiedono un iPhone 12 o successivo o un Mac con chip M1 o successivo, impostato su una lingua supportata. I
        riepiloghi richiedono Apple Intelligence, che su iPhone vuol dire un iPhone 15 Pro o successivo, e non è
        disponibile in tutte le lingue e in tutte le zone. Eliminare una registrazione elimina anche la sua trascrizione.
      </p>

      <h2 id="tabelle">Tabelle per l’orario o le letture</h2>
      <PostFigure src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="Una nota Reading list in Note di Apple su macOS 27, con una tabella di tre colonne, Book, Author e Started, e quattro libri. I titoli lunghi vanno a capo dentro le celle."
        caption="Una tabella in Note di Apple su macOS 27. La larghezza delle colonne la sceglie Note." />
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Tabella"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Pulsante della tabella"] },
      ]} />
      <Keep title="Orario delle lezioni per Note di Apple" text={TIMETABLE} copyLabel={ui.copy}
        note="Ogni riga ha un tab tra le colonne. Incollalo, poi trasforma quelle righe in una tabella." />
      <p>
        Incolla l’orario in una nota nuova, seleziona le cinque righe e premi il pulsante della tabella. Ogni tab diventa una colonna. Il
        tasto Tabulatore nell’ultima cella aggiunge una riga. Le tabelle in Note non si ordinano, non fanno somme e non cambiano la
        larghezza di una colonna, quindi scrivi le scadenze già in ordine di data.{" "}
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega il resto.
      </p>

      <h2 id="ripasso">Metodo Cornell e flashcard</h2>
      <p>
        Una tabella a due colonne è anche il modo più semplice di ripassare in Note. Per il metodo Cornell, metti una domanda breve a
        sinistra, il tuo appunto a destra e un riassunto sotto la tabella; copri la colonna destra e rispondi a voce alta. Il{" "}
        <a href="/it/blog/metodo-cornell-note-iphone">modello per il metodo Cornell</a> ne ha uno da incollare.
      </p>
      <p>
        Le flashcard funzionano allo stesso modo: una riga per carta, domanda e risposta. Quello che Note non sa fare è decidere quali carte
        vedi oggi, o riproporti quelle che hai sbagliato. <a href="/it/blog/flashcard-note-iphone">Flashcard nelle note di iPhone</a>{" "}
        mostra la struttura e i modi per aggirare i limiti.
      </p>

      <h2 id="operazioni">Risultati matematici per i compiti</h2>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Una nota Sequoia Group Expenses su iPhone: ogni spesa con un nome su una riga, i nomi sommati a 475 dollari, e 475 dollari diviso 5 uguale a 95 a testa."
        caption="L’esempio di Apple dei risultati matematici su iPhone: dai un nome ai numeri, poi usa i nomi. Immagine: Apple." />
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Risultati matematici"] }]} />
      <p>
        Scrivi un’operazione e un segno di uguale, come (27/3)^2=, e Note suggerisce il risultato; premi A capo per tenerlo. Note segue
        l’ordine standard delle operazioni, quindi aggiungi le parentesi dove servono. Puoi anche dare un nome a un numero su una riga sopra
        e usare il nome:
      </p>
      <Keep title="Numeri con un nome per i risultati matematici" text={MATH} copyLabel={ui.copy}
        note="Note propone il risultato dopo l’ultimo segno di uguale. Cambia un numero sopra e il risultato si aggiorna." />
      <p>
        Formato &gt; Risultati matematici sceglie se i risultati vengono inseriti, suggeriti o disattivati (Inserisci risultati,
        Suggerisci risultati o No). Ti dà il risultato, non i passaggi, quindi è più utile per controllare un risultato.
      </p>

      <h2 id="gruppo">Condividere le note con un gruppo di studio</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Pulsante Condividi", "Menu a comparsa", "Condividi un link"] },
        { on: "iPhone", steps: ["Pulsante Condividi", "Menu sotto il titolo", "Condividi un link"] },
      ]} />
      <p>
        Condividi un link invita le persone a lavorare nella stessa nota, e tutti vedono le modifiche mentre succedono. Scegli se possono
        modificare o solo vedere. Per condividere un corso intero, sul Mac fai clic sulla sua cartella tenendo premuto il tasto Ctrl e
        scegli Condividi cartella, oppure su iPhone aprila e tocca il pulsante Condividi. Ogni nota che aggiungi a una cartella condivisa
        viene condivisa con tutti quelli che ci sono, quindi tieni altrove le note private. Scrivi @ e un nome per avvisare qualcuno che ti
        serve.
      </p>
      <p>
        Tutti hanno bisogno di un Apple Account con Note attivo su iCloud, e le note protette non si possono condividere. Per un compagno
        che non ce l’ha, Invia una copia nello stesso menu manda una copia che può leggere ma non modificare.
      </p>

      <h2 id="limiti">Dove si ferma Note per lo studio</h2>
      <ul>
        <li><strong>Ogni nota si prepara a mano.</strong> Non ci sono modelli, quindi ogni nota del corso e ogni nota della lezione va incollata o duplicata.</li>
        <li><strong>Niente ti interroga.</strong> Coprire una colonna funziona, ma Note non fa le domande, non tiene il punteggio e non ti ripropone quello che hai sbagliato.</li>
        <li><strong>Le tabelle tengono solo testo.</strong> Non puoi ordinare un elenco di scadenze né sommare i voti in una tabella.</li>
        <li><strong>I gruppi hanno bisogno di Apple Account.</strong> Un compagno con un altro tipo di telefono riceve una copia, non la nota condivisa.</li>
      </ul>

      <h2 id="pinto-notes">Note che ti interrogano</h2>
      <Figure shot={{ ...SHOTS.flashcardsApp, alt: "L’app delle flashcard in una nota di Pinto Notes su un Mac: 8 carte da ripassare oggi, gli argomenti, un pulsante Study now, una serie di 11 giorni con un calendario, cosa arriva questa settimana e quante carte ci sono in ogni scatola." }}
        caption="Il modello Study notes and flashcards in Pinto Notes su un Mac, con dati di esempio." />
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Due dei suoi modelli gratuiti sono fatti per il ripasso, e un tocco aggiunge l’uno o l’altro alle tue note.
      </p>
      <p>
        <a href="/templates/cornell-notes">Cornell notes</a> tiene una sezione per lezione con una tabella Cue e Notes e un riassunto.
        Incolla gli appunti della lezione nella tua AI e lei scrive una domanda per ogni riga e il riassunto. Di’ &ldquo;interrogami su
        domanda e offerta&rdquo; e ti fa le domande una alla volta senza mostrarti gli appunti, poi tiene quelle che hai sbagliato sotto Cues
        to revisit.
      </p>
      <p>
        <a href="/templates/study-flashcards">Study notes and flashcards</a> è una piccola app in una nota. Incolla un capitolo e la tua AI
        ne ricava da cinque a dieci carte. Di’ &ldquo;interrogami su biologia, dieci carte&rdquo; e ti fa una carta alla volta, prima quelle
        che sai meno, e ti dice se hai risposto giusto. Le carte che sbagli tornano prima, e quelle che sai aspettano di più. Puoi
        aggiungere, modificare ed eliminare le carte nell’app da solo, e ogni versione precedente di una nota viene conservata. La parte con
        l’AI funziona una volta che <a href="/blog/connect-chatgpt-to-your-notes">colleghi ChatGPT</a> (in inglese) o Claude, cosa che
        richiede un minuto.
      </p>
      <p>
        Gli appunti che hai già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a> (in
        inglese), e Note di Apple resta com’era. L’app è in inglese.
      </p>
    </LocalPostPage>
  );
}
