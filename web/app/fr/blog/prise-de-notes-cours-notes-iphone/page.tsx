import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "prise-de-notes-cours-notes-iphone");

// French version of /blog/apple-notes-for-school (batch 3, 21 Nov 2026). Apple's own French words, all read on 21 Nov
// 2026: support.apple.com/fr-fr/guide/notes/apdb5106e334/mac ("Enregistrer et transcrire de l'audio dans Notes sur Mac":
// « Enregistrement audio » from the toolbar, edit the note while recording, « Rechercher dans la transcription »,
// « Ajouter la transcription à la note », Résumé with Apple Intelligence, transcription on Macs with M1 or later in the
// listed languages, deleting a recording deletes its transcript), support.apple.com/fr-fr/guide/iphone/iphbe11247b5/ios
// (« Enregistrement audio », balayer vers le bas depuis le haut de l'écran pour prendre des notes, iPhone 12 or later,
// summaries on iPhone 15 Pro or later), support.apple.com/fr-fr/guide/iphone/iph653f28965/ios (« Scanner des documents »,
// automatic capture when the iPhone detects the page's edges, saved as a PDF, « Scanner du texte »),
// support.apple.com/fr-fr/guide/iphone/iphb8628c6b8/ios (search finds text in scanned documents and handwriting),
// support.apple.com/fr-fr/guide/notes/apdd655f4242/mac (« Renommer la pièce jointe », scans named Documents numérisés by
// default), support.apple.com/fr-fr/guide/notes/apd558a85438/mac (Fichier > Nouveau dossier, drag a folder onto another)
// and support.apple.com/fr-fr/guide/iphone/ipha61270292/ios (« Nouveau dossier », « Épingler la note »),
// support.apple.com/fr-fr/guide/notes/apda85974595/mac (an expression and =, variables, Retour inserts the answer, l'ordre
// des opérations standard, Format > Résultats mathématiques: Insérer les résultats, Suggérer les résultats, Désactivés),
// support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (Format > Tableau, la touche Tabulation) and apd46c25187e/mac
// (Option + Commande + T, Ajouter un lien Commande + K, Dupliquer une note Commande + D), support.apple.com/fr-fr/guide/
// notes/apd4e6e2c9a6/mac and support.apple.com/fr-fr/guide/iphone/iphe4d04f674/ios (bouton Partager, « Partager un lien »,
// « Partager le dossier », « Envoyer une copie », Apple Account with Notes on in iCloud, no locked notes, notes added to
// a shared folder are shared with everyone, @ and a name). Édition > Coller au format Markdown, Édition > Ajouter un
// lien, Fichier > Dupliquer la note, the Table button (Tableau) and the Checklist button (Liste de pointage) are the
// French strings in Notes' MainMenu.loctable and Localizable.loctable on macOS 27.2; the Smart Folder rule Listes de
// pointage with Non coché is in its SmartFolder tables. Search words: Google's French suggestions (hl=fr, gl=fr, 21 Nov)
// give "prise de notes cours" (magistral, application, ia, mac), "prendre des notes en cours" (comment, en classe, appli),
// "prise de notes iphone" and "prise de notes apple"; "notes iphone étudiant" only suggests the English "apple notes
// student". Hence the slug "prise de notes cours notes iphone". The example class is the English post's biology, in
// French; the Math Results example uses whole numbers. Facts are the English post's; the pictures are its own, described
// in French.

const ui = UI.fr;

const CLASS_NOTE = `# Biologie

## Cette semaine
- [ ] Lire le chapitre 4
- [ ] Compte rendu de TP sur les enzymes
- [ ] Flashcards sur la respiration cellulaire

## Cours
- Respiration cellulaire, 3 novembre
- Photosynthèse, 10 novembre

## Examens
- Partiel, 12 décembre
`;

const LECTURE = `# Respiration cellulaire, 3 novembre

## Notes
- Le glucose est dégradé pour produire de l’ATP, l’énergie de la cellule.
- Trois étapes : la glycolyse, le cycle de Krebs, la chaîne respiratoire.
- La plus grande partie de l’ATP vient de la chaîne respiratoire, dans les mitochondries.

## À demander
- [ ] Où se passe la glycolyse dans la cellule ?

## Résumé
Le glucose devient de l’ATP en trois étapes, et la plus grande partie est produite dans les mitochondries.
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TIMETABLE = `Jour\tCours\tSalle
Lundi\tBiologie\tLabo 2
Mardi\tÉconomie\tAmphi B
Jeudi\tBiologie\tLabo 2
Vendredi\tÉconomie\tSalle 14
`;

const MATH = `distance = 120
temps = 2
distance / temps =
`;

const FAQ = [
  { q: "Notes d’Apple est-il bien pour les cours ?", a: [
    "Pour prendre des notes et les garder, oui. Il est gratuit sur iPhone et Mac, scanne les polycopiés, enregistre les cours avec une transcription et fait les calculs. Il est plus faible pour réviser : pas de modèles, pas de flashcards ni de quiz, et une note partagée demande un compte Apple à chaque membre du groupe.",
  ] },
  { q: "Notes peut-il enregistrer un cours et le transcrire ?", a: [
    "Oui. Dans une note, ouvrez le menu des pièces jointes et choisissez Enregistrement audio. Notes écrit une transcription en direct dans les langues prises en charge sur un iPhone 12 ou ultérieur ou un Mac avec une puce M1 ou ultérieure, et Apple Intelligence peut la résumer là où elle est disponible.",
  ] },
  { q: "Peut-on réviser ses examens dans Notes ?", a: [
    "En partie. Un tableau à deux colonnes fait office de flashcards : une question à gauche, la réponse à droite, et vous cachez la colonne de droite pour vous tester. Rien ne planifie vos révisions ni ne retient les cartes que vous avez ratées.",
  ] },
  { q: "Peut-on partager ses notes avec d’autres élèves ?", a: [
    "Oui, une note ou tout un dossier, avec Partager un lien. Chacun a besoin d’un compte Apple avec Notes activé dans iCloud, et une note verrouillée ne peut pas être partagée. Pour les autres, Envoyer une copie envoie une copie qu’ils peuvent lire mais pas modifier.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="prise-de-notes-cours-notes-iphone"
      intro={<>
        Notes est déjà sur votre iPhone et votre Mac, alors beaucoup de notes de cours y finissent de toute façon. Voici une réponse honnête
        à la question de savoir s’il suffit pour le lycée ou la fac, puis une organisation qui tient tout un semestre, d’un dossier par
        matière jusqu’aux notes partagées avec un groupe de révision.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#bien-pour-les-cours", label: "Est-ce bien pour les cours ?" },
          { href: "#dossiers", label: "Un dossier par matière" },
          { href: "#cours", label: "Une note par cours" },
          { href: "#enregistrer", label: "Enregistrer un cours" },
          { href: "#reviser", label: "Méthode Cornell et flashcards" },
          { href: "#groupe", label: "Groupes de révision" },
          { href: "#pinto-notes", label: "Des notes qui vous interrogent" },
        ]}>
          <p>
            Oui, pour prendre des notes et les garder, surtout si votre groupe de révision utilise aussi des iPhone et des Mac. Il est
            gratuit, scanne les polycopiés, enregistre les cours avec une transcription et fait les calculs. Là où il est en retrait, c’est la
            révision : pas de modèles, pas de flashcards ni de quiz, donc vous les construisez vous-même.
          </p>
          <PostCta template="study-flashcards" slug="fr/prise-de-notes-cours-notes-iphone" path="/fr/blog/prise-de-notes-cours-notes-iphone" position="answer" ui={ui.cta}
            title="Des notes qui vous interrogent ?">
            <p>Pinto Notes fonctionne comme Notes et a des modèles gratuits de méthode Cornell et de flashcards. Collez vos notes de cours dans ChatGPT ou Claude : il écrit les questions, puis vous interroge.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="bien-pour-les-cours">Notes est-il bien pour les cours ?</h2>
      <p>
        Pour noter, il est très bien. Il est gratuit, une note tapée sur votre Mac est sur votre iPhone grâce à iCloud, et la recherche trouve
        les mots dans le texte tapé, le texte manuscrit et les pages scannées. Il scanne un polycopié en PDF, enregistre un cours et écrit ce
        qui a été dit, et donne le résultat d’un calcul quand vous tapez un signe égal.
      </p>
      <p>
        Pour réviser, il en fait moins. Pas de modèles, pas de flashcards, et rien qui vous pose des questions ou retient vos erreurs. Les
        tableaux ne trient pas et ne font pas de totaux. Un groupe de révision ne peut travailler dans une même note que si chacun a un compte
        Apple. Si vos études sont surtout de la mémorisation, comme la médecine, prenez vos notes dans Notes et planifiez vos révisions
        ailleurs, dans un outil qui les programme.
      </p>

      <h2 id="dossiers">Un dossier par matière</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="La liste des dossiers de Notes sur iPhone sous iOS 27 : Quick Notes et Shared, des dossiers iCloud comme Notes, Gift Ideas et Grocery List, et une section Tags en dessous."
        caption="La liste des dossiers sur iPhone. Chaque matière y a son dossier. Image : Apple." />
      <Paths rows={[
        { on: "Mac", steps: ["Fichier", "Nouveau dossier"] },
        { on: "iPhone", steps: ["Liste des dossiers", "Nouveau dossier"] },
      ]} />
      <p>
        Créez un dossier par matière. Pour garder un semestre ensemble, créez un dossier pour le semestre et faites glisser chaque dossier de
        matière dessus : ils deviennent des sous-dossiers. Au semestre suivant, créez-en un nouveau, et les anciennes matières ne gênent plus.
      </p>
      <p>
        Dans chaque dossier, gardez une note de matière avec ce qu’il y a à rendre et la liste des cours, et épinglez-la pour qu’elle reste en
        haut (sur iPhone, maintenez le doigt sur la note, puis Épingler la note). Sélectionnez le nom d’un cours et choisissez Édition, Ajouter
        un lien (Commande + K) pour le relier à la note de ce cours.
      </p>
      <Keep title="Note de matière pour Notes" text={CLASS_NOTE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />
      <p>
        Sur un Mac avec macOS 27, Édition, Coller au format Markdown transforme la ligne # en titre, chaque ligne ## en sous-titre et les
        devoirs en liste de pointage. Gardez un mot sur chaque ligne de la liste, car un élément vide ne survit pas au collage. Un dossier
        intelligent avec la règle Listes de pointage, Non coché liste ensuite chaque note où il reste quelque chose à cocher, devoirs compris ;{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> (en anglais) montre comment en créer un.
      </p>

      <h2 id="cours">Une note par cours</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="Le bas du menu File de Notes sur macOS 27 : Export To, Pin Note, Lock Note, Duplicate Note avec Commande-D, en surbrillance, et Print."
        caption="Fichier, Dupliquer la note (Duplicate Note ici, en anglais) démarre le cours suivant à partir du précédent." />
      <p>
        Donnez à chaque cours sa propre note, avec le sujet et la date en titre. Des notes courtes sont plus faciles à retrouver et à réviser
        qu’une longue note par matière. Sur Mac, Fichier, Dupliquer la note (Commande + D) copie la note de la semaine dernière avec ses
        sous-titres, prête à vider et à remplir.
      </p>
      <Keep title="Note de cours pour Notes" text={LECTURE} copyLabel={ui.copy} />
      <p>
        En cours, n’écrivez que sous Notes. Les questions vont sous À demander, en liste de pointage, pour les cocher une fois la réponse
        trouvée. Écrivez le résumé le soir même, en deux ou trois phrases à vous.
      </p>

      <h2 id="scanner">Scanner les polycopiés dans la note du cours</h2>
      <Paths rows={[{ on: "iPhone", steps: ["Bouton des pièces jointes", "Scanner des documents"] }]} />
      <p>
        Ouvrez la note du cours sur votre iPhone, touchez le bouton des pièces jointes, puis Scanner des documents, et gardez la page dans le
        cadre. L’iPhone prend la photo quand il détecte les bords de la page. Scannez les autres pages, touchez le bouton pour terminer, et le
        polycopié est enregistré dans la note au format PDF. La recherche en trouve les mots plus tard. Pour une seule citation d’un livre,
        Scanner du texte, dans le même menu, insère plutôt le texte dans la note.
      </p>
      <p>
        Un scan s’appelle Documents numérisés. Sur Mac, cliquez sur la flèche à côté de son nom et choisissez Renommer la pièce jointe pour
        l’appeler « Polycopié semaine 3 ».
      </p>

      <h2 id="enregistrer">Enregistrer un cours, avec une transcription et un résumé</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bouton des pièces jointes", "Enregistrement audio"] },
        { on: "iPhone", steps: ["Bouton des pièces jointes", "Enregistrement audio"] },
      ]} />
      <p>
        Demandez d’abord à votre enseignant : beaucoup d’établissements ont des règles sur l’enregistrement. Ouvrez ensuite la note du cours,
        choisissez Enregistrement audio dans le menu des pièces jointes et appuyez sur le bouton d’enregistrement. Vous pouvez continuer à
        taper pendant l’enregistrement (sur iPhone, balayez vers le bas depuis le haut de l’écran pour revenir à la note).
      </p>
      <p>
        Ensuite, ouvrez l’enregistrement et cliquez sur le bouton de transcription pour lire ce qui a été dit. Cliquez sur une phrase pour
        entendre ce moment. Le menu de l’enregistrement propose Rechercher dans la transcription, pour le passage où l’examen a été évoqué, et
        Ajouter la transcription à la note. Cliquez ensuite sur Résumé, et Apple Intelligence écrit un court résumé de la transcription.
      </p>
      <p>
        La transcription demande un iPhone 12 ou ultérieur ou un Mac avec une puce M1 ou ultérieure, réglé sur une langue prise en charge.
        Les résumés demandent Apple Intelligence, c’est-à-dire un iPhone 15 Pro ou ultérieur sur iPhone, et elle n’est pas
        disponible dans toutes les langues ou régions. Supprimer un enregistrement supprime aussi sa transcription.
      </p>

      <h2 id="tableaux">Des tableaux pour l’emploi du temps ou une liste de lectures</h2>
      <PostFigure src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="Une note Reading list dans Notes sur macOS 27, avec un tableau de trois colonnes, Book, Author et Started, et quatre livres. Les titres longs passent à la ligne dans leur cellule."
        caption="Un tableau dans Notes sur macOS 27. Notes choisit la largeur des colonnes." />
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Tableau"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Bouton Tableau"] },
      ]} />
      <Keep title="Emploi du temps pour Notes" text={TIMETABLE} copyLabel={ui.copy}
        note="Chaque ligne a une tabulation entre les colonnes. Collez-le, puis transformez ces lignes en tableau." />
      <p>
        Collez l’emploi du temps dans une nouvelle note, sélectionnez les cinq lignes et appuyez sur le bouton Tableau. Chaque tabulation
        devient une colonne. Tabulation dans la dernière cellule ajoute un rang. Les tableaux de Notes ne trient pas, ne font pas de totaux et
        ne changent pas la largeur d’une colonne : tapez donc les dates limites dans l’ordre.{" "}
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> (en anglais) couvre le reste.
      </p>

      <h2 id="reviser">Méthode Cornell et flashcards</h2>
      <p>
        Un tableau à deux colonnes est aussi la façon la plus simple de réviser dans Notes. Pour la méthode Cornell, mettez une courte
        question à gauche, votre note à droite, et un résumé sous le tableau ; cachez la colonne de droite et répondez à voix haute. La{" "}
        <a href="/fr/blog/methode-cornell-notes-iphone">méthode Cornell dans Notes</a> donne un modèle à coller.
      </p>
      <p>
        Les flashcards marchent de la même façon : un rang par carte, question et réponse. Ce que Notes ne sait pas faire, c’est choisir les
        cartes à revoir aujourd’hui, ou faire revenir celles que vous avez ratées. Les{" "}
        <a href="/fr/blog/flashcards-notes-iphone">flashcards dans Notes</a> montrent la mise en page et les solutions de contournement.
      </p>

      <h2 id="calculs">Les résultats mathématiques pour les calculs</h2>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Une note Sequoia Group Expenses sur iPhone : chaque dépense nommée sur sa ligne, les noms additionnés pour faire 475 $, et 475 $ divisés par 5 pour faire 95 $ chacun."
        caption="L’exemple d’Apple pour les résultats mathématiques sur iPhone : nommez les nombres, puis utilisez les noms. Image : Apple." />
      <Paths rows={[{ on: "Mac", steps: ["Format", "Résultats mathématiques"] }]} />
      <p>
        Tapez un calcul suivi d’un signe égal, comme (27/3)^2=, et Notes propose le résultat ; appuyez sur Retour pour le garder. Notes suit
        l’ordre des opérations standard : ajoutez des parenthèses là où il en faut. Vous pouvez aussi nommer un nombre sur une ligne
        au-dessus, puis utiliser le nom :
      </p>
      <Keep title="Nombres nommés pour les résultats mathématiques" text={MATH} copyLabel={ui.copy}
        note="Notes propose le résultat après le dernier signe égal. Changez un nombre au-dessus et le résultat suit." />
      <p>
        Format, Résultats mathématiques choisit si les résultats sont insérés, suggérés ou désactivés. Il donne le résultat, pas le
        raisonnement : il sert surtout à vérifier un résultat.
      </p>

      <h2 id="groupe">Partager ses notes avec un groupe de révision</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Bouton Partager", "Menu local", "Partager un lien"] },
        { on: "iPhone", steps: ["Bouton Partager", "Menu sous le titre", "Partager un lien"] },
      ]} />
      <p>
        Partager un lien invite des personnes à travailler dans la même note, et chacun voit les modifications en temps réel. Choisissez si
        elles peuvent modifier ou seulement consulter. Pour partager toute une matière, cliquez sur son dossier en maintenant la touche
        Contrôle enfoncée sur Mac et choisissez Partager le dossier, ou ouvrez-le sur iPhone et touchez le bouton Partager. Chaque note
        ajoutée à un dossier partagé est partagée avec tous ses membres : gardez vos notes personnelles ailleurs. Tapez @ suivi d’un nom pour
        prévenir quelqu’un que vous avez besoin de lui.
      </p>
      <p>
        Chacun a besoin d’un compte Apple avec Notes activé dans iCloud, et les notes verrouillées ne peuvent pas être partagées. Pour un
        camarade sans compte, Envoyer une copie, dans le même menu, envoie une copie qu’il peut lire mais pas modifier.
      </p>

      <h2 id="limites">Là où Notes s’arrête pour les cours</h2>
      <ul>
        <li><strong>Chaque note se prépare à la main.</strong> Il n’y a pas de modèles : chaque note de matière et de cours est collée ou dupliquée.</li>
        <li><strong>Rien ne vous interroge.</strong> Cacher une colonne marche, mais Notes ne pose pas les questions, ne compte pas les points et ne fait pas revenir ce que vous avez raté.</li>
        <li><strong>Les tableaux ne contiennent que du texte.</strong> Pas de tri d’une liste de dates limites, pas de total des notes dans un tableau.</li>
        <li><strong>Les groupes demandent des comptes Apple.</strong> Un camarade avec un autre type de téléphone reçoit une copie, pas la note partagée.</li>
      </ul>

      <h2 id="pinto-notes">Des notes qui vous interrogent</h2>
      <Figure shot={{ ...SHOTS.flashcardsApp, alt: "L’app de flashcards dans une note Pinto Notes sur Mac : 8 cartes à revoir aujourd’hui, des pastilles de sujets, un bouton Study now, une série de 11 jours avec un calendrier, ce qui arrive cette semaine et le nombre de cartes dans chaque boîte." }}
        caption="Le modèle Study notes and flashcards dans Pinto Notes sur Mac, avec des données d’exemple." />
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et ChatGPT ou Claude peut travailler dans vos notes depuis la
        conversation que vous utilisez déjà. Deux de ses modèles gratuits sont faits pour réviser, et un toucher ajoute l’un ou l’autre à vos
        notes.
      </p>
      <p>
        <a href="/templates/cornell-notes">Cornell notes</a> (méthode Cornell) garde une section par cours avec un tableau Cue et Notes et un
        résumé. Collez vos notes de cours dans votre IA et elle écrit une question pour chaque rang, et le résumé. Dites « interroge-moi sur
        l’offre et la demande » et elle pose les questions une par une sans montrer les notes, puis garde celles que vous avez ratées sous Cues
        to revisit.
      </p>
      <p>
        <a href="/templates/study-flashcards">Study notes and flashcards</a> (notes de révision et flashcards) est une petite app dans une note.
        Collez un chapitre et votre IA en tire cinq à dix cartes. Dites « interroge-moi en biologie, dix cartes » et elle pose une carte à la
        fois, en commençant par celles que vous connaissez le moins, et vous dit si vous avez raison. Les cartes ratées reviennent plus tôt, et
        celles que vous connaissez attendent plus longtemps. Vous pouvez ajouter, modifier et supprimer des cartes dans l’app vous-même, et
        chaque version précédente d’une note est gardée. La partie IA marche une fois que vous avez{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT</a> (en anglais) ou Claude, ce qui prend une minute.
      </p>
      <p>
        Les notes de cours que vous avez déjà dans Notes arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a>{" "}
        (en anglais), et Notes reste tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
