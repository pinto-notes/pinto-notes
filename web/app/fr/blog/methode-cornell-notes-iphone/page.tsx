import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "methode-cornell-notes-iphone");

// French version of /blog/apple-notes-cornell-notes-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes
// sur Mac": Format > Tableau gives deux rangs et deux colonnes, la touche Tabulation in the last cell adds a row, select
// paragraphs and choose Format > Tableau to convert text into a table). Fichier > Dupliquer la note is the French string
// in Notes' MainMenu.loctable on macOS 27.2, and the Table button is Tableau in its Localizable.loctable. Option +
// Commande + T (Insérer un tableau) is from support.apple.com/fr-fr/guide/notes/apd46c25187e/mac ("Raccourcis clavier
// et gestes"). Paste as Markdown is not used here, as in the English post. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov)
// give "méthode cornell" (prise de notes, pdf, exemple, word, modèle, template) and "prise de notes cornell"; for Notes,
// only the English "cornell notes apple notes" and "cornell notes template apple notes". Hence the slug "methode cornell
// notes iphone". The example lecture is the English post's, in French. Facts are the English post's; the picture is its
// own, described in French.

const ui = UI.fr;

// Tabs between the question and the note: select those lines in Notes and click the Table button.
const TEMPLATE = `L’offre et la demande, 5 novembre

Question\tNotes
Qu’est-ce qui déplace la courbe de demande ?\tLe revenu, les goûts, le prix des biens liés
Qu’est-ce qui fait bouger le long de la courbe ?\tSeulement le prix du bien lui-même
Quel est le prix d’équilibre ?\tLà où la demande égale l’offre
Que provoque un prix plafond ?\tUne pénurie, s’il est sous l’équilibre

Résumé : Le prix du bien lui-même fait bouger le long de la courbe de demande ; le revenu, les goûts et le prix des biens liés la déplacent. Le prix s’établit là où la demande égale l’offre.
`;

const FAQ = [
  { q: "Peut-on utiliser la méthode Cornell dans Notes ?", a: [
    "Oui, avec un tableau. Créez un tableau à deux colonnes, mettez des questions dans la colonne de gauche et vos notes dans celle de droite, et écrivez un résumé de deux ou trois phrases dessous. Pour réviser, cachez la colonne de droite et répondez aux questions.",
  ] },
  { q: "Comment faire un tableau à deux colonnes dans Notes ?", a: [
    "Sur Mac, choisissez Format, Tableau, ou appuyez sur Option + Commande + T. Vous obtenez deux rangs et deux colonnes, et Tabulation dans la dernière cellule ajoute un rang. Vous pouvez aussi taper les lignes avec une tabulation entre les deux parties, les sélectionner et cliquer sur le bouton Tableau.",
  ] },
  { q: "Puis-je rendre la colonne des questions plus étroite ?", a: [
    "Non. Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser. Gardez des questions courtes, de quelques mots, et la colonne des notes a la place.",
  ] },
  { q: "Existe-t-il une app de méthode Cornell qui m’interroge ?", a: [
    "Pinto Notes a un modèle gratuit Cornell notes. Collez vos notes de cours dans ChatGPT ou Claude : il écrit les questions et le résumé, puis vous interroge sur les questions et garde celles que vous avez ratées.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="methode-cornell-notes-iphone"
      intro={<>
        La méthode Cornell marche parce qu’elle transforme vos notes en questions sur lesquelles vous pouvez vous tester. Notes n’a pas cette
        mise en page, mais un tableau à deux colonnes y mène. Voici un modèle Cornell pour Notes, comment réviser avec, et là où il
        s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#reviser", label: "Réviser avec" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Des notes qui vous interrogent" },
        ]}>
          <p>
            Notes n’a pas de modèle Cornell, mais un tableau à deux colonnes fonctionne : une question courte à gauche, votre note à droite,
            un rang par idée, et un résumé de deux ou trois phrases sous le tableau. Faites une note par cours, et cachez la colonne de droite
            pour réviser.
          </p>
          <PostCta template="cornell-notes" slug="fr/methode-cornell-notes-iphone" path="/fr/blog/methode-cornell-notes-iphone" position="answer" ui={ui.cta}
            title="Les questions écrites, et une interro ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle Cornell gratuit. Collez vos notes de cours dans ChatGPT ou Claude : il écrit les questions et le résumé, puis vous interroge.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/cornell-notes-note" width={1520} height={1010} maxWidth={620}
        alt="Une note Cornell notes dans Pinto Notes sur Mac : un cours Supply and demand avec un tableau Cue et Notes de quatre rangs, un résumé, et une liste de pointage Cues to revisit."
        caption="La méthode Cornell dans Pinto Notes : les questions à gauche, les notes à droite, un résumé, et les questions ratées. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : questions, notes, résumé</h2>
      <p>
        La page Cornell d’origine a trois parties, et une note peut toutes les contenir. La colonne des notes, c’est ce que vous avez écrit
        en cours, en lignes courtes. La colonne des questions, c’est une question à laquelle répond chaque ligne, écrite après le cours. Le
        résumé, c’est deux ou trois phrases avec vos propres mots, et c’est là que se joue l’essentiel de la mémorisation.
      </p>
      <Keep title="Méthode Cornell pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Chaque ligne du tableau a une tabulation entre la question et la note. Collez-le, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez le modèle dans une nouvelle note, sélectionnez les cinq lignes de Question
          à la dernière note, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne : vous avez Question et Notes côte à
          côte.
        </li>
        <li>
          <strong>Ou partez de zéro.</strong> Choisissez Format, Tableau pour deux rangs et deux colonnes. Tapez Question et Notes dans le
          premier rang, et Tabulation dans la dernière cellule ajoute le rang suivant.
        </li>
        <li>
          <strong>Gardez des questions courtes.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser :
          une longue question écrase vos notes. Quelques mots, sous forme de question.
        </li>
        <li>
          <strong>Une note par cours.</strong> Rangez-les dans un dossier par matière, et choisissez Fichier, Dupliquer la note pour partir
          du dernier cours pour le suivant.
        </li>
      </ul>
      <p>
        En cours, ne remplissez que la colonne Notes. Écrivez les questions et le résumé le soir même, tant que vous vous rappelez ce que le
        cours voulait dire. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans
        Notes sait faire, ou pas.
      </p>

      <h2 id="reviser">Réviser avec</h2>
      <ul>
        <li><strong>Cachez la colonne de droite.</strong> Posez une fiche ou votre main sur les notes et répondez à chaque question à voix haute.</li>
        <li><strong>Notez ce que vous avez raté.</strong> Gardez sous le résumé une courte liste de pointage des questions manquées, et cochez chacune une fois que vous y répondez juste.</li>
        <li><strong>Lisez d’abord les résumés.</strong> Avant un examen, les résumés de chaque cours sont le chemin le plus rapide pour revenir dans une matière.</li>
      </ul>
      <p>
        Pour d’autres notes à coller de la même manière, voyez <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais),
        et pour tenir une semaine de révisions, le <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes dans Notes</a>{" "}
        marche aussi pour les séances de travail.
      </p>

      <h2 id="limites">Là où la méthode Cornell dans Notes s’arrête</h2>
      <ul>
        <li><strong>Les questions, c’est vous.</strong> Transformer chaque ligne de notes en une bonne question est la partie lente, et c’est celle que les gens sautent.</li>
        <li><strong>Pas d’interro.</strong> Cacher une colonne avec la main marche, mais rien ne vous pose les questions ni ne retient celles que vous avez ratées.</li>
        <li><strong>Les cours restent séparés.</strong> Réviser un sujet étalé sur trois cours, c’est ouvrir trois notes.</li>
      </ul>

      <h2 id="pinto-notes">Des notes Cornell qui vous interrogent</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/cornell-notes">Cornell notes</a> est une note par
        matière : une section par cours avec un tableau Cue et Notes (questions et notes) et un résumé, et une liste de questions à revoir.
      </p>
      <p>
        Collez vos notes de cours ou de lecture dans votre IA. Elle met vos notes à droite en rangs courts, écrit une question pour chacune à
        gauche, et termine par un résumé en phrases simples. Dites « interroge-moi sur l’offre et la demande », et elle pose les questions une
        par une sans montrer les réponses, puis ajoute celles que vous avez ratées aux questions à revoir et les coche quand vous y répondez
        juste plus tard. Vous pouvez toujours écrire et modifier chaque rang vous-même, et chaque version précédente de la note est gardée.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
