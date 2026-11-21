import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-gratis-ao-bear-iphone-mac");

// Versão pt-BR de /blog/bear-notes-alternative-free, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "alternativa ao bear notas" e "alternativa ao bear" sem sugestões; "alternativa bear" trouxe apenas Bear Crawl e TunnelBear. Título descritivo, sem inferir demanda.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not201900c07/mac confirma Arquivo > Importar Marcação e Preservar a estrutura da pasta ao importar.
// Menus do Bear seguem a fonte inglesa; seus nomes em pt-BR não foram confirmados. As etapas são descritas sem atribuir tradução ao app.
const ui = UI.pt;
const CHECK = `Conferência da importação do Bear
- [ ] Comparar o texto com a nota no Bear
- [ ] Abrir uma imagem na cópia importada
- [ ] Conferir uma checklist e uma tabela
- [ ] Seguir um link para outra nota
- [ ] Ver como aparecem as etiquetas
- [ ] Guardar a exportação original durante o teste`;

const FAQ = [
  { q: "Dá para usar o Bear sem pagar pelo Pro?", a: ["Sim. A versão grátis oferece notas locais e exportação em Markdown. A sincronização pelo iCloud exige o Bear Pro. Se você escreve em um só aparelho, o plano grátis pode bastar."] },
  { q: "Preciso assinar o Bear para exportar Markdown?", a: ["Não. Markdown e TextBundle são formatos de exportação grátis. No Mac, selecione algumas notas e use a opção de exportação no menu Arquivo. Teste a importação antes de mudar o restante."] },
  { q: "O Pinto preserva todos os recursos do Bear?", a: ["Não há promessa de equivalência completa. O Pinto importa Markdown com anexos e imagens no Mac. Confira etiquetas e links nas suas notas. Configurações e versões antigas do Bear não têm transferência garantida."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-gratis-ao-bear-iphone-mac"
    intro={<>O Pinto Notes é uma alternativa grátis ao Bear para iPhone e Mac, com importação do Bear no Mac. O app Notas também é grátis e oferece pastas e compartilhamento.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#opcoes",label:"Opções grátis"},{href:"#bear",label:"Ficar no Bear"},{href:"#exportar",label:"Exportar"},{href:"#conferir",label:"Conferir"},{href:"#pinto",label:"Pinto Notes"}]}>
      <p>Escolha o Pinto Notes se quer um app parecido com o Notas que importe arquivos do Bear e permita que ChatGPT ou Claude, depois de conectados, leiam e editem suas notas. O Notas oferece pastas e colaboração pelo iCloud. O Bear é grátis para uso local; sincronizar exige o Pro.</p>
      <PostCta slug="pt/alternativa-gratis-ao-bear-iphone-mac" path="/pt/blog/alternativa-gratis-ao-bear-iphone-mac" position="answer" ui={ui.cta} title="Teste suas notas do Bear no Pinto Notes"><p>Baixe o Pinto Notes grátis no Mac e importe primeiro algumas notas. Depois de conectar ChatGPT ou Claude, você pode pedir que leiam e editem essas notas. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="opcoes">O que cada opção grátis oferece</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Para quê</th><th scope="col">Confira antes de mudar</th></tr></thead><tbody>
      <tr><th scope="row">Bear Free</th><td>Escrever em Markdown no próprio aparelho</td><td>Sincronizar pelo iCloud exige Pro</td></tr>
      <tr><th scope="row">Notas</th><td>Pastas e notas compartilhadas</td><td>Como fica o Markdown importado</td></tr>
      <tr><th scope="row">Pinto Notes</th><td>Um app parecido com o Notas, com acesso para ChatGPT ou Claude conectados</td><td>Funciona só no iPhone e no Mac</td></tr>
    </tbody></table></div>
    <p>A Apple lista o <a href="https://apps.apple.com/us/app/notes/id1110145109">Notas como grátis</a>, com sincronização pelo iCloud e colaboração. Cada pessoa com acesso a uma nota compartilhada precisa de Conta Apple. Veja também a <a href="/pt/blog/notas-iphone-vs-bear">comparação entre Notas e Bear</a>.</p>
    <p>O Pinto Notes não tem app para Windows, Android ou web. Se você usa iPhone e Mac, teste primeiro as notas mais importantes.</p>
    <h2 id="bear">Quando vale ficar no Bear</h2>
    <p>O Bear oferece editor Markdown, etiquetas e títulos recolhíveis. Se isso atende seu jeito de escrever e você só precisa de notas locais, pode ficar no plano grátis. A <a href="https://bear.app/#pricing">página de preços do Bear</a>, consultada em 21 de novembro de 2026, reserva a sincronização pelo iCloud e a busca em imagens e PDFs para o Pro.</p>
    <p>O Bear também oferece acesso por IA. Seu <a href="https://bear.app/faq/command-line-interface/">guia oficial</a> documenta, no Mac com Bear 2.8 ou posterior, um conector para Claude, um servidor MCP local e uma ferramenta de linha de comando. Eles podem buscar, ler, criar e editar notas. Teste essa opção se a IA for seu único motivo para mudar.</p>
    <h2 id="exportar">Exporte algumas notas primeiro</h2>
    <p>No Mac, selecione algumas notas na lista do Bear com Command pressionado e use a opção de exportação no menu Arquivo. O <a href="https://bear.app/faq/export-your-notes/">guia do Bear</a> lista Markdown e TextBundle como formatos grátis. Inclua uma nota com imagem para conferir os anexos.</p>
    <p>Para o Pinto Notes, exporte em Markdown com anexos. No menu Arquivo do Pinto no Mac, escolha Bear e selecione a pasta exportada. As imagens também são importadas. Veja o <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>. O Bear original permanece como estava.</p>
    <p>Se preferir o Notas, a Apple documenta <a href="https://support.apple.com/pt-br/guide/notes/not201900c07/mac">Arquivo &gt; Importar Marcação</a> no Mac. Selecione os arquivos Markdown ou a pasta. Você pode marcar “Preservar a estrutura da pasta ao importar”. Confira as cópias antes de importar toda a biblioteca.</p>
    <h2 id="conferir">Confira o que importa nas suas notas</h2>
    <p>Abra a nota original e a cópia lado a lado. O texto pode chegar enquanto um link aponta para outro lugar. Confira cada recurso que você usa.</p>
    <Keep title="Conferência da importação do Bear" text={CHECK} note="Guarde a lista com a exportação durante o teste." />
    <p>O Bear permite manter as etiquetas durante a exportação. Marque essa opção se precisa do texto das etiquetas e veja como o outro app o trata. O texto da etiqueta não garante a mesma organização na barra lateral. Configurações e versões anteriores ficam fora da nota exportada.</p>
    <h2 id="pinto">Use as notas importadas com sua IA</h2>
    <p>O Pinto Notes se parece com o Notas no iPhone e no Mac e guarda todas as versões anteriores de cada nota criada nele. Isso não significa importar as versões antigas do Bear.</p>
    <p>Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, peça para encontrar uma nota de projeto, resumir o que falta e acrescentar o próximo passo. Confira o resultado no Pinto antes de repetir em outras notas.</p>
  </LocalPostPage>;
}
