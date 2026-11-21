import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "rechercher-remplacer-notes-iphone");

// Version française de /blog/apple-notes-find-and-replace, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « rechercher et remplacer notes iphone » et
// « rechercher remplacer note mac » ne donnent aucune suggestion. Slug descriptif, sans demande exacte présumée.
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/not18ab658ed/mac
// (Commande + F dans une note), /guide/iphone/iphb8628c6b8/ios (Actions de note, Rechercher dans la note),
// /guide/iphone/iph1a9cae52c/ios (sélection de texte), /guide/textedit/txtef6cfde1a/mac
// (Édition > Rechercher > Rechercher, Remplacer, Tous, Terminé). Les guides Notes ne nomment pas de
// commande de remplacement, donc aucune commande Notes de ce type n'est inventée. Aucune image dans l'original.
const ui = UI.fr;
const RENAME = `Dans mon dossier Lancement de Pinto Notes, trouve les notes contenant « Projet Port ».
Lis chaque note trouvée et montre-moi les passages que tu remplacerais par « Projet Quai ».
Ne change ni les anciennes citations de réunion ni les adresses web. Ne modifie encore rien.
Après mon accord sur les passages, mets les notes à jour et liste celles que tu as changées.`;
const FAQ = [
  { q: "Que dit Apple sur rechercher et remplacer dans Notes ?", a: ["Ses guides décrivent Commande + F dans une note sur Mac et Actions de note, Rechercher dans la note sur iPhone. Ils ne détaillent pas de commande de remplacement. Cela ne prouve pas que la fonction est absente."] },
  { q: "Quel raccourci cherche dans une seule note sur Mac ?", a: ["Ouvrez la note, appuyez sur Commande + F, puis saisissez le texte. La recherche dans la note est distincte de la recherche parmi toutes vos notes."] },
  { q: "Où trouver la recherche dans une note sur iPhone ?", a: ["Ouvrez la note, touchez Actions de note, puis Rechercher dans la note. Le bouton Rechercher de cette vue ouvre les options de recherche."] },
  { q: "Une IA peut-elle renommer une expression dans plusieurs notes Pinto ?", a: ["Oui, après connexion, ChatGPT ou Claude peut chercher, lire et modifier chaque note concernée. L’outil de modification agit sur une note nommée par appel ; plusieurs notes demandent plusieurs modifications."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="rechercher-remplacer-notes-iphone"
    intro="Pour chercher dans une note, appuyez sur Commande + F sur Mac ou ouvrez Actions de note, puis Rechercher dans la note sur iPhone. Les guides actuels d’Apple décrivent la recherche, sans détailler les commandes de remplacement dans Notes."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Chercher sur Mac" }, { href: "#iphone", label: "Chercher sur iPhone" },
      { href: "#remplacer", label: "Remplacer dans TextEdit" }, { href: "#limites", label: "Plusieurs notes" }, { href: "#pinto-notes", label: "Avec une IA" },
    ]}><p>Sur Mac, Commande + F ouvre la recherche dans la note. Sur iPhone, passez par Actions de note. Vous pouvez corriger chaque occurrence à la main. Pour remplacer tout un passage avec une procédure documentée par Apple, travaillez sur une copie du texte dans TextEdit sur Mac.</p>
      <PostCta slug="fr/rechercher-remplacer-notes-iphone" path="/fr/blog/rechercher-remplacer-notes-iphone" position="answer" ui={ui.cta} title="Renommer un terme dans plusieurs notes"><p>Dans Pinto Notes, ChatGPT ou Claude connecté peut retrouver une expression et modifier chaque note concernée. Toutes les versions précédentes sont conservées.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="mac">Chercher dans une note sur Mac</h2>
    <Steps><li>Ouvrez la note voulue.</li><li>Appuyez sur Commande + F pour ouvrir la recherche.</li><li>Saisissez le mot ou l’expression.</li></Steps>
    <MenuPaths rows={[{ on: "Mac", steps: ["Ouvrir une note", "Rechercher dans cette note"], keys: "⌘F" }]} />
    <p>Apple décrit ce chemin dans son <a href="https://support.apple.com/fr-fr/guide/notes/not18ab658ed/mac">guide de recherche sur Mac</a>. Chercher dans la note est différent de chercher parmi les notes du compte. Pour un changement précis, cherchez « Projet Port » plutôt que « Port » seul.</p>
    <p>Le guide ne donne ni boutons ni raccourci de remplacement dans Notes. Ce silence ne signifie pas que Notes ne sait pas remplacer. Pour quelques corrections, changez le texte trouvé à la main. Pour une longue portion de texte, utilisez la méthode TextEdit ci-dessous.</p>
    <h2 id="iphone">Chercher dans une note sur iPhone</h2>
    <Steps><li>Ouvrez la note et touchez Actions de note.</li><li>Touchez Rechercher dans la note.</li><li>Saisissez le texte. Le bouton Rechercher de cette vue ouvre les options.</li></Steps>
    <MenuPaths rows={[{ on: "iPhone", steps: ["Actions de note", "Rechercher dans la note"] }]} />
    <p>Apple donne ces étapes dans son <a href="https://support.apple.com/fr-fr/guide/iphone/iphb8628c6b8/ios">guide de recherche sur iPhone</a>. La page ne décrit pas de suite de boutons pour rechercher et remplacer.</p>
    <p>Pour corriger à la main, revenez au texte de la note. Touchez deux fois un mot pour le sélectionner, ajustez les poignées pour couvrir l’expression, puis saisissez le nouveau texte. Apple explique la <a href="https://support.apple.com/fr-fr/guide/iphone/iph1a9cae52c/ios">sélection sur iPhone</a>. Relisez la phrase autour de chaque occurrence.</p>
    <h2 id="remplacer">Remplacer un long passage avec TextEdit sur Mac</h2>
    <p>Pour un long passage de texte ordinaire, faites le remplacement dans TextEdit, puis recopiez le résultat dans Notes. Gardez la note d’origine jusqu’à vérification. Cette méthode ne transfère pas les pièces jointes et ne préserve pas une mise en page complexe.</p>
    <Steps>
      <li>Copiez le passage de Notes dans un document TextEdit.</li>
      <li>Dans TextEdit, choisissez Édition, Rechercher, Rechercher et tapez l’ancienne expression.</li>
      <li>Cochez Remplacer près de Fermer, puis tapez la nouvelle expression dans le champ du dessous.</li>
      <li>Cliquez sur Remplacer pour une occurrence ou sur Tous pour toutes les occurrences du document TextEdit.</li>
      <li>Cliquez sur Terminé, relisez le passage et recopiez-le au bon endroit dans Notes.</li>
    </Steps>
    <MenuPaths rows={[{ on: "TextEdit sur Mac", steps: ["Édition", "Rechercher", "Rechercher", "Remplacer"] }]} />
    <p>Ces libellés viennent du <a href="https://support.apple.com/fr-fr/guide/textedit/txtef6cfde1a/mac">guide TextEdit d’Apple</a>. Le bouton s’appelle Tous. Ce sont des commandes de TextEdit, pas de Notes.</p>
    <h2 id="limites">Changer plusieurs notes</h2>
    <p>Trouver toutes les notes qui citent un nom et changer ce nom sont deux tâches distinctes. Les guides de recherche de Notes consultés ici ne décrivent pas une commande unique pour remplacer dans plusieurs notes. Cherchez l’expression, ouvrez chaque note concernée et vérifiez le contexte avant de modifier.</p>
    <p>Un nouveau nom peut convenir au projet actuel mais pas à une ancienne citation de réunion. Notez les fiches à changer. Si la recherche ne retrouve pas une note qui existe, suivez les <a href="/fr/blog/recherche-notes-iphone-ne-fonctionne-pas">vérifications de la recherche</a>.</p>
    <h2 id="pinto-notes">Renommer dans Pinto Notes avec une IA connectée</h2>
    <p>Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac. Une fois <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT ou Claude connecté</a> (en anglais), l’IA peut chercher les notes, lire les résultats et remplacer du texte dans chacune. Commencez par demander les modifications proposées.</p>
    <Keep title="Demande de renommage à votre IA" text={RENAME} copyLabel={ui.copy} note="Adaptez le dossier et les expressions. C’est une demande à vérifier, pas une règle automatique." />
    <p>L’outil de modification de Pinto remplace un texte exact dans une note nommée. Il peut changer toutes les occurrences de cette note et exige que l’IA lise sa version actuelle avant modification. Plusieurs notes demandent une recherche, une lecture et une modification pour chacune.</p>
    <p>Après avoir relu les passages proposés, dites à l’IA lesquels changer. Vérifiez les notes obtenues et les exceptions demandées. Chaque version précédente est gardée ; le <a href="/blog/apple-notes-version-history">guide de l’historique</a> (en anglais) l’explique.</p>
    <p>Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
