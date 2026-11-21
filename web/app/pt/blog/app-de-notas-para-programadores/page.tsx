import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "app-de-notas-para-programadores");

// Versão pt-BR de /blog/notes-app-for-developers, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "app de notas para programadores", "melhor app de notas
// para programadores", "app de notas para desenvolvedores" e "aplicativo de notas para programadores"
// não deram sugestões. "Programadores" é a formulação local para o público deste post, sem volume alegado.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd46c25187e/mac (Estilo Fixo,
// Shift + Command + M), /guide/notes/apde615d29c2/mac (Editar > Adicionar Link),
// /guide/notes/not201900c07/mac (Arquivo > Exportar Para > Markdown e Editar > Copiar como Markdown).
// Capacidades dos outros apps vêm da documentação citada no original. Sem preços ou teste prático comparativo.
const ui = UI.pt;
const FAQ = [
  { q: "O que um programador deve conferir num app de notas?", a: ["Teste formatação de código, exportação Markdown, busca e links entre notas. Se um agente de programação precisa das notas, escolha como ele vai acessá-las: arquivos locais, linha de comando ou MCP."] },
  { q: "Qual app permite que um agente leia arquivos locais?", a: ["O Obsidian guarda a biblioteca em arquivos Markdown comuns. Um agente com acesso à pasta pode lê-los diretamente. O Obsidian também tem um CLI oficial que usa o app em execução."] },
  { q: "Posso usar o Notas para anotações de programação?", a: ["Sim, para explicações, checklists e trechos curtos. No Mac, Shift + Command + M aplica Estilo Fixo. Você pode criar links entre notas e exportar uma nota como Markdown, mas a exportação é uma cópia separada."] },
  { q: "Gemini CLI funciona com o Pinto Notes?", a: ["Sim. O guia de MCP do Pinto Notes lista Gemini CLI, Claude Code e Codex. Depois da conexão e da autorização, o agente pode buscar, ler e editar suas notas."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="app-de-notas-para-programadores"
    intro={<>Escolha Obsidian se quiser arquivos Markdown locais para guardar no Git. Escolha Pinto Notes se quiser o jeito do Notas no iPhone e no Mac, com notas que seu agente de programação possa ler e editar.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Comparar apps" }, { href: "#testar", label: "O que testar" },
      { href: "#obsidian", label: "Arquivos locais" }, { href: "#pinto", label: "Pinto Notes" }, { href: "#modelos", label: "Modelos" },
    ]}>
      <p>Obsidian serve a uma biblioteca pessoal de arquivos; Notion, à documentação compartilhada de projetos; Joplin oferece cadernos Markdown e um app de terminal. Bear liga notas com trechos de código, enquanto Notas resolve capturas rápidas. Pinto Notes conecta Claude Code, Codex e Gemini CLI às notas por MCP hospedado.</p>
      <PostCta slug="pt/app-de-notas-para-programadores" path="/pt/blog/app-de-notas-para-programadores" position="answer" ui={ui.cta} title="Notas de projeto que seu agente pode usar">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Adicione Code Block pelo menu / e conecte seu agente para ler e editar notas Markdown. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600} alt="Notas de daily standup no Pinto Notes para Mac, com bloqueio por chave de API e registros de quinta e sexta." caption="Modelo de daily standup preenchido com um exemplo. Um agente conectado pode redigir a parte de ontem a partir dos commits." />}
    faq={FAQ}
  >
    <h2 id="comparar">Seis apps de notas para programadores</h2>
    <div className="tableWrap"><table>
      <thead><tr><th scope="col">App</th><th scope="col">Código e Markdown</th><th scope="col">Como uma ferramenta acessa as notas</th></tr></thead>
      <tbody>
        <tr><th scope="row">Obsidian</th><td>Blocos de código cercados; arquivos Markdown locais</td><td>Ler a pasta da biblioteca ou usar o CLI oficial</td></tr>
        <tr><th scope="row">Notion</th><td>Blocos de código com linguagem; exportação Markdown</td><td>MCP oficial busca e edita páginas do espaço de trabalho</td></tr>
        <tr><th scope="row">Joplin</th><td>Editor Markdown com blocos de código</td><td>App de terminal ou MCP local oficial pelo Web Clipper</td></tr>
        <tr><th scope="row">Bear</th><td>Markdown com blocos de código; exportação .md</td><td>bearcli e MCP local oficiais no Mac</td></tr>
        <tr><th scope="row">Notas</th><td>Estilo Fixo; exportação Markdown no Mac</td><td>Exportar ou copiar Markdown para passar à ferramenta</td></tr>
        <tr><th scope="row">Pinto Notes</th><td>Code Block no menu /; notas em arquivos Markdown</td><td>MCP hospedado para Claude Code, Codex e Gemini CLI</td></tr>
      </tbody>
    </table></div>
    <p>Recursos conferidos na documentação dos fabricantes em 21 de novembro de 2026. São caminhos documentados, não testes práticos de todos os apps.</p>

    <h2 id="testar">O que testar antes de mudar suas notas</h2>
    <ul>
      <li>Cole um trecho real e copie de volta para o editor. Confira recuo e pontuação.</li>
      <li>Decida se precisa de arquivos simples para o Git ou se uma exportação Markdown basta.</li>
      <li>Busque o nome de uma função e parte de um erro. Teste também os sinais, não só palavras.</li>
      <li>Crie um link da decisão para o bug que a motivou. Veja como voltar.</li>
      <li>Peça ao agente para ler uma nota e mudar uma linha. Confira o resultado e como desfazer.</li>
    </ul>

    <h2 id="obsidian">Obsidian para uma biblioteca Markdown local</h2>
    <p>A biblioteca do Obsidian é uma pasta comum no disco. Como as notas são arquivos Markdown, você pode guardá-las no Git ou deixar um agente ler a pasta. Blocos de código aceitam o nome da linguagem. Links unem o trecho à explicação, e a busca pode filtrar por arquivo ou caminho.</p>
    <p>O <a href="https://obsidian.md/help/cli">CLI oficial</a> busca e lê notas, cria notas e acrescenta texto. Ele precisa do Obsidian em execução; o primeiro comando abre o app se necessário. O acesso direto aos arquivos permite que as ferramentas do terminal trabalhem nos mesmos arquivos que você edita no app.</p>

    <h2 id="notion">Notion para documentação compartilhada</h2>
    <p>O Notion reúne notas de projeto, tarefas e bancos de dados da equipe. Digite <code>/code</code> para criar um bloco, escolha a linguagem e use Copy para levar o trecho ao editor. Menções a páginas criam links de volta. A busca do espaço de trabalho encontra texto nas páginas; a busca no banco de dados abrange títulos e propriedades.</p>
    <p>O <a href="https://developers.notion.com/guides/mcp/overview">MCP oficial do Notion</a> permite buscar, criar e editar páginas e gerenciar bancos de dados. Você pode exportar páginas em Markdown e bancos de dados em CSV. Essa exportação é uma cópia; as edições em andamento ficam no espaço de trabalho.</p>

    <h2 id="joplin">Joplin para cadernos Markdown e terminal</h2>
    <p>O Joplin é de código aberto e tem app de terminal e editor Markdown. Aceita blocos de código cercados e links entre notas. A busca filtra por caderno e etiqueta. Colocar <code>/</code> no início da busca inclui pontuação pela busca básica; o Joplin avisa que isso pode ser mais lento.</p>
    <p>O Joplin também documenta um <a href="https://joplinapp.org/help/apps/ai_mcp/">servidor MCP local oficial</a>. Ele exige o Web Clipper em execução e a ativação do servidor e de cada ferramenta. As notas ficam no banco de dados do Joplin e podem ser exportadas como Markdown. O terminal ou MCP acessa as notas atuais.</p>

    <h2 id="bear">Bear para explicações e trechos ligados</h2>
    <p>O Bear combina Markdown com blocos que colorem código conforme a linguagem. Digite <code>[[</code> para ligar outra nota ou um cabeçalho dentro dela. Serve para uma coleção de exemplos em que cada trecho precisa de explicação e referências.</p>
    <p>O <a href="https://bear.app/faq/command-line-interface/">CLI e servidor MCP oficiais do Bear</a> podem buscar, ler e editar notas localmente no Mac. O Bear usa um banco SQLite e exporta arquivos .md. Suas ferramentas de automação só funcionam no Mac; confira onde seu agente roda.</p>

    <h2 id="apple">Notas para anotações rápidas de projeto</h2>
    <p>O Notas funciona para registros de investigação, checklists e pequenos trechos com explicação. A busca encontra palavras, e fixar uma nota mantém o projeto à vista. No Mac, Shift + Command + M aplica Estilo Fixo. Use Editar, Adicionar Link para conectar notas relacionadas. Veja <a href="/pt/blog/bloco-de-codigo-notas-iphone">como formatar código no Notas</a>.</p>
    <p>O <a href="https://support.apple.com/pt-br/guide/notes/not201900c07/mac">guia de exportação da Apple</a> documenta Arquivo, Exportar Para, Markdown para a nota selecionada, e Editar, Copiar como Markdown para um trecho. Passe essa cópia ao agente quando precisar de contexto. Depois, você precisa trazer manualmente para o Notas as mudanças feitas na cópia.</p>

    <h2 id="pinto">Pinto Notes para notas que o agente pode editar</h2>
    <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Digite <code>/</code> no início de uma linha e escolha <strong>Code Block</strong> para um trecho. As notas são arquivos Markdown, com caminhos como <code>Work/Decision log.md</code>. O agente chega a elas pelo servidor MCP hospedado, onde pode buscar, ler e editar.</p>
    <p>O <a href="/blog/mcp-server" hrefLang="en">guia de MCP</a> lista os passos para Claude Code, Codex e Gemini CLI. O <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">guia de Claude Code e Codex</a> acompanha a primeira conexão e pergunta. As edições da IA mostram as mudanças e oferecem Desfazer; cada versão anterior fica no histórico. O Pinto Notes só funciona em aparelhos Apple, sem app para Windows, Android ou web.</p>

    <h2 id="modelos">Comece com um modelo para desenvolvimento</h2>
    <p>Estes modelos grátis do Pinto Notes dão estrutura às notas e instruções para o agente atualizá-las.</p>
    <ul>
      <li><a href="/templates/bug-triage">Triagem de bugs</a> classifica um relato por gravidade e acrescenta passos de reprodução quando fornecidos. As instruções para Claude Code também pedem que ele examine o código em busca de uma causa provável.</li>
      <li><a href="/templates/daily-standup">Daily standup</a> mantém uma seção por dia de trabalho. O agente redige o trabalho de ontem com base nos commits e pergunta o que vem a seguir e o que está bloqueado.</li>
      <li><a href="/templates/decision-log">Registro de decisões</a> anota contexto, opções e motivo da escolha. As instruções para o agente citam arquivos afetados e verificam decisões anteriores antes de propor uma mudança.</li>
    </ul>
    <p>A parte de IA funciona depois da conexão. Para ChatGPT ou Claude, siga <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">o guia de conexão</a>. Você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas no Mac</a> de uma vez. O original não muda.</p>
  </LocalPostPage>;
}
