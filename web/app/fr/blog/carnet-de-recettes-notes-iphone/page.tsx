import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "carnet-de-recettes-notes-iphone");

// French version of /blog/apple-notes-recipe-template (templates translation, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes sur
// Mac": Format > Plus > « Tout décocher »), support.apple.com/fr-fr/guide/notes/apde615d29c2/mac ("Ajouter des liens
// dans Notes sur Mac": Édition > Ajouter un lien, Commande + K, start typing the note's title),
// support.apple.com/fr-fr/guide/iphone/iph908d1558b/ios ("Ajouter des liens dans Notes sur l’iPhone": « Ajouter un
// lien ») and support.apple.com/fr-fr/guide/iphone/iph1a9cae52c/ios (on iPhone you touch the selection, then an editing
// option; Apple gives that menu no name, so neither does this page), support.apple.com/fr-fr/guide/notes/apda85974595/mac
// (résultats mathématiques) and apdb54e469b6/mac (épingler). Édition > Coller au format Markdown is the French string in
// Notes' MainMenu.loctable on macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "carnet
// de recettes" (à remplir, personnalisé, de famille), "organiser ses recettes", "ranger ses recettes", "modèle recette"
// and "fiche recette"; "recettes iphone notes" only suggests the English "recipes apple notes". Hence the slug "carnet
// de recettes notes iphone". Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Soupe de lentilles au citron

Pour 4, 35 minutes. Source : la fiche de Mamie

## Ingrédients
- [ ] 250 g de lentilles corail
- [ ] 1 oignon
- [ ] 2 carottes
- [ ] 2 gousses d’ail
- [ ] 1 c. à café de cumin en poudre
- [ ] 2 citrons

Du placard : huile d’olive, sel.

## Étapes
1. Faites revenir l’oignon, les carottes et l’ail dans l’huile d’olive avec le cumin.
2. Ajoutez les lentilles et un litre d’eau. Laissez mijoter 20 minutes.
3. Mixez-en la moitié, puis ajoutez le jus des citrons et salez à votre goût.

## Notes
- Faite le 14 nov. : il fallait plus de citron.
`;

const INDEX = `# Carnet de recettes

## En semaine
- Soupe de lentilles au citron

## Le week-end
- Poulet rôti et pommes de terre

## Pâtisserie
- Banana bread

## À essayer
- Nouilles au sésame
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de recette ?", a: [
    "Non. Notes n’a aucun modèle. Une note par recette, avec les ingrédients en liste de pointage et les étapes en liste numérotée, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Comment ranger ses recettes dans Notes ?", a: [
    "Mettez toutes les recettes dans un dossier Recettes, une note chacune, et gardez une note sommaire qui renvoie vers elles sous des sous-titres comme En semaine, Le week-end et Pâtisserie. La recherche trouve une recette par n’importe quel mot qu’elle contient, donc un ingrédient marche aussi.",
  ] },
  { q: "Notes peut-il adapter une recette au nombre de personnes ?", a: [
    "Pas tout seul. Notes fait les calculs que vous tapez avec les résultats mathématiques, mais il ne divise pas une liste d’ingrédients par deux. Vous changez chaque quantité à la main.",
  ] },
  { q: "Existe-t-il une app de recettes qui fonctionne comme Notes ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit Recipe box. Collez une recette dans ChatGPT ou Claude : il en enregistre une copie propre avec les ingrédients en liste de pointage, puis la range dans votre carnet.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="carnet-de-recettes-notes-iphone"
      intro={<>
        Les recettes finissent en captures d’écran, en onglets ouverts et au dos d’une enveloppe. Notes peut toutes les garder au même
        endroit, si chaque recette a la même forme. Voici un modèle de recette à coller dans Notes, une note sommaire pour les retrouver, et
        là où cela ne suffit plus.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#carnet", label: "Un carnet de recettes" },
          { href: "#cuisine", label: "En cuisine" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un carnet qui se range seul" },
        ]}>
          <p>
            Notes n’a pas de modèle de recette, mais une note par recette fait l’affaire : le nombre de personnes et le temps en haut, les
            ingrédients en liste de pointage, les étapes en liste numérotée. Gardez-les dans un dossier Recettes avec une note sommaire qui
            renvoie vers chacune, et copiez le modèle ci-dessous pour chaque nouvelle recette.
          </p>
          <PostCta template="recipe-box" slug="fr/carnet-de-recettes-notes-iphone" path="/fr/blog/carnet-de-recettes-notes-iphone" position="answer" ui={ui.cta}
            title="Des recettes remises au propre pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un carnet de recettes gratuit. Collez une recette dans ChatGPT ou Claude : il en enregistre une copie propre, les ingrédients en liste de pointage, et la range.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/recipe-note" width={1520} height={776} maxWidth={600}
        alt="Une note Lentil soup with lemon dans Pinto Notes sur Mac : pour 4, 35 minutes, six ingrédients en liste de pointage dont les lentilles et l’oignon cochés, une ligne From the cupboard et trois étapes numérotées."
        caption="Une recette dans Pinto Notes, telle que le carnet de recettes l’enregistre. La même mise en page marche dans Notes." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note par recette</h2>
      <p>
        Chaque recette a les mêmes quatre parties, pour la lire d’un coup d’œil avec de la farine sur les mains. La ligne du placard garde
        l’huile et le sel hors de la liste à cocher. Gardez un mot sur chaque ligne, car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Recette pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre, de chaque ligne ## un sous-titre et des
        ingrédients une liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez la recette, sélectionnez les
        ingrédients et touchez le bouton Liste de pointage.
      </p>

      <h2 id="carnet">Un carnet de recettes : une note sommaire</h2>
      <p>
        Un dossier de recettes se trie par date, ce qui n’aide pas un mardi soir où vous voulez quelque chose de rapide. Gardez une note de
        plus, Carnet de recettes, avec un sous-titre par type de repas, et épinglez-la en haut du dossier.
      </p>
      <Keep title="Sommaire du carnet de recettes" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Ajouter un lien"], keys: "⌘K" },
        { on: "iPhone", steps: ["Touchez la sélection", "Ajouter un lien"] },
      ]} />
      <p>
        Faites ensuite de chaque nom un lien : sélectionnez-le, choisissez Ajouter un lien et choisissez la note de la recette. Un toucher
        ouvre la recette. Les idées trouvées mais pas encore cuisinées vont sous À essayer, et cessent de vivre dans les onglets de votre
        navigateur.
      </p>

      <h2 id="cuisine">En cuisine</h2>
      <ul>
        <li>
          <strong>Cochez les ingrédients pendant les courses ou en cuisinant.</strong> La liste de pointage sert aussi de liste pour le
          magasin, et en cuisine elle vous dit ce qui est déjà dans la casserole.
        </li>
        <li>
          <strong>Remettez-la à zéro pour la prochaine fois.</strong> Cliquez dans les ingrédients et choisissez Format, Plus, Tout décocher.
        </li>
        <li>
          <strong>Notez ce qui a changé.</strong> Une ligne sous Notes, comme « il fallait plus de citron », c’est comme ça qu’une recette
          devient la vôtre.
        </li>
        <li>
          <strong>Cherchez par ingrédient.</strong> La recherche de Notes lit chaque mot : chercher « pois chiches » trouve toutes les
          recettes qui en contiennent.
        </li>
      </ul>
      <p>
        Pour prévoir les repas de la semaine à partir de votre carnet, le{" "}
        <a href="/fr/blog/planning-repas-semaine-notes-iphone">planning repas dans Notes</a> met les dîners et les courses dans une seule
        note, et la <a href="/fr/blog/liste-de-courses-notes-iphone">liste de courses par rayon</a> trie les courses par rayon. D’autres
        notes à coller se trouvent dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où un carnet de recettes dans Notes s’arrête</h2>
      <ul>
        <li><strong>Chaque recette se tape ou se nettoie à la main.</strong> Une recette copiée depuis un blog arrive avec l’histoire de la famille, les pubs et les commentaires.</li>
        <li><strong>Le sommaire se tient à la main.</strong> Une nouvelle recette n’est pas dans le carnet tant que vous n’avez pas ajouté son lien.</li>
        <li><strong>Pas d’adaptation des quantités.</strong> Cuisiner pour deux une recette prévue pour six, c’est changer chaque quantité vous-même.</li>
        <li><strong>La recherche trouve des mots, pas des réponses.</strong> Elle trouve les pois chiches. Elle ne vous dit pas quoi faire avec les pois chiches et les épinards qu’il faut finir.</li>
      </ul>
      <p>
        Pour quelques recettes préférées, un dossier de notes suffit. Pour une vraie collection, le rangement est le travail, et il vous
        revient.
      </p>

      <h2 id="pinto-notes">Un carnet de recettes qui se range tout seul</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/recipe-box">Recipe box</a> (carnet de recettes) est
        une note avec Weeknight, Weekend, Baking et Want to try (en semaine, le week-end, pâtisserie, à essayer), et une note par recette à
        l’intérieur.
      </p>
      <p>
        Collez une recette dans votre IA, page entière comprise. Elle en enregistre une copie propre dans sa propre note : le nombre de
        personnes et le temps, les ingrédients en liste de pointage, ce qui vient du placard, et des étapes courtes et numérotées, sans
        l’histoire de la famille. Puis elle range le lien sous le bon sous-titre. Demandez « qu’est-ce que je peux faire avec des pois chiches
        et des épinards ? » et elle cherche dans le carnet, ou « divise la soupe de lentilles pour deux » et elle fait les calculs. Vous
        pouvez toujours écrire et modifier chaque recette vous-même, et chaque version précédente d’une note est gardée.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Les recettes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
