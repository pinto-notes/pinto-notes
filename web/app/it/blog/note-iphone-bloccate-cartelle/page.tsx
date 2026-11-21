import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "note-iphone-bloccate-cartelle");
// Italian version of /blog/apple-notes-stuck-on-folders. Local problem wording searched
// with Google autocomplete hl=it, gl=it on 21 Nov 2026: "note iphone cartelle" returned
// itself and "cartelle note iphone sparite". "note iphone bloccata", "note iphone non
// carica", "app note bloccata cartelle" and "note iphone si apre cartelle" returned none.
// Apple it-it/121669, it-it/118446, it-it/guide/icloud/mm8685520792/icloud,
// it-it/118575, it-it/108382 and it-it/121115 read 21 Nov 2026. Apple's pages give
// no specific diagnosis for a stuck Cartelle screen or a time limit for syncing.
// The picture follows English and shows a different iCloud prompt.
const ui = UI.it;
const FAQ = [
  { q: "Cosa controllo se Note resta sulla schermata Cartelle?", a: ["Se mancano note iCloud, controlla Stato del sistema Apple, l'Apple Account e l'attivazione di Note in iCloud. Apple dice di riavviare l'iPhone e ricontrollare l'impostazione se le note non compaiono. Se lo schermo non risponde, segui i controlli generali per un'app bloccata."] },
  { q: "Preparazione in Apple Intelligence vuol dire che le note si sincronizzano?", a: ["No, quel messaggio riguarda la configurazione di Apple Intelligence. Apple dice che, dopo un cambio della lingua di Siri, la funzione può restare indisponibile finché la lingua non finisce di scaricarsi e coincide con quella del dispositivo. Non conferma il caricamento di una nota su iCloud."] },
  { q: "Apple dà un tempo massimo per la sincronizzazione?", a: ["Le pagine Apple collegate qui non danno un limite di tempo. Un caricamento lento da solo non ne rivela la causa. Controlla lo stato di iCloud, la connessione e lo stesso Apple Account con Note attivo su ogni dispositivo."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="note-iphone-bloccate-cartelle"
  intro={<>Se Note resta sulla schermata Cartelle e non carica le note, controlla lo stato di iCloud e verifica che Note sia attivo nelle impostazioni. Se i tocchi non fanno nulla, segui i controlli per le app bloccate.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#cartelle", label: "Cartelle non si apre" }, { href: "#icloud", label: "Controlli iCloud" },
    { href: "#salvataggio", label: "Salvataggio bloccato" }, { href: "#preparazione", label: "Preparazione" },
  ]}><p>Controlla Stato del sistema Apple. Poi verifica che ogni dispositivo usi lo stesso Apple Account e abbia Note attivo in iCloud. Controlla anche connessione e aggiornamenti. Sono verifiche generali delle guide Apple, che non documentano una soluzione specifica per la schermata Cartelle bloccata.</p>
    <PostCta slug="it/note-iphone-bloccate-cartelle" path="/it/blog/note-iphone-bloccate-cartelle" position="answer" ui={ui.cta} title="Prova le tue note in Pinto Notes"><p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Puoi <a href="/blog/move-from-apple-notes">importare Note di Apple sul Mac</a> senza cambiare l'originale. Questo non ripara Note di Apple.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Note su macOS 27 mostra la richiesta di attivare iCloud, con i pulsanti per aprire le impostazioni o annullare." caption="Note sul Mac quando iCloud è disattivato. È una schermata diversa da Cartelle che non risponde." />}
  faq={FAQ}>
  <h2 id="cartelle">Quando Cartelle non apre una cartella</h2>
  <p>Prova a selezionare Tutto iCloud o una cartella sotto iCloud. È lì che la guida Apple dice di cercare le note iCloud. Se le cartelle si aprono ma le note non compaiono, continua con i controlli sotto.</p>
  <p>Se Note non risponde ai tocchi, vedi <a href="/it/blog/app-note-iphone-non-funziona">cosa fare quando Note si blocca</a>: chiudi e riapri l'app, poi riavvia e aggiorna il dispositivo. Uno schermo fermo non dice se le ultime modifiche sono già arrivate su iCloud.</p>
  <h2 id="icloud">Controlla iCloud prima di cambiare altro</h2>
  <Steps>
    <li><strong>Controlla lo stato dei servizi Apple.</strong> Apri <a href="https://www.apple.com/it/support/systemstatus/">Stato del sistema</a> e cerca Note di iCloud. Se Apple segnala un problema, ricontrolla lo stato prima di cambiare le impostazioni.</li>
    <li><strong>Controlla l'Apple Account.</strong> Ogni dispositivo deve usare lo stesso account. Lo trovi in cima a Impostazioni su iPhone e a Impostazioni di Sistema sul Mac.</li>
    <li><strong>Verifica che Note sia attivo in iCloud.</strong> Se Sincronizza questo iPhone o Sincronizza questo Mac è disattivato, attivalo. Apple dice di riavviare iPhone se le note ancora non compaiono e di controllare di nuovo l'impostazione.
      <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "Il tuo nome", "iCloud", "Vedi tutto o Mostra tutto", "Note", "Sincronizza questo iPhone"] }, { on: "Mac", steps: ["Impostazioni di Sistema", "Il tuo nome", "iCloud", "Note", "Sincronizza questo Mac"] }]} />
    </li>
    <li><strong>Controlla la connessione.</strong> Apple chiede una connessione internet stabile. Se usi iPhone senza Wi-Fi, controlla che i dati cellulare siano attivi in Impostazioni; con i dati disattivati iCloud potrebbe non essere disponibile.</li>
    <li><strong>Controlla gli aggiornamenti.</strong> Apple include l'aggiornamento di iOS o macOS tra i controlli per iCloud. Fai un backup prima di installare.
      <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "Generali", "Aggiornamento software"] }, { on: "Mac", steps: ["Menu Apple", "Impostazioni di Sistema", "Generali", "Aggiornamento software"] }]} />
    </li>
  </Steps>
  <p>I controlli vengono dalle guide Apple sulla <a href="https://support.apple.com/it-it/118446">connessione a iCloud</a>, sulle <a href="https://support.apple.com/it-it/121669">note mancanti</a> e sulla <a href="https://support.apple.com/it-it/guide/icloud/mm8685520792/icloud">configurazione di Note</a>. I percorsi di aggiornamento sono nelle guide per <a href="https://support.apple.com/it-it/118575">iPhone</a> e <a href="https://support.apple.com/it-it/108382">Mac</a>.</p>
  <h2 id="salvataggio">Note iCloud resta su Salvataggio o sincronizza lentamente</h2>
  <p>Apri <a href="https://www.icloud.com/notes">Note su iCloud.com</a> con lo stesso Apple Account. Cerca la nota e la modifica più recente. Se vedi una versione vecchia, sai solo che quel testo precedente è arrivato su iCloud. Conserva una copia separata del testo nuovo che riesci ancora a leggere mentre fai i controlli.</p>
  <p>Le pagine Apple qui citate non danno un tempo massimo né una soluzione specifica per un messaggio di salvataggio fermo. Per altri controlli, tra cui spazio disponibile e note presenti su un solo dispositivo, vedi <a href="/it/blog/note-iphone-non-sincronizzate">le note che non si sincronizzano</a>.</p>
  <h2 id="preparazione">Controlla dove compare “Preparazione”</h2>
  <p>Se il messaggio è nelle impostazioni di Apple Intelligence, segui la <a href="https://support.apple.com/it-it/121115">guida Apple</a>. Dice che un cambio della lingua di Siri può rendere Apple Intelligence indisponibile finché la nuova lingua non è scaricata e non coincide con quella del dispositivo. Riguarda Apple Intelligence, non il caricamento di una nota.</p>
  <p>Se “Preparazione” compare dentro Note mentre lavori con una scansione o un PDF, quella guida non identifica la causa. Annota il testo esatto e cosa stavi facendo. Se i controlli non aiutano, porta questi dettagli al <a href="https://getsupport.apple.com/">supporto Apple</a>.</p>
  </LocalPostPage>; }
