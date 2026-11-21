import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure, Capture } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "exportar-notas-iphone-pdf");

// Versão pt-BR de /blog/apple-notes-export-pdf, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: como exportar notas do iphone em pdf; como exportar notas do iphone para pdf.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not201900c07/mac, support.apple.com/pt-br/guide/iphone/iphdf551cfa2/ios, support.apple.com/pt-br/guide/mac-help/mchlp1531/mac, support.apple.com/pt-br/102208.
// Nomes sem confirmação nos guias são descritos como ações.
const ui = UI.pt;

const FAQ = [
  { q: "Por que o PDF mostra só uma página do documento digitalizado?", a: ["Segundo a Apple, a exportação inclui apenas a primeira página de um anexo PDF ou documento digitalizado com várias páginas."] },
  { q: "Posso exportar uma pasta inteira em PDF?", a: ["Os guias da Apple explicam a exportação de uma nota por vez. Não descrevem exportação de uma pasta inteira."] },
  { q: "Posso pedir uma cópia de todas as notas à Apple?", a: ["Sim, em privacy.apple.com. A Apple inclui notas nos dados do iCloud, mas não informa em que formato elas são entregues."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="exportar-notas-iphone-pdf"
    intro={<> Um PDF permite enviar ou imprimir uma nota para quem não usa o app Notas. O caminho muda entre iPhone e Mac, e anexos com várias páginas exigem atenção. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#mac",label:"Mac"},{href:"#iphone",label:"Iphone"}]}>
      <p>No Mac, selecione a nota e use Arquivo, Exportar Para, PDF. No iPhone, abra a nota, toque em compartilhar e escolha Marcação. O Notas exporta uma nota de cada vez.</p>
      <PostCta slug="pt/exportar-notas-iphone-pdf" path="/pt/blog/exportar-notas-iphone-pdf" position="answer" ui={ui.cta} title="Suas notas com ChatGPT ou Claude">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude trabalhar nas notas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="mac">Exporte uma nota no Mac</h2>
<Capture src="/blog/macos27/notes-export-to" width={770} height={795} maxWidth={385} alt="Menu Arquivo do Notas no macOS 27 com Exportar Para, PDF e Markdown." caption="No macOS 27, escolha Arquivo, Exportar Para e PDF." />
<ol><li>Abra o Notas e selecione a nota.</li><li>Escolha <strong>Arquivo &gt; Exportar Para</strong> e depois PDF.</li><li>Se quiser, troque o nome e adicione etiquetas pesquisáveis no Finder.</li><li>Escolha o destino e clique em Salvar.</li></ol>
<p>Em versões anteriores do macOS, a opção pode aparecer em outro ponto do menu Arquivo. Se não a encontrar, use Arquivo, Imprimir. Na janela de impressão, abra o menu PDF e salve como PDF. As opções de segurança dessa janela podem proteger o arquivo com senha.</p>
<h2 id="iphone">Exporte uma nota no iPhone</h2>
<ol><li>Abra a nota e toque no botão de compartilhar.</li><li>Escolha <strong>Marcação</strong>. Se não aparecer, veja mais opções.</li><li>Faça marcações se quiser e toque no botão de salvar o PDF.</li></ol>
<p>Para imprimir, use o botão de compartilhar e escolha Imprimir. O guia da Apple também explica como abrir a nota no Pages. Antes disso, desbloqueie uma nota protegida com senha, Face ID ou Touch ID.</p>
<h2 id="pagina">Por que o anexo sai com uma página só?</h2>
<p>A Apple diz que, se a nota contém PDF ou documento digitalizado com várias páginas, o PDF exportado inclui apenas a primeira página desse anexo. A aparência do anexo também depende da visualização atual. Se você precisa de todas as páginas, envie o arquivo original junto com o PDF da nota.</p>
<h2 id="todas">E uma pasta inteira?</h2>
<p>Os guias da Apple documentam exportar ou imprimir uma nota de cada vez. Não descrevem exportação de uma pasta ou biblioteca inteira em PDF. Em privacy.apple.com, você pode pedir uma cópia dos dados do iCloud, que incluem notas; a Apple dá 14 dias para baixar quando o pedido fica pronto, mas não informa o formato das notas.</p>
<p>Outra opção no Mac é o <a href="https://github.com/storizzi/notes-exporter">notes-exporter</a>, gratuito e de código aberto. Ele exporta notas em PDF, Markdown, HTML, Word ou EPUB, preserva pastas se solicitado, usa Python e Chrome para PDFs e ignora notas bloqueadas. Para backup editável, Markdown é mais útil: o Notas no Mac importa esses arquivos novamente. Veja <a href="/blog/export-apple-notes-to-markdown" hrefLang="en">a exportação em Markdown</a>.</p>
<h2 id="pinto">Notas que já são arquivos</h2>
<Figure shot={SHOTS.welcome} caption="Uma nota no Pinto Notes no Mac também existe como arquivo Markdown." />
<p>No Pinto Notes, cada nota é um arquivo Markdown. No Mac, Arquivo, Exportar como PDF salva a nota aberta, e a impressão também funciona. Nos ajustes da conta, uma exportação gera ZIP com todas as notas e seus arquivos nas pastas. ChatGPT ou Claude podem ler e editar as notas depois da conexão, com versões anteriores guardadas. O app importa o Notas no Mac sem alterá-lo.</p>


<p>Leia também: <a href="/blog/back-up-apple-notes" hrefLang="en">backup do Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
