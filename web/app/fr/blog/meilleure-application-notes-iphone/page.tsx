import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "meilleure-application-notes-iphone");

// Version française de /blog/best-note-taking-app-for-iphone. Recherche : « meilleure application de prise de notes iphone » → même requête, « meilleure appli prise de note iphone » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/iphone/iphf177bb154/ios (verrouillage); /guide/iphone/iphbe11247b5/ios (enregistrement et transcription); /guide/icloud/mm6704cac5/icloud (accès web), lus le 21 novembre 2026.
// Les faits sur les autres apps et Pinto Notes viennent de l’article anglais du 21 novembre 2026.

const ui = UI.fr;
const ROWS = [
  ["Pinto Notes", "Gratuit", "Mac", "ChatGPT ou Claude peut modifier vos notes"],
  ["Notes", "Inclus avec l’iPhone", "Mac, iCloud.com", "Apple Intelligence sur appareil compatible"],
  ["Bear", "Gratuit ; synchronisation Pro", "Mac", "Connexion Claude sur Mac"],
  ["Obsidian", "Gratuit ; Sync payant", "Mac, Windows, Linux, Android", "Extensions tierces"],
  ["Notion", "Gratuit ; offres payantes", "Mac, Windows, Android, web", "Notion AI et serveur MCP"],
  ["Google Keep", "Gratuit", "Android, web", "Aucune IA indiquée dans sa fiche"],
  ["Evernote", "Gratuit jusqu’à 50 notes", "Mac, Windows, Android, web", "Assistant IA, transcription et MCP"],
];
const SECTIONS = [
  { id: "partie-0", title: "1. Pinto Notes", text: ["Pinto Notes est gratuit et demande iOS 26. Il a dossiers, listes de pointage, tableaux et fichiers joints, fonctionne hors ligne et permet de verrouiller une note. ChatGPT ou Claude peut lire et modifier les notes après connexion ; les lignes changées sont signalées, avec Annuler, et chaque version reste accessible. L’import d’une bibliothèque se fait surtout sur Mac. Il n’y a ni app Windows, Android ni web."] },
  { id: "partie-1", title: "2. Notes", text: ["Notes est livré avec l’iPhone. Il synchronise par iCloud et propose dossiers, tags, dossiers intelligents, tableaux, calculs, scans et listes de pointage. Vous pouvez verrouiller une note avec un mot de passe, Face ID ou Touch ID. L’enregistrement et la transcription sont disponibles selon l’appareil et la langue ; Apple Intelligence peut résumer la transcription sur les modèles compatibles. ChatGPT ne peut pas parcourir toutes vos notes depuis l’iPhone."] },
  { id: "partie-2", title: "3. Bear", text: ["Bear convient à la rédaction avec des tags. Sa version gratuite garde des notes locales. Pro ajoute la synchronisation iCloud, des thèmes et la recherche dans les PDF et images, pour 2,99 $ par mois ou 29,99 $ par an sur la page consultée. Son connecteur Claude fonctionne sur Mac, pas directement sur iPhone."] },
  { id: "partie-3", title: "4. Obsidian", text: ["Obsidian conserve des fichiers Markdown dans un dossier et fonctionne sur iPhone, Android, Mac, Windows et Linux. Il est gratuit ; Sync coûte 4 $ par mois avec facturation annuelle ou 5 $ au mois. Vous pouvez aussi utiliser iCloud entre iPhone et Mac. Les fonctions d’IA demandent des extensions ou une configuration supplémentaire."] },
  { id: "partie-4", title: "5. Notion", text: ["Notion organise les notes en pages et bases de données, avec partage d’équipe, usage hors connexion sur mobile et Notion AI. Son serveur MCP officiel relie ChatGPT ou Claude. L’offre gratuite existe ; la fiche américaine indiquait Plus à 11,99 $ par mois ou 119,99 $ par an. Vérifiez le tarif affiché dans votre pays."] },
  { id: "partie-5", title: "6. Google Keep", text: ["Keep est gratuit sur iPhone, Android et le web. Il propose rappels selon l’heure ou le lieu, listes partagées, notes vocales transcrites, couleurs, épingles et jusqu’à 50 étiquettes. Il n’a pas de dossiers."] },
  { id: "partie-6", title: "7. Evernote", text: ["Evernote combine carnets, capture web, recherche, transcription et assistant IA. Il fonctionne sur iPhone, Android, Mac, Windows et web. Son offre gratuite s’arrête à 50 notes, un carnet et un appareil ; aucun tarif payant n’était affiché sur la page consultée."] },
  { id: "partie-7", title: "Quelle app choisir ?", text: ["Pour iPhone et Windows ou Android, regardez Obsidian, Notion, Keep ou Evernote. Pour écrire sur iPhone et Mac, Notes ou Bear. Pour laisser ChatGPT ou Claude agir dans vos notes sans changer vos habitudes de Notes, Pinto Notes. Selon les fiches App Store américaines consultées le 21 novembre 2026, Pinto Notes demande iOS 26, Notion et Keep iOS 18, Bear iOS 16, Obsidian iOS 15.6 et Evernote iOS 15.1. Notes est livré avec l’iPhone."] },
];
const LINKS = [
  ["Alternatives à Notes", "/fr/blog/alternatives-notes-apple"],
  ["Notes ou Obsidian", "/fr/blog/notes-iphone-vs-obsidian"],
  ["Notes ou Notion", "/fr/blog/notes-iphone-vs-notion"],
];
const FAQ = [
  { q: "Quelle app gratuite choisir sur iPhone ?", a: ["Notes, Pinto Notes et Google Keep sont gratuits. Obsidian est gratuit aussi, avec iCloud ou une synchronisation payante."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="meilleure-application-notes-iphone"
    intro={"Une liste de courses, une idée, un chiffre à garder : votre app de notes doit s’ouvrir vite et retrouver ce que vous avez écrit. Voici sept choix pour iPhone. Pinto Notes est notre app."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Pour la plupart des gens, Notes est le point de départ gratuit. Pinto Notes convient si vous voulez que ChatGPT ou Claude modifie vos notes. Bear sert l’écriture, Obsidian garde des fichiers, Notion organise les équipes, Keep les listes rapides et Evernote propose le plus d’IA intégrée.</p>
      <PostCta slug="fr/meilleure-application-notes-iphone" path="/fr/blog/meilleure-application-notes-iphone" position="answer" ui={ui.cta} title="Pinto Notes est gratuit sur iPhone et Mac">
        <p>Il fonctionne comme Notes. Une modification demandée à ChatGPT ou Claude apparaît sur votre téléphone avec la possibilité de l’annuler.</p>
      </PostCta>
    </Answer>}
    
    faq={FAQ}>
    <h2>Aperçu</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Prix</th><th scope="col">Autres appareils</th><th scope="col">Accès IA</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2>
    <ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/launch/iphone-chatgpt-changed-groceries" width={660} height={1434} alt="Une liste de courses dans Pinto Notes sur iPhone après cinq ajouts par ChatGPT." caption="Les ajouts de ChatGPT sont signalés, avec Annuler." />
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} alt="Liste des dossiers et des tags dans Notes sur iPhone." caption="Les dossiers et tags de Notes sur iPhone. Image : Apple." />
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} alt="L’app Bear ouverte sur Mac et iPhone." caption="Bear est disponible sur Mac et iPhone." />
  </LocalPostPage>;
}
