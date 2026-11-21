import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "budget-notes-iphone");

// French version of /blog/apple-notes-budget-template (templates translation, 21 Nov 2026). Apple's own French words
// for every menu and setting, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apda85974595/mac ("Résoudre
// des opérations mathématiques dans Notes sur Mac": Format > Résultats mathématiques, Suggérer les résultats, variables
// written like Déjeuner=25, Retour to insert the answer) and support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac
// ("Ajouter un tableau dans Notes sur Mac"). Fichier > Dupliquer la note is the French string in Notes'
// MainMenu.loctable on macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) for "budget notes
// iphone" are all English ("budget template iphone notes", "budget apple notes"); "calcul note iphone" gives "calcul
// automatique note iphone" and "calcul tableau note iphone", and "budget mensuel" leads the plain budget searches, so the
// slug is "budget notes iphone" and the text says "budget mensuel" and "calcule". Facts are the English post's; the
// screenshots are its English ones, described in French. The template uses French names, as Apple's own French example
// does (Déjeuner).

const ui = UI.fr;

const TEMPLATE = `Budget, novembre

Revenus = 3200

Loyer = 1200
Courses = 450
Transport = 120
Téléphone = 30
Loisirs = 150
Épargne = 500

Loyer + Courses + Transport + Téléphone + Loisirs + Épargne =
Revenus - Loyer - Courses - Transport - Téléphone - Loisirs - Épargne =
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de budget ?", a: [
    "Non. Notes n’a aucun modèle. Vous pouvez quand même faire une note de budget qui calcule ses totaux : donnez un nom à chaque montant sur sa propre ligne, puis additionnez les noms avec un signe égal, et les résultats mathématiques donnent le total.",
  ] },
  { q: "Notes sait-il calculer ?", a: [
    "Oui, avec les résultats mathématiques. Tapez une opération qui finit par un signe égal et Notes propose la réponse. Un montant nommé, comme Loyer = 1200, peut servir dans les opérations suivantes, et le modifier met à jour toutes les réponses en dessous.",
  ] },
  { q: "Pourquoi mon tableau de budget dans Notes ne fait-il pas le total ?", a: [
    "Les résultats mathématiques ne fonctionnent pas dans un tableau. Gardez le tableau pour la lecture si vous voulez, et mettez les montants nommés et les opérations en lignes simples en dessous.",
  ] },
  { q: "Existe-t-il une app de budget gratuite qui fonctionne comme une note ?", a: [
    "Pinto Notes a un modèle gratuit Budget and expenses : une note qui est une petite app, avec ce qui reste ce mois-ci, chaque catégorie face à son budget, les factures du mois et les six derniers mois. ChatGPT ou Claude peut y ajouter vos dépenses.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="budget-notes-iphone"
      intro={<>
        Vous voulez un budget là où vous notez déjà tout, pas une app de plus avec un compte à créer. Notes en fait plus qu’on ne croit.
        Voici un modèle à coller qui calcule ses totaux tout seul, là où il s’arrête, et quoi utiliser quand il ne suffit plus.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#calcul", label: "Comment il calcule" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un budget qui se tient seul" },
        ]}>
          <p>
            Notes n’a pas de modèles, mais une note de budget peut quand même faire les calculs. Mettez chaque montant sur sa propre ligne
            avec un nom, comme Loyer = 1200, puis additionnez les noms avec un signe égal à la fin : les résultats mathématiques donnent le
            total et ce qui reste. Copiez le modèle ci-dessous dans une nouvelle note.
          </p>
          <PostCta slug="fr/budget-notes-iphone" path="/fr/blog/budget-notes-iphone" position="answer" ui={ui.cta}
            title="Un budget qui se tient tout seul ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit Budget and expenses : ce qui reste ce mois-ci, chaque catégorie face à son budget, et les factures qui reviennent. Dites à ChatGPT ou Claude ce que vous avez dépensé, et la dépense est ajoutée.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Une note Sequoia Group Expenses sur iPhone : chaque dépense nommée sur sa propre ligne, les noms additionnés pour 475 $, puis 475 $ divisés par 5, soit 95 $ chacun."
        caption="L’exemple d’Apple pour l’astuce sur laquelle repose une note de budget : nommer chaque montant, puis additionner les noms. Image : Apple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un budget mensuel qui fait ses totaux</h2>
      <p>
        Créez une nouvelle note et collez ceci. Remplacez les montants et les noms par les vôtres ; n’importe quel nom fonctionne, tant
        qu’il est écrit de la même façon à chaque fois.
      </p>
      <Keep title="Budget mensuel pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Notes propose chaque réponse après le signe égal. Appuyez sur Retour pour la garder." />
      <p>
        La première opération donne ce que vous avez prévu de dépenser. La seconde donne ce qui reste une fois tout retiré de vos
        revenus, épargne comprise. Si la seconde réponse est négative, le plan ne tient pas.
      </p>
      <p>
        Gardez une note par mois. Sur Mac, Fichier, Dupliquer la note copie celle du mois dernier : vous ne changez que le titre et les
        montants qui ont bougé. Si vous gardez d’autres modèles, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en
        anglais) montre comment préparer un dossier Modèles.
      </p>

      <h2 id="calcul">Comment il calcule</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="Un tableau Moving budget dans Notes sur macOS 27. La cellule Total affiche 85+240+180= sans réponse. Sous le tableau, Boxes = 85, Van = 240 et Cleaning = 180 sont nommés, et Boxes + Van + Cleaning = affiche 505, proposé par Notes."
        caption="Sur macOS 27 : dans un tableau, l’opération reste telle quelle. En lignes nommées sous le tableau, Notes répond : 505." />
      <Paths rows={[{ on: "Mac", steps: ["Format", "Résultats mathématiques"] }]} />
      <p>
        Notes appelle cela les résultats mathématiques. Une ligne comme Loyer = 1200 donne un nom au nombre, et toute ligne suivante qui
        finit par un signe égal reçoit sa réponse. Passez Courses de 450 à 500 et les deux totaux suivent, ce qui est l’essentiel de ce
        qu’un tableur de budget fait pour vous. Si aucune réponse n’apparaît sur Mac, vérifiez que Format, Résultats mathématiques est
        activé.
      </p>
      <p>
        Un piège : cela ne marche pas dans un tableau. Les résultats mathématiques se désactivent tant que vous êtes dedans, et une
        cellule Total reste du texte. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) passe en revue ce que les
        tableaux savent faire, ou pas.
      </p>

      <h2 id="limites">Là où un budget dans Notes s’arrête</h2>
      <ul>
        <li><strong>Les dépenses se notent à la main.</strong> Pour suivre ce que vous dépensez vraiment, vous ajoutez une ligne par achat et un nom à l’opération. Après quelques semaines, la ligne devient longue.</li>
        <li><strong>Pas de mois côte à côte.</strong> Chaque mois est une note à part : comparer ce mois-ci aux six derniers, c’est ouvrir six notes.</li>
        <li><strong>Pas de factures qui reviennent.</strong> Le loyer et les abonnements sont à retaper dans la note de chaque mois.</li>
        <li><strong>Pas de catégories face à une limite.</strong> Vous voyez ce qui reste au total, pas que les restaurants dépassent et que le transport est en dessous.</li>
      </ul>
      <p>
        Pour un plan qu’on fixe une fois par mois, la note suffit. Pour noter les dépenses au fil de l’eau, c’est là qu’elle ne suit plus.
      </p>

      <h2 id="pinto-notes">Une note de budget qui se tient toute seule</h2>
      <Figure shot={{ ...SHOTS.budgetApp, alt: "L’app de budget dans une note Pinto Notes sur Mac : 8 205 kr restants en octobre, soit environ 410 kr par jour après les factures, un graphique des six derniers mois, les factures du mois, et chaque catégorie face à son budget avec ce qui a été reporté." }}
        caption="Le modèle Budget and expenses dans Pinto Notes sur Mac, avec des données d’exemple : ce qui reste ce mois-ci, les six derniers mois, les factures et chaque catégorie face à son budget." />
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et une note peut aussi être une petite app. Le modèle
        gratuit <a href="/templates/budget-log">Budget and expenses</a> (budget et dépenses) en est une : vous fixez une fois un budget
        mensuel par catégorie, et il affiche ce qui reste ce mois-ci avec une barre, chaque catégorie face à son budget avec ce qui a été
        reporté, vos factures du mois et les six derniers mois. Une dépense s’ajoute d’un toucher, et il fait les calculs.
      </p>
      <p>
        Vous pouvez aussi dire à ChatGPT ou Claude ce que vous avez dépensé, dans la conversation que vous utilisez déjà, et la dépense est
        ajoutée à la note. C’est l’app qui fait les calculs, pas l’IA.{" "}
        <a href="/blog/budget-tracker-with-chatgpt-or-claude">A budget your AI can keep for you</a> (en anglais) montre comment.
      </p>
      <p>
        Vos notes Apple arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en anglais), et Notes reste
        tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
