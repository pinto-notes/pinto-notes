import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "changer-police-notes-iphone");

// Version française de /blog/apple-notes-font. Recherche : « changer police notes iphone » → « changer taille police notes iphone », « changer couleur police notes iphone » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac (Police &gt; Afficher les polices), /guide/notes/apd97da26aed/mac (Taille du texte par défaut), /guide/notes/apd8b73d28be/mac, /guide/mac-help/mchlp2544/mac, /guide/iphone/iph1ac0b3a2/ios, /guide/iphone/iph3c076905a/ios (Grande police) et /guide/iphone/iph1f48544ab/ios (Réglages selon les apps), lus le 21 novembre 2026.
// La page iPhone ne donne pas de sélecteur de police comparable à celui du Mac ; aucun nom de commande n’est inventé. Faits Pinto repris de l’article anglais.

const ui = UI.fr;
const FAQ = [
  { q: "Comment agrandir le texte de Notes sur iPhone ?", a: ["Ouvrez Réglages &gt; Accessibilité &gt; Affichage et taille du texte &gt; Grande police et déplacez le curseur. « Tailles de police plus grandes » ajoute des choix. Pour Notes seule, utilisez « Réglages selon les apps »."] },
  { q: "Peut-on choisir une autre police sur Mac ?", a: ["Oui. Sélectionnez le texte, faites un clic avec la touche Contrôle, puis choisissez Police &gt; Afficher les polices. La modification concerne le texte sélectionné."] },
  { q: "Comment changer la couleur du texte ?", a: ["Sur Mac, ouvrez la fenêtre Polices depuis le texte sélectionné, puis le réglage de couleur du texte. Sur iPhone, Apple décrit le surlignage mais pas le même sélecteur de couleur."] },
  { q: "Pourquoi une nouvelle note commence-t-elle en gros caractères ?", a: ["Sur Mac, vérifiez Notes &gt; Réglages &gt; « Les nouvelles notes commencent par ». Ce choix définit le style du premier paragraphe, distinct de « Taille du texte par défaut »."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="changer-police-notes-iphone" intro="Sur Mac, sélectionnez du texte dans Notes puis ouvrez Police &gt; Afficher les polices pour changer sa police. Sur iPhone, utilisez les styles de texte ou les réglages d’accessibilité pour agrandir l’affichage."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#police", label: "Police sur Mac" }, { href: "#taille-mac", label: "Taille sur Mac" }, { href: "#taille-iphone", label: "Taille sur iPhone" }, { href: "#couleur", label: "Couleur et surlignage" }]}>
      <p>Sur Mac, Notes permet de changer la police du texte sélectionné. « Taille du texte par défaut » règle la taille des notes affichées. Sur iPhone, « Grande police » agrandit le texte des apps compatibles, dont Notes.</p>
      <PostCta slug="fr/changer-police-notes-iphone" path="/fr/blog/changer-police-notes-iphone" position="answer" ui={ui.cta} title="Vos notes avec ChatGPT ou Claude"><p>Pinto Notes ressemble à Notes sur iPhone et Mac. ChatGPT ou Claude peut lire et modifier les notes après connexion, avec leurs anciennes versions conservées.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="police">Changer la police d’un passage sur Mac</h2><MenuPaths rows={[{ on: "Texte sélectionné", steps: ["Clic avec Contrôle", "Police", "Afficher les polices"] }]} />
    <Steps><li>Ouvrez la note et sélectionnez le texte voulu.</li><li>Faites un clic avec la touche Contrôle et choisissez Police &gt; Afficher les polices.</li><li>Choisissez la police et la taille dans la fenêtre Polices.</li></Steps>
    <p>La modification s’applique à la sélection. Pour un titre ou du texte en gras, utilisez les commandes de mise en forme de la note. <a href="https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac">Voir le guide Notes sur Mac</a>.</p>
    <h2 id="taille-mac">Agrandir toutes les notes sur Mac</h2><MenuPaths rows={[{ on: "Toutes les notes", steps: ["Notes", "Réglages", "Taille du texte par défaut"] }, { on: "Une note", steps: ["Présentation", "Zoom avant"] }]} />
    <p>Dans Notes &gt; Réglages, déplacez le curseur « Taille du texte par défaut ». Apple indique que ce réglage change la taille du texte dans les notes. Pour agrandir seulement la note ouverte, utilisez la commande de zoom du menu Présentation. <a href="https://support.apple.com/fr-fr/guide/notes/apd8b73d28be/mac">Voir les options d’affichage</a>.</p>
    <p>« Les nouvelles notes commencent par » choisit le style du premier paragraphe d’une nouvelle note. Ce n’est pas le même réglage que la taille par défaut. <a href="https://support.apple.com/fr-fr/guide/notes/apd97da26aed/mac">Voir les réglages de Notes</a>.</p>
    <h2 id="taille-iphone">Agrandir Notes sur iPhone</h2><MenuPaths rows={[{ on: "Texte plus grand", steps: ["Réglages", "Accessibilité", "Affichage et taille du texte", "Grande police"] }, { on: "Notes seulement", steps: ["Réglages", "Accessibilité", "Réglages selon les apps", "Ajouter une app", "Notes"] }]} />
    <p>Dans « Grande police », déplacez le curseur. Activez « Tailles de police plus grandes » si nécessaire. « Texte en gras » se trouve aussi dans « Affichage et taille du texte ». Ces réglages concernent les apps compatibles, dont Notes. <a href="https://support.apple.com/fr-fr/guide/iphone/iph3c076905a/ios">Voir le guide d’accessibilité</a>.</p>
    <p>Pour traiter Notes à part, allez dans Réglages &gt; Accessibilité &gt; Réglages selon les apps. Touchez « Ajouter une app », choisissez Notes, puis ouvrez ses réglages. <a href="https://support.apple.com/fr-fr/guide/iphone/iph1f48544ab/ios">Voir la méthode d’Apple</a>.</p>
    <h2>Utiliser les styles sur iPhone</h2><p>Dans une note, le bouton de mise en forme permet de choisir un titre, un sous-titre, le gras ou l’italique. Sélectionnez d’abord le texte à modifier. Utilisez un titre pour séparer les parties d’une recette, par exemple. Si toute la note est trop petite, préférez les réglages de taille ci-dessus. <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">Voir le guide Notes sur iPhone</a> et les <a href="/blog/apple-notes-templates">modèles de notes</a>.</p>
    <h2 id="couleur">Couleur et surlignage</h2><p>Sur Mac, sélectionnez du texte, ouvrez Police &gt; Afficher les polices et utilisez la commande de couleur du texte de la fenêtre Polices. Le guide Mac décrit <a href="https://support.apple.com/fr-fr/guide/mac-help/mchlp2544/mac">cette fenêtre</a>. Pour surligner, sélectionnez le texte dans Notes et utilisez le bouton de surlignage ; le cercle voisin change sa couleur.</p>
    <p>Sur iPhone, Apple documente le surlignage parmi les options de mise en forme, mais pas le même sélecteur de police ou de couleur que sur Mac. Certaines fonctions de mise en forme sur Mac dépendent du compte utilisé. Les styles de paragraphe demandent des notes iCloud ou stockées sur Mac.</p>
    <h2>Et Pinto Notes ?</h2><p>Pinto Notes conserve les notes comme fichiers Markdown chiffrés, avec leurs versions précédentes. Après connexion, ChatGPT ou Claude peut les lire et les modifier. L’import des notes Apple sur Mac laisse les originaux intacts.</p>
  </LocalPostPage>;
}
