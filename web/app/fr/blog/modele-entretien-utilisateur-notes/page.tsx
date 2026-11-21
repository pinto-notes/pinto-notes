import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-entretien-utilisateur-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle entretien utilisateur » et
// « guide entretien utilisateur modèle » ne renvoient rien. Titre descriptif ; aucune demande chiffrée supposée.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac,
// /apd93c815aa0/mac, /apd0a136b9cc/mac et https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios,
// https://support.apple.com/fr-fr/102296. Style Titre secondaire, Format > Tableau et Liste de tâches vérifiés.
// Faits selon /blog/apple-notes-user-interview-template ; entretien fictif.
const ui = UI.fr;
const TEMPLATE = `Entretien utilisateur, P07, changement de réservation

Date : 21 novembre 2026, 09:00
Entretien : Marie. Prise de notes : Théo.
Participant : P07, client déjà venu à l'atelier. Exemple fictif.

Objectif
Savoir si un client peut déplacer sa réservation d'atelier sans contacter l'assistance.

Consentement
09:00 : P07 accepte la prise de notes écrites et l'usage de citations anonymes pour la revue interne du produit.
Aucun enregistrement audio ou vidéo. Demander un accord distinct avant tout usage avec une IA.

Questions et notes de réponse
Q1. Racontez la dernière fois que vous avez changé une réservation d'atelier.
Notes : Courriel envoyé au studio, deux jours d'attente, puis réception d'un nouveau billet.

Q2. Votre cours de poterie du samedi tombe pendant votre travail. Montrez comment le déplacer au dimanche.
Notes : Ouverture de Cours, puis Compte. Recherche du lien de réservation, puis ouverture d'Aide. Arrêt sans modification.

Q3. Que pensiez-vous trouver dans Compte ?
Notes : Une liste de billets avec une option pour changer la date à côté de chaque réservation.

Journal des preuves
ID et heure\tObservation ou propos
E1, 09:06\tQ1, citation : « J'ai écrit un mail parce que je ne trouvais pas comment changer la date. »
E2, 09:13\tQ2, observation : ouverture de Cours, Compte, puis Aide. Aucun changement de date effectué.
E3, 09:15\tQ3, citation : « Je m'attendais à trouver ça à côté de mon billet. »

Interprétation à vérifier
P07 pourrait s'attendre à changer la date près du billet dans Compte. Fondé sur E2 et E3.
Cet entretien ne dit pas si les autres clients s'attendent au même parcours.

Questions à reprendre
P07 verrait-il un lien Mes réservations dans Compte ? Faire un autre essai plus tard.
Le changement de date était-il possible pour ce billet ? Vérifier le scénario de test.

Suites à donner
Théo : vérifier les règles du billet test avant le 23 novembre
Marie : ajouter une tâche Mes réservations au guide du prochain entretien avant le 24 novembre
`;
const PROMPT = `Lis ma note Pinto Notes « Entretien utilisateur, P07, changement de réservation ».
Crée une note distincte « Brouillon de constats, P07, changement de réservation ». Ne modifie pas la source.
Utilise seulement cet entretien. Sépare expérience rapportée, gestes observés, citations exactes et interprétations possibles.
Pour chaque constat, cite P07, l'ID de preuve et les numéros de lignes de la note source.
Recopie les citations exactement. Ne transforme pas les notes de réponse en citations.
Liste séparément les questions ouvertes et les suites proposées. N'invente rien et ne généralise pas aux autres participants.
Écarte tout constat sans preuve et indique que la nouvelle note est un brouillon à vérifier.`;
const FAQ = [
  { q: "Que contient une fiche d'entretien utilisateur ?", a: ["L'objectif, l'identifiant du participant, son consentement, les questions, notes de réponse, preuves et suites. Séparez citations, gestes observés et interprétations."] },
  { q: "Comment noter une citation ?", a: ["Donnez-lui un ID et une heure, puis recopiez les mots exacts. Si vous ne les avez pas, écrivez une reformulation sans guillemets."] },
  { q: "Faut-il enregistrer l'entretien ?", a: ["Non. L'exemple repose sur des notes écrites. Notez l'accord obtenu avant de commencer ; le modèle ne donne pas l'autorisation pour votre propre entretien ni pour son partage avec une IA."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-entretien-utilisateur-notes"
  intro={<>Copiez cette fiche d'entretien utilisateur dans Notes, une note par séance. Les réponses restent séparées des citations exactes, des gestes observés et des questions à reprendre.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier la fiche"},{href:"#installer",label:"La mettre en forme"},{href:"#entretien",label:"Pendant l'entretien"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Rédiger les constats"}]}>
    <p>L'exemple suit une personne qui tente de déplacer un cours de poterie. Changez le scénario, les questions et la ligne de consentement avant votre séance.</p>
    <div id="modele"><Keep title="Fiche d'entretien pour Notes" text={TEMPLATE} note="Collez le texte, puis transformez le journal des preuves en tableau et les suites en liste de pointage." /></div>
    <PostCta slug="fr/modele-entretien-utilisateur-notes" path="/fr/blog/modele-entretien-utilisateur-notes" position="answer" title="Préparer des constats à vérifier" ui={ui.cta}><p>Pinto fonctionne comme Notes. ChatGPT ou Claude connecté peut lire l'entretien et créer un brouillon distinct.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Mettre la fiche en forme sur Mac ou iPhone</h2>
  <p>Une note iCloud ou conservée sur l'appareil donne accès aux fonctions décrites par Apple. Gardez les questions et réponses en texte ordinaire.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Sur Mac, collez le texte, appliquez Titre secondaire aux sections et créez une liste de pointage avec les deux suites. Pour les preuves, sélectionnez les quatre lignes de ID à E3, puis utilisez le bouton de tableau. Les tabulations séparent les colonnes. Format, Tableau crée aussi un tableau vide ; Tabulation dans la dernière cellule ajoute un rang. Voir les guides Apple sur la <a href="https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac">mise en forme</a> et les <a href="https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac">tableaux</a>.</p>
  <p>Sur iPhone, touchez Rédiger, collez la fiche et mettez les sections en forme. Créez un tableau à deux colonnes pour les preuves, puis retirez les lignes d'origine. Pour les suites, utilisez le bouton Liste de tâches et touchez Retour entre les éléments. Voir le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide iPhone</a>.</p>
  <h2 id="entretien">Noter chaque réponse et chaque preuve</h2>
  <p>Avant de commencer, remplacez l'objectif, videz les réponses et obtenez le consentement réel de la personne. Pendant l'entretien, notez les réponses sous chaque question. N'utilisez des guillemets que pour les mots exacts et saisissez vous-même l'heure.</p>
  <p>E2 décrit les écrans ouverts et l'arrêt du parcours. Dire que P07 était perdu serait une interprétation ; gardez cette idée dans la section prévue, avec sa preuve. Après la séance, laissez les détails inconnus visibles. L'emplacement du lien de réservation reste à tester ; les règles du billet aussi.</p>
  <p>Attribuez une personne et une date à chaque suite, puis cochez-la après exécution. Copiez une fiche vierge pour la séance suivante et gardez l'original comme source. Voir les <a href="/blog/apple-notes-templates">autres modèles Notes</a>.</p>
  <h2 id="limites">Ce que la fiche ne vérifie pas</h2><p>Elle ne récupère pas une citation manquée, ne vérifie pas le consentement et ne prouve pas qu'une interprétation est juste. Un entretien ne suffit pas à décrire un comportement commun ; comparez plusieurs séances avant de conclure.</p>
  <h2 id="pinto">Faire un brouillon distinct avec une IA</h2>
  <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier vos notes Pinto. Pour un vrai entretien, vérifiez d'abord que l'accord du participant et les règles de votre organisation autorisent ce partage.</p>
  <Keep title="Demander un brouillon de constats" text={PROMPT} note="Enregistrez d'abord la fiche fictive dans Pinto. Pour vos données, remplacez les titres et l'identifiant." />
  <p>Vérifiez chaque ligne citée. Le courriel de Q1 est une expérience rapportée, E2 une observation et E3 une attente citée. Retirez les constats sans preuve et relisez chaque citation. Pinto importe les <a href="/blog/move-from-apple-notes">notes Apple sur Mac</a> sans modifier les originaux.</p>
</LocalPostPage>; }
