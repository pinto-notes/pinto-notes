import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-des-decisions-notes-iphone");

// French version of /blog/apple-notes-decision-log-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apde615d29c2/mac ("Ajouter des liens dans Notes
// sur Mac": Édition > Ajouter un lien), support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Ajouter un lien,
// Commande + K), support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac ("Utiliser des tags": # then a word),
// support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler) and support.apple.com/fr-fr/102462 (compte Apple).
// Édition > Coller au format Markdown is the French string in Notes' MainMenu.loctable on macOS 27.2. Search words:
// Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "suivi des décisions" and "tableau de suivi des décisions";
// "registre des décisions" is the legal register of a company (associé unique), "journal des décisions" gives nothing,
// and "decision log" (template) is suggested in English. Hence the slug "suivi des decisions notes iphone", with
// "journal des décisions" used in the text for the note itself. Facts are the English post's; the picture is its own,
// described in French.

const ui = UI.fr;

const TEMPLATE = `# Journal des décisions

Chaque décision qui compte : ce qu’on a choisi, ce qu’on n’a pas choisi, et pourquoi. La plus récente en haut.

## Questions ouvertes
- Prend-on en charge la modification hors ligne dès la première version ?
- Qui reprend l’outil d’import après le lancement ?

## On reste sur Postgres, 4 novembre
- Contexte : les notes ont atteint 2 millions de lignes et la recherche est devenue lente.
- Options : une base orientée documents, un service de recherche, ou de meilleurs index.
- Choix : Postgres avec un index trigramme.
- Pourquoi : une seule base à gérer, et l’index a rendu la recherche 40 fois plus rapide.
- À revoir : à 20 millions de lignes.

## Une mise en production chaque mardi, 2 novembre
- Contexte : les versions prenaient du retard dès qu’un correctif n’était pas prêt.
- Choix : livrer ce qui est prêt chaque mardi.
- Pourquoi : les petites versions sont plus faciles à annuler.
`;

const FAQ = [
  { q: "Que mettre dans un journal des décisions ?", a: [
    "Pour chaque décision : la date, le contexte, les options envisagées, ce que vous avez choisi, pourquoi, et quand y revenir. Le pourquoi et les options sont les parties qu’on oublie d’écrire et dont on a le plus besoin ensuite.",
  ] },
  { q: "Notes a-t-il un modèle de suivi des décisions ?", a: [
    "Non. Notes n’a aucun modèle. Une note avec un sous-titre par décision, la plus récente en haut, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Un journal des décisions, en tableau ou en liste ?", a: [
    "Dans un tableur, en tableau. Dans Notes, un sous-titre par décision se lit mieux : on ne peut pas faire glisser la largeur des colonnes, et un long pourquoi s’écrase dans une cellule étroite.",
  ] },
  { q: "Existe-t-il un journal des décisions qui répond à « pourquoi on a choisi ça » ?", a: [
    "Pinto Notes a un modèle gratuit Decision log. Dites à ChatGPT ou Claude ce que vous avez décidé et il note le contexte, les options et le pourquoi. Plus tard, demandez pourquoi vous avez choisi quelque chose et il cite l’entrée.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="suivi-des-decisions-notes-iphone"
      intro={<>
        Les équipes rediscutent des questions réglées parce que personne n’a écrit pourquoi elles l’étaient. Un journal des décisions règle
        ça, et il n’a besoin ni de Confluence ni d’un tableur. Voici un modèle de suivi des décisions pour Notes, comment le tenir, et là où
        il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#tenir", label: "Le tenir" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un journal qui se souvient du pourquoi" },
        ]}>
          <p>
            Notes n’a pas de modèle de suivi des décisions, mais une note fait l’affaire : les questions ouvertes en haut, puis un sous-titre
            par décision avec sa date, et dessous le contexte, les options, ce que vous avez choisi, pourquoi, et quand y revenir. La plus
            récente en haut, pour que les dernières décisions soient la première chose que vous lisez.
          </p>
          <PostCta template="decision-log" slug="fr/suivi-des-decisions-notes-iphone" path="/fr/blog/suivi-des-decisions-notes-iphone" position="answer" ui={ui.cta}
            title="Les décisions notées pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un journal des décisions gratuit. Dites à ChatGPT ou Claude ce que vous avez décidé et il écrit les options et le pourquoi, puis le retrouve quand vous demandez.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/decision-log-note" width={1520} height={1055} maxWidth={600}
        alt="Une note Decision log dans Pinto Notes sur Mac : deux questions ouvertes, puis une décision Stay on Postgres du 4 novembre avec son contexte, ses options, le choix, la raison et quand y revenir, et une décision Release every Tuesday en dessous."
        caption="Un journal des décisions dans Pinto Notes, tel que le modèle l’écrit. La même mise en page marche dans Notes. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un sous-titre par décision</h2>
      <p>
        Chaque entrée tient en cinq lignes courtes. Contexte dit ce qui a forcé le choix. Options liste ce que vous n’avez pas pris : c’est la
        ligne qui empêche la même idée de revenir au trimestre suivant. À revoir dit quand la réponse pourrait changer, pour qu’elle ne soit
        pas prise pour définitive. Les petites décisions peuvent sauter Options, comme la mise en production du mardi ci-dessous.
      </p>
      <Keep title="Journal des décisions pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
        { on: "Mac", steps: ["Édition", "Ajouter un lien"], keys: "⌘K" },
      ]} />
      <ul>
        <li>
          <strong>Collez-le une fois.</strong> Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La
          ligne # devient le titre et chaque ligne ## un sous-titre. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-le.
        </li>
        <li>
          <strong>Un journal par projet.</strong> Gardez-le dans le dossier du projet et épinglez-le en haut : il est à côté des notes qu’il
          explique.
        </li>
        <li>
          <strong>Partagez-le avec l’équipe.</strong> Si tout le monde utilise Notes, partagez la note pour que chacun puisse ajouter ses
          décisions. Chacun a besoin d’un compte Apple.
        </li>
      </ul>

      <h2 id="tenir">Le tenir</h2>
      <ul>
        <li>
          <strong>Notez-la le jour même.</strong> Le pourquoi n’est jamais aussi clair qu’à la fin de la réunion où vous avez décidé. Une
          semaine plus tard, c’est déjà une supposition.
        </li>
        <li>
          <strong>Descendez les questions une fois réglées.</strong> Quand une question ouverte est tranchée, supprimez-la des Questions
          ouvertes et écrivez son entrée en haut des décisions.
        </li>
        <li>
          <strong>Faites un lien depuis l’endroit où elle est née.</strong> Dans le compte rendu de réunion, sélectionnez la décision et
          choisissez Édition, Ajouter un lien vers le journal : la réunion et les raisons restent reliées.
        </li>
        <li>
          <strong>Cherchez avant de rediscuter.</strong> La recherche lit chaque mot de chaque note : « Postgres » trouve l’entrée avant que
          quelqu’un ne cale une réunion sur le sujet. Un tag #décision sur les comptes rendus qui ont changé quelque chose aide aussi.
        </li>
      </ul>
      <p>
        La plupart des décisions naissent en réunion, et le <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de réunion
        dans Notes</a> a un sous-titre Décisions exactement pour ça. D’autres notes à coller sont dans{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où un journal des décisions dans Notes s’arrête</h2>
      <ul>
        <li><strong>Quelqu’un doit l’écrire.</strong> Après une longue réunion, le journal est la première chose qu’on saute.</li>
        <li><strong>Le pourquoi disparaît.</strong> Rien ne demande la raison quand quelqu’un ne note que le choix.</li>
        <li><strong>La recherche trouve des mots, pas des réponses.</strong> Elle trouve chaque note qui dit Stripe. Elle ne répond pas à « pourquoi Stripe plutôt que Paddle ? »</li>
        <li><strong>Le partage demande un compte Apple.</strong> Chaque personne de l’équipe en a besoin pour ouvrir et modifier le journal partagé.</li>
      </ul>

      <h2 id="pinto-notes">Un journal des décisions qui se souvient du pourquoi</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/decision-log">Decision log</a> (journal des
        décisions) est une note avec Open questions et Decisions, la plus récente en haut.
      </p>
      <p>
        Racontez une décision à votre IA avec vos mots. Elle ajoute une entrée en haut avec la décision en quelques mots et la date, puis
        le contexte, les options envisagées, ce que vous avez choisi, pourquoi, et quand y revenir, une ligne courte pour chacun. Si vous
        n’avez pas dit pourquoi, elle demande. Les questions pas encore tranchées vont sous Open questions, et en sortent une fois décidées.
        Des mois plus tard, demandez « pourquoi on a pris Stripe plutôt que Paddle ? » et elle trouve l’entrée et la cite, ou demandez
        « qu’est-ce qui n’est pas encore décidé ? ». Vous pouvez toujours écrire et modifier chaque entrée vous-même, et chaque version
        précédente de la note est gardée. Cette partie marche une fois ChatGPT ou Claude connecté ;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Dans <a href="/blog/notes-in-claude-code-and-codex">Claude Code</a> (en anglais), le modèle a ses propres instructions pour les
        décisions techniques d’un projet. Quand vous arrêtez une bibliothèque, un schéma ou une architecture, il note l’entrée avec les
        fichiers concernés, et avant de proposer un changement, il lit le journal pour vérifier qu’il ne défait pas une décision.
      </p>
      <p>
        Les notes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
