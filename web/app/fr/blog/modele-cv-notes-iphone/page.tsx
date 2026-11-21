import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "modele-cv-notes-iphone");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « modèle cv » propose « modèle cv », « modèle cv simple » et « modèle cv gratuit ». « modèle cv notes iphone » ne renvoie rien. Le titre vise le modèle conservé dans Notes sans promettre un CV fini.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac (mise en forme), https://support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (liste), https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (tableau), https://support.apple.com/fr-fr/guide/notes/not9474646a9/mac (Fichier > Dupliquer la note), https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios (Format, Liste de vérification, Ajouter un tableau). Les pages Mac de format, listes et tableaux renvoient 429 dans le lecteur ; leurs gestes sont décrits sans nom de bouton incertain. Faits suivis de /blog/apple-notes-resume-template.
const ui = UI.fr;
const TEMPLATE = `Camille Martin, dossier de référence pour le CV
Mis à jour le 21 novembre 2026

Coordonnées
Lyon, France
camille.martin@example.com | 06 12 34 56 78
Portfolio : https://example.com/camille

Profil
Coordinatrice du support client depuis 2020.
Tient les rapports d'équipe à jour et rédige des guides d'accueil pour les agents.

Expérience
Maison Saône | Coordinatrice des opérations support
Lyon | janvier 2023 à aujourd'hui

12 novembre 2026 : créé une liste de tri utilisée par six agents. Le délai médian de première réponse de l'équipe est passé de 14 heures en septembre à 9 heures en octobre.
Preuve : rapports de la file d'attente de septembre et octobre, enregistrés le 2 novembre 2026.
Ma contribution : rédigé la liste et animé la revue hebdomadaire. L'équipe a traité les demandes.

28 juin 2026 : rédigé un guide d'accueil et formé quatre agents en juin.
Preuve : guide d'accueil et feuille de présence des formations de juin.
Extrait du guide : https://example.com/camille/accueil

Atelier Rhône | Conseillère clientèle
Lyon | septembre 2020 à décembre 2022

31 mars 2022 : traité 35 à 45 demandes clients par semaine en mars.
Preuve : rapport individuel des demandes de mars, pas le total de l'équipe.

Compétences
Rapports Excel, tri des demandes, formation de nouveaux agents, rédaction de guides

Formation
Licence information et communication | Université Lumière Lyon 2 | juin 2020

Faits à vérifier avant utilisation
Confirmer les intitulés exacts des postes dans les contrats
Revérifier les délais de réponse et les mois comparés
Remplacer les coordonnées et liens d'exemple
Retirer les liens internes du CV envoyé aux employeurs
`;
const EVIDENCE = `Date de la réalisation\tPreuve à conserver
12 novembre 2026\tRapports de septembre et octobre, enregistrés le 2 novembre
28 juin 2026\tGuide d'accueil et feuille de présence des formations de juin
31 mars 2022\tRapport individuel des demandes de mars
`;
const FAQ = [
  { q: "Que doit contenir un modèle de CV dans Notes ?", a: ["Gardez les coordonnées, un profil court, les postes datés, les compétences et la formation. Sous chaque poste, ajoutez les réalisations datées et leurs preuves. Cette note sert de dossier de référence."] },
  { q: "Faut-il envoyer cette note à un employeur ?", a: ["Non. Copiez les faits utiles dans un éditeur de documents, retirez les preuves internes et les points à vérifier, puis contrôlez le fichier demandé avant envoi."] },
  { q: "Que faire sans chiffre pour une réalisation ?", a: ["Décrivez le travail, la date et la preuve disponible. Un guide rédigé peut être cité sans inventer de pourcentage d'amélioration."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="modele-cv-notes-iphone"
    intro={<>Gardez dans Notes un dossier de référence de vos postes et réalisations. Choisissez ensuite les faits utiles pour chaque candidature et terminez le CV dans un éditeur de documents.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modele", label: "Copier le modèle" }, { href: "#preparer", label: "Mettre en forme" }, { href: "#adapter", label: "Adapter le CV" }, { href: "#limites", label: "Les limites" }, { href: "#pinto", label: "Rédiger avec une IA" }]}>
      <p>La note de référence réunit coordonnées, postes, dates, réalisations et preuves. Collez l'exemple, remplacez-le par votre parcours, puis préparez chaque CV final dans un document séparé.</p>
      <PostCta slug="fr/modele-cv-notes-iphone" path="/fr/blog/modele-cv-notes-iphone" position="answer" title="Choisir les réalisations utiles avec ChatGPT" ui={ui.cta}><p>Pinto Notes fonctionne comme Notes sur Mac et iPhone. Une fois connecté, ChatGPT ou Claude peut lire le dossier de référence et créer un brouillon séparé à vérifier.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="modele">Garder tout le parcours dans une note</h2>
    <p>Camille et ses coordonnées sont fictives. Remplacez chaque exemple et chaque lien. Gardez aussi les anciens postes et les réalisations qui ne figurent pas dans le CV du jour.</p>
    <Keep title="Dossier de référence pour le CV pour Notes" text={TEMPLATE} note="Collez dans une nouvelle note. Les titres et les vérifications sont d'abord du texte simple." />
    <h2 id="preparer">Ajouter les titres et une liste de vérification</h2>
    <p>Utilisez une note iCloud pour ces gestes ; certaines fonctions de Notes ne sont pas disponibles avec d'autres comptes. Gardez la date à côté de chaque réalisation.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Sélectionner un intitulé", "Choisir un style de titre"] }, { on: "iPhone", steps: ["Format", "Choisir un style de titre"] }]} />
    <p>Mettez en forme les intitulés comme Expérience. Sur Mac, sélectionnez les quatre lignes sous Faits à vérifier et transformez-les en liste à cocher. Sur iPhone, touchez Liste de vérification à cet endroit et saisissez les lignes une par une. Retour ajoute un élément. Cochez seulement après vérification. Pour une copie vierge réutilisable, voyez le <a href="/blog/apple-notes-templates">guide des modèles Notes</a>.</p>
    <h2 id="preuves">Garder des sources retrouvables</h2>
    <p>Ajoutez une réalisation quand le travail est terminé. Précisez votre rôle dans un résultat d'équipe et la période de chaque chiffre. Gardez un titre de rapport ou un lien près du fait. Ne conservez dans vos notes personnelles que les informations professionnelles que vous avez le droit de garder.</p>
    <Keep title="Index facultatif des preuves" text={EVIDENCE} note="Une tabulation sépare la date de la preuve. Collez ce bloc sous le dossier de référence, puis transformez les lignes en tableau." />
    <p>Sur Mac, sélectionnez les quatre lignes et créez un tableau. Les tabulations séparent deux colonnes. Vous pouvez aussi remplir un tableau vide ; Tabulation dans la dernière cellule ajoute une ligne. Sur iPhone, touchez Ajouter un tableau et remplissez les cellules. Le <a href="/blog/apple-notes-tables">guide des tableaux</a> explique les commandes.</p>
    <h2 id="adapter">Choisir les faits pour une candidature</h2>
    <p>Sur Mac, sélectionnez le dossier de référence et choisissez Fichier, Dupliquer la note. Nommez la copie selon le poste et la date. Pour un poste en opérations support, Camille peut commencer par la liste de tri et les rapports. Pour un poste de formation, le guide d'accueil compte davantage.</p>
    <p>Vérifiez chaque phrase dans sa source. La baisse du délai de réponse concerne l'équipe ; Camille peut décrire sa liste sans s'attribuer seule la baisse. Retirez rapports internes et liste de vérification de la version envoyée. Suivez les candidatures dans le <a href="/fr/blog/suivi-candidatures-notes-iphone">tableau de candidatures</a>.</p>
    <h2 id="limites">Le CV final se fait dans un document</h2>
    <p>Cette note contient plus de détails qu'un employeur n'en attend. Utilisez un éditeur de documents pour vérifier pages, espacement et fichier final. Respectez le format demandé et ouvrez le fichier avant envoi. Ce modèle ne garantit ni score de tri automatique ni PDF d'une page.</p>
    <h2 id="pinto">Demander un brouillon séparé dans Pinto Notes</h2>
    <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier les notes. Demandez-lui de lire le dossier de référence et l'offre d'emploi, puis de créer une autre note avec les réalisations pertinentes. Faites-lui signaler les faits manquants au lieu d'inventer des chiffres ou compétences. Laissez le dossier de référence intact.</p>
    <p>Contrôlez dates, sources et crédit de l'équipe. Pinto garde les versions antérieures. Terminez toujours le CV dans un éditeur de documents. Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a>, sans modifier les originaux.</p>
  </LocalPostPage>;
}
