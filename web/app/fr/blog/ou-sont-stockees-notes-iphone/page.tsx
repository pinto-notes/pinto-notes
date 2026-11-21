import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "ou-sont-stockees-notes-iphone");

// Version française de /blog/where-are-apple-notes-stored. Recherche : « où sont stockées les notes iphone » → même requête (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/iphone/iph7262fd4fe/ios (Réglages > Apps > Notes > Comptes Notes, Sur mon iPhone); /guide/notes/not85d6f7b58/mac (Notes > Comptes, Sur mon Mac); /guide/notes/not201900c07/mac (Exporter vers), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Voir le compte d’une note", text: ["Sur iPhone, revenez à la liste des dossiers ; sur Mac, regardez la barre latérale. Les rubriques iCloud, « Sur mon iPhone », « Sur mon Mac », Gmail ou Yahoo indiquent où une note est gardée. Pour afficher les comptes sur iPhone, ouvrez Réglages > Apps > Notes > Comptes Notes. Sur Mac, choisissez Notes > Comptes. Désactiver un compte masque ses notes sur l’appareil sans les supprimer du compte Internet."] },
  { id: "partie-1", title: "Les notes iCloud", text: ["Elles se synchronisent avec les iPhone et Mac utilisant votre compte Apple et Notes activé, et s’ouvrent sur icloud.com/notes. Sur iPhone, ouvrez Réglages > votre nom > iCloud > Tout voir > Notes. La protection iCloud standard chiffre les données pendant le transfert et sur les serveurs, avec des clés détenues par Apple. La protection avancée garde les clés sur vos appareils de confiance.", "La synchronisation n’est pas une sauvegarde. Une suppression suit tous les appareils ; la note reste 30 jours dans « Suppr. récentes » avant de disparaître."] },
  { id: "partie-2", title: "Sur un seul appareil", text: ["Apple indique que « Sur mon iPhone » reste sur cet iPhone et fait partie de ses sauvegardes iCloud. « Sur mon Mac » reste sur ce Mac et n’est pas accessible sur iCloud.com. Pour activer ce dernier, choisissez Notes > Réglages puis « Activer le compte Sur mon Mac ». Apple ne donne aucun chemin Finder pour les fichiers internes. Pour obtenir un fichier, choisissez Fichier > Exporter vers puis PDF ou Markdown dans Notes sur Mac."] },
  { id: "partie-3", title: "Dans Gmail ou un autre compte", text: ["Les notes placées sous Gmail, Yahoo ou Exchange restent dans ce compte et se synchronisent sur les appareils où il est configuré. Certaines fonctions Notes manquent ; elles ne peuvent notamment pas être verrouillées. Une note supprimée dans un compte mail peut aller dans sa corbeille Mail plutôt que dans « Suppr. récentes ». Retirer le compte de l’appareil laisse les notes dans le compte en ligne."] },
  { id: "partie-4", title: "Le compte par défaut", text: ["Les notes créées par Siri ou par le widget vont au compte par défaut. Vérifiez-le dans Réglages > Apps > Notes sur iPhone, ou dans Notes > Réglages sur Mac. Si une note manque sur votre autre appareil, vérifiez d’abord sa rubrique de compte."] },
  { id: "partie-5", title: "Pinto Notes", text: ["Pinto Notes utilise une connexion pour synchroniser entre iPhone et Mac, sans rubriques « Sur mon iPhone » ou Gmail. Ses notes sont des fichiers Markdown chiffrés sur l’appareil avant leur envoi et chaque version reste disponible. L’import des notes Apple se fait sur Mac, sans modifier les originaux. Il n’existe pas d’app Windows, Android ou web."] },
];
const LINKS = [
  ["Déplacer des notes vers iCloud", "/fr/blog/deplacer-notes-iphone-vers-icloud"],
  ["Notes ne se synchronise pas", "/fr/blog/notes-ne-se-synchronise-pas-iphone-mac"],
  ["Limite de stockage de Notes", "/fr/blog/limite-stockage-notes-iphone"],
];
const FAQ = [
  { q: "Les notes sont-elles des fichiers dans le Finder ?", a: ["Les guides Apple ne donnent aucun dossier Finder à ouvrir. Exportez une note en PDF ou Markdown sur Mac si vous voulez un fichier."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="ou-sont-stockees-notes-iphone" intro={"Chaque note appartient à un compte. Le nom au-dessus de son dossier vous dit si elle est dans iCloud, sur un seul appareil ou dans un compte mail."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Sous iCloud, les notes se retrouvent sur vos appareils connectés au même compte Apple et sur iCloud.com. Sous « Sur mon iPhone » ou « Sur mon Mac », elles restent sur cet appareil. Sous Gmail ou Yahoo, elles appartiennent à ce compte mail.</p>
      <PostCta slug="fr/ou-sont-stockees-notes-iphone" path="/fr/blog/ou-sont-stockees-notes-iphone" position="answer" ui={ui.cta} title="Un seul endroit pour vos notes">
        <p>Pinto Notes réunit vos notes sur iPhone et Mac sous un seul compte. Elles sont chiffrées avant la synchronisation et accessibles à ChatGPT ou Claude après connexion.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} alt="Liste des dossiers et des tags dans Notes sur iPhone." caption="Les dossiers et tags de Notes sur iPhone. Image : Apple." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} alt="Réglages iCloud sur iPhone avec Notes dans la liste des apps." caption="Notes partage l’espace de stockage iCloud. Image : Apple." />
      <PostFigure src="/blog/macos27/notes27-settings-default-account-on-my-mac" width={1148} height={1000} alt="Réglages de Notes sur Mac avec le compte Sur mon Mac activé." caption="Les notes Sur mon Mac restent sur cet ordinateur." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} alt="Réglages du compte Gmail sur iPhone avec Notes activé." caption="Les notes peuvent être stockées dans un compte mail. Image : Apple." />
      <Figure shot={SHOTS.connectList} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
  </LocalPostPage>;
}
