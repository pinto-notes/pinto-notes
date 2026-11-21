import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "biblioteca-de-prompts-chatgpt-notas");

// Versão pt-BR de /blog/chatgpt-prompt-library-in-notes, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "biblioteca de prompts chatgpt" trouxe a própria expressão e "biblioteca de prompts para chatgpt"; "biblioteca de prompts" trouxe também "biblioteca de prompts grátis".
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd558a85438/mac confirma Arquivo > Nova Pasta; support.apple.com/pt-br/guide/notes/apdb54e469b6/mac confirma Arquivo > Fixar Nota.
// O nome pt-BR de Paste as Markdown e do comando de duplicar não foi confirmado nas páginas consultadas. As ações são descritas sem atribuir nome de menu.
const ui = UI.pt;
const TEMPLATE = `# Prompt: atualização semanal do projeto

Status: para testar
Último teste: AAAA-MM-DD
Testado com: app e modelo usados

## Quando usar
Transformar anotações soltas do projeto em uma atualização para um colega.

## Prompt reutilizável
Escreva uma atualização semanal para [PÚBLICO] usando apenas [NOTAS].
Use dois títulos: Avanços e Próximos passos.
Limite o texto a 150 palavras. Use frases curtas.
Mantenha nomes e datas como foram informados. Não invente prazos.
Se faltar um dado essencial, pergunte antes de escrever.

## Exemplo de entrada
Público: equipe de design
Notas: rascunho da página inicial concluído. Revisão marcada para terça-feira.

## Exemplo de resultado para comparar
Avanços: o rascunho da página inicial está concluído.
Próximos passos: revisar o rascunho na terça-feira.

## Notas do teste
Confira se o resultado mantém a terça-feira e não acrescenta prazo.
Substitua este exemplo por um resultado que você conferiu.
`;
const RETRIEVE = `Busque no meu Pinto Notes a nota "Prompt: atualização semanal do projeto" e leia tudo.
Mostre a seção Prompt reutilizável antes de usá-la.
Pergunte qual é o público e quais são as notas desta semana. Não altere o prompt salvo.`;
const FAQ = [
  { q: "Como montar uma biblioteca de prompts no Notas?", a: ["Crie uma pasta Prompts e guarde um prompt por nota. Inclua a finalidade, o texto para copiar e um resultado de exemplo que você conferiu. Busque pelo nome da tarefa quando precisar dele."] },
  { q: "O que guardar junto com um prompt reutilizável?", a: ["Guarde uma entrada e um resultado de exemplo, mais a data e o modelo usados no teste. Registre o que mudou quando o resultado falhou. Separe as instruções reutilizáveis dos dados de cada execução."] },
  { q: "O ChatGPT pode buscar um prompt no Pinto Notes?", a: ["Sim. Depois de conectar e escolher Allow, o ChatGPT pode buscar e ler a nota. Peça que mostre as instruções salvas e forneça os dados desta vez. Allow autoriza leitura e edição."] },
  { q: "A biblioteca preenche variáveis automaticamente?", a: ["Não. Os termos entre colchetes são lembretes. Substitua-os antes de colar no ChatGPT ou peça ao ChatGPT conectado que leia a nota e pergunte pelos dados ausentes. É uma nota comum que você cria."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="biblioteca-de-prompts-chatgpt-notas"
    intro={<>Guarde cada prompt reutilizável do ChatGPT em uma nota, com o nome da tarefa e um resultado de exemplo. No Notas, você copia o texto. No Pinto Notes conectado, o ChatGPT pode buscar e ler o prompt pedido.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modelo",label:"Copiar modelo"},{href:"#organizar",label:"Organizar"},{href:"#testar",label:"Testar"},{href:"#pinto",label:"Buscar com ChatGPT"}]}>
      <p>Crie uma pasta Prompts e guarde uma tarefa por nota. Separe as instruções reutilizáveis dos dados de cada uso e salve um exemplo conferido. Quando precisar, copie as instruções para o ChatGPT e forneça dados novos.</p>
      <PostCta slug="pt/biblioteca-de-prompts-chatgpt-notas" path="/pt/blog/biblioteca-de-prompts-chatgpt-notas" position="answer" ui={ui.cta} title="Peça ao ChatGPT para buscar seu prompt"><p>Depois da conexão, o ChatGPT pode encontrar a nota do prompt e ler as instruções quando você pedir. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="modelo">Um modelo de nota para copiar</h2>
    <p>As instruções ficam acima do exemplo. Assim, você copia só a parte necessária. Troque a tarefa e mantenha as seções para criar outro prompt.</p>
    <Keep title="Nota para a biblioteca de prompts" text={TEMPLATE} note="No Notas para Mac com macOS 27, use a opção de colar como Markdown para formatar títulos. A colagem comum mantém os sinais de Markdown no texto." />
    <p>Substitua <code>[PÚBLICO]</code> e <code>[NOTAS]</code> no texto enviado ao ChatGPT. Mantenha os marcadores na cópia da biblioteca. Envie apenas a seção Prompt reutilizável, com os dados preenchidos.</p>
    <h2 id="organizar">Encontre prompts pelo que fazem</h2>
    <p>No Notas para Mac, escolha <a href="https://support.apple.com/pt-br/guide/notes/apd558a85438/mac">Arquivo &gt; Nova Pasta</a> e dê o nome Prompts. Nomeie cada nota pela tarefa, como “Prompt: atualização semanal do projeto” ou “Prompt: explicar uma mudança no código”. Inclua no texto as palavras que você usaria na busca.</p>
    <p>Para um prompt frequente, escolha <a href="https://support.apple.com/pt-br/guide/notes/apdb54e469b6/mac">Arquivo &gt; Fixar Nota</a>. A Apple permite fixar notas atualizadas no iCloud e notas guardadas no Mac. Mantenha uma nota por tarefa para guardar os testes com as instruções certas. Veja o <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos do Notas</a>.</p>
    <p>Duplique a nota base no Notas para Mac, dê outro nome e apague os exemplos da tarefa anterior. Use status simples, como “para testar” e “testado”.</p>
    <h2 id="testar">Guarde um teste que possa conferir</h2>
    <p>O <a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt">guia de prompts da OpenAI</a> recomenda instruções específicas, contexto suficiente, revisão da resposta e ajuste do prompt. Registre esses testes na nota.</p>
    <ol><li>Execute o prompt com uma entrada curta.</li><li>Compare a resposta com a entrada. No exemplo, confira a terça-feira e a ausência de um prazo inventado.</li><li>Se falhar, mude uma instrução e repita a mesma entrada.</li><li>Guarde o resultado útil, a mudança, a data e o modelo testado.</li></ol>
    <p>Teste uma segunda entrada antes de marcar como testado. Uma atualização sem data de revisão verifica se o ChatGPT inventa uma. O exemplo salvo serve para comparar, não garante a próxima resposta.</p>
    <h2 id="limites">O que a biblioteca não faz sozinha</h2>
    <p>No Notas, você encontra a nota e copia as instruções. Os termos entre colchetes são texto comum. Preencha-os e confira a resposta. Salvar um prompt não agenda sua execução nem o insere no navegador.</p>
    <h2 id="pinto">Busque um prompt salvo com o ChatGPT</h2>
    <p>Use o mesmo modelo como nota comum no Pinto Notes, para iPhone e Mac. Siga o <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">guia de conexão</a> e escolha Allow. Essa permissão permite ao ChatGPT ler e editar notas.</p>
    <Keep title="Peça um prompt salvo" text={RETRIEVE} note="Conecte o Pinto Notes primeiro. Este pedido busca as instruções e pede dados novos." />
    <p>Confirme que o ChatGPT encontrou a nota certa antes de fornecer os dados da semana. Depois de aprovar uma melhoria, peça que salve as instruções revisadas e o exemplo conferido. O Pinto guarda versões anteriores.</p>
    <p>Você decide quando buscar um prompt e qual revisão manter. Se sua biblioteca já está no Notas, <a href="/blog/move-from-apple-notes" hrefLang="en">importe no Mac</a>. O original não muda.</p>
  </LocalPostPage>;
}
