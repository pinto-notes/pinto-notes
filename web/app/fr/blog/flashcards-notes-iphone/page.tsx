import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "flashcards-notes-iphone");

// French version of /blog/apple-notes-flashcards (templates translation, 21 Nov 2026). Apple's own French words, all
// read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes sur Mac":
// Format > Tableau gives deux rangs et deux colonnes, la touche Tabulation moves between cells),
// support.apple.com/fr-fr/guide/notes/apd46c25187e/mac ("Raccourcis clavier": Insérer un tableau, Option + Commande +
// T), support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes sur Mac": Format > Plus >
// « Tout décocher », liste de pointage) and support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac ("Utiliser des tags":
// # then a word). Fichier > Dupliquer la note, the Table button (Tableau) and the Checklist button (Liste de pointage)
// are the French strings in Notes' MainMenu.loctable and Localizable.loctable on macOS 27.2. Paste as Markdown is not
// used here, as in the English post. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give
// "flashcards" (en ligne, gratuit, anglais), "créer des flashcards" and "flashcards iphone" (app, anki); "fiche de
// révision" means a summary sheet, not a card, and "fiches de révision iphone" gives nothing. French students say
// flashcards, hence the slug "flashcards notes iphone". The example deck is the English post's, in French. Facts are
// the English post's; the picture is its own, described in French.

const ui = UI.fr;

// Tabs between the question and the answer: select those lines in Notes and click the Table button.
const TEMPLATE = `Flashcards : la respiration cellulaire

Question\tRéponse
Que fabrique la cellule en dégradant le glucose ?\tDe l’ATP, l’énergie de la cellule
Quelles sont les trois étapes ?\tLa glycolyse, le cycle de Krebs, la chaîne respiratoire
Quelle étape produit le plus d’ATP ?\tLa chaîne respiratoire
Où a lieu la chaîne respiratoire ?\tDans les mitochondries

Ratées cette fois
`;

const FAQ = [
  { q: "Peut-on faire des flashcards dans Notes ?", a: [
    "Oui, avec un tableau à deux colonnes : la question à gauche, la réponse à droite, un rang par carte. Notes ne peut ni cacher une réponse ni retourner une carte : pour vous tester, vous cachez la colonne de droite.",
  ] },
  { q: "Notes fait-il de la répétition espacée ?", a: [
    "Non. Notes ne sait pas quelles cartes sont à revoir ni lesquelles vous avez ratées. Une liste de pointage des cartes ratées sous le tableau, révisée en premier la fois suivante, est ce qui s’en approche le plus à la main.",
  ] },
  { q: "Peut-on mélanger les flashcards dans Notes ?", a: [
    "Non. Les tableaux de Notes ne trient pas et ne mélangent pas : les cartes restent dans l’ordre où vous les avez tapées. Commencer de temps en temps par le dernier rang est la solution simple.",
  ] },
  { q: "Existe-t-il une app de flashcards qui fonctionne comme Notes ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit de notes de cours et flashcards avec sa propre app de révision. Collez vos notes dans ChatGPT ou Claude et il fait les cartes ; l’app montre celles qui sont à revoir, une par une.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="flashcards-notes-iphone"
      intro={<>
        Les flashcards marchent parce qu’elles vous font répondre avant de voir la réponse. Notes n’a pas de mode flashcards, mais un
        tableau à deux colonnes s’en approche. Voici un modèle de flashcards à coller dans Notes, comment réviser avec, et là où il
        s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#reviser", label: "Réviser avec" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Des cartes qui reviennent à temps" },
        ]}>
          <p>
            Notes n’a pas de flashcards, mais un tableau à deux colonnes fonctionne : la question à gauche, la réponse à droite, un rang
            par carte. Cachez la colonne de droite pour vous tester, et gardez sous le tableau une courte liste de pointage des cartes
            ratées.
          </p>
          <PostCta template="study-flashcards" slug="fr/flashcards-notes-iphone" path="/fr/blog/flashcards-notes-iphone" position="answer" ui={ui.cta}
            title="Les cartes faites pour vous, et montrées à temps ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de flashcards avec une app de révision. Collez vos notes dans ChatGPT ou Claude et il fait les cartes ; celles que vous ratez reviennent plus tôt.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/study-flashcards-note" width={1520} height={571} maxWidth={600}
        alt="Une note Study notes and flashcards dans Pinto Notes sur Mac : une ligne qui explique les cartes, puis un sous-titre Notes avec une section Cell respiration de trois puces."
        caption="Des notes de cours dans Pinto Notes, la note d’où viennent les flashcards. Données d’exemple. Sous-titres et puces fonctionnent pareil dans Notes ; l’app de révision, non." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un tableau par sujet</h2>
      <p>
        Chaque rang est une carte. Gardez la question courte et la réponse plus courte encore : une carte qui demande un paragraphe, ce sont
        deux cartes. La ligne sous le tableau accueille les cartes ratées, pour que la séance suivante commence par elles.
      </p>
      <Keep title="Flashcards pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Chaque ligne du tableau a une tabulation entre la question et la réponse. Collez-le, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez le modèle dans une nouvelle note, sélectionnez les cinq lignes de Question
          à la dernière réponse, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne : vous avez Question et Réponse
          côte à côte.
        </li>
        <li>
          <strong>Ou partez de zéro.</strong> Choisissez Format, Tableau pour deux rangs et deux colonnes. Tapez Question et Réponse dans le
          premier rang, et Tabulation dans la dernière cellule ajoute la carte suivante.
        </li>
        <li>
          <strong>Gardez des questions courtes.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser :
          une longue question écrase la réponse.
        </li>
        <li>
          <strong>Une note par sujet.</strong> Rangez-les dans un dossier Révisions, ajoutez à chacune un tag comme #biologie, et choisissez
          Fichier, Dupliquer la note pour commencer le sujet suivant avec la même mise en page.
        </li>
      </ul>
      <p>
        Une liste de lignes « question : réponse » marche aussi, mais la réponse reste bien visible à côté de la question. Le tableau permet
        de cacher toute une colonne d’un coup. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce
        qu’un tableau dans Notes sait faire, ou pas.
      </p>

      <h2 id="reviser">Réviser avec</h2>
      <ul>
        <li><strong>Cachez la colonne de droite.</strong> Posez une fiche ou votre main sur les réponses et dites chacune à voix haute avant de regarder.</li>
        <li><strong>Notez ce que vous avez raté.</strong> Tapez la question sous Ratées cette fois et touchez le bouton Liste de pointage. Cochez-la quand vous y répondez juste lors d’une séance suivante.</li>
        <li><strong>Commencez par les ratées.</strong> La fois suivante, passez la liste de pointage avant le tableau. Ce sont les cartes qui ont besoin d’entraînement.</li>
        <li><strong>Remettez à zéro pour le tour suivant.</strong> Quand toutes les ratées sont cochées, choisissez Format, Plus, Tout décocher, ou supprimez les lignes cochées et repartez de zéro.</li>
        <li><strong>Trouvez une carte par n’importe quel mot.</strong> La recherche lit chaque mot de chaque note : « mitochondries » trouve la carte où qu’elle soit.</li>
      </ul>
      <p>
        Si vous prenez des notes en cours, la <a href="/fr/blog/methode-cornell-notes-iphone">méthode Cornell dans Notes</a> met les
        questions juste à côté de vos notes : un paquet de flashcards qui se construit pendant que vous écrivez. D’autres notes à coller
        sont dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où des flashcards dans Notes s’arrêtent</h2>
      <ul>
        <li><strong>Rien n’est à revoir.</strong> Notes ne sait pas quand vous avez vu une carte pour la dernière fois : soit vous révisez toutes les cartes à chaque fois, soit vous tenez le compte vous-même.</li>
        <li><strong>Pas de retournement.</strong> La réponse est toujours sur la page. La cacher marche, mais un coup d’œil est vite arrivé.</li>
        <li><strong>Pas de mélange.</strong> Les tableaux ne trient pas, alors vous apprenez l’ordre des cartes en même temps que les réponses.</li>
        <li><strong>Faire les cartes est la partie lente.</strong> Transformer un chapitre en bonnes questions prend plus de temps que de les réviser.</li>
      </ul>
      <p>
        Pour un contrôle la semaine prochaine avec vingt cartes, un tableau dans Notes suffit. Pour tout un semestre, le plus dur est de savoir
        quelles cartes réviser aujourd’hui, et Notes vous laisse ça.
      </p>

      <h2 id="pinto-notes">Des flashcards qui reviennent quand il faut</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et une note peut aussi être une petite app. Le modèle
        gratuit <a href="/templates/study-flashcards">Study notes and flashcards</a> (notes de cours et flashcards) en est une : vos notes
        sous un sous-titre par sujet, et une app de révision qui montre combien de cartes sont à revoir aujourd’hui. Appuyez sur Study now
        et elle pose une carte à la fois. Show answer, puis dites comment ça s’est passé (Again, Hard, Good ou Easy), et chaque bouton
        indique quand la carte reviendra. Les cartes ratées reviennent plus tôt ; celles que vous savez attendent plus longtemps.
      </p>
      <p>
        Vous pouvez ajouter, modifier et supprimer chaque carte vous-même dans l’app, ou coller une liste de lignes question et réponse pour
        qu’elle fasse les cartes. Avec ChatGPT ou Claude connecté, collez vos notes de cours ou un chapitre et il fait cinq à dix cartes à
        côté des vôtres. Dites « interroge-moi sur la biologie, dix cartes » et il les pose dans la conversation, une à la fois sans la
        réponse, et met à jour chaque carte comme le fait l’app. Demandez « quelles cartes je rate tout le temps ? » et il lit le paquet
        pour répondre. <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Les notes de cours que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre
        Mac</a> (en anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
