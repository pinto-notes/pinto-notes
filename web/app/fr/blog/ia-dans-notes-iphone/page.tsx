import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "ia-dans-notes-iphone");

// Version française de /blog/apple-notes-ai. Recherche : « intelligence artificielle notes iphone » n’a renvoyé aucune suggestion ; titre fondé sur « Notes » et « iPhone » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/121115 (appareils et langues Apple Intelligence); /guide/iphone/iphbe11247b5/ios (transcription, Résumé); /guide/notes/apdb5106e334/mac (Enregistrement audio), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Réécrire et résumer du texte", text: ["Sélectionnez du texte dans Notes puis ouvrez les outils d’écriture. Vous pouvez demander une reformulation, une correction, un ton plus concis, un résumé ou des points clés. La commande de rédaction peut faire appel à l’extension ChatGPT avec tout le texte ou la sélection. Cela agit sur le contenu choisi, pas sur l’ensemble de vos notes."] },
  { id: "partie-1", title: "Enregistrer, transcrire, résumer", text: ["Sur les iPhone 12 et suivants, Notes peut transcrire un enregistrement dans les langues prises en charge. Ouvrez l’enregistrement pour lire ou copier la transcription, puis demandez son Résumé si l’iPhone prend en charge Apple Intelligence. Sur Mac avec puce M1 ou ultérieure, Notes propose aussi l’enregistrement et la transcription selon la langue. Les appels enregistrés ont un autre dossier ; l’enregistrement des appels n’est pas disponible dans l’Union européenne."] },
  { id: "partie-2", title: "Appareils et langues", text: ["Apple liste notamment les iPhone 15 Pro et Pro Max, les modèles iPhone 16 et suivants compatibles, ainsi que les Mac à puce M1 ou ultérieure. iOS 27 et macOS 27 activent Apple Intelligence selon le modèle et la région. La langue de Siri et celle de l’appareil doivent correspondre à une langue prise en charge. Apple indique un téléchargement pouvant atteindre 8 Go, ou 14 Go sur certains modèles. Vérifiez la page de disponibilité pour votre appareil."] },
  { id: "partie-3", title: "Recherche et accès à vos notes", text: ["La recherche de Notes trouve du texte tapé ou manuscrit, du texte dans les scans, des objets dans certaines images et les tags. Dans une note verrouillée, seul le titre apparaît. Ce n’est pas une recherche qui répond en combinant toutes vos notes. Siri AI peut utiliser un contexte personnel et modifier des notes dans les régions où Apple l’annonce, mais Apple indique que sa version iPhone n’est pas disponible dans l’Union européenne à cette date."] },
  { id: "partie-4", title: "Confidentialité et limites", text: ["Apple dit effectuer de nombreuses opérations sur l’appareil ; certaines passent par Private Cloud Compute sans stockage accessible à Apple. Des limites quotidiennes peuvent s’appliquer aux fonctions sur serveur. ChatGPT dans les outils d’écriture reçoit le contenu que vous lui transmettez, mais ne parcourt pas automatiquement toutes vos notes. Les apps sur votre propre Mac peuvent proposer d’autres accès."] },
  { id: "partie-5", title: "Pinto Notes avec votre IA", text: ["ChatGPT, Claude, Claude Code ou Codex peut chercher, lire et modifier les notes Pinto après connexion, même si vous discutez depuis un téléphone ou un navigateur. Les modifications sont signalées, annulables et chaque version antérieure reste disponible. Les notes verrouillées n’exposent pas leur contenu à l’IA. Pinto Notes est sur iPhone et Mac, sans app Windows, Android ou web."] },
];
const LINKS = [
  ["Notes ou Notion", "/fr/blog/notes-iphone-vs-notion"],
  ["15 astuces Notes", "/fr/blog/astuces-notes-iphone"],
  ["Connecter ChatGPT à vos notes", "/blog/connect-chatgpt-to-your-notes"],
];
const FAQ = [
  { q: "ChatGPT peut-il lire toutes mes notes Apple ?", a: ["Non depuis les outils d’écriture de Notes sur iPhone. Ceux-ci travaillent sur le texte transmis ; un autre accès demande une app sur votre Mac."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="ia-dans-notes-iphone" intro={"Apple Intelligence peut aider à réécrire du texte et à résumer un enregistrement dans Notes. Cela ne donne pas à ChatGPT un accès général à toute votre bibliothèque."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Sur un iPhone compatible, les outils d’écriture peuvent corriger, reformuler et résumer une sélection. Notes transcrit un enregistrement sur les appareils et dans les langues prises en charge ; Apple Intelligence peut en faire un résumé. La recherche ordinaire retrouve du texte, sans répondre à partir de toutes vos notes.</p>
      <PostCta slug="fr/ia-dans-notes-iphone" path="/fr/blog/ia-dans-notes-iphone" position="answer" ui={ui.cta} title="ChatGPT ou Claude dans vos notes">
        <p>Pinto Notes n’a pas d’IA propre. Après connexion, ChatGPT ou Claude peut chercher, lire et modifier vos notes sur iPhone et Mac, avec les changements visibles et annulables.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/news/apple-notes-recording-summary-mac" width={1600} height={1000} alt="Résumé d’un enregistrement audio dans Notes sur Mac." caption="Un résumé d’enregistrement dans Notes. Image : Apple." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <Figure shot={SHOTS.aiEdit} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
  </LocalPostPage>;
}
