import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "lista-de-leitura-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-reading-list (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar > Tabela, botão
// Tabela), apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist, "Ordenar automaticamente os itens
// marcados" nos ajustes do app Notas) and support.apple.com/pt-br/102462 "Se você não conseguir colaborar no app Notas"
// (Conta Apple). Apple's pt-BR page gives no shortcut; Option-Command-T is from the English post, which tried it on
// macOS 27. Editar > Colar como Markdown (new in macOS 27) is the pt_BR string in Notes on macOS 27.2. Slug and title
// from Google autocomplete (pt-BR, 21 Nov): "lista de leitura", "lista de leitura iphone", "lista de leitura app",
// "lista de livros para ler", "lista de livros lidos", "app lista de livros lidos"; nothing for "lista de leitura
// notas". "Lista de leitura iphone" mostly means Safari's list, so the title names the Notes app. The books are the
// Brazilian editions, and The Overstory became Torto Arado, a book Brazilian readers lend each other. The Pinto
// template's own choices (To read, Reading, Finished, Dropped) stay in English, as the app is. Facts are the English
// post's.

const ui = UI.pt;

// Tabs between the columns: select the six table lines in Notes and press the Table button.
const TEMPLATE = `Lista de leitura

Título\tAutor\tStatus\tNota\tPor quê
Devoradores de Estrelas\tAndy Weir\tLido\t5\tClube do livro
Piranesi\tSusanna Clarke\tLendo\tAinda não\tIndicação do Jonas
Guerra e Paz\tLiev Tolstói\tAbandonado\t2\tDesisti na p. 90
Não Me Abandone Jamais\tKazuo Ishiguro\tLido\t4\tLi nas férias
Torto Arado\tItamar Vieira Junior\tPara ler\tAinda não\tA Sara emprestou

Anotações
Devoradores de Estrelas: A amizade segura o livro inteiro. Vou emprestar meu exemplar para o meu pai.
Não Me Abandone Jamais: Silencioso e estranho. Fiquei pensando nele por semanas.
`;

const SIMPLE = `# Lista de leitura

## Para ler
- [ ] Piranesi, de Susanna Clarke (indicação do Jonas)
- [ ] Torto Arado, de Itamar Vieira Junior (a Sara emprestou)

## Lidos
- Devoradores de Estrelas, de Andy Weir: 5 de 5
- Não Me Abandone Jamais, de Kazuo Ishiguro: 4 de 5
`;

const FAQ = [
  { q: "Como faço uma lista de leitura no app Notas?", a: [
    "Faça uma nota chamada Lista de leitura com uma tabela de título, autor, status, nota e por quê. Para algo mais simples, use uma checklist dos livros para ler e marque cada um quando terminar.",
  ] },
  { q: "Dá para ordenar a lista de leitura no Notas?", a: [
    "Não. As tabelas do Notas não ordenam, então os livros ficam na ordem em que você adicionou. Uma checklist pode mandar os livros marcados para o fim se você ativar Ordenar automaticamente os itens marcados nos ajustes do Notas.",
  ] },
  { q: "Dá para compartilhar a lista de leitura com o clube do livro?", a: [
    "Sim. Compartilhe a nota e todo mundo pode adicionar livros, mas cada pessoa precisa de uma Conta Apple.",
  ] },
  { q: "Existe um app de lista de leitura que funciona como o app Notas?", a: [
    "O Pinto Notes tem a cara do app Notas, funciona como ele e tem um modelo grátis de lista de leitura com status e uma nota de 1 a 5. Conte ao ChatGPT ou ao Claude sobre um livro e ele anota; pergunte o que ler agora e ele sugere um da sua lista.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="lista-de-leitura-notas-iphone"
      intro={<>
        Os livros que as pessoas indicam acabam em prints, mensagens e abas do navegador, e somem quando você quer algo para ler. O app
        Notas guarda todos numa nota só. Aqui está um modelo de lista de leitura para o Notas, uma versão mais simples em checklist e
        onde o Notas para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#checklist", label: "Uma checklist mais simples" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Uma lista que se organiza" },
        ]}>
          <p>
            O app Notas não tem modelo de lista de leitura, mas uma nota com uma tabela resolve: título, autor, status, uma nota até 5
            e por que você quis ler. Adicione uma linha quando alguém indicar um livro e escreva umas linhas em Anotações quando
            terminar um.
          </p>
          <PostCta template="reading-list" slug="pt/lista-de-leitura-notas-iphone" path="/pt/blog/lista-de-leitura-notas-iphone" position="answer" ui={ui.cta}
            title="Quer seus livros anotados para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de lista de leitura. Conte ao ChatGPT ou ao Claude sobre um livro e ele adiciona a linha; pergunte o que ler agora e ele escolhe da sua lista.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/reading-list-note" width={1520} height={1153} maxWidth={600}
        alt="Uma nota Reading list no Pinto Notes no Mac: uma tabela Books com cinco livros, com título, autor, status, nota e por quê, de Project Hail Mary, lido e com nota 5, até The Overstory, para ler, e depois anotações sobre dois livros."
        caption="Uma lista de leitura no Pinto Notes, onde Status é uma escolha e Rating uma escala de 1 a 5. Dados de exemplo. No app Notas, a mesma tabela funciona com as palavras digitadas." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma tabela de livros</h2>
      <p>
        Cinco colunas bastam. Status é uma de quatro palavras: Para ler, Lendo, Lido ou Abandonado. Por quê é a coluna que você vai
        agradecer: daqui a um ano, &ldquo;Indicação do Jonas&rdquo; diz mais do que o título. Os livros abandonados ficam na lista, para
        você não pegar de novo por engano.
      </p>
      <Keep title="Lista de leitura para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada linha da tabela tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole o modelo numa nota nova, selecione as seis linhas de Título até Torto Arado e
          clique no botão Tabela. Cada Tab vira uma coluna, e você fica com cinco colunas lado a lado.
        </li>
        <li>
          <strong>Adicione um livro num segundo.</strong> Clique na última célula e pressione Tab: aparece uma linha nova para o próximo
          livro.
        </li>
        <li>
          <strong>Células curtas.</strong> O Notas define a largura das colunas sozinho e não deixa arrastar, então cinco colunas dividem
          o espaço. Pensamentos mais longos vão em Anotações, embaixo da tabela.
        </li>
        <li>
          <strong>Fixe a nota.</strong> Fixe a nota no topo da pasta, para ela ser a primeira coisa que você vê quando um amigo diz
          &ldquo;você precisa ler isso&rdquo;.
        </li>
      </ul>
      <p>
        A busca lê cada palavra da nota, então buscar um autor ou o nome de um amigo acha a lista. Para dividir com o clube do livro,
        compartilhe a nota; cada pessoa precisa de uma Conta Apple. O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no
        app Notas</a> (em inglês) mostra todo o resto que uma tabela faz e não faz.
      </p>

      <h2 id="checklist">Uma versão mais simples em checklist</h2>
      <p>
        Se uma tabela é mais do que você quer, uma checklist funciona. Os livros para ler vão numa checklist, e você marca um quando
        termina. Deixe uma palavra em cada linha, porque um item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Checklist de leitura para o app Notas" text={SIMPLE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, Editar, Colar como Markdown transforma a linha com # no título, as linhas com ## em cabeçalhos e os livros
        numa checklist. Um Command + V comum deixa os símbolos como texto. No iPhone, digite a lista, selecione os livros e toque no
        botão Checklist. Ative Ordenar automaticamente os itens marcados nos ajustes do Notas e os livros que você terminou descem para
        o fim. Quando quiser lembrar de um, passe para Lidos com uma nota.
      </p>
      <p>
        Para guardar mais do que uma nota, guarde para cada livro suas citações, o que você pensou e a ideia principal. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde uma lista de leitura no Notas para</h2>
      <ul>
        <li><strong>Nada de ordenar ou filtrar.</strong> As tabelas não ordenam, então achar todos os livros Para ler significa descer lendo a coluna Status.</li>
        <li><strong>Status é só texto.</strong> Nada impede que &ldquo;Lido&rdquo; e &ldquo;Terminado&rdquo; acabem na mesma coluna.</li>
        <li><strong>Todo livro é digitado à mão.</strong> Uma indicação numa mensagem só entra na lista quando você copia.</li>
        <li><strong>A lista não responde.</strong> Ela guarda o que você avaliou bem, mas não diz qual livro Para ler mais se parece com os que você amou.</li>
      </ul>

      <h2 id="pinto-notes">Uma lista de leitura que se organiza sozinha</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/reading-list">lista de leitura</a> é uma nota
        com uma tabela Books e uma seção Notes. Status é uma escolha entre To read, Reading, Finished ou Dropped, e Rating é uma escala de
        1 a 5, então você escolhe em vez de digitar.
      </p>
      <p>
        Conte à sua IA sobre um livro e ela adiciona uma linha: o título, o autor, To read e quem indicou ou por que você quer ler. Diga
        &ldquo;terminei Piranesi, cinco estrelas&rdquo; e ela atualiza o status e a nota. O que você pensou de um livro vai em Notes,
        embaixo do título dele. Pergunte &ldquo;o que eu leio agora?&rdquo; e ela sugere um dos seus livros To read, com base no que
        você avaliou bem. Você ainda pode adicionar e editar cada linha sozinho, e cada versão anterior da nota fica guardada.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. A lista de leitura que você já tem no app Notas vem junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
