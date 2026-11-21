import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-craft-notes-personnelles");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative craft » renvoie surtout des suggestions sans lien avec l'app, comme « alternative craft fair » ; la requête « alternative craft prise de notes » ne donne rien. Le titre précise Craft et les notes personnelles. Aucun menu Apple Notes n'est cité. Faits Craft et Pinto suivis de /blog/craft-alternative-for-personal-notes ; les gestes Craft sont décrits sans inventer de libellé localisé.
const ui = UI.fr;
const CHECK = `Essai des notes personnelles Craft
- [ ] Comparer tout le texte au document d'origine
- [ ] Vérifier les titres et cases cochées
- [ ] Lire chaque cellule d'un petit tableau
- [ ] Ouvrir une image et une pièce jointe
- [ ] Suivre un lien vers un autre document importé
- [ ] Retrouver le contenu d'une page ou carte imbriquée
- [ ] Ouvrir et modifier la note sur iPhone
- [ ] Garder les originaux Craft et l'export`;
const FAQ = [
  { q: "Quelle alternative à Craft pour des notes personnelles ?", a: ["Pinto Notes convient si vous cherchez une édition proche de Notes, des dossiers et une connexion à ChatGPT ou Claude. Testez quelques exports Markdown. Gardez Craft si vous utilisez Collections, cartes ou espaces partagés."] },
  { q: "Pinto a-t-il un importeur Craft dédié ?", a: ["Non. Le parcours utilise l'import général de fichiers Markdown ou texte sur Mac. Il ne promet pas de reproduire tout un espace Craft, ses liens ou ses mises en page."] },
  { q: "Faut-il quitter Craft pour utiliser ChatGPT ou Claude ?", a: ["Non. Craft propose déjà des connexions MCP aux deux outils et son propre assistant IA. Essayez-les si l'accès par IA est votre seul motif de changement."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="alternative-craft-notes-personnelles"
    intro={<>Pinto Notes peut remplacer Craft pour des notes personnelles sur Mac et iPhone, dans un éditeur proche de Notes d'Apple. Gardez Craft si ses Collections ou ses documents partagés sont essentiels.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#choix", label: "Comparer vos notes" }, { href: "#rester", label: "Garder Craft" }, { href: "#export", label: "Essayer Markdown" }, { href: "#verifier", label: "Vérifier" }, { href: "#pinto", label: "Utiliser Pinto" }]}>
      <p>Essayez Pinto avec quelques documents personnels exportés en Markdown avant d'en déplacer davantage. Craft propose déjà l'IA et l'export Markdown ; comparez surtout l'édition et le classement dont vous avez besoin.</p>
      <PostCta slug="fr/alternative-craft-notes-personnelles" path="/fr/blog/alternative-craft-notes-personnelles" position="answer" title="Essayer quelques documents dans Pinto" ui={ui.cta}><p>Téléchargez Pinto Notes sur Mac et importez un petit dossier Markdown. Connectez ChatGPT ou Claude si vous voulez qu'il lise et modifie ces notes.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="choix">Partir des documents utilisés cette semaine</h2>
    <p>Une liste de travaux à la maison ne demande pas les mêmes outils qu'une base de projets reliés. Si vos documents Craft sont surtout du texte avec titres et cases à cocher, commencez par eux. Pinto propose dossiers, listes, tableaux et liens entre notes dans un éditeur proche de Notes. Il n'a pas d'app Windows ou Android ni de version web. Le <a href="/blog/best-notes-app-for-mac">comparatif des apps de notes sur Mac</a> élargit le choix.</p>
    <h2 id="rester">Quand garder Craft</h2>
    <p>Craft organise ses documents en blocs et cartes. Ses <a href="https://support.craft.do/en/organize-and-find/collections">Collections</a> ont des propriétés et relations, avec vues tableau, galerie et Kanban. Les dossiers et liens de Pinto ne recréent pas ce système.</p>
    <p>Selon les <a href="https://www.craft.do/pricing">formules Craft</a>, des espaces partagés et la publication de documents sont disponibles. Si des collègues utilisent votre espace, déplacez d'abord seulement les notes privées. Craft propose aussi son assistant IA et des <a href="https://support.craft.do/en/integrate/mcp">connexions à ChatGPT et Claude</a> qui peuvent créer ou modifier des documents avec les droits adaptés. Essayez cette connexion si votre seul besoin est l'accès par IA.</p>
    <h2 id="export">Essayer un petit export Markdown sur Mac</h2>
    <p>Prenez un document simple, comme « Travaux du couloir », avec une liste et un paragraphe sur la peinture. Ajoutez un document avec pièce jointe ou page imbriquée.</p>
    <ol><li>Dans Craft, ouvrez le premier document et utilisez le partage en haut à droite.</li><li>Choisissez l'export, puis Markdown. Répétez pour l'autre document.</li><li>Gardez ensemble les fichiers et leurs pièces jointes.</li><li>Sur Mac, dans Pinto Notes, ouvrez Fichier et choisissez l'import Markdown ou texte, puis le dossier.</li></ol>
    <p>Le <a href="https://support.craft.do/en/import-and-export/export/document">guide Craft</a> décrit cet export. Pinto accepte un dossier ou ZIP de fichiers Markdown ou texte ; chaque sous-dossier devient un dossier. Le <a href="/blog/import-your-notes">guide d'import Pinto</a> détaille ce parcours. L'export Markdown transporte la structure et la mise en forme de base, sans prouver la conversion des cartes ou des liens internes.</p>
    <h2 id="verifier">Comparer avant de déplacer davantage</h2>
    <p>Ouvrez chaque original près de sa copie. Lisez le dernier paragraphe, suivez les liens et contrôlez les pièces jointes. Un titre correct dans la liste des notes n'est qu'un début.</p>
    <Keep title="Vérifications pour l'export Craft" text={CHECK} note="Ces points indiquent quoi contrôler, sans promettre que tout sera conservé." />
    <p>Craft peut exporter en Markdown des éléments de Collection avec leurs propriétés sous forme de texte. Cela ne garantit pas leur conversion en Collections dans Pinto. Gardez les Collections importantes dans Craft tant que vous n'avez pas vérifié le résultat. Les versions antérieures des documents Craft ne font pas partie du transfert annoncé.</p>
    <h2 id="pinto">Écrire dans les copies Pinto</h2>
    <p>Si l'essai convient, importez les notes personnelles utiles. Rangez-les en dossiers et reliez-les. Pinto garde les versions créées après l'import, pas les révisions historiques de Craft. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier vos notes. Demandez-lui de lire « Travaux du couloir » et de proposer une prochaine action ; vérifiez la proposition puis toute modification enregistrée.</p>
  </LocalPostPage>;
}
