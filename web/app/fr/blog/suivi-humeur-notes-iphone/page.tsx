import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-humeur-notes-iphone");

// French version of /blog/apple-notes-mood-tracker (templates translation, 21 Nov 2026). Apple's own French words, all
// read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes sur Mac":
// Format > Tableau, la touche Tabulation), support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Option + Commande +
// T), support.apple.com/fr-fr/guide/notes/apda85974595/mac (résultats mathématiques: an expression followed by the
// equals sign) and support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler). The Table button (Tableau) is the
// French string in Notes' MainMenu.loctable on macOS 27.2. Paste as Markdown is not used for the table, as in the
// English post. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "suivi humeur" (application,
// journal, carnet, tableau), "suivi de l'humeur" (journal, tableau de suivi de l'humeur quotidienne) and "mood tracker"
// (bullet journal, à imprimer); nothing for Notes or the iPhone. Hence the slug "suivi humeur notes iphone". No medical
// advice, as in the English post. Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

// Tabs between the columns: select those lines in Notes and click the Table button.
const TEMPLATE = `Humeur et énergie

Date\tHumeur (1 à 5)\tÉnergie (1 à 5)\tSommeil (heures)\tNote
4 nov.\t4\t4\t7,5\tSport avant le travail
5 nov.\t3\t2\t6\tRéunions toute la journée
6 nov.\t4\t3\t6,5\tDéjeuner avec Maja
7 nov.\t4\t2\t5,5\tDéménagement de Maja
8 nov.\t4\t4\t8\tGrasse matinée

Tendances
`;

const FAQ = [
  { q: "Notes a-t-il un suivi de l’humeur ?", a: [
    "Non. Notes n’a ni suivi de l’humeur ni modèles. Un tableau avec un rang par soir, avec l’humeur, l’énergie, le sommeil et une courte note, en fait office, et vous pouvez coller le modèle de cette page puis le transformer en tableau.",
  ] },
  { q: "Que mettre dans un suivi de l’humeur ?", a: [
    "Assez peu pour le remplir chaque soir : la date, l’humeur et l’énergie de 1 à 5, les heures de sommeil et une ligne sur la journée. La ligne compte le plus, car c’est elle qui explique plus tard une mauvaise note.",
  ] },
  { q: "Notes peut-il faire un graphique de mon humeur ?", a: [
    "Non. Un tableau dans Notes ne trie pas, ne fait pas de totaux et ne dessine pas de graphique. Vous lisez les colonnes vous-même, ou vous copiez les rangs dans un tableur quand vous voulez une courbe.",
  ] },
  { q: "Existe-t-il un suivi de l’humeur qui repère les tendances pour moi ?", a: [
    "Pinto Notes a un modèle gratuit Mood and energy log. Racontez votre journée à ChatGPT ou Claude et il note les scores, et quand vous le demandez, il écrit ce qu’il remarque et sur combien de jours ça repose.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="suivi-humeur-notes-iphone"
      intro={<>
        Une mauvaise semaine semble venir de nulle part, jusqu’à ce qu’on regarde les nuits d’avant. Un suivi de l’humeur, c’est la façon de
        regarder. Voici un suivi de l’humeur et de l’énergie à coller dans Notes, un moyen de le tenir plus d’une semaine, et là où une note
        s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#chaque-soir", label: "Chaque soir" },
          { href: "#relire", label: "Relire" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un suivi qui repère les tendances" },
        ]}>
          <p>
            Notes n’a pas de suivi de l’humeur, mais un tableau fait l’affaire : un rang par soir avec la date, l’humeur et l’énergie de 1 à 5,
            les heures de sommeil et une ligne sur la journée. Au bout de quelques semaines, lisez les colonnes pour voir ce que vos bonnes
            journées ont en commun.
          </p>
          <PostCta template="mood-energy-log" slug="fr/suivi-humeur-notes-iphone" path="/fr/blog/suivi-humeur-notes-iphone" position="answer" ui={ui.cta}
            title="Les tendances repérées pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un suivi gratuit de l’humeur et de l’énergie. Racontez votre journée à ChatGPT ou Claude et il note le rang, puis vous dit ce qu’il remarque quand vous demandez.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/mood-energy-log-note" width={1520} height={1057} maxWidth={600}
        alt="Une note Mood and energy log dans Pinto Notes sur Mac : un tableau Check-ins de cinq soirs, du 4 au 8 novembre, chacun avec l’humeur, l’énergie, les heures de sommeil et une courte note, et trois tendances en dessous."
        caption="Un suivi de l’humeur et de l’énergie dans Pinto Notes, où l’humeur et l’énergie sont des échelles de 1 à 5. Dans Notes, les mêmes colonnes marchent en tableau simple. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un rang par soir</h2>
      <p>
        Cinq colonnes, et chacune a sa raison d’être. L’humeur, c’est comment la journée s’est vécue. L’énergie, c’est combien vous en aviez,
        et ce n’est pas la même chose : une bonne journée peut vous laisser à plat. Le sommeil est le chiffre qui a le plus de chances
        d’expliquer les deux. La note, c’est une ligne sur la journée, pour qu’un 3 veuille encore dire quelque chose dans deux semaines. Cinq
        soirs d’exemple sont remplis ; remplacez-les par les vôtres.
      </p>
      <Keep title="Suivi de l’humeur et de l’énergie pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Chaque ligne du tableau a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez le modèle dans une nouvelle note, sélectionnez les six lignes de Date au
          dernier soir, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne : vous avez Date, Humeur, Énergie, Sommeil et
          Note côte à côte.
        </li>
        <li>
          <strong>Videz les exemples, ajoutez vos rangs.</strong> Supprimez les soirs d’exemple ou tapez par-dessus. Tabulation dans la
          dernière cellule ajoute le rang suivant.
        </li>
        <li>
          <strong>Gardez la note courte.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser : une longue
          note écrase les chiffres. Quelques mots suffisent.
        </li>
        <li>
          <strong>Épinglez-la.</strong> Épinglez la note en haut de son dossier : le point du soir est à un toucher.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans Notes sait faire, ou pas.
      </p>

      <h2 id="chaque-soir">Chaque soir</h2>
      <ul>
        <li><strong>Même heure, chaque jour.</strong> Remplissez-le en vous brossant les dents ou en mettant le téléphone à charger, pour l’accrocher à quelque chose que vous faites déjà.</li>
        <li><strong>Notez toute la journée.</strong> L’humeur à 22 h après un bon dîner dit peu d’un après-midi difficile. Repensez à la journée avant de choisir un chiffre.</li>
        <li><strong>Servez-vous de toute l’échelle.</strong> Si chaque jour vaut 3, le suivi ne peut rien vous montrer. Un 1 ou un 5 de temps en temps, c’est honnête.</li>
        <li><strong>Écrivez ce qui était différent.</strong> « Réunions toute la journée » ou « grasse matinée », c’est ce que vous chercherez plus tard.</li>
        <li><strong>Laissez un jour manqué vide.</strong> Un trou vaut mieux qu’un chiffre inventé trois jours après.</li>
      </ul>
      <p>
        Si vous voulez des mots en plus des chiffres, vous pouvez répondre à quatre courtes questions par jour dans un journal Notes, et le <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes</a> se range à côté de
        cette note pour des choses comme une balade ou pas d’écran après 22 h.
      </p>

      <h2 id="relire">Relire</h2>
      <p>
        Une fois par semaine, lisez le tableau et écrivez ce que vous remarquez sous Tendances. La recherche lit chaque mot de chaque note :
        chercher « réunions » trouve chaque jour où vous l’avez écrit. Pour un total rapide, les résultats mathématiques font les calculs que
        vous tapez : 4+3+4+4+4= sous le tableau additionne l’humeur de la semaine.
      </p>
      <p>
        Laissez passer quelques semaines avant de tirer des conclusions ; cinq jours, c’est un début. C’est un journal de ce que vous avez
        ressenti, pas un outil de santé. Si les mauvais jours s’accumulent, parlez-en à un médecin.
      </p>

      <h2 id="limites">Là où un suivi de l’humeur dans Notes s’arrête</h2>
      <ul>
        <li><strong>Les tableaux ne comptent pas.</strong> Un tableau dans Notes ne peut pas mettre vos meilleurs jours en haut, faire la moyenne d’une colonne ou dessiner un graphique.</li>
        <li><strong>Les tendances se voient à l’œil.</strong> Voir que l’énergie baisse après une nuit courte, c’est lire chaque rang et tout garder en tête.</li>
        <li><strong>Le rang se tape.</strong> Un soir de fatigue, cinq cellules suffisent pour vous faire sauter le jour.</li>
      </ul>
      <p>
        Pour un mois, un tableau dans une note suffit. Sur plusieurs mois, la partie utile, voir ce qui vous porte et ce qui vous vide, vous
        revient.
      </p>

      <h2 id="pinto-notes">Un suivi de l’humeur qui repère les tendances</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/mood-energy-log">Mood and energy log</a> (suivi de
        l’humeur et de l’énergie) est une note avec un tableau Check-ins : une date, l’humeur et l’énergie en échelles de 1 à 5, le sommeil
        en heures et une note, avec Patterns en dessous.
      </p>
      <p>
        Chaque soir, racontez votre journée à votre IA avec vos mots. Elle ajoute le rang, avec l’humeur et l’énergie de 1 (bas) à 5
        (excellent), votre sommeil et une ligne courte. Quand elle n’est pas sûre d’un score, elle vous demande au lieu de deviner. Au bout de
        quelques semaines, demandez « qu’est-ce que mes meilleurs jours ont en commun ? » ou « une nuit courte change-t-elle mon énergie le
        lendemain ? » et elle écrit ce qu’elle remarque sous Patterns, avec le nombre de jours sur lequel ça repose. Elle ne donne pas de
        conseils médicaux. Vous pouvez toujours ajouter et modifier chaque rang vous-même, et chaque version précédente de la note est
        gardée. Ça marche une fois ChatGPT ou Claude connecté ; <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en
        anglais) prend une minute.
      </p>
      <p>
        Un suivi que vous tenez déjà dans Notes arrive en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
