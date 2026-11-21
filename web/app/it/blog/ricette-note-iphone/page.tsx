import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "ricette-note-iphone");

// Italian version of /blog/apple-notes-recipe-template (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: "salvare ricette" and "ricette su iphone" give come salvare ricette su iphone, "organizzare ricette" gives
// app per organizzare ricette, "ricettario digitale" gives ricettario digitale gratis and creare ricettario digitale;
// "ricette note iphone" gives nothing yet. So the slug and title say "ricette" plus "note di iPhone", with ricettario
// for the recipe box. Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apde615d29c2/mac (Modifica > Aggiungi link, Comando-K, links to another note),
// apd93c815aa0/mac (Formato > Altro > Deseleziona tutti), apda85974595/mac (Risultati matematici), apdb54e469b6/mac
// (mettere in evidenza una nota), not18ab658ed/mac (search), and the iPhone guide it-it/guide/iphone/iph908d1558b/ios
// (Aggiungi link) and iph1ac0b3a2/ios (the checklist button, which has no name, so it is described). Modifica > Incolla
// come Markdown is the Italian string in Notes' MainMenu.loctable on macOS 27 (not in the Italian guide yet). Facts are
// the English post's; the picture is its English one, described in Italian. The meal planner and grocery list links go
// to their Italian versions; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Zuppa di lenticchie al limone

Per 4, 35 minuti. Da: il quaderno della nonna

## Ingredienti
- [ ] 250 g di lenticchie rosse
- [ ] 1 cipolla
- [ ] 2 carote
- [ ] 2 spicchi d’aglio
- [ ] 1 cucchiaino di cumino in polvere
- [ ] 2 limoni

Dalla dispensa: olio d’oliva, sale.

## Procedimento
1. Fai appassire cipolla, carote e aglio nell’olio con il cumino.
2. Aggiungi le lenticchie e un litro d’acqua. Fai sobbollire per 20 minuti.
3. Frulla metà della zuppa, poi aggiungi il succo di limone e sale quanto basta.

## Appunti
- Fatta il 14 nov: serviva più limone.
`;

const INDEX = `# Ricettario

## Per la settimana
- Zuppa di lenticchie al limone

## Per il weekend
- Pollo arrosto con patate

## Dolci e lievitati
- Banana bread

## Da provare
- Noodles al sesamo
`;

const FAQ = [
  { q: "Note di Apple ha un modello per le ricette?", a: [
    "No. Note di Apple non ha modelli. Una nota per ricetta, con gli ingredienti come elenco di controllo e il procedimento come elenco numerato, funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Come organizzo le ricette in Note di Apple?", a: [
    "Metti ogni ricetta in una cartella Ricette, una nota ciascuna, e tieni una nota indice con i link sotto intestazioni come Per la settimana, Per il weekend e Dolci e lievitati. La ricerca trova una ricetta da qualsiasi parola che contiene, quindi anche da un ingrediente.",
  ] },
  { q: "Posso adattare le dosi di una ricetta in Note di Apple?", a: [
    "Non da sola. Note fa i calcoli che scrivi tu con Risultati matematici, ma non dimezza un elenco di ingredienti. Ogni quantità la cambi a mano.",
  ] },
  { q: "Esiste un’app per le ricette che funziona come Note di Apple?", a: [
    "Pinto Notes si presenta e funziona come Note di Apple e ha un modello gratuito, Recipe box. Incolla una ricetta in ChatGPT o Claude e lui salva una copia pulita con gli ingredienti come elenco di controllo, poi la mette nel tuo ricettario.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="ricette-note-iphone"
      intro={<>
        Le ricette finiscono in screenshot, schede aperte e sul retro di una busta. Note di Apple può tenerle tutte in un posto solo, se
        ogni ricetta ha la stessa forma. Ecco un modello di ricetta per Note di Apple da incollare, una nota indice per ritrovarle e dove
        smette di bastare.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#ricettario", label: "Un ricettario" },
          { href: "#in-cucina", label: "In cucina" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un ricettario che si ordina da solo" },
        ]}>
          <p>
            Note di Apple non ha un modello per le ricette, ma una nota per ricetta fa il lavoro: porzioni e tempo in alto, gli
            ingredienti come elenco di controllo, il procedimento come elenco numerato. Tienile in una cartella Ricette con una nota
            indice che le collega tutte, e copia il modello qui sotto per ogni ricetta nuova.
          </p>
          <PostCta slug="it/ricette-note-iphone" path="/it/blog/ricette-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi le ricette già messe in ordine?">
            <p>Pinto Notes funziona come Note di Apple e ha un ricettario gratuito. Incolla una ricetta in ChatGPT o Claude e lui salva una copia pulita, con gli ingredienti come elenco di controllo, e la mette al suo posto.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/recipe-note" width={1520} height={776} maxWidth={600}
        alt="Una nota Lentil soup with lemon in Pinto Notes su un Mac: per 4, 35 minuti, sei ingredienti come elenco di controllo con le lenticchie e la cipolla spuntate, una riga From the cupboard e tre passaggi numerati."
        caption="Una ricetta in Pinto Notes, come la salva il ricettario. La stessa struttura funziona in Note di Apple." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per ricetta</h2>
      <p>
        Ogni ricetta ha le stesse quattro parti, così la leggi al volo anche con le mani nella farina. La riga della dispensa tiene olio
        e sale fuori dall’elenco della spesa. Lascia una parola in ogni riga, perché un elemento vuoto dell’elenco di controllo si perde
        quando incolli.
      </p>
      <Keep title="Ricetta per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollala in una nota nuova con Modifica > Incolla come Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, Modifica &gt; Incolla come Markdown trasforma la riga con # nel titolo, ogni riga con ## in
        un’intestazione e gli ingredienti in un elenco di controllo. Un Comando-V normale lascia i simboli come testo. Su iPhone,
        scrivila, seleziona gli ingredienti e tocca il pulsante dell’elenco di controllo.
      </p>

      <h2 id="ricettario">Un ricettario: una nota indice</h2>
      <p>
        Una cartella di ricette si ordina per data, e non ti aiuta quando è martedì e vuoi qualcosa di veloce. Tieni una nota in più,
        Ricettario, con un’intestazione per ogni tipo di piatto, e mettila in evidenza in cima alla cartella.
      </p>
      <Keep title="Indice del ricettario" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Aggiungi link"], keys: "⌘K" },
        { on: "iPhone", steps: ["Menu di modifica", "Aggiungi link"] },
      ]} />
      <p>
        Poi trasforma ogni nome in un link: selezionalo, scegli Aggiungi link e scegli la nota della ricetta. Toccandolo si apre la
        ricetta. Le idee che trovi ma non hai ancora cucinato vanno sotto Da provare, così smettono di vivere nelle schede del browser.
      </p>

      <h2 id="in-cucina">In cucina</h2>
      <ul>
        <li>
          <strong>Spunta gli ingredienti mentre fai la spesa o cucini.</strong> L’elenco di controllo fa anche da lista della spesa, e in
          cucina ti dice cosa è già in pentola.
        </li>
        <li>
          <strong>Azzeralo per la prossima volta.</strong> Fai clic negli ingredienti e scegli Formato &gt; Altro &gt; Deseleziona tutti.
        </li>
        <li>
          <strong>Scrivi cosa hai cambiato.</strong> Una riga sotto Appunti, come &ldquo;serviva più limone&rdquo;, è il modo in cui una
          ricetta diventa tua.
        </li>
        <li>
          <strong>Cerca per ingrediente.</strong> La ricerca di Note legge ogni parola, quindi cercando &ldquo;ceci&rdquo; trovi tutte le
          ricette che li usano.
        </li>
      </ul>
      <p>
        Per pianificare la settimana in cucina partendo dal ricettario, il <a href="/it/blog/menu-settimanale-note-iphone">menu
        settimanale nelle note di iPhone</a> mette le cene e la spesa in una nota sola, e il{" "}
        <a href="/it/blog/lista-spesa-note-iphone">modello di lista della spesa</a> la divide per reparto. Altre note da incollare
        sono in <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma un ricettario in Note</h2>
      <ul>
        <li><strong>Ogni ricetta va scritta o sistemata a mano.</strong> Una ricetta copiata da un blog arriva con il racconto di chi l’ha scritta, la pubblicità e i commenti.</li>
        <li><strong>L’indice è a mano.</strong> Una ricetta nuova non è nel ricettario finché non aggiungi il suo link.</li>
        <li><strong>Niente dosi automatiche.</strong> Cucinare per due da una ricetta per sei vuol dire cambiare ogni quantità da te.</li>
        <li><strong>La ricerca trova parole, non risposte.</strong> Trova i ceci. Non sa dirti cosa fare con i ceci e gli spinaci da finire.</li>
      </ul>
      <p>
        Per qualche ricetta preferita, una cartella di note è tutto quello che ti serve. Per una vera raccolta, il lavoro è tenerla in
        ordine, e resta a te.
      </p>

      <h2 id="pinto-notes">Un ricettario che si ordina da solo</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/recipe-box">Recipe box</a> è una nota con le sezioni per le sere della
        settimana, il weekend, dolci e lievitati e le ricette da provare, e dentro una nota per ogni ricetta.
      </p>
      <p>
        Incolla una ricetta nella tua AI, pagina intera compresa. Lei salva una copia pulita come nota a sé: porzioni e tempo, gli
        ingredienti come elenco di controllo, cosa viene dalla dispensa e passaggi brevi e numerati, senza il racconto. Poi mette il link
        sotto l’intestazione giusta. Chiedi &ldquo;cosa posso fare con ceci e spinaci?&rdquo; e cerca nel ricettario, oppure
        &ldquo;dimezza la zuppa di lenticchie per due&rdquo; e fa i conti. Puoi sempre scrivere e modificare ogni ricetta da te, e ogni
        versione precedente di una nota viene conservata. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in
        inglese) richiede un minuto.
      </p>
      <p>
        Le ricette che tieni già in Note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul
        Mac</a>, e Note di Apple resta com’era.
      </p>
    </LocalPostPage>
  );
}
