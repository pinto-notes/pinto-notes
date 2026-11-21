import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "compte-rendu-reunion-notes-iphone");

// French version of /blog/apple-notes-meeting-notes-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd58edc7964/mac ("Utiliser les dossiers
// intelligents dans Notes sur Mac": Fichier > Nouveau dossier intelligent, « Listes de pointage » in the first menu, a
// note must match some or all of the rules), support.apple.com/fr-fr/guide/notes/apdc88ed7f1d/mac ("Utiliser des tags":
// type # then a word, the Tags section of the sidebar), support.apple.com/fr-fr/guide/notes/apdb5106e334/mac
// ("Enregistrer et transcrire de l’audio": Enregistrement audio, transcription) and support.apple.com/fr-fr/102462
// (compte Apple). Édition > Coller au format Markdown, Fichier > Dupliquer la note, the Smart Folder filter values Dossiers
// and Non coché, and Résumé for a recording's summary are the French strings in Notes' MainMenu.loctable,
// SmartFolderChecklistsFilterView.loctable and Localizable.loctable on macOS 27.2. Search words: Google's French
// suggestions (hl=fr, gl=fr, 21 Nov) give "compte rendu de réunion" (exemple, ia, modèle), "modèle compte rendu
// réunion" and "compte rendu reunion iphone"; French speakers say compte rendu, not notes de réunion. Hence the slug
// "compte rendu reunion notes iphone". Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Point produit, 24 novembre

Présents : Sara, Jonas, Emma

## Ordre du jour
- Page des tarifs
- Design du paiement

## Notes
- Les commerciaux veulent les nouveaux prix avant décembre
- Deux testeurs sur trois n’ont pas vu le total au paiement

## Décisions
- On garde trois offres, pas d’offre à vie
- Le total passe au-dessus des coordonnées de carte

## Actions
- [ ] Sara : envoyer les nouveaux tarifs aux commerciaux (ven.)
- [ ] Jonas : déplacer le total au paiement (mer.)
- [ ] Emma : vérifier les règles de TVA pour la Norvège (semaine prochaine)
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de compte rendu de réunion ?", a: [
    "Non. Notes n’a aucun modèle. Une note par réunion, avec des sous-titres pour l’ordre du jour, les notes, les décisions et les actions, en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Comment suivre les actions de mes réunions dans Notes ?", a: [
    "Écrivez-les en liste de pointage, avec le nom de la personne en premier. Créez ensuite un dossier intelligent avec deux règles, votre dossier Réunions et Listes de pointage : Non coché, et chaque réunion où il reste quelque chose à faire apparaît au même endroit.",
  ] },
  { q: "Notes peut-il enregistrer et résumer une réunion ?", a: [
    "Avec Apple Intelligence, un enregistrement dans Notes devient une transcription et un résumé. Il ne dit pas qui fait quoi pour quand : les actions, c’est toujours vous qui les écrivez.",
  ] },
  { q: "Existe-t-il une app de comptes rendus qui écrit les actions pour moi ?", a: [
    "Pinto Notes a un modèle gratuit Meeting notes. Collez vos notes en vrac ou une transcription dans ChatGPT ou Claude : il écrit le résumé, les décisions et chaque action avec son responsable et sa date.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="compte-rendu-reunion-notes-iphone"
      intro={<>
        Un compte rendu de réunion ne sert qu’à la partie que la plupart des gens sautent : ce qui a été décidé, et qui fait quoi ensuite.
        Voici un modèle de compte rendu à coller dans Notes, un moyen de voir toutes les actions en cours au même endroit, et là où Notes ne
        suffit plus.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#actions", label: "Les actions en cours" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Des comptes rendus qui s’écrivent" },
        ]}>
          <p>
            Notes n’a pas de modèle de compte rendu, mais une note par réunion fait l’affaire : qui était là, l’ordre du jour, vos notes, les
            décisions, et les actions en liste de pointage avec un nom sur chacune. Gardez-les dans un dossier Réunions, et un dossier
            intelligent affiche chaque action encore ouverte.
          </p>
          <PostCta slug="fr/compte-rendu-reunion-notes-iphone" path="/fr/blog/compte-rendu-reunion-notes-iphone" position="answer" ui={ui.cta}
            title="Les actions écrites pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de compte rendu de réunion. Collez vos notes en vrac dans ChatGPT ou Claude : il écrit le résumé, les décisions et qui fait quoi.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/meeting-notes-note" width={1520} height={1110} maxWidth={620}
        alt="Une note Meeting notes dans Pinto Notes sur Mac : des actions avec un responsable et une date sur chacune, dont une cochée, puis une section Pricing sync avec un résumé en deux lignes et les décisions."
        caption="Des comptes rendus dans Pinto Notes : les actions en cours en haut, chaque réunion en dessous. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note par réunion</h2>
      <p>
        Les décisions et les actions sont les parties que vous reviendrez lire : elles ont donc leurs propres sous-titres. Mettez un nom et un
        jour sur chaque action ; « voir pour la TVA » sans responsable, c’est comme ça que rien ne se passe. Gardez un mot sur chaque ligne,
        car un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Compte rendu de réunion pour Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
        { on: "Mac", steps: ["Fichier", "Dupliquer la note"] },
      ]} />
      <ul>
        <li>
          <strong>Collez-le une fois.</strong> Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La
          ligne # devient le titre, chaque ligne ## un sous-titre et les actions une liste de pointage. Sur iPhone, tapez les sous-titres et
          touchez le bouton Liste de pointage pour les actions.
        </li>
        <li>
          <strong>Gardez une copie vierge.</strong> Videz les lignes d’exemple et gardez cette note dans un dossier Réunions. Avant chaque
          réunion, choisissez Fichier, Dupliquer la note et changez le titre.
        </li>
        <li>
          <strong>Taguez les réunions régulières.</strong> Tapez #point dans la note d’une réunion, et le point de chaque semaine est à un
          toucher dans la barre latérale.
        </li>
        <li>
          <strong>Enregistrez si vous ne pouvez pas taper.</strong> Avec Apple Intelligence, un enregistrement dans Notes devient une
          transcription et un résumé. Recopiez-en les décisions et les actions dans le modèle.
        </li>
      </ul>

      <h2 id="actions">Voir toutes les actions en cours</h2>
      <Paths rows={[{ on: "Mac", steps: ["Fichier", "Nouveau dossier intelligent"] }]} />
      <p>
        Des actions éparpillées dans vingt comptes rendus sont des actions que personne ne fait. Sur Mac, choisissez Fichier, Nouveau dossier
        intelligent, appelez-le Actions en cours, et donnez-lui deux règles qui doivent toutes deux être remplies : Dossiers réglé sur votre
        dossier Réunions, et Listes de pointage réglé sur Non coché. Chaque réunion où il reste quelque chose à faire est dans ce dossier, et
        une réunion en sort dès que sa dernière action est cochée.
      </p>
      <p>
        Si les participants utilisent aussi Notes, partagez la note et autorisez les modifications : chacun coche ses propres actions. Chacun
        a besoin d’un compte Apple. Pour la fin de semaine, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais)
        propose un bilan de la semaine à coller, et <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> (en anglais)
        passe en revue chaque règle qu’un dossier intelligent peut utiliser.
      </p>

      <h2 id="limites">Là où un compte rendu dans Notes s’arrête</h2>
      <ul>
        <li><strong>La mise au propre, c’est vous.</strong> Des notes en vrac ou une transcription ne se transforment pas toutes seules en décisions et en responsables.</li>
        <li><strong>Pas de liste par personne.</strong> Un dossier intelligent montre les réunions avec des actions en cours, pas « tout ce que Sara doit faire ».</li>
        <li><strong>Pas de réponses d’une réunion à l’autre.</strong> « Qu’avons-nous décidé sur les tarifs le mois dernier ? », c’est ouvrir des notes jusqu’à trouver.</li>
      </ul>
      <p>
        Pour deux réunions par semaine, le modèle et un dossier intelligent suffisent. Au-delà, la mise au propre est le travail que personne
        n’a le temps de faire.
      </p>

      <h2 id="pinto-notes">Des comptes rendus qui s’écrivent tout seuls</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/meeting-notes">Meeting notes</a> (comptes rendus de
        réunion) est une seule note pour toutes vos réunions : les actions en cours en haut, et une courte section par réunion en dessous, la
        plus récente d’abord.
      </p>
      <p>
        Après une réunion, collez vos notes en vrac ou une transcription dans votre IA. Elle écrit un résumé en deux lignes et les décisions,
        et ajoute chaque action sous la forme « Sara : envoyer les nouveaux tarifs aux commerciaux (ven.) ». Si quelque chose n’est pas clair,
        elle demande avant d’écrire. Demandez ensuite « qu’est-ce qu’il me reste à faire ? », ou dites-lui que la revue de Jonas est faite, et
        elle coche la ligne. Vous pouvez toujours tout taper et cocher vous-même, et chaque version précédente de la note est gardée.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute, et vos notes Apple arrivent
        en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en anglais). L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
