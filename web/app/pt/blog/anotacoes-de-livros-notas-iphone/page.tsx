import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "anotacoes-de-livros-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-book-notes-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist),
// apd58edc7964/mac "Use Pastas Inteligentes no app Notas do Mac" (Pasta Inteligente, filtros Etiquetas and Checklists)
// and the iPhone User Guide, support.apple.com/pt-br/guide/iphone/iph908d1558b/ios "Adicione links no app Notas do
// iPhone" (Adicionar Link). Editar > Colar como Markdown (new in macOS 27), Editar > Adicionar Link and Arquivo >
// Duplicar Nota are the pt_BR strings in Notes on macOS 27.2; "menu de edição" for the iPhone is the pilot's wording.
// Not verified: the pt-BR name of the Smart Folder option for unchecked items (Apple's pt-BR page shows only
// "Marcado"), so the text describes it instead of naming it. Slug and title from Google autocomplete (pt-BR, 21 Nov):
// "anotações de livros", "anotações de livros lidos", "anotações de livros app", "como fazer anotações de livros
// lidos", "fichamento de livro" (the school and ABNT kind, so not the slug), "resumo de livro modelo". The books are
// the Brazilian editions (Quatro Mil Semanas, Trabalho Focado); the quote is translated here, not copied from that
// edition. Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Quatro Mil Semanas, de Oliver Burkeman

## Trechos para guardar
- "O dia em que você finalmente terá tudo sob controle nunca vai chegar." (p. 31)

## O que eu penso
- A lista de tarefas é infinita por natureza. Terminar a lista não é o objetivo.
- Escolher meus três grandes projetos; todo o resto espera.
- Dizer não a coisas boas é a parte difícil.

## A ideia central
A vida é curta e a atenção é finita. Tentar fazer tudo garante que as coisas importantes fiquem espremidas. Escolha o que deixar de lado, de propósito.

## O que vou fazer diferente
- [ ] Manter uma lista de três projetos ativos, no máximo
- [ ] Fazer a coisa mais importante primeiro, antes do e-mail
- [ ] Deixar uma noite por semana sem nada marcado
`;

const INDEX = `# Livros

## 2026
- Quatro Mil Semanas, de Oliver Burkeman
- Trabalho Focado, de Cal Newport
`;

const FAQ = [
  { q: "O app Notas tem modelo de anotações de livros?", a: [
    "Não. O app Notas não tem modelos. Uma nota por livro, com cabeçalhos para os trechos, o que você pensa, a ideia central e o que vai fazer diferente, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Como faço anotações de um livro?", a: [
    "Anote os trechos que fazem você parar, com o número da página, e um pensamento curto seu do lado. Quando terminar, escreva a ideia central do livro em três frases e uma ou duas coisas que você vai mudar.",
  ] },
  { q: "Como acho um trecho de novo no app Notas?", a: [
    "A busca lê cada palavra de cada nota, então algumas palavras do trecho bastam para achar. Pôr a etiqueta #livros em cada nota de livro também deixa uma Pasta Inteligente juntar todas num lugar só.",
  ] },
  { q: "Existe um app de anotações de livros que funciona como o app Notas?", a: [
    "O Pinto Notes tem a cara do app Notas, funciona como ele e tem um modelo grátis de anotações de livros. Mande seus trechos marcados para o ChatGPT ou o Claude enquanto lê e ele guarda tudo embaixo do livro; quando você termina, ele escreve a ideia central.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="anotacoes-de-livros-notas-iphone"
      intro={<>
        Um ano depois de um bom livro, a maioria das pessoas lembra da capa e de uma ideia, quando muito. Uma página de anotações por livro
        muda isso. Aqui está um modelo de anotações de livros para colar no app Notas, um índice para manter tudo junto e onde o Notas
        para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#lendo", label: "Enquanto você lê" },
          { href: "#indice", label: "Tudo junto" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Anotações que escrevem a ideia central" },
        ]}>
          <p>
            O app Notas não tem modelo de anotações de livros, mas uma nota por livro resolve: os trechos que valem guardar com o número
            da página, o que você pensa, a ideia central em três frases quando terminar e uma checklist do que você vai fazer diferente.
            Copie o modelo abaixo a cada livro novo.
          </p>
          <PostCta template="book-notes" slug="pt/anotacoes-de-livros-notas-iphone" path="/pt/blog/anotacoes-de-livros-notas-iphone" position="answer" ui={ui.cta}
            title="Quer seus trechos guardados para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de anotações de livros. Mande um trecho para o ChatGPT ou o Claude enquanto lê e ele guarda; quando você termina, ele escreve a ideia central.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/book-notes-note" width={1520} height={1255} maxWidth={600}
        alt="Uma nota Book notes no Pinto Notes no Mac: Four Thousand Weeks, de Oliver Burkeman, com um trecho da página 31, quatro pensamentos, a ideia central e uma checklist de três coisas para fazer diferente, e depois Deep Work, de Cal Newport."
        caption="Anotações de livros no Pinto Notes, uma seção por livro, do jeito que o modelo guarda. Dados de exemplo. Os cabeçalhos, os tópicos e a checklist funcionam igual no app Notas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota por livro</h2>
      <p>
        Quatro partes, na ordem em que você preenche. Os trechos e o que você pensa vêm durante a leitura. A ideia central e a checklist
        vêm quando você termina, e são as partes que você vai procurar depois. Deixe uma palavra em cada linha, porque um item vazio da
        checklist não sobrevive à colagem.
      </p>
      <Keep title="Anotações de livros para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e a última
        parte numa checklist. Um Command + V comum deixa os símbolos como texto. No iPhone, digite o modelo, selecione as últimas linhas e
        toque no botão Checklist. Para o próximo livro, escolha Arquivo, Duplicar Nota e troque as palavras.
      </p>

      <h2 id="lendo">Enquanto você lê</h2>
      <ul>
        <li>
          <strong>Primeiro a página.</strong> Digite a página antes do trecho. Leva um segundo, e é assim que você acha a frase de novo
          no livro.
        </li>
        <li>
          <strong>Suas palavras, não um resumo.</strong> Um pensamento como &ldquo;dizer não a coisas boas é a parte difícil&rdquo; vale
          mais do que uma paráfrase bonitinha do capítulo.
        </li>
        <li>
          <strong>Escreva a ideia central em até um dia.</strong> Três frases, de memória, antes de começar o próximo livro. Se não
          conseguir, o livro não ficou, e isso também é bom saber.
        </li>
        <li>
          <strong>Uma checklist pequena.</strong> Duas a quatro coisas que você vai mesmo tentar. Marque conforme virarem hábito.
        </li>
      </ul>

      <h2 id="indice">Mantenha tudo junto</h2>
      <p>
        Digite #livros embaixo do título de cada nota de livro: isso vira uma etiqueta. Uma Pasta Inteligente com o filtro Etiquetas em
        livros junta todas as notas de livros num lugar só, e uma segunda regra, Checklists com a opção para os itens ainda não marcados,
        mostra só os livros com algo que você ainda não tentou. O guia{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês) mostra como criar
        uma.
      </p>
      <Keep title="Índice de livros para o app Notas" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Adicionar Link"], keys: "⌘K" },
        { on: "iPhone", steps: ["menu de edição", "Adicionar Link"] },
      ]} />
      <p>
        Para um índice por ano, mantenha mais uma nota, Livros, e transforme cada título num link: selecione o título, escolha Adicionar
        Link e escolha a nota do livro. A busca lê cada palavra de cada nota, então algumas palavras de um trecho acham a nota mesmo quando
        você esqueceu o livro. Os livros que você ainda não leu vão numa{" "}
        <a href="/pt/blog/lista-de-leitura-notas-iphone">lista de leitura</a>, e mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde as anotações de livros no Notas param</h2>
      <ul>
        <li><strong>Todo trecho é digitado à mão.</strong> Copiar uma frase de um livro de papel significa largar o livro, achar a nota e digitar.</li>
        <li><strong>A ideia central é a parte que todo mundo pula.</strong> Nada lembra você de escrever, e uma semana depois fica mais difícil.</li>
        <li><strong>O índice é à mão.</strong> Um livro novo só entra quando você adiciona o link.</li>
        <li><strong>Os livros ficam separados.</strong> A busca acha palavras. Ela não diz o que três livros sobre foco tinham em comum.</li>
      </ul>

      <h2 id="pinto-notes">Anotações de livros que escrevem a ideia central</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/book-notes">anotações de livros</a> é uma nota
        com uma seção por livro, do mais novo para o mais antigo: os trechos, o que você pensa, a ideia central e o que você vai fazer
        diferente.
      </p>
      <p>
        Diga à sua IA qual livro você está lendo e ela começa a seção do livro. Mande um trecho conforme lê, como &ldquo;página 31: o dia
        em que você finalmente terá tudo sob controle nunca vai chegar&rdquo;, e ela guarda como citação, com o número da página. O que
        você pensa entra em tópicos, nas suas palavras, sem polimento. Diga &ldquo;terminei, fecha o livro&rdquo; e ela escreve a ideia
        central em três frases e de duas a quatro coisas para fazer diferente, numa checklist. Você ainda pode escrever e editar cada linha
        sozinho, e cada versão anterior da nota fica guardada.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. As anotações de livros que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
