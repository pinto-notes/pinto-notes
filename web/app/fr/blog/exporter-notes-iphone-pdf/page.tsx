import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "exporter-notes-iphone-pdf");

// Version française de /blog/apple-notes-export-pdf. Recherche : « exporter notes iphone en pdf » → même requête, « exporter note apple en pdf », « transférer notes iphone en pdf » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (Fichier > Exporter vers, Enregistrer); /guide/iphone/iphdf551cfa2/ios (Annoter, Imprimer); /guide/mac-help/mchlp1531/mac (Fichier > Imprimer > Enregistrer au format PDF), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Sur Mac", text: ["Ouvrez la note, puis choisissez Fichier > Exporter vers et l’option PDF. Vous pouvez changer le nom, ajouter des tags Finder, choisir un dossier et cliquer sur Enregistrer. Le guide Apple actuel nomme « Exporter vers » ; pour macOS 26 et 15, l’article anglais décrit d’autres libellés, mais le guide français consulté ne les donne pas ici. Utilisez la commande d’export PDF visible dans votre version de Notes.", "Vous pouvez aussi choisir Fichier > Imprimer, puis « Enregistrer au format PDF » dans le menu PDF. « Options de sécurité » ajoute un mot de passe pour ouvrir, copier ou imprimer le fichier."] },
  { id: "partie-1", title: "Sur iPhone", text: ["Ouvrez la note. Touchez le bouton de partage puis « Annoter ». Si l’option n’apparaît pas, ouvrez d’abord les autres actions. Annotez le PDF si vous voulez, puis touchez le bouton prévu pour l’enregistrer. Pour une copie papier, utilisez le même bouton de partage et « Imprimer ». Le guide Apple ne nomme pas l’emplacement où le PDF annoté est enregistré ; choisissez celui proposé par votre iPhone."] },
  { id: "partie-2", title: "Le piège des scans", text: ["Apple précise qu’un PDF ou document scanné de plusieurs pages contenu dans une note ne sort que par sa première page lors de l’export PDF de la note sur iPhone. Si cette pièce jointe compte, transmettez aussi le fichier d’origine. Avant d’ouvrir une note verrouillée dans Pages, déverrouillez-la avec son mot de passe, Face ID ou Touch ID."] },
  { id: "partie-3", title: "Un dossier entier", text: ["Les guides Apple décrivent une note ouverte, pas l’export PDF d’un dossier ou de toute la bibliothèque. Pour quelques notes, exportez-les une par une. Vous pouvez demander une copie de vos données à privacy.apple.com ; Apple inclut les notes iCloud et donne 14 jours pour télécharger l’archive prête, sans préciser le format des notes.", "Sur Mac, l’outil libre notes-exporter peut produire des PDF, Markdown, HTML, Word ou EPUB et garder les dossiers. Il utilise Python et Google Chrome pour les PDF et ignore les notes verrouillées. Pour une sauvegarde réutilisable, Markdown est plus pratique qu’une série de PDF."] },
  { id: "partie-4", title: "Avec Pinto Notes", text: ["Sur Mac, Pinto Notes exporte la note affichée en PDF ou l’imprime. Ses notes sont déjà des fichiers Markdown. Dans les réglages du compte, l’export général crée une archive avec les dossiers et les pièces jointes. ChatGPT ou Claude peut les lire après connexion. L’import depuis Notes se fait sur Mac sans changer les notes d’origine."] },
];
const LINKS = [
  ["Où sont stockées vos notes ?", "/fr/blog/ou-sont-stockees-notes-iphone"],
  ["Exporter Notes en Markdown", "/blog/export-apple-notes-to-markdown"],
];
const FAQ = [
  { q: "Peut-on exporter tout un dossier en PDF depuis Notes ?", a: ["Les guides Apple ne décrivent pas cette commande. Sur Mac, un outil tiers peut exporter plusieurs notes."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="exporter-notes-iphone-pdf" intro={"Un PDF permet de transmettre une note à quelqu’un qui n’utilise pas Notes. La procédure diffère entre iPhone et Mac, et une pièce jointe de plusieurs pages demande une précaution."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Sur Mac, sélectionnez la note puis choisissez Fichier &gt; Exporter vers &gt; PDF. Sur iPhone, ouvrez la note, touchez le bouton de partage puis Annoter et enregistrez le PDF. Apple décrit l’export d’une note à la fois.</p>
      <PostCta slug="fr/exporter-notes-iphone-pdf" path="/fr/blog/exporter-notes-iphone-pdf" position="answer" ui={ui.cta} title="Des fichiers pour toutes vos notes">
        <p>Pinto Notes garde chaque note en Markdown. Sur Mac, vous pouvez exporter une note en PDF ou toute votre bibliothèque en archive avec ses dossiers.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/macos27/notes-export-to" width={770} height={795} alt="Menu Fichier de Notes sur Mac ouvert sur Exporter vers, avec les choix PDF et Markdown." caption="Dans Notes sur Mac, Fichier > Exporter vers propose PDF et Markdown." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <Figure shot={SHOTS.welcome} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
  </LocalPostPage>;
}
