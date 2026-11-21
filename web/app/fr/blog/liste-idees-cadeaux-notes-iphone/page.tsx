import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "liste-idees-cadeaux-notes-iphone");

// French version of /blog/apple-notes-gift-ideas (templates translation, 21 Nov 2026). Apple's own French words, all
// read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes sur Mac":
// Format > Plus > « Tout décocher », « Trier automatiquement les tâches terminées » dans les réglages de Notes),
// support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (Format > Tableau, deux rangs et deux colonnes, la touche
// Tabulation), support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Option + Commande + T),
// support.apple.com/fr-fr/guide/notes/apda85974595/mac (résultats mathématiques: an expression followed by the equals
// sign), support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler) and support.apple.com/fr-fr/102537 (verrouiller
// une note avec un mot de passe, Face ID ou Touch ID). Édition > Coller au format Markdown, the Table button (Tableau)
// and the Checklist button (Liste de pointage) are the French strings in Notes' MainMenu.loctable and
// Localizable.loctable on macOS 27.2. Paste as Markdown is not used for the table, as in the English post. Search
// words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "liste idées cadeaux" (noël, femme, homme), "liste idee
// cadeau anniversaire", "liste idee cadeau a partager", "liste de cadeaux de noël" and "liste de cadeaux application";
// nothing for Notes. Hence the slug "liste idees cadeaux notes iphone". The budgets are in euros here; the Pinto picture
// shows the template's Swedish example in kr. Facts are the English post's; the picture is its own, described in
// French.

const ui = UI.fr;

const SKELETON = `# Idées cadeaux

## Idées
Collez le tableau ici.

## Tailles et goûts
- Maja : cuisine beaucoup, a déjà un robot pâtissier.
- Jonas : taille M, adore tout ce qui est vert.
- Maman : plus d’objets ; elle préfère faire quelque chose ensemble.
- Papa : a toutes les écharpes du club.

## Noël
- [ ] Maman
- [ ] Papa
- [ ] Jonas
`;

// Tabs between the columns: select these lines in Notes and click the Table button.
const TABLE = `Personne\tOccasion\tIdée\tBudget\tStatut
Maja\tPendaison de crémaillère\tUn bon couteau de chef\t80\tIdée
Papa\tNoël\tDes places de foot\t50\tAcheté
Jonas\tAnniversaire\tUn bonnet en laine vert\t30\tIdée
Maman\tNoël\tUn week-end à deux\t250\tIdée
Emma\tMerci\tUne bonne huile d’olive\t20\tOffert
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de liste de cadeaux ?", a: [
    "Non. Notes n’a aucun modèle. Une note avec un tableau d’idées par personne et une liste de tailles et de goûts en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Comment tenir une liste de cadeaux de Noël sur iPhone ?", a: [
    "Gardez une note avec une liste de pointage de toutes les personnes à qui vous offrez quelque chose, et cochez chaque nom une fois son cadeau acheté. Épinglez la note pour qu’elle soit en haut quand vous êtes en magasin.",
  ] },
  { q: "Peut-on cacher une liste de cadeaux dans Notes ?", a: [
    "Oui. Verrouillez la note avec un mot de passe ou Face ID ou Touch ID, et son contenu reste caché tant que vous ne la déverrouillez pas.",
  ] },
  { q: "Existe-t-il une app d’idées cadeaux qui retient ce que les gens aiment ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit d’idées cadeaux. Dites à ChatGPT ou Claude ce qui ferait plaisir à quelqu’un et il l’enregistre, puis propose des cadeaux dans le budget avant un anniversaire.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="liste-idees-cadeaux-notes-iphone"
      intro={<>
        L’idée de cadeau parfaite arrive en mars, au détour d’une phrase, et en décembre elle a disparu. Une note que vous complétez dès que
        vous en entendez une règle ça. Voici une liste d’idées cadeaux pour Notes, par personne, avec budgets et tailles, prête pour Noël et
        chaque anniversaire qui suit.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#annee", label: "Toute l’année" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Une liste qui propose des cadeaux" },
        ]}>
          <p>
            Notes n’a pas de modèle de liste de cadeaux, mais une note fait l’affaire : un tableau avec la personne, l’occasion, l’idée, un
            budget et si c’est acheté, puis une liste des tailles et des goûts de chacun. Épinglez-la, et ajoutez une idée dès que vous
            l’entendez.
          </p>
          <PostCta template="gift-ideas" slug="fr/liste-idees-cadeaux-notes-iphone" path="/fr/blog/liste-idees-cadeaux-notes-iphone" position="answer" ui={ui.cta}
            title="Les idées notées dès que vous les entendez ?">
            <p>Pinto Notes fonctionne comme Notes et a une liste d’idées cadeaux gratuite. Dites à ChatGPT ou Claude ce qui ferait plaisir à quelqu’un et il ajoute l’idée, puis propose des cadeaux dans le budget avant un anniversaire.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/gift-ideas-note" width={1520} height={1057} maxWidth={600}
        alt="Une note Gift ideas dans Pinto Notes sur Mac : un tableau Ideas de cinq cadeaux pour Maja, Dad, Jonas, Mum et Emma avec l’occasion, un budget en kr et un statut, et une liste Sizes and likes pour quatre personnes."
        caption="Une liste d’idées cadeaux dans Pinto Notes, où le budget est un nombre et le statut un choix. Dans Notes, le même tableau les garde en texte tapé." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : des idées par personne, tailles et goûts</h2>
      <p>
        Le tableau garde chaque idée, un rang par idée : vous voyez d’un coup d’œil qui a quelque chose et qui n’a rien. La liste des tailles
        et des goûts, c’est ce que vous apprenez sur les gens au fil de l’année : une taille, une couleur préférée, ce qu’ils ont déjà. La
        liste de pointage de Noël, c’est à qui il manque encore un cadeau. La note vient en deux parties : d’abord les sous-titres et les
        listes, puis le tableau.
      </p>
      <Keep title="Idées cadeaux pour Notes" text={SKELETON} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre, de chaque ligne ## un sous-titre et des noms
        sous Noël une liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-la, sélectionnez les noms et
        touchez le bouton Liste de pointage. Remplacez ensuite la ligne sous Idées par le tableau.
      </p>
      <Keep title="Tableau des idées" text={TABLE} copyLabel={ui.copy}
        note="Chaque ligne a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez les lignes du tableau sous Idées, sélectionnez les six lignes de Personne au
          dernier cadeau, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne.
        </li>
        <li>
          <strong>Ou partez de zéro.</strong> Choisissez Format, Tableau pour deux rangs et deux colonnes, et Tabulation dans la dernière
          cellule ajoute le rang suivant.
        </li>
        <li>
          <strong>Gardez chaque idée courte.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser. « Un
          bonnet en laine vert » suffit, et les détails vont sous Tailles et goûts.
        </li>
        <li>
          <strong>Verrouillez-la si la famille partage votre Mac.</strong> Une note verrouillée ne s’ouvre qu’avec votre mot de passe ou
          Face ID ou Touch ID.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans Notes sait faire, ou pas.
      </p>

      <h2 id="annee">Toute l’année, et à Noël</h2>
      <ul>
        <li>
          <strong>Épinglez-la.</strong> Une note épinglée reste en haut de son dossier : une idée entendue au dîner y entre avant que vous
          l’oubliiez.
        </li>
        <li>
          <strong>Cherchez par prénom.</strong> La recherche de Notes lit chaque mot : chercher « Jonas » trouve son rang et sa taille.
        </li>
        <li>
          <strong>Additionnez les budgets vous-même.</strong> Les tableaux ne font pas de totaux, mais les résultats mathématiques font les
          calculs que vous tapez. Sous le tableau, tapez 50 + 250 = et Notes vous donne le total de Noël jusqu’ici.
        </li>
        <li>
          <strong>Cochez les noms au fil des achats.</strong> Avec « Trier automatiquement les tâches terminées » activé, les personnes qui
          restent remontent en haut de la liste de Noël.
        </li>
        <li>
          <strong>Remettez-la à zéro en décembre prochain.</strong> Cliquez dans la liste de Noël et choisissez Format, Plus, Tout décocher.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Plus", "Tout décocher"] }]} />
      <p>
        Pour garder en vue les dépenses de toute la saison, le <a href="/fr/blog/budget-notes-iphone">budget dans Notes</a> fait ses totaux
        tout seul avec les résultats mathématiques. D’autres notes à coller sont dans{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où une liste de cadeaux dans Notes s’arrête</h2>
      <ul>
        <li><strong>Les idées arrivent ailleurs.</strong> Un ami parle d’un livre dans un message, et il n’arrive dans la note que si vous vous arrêtez pour le recopier.</li>
        <li><strong>Pas de tri.</strong> Les tableaux de Notes ne trient pas : voir tout ce qui concerne une personne ou une occasion, c’est lire tout le tableau.</li>
        <li><strong>Le total du budget se fait à la main.</strong> Vous retapez le calcul à chaque fois qu’une idée change.</li>
        <li><strong>Le choix, c’est vous.</strong> Les tailles, les goûts et les budgets sont dans la note, et les faire correspondre à un cadeau trois semaines avant un anniversaire reste votre affaire.</li>
      </ul>
      <p>
        Pour quelques personnes, une note suffit. Pour un Noël en famille et une année d’anniversaires, la tenir à jour devient le travail.
      </p>

      <h2 id="pinto-notes">Une liste de cadeaux qui propose des cadeaux</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/gift-ideas">Gift ideas</a> (idées cadeaux) est une
        note avec un tableau Ideas et une liste Sizes and likes. Dans le tableau, le budget est un nombre et le statut un choix parmi Idea,
        Bought ou Given.
      </p>
      <p>
        Mentionnez ce qui ferait plaisir à quelqu’un et votre IA ajoute un rang : la personne, l’occasion si vous en avez dit une, l’idée, le
        budget si vous en avez donné un, et Idea comme statut. Dites « Jonas fait du M et adore tout ce qui est vert » et ça va sous Sizes and
        likes. Demandez « l’anniversaire de Papa est dans trois semaines, des idées à moins de 50 € ? » et elle propose trois cadeaux dans le
        budget qui collent à ce qu’il y a dans la note. Quand vous en achetez un, elle passe le statut à Bought. Cette partie marche une fois
        ChatGPT ou Claude connecté, et <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute.
        Vous pouvez toujours modifier chaque rang vous-même, et chaque version précédente de la note est gardée.
      </p>
      <p>
        Les listes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
