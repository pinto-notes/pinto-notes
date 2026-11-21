import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "scanner-document-notes-iphone");

// Version française de /blog/apple-notes-scan-document. Recherche : « scanner document notes iphone » → « scanner doc notes iphone », « scan pdf note iphone », « scanner document avec notes iphone » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/108963 (Pièce jointe, Scanner des documents), /guide/iphone/iph653f28965/ios (Scanner du texte, Insérer), /guide/iphone/iph8958dd125/ios (Affichage, Coup d’œil), /fr-fr/102332 (Caméra Continuité) et /guide/preview/prvw1509/mac (Filtre Quartz), lus le 21 novembre 2026.
// Les boutons figurés uniquement par une icône dans le guide iPhone sont décrits par leur fonction, sans nom inventé. Faits Pinto repris de l’article anglais.

const ui = UI.fr;
const FAQ = [
  { q: "Comment scanner plusieurs pages dans un PDF ?", a: ["Dans Notes, touchez Pièce jointe, puis Scanner des documents. Scannez toutes les pages avant de terminer. Elles sont enregistrées ensemble en PDF dans la note."] },
  { q: "Scanner du texte crée-t-il du texte modifiable ?", a: ["Oui. Cette commande insère les mots sélectionnés dans la note, dans les langues prises en charge. Scanner des documents enregistre plutôt un PDF."] },
  { q: "Comment réduire la taille d’un scan ?", a: ["Sur Mac, ouvrez le PDF dans Aperçu, choisissez Fichier > Exporter, puis le filtre Quartz Réduire la taille du fichier. Gardez l’original et vérifiez la lisibilité de la copie."] },
  { q: "Peut-on scanner dans Notes sur Mac avec l’iPhone ?", a: ["Oui, avec Caméra Continuité. Les deux appareils doivent utiliser le même compte Apple, le Wi-Fi, le Bluetooth et l’identification à deux facteurs."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="scanner-document-notes-iphone" intro="Pour scanner un document dans Notes sur iPhone, ouvrez une note, touchez Pièce jointe, puis Scanner des documents. Les pages sont enregistrées en PDF."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#iphone", label: "Scanner sur iPhone" }, { href: "#pdf", label: "Partager le PDF" }, { href: "#texte", label: "Scanner du texte" }, { href: "#mac", label: "Scanner vers Mac" }, { href: "#taille", label: "Réduire le fichier" }]}>
      <p>Notes sait scanner plusieurs pages dans un même PDF. Pour obtenir des mots modifiables dans la note, utilisez Scanner du texte. Sur Mac, Caméra Continuité lance le scan depuis l’iPhone.</p>
      <PostCta slug="fr/scanner-document-notes-iphone" path="/fr/blog/scanner-document-notes-iphone" position="answer" ui={ui.cta} title="Garder le PDF avec vos notes"><p>Pinto Notes range PDF et autres fichiers dans les notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut lire et modifier le texte de vos notes.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="iphone">Scanner un document sur iPhone</h2><MenuPaths rows={[{ on: "iPhone", steps: ["Pièce jointe", "Scanner des documents"] }]} />
    <Steps><li>Ouvrez une note ou créez-en une.</li><li>Touchez Pièce jointe, puis Scanner des documents.</li><li>Cadrez la page. En mode automatique, gardez l’iPhone immobile.</li><li>Pour une capture manuelle, utilisez le déclencheur ou un bouton de volume, ajustez les coins puis conservez le scan.</li><li>Scannez les autres pages avant de terminer et d’enregistrer le document.</li></Steps>
    <p>Apple décrit aussi une voie par le menu de la note. Le <a href="https://support.apple.com/fr-fr/108963">guide du scanner</a> détaille le flash et les filtres sous iOS 26.</p>
    <h2 id="pdf">Partager le PDF scanné</h2><p>Scanner des documents place un PDF dans la note. Pour envoyer toutes ses pages, ouvrez le menu du PDF et choisissez l’action de partage. « Coup d’œil » l’affiche en plein écran. Avec « Affichage », vous changez seulement la taille de son aperçu. <a href="https://support.apple.com/fr-fr/guide/iphone/iph8958dd125/ios">Voir le guide des PDF</a>.</p>
    <p>Partagez le scan lui-même si le destinataire a besoin de toutes les pages. L’export de la note entière en PDF n’inclut que la première page d’un scan multipage. Consultez <a href="/fr/blog/exporter-notes-iphone-pdf">l’export PDF d’une note</a> pour cette différence.</p>
    <h2 id="texte">Insérer du texte plutôt qu’un PDF</h2><MenuPaths rows={[{ on: "iPhone", steps: ["Pièce jointe", "Scanner du texte", "Insérer"] }]} />
    <p>Dans une note, touchez Pièce jointe puis Scanner du texte. Cadrez les mots, sélectionnez-les à l’écran puis touchez Insérer. Apple limite cette fonction aux langues prises en charge. Vérifiez les mots insérés par rapport au papier. Ce geste ne transforme pas un PDF déjà scanné en document modifiable. <a href="https://support.apple.com/fr-fr/guide/iphone/iph653f28965/ios">Voir les étapes d’Apple</a>.</p>
    <h2 id="mac">Scanner vers Notes sur Mac</h2><p>Caméra Continuité utilise l’iPhone et insère le PDF dans la note ouverte sur Mac. Activez Wi-Fi et Bluetooth sur les deux appareils, connectés au même compte Apple avec l’identification à deux facteurs.</p>
    <Steps><li>Sur Mac, ouvrez la note et faites un clic avec la touche Contrôle à l’emplacement voulu.</li><li>Choisissez l’action de numérisation, dans le sous-menu de l’iPhone si nécessaire.</li><li>Scannez les pages sur l’iPhone, puis enregistrez-les. Le PDF apparaît sur Mac.</li></Steps>
    <p>Apple indique au minimum macOS Mojave 10.14 et iOS 12 sur les appareils compatibles. Vérifiez le matériel et le compte dans le <a href="https://support.apple.com/fr-fr/102332">guide de Caméra Continuité</a> si l’option manque.</p>
    <h2 id="taille">Réduire la taille du scan</h2><MenuPaths rows={[{ on: "Aperçu sur Mac", steps: ["Fichier", "Exporter", "Filtre Quartz", "Réduire la taille du fichier"] }]} />
    <p>Ouvrez le PDF dans Aperçu, exportez une copie avec ce filtre et gardez l’original. Relisez les petits caractères avant l’envoi : la compression peut dégrader l’image et le gain de taille varie. <a href="https://support.apple.com/fr-fr/guide/preview/prvw1509/mac">Voir le guide d’Aperçu</a>.</p>
    <h2>Dans Pinto Notes</h2><p>Gardez le PDF avec les notes que vous rédigez à son sujet. Utilisez le scanner d’Apple pour créer le document. Pinto Notes peut conserver le PDF, vos fichiers et les anciennes versions des notes. ChatGPT ou Claude peut lire et modifier les notes après connexion. L’import de Notes d’Apple sur Mac ne change pas les originaux.</p>
  </LocalPostPage>;
}
