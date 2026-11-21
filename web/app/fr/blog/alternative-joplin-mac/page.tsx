import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-joplin-mac");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative joplin » propose « alternative joplin », « equivalent joplin » et « joplin alternative open source ». « alternative joplin mac » ne renvoie rien. Aucun menu Apple Notes n'est cité. Faits Joplin et Pinto suivis de /blog/joplin-alternative-for-mac ; le parcours d'export Joplin est décrit sans nom de menu non vérifié.
const ui = UI.fr;
const CHECK = `Vérifier le passage de Joplin à Pinto Notes
- [ ] Comparer le nombre de notes du petit carnet
- [ ] Lire une note longue à côté de l'original Joplin
- [ ] Ouvrir une image et un fichier joints
- [ ] Suivre un lien entre deux notes importées
- [ ] Vérifier un tableau et une liste à cocher
- [ ] Contrôler titre, dates et texte des tags
- [ ] Garder la sauvegarde JEX et l'export Markdown`;
const FAQ = [
  { q: "Pinto peut-il importer une sauvegarde JEX ?", a: ["Non par ce parcours. Pinto accepte un dossier ou ZIP de fichiers Markdown ou texte. Gardez le JEX pour une réimportation dans Joplin et créez un export Markdown séparé."] },
  { q: "Quel export Joplin utiliser ?", a: ["Essayez Markdown + Front Matter. Joplin y place titre, dates et tags. Pinto lit ces champs et ajoute les tags en texte dans la note. Gardez les pièces jointes avec les fichiers."] },
  { q: "Peut-on continuer sur Linux après le changement ?", a: ["Vous pouvez garder Joplin, mais l'import ne relie pas les deux apps. Pinto existe seulement sur Mac et iPhone, sans Linux, Windows ou Android ni web."] },
  { q: "Faut-il quitter Joplin pour connecter Claude ?", a: ["Non. Joplin documente un serveur MCP local via Web Clipper, avec recherche, lecture, création ou modification selon les outils activés."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="alternative-joplin-mac"
    intro={<>Pinto Notes peut remplacer Joplin sur Mac et iPhone si vous préférez un éditeur proche de Notes d'Apple. Gardez Joplin si vous avez besoin de Windows, Linux ou Android.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#choix", label: "Comparer" }, { href: "#rester", label: "Garder Joplin" }, { href: "#export", label: "Exporter et importer" }, { href: "#verifier", label: "Vérifier les notes" }, { href: "#pinto", label: "Utiliser une IA" }]}>
      <p>Essayez Pinto avec un petit carnet Joplin exporté en Markdown. Gardez une sauvegarde JEX distincte pour Joplin. Les deux apps peuvent donner accès aux notes à une IA ; comparez leur éditeur et leur connexion.</p>
      <PostCta slug="fr/alternative-joplin-mac" path="/fr/blog/alternative-joplin-mac" position="answer" title="Essayer un carnet Joplin dans Pinto" ui={ui.cta}><p>Téléchargez Pinto Notes sur Mac et importez un dossier Markdown. Connectez ChatGPT ou Claude si vous voulez qu'il lise et modifie les notes.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="choix">Comparer les appareils et l'éditeur</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Besoin</th><th scope="col">Joplin</th><th scope="col">Pinto Notes</th></tr></thead><tbody><tr><th scope="row">Mac et iPhone</th><td>Disponible</td><td>Disponible</td></tr><tr><th scope="row">Windows, Linux, Android</th><td>Disponible</td><td>Aucune app</td></tr><tr><th scope="row">Édition</th><td>Markdown et texte enrichi</td><td>Proche de Notes d'Apple</td></tr><tr><th scope="row">IA dans les notes</th><td>MCP local via Web Clipper</td><td>Connexion hébergée pour ChatGPT ou Claude</td></tr></tbody></table></div>
    <p>Joplin énumère ses appareils dans son <a href="https://joplinapp.org/help/install/">guide d'installation</a>. Pinto n'existe que sur Mac et iPhone, sans app Windows, Linux ou Android ni version web. Un Mac à la maison ne remplace pas Joplin sur un téléphone Android ou un ordinateur Windows au travail.</p>
    <h2 id="rester">Pourquoi garder Joplin</h2>
    <p>Joplin a des éditeurs <a href="https://joplinapp.org/help/apps/rich_text_editor/">Markdown et texte enrichi</a>. Si les symboles Markdown vous gênent, essayez d'abord le texte enrichi. Joplin permet aussi de choisir la <a href="https://joplinapp.org/help/apps/sync/">synchronisation</a>, notamment Nextcloud, WebDAV et Dropbox. L'import Markdown dans Pinto ne transfère pas ce réglage.</p>
    <p>Si vous dépendez de <a href="https://joplinapp.org/help/apps/plugins/">plugins Joplin</a>, examinez leur rôle avant de changer. Importer les notes ne déplace pas les plugins. Le <a href="https://joplinapp.org/help/apps/ai_mcp/">serveur MCP Joplin</a> passe par Web Clipper en local. Il permet à des apps IA de chercher et lire des notes, puis de créer ou modifier celles-ci si les outils correspondants sont activés. Essayez-le si Claude est votre seule raison de partir.</p>
    <h2 id="export">Exporter en Markdown, garder JEX</h2>
    <p>Le <a href="https://joplinapp.org/help/apps/import_export/">guide Joplin</a> présente JEX comme une sauvegarde des notes et métadonnées à réimporter dans Joplin. Gardez-en une. Pour Pinto, faites un export Markdown distinct.</p>
    <Steps><li>Exportez un petit carnet au format Markdown + Front Matter dans son propre dossier. Prenez des notes avec vos pièces jointes et mises en forme habituelles.</li><li>Gardez aussi les fichiers de ressources. Ouvrez un fichier Markdown dans un éditeur de texte pour vérifier son contenu.</li><li>Sur Mac, ouvrez Pinto Notes, choisissez l'import Markdown ou texte dans Fichier, puis le dossier ou son ZIP. Relisez le bilan.</li></Steps>
    <p>Le <a href="https://joplinapp.org/help/dev/spec/interop_with_frontmatter/">guide Front Matter</a> décrit titre, dates et tags au-dessus du texte. Pinto lit ces champs et ajoute les tags comme texte. Vérifiez le résultat. Chaque sous-dossier importé devient un dossier. Pinto reprend les images et fichiers liés qu'il retrouve. Les fichiers sources restent tels quels. JEX n'est pas importé par ce parcours. Voyez le <a href="/blog/import-your-notes">guide d'import</a>.</p>
    <h2 id="verifier">Contrôler le carnet avant de poursuivre</h2>
    <p>Comparez les copies à Joplin. Ouvrez un lien et une pièce jointe au lieu de regarder seulement le nombre de notes.</p>
    <Keep title="Contrôle de l'import Joplin" text={CHECK} note="Cette liste est à remplir avec votre propre export, pas un résultat de test déjà effectué." />
    <p>Le transfert ne promet ni plugins, ni alarmes des tâches, ni ancienne synchronisation, ni historique Joplin. Si un lien ou fichier manque, réglez le problème dans l'échantillon avant d'importer le reste.</p>
    <h2 id="pinto">Travailler dans les notes importées</h2>
    <p>Pinto garde les versions antérieures des notes modifiées chez lui, sans récupérer l'historique Joplin. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier ces notes. Pinto utilise une connexion hébergée ; Joplin documente une connexion MCP locale. Demandez à l'IA de trouver une note de projet et de citer les lignes qui justifient les tâches ouvertes. Vérifiez avant de lui faire ajouter une étape.</p>
    <p>Commencez par le carnet utilisé cette semaine. Écrivez dans les copies pendant quelques jours et ouvrez-les sur iPhone. Déplacez le reste seulement après avoir vérifié l'éditeur et l'échantillon, en gardant l'export d'origine.</p>
  </LocalPostPage>;
}
