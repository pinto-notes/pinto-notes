import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-upnote-iphone-mac");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative upnote » propose « alternative upnote », « upnote alternative open source » et « upnote alternative free ». La requête avec iPhone et Mac ne renvoie rien. Aucun menu Apple Notes n'est cité. Les faits UpNote et Pinto suivent /blog/upnote-alternative-for-iphone-and-mac ; les commandes UpNote sont décrites sans supposer leur libellé français.
const ui = UI.fr;
const CHECK = `Essai du transfert depuis UpNote
- [ ] Comparer le nombre de fichiers exportés et de notes importées
- [ ] Lire entièrement une note longue
- [ ] Vérifier un tableau et une liste à cocher
- [ ] Ouvrir les images et pièces jointes de l'échantillon
- [ ] Suivre un lien vers une autre note
- [ ] Vérifier où arrivent les notes de chaque carnet
- [ ] Comparer une note avec une section repliable
- [ ] Ouvrir les notes importées sur iPhone
- [ ] Garder l'export et la bibliothèque UpNote d'origine`;
const FAQ = [
  { q: "Pinto peut-il importer un export UpNote ?", a: ["Pinto accepte sur Mac un dossier ou ZIP de fichiers Markdown ou texte. Utilisez cet import général pour un export UpNote. Il n'existe pas d'import dédié : testez quelques notes d'abord."] },
  { q: "L'export Markdown est-il inclus dans UpNote gratuit ?", a: ["UpNote classe l'export texte, PDF, HTML et Markdown parmi ses fonctions Premium. Vérifiez votre abonnement avant de compter sur cet export."] },
  { q: "Les sections repliables seront-elles identiques ?", a: ["Ce transfert ne le garantit pas. Comparez le texte entier et son affichage, puis gardez l'original UpNote."] },
  { q: "Pinto remplace-t-il UpNote sur Windows ?", a: ["Non. Pinto existe seulement sur Mac et iPhone, sans app Windows, Linux ou Android ni version web."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="alternative-upnote-iphone-mac"
    intro={<>Pinto Notes est une alternative gratuite à UpNote sur Mac et iPhone si vous cherchez une interface proche de Notes avec accès à ChatGPT ou Claude. Testez d'abord quelques fichiers Markdown.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#rester", label: "Garder UpNote" }, { href: "#export", label: "Exporter un essai" }, { href: "#import", label: "Importer sur Mac" }, { href: "#verifier", label: "Vérifier" }, { href: "#pinto", label: "Utiliser une IA" }]}>
      <p>Choisissez Pinto pour des notes sur iPhone et Mac que ChatGPT ou Claude pourra lire et modifier après connexion. Importez un petit dossier Markdown ou texte et comparez les copies. Gardez UpNote si vous dépendez de ses apps Windows, Linux ou Android.</p>
      <PostCta slug="fr/alternative-upnote-iphone-mac" path="/fr/blog/alternative-upnote-iphone-mac" position="answer" title="Essayer quelques notes UpNote dans Pinto" ui={ui.cta}><p>Téléchargez Pinto Notes sur Mac. Importez un petit export Markdown et vérifiez les notes avant de déplacer le reste.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="rester">Quand garder UpNote</h2>
    <p>UpNote fonctionne sur Mac et iPhone, mais aussi sur Windows, Linux et Android. Pinto ne couvre pas ces derniers appareils ni le web. UpNote propose des carnets imbriqués, des sections repliables et une extension de capture pour Chrome, Safari et Firefox, selon sa <a href="https://getupnote.com/">présentation</a>. Un import Markdown ne promet pas de recréer ces usages.</p>
    <h2 id="export">Exporter un petit échantillon</h2>
    <p>Choisissez une note longue, une liste à cocher, une pièce jointe, un lien vers une autre note et une section repliable si vous en utilisez. Un texte court ne teste pas assez de choses.</p>
    <Steps><li>Sur Mac, sélectionnez ces notes dans la liste UpNote.</li><li>Dans le panneau de droite, lancez l'export. Choisissez Markdown et des fichiers séparés.</li><li>Gardez le dossier entier, y compris son dossier de fichiers pour images et pièces jointes.</li></Steps>
    <p>Ces étapes viennent du <a href="https://help.getupnote.com/import-and-export/export-notes">guide UpNote</a>. L'export texte existe aussi. UpNote réserve l'export à Premium : vérifiez votre formule. Si l'échantillon passe, l'export de toutes les notes depuis le menu Fichier sur Mac est l'étape suivante.</p>
    <h2 id="import">Utiliser l'import Markdown de Pinto sur Mac</h2>
    <p>Dans Pinto Notes, ouvrez Fichier et choisissez l'import Markdown ou texte, puis sélectionnez le dossier. Le <a href="/blog/import-your-notes">guide d'import</a> précise qu'un dossier ou ZIP convient et que chaque sous-dossier devient un dossier. Cela ne garantit pas le même classement que tous les carnets UpNote. Vérifiez l'emplacement des notes et gardez les originaux.</p>
    <h2 id="verifier">Comparer avant de changer</h2>
    <p>Ouvrez l'original à côté de la copie. Lisez jusqu'à la fin d'une note longue, suivez les liens et vérifiez le contenu repliable. Le sommet de la note peut paraître correct alors que la suite pose problème. Ce parcours n'a pas été testé ici sur un nouvel export UpNote.</p>
    <Keep title="Vérifier l'essai UpNote" text={CHECK} note="Commencez par l'échantillon, puis reprenez les points utiles pour votre bibliothèque." />
    <p>Notez les réparations nécessaires. Si un lien ou une pièce jointe manque, gardez la source ouverte pendant la correction. Si trop de fonctions quotidiennes ne passent pas, continuez dans UpNote.</p>
    <h2 id="pinto">Travailler avec une IA connectée</h2>
    <p>Pinto Notes fonctionne comme Notes sur Mac et iPhone. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier les notes. Demandez d'abord un résumé des tâches ouvertes d'une note importée. Comparez-le à la source avant de faire ajouter une étape, puis contrôlez la modification.</p>
    <p>Pinto garde chaque version antérieure créée chez lui ; il n'importe pas l'historique UpNote. Il peut exporter sa bibliothèque en fichiers Markdown dans des dossiers ZIP. Les notes actuellement verrouillées restent hors de cet export. Pour les ouvrir, utilisez le mot de passe, Face ID ou Touch ID. Les fichiers que Pinto ne peut récupérer sont signalés. Ouvrez quelques fichiers avant de vous fier à l'archive. Conservez aussi l'export UpNote d'origine.</p>
  </LocalPostPage>;
}
