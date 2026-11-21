import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-vs-onenote");

// Version française de /blog/apple-notes-vs-onenote. Recherche : « notes iphone vs onenote » → « apple note vs onenote », « ios notes vs onenote » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/102537 (mot de passe, Face ID ou Touch ID); /guide/iphone/iphd939f0a1c/ios (Sélection intelligente); /guide/notes/not201900c07/mac (import), lus le 21 novembre 2026.
// Les faits sur les autres apps et Pinto Notes viennent de l’article anglais du 21 novembre 2026.

const ui = UI.fr;
const ROWS = [
  ["Prix", "Gratuit ; 5 Go iCloud partagés", "App gratuite ; 5 Go OneDrive partagés"],
  ["Appareils", "iPhone, Mac, iCloud.com", "Windows, Mac, iPhone, Android, web"],
  ["Organisation", "Dossiers et tags", "Carnets, sections et pages"],
  ["Page", "Texte de haut en bas", "Texte et dessin à plusieurs endroits"],
  ["Verrouillage", "Note par note", "Section entière"],
  ["Historique", "Pas de versions ; suppression récupérable 30 jours", "Versions des pages ; suppression récupérable 60 jours"],
];
const SECTIONS = [
  { id: "partie-0", title: "Pourquoi choisir Notes", text: ["Notes s’ouvre tout de suite et se synchronise par iCloud. Dossiers, tags, listes de pointage, scans, tableaux et calculs simples couvrent les usages courants. La recherche lit aussi l’écriture et certains scans. Sur iPhone, vous pouvez écrire au doigt et utiliser Sélection intelligente pour coller une écriture comme texte si la langue est prise en charge.", "Vous pouvez protéger une note par mot de passe, Face ID ou Touch ID. Les notes partagées, avec tags, PDF, audio ou vidéo, ou stockées dans certains comptes mail ne peuvent pas être verrouillées. Apple ne peut pas retrouver un mot de passe oublié. Notes ne garde pas d’historique des versions."] },
  { id: "partie-1", title: "Pourquoi choisir OneNote", text: ["OneNote existe sur Windows, Mac, iPhone, Android et le web. Le compte Microsoft synchronise les carnets par OneDrive et garde une copie locale sur Mac. Sur une page, vous placez texte et dessins où vous voulez ; la version Mac propose stylo, marqueur et surligneur, sans conversion de l’écriture manuscrite en texte.", "OneNote garde les anciennes versions d’une page et les notes supprimées pendant 60 jours. Vous pouvez extraire le texte d’une image, mais Microsoft indique que le résultat peut prendre 24 à 48 heures. Copilot résume, rédige et crée des listes de tâches sur les offres Microsoft 365 qui l’incluent ; vérifiez votre licence Mac."] },
  { id: "partie-2", title: "Sécurité et partage", text: ["OneNote protège par mot de passe une section entière, pas une page seule ni un carnet entier. Une section verrouillée sort de la recherche. Un carnet se partage par lien avec droits de consultation ou de modification. Microsoft ne peut pas récupérer un mot de passe oublié."] },
  { id: "partie-3", title: "Passer d’une app à l’autre", text: ["Aucune des deux apps n’importe directement l’autre. Notes sur Mac accepte texte, RTF, HTML, ENEX et Markdown. OneNote sur Mac exporte une page à la fois en PDF. Pour quelques pages, copiez le texte ; pour un gros carnet, gardez l’ancien en lecture pendant la transition."] },
  { id: "partie-4", title: "Pinto Notes", text: ["Pinto Notes garde l’allure de Notes sur iPhone et Mac, avec fichiers Markdown chiffrés, historique et accès depuis ChatGPT ou Claude. Il importe plusieurs apps sur Mac, mais pas OneNote directement. Il ne propose pas de page libre ni d’écriture manuscrite, et ne fonctionne ni sur Windows ni sur Android."] },
];
const LINKS = [
  ["Alternatives à Notes", "/fr/blog/alternatives-notes-apple"],
  ["Notes ou Notion", "/fr/blog/notes-iphone-vs-notion"],
];
const FAQ = [
  { q: "Peut-on verrouiller une page OneNote ?", a: ["Non. Sur Mac, OneNote protège des sections entières. Notes protège les notes individuellement."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-vs-onenote"
    intro={"Notes vous donne une page simple sur iPhone et Mac. OneNote ressemble à un classeur : carnets, sections et pages sur lesquelles vous pouvez écrire presque partout."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Prenez Notes pour les listes et les notes rapides sur les appareils Apple. Prenez OneNote si vous travaillez sur Windows ou Android, utilisez Microsoft 365 ou voulez placer texte et dessins librement sur une page.</p>
      <PostCta slug="fr/notes-iphone-vs-onenote" path="/fr/blog/notes-iphone-vs-onenote" position="answer" ui={ui.cta} title="Notes avec un historique et votre IA">
        <p>Pinto Notes conserve les dossiers, listes et tableaux de Notes. ChatGPT ou Claude peut accéder aux notes après connexion, et vous pouvez restaurer leurs versions précédentes.</p>
      </PostCta>
    </Answer>}
    
    faq={FAQ}>
    <h2>Aperçu</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Critère</th><th scope="col">Notes</th><th scope="col">OneNote</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2>
    <ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Notes sur Mac avec les dossiers et une liste de courses à cocher." caption="Une liste de courses dans Notes sur Mac." />
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes sur Mac signale une ligne ajoutée par ChatGPT et propose Annuler." caption="Une ligne ajoutée par ChatGPT est signalée et peut être annulée." />
  </LocalPostPage>;
}
