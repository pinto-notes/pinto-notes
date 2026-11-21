import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "registro-de-decisoes-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-decision-log-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/102462 "Se você não conseguir colaborar no app Notas" (Conta Apple). Editar > Colar
// como Markdown (new in macOS 27) and Editar > Adicionar Link are the pt_BR strings in Notes on macOS 27.2. Slug and
// title from Google autocomplete (pt-BR, 21 Nov): "registro de decisão de arquitetura" (the ADR kind), and nothing
// beyond the query itself for "registro de decisões", "log de decisões" or "diário de decisões"; "registro de
// decisões" is what Brazilian teams write, so it is the slug. Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Registro de decisões

Toda decisão que vale lembrar: o que escolhemos, o que não escolhemos e por quê. A mais nova em cima.

## Perguntas em aberto
- Vamos ter edição offline na primeira versão?
- Quem fica responsável pelo importador depois do lançamento?

## Continuar no Postgres, 4 de novembro
- Contexto: as notas chegaram a 2 milhões de linhas e a busca ficou lenta.
- Opções: um banco de documentos, um serviço de busca ou índices melhores.
- Escolhemos: Postgres com um índice de trigramas.
- Por quê: um banco só para manter, e o índice deixou a busca 40 vezes mais rápida.
- Rever: com 20 milhões de linhas.

## Lançar toda terça, 2 de novembro
- Contexto: os lançamentos atrasavam sempre que uma correção não ficava pronta.
- Escolhemos: lançar o que estiver pronto toda terça.
- Por quê: lançamentos pequenos são mais fáceis de desfazer.
`;

const FAQ = [
  { q: "O que entra num registro de decisões?", a: [
    "Para cada decisão: a data, o contexto, as opções consideradas, o que vocês escolheram, por quê e quando olhar de novo. O porquê e as opções são as partes que as pessoas esquecem de escrever e depois mais precisam.",
  ] },
  { q: "O app Notas tem modelo de registro de decisões?", a: [
    "Não. O app Notas não tem modelos. Uma nota com um cabeçalho para cada decisão, a mais nova em cima, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Um registro de decisões deve ser uma tabela ou uma lista?", a: [
    "Numa planilha, uma tabela. No app Notas, um cabeçalho por decisão fica mais fácil de ler: não dá para arrastar a largura das colunas, e um porquê longo fica espremido numa célula estreita.",
  ] },
  { q: "Existe um registro de decisões que responde por que escolhemos algo?", a: [
    "O Pinto Notes tem um modelo grátis de registro de decisões. Conte ao ChatGPT ou ao Claude o que vocês decidiram e ele registra o contexto, as opções e o porquê. Depois, pergunte por que escolheram algo e ele cita o registro.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="registro-de-decisoes-notas-iphone"
      intro={<>
        Equipes discutem de novo questões já resolvidas porque ninguém escreveu por que elas foram resolvidas. Um registro de decisões
        resolve isso, e não precisa de Confluence nem de planilha. Aqui está um modelo de registro de decisões para o app Notas, como
        mantê-lo e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#manter", label: "Mantenha em dia" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um registro que lembra o porquê" },
        ]}>
          <p>
            O app Notas não tem modelo de registro de decisões, mas uma nota resolve: as perguntas em aberto no topo e depois um cabeçalho
            para cada decisão com a data e, embaixo, o contexto, as opções, o que vocês escolheram, por quê e quando rever. A mais nova em
            cima, para as últimas decisões serem a primeira coisa que você lê.
          </p>
          <PostCta template="decision-log" slug="pt/registro-de-decisoes-notas-iphone" path="/pt/blog/registro-de-decisoes-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as decisões registradas para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um registro de decisões grátis. Conte ao ChatGPT ou ao Claude o que vocês decidiram e ele anota as opções e o porquê, e acha tudo quando você pergunta.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/decision-log-note" width={1520} height={1055} maxWidth={600}
        alt="Uma nota Decision log no Pinto Notes no Mac: duas perguntas em aberto e depois a decisão Stay on Postgres, de 4 de novembro, com o contexto, as opções, a escolha, o motivo e quando rever, e a decisão Release every Tuesday embaixo."
        caption="Um registro de decisões no Pinto Notes, do jeito que o modelo escreve. O mesmo formato funciona no app Notas. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: um cabeçalho por decisão</h2>
      <p>
        Cada registro são cinco linhas curtas. Contexto diz o que forçou a escolha. Opções lista o que vocês não escolheram, e é a linha
        que impede a mesma ideia de voltar no próximo trimestre. Rever diz quando a resposta pode mudar, para ela não ser tratada como
        eterna. Decisões pequenas podem pular as Opções, como a do lançamento de terça abaixo.
      </p>
      <Keep title="Registro de decisões para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
        { on: "Mac", steps: ["Editar", "Adicionar Link"], keys: "⌘K" },
      ]} />
      <ul>
        <li>
          <strong>Cole uma vez.</strong> Num Mac com macOS 27, crie uma nota e escolha Editar, Colar como Markdown. A linha com # vira o
          título e cada linha com ## um cabeçalho. Um Command + V comum deixa os símbolos como texto. No iPhone, digite o modelo.
        </li>
        <li>
          <strong>Um registro por projeto.</strong> Guarde na pasta do projeto e fixe no topo, para ele ficar junto das notas que explica.
        </li>
        <li>
          <strong>Compartilhe com a equipe.</strong> Se todo mundo usa o app Notas, compartilhe a nota para cada pessoa poder adicionar as
          próprias decisões. Todo mundo precisa de uma Conta Apple.
        </li>
      </ul>

      <h2 id="manter">Mantenha em dia</h2>
      <ul>
        <li>
          <strong>Registre no mesmo dia.</strong> O porquê está mais claro no fim da reunião em que vocês decidiram. Uma semana depois já
          é um palpite.
        </li>
        <li>
          <strong>Desça as perguntas quando forem resolvidas.</strong> Quando uma pergunta em aberto for decidida, apague de Perguntas em
          aberto e escreva o registro dela no topo das decisões.
        </li>
        <li>
          <strong>Faça um link de onde o assunto surgiu.</strong> Na nota da reunião, selecione a decisão e escolha Editar, Adicionar
          Link para apontar para o registro, e a reunião e os motivos ficam ligados.
        </li>
        <li>
          <strong>Busque antes de discutir de novo.</strong> A busca lê cada palavra de cada nota, então &ldquo;Postgres&rdquo; acha o
          registro antes de alguém marcar uma reunião sobre isso. Uma etiqueta #decisao nas notas de reunião que mudaram algo também ajuda.
        </li>
      </ul>
      <p>
        A maioria das decisões nasce numa reunião, e o modelo de <a href="/pt/blog/ata-de-reuniao-notas-iphone">ata de reunião</a> tem
        um cabeçalho Decisões exatamente para isso. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde um registro de decisões no Notas para</h2>
      <ul>
        <li><strong>Alguém precisa escrever.</strong> Depois de uma reunião longa, o registro é a primeira coisa que fica para depois.</li>
        <li><strong>O porquê some.</strong> Nada pede o motivo quando alguém registra só a escolha.</li>
        <li><strong>A busca acha palavras, não respostas.</strong> Ela acha toda nota que fala de Stripe. Ela não responde &ldquo;por que escolhemos o Stripe e não o Paddle?&rdquo;</li>
        <li><strong>Compartilhar exige Conta Apple.</strong> Cada pessoa da equipe precisa de uma para abrir e editar o registro compartilhado.</li>
      </ul>

      <h2 id="pinto-notes">Um registro de decisões que lembra o porquê</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/decision-log">registro de decisões</a> é uma
        nota com Open questions e Decisions, a mais nova em cima.
      </p>
      <p>
        Conte à sua IA sobre uma decisão, do seu jeito. Ela adiciona um registro no topo com a decisão em poucas palavras e a data, e depois
        Context, Options considered, What we chose, Why e When to revisit, uma linha curta cada. Se você não disse o porquê, ela pergunta.
        As perguntas que vocês ainda não resolveram vão para Open questions e saem da lista quando forem decididas. Meses depois, pergunte
        &ldquo;por que escolhemos o Stripe e não o Paddle?&rdquo; e ela acha o registro e cita, ou pergunte &ldquo;o que ainda está sem
        decisão?&rdquo;. Você ainda pode escrever e editar cada registro sozinho, e cada versão anterior da nota fica guardada. Essa parte
        funciona depois que o ChatGPT ou o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        No <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Claude Code</a> (em inglês), o modelo tem instruções próprias para
        as decisões técnicas de um projeto. Quando vocês escolhem uma biblioteca, um schema ou uma arquitetura, ele registra a decisão com
        os arquivos que ela afeta, e antes de propor uma mudança ele lê o registro para conferir que não está desfazendo uma decisão.
      </p>
      <p>
        O app está em inglês. As notas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
