import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "notes-ne-se-synchronise-pas-iphone-mac");

// French version of /blog/apple-notes-not-syncing (language pilot, 17 Nov 2026). Apple's own French words for
// every menu, button and setting, all read on 17 Nov: support.apple.com/fr-fr/121669 ("Si vos notes iCloud ne
// s’affichent pas dans l’app Notes"), support.apple.com/fr-fr/108922 (stockage iCloud plein: "les autres apps
// iCloud ne seront plus synchronisés"), support.apple.com/fr-fr/102462 ("Si vous ne parvenez pas à collaborer
// dans l’app Notes"), the iCloud guide support.apple.com/fr-fr/guide/icloud/mm8685520792/icloud ("Configurer
// iCloud pour Notes sur tous vos appareils": Synchroniser ce Mac), the iPhone guide
// support.apple.com/fr-fr/guide/iphone/iph7262fd4fe/ios (iOS 27: Tout voir) and iph92579feda/ios (Compte par
// défaut), and the Mac guide support.apple.com/fr-fr/guide/notes/apd97da26aed/mac (Compte par défaut). The Mac
// app's own messages are the French strings in Notes' Localizable.loctable on macOS 27.2; the System Status
// service name is "Notes iCloud" on apple.com/fr/support/systemstatus. Search words: Google's French suggestions
// give "notes ne se synchronise pas sur mac" and "synchroniser notes iphone mac". The English post's chooser is
// left out. Facts are the English post's; the screenshots are its English ones, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Pourquoi mes notes ne se synchronisent-elles pas entre mon iPhone et mon Mac ?", a: [
    "Le plus souvent, Notes est désactivé pour iCloud sur l’un des appareils, ou les deux sont connectés à des comptes Apple différents. Les notes rangées dans Sur mon iPhone ou dans Gmail ne passent jamais par iCloud, et un stockage iCloud plein bloque aussi la synchronisation. La solution d’Apple : vérifier Synchroniser cet iPhone dans les réglages iCloud, puis redémarrer l’appareil si des notes manquent encore.",
  ] },
  { q: "Comment forcer la synchronisation de Notes ?", a: [
    "Apple ne décrit aucun bouton qui force la synchronisation. Ce qu’Apple conseille, c’est de vérifier que Notes est activé pour iCloud et de redémarrer l’appareil. Ouvrir icloud.com/notes dans un navigateur montre si une note est bien arrivée sur iCloud.",
  ] },
  { q: "Les notes de Sur mon iPhone se synchronisent-elles avec mon Mac ?", a: [
    "Non. Sur mon iPhone sert aux notes gardées uniquement sur ce téléphone, et Sur mon Mac est la même chose sur un Mac. Déplacez les notes dans un dossier iCloud et elles apparaissent sur tous les appareils connectés au même compte Apple.",
  ] },
  { q: "Pourquoi une note partagée ne se met-elle pas à jour ?", a: [
    "Vérifiez que tout le monde est connecté à son compte Apple avec Notes activé dans iCloud, et que la note n’est pas verrouillée, car on ne peut pas partager une note verrouillée. Si le stockage iCloud du propriétaire est plein, Notes garde vos modifications sur votre appareil et les envoie dès que le propriétaire libère de l’espace.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="notes-ne-se-synchronise-pas-iphone-mac"
      intro={<>Une note écrite sur votre iPhone n’apparaît pas sur votre Mac, ou l’inverse : Notes ne se synchronise pas. Un coup d’œil à icloud.com vous dit lequel des deux appareils réparer.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#quelles-notes", label: "Quelles notes se synchronisent" },
          { href: "#verifications", label: "Les vérifications dans l’ordre" },
          { href: "#partagees", label: "Notes partagées" },
          { href: "#disparues", label: "Notes disparues partout" },
        ]}>
          <p>
            Notes se synchronise par iCloud. Une note n’arrive sur votre autre appareil que si elle se trouve sous la rubrique iCloud, et si
            les deux appareils sont connectés au même compte Apple avec Notes activé pour iCloud. Vérifiez ces trois points d’abord. Un
            stockage iCloud plein, ou un Mac sur une version de macOS plus ancienne que votre iPhone, viennent ensuite.
          </p>
          <PostCta slug="fr/notes-ne-se-synchronise-pas-iphone-mac" path="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac" position="answer" ui={ui.cta}
            title="Une app de notes qui montre sa synchronisation">
            <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac et affiche quand il s’est synchronisé pour la dernière fois. Il importe vos notes Apple en une étape, sans les modifier.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/notes-same-note-three-devices" width={814} height={412} maxWidth={600}
        alt="La même note manuscrite, Urban planner, ouverte en même temps dans Notes sur un MacBook, une tablette et un iPhone."
        caption="Ce qu’on devrait voir : une seule note, identique sur chaque appareil. Image : Apple." />}
      faq={FAQ}
    >
      <h2 id="quelles-notes">Quelles notes se synchronisent, et où</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="La barre latérale de Notes sur macOS 27 avec une seule section On My Mac : All on My Mac, Notes, un dossier et Recently Deleted. Pas de section iCloud."
        caption="Si vos notes sont sous Sur mon Mac (ou Sur mon iPhone sur un téléphone), elles ne quittent jamais cet appareil. C’est la première chose à vérifier." />
      <p>
        Notes regroupe les dossiers par compte, et la rubrique sous laquelle se trouve une note décide où elle va. Les nouvelles notes
        arrivent dans le compte par défaut : sur Mac, c’est Compte par défaut dans Notes, Réglages, et sur iPhone, c’est Compte par
        défaut dans Réglages, Apps, Notes. Choisissez iCloud, sinon la prochaine note créée par Siri risque d’atterrir de nouveau au
        mauvais endroit.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">La note est sous</th><th scope="col">Arrive sur vos autres appareils ?</th><th scope="col">Bon à savoir</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">iCloud</th><td>Oui</td><td>Sur chaque appareil connecté au même compte Apple, avec Notes activé pour iCloud</td></tr>
            <tr><th scope="row">Sur mon iPhone</th><td>Non</td><td>Reste sur cet iPhone. <a href="/fr/blog/deplacer-notes-iphone-vers-icloud">Déplacez-la dans un dossier iCloud</a></td></tr>
            <tr><th scope="row">Sur mon Mac</th><td>Non</td><td>Reste sur ce Mac</td></tr>
            <tr><th scope="row">Gmail ou un autre compte de messagerie</th><td>Seulement par ce compte de messagerie</td><td>Elle ne passe jamais par iCloud</td></tr>
            <tr><th scope="row">Une note partagée avec vous</th><td>Oui</td><td>Elle est stockée dans l’iCloud du propriétaire, donc c’est son stockage qui compte</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="verifications">Les vérifications, dans l’ordre</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notes sur macOS 27 sans iCloud : Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Boutons System Settings et Cancel."
        caption="Ce que Notes affiche sur un Mac où iCloud est désactivé pour Notes (en français : Activer iCloud). Il n’y a aucun état de synchronisation ailleurs dans Notes sur macOS 27 ; j’ai cherché." />
      <Steps>
        <li id="icloud-active">
          <strong>Notes est activé pour iCloud, sur les deux appareils</strong>
          Le réglage s’appelle Synchroniser cet iPhone ou Synchroniser ce Mac. <a href="https://support.apple.com/fr-fr/121669"
          rel="noopener">Apple dit</a> que si des notes manquent encore après l’avoir activé, il faut redémarrer l’appareil et vérifier à
          nouveau le réglage.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir", "Notes"] },
            { on: "iPhone, iOS 26", steps: ["Réglages", "Votre nom", "iCloud", "Notes"] },
            { on: "Mac, macOS 15 ou ultérieur", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes"] },
          ]} />
        </li>
        <li id="meme-compte">
          <strong>Les deux appareils utilisent le même compte Apple</strong>
          Le nom en haut de Réglages sur iPhone, et en haut de Réglages Système sur Mac, est le compte avec lequel cet appareil se
          synchronise. Un Mac de travail connecté au compte Apple de l’entreprise n’affichera pas les notes de votre iPhone personnel.
        </li>
        <li id="icloud-a-la-note">
          <strong>iCloud a bien la note</strong>
          Ouvrez icloud.com/notes dans un navigateur et connectez-vous avec le même compte Apple. Si la note y est, c’est l’appareil où elle
          manque qu’il faut réparer. Si elle n’y est pas, l’appareil où vous l’avez écrite ne l’a pas encore envoyée : commencez par lui.
        </li>
        <li id="etat">
          <strong>Notes iCloud fonctionne</strong>
          Apple liste Notes iCloud sur sa page État du système, à l’adresse apple.com/fr/support/systemstatus. Si elle signale une panne,
          aucun réglage de votre côté n’y changera rien. Attendez qu’Apple la marque comme résolue.
        </li>
        <li id="stockage">
          <strong>Votre stockage iCloud n’est pas plein</strong>
          <a href="https://support.apple.com/fr-fr/108922" rel="noopener">Apple dit</a> que si vous manquez d’espace de stockage iCloud, les apps iCloud ne sont plus synchronisées avec l’ensemble de vos
          appareils, et Notes en fait partie. Ouvrez Réglages, touchez votre nom, puis iCloud, pour voir combien vous utilisez. Libérer un
          peu d’espace ou passer à un forfait plus grand permet à la synchronisation de reprendre.
        </li>
        <li id="mises-a-jour">
          <strong>Aucun des deux appareils n’est en retard sur les mises à jour</strong>
          Une note créée avec une version plus récente de Notes peut utiliser des fonctionnalités qu’une version plus ancienne n’a pas. Sur
          Mac, Notes l’affiche alors avec le message &laquo; Cette note utilise des fonctionnalités non prises en charge. Pour la consulter
          ou la modifier, mettez à niveau votre appareil vers la dernière version de macOS. &raquo; La note s’est bien synchronisée, mais ce
          Mac ne peut pas l’ouvrir. Depuis la sortie d’iOS 27 le 14 septembre, le cas le plus probable est un iPhone sous iOS 27 avec un
          Mac encore sous macOS 26, et la solution est de mettre le Mac à jour vers macOS 27.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="L’écran iCloud dans les réglages de l’iPhone : 4,1 Go utilisés sur 50 Go, et sous Saved to iCloud, Photos, Drive, Passwords, Notes avec 29 éléments, Messages et Mail."
        caption="Réglages, votre nom, iCloud : le niveau de remplissage de votre stockage, et ce que Notes y garde. Image : Apple." />
      <p>
        Apple ne décrit aucun bouton qui force la synchronisation, il n’y a donc rien sur quoi appuyer. Pour les appareils beaucoup plus
        anciens, le guide Mac d’Apple indique que les notes iCloud mises à niveau ne s’ouvrent pas sur les versions antérieures à OS X
        10.11 ou iOS 9, et que la barre latérale de Notes affiche un bouton Mettre à niveau à côté d’iCloud tant que vous n’avez pas
        fait la mise à niveau.
      </p>

      <h2 id="partagees">Quand une note partagée ne se met pas à jour</h2>
      <PostFigure src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Deux icônes de notes dessinées, chacune avec une personne au-dessus, reliées par une ligne pointillée avec un signe pause au milieu."
        caption="Une note partagée attend quand l’un des deux côtés ne peut pas se synchroniser." />
      <ul>
        <li>Tout le monde doit être connecté à un compte Apple avec Notes activé pour iCloud. La page d’Apple sur la collaboration dans Notes demande aussi la dernière version d’iOS.</li>
        <li>On ne peut pas collaborer sur une note verrouillée, ni sur un dossier qui en contient une.</li>
        <li>Une note partagée est stockée dans l’iCloud de son propriétaire. Quand son stockage est plein, Notes sur Mac dit que vos modifications ne peuvent pas être envoyées, qu’elles sont enregistrées sur votre appareil et qu’elles le seront dès que le propriétaire libérera de l’espace.</li>
        <li>Si Notes vous demande de mettre à niveau la sécurité de votre compte &laquo; pour consulter les modifications en temps réel et utiliser les dernières fonctionnalités de collaboration &raquo;, les modifications des autres ne s’afficheront pas en direct tant que vous ne l’aurez pas fait.</li>
      </ul>
      <p>
        Sous iOS 27, le partage a changé de place : touchez le bouton Partager, puis Partager un lien ou Envoyer une copie, et choisissez
        qui peut modifier sous &laquo; Les personnes que vous choisissez peuvent apporter des modifications &raquo;. Les détails sont sur la
        page d’Apple <a href="https://support.apple.com/fr-fr/102462" rel="noopener">Si vous ne parvenez pas à collaborer dans l’app Notes</a>.
      </p>

      <h2 id="disparues">Si des notes ont disparu de tous vos appareils</h2>
      <PostFigure src="/blog/macos27/notes-recently-deleted-window" width={1520} height={1003} maxWidth={560}
        alt="Notes sur macOS 27 ouvert sur Recently Deleted avec deux notes, Fresh pasta dough et Gift ideas, sous une ligne qui dit que les notes supprimées sont retirées de vos appareils après 30 jours."
        caption="Une note supprimée sur n’importe quel appareil attend ici pendant 30 jours." />
      <p>
        Supprimer une note sur un appareil la supprime partout, ce qui peut ressembler à un problème de synchronisation. Les notes
        supprimées restent dans Suppressions récentes pendant 30 jours, sur chaque appareil connecté au même compte Apple. Garder votre
        propre copie aide aussi.
      </p>

      <h2 id="pinto-notes">Une app de notes qui montre sa synchronisation</h2>
      <PostFigure src="/blog/drawn/sync-ok" width={1200} height={750} maxWidth={560}
        alt="Un nuage blanc dessiné avec une coche verte et une petite horloge à côté."
        caption="Pinto Notes montre quand il s’est synchronisé pour la dernière fois, et pourquoi quand il n’y arrive pas." />
      <p>
        Notes n’affiche pas quand il s’est synchronisé pour la dernière fois, et c’est pour ça qu’il faut six vérifications. Pinto Notes,
        l’app de notes pour iPhone et Mac, se synchronise par son propre service chiffré et pas par iCloud, donc le stockage
        iCloud ne le concerne pas. Ses réglages affichent l’état de la synchronisation, par exemple &laquo; last synced 9:41 &raquo; ou la
        raison pour laquelle il ne peut pas se synchroniser pour l’instant, à côté d’un bouton Sync Now. Si la même note a changé sur
        deux appareils avant qu’ils se synchronisent, la modification la plus récente l’emporte et l’autre est gardée comme copie en
        conflit, donc aucune n’est perdue.
      </p>
      <p>
        Il ne répare pas Notes à votre place, et il n’a pas de version Windows, Android ou web. Passer de Notes à Pinto Notes demande un
        seul import sur votre Mac, et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
