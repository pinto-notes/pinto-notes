import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-vs-notion");

// Version française de /blog/apple-notes-vs-notion. Recherche : « notes iphone vs notion » → « apple notes ou notion », « apple note vs notion » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (Fichier > Importer le texte Markdown); /fr-fr/102484 (Rappels); /fr-fr/HT210402 (iCloud.com), lus le 21 novembre 2026.
// Les faits sur les autres apps et Pinto Notes viennent de l’article anglais du 21 novembre 2026.

const ui = UI.fr;
const ROWS = [
  ["Prix", "Gratuit", "Offre gratuite ; Plus à 10 $ par membre et par mois, facturé à l’année"],
  ["Organisation", "Dossiers, tags, dossiers intelligents", "Pages imbriquées et bases de données"],
  ["Tableaux", "Tableaux simples, sans tri ni total", "Vues, filtres, tri et formules"],
  ["Historique", "Aucun historique des versions", "7 jours en gratuit, 30 jours en Plus, 90 jours en Business"],
  ["Appareils", "iPhone, Mac, iCloud.com sur Windows", "Mac, Windows, iPhone, Android et web"],
];
const SECTIONS = [
  { id: "partie-0", title: "Pourquoi garder Notes", text: ["Notes est déjà installé. Les listes de pointage peuvent descendre les éléments cochés, les tags réunissent des notes dans un dossier intelligent, et la recherche parcourt le texte. Vous pouvez épingler ou verrouiller une note avec un mot de passe, Face ID ou Touch ID. Apple Intelligence transcrit et résume des enregistrements sur les appareils compatibles.", "Notes n’a pas de modèles intégrés. Ses tableaux ne trient ni ne calculent. Le partage demande un compte Apple à chaque personne, et aucun historique ne permet de retrouver une ancienne version."] },
  { id: "partie-1", title: "Ce que Notion ajoute", text: ["Une base de données Notion affiche ses pages en tableau, liste, tableau de projet, calendrier ou galerie. Vous pouvez filtrer, grouper, trier et calculer. La galerie de modèles couvre beaucoup d’usages. Pour travailler hors connexion, il faut marquer les pages disponibles hors ligne sur chaque appareil.", "Notion AI est disponible dans Business et Enterprise ; Free et Plus donnent un nombre limité de réponses d’essai. Le serveur MCP officiel permet à ChatGPT, Claude et Cursor d’accéder aux pages que vous pouvez voir. L’offre gratuite limite les fichiers à 5 Mo et le nombre de blocs dès qu’un espace a au moins deux membres."] },
  { id: "partie-2", title: "Notes et Rappels face à Notion", text: ["Dans l’écosystème Apple, Notes garde le texte et Rappels gère les échéances, les lieux et Siri. Les rappels programmés apparaissent aussi dans Calendrier depuis iOS 18. Notion permet @remind et une date dans une base de données, avec notification et courriel. Les rappels récurrents n’y sont pas encore disponibles."] },
  { id: "partie-3", title: "Déplacer vos pages", text: ["Notion ne propose pas d’import direct depuis Notes. Exportez d’abord les notes en Markdown, puis importez les fichiers dans Notion. Dans l’autre sens, exportez vos pages Notion en Markdown et CSV. Sur Mac, Notes importe le Markdown avec Fichier > Importer le texte Markdown. Il n’importe pas les bases de données CSV."] },
  { id: "partie-4", title: "Si vous voulez surtout l’IA", text: ["Pinto Notes conserve l’usage de Notes sur iPhone et Mac, avec des fichiers Markdown chiffrés, des modèles, des tableaux à colonnes typées et un historique. Il importe Notes, Obsidian, Evernote, Google Keep et Bear sur Mac, ainsi qu’un dossier de fichiers Markdown exporté depuis Notion. Il n’a ni vues de bases de données en tableau de projet ou calendrier, ni app Windows, Android ou web."] },
];
const LINKS = [
  ["Notes ou Obsidian", "/fr/blog/notes-iphone-vs-obsidian"],
  ["Alternatives à Notes", "/fr/blog/alternatives-notes-apple"],
  ["Importer vos notes", "/blog/import-your-notes"],
];
const FAQ = [
  { q: "Notion peut-il remplacer Notes et Rappels ?", a: ["En partie. Notion réunit notes et dates, mais Rappels ajoute les lieux, Siri et les tâches récurrentes."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-vs-notion"
    intro={"Notes sert à écrire et à cocher vite sur iPhone et Mac. Notion organise des pages et des bases de données, souvent pour une équipe. Voici ce que chacun vous apporte."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Gardez Notes pour les notes personnelles, les listes et les idées prises sur le vif. Prenez Notion si vous avez besoin de bases de données, de tableaux de projet, d’un wiki d’équipe ou d’apps Windows et Android.</p>
      <PostCta slug="fr/notes-iphone-vs-notion" path="/fr/blog/notes-iphone-vs-notion" position="answer" ui={ui.cta} title="Notes, avec ChatGPT ou Claude">
        <p>Pinto Notes reprend les dossiers, listes et tableaux de Notes sur iPhone et Mac. Vous pouvez connecter ChatGPT ou Claude pour lire et modifier vos notes et revenir à une version précédente.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} alt="Une page de réunion d’équipe dans Notion sur Mac, avec des tâches." caption="Une réunion d’équipe organisée dans Notion." />}
    faq={FAQ}>
    <h2>Aperçu</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Critère</th><th scope="col">Notes</th><th scope="col">Notion</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2>
    <ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Notes sur Mac avec les dossiers et une liste de courses à cocher." caption="Une liste de courses dans Notes sur Mac." />
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes sur Mac signale une ligne ajoutée par ChatGPT et propose Annuler." caption="Une ligne ajoutée par ChatGPT est signalée et peut être annulée." />
  </LocalPostPage>;
}
