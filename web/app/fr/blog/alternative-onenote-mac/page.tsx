import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-onenote-mac");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative onenote » renvoie « alternative onenote », « alternative onenote gratuit » et « alternative onenote mac ». « alternative à onenote mac » renvoie « équivalent onenote mac » et « alternative onenote mac ».
// Aucun menu Notes d'Apple n'est cité ici. Les commandes OneNote sont décrites en français sans inventer leur libellé localisé. Faits suivis de /blog/onenote-alternative-for-mac.

const CHECK = `Vérifier le passage depuis OneNote
Garder l'accès au carnet d'origine.
Choisir cinq pages rédigées cette semaine.
Copier chacune dans une note ou un fichier texte distinct.
Vérifier l'ordre de lecture et les tableaux.
Comparer liens, images et fichiers joints aux originaux.
Garder dessins et mises en page dans OneNote ou un PDF.
Essayer les notes sur Mac et iPhone avant d'en déplacer davantage.`;
const FAQ = [
  { q: "Pinto Notes ouvre-t-il les fichiers OneNote .one ou .onepkg ?", a: ["Non. Il n'a pas d'import direct depuis OneNote. Il importe des dossiers ou ZIP de fichiers Markdown ou texte. Copiez les pages rédigées dont vous avez besoin ou préparez ces fichiers vous-même."] },
  { q: "Que peut-on enregistrer depuis OneNote sur Mac ?", a: ["Microsoft décrit l'enregistrement de la page courante en PDF. L'export web d'un carnet entier fonctionne seulement avec un compte OneDrive personnel, pas avec OneDrive professionnel ou scolaire ni SharePoint. Aucun de ces exports ne produit des notes Pinto modifiables."] },
  { q: "Un PDF OneNote devient-il une note modifiable ?", a: ["Non. L'import Markdown ou texte de Pinto ne transforme pas les pages PDF en notes modifiables. Gardez le PDF comme référence et copiez le texte si vous voulez continuer à l'éditer."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="alternative-onenote-mac"
    intro={<>Pinto Notes peut remplacer OneNote sur Mac pour des notes personnelles rédigées au clavier, avec une interface proche de Notes d'Apple et l'accès à une IA connectée. L'import direct depuis OneNote n'existe pas : commencez par quelques pages.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#choisir", label: "Quelles notes déplacer" }, { href: "#export", label: "Garder les originaux" }, { href: "#deplacer", label: "Copier le texte" }, { href: "#pinto", label: "Utiliser une IA" }]}>
      <p>Choisissez Pinto Notes pour les notes personnelles rédigées sur Mac et iPhone. ChatGPT ou Claude connecté peut les lire et les modifier. Gardez OneNote pour les pages dessinées, les mises en page libres et les carnets partagés. Pinto n'importe pas un carnet OneNote entier ni ses fichiers natifs.</p>
      <PostCta slug="fr/alternative-onenote-mac" path="/fr/blog/alternative-onenote-mac" position="answer" title="Essayez votre prochaine note dans Pinto Notes" ui={ui.cta}><p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac. Il est gratuit sur Mac, et vous pouvez connecter ChatGPT ou Claude à vos notes.</p></PostCta>
    </Answer>}
    faq={FAQ}>
    <h2 id="choisir">Choisir les notes que vous utilisez encore</h2>
    <p>Commencez par un projet en cours ou quelques pages personnelles. Gardez les archives dans OneNote pendant l'essai. Copier le texte d'un compte rendu ne conserve pas la disposition d'une page de dessins.</p>
    <p>OneNote classe ses contenus en <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac">carnets, sections et pages</a>. Sur Mac, vous pouvez <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">dessiner</a> avec une souris ou un trackpad. Les <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">carnets partagés</a> permettent de travailler à plusieurs. Gardez OneNote pour les carnets qui utilisent ces fonctions.</p>
    <p>OneNote existe aussi sur Windows, Android et dans un navigateur, selon le <a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions">guide Microsoft</a>. Pinto Notes est limité à iPhone et Mac. Pour comparer l'app d'Apple, lisez <a href="/fr/blog/notes-iphone-vs-onenote">Notes ou OneNote</a>.</p>
    <h2 id="export">Garder les originaux avant de déplacer le texte</h2>
    <p>Sur Mac, ouvrez une page OneNote et enregistrez-la en PDF depuis le menu Fichier. Le <a href="https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">guide Microsoft</a> décrit une copie figée de la page : les changements ultérieurs dans OneNote ne modifient pas le PDF. Ouvrez le fichier pour le vérifier.</p>
    <p>Pour un carnet entier, Microsoft décrit un <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks">export depuis OneNote pour le web</a>. Cliquez sur le carnet avec le bouton droit et lancez son export. Cette méthode concerne les comptes OneDrive personnels, pas ceux du travail ou de l'école ni SharePoint. Gardez ce téléchargement comme sauvegarde, sans essayer de l'importer directement dans Pinto.</p>
    <h2 id="deplacer">Ce que Pinto peut importer depuis OneNote</h2>
    <p>Il n'existe pas d'import direct depuis OneNote. Pinto ne convertit ni les fichiers <code>.one</code> et <code>.onepkg</code>, ni les pages PDF en notes modifiables. Les placer dans un ZIP ne change pas leur format.</p>
    <p>Pour quelques pages, copiez le texte dans des notes distinctes. Comparez une petite page à l'original, puis vérifiez l'ordre des blocs, les tableaux et les liens. Ajoutez séparément les images et fichiers joints dont vous avez besoin.</p>
    <p>Pour un plus grand nombre, préparez vous-même un dossier de fichiers Markdown ou texte, un par note. Ce n'est pas une option d'export OneNote décrite par Microsoft. Sur Mac, utilisez l'import Markdown ou texte du menu Fichier de Pinto Notes. Le <a href="/blog/import-your-notes">guide d'import</a> précise qu'un dossier ou ZIP convient et que chaque sous-dossier devient un dossier.</p>
    <Keep title="Vérifier quelques pages" text={CHECK} note="Il s'agit d'un transfert manuel, pas d'une conversion automatique de carnet." />
    <p>Gardez les pages qui reposent sur l'écriture manuscrite, les scans ou une disposition libre dans OneNote ou dans un PDF vérifié. Le transfert du texte ne rend pas ces éléments modifiables dans Pinto.</p>
    <h2 id="pinto">Utiliser les notes avec ChatGPT ou Claude</h2>
    <p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac. Une fois <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT ou Claude connecté</a>, l'IA peut lire et modifier les notes. L'autorisation couvre les deux actions. Pinto garde chaque version antérieure.</p>
    <p>Essayez une demande précise : « Lis mes notes sur les travaux de cuisine et ajoute une liste des décisions à prendre. » Vérifiez le résultat. La connexion ne transfère pas le reste de votre bibliothèque OneNote.</p>
    <p>Rédigez vos prochaines notes personnelles dans Pinto et voyez si cela couvre votre usage quotidien. Les carnets partagés peuvent rester dans OneNote ; vous pourrez copier d'autres pages plus tard.</p>
  </LocalPostPage>;
}
