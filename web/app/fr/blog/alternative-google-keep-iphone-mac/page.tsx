import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "alternative-google-keep-iphone-mac");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « alternative google keep » propose « alternative google keep », « equivalent google keep » et « alternative google keep open source ». La version « iphone mac » ne renvoie rien. Le titre précise les appareils réellement couverts.
// Aucun menu d'Apple Notes n'est donné dans cet article. Faits et limites des autres apps suivis de /blog/google-keep-alternative-for-iphone-and-mac, dont les sources Google sont liées ci-dessous. Le menu Fichier de Pinto est décrit comme dans le post anglais ; aucun nom de menu Apple n'est inventé.
const ui = UI.fr;
const CHECK = `Vérifier le passage de Google Keep à Pinto Notes
- [ ] Comparer une longue note à l'original dans Keep
- [ ] Vérifier les éléments cochés et non cochés
- [ ] Ouvrir une image importée
- [ ] Vérifier une note avec deux libellés
- [ ] Comparer une note épinglée et ses dates
- [ ] Vérifier les archives si j'ai choisi de les importer
- [ ] Noter le sens que je donnais aux couleurs
- [ ] Sauvegarder séparément les dessins importants
- [ ] Recréer les rappels nécessaires dans une app d'alertes
- [ ] Garder les listes partagées dans Keep jusqu'à l'accord de tous
- [ ] Conserver le téléchargement Takeout d'origine`;
const FAQ = [
  { q: "Pinto importe-t-il les libellés Keep comme dossiers ?", a: ["Oui, par défaut. Le premier libellé devient le dossier, les autres des tags. Vous pouvez choisir de convertir tous les libellés en tags. Vérifiez une note avec plusieurs libellés."] },
  { q: "Les couleurs et rappels Keep sont-ils importés ?", a: ["Non. L'import laisse de côté couleurs, dessins et rappels. Le bilan signale les notes concernées. Gardez l'export et recréez les alertes nécessaires."] },
  { q: "L'import maintient-il les deux apps synchronisées ?", a: ["Non. Pinto importe une copie. Les changements ultérieurs ne passent pas d'une app à l'autre, et les droits des collaborateurs ne suivent pas."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="alternative-google-keep-iphone-mac"
    intro={<>Pinto Notes est une alternative gratuite à Google Keep sur iPhone et Mac, avec import direct depuis Google Takeout. Gardez Keep si vous utilisez Android ou des listes Google partagées.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#choix", label: "Choisir" }, { href: "#rester", label: "Garder Keep" }, { href: "#contenu", label: "Ce qui passe" }, { href: "#import", label: "Importer" }, { href: "#verifier", label: "Vérifier" }]}>
      <p>Choisissez Pinto si vous voulez un éditeur proche de Notes sur Mac et iPhone. L'import récupère textes, listes, images, libellés, épingles et dates. Il laisse couleurs, dessins et rappels de côté.</p>
      <PostCta slug="fr/alternative-google-keep-iphone-mac" path="/fr/blog/alternative-google-keep-iphone-mac" position="answer" title="Essayer vos notes Keep dans Pinto" ui={ui.cta}><p>Téléchargez Pinto Notes sur Mac et importez votre archive Google Keep. Après connexion, ChatGPT ou Claude peut lire et modifier ces notes.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="choix">Choisir selon les notes que vous utilisez</h2>
    <p>Pinto fonctionne comme Notes d'Apple et convient aux notes personnelles, surtout si vous souhaitez y faire travailler ChatGPT ou Claude. Il existe sur Mac et iPhone, sans app Windows ou Android ni version web. Si vous avez besoin du navigateur, Keep en propose un.</p>
    <p>Notes d'Apple offre aussi dossiers, listes et tableaux. Voyez <a href="/fr/blog/notes-iphone-vs-google-keep">Notes ou Google Keep</a> pour les comparer. Si votre choix est déjà Notes, suivez le <a href="/fr/blog/google-keep-vers-notes-iphone">guide de transfert depuis Keep</a>. La suite concerne l'import direct dans Pinto.</p>
    <h2 id="rester">Quand garder Google Keep</h2>
    <p>Keep existe sur iPhone, Android et dans un navigateur, comme le confirme le <a href="https://support.google.com/keep/answer/2888240?hl=en">guide Google</a>. Pinto ne remplacera pas Keep sur un téléphone Android. Les collaborateurs peuvent aussi modifier une <a href="https://support.google.com/keep/answer/6101196?hl=en">note Keep partagée</a>. Importer une copie dans Pinto ne transfère pas ces autorisations. Vous pouvez déplacer vos notes personnelles et garder la liste commune dans Keep jusqu'à une décision collective.</p>
    <h2 id="contenu">Ce que Pinto garde de Takeout</h2>
    <p>Le <a href="https://support.google.com/keep/answer/10017039?hl=en">guide d'export Google</a> décrit le contenu téléchargé. L'app de destination choisit ce qu'elle peut reprendre.</p>
    <div className="tableWrap"><table><thead><tr><th scope="col">Dans Keep</th><th scope="col">Après import dans Pinto</th></tr></thead><tbody>
      <tr><th scope="row">Texte et listes</th><td>Texte et état coché ou non coché</td></tr><tr><th scope="row">Libellés</th><td>Dossiers par défaut, ou tags au choix</td></tr><tr><th scope="row">Épingles et dates</th><td>État épinglé et dates de création ou modification disponibles</td></tr><tr><th scope="row">Images</th><td>Pièces jointes si leurs fichiers sont dans l'archive</td></tr><tr><th scope="row">Notes archivées</th><td>Exclues par défaut ; import facultatif dans un dossier Archives</td></tr><tr><th scope="row">Corbeille</th><td>Ignorée</td></tr><tr><th scope="row">Couleurs, dessins, rappels</th><td>Omis ; le bilan signale les notes concernées</td></tr><tr><th scope="row">Droits des collaborateurs</th><td>Non transférés</td></tr>
    </tbody></table></div>
    <p>Avec l'option Dossiers, le premier libellé devient le dossier et les autres des tags. Avec Tags, tous deviennent des tags. Une note « Maison » et « Travaux » va dans Maison avec le tag Travaux si Maison vient en premier. Si le rouge signifie urgent pour vous, écrivez-le dans les notes importantes avant de partir. Sauvegardez les dessins utiles et recréez les rappels. Une liste importée ne garde pas l'alerte associée.</p>
    <h2 id="import">Importer sur Mac</h2>
    <p>Dans Pinto Notes sur Mac, ouvrez Fichier et choisissez Google Keep. Pinto ouvre la page de téléchargement Google avec Keep déjà sélectionné. Déposez l'archive téléchargée. Le <a href="/blog/import-your-notes">guide d'import</a> montre le point de départ.</p>
    <p>Dans Takeout, choisissez l'étape suivante, un export unique au format ZIP, puis créez l'export. Téléchargez-le à la réception du courriel. Selon <a href="https://support.google.com/accounts/answer/3024190">Google</a>, sa préparation peut prendre de quelques minutes à quelques jours ; le téléchargement ne supprime pas vos données Google.</p>
    <p>Pinto accepte le ZIP, le dossier Takeout extrait ou son dossier Keep. Dans un dossier extrait, gardez les images avec les fichiers des notes. Choisissez Dossiers ou Tags pour les libellés et décidez si vous voulez les archives. Lisez le bilan d'import.</p>
    <h2 id="verifier">Comparer les notes utiles</h2>
    <p>Comparez une longue note, une liste déjà cochée, une image et plusieurs libellés avec leurs originaux. Le seul nombre de notes ne suffit pas.</p>
    <Keep title="Vérifications après l'import Keep" text={CHECK} note="Copiez cette liste près de votre archive. Vérifiez vos notes avant de quitter Keep." />
    <p>Il s'agit d'une copie exportée, sans synchronisation continue. Une fois satisfait, choisissez dans quelle app modifier chaque note pour éviter deux versions divergentes.</p>
    <h2 id="pinto">Faire travailler une IA sur les notes importées</h2>
    <p>Après avoir <a href="/blog/connect-chatgpt-to-your-notes">connecté ChatGPT ou Claude</a> et choisi Allow, l'IA peut lire et modifier les notes Pinto. Demandez-lui de retrouver une note de projet et de proposer des étapes, puis vérifiez les dates et tâches. Pinto garde les versions créées après l'import, pas les anciennes versions de Keep.</p>
  </LocalPostPage>;
}
