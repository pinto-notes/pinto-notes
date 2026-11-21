import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "lista-de-presentes-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-gift-ideas (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar > Tabela, botão
// Tabela), apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist, Formatar > Mais > Desmarcar Tudo,
// "Ordenar automaticamente os itens marcados") and the pilot's apda85974595/mac "Resolva cálculos no app Notas do Mac"
// (Resultados de Cálculos). Apple's pt-BR page gives no shortcut; Option-Command-T is from the English post, which
// tried it on macOS 27. Editar > Colar como Markdown (new in macOS 27) and Bloquear Nota are the pt_BR strings in Notes
// on macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "lista de presentes", "lista de presentes de
// natal", "lista de presente natal", "ideias de presente", "ideias de presente de natal", "lista de ideias de
// presentes"; nothing for "lista de presentes notas". The budgets are in reais with Brazilian prices, so the sum in the
// text changes with them. The Pinto template's own choices (Idea, Bought, Given) stay in English, as the app is. Facts
// are the English post's.

const ui = UI.pt;

const SKELETON = `# Ideias de presente

## Ideias
Cole a tabela aqui.

## Tamanhos e gostos
- Maja: cozinha muito, já tem batedeira planetária.
- Jonas: veste M, ama qualquer coisa verde.
- Mãe: chega de coisas; prefere fazer algo junto.
- Pai: já tem todas as camisas do time.

## Natal
- [ ] Mãe
- [ ] Pai
- [ ] Jonas
`;

// Tabs between the columns: select these lines in Notes and press the Table button.
const TABLE = `Pessoa\tOcasião\tIdeia\tOrçamento\tStatus
Maja\tCasa nova\tUma boa faca de chef\t300\tIdeia
Pai\tNatal\tIngressos para o jogo\t400\tComprado
Jonas\tAniversário\tUm gorro de lã verde\t120\tIdeia
Mãe\tNatal\tUm fim de semana fora\t1500\tIdeia
Emma\tAgradecimento\tUm bom azeite\t80\tEntregue
`;

const FAQ = [
  { q: "O app Notas tem modelo de lista de presentes?", a: [
    "Não. O app Notas não tem modelos. Uma nota com uma tabela de ideias por pessoa e uma lista de tamanhos e gostos funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Como faço uma lista de presentes de Natal no iPhone?", a: [
    "Mantenha uma nota com uma checklist de todo mundo para quem você compra e marque cada nome quando o presente estiver comprado. Fixe a nota para ela estar no topo quando você estiver na loja.",
  ] },
  { q: "Dá para esconder uma lista de presentes no app Notas?", a: [
    "Sim. Bloqueie a nota com uma senha ou com o Face ID ou Touch ID, e o conteúdo fica escondido até você desbloquear.",
  ] },
  { q: "Existe um app de ideias de presente que lembra do que as pessoas gostam?", a: [
    "O Pinto Notes tem a cara do app Notas, funciona como ele e tem um modelo grátis de ideias de presente. Conte ao ChatGPT ou ao Claude do que alguém gostaria e ele guarda, e antes de um aniversário sugere presentes dentro do orçamento.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="lista-de-presentes-notas-iphone"
      intro={<>
        A ideia de presente perfeita aparece em março, de passagem, e em dezembro já sumiu. Uma nota em que você anota na hora em que ouve
        resolve isso. Aqui está uma lista de ideias de presente para o app Notas, por pessoa, com orçamento e tamanhos, pronta para o
        Natal e para todos os aniversários depois dele.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#ano", label: "Ao longo do ano" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Uma lista que sugere presentes" },
        ]}>
          <p>
            O app Notas não tem modelo de lista de presentes, mas uma nota resolve: uma tabela com a pessoa, a ocasião, a ideia, um
            orçamento e se já foi comprado, depois uma lista de tamanhos e gostos de cada pessoa. Fixe a nota e anote uma ideia na hora em
            que ouvir.
          </p>
          <PostCta template="gift-ideas" slug="pt/lista-de-presentes-notas-iphone" path="/pt/blog/lista-de-presentes-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as ideias guardadas na hora em que você ouve?">
            <p>O Pinto Notes funciona como o app Notas e tem uma lista de ideias de presente grátis. Conte ao ChatGPT ou ao Claude do que alguém gostaria e ele adiciona a ideia, e antes de um aniversário sugere presentes dentro do orçamento.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/gift-ideas-note" width={1520} height={1057} maxWidth={600}
        alt="Uma nota Gift ideas no Pinto Notes no Mac: uma tabela Ideas com cinco presentes para Maja, Dad, Jonas, Mum e Emma, com a ocasião, um orçamento em coroas suecas e um status, e uma lista Sizes and likes de quatro pessoas."
        caption="Uma lista de ideias de presente no Pinto Notes, onde Budget é um número e Status é uma escolha. No app Notas, a mesma tabela guarda tudo como texto digitado." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: ideias por pessoa, tamanhos e gostos</h2>
      <p>
        A tabela guarda todas as ideias, uma linha cada, para você ver de relance quem já tem algo e quem não tem. A lista de tamanhos e
        gostos é o que você aprende sobre as pessoas ao longo do ano: um tamanho, uma cor favorita, o que elas já têm. A checklist de Natal
        é para quem você ainda precisa de um presente. A nota vem em duas partes: primeiro os cabeçalhos e as listas, depois a tabela.
      </p>
      <Keep title="Ideias de presente para o app Notas" text={SKELETON} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e os nomes
        embaixo de Natal numa checklist. Um Command + V comum deixa os símbolos como texto. No iPhone, digite o modelo, selecione os nomes
        e toque no botão Checklist. Depois troque a linha embaixo de Ideias pela tabela.
      </p>
      <Keep title="Tabela de ideias" text={TABLE} copyLabel={ui.copy}
        note="Cada linha tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole as linhas da tabela embaixo de Ideias, selecione as seis linhas de Pessoa até
          o último presente e clique no botão Tabela. Cada Tab vira uma coluna.
        </li>
        <li>
          <strong>Ou comece do zero.</strong> Escolha Formatar, Tabela para ter duas linhas e duas colunas, e Tab na última célula
          adiciona a próxima linha.
        </li>
        <li>
          <strong>Cada ideia curta.</strong> O Notas define a largura das colunas sozinho e não deixa arrastar. &ldquo;Um gorro de lã
          verde&rdquo; basta, e os detalhes vão em Tamanhos e gostos.
        </li>
        <li>
          <strong>Bloqueie se a família usa o seu Mac.</strong> Uma nota bloqueada só abre com a sua senha ou com o Face ID ou Touch ID.
        </li>
      </ul>
      <p>
        O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra tudo o que uma tabela no
        Notas faz e não faz.
      </p>

      <h2 id="ano">Ao longo do ano, e no Natal</h2>
      <ul>
        <li>
          <strong>Fixe a nota.</strong> Uma nota fixada fica no topo da pasta, então uma ideia ouvida no jantar entra antes de você
          esquecer.
        </li>
        <li>
          <strong>Busque pelo nome.</strong> A busca do Notas lê cada palavra, então buscar &ldquo;Jonas&rdquo; acha a linha dele e o
          tamanho dele.
        </li>
        <li>
          <strong>Some os orçamentos você mesmo.</strong> As tabelas não somam, mas os Resultados de Cálculos fazem as contas que você
          digita. Embaixo da tabela, digite 400 + 1500 = e o Notas dá o total do Natal até agora.
        </li>
        <li>
          <strong>Marque os nomes conforme compra.</strong> Com &ldquo;Ordenar automaticamente os itens marcados&rdquo; ativado, as
          pessoas que ainda faltam sobem para o topo da lista de Natal.
        </li>
        <li>
          <strong>Zere no próximo dezembro.</strong> Clique na lista de Natal e escolha Formatar, Mais, Desmarcar Tudo.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Mais", "Desmarcar Tudo"] }]} />
      <p>
        Para ver os gastos da temporada inteira, a <a href="/pt/blog/planilha-de-gastos-notas-iphone">planilha de gastos no Notas</a> soma
        sozinha com os Resultados de Cálculos. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde uma lista de presentes no Notas para</h2>
      <ul>
        <li><strong>As ideias chegam em outro lugar.</strong> Um amigo cita um livro numa mensagem, e isso só chega à nota se você parar e copiar.</li>
        <li><strong>Nada de ordenar.</strong> As tabelas do Notas não ordenam, então ver tudo de uma pessoa ou de uma ocasião significa ler a tabela inteira.</li>
        <li><strong>O total do orçamento é à mão.</strong> Você digita a soma de novo cada vez que uma ideia muda.</li>
        <li><strong>A escolha é sua.</strong> Os tamanhos, os gostos e os orçamentos estão todos na nota, e juntar isso num presente três semanas antes de um aniversário continua com você.</li>
      </ul>
      <p>
        Para meia dúzia de pessoas, uma nota é tudo de que você precisa. Para um Natal em família e um ano de aniversários, manter tudo em
        dia é o trabalho.
      </p>

      <h2 id="pinto-notes">Uma lista de presentes que sugere presentes</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/gift-ideas">ideias de presente</a> é uma nota
        com uma tabela Ideas e uma lista Sizes and likes. Na tabela, Budget é um número e Status é uma escolha entre Idea, Bought ou Given.
      </p>
      <p>
        Mencione algo de que alguém gostaria e sua IA adiciona uma linha: a pessoa, a ocasião se você disse uma, a ideia, o orçamento se
        você deu um, e Idea como status. Diga &ldquo;o Jonas veste M e ama qualquer coisa verde&rdquo; e isso vai para Sizes and likes.
        Pergunte &ldquo;o aniversário do meu pai é daqui a três semanas. Ideias até 500?&rdquo; e ela sugere três presentes dentro do
        orçamento que combinam com o que está na nota. Quando você compra um, ela muda o status para Bought. Essa parte funciona depois
        que o ChatGPT ou o Claude está conectado, e <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a>{" "}
        (em inglês) leva um minuto. Você ainda pode editar cada linha sozinho, e cada versão anterior da nota fica guardada.
      </p>
      <p>
        O app está em inglês. As listas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
