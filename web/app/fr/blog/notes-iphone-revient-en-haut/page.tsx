import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-revient-en-haut");

// Version française de /blog/apple-notes-keeps-jumping-to-top. Recherche locale du problème, 21 novembre 2026 : « Notes revient en haut sur iPhone » et « Notes défile toute seule » ; Google autocomplete hl=fr, gl=fr ne renvoie aucune suggestion pour « notes iphone remonte en haut » ni « notes iphone défile toute seule ». Titre descriptif, aucun volume supposé.
// Pages Apple françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/119876 (fermer, rouvrir, redémarrer, mettre à jour une app), /fr-fr/guide/iphone/iph83bfec492/ios (sélecteur d'app, balayage vers le haut), /fr-fr/118259 (redémarrage), /fr-fr/guide/mac-help/mchlp2579/mac et mchlp2522/mac (redémarrer le Mac), /fr-fr/118575 et /fr-fr/108382 (Réglages > Général > Mise à jour logicielle ; Réglages Système > Général > Mise à jour logicielle), /fr-fr/121669 et /fr-fr/guide/icloud/mm8685520792/icloud (synchronisation Notes). Aucun de ces articles ne donne de remède précis au défilement.
// Les essais proposés pour continuer à écrire ne sont pas des correctifs Apple. Faits Pinto repris de l'article anglais.

const ui = UI.fr;
const RECORD = `Notes revient en haut
Appareil et version d'iOS ou de macOS :
Une note ou plusieurs :
Geste juste avant le saut :
La page bouge, le curseur bouge, ou les deux ?
La saisie est-elle aussi lente ?
Résultat après redémarrage :
Résultat après mise à jour :
Résultat avec la même note sur un autre appareil :
`;
const FAQ = [
  { q: "Apple a-t-il publié un correctif pour ce problème ?", a: ["Les pages d'assistance consultées ne donnent pas de correctif propre à ce défilement. Apple recommande de fermer et rouvrir une app qui fonctionne mal, de redémarrer l'appareil et de vérifier les mises à jour. Le résultat n'est pas garanti."] },
  { q: "Faut-il désactiver iCloud pour arrêter le défilement ?", a: ["Les pages Apple consultées n'identifient pas iCloud comme cause. Le guide sur les notes manquantes demande au contraire de vérifier la synchronisation. C'est un autre symptôme."] },
  { q: "Comment continuer à écrire si Notes perd ma place ?", a: ["Essayez une nouvelle note pour le passage en cours, sans toucher à l'original. Vous pouvez aussi tester la même note sur un autre appareil ou sur icloud.com/notes. Ce sont des essais, sans résultat garanti."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-revient-en-haut"
    intro="Notes revient en haut pendant que vous écrivez ? Apple ne documente pas de correctif pour ce problème précis. Commencez par ses vérifications générales, puis essayez une autre façon de terminer votre texte."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#redemarrer", label: "Fermer et redémarrer" }, { href: "#maj", label: "Vérifier les mises à jour" },
      { href: "#icloud", label: "Si des notes manquent aussi" }, { href: "#continuer", label: "Continuer à écrire" },
    ]}>
      <p>Fermez puis rouvrez Notes, redémarrez l'iPhone ou le Mac et vérifiez les mises à jour. Apple conseille ces gestes pour une app qui fonctionne mal, sans promettre qu'ils arrêteront ce défilement. Si des notes manquent sur un autre appareil, vérifiez aussi iCloud.</p>
      <PostCta slug="fr/notes-iphone-revient-en-haut" path="/fr/blog/notes-iphone-revient-en-haut" position="answer" ui={ui.cta} title="Essayer une copie dans Pinto Notes">
        <p>Pinto Notes <a href="/blog/move-from-apple-notes">importe les notes Apple sur Mac</a> sans modifier les originaux. Testez une copie de la note concernée avant de décider de changer d'app. Rien ne garantit que le problème ne s'y produira pas.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="redemarrer">Fermer Notes, puis redémarrer l'appareil</h2>
    <p>Sur iPhone, ouvrez le sélecteur d'app, trouvez Notes, balayez sa fenêtre vers le haut puis rouvrez l'app. Apple décrit ce geste dans son <a href="https://support.apple.com/fr-fr/guide/iphone/iph83bfec492/ios">guide pour fermer une app</a>. Si la page saute encore, <a href="https://support.apple.com/fr-fr/118259">redémarrez l'iPhone</a> selon votre modèle.</p>
    <p>Sur Mac, quittez Notes et rouvrez-le. Pour redémarrer le Mac, choisissez Redémarrer dans le menu Pomme. Rouvrez ensuite la note et refaites le geste qui provoquait le saut. Si Notes se bloque ou se ferme, consultez le <a href="/fr/blog/application-notes-iphone-ne-fonctionne-pas">guide pour une app Notes qui ne fonctionne pas</a>.</p>

    <h2 id="maj">Vérifier les mises à jour</h2>
    <p>Apple recommande les mises à jour pour une app qui ne réagit pas comme prévu. Sauvegardez d'abord l'appareil. Sur iPhone, branchez-le et connectez-le au Wi-Fi. Les mises à jour de macOS comprennent Notes.</p>
    <Paths rows={[{ on: "iPhone", steps: ["Réglages", "Général", "Mise à jour logicielle"] }, { on: "Mac", steps: ["Menu Pomme", "Réglages Système", "Général", "Mise à jour logicielle"] }]} />
    <p>Suivez les <a href="https://support.apple.com/fr-fr/118575">instructions pour l'iPhone</a> ou <a href="https://support.apple.com/fr-fr/108382">celles pour le Mac</a>. Une mise à jour disponible vaut l'essai, sans prouver qu'elle corrige ce problème.</p>

    <h2 id="icloud">Vérifier iCloud si des notes manquent aussi</h2>
    <p>Un défilement inattendu ne prouve pas un défaut de synchronisation. Si la note manque aussi sur un autre appareil, assurez-vous que les deux utilisent le même compte Apple et que Notes est activé pour iCloud.</p>
    <Paths rows={[{ on: "iPhone", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir ou Tout afficher", "Notes", "Synchroniser cet iPhone"] }, { on: "Mac", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes", "Synchroniser ce Mac"] }]} />
    <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Notes sur Mac demande d'activer iCloud pour accéder aux notes sur tous les appareils." caption="Une invite iCloud dans Notes sur Mac. Elle concerne la synchronisation, pas le défilement." />
    <p>Si les notes n'apparaissent toujours pas, <a href="https://support.apple.com/fr-fr/121669">Apple conseille de redémarrer l'iPhone</a>, puis de vérifier de nouveau le réglage. Pour les autres contrôles, consultez <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">les problèmes de synchronisation de Notes</a>.</p>

    <h2 id="continuer">Continuer à écrire pendant le problème</h2>
    <p>Ces essais ne sont pas des correctifs publiés par Apple. Gardez la note d'origine pendant la comparaison.</p>
    <ul>
      <li>Créez une note pour le passage en cours. Copiez seulement le texte nécessaire, puis réunissez les passages plus tard si la saisie fonctionne mieux.</li>
      <li>Ouvrez la même note sur un autre appareil et essayez la même modification.</li>
      <li>Si la note est dans iCloud, ouvrez <a href="https://www.icloud.com/notes">icloud.com/notes</a> dans un navigateur et voyez si vous pouvez y écrire.</li>
    </ul>
    <p>Une nouvelle note plus stable ne prouve pas que la longueur de l'ancienne est en cause. Un navigateur qui fonctionne ne révèle pas non plus la cause du saut.</p>
    <h2>Si le problème persiste</h2>
    <p>Gardez une <a href="/blog/back-up-apple-notes">copie des notes importantes</a> avant de supprimer l'app ou de changer de compte. <a href="https://support.apple.com/fr-fr/119876">Apple avertit</a> que supprimer une app peut aussi supprimer ses données sur l'appareil. Notez ce qui déclenche le saut, sans copier le contenu de votre note, puis transmettez ces détails à <a href="https://support.apple.com/fr-fr/contact">l'assistance Apple</a>.</p>
    <Keep title="Informations à noter pour l'assistance" text={RECORD} />
  </LocalPostPage>;
}
