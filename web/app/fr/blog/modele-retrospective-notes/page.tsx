import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-retrospective-notes");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle rétrospective » suggère
// « modèle rétrospective », « modèle rétrospective agile » et « template rétrospective ».
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac,
// /apd0a136b9cc/mac (Format > Tableau), /apd93c815aa0/mac (liste de pointage),
// https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios et /fr-fr/102296.
// Boutons sans nom textuel décrits. Faits selon l'original anglais.
const ui = UI.fr;
const TEMPLATE = `Rétrospective de la mise à jour des pages d'aide de novembre

Projet : du 9 au 20 novembre 2026
Revue : 23 novembre 2026
Équipe : Sarah, rédaction ; Julien, design

Résultats prévus et constatés
Prévu\tConstat et source
Publier 8 pages d'aide revues avant le 20 novembre\t8 pages en ligne le 20 novembre. Source : liste de lancement des pages d'aide.
Une seule revue par page\t3 pages sur 8 ont demandé une seconde revue. Source : journal des revues.

Ce qui a bien marché
Sarah a testé chaque série d'instructions avant d'envoyer le brouillon à Julien.
La liste de lancement désignait une personne pour vérifier chaque page publiée.

Ce qui a moins bien marché
Deux captures montraient encore l'ancienne navigation lors de la première revue.
Le contenu de la page des réglages de compte a changé après sa rédaction.

Causes incertaines
Nous pensons qu'un accord plus tôt sur les plans pourrait réduire les secondes revues.
Le journal ne précise pas pourquoi chaque page a demandé une nouvelle revue.

À refaire
Tester les instructions avant la revue et nommer une personne pour contrôler le lancement.

Prochain essai
Valider les plans des pages avant de rédiger la mise à jour de décembre.
Responsable : Julien
Point de départ : 3 pages sur 8 ont demandé une seconde revue en novembre.
Critère : au plus 1 page sur 6 demande une seconde revue en décembre.
Date de contrôle : 7 décembre 2026

Actions
Julien : valider les six plans avec Sarah avant le 25 novembre 2026.
Sarah : noter le nombre et les raisons des secondes revues avant le 4 décembre 2026.

Résultat du contrôle
En attente. Le 7 décembre, comparer le journal au critère ci-dessus.
`;
const PROMPT = `Lis ma note Pinto Notes « Rétrospective de la mise à jour des pages d'aide de novembre ».
Propose un autre essai à partir de Ce qui a moins bien marché.
Sépare les constats des causes possibles. Ne prétends pas que la note prouve une cause.
Montre le changement proposé et un critère de contrôle dans le chat.
Si je le choisis, demande-moi un responsable et une date de revue. Ne les invente pas.
Après mon choix et mes précisions, remplace Prochain essai et Actions dans la note.
Garde intacts les résultats, observations et point de départ.`;
const FAQ = [
  { q: "Que mettre dans une rétrospective ?", a: ["Le projet terminé, ses dates, les résultats prévus et réels, ce qui a marché ou non, puis un essai avec responsable, actions et date de contrôle. Séparez causes possibles et observations."] },
  { q: "Ce modèle marche-t-il pour un projet individuel ?", a: ["Oui. Comparez par exemple la sortie d'une lettre d'information au plan initial et choisissez un changement pour la suivante."] },
  { q: "Combien d'actions choisir ?", a: ["Commencez par un changement testable au projet suivant. Donnez un responsable et une date à chaque action nécessaire. Gardez les autres idées à part."] },
];
export default function Page() { return <LocalPostPage lang="fr" slug="modele-retrospective-notes"
  intro={<>Copiez ce modèle de rétrospective dans Notes après un projet ou un cycle terminé. Comparez le plan aux résultats, puis notez une amélioration à essayer et la date de contrôle.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modele",label:"Copier le modèle"},{href:"#installer",label:"Le mettre en forme"},{href:"#bilan",label:"Faire le bilan"},{href:"#limites",label:"Ses limites"},{href:"#pinto",label:"Préparer un essai"}]}>
    <p>Un tableau garde le plan et le constat côte à côte. Les observations et causes possibles restent séparées. L'exemple se termine par un seul changement à mesurer.</p>
    <div id="modele"><Keep title="Rétrospective pour Notes" text={TEMPLATE} note="Transformez les résultats en tableau et les deux actions en liste de pointage." /></div>
    <PostCta slug="fr/modele-retrospective-notes" path="/fr/blog/modele-retrospective-notes" position="answer" title="Préparer le prochain essai" ui={ui.cta}><p>ChatGPT ou Claude connecté à Pinto peut lire ce bilan et proposer une modification à valider avant de l'enregistrer.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="installer">Mettre le modèle en forme</h2>
  <p>Utilisez une note iCloud ou conservée sur l'appareil. Certaines fonctions de Notes manquent avec d'autres fournisseurs.</p>
  <MenuPaths rows={[{on:"Mac",steps:["Bouton de mise en forme","Titre secondaire"]},{on:"Mac",steps:["Format","Tableau"]},{on:"iPhone",steps:["Bouton de mise en forme","Titre secondaire"]}]} />
  <p>Sur Mac, collez le texte et mettez les intitulés en Titre secondaire. Sélectionnez les trois lignes du tableau de résultats. Les tabulations séparent ses colonnes ; vous pouvez aussi créer un tableau vide avec Format, Tableau. Pour les actions, utilisez le bouton de liste de pointage. Consultez <a href="/blog/apple-notes-tables">les tableaux dans Notes</a>.</p>
  <p>Sur iPhone, créez une note, ajoutez un tableau à deux colonnes, recopiez les résultats puis retirez les anciennes lignes. Transformez les actions en liste avec le bouton Liste de tâches, puis Retour entre deux actions. Voir le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide Apple</a>.</p>
  <h2 id="bilan">Comparer les faits et les hypothèses</h2>
  <p>Partez d'un projet fini. Dans l'exemple, huit pages ont été publiées, mais trois ont nécessité une seconde revue. Le journal confirme le nombre, pas la cause. Le changement de plan est donc un essai, pas une explication prouvée.</p>
  <p>Nommez la source de chaque résultat et gardez les questions ouvertes. L'essai de décembre vise au plus une seconde revue sur six pages. Donnez les actions à des personnes précises et revenez le 7 décembre pour comparer au critère. Pour les échanges en cours de projet, utilisez un <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de réunion</a>. Le <a href="/blog/apple-notes-templates">guide des modèles</a> montre comment réutiliser une note.</p>
  <h2 id="limites">Ce que la rétrospective ne prouve pas</h2><p>Une note ne mesure rien à votre place et ne démontre pas une cause. Vérifiez les résultats dans leurs sources et le critère lors du projet suivant.</p>
  <h2 id="pinto">Préparer un autre essai avec une IA</h2>
  <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier la note Pinto. Demandez d'abord une proposition dans le chat.</p>
  <Keep title="Demander un autre essai" text={PROMPT} note="Gardez les faits et le point de départ pendant la modification." />
  <p>Relisez la proposition, confirmez responsable et date, puis contrôlez la note après modification. Pinto importe les <a href="/blog/move-from-apple-notes">notes Apple sur Mac</a> sans changer les originaux.</p>
</LocalPostPage>; }
