import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "matriz-eisenhower-notas-iphone");
// Versão pt-BR de /blog/apple-notes-eisenhower-matrix-template, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "matriz eisenhower" sugeriu "matriz eisenhower exemplos" e "matriz eisenhower modelo"; a consulta com "notas iphone" não sugeriu termos.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac, apd1955d3b21/mac, not9474646a9/mac; support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
const ui = UI.pt;
const TEMPLATE = `Lançamento das reservas do café, semana de 23 de novembro

Resultado: lançar a nova página de reservas em 27 de novembro.
Revisão: 24 de novembro, 9h.

Fazer: urgente e importante
Corrigir o formulário de reservas no celular antes dos testes de hoje. O botão de envio não funciona.
Enviar o link de teste à dona do café até as 17h de 23 de novembro. Ela dará retorno amanhã.

Agendar: importante, sem urgência
Testar os e-mails de confirmação em 25 de novembro, às 10h, antes do lançamento.
Escrever o guia de repasse em 26 de novembro, às 14h, para que a dona possa atualizar os horários.

Delegar ou reduzir: urgente, pouco importante para o resultado
Pedir a João que redimensione a imagem do banner até 24 de novembro. Confirmar se ele pode assumir.
Responder ao convite opcional para a reunião de lançamento até as 16h de hoje. Pedir atualização por escrito.

Descartar: sem urgência nem importância
Não procurar novos temas para o site. O visual atual foi aprovado.
Deixar os ícones das pastas internas como estão. Eles não afetam a página de reservas.
`;
const PROMPT = `Leia minha nota "Lançamento das reservas do café, semana de 23 de novembro". Sugira aqui na conversa mudanças nas quatro listas da matriz de Eisenhower. Avalie a importância pelo resultado definido e a urgência pelos prazos e consequências escritos na nota. Explique cada mudança proposta. Pergunte quando faltar informação, sem inventar prazos ou supor que alguém poderá assumir uma tarefa. Não edite a nota antes de eu aprovar as mudanças.`;
const FAQ = [
  {q:"Como fazer uma matriz de Eisenhower no Notas?",a:["Crie quatro cabeçalhos numa nota: Fazer, Agendar, Delegar ou reduzir e Descartar. Ponha uma checklist em cada seção. O modelo começa como texto simples."]},
  {q:"Preciso de uma tabela?",a:["Não. Quatro checklists dão espaço para prazo e motivo em cada tarefa e permitem marcá-la como concluída."]},
  {q:"E uma tarefa urgente, mas pouco importante?",a:["Veja o que acontece se ela esperar. Peça ajuda a alguém adequado, reduza o trabalho ou recuse. Ter prazo não basta para ser importante."]},
  {q:"O que vai em Agendar?",a:["Trabalho importante que pode esperar. Escreva quando pretende fazê-lo, mas reserve o horário no calendário separadamente."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="matriz-eisenhower-notas-iphone"
    intro={<>Monte uma matriz de Eisenhower no Notas com quatro checklists. Copie o exemplo e distribua suas tarefas por importância e urgência.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modelo",label:"Modelo"},{href:"#preparar",label:"Preparar"},{href:"#priorizar",label:"Priorizar"},{href:"#limites",label:"Limites"},{href:"#pinto",label:"Usar IA"}]}>
      <p>Escreva o resultado acima das quatro listas e dê a cada tarefa um motivo para estar ali. O exemplo organiza o lançamento da página de reservas de um café.</p>
      <PostCta slug="pt/matriz-eisenhower-notas-iphone" path="/pt/blog/matriz-eisenhower-notas-iphone" position="answer" ui={ui.cta} title="Confira as prioridades no Pinto Notes"><p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois da conexão, ChatGPT ou Claude pode ler a nota e sugerir mudanças para você conferir. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modelo">Modelo com quatro listas e motivos</h2>
    <p>O formulário quebrado impede os testes de hoje. O guia de repasse importa para o lançamento, mas pode esperar. A reunião opcional pede uma resposta sem tomar uma hora de trabalho.</p>
    <Keep title="Matriz de Eisenhower para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole como texto simples. Formate os nomes das seções como cabeçalhos e as tarefas como checklists." />
    <h2 id="preparar">Prepare no Mac ou iPhone</h2>
    <p>Use uma nota do iCloud ou armazenada no aparelho. Segundo a Apple, alguns recursos de formatação podem faltar em contas de outros provedores.</p>
    <MenuPaths rows={[{on:"Mac",steps:["Botão de formatação","Cabeçalho"]},{on:"iPhone",steps:["Botão Formatação","Cabeçalho"]}]} />
    <p>No Mac, cole o texto e substitua o resultado e as tarefas. Selecione cada nome de seção e aplique Cabeçalho. Depois selecione somente as tarefas abaixo dele e clique no botão Checklist. Repita nas quatro seções.</p>
    <p>No iPhone, toque no botão Nova Nota. Digite título, resultado e data da revisão. Formate o nome de cada seção como Cabeçalho. Abaixo, use o botão Checklist e toque em Retorno para acrescentar tarefas. Marque o círculo de uma tarefa quando terminar; na seção Descartar, marque quando decidir deixá-la de fora.</p>
    <p>Para outro projeto no Mac, selecione a nota e use Arquivo &gt; Duplicar Nota. Veja também <a href="/blog/apple-notes-templates" hrefLang="en">modelos para o Notas</a>.</p>
    <h2 id="priorizar">Decida o que importa e o que não pode esperar</h2>
    <p>Primeiro pergunte se a tarefa ajuda o resultado escrito no topo ou evita uma consequência real. Depois, confira o prazo e as dependências. Uma preferência não é necessariamente uma urgência.</p>
    <ul><li>Fazer: trabalho importante que não pode esperar, como consertar o botão antes dos testes.</li><li>Agendar: trabalho importante com tempo disponível, como o guia de repasse. Reserve o horário fora da nota.</li><li>Delegar ou reduzir: algo que pede resposta rápida, mas pouco contribui para o resultado. Confirme com João antes de atribuir-lhe a imagem.</li><li>Descartar: trabalho deixado de lado por decisão. Guardar o motivo evita que volte como pendência inexplicada.</li></ul>
    <p>Se você trabalha sozinho, reduzir pode significar fazer uma versão menor, adiar com acordo ou recusar. Mover uma linha não transfere responsabilidade. Na próxima revisão, confira prazos e prioridades outra vez. A <a href="/pt/blog/revisao-semanal-notas-iphone">revisão semanal</a> pode ajudar.</p>
    <h2 id="limites">O que a matriz não faz</h2>
    <p>Você decide onde cada item entra e quando movê-lo. Escrever uma data não reserva horário no calendário. Escrever o nome de João não envia uma mensagem a ele.</p>
    <h2 id="pinto">Revise a nota com ChatGPT ou Claude</h2>
    <p>O Pinto Notes tem cabeçalhos e checklists. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, a IA pode ler e editar a nota. Peça sugestões antes de autorizar mudanças.</p>
    <Keep title="Peça uma revisão das prioridades" text={PROMPT} copyLabel={ui.copy} note="Troque o título pelo da sua nota e confira cada sugestão com seus prazos reais." />
    <p>Se a IA quiser adiar o formulário quebrado, lembre que os testes dependem dele hoje. Corrija prazos inventados. Depois da sua aprovação, peça a edição. O Pinto guarda as versões anteriores. As notas da Apple podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas no Mac</a> sem alteração do original.</p>
  </LocalPostPage>;
}
