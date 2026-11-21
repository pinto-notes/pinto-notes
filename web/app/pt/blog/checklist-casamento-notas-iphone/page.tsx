import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "checklist-casamento-notas-iphone");

// Versão pt-BR de /blog/apple-notes-wedding-planner-template, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "checklist casamento" sugeriu "checklist casamento completo", "simples"
// e "fornecedores". Apple pt-BR consultada em 21 nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac (Formatar > Tabela),
// apd93c815aa0/mac (Lista de Verificação), support.apple.com/pt-br/guide/iphone/
// iph1ac0b3a2/ios (Tabela, Formatação) e iphe4d04f674/27/ios/27 (Compartilhar Link).
// Sem imagem no original.

const ui = UI.pt;
const TEMPLATE = `Casamento de Maia e Samuel, 19 de junho de 2027

Local: Espaço Ipê
Limite de convidados: 48
Prazo para confirmação: 31 de maio de 2027
Número final para o espaço: 5 de junho de 2027
Última revisão: 21 de novembro de 2026

Convidados, exemplos
Convidado\tResposta e refeição
Lena Ortiz\tConfirmou; vegetariana
Alex Chen\tConfirmou; frango
Nora Patel\tAguardando resposta; refeição indefinida
Bruno Cardoso\tNão vai; recusou em 20 de novembro

Fornecedores
Fornecedor\tDecisão e próxima data
Local, Espaço Ipê\tReservado; enviar número final até 5 de junho
Buffet, Cozinha Oliveira\tOrçamento recebido; degustação em 28 de novembro
Fotógrafa, Estúdio Junho\tNa seleção; perguntar sobre cobertura da cerimônia

Próximas ações
Maia: confirmar horário da degustação com a Cozinha Oliveira até 24 de novembro
Samuel: perguntar ao Estúdio Junho sobre a cerimônia até 25 de novembro
Maia: incluir os demais convidados na lista até 29 de novembro
Samuel: anotar o saldo do espaço e o vencimento no orçamento até 30 de novembro

Questões em aberto
O buffet oferece prato principal vegano além do vegetariano?
Quem levará as flores depois da festa?
`;
const FAQ = [
  { q: "Como fazer uma checklist de casamento no Notas?", a: ["Cole este modelo em uma nota. No Mac, transforme os blocos de convidados e fornecedores em tabelas e as próximas ações em checklist. Troque os dados do exemplo."] },
  { q: "Meu parceiro pode editar a mesma nota?", a: ["Sim, se for uma nota do iCloud. Os dois precisam de Conta Apple com Notas ativado no iCloud. No iOS 27, toque em Compartilhar, abra o menu abaixo do título e escolha Compartilhar Link. Permita a edição."] },
  { q: "A lista recolhe confirmações de presença?", a: ["Não. Registre cada resposta você mesmo. Aguardando resposta é diferente de Não vai. O modelo não envia convites nem mantém uma contagem automática."] },
  { q: "O ChatGPT pode atualizar o plano no Pinto Notes?", a: ["Depois de conectado, ele pode ler e editar a nota com as respostas e os dados de fornecedores que você informar. O modelo não recebe essas respostas por conta própria."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="checklist-casamento-notas-iphone"
    intro={<>Copie este planejamento de casamento para o app Notas. Ele reúne convidados, respostas, fornecedores e próximas ações. O exemplo mostra como montar a nota no iPhone e no Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#configurar", label: "Configure" },
      { href: "#atualizar", label: "Mantenha atualizado" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Atualize com IA" },
    ]}><p>Use uma nota com uma tabela de convidados, outra de fornecedores e uma checklist com responsável e prazo em cada ação. Copie o modelo e formate cada bloco.</p>
      <PostCta slug="pt/checklist-casamento-notas-iphone" path="/pt/blog/checklist-casamento-notas-iphone" position="answer" ui={ui.cta} title="Peça à IA que atualize o plano">
        <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois de conectado, ChatGPT ou Claude pode atualizar a nota com as respostas e informações de fornecedores que você der.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modelo">Convidados e próximas decisões</h2>
    <p>O casamento de Maia e Samuel é fictício. As quatro linhas de convidados são uma amostra. Acrescente todas as pessoas que pretende convidar, uma por linha, inclusive casais. Assim cada resposta e refeição tem um nome.</p>
    <Keep title="Planejamento de casamento para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole como texto. Há um Tab entre as colunas das tabelas. Formate tabelas e checklist separadamente." />
    <h2 id="configurar">Configure no app Notas</h2>
    <Paths rows={[{ on: "Mac, tabelas", steps: ["Formatar", "Tabela"] }, { on: "Mac, tarefas", steps: ["Selecione as ações", "botão Lista de Verificação"] }, { on: "iPhone, tabelas", steps: ["botão Tabela"] }, { on: "iPhone, tarefas", steps: ["botão Lista de Verificação"] }]} />
    <p>No Mac, selecione as cinco linhas de Convidado até Bruno e clique em Tabela. Cada Tab vira uma coluna. Repita com as quatro linhas de Fornecedor até Estúdio Junho. Também pode escolher Formatar, Tabela. Tab na última célula cria outra linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a>.</p>
    <p>Selecione só as quatro próximas ações e clique no botão Lista de Verificação. Cada tarefa ganha um círculo. Deixe as respostas dos convidados como texto: ainda não responder é diferente de recusar.</p>
    <p>No iPhone, crie uma nota. Toque no botão Tabela para cada bloco e preencha as duas colunas. Para as ações, use o botão Lista de Verificação. Se quiser destacar os títulos, selecione o texto, toque em Formatação e escolha Cabeçalho. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia de formatação</a>.</p>
    <h2 id="atualizar">Mantenha o plano atualizado</h2>
    <p>Quando chegar uma resposta, mude a linha da pessoa e acrescente a refeição. Registre restrições alimentares como o convidado informou e confirme dúvidas com ele. Conte de novo os confirmados antes do prazo do espaço. O limite de 48 não é o número atual de presentes.</p>
    <p>Deixe a situação de cada fornecedor junto ao nome. Receber um orçamento não é fechar um contrato. Depois da decisão, atualize a situação e a próxima tarefa. Ponha valores e pagamentos em uma nota de <a href="/pt/blog/planilha-de-gastos-notas-iphone">orçamento</a> separada.</p>
    <p>Revisem as tarefas abertas uma vez por semana. Cada nova ação precisa de pessoa e data. Para editar juntos a mesma nota do iCloud no iOS 27, toque em Compartilhar, no menu abaixo do título e em Compartilhar Link. Os dois precisam de Conta Apple com Notas ativado no iCloud. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iphe4d04f674/27/ios/27">guia de compartilhamento da Apple</a>.</p>
    <h2 id="limites">Onde o modelo para</h2>
    <p>Não há formulário de confirmação, contagem automática, alerta por prazo nem mapa de mesas. Crie lembretes separados. Para filtrar uma lista longa por refeição ou somar totais, use uma planilha. O <a href="/blog/apple-notes-tables" hrefLang="en">guia de tabelas</a> (em inglês) explica os limites do Notas.</p>
    <h2 id="pinto-notes">Atualize com ChatGPT ou Claude</h2>
    <p>O Pinto Notes se parece e funciona como o app Notas no iPhone e no Mac, com tabelas e checklists. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês), a autorização Permitir dá acesso para ler e editar as notas.</p>
    <p>Informe que Nora confirmou presença e quer o prato vegano. Peça para atualizar a linha e criar uma tarefa para Maia confirmar a opção com o buffet até 24 de novembro. Confira a alteração com a resposta original. A IA só recebe as informações que você fornecer.</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
