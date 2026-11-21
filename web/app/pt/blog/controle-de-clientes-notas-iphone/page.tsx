import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "controle-de-clientes-notas-iphone");

// Versão pt-BR de /blog/apple-notes-client-tracker-template, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "controle de clientes modelo" sugeriu "modelo de controle de clientes" e
// "modelo planilha controle de clientes". Apple pt-BR consultada em 21 nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac (Formatar > Tabela),
// apd93c815aa0/mac (Lista de Verificação), apde615d29c2/mac (Editar > Adicionar Link);
// support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios (Tabela, Lista de Verificação) e
// iph908d1558b/ios (link para nota). Sem imagem no original.

const ui = UI.pt;
const TEMPLATE = `Cerâmica Porto Azul

Contato
Marina Alves, proprietária
marina@portoazul.example
Prefere e-mail. Pode atender ligações terça à tarde.

Trabalho em conjunto
Textos do site para a coleção de verão.
Marina aprova o texto. Léo envia as fotos dos produtos.

Situação atual
Primeira versão enviada em 18 de novembro de 2026.
Aguardando comentários de Marina antes de revisar as páginas dos produtos.
Último contato: 20 de novembro de 2026, e-mail de Marina.
Próximo contato: 24 de novembro de 2026, cobrar comentários se não chegarem.

Próximas ações
Pedir comentários a Marina em 24 de novembro
Confirmar quando Léo pode enviar as fotos dos esmaltes

Histórico de contatos
20 de novembro de 2026: Marina pretende revisar o texto na segunda-feira.
18 de novembro de 2026: enviei a primeira versão. Faltam duas fotos dos esmaltes.

Para lembrar
Usar português do Brasil. Manter as instruções de cuidado em cada página de produto.

Notas relacionadas
Cerâmica Porto Azul, reunião inicial, 12 de novembro de 2026
`;
const INDEX = `Clientes

Cliente\tÚltimo contato\tPróximo contato
Cerâmica Porto Azul\t20 nov 2026\t24 nov, comentários sobre o texto
Estúdio Cedro\t19 nov 2026\t25 nov, disponibilidade em janeiro
`;
const FAQ = [
  { q: "Posso acompanhar clientes no app Notas?", a: ["Sim. Use uma nota por cliente com dados de contato, trabalho atual, último contato e próximo retorno. Uma tabela de índice reúne as datas e os links para as notas."] },
  { q: "O que registrar entre reuniões?", a: ["Anote a situação atual, a última conversa e uma próxima ação concreta. Acrescente uma linha com data após cada contato. Deixe os detalhes de cada reunião em uma nota separada."] },
  { q: "A data do próximo contato gera um alerta?", a: ["Não. Ela é apenas texto. Crie um lembrete separado para prazos importantes e revise o índice."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="controle-de-clientes-notas-iphone"
    intro={<>Use uma nota por cliente no app Notas e uma tabela de índice com as datas de retorno. Copie os exemplos preenchidos e troque pelos seus dados.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "A nota do cliente" }, { href: "#indice", label: "O índice" },
      { href: "#uso", label: "Mantenha atualizado" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Use com IA" },
    ]}><p>Guarde contatos, histórico com datas e próximo retorno na nota de cada cliente. Um índice reúne os links e as datas. Você mantém esse registro manualmente.</p>
      <PostCta slug="pt/controle-de-clientes-notas-iphone" path="/pt/blog/controle-de-clientes-notas-iphone" position="answer" ui={ui.cta} title="Peça à IA que leia o histórico do cliente">
        <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois de conectado, o ChatGPT ou o Claude pode ler as notas dos clientes e atualizar a próxima ação com as informações que você der.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modelo">Uma nota para cada cliente</h2>
    <p>O exemplo é de uma redatora esperando a resposta da cliente. As preferências de contato ficam no topo. A situação atual mostra o que falta sem reler todas as mensagens.</p>
    <Keep title="Ficha de cliente para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole como texto. Transforme as duas próximas ações em uma checklist." />
    <p>No Mac, selecione as duas ações e clique no botão Lista de Verificação. No iPhone, toque nesse botão em uma linha vazia e digite cada ação como item. Mantenha o histórico como texto com datas. Veja os guias da Apple para <a href="https://support.apple.com/pt-br/guide/notes/apd93c815aa0/mac">Mac</a> e <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">iPhone</a>.</p>
    <p>Para outro cliente, copie a estrutura e troque todos os dados. Anote o que foi combinado e o que falta. Não precisa colar a conversa inteira por e-mail.</p>
    <h2 id="indice">Índice com datas e links</h2>
    <p>Crie uma nota chamada Clientes. Cada linha leva à ficha de um cliente. Deixe só um resumo do retorno na última coluna; a explicação fica na ficha. As datas batem com o exemplo acima.</p>
    <Keep title="Índice de clientes para o app Notas" text={INDEX} copyLabel={ui.copy} note="Há uma tabulação entre as células. No Mac, cole e transforme as três linhas em tabela." />
    <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"] }, { on: "Mac", steps: ["Editar", "Adicionar Link"] }]} />
    <p>No Mac, selecione as três linhas da tabela e clique no botão Tabela. Cada Tab vira uma coluna. Tab na última célula cria outra linha. No iPhone, use o botão Tabela e preencha as células. Leia o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia de tabelas da Apple</a> e o <a href="/blog/apple-notes-tables" hrefLang="en">guia de tabelas do Notas</a> (em inglês).</p>
    <p>Para criar um link no Mac, selecione o nome do cliente, escolha Editar, Adicionar Link, digite o título da nota, selecione a sugestão e confirme. No iPhone, selecione o nome, abra as demais opções do menu de edição e adicione um link para a nota. A Apple explica os passos para <a href="https://support.apple.com/pt-br/guide/notes/apde615d29c2/mac">Mac</a> e <a href="https://support.apple.com/pt-br/guide/iphone/iph908d1558b/ios">iPhone</a>.</p>
    <h2 id="uso">Mantenha o registro atualizado</h2>
    <p>Depois de uma ligação ou e-mail, acrescente uma linha com data. Atualize a situação atual e a próxima ação. Mude a data no índice também. Antes de ligar, leia Situação atual e Para lembrar. Para pauta e decisões detalhadas, crie uma <a href="/pt/blog/ata-de-reuniao-notas-iphone">nota de reunião</a> separada.</p>
    <h2 id="limites">Onde o modelo para</h2>
    <p>O índice e as fichas não se atualizam juntos. A data escrita não dispara alertas. O modelo não registra e-mails sozinho, consulta contatos nem calcula previsões de venda. Para um funil compartilhado com acompanhamento automático, use um CRM.</p>
    <h2 id="pinto-notes">Use com ChatGPT ou Claude</h2>
    <p>O Pinto Notes se parece e funciona como o app Notas no iPhone e no Mac. Tem tabelas, checklists e links entre notas. Monte suas fichas e <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecte ChatGPT ou Claude</a> (guia em inglês) para permitir que leiam e editem as notas.</p>
    <p>Antes de responder a Marina, peça um resumo do que falta e um rascunho de e-mail baseado só na ficha. Confira o texto. Depois, forneça os novos dados e peça para atualizar tanto a ficha quanto o índice. Isso acontece por pedido seu, não automaticamente.</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
