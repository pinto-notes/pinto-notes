import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "calendario-de-conteudo-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-content-calendar (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela, botão Tabela), apd58edc7964/mac "Use Pastas Inteligentes no app Notas do Mac" (Pasta Inteligente, filtro
// Etiquetas) and support.apple.com/pt-br/102462 "Se você não conseguir colaborar no app Notas" (Conta Apple). Apple's
// pt-BR page gives no shortcut; Option-Command-T is from the English post, which tried it on macOS 27. Editar > Colar
// como Markdown (new in macOS 27), Editar > Adicionar Link and Arquivo > Duplicar Nota are the pt_BR strings in Notes on
// macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "calendário de conteúdo", "calendário de
// conteúdo para instagram", "calendário de conteúdo para redes sociais 2026", "calendário de conteúdo notion",
// "calendário editorial", "calendário de postagens"; nothing for "calendário de conteúdo notas". The dates stay
// year-month-day, as in the English post, because that is what keeps the column in order. The Pinto template's own
// choices (Blog, Newsletter, LinkedIn, Instagram, YouTube; Idea, Drafting, Scheduled, Published) stay in English, as
// the app is. Facts are the English post's.

const ui = UI.pt;

const SKELETON = `# Calendário de conteúdo

## Calendário
Cole a tabela aqui.

## Ideias
- Três ferramentas que eu uso todo dia
- Um dia no suporte, em números
- O que paramos de fazer este ano

## Tom de voz
- Frases curtas. Uma ideia por post.
- Mostre o trabalho: um print ou um número vale mais que um adjetivo.
- Termine com uma pergunta, não com uma venda.
`;

// Tabs between the columns: select these lines in Notes and press the Table button.
const TABLE = `Publicar em\tTítulo\tCanal\tStatus
2026-11-03\tCinco perguntas para todo cliente novo\tBlog\tPublicado
2026-11-10\tO que 100 ligações com clientes ensinaram\tLinkedIn\tAgendado
2026-11-12\tNewsletter: três histórias de clientes\tNewsletter\tEscrevendo
2026-11-17\tNosso onboarding, antes e depois\tLinkedIn\tEscrevendo
2026-11-19\tBastidores: o time de suporte\tInstagram\tIdeia
`;

const FAQ = [
  { q: "O app Notas tem modelo de calendário de conteúdo?", a: [
    "Não. O app Notas não tem modelos. Uma nota com uma tabela de posts (data, título, canal, status) e uma lista de ideias embaixo funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "O app Notas ordena uma tabela por data?", a: [
    "Não. As tabelas do app Notas não ordenam. Escreva as datas como 2026-11-03 para elas ficarem em ordem, e adicione cada post novo no lugar certo à mão.",
  ] },
  { q: "Meu time pode editar o mesmo calendário de conteúdo no app Notas?", a: [
    "Sim, se você compartilhar a nota. Cada pessoa precisa de uma Conta Apple, e todo mundo edita a mesma nota.",
  ] },
  { q: "Existe um app de notas que planeja o conteúdo para mim?", a: [
    "O Pinto Notes tem a cara do app Notas, funciona como ele e tem um modelo grátis de calendário de conteúdo. Conte uma ideia ao ChatGPT ou ao Claude e ele guarda, ou peça para planejar as próximas duas semanas e ele adiciona os posts ao calendário.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="calendario-de-conteudo-notas-iphone"
      intro={<>
        Postar toda semana é mais fácil quando o plano e as ideias moram num lugar que você já abre. O app Notas pode ser esse lugar, com
        uma nota e uma tabela. Aqui está um modelo de calendário de conteúdo para colar no Notas, como manter semana a semana e onde ele
        para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#semana", label: "Semana a semana" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um calendário que planeja junto" },
        ]}>
          <p>
            O app Notas não tem calendário de conteúdo, mas uma nota resolve: uma tabela com a data de publicação, o título, o canal e o
            status, depois uma lista de ideias e algumas linhas sobre como você escreve. Fixe a nota e adicione cada ideia na hora em que
            ela aparecer.
          </p>
          <PostCta template="content-calendar" slug="pt/calendario-de-conteudo-notas-iphone" path="/pt/blog/calendario-de-conteudo-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as próximas duas semanas planejadas?">
            <p>O Pinto Notes funciona como o app Notas e tem um calendário de conteúdo grátis. Conte uma ideia ao ChatGPT ou ao Claude e ele guarda, ou peça duas semanas de posts a partir das suas ideias.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/content-calendar-note" width={1520} height={1265} maxWidth={600}
        alt="Uma nota Content calendar no Pinto Notes no Mac: uma tabela Calendar com cinco posts, de 3 a 19 de novembro, com título, canal e status, uma lista Ideas com três ideias e três linhas de Voice."
        caption="Um calendário de conteúdo no Pinto Notes, onde Channel e Status são escolhas. No app Notas, a mesma tabela guarda tudo como palavras digitadas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: um calendário, ideias e um tom de voz</h2>
      <p>
        O calendário é uma tabela, uma linha por post. As ideias são uma lista simples, então um pensamento pela metade custa uma linha. O
        tom de voz são três regras que você lê antes de escrever, para cada post soar como o anterior. A nota vem em duas partes: primeiro
        os cabeçalhos e as listas, depois a tabela.
      </p>
      <Keep title="Calendário de conteúdo para o app Notas" text={SKELETON} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título e cada linha com ## num cabeçalho. Um
        Command + V comum deixa os símbolos como texto. No iPhone, digite o modelo. Depois troque a linha embaixo de Calendário pela
        tabela.
      </p>
      <Keep title="Tabela do calendário" text={TABLE} copyLabel={ui.copy}
        note="Cada linha tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole as linhas da tabela embaixo de Calendário, selecione as seis linhas de
          Publicar em até o último post e clique no botão Tabela. Cada Tab vira uma coluna.
        </li>
        <li>
          <strong>Ou comece do zero.</strong> Escolha Formatar, Tabela para ter duas linhas e duas colunas, e Tab na última célula
          adiciona a próxima linha.
        </li>
        <li>
          <strong>Títulos curtos.</strong> O Notas define a largura das colunas sozinho e não deixa arrastar, então um título longo espreme
          as outras colunas. Um título provisório de poucas palavras basta.
        </li>
        <li>
          <strong>Escreva as datas sempre do mesmo jeito.</strong> 2026-11-03 fica em ordem descendo pela coluna e é fácil de buscar.
        </li>
      </ul>
      <p>
        O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra tudo o que uma tabela no
        Notas faz e não faz.
      </p>

      <h2 id="semana">Semana a semana</h2>
      <ul>
        <li>
          <strong>Fixe a nota.</strong> Uma nota fixada fica no topo da pasta, então uma ideia no metrô vai direto para a lista.
        </li>
        <li>
          <strong>Planeje uma vez por semana.</strong> Passe duas ou três ideias para a tabela com uma data e Escrevendo, e apague da
          lista.
        </li>
        <li>
          <strong>Escreva os rascunhos em notas próprias.</strong> Escreva cada post numa nota separada e faça um link para ela na nota do
          calendário com Editar, Adicionar Link (Command + K), para o calendário continuar curto.
        </li>
        <li>
          <strong>Ponha etiqueta nos rascunhos.</strong> Digite #rascunho em cada nota de rascunho, e uma Pasta Inteligente com o filtro
          Etiquetas junta todas num lugar só. Leia o guia{" "}
          <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês) se alguma não
          aparecer.
        </li>
        <li>
          <strong>Comece uma nota nova a cada trimestre.</strong> Escolha Arquivo, Duplicar Nota e depois apague as linhas publicadas, e as
          ideias e o tom de voz vêm junto.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Adicionar Link"], keys: "⌘K" },
        { on: "Mac", steps: ["Arquivo", "Duplicar Nota"] },
      ]} />
      <p>
        Se vocês planejam os posts numa reunião do time, o modelo de <a href="/pt/blog/ata-de-reuniao-notas-iphone">ata de reunião</a>{" "}
        guarda as decisões e quem escreve o quê. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde um calendário de conteúdo no Notas para</h2>
      <ul>
        <li><strong>Nada de ordenar.</strong> As tabelas do Notas não ordenam, então um post que muda de semana significa mover a linha à mão.</li>
        <li><strong>Status é só uma palavra.</strong> Nada impede um erro de digitação, e não dá para mostrar só o que está agendado.</li>
        <li><strong>O planejamento é seu.</strong> Transformar uma lista de ideias em duas semanas de posts em vários canais é a parte lenta, toda semana.</li>
        <li><strong>O tom de voz é um lembrete.</strong> As três regras ficam na nota, e manter cada rascunho dentro delas é com você.</li>
      </ul>
      <p>
        Para um canal e um post por semana, uma nota é tudo de que você precisa. Com vários canais, manter a tabela em dia vira o trabalho.
      </p>

      <h2 id="pinto-notes">Um calendário de conteúdo que planeja com você</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/content-calendar">calendário de conteúdo</a> é
        uma nota com uma tabela Calendar, uma lista Ideas e o seu Voice. Na tabela, Channel é uma escolha entre Blog, Newsletter, LinkedIn,
        Instagram ou YouTube, e Status é Idea, Drafting, Scheduled ou Published.
      </p>
      <p>
        Conte uma ideia à sua IA e ela adiciona em Ideas. Peça &ldquo;planeja as próximas duas semanas: dois posts no LinkedIn e uma
        newsletter&rdquo; e ela escolhe ideias da lista e adiciona uma linha para cada post, com data, título provisório, canal e Drafting.
        Ela escreve rascunhos no tom de Voice, e quando você diz que um post saiu, marca como Published. &ldquo;O que está agendado para
        esta semana?&rdquo; ganha uma resposta direta a partir da tabela. Essa parte funciona depois que o ChatGPT ou o Claude está
        conectado, e <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto. Você
        ainda pode editar cada linha sozinho, e cada versão anterior da nota fica guardada.
      </p>
      <p>
        O app está em inglês. Os planos que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
