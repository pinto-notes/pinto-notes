import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-procedure-notes-iphone");

// Version française de /blog/apple-notes-sop-template, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « modèle procédure de travail » donne « modèle procédure de travail »
// et « modèle procédure de travail word » ; « modele procedure operationnelle standard » ne donne rien.
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac
// (Liste de pointage, Format > Plus > Tout décocher), /guide/notes/apd0a136b9cc/mac (Format > Tableau),
// /guide/notes/not9474646a9/mac (Fichier > Dupliquer la note),
// /guide/iphone/iph1ac0b3a2/ios (Nouvelle note, Format, Sous-titre, Liste de vérification, Ajouter un tableau).
// Studio et personnes fictifs français. Aucune image dans l'original.
const ui = UI.fr;
const TEMPLATE = `Procédure : envoyer le rapport client hebdomadaire

Déclencheur : vendredi à 14 h, après saisie du travail de la semaine.
Responsable : Maïa, chargée de compte. Remplaçant : Léo.
Résultat : le Studio de la Rue Neuve reçoit un rapport exact avant 16 h.
Sources : journal du travail de la semaine et liste à jour des contacts client.
Version : 1.2, mise à jour le 20 novembre 2026.
Date de revue : 18 décembre 2026. Maïa en est responsable.

Étapes
1. Ouvrir le journal du Studio de la Rue Neuve, du lundi au vendredi de cette semaine.
2. Copier le travail terminé dans un nouveau rapport. Placer le travail inachevé sous Semaine prochaine.
3. Additionner les heures de chaque tâche terminée. Comparer le total au journal.
4. Exporter le rapport en PDF sous le nom StudioRueNeuve-semaine-2026-11-20.pdf. Changer la date chaque semaine.
5. Ouvrir le PDF exporté. Lire toutes les pages et vérifier le client et la semaine.
6. Faire les vérifications ci-dessous. Envoyer le PDF par e-mail au contact indiqué dans la liste actuelle.
7. Noter l’heure et l’expéditeur dans une fiche d’exécution datée. Y noter toute exception.

Exceptions
Si\tQue faire
Les heures ne correspondent pas au journal\tArrêter. Demander à la personne qui les a saisies de corriger la source, puis réexporter.
Maïa est absente\tLéo exécute la procédure et note son nom dans la fiche.
Le rapport ne peut pas partir avant 16 h\tPrévenir le client avant 16 h, donner une nouvelle heure et la noter dans la fiche.

Vérifications avant l’envoi
Le nom du client et la semaine correspondent au journal.
Les heures correspondent à la source ; aucun travail inachevé n’est compté comme terminé.
Le PDF exporté s’ouvre et contient toutes les pages.
Le destinataire correspond à la liste actuelle des contacts client.

Fiche d’exécution
20 novembre 2026, 15 h 42. Maïa a envoyé le rapport. Aucune exception.

Journal des modifications
20 novembre 2026, v1.2. Ajout de la vérification du PDF après un export vide.
`;
const FAQ = [
  { q: "Peut-on écrire une procédure dans Notes ?", a: ["Oui. Gardez une note par procédure avec déclencheur, responsable, étapes numérotées, exceptions, vérifications et date de revue. Copiez ce modèle et adaptez-le."] },
  { q: "Faut-il numéroter les étapes ou les cocher ?", a: ["Numérotez les étapes quand l’ordre compte. Réservez une liste à cocher aux vérifications finales. Gardez la procédure de référence intacte et datez chaque exécution dans une autre note."] },
  { q: "Quand revoir une procédure ?", a: ["Choisissez une date et une personne responsable. Revoyez-la plus tôt si une exception révèle un manque ou si une source change. La date écrite ne déclenche pas de rappel."] },
  { q: "Pinto Notes peut-il restaurer une ancienne version ?", a: ["Oui. L’historique permet de restaurer une version et conserve aussi le texte qu’elle remplace. Le journal écrit garde la raison des changements."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="modele-procedure-notes-iphone"
    intro="Copiez cette procédure type dans Notes pour un travail qui revient. Elle précise quand agir, qui s’en charge, les étapes, les exceptions et les contrôles, avec une date de revue."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "Copier la procédure" }, { href: "#installer", label: "La mettre en forme" },
      { href: "#utiliser", label: "L’exécuter et la revoir" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Les anciennes versions" },
    ]}><p>Gardez une note par procédure : étapes numérotées et liste distincte de vérifications finales. Remplacez les données du rapport client, puis testez le texte lors d’une exécution réelle. Gardez la procédure de référence séparée de chaque fiche d’exécution.</p>
      <PostCta slug="fr/modele-procedure-notes-iphone" path="/fr/blog/modele-procedure-notes-iphone" position="answer" ui={ui.cta} title="Retrouver une ancienne version"><p>Pinto Notes fonctionne comme Notes sur iPhone et Mac et garde les versions précédentes restaurables. Après connexion, ChatGPT ou Claude peut lire et modifier la procédure.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modele">Une procédure de rapport hebdomadaire</h2>
    <p>Dans cet exemple, Maïa envoie le même type de rapport chaque vendredi. Changez le client, les documents sources et l’heure limite. Si vous travaillez seul, inscrivez votre nom et retirez le remplaçant si personne ne peut prendre le relais.</p>
    <Keep title="Procédure pour Notes" text={TEMPLATE} copyLabel={ui.copy} note="Collez le texte. Transformez les quatre vérifications en liste à cocher et les quatre lignes d’exceptions en tableau." />
    <p>Chaque étape doit décrire une action et un résultat visible. « Vérifier le rapport » laisse place à l’interprétation. « Ouvrir le PDF exporté » désigne le fichier à contrôler. Gardez les cas où il faut s’arrêter près des étapes.</p>
    <h2 id="installer">Mettre la procédure en forme</h2>
    <MenuPaths rows={[{ on: "Mac, exceptions", steps: ["Format", "Tableau"] }, { on: "iPhone, titres", steps: ["Format", "Sous-titre"] }]} />
    <ol>
      <li>Collez le texte dans une nouvelle note. Sur iPhone, touchez Nouvelle note. La première ligne devient le titre. Pour les sections, sélectionnez leur texte, touchez Format puis Sous-titre.</li>
      <li>Sur Mac, sélectionnez les quatre lignes sous Vérifications avant l’envoi et cliquez sur Liste de pointage. Sur iPhone, utilisez Liste de vérification et saisissez chaque contrôle. Laissez les étapes numérotées dans leur ordre.</li>
      <li>Sur Mac, sélectionnez les quatre lignes de Si à la dernière exception et cliquez sur Tableau. Les tabulations séparent la condition de la réponse. Format, Tableau est une autre entrée de la même commande.</li>
      <li>Sur iPhone, créez un tableau avec Ajouter un tableau et saisissez les exceptions en deux colonnes. Sur Mac, Tabulation dans la dernière cellule ajoute un rang. Le <a href="/blog/apple-notes-tables">guide des tableaux</a> (en anglais) donne d’autres commandes.</li>
    </ol>
    <p>Sur Mac, utilisez une note iCloud ou enregistrée sur ce Mac pour les listes. Certaines options manquent avec d’autres fournisseurs de comptes. D’autres structures se trouvent dans les <a href="/blog/apple-notes-templates">modèles de Notes</a> (en anglais).</p>
    <h2 id="utiliser">La tester, puis corriger ce qui manque</h2>
    <p>Suivez la procédure avec le vrai journal et le rapport exporté. Si quelqu’un doit vous remplacer, laissez cette personne essayer sans explications orales. Notez où elle bloque, puis précisez le nom du fichier ou la décision.</p>
    <p>Gardez la note de référence intacte. Pour chaque vendredi, sélectionnez-la sur Mac et choisissez Fichier, Dupliquer la note. Donnez à la copie un titre comme « Rapport client, 27 novembre 2026 » et effacez l’exemple d’exécution. Sur Mac, décochez les contrôles avec Format, Plus, Tout décocher avant de commencer. La copie d’une note partagée n’est pas partagée.</p>
    <p>Inscrivez qui a exécuté la procédure et les exceptions. Si une exception risque de revenir, ajoutez sa réponse à la note de référence, augmentez le numéro de version et expliquez pourquoi. À la date de revue, le responsable compare les étapes aux sources actuelles, même si aucun problème n’a été signalé.</p>
    <h2 id="limites">Ce qu’une case cochée ne prouve pas</h2>
    <p>Une coche indique qu’une personne a marqué le contrôle comme terminé. Elle ne prouve ni que le PDF était bon ni que le client l’a reçu. Conservez le message envoyé ou les preuves nécessaires. Une date de revue demande un rappel séparé.</p>
    <p>Indiquez à l’équipe quelle note est la procédure de référence. Sinon, une ancienne copie peut servir par erreur d’instructions. Ce modèle ne fournit pas de validation formelle ni de registre d’audit contrôlé.</p>
    <h2 id="pinto-notes">Revenir à une version précédente dans Pinto Notes</h2>
    <p>Cette structure marche aussi dans Pinto Notes, qui ressemble à Notes sur iPhone et Mac. Son <a href="/blog/apple-notes-version-history">historique des versions</a> (en anglais) permet de restaurer un texte antérieur tout en gardant le texte remplacé. Le journal des modifications explique toujours pourquoi une étape a changé.</p>
    <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> (en anglais), demandez à l’IA de proposer une exception pour un journal de travail reçu en retard, sans changer l’heure limite. Faites-lui lister ses suppositions avant toute modification, puis vérifiez le texte selon votre travail réel.</p>
    <p>Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans changement dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
