import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "revisao-semanal-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-weekly-review-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist,
// "Ordenar automaticamente os itens marcados"). Editar > Colar como Markdown (new in macOS 27) is the pt_BR string in
// Notes on macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "revisão semanal", "revisão semanal
// gtd", "revisão semanal vida organizada", "revisão da semana"; nothing for "revisão semanal modelo" or "planejamento
// semanal notas". Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Revisão semanal

Vinte minutos no domingo. A semana mais nova em cima.

## Perguntas
1. O que deu certo nesta semana?
2. O que não deu, e por quê?
3. O que eu aprendi?
4. Pelo que eu sou grato?
5. Quais são minhas três prioridades para a próxima semana?

## Semana de 2 de novembro
- Deu certo: entreguei o relatório um dia antes; treinei quatro vezes.
- Não deu: nada de trabalho focado na quinta, reunião demais.
- Aprendi: uma pauta de 30 minutos vale mais que uma reunião de 60.
- Grato por: jantar com a minha irmã.
- [ ] Bloquear as manhãs de quinta para trabalho focado
- [ ] Mandar o plano do 4º trimestre para o Jonas
- [ ] Marcar o dentista
`;

const FAQ = [
  { q: "O app Notas tem modelo de revisão semanal?", a: [
    "Não. O app Notas não tem modelos. Uma nota com suas perguntas no topo e um cabeçalho para cada semana embaixo funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Que perguntas entram numa revisão semanal?", a: [
    "Cinco bastam: o que deu certo, o que não deu e por quê, o que você aprendeu, pelo que você é grato e suas três prioridades para a próxima semana. A última é a parte que você usa na segunda-feira.",
  ] },
  { q: "Uma nota por semana ou uma nota para todas as semanas?", a: [
    "Uma nota para todas as semanas, a mais nova em cima. As três prioridades da semana passada ficam logo embaixo das desta semana, e a busca acha uma palavra em todas elas.",
  ] },
  { q: "Existe uma revisão semanal que me faz as perguntas?", a: [
    "O Pinto Notes tem um modelo grátis de revisão semanal. Diga ao ChatGPT ou ao Claude que é hora da sua revisão e ele faz as cinco perguntas, uma por vez, e depois escreve a semana na sua nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="revisao-semanal-notas-iphone"
      intro={<>
        Uma revisão semanal são vinte minutos no domingo que poupam uma segunda-feira sem rumo. Ela só funciona se as perguntas forem as
        mesmas toda semana, então elas pertencem a uma nota que você guarda. Aqui está um modelo de revisão semanal para o app Notas, como
        transformar isso em hábito e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#domingo", label: "No domingo" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Uma revisão que pergunta" },
        ]}>
          <p>
            O app Notas não tem modelo de revisão semanal, mas uma nota resolve: cinco perguntas no topo e depois um cabeçalho para cada
            semana, com suas respostas em linhas curtas e as três prioridades da próxima semana numa checklist. Adicione a semana mais nova
            em cima, para o plano da semana passada ficar logo embaixo.
          </p>
          <PostCta template="weekly-review" slug="pt/revisao-semanal-notas-iphone" path="/pt/blog/revisao-semanal-notas-iphone" position="answer" ui={ui.cta}
            title="Quer alguém fazendo as perguntas?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de revisão semanal. O ChatGPT ou o Claude faz as cinco perguntas e depois escreve a semana na sua nota.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-review-note" width={1520} height={989} maxWidth={600}
        alt="Uma nota Weekly review no Pinto Notes no Mac: cinco perguntas numeradas e depois a revisão Week of 2 November, com o que deu certo, o que não deu, o que foi aprendido e um agradecimento, e uma checklist de três prioridades com Book the dentist marcado."
        caption="Uma revisão semanal no Pinto Notes, do jeito que o modelo escreve. O mesmo formato funciona no app Notas, com um cabeçalho para cada semana. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: cinco perguntas, uma nota</h2>
      <p>
        As perguntas ficam no topo para você nunca precisar lembrar delas. Cada semana ganha um cabeçalho com a data da segunda-feira, uma
        linha por resposta e as três prioridades numa checklist que você marca durante a semana. Deixe uma palavra em cada linha, porque um
        item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Revisão semanal para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <ul>
        <li>
          <strong>Cole uma vez.</strong> Num Mac com macOS 27, crie uma nota e escolha Editar, Colar como Markdown. A linha com # vira o
          título, cada linha com ## um cabeçalho e as três prioridades uma checklist. Um Command + V comum deixa os símbolos como texto.
          No iPhone, digite o modelo, selecione as três prioridades e toque no botão Checklist.
        </li>
        <li>
          <strong>Deixe a semana de exemplo como guia.</strong> Mantenha até o seu primeiro domingo e depois troque pela sua.
        </li>
        <li>
          <strong>Fixe a nota.</strong> Fixe a nota no topo da pasta, para ela estar lá quando você abrir o Notas no domingo.
        </li>
      </ul>

      <h2 id="domingo">No domingo</h2>
      <ul>
        <li>
          <strong>Comece pelas três prioridades da semana passada.</strong> Marque o que foi feito antes de escrever qualquer coisa nova.
          O que ficou em aberto entra nas três da próxima semana ou sai da lista de propósito.
        </li>
        <li>
          <strong>Adicione a semana nova em cima.</strong> Copie o bloco da semana passada, cole embaixo das perguntas e mude a data e as
          linhas. Poucas palavras por resposta bastam, desde que você entenda daqui a um mês.
        </li>
        <li>
          <strong>Escolha três, não dez.</strong> Três coisas que você ficaria feliz de ter feito até sexta. Com Ordenar automaticamente
          os itens marcados ativado, os itens marcados descem para o fim da lista.
        </li>
        <li>
          <strong>Olhe para trás uma vez por mês.</strong> A busca lê cada palavra, então buscar &ldquo;reunião&rdquo; mostra quantas
          vezes elas foram o problema. Uma etiqueta como #revisao na nota deixa ela a um toque na barra lateral.
        </li>
      </ul>
      <p>
        Uma revisão semanal mais curta, com a mesma ideia, é uma das notas do guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês). Para acompanhar o que você faz
        todo dia entre uma revisão e outra, o <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker no Notas</a> combina com ela, e
        o <a href="/pt/blog/diario-pessoal-notas-iphone">diário pessoal no Notas</a> é para os próprios dias.
      </p>

      <h2 id="limites">Onde uma revisão semanal no Notas para</h2>
      <ul>
        <li><strong>As perguntas não se fazem sozinhas.</strong> Num domingo cansado, uma lista de perguntas é fácil de pular.</li>
        <li><strong>Levar o que ficou é à mão.</strong> Os itens não marcados da semana passada ficam onde estão até você copiar para cima.</li>
        <li><strong>Padrões pedem releitura.</strong> A busca acha uma palavra. Ela não diz o que se repete em dois meses de revisões.</li>
      </ul>
      <p>
        Se o hábito já pegou, a nota é tudo de que você precisa. Se ele escapa nas semanas corridas, o que falta é alguém perguntando.
      </p>

      <h2 id="pinto-notes">Uma revisão semanal que pergunta para você</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/weekly-review">revisão semanal</a> é uma nota
        com as cinco perguntas e uma seção Reviews, a semana mais nova em cima.
      </p>
      <p>
        Diga à sua IA que é hora da revisão semanal. Ela faz as cinco perguntas, uma por vez, e depois adiciona a semana no topo de
        Reviews: um cabeçalho Week of com a data da segunda-feira, suas respostas em linhas curtas nas suas palavras e suas três
        prioridades numa checklist. Diga que uma está feita e ela marca. Pergunte &ldquo;no que eu disse que ia focar na semana
        passada?&rdquo; ou &ldquo;o que sempre aparece nas minhas revisões?&rdquo; e ela relê a nota para responder. Você ainda pode
        escrever e marcar tudo sozinho, e cada versão anterior da nota fica guardada. Essa parte funciona depois que o ChatGPT ou o Claude
        está conectado; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. As notas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
