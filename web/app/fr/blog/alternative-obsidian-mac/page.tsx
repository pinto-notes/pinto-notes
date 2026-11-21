import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-obsidian-mac");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative obsidian » renvoie « alternative obsidian », « alternative obsidian linux », « alternative obsidian open source » et « alternative obsidian sync » ; la requête longue « alternative à obsidian mac » ne renvoie rien.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/not201900c07/mac (« Fichier > Importer le texte Markdown », « Conserver la structure des dossiers lors de l’importation »).
// Les autres faits, limites d'import et liens suivent /blog/obsidian-alternative-for-mac.

const CHECK = `Avant de déplacer un coffre Obsidian
- Garder une copie du dossier entier, y compris les pièces jointes et les réglages cachés.
- Ouvrir une note avec image et vérifier son import.
- Suivre un lien entre notes, y compris vers un sous-dossier.
- Vérifier une note intégrée et les contenus produits par des plugins.
- Chercher une note dont vous connaissez le titre.
- Essayer les notes importées sur iPhone si vous l'utilisez.
- Ouvrir un fichier Markdown exporté dans un autre éditeur avant de vous décider.`;
const FAQ = [
  { q: "Quelle app Mac peut importer un coffre Obsidian ?", a: ["Pinto Notes importe les sous-dossiers, images et liens entre notes sur Mac. Bear importe un dossier Markdown avec pièces jointes, Joplin un répertoire Markdown, et Notes d'Apple des dossiers Markdown. Vérifiez le résultat avant de tout déplacer."] },
  { q: "Pinto peut-il modifier le coffre qui reste dans le Finder ?", a: ["Non. Pinto Notes en importe une copie dans sa bibliothèque. Les deux dossiers ne se synchronisent pas. Vous pouvez exporter la bibliothèque Pinto en fichiers Markdown dans un ZIP séparé."] },
  { q: "Que deviennent les notes intégrées d'Obsidian ?", a: ["Elles deviennent des liens vers ces notes. Les images et autres fichiers liés sont importés en pièces jointes. Le dossier de réglages .obsidian est ignoré."] },
  { q: "Quelle alternative fonctionne sur Mac et Android ?", a: ["Joplin fonctionne sur les deux et propose des notes Markdown ainsi que plusieurs services de synchronisation. Pinto Notes fonctionne uniquement sur iPhone et Mac. Pour modifier directement le même dossier Markdown, vous pouvez aussi garder Obsidian."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="alternative-obsidian-mac"
    intro={<>Pinto Notes est une alternative à Obsidian sur Mac si vous voulez une interface proche de Notes d'Apple et importer votre coffre. Bear convient à l'écriture Markdown avec tags, Notes aux notes du quotidien, Joplin aux carnets ouverts sur plusieurs systèmes.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#choisir", label: "Choisir une app" }, { href: "#garder", label: "Garder Obsidian" }, { href: "#pinto", label: "Importer le coffre" }, { href: "#verifier", label: "Vérifier l'import" }]}>
      <p>Pinto Notes importe les sous-dossiers, images et liens entre notes d'un coffre Obsidian. Gardez Obsidian si vous devez modifier directement le même dossier dans le Finder, ou si vous dépendez du graphe, de Canvas ou des plugins.</p>
      <PostCta slug="fr/alternative-obsidian-mac" path="/fr/blog/alternative-obsidian-mac" position="answer" title="Importez votre coffre dans Pinto Notes" ui={ui.cta}><p>Importez vos notes Obsidian sur Mac, puis lisez-les dans Pinto Notes sur Mac et iPhone. Connectez ChatGPT ou Claude pour lui permettre de les lire et de les modifier.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Pinto Notes repère un coffre Obsidian de 27 notes sur Mac, puis confirme l'import." caption="Un coffre Obsidian importé dans Pinto Notes sur Mac. Le dossier d'origine reste en place. Capture : Pinto Notes." />}
    faq={FAQ}>
    <h2 id="choisir">Choisir selon ce que vous voulez changer</h2>
    <p>Un autre éditeur peut suffire. Si vous voulez changer le classement de vos notes, essayez d'abord avec un petit dossier.</p>
    <ul><li><strong>Pinto Notes :</strong> une interface proche de Notes, l'import Obsidian et l'accès pour ChatGPT ou Claude connecté. Uniquement iPhone et Mac.</li><li><strong>Notes d'Apple :</strong> dossiers, listes à cocher et recherche pour les notes courantes.</li><li><strong>Bear :</strong> Markdown, tags et tableaux. La synchronisation iCloud demande Bear Pro.</li><li><strong>Joplin :</strong> carnets et notes Markdown hors ligne. Existe aussi sur Windows, Linux et Android.</li></ul>
    <p>Notes d'Apple peut importer un dossier Markdown sur Mac avec « Fichier &gt; Importer le texte Markdown ». Activez « Conserver la structure des dossiers lors de l'importation », sous Options si besoin. Vérifiez vous-même les images et les liens <code>[[...]]</code>. Le <a href="https://support.apple.com/fr-fr/guide/notes/not201900c07/mac">guide Apple</a> ne promet pas de reproduire tout un coffre. Lisez aussi <a href="/fr/blog/notes-iphone-vs-obsidian">Notes ou Obsidian</a>.</p>
    <p>Le <a href="https://bear.app/faq/import-your-notes/">guide Bear</a> décrit l'import d'un dossier Markdown avec ses pièces jointes référencées. Choisissez Bear si ses tags conviennent à votre écriture.</p>
    <p><a href="https://joplinapp.org/help/">Joplin</a> importe un répertoire Markdown en carnets et sous-carnets selon son <a href="https://joplinapp.org/help/apps/import_export/">guide d'import</a>. Vous choisissez le <a href="https://joplinapp.org/help/apps/sync/">service de synchronisation</a>, par exemple Dropbox ou Nextcloud.</p>
    <h2 id="garder">Quand garder Obsidian</h2>
    <p>Un <a href="https://obsidian.md/help/data-storage">coffre Obsidian est un dossier local de fichiers Markdown</a>. D'autres éditeurs peuvent modifier ces fichiers. Une app qui importe une copie change cette manière de travailler.</p>
    <p>Obsidian propose un graphe, Canvas et des plugins. Un résultat produit par un plugin ne se réduit pas toujours au texte Markdown. Gardez Obsidian si vous en dépendez, ou enregistrez les résultats utiles comme contenu ordinaire avant de partir. Sa <a href="https://obsidian.md/">page officielle</a> décrit ces fonctions.</p>
    <p>Si votre seule raison de changer est l'accès à une IA, consultez d'abord le <a href="/blog/obsidian-mcp">guide MCP d'Obsidian</a>.</p>
    <h2 id="pinto">Importer un coffre dans Pinto Notes</h2>
    <p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac et garde chaque version antérieure d'une note. Il importe une copie du coffre dans sa propre bibliothèque. Les modifications ultérieures restent séparées. Il n'existe pas d'app Windows, Android ou web.</p>
    <ol><li>Gardez une copie complète du coffre, avec les images et autres pièces jointes.</li><li>Sur Mac, ouvrez le menu Fichier de Pinto Notes et choisissez l'import depuis Obsidian.</li><li>Confirmez le bon coffre trouvé, ou choisissez un autre dossier.</li><li>Importez, ouvrez quelques notes et suivez leurs liens.</li></ol>
    <p>Les sous-dossiers, images et liens entre notes sont importés. Le coffre d'origine reste en place. Le <a href="/blog/import-your-notes">guide d'import</a> détaille les méthodes. Une note intégrée devient un lien ; le dossier caché <code>.obsidian</code> est ignoré. Les plugins et Canvas ne sont pas reproduits.</p>
    <p>Une fois <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT ou Claude connecté</a>, il peut lire et modifier les notes importées. Demandez-lui de lire une note précise et d'y ajouter un résumé. Vérifiez la note ; sa version antérieure reste dans l'historique.</p>
    <p>Vous pouvez exporter la bibliothèque en ZIP de fichiers Markdown, avec dossiers, pièces jointes et liens réécrits vers les copies exportées. Avant l'export, ouvrez les notes protégées par mot de passe, Face ID ou Touch ID et consultez le rapport pour les fichiers indisponibles. L'export ne synchronise pas le coffre d'origine.</p>
    <h2 id="verifier">Vérifier l'import avant de tout déplacer</h2>
    <p>Essayez un dossier avec deux notes liées, une image et, si nécessaire, un contenu produit par un plugin. Comparez les copies aux originaux.</p>
    <Keep title="Liste de vérification du coffre" text={CHECK} />
    <p>Gardez le coffre et sa sauvegarde jusqu'à ce que vous ayez vérifié l'import et ouvert l'export. Choisissez ensuite l'app dans laquelle vous écrirez les nouvelles notes.</p>
  </LocalPostPage>;
}
