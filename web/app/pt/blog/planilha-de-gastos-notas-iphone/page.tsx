import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "planilha-de-gastos-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-budget-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: the Notes User Guide for Mac, support.apple.com/pt-br/guide/notes/apda85974595/mac "Resolva cálculos no
// app Notas do Mac" (Formatar > Resultados de Cálculos, Return para inserir a resposta), apd0a136b9cc/mac "Adicione
// uma tabela no Notas do Mac" (Formatar > Tabela). Arquivo > Duplicar Nota is the pt_BR string in Notes on macOS
// 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "como fazer uma planilha de gastos no notas do
// iphone", "planilha de gastos no celular", "notas do iphone faz soma", "notas iphone soma"; nothing for "modelo de
// orçamento notas iphone". The template's names have no accents or spaces, so they work as variables. Facts are the
// English post's; the pictures are its English ones, described in Portuguese.

const ui = UI.pt;

const TEMPLATE = `Orçamento, novembro

Renda = 3200

Aluguel = 1200
Comida = 450
Transporte = 120
Celular = 30
Lazer = 150
Reserva = 500

Aluguel + Comida + Transporte + Celular + Lazer + Reserva =
Renda - Aluguel - Comida - Transporte - Celular - Lazer - Reserva =
`;

const FAQ = [
  { q: "O app Notas tem modelo de orçamento?", a: [
    "Não. O app Notas não tem nenhum modelo. Mas dá para fazer uma nota de orçamento que soma sozinha: dê um nome a cada valor, um por linha, depois some os nomes com um sinal de igual, e os Resultados de Cálculos preenchem o total.",
  ] },
  { q: "O Notas do iPhone faz contas?", a: [
    "Sim, com os Resultados de Cálculos. Digite uma conta terminando com o sinal de igual e o Notas sugere a resposta. Valores com nome, como Aluguel = 1200, podem ser usados nas contas seguintes, e mudar um deles atualiza todas as respostas abaixo.",
  ] },
  { q: "Por que minha tabela de orçamento no Notas não soma?", a: [
    "Os Resultados de Cálculos não funcionam dentro de uma tabela. Se quiser, mantenha a tabela para ler e coloque os valores com nome e as contas em linhas comuns embaixo dela.",
  ] },
  { q: "Existe um app de orçamento grátis que funciona como uma nota?", a: [
    "O Pinto Notes tem um modelo grátis de orçamento e despesas: uma nota que é um pequeno app, com o que sobra neste mês, cada categoria comparada com o orçamento dela, as contas mensais e os últimos seis meses. O ChatGPT ou o Claude podem lançar nele o que você gastou.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="planilha-de-gastos-notas-iphone"
      intro={<>
        Você quer controlar os gastos onde já anota tudo, e não em mais um app com login. O app Notas faz mais disso do que parece. Aqui
        está um modelo para colar que soma sozinho, até onde ele vai e o que usar quando ele não bastar mais.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#como-soma", label: "Como ele soma" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um orçamento que se cuida" },
        ]}>
          <p>
            O app Notas não tem modelos, mas uma nota de orçamento ainda faz as contas. Coloque cada valor numa linha com um nome, como
            Aluguel = 1200, depois some os nomes com um sinal de igual no final, e os Resultados de Cálculos preenchem o total e o que
            sobra. Copie o modelo abaixo para uma nota nova.
          </p>
          <PostCta template="budget-log" slug="pt/planilha-de-gastos-notas-iphone" path="/pt/blog/planilha-de-gastos-notas-iphone" position="answer" ui={ui.cta}
            title="Quer um orçamento que se mantém sozinho?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de orçamento e despesas: o que sobra neste mês, cada categoria comparada com o orçamento dela e as contas que se repetem. Conte ao ChatGPT ou ao Claude o que você gastou e ele lança o gasto.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Uma nota chamada Sequoia Group Expenses no iPhone: cada gasto com nome na sua linha, os nomes somados em US$ 475, e US$ 475 dividido por 5 dando US$ 95 para cada um."
        caption="O exemplo da própria Apple do truque por trás de uma nota de orçamento: dê nome a cada valor e depois some os nomes. Imagem: Apple." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: um orçamento mensal que soma sozinho</h2>
      <p>
        Crie uma nota nova e cole isto. Troque os valores e os nomes pelos seus; qualquer nome funciona, desde que você escreva do mesmo
        jeito todas as vezes.
      </p>
      <Keep title="Orçamento mensal para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="O Notas sugere cada resposta depois do sinal de igual. Pressione Return para manter." />
      <p>
        A primeira conta é o que você planejou gastar. A segunda é o que sobra da sua renda depois de tirar tudo, inclusive a reserva. Se a
        segunda resposta ficar abaixo de zero, o plano não cabe.
      </p>
      <p>
        Mantenha uma nota por mês. No Mac, Arquivo, Duplicar Nota copia a do mês passado, e você só muda o título e os valores que mudaram.
        Se você usa outros modelos também, o guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em
        inglês) mostra como montar uma pasta de modelos.
      </p>

      <h2 id="como-soma">Como ele soma</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="Uma tabela Moving budget no app Notas do macOS 27. A célula Total mostra 85+240+180= sem resposta. Embaixo da tabela, Boxes = 85, Van = 240 e Cleaning = 180 têm nome, e Boxes + Van + Cleaning = mostra 505 como sugestão do Notas."
        caption="No macOS 27: dentro da tabela, a conta fica parada. Em linhas com nome embaixo dela, o Notas responde: 505." />
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Resultados de Cálculos"] }]} />
      <p>
        O Notas chama isso de Resultados de Cálculos. Uma linha como Aluguel = 1200 dá um nome ao número, e qualquer linha seguinte que
        termine com o sinal de igual ganha a resposta. Mude Comida de 450 para 500 e os dois totais acompanham, que é quase tudo o que uma
        planilha de gastos faz por você. Se nenhuma resposta aparecer no Mac, confira se Formatar, Resultados de Cálculos está ativado.
      </p>
      <p>
        Um porém: isso não funciona dentro de uma tabela. Os Resultados de Cálculos se desligam enquanto você está numa tabela, então uma
        célula Total fica só como texto. O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês)
        mostra o que as tabelas fazem e o que não fazem.
      </p>

      <h2 id="limites">Onde um orçamento no Notas para</h2>
      <ul>
        <li><strong>Os gastos são lançados à mão.</strong> Para acompanhar o que você gastou de verdade, você adiciona uma linha para cada compra e um nome na conta. Depois de algumas semanas, a linha da conta fica enorme.</li>
        <li><strong>Nada de meses lado a lado.</strong> Cada mês é uma nota, então comparar este mês com os últimos seis significa abrir seis notas.</li>
        <li><strong>Nada de contas que se repetem.</strong> O aluguel e as assinaturas precisam ser digitados na nota de cada mês.</li>
        <li><strong>Nada de limite por categoria.</strong> Você vê quanto sobra no total, mas não que comer fora estourou e o transporte ficou abaixo.</li>
      </ul>
      <p>
        Para um plano que você monta uma vez por mês, a nota basta. Se você quer registrar os gastos na hora em que acontecem, é aí que a
        nota não dá conta.
      </p>

      <h2 id="pinto-notes">Uma nota de orçamento que se mantém sozinha</h2>
      <Figure shot={{ ...SHOTS.budgetApp, alt: "O app de orçamento numa nota do Pinto Notes no Mac: 8.205 kr sobrando em outubro, cerca de 410 kr por dia depois das contas, um gráfico dos últimos seis meses, as contas do mês e cada categoria comparada com o orçamento, com o que passou do mês anterior." }}
        caption="O modelo Budget and expenses no Pinto Notes num Mac, com dados de exemplo: o que sobra neste mês, os últimos seis meses, as contas e cada categoria comparada com o orçamento." />
      <p>
        É para isso que existe o Pinto Notes. Ele tem a cara do app Notas e funciona como ele no iPhone e no Mac, e uma nota também pode
        ser um pequeno app. O modelo grátis <a href="/templates/budget-log">Budget and expenses</a> é um deles: você define uma vez o
        orçamento mensal de cada categoria, e ele mostra o que sobra neste mês com uma barra, cada categoria comparada com o orçamento e o
        que passou do mês anterior, suas contas mensais e os últimos seis meses. Lance um gasto com um toque, e ele faz as contas.
      </p>
      <p>
        Você também pode contar ao ChatGPT ou ao Claude o que gastou, na conversa que já usa, e ele lança o gasto na nota. Quem faz as
        contas é o app, não a IA. O post <a href="/blog/budget-tracker-with-chatgpt-or-claude" hrefLang="en">sobre um orçamento que a sua
        IA mantém</a> (em inglês) mostra como funciona.
      </p>
      <p>
        O app está em inglês. Suas notas do app Notas vêm junto em{" "}
        <a href="/blog/import-your-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
