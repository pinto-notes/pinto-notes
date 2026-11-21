import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-sur-windows");

// Version française de /blog/apple-notes-on-windows. Recherche : « notes iphone sur windows » → « notes apple sur windows », « notes iphone sur pc », « télécharger notes iphone sur pc » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/105119, /guide/icloud/mm8685520792/icloud, /guide/icloud/mmc8a8e49dbd/icloud, /guide/icloud/mmc0cd6edf/icloud, /guide/icloud/mmcd9c9e9b71/icloud, /guide/icloud/mm000b55f946/icloud, /guide/icloud/mm198698c442/icloud et /guide/icloud/mm6be2394337/icloud, lus le 21 novembre 2026.
// Termes des commandes web repris de ces pages ; si un bouton n’a pas de nom stable, l’action est décrite. Faits Pinto repris de l’article anglais.

const ui = UI.fr;
const FAQ = [
  { q: "Comment ouvrir Notes sur Windows 11 ?", a: ["Allez sur icloud.com/notes dans un navigateur et connectez-vous avec votre compte Apple. Seules les notes stockées dans iCloud y apparaissent."] },
  { q: "Faut-il installer iCloud pour Windows ?", a: ["Non. Apple décrit l’accès à Notes dans le navigateur. Son app iCloud pour Windows propose d’autres données iCloud, mais pas Notes dans la liste de ses fonctions."] },
  { q: "Peut-on ajouter une pièce jointe depuis le PC ?", a: ["Apple demande de l’ajouter dans Notes sur iPhone ou Mac. Vous pourrez ensuite la consulter ou la télécharger sur iCloud.com."] },
  { q: "Pourquoi une note verrouillée ne s’ouvre-t-elle pas ?", a: ["Une note protégée par le code de l’appareil ou le mot de passe de connexion du Mac ne s’ouvre pas sur iCloud.com. Il faut un mot de passe Notes distinct. Sur les appareils Apple, le verrouillage peut utiliser un mot de passe, Face ID ou Touch ID."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-sur-windows" intro="Pour consulter vos notes iPhone sur Windows, ouvrez icloud.com/notes et connectez-vous à votre compte Apple. Les notes doivent être stockées dans iCloud."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#ouvrir", label: "Ouvrir Notes" }, { href: "#absentes", label: "Notes absentes" }, { href: "#modifier", label: "Modifier une note" }, { href: "#limites", label: "Limites du navigateur" }]}>
      <p>Sur Windows, y compris Windows 11, utilisez <a href="https://www.icloud.com/notes">Notes sur iCloud.com</a>. Vous pouvez lire et modifier les notes iCloud. Les modifications se retrouvent sur vos appareils Apple si la synchronisation de Notes est activée.</p>
      <PostCta slug="fr/notes-iphone-sur-windows" path="/fr/blog/notes-iphone-sur-windows" position="answer" ui={ui.cta} title="Vous utilisez aussi un Mac ?"><p>Pinto Notes fonctionne sur iPhone et Mac, sans app Windows ni version web. Après connexion, ChatGPT ou Claude peut lire et modifier les notes dans Pinto Notes.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="ouvrir">Ouvrir Notes sur un PC Windows</h2>
    <Steps><li>Ouvrez <a href="https://www.icloud.com/notes">icloud.com/notes</a> dans votre navigateur.</li><li>Connectez-vous avec le compte Apple utilisé pour vos notes iCloud.</li><li>Choisissez un dossier, puis la note à lire ou modifier.</li></Steps>
    <p>Apple indique que Notes est accessible sur iCloud.com depuis un PC Windows. Utilisez une version récente de Firefox, Chrome, Edge ou Opera. <a href="https://support.apple.com/fr-fr/105119">Voir les fonctions disponibles</a>.</p>
    <h2 id="absentes">Si certaines notes n’apparaissent pas</h2>
    <p>iCloud.com montre les notes du compte iCloud. Les notes stockées dans Gmail, Yahoo ou « Sur mon iPhone » n’y figurent pas. Sur l’iPhone ou le Mac, regardez dans quel compte se trouve la note. Le guide <a href="/fr/blog/ou-sont-stockees-notes-iphone">où sont stockées les notes</a> aide à le vérifier.</p>
    <MenuPaths rows={[{ on: "iPhone", steps: ["Réglages", "Votre nom", "iCloud", "Tout afficher", "Notes", "Synchroniser cet iPhone"] }, { on: "Mac récent", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes", "Synchroniser ce Mac"] }]} />
    <p>Activez la synchronisation de Notes sur chaque appareil et utilisez le même compte Apple. Apple donne les chemins selon la version du système dans son <a href="https://support.apple.com/fr-fr/guide/icloud/mm8685520792/icloud">guide de configuration</a>.</p>
    <p>Si l’accès web est désactivé, ouvrez Réglages &gt; votre nom &gt; iCloud &gt; iCloud.com sur l’iPhone et activez « Autoriser l’accès aux données ». La Protection avancée des données désactive cet accès quand vous l’activez. Un appareil approuvé autorise ensuite l’accès temporaire. <a href="https://support.apple.com/fr-fr/guide/icloud/mmc8a8e49dbd/icloud">Voir les étapes d’Apple</a>.</p>
    <h2 id="modifier">Écrire et modifier dans le navigateur</h2>
    <Steps><li>Utilisez le bouton de création en haut de Notes pour ouvrir une nouvelle note.</li><li>Saisissez votre texte. iCloud.com enregistre les changements automatiquement.</li><li>Sélectionnez du texte, puis choisissez un style dans la barre d’outils pour le mettre en forme.</li></Steps>
    <p>Pour une liste de pointage, placez le curseur sur une ligne vide ou sélectionnez plusieurs lignes, puis utilisez la commande de liste à cocher. Cliquez dans le cercle d’un élément pour le marquer comme terminé. Apple détaille <a href="https://support.apple.com/fr-fr/guide/icloud/mmc0cd6edf/icloud">la création des notes</a> et <a href="https://support.apple.com/fr-fr/guide/icloud/mmcd9c9e9b71/icloud">les listes</a>.</p>
    <h2 id="limites">Ce que le navigateur ne fait pas</h2>
    <p>Ajoutez les pièces jointes depuis Notes sur iPhone ou Mac. Sur Windows, double-cliquez sur une pièce jointe pour l’ouvrir ou la télécharger. Pour un scan, ouvrez sa vignette puis utilisez le bouton de téléchargement. <a href="https://support.apple.com/fr-fr/guide/icloud/mm198698c442/icloud">Voir le guide des pièces jointes</a>.</p>
    <p>Sur un appareil Apple, une note peut être protégée par mot de passe, Face ID ou Touch ID. Sur iCloud.com, Apple indique qu’un mot de passe Notes distinct permet l’ouverture. Les notes verrouillées avec le code de l’appareil ou le mot de passe de connexion du Mac ne s’y ouvrent pas. Leurs pièces jointes s’affichent comme des espaces réservés. La gestion du verrouillage se fait sur un appareil Apple. <a href="https://support.apple.com/fr-fr/guide/icloud/mm000b55f946/icloud">Voir les limites</a>.</p>
    <p>Apple ne présente pas Notes comme une fonction de l’app iCloud pour Windows. La voie documentée est le navigateur. Si vous avez besoin d’une vraie app Windows, comparez les <a href="/fr/blog/alternatives-notes-apple">alternatives à Notes</a>, dont <a href="/fr/blog/notes-iphone-vs-evernote">Evernote</a>.</p>
    <h2>Et Pinto Notes ?</h2><p>Pinto Notes fonctionne sur iPhone et Mac, sans app Windows, Android ou web. Il garde les notes en fichiers Markdown chiffrés et conserve les anciennes versions. ChatGPT ou Claude peut y accéder après <a href="/blog/connect-chatgpt-to-your-notes">connexion</a>. Vous pouvez <a href="/blog/move-from-apple-notes">importer vos notes Apple</a> sur Mac sans les modifier dans Notes.</p>
    <Figure shot={SHOTS.welcome} caption="La note de bienvenue dans Pinto Notes sur Mac. La capture est en anglais." />
  </LocalPostPage>;
}
