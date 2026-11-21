import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "entretien-maison-notes-iphone");

// French version of /blog/apple-notes-home-maintenance-checklist (templates translation, 21 Nov 2026). Apple's own
// French words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans
// Notes sur Mac": Format > Plus > « Tout décocher », « Trier automatiquement les tâches terminées » dans les réglages de
// Notes), support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (Format > Tableau, la touche Tabulation),
// support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Option + Commande + T), support.apple.com/fr-fr/guide/notes/
// apd58edc7964/mac ("Utiliser les dossiers intelligents"), support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac
// (épingler) and support.apple.com/fr-fr/102462 (compte Apple). Édition > Coller au format Markdown, the Table button
// (Tableau), the Checklist button (Liste de pointage) and the Smart Folder rule Listes de pointage with the value Non
// coché are the French strings in Notes' MainMenu.loctable, Localizable.loctable, SmartFolderFilterRow.loctable and
// SmartFolderChecklistsFilterView.loctable on macOS 27.2. Paste as Markdown is not used for the table, as in the
// English post. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "check list entretien maison",
// "calendrier entretien maison", "carnet entretien maison" and "planning entretien maison"; nothing for Notes. Hence the
// slug "entretien maison notes iphone". The tradespeople and phone numbers are made up. Facts are the English post's;
// the picture is its own, described in French.

const ui = UI.fr;

const NOTE = `# Entretien de la maison

Les tâches qui font tourner la maison, leur fréquence, et quand elles ont été faites.

## Tâches
Collez le tableau des tâches sous cette ligne.

## Ce mois-ci
- [ ] Tester les détecteurs de fumée (le 14 nov.)
- [ ] Entretien de la chaudière (le 20 nov.)
- [ ] Nettoyer les gouttières (le 24 nov.)

## Qui appeler
- Plombier : Martin et Fils, 01 84 60 04 27
- Électricien : Volt Dépannage, 01 84 60 04 63

## Appareils
- Lave-vaisselle : Bosch Série 4, garantie jusqu’en 2028
- Chaudière : Vaillant ecoTEC, posée en 2021
`;

// Tabs between the columns: select those lines in Notes and click the Table button.
const JOBS = `Tâche\tTous les\tFait le\tProchaine fois
Détartrer la bouilloire\tMois\t1 nov. 2026\t1 déc. 2026
Nettoyer le filtre du lave-vaisselle\tMois\t5 nov. 2026\t5 déc. 2026
Tester les détecteurs de fumée\t3 mois\t14 août 2026\t14 nov. 2026
Entretien de la chaudière\tAn\t20 nov. 2025\t20 nov. 2026
Nettoyer les gouttières\t6 mois\t24 mai 2026\t24 nov. 2026
`;

const FAQ = [
  { q: "Notes a-t-il un modèle d’entretien de la maison ?", a: [
    "Non. Notes n’a aucun modèle. Une note avec un tableau des tâches, une liste de pointage pour le mois et les numéros à appeler en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Que mettre dans une check-list d’entretien de la maison ?", a: [
    "Chaque tâche qui revient, sa fréquence et la dernière fois que vous l’avez faite. Commencez par celles qui coûtent cher quand on les oublie : les détecteurs de fumée, l’entretien de la chaudière, les gouttières et les filtres.",
  ] },
  { q: "Notes peut-il me rappeler quand une tâche arrive ?", a: [
    "La note ne vous prévient pas d’elle-même. Vous l’ouvrez et lisez la colonne Prochaine fois. Une liste de pointage pour le mois, faite au début de chaque mois, garde les tâches à faire dans une liste courte.",
  ] },
  { q: "Existe-t-il une app d’entretien de la maison qui suit les échéances ?", a: [
    "Pinto Notes a un modèle gratuit Home maintenance. Dites à ChatGPT ou Claude qu’une tâche est faite et il met à jour les dates, et demandez ce qui tombe ce mois-ci pour qu’il fasse la liste de pointage.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="entretien-maison-notes-iphone"
      intro={<>
        Personne n’oublie le détecteur de fumée exprès. Il passe à la trappe parce que le dernier test est si loin que plus personne ne s’en
        souvient. Voici une check-list d’entretien de la maison à coller dans Notes, une façon de la suivre chaque mois, et là où elle
        s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#chaque-mois", label: "Chaque mois" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Une liste qui sait ce qui tombe" },
        ]}>
          <p>
            Notes n’a pas de modèle d’entretien de la maison, mais une note fait l’affaire : un tableau de chaque tâche qui revient, avec sa
            fréquence et la dernière fois qu’elle a été faite, puis une liste de pointage de ce qui tombe ce mois-ci, les gens à appeler et
            les références de vos appareils.
          </p>
          <PostCta template="home-maintenance" slug="fr/entretien-maison-notes-iphone" path="/fr/blog/entretien-maison-notes-iphone" position="answer" ui={ui.cta}
            title="Les dates tenues pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit d’entretien de la maison. Dites à ChatGPT ou Claude qu’une tâche est faite et il met à jour les dates, ou demandez ce qui tombe ce mois-ci.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/home-maintenance-note" width={1520} height={1557} maxWidth={600}
        alt="Une note Home maintenance dans Pinto Notes sur Mac : un tableau Jobs de cinq tâches, de Descale the kettle à Clear the gutters, avec leur fréquence et les dates de la dernière et de la prochaine fois, une liste de pointage This month avec deux tâches sur cinq cochées, Who to call et Appliances."
        caption="Une note d’entretien de la maison dans Pinto Notes, où la fréquence est une liste à choix. Dans Notes, les mêmes colonnes marchent en tableau simple, avec la liste de pointage et les listes dessous. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : les tâches, ce mois-ci, qui appeler</h2>
      <p>
        Le tableau est l’historique : chaque tâche qui revient, sa fréquence, la dernière fois qu’elle a été faite et la prochaine. La liste
        de pointage, c’est ce que vous faites ce mois-ci. Qui appeler et Appareils, c’est ce que vous cherchez quand quelque chose lâche. Les
        tâches d’exemple sont un début ; ajoutez les vôtres et supprimez celles qui ne vous concernent pas.
      </p>
      <Keep title="Entretien de la maison pour Notes" text={NOTE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Keep title="Tableau des tâches pour Notes" text={JOBS} copyLabel={ui.copy}
        note="Chaque ligne a une tabulation entre les colonnes. Collez-le sous Tâches, puis transformez ces lignes en tableau." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
        { on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" },
      ]} />
      <ul>
        <li>
          <strong>Collez la note.</strong> Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La
          ligne # devient le titre, les lignes ## des sous-titres et les tâches du mois une liste de pointage. Un simple Commande + V garde
          les symboles en texte.
        </li>
        <li>
          <strong>Puis le tableau.</strong> Remplacez la ligne sous Tâches par le tableau des tâches, sélectionnez ses six lignes de Tâche à
          la dernière tâche, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne.
        </li>
        <li>
          <strong>Ajoutez une tâche.</strong> Tabulation dans la dernière cellule ajoute un rang. Écrivez les dates avec l’année, pour qu’une
          tâche faite une fois par an ait encore un sens en novembre prochain.
        </li>
        <li>
          <strong>Gardez des noms de tâche courts.</strong> Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser :
          une longue tâche écrase les dates.
        </li>
      </ul>
      <p>
        Épinglez la note en haut de son dossier. Sur iPhone, tapez les sous-titres une fois, sélectionnez les tâches du mois et touchez le
        bouton Liste de pointage. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans
        Notes sait faire, ou pas.
      </p>

      <h2 id="chaque-mois">Chaque mois</h2>
      <Paths rows={[{ on: "Mac", steps: ["Format", "Plus", "Tout décocher"] }]} />
      <ul>
        <li>
          <strong>Faites la liste du mois.</strong> Le premier du mois, lisez la colonne Prochaine fois et écrivez une ligne de liste de
          pointage pour chaque tâche qui tombe ce mois-ci, avec sa date.
        </li>
        <li>
          <strong>Cochez, puis mettez le rang à jour.</strong> Quand une tâche est faite, cochez-la et changez Fait le et Prochaine fois dans le
          tableau. La coche vaut pour ce mois. Le rang, c’est ce que l’année prochaine relira.
        </li>
        <li>
          <strong>Laissez descendre les tâches cochées.</strong> Avec « Trier automatiquement les tâches terminées » activé, ce qui est fait
          descend en bas et ce qui reste est en haut.
        </li>
        <li>
          <strong>Réutilisez la liste.</strong> Si les mêmes tâches mensuelles reviennent chaque fois, gardez-les et choisissez Format, Plus,
          Tout décocher pour recommencer.
        </li>
      </ul>
      <p>
        Un dossier intelligent avec la règle Listes de pointage : Non coché montre chaque note où il reste quelque chose à faire : une tâche
        restée du mois dernier ne sort pas de votre vue. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> (en
        anglais) montre comment en créer un. Quand un tuyau fuit, la recherche lit chaque mot de chaque note : « plombier » ou « Bosch »
        trouve tout de suite le numéro ou la référence. Pour tenir la maison à deux, partager la note demande un compte Apple pour chaque
        personne. D’autres notes à coller comme celle-ci sont dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en
        anglais).
      </p>

      <h2 id="limites">Là où une liste d’entretien dans Notes s’arrête</h2>
      <ul>
        <li><strong>La prochaine date, c’est votre calcul.</strong> Notes ne déduit pas qu’une tâche tous les 3 mois faite le 14 août tombe le 14 novembre. C’est vous qui écrivez la date.</li>
        <li><strong>Le tableau ne trie pas.</strong> Il ne peut pas mettre la prochaine tâche en haut : vous lisez chaque rang pour trouver ce qui tombe.</li>
        <li><strong>La liste du mois se recopie à la main.</strong> Si vous sautez le premier du mois, rien ne fait la liste pour vous.</li>
        <li><strong>Les dates dérivent.</strong> Une tâche cochée mais pas mise à jour dans le tableau aura l’air en retard l’an prochain.</li>
      </ul>
      <p>
        Pour un appartement avec cinq tâches, une note suffit largement. Pour une maison avec trente, garder les dates justes, c’est le
        travail, et il vous revient.
      </p>

      <h2 id="pinto-notes">Une liste qui sait ce qui tombe</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/home-maintenance">Home maintenance</a> (entretien de
        la maison) est la même note : un tableau Jobs où la fréquence est un choix parmi Month, 3 months, 6 months ou Year, une liste de
        pointage This month, Who to call et Appliances.
      </p>
      <p>
        Parlez à votre IA d’une tâche à suivre et de la dernière fois que vous l’avez faite, et elle ajoute le rang avec les deux dates, année
        comprise. Demandez « qu’est-ce qui tombe ce mois-ci ? » et elle écrit la liste de pointage sous This month. Dites « la chaudière a
        été entretenue aujourd’hui » et elle change les deux dates et coche la tâche. Mentionnez une référence ou une date de garantie et
        elle va sous Appliances. Vous pouvez toujours ajouter et modifier chaque rang vous-même, et chaque version précédente de la note est
        gardée. Ça marche une fois ChatGPT ou Claude connecté ; <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en
        anglais) prend une minute.
      </p>
      <p>
        Les listes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
