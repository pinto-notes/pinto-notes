import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "liste-de-livres-a-lire-notes-iphone");

// French version of /blog/apple-notes-reading-list (templates translation, 21 Nov 2026). Apple's own French words, all
// read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes sur Mac":
// Format > Tableau, la touche Tabulation), support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Option + Commande +
// T), support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes": « Trier automatiquement les tâches
// terminées » dans les réglages de Notes), support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac ("Trier et épingler
// les notes") and support.apple.com/fr-fr/102462 (compte Apple). Édition > Coller au format Markdown, the Table button
// (Tableau) and the Checklist button (Liste de pointage) are the French strings in Notes' MainMenu.loctable and
// Localizable.loctable on macOS 27.2. Paste as Markdown is not used for the table, as in the English post. Search
// words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "liste de livres à lire" (absolument, dans sa vie),
// "liste de livres lus" and "application liste de livres lus"; "liste de lecture" and "liste de lecture iphone" are
// about Safari and Apple Music, so the slug is "liste de livres à lire notes iphone". The books are the English post's,
// under their French titles. Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

// Tabs between the columns: select the six table lines in Notes and click the Table button.
const TEMPLATE = `Livres à lire

Titre\tAuteur\tStatut\tNote\tPourquoi
Projet Dernière Chance\tAndy Weir\tLu\t5\tClub de lecture
Piranesi\tSusanna Clarke\tEn cours\tPas encore\tConseillé par Jonas
Guerre et Paix\tLéon Tolstoï\tAbandonné\t2\tLâché p. 90
Auprès de moi toujours\tKazuo Ishiguro\tLu\t4\tLu en vacances
L’Arbre-monde\tRichard Powers\tÀ lire\tPas encore\tPrêté par Sara

Notes
Projet Dernière Chance : l’amitié porte tout le livre. Je le prête à Papa ensuite.
Auprès de moi toujours : calme et étrange. J’y ai repensé pendant des semaines.
`;

const SIMPLE = `# Livres à lire

## À lire
- [ ] Piranesi de Susanna Clarke (conseillé par Jonas)
- [ ] L’Arbre-monde de Richard Powers (prêté par Sara)

## Lus
- Projet Dernière Chance d’Andy Weir : 5 sur 5
- Auprès de moi toujours de Kazuo Ishiguro : 4 sur 5
`;

const FAQ = [
  { q: "Comment faire une liste de livres à lire dans Notes ?", a: [
    "Créez une note Livres à lire avec un tableau : titre, auteur, statut, note et pourquoi. Pour plus simple, faites une liste de pointage des livres à lire et cochez chacun quand vous l’avez fini.",
  ] },
  { q: "Peut-on trier sa liste de livres dans Notes ?", a: [
    "Non. Les tableaux de Notes ne trient pas : les livres restent dans l’ordre où vous les avez ajoutés. Une liste de pointage peut envoyer les livres cochés en bas si vous activez Trier automatiquement les tâches terminées dans les réglages de Notes.",
  ] },
  { q: "Peut-on partager sa liste de lecture avec son club de lecture ?", a: [
    "Oui. Partagez la note et chacun peut y ajouter des livres, mais chaque personne a besoin d’un compte Apple.",
  ] },
  { q: "Existe-t-il une app de liste de lecture qui fonctionne comme Notes ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit de liste de lecture avec un statut et une note de 1 à 5. Parlez d’un livre à ChatGPT ou Claude et il le range ; demandez quoi lire ensuite et il en propose un de votre liste.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="liste-de-livres-a-lire-notes-iphone"
      intro={<>
        Les livres qu’on vous conseille finissent dans des captures d’écran, des messages et des onglets, et ils ont disparu le jour où vous
        cherchez quoi lire. Notes peut les garder dans une seule note. Voici un modèle de liste de livres à lire pour Notes, une version
        plus simple en liste de pointage, et là où Notes s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#liste", label: "Une liste plus simple" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Une liste qui se range seule" },
        ]}>
          <p>
            Notes n’a pas de modèle de liste de lecture, mais une note avec un tableau fait l’affaire : titre, auteur, statut, une note sur 5
            et pourquoi vous vouliez le lire. Ajoutez un rang quand on vous conseille un livre, et écrivez quelques lignes sous Notes quand
            vous en finissez un.
          </p>
          <PostCta template="reading-list" slug="fr/liste-de-livres-a-lire-notes-iphone" path="/fr/blog/liste-de-livres-a-lire-notes-iphone" position="answer" ui={ui.cta}
            title="Vos livres rangés pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de liste de lecture. Parlez d’un livre à ChatGPT ou Claude et il ajoute le rang ; demandez quoi lire ensuite et il choisit dans votre liste.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/reading-list-note" width={1520} height={1153} maxWidth={600}
        alt="Une note Reading list dans Pinto Notes sur Mac : un tableau Books de cinq livres avec titre, auteur, statut, note et raison, de Project Hail Mary, lu avec un 5, à The Overstory, à lire, puis des notes sur deux livres."
        caption="Une liste de lecture dans Pinto Notes, où le statut est un choix et la note une échelle de 1 à 5. Données d’exemple. Dans Notes, le même tableau marche avec les mots tapés à la main." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un tableau de livres</h2>
      <p>
        Cinq colonnes suffisent. Le statut tient en un mot parmi quatre : À lire, En cours, Lu ou Abandonné. Pourquoi est la colonne que
        vous vous remercierez d’avoir remplie : dans un an, « Conseillé par Jonas » vous en dira plus que le titre. Les livres abandonnés
        restent sur la liste, pour ne pas les reprendre par erreur.
      </p>
      <Keep title="Livres à lire pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Chaque ligne du tableau a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez le modèle dans une nouvelle note, sélectionnez les six lignes de Titre à
          L’Arbre-monde, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne : vous avez cinq colonnes côte à côte.
        </li>
        <li>
          <strong>Ajoutez un livre en une seconde.</strong> Cliquez dans la dernière cellule et appuyez sur Tabulation : un nouveau rang
          apparaît pour le livre suivant.
        </li>
        <li>
          <strong>Gardez des cellules courtes.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser :
          cinq colonnes se partagent la place. Les remarques plus longues vont sous Notes, après le tableau.
        </li>
        <li>
          <strong>Épinglez-la.</strong> Épinglez la note en haut de son dossier : c’est la première chose que vous voyez quand un ami vous dit
          « il faut absolument que tu lises ça ».
        </li>
      </ul>
      <p>
        La recherche lit chaque mot de la note : chercher un auteur ou le prénom d’un ami trouve la liste. Pour la partager avec un club de
        lecture, partagez la note ; chaque personne a besoin d’un compte Apple. <a href="/blog/apple-notes-tables">Tables in Apple
        Notes</a> (en anglais) couvre tout ce qu’un tableau sait faire, ou pas.
      </p>

      <h2 id="liste">Une version plus simple en liste de pointage</h2>
      <p>
        Si un tableau, c’est plus que ce que vous voulez, une liste de pointage marche. Les livres à lire vont dans la liste, et vous en
        cochez un quand vous l’avez fini. Gardez un mot sur chaque ligne, car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Liste de lecture pour Notes" text={SIMPLE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre, des lignes ## des sous-titres et des
        livres une liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-la, sélectionnez les livres et
        touchez le bouton Liste de pointage. Cochez Trier automatiquement les tâches terminées dans les réglages de Notes, et les livres
        finis descendent en bas. Quand vous voulez vous souvenir d’un livre, passez-le sous Lus avec une note.
      </p>
      <p>
        Pour garder plus qu’une note sur 5, gardez pour chaque livre ses citations, vos idées et l’idée clé dans Notes. D’autres notes à coller sont dans{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où une liste de lecture dans Notes s’arrête</h2>
      <ul>
        <li><strong>Pas de tri ni de filtre.</strong> Les tableaux ne trient pas : trouver tous les livres À lire, c’est lire toute la colonne Statut.</li>
        <li><strong>Le statut n’est que du texte.</strong> Rien n’empêche « Lu » et « Fini » de se retrouver dans la même colonne.</li>
        <li><strong>Chaque livre se tape à la main.</strong> Un conseil reçu par message n’est sur la liste que si vous le recopiez.</li>
        <li><strong>La liste ne répond pas.</strong> Elle sait ce que vous avez bien noté, mais pas quel livre À lire ressemble le plus à ceux que vous avez adorés.</li>
      </ul>

      <h2 id="pinto-notes">Une liste de lecture qui se range seule</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/reading-list">Reading list</a> (liste de lecture) est
        une note avec un tableau Books et une partie Notes. Le statut est un choix parmi To read, Reading, Finished ou Dropped, et la note
        une échelle de 1 à 5 : vous les choisissez au lieu de les taper.
      </p>
      <p>
        Parlez d’un livre à votre IA et elle ajoute un rang : le titre, l’auteur, To read, et qui vous l’a conseillé ou pourquoi vous voulez
        le lire. Dites « fini Piranesi, cinq étoiles » et elle met à jour le statut et la note. Vos idées sur un livre vont sous Notes, sous
        son titre. Demandez « je lis quoi ensuite ? » et elle en propose un parmi vos livres To read, d’après ceux que vous avez bien notés.
        Vous pouvez toujours ajouter et modifier chaque rang vous-même, et chaque version précédente de la note est gardée.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        La liste de lecture que vous tenez déjà dans Notes arrive en <a href="/blog/move-from-apple-notes">un seul import sur votre
        Mac</a> (en anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
