import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "trier-liste-a-cocher-notes-iphone");

// French version of /blog/apple-notes-checklist-sort (batch 3, 21 Nov 2026). Apple's own French words, all read on
// 21 Nov 2026: support.apple.com/fr-fr/102296 ("Créer une liste de tâches avec Notes", iPhone: Réglages > Apps > Notes,
// « Trier les éléments cochés », Manuellement ou Automatiquement; faire glisser un élément; balayer vers la droite pour un
// retrait, vers la gauche pour l'annuler; toucher le cercle vide), support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/16.0/
// ios/16.0 (iOS 16: Réglages > Notes > Trier les éléments cochés, « au bas de toutes vos notes »; its in-note menu is not
// in the current guides, so it's left out, as in the English post), the Mac guide support.apple.com/fr-fr/guide/notes/
// apd93c815aa0/mac ("Ajouter des listes dans Notes sur Mac": cliquer et maintenir un élément puis le faire glisser;
// « Trier automatiquement les tâches terminées » dans les réglages de Notes; Format > Plus > « Tout cocher » ou « Tout
// décocher »; Commande-clic sur une tâche; Tabulation et Maj + Tabulation; Maj + Retour), apd97da26aed/mac ("Modifier les
// réglages dans Notes sur Mac": the setting puts finished tasks at the bottom and unfinished ones at the top) and
// apd46c25187e/mac ("Raccourcis clavier et gestes": Maj + Commande + L, Maj + Commande + U, Contrôle + Commande + Flèche
// vers le haut ou vers le bas, Dupliquer une note Commande + D). The Mac app's own string for the setting reads
// « Trier automatiquement les éléments cochés » in Notes' Localizable.loctable on macOS 27.2; the page uses the support
// guide's wording, as the other French posts do. Fichier > Dupliquer la note, Fichier > Nouveau dossier intelligent and
// the Checklist button (Liste de pointage) are in Notes' MainMenu.loctable and Localizable.loctable; the Smart Folder rule
// Listes de pointage with the value Non coché is in its SmartFolderFilterRow and SmartFolderChecklistsFilterView tables.
// Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "notes iphone liste à cocher", "case a cocher
// note iphone", "cocher note iphone", "trier liste note iphone" and "check list note iphone"; the rest ("sort checklist
// notes iphone", "iphone notes to do list sort") is English. Hence the slug "trier liste a cocher notes iphone". Facts
// are the English post's; the pictures are its own, described in French.

const ui = UI.fr;

const FAQ = [
  { q: "Pourquoi les éléments cochés descendent-ils en bas dans Notes ?", a: [
    "Trier les éléments cochés est réglé sur Automatiquement. Sur iPhone, allez dans Réglages, Apps, Notes, Trier les éléments cochés et touchez Manuellement pour que les éléments cochés restent où ils sont. Sur Mac, choisissez Notes, Réglages et décochez Trier automatiquement les tâches terminées.",
  ] },
  { q: "Peut-on trier les éléments cochés dans une seule note ?", a: [
    "Le réglage s’applique à chaque liste de pointage de chaque note sur cet appareil. Pour ranger une seule liste sans toucher aux autres, laissez le réglage désactivé et faites descendre les éléments cochés à la main.",
  ] },
  { q: "Notes peut-il trier une liste par ordre alphabétique ?", a: [
    "Non. Notes garde les éléments dans l’ordre où vous les tapez, et le tri qu’Apple décrit ne fait que descendre les éléments cochés. Faites glisser les éléments à la main, ou sur Mac, appuyez sur Contrôle + Commande + Flèche vers le haut ou vers le bas pour déplacer une ligne à la fois.",
  ] },
  { q: "Quel est le raccourci clavier pour une liste de pointage dans Notes ?", a: [
    "Sur Mac, Maj + Commande + L transforme la ligne en liste de pointage et Maj + Commande + U coche ou décoche l’élément où vous êtes. Un Commande-clic sur n’importe quel élément les coche tous.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="trier-liste-a-cocher-notes-iphone"
      intro={<>
        Cochez un élément d’une liste de pointage dans Notes : soit il descend en bas, soit il reste où il est. Un seul réglage en décide, et
        il ne se trouve pas au même endroit sur iPhone et sur Mac. Voici où le trouver, comment déplacer les éléments à la main, et comment
        remettre une liste à zéro.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "Sur iPhone" },
          { href: "#mac", label: "Sur Mac" },
          { href: "#a-la-main", label: "Déplacer à la main" },
          { href: "#tout-decocher", label: "Tout décocher" },
          { href: "#raccourcis", label: "Raccourcis" },
          { href: "#pinto-notes", label: "Une liste qui se range seule" },
        ]}>
          <p>
            Sur iPhone, allez dans Réglages, Apps, Notes, touchez Trier les éléments cochés, puis Automatiquement pour faire descendre les
            éléments cochés en bas, ou Manuellement pour qu’ils restent où ils sont. Sur Mac, choisissez Notes, Réglages et cochez ou
            décochez Trier automatiquement les tâches terminées. C’est un seul réglage pour toutes vos notes : chaque appareil le règle une
            fois.
          </p>
          <PostCta template="grocery-list" slug="fr/trier-liste-a-cocher-notes-iphone" path="/fr/blog/trier-liste-a-cocher-notes-iphone" position="answer" ui={ui.cta}
            title="Les éléments cochés retirés pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a une liste de courses gratuite. Dites à ChatGPT ou Claude ce qu’il vous faut : il range chaque article par rayon, puis retire les lignes cochées à votre retour.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Une note Groceries dans Notes sur Mac : huit éléments non cochés, d’Oat milk à Dark chocolate, puis Sourdough, Eggs et Spinach cochés en bas."
        caption="Une liste de courses dans Notes sur Mac, avec les éléments cochés en bas." />}
      faq={FAQ}
    >
      <h2 id="iphone">Faire descendre les éléments cochés sur iPhone</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Réglages", "Apps", "Notes", "Trier les éléments cochés"] },
      ]} />
      <p>
        Le réglage se trouve dans l’app Réglages, pas dans Notes. Ouvrez Réglages, touchez Apps, puis Notes, puis Trier les éléments cochés,
        et choisissez :
      </p>
      <ul>
        <li><strong>Automatiquement.</strong> Chaque élément coché descend en bas de sa liste, et ce qui reste à faire reste en haut.</li>
        <li><strong>Manuellement.</strong> Les éléments cochés restent où ils sont. Choisissez ce réglage si votre liste suit un ordre à garder, comme les étapes d’une recette.</li>
      </ul>
      <p>
        Sur les anciennes versions d’iOS, le même réglage se trouve un niveau plus haut, dans Réglages, Notes, Trier les éléments cochés. Dans
        les deux cas, il s’applique à chaque liste de pointage de chaque note sur cet iPhone.
      </p>

      <h2 id="mac">Faire descendre les éléments cochés sur Mac</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Notes", "Réglages", "Trier automatiquement les tâches terminées"] },
      ]} />
      <p>
        Dans Notes, choisissez Notes, Réglages et cochez Trier automatiquement les tâches terminées. Cochez un élément et il descend en bas de
        la liste. Décochez-le et il remonte en haut. Décochez le réglage et les éléments restent où ils sont quand vous les cochez.
      </p>
      <p>
        Le Mac a son propre réglage, distinct de celui de l’iPhone : réglez-le sur les deux si vous voulez que vos listes se comportent de la
        même façon partout.
      </p>

      <h2 id="a-la-main">Déplacer un élément à la main</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Faire glisser l’élément"] },
        { on: "Mac", steps: ["Cliquer et maintenir", "Faire glisser"] },
        { on: "Mac", steps: ["Monter l’élément"], keys: "⌃⌘↑" },
        { on: "Mac", steps: ["Descendre l’élément"], keys: "⌃⌘↓" },
      ]} />
      <p>
        Avec le tri réglé sur Manuellement, l’ordre vous appartient. Sur iPhone, faites glisser un élément là où vous le voulez. Sur Mac,
        cliquez sur un élément, maintenez le bouton enfoncé et faites-le glisser, ou placez le curseur dans une ligne et appuyez sur Contrôle +
        Commande + Flèche vers le haut ou vers le bas pour la déplacer d’une place à la fois. Notes n’a pas de tri alphabétique pour une
        liste de pointage : faire glisser est aussi la façon de mettre les éléments dans l’ordre.
      </p>
      <p>
        Pour regrouper des éléments, mettez-les en retrait. Sur iPhone, balayez un élément vers la droite pour le mettre en retrait et vers la
        gauche pour annuler. Sur Mac, appuyez sur Tabulation pour le retrait et Maj + Tabulation pour l’annuler. Pour les courses, des
        sous-titres marchent mieux que l’ordre : un sous-titre par rayon, comme dans la{" "}
        <a href="/fr/blog/liste-de-courses-notes-iphone">liste de courses dans Notes</a>.
      </p>

      <h2 id="tout-decocher">Tout décocher, ou tout cocher</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Plus", "Tout décocher"] },
        { on: "Mac", steps: ["Format", "Plus", "Tout cocher"] },
      ]} />
      <p>
        Pour réutiliser une liste, cliquez dedans et choisissez Format, Plus, Tout décocher. Tout cocher coche tout. Il y a aussi plus rapide :
        un Commande-clic sur n’importe quel élément. Si un élément n’est pas coché, Notes les coche tous, et si tous sont cochés, il les
        décoche tous.
      </p>
      <p>
        Tout décocher efface la trace de ce que vous aviez coché. Pour une liste que vous gardez pour son historique, comme un{" "}
        <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes</a>, choisissez d’abord Fichier, Dupliquer la note et
        remettez la copie à zéro.
      </p>

      <h2 id="raccourcis">Raccourcis clavier des listes de pointage sur Mac</h2>
      <Paths rows={[
        { on: "Liste de pointage", steps: ["Appliquer le format Liste de pointage"], keys: "⇧⌘L" },
        { on: "Cocher", steps: ["Cocher ou décocher un élément"], keys: "⇧⌘U" },
        { on: "Déplacer", steps: ["Élément vers le haut ou le bas"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        Maj + Commande + L applique le format Liste de pointage, comme le bouton Liste de pointage. Maj + Commande + U coche ou décoche
        l’élément où se trouve le curseur, sans jamais toucher la souris. Maj + Retour ajoute une deuxième ligne dans un même élément. Sur
        iPhone, touchez le bouton Liste de pointage, et chaque Retour commence l’élément suivant.
      </p>

      <h2 id="listes-ouvertes">Trouver chaque liste où il reste quelque chose à faire</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="La fenêtre New Smart Folder de Notes sur macOS 27, nommée Open to-dos, avec une seule règle : Checklists, Unchecked."
        caption="Un dossier intelligent qui regroupe chaque note avec un élément non coché. Notes sur macOS 27, en anglais ici." />
      <p>
        Le tri range une liste. Pour les voir toutes, créez un dossier intelligent avec la règle Listes de pointage, Non coché : il liste
        chaque note qui a encore un élément non coché, quel que soit son dossier. Sur Mac, choisissez Fichier, Nouveau dossier intelligent. Les
        étapes pour iPhone sont dans <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> (en anglais).
      </p>

      <h2 id="limites">Là où le tri des listes s’arrête</h2>
      <ul>
        <li><strong>Toutes les notes ou aucune.</strong> Le réglage couvre chaque liste de pointage de l’appareil : une liste de courses et une recette se trient de la même façon.</li>
        <li><strong>Les éléments cochés s’accumulent.</strong> Ils descendent en bas et y restent tant que vous ne les supprimez pas ou ne les décochez pas.</li>
        <li><strong>L’ordre se fait à la main.</strong> Notes ne trie ni par nom ni par rayon, et un nouvel élément va là où vous le tapez.</li>
      </ul>
      <p>
        Pour une liste que vous utilisez chaque semaine, ça suffit. Pour une liste qui change tous les jours, la ranger devient un travail en
        soi.
      </p>

      <h2 id="pinto-notes">Une liste qui se range toute seule</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Une note Groceries dans Pinto Notes sur Mac. Les cinq lignes que ChatGPT vient d’ajouter sont teintées, et une barre en bas indique que ChatGPT a changé 5 lignes, avec Undo." }}
        caption="Une note Groceries dans Pinto Notes sur Mac. Les cinq lignes que ChatGPT vient d’ajouter sont teintées, avec Undo en bas." />
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis la
        conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/grocery-list">Grocery list</a> (liste de courses) est une
        seule liste avec un sous-titre par rayon.
      </p>
      <p>
        Dites à votre IA ce qu’il vous faut, même en une longue phrase : elle ajoute chaque article sous le bon rayon et saute ce qui est déjà
        sur la liste. Cochez au fil des courses. Dites « je suis rentré des courses » et elle retire les lignes cochées et vous dit ce qui
        reste. Vous pouvez toujours ajouter, cocher et déplacer chaque élément vous-même, et chaque version précédente d’une note est gardée.
        Cette partie marche une fois ChatGPT ou Claude connecté, et <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en
        anglais) prend une minute.
      </p>
      <p>
        Les listes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
