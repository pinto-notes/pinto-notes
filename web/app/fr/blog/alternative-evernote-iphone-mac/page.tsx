import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-evernote-iphone-mac");

// Version française de /blog/evernote-alternative. Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative à evernote » renvoie « alternative gratuite à evernote », « quelle alternative à evernote », « alternative evernote open source », « alternative evernote mac » ; « alternative evernote mac » renvoie aussi « evernote alternative apple ».
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/102223 et /fr-fr/guide/notes/not201900c07/mac (Fichier > Importer dans Notes ; Notes importées ; tags ENEX depuis macOS 13). Autres faits repris de l'article anglais, à partir des guides Evernote, Obsidian, Notion, Bear et Joplin qu'il cite. Aucune migration de ces autres apps testée.

const ui = UI.fr;
const ROWS = [
  ["Notes d'Apple", "Notes personnelles sur appareils Apple", "Fichiers .enex sur Mac", "Les pièces jointes ou fonctions non prises en charge peuvent manquer"],
  ["Pinto Notes", "L'allure de Notes avec ChatGPT ou Claude", "Fichiers .enex sur Mac, carnets transformés en dossiers", "iPhone et Mac uniquement"],
  ["Obsidian", "Fichiers Markdown locaux et recherche liée", "Fichiers .enex avec l'extension officielle Importer", "Choisir séparément la synchronisation"],
  ["Notion", "Pages et bases de données d'équipe", "Connexion au compte Evernote sur ordinateur ou web", "Pas d'import .enex documenté"],
  ["Bear", "Écriture Markdown organisée par tags", "Fichiers .enex sur Mac ou iPhone", "Synchronisation iCloud réservée à Pro"],
  ["Joplin", "Carnets open source et capture web", "Fichiers .enex dans l'app de bureau", "Choisir le service de synchronisation et le format d'import"],
];
const FAQ = [
  { q: "Quelles alternatives gratuites importent des carnets Evernote ?", a: ["Notes d'Apple, Pinto Notes, Obsidian et Joplin acceptent les fichiers .enex. Obsidian Sync est payant ; Joplin laisse choisir un service de synchronisation. Evernote indique que les comptes gratuits peuvent exporter."] },
  { q: "Peut-on importer une sauvegarde ENEX dans Notion ?", a: ["L'outil officiel de Notion se connecte au compte Evernote. Son guide ne décrit pas le dépôt d'un fichier .enex. Notes, Pinto Notes, Obsidian, Bear et Joplin documentent l'import de fichiers."] },
  { q: "Peut-on quitter Evernote avec le seul iPhone ?", a: ["Evernote réserve l'export à son app de bureau sur Mac ou Windows. Bear peut importer un .enex existant sur iPhone, mais il faut d'abord obtenir ce fichier. L'import Notion se fait sur ordinateur ou sur le web."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="alternative-evernote-iphone-mac"
    intro="Notes d'Apple est une alternative simple à Evernote pour les notes personnelles sur Mac et iPhone. Pinto Notes ajoute l'accès par l'IA, Obsidian les fichiers Markdown, Notion le travail d'équipe, Bear l'écriture et Joplin des carnets open source."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparatif", label: "Comparer les six" }, { href: "#export", label: "Exporter Evernote" },
      { href: "#apple", label: "Choisir un import" }, { href: "#verifier", label: "Vérifier le résultat" },
    ]}>
      <p>Notes d'Apple, Pinto Notes, Obsidian et Joplin sont des choix gratuits qui acceptent les exports .enex d'Evernote. Bear les accepte aussi, mais demande Pro pour synchroniser par iCloud. Notion convient au travail partagé ; son import officiel se connecte au compte Evernote.</p>
      <PostCta slug="fr/alternative-evernote-iphone-mac" path="/fr/blog/alternative-evernote-iphone-mac" position="answer" ui={ui.cta} title="Importer vos carnets Evernote">
        <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Importez les carnets Evernote sur Mac, puis connectez ChatGPT ou Claude pour lire et modifier vos notes.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu Fichier de Pinto Notes sur Mac, avec l'import depuis Evernote et d'autres apps." caption="Pinto Notes propose l'import Evernote depuis le menu Fichier sur Mac. Capture : Pinto Notes." />}
    faq={FAQ}>
    <h2 id="comparatif">Quelle alternative convient à vos notes ?</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Pour quoi</th><th scope="col">Import Evernote</th><th scope="col">À vérifier</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>
    <p>Ces voies d'import viennent des guides des éditeurs, lus le 21 novembre 2026.</p>

    <h2 id="export">Exporter d'abord chaque carnet Evernote</h2>
    <p>Dans l'app Evernote pour Mac ou Windows, sélectionnez un carnet, lancez l'export et choisissez ENEX. Gardez les tags et les autres attributs utiles. Exportez chaque carnet séparément et conservez les fichiers comme sauvegarde. Selon <a href="https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML">Evernote</a>, l'export fonctionne avec un compte gratuit, mais pas depuis Evernote Web.</p>

    <h2 id="apple">Notes d'Apple pour les notes personnelles</h2>
    <p>Notes permet de ranger les notes dans des dossiers, d'utiliser des tags et de chercher leur contenu. iCloud les rend disponibles sur les appareils connectés au même compte Apple. Sur Mac, sélectionnez un dossier iCloud ou « Sur mon Mac », puis choisissez Fichier &gt; Importer dans Notes et votre fichier .enex. Choisissez iCloud pour retrouver les notes sur iPhone. Apple indique que les tags sont importés depuis macOS 13 et que les éléments non pris en charge peuvent manquer. Le <a href="/fr/blog/evernote-vers-notes-apple">guide pour passer d'Evernote à Notes</a> détaille les vérifications.</p>

    <h2 id="pinto">Pinto Notes pour l'allure de Notes et l'IA</h2>
    <p>Pinto Notes ressemble à Notes sur iPhone et Mac. Les notes sont des fichiers Markdown et chaque ancienne version reste dans l'historique. Après <a href="/blog/connect-chatgpt-to-your-notes">connexion</a>, ChatGPT ou Claude peut les lire et les modifier. Sur Mac, exportez chaque carnet Evernote en .enex et importez tous les fichiers ensemble. Chaque carnet devient un dossier et les tags suivent. Le menu Fichier propose l'import Evernote. <a href="/blog/import-your-notes">L'import</a> laisse l'ancienne app intacte. Pinto Notes n'a pas d'app Windows, Android ou web.</p>

    <h2 id="obsidian">Obsidian pour les fichiers Markdown</h2>
    <p>Obsidian garde ses notes dans des fichiers Markdown locaux, avec liens, graphe et extensions communautaires. Il existe sur Mac, iPhone, Windows, Linux et Android. L'app est gratuite ; Sync est facultatif et payant. Installez l'extension officielle Importer dans les réglages des extensions communautaires, choisissez Evernote (.enex), puis prévisualisez avant de confirmer. Son <a href="https://obsidian.md/help/import/evernote">guide</a> explique comment préserver les piles de carnets par les noms de fichiers et la hiérarchie des tags en les renommant. Un export ordinaire ne conserve pas ces structures.</p>

    <h2 id="notion">Notion pour le travail partagé</h2>
    <p>Notion transforme les carnets Evernote en pages et les notes en éléments de base de données. Il existe sur Mac, iPhone, Windows, Android et le web. Sur ordinateur ou dans le navigateur, ouvrez les réglages d'import, choisissez Evernote, connectez le compte et sélectionnez les carnets. Son <a href="https://www.notion.com/help/import-data-into-notion">guide officiel</a> décrit cette connexion, pas l'envoi d'un .enex. Il exclut Evernote Teams et prévient que des images peuvent demander des retouches. Gardez accès au compte Evernote jusqu'à la vérification.</p>

    <h2 id="bear">Bear pour écrire avec des tags</h2>
    <p>Bear a un éditeur Markdown avec tableaux et listes de tâches sur Mac et iPhone. La <a href="https://bear.app/">synchronisation iCloud demande Pro</a>. Sur Mac, son <a href="https://bear.app/faq/migrate-from-evernote/">guide de migration</a> passe par Fichier, l'import depuis Evernote et un .enex. Sur iPhone, l'import se trouve dans le menu de la barre latérale. Le format .enex ne contient pas l'organisation en carnets ; Bear suggère d'ajouter des tags avant l'export pour garder leurs noms comme repères.</p>

    <h2 id="joplin">Joplin pour les carnets open source</h2>
    <p>Joplin est gratuit, open source et utilisable hors ligne, avec carnets, tags et outil de capture web. Il existe sur Mac, iPhone, Windows, Linux et Android. Vous choisissez un service de synchronisation, comme Dropbox ou OneDrive, à part de l'import. Dans l'app de bureau, importez les fichiers ENEX. Joplin accepte un fichier ou un dossier de fichiers et crée un carnet par fichier. Tags et pièces jointes suivent. Son <a href="https://joplinapp.org/help/apps/import_export/">guide</a> explique le choix entre Markdown et HTML : la conversion Markdown peut perdre les couleurs et polices, et certains liens entre notes demandent des corrections.</p>

    <h2 id="verifier">Essayer un petit carnet avant de tout déplacer</h2>
    <p>Choisissez un carnet représentatif. Avant de quitter Evernote :</p>
    <ul><li>Comparez le nombre de notes et ouvrez des exemples avec pièces jointes ou tableaux.</li><li>Vérifiez les tags, l'organisation des carnets et les liens entre notes.</li><li>Cherchez une note connue et ouvrez-la sur iPhone après avoir réglé la synchronisation.</li><li>Conservez les fichiers .enex d'origine tant que le résultat n'est pas vérifié.</li></ul>
  </LocalPostPage>;
}
