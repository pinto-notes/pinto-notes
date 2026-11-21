import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "astuces-notes-iphone");

// Version française de /blog/apple-notes-tips. Recherche : « astuces notes iphone » → « astuces notes iphone », « astuces notes apple » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (listes de pointage); /guide/notes/apd1955d3b21/mac (mise en forme); /guide/notes/apde615d29c2/mac (liens); /guide/notes/apd58edc7964/mac (dossiers intelligents); /guide/iphone/iphb8628c6b8/ios (recherche), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Saisir vite", text: ["1. Lancez une note rapide depuis une autre app sur Mac pour garder un lien ou une idée sans changer de fenêtre. 2. Sur iPhone, scannez un document directement dans une note plutôt que de photographier chaque page séparément. 3. Enregistrez une réunion dans Notes et consultez sa transcription si votre appareil et la langue sont pris en charge."] },
  { id: "partie-1", title: "Coller et réutiliser", text: ["4. Sur Mac, Notes peut coller du Markdown en conservant les titres et listes ; le guide Apple ne nomme pas ici une commande de menu, donc utilisez le collage de Markdown décrit dans le guide. 5. Gardez une note modèle et dupliquez-la pour la prochaine semaine. Notes ne fournit pas de bibliothèque de modèles intégrée."] },
  { id: "partie-2", title: "Donner une forme aux notes", text: ["6. Créez une liste de pointage et activez le tri des éléments cochés pour garder les tâches ouvertes en haut. 7. Donnez des sous-titres aux parties d’une longue note et réduisez celles que vous n’utilisez pas. 8. Surlignez les passages à revoir. 9. Utilisez un tableau pour des éléments ayant les mêmes colonnes, sans attendre de lui un tableur. 10. Tapez une opération suivie du signe égal : les résultats mathématiques peuvent proposer la réponse hors des tableaux."] },
  { id: "partie-3", title: "Retrouver ce qui compte", text: ["11. Épinglez les notes que vous ouvrez chaque jour. Sur Mac, Apple indique Fichier > Épingler la note. 12. Reliez deux notes avec Édition > Ajouter un lien, ou tapez >> puis le nom de la note. 13. Ajoutez un #tag et créez un dossier intelligent avec les critères utiles, par exemple les listes de pointage non cochées. 14. Recherchez le texte saisi ou manuscrit, des objets dans les images et le texte des documents scannés. Une note verrouillée n’expose que son titre à la recherche."] },
  { id: "partie-4", title: "Des idées concrètes", text: ["Une liste de courses, un budget, un programme de voyage ou un compte rendu de réunion peuvent tous tenir dans Notes. 15. Si vous voulez demander à ChatGPT ou Claude de compléter ces notes depuis une conversation, Pinto Notes propose cet accès sur iPhone et Mac après connexion. Il garde les changements visibles et les anciennes versions."] },
];
const LINKS = [
  ["Liste de tâches dans Notes", "/fr/blog/liste-de-taches-notes-iphone"],
  ["Budget dans Notes", "/fr/blog/budget-notes-iphone"],
  ["Compte rendu de réunion", "/fr/blog/compte-rendu-reunion-notes-iphone"],
];
const FAQ = [
  { q: "Notes peut-il rechercher le texte d’un scan ?", a: ["Oui. Le guide iPhone d’Apple cite le texte des documents scannés parmi les éléments trouvés par la recherche."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="astuces-notes-iphone" intro={"Notes sait faire plus que garder du texte. Ces quinze gestes aident à saisir une idée, organiser une note et la retrouver sans construire tout un système."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Commencez par les notes rapides, les scans et les listes de pointage. Épinglez les notes fréquentes. Utilisez des tags et des liens seulement quand vous en avez besoin.</p>
      <PostCta slug="fr/astuces-notes-iphone" path="/fr/blog/astuces-notes-iphone" position="answer" ui={ui.cta} title="Vos notes dans votre conversation avec l’IA">
        <p>Pinto Notes conserve une interface proche de Notes. ChatGPT ou Claude peut chercher et modifier vos notes après connexion, et chaque version antérieure reste disponible.</p>
      </PostCta>
    </Answer>}
     faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} alt="Dossier intelligent de Notes sur Mac réunissant les tâches ouvertes." caption="Un dossier intelligent rassemble les tâches ouvertes." />
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} alt="Une note sur Mac après collage d’un texte Markdown mis en forme." caption="Notes peut reprendre les titres et listes d’un texte Markdown." />
      <PostFigure src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} alt="Menu Fichier de Notes montrant la commande de duplication." caption="Dupliquer une note permet de réutiliser sa structure." />
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} alt="Une note de dépenses sur iPhone avec des montants nommés et additionnés." caption="Les résultats mathématiques additionnent des montants. Image : Apple." />
      <PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} alt="Insertion d’un lien vers une section dans Notes sur Mac." caption="Un lien peut pointer vers une section ou une autre note." />
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} alt="Règle d’un dossier intelligent pour les listes non cochées." caption="Ce critère trouve les notes avec des tâches ouvertes." />
      <Figure shot={SHOTS.aiEdit} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
    <h2>Articles liés en français</h2><ul><li><a href="/fr/blog/carnet-de-recettes-notes-iphone">Carnet de recettes notes iphone</a></li></ul>
  </LocalPostPage>;
}
