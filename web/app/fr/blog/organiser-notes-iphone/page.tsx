import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "organiser-notes-iphone");

// French version of /blog/apple-notes-organize (batch 3, 21 Nov 2026). Apple's own French words, all read on 21 Nov
// 2026: support.apple.com/fr-fr/guide/notes/apd558a85438/mac ("Ajouter et supprimer des dossiers dans Notes sur Mac":
// Fichier > Nouveau dossier, faire glisser les notes, Option pour les copier, faire glisser un dossier sur un autre pour un
// sous-dossier, « Renommer le dossier » and « Supprimer le dossier » from the folder's button or a Control-click, notes of a
// deleted folder in Suppressions récentes for 30 days, no subfolder in « [Compte] (tout) » or Notes),
// support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac ("Trier et épingler les notes sur Mac": Notes > Réglages, « Trier
// les notes par », per folder « Trier par », the (tout) folders and Suppressions récentes use the default, Fichier >
// Épingler la note, swipe right with two fingers, drag between Épinglées and Notes, a pin shows on every device with the
// same Apple Account, pinning needs upgraded iCloud notes or notes on the Mac), support.apple.com/fr-fr/guide/notes/
// apd000074a4e/mac (« Grouper les notes par date », per folder « Grouper par date », not when sorted by title),
// support.apple.com/fr-fr/guide/iphone/ipha61270292/ios ("Organiser les notes dans des dossiers sur l'iPhone": « Nouveau
// dossier », touch and hold a folder and drag it onto another, Renommer, swipe left to delete, Déplacer, « Trier par »,
// « Plus ancien en 1er » or « De Z à A », Réglages > Apps > Notes > « Trier par », « Grouper par date », « Épingler la
// note » or swipe right), support.apple.com/fr-fr/guide/notes/apd58edc7964/mac (dossiers intelligents),
// support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac (# then a word), support.apple.com/fr-fr/guide/notes/
// apde615d29c2/mac and support.apple.com/fr-fr/guide/iphone/iph908d1558b/ios (Ajouter un lien, Commande + K, « >> »,
// « Lien vers la section »; on iPhone Apple gives the selection menu no name, so neither does this page) and
// support.apple.com/fr-fr/guide/iphone/iphf177bb154/ios (notes with tags can't be locked). Déplacer vers, Épinglées,
// Date de modification, Date de création and Titre are the French strings in Notes' Localizable.loctable on macOS 27.2;
// the Smart Folder values « Notes sans tag uniquement », « 7 derniers jours », Listes de pointage and Non coché are in its
// SmartFolder*.loctable files; Édition > Coller au format Markdown and Format > Plus > Tout décocher are in its
// MainMenu.loctable. The iPhone's bouton Plus, Sélectionner les notes and bouton Dossier are from support.apple.com/fr-fr/
// 118442, as in deplacer-notes-iphone-vers-icloud. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give
// "organiser notes iphone", "organiser notes apple", "comment organiser ses notes iphone", "organiser ses notes apple",
// "creer dossier notes iphone", "dossier intelligent notes iphone" and "trier notes iphone". Hence the slug "organiser
// notes iphone". The weekly tidy is the English post's, in French. Facts are the English post's; the pictures are its
// own, described in French.

const ui = UI.fr;

const TIDY = `# Rangement de la semaine

- [ ] Classer chaque note du dossier Notes, ou la supprimer
- [ ] Taguer les notes de Sans tag qui en ont besoin
- [ ] Parcourir Cette semaine pour repérer ce qui est mal rangé
- [ ] Désépingler ce qui est terminé
- [ ] Vider ou supprimer les listes finies dans À faire
- [ ] Déplacer les projets terminés dans Archives
`;

const FAQ = [
  { q: "Quelle est la meilleure façon d’organiser ses notes sur iPhone ?", a: [
    "Quelques grands dossiers pour les domaines de votre vie, des tags pour les sujets qui les traversent, une note sommaire épinglée par dossier, et dix minutes par semaine pour ranger ce qui s’est accumulé. La recherche trouve n’importe quel mot : le système n’a qu’à rendre la navigation facile.",
  ] },
  { q: "Comment trier ses notes par ordre alphabétique ?", a: [
    "Triez par titre. Sur iPhone, ouvrez le dossier, touchez le bouton Plus, touchez Trier par et choisissez Titre. Sur Mac, cliquez sur le bouton à côté du dossier et choisissez Trier par, ou réglez Trier les notes par dans Notes, Réglages pour tous les dossiers. Le regroupement par date se désactive pour un dossier trié par titre.",
  ] },
  { q: "Peut-on créer des sous-dossiers dans Notes ?", a: [
    "Oui. Faites glisser un dossier sur un autre, sur Mac comme sur iPhone (sur iPhone, maintenez d’abord le doigt dessus). Les seuls dossiers qui ne peuvent pas recevoir de sous-dossier sont le dossier (tout) d’un compte et le dossier Notes.",
  ] },
  { q: "Dossiers ou tags dans Notes ?", a: [
    "Les deux. Une note est dans un seul dossier et peut porter plusieurs tags. Le conseil d’Apple dans Notes : des dossiers pour les grands domaines, comme le travail, et des tags pour les sujets précis, comme #impôts. Une note avec un tag ne peut pas être verrouillée : rangez vos notes verrouillées par dossier.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="organiser-notes-iphone"
      intro={<>
        La plupart des bibliothèques Notes grandissent de la même façon : tout atterrit dans Notes, trié par dernière modification, jusqu’à
        ce que faire défiler ne suffise plus. Voici comment organiser vos notes sur iPhone et Mac avec ce que Notes a déjà, une structure de
        dossiers à copier, et un rangement hebdomadaire qui la garde en ordre.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#dossiers", label: "Dossiers" },
          { href: "#trier", label: "Trier" },
          { href: "#epingler", label: "Épingler" },
          { href: "#tags", label: "Tags et dossiers intelligents" },
          { href: "#structure", label: "Une structure à copier" },
          { href: "#liens", label: "Liens" },
          { href: "#rangement", label: "Rangement de la semaine" },
        ]}>
          <p>
            Créez une poignée de grands dossiers, avec des sous-dossiers seulement là où un dossier devient trop chargé, et taguez les notes
            pour les sujets qui touchent plusieurs dossiers. Triez chaque dossier selon votre façon de chercher (par date de modification,
            date de création ou titre) et épinglez les quelques notes que vous ouvrez chaque jour. Passez ensuite dix minutes par semaine à
            ranger ce qui est arrivé dans Notes.
          </p>
          <PostCta slug="fr/organiser-notes-iphone" path="/fr/blog/organiser-notes-iphone" position="answer" ui={ui.cta}
            title="Et si vous n’aviez plus à ranger ?">
            <p>Pinto Notes ressemble à Notes et fonctionne comme lui. Connectez ChatGPT ou Claude, et ils déplacent vos notes dans les bons dossiers, les taguent et font le rangement quand vous le demandez.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="La liste des dossiers de Notes sur iPhone sous iOS 27 : Quick Notes et Shared, des dossiers iCloud comme Notes, Gift Ideas, Grocery List et Sketches, et une section Tags en dessous."
        caption="Des dossiers pour les domaines, des tags pour les sujets, dans une seule liste. Image : Apple." />}
      faq={FAQ}
    >
      <h2 id="dossiers">Dossiers et sous-dossiers</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Fichier", "Nouveau dossier"] },
        { on: "iPhone", steps: ["Dossiers", "Nouveau dossier"] },
      ]} />
      <p>
        Sur Mac, sélectionnez un dossier du compte voulu, choisissez Fichier, Nouveau dossier et saisissez un nom. Sur iPhone, touchez le
        bouton de création dans la liste des dossiers, puis Nouveau dossier. Pour créer un sous-dossier, faites glisser un dossier sur un
        autre (sur iPhone, maintenez d’abord le doigt dessus). Faites-le glisser ailleurs pour annuler. Le dossier (tout) et le dossier Notes
        ne peuvent pas contenir de sous-dossiers : construisez votre structure à côté.
      </p>
      <p>
        Pour déplacer une note sur Mac, faites-la glisser sur un dossier de la barre latérale, ou cliquez dessus en maintenant la touche
        Contrôle enfoncée et choisissez Déplacer vers. Maintenez la touche Option en la déposant pour la copier à la place. Sur iPhone,
        balayez la note vers la gauche et touchez le bouton de déplacement, ou maintenez le doigt dessus et touchez Déplacer.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notes sur iPhone sous iOS 27 en mode sélection : 3 Selected, trois notes cochées, et un bouton Dossier en bas à gauche pour les déplacer."
        caption="Pour ranger plusieurs notes d’un coup : Sélectionner les notes, puis le bouton Dossier. Image : Apple." />
      <p>
        Pour un tas de notes sur iPhone, ouvrez le dossier, touchez le bouton Plus, puis Sélectionner les notes, cochez-les et touchez le
        bouton Dossier. Supprimer un dossier envoie ses notes dans Suppressions récentes, où elles restent 30 jours : une suppression par
        erreur peut donc être annulée.
      </p>

      <h2 id="trier">Trier les notes par date ou par titre</h2>
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Les réglages généraux de Notes sur un Mac sous macOS 26 : Sort notes by Date Edited, New notes start with Title, et Default account réglé sur iCloud, que Siri utilise pour créer des notes." }}
        ground="sky" caption="Notes, Réglages sur un Mac sous macOS 26 (en anglais ici). Trier les notes par règle l’ordre de tous les dossiers." />
      <Paths rows={[
        { on: "Mac", steps: ["Notes", "Réglages", "Trier les notes par"] },
        { on: "Mac, un dossier", steps: ["Bouton du dossier", "Trier par"] },
        { on: "iPhone, un dossier", steps: ["Bouton Plus", "Trier par"] },
        { on: "iPhone, tous les dossiers", steps: ["Réglages", "Apps", "Notes", "Trier par"] },
      ]} />
      <p>
        Un dossier peut être trié par date de modification, date de création ou titre. Le titre, c’est le tri par ordre alphabétique, et il
        convient à un dossier de notes de référence comme des recettes ou des modes d’emploi. La date de modification convient à un dossier
        de travail, où ce que vous avez touché en dernier est ce dont vous aurez besoin ensuite. Sur iPhone, Trier par propose aussi Plus
        ancien en 1er pour une date et De Z à A pour un titre.
      </p>
      <p>
        Un tri réglé sur un dossier ne vaut que pour ce dossier. Sur Mac, les dossiers (tout) et Suppressions récentes suivent toujours le
        tri par défaut des réglages. Notes regroupe aussi la liste sous des dates comme Aujourd’hui et Hier ; désactivez-le avec Grouper par
        date dans le même menu. Un dossier trié par titre ne peut pas être groupé par date.
      </p>

      <h2 id="epingler">Épinglez les notes que vous ouvrez chaque jour</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Fichier", "Épingler la note"] },
        { on: "iPhone", steps: ["Maintenir le doigt sur la note", "Épingler la note"] },
      ]} />
      <p>
        Une note épinglée reste en haut de son dossier, quel que soit le tri. Sur Mac, vous pouvez aussi balayer vers la droite avec deux
        doigts et cliquer sur l’épingle, ou faire glisser une note entre les sections Épinglées et Notes. Sur iPhone, balayez vers la droite
        et touchez l’épingle. Une note épinglée l’est sur chaque appareil connecté au même compte Apple. Il faut des notes iCloud ou des
        notes stockées sur votre Mac.
      </p>
      <p>
        Épinglez peu. Deux ou trois notes par dossier suffisent : la liste de courses en cours, le plan de la semaine, et une note sommaire
        du dossier (on y revient plus bas).
      </p>

      <h2 id="tags">Tags et dossiers intelligents</h2>
      <p>
        Une note est dans un seul dossier mais peut porter plusieurs tags. Tapez # suivi d’un mot, comme #impôts, n’importe où dans la note.
        Le conseil d’Apple dans Notes, c’est des dossiers pour les grands domaines et des tags pour les sujets, et il tient la route : un
        reçu va dans Argent avec #impôts, et une note sur le comptable va dans Travail, avec #impôts aussi.
      </p>
      <p>
        Un dossier intelligent est un filtre enregistré qui liste les notes de tous les dossiers selon des règles comme Tags, Date de
        modification ou Listes de pointage. Trois valent la peine d’être créés pour le rangement de la semaine plus bas : Sans tag (une règle
        Tags réglée sur Notes sans tag uniquement), Cette semaine (Date de modification sur les 7 derniers jours) et À faire (Listes de
        pointage, Non coché). Les notes restent où elles sont. Chaque règle, et pourquoi un tag refuse parfois de se créer, se trouvent dans{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> (en anglais). Un piège : une note avec un tag
        ne peut pas être verrouillée.
      </p>

      <h2 id="structure">Une structure de dossiers simple à copier</h2>
      <p>
        Commencez par des dossiers pour les endroits où vous chercheriez, et n’ajoutez un sous-dossier que quand un dossier devient trop
        long à parcourir. Deux niveaux suffisent à la plupart des gens.
      </p>
      <ul>
        <li><strong>Notes.</strong> Le dossier intégré, utilisé comme boîte de réception. Notez ici, rangez plus tard.</li>
        <li><strong>Maison.</strong> La maison, la voiture, les modes d’emploi et les garanties.</li>
        <li><strong>Argent.</strong> Budgets, reçus, abonnements. Taguez #impôts tout ce qui sert à la déclaration.</li>
        <li><strong>Santé.</strong> Rendez-vous, médicaments, entraînement.</li>
        <li><strong>Travail.</strong> Avec les sous-dossiers Projets, Réunions et Références si ça devient chargé.</li>
        <li><strong>Voyages.</strong> Une note par voyage.</li>
        <li><strong>Recettes.</strong> Triées par titre.</li>
        <li><strong>Idées.</strong> Tout ce à quoi vous voulez revenir.</li>
        <li><strong>Archives.</strong> Les projets terminés et les anciens voyages, hors du chemin et toujours trouvables par la recherche.</li>
      </ul>
      <p>
        Organiser ses notes pour le travail suit le même schéma. Donnez à chaque projet un sous-dossier sous Travail, et taguez un client à
        travers les dossiers, comme #acme. Les réunions sont plus simples avec une note par réunion, toujours de la même forme, ce que donne
        le <a href="/fr/blog/compte-rendu-reunion-notes-iphone">modèle de compte rendu de réunion pour Notes</a>. D’autres notes à coller
        sont dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="liens">Reliez vos notes dans un sommaire</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Ajouter un lien"], keys: "⌘K" },
      ]} />
      <p>
        Les dossiers trient les notes par date ou par titre. Une note sommaire les trie par sens. Créez une note par dossier chargé, par
        exemple Sommaire Travail, avec un sous-titre par projet et un lien vers chaque note en dessous, et épinglez-la. Pour créer un lien,
        sélectionnez le texte, choisissez Ajouter un lien et choisissez la note, ou tapez <code>&gt;&gt;</code> suivi du titre de la note.
        Sur iPhone, touchez la sélection et choisissez Ajouter un lien parmi les options. Sous iOS 27 et macOS 27, un lien peut aussi mener à
        un sous-titre à l’intérieur d’une note (Lien vers la section), ce que présente{" "}
        <a href="/blog/apple-notes-ios-27">what’s new in Apple Notes</a> (en anglais).
      </p>

      <h2 id="rangement">Un rangement de dix minutes chaque semaine</h2>
      <p>
        Une fois par semaine (le dimanche soir convient bien), passez sur la boîte de réception et les trois dossiers intelligents. Collez
        cette liste de pointage dans une note et épinglez-la.
      </p>
      <Keep title="Rangement de la semaine pour Notes" text={TIDY} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown transforme les lignes en liste de pointage. Sur iPhone, tapez les lignes,
        sélectionnez-les et touchez le bouton Liste de pointage. Une fois fini, cliquez dans la liste et choisissez Format, Plus, Tout
        décocher : elle est prête pour la semaine suivante.
      </p>

      <h2 id="limites">Là où l’organisation de Notes s’arrête</h2>
      <ul>
        <li><strong>Le rangement se fait à la main.</strong> Chaque note de la boîte de réception attend que vous la déplaciez.</li>
        <li><strong>Les tags se posent à la main</strong>, une note ou une sélection à la fois.</li>
        <li><strong>Les sommaires vieillissent.</strong> Une nouvelle note n’est pas dans le sommaire tant que vous n’ajoutez pas son lien.</li>
        <li><strong>La recherche trouve des mots, pas des réponses.</strong> Elle trouve chaque note qui contient « cuisine ». Elle ne peut pas dire laquelle a fixé le budget.</li>
      </ul>
      <p>
        Pour quelques centaines de notes, des dossiers, des notes épinglées et un rangement hebdomadaire suffisent. Au-delà, le rangement
        devient un travail à part entière, et il vous revient.
      </p>

      <h2 id="pinto-notes">Des notes qui se rangent toutes seules</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, avec des dossiers, des sous-dossiers, des notes épinglées et
        une recherche dans chaque mot. Une fois ChatGPT ou Claude connecté, ils peuvent faire le rangement pour vous. Demandez « range tout
        ce qui est dans Notes dans les bons dossiers », « tague chaque note sur les travaux de la cuisine » ou « déplace mes voyages terminés
        dans Archives », et les notes bougent. Vous pouvez toujours tout ranger et modifier vous-même, et chaque version précédente d’une
        note est gardée. <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Pour l’habitude hebdomadaire, le modèle gratuit <a href="/templates/weekly-review">Weekly review</a> (bilan de la semaine) fait poser
        cinq questions par votre IA le dimanche et écrit la semaine dans une note, la plus récente en haut, avec vos trois priorités pour la
        semaine suivante en liste de pointage. D’autres sont dans les <a href="/templates">modèles</a>.
      </p>
      <p>
        Les notes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), dossiers compris, et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
