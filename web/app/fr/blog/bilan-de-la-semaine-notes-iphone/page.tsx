import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "bilan-de-la-semaine-notes-iphone");

// French version of /blog/apple-notes-weekly-review-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes
// sur Mac": « Trier automatiquement les tâches terminées » dans les réglages de Notes), support.apple.com/fr-fr/guide/
// notes/apdb54e469b6/mac ("Trier et épingler les notes") and support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac
// ("Utiliser des tags": # then a word, the Tags section of the sidebar). Édition > Coller au format Markdown and the
// Checklist button (Liste de pointage) are the French strings in Notes' MainMenu.loctable and Localizable.loctable on
// macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "bilan de la semaine" (mon bilan de
// la semaine, mostly school pages) and "bilan hebdomadaire" (exemple; its iphone suggestions are Screen Time), with
// "weekly review" (template, questions, journal) also suggested in English; "revue hebdomadaire" means a magazine.
// Hence the slug "bilan de la semaine notes iphone". Facts are the English post's; the picture is its own, described
// in French.

const ui = UI.fr;

const TEMPLATE = `# Bilan de la semaine

Vingt minutes le dimanche. La semaine la plus récente en haut.

## Questions
1. Qu’est-ce qui s’est bien passé cette semaine ?
2. Qu’est-ce qui n’a pas marché, et pourquoi ?
3. Qu’est-ce que j’ai appris ?
4. Pour quoi suis-je reconnaissant ?
5. Mes trois priorités pour la semaine prochaine ?

## Semaine du 2 novembre
- Bien passé : rapport rendu un jour en avance ; quatre séances de sport.
- Pas marché : pas de travail de fond jeudi, trop de réunions.
- Appris : un ordre du jour de 30 minutes vaut mieux qu’une réunion d’une heure.
- Reconnaissant pour : le dîner avec ma sœur.
- [ ] Bloquer les jeudis matin pour le travail de fond
- [ ] Envoyer le plan du T4 à Jonas
- [ ] Prendre rendez-vous chez le dentiste
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de bilan de la semaine ?", a: [
    "Non. Notes n’a aucun modèle. Une note avec vos questions en haut et un sous-titre par semaine en dessous en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Quelles questions mettre dans un bilan de la semaine ?", a: [
    "Cinq suffisent : ce qui s’est bien passé, ce qui n’a pas marché et pourquoi, ce que vous avez appris, ce pour quoi vous êtes reconnaissant, et vos trois priorités pour la semaine suivante. La dernière, c’est celle qui vous servira le lundi.",
  ] },
  { q: "Une note par semaine, ou une note pour toutes les semaines ?", a: [
    "Une note pour toutes les semaines, la plus récente en haut. Les trois priorités de la semaine passée sont juste sous celles de cette semaine, et la recherche trouve un mot dans toutes.",
  ] },
  { q: "Existe-t-il un bilan de la semaine qui me pose les questions ?", a: [
    "Pinto Notes a un modèle gratuit Weekly review. Dites à ChatGPT ou Claude que c’est l’heure du bilan : il pose les cinq questions une par une, puis écrit la semaine dans votre note.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="bilan-de-la-semaine-notes-iphone"
      intro={<>
        Un bilan de la semaine, c’est vingt minutes le dimanche qui évitent un lundi flou. Il ne marche que si les questions sont les mêmes
        chaque semaine : leur place est dans une note que vous gardez. Voici un modèle de bilan de la semaine pour Notes, comment en faire
        une habitude, et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#dimanche", label: "Le dimanche" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un bilan qui vous interroge" },
        ]}>
          <p>
            Notes n’a pas de modèle de bilan de la semaine, mais une note fait l’affaire : cinq questions en haut, puis un sous-titre par
            semaine avec vos réponses en lignes courtes et les trois priorités de la semaine suivante en liste de pointage. Ajoutez la
            semaine la plus récente en haut, pour que le plan de la semaine passée soit juste en dessous.
          </p>
          <PostCta template="weekly-review" slug="fr/bilan-de-la-semaine-notes-iphone" path="/fr/blog/bilan-de-la-semaine-notes-iphone" position="answer" ui={ui.cta}
            title="Les questions posées pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de bilan de la semaine. ChatGPT ou Claude vous pose les cinq questions, puis écrit la semaine dans votre note.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-review-note" width={1520} height={989} maxWidth={600}
        alt="Une note Weekly review dans Pinto Notes sur Mac : cinq questions numérotées, puis le bilan Week of 2 November avec ce qui s’est bien passé, ce qui n’a pas marché, ce qui a été appris et un remerciement, et une liste de pointage des trois priorités avec Book the dentist coché."
        caption="Un bilan de la semaine dans Pinto Notes, tel que le modèle l’écrit. La même mise en page marche dans Notes, avec un sous-titre par semaine. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : cinq questions, une note</h2>
      <p>
        Les questions sont en haut pour que vous n’ayez jamais à vous en souvenir. Chaque semaine a un sous-titre avec la date du lundi, une
        ligne par réponse, et les trois priorités en liste de pointage que vous cochez pendant la semaine. Gardez un mot sur chaque ligne,
        car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Bilan de la semaine pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <ul>
        <li>
          <strong>Collez-le une fois.</strong> Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La
          ligne # devient le titre, chaque ligne ## un sous-titre et les trois priorités une liste de pointage. Un simple Commande + V garde
          les symboles en texte. Sur iPhone, tapez-le, sélectionnez les trois priorités et touchez le bouton Liste de pointage.
        </li>
        <li>
          <strong>Gardez la semaine d’exemple comme guide.</strong> Laissez-la pour votre premier dimanche, puis remplacez-la par la vôtre.
        </li>
        <li>
          <strong>Épinglez-la.</strong> Épinglez la note en haut de son dossier : elle est là quand vous ouvrez Notes le dimanche.
        </li>
      </ul>

      <h2 id="dimanche">Le dimanche</h2>
      <ul>
        <li>
          <strong>Commencez par les trois priorités de la semaine passée.</strong> Cochez ce qui a été fait avant d’écrire quoi que ce soit.
          Ce qui reste ouvert passe dans les trois de la semaine suivante, ou est abandonné exprès.
        </li>
        <li>
          <strong>Ajoutez la nouvelle semaine en haut.</strong> Copiez le bloc de la semaine passée, collez-le sous les questions et changez la
          date et les lignes. Quelques mots par réponse suffisent, tant que vous les comprenez encore dans un mois.
        </li>
        <li>
          <strong>Choisissez trois priorités, pas dix.</strong> Trois choses que vous serez content d’avoir faites d’ici vendredi. Avec Trier
          automatiquement les tâches terminées activé, ce qui est coché descend en bas de la liste.
        </li>
        <li>
          <strong>Relisez une fois par mois.</strong> La recherche lit chaque mot : chercher « réunions » montre combien de fois elles ont été
          le problème. Un tag comme #bilan dans la note la garde à un toucher dans la barre latérale.
        </li>
      </ul>
      <p>
        Un bilan de la semaine plus court, sur la même idée, fait partie des notes de <a href="/blog/apple-notes-templates">Apple Notes
        templates</a> (en anglais). Pour suivre ce que vous faites chaque jour entre deux bilans, le{" "}
        <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes dans Notes</a> se range à côté, et le{" "}
        <a href="/fr/blog/journal-intime-notes-iphone">journal dans Notes</a> est fait pour les journées elles-mêmes.
      </p>

      <h2 id="limites">Là où un bilan de la semaine dans Notes s’arrête</h2>
      <ul>
        <li><strong>Les questions ne se posent pas toutes seules.</strong> Un dimanche fatigué, une liste de questions se saute facilement.</li>
        <li><strong>Le report se fait à la main.</strong> Les éléments non cochés de la semaine passée restent où ils sont tant que vous ne les recopiez pas.</li>
        <li><strong>Voir des tendances, c’est relire.</strong> La recherche trouve un mot. Elle ne vous dit pas ce qui revient sans cesse sur deux mois de bilans.</li>
      </ul>
      <p>
        Si l’habitude tient déjà, la note suffit. Si elle saute les semaines chargées, c’est quelqu’un pour poser les questions qui manque.
      </p>

      <h2 id="pinto-notes">Un bilan de la semaine qui vous interroge</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/weekly-review">Weekly review</a> (bilan de la
        semaine) est une note avec les cinq questions et une partie Reviews, la semaine la plus récente d’abord.
      </p>
      <p>
        Dites à votre IA que c’est l’heure du bilan. Elle pose les cinq questions une par une, puis ajoute la semaine en haut de Reviews :
        un sous-titre Week of avec la date du lundi, vos réponses en lignes courtes avec vos mots, et vos trois priorités en liste de
        pointage. Dites-lui qu’une priorité est faite et elle la coche. Demandez « sur quoi je voulais me concentrer la semaine dernière ? »
        ou « qu’est-ce qui revient sans cesse dans mes bilans ? » et elle relit la note pour répondre. Vous pouvez toujours tout écrire et
        cocher vous-même, et chaque version précédente de la note est gardée. Cette partie marche une fois ChatGPT ou Claude connecté ;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Les notes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
