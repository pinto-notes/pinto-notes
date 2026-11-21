import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-integration-salarie-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle intégration nouveau salarié »
// suggère « modèle planning d'intégration nouveau salarié » et « modèle fiche d'intégration nouveau salarié ».
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac,
// /apd0a136b9cc/mac (Format > Tableau), /apd93c815aa0/mac (liste de pointage),
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios et /fr-fr/102296.
// Icônes sans libellé textuel décrites. Faits selon l'original anglais.
const ui = UI.fr;
const TEMPLATE = `Premier mois chez Les Ateliers du Canal

Nom : Maya Chen, conseillère clientèle
Arrivée : 23 novembre 2026. Bilan du premier mois : 18 décembre.
Responsable : Amine Patel. Référent : Léo Martin.

Ce qu'on attend du premier mois
D'ici au bilan, traiter les questions courantes de livraison avec une relecture de Léo.
Savoir quand faire remonter une demande de remboursement. Confirmer ces attentes avec Amine.

Personnes à rencontrer
Personne\tSujet à aborder
Amine Patel, responsable\tPriorités et retours. Point hebdomadaire le vendredi.
Léo Martin, référent\tBrouillons de réponses et questions de livraison. Travail ensemble mardi.
Nour Evans, informatique\tDemandes d'accès via le portail d'assistance.

Outils et pages de référence
Guide d'équipe : intranet, Assistance / Pour commencer.
Guide livraison : intranet, Assistance / Questions de livraison.
Outil de suivi : demande informatique 4821 déposée le 23 novembre. Accès en attente.
Calendrier d'équipe : ouverture vérifiée le 23 novembre.

Questions et réponses
Ouverte, pour Amine : quels remboursements demandent l'accord d'un responsable ? À demander le 27 novembre.
Réponse du 23 novembre, Léo : où sont les exemples de réponses ? Assistance / Exemples de réponses.

Semaine 1, du 23 au 27 novembre
Confirmer avec Amine les attentes du premier mois
Tester l'accès à l'outil après validation de la demande 4821
Lire le guide livraison et observer Léo sur deux demandes

Semaine 2, du 30 novembre au 4 décembre
Rédiger trois réponses sur la livraison pour relecture par Léo
Demander à Amine les règles de remontée des remboursements

Semaine 3, du 7 au 11 décembre
Traiter cinq questions courantes avec relecture par Léo
Noter une étape peu claire dans le guide livraison

Semaine 4, du 14 au 18 décembre
Choisir deux réponses revues pour le bilan du premier mois
Faire le point avec Amine et choisir le prochain objectif d'apprentissage

Journal d'apprentissage
23 novembre : exemples de réponses trouvés avec Léo. Accès à l'outil encore en attente.

Notes pour le bilan du premier mois
18 décembre : apporter les réponses revues et les questions ouvertes.
Après l'entretien : noter ici les retours et le prochain objectif.
`;
const PROMPT = `Lis ma note Pinto Notes « Premier mois chez Les Ateliers du Canal ».
Ajoute cette réponse confirmée dans Questions et réponses :
27 novembre 2026, Amine : toutes les demandes de remboursement sont soumises au responsable de permanence.
Remplace la question ouverte sur les remboursements par cette réponse datée.
Garde les autres questions, l'état des accès et les listes hebdomadaires inchangés.
Liste ensuite les questions sans réponse dans le chat, avec la personne à consulter.
Utilise seulement la note et la réponse ci-dessus. N'invente pas de règle d'entreprise et ne coche aucune formation.
Demande-moi confirmation si le passage à remplacer est ambigu.`;
const FAQ = [
  { q: "Que mettre dans une note d'intégration ?", a: ["Attentes du poste, personnes à rencontrer, accès, pages utiles, questions et tâches par semaine. Gardez un journal et préparez le bilan du premier mois."] },
  { q: "Peut-on y enregistrer les accès ?", a: ["Notez les demandes et leur état, jamais les mots de passe ou codes. Testez chaque outil avec votre compte quand l'accès est accordé."] },
  { q: "Faut-il cocher une tâche prévue mais non faite ?", a: ["Non. Cochez-la après l'avoir faite. Une demande d'accès en attente reste ouverte jusqu'à sa résolution et son test."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-integration-salarie-notes"
  intro={<>Ce modèle d'intégration dans Notes suit les quatre premières semaines d'un nouveau salarié. Attentes, personnes, accès, questions et bilan restent dans la même note.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier le modèle"},{href:"#installer",label:"Le mettre en forme"},{href:"#mois",label:"Suivre le premier mois"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Ajouter une réponse"}]}>
    <p>Le nouvel arrivant garde son propre suivi. L'exemple suit une conseillère clientèle, avec une table de contacts et une liste par semaine.</p>
    <div id="modele"><Keep title="Intégration d'un salarié dans Notes" text={TEMPLATE} note="Copiez la note, puis transformez les personnes en tableau et chaque semaine en liste de pointage." /></div>
    <PostCta slug="fr/modele-integration-salarie-notes" path="/fr/blog/modele-integration-salarie-notes" position="answer" title="Ajouter une réponse confirmée" ui={ui.cta}><p>ChatGPT ou Claude connecté à Pinto peut modifier une réponse dans la note. Vérifiez le changement avant de vous y fier.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Installer le modèle dans Notes</h2>
  <p>Utilisez une note iCloud ou conservée sur l'appareil. Certaines fonctions ne sont pas disponibles avec d'autres comptes.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Sur Mac, collez le texte, appliquez Titre secondaire aux sections et créez un tableau avec les quatre lignes de Personne à Nour. Les tabulations séparent les colonnes. Format, Tableau permet aussi de partir d'un tableau vide ; Tabulation dans la dernière cellule ajoute un rang. Pour chaque semaine, créez une liste de pointage à partir des actions. Voir <a href="/blog/apple-notes-tables">les tableaux dans Notes</a>.</p>
  <p>Sur iPhone, créez une note et utilisez le bouton de tableau pour les personnes. Recopiez les deux colonnes avant de supprimer l'ancien texte. Créez chaque liste de la semaine avec le bouton Liste de tâches et touchez Retour pour l'action suivante. Apple décrit ces commandes dans le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide Notes sur iPhone</a>.</p>
  <h2 id="mois">Garder une trace pendant le premier mois</h2>
  <p>Confirmez les attentes avec Amine. L'accès à l'outil est demandé, pas accordé : testez-le seulement après validation. Gardez les questions ouvertes datées et notez leur réponse avec sa source. Cochez les actions après les avoir faites, puis consignez ce qui a été appris. Pour les échanges plus longs avec votre responsable, voir le <a href="/fr/blog/one-to-one-notes-iphone">modèle de point individuel</a>.</p>
  <p>Au bilan du 18 décembre, apportez les deux réponses revues et les questions encore ouvertes. Inscrivez ensuite les retours et le prochain objectif dans la note.</p>
  <h2 id="limites">Ce que le modèle ne fait pas</h2><p>Il ne donne aucun accès et ne remplace ni la formation ni les procédures de l'employeur. Une case cochée n'atteste pas une validation par le responsable. Gardez les règles officielles dans leur source.</p>
  <h2 id="pinto">Ajouter une réponse confirmée avec une IA</h2>
  <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier vos notes Pinto. Transmettez seulement les données que votre entreprise autorise.</p>
  <Keep title="Mettre à jour une question" text={PROMPT} note="Utilisez une réponse réellement confirmée et contrôlez le passage modifié." />
  <p>Lisez la note après modification. L'état de l'accès et les listes de semaines doivent rester identiques. Pinto peut importer les <a href="/blog/move-from-apple-notes">notes Apple sur Mac</a> sans changer les originaux.</p>
</LocalPostPage>; }
