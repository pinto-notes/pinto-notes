import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-objectif-notes-iphone");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle objectifs » propose « template objectifs notion », mais « modèle objectif notes iphone » ne renvoie rien. Le titre associe les mots français « modèle », « objectif » et « Notes sur iPhone » sans prétendre à un volume de recherche.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (listes), https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (tableaux), https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac (format), https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios (Nouvelle note, Format, Liste de vérification, Ajouter un tableau). Les pages Mac ont renvoyé 429 dans le lecteur ; les gestes sont décrits sans attribuer de nom incertain au bouton. Aucun menu Markdown n'est nommé. Faits suivis de /blog/apple-notes-goal-template.

const ui = UI.fr;
const TEMPLATE = `Terminer la nouvelle La dernière traversée

Résultat attendu
Terminer une nouvelle avec une fin pour le 18 décembre 2026.

Point de départ
14 novembre : 1 800 mots. La scène d'ouverture est écrite ; la fin reste à définir.

Objectif
Environ 6 000 mots, toutes les scènes écrites, sans passage manquant.
Le brouillon complet comprend chaque scène et une fin.

Preuves
Date\tChangement et source à vérifier
14 novembre\t1 800 mots. Fichier : La dernière traversée, 14 nov.
21 novembre\t2 700 mots. Scène de la gare ajoutée, fin esquissée. Fichier : La dernière traversée, 21 nov.

Étapes
29 novembre : atteindre 3 000 mots et terminer la scène centrale
13 décembre : atteindre environ 6 000 mots et écrire la fin
18 décembre : relire tout le brouillon et compléter les passages manquants

Prochaine action
Écrire la conversation à la gare avant le départ du train.

Prochain bilan
29 novembre 2026. Comparer le dernier brouillon au point de départ.
Vérifier la scène centrale, puis choisir l'action suivante.
`;
const PROMPT = `Lis ma note Pinto Notes « Terminer la nouvelle La dernière traversée ».
Ajoute cette preuve au 28 novembre 2026 : le brouillon compte 3 200 mots et la scène centrale est terminée. Source : mon fichier « La dernière traversée, 28 nov. ».
Coche l'étape du 29 novembre si cette preuve suffit.
Conserve le point de départ, le résultat attendu, l'objectif et toutes les preuves précédentes.
Fixe le prochain bilan au 6 décembre 2026.
Propose une seule prochaine action ici, dans la conversation. Si un détail manque, demande-le. N'invente ni progrès ni lien vers une source.`;
const FAQ = [
  { q: "Que mettre dans un modèle d'objectif pour Notes ?", a: ["Un résultat, un point de départ daté, une cible, des preuves de progrès, des étapes et une date de bilan. Ajoutez une prochaine action concrète."] },
  { q: "Faut-il réunir tous ses objectifs dans une note ?", a: ["Une note par objectif de plusieurs semaines permet de garder ses étapes, ses preuves et les raisons d'un changement de cible ensemble."] },
  { q: "La date du bilan crée-t-elle une alerte ?", a: ["Non. Elle reste du texte. Créez un rappel séparé si vous avez besoin d'une notification."] },
  { q: "Quelle différence avec un suivi d'habitudes ?", a: ["Un objectif suit un résultat et ses preuves. Le suivi d'habitudes note des gestes répétés. Écrire chaque matin est une habitude ; finir la nouvelle est un objectif."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="modele-objectif-notes-iphone"
    intro={<>Copiez ce modèle d'objectif dans une note par résultat visé. Le point de départ, les étapes, les preuves datées et la prochaine date de bilan restent au même endroit.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modele", label: "Copier le modèle" }, { href: "#preparer", label: "Mettre en forme" }, { href: "#bilan", label: "Faire le bilan" }, { href: "#limites", label: "Les limites" }, { href: "#pinto", label: "Mettre à jour avec une IA" }]}>
      <p>Pour un objectif de plusieurs semaines, notez une cible vérifiable et gardez les preuves à côté. Cet exemple suit le brouillon d'une nouvelle. Les étapes peuvent devenir des cases à cocher et les preuves un tableau.</p>
      <div id="modele"><Keep title="Modèle d'objectif pour Notes" text={TEMPLATE} note="Collez le texte dans une nouvelle note. Vous pourrez ensuite mettre les étapes en liste et les preuves en tableau." /></div>
      <PostCta slug="fr/modele-objectif-notes-iphone" path="/fr/blog/modele-objectif-notes-iphone" position="answer" title="Mettre votre objectif à jour avec ChatGPT" ui={ui.cta}><p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut lire la note et y ajouter les preuves que vous lui donnez.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="preparer">Préparer la note sur Mac ou iPhone</h2>
    <p>Utilisez une note iCloud ou enregistrée sur votre appareil. Apple indique que certaines fonctions manquent avec d'autres fournisseurs de comptes. Le texte reste lisible avant toute mise en forme.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Sélectionner un intitulé", "Choisir un style de titre"] }, { on: "iPhone", steps: ["Format", "Choisir un style de titre"] }, { on: "iPhone", steps: ["Ajouter un tableau"] }]} />
    <p>Sur Mac, collez le modèle. Mettez en forme les intitulés, puis sélectionnez les trois lignes sous Étapes et transformez-les en liste à cocher. Pour les preuves, sélectionnez les lignes de Date à l'entrée du 21 novembre et créez un tableau : les tabulations séparent les deux colonnes. Vous pouvez aussi créer un tableau vide et remplir les cellules. La touche Tabulation dans la dernière cellule ajoute une ligne. Le <a href="/blog/apple-notes-tables">guide des tableaux</a> détaille ce geste.</p>
    <p>Sur iPhone, touchez Nouvelle note et collez le texte. Sélectionnez un intitulé, touchez Format et choisissez un style de titre. Recréez les étapes avec le bouton Liste de vérification ; Retour ajoute l'élément suivant. Pour les preuves, touchez Ajouter un tableau, saisissez dates et faits dans deux colonnes, puis retirez les lignes en texte brut.</p>
    <h2>Remplacer l'exemple par un résultat précis</h2>
    <p>« Écrire davantage » ne dit pas quand vous aurez fini. « Terminer un brouillon le 18 décembre » se vérifie. Le nombre de mots mesure l'avancée, mais le texte doit aussi avoir une fin. Datez le point de départ et nommez le fichier source. Gardez-le même quand vous progressez.</p>
    <p>Choisissez des étapes qui laissent une trace vérifiable. Une scène terminée en est une ; une séance d'écriture relève plutôt de votre agenda. Si la cible ou la date change, notez pourquoi et conservez la cible initiale.</p>
    <h2 id="bilan">Vérifier les preuves, puis choisir une action</h2>
    <p>Le 29 novembre, ouvrez le brouillon, comptez les mots et relisez la scène centrale. Ajoutez une ligne datée avec son fichier ou son lien. Ne cochez l'étape que si ses deux conditions sont remplies. Avec 3 200 mots mais une scène inachevée, elle reste ouverte.</p>
    <p>Changez la prochaine action et fixez le bilan suivant. Conservez les anciennes preuves. À l'échéance, vérifiez aussi la fin et les passages manquants. Un <a href="/fr/blog/bilan-de-la-semaine-notes-iphone">bilan de la semaine</a> peut aider à choisir quel objectif reprendre.</p>
    <h2 id="limites">Ce que ce modèle ne fait pas</h2>
    <p>La note enregistre les faits que vous saisissez. Elle ne lit pas le brouillon, ne mesure pas les progrès et n'envoie pas d'alerte. Vérifiez chaque étape dans sa source. Pour un seul objectif, quelques lignes datées peuvent suffire.</p>
    <h2 id="pinto">Mettre à jour la même note avec ChatGPT ou Claude</h2>
    <p>Pinto Notes propose titres, listes et tableaux sur Mac et iPhone. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier la note. Donnez-lui un résultat que vous avez vérifié.</p>
    <Keep title="Demander une mise à jour" text={PROMPT} note="Vérifiez vous-même le brouillon, puis remplacez les dates, le résultat et la source avant d'utiliser ce texte." />
    <p>Contrôlez la nouvelle ligne, la seule étape cochée et la date du prochain bilan. Le point de départ et les preuves précédentes doivent rester. Pinto conserve les versions antérieures. Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> sans modifier leurs originaux.</p>
  </LocalPostPage>;
}
