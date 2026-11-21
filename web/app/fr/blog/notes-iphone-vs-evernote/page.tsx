import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-vs-evernote");

// Version française de /blog/apple-notes-vs-evernote. Recherche : « evernote vs notes iphone » → « evernote vs notes apple », « evernote vs iphone notes » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (import ENEX et tags dès macOS 13), /fr-fr/102223 (éléments non pris en charge), /guide/icloud/mm000b55f946/icloud (Notes sur le web), lus le 21 novembre 2026.
// Faits Evernote, OneNote et Pinto repris de l’article anglais du 21 novembre 2026. Aucun tarif ajouté.

const ui = UI.fr;
const ROWS = [
  ["Appareils", "iPhone, Mac et iCloud.com", "iPhone, Mac, Windows, Android et web"],
  ["Classement", "Dossiers, tags et dossiers intelligents", "Carnets, tags et recherches enregistrées"],
  ["Tâches", "Listes de pointage", "Échéances, récurrences et rappels"],
  ["Recherche web", "Liens et notes rédigées à la main", "Web Clipper enregistre articles et PDF"],
];
const SECTIONS = [
  { id: "notes", title: "Quand choisir Notes", text: ["Pour les courses, les réunions et les idées, Notes permet de cocher des listes, épingler une note et mettre des informations en tableau. La recherche parcourt le texte. Un tag peut rassembler des notes de plusieurs dossiers dans un dossier intelligent.", "Pour modifier une note à plusieurs, chaque personne doit avoir un compte Apple. Avec Notes activé dans iCloud, les notes se retrouvent sur vos appareils et sur iCloud.com. Si vous utilisez parfois un PC, essayez la version web avant de déplacer toute votre bibliothèque."] },
  { id: "evernote", title: "Quand choisir Evernote", text: ["Web Clipper enregistre le contenu d’un article ou d’une page web, des PDF et des captures d’écran. Vous pouvez annoter une capture et choisir le carnet et les tags à l’enregistrement.", "Les tâches se trouvent dans les notes. Evernote leur donne des échéances, des récurrences et des rappels. Vous pouvez les attribuer à quelqu’un et les afficher par note ou par date. La recherche propose aussi des filtres par mot, date et lieu ainsi que des recherches enregistrées."] },
  { id: "ia", title: "L’IA dans Evernote", text: ["L’assistant IA d’Evernote peut chercher des informations, créer du contenu et classer les notes depuis une conversation. La recherche sémantique retrouve des contenus proches. AI Meeting Notes enregistre, transcrit et résume les échanges. L’assistant a des limites mensuelles et par conversation.", "Evernote indique aussi une connexion MCP avec ChatGPT et Claude. Si c’est votre besoin principal, vérifiez d’abord ce que permet votre compte actuel."] },
  { id: "onenote", title: "Et OneNote ?", text: ["OneNote propose des carnets numériques pour le travail partagé, avec dessin et écriture manuscrite. Microsoft a des apps iPhone et Android. Essayez la même note dans chaque app en tenant compte de vos appareils."] },
  { id: "passer", title: "Avant de quitter Evernote", text: ["Notes sur Mac importe les fichiers ENEX d’Evernote et, dès macOS 13, leurs tags. Apple prévient que certaines pièces jointes ou fonctions non prises en charge peuvent manquer. Commencez par un carnet et comparez les notes importantes avant de poursuivre."] },
  { id: "pinto", title: "Ce que propose Pinto Notes", text: ["Pinto Notes ressemble à Notes sur iPhone et Mac. Il conserve des fichiers Markdown chiffrés et les versions précédentes. Après connexion, ChatGPT ou Claude peut lire et modifier les notes.", "Sur Mac, exportez chaque carnet Evernote en ENEX. Pinto Notes les importe en une fois : chaque carnet devient un dossier et ses tags suivent. Evernote reste intact. Pinto Notes n’a pas d’app Windows, Android ou web. Les notes d’Apple peuvent aussi être importées sur Mac sans y changer quoi que ce soit."] },
];
const FAQ = [
  { q: "Evernote ou Notes avec un iPhone et un PC Windows ?", a: ["Evernote propose des apps pour les deux. Notes est accessible sur iCloud.com depuis le navigateur du PC. Essayez-le avec une vraie note avant de choisir."] },
  { q: "Evernote gratuit se synchronise-t-il entre téléphone et ordinateur ?", a: ["L’offre gratuite indiquait un seul appareil le 21 novembre 2026, ainsi que 50 notes et un carnet. Vérifiez le nombre d’appareils permis par les offres payantes."] },
  { q: "Evernote se connecte-t-il à ChatGPT ou Claude ?", a: ["Oui. Evernote indique une connexion MCP pour ces outils et propose également son propre assistant IA."] },
  { q: "Notes sur iPhone est-il le même que Notes d’Apple ?", a: ["Oui. Avec Notes activé dans iCloud, vos notes iCloud se retrouvent aussi sur Mac et sur iCloud.com."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-vs-evernote" intro="Notes suffit pour les listes et les notes personnelles sur iPhone et Mac. Evernote ajoute des apps Windows et Android, la capture de pages web et des tâches avec échéance."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Choisissez Notes pour écrire et cocher sur les appareils Apple. Choisissez Evernote pour son Web Clipper, ses rappels ou ses apps Windows et Android. Son offre gratuite se limite à 50 notes, un carnet et un appareil.</p>
      <PostCta slug="fr/notes-iphone-vs-evernote" path="/fr/blog/notes-iphone-vs-evernote" position="answer" ui={ui.cta} title="Importer vos carnets Evernote"><p>Pinto Notes importe les carnets Evernote comme dossiers avec leurs tags. ChatGPT ou Claude peut ensuite lire et modifier les notes après connexion.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2>Aperçu</h2><div className="tableWrap"><table><thead><tr><th scope="col">Critère</th><th scope="col">Notes</th><th scope="col">Evernote</th></tr></thead><tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    <p>Fonctions vérifiées sur les sites des éditeurs le 21 novembre 2026. Consultez les <a href="https://evernote.com/compare-plans">limites actuelles des offres Evernote</a> avant d’importer une grande collection.</p>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <p>Voir aussi <a href="https://evernote.com/features/webclipper">Web Clipper</a>, <a href="https://evernote.com/features/tasks">les tâches Evernote</a> et <a href="https://support.apple.com/fr-fr/guide/notes/not201900c07/mac">l’import ENEX dans Notes</a>.</p>
    <h2>À lire aussi</h2><ul><li><a href="/fr/blog/evernote-vers-notes-apple">Passer d’Evernote à Notes</a></li><li><a href="/fr/blog/notes-iphone-vs-onenote">Notes ou OneNote</a></li><li><a href="/fr/blog/alternatives-notes-apple">Autres alternatives à Notes</a></li></ul>
    <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu Fichier de Pinto Notes sur Mac avec Evernote parmi les choix d’importation." caption="Le menu Fichier de Pinto Notes permet d’importer des carnets Evernote." />
  </LocalPostPage>;
}
