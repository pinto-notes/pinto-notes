import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "evernote-vers-notes-apple");

// Version française de /blog/evernote-to-apple-notes. Recherche : « passer de evernote à notes apple » n’a renvoyé aucune suggestion ; titre descriptif (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (Fichier > Importer dans Notes, Notes importées, import des tags ENEX dès macOS 13); /fr-fr/102223, lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Avant de commencer", text: ["Il vous faut un Mac pour importer les fichiers ENEX dans Notes. Evernote permet l’export dans son app de bureau pour Mac ou Windows, y compris avec un compte gratuit, mais pas sur le web. Pour retrouver les notes sur iPhone, importez-les dans un dossier iCloud plutôt que dans « Sur mon Mac »."] },
  { id: "partie-1", title: "Exporter les carnets", text: ["Dans Evernote, sélectionnez un carnet, faites un clic droit et choisissez l’exportation au format ENEX. Gardez les attributs utiles, surtout les tags et la date de création. Exportez, puis recommencez pour chaque carnet. Vous pouvez sélectionner jusqu’à 100 notes à la fois ou un carnet entier. Evernote propose une taille maximale de fichier ENEX entre 300 Mo et 2 Go."] },
  { id: "partie-2", title: "Importer dans Notes", text: ["Sur Mac, cliquez sur un dossier du compte iCloud dans la barre latérale. Choisissez Fichier > Importer dans Notes, sélectionnez le fichier ENEX puis confirmez. Les notes apparaissent dans « Notes importées » ; renommez ce dossier pour garder le nom du carnet avant d’importer le suivant. L’option « Conserver la structure des dossiers lors de l’importation » concerne les dossiers de fichiers. Apple ne dit pas que plusieurs ENEX choisis ensemble deviennent chacun un dossier."] },
  { id: "partie-3", title: "Contrôler le résultat", text: ["Apple indique que chaque note ENEX devient une note et que les tags peuvent être importés depuis macOS 13. Une pièce jointe ou une fonction non prise en charge peut manquer sans qu’Apple en donne une liste. Essayez d’abord un petit carnet, puis comparez des notes avec tableaux, listes et pièces jointes, vérifiez les tags et comptez les notes avant de fermer Evernote."] },
  { id: "partie-4", title: "Evernote ou Notes ?", text: ["Evernote propose des apps Windows et Android, un outil de capture web, une recherche avancée, des tâches et plusieurs fonctions d’IA. Son offre gratuite s’arrête à 50 notes, un carnet et un appareil. Notes est déjà sur iPhone et Mac, avec iCloud et la transcription sur certains appareils, mais sans app Windows ou Android et sans historique des versions."] },
  { id: "partie-5", title: "Autre voie avec Pinto Notes", text: ["Pinto Notes importe tous les ENEX en une fois sur Mac. Chaque carnet devient un dossier, les tags et les fichiers joints suivent, ainsi que les dates de création et de modification. Evernote reste intact. Après connexion, ChatGPT ou Claude peut accéder aux notes depuis votre téléphone ou le web ; Pinto Notes conserve leurs versions antérieures. Il n’a pas d’app Windows, Android ou web."] },
];
const LINKS = [
  ["Notes ou Evernote : autres alternatives", "/fr/blog/alternatives-notes-apple"],
  ["Importer vos notes", "/blog/import-your-notes"],
];
const FAQ = [
  { q: "Peut-on importer Evernote directement sur iPhone ?", a: ["Apple documente l’import ENEX sur Mac. Une fois importées dans iCloud, les notes apparaissent sur l’iPhone avec le même compte Apple."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="evernote-vers-notes-apple" intro={"Notes peut lire les fichiers exportés par Evernote sur Mac. Il faut exporter les carnets depuis l’app Evernote, puis vérifier quelques notes après l’importation."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Dans Evernote sur Mac ou Windows, exportez chaque carnet en ENEX. Sur Mac, ouvrez Notes, choisissez un dossier iCloud puis Fichier &gt; Importer dans Notes. Les notes arrivent dans « Notes importées » et se synchronisent avec votre iPhone.</p>
      <PostCta slug="fr/evernote-vers-notes-apple" path="/fr/blog/evernote-vers-notes-apple" position="answer" ui={ui.cta} title="Importer Evernote dans Pinto Notes">
        <p>Pinto Notes importe les fichiers ENEX sur Mac, avec les carnets en dossiers et leurs tags. ChatGPT ou Claude peut ensuite consulter et modifier vos notes après connexion.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/launch/import-file-menu" width={820} height={800} alt="Menu d’importation de Pinto Notes sur Mac avec plusieurs apps." caption="Pinto Notes importe plusieurs formats depuis le menu Fichier." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785} alt="L’assistant IA d’Evernote sur Mac déplace une note entre carnets." caption="L’assistant IA dans Evernote sur Mac. Image : Evernote." />
  </LocalPostPage>;
}
