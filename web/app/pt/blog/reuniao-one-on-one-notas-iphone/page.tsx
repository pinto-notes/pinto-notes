import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "reuniao-one-on-one-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-1-on-1-template (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist,
// "Ordenar automaticamente os itens marcados" nos ajustes do app Notas), apd58edc7964/mac "Use Pastas Inteligentes no
// app Notas do Mac" (Pasta Inteligente, filtro Checklists) and support.apple.com/pt-br/102462 "Se você não conseguir
// colaborar no app Notas" (Conta Apple, nota bloqueada). Editar > Colar como Markdown (new in macOS 27), Arquivo >
// Duplicar Nota, the Pastas filter and Bloquear Nota are the pt_BR strings in Notes on macOS 27.2. Not verified: the
// pt-BR name of the Smart Folder option for unchecked items (Apple's pt-BR page shows only "Marcado"), so the text
// describes it instead of naming it. Slug and title from Google autocomplete (pt-BR, 21 Nov): "reunião one on one",
// "reunião one on one significado", "perguntas para reunião one on one", "reunião one a one ou one on one", "one on one
// modelo"; nothing for "pauta one on one" or "1:1 reunião". Brazilian teams say "one on one" and write "1:1". The Pinto
// template's own headings (Next time, Follow-ups, Past 1:1s) stay in English, as the app is. Facts are the English
// post's.

const ui = UI.pt;

const TEMPLATE = `# 1:1 com a Emma

Quinta sim, quinta não. Adicione assuntos durante a semana.

## Próxima vez
- Feedback sobre a revisão de design
- O orçamento da conferência
- As metas da Emma para o próximo trimestre

## Combinados
- [ ] Eu: achar um mentor para a Emma no time de plataforma
- [ ] Eu: ver uma escala de plantão mais tranquila
- [ ] Emma: rascunhar o plano de lançamento até 20/11

## 1:1s anteriores
5 de novembro
- O plantão foi pesado: dois chamados de madrugada. Ela quer uma escala mais tranquila.
- Quer liderar o lançamento do primeiro semestre. Parecia cansada, mas animada.
`;

const QUESTIONS = `Perguntas fixas
- O que está na sua cabeça nesta semana?
- O que está atrapalhando você?
- Precisa de algo de mim?
- Feedback, nos dois sentidos
- Como estão suas metas?
`;

const FAQ = [
  { q: "O app Notas tem modelo de reunião one on one?", a: [
    "Não. O app Notas não tem modelos. Uma nota contínua por pessoa, com cabeçalhos para a próxima pauta, os combinados e os 1:1s anteriores, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "O que entra na pauta de uma reunião one on one?", a: [
    "Primeiro os assuntos da pessoa, depois os seus, depois os combinados da última vez. Acrescente uma ou duas perguntas fixas, como o que está atrapalhando e se ela precisa de algo de você. Anote os assuntos durante a semana, quando eles aparecem.",
  ] },
  { q: "Uma nota por 1:1 ou uma nota por pessoa?", a: [
    "Uma por pessoa. A pauta, os combinados em aberto e todos os 1:1s anteriores ficam juntos, o mais novo em cima, e você lê as anotações da última vez antes da próxima sem precisar procurar.",
  ] },
  { q: "Existe um app que escreve as anotações do meu 1:1?", a: [
    "O Pinto Notes tem um modelo grátis de anotações de 1:1. Conte ao ChatGPT ou ao Claude como foi o 1:1 e ele escreve a seção, adiciona o que cada um prometeu numa checklist e tira os assuntos já conversados.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="reuniao-one-on-one-notas-iphone"
      intro={<>
        Um bom 1:1 se constrói nas duas semanas antes dele, quando os assuntos aparecem. Aqui está um modelo de anotações de reunião one
        on one para colar no app Notas: uma nota contínua por pessoa, com a próxima pauta, os combinados e todos os 1:1s anteriores.
        Depois, como manter em dia e onde o Notas para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#pauta", label: "A pauta" },
          { href: "#entre", label: "Entre um 1:1 e outro" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "1:1s que se escrevem" },
        ]}>
          <p>
            O app Notas não tem modelo de 1:1, mas uma nota por pessoa resolve: uma lista Próxima vez que você preenche durante a semana,
            os combinados numa checklist com um nome em cada um e os 1:1s anteriores embaixo, o mais novo em cima. Leia o topo antes de
            cada reunião e escreva a seção nova logo depois.
          </p>
          <PostCta template="one-on-one-notes" slug="pt/reuniao-one-on-one-notas-iphone" path="/pt/blog/reuniao-one-on-one-notas-iphone" position="answer" ui={ui.cta}
            title="Quer seus 1:1s escritos para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de anotações de 1:1. Conte ao ChatGPT ou ao Claude como foi e ele escreve tudo, adiciona os combinados e tira o que vocês já conversaram.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/one-on-one-notes-note" width={1520} height={1062} maxWidth={600}
        alt="Uma nota 1:1 notes no Pinto Notes no Mac: 1:1s com a Emma quinta sim, quinta não, três assuntos em Next time, quatro combinados com um marcado e o 1:1 de 5 de novembro em Past 1:1s."
        caption="Uma nota contínua de 1:1 no Pinto Notes: o que levantar, o que cada um prometeu e os 1:1s anteriores, o mais novo em cima. O mesmo formato funciona no app Notas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota contínua por pessoa</h2>
      <p>
        Uma nota por reunião espalha os combinados. Uma nota por pessoa guarda a história inteira num lugar só: o que você quer levantar,
        o que cada um disse que ia fazer e como foram os últimos 1:1s. Ponha um nome em cada combinado, &ldquo;Eu&rdquo; incluído, para
        ficar claro quem deve o quê. Deixe uma palavra em cada linha, porque um item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Anotações de 1:1 para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
        { on: "Mac", steps: ["Arquivo", "Duplicar Nota"] },
      ]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e os
        combinados numa checklist. Um Command + V comum deixa os símbolos como texto. No iPhone, digite o modelo, selecione os combinados
        e toque no botão Checklist. Para a próxima pessoa, apague as linhas de exemplo, guarde essa cópia em branco numa pasta 1:1s e
        escolha Arquivo, Duplicar Nota.
      </p>

      <h2 id="pauta">A pauta: Próxima vez</h2>
      <p>
        Próxima vez é a pauta, escrita ao longo de duas semanas em vez de dois minutos antes da chamada. Os assuntos da pessoa vêm
        primeiro; a reunião é mais dela do que sua. Algumas perguntas fixas embaixo pegam o que nenhum dos dois lembrou de anotar.
      </p>
      <Keep title="Perguntas fixas" text={QUESTIONS} copyLabel={ui.copy} />
      <p>
        Se os dois querem adicionar à pauta, compartilhe uma nota só com a Próxima vez e permita que a pessoa faça alterações. Cada um
        precisa de uma Conta Apple. O resto, inclusive como a pessoa parecia, fica na sua própria nota.
      </p>

      <h2 id="entre">Entre um 1:1 e outro</h2>
      <ul>
        <li>
          <strong>Fixe a nota.</strong> Fixe a nota no topo da pasta, para adicionar um assunto pelo celular levar poucos segundos.
        </li>
        <li>
          <strong>Escreva logo depois.</strong> Adicione a data numa linha no topo de 1:1s anteriores, dois ou três tópicos sobre o que
          vocês conversaram e como a pessoa parecia, e passe as promessas para Combinados. Apague os assuntos já conversados.
        </li>
        <li>
          <strong>Deixe os combinados marcados descerem.</strong> Ative Ordenar automaticamente os itens marcados nos ajustes do Notas, e
          o que está feito desce para o fim da lista.
        </li>
        <li>
          <strong>Veja toda promessa em aberto.</strong> Crie uma Pasta Inteligente com duas regras: Pastas, com a sua pasta 1:1s, e
          Checklists, com a opção para os itens ainda não marcados. Toda pessoa a quem você ainda deve algo aparece nela.
        </li>
        <li>
          <strong>Bloqueie se for pessoal.</strong> Como alguém parecia é só para você. Uma nota bloqueada abre com a sua senha ou com o
          Face ID ou Touch ID, mas não pode ser compartilhada para edição.
        </li>
      </ul>
      <p>
        A busca lê cada palavra de cada nota, então buscar &ldquo;plantão&rdquo; acha cada vez que o assunto apareceu. O guia{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês) passa por todas as
        regras que uma Pasta Inteligente pode usar. Para reuniões de equipe, o modelo de{" "}
        <a href="/pt/blog/ata-de-reuniao-notas-iphone">ata de reunião</a> põe as tarefas com responsável no topo, e o guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês) tem mais notas para colar.
      </p>

      <h2 id="limites">Onde as anotações de 1:1 no Notas param</h2>
      <ul>
        <li><strong>Passar a limpo é com você.</strong> Logo depois de um 1:1 é quando começa a próxima reunião, e as anotações esperam até você esquecer metade.</li>
        <li><strong>Arrumar é à mão.</strong> Passar as promessas para Combinados e apagar os assuntos conversados é fácil de pular, e a pauta enche de itens velhos.</li>
        <li><strong>Nada de padrões.</strong> O plantão aparecer em três 1:1s seguidos está na nota, mas nada aponta isso.</li>
        <li><strong>A busca acha palavras, não respostas.</strong> &ldquo;O que eu prometi para a Emma da última vez?&rdquo; significa ler os combinados você mesmo.</li>
      </ul>
      <p>
        Para uma ou duas pessoas, o modelo basta. Com uma equipe de seis, passar a limpo é a parte que escapa.
      </p>

      <h2 id="pinto-notes">Anotações de 1:1 que se escrevem sozinhas</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/one-on-one-notes">anotações de 1:1</a> é uma
        nota contínua por pessoa com Next time, Follow-ups e Past 1:1s, o mais novo em cima.
      </p>
      <p>
        Na primeira vez, sua IA pergunta com quem é o 1:1 e escreve o nome. Durante a semana, mencione algo para levantar e vai para Next
        time. Depois do 1:1, conte como foi, por exemplo &ldquo;a Emma e eu acabamos de fazer nosso 1:1. Ela quer liderar o próximo
        lançamento e pediu um mentor.&rdquo; Ela adiciona uma seção no topo de Past 1:1s com o nome e a data, o que vocês conversaram e
        como a Emma parecia, adiciona o que cada um prometeu em linhas de checklist em Follow-ups e tira os assuntos já conversados.
        Pergunte &ldquo;o que eu prometi da última vez?&rdquo; antes do próximo. Você ainda pode escrever e marcar tudo sozinho, e cada
        versão anterior da nota fica guardada. A parte da IA funciona depois que o ChatGPT ou o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. As anotações de 1:1 que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
