import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-vs-google-keep");

// Version française de /blog/apple-notes-vs-google-keep. Recherche : « notes iphone vs google keep » → « apple note vs google keep », « ios notes vs google keep » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/iphone/iph904eee369/ios (Suppr. récentes, 30 jours); /fr-fr/102537 (verrouillage); /guide/notes/not201900c07/mac (import), lus le 21 novembre 2026.
// Les faits sur les autres apps et Pinto Notes viennent de l’article anglais du 21 novembre 2026.

const ui = UI.fr;
const ROWS = [
  ["Appareils", "iPhone, Mac ; iCloud.com sur ordinateur", "iPhone, Android et navigateur"],
  ["Organisation", "Dossiers, tags, dossiers intelligents", "Étiquettes, couleurs, épingles ; pas de dossiers"],
  ["Listes", "Listes de pointage et tableaux", "Listes réorganisables et rappels"],
  ["Versions", "Pas d’historique des versions", "Anciennes versions du texte sur ordinateur"],
  ["Notes supprimées", "30 jours dans Suppr. récentes", "Corbeille Keep pendant 7 jours"],
];
const SECTIONS = [
  { id: "partie-0", title: "Ce que Notes fait mieux", text: ["Notes garde des documents plus longs avec titres, tableaux, PDF, scans et fichiers joints. Les tags et dossiers intelligents complètent les dossiers. La recherche lit le texte des notes et des scans. Une note peut être protégée par un mot de passe, Face ID ou Touch ID, si son contenu permet le verrouillage.", "Notes est intégré à iPhone et Mac. Les notes iCloud s’ouvrent aussi sur iCloud.com. Après suppression, elles restent 30 jours dans « Suppr. récentes ». Notes ne garde pas d’historique du texte."] },
  { id: "partie-1", title: "Ce que Keep fait mieux", text: ["Keep fonctionne sur Android, iPhone, Wear OS et dans un navigateur. Il ne fonctionne pas sur Apple Watch. Ses cartes ont des couleurs, des étiquettes et des épingles. Vous pouvez réorganiser et mettre en retrait les listes, partager avec une personne, un groupe Google ou votre famille, définir des rappels récurrents qui apparaissent aussi dans Google Agenda et Tasks, dicter une note vocale sur iPhone et retrouver les anciennes versions du texte sur ordinateur. Il accepte jusqu’à 50 étiquettes, sans dossiers.", "Keep peut chercher du texte dans une photo en anglais, enregistrer une page avec son extension Chrome et copier une note vers Google Docs sur ordinateur. Une note supprimée reste récupérable pendant 7 jours. Gemini peut créer une liste ou titrer une note sur Android avec Google AI Pro, Ultra ou un Pixel. Keep convient aux petites notes ; Notes est plus adapté aux longs documents avec tableaux et pièces jointes."] },
  { id: "partie-2", title: "Passer de l’un à l’autre", text: ["Les deux apps ne se synchronisent pas. Pour quelques notes, copiez leur contenu. Pour toute la collection Keep, téléchargez-la avec Google Takeout puis importez les fichiers HTML dans Notes sur Mac. Les étiquettes Keep ne deviennent pas automatiquement des tags Notes. Dans l’autre sens, Keep n’a pas d’importeur Notes : copiez les notes une par une. Ajouter un compte Google dans Notes ne fait pas apparaître les cartes Keep."] },
  { id: "partie-3", title: "Pinto Notes", text: ["Pinto Notes importe Google Keep et Notes sur Mac. Les notes Keep conservent leurs listes cochées, épingles et images ; les étiquettes peuvent devenir dossiers ou tags. Les couleurs, dessins et rappels ne passent pas. Chaque version antérieure reste disponible ; vous pouvez partager une note par lien et la modifier ensemble sur iPhone et Mac. ChatGPT, Claude, Claude Code et Codex peuvent lire et modifier vos notes après connexion. Pinto Notes fonctionne sur iPhone et Mac, sans app Android, Windows ou web."] },
];
const LINKS = [
  ["Passer de Google Keep à Notes", "/fr/blog/google-keep-vers-notes-iphone"],
  ["Alternatives à Notes", "/fr/blog/alternatives-notes-apple"],
];
const FAQ = [
  { q: "Keep se synchronise-t-il avec Notes ?", a: ["Non. Même avec un compte Google ajouté à Notes, les notes de Keep restent dans Keep."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-vs-google-keep"
    intro={"Google Keep et Notes permettent tous deux de saisir une idée ou une liste en quelques secondes. Keep suit votre compte Google ; Notes suit votre compte Apple. Le choix se joue surtout sur vos appareils."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Choisissez Notes si vous utilisez iPhone et Mac et voulez dossiers, tableaux, scans et notes verrouillées. Choisissez Google Keep si vous passez aussi sur Android ou dans un navigateur et aimez ses cartes, rappels et listes partagées.</p>
      <PostCta slug="fr/notes-iphone-vs-google-keep" path="/fr/blog/notes-iphone-vs-google-keep" position="answer" ui={ui.cta} title="Vos notes et listes, avec votre IA">
        <p>Pinto Notes importe Google Keep ou Notes sur Mac. Sur iPhone et Mac, ChatGPT ou Claude peut ensuite lire et modifier les notes après connexion.</p>
      </PostCta>
    </Answer>}
    
    faq={FAQ}>
    <h2>Aperçu</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Critère</th><th scope="col">Notes</th><th scope="col">Google Keep</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2>
    <ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Notes sur Mac avec les dossiers et une liste de courses à cocher." caption="Une liste de courses dans Notes sur Mac." />
      <PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} alt="Guide d’importation de Google Keep dans Pinto Notes sur Mac." caption="Le guide d’importation de Google Keep." />
  </LocalPostPage>;
}
