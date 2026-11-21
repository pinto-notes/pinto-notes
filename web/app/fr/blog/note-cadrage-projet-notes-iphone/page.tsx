import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "note-cadrage-projet-notes-iphone");

// Version française de /blog/apple-notes-project-brief-template, 21 novembre 2026.
// Autocomplete Google hl=fr, gl=fr : « modele note de cadrage projet » donne « modèle note de cadrage projet »,
// « modèle note de cadrage projet informatique » et « template note de cadrage projet ».
// Apple, pages françaises lues le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/not9474646a9/mac
// (Nouvelle note, Fichier > Dupliquer la note), /guide/notes/apd1955d3b21/mac (Format, En-tête),
// /guide/notes/apd93c815aa0/mac (Liste de pointage), /guide/notes/apd0a136b9cc/mac (Format > Tableau),
// /guide/iphone/iph1ac0b3a2/ios (Nouvelle note, Format, Sous-titre, Liste de vérification, Ajouter un tableau).
// Les données du café sont fictives et adaptées à la France. Aucune image dans l'original.
const ui = UI.fr;
const TEMPLATE = `Page de commande à emporter du Café des Tilleuls, note de cadrage

Responsable : Sarah Martin
Validation : Amir Benali, gérant du café
Date visée : 4 décembre 2026
État : brouillon, en attente de l’avis d’Amir

Résultat attendu
Les clients trouvent la carte à emporter et passent commande sur le site du café depuis leur téléphone.
Pendant la première semaine, Amir note le nombre d’appels demandant où commander. Bilan le 11 décembre.

Inclus
Une page de commande à emporter avec la carte, les prix et les horaires de retrait à jour.
Un lien vers le service de commande existant.
Un lien Commande à emporter dans la navigation du site.

Exclu
La livraison, un nouveau système de paiement et la modification du service de commande.
Les photos et la refonte des autres pages du site.

Critères de validation
Amir a comparé chaque plat et chaque prix à la carte affichée au comptoir.
La page indique les horaires et le lieu du retrait.
Le lien Commande à emporter ouvre la page sur l’iPhone et le Mac de Sarah.
Une commande test par le lien de la page arrive sur l’écran du service existant.

Questions ouvertes
Question\tResponsable et date de réponse
Qui mettra la carte à jour après la mise en ligne ?\tAmir, avant le 25 novembre
Que montrer quand le retrait est fermé ?\tSarah propose un texte, Amir valide avant le 26 novembre

Validation
Amir confirme le périmètre et les critères avant le 27 novembre.
Après validation, noter ici toute modification du périmètre, sa date et son effet sur l’échéance.
`;
const FAQ = [
  { q: "Notes contient-il un modèle de note de cadrage ?", a: ["Non. Copiez cet exemple dans une note, remplacez les données, puis ajoutez les titres, la liste de vérification et le tableau avec les commandes de Notes."] },
  { q: "Quels critères de validation écrire ?", a: ["Des vérifications que la personne chargée de valider peut faire. Une commande test qui atteint le service existant est plus précise que « une page facile à utiliser »."] },
  { q: "Quelle différence entre cadrage et planning ?", a: ["Le cadrage fixe le résultat, les limites, le responsable et les critères de fin. Le planning découpe ensuite le travail en tâches et en dates."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="note-cadrage-projet-notes-iphone"
    intro="Cette note de cadrage à copier dans Notes fixe ce que le projet doit livrer et comment le vérifier. L’exemple rempli concerne une page de commande à emporter pour un café."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modele", label: "Copier le modèle" }, { href: "#installer", label: "Le mettre en forme" },
      { href: "#valider", label: "Valider le périmètre" }, { href: "#limites", label: "Ses limites" }, { href: "#pinto-notes", label: "Le relire avec une IA" },
    ]}><p>Gardez une note par projet. Placez le résultat et les responsables en haut, puis le périmètre, les critères à cocher et les questions ouvertes. Remplacez les données du café par les vôtres.</p>
      <PostCta slug="fr/note-cadrage-projet-notes-iphone" path="/fr/blog/note-cadrage-projet-notes-iphone" position="answer" ui={ui.cta} title="Besoin de relire le cadrage ?"><p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Une fois connecté, ChatGPT ou Claude peut lire et modifier votre note à votre demande.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modele">Un modèle pour définir ce qui sera livré</h2>
    <p>Le café garde son service de commande actuel. C’est une limite essentielle : ajouter le paiement changerait le projet. Remplacez les noms et les dates, puis écrivez des critères que quelqu’un pourra tester.</p>
    <Keep title="Note de cadrage pour Notes" text={TEMPLATE} copyLabel={ui.copy} note="Collez ce texte, puis mettez en forme les sections, la liste des critères et le tableau des questions." />
    <h2 id="installer">Le mettre en forme dans Notes</h2>
    <p>Sur Mac, créez une note et collez le texte. Sélectionnez chaque intitulé de section et choisissez un style dans le bouton Format. Utilisez des notes iCloud ou enregistrées sur le Mac pour ces options.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Sélectionner les critères", "Liste de pointage"] }, { on: "Mac", steps: ["Sélectionner les questions", "Format", "Tableau"] }, { on: "iPhone", steps: ["Sélectionner un intitulé", "Format", "Sous-titre"] }]} />
    <p>Sélectionnez les quatre paragraphes sous Critères de validation et cliquez sur Liste de pointage. Laissez les cases vides jusqu’à ce qu’Amir ait vérifié le résultat. Une tâche faite ne prouve pas qu’un critère est rempli.</p>
    <p>Chaque question comporte une tabulation avant la réponse. Sur Mac, sélectionnez les trois lignes de Question à la dernière réponse et cliquez sur Tableau. Vous pouvez aussi créer un tableau avec Format, Tableau, puis remplir les cellules. La touche Tabulation dans la dernière cellule ajoute un rang. Consultez le <a href="/blog/apple-notes-tables">guide des tableaux</a> (en anglais).</p>
    <p>Sur iPhone, collez le texte. Sélectionnez les intitulés et utilisez Format, puis Sous-titre. Pour les critères, créez une liste avec le bouton Liste de vérification et saisissez chaque critère. Pour les questions, utilisez Ajouter un tableau et remplissez les cellules. Le guide d’Apple explique <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">ces commandes</a>.</p>
    <p>Au prochain projet, sélectionnez la note sur Mac et choisissez Fichier, Dupliquer la note. Remplacez l’exemple et effacez l’ancienne validation. La copie demande elle aussi une revue du périmètre.</p>
    <h2 id="valider">Relire le cadrage avant de commencer</h2>
    <p>La page de commande est le livrable. Le nombre d’appels pendant la première semaine sert à juger le résultat après la mise en ligne. Ce n’est pas un critère pour décider si la page est prête.</p>
    <p>Faites relire les exclusions aussi attentivement que le travail inclus. Si la livraison devient nécessaire, modifiez le périmètre et revoyez la date. Gardez l’état Brouillon jusqu’à la confirmation d’Amir.</p>
    <p>Donnez une personne et une date à chaque question ouverte. Après réponse, mettez le cadrage à jour. Si le raisonnement devra être retrouvé, gardez-le dans un <a href="/fr/blog/suivi-des-decisions-notes-iphone">journal des décisions</a> distinct.</p>
    <h2 id="limites">Ce que la note ne fait pas</h2>
    <p>Les noms et les dates sont du texte à maintenir. Une date de réponse ne déclenche pas de rappel et la note ne recueille pas la validation d’Amir. Inscrivez vous-même la date de confirmation.</p>
    <p>Une case cochée n’exécute pas la commande test. Quand le périmètre change, revoyez les critères concernés et décochez ceux qui ne valent plus. Gardez les tâches quotidiennes dans un planning séparé.</p>
    <h2 id="pinto-notes">Relire le cadrage avec ChatGPT ou Claude</h2>
    <p>Vous pouvez copier ce modèle dans Pinto Notes et le modifier avec des titres, listes et tableaux. Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac. Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> (en anglais), votre IA peut lire et modifier la note.</p>
    <p>Demandez-lui quels critères du Café des Tilleuls sont trop vagues et quelles questions restent sans réponse. Relisez ses propositions avant de lui demander de les appliquer. Amir décide toujours du périmètre et vérifie le résultat.</p>
    <p>Pinto conserve les versions précédentes et permet d’en restaurer une. Le texte remplacé par la restauration reste lui aussi conservé. Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a> (en anglais), sans modification dans Notes. L’app est en anglais.</p>
  </LocalPostPage>;
}
