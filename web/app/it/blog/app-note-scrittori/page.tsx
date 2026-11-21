import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "app-note-scrittori");
// Italian version of /blog/notes-app-for-writers. Google autocomplete hl=it, gl=it,
// 21 Nov 2026: "app per scrittori" returned itself, "app per scrittori gratis" and
// "migliori app per scrittori". "app per scrivere libri" returned itself and a free variant.
// Apple it-it/guide/notes/not9474646a9/mac, not201900c07/mac and apde615d29c2/mac
// read 21 Nov 2026: File > Duplica nota, File > Esporta in, Modifica > Aggiungi link.
// Other makers' facts and the history picture follow the English post.
const ui = UI.it;
const FAQ = [
  { q: "Posso scrivere un romanzo in Note di Apple?", a: ["Sì. Tieni una nota per scena e una nota indice con i link. Sul Mac, File > Duplica nota conserva una bozza prima della riscrittura. Per obiettivi di parole e assemblaggio dei capitoli, valuta Ulysses o Scrivener."] },
  { q: "Quali app mostrano il conteggio parole?", a: ["Bear lo mostra nel pannello Info. Obsidian ha un plugin integrato per contare le parole. Ulysses e Scrivener hanno conteggi e obiettivi di scrittura."] },
  { q: "Un'app di note basta per scrivere articoli?", a: ["Può bastare. Scrivi ed esporta un articolo intero prima di trasferire la libreria. Verifica come conserverai le vecchie bozze e se il file esportato funziona nell'editor o nel sistema di pubblicazione che usi."] },
];
export default function Page() { return <LocalPostPage lang="it" slug="app-note-scrittori"
  intro={<>Note di Apple va bene per idee e bozze brevi. Bear aggiunge il conteggio parole, Pinto Notes la cronologia e l'accesso dell'AI, Obsidian conserva ricerche in file collegati. Per un manoscritto intero, valuta Ulysses o Scrivener.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
    { href: "#confronto", label: "Le sei app" }, { href: "#note-apple", label: "Scrivere in Note" },
    { href: "#pinto", label: "Pinto Notes" }, { href: "#manoscritto", label: "Ulysses e Scrivener" },
    { href: "#prova", label: "Prova una bozza" },
  ]}><p>Usa Note di Apple per raccogliere idee e scrivere nell'app che conosci. Bear aggiunge Markdown e conteggio parole; Obsidian lega le ricerche ai file delle bozze. Pinto Notes conserva le versioni e permette l'accesso dell'AI. Ulysses e Scrivener sono app di scrittura con strumenti per i manoscritti.</p>
    <PostCta slug="it/app-note-scrittori" path="/it/blog/app-note-scrittori" position="answer" ui={ui.cta} title="Conserva le bozze precedenti"><p>Pinto Notes funziona come Note di Apple su iPhone e Mac, conserva le versioni precedenti e, dopo il collegamento, permette a ChatGPT o Claude di leggere e modificare le note.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="confronto">Sei app per modi diversi di scrivere</h2>
  <div className="tableWrap"><table><thead><tr><th>App</th><th>Adatta a</th><th>Bozze precedenti</th><th>Esportazione</th></tr></thead><tbody>
    <tr><th>Note di Apple</th><td>Idee e bozze brevi</td><td>Duplica prima di riscrivere</td><td>PDF o Markdown di una nota sul Mac</td></tr>
    <tr><th>Pinto Notes</th><td>Note familiari con accesso AI</td><td>Cronologia con ripristino</td><td>Libreria Markdown in ZIP; PDF sul Mac</td></tr>
    <tr><th>Bear</th><td>Bozze Markdown con conteggio parole</td><td>Backup manuali della libreria</td><td>Markdown; DOCX, PDF ed ePub richiedono Pro</td></tr>
    <tr><th>Obsidian</th><td>Ricerche collegate alle bozze</td><td>Istantanee locali; Sync ha una cronologia separata</td><td>Le note sono già file Markdown</td></tr>
    <tr><th>Ulysses</th><td>Scrittura concentrata con obiettivi</td><td>Backup locali automatici</td><td>DOCX, PDF, ePub, HTML o testo</td></tr>
    <tr><th>Scrivener</th><td>Capitoli e ricerche nello stesso progetto</td><td>Snapshot prima delle revisioni</td><td>Compila in Word, PDF o ePub</td></tr>
  </tbody></table></div>
  <p>Un backup della libreria, un'istantanea di recupero e una copia fatta prima di modificare non sono equivalenti.</p>
  <h2 id="note-apple">Note di Apple per iniziare a scrivere</h2>
  <p>Note salva mentre scrivi. Una cartella per progetto e una nota per scena o articolo sono un punto di partenza. Tieni le fonti in note separate per trovarle senza cercare dentro la bozza. Tag e note in evidenza aiutano a ritrovare la scaletta.</p>
  <p>Per creare un indice sul Mac, scrivi i titoli delle scene in una nota. Seleziona un titolo, scegli Modifica &gt; Aggiungi link e scegli la nota corrispondente. Prima di una riscrittura, seleziona la bozza e scegli File &gt; Duplica nota. Dai alla copia una data e un nome chiaro. È una conservazione manuale. La <a href="/blog/apple-notes-version-history">guida alla cronologia di Note</a>, in inglese, spiega i limiti del recupero.</p>
  <p>Per passare una bozza a un altro editor sul Mac, seleziona la nota e scegli File &gt; Esporta in, poi PDF o Markdown. La <a href="/blog/export-apple-notes-to-markdown">guida all'esportazione Markdown</a>, in inglese, dice cosa controllare nel file. Se ti serve un obiettivo di parole o l'esportazione di un libro, confronta le app sotto.</p>
  <h2 id="pinto">Pinto Notes per versioni e AI collegata</h2>
  <p>Pinto Notes si presenta e funziona come Note di Apple su iPhone e Mac. Conserva le note in Markdown e ha una cronologia. Sul Mac, apri File, Version History, seleziona una versione e scegli Restore This Version. Anche il testo sostituito resta come versione.</p>
  <Figure shot={{ ...SHOTS.history, alt: "Cronologia delle versioni di una lista della spesa in Pinto Notes sul Mac, con testo precedente e pulsante Restore This Version." }} caption="Cronologia di una lista della spesa in Pinto Notes sul Mac. Si vedono il testo precedente e il pulsante Restore This Version." />
  <p>Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT o Claude</a>, possono leggere e modificare le note. Puoi far leggere le tue ricerche prima di chiedere una scaletta, poi controllare il risultato. Conserva le fonti per verificare citazioni e fatti.</p>
  <p>Sul Mac, File, Export All Notes salva un file ZIP con i Markdown nelle loro cartelle. Sblocca prima le note protette con password, Face ID o Touch ID se vuoi includerle. File, Export as PDF salva la nota aperta. Se devi consegnare un Word o un ebook, Ulysses e Scrivener esportano direttamente in quei formati. Pinto Notes è solo per iPhone e Mac. Puoi <a href="/blog/move-from-apple-notes">importare Note di Apple sul Mac</a>; l'originale resta invariato.</p>
  <h2 id="bear">Bear per bozze Markdown con conteggio parole</h2>
  <p>Bear organizza il Markdown con tag. Il pannello Info mostra parole e tempo di lettura stimato. Sul Mac, Edit, Typewriter Mode mantiene al centro la riga in cui scrivi. Puoi nascondere barra laterale ed elenco note. Vedi la <a href="https://blog.bear.app/2023/07/get-started-with-bear/">guida iniziale</a> e le <a href="https://bear.app/faq/typewriter-mode/">istruzioni della modalità macchina da scrivere</a>.</p>
  <p>L'esportazione Markdown è disponibile anche nella versione gratuita. DOCX, PDF ed ePub richiedono Pro. Bear documenta backup manuali della libreria; ripristinarne uno sostituisce la libreria corrente. Controlla i <a href="https://bear.app/faq/export-your-notes/">formati</a> e le <a href="https://bear.app/faq/backup-restore/">istruzioni di backup</a> prima di spostare le bozze.</p>
  <h2 id="obsidian">Obsidian per ricerche in file collegati</h2>
  <p>Obsidian salva normali file Markdown in una cartella. Puoi collegare una fonte alla bozza e aprire i file in un altro editor. Il plugin integrato Word count mostra parole e caratteri della nota aperta. Leggi le guide alla <a href="https://obsidian.md/help/data-storage">conservazione dei file</a> e al <a href="https://obsidian.md/help/plugins/word-count">conteggio</a>.</p>
  <p>File recovery conserva istantanee locali per sette giorni per impostazione predefinita. Restano sul dispositivo che le ha create e non sono un backup completo. Obsidian Sync ha una cronologia separata. Leggi i <a href="https://obsidian.md/help/plugins/file-recovery">limiti del recupero</a> e tieni un backup a parte.</p>
  <h2 id="manoscritto">Ulysses e Scrivener per testi lunghi</h2>
  <h3>Ulysses per scrivere con obiettivi</h3>
  <p>Ulysses è un'app di scrittura. Il suo editor e i progetti servono per articoli e manoscritti divisi in sezioni. Puoi fissare <a href="https://help.ulysses.app/goals">obiettivi di parole</a> per foglio, gruppo o progetto, anche giornalieri. Esporta DOCX, PDF, ePub, HTML e testo. I <a href="https://help.ulysses.app/en_US/backups">backup automatici</a> sono locali, non si sincronizzano e non includono le External Folders.</p>
  <h3>Scrivener per assemblare un manoscritto</h3>
  <p>Scrivener divide il testo in sezioni che puoi riordinare, con le ricerche accanto alla bozza. La modalità composizione nasconde il resto dell'interfaccia. Gli obiettivi possono riguardare manoscritto, sezione o sessione. Fai uno Snapshot prima di riscrivere per confrontare o recuperare il testo. Compile unisce le sezioni in Word, PDF o ePub. Prova con un esempio prima di trasferire un progetto intero. La <a href="https://www.literatureandlatte.com/scrivener/overview">panoramica del produttore</a> descrive questi strumenti.</p>
  <h2 id="prova">Prova una bozza intera prima di cambiare app</h2>
  <p>Usa un testo breve su cui stai già lavorando. Scrivi per venti minuti, rivedi un paragrafo e recupera la versione precedente. Esporta e apri il file dove lo consegnerai o pubblicherai. Scegli l'app che rende più semplici questi passaggi per il tuo lavoro.</p>
  </LocalPostPage>; }
