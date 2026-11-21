import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-des-habitudes-notes-iphone");

// French version of /blog/apple-notes-habit-tracker (templates translation, 21 Nov 2026). Apple's own French words, all
// read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes sur Mac":
// Format > Plus > « Tout cocher » ou « Tout décocher », « Trier automatiquement les tâches terminées » dans les réglages
// de Notes, liste de pointage) and support.apple.com/fr-fr/guide/notes/apd58edc7964/mac ("Utiliser les dossiers
// intelligents": « Listes de pointage » in the first menu). Édition > Coller au format Markdown (new in macOS 27),
// Fichier > Dupliquer la note and the Smart Folder value Non coché are the French strings in Notes' MainMenu.loctable and
// SmartFolderChecklistsFilterView.loctable on macOS 27.2; the bouton Liste de pointage is the pilot's word. Search words:
// Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "suivi des habitudes" (with notion, à imprimer, app, tableau)
// and, for the iPhone, "habit tracker iphone notes"; nobody types a French Notes phrase yet, so the slug is "suivi des
// habitudes notes iphone". Facts are the English post's; the pictures are its own, described in French.

const ui = UI.fr;

const DAY = `- [ ] Marcher 20 minutes
- [ ] Lire 10 pages
- [ ] Au lit avant 23h`;

const TEMPLATE = `# Habitudes, semaine du 16 novembre

## Lundi
${DAY}

## Mardi
${DAY}

## Mercredi
${DAY}

## Jeudi
${DAY}

## Vendredi
${DAY}

## Samedi
${DAY}

## Dimanche
${DAY}

## Bilan de la semaine
- Tenu :
- Raté :
`;

const FAQ = [
  { q: "Notes a-t-il un suivi des habitudes ?", a: [
    "Non. Notes n’a ni suivi des habitudes ni modèles. Une note avec un sous-titre par jour et une liste de pointage de vos habitudes dessous en fait office : vous cochez les habitudes au fil de la journée et repartez d’une copie neuve chaque semaine.",
  ] },
  { q: "Comment décocher toute une liste de pointage dans Notes ?", a: [
    "Sur Mac, cliquez dans la liste de pointage et choisissez Format, Plus, Tout décocher. Vous perdez alors ce que vous aviez coché : pour un suivi des habitudes, dupliquez d’abord la note et décochez la copie.",
  ] },
  { q: "Notes peut-il compter mes séries ?", a: [
    "Non. Notes ne compte pas les coches d’une note à l’autre ni d’un jour à l’autre. Une série, c’est vous qui la comptez, en remontant les semaines.",
  ] },
  { q: "Existe-t-il un suivi des habitudes gratuit qui fonctionne comme une note ?", a: [
    "Pinto Notes a un modèle gratuit de suivi des habitudes : une note qui est une petite app, avec l’anneau de la semaine, une coche par habitude, les séries et une vue du mois. ChatGPT ou Claude peut y noter ce que vous avez fait.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="suivi-des-habitudes-notes-iphone"
      intro={<>
        Vous voulez suivre quelques habitudes dans l’app que vous ouvrez déjà tous les jours, pas vous inscrire sur une autre. Notes sait
        en faire une version simple. Voici un modèle de semaine à coller, comment le tenir, et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#chaque-semaine", label: "Chaque semaine" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un suivi qui compte" },
        ]}>
          <p>
            Notes n’a pas de suivi des habitudes, mais une liste de pointage fait le travail du jour. Créez une note par semaine avec un
            sous-titre pour chaque jour et vos habitudes en liste de pointage dessous, cochez-les au fil de la journée, et dupliquez la note
            le lundi. Copiez le modèle ci-dessous.
          </p>
          <PostCta template="habit-tracker" slug="fr/suivi-des-habitudes-notes-iphone" path="/fr/blog/suivi-des-habitudes-notes-iphone" position="answer" ui={ui.cta}
            title="Vos séries comptées pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de suivi des habitudes : cochez une habitude d’un toucher et voyez l’anneau de la semaine, vos séries et le mois. ChatGPT ou Claude peut noter la journée pour vous.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/template-copies" width={1200} height={750} maxWidth={560}
        alt="Trois cartes de listes de pointage dessinées, en éventail, avec des bâtons de comptage à côté."
        caption="Un suivi des habitudes dans Notes, c’est une liste de pointage que vous recopiez chaque semaine." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une semaine d’habitudes</h2>
      <p>
        Trois habitudes, sept jours, et une place pour le bilan de la semaine. Mettez vos propres habitudes avant de coller ; gardez un mot
        sur chaque ligne, car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Suivi des habitudes de la semaine pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Le même Markdown collé deux fois dans Notes sur macOS 27 : avec Commande + V, les symboles restent du texte ; avec Coller au format Markdown, ils deviennent un titre, une liste et du texte en gras."
        caption="Collage simple à gauche, Coller au format Markdown à droite. C’est pareil pour les lignes de liste de pointage." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La ligne # devient le titre, chaque jour
        devient un sous-titre et les lignes <code>- [ ]</code> deviennent une liste de pointage à cocher. Un simple Commande + V garde les
        symboles en texte. Sur iPhone, tapez les habitudes ligne par ligne, sélectionnez-les et touchez le bouton Liste de pointage.
      </p>
      <p>
        Deux réglages aident. Cochez Trier automatiquement les tâches terminées dans les réglages de Notes, et ce que vous avez fait descend
        en bas de chaque jour. Et un dossier intelligent avec la règle Listes de pointage, Non coché affiche toutes les notes où il reste
        quelque chose à cocher ; <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> (en anglais) montre comment en
        créer un.
      </p>

      <h2 id="chaque-semaine">Chaque semaine</h2>
      <p>
        Le lundi, sélectionnez la note de la semaine passée et choisissez Fichier, Dupliquer la note, puis changez la date dans le titre et
        décochez tout : cliquez dans la liste de chaque jour et choisissez Format, Plus, Tout décocher. Gardez les anciennes notes dans un
        dossier Habitudes. Ce dossier, c’est votre historique.
      </p>
      <p>
        Si vous tenez d’autres routines de cette façon, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais) propose
        un bilan de la semaine et une liste du jour à coller de la même manière. Si l’une de vos habitudes est la salle de sport, un{" "}
        <a href="/fr/blog/carnet-musculation-notes-iphone">carnet de musculation dans Notes</a> garde les séries et vos records.
      </p>

      <h2 id="limites">Là où un suivi des habitudes dans Notes s’arrête</h2>
      <ul>
        <li><strong>Pas de séries.</strong> Notes ne compte pas les coches : combien de jours d’affilée vous avez marché, vous le comptez en remontant les anciennes semaines.</li>
        <li><strong>Pas de vue de la semaine.</strong> Chaque jour est sa propre liste. Voir quelle habitude vous ratez le plus, c’est relire toute la note.</li>
        <li><strong>Chaque habitude, chaque jour.</strong> Une habitude prévue trois fois par semaine, ou huit verres d’eau, ne tient pas dans une seule coche.</li>
        <li><strong>Une copie chaque lundi.</strong> Oubliez de dupliquer, et les coches de la semaine atterrissent dans la note de la semaine passée.</li>
      </ul>
      <p>
        Pour trois habitudes et un peu de discipline, la note marche. Au-delà, vous faites à la main le suivi qu’une app pourrait faire.
      </p>

      <h2 id="pinto-notes">Un suivi des habitudes qui compte pour vous</h2>
      <Figure shot={{ ...SHOTS.habitApp, alt: "L’app de suivi des habitudes dans une note Pinto Notes sur Mac : l’anneau de la semaine à 62 pour cent, 2 habitudes sur 6 faites aujourd’hui, une grille de la semaine pour chaque habitude, et les habitudes avec leurs coches et leurs séries, dont Gym à 1 sur 3 cette semaine." }}
        caption="Le modèle de suivi des habitudes dans Pinto Notes sur Mac, avec des données d’exemple : l’anneau de la semaine, les habitudes du jour avec leurs séries, et Gym à 1 sur 3 cette semaine." />
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et une note peut aussi être une petite app. Le modèle
        gratuit <a href="/templates/habit-tracker">Habit tracker</a> (suivi des habitudes) en est une. Vous choisissez vos habitudes une
        fois, vous les cochez d’un toucher, et il affiche l’anneau de la semaine, la série et le record de chaque habitude, et un mois que
        vous pouvez remplir après coup. Une habitude peut être quotidienne, certains jours de la semaine, quelques fois par semaine, ou un
        compte, comme des verres d’eau.
      </p>
      <p>
        Vous pouvez aussi dire à ChatGPT ou Claude ce que vous avez fait, dans la conversation que vous utilisez déjà, et la journée est
        cochée dans la note. Demandez quelle habitude vous avez le plus ratée ce mois-ci, et il lit le suivi pour répondre.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Vos notes Apple arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en anglais), et Notes reste
        tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
