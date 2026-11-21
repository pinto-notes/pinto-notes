import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "planning-repas-semaine-notes-iphone");

// French version of /blog/apple-notes-meal-planner-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes
// sur Mac": Format > Plus > « Tout décocher », « Trier automatiquement les tâches terminées » dans les réglages de Notes),
// support.apple.com/fr-fr/guide/notes/apde615d29c2/mac (Ajouter un lien, links to a section), support.apple.com/fr-fr/
// guide/notes/apd0a136b9cc/mac (Format > Tableau), support.apple.com/fr-fr/102462 ("Si vous ne parvenez pas à collaborer
// dans l’app Notes": compte Apple, up to 100 people, no locked notes) and support.apple.com/fr-fr/105086 ("Créer des
// listes de courses dans Rappels sur votre iPhone": the list type is called Courses, iOS 17 and later). Édition > Coller
// au format Markdown and Fichier > Dupliquer la note are the French strings in Notes' MainMenu.loctable on macOS 27.2.
// Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "planning repas semaine" first, then "menu de la
// semaine"; "planning repas iphone" gives "planificateur repas apple" and "organisation menu iphone". Hence the slug
// "planning repas semaine notes iphone". Facts are the English post's; the pictures are its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Dîners, semaine du 23 novembre

## Dîners
- Lundi : poulet au citron et riz
- Mardi : pâtes tomate basilic (Hugo cuisine)
- Mercredi : tacos de poisson
- Jeudi : curry de pois chiches (Hugo cuisine)
- Vendredi : pizza maison
- Samedi : resto avec des amis
- Dimanche : poulet rôti et pommes de terre

## Fruits et légumes
- [ ] Citrons
- [ ] Basilic
- [ ] Tomates cerises
- [ ] Citrons verts
- [ ] Pommes de terre

## Boucherie et poissonnerie
- [ ] Hauts de cuisse de poulet
- [ ] Poisson blanc
- [ ] Poulet entier

## Le reste
- [ ] Tortillas
- [ ] Pois chiches
- [ ] Lait de coco
- [ ] Pâte à pizza
- [ ] Mozzarella

## Toujours dans le placard
- Huile d’olive, sel, poivre
- Riz, pâtes, flocons d’avoine
- Oignons, ail
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de planning repas ?", a: [
    "Non. Notes n’a ni planning repas ni modèles. Une note avec les dîners de la semaine en haut et la liste de courses en listes de pointage dessous en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Puis-je partager un planning repas dans Notes avec la personne qui vit avec moi ?", a: [
    "Oui. Partagez la note et autorisez les modifications. Il vous faut chacun un compte Apple, et une note verrouillée ne peut pas être partagée pour être modifiée. Les coches apparaissent sur les deux téléphones.",
  ] },
  { q: "La liste de courses, dans Notes ou dans Rappels ?", a: [
    "Rappels a un type de liste Courses, depuis iOS 17, qui range les articles par catégorie à mesure que vous les ajoutez. Notes garde la liste à côté des dîners d’où elle vient. Si vous prévoyez la semaine d’abord, tout garder dans une note évite de recopier.",
  ] },
  { q: "Existe-t-il un planning repas qui écrit la liste de courses pour moi ?", a: [
    "Pinto Notes a un modèle gratuit Meal plan and groceries : les dîners de la semaine, qui cuisine, et les courses par rayon. ChatGPT ou Claude peut y prévoir la semaine et écrire la liste, sans ce qui est toujours dans le placard.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="planning-repas-semaine-notes-iphone"
      intro={<>
        Décider à 18 heures de ce qu’on mange ce soir, puis découvrir qu’il n’y a plus de riz. Un planning des repas règle les deux, et
        Notes peut le garder à côté de la liste de courses qui va avec. Voici un modèle à coller, comment l’installer pour que la liste
        serve au magasin, et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#mieux", label: "Le rendre plus pratique" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un planning qui écrit la liste" },
        ]}>
          <p>
            Notes n’a pas de planning repas, mais une seule note fait l’affaire. Mettez les dîners de la semaine en haut, une ligne par jour,
            et les courses dessous en listes de pointage, sous un sous-titre par rayon. Copiez le modèle ci-dessous.
          </p>
          <PostCta template="meal-plan" slug="fr/planning-repas-semaine-notes-iphone" path="/fr/blog/planning-repas-semaine-notes-iphone" position="answer" ui={ui.cta}
            title="La liste de courses écrite pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de planning repas. Dites à ChatGPT ou Claude ce qui vous fait envie cette semaine : il prévoit les dîners et écrit la liste de courses par rayon, sans ce qui est déjà dans le placard.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Une note Groceries dans Notes sur Mac : une liste de pointage de huit articles à acheter, dont Sourdough, Eggs et Spinach, cochés et placés en bas."
        caption="Une liste de courses à cocher dans Notes sur Mac. Avec Trier automatiquement les tâches terminées, ce qui est dans le panier descend en bas." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note par semaine</h2>
      <p>
        Une semaine de dîners pour deux, pour l’exemple. Changez d’abord les dîners, puis les courses qu’ils demandent. Gardez un mot sur
        chaque ligne, car un élément de liste vide ne survit pas au collage. Le dernier sous-titre est une simple liste de ce que vous avez
        toujours, pour ne pas racheter de l’huile d’olive chaque semaine.
      </p>
      <Keep title="Planning repas pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Le même Markdown collé deux fois dans Notes sur macOS 27 : avec Commande + V, les symboles restent du texte ; avec Coller au format Markdown, ils deviennent un titre, une liste et du texte en gras."
        caption="Collage simple à gauche, Coller au format Markdown à droite. Les lignes de liste de pointage fonctionnent de la même façon." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La ligne # devient le titre, chaque ligne
        ## un sous-titre, les dîners restent une liste et les courses deviennent des listes de pointage. Un simple Commande + V garde les
        symboles en texte. Sur iPhone, tapez les lignes, sélectionnez les courses et touchez le bouton Liste de pointage.
      </p>
      <p>
        Cochez ensuite Trier automatiquement les tâches terminées dans les réglages de Notes. Au magasin, chaque article coché descend en bas
        de sa liste, et ce qui reste à prendre reste en haut.
      </p>

      <h2 id="mieux">Le rendre plus pratique</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Fichier", "Dupliquer la note"] },
        { on: "Mac", steps: ["Format", "Plus", "Tout décocher"] },
      ]} />
      <ul>
        <li>
          <strong>La semaine suivante à partir de celle-ci.</strong> Le dimanche, choisissez Fichier, Dupliquer la note, changez les dîners,
          puis cliquez dans chaque rayon et choisissez Format, Plus, Tout décocher. La plupart des semaines partagent la moitié de leurs
          courses.
        </li>
        <li>
          <strong>Les recettes à un toucher.</strong> Gardez chaque recette dans sa propre note et reliez-la à son dîner avec Ajouter un
          lien. Sur iOS 27 et macOS 27, un lien peut aussi pointer vers une section : « Ingrédients » s’ouvre pile où il faut.{" "}
        </li>
        <li>
          <strong>Partagée avec qui cuisine.</strong> Partagez la note et autorisez les modifications. Celui ou celle qui est au magasin coche
          au fur et à mesure, et l’autre téléphone le voit. Il vous faut chacun un compte Apple, et une note verrouillée ne peut pas être
          partagée de cette façon.
        </li>
      </ul>
      <p>
        Si vous préférez voir la semaine en grille, avec une colonne pour qui cuisine, Format, Tableau en crée une ;{" "}
        <a href="/blog/apple-notes-tables">tables in Apple Notes</a> (en anglais) montre comment. Pour d’autres notes à coller de la même
        manière, voyez <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où un planning repas dans Notes s’arrête</h2>
      <ul>
        <li><strong>La liste se fait à la main.</strong> Notes ne sait pas qu’un curry demande du lait de coco. Vous lisez chaque recette et tapez ce qu’il faut, chaque semaine.</li>
        <li><strong>Pas de tri par rayon.</strong> C’est vous qui décidez où vont les citrons. Rappels a une liste Courses qui range les articles par catégorie à mesure que vous les ajoutez, mais la liste vit alors loin des dîners. Vous pouvez classer votre liste de courses par rayon.</li>
        <li><strong>Pas de mémoire de ce que vous avez.</strong> Notes ne peut pas vous dire qu’il reste du riz. La liste du placard n’aide que si vous la lisez avant d’écrire les courses.</li>
        <li><strong>Pas d’idées.</strong> Quand personne ne sait quoi cuisiner, la note attend.</li>
      </ul>
      <p>
        Le partage, Notes le fait bien. Prévoir les dîners et en tirer une liste, c’est la partie qui vous reste.
      </p>

      <h2 id="pinto-notes">Un planning repas qui écrit la liste de courses</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Une note Groceries dans Pinto Notes sur Mac. Les cinq lignes que ChatGPT vient d’ajouter sont teintées, et une barre en bas indique que ChatGPT a changé 5 lignes, avec Undo." }}
        caption="Une note Groceries dans Pinto Notes sur Mac. Les cinq lignes que ChatGPT vient d’ajouter sont teintées, avec Undo (annuler) en bas." />
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/meal-plan">Meal plan and groceries</a> (repas et
        courses) est une note avec les dîners de la semaine et qui cuisine, les courses par rayon, et ce qui est toujours dans le placard.
      </p>
      <p>
        Le week-end, demandez à votre IA de prévoir la semaine. Elle demande quels soirs vous cuisinez et ce qu’il faut éviter, propose des
        dîners, remplit la semaine, puis écrit la liste de courses par rayon sans ce qui est déjà dans le placard. Dites « ajoute du lait
        d’avoine » le mercredi, et il arrive sous le bon rayon. Chaque ligne ajoutée est teintée, avec Undo, et chaque version précédente de
        la note est gardée. <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Vos notes Apple arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en anglais), et Notes reste
        tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
