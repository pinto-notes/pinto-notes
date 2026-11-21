import { Figure } from "@/lib/blog";
import { MCP_URL } from "@/lib/facts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("fr", "meilleures-applications-notes-mcp");

// Version française de /blog/best-notes-apps-with-mcp. Google autocomplete hl=fr, gl=fr, 21 novembre 2026 : « application notes mcp » renvoie « notes app mcp » ; « notes app mcp » renvoie « apple notes app mcp », « bear notes app mcp », « mac notes app mcp ». « meilleure application de notes mcp » ne renvoie rien. Titre descriptif français.
// Apple, lu le 21 novembre 2026 : support.apple.com/fr-fr/guide/notes/apd441e46563/mac, guide de Notes avec iCloud, listes de pointage, tableaux et fichiers ; aucune configuration MCP officielle trouvée dans ce guide. Pas de menu Apple à nommer.
// Autres faits repris de l'article anglais : bear.app/faq/command-line-interface/, obsidian.md/help/data-storage, community.obsidian.md/plugins/obsidian-local-rest-api, notion.com/help/notion-mcp, developers.notion.com/guides/mcp/overview, notesnook.com/help/, github.com/streetwriters/notesnook/discussions/10571 et standardnotes.com/help, lus le 21 novembre 2026. Les connexions tierces n'ont pas été testées.

const ui = UI.fr;
const ROWS = [
  { app: "Pinto Notes", route: "Serveur MCP hébergé officiel", use: "Chercher, lire, créer et modifier des notes. Vous autorisez chaque app d'IA.", fit: "L'allure de Notes sur iPhone et Mac, avec accès par l'IA depuis ailleurs.", limit: "App réservée aux appareils Apple. Le serveur fonctionne sans laisser le Mac allumé." },
  { app: "Obsidian", route: "Extension MCP communautaire", use: "API REST locale avec MCP pour chercher, lire et écrire, y compris dans une section.", fit: "Bibliothèque locale de fichiers Markdown modifiables avec d'autres outils.", limit: "L'extension fonctionne dans Obsidian sur votre ordinateur. Elle vient d'Adam Coddington, pas d'Obsidian." },
  { app: "Bear", route: "Serveur MCP local officiel", use: "bearcli permet à l'IA de chercher, lire, créer et modifier des notes.", fit: "Conserver sa bibliothèque Bear avec un client d'IA local.", limit: "Mac et Bear 2.8 ou plus récent. Les notes chiffrées sont exclues." },
  { app: "Notesnook", route: "Essai communautaire, pas de configuration officielle trouvée", use: "Un auteur a annoncé un pont local dans les discussions du projet.", fit: "Notes open source avec carnets, tags et capture web.", limit: "Pont expérimental et non officiel. L'aide consultée ne décrit pas de connexion MCP prise en charge." },
  { app: "Notion", route: "Serveur MCP hébergé officiel", use: "Chercher dans l'espace, créer et modifier des pages, gérer les bases de données.", fit: "Notes liées aux documents et projets d'une équipe.", limit: "La connexion utilise les droits de votre compte Notion." },
  { app: "Notes d'Apple", route: "Pas de configuration MCP officielle dans le guide consulté", use: "Le guide explique Notes, sans connexion MCP.", fit: "Notes iCloud avec listes de pointage, tableaux et fichiers sur appareils Apple.", limit: "Aucune voie MCP créée par Apple trouvée dans la documentation vérifiée." },
];
const FAQ = [
  { q: "Quelles apps documentent leur propre serveur MCP ?", a: ["Pinto Notes et Notion ont un serveur hébergé. Bear documente un serveur local sur Mac. L'extension Obsidian et l'essai Notesnook cités ici viennent de la communauté. Nous n'avons pas testé les connexions des autres apps."] },
  { q: "La connexion MCP de Bear fonctionne-t-elle sur iPhone ?", a: ["Non. Bear indique que sa CLI, son connecteur Claude et son serveur MCP fonctionnent uniquement sur Mac avec Bear 2.8 ou plus récent. Le connecteur demande l'app Claude de bureau."] },
  { q: "Notesnook propose-t-il officiellement MCP ?", a: ["L'aide Notesnook consultée le 21 novembre 2026 ne documente pas de configuration officielle. Un membre de la communauté a présenté un pont local expérimental, que nous n'avons pas testé."] },
  { q: "Standard Notes documente-t-il une connexion MCP ?", a: ["L'index d'aide consulté le 21 novembre 2026 n'en décrit aucune. Cela ne prouve pas qu'aucun projet communautaire n'existe ; nous n'avons pas testé une telle connexion."] },
];

export default function Page() {
  return <LocalPostPage lang="fr" slug="meilleures-applications-notes-mcp"
    intro="Pinto Notes et Notion ont un serveur MCP hébergé. Bear propose un serveur local officiel sur Mac. Obsidian a une extension communautaire ; Notesnook, un essai communautaire. Le guide de Notes d'Apple ne décrit pas de connexion MCP."
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparatif", label: "Les six apps" }, { href: "#heberge", label: "Connexions hébergées" },
      { href: "#local", label: "Connexions locales" }, { href: "#apple", label: "Notes d'Apple" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Choisissez Pinto Notes pour une app proche de Notes dont le MCP hébergé permet à ChatGPT ou Claude de lire et modifier vos notes. Notion convient à un espace d'équipe, Bear à votre bibliothèque Bear sur Mac. L'extension Obsidian vise des fichiers Markdown locaux. Examinez le pont expérimental de Notesnook avant de l'adopter.</p>
      <PostCta slug="fr/meilleures-applications-notes-mcp" path="/fr/blog/meilleures-applications-notes-mcp" position="answer" ui={ui.cta} title="Vos notes accessibles à votre IA">
        <p>Pinto Notes fonctionne comme Notes sur iPhone et Mac. Son MCP hébergé permet à ChatGPT ou Claude de chercher, lire et modifier vos notes. Vous pouvez annuler les changements et retrouver les versions précédentes.</p>
      </PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="comparatif">Six apps de notes et leur accès MCP</h2>
    <p>MCP signifie Model Context Protocol. Ce protocole permet à une app d'IA compatible d'utiliser des outils pour travailler sur vos notes. Ce tableau reprend les documentations vérifiées le 21 novembre 2026. Nous publions Pinto Notes et n'avons pas testé les connexions des autres apps.</p>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Connexion</th><th scope="col">Fonctions documentées</th><th scope="col">Pour qui</th><th scope="col">À savoir</th></tr></thead>
      <tbody>{ROWS.map((row) => <tr key={row.app}><th scope="row">{row.app}</th><td>{row.route}</td><td>{row.use}</td><td>{row.fit}</td><td>{row.limit}</td></tr>)}</tbody></table></div>

    <h2 id="heberge">Pinto Notes et Notion : des serveurs hébergés</h2>
    <p>Un serveur MCP hébergé donne à une app d'IA compatible une adresse à joindre sur Internet. Vous autorisez la connexion, puis l'IA utilise les outils proposés. L'adresse de Pinto Notes est <code>{MCP_URL}</code>. Vous autorisez chaque app d'IA ; les changements peuvent être annulés et les anciennes versions restent accessibles.</p>
    <p>Le <a href="https://developers.notion.com/guides/mcp/get-started-with-mcp">serveur officiel de Notion</a> est à <code>https://mcp.notion.com/mcp</code>. Ses <a href="https://developers.notion.com/guides/mcp/overview">outils documentés</a> cherchent dans l'espace de travail, modifient les pages et gèrent les bases de données. La connexion respecte les droits déjà associés à votre compte.</p>

    <h2 id="local">Bear et Obsidian : des connexions locales</h2>
    <p>Bear fournit son propre serveur. Son <a href="https://bear.app/faq/command-line-interface/">guide MCP</a> décrit <code>bearcli mcp-server</code>, fourni avec Bear pour Mac. Son connecteur Claude s'installe depuis l'aide de Bear, dans les options avancées. Les deux utilisent la base locale. Bear documente aussi des filtres par tag. Les notes chiffrées ne sont ni lues ni modifiées par ces outils.</p>
    <p>Obsidian garde un <a href="https://obsidian.md/help/data-storage">dossier de fichiers Markdown</a>. Son répertoire communautaire liste l'extension <a href="https://community.obsidian.md/plugins/obsidian-local-rest-api">Local REST API with MCP</a> d'Adam Coddington. Elle ajoute un serveur local avec clé API et peut modifier une section ou un bloc. Obsidian et l'ordinateur doivent rester ouverts pour cette voie. Le <a href="/blog/obsidian-mcp">comparatif MCP d'Obsidian</a> décrit aussi d'autres approches.</p>

    <h2 id="notesnook">Notesnook : un essai communautaire</h2>
    <p><a href="https://notesnook.com/">Notesnook</a> est open source, avec carnets, tags et outil de capture web. Son <a href="https://notesnook.com/help/">aide</a> ne documentait pas de configuration MCP officielle lors de cette vérification. Un auteur communautaire a annoncé un <a href="https://github.com/streetwriters/notesnook/discussions/10571">pont local expérimental</a> dans le dépôt du projet. Il le présente comme non officiel. Nous ne l'avons pas testé. Lisez ses exigences actuelles avant d'essayer.</p>

    <h2 id="apple">Et Notes d'Apple ?</h2>
    <p>Notes permet d'utiliser iCloud, des listes de pointage, des tableaux et des fichiers. Le <a href="https://support.apple.com/fr-fr/guide/notes/apd441e46563/mac">guide Apple</a> explique ces fonctions, sans documenter de serveur MCP. Nous n'avons trouvé aucune configuration créée par Apple dans les pages consultées. Un résultat de recherche « Apple Notes MCP » peut désigner un projet communautaire dont ce tableau ne vérifie pas les capacités.</p>

    <h2 id="pinto">Pinto Notes et l'allure de Notes</h2>
    <p>Pinto Notes existe sur iPhone et Mac, sans app Windows, Android ni web. Son serveur hébergé permet à ChatGPT et Claude d'utiliser vos notes sans laisser votre Mac allumé. Claude Code et Codex peuvent aussi s'y connecter. Le <a href="/blog/mcp-server">guide MCP de Pinto Notes</a> détaille les outils et l'autorisation.</p>
    <Figure shot={SHOTS.aiEdit} caption="ChatGPT a ajouté cinq lignes à une liste de courses dans Pinto Notes sur Mac. Les changements sont colorés et peuvent être annulés." />
    <p>L'IA peut chercher, lire, créer et modifier des notes. Vous voyez ses changements et pouvez revenir à une version antérieure. Vous pouvez <a href="/blog/move-from-apple-notes">importer Notes sur Mac</a> ; la bibliothèque d'origine ne change pas.</p>
  </LocalPostPage>;
}
