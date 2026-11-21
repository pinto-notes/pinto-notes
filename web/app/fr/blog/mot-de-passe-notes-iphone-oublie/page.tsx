import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, FigurePair, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "mot-de-passe-notes-iphone-oublie");

// French version of /blog/forgot-apple-notes-password (language pilot, 17 Nov 2026). Apple's own French words
// for every menu and button, from support.apple.com/fr-fr/102537 ("Comment verrouiller ou déverrouiller des notes
// sur votre iPhone", read 17 Nov), support.apple.com/fr-fr/guide/notes/apdb021fd5a9/mac ("Modifier le mot de passe
// pour des notes verrouillées", read 17 Nov) and support.apple.com/fr-fr/guide/notes/apd97da26aed/mac ("Modifier
// les réglages dans Notes sur Mac", read 17 Nov). The search words are Google's French suggestions for "mot de
// passe notes": "mot de passe notes iphone oublié" comes first. The English post's chooser is left out.
// Facts are the English post's; the screenshots are its English ones, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Apple peut-elle récupérer mes notes verrouillées si j’oublie le mot de passe ?", a: [
    "Non. Apple dit ne pas avoir accès aux notes verrouillées et ne pas pouvoir vous aider à les ouvrir si vous oubliez le mot de passe de vos notes. Les notes verrouillées sont chiffrées avec une clé tirée de ce mot de passe.",
  ] },
  { q: "Réinitialiser le mot de passe de Notes déverrouille-t-il mes anciennes notes ?", a: [
    "Non. La réinitialisation vous permet de verrouiller de nouvelles notes avec un nouveau mot de passe. Les notes verrouillées avant gardent l’ancien mot de passe, et il faut toujours celui-là pour les ouvrir.",
  ] },
  { q: "Puis-je ouvrir une note verrouillée avec Face ID ou Touch ID ?", a: [
    "Essayez : si vous avez activé Face ID ou Touch ID pour Notes, Apple l’indique comme un moyen d’afficher une note verrouillée. Cela fonctionne aussi pour Modifier le mot de passe : si Face ID ouvre encore vos notes, vous pouvez en choisir un nouveau sans vous souvenir de l’ancien.",
  ] },
  { q: "Les apps qui promettent de déverrouiller Notes fonctionnent-elles ?", a: [
    "Elles ne peuvent pas déchiffrer une note verrouillée sans son mot de passe. La clé est tirée du mot de passe, donc un outil ne peut au mieux que deviner. Méfiez-vous de tout ce qui vous demande le mot de passe de votre compte Apple pour le faire.",
  ] },
  { q: "Comment éviter que ça recommence ?", a: [
    "Utilisez le code de votre appareil au lieu d’un mot de passe à part (iOS 16 ou ultérieur, avec le trousseau iCloud activé), ou gardez le mot de passe de vos notes dans un gestionnaire de mots de passe.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="mot-de-passe-notes-iphone-oublie"
      intro={<>Vous avez oublié le mot de passe de vos notes verrouillées sur iPhone ou sur Mac ? Voici ce qui vaut la peine d’être essayé, dans l’ordre où je le ferais, et la seule chose à ne pas faire en premier.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#essayer-d-abord", label: "À essayer d’abord" },
          { href: "#reinitialiser-iphone", label: "Réinitialiser sur iPhone" },
          { href: "#reinitialiser-mac", label: "Réinitialiser sur Mac" },
          { href: "#la-prochaine-fois", label: "Éviter que ça recommence" },
        ]}>
          <PostFigure src="/blog/macos27/notes-locked-hint" width={720} height={580} maxWidth={360}
            alt="Une note verrouillée dans Notes sur macOS 27 qui demande le mot de passe, avec l’indice City and year of the trip sous le champ."
            caption="Après un mauvais mot de passe, Notes affiche l’indice que vous avez choisi." />
          <p>
            Personne ne peut ouvrir une note verrouillée sans son mot de passe : ni Apple, ni une app de déverrouillage. Essayez d’abord
            Face ID ou Touch ID, l’indice et le code de votre appareil. Si rien ne marche, réinitialisez le mot de passe. Il ne change
            que pour les notes que vous verrouillerez à partir de maintenant, et les anciennes gardent l’ancien mot de passe.
          </p>
          <PostCta slug="fr/mot-de-passe-notes-iphone-oublie" path="/fr/blog/mot-de-passe-notes-iphone-oublie" position="answer" ui={ui.cta}
            title="Des notes qui ne restent jamais enfermées ?">
            <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac, garde chaque version de chaque note, et ChatGPT ou Claude peuvent travailler dans vos notes. Il importe vos notes Apple en une étape.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760}
        phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }}
        alt="La fenêtre de Notes sur macOS 27 avec une note verrouillée sélectionnée : This note is locked. Enter your notes password to view this note. Sous le champ du mot de passe : Hint: City and year of the trip."
        caption="Une note verrouillée dans Notes sur macOS 27, après quelques essais ratés. L’indice apparaît sous le champ du mot de passe. L’iPhone l’affiche de la même façon." />}
      faq={FAQ}
    >
      <h2 id="pourquoi">Pourquoi personne ne peut l’ouvrir à votre place</h2>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300}
        alt="Une note verrouillée sur iPhone : un cadenas gris, la phrase This note is locked et un bouton View Note."
        caption="Une note verrouillée sur iPhone. Image : Apple." />
      <p>
        Une note verrouillée est chiffrée avec une clé tirée du mot de passe de vos notes. Le guide de sécurité d’Apple le décrit ainsi :
        la clé est dérivée de votre phrase secrète, et la note et ses pièces jointes sont chiffrées avec elle. Apple
        dit <a href="https://support.apple.com/fr-fr/102537" rel="noopener">ne pas avoir accès aux notes verrouillées</a> et ne pas
        pouvoir vous aider si vous oubliez le mot de passe. C’est tout l’intérêt du verrouillage, et c’est aussi pour ça que la
        réinitialisation ne rend pas les anciennes notes.
      </p>

      <h2 id="essayer-d-abord">À essayer d’abord</h2>
      <Steps>
        <li>
          <strong>Face ID ou Touch ID</strong>
          Si vous l’avez activé pour Notes, ouvrez la note verrouillée, touchez Afficher la note et utilisez-le. Apple l’indique comme un
          moyen d’afficher une note verrouillée.
        </li>
        <li>
          <strong>L’indice</strong>
          Saisissez deux fois un mauvais mot de passe et Notes affiche l’indice que vous avez choisi, si vous en avez mis un.
        </li>
        <li>
          <strong>Le code de l’iPhone ou le mot de passe de connexion du Mac</strong>
          Depuis iOS 16, on peut verrouiller les notes avec le code de l’appareil au lieu d’un mot de passe à part. Si vous avez fait ce
          choix, utilisez le code de votre iPhone, ou le mot de passe de connexion de votre Mac sur le Mac.
        </li>
        <li>
          <strong>Vos anciens mots de passe</strong>
          Si vous avez déjà réinitialisé le mot de passe de vos notes, les notes plus anciennes gardent celui avec lequel elles ont été
          verrouillées. Si vous saisissez le mot de passe actuel sur une ancienne note, Notes vous dit qu’il est erroné et affiche
          l’indice de l’ancien.
        </li>
        <li>
          <strong>Un gestionnaire de mots de passe</strong>
          Si vous en utilisez un, cherchez &laquo; notes &raquo; dedans : vous y avez peut-être enregistré le mot de passe quand vous l’avez créé.
        </li>
      </Steps>
      <p>
        Ne réinitialisez pas en premier. La réinitialisation est sans danger et n’efface rien, mais une fois que vous avez deux mots de
        passe, il devient plus difficile de savoir quelle note demande lequel.
      </p>

      <h2 id="ce-que-fait-chaque-option">Ce que permet chaque option</h2>
      <PostFigure src="/blog/drawn/pw-keys" width={1200} height={750} maxWidth={560}
        alt="Un cadenas orange dessiné, entouré de trois façons de l’ouvrir : un scan du visage, six points de code et un champ de mot de passe."
        caption="Trois façons d’entrer : Face ID, votre code, ou le mot de passe des notes lui-même." />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Ouvre les anciennes notes verrouillées ?</th><th scope="col">Bon à savoir</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Face ID ou Touch ID</th><td>Oui, s’il était activé pour Notes</td><td>Fonctionne aussi pour Modifier le mot de passe, qui passe toutes les notes au nouveau</td></tr>
            <tr><th scope="row">L’indice</th><td>Seulement en vous rafraîchissant la mémoire</td><td>Apparaît après deux essais ratés, si vous en avez mis un</td></tr>
            <tr><th scope="row">Code de l’appareil</th><td>Oui, pour les notes verrouillées avec lui</td><td>Possible depuis iOS 16, avec le trousseau iCloud activé</td></tr>
            <tr><th scope="row">Réinitialiser le mot de passe</th><td>Non</td><td>Définit un mot de passe pour les notes que vous verrouillerez désormais</td></tr>
            <tr><th scope="row">L’assistance Apple</th><td>Non</td><td>Apple n’a pas accès aux notes verrouillées</td></tr>
            <tr><th scope="row">Les apps de déverrouillage</th><td>Non</td><td>Elles ne peuvent que deviner des mots de passe</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="reinitialiser">Réinitialiser le mot de passe (pour les nouvelles notes)</h2>
      <p>
        Si rien de tout ça ne marche, réinitialisez-le pour pouvoir continuer à verrouiller de nouvelles notes. Les anciennes notes
        verrouillées restent telles quelles, et s’ouvrent toujours avec l’ancien mot de passe si un jour il vous revient.
      </p>
      <p className="label" id="reinitialiser-iphone"><strong>Sur iPhone</strong></p>
      <Steps>
        <li>Ouvrez Réglages, touchez Apps, puis Notes, puis Mot de passe.</li>
        <li>Choisissez le compte, puis touchez Réinitialiser le mot de passe.</li>
        <li>Saisissez le mot de passe de votre compte Apple et touchez OK, puis touchez à nouveau Réinitialiser le mot de passe.</li>
        <li>Choisissez le code de votre appareil, ou saisissez un nouveau mot de passe et un indice, puis touchez OK.</li>
      </Steps>
      <p className="label" id="reinitialiser-mac"><strong>Sur Mac</strong></p>
      <Steps>
        <li>Dans Notes, choisissez Notes, Réglages, puis Réinitialiser le mot de passe, et cliquez sur OK.</li>
        <li>Saisissez le mot de passe que Notes demande. Lors de mon test sur macOS 27, c’était le mot de passe de connexion du Mac ; le guide d’Apple indique qu’un compte iCloud peut demander votre mot de passe iCloud.</li>
        <li>Cliquez à nouveau sur Réinitialiser le mot de passe, saisissez deux fois le nouveau mot de passe et un indice, puis cliquez sur Définir un mot de passe.</li>
      </Steps>
      <p>
        Les étapes viennent d’Apple : <a href="https://support.apple.com/fr-fr/102537" rel="noopener">Comment verrouiller ou
        déverrouiller des notes sur votre iPhone</a> et <a href="https://support.apple.com/fr-fr/guide/notes/apdb021fd5a9/mac"
        rel="noopener">Modifier le mot de passe pour des notes verrouillées</a> sur Mac. Si vous connaissez encore le mot de passe et
        voulez juste en changer, choisissez plutôt Modifier le mot de passe : toutes les notes verrouillées passent alors au nouveau, et
        vous ne vous retrouvez pas avec deux.
      </p>
      <Capture src="/blog/macos27/notes27-reset-password-confirm" width={1148} height={1420} maxWidth={420}
        alt="Notes sur macOS 27 demande Reset Notes Password? et explique que le nouveau mot de passe sert aux notes que vous verrouillerez à partir de maintenant, et que les notes qui ont déjà un mot de passe ne changent pas. Boutons Cancel et OK."
        caption="Apple le dit clairement quand vous réinitialisez sur macOS 27 : les notes qui ont déjà un mot de passe ne changent pas." />

      <h2 id="test">Je l’ai réinitialisé sur un Mac de test, pour que vous n’ayez pas à le faire</h2>
      <p>
        J’ai verrouillé une note avec un mot de passe, je l’ai réinitialisé, puis j’en ai défini un nouveau. Ensuite, j’ai ouvert
        l’ancienne note. Le nouveau mot de passe n’a pas marché, et l’indice affiché était l’ancien. Cet indice est votre meilleure
        piste : c’est celui que vous avez écrit pour le mot de passe que vous avez oublié.
      </p>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-after-reset-old-note-rejects-new-password", width: 2000, height: 1320,
          alt: "Une note verrouillée avant la réinitialisation, dans Notes sur macOS 27 : That's not the correct password for this note. Try a different password. L’indice affiché est toujours l’ancien." },
        { src: "/blog/macos27/notes27-old-password-update-prompt", width: 2000, height: 1320,
          alt: "La même note ouverte avec l’ancien mot de passe : Update password? This note is using an old password. Notes propose de passer toutes les notes qui l’utilisent au mot de passe actuel, avec les boutons Update Password et Not Now." },
      ]} caption="Après une réinitialisation, l’ancienne note refuse le nouveau mot de passe et affiche son ancien indice. Tapez l’ancien, et Notes propose de passer toutes ces notes à votre mot de passe actuel." />
      <p>
        Une réinitialisation ne fait donc rien perdre. Si l’ancien mot de passe vous revient plus tard, Notes propose de mettre à jour en
        une étape toutes les notes qui l’utilisent encore.
      </p>

      <h2 id="apps-de-deverrouillage">À propos des apps de déverrouillage</h2>
      <PostFigure src="/blog/drawn/pw-guess" width={1200} height={750} maxWidth={560}
        alt="Un cadenas orange dessiné à côté d’un tas de clés et d’un point d’interrogation."
        caption="Une app de déverrouillage ne peut que deviner, une clé après l’autre." />
      <p>
        Les résultats de recherche sont pleins d’apps qui promettent de déverrouiller Notes. Aucune ne peut déchiffrer une note verrouillée
        sans son mot de passe ; au mieux, elles essaient des mots de passe à votre place. Si l’une d’elles vous demande le mot de passe de
        votre compte Apple ou votre sauvegarde, réfléchissez bien à ce que vous lui confiez.
      </p>

      <h2 id="la-prochaine-fois">Pour que ça ne se reproduise pas</h2>
      <ul>
        <li>Passez au code de votre appareil : Réglages, Apps, Notes, Mot de passe, Utiliser le code de l’appareil. Il faut que le trousseau iCloud soit activé. Sur Mac, le même choix s’appelle Utiliser le mot de passe de connexion, dans le menu Notes verrouillées de Notes, Réglages.</li>
        <li>Ou gardez le mot de passe de vos notes dans un gestionnaire de mots de passe.</li>
        <li>Activez Face ID ou Touch ID pour Notes, pour n’avoir presque jamais à le taper.</li>
        <li>Déverrouillez et exportez tout ce que vous ne pouvez pas vous permettre de perdre, et gardez-en une copie en lieu sûr.</li>
      </ul>
      <Capture src="/blog/macos27/notes-create-password" width={1006} height={622} maxWidth={503}
        alt="La création d’un mot de passe pour les notes dans Notes sur macOS 27 : les champs Password, Verify et Password Hint, et l’avertissement que si vous oubliez ce mot de passe, vous ne pourrez plus voir vos notes verrouillées."
        caption="Si vous choisissez un mot de passe à part, remplissez l’indice. C’est le seul indice que Notes vous donnera plus tard." />

      <h2 id="pinto-notes">Si vous passez à une autre app</h2>
      <p>
        On ne peut pas lire une note verrouillée sans son mot de passe, donc les outils d’export et d’import la laissent de côté. Y compris
        l’import depuis Notes de Pinto Notes : déverrouillez d’abord les notes dont vous avez besoin, sinon elles restent dans Notes.
      </p>
      <p>
        Pinto Notes, l’app de notes pour iPhone et Mac, a aussi des notes verrouillées, et elles fonctionnent de la même façon :
        chiffrées avec le mot de passe de vos notes sur votre appareil, illisibles pour nous et pour toute IA que vous connectez, et
        impossibles à récupérer si vous oubliez le mot de passe. L’app vous le dit quand vous en créez un. Tout le reste dans Pinto Notes
        est aussi chiffré sur vos appareils, et ChatGPT et Claude peuvent quand même utiliser vos autres notes une fois que vous les
        autorisez. L’app est en anglais.
      </p>
      <Figure shot={{ ...SHOTS.notesPassword, alt: "Pinto Notes sur un Mac : Create a password for your locked notes, avec les champs Password, Verify et Hint, et l’avertissement que si vous oubliez ce mot de passe, vos notes verrouillées ne pourront pas être récupérées, pas même par nous." }}
        caption="Créer le mot de passe des notes dans Pinto Notes sur un Mac. Comme celui d’Apple, il ne se récupère pas si vous l’oubliez." />
    </LocalPostPage>
  );
}
