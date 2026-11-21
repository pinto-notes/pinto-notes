import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "checklist-demenagement-notes-iphone");

// Version française de /blog/apple-notes-moving-checklist-template, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « checklist déménagement » donne « checklist déménagement france »
// et « check list déménagement à imprimer » ; « liste déménagement » donne « liste déménagement changement adresse ».
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac
// (Liste de pointage), /guide/notes/apd0a136b9cc/mac (Format > Tableau, conversion, Tabulation),
// /guide/iphone/iph1ac0b3a2/ios (Liste de vérification, Ajouter un tableau, Format, Sous-titre),
// support.apple.com/fr-fr/102296 (cases à cocher). Adresses, services et téléphones fictifs en France.
const ui = UI.fr;
const TEMPLATE = `Déménagement, 5 décembre 2026

Départ : 18 rue des Tilleuls, appartement 2, Lyon
Arrivée : 42 rue des Bouleaux, appartement 4, Lyon
Clés : à récupérer dans le nouvel immeuble à 8 h

Changements d’adresse
Marie : déclarer la nouvelle adresse à la banque avant le 28 novembre
Théo : prévenir le service paie de son employeur avant le 30 novembre
Marie : contacter l’assurance habitation avant le 28 novembre
Théo : demander la réexpédition du courrier à La Poste avant le 30 novembre
Tous les deux : modifier les adresses de livraison avant la prochaine commande

Énergie et abonnements
Théo : confirmer le début du contrat d’électricité rue des Bouleaux le 5 décembre
Marie : confirmer la fin du contrat d’électricité rue des Tilleuls
Théo : confirmer l’installation d’Internet le 7 décembre, de 9 h à 12 h
Marie : demander au service des eaux comment fermer l’ancien compte
Tous les deux : relever les compteurs avant de rendre les clés

Avant l’arrivée du camion
Marie : confirmer la place de chargement avec le déménageur le 3 décembre
Théo : emballer C01 et CH01, puis mettre la liste des cartons à jour
Marie : garder le sac avec la bouilloire hors des cartons
Tous les deux : garder clés et chargeurs dans le sac du jour

Jour du déménagement
8 h : Marie récupère les nouvelles clés
9 h : Théo accueille le camion rue des Tilleuls
12 h 30 : tous les deux vérifient l’ancien logement et relèvent les compteurs
15 h : Marie remet les anciennes clés au gestionnaire

Contacts du jour, exemples fictifs
Déménageur : Alex, 06 12 34 56 78, réservation M0526
Gestionnaire du nouvel immeuble : Robin, 06 23 45 67 89, clés à 8 h
Gestionnaire de l’ancien immeuble : Sam, 06 34 56 78 90, clés à 15 h

Première nuit
Trouver C01 pour les tasses et la bouilloire
Trouver CH01 pour les draps et les serviettes
Déballer le sac du jour avant les autres cartons
`;
const BOXES = `Carton\tPièce\tContenu
C01\tCuisine\tBouilloire, deux tasses, thé, petites cuillères
C02\tCuisine\tAssiettes, bols, torchons
CH01\tChambre\tDraps, deux oreillers, serviettes de bain
S01\tSalon\tCâbles du bureau, routeur, multiprise`;
const FAQ = [
  { q: "Comment faire une check-list de déménagement dans Notes ?", a: ["Copiez la note ci-dessous. Sur Mac, sélectionnez les tâches de chaque section et cliquez sur Liste de pointage. Gardez les horaires et contacts en texte simple et les cartons dans un tableau."] },
  { q: "Qui prévenir de son changement d’adresse ?", a: ["Commencez par la banque, l’employeur, l’assurance habitation, la réexpédition du courrier et les livraisons régulières. Ajoutez les autres organismes concernés et vérifiez leur procédure."] },
  { q: "Comment numéroter les cartons ?", a: ["Utilisez un code de pièce suivi d’un nombre, par exemple C01 pour le premier carton de cuisine. Écrivez le même code sur le carton et dans la note."] },
  { q: "Claude peut-il modifier la liste dans Pinto Notes ?", a: ["Oui, après connexion, Claude peut lire et modifier la note à votre demande. Le modèle est sur cette page ; Pinto n’en fournit pas de tout prêt pour un déménagement."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="checklist-demenagement-notes-iphone"
    intro="Copiez cette check-list de déménagement dans Notes pour suivre les changements d’adresse, les abonnements et les contacts du jour. Le tableau des cartons aide à retrouver la bouilloire et les draps à l’arrivée."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "La liste" }, { href: "#installer", label: "Créer les cases" },
      { href: "#cartons", label: "Les cartons" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Avec une IA" },
    ]}><p>Gardez une note pour le déménagement : tâches d’adresse et d’abonnements, horaires, contacts et cartons. Donnez un responsable à chaque tâche et reprenez les mêmes codes sur les cartons et dans la note.</p>
      <PostCta slug="fr/checklist-demenagement-notes-iphone" path="/fr/blog/checklist-demenagement-notes-iphone" position="answer" ui={ui.cta} title="Mettre la liste à jour avec une IA"><p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut lire votre liste et modifier les tâches ou le contenu des cartons à votre demande.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modele">Une note pour tout le déménagement</h2>
    <p>Marie et Théo déménagent le 5 décembre dans cet exemple fictif. Chaque tâche indique qui s’en charge et pour quand. Une demande de changement d’abonnement reste ouverte jusqu’à confirmation du fournisseur. Remplacez les adresses et les contacts.</p>
    <Keep title="Check-list de déménagement pour Notes" text={TEMPLATE} copyLabel={ui.copy} note="Collez le texte. Transformez les groupes de tâches en listes à cocher." />
    <h2 id="installer">Transformer les tâches en listes</h2>
    <p>Utilisez une note iCloud ou enregistrée sur votre appareil. Sur Mac, sélectionnez uniquement les lignes de tâches sous Changements d’adresse, puis cliquez sur Liste de pointage. Recommencez pour Énergie et abonnements, Avant l’arrivée du camion et Première nuit. Laissez les titres hors de la sélection.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Sélectionner les tâches", "Liste de pointage"] }, { on: "iPhone", steps: ["Liste de vérification"] }]} />
    <p>Sur iPhone, touchez Liste de vérification et saisissez les tâches une par une. Pour mettre un titre en forme, sélectionnez-le, touchez Format puis Sous-titre. Touchez le cercle d’une tâche terminée. Apple décrit ces boutons dans son <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide de Notes</a>.</p>
    <p>Gardez les horaires et les contacts en texte simple. L’heure de récupération des clés doit rester lisible même une fois l’action faite. Pour d’autres modèles, voyez les <a href="/blog/apple-notes-templates">modèles pour Notes</a> (en anglais).</p>
    <h2 id="cartons">Une liste de cartons utile au déballage</h2>
    <p>Écrivez C01 sur le carton de cuisine et sur son rang dans la note. Nommez les objets précis : « affaires de cuisine » ne dit pas où est la bouilloire. Corrigez le rang si vous déplacez un objet.</p>
    <Keep title="Contenu des cartons" text={BOXES} copyLabel={ui.copy} note="Chaque ligne contient des tabulations. Sur Mac, collez les lignes, sélectionnez-les et cliquez sur Tableau." />
    <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Tableau"] }]} />
    <p>Collez le tableau dans la note, sélectionnez les cinq lignes de Carton à S01, puis cliquez sur Tableau. Les tabulations séparent les colonnes. Tabulation dans la dernière cellule ajoute un rang. Le <a href="/blog/apple-notes-tables">guide des tableaux</a> (en anglais) détaille les commandes.</p>
    <p>Sur iPhone, touchez Ajouter un tableau et remplissez les cellules. Vous pouvez aussi garder une ligne de texte par carton. Regroupez les cartons de la première nuit dans le camion pour les retrouver à l’arrivée.</p>
    <h2 id="limites">Ce que la note ne fait pas</h2>
    <p>Les dates sont du texte à maintenir. Si le déménagement passe au 12 décembre, vérifiez vous-même chaque rendez-vous et contrat. Programmez les alertes séparément. Une case cochée ne prévient aucun fournisseur.</p>
    <p>La liste de cartons dépend de ce que vous écrivez ; elle ne crée pas d’étiquettes. Vérifiez les cartons physiques avant le départ. Confirmez directement les démarches auprès de chaque organisme.</p>
    <h2 id="pinto-notes">Demander une mise à jour à ChatGPT ou Claude</h2>
    <p>Pinto Notes est une app gratuite pour iPhone et Mac qui ressemble à Notes et fonctionne comme lui. Vous pouvez y créer cette note avec titres, listes et tableau. Pinto ne fournit pas de modèle de déménagement prêt à l’emploi ; celui-ci se copie depuis cette page.</p>
    <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> (en anglais), demandez de déplacer l’installation d’Internet au 8 décembre, de 10 h à 13 h, sans changer la date du déménagement. Vous pouvez aussi demander de déplacer le routeur de S01 vers C02. Vérifiez le résultat avec la confirmation ou le carton.</p>
    <p>Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
