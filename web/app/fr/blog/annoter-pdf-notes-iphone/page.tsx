import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "annoter-pdf-notes-iphone");

// Version française de /blog/apple-notes-annotate-pdf. Recherche : « annoter un pdf sur iphone » → « annoter un pdf sur iphone », « annoter pdf iphone gratuit » ; « annoter pdf iphone notes » renvoie seulement « annotate pdf apple notes » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/iphone/iph8958dd125/ios (Affichage, Coup d’œil, Rotation à gauche et à droite), /guide/iphone/draw-and-handwrite-with-markup-iph893c6f8bf/ios, /guide/notes/apdef7f74190/mac (Annotation, Terminé), /guide/mac-help/mark-up-files-mchl1fd88863/mac, /guide/preview/annotate-a-pdf-prvw11580/mac et /guide/iphone/export-or-print-notes-iphdf551cfa2/ios, lus le 21 novembre 2026.
// Le bouton de dessin sur iPhone n’a pas de nom textuel dans ce guide ; sa fonction est décrite, sans nom inventé. Faits Pinto repris de l’article anglais.

const ui = UI.fr;
const REVIEW = `Relecture du PDF

Document :
Page :
Remarque :
À faire :
`;
const FAQ = [
  { q: "Peut-on annoter un PDF dans Notes sur iPhone ?", a: ["Oui. Ouvrez le PDF si son aperçu est petit, puis touchez le bouton des outils de dessin. Avec un aperçu moyen ou grand, ce bouton apparaît directement sur la pièce jointe."] },
  { q: "Peut-on corriger le texte d’origine du PDF ?", a: ["Les guides Notes décrivent l’annotation et les actions sur les pages, pas la réécriture du texte existant. Une zone de texte ajoutée se superpose au PDF."] },
  { q: "Où se trouve Annotation sur Mac ?", a: ["Dans Notes, cliquez sur la flèche à côté du titre du PDF, choisissez Annotation, ajoutez vos marques, puis cliquez sur Terminé."] },
  { q: "Partager puis annoter une note modifie-t-il son PDF joint ?", a: ["Non. Cette voie exporte une nouvelle version PDF de la note entière. Pour annoter le fichier joint, ouvrez les outils sur la pièce jointe. L’export de la note n’inclut que la première page d’un PDF joint multipage."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="annoter-pdf-notes-iphone" intro="Notes permet d’annoter un PDF sur iPhone et Mac. Sur iPhone, ouvrez les outils de dessin de la pièce jointe. Sur Mac, ouvrez le menu du PDF et choisissez Annotation."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#iphone", label: "Sur iPhone" }, { href: "#mac", label: "Sur Mac" }, { href: "#limites", label: "Limites" }, { href: "#export", label: "PDF joint ou note entière" }]}>
      <p>Si l’aperçu du PDF est petit, touchez-le pour l’ouvrir puis ouvrez les outils de dessin. Avec un aperçu moyen ou grand, le bouton est accessible directement. Sur Mac, choisissez « Annotation » dans le menu du titre du PDF et terminez avec « Terminé ».</p>
      <PostCta slug="fr/annoter-pdf-notes-iphone" path="/fr/blog/annoter-pdf-notes-iphone" position="answer" ui={ui.cta} title="Garder aussi vos remarques écrites"><p>Dans Pinto Notes, ChatGPT ou Claude peut lire et modifier les remarques que vous rédigez dans une note après connexion. Pinto en conserve chaque ancienne version.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="iphone">Annoter un PDF sur iPhone</h2><p>Si le fichier se trouve dans Fichiers ou Mail, maintenez le doigt dessus, ouvrez le partage, choisissez Notes, sélectionnez une note et touchez Enregistrer. Ouvrez ensuite cette note.</p>
    <Steps><li>Repérez le PDF dans la note.</li><li>Si son aperçu est petit, touchez le fichier pour l’ouvrir puis touchez le bouton des outils de dessin. Si l’aperçu est moyen ou grand, touchez ce bouton directement.</li><li>Choisissez un stylo, un marqueur ou un crayon et dessinez avec le doigt.</li><li>Touchez de nouveau l’outil choisi pour ajuster le trait ou l’opacité. Utilisez le sélecteur de couleur pour changer de couleur.</li></Steps>
    <p>Le menu du PDF propose « Affichage » avec les tailles Petit, Moyen et Grand. Si la barre d’annotation se réduit, touchez-la pour la rouvrir. Apple décrit ces gestes dans les guides <a href="https://support.apple.com/fr-fr/guide/iphone/iph8958dd125/ios">PDF dans Notes</a> et <a href="https://support.apple.com/fr-fr/guide/iphone/draw-and-handwrite-with-markup-iph893c6f8bf/ios">dessin avec Annoter</a>.</p>
    <h2 id="mac">Annoter le PDF dans Notes sur Mac</h2><MenuPaths rows={[{ on: "Mac", steps: ["Flèche du titre du PDF", "Annotation", "Terminé"] }]} />
    <Steps><li>Ouvrez la note qui contient le PDF.</li><li>Cliquez sur la flèche à côté de son titre, puis choisissez Annotation.</li><li>Ajoutez vos marques avec la barre d’outils.</li><li>Cliquez sur Terminé.</li></Steps>
    <p>Vous pouvez ajouter une zone de texte, surligner une sélection, dessiner ou signer. Les outils disponibles varient selon le fichier. <a href="https://support.apple.com/fr-fr/guide/notes/apdef7f74190/mac">Voir l’annotation dans Notes</a> et <a href="https://support.apple.com/fr-fr/guide/mac-help/mark-up-files-mchl1fd88863/mac">les outils sur Mac</a>.</p>
    <h2 id="limites">Ce que l’annotation ne change pas</h2><p>Une zone de texte ajoute un commentaire au-dessus du document. Les guides Notes ne décrivent pas la modification des mots déjà présents dans le PDF. Apple précise aussi qu’Aperçu ne permet pas de <a href="https://support.apple.com/fr-fr/guide/preview/annotate-a-pdf-prvw11580/mac">réécrire le texte d’origine</a>.</p>
    <p>Sur iPhone, un aperçu moyen ou grand permet d’afficher les vignettes des pages. Le menu d’une vignette propose notamment « Rotation à gauche » et « Rotation à droite ». « Recadrer la page » et les filtres ne concernent que les documents scannés.</p>
    <h2 id="export">Annoter la pièce jointe ou exporter la note ?</h2><p>Sur iPhone, l’annotation lancée depuis le partage de la note entière crée un nouveau PDF de la note. Pour annoter le document joint lui-même, ouvrez ses outils comme indiqué plus haut. Apple signale qu’un export PDF de la note n’inclut que la première page d’un PDF ou scan multipage joint. <a href="https://support.apple.com/fr-fr/guide/iphone/export-or-print-notes-iphdf551cfa2/ios">Voir le guide d’export</a> et <a href="/fr/blog/exporter-notes-iphone-pdf">les étapes en français</a>.</p>
    <h2>Conserver les remarques à côté du PDF</h2><p>Un cercle sur la page indique où agir. Une note séparée peut expliquer ce qu’il faut corriger et qui s’en charge. Répétez les lignes suivantes pour chaque remarque.</p>
    <Keep title="Note de relecture" text={REVIEW} />
    <p>Dans Pinto Notes, ChatGPT ou Claude peut lire et modifier le texte de cette note après connexion. Demandez par exemple une liste de pointage qui garde les numéros de page. Pinto conserve les versions précédentes. L’import de vos notes Apple sur Mac laisse les originaux intacts.</p>
  </LocalPostPage>;
}
