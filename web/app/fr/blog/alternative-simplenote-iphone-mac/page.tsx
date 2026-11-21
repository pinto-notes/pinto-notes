import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-simplenote-iphone-mac");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative simplenote » renvoie « simplenotes alternative », « simplenote alternative reddit » et « simplenote alternative free » ; « alternative à simplenote iphone mac » ne renvoie rien. Titre descriptif en français.
// Les étapes d'export sont celles de Simplenote, pas d'Apple. Faits et limites suivis de /blog/simplenote-alternative-for-iphone-and-mac.

const CHECK = `Vérifier le transfert depuis Simplenote
- Garder le ZIP original et l'accès au compte Simplenote.
- Comparer le texte complet d'une note longue.
- Vérifier une note Markdown, ses liens et ses blocs de code.
- Regarder comment les tags apparaissent.
- Ouvrir une note importée sur Mac et sur iPhone.
- Garder les anciennes versions dans Simplenote si vous en avez besoin.`;
const FAQ = [
  { q: "Existe-t-il une alternative gratuite à Simplenote sur iPhone et Mac ?", a: ["Pinto Notes est gratuit sur Mac et disponible sur iPhone. Il importe des dossiers de fichiers texte ou Markdown sur Mac. ChatGPT ou Claude connecté peut lire et modifier les notes."] },
  { q: "Pourquoi l'app Simplenote du Mac App Store ne propose-t-elle pas d'export ?", a: ["Selon l'aide de Simplenote, cette version ne permet pas l'export. Utilisez les outils d'export de l'app web ou le menu Fichier de la version de bureau Electron."] },
  { q: "Les tags et anciennes versions seront-ils transférés ?", a: ["L'import de fichiers texte ne promet ni le même classement par tags ni les anciennes versions de Simplenote. Gardez le ZIP et vérifiez les notes. Pinto garde les versions créées après l'import."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="alternative-simplenote-iphone-mac"
    intro={<>Pinto Notes peut remplacer Simplenote sur iPhone et Mac si vous voulez une app proche de Notes d'Apple avec accès pour une IA. Exportez vos notes Simplenote, puis importez les fichiers texte dans Pinto sur Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#choisir", label: "Changer ou rester" }, { href: "#export", label: "Exporter" }, { href: "#import", label: "Importer" }, { href: "#verifier", label: "Vérifier" }]}>
      <p>Pinto Notes convient si vous utilisez iPhone et Mac et souhaitez que ChatGPT ou Claude connecté lise et modifie vos notes. Simplenote couvre aussi Windows, Linux, Android et le web. Le transfert par fichiers texte ne reprend pas les anciennes versions.</p>
      <PostCta slug="fr/alternative-simplenote-iphone-mac" path="/fr/blog/alternative-simplenote-iphone-mac" position="answer" title="Importez vos notes texte dans Pinto Notes" ui={ui.cta}><p>Pinto Notes ressemble à Notes d'Apple. Importez vos fichiers texte sur Mac, puis connectez ChatGPT ou Claude pour travailler avec eux.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu Fichier de Pinto Notes sur Mac avec l'option d'import Markdown ou texte." caption="Choisissez l'import Markdown ou texte pour les fichiers exportés. Capture : Pinto Notes sur Mac." />}
    faq={FAQ}>
    <h2 id="choisir">Que voulez-vous changer dans Simplenote ?</h2>
    <p>Simplenote a des tags, la recherche, le Markdown, le partage et la publication web. Il conserve aussi les anciennes versions. Si cela répond déjà à vos besoins, vous pouvez le garder. Voir la <a href="https://simplenote.com/">présentation de Simplenote</a>.</p>
    <p>Pinto Notes convient si vous cherchez une app proche de Notes d'Apple avec accès aux notes pour une IA. Vous pouvez continuer à écrire vous-même et demander à l'IA de lire une note de projet puis d'y ajouter une décision.</p>
    <p>Pinto Notes fonctionne sur iPhone et Mac, sans app Windows, Android ou web. Simplenote couvre davantage d'appareils et permet aussi de modifier les notes hors ligne après connexion et téléchargement.</p>
    <h2 id="export">Exporter depuis Simplenote dans un navigateur</h2>
    <ol><li>Connectez-vous à <a href="https://app.simplenote.com/">l'app web Simplenote</a>.</li><li>Ouvrez le menu en haut à gauche, puis les réglages.</li><li>Dans les outils, lancez l'export des notes et enregistrez le ZIP.</li></ol>
    <p>Vous pouvez aussi exporter depuis le menu Fichier de l'app de bureau Electron. D'après les <a href="https://simplenote.com/help/#export">instructions officielles</a>, l'app du Mac App Store ne permet pas l'export. Si vous ne trouvez pas la commande, passez par le navigateur.</p>
    <p>La <a href="https://github.com/Automattic/simplenote-electron/blob/trunk/lib/utils/export/README.md">documentation d'export</a> décrit un ZIP avec un fichier par note. Le code produit des fichiers texte et une sauvegarde JSON. Gardez le ZIP intact et décompressez-en une copie pour examiner les fichiers texte.</p>
    <h2 id="import">Importer les fichiers texte dans Pinto sur Mac</h2>
    <p>Dans le menu Fichier de Pinto Notes, choisissez l'import Markdown ou texte montré ci-dessus. Le <a href="/blog/import-your-notes">guide d'import</a> décrit un dossier ou un ZIP de fichiers Markdown ou texte ; chaque sous-dossier devient un dossier. Simplenote reste inchangé.</p>
    <p>Pour commencer, copiez quelques fichiers texte exportés dans un dossier à part. Ajoutez une note longue et une note Markdown si vous en utilisez. Comparez-les aux originaux avant d'importer le reste. La sauvegarde JSON n'est pas importée comme notes.</p>
    <p>Il s'agit d'un import de fichiers, sans connexion au compte Simplenote. Les noms des tags peuvent être ajoutés au texte de l'export, mais ils ne deviennent pas forcément des tags Pinto. Les anciennes versions ne suivent pas.</p>
    <h2 id="verifier">Vérifier avant de quitter Simplenote</h2>
    <Keep title="Liste de vérification" text={CHECK} note="Gardez-la avec votre export pendant le transfert." />
    <p>Ouvrez une note importée sur Mac et iPhone. Vérifiez le texte sous les longues listes et les blocs de code, puis les liens. Un titre lisible ne suffit pas à valider toute la note.</p>
    <h2 id="pinto">Laisser une IA travailler sur les notes importées</h2>
    <p>Une fois <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT ou Claude connecté</a>, il peut lire et modifier vos notes Pinto. Demandez-lui de lire une note de projet précise, d'énumérer les questions ouvertes et d'ajouter une décision que vous venez de prendre. Vérifiez le résultat.</p>
    <p>Pinto garde chaque version antérieure d'une note créée chez lui. Cela ne récupère pas l'historique Simplenote. Le <a href="/blog/apple-notes-version-history">guide de l'historique</a> explique cette fonction.</p>
  </LocalPostPage>;
}
