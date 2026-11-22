import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "conectar-notas-ao-cursor-mcp");

// Versão pt-BR de /blog/connect-notes-to-cursor, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "conectar notas ao cursor" e "cursor notas" não trouxeram sugestões. Título descritivo, sem inferir demanda.
// Este artigo não usa menus da Apple. Nomes da interface do Cursor seguem o guia oficial em inglês e ficam sem tradução inventada.
const ui = UI.pt;
const CONFIG = JSON.stringify({ mcpServers: { "pinto-notes": { url: MCP_URL } } }, null, 2);
const CURSOR_INSTALL = "cursor://anysphere.cursor-deeplink/mcp/install?" + new URLSearchParams({
  name: "pinto-notes",
  config: Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64"),
}).toString();
const BRIEF = `Briefing da busca no site

Objetivo: permitir a busca em artigos de ajuda publicados.
Primeira versão: buscar nos títulos e mostrar os links encontrados.
Manter: o layout atual da página de ajuda.
Deixar para depois: busca dentro de anexos.
Pergunta em aberto: mostrar resultados durante a digitação ou depois de clicar em Buscar?

Decisões
Nenhuma decisão de implementação ainda.

Próximo passo
Verificar como os artigos de ajuda são carregados.`;
const READ_PROMPT = `Busque no meu Pinto Notes a nota "Briefing da busca no site" e leia tudo. Diga qual é o objetivo, o que fica fora da primeira versão e qual pergunta está em aberto. Não altere a nota nem o código.`;
const UPDATE_PROMPT = `Leia novamente "Briefing da busca no site" no Pinto Notes. Em Decisões, substitua "Nenhuma decisão de implementação ainda." por "Mostrar resultados depois de clicar em Buscar." Substitua o texto em Próximo passo por "Adicionar campo e botão de busca usando o layout atual da página de ajuda." Mantenha o restante. Mostre as alterações feitas.`;
const FAQ = [
  { q: "Como conectar o Pinto Notes ao Cursor?", a: ["No Mac, abra o link para adicionar o Pinto Notes ao Cursor, confirme o servidor, entre na conta e escolha Allow quando o Pinto pedir. A conexão permite ler e editar notas."] },
  { q: "Onde o Cursor guarda a configuração MCP?", a: ["O Cursor documenta .cursor/mcp.json dentro do projeto e ~/.cursor/mcp.json para todos os projetos. Se já houver outros servidores, acrescente pinto-notes ao objeto mcpServers existente."] },
  { q: "O Cursor pode atualizar um briefing escrito no iPhone?", a: ["Sim. Guarde o briefing no Pinto Notes, conecte o Cursor à mesma conta e peça que leia antes de alterar. Abra a nota no Pinto depois para conferir."] },
  { q: "A conexão também abre o Notas da Apple?", a: ["Não. Ela acessa a conta do Pinto Notes. Para trazer notas da Apple, importe no Mac. O app Notas permanece inalterado."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="conectar-notas-ao-cursor-mcp"
    intro={<>Conecte o Pinto Notes ao Cursor por MCP, entre na conta e escolha Allow. O Cursor pode ler um briefing escrito no iPhone e atualizá-lo enquanto você trabalha no Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#conectar",label:"Conectar"},{href:"#manual",label:"Configurar"},{href:"#briefing",label:"Testar briefing"},{href:"#problemas",label:"Resolver problemas"}]}>
      <p>No Mac, use o link de instalação abaixo, entre na conta e escolha Allow. A aprovação dá ao Cursor acesso para ler e editar notas. Comece pedindo a leitura de uma nota pelo título.</p>
      <PostCta slug="pt/conectar-notas-ao-cursor-mcp" path="/pt/blog/conectar-notas-ao-cursor-mcp" position="answer" ui={ui.cta} title="Leve seu briefing para o Cursor"><p>Escreva o briefing no Pinto Notes e peça ao Cursor para ler e registrar uma decisão depois que você a tomar. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="conectar">Conecte o Cursor no Mac</h2>
    <p>Você precisa ter o Cursor instalado no Mac e uma conta no Pinto Notes. Esta conexão dá acesso a essa conta. O Pinto funciona no iPhone e no Mac, sem app de notas para Windows, Android ou web.</p>
    <ol><li><a href={CURSOR_INSTALL}>Adicionar Pinto Notes ao Cursor</a>. O link preenche o endereço do servidor.</li><li>Confirme o servidor no Cursor e siga as etapas de login.</li><li>Escolha Allow quando o Pinto Notes pedir. Isso autoriza leitura e edição.</li></ol>
    <p>O link usa a mesma configuração do instalador do Pinto Notes. O <a href="https://cursor.com/docs/mcp">guia MCP do Cursor</a> documenta servidores remotos e login pelo navegador. Este passo a passo se baseia na documentação e no código do link. A conexão não foi testada no Cursor para este artigo.</p>
    <h2 id="manual">Adicione o servidor manualmente</h2>
    <p>O Cursor usa <code>.cursor/mcp.json</code> para um projeto ou <code>~/.cursor/mcp.json</code> para vários projetos. Se o arquivo já tiver servidores, acrescente <code>pinto-notes</code> ao objeto <code>mcpServers</code>.</p>
    <Keep title="Configuração MCP do Pinto Notes" text={CONFIG} code />
    <p>Ative o servidor na área Customize do Cursor. Entre na conta e escolha Allow. O <a href="/blog/mcp-server" hrefLang="en">guia do servidor MCP</a> explica as ferramentas e o acesso.</p>
    <h2 id="briefing">Leia um briefing escrito no iPhone</h2>
    <p>Antes de abrir o código, escreva no Pinto Notes o que a mudança deve fazer e o que pode esperar. Este exemplo pode ser adaptado ao seu projeto.</p>
    <Keep title="Briefing de exemplo" text={BRIEF} />
    <p>No Cursor, peça para encontrar a nota:</p>
    <Keep title="Confira se o Cursor leu o briefing" text={READ_PROMPT} />
    <p>Confira a chamada da ferramenta e a resposta. Elas devem mostrar o briefing real e identificar a pergunta sobre quando mostrar os resultados. Uma resposta genérica sobre busca não confirma a leitura.</p>
    <h2 id="atualizar">Registre a decisão no briefing</h2>
    <p>Depois de decidir, diga ao Cursor exatamente o que escrever. No exemplo, a busca só mostra resultados após o clique em Buscar.</p>
    <Keep title="Registre a decisão e o próximo passo" text={UPDATE_PROMPT} />
    <p>A ferramenta de edição do Pinto exige que a IA leia a nota antes de alterá-la. Abra o briefing no Pinto e confira a decisão. As versões anteriores ficam no histórico.</p>
    <h2 id="problemas">Se o Cursor não encontrar suas notas</h2>
    <p>Confira se entrou na conta do Pinto que contém o briefing e se o servidor está ativo em Customize. Para erros de conexão, abra Output e selecione MCP Logs. O Cursor pede aprovação para chamadas de ferramentas por padrão.</p>
    <p>Repita primeiro o pedido de leitura. Se houver notas com nomes parecidos, use o título exato e peça que mostre a nota encontrada antes de editar.</p>
    <h2 id="pinto">Guarde as decisões com o briefing</h2>
    <p>Use a mesma nota para o pedido registrado no iPhone e as decisões tomadas durante o código. Peça ao Cursor para atualizá-la quando algo mudar. O exemplo exige um pedido explícito para gravar.</p>
    <p>O <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">guia de Claude Code e Codex</a> mostra outras conexões. Se seus briefings estão no Notas da Apple, <a href="/blog/import-your-notes" hrefLang="en">importe no Mac</a>. O Notas não muda.</p>
  </LocalPostPage>;
}
