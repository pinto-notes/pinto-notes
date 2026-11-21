import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "liste-de-taches-notes-iphone");

// Version française de /blog/apple-notes-to-do-list. Google autocomplete hl=fr, gl=fr, lu le
// 21 novembre 2026 : « liste de tâches notes iphone » n’a renvoyé aucune suggestion.
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/102296 (« Rédiger », « Liste de tâches »,
// Réglages > Apps > Notes > Trier les éléments cochés > Automatiquement, « Collaborer ») ;
// support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (« liste de pointage »,
// « Trier automatiquement les tâches terminées », Format > Plus > Tout décocher) ;
// support.apple.com/fr-fr/guide/notes/apd58edc7964/mac (Fichier > Nouveau dossier intelligent).
// Le guide français ne nomme pas la commande « Paste as Markdown » de macOS 27 : le geste est décrit sans
// inventer son nom. Les faits sur Rappels et Pinto Notes viennent de l’article anglais.

const ui = UI.fr;
const TEMPLATE = `# À faire

## Aujourd’hui
- [ ] Envoyer le budget à Jonas
- [ ] Appeler maman
- [ ] Retourner le colis

## Cette semaine
- [ ] Réserver les billets de train
- [ ] Relire les diapositives d’Emma
- [ ] Prendre rendez-vous au garage

## Courses et sorties
- [ ] Passer au pressing
- [ ] Acheter une lampe pour le vélo

## En attente
- [ ] Jonas : valider le budget

## Un jour
- [ ] Renouveler mon passeport
- [ ] Ranger le garage
`;

const FAQ = [
  { q: "Comment créer une liste de tâches dans Notes ?", a: [
    "Sur iPhone, touchez Rédiger, saisissez un titre, touchez Retour puis le bouton Liste de tâches. Sur Mac, utilisez le bouton de liste de pointage dans la note.",
  ] },
  { q: "Notes peut-il rappeler une échéance ?", a: [
    "Non dans une liste de pointage. Utilisez Rappels pour une date, une heure ou un lieu.",
  ] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="liste-de-taches-notes-iphone"
    intro="Une liste de tâches tient dans une note et se coche au fil de la journée. Voici les gestes sur iPhone et Mac, un modèle à coller et les limites à connaître."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#iphone", label: "Sur iPhone" }, { href: "#mac", label: "Sur Mac" },
      { href: "#modele", label: "Le modèle" }, { href: "#trier", label: "Trier la liste" },
      { href: "#plusieurs", label: "Plusieurs listes" }, { href: "#limites", label: "Les limites" },
    ]}>
      <p>Sur iPhone, créez une note puis touchez le bouton « Liste de tâches ». Chaque Retour ajoute une tâche. Sur Mac, le bouton de liste de pointage fait la même chose. Le tri automatique peut envoyer les éléments cochés en bas.</p>
      <PostCta template="weekly-planner" slug="fr/liste-de-taches-notes-iphone" path="/fr/blog/liste-de-taches-notes-iphone" position="answer" ui={ui.cta} title="Une liste que votre IA peut tenir">
        <p>Pinto Notes reprend les listes de pointage. ChatGPT ou Claude peut y ajouter vos tâches et déplacer celles que vous n’avez pas finies dans le modèle gratuit de planning hebdomadaire.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000}
      alt="Une liste de courses dans Notes sur Mac avec les éléments cochés en bas."
      caption="Une liste de pointage dans Notes sur Mac. Les tâches terminées peuvent descendre en bas." />}
    faq={FAQ}>
    <h2 id="iphone">Créer une liste sur iPhone</h2>
    <ol><li>Ouvrez Notes et touchez « Rédiger ».</li><li>Saisissez le titre, puis touchez Retour.</li><li>Touchez le bouton « Liste de tâches ». Écrivez une tâche, puis touchez Retour pour la suivante.</li><li>Touchez le cercle vide pour cocher une tâche.</li></ol>
    <p>Vous pouvez aussi placer le curseur dans une note existante et toucher le bouton « Liste de tâches ». Faites glisser une ligne pour la déplacer. Balayez-la vers la droite pour la mettre en retrait, ou vers la gauche pour retirer ce retrait.</p>
    <h2 id="mac">Créer une liste sur Mac</h2>
    <p>Dans une note, cliquez sur le bouton de liste de pointage. Vous pouvez également sélectionner plusieurs paragraphes puis cliquer sur ce bouton : chacun devient une tâche. Retour ajoute une ligne ; Tabulation crée un retrait. Cliquez sur le cercle pour cocher ou décocher.</p>
    <h2 id="modele">Un modèle à coller</h2>
    <p>Notes ne fournit pas de modèles. Celui-ci sépare ce que vous faites aujourd’hui, cette semaine, dehors, en attente et plus tard. Remplacez les exemples par vos tâches. Gardez un mot dans chaque ligne : une case vide ne survit pas toujours au collage.</p>
    <Keep title="Liste de tâches pour Notes" text={TEMPLATE}
      note="Sur Mac, collez le texte dans une note. Si les symboles restent visibles, appliquez les styles de titre et la liste de pointage avec les boutons de Notes." />
    <p>Le guide français d’Apple explique que Notes accepte du contenu Markdown collé, sans donner ici le nom du menu de collage. Sur iPhone, vous pouvez coller les lignes puis les sélectionner et toucher « Liste de tâches ».</p>
    <h2 id="trier">Garder les tâches ouvertes en haut</h2>
    <p>Sur iPhone, ouvrez Réglages &gt; Apps &gt; Notes &gt; Trier les éléments cochés, puis choisissez « Automatiquement ». Sur Mac, dans Notes &gt; Réglages, activez « Trier automatiquement les tâches terminées ». Les cases cochées descendent ; Notes ne trie pas par priorité ou par nom. Déplacez ces lignes à la main. Pour recommencer une liste répétée sur Mac, choisissez Format &gt; Plus &gt; Tout décocher.</p>
    <h2 id="plusieurs">Retrouver plusieurs listes</h2>
    <p>Épinglez la note principale. Ajoutez le même #tag aux notes liées. Un dossier intelligent peut réunir toutes les notes qui contiennent une liste de pointage non cochée : sur Mac, choisissez Fichier &gt; Nouveau dossier intelligent et réglez le critère « Listes de pointage ». Vous pouvez aussi partager une liste avec « Collaborer » ; chaque personne doit avoir un compte Apple.</p>
    <h2 id="limites">Quand utiliser Rappels</h2>
    <p>Notes ne donne ni date limite ni notification à une tâche. Les éléments cochés restent dans la note, et ceux non terminés ne changent pas de jour tout seuls. Rappels gère les dates, les heures et les lieux. Pour une liste que vous lisez d’un coup, Notes suffit ; pour un rendez-vous à ne pas oublier, utilisez Rappels.</p>
    <h2>Avec Pinto Notes</h2>
    <p>Le modèle gratuit <a href="/templates/weekly-planner">Planning hebdomadaire</a> contient trois priorités, un jour par section et une liste « Plus tard ». Après connexion, ChatGPT ou Claude peut ajouter des tâches, retirer celles cochées et déplacer les autres au bon jour. Vous pouvez toujours les modifier vous-même et restaurer une version précédente. Vos listes Apple viennent par un import sur Mac sans modifier Notes.</p>
    <p>À lire aussi : <a href="/fr/blog/astuces-notes-iphone">15 astuces pour Notes</a> et <a href="/fr/blog/planning-repas-semaine-notes-iphone">un planning des repas</a>.</p>
      <h2>En images</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} alt="Règle d’un dossier intelligent pour les listes non cochées." caption="Ce critère trouve les notes avec des tâches ouvertes." />
      <PostFigure src="/blog/launch/weekly-planner-note" width={1520} height={2058} alt="Planning hebdomadaire dans Pinto Notes avec des tâches pour chaque jour." caption="Le modèle de planning regroupe les tâches par jour." />
  </LocalPostPage>;
}
