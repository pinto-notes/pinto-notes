import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "habit-tracker-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-habit-tracker (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist,
// Formatar > Mais > Desmarcar Tudo, Command-clique num item, "Ordenar automaticamente os itens marcados" nos ajustes
// do app Notas) and apd58edc7964/mac "Use Pastas Inteligentes no app Notas do Mac" (Pasta Inteligente, filtro
// Checklists). Editar > Colar como Markdown (new in macOS 27, not on an Apple pt-BR page yet), Arquivo > Duplicar Nota
// and Desmarcar Tudo are the pt_BR strings in Notes on macOS 27.2 (Apple's page says "Marcar Todas", the app says
// "Marcar Tudo"; only Desmarcar Tudo is used here). Not verified: the pt-BR name of the Smart Folder option for
// unchecked items (Apple's pt-BR page shows only "Marcado"), so the text describes it instead of naming it. Slug and
// title from Google autocomplete (pt-BR, 21 Nov): "habit tracker iphone notes", "habit tracker iphone", "controle de
// hábitos semanal"; Brazilians search the English "habit tracker" as much as "controle de hábitos", and nothing came up
// for "hábitos notas iphone". Facts are the English post's.

const ui = UI.pt;

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const HABITS = ["Caminhar 20 minutos", "Ler 10 páginas", "Dormir até as 23h"];
const TEMPLATE = [
  "# Hábitos, semana de 16 de novembro",
  ...DAYS.map((d) => [`## ${d}`, ...HABITS.map((h) => `- [ ] ${h}`)].join("\n")),
  "## Como foi a semana\n- Cumpri:\n- Falhei:",
].join("\n\n") + "\n";

const FAQ = [
  { q: "O app Notas tem habit tracker?", a: [
    "Não. O app Notas não tem habit tracker nem modelos. Uma nota com um cabeçalho para cada dia e uma checklist dos seus hábitos embaixo funciona como um: você marca os hábitos conforme cumpre e começa uma cópia nova a cada semana.",
  ] },
  { q: "Como desmarco uma checklist inteira no Notas?", a: [
    "No Mac, clique na checklist e escolha Formatar, Mais, Desmarcar Tudo. Isso apaga o que você marcou, então, num habit tracker, duplique a nota antes e desmarque a cópia.",
  ] },
  { q: "O Notas conta a minha sequência de dias?", a: [
    "Não. O Notas não conta marcações entre notas ou dias, então a sequência é você quem conta, voltando pelas semanas.",
  ] },
  { q: "Existe um habit tracker grátis que funciona como uma nota?", a: [
    "O Pinto Notes tem um modelo grátis de habit tracker: uma nota que é um pequeno app, com o anel da semana, uma marcação por hábito, sequências e uma visão do mês. O ChatGPT ou o Claude podem registrar nele o que você fez.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="habit-tracker-notas-iphone"
      intro={<>
        Você quer acompanhar alguns hábitos no app que já abre todo dia, sem criar conta em mais um. O app Notas dá conta de uma versão
        simples. Aqui está um modelo semanal para colar, como manter o ritmo e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#toda-semana", label: "Toda semana" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um tracker que conta" },
        ]}>
          <p>
            O app Notas não tem habit tracker, mas uma checklist resolve a parte do dia a dia. Faça uma nota por semana com um cabeçalho
            para cada dia e seus hábitos numa checklist embaixo, marque conforme for cumprindo e duplique a nota na segunda-feira. Copie o
            modelo abaixo.
          </p>
          <PostCta template="habit-tracker" slug="pt/habit-tracker-notas-iphone" path="/pt/blog/habit-tracker-notas-iphone" position="answer" ui={ui.cta}
            title="Quer que alguém conte suas sequências?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de habit tracker: marque um hábito com um toque e veja o anel da semana, suas sequências e o mês. O ChatGPT ou o Claude podem registrar o dia para você.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/template-copies" width={1200} height={750} maxWidth={560}
        alt="Três cartões de checklist desenhados, abertos em leque, com marcas de contagem ao lado."
        caption="Um habit tracker no Notas é uma checklist que você copia toda semana." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma semana de hábitos</h2>
      <p>
        Três hábitos, sete dias e um lugar para dizer como foi a semana. Troque pelos seus hábitos antes de colar; deixe uma palavra em
        cada linha, porque um item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Habit tracker semanal para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="O mesmo Markdown colado duas vezes no app Notas do macOS 27: com Command + V os símbolos ficam como texto, e com Editar, Colar como Markdown ele vira um título, uma lista e texto em negrito."
        caption="Colagem comum à esquerda, Colar como Markdown à direita. O mesmo vale para as linhas da checklist." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, crie uma nota nova e escolha Editar, Colar como Markdown. A linha com # vira o título, cada dia vira um
        cabeçalho e as linhas <code>- [ ]</code> viram uma checklist que você pode marcar. Um Command + V comum deixa os símbolos como
        texto. No iPhone, digite os hábitos em linhas, selecione e toque no botão Checklist.
      </p>
      <p>
        Dois ajustes ajudam. Ative Ordenar automaticamente os itens marcados nos ajustes do Notas, e o que você já fez desce para o fim
        de cada dia. E uma Pasta Inteligente com o filtro Checklists, configurado para os itens ainda não marcados, mostra todas as notas
        com algo por marcar; o guia <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a>{" "}
        (em inglês) mostra como criar uma.
      </p>

      <h2 id="toda-semana">Toda semana</h2>
      <p>
        Na segunda-feira, selecione a nota da semana passada e escolha Arquivo, Duplicar Nota, depois mude a data no título e desmarque
        tudo: clique na checklist de cada dia e escolha Formatar, Mais, Desmarcar Tudo. Guarde as notas antigas numa pasta Hábitos. Essa
        pasta é o seu histórico.
      </p>
      <p>
        Se você mantém outras rotinas assim, o guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a>{" "}
        (em inglês) tem uma revisão semanal e uma lista do dia para colar do mesmo jeito. Se um dos seus hábitos é a academia, uma{" "}
        <a href="/pt/blog/ficha-de-treino-notas-iphone">ficha de treino no Notas</a> guarda as séries e os seus recordes.
      </p>

      <h2 id="limites">Onde um habit tracker no Notas para</h2>
      <ul>
        <li><strong>Nada de sequências.</strong> O Notas não conta marcações, então quantos dias seguidos você caminhou é algo que você conta voltando pelas semanas antigas.</li>
        <li><strong>Nada de semana num relance.</strong> Cada dia é uma checklist separada. Ver qual hábito você mais deixa passar significa ler a nota inteira.</li>
        <li><strong>Todo hábito, todo dia.</strong> Um hábito que você quer três vezes por semana, ou oito copos de água, não cabe numa marcação só.</li>
        <li><strong>Uma cópia toda segunda.</strong> Esqueça de duplicar e as marcações da semana caem na nota da semana passada.</li>
      </ul>
      <p>
        Para três hábitos e um pouco de disciplina, a nota funciona. Além disso, você está fazendo à mão o acompanhamento que um app
        poderia fazer.
      </p>

      <h2 id="pinto-notes">Um habit tracker que conta por você</h2>
      <Figure shot={{ ...SHOTS.habitApp, alt: "O app de habit tracker numa nota do Pinto Notes no Mac: o anel da semana em 62 por cento, 2 de 6 hábitos feitos hoje, uma grade com a semana de cada hábito e os hábitos com suas marcações e sequências, incluindo Gym em 1 de 3 nesta semana." }}
        caption="O modelo de habit tracker no Pinto Notes num Mac, com dados de exemplo: o anel da semana, os hábitos de hoje com suas sequências e Gym em 1 de 3 nesta semana." />
      <p>
        É para isso que existe o Pinto Notes. Ele tem a cara do app Notas e funciona como ele no iPhone e no Mac, e uma nota também pode
        ser um pequeno app. O modelo grátis de <a href="/templates/habit-tracker">habit tracker</a> é um deles. Você escolhe seus hábitos
        uma vez, marca cada um com um toque, e ele mostra o anel da semana, a sequência e o recorde de cada hábito e um mês que você pode
        preencher depois. Um hábito pode ser todo dia, alguns dias da semana, algumas vezes por semana ou uma contagem, como copos de água.
      </p>
      <p>
        Você também pode contar ao ChatGPT ou ao Claude o que fez, na conversa que já usa, e ele marca o dia na nota. Pergunte qual hábito
        você mais deixou passar neste mês e ele lê o tracker para responder.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. Suas notas do app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
