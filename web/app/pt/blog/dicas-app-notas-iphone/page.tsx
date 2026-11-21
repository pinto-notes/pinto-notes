import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure, Capture } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "dicas-app-notas-iphone");

// Versão pt-BR de /blog/apple-notes-tips, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: dicas para usar notas do iphone e dicas app notas iphone não tiveram sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apdf028f7034/mac, support.apple.com/pt-br/guide/notes/apd93c815aa0/mac, support.apple.com/pt-br/guide/notes/apd58edc7964/mac, support.apple.com/pt-br/guide/iphone/iphb8628c6b8/ios.
// Nomes sem confirmação nos guias são descritos como ações.
const ui = UI.pt;

const FAQ = [
  { q: "O que dá para fazer no Notas além de escrever?", a: ["Checklists, tabelas, etiquetas, Pastas Inteligentes, links, contas, digitalizações, gravações e notas bloqueadas."] },
  { q: "Como abrir uma Nota Rápida no Mac?", a: ["Pressione Fn ou Globo com Q. A nota fica na pasta Notas Rápidas."] },
  { q: "A busca encontra texto de um documento digitalizado?", a: ["Sim. Também encontra escrita à mão em idiomas compatíveis e objetos em imagens. Dentro de uma nota, inclua anexos para buscar num PDF."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="dicas-app-notas-iphone"
    intro={<> O app Notas faz bem mais do que guardar texto. Estas dicas mostram como capturar informações, organizar listas e encontrar depois o que você salvou. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#capturar",label:"Capturar"},{href:"#organizar",label:"Organizar"}]}>
      <p>Comece por Notas Rápidas, checklists ordenadas, notas fixadas e Pastas Inteligentes. Tabelas, links, digitalizações e busca ajudam a manter tudo acessível.</p>
      <PostCta slug="pt/dicas-app-notas-iphone" path="/pt/blog/dicas-app-notas-iphone" position="answer" ui={ui.cta} title="Suas notas com ChatGPT ou Claude">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude trabalhar nas notas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<PostFigure src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} maxWidth={700} alt="Nota com cabeçalho, checklist, etiqueta, tabela e link no Mac." caption="Uma nota usa vários dos recursos abaixo." />
<h2 id="capturar">Guarde a informação na hora</h2>
<h3>1. Abra uma Nota Rápida</h3><p>No Mac, pressione Fn ou Globo com Q. Você também pode levar o ponteiro ao canto inferior direito. No Safari, use o botão de compartilhar para adicionar uma Nota Rápida. Elas ficam na pasta Notas Rápidas. Nos ajustes do Notas, você pode desativar a opção que sempre reabre a última.</p>
<h3>2. Digitalize um papel</h3><p>No iPhone, abra uma nota, toque no botão de anexos e escolha digitalizar documentos. O resultado fica como PDF. Para poucas linhas, use a opção de digitalizar texto e insira as palavras editáveis na nota.</p>
<h3>3. Grave uma reunião</h3><p>No botão de anexos, escolha gravar áudio. Em Mac com M1 ou posterior e idioma compatível, a transcrição aparece; você pode acrescentá-la à nota. Com Apple Intelligence, também há resumo.</p>
<h3>4. Cole Markdown com formatação</h3><p>No Mac com macOS 27, o Notas aceita colar Markdown e transforma símbolos de título e checklist em formatação. Uma colagem comum deixa os símbolos como texto.</p>
<PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640} alt="Comparação entre uma colagem comum e uma colagem de Markdown formatado no Notas." caption="O Markdown vira cabeçalho e lista quando colado pela opção apropriada." />
<h3>5. Duplique uma nota como modelo</h3><p>O Notas não tem galeria de modelos. Guarde uma nota pronta numa pasta e duplique a cada uso, pelo menu Arquivo no Mac. Veja <a href="/blog/apple-notes-templates" hrefLang="en">modelos para copiar</a>.</p>
<Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277} alt="Menu Arquivo do Notas com a opção de duplicar nota." caption="Duplique uma nota pronta para começar a próxima." />
<h2 id="organizar">Dê forma às notas</h2>
<h3>6. Ordene os itens marcados da checklist</h3><p>Selecione linhas e toque no botão Checklist. Nos ajustes do Notas, ative a ordenação automática dos itens marcados. No iPhone, ela fica em Ajustes, Apps, Notas. No Mac, você também pode desmarcar todos os itens para reutilizar uma lista. Um clique com Command marca ou desmarca a lista inteira.</p>
<h3>7. Recolha cabeçalhos</h3><p>Formate uma linha como cabeçalho ou subcabeçalho. O botão ao lado permite recolher o texto abaixo e expandi-lo depois.</p>
<h3>8. Destaque um trecho</h3><p>Selecione o texto, abra a formatação e use o botão de destaque. O círculo ao lado escolhe a cor.</p>
<h3>9. Monte tabelas</h3><p>O comando de tabela cria duas linhas e duas colunas. Tab na última célula acrescenta uma linha. Você também pode separar colunas por tabulação, selecionar as linhas e transformá-las em tabela. Tabelas do Notas não classificam nem somam. <a href="/blog/apple-notes-tables" hrefLang="en">Veja mais sobre tabelas</a>.</p>
<h3>10. Faça contas no texto</h3><p>Digite uma soma e o sinal de igual. Resultados de Cálculos sugere ou insere a resposta, conforme a opção escolhida no menu de formatação. Você também pode dar nomes aos números e usá-los numa conta posterior.</p>
<PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={320} alt="Exemplo de valores nomeados e somados numa nota do iPhone." caption="As contas funcionam no texto da nota. Imagem: Apple." />
<h2 id="achar">Encontre tudo de novo</h2>
<h3>11. Fixe as notas frequentes</h3><p>No Mac, use a opção de fixar nota no menu Arquivo ou deslize a nota com dois dedos. No iPhone, toque e segure a nota e escolha fixar. Ela aparece no topo da pasta.</p>
<h3>12. Crie links entre notas</h3><p>Selecione as palavras e adicione um link para outra nota. No macOS 27, você também pode apontar para um cabeçalho específico. Um índice de receitas, por exemplo, fica fácil de percorrer.</p>
<PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} maxWidth={490} alt="Janela de link do Notas com cabeçalhos da nota de destino." caption="Um link pode levar diretamente a uma seção da nota." />
<h3>13. Etiquetas e Pastas Inteligentes</h3><p>Digite #trabalho numa nota para criar uma etiqueta. Uma Pasta Inteligente pode juntar notas com essa etiqueta ou com itens ainda abertos em checklists. Ao apagar a Pasta Inteligente, as notas ficam nas pastas originais.</p>
<PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={640} alt="Regra de Pasta Inteligente para itens não marcados em checklists." caption="Uma pasta reúne notas com tarefas ainda abertas." />
<h3>14. Busque dentro de digitalizações e PDFs</h3><p>A busca encontra texto digitado, manuscrito e digitalizado, além de objetos em fotos. Dentro de uma nota, use a busca e inclua anexos para procurar em PDFs. Notas bloqueadas aparecem só pelo título. Para bloquear uma nota compatível, use senha, Face ID ou Touch ID.</p>
<h2 id="ideias">O que guardar no Notas</h2>
<p>Um caderno de receitas com índice, lista de mala reutilizável, compras, gastos do mês, anotações de aulas, livros, comprovantes e garantias. Veja <a href="/pt/blog/caderno-de-receitas-notas-iphone">o modelo de receitas</a>, <a href="/pt/blog/lista-de-compras-notas-iphone">a lista de compras</a> e <a href="/pt/blog/planilha-de-gastos-notas-iphone">os gastos</a>.</p>
<h2 id="pinto">15. Peça ajuda à sua IA</h2>
<Figure shot={SHOTS.aiEdit} caption="Uma lista no Pinto Notes depois de uma edição pelo ChatGPT, com botão Desfazer." />
<p>O Notas não deixa ChatGPT ou Claude trabalhar em toda a sua biblioteca pelo celular ou web e não guarda versões anteriores. No Pinto Notes, os dois podem ler e editar as notas depois de conectados; cada alteração aparece e pode ser desfeita. O app guarda arquivos Markdown criptografados, oferece modelos e importa Notas, Obsidian, Evernote, Keep, Bear ou texto no Mac. Funciona só em iPhone e Mac. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Veja a conexão</a>.</p>


<p>Leia também: <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas e Pastas Inteligentes</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
