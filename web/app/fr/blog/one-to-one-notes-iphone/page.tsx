import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "one-to-one-notes-iphone");

// French version of /blog/apple-notes-1-on-1-template (templates translation, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd58edc7964/mac ("Utiliser les dossiers intelligents
// dans Notes sur Mac": a note must match some or all of the rules), support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac
// (« Trier automatiquement les tâches terminées » dans les réglages de Notes), support.apple.com/fr-fr/guide/notes/
// apdb54e469b6/mac (épingler), support.apple.com/fr-fr/102537 (verrouiller une note avec un mot de passe, Face ID ou Touch ID ou
// Touch ID) and support.apple.com/fr-fr/102462 (compte Apple; a locked note must be unlocked to share). Édition > Coller
// au format Markdown, Fichier > Dupliquer la note, the Smart Folder rules Dossiers and Listes de pointage with the value
// Non coché, and the Checklist button (Liste de pointage) are the French strings in Notes' MainMenu.loctable,
// SmartFolderFilterRow.loctable, SmartFolderChecklistsFilterView.loctable and Localizable.loctable on macOS 27.2. Search
// words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "one to one manager" (template, questions, avec son
// manager), "entretien one to one", "modèle entretien one to one", "trame entretien one to one" and "compte rendu one to
// one"; French teams say one to one, not 1:1 or "entretien individuel" (that is the yearly review). Hence the slug "one
// to one notes iphone". Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# One to one avec Emma

Un jeudi sur deux. Ajouter les sujets pendant la semaine.

## La prochaine fois
- Retour sur la revue de design
- Le budget pour la conférence
- Les objectifs d’Emma pour le trimestre prochain

## Suivis
- [ ] Moi : trouver un mentor à Emma dans l’équipe plateforme
- [ ] Moi : demander une astreinte plus calme
- [ ] Emma : écrire le plan de lancement d’ici le 20 nov.

## One to one passés
5 novembre
- Astreinte difficile : deux alertes la nuit. Elle veut une rotation plus calme.
- Veut mener le lancement du printemps. Fatiguée mais positive.
`;

const QUESTIONS = `Questions fixes
- Qu’est-ce qui t’occupe l’esprit cette semaine ?
- Qu’est-ce qui te bloque ?
- As-tu besoin de quelque chose de ma part ?
- Retours, dans les deux sens
- Où en sont tes objectifs ?
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de one to one ?", a: [
    "Non. Notes n’a aucun modèle. Une note suivie par personne, avec des sous-titres pour le prochain ordre du jour, les suivis et les one to one passés, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Que mettre à l’ordre du jour d’un one to one ?", a: [
    "Ses sujets d’abord, puis les vôtres, puis les suivis de la dernière fois. Ajoutez une ou deux questions fixes, comme ce qui la bloque et si elle a besoin de quelque chose de vous. Notez les sujets pendant la semaine, quand ils arrivent.",
  ] },
  { q: "Une note par one to one ou une note par personne ?", a: [
    "Une par personne. L’ordre du jour, les suivis en cours et chaque one to one passé restent ensemble, le plus récent d’abord : vous relisez la dernière fois avant la suivante sans chercher.",
  ] },
  { q: "Existe-t-il une app qui rédige mes notes de one to one ?", a: [
    "Pinto Notes a un modèle gratuit 1:1 notes. Racontez le one to one à ChatGPT ou Claude : il écrit la section, ajoute ce que chacun a promis en liste de pointage, et retire les sujets traités.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="one-to-one-notes-iphone"
      intro={<>
        Un bon one to one se prépare pendant les deux semaines qui le précèdent, quand les sujets arrivent. Voici un modèle de notes de one to
        one à coller dans Notes : une note suivie par personne, avec le prochain ordre du jour, les suivis et chaque one to one passé.
        Ensuite, comment la tenir, et là où Notes s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#ordre-du-jour", label: "L’ordre du jour" },
          { href: "#entre-deux", label: "Entre deux one to one" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Des one to one qui se rédigent" },
        ]}>
          <p>
            Notes n’a pas de modèle de one to one, mais une note par personne fait l’affaire : une liste La prochaine fois que vous complétez
            pendant la semaine, les suivis en liste de pointage avec un nom sur chacun, et les one to one passés en dessous, le plus récent
            d’abord. Lisez le haut avant chaque rendez-vous et écrivez la nouvelle section juste après.
          </p>
          <PostCta template="one-on-one-notes" slug="fr/one-to-one-notes-iphone" path="/fr/blog/one-to-one-notes-iphone" position="answer" ui={ui.cta}
            title="Vos one to one rédigés pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de notes de one to one. Racontez à ChatGPT ou Claude comment ça s’est passé : il le rédige, ajoute les suivis et retire ce que vous avez traité.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/one-on-one-notes-note" width={1520} height={1062} maxWidth={600}
        alt="Une note 1:1 notes dans Pinto Notes sur Mac : des one to one avec Emma un jeudi sur deux, trois sujets sous Next time, quatre suivis dont un coché, et le one to one du 5 novembre sous Past 1:1s."
        caption="Une note de one to one suivie dans Pinto Notes : ce qu’il faut aborder, ce que chacun a promis, et les one to one passés, le plus récent d’abord. La même mise en page marche dans Notes." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note suivie par personne</h2>
      <p>
        Une note par rendez-vous éparpille les suivis. Une note par personne garde toute l’histoire au même endroit : ce que vous voulez
        aborder, ce que chacun a dit qu’il ferait, et comment se sont passés les derniers one to one. Mettez un nom sur chaque suivi, « Moi »
        compris, pour que ce soit clair qui doit quoi. Gardez un mot sur chaque ligne, car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Notes de one to one pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
        { on: "Mac", steps: ["Fichier", "Dupliquer la note"] },
      ]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre, de chaque ligne ## un sous-titre et des
        suivis une liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-la, sélectionnez les suivis et
        touchez le bouton Liste de pointage. Pour la personne suivante, videz les lignes d’exemple, gardez cette copie vierge dans un dossier
        One to one, et choisissez Fichier, Dupliquer la note.
      </p>

      <h2 id="ordre-du-jour">L’ordre du jour : La prochaine fois</h2>
      <p>
        La prochaine fois, c’est l’ordre du jour, écrit sur deux semaines plutôt que deux minutes avant l’appel. Ses sujets passent en
        premier : c’est son rendez-vous plus que le vôtre. Quelques questions fixes en dessous attrapent ce qu’aucun de vous n’a pensé à
        noter.
      </p>
      <Keep title="Questions fixes" text={QUESTIONS} copyLabel={ui.copy} />
      <p>
        Si vous voulez tous les deux ajouter des sujets, partagez une note qui ne contient que La prochaine fois et autorisez les
        modifications. Chacun de vous a besoin d’un compte Apple. Gardez le reste, y compris comment la personne vous a semblé, dans votre
        propre note.
      </p>

      <h2 id="entre-deux">Entre deux one to one</h2>
      <ul>
        <li>
          <strong>Épinglez-la.</strong> Épinglez la note en haut de son dossier : ajouter un sujet depuis votre téléphone prend quelques
          secondes.
        </li>
        <li>
          <strong>Rédigez juste après.</strong> Ajoutez la date en haut de One to one passés, deux ou trois puces sur ce dont vous avez parlé
          et comment la personne vous a semblé, et passez les promesses dans Suivis. Supprimez les sujets traités.
        </li>
        <li>
          <strong>Laissez descendre les suivis cochés.</strong> Cochez Trier automatiquement les tâches terminées dans les réglages de Notes,
          et ce qui est fait descend en bas de la liste.
        </li>
        <li>
          <strong>Voyez chaque promesse en cours.</strong> Créez un dossier intelligent avec deux règles, Dossiers réglé sur votre dossier One
          to one et Listes de pointage réglé sur Non coché. Chaque personne à qui vous devez encore quelque chose s’y trouve.
        </li>
        <li>
          <strong>Verrouillez-la si c’est privé.</strong> Comment quelqu’un vous a semblé, c’est pour vous. Une note verrouillée s’ouvre avec
          votre mot de passe ou Face ID ou Touch ID, mais elle ne peut pas être partagée pour être modifiée.
        </li>
      </ul>
      <p>
        La recherche lit chaque mot de chaque note : chercher « astreinte » trouve chaque fois que le sujet est revenu.{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> (en anglais) passe en revue chaque règle qu’un dossier
        intelligent peut utiliser. Pour les réunions d’équipe, le <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de
        réunion dans Notes</a> met les actions et leurs responsables en haut, et <a href="/blog/apple-notes-templates">Apple Notes
        templates</a> (en anglais) a d’autres notes à coller.
      </p>

      <h2 id="limites">Là où des notes de one to one dans Notes s’arrêtent</h2>
      <ul>
        <li><strong>La rédaction, c’est vous.</strong> Juste après un one to one, la réunion suivante commence, et les notes attendent que vous en ayez oublié la moitié.</li>
        <li><strong>Le rangement se fait à la main.</strong> Passer les promesses dans Suivis et supprimer les sujets traités se saute facilement, et l’ordre du jour se remplit de vieux points.</li>
        <li><strong>Pas de tendances.</strong> L’astreinte qui revient trois one to one de suite est dans la note, mais rien ne le signale.</li>
        <li><strong>La recherche trouve des mots, pas des réponses.</strong> « Qu’ai-je promis à Emma la dernière fois ? », c’est relire les suivis vous-même.</li>
      </ul>
      <p>
        Pour une ou deux personnes, le modèle suffit. Avec une équipe de six, ce sont les comptes rendus qui lâchent.
      </p>

      <h2 id="pinto-notes">Des notes de one to one qui se rédigent seules</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/one-on-one-notes">1:1 notes</a> (notes de one to one)
        est une note suivie par personne avec Next time, Follow-ups et Past 1:1s, le plus récent d’abord.
      </p>
      <p>
        La première fois, votre IA demande avec qui est le one to one et écrit son nom. Pendant la semaine, mentionnez un sujet à aborder et
        il va sous Next time. Après le one to one, racontez comment ça s’est passé, par exemple « Emma et moi venons de faire notre one to
        one. Elle veut mener le prochain lancement et a demandé un mentor. » Elle ajoute une section en haut de Past 1:1s avec son nom et la
        date, ce dont vous avez parlé et comment elle vous a semblé, ajoute ce que chacun a promis en lignes de liste de pointage sous
        Follow-ups, et retire les sujets traités. Demandez « qu’est-ce que j’ai promis la dernière fois ? » avant le suivant. Vous pouvez
        toujours tout écrire et cocher vous-même, et chaque version précédente de la note est gardée. La partie IA marche une fois ChatGPT ou
        Claude connecté ; <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Les notes de one to one que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre
        Mac</a> (en anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
