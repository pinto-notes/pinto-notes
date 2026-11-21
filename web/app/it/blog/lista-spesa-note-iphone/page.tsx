import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "lista-spesa-note-iphone");

// Italian version of /blog/apple-notes-grocery-list-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "lista spesa iphone" gives lista spesa note iphone, lista spesa condivisa iphone, lista spesa
// promemoria iphone and condividere lista spesa iphone; "lista della spesa iphone" gives the same plus "dove scrivere la
// lista della spesa su iphone". So the slug says "lista spesa note iphone" and the title "lista della spesa nelle note
// di iPhone". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apd93c815aa0/mac ("Ordina automaticamente gli elementi selezionati", Formato >
// Altro > Deseleziona tutti), apdb54e469b6/mac (note in evidenza at the top of the list), apd4e6e2c9a6/mac (sharing to
// edit together, Può modificare, no collaboration on locked notes), support.apple.com/it-it/102462 ("Se non riesci a
// collaborare nell’app Note") and it-it/105086 ("Creare elenchi Spesa in Promemoria su iPhone": the Spesa list type from
// iOS 17, sorted into categories as you add), and the iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios (the checklist
// button, which has no name, so it is described). Modifica > Incolla come Markdown is the Italian string in Notes'
// MainMenu.loctable on macOS 27 (not in the Italian guide yet). Facts are the English post's; the picture is its English
// one, described in Italian. The meal planner and recipe links go to their Italian versions; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Spesa

## Frutta e verdura
- [ ] Mele
- [ ] Spinaci
- [ ] Limoni

## Pane e latticini
- [ ] Latte d’avena
- [ ] Uova

## Carne e pesce
- [ ] Filetti di salmone

## Dispensa
- [ ] Pelati, 2 scatole
- [ ] Riso

## Surgelati
- [ ] Piselli

## Casa
- [ ] Detersivo per i piatti
`;

const FAQ = [
  { q: "Note di Apple può ordinare la lista della spesa?", a: [
    "Non per reparto. Note tiene le cose nell’ordine in cui le scrivi. Metti un’intestazione per ogni reparto e aggiungi le cose sotto quella giusta, e attiva Ordina automaticamente gli elementi selezionati, così quello che è nel carrello scende in fondo.",
  ] },
  { q: "Per la spesa, meglio Note o Promemoria?", a: [
    "Promemoria ha un tipo di elenco Spesa, da iOS 17, che divide le cose per categoria man mano che le aggiungi. Note è meglio quando la lista sta accanto a un menu o a delle ricette, o quando vuoi i tuoi reparti nell’ordine del tuo supermercato.",
  ] },
  { q: "La mia famiglia può aggiungere cose alla stessa lista?", a: [
    "Sì. Condividi la nota e, nei permessi, scegli Può modificare. Serve un Apple Account a testa, e una nota protetta non si può condividere per modificarla insieme. Spunte e cose nuove compaiono su ogni telefono.",
  ] },
  { q: "Esiste una lista della spesa che si ordina da sola?", a: [
    "Pinto Notes ha un modello gratuito, Grocery list, ordinato per reparto. Di’ a ChatGPT o a Claude cosa ti serve, anche in una frase lunga, e lui mette ogni cosa sotto il suo reparto.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="lista-spesa-note-iphone"
      intro={<>
        Una lista della spesa in Note di Apple cresce nell’ordine in cui le cose finiscono, così giri il supermercato due volte.
        Un’intestazione per reparto risolve quasi tutto. Ecco un modello di lista della spesa per Note di Apple da incollare, come
        condividerla e quando Promemoria è lo strumento giusto.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararla", label: "Prepararla" },
          { href: "#condividerla", label: "Condividerla" },
          { href: "#promemoria", label: "Note o Promemoria" },
          { href: "#pinto-notes", label: "Una lista che si ordina da sola" },
        ]}>
          <p>
            Note di Apple non sa ordinare una lista della spesa per reparto, ma le intestazioni sì. Crea una nota con un’intestazione
            per ogni reparto e le cose come elenco di controllo sotto, attiva Ordina automaticamente gli elementi selezionati e
            condividila con chi altro fa la spesa. Copia il modello qui sotto per iniziare.
          </p>
          <PostCta template="grocery-list" slug="it/lista-spesa-note-iphone" path="/it/blog/lista-spesa-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi che ogni cosa vada da sola al suo posto?">
            <p>Pinto Notes funziona come Note di Apple e ha una lista della spesa gratuita divisa per reparto. Di’ a ChatGPT o a Claude cosa ti serve e lui mette ogni cosa sotto il reparto giusto.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/grocery-list-note" width={1520} height={1444} maxWidth={600}
        alt="Una nota Grocery list in Pinto Notes su un Mac: le intestazioni Fruit and veg, Bread and dairy, Meat and fish e Cupboard, ognuna con un elenco di controllo, con Bananas e Butter spuntati."
        caption="Una lista della spesa per reparto in Pinto Notes. La stessa struttura funziona in Note di Apple. Dati di esempio." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una lista, un’intestazione per reparto</h2>
      <p>
        Metti i reparti nell’ordine in cui giri il tuo supermercato, e lo attraversi una volta sola. Rinominali come ti servono:
        Gastronomia, Bambini, Animali. Lascia una parola in ogni riga, perché un elemento vuoto dell’elenco di controllo si perde quando
        incolli.
      </p>
      <Keep title="Lista della spesa per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollala in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararla">Prepararla</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Modifica", "Incolla come Markdown"] },
        { on: "Mac", steps: ["Formato", "Altro", "Deseleziona tutti"] },
      ]} />
      <ul>
        <li>
          <strong>Incollala.</strong> Su un Mac con macOS 27, crea una nota nuova e scegli Modifica &gt; Incolla come Markdown: ogni riga
          con ## diventa un’intestazione e le cose un elenco di controllo. Su iPhone, scrivi i reparti, poi le cose, selezionale e tocca
          il pulsante dell’elenco di controllo.
        </li>
        <li>
          <strong>Fai scendere quello che spunti.</strong> Attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle
          impostazioni di Note. Al supermercato, ogni cosa che spunti scende in fondo al suo reparto, così quello che manca resta sempre
          in alto.
        </li>
        <li>
          <strong>Tieni una lista sola, non una a settimana.</strong> Cancella le righe spuntate quando torni a casa, oppure scegli
          Formato &gt; Altro &gt; Deseleziona tutti per le cose che compri ogni settimana.
        </li>
        <li>
          <strong>Mettila in evidenza.</strong> Una nota in evidenza sta in cima alle tue note, quindi è la prima cosa che vedi al
          supermercato.
        </li>
      </ul>

      <h2 id="condividerla">Condividila con chi fa la spesa con te</h2>
      <p>
        Condividi la nota e, nei permessi, scegli Può modificare. Chi è a casa aggiunge quello che è finito, chi è al supermercato lo
        spunta, e le modifiche compaiono su ogni telefono. Serve un Apple Account a testa, e una nota protetta non si può condividere
        per modificarla insieme.
      </p>
      <p>
        Se prima pianifichi le cene, il <a href="/it/blog/menu-settimanale-note-iphone">menu settimanale nelle note di iPhone</a> tiene
        i pasti della settimana e questa lista in una nota sola, e il{" "}
        <a href="/it/blog/ricette-note-iphone">modello per le ricette</a> tiene gli ingredienti di ogni ricetta come un elenco di
        controllo da cui fare la spesa. Altre note da incollare sono in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="promemoria">Note o Promemoria?</h2>
      <p>
        Va detto a favore di Promemoria: da iOS 17 ha un tipo di elenco Spesa che divide da solo per categoria quello che aggiungi, che
        è proprio la cosa che Note non sa fare. Se ti serve solo una lista che si ordina, usa quello.
      </p>
      <p>
        Note vince quando la lista sta accanto ad altre cose: un menu, una ricetta, una nota su chi viene a cena. E ti lascia scegliere i
        reparti e il loro ordine, mentre Promemoria sceglie le sue categorie.
      </p>

      <h2 id="limiti">Dove si ferma una lista della spesa in Note</h2>
      <ul>
        <li><strong>L’ordine lo fai tu.</strong> Ogni cosa va sotto il suo reparto a mano, quindi un’aggiunta veloce mentre esci finisce in fondo.</li>
        <li><strong>Nessun controllo dei doppioni.</strong> In due aggiungete il latte, e ne comprate due.</li>
        <li><strong>Si ripulisce a mano.</strong> Dopo la spesa, le righe spuntate restano finché non le cancelli.</li>
      </ul>

      <h2 id="pinto-notes">Una lista della spesa che si ordina da sola</h2>
      <p>
        Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare nelle tue note dalla
        chat che usi già. Il modello gratuito <a href="/templates/grocery-list">Grocery list</a> è una lista sola divisa per reparto:
        frutta e verdura, pane e latticini, carne e pesce, dispensa, surgelati e casa.
      </p>
      <p>
        Di’ alla tua AI cosa ti serve, anche in una frase lunga: &ldquo;ci servono uova, due scatole di pelati, spinaci e il detersivo
        per i piatti&rdquo;. Lei mette ogni cosa sotto il suo reparto e salta quello che è già in lista. Quando dici che sei tornato
        dalla spesa, cancella le righe spuntate e ti dice cosa manca ancora. Puoi sempre scrivere e spuntare ogni cosa da te, e puoi{" "}
        <a href="/blog/share-a-note-and-edit-it-together">condividere la nota e modificarla insieme</a> (in inglese), con le modifiche
        di tutti che compaiono mentre scrivono. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese)
        richiede un minuto.
      </p>
    </LocalPostPage>
  );
}
