import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "journal-intime-notes-iphone");

// French version of /blog/apple-notes-journal-template (templates translation, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac ("Utiliser des tags": # then a word),
// support.apple.com/fr-fr/guide/notes/apd58edc7964/mac ("Utiliser les dossiers intelligents": tags),
// support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler), support.apple.com/fr-fr/102537 (verrouiller une note
// avec un mot de passe, Face ID ou Touch ID) and support.apple.com/fr-fr/guide/notes/apdb5106e334/mac (la touche
// Retour). Édition > Coller au format Markdown, Fichier > Dupliquer la note and the Smart Folder rule Tags are the
// French strings in Notes' MainMenu.loctable and SmartFolderFilterRow.loctable on macOS 27.2. Search words: Google's
// French suggestions (hl=fr, gl=fr, 21 Nov) give "journal intime iphone", "journal intime apple", "application journal
// intime iphone" (avec mot de passe, gratuit) and "journal intime notes"; "journal quotidien" means a daily newspaper.
// Hence the slug "journal intime notes iphone", with "journal" alone in the text. Facts are the English post's; the
// picture is its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Journal

Quelques lignes par jour, le jour le plus récent en haut.

## Questions
1. Que s’est-il passé aujourd’hui ?
2. Qu’est-ce qui m’a pris de l’énergie, et qu’est-ce qui m’en a redonné ?
3. De quoi je veux me souvenir ?
4. Une chose pour demain ?

## Dimanche 8 novembre
- Aujourd’hui : journée calme ; fini l’étagère et fait une longue balade.
- Énergie : en baisse après le déjeuner, mieux après un café avec Jonas.
- À retenir : la boulangerie du coin ouvre à sept heures.
- Demain : appeler Maman.

## Samedi 7 novembre
- Aujourd’hui : aidé Maja à déménager ; plus vite que ce qu’on craignait.
- Énergie : les escaliers l’ont prise, la pizza d’après l’a rendue.
- À retenir : Maja dit que le nouvel appart a le soleil du soir.
- Demain : répondre au propriétaire avant midi.
`;

const PROMPTS = `À qui ai-je parlé aujourd’hui ?
Qu’est-ce qui m’a surpris ?
Qu’est-ce que je ferais autrement ?
Qu’est-ce qui me fait envie ?
Qu’est-ce que j’ai remis à plus tard, et pourquoi ?
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de journal ?", a: [
    "Non. Notes n’a aucun modèle. Une note avec quelques questions en haut et un sous-titre par jour en fait un journal, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Une note par jour ou une note pour tout le journal ?", a: [
    "Une seule note est plus facile à tenir : elle est toujours au même endroit, et les derniers jours sont juste sous les questions. Quand elle devient longue, commencez une nouvelle note pour le mois suivant.",
  ] },
  { q: "Peut-on verrouiller son journal dans Notes ?", a: [
    "Oui. Notes peut verrouiller une note, et une note verrouillée s’ouvre avec un mot de passe ou Face ID ou Touch ID. Verrouillez la note du journal elle-même, et chaque jour qu’elle contient est verrouillé avec elle.",
  ] },
  { q: "Comment retrouver une ancienne entrée ?", a: [
    "La recherche lit chaque mot de chaque note : cherchez un prénom, un lieu ou un mot que vous vous souvenez d’avoir écrit. Un tag comme #voyage sur les jours qui comptent permet à un dossier intelligent de réunir ces notes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="journal-intime-notes-iphone"
      intro={<>
        La plupart des journaux s’arrêtent à la page blanche. Quelques questions fixes aident à la passer, et Notes est déjà sur votre
        téléphone en fin de journée. Voici un modèle de journal à coller dans Notes, comment le tenir, comment retrouver d’anciens jours, et
        là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#chaque-jour", label: "Chaque jour" },
          { href: "#questions", label: "En panne d’idées" },
          { href: "#anciens-jours", label: "Retrouver d’anciens jours" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un journal qui pose les questions" },
        ]}>
          <p>
            Notes n’a pas de modèle de journal, mais une note fait l’affaire : quatre questions courtes en haut, puis un sous-titre par jour,
            le plus récent d’abord. Répondez aux questions en une ligne chacune, et les derniers jours sont toujours là quand vous l’ouvrez.
          </p>
          <PostCta template="daily-journal" slug="fr/journal-intime-notes-iphone" path="/fr/blog/journal-intime-notes-iphone" position="answer" ui={ui.cta}
            title="L’entrée écrite pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un journal gratuit. Racontez votre journée à ChatGPT ou Claude et il écrit l’entrée avec vos mots, le jour le plus récent en haut.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-journal-note" width={1520} height={1093} maxWidth={600}
        alt="Une note Daily journal dans Pinto Notes sur Mac : quatre questions numérotées, puis les entrées du dimanche 8 et du samedi 7 novembre, la plus récente d’abord, chacune avec des lignes Today, Energy, Remember et Tomorrow."
        caption="Un journal dans Pinto Notes, le jour le plus récent en haut. La même mise en page marche dans Notes." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note, le jour le plus récent en haut</h2>
      <p>
        Les questions sont en haut pour que vous ne soyez jamais face à une page blanche. Chaque jour a un sous-titre avec le jour et la date,
        et les réponses vont dessous, une ligne courte chacune. Le jour le plus récent va juste sous les questions : vous lisez aujourd’hui et
        hier sans faire défiler. Deux jours d’exemple sont remplis ; remplacez-les par les vôtres.
      </p>
      <Keep title="Journal pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre et de chaque ligne ## un sous-titre. Un
        simple Commande + V garde les symboles en texte. Sur iPhone, tapez les questions une fois, puis ajoutez chaque jour à la main.
      </p>
      <p>
        Si vous planifiez aussi votre journée le matin, le Daily plan de <a href="/blog/apple-notes-templates">Apple Notes templates</a>{" "}
        (en anglais) en est l’autre moitié : trois choses pour aujourd’hui, et quoi faire s’il reste du temps. Gardez-le dans sa propre note,
        pour que le journal reste le récit de ce qui s’est passé.
      </p>

      <h2 id="chaque-jour">Chaque jour</h2>
      <ul>
        <li>
          <strong>Épinglez la note.</strong> Épinglée en haut de son dossier, c’est la première chose que vous voyez en ouvrant Notes au lit.
        </li>
        <li>
          <strong>Ajoutez le jour en haut.</strong> Cliquez à la fin de la dernière question, appuyez sur Retour, et tapez le nouveau
          sous-titre. La veille glisse dessous.
        </li>
        <li>
          <strong>Une ligne suffit.</strong> Sautez une question quand il n’y a rien à dire. Un journal tenu un an à deux lignes par jour vaut
          mieux qu’un journal tenu une semaine à deux pages.
        </li>
        <li>
          <strong>Écrivez avec vos mots.</strong> « Les escaliers l’ont prise, la pizza d’après l’a rendue » voudra dire plus dans un an que
          « fatigué ».
        </li>
        <li>
          <strong>Une nouvelle note chaque mois.</strong> Quand la note devient longue, choisissez Fichier, Dupliquer la note, nommez la copie
          d’après le nouveau mois et supprimez-en les anciens jours. Les questions suivent.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Fichier", "Dupliquer la note"] }]} />

      <h2 id="questions">Quand les quatre questions ne collent pas</h2>
      <p>
        Les quatre questions couvrent la plupart des jours. Les autres jours, remplacez-en une par une question de cette liste, ou gardez la
        liste en bas de la note pour y piocher.
      </p>
      <Keep title="Questions de rechange" text={PROMPTS} copyLabel={ui.copy} />
      <p>
        Si vous voulez suivre votre humeur en chiffres en plus des mots, le{" "}
        <a href="/fr/blog/suivi-humeur-notes-iphone">suivi de l’humeur dans Notes</a> est un tableau avec un rang par soir. Pour les habitudes
        à cocher, il y a le <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes dans Notes</a>.
      </p>

      <h2 id="anciens-jours">Retrouver d’anciens jours</h2>
      <ul>
        <li>
          <strong>Cherchez un mot.</strong> La recherche de Notes lit chaque mot de chaque note : « boulangerie » ou le prénom d’un ami trouve
          le jour où vous l’avez écrit.
        </li>
        <li>
          <strong>Taguez les jours qui comptent.</strong> Tapez #voyage ou #famille sur la ligne et ça devient un tag. Un dossier intelligent
          avec une règle Tags réunit alors chaque note qui l’a. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart
          Folders</a> (en anglais) explique comment ils marchent et quoi vérifier quand ils ne marchent pas.
        </li>
      </ul>
      <p>
        Un journal est privé. Vous pouvez verrouiller la note avec un mot de passe ou Face ID ou Touch ID, pour qu’elle ne s’ouvre pas pour qui prend
        votre téléphone.
      </p>

      <h2 id="limites">Là où un journal dans Notes s’arrête</h2>
      <ul>
        <li><strong>La ligne vide reste à remplir.</strong> Les questions aident, mais un soir de fatigue, rien ne vous les pose.</li>
        <li><strong>Chaque jour se tape.</strong> Si vous préférez raconter votre journée à voix haute, il faut la mettre par écrit après.</li>
        <li><strong>La recherche trouve des mots, pas des thèmes.</strong> Elle trouve « propriétaire ». Elle ne vous dit pas ce qui vous occupe l’esprit depuis trois semaines.</li>
      </ul>
      <p>
        Pour beaucoup de gens, une note et quatre questions, c’est tout le journal, et ça suffit. Ce qu’elle ne fait pas, c’est relire pour
        vous.
      </p>

      <h2 id="pinto-notes">Un journal qui pose les questions</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/daily-journal">Daily journal</a> (journal) est une note
        avec les mêmes quatre questions et vos entrées dessous, le jour le plus récent d’abord.
      </p>
      <p>
        Dites que vous voulez écrire votre journal et votre IA pose les questions une par une, et saute celles que vous passez. Ou
        racontez-lui votre journée d’un coup, comme « longue journée : le déménagement de Maja est fait, ses cartons non, et je suis sur le
        canapé », et elle écrit l’entrée sans rien demander. Chaque jour a un sous-titre avec le jour et la date, et des lignes courtes avec
        vos mots pour Today, Energy, Remember et Tomorrow. Elle n’ajoute pas de conseils sauf si vous en demandez. Plus tard, demandez
        « qu’est-ce qui m’a occupé l’esprit cette semaine ? » et elle répond à partir de vos entrées. Vous pouvez toujours écrire et modifier
        chaque jour vous-même, et chaque version précédente de la note est gardée. Ça marche une fois ChatGPT ou Claude connecté ;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Le journal que vous tenez déjà dans Notes arrive en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
