import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "calendrier-editorial-notes-iphone");

// French version of /blog/apple-notes-content-calendar (templates translation, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes sur
// Mac": Format > Tableau, deux rangs et deux colonnes, la touche Tabulation), support.apple.com/fr-fr/guide/notes/
// apd46c25187e/mac (Option + Commande + T, Ajouter un lien Commande + K), support.apple.com/fr-fr/guide/notes/
// apde615d29c2/mac (Édition > Ajouter un lien), support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac ("Utiliser des
// tags": # then a word), support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler) and support.apple.com/fr-fr/
// 102462 (compte Apple). Édition > Coller au format Markdown, Fichier > Dupliquer la note, the Table button (Tableau) and
// the Smart Folder rule Tags are the French strings in Notes' MainMenu.loctable and SmartFolderFilterRow.loctable on
// macOS 27.2. Paste as Markdown is not used for the table, as in the English post. Search words: Google's French
// suggestions (hl=fr, gl=fr, 21 Nov) give "calendrier éditorial" (réseaux sociaux, gratuit, excel, exemple, instagram,
// google sheet), "calendrier éditorial modèle" (gratuit, template, notion) and "planning éditorial" (exemple, notion);
// "calendrier de contenu" mostly brings up advent calendars. Hence the slug "calendrier editorial notes iphone". Facts
// are the English post's; the picture is its own, described in French.

const ui = UI.fr;

const SKELETON = `# Calendrier éditorial

## Calendrier
Collez le tableau ici.

## Idées
- Trois outils que j’utilise tous les jours
- Une journée au support, en chiffres
- Ce qu’on a arrêté de faire cette année

## Ton
- Des phrases courtes. Une idée par post.
- Montrer le travail : une capture ou un chiffre vaut mieux qu’un adjectif.
- Finir sur une question, pas sur un argument de vente.
`;

// Tabs between the columns: select these lines in Notes and click the Table button.
const TABLE = `Publication\tTitre\tCanal\tStatut
2026-11-03\tCinq questions pour chaque nouveau client\tBlog\tPublié
2026-11-10\tCe que 100 appels clients nous ont appris\tLinkedIn\tProgrammé
2026-11-12\tNewsletter : trois histoires de clients\tNewsletter\tEn rédaction
2026-11-17\tNotre onboarding, avant et après\tLinkedIn\tEn rédaction
2026-11-19\tDans les coulisses du support\tInstagram\tIdée
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de calendrier éditorial ?", a: [
    "Non. Notes n’a aucun modèle. Une note avec un tableau des posts (date, titre, canal, statut) et une liste d’idées dessous en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Notes peut-il trier un tableau par date ?", a: [
    "Non. Les tableaux de Notes ne trient pas. Écrivez les dates sous la forme 2026-11-03 pour qu’elles se lisent dans l’ordre, et ajoutez chaque nouveau post à sa place à la main.",
  ] },
  { q: "Mon équipe peut-elle modifier le même calendrier éditorial dans Notes ?", a: [
    "Oui, si vous partagez la note. Chaque personne a besoin d’un compte Apple, et tout le monde modifie la même note.",
  ] },
  { q: "Existe-t-il une app de notes qui planifie le contenu pour moi ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit de calendrier éditorial. Donnez une idée à ChatGPT ou Claude et il l’enregistre, ou demandez-lui de planifier les deux semaines à venir et il ajoute les posts au calendrier.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="calendrier-editorial-notes-iphone"
      intro={<>
        Publier chaque semaine est plus facile quand le planning et les idées vivent au même endroit, un endroit que vous ouvrez déjà. Notes
        peut être cet endroit, avec une note et un tableau. Voici un modèle de calendrier éditorial à coller dans Notes, comment le tenir
        semaine après semaine, et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#semaine", label: "Semaine après semaine" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un calendrier qui planifie avec vous" },
        ]}>
          <p>
            Notes n’a pas de calendrier éditorial, mais une note fait l’affaire : un tableau avec la date de publication, le titre, le canal
            et le statut, puis une liste d’idées et quelques lignes sur votre ton. Épinglez-la, et ajoutez chaque idée dès qu’elle vous vient.
          </p>
          <PostCta template="content-calendar" slug="fr/calendrier-editorial-notes-iphone" path="/fr/blog/calendrier-editorial-notes-iphone" position="answer" ui={ui.cta}
            title="Les deux semaines à venir planifiées pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un calendrier éditorial gratuit. Donnez une idée à ChatGPT ou Claude et il l’enregistre, ou demandez-lui de planifier deux semaines de posts à partir de vos idées.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/content-calendar-note" width={1520} height={1265} maxWidth={600}
        alt="Une note Content calendar dans Pinto Notes sur Mac : un tableau Calendar de cinq posts du 3 au 19 novembre avec titre, canal et statut, une liste Ideas de trois idées et trois lignes Voice."
        caption="Un calendrier éditorial dans Pinto Notes, où le canal et le statut sont des choix. Dans Notes, le même tableau les garde en mots tapés." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un calendrier, des idées et un ton</h2>
      <p>
        Le calendrier est un tableau, un rang par post. Les idées sont une liste simple : une pensée à moitié formée coûte une ligne. Le ton,
        ce sont trois règles que vous relisez avant d’écrire, pour que chaque post sonne comme le précédent. La note vient en deux parties :
        d’abord les sous-titres et les listes, puis le tableau.
      </p>
      <Keep title="Calendrier éditorial pour Notes" text={SKELETON} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre et de chaque ligne ## un sous-titre. Un
        simple Commande + V garde les symboles en texte. Sur iPhone, tapez-la. Remplacez ensuite la ligne sous Calendrier par le tableau.
      </p>
      <Keep title="Tableau du calendrier" text={TABLE} copyLabel={ui.copy}
        note="Chaque ligne a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez les lignes du tableau sous Calendrier, sélectionnez les six lignes de
          Publication au dernier post, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne.
        </li>
        <li>
          <strong>Ou partez de zéro.</strong> Choisissez Format, Tableau pour deux rangs et deux colonnes, et Tabulation dans la dernière
          cellule ajoute le rang suivant.
        </li>
        <li>
          <strong>Gardez des titres courts.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser : un long
          titre écrase les autres colonnes. Un titre provisoire de quelques mots suffit.
        </li>
        <li>
          <strong>Écrivez les dates toujours de la même façon.</strong> 2026-11-03 se lit dans l’ordre en descendant la colonne et se
          retrouve facilement.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans Notes sait faire, ou pas.
      </p>

      <h2 id="semaine">Semaine après semaine</h2>
      <ul>
        <li>
          <strong>Épinglez-la.</strong> Une note épinglée reste en haut de son dossier : une idée dans le train va directement dans la liste.
        </li>
        <li>
          <strong>Planifiez une fois par semaine.</strong> Passez deux ou trois idées dans le tableau avec une date et En rédaction, et
          supprimez-les de la liste.
        </li>
        <li>
          <strong>Rédigez dans des notes à part.</strong> Écrivez chaque post dans une note séparée et faites un lien vers elle depuis le
          calendrier avec Édition, Ajouter un lien (Commande + K) : le calendrier reste court.
        </li>
        <li>
          <strong>Taguez les brouillons.</strong> Tapez #brouillon dans chaque note de brouillon, et un dossier intelligent avec une règle Tags
          les réunit au même endroit. Lisez <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> (en anglais) si l’un
          d’eux n’apparaît pas.
        </li>
        <li>
          <strong>Une nouvelle note chaque trimestre.</strong> Choisissez Fichier, Dupliquer la note, puis videz les rangs publiés : les idées
          et le ton vous suivent.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Ajouter un lien"], keys: "⌘K" },
        { on: "Mac", steps: ["Fichier", "Dupliquer la note"] },
      ]} />
      <p>
        Si vous planifiez les posts en réunion d’équipe, le <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de réunion
        dans Notes</a> garde les décisions et qui écrit quoi. D’autres notes à coller sont dans{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où un calendrier éditorial dans Notes s’arrête</h2>
      <ul>
        <li><strong>Pas de tri.</strong> Les tableaux de Notes ne trient pas : un post déplacé à une autre semaine, c’est son rang à déplacer à la main.</li>
        <li><strong>Le statut n’est qu’un mot.</strong> Rien n’empêche une faute de frappe, et vous ne pouvez pas afficher seulement ce qui est programmé.</li>
        <li><strong>La planification, c’est vous.</strong> Transformer une liste d’idées en deux semaines de posts sur plusieurs canaux est la partie lente, chaque semaine.</li>
        <li><strong>Le ton n’est qu’un rappel.</strong> Les trois règles sont dans la note, et y tenir chaque brouillon dépend de vous.</li>
      </ul>
      <p>
        Pour un canal et un post par semaine, une note suffit. Avec plusieurs canaux, tenir le tableau à jour devient le travail.
      </p>

      <h2 id="pinto-notes">Un calendrier éditorial qui planifie avec vous</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/content-calendar">Content calendar</a> (calendrier
        éditorial) est une note avec un tableau Calendar, une liste Ideas et votre Voice. Dans le tableau, le canal est un choix parmi Blog,
        Newsletter, LinkedIn, Instagram ou YouTube, et le statut parmi Idea, Drafting, Scheduled ou Published.
      </p>
      <p>
        Donnez une idée à votre IA et elle l’ajoute sous Ideas. Demandez « planifie les deux semaines à venir : deux posts LinkedIn et une
        newsletter » et elle choisit des idées dans la liste et ajoute un rang par post, avec une date, un titre provisoire, le canal et
        Drafting. Elle rédige les brouillons dans le ton de Voice, et quand vous dites qu’un post est parti, elle le passe en Published.
        « Qu’est-ce qui est programmé cette semaine ? » obtient une réponse directe tirée du tableau. Cette partie marche une fois ChatGPT ou
        Claude connecté, et <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute. Vous pouvez
        toujours modifier chaque rang vous-même, et chaque version précédente de la note est gardée.
      </p>
      <p>
        Les plannings que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
