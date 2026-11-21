import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "briefing-de-projeto-notas-iphone");

// Versão pt-BR de /blog/apple-notes-project-brief-template, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "modelo briefing de projeto" sugeriu "modelo de briefing de projeto" e
// "modelo de briefing de projeto arquitetonico". O título usa "briefing de projeto".
// Apple pt-BR consultada em 21 nov 2026: support.apple.com/pt-br/guide/notes/not9474646a9/mac
// (Nova Nota, Arquivo > Duplicar Nota), apd1955d3b21/mac (Formatação, Cabeçalho),
// apd93c815aa0/mac (Lista de Verificação), apd0a136b9cc/mac (Formatar > Tabela),
// e support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios (Formatação, Cabeçalho, Tabela).
// Conversão das linhas com Tab segue o modelo Cornell já verificado. Sem imagem no original.

const ui = UI.pt;
const TEMPLATE = `Briefing do projeto: página de retirada do Café Ipê

Responsável: Sara Lima
Aprovação: Amir Khan, gerente do café
Entrega prevista: 4 de dezembro de 2026
Status: rascunho, aguardando análise de Amir

Resultado esperado
Clientes encontram o cardápio de retirada e fazem o pedido pelo site do café no celular.
Na primeira semana, Amir anota quantas ligações perguntam onde pedir. Revisar o total em 11 de dezembro.

Incluído
Uma página de retirada com o cardápio atual, preços e horário.
Um link para o serviço de pedidos já usado pelo café.
Um link Retirada no menu do site.

Fora do escopo
Entrega, novo sistema de pagamento e mudanças no serviço de pedidos.
Fotos e reformulação das outras páginas do site.

Critérios de aceitação
Amir conferiu cada item e preço com o cardápio do balcão.
A página informa o horário e o local de retirada.
O link Retirada abre a página no iPhone e no Mac de Sara.
Um pedido de teste pelo link chega à tela do serviço de pedidos existente.

Questões em aberto
Pergunta\tResponsável e prazo
Quem atualiza o cardápio depois do lançamento?\tAmir, até 25 de novembro
O que mostrar quando a retirada estiver fechada?\tSara propõe o texto; Amir aprova até 26 de novembro

Aprovação
Amir confirma o escopo e os critérios até 27 de novembro.
Depois disso, registrar aqui toda mudança de escopo, com data e efeito na entrega.
`;
const FAQ = [
  { q: "O Notas tem um modelo de briefing de projeto?", a: ["Não há um modelo pronto. Copie este exemplo para uma nota, troque os dados e formate cabeçalhos, checklist e tabela."] },
  { q: "Como escrever critérios de aceitação?", a: ["Descreva verificações que a pessoa responsável pela aprovação consegue fazer. Um pedido de teste que chega ao serviço existente é mais claro que dizer que a página deve ser fácil de usar."] },
  { q: "Qual a diferença entre briefing e plano de projeto?", a: ["O briefing combina resultado, limites, responsáveis e condições para concluir o trabalho. O plano divide o trabalho aprovado em tarefas e datas."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="briefing-de-projeto-notas-iphone"
    intro={<>Copie este briefing de projeto para o app Notas e combine o que será entregue e como conferir o resultado. O exemplo traz o escopo de uma página de pedidos para um café.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o briefing" }, { href: "#configurar", label: "Formate no Notas" },
      { href: "#combinar", label: "Combine o escopo" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Revise com IA" },
    ]}><p>Use uma nota por projeto. Coloque resultado e responsável no início, depois os limites do trabalho e os critérios de aceitação. Copie o exemplo e substitua os dados do café.</p>
      <PostCta slug="pt/briefing-de-projeto-notas-iphone" path="/pt/blog/briefing-de-projeto-notas-iphone" position="answer" ui={ui.cta} title="Quer ajuda para revisar o briefing?">
        <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois de conectado, o ChatGPT ou o Claude pode ler o briefing e editá-lo quando você pedir.</p>
      </PostCta></Answer>}
    hero={<></>} faq={FAQ}>
    <h2 id="modelo">O modelo: combine o que significa concluir</h2>
    <p>O exemplo mantém o serviço de pedidos atual. Incluir um novo pagamento mudaria o trabalho. Troque nomes e datas e escreva cada critério de modo que alguém possa testá-lo.</p>
    <Keep title="Briefing de projeto para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Copie como texto. Depois formate os cabeçalhos, a checklist e a tabela de questões." />
    <h2 id="configurar">Formate no app Notas</h2>
    <p>No Mac, crie uma nota, cole o texto, selecione cada nome de seção e use o botão Formatação para aplicar Cabeçalho. Use notas do iCloud ou salvas no Mac para essas opções.</p>
    <Paths rows={[{ on: "Mac", steps: ["Selecione os critérios", "botão Lista de Verificação"] }, { on: "Mac", steps: ["Selecione as questões", "Formatar", "Tabela"] }, { on: "iPhone", steps: ["Selecione a seção", "Formatação", "Cabeçalho"] }]} />
    <p>Selecione os quatro parágrafos dos critérios e clique no botão Lista de Verificação. Deixe os itens desmarcados até Amir conferir o resultado. Concluir uma tarefa não prova que o critério foi atendido.</p>
    <p>As três linhas de questões têm uma tabulação entre as colunas. No Mac, selecione-as e clique em Tabela. Cada Tab vira uma coluna. Também é possível escolher Formatar, Tabela e preencher as células; Tab na última célula cria outra linha. Veja o <a href="/blog/apple-notes-tables" hrefLang="en">guia de tabelas</a> (em inglês).</p>
    <p>No iPhone, cole o texto e formate os nomes das seções. Para os critérios, inicie uma Lista de Verificação e digite um por item. Para as questões, crie uma tabela com o botão Tabela e preencha as células.</p>
    <p>Para o próximo projeto no Mac, selecione a nota e escolha Arquivo, Duplicar Nota. Troque o exemplo e apague a aprovação antiga.</p>
    <h2 id="combinar">Revise antes de começar</h2>
    <p>O produto é a página de retirada. O resultado desejado é que clientes façam pedidos pelo celular. As ligações da primeira semana serão revistas depois do lançamento, separadamente dos critérios para aceitar a página.</p>
    <p>Peça a Amir que leia também o que ficou fora do escopo. Se entrega passar a ser necessária, revise o escopo e a data antes de criar tarefas. Mantenha o status como rascunho até ele confirmar.</p>
    <p>Dê responsável e prazo a cada questão. Depois da resposta, atualize o briefing. Se precisar guardar o motivo da decisão, use um <a href="/pt/blog/registro-de-decisoes-notas-iphone">registro de decisões</a>.</p>
    <h2 id="limites">Onde o modelo para</h2>
    <p>Datas e nomes são texto. A nota não avisa ninguém nem recolhe aprovações. Registre a data de confirmação. Uma marca na checklist não executa o pedido de teste nem confere o cardápio. Se o escopo mudar, reavalie os critérios afetados.</p>
    <h2 id="pinto-notes">Revise com ChatGPT ou Claude</h2>
    <p>Você pode copiar este modelo para o Pinto Notes e editá-lo com cabeçalhos, checklists e tabelas. Ele se parece e funciona como o app Notas no iPhone e no Mac. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês), a IA pode ler e editar a nota.</p>
    <p>Peça para apontar critérios vagos e questões sem resposta. Confira as sugestões antes de pedir alterações. Amir continua responsável por aprovar o escopo e testar o resultado.</p>
    <p>O Pinto guarda versões anteriores e permite restaurá-las, preservando também o texto substituído. As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
