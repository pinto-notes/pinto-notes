import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "budget-mensile-note-iphone");

// Italian version of /blog/apple-notes-budget-template (21 Nov 2026). Search words, Google autocomplete (hl=it, gl=it)
// on 21 Nov: "template budget" gives template budget mensile, budget planner, excel and notion; "budget familiare" and
// "budget spese mensili" are big; "note iphone budget" and "budget su note" give nothing. So the slug and title say
// "budget mensile" plus "note di iPhone". Apple's own Italian words, all read 21 Nov: the Mac guide
// support.apple.com/it-it/guide/notes/apda85974595/mac ("Risolvere operazioni in Note sul Mac": Formato, Risultati
// matematici, variables like Pranzo=25, variables only with the Latin alphabet, so the template's names have no
// accents), not9474646a9/mac (File, Duplica nota) and apd0a136b9cc/mac (Formato, Tabella). The same menu names are the
// Italian strings in Notes' MainMenu.loctable on macOS 27. Facts are the English post's; the pictures are its English
// ones, described in Italian. Links go to the English posts, none of which has an Italian version yet.

const ui = UI.it;

const TEMPLATE = `Budget, novembre

Entrate = 2400

Affitto = 750
Spesa = 400
Trasporti = 80
Telefono = 15
Svago = 150
Risparmio = 400

Affitto + Spesa + Trasporti + Telefono + Svago + Risparmio =
Entrate - Affitto - Spesa - Trasporti - Telefono - Svago - Risparmio =
`;

const FAQ = [
  { q: "Note di Apple ha un modello per il budget?", a: [
    "No. Note di Apple non ha nessun modello. Puoi però creare una nota di budget che fa i conti da sola: dai un nome a ogni importo su una riga a parte, poi somma i nomi con un segno di uguale, e Risultati matematici scrive il totale.",
  ] },
  { q: "Note di Apple sa fare i calcoli?", a: [
    "Sì, con Risultati matematici. Scrivi un’operazione che finisce con un segno di uguale e Note ti propone il risultato. Gli importi con un nome, come Affitto = 750, si possono usare nelle righe dopo, e se ne cambi uno si aggiornano tutti i risultati sotto.",
  ] },
  { q: "Perché la tabella del budget in Note non fa la somma?", a: [
    "Risultati matematici non funziona dentro una tabella. Tieni pure la tabella per leggere, e metti gli importi con un nome e le somme come righe normali sotto.",
  ] },
  { q: "Esiste un’app gratuita per il budget che funziona come una nota?", a: [
    "Pinto Notes ha un modello gratuito, Budget and expenses: una nota che è una piccola app, con quanto ti resta questo mese, ogni categoria rispetto al suo budget, le spese fisse mensili e gli ultimi sei mesi. ChatGPT o Claude possono aggiungere le spese che hai fatto.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="it"
      slug="budget-mensile-note-iphone"
      intro={<>
        Vuoi un budget nel posto dove scrivi già tutto, non un’altra app con un altro account. Note di Apple ne fa più di quanto pensi.
        Ecco un modello da incollare che fa i conti da solo, dove si ferma e cosa usare quando non ti basta più.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modello", label: "Il modello" },
          { href: "#come-funziona", label: "Come fa i conti" },
          { href: "#limiti", label: "Dove si ferma" },
          { href: "#pinto-notes", label: "Un budget che si tiene da solo" },
        ]}>
          <p>
            Note di Apple non ha modelli, ma una nota di budget può comunque fare le somme. Metti ogni importo su una riga con un nome,
            come Affitto = 750, poi somma i nomi con un segno di uguale alla fine: Risultati matematici scrive il totale e quanto ti
            resta. Copia il modello qui sotto in una nota nuova.
          </p>
          <PostCta slug="it/budget-mensile-note-iphone" path="/it/blog/budget-mensile-note-iphone" position="answer" ui={ui.cta}
            title="Vuoi un budget che si tiene da solo?">
            <p>Pinto Notes funziona come Note di Apple e ha un modello gratuito per budget e spese: quanto ti resta questo mese, ogni categoria rispetto al suo budget e le spese che si ripetono. Di’ a ChatGPT o a Claude cosa hai speso e la spesa viene aggiunta.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Una nota chiamata Sequoia Group Expenses su iPhone: ogni costo ha un nome su una riga a parte, i nomi sommati danno 475 dollari, e 475 diviso 5 fa 95 a testa."
        caption="L’esempio di Apple del trucco su cui si basa una nota di budget: dai un nome a ogni importo, poi somma i nomi. Immagine: Apple." />}
      faq={FAQ}
    >
      <h2 id="modello">Il modello: un budget mensile che fa i conti da solo</h2>
      <p>
        Crea una nota nuova e incolla questo. Cambia gli importi e i nomi con i tuoi: va bene qualsiasi nome, purché sia scritto sempre
        allo stesso modo.
      </p>
      <Keep title="Budget mensile per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Note propone ogni risultato dopo il segno di uguale. Premi A capo per tenerlo." />
      <p>
        La prima somma è quanto hai previsto di spendere. La seconda è quanto ti resta delle entrate dopo aver tolto tutto, risparmio
        compreso. Se il secondo risultato è sotto zero, il piano non sta in piedi.
      </p>
      <p>
        Tieni una nota per ogni mese. Sul Mac, File &gt; Duplica nota copia quella del mese scorso, così cambi solo il titolo e gli
        importi che si sono mossi. Se usi anche altri modelli, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (in
        inglese) spiega come preparare una cartella Modelli.
      </p>

      <h2 id="come-funziona">Come fa i conti</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="Una tabella Moving budget in Note di Apple su macOS 27. La cella Total contiene 85+240+180= senza risultato. Sotto la tabella, Boxes = 85, Van = 240 e Cleaning = 180 hanno un nome, e Boxes + Van + Cleaning = mostra 505 come suggerimento di Note."
        caption="Su macOS 27: dentro una tabella la somma resta lì ferma. Come righe con un nome sotto la tabella, Note risponde: 505." />
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Risultati matematici"] }]} />
      <p>
        Note la chiama Risultati matematici. Una riga come Affitto = 750 dà un nome al numero, e ogni riga dopo che finisce con un
        segno di uguale riceve il suo risultato. Porta la Spesa da 400 a 450 e i due totali cambiano con lei, che è quasi tutto quello
        che un foglio di calcolo fa per un budget. Se sul Mac non compare nessun risultato, controlla in Formato &gt; Risultati
        matematici che non sia impostato su No.
      </p>
      <p>
        Un limite: non funziona dentro una tabella. Risultati matematici si spegne quando sei in una tabella, quindi una cella Totale
        resta testo. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (in inglese) spiega cosa possono fare le tabelle e
        cosa no.
      </p>

      <h2 id="limiti">Dove si ferma un budget in Note di Apple</h2>
      <ul>
        <li><strong>Le spese sono a mano.</strong> Per seguire quanto spendi davvero, aggiungi una riga per ogni acquisto e un nome alla somma. Dopo qualche settimana la riga della somma diventa lunghissima.</li>
        <li><strong>Niente mesi a confronto.</strong> Ogni mese è una nota a sé, quindi per confrontare questo mese con gli ultimi sei devi aprire sei note.</li>
        <li><strong>Niente spese ricorrenti.</strong> Affitto e abbonamenti vanno riscritti nella nota di ogni mese.</li>
        <li><strong>Niente categorie con un tetto.</strong> Vedi quanto ti resta in totale, non che hai sforato con le cene fuori e sei sotto con i trasporti.</li>
      </ul>
      <p>
        Per un piano che imposti una volta al mese, la nota basta. Se vuoi segnare le spese mentre le fai, lì la nota non regge più.
      </p>

      <h2 id="pinto-notes">Una nota di budget che si tiene da sola</h2>
      <Figure shot={{ ...SHOTS.budgetApp, alt: "L’app del budget in una nota di Pinto Notes su un Mac: 8.205 corone rimaste a ottobre, circa 410 al giorno dopo le spese fisse, un grafico degli ultimi sei mesi, le spese fisse del mese e ogni categoria rispetto al suo budget con quanto è stato riportato." }}
        caption="Il modello Budget and expenses in Pinto Notes su un Mac, con dati di esempio: quanto resta questo mese, gli ultimi sei mesi, le spese fisse e ogni categoria rispetto al suo budget." />
      <p>
        Per questo esiste Pinto Notes. Si presenta e funziona come Note di Apple su iPhone e Mac, e una nota può essere anche una
        piccola app. Il modello gratuito <a href="/templates/budget-log">Budget and expenses</a> è una di queste: imposti una volta un
        budget mensile per categoria, e lui ti mostra quanto resta questo mese con una barra, ogni categoria rispetto al suo budget con
        quanto è stato riportato dal mese prima, le spese fisse mensili e gli ultimi sei mesi. Aggiungi una spesa con un tocco, e i
        conti li fa lui.
      </p>
      <p>
        Puoi anche dire a ChatGPT o a Claude cosa hai speso, nella chat che usi già, e la spesa finisce nella nota. I conti li fa
        l’app, non l’AI. <a href="/blog/budget-tracker-with-chatgpt-or-claude">A budget your AI can keep for you</a> (in inglese)
        spiega come funziona.
      </p>
      <p>
        Le tue note di Apple arrivano con <a href="/blog/move-from-apple-notes">una sola importazione sul Mac</a>, e Note di Apple
        resta com’era.
      </p>
    </LocalPostPage>
  );
}
