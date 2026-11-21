import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "inventaire-maison-notes-iphone");

// Version française de /blog/apple-notes-home-inventory-template, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « modele inventaire maison » donne « fiche inventaire maison » ;
// « inventaire maison assurance » donne « inventaire maison pour assurance ».
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac
// (Format > Tableau, conversion), /guide/notes/apd93c815aa0/mac (Liste de pointage),
// /guide/iphone/iph1ac0b3a2/ios (Ajouter un tableau, Liste de vérification, Format, Sous-titre),
// /guide/notes/not95edd2813/mac et /guide/iphone/iph23f4d9aa9/ios (pièces jointes).
// Prix en euros et objets fictifs français. Aucune image dans l'original.
const ui = UI.fr;
const TEMPLATE = `Inventaire du salon
Pièce : salon
Dernière vérification : 21 novembre 2026

Objet\tDossier
SAL-01 : radio DAB\tNuméro de série noté ; facture et photos à joindre
SAL-02 : table basse en chêne\tPas de numéro marqué ; facture manquante ; photo à joindre

SAL-01 : radio DAB
Pièce et emplacement : salon, étagère près de la fenêtre
Marque et modèle : Roberts Play 10
Numéro de série : EXEMPLE-SAL01-2047
Achetée le : 8 mars 2025
Prix d’achat : 59 €, ce n’est pas sa valeur actuelle
Facture : SAL-01-facture.pdf, à joindre sous cette fiche
Photos : SAL-01-face.jpg et SAL-01-etiquette.jpg, à joindre dessous
État : petite rayure près du bouton de volume

SAL-02 : table basse en chêne
Pièce et emplacement : salon, devant le canapé
Marque et modèle : sans marque, chêne massif, 90 x 50 cm
Numéro de série : aucun marquage
Achetée le : 12 juin 2023, d’occasion
Prix d’achat : 75 €, ce n’est pas sa valeur actuelle
Facture : manquante, achat payé en espèces
Photo : SAL-02-table.jpg, à joindre sous cette fiche
État : trace d’eau sur l’angle gauche

À compléter
Joindre la facture de la radio
Joindre les photos de la face et de l’étiquette de la radio
Joindre la photo de la table basse
Comparer le numéro de série de la radio à son étiquette
`;
const FAQ = [
  { q: "Peut-on faire un inventaire de la maison dans Notes ?", a: ["Oui. Gardez une note par pièce, avec une fiche par objet pour le numéro de série, la facture et les photos. Remplacez les exemples par vos propres biens."] },
  { q: "Comment joindre des photos de factures ?", a: ["Sur iPhone, utilisez le bouton des pièces jointes dans la note. Pour un PDF dans Fichiers, ouvrez-le, touchez Partager, puis Notes et choisissez la note voulue. Sur Mac, glissez le fichier depuis le Finder."] },
  { q: "La note calcule-t-elle la valeur de remplacement ?", a: ["Non. Elle enregistre vos objets et leur prix d’achat, sans calculer leur valeur actuelle ni leur coût de remplacement. Elle ne vaut pas accord de l’assureur."] },
  { q: "Que noter sans numéro de série ?", a: ["Écrivez « aucun marquage » après vérification, ou « à vérifier » si vous n’avez pas encore regardé. Gardez la description et les photos."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="inventaire-maison-notes-iphone"
    intro="Ce modèle d’inventaire de la maison se copie dans Notes, avec une note par pièce. Chaque objet a sa fiche, un champ pour le numéro de série et une place pour la facture et les photos."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "Copier le modèle" }, { href: "#installer", label: "Tableau et liste" },
      { href: "#photos", label: "Factures et photos" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Dans Pinto Notes" },
    ]}><p>Créez une note par pièce avec un petit tableau des objets et les fiches détaillées dessous. Ajoutez les factures et photos près de l’objet concerné. La note n’est ni une estimation de valeur ni une validation par l’assureur.</p>
      <PostCta slug="fr/inventaire-maison-notes-iphone" path="/fr/blog/inventaire-maison-notes-iphone" position="answer" ui={ui.cta} title="Tenir les fiches à jour"><p>Pinto Notes ressemble à Notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut lire et modifier les fiches avec les renseignements que vous lui donnez.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modele">Une pièce à la fois</h2>
    <p>Le salon de cet exemple contient une radio et une table achetée d’occasion. Les numéros et noms de fichiers sont fictifs. Copier le texte ne joint aucun fichier. Remplacez chaque champ, dont la marque et le modèle.</p>
    <Keep title="Inventaire de la maison pour Notes" text={TEMPLATE} copyLabel={ui.copy} note="Collez le texte. Transformez les trois lignes Objet et Dossier en tableau, puis À compléter en liste à cocher." />
    <p>Gardez le même identifiant sur la fiche et les pièces jointes. SAL-01 relie la radio à sa facture et à ses photos. « À vérifier » et « manquante » n’ont pas le même sens : le premier indique un contrôle à faire, le second une pièce introuvable.</p>
    <h2 id="installer">Créer le tableau et la liste</h2>
    <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Tableau"] }, { on: "iPhone", steps: ["Ajouter un tableau"] }]} />
    <p>Sur Mac, sélectionnez les trois lignes de Objet à SAL-02, puis cliquez sur Tableau. Les tabulations séparent les colonnes. Vous pouvez aussi choisir Format, Tableau pour créer un tableau vide et saisir les rangs. Tabulation dans la dernière cellule ajoute un rang. Apple décrit la <a href="https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac">conversion sur Mac</a>.</p>
    <p>Sur iPhone, touchez Ajouter un tableau et entrez les deux colonnes, puis supprimez les lignes en texte simple. Pour les intitulés, sélectionnez le texte, puis touchez Format et Sous-titre. Le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide d’Apple</a> montre ces boutons.</p>
    <p>Sur Mac, sélectionnez les quatre tâches sous À compléter et cliquez sur Liste de pointage. Sur iPhone, démarrez une Liste de vérification et saisissez chaque tâche. Cochez seulement après avoir joint le fichier ou vérifié le numéro.</p>
    <p>Gardez le tableau court et les descriptions longues sous celui-ci. Consultez aussi le <a href="/blog/apple-notes-tables">guide des tableaux</a> et les <a href="/blog/apple-notes-templates">autres modèles</a> (en anglais).</p>
    <h2 id="photos">Joindre chaque facture au bon objet</h2>
    <p>Photographiez l’objet entier et son étiquette séparément. Placez les fichiers sous sa fiche, hors du tableau. Recopiez le numéro de série et comparez-le à la photo avant de cocher la tâche.</p>
    <p>Sur iPhone, utilisez le bouton des pièces jointes pour choisir une photo. Pour une facture PDF dans Fichiers, ouvrez-la, touchez Partager, puis Notes, et choisissez la note du salon. Apple décrit <a href="https://support.apple.com/fr-fr/guide/iphone/iph23f4d9aa9/ios">ces deux chemins</a>.</p>
    <p>Sur Mac, glissez les PDF depuis le Finder et les photos depuis Photos. Utilisez une note iCloud : Apple indique que les notes Exchange n’acceptent pas les fichiers joints. Consultez son <a href="https://support.apple.com/fr-fr/guide/notes/not95edd2813/mac">guide des pièces jointes</a>.</p>
    <p>Quand un objet quitte la maison, notez la date de vente, de don ou de mise au rebut. Après un achat, ajoutez sa fiche tant que vous avez la facture. Gardez les réparations dans une <a href="/fr/blog/entretien-maison-notes-iphone">liste d’entretien de la maison</a> séparée.</p>
    <h2 id="limites">Ce que l’inventaire ne prouve pas</h2>
    <p>Le prix d’achat n’est ni une valeur actuelle ni une estimation du coût de remplacement. Demandez à votre assureur quelles pièces il exige avant de compter sur cette note pour un sinistre.</p>
    <p>Vous vérifiez les étiquettes, joignez les fichiers et mettez le tableau à jour vous-même. Un nom de fichier écrit ne prouve pas que la pièce est jointe. Ouvrez chaque facture et photo après l’ajout et gardez une autre copie des originaux.</p>
    <h2 id="pinto-notes">Garder l’inventaire dans Pinto Notes</h2>
    <p>Vous pouvez copier cette structure dans Pinto Notes, qui accepte tableaux et fichiers joints. Pinto ne fournit pas de modèle d’inventaire tout prêt pour cet article.</p>
    <p>Une fois <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT ou Claude connecté</a> (en anglais), l’IA peut lire et modifier les notes. L’autorisation couvre les deux actions. Demandez la liste des fiches dont la facture manque ou dont le numéro reste à vérifier, sans inventer de données. Contrôlez le résultat.</p>
    <p>Pinto peut exporter les notes en fichiers Markdown dans une archive ZIP avec les pièces jointes récupérables. Vérifiez le bilan : des notes verrouillées par mot de passe, Face ID ou Touch ID peuvent être ignorées et les fichiers impossibles à télécharger sont signalés. Ouvrez les copies avant de les considérer comme complètes.</p>
    <p>Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
