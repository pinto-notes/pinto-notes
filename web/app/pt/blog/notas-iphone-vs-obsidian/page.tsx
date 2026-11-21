import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure, FigurePair } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-vs-obsidian");

// Versão pt-BR de /blog/apple-notes-vs-obsidian, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: apple notes vs obsidian, apple notes vs obsidian 2026; a busca notas do iphone vs obsidian não sugeriu termos.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not201900c07/mac, support.apple.com/pt-br/guide/notes/apde615d29c2/mac, support.apple.com/pt-br/102651.
// Termos de menus usados apenas quando constam das páginas localizadas; os demais passos são descritos.
const ui = UI.pt;

const FAQ = [
  { q: "O Notas é melhor que o Obsidian?", a: ["Para anotações rápidas no iPhone e Mac, costuma ser mais simples. Obsidian é melhor se você quer arquivos Markdown, links de volta, plugins ou Windows, Linux e Android."] },
  { q: "O Obsidian sincroniza com o Notas?", a: ["Não. O Importer copia suas notas no Mac uma vez. No caminho de volta, o Notas importa Markdown. Depois, cada app mantém sua própria cópia."] },
  { q: "O Obsidian é grátis?", a: ["Sim. O app não exige cadastro. Sync custa US$ 4 mensais no plano anual ou US$ 5 no mensal; você também pode usar iCloud entre iPhone e Mac."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-vs-obsidian"
    intro={<> O Notas já está no seu iPhone. O Obsidian oferece arquivos Markdown, links e plugins. A escolha depende dos aparelhos que você usa e de como quer guardar suas notas. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacao",label:"Comparacao"},{href:"#notas",label:"Notas"}]}>
      <p>Escolha o Notas para registros rápidos no iPhone e Mac. Escolha o Obsidian se quer seus arquivos Markdown em várias plataformas, links de volta e plugins.</p>
      <PostCta slug="pt/notas-iphone-vs-obsidian" path="/pt/blog/notas-iphone-vs-obsidian" position="answer" ui={ui.cta} title="Notas com ChatGPT ou Claude">
        <p>O Pinto Notes funciona no iPhone e no Mac, importa suas notas no Mac e permite que ChatGPT ou Claude trabalhem nelas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="comparacao">As diferenças principais</h2>
<div className="tableWrap"><table><thead><tr><th>Critério</th><th>Notas</th><th>Obsidian</th></tr></thead><tbody>
<tr><th>Preço</th><td>Grátis no iPhone e no Mac</td><td>Grátis; Sync custa US$ 4 por mês no plano anual ou US$ 5 no mensal</td></tr>
<tr><th>Aparelhos</th><td>Apple e iCloud.com no navegador</td><td>Mac, Windows, Linux, iPhone e Android</td></tr>
<tr><th>Arquivos</th><td>Notas dentro do app</td><td>Arquivos Markdown numa pasta</td></tr>
<tr><th>Links</th><td>Links entre notas, sem lista dos links de volta</td><td>Links, backlinks e gráfico</td></tr>
<tr><th>Histórico</th><td>Não guarda versões anteriores</td><td>Recuperação local por 7 dias; com Sync, 1 ou 12 meses</td></tr>
</tbody></table></div>
<FigurePair items={[{src:"/blog/news/apple-notes-mac-groceries",width:1600,height:1000,alt:"Lista de compras no app Notas no Mac, com pastas e checklist."},{src:"/blog/news/obsidian-mac-groceries",width:1600,height:1000,alt:"A mesma lista de compras no Obsidian, como arquivo Markdown."}]} caption="A mesma lista de compras no Notas e no Obsidian. Capturas: Pinto Notes." />
<h2 id="notas">Onde o Notas funciona melhor</h2>
<p>O Notas já vem no iPhone e no Mac. Sincroniza pelo iCloud sem configuração extra. Tem checklists, tabelas, etiquetas, Pastas Inteligentes, notas fixadas, resultados matemáticos e gravações com transcrição. Você pode proteger uma nota com senha, Face ID ou Touch ID. Para compartilhar, cada pessoa precisa de uma Conta Apple.</p>
<p>Você pode abrir as notas do iCloud no navegador. No Mac, exporta a nota selecionada em PDF ou Markdown. O app não guarda versões anteriores nem mostra quais notas apontam para a nota aberta. Veja <a href="/blog/apple-notes-backlinks" hrefLang="en">links de volta no Notas</a> e <a href="/blog/apple-notes-version-history" hrefLang="en">histórico de versões</a>.</p>
<h2 id="obsidian">Onde o Obsidian funciona melhor</h2>
<p>Um cofre do Obsidian é uma pasta comum de arquivos Markdown. Qualquer editor de texto abre esses arquivos. Links entre notas se atualizam quando você muda o nome, e o painel Backlinks e o gráfico mostram as conexões. Há Canvas, temas e milhares de plugins.</p>
<p>O serviço Publish custa US$ 8 mensais no plano anual ou US$ 10 no mensal. O Obsidian funciona em cinco plataformas. Você pode sincronizar pelo iCloud entre iPhone e Mac ou pagar pelo Sync, que criptografa os dados e guarda versões. O próprio Obsidian recomenda não usar dois serviços de sincronização no mesmo cofre. Sem Sync, a recuperação de arquivos fica só no aparelho. Plugins podem deixar de receber manutenção. Sua ferramenta de linha de comando precisa do app aberto; plugins da comunidade oferecem MCP.</p>
<h2 id="mudanca">Como passar de um para o outro</h2>
<p>O plugin Importer do Obsidian lê suas notas no Mac e cria arquivos Markdown, com tabelas, imagens, desenhos, digitalizações e PDFs. Ele ignora notas bloqueadas. No caminho de volta, o Notas no Mac importa arquivos Markdown em <strong>Arquivo &gt; Importar Marcação</strong>. Confira os links depois da importação. As duas operações fazem cópias; não mantêm os apps sincronizados. <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">Veja o passo a passo da migração</a>.</p>
<h2 id="alternativa">E o Pinto Notes?</h2>
<Figure shot={SHOTS.aiEdit} caption="O ChatGPT acrescentou itens a uma lista no Pinto Notes. As mudanças aparecem destacadas, com Desfazer." />
<p>O Pinto Notes funciona no iPhone e no Mac, com pastas, tabelas e checklists como no Notas. Guarda arquivos Markdown, links [[assim]] com a lista de links de volta, todas as versões anteriores e notas criptografadas. ChatGPT, Claude, Claude Code e Codex podem ler e editar as notas depois de conectados. Ele importa o Notas e cofres do Obsidian no Mac sem alterar as origens.</p>
<PostFigure src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Telas de importação de um cofre do Obsidian no Pinto Notes, com 27 notas." caption="A importação preserva pastas, imagens e links; o cofre original permanece." />
<p>O Pinto Notes não tem gráfico, plugins do Obsidian, app para Windows, Linux ou Android nem versão web. Se você precisa disso, escolha o Obsidian. Para trabalho em equipe com bancos de dados, veja <a href="/pt/blog/notas-iphone-vs-notion">Notas ou Notion</a>.</p>

<p>Leia também: <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>, e <a href="/blog/obsidian-mcp" hrefLang="en">MCP no Obsidian</a>.</p>
  </LocalPostPage>;
}
