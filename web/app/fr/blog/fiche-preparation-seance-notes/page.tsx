import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "fiche-preparation-seance-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle fiche de préparation de séance »
// suggère « modèle fiche de préparation de séance » et « exemple fiche de préparation de séance cycle 3 ».
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac
// (Format > Tableau), /apd93c815aa0/mac (liste de pointage), /apd1955d3b21/mac (Titre secondaire),
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios et /fr-fr/102296.
// Boutons sans libellé textuel décrits. Exemple français de CM2, pas d'alignement officiel allégué.
const ui = UI.fr;
const TEMPLATE = `Comparer des fractions, 20 novembre 2026
Séance de mathématiques de 40 minutes, CM2. Élève fictif de 10 ans.

Objectif
Comparer deux fractions de dénominateurs différents et justifier avec des unités de même taille.

Vérification des acquis
Demander : quelle fraction est la plus grande, 1/4 ou 3/4 ? Dessiner deux rectangles identiques.
Si les quarts posent problème, reprendre d'abord le partage en parts égales.

Matériel
Bandes de fractions découpées dans des feuilles de même format
Crayon et papier quadrillé
Quatre comparaisons avec réponses vérifiées avant la séance

Déroulé minuté
Minutes\tActivité
0 à 5\tRevoir les quarts et demander une explication.
5 à 12\tComparer 1/2 et 2/3 avec les bandes. Garder la même unité.
12 à 20\tReprésenter la comparaison en sixièmes sur papier, puis résoudre ensemble.
20 à 30\tComparer 1/3 et 1/2, 2/5 et 3/5, 3/5 et 2/3, puis 3/4 et 5/6. Demander un dessin ou des fractions équivalentes.
30 à 36\tDiscuter une réponse. Si besoin, revenir aux bandes et réduire le nombre de questions.
36 à 40\tPoser la question finale sans aide et noter l'explication.

Exemple résolu
Quelle fraction est la plus grande, 1/2 ou 2/3 ?
1/2 = 3/6 et 2/3 = 4/6, donc 2/3 est plus grande.
Les sixièmes doivent se rapporter à une unité de même taille.
Réponses des exercices, fraction la plus grande dans chaque paire : 1/2, 3/5, 2/3, 5/6.

Vérification de la compréhension
Question finale : quelle fraction est la plus grande, 2/3 ou 3/4 ? Justifier sans les bandes.
Réponse enseignante : 2/3 = 8/12 et 3/4 = 9/12, donc 3/4 est plus grande.
Écouter si l'explication parle de parts de même taille, et pas seulement du dénominateur le plus grand.

Après la séance
20 novembre : comparaison des demis et des tiers réussie avec les bandes sans aide.
Sur papier, l'élève a choisi 3/4 à la question finale sans pouvoir expliquer pourquoi.
Séance suivante : commencer par dessiner les deux fractions en douzièmes avant d'autres comparaisons.
`;
const PROMPT = `Lis ma fiche Pinto Notes « Comparer des fractions, 20 novembre 2026 ».
À partir de la section Après la séance, prépare une fiche distincte de 40 minutes pour le 27 novembre.
Garde la fiche d'origine et les observations intactes.
Commence par représenter 2/3 et 3/4 en douzièmes de rectangles de même taille.
Ajoute un objectif, le matériel, des étapes minutées, un exemple résolu et une question finale avec réponse enseignante.
La durée totale doit rester 40 minutes. N'invente pas de résultat d'élève ni d'alignement avec un programme.
Montre d'abord le brouillon dans le chat. Demande les informations manquantes avant de créer une note.`;
const FAQ = [
  { q: "Que mettre dans une fiche de préparation de séance ?", a: ["Objectif, vérification des acquis, matériel, étapes minutées, exemple résolu, question finale et observations après la séance."] },
  { q: "Peut-on cocher le matériel dans Notes ?", a: ["Oui. Sur Mac, sélectionnez les lignes et créez une liste de pointage. Sur iPhone, utilisez le bouton Liste de tâches et touchez Retour pour l'élément suivant."] },
  { q: "Comment réutiliser la fiche ?", a: ["Copiez-la dans une nouvelle note, changez date, objectif et exemples, puis videz les anciennes observations. Gardez la fiche terminée comme trace."] },
  { q: "Les horaires déclenchent-ils un minuteur ?", a: ["Non. Ce sont des plages écrites. Utilisez une horloge séparée et adaptez la séance selon les réponses de l'élève."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="fiche-preparation-seance-notes"
  intro={<>Cette fiche de préparation de séance dans Notes place l'objectif avant le matériel et le déroulé minuté. L'exemple de mathématiques en CM2 se termine par une question et des observations.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier la fiche"},{href:"#installer",label:"La mettre en forme"},{href:"#enseigner",label:"Pendant la séance"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Préparer la suivante"}]}>
    <p>Une note par séance, avec un objectif précis et une activité pour chaque plage de temps. Remplacez les nombres et les questions selon votre classe.</p>
    <div id="modele"><Keep title="Fiche de préparation pour Notes" text={TEMPLATE} note="Transformez le matériel en liste de pointage et le déroulé en tableau à deux colonnes." /></div>
    <PostCta slug="fr/fiche-preparation-seance-notes" path="/fr/blog/fiche-preparation-seance-notes" position="answer" title="Préparer la séance suivante" ui={ui.cta}><p>Dans Pinto, ChatGPT ou Claude connecté peut lire vos observations et proposer un brouillon de nouvelle séance à vérifier.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Installer la fiche dans Notes</h2>
  <p>Utilisez une note iCloud ou conservée sur l'appareil. Apple signale que certaines fonctions manquent avec d'autres fournisseurs.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Sur Mac, collez la fiche et mettez les intitulés en Titre secondaire. Sélectionnez les lignes de Minutes à la dernière activité pour en faire un tableau. Les tabulations délimitent les colonnes. Format, Tableau crée un tableau vide si vous préférez remplir les cellules. Sélectionnez le matériel pour en faire une liste de pointage. Voir <a href="/blog/apple-notes-tables">les tableaux dans Notes</a>.</p>
  <p>Sur iPhone, touchez Rédiger, collez la fiche, puis ajoutez un tableau pour les étapes. Recopiez les deux colonnes et supprimez le texte d'origine après contrôle. Créez la liste du matériel avec le bouton Liste de tâches. Apple décrit ces commandes dans ses guides <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">Notes sur iPhone</a> et <a href="https://support.apple.com/fr-fr/102296">listes</a>. Pour d'autres présentations, voir les <a href="/blog/apple-notes-templates">modèles Notes</a>.</p>
  <h2 id="enseigner">Utiliser la fiche en classe</h2>
  <p>Avant la séance, vérifiez les réponses et préparez les bandes. Si les quarts ne sont pas compris, reprenez le partage avant les comparaisons. Les durées servent de repères ; ajustez-les selon le travail réel. Après la question finale, notez ce que l'élève a expliqué, pas seulement sa réponse.</p>
  <p>Dans l'exemple, le choix de 3/4 est correct mais l'explication manque. La séance suivante commence donc par un dessin en douzièmes. Pour les notes personnelles d'un élève, voir la <a href="/fr/blog/methode-cornell-notes-iphone">méthode Cornell</a>.</p>
  <h2 id="limites">Ce que la fiche ne fait pas</h2><p>Les plages horaires ne lancent aucun minuteur et la fiche n'évalue pas l'élève automatiquement. Une proposition de l'IA doit être contrôlée par l'enseignant. Ce modèle ne prétend pas reproduire un programme officiel.</p>
  <h2 id="pinto">Préparer la séance suivante avec une IA</h2>
  <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier vos notes Pinto. Demandez un brouillon distinct basé sur vos observations.</p>
  <Keep title="Demander une nouvelle fiche" text={PROMPT} note="Relisez les calculs, le déroulé et les observations avant d'utiliser le brouillon." />
  <p>Pinto importe les <a href="/blog/move-from-apple-notes">notes Apple sur Mac</a> en une fois sans changer les originaux.</p>
</LocalPostPage>; }
