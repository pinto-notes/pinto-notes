import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-clients-notes-iphone");

// Version française de /blog/apple-notes-client-tracker-template, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « fiche suivi client modele » donne « modele fiche suivi client »
// et « modele de fiche suivi client gratuit » ; la demande propre à Notes n'est pas établie.
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac
// (Format > Tableau, conversion de texte, Tabulation), /guide/notes/apd93c815aa0/mac (Liste de pointage),
// /guide/iphone/iph1ac0b3a2/ios (Liste de vérification, Ajouter un tableau),
// /guide/notes/apde615d29c2/mac et /guide/iphone/iph908d1558b/ios (Ajouter un lien).
// Entreprise et contacts fictifs situés en France. Aucune image dans l'original.
const ui = UI.fr;
const TEMPLATE = `Atelier des Quais

Contact
Marie Dupont, gérante
marie@atelierdesquais.example
Préfère les e-mails. Disponible par téléphone le mardi après-midi.

Notre travail
Textes du site pour la collection d’hiver.
Marie valide les textes. Léo fournit les photos des produits.

Situation actuelle
Premier brouillon envoyé le 18 novembre 2026.
En attente des commentaires de Marie avant de revoir les pages produits.
Dernier échange : 20 novembre 2026, e-mail de Marie.
Prochaine relance : 24 novembre 2026 si aucun commentaire n’est arrivé.

Prochaines actions
Demander ses commentaires à Marie le 24 novembre
Confirmer la date d’envoi des photos des émaux avec Léo

Journal des échanges
20 novembre 2026 : Marie pense relire le brouillon lundi.
18 novembre 2026 : premier brouillon envoyé. Deux photos d’émaux manquent encore.

À garder en tête
Employer l’orthographe française. Laisser les conseils d’entretien sur chaque page produit.

Notes associées
Atelier des Quais, réunion de lancement, 12 novembre 2026
`;
const INDEX = `Clients

Client\tDernier échange\tProchaine relance
Atelier des Quais\t20 nov. 2026\t24 nov., commentaires sur le brouillon
Studio Bouleau\t19 nov. 2026\t25 nov., disponibilités de janvier
`;
const FAQ = [
  { q: "Peut-on suivre ses clients dans Notes ?", a: ["Oui. Gardez une note par client avec ses coordonnées, le travail en cours, le dernier échange et la prochaine relance. Un tableau distinct regroupe les dates et les liens vers ces notes."] },
  { q: "Que noter entre deux rendez-vous ?", a: ["La situation actuelle, la date du dernier échange et la prochaine action précise. Ajoutez une courte ligne datée après chaque contact. Les détails de réunion restent dans des notes séparées."] },
  { q: "La date de relance envoie-t-elle une alerte ?", a: ["Non. C’est du texte. Créez un rappel séparé pour une échéance importante et relisez le tableau d’index vous-même."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="suivi-clients-notes-iphone"
    intro="Ce modèle de suivi des clients garde une note par personne et un tableau séparé pour les dates de relance. Copiez les exemples remplis, puis remplacez leurs données."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "La fiche client" }, { href: "#index", label: "Le tableau d’index" },
      { href: "#suivi", label: "Tenir le suivi" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Avec une IA" },
    ]}><p>Pour chaque client, notez les coordonnées, le contexte, un journal daté et la prochaine relance. Dans un tableau d’index, reliez chaque fiche et affichez les dates. La mise à jour reste manuelle.</p>
      <PostCta slug="fr/suivi-clients-notes-iphone" path="/fr/blog/suivi-clients-notes-iphone" position="answer" ui={ui.cta} title="Relire l’historique avant une relance"><p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut lire les fiches et mettre à jour la prochaine action avec les informations que vous lui donnez.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modele">Une note par client</h2>
    <p>Dans cet exemple, une rédactrice indépendante attend les commentaires de sa cliente. Les préférences de contact sont en haut. La situation actuelle évite de relire tous les échanges avant d’agir.</p>
    <Keep title="Fiche client pour Notes" text={TEMPLATE} copyLabel={ui.copy} note="Collez le texte. Transformez les deux lignes sous Prochaines actions en liste à cocher." />
    <p>Sur Mac, sélectionnez les deux actions et cliquez sur Liste de pointage. Sur iPhone, placez le curseur sous Prochaines actions, touchez Liste de vérification et saisissez chaque tâche. Gardez le journal sous forme de lignes datées. Apple décrit les <a href="https://support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac">listes sur Mac</a> et la <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">mise en forme sur iPhone</a>.</p>
    <p>Pour un autre client, copiez la structure dans une nouvelle note et remplacez tous les détails. Notez ce qui a été convenu et ce que vous attendez. Un fil d’e-mails entier n’aide pas à trouver la prochaine action.</p>
    <h2 id="index">Les dates et les liens dans un index</h2>
    <p>Gardez une note Clients. Chaque rang renvoie à une fiche. La dernière colonne contient une relance courte ; la fiche garde son contexte. Les dates correspondent à l’exemple de l’Atelier des Quais.</p>
    <Keep title="Index des clients pour Notes" text={INDEX} copyLabel={ui.copy} note="Une tabulation sépare les colonnes. Sur Mac, collez les lignes et transformez-les en tableau." />
    <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Tableau"] }, { on: "Mac", steps: ["Édition", "Ajouter un lien"] }]} />
    <p>Sur Mac, sélectionnez les trois lignes de Client à Studio Bouleau et cliquez sur Tableau. Chaque tabulation devient une colonne. Tabulation dans la dernière cellule ajoute un rang. Sur iPhone, créez un tableau avec Ajouter un tableau et remplissez les cellules. Consultez le <a href="/blog/apple-notes-tables">guide des tableaux</a> (en anglais).</p>
    <p>Transformez chaque nom en lien. Sur Mac, choisissez Édition, Ajouter un lien, tapez le titre de la fiche, sélectionnez-la et cliquez sur OK. Sur iPhone, sélectionnez le nom, touchez Suivant, puis Ajouter un lien, choisissez la fiche et validez. Les étapes figurent dans les guides d’Apple pour <a href="https://support.apple.com/fr-fr/guide/notes/apde615d29c2/mac">Mac</a> et <a href="https://support.apple.com/fr-fr/guide/iphone/iph908d1558b/ios">iPhone</a>.</p>
    <h2 id="suivi">Tenir la fiche à jour</h2>
    <p>Après chaque appel ou e-mail, ajoutez une ligne datée au journal. Réécrivez Situation actuelle si l’accord change. Cochez une action terminée, datez la suivante et mettez l’index à jour au même moment.</p>
    <p>Avant un appel, relisez Situation actuelle et À garder en tête. Pour un ordre du jour ou des décisions détaillées, créez un <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de réunion</a> et liez-le sous Notes associées.</p>
    <h2 id="limites">Ce que ce suivi ne fait pas</h2>
    <p>L’index et les fiches sont séparés. Changer une date dans l’un ne change pas l’autre. Une relance écrite ne programme aucune alerte ; créez un rappel à part.</p>
    <p>Ce modèle ne journalise pas les e-mails, ne consulte pas vos contacts et ne calcule pas de prévisions de vente. Pour un pipeline partagé avec responsables et relances automatiques, il faut un CRM.</p>
    <h2 id="pinto-notes">Utiliser ces fiches avec ChatGPT ou Claude</h2>
    <p>Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac. Il propose tableaux, listes et liens entre notes. Créez les fiches, puis <a href="/blog/connect-chatgpt-to-your-notes">connectez ChatGPT ou Claude</a> (en anglais) pour lui permettre de les lire et de les modifier.</p>
    <p>Avant de répondre à Marie, demandez ce que l’Atelier des Quais attend et ce qu’elle a dit sur le calendrier. Faites rédiger un court e-mail de relance à partir de la fiche, puis vérifiez-le. Après sa réponse, donnez les nouveaux détails à l’IA et demandez-lui de mettre à jour la fiche et l’index. Rien ne se relance automatiquement.</p>
    <p>Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
