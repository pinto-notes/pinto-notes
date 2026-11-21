import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-bloque-sur-dossiers");

// Version française de /blog/apple-notes-stuck-on-folders. Recherche locale du problème, 21 novembre 2026 : « Notes bloqué sur Dossiers », « Notes ne charge pas les dossiers » ; Google autocomplete hl=fr, gl=fr ne renvoie aucune suggestion pour « notes iphone bloqué dossiers », « app notes bloquée sur dossiers » et « notes iphone chargement bloqué ». Titre descriptif, aucun volume supposé.
// Pages Apple françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/121669 (Synchroniser cet iPhone, redémarrage), /fr-fr/118446 (état des services, compte Apple, réseau, mises à jour), /fr-fr/guide/icloud/mm8685520792/icloud (notes iCloud et icloud.com/notes), /fr-fr/118575 et /fr-fr/108382 (mise à jour), /fr-fr/121115 (configuration Apple Intelligence). Ces pages ne donnent ni cause précise pour Dossiers ou Enregistrement, ni délai de synchronisation.
// Les faits Pinto viennent uniquement de l'article anglais ; l'image montre l'invite iCloud, pas l'écran figé.

const ui = UI.fr;
const FAQ = [
  { q: "Que faire si Notes reste sur l'écran Dossiers ?", a: ["Si les notes iCloud manquent, vérifiez l'état des services Apple, le compte Apple utilisé et la synchronisation de Notes. Si l'écran ne répond à aucun toucher, suivez les étapes générales d'Apple pour une app bloquée."] },
  { q: "« Préparation » signifie-t-il que mes notes se synchronisent ?", a: ["Un message dans les réglages Apple Intelligence concerne sa configuration. Après un changement de langue de Siri, le téléchargement de la langue peut retarder sa disponibilité. Cela ne confirme pas qu'une note est arrivée dans iCloud."] },
  { q: "Combien de temps Notes peut-il mettre à se synchroniser ?", a: ["Les pages Apple citées ici ne donnent pas de délai. Vérifiez l'état d'iCloud, votre connexion, le compte Apple et le réglage Notes sur chaque appareil."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="notes-iphone-bloque-sur-dossiers"
    intro="Notes reste sur l'écran Dossiers et ne charge aucune note ? Vérifiez d'abord iCloud et le réglage de synchronisation. Si l'écran ne réagit pas aux touchers, essayez les vérifications générales d'Apple pour une app bloquée."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#dossiers", label: "L'écran Dossiers" }, { href: "#icloud", label: "Vérifier iCloud" },
      { href: "#enregistrement", label: "Enregistrement ou synchronisation lente" }, { href: "#preparation", label: "Message Préparation" },
    ]}>
      <p>Consultez l'état des services Apple. Vérifiez ensuite que chaque appareil utilise le même compte Apple, avec Notes activé pour iCloud. Contrôlez aussi le réseau et les mises à jour. Ces étapes générales ne sont pas un correctif documenté pour un écran Dossiers bloqué.</p>
      <PostCta slug="fr/notes-iphone-bloque-sur-dossiers" path="/fr/blog/notes-iphone-bloque-sur-dossiers" position="answer" ui={ui.cta} title="Essayer vos notes dans Pinto Notes">
        <p>Pinto Notes ressemble à Notes sur iPhone et Mac. Vous pouvez <a href="/blog/move-from-apple-notes">importer vos notes Apple sur Mac</a> sans modifier les originaux. Cette importation ne répare pas Notes.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Notes sur Mac affiche une invite pour activer iCloud, avec deux boutons de réponse." caption="Cette invite apparaît quand iCloud est désactivé pour Notes. Elle est différente d'un écran Dossiers qui ne répond plus." />}
    faq={FAQ}>
    <h2 id="dossiers">Quand un dossier ne s'ouvre pas</h2>
    <p>Essayez de sélectionner Tous les services iCloud ou un dossier du compte iCloud. Si les dossiers s'ouvrent mais restent vides, poursuivez les vérifications ci-dessous. Si Notes ne répond plus du tout, le <a href="/fr/blog/application-notes-iphone-ne-fonctionne-pas">guide sur une app Notes bloquée</a> reprend les gestes d'Apple : fermer et rouvrir l'app, redémarrer, puis mettre à jour l'appareil. L'écran figé ne dit pas si vos dernières modifications ont été envoyées.</p>

    <h2 id="icloud">Vérifier iCloud avant de changer les réglages</h2>
    <Steps>
      <li><strong>Regardez l'état des services.</strong> Ouvrez <a href="https://www.apple.com/fr/support/systemstatus/">État du système Apple</a> et cherchez Notes iCloud. Si Apple signale un incident, suivez son état avant de modifier vos réglages.</li>
      <li><strong>Vérifiez le compte Apple.</strong> Chaque appareil doit être connecté au même compte. Son nom apparaît en haut des Réglages sur iPhone et des Réglages Système sur Mac.</li>
      <li><strong>Vérifiez Notes dans iCloud.</strong> Activez Synchroniser cet iPhone ou Synchroniser ce Mac si besoin. Si les notes n'apparaissent toujours pas sur iPhone, Apple conseille de redémarrer et de vérifier à nouveau le réglage.
        <Paths rows={[{ on: "iPhone", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir ou Tout afficher", "Notes", "Synchroniser cet iPhone"] }, { on: "Mac", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes", "Synchroniser ce Mac"] }]} />
      </li>
      <li><strong>Contrôlez le réseau.</strong> Apple demande une bonne connexion. Sans Wi-Fi sur iPhone, vérifiez que les données mobiles sont activées dans Réglages. iCloud peut être indisponible par ce réseau si elles sont désactivées.</li>
      <li><strong>Vérifiez les mises à jour.</strong> Sauvegardez l'appareil avant d'installer une mise à jour iOS ou macOS.
        <Paths rows={[{ on: "iPhone", steps: ["Réglages", "Général", "Mise à jour logicielle"] }, { on: "Mac", steps: ["Menu Pomme", "Réglages Système", "Général", "Mise à jour logicielle"] }]} />
      </li>
    </Steps>
    <p>Ces contrôles viennent des <a href="https://support.apple.com/fr-fr/118446">instructions Apple pour iCloud</a>, de son <a href="https://support.apple.com/fr-fr/121669">article sur les notes manquantes</a> et du <a href="https://support.apple.com/fr-fr/guide/icloud/mm8685520792/icloud">guide de configuration de Notes</a>.</p>

    <h2 id="enregistrement">Si l'enregistrement ou la synchronisation tarde</h2>
    <p>Ouvrez <a href="https://www.icloud.com/notes">Notes sur iCloud.com</a> avec le même compte Apple. Cherchez la note et sa dernière modification. Si vous voyez une ancienne version, cela confirme seulement que cet ancien texte est arrivé dans iCloud. Gardez une copie séparée de tout nouveau texte encore visible.</p>
    <p>Les pages Apple citées ne donnent ni délai de synchronisation ni correctif propre à un message « Enregistrement ». Pour les autres contrôles, dont l'espace de stockage et les notes présentes sur un seul appareil, consultez <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">le guide sur la synchronisation</a>.</p>

    <h2 id="preparation">Repérer où apparaît « Préparation »</h2>
    <p>Si le message apparaît dans les réglages Apple Intelligence, consultez <a href="https://support.apple.com/fr-fr/121115">sa page de configuration</a>. Après un changement de langue de Siri, Apple Intelligence peut rester indisponible pendant le téléchargement de la langue. Cela ne décrit pas l'envoi d'une note vers iCloud.</p>
    <p>Si le message apparaît dans Notes pendant le traitement d'un scan ou d'un PDF, cette page sur Apple Intelligence n'en donne pas la cause. Notez le message exact et ce que vous faisiez. Si les vérifications ne suffisent pas, transmettez ces détails à <a href="https://getsupport.apple.com/">l'assistance Apple</a>.</p>
  </LocalPostPage>;
}
