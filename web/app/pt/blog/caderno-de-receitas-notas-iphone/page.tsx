import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "caderno-de-receitas-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-recipe-template (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist,
// Formatar > Mais > Desmarcar Tudo), apda85974595/mac "Resolva cálculos no app Notas do Mac" (Resultados de Cálculos)
// and the iPhone User Guide, support.apple.com/pt-br/guide/iphone/iph908d1558b/ios "Adicione links no app Notas do
// iPhone" (Adicionar Link). Editar > Colar como Markdown (new in macOS 27) and Fixar Nota are the pt_BR strings in
// Notes on macOS 27.2. Apple's pt-BR page gives the iPhone's edit menu no name, so the path says "menu de edição" as
// a description. Slug and title from Google autocomplete (pt-BR, 21 Nov): "caderno de receitas", "como organizar
// caderno de receitas", "como organizar livro de receitas", "meu livro de receitas app"; nothing for "receitas notas
// iphone". The Pinto template's own headings (Weeknight, Weekend, Baking, Want to try) stay in English, as the app is.
// Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Sopa de lentilha com limão

Rende 4 porções, 35 minutos. De: o caderno da vó

## Ingredientes
- [ ] 250 g de lentilha vermelha
- [ ] 1 cebola
- [ ] 2 cenouras
- [ ] 2 dentes de alho
- [ ] 1 colher (chá) de cominho em pó
- [ ] 2 limões-sicilianos

Do armário: azeite, sal.

## Modo de preparo
1. Refogue a cebola, as cenouras e o alho no azeite com o cominho.
2. Junte a lentilha e 1 litro de água. Cozinhe em fogo baixo por 20 minutos.
3. Bata metade no liquidificador, depois misture o suco de limão e sal a gosto.

## Observações
- Feita em 14 nov: precisava de mais limão.
`;

const INDEX = `# Caderno de receitas

## Dia de semana
- Sopa de lentilha com limão

## Fim de semana
- Frango assado com batatas

## Bolos e pães
- Bolo de banana

## Quero testar
- Macarrão com gergelim
`;

const FAQ = [
  { q: "O app Notas tem modelo de receita?", a: [
    "Não. O app Notas não tem modelos. Uma nota por receita, com os ingredientes numa checklist e o modo de preparo numa lista numerada, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Como organizo receitas no app Notas?", a: [
    "Coloque todas as receitas numa pasta Receitas, uma nota para cada, e mantenha uma nota de índice com links para elas embaixo de cabeçalhos como Dia de semana, Fim de semana e Bolos e pães. A busca acha uma receita por qualquer palavra dela, então um ingrediente também serve.",
  ] },
  { q: "Dá para ajustar as porções de uma receita no Notas?", a: [
    "Sozinho, não. O Notas faz as contas que você digita com os Resultados de Cálculos, mas não divide uma lista de ingredientes pela metade. Você muda cada quantidade à mão.",
  ] },
  { q: "Existe um app de receitas que funciona como o app Notas?", a: [
    "O Pinto Notes tem a cara do app Notas, funciona como ele e tem um modelo grátis de caderno de receitas. Cole uma receita no ChatGPT ou no Claude e ele salva uma cópia limpa, com os ingredientes numa checklist, e guarda no seu caderno.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="caderno-de-receitas-notas-iphone"
      intro={<>
        As receitas acabam em prints, abas abertas e no verso de um envelope. O app Notas guarda todas num lugar só se toda receita tiver o
        mesmo formato. Aqui está um modelo de receita para o app Notas, uma nota de índice para achar tudo de novo e onde ele deixa de
        bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#caderno", label: "Um caderno de receitas" },
          { href: "#cozinha", label: "Na cozinha" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um caderno que se organiza" },
        ]}>
          <p>
            O app Notas não tem modelo de receita, mas uma nota por receita resolve: o rendimento e o tempo no topo, os ingredientes numa
            checklist e o modo de preparo numa lista numerada. Guarde tudo numa pasta Receitas com uma nota de índice com link para cada
            uma, e copie o modelo abaixo para cada receita nova.
          </p>
          <PostCta template="recipe-box" slug="pt/caderno-de-receitas-notas-iphone" path="/pt/blog/caderno-de-receitas-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as receitas passadas a limpo para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um caderno de receitas grátis. Cole uma receita no ChatGPT ou no Claude e ele salva uma cópia limpa, com os ingredientes numa checklist, e guarda no lugar certo.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/recipe-note" width={1520} height={776} maxWidth={600}
        alt="Uma nota Lentil soup with lemon no Pinto Notes no Mac: rende 4, 35 minutos, seis ingredientes numa checklist com as lentilhas e a cebola marcadas, uma linha From the cupboard e três passos numerados."
        caption="Uma receita no Pinto Notes, do jeito que o caderno de receitas salva. O mesmo formato funciona no app Notas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota por receita</h2>
      <p>
        Toda receita ganha as mesmas quatro partes, para você ler num relance com as mãos sujas de farinha. A linha do armário deixa o
        azeite e o sal fora da checklist de compras. Deixe uma palavra em cada linha, porque um item vazio da checklist não sobrevive à
        colagem.
      </p>
      <Keep title="Receita para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e os
        ingredientes numa checklist. Um Command + V comum deixa os símbolos como texto. No iPhone, digite a receita, selecione os
        ingredientes e toque no botão Checklist.
      </p>

      <h2 id="caderno">Um caderno de receitas: uma nota de índice</h2>
      <p>
        Uma pasta de receitas se organiza por data, o que não ajuda nada numa terça-feira em que você quer algo rápido. Mantenha mais uma
        nota, Caderno de receitas, com um cabeçalho para cada tipo de refeição, e fixe essa nota no topo da pasta.
      </p>
      <Keep title="Índice do caderno de receitas" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Adicionar Link"], keys: "⌘K" },
        { on: "iPhone", steps: ["menu de edição", "Adicionar Link"] },
      ]} />
      <p>
        Depois transforme cada nome num link: selecione o nome, escolha Adicionar Link e escolha a nota da receita. Um toque nele abre a
        receita. As ideias que você encontra mas ainda não fez vão em Quero testar, e param de morar nas abas do navegador.
      </p>

      <h2 id="cozinha">Na cozinha</h2>
      <ul>
        <li>
          <strong>Marque os ingredientes enquanto compra ou cozinha.</strong> A checklist serve de lista para o mercado e, na cozinha,
          mostra o que já está na panela.
        </li>
        <li>
          <strong>Desmarque para a próxima vez.</strong> Clique nos ingredientes e escolha Formatar, Mais, Desmarcar Tudo.
        </li>
        <li>
          <strong>Anote o que mudou.</strong> Uma linha em Observações, como &ldquo;precisava de mais limão&rdquo;, é como uma receita vira
          sua.
        </li>
        <li>
          <strong>Busque por ingrediente.</strong> A busca do Notas lê cada palavra, então buscar &ldquo;grão-de-bico&rdquo; acha todas as
          receitas que usam.
        </li>
      </ul>
      <p>
        Para planejar a semana a partir do seu caderno, o <a href="/pt/blog/cardapio-semanal-notas-iphone">cardápio semanal no Notas</a>{" "}
        põe os jantares e as compras numa nota só, e o <a href="/pt/blog/lista-de-compras-notas-iphone">modelo de lista de compras</a>{" "}
        separa as compras por setor. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde um caderno de receitas no Notas para</h2>
      <ul>
        <li><strong>Cada receita é digitada ou arrumada à mão.</strong> Uma receita copiada de um blog chega com a história de vida, os anúncios e os comentários.</li>
        <li><strong>O índice é à mão.</strong> Uma receita nova só entra no caderno quando você adiciona o link dela.</li>
        <li><strong>Nada de ajustar porções.</strong> Cozinhar para dois com uma receita para seis significa mudar cada quantidade sozinho.</li>
        <li><strong>A busca acha palavras, não respostas.</strong> Ela acha o grão-de-bico. Não diz o que fazer com o grão-de-bico e o espinafre que precisa ser usado.</li>
      </ul>
      <p>
        Para algumas favoritas, uma pasta de notas é tudo de que você precisa. Para uma coleção de verdade, organizar é o trabalho, e ele
        fica com você.
      </p>

      <h2 id="pinto-notes">Um caderno de receitas que se organiza sozinho</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/recipe-box">caderno de receitas</a> é uma nota
        com Weeknight, Weekend, Baking e Want to try, e uma nota para cada receita dentro dela.
      </p>
      <p>
        Cole uma receita na sua IA, com a página inteira. Ela salva uma cópia limpa como nota própria: o rendimento e o tempo, os
        ingredientes numa checklist, o que vem do armário e passos curtos e numerados, sem a história de vida. Depois guarda o link embaixo
        do cabeçalho certo. Pergunte &ldquo;o que dá para fazer com grão-de-bico e espinafre?&rdquo; e ela procura no caderno, ou peça
        &ldquo;faz a sopa de lentilha pela metade, para dois&rdquo; e ela faz as contas. Você ainda pode escrever e editar cada receita
        sozinho, e cada versão anterior de uma nota fica guardada.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. As receitas que você já guarda no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
