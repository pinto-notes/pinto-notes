import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "colar-sem-formatacao-notas-iphone");

// Versão pt-BR de /blog/apple-notes-paste-without-formatting, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "colar sem formatação notas mac" sugeriu "colar sem formatação mac"
// e "colar sem formatação macbook". Apple pt-BR consultada em 21 nov:
// support.apple.com/pt-br/guide/notes/not9474646a9/26/mac/26 (Editar > Colar e Mesmo Estilo;
// Editar > Colar e Manter Estilo), support.apple.com/pt-br/102553 (Option + Shift + Command + V;
// artigo geral chama o comando Colar com o Mesmo Estilo), support.apple.com/pt-br/guide/
// notes/apd46c25187e/mac (Shift + Command + B para Corpo), support.apple.com/pt-br/guide/
// iphone/iph1a9cae52c/ios (seleção e colagem), iph1ac0b3a2/ios (Formatação).
// Os guias do iPhone não documentam um comando único de colagem sem estilo. Sem imagem no original.

const ui = UI.pt;
const FAQ = [
  { q: "Qual atalho cola com o estilo da nota no Mac?", a: ["Use Option + Shift + Command + V. O guia do Notas chama o menu Editar, Colar e Mesmo Estilo. O texto recebe o estilo ao redor do cursor. Confira o menu Editar se seu teclado usar outro atalho."] },
  { q: "A Apple documenta o mesmo comando para o Notas no iPhone?", a: ["Os guias de edição e formatação consultados não mostram esse comando. Eles explicam a colagem comum e como ajustar o texto depois, sem um botão universal para remover todo o estilo."] },
  { q: "Por que o texto continua como cabeçalho?", a: ["A colagem usa o estilo do ponto de inserção. Se o cursor estiver num cabeçalho, o texto pode continuar como cabeçalho. No Mac, use Shift + Command + B para aplicar Corpo antes de colar de novo."] },
  { q: "Como corrigir texto já colado no Mac?", a: ["Copie só o trecho afetado, selecione esse trecho na nota, aplique Corpo se quiser texto comum e escolha Editar, Colar e Mesmo Estilo para substituí-lo."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="colar-sem-formatacao-notas-iphone"
    intro={<>Para colar no app Notas do Mac sem trazer o estilo original, escolha Editar, Colar e Mesmo Estilo, ou pressione Option + Shift + Command + V. Os guias da Apple para iPhone não documentam um comando equivalente.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Atalho no Mac" }, { href: "#corrigir", label: "Corrigir texto colado" },
      { href: "#iphone", label: "No iPhone" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Pinto Notes" },
    ]}><p>No Mac, Colar e Mesmo Estilo aplica ao texto copiado o estilo ao redor do cursor. Use Option + Shift + Command + V no lugar de Command + V. No iPhone, a Apple documenta a colagem comum e controles de formatação, mas não esse mesmo comando.</p>
      <PostCta slug="pt/colar-sem-formatacao-notas-iphone" path="/pt/blog/colar-sem-formatacao-notas-iphone" position="answer" ui={ui.cta} title="Experimente notas em Markdown">
        <p>O Pinto Notes se parece e funciona como o app Notas no iPhone e no Mac, com Markdown por baixo. No Mac, o editor converte texto rico compatível em Markdown e usa texto simples se a conversão não produzir Markdown.</p>
      </PostCta></Answer>} hero={<></>} faq={FAQ}>
    <h2 id="mac">Cole sem o estilo original no Mac</h2>
    <Steps><li>Selecione o texto no documento ou página de origem e pressione Command + C.</li><li>Abra a nota e clique onde o texto deve entrar.</li><li>Escolha Editar, Colar e Mesmo Estilo ou pressione Option + Shift + Command + V.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar e Mesmo Estilo"], keys: "⌥⇧⌘V" }]} />
    <p>O <a href="https://support.apple.com/pt-br/guide/notes/not9474646a9/26/mac/26">guia do Notas para macOS 26</a> traz esse nome de menu. O <a href="https://support.apple.com/pt-br/102553">artigo da Apple sobre copiar e colar</a> confirma o atalho, embora chame o comando de Colar com o Mesmo Estilo. Confira o menu Editar se o atalho variar com seu teclado.</p>
    <p>Ao colar um parágrafo de uma receita, por exemplo, ele pode usar o mesmo estilo das suas notas de cozinha. Para manter o estilo de origem, o guia do Notas traz Editar, Colar e Manter Estilo.</p>
    <h2 id="corrigir">Corrija um trecho já colado</h2>
    <p>Selecione só o trecho afetado para deixar o restante da nota como está.</p>
    <Steps><li>Copie o trecho que quer corrigir.</li><li>Selecione esse trecho na nota.</li><li>Se quiser texto comum, aplique Corpo com Shift + Command + B.</li><li>Escolha Editar, Colar e Mesmo Estilo para substituir a seleção. Confira o resultado.</li></Steps>
    <p>A Apple lista o atalho de Corpo no <a href="https://support.apple.com/pt-br/guide/notes/apd46c25187e/mac">guia de atalhos do Notas</a>. Para mudar fonte ou tamanho depois de colar, veja o <a href="/pt/blog/mudar-fonte-notas-iphone">guia de fontes</a>.</p>
    <h2 id="iphone">O que a Apple documenta no iPhone</h2>
    <p>O <a href="https://support.apple.com/pt-br/guide/iphone/iph1a9cae52c/ios">guia de edição de texto</a> explica seleção, cópia e colagem. O <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia de formatação do Notas</a> mostra como mudar o texto depois. Nenhum deles descreve um comando de Colar e Mesmo Estilo para iPhone.</p>
    <Steps><li>Toque na nota para posicionar o cursor. A Apple também descreve o gesto de afastar três dedos para colar.</li><li>Para selecionar o texto colado, toque duas vezes numa palavra e arraste as alças até incluir o trecho.</li><li>Toque em Formatação e ajuste o estilo indesejado, como negrito ou itálico.</li></Steps>
    <p>Esses controles ajustam a seleção. Os guias não os apresentam como um único comando para retirar todos os estilos. Se precisar colar um trecho com o estilo ao redor, use o comando do Mac quando estiver nele.</p>
    <h2 id="limites">O estilo do lugar onde você cola</h2>
    <p>Colar e Mesmo Estilo usa o estilo do destino. Se o cursor estiver num cabeçalho, o texto colado também pode parecer um cabeçalho. Para um parágrafo comum no Mac, aplique Corpo com Shift + Command + B antes de colar.</p>
    <p>Confira o resultado antes de substituir um trecho longo. Decida se precisa preservar links e listas. Para trechos de código, o estilo <a href="/pt/blog/bloco-de-codigo-notas-iphone">Monoespaçado</a> é outra escolha. Se o comando de colagem estiver apagado no menu, clique no texto da nota e copie uma seleção de texto antes de tentar de novo.</p>
    <h2 id="pinto-notes">Como o Pinto Notes cola texto</h2>
    <p>O Pinto Notes guarda o texto da nota em Markdown e o exibe formatado. No Mac, o editor trata arquivos e imagens primeiro. Depois tenta converter texto rico em Markdown. Se não resultar em Markdown, cola como texto simples. Confira a estrutura que chegou à nota.</p>
    <p>Isso descreve o editor do Mac. Se o único problema for o estilo indesejado, experimente antes o comando do Notas. Para permitir que ChatGPT ou Claude leiam e editem suas notas, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecte um deles</a> (guia em inglês).</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
