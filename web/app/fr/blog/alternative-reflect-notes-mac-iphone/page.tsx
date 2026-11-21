import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-reflect-notes-mac-iphone");
// Recherche Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative à reflect notes » et
// « alternative reflect application notes » ne donnent aucune suggestion. Titre descriptif, sans estimation de demande.
// Reflect lu le 21 novembre 2026 : https://reflect.academy/moving-to-reflect-open et
// https://reflect.academy/import-export-backups. Faits Pinto selon l'original anglais. Aucun menu Apple Notes cité.
const ui = UI.fr;
const CHECK = `Essai d'import Reflect
- [ ] Lire une longue note entière à côté de l'original
- [ ] Vérifier une note quotidienne et sa date
- [ ] Suivre un lien vers une autre note importée
- [ ] Tester les liens entrants utilisés pour retrouver des notes
- [ ] Comparer les tags et le classement
- [ ] Vérifier un tableau et une liste de pointage
- [ ] Ouvrir images et pièces jointes de l'échantillon
- [ ] Ouvrir les copies sur iPhone
- [ ] Garder le ZIP original et l'accès à Reflect`;
const FAQ = [
  { q: "Faut-il quitter Reflect Classic avant une date limite ?", a: ["Non. Le guide de Reflect, consulté le 21 novembre 2026, indique qu'il n'y a pas de date limite pour passer à Reflect Open."] },
  { q: "Pinto a-t-il un import dédié à Reflect ?", a: ["Non. Essayez l'export ZIP Markdown de Reflect Classic avec l'import général Markdown ou texte de Pinto sur Mac. Ce parcours n'a pas été testé ici avec un nouvel export."] },
  { q: "Les notes quotidiennes et les liens entrants fonctionneront-ils pareil ?", a: ["Ce n'est pas vérifié. Importez une note quotidienne et deux notes liées. Comparez les dates, les liens, les tags et la navigation avant de décider."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="alternative-reflect-notes-mac-iphone"
    intro={<>Pinto Notes est une alternative gratuite à Reflect sur Mac et iPhone pour une édition proche de Notes avec ChatGPT ou Claude connecté. Reflect Open est une autre option. Reflect n'impose aucune date limite pour quitter Classic.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#rester", label: "Garder Reflect" }, { href: "#export", label: "Exporter Classic" }, { href: "#import", label: "Essayer Pinto" }, { href: "#verifier", label: "Vérifier" }, { href: "#ia", label: "Connecter une IA" }]}>
      <p>Choisissez Pinto pour des notes sur Mac et iPhone que ChatGPT ou Claude pourra lire et modifier après connexion. Essayez Reflect Open si vous voulez garder l'organisation Reflect avec des fichiers Markdown dans votre dossier. Pour tester Pinto depuis Classic, exportez un petit échantillon.</p>
      <PostCta slug="fr/alternative-reflect-notes-mac-iphone" path="/fr/blog/alternative-reflect-notes-mac-iphone" position="answer" title="Essayer vos notes Reflect dans Pinto" ui={ui.cta}><p>Téléchargez Pinto gratuitement sur Mac. Importez quelques notes Markdown, comparez les copies, puis connectez ChatGPT ou Claude si vous le souhaitez.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="rester">Quand garder Reflect</h2>
    <p>Gardez Reflect si les notes quotidiennes et les liens entrants vous aident à écrire et à retrouver vos idées. <a href="https://reflect.academy/moving-to-reflect-open">Reflect Open</a> est une app distincte au code public. Elle enregistre chaque note en Markdown dans un dossier que vous choisissez. Son import documenté couvre notamment les notes quotidiennes, liens, liens entrants et tags, mais pas l'historique des notes.</p>
    <p>Vous pouvez continuer sur Classic pendant la comparaison. Pinto ressemble à Notes d'Apple et fonctionne sur Mac et iPhone, sans app Windows ou Android ni version web.</p>
    <h2 id="export">Exporter Reflect Classic en Markdown</h2>
    <p>Le <a href="https://reflect.academy/import-export-backups">guide Reflect</a> propose un ZIP Markdown. L'export propre à Reflect Open vise cette app. Pour Pinto, utilisez le format Markdown général.</p>
    <Steps><li>Dans Reflect Classic, ouvrez les préférences du Graph avec Commande et virgule, puis sélectionnez le Graph dans la barre latérale.</li><li>Choisissez le format Markdown zip, puis Export Reflect.</li><li>Gardez le ZIP original et préparez une copie pour l'essai.</li></Steps>
    <p>Dans la copie extraite, gardez une note quotidienne, une note longue, deux notes liées et une pièce jointe. Préservez leurs dossiers relatifs. Si vous utilisez déjà Reflect Open, copiez quelques fichiers Markdown et leurs pièces jointes depuis votre dossier, sans modifier le Graph de travail.</p>
    <h2 id="import">Utiliser l'import général de Pinto sur Mac</h2>
    <p>Dans Pinto, ouvrez Fichier, choisissez l'import Markdown ou texte et sélectionnez le dossier d'essai. Le <a href="/blog/import-your-notes">guide d'import</a> accepte un dossier ou ZIP de fichiers Markdown ou texte. Chaque sous-dossier devient un dossier.</p>
    <p>Il n'existe pas d'import Reflect dédié. La compatibilité du format ne garantit pas la reprise de l'organisation et de la navigation. Nous n'avons pas testé ici un nouvel export Reflect dans Pinto.</p>
    <h2 id="verifier">Contrôler ce que vous utilisez chaque jour</h2>
    <p>Lisez une copie à côté de son original. Vérifiez les liens, pièces jointes, dates et la manière de retrouver une note quotidienne.</p>
    <Keep title="Vérifier l'essai Reflect" text={CHECK} note="Faites ce contrôle sur l'échantillon avant d'importer la bibliothèque." />
    <p>Un tag repris comme texte n'assure pas le même parcours dans l'app. Gardez Reflect pour ses anciennes versions. Si l'essai convient, importez un lot plus grand et refaites les vérifications. Conservez le ZIP dans tous les cas.</p>
    <h2 id="ia">Travailler avec ChatGPT ou Claude</h2>
    <p><a href="/blog/connect-chatgpt-to-your-notes">Connectez ChatGPT ou Claude</a> à Pinto et choisissez Allow. L'IA peut alors lire et modifier vos notes. Faites résumer le travail ouvert d'une note déjà contrôlée, comparez la réponse, puis demandez l'ajout d'une seule action et vérifiez la modification.</p>
    <p>Pinto garde les versions antérieures créées chez lui. Il ne recrée pas l'historique Reflect. Gardez l'app et l'export sources jusqu'à ce que vos notes importantes aient été vérifiées.</p>
  </LocalPostPage>;
}
