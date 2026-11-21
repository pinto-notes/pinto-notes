import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-passation-travail-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle passation de travail » suggère
// « modèle passation de travail », « modèle passation de service » et « modèle passation de consigne au travail ».
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac
// (Titre secondaire), /apd0a136b9cc/mac (Format > Tableau), /apd93c815aa0/mac (liste de pointage),
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios et /fr-fr/102296.
// Les icônes sans libellé textuel sont décrites. Faits selon l'original anglais.
const ui = UI.fr;
const TEMPLATE = `Passation de l'atelier des Tilleuls, du 30 novembre au 4 décembre

Relais
Absente : Sarah, du 30 novembre au 4 décembre 2026. Retour le 7 décembre.
Responsable du relais : Julien. Atelier le 10 décembre.
Dernière mise à jour : 27 novembre, 15:00, heure de Paris.
Sarah est injoignable pendant ses congés. Pour une décision urgente, contacter Émilie.

Travaux en cours
Dossier\tÉtat, responsable du relais et prochaine action
Page d'inscription\tTexte validé ; page non publiée. Julien : obtenir la validation finale d'Émilie le 30 novembre avant 10:00, puis publier avant 12:00.
Réservation de salle\t18 places bloquées ; acompte non validé. Julien : demander l'accord d'Émilie avant le 1er décembre, 15:00.
Courriel aux inscrits\tBrouillon prêt. Nour : envoyer après confirmation de la salle, avant le 3 décembre, 10:00. Attendre si la salle n'est pas confirmée.

Documents clés
Plan du projet : atelier des Tilleuls, mis à jour le 27 novembre.
Devis de la salle : R218, daté du 26 novembre.
Brouillon du courriel : atelier des Tilleuls, version 2.
Remplacer ces noms par les liens de travail de votre équipe.

Accès à prévoir
Julien a besoin du rôle d'éditeur des inscriptions et de l'accès au dossier de l'atelier.
Sarah a déposé la demande IT-248 le 27 novembre ; validation toujours en attente.
Procédure d'accès : https://example.com/it/temporary-access
Julien : relancer l'informatique et tester les deux accès avant le 27 novembre, 16:00.
Utiliser son propre compte. Ne jamais inscrire de mot de passe, code de récupération ou jeton d'accès ici.

Contacts
Émilie, budget et arbitrage : emilie@example.com
Nour, messages aux inscrits : nour@example.com
Louis, réservation de salle et devis R218 : louis@example.com
Assistance informatique, demande IT-248 : it@example.com

Risques et questions ouverts
La réservation expire le 2 décembre à 12:00. Julien : sans accord au 1er décembre à 15:00, contacter Émilie le jour même. Ne pas payer sans accord.
Peut-on accepter 22 personnes ? Émilie décide avant le 30 novembre, 15:00. Garder la limite de 18 jusque-là.
Les diapositives peuvent attendre le retour de Sarah. Aucune action de relais.

Vérifications du relais avant le départ
Julien : ouvrir chaque document avec son propre compte
Julien : tester l'édition des inscriptions et l'accès au dossier
Julien et Nour : confirmer ensemble les actions et échéances
Julien : noter ici toute question sans réponse avant le 27 novembre, 16:30

Au retour
Julien : ajouter un bilan daté des tâches terminées et ouvertes avant le 7 décembre, 09:00.
Sarah : le relire avec Julien avant de reprendre le dossier.
`;
const PROMPT = `Lis mes notes de projet Pinto Notes « Plan de l'atelier des Tilleuls », « Réservation de salle R218 » et « Courriel aux inscrits ».
Crée une note distincte « Passation de l'atelier des Tilleuls, du 30 novembre au 4 décembre » avec le modèle ci-dessous.
Sarah est absente du 30 novembre au 4 décembre 2026 et revient le 7 décembre. Julien assure le relais.
Pour chaque dossier, indique l'état, le responsable, l'action, l'échéance et le titre de la note source.
Sépare les faits confirmés des questions. S'il manque un responsable, une échéance ou un accord, écris « À confirmer » et demande-moi.
Indique les accès demandés et leur approbateur, sans mot de passe, code de récupération ni jeton.
Ne suppose pas que l'accès fonctionne ni que les collègues ont accepté. Laisse les cases décochées.
Ne modifie pas les notes sources. Je vérifierai la copie avec les personnes concernées.`;
const FAQ = [
  { q: "Que doit contenir une note de passation ?", a: ["Les dates, dossiers en cours, responsables, prochaines actions, échéances, liens utiles, accès demandés, contacts et risques. Terminez par des vérifications avec la personne qui prend le relais."] },
  { q: "Faut-il y mettre les mots de passe ?", a: ["Non. Indiquez le rôle demandé, son approbateur et la procédure d'accès. Chacun utilise son propre compte."] },
  { q: "Comment vérifier que la passation est prête ?", a: ["La personne qui prend le relais ouvre les liens, teste ses accès et confirme les actions et dates. Un nom dans une note ne vaut pas acceptation."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-passation-travail-notes"
  intro={<>Ce modèle de passation dans Notes prépare une semaine de congés. Chaque dossier en cours a un responsable, une prochaine action et une échéance. Les accès et risques restent visibles.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier le modèle"},{href:"#installer",label:"Le mettre en forme"},{href:"#relais",label:"Vérifier le relais"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Préparer un brouillon"}]}>
    <p>Remplacez les noms et adresses fictifs par les vôtres. Mettez vos vrais liens vers les documents et la procédure d'accès, sans jamais copier de mots de passe.</p>
    <div id="modele"><Keep title="Passation de travail pour Notes" text={TEMPLATE} note="Collez dans une note. Transformez les travaux en cours en tableau et les vérifications en liste de pointage." /></div>
    <PostCta slug="fr/modele-passation-travail-notes" path="/fr/blog/modele-passation-travail-notes" position="answer" title="Préparer la passation depuis vos notes" ui={ui.cta}><p>Dans Pinto, ChatGPT ou Claude connecté peut lire vos notes de projet et rédiger un brouillon à vérifier.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Mettre la passation en forme</h2>
  <p>Utilisez une note iCloud ou conservée sur l'appareil. Avec d'autres fournisseurs, certaines fonctions de Notes peuvent manquer.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Sur Mac, collez le texte. Appliquez Titre secondaire aux intitulés. Sélectionnez les quatre lignes de Dossier au courriel et utilisez le bouton de tableau. Les tabulations séparent les deux colonnes. Format, Tableau crée aussi un tableau vide de deux rangs et deux colonnes ; Tabulation dans la dernière cellule ajoute un rang. Voir <a href="/blog/apple-notes-tables">le guide des tableaux</a>.</p>
  <p>Sélectionnez les quatre vérifications et créez une liste de pointage. Sur iPhone, touchez le bouton Rédiger, collez le texte et créez le tableau à l'emplacement voulu. Recopiez les deux colonnes, puis supprimez les lignes d'origine. Le bouton Liste de tâches crée les vérifications, Retour ajoute la suivante. Voir le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide iPhone d'Apple</a>.</p>
  <h2>Donner une action précise à chaque dossier</h2>
  <p>La salle est bloquée mais l'acompte attend un accord. Julien doit obtenir la décision avant l'expiration de la réservation. La date d'accord et l'heure d'expiration comptent toutes deux. Les diapositives attendent le retour de Sarah. Les <a href="/fr/blog/compte-rendu-reunion-notes-iphone">comptes rendus de réunion</a> peuvent fournir les décisions à reporter.</p>
  <h2 id="relais">Vérifier avec la personne qui prend le relais</h2>
  <p>Julien doit ouvrir les documents avec son compte et tester ses droits, sans se contenter de l'accès de Sarah. La demande informatique est encore en attente. Nour doit confirmer l'envoi du courriel. La limite reste de 18 personnes jusqu'à la décision d'Émilie. Au retour, notez ce qui est terminé ou ouvert.</p>
  <h2 id="limites">Ce que la note ne fait pas</h2><p>Elle ne donne pas les accès, ne confirme pas qu'un collègue accepte une tâche et n'alerte pas à l'expiration de la salle. Utilisez les outils de votre équipe et sa procédure de passation obligatoire, s'il y en a une.</p>
  <h2 id="pinto">Préparer un brouillon avec une IA</h2>
  <p>Dans Pinto, après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier les notes. Utilisez seulement les informations professionnelles que votre organisation permet de lui transmettre.</p>
  <Keep title="Demander un brouillon de passation" text={PROMPT} note="Adaptez les titres, personnes et dates, puis collez le modèle à la suite." />
  <p>Contrôlez chaque responsable et échéance dans les notes sources et auprès des personnes. L'acompte reste non validé, l'accès en attente et la limite à 18. Ne cochez les vérifications qu'après les avoir faites. Pinto importe les <a href="/blog/move-from-apple-notes">notes Apple sur Mac</a> sans changer les originaux.</p>
</LocalPostPage>; }
