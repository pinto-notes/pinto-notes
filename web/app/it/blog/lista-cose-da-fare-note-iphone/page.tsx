import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "lista-cose-da-fare-note-iphone");
// Italian version of /blog/apple-notes-to-do-list. Google autocomplete hl=it, gl=it, 21 Nov 2026:
// "checklist note iphone" suggested mostly unrelated results; "lista cose da fare note iphone"
// had no suggestions. Title uses the everyday Italian phrase, without a fabricated search claim.
// Apple it-it read 21 Nov: 102296 (pulsante Elenco di controllo, Ordina gli elementi selezionati,
// In automatico, Condividi > Collabora), notes/apd93c815aa0/mac (Formato > Altro > Deseleziona tutti;
// Ordina automaticamente gli elementi selezionati), notes/apdb54e469b6/mac (mettere in evidenza),
// 102484 (Promemoria per data, ora e luogo). The Italian Apple guide does not name the Markdown
// paste command, so the step is described without a menu label.
const ui = UI.it;
const TEMPLATE = `# Cose da fare

## Oggi
- [ ] Mandare il budget a Marco
- [ ] Chiamare mamma
- [ ] Restituire il pacco

## Questa settimana
- [ ] Prenotare il treno per Natale
- [ ] Rivedere le slide di Emma
- [ ] Prenotare il tagliando

## Commissioni
- [ ] Ritirare i vestiti in lavanderia
- [ ] Comprare una luce per la bici

## In attesa
- [ ] Marco: approvazione del budget

## Un giorno
- [ ] Rinnovare il passaporto
- [ ] Riordinare il garage
`;
const FAQ = [
  { q: "Come creo una lista delle cose da fare in Note?", a: ["Su iPhone crea una nota, scrivi il titolo, vai a capo e tocca il pulsante Elenco di controllo. Ogni nuovo capo aggiunge una voce. Sul Mac usa lo stesso pulsante o la scorciatoia Maiuscole-Comando-L."] },
  { q: "Posso ordinare le attività?", a: ["Note può spostare automaticamente in fondo le voci spuntate. Per priorità o nome, devi trascinarle tu."] },
  { q: "Note o Promemoria?", a: ["Usa Promemoria quando serve una scadenza, una notifica o un avviso legato a un luogo. Per un elenco da leggere e spuntare insieme, Note basta."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="lista-cose-da-fare-note-iphone"
  intro={<>Una lista di cose da fare è una delle note più utili. Bastano un pulsante su iPhone e una scorciatoia sul Mac. Puoi anche separare le cose da fare oggi da quelle da affrontare più avanti.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#iphone", label: "Su iPhone" }, { href: "#mac", label: "Sul Mac" },
    { href: "#modello", label: "Il modello" }, { href: "#ordine", label: "Ordinare" },
    { href: "#piu-liste", label: "Più liste" }, { href: "#pinto", label: "Una lista con l'AI" },
  ]}><p>Su iPhone crea una nota, scrivi il titolo e tocca il pulsante Elenco di controllo. Ogni volta che vai a capo aggiungi una voce; tocca il cerchio per completarla. Sul Mac usa lo stesso pulsante. Nelle impostazioni puoi far scendere le voci spuntate.</p>
    <PostCta template="weekly-planner" slug="it/lista-cose-da-fare-note-iphone" path="/it/blog/lista-cose-da-fare-note-iphone" position="answer" ui={ui.cta} title="Vuoi che l'AI tenga in ordine la lista?"><p>Il modello gratuito Weekly planner di Pinto Notes ha attività per ogni giorno. Dopo il collegamento, ChatGPT o Claude possono aggiungere voci e spostare quelle rimaste aperte.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640} alt="Lista della spesa in Note sul Mac, con voci aperte e tre voci spuntate in fondo." caption="Le voci completate possono scendere in fondo all'elenco. Immagine: Pinto Notes." />}
  faq={FAQ}>
  <h2 id="iphone">Creare una lista su iPhone</h2>
  <p>Apri Note, tocca il pulsante per una nuova nota, scrivi un titolo e vai a capo. Tocca il pulsante Elenco di controllo e scrivi la prima attività. Ogni nuovo capo ne aggiunge una; tocca il cerchio per spuntarla. Trascina una voce per cambiare ordine. Scorri una voce verso destra per rientrarla, verso sinistra per togliere il rientro.</p>
  <h2 id="mac">Creare una lista sul Mac</h2>
  <p>In una nota, clicca sul pulsante Elenco di controllo oppure premi Maiuscole-Comando-L. Seleziona più righe e applica il pulsante per convertirle in voci. Puoi trascinarle. In Formato &gt; Altro trovi il comando per deselezionare tutte le voci e ricominciare.</p>
  <h2 id="modello">Un modello da incollare</h2>
  <p>Oggi contiene le cose urgenti, Questa settimana il resto, Commissioni le attività fuori casa, In attesa quelle che dipendono da altri. Un giorno tiene lontani i progetti non immediati. Cambia gli esempi con i tuoi, ma lascia una parola in ogni riga dell'elenco.</p>
  <Keep title="Lista delle cose da fare per Note di Apple" text={TEMPLATE} copyLabel={ui.copy} note="Sul Mac con macOS 27, usa l'opzione che converte il Markdown incollato in intestazioni ed elenchi. Su iPhone seleziona le righe e usa il pulsante Elenco di controllo." />
  <p>Per una settimana divisa per giorni, <a href="/blog/apple-notes-planner-template">il modello di agenda</a> è in inglese. Ci sono altri modelli in <a href="/blog/apple-notes-templates">questa raccolta</a>.</p>
  <h2 id="ordine">Mettere in fondo le voci completate</h2>
  <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "App", "Note", "Ordina gli elementi selezionati", "In automatico"] }, { on: "Mac", steps: ["Note", "Impostazioni", "Ordina automaticamente gli elementi selezionati"] }]} />
  <p>L'impostazione vale per tutti gli elenchi del dispositivo. Note non ordina per nome o priorità: trascina le attività importanti in alto. Una lista ricorrente può essere azzerata sul Mac da Formato &gt; Altro &gt; Deseleziona tutti. <a href="/blog/apple-notes-checklist-sort">Altri dettagli sull'ordinamento</a> sono in inglese.</p>
  <h2 id="piu-liste">Tenere insieme più liste</h2>
  <p>Metti in evidenza la lista principale così resta in cima alla cartella. Scrivi un tag come #fare in ogni nota con attività e crea una cartella smart che raccolga le note con voci non spuntate. Condividi una lista dal pulsante Condividi scegliendo Collabora; ogni partecipante deve avere un Apple Account.</p>
  <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700} alt="Cartella smart in Note sul Mac con una regola per elenchi di controllo non completati." caption="La cartella smart riunisce attività ancora aperte da note diverse." />
  <p>Note non assegna scadenze o notifiche alle voci. Per un orario o un avviso quando arrivi in un luogo, usa Promemoria. Le voci completate restano nella lista e le attività non finite non passano da sole a domani.</p>
  <h2 id="pinto">Una lista che puoi aggiornare dalla chat</h2>
  <PostFigure src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600} alt="Weekly planner in Pinto Notes sul Mac con tre priorità, attività per giorno e lista per più avanti." caption="Una settimana di attività nel modello Weekly planner. Dati di esempio." />
  <p>Il modello <a href="/templates/weekly-planner">Weekly planner</a> ha tre priorità, un elenco per giorno e una sezione per dopo. Una volta collegati, ChatGPT o Claude possono aggiungere attività, spostare a oggi quelle non fatte e preparare una nuova settimana. Puoi sempre scrivere e spuntare a mano; Pinto Notes conserva le versioni precedenti. Le tue liste in Note di Apple si importano sul Mac senza modificarle.</p>
  <p>Altre guide: <a href="/blog/apple-notes-tags-smart-folders">tag e cartelle smart</a> (in inglese), <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
