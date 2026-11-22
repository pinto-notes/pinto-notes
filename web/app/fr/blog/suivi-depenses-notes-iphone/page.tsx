import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-depenses-notes-iphone");

// Version française de /blog/apple-notes-expense-tracker. Google autocomplete hl=fr, gl=fr,
// 21 novembre 2026 : « suivi dépenses notes iphone » n’a renvoyé aucune suggestion.
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apda85974595/mac
// (Format > Résultats mathématiques, variables et Retour) ;
// support.apple.com/fr-fr/guide/iphone/iph46efa613a/ios et /guide/iphone/iphb9c2b948f/ios
// (variables et calculs dans Notes). Le nom français de la commande de duplication n’a pas été
// vérifié dans ces pages : la copie mensuelle est décrite sans nom de menu.
// Le modèle garde les tabulations et les lignes de calcul de l’original.

const ui = UI.fr;
const TEMPLATE = `Dépenses, novembre

Date\tAchat\tCatégorie\tMontant
1 nov.\tCourses de la semaine\tCourses\t42
2 nov.\tCarte de bus\tTransport\t18
3 nov.\tPizza entre amis\tRestaurant\t23
5 nov.\tAmpoules\tMaison\t6
6 nov.\tCourses de la semaine\tCourses\t24
8 nov.\tCinéma\tLoisirs\t15

Courses = 42 + 24
Transport = 18
Restaurant = 23
Maison = 6
Loisirs = 15

Courses + Transport + Restaurant + Maison + Loisirs =
`;

const FAQ = [
  { q: "Notes peut-il calculer les dépenses ?", a: [
    "Oui, avec des lignes de calcul sous le tableau. Les résultats mathématiques ne calculent pas dans les cellules d’un tableau.",
  ] },
  { q: "Notes a-t-il un modèle de suivi des dépenses ?", a: [
    "Non. Vous pouvez coller celui de cette page, puis préparer une nouvelle copie chaque mois.",
  ] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="suivi-depenses-notes-iphone"
    intro="Notez chaque achat quand vous payez, puis regardez le total en fin de mois. Notes peut tenir le journal et calculer sous le tableau. Voici un modèle à coller."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "Le modèle" }, { href: "#installer", label: "L’installer" },
      { href: "#quotidien", label: "Au quotidien" }, { href: "#limites", label: "Les limites" },
      { href: "#pinto", label: "Avec Pinto Notes" },
    ]}>
      <p>Faites un tableau avec une ligne par achat, puis une ligne de calcul par catégorie sous le tableau. Terminez par une addition des catégories suivie du signe égal. Notes propose le total sur iPhone et Mac.</p>
      <PostCta template="budget-log" slug="fr/suivi-depenses-notes-iphone" path="/fr/blog/suivi-depenses-notes-iphone" position="answer" ui={ui.cta} title="Un suivi avec les calculs automatiques">
        <p>Le modèle gratuit Budget et dépenses de Pinto Notes saisit chaque achat une fois. Vous pouvez aussi le dicter à ChatGPT ou Claude après connexion.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828}
      alt="Une note de dépenses sur iPhone avec des montants nommés et additionnés."
      caption="L’exemple d’Apple additionne des montants nommés. Le modèle ci-dessous suit le même principe. Image : Apple." />}
    faq={FAQ}>
    <h2 id="modele">Le modèle : achats et totaux</h2>
    <p>Le tableau garde la date, l’achat, la catégorie et le montant. Les lignes de calcul en dessous font les totaux, car Notes ne calcule pas dans un tableau. Chaque catégorie reçoit un nom qui sert dans la dernière addition.</p>
    <Keep title="Suivi des dépenses pour Notes" text={TEMPLATE}
      note="Chaque ligne du tableau sépare les colonnes par une tabulation. Sur Mac, sélectionnez ces lignes et utilisez le bouton Tableau. Après le dernier signe égal, appuyez sur Retour pour garder le résultat proposé." />
    <p>Gardez un nom de catégorie en un seul mot avec les lettres latines. Définissez chaque nom au-dessus du calcul qui l’utilise, comme dans l’exemple d’Apple.</p>
    <h2 id="installer">Installer le tableau</h2>
    <ol><li>Collez le modèle dans une nouvelle note.</li><li>Sélectionnez les lignes entre « Date » et le dernier achat, puis utilisez le bouton Tableau. Les tabulations deviennent des colonnes.</li><li>Sur Mac, vérifiez Format &gt; Résultats mathématiques. Les réponses peuvent être suggérées, insérées ou désactivées ; Retour insère une suggestion.</li><li>Gardez une note par mois. Pour le mois suivant, copiez la note, effacez les achats et remettez les calculs à zéro.</li></ol>
    <p>Apple indique que les calculs fonctionnent dans les notes iCloud mises à niveau et les notes stockées sur Mac. Sur iPhone, saisir une expression suivie du signe égal donne aussi un résultat.</p>
    <h2 id="quotidien">Au quotidien</h2>
    <p>Ajoutez une ligne pour chaque paiement. Sur Mac, Tabulation dans la dernière cellule crée une nouvelle ligne. Ajoutez aussi le montant à la ligne de sa catégorie. Épinglez la note du mois et recherchez plus tard un achat par son nom. Pour fixer d’abord un plafond par catégorie, utilisez aussi le <a href="/fr/blog/budget-notes-iphone">modèle de budget</a>.</p>
    <h2 id="limites">Les limites du suivi dans Notes</h2>
    <p>Chaque montant est saisi deux fois : dans le tableau et dans le calcul. Un oubli fausse le total. Le tableau ne trie ni n’additionne, les mois restent séparés et les factures répétées doivent être ressaisies. Avec beaucoup d’achats, la vérification des lignes prend du temps.</p>
    <h2 id="pinto">Un suivi rempli avec ChatGPT ou Claude</h2>
    <Figure shot={SHOTS.budgetApp} caption="Le modèle Budget et dépenses dans Pinto Notes sur Mac : reste du mois, factures, catégories et six derniers mois." />
    <p>Le modèle gratuit <a href="/templates/budget-log">Budget et dépenses</a> permet d’ajouter un achat une fois, de le modifier ou de l’effacer avec Annuler. Il montre le reste par catégorie, les factures du mois et les six derniers mois. Après connexion, ChatGPT ou Claude peut noter les achats que vous lui décrivez et placer un résumé dans la note. Les calculs sont faits par le modèle, pas par l’IA. Il n’est pas relié à votre banque.</p>
    <p>Vos notes Apple peuvent être importées sur Mac sans être modifiées. À lire aussi : <a href="/fr/blog/budget-notes-iphone">un budget dans Notes</a>.</p>
  </LocalPostPage>;
}
