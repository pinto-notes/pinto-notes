import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "application-notes-developpeurs");

// Version française de /blog/notes-app-for-developers. Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « application notes développeur » renvoie « notes app developer » ; « application de notes pour développeurs », « application prise de notes développeur » et « notes pour développeurs » ne renvoient aucune suggestion ; titre descriptif. « notes iphone code » renvoie « apple notes code block ».
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Monostyle, Maj + Commande + M), apde615d29c2/mac (Édition > Ajouter un lien), not201900c07/mac (Fichier > Exporter vers, Markdown ; copie de contenu Markdown). Aucun nom non vérifié pour une commande d'export secondaire.
// Faits des autres apps repris de l'article anglais et de ses sources officielles, lues le 21 novembre 2026 : obsidian.md/help, notion.com/help et developers.notion.com, joplinapp.org/help, bear.app/faq. Pas de prix ni d'essai pratique des connexions.

const ui = UI.fr;
const ROWS = [
  ["Obsidian", "Blocs de code balisés ; fichiers Markdown locaux", "Lire directement le dossier du coffre ou utiliser la CLI officielle"],
  ["Notion", "Blocs de code par langage ; export Markdown", "MCP officiel pour chercher et modifier les pages"],
  ["Joplin", "Éditeur Markdown avec blocs de code", "App de terminal ou MCP local officiel via Web Clipper"],
  ["Bear", "Markdown, blocs de code et export .md", "bearcli et MCP local officiels sur Mac"],
  ["Notes d'Apple", "Monostyle et export Markdown sur Mac", "Exporter ou copier le Markdown pour un outil"],
  ["Pinto Notes", "Code Block dans le menu / ; fichiers Markdown", "MCP hébergé pour Claude Code, Codex et Gemini CLI"],
];
const FAQ = [
  { q: "Que vérifier dans une app de notes pour coder ?", a: ["Testez la mise en forme du code, l'export Markdown, la recherche et les liens. Si un agent doit consulter les notes, décidez s'il passera par les fichiers locaux, un outil de terminal ou MCP."] },
  { q: "Quelle app laisse un agent lire les fichiers locaux ?", a: ["Obsidian garde son coffre comme dossier de fichiers Markdown. Un agent ayant accès à ce dossier peut les lire. Sa CLI officielle utilise l'app Obsidian en cours d'exécution."] },
  { q: "Notes d'Apple convient-il aux notes de programmation ?", a: ["Oui, pour les explications, listes et courts extraits. Sur Mac, Maj + Commande + M applique Monostyle. Vous pouvez relier des notes et exporter une note en Markdown, mais l'export reste une copie séparée."] },
  { q: "Gemini CLI peut-il utiliser Pinto Notes ?", a: ["Oui. Le guide MCP de Pinto Notes le cite avec Claude Code et Codex. Une fois connecté et autorisé, l'agent peut chercher, lire et modifier les notes."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="application-notes-developpeurs"
    intro="Obsidian convient si vous voulez garder des fichiers Markdown locaux dans Git. Pinto Notes offre l'allure de Notes sur iPhone et Mac, avec des notes qu'un agent de code peut lire et modifier."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparatif", label: "Comparer les apps" }, { href: "#essai", label: "Points à tester" },
      { href: "#obsidian", label: "Fichiers locaux" }, { href: "#pinto", label: "Pinto Notes" },
      { href: "#modeles", label: "Modèles pour développeurs" },
    ]}>
      <p>Obsidian convient à une bibliothèque de fichiers, Notion aux documents de projet partagés, Joplin aux carnets Markdown et au terminal. Bear relie des notes avec extraits de code ; Notes d'Apple permet une saisie rapide. Pinto Notes relie Claude Code, Codex et Gemini CLI à vos notes par un serveur MCP hébergé.</p>
      <PostCta slug="fr/application-notes-developpeurs" path="/fr/blog/application-notes-developpeurs" position="answer" ui={ui.cta} title="Des notes utilisables par votre agent de code">
        <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Ajoutez Code Block avec le menu /, puis connectez votre agent pour lire et modifier vos notes Markdown.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600} alt="Notes de réunion quotidienne dans Pinto Notes sur Mac, avec les rubriques Hier et Aujourd'hui et un blocage lié à une clé API de test." caption="Le modèle de réunion quotidienne dans Pinto Notes. Un agent connecté peut préparer la rubrique Hier à partir des commits." />}
    faq={FAQ}>
    <h2 id="comparatif">Six apps de notes pour développer</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Code et Markdown</th><th scope="col">Accès aux notes par un outil</th></tr></thead><tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    <p>Fonctions vérifiées dans les guides des éditeurs le 21 novembre 2026. Le tableau présente des connexions documentées, pas un test pratique de chaque app.</p>

    <h2 id="essai">Tester avec vos propres notes</h2>
    <ul>
      <li>Collez un vrai extrait, recopiez-le dans l'éditeur et contrôlez l'indentation et la ponctuation.</li>
      <li>Décidez si Git doit lire des fichiers ordinaires ou si un export Markdown suffit.</li>
      <li>Cherchez un nom de fonction et un bout de message d'erreur, avec sa ponctuation.</li>
      <li>Reliez une décision au bug qui l'a motivée, puis essayez de revenir à la décision.</li>
      <li>Demandez à l'agent de lire une note et de changer une ligne. Vérifiez le résultat et l'annulation.</li>
    </ul>

    <h2 id="obsidian">Obsidian pour une bibliothèque Markdown locale</h2>
    <p>Le coffre Obsidian est un dossier de fichiers Markdown. Vous pouvez le garder dans Git ou le faire lire par un agent ayant accès au dossier. Les blocs de code acceptent un nom de langage, les liens relient l'extrait à son explication et la recherche peut filtrer par fichier ou chemin.</p>
    <p>Sa <a href="https://obsidian.md/help/cli">CLI officielle</a> cherche, lit et crée des notes, et peut ajouter du texte. Elle utilise l'app Obsidian ; la première commande la lance si besoin. L'accès direct aux fichiers permet au terminal et à l'app de travailler sur les mêmes notes.</p>

    <h2 id="notion">Notion pour la documentation d'équipe</h2>
    <p>Notion place les notes à côté des tâches et bases de données d'une équipe. <code>/code</code> ajoute un bloc de code avec choix du langage et bouton de copie. Les mentions de pages créent des liens retour. La recherche dans l'espace porte sur le contenu des pages ; celle d'une base de données porte sur les titres et propriétés.</p>
    <p>Le <a href="https://developers.notion.com/guides/mcp/overview">MCP officiel de Notion</a> permet à un assistant de chercher, créer et modifier des pages, ainsi que de gérer les bases. Vous pouvez exporter les pages en Markdown et les bases en CSV. Ces fichiers sont des copies ; les modifications courantes restent dans l'espace Notion.</p>

    <h2 id="joplin">Joplin pour Markdown et le terminal</h2>
    <p>Joplin est open source, avec un éditeur Markdown et une app de terminal. Il gère les blocs de code et les liens entre notes. La recherche filtre par carnet ou tag. Préfixez une recherche par <code>/</code> pour inclure la ponctuation avec la recherche simple, que Joplin prévient plus lente.</p>
    <p>Joplin documente aussi un <a href="https://joplinapp.org/help/apps/ai_mcp/">serveur MCP local officiel</a>. Web Clipper doit tourner, puis vous activez le serveur et chaque outil. Les notes restent dans la base de Joplin, avec export Markdown possible. Utilisez son terminal ou MCP pour agir sur les notes courantes.</p>

    <h2 id="bear">Bear pour des extraits reliés à leurs explications</h2>
    <p>Bear combine Markdown et blocs de code colorés selon le langage. Saisissez <code>[[</code> pour relier une note ou l'un de ses titres. Sa <a href="https://bear.app/faq/command-line-interface/">CLI et son MCP officiels</a> cherchent, lisent et modifient les notes localement sur Mac. Bear les stocke dans SQLite et peut exporter des fichiers .md. Les outils d'automatisation ne fonctionnent que sur Mac.</p>

    <h2 id="apple">Notes d'Apple pour les notes rapides</h2>
    <p>Notes convient à un journal d'enquête, une liste ou un court extrait accompagné d'explications. La recherche retrouve les mots et une note épinglée reste visible. Sur Mac, Maj + Commande + M applique Monostyle ; Édition &gt; Ajouter un lien relie les notes. Le <a href="/fr/blog/bloc-code-notes-iphone">guide des extraits de code</a> détaille le format.</p>
    <p>Le <a href="https://support.apple.com/fr-fr/guide/notes/not201900c07/mac">guide d'export Apple</a> décrit l'export de la note sélectionnée en Markdown et la copie du texte sélectionné dans ce format. Donnez cette copie à l'agent si besoin, puis reportez vous-même ses changements dans Notes.</p>

    <h2 id="pinto">Pinto Notes pour les notes que l'agent peut modifier</h2>
    <p>Pinto Notes ressemble à Notes sur iPhone et Mac. Saisissez <code>/</code> au début d'une ligne et choisissez Code Block. Les notes sont des fichiers Markdown, avec des chemins comme <code>Work/Decision log.md</code>. Le serveur MCP hébergé permet aux agents de chercher, lire et modifier ces notes.</p>
    <p>Le <a href="/blog/mcp-server">guide MCP</a> donne les étapes pour Claude Code, Codex et Gemini CLI. Le <a href="/blog/notes-in-claude-code-and-codex">guide Claude Code et Codex</a> montre une première question. Les changements de l'IA sont visibles, annulables et les versions antérieures restent dans l'historique. Pinto n'a pas d'app Windows, Android ou web.</p>

    <h2 id="modeles">Commencer avec un modèle pour développeurs</h2>
    <p>Ces modèles gratuits fournissent une structure de note et des instructions pour l'agent connecté.</p>
    <ul>
      <li><a href="/templates/bug-triage">Tri des bugs</a> classe un signalement par gravité et ajoute les étapes de reproduction fournies. Les instructions Claude Code demandent aussi d'examiner le code pour une cause probable.</li>
      <li><a href="/templates/daily-standup">Point quotidien</a> garde une section par jour. L'agent rédige Hier depuis les commits, puis demande la suite et les blocages.</li>
      <li><a href="/templates/decision-log">Journal des décisions</a> garde le contexte, les options et la raison du choix. L'agent nomme les fichiers touchés et consulte les décisions passées.</li>
    </ul>
    <p>Pour ChatGPT ou Claude, suivez le <a href="/blog/connect-chatgpt-to-your-notes">guide de connexion</a>. Vous pouvez <a href="/blog/move-from-apple-notes">importer Notes sur Mac</a> en une fois, sans modifier la bibliothèque d'origine.</p>
  </LocalPostPage>;
}
