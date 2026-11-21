import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "diario-pessoal-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-journal-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd58edc7964/mac "Use Pastas Inteligentes no app Notas do Mac" (Pasta
// Inteligente, filtro Etiquetas). Editar > Colar como Markdown (new in macOS 27), Arquivo > Duplicar Nota and Bloquear
// Nota are the pt_BR strings in Notes on macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "diário
// pessoal", "diário pessoal online grátis", "diário pessoal exemplo", "modelo de diário pessoal", "diário iphone", "app
// diário iphone"; nothing for "diário notas iphone". "Diário iphone" mostly means Apple's own Journal app (Diário in
// pt-BR), so the slug and title say "diário pessoal" and name the Notes app. Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Diário

Algumas linhas por dia, o dia mais novo em cima.

## Perguntas
1. O que aconteceu hoje?
2. O que tirou energia, e o que devolveu?
3. O que eu quero lembrar?
4. Uma coisa para amanhã?

## Domingo, 8 de novembro
- Hoje: dia tranquilo; terminei a estante e fiz uma caminhada longa.
- Energia: baixa depois do almoço, melhor depois do café com o Jonas.
- Lembrar: a padaria da esquina abre às sete.
- Amanhã: ligar para a minha mãe.

## Sábado, 7 de novembro
- Hoje: ajudei a Maja na mudança; foi mais rápido do que a gente temia.
- Energia: a escada tirou, a pizza depois devolveu.
- Lembrar: a Maja disse que o apartamento novo pega o sol da tarde.
- Amanhã: responder o proprietário antes do meio-dia.
`;

const PROMPTS = `Com quem eu conversei hoje?
O que me surpreendeu?
O que eu faria diferente?
Pelo que estou esperando?
O que eu adiei, e por quê?
`;

const FAQ = [
  { q: "O app Notas tem modelo de diário?", a: [
    "Não. O app Notas não tem modelos. Uma nota com algumas perguntas no topo e um cabeçalho para cada dia funciona como diário, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Uma nota por dia ou uma nota para o diário inteiro?", a: [
    "Uma nota só é mais fácil de manter: ela está sempre no mesmo lugar, e os últimos dias ficam logo embaixo das perguntas. Quando ficar longa, comece uma nota nova para o mês seguinte.",
  ] },
  { q: "Dá para bloquear meu diário no app Notas?", a: [
    "Sim. O app Notas pode bloquear uma nota, e uma nota bloqueada abre com uma senha ou com o Face ID ou Touch ID. Bloqueie a própria nota do diário, e todos os dias dentro dela ficam bloqueados junto.",
  ] },
  { q: "Como acho um dia antigo do diário?", a: [
    "A busca lê cada palavra de cada nota, então busque um nome, um lugar ou uma palavra que você lembra de ter escrito. Uma etiqueta como #viagem nos dias que importam deixa uma Pasta Inteligente juntar essas notas.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="diario-pessoal-notas-iphone"
      intro={<>
        Quase todo diário para na página em branco. Algumas perguntas fixas ajudam a passar dela, e o app Notas já está no seu celular no
        fim do dia. Aqui está um modelo de diário para colar no Notas, como manter o hábito, como achar dias antigos e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#todo-dia", label: "Todo dia" },
          { href: "#perguntas", label: "Quando travar" },
          { href: "#dias-antigos", label: "Dias antigos" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um diário que pergunta" },
        ]}>
          <p>
            O app Notas não tem modelo de diário, mas uma nota resolve: quatro perguntas curtas no topo e depois um cabeçalho para cada
            dia, o mais novo em cima. Responda cada pergunta numa linha, e os últimos dias estão sempre ali quando você abre a nota.
          </p>
          <PostCta template="daily-journal" slug="pt/diario-pessoal-notas-iphone" path="/pt/blog/diario-pessoal-notas-iphone" position="answer" ui={ui.cta}
            title="Quer o dia escrito para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um diário grátis. Conte ao ChatGPT ou ao Claude como foi o seu dia e ele escreve nas suas palavras, o dia mais novo em cima.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-journal-note" width={1520} height={1093} maxWidth={600}
        alt="Uma nota Daily journal no Pinto Notes no Mac: quatro perguntas numeradas e depois os dias domingo, 8 de novembro, e sábado, 7 de novembro, o mais novo em cima, cada um com linhas Today, Energy, Remember e Tomorrow."
        caption="Um diário no Pinto Notes, o dia mais novo em cima. O mesmo formato funciona no app Notas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota, o dia mais novo em cima</h2>
      <p>
        As perguntas ficam no topo para você nunca encarar uma página em branco. Cada dia ganha um cabeçalho com o dia da semana e a data,
        e as respostas vão embaixo, uma linha curta cada. O dia mais novo fica logo embaixo das perguntas, então você lê hoje e ontem sem
        rolar. Dois dias de exemplo já estão preenchidos; troque pelos seus.
      </p>
      <Keep title="Diário para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título e cada linha com ## num cabeçalho. Um
        Command + V comum deixa os símbolos como texto. No iPhone, digite as perguntas uma vez e depois adicione cada dia à mão.
      </p>
      <p>
        Se você também planeja o dia de manhã, o plano do dia no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês) é a outra metade: três coisas para
        hoje e o que fazer se sobrar tempo. Guarde numa nota separada, para o diário continuar sendo um registro do que aconteceu.
      </p>

      <h2 id="todo-dia">Todo dia</h2>
      <ul>
        <li>
          <strong>Fixe a nota.</strong> Fixada no topo da pasta, ela é a primeira coisa que você vê quando abre o Notas na cama.
        </li>
        <li>
          <strong>Adicione o dia em cima.</strong> Clique no fim da última pergunta, pressione Return e digite o cabeçalho novo. O dia
          anterior desce para baixo dele.
        </li>
        <li>
          <strong>Uma linha basta.</strong> Pule uma pergunta quando não tiver nada a dizer. Um diário que você mantém por um ano com duas
          linhas por dia vale mais do que um que dura uma semana com duas páginas.
        </li>
        <li>
          <strong>Escreva do seu jeito.</strong> &ldquo;A escada tirou, a pizza depois devolveu&rdquo; vai dizer mais daqui a um ano do que
          &ldquo;cansado&rdquo;.
        </li>
        <li>
          <strong>Comece uma nota nova a cada mês.</strong> Quando a nota ficar longa, escolha Arquivo, Duplicar Nota, dê à cópia o nome
          do mês novo e apague os dias antigos dela. As perguntas vêm junto.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Arquivo", "Duplicar Nota"] }]} />

      <h2 id="perguntas">Quando as quatro perguntas não servem</h2>
      <p>
        As quatro perguntas dão conta da maioria dos dias. Nos dias em que não dão, troque uma por uma pergunta desta lista, ou deixe a
        lista no fim da nota para escolher.
      </p>
      <Keep title="Perguntas extras para o diário" text={PROMPTS} copyLabel={ui.copy} />
      <p>
        Se você quer acompanhar como se sente em números além de palavras, o{" "}
        <a href="/pt/blog/mood-tracker-notas-iphone">mood tracker no Notas</a> é uma tabela com uma linha para cada noite. Para hábitos que
        você marca, tem o <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker no Notas</a>.
      </p>

      <h2 id="dias-antigos">Como achar dias antigos</h2>
      <ul>
        <li>
          <strong>Busque uma palavra.</strong> A busca do Notas lê cada palavra de cada nota, então &ldquo;padaria&rdquo; ou o nome de um
          amigo acha o dia em que você escreveu.
        </li>
        <li>
          <strong>Ponha etiquetas nos dias que importam.</strong> Digite #viagem ou #familia na linha e isso vira uma etiqueta. Uma Pasta
          Inteligente com o filtro Etiquetas junta todas as notas que têm a etiqueta. O guia{" "}
          <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês) mostra como elas
          funcionam e o que conferir quando não funcionam.
        </li>
      </ul>
      <p>
        Um diário é pessoal. Você pode bloquear a nota com uma senha ou com o Face ID ou Touch ID, para ela não abrir para quem pegar o seu celular.
      </p>

      <h2 id="limites">Onde um diário no Notas para</h2>
      <ul>
        <li><strong>A linha em branco ainda é sua.</strong> As perguntas ajudam, mas numa noite cansada nada pergunta por você.</li>
        <li><strong>Todo dia é digitado.</strong> Se você prefere contar o seu dia falando, alguém precisa escrever depois.</li>
        <li><strong>A busca acha palavras, não temas.</strong> Ela acha &ldquo;proprietário&rdquo;. Ela não diz o que está na sua cabeça nas últimas três semanas.</li>
      </ul>
      <p>
        Para muita gente, uma nota e quatro perguntas são o diário inteiro, e isso basta. O que ela não faz é olhar para trás por você.
      </p>

      <h2 id="pinto-notes">Um diário que faz as perguntas</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/daily-journal">diário</a> é uma nota com as
        mesmas quatro perguntas e os seus dias embaixo, o mais novo em cima.
      </p>
      <p>
        Diga que quer escrever no diário e sua IA faz as perguntas uma por vez, e pula as que você deixar passar. Ou conte o seu dia de uma
        vez, como &ldquo;hoje foi longo: a mudança da Maja acabou, as caixas dela não, e eu estou no sofá&rdquo;, e ela escreve o dia sem
        perguntar. Cada dia ganha um cabeçalho com o dia da semana e a data, e linhas curtas nas suas palavras para Today, Energy, Remember
        e Tomorrow. Ela não dá conselhos a não ser que você peça. Depois, pergunte &ldquo;o que tem ocupado minha cabeça nesta
        semana?&rdquo; e ela responde a partir dos seus dias. Você ainda pode escrever e editar cada dia sozinho, e cada versão anterior da
        nota fica guardada. Isso funciona depois que o ChatGPT ou o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. Um diário que você já tem no app Notas vem junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
