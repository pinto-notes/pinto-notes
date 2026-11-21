import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "integracao-novo-funcionario-notas-iphone");
// Versão pt-BR de /blog/apple-notes-employee-onboarding-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "checklist onboarding funcionario" e "integração
// de novos funcionários checklist" não trouxeram sugestões; "integração de funcionários"
// e "onboarding de novos funcionários" apareceram em consultas mais amplas.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (Formatação, Cabeçalho), apd93c815aa0/mac (Checklist), apd0a136b9cc/mac
// (Tabela, Formatar > Tabela, Tab), /guide/iphone/iph1ac0b3a2/ios (criação de nota,
// Formatação, Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar).
// O guia do iPhone não nomeia os ícones de nota nova e tabela; os passos descrevem a ação.
const ui = UI.pt;
const TEMPLATE = `Primeiro mês na Serra Ferramentas

Nome: Luiza Costa, atendimento ao cliente
Início: 23 de novembro de 2026. Conversa do primeiro mês: 18 de dezembro.
Gestora: Ana Ribeiro. Pessoa de apoio: Leo Martins.

O que significa ir bem
Até a conversa, responder dúvidas comuns sobre entregas com revisão de Leo.
Saber quando encaminhar pedidos de reembolso. Confirmar as expectativas com Ana.

Pessoas
Pessoa\tPerguntar sobre
Ana Ribeiro, gestora\tPrioridades e retorno. Conversa semanal na sexta-feira.
Leo Martins, apoio\tRascunhos de resposta e dúvidas sobre entregas. Trabalhar juntos na terça-feira.
Nina Souza, TI\tPedidos de acesso pelo portal de suporte da TI.

Sistemas e páginas de consulta
Manual da equipe: intranet da empresa, Atendimento / Comece aqui.
Guia de entregas: intranet da empresa, Atendimento / Dúvidas de entrega.
Central de atendimento: chamado de TI 4821 aberto em 23 de novembro. Acesso pendente.
Calendário da equipe: acesso testado em 23 de novembro.

Perguntas e respostas
Em aberto, para Ana: quais reembolsos precisam da aprovação de uma gestora? Perguntar em 27 de novembro.
Respondida em 23 de novembro, por Leo: onde ficam exemplos de resposta? Atendimento / Respostas de exemplo.

Semana 1, 23 a 27 de novembro
Confirmar com Ana as expectativas do primeiro mês
Testar o acesso à central quando o chamado 4821 for resolvido
Ler o guia de entregas e acompanhar Leo em duas dúvidas

Semana 2, 30 de novembro a 4 de dezembro
Rascunhar três respostas sobre entrega para Leo revisar
Pedir a Ana que explique as regras para encaminhar reembolsos

Semana 3, 7 a 11 de dezembro
Responder cinco dúvidas comuns sobre entrega com revisão de Leo
Anotar um passo confuso no guia de entregas

Semana 4, 14 a 18 de dezembro
Separar duas respostas revisadas para a conversa do primeiro mês
Revisar o progresso com Ana e combinar o próximo objetivo de aprendizagem

Registro do aprendizado
23 de novembro: encontrou as respostas de exemplo com Leo. Acesso à central ainda pendente.

Conversa do primeiro mês
18 de dezembro: levar respostas revisadas e perguntas ainda abertas.
Depois da conversa: registrar aqui o retorno recebido e o próximo objetivo.
`;
const PROMPT = `Leia minha nota do Pinto Notes "Primeiro mês na Serra Ferramentas".
Acrescente esta resposta confirmada em Perguntas e respostas:
27 de novembro de 2026, Ana: todos os pedidos de reembolso vão para a liderança do turno aprovar.
Substitua a pergunta aberta sobre aprovação de reembolsos por essa resposta com data.
Mantenha as outras perguntas, a situação do acesso e as checklists semanais como estão.
Depois liste no chat as perguntas ainda abertas e quem eu deveria consultar.
Use apenas a nota e a resposta acima. Não invente regras da empresa nem marque treinamentos como concluídos.
Pergunte antes de editar se não encontrar a nota ou a pergunta certa.`;
const FAQ = [
  { q: "O que colocar numa nota de integração de funcionário?", a: ["Registre expectativas do cargo, pessoas a consultar, situação dos acessos, materiais de referência e perguntas abertas. Use uma checklist para cada uma das quatro primeiras semanas e anote respostas com data."] },
  { q: "Como acompanhar um acesso pendente?", a: ["Escreva o sistema, número e data do chamado e quem o atende. Mantenha pendente até testar o acesso. Guarde senhas no gerenciador aprovado pela empresa, nunca na nota."] },
  { q: "A checklist substitui o processo da empresa?", a: ["Não. Ela é sua referência pessoal. Use o processo oficial para documentos, treinamentos obrigatórios e acessos. Marcar a nota não envia nada a esses sistemas."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="integracao-novo-funcionario-notas-iphone"
    intro={<>Copie este modelo de integração de novo funcionário para o app Notas. Guarde pessoas, sistemas e dúvidas junto de uma checklist para cada semana do primeiro mês.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#montar", label: "Monte a nota" },
      { href: "#primeiro-mes", label: "Use a cada semana" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Registre respostas" },
    ]}>
      <p>Use uma nota para registrar expectativas, contatos, acessos e perguntas ainda abertas. O exemplo acompanha uma nova pessoa da equipe de atendimento, com tabela de contatos e quatro checklists semanais.</p>
      <div id="modelo"><Keep title="Integração de funcionário para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Exemplo fictício. Troque nomes e datas. A lista de pessoas pode virar tabela; as tarefas de cada semana, checklist." /></div>
      <PostCta slug="pt/integracao-novo-funcionario-notas-iphone" path="/pt/blog/integracao-novo-funcionario-notas-iphone" position="answer" ui={ui.cta} title="Registre uma resposta confirmada com sua IA"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Depois de conectar ChatGPT ou Claude, você pode pedir que acrescente respostas confirmadas. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a nota no app Notas</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Alguns recursos não funcionam em contas de outros provedores. Cole o texto primeiro e troque os caminhos de exemplo pelos links reais da equipe.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Formatação", "Cabeçalho"] },
      { on: "Mac", steps: ["Formatar", "Tabela"] },
      { on: "iPhone", steps: ["Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, selecione um nome de seção, use Formatação e escolha Cabeçalho. Selecione só as tarefas da Semana 1 e clique em Checklist. Repita nas outras semanas. Marque os círculos quando terminar.</p>
    <p>Para a tabela de pessoas, selecione as quatro linhas de Pessoa até Nina Souza e clique em Tabela. As tabulações separam as colunas. Também pode escolher Formatar, Tabela e preencher as células. Tab na última célula acrescenta uma linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a> e <a href="/blog/apple-notes-tables" hrefLang="en">mais controles</a> (em inglês).</p>
    <p>No iPhone, crie uma nota e cole. Selecione nomes de seção, toque em Formatação e escolha Cabeçalho. Para cada semana, use Checklist e Voltar entre tarefas; depois apague as linhas originais. Em Pessoas, adicione uma tabela, preencha as duas colunas e apague o texto solto. Veja os guias da Apple de <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">formatação</a> e <a href="https://support.apple.com/pt-br/102296">checklists</a>.</p>

    <h2 id="primeiro-mes">Mantenha o registro útil no primeiro mês</h2>
    <p>Troque as metas do exemplo por expectativas combinadas com sua gestora. Luiza deve escrever respostas com revisão. Deixe como não confirmada qualquer expectativa ainda não discutida.</p>
    <p>No fim de cada dia, anote respostas com data e nome de quem respondeu. Deixe perguntas abertas visíveis, com pessoa e data para voltar ao assunto. Se um chamado aparecer como resolvido, teste o sistema antes de mudar o status na nota.</p>
    <p>A cada sexta-feira, revise a checklist e dê nova data ao que faltou. Anote algo que aprendeu a fazer. Para conversas mais longas com a gestora, use a <a href="/pt/blog/reuniao-one-on-one-notas-iphone">nota de reunião individual</a>.</p>
    <p>Antes da conversa do primeiro mês, separe exemplos ligados às metas combinadas. Luiza leva duas respostas revisadas e perguntas abertas. Depois, registra o retorno e o próximo objetivo.</p>

    <h2 id="limites">Onde a nota para</h2>
    <p>A nota registra o que você escreve. Não libera acesso nem envia comprovantes de treinamento. Siga o processo de integração da empresa. Guarde notas de trabalho apenas onde ela permite, e senhas e documentos pessoais nos sistemas aprovados.</p>
    <p>As datas semanais não criam lembretes. Você ainda precisa fazer as perguntas e confirmar as respostas. O número do chamado ajuda a acompanhar acessos pendentes.</p>

    <h2 id="pinto">Acrescente uma resposta confirmada com ChatGPT ou Claude</h2>
    <p>O formato funciona no Pinto Notes no Mac e no iPhone. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar notas. Dê uma resposta confirmada e peça que a coloque junto da pergunta certa.</p>
    <Keep title="Peça à IA que atualize a nota" text={PROMPT} copyLabel={ui.copy} note="A resposta é um exemplo. Troque-a por informação confirmada antes de usar o pedido." />
    <p>Abra a nota alterada e confira data, pessoa e texto. No exemplo, reembolsos vão à liderança do turno. O acesso continua pendente e nenhuma tarefa semanal foi marcada. Confira também a lista de perguntas abertas. O Pinto guarda versões anteriores das notas.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
