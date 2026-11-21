import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-vs-bear");

// Version française de /blog/apple-notes-vs-bear. Recherche : « notes iphone vs bear » → « apple notes vs bear », « apple notes vs bear app » ; « notes apple ou bear » → « apple notes bear » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (Fichier > Importer le texte Markdown ; Fichier > Exporter vers) et /guide/notes/apd4e6e2c9a6/mac (collaboration), lus le 21 novembre 2026.
// Faits Bear, Pinto, tarif en dollars US et visuel repris de l’article anglais du 21 novembre 2026. Le tarif français peut varier.

const ui = UI.fr;
const ROWS = [
  ["Classement", "Dossiers, tags et dossiers intelligents", "Tags, y compris imbriqués"],
  ["Écriture", "Mise en forme, listes de pointage et tableaux", "Éditeur Markdown, tableaux, tâches et thèmes"],
  ["Liens", "Liens entre notes", "Liens wiki, liens retour et liens vers les titres"],
  ["Synchronisation", "iCloud, avec Notes activé sur chaque appareil", "iCloud avec Bear Pro"],
  ["Export sur Mac", "PDF ou Markdown", "Markdown et autres formats ; PDF et Word avec Pro"],
];
const SECTIONS = [
  { id: "notes", title: "Choisir Notes pour les dossiers et le partage", text: ["Notes convient si vous classez vos projets par dossiers et partagez des listes par iCloud. Vous pouvez ajouter des tags, épingler une note et créer un dossier intelligent pour retrouver les listes inachevées. Chaque personne qui collabore doit avoir un compte Apple. Vous pouvez autoriser la consultation ou la modification.", "Pour retrouver vos notes sur iPhone et Mac, utilisez le même compte Apple et activez Notes dans iCloud sur les deux appareils. Si votre problème est seulement de retrouver des tâches en cours, essayez d’abord un dossier intelligent."] },
  { id: "bear", title: "Choisir Bear pour écrire en Markdown", text: ["Bear affiche le Markdown dans l’éditeur. Son panneau d’informations construit un sommaire à partir des titres. Tapez [[ pour lier une autre note. Les liens retour montrent les notes qui pointent vers la note ouverte et celles qui mentionnent son titre sans lien.", "Les tags peuvent être imbriqués, par exemple #travail/projet, et une note peut en avoir plusieurs. Bear conserve ses notes dans une base de données, pas dans un dossier de fichiers Markdown. La version gratuite permet l’export de plusieurs notes en Markdown ; Pro ajoute notamment PDF, Word et HTML.", "Sur Mac, Bear 2.8 ou ultérieur propose un connecteur pour Claude, un serveur MCP local et un outil en ligne de commande. Ces outils peuvent lire et modifier des notes, avec des filtres par tag. Ils ne peuvent ni lire ni modifier les notes chiffrées."] },
  { id: "passer", title: "Passer d’une app à l’autre", text: ["Pour essayer Bear, exportez une note depuis Notes sur Mac au format Markdown, puis importez le dossier dans Bear. L’ancienne méthode Automator décrite par Bear transforme les listes de tâches en puces et laisse de côté les pièces jointes autres que les photos.", "Dans l’autre sens, exportez vos notes depuis Bear en Markdown. Dans Notes sur Mac, choisissez Fichier > Importer le texte Markdown. Vous pouvez conserver la structure des dossiers lors de l’import. Les liens wiki propres à Bear méritent une vérification après le transfert.", "Essayez d’abord avec une image, un tableau et une liste de pointage. Gardez les originaux : l’import copie les notes, il ne synchronise pas les deux apps."] },
  { id: "pinto", title: "Pinto Notes avec vos outils d’IA", text: ["Pinto Notes reprend l’usage de Notes sur iPhone et Mac. Les notes sont des fichiers Markdown chiffrés, leurs anciennes versions sont conservées, et ChatGPT ou Claude peut les lire et les modifier après connexion.", "Sur Mac, exportez Bear en Markdown avec ses pièces jointes, puis choisissez le dossier dans Pinto Notes. Les images suivent. L’import de Notes d’Apple se fait également sur Mac et ne modifie pas les notes d’origine."] },
];
const FAQ = [
  { q: "Bear ou Notes pour écrire ?", a: ["Prenez Bear pour le Markdown, le sommaire et les liens retour. Prenez Notes pour les dossiers et les notes partagées par iCloud. Les deux proposent tableaux et listes de pointage."] },
  { q: "Faut-il Bear Pro pour synchroniser l’iPhone ?", a: ["Oui. L’offre gratuite de Bear garde les notes en local. La synchronisation iCloud demande Bear Pro, affiché à 2,99 $ US par mois ou 29,99 $ US par an le 21 novembre 2026. Le prix local peut varier."] },
  { q: "Peut-on importer Bear dans Notes ?", a: ["Oui. Exportez les notes en Markdown depuis Bear, puis importez les fichiers dans Notes sur Mac. Vérifiez les images, tableaux et liens."] },
  { q: "Claude peut-il modifier les notes Bear ?", a: ["Oui, avec Bear 2.8 ou ultérieur et son connecteur sur Mac. Les notes chiffrées ne sont pas accessibles à ces outils."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-vs-bear" intro="Notes convient aux dossiers et aux listes partagées. Bear s’adresse à ceux qui écrivent en Markdown et relient leurs notes entre elles."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Choisissez Notes pour les dossiers, les dossiers intelligents et le travail à plusieurs. Choisissez Bear pour le Markdown, les tags imbriqués et les liens retour. La synchronisation entre iPhone et Mac demande Bear Pro.</p>
      <PostCta slug="fr/notes-iphone-vs-bear" path="/fr/blog/notes-iphone-vs-bear" position="answer" ui={ui.cta} title="Vos notes et votre IA au même endroit"><p>Pinto Notes conserve les anciennes versions et permet à ChatGPT ou Claude de lire et modifier les notes après connexion. Il importe Notes et Bear sur Mac.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2>Aperçu</h2><div className="tableWrap"><table><thead><tr><th scope="col">Critère</th><th scope="col">Notes</th><th scope="col">Bear</th></tr></thead><tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    <p>Bear propose une version gratuite en local, avec trois thèmes. Bear Pro ajoute la synchronisation iCloud, la recherche dans les images et PDF, ainsi que des thèmes. Son <a href="https://bear.app/#pricing">tarif affiché en dollars US</a> était de 2,99 $ par mois ou 29,99 $ par an le 21 novembre 2026. Le prix local peut varier.</p>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <p>Sources : <a href="https://support.apple.com/fr-fr/guide/notes/not201900c07/mac">import et export dans Notes</a>, <a href="https://bear.app/faq/migrate-from-apple-notes/">migration Bear</a>, <a href="https://bear.app/faq/command-line-interface/">outils Bear</a>.</p>
    <h2>À lire aussi</h2><ul><li><a href="/fr/blog/alternatives-notes-apple">Alternatives à Notes</a></li><li><a href="/fr/blog/notes-iphone-vs-obsidian">Notes ou Obsidian</a></li><li><a href="/blog/import-your-notes">Importer vos notes dans Pinto Notes</a></li></ul>
    <PostFigure src="/blog/amber-notes-chatgpt-edit-undo" width={1260} height={1520} alt="Pinto Notes sur Mac signale cinq lignes ajoutées par ChatGPT à une liste de courses, avec une commande Annuler." caption="Une liste de courses modifiée par ChatGPT dans Pinto Notes." />
  </LocalPostPage>;
}
