import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "conectar-notas-ao-gemini-cli-mcp");

// Versão pt-BR de /blog/connect-notes-to-gemini-cli, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "conectar notas ao gemini cli" e "gemini cli notas" não trouxeram sugestões. Título descritivo, sem inferir demanda.
// Este artigo não usa nomes de menus da Apple. Comandos e nomes de recursos do Gemini CLI seguem a documentação do Google citada no original.
const ui = UI.pt;
const ADD = `gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const EXTENSION = "gemini extensions install https://github.com/pinto-notes/pinto-notes";
const BRIEF = `Correção do formulário de contato

Mostrar uma confirmação clara depois do envio da mensagem.
Manter o endereço de e-mail no formulário se o envio falhar.

Resultados da sessão
`;
const READ = `Encontre a nota "Correção do formulário de contato" no meu Pinto Notes e leia tudo.
Diga quais são os requisitos antes de mudar o código.
Se houver mais de uma nota com esse nome, mostre os caminhos e pergunte qual usar.`;
const SAVE = `Leia novamente "Correção do formulário de contato" no Pinto Notes.
Em "Resultados da sessão", acrescente a data de hoje, o que mudamos e quais verificações realmente fizemos.
Diga claramente quais verificações não fizemos. Mantenha os requisitos e registros anteriores.
Mostre o caminho da nota ao terminar.`;
const FAQ = [
  { q: "Qual comando conecta o Pinto Notes ao Gemini CLI?", a: [`Execute gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}. Inicie o Gemini CLI, use /mcp auth pinto-notes e aprove a conexão no Pinto Notes no Mac.`] },
  { q: "Como conferir se o Gemini CLI encontrou as ferramentas?", a: ["Digite /mcp no Gemini CLI para ver o servidor e as ferramentas. Depois, peça para buscar uma nota pelo título exato e ler seu conteúdo. Compare com a nota no Pinto."] },
  { q: "O Gemini CLI pode acrescentar resultados a uma nota do iPhone?", a: ["Depois de conectado e autorizado, ele pode buscar, ler e editar notas do Pinto. Peça que leia a nota antes de acrescentar o resultado sob um título. A nota sincroniza entre iPhone e Mac."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="conectar-notas-ao-gemini-cli-mcp"
    intro={<>Conecte o Gemini CLI ao Pinto Notes por MCP, entre na conta e aprove no Mac. Depois, ele pode ler um briefing escrito no iPhone e acrescentar o resultado da sessão à mesma nota.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#conectar",label:"Conectar"},{href:"#ler",label:"Ler a nota"},{href:"#salvar",label:"Salvar resultado"},{href:"#conferir",label:"Conferir"}]}>
      <p>Execute <code>gemini mcp add --scope user --transport http pinto-notes {MCP_URL}</code> e entre na conta com <code>/mcp auth pinto-notes</code> dentro do Gemini CLI. Escolha Allow no Pinto Notes para autorizar leitura e edição.</p>
      <PostCta slug="pt/conectar-notas-ao-gemini-cli-mcp" path="/pt/blog/conectar-notas-ao-gemini-cli-mcp" position="answer" ui={ui.cta} title="Use suas notas de projeto no Gemini CLI"><p>Escreva um briefing no iPhone, peça ao Gemini CLI para ler e depois salve o resultado na mesma nota. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="conectar">Conecte o Gemini CLI no Mac</h2>
    <p>Estas etapas são para o Gemini CLI no Terminal do Mac. Instale o Pinto Notes e entre na conta. Use uma instalação funcional do Gemini CLI para executar os comandos.</p>
    <Keep title="Adicione o servidor de notas" text={ADD} code note="Execute no Terminal. O escopo de usuário deixa a conexão disponível para todos os seus projetos." />
    <p>Inicie o Gemini CLI com <code>gemini</code> e digite o comando a seguir dentro da sessão:</p>
    <Keep title="Entre na conta do Pinto Notes" text="/mcp auth pinto-notes" code note="Conclua o login no navegador e aprove a conexão quando o Pinto Notes pedir no Mac." />
    <p>O Google documenta o comando HTTP e o login no <a href="https://geminicli.com/docs/tools/mcp-server/">guia MCP do Gemini CLI</a>. Este passo a passo segue a documentação. A conexão real não foi testada para o artigo.</p>
    <p>Se preferir a extensão, o README do Pinto dá este comando:</p>
    <Keep title="Alternativa: instale a extensão do Pinto" text={EXTENSION} code note="Escolha esta opção ou o comando de servidor acima. Os exemplos seguintes servem para as duas." />
    <p>O Google explica como <a href="https://geminicli.com/docs/extensions/">instalar extensões pelo GitHub</a>. Com essa opção, use <code>/mcp</code> para encontrar o nome do servidor e depois <code>/mcp auth</code> para entrar na conta.</p>
    <h2 id="ler">Leia um briefing salvo no iPhone</h2>
    <p>Crie no Pinto Notes uma nota chamada “Correção do formulário de contato”. Use este exemplo ou um briefing do seu projeto:</p>
    <Keep title="Briefing de exemplo" text={BRIEF} />
    <p>No Mac, peça ao Gemini CLI para encontrar a nota. O título exato ajuda a conferir o resultado.</p>
    <Keep title="Leia antes de trabalhar" text={READ} />
    <p>Procure uma chamada <code>search</code> seguida de <code>fetch</code>. Compare a resposta com os dois requisitos da nota. Repetir apenas o pedido não prova que a nota foi lida.</p>
    <h2 id="salvar">Acrescente o resultado à mesma nota</h2>
    <p>Ao terminar a sessão, peça ao Gemini CLI para registrar o que realmente aconteceu. Deixe os requisitos acima dos resultados para a próxima sessão consultar ambos.</p>
    <Keep title="Salve o resultado da sessão" text={SAVE} />
    <p>A ferramenta <code>edit</code> do Pinto muda texto correspondente numa nota que já leu. Peça a inclusão sob um título e confira no Pinto. A versão anterior fica no histórico e as alterações por IA têm Desfazer.</p>
    <p>Abra a mesma nota no iPhone e leia o novo registro. Se algum teste falhou ou não foi feito, mantenha isso no texto.</p>
    <h2 id="conferir">Se a conexão precisar de atenção</h2>
    <p>Digite <code>/mcp</code> no Gemini CLI para ver servidores e ferramentas, ou execute <code>gemini mcp list</code> no Terminal. Se precisar entrar na conta, use <code>/mcp auth pinto-notes</code> na conexão direta. Na extensão, use o nome mostrado na lista.</p>
    <p>Aprove a conexão no Pinto antes de pedir uma nota. Allow autoriza leitura e edição. Se várias notas tiverem o mesmo título, peça os caminhos e escolha uma antes de editar.</p>
    <p>O <a href="/blog/mcp-server" hrefLang="en">guia do servidor MCP</a> lista as ferramentas. O <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">guia de Claude Code e Codex</a> mostra comandos para outros agentes.</p>
    <h2 id="pinto">Guarde o briefing e o resultado juntos</h2>
    <p>O Pinto Notes se parece com o Notas no iPhone e no Mac. Você pode escrever o briefing, permitir que uma IA autorizada o edite e voltar a uma versão anterior.</p>
    <p>Se suas notas estão no app Notas, <a href="/blog/import-your-notes" hrefLang="en">importe no Mac</a>. O original permanece como estava.</p>
  </LocalPostPage>;
}
