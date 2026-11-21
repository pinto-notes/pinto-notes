import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "applications-notes-ecrivains");

// Version française de /blog/notes-app-for-writers. Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « application écriture écrivain » renvoie « application écriture auteur » ; « app pour écrivain » renvoie « application pour écrivain » et « app pour écrire un livre » ; « application de notes pour écrivains » ne renvoie rien. Titre descriptif.
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/not9474646a9/mac (enregistrement automatique, Fichier > Dupliquer la note), not201900c07/mac (Fichier > Exporter vers, PDF ou Markdown), apde615d29c2/mac (Édition > Ajouter un lien). Autres faits repris de l'article anglais et de ses sources Bear, Obsidian, Ulysses et Scrivener, lues le 21 novembre 2026. Aucun prix ajouté.

const ui = UI.fr;
const ROWS = [
  ["Notes d'Apple", "Idées et courts brouillons", "Dupliquer la note avant une réécriture", "PDF ou Markdown pour la note sélectionnée sur Mac"],
  ["Pinto Notes", "L'allure de Notes avec accès par l'IA", "Historique des versions avec restauration", "Bibliothèque Markdown dans un ZIP ; PDF sur Mac"],
  ["Bear", "Brouillons Markdown avec compteur de mots", "Sauvegardes manuelles de la bibliothèque", "Markdown ; DOCX, PDF et ePub demandent Pro"],
  ["Obsidian", "Recherche reliée aux brouillons", "Instantanés locaux ; historique séparé avec Sync", "Notes déjà stockées en Markdown"],
  ["Ulysses", "Écriture concentrée avec objectifs", "Sauvegardes locales automatiques", "DOCX, PDF, ePub, HTML ou texte"],
  ["Scrivener", "Chapitres et recherches dans un projet", "Snapshots avant les révisions", "Compilation en Word, PDF ou ePub"],
];
const FAQ = [
  { q: "Peut-on écrire un roman dans Notes ?", a: ["Oui. Gardez une note par scène et un sommaire qui les relie. Sur Mac, Fichier > Dupliquer la note crée un brouillon distinct avant une réécriture. Pour des objectifs de mots et l'assemblage des chapitres, comparez Ulysses et Scrivener."] },
  { q: "Quelles apps comptent les mots ?", a: ["Bear affiche le nombre de mots dans son panneau d'informations. Obsidian a une extension principale de comptage. Ulysses et Scrivener ajoutent des objectifs d'écriture."] },
  { q: "Une app de notes suffit-elle pour des articles ?", a: ["Elle peut suffire. Rédigez et exportez un article complet avant de déplacer votre bibliothèque. Vérifiez comment garder les brouillons antérieurs et ouvrir le fichier dans votre outil de publication."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="applications-notes-ecrivains"
    intro="Notes d'Apple convient aux idées et aux courts brouillons. Bear ajoute des statistiques d'écriture, Pinto Notes un historique et un accès par l'IA, Obsidian des fichiers de recherche liés. Pour un manuscrit entier, regardez Ulysses ou Scrivener."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparatif", label: "Comparer les six apps" }, { href: "#apple", label: "Écrire dans Notes" },
      { href: "#pinto", label: "Pinto Notes" }, { href: "#manuscrit", label: "Ulysses et Scrivener" },
      { href: "#essai", label: "Tester un brouillon" },
    ]}>
      <p>Choisissez Notes pour saisir une idée dans l'app déjà installée, Bear pour le Markdown et le nombre de mots, Obsidian pour des recherches liées en fichiers Markdown. Pinto Notes garde les anciennes versions avec l'allure de Notes. Ulysses et Scrivener sont plutôt des apps d'écriture, avec des outils pour les manuscrits.</p>
      <PostCta slug="fr/applications-notes-ecrivains" path="/fr/blog/applications-notes-ecrivains" position="answer" ui={ui.cta} title="Garder les versions de vos brouillons">
        <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Il conserve les versions précédentes. Après connexion, ChatGPT ou Claude peut lire et modifier vos notes.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="comparatif">Six apps pour différents écrits</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Usage</th><th scope="col">Brouillons antérieurs</th><th scope="col">Sortie du texte</th></tr></thead><tbody>{ROWS.map((r) => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>
    <p>Une sauvegarde complète, un instantané de récupération et une copie faite avant de réécrire ne protègent pas le même travail.</p>

    <h2 id="apple">Notes d'Apple pour commencer à écrire</h2>
    <p>Notes enregistre le texte pendant la saisie. Un dossier par projet et une note par scène ou article suffisent pour commencer. Gardez les recherches séparées du brouillon. Les tags et les notes épinglées aident à retrouver le plan.</p>
    <p>Pour créer un sommaire sur Mac, saisissez les titres des scènes dans une note. Sélectionnez un titre, choisissez Édition &gt; Ajouter un lien et trouvez la note correspondante. Avant une grosse réécriture, choisissez Fichier &gt; Dupliquer la note, puis donnez une date et un nom clair à la copie. C'est une conservation manuelle. Le <a href="/blog/apple-notes-version-history">guide sur l'historique de Notes</a> explique ses limites.</p>
    <p>Pour remettre un brouillon à un autre éditeur, sélectionnez la note sur Mac et exportez-la en PDF ou Markdown depuis le menu Fichier. Le <a href="/blog/export-apple-notes-to-markdown">guide d'export Markdown</a> indique quoi vérifier. Pour un objectif de mots ou un livre complet, comparez les apps ci-dessous.</p>

    <h2 id="pinto">Pinto Notes pour les versions et l'IA</h2>
    <p>Pinto Notes ressemble à Notes sur iPhone et Mac, garde les notes en Markdown et conserve l'historique. Sur Mac, ouvrez l'historique des versions depuis le menu Fichier, choisissez une version et restaurez-la. Le texte remplacé reste lui aussi dans une version.</p>
    <Figure shot={SHOTS.history} caption="Historique d'une liste de courses dans Pinto Notes sur Mac, avec un texte antérieur et un bouton pour restaurer cette version. Interface en anglais." />
    <p>Après <a href="/blog/connect-chatgpt-to-your-notes">connexion de ChatGPT ou Claude</a>, l'IA peut lire vos recherches et proposer un plan, puis modifier vos notes. Vérifiez les citations et les faits dans vos sources.</p>
    <p>Sur Mac, l'export de toutes les notes crée un ZIP de fichiers Markdown dans leurs dossiers. Déverrouillez d'abord les notes protégées pour les inclure. Vous pouvez aussi exporter la note ouverte en PDF. Si le destinataire attend un document Word ou un livre numérique, Ulysses et Scrivener proposent directement ces formats.</p>
    <p>Pinto Notes existe seulement sur iPhone et Mac, sans app Windows, Android ou web. Vous pouvez <a href="/blog/move-from-apple-notes">importer Notes sur Mac</a> en une fois. La bibliothèque Apple reste intacte.</p>

    <h2 id="bear">Bear pour le Markdown et le nombre de mots</h2>
    <p>Bear utilise des tags pour organiser les brouillons. Son panneau d'informations affiche le nombre de mots et le temps de lecture estimé. Sur Mac, son mode machine à écrire garde la ligne active au centre. Vous pouvez masquer la barre latérale et la liste pour gagner de la place. Voir son <a href="https://blog.bear.app/2023/07/get-started-with-bear/">guide de démarrage</a> et le <a href="https://bear.app/faq/typewriter-mode/">mode machine à écrire</a>.</p>
    <p>L'export Markdown est gratuit ; DOCX, PDF et ePub demandent Pro. Bear documente des sauvegardes manuelles de la bibliothèque. Restaurer une sauvegarde remplace la bibliothèque courante : ce n'est pas une restauration d'un seul paragraphe. Consultez les <a href="https://bear.app/faq/export-your-notes/">formats d'export</a> et la <a href="https://bear.app/faq/backup-restore/">restauration</a>.</p>

    <h2 id="obsidian">Obsidian pour des recherches liées</h2>
    <p>Obsidian garde les notes comme fichiers Markdown dans un dossier. Reliez une source au brouillon et ouvrez les fichiers dans un autre éditeur si besoin. Son extension principale de comptage affiche mots et caractères de la note active. Voir le <a href="https://obsidian.md/help/data-storage">stockage</a> et le <a href="https://obsidian.md/help/plugins/word-count">compteur</a>.</p>
    <p>La récupération des fichiers garde des instantanés locaux pendant sept jours par défaut. Ils restent sur l'appareil qui les a créés et ne constituent pas une sauvegarde complète. Obsidian Sync a un historique séparé. Consultez les <a href="https://obsidian.md/help/plugins/file-recovery">limites de la récupération</a> et gardez une autre sauvegarde.</p>

    <h2 id="manuscrit">Ulysses et Scrivener pour les textes longs</h2>
    <h3>Ulysses pour les objectifs d'écriture</h3>
    <p>Ulysses est une app d'écriture avec éditeur concentré et projets. Elle convient aux articles et aux manuscrits en sections. Ses <a href="https://help.ulysses.app/goals">objectifs</a> portent sur une feuille, un groupe ou un projet, y compris par jour. Elle <a href="https://help.ulysses.app/export">exporte</a> en DOCX, PDF, ePub, HTML ou texte.</p>
    <p>Ses sauvegardes automatiques restent locales et ne se synchronisent pas entre appareils. Les dossiers externes en sont exclus. Le <a href="https://help.ulysses.app/en_US/backups">guide des sauvegardes</a> explique la restauration.</p>
    <h3>Scrivener pour assembler un manuscrit</h3>
    <p>Scrivener permet d'écrire par sections, de les réordonner et de garder les recherches près du brouillon. Le mode Composition masque le reste de l'interface. Les objectifs de mots peuvent concerner le manuscrit, une section ou une session. Prenez un Snapshot avant de réécrire pour comparer ou retrouver l'ancien texte.</p>
    <p>La fonction Compile assemble les sections en Word, PDF ou ePub. Essayez-la sur un échantillon avant d'y déplacer tout un projet. Le <a href="https://www.literatureandlatte.com/scrivener/overview">site de Scrivener</a> décrit ces outils.</p>

    <h2 id="essai">Tester un brouillon complet</h2>
    <p>Prenez un court texte en cours. Écrivez vingt minutes, modifiez un paragraphe, puis retrouvez sa version antérieure. Exportez le brouillon et ouvrez-le dans l'outil où vous l'enverrez ou le publierez. Vous verrez quelle app convient à votre façon d'écrire.</p>
  </LocalPostPage>;
}
