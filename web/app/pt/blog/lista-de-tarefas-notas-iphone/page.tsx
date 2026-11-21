import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "lista-de-tarefas-notas-iphone");

// Versão pt-BR de /blog/apple-notes-to-do-list, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: lista de tarefas no notas do iphone não teve sugestões; lista de tarefas iphone, como fazer lista de tarefas no iphone.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/102296, support.apple.com/pt-br/guide/notes/apd93c815aa0/mac, support.apple.com/pt-br/102484, support.apple.com/pt-br/guide/notes/apd58edc7964/mac.
// As opções não confirmadas em páginas pt-BR aparecem como ações, sem nome inventado.
const ui = UI.pt;
const TEMPLATE = `# Tarefas

## Hoje
- [ ] Enviar orçamento para João
- [ ] Ligar para minha mãe
- [ ] Devolver a encomenda

## Nesta semana
- [ ] Comprar passagens para dezembro
- [ ] Revisar a apresentação da Ana
- [ ] Agendar a revisão do carro

## Na rua
- [ ] Buscar roupa na lavanderia
- [ ] Comprar luz para a bicicleta

## Aguardando
- [ ] João: aprovar o orçamento

## Um dia
- [ ] Renovar o passaporte
- [ ] Organizar a garagem
`;

const FAQ = [
  { q: "Como crio uma lista de tarefas no Notas?", a: ["Crie uma nota, toque no botão Checklist e digite um item por linha. No Mac, clique no botão ou pressione Shift + Command + L."] },
  { q: "O Notas ordena as tarefas?", a: ["Pode mover itens marcados para o fim automaticamente. Para qualquer outra ordem, arraste os itens."] },
  { q: "Notas ou Lembretes para tarefas?", a: ["Use Lembretes quando precisar de data, horário ou alerta por lugar. Use a checklist do Notas para listas que você consulta de uma vez."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="lista-de-tarefas-notas-iphone"
    intro={<> Uma checklist no Notas começa com um botão. O modelo abaixo separa tarefas por momento, e uma Pasta Inteligente ajuda a achar o que falta. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"Iphone"},{href:"#mac",label:"Mac"}]}>
      <p>Crie uma nota, toque no botão Checklist e digite uma tarefa por linha. Nos ajustes, você pode mandar os itens marcados para baixo. Copie o modelo abaixo.</p>
      <PostCta slug="pt/lista-de-tarefas-notas-iphone" path="/pt/blog/lista-de-tarefas-notas-iphone" position="answer" template="weekly-planner" ui={ui.cta} title="Modelo grátis no Pinto Notes">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude ajudar a manter a nota. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640} alt="Lista de compras no Notas para Mac com itens marcados no fim." caption="Uma lista de tarefas funciona como esta checklist. Captura: Pinto Notes." />
<h2 id="iphone">Crie a lista no iPhone</h2>
<ol><li>Abra o Notas e crie uma nota.</li><li>Digite um título, toque em Retorno e depois no botão Checklist.</li><li>Digite a primeira tarefa. Retorno cria a próxima linha.</li><li>Toque no círculo para marcar o que terminou.</li></ol>
<p>Você também pode selecionar linhas já digitadas e transformá-las em checklist. Arraste um item para mudar a ordem; deslize para recuar ou desfazer o recuo.</p>
<h2 id="mac">Crie a lista no Mac</h2>
<p>Na nota, clique no botão Checklist ou pressione Shift + Command + L. Selecione linhas existentes para convertê-las de uma vez. Clique no círculo ou use Shift + Command + U para marcar um item. Arraste para reordenar, use Control + Command + seta para mover e Tab ou Shift + Tab para ajustar o recuo. Uma lista do iCloud aparece também no iPhone.</p>
<h2 id="modelo">Modelo de lista de tarefas</h2>
<p>O Notas não tem modelos próprios. Esta nota separa o que fazer hoje, nesta semana, na rua, o que depende de outra pessoa e o que pode esperar. Troque os exemplos pelas suas tarefas.</p>
<Keep title="Lista de tarefas para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="No Mac com macOS 27, cole como Markdown para criar cabeçalhos e checklists." />
<p>No iPhone, você pode colar o texto e selecionar as linhas de tarefas para aplicar Checklist. Mantenha uma palavra em cada item: uma linha vazia da checklist não sobrevive à colagem. Para planejar por dia, veja <a href="/blog/apple-notes-planner-template" hrefLang="en">o modelo semanal</a>.</p>
<h2 id="ordenar">Leve as tarefas prontas para baixo</h2>
<p>No iPhone, abra Ajustes, Apps, Notas e a opção de ordenar itens marcados; escolha a ordenação automática. No Mac, ative a mesma ideia nos ajustes do Notas. Cada aparelho tem sua própria opção, que vale para todas as checklists nele. O Notas não classifica tarefas por nome ou prioridade: arraste as mais importantes. No Mac, você pode desmarcar todos os itens de uma lista repetida.</p>
<h2 id="varias">Acompanhe mais de uma lista</h2>
<PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700} alt="Regra de Pasta Inteligente para notas com itens abertos em checklists." caption="Uma Pasta Inteligente encontra notas com tarefas não marcadas." />
<p>Fixe a lista principal, use uma etiqueta como #tarefas nas demais e compartilhe uma lista com pessoas que tenham Conta Apple. Uma Pasta Inteligente pode reunir notas que ainda têm itens não marcados, mesmo em pastas diferentes. Para prazos e avisos por horário ou lugar, use o app Lembretes.</p>
<h2 id="limites">Onde o Notas para</h2>
<p>A checklist não tem alerta nem data de vencimento. Itens marcados se acumulam embaixo; tarefas não concluídas hoje não passam sozinhas para amanhã. A ordem e a seção de cada item dependem de você.</p>
<h2 id="pinto">Uma lista que sua IA ajuda a manter</h2>
<PostFigure src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600} alt="Planejador semanal no Pinto Notes, com três prioridades, tarefas por dia e lista para depois." caption="Um exemplo do modelo grátis de planejamento semanal." />
<p>No Pinto Notes, ChatGPT ou Claude podem adicionar tarefas a partir de uma mensagem e limpar as já marcadas. O modelo grátis de <a href="/templates/weekly-planner">planejamento semanal</a> tem três prioridades, uma seção por dia e uma lista para depois. Peça à IA para levar tarefas abertas a hoje; no domingo, ela pode limpar as concluídas e mover as restantes para segunda-feira. Você também pode editar tudo à mão, e as versões anteriores ficam guardadas. As listas do Notas podem ser importadas no Mac sem alterar o original.</p>


<p>Leia também: <a href="/blog/apple-notes-checklist-sort" hrefLang="en">ordenação das checklists</a>, <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas e Pastas Inteligentes</a>, <a href="/blog/apple-notes-templates" hrefLang="en">modelos para o Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
