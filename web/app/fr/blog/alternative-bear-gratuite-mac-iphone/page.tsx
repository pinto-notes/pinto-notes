import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-bear-gratuite-mac-iphone");

// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative à bear notes gratuite » et « alternatives à bear » n'ont donné aucune suggestion pertinente. « alternative bear » renvoie surtout des sens sans rapport. Titre descriptif retenu.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/not201900c07/mac (« Fichier > Importer le texte Markdown », « Conserver la structure des dossiers lors de l’importation »).
// Les faits sur Bear, Pinto et les formats viennent de /blog/bear-notes-alternative-free. Les menus Bear restent ceux de sa documentation anglaise et sont décrits en français.

const CHECK = `Vérifier l'import depuis Bear
- [ ] Comparer le texte avec la note d'origine
- [ ] Ouvrir une image importée
- [ ] Vérifier une liste à cocher et un tableau
- [ ] Suivre un lien vers une autre note
- [ ] Vérifier l'affichage des tags
- [ ] Garder l'export original pendant l'essai`;
const FAQ = [
  { q: "Peut-on utiliser Bear sans abonnement Pro ?", a: ["Oui. La version gratuite permet de garder des notes locales et de les exporter en Markdown. La synchronisation iCloud demande Bear Pro."] },
  { q: "Faut-il payer pour exporter ses notes Bear ?", a: ["Non. Bear propose gratuitement les formats Markdown et TextBundle. Sur Mac, sélectionnez des notes puis utilisez la commande d'export du menu Fichier."] },
  { q: "Toutes les fonctions de Bear seront-elles conservées ?", a: ["Aucune correspondance complète n'est promise. Pinto importe le Markdown et ses pièces jointes sur Mac. Vérifiez notamment les tags et les liens. Les réglages et les anciennes versions de Bear ne sont pas transférés."] },
];
export default function Page() {
  const ui = UI.fr;
  return <LocalPostPage lang="fr" slug="alternative-bear-gratuite-mac-iphone"
    intro={<>Pinto Notes est une alternative gratuite à Bear sur iPhone et Mac. Il importe les exports Bear sur Mac. Notes d'Apple est aussi gratuit si vous cherchez des dossiers et des notes partagées.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#options", label: "Options gratuites" }, { href: "#bear", label: "Garder Bear" }, { href: "#import", label: "Exporter et importer" }, { href: "#verifier", label: "Vérifier les notes" }, { href: "#pinto", label: "Pinto Notes" }]}>
      <p>Choisissez Pinto Notes pour une app proche de Notes qui importe vos exports Bear et donne à ChatGPT ou Claude connecté le droit de lire et modifier vos notes. Notes convient aux dossiers et au partage via iCloud. Bear reste gratuit pour écrire en local, mais sa synchronisation iCloud demande Pro.</p>
      <PostCta slug="fr/alternative-bear-gratuite-mac-iphone" path="/fr/blog/alternative-bear-gratuite-mac-iphone" position="answer" title="Essayez vos notes Bear dans Pinto Notes" ui={ui.cta}><p>Téléchargez Pinto Notes gratuitement sur Mac et commencez par un petit export Bear. Une fois connecté, ChatGPT ou Claude peut lire et modifier ces notes.</p></PostCta>
    </Answer>}
    faq={FAQ}>
    <h2 id="options">Ce que permettent les options gratuites</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Pour quoi faire</th><th scope="col">À vérifier</th></tr></thead><tbody>
      <tr><th scope="row">Bear gratuit</th><td>Écrire en Markdown en local</td><td>iCloud demande Pro</td></tr>
      <tr><th scope="row">Notes d'Apple</th><td>Dossiers et notes partagées</td><td>Le rendu du Markdown importé</td></tr>
      <tr><th scope="row">Pinto Notes</th><td>Une app proche de Notes, avec accès pour ChatGPT ou Claude</td><td>Seulement sur iPhone et Mac</td></tr>
    </tbody></table></div>
    <p><a href="https://apps.apple.com/us/app/notes/id1110145109">Notes est gratuit</a>, avec synchronisation iCloud et collaboration. Chaque personne qui partage une note doit avoir un compte Apple. Pour comparer l'écriture et le classement, lisez <a href="/fr/blog/notes-iphone-vs-bear">Notes ou Bear</a>.</p>
    <p>Pinto Notes n'a pas d'app Windows, Android ou web. Si vous utilisez un iPhone et un Mac, essayez vos notes les plus utiles avant de tout déplacer.</p>
    <h2 id="bear">Quand garder Bear</h2>
    <p>Bear propose un éditeur Markdown, des tags et le repli des titres. Si vous écrivez sur un seul appareil, son offre gratuite peut suffire. Sa <a href="https://bear.app/#pricing">page des tarifs</a>, consultée le 21 novembre 2026, réserve la synchronisation iCloud et la recherche dans les images et PDF à Pro.</p>
    <p>Bear donne aussi accès aux IA. Son <a href="https://bear.app/faq/command-line-interface/">guide</a> décrit un connecteur Claude pour ordinateur, un serveur MCP local et un outil en ligne de commande à partir de Bear 2.8 sur Mac. Ils peuvent chercher, lire, créer et modifier des notes. Essayez cette voie si l'accès à une IA est votre seule raison de partir.</p>
    <h2 id="import">Exporter quelques notes d'abord</h2>
    <p>Sur Mac, sélectionnez quelques notes dans Bear en maintenant Commande, puis utilisez la commande d'export du menu Fichier. Le <a href="https://bear.app/faq/export-your-notes/">guide Bear</a> indique que Markdown et TextBundle sont gratuits. Incluez une note avec image pour vérifier les pièces jointes.</p>
    <p>Pour Pinto Notes, exportez le Markdown avec les pièces jointes, puis sélectionnez le dossier. Les images sont aussi importées. Sur Mac, ouvrez le menu Fichier de Pinto Notes et choisissez Bear. Le <a href="/blog/import-your-notes">guide d'import</a> montre la sélection du dossier. Bear ne change pas.</p>
    <p>Pour Notes d'Apple, le <a href="https://support.apple.com/fr-fr/guide/notes/not201900c07/mac">guide Mac</a> indique « Fichier &gt; Importer le texte Markdown ». Sélectionnez les fichiers ou leur dossier. Vous pouvez activer « Conserver la structure des dossiers lors de l'importation », sous Options si nécessaire. Vérifiez les copies avant d'importer toute la bibliothèque.</p>
    <h2 id="verifier">Vérifier les éléments qui comptent</h2>
    <p>Ouvrez l'original et la copie côte à côte. Le texte peut être présent alors qu'un lien mène au mauvais endroit.</p>
    <Keep title="Vérification d'un import Bear" text={CHECK} note="Gardez cette liste avec l'export pendant votre essai." />
    <p>Bear propose de conserver les tags pendant l'export. Cochez cette option si leur texte compte pour vous, puis regardez comment l'autre app les traite. Cela ne garantit pas la même organisation dans la barre latérale. Gardez à part les réglages et anciennes versions de Bear.</p>
    <h2 id="pinto">Utiliser les notes importées avec une IA</h2>
    <p>Pinto Notes ressemble à Notes d'Apple sur iPhone et Mac et garde chaque version antérieure d'une note créée chez lui. Cela ne signifie pas qu'il importe l'historique Bear.</p>
    <p>Une fois <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT ou Claude connecté</a>, il peut lire et modifier vos notes. Demandez-lui de trouver une note de projet importée, de résumer le travail restant, puis d'y ajouter une prochaine étape. Vérifiez le résultat dans Pinto Notes.</p>
  </LocalPostPage>;
}
