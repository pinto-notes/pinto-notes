import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "connecter-notes-gemini-cli");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « connecter notes à gemini cli » ne renvoie rien. « gemini cli notes » renvoie surtout « gemini cli release notes » et « gemini cli patch notes » ; aucun volume déduit.
// Aucune commande Notes d'Apple n'est citée. Commandes et import MCP_URL identiques à /blog/connect-notes-to-gemini-cli. Procédure documentaire, sans connexion Gemini CLI testée.

const ADD = `gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const EXTENSION = "gemini extensions install https://github.com/pinto-notes/pinto-notes";
const BRIEF = `Correction du formulaire de contact

Afficher une confirmation claire après l'envoi d'un message.
Conserver l'adresse e-mail dans le formulaire si l'envoi échoue.

Résultats de la séance
`;
const READ = `Trouve ma note Pinto Notes « Correction du formulaire de contact » et lis-la.
Indique ses exigences avant de modifier le code.
Si plusieurs notes correspondent, montre-moi leurs chemins et demande laquelle utiliser.`;
const SAVE = `Relis « Correction du formulaire de contact » dans Pinto Notes.
Sous « Résultats de la séance », ajoute la date du jour, nos modifications et les vérifications réellement exécutées.
Indique clairement les vérifications non faites. Garde les exigences et les entrées précédentes.
Montre-moi le chemin de la note à la fin.`;
const FAQ = [
  { q: "Quelle commande connecte Pinto Notes à Gemini CLI ?", a: [`Exécutez gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}. Lancez Gemini CLI, saisissez /mcp auth pinto-notes pour vous connecter, puis approuvez dans Pinto Notes sur Mac.`] },
  { q: "Comment vérifier que Gemini CLI voit les outils de notes ?", a: ["Saisissez /mcp dans Gemini CLI pour voir le serveur et ses outils. Demandez ensuite une note par son titre exact et comparez la réponse à la note dans Pinto Notes."] },
  { q: "Gemini CLI peut-il compléter une note créée sur iPhone ?", a: ["Après connexion et approbation, il peut chercher, lire et modifier vos notes Pinto. Demandez-lui de lire la note, puis d'ajouter le résultat sous un titre. La note se synchronise entre iPhone et Mac."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="connecter-notes-gemini-cli"
    intro={<>Connectez Gemini CLI à Pinto Notes par MCP, identifiez-vous et approuvez la connexion sur Mac. Gemini CLI peut alors lire une note écrite sur iPhone et y ajouter le résultat de votre séance.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#connexion", label: "Connexion" }, { href: "#lecture", label: "Lire une note" }, { href: "#resultat", label: "Enregistrer le résultat" }, { href: "#verifier", label: "Vérifier la connexion" }]}>
      <p>Exécutez <code>gemini mcp add --scope user --transport http pinto-notes {MCP_URL}</code>, puis <code>/mcp auth pinto-notes</code> dans Gemini CLI. Choisissez Allow dans Pinto Notes sur Mac. Cette autorisation permet de lire et modifier vos notes.</p>
      <PostCta slug="fr/connecter-notes-gemini-cli" path="/fr/blog/connecter-notes-gemini-cli" position="answer" title="Donnez vos notes de projet à Gemini CLI" ui={ui.cta}><p>Pinto Notes est gratuit sur Mac. Écrivez une note de projet sur iPhone, faites-la lire par Gemini CLI et enregistrez le résultat dans la même note.</p></PostCta>
    </Answer>}
    faq={FAQ}>
    <h2 id="connexion">Connecter Gemini CLI sur Mac</h2>
    <p>Ces étapes concernent Gemini CLI dans le Terminal sur Mac. Installez Pinto Notes et connectez-vous. Utilisez une version de Gemini CLI déjà installée.</p>
    <Keep title="Ajouter le serveur de notes" text={ADD} code note="Lancez cette commande dans le Terminal. La portée utilisateur rend la connexion disponible pour tous vos projets." />
    <p>Lancez Gemini CLI avec <code>gemini</code>, puis saisissez dans la session :</p>
    <Keep title="Se connecter à Pinto Notes" text="/mcp auth pinto-notes" code note="Terminez la connexion dans le navigateur, puis choisissez Allow dans Pinto Notes sur Mac." />
    <p>Google documente la commande HTTP et la connexion dans son <a href="https://geminicli.com/docs/tools/mcp-server/">guide MCP de Gemini CLI</a>. Cet article suit la documentation ; aucune connexion réelle n'a été testée pour le rédiger.</p>
    <p>Vous préférez l'extension ? Le README de Pinto donne cette commande :</p>
    <Keep title="Autre option : installer l'extension Pinto" text={EXTENSION} code note="Choisissez l'extension ou l'ajout direct du serveur. Les exemples suivants conviennent aux deux." />
    <p>Google explique <a href="https://geminicli.com/docs/extensions/">l'installation d'extensions depuis GitHub</a>. Avec l'extension, utilisez <code>/mcp</code> pour voir le nom du serveur fourni, puis <code>/mcp auth</code> pour vous connecter.</p>
    <h2 id="lecture">Lire une note écrite sur iPhone</h2>
    <p>Créez dans Pinto Notes sur iPhone une note intitulée « Correction du formulaire de contact ». Essayez cet exemple ou remplacez-le par votre propre note de projet :</p>
    <Keep title="Exemple de note de projet" text={BRIEF} />
    <p>Sur Mac, demandez à Gemini CLI de la trouver. Le titre exact aide à vérifier qu'il s'agit de la bonne note.</p>
    <Keep title="Lire avant de travailler" text={READ} />
    <p>Cherchez un appel <code>search</code> suivi de <code>fetch</code>. Comparez la réponse aux deux exigences. Une réponse qui répète seulement votre demande ne prouve pas que la note a été lue.</p>
    <h2 id="resultat">Ajouter le résultat à la même note</h2>
    <p>À la fin de la séance, demandez à Gemini CLI d'enregistrer ce qui s'est réellement passé. Gardez les exigences au-dessus des résultats pour la séance suivante.</p>
    <Keep title="Enregistrer le résultat" text={SAVE} />
    <p>L'outil <code>edit</code> de Pinto modifie le texte correspondant dans une note déjà lue. Demandez un ajout sous le bon titre et vérifiez ensuite la note. La version précédente reste dans l'historique et les modifications par l'IA peuvent être annulées.</p>
    <p>Sur iPhone, ouvrez la même note. Si une vérification a échoué ou n'a pas été faite, conservez cette information dans le compte rendu.</p>
    <h2 id="verifier">Si la connexion demande votre attention</h2>
    <p>Saisissez <code>/mcp</code> dans Gemini CLI pour voir les serveurs et outils, ou <code>gemini mcp list</code> dans le Terminal. Pour l'ajout direct, réessayez <code>/mcp auth pinto-notes</code> si nécessaire. Pour l'extension, utilisez le nom affiché dans la liste.</p>
    <p>Approuvez la connexion dans Pinto avant de chercher une note. Allow couvre la lecture et la modification. Si plusieurs titres correspondent, demandez leurs chemins et choisissez le bon avant toute édition.</p>
    <p>Le <a href="/blog/mcp-server">guide MCP de Pinto Notes</a> décrit les outils. Le <a href="/blog/notes-in-claude-code-and-codex">guide Claude Code et Codex</a> donne les commandes pour ces agents.</p>
    <h2 id="pinto">Garder la note et son résultat ensemble</h2>
    <p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac. Vous écrivez la note, une IA autorisée peut la modifier et vous pouvez revenir à une version antérieure.</p>
    <p>Si vos notes sont dans Notes d'Apple, <a href="/blog/move-from-apple-notes">importez-les sur Mac</a>. Les originaux restent inchangés.</p>
  </LocalPostPage>;
}
