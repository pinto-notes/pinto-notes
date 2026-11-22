import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "carnet-musculation-notes-iphone");

// French version of /blog/apple-notes-workout-log-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes
// sur Mac": Format > Plus > « Tout décocher »), support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac ("Trier et épingler
// les notes sur Mac": épingler, en haut de la liste) and support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (Format >
// Tableau). Édition > Coller au format Markdown and Fichier > Dupliquer la note are the French strings in Notes'
// MainMenu.loctable on macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "carnet
// musculation" (gratuit, application, excel, pdf), "suivi musculation" (excel, apple watch, notion, application) and
// "programme musculation"; the French Notes phrases return nothing, so the slug is "carnet musculation notes iphone".
// The example keeps the English post's push, pull and legs week in French gym words, in kilos. Facts are the English
// post's; the picture is its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Carnet de musculation, semaine du 23 novembre

## Programme
- Jambes : squat, fentes, mollets
- Poussée : développé couché, développé militaire, dips
- Tirage : soulevé de terre, rowing, tractions

## Lundi : jambes
- [ ] Squat 3 x 5 à 100 kg
- [ ] Fentes 3 x 10 à 16 kg
- [ ] Mollets 3 x 15

## Mercredi : poussée
- [ ] Développé couché 3 x 6 à 70 kg
- [ ] Développé militaire 3 x 8 à 40 kg
- [ ] Dips 3 x 10

## Vendredi : tirage
- [ ] Soulevé de terre 3 x 3 à 120 kg
- [ ] Rowing 3 x 8 à 60 kg
- [ ] Tractions 3 x 6

## Records personnels
- Soulevé de terre : 120 kg x 3 (6 nov.)
- Squat : 100 kg x 5 (2 nov.)
- Développé couché : 70 kg x 6 (4 nov.)
- Course 5 km : 29 min (5 nov.)
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de carnet de musculation ?", a: [
    "Non. Notes n’a ni modèles ni carnet d’entraînement. Une note par semaine, avec un sous-titre par jour d’entraînement et les séries en liste de pointage, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Noter ses séances dans une liste de pointage ou dans un tableau ?", a: [
    "La liste de pointage est plus rapide à la salle : cochez chaque série et changez la charge si elle était différente. Un tableau, avec Format, Tableau, aligne les dates et les charges, mais Notes ne sait ni le trier ni en faire la somme, donc il aide moins qu’il n’en a l’air.",
  ] },
  { q: "Comment suivre ses records dans Notes ?", a: [
    "Gardez une liste Records personnels en bas de la note et changez une ligne quand vous la battez, avec la date. Notes ne repère pas un nouveau record pour vous : relisez la liste après chaque séance.",
  ] },
  { q: "Existe-t-il un carnet de musculation qui tient mes records pour moi ?", a: [
    "Pinto Notes a un modèle gratuit Workout log : une ligne par séance et une liste de records. Après l’entraînement, dites à ChatGPT ou Claude ce que vous avez fait : il note la séance et met vos records à jour.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="carnet-musculation-notes-iphone"
      intro={<>
        Une app de musculation veut un compte, un programme et un abonnement avant votre premier squat. Une note ne veut que les séries.
        Voici un modèle de carnet de musculation à coller dans Notes, comment s’en servir à la salle, et quand il ne suffit plus.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#salle", label: "À la salle" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un carnet qui tient vos records" },
        ]}>
          <p>
            Notes n’a pas de carnet d’entraînement, mais une note par semaine fait l’affaire. Mettez votre programme en haut, un sous-titre par
            jour d’entraînement avec les séries en liste de pointage, et vos records en bas. Copiez le modèle ci-dessous, et dupliquez-le
            chaque semaine.
          </p>
          <PostCta template="workout-log" slug="fr/carnet-musculation-notes-iphone" path="/fr/blog/carnet-musculation-notes-iphone" position="answer" ui={ui.cta}
            title="Vos records tenus pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de carnet d’entraînement. Après la séance, dites à ChatGPT ou Claude ce que vous avez fait : il note la séance et met vos records à jour.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/workout-log-note" width={1520} height={1020} maxWidth={640}
        alt="Une note Workout log dans Pinto Notes sur Mac : un tableau Sessions avec une ligne par séance, d’un jour Pull avec Deadlift 115 kg x 3 jusqu’à Deadlift 120 kg x 3, et une liste Personal bests en dessous."
        caption="Le même carnet dans Pinto Notes : une ligne par séance, et vos records tenus à jour. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note par semaine</h2>
      <p>
        Une semaine jambes, poussée, tirage, pour l’exemple. Remplacez le programme et les exercices par les vôtres, puis les charges. Gardez
        un mot sur chaque ligne, car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Carnet de musculation pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La ligne # devient le titre, chaque ligne
        ## un sous-titre, et les séries deviennent des listes de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone,
        tapez les lignes, sélectionnez les séries et touchez le bouton Liste de pointage. Rangez la note dans un dossier Santé et épinglez-la :
        c’est la première chose que vous voyez en ouvrant Notes à la salle.
      </p>

      <h2 id="salle">À la salle</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Fichier", "Dupliquer la note"] },
        { on: "Mac", steps: ["Format", "Plus", "Tout décocher"] },
      ]} />
      <ul>
        <li>
          <strong>Cochez chaque série une fois finie.</strong> Si la charge ou les répétitions étaient différentes, changez la ligne sur le
          moment : « Squat 3 x 5 à 102,5 kg ». Cette ligne modifiée, c’est votre carnet.
        </li>
        <li>
          <strong>Notez le ressenti.</strong> Un mot après la ligne, comme « facile » ou « dernière répétition lente », vous dira la semaine
          prochaine s’il faut ajouter du poids.
        </li>
        <li>
          <strong>La semaine suivante à partir de celle-ci.</strong> Le dimanche, choisissez Fichier, Dupliquer la note, changez la date et
          les charges, puis cliquez dans chaque jour et choisissez Format, Plus, Tout décocher.
        </li>
        <li>
          <strong>Un nouveau record va en bas.</strong> Quand une série bat une ligne de Records personnels, changez cette ligne et sa date.
        </li>
      </ul>
      <p>
        Si vous préférez voir les semaines en grille, Format, Tableau en crée une ; <a href="/blog/apple-notes-tables">tables in Apple
        Notes</a> (en anglais) montre comment, et ce que les tableaux ne savent pas faire. Pour suivre des habitudes plutôt que des séries,
        il y a un <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes dans Notes</a>, et d’autres notes à coller comme
        celle-ci dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où un carnet de musculation dans Notes s’arrête</h2>
      <ul>
        <li><strong>Chaque semaine est une note à part.</strong> Pour voir comment votre développé couché a évolué ce mois-ci, vous ouvrez quatre notes et les lisez côte à côte.</li>
        <li><strong>Les records à la main.</strong> Notes ne remarque pas que 120 kg bat 115 kg. Vous relisez la liste et la changez vous-même, ou pas.</li>
        <li><strong>Les tableaux ne comptent pas.</strong> Un tableau dans Notes ne sait ni trier par exercice ni additionner le volume de la semaine.</li>
        <li><strong>Pas de réponses.</strong> « Qu’est-ce que j’ai fait mercredi dernier ? », c’est faire défiler.</li>
      </ul>
      <p>
        Pour une semaine, une note est le carnet le plus rapide qui soit. Sur des mois, la partie utile, voir que vous progressez, vous
        revient.
      </p>

      <h2 id="pinto-notes">Un carnet de musculation qui tient vos records</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/workout-log">Workout log</a> (carnet d’entraînement)
        est une seule note pour tout votre entraînement : un tableau avec une ligne par séance, la date, la séance, l’exercice, le résultat et
        l’effort ressenti de 1 à 10, et vos records en dessous.
      </p>
      <p>
        Après la séance, dites à votre IA ce que vous avez fait : « soulevé de terre, 120 pour trois, effort à neuf ». Elle ajoute la ligne
        et, si c’est un nouveau record, change aussi cette ligne-là. Demandez ensuite « est-ce que je progresse au développé couché ? » ou
        « qu’est-ce que j’ai fait mercredi dernier ? », et elle répond à partir de tout le carnet. Vous pouvez toujours ajouter et modifier
        chaque ligne vous-même, et chaque version précédente de la note est gardée.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Vos notes Apple arrivent en <a href="/blog/import-your-notes">un seul import sur votre Mac</a> (en anglais), et Notes reste
        tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
