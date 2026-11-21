import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "daily-scrum-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-daily-standup-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist,
// "Ordenar automaticamente os itens marcados" nos ajustes do app Notas). Editar > Colar como Markdown (new in macOS 27),
// Transcrição and Resumo are the pt_BR strings in Notes on macOS 27.2. Slug and title from Google autocomplete (pt-BR,
// 21 Nov): "daily scrum", "daily scrum como fazer", "daily scrum para que serve", "reunião diária daily scrum",
// "modelo daily scrum", "daily meeting como fazer"; "daily standup" came back with English suggestions only, and
// Brazilian teams call the meeting "a daily". The Pinto template's own headings (Blockers, Days, Yesterday, Today) stay
// in English, as the app is. Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Anotações da daily

## Impedimentos
- Esperando as chaves de API do provedor de pagamento de homologação

## Sexta, 6 de novembro
Ontem
- Corrigi o conflito de sincronização quando dois aparelhos editam a mesma nota
- Adicionei testes para as tabelas no importador

Hoje
- [ ] Revisar o pull request do onboarding
- [ ] Começar a exportação para PDF

## Quinta, 5 de novembro
Ontem
- Pareei com a Emma no importador

Hoje
- [x] Corrigir o conflito de sincronização
- [x] Escrever os testes de tabela do importador
`;

const TEAM = `# Daily do time, semana de 2 de novembro

## Impedimentos
- [ ] Sara: esperando as chaves de API do provedor de pagamento de homologação

## Sexta, 6 de novembro
- Sara: corrigiu o conflito de sincronização. Hoje, a revisão do onboarding.
- Jonas: mudou o total do checkout de lugar. Hoje, a conferência dos impostos.
- Emma: testes do importador prontos. Hoje, a exportação para PDF.
`;

const FAQ = [
  { q: "O que entra nas anotações de uma daily?", a: [
    "Três coisas: o que você fez ontem, o que vai fazer hoje e o que está impedindo você. Poucos tópicos curtos em cada uma. Deixe os impedimentos no topo da nota, porque é a parte em que outra pessoa pode agir.",
  ] },
  { q: "O app Notas tem modelo de daily?", a: [
    "Não. O app Notas não tem modelos. Uma nota contínua com um cabeçalho por dia, o mais novo em cima, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Como faço a ata de uma daily scrum?", a: [
    "Uma nota por sprint ou por semana, um cabeçalho por dia e uma linha por pessoa com o que ela fez e o que vem agora. Escreva os impedimentos numa checklist com o nome da pessoa na frente e marque cada um quando for resolvido.",
  ] },
  { q: "O Claude Code consegue escrever minha daily a partir dos meus commits?", a: [
    "Com o Pinto Notes conectado, sim. O modelo de daily tem instruções próprias para o Claude Code: ele lê seus commits desde ontem, transforma em alguns tópicos simples, pergunta o que vem agora e escreve o dia na sua nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="daily-scrum-notas-iphone"
      intro={<>
        Quase toda daily começa com alguém tentando lembrar do dia anterior. Uma nota que você escreve ao longo do caminho resolve isso.
        Aqui está um modelo de anotações de daily para colar no app Notas, uma versão para o time inteiro e onde o Notas para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#cada-dia", label: "Todo dia" },
          { href: "#time", label: "Para um time" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Uma daily a partir dos commits" },
        ]}>
          <p>
            O app Notas não tem modelo de daily, mas uma nota contínua resolve: os impedimentos no topo e depois um cabeçalho por dia de
            trabalho, o mais novo em cima, com Ontem e Hoje embaixo de cada um. Escreva o Hoje como checklist, e as linhas marcadas são o
            Ontem de amanhã.
          </p>
          <PostCta template="daily-standup" slug="pt/daily-scrum-notas-iphone" path="/pt/blog/daily-scrum-notas-iphone" position="answer" ui={ui.cta}
            title="Quer o ontem escrito para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de daily. Conte ao ChatGPT ou ao Claude o que você fez, ou deixe o Claude Code rascunhar o ontem a partir dos seus commits.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="Uma nota Standup notes no Pinto Notes no Mac: um impedimento, esperando as chaves de API de homologação, e depois sexta, 6 de novembro, e quinta, 5 de novembro, cada uma com tópicos de Yesterday e Today."
        caption="Anotações de daily no Pinto Notes: impedimentos no topo, uma seção por dia, a mais nova em cima. O mesmo formato funciona no app Notas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota, um cabeçalho por dia</h2>
      <p>
        Uma nota para todas as dailies guarda o rastro: o que você disse que ia fazer na terça fica logo embaixo do que você fez na quarta.
        Os impedimentos ficam acima dos dias para serem a primeira coisa que você vê. Deixe uma palavra em cada linha, porque um item vazio
        da checklist não sobrevive à colagem.
      </p>
      <Keep title="Anotações de daily para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e as linhas
        de Hoje numa checklist. Um Command + V comum deixa os símbolos como texto. No iPhone, digite o modelo, selecione as linhas de Hoje
        e toque no botão Checklist.
      </p>

      <h2 id="cada-dia">Todo dia</h2>
      <ul>
        <li>
          <strong>Fixe a nota.</strong> Fixe a nota no topo da pasta, para ela ser a primeira coisa que você abre de manhã.
        </li>
        <li>
          <strong>Comece pelo que marcou ontem.</strong> Adicione o cabeçalho de hoje embaixo de Impedimentos. O que você marcou no Hoje de
          ontem vira o seu Ontem, e o que ficou sem marcar passa para frente.
        </li>
        <li>
          <strong>Escreva o Hoje na noite anterior.</strong> Duas ou três linhas enquanto você ainda sabe onde parou poupam a manhã.
        </li>
        <li>
          <strong>Limpe os impedimentos.</strong> Quando algo for destravado, apague a linha. Uma lista de impedimentos velhos para de ser
          lida.
        </li>
        <li>
          <strong>Busque no passado.</strong> A busca lê cada palavra de cada nota, então buscar &ldquo;importador&rdquo; acha todos os dias
          em que você trabalhou nele.
        </li>
      </ul>
      <p>
        Mantenha os tópicos curtos e em palavras simples. A daily é para pessoas que não conhecem o código pelo nome das branches.
      </p>

      <h2 id="time">Para um time: uma linha por pessoa</h2>
      <p>
        Se é você quem anota a daily scrum, uma linha por pessoa basta: o que ela fez e o que vem agora. Os impedimentos ganham um nome na
        frente, para todo mundo ver quem está travado no quê.
      </p>
      <Keep title="Daily do time para o app Notas" text={TEAM} copyLabel={ui.copy}
        note="Comece uma nota nova a cada semana ou sprint, para ela continuar curta." />
      <p>
        Ative Ordenar automaticamente os itens marcados nos ajustes do Notas, e os impedimentos resolvidos descem para o fim. Com a Apple
        Intelligence, uma gravação no Notas vira uma transcrição e um resumo, o que ajuda se você não consegue digitar enquanto conduz a
        reunião. Para reuniões mais longas, o modelo de <a href="/pt/blog/ata-de-reuniao-notas-iphone">ata de reunião</a> tem decisões e
        tarefas com responsável, e o guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês)
        tem uma revisão semanal para colar.
      </p>

      <h2 id="limites">Onde as anotações de daily no Notas param</h2>
      <ul>
        <li><strong>O ontem vem da memória.</strong> O que você fez está nos seus commits e pull requests, e o Notas não enxerga isso.</li>
        <li><strong>A sprint review é à mão.</strong> Resumir duas semanas significa ler dez dias de tópicos e escrever tudo de novo.</li>
        <li><strong>Impedimentos antigos são difíceis de achar.</strong> Depois que você apaga um impedimento, nada lembra quanto tempo você esperou por ele.</li>
        <li><strong>A nota cresce.</strong> Uma nota contínua fica longa, e enxugar é mais um trabalho.</li>
      </ul>

      <h2 id="pinto-notes">Uma daily a partir dos seus commits</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/daily-standup">daily</a> é uma nota com
        Blockers no topo e Days embaixo, uma seção por dia de trabalho, a mais nova em cima.
      </p>
      <p>
        Toda manhã, conte à sua IA o que você fez e o que vem agora. Ela adiciona uma seção com o dia da semana e a data, e Yesterday e
        Today em tópicos curtos. O que estiver travado vai para Blockers, e quando você diz que destravou, sai da lista. No Claude Code, o
        modelo tem instruções próprias: ele roda git log no repositório atrás dos seus commits desde ontem, transforma em dois a cinco
        tópicos simples sem os hashes, pergunta o que vem agora e o que está travando você, e escreve o dia. O guia{" "}
        <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">de notas no Claude Code e no Codex</a> (em inglês) tem o comando único
        para adicionar.
      </p>
      <p>
        Depois, pergunte &ldquo;no que eu fiquei travado na semana passada?&rdquo; ou &ldquo;resume minhas dailies desde segunda para a
        sprint review&rdquo;. Cada versão anterior da nota fica guardada, então um impedimento apagado ainda pode ser achado. A parte da IA
        funciona depois que o ChatGPT ou o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto. O app está em
        inglês. As notas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
