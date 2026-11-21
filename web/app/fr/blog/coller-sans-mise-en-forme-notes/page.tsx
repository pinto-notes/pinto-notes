import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "coller-sans-mise-en-forme-notes");

// Version française de /blog/apple-notes-paste-without-formatting, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « coller sans mise en forme mac » donne « coller sans mise en forme
// mac raccourci », « copier coller sans mise en forme mac » et « coller texte sans mise en forme mac » ;
// « coller sans mise en forme iphone notes » ne donne rien.
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/not9474646a9/26/mac/26
// et /guide/notes/not9474646a9/mac (Édition > Coller et adapter le style, Coller et conserver le style),
// support.apple.com/fr-fr/102553 (Option + Maj + Commande + V),
// /guide/notes/apd46c25187e/mac (Maj + Commande + B, Corps),
// /guide/iphone/iph1a9cae52c/ios et /guide/iphone/iph1ac0b3a2/ios (sélection et Format).
// Les guides iPhone consultés ne donnent pas de commande unique équivalente. Aucune image dans l'original.
const ui = UI.fr;
const FAQ = [
  { q: "Quel raccourci adapte le style du texte collé sur Mac ?", a: ["Option + Maj + Commande + V, ou Édition, Coller et adapter le style. Le texte prend le style autour du curseur. Si le raccourci diffère, vérifiez le menu Édition."] },
  { q: "Apple donne-t-il cette commande pour Notes sur iPhone ?", a: ["Les guides de sélection et de mise en forme consultés ne la décrivent pas. Ils expliquent le collage ordinaire et les commandes Format, sans donner une commande universelle de collage en texte brut."] },
  { q: "Pourquoi le texte collé reste-t-il un titre ?", a: ["Coller et adapter le style prend le style du point d’insertion. Dans un titre, le texte collé peut donc rester un titre. Sur Mac, appliquez Corps avec Maj + Commande + B avant de recoller."] },
  { q: "Comment corriger un passage déjà collé sur Mac ?", a: ["Copiez le passage concerné, gardez-le sélectionné, appliquez Corps si besoin, puis utilisez Édition, Coller et adapter le style pour remplacer la sélection."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="coller-sans-mise-en-forme-notes"
    intro="Pour coller dans Notes sur Mac sans reprendre la mise en forme d’origine, choisissez Édition, Coller et adapter le style, ou appuyez sur Option + Maj + Commande + V. Les guides iPhone d’Apple ne décrivent pas de commande équivalente."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Le raccourci Mac" }, { href: "#deja-colle", label: "Corriger un collage" },
      { href: "#iphone", label: "Sur iPhone" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Dans Pinto Notes" },
    ]}><p>Sur Mac, Coller et adapter le style applique au texte copié la mise en forme autour du curseur. Utilisez Option + Maj + Commande + V à la place de Commande + V. Sur iPhone, Apple décrit le collage et les outils de mise en forme sans nommer la même commande.</p>
      <PostCta slug="fr/coller-sans-mise-en-forme-notes" path="/fr/blog/coller-sans-mise-en-forme-notes" position="answer" ui={ui.cta} title="Des notes en Markdown"><p>Pinto Notes ressemble à Notes sur iPhone et Mac, avec du Markdown sous le texte affiché. Son éditeur Mac convertit le texte enrichi pris en charge en Markdown et utilise le texte brut si la conversion ne produit rien.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="mac">Coller sans le style d’origine sur Mac</h2>
    <Steps><li>Sélectionnez le texte source et appuyez sur Commande + C.</li><li>Ouvrez la note et placez le curseur où coller.</li><li>Choisissez Édition, Coller et adapter le style, ou appuyez sur Option + Maj + Commande + V.</li></Steps>
    <MenuPaths rows={[{ on: "Mac", steps: ["Édition", "Coller et adapter le style"], keys: "⌥⇧⌘V" }]} />
    <p>Le <a href="https://support.apple.com/fr-fr/guide/notes/not9474646a9/26/mac/26">guide de Notes pour macOS 26</a> donne ce menu. L’<a href="https://support.apple.com/fr-fr/102553">article d’Apple sur le collage Mac</a> donne le raccourci. Vérifiez le menu Édition si votre clavier utilise une autre combinaison.</p>
    <p>Par exemple, un paragraphe copié depuis une recette prendra le style du texte voisin dans votre note de cuisine. Si vous voulez conserver le style d’origine, le guide de Notes donne aussi Édition, Coller et conserver le style.</p>
    <h2 id="deja-colle">Corriger un texte déjà collé</h2>
    <p>Sélectionnez seulement le passage concerné pour laisser le reste de la note intact.</p>
    <Steps><li>Sélectionnez le passage et copiez-le avec Commande + C.</li><li>Gardez-le sélectionné. Pour obtenir du texte courant, appliquez Corps avec Maj + Commande + B.</li><li>Choisissez Édition, Coller et adapter le style pour remplacer la sélection par le texte copié.</li></Steps>
    <p>Apple donne Maj + Commande + B dans les <a href="https://support.apple.com/fr-fr/guide/notes/apd46c25187e/mac">raccourcis de Notes</a>. Pour changer une police ou une taille après le collage, consultez le <a href="/fr/blog/changer-police-notes-iphone">guide des polices</a>.</p>
    <h2 id="iphone">Ce qu’Apple décrit sur iPhone</h2>
    <p>Le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1a9cae52c/ios">guide d’édition du texte</a> explique la sélection, la copie et le collage. Il ne décrit pas Coller et adapter le style. Le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide de mise en forme de Notes</a> montre comment changer le texte une fois dans la note.</p>
    <Steps><li>Touchez la note pour placer le curseur. Apple décrit aussi le geste consistant à écarter trois doigts pour coller.</li><li>Pour sélectionner le texte collé, touchez deux fois un mot, puis étendez la sélection avec les poignées.</li><li>Utilisez le bouton Format pour corriger la mise en forme indésirable, par exemple le gras ou l’italique.</li></Steps>
    <p>Ces commandes modifient le texte sélectionné. Les pages consultées ne les présentent pas comme une commande unique qui retire tous les styles d’origine. Pour adapter le style au collage, utilisez la commande Mac quand vous disposez d’un Mac.</p>
    <h2 id="limites">Ce que signifie « adapter le style »</h2>
    <p>La commande prend le style de destination. Si le curseur se trouve dans un titre, le texte collé peut donc rester un titre. Sur Mac, appliquez Corps avec Maj + Commande + B avant de coller si vous voulez un paragraphe courant.</p>
    <p>Relisez le résultat avant de remplacer un long passage. Décidez si vous voulez conserver ses liens ou sa structure de liste. Pour un extrait qui demande un style distinct, le <a href="/fr/blog/bloc-code-notes-iphone">style Monostyle</a> est un autre choix.</p>
    <p>Si la commande de collage est grisée, Apple indique que l’app ne peut pas l’utiliser pour l’élément ou à cet emplacement. Cliquez dans le texte de la note et copiez une sélection de texte avant de réessayer.</p>
    <h2 id="pinto-notes">Le collage dans Pinto Notes</h2>
    <p>Pinto Notes stocke le texte des notes en Markdown et l’affiche mis en forme. Sur Mac, son éditeur traite d’abord les fichiers et les images, puis essaie de convertir le texte enrichi en Markdown. Si cette conversion ne produit rien, il colle le texte brut.</p>
    <p>Un collage enrichi peut garder sa structure grâce au Markdown. Vérifiez le résultat dans la note. Cette description concerne l’éditeur Mac. Si seul le style collé vous gêne, essayez d’abord la commande Mac de Notes.</p>
    <p>Vous pouvez aussi <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT ou Claude</a> (en anglais) pour lui permettre de lire et modifier vos notes. Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
