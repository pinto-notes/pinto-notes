import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "controle-de-gastos-notas-iphone");

// Versão pt-BR de /blog/apple-notes-expense-tracker, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: controle de gastos no iphone; planilha de gastos notas iphone.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apda85974595/mac, support.apple.com/pt-br/guide/iphone/iph46efa613a/ios, support.apple.com/pt-br/guide/iphone/iphb9c2b948f/ios.
// As opções não confirmadas em páginas pt-BR aparecem como ações, sem nome inventado.
const ui = UI.pt;
const TEMPLATE = `Gastos, novembro

Data	Compra	Categoria	Valor
1 nov	Mercado da semana	Mercado	412
2 nov	Ônibus	Transporte	85
3 nov	Pizza com amigos	Restaurante	230
5 nov	Lâmpadas	Casa	64
6 nov	Mercado da semana	Mercado	238
8 nov	Cinema	Lazer	150

Mercado = 412 + 238
Transporte = 85
Restaurante = 230
Casa = 64
Lazer = 150

Mercado + Transporte + Restaurante + Casa + Lazer =
`;

const FAQ = [
  { q: "Posso controlar gastos no Notas?", a: ["Sim. Registre compras numa tabela e some os valores por categoria em linhas abaixo dela."] },
  { q: "Por que a soma não funciona dentro da tabela?", a: ["Resultados de Cálculos não fazem a conta numa célula. Ponha as fórmulas no texto abaixo da tabela."] },
  { q: "O Notas tem modelo de gastos?", a: ["Não tem modelos próprios. Copie o modelo desta página e duplique a nota a cada mês."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="controle-de-gastos-notas-iphone"
    intro={<> Uma tabela guarda as compras do mês. Abaixo dela, Resultados de Cálculos fazem as somas. Copie o modelo e veja como mantê-lo em dia. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modelo",label:"Modelo"},{href:"#preparar",label:"Preparar"}]}>
      <p>Registre uma compra por linha numa tabela. Abaixo dela, escreva uma soma por categoria e um total. Resultados de Cálculos calculam no texto, fora da tabela.</p>
      <PostCta slug="pt/controle-de-gastos-notas-iphone" path="/pt/blog/controle-de-gastos-notas-iphone" position="answer" template="budget-log" ui={ui.cta} title="Modelo grátis no Pinto Notes">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude ajudar a manter a nota. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360} alt="Exemplo de despesas no Notas do iPhone, com valores nomeados e total calculado." caption="O exemplo da Apple soma valores pelo nome. Imagem: Apple." />
<h2 id="modelo">O modelo</h2>
<p>Uma linha por compra, com data, descrição, categoria e valor. Abaixo da tabela, uma linha por categoria faz a conta, e a última soma todas. O Notas não calcula dentro das células da tabela.</p>
<Keep title="Controle de gastos para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cada coluna está separada por tabulação. Transforme as linhas de compras em tabela e mantenha as contas abaixo." />
<p>Mude as categorias conforme sua vida. Para as contas, use um nome de uma palavra com letras latinas e defina cada categoria antes de somá-la no total.</p>
<h2 id="preparar">Prepare a nota</h2>
<ol><li>Cole o modelo numa nota do iCloud ou em uma nota local do Mac.</li><li>Selecione as linhas de Data até a última compra e use o botão Tabela. As tabulações viram colunas.</li><li>Confira Resultados de Cálculos nas opções de formatação. Se estiver desativado, o total não aparece; você pode optar por sugerir ou inserir o resultado.</li><li>No mês seguinte, duplique a nota no Mac, apague as compras, reinicie as categorias e troque o título.</li></ol>
<p>Veja <a href="/blog/apple-notes-tables" hrefLang="en">como funcionam as tabelas</a>.</p>
<h2 id="rotina">Ao longo do mês</h2>
<p>Registre a compra assim que pagar. Tab na última célula acrescenta uma linha. Adicione o mesmo valor à linha da categoria, abaixo da tabela, para atualizar o total. Fixe a nota do mês; a busca acha uma compra pelo nome. Para planejar limites antes de gastar, mantenha ao lado <a href="/pt/blog/planilha-de-gastos-notas-iphone">o modelo de orçamento</a>.</p>
<h2 id="limites">Onde o Notas para</h2>
<p>Cada valor precisa ser digitado duas vezes; se você esquecer a linha da categoria, o total fica errado. A tabela não classifica nem soma. Meses ficam em notas separadas e contas recorrentes precisam ser copiadas. Com muitas compras, conferir as linhas leva mais tempo do que registrar.</p>
<h2 id="pinto">Um controle de gastos que calcula</h2>
<Figure shot={SHOTS.budgetApp} caption="Modelo Orçamento e gastos no Pinto Notes, com dados de exemplo." />
<p>O modelo grátis <a href="/templates/budget-log">Orçamento e gastos</a> do Pinto Notes define um limite por categoria, registra compras, contas mensais e mostra quanto resta no mês e nos últimos seis meses. Você digita cada valor uma vez. Depois de conectar ChatGPT ou Claude, pode contar uma compra na conversa e pedir um resumo do mês. O app não se conecta ao banco. Cada edição pode ser desfeita e as notas do Apple Notes podem ser importadas no Mac sem alterar o original.</p>


<p>Leia também: <a href="/blog/budget-tracker-with-chatgpt-or-claude" hrefLang="en">orçamento com IA</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, e <a href="/blog/import-your-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
