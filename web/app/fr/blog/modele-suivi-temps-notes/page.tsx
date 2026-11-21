import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-suivi-temps-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle suivi du temps » suggère
// « tableau de suivi du temps de travail ». Le titre reprend suivi du temps ; pas de volume déduit.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac
// (Format > Tableau, Tabulation), /apd93c815aa0/mac (liste de pointage),
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios (tableau), /102296 (Liste de tâches).
// Boutons illustrés sans nom textuel décrits par leur fonction. Faits selon l'original anglais.
const ui = UI.fr;
const TEMPLATE = `Suivi du temps, du 16 au 20 novembre 2026

Périmètre : séances site web, lettre d'information et administratif associé. Pas une semaine de travail complète.

Séances
Date\tDébut\tFin\tProjet\tTâche\tMinutes
16 nov.\t09:00\t10:10\tSite web\tRédiger l'accueil\t70
16 nov.\t10:10\t10:25\tAdmin\tAppel livraison\t15
16 nov.\t10:25\t11:10\tSite web\tRevoir l'accueil\t45
17 nov.\t09:00\t09:40\tSite web\tVérifier l'affichage mobile\t40
17 nov.\t14:00\t14:55\tSite web\tAppliquer les retours du client\t55
18 nov.\t10:00\t11:00\tSite web\tPréparer la revue\t60
19 nov.\t09:15\t10:00\tLettre d'information\tRédiger l'édition de novembre\t45
19 nov.\t10:10\t10:40\tAdmin\tTraiter les courriels du projet\t30
20 nov.\t09:00\t10:00\tSite web\tPublier les changements validés\t60
20 nov.\t10:15\t10:45\tLettre d'information\tRevoir les objets\t30

Totaux quotidiens, calculés à la main
16 nov. : 130 minutes
17 nov. : 95 minutes
18 nov. : 60 minutes
19 nov. : 75 minutes
20 nov. : 90 minutes
Total semaine : 450 minutes, soit 7 h 30

Totaux par projet, calculés à la main
Site web : 330 minutes
Lettre d'information : 75 minutes
Admin : 45 minutes

Interruptions et temps inconnu
16 nov. : l'appel a coupé la séance site web. Ses 15 minutes figurent déjà dans Admin.
19 nov., 10:40 à 11:00 : activité non notée. 20 minutes inconnues, exclues des totaux.

Contrôle de la semaine
Comparer chaque durée aux heures de début et de fin
Vérifier que les totaux quotidiens et par projet donnent le même total semaine
`;
const PROMPT = `Lis ma note Pinto Notes « Suivi du temps, du 16 au 20 novembre 2026 ».
Ajoute une séance le 20 novembre, de 14:00 à 14:35, pour Site web : vérifier les liens publiés, 35 minutes.
Garde les séances et le temps inconnu. Ne compte pas l'appel deux fois.
Propose les nouveaux totaux du jour, du projet et de la semaine dans le chat. Ne modifie pas encore les totaux de la note.
Demande-moi des précisions sur toute heure manquante ou qui se chevauche. N'invente aucune séance.`;
const FAQ = [
  { q: "Quelles colonnes pour suivre son temps dans Notes ?", a: ["Date, début, fin, projet, tâche et minutes. Ajoutez des sous-totaux par jour et un total semaine. Précisez le périmètre du suivi."] },
  { q: "La colonne Minutes se calcule-t-elle seule ?", a: ["Non. Notes et Pinto ne font pas la somme d'une colonne de tableau. Saisissez et vérifiez les durées vous-même."] },
  { q: "Comment compter une interruption ?", a: ["Terminez la première ligne à l'heure de l'interruption. Notez celle-ci sur sa propre ligne, puis ouvrez une nouvelle ligne pour la reprise."] },
  { q: "Que faire d'un créneau oublié ?", a: ["Indiquez « inconnu » et excluez-le des totaux par projet. Si vous le reconstituez ensuite, signalez que l'heure est estimée."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-suivi-temps-notes"
  intro={<>Copiez ce modèle de suivi du temps dans Notes pour consigner les séances terminées. Saisissez les minutes, puis vérifiez les totaux par jour et par projet.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier le modèle"},{href:"#tableau",label:"Créer le tableau"},{href:"#suivre",label:"Noter le temps réel"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Ajouter une séance"}]}>
    <p>Une ligne par séance, avec les heures de début et de fin. L'exemple est un suivi partiel de projet, pas une semaine de travail entière. Les sommes sont faites à la main.</p>
    <div id="modele"><Keep title="Suivi du temps pour Notes" text={TEMPLATE} note="Remplacez les séances et les totaux fictifs par les vôtres." /></div>
    <PostCta slug="fr/modele-suivi-temps-notes" path="/fr/blog/modele-suivi-temps-notes" position="answer" title="Ajouter une séance avec votre IA" ui={ui.cta}><p>Dans Pinto, ChatGPT ou Claude connecté peut lire ce journal et ajouter les séances que vous lui donnez.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="tableau">Créer le tableau et la liste de contrôle</h2>
  <p>Utilisez une note iCloud ou conservée sur votre appareil. Collez d'abord le texte ; les titres et totaux restent hors du tableau.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Sélectionner les lignes","Format","Tableau"]},{on:"iPhone",steps:["Bouton Rédiger","Bouton de tableau"]}]} />
  <p>Sur Mac, sélectionnez les onze lignes de Date à la dernière séance, puis créez un tableau. Les tabulations séparent les colonnes. Tabulation dans la dernière cellule ajoute un rang. Voir le <a href="https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac">guide Apple</a> et notre <a href="/blog/apple-notes-tables">guide des tableaux</a>.</p>
  <p>Sur iPhone, collez le texte dans une note. Créez un tableau plus étroit avec Séance et Minutes comme colonnes. Dans Séance, réunissez la date, les heures, le projet et la tâche. Par exemple : « 16 nov., 09:00 à 10:10, Site web, accueil ». Saisissez 70 dans Minutes, puis recopiez les autres lignes et retirez l'ancien texte.</p>
  <p>Transformez les deux lignes de contrôle en liste de pointage sur Mac ou en Liste de tâches sur iPhone. Touchez Retour pour l'élément suivant, puis cochez après vérification.</p>
  <h2 id="suivre">Noter le travail effectué et les interruptions</h2>
  <p>Ajoutez une ligne quand une tâche se termine ou change. L'appel de 10:10 à 10:25 compte dans Admin. Compter aussi la plage de 09:00 à 11:10 comme Site web le compterait deux fois. Le créneau inconnu de jeudi reste hors des totaux.</p>
  <p>Additionnez chaque jour : 130 + 95 + 60 + 75 + 90 = 450 minutes, soit 7 h 30. Les projets donnent aussi 330 + 75 + 45 = 450. Après toute correction, revérifiez les deux sommes. Gardez la semaine terminée comme archive ; voyez aussi les <a href="/blog/apple-notes-templates">autres modèles Notes</a>.</p>
  <h2 id="limites">Ce que Notes ne calcule pas</h2><p>Ce modèle n'a ni chronomètre ni relevé automatique. Notes et Pinto ne totalisent pas la colonne. Un total ne dit rien d'un créneau inconnu ni des heures facturables. Pour de nombreux calculs automatiques, utilisez un tableur.</p>
  <h2 id="pinto">Ajouter une séance avec ChatGPT ou Claude</h2>
  <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier cette note dans Pinto. Donnez-lui les heures réelles.</p>
  <Keep title="Demande pour une IA connectée" text={PROMPT} note="Remplacez le titre et la séance par vos données." />
  <p>Vérifiez qu'une seule ligne de 35 minutes a été ajoutée. Le vendredi passe à 125 minutes, Site web à 365 et la semaine à 485 minutes, soit 8 h 05. Contrôlez avant de modifier les totaux enregistrés. Sur Mac, Pinto importe vos <a href="/blog/move-from-apple-notes">notes Apple</a> en une fois sans changer les originaux.</p>
</LocalPostPage>; }
