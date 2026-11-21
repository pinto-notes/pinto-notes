import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-vs-bear");

// Versão pt-BR de /blog/apple-notes-vs-bear, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "notas iphone vs bear" não trouxe sugestões; "apple notes vs bear" trouxe "apple notes vs bear app". Mantida a forma "Notas do iPhone" dos posts locais.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not201900c07/mac, support.apple.com/pt-br/guide/notes/apd4e6e2c9a6/mac, support.apple.com/pt-br/guide/icloud/mm8685520792/icloud.
// O nome dos menus do Bear segue o post inglês; o nome em pt-BR não foi verificado. A migração no Bear é descrita sem inventar tradução de menu.
const ui = UI.pt;

const FAQ = [
  { q: "Bear ou Notas para escrever?", a: ["Use o Bear se escreve em Markdown e quer índice de títulos e links de retorno. Use o Notas se prefere pastas e notas compartilhadas pelo iCloud. Ambos têm tabelas e checklists."] },
  { q: "Preciso do Bear Pro para sincronizar com o iPhone?", a: ["Sim. A versão grátis guarda notas para acesso local. A sincronização pelo iCloud exige o Bear Pro, listado a US$ 2,99 por mês ou US$ 29,99 por ano em 21 de novembro de 2026."] },
  { q: "Posso levar as notas do Bear para o Notas?", a: ["Sim. Exporte do Bear em Markdown e, no Mac, use Arquivo > Importar Marcação no Notas. Confira imagens, tabelas e links antes de migrar tudo. Os links wiki do Bear são próprios do app."] },
  { q: "O Claude pode editar notas no Bear?", a: ["Sim. No Mac, o Bear 2.8 ou posterior tem um conector para o Claude, além de servidor MCP local e ferramenta de linha de comando. Essas ferramentas não leem nem alteram notas criptografadas."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-vs-bear"
    intro={<>O Notas atende bem listas e pastas compartilhadas. O Bear é para quem prefere Markdown e etiquetas aninhadas. Veja o que muda na sincronização e na migração.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacao",label:"Comparação"},{href:"#notas",label:"Notas"},{href:"#bear",label:"Bear"},{href:"#migracao",label:"Migração"}]}>
      <p>O Notas usa pastas, Pastas Inteligentes e colaboração pelo iCloud. O Bear oferece Markdown, etiquetas aninhadas e links de retorno. Ambos funcionam no iPhone e no Mac, mas sincronizar no Bear exige assinatura Pro.</p>
      <PostCta slug="pt/notas-iphone-vs-bear" path="/pt/blog/notas-iphone-vs-bear" position="answer" ui={ui.cta} title="Suas notas com ChatGPT ou Claude"><p>O Pinto Notes funciona no iPhone e no Mac, guarda versões anteriores e permite que ChatGPT ou Claude leia e edite suas notas depois da conexão. Importa Notas e Bear no Mac. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="comparacao">Em resumo</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">O que importa</th><th scope="col">Notas</th><th scope="col">Bear</th></tr></thead><tbody>
      <tr><th scope="row">Organização</th><td>Pastas, etiquetas e Pastas Inteligentes</td><td>Etiquetas, inclusive aninhadas, como #trabalho/projeto</td></tr>
      <tr><th scope="row">Escrita</th><td>Texto formatado, checklists e tabelas</td><td>Editor Markdown, tabelas, tarefas e temas</td></tr>
      <tr><th scope="row">Links</th><td>Links entre notas</td><td>Links wiki, links de retorno e links para títulos</td></tr>
      <tr><th scope="row">Sincronização</th><td>iCloud ativado em cada aparelho</td><td>iCloud com Bear Pro</td></tr>
      <tr><th scope="row">Exportação no Mac</th><td>PDF ou Markdown</td><td>Markdown e outros formatos; PDF e Word exigem Pro</td></tr>
    </tbody></table></div>
    <p>O Bear tem uma versão grátis para notas locais. O Pro custava US$ 2,99 por mês ou US$ 29,99 por ano na <a href="https://bear.app/#pricing">página de preços do Bear</a> em 21 de novembro de 2026. Também acrescenta busca em imagens e PDFs e mais temas.</p>
    <h2 id="notas">Quando o Notas é melhor</h2>
    <p>Pastas separam trabalho e casa. Use checklists, tabelas, notas fixadas e etiquetas. Uma Pasta Inteligente reúne notas por critérios, como uma etiqueta ou itens ainda não marcados.</p>
    <p>Para editar uma lista com outra pessoa, <a href="https://support.apple.com/pt-br/guide/notes/apd4e6e2c9a6/mac">compartilhe a nota ou a pasta pelo iCloud</a>. Todos precisam de Conta Apple. Você pode permitir edição ou apenas visualização. Para ver as próprias notas no iPhone e no Mac, use a mesma conta e ative o Notas no iCloud em cada aparelho.</p>
    <p>Teste esses recursos com algumas notas antes de migrar. Se faltam links de retorno entre textos, o Bear tem essa função. Se você só precisa achar tarefas pendentes, uma Pasta Inteligente pode resolver.</p>
    <h2 id="bear">Quando o Bear é melhor</h2>
    <p>O Bear usa Markdown no editor. Seu painel de informações cria um índice com os títulos da nota. Digite [[ para encontrar outra nota e criar um link. A aba de links de retorno mostra notas que apontam para a atual e menções ao título sem link. Veja o <a href="https://bear.app/faq/how-to-use-the-info-panel-table-of-contents-and-backlinks-in-bear/">guia do Bear</a>.</p>
    <p>Uma etiqueta como #trabalho/projeto coloca projeto dentro de trabalho. Você pode usar várias etiquetas na mesma nota. Teste essa organização com notas reais antes de importar a biblioteca.</p>
    <p>O Bear guarda as notas em um banco de dados, não em uma pasta de arquivos Markdown. A <a href="https://bear.app/faq/export-your-notes/">exportação</a> permite salvar várias notas em Markdown, TXT, TextBundle ou RTF mesmo no plano grátis. O Pro acrescenta PDF, DOCX, HTML e EPUB. O Notas também exporta Markdown.</p>
    <p>No Mac, o Bear 2.8 ou posterior tem conector para o Claude, servidor MCP local e ferramenta de linha de comando. Eles podem buscar, ler, criar e editar notas, com filtros por etiqueta. Notas criptografadas ficam fora desse acesso. Veja as <a href="https://bear.app/faq/command-line-interface/">instruções oficiais</a>.</p>
    <h2 id="migracao">Como mudar de app</h2>
    <p>Para testar o Bear, exporte uma nota do Notas no Mac em Markdown. No macOS 27, o caminho é Arquivo &gt; Exportar Para &gt; Markdown. O <a href="https://bear.app/faq/migrate-from-apple-notes/">guia de migração do Bear</a> explica como importar a pasta Markdown. Seu método antigo com Automator transforma tarefas em marcadores e deixa de fora anexos que não sejam fotos.</p>
    <p>Para voltar, exporte as notas do Bear em Markdown. No Notas para Mac, escolha <strong>Arquivo &gt; Importar Marcação</strong>. A Apple explica como preservar a estrutura de pastas na importação. Confira imagens, tabelas, checklists e links wiki nas cópias importadas. A importação não mantém os dois apps sincronizados.</p>
    <h2 id="pinto">Outra opção para iPhone e Mac</h2>
    <p>O Pinto Notes tem a aparência do Notas, guarda arquivos Markdown e mantém todas as versões anteriores. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT ou Claude</a>, você pode pedir que editem uma lista ou texto na própria nota.</p>
    <Figure shot={SHOTS.aiEdit} caption="Lista de compras no Pinto Notes para Mac depois de uma edição pelo ChatGPT." />
    <p>Para vir do Bear, exporte as notas em Markdown com os anexos e escolha a pasta no Pinto. As imagens acompanham as notas. Veja o <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>. O Pinto também <a href="/blog/move-from-apple-notes" hrefLang="en">importa o Notas no Mac</a> sem alterá-lo.</p>
  </LocalPostPage>;
}
