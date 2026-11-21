import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "collaboration-note-iphone-impossible");

// French version of /blog/apple-notes-unable-to-start-collaboration (batch 3, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/102462 ("Si vous ne parvenez pas à collaborer dans l'app Notes",
// published 13 Nov 2026: la dernière version d'iOS, Réglages > votre nom > iCloud > Enregistré sur iCloud > Notes,
// « Synchroniser cet [appareil] », le dossier Tout iCloud, le bouton Partager, Partager un lien ou Envoyer une copie on
// iOS 27, « Les personnes que vous choisissez peuvent apporter des modifications », the Collaborer button, Gérer la note
// partagée, Ajouter un participant, Collaborer or Envoyer une copie on iOS 18 to 26, « Seules les personnes invitées
// peuvent apporter des modifications », Messages ou Mail, demandes en attente, notes verrouillées, Apple devices only on
// iOS 26 or earlier, 100 personnes); iPhone guide, iOS 27: support.apple.com/fr-fr/guide/iphone/iphe4d04f674/ios
// (participants connectés à leur compte Apple avec Notes activé dans iCloud, « Personnes choisies » ou « Quiconque
// disposant du lien », Modification ou « Affichage et téléchargement uniquement », a request emails the owner's Apple
// Account address, Arrêter le partage removes the note from the others' devices) and iphf177bb154/ios (Verrouiller des
// notes: to remove the lock, touch the note's button, then Supprimer; notes shared on iCloud can't be locked; Face ID,
// Touch ID, the device passcode or the Notes password open a locked note); Mac guide, macOS 27:
// support.apple.com/fr-fr/guide/notes/apd4e6e2c9a6/mac (notes iCloud mises à niveau, the toolbar Share button, le menu
// local, « Partager un lien », « Partager le dossier », « Modifications autorisées » or « Affichage et téléchargement »,
// cliquez sur le lien puis sur Ouvrir, the invitation address must be on your Apple Account, two-factor authentication
// and iCloud Keychain to see changes immediately), apd881ec5518/mac (« Ne plus partager »), glosedbd72f8/mac (the
// « Mettre à niveau » button, no adding people until you upgrade, OS X 10.11 and iOS 9) and apd5be85b5ce/mac (tags,
// mentions and note links need iOS 14.5 or macOS 11.3); support.apple.com/fr-fr/guide/mac-help/mchl267b6234/mac (the
// verification link from Réglages Système); iCloud guide support.apple.com/fr-fr/guide/icloud/mmc0cd6c83/icloud
// (participants need an Apple Account) and mmf181271571/icloud (« Accepter l'invitation », ask the owner to resend). The
// iPhone message itself ("Unable to start collaboration") has no French wording on any of these pages or in the macOS
// 27.2 Notes strings, so the post describes it instead of quoting a French message. From notes-ne-se-synchronise-pas-
// iphone-mac: the Activer iCloud prompt and the Mac message when a shared note's owner has full storage. Search words:
// Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "collaboration note iphone impossible", "impossible de
// collaborer note iphone", "note collaborer iphone", "comment collaborer notes iphone", "partager une note iphone
// collaborer" and "note partagée iphone ne fonctionne pas". Hence the slug "collaboration note iphone impossible". Facts
// are the English post's; the pictures are its own, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Que veut dire le message qui refuse de démarrer la collaboration dans Notes ?", a: [
    "Apple n’explique pas ce message. Son article sur les problèmes de collaboration liste ce qu’il faut vérifier : les deux personnes sur la dernière version d’iOS, connectées à un compte Apple avec Notes activé pour iCloud, une note dans iCloud et non verrouillée, et moins de 100 personnes dedans.",
  ] },
  { q: "Pourquoi l’option Collaborer a-t-elle disparu de Notes sous iOS 27 ?", a: [
    "Sous iOS 27, elle s’appelle Partager un lien. Touchez le bouton Partager, puis le menu sous le titre de la note, et choisissez Partager un lien. L’option Collaborer est ce qu’iOS 18 à iOS 26 affichent au même endroit.",
  ] },
  { q: "Puis-je collaborer sur une note avec quelqu’un qui n’a pas d’iPhone ?", a: [
    "Apple dit que les participants ont besoin d’un compte Apple pour consulter et modifier une note partagée. Sous iOS 26 ou une version antérieure, la collaboration ne fonctionne qu’avec une personne connectée à son compte Apple sur un appareil Apple. Sinon, envoyez une copie de la note par e-mail ou par message.",
  ] },
  { q: "Pourquoi je n’arrive pas à ouvrir une note qu’on a partagée avec moi ?", a: [
    "Le plus souvent, l’invitation est partie vers une adresse e-mail ou un numéro de téléphone qui n’est pas associé à votre compte Apple. Ajoutez-le à votre compte quand Notes vous le propose, ou demandez au propriétaire de renvoyer l’invitation à l’adresse qu’utilise votre compte Apple.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="collaboration-note-iphone-impossible"
      intro={<>Vous touchez Partager sur une note et Notes refuse de démarrer la collaboration, ou l’option Collaborer n’est même pas là. Voici les vérifications d’Apple, de la plus probable à la moins probable.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#verifications", label: "Les vérifications dans l’ordre" },
          { href: "#iphone", label: "Commencer sur iPhone" },
          { href: "#mac", label: "Commencer sur Mac" },
          { href: "#impossible-d-ouvrir", label: "Impossible d’ouvrir une note partagée" },
        ]}>
          <p>
            Pour collaborer dans Notes, il faut une note dans iCloud qui n’est pas verrouillée, et que tout le monde soit connecté à un compte
            Apple avec Notes activé pour iCloud. Apple demande aussi que les deux personnes aient la dernière version d’iOS. Sous iOS 27,
            l’option s’appelle Partager un lien : si vous cherchez Collaborer, c’est celle-là.
          </p>
          <PostCta slug="fr/collaboration-note-iphone-impossible" path="/fr/blog/collaboration-note-iphone-impossible" position="answer" ui={ui.cta}
            title="Partager une note avec un seul lien ?">
            <p>Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac. Envoyez le lien d’une note, et les personnes invitées y écrivent avec vous, leur curseur visible pendant qu’elles tapent. Les notes partagées sont chiffrées.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Deux icônes de notes dessinées, chacune avec une personne au-dessus, reliées par une ligne pointillée avec un signe pause au milieu."
        caption="Une note partagée a besoin des mêmes quelques conditions des deux côtés avant de démarrer." />}
      faq={FAQ}
    >
      <h2 id="verifications">Les vérifications, dans l’ordre</h2>
      <p>
        Apple ne documente pas le message qui dit que la collaboration ne peut pas démarrer : personne ne peut donc vous dire, à partir du
        message seul, quelle vérification a échoué. Voici les conditions qu’Apple liste, dans l’ordre où il vaut la peine de les essayer.
      </p>
      <Steps>
        <li id="nom-de-l-option">
          <strong>Vous choisissez la bonne option</strong>{" "}
          Sous iOS 27, touchez le bouton Partager, puis le menu sous le titre de la note, et choisissez Partager un lien. Envoyer une copie
          envoie une copie que personne d’autre ne peut modifier. Sous iOS 18 à iOS 26, le même menu propose Collaborer ou Envoyer une copie.
        </li>
        <li id="dans-icloud">
          <strong>La note est dans iCloud</strong>{" "}
          Les étapes d’Apple commencent dans le dossier Tout iCloud, et son guide Mac dit qu’il faut des notes iCloud mises à niveau pour
          collaborer. Une note sous Sur mon iPhone, Sur mon Mac ou un compte Gmail n’est pas dans iCloud.{" "}
          <a href="/fr/blog/deplacer-notes-iphone-vers-icloud">Déplacez-la d’abord dans un dossier iCloud</a>.
        </li>
        <li id="verrouillee">
          <strong>La note n’est pas verrouillée</strong>{" "}
          On ne peut pas collaborer sur une note verrouillée, ni sur un dossier qui contient une note verrouillée. Ouvrez la note et
          déverrouillez-la avec votre mot de passe, Face ID ou Touch ID, puis ouvrez le menu de la note et touchez Supprimer pour retirer
          le verrouillage.
        </li>
        <li id="icloud-active">
          <strong>Vous êtes connecté, avec Notes activé pour iCloud</strong>{" "}
          Ouvrez Réglages, touchez votre nom, puis iCloud. Sous Enregistré sur iCloud, touchez Notes et vérifiez que Synchroniser cet iPhone
          est activé. Apple dit que les personnes que vous invitez en ont besoin aussi.
        </li>
        <li id="mise-a-jour">
          <strong>Vous avez tous les deux la dernière version d’iOS</strong>{" "}
          Apple demande la dernière version d’iOS sur votre iPhone et sur celui de l’autre personne. Les étapes Collaborer pour iOS 26 et
          versions antérieures demandent iOS 18 ou une version ultérieure.
        </li>
        <li id="autre-personne">
          <strong>L’autre personne a un compte Apple</strong>{" "}
          Les participants ont besoin d’un compte Apple pour consulter et modifier une note partagée. Sous iOS 26 ou une version antérieure,
          Apple dit que vous ne pouvez collaborer qu’avec une personne connectée à son compte Apple sur un appareil Apple. Sinon, envoyez
          plutôt une copie.
        </li>
        <li id="en-attente">
          <strong>Votre demande n’est pas restée en attente</strong>{" "}
          Si vous avez demandé l’accès à la note de quelqu’un sous iOS 27, votre demande est peut-être en attente. Le propriétaire la voit
          en touchant le bouton Collaborer, et Apple dit que la demande envoie aussi un e-mail à l’adresse associée au compte Apple du
          propriétaire.
        </li>
        <li id="limite">
          <strong>La note a encore de la place</strong>{" "}
          Jusqu’à 100 personnes peuvent collaborer sur une note.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="Le menu d’une note déverrouillée dans Notes sur iPhone, avec Remove en haut, à côté de Scan et Pin Note."
        caption="Supprimer (Remove sur cette image en anglais) retire le verrouillage d’une note déverrouillée, pour qu’elle puisse être partagée. Image : Apple." />
      <p>
        Le guide de l’iPhone d’Apple dit aussi que les notes partagées sur iCloud ne peuvent pas être verrouillées : vous ne pourrez donc
        pas la verrouiller de nouveau tant qu’elle est partagée.
      </p>

      <h2 id="iphone">Commencer à collaborer sur iPhone</h2>
      <p className="label" id="iphone-ios-27"><strong>iOS 27</strong></p>
      <Steps>
        <li>Dans Notes, allez dans le dossier Tout iCloud et ouvrez la note.</li>
        <li>Touchez le bouton Partager en haut de l’écran.</li>
        <li>Sous le titre de la note, choisissez Partager un lien.</li>
        <li>Pour changer qui peut participer, touchez « Les personnes que vous choisissez peuvent apporter des modifications ». Choisissez Personnes choisies ou Quiconque disposant du lien, et Modification ou Affichage et téléchargement uniquement.</li>
        <li>Choisissez comment envoyer l’invitation. La première personne qui participe est ajoutée automatiquement. Pour en ajouter d’autres, touchez le bouton Collaborer, puis Gérer la note partagée, puis Ajouter un participant.</li>
      </Steps>
      <p className="label" id="iphone-ios-26"><strong>iOS 18 à iOS 26</strong></p>
      <Steps>
        <li>Dans Notes, allez dans le dossier Tout iCloud et ouvrez la note.</li>
        <li>Touchez le bouton Partager, puis choisissez Collaborer sous le titre de la note.</li>
        <li>Touchez « Seules les personnes invitées peuvent apporter des modifications » pour choisir qui peut y accéder, ce qu’elles peuvent faire et si elles peuvent inviter d’autres personnes.</li>
        <li>Envoyez l’invitation avec Messages ou Mail.</li>
      </Steps>
      <p>
        Ces étapes viennent des pages d’Apple <a href="https://support.apple.com/fr-fr/102462" rel="noopener">Si vous ne parvenez pas à
        collaborer dans l’app Notes</a> et <a href="https://support.apple.com/fr-fr/guide/iphone/iphe4d04f674/ios" rel="noopener">Partager
        des notes et collaborer sur iPhone</a>.
      </p>

      <h2 id="mac">Commencer à collaborer sur Mac</h2>
      <Steps>
        <li>Ouvrez la note, puis cliquez sur le bouton Partager dans la barre d’outils.</li>
        <li>Cliquez sur le menu local et choisissez Partager un lien.</li>
        <li>Cliquez sur « Seules les personnes choisies peuvent modifier le contenu » pour choisir qui peut y accéder, et Modifications autorisées ou Affichage et téléchargement.</li>
        <li>Envoyez le lien comme vous voulez. Pour partager tout un dossier, cliquez dessus en maintenant la touche Contrôle enfoncée et choisissez Partager le dossier.</li>
      </Steps>
      <p>
        Si un bouton Mettre à niveau se trouve à côté d’iCloud dans la barre latérale de Notes, vos notes iCloud ne sont pas mises à niveau,
        et Apple dit que vous ne pouvez pas ajouter de personnes à vos notes tant que vous ne l’avez pas fait. Les notes mises à niveau ne
        s’ouvrent pas sur les appareils antérieurs à OS X 10.11 ou iOS 9.
      </p>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notes sur macOS 27 sans iCloud : Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Boutons System Settings et Cancel."
        caption="Ce que Notes affiche sur un Mac où iCloud est désactivé pour Notes (en français : Activer iCloud). Activez-le avant de partager." />
      <Paths rows={[
        { on: "Mac, macOS 15 ou ultérieur", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes"] },
      ]} />

      <h2 id="impossible-d-ouvrir">Quand vous n’arrivez pas à ouvrir une note partagée avec vous</h2>
      <ul>
        <li><strong>Ouvrez-la depuis le lien.</strong> Sur Mac, cliquez sur le lien reçu, puis sur Ouvrir. Sur icloud.com/notes, sélectionnez le lien, puis Accepter l’invitation. Après la première fois, la note reste dans votre liste de notes sur chaque iPhone et chaque Mac connectés au même compte Apple.</li>
        <li><strong>Vérifiez l’adresse où elle a été envoyée.</strong> Vous ne pouvez ouvrir une note partagée que si l’adresse e-mail ou le numéro de téléphone qui a reçu l’invitation est associé à votre compte Apple. Notes vous propose de l’ajouter, et sur Mac, Réglages Système y envoie d’abord un lien de vérification. Ou demandez au propriétaire de renvoyer l’invitation à l’adresse que vous utilisez.</li>
        <li><strong>Mettez l’appareil à jour.</strong> Une note avec un tag, une mention ou un lien qui affiche le titre d’une autre note ne s’affiche que sous iOS 14.5, macOS 11.3 ou une version ultérieure. Sur les appareils plus anciens, elle est masquée, pour vous et pour tous ceux avec qui elle est partagée.</li>
        <li><strong>Demandez au propriétaire.</strong> Quand le propriétaire arrête le partage, Apple dit que la note est supprimée des appareils des autres participants.</li>
      </ul>

      <h2 id="pas-de-mise-a-jour">Quand elle s’ouvre mais ne se met pas à jour</h2>
      <p>
        Le guide Mac d’Apple dit que les participants qui ont activé l’identification à deux facteurs et le trousseau iCloud voient
        immédiatement les modifications des autres. Une note partagée est stockée dans l’iCloud de son propriétaire : quand son stockage est
        plein, Notes sur Mac dit que vos modifications sont enregistrées sur votre appareil et seront envoyées dès que le propriétaire aura
        libéré de l’espace. <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">Notes ne se synchronise pas</a> donne le reste des
        vérifications de synchronisation.
      </p>

      <h2 id="pinto-notes">Partager une note dans Pinto Notes</h2>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="La fiche de partage de Pinto Notes sur iPhone : Emil comme propriétaire, Sara qui peut modifier et Jonas qui peut consulter, un bouton Invite People, et Join by Link réglé sur Can edit."
        caption="Share, puis Collaborate, dans Pinto Notes sur iPhone." />
      <p>
        Pinto Notes, une app de notes qui ressemble à Notes et fonctionne comme lui sur iPhone et Mac, partage une note avec un lien. Sur
        iPhone, touchez Share, puis Collaborate, puis Invite People, et envoyez le lien comme vous voulez. Join by Link décide si le lien
        permet de modifier ou seulement de consulter, et Off veut dire que seules les personnes déjà dans la note peuvent l’ouvrir. Le
        curseur de chacun s’affiche dans la note avec son nom pendant qu’il tape, et la note est chiffrée avec sa propre clé. Si quelqu’un
        dans la note a <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> (en anglais), son IA peut y écrire aussi,
        avec une marque qui dit à qui elle appartient.
      </p>
      <p>
        Il a ses propres limites. Tout le monde y écrit depuis Pinto Notes sur iPhone ou Mac ; quelqu’un qui ouvre le lien sans l’app
        apprend comment l’installer et rejoindre la note. Une note qui contient des fichiers, des photos ou une app ne peut pas encore être
        partagée, et une note partagée ne peut pas être verrouillée.{" "}
        <a href="/blog/share-a-note-and-edit-it-together">Share a note and edit it together</a> (en anglais) donne les détails. Vos notes
        Apple arrivent en un seul import sur votre Mac (<a href="/blog/move-from-apple-notes">passer de Notes à Pinto Notes</a>, en anglais),
        et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
