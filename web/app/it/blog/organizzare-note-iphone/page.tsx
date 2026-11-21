import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "organizzare-note-iphone");

// Italian version of /blog/apple-notes-organize (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it) on
// 21 Nov: "organizzare note iphone" gives come organizzare note iphone; "come organizzare le note" gives come
// organizzare le note su iphone; "organizzare note" gives come organizzare note iphone and app per organizzare note;
// "cartelle note" gives cartelle note iphone and cartelle smart note. So the slug says organizzare-note-iphone and the
// title "Come organizzare le note di iPhone". Apple's own Italian words, all read 21 Nov 2026, from the same pages the
// English post cites: the Mac guide it-it/guide/notes/apd558a85438/mac ("Aggiungere e rimuovere cartelle sul Mac":
// File > Nuova cartella, drag notes in, the Opzione key copies, drag a folder onto another for a sottocartella, Rinomina
// cartella and Elimina cartella from the button next to the folder or a Ctrl-click, notes of a deleted folder go to
// Eliminate for 30 days, no sottocartella in "Tutte [account]" or in Note), apdb54e469b6/mac ("Ordinare e mettere in
// evidenza le note sul Mac": Note > Impostazioni, "Ordina note per"; one folder, the button then "Ordina per"; the
// "Tutte [account]" and Eliminate folders follow the default; mettere in evidenza from the File menu or a two-finger
// swipe right; drag between Note and In evidenza; it shows on every device with the same Apple Account; needs upgraded
// iCloud notes or notes on the Mac) and apd000074a4e/mac ("Raggruppa note per data" in Impostazioni; per folder
// "Raggruppa per data"; not when sorted by title); the iPhone guide it-it/guide/iphone/ipha61270292/ios ("Organizzare
// le note in cartelle su iPhone": Nuova cartella, touch and hold a folder and drag it onto another, Rinomina, swipe left
// to delete, swipe left on a note or touch and hold then Sposta, "Ordina per" with "Meno recenti prima" and
// "Discendente", Impostazioni, App, Note, "Ordina note per", grouped by date by default, "Raggruppa per data", swipe
// right and tap the puntina) and its iOS 15 version ipha61270292/15.0/ios/15.0 for the three sort choices, data di
// modifica, data di creazione o titolo. The Mac's File menu item is "Nota in evidenza" in Notes' MainMenu.loctable on
// macOS 27 (the guide shortens it to "In evidenza"), and "Sposta in" is in its Localizable.loctable. From the earlier
// Italian posts and their sources: tags with # (apdc88ed7f1d/mac), the cartella smart rules Tag with "Solo note senza
// tag", "Data di modifica", Elenchi di controllo: Non selezionati (apd58edc7964/mac and Notes' SmartFolder loctables),
// tagged notes can't be locked (iphf177bb154/ios), the pulsante Altro, Seleziona note and the pulsante Cartella on
// iPhone (support.apple.com/it-it/118442), Modifica > Aggiungi link, Comando-K, ">>" and "Link alla sezione"
// (apde615d29c2/mac, iph908d1558b/ios), Modifica > Incolla come Markdown and Formato > Altro > Deseleziona tutti
// (apd93c815aa0/mac). Pictures: Apple's iOS 27 Folders list and Select Notes images and SHOTS.notesDefaultAccount,
// described in Italian. Links go to the Italian meeting notes post; the rest go to English posts.

const ui = UI.it;

const TIDY = `# Riordino settimanale

- [ ] Sposta ogni nota della cartella Note in una cartella, o eliminala
- [ ] Aggiungi un tag alle note in Senza tag che ne hanno bisogno
- [ ] Guarda Questa settimana e cerca note nella cartella sbagliata
- [ ] Togli dall’evidenza quello che è finito
- [ ] Svuota o elimina gli elenchi finiti in Da fare
- [ ] Sposta i progetti finiti in Archivio
`;

const FAQ = [
  { q: "Qual è il modo migliore per organizzare le note di iPhone?", a: [
    "Poche cartelle ampie per le aree della tua vita, tag per gli argomenti che le attraversano, una nota indice in evidenza per ogni cartella, e dieci minuti alla settimana per sistemare quello che si è accumulato. La ricerca trova qualsiasi parola, quindi il sistema deve solo rendere facile sfogliare.",
  ] },
  { q: "Come ordino le note in ordine alfabetico?", a: [
    "Ordinale per titolo. Su iPhone, apri la cartella, apri il suo menu, tocca Ordina per e scegli il titolo. Sul Mac, fai clic sul pulsante accanto alla cartella e scegli Ordina per, oppure imposta Ordina note per in Note, Impostazioni per tutte le cartelle. Il raggruppamento per data non c’è in una cartella ordinata per titolo.",
  ] },
  { q: "Si possono creare sottocartelle in Note?", a: [
    "Sì. Trascina una cartella su un’altra, sul Mac o su iPhone (su iPhone tienila prima premuta). Le uniche cartelle che non possono contenere una sottocartella sono la cartella Tutte di un account e la cartella Note.",
  ] },
  { q: "Meglio cartelle o tag in Note?", a: [
    "Tutti e due. Una nota sta in una sola cartella e può avere molti tag. Il consiglio di Apple dentro Note è usare le cartelle per le aree ampie, come il lavoro, e i tag per gli argomenti, come #tasse. Una nota con un tag non si può proteggere, quindi tieni le note protette in ordine con le cartelle.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="organizzare-note-iphone"
      intro={<>
        Quasi tutte le raccolte di note crescono allo stesso modo: tutto finisce in Note, ordinato per ultima modifica, finché scorrere
        non basta più. Ecco come organizzare le note su iPhone e Mac con quello che Note ha già, una struttura di cartelle da copiare e un
        riordino settimanale che la tiene in piedi.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#cartelle", label: "Cartelle" },
          { href: "#ordinare", label: "Ordinare" },
          { href: "#in-evidenza", label: "In evidenza" },
          { href: "#tag", label: "Tag e cartelle smart" },
          { href: "#struttura", label: "Una struttura da copiare" },
          { href: "#link", label: "Link" },
          { href: "#riordino", label: "Riordino settimanale" },
        ]}>
          <p>
            Crea poche cartelle ampie, con sottocartelle solo dove una cartella si riempie troppo, e metti un tag alle note sugli argomenti
            che attraversano più cartelle. Ordina ogni cartella nel modo in cui cerchi le cose (per data di modifica, data di creazione o
            titolo) e metti in evidenza le poche note che apri ogni giorno. Poi dedica dieci minuti alla settimana a sistemare quello che è
            finito in Note.
          </p>
          <PostCta slug="it/organizzare-note-iphone" path="/it/blog/organizzare-note-iphone" position="answer" ui={ui.cta}
            title="Preferisci non mettere in ordine tu?">
            <p>Pinto Notes funziona come Note di Apple. Collega ChatGPT o Claude, e quando glielo chiedi spostano le note nelle cartelle giuste, aggiungono i tag e fanno ordine.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="L’elenco Folders in Note su iPhone con iOS 27: Quick Notes e Shared, cartelle di iCloud come Notes, Gift Ideas, Grocery List e Sketches, e una sezione Tags sotto."
        caption="Cartelle per le aree, tag per gli argomenti, tutto in un elenco. Immagine: Apple." />}
      faq={FAQ}
    >
      <h2 id="cartelle">Cartelle e sottocartelle</h2>
      <Paths rows={[
        { on: "Mac", steps: ["File", "Nuova cartella"] },
        { on: "iPhone", steps: ["Elenco delle cartelle", "Nuova cartella"] },
      ]} />
      <p>
        Sul Mac, seleziona una cartella nell’account che vuoi, scegli File &gt; Nuova cartella e scrivi un nome. Su iPhone, nell’elenco
        delle cartelle tocca il pulsante per una cartella nuova, poi Nuova cartella. Per creare una sottocartella, trascina una cartella su
        un’altra (su iPhone, tienila prima premuta). Trascinala fuori per tornare indietro. La cartella Tutte e la cartella Note non possono
        contenere sottocartelle, quindi costruisci la tua struttura accanto a loro.
      </p>
      <p>
        Per spostare una nota sul Mac, trascinala su una cartella della barra laterale, oppure fai clic sulla nota tenendo premuto il tasto
        Ctrl e scegli Sposta in. Tieni premuto Opzione mentre la rilasci per copiarla invece di spostarla. Su iPhone, scorri a sinistra sulla
        nota e tocca il pulsante della cartella, oppure tienila premuta e tocca Sposta.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Note su iPhone con iOS 27 in modalità selezione: 3 Selected, tre note spuntate e un pulsante Folder in basso a sinistra per spostarle."
        caption="Per sistemare più note insieme: Seleziona note, poi il pulsante Cartella. Immagine: Apple." />
      <p>
        Per un mucchio di note su iPhone, apri la cartella, tocca il pulsante Altro, poi Seleziona note, spunta le note e tocca il pulsante
        Cartella. Eliminare una cartella manda le sue note in Eliminate di recente, dove restano 30 giorni, quindi un’eliminazione sbagliata
        si può annullare.
      </p>

      <h2 id="ordinare">Ordinare le note per data o per titolo</h2>
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Le impostazioni generali di Note di Apple su un Mac con macOS 26: Sort notes by Date Edited, New notes start with Title, e Default account impostato su iCloud, che Siri usa per creare le note." }}
        ground="sky" caption="Note, Impostazioni su un Mac con macOS 26. Ordina note per decide l’ordine di tutte le cartelle." />
      <Paths rows={[
        { on: "Mac", steps: ["Note", "Impostazioni", "Ordina note per"] },
        { on: "Mac, una cartella", steps: ["Pulsante accanto alla cartella", "Ordina per"] },
        { on: "iPhone, una cartella", steps: ["Menu della cartella", "Ordina per"] },
        { on: "iPhone, tutte le cartelle", steps: ["Impostazioni", "App", "Note", "Ordina note per"] },
      ]} />
      <p>
        Una cartella si può ordinare per data di modifica, data di creazione o titolo. Il titolo è il modo per mettere le note in ordine
        alfabetico, e va bene per una cartella di note da consultare, come ricette o manuali. La data di modifica va bene per una cartella
        di lavoro, dove quello che hai toccato per ultimo è quello che ti serve dopo. Su iPhone, Ordina per offre anche Meno recenti prima
        per la data e Discendente per il titolo.
      </p>
      <p>
        L’ordine scelto per una cartella vale solo per quella cartella. Sul Mac, le cartelle Tutte ed Eliminate seguono sempre l’ordine di
        default delle impostazioni. Note raggruppa anche l’elenco sotto date come Oggi e Ieri; si disattiva con Raggruppa per data nello
        stesso menu. Una cartella ordinata per titolo non si può raggruppare per data.
      </p>

      <h2 id="in-evidenza">Metti in evidenza le note che apri ogni giorno</h2>
      <Paths rows={[
        { on: "Mac", steps: ["File", "Nota in evidenza"] },
        { on: "iPhone", steps: ["Scorri a destra sulla nota", "Puntina"] },
      ]} />
      <p>
        Una nota in evidenza resta in cima alla sua cartella, qualunque sia l’ordine. Sul Mac puoi anche scorrere a destra con due dita e
        fare clic sulla puntina, oppure trascinare una nota tra le sezioni In evidenza e Note. Su iPhone puoi anche tenere premuta la nota e
        metterla in evidenza dal menu. La nota resta in evidenza su ogni dispositivo collegato allo stesso Apple Account. Serve che sia una
        nota di iCloud o una nota sul tuo Mac.
      </p>
      <p>
        Tienine poche. Due o tre per cartella bastano: la lista della spesa di adesso, il piano di questa settimana e una nota indice per
        la cartella (ne parliamo sotto).
      </p>

      <h2 id="tag">Tag e cartelle smart</h2>
      <p>
        Una nota sta in una sola cartella ma può avere molti tag. Scrivi # e una parola, come #tasse, in un punto qualsiasi della nota. Il
        consiglio di Apple dentro Note è cartelle per le aree ampie e tag per gli argomenti, e funziona: una ricevuta va in Soldi con
        #tasse, e una nota sul commercialista va in Lavoro, sempre con #tasse.
      </p>
      <p>
        Una cartella smart è un filtro salvato che elenca le note di tutte le cartelle in base a regole come Tag, Data di modifica o
        Elenchi di controllo. Per il riordino settimanale qui sotto ne servono tre: Senza tag (una regola Tag impostata su Solo note senza
        tag), Questa settimana (Data di modifica negli ultimi 7 giorni) e Da fare (Elenchi di controllo: Non selezionati). Le note restano
        dove sono. Ogni regola, e il motivo per cui a volte un tag non si forma, sono in{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> (in inglese). Un’avvertenza: una nota con un
        tag non si può proteggere.
      </p>

      <h2 id="struttura">Una struttura di cartelle semplice da copiare</h2>
      <p>
        Parti da cartelle per i posti dove cercheresti, e aggiungi una sottocartella solo quando una cartella diventa troppo lunga da
        scorrere. Due livelli bastano a quasi tutti.
      </p>
      <ul>
        <li><strong>Note.</strong> La cartella che c’è già, usata come posta in arrivo. Scrivi qui e sistema dopo.</li>
        <li><strong>Casa.</strong> La casa, l’auto, i manuali e le garanzie.</li>
        <li><strong>Soldi.</strong> Budget, ricevute, abbonamenti. Metti #tasse a tutto quello che serve per la dichiarazione dei redditi.</li>
        <li><strong>Salute.</strong> Visite, farmaci, allenamento.</li>
        <li><strong>Lavoro.</strong> Con le sottocartelle Progetti, Riunioni e Riferimenti se si riempie.</li>
        <li><strong>Viaggi.</strong> Una nota per viaggio.</li>
        <li><strong>Ricette.</strong> Ordinate per titolo.</li>
        <li><strong>Idee.</strong> Tutto quello su cui vuoi tornare.</li>
        <li><strong>Archivio.</strong> Progetti finiti e vecchi viaggi, fuori dai piedi e sempre trovabili con la ricerca.</li>
      </ul>
      <p>
        Organizzare le note per il lavoro segue lo stesso schema. Dai a ogni progetto una sottocartella sotto Lavoro, e metti un tag a un
        cliente in tutte le cartelle, come #acme. Le riunioni sono più facili con una nota per riunione, sempre con la stessa forma, che
        ti dà il <a href="/it/blog/appunti-riunione-note-iphone">modello per gli appunti di riunione</a>. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="link">Collega le note in un indice</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Aggiungi link"], keys: "⌘K" },
        { on: "iPhone", steps: ["Seleziona il testo", "Aggiungi link"] },
      ]} />
      <p>
        Le cartelle ordinano le note per data o per titolo. Una nota indice le ordina per significato. Crea una nota per ogni cartella
        piena, per esempio Indice lavoro, con un’intestazione per ogni progetto e un link a ogni nota sotto, e mettila in evidenza. Per
        creare un link, seleziona il testo, scegli Aggiungi link e scegli la nota, oppure scrivi <code>&gt;&gt;</code> e il titolo della
        nota. Su iOS 27 e macOS 27 un link può anche portare a un’intestazione dentro una nota, con Link alla sezione, come spiega{" "}
        <a href="/blog/apple-notes-ios-27">what’s new in Apple Notes</a> (in inglese).
      </p>

      <h2 id="riordino">Un riordino settimanale di dieci minuti</h2>
      <p>
        Una volta alla settimana (la domenica sera va bene), passa la cartella Note e le tre cartelle smart. Incolla questo elenco di
        controllo in una nota e mettila in evidenza.
      </p>
      <Keep title="Riordino settimanale per Note di Apple" text={TIDY} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma le righe in un elenco di controllo. Su iPhone, scrivi le
        righe, selezionale e tocca il pulsante dell’elenco di controllo. Quando hai finito, fai clic nell’elenco e scegli Formato &gt;
        Altro &gt; Deseleziona tutti, ed è pronto per la settimana dopo.
      </p>

      <h2 id="limiti">Dove si ferma l’organizzazione in Note</h2>
      <ul>
        <li><strong>Sistemare è a mano.</strong> Ogni nota nella cartella Note aspetta che tu la sposti.</li>
        <li><strong>I tag si mettono a mano</strong>, una nota o un gruppo selezionato alla volta.</li>
        <li><strong>Le note indice invecchiano.</strong> Una nota nuova non è nell’indice finché non aggiungi il suo link.</li>
        <li><strong>La ricerca trova parole, non risposte.</strong> Trova ogni nota che dice &ldquo;cucina&rdquo;. Non sa dirti quale ha deciso il budget.</li>
      </ul>
      <p>
        Per qualche centinaio di note, cartelle, note in evidenza e un riordino settimanale bastano. Oltre, il riordino diventa il lavoro,
        e resta a te.
      </p>

      <h2 id="pinto-notes">Note che si mettono in ordine da sole</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, con cartelle, sottocartelle, note in evidenza e una ricerca
        su ogni parola. Una volta collegati ChatGPT o Claude, il riordino lo fanno loro. Chiedi &ldquo;sposta tutto quello che c’è in Note
        nelle cartelle giuste&rdquo;, &ldquo;metti un tag a ogni nota sui lavori in cucina&rdquo; o &ldquo;sposta i viaggi finiti in
        Archivio&rdquo;, e le note si spostano. Puoi sempre sistemare e modificare tutto da solo, e ogni versione precedente di una nota
        viene conservata. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Per l’abitudine settimanale, il modello gratuito <a href="/templates/weekly-review">Weekly review</a> fa sì che la tua AI ti faccia
        cinque domande la domenica e scriva la settimana in una nota, la più recente in alto, con le tue tre priorità per la settimana dopo
        come elenco di controllo. Altri sono in <a href="/templates">templates</a>.
      </p>
      <p>
        Le note che hai già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a> (in
        inglese), cartelle comprese, e Note di Apple resta com’era. L’app è in inglese.
      </p>
    </LocalPostPage>
  );
}
