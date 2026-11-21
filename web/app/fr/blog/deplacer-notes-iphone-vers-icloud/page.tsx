import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure, Steps } from "@/lib/PostParts";
import s from "@/lib/post-parts.module.css";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "deplacer-notes-iphone-vers-icloud");

// French version of /blog/move-apple-notes-to-icloud (language pilot, 17 Nov 2026). Apple's own French words for
// every menu, button and setting, all read on 17 Nov: support.apple.com/fr-fr/118442 ("Utilisation de Notes":
// bouton Plus, Sélectionner les notes, bouton Dossier), support.apple.com/fr-fr/102537 (Afficher la note,
// Retirer, IMAP), support.apple.com/fr-fr/102476 (Corbeille dans Mail), support.apple.com/fr-fr/108770 (sauvegarde
// iCloud), the iPhone guide support.apple.com/fr-fr/guide/iphone/iph7262fd4fe/ios (Sur mon iPhone, Comptes
// Notes, Tout voir), ipha61270292/ios (Déplacer) and iph92579feda/ios (Compte par défaut), and the Mac guide
// support.apple.com/fr-fr/guide/notes/notc3b2d538b/mac (comptes et dossiers), not85d6f7b58/mac (Activer le compte
// « Sur mon Mac »), apd8b73d28be/mac (Présentation, Afficher la barre latérale) and apd97da26aed/mac (Compte par
// défaut). Déplacer vers and the IMAP and On My Mac messages are the French strings in Notes' Localizable.loctable
// on macOS 27.2. Search words: Google's French suggestions give "déplacer notes iphone vers icloud" and
// "transferer notes iphone vers icloud". Facts are the English post's; the screenshots are its English ones,
// described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Pourquoi certaines de mes notes sont-elles dans Sur mon iPhone ?", a: [
    "Sur mon iPhone est un compte pour les notes gardées uniquement sur ce téléphone. Il apparaît une fois activé dans Réglages, Apps, Notes, et les nouvelles notes créées par Siri ou par le widget Notes vont dans le compte choisi comme Compte par défaut à cet endroit.",
  ] },
  { q: "Déplacer mes notes vers iCloud les retire-t-il de mon iPhone ?", a: [
    "Non. Les notes iCloud restent sur votre iPhone et apparaissent aussi sur chaque autre appareil connecté au même compte Apple avec Notes activé pour iCloud.",
  ] },
  { q: "Puis-je déplacer mes notes Gmail vers iCloud ?", a: [
    "Oui. Les notes Gmail apparaissent comme un compte à part dans Notes, et on les déplace dans un dossier iCloud de la même façon que les notes de Sur mon iPhone. Ensuite, vous pouvez désactiver Notes pour le compte Gmail.",
  ] },
  { q: "Pourquoi ne puis-je pas verrouiller mes notes Gmail ?", a: [
    "Apple dit que les notes synchronisées par IMAP, avec des comptes comme Gmail et Yahoo, ne peuvent pas être verrouillées. Une fois la note dans iCloud, vous pouvez la verrouiller, sauf si elle a des tags ou un fichier joint, comme un PDF ou un enregistrement.",
  ] },
];

const AFTER = [
  "Choisir iCloud comme compte par défaut, pour que Siri et le widget arrêtent d’utiliser l’ancien",
  "Ouvrir quelques notes déplacées et vérifier la mise en forme, les pièces jointes et les dessins",
  "Verrouiller à nouveau les notes déverrouillées pour le déplacement",
  "Désactiver Notes pour le compte Gmail, ou Sur mon Mac, une fois vide",
];
const AFTER_TITLE = "Après le déplacement vers iCloud";

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="deplacer-notes-iphone-vers-icloud"
      intro={<>Certaines de vos notes sont sous Sur mon iPhone ou Gmail, et n’apparaissent donc jamais sur vos autres appareils. Les déplacer vers iCloud demande quelques touches sur iPhone, ou un seul glisser sur Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#ou-sont-vos-notes", label: "Où sont vos notes" },
          { href: "#avant", label: "Ce qui peut se perdre" },
          { href: "#iphone", label: "Sur iPhone" },
          { href: "#mac", label: "Sur Mac" },
          { href: "#gmail", label: "Notes Gmail" },
          { href: "#apres", label: "Après le déplacement" },
        ]}>
          <p>
            Sur iPhone, ouvrez le dossier sous Sur mon iPhone ou Gmail, touchez le bouton Plus, puis Sélectionner les notes, choisissez les
            notes, touchez le bouton Dossier et choisissez un dossier sous iCloud. Sur Mac, faites glisser les notes sur un dossier iCloud
            dans la barre latérale, en maintenant la touche Option pour les copier au lieu de les déplacer. Retirez d’abord le verrouillage
            des notes verrouillées, et faites ensuite d’iCloud le compte par défaut, sinon les nouvelles notes continuent d’arriver dans
            l’ancien.
          </p>
          <PostCta slug="fr/deplacer-notes-iphone-vers-icloud" path="/fr/blog/deplacer-notes-iphone-vers-icloud" position="answer" ui={ui.cta}
            title="Des notes sans comptes à trier">
            <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac : vous vous connectez une fois, et chaque note se synchronise entre vos appareils. Il importe vos notes Apple en une étape, sans les modifier.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="ou-sont-vos-notes">Voir où sont vos notes</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="La liste des dossiers dans Notes sur iPhone avec iOS 27 : Quick Notes et Shared en haut, puis une rubrique iCloud avec ses dossiers, et Tags en dessous."
        caption="La rubrique au-dessus d’un dossier, ici iCloud, est le compte où se trouvent ses notes. Image : Apple." />
      <p>
        Notes regroupe les dossiers par compte, sous des rubriques comme iCloud, Sur mon iPhone et Gmail. La rubrique sous laquelle se
        trouve une note décide si elle arrive sur vos autres appareils : seules les notes iCloud y arrivent, avec toutes les
        fonctionnalités.
      </p>
      <p>Sur iPhone, revenez à la liste des dossiers dans Notes. Sur Mac, les mêmes groupes sont dans la barre latérale. Si elle est masquée :</p>
      <Paths rows={[
        { on: "Mac, macOS 27", steps: ["Présentation", "Afficher la barre latérale"] },
        { on: "Mac, macOS 26", steps: ["Présentation", "Afficher les dossiers"] },
      ]} />
      <p>S’il n’y a aucune rubrique iCloud, Notes est désactivé pour iCloud. Activez-le ici :</p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir", "Notes"] },
        { on: "iPhone, iOS 26", steps: ["Réglages", "Votre nom", "iCloud", "Notes"] },
      ]} />
      <p>
        Si vos notes sont déjà sous iCloud et n’arrivent toujours pas sur vos autres appareils, le problème est ailleurs :{" "}
        <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">Notes ne se synchronise pas entre iPhone et Mac</a> vous aide à le trouver.
      </p>

      <h2 id="avant">Avant de déplacer quoi que ce soit : ce qui peut se perdre</h2>
      <p>
        Le <a href="https://support.apple.com/fr-fr/guide/notes/notc3b2d538b/mac" rel="noopener">guide d’Apple</a> prévient qu’en
        déplaçant des notes d’un compte à un autre, vous pouvez perdre leur mise en forme et leurs pièces jointes. Gardez donc les
        originaux jusqu’à ce que vous ayez vérifié les notes déplacées.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Dans la note</th><th scope="col">Ce que dit Apple</th><th scope="col">Quoi faire d’abord</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Mise en forme et pièces jointes</th><td>Peuvent être perdues pour de bon pendant le déplacement</td><td>Sur Mac, maintenez la touche Option en faisant glisser : Notes copie au lieu de déplacer</td></tr>
            <tr><th scope="row">Dessins</th><td>Peuvent devenir des fichiers image qu’on ne peut plus modifier comme des dessins</td><td>Pareil : copiez d’abord, puis vérifiez</td></tr>
            <tr><th scope="row">Un verrouillage</th><td>Les notes verrouillées ne se déplacent qu’entre iCloud et le compte de votre Mac, et il faut parfois les déverrouiller d’abord</td><td>Retirez le verrouillage, déplacez la note, verrouillez-la à nouveau dans iCloud</td></tr>
            <tr><th scope="row">Le partage</th><td>Seules les notes iCloud peuvent être partagées, donc une note partagée y est déjà</td><td>Rien</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Le guide d’Apple pour l’iPhone ne décrit que le déplacement, sans moyen de copier. Sur iPhone, faites donc d’abord une
        sauvegarde : les notes de Sur mon iPhone font partie de la sauvegarde de votre iPhone.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="Le menu Plus d’une note déverrouillée dans Notes sur iPhone, avec Remove mis en avant en haut, à côté de Scan et Pin Note."
        caption="Déverrouillez la note, puis Plus, Retirer, avant de la déplacer. Image : Apple." />
      <p>
        Pour retirer le verrouillage d’une note sur iPhone, touchez la note verrouillée, touchez Afficher la note et déverrouillez-la, puis
        touchez le bouton Plus et choisissez Retirer. Chaque compte peut avoir son propre mot de passe pour les notes. Si vous avez perdu
        le mot de passe d’une note verrouillée, personne ne peut l’ouvrir, et <a href="/fr/blog/mot-de-passe-notes-iphone-oublie">que
        faire si vous avez oublié le mot de passe de Notes</a> explique pourquoi.
      </p>
      <p>
        Encore une chose si vous utilisez deux comptes Apple : le guide Mac d’Apple dit qu’une note partagée ne peut se déplacer qu’entre
        les dossiers d’un même compte iCloud.
      </p>

      <h2 id="iphone">Déplacer des notes sur iPhone</h2>
      <Steps>
        <li>
          <strong>Ouvrez le dossier qui contient les notes</strong>
          Par exemple Notes sous Sur mon iPhone, ou Notes sous Gmail.
        </li>
        <li>
          <strong>Touchez le bouton Plus, puis Sélectionner les notes</strong>
          Touchez chaque note à déplacer.
        </li>
        <li>
          <strong>Touchez le bouton Dossier et choisissez un dossier sous iCloud</strong>
          Les notes quittent l’ancien compte et apparaissent dans ce dossier.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notes sur iPhone avec iOS 27 en mode sélection : 3 Selected, trois notes cochées, et un bouton Dossier en bas à gauche pour les déplacer."
        caption="Sélectionner les notes, puis le bouton Dossier en bas à gauche. Image : Apple." />
      <p>
        Pour une seule note, maintenez le doigt dessus, touchez Déplacer et choisissez le dossier. Pour faire passer un dossier entier,
        créez un dossier du même nom sous iCloud et déplacez-y ses notes.
      </p>

      <h2 id="mac">Déplacer des notes sur Mac</h2>
      <Steps>
        <li>
          <strong>Sélectionnez les notes dans la liste</strong>
          Elles peuvent venir de Sur mon Mac, de Gmail ou de n’importe quel autre compte de la barre latérale.
        </li>
        <li>
          <strong>Faites-les glisser sur un dossier sous iCloud dans la barre latérale, ou faites un Contrôle-clic et choisissez Déplacer vers</strong>
          Maintenez la touche Option au moment de déposer pour obtenir des copies et garder les originaux.
        </li>
      </Steps>
      <PostFigure src="/blog/macos27/notes27-note-context-move-to-submenu" width={1416} height={960} maxWidth={600}
        alt="Notes sur macOS 27 : un Contrôle-clic sur une note, Move to, et la liste des dossiers où la déplacer."
        caption="Pas besoin de faire glisser : Contrôle-clic sur une note, Déplacer vers, puis le dossier." />
      <p>
        Sur mon Mac est le compte local du Mac, comme Sur mon iPhone. Une fois qu’il est vide, vous pouvez le désactiver en décochant
        Activer le compte « Sur mon Mac » dans Notes, Réglages. Notes refuse de le désactiver tant qu’il contient des notes, et vous demande
        d’abord de les déplacer ou de les supprimer.
      </p>

      <h2 id="gmail">Les notes Gmail sont à part</h2>
      <p>
        Les notes d’un compte Gmail sont gardées dans votre compte Google et se synchronisent avec Notes par IMAP, le protocole qu’utilise
        Mail. Apple dit que beaucoup de fonctionnalités de Notes n’y marchent pas. En pratique :
      </p>
      <ul>
        <li>Elles ne peuvent pas être verrouillées.</li>
        <li>Sous macOS 26, Notes refuse les tags et l’épinglage dans un compte IMAP, avec un message qui dit qu’ils ne sont pas pris en charge.</li>
        <li>Quand vous en supprimez une, Gmail la garde en général dans la Corbeille de ce compte dans l’app Mail, et pas dans Suppressions récentes.</li>
      </ul>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Les réglages d’un compte Gmail sur iPhone, avec des interrupteurs pour Mail, Contacts, Calendars et Notes, tous activés."
        caption="Désactivez Notes ici une fois que le compte Gmail ne contient plus de notes. Mail continue de marcher. Image : Apple." />
      <p>
        Apple dit que les notes déplacées d’un autre compte vers iCloud peuvent utiliser toutes les fonctionnalités. Pour que le compte
        Gmail arrête de synchroniser des notes une fois vide, désactivez Notes pour ce compte. Mail continue de marcher, et les notes qui
        restent dans Gmail restent dans votre compte Google.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Réglages", "Apps", "Notes", "Comptes Notes", "Gmail", "Notes"] },
      ]} />

      <h2 id="apres">Après le déplacement</h2>
      <p>Quatre choses, et la première est celle qu’on oublie.</p>
      <Keep title={AFTER_TITLE} text={[AFTER_TITLE, ...AFTER].join("\n")} copyLabel={ui.copy}
        note="Copier vous donne des lignes simples. Dans Notes, sélectionnez-les et touchez le bouton Liste de pointage.">
        <ul className={s.ticks}>{AFTER.map((it) => <li key={it}>{it}</li>)}</ul>
      </Keep>
      <p>Le compte par défaut se règle ici :</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Réglages", "Apps", "Notes", "Compte par défaut"] },
        { on: "Mac", steps: ["Notes", "Réglages", "Compte par défaut"] },
      ]} />
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Les réglages généraux de Notes sur un Mac sous macOS 26 : Sort notes by Date Edited, New notes start with Title, et Default account réglé sur iCloud, que Siri utilise pour créer des notes." }}
        ground="sky" caption="Notes, Réglages sur un Mac sous macOS 26. Le compte par défaut (Default account, en anglais sur la capture) est celui où arrivent les nouvelles notes, et Notes précise que Siri l’utilise pour créer des notes." />
      <p>
        Le déplacement change aussi ce que contient la <a href="https://support.apple.com/fr-fr/108770" rel="noopener">sauvegarde iCloud</a> de
        votre iPhone. Les notes de Sur mon iPhone en font partie, et Apple laisse de côté les notes déjà stockées dans iCloud. Supprimer
        une note dans iCloud la retire de tous vos appareils après 30 jours dans Suppressions récentes, donc gardez aussi votre propre
        copie.
      </p>

      <h2 id="pinto-notes">Une app de notes sans comptes à trier</h2>
      <Figure shot={{ ...SHOTS.consent, alt: "Pinto Notes demande « Allow ChatGPT to use your notes? » : les notes que ChatGPT ouvre vont chez OpenAI, les notes verrouillées restent privées, un numéro à comparer, et les boutons Allow et Don't Allow." }}
        caption="Une IA n’a accès à vos notes qu’après votre accord, sur votre appareil." />
      <p>
        Pinto Notes, l’app de notes pour iPhone et Mac que je fais, n’a ni Sur mon iPhone ni comptes de messagerie. Vous vous connectez
        une fois, et chaque note se synchronise entre vos appareils. ChatGPT et Claude peuvent lire et modifier ces notes une fois que vous
        les avez autorisés.
      </p>
      <p>
        Il ne range pas Notes à votre place, et il n’a pas de version Windows, Android ou web. Passer de Notes à Pinto Notes demande un
        seul import sur votre Mac, et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
