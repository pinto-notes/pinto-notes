import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "lista-de-compras-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-grocery-list-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão
// Checklist, Formatar > Mais > Desmarcar Tudo, "Ordenar automaticamente os itens marcados" nos ajustes do app Notas),
// support.apple.com/pt-br/102462 "Se você não conseguir colaborar no app Notas" (Conta Apple, nota bloqueada) and
// support.apple.com/pt-br/105086 "Criar listas de compras no app Lembretes no iPhone" (iOS 17, Tipo de Lista, Compras,
// itens agrupados por tipo). Editar > Colar como Markdown (new in macOS 27) is the pt_BR string in Notes on macOS 27.2.
// The share permission is described, not named: its pt-BR wording differs between iOS 26 and 27 on Apple's page.
// Slug and title from Google autocomplete (pt-BR, 21 Nov): "lista de compras notas iphone", "como fazer lista de
// compras no notas iphone", "lista de mercado notas iphone", "lista de compras separada por setor", "lista de compras
// lembretes iphone". Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Compras

## Hortifrúti
- [ ] Maçãs
- [ ] Espinafre
- [ ] Limões

## Padaria e laticínios
- [ ] Leite de aveia
- [ ] Ovos

## Carnes e peixes
- [ ] Filé de salmão

## Mercearia
- [ ] Tomate pelado, 2 latas
- [ ] Arroz

## Congelados
- [ ] Ervilha

## Limpeza
- [ ] Detergente
`;

const FAQ = [
  { q: "O app Notas organiza a lista de compras sozinho?", a: [
    "Não por setor. O Notas mantém os itens na ordem em que você digita. Coloque um cabeçalho para cada setor, adicione cada item embaixo do certo e ative Ordenar automaticamente os itens marcados, para o que já está no carrinho descer para o fim.",
  ] },
  { q: "Lista de compras no Notas ou no Lembretes?", a: [
    "O Lembretes tem um tipo de lista Compras, desde o iOS 17, que separa os itens por categoria conforme você adiciona. O Notas é melhor quando a lista fica ao lado de um cardápio ou de receitas, ou quando você quer os seus próprios setores na ordem do seu mercado.",
  ] },
  { q: "Minha família pode adicionar itens na mesma lista?", a: [
    "Sim. Compartilhe a nota e permita que as pessoas façam alterações. Todo mundo precisa de uma Conta Apple, e uma nota bloqueada não pode ser compartilhada para edição. As marcações e os itens novos aparecem em todos os celulares.",
  ] },
  { q: "Existe uma lista de compras que se organiza sozinha?", a: [
    "O Pinto Notes tem um modelo grátis de lista de compras separada por setor. Diga ao ChatGPT ou ao Claude do que você precisa, até numa frase comprida, e ele coloca cada item no setor certo.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="lista-de-compras-notas-iphone"
      intro={<>
        Uma lista de compras no app Notas cresce na ordem em que as coisas acabam, e você atravessa o mercado duas vezes. Um cabeçalho por
        setor resolve quase tudo. Aqui está um modelo de lista de compras para o app Notas, como compartilhar e quando o Lembretes é a
        ferramenta melhor.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#compartilhar", label: "Compartilhe" },
          { href: "#lembretes", label: "Notas ou Lembretes" },
          { href: "#pinto-notes", label: "Uma lista que se organiza" },
        ]}>
          <p>
            O app Notas não separa uma lista de compras por setor, mas os cabeçalhos separam. Faça uma nota com um cabeçalho para cada setor
            e os itens numa checklist embaixo, ative Ordenar automaticamente os itens marcados e compartilhe com quem mais faz as compras.
            Copie o modelo abaixo para começar.
          </p>
          <PostCta template="grocery-list" slug="pt/lista-de-compras-notas-iphone" path="/pt/blog/lista-de-compras-notas-iphone" position="answer" ui={ui.cta}
            title="Quer cada item no lugar certo sem esforço?">
            <p>O Pinto Notes funciona como o app Notas e tem uma lista de compras grátis separada por setor. Diga ao ChatGPT ou ao Claude do que você precisa e ele coloca cada coisa no setor certo.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/grocery-list-note" width={1520} height={1444} maxWidth={600}
        alt="Uma nota Grocery list no Pinto Notes no Mac: cabeçalhos Fruit and veg, Bread and dairy, Meat and fish e Cupboard, cada um com uma checklist, com Bananas e Butter marcados."
        caption="Uma lista de compras por setor no Pinto Notes. O mesmo formato funciona no app Notas. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma lista, um cabeçalho por setor</h2>
      <p>
        Coloque os setores na ordem em que você anda pelo seu mercado, e você passa por ele uma vez só. Renomeie para encaixar: Frios,
        Bebê, Pet. Deixe uma palavra em cada linha, porque um item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Lista de compras para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
        { on: "Mac", steps: ["Formatar", "Mais", "Desmarcar Tudo"] },
      ]} />
      <ul>
        <li>
          <strong>Cole o modelo.</strong> Num Mac com macOS 27, crie uma nota nova e escolha Editar, Colar como Markdown: cada linha com ##
          vira um cabeçalho e os itens, uma checklist. No iPhone, digite os setores, depois os itens, selecione os itens e toque no botão
          Checklist.
        </li>
        <li>
          <strong>Deixe os itens marcados descerem.</strong> Ative Ordenar automaticamente os itens marcados nos ajustes do Notas. No
          mercado, cada coisa que você marca desce para o fim do setor dela, e o que falta fica sempre no topo.
        </li>
        <li>
          <strong>Uma lista só, não uma por semana.</strong> Apague as linhas marcadas quando chegar em casa, ou escolha Formatar, Mais,
          Desmarcar Tudo para o que você compra toda semana.
        </li>
        <li>
          <strong>Fixe a nota.</strong> Uma nota fixada fica no topo das suas notas, e é a primeira coisa que você vê no mercado.
        </li>
      </ul>

      <h2 id="compartilhar">Compartilhe com quem mora com você</h2>
      <p>
        Compartilhe a nota e permita que as pessoas façam alterações. Quem está em casa adiciona o que acabou, e quem está no mercado vai
        marcando; as mudanças aparecem em todos os celulares. Todo mundo precisa de uma Conta Apple, e uma nota bloqueada não pode ser
        compartilhada para edição.
      </p>
      <p>
        Se você planeja os jantares primeiro, o <a href="/pt/blog/cardapio-semanal-notas-iphone">cardápio semanal no Notas</a> guarda as
        refeições da semana e esta lista numa nota só, e o <a href="/pt/blog/caderno-de-receitas-notas-iphone">modelo de receita</a>{" "}
        guarda os ingredientes de cada receita numa checklist que serve para as compras. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="lembretes">Notas ou Lembretes?</h2>
      <p>
        Justiça seja feita ao Lembretes: desde o iOS 17, ele tem um tipo de lista Compras que separa sozinho o que você adiciona por
        categoria, a única coisa que o Notas não faz. Se tudo o que você quer é uma lista que se organiza, use o Lembretes.
      </p>
      <p>
        O Notas ganha quando a lista fica ao lado de outras coisas: um cardápio, uma receita, uma anotação sobre quem vem jantar. Ele
        também deixa você escolher os setores e a ordem deles, enquanto o Lembretes escolhe as próprias categorias.
      </p>

      <h2 id="limites">Onde uma lista de compras no Notas para</h2>
      <ul>
        <li><strong>A organização é com você.</strong> Cada item vai para o setor dele à mão, então um item anotado às pressas na saída cai no fim da lista.</li>
        <li><strong>Nada impede itens repetidos.</strong> Duas pessoas adicionam leite, e você compra dois.</li>
        <li><strong>Limpar é à mão.</strong> Depois das compras, as linhas marcadas ficam até você apagar.</li>
      </ul>

      <h2 id="pinto-notes">Uma lista de compras que se organiza sozinha</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/grocery-list">lista de compras</a> é uma lista
        por setor: hortifrúti, padaria e laticínios, carnes e peixes, mercearia, congelados e limpeza.
      </p>
      <p>
        Diga à sua IA do que você precisa, até numa frase comprida: &ldquo;precisamos de ovos, duas latas de tomate, espinafre e
        detergente&rdquo;. Ela coloca cada coisa no setor certo e pula o que já está na lista. Quando você diz que voltou do mercado, ela
        apaga as linhas marcadas e diz o que ficou faltando. Você ainda pode digitar e marcar cada item sozinho, e pode{" "}
        <a href="/blog/share-a-note-and-edit-it-together" hrefLang="en">compartilhar a nota e editar junto</a> (em inglês), vendo as
        mudanças de todo mundo enquanto digitam. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em
        inglês) leva um minuto. O app está em inglês.
      </p>
    </LocalPostPage>
  );
}
