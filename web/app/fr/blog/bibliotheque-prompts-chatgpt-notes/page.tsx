import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "bibliotheque-prompts-chatgpt-notes");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « bibliothèque prompts chatgpt » renvoie « bibliothèque prompt chatgpt » ; « prompt chatgpt notes » renvoie « prompt chatgpt notes ». La longue requête sur une bibliothèque dans Notes ne donne rien.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd558a85438/mac (« Fichier > Nouveau dossier ») et https://support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (« Fichier > Épingler la note »). Le nom français de « Paste as Markdown » n'est pas confirmé : l'étape est décrite sans nom de menu. Faits et limites suivis de /blog/chatgpt-prompt-library-in-notes.

const TEMPLATE = `# Prompt : point hebdomadaire du projet

Statut : à tester
Dernier test : AAAA-MM-JJ
Testé avec : app et modèle utilisés

## Quand l'utiliser
Transformer des notes de projet brutes en message pour un collègue.

## Prompt réutilisable
Rédige un point hebdomadaire pour [DESTINATAIRE] à partir de [NOTES] uniquement.
Utilise deux titres : Avancement et Prochaines étapes.
Ne dépasse pas 150 mots. Fais des phrases courtes.
Garde les noms et les dates fournis. N'invente pas d'échéance.
S'il manque une information nécessaire, pose une question avant de rédiger.

## Exemple de données
Destinataire : équipe design
Notes : maquette de la page d'accueil terminée. Relecture prévue mardi.

## Exemple de résultat à comparer
Avancement : la maquette de la page d'accueil est terminée.
Prochaines étapes : relire la maquette mardi.

## Notes de test
Vérifier que mardi reste mardi et qu'aucune échéance n'est ajoutée.
Remplacer cet exemple par un résultat vérifié.
`;
const RETRIEVE = `Cherche dans mes notes Pinto Notes « Prompt : point hebdomadaire du projet » et lis cette note.
Montre-moi la section Prompt réutilisable avant de l'utiliser.
Demande-moi le destinataire et les notes de cette semaine. Ne modifie pas le prompt enregistré.`;
const FAQ = [
  { q: "Comment créer une bibliothèque de prompts ChatGPT dans Notes ?", a: ["Créez un dossier Prompts et gardez un prompt par note. Ajoutez son objectif, le texte à copier et un exemple vérifié. Recherchez le nom de la tâche quand vous en avez besoin."] },
  { q: "Que conserver avec un prompt réutilisable ?", a: ["Un exemple de données et un résultat utile, la date et le modèle testés. Notez les changements quand le résultat ne convient pas. Séparez les consignes réutilisables des données de chaque utilisation."] },
  { q: "ChatGPT peut-il retrouver un prompt dans Pinto Notes ?", a: ["Oui, après connexion et choix de Allow. ChatGPT peut chercher et lire la note. Demandez-lui d'afficher les consignes, puis donnez les nouvelles données. Allow donne aussi le droit de modifier les notes."] },
  { q: "Les variables sont-elles remplacées automatiquement ?", a: ["Non. Les mots entre crochets sont de simples rappels. Remplacez-les avant de coller le prompt, ou demandez à ChatGPT connecté de recueillir les données manquantes. Cette structure est une note ordinaire que vous créez vous-même."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="bibliotheque-prompts-chatgpt-notes"
    intro={<>Gardez chaque prompt ChatGPT réutilisable dans sa propre note, avec le nom de la tâche et un résultat vérifié. Notes d'Apple permet de les copier à la main ; avec Pinto Notes connecté, ChatGPT peut retrouver et lire celui que vous demandez.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modele", label: "Copier le modèle" }, { href: "#classer", label: "Classer les prompts" }, { href: "#tester", label: "Tester un changement" }, { href: "#pinto", label: "Retrouver dans ChatGPT" }]}>
      <p>Créez un dossier Prompts et gardez une tâche par note. Séparez les consignes réutilisables des données propres à chaque essai. Enregistrez un exemple vérifié dessous. Au besoin, copiez les consignes dans ChatGPT avec de nouvelles données.</p>
      <PostCta slug="fr/bibliotheque-prompts-chatgpt-notes" path="/fr/blog/bibliotheque-prompts-chatgpt-notes" position="answer" title="Demandez à ChatGPT de retrouver votre prompt" ui={ui.cta}><p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac. Après connexion, ChatGPT peut chercher une note de prompt et lire ses consignes à votre demande.</p></PostCta>
    </Answer>}
    faq={FAQ}>
    <h2 id="modele">Une note de prompt à copier</h2>
    <p>Les consignes sont au-dessus de l'exemple. Vous pouvez donc ne copier que la partie utile. Le point hebdomadaire sert de départ ; changez la tâche en conservant les sections.</p>
    <Keep title="Note pour la bibliothèque de prompts" text={TEMPLATE} note="Sur Mac avec macOS 27, collez le texte Markdown avec sa mise en forme si votre version de Notes propose cette option. Un collage ordinaire garde les caractères Markdown visibles." />
    <p>Remplacez <code>[DESTINATAIRE]</code> et <code>[NOTES]</code> dans le texte envoyé à ChatGPT. Gardez ces repères dans la note d'origine. Pour utiliser le prompt, copiez uniquement la section des consignes avec les nouvelles données.</p>
    <h2 id="classer">Retrouver les prompts par tâche</h2>
    <p>Dans Notes sur Mac, choisissez « Fichier &gt; Nouveau dossier » et nommez-le Prompts. Donnez à chaque note un titre comme « Prompt : point hebdomadaire du projet ». La recherche trouve aussi les mots du corps de la note.</p>
    <p>Pour une note souvent utilisée, choisissez « Fichier &gt; Épingler la note ». Apple permet d'épingler les notes iCloud mises à niveau et celles stockées sur Mac. Gardez une note par tâche pour associer les tests aux bonnes consignes. Le <a href="/blog/apple-notes-templates">guide des modèles Notes</a> explique comment réutiliser une note de base.</p>
    <p>Dupliquez votre note de base sur Mac, renommez-la et effacez les exemples de la tâche précédente. Des statuts simples comme « à tester » et « testé » évitent de confondre une idée avec un prompt vérifié.</p>
    <h2 id="tester">Garder la trace d'un test utile</h2>
    <p>Le <a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt">guide d'OpenAI</a> recommande des consignes précises et du contexte, puis la relecture du résultat et l'ajustement du prompt. Notez vos essais dans la même note.</p>
    <ol><li>Exécutez le prompt avec un petit exemple.</li><li>Comparez la réponse aux données. Ici, mardi doit rester mardi et aucune échéance ne doit être inventée.</li><li>Si le résultat échoue, changez une consigne et recommencez avec les mêmes données.</li><li>Gardez le résultat utile, le changement, la date et le modèle testés.</li></ol>
    <p>Essayez une deuxième entrée avant de marquer le prompt comme testé. Un point sans date de relecture montre si le modèle en invente une. Un résultat sauvegardé sert de comparaison, sans garantir la prochaine réponse.</p>
    <h2 id="limites">Les limites de cette méthode</h2>
    <p>Dans Notes d'Apple, vous trouvez la note et copiez les consignes vous-même. Les mots entre crochets sont du texte ordinaire. Remplissez-les à chaque utilisation et vérifiez la réponse. Enregistrer un prompt ne programme aucune exécution et ne l'insère pas dans un navigateur.</p>
    <h2 id="pinto">Retrouver un prompt avec ChatGPT</h2>
    <p>Utilisez la même structure dans Pinto Notes, une app proche de Notes sur iPhone et Mac. Suivez le <a href="/blog/connect-chatgpt-to-your-notes">guide de connexion à ChatGPT</a> et choisissez Allow dans Pinto Notes. Ce choix donne à ChatGPT le droit de lire et modifier vos notes.</p>
    <Keep title="Demander un prompt enregistré" text={RETRIEVE} note="Connectez d'abord Pinto Notes. Cette demande lit les consignes et réclame les nouvelles données." />
    <p>Vérifiez que ChatGPT a trouvé la bonne note avant de donner les détails de la semaine. Après avoir validé une meilleure version, demandez-lui d'enregistrer les consignes et l'exemple vérifié. Pinto conserve les versions antérieures.</p>
    <p>Vous décidez quand chercher le prompt et quelle version garder. Si votre bibliothèque est déjà dans Notes d'Apple, <a href="/blog/move-from-apple-notes">importez-la sur Mac</a>. Les originaux restent inchangés.</p>
  </LocalPostPage>;
}
