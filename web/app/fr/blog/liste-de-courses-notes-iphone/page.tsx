import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "liste-de-courses-notes-iphone");

// French version of /blog/apple-notes-grocery-list-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes
// sur Mac": Format > Plus > « Tout décocher », « Trier automatiquement les tâches terminées » dans les réglages de Notes),
// support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac ("Trier et épingler les notes sur Mac": les notes épinglées
// s’affichent en haut de la liste), support.apple.com/fr-fr/102462 ("Si vous ne parvenez pas à collaborer dans l’app
// Notes": compte Apple, no locked notes) and support.apple.com/fr-fr/105086 ("Créer des listes de courses dans Rappels
// sur votre iPhone": the list type is called Courses, iOS 17 and later, sorted into categories as you add items).
// Édition > Coller au format Markdown is the French string in Notes' MainMenu.loctable on macOS 27.2. Search words:
// Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "liste de courses notes iphone" itself, plus "liste de courses
// partagée iphone", "partager liste de courses iphone" and "liste de course iphone rappel", which is why sharing and
// Rappels get their own parts. The aisles are a French supermarket's. Facts are the English post's; the picture is its
// own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Courses

## Fruits et légumes
- [ ] Pommes
- [ ] Épinards
- [ ] Citrons

## Pain et crèmerie
- [ ] Lait d’avoine
- [ ] Œufs

## Boucherie et poissonnerie
- [ ] Pavés de saumon

## Épicerie
- [ ] Tomates en conserve, 2 boîtes
- [ ] Riz

## Surgelés
- [ ] Petits pois

## Entretien
- [ ] Liquide vaisselle
`;

const FAQ = [
  { q: "Notes peut-il trier une liste de courses ?", a: [
    "Pas par rayon. Notes garde les articles dans l’ordre où vous les tapez. Mettez un sous-titre par rayon et ajoutez chaque article sous le bon, et cochez Trier automatiquement les tâches terminées pour que ce qui est dans le panier descende en bas.",
  ] },
  { q: "Notes ou Rappels pour les courses ?", a: [
    "Rappels a un type de liste Courses, depuis iOS 17, qui range les articles par catégorie à mesure que vous les ajoutez. Notes est meilleur quand la liste est à côté d’un planning repas ou de recettes, ou quand vous voulez vos propres rayons, dans l’ordre de votre magasin.",
  ] },
  { q: "Toute la famille peut-elle ajouter à la même liste de courses ?", a: [
    "Oui. Partagez la note et autorisez les modifications. Chacun a besoin d’un compte Apple, et une note verrouillée ne peut pas être partagée pour être modifiée. Les coches et les nouveaux articles apparaissent sur chaque téléphone.",
  ] },
  { q: "Existe-t-il une liste de courses qui se trie toute seule ?", a: [
    "Pinto Notes a un modèle gratuit de liste de courses par rayon. Dites à ChatGPT ou Claude ce qu’il vous faut, même en une longue phrase, et chaque article va sous son rayon.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="liste-de-courses-notes-iphone"
      intro={<>
        Une liste de courses dans Notes grandit dans l’ordre où les choses viennent à manquer, et vous faites le magasin deux fois. Un
        sous-titre par rayon règle presque tout. Voici un modèle de liste de courses à coller dans Notes, comment la partager, et quand
        Rappels fait mieux.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#partager", label: "La partager" },
          { href: "#rappels", label: "Notes ou Rappels" },
          { href: "#pinto-notes", label: "Une liste qui se trie seule" },
        ]}>
          <p>
            Notes ne sait pas trier une liste de courses par rayon, mais des sous-titres le font. Créez une note avec un sous-titre par rayon
            et les articles en liste de pointage dessous, cochez Trier automatiquement les tâches terminées, et partagez-la avec ceux qui font
            aussi les courses. Copiez le modèle ci-dessous pour commencer.
          </p>
          <PostCta template="grocery-list" slug="fr/liste-de-courses-notes-iphone" path="/fr/blog/liste-de-courses-notes-iphone" position="answer" ui={ui.cta}
            title="Chaque article rangé pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a une liste de courses par rayon gratuite. Dites à ChatGPT ou Claude ce qu’il vous faut, et chaque article va sous le bon rayon.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/grocery-list-note" width={1520} height={1444} maxWidth={600}
        alt="Une note Grocery list dans Pinto Notes sur Mac : les sous-titres Fruit and veg, Bread and dairy, Meat and fish et Cupboard, chacun avec une liste de pointage, avec Bananas et Butter cochés."
        caption="Une liste de courses par rayon dans Pinto Notes. La même mise en page marche dans Notes. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une liste, un sous-titre par rayon</h2>
      <p>
        Mettez les rayons dans l’ordre où vous traversez votre magasin, et vous ne le parcourez qu’une fois. Renommez-les à votre goût :
        Traiteur, Bébé, Animaux. Gardez un mot sur chaque ligne, car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Liste de courses pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
        { on: "Mac", steps: ["Format", "Plus", "Tout décocher"] },
      ]} />
      <ul>
        <li>
          <strong>Collez-la.</strong> Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown : chaque
          ligne ## devient un sous-titre et les articles une liste de pointage. Sur iPhone, tapez les rayons, puis les articles, sélectionnez
          ceux-ci et touchez le bouton Liste de pointage.
        </li>
        <li>
          <strong>Laissez descendre ce qui est coché.</strong> Cochez Trier automatiquement les tâches terminées dans les réglages de Notes.
          Au magasin, chaque article coché descend en bas de son rayon, et ce qui reste à prendre est toujours en haut.
        </li>
        <li>
          <strong>Une seule liste, pas une par semaine.</strong> Supprimez les lignes cochées en rentrant, ou choisissez Format, Plus, Tout
          décocher pour ce que vous achetez chaque semaine.
        </li>
        <li>
          <strong>Épinglez-la.</strong> Une note épinglée reste en haut de vos notes : c’est la première chose que vous voyez au magasin.
        </li>
      </ul>

      <h2 id="partager">La partager avec ceux pour qui vous faites les courses</h2>
      <p>
        Partagez la note et autorisez les modifications. N’importe qui à la maison ajoute ce qui manque, celui ou celle qui est au magasin le
        coche, et les changements apparaissent sur chaque téléphone. Chacun a besoin d’un compte Apple, et une note verrouillée ne peut pas
        être partagée pour être modifiée.
      </p>
      <p>
        Si vous prévoyez les dîners d’abord, le <a href="/fr/blog/planning-repas-semaine-notes-iphone">planning repas dans Notes</a> garde
        les repas de la semaine et cette liste dans une seule note, et le{" "}
        <a href="/fr/blog/carnet-de-recettes-notes-iphone">modèle de recette</a> garde les ingrédients de chaque recette en liste de pointage,
        prête pour les courses. D’autres notes à coller se trouvent dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en
        anglais).
      </p>

      <h2 id="rappels">Notes ou Rappels ?</h2>
      <p>
        Soyons justes avec Rappels : depuis iOS 17, il a un type de liste Courses qui range tout seul ce que vous ajoutez par catégorie, ce
        que Notes ne sait pas faire. Si vous voulez seulement une liste qui se trie, prenez-le.
      </p>
      <p>
        Notes gagne quand la liste vit à côté d’autre chose : un planning repas, une recette, une note sur qui vient dîner. Il vous laisse
        aussi choisir les rayons et leur ordre, là où Rappels choisit ses propres catégories.
      </p>

      <h2 id="limites">Là où une liste de courses dans Notes s’arrête</h2>
      <ul>
        <li><strong>Le tri, c’est vous.</strong> Chaque article va sous son rayon à la main, donc un ajout rapide en partant atterrit en bas.</li>
        <li><strong>Pas de contrôle des doublons.</strong> Deux personnes ajoutent du lait, et vous en achetez deux.</li>
        <li><strong>Le ménage se fait à la main.</strong> Après les courses, les lignes cochées restent jusqu’à ce que vous les supprimiez.</li>
      </ul>

      <h2 id="pinto-notes">Une liste de courses qui se trie toute seule</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/grocery-list">Grocery list</a> (liste de courses) est
        une liste par rayon : fruits et légumes, pain et crèmerie, boucherie et poissonnerie, épicerie, surgelés et entretien.
      </p>
      <p>
        Dites à votre IA ce qu’il vous faut, même en une longue phrase : « il nous faut des œufs, deux boîtes de tomates, des épinards et du
        liquide vaisselle ». Elle range chaque article sous son rayon et saute ce qui est déjà sur la liste. Quand vous dites que vous êtes
        rentré des courses, elle supprime les lignes cochées et vous dit ce qui reste. Vous pouvez toujours taper et cocher chaque article
        vous-même, et vous pouvez <a href="/blog/share-a-note-and-edit-it-together">partager la note et la modifier à plusieurs</a> (en
        anglais), avec les changements de chacun qui s’affichent pendant qu’il tape.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
