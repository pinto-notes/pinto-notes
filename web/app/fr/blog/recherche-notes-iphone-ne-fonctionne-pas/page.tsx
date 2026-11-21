import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "recherche-notes-iphone-ne-fonctionne-pas");

// French version of /blog/apple-notes-search-not-working (batch 3, 21 Nov 2026). Apple's own French words, all read on
// 21 Nov 2026: support.apple.com/fr-fr/guide/iphone/iphb8628c6b8/ios ("Effectuer des recherches dans des notes sur
// l'iPhone": tags, texte saisi ou manuscrit dans les langues prises en charge, objets dans les images, texte des documents
// scannés; seul le titre d'une note verrouillée; « Rechercher dans la note », « Inclure les pièces jointes »),
// support.apple.com/fr-fr/guide/notes/not18ab658ed/mac ("Rechercher vos notes sur Mac": corps, noms de fichiers des pièces
// jointes, PDF, dessins et texte manuscrit, contenu d'une image (« vélo »), documents numérisés; « Compte actuel » et « Tous
// les comptes » next to the magnifying glass, only with more than one account; langage naturel: « notes créées la semaine
// dernière », « modifiée aujourd'hui »; locked notes show their title only, even unlocked; Suppressions récentes in the
// results; Commande + F; Présentation > Afficher le navigateur de pièces jointes; Spotlight results can include notes;
// some features aren't available with other providers' accounts), support.apple.com/fr-fr/102476 (mettre à jour d'abord,
// Réglages > Apps > Notes > Comptes, Tous les comptes, faire défiler pour voir la barre de recherche, autres dossiers, le
// mot n'est peut-être pas le bon), support.apple.com/fr-fr/102321 (Spotlight reindexes after a software update, plusieurs
// heures, voire plusieurs jours, faster when idle, on power and on Wi-Fi; the Settings notification, the Mac progress
// indicator with Commande + Barre d'espace; Réglages > Recherche on iPhone; the partial rebuild under « Recherche et
// confidentialité » is for a disk or folder), support.apple.com/fr-fr/guide/mac-help/mchl54d95e8a/mac (« Résultats
// provenant d'apps »), mchlp2962/mac and mchlpx1065/mac (updates improve built-in apps such as Notes),
// support.apple.com/fr-fr/guide/iphone/iph3c511548/ios (Réglages > Rechercher, an app, « Afficher l'app dans Recherche »;
// 102321 calls the same item Recherche), iph92579feda/ios (the Recherche setting under Réglages > Apps > Notes),
// iph83bfec492/ios (sélecteur d'app, balayer l'app vers le haut), iph841379c3d/ios (éteindre et rallumer), iph3e504502/ios
// (Général > Mise à jour logicielle), iph7262fd4fe/ios (« Comptes Notes », Tout voir) and support.apple.com/fr-fr/102586
// (Commande + Q, Option + Commande + Échap, Forcer à quitter, menu Pomme > Redémarrer); Synchroniser cet iPhone is from
// 121669, as in notes-ne-se-synchronise-pas-iphone-mac. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov)
// give "recherche notes iphone", "recherche dans notes iphone", "rechercher notes iphone" and "rechercher dans notes";
// the "ne fonctionne pas" and "ne marche pas" phrasings return nothing yet, so the slug adds the plain French for "not
// working" to the suggested words. Facts are the English post's; the picture is Apple's own, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Pourquoi Notes ne trouve-t-il pas une note qui existe ?", a: [
    "Apple cite quatre raisons : la note est verrouillée, et la recherche ne voit que son titre ; la recherche ne porte que sur un compte au lieu de Tous les comptes ; Notes est désactivé pour le compte où se trouve la note ; ou le mot saisi n’est pas celui de la note. Une note qui n’est pas encore arrivée sur cet appareil ne peut pas apparaître non plus.",
  ] },
  { q: "Notes cherche-t-il dans les PDF et les documents scannés ?", a: [
    "Oui. Sur Mac, Apple cite les PDF joints, les noms de fichiers des pièces jointes, le texte des documents numérisés, les dessins et le texte manuscrit, et le contenu des images. Sur iPhone, la recherche couvre le texte manuscrit dans les langues prises en charge, les objets dans les images et les documents scannés. Dans une note, Rechercher dans la note avec Inclure les pièces jointes cherche aussi dans les PDF.",
  ] },
  { q: "Pourquoi mes notes n’apparaissent-elles pas dans Spotlight ?", a: [
    "Sur iPhone, ouvrez Réglages, touchez Rechercher, puis Notes, et vérifiez Afficher l’app dans Recherche. Le réglage Recherche dans Réglages, Apps, Notes décide aussi si le contenu de Notes apparaît dans la recherche. Sur Mac, les apps désactivées sous Résultats provenant d’apps, dans Réglages Système, Spotlight, n’apparaissent pas dans les résultats de Spotlight.",
  ] },
  { q: "Pourquoi la recherche de Notes ne marche plus depuis une mise à jour ?", a: [
    "Apple ne décrit aucun problème de recherche dans Notes lié aux mises à jour. Apple dit en revanche que Spotlight reconstruit son index après une mise à jour logicielle, et que cela peut prendre plusieurs heures, voire plusieurs jours. Son article sur les notes introuvables commence par mettre à jour tous les appareils, puis par chercher avec Tous les comptes sélectionné.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="recherche-notes-iphone-ne-fonctionne-pas"
      intro={<>Vous avez tapé un mot qui est forcément dans une note, et Notes ne trouve rien. La plupart du temps, la note est verrouillée, dans un autre compte, ou pas encore arrivée sur cet appareil. Voici les vérifications d’Apple, de la plus probable à la moins probable.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#ce-que-couvre-la-recherche", label: "Ce que couvre la recherche" },
          { href: "#verifications", label: "Les vérifications dans l’ordre" },
          { href: "#dans-une-note", label: "Dans une note ou un PDF" },
          { href: "#spotlight", label: "Spotlight" },
          { href: "#apres-une-mise-a-jour", label: "Après une mise à jour" },
        ]}>
          <p>
            Cherchez avec Tous les comptes sélectionné, et rappelez-vous qu’une note verrouillée n’apparaît que par son titre. Vérifiez
            ensuite que Notes est activé pour le compte où se trouve la note, et que la note est bien arrivée sur cet appareil. Si la
            recherche la rate encore, quittez et rouvrez Notes, redémarrez, puis mettez à jour vers la dernière version d’iOS ou de macOS.
          </p>
          <PostCta slug="fr/recherche-notes-iphone-ne-fonctionne-pas" path="/fr/blog/recherche-notes-iphone-ne-fonctionne-pas" position="answer" ui={ui.cta}
            title="Retrouver une note par son sujet ?">
            <p>Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et sa recherche lit chaque mot de chaque note. Connectez ChatGPT ou Claude et vous pouvez lui demander de retrouver une note par son sujet.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-search-results" width={760} height={894} maxWidth={300}
        alt="Notes sur iPhone avec la recherche Home : un meilleur résultat, Home renovation project, une autre note, Kitchen remodel ideas, avec le tag #Home, et aucune pièce jointe trouvée."
        caption="La recherche de Notes sur iPhone, avec les meilleurs résultats, les notes et les pièces jointes. Image : Apple." />}
      faq={FAQ}
    >
      <h2 id="ce-que-couvre-la-recherche">Ce que couvre la recherche de Notes</h2>
      <p>
        Avant de conclure que la recherche est cassée, il vaut mieux savoir ce qu’elle lit. Sur Mac, Apple dit que la recherche trouve ce
        qui correspond dans :
      </p>
      <ul>
        <li>le corps de chaque note</li>
        <li>les noms de fichiers des pièces jointes, et les PDF que vous avez joints</li>
        <li>les dessins et le texte manuscrit</li>
        <li>le contenu d’une image (cherchez « vélo » pour trouver la photo d’un vélo)</li>
        <li>le texte d’un document numérisé</li>
      </ul>
      <p>
        Sur iPhone, Apple cite les tags, le texte saisi, le texte manuscrit dans les langues prises en charge, les objets dans les images et
        le texte des documents scannés. Deux limites valent sur les deux. Une note verrouillée n’affiche que son titre dans les résultats,
        même quand elle est déverrouillée. Et le guide Mac d’Apple dit que certaines fonctionnalités ne sont pas disponibles avec les
        comptes d’autres fournisseurs, comme un compte Gmail. Sur Mac, les notes de Suppressions récentes apparaissent bien dans les
        résultats.
      </p>

      <h2 id="verifications">Les vérifications, dans l’ordre</h2>
      <Steps>
        <li id="tous-les-comptes">
          <strong>Cherchez dans tous les comptes</strong>
          Sur iPhone, touchez l’icône Précédent jusqu’à voir la liste de vos notes, touchez la barre de recherche (il faut parfois faire
          défiler l’écran pour la voir) et vérifiez que Tous les comptes est sélectionné. Sur Mac, cliquez sur le bouton de recherche,
          cliquez sur le menu à côté de la loupe et choisissez Tous les comptes. Ce choix n’apparaît que si vous avez plusieurs comptes,
          par exemple iCloud et Sur mon Mac.
        </li>
        <li id="verrouillee">
          <strong>La note est peut-être verrouillée</strong>
          La recherche ne voit que le titre d’une note verrouillée. Si vous avez cherché un mot de son texte, ouvrez vos notes verrouillées
          et parcourez-les à la main. Mot de passe oublié ? Voyez{" "}
          <a href="/fr/blog/mot-de-passe-notes-iphone-oublie">mot de passe Notes oublié</a>.
        </li>
        <li id="compte-active">
          <strong>Notes est activé pour chaque compte</strong>
          Une note dans un compte Gmail, Yahoo ou autre n’apparaît que si Notes est activé pour ce compte. Touchez le compte et vérifiez que
          Notes est activé, puis recommencez pour chaque compte.
          <Paths rows={[{ on: "iPhone", steps: ["Réglages", "Apps", "Notes", "Comptes Notes"] }]} />
        </li>
        <li id="autres-mots">
          <strong>Essayez d’autres mots, puis cherchez à la main</strong>
          Apple le dit elle-même : le mot, le groupe de mots ou le titre que vous cherchez n’est peut-être pas celui de la note. Essayez-en
          un autre, puis ouvrez chaque dossier et faites défiler. Sur Mac, vous pouvez aussi écrire comme vous le diriez, par exemple
          « notes créées la semaine dernière » ou « modifiée aujourd’hui ».
        </li>
        <li id="synchronisee">
          <strong>La note est bien arrivée sur cet appareil</strong>
          Si vous avez écrit la note sur un autre iPhone ou un autre Mac, elle doit arriver sur celui-ci avant que la recherche puisse la
          trouver. Vérifiez que Synchroniser cet iPhone ou Synchroniser ce Mac est activé pour Notes dans les réglages iCloud, sur les deux.{" "}
          <a href="/fr/blog/notes-ne-se-synchronise-pas-iphone-mac">Notes ne se synchronise pas</a> donne le reste de ces vérifications.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Réglages", "Votre nom", "iCloud", "Tout voir", "Notes"] },
            { on: "Mac", steps: ["Réglages Système", "Votre nom", "iCloud", "Notes"] },
          ]} />
        </li>
        <li id="redemarrer">
          <strong>Quittez et rouvrez Notes, puis redémarrez</strong>
          Sur iPhone, ouvrez le sélecteur d’app, balayez Notes vers le haut, puis rouvrez-le. Si cela ne suffit pas, Apple conseille
          d’éteindre l’iPhone et de le rallumer. Sur Mac, appuyez sur Commande + Q dans Notes et rouvrez-le ; si Notes ne répond pas,
          appuyez sur Option + Commande + Échap et cliquez sur Forcer à quitter. Si cela échoue aussi, choisissez Redémarrer dans le menu
          Pomme.
        </li>
        <li id="mise-a-jour">
          <strong>Mettez à jour vers la dernière version</strong>
          L’article d’Apple sur les notes introuvables commence par là : mettre à jour tous vos appareils vers la dernière version d’iOS et
          de macOS. Apple dit que les mises à jour de macOS apportent des améliorations aux apps intégrées comme Notes.
          <Paths rows={[
            { on: "iPhone", steps: ["Réglages", "Général", "Mise à jour logicielle"] },
            { on: "Mac", steps: ["Réglages Système", "Général", "Mise à jour logicielle"] },
          ]} />
        </li>
      </Steps>
      <p>
        Si la recherche trouve la note dans Suppressions récentes, remettez-la dans un dossier avant la fin des 30 jours.{" "}
        <a href="/blog/recover-deleted-apple-notes">Recover deleted Apple Notes</a> (en anglais) donne les étapes.
      </p>

      <h2 id="dans-une-note">Chercher dans une note, ou dans un PDF qu’elle contient</h2>
      <p>
        Les longues notes et les PDF joints ont leur propre recherche. Sur iPhone, ouvrez la note, ouvrez le menu de la note et touchez
        Rechercher dans la note. Pour chercher aussi dans les PDF et les autres pièces jointes, ouvrez les options de recherche et
        sélectionnez Inclure les pièces jointes, puis tapez ce que vous cherchez. Sur Mac, ouvrez la note et appuyez sur Commande + F. Pour
        les notes iCloud ou Sur mon Mac, Présentation, Afficher le navigateur de pièces jointes permet de parcourir toutes les pièces jointes.
      </p>

      <h2 id="spotlight">Quand les notes n’apparaissent pas dans Spotlight</h2>
      <p>
        Spotlight est la recherche de tout l’appareil, et le guide Mac d’Apple dit que ses résultats peuvent inclure des notes. Si ce n’est
        pas le cas :
      </p>
      <ul>
        <li><strong>iPhone :</strong> ouvrez Réglages, touchez Rechercher, faites défiler vers le bas, touchez Notes et activez Afficher l’app dans Recherche. Sous Réglages, Apps, Notes, le réglage Recherche décide si le contenu de Notes apparaît dans la recherche et dans les widgets.</li>
        <li><strong>Mac :</strong> ouvrez Réglages Système, cliquez sur Spotlight et regardez Résultats provenant d’apps. Les apps désactivées là n’apparaissent pas dans les résultats de Spotlight.</li>
      </ul>
      <p>
        Apple donne aussi des étapes pour reconstruire une partie de l’index de Spotlight sur Mac, sous Recherche et confidentialité. Elles
        sont écrites pour les fichiers d’un disque ou d’un dossier, et Apple ne dit pas qu’elles aident Notes.
      </p>

      <h2 id="apres-une-mise-a-jour">Si le problème a commencé après une mise à jour</h2>
      <p>
        Apple dit que Spotlight reconstruit son index après l’installation d’une mise à jour logicielle, et que cela peut prendre plusieurs
        heures, voire plusieurs jours. C’est plus rapide quand l’appareil n’est pas utilisé, qu’il est branché et connecté en Wi-Fi.
        Pendant ce temps, l’iPhone affiche dans Réglages une notification qui dit que la recherche et Siri sont en cours d’optimisation, et
        sur Mac, Commande + Barre d’espace affiche un indicateur de progression en haut de Spotlight.
      </p>
      <p>
        Apple ne dit pas si la recherche dans l’app Notes attend cet index : les vérifications ci-dessus passent donc toujours en premier.
      </p>

      <h2 id="pinto-notes">Retrouver une note par son sujet</h2>
      <p>
        Toutes ces vérifications supposent que vous vous souvenez d’un mot de la note. Quand vous ne vous souvenez que de son sujet, une
        recherche par mot ne peut rien. Pinto Notes, l’app de notes pour iPhone et Mac, ressemble à Notes et fonctionne comme lui, et sa
        recherche lit chaque mot de chaque note. Une fois que vous avez{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> (en anglais), ce qui prend une minute, vous pouvez aussi
        lui demander de retrouver la note par son sujet, avec vos propres mots.
      </p>
      <p>
        Il ne répare pas la recherche de Notes. <a href="/blog/move-from-apple-notes">Passer de Notes à Pinto Notes</a> (en anglais) demande
        un seul import sur votre Mac, et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
