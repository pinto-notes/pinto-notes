import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "limite-stockage-notes-iphone");

// Version française de /blog/apple-notes-storage-limit. Recherche : « limite stockage notes iphone » n’a renvoyé aucune suggestion ; titre fondé sur « stockage Notes » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/108922 (stockage iCloud plein); /fr-fr/108047 (forfaits iCloud+); /guide/notes/apde615d29c2/mac (Édition > Ajouter un lien); /guide/iphone/iph904eee369/ios (Suppr. récentes), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "L’espace iCloud partagé", text: ["Le compte iCloud offre 5 Go gratuits. Les forfaits iCloud+ proposés par Apple vont de 50 Go à 12 To. Les notes sous la rubrique iCloud partagent cet espace avec photos, sauvegardes et autres données ; une note partagée utilise l’espace de son propriétaire. Quand le stockage est plein, les données iCloud ne restent plus à jour sur tous vos appareils."] },
  { id: "partie-1", title: "Les limites d’une note", text: ["Les guides Apple n’indiquent aucun nombre pour la longueur d’une note, le nombre de pièces jointes ou la taille de chaque fichier. Notes affiche toutefois des messages lorsqu’il atteint une limite : trop de pièces jointes, fichier trop grand, note trop longue, trop de niveaux de dossiers ou note trop grande pour être verrouillée. Les nombres parfois cités sur des forums ne sont pas confirmés par Apple. Dans un compte Exchange, Apple indique aussi que les fichiers joints ne sont pas disponibles."] },
  { id: "partie-2", title: "Si Notes refuse une pièce jointe", text: ["Créez une seconde note pour les fichiers suivants et reliez les deux notes avec Édition > Ajouter un lien sur Mac. Pour parcourir les pièces jointes, ouvrez leur vue depuis la liste des notes sur iPhone ou le navigateur de pièces jointes sur Mac. Le guide Apple ne donne pas ici un libellé français pour tous les boutons d’icône ; cherchez l’action d’affichage des pièces jointes. Les notes verrouillées n’apparaissent pas dans ces vues."] },
  { id: "partie-3", title: "Vérifier la place utilisée", text: ["Sur iPhone, Réglages > Général > Stockage iPhone affiche la place prise par l’app Notes sur l’appareil. Réglages > votre nom > iCloud affiche l’espace du compte ; Notes y est compté dans les documents. Sur Mac, ouvrez Réglages Système > votre nom > iCloud. Les notes « Sur mon iPhone » ou « Sur mon Mac » restent sur cet appareil ; celles d’un compte Gmail utilisent ce compte."] },
  { id: "partie-4", title: "Faire de la place", text: ["Supprimez ou déplacez des données iCloud dont vous n’avez plus besoin, ou choisissez un forfait plus grand. Déplacer une grosse note vers « Sur mon Mac » libère iCloud, mais elle cesse de se synchroniser ; des pièces jointes peuvent se perdre lors d’un déplacement entre comptes. Une note supprimée reste 30 jours dans « Suppr. récentes ». Gardez une copie avant de nettoyer."] },
  { id: "partie-5", title: "Pinto Notes", text: ["Pinto Notes se synchronise par son propre service chiffré et ne prend pas de place dans votre forfait iCloud. Il accepte images, PDF et fichiers, sans que ce billet prétende connaître un quota Pinto. Lors d’un import de Notes, le texte et les images passent ; les PDF et autres pièces jointes restent dans Notes, qui n’est pas modifié."] },
];
const LINKS = [
  ["Où sont stockées vos notes ?", "/fr/blog/ou-sont-stockees-notes-iphone"],
  ["Notes ne se synchronise pas", "/fr/blog/notes-ne-se-synchronise-pas-iphone-mac"],
];
const FAQ = [
  { q: "Apple publie-t-elle une limite pour les pièces jointes ?", a: ["Non. Notes signale quand une limite est atteinte, mais les guides Apple consultés ne donnent pas de nombre."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="limite-stockage-notes-iphone" intro={"Votre iCloud est plein ou Notes refuse une pièce jointe ? Apple ne publie pas de quota séparé pour Notes. Voici les limites qu’elle indique et les endroits où vérifier l’espace utilisé."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Les notes du compte iCloud utilisent votre stockage iCloud, gratuit jusqu’à 5 Go, puis selon votre forfait. Apple ne publie pas de nombre maximal de pièces jointes ou de taille maximale d’une note dans ses guides.</p>
      <PostCta slug="fr/limite-stockage-notes-iphone" path="/fr/blog/limite-stockage-notes-iphone" position="answer" ui={ui.cta} title="Des notes hors du quota iCloud">
        <p>Pinto Notes utilise sa propre synchronisation chiffrée. Un iCloud plein n’empêche donc pas la synchronisation de vos notes Pinto.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} alt="Réglages iCloud sur iPhone avec Notes dans la liste des apps." caption="Notes partage l’espace de stockage iCloud. Image : Apple." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <Figure shot={SHOTS.iphoneFiles} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
    <h2>Articles liés en français</h2><ul><li><a href="/fr/blog/deplacer-notes-iphone-vers-icloud">Deplacer notes iphone vers icloud</a></li></ul>
  </LocalPostPage>;
}
