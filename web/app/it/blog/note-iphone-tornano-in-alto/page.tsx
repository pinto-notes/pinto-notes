import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "note-iphone-tornano-in-alto");
// Italian version of /blog/apple-notes-keeps-jumping-to-top. Local problem wording searched
// with Google autocomplete hl=it, gl=it on 21 Nov 2026: "note iphone salta in alto",
// "note iphone torna su", "note iphone scorre da sola" and "note iphone si sposta da sola"
// returned no suggestions. The title says plainly that the note torna in alto.
// Apple it-it/119876, it-it/guide/iphone/iph83bfec492/ios, it-it/118259,
// it-it/guide/mac-help/mchlp2579/mac and mchlp2522/mac, it-it/118575, it-it/108382,
// it-it/121669 and it-it/guide/icloud/mm8685520792/icloud read 21 Nov 2026.
// Apple gives general restart, update and sync checks, not a fix for this exact jump.
// The picture follows English and shows an iCloud prompt, not the scrolling problem.
const ui = UI.it;
const RECORD = `Problema di scorrimento in Note
Dispositivo e versione di iOS o macOS:
Una nota o più note:
Cosa facevo subito prima del salto:
Si sposta la pagina, il cursore o entrambi?
Anche la digitazione è lenta?
Cosa è successo dopo il riavvio:
Cosa è successo dopo l'aggiornamento:
Cosa succede con la stessa nota su un altro dispositivo:
`;
const FAQ = [
  { q: "Apple ha pubblicato una soluzione per Note che torna in alto?", a: ["Nelle pagine consultate per questo articolo Apple non documenta una soluzione specifica. I suoi consigli generali sono chiudere e riaprire l'app, riavviare il dispositivo e controllare gli aggiornamenti. Non garantiscono che il salto smetta."] },
  { q: "Disattivare iCloud ferma lo scorrimento?", a: ["Le pagine Apple esaminate non indicano iCloud come causa e non consigliano di disattivarlo. La guida alle note mancanti dice di controllare la sincronizzazione e riavviare se le note non compaiono. È un sintomo diverso."] },
  { q: "Cosa provo se Note è lenta e perdo il punto?", a: ["Prova una nota nuova per la sezione che stai scrivendo, lasciando intatta l'originale. Oppure apri la stessa nota iCloud su un altro dispositivo o su icloud.com/notes. Sono prove pratiche, senza garanzia di risolvere il rallentamento o il salto."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="note-iphone-tornano-in-alto"
  intro={<>Apple non documenta una soluzione specifica per Note che torna in cima mentre scrivi. Inizia dai suoi controlli generali: riapri l'app, riavvia e aggiorna. Se continua, prova un altro modo di finire il testo.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#riavvia", label: "Riapri Note" }, { href: "#aggiorna", label: "Aggiornamenti" },
    { href: "#icloud", label: "Controlla iCloud" }, { href: "#scrivere", label: "Continua a scrivere" },
  ]}><p>Chiudi e riapri Note, riavvia l'iPhone o il Mac, poi controlla gli aggiornamenti. Apple consiglia questi passaggi per le app che non funzionano bene, ma non promette che risolvano questo salto. Se mancano anche note su un altro dispositivo, controlla che Note sia attivo in iCloud.</p>
    <PostCta slug="it/note-iphone-tornano-in-alto" path="/it/blog/note-iphone-tornano-in-alto" position="answer" ui={ui.cta} title="Prova una copia in Pinto Notes"><p>Pinto Notes <a href="/blog/move-from-apple-notes">importa Note di Apple sul Mac</a> e lascia l'originale invariato. Prova lì una copia della nota interessata prima di decidere se spostarti. Non c'è garanzia che il problema non si presenti anche lì.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="riavvia">Chiudi Note, poi riavvia il dispositivo</h2>
  <p>Su iPhone apri l'elenco delle app, trova Note e scorri verso l'alto per chiuderla. Poi riaprila. Apple descrive i gesti nella <a href="https://support.apple.com/it-it/guide/iphone/iph83bfec492/ios">guida alla chiusura delle app</a>. Se la pagina continua a saltare, <a href="https://support.apple.com/it-it/118259">riavvia l'iPhone</a> seguendo i passaggi per il tuo modello.</p>
  <p>Sul Mac esci da Note e riaprila. Per riavviare, scegli Riavvia dal menu Apple. Anche la <a href="https://support.apple.com/it-it/guide/mac-help/mchlp2579/mac">guida Apple ai problemi delle app</a> consiglia il riavvio. Poi ripeti l'azione che faceva saltare la nota. Se Note si blocca o si chiude, vedi <a href="/it/blog/app-note-iphone-non-funziona">cosa provare quando Note non funziona</a>.</p>
  <h2 id="aggiorna">Controlla gli aggiornamenti</h2>
  <p>Apple consiglia di aggiornare il software quando un'app non funziona come previsto. Fai prima un backup. Su iPhone, collegalo all'alimentazione e al Wi-Fi. Sul Mac, gli aggiornamenti di macOS comprendono Note.</p>
  <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "Generali", "Aggiornamento software"] }, { on: "Mac", steps: ["Menu Apple", "Impostazioni di Sistema", "Generali", "Aggiornamento software"] }]} />
  <p>Segui le guide Apple per <a href="https://support.apple.com/it-it/118575">iPhone</a> o <a href="https://support.apple.com/it-it/108382">Mac</a>. Un aggiornamento disponibile vale una prova; non dimostra che Apple abbia corretto proprio questo problema.</p>
  <h2 id="icloud">Controlla iCloud se mancano anche delle note</h2>
  <p>Il salto della pagina non dimostra un problema di sincronizzazione. Se la nota non compare su un altro dispositivo, verifica che entrambi usino lo stesso Apple Account e che Note sia attivo in iCloud.</p>
  <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Vedi tutto o Mostra tutto", "Note", "Sincronizza questo iPhone"] }, { on: "Mac", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note", "Sincronizza questo Mac"] }]} />
  <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Note sul Mac chiede di attivare iCloud per accedere alle note sugli altri dispositivi." caption="Una richiesta di attivare iCloud in Note su macOS 27. Non è una soluzione per il salto della pagina." />
  <p>La <a href="https://support.apple.com/it-it/121669">guida Apple alle note iCloud mancanti</a> dice di riavviare se non compaiono, poi ricontrollare l'impostazione. La <a href="https://support.apple.com/it-it/guide/icloud/mm8685520792/icloud">guida alla configurazione</a> spiega i percorsi. Per altri controlli vedi <a href="/it/blog/note-iphone-non-sincronizzate">note che non si sincronizzano</a>.</p>
  <h2 id="scrivere">Come continuare a scrivere mentre succede</h2>
  <p>Queste sono prove, non soluzioni documentate da Apple. Conserva la nota originale mentre confronti.</p>
  <ul><li>Apri una nota nuova per la sezione che stai scrivendo e copia solo il brano necessario. Se funziona meglio, unisci il testo dopo.</li><li>Prova la stessa modifica sulla nota nell'altro dispositivo, se ne hai uno.</li><li>Se la nota è in iCloud, prova <a href="https://www.icloud.com/notes">icloud.com/notes</a> nel browser. Apple documenta questo accesso; se lì riesci a scrivere, puoi usarlo per ora.</li></ul>
  <p>Una nota nuova che funziona meglio non prova che la causa sia la lunghezza. Un browser che funziona non spiega il difetto dell'app. La prova serve a finire il testo.</p>
  <h2 id="ancora">Se Note continua a saltare o è lenta</h2>
  <p>Prima di eliminare l'app o cambiare account, conserva una copia separata delle note importanti. La <a href="https://support.apple.com/it-it/119876">guida Apple</a> avverte che l'eliminazione di un'app può far perdere dati. La <a href="/blog/back-up-apple-notes">guida al backup di Note</a> è in inglese. Annota cosa provoca il salto e se si sposta la pagina o il punto d'inserimento. Porta questi dettagli al <a href="https://support.apple.com/it-it/contact">supporto Apple</a>, senza copiare il contenuto della nota.</p>
  <Keep title="Appunti per il supporto Apple" text={RECORD} />
  </LocalPostPage>; }
