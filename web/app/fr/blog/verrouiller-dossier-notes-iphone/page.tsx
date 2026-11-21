import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "verrouiller-dossier-notes-iphone");

// Version française de /blog/apple-notes-lock-folder. Recherche : « verrouiller dossier notes iphone » → « verrouiller dossier note iphone » (Google autocomplete hl=fr, gl=fr, 21 novembre 2026).
// Apple : support.apple.com/fr-fr/guide/iphone/iphf177bb154/ios (Actions de note > Verrouiller); /guide/notes/not28c5f5468/mac (Notes > Réglages, Plus > Verrouiller la note); /guide/notes/apd58edc7964/mac (dossiers intelligents non verrouillables); /guide/iphone/iph00f208d05/ios (Exiger Face ID), lus le 21 novembre 2026.
// Autres faits repris de l’article anglais du 21 novembre 2026.
const ui = UI.fr;
const SECTIONS = [
  { id: "partie-0", title: "Ce que Notes protège", text: ["Apple décrit le verrouillage de notes individuelles, pas celui d’un dossier. Un dossier intelligent ne peut pas être verrouillé non plus. Toutes les notes verrouillées d’un même compte utilisent la méthode définie pour ce compte. Le titre reste visible et une nouvelle note ajoutée au dossier commence sans cadenas."] },
  { id: "partie-1", title: "Choisir le mot de passe", text: ["Sur iPhone, ouvrez Réglages > Apps > Notes > Mot de passe, choisissez le compte puis « Utiliser le code de l’appareil » ou « Utiliser un mot de passe personnalisé ». Activez Face ID ou Touch ID si vous le souhaitez. Sur Mac, ouvrez Notes > Réglages et choisissez le mot de passe de connexion ou un mot de passe personnalisé pour « Notes verrouillées ». Touch ID peut servir au déverrouillage si le Mac le propose.", "Le code d’appareil demande le trousseau iCloud et des versions récentes d’iOS ou macOS. Apple ne peut pas retrouver un mot de passe personnalisé oublié ; gardez un indice."] },
  { id: "partie-2", title: "Verrouiller les notes", text: ["Sur iPhone, ouvrez chaque note, touchez « Actions de note », puis « Verrouiller ». Sur Mac, ouvrez la note, cliquez sur « Plus » à côté de la recherche, puis choisissez « Verrouiller la note ». Recommencez pour toutes les notes du dossier. L’ouverture d’une note verrouillée ouvre temporairement les autres notes verrouillées du compte ; refermez-les par le bouton de cadenas, ou quittez Notes."] },
  { id: "partie-3", title: "Si le verrouillage manque", text: ["Apple exclut les notes rapides, partagées ou contenant des tags, ainsi que celles avec vidéo, audio, PDF ou certains documents joints. Les notes d’un compte Gmail ou Yahoo ne peuvent pas être verrouillées. Un dossier partagé ne peut pas contenir des notes verrouillées à partager. Vérifiez aussi que vos notes iCloud ont été mises à niveau."] },
  { id: "partie-4", title: "Verrouiller l’app sur iPhone", text: ["Sur l’écran d’accueil, maintenez le doigt sur Notes et touchez « Exiger Face ID », « Exiger Touch ID » ou « Exiger le code », selon l’appareil. Confirmez. L’app demande une authentification à l’ouverture et se reverrouille à la fermeture. Ce réglage ne s’applique qu’à cet iPhone ; les apps Apple installées par défaut ne peuvent pas être masquées."] },
  { id: "partie-5", title: "Dans Pinto Notes", text: ["Pinto Notes verrouille aussi les notes une à une. Leur contenu reçoit un second chiffrement avec une clé issue du mot de passe, qui ne quitte pas vos appareils. Un mot de passe perdu ne peut pas être récupéré. L’IA connectée ne voit que le titre. Les notes Apple déjà verrouillées ne peuvent pas être importées tant que vous ne les avez pas déverrouillées."] },
];
const LINKS = [
  ["Mot de passe Notes oublié", "/fr/blog/mot-de-passe-notes-iphone-oublie"],
  ["Déplacer des notes vers iCloud", "/fr/blog/deplacer-notes-iphone-vers-icloud"],
];
const FAQ = [
  { q: "Un dossier intelligent peut-il être verrouillé ?", a: ["Non. Le guide Apple dit expressément que les dossiers intelligents ne peuvent pas être verrouillés."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="verrouiller-dossier-notes-iphone" intro={"Notes ne verrouille pas un dossier. Pour protéger son contenu, verrouillez chaque note qui s’y trouve. Vous pouvez aussi verrouiller toute l’app Notes sur un iPhone."}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={SECTIONS.map((s) => ({ href: "#" + s.id, label: s.title }))}>
      <p>Choisissez un code d’appareil ou un mot de passe Notes, puis ouvrez chaque note du dossier et utilisez « Verrouiller ». Le dossier et les titres restent visibles. Toute nouvelle note du dossier devra être verrouillée à son tour.</p>
      <PostCta slug="fr/verrouiller-dossier-notes-iphone" path="/fr/blog/verrouiller-dossier-notes-iphone" position="answer" ui={ui.cta} title="Les notes privées restent fermées à l’IA">
        <p>Pinto Notes verrouille les notes avec un mot de passe, Face ID ou Touch ID. ChatGPT ou Claude ne voit que le titre d’une note verrouillée.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/macos27/notes-locked-window" width={1520} height={984} alt="Une note verrouillée dans Notes sur Mac ; son titre reste visible dans le dossier." caption="Le cadenas protège la note, tandis que le dossier et le titre restent visibles." />} faq={FAQ}>
    {SECTIONS.map((s) => <section key={s.id}><h2 id={s.id}>{s.title}</h2>{s.text.map((t) => <p key={t}>{t}</p>)}</section>)}
    <h2>À lire aussi</h2><ul>{LINKS.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      <h2>En images</h2>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} alt="Une note verrouillée sur iPhone affiche son titre et demande à être ouverte." caption="Le titre reste visible quand la note est verrouillée. Image : Apple." />
      <PostFigure src="/blog/macos27/notes-locked-hint" width={720} height={580} alt="Indice de mot de passe affiché pour une note verrouillée sur Mac." caption="L’indice aide à se souvenir du mot de passe." />
      <Figure shot={SHOTS.notesPassword} caption="Pinto Notes : capture de l’interface utilisée dans cet article, en anglais." />
  </LocalPostPage>;
}
