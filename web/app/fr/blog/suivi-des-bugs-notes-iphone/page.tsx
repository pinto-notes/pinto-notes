import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "suivi-des-bugs-notes-iphone");

// French version of /blog/apple-notes-bug-triage-template (templates translation, 21 Nov 2026). Apple's own French words,
// all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac ("Ajouter un tableau dans Notes sur
// Mac": Format > Tableau, deux rangs et deux colonnes, la touche Tabulation), support.apple.com/fr-fr/guide/notes/
// apd46c25187e/mac (Option + Commande + T), support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (« Trier
// automatiquement les tâches terminées » dans les réglages de Notes) and support.apple.com/fr-fr/102462 (compte Apple).
// Édition > Coller au format Markdown and the Table button (Tableau) are the French strings in Notes' MainMenu.loctable
// on macOS 27.2. Paste as Markdown is not used for the table, as in the English post. Search words: Google's French
// suggestions (hl=fr, gl=fr, 21 Nov) give "suivi des bugs" and "fiche bug"; "triage des bugs" only brings up the English
// "triage bugs" (jira, bug triage meeting, process). French teams say suivi des bugs and keep "triage" for the meeting.
// Hence the slug "suivi des bugs notes iphone". Facts are the English post's; the picture is its own, described in
// French.

const ui = UI.fr;

// Tabs between the columns: select those lines in Notes and click the Table button.
const TABLE = `Triage des bugs

Bug\tGravité\tZone\tStatut\tSignalé\tLien
Les cartes enregistrées échouent au paiement\tP1\tPaiement\tEn cours\t2026-11-04\t#412
La recherche ignore é, è et ç\tP2\tRecherche\tCorrigé\t2026-11-02\t#407
Le mail de commande arrive deux fois\tP2\tMails\tNouveau\t2026-11-06\t#418
Logo du pied de page flou sur mobile\tP3\tDesign\tConfirmé\t2026-11-05\taucun
`;

const RULES = `## Gravité
- P0 : perte de données, faille de sécurité, ou tout le monde est bloqué. On lâche tout.
- P1 : un parcours principal est cassé pour beaucoup de gens. Cette semaine.
- P2 : cassé, mais il y a un contournement. À planifier.
- P3 : finitions. Quand il y a le temps.

## Détails
Les cartes enregistrées échouent au paiement
1. Se connecter à un compte avec une carte enregistrée.
2. Ajouter n’importe quoi au panier et aller au paiement.
3. Choisir la carte enregistrée et sélectionner Payer.
Attendu : la commande est passée.
Constaté : « Échec du paiement », et pas de commande.
`;

const LIST = `# Bugs par gravité

## P1
- [ ] Les cartes enregistrées échouent au paiement (Paiement, #412)

## P2
- [ ] Le mail de commande arrive deux fois (Mails, #418)
- [x] La recherche ignore é, è et ç (Recherche, #407)

## P3
- [ ] Logo du pied de page flou sur mobile (Design)
`;

const FAQ = [
  { q: "Qu’est-ce que le triage des bugs ?", a: [
    "Décider, pour chaque nouveau signalement, à quel point c’est grave et quand ce sera corrigé. La plupart des équipes donnent à chaque bug une gravité de P0 à P3, une zone et un statut, et passent les nouveaux en revue un jour fixe.",
  ] },
  { q: "Que doit contenir un modèle de suivi des bugs ?", a: [
    "Un titre court, la gravité, la zone, le statut, la date du signalement et un lien vers le signalement. Puis, pour chaque bug que vous savez reproduire, les étapes, ce qui était attendu et ce qui s’est passé.",
  ] },
  { q: "Peut-on suivre des bugs dans Notes ?", a: [
    "Pour un petit projet, oui : un tableau avec un rang par bug, ou une liste de pointage sous un sous-titre par gravité. Les tableaux de Notes ne trient pas et ne filtrent pas : au-delà de deux douzaines de bugs, un outil de suivi des tickets fait mieux.",
  ] },
  { q: "Existe-t-il un modèle de triage qui range les signalements pour moi ?", a: [
    "Pinto Notes a un modèle gratuit Bug triage. Collez un signalement ou une issue GitHub dans ChatGPT, Claude ou Claude Code et il ajoute un rang selon vos règles de gravité, avec les étapes pour reproduire.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="suivi-des-bugs-notes-iphone"
      intro={<>
        Toutes les équipes n’ont pas besoin d’un outil de suivi des tickets. Un développeur seul ou une équipe de trois peut garder chaque bug
        dans une note, si chacun reçoit une gravité et que les pires sont en haut. Voici un modèle de suivi des bugs pour Notes, une version
        en liste de pointage qui se trie mieux, et là où une note s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#par-gravite", label: "Une version en liste" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Des bugs qui se rangent seuls" },
        ]}>
          <p>
            Notes n’a pas de modèle de triage des bugs, mais une note fait l’affaire : un tableau avec un rang par bug (titre, gravité, zone,
            statut, date, lien), les règles de gravité dessous, et les étapes pour reproduire chaque bug en dessous. Donnez à chaque bug une
            gravité de P0 à P3 dès qu’il arrive, et corrigez en partant du haut.
          </p>
          <PostCta template="bug-triage" slug="fr/suivi-des-bugs-notes-iphone" path="/fr/blog/suivi-des-bugs-notes-iphone" position="answer" ui={ui.cta}
            title="Les signalements rangés pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit de triage des bugs. Collez un signalement dans ChatGPT ou Claude et il ajoute un rang selon vos règles de gravité, avec les étapes pour reproduire.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/bug-triage-note" width={1520} height={1363} maxWidth={600}
        alt="Une note Bug triage dans Pinto Notes sur Mac : un tableau de quatre bugs avec une gravité de P1 à P3, la zone, le statut, la date et le numéro de ticket, les étapes pour reproduire le bug de paiement par carte enregistrée, et les règles de gravité."
        caption="Une note de triage des bugs dans Pinto Notes, avec la gravité et le statut en colonnes à choix. Dans Notes, le tableau, les détails et les règles passent en texte simple." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : un tableau et les règles</h2>
      <p>
        Le tableau est la liste que vous regardez chaque matin. La gravité dit quand un bug sera corrigé, et les règles la gardent honnête :
        P1 veut dire qu’un parcours principal est cassé pour beaucoup de gens, et un client qui crie fort n’y change rien. Gardez des titres
        courts, car six colonnes se partagent la largeur.
      </p>
      <Keep title="Tableau de triage des bugs pour Notes" text={TABLE} copyLabel={ui.copy}
        note="Chaque ligne du tableau a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />
      <Keep title="Règles de gravité et détails" text={RULES} copyLabel={ui.copy}
        note="Collez-le sous le tableau avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Édition", "Coller au format Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Collez, puis faites le tableau.</strong> Collez le modèle du tableau dans une nouvelle note, sélectionnez les cinq lignes de
          Bug au dernier bug, et cliquez sur le bouton Tableau. Chaque tabulation devient une colonne : vous avez les six colonnes côte à
          côte.
        </li>
        <li>
          <strong>Ou partez de zéro.</strong> Choisissez Format, Tableau pour deux rangs et deux colonnes, et Tabulation dans la dernière
          cellule ajoute le rang suivant.
        </li>
        <li>
          <strong>Ajoutez les règles et les détails.</strong> Cliquez sous le tableau et choisissez Édition, Coller au format Markdown. Les
          lignes ## deviennent des sous-titres.
        </li>
        <li>
          <strong>Changez un statut en tapant par-dessus.</strong> De En cours à Corrigé, c’est une cellule. Laissez les bugs corrigés une
          semaine, pour que tout le monde voie ce qui a changé.
        </li>
      </ul>
      <p>
        Notes règle la largeur des colonnes lui-même et on ne peut pas les faire glisser : un long titre écrase le reste.{" "}
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre tout ce qu’un tableau dans Notes sait faire, ou pas.
        Si d’autres signalent aussi des bugs, partagez la note et autorisez les modifications ; chaque personne a besoin d’un compte Apple.
      </p>

      <h2 id="par-gravite">Une version en liste de pointage qui se trie toute seule</h2>
      <p>
        Les tableaux de Notes ne trient pas : un nouveau P1 atterrit en bas. Si ça vous gêne, donnez un sous-titre à chaque gravité et une
        ligne de liste de pointage à chaque bug dessous. Les pires bugs sont toujours en haut, et cocher une ligne la marque corrigée.
      </p>
      <Keep title="Bugs par gravité pour Notes" text={LIST} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <p>
        Cochez Trier automatiquement les tâches terminées dans les réglages de Notes, et les bugs corrigés descendent en bas de leur
        sous-titre. La recherche lit chaque mot de chaque note : chercher « paiement » trouve le bug et ses détails. D’autres notes à coller
        sont dans <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais).
      </p>

      <h2 id="limites">Là où un suivi des bugs dans Notes s’arrête</h2>
      <ul>
        <li><strong>Pas de tri ni de filtre.</strong> « Tous les P1 ouverts », c’est lire tout le tableau.</li>
        <li><strong>Chaque signalement se retape.</strong> Les bugs arrivent par mail, par chat et par GitHub, et chacun devient un titre, une gravité et des étapes écrits à la main.</li>
        <li><strong>La gravité se juge à chaque fois.</strong> Les règles sont dans la note, mais c’est vous qui les relisez face à chaque signalement.</li>
        <li><strong>Pas de lien avec le code.</strong> Trouver dans quels fichiers vit un bug reste un travail à part.</li>
      </ul>
      <p>
        Pour un projet perso ou une petite app, une note suffit. Avec une équipe qui signale des dizaines de bugs par semaine, prenez un outil
        de suivi des tickets.
      </p>

      <h2 id="pinto-notes">Des bugs qui se rangent tout seuls</h2>
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis
        la conversation que vous utilisez déjà. Le modèle gratuit <a href="/templates/bug-triage">Bug triage</a> (triage des bugs) est une
        note avec un tableau Bugs, une partie Details et les règles de gravité. Dans le tableau, la gravité est un choix de P0 à P3 et le
        statut un choix parmi New, Confirmed, In progress, Fixed et Won’t fix.
      </p>
      <p>
        Collez un signalement de bug dans votre IA. Elle suit les règles de gravité et ajoute un rang avec un titre court, la gravité, la
        zone, le statut New, la date du jour et le lien, et garde les rangs du pire au moins grave. Si le signalement dit comment le
        reproduire, les étapes, ce qui était attendu et ce qui s’est passé vont sous Details. Dans Claude Code, le modèle a ses propres
        instructions : collez une issue GitHub et il la lit avec gh issue view, ajoute le rang, puis cherche dans votre code la cause
        probable et ajoute les fichiers concernés aux détails. <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and
        Codex</a> (en anglais) donne la commande pour l’ajouter.
      </p>
      <p>
        Demandez « quels P1 sont encore ouverts ? », ou dites « on a corrigé le paiement par carte enregistrée, marque-le » et elle change le
        statut. Vous pouvez toujours modifier chaque rang vous-même, et chaque version précédente de la note est gardée. La partie IA marche
        une fois ChatGPT ou Claude connecté ; <a href="/blog/connect-chatgpt-to-your-notes">connecter ChatGPT</a> (en anglais) prend une
        minute. Les notes que vous gardez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre
        Mac</a> (en anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
