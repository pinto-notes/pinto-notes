import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "widget-notes-iphone");

// Version française de /blog/apple-notes-widget. Recherche : « widget notes iphone » → « widget notes apple », « widget notes ios », « notes widget iphone lock screen » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/118610 (Modifier, Ajouter un widget, Ajouter le widget, OK), /guide/iphone/iphb8f1bf206/ios, /guide/iphone/iph92579feda/ios (Compte par défaut, Accès depuis l’écran verrouillé), /guide/notes/apdc28344070/mac et /guide/mac-help/mchl52be5da5/mac, lus le 21 novembre 2026.
// Le guide iPhone emploie parfois une icône sans nom ; l’action est alors décrite. Aucun widget Notes spécifique à l’écran verrouillé n’est promis. Faits Pinto repris de l’article anglais.

const ui = UI.fr;
const FAQ = [
  { q: "Comment ajouter un widget Notes sur iPhone ?", a: ["Maintenez le doigt sur une zone vide de l’écran d’accueil, touchez Modifier puis Ajouter un widget. Cherchez Notes, choisissez une taille, touchez Ajouter le widget puis OK."] },
  { q: "Peut-on mettre Notes sur l’écran verrouillé ?", a: ["Regardez les widgets proposés dans la galerie de l’écran verrouillé. Les guides Apple cités ici ne confirment pas de widget Notes à cet endroit. « Accès depuis l’écran verrouillé » est un réglage différent."] },
  { q: "Dans quel compte le widget crée-t-il une note ?", a: ["Dans celui choisi sous Réglages &gt; Apps &gt; Notes &gt; Compte par défaut. Apple indique que ce réglage vaut pour Siri et le widget Notes."] },
  { q: "Peut-on avoir plusieurs widgets Notes sur Mac ?", a: ["Oui. Apple permet plusieurs widgets pour accéder à différentes notes ou dossiers, sur le bureau ou dans le centre de notifications."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="widget-notes-iphone" intro="Sur iPhone, ajoutez Notes depuis la galerie de widgets de l’écran d’accueil. Sur Mac, ajoutez un widget Note ou Dossier depuis la galerie du bureau ou du centre de notifications."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#iphone", label: "Écran d’accueil" }, { href: "#verrouille", label: "Écran verrouillé" }, { href: "#mac", label: "Sur Mac" }, { href: "#probleme", label: "Si le widget ne marche pas" }]}>
      <p>Sur iPhone, maintenez le doigt sur l’écran d’accueil puis ouvrez la galerie de widgets et cherchez Notes. L’écran verrouillé a sa propre galerie. Les guides Apple ne confirment pas de widget Notes à cet emplacement.</p>
      <PostCta slug="fr/widget-notes-iphone" path="/fr/blog/widget-notes-iphone" position="answer" ui={ui.cta} title="Faire modifier la note par votre IA"><p>Pinto Notes ressemble à Notes sur iPhone et Mac. Après connexion, ChatGPT ou Claude peut lire et modifier les notes. Pinto conserve leurs anciennes versions.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="iphone">Ajouter le widget Notes sur iPhone</h2><MenuPaths rows={[{ on: "Écran d’accueil", steps: ["Maintenir le doigt", "Modifier", "Ajouter un widget", "Notes"] }]} />
    <Steps><li>Allez sur la page de l’écran d’accueil voulue.</li><li>Maintenez le doigt sur une zone vide jusqu’à ce que les apps s’animent. Touchez Modifier, puis Ajouter un widget.</li><li>Cherchez Notes, choisissez une taille ou une présentation, puis touchez Ajouter le widget.</li><li>Placez-le et touchez OK.</li></Steps>
    <p>Pour voir les choix du widget, maintenez le doigt dessus et ouvrez sa commande de modification. Les options peuvent varier selon sa taille. <a href="https://support.apple.com/fr-fr/guide/iphone/iphb8f1bf206/ios">Voir le guide d’Apple</a>.</p>
    <h2 id="verrouille">Notes et l’écran verrouillé</h2><p>L’écran verrouillé a une galerie distincte. Maintenez le doigt sur cet écran, touchez Personnaliser puis l’emplacement des widgets. Choisissez parmi les widgets proposés. Si Notes n’y figure pas, les étapes pour l’écran d’accueil ne l’ajoutent pas sous l’horloge. <a href="https://support.apple.com/fr-fr/118610">Voir les instructions Apple</a>.</p>
    <p>Réglages &gt; Apps &gt; Notes &gt; « Accès depuis l’écran verrouillé » permet de choisir « Toujours créer une nouv. note », « Reprendre la dernière note » ou de désactiver l’accès. Ce réglage ne crée pas de widget. <a href="https://support.apple.com/fr-fr/guide/iphone/iph92579feda/ios">Voir les réglages de Notes</a>.</p>
    <p>Vous pouvez aussi afficher des widgets dans « Affichage du jour » en balayant vers la droite depuis l’écran verrouillé. Si cet affichage est masqué lorsque le téléphone est verrouillé, vérifiez l’accès autorisé dans les réglages Face ID et code ou Touch ID et code.</p>
    <h2 id="mac">Ajouter un widget Notes sur Mac</h2><p>Apple décrit des widgets Note et Dossier, sur le bureau ou dans le centre de notifications. Vous pouvez en ajouter plusieurs pour différents contenus. <a href="https://support.apple.com/fr-fr/guide/notes/apdc28344070/mac">Voir le guide Notes</a>.</p>
    <Steps><li>Faites un clic avec la touche Contrôle sur le fond du bureau et ouvrez la galerie de widgets.</li><li>Cherchez Notes et choisissez le widget.</li><li>Cliquez pour le placer ou faites-le glisser sur le bureau, puis terminez.</li></Steps>
    <p>Pour le centre de notifications, cliquez sur la date et l’heure dans la barre des menus, puis ouvrez la galerie en bas. Le menu du widget peut proposer une autre taille ou une modification. <a href="https://support.apple.com/fr-fr/guide/mac-help/mchl52be5da5/mac">Voir les options sur Mac</a>.</p>
    <h2 id="probleme">Si le widget affiche la mauvaise note</h2><ul><li>Sur iPhone, ouvrez les options de modification du widget pour voir son contenu choisi.</li><li>Pour les suggestions absentes, vérifiez Réglages &gt; Apps &gt; Notes &gt; Recherche.</li><li>Si une nouvelle note va dans le mauvais compte, vérifiez « Compte par défaut » au même endroit.</li><li>Sur Mac, vérifiez l’affichage des widgets du bureau dans Réglages Système &gt; Bureau et Dock.</li></ul>
    <p>Ces réglages ne garantissent pas de résoudre tous les widgets vides ou anciens. Si la note manque aussi dans la recherche de Notes, suivez les <a href="/fr/blog/recherche-notes-iphone-ne-fonctionne-pas">vérifications de recherche</a>. Pour d’autres raccourcis, voyez les <a href="/fr/blog/astuces-notes-iphone">astuces Notes</a>.</p>
    <h2>Et Pinto Notes ?</h2><p>Un widget sert à ouvrir une note. Pinto Notes permet aussi à ChatGPT ou Claude de lire et modifier le contenu après connexion. Il conserve les versions précédentes. Vos notes Apple peuvent être importées sur Mac sans changer les originaux.</p>
  </LocalPostPage>;
}
