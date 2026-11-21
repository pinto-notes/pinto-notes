import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "application-notes-iphone-ne-fonctionne-pas");

// French version of /blog/apple-notes-not-working (batch 3, 21 Nov 2026). Apple's own French words, all read on 21 Nov
// 2026: support.apple.com/fr-fr/119876 (an app that "ne répond plus, se ferme de manière inopinée ou ne s'ouvre pas":
// fermer et rouvrir, redémarrer, Mises à jour d'apps in the App Store, then the iPhone's
// software, supprimer puis retélécharger), the iPhone guide support.apple.com/fr-fr/guide/iphone/iph83bfec492/ios
// (sélecteur d'app, balayer l'app vers le haut, l'écran d'accueil ou la bibliothèque d'apps) and iph8903c3ee6/ios (forcer
// le redémarrage: volume haut, volume bas, maintenir le bouton latéral jusqu'au logo Apple), support.apple.com/fr-fr/118575
// (Général > Mise à jour logicielle; sauvegarder, brancher, Wi-Fi), support.apple.com/fr-fr/118582 (Notes is on the
// list; supprimer une app intégrée supprime ses données utilisateur; nom exact, bouton Retélécharger), the Mac guide
// support.apple.com/fr-fr/guide/mac-help/mchlp2579/mac ("Si une app se bloque ou se ferme subitement sur Mac": menu Pomme
// > Forcer à quitter, Relancer, menu Pomme > Redémarrer, ouvrir un autre fichier, déconnecter un périphérique, désinstaller
// les extensions ou modules d'autres éditeurs), support.apple.com/fr-fr/102586 (Commande + Q, Option + Commande + Échap,
// the power button up to 10 seconds), support.apple.com/fr-fr/108382 (Général > Mise à jour logicielle, sauvegarder
// d'abord, ne pas mettre en veille ni fermer le couvercle), support.apple.com/fr-fr/116946 (le mode sans échec aide à
// déterminer si un problème est dû à un logiciel qui se charge au démarrage) and support.apple.com/fr-fr/121669
// (Synchroniser cet [appareil], redémarrer, vérifier à nouveau). The Mac's "unsupported features" message is the French
// string in Notes' Localizable.loctable on macOS 27.2, and "Notes iCloud" on apple.com/fr/support/systemstatus, both as
// in notes-ne-se-synchronise-pas-iphone-mac. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give
// "application notes iphone ne fonctionne pas", "notes iphone bug", "application notes iphone bug", "notes apple bug",
// "note ne s ouvre pas sur mac" and "application note ne s ouvre pas"; "plante" and "se ferme" return nothing for Notes.
// Hence the slug "application notes iphone ne fonctionne pas", with bug and plante in the text. Facts are the English
// post's; the pictures are its own, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Pourquoi l’app Notes plante-t-elle sans arrêt ?", a: [
    "Apple ne documente aucune cause propre à Notes. Ses étapes sont celles de n’importe quelle app : la fermer et la rouvrir, redémarrer l’appareil, puis mettre à jour le logiciel. Sur Mac, Apple conseille aussi de déconnecter un périphérique que vous venez de brancher et de désinstaller les modules d’autres éditeurs.",
  ] },
  { q: "Supprimer l’app Notes supprime-t-il mes notes ?", a: [
    "Apple dit que supprimer une app intégrée supprime aussi ses données utilisateur sur cet appareil. Les notes iCloud sont aussi sur icloud.com/notes : vérifiez-les là d’abord. Les notes de Sur mon iPhone n’existent que sur ce téléphone, alors ne supprimez pas l’app tant que vous y gardez des notes.",
  ] },
  { q: "Comment forcer Notes à quitter sur Mac ?", a: [
    "Appuyez sur Option + Commande + Échap, ou choisissez Forcer à quitter dans le menu Pomme, puis sélectionnez Notes et cliquez sur Forcer à quitter. Apple prévient que vous risquez de perdre les modifications non enregistrées.",
  ] },
  { q: "Pourquoi une note ne s’ouvre plus sur mon Mac depuis la mise à jour de mon iPhone ?", a: [
    "Une note créée avec une version plus récente de Notes peut utiliser des fonctionnalités qu’une version plus ancienne n’a pas. Le Mac dit alors que la note utilise des fonctionnalités non prises en charge et vous demande de passer à la dernière version de macOS. Mettre le Mac à jour lui permet d’ouvrir la note.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="application-notes-iphone-ne-fonctionne-pas"
      intro={<>Notes se fige, se ferme tout seul ou ne s’ouvre plus du tout. Voici les étapes d’Apple, dans l’ordre où Apple les donne, pour iPhone et Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "Sur iPhone" },
          { href: "#mac", label: "Sur Mac" },
          { href: "#notes-absentes", label: "Les notes ne s’affichent pas" },
          { href: "#apres-une-mise-a-jour", label: "Après une mise à jour" },
        ]}>
          <p>
            Fermez Notes et rouvrez-le, puis redémarrez l’appareil. S’il se fige ou se ferme encore, mettez à jour iOS ou macOS. Ce sont
            les étapes d’Apple pour toute app qui ne répond plus. Si Notes s’ouvre mais que vos notes n’apparaissent pas, vérifiez que Notes
            est activé pour iCloud sur cet appareil.
          </p>
          <PostCta slug="fr/application-notes-iphone-ne-fonctionne-pas" path="/fr/blog/application-notes-iphone-ne-fonctionne-pas" position="answer" ui={ui.cta}
            title="Une deuxième copie de vos notes ?">
            <p>Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac. Il importe vos notes Apple une fois sur Mac, comme une copie, et Notes reste tel quel. Chaque version précédente d’une note est gardée.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="en-securite">D’abord, vérifiez que vos notes sont en sécurité</h2>
      <p>
        Avant d’essayer quoi que ce soit de plus lourd qu’un redémarrage, ouvrez icloud.com/notes dans un navigateur et connectez-vous avec
        votre compte Apple. Si vos notes y sont, elles sont stockées dans iCloud, quoi que fasse l’app sur votre appareil. Apple liste aussi
        Notes iCloud sur sa page État du système, à l’adresse apple.com/fr/support/systemstatus. Si elle signale une panne, attendez
        qu’Apple la marque comme résolue.
      </p>

      <h2 id="iphone">Sur iPhone : Notes plante ou ne s’ouvre pas</h2>
      <Steps>
        <li id="quitter-iphone">
          <strong>Fermez Notes et rouvrez-le</strong>
          Ouvrez le sélecteur d’app, balayez pour trouver Notes, puis balayez-le vers le haut. Touchez ensuite Notes sur l’écran d’accueil
          ou dans la bibliothèque d’apps.
        </li>
        <li id="redemarrer-iphone">
          <strong>Redémarrez votre iPhone</strong>
          C’est l’étape suivante d’Apple si l’app ne répond toujours pas. Si l’iPhone lui-même est figé et ne s’éteint pas, forcez son
          redémarrage : appuyez rapidement sur le bouton d’augmentation du volume, puis sur le bouton de diminution du volume, puis
          maintenez le bouton latéral enfoncé jusqu’à ce que le logo Apple apparaisse.
        </li>
        <li id="mise-a-jour-iphone">
          <strong>Mettez iOS à jour</strong>
          Apple conseille de regarder d’abord Mises à jour d’apps dans l’App Store, et de mettre à jour le logiciel de l’iPhone s’il n’y a
          rien pour l’app. Sauvegardez l’iPhone, branchez-le et connectez-le au Wi-Fi avant.
          <Paths rows={[
            { on: "iPhone", steps: ["Réglages", "Général", "Mise à jour logicielle"] },
          ]} />
        </li>
        <li id="retelecharger">
          <strong>Supprimez Notes et téléchargez-le à nouveau, en dernier</strong>
          Notes fait partie des apps intégrées qu’Apple permet de supprimer. Apple dit que supprimer une telle app supprime aussi ses données
          utilisateur sur l’appareil : vérifiez donc icloud.com/notes d’abord, et sautez cette étape si vous gardez des notes dans Sur mon
          iPhone. Pour le récupérer, cherchez Notes dans l’App Store en saisissant son nom exact et touchez Retélécharger.
        </li>
      </Steps>
      <p>
        Ces étapes viennent de l’<a href="https://support.apple.com/fr-fr/119876" rel="noopener">article d’Apple sur une app qui ne répond
        plus, se ferme de manière inopinée ou ne s’ouvre pas</a>, avec les détails du guide de l’iPhone et de{" "}
        <a href="https://support.apple.com/fr-fr/118582" rel="noopener">Supprimer les apps Apple intégrées</a>.
      </p>

      <h2 id="mac">Sur Mac : Notes se fige ou se ferme</h2>
      <Steps>
        <li id="forcer-a-quitter">
          <strong>Quittez Notes, ou forcez-le à quitter</strong>
          Essayez d’abord Commande + Q. Si Notes ne répond pas, appuyez sur Option + Commande + Échap, ou choisissez Forcer à quitter dans le
          menu Pomme, sélectionnez Notes et cliquez sur Forcer à quitter. Apple prévient que vous risquez de perdre les modifications non
          enregistrées. Si Notes s’est fermé tout seul, cliquez sur Relancer dans la zone de dialogue qui apparaît.
          <Paths rows={[
            { on: "Mac", steps: ["Menu Pomme", "Forcer à quitter"], keys: "⌥⌘⎋" },
          ]} />
        </li>
        <li id="redemarrer-mac">
          <strong>Redémarrez le Mac</strong>
          Choisissez Redémarrer dans le menu Pomme. Si le Mac ne redémarre pas, Apple dit de maintenir le bouton d’alimentation enfoncé
          jusqu’à 10 secondes pour l’éteindre, puis d’appuyer de nouveau dessus pour le rallumer.
        </li>
        <li id="autre-note">
          <strong>Ouvrez une autre note</strong>
          Le guide d’Apple conseille d’ouvrir un autre fichier, car celui qui était ouvert pose peut-être problème. Dans Notes, c’est une
          autre note.
        </li>
        <li id="mise-a-jour-mac">
          <strong>Mettez macOS à jour</strong>
          Apple conseille de sauvegarder votre Mac d’abord. Ne le mettez pas en veille et ne fermez pas son couvercle avant la fin de
          l’installation.
          <Paths rows={[
            { on: "Mac", steps: ["Réglages Système", "Général", "Mise à jour logicielle"] },
          ]} />
        </li>
        <li id="peripheriques">
          <strong>Débranchez ce qui est nouveau, retirez les modules</strong>
          Apple conseille de déconnecter un périphérique que vous venez de brancher, comme une imprimante, et de désinstaller les extensions
          ou modules d’autres éditeurs, qui peuvent ne plus fonctionner après une mise à jour de l’app ou de macOS.
        </li>
      </Steps>
      <p>
        Ces étapes viennent des pages d’Apple <a href="https://support.apple.com/fr-fr/guide/mac-help/mchlp2579/mac" rel="noopener">Si une
        app se bloque ou se ferme subitement sur Mac</a> et <a href="https://support.apple.com/fr-fr/102586" rel="noopener">Forcer la
        fermeture d’une app sur Mac</a>. Si le problème revient, l’<a href="https://support.apple.com/fr-fr/116946" rel="noopener">article
        d’Apple sur le mode sans échec</a> explique comment vérifier si un logiciel qui se charge au démarrage de votre Mac en est la cause.
      </p>

      <h2 id="notes-absentes">Notes s’ouvre, mais vos notes ne s’affichent pas</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notes sur macOS 27 sans iCloud : Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Boutons System Settings et Cancel."
        caption="Ce que Notes affiche sur un Mac où iCloud est désactivé pour Notes (en français : Activer iCloud)." />
      <p>
        Si l’app fonctionne mais que la liste est vide, les étapes d’Apple sont de vérifier que Synchroniser cet iPhone (ou Synchroniser ce
        Mac) est activé pour Notes, puis de regarder dans l’app Notes. Si les notes n’apparaissent toujours pas, redémarrez l’appareil et
        vérifiez à nouveau le réglage. Apple dit qu’une fois la synchronisation terminée, les notes déjà dans iCloud devraient apparaître.
      </p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir", "Notes"] },
        { on: "iPhone, iOS 26", steps: ["Réglages", "Votre nom", "iCloud", "Notes"] },
        { on: "Mac, macOS 15 ou ultérieur", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes"] },
      ]} />
      <p>
        Ces étapes viennent de <a href="https://support.apple.com/fr-fr/121669" rel="noopener">Si vos notes iCloud ne s’affichent pas dans
        l’app Notes</a>. Si les notes apparaissent sur un appareil et pas sur l’autre,{" "}
        <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">Notes ne se synchronise pas entre iPhone et Mac</a> passe par le reste des
        vérifications. Si une seule note manque partout, regardez dans Suppressions récentes, où les notes supprimées restent 30 jours :{" "}
        <a href="/blog/recover-deleted-apple-notes">Recover deleted Apple Notes</a> (en anglais) montre où le trouver sur chaque appareil.
      </p>

      <h2 id="apres-une-mise-a-jour">Ça ne marche plus depuis une mise à jour</h2>
      <p>
        Quand un appareil est mis à jour et pas l’autre, une note créée sur le plus récent peut utiliser des fonctionnalités que l’ancienne
        version de Notes n’a pas. Sur Mac, Notes affiche alors « Cette note utilise des fonctionnalités non prises en charge. Pour la
        consulter ou la modifier, mettez à niveau votre appareil vers la dernière version de macOS. » La note s’est bien synchronisée, mais
        ce Mac ne peut pas l’ouvrir. La solution est de mettre à jour l’appareil qui est en retard.
      </p>
      <p>
        Si c’est Notes lui-même qui plante depuis une mise à jour, les étapes ci-dessus restent celles qu’Apple donne. Cherchez aussi une
        mise à jour plus récente, car Apple compte les mises à jour logicielles parmi les solutions pour une app qui se ferme.
      </p>

      <h2 id="la-prochaine-fois">Gardez une copie, pour la prochaine fois</h2>
      <p>
        Une copie de vos notes en dehors de l’app Notes vaut la peine, quoi qu’il arrive. <a href="/blog/back-up-apple-notes">How to back up
        Apple Notes</a> (en anglais) explique comment en garder une.
      </p>

      <h2 id="pinto-notes">Un deuxième endroit pour vos notes</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="La fenêtre Import from Apple Notes dans Pinto Notes sur Mac : Copies the notes you pick. Nothing in Apple Notes changes. Chaque note est listée sous son dossier Notes, toutes cochées, avec le bouton Import 8 Notes."
        caption="Import from Apple Notes dans Pinto Notes sur Mac. Il copie vos notes et laisse Notes tel quel." />
      <p>
        Pinto Notes ne répare pas Notes. C’est une app de notes qui ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et il peut
        garder une deuxième copie de vos notes : <a href="/blog/move-from-apple-notes">passer de Notes à Pinto Notes</a> (en anglais) se fait
        en un seul import sur votre Mac, et Notes reste tel quel. L’import lit vos notes à travers Notes, donc Notes doit pouvoir s’ouvrir
        sur ce Mac. Ensuite, chaque version précédente de chaque note est gardée dans Pinto Notes. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
