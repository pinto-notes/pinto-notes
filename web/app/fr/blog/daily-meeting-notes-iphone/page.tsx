import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "daily-meeting-notes-iphone");

// French version of /blog/apple-notes-daily-standup-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes
// sur Mac": « Trier automatiquement les tâches terminées » dans les réglages de Notes), support.apple.com/fr-fr/guide/
// notes/apdb54e469b6/mac (épingler) and support.apple.com/fr-fr/guide/notes/apdb5106e334/mac ("Enregistrer et
// transcrire de l’audio": transcription, and a résumé with Apple Intelligence). Édition > Coller au format Markdown and
// the Checklist button (Liste de pointage) are the French strings in Notes' MainMenu.loctable and Localizable.loctable
// on macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "daily meeting" (scrum,
// standup), "daily scrum" (format, agile), "daily stand up" (meeting, questions) and "stand up meeting" (c'est quoi, en
// français, format, agenda, template); French teams say "le daily" and keep the English words. Hence the slug "daily
// meeting notes iphone". Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Notes de daily

## Bloquants
- En attente des clés d’API du prestataire de paiement de préprod

## Vendredi 6 novembre
Hier
- Corrigé le conflit de synchro quand deux appareils modifient la même note
- Ajouté des tests sur la gestion des tableaux par l’import

Aujourd’hui
- [ ] Relire la pull request de l’onboarding
- [ ] Commencer l’export en PDF

## Jeudi 5 novembre
Hier
- Travaillé en binôme avec Emma sur l’import

Aujourd’hui
- [x] Corriger le conflit de synchro
- [x] Écrire les tests des tableaux de l’import
`;

const TEAM = `# Daily d’équipe, semaine du 2 novembre

## Bloquants
- [ ] Sara : en attente des clés d’API du prestataire de paiement de préprod

## Vendredi 6 novembre
- Sara : conflit de synchro corrigé. Aujourd’hui, la relecture de l’onboarding.
- Jonas : total du paiement déplacé. Aujourd’hui, la vérification de la TVA.
- Emma : tests de l’import terminés. Aujourd’hui, l’export en PDF.
`;

const FAQ = [
  { q: "Que doit contenir une note de daily ?", a: [
    "Trois choses : ce que vous avez fait hier, ce que vous ferez aujourd’hui, et ce qui vous bloque. Quelques puces courtes pour chacune. Gardez les bloquants en haut de la note : c’est la partie sur laquelle quelqu’un d’autre peut agir.",
  ] },
  { q: "Notes a-t-il un modèle de daily ?", a: [
    "Non. Notes n’a aucun modèle. Une note suivie avec un sous-titre par jour, le plus récent en haut, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Comment faire le compte rendu d’un daily scrum ?", a: [
    "Une note par sprint ou par semaine, un sous-titre par jour, et une ligne par personne avec ce qu’elle a fait et ce qui vient. Écrivez les bloquants en liste de pointage avec le nom de la personne en premier, et cochez chacun quand il est levé.",
  ] },
  { q: "Claude Code peut-il écrire mon daily à partir de mes commits ?", a: [
    "Avec Pinto Notes connecté, oui. Le modèle Standup notes a ses propres instructions pour Claude Code : il lit vos commits depuis hier, en fait quelques puces simples, demande ce qui vient, et écrit la journée dans votre note.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="daily-meeting-notes-iphone"
      intro={<>
        La plupart des daily commencent par quelqu’un qui essaie de se souvenir d’hier. Une note que vous écrivez au fil de l’eau règle ça.
        Voici un modèle de notes de daily à coller dans Notes, une version pour toute l’équipe, et là où Notes s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#chaque-jour", label: "Chaque jour" },
          { href: "#equipe", label: "Pour une équipe" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un daily tiré de vos commits" },
        ]}>
          <p>
            Notes n’a pas de modèle de daily, mais une note suivie fait l’affaire : les bloquants en haut, puis un sous-titre par jour
            travaillé, le plus récent d’abord, avec Hier et Aujourd’hui sous chacun. Écrivez Aujourd’hui en liste de pointage : les lignes
            cochées sont le Hier du lendemain.
          </p>
          <PostCta template="daily-standup" slug="fr/daily-meeting-notes-iphone" path="/fr/blog/daily-meeting-notes-iphone" position="answer" ui={ui.cta}
            title="Hier écrit pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de daily. Dites à ChatGPT ou Claude ce que vous avez fait, ou laissez Claude Code rédiger hier à partir de vos commits.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="Une note Standup notes dans Pinto Notes sur Mac : un bloquant en attente de clés d’API de préprod, puis Friday 6 November et Thursday 5 November, chacun avec des puces Yesterday et Today."
        caption="Des notes de daily dans Pinto Notes : les bloquants en haut, une section par jour, la plus récente d’abord. La même mise en page marche dans Notes." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note, un sous-titre par jour</h2>
      <p>
        Une seule note pour tous les daily garde la trace : ce que vous disiez faire mardi est juste sous ce que vous avez fait mercredi. Les
        bloquants sont au-dessus des jours pour être la première chose que vous voyez. Gardez un mot sur chaque ligne, car un élément de
        liste vide ne survit pas au collage.
      </p>
      <Keep title="Notes de daily pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre, de chaque ligne ## un sous-titre et des
        lignes Aujourd’hui une liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-la, sélectionnez les
        lignes Aujourd’hui et touchez le bouton Liste de pointage.
      </p>

      <h2 id="chaque-jour">Chaque jour</h2>
      <ul>
        <li>
          <strong>Épinglez-la.</strong> Épinglez la note en haut de son dossier : c’est la première chose que vous ouvrez le matin.
        </li>
        <li>
          <strong>Partez des coches d’hier.</strong> Ajoutez le sous-titre du jour sous Bloquants. Ce que vous avez coché sous le Aujourd’hui
          d’hier devient votre Hier, et ce qui n’est pas coché est reporté.
        </li>
        <li>
          <strong>Écrivez Aujourd’hui la veille au soir.</strong> Deux ou trois lignes tant que vous savez encore où vous vous êtes arrêté,
          et la matinée est sauvée.
        </li>
        <li>
          <strong>Videz les bloquants.</strong> Quand quelque chose est débloqué, supprimez sa ligne. Une liste de vieux bloquants, plus
          personne ne la lit.
        </li>
        <li>
          <strong>Cherchez dans le passé.</strong> La recherche lit chaque mot de chaque note : chercher « import » trouve chaque jour où vous
          avez travaillé dessus.
        </li>
      </ul>
      <p>
        Gardez des puces courtes et des mots simples. Le daily s’adresse à des gens qui ne connaissent pas le code par ses noms de branches.
      </p>

      <h2 id="equipe">Pour une équipe : une ligne par personne</h2>
      <p>
        Si c’est vous qui prenez les notes du daily scrum, une ligne par personne suffit : ce qu’elle a fait et ce qui vient. Les bloquants
        commencent par un nom, pour que chacun voie qui est bloqué sur quoi.
      </p>
      <Keep title="Daily d’équipe pour Notes" text={TEAM} copyLabel={ui.copy}
        note="Commencez une nouvelle note chaque semaine ou chaque sprint, pour qu’elle reste courte." />
      <p>
        Cochez Trier automatiquement les tâches terminées dans les réglages de Notes, et les bloquants levés descendent en bas. Avec Apple
        Intelligence, un enregistrement dans Notes devient une transcription et un résumé, ce qui aide si vous ne pouvez pas taper en animant
        la réunion. Pour des réunions plus longues, le <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de réunion dans
        Notes</a> a les décisions et les actions avec leurs responsables, et <a href="/blog/apple-notes-templates">Apple Notes
        templates</a> (en anglais) a un bilan de la semaine à coller.
      </p>

      <h2 id="limites">Là où des notes de daily dans Notes s’arrêtent</h2>
      <ul>
        <li><strong>Hier vient de mémoire.</strong> Ce que vous avez fait est dans vos commits et vos pull requests, et Notes ne les voit pas.</li>
        <li><strong>La revue de sprint se fait à la main.</strong> Résumer deux semaines, c’est relire dix jours de puces et tout réécrire.</li>
        <li><strong>Les vieux bloquants sont durs à retrouver.</strong> Une fois un bloquant supprimé, rien ne se souvient de combien de temps vous l’avez attendu.</li>
        <li><strong>La note grossit.</strong> Une note suivie s’allonge, et la raccourcir est une tâche de plus.</li>
      </ul>

      <h2 id="pinto-notes">Un daily tiré de vos commits</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/daily-standup">Standup notes</a> (notes de daily) est
        une note avec Blockers en haut et Days en dessous, une section par jour travaillé, la plus récente d’abord.
      </p>
      <p>
        Chaque matin, dites à votre IA ce que vous avez fait et ce qui vient. Elle ajoute une section avec le jour et la date, et Yesterday
        et Today en puces courtes. Ce qui est bloqué va sous Blockers, et quand vous dites que c’est débloqué, ça en sort. Dans Claude Code,
        le modèle a ses propres instructions : il lance git log dans le dépôt pour vos propres commits depuis hier, en fait deux à cinq
        puces simples sans les hashs, demande ce qui vient et ce qui vous bloque, puis écrit la journée.{" "}
        <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and Codex</a> (en anglais) donne la commande pour l’ajouter.
      </p>
      <p>
        Plus tard, demandez « sur quoi j’étais bloqué la semaine dernière ? » ou « résume mes daily depuis lundi pour la revue de sprint ».
        Chaque version précédente de la note est gardée : un bloquant supprimé reste là où on peut le retrouver. La partie IA marche une fois
        ChatGPT ou Claude connecté ; <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute. Les
        notes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
