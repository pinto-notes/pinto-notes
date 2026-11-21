import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "bloc-code-notes-iphone");

// Version française de /blog/apple-notes-code-block. Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « notes iphone code » renvoie « iphone notes code block », « apple notes code block » ; « bloc code notes apple » renvoie « code block apple notes ».
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd46c25187e/mac (Monostyle, Maj + Commande + M ; Bloc de citation, Commande + ' ; Corps, Maj + Commande + B), /guide/notes/apd1955d3b21/mac (bouton Format, styles), /guide/iphone/iph1ac0b3a2/ios (commande de mise en forme). Le guide iPhone ne nomme pas les deux styles : la sélection y est décrite sans inventer de libellé. Le guide anglais des nouveautés iOS 17 établit le passage de Monospaced à Monostyled.
// Les guides consultés ne documentent ni commande Code Block ni coloration syntaxique. Faits Pinto repris de l'article anglais.

const ui = UI.fr;
const SNIPPET = `{
  "timeoutSeconds": 30,
  "retryCount": 2
}`;
const FAQ = [
  { q: "Quel format se rapproche d'un bloc de code dans Notes ?", a: ["Monostyle. Il utilise une police à chasse fixe et distingue le passage du reste de la note. Les guides Apple consultés ne décrivent pas de commande Bloc de code ni de coloration selon le langage."] },
  { q: "Quel raccourci Mac utiliser ?", a: ["Sélectionnez le code et appuyez sur Maj + Commande + M pour Monostyle. Commande + apostrophe applique Bloc de citation et Maj + Commande + B applique Corps. Les raccourcis peuvent varier selon le clavier."] },
  { q: "Pourquoi un ancien guide parle-t-il de Monospaced ?", a: ["Apple a renommé et modifié ce format dans iOS 17. Dans le guide français actuel sur Mac, son nom est Monostyle."] },
  { q: "Bloc de citation colore-t-il le code ?", a: ["Non. Apple le décrit comme un style pour isoler une citation. Ses guides ne documentent pas de coloration syntaxique pour ce style."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="bloc-code-notes-iphone"
    intro="Pour garder un extrait de code dans Notes, utilisez le format Monostyle. Apple documente aussi le Bloc de citation, mais ses guides ne décrivent ni bloc de code dédié ni coloration syntaxique."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Sur Mac" }, { href: "#iphone", label: "Sur iPhone" },
      { href: "#citation", label: "Bloc de citation" }, { href: "#limites", label: "Les limites" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Sur Mac, sélectionnez votre code et appuyez sur Maj + Commande + M. Sur iPhone, sélectionnez le passage et ouvrez les commandes de mise en forme. Le résultat sépare visuellement l'extrait, sans coloration propre à Python ou à un autre langage.</p>
      <PostCta slug="fr/bloc-code-notes-iphone" path="/fr/blog/bloc-code-notes-iphone" position="answer" ui={ui.cta} title="Un vrai bloc de code dans la note">
        <p>Dans Pinto Notes sur iPhone et Mac, le menu / propose Code Block et Callout. L'app ressemble à Notes.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="mac">Mettre en forme un extrait sur Mac</h2>
    <p>Monostyle utilise une police à chasse fixe, un retrait et un fond distinct. Il convient à une courte commande ou à un exemple de configuration.</p>
    <Steps>
      <li><strong>Collez l'extrait.</strong> Gardez l'explication au-dessus ou au-dessous pour sélectionner le code seul.</li>
      <li><strong>Appliquez Monostyle.</strong> Sélectionnez le code, puis utilisez le bouton Format ou Maj + Commande + M.</li>
      <li><strong>Revenez à Corps.</strong> Sélectionnez l'explication et appuyez sur Maj + Commande + B.</li>
    </Steps>
    <MenuPaths rows={[{ on: "Mac, code", steps: ["Format", "Monostyle"], keys: "⇧⌘M" }, { on: "Mac, texte", steps: ["Format", "Corps"], keys: "⇧⌘B" }]} />
    <p>Ces raccourcis figurent dans le <a href="https://support.apple.com/fr-fr/guide/notes/apd46c25187e/mac">guide Apple des raccourcis de Notes</a>. Ils peuvent changer avec la langue et la disposition du clavier. Les styles de paragraphe sur Mac demandent des notes iCloud ou des notes stockées sur le Mac.</p>
    <Keep title="Un petit extrait à essayer" text={SNIPPET} code note="Collez-le dans Notes, sélectionnez-le et appliquez Monostyle. L'affichage sur cette page ne reproduit pas celui de Notes." />

    <h2 id="iphone">Mettre en forme le code sur iPhone</h2>
    <p>Dans la note, sélectionnez l'extrait puis touchez le bouton de mise en forme. Faites défiler les styles proposés et choisissez celui à chasse fixe si votre version l'affiche. Le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide Apple pour iPhone</a> explique l'accès aux commandes, sans nommer ce style sur cette page. Sur Mac, le nom vérifié est Monostyle.</p>
    <p>Les anciens conseils parlent parfois de Monospaced. Le <a href="https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf">document Apple sur iOS 17</a> explique le changement de nom et de présentation.</p>

    <h2 id="citation">Réserver le Bloc de citation aux citations</h2>
    <p>Bloc de citation isole un passage par une barre. Servez-vous-en pour une phrase reprise d'une documentation, avec votre commentaire en dehors du bloc. Pour un extrait de code, préférez Monostyle.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Bloc de citation"], keys: "⌘'" }]} />
    <p>Le <a href="https://support.apple.com/fr-fr/guide/notes/apd1955d3b21/mac">guide de mise en forme sur Mac</a> classe le Bloc de citation parmi les styles. Retrouvez d'autres façons d'organiser une note dans les <a href="/fr/blog/astuces-notes-iphone">astuces pour Notes</a>.</p>

    <h2 id="limites">Ce que le format ne fait pas</h2>
    <p>Les pages Apple consultées ne documentent ni commande Bloc de code ni coloration qui reconnaît les mots clés d'un langage. Le surlignage manuel de texte est une autre fonction. Gardez une copie exécutable dans votre projet et utilisez la note pour expliquer l'extrait.</p>

    <h2 id="pinto">Code Block et Callout dans Pinto Notes</h2>
    <p>Sur iPhone et Mac, saisissez / au début d'une ligne dans Pinto Notes. Choisissez Code Block pour l'extrait ou Callout pour un avertissement. Claude Code et Codex peuvent aussi lire et modifier vos notes après connexion. Le <a href="/blog/notes-in-claude-code-and-codex">guide de connexion</a> donne les étapes.</p>
    <p>Vous pouvez <a href="/blog/move-from-apple-notes">importer vos notes Apple sur Mac</a> en une fois. Les notes d'origine ne changent pas.</p>
  </LocalPostPage>;
}
