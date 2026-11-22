import { Figure } from "@/lib/blog";
import { MCP_URL } from "@/lib/facts";
import { PostCta } from "@/lib/PostCta";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "melhor-app-de-notas-com-mcp");

// Versão pt-BR de /blog/best-notes-apps-with-mcp, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "melhor app de notas com mcp", "app de notas mcp",
// "notas mcp" e "mcp notas" não deram sugestões. O título usa a pergunta direta, sem alegar volume de busca.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/get-started-apd441e46563/mac
// (iCloud, checklists, tabelas e mídia; o guia não documenta MCP). Não há passos de menu da Apple neste post.
// As capacidades dos outros apps seguem as fontes e os limites do original em inglês; não foram testadas aqui.
const ui = UI.pt;
const ROWS = [
  { app: "Pinto Notes", route: "Servidor MCP oficial hospedado", use: "Buscar, ler, criar e editar notas. Você autoriza cada app de IA.", fit: "Jeito do Notas no iPhone e no Mac, com acesso por IA em outro lugar.", limit: "App de notas só para Apple. O servidor hospedado funciona sem deixar o Mac ligado." },
  { app: "Obsidian", route: "Plugin MCP da comunidade", use: "Local REST API com MCP busca, lê e escreve, inclusive em uma seção específica.", fit: "Biblioteca de arquivos Markdown locais, editáveis com outras ferramentas.", limit: "O plugin roda dentro do Obsidian no computador. É de Adam Coddington, não do Obsidian." },
  { app: "Bear", route: "Servidor MCP local oficial", use: "O bearcli incluído no Bear permite buscar, ler, criar e editar notas.", fit: "Usar a biblioteca atual do Bear com um cliente local de IA.", limit: "Só no Mac, com Bear 2.8 ou posterior. As ferramentas não leem nem alteram notas criptografadas." },
  { app: "Notesnook", route: "Experimento da comunidade; sem configuração oficial encontrada", use: "Um autor da comunidade anunciou uma ponte local nas discussões do Notesnook.", fit: "Notas de código aberto, com cadernos, etiquetas e recorte de páginas web.", limit: "A ponte é experimental e não oficial. A ajuda consultada não documenta uma conexão MCP compatível." },
  { app: "Notion", route: "Servidor MCP oficial hospedado", use: "Buscar no espaço de trabalho, criar e editar páginas e gerenciar bancos de dados.", fit: "Notas junto dos documentos e bancos de dados de projetos de uma equipe.", limit: "A conexão usa suas permissões do Notion. Confira o que sua conta pode acessar." },
  { app: "Notas", route: "Sem configuração MCP oficial no guia do Notas", use: "O guia da Apple explica o uso do Notas, sem uma conexão MCP.", fit: "Notas com iCloud, checklists, tabelas e mídia em aparelhos Apple.", limit: "Não encontramos um caminho MCP da Apple na documentação consultada. Veja a seção abaixo." },
];
const FAQ = [
  { q: "Quais apps documentam o próprio servidor MCP?", a: ["Pinto Notes e Notion têm servidores hospedados. O Bear documenta um servidor oficial local no Mac. O plugin do Obsidian e o experimento do Notesnook são projetos da comunidade. Não testamos as conexões dos outros apps."] },
  { q: "O MCP do Bear funciona no iPhone?", a: ["Não. Segundo o Bear, o CLI, o Claude Connector e o servidor MCP funcionam apenas no macOS com Bear 2.8 ou posterior. O Claude Connector exige o app Claude para computador."] },
  { q: "O MCP do Notesnook é oficial?", a: ["A ajuda do Notesnook consultada em 21 de novembro de 2026 não documentava configuração MCP oficial. Um autor da comunidade publicou uma ponte local experimental. Ela não é oficial e não a testamos."] },
  { q: "O Standard Notes documenta uma conexão MCP?", a: ["O índice de ajuda consultado em 21 de novembro de 2026 não documentava uma configuração MCP. Isso não prova a ausência de projetos da comunidade. Não testamos uma conexão MCP para Standard Notes."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="melhor-app-de-notas-com-mcp"
    intro={<>Pinto Notes e Notion têm servidores MCP hospedados. O Bear tem um servidor local oficial para Mac. O Obsidian oferece plugins da comunidade; o Notesnook tem um experimento. O guia do Notas não documenta MCP.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparacao", label: "Seis apps" }, { href: "#hospedado", label: "Conexões hospedadas" },
      { href: "#local", label: "Conexões locais" }, { href: "#apple", label: "Notas" }, { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Escolha Pinto Notes se quiser o jeito do Notas com MCP hospedado para ChatGPT ou Claude lerem e editarem suas notas. Notion serve a equipes que trabalham com páginas e bancos de dados. Bear conecta a biblioteca atual no Mac. A rota do Obsidian é comunitária e funciona com arquivos Markdown locais. Investigue a ponte experimental do Notesnook antes de mudar.</p>
      <PostCta slug="pt/melhor-app-de-notas-com-mcp" path="/pt/blog/melhor-app-de-notas-com-mcp" position="answer" ui={ui.cta} title="Suas notas conectadas à sua IA">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Seu MCP hospedado deixa ChatGPT ou Claude buscar, ler e editar notas, com Desfazer e versões anteriores. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="comparacao">Seis apps de notas e suas conexões MCP</h2>
    <p>MCP significa Model Context Protocol. Ele permite que um app de IA compatível use ferramentas para trabalhar com suas notas. A tabela reúne o que a documentação dos apps descrevia em 21 de novembro de 2026. Este blog é do Pinto Notes. Não testamos as conexões MCP dos outros apps nem os servidores da comunidade.</p>
    <div className="tableWrap"><table>
      <thead><tr><th scope="col">App</th><th scope="col">Conexão MCP</th><th scope="col">O que a documentação descreve</th><th scope="col">Para quem serve</th><th scope="col">O que conferir</th></tr></thead>
      <tbody>{ROWS.map((row) => <tr key={row.app}><th scope="row">{row.app}</th><td>{row.route}</td><td>{row.use}</td><td>{row.fit}</td><td>{row.limit}</td></tr>)}</tbody>
    </table></div>

    <h2 id="hospedado">Pinto Notes e Notion têm conexões hospedadas</h2>
    <p>Um servidor MCP hospedado oferece um endereço na internet para o app de IA. Você autoriza a conexão e pede que a IA use as ferramentas. O endereço do Pinto Notes é <code>{MCP_URL}</code>. Você aprova cada app de IA. As alterações podem ser desfeitas e as versões anteriores ficam guardadas.</p>
    <p>O <a href="https://developers.notion.com/guides/mcp/get-started-with-mcp">servidor oficial hospedado do Notion</a> fica em <code>https://mcp.notion.com/mcp</code>. As <a href="https://developers.notion.com/guides/mcp/overview">ferramentas documentadas</a> buscam no espaço de trabalho, editam páginas e gerenciam bancos de dados. Pode fazer sentido quando as notas de reunião precisam ficar junto do trabalho da equipe. A conexão respeita as permissões atuais da conta.</p>

    <h2 id="local">Bear e Obsidian se conectam no computador</h2>
    <p>O Bear tem seu próprio servidor. Seu <a href="https://bear.app/faq/command-line-interface/">guia oficial de MCP</a> documenta <code>bearcli mcp-server</code>, incluído no Bear para Mac. O Claude Connector é instalado por Help, Advanced, Install Claude Connector. Os dois usam o banco local do Bear. É possível filtrar as etiquetas visíveis. Notas criptografadas ficam fora do alcance dessas ferramentas.</p>
    <p>O Obsidian guarda uma <a href="https://obsidian.md/help/data-storage">pasta de arquivos Markdown</a>. Seu diretório da comunidade lista o plugin <a href="https://community.obsidian.md/plugins/obsidian-local-rest-api">Local REST API with MCP</a>, de Adam Coddington. Ele acrescenta um servidor local com chave de API e pode editar um cabeçalho ou bloco específico. Essa rota exige Obsidian e computador ligados.</p>
    <p>A conexão do Bear é feita pelo próprio Bear. O plugin do Obsidian é da comunidade. Nenhuma das duas é hospedada. O <a href="/blog/obsidian-mcp" hrefLang="en">guia de MCP no Obsidian</a> trata também de servidores que acessam diretamente os arquivos da biblioteca.</p>

    <h2 id="notesnook">Notesnook tem um experimento da comunidade</h2>
    <p>O <a href="https://notesnook.com/">Notesnook</a> é de código aberto e tem cadernos, etiquetas e recorte de páginas web. As <a href="https://notesnook.com/help/">páginas de ajuda</a> consultadas não documentavam uma configuração MCP oficial.</p>
    <p>Um autor publicou uma <a href="https://github.com/streetwriters/notesnook/discussions/10571">ponte MCP local experimental</a> nas discussões do repositório. Ele a chama de não oficial. Um anúncio da comunidade não a torna um recurso suportado pelo Notesnook. Não a testamos. Se você já usa o app, leia os requisitos atuais do projeto antes de decidir testá-lo.</p>

    <h2 id="apple">E o MCP do Notas?</h2>
    <p>O Notas continua útil para quem quer iCloud, checklists, tabelas e mídia. O <a href="https://support.apple.com/pt-br/guide/notes/get-started-apd441e46563/mac">guia da Apple</a> descreve esses recursos, mas não um servidor MCP. Não encontramos configuração MCP feita pela Apple na documentação consultada.</p>
    <p>Um resultado de busca por “Apple Notes MCP” pode se referir a um projeto da comunidade. Esta comparação não confirma as capacidades de tais projetos.</p>

    <h2 id="pinto">Pinto Notes mantém o jeito do Notas</h2>
    <p>O Pinto Notes funciona no iPhone e no Mac. Não tem app para Windows, Android ou web. Seu servidor hospedado deixa ChatGPT e Claude usarem as notas sem manter o Mac ligado. Claude Code e Codex também podem se conectar. O <a href="/blog/mcp-server" hrefLang="en">guia do servidor MCP</a> lista as ferramentas e explica a autorização.</p>
    <Figure shot={SHOTS.aiEdit} caption="O ChatGPT acrescentou cinco linhas a uma lista de compras no Pinto Notes para Mac. As mudanças aparecem destacadas, com opção de desfazer." />
    <p>Uma IA pode buscar e ler notas, criar uma nota ou editar uma existente. Você vê o que mudou, pode desfazer e voltar a uma versão anterior. Para trazer sua biblioteca, <a href="/blog/import-your-notes" hrefLang="en">importe o Notas no Mac</a>. O original não muda.</p>
  </LocalPostPage>;
}
