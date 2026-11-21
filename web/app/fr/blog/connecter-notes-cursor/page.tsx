import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "connecter-notes-cursor");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « connecter notes à cursor » ne renvoie rien. « cursor notes » renvoie surtout des notes de version ; aucun volume de recherche n'en découle.
// Aucune commande Notes d'Apple n'est citée. Commandes, configuration et lien d'installation identiques à /blog/connect-notes-to-cursor. Procédure fondée sur la documentation, sans connexion Cursor testée.

const CONFIG = JSON.stringify({ mcpServers: { "pinto-notes": { url: MCP_URL } } }, null, 2);
const CURSOR_INSTALL = "cursor://anysphere.cursor-deeplink/mcp/install?" + new URLSearchParams({
  name: "pinto-notes",
  config: Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64"),
}).toString();
const BRIEF = `Note de cadrage : recherche sur le site

Objectif : permettre de rechercher les articles d'aide publiés.
Première version : chercher dans les titres et afficher les liens correspondants.
À conserver : la mise en page actuelle de l'aide.
Hors périmètre : la recherche dans les pièces jointes.
Question ouverte : afficher les résultats pendant la saisie ou après un clic sur Rechercher ?

Décisions
Aucune décision technique pour l'instant.

Prochaine étape
Vérifier comment les articles d'aide sont chargés.`;
const READ_PROMPT = `Cherche dans mes notes Pinto Notes « Note de cadrage : recherche sur le site » et lis la note entière. Indique-moi l'objectif, ce qui reste hors de la première version et la question encore ouverte. Ne modifie ni la note ni le code.`;
const UPDATE_PROMPT = `Relis « Note de cadrage : recherche sur le site » dans Pinto Notes. Sous Décisions, remplace « Aucune décision technique pour l'instant. » par « Afficher les résultats après un clic sur Rechercher. ». Sous Prochaine étape, mets « Ajouter un champ de recherche et un bouton dans la mise en page actuelle de l'aide. ». Garde le reste du texte. Montre-moi les modifications.`;
const FAQ = [
  { q: "Comment connecter Pinto Notes à Cursor ?", a: ["Sur Mac, ouvrez le lien d'installation ci-dessous, confirmez le serveur dans Cursor, connectez-vous et choisissez Allow dans Pinto Notes. L'autorisation permet de lire et modifier les notes."] },
  { q: "Où Cursor stocke-t-il la configuration MCP ?", a: ["Cursor indique .cursor/mcp.json pour un projet et ~/.cursor/mcp.json pour tous les projets. Si le fichier existe, ajoutez pinto-notes à l'objet mcpServers déjà présent."] },
  { q: "Cursor peut-il modifier une note rédigée sur iPhone ?", a: ["Oui. Connectez Cursor au même compte Pinto Notes, demandez-lui de lire la note avant de la modifier et vérifiez ensuite le résultat dans Pinto Notes."] },
  { q: "La connexion donne-t-elle aussi accès à Notes d'Apple ?", a: ["Non. Elle accède au compte Pinto Notes. Sur Mac, vous pouvez importer vos notes Apple ; les originaux restent inchangés."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="connecter-notes-cursor"
    intro={<>Connectez Pinto Notes à Cursor avec MCP, identifiez-vous et choisissez Allow. Cursor peut alors lire une note de projet écrite sur iPhone et la mettre à jour pendant votre travail sur Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#connexion", label: "Connecter Cursor" }, { href: "#manuel", label: "Configuration manuelle" }, { href: "#exemple", label: "Essayer une note de projet" }, { href: "#depannage", label: "En cas de problème" }]}>
      <p>Sur Mac, utilisez le lien ci-dessous pour ajouter Pinto Notes à Cursor. Connectez-vous et choisissez Allow. Cette autorisation donne à Cursor le droit de lire et modifier vos notes. Commencez par lui faire lire une note au titre précis.</p>
      <PostCta slug="fr/connecter-notes-cursor" path="/fr/blog/connecter-notes-cursor" position="answer" title="Retrouvez votre note de projet dans Cursor" ui={ui.cta}><p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac. Écrivez-y votre note de projet, puis demandez à Cursor de la lire et d'y consigner une décision que vous avez prise.</p></PostCta>
    </Answer>}
    faq={FAQ}>
    <h2 id="connexion">Connecter Cursor sur Mac</h2>
    <p>Il vous faut Cursor installé sur Mac et un compte Pinto Notes. Ce guide relie Cursor à ce compte. Pinto Notes fonctionne sur iPhone et Mac, sans app de notes pour Windows, Android ou le web.</p>
    <ol><li><a href={CURSOR_INSTALL}>Ajouter Pinto Notes à Cursor</a>. Le lien remplit l'adresse du serveur.</li><li>Confirmez le serveur dans Cursor et suivez la connexion.</li><li>Choisissez Allow quand Pinto Notes le demande. Cela autorise la lecture et la modification.</li></ol>
    <p>Le lien reprend la configuration fournie dans Pinto Notes. Le <a href="https://cursor.com/docs/mcp">guide MCP de Cursor</a> décrit les serveurs distants et la connexion par navigateur. Cette procédure s'appuie sur la documentation et sur le code du lien ; la connexion n'a pas été testée dans Cursor pour cet article.</p>
    <h2 id="manuel">Ajouter le serveur manuellement</h2>
    <p>Cursor accepte <code>.cursor/mcp.json</code> pour un projet et <code>~/.cursor/mcp.json</code> pour tous les projets. Si le fichier contient déjà des serveurs, ajoutez l'entrée <code>pinto-notes</code> dans son objet <code>mcpServers</code>.</p>
    <Keep title="Configuration MCP de Pinto Notes" text={CONFIG} code />
    <p>Activez le serveur dans la section Customize de Cursor, puis terminez la connexion et choisissez Allow. Le <a href="/blog/mcp-server">guide du serveur MCP Pinto Notes</a> explique les outils et les droits d'accès.</p>
    <h2 id="exemple">Lire une note écrite sur iPhone</h2>
    <p>Avant d'ouvrir le code, créez une note Pinto Notes sur iPhone. Décrivez le changement voulu et ce qui peut attendre. Voici un exemple à adapter.</p>
    <Keep title="Exemple de note de projet" text={BRIEF} />
    <p>Dans Cursor sur Mac, demandez-lui de trouver cette note :</p>
    <Keep title="Vérifier la lecture dans Cursor" text={READ_PROMPT} />
    <p>Examinez le résultat de l'outil et la réponse. Ils doivent reprendre la vraie note et la question sur l'affichage des résultats. Une réponse générale sur la recherche ne prouve pas que Cursor a lu la note.</p>
    <h2 id="decision">Enregistrer une décision dans la note</h2>
    <p>Quand vous avez décidé, donnez la décision à Cursor au lieu de le laisser deviner. Dans cet exemple, la recherche attend un clic sur Rechercher.</p>
    <Keep title="Enregistrer la décision et la suite" text={UPDATE_PROMPT} />
    <p>L'outil de modification de Pinto Notes demande à l'agent de lire la note avant de l'éditer. Ouvrez-la ensuite et vérifiez la décision. Les versions antérieures restent disponibles.</p>
    <h2 id="depannage">Si Cursor ne trouve pas les notes</h2>
    <p>Vérifiez la connexion au compte Pinto Notes contenant la note. Dans Cursor, assurez-vous que le serveur est activé sous Customize. En cas d'erreur, ouvrez Output puis MCP Logs. Cursor demande par défaut l'approbation des appels d'outils.</p>
    <p>Réessayez d'abord la demande de lecture. Si plusieurs notes portent un titre proche, donnez le titre exact et demandez à Cursor de montrer la note trouvée avant toute modification.</p>
    <h2 id="pinto">Garder les décisions avec la note de départ</h2>
    <p>Utilisez la même note pour la demande écrite sur iPhone et les décisions prises en codant. Dans cet exemple, Cursor ne réécrit la note que si vous le lui demandez.</p>
    <p>Le <a href="/blog/notes-in-claude-code-and-codex">guide Claude Code et Codex</a> explique la connexion d'autres agents. Vous pouvez aussi <a href="/blog/move-from-apple-notes">importer vos notes Apple sur Mac</a> ; Notes reste inchangé.</p>
  </LocalPostPage>;
}
