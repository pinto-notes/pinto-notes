import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternatives-notes-apple");

// Version française de /blog/apple-notes-alternatives. Recherche : « alternative à notes apple » → « alternative apple notes » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/icloud/mm6704cac5/icloud (seules les notes iCloud sur iCloud.com); /fr-fr/105119 (accès par navigateur), lus le 21 novembre 2026.
// Les faits sur les autres apps et Pinto Notes viennent de l’article anglais du 21 novembre 2026.

const ui = UI.fr;
const ROWS = [
  ["Obsidian", "Mac, Windows, Linux, iPhone, Android", "Fichiers Markdown, liens, extensions"],
  ["Google Keep", "iPhone, Android, navigateur", "Notes et listes rapides"],
  ["Notion", "Mac, Windows, iPhone, Android, web", "Équipes et bases de données"],
  ["Evernote", "Mac, Windows, iPhone, Android, web", "Capture web et archives"],
  ["Bear", "Mac, iPhone", "Écriture et tags"],
  ["Pinto Notes", "Mac, iPhone", "Notes avec accès depuis ChatGPT ou Claude"],
];
const SECTIONS = [
  { id: "partie-0", title: "Obsidian", text: ["Obsidian est gratuit, sans inscription, et conserve vos notes en fichiers Markdown locaux. Il offre liens, graphe, thèmes et extensions. Sa synchronisation payante coûte 4 $ par mois avec facturation annuelle ou 5 $ au mois ; un autre service peut aussi synchroniser le dossier. C’est un bon choix si vous voulez posséder vos fichiers sur plusieurs systèmes."] },
  { id: "partie-1", title: "Google Keep", text: ["Keep est gratuit sur iPhone et Android, avec accès par navigateur. Il réunit cartes, couleurs, rappels, partage et jusqu’à 50 étiquettes. Il n’a pas de dossiers. Il convient aux listes rapides, surtout si vous utilisez Android."] },
  { id: "partie-2", title: "Notion", text: ["Notion assemble pages, bases de données et espaces d’équipe. Il a une offre gratuite, un historique de 7 jours dans cette offre et un essai limité de Notion AI. Ses apps existent sur Mac, Windows, iPhone et Android. C’est plus lourd qu’une simple liste de courses."] },
  { id: "partie-3", title: "Evernote", text: ["Evernote existe sur les grandes plateformes et le web. Il propose capture de pages, recherche avancée et fonctions d’IA. Son offre gratuite se limite à 50 notes, un carnet et un appareil. Choisissez-le si ces outils justifient ses limites ou une offre payante."] },
  { id: "partie-4", title: "Bear et Pinto Notes", text: ["Bear fonctionne sur Mac et iPhone. Les notes locales sont gratuites ; la synchronisation iCloud demande Pro, affiché à 2,99 $ par mois ou 29,99 $ par an sur la page consultée. Pinto Notes est gratuit sur iPhone et Mac, garde les notes en Markdown chiffré, l’historique et l’accès depuis ChatGPT ou Claude. Aucun des deux ne fonctionne sur Windows ou Android."] },
  { id: "partie-5", title: "Windows, Android et logiciel libre", text: ["Notes sur iCloud.com montre seulement vos notes iCloud. Apple ne propose pas d’app Notes Windows ou Android. Joplin est gratuit, libre et disponible sur Mac, Windows, Linux, iPhone et Android, avec synchronisation chiffrée par plusieurs services. Obsidian utilise des fichiers ouverts, mais son éditeur ne le présente pas comme logiciel libre."] },
  { id: "partie-6", title: "Quitter Notes", text: ["Exporter ou importer fait une copie et ne supprime pas les originaux. Sur Mac, Notes exporte la note choisie en PDF ou Markdown. Pour une grande bibliothèque, vérifiez d’abord les images, tableaux et dossiers dans l’app d’arrivée."] },
];
const LINKS = [
  ["Notes ou Obsidian", "/fr/blog/notes-iphone-vs-obsidian"],
  ["Notes ou Notion", "/fr/blog/notes-iphone-vs-notion"],
  ["Notes ou Google Keep", "/fr/blog/notes-iphone-vs-google-keep"],
  ["Notes ou OneNote", "/fr/blog/notes-iphone-vs-onenote"],
];
const FAQ = [
  { q: "Quelle alternative libre à Notes choisir ?", a: ["Joplin est gratuit et libre, sur Windows, Mac, Linux, Android et iPhone."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="alternatives-notes-apple"
    intro={"Vous cherchez une autre app parce que vous passez sur Windows ou Android, ou parce que Notes ne suffit plus. Voici les options selon le problème à résoudre. Pinto Notes fait partie de cette liste ; c’est notre app."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Pour Windows ou Android, regardez Obsidian, Google Keep, Notion, Evernote ou Joplin. Sur iPhone et Mac, Bear convient à l’écriture et Pinto Notes à ceux qui veulent garder l’usage de Notes avec ChatGPT ou Claude.</p>
      <PostCta slug="fr/alternatives-notes-apple" path="/fr/blog/alternatives-notes-apple" position="answer" ui={ui.cta} title="Vous restez sur iPhone et Mac ?">
        <p>Pinto Notes importe vos notes Apple sur Mac et fonctionne comme Notes. ChatGPT ou Claude peut les lire et les modifier. Il n’existe pas sur Windows ou Android.</p>
      </PostCta>
    </Answer>}
    
    faq={FAQ}>
    <h2>Aperçu</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Appareils</th><th scope="col">Usage principal</th></tr></thead>
      <tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2>
    <ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} alt="Capture de Obsidian montrant une note ou un réglage dans l’interface en anglais." caption="Obsidian : capture de l’interface utilisée dans cet article, en anglais." />
      <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} alt="Une page de réunion d’équipe dans Notion sur Mac, avec des tâches." caption="Une réunion d’équipe organisée dans Notion." />
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} alt="L’app Bear ouverte sur Mac et iPhone." caption="Bear est disponible sur Mac et iPhone." />
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes sur Mac signale une ligne ajoutée par ChatGPT et propose Annuler." caption="Une ligne ajoutée par ChatGPT est signalée et peut être annulée." />
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} alt="Menu d’importation de Pinto Notes sur Mac avec plusieurs apps." caption="Pinto Notes importe plusieurs formats depuis le menu Fichier." />
  </LocalPostPage>;
}
