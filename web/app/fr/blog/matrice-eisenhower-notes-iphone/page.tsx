import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "matrice-eisenhower-notes-iphone");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « matrice eisenhower » propose « matrice eisenhower exemple », « matrice eisenhower à remplir » et « matrice eisenhower pdf ». La requête avec Notes ne renvoie rien ; le titre reprend « matrice Eisenhower » et « modèle ».
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (listes), https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac (titres), https://support.apple.com/fr-fr/guide/notes/not9474646a9/mac (Fichier > Dupliquer la note), https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios (Nouvelle note, Format, Liste de vérification), https://support.apple.com/fr-fr/102296 (Retour ajoute un élément). Les pages Mac de format et listes renvoient 429 dans le lecteur ; leurs gestes sont décrits sans nom de bouton incertain. Faits suivis de /blog/apple-notes-eisenhower-matrix-template.
const ui = UI.fr;
const TEMPLATE = `Lancement des réservations du café, semaine du 23 novembre

Résultat : mettre la nouvelle page de réservation en ligne le 27 novembre.
Bilan : 24 novembre, 9 h.

Faire : urgent et important
Corriger le formulaire mobile avant les réservations de test d'aujourd'hui. Le bouton d'envoi ne fonctionne pas.
Envoyer le lien de test à la gérante du café avant 17 h le 23 novembre. Son retour est attendu demain.

Planifier : important, non urgent
Tester les courriels de confirmation le 25 novembre à 10 h, avant le lancement.
Rédiger le guide de passation le 26 novembre à 14 h pour que la gérante puisse modifier les horaires.

Déléguer ou réduire : urgent, peu important pour le résultat
Demander à Julien de redimensionner la bannière avant le 24 novembre. Vérifier qu'il peut s'en charger.
Répondre à l'invitation facultative à la réunion de lancement avant 16 h aujourd'hui. Demander un compte rendu écrit.

Écarter : ni urgent ni important
Ne pas chercher d'autres thèmes pour le site. Le design actuel est approuvé.
Laisser les icônes du dossier interne telles quelles. Elles ne changent rien à la page de réservation.
`;
const PROMPT = `Lis ma note « Lancement des réservations du café, semaine du 23 novembre ». Propose d'abord ici les changements à apporter à ses quatre listes Eisenhower. Juge l'importance selon le résultat annoncé, et l'urgence selon les échéances et conséquences écrites dans la note. Explique chaque déplacement. Demande les renseignements manquants au lieu d'inventer une date ou de supposer qu'une personne peut prendre une tâche. Ne modifie pas la note avant mon accord.`;
const FAQ = [
  { q: "Comment faire une matrice Eisenhower dans Notes ?", a: ["Créez quatre sections : Faire, Planifier, Déléguer ou réduire, Écarter. Placez une liste à cocher sous chacune. Le modèle se colle en texte simple, puis se met en forme dans Notes."] },
  { q: "Faut-il un tableau à quatre cases ?", a: ["Non. Quatre listes laissent de la place pour une échéance et une raison par tâche, tout en permettant de la cocher."] },
  { q: "Où classer une tâche urgente mais peu importante ?", a: ["Vérifiez la conséquence d'une attente et son lien avec le résultat. Demandez à une personne disponible, réduisez le travail ou refusez-le si c'est possible. Une date seule ne rend pas la tâche importante."] },
  { q: "Que mettre dans Planifier ?", a: ["Un travail utile au résultat, mais qui peut attendre. Écrivez quand vous comptez le faire ; réservez ce créneau séparément dans votre calendrier."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="matrice-eisenhower-notes-iphone"
    intro={<>Une matrice Eisenhower tient dans une note avec quatre listes : Faire, Planifier, Déléguer ou réduire, Écarter. Copiez cet exemple rempli, puis classez vos tâches selon leur urgence et leur importance.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modele", label: "Le modèle" }, { href: "#preparer", label: "Préparer la note" }, { href: "#trier", label: "Trier les tâches" }, { href: "#limites", label: "Les limites" }, { href: "#pinto", label: "Revoir avec une IA" }]}>
      <p>Écrivez le résultat visé au-dessus des quatre listes. Donnez une raison à chaque classement. L'exemple suit le lancement de la page de réservation d'un café.</p>
      <PostCta slug="fr/matrice-eisenhower-notes-iphone" path="/fr/blog/matrice-eisenhower-notes-iphone" position="answer" title="Vérifier vos priorités avec ChatGPT" ui={ui.cta}><p>Pinto Notes fonctionne comme Notes sur Mac et iPhone. Une fois connecté, ChatGPT ou Claude peut lire vos tâches et proposer des déplacements motivés.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="modele">Quatre listes avec les raisons</h2>
    <p>Le formulaire cassé bloque les tests du jour. Le guide de passation compte pour le lancement, mais peut attendre jeudi. La réunion facultative demande une réponse aujourd'hui, pas une heure de travail.</p>
    <Keep title="Matrice Eisenhower pour Notes" text={TEMPLATE} note="Le texte se colle tel quel. Mettez ensuite chaque intitulé en forme et transformez les tâches en listes à cocher." />
    <h2 id="preparer">Préparer la note sur Mac ou iPhone</h2>
    <p>Utilisez une note iCloud ou enregistrée sur l'appareil. Certaines mises en forme manquent avec d'autres comptes. Les quatre listes laissent une phrase d'explication à chaque tâche.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Sélectionner l'intitulé", "Choisir un style de titre"] }, { on: "iPhone", steps: ["Format", "Choisir un style de titre"] }]} />
    <ol><li>Sur Mac, collez le texte et remplacez le résultat et les tâches par les vôtres.</li><li>Mettez chaque intitulé en forme comme titre. Sélectionnez seulement les tâches sous Faire et transformez-les en liste à cocher. Recommencez pour les autres sections.</li><li>Sur iPhone, touchez Nouvelle note. Saisissez le titre, le résultat et la date du bilan. Pour chaque section, touchez Format pour le titre, puis Liste de vérification pour les tâches. Retour ajoute l'élément suivant.</li></ol>
    <p>Cochez une tâche terminée. Pour une tâche écartée, cochez-la après avoir décidé de ne pas la faire. Sur Mac, Fichier, Dupliquer la note crée une nouvelle matrice pour un autre projet. Le <a href="/blog/apple-notes-templates">guide des modèles Notes</a> explique comment ranger ces notes.</p>
    <h2 id="trier">Décider ce qui est urgent et important</h2>
    <p>Commencez par l'importance : la tâche contribue-t-elle au résultat ou évite-t-elle une conséquence sérieuse ? Puis examinez l'urgence : quelle échéance ou dépendance impose d'agir maintenant ? Notez la raison, surtout si la date n'est qu'une préférence.</p>
    <ul><li>Faire : le bouton cassé empêche les tests aujourd'hui.</li><li>Planifier : le guide compte pour le lancement ; réservez séparément le temps pour l'écrire.</li><li>Déléguer ou réduire : demandez d'abord à Julien s'il peut prendre la bannière.</li><li>Écarter : garder la recherche de thèmes dans la liste explique pourquoi vous y renoncez.</li></ul>
    <p>Si vous travaillez seul, la troisième liste peut signifier réduire, reporter avec accord ou refuser. Déplacer une ligne ne transfère aucune responsabilité. Au prochain bilan, revoyez les échéances. Le <a href="/fr/blog/bilan-de-la-semaine-notes-iphone">bilan hebdomadaire</a> aide aussi à revoir le résultat visé.</p>
    <h2 id="limites">Ce que ces listes ne font pas</h2>
    <p>La note garde vos choix ; elle ne classe pas les tâches seule. Une date sous Planifier ne réserve rien dans l'agenda. Le nom de Julien ne lui envoie aucune demande. Si quatre listes suffisent, restez dans Notes.</p>
    <h2 id="pinto">Demander une seconde lecture à ChatGPT ou Claude</h2>
    <p>Pinto Notes propose titres et listes à cocher. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier les notes. Demandez d'abord une proposition sans modification.</p>
    <Keep title="Demander une revue des priorités" text={PROMPT} note="Remplacez le titre de la note et vérifiez chaque proposition selon vos engagements réels." />
    <p>Le formulaire ne peut pas passer dans Planifier si les tests en dépendent aujourd'hui. Corrigez toute échéance inventée pour le guide. Après votre accord, demandez la mise à jour. Pinto garde les versions antérieures. Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a>, sans modifier les originaux.</p>
  </LocalPostPage>;
}
