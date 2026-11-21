import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "dove-sono-salvate-note-iphone");
// Italian version of /blog/where-are-apple-notes-stored. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "dove si trovano le note su iphone" suggested itself, deleted and shared notes,
// and "dove si salvano le note su iphone". Title uses the location wording.
// Apple it-it read 21 Nov: iphone/iph7262fd4fe/ios (Account Note, Su iPhone),
// iphone/iph92579feda/ios (Account di default), notes/not85d6f7b58/mac (Sul mio Mac),
// notes/apd97da26aed/mac (Abilita account Sul mio Mac), icloud/mm8685520792/icloud,
// 102537 (account proteggibili), 102476 (Cestino degli account mail),
// notes/not201900c07/mac (File > Esporta in). Pictures follow English.
const ui = UI.it;
const FAQ = [
  { q: "Le note di iPhone sono sul telefono o su iCloud?", a: ["Dipende dall'account. Sotto iCloud sono sincronizzate con gli altri dispositivi del tuo Apple Account. Sotto Su iPhone restano su quel telefono."] },
  { q: "Dove sono le note in Gmail?", a: ["Le note sotto Gmail sono nell'account Google e si sincronizzano tramite quell'account. Se lo rimuovi dall'iPhone, le note restano nell'account, ma non compaiono più su quel telefono."] },
  { q: "Posso trovare i file delle note nel Finder?", a: ["Le guide Apple non indicano una cartella sul disco. Per avere un file, apri una nota sul Mac ed esportala come PDF o Markdown."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="dove-sono-salvate-note-iphone"
  intro={<>Ogni nota appartiene a un account. Guarda l'intestazione della sua cartella in Note: da lì capisci dove si trova e se arriva sugli altri dispositivi.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#account", label: "Controlla l'account" }, { href: "#icloud", label: "iCloud" },
    { href: "#locali", label: "Solo sul dispositivo" }, { href: "#gmail", label: "Gmail e Yahoo" },
    { href: "#confronto", label: "Confronto" },
  ]}><p>Le note sotto iCloud sono su iCloud e sui tuoi dispositivi collegati. Quelle sotto Su iPhone o Sul mio Mac restano su quel dispositivo. Quelle sotto Gmail, Yahoo o altri account di posta sono in quell'account. Apple non indica una cartella di file sul disco per nessuno dei tre casi.</p>
    <PostCta slug="it/dove-sono-salvate-note-iphone" path="/it/blog/dove-sono-salvate-note-iphone" position="answer" ui={ui.cta} title="Vuoi note che la tua AI possa leggere?"><p>Pinto Notes sincronizza le note tra iPhone e Mac con un solo accesso. Dopo il collegamento, ChatGPT o Claude possono leggere e modificare i file Markdown delle tue note.</p></PostCta>
  </Answer>}
  hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280} alt="Elenco Cartelle in Note su iPhone: Note rapide, Condivise e cartelle sotto l'intestazione iCloud." caption="L'intestazione della cartella indica l'account della nota. Immagine: Apple." />}
  faq={FAQ}>
  <h2 id="account">Controlla a quale account appartiene la nota</h2>
  <p>Su iPhone torna all'elenco Cartelle. Sul Mac guarda la barra laterale. Puoi trovare intestazioni come iCloud, Su iPhone, Sul mio Mac, Gmail, Yahoo o Exchange. La nota sta nell'account sopra la sua cartella. Per vedere gli account configurati:</p>
  <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "App", "Note", "Account Note"] }, { on: "Mac", steps: ["Note", "Account"] }]} />
  <p>Se disattivi Note per un account, le sue note spariscono da quel dispositivo ma rimangono nell'account. Riattiva Note per rivederle.</p>
  <h2 id="icloud">Note in iCloud</h2>
  <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250} alt="Schermata iCloud nelle Impostazioni di iPhone, con Note tra le app che salvano dati in iCloud." caption="Note tra le app che usano iCloud. Immagine: Apple." />
  <p>Le note iCloud compaiono su iPhone, Mac e iCloud.com/notes quando usi lo stesso Apple Account e hai attivato Note per iCloud. Apple cifra i dati durante il trasferimento e sui server. Con la protezione standard conserva le chiavi; con Protezione avanzata dei dati le chiavi restano sui dispositivi attendibili.</p>
  <p>La sincronizzazione non è una copia di sicurezza indipendente. Una nota eliminata passa in Eliminate di recente su tutti i dispositivi e viene rimossa dopo 30 giorni. <a href="/blog/back-up-apple-notes">La guida al backup</a> è in inglese.</p>
  <h2 id="locali">Su iPhone e Sul mio Mac</h2>
  <PostFigure src="/blog/macos27/notes27-settings-default-account-on-my-mac" width={1148} height={1000} maxWidth={500} alt="Impostazioni di Note sul Mac, con Sul mio Mac come account di default e l'account locale attivo." caption="Le note in Sul mio Mac restano su questo computer." />
  <p>Le note sotto Su iPhone restano sul telefono e rientrano nel backup dell'iPhone su iCloud. Quelle sotto Sul mio Mac restano su quel computer e dipendono dal suo backup. Nessuna delle due raccolte appare su iCloud.com o sugli altri dispositivi. Puoi attivare l'account locale nelle impostazioni di Note.</p>
  <Paths rows={[{ on: "iPhone", steps: ["Impostazioni", "App", "Note", "Account “Su iPhone”"] }, { on: "Mac", steps: ["Note", "Impostazioni", "Abilita account “Sul mio Mac”"] }]} />
  <p>Apple non pubblica il percorso dei file nel Finder. Sul Mac puoi esportare una nota da File &gt; Esporta in, scegliendo PDF o Markdown. Se una nota locale non arriva sugli altri dispositivi, leggi <a href="/it/blog/note-iphone-non-sincronizzate">i controlli per la sincronizzazione</a>.</p>
  <h2 id="gmail">Gmail, Yahoo e altri account</h2>
  <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300} alt="Impostazioni di un account Gmail su iPhone con Note attivato." caption="Le note dell'account Gmail restano nell'account di posta. Immagine: Apple." />
  <p>Le note sotto Gmail o Yahoo si sincronizzano tramite quell'account, non con iCloud e non con Google Keep. Non puoi proteggerle con password, Face ID o Touch ID e alcune funzioni di Note mancano. Una nota eliminata può andare nel Cestino dell'account nell'app Mail. Se togli l'account da un dispositivo, le note restano sul server di posta.</p>
  <h2 id="confronto">Gli account a confronto</h2>
  <div className="tableWrap"><table><thead><tr><th>Account</th><th>Dove stanno le note</th><th>Altri dispositivi</th><th>Protezione nota</th></tr></thead><tbody>
    <tr><th>iCloud</th><td>iCloud</td><td>Stesso Apple Account e iCloud.com</td><td>Sì</td></tr>
    <tr><th>Su iPhone o Sul mio Mac</th><td>Su quel dispositivo</td><td>No</td><td>Sì</td></tr>
    <tr><th>Gmail o Yahoo</th><td>Account di posta</td><td>Dove l'account è attivo</td><td>No</td></tr>
  </tbody></table></div>
  <p>Le note create da Siri o dal widget vanno nell'Account di default, che scegli nelle impostazioni di Note. Per spostare le note locali o Gmail su iCloud, segui <a href="/it/blog/spostare-note-iphone-su-icloud">la guida in italiano</a>.</p>
  <h2 id="pinto">Dove sono le note in Pinto Notes</h2>
  <Figure shot={SHOTS.connectList} caption="Le impostazioni di Pinto Notes sul Mac mostrano i collegamenti a ChatGPT e Claude." />
  <p>Pinto Notes sincronizza le note tra iPhone e Mac con un solo accesso. Le cifra sul dispositivo prima della sincronizzazione e conserva le versioni precedenti. L'AI collegata le vede come file Markdown nelle tue cartelle. L'importazione delle note di Apple avviene sul Mac e non modifica gli originali. Non ci sono app Windows o Android.</p>
  <p>Altre guide: <a href="/blog/recover-deleted-apple-notes">recuperare note eliminate</a> (in inglese), <a href="/blog/connect-chatgpt-to-your-notes">collegare ChatGPT alle note</a> (in inglese), <a href="/blog/move-from-apple-notes">importare le note di Apple in Pinto Notes</a> (in inglese).</p>
  </LocalPostPage>; }
