import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "organiser-voyage-notes-iphone");

// French version of /blog/apple-notes-trip-planner-template (templates translation, 21 Nov 2026). Apple's own French
// words, all read on 21 Nov 2026: support.apple.com/fr-fr/guide/notes/apde615d29c2/mac ("Ajouter des liens dans Notes sur
// Mac": Édition > Ajouter un lien, « Lien vers la section », Command + K), support.apple.com/fr-fr/guide/iphone/
// iph908d1558b/ios ("Ajouter des liens dans Notes sur l’iPhone": « Ajouter un lien », « Lien vers la section », « >> »),
// support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (Format > Tableau), support.apple.com/fr-fr/guide/notes/
// apd93c815aa0/mac (Format > Plus > « Tout décocher ») and support.apple.com/fr-fr/guide/iphone/iph1a9cae52c/ios (on
// iPhone you touch the selection, then an editing option; Apple gives that menu no name, so neither does this page).
// Édition > Coller au format Markdown, Fichier > Dupliquer la note, Lien vers (the Link To field) and Joindre un fichier
// are the French strings in Notes' MainMenu.loctable and Localizable.loctable on macOS 27.2. Search words:
// Google's French suggestions (hl=fr, gl=fr, 21 Nov) give "planifier un voyage", "check list voyage", "liste valise
// vacances", "modele organisation voyage" and "template organisation voyage"; nothing in French names Notes, so the slug
// is "organiser voyage notes iphone". The example leaves from Paris instead of Stockholm. Facts are the English post's;
// the pictures are its own, described in French.

const ui = UI.fr;

const TEMPLATE = `# Lisbonne, du 22 au 26 octobre

## Réservations
- [ ] Vol CDG vers LIS, jeu. 22 oct. 6h55, réf. TP7XQ2
- [ ] Hôtel Principe Real, du 22 au 26 oct., réf. 88412093
- [ ] Dîner fado, sam. 24 oct. 20h00
- [ ] Vol LIS vers CDG, lun. 26 oct. 17h40

## Jeudi 22 octobre
- 6h55 Vol pour Lisbonne
- 13h00 Déjeuner au Time Out Market
- 15h00 Arrivée à l’hôtel
- 19h30 Coucher de soleil au Miradouro da Senhora do Monte

## Vendredi 23 octobre
- 9h30 Tram 28 jusqu’à l’Alfama
- 12h00 Déjeuner près du château
- Après-midi libre

## Samedi 24 octobre
- 10h00 Excursion à Sintra
- 20h00 Dîner fado

## Valise
- [ ] Passeport ou carte d’identité
- [ ] Coordonnées de l’assurance voyage
- [ ] Chargeur de téléphone
- [ ] Adaptateur de voyage
- [ ] Chaussures confortables
- [ ] Imperméable
- [ ] Brosse à dents
- [ ] Crème solaire

## Idées
- Rapporter des sardines en boîte
- Demander à Camille sa liste de boulangeries
`;

const FAQ = [
  { q: "Notes a-t-il un modèle pour organiser un voyage ?", a: [
    "Non. Notes n’a ni planificateur de voyage ni modèles. Une note avec un sous-titre pour les réservations, un sous-titre par jour et une liste de pointage pour la valise en fait office, et vous pouvez y coller directement le modèle de cette page.",
  ] },
  { q: "Puis-je garder mes billets dans Notes ?", a: [
    "Oui. Sur Mac, faites glisser le PDF dans la note. Sur iPhone avec iOS 27, Joindre un fichier se trouve dans le menu qui s’affiche quand vous touchez la note. Un piège : une note avec un fichier joint ne peut pas être verrouillée.",
  ] },
  { q: "Comment réutiliser une liste de valise pour le prochain voyage ?", a: [
    "Dupliquez la note avec Fichier, Dupliquer la note, puis cliquez dans la liste de la valise et choisissez Format, Plus, Tout décocher. Changez les dates et supprimez les anciens jours.",
  ] },
  { q: "Existe-t-il un planificateur de voyage gratuit qui fonctionne comme une note ?", a: [
    "Pinto Notes a un modèle gratuit Trip plan : une note qui est une petite app, avec un compte à rebours, chaque jour en frise, les réservations avec une coche une fois payées, et une liste pour la valise. ChatGPT ou Claude peut y ajouter une réservation que vous collez.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="fr"
      slug="organiser-voyage-notes-iphone"
      intro={<>
        Le vol est dans un e-mail, l’hôtel dans un autre, le programme du samedi dans une conversation, et la liste pour la valise dans
        votre tête. Notes peut tout garder dans une seule note. Voici un modèle de voyage à coller, trois façons de le rendre plus pratique,
        et là où il s’arrête.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modele", label: "Le modèle" },
          { href: "#installer", label: "L’installer" },
          { href: "#mieux", label: "Le rendre plus pratique" },
          { href: "#limites", label: "Là où il s’arrête" },
          { href: "#pinto-notes", label: "Un voyage qui tient les comptes" },
        ]}>
          <p>
            Notes n’a pas de planificateur de voyage, mais une seule note fait l’affaire. Mettez-y une liste de pointage des réservations, à
            cocher une fois payées, un sous-titre par jour avec l’heure devant chaque étape, et une liste de pointage pour la valise. Copiez le
            modèle ci-dessous.
          </p>
          <PostCta slug="fr/organiser-voyage-notes-iphone" path="/fr/blog/organiser-voyage-notes-iphone" position="answer" ui={ui.cta}
            title="Le compte à rebours et les réservations tenus pour vous ?">
            <p>Pinto Notes fonctionne comme Notes et a un modèle gratuit Trip plan : les jours qui restent, chaque jour en frise, ce qui reste à payer et ce qui est dans la valise. Collez l’e-mail d’une réservation dans ChatGPT ou Claude, et elle arrive dans le programme.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/trip-booking" width={1200} height={750} maxWidth={560}
        alt="Une enveloppe dessinée avec une flèche vers une carte de liste de pointage, dont deux éléments sont cochés en orange."
        caption="Chaque e-mail de réservation finit en une ligne du programme." />}
      faq={FAQ}
    >
      <h2 id="modele">Le modèle : une note par voyage</h2>
      <p>
        Quatre jours à Lisbonne, pour l’exemple. Mettez votre propre voyage avant de coller : les réservations avec leurs numéros de
        confirmation, un sous-titre par jour, et ce que vous oubliez toujours de mettre dans la valise. Gardez un mot sur chaque ligne, car
        un élément de liste vide ne survit pas au collage.
      </p>
      <Keep title="Organiser un voyage dans Notes" text={TEMPLATE} copyLabel={ui.copy}
        note="Sur Mac, collez-le dans une nouvelle note avec Édition, Coller au format Markdown." />

      <h2 id="installer">L’installer</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="Le même Markdown collé deux fois dans Notes sur macOS 27 : avec Commande + V, les symboles restent du texte ; avec Coller au format Markdown, ils deviennent un titre, une liste et du texte en gras."
        caption="Collage simple à gauche, Coller au format Markdown à droite. Les lignes de liste de pointage fonctionnent de la même façon." />
      <Paths rows={[{ on: "Mac", steps: ["Édition", "Coller au format Markdown"] }]} />
      <p>
        Sur un Mac avec macOS 27, créez une note et choisissez Édition, Coller au format Markdown. La ligne # devient le titre, chaque ligne
        ## un sous-titre, les réservations et la valise deviennent des listes de pointage, et le programme reste une liste. Un simple
        Commande + V garde les symboles en texte. Sur iPhone, tapez les lignes, sélectionnez les réservations et la valise, et touchez le
        bouton Liste de pointage.
      </p>
      <p>
        Cochez une réservation une fois payée : celles qui ne sont pas cochées sont ce que vous devez encore. Si vous préférez voir les
        réservations en tableau, avec des colonnes pour la date et la référence, Format, Tableau en crée un ;{" "}
        <a href="/blog/apple-notes-tables">tables in Apple Notes</a> (en anglais) montre comment, et ce que les tableaux ne savent pas faire.
      </p>

      <h2 id="mieux">Le rendre plus pratique</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Édition", "Ajouter un lien", "Lien vers la section"], keys: "⌘K" },
        { on: "iPhone", steps: ["Touchez la sélection", "Ajouter un lien", "Lien vers la section"] },
      ]} />
      <ul>
        <li>
          <strong>Un sommaire en haut.</strong> Sur macOS 27 et iOS 27, un lien peut pointer vers une section : la note peut donc commencer
          par un lien vers chaque jour. Tapez le titre du voyage dans Lien vers, et ses sections apparaissent.{" "}
          <a href="/blog/apple-notes-ios-27">What’s new in Apple Notes in iOS 27</a> (en anglais) donne les détails.
        </li>
        <li>
          <strong>Les billets dans la note.</strong> Sur Mac, faites glisser le PDF d’un billet ou d’une confirmation d’hôtel dans la note,
          sous sa réservation. Sur iPhone avec iOS 27, utilisez Joindre un fichier dans le menu qui s’affiche quand vous touchez la note. Une
          note qui contient un fichier ne peut pas être verrouillée : n’y mettez pas de numéro de passeport.
        </li>
        <li>
          <strong>La même liste la prochaine fois.</strong> Au retour, choisissez Fichier, Dupliquer la note, puis cliquez dans la liste de
          la valise et choisissez Format, Plus, Tout décocher. La copie est le début du prochain voyage.
        </li>
      </ul>
      <p>
        Si vous organisez souvent vos voyages ainsi, <a href="/blog/apple-notes-templates">Apple Notes templates</a> (en anglais) propose une
        liste pour la valise et un bilan de la semaine à coller de la même manière.
      </p>

      <h2 id="limites">Là où un voyage dans Notes s’arrête</h2>
      <ul>
        <li><strong>Pas de compte à rebours.</strong> Les dates ne sont que des mots. Notes ne sait pas que le départ est dans neuf jours, ni qu’aujourd’hui est le deuxième jour.</li>
        <li><strong>Les réservations à la main.</strong> Chaque e-mail de confirmation se recopie ligne par ligne : l’heure, la référence, le jour où elle va.</li>
        <li><strong>Les jours ne se trient pas.</strong> Ajoutez un dîner au vendredi, et c’est à vous de trouver le sous-titre du vendredi et la bonne place dessous. Déplacez-le au samedi, et c’est couper, coller.</li>
        <li><strong>Pas de compte.</strong> Savoir combien de réservations restent à payer, ou ce qui manque dans la valise, c’est compter les coches.</li>
      </ul>
      <p>
        Pour un week-end, la note suffit largement. Pour une semaine avec des vols, des trains et quelques dîners réservés, vous finissez par
        tenir le programme en ordre à la main.
      </p>

      <h2 id="pinto-notes">Un voyage qui tient les comptes</h2>
      <Figure shot={{ ...SHOTS.tripApp, alt: "L’app de voyage dans une note Pinto Notes sur Mac : Lisbonne, départ dans 9 jours, 3 réservations payées sur 5, 5 affaires sur 14 dans la valise, et le premier jour en frise avec le vol et l’hôtel." }}
        caption="Le modèle Trip plan dans Pinto Notes sur Mac, avec des données d’exemple : départ dans 9 jours, 3 réservations payées sur 5, 5 affaires sur 14 dans la valise, et le premier jour en frise." />
      <p>
        Pinto Notes ressemble à Notes et fonctionne comme lui sur iPhone et Mac, et une note peut aussi être une petite app. Le modèle
        gratuit <a href="/templates/trip-plan">Trip plan</a> (programme de voyage) en est une. Vous dites où vous allez et quand, il compte
        les jours jusqu’au départ, puis indique à quel jour du voyage vous en êtes. Chaque jour est une frise avec ses réservations à leur
        place. Une réservation a un type, une heure, une référence et une coche une fois payée, donc il dit ce qui reste à payer. La liste
        pour la valise est rangée par groupes, un toucher par affaire, et un nouveau voyage la garde.
      </p>
      <p>
        Vous pouvez aussi coller une confirmation de réservation dans ChatGPT ou Claude, dans la conversation que vous utilisez déjà, et la
        réservation est ajoutée au bon jour. Demandez ce qu’il reste à réserver, et il lit le programme pour répondre.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecter ChatGPT</a> (en anglais) prend une minute.
      </p>
      <p>
        Vos notes Apple arrivent en <a href="/blog/move-from-apple-notes">un seul import sur votre Mac</a> (en anglais), et Notes reste
        tel quel. L’app est en anglais.
      </p>
    </LocalPostPage>
  );
}
