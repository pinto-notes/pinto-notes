import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "fiche-de-lecture-notes-iphone");

// French version of /blog/apple-notes-book-notes-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apde615d29c2/mac ("Ajouter des liens dans Notes
// sur Mac": Édition > Ajouter un lien, start typing the note's title), support.apple.com/fr-fr/guide/iphone/
// iph908d1558b/ios ("Ajouter des liens dans Notes sur l’iPhone": « Ajouter un lien »; on iPhone you touch the
// selection, and Apple gives that menu no name, so neither does this page, as in the recipe post),
// support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Ajouter un lien, Commande + K),
// support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac ("Utiliser des tags": # then a word) and
// support.apple.com/fr-fr/guide/notes/apd58edc7964/mac ("Utiliser les dossiers intelligents": tags, listes de
// pointage). Édition > Coller au format Markdown, Fichier > Dupliquer la note, the Smart Folder rules Tags and Listes de
// pointage with the value Non coché, and the Checklist button (Liste de pointage) are the French strings in Notes'
// MainMenu.loctable, SmartFolderFilterRow.loctable, SmartFolderChecklistsFilterView.loctable and Localizable.loctable
// on macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "fiche de lecture" (exemple,
// modèle, modèle pdf, modèle word, template) and "carnet de lecture" (à remplir, exemple); nothing for Notes or the
// iPhone. French readers call this a fiche de lecture, hence the slug "fiche de lecture notes iphone". The example book
// keeps its English title; the quote is translated. Facts are the English post's; the picture is its own, described in
// French.

const ui = UI.fr;

const TEMPLATE = `# Four Thousand Weeks, d’Oliver Burkeman

## Les phrases à garder
- « Le jour où vous aurez enfin tout sous contrôle n’arrivera jamais. » (p. 31)

## Mes idées
- La liste de tâches est infinie par nature. La finir n’est pas le but.
- Choisir mes trois grands projets ; le reste attend.
- Dire non à de bonnes choses, c’est ça le plus dur.

## L’idée clé
La vie est courte et l’attention limitée. Vouloir tout faire garantit que l’important passe à la trappe. Choisir ce qu’on néglige, exprès.

## Ce que je vais changer
- [ ] Garder une liste de trois projets en cours, pas plus
- [ ] Faire le plus important d’abord, avant les mails
- [ ] Garder une soirée par semaine sans rien de prévu
`;

const INDEX = `# Livres

## 2026
- Four Thousand Weeks, d’Oliver Burkeman
- Deep Work, de Cal Newport
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de fiche de lecture ?", a: [
    "Non. Notes n’a aucun modèle. Une note par livre, avec des sous-titres pour les citations, vos idées, l’idée clé et ce que vous allez changer, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Comment prendre des notes sur un livre ?", a: [
    "Notez les phrases qui vous arrêtent, avec le numéro de page, et une courte idée à vous à côté. Quand vous avez fini, écrivez l’idée clé du livre en trois phrases et une ou deux choses que vous allez changer.",
  ] },
  { q: "Comment retrouver une citation dans Notes ?", a: [
    "La recherche lit chaque mot de chaque note : quelques mots de la citation suffisent à la retrouver. Ajouter le tag #livres à chaque fiche permet aussi à un dossier intelligent de les réunir au même endroit.",
  ] },
  { q: "Existe-t-il une app de fiches de lecture qui fonctionne comme Notes ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit de fiches de lecture. Envoyez vos passages surlignés à ChatGPT ou Claude pendant votre lecture et il les range sous le livre ; quand vous avez fini, il écrit l’idée clé.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="fiche-de-lecture-notes-iphone"
      intro={<>
        Un an après un bon livre, la plupart des gens se souviennent de la couverture et d’une idée, au mieux. Une page de notes par livre
        change ça. Voici un modèle de fiche de lecture à coller dans Notes, un sommaire pour les garder ensemble, et là où Notes s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#pendant", label: "Pendant la lecture" },
          { href: "#sommaire", label: "Les garder ensemble" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Des fiches qui écrivent l’idée clé" },
        ]}>
          <p>
            Notes n’a pas de modèle de fiche de lecture, mais une note par livre fait l’affaire : les phrases à garder avec leur numéro de
            page, vos propres idées, l’idée clé en trois phrases une fois le livre fini, et une liste de pointage de ce que vous allez
            changer. Copiez le modèle ci-dessous pour chaque nouveau livre.
          </p>
          <PostCta template="book-notes" slug="fr/fiche-de-lecture-notes-iphone" path="/fr/blog/fiche-de-lecture-notes-iphone" position="answer" ui={ui.cta}
            title="Vos passages rangés pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de fiches de lecture. Envoyez un passage à ChatGPT ou Claude pendant votre lecture et il le range ; quand vous avez fini, il écrit l’idée clé.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/book-notes-note" width={1520} height={1255} maxWidth={600}
        alt="Une note Book notes dans Pinto Notes sur Mac : Four Thousand Weeks d’Oliver Burkeman avec une citation de la page 31, quatre idées, l’idée clé et une liste de pointage de trois choses à changer, puis Deep Work de Cal Newport."
        caption="Des fiches de lecture dans Pinto Notes, une section par livre, comme le modèle les enregistre. Données d’exemple. Les sous-titres, les puces et la liste de pointage marchent pareil dans Notes." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note par livre</h2>
      <p>
        Quatre parties, dans l’ordre où vous les remplissez. Les citations et vos idées viennent pendant la lecture. L’idée clé et la liste
        de pointage viennent une fois le livre fini, et ce sont les parties que vous reviendrez lire. Gardez un mot sur chaque ligne, car un
        élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Fiche de lecture pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown fait de la ligne # le titre, de chaque ligne ## un sous-titre et de la
        dernière partie une liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-la, sélectionnez les
        dernières lignes et touchez le bouton Liste de pointage. Pour le livre suivant, choisissez Fichier, Dupliquer la note et remplacez
        les mots.
      </p>

      <h2 id="pendant">Pendant la lecture</h2>
      <ul>
        <li>
          <strong>Le numéro de page d’abord.</strong> Tapez la page avant la citation. Ça prend une seconde, et c’est comme ça que vous
          retrouvez la phrase dans le livre.
        </li>
        <li>
          <strong>Vos mots, pas un résumé.</strong> Une idée comme « dire non à de bonnes choses, c’est ça le plus dur » vaut plus qu’une
          paraphrase propre du chapitre.
        </li>
        <li>
          <strong>Écrivez l’idée clé dans la journée.</strong> Trois phrases, de mémoire, avant de commencer le livre suivant. Si vous n’y
          arrivez pas, le livre n’a pas marqué, et c’est bon à savoir aussi.
        </li>
        <li>
          <strong>Gardez la liste courte.</strong> Deux à quatre choses que vous allez vraiment essayer. Cochez-les quand elles deviennent
          des habitudes.
        </li>
      </ul>

      <h2 id="sommaire">Les garder ensemble</h2>
      <p>
        Tapez #livres sous le titre de chaque fiche : c’est un tag. Un dossier intelligent avec la règle Tags réglée sur livres réunit toutes
        les fiches au même endroit, et ajouter la règle Listes de pointage : Non coché ne montre que les livres où il reste quelque chose à
        essayer. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> (en anglais) montre comment en créer un.
      </p>
      <Keep title="Sommaire des livres pour Notes" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Ajouter un lien"], keys: "⌘K" },
        { on: "iPhone", steps: ["Touchez la sélection", "Ajouter un lien"] },
      ]} />
      <p>
        Pour un sommaire par année, gardez une note de plus, Livres, et faites de chaque titre un lien : sélectionnez-le, choisissez Ajouter
        un lien et choisissez la note du livre. La recherche lit chaque mot de chaque note : quelques mots d’une citation la retrouvent même
        quand vous avez oublié le livre. Les livres pas encore lus ont leur place dans une{" "}
        <a href="/fr/blog/liste-de-livres-a-lire-notes-iphone">liste de livres à lire</a>, et d’autres notes à coller sont dans{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où une fiche de lecture dans Notes s’arrête</h2>
      <ul>
        <li><strong>Chaque citation se tape à la main.</strong> Recopier une phrase d’un livre papier, c’est poser le livre, trouver la note et taper.</li>
        <li><strong>L’idée clé est la partie qu’on saute.</strong> Rien ne vous rappelle de l’écrire, et une semaine plus tard c’est plus dur.</li>
        <li><strong>Le sommaire se fait à la main.</strong> Un nouveau livre n’y est pas tant que vous n’avez pas ajouté son lien.</li>
        <li><strong>Les livres restent séparés.</strong> La recherche trouve des mots. Elle ne vous dit pas ce que trois livres sur la concentration avaient en commun.</li>
      </ul>

      <h2 id="pinto-notes">Des fiches de lecture qui écrivent l’idée clé</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/book-notes">Book notes</a> (fiches de lecture) est une
        note avec une section par livre, le plus récent d’abord : les citations, vos idées, l’idée clé et ce que vous allez changer.
      </p>
      <p>
        Dites à votre IA quel livre vous lisez et elle commence sa section. Envoyez-lui un passage en cours de route, comme « page 31 : le
        jour où vous aurez enfin tout sous contrôle n’arrivera jamais », et elle le range en citation avec le numéro de page. Vos propres
        idées vont en puces, avec vos mots, sans les lisser. Dites « j’ai fini, fais le bilan » et elle écrit l’idée clé en trois phrases et
        deux à quatre choses à changer, en liste de pointage. Vous pouvez toujours écrire et modifier chaque ligne vous-même, et chaque
        version précédente de la note est gardée. <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend
        une minute.
      </p>
      <p>
        Les fiches de lecture que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre
        Mac</a> (en anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
