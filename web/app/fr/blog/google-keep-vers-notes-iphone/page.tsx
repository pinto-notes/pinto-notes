import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "google-keep-vers-notes-iphone");

// Version française de /blog/google-keep-to-apple-notes. Recherche : « google keep vers notes iphone » → « google keep note iphone app », « google keep notes iphone » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/notes/not201900c07/mac (Fichier > Importer dans Notes, HTML); /guide/iphone/iph7262fd4fe/ios (Comptes Notes), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Quelques notes : copier et coller", text: ["Ouvrez la note dans Keep, sélectionnez son contenu, copiez-le puis collez-le dans une nouvelle note Apple. Recréez la liste de pointage si nécessaire. Pour deux ou trois notes, cela prend moins de temps qu’une archive."] },
  { id: "partie-1", title: "Toute la collection : Google Takeout", text: ["Dans Google Takeout, ne gardez que Keep si vous ne voulez pas télécharger les autres données. Demandez une archive ZIP ou TGZ et attendez le lien reçu par courriel ; Google annonce de quelques minutes à quelques jours. Le lien expire après environ sept jours et l’archive peut être téléchargée cinq fois. Takeout copie les notes encore présentes, sans les supprimer de Keep."] },
  { id: "partie-2", title: "Importer sur Mac", text: ["Décompressez l’archive et ouvrez le dossier Keep pour voir les fichiers. Le téléchargement observé pour l’importeur Pinto contient un HTML et un JSON par note ; vérifiez le vôtre. Notes sur Mac accepte HTML, texte, RTF, ENEX et Markdown, mais pas un format « Google Keep ». Sélectionnez les fichiers HTML puis choisissez Fichier > Importer dans Notes. Les nouvelles notes arrivent dans « Notes importées »."] },
  { id: "partie-3", title: "Ce qui demande une vérification", text: ["Google indique que Takeout peut contenir le texte, les éléments des listes, images, sons, dessins, couleurs, état épinglé ou archivé, personnes associées et étiquettes. Apple ne promet pas de convertir ces propriétés Keep. Comparez quelques notes et refaites les listes de pointage ou les tags importants. Avec un compte professionnel ou scolaire, l’export peut être incomplet."] },
  { id: "partie-4", title: "Keep et un compte Google dans Notes", text: ["Ajouter un compte Google sous Réglages > Apps > Notes > Comptes Notes ne transfère pas Keep. Cela synchronise les notes du compte mail, pas les cartes Keep. Il n’existe pas de synchronisation dans l’autre sens non plus."] },
  { id: "partie-5", title: "L’import dans Pinto Notes", text: ["Sur Mac, Pinto Notes lit l’archive Keep. Les étiquettes deviennent des dossiers ou des tags selon votre choix ; listes cochées, épingles et images suivent. Les notes archivées ne viennent que si vous le demandez. Couleurs, dessins et rappels ne passent pas, et l’app le signale. La corbeille Keep n’est pas importée."] },
];
const LINKS = [
  ["Notes ou Google Keep", "/fr/blog/notes-iphone-vs-google-keep"],
  ["Alternatives à Notes", "/fr/blog/alternatives-notes-apple"],
];
const FAQ = [
  { q: "Google Takeout supprime-t-il mes notes Keep ?", a: ["Non. Il crée une copie à télécharger. Les notes déjà supprimées dans Keep n’y figurent pas."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="google-keep-vers-notes-iphone" intro={"Keep et Notes ne se synchronisent pas. Pour quelques notes, copier et coller suffit. Pour une collection entière, Google Takeout et un Mac évitent de tout recopier."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Téléchargez vos données Keep avec Google Takeout. Dans le dossier reçu, vérifiez les fichiers HTML, puis importez-les dans Notes sur Mac par Fichier &gt; Importer dans Notes. Pour quelques notes sur iPhone, copiez plutôt leur contenu.</p>
      <PostCta slug="fr/google-keep-vers-notes-iphone" path="/fr/blog/google-keep-vers-notes-iphone" position="answer" ui={ui.cta} title="Importer Keep avec ses listes">
        <p>Pinto Notes importe toute la collection Keep sur Mac. Les listes cochées et les images suivent ; vous pouvez transformer les étiquettes en dossiers ou en tags.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} alt="Guide d’importation de Google Keep dans Pinto Notes sur Mac." caption="Le guide d’importation de Google Keep." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
  </LocalPostPage>;
}
