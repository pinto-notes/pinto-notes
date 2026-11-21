import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "manutencao-da-casa-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-home-maintenance-checklist (21 Nov 2026). Apple's own pt-BR words,
// read 21 Nov: support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela, botão Tabela), apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist, Formatar > Mais >
// Desmarcar Tudo, "Ordenar automaticamente os itens marcados"), apd58edc7964/mac "Use Pastas Inteligentes no app Notas
// do Mac" (Pasta Inteligente, filtro Checklists) and support.apple.com/pt-br/102462 "Se você não conseguir colaborar no
// app Notas" (Conta Apple). Apple's pt-BR page gives no shortcut; Option-Command-T is from the English post, which
// tried it on macOS 27. Editar > Colar como Markdown (new in macOS 27) is the pt_BR string in Notes on macOS 27.2. Not
// verified: the pt-BR name of the Smart Folder option for unchecked items (Apple's pt-BR page shows only "Marcado"),
// so the text describes it instead of naming it. Slug and title from Google autocomplete (pt-BR, 21 Nov): "manutenção
// da casa", "manutenção da casa alugada", "manutenção preventiva casa", "manutenção residencial", "checklist casa
// nova"; nothing for "checklist manutenção casa". The example jobs fit a Brazilian home (the gas water heater instead
// of a boiler, a water filter), with made-up phone numbers. The Pinto template's own choices (Month, 3 months, 6 months,
// Year) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

const NOTE = `# Manutenção da casa

As tarefas que mantêm a casa funcionando, de quanto em quanto tempo vencem e quando foram feitas pela última vez.

## Tarefas
Cole a tabela de tarefas embaixo desta linha.

## Este mês
- [ ] Testar o detector de fumaça (vence 14/11)
- [ ] Revisar o aquecedor a gás (vence 20/11)
- [ ] Limpar as calhas (vence 24/11)

## Para quem ligar
- Encanador: Hidráulica Silva, (11) 3456-0427
- Eletricista: Volt Fix, (11) 3456-0463

## Aparelhos
- Lava-louças: Bosch Série 4, garantia até 2028
- Aquecedor: Rinnai, instalado em 2021
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const JOBS = `Tarefa\tA cada\tÚltima vez\tPróxima
Trocar o refil do filtro de água\tMês\t01/11/2026\t01/12/2026
Limpar o filtro da lava-louças\tMês\t05/11/2026\t05/12/2026
Testar o detector de fumaça\t3 meses\t14/08/2026\t14/11/2026
Revisar o aquecedor a gás\tAno\t20/11/2025\t20/11/2026
Limpar as calhas\t6 meses\t24/05/2026\t24/11/2026
`;

const FAQ = [
  { q: "O app Notas tem modelo de manutenção da casa?", a: [
    "Não. O app Notas não tem modelos. Uma nota com uma tabela de tarefas, uma checklist do mês e os telefones para quem ligar funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "O que entra numa checklist de manutenção da casa?", a: [
    "Toda tarefa que se repete, de quanto em quanto tempo vence e quando você fez pela última vez. Comece pelas que custam caro quando esquecidas: o detector de fumaça, a revisão do aquecedor, as calhas e os filtros.",
  ] },
  { q: "O app Notas me avisa quando uma tarefa vence?", a: [
    "A nota não avisa sozinha. Você abre e lê a coluna Próxima. Uma checklist do mês, feita no começo de cada mês, junta as tarefas que vencem numa lista curta.",
  ] },
  { q: "Existe um app de manutenção da casa que controla o que vence?", a: [
    "O Pinto Notes tem um modelo grátis de manutenção da casa. Conte ao ChatGPT ou ao Claude quando uma tarefa foi feita e ele atualiza as datas, e pergunte o que vence neste mês e ele faz a checklist.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="manutencao-da-casa-notas-iphone"
      intro={<>
        Ninguém esquece o detector de fumaça de propósito. Ele escapa porque o último teste foi há tanto tempo que ninguém lembra. Aqui
        está uma checklist de manutenção da casa para colar no app Notas, um jeito de usar todo mês e onde ela para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#todo-mes", label: "Todo mês" },
          { href: "#limites", label: "Onde ela para" },
          { href: "#pinto-notes", label: "Uma lista que sabe o que vence" },
        ]}>
          <p>
            O app Notas não tem modelo de manutenção da casa, mas uma nota resolve: uma tabela com toda tarefa que se repete, de quanto em
            quanto tempo e quando você fez pela última vez, depois uma checklist do que vence neste mês, as pessoas para quem você liga e
            os modelos dos seus aparelhos.
          </p>
          <PostCta template="home-maintenance" slug="pt/manutencao-da-casa-notas-iphone" path="/pt/blog/manutencao-da-casa-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as datas em dia para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de manutenção da casa. Conte ao ChatGPT ou ao Claude que uma tarefa foi feita e ele atualiza as datas, ou pergunte o que vence neste mês.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/home-maintenance-note" width={1520} height={1557} maxWidth={600}
        alt="Uma nota Home maintenance no Pinto Notes no Mac: uma tabela Jobs com cinco tarefas, de Descale the kettle a Clear the gutters, com a frequência e a última e a próxima data, uma checklist This month com duas de cinco marcadas, Who to call e Appliances."
        caption="Uma nota de manutenção da casa no Pinto Notes, onde Every é uma lista de escolha. No app Notas, as mesmas colunas funcionam como uma tabela simples, com a checklist e as listas embaixo. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: tarefas, este mês, para quem ligar</h2>
      <p>
        A tabela é o registro: toda tarefa que se repete, de quanto em quanto tempo, quando foi feita pela última vez e quando vence de
        novo. A checklist é o que você usa neste mês. Para quem ligar e Aparelhos são o que você busca quando algo quebra. As tarefas de
        exemplo são um começo; adicione as suas e apague o que não se aplica.
      </p>
      <Keep title="Nota de manutenção da casa para o app Notas" text={NOTE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Keep title="Tabela de tarefas para o app Notas" text={JOBS} copyLabel={ui.copy}
        note="Cada linha tem um Tab entre as colunas. Cole embaixo de Tarefas e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
        { on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" },
      ]} />
      <ul>
        <li>
          <strong>Cole a nota.</strong> Num Mac com macOS 27, crie uma nota nova e escolha Editar, Colar como Markdown. A linha com # vira
          o título, as linhas com ## cabeçalhos e as tarefas deste mês uma checklist. Um Command + V comum deixa os símbolos como texto.
        </li>
        <li>
          <strong>Depois a tabela.</strong> Troque a linha embaixo de Tarefas pela tabela de tarefas, selecione as seis linhas de Tarefa
          até a última tarefa e clique no botão Tabela. Cada Tab vira uma coluna.
        </li>
        <li>
          <strong>Adicione uma tarefa.</strong> Tab na última célula adiciona uma linha. Escreva as datas com o ano, para uma tarefa feita
          uma vez por ano ainda fazer sentido no próximo novembro.
        </li>
        <li>
          <strong>Nomes de tarefa curtos.</strong> O Notas define a largura das colunas sozinho e não deixa arrastar, então uma tarefa
          longa espreme as datas.
        </li>
      </ul>
      <p>
        Fixe a nota no topo da pasta. No iPhone, digite os cabeçalhos uma vez, selecione as tarefas deste mês e toque no botão Checklist.
        O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra tudo o que uma tabela no
        Notas faz e não faz.
      </p>

      <h2 id="todo-mes">Todo mês</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Mais", "Desmarcar Tudo"] }]} />
      <ul>
        <li>
          <strong>Faça a lista do mês.</strong> No dia primeiro, desça pela coluna Próxima e escreva uma linha de checklist para cada tarefa
          que vence no mês, com a data.
        </li>
        <li>
          <strong>Marque e depois atualize a linha.</strong> Quando uma tarefa estiver feita, marque e mude Última vez e Próxima na
          tabela. A marca é para este mês. A linha é o que o ano que vem lê.
        </li>
        <li>
          <strong>Deixe as tarefas marcadas descerem.</strong> Com &ldquo;Ordenar automaticamente os itens marcados&rdquo; ativado, as
          tarefas feitas descem para o fim e o que falta fica em cima.
        </li>
        <li>
          <strong>Reaproveite a lista.</strong> Se as mesmas tarefas mensais voltam toda vez, mantenha e escolha Formatar, Mais, Desmarcar
          Tudo para recomeçar.
        </li>
      </ul>
      <p>
        Uma Pasta Inteligente com o filtro Checklists, configurado para os itens ainda não marcados, mostra toda nota que ainda tem itens
        em aberto, então uma tarefa que sobrou do mês passado continua à vista. O guia{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês) mostra como criar
        uma. Quando um cano vaza, a busca lê cada palavra de cada nota, então &ldquo;encanador&rdquo; ou &ldquo;Bosch&rdquo; acha o
        telefone ou o modelo na hora. Para cuidar da casa com outra pessoa, compartilhar a nota exige uma Conta Apple para cada pessoa.
        Mais notas para colar como esta estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde uma lista de manutenção no Notas para</h2>
      <ul>
        <li><strong>A próxima data é conta sua.</strong> O Notas não calcula que uma tarefa a cada 3 meses feita em 14 de agosto vence em 14 de novembro. Você escreve a data.</li>
        <li><strong>A tabela não ordena.</strong> Ela não põe a próxima tarefa no topo, então você lê todas as linhas para achar o que vence.</li>
        <li><strong>A lista do mês é copiada à mão.</strong> Se você pula o dia primeiro, nada faz a lista por você.</li>
        <li><strong>As datas se perdem.</strong> Uma tarefa que você marcou mas não atualizou na tabela parece atrasada no ano que vem.</li>
      </ul>
      <p>
        Para um apartamento com cinco tarefas, uma nota sobra. Para uma casa com trinta, manter as datas certas é o trabalho, e ele fica
        com você.
      </p>

      <h2 id="pinto-notes">Uma lista que sabe o que vence</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/home-maintenance">manutenção da casa</a> é a
        mesma nota: uma tabela Jobs onde Every é uma escolha entre Month, 3 months, 6 months ou Year, uma checklist This month, Who to call
        e Appliances.
      </p>
      <p>
        Conte à sua IA sobre uma tarefa que você quer acompanhar e quando fez pela última vez, e ela adiciona a linha com as duas datas,
        com o ano. Pergunte &ldquo;o que vence neste mês?&rdquo; e ela escreve a checklist em This month. Diga &ldquo;o aquecedor foi
        revisado hoje&rdquo; e ela muda Last done e Next due e marca a tarefa. Mencione um número de modelo ou uma data de garantia e isso
        vai para Appliances. Você ainda pode adicionar e editar cada linha sozinho, e cada versão anterior da nota fica guardada. Isso
        funciona depois que o ChatGPT ou o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. As listas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
