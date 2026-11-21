import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativas-ao-obsidian-para-mac");

// Versão pt-BR de /blog/obsidian-alternative-for-mac, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "alternativa ao obsidian mac" não trouxe sugestões; "alternativas ao obsidian" trouxe a própria expressão e "alternativas open source ao obsidian".
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not201900c07/mac confirma Arquivo > Importar Marcação, Preservar a estrutura da pasta ao importar e Opções.
// Nomes dos menus do Bear e Joplin vêm dos guias citados em inglês. As ações são descritas sem inventar tradução de menu.
const ui = UI.pt;
const CHECK = `Antes de mudar um cofre do Obsidian
- Guarde uma cópia do cofre inteiro, inclusive anexos e a pasta oculta de configurações.
- Abra uma nota com imagem e confira se ela veio junto.
- Siga um link entre notas, inclusive para uma subpasta.
- Confira uma nota incorporada e o conteúdo gerado por plugins.
- Busque uma nota cujo título você lembra.
- Abra as notas importadas no iPhone, se usa um.
- Abra um Markdown exportado em outro editor antes de mudar de app.`;
const FAQ = [
  { q: "Qual app para Mac importa um cofre do Obsidian?", a: ["O Pinto Notes importa subpastas, imagens e links entre notas. Bear documenta a importação de uma pasta Markdown com anexos. Joplin importa um diretório Markdown como cadernos e subcadernos. O Notas também importa pastas Markdown. Confira o resultado antes de mudar tudo."] },
  { q: "O Pinto edita meu cofre atual no Finder?", a: ["Não. Ele importa uma cópia para a própria biblioteca e deixa o cofre original no lugar. Não sincroniza os dois. Você pode exportar a biblioteca do Pinto em um ZIP de arquivos Markdown, mas essa é outra operação."] },
  { q: "O que acontece com notas incorporadas do Obsidian?", a: ["Elas viram links para as notas. Imagens e outros arquivos vinculados entram como anexos. A pasta de configurações do Obsidian fica de fora, então os plugins não são transferidos."] },
  { q: "Qual alternativa funciona no Mac e no Android?", a: ["O Joplin funciona nos dois, aceita Markdown e oferece diferentes serviços de sincronização. O Pinto Notes funciona só no iPhone e no Mac. Para continuar editando a mesma pasta de arquivos, você também pode ficar no Obsidian."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativas-ao-obsidian-para-mac"
    intro={<>O Pinto Notes é uma alternativa ao Obsidian para Mac se você quer a organização visual do Notas e importar seu cofre. Bear atende quem escreve em Markdown com etiquetas. O Notas serve para anotações comuns; Joplin é uma opção de código aberto.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#escolher",label:"Escolher"},{href:"#ficar",label:"Ficar no Obsidian"},{href:"#pinto",label:"Importar"},{href:"#conferir",label:"Conferir"}]}>
      <p>O Pinto Notes importa o cofre com subpastas, imagens e links entre notas. Fique no Obsidian se precisa editar a mesma pasta pelo Finder ou depende do gráfico, Canvas e plugins.</p>
      <PostCta slug="pt/alternativas-ao-obsidian-para-mac" path="/pt/blog/alternativas-ao-obsidian-para-mac" position="answer" ui={ui.cta} title="Leve seu cofre para o Pinto Notes"><p>Importe as notas no Mac e leia no Mac ou no iPhone. Depois de conectar ChatGPT ou Claude, eles podem ler e editar as notas. O app está em inglês.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Pinto Notes no Mac encontra o cofre Second brain com 27 notas e confirma a importação." caption="Cofre do Obsidian importado no Pinto Notes para Mac. O original permanece no lugar. Imagem: Pinto Notes." />}
    faq={FAQ}
  >
    <h2 id="escolher">Escolha pelo que você quer mudar</h2>
    <p>Comece pela parte do Obsidian que não atende mais. Um editor diferente pode bastar. Se quer outra organização, teste uma pasta pequena primeiro.</p>
    <ul><li><strong>Pinto Notes:</strong> visual do Notas, importação do Obsidian e acesso para ChatGPT ou Claude conectados. Só iPhone e Mac.</li><li><strong>Notas:</strong> pastas, checklists e busca para anotações do dia a dia.</li><li><strong>Bear:</strong> Markdown, etiquetas e tabelas. Sincronização pelo iCloud exige Pro.</li><li><strong>Joplin:</strong> cadernos e notas Markdown offline. Também funciona em Windows, Linux e Android.</li></ul>
    <p>O Notas importa pastas Markdown. No Mac, escolha <a href="https://support.apple.com/pt-br/guide/notes/not201900c07/mac">Arquivo &gt; Importar Marcação</a> e selecione a pasta. Se quiser, marque “Preservar a estrutura da pasta ao importar”, em Opções. Confira imagens e <code>[[links]]</code>. A importação não promete reproduzir o cofre inteiro. Veja <a href="/pt/blog/notas-iphone-vs-obsidian">Notas vs. Obsidian</a>.</p>
    <p>O <a href="https://bear.app/faq/import-your-notes/">guia do Bear</a> explica como importar uma pasta Markdown e seus anexos referenciados. Escolha o <a href="https://bear.app/">Bear</a> se a organização por etiquetas combina com suas notas.</p>
    <p>O <a href="https://joplinapp.org/help/">Joplin</a> importa um diretório Markdown como cadernos e subcadernos, conforme seu <a href="https://joplinapp.org/help/apps/import_export/">guia</a>. Você escolhe o <a href="https://joplinapp.org/help/apps/sync/">serviço de sincronização</a>, como Dropbox ou Nextcloud.</p>
    <h2 id="ficar">Quando faz sentido ficar no Obsidian</h2>
    <p>Um <a href="https://obsidian.md/help/data-storage">cofre do Obsidian é uma pasta local de arquivos Markdown</a>. Outros editores podem alterar os arquivos e o Obsidian percebe as mudanças. Se você usa scripts ou editores nessa pasta, importar cópias para outro app muda seu processo.</p>
    <p>O Obsidian também tem gráfico, Canvas e plugins da comunidade. Uma consulta gerada por plugin depende de mais do que o Markdown da nota. Se usa esses recursos, fique no Obsidian ou salve os resultados como conteúdo comum antes de mudar. Veja a <a href="https://obsidian.md/">página de recursos</a>.</p>
    <p>Se a única razão para mudar é usar IA, leia antes o <a href="/blog/obsidian-mcp" hrefLang="en">guia de MCP do Obsidian</a>. Talvez você possa manter seu cofre.</p>
    <h2 id="pinto">Leve o cofre para o Pinto Notes</h2>
    <p>O Pinto Notes se parece com o Notas no iPhone e no Mac e guarda todas as versões anteriores das notas. Importa uma cópia para sua biblioteca. As mudanças futuras no Pinto e no Obsidian ficam separadas. Não há app para Windows, Android ou web.</p>
    <ol><li>Guarde uma cópia do cofre inteiro, com imagens e anexos.</li><li>No Mac, abra o menu Arquivo do Pinto Notes e escolha a importação do Obsidian.</li><li>Confirme a pasta encontrada ou escolha outra.</li><li>Importe e confira algumas notas e links antes de mudar seu trabalho diário.</li></ol>
    <p>Subpastas, imagens e links entre notas acompanham a importação. O cofre original fica no lugar. Uma nota incorporada vira link para ela. A pasta oculta <code>.obsidian</code> é ignorada. Plugins e Canvas não são reproduzidos. Veja o <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>.</p>
    <p>Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, peça para ler uma nota de projeto e acrescentar um resumo sob um título. Confira a alteração. A versão anterior fica no histórico.</p>
    <p>Você pode exportar a biblioteca em ZIP com Markdown, pastas, anexos e links atualizados para as cópias exportadas. Abra antes as notas bloqueadas com senha, Face ID ou Touch ID e confira no relatório os arquivos que não puderam ser baixados. A exportação não sincroniza o cofre original.</p>
    <h2 id="conferir">Teste uma pasta antes de mudar tudo</h2>
    <p>Inclua duas notas com link entre si, uma imagem e, se usar plugins, uma nota que dependa deles. Compare a importação com o original.</p>
    <Keep title="Lista para conferir a mudança" text={CHECK} />
    <p>Guarde o cofre e a cópia de segurança até conferir a biblioteca importada e abrir a exportação. Depois, escolha em qual app vai escrever para não dividir as novas alterações.</p>
  </LocalPostPage>;
}
