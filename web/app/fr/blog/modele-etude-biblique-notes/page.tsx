import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-etude-biblique-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle étude biblique notes » renvoie seulement
// « template for bible study notes » ; « étude biblique modèle de notes » ne renvoie rien. Titre descriptif.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac
// (style « Titre secondaire »), /apd93c815aa0/mac (liste de pointage), /apd0a136b9cc/mac
// (Format > Tableau), /not9474646a9/mac (copier une note), et
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios (mise en forme et tableau),
// https://support.apple.com/fr-fr/102296 (bouton Liste de tâches). Icônes sans nom textuel décrites.
// Faits selon /blog/apple-notes-bible-study-template. Pas de verset cité, référence seule.
const ui = UI.fr;
const TEMPLATE = `Étude biblique : Jacques 1,19-25, 21 novembre 2026

Passage
Jacques 1,19-25
Traduction : Louis Segond 1910
Extrait : Jacques 1,22 (lire dans votre Bible, sans recopier ici)

Observations
Le verset 19 place l'écoute avant la parole et met en garde contre la colère.
Les versets 23-24 comparent l'auditeur oublieux à une personne qui regarde un miroir, puis oublie ce qu'elle a vu.

Questions
Quel lien l'image du miroir établit-elle entre écouter et agir ?
Que signifie la persévérance au verset 25 ?

Renvois
Référence\tLien à examiner
Luc 6,46-49\tComparer l'écoute et l'action avec Jacques 1,22.
Proverbes 15,1\tComparer la parole et la colère avec Jacques 1,19.

Mise en pratique
Ce soir à dîner, laisser Camille finir sa phrase avant de répondre.
Demain, noter un moment où j'ai écouté ou interrompu.

Prière
Dieu, aide-moi à écouter avec patience et à mettre en pratique ce que j'apprends. Amen.
`;
const PROMPT = `Lis ma note Pinto Notes « Étude biblique : Jacques 1,19-25, 21 novembre 2026 ».
Cherche dans mes autres études des questions sur l'écoute, la parole ou le passage à l'action.
Dans le chat, recopie toute question trouvée exactement, avec le titre et la date de sa note source.
Si tu n'en trouves pas, dis-le. N'invente ni note ni réponse. Ne modifie rien pendant ma lecture.
Après mon choix, ajoute seulement cette question et sa source dans la section Questions.
Garde le passage, les observations, la mise en pratique et la prière intacts.
Si tu proposes une interprétation, nomme-la « Interprétation à vérifier » dans le chat, séparément du texte biblique.`;
const FAQ = [
  { q: "Que mettre dans une note d'étude biblique ?", a: ["La référence du passage et sa traduction, puis vos observations, questions, renvois, mise en pratique et prière. Séparez tout extrait biblique de vos propres mots."] },
  { q: "Peut-on faire un tableau de renvois dans Notes ?", a: ["Oui. Utilisez deux colonnes, la référence et le lien à examiner. Sur Mac, choisissez Format, Tableau. Lisez chaque passage dans son contexte."] },
  { q: "À quoi sert la liste de pointage ?", a: ["Elle sert à suivre une action concrète, comme relire un passage. Une coche ne mesure ni la compréhension ni la foi."] },
  { q: "Peut-on réutiliser cette présentation ?", a: ["Oui. Sur Mac, copiez la note, changez le passage et la date, puis remplacez les réponses. Gardez l'étude précédente."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-etude-biblique-notes"
  intro={<>Copiez ce modèle d'étude biblique dans Notes, une note par passage. L'exemple sur Jacques 1,19-25 sépare observations, questions, renvois, mise en pratique et prière.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier le modèle"},{href:"#installer",label:"Le mettre en forme"},{href:"#etudier",label:"Étudier un passage"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Retrouver les questions"}]}>
    <p>Gardez la référence et la traduction au-dessus de vos notes. Le texte ci-dessous fonctionne sans mise en forme. Dans Notes, vous pouvez transformer les renvois en tableau et les actions en liste de pointage.</p>
    <div id="modele"><Keep title="Modèle d'étude biblique pour Notes" text={TEMPLATE} note="Copiez-le dans une note, puis remplacez le passage et les réponses de l'exemple." /></div>
    <PostCta slug="fr/modele-etude-biblique-notes" path="/fr/blog/modele-etude-biblique-notes" position="answer" title="Retrouver des questions anciennes" ui={ui.cta}><p>Pinto fonctionne comme Notes sur Mac et iPhone. ChatGPT ou Claude connecté peut chercher vos anciennes questions dans vos notes.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Mettre la note en forme</h2>
  <p>Utilisez une note iCloud ou conservée sur l'appareil. Apple précise que certaines fonctions ne sont pas disponibles avec d'autres fournisseurs de comptes.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Sur Mac, collez le texte dans une note. Placez le curseur sur un intitulé, ouvrez la mise en forme et choisissez Titre secondaire. Sélectionnez les deux actions et utilisez le bouton de liste de pointage. Pour les renvois, sélectionnez les lignes et utilisez le bouton de tableau. Les tabulations séparent les colonnes. Vous pouvez aussi créer un tableau vide avec Format, Tableau ; il commence avec deux rangs et deux colonnes. Tabulation dans la dernière cellule ajoute un rang. Voir <a href="/blog/apple-notes-tables">les tableaux dans Notes</a>.</p>
  <p>Sur iPhone, touchez le bouton Rédiger, collez le texte et mettez les intitulés en forme. Créez la liste d'actions avec le bouton Liste de tâches, puis touchez Retour pour ajouter un élément. Ajoutez un tableau à l'emplacement des renvois et recopiez les deux colonnes. Supprimez les anciennes lignes une fois le tableau vérifié. Apple décrit ces <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">commandes sur iPhone</a>.</p>
  <h2 id="etudier">Étudier le passage suivant</h2>
  <p>Changez la référence et nommez la traduction que vous lisez. L'exemple indique la traduction Louis Segond 1910 sans recopier de verset. Si vous ajoutez un extrait, notez son numéro et distinguez-le de vos observations. Lisez le passage entier avant d'écrire ce que vous y remarquez.</p>
  <p>Dans le tableau, écrivez pourquoi vous comparez chaque référence et lisez les versets voisins. Si vous consultez un commentaire, notez son titre, sa page ou son lien. Gardez vos interprétations sous vos questions, avec le verset qui les motive.</p>
  <p>La mise en pratique est personnelle. Après une action, cochez-la et ajoutez une phrase datée. Sur Mac, vous pouvez copier la note pour une autre étude, changer la date et vider les réponses. Le <a href="/blog/apple-notes-templates">guide des modèles Notes</a> propose d'autres présentations.</p>
  <h2 id="limites">Ce que cette note ne fait pas</h2><p>Elle ne recherche pas les versets et ne vérifie pas une citation. Lisez les renvois dans votre Bible et laissez une question ouverte si le contexte manque.</p>
  <h2 id="pinto">Retrouver les questions anciennes</h2>
  <p>Vous pouvez utiliser cette note dans Pinto, qui propose titres, listes de pointage et tableaux. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier vos notes.</p>
  <Keep title="Chercher des questions dans ses notes" text={PROMPT} note="Adaptez le titre et le sujet. Il faut déjà avoir d'autres notes pour trouver des correspondances." />
  <p>Vérifiez chaque question dans la note source, puis contrôlez la modification. Une interprétation suggérée doit être relue à la lumière du passage. Pinto peut importer vos <a href="/blog/move-from-apple-notes">notes Apple</a> en une fois sur Mac sans changer les originaux.</p>
</LocalPostPage>; }
