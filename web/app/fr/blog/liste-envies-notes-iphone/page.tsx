import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "liste-envies-notes-iphone");
// Autocomplete hl=fr, gl=fr, 21 novembre 2026 : « liste d envies » propose « liste d envies », « liste d envies anniversaire » et « liste d'envies noel » ; la requête avec Notes iPhone ne renvoie rien. « Liste d'envies » est le mot local retenu.
// Apple, lu le 21 novembre 2026 : https://support.apple.com/fr-fr/guide/notes/not9474646a9/mac (Édition > Coller), https://support.apple.com/fr-fr/guide/notes/apd93c815aa0/mac (liste), https://support.apple.com/fr-fr/guide/notes/apd0a136b9cc/mac (tableau), https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios (Nouvelle note, Format, Liste de vérification, Ajouter un tableau). Les pages Mac des listes et tableaux renvoient 429 dans le lecteur ; leurs gestes sont décrits sans nom de bouton incertain. Faits suivis de /blog/apple-notes-wishlist-template.
const ui = UI.fr;
const TEMPLATE = `Ma liste d'envies

Prochain bilan : 28 novembre 2026
Règle : attendre au moins sept jours. Revérifier le prix avant l'achat.

Lampe de bureau à bras articulé
Lien : https://example.com/lampe-bureau
Prix vu : 65 €, livraison comprise
Vu le : 21 novembre 2026
Raison : le plafonnier laisse mon bureau dans l'ombre après le coucher du soleil.
Attendre jusqu'au : 28 novembre 2026
Décision : en attente. Mesurer la place à côté de l'écran.

Moulin à café manuel
Lien : https://example.com/moulin-cafe
Prix vu : 95 €, livraison comprise
Vu le : 20 novembre 2026
Raison : essayer le café fraîchement moulu le week-end.
Attendre jusqu'au : 27 novembre 2026
Décision : en attente. Emprunter un moulin pour un week-end.

Support pour ordinateur portable
Lien : https://example.com/support-ordinateur
Prix vu : 39 €, livraison comprise
Vu le : 12 novembre 2026
Raison : surélever l'écran pendant les appels vidéo.
Attendre jusqu'au : 19 novembre 2026
Décision : renoncer, 21 novembre. Les livres sous l'ordinateur font déjà l'affaire.

Avant de décider
Mesurer la place sur le bureau pour la lampe.
Emprunter un moulin à café pour le week-end.
`;
const TABLE = `Objet\tAttendre jusqu'au / décision
Lampe de bureau\t28 nov. 2026 / En attente, mesurer le bureau
Moulin à café\t27 nov. 2026 / En attente, en emprunter un
Support d'ordinateur\t19 nov. 2026 / Renoncer, les livres suffisent
`;
const FAQ = [
  { q: "Comment faire une liste d'envies dans Notes ?", a: ["Collez ce modèle dans une note. Pour chaque achat possible, gardez le lien, le prix daté, la raison, la date de réexamen et la décision. Ajoutez les vérifications à faire avant de payer."] },
  { q: "Tableau ou liste à cocher ?", a: ["Un tableau résume dates et décisions. Gardez les raisons et liens dans les fiches détaillées. Une liste à cocher sert aux gestes à faire avant l'achat."] },
  { q: "Que noter avant d'acheter ?", a: ["Ce que l'objet apporterait, ce que vous utilisez déjà, le prix avec livraison et la date du prochain choix. À cette date, notez acheter, attendre ou renoncer avec une raison."] },
];
export default function Page() {
  return <LocalPostPage lang="fr" slug="liste-envies-notes-iphone"
    intro={<>Gardez vos achats envisagés dans une liste d'envies Notes, avec liens, prix datés et raisons. Une date de réexamen laisse le temps de décider avant de payer.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{ href: "#modele", label: "Copier le modèle" }, { href: "#preparer", label: "Préparer la note" }, { href: "#bilan", label: "Revoir la liste" }, { href: "#limites", label: "Les limites" }, { href: "#pinto", label: "Revoir avec une IA" }]}>
      <p>Gardez une fiche par objet, avec lien, prix, date, raison, délai et décision. Une liste de vérifications vous aide à voir ce qu'il reste à faire avant l'achat.</p>
      <PostCta slug="fr/liste-envies-notes-iphone" path="/fr/blog/liste-envies-notes-iphone" position="answer" title="Revoir votre liste avec ChatGPT" ui={ui.cta}><p>Pinto Notes fonctionne comme Notes sur Mac et iPhone. Une fois connecté et autorisé, ChatGPT ou Claude peut lire la liste et modifier les notes de bilan à votre demande.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="modele">Un exemple avec deux achats en attente</h2>
    <p>Les prix en euros sont fictifs et les liens example.com servent d'exemples. Remplacez-les par les pages exactes, livraison comprise. Le troisième objet a déjà été écarté.</p>
    <Keep title="Liste d'envies pour Notes" text={TEMPLATE} note="Collez comme texte simple. Les deux dernières lignes peuvent devenir une liste à cocher." />
    <p>Écrivez la raison avant d'ajouter un objet. « Le bureau est sombre le soir » se vérifie. « C'est joli » peut aussi être une raison, mais sachez laquelle vous motive. Pour des achats destinés à d'autres personnes, utilisez la <a href="/fr/blog/liste-idees-cadeaux-notes-iphone">liste d'idées cadeaux</a>.</p>
    <h2 id="preparer">Préparer la note sur Mac ou iPhone</h2>
    <MenuPaths rows={[{ on: "Mac", steps: ["Édition", "Coller"] }, { on: "Mac", steps: ["Sélectionner les deux dernières lignes", "Créer une liste à cocher"] }, { on: "iPhone", steps: ["Nouvelle note", "Saisir le texte"] }]} />
    <p>Sur Mac, créez une note et choisissez Édition, Coller. Sélectionnez les deux gestes sous Avant de décider et transformez-les en liste à cocher. Cocher une vérification ne veut pas dire que l'objet a été acheté.</p>
    <p>Sur iPhone, touchez Nouvelle note. Sélectionnez chaque nom d'objet, touchez Format et choisissez un style de titre. Sous Avant de décider, touchez Liste de vérification et saisissez chaque geste. Retour ajoute une ligne, comme l'explique le <a href="https://support.apple.com/fr-fr/guide/iphone/iph1ac0b3a2/ios">guide Apple</a>.</p>
    <h3>Un tableau facultatif pour le prochain bilan</h3>
    <p>Si la liste grandit, gardez les fiches détaillées et ajoutez cette vue courte.</p>
    <Keep title="Tableau récapitulatif" text={TABLE} note="Chaque ligne contient une tabulation entre l'objet et sa date ou décision. Collez ce bloc sous les fiches." />
    <p>Sur Mac, collez et sélectionnez les quatre lignes, puis transformez-les en tableau. Chaque tabulation sépare deux colonnes. Vous pouvez aussi créer un tableau vide et remplir les cellules ; Tabulation dans la dernière en ajoute une ligne. Sur iPhone, touchez Ajouter un tableau. Le <a href="/blog/apple-notes-tables">guide des tableaux</a> donne d'autres exemples. Mettez ce résumé à jour avec les fiches, ou omettez-le.</p>
    <h2 id="bilan">Décider après le délai de réflexion</h2>
    <p>Sept jours ne sont qu'un exemple. Une nécessité cassée peut demander une réponse rapide ; un loisir coûteux peut attendre davantage. Relisez la raison et le prix actuel. Mesurez la place pour la lampe et essayez le moulin emprunté. Notez acheter, attendre ou renoncer, avec la date et la raison. Si vous attendez, fixez une nouvelle date.</p>
    <p>Gardez les objets écartés pour retrouver pourquoi vous aviez renoncé. Si vous achetez, notez le montant réellement payé et la date.</p>
    <h2 id="limites">Ce que la note ne suit pas</h2>
    <p>Le prix est celui que vous avez vu. Revérifiez la boutique avant l'achat. La note ne surveille ni prix ni stock et n'envoie pas de rappel à la date écrite. Créez une alerte séparée si nécessaire. Pour quelques objets, tenir ces décisions à la main peut suffire.</p>
    <h2 id="pinto">Revoir la même liste avec ChatGPT ou Claude</h2>
    <p>Pinto Notes propose titres, liens et listes à cocher. <a href="/blog/connect-chatgpt-to-your-notes">Connectez ChatGPT ou Claude</a>, puis choisissez Allow : cette autorisation donne accès à la lecture et à la modification des notes.</p>
    <p>Demandez : « Lis Ma liste d'envies. Ajoute une section À revoir aujourd'hui avec les objets dont le délai est passé. Utilise seulement les prix et raisons déjà inscrits. Ne change pas mes décisions et indique les vérifications encore ouvertes. » Vérifiez les dates et les prix vous-même avant de décider. Vos notes Apple arrivent par <a href="/blog/move-from-apple-notes">un import sur Mac</a>, sans changer les originaux.</p>
  </LocalPostPage>;
}
