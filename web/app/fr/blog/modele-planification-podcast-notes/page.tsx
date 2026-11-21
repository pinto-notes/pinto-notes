import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-planification-podcast-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle planification podcast »,
// « modèle épisode podcast » et « plan épisode podcast modèle » ne donnent pas de suggestion.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac,
// /apd0a136b9cc/mac (Format > Tableau), /apd93c815aa0/mac (liste de pointage),
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios et /fr-fr/102296.
// Icônes sans nom textuel décrites. Faits selon /blog/apple-notes-podcast-planner-template.
const ui = UI.fr;
const TEMPLATE = `L'atelier des réparations 12 : première visite au Repair Café

Étape : préparation
Prochaine action : Béa envoie les questions à Mina et confirme l'accord pour enregistrer et publier.
Enregistrement : 24 novembre 2026, 10:00, heure de Paris
Durée visée : 18 minutes

Promesse aux auditeurs
Aider une personne qui vient pour la première fois à savoir quoi apporter et à quoi s'attendre.

Invitée et contexte
Mina Patel, coordinatrice bénévole d'un Repair Café fictif à Lyon.
Prononciation du nom : vérifier avant l'enregistrement.
Autorisation d'enregistrer et de publier : en attente.
Échange préparatoire du 20 novembre : les visiteurs réservent un créneau et apportent un objet.
Lien public de réservation : le demander à Mina et le vérifier avant publication.

Phrase d'ouverture
Vous avez une veste déchirée et une réservation au Repair Café. Que se passe-t-il à votre arrivée ?

Déroulé, durées approximatives
1 minute : ouverture et présentation de l'invitée.
4 minutes : réserver un créneau et choisir quoi apporter.
6 minutes : suivre une veste déchirée pendant une visite, avec un récit de Mina.
5 minutes : que faire si les bénévoles ne peuvent pas terminer la réparation ?
2 minutes : résumé et premier geste avant sa visite.

Questions à l'invitée
Que doit indiquer une personne lors de sa réservation ?
Que se passe-t-il entre l'arrivée avec une veste et l'installation avec un bénévole ?
Pouvez-vous raconter une visite où l'objet n'a pas pu être réparé le jour même ?
Que faut-il vérifier auprès de son Repair Café avant de venir ?

Avant l'enregistrement
Confirmer le nom, le rôle et l'autorisation d'enregistrer et de publier de Mina.
Envoyer le déroulé et demander les sujets à éviter.
Faire un court essai dans l'app d'enregistrement et le réécouter.

Brouillon de présentation, à revoir après montage
Titre provisoire : première visite au Repair Café, avec Mina Patel.
Description : conversation sur la réservation et l'objet à apporter pour une réparation.
Crédit invitée : Mina Patel, coordinatrice bénévole du Repair Café de Lyon.
Liens à ajouter : page de réservation vérifiée et conseils aux visiteurs.
Repères de chapitres : à relever sur le son monté final, si utilisés.

Vérifications avant publication
Écouter tout le son monté dans l'app audio.
Vérifier le crédit de l'invitée, les autorisations et toute citation.
Revoir la description et chaque lien public.
Téléverser le son final et la présentation chez l'hébergeur du podcast.
Contrôler l'épisode en ligne et noter ici son lien public.
`;
const PIPELINE = `L'atelier des réparations, suivi des épisodes

Épisode\tÉtape et prochaine action
11 : réparer un sac à dos\tMontage. Alex retire l'introduction répétée.
12 : première visite au Repair Café\tPréparation. Béa envoie les questions et confirme l'autorisation de Mina.
13 : entretenir des outils empruntés\tIdée. Romain cherche une personne qui gère une outilthèque.
`;
const PROMPT = `Lis ma note d'épisode Pinto Notes « L'atelier des réparations 12 : première visite au Repair Café ».
À partir de la seule section Invitée et contexte, propose deux questions de relance pour une première visite.
Montre-les d'abord dans le chat. Demande ce qui manque ; n'invente ni histoire de l'invitée ni règle de réservation.
Après mon accord sur les mots, ajoute les questions dans Questions à l'invitée.
Garde les durées et l'état de l'autorisation intacts. Laisse les vérifications avant publication décochées.`;
const FAQ = [
  { q: "Que contient un plan d'épisode de podcast ?", a: ["L'étape et la prochaine action, le public visé, l'invité, le déroulé minuté, les questions, les vérifications d'enregistrement, la présentation et la liste avant publication."] },
  { q: "Faut-il écrire tout le texte à dire ?", a: ["Pour un entretien, une ouverture, des questions et des durées peuvent suffire. Un épisode scénarisé peut demander un script séparé."] },
  { q: "Les durées prévues sont-elles les chapitres finaux ?", a: ["Non. Relevez les chapitres sur le son monté ; réponses et coupes changent leurs heures de début."] },
  { q: "Cocher la liste publie-t-il l'épisode ?", a: ["Non. Téléversez le son et la présentation chez votre hébergeur, puis vérifiez l'épisode public avant de cocher le dernier point."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-planification-podcast-notes"
  intro={<>Copiez ce modèle de planification de podcast dans Notes, une note par épisode. Les questions et le déroulé côtoient le brouillon de présentation et la liste avant publication.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier le plan"},{href:"#installer",label:"Le mettre en forme"},{href:"#suivi",label:"Suivre les épisodes"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Préparer des questions"}]}>
    <p>L'étape et la prochaine action restent en haut. L'exemple fictif prévoit un entretien de 18 minutes ; remplacez l'émission et l'invitée par les vôtres.</p>
    <div id="modele"><Keep title="Plan d'épisode pour Notes" text={TEMPLATE} note="Copiez la note et adaptez tous les détails fictifs." /></div>
    <PostCta slug="fr/modele-planification-podcast-notes" path="/fr/blog/modele-planification-podcast-notes" position="answer" title="Préparer les questions de l'invité" ui={ui.cta}><p>Dans Pinto, ChatGPT ou Claude connecté peut lire la note et proposer des relances à vérifier avant de les ajouter.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Préparer la note sur Mac ou iPhone</h2>
  <p>Collez le texte dans une note iCloud ou conservée sur l'appareil. Certaines fonctions Notes ne sont pas disponibles avec d'autres fournisseurs de comptes.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Appliquez Titre secondaire aux sections. Sur Mac, sélectionnez les lignes Avant l'enregistrement et Vérifications avant publication pour créer des listes de pointage. Sur iPhone, utilisez le bouton Liste de tâches et touchez Retour entre les éléments. Cochez les vérifications seulement après les avoir faites. Voir le <a href="https://support.apple.com/fr-fr/102296">guide Apple des listes</a>.</p>
  <h2 id="suivi">Suivre plusieurs épisodes</h2>
  <p>Gardez une note courte pour l'état et la prochaine action de chaque épisode. Copiez ce tableau fictif, puis adaptez-le :</p>
  <Keep title="Suivi des épisodes" text={PIPELINE} note="Sur Mac, sélectionnez les lignes tabulées pour en faire un tableau. Sur iPhone, créez deux colonnes et recopiez-les." />
  <p>Sur Mac, Format, Tableau permet aussi de partir de deux rangs et deux colonnes. Tabulation dans la dernière cellule ajoute un rang. Voir <a href="/blog/apple-notes-tables">le guide des tableaux</a>. Sur iPhone, créez le tableau avec le bouton de tableau, puis effacez les anciennes lignes après comparaison.</p>
  <p>Le plan sert pendant l'enregistrement, puis la présentation doit être corrigée à partir du son monté. Les repères de chapitres viennent du fichier final. Pour réutiliser la trame, voyez les <a href="/blog/apple-notes-templates">modèles Notes</a>.</p>
  <h2 id="limites">Ce que ce plan ne fait pas</h2><p>Notes n'enregistre ni ne monte l'épisode à votre place. Les minutes sont estimées, les autorisations doivent être obtenues et la publication se fait chez votre hébergeur.</p>
  <h2 id="pinto">Préparer des questions avec une IA</h2>
  <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier la note Pinto. Faites d'abord examiner les questions dans le chat.</p>
  <Keep title="Demander deux questions de relance" text={PROMPT} note="Gardez les durées et l'état de l'autorisation pendant la modification." />
  <p>Vérifiez les questions ajoutées et ne supposez pas que l'accord de publication a été obtenu. Pinto peut importer vos <a href="/blog/move-from-apple-notes">notes Apple sur Mac</a> sans changer les originaux.</p>
</LocalPostPage>; }
