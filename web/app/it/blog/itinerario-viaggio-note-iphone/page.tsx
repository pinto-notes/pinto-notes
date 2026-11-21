import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "itinerario-viaggio-note-iphone");

// Italian version of /blog/apple-notes-trip-planner-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "itinerario di viaggio" gives itinerario di viaggio modello, modello word, app, esempio, pdf;
// "planner viaggio" and "organizzare un viaggio" are mostly destinations; "lista valigia" gives lista valigia da
// spuntare. So the slug and title say "itinerario viaggio" plus "note di iPhone", and the valigia goes in the title.
// Apple's own Italian words, all read 21 Nov: the Mac guide support.apple.com/it-it/guide/notes/apde615d29c2/mac
// ("Aggiungere link in Notes sul Mac": Modifica > Aggiungi link, Comando-K, Link alla sezione, ">>"), apd0a136b9cc/mac
// (Formato > Tabella), not9474646a9/mac (File > Duplica nota), apd93c815aa0/mac (Formato > Altro > Deseleziona
// tutti), not95edd2813/mac (dragging a file from the Finder into a note), the iPhone guide
// it-it/guide/iphone/iph908d1558b/ios (Aggiungi link, Link alla sezione) and iph1ac0b3a2/ios (the checklist button,
// which has no name, so it is described). Modifica > Incolla come Markdown and the Link a field are the Italian strings
// in Notes' MainMenu.loctable and Localizable.loctable on macOS 27 (Paste as Markdown is not in the Italian guide yet).
// iOS 27's Attach File in the iPhone edit menu: no Italian Apple page names it, so the step is described without a
// menu name. Facts are the English post's; the pictures are its English ones, described in Italian. The example trip
// leaves from Rome instead of Stockholm.

const ui = UI.it;

const TEMPLATE = `# Lisbona, dal 22 al 26 ottobre

## Prenotazioni
- [ ] Volo FCO-LIS, gio 22 ott 06:55, cod. TP7XQ2
- [ ] Hotel Principe Real, dal 22 al 26 ott, cod. 88412093
- [ ] Cena con fado, sab 24 ott 20:00
- [ ] Volo LIS-FCO, lun 26 ott 17:40

## Giovedì 22 ottobre
- 06:55 Volo per Lisbona
- 13:00 Pranzo al Time Out Market
- 15:00 Check-in in hotel
- 19:30 Tramonto al Miradouro da Senhora do Monte

## Venerdì 23 ottobre
- 09:30 Tram 28 fino all’Alfama
- 12:00 Pranzo vicino al castello
- Pomeriggio libero

## Sabato 24 ottobre
- 10:00 Gita a Sintra
- 20:00 Cena con fado

## Valigia
- [ ] Passaporto o carta d’identità
- [ ] Dati dell’assicurazione di viaggio
- [ ] Caricatore del telefono
- [ ] Adattatore per le prese
- [ ] Scarpe comode
- [ ] Giacca impermeabile
- [ ] Spazzolino
- [ ] Crema solare

## Idee
- Portare a casa sardine in scatola
- Chiedere a Giulia la sua lista di pasticcerie
`;

const FAQ = [
  { q: "Note di Apple ha un modello per organizzare un viaggio?", a: [
    "No. Note di Apple non ha un pianificatore di viaggi e nemmeno dei modelli. Una nota con un’intestazione per le prenotazioni, una per ogni giorno e un elenco di controllo per la valigia funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Posso tenere i biglietti in Note di Apple?", a: [
    "Sì. Sul Mac, trascina il PDF nella nota. Su iPhone con iOS 27, puoi allegare un file dal menu di modifica. Un limite: una nota con un file allegato non si può proteggere.",
  ] },
  { q: "Come riuso la lista della valigia per il prossimo viaggio?", a: [
    "Duplica la nota con File > Duplica nota, poi fai clic nella lista della valigia e scegli Formato > Altro > Deseleziona tutti. Cambia le date e cancella i giorni vecchi.",
  ] },
  { q: "Esiste un pianificatore di viaggi gratuito che funziona come una nota?", a: [
    "Pinto Notes ha un modello gratuito, Trip plan: una nota che è una piccola app, con un conto alla rovescia, ogni giorno come una linea del tempo, le prenotazioni con una spunta per quelle pagate e la lista della valigia. ChatGPT o Claude possono aggiungere una prenotazione che incolli.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="itinerario-viaggio-note-iphone"
      intro={<>
        Il volo è in un’email, l’hotel in un’altra, il programma del sabato in una chat e la lista della valigia nella tua testa. Note
        di Apple può tenere tutto in una nota sola. Ecco un modello di viaggio da incollare, tre modi per farlo funzionare meglio e dove
        si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#meglio", label: "Farlo funzionare meglio" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un viaggio che tiene i conti" },
        ]}>
          <p>
            Note di Apple non ha un pianificatore di viaggi, ma una nota fa il lavoro. Mettici un elenco di controllo delle prenotazioni
            da spuntare quando sono pagate, un’intestazione per ogni giorno con l’orario davanti a ogni cosa, e un elenco di controllo
            per la valigia. Copia il modello qui sotto.
          </p>
          <PostCta template="trip-plan" slug="it/itinerario-viaggio-note-iphone" path="/it/blog/itinerario-viaggio-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi conto alla rovescia e prenotazioni già in ordine?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per i viaggi: i giorni che mancano, ogni giorno come una linea del tempo, cosa resta da pagare e cosa è già in valigia. Incolla l’email di una prenotazione in ChatGPT o Claude e finisce nel programma.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/trip-booking" width={1200} height={750} maxWidth={560}
        alt="Una busta disegnata con una freccia verso una scheda con un elenco di controllo, due voci spuntate in arancione."
        caption="Ogni email di prenotazione diventa una riga del programma." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per ogni viaggio</h2>
      <p>
        Quattro giorni a Lisbona, come esempio. Metti il tuo viaggio prima di incollare: le prenotazioni con i loro codici, un’intestazione
        per ogni giorno e quello che dimentichi sempre di mettere in valigia. Lascia una parola in ogni riga, perché un elemento vuoto
        dell’elenco di controllo si perde quando incolli.
      </p>
      <Keep title="Itinerario di viaggio per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Lo stesso Markdown incollato due volte in Note di Apple su macOS 27: con Comando-V i simboli restano testo, con Incolla come Markdown diventano un’intestazione, un elenco e del testo in grassetto."
        caption="A sinistra l’incolla normale, a destra Incolla come Markdown. Le righe dell’elenco di controllo funzionano allo stesso modo." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, crea una nota nuova e scegli Modifica &gt; Incolla come Markdown. La riga con # diventa il titolo, ogni
        riga con ## un’intestazione, le prenotazioni e la valigia diventano elenchi di controllo e il programma resta un elenco. Un
        Comando-V normale lascia i simboli come testo. Su iPhone, scrivi le righe, seleziona le prenotazioni e la valigia e tocca il
        pulsante dell’elenco di controllo.
      </p>
      <p>
        Spunta una prenotazione quando l’hai pagata, così quelle senza spunta sono quello che devi ancora pagare. Se preferisci vedere
        le prenotazioni in una tabella con le colonne per la data e il codice, Formato &gt; Tabella ne crea una;{" "}
        <a href="/blog/apple-notes-tables">tables in Apple Notes</a> (in inglese) spiega come, e cosa le tabelle non sanno fare.
      </p>

      <h2 id="meglio">Farlo funzionare meglio</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Aggiungi link", "Link alla sezione"], keys: "⌘K" },
        { on: "iPhone", steps: ["Aggiungi link", "Link alla sezione"] },
      ]} />
      <ul>
        <li>
          <strong>Un indice in cima.</strong> Su macOS 27 e iOS 27 un link può puntare a un’intestazione, quindi la nota può iniziare con
          un link per ogni giorno. Scrivi il titolo del viaggio nel campo Link a e compaiono le sue intestazioni.{" "}
          <a href="/blog/apple-notes-ios-27">What’s new in Apple Notes in iOS 27</a> (in inglese) ha i dettagli.
        </li>
        <li>
          <strong>I biglietti nella nota.</strong> Sul Mac, trascina il PDF di un biglietto o di una conferma dell’hotel nella nota, sotto
          la sua prenotazione. Su iPhone con iOS 27, allega il file dal menu di modifica. Una nota con un file dentro non si può
          proteggere, quindi tieni fuori i numeri del passaporto.
        </li>
        <li>
          <strong>La stessa lista la prossima volta.</strong> Quando torni, scegli File &gt; Duplica nota, poi fai clic nella lista della
          valigia e scegli Formato &gt; Altro &gt; Deseleziona tutti. La copia è l’inizio del prossimo viaggio.
        </li>
      </ul>
      <p>
        Se organizzi spesso così, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese) ha una lista per la
        valigia e una revisione settimanale da incollare allo stesso modo.
      </p>

      <h2 id="limiti">Dove si ferma un itinerario in Note</h2>
      <ul>
        <li><strong>Niente conto alla rovescia.</strong> Le date sono parole. Note non sa che il viaggio è tra nove giorni, o che oggi è il secondo giorno.</li>
        <li><strong>Prenotazioni a mano.</strong> Ogni email di conferma la copi riga per riga: l’orario, il codice, il giorno a cui appartiene.</li>
        <li><strong>I giorni non si riordinano.</strong> Aggiungi una cena al venerdì e devi trovare tu l’intestazione del venerdì e il punto giusto. Spostala al sabato e tocca tagliare e incollare.</li>
        <li><strong>Niente conteggi.</strong> Quante prenotazioni restano da pagare o quanto manca alla valigia lo scopri contando le spunte.</li>
      </ul>
      <p>
        Per un weekend fuori, la nota basta e avanza. Per una settimana con voli, treni e qualche cena prenotata, finisci per tenere in
        ordine il programma a mano.
      </p>

      <h2 id="pinto-notes">Un programma di viaggio che tiene i conti</h2>
      <Figure shot={{ ...SHOTS.tripApp, alt: "L’app del viaggio in una nota di Pinto Notes su un Mac: Lisbona, 9 giorni alla partenza, 3 prenotazioni pagate su 5, 5 cose in valigia su 14, e il primo giorno come una linea del tempo con il volo e l’hotel." }}
        caption="Il modello Trip plan in Pinto Notes su un Mac, con dati di esempio: 9 giorni alla partenza, 3 prenotazioni pagate su 5, 5 cose in valigia su 14, e il primo giorno come una linea del tempo." />
      <p>
        Per questo esiste Pinto Notes. Si presenta e funziona come Note di Apple su iPhone e Mac, e una nota può essere anche una piccola
        app. Il modello gratuito <a href="/templates/trip-plan">Trip plan</a> è una di queste. Dici dove vai e quando, e lui conta i
        giorni che mancano, poi ti mostra in che giorno del viaggio sei. Ogni giorno è una linea del tempo con le sue prenotazioni al
        posto giusto. Le prenotazioni hanno un tipo, un orario, un codice e una spunta quando sono pagate, così sai cosa resta da pagare.
        La lista della valigia è divisa in gruppi, con un tocco per ogni cosa, e un viaggio nuovo la tiene.
      </p>
      <p>
        Puoi anche incollare la conferma di una prenotazione in ChatGPT o Claude, nella chat che usi già, e la prenotazione finisce nel
        giorno giusto. Chiedi cosa devi ancora prenotare e legge il programma per risponderti.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese) richiede un minuto.
      </p>
      <p>
        Le tue note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple
        resta com’era.
      </p>
    </LocalPostPage>
  );
}
