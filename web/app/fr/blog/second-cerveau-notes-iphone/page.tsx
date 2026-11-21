import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "second-cerveau-notes-iphone");

// Version française de /blog/apple-notes-second-brain. Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « second cerveau application » renvoie cette expression ; « notes apple second brain » renvoie « apple notes second brain template ». « second cerveau apple notes » et « notes second cerveau » restent sans suggestion. Titre descriptif.
// Pages Apple lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd558a85438/mac (Fichier > Nouveau dossier), not9474646a9/mac (Nouvelle note, Fichier > Dupliquer la note), apdc88ed7f1d/mac (tags), apd58edc7964/mac (Fichier > Nouveau dossier intelligent), apdb54e469b6/mac (Fichier > Épingler la note), apde615d29c2/mac (Édition > Ajouter un lien, Utiliser le titre de la note, >>), /fr-fr/guide/iphone/iph908d1558b/ios et /fr-fr/102288 (liens et tags sur iPhone).
// Le classement et la révision proposés ici sont une méthode, pas des consignes Apple. Faits Pinto repris de l'article anglais.

const ui = UI.fr;
const HOME = `Accueil

Cette semaine
Choisir des plantes pour le balcon

Projets en cours
Jardin du balcon

Références utiles
Plantes qui aiment l'ombre
Notes sur l'arrosage

Revue de la semaine
Lire les notes de la boîte de réception
Classer ce qui mérite d'être gardé
Noter la prochaine étape de chaque projet en cours
Déplacer les projets terminés dans les archives
`;
const FAQ = [
  { q: "Peut-on utiliser Notes comme second cerveau ?", a: ["Oui. Créez des dossiers pour les nouvelles notes, les projets, les références et les archives. Épinglez une note d'accueil qui renvoie aux projets en cours, puis classez régulièrement ce que vous avez recueilli."] },
  { q: "Le texte du modèle crée-t-il des liens ?", a: ["Non. Collez le modèle, créez les notes citées, puis ajoutez de vrais liens avec Édition > Ajouter un lien sur Mac ou en saisissant >> sur iPhone et Mac."] },
  { q: "Comment réunir des notes de plusieurs dossiers ?", a: ["Ajoutez le même tag aux notes concernées. Un dossier intelligent filtré sur ce tag les affiche sans les déplacer."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="second-cerveau-notes-iphone"
    intro="Notes peut servir à garder des idées et à les retrouver. Commencez avec quatre dossiers et une note d'accueil épinglée. Classez ensuite les nouvelles notes une fois par semaine."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#dossiers", label: "Les quatre dossiers" }, { href: "#accueil", label: "La note d'accueil" },
      { href: "#tags", label: "Tags et dossiers intelligents" }, { href: "#revue", label: "La revue hebdomadaire" },
      { href: "#pinto", label: "Liens entrants et IA" },
    ]}>
      <p>Créez une boîte de réception, un dossier Projets, un dossier Références et un dossier Archives. Épinglez une note Accueil avec des liens vers les projets en cours. Un tag commun peut réunir des notes rangées dans différents dossiers.</p>
      <PostCta slug="fr/second-cerveau-notes-iphone" path="/fr/blog/second-cerveau-notes-iphone" position="answer" ui={ui.cta} title="Retrouver les liens vers une note">
        <p>Pinto Notes ressemble à Notes sur iPhone et Mac. Son menu affiche les notes qui pointent vers celle que vous lisez. Après connexion, ChatGPT ou Claude peut lire et modifier vos notes.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="dossiers">Commencer avec quatre dossiers</h2>
    <MenuPaths rows={[{ on: "Mac", steps: ["Fichier", "Nouveau dossier"] }]} />
    <p>Sur Mac, sélectionnez un dossier iCloud dans la barre latérale, puis choisissez Fichier &gt; Nouveau dossier. Les fonctions de Notes décrites ici sont disponibles avec les notes iCloud ; certaines manquent avec d'autres fournisseurs de comptes.</p>
    <ul>
      <li>La boîte de réception reçoit les nouvelles notes avant leur classement.</li>
      <li>Projets garde les travaux qui ont une fin, comme le jardin du balcon, avec leur prochaine étape.</li>
      <li>Références garde les informations à réutiliser, comme un conseil sur l'arrosage.</li>
      <li>Archives reçoit les projets terminés que vous pourriez consulter plus tard.</li>
    </ul>
    <p>Commencez avec la prochaine note. Inutile de ranger toute votre bibliothèque d'un coup. Sur Mac, faites glisser une note de la liste vers un dossier de la barre latérale. Ajoutez des sous-dossiers si un dossier devient difficile à parcourir.</p>

    <h2 id="accueil">Copier et épingler une note d'accueil</h2>
    <p>Créez Accueil dans Projets et collez ce texte. Remplacez ensuite les exemples par vos propres notes. Les noms ci-dessous ne deviennent pas des liens quand vous les collez.</p>
    <Keep title="Modèle de note d'accueil" text={HOME} note="Collez ce texte, créez les notes citées, puis remplacez leurs noms par de vrais liens." />
    <MenuPaths rows={[{ on: "Mac", steps: ["Édition", "Ajouter un lien"] }, { on: "Mac", steps: ["Fichier", "Épingler la note"] }]} />
    <p>Créez la note Jardin du balcon. Dans Accueil, sélectionnez son nom, choisissez Édition &gt; Ajouter un lien, cherchez la note et sélectionnez-la. Laissez « Utiliser le titre de la note » actif pour que le nom du lien suive un renommage. Répétez l'opération pour les références utiles.</p>
    <p>Sur iPhone ou Mac, saisissez aussi <code>&gt;&gt;</code> puis le titre de la note cible. Enfin, sélectionnez Accueil et choisissez Fichier &gt; Épingler la note pour la garder en haut de la liste. <a href="https://support.apple.com/fr-fr/guide/notes/apde615d29c2/mac">Apple décrit l'ajout de liens sur Mac</a>.</p>

    <h2 id="tags">Réunir des sujets avec des tags</h2>
    <p>Ajoutez <code>#jardin</code> au projet Jardin du balcon et à une note sur les plantes d'ombre classée dans Références. Sur iPhone, ajoutez un espace après le tag pour l'activer. Choisissez des tags que vous réutiliserez.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Fichier", "Nouveau dossier intelligent"] }]} />
    <p>Sur Mac, créez un dossier intelligent Jardin et choisissez le tag comme règle. Sur iPhone, touchez « Nouveau dossier », donnez-lui le nom Jardin, puis touchez « Convertir en dossier intelligent » et choisissez le tag comme filtre. Les notes restent dans leurs dossiers d'origine. Vous devez toujours ajouter le tag vous-même. Voir aussi <a href="/blog/apple-notes-tags-smart-folders">les règles des dossiers intelligents</a>.</p>

    <h2 id="revue">Noter d'abord, classer chaque semaine</h2>
    <p>Sur Mac, sélectionnez la boîte de réception et cliquez sur Nouvelle note. Donnez un titre reconnaissable, ajoutez les détails utiles et le lien de la source. Pendant la revue, déplacez les informations à garder dans Références et les travaux en cours dans Projets. Notez la prochaine étape et mettez Accueil à jour. Déplacez les projets finis dans Archives.</p>
    <p>Si vous reprenez souvent la même structure, Fichier &gt; Dupliquer la note crée une copie à remplir. Accueil demande aussi un entretien manuel : ni les nouveaux projets ni les tags ne s'y ajoutent tout seuls. Notes n'affiche pas la liste des notes qui pointent vers la note ouverte.</p>

    <h2 id="pinto">Liens entrants et accès par l'IA dans Pinto Notes</h2>
    <p>Dans Pinto Notes, « Linked From » dans le menu de la note liste les notes qui pointent vers elle. Seuls les vrais liens comptent. Le <a href="/blog/apple-notes-backlinks">guide des liens entrants</a> montre cette fonction. Après <a href="/blog/connect-chatgpt-to-your-notes">connexion de ChatGPT ou Claude</a>, vous pouvez lui demander de lire les notes d'un projet et de proposer les prochaines étapes. Relisez son brouillon et corrigez-le. Les notes écrites par l'IA restent modifiables.</p>
    <p>Vous pouvez <a href="/blog/move-from-apple-notes">importer Notes sur Mac</a> en une fois. La bibliothèque d'origine ne change pas.</p>
  </LocalPostPage>;
}
