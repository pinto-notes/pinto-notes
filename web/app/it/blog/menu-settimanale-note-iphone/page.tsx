import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "menu-settimanale-note-iphone");

// Italian version of /blog/apple-notes-meal-planner-template (21 Nov 2026). Search words, Google autocomplete (hl=it,
// gl=it) on 21 Nov: "menu settimanale" is the big one (menu settimanale sano, pdf, da appendere), "menu settimanale app"
// gives app menu settimanale e lista spesa, "pianificare pasti" gives pianificare pasti settimanali, "piano pasti
// settimanale" and "planner pasti settimanale" exist; nothing yet with "note iphone". So the slug and title say "menu
// settimanale" plus "note di iPhone", with the spesa in the title. Apple's own Italian words, all read 21 Nov: the Mac
// guide support.apple.com/it-it/guide/notes/apd93c815aa0/mac ("Ordina automaticamente gli elementi selezionati",
// Formato > Altro > Deseleziona tutti), not9474646a9/mac (File > Duplica nota), apde615d29c2/mac (Aggiungi link, links
// to a heading), apd0a136b9cc/mac (Formato > Tabella), apd4e6e2c9a6/mac (sharing to edit together, Può modificare, no
// collaboration on locked notes), support.apple.com/it-it/102462 ("Se non riesci a collaborare nell’app Note", up to 100
// people) and it-it/105086 ("Creare elenchi Spesa in Promemoria su iPhone": the Spesa list type from iOS 17, sorted into
// categories as you add), and the iPhone guide it-it/guide/iphone/iph1ac0b3a2/ios (the checklist button, which has no
// name, so it is described). Modifica > Incolla come Markdown is the Italian string in Notes' MainMenu.loctable on
// macOS 27 (not in the Italian guide yet). Facts are the English post's; the pictures are its English ones, described
// in Italian. The grocery list link goes to its Italian version; the rest go to English posts.

const ui = UI.it;

const TEMPLATE = `# Cene, settimana del 23 novembre

## Cene
- Lunedì: pollo al limone con riso
- Martedì: pasta al pomodoro e basilico (cucina Luca)
- Mercoledì: tacos di pesce
- Giovedì: curry di ceci (cucina Luca)
- Venerdì: pizza fatta in casa
- Sabato: fuori con gli amici
- Domenica: pollo arrosto con patate

## Frutta e verdura
- [ ] Limoni
- [ ] Basilico
- [ ] Pomodorini
- [ ] Lime
- [ ] Patate

## Carne e pesce
- [ ] Sovracosce di pollo
- [ ] Filetti di pesce bianco
- [ ] Pollo intero

## Tutto il resto
- [ ] Tortillas
- [ ] Ceci
- [ ] Latte di cocco
- [ ] Impasto per pizza
- [ ] Mozzarella

## Sempre in dispensa
- Olio d’oliva, sale, pepe
- Riso, pasta, fiocchi d’avena
- Cipolle, aglio
`;

const FAQ = [
  { q: "Note di Apple ha un modello per il menu settimanale?", a: [
    "No. Note di Apple non ha un pianificatore dei pasti e nemmeno dei modelli. Una nota con le cene della settimana in alto e la lista della spesa come elenchi di controllo sotto funziona come tale, e puoi incollarci direttamente il modello di questa pagina.",
  ] },
  { q: "Posso condividere il menu in Note di Apple con chi vive con me?", a: [
    "Sì. Condividi la nota e, nei permessi, scegli Può modificare. Vi serve un Apple Account a testa, e una nota protetta non si può condividere per modificarla insieme. Le spunte compaiono su tutti e due i telefoni.",
  ] },
  { q: "La lista della spesa va in Note o in Promemoria?", a: [
    "Promemoria ha un tipo di elenco Spesa, da iOS 17, che divide gli elementi per categoria man mano che li aggiungi. Note tiene la lista accanto alle cene da cui nasce. Se prima pianifichi la settimana, tenerle nella stessa nota ti evita di ricopiare.",
  ] },
  { q: "Esiste un menu settimanale che scrive la lista della spesa da solo?", a: [
    "Pinto Notes ha un modello gratuito, Meal plan and groceries: le cene della settimana, chi cucina, e la spesa per reparto. ChatGPT o Claude possono pianificare la settimana e scrivere la lista, lasciando fuori quello che è sempre in dispensa.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="menu-settimanale-note-iphone"
      intro={<>
        Decidere alle sei cosa si mangia, poi scoprire che il riso è finito. Un menu settimanale risolve tutte e due le cose, e Note di
        Apple può tenerlo accanto alla lista della spesa che gli serve. Ecco un modello da incollare, come prepararlo perché la lista
        funzioni al supermercato e dove si ferma.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#prepararlo", label: "Prepararlo" },
          { href: "#meglio", label: "Farlo funzionare meglio" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un menu che scrive la lista" },
        ]}>
          <p>
            Note di Apple non ha un pianificatore dei pasti, ma una nota fa il lavoro. Metti in alto le cene della settimana, una riga al
            giorno, e sotto la spesa come elenchi di controllo, con un’intestazione per ogni reparto. Copia il modello qui sotto.
          </p>
          <PostCta template="meal-plan" slug="it/menu-settimanale-note-iphone" path="/it/blog/menu-settimanale-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi la lista della spesa già scritta?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per il menu della settimana. Di’ a ChatGPT o a Claude cosa ti va questa settimana e lui pianifica le cene e scrive la lista della spesa per reparto, senza quello che hai già in dispensa.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Una nota Groceries in Note di Apple su un Mac: un elenco di controllo di otto cose da comprare, con Sourdough, Eggs e Spinach spuntate e spostate in fondo."
        caption="Una lista della spesa come elenco di controllo in Note di Apple su un Mac. Con Ordina automaticamente gli elementi selezionati attivo, quello che è già nel carrello scende in fondo." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: una nota per ogni settimana</h2>
      <p>
        Una settimana di cene per due, come esempio. Cambia prima le cene, poi la spesa che servono. Lascia una parola in ogni riga,
        perché un elemento vuoto dell’elenco di controllo si perde quando incolli. L’ultima intestazione è un elenco semplice di quello
        che hai sempre in casa, così non compri l’olio ogni settimana.
      </p>
      <Keep title="Menu settimanale per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Sul Mac, incollalo in una nota nuova con Modifica > Incolla come Markdown." />

      <h2 id="prepararlo">Prepararlo</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Lo stesso Markdown incollato due volte in Note di Apple su macOS 27: con Comando-V i simboli restano testo, con Incolla come Markdown diventano un’intestazione, un elenco e del testo in grassetto."
        caption="A sinistra l’incolla normale, a destra Incolla come Markdown. Le righe dell’elenco di controllo funzionano allo stesso modo." />
      <Paths rows={[{ on: "Mac", steps: ["Modifica", "Incolla come Markdown"] }]} />
      <p>
        Su un Mac con macOS 27, crea una nota nuova e scegli Modifica &gt; Incolla come Markdown. La riga con # diventa il titolo, ogni
        riga con ## un’intestazione, le cene restano un elenco e la spesa diventa un insieme di elenchi di controllo. Un Comando-V
        normale lascia i simboli come testo. Su iPhone, scrivi le righe, seleziona la spesa e tocca il pulsante dell’elenco di controllo.
      </p>
      <p>
        Poi attiva &ldquo;Ordina automaticamente gli elementi selezionati&rdquo; nelle impostazioni di Note. Al supermercato, ogni cosa che
        spunti scende in fondo al suo elenco, così quello che manca resta in alto.
      </p>

      <h2 id="meglio">Farlo funzionare meglio</h2>
      <Paths rows={[
        { on: "Mac", steps: ["File", "Duplica nota"] },
        { on: "Mac", steps: ["Formato", "Altro", "Deseleziona tutti"] },
      ]} />
      <ul>
        <li>
          <strong>La prossima settimana parte da questa.</strong> La domenica, scegli File &gt; Duplica nota, cambia le cene, poi fai clic
          in ogni reparto e scegli Formato &gt; Altro &gt; Deseleziona tutti. Quasi ogni settimana ha metà della spesa in comune con la
          precedente.
        </li>
        <li>
          <strong>Le ricette a un tocco.</strong> Tieni ogni ricetta in una nota sua e collegala dalla sua cena con Aggiungi link. Su iOS
          27 e macOS 27 un link può puntare anche a un’intestazione, così &ldquo;Ingredienti&rdquo; si apre proprio dove ti serve.{" "}
        </li>
        <li>
          <strong>Condiviso con chi cucina.</strong> Condividi la nota e scegli Può modificare. Chi è al supermercato spunta le cose, e
          l’altro telefono lo vede. Vi serve un Apple Account a testa, e una nota protetta non si può condividere così.
        </li>
      </ul>
      <p>
        Se preferisci vedere la settimana come una griglia con una colonna per chi cucina, Formato &gt; Tabella ne crea una;{" "}
        <a href="/blog/apple-notes-tables">tables in Apple Notes</a> (in inglese) spiega come. Per altre note da incollare allo stesso
        modo, c’è <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in inglese).
      </p>

      <h2 id="limiti">Dove si ferma un menu settimanale in Note</h2>
      <ul>
        <li><strong>La lista è a mano.</strong> Note non sa che un curry vuole il latte di cocco. Leggi ogni ricetta e scrivi cosa serve, ogni settimana.</li>
        <li><strong>Niente ordine per reparto.</strong> Dove vanno i limoni lo decidi tu. Promemoria ha un elenco Spesa che divide le cose per categoria man mano che le aggiungi, ma poi la lista vive lontano dalle cene. Puoi dividere la lista della spesa per reparti.</li>
        <li><strong>Nessuna memoria di cosa hai in casa.</strong> Note non può dirti che a casa c’è il riso. La lista della dispensa aiuta solo se la leggi prima di scrivere la spesa.</li>
        <li><strong>Nessuna idea.</strong> Quando nessuno sa cosa cucinare, la nota aspetta.</li>
      </ul>
      <p>
        La condivisione è la parte che Note fa bene. Pianificare le cene e trasformarle in una lista resta il lavoro che fai tu.
      </p>

      <h2 id="pinto-notes">Un menu settimanale che scrive la lista della spesa</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Una nota Groceries in Pinto Notes su un Mac. Le cinque righe appena aggiunte da ChatGPT sono colorate, e una barra in basso dice che ChatGPT ha cambiato 5 righe, con Undo." }}
        caption="Una nota della spesa in Pinto Notes su un Mac. Le cinque righe appena aggiunte da ChatGPT sono colorate, con Undo in basso." />
      <p>
        Per questo esiste Pinto Notes. Si presenta e funziona come Note di Apple su iPhone e Mac, e ChatGPT o Claude possono lavorare
        nelle tue note dalla chat che usi già. Il modello gratuito <a href="/templates/meal-plan">Meal plan and groceries</a> è una nota
        con le cene della settimana e chi cucina, la spesa per reparto e quello che è sempre in dispensa.
      </p>
      <p>
        Nel weekend, chiedi alla tua AI di pianificare la settimana. Ti chiede quali sere cucini e cosa saltare, propone le cene, compila
        la settimana, poi scrive la lista della spesa per reparto e lascia fuori quello che è già in dispensa. Di’ &ldquo;aggiungi il
        latte d’avena&rdquo; il mercoledì e finisce nel reparto giusto. Ogni riga che aggiunge è colorata, con Undo, e ogni versione
        precedente della nota viene conservata. <a href="/blog/connect-chatgpt-to-your-notes">Collegare ChatGPT</a> (in inglese)
        richiede un minuto.
      </p>
      <p>
        Le tue note di Apple arrivano con <a href="/blog/import-your-notes">una sola importazione sul Mac</a>, e Note di Apple
        resta com’era.
      </p>
    </LocalPostPage>
  );
}
