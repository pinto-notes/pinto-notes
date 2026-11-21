import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "organisation-mariage-notes-iphone");

// Version française de /blog/apple-notes-wedding-planner-template, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « planning mariage modele » donne « planning mariage exemple » ;
// « organisation mariage checklist » donne « organisation mariage checklist ».
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac
// (Format > Tableau), /guide/notes/apd93c815aa0/mac (Liste de pointage),
// /guide/iphone/iph1ac0b3a2/ios (Nouvelle note, Ajouter un tableau, Liste de vérification, Sous-titre),
// /guide/iphone/iphe4d04f674/27/ios/27 (partage et accès). Exemple fictif français, sans image.
const ui = UI.fr;
const TEMPLATE = `Mariage de Maïa et Sam, 19 juin 2027

Lieu : salle des Tilleuls, Lyon
Nombre maximal d’invités : 48
Date limite de réponse : 31 mai 2027
Nombre définitif à transmettre à la salle : 5 juin 2027
Dernière revue : 21 novembre 2026

Invités, quelques exemples
Invité\tRéponse et repas
Léna Morel\tOui ; végétarien
Alex Chen\tOui ; poulet
Nora Patel\tEn attente ; repas inconnu
Benoît Caron\tNon ; refus le 20 novembre

Prestataires
Prestataire\tDécision et prochaine date
Salle des Tilleuls\tRéservée ; transmettre le nombre définitif avant le 5 juin
Traiteur Olive\tDevis reçu ; dégustation le 28 novembre
Studio Juin, photographe\tPrésélectionné ; demander la couverture de la cérémonie

Prochaines actions
Maïa : confirmer l’heure de la dégustation avec le traiteur avant le 24 novembre
Sam : demander au Studio Juin s’il couvre la cérémonie avant le 25 novembre
Maïa : ajouter les autres invités à la liste avant le 29 novembre
Sam : inscrire le solde de la salle et sa date limite dans le budget avant le 30 novembre

Questions ouvertes
Le traiteur propose-t-il un plat végétalien en plus du plat végétarien ?
Qui rapportera les fleurs après la réception ?
`;
const FAQ = [
  { q: "Comment préparer son mariage dans Notes ?", a: ["Collez cette note. Sur Mac, transformez les blocs d’invités et de prestataires en tableaux, puis les actions en liste de pointage. Remplacez ensuite les exemples."] },
  { q: "Peut-on modifier la note à deux ?", a: ["Oui, dans iCloud. Chacun doit avoir un compte Apple avec Notes activé. Sur iOS 27, partagez la note et donnez à votre partenaire le droit de la modifier."] },
  { q: "La liste recueille-t-elle les réponses des invités ?", a: ["Non. Saisissez chaque réponse vous-même et distinguez En attente de Non. La note n’envoie pas d’invitations, ne reçoit pas les réponses et ne calcule pas le total en direct."] },
  { q: "ChatGPT peut-il mettre ce planning à jour ?", a: ["Une fois connecté à Pinto Notes, il peut lire et modifier la note avec les réponses et informations que vous lui transmettez. Ce modèle ne reçoit rien directement des invités."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="organisation-mariage-notes-iphone"
    intro="Copiez ce modèle d’organisation de mariage dans Notes : liste des invités et de leurs réponses, décisions sur les prestataires et prochaines tâches. L’exemple rempli montre quoi noter sur iPhone et Mac."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "Copier le modèle" }, { href: "#installer", label: "Le mettre en forme" },
      { href: "#suivi", label: "Le tenir à jour" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Avec une IA" },
    ]}><p>Une note suffit pour un tableau des invités, un tableau des prestataires et une liste de tâches avec responsable et date. Copiez le texte, puis créez les tableaux et la liste dans Notes.</p>
      <PostCta slug="fr/organisation-mariage-notes-iphone" path="/fr/blog/organisation-mariage-notes-iphone" position="answer" ui={ui.cta} title="Mettre le planning à jour"><p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut modifier la note à partir des réponses et informations que vous lui donnez.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modele">Invités et prochaines décisions</h2>
    <p>Maïa et Sam se marient en juin dans cet exemple. Les rangs d’invités ne sont qu’un échantillon. Gardez un rang par personne, même pour un couple, afin de rattacher chaque réponse et choix de repas à un nom.</p>
    <Keep title="Organisation de mariage pour Notes" text={TEMPLATE} copyLabel={ui.copy} note="Collez le texte. Une tabulation sépare les deux colonnes de chaque tableau. Mettez les tableaux et les tâches en forme séparément." />
    <h2 id="installer">Mettre la note en forme</h2>
    <MenuPaths rows={[{ on: "Mac, tableaux", steps: ["Format", "Tableau"] }, { on: "Mac, tâches", steps: ["Sélectionner les tâches", "Liste de pointage"] }, { on: "iPhone, tableaux", steps: ["Ajouter un tableau"] }, { on: "iPhone, tâches", steps: ["Liste de vérification"] }]} />
    <p>Sur Mac, sélectionnez les cinq lignes de Invité à Benoît et cliquez sur Tableau. Les tabulations séparent Invité de Réponse et repas. Recommencez pour les quatre lignes de Prestataire à Studio Juin. Format, Tableau crée aussi un tableau. Tabulation dans la dernière cellule ajoute un rang. Apple détaille les <a href="https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac">tableaux sur Mac</a>.</p>
    <p>Sélectionnez seulement les quatre lignes de Prochaines actions et cliquez sur Liste de pointage. Laissez les réponses des invités sous forme de texte : une invitation sans réponse n’est pas un refus.</p>
    <p>Sur iPhone, créez une note, puis deux tableaux avec Ajouter un tableau et remplissez leurs cellules. Démarrez les actions avec Liste de vérification. Pour des titres plus visibles, sélectionnez-les, touchez Format puis Sous-titre. Le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide d’Apple</a> montre ces commandes. Vous pouvez aussi garder les listes en texte simple.</p>
    <h2 id="suivi">Tenir le planning à jour</h2>
    <p>Dès qu’une réponse arrive, modifiez le rang de la personne : Oui, Non ou En attente, puis le choix de repas. Notez les contraintes alimentaires dans les mots de l’invité et faites préciser ce qui est ambigu. Recomptez les confirmations avant la date de la salle. Le nombre maximal n’est pas le nombre de réponses reçues.</p>
    <p>Gardez l’état de chaque prestataire près de son nom. Un devis reçu n’est pas une réservation. Après une décision, changez l’état et ajoutez la prochaine tâche. Pour les coûts et paiements, utilisez une <a href="/fr/blog/budget-notes-iphone">note de budget</a> séparée.</p>
    <p>Relisez les tâches non cochées à deux chaque semaine. Donnez une personne et une date aux nouvelles tâches, puis changez Dernière revue. Pour modifier la même note iCloud sur iOS 27, touchez Partager, ouvrez le menu sous le titre et touchez « Partager un lien ». Chacun doit avoir un compte Apple avec Notes activé dans iCloud. Apple détaille les <a href="https://support.apple.com/fr-fr/guide/iphone/iphe4d04f674/27/ios/27">droits de partage</a>.</p>
    <h2 id="limites">Ce que la note ne fait pas</h2>
    <p>Ce planning est un registre manuel : pas de formulaire de réponse, de décompte automatique ni de plan de table. Une date écrite dans une tâche ne programme aucune alerte. Créez un rappel séparé pour les échéances importantes.</p>
    <p>Quelques rangs se lisent facilement dans Notes. Pour filtrer une longue liste par repas ou comparer des totaux, utilisez un tableur pour cette partie. Gardez la note pour les décisions et prochaines actions. Le <a href="/blog/apple-notes-tables">guide des tableaux</a> (en anglais) explique leurs limites.</p>
    <h2 id="pinto-notes">Mettre la note à jour avec ChatGPT ou Claude</h2>
    <p>Pinto Notes ressemble à Notes sur iPhone et Mac, avec tableaux et listes. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> (en anglais), l’IA peut lire et modifier les notes. Le bouton Allow donne les deux autorisations.</p>
    <p>Vous pouvez indiquer que Nora a répondu oui et souhaite le repas végétalien, puis demander une tâche pour que Maïa confirme ce choix avec le traiteur avant le 24 novembre. Vérifiez le rang et la tâche avec la réponse reçue. C’est vous qui fournissez l’information.</p>
    <p>Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
