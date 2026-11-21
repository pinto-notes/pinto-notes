import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-vs-obsidian");

// Version française de /blog/apple-notes-vs-obsidian. Recherche : « notes iphone vs obsidian » → « ios notes vs obsidian » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (Fichier > Importer dans Notes, Importer le texte Markdown, Exporter vers); /guide/notes/apde615d29c2/mac (Édition > Ajouter un lien); /guide/notes/apd58edc7964/mac (dossiers intelligents), lus le 21 novembre 2026.
// Les faits sur les autres apps et Pinto Notes viennent de l’article anglais du 21 novembre 2026.

const ui = UI.fr;
const ROWS = [
  ["Prix", "Gratuit sur iPhone et Mac", "Gratuit ; Sync à partir de 4 $ par mois avec facturation annuelle"],
  ["Appareils", "Appareils Apple ; iCloud.com dans un navigateur", "Mac, Windows, Linux, iPhone, Android"],
  ["Stockage", "Dans Notes, avec iCloud par défaut", "Dossier de fichiers Markdown"],
  ["Liens", "Liens entre notes, sans liste des liens retour", "Liens retour et graphe"],
  ["Historique", "Pas d’historique des versions", "Instantanés locaux pendant 7 jours ; Sync garde 1 ou 12 mois"],
];
const SECTIONS = [
  { id: "partie-0", title: "Notes au quotidien", text: ["Notes synchronise les notes iCloud sans configuration supplémentaire. Vous avez les dossiers, les tags, les dossiers intelligents, les tableaux, les listes de pointage, la recherche et les notes épinglées. Un mot de passe, Face ID ou Touch ID peut protéger une note. Apple Intelligence peut transcrire et résumer un enregistrement sur les appareils compatibles.", "Sur Mac, Édition > Ajouter un lien relie deux notes ; saisir >> permet aussi de chercher une note. Notes ne montre pas les liens retour. Fichier > Exporter vers permet d’exporter la note sélectionnée en PDF ou Markdown, une par une. Notes ne garde pas les anciennes versions."] },
  { id: "partie-1", title: "L’intérêt d’Obsidian", text: ["Un coffre Obsidian est un dossier. Chaque note est un fichier Markdown qu’un autre éditeur peut ouvrir. Les liens se mettent à jour quand vous renommez une note ; un panneau montre les liens retour et un graphe les relations. Canvas, thèmes et extensions complètent l’app.", "Obsidian Sync est chiffré et payant : 4 $ par mois avec facturation annuelle ou 5 $ au mois. Publish coûte 8 $ par mois avec facturation annuelle ou 10 $ au mois. Vous pouvez aussi synchroniser un coffre par iCloud entre iPhone et Mac. Obsidian déconseille d’utiliser deux services de synchronisation pour le même coffre. Les instantanés locaux durent 7 jours par défaut et ne passent pas d’un appareil à l’autre."] },
  { id: "partie-2", title: "Passer d’une app à l’autre", text: ["L’extension officielle d’importation Obsidian copie Notes sur Mac, avec tableaux, images, dessins, scans et PDF. Elle ignore les notes verrouillées. Dans l’autre sens, Notes sur Mac importe les fichiers Markdown avec Fichier > Importer le texte Markdown. Vérifiez les liens [[ ]] après l’importation. Ces imports font une copie, sans synchronisation entre les deux apps."] },
  { id: "partie-3", title: "Et Notion ?", text: ["Notion vise surtout les pages partagées et le travail en équipe. Son offre gratuite donne un essai limité de Notion AI. Si vous choisissez entre les trois, Notes convient aux notes personnelles rapides, Obsidian aux fichiers liés et Notion aux espaces d’équipe."] },
  { id: "partie-4", title: "Pinto Notes", text: ["Pinto Notes garde les dossiers, tableaux et listes de pointage sur iPhone et Mac. Les notes sont en Markdown, avec des liens [[ ]], une liste des liens entrants et un historique restaurable. ChatGPT et Claude peuvent les lire et les modifier. Il n’a ni graphe, ni extensions Obsidian, ni app Windows, Android, Linux ou web."] },
];
const LINKS = [
  ["Notes ou Notion", "/fr/blog/notes-iphone-vs-notion"],
  ["Alternatives à Notes", "/fr/blog/alternatives-notes-apple"],
  ["Importer vos notes", "/blog/import-your-notes"],
];
const FAQ = [
  { q: "Obsidian se synchronise-t-il avec Notes ?", a: ["Non. Les outils d’importation copient les notes une fois ; chaque app garde ensuite sa propre bibliothèque."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-vs-obsidian"
    intro={"Notes est déjà sur votre iPhone. Obsidian garde vos notes dans un dossier de fichiers Markdown. Le bon choix dépend surtout des appareils que vous utilisez et de ce que vous voulez faire de vos fichiers."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Choisissez Notes pour écrire vite, cocher une liste et retrouver vos notes sur iPhone et Mac. Choisissez Obsidian si vous voulez des fichiers Markdown ordinaires, des liens retour, des extensions et des apps pour Windows, Linux ou Android.</p>
      <PostCta slug="fr/notes-iphone-vs-obsidian" path="/fr/blog/notes-iphone-vs-obsidian" position="answer" ui={ui.cta} title="Des fichiers Markdown avec l’allure de Notes">
        <p>Pinto Notes fonctionne sur iPhone et Mac, importe Notes ou un coffre Obsidian sur Mac, et garde les versions précédentes. ChatGPT ou Claude peut lire et modifier vos notes après connexion.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} alt="Une liste de courses ouverte dans Obsidian sur Mac, avec des éléments cochés barrés." caption="La liste de courses est un fichier Markdown dans Obsidian. Capture : Pinto Notes." />}
    faq={FAQ}>
    <h2>Aperçu</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Critère</th><th scope="col">Notes</th><th scope="col">Obsidian</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2>
    <ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} alt="Deux étapes de l’import d’un coffre Obsidian dans Pinto Notes sur Mac." caption="L’import conserve les dossiers et les liens Obsidian." />
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Notes sur Mac avec les dossiers et une liste de courses à cocher." caption="Une liste de courses dans Notes sur Mac." />
      <Figure shot={SHOTS.aiEdit} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
  </LocalPostPage>;
}
