import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "planning-semaine-notes-iphone");

// French version of /blog/apple-notes-planner-template (batch 3, 21 Nov 2026). Apple's own French words, all read on
// 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac ("Ajouter des listes dans Notes sur Mac": Format >
// Plus > « Tout décocher », « Trier automatiquement les tâches terminées » dans les réglages de Notes),
// support.apple.com/fr-fr/guide/notes/apd58edc7964/mac ("Utiliser les dossiers intelligents": Fichier > Nouveau dossier
// intelligent), support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler, en haut de la liste),
// support.apple.com/fr-fr/guide/notes/apde615d29c2/mac (Édition > Ajouter un lien) and apd46c25187e/mac (Ajouter un lien
// Commande + K). Édition > Coller au format Markdown, Fichier > Dupliquer la note, the Checklist button (Liste de
// pointage) and the Smart Folder rule Listes de pointage with the value Non coché are the French strings in Notes'
// MainMenu.loctable, Localizable.loctable, SmartFolderFilterRow.loctable and SmartFolderChecklistsFilterView.loctable on
// macOS 27.2. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "planning semaine" (à imprimer, à
// remplir), "planning de la semaine" (à remplir, vierge), "modèle planning semaine" (gratuit, excel, word), "planning
// hebdomadaire", "planificateur hebdomadaire" and "organiser sa semaine"; for Notes only "planner apple notes" and
// "organisation apple notes", in English. Hence the slug "planning semaine notes iphone", with "planning de la semaine"
// in the title. The Pinto template's headings stay in English, as the app is. The example week is the English post's,
// in French. Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

const WEEKLY = `# Semaine du 16 novembre

## Les trois priorités de la semaine
- [ ] Envoyer le budget du T4 à Jonas
- [ ] Réserver les billets pour Noël
- [ ] Courir trois fois

## Lundi
- [ ] Réunion d’équipe à 9 h
- [ ] Finir le brouillon du budget

## Mardi
- [ ] Dentiste à 8 h 30
- [ ] Courir 5 km

## Mercredi
- [ ] Appeler maman
- [ ] Renvoyer le colis

## Jeudi
- [ ] Prendre rendez-vous pour la révision de la voiture
- [ ] Dîner avec Sara à 19 h

## Vendredi
- [ ] Récupérer le pressing

## Samedi
- [ ] Marché

## Dimanche
- [ ] Préparer la semaine prochaine

## Plus tard
- [ ] Renouveler mon passeport
- [ ] Réparer l’éclairage du vélo
`;

const DAILY = `# Aujourd’hui

## Les trois priorités
- [ ] Finir le brouillon du budget
- [ ] Appeler maman
- [ ] Courir 5 km

## Matin
- [ ] Réunion d’équipe à 9 h
- [ ] Répondre au mail de Jonas

## Après-midi
- [ ] Relire les slides d’Emma
- [ ] Récupérer le pressing

## Soir
- [ ] Dîner avec Sara à 19 h

## Demain
- [ ] Ce qui n’a pas été fait
`;

const FAQ = [
  { q: "Notes a-t-il un modèle de planning ?", a: [
    "Non. Notes n’a aucun modèle. Une note par semaine, avec un sous-titre par jour et les tâches du jour en liste de pointage, fait office de planning, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Comment utiliser Notes comme planning ?", a: [
    "Gardez une note par semaine dans un dossier Planning et épinglez la note de la semaine en cours en haut. Mettez vos trois priorités en premier, chaque tâche sous son jour, et ce qui n’a pas de jour sous Plus tard. Le dimanche, dupliquez la note pour la semaine suivante et déplacez ce qui reste.",
  ] },
  { q: "Peut-on faire un planning du jour dans Notes sur iPhone ?", a: [
    "Oui. Tapez les sous-titres et les tâches, sélectionnez les tâches et touchez le bouton Liste de pointage. Coller au format Markdown est sur Mac : le plus rapide est de coller le modèle sur un Mac et de laisser la note se synchroniser avec votre iPhone.",
  ] },
  { q: "Existe-t-il une app de planning qui fonctionne comme Notes ?", a: [
    "Pinto Notes ressemble à Notes et fonctionne comme lui, et a un modèle gratuit de planning de la semaine. Dites à ChatGPT ou Claude ce que vous avez cette semaine : il range chaque tâche sous son jour et garde vos trois priorités.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="planning-semaine-notes-iphone"
      intro={<>
        Beaucoup de gens planifient leur semaine dans Notes : une liste par jour, quelques choses qui comptent plus que le reste, et une pile
        de choses pour plus tard. Ça marche bien dès que chaque semaine a la même forme. Voici un modèle de planning de la semaine pour Notes
        à coller, une version pour la journée, comment tenir une semaine avec, et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#semaine", label: "Le planning de la semaine" },
          { href: "#jour", label: "Un planning du jour" },
          { href: "#utiliser", label: "Notes comme planning" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Une semaine planifiée pour vous" },
        ]}>
          <p>
            Notes n’a pas de modèle de planning, mais une note par semaine fait l’affaire : vos trois priorités en haut, un sous-titre par jour
            avec les tâches du jour en liste de pointage, et une liste Plus tard pour le reste. Collez le modèle de la semaine ci-dessous dans
            une nouvelle note, ou celui du jour si vous planifiez un jour à la fois.
          </p>
          <PostCta template="weekly-planner" slug="fr/planning-semaine-notes-iphone" path="/fr/blog/planning-semaine-notes-iphone" position="answer" ui={ui.cta}
            title="La semaine planifiée pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un planning de la semaine gratuit. Dites à ChatGPT ou Claude ce que vous avez cette semaine : il range chaque tâche sous son jour et garde vos trois priorités.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="Une note Weekly planner dans Pinto Notes sur Mac : une liste de pointage Top three this week avec un élément coché, un sous-titre par jour du lundi au dimanche avec les tâches du jour en liste de pointage, les jours jusqu’à vendredi cochés, et une liste Later."
        caption="Une semaine dans Pinto Notes, planifiée avec le modèle de planning de la semaine. La même mise en page marche dans Notes. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="semaine">Le modèle de planning de la semaine</h2>
      <p>
        Une seule note contient toute la semaine. Les trois priorités viennent en premier, pour être la première chose que vous voyez en
        l’ouvrant. Chaque jour a un sous-titre et sa propre liste de pointage, et Plus tard garde ce qui n’a pas encore de jour, pour que ça
        n’encombre plus le lundi. Mettez vos propres tâches avant de coller, et gardez un mot sur chaque ligne, car un élément de liste vide ne
        survit pas au collage.
      </p>
      <Keep title="Planning de la semaine pour Notes" text={WEEKLY} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown transforme la ligne # en titre, chaque ligne ## en sous-titre et les
        tâches en liste de pointage. Un simple Commande + V garde les symboles en texte. Sur iPhone, tapez-le, sélectionnez les tâches et
        touchez le bouton Liste de pointage.
      </p>

      <h2 id="jour">Une version pour la journée</h2>
      <p>
        Si vous planifiez un jour à la fois, gardez une seule note appelée Aujourd’hui et épinglez-la en haut de son dossier. Les trois
        priorités viennent d’abord, puis la journée en trois parties, et une liste Demain pour ce qui n’a pas été fait.
      </p>
      <Keep title="Planning du jour pour Notes" text={DAILY} copyLabel={ui.copy} />
      <p>
        Chaque matin, supprimez ce que vous avez coché la veille, remontez les lignes de Demain dans la journée et choisissez trois nouvelles
        priorités. Si certaines lignes reviennent tous les jours, comme une course à pied ou la boîte mail, cliquez dans la liste et
        choisissez Format, Plus, Tout décocher au lieu de les retaper.
      </p>

      <h2 id="utiliser">Comment utiliser Notes comme planning</h2>
      <ul>
        <li>
          <strong>Une note par semaine.</strong> Rangez-les dans un dossier Planning et épinglez la note de la semaine en cours en haut, pour
          qu’elle soit à un toucher sur votre iPhone.
        </li>
        <li>
          <strong>Partez de cette semaine pour la suivante.</strong> Le dimanche, choisissez Fichier, Dupliquer la note, changez la date dans
          le titre, supprimez ce qui est coché et déplacez ce qui reste sous Lundi.
        </li>
        <li>
          <strong>Laissez descendre ce qui est fait.</strong> Activez Trier automatiquement les tâches terminées, et les tâches cochées
          descendent en bas de chaque jour.
        </li>
        <li>
          <strong>Retrouvez ce qui reste ouvert.</strong> Un dossier intelligent avec la règle Listes de pointage : Non coché montre chaque
          note qui a encore une tâche ouverte, dans tous vos dossiers (plus de détails dans{" "}
          <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a>, en anglais).
        </li>
        <li>
          <strong>Reliez les choses plus grosses.</strong> Sélectionnez une tâche, choisissez Édition, Ajouter un lien (Commande + K) et
          choisissez la note à laquelle elle appartient, comme le compte rendu de la réunion du lundi.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Fichier", "Dupliquer la note"] },
        { on: "Mac", steps: ["Édition", "Ajouter un lien"], keys: "⌘K" },
      ]} />
      <p>
        La même mise en page, une note par semaine, marche pour d’autres routines. Le{" "}
        <a href="/fr/blog/suivi-des-habitudes-notes-iphone">suivi des habitudes dans Notes</a> coche les habitudes jour après jour, le{" "}
        <a href="/fr/blog/planning-repas-semaine-notes-iphone">planning des repas</a> prévoit les dîners de la semaine, et{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais) propose d’autres notes à coller.
      </p>

      <h2 id="limites">Là où un planning dans Notes s’arrête</h2>
      <ul>
        <li><strong>Rien ne bouge tout seul.</strong> Une tâche que vous n’avez pas faite mercredi reste à mercredi tant que vous ne la coupez pas pour la coller sous aujourd’hui.</li>
        <li><strong>Une nouvelle semaine se fait à la main.</strong> Dupliquer la note, changer la date, supprimer ce qui est fait et déplacer le reste. Sautez-le une fois et la semaine continue dans la note de la semaine passée.</li>
        <li><strong>La planification vous revient.</strong> Une liste de vingt choses ne se répartit pas toute seule sur les jours, et les trois priorités ne se choisissent pas toutes seules.</li>
        <li><strong>La recherche trouve des mots, pas des réponses.</strong> Elle trouve le dentiste. Elle ne peut pas vous dire ce qui reste cette semaine ni ce qui est sans cesse repoussé.</li>
      </ul>
      <p>
        Pour une semaine légère, une note et quelques minutes le dimanche suffisent. Pour une semaine chargée, déplacer et trier devient le
        vrai travail, et il vous revient.
      </p>

      <h2 id="pinto-notes">Une semaine planifiée pour vous</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis la
        conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/weekly-planner">Weekly planner</a> (planning de la
        semaine) est une note avec Top three this week, un sous-titre par jour du lundi au dimanche, et Later.
      </p>
      <p>
        Dites à votre IA ce que vous avez cette semaine, en un seul message. Elle range chaque tâche sous son jour en liste de pointage, met
        sous Later ce qui n’a pas de jour, et limite les trois priorités aux trois choses que vous dites les plus importantes. Demandez-lui
        de « déplacer ce que je n’ai pas fini à aujourd’hui » et les tâches non cochées des jours passés suivent. Le dimanche, dites-lui que
        c’est une nouvelle semaine : elle retire ce qui est coché, déplace ce qui reste au lundi et vous demande vos trois priorités pour la
        semaine suivante. Vous pouvez toujours tout taper et cocher vous-même, et chaque version précédente d’une note est gardée. La partie
        IA marche une fois ChatGPT ou Claude connecté, et <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais)
        prend une minute.
      </p>
      <p>
        Les plannings que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
