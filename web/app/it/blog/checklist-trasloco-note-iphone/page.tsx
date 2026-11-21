import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("it", "checklist-trasloco-note-iphone");

// Italian version of /blog/apple-notes-moving-checklist-template, 21 Nov 2026.
// Google autocomplete hl=it, gl=it: "checklist trasloco" returned that phrase;
// "lista trasloco" returned "lista trasloco casa"; "cose da fare trasloco" returned
// "lista cose da fare trasloco". Exact Notes seed returned no relevant suggestion.
// Apple Italian pages read 21 Nov 2026: it-it/guide/notes/apd93c815aa0/mac (checklist),
// apd0a136b9cc/mac (Formato > Tabella, selected text), it-it/guide/iphone/iph1ac0b3a2/ios
// (Intestazione and icon-only checklist/table controls), and it-it/102296 (checklist).
// The icon-only controls are described. No picture in the English post.

const ui = UI.it;

const TEMPLATE = `Trasloco, 5 dicembre 2026

Da: via dei Tigli 18, interno 2, Bologna
A: via delle Betulle 42, interno 4, Bologna
Chiavi: ritiro nel nuovo condominio alle 08:00

Chi avvisare
Mara: aggiornare l'indirizzo in banca entro il 28 novembre
Teo: comunicare il nuovo indirizzo all'ufficio paghe entro il 30 novembre
Mara: avvisare l'assicurazione casa del trasloco entro il 28 novembre
Teo: chiedere a Poste Italiane il servizio di inoltro della posta entro il 30 novembre
Entrambi: aggiornare gli indirizzi di consegna prima del prossimo ordine

Utenze e collegamenti
Teo: confermare l'attivazione della luce in via delle Betulle per il 5 dicembre
Mara: confermare l'ultimo giorno della luce in via dei Tigli
Teo: confermare l'installazione internet per il 7 dicembre, dalle 09:00 alle 12:00
Mara: chiedere al gestore idrico come chiudere la vecchia utenza
Entrambi: fotografare le letture finali dei contatori prima di restituire le chiavi

Prima che arrivi il furgone
Mara: confermare lo spazio per il carico con la ditta il 3 dicembre
Teo: chiudere C01 e S01, poi aggiornare l'elenco delle scatole
Mara: tenere fuori dagli scatoloni la borsa con bollitore e tazze
Entrambi: tenere chiavi e caricabatterie nella borsa del giorno

Giorno del trasloco
08:00 Mara ritira le nuove chiavi
09:00 Teo incontra il furgone in via dei Tigli
12:30 Entrambi controllano la vecchia casa e leggono i contatori
15:00 Mara restituisce le vecchie chiavi all'amministratore

Contatti per il trasloco, esempio inventato
Ditta traslochi: Alex, 051 000 0147, prenotazione T0526
Amministratore nuovo condominio: Roberta, 051 000 0182, chiavi alle 08:00
Amministratore vecchio condominio: Samuele, 051 000 0114, chiavi alle 15:00

Prima notte
Trovare C01 con tazze e bollitore
Trovare S01 con lenzuola e asciugamani
Aprire la borsa del giorno prima degli altri scatoloni
`;

const BOXES = `Scatola\tStanza\tContenuto
C01\tCucina\tBollitore, due tazze, tè, cucchiaini
C02\tCucina\tPiatti, ciotole, strofinacci
S01\tCamera\tLenzuola, due cuscini, asciugamani
G01\tSoggiorno\tCavi della scrivania, router, ciabatta elettrica`;

const FAQ = [
  { q: "Come preparo una checklist per il trasloco in Note?", a: ["Copia questo modello in una nota. Sul Mac seleziona le attività sotto ogni intestazione e trasformale in elenchi di controllo. Lascia orari e contatti come testo e usa una tabella separata per gli scatoloni."] },
  { q: "Chi devo avvisare del cambio di indirizzo?", a: ["Inizia da banca, datore di lavoro, assicurazione casa, servizio postale e consegne abituali. Aggiungi gli altri enti che usano il tuo indirizzo. Per ciascuno indica responsabile e data, poi verifica la procedura richiesta."] },
  { q: "Come numero gli scatoloni?", a: ["Usa una lettera per la stanza e un numero, per esempio C01 per il primo scatolone della cucina. Scrivi lo stesso codice sulla scatola e nella nota, con stanza e contenuto."] },
  { q: "Claude può aggiornare la checklist in Pinto Notes?", a: ["Sì. Dopo il collegamento, Claude può leggere e modificare la nota su tua richiesta. Il modello da copiare è in questa pagina; Pinto non ha un modello di trasloco pronto."] },
];

export default function Page() {
  return <LocalPostPage lang="it" slug="checklist-trasloco-note-iphone"
    intro={<>Copia questa checklist del trasloco in Note di Apple. Tiene insieme comunicazioni, utenze, orari e contatti. La tabella degli scatoloni ti aiuta a trovare le cose della prima notte.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modello", label: "La checklist" }, { href: "#impostazione", label: "Preparala" },
      { href: "#scatoloni", label: "Gli scatoloni" }, { href: "#limiti", label: "I limiti" },
      { href: "#pinto-notes", label: "Aggiornala con l'AI" },
    ]}><p>Usa una nota con attività assegnate, orari del giorno del trasloco e contatti. Segna gli scatoloni nella nota e sulle scatole con gli stessi codici. Copia l'esempio e sostituisci i dati.</p>
      <PostCta slug="it/checklist-trasloco-note-iphone" path="/it/blog/checklist-trasloco-note-iphone" position="answer" ui={ui.cta} title="Vuoi aggiornare la nota con l'AI?">
        <p>Pinto Notes funziona come Note di Apple su iPhone e Mac. Dopo il collegamento, ChatGPT o Claude può leggere la nota e modificare attività o contenuti degli scatoloni quando glielo chiedi.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modello">Il modello: una nota per il trasloco</h2>
    <p>Mara e Teo traslocano il 5 dicembre in questo esempio inventato. Ogni comunicazione ha una persona e una scadenza. Lascia aperte le attività sulle utenze finché il gestore non conferma. Sostituisci indirizzi, contatti e orari.</p>
    <Keep title="Checklist del trasloco per Note di Apple" text={TEMPLATE} copyLabel={ui.copy}
      note="Incolla come testo normale. Trasforma i gruppi di attività in elenchi di controllo." />
    <h2 id="impostazione">Trasforma le attività in elenchi di controllo</h2>
    <p>Usa una nota iCloud o salvata sul dispositivo. Sul Mac seleziona solo le righe sotto Chi avvisare e usa il pulsante dell'elenco di controllo. Ripeti per Utenze, Prima che arrivi il furgone e Prima notte. Lascia fuori le intestazioni. Spunta una voce quando hai finito.</p>
    <p>Su iPhone avvia un elenco di controllo con il relativo pulsante e scrivi le attività. A capo aggiunge la successiva. Per un'intestazione, seleziona il testo e scegli Intestazione dal controllo di formattazione. Tocca il cerchio per completare un'attività. Apple spiega questi passaggi nella <a href="https://support.apple.com/it-it/102296">guida agli elenchi di controllo</a>.</p>
    <p>Lascia Giorno del trasloco e Contatti come testo: l'orario di ritiro delle chiavi deve restare visibile anche dopo. Altri modelli sono nella <a href="/blog/apple-notes-templates">raccolta per Note</a> (in inglese).</p>
    <h2 id="scatoloni">Un elenco utile quando apri gli scatoloni</h2>
    <p>Scrivi C01 sullo scatolone e nella sua riga. Indica stanza e oggetti abbastanza precisi da ritrovare il bollitore. Se sposti qualcosa, aggiorna la riga.</p>
    <Keep title="Contenuto degli scatoloni" text={BOXES} copyLabel={ui.copy}
      note="Le colonne sono separate da tabulazioni. Sul Mac seleziona le righe e trasformale in tabella." />
    <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabella"] }]} />
    <p>Incolla l'elenco nella nota, seleziona le cinque righe da Scatola all'ultima e usa il pulsante della tabella. Ogni tabulazione diventa una colonna. Il tasto Tabulatore nell'ultima cella aggiunge una riga. Vedi la <a href="/blog/apple-notes-tables">guida alle tabelle</a> (in inglese).</p>
    <p>Su iPhone crea una tabella con il relativo pulsante e inserisci i dati nelle celle. Se è più comodo, tieni ogni scatola su una riga di testo. Metti insieme sul furgone le scatole della prima notte.</p>
    <h2 id="limiti">I limiti</h2>
    <p>Le date sono testo. Se sposti il trasloco al 12 dicembre, controlla tu tutte le date delle utenze e degli appuntamenti. Imposta gli avvisi separatamente. Una spunta non avvisa un gestore e non cambia un contratto.</p>
    <p>Anche l'elenco degli scatoloni è manuale e non genera etichette. Controlla le scatole prima che il furgone parta. Chiedi a ogni gestore la sua procedura: l'esempio non è un elenco completo per ogni trasloco.</p>
    <h2 id="pinto-notes">Chiedi all'AI di aggiornare la nota</h2>
    <p>Pinto Notes è un'app gratuita per iPhone e Mac che si presenta e funziona come Note di Apple. Puoi creare questa struttura con intestazioni, elenchi di controllo e una tabella. Il modello da copiare è in questa pagina; Pinto non offre un modello di trasloco pronto.</p>
    <p>Dopo aver <a href="/blog/connect-chatgpt-to-your-notes">collegato ChatGPT</a> o Claude (guida in inglese), può leggere e modificare la nota. Chiedi: «Sposta l'installazione internet all'8 dicembre, dalle 10:00 alle 13:00. Lascia invariato il giorno del trasloco». Oppure chiedi di spostare il router da G01 a C02. Confronta la nota con la conferma o con lo scatolone.</p>
    <p>Puoi importare le tue note di Apple <a href="/blog/move-from-apple-notes">una volta sul Mac</a> (guida in inglese). Le note originali non cambiano.</p>
  </LocalPostPage>;
}
