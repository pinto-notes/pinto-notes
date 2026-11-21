import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-iphone-disparues");

// French version of /blog/apple-notes-disappeared (batch 3, 21 Nov 2026). Apple's own French words for every step,
// all read on 21 Nov 2026: support.apple.com/fr-fr/102476 ("Si vous ne retrouvez pas certaines notes": mettre à jour
// d'abord, Réglages > Apps > Notes > Comptes, Suppressions récentes, l'icône Précédent, la barre de recherche, Tous les
// comptes, la recherche ne porte que sur le titre des notes verrouillées, la Corbeille dans Mail), support.apple.com/
// fr-fr/121669 (Synchroniser cet [appareil], redémarrer puis vérifier à nouveau), support.apple.com/fr-fr/118582
// (Notes is on the list; supprimer une app intégrée supprime ses données utilisateur; nom exact dans l'App Store, le
// bouton Retélécharger). The French 118582 does not carry the English page's sentence that iCloud data isn't deleted
// with the app; that fact is the English post's, from the English 118582. iPhone guide, iOS 27:
// support.apple.com/fr-fr/guide/iphone/iph7262fd4fe/ios (Tout voir, « Comptes Notes », compte « Sur mon iPhone » in
// iCloud backups), iph904eee369/ios (« Suppr. récentes », 30 jours, Déplacer, rouvrir une note partagée depuis le lien
// d'origine), iph92579feda/ios (Compte par défaut, Siri et le widget Notes), ipha61270292/ios (dossiers) and
// iph87abad19a/ios (la bibliothèque d'apps, le champ de recherche, les icônes s'animent). Mac guide, macOS 27:
// support.apple.com/fr-fr/guide/notes/not85d6f7b58/mac (Notes > Comptes; les notes du compte ne sont pas disponibles
// lorsque Notes est désactivé), notc3b2d538b/mac (no Suppressions récentes without upgraded iCloud notes),
// not5585d71a8/mac (glisser vers un autre dossier; a shared note deleted by its owner leaves every participant's
// devices) and apd8b73d28be/mac (Présentation > Afficher la barre latérale, le bouton sur le nom du compte); iCloud
// guide support.apple.com/fr-fr/guide/icloud/mm8685520792/icloud (Synchroniser ce Mac). Search words: Google's French
// suggestions (hl=fr, gl=fr, 21 Nov) give "notes iphone disparues", "notes disparues iphone", "mes notes ont disparu de
// mon iphone" (and de mon mac), "pourquoi mes notes ont disparu de mon iphone", "notes icloud disparues", "application
// note disparue iphone" and "dossier notes iphone disparu". Hence the slug "notes iphone disparues". Facts are the
// English post's; the pictures are its own, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Pourquoi toutes mes notes ont-elles disparu de mon iPhone ?", a: [
    "Apple dit que des notes introuvables ont peut-être été supprimées par accident, ou qu’un réglage doit être modifié. Vérifiez que Notes est activé pour iCloud (Réglages, votre nom, iCloud), regardez dans Suppressions récentes, et assurez-vous que Notes est activé pour chacun de vos autres comptes, comme Gmail ou Yahoo.",
  ] },
  { q: "Mes notes ont disparu après une mise à jour. Que faire ?", a: [
    "Les étapes d’Apple pour les notes introuvables commencent par mettre à jour tous vos appareils vers la dernière version d’iOS et de macOS. Vérifiez ensuite que Notes est toujours activé pour iCloud et que vous êtes connecté au même compte Apple qu’avant. S’il manque encore des notes, Apple conseille de redémarrer l’iPhone et de vérifier à nouveau le réglage.",
  ] },
  { q: "Comment retrouver l’app Notes sur mon iPhone ?", a: [
    "Balayez vers la gauche au-delà de votre dernière page d’écran d’accueil pour atteindre la bibliothèque d’apps, et cherchez Notes. S’il y est, maintenez le doigt dessus pour le remettre sur l’écran d’accueil. S’il a été supprimé, ouvrez l’App Store, cherchez Notes et touchez le bouton Retélécharger.",
  ] },
  { q: "Supprimer l’app Notes supprime-t-il mes notes ?", a: [
    "Apple dit que supprimer une app intégrée supprime aussi ses données sur cet appareil, alors que les données stockées dans iCloud ne sont pas supprimées avec l’app. Les notes iCloud sont aussi sur icloud.com/notes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="notes-iphone-disparues"
      intro={<>Vos notes étaient là hier, et maintenant la liste est vide ou un dossier a disparu. Pour Apple, des notes introuvables ont soit été supprimées par accident, soit un réglage doit être modifié. Ces vérifications passent par les deux, des plus rapides aux plus longues.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#verifications", label: "Les vérifications dans l’ordre" },
          { href: "#sur-mac", label: "Sur Mac" },
          { href: "#app-disparue", label: "L’app a disparu" },
          { href: "#pinto-notes", label: "Garder une deuxième copie" },
        ]}>
          <p>
            Vérifiez d’abord que Notes est activé pour iCloud, puis ouvrez Suppressions récentes, où une note supprimée attend pendant
            30 jours. Assurez-vous ensuite que Notes est activé pour vos autres comptes, comme Gmail, et que chaque appareil est connecté au
            même compte Apple. Si c’est l’app Notes elle-même qui manque, elle est dans la bibliothèque d’apps ou dans l’App Store.
          </p>
          <PostCta slug="fr/notes-iphone-disparues" path="/fr/blog/notes-iphone-disparues" position="answer" ui={ui.cta}
            title="Toutes les versions de vos notes, gardées ?">
            <p>Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et garde chaque version précédente de chaque note. Sur Mac, il peut importer vos notes Apple une fois, comme deuxième copie, et Notes reste tel quel.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notes sur macOS 27 sans iCloud : Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Boutons System Settings et Cancel."
        caption="Ce que Notes affiche sur un Mac où Notes est désactivé pour iCloud (en français : Activer iCloud). Les notes sont toujours dans iCloud ; ce Mac ne les affiche simplement pas." />}
      faq={FAQ}
    >
      <h2 id="verifications">Les vérifications, dans l’ordre</h2>
      <p>
        L’<a href="https://support.apple.com/fr-fr/102476" rel="noopener">article d’Apple sur les notes introuvables</a> commence par une
        étape avant tout le reste : mettre à jour tous vos appareils vers la dernière version d’iOS ou de macOS, pour écarter un logiciel trop
        ancien. Suivez ensuite la liste.
      </p>
      <Steps>
        <li id="icloud-active">
          <strong>Notes est activé pour iCloud</strong>{" "}
          Si vos notes iCloud n’apparaissent pas, la solution d’Apple est de vérifier que Synchroniser cet iPhone est activé, puis de
          regarder dans Notes. Si elles n’apparaissent toujours pas, redémarrez l’iPhone et vérifiez à nouveau le réglage. Apple dit que les
          notes devraient alors apparaître et recommencer à se synchroniser, et que le contenu déjà synchronisé avec iCloud devrait
          apparaître une fois la synchronisation terminée.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir", "Notes", "Synchroniser cet iPhone"] },
            { on: "Mac, macOS 15 ou ultérieur", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes", "Synchroniser ce Mac"] },
          ]} />
        </li>
        <li id="suppressions-recentes">
          <strong>Suppressions récentes</strong>{" "}
          Une note supprimée passe dans Suppressions récentes sur votre iPhone, sur iCloud.com et sur vos autres appareils connectés au même
          compte Apple, et y reste 30 jours. Sur iPhone, revenez à la liste des dossiers, touchez Suppressions récentes, balayez la note vers la gauche et touchez Déplacer. Le dossier n’apparaît que s’il contient quelque chose.{" "}
          <a href="/blog/recover-deleted-apple-notes">Recover deleted Apple Notes</a> (en anglais) donne toutes les façons de récupérer une
          note, même après les 30 jours.
        </li>
        <li id="recherche">
          <strong>Une recherche avec Tous les comptes sélectionné</strong>{" "}
          Dans la liste des notes, touchez la barre de recherche et saisissez un mot ou le titre, avec l’option Tous les comptes
          sélectionnée. La recherche ne voit que le titre d’une note verrouillée, alors ouvrez vos notes verrouillées à la main. Si la
          recherche ne trouve rien, touchez l’icône Précédent jusqu’à voir la liste de vos dossiers, puis ouvrez-les un par un : une note
          peut se trouver dans un dossier inattendu.
        </li>
        <li id="autres-comptes">
          <strong>Notes est activé pour Gmail, Yahoo et vos autres comptes</strong>{" "}
          Les notes gardées dans un compte de messagerie ne s’affichent que si Notes est activé pour ce compte. Vérifiez chaque compte. Les
          notes supprimées de ces comptes ne vont pas dans Suppressions récentes : regardez dans la Corbeille de ce compte dans l’app Mail,
          puis copiez la note dans une nouvelle note.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Réglages", "Apps", "Notes", "Comptes Notes", "Le compte", "Notes"] },
            { on: "Mac", steps: ["Notes", "Comptes", "Le compte", "Notes"] },
          ]} />
        </li>
        <li id="meme-compte">
          <strong>Chaque appareil utilise le même compte Apple</strong>{" "}
          Apple dit que sur un appareil qui n’est pas connecté à votre compte Apple, vous ne verrez pas vos notes iCloud. Le nom en haut de
          Réglages sur iPhone, ou en haut de la barre latérale de Réglages Système sur Mac, est le compte qu’utilise cet appareil. Pour voir
          ce qu’iCloud contient, connectez-vous à icloud.com/notes dans un navigateur avec le même compte.
        </li>
        <li id="sur-mon-iphone">
          <strong>Les notes étaient gardées sur un seul appareil</strong>{" "}
          Les notes du compte Sur mon iPhone n’apparaissent que sur cet iPhone, et celles de Sur mon Mac que sur ce Mac. Si une note manque
          sur votre autre appareil, regardez la rubrique au-dessus de son dossier sur l’appareil qui l’a.{" "}
          <a href="/fr/blog/deplacer-notes-iphone-vers-icloud">Déplacer ses notes vers iCloud</a> les met sur tous vos appareils.
        </li>
        <li id="redemarrer">
          <strong>Redémarrez, puis vérifiez à nouveau</strong>{" "}
          S’il manque encore des notes après les réglages ci-dessus, l’étape suivante d’Apple est un redémarrage, puis une nouvelle
          vérification du réglage iCloud. Si les notes apparaissent sur un appareil et pas sur l’autre, voyez{" "}
          <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">Notes ne se synchronise pas</a>.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-recently-deleted" width={760} height={894} maxWidth={300}
        alt="Le dossier Suppressions récentes de Notes sur iPhone avec quatre notes, sous une ligne qui dit que les notes supprimées sont retirées après 30 jours et que leur suppression définitive d’iCloud peut prendre jusqu’à 40 jours de plus."
        caption="Suppressions récentes sur iPhone. Le dossier n’apparaît que s’il contient une note. Image : Apple." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Les réglages d’un compte Gmail sur iPhone, avec des interrupteurs pour Mail, Contacts, Calendriers et Notes, tous activés."
        caption="Les notes d’un compte de messagerie ne s’affichent que si son interrupteur Notes est activé. Image : Apple." />

      <h2 id="sur-mac">Des notes ou des dossiers manquent sur Mac</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="La barre latérale de Notes sur macOS 27 avec une seule section On My Mac : All on My Mac, Notes, un dossier et Recently Deleted. Pas de section iCloud."
        caption="Pas de rubrique iCloud dans la barre latérale : ce Mac n’affiche pas vos notes iCloud. Vérifiez d’abord Synchroniser ce Mac." />
      <ul>
        <li><strong>Pas de barre latérale.</strong> Choisissez Présentation, Afficher la barre latérale.</li>
        <li><strong>Un compte sans aucun dossier dessous.</strong> Placez le pointeur sur le nom du compte dans la barre latérale jusqu’à ce qu’un bouton apparaisse, puis cliquez dessus.</li>
        <li><strong>Un compte entier manque.</strong> Choisissez Notes, Comptes, sélectionnez le compte et activez Notes. Apple dit que les notes d’un compte ne sont pas disponibles tant que Notes est désactivé pour ce compte.</li>
        <li><strong>Une note supprimée.</strong> Cliquez sur Suppressions récentes et faites glisser la note vers un autre dossier de la barre latérale. Si vos notes iCloud ne sont pas mises à niveau, ou si la note était dans un autre type de compte, il n’y a pas de dossier Suppressions récentes, et Apple dit que les notes supprimées le sont de tous les appareils qui utilisent ce compte.</li>
        <li><strong>Une note partagée.</strong> Si le propriétaire supprime une note qu’il partageait, Apple dit qu’elle est aussi supprimée des appareils de tous les participants. Si vous avez supprimé une note qu’on avait partagée avec vous, vous pouvez peut-être la rouvrir depuis le lien d’origine, sauf si le propriétaire a arrêté le partage.</li>
      </ul>

      <h2 id="app-disparue">Quand c’est l’app Notes qui a disparu</h2>
      <p>
        Une app retirée de l’écran d’accueil n’est pas supprimée. Elle passe dans la bibliothèque d’apps, et vous pouvez toujours l’utiliser
        depuis là.
      </p>
      <Steps>
        <li>Sur l’écran d’accueil, balayez vers la gauche toutes vos pages pour atteindre la bibliothèque d’apps.</li>
        <li>Touchez le champ de recherche en haut de l’écran et saisissez Notes.</li>
        <li>Pour le remettre en place, maintenez le doigt sur l’icône jusqu’à ce que les icônes s’animent et qu’elle aille sur l’écran d’accueil, puis levez le doigt.</li>
      </Steps>
      <p>
        Notes fait partie des apps intégrées qu’Apple permet de supprimer. S’il n’est pas dans la bibliothèque d’apps, ouvrez l’App Store,
        cherchez Notes en saisissant son nom exact, touchez le bouton Retélécharger, puis ouvrez-le depuis l’écran d’accueil une fois la
        restauration terminée. Apple dit que supprimer une app intégrée supprime aussi ses données sur l’appareil, alors que les données
        stockées dans iCloud ne sont pas supprimées avec l’app. Les notes de Sur mon iPhone font partie des sauvegardes de votre iPhone sur
        iCloud.
      </p>

      <h2 id="la-prochaine-fois">Pour que ça ne recommence pas</h2>
      <ul>
        <li>Choisissez iCloud comme compte par défaut dans Réglages, Apps, Notes, Compte par défaut. C’est lui qui décide où vont les notes créées avec Siri et le widget Notes.</li>
        <li>Gardez votre propre copie des notes que vous ne pouvez pas perdre. <a href="/blog/back-up-apple-notes">How to back up Apple Notes</a> (en anglais) propose une routine.</li>
      </ul>

      <h2 id="pinto-notes">Garder une deuxième copie, avec chaque version</h2>
      <p>
        Suppressions récentes couvre une note qui a été supprimée. Il ne couvre pas une note que quelqu’un a modifiée, car Notes ne garde{" "}
        <a href="/blog/apple-notes-version-history">aucun historique des versions</a> (en anglais). Pinto Notes, l’app de notes pour iPhone et
        Mac, garde chaque version précédente de chaque note : un paragraphe disparu d’une note peut donc être restauré.
      </p>
      <p>
        Il ne ramène pas les notes déjà perdues dans Notes. <a href="/blog/move-from-apple-notes">Importer depuis Notes</a> (en anglais) se
        fait en un seul import sur votre Mac et vous donne une deuxième copie, et Notes reste tel quel. L’app est en anglais.
      </p>
      <Figure shot={{ ...SHOTS.history, alt: "L’historique des versions d’une note Groceries dans Pinto Notes sur Mac : des versions faites par vous sur iPhone et sur Mac, par ChatGPT et par Claude Code, avec les lignes qui changent teintées et un bouton Restore This Version." }}
        caption="L’historique des versions dans Pinto Notes sur Mac : chaque version précédente, qui l’a faite, et Restore This Version." />
    </LocalPostPage>
  );
}
