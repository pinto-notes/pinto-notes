import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-candidatures-notes-iphone");

// French version of /blog/apple-notes-job-search-tracker (templates translation, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes sur
// Mac": Format > Tableau, deux rangs et deux colonnes, la touche Tabulation), support.apple.com/fr-fr/guide/notes/
// apd46c25187e/mac ("Raccourcis clavier": Option + Commande + T, Ajouter un lien Commande + K),
// support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (« Trier automatiquement les tâches terminées » dans les réglages
// de Notes), support.apple.com/fr-fr/guide/notes/apde615d29c2/mac (Édition > Ajouter un lien) and
// support.apple.com/fr-fr/guide/notes/apdb54e469b6/mac (épingler). Édition > Coller au format Markdown, the Table button
// (Tableau) and the Checklist button (Liste de pointage) are the French strings in Notes' MainMenu.loctable and
// Localizable.loctable on macOS 27.2. Paste as Markdown is not used for the table, as in the English post. Search words:
// Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "tableau suivi candidature" (recherche emploi, excel, google
// sheet, alternance, stage, france travail), "suivi des candidatures" (excel, notion) and "suivi recherche d'emploi";
// nothing for Notes. Hence the slug "suivi candidatures notes iphone". The companies are the English post's made-up
// ones. Facts are the English post's; the picture is its own, described in French.

const ui = UI.fr;

// Tabs between the columns: select those lines in Notes and click the Table button.
const TABLE = `Recherche d’emploi

Entreprise\tPoste\tÉtape\tProchaine étape
Tideway\tDesigner senior\tEntretien\t1er entretien, 12 nov.
Marlow Studio\tLead design\tPostulé\tRelancer, 16 nov.
Finch Bikes\tProduct designer\tÀ postuler\tPostuler avant le 18 nov.
Northlight\tDesigner UX\tRefusé\tRetour demandé
`;

const REST = `## Préparer les entretiens
Tideway, 1er entretien le 12 nov.
1. Un projet dont vous êtes fier ? La refonte de l’onboarding.
2. Comment travaillez-vous avec les devs ? Revue chaque semaine, livrer petit.
3. Pourquoi Tideway ? J’aime démêler la logistique.

À leur demander : comment le design et le support partagent-ils ce qu’ils entendent ?

## Cette semaine
- [ ] Envoyer le lien du portfolio à Tideway
- [ ] Ajouter le projet onboarding au CV

## Personnes rencontrées
- Karin, responsable design chez Tideway : préfère des prototypes simples à un rendu léché.
`;

const FAQ = [
  { q: "Peut-on suivre ses candidatures dans Notes ?", a: [
    "Oui, avec un tableau. Faites un rang par offre avec l’entreprise, le poste, l’étape et la prochaine étape, et gardez les relances en liste de pointage dessous. Notes n’a aucun modèle : collez celui de cette page dans une nouvelle note.",
  ] },
  { q: "Notes peut-il trier mes candidatures par étape ?", a: [
    "Non. Les tableaux de Notes ne trient pas et ne font pas de totaux. Gardez toujours les mêmes mots pour l’étape (À postuler, Postulé, Entretien, Offre, Refusé) pour que la colonne se lise vite.",
  ] },
  { q: "Un tableur est-il mieux pour une recherche d’emploi ?", a: [
    "Un tableur trie et filtre, ce qui aide au-delà de quelques dizaines de candidatures. Une note garde le tableau à côté de la préparation des entretiens et des personnes rencontrées, sur votre téléphone entre deux entretiens.",
  ] },
  { q: "Existe-t-il un suivi des candidatures qui se remplit tout seul ?", a: [
    "Pinto Notes a un modèle gratuit Job hunt. Collez une offre d’emploi dans ChatGPT ou Claude et il ajoute le rang, puis tient à jour l’étape et la prochaine étape quand vous lui dites ce qui s’est passé.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="suivi-candidatures-notes-iphone"
      intro={<>
        La plupart des tableaux de suivi des candidatures sont des tableurs, et un tableur, c’est une chose de plus à ouvrir. Si vous vivez
        déjà dans Notes, une note peut garder chaque candidature et ce qui vient ensuite. Voici un modèle de suivi des candidatures pour
        Notes, comment le tenir à jour, et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#semaine", label: "Semaine après semaine" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un suivi qui se met à jour" },
        ]}>
          <p>
            Notes n’a pas de modèle de suivi des candidatures, mais une note avec un tableau fait l’affaire : un rang par candidature avec
            l’entreprise, le poste, l’étape et la prochaine étape. Sous le tableau, gardez la préparation des entretiens, une liste de
            pointage des relances de la semaine et les personnes rencontrées.
          </p>
          <PostCta template="job-hunt" slug="fr/suivi-candidatures-notes-iphone" path="/fr/blog/suivi-candidatures-notes-iphone" position="answer" ui={ui.cta}
            title="Le suivi tenu à jour pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de suivi des candidatures. Collez une offre dans ChatGPT ou Claude et il ajoute le rang, puis vous aide à préparer l’entretien.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/job-hunt-note" width={1520} height={1514} maxWidth={600}
        alt="Une note Job hunt dans Pinto Notes sur Mac : un tableau Applications de quatre offres avec Tideway à l’étape Interview, la préparation d’entretien avec trois questions et des éléments de réponse, une liste de pointage This week avec un élément coché, et une note sur Karin chez Tideway."
        caption="Un suivi des candidatures dans Pinto Notes, avec l’étape en colonne à choix. Dans Notes, le même tableau marche avec l’étape tapée en un mot. Données d’exemple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note, un rang par offre</h2>
      <p>
        Le tableau répond à la question que vous vous posez le plus : où en est chaque candidature, et que faire ensuite. Mettez une date
        dans chaque prochaine étape, car « relancer » sans jour a tendance à rester en plan. Tout ce qui ne tient pas dans un rang va sous le
        tableau.
      </p>
      <Keep title="Tableau des candidatures pour Notes" text={TABLE} copyLabel={ui.copy}
        note="Chaque ligne du tableau a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />
      <Keep title="Entretiens et relances pour Notes" text={REST} copyLabel={ui.copy}
        note="Sur Mac, collez-le sous le tableau avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez le modèle du tableau dans une nouvelle note, sélectionnez les cinq lignes
          d’Entreprise à Northlight, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne : vous avez Entreprise, Poste,
          Étape et Prochaine étape côte à côte.
        </li>
        <li>
          <strong>Ajoutez le reste.</strong> Cliquez sous le tableau et choisissez Édition, Coller au format Markdown avec le second modèle.
          Sur macOS 27, chaque ligne ## devient un sous-titre et les relances une liste de pointage. Un simple Commande + V garde les
          symboles en texte. Sur iPhone, tapez les sous-titres, sélectionnez les relances et touchez le bouton Liste de pointage.
        </li>
        <li>
          <strong>Ajoutez une offre.</strong> Cliquez dans la dernière cellule et appuyez sur Tabulation pour un nouveau rang. Notes règle la
          largeur des colonnes lui-même et on ne peut pas les faire glisser : gardez quelques mots par cellule.
        </li>
        <li>
          <strong>Épinglez-la.</strong> Épinglez la note en haut de son dossier : c’est la première chose que vous voyez quand un recruteur
          appelle.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans Notes sait faire, ou
        pas.
      </p>

      <h2 id="semaine">Semaine après semaine</h2>
      <ul>
        <li>
          <strong>Gardez les mêmes mots pour l’étape.</strong> À postuler, Postulé, Entretien, Offre, Refusé, Retiré. Le tableau ne trie pas :
          ce sont ces quelques mots, toujours les mêmes, qui rendent la colonne rapide à parcourir.
        </li>
        <li>
          <strong>Changez le rang le jour même.</strong> Une réponse, un refus, une date d’entretien : mettez à jour Étape et Prochaine étape
          avant de fermer le mail.
        </li>
        <li>
          <strong>Prévoyez les relances le dimanche.</strong> Lisez la colonne Prochaine étape et recopiez ce qui arrive sous Cette semaine.
          Avec Trier automatiquement les tâches terminées activé, ce qui est coché descend en bas.
        </li>
        <li>
          <strong>Une note à part pour une longue préparation.</strong> Quand la préparation pour une entreprise dépasse quelques questions,
          passez-la dans sa propre note et faites un lien vers elle depuis Préparer les entretiens avec Édition, Ajouter un lien
          (Commande + K).
        </li>
        <li>
          <strong>Notez qui vous avez rencontré.</strong> Une ligne par personne, avec ce qui comptait pour elle : c’est ce que vous voudrez
          relire avant le deuxième entretien. La recherche lit chaque mot : un prénom suffit à la retrouver.
        </li>
      </ul>
      <p>
        Pour les notes des entretiens eux-mêmes, le <a href="/fr/blog/compte-rendu-reunion-notes-iphone">compte rendu de réunion dans
        Notes</a> marche tel quel. D’autres notes à coller sont dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en
        anglais).
      </p>

      <h2 id="limites">Là où un suivi des candidatures dans Notes s’arrête</h2>
      <ul>
        <li><strong>Chaque offre se tape à la main.</strong> L’entreprise, le poste et le lien vers l’annonce sortent de l’offre une cellule à la fois.</li>
        <li><strong>Pas de tri ni de filtre.</strong> Avec trente rangs, trouver ceux à l’étape Entretien, c’est lire toute la colonne.</li>
        <li><strong>Les dates ne sont que du texte.</strong> « Relancer, 16 nov. » reste dans une cellule. Remarquer qu’on est le 16, c’est vous.</li>
        <li><strong>La préparation part d’une page blanche.</strong> Les questions probables pour chaque poste, et vos réponses, c’est à vous de les écrire.</li>
      </ul>
      <p>
        Pour une poignée de candidatures, la note suffit. Quand il y en a vingt en même temps, tenir le tableau à jour devient un travail
        en soi.
      </p>

      <h2 id="pinto-notes">Un suivi des candidatures qui se met à jour</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/job-hunt">Job hunt</a> (recherche d’emploi) est une
        note avec un tableau Applications, où l’étape est un choix parmi Saved, Applied, Interview, Offer, Rejected ou Withdrawn, et des
        parties pour la préparation des entretiens, les relances de la semaine et les personnes rencontrées.
      </p>
      <p>
        Collez une offre d’emploi ou un lien dans votre IA et elle ajoute un rang : l’entreprise, le poste avec le lien vers l’annonce,
        l’étape Saved et la prochaine étape. Dites-lui que vous avez postulé ou reçu une réponse et elle change ce rang. Dites « j’ai un
        premier entretien avec Tideway jeudi, aide-moi à le préparer » et elle écrit cinq questions probables avec vos éléments de réponse
        sous le nom de l’entreprise. Demandez « qui dois-je relancer cette semaine ? » et elle en fait une liste de pointage. Vous pouvez
        toujours modifier chaque rang vous-même, et chaque version précédente de la note est gardée. Cette partie marche une fois ChatGPT
        ou Claude connecté ; <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Les notes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en
        anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
