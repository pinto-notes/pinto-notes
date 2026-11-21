import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "cardapio-semanal-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-meal-planner-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão
// Checklist, Formatar > Mais > Desmarcar Tudo, "Ordenar automaticamente os itens marcados" nos ajustes do app Notas),
// apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar > Tabela), support.apple.com/pt-br/guide/iphone/
// iph908d1558b/ios "Adicione links no app Notas do iPhone" (Adicionar Link), support.apple.com/pt-br/102462 "Se você
// não conseguir colaborar no app Notas" (Conta Apple, nota bloqueada) and support.apple.com/pt-br/105086 "Criar listas
// de compras no app Lembretes no iPhone" (iOS 17, Tipo de Lista, Compras). Editar > Colar como Markdown (new in macOS
// 27) and Arquivo > Duplicar Nota are the pt_BR strings in Notes on macOS 27.2. The share permission is described,
// not named: its pt-BR wording differs between iOS 26 and 27 on Apple's page. Slug and title from Google autocomplete
// (pt-BR, 21 Nov): "cardápio semanal", "cardapio semanal e lista de compras", "app cardápio semanal com lista de
// compras", "planejamento de refeições para a semana"; nothing for "cardápio semanal notas iphone". Facts are the
// English post's.

const ui = UI.pt;

const TEMPLATE = `# Jantares, semana de 23 de novembro

## Jantares
- Segunda: frango ao limão com arroz
- Terça: macarrão com tomate e manjericão (Lucas cozinha)
- Quarta: taco de peixe
- Quinta: curry de grão-de-bico (Lucas cozinha)
- Sexta: pizza caseira
- Sábado: jantar fora com os amigos
- Domingo: frango assado com batatas

## Hortifrúti
- [ ] Limão-siciliano
- [ ] Manjericão
- [ ] Tomate-cereja
- [ ] Limão-taiti
- [ ] Batatas

## Carnes e peixes
- [ ] Sobrecoxa de frango
- [ ] Peixe branco
- [ ] Frango inteiro

## Outros
- [ ] Tortilhas
- [ ] Grão-de-bico
- [ ] Leite de coco
- [ ] Massa de pizza
- [ ] Muçarela

## Sempre no armário
- Azeite, sal, pimenta-do-reino
- Arroz, macarrão, aveia
- Cebola, alho
`;

const FAQ = [
  { q: "O app Notas tem modelo de cardápio semanal?", a: [
    "Não. O app Notas não tem planejador de refeições nem modelos. Uma nota com os jantares da semana no topo e a lista de compras em checklists embaixo funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Dá para compartilhar o cardápio no Notas com quem mora comigo?", a: [
    "Sim. Compartilhe a nota e permita que as pessoas façam alterações. Vocês dois precisam de uma Conta Apple, e uma nota bloqueada não pode ser compartilhada para edição. As marcações aparecem nos dois celulares.",
  ] },
  { q: "A lista de compras fica melhor no Notas ou no Lembretes?", a: [
    "O Lembretes tem um tipo de lista Compras, desde o iOS 17, que separa os itens por seção conforme você adiciona. O Notas deixa a lista ao lado dos jantares que a geraram. Se você planeja a semana primeiro, manter os dois na mesma nota poupa copiar.",
  ] },
  { q: "Existe um planejador de cardápio que escreve a lista de compras para mim?", a: [
    "O Pinto Notes tem um modelo grátis de cardápio: os jantares da semana, quem cozinha e as compras por setor. O ChatGPT ou o Claude podem planejar a semana nele e escrever a lista, deixando de fora o que sempre tem no armário.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="cardapio-semanal-notas-iphone"
      intro={<>
        Decidir o jantar às seis da tarde e descobrir que acabou o arroz. Um cardápio semanal resolve as duas coisas, e o app Notas guarda
        um ao lado da lista de compras que ele pede. Aqui está um modelo para colar, como configurar para a lista funcionar no mercado e
        onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#melhor", label: "Deixe melhor" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um cardápio que escreve a lista" },
        ]}>
          <p>
            O app Notas não tem planejador de refeições, mas uma nota resolve. Coloque os jantares da semana no topo, uma linha por dia, e as
            compras embaixo em checklists, com um cabeçalho por setor do mercado. Copie o modelo abaixo.
          </p>
          <PostCta template="meal-plan" slug="pt/cardapio-semanal-notas-iphone" path="/pt/blog/cardapio-semanal-notas-iphone" position="answer" ui={ui.cta}
            title="Quer a lista de compras escrita para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de cardápio. Diga ao ChatGPT ou ao Claude o que você está com vontade de comer na semana e ele planeja os jantares e escreve a lista de compras por setor, sem o que já tem no armário.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Uma nota Groceries no app Notas do Mac: uma checklist de oito itens para comprar, com Sourdough, Eggs e Spinach marcados e ordenados no fim."
        caption="Uma checklist de compras no app Notas do Mac. Com Ordenar automaticamente os itens marcados ativado, o que já está no carrinho desce para o fim." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota por semana</h2>
      <p>
        Uma semana de jantares para duas pessoas, como exemplo. Mude os jantares primeiro e depois as compras que eles pedem. Deixe uma
        palavra em cada linha, porque um item vazio da checklist não sobrevive à colagem. O último cabeçalho é uma lista simples do que
        você sempre tem, para não comprar azeite toda semana.
      </p>
      <Keep title="Cardápio semanal para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="O mesmo Markdown colado duas vezes no app Notas do macOS 27: com Command + V os símbolos ficam como texto, e com Editar, Colar como Markdown ele vira um título, uma lista e texto em negrito."
        caption="Colagem comum à esquerda, Colar como Markdown à direita. As linhas da checklist funcionam do mesmo jeito." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, crie uma nota nova e escolha Editar, Colar como Markdown. A linha com # vira o título, cada linha com ## um
        cabeçalho, os jantares continuam como lista e as compras viram checklists. Um Command + V comum deixa os símbolos como texto. No
        iPhone, digite as linhas, selecione as compras e toque no botão Checklist.
      </p>
      <p>
        Depois ative Ordenar automaticamente os itens marcados nos ajustes do Notas. No mercado, cada coisa que você marca desce para o fim
        da lista dela, e o que falta fica no topo.
      </p>

      <h2 id="melhor">Deixe melhor</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Arquivo", "Duplicar Nota"] },
        { on: "Mac", steps: ["Formatar", "Mais", "Desmarcar Tudo"] },
      ]} />
      <ul>
        <li>
          <strong>A próxima semana a partir desta.</strong> No domingo, escolha Arquivo, Duplicar Nota, mude os jantares, clique em cada
          setor e escolha Formatar, Mais, Desmarcar Tudo. A maioria das semanas repete metade das compras.
        </li>
        <li>
          <strong>As receitas a um toque.</strong> Guarde cada receita numa nota própria e crie um link para ela a partir do jantar com
          Adicionar Link. No iOS 27 e no macOS 27, um link também pode apontar para um cabeçalho, então &ldquo;Ingredientes&rdquo; abre
          bem onde você precisa. O post <a href="/blog/apple-notes-ios-27" hrefLang="en">sobre as novidades do Notas no iOS 27</a> (em
          inglês) tem os detalhes.
        </li>
        <li>
          <strong>Compartilhado com quem cozinha.</strong> Compartilhe a nota e permita que as pessoas façam alterações. Quem estiver no
          mercado vai marcando, e o outro celular vê. Vocês dois precisam de uma Conta Apple, e uma nota bloqueada não pode ser
          compartilhada assim.
        </li>
      </ul>
      <p>
        Se prefere ver a semana numa grade com uma coluna para quem cozinha, Formatar, Tabela cria uma; o guia{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra como. Para mais notas que se colam
        do mesmo jeito, veja o guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde um cardápio no Notas para</h2>
      <ul>
        <li><strong>A lista é à mão.</strong> O Notas não sabe que um curry pede leite de coco. Você lê cada receita e digita o que ela pede, toda semana.</li>
        <li><strong>Nada de separar por setor.</strong> É você quem decide onde vão os limões. O Lembretes tem uma lista Compras que separa os itens por seção conforme você adiciona, mas aí a lista fica longe dos jantares. O <a href="/pt/blog/lista-de-compras-notas-iphone">modelo de lista de compras</a> já vem com os setores.</li>
        <li><strong>Nenhuma memória do que você tem.</strong> O Notas não sabe que tem arroz em casa. A lista do armário só ajuda se você ler antes de escrever as compras.</li>
        <li><strong>Nenhuma ideia.</strong> Quando ninguém sabe o que cozinhar, a nota espera.</li>
      </ul>
      <p>
        Compartilhar é o que o Notas faz bem. Planejar os jantares e transformar isso numa lista continua sendo com você.
      </p>

      <h2 id="pinto-notes">Um cardápio que escreve a lista de compras</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Uma nota Groceries no Pinto Notes no Mac. As cinco linhas que o ChatGPT acabou de adicionar estão destacadas, e uma barra embaixo diz que o ChatGPT mudou 5 linhas, com Undo." }}
        caption="Uma nota Groceries no Pinto Notes num Mac. As cinco linhas que o ChatGPT acabou de adicionar estão destacadas, com Undo embaixo." />
      <p>
        É para isso que existe o Pinto Notes. Ele tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude
        podem trabalhar nas suas notas a partir da conversa que você já usa. O modelo grátis de{" "}
        <a href="/templates/meal-plan">cardápio</a> é uma nota com os jantares da semana e quem cozinha, as compras por setor e o que sempre
        tem no armário.
      </p>
      <p>
        No fim de semana, peça para a sua IA planejar a semana. Ela pergunta em quais noites você vai cozinhar e o que deixar de fora,
        sugere jantares, preenche a semana e depois escreve a lista de compras por setor, sem o que já tem no armário. Diga &ldquo;põe leite
        de aveia&rdquo; na quarta e ele entra no setor certo. Cada linha que ela adiciona fica destacada, com Undo, e cada versão anterior da
        nota fica guardada. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. Suas notas do app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
