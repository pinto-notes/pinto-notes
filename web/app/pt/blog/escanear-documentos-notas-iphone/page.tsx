import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "escanear-documentos-notas-iphone");

// Versão pt-BR de /blog/apple-notes-scan-document, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "escanear documentos app notas" trouxe "como escanear documentos no app notas"; "escanear documento notas iphone" também apareceu.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/iphone/iph653f28965/ios, iph8958dd125/ios; support.apple.com/pt-br/108963, /102332; support.apple.com/pt-br/guide/preview/prvw1509/mac.
// O submenu da Câmera de Continuidade não tem nome localizado confirmado; a ação é descrita sem criar nome de menu.
const ui = UI.pt;

const FAQ = [
  { q: "Como juntar várias páginas num PDF pelo Notas?", a: ["Na nota, toque em Anexos e Escanear Documentos. Capture todas as páginas antes de tocar em OK. O Notas salva um PDF na nota."] },
  { q: "Escanear Texto cria uma nota editável?", a: ["Sim. Selecione as palavras capturadas pela câmera e toque em Inserir. Escanear Documentos, por sua vez, salva um PDF. Escanear Texto funciona em idiomas compatíveis."] },
  { q: "Como diminuir o tamanho de um PDF escaneado?", a: ["No Mac, abra o PDF na Pré-Visualização, escolha Arquivo > Exportar e, em Filtro Quartz, Reduzir Tamanho do Arquivo. Salve uma cópia e confira se as letras continuam legíveis."] },
  { q: "Posso escanear direto para o Notas no Mac?", a: ["Sim, com a Câmera de Continuidade e o iPhone. Os aparelhos precisam de Wi-Fi, Bluetooth e a mesma Conta Apple com autenticação de dois fatores."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="escanear-documentos-notas-iphone"
    intro={<>No Notas do iPhone, abra uma nota, toque em Anexos e depois em Escanear Documentos. Capture as páginas e toque em OK para guardar um PDF na nota.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#pdf",label:"PDF"},{href:"#texto",label:"Texto"},{href:"#mac",label:"Mac"}]}>
      <p>Escanear Documentos salva uma ou várias páginas em PDF. Para inserir palavras editáveis na nota, use Escanear Texto. No Mac, a Câmera de Continuidade permite escanear com o iPhone direto para uma nota.</p>
      <PostCta slug="pt/escanear-documentos-notas-iphone" path="/pt/blog/escanear-documentos-notas-iphone" position="answer" ui={ui.cta} title="PDFs ao lado das suas notas"><p>O Pinto Notes guarda PDFs e arquivos nas notas e pastas do iPhone e Mac. Depois da conexão, ChatGPT ou Claude pode ler e editar o texto das suas notas. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="iphone">Escaneie um documento no iPhone</h2>
    <MenuPaths rows={[{on:"iPhone",steps:["Anexos","Escanear Documentos"]}]} />
    <Steps><li>Abra uma nota no Notas ou crie uma nova.</li><li>Toque no botão Anexos e escolha Escanear Documentos.</li><li>Aponte a câmera para a página. No modo automático, mantenha o iPhone parado para capturá-la.</li><li>Para capturar manualmente, toque no obturador ou aperte um botão de volume. Ajuste os cantos e toque em Manter.</li><li>Escaneie as outras páginas e toque em OK.</li></Steps>
    <p>Os guias da Apple mostram flash e filtros de imagem no iOS 26. Veja as instruções para <a href="https://support.apple.com/pt-br/guide/iphone/iph653f28965/ios">escanear no Notas</a> e o <a href="https://support.apple.com/pt-br/108963">artigo de suporte</a>.</p>
    <h2 id="pdf">O documento já é um PDF</h2>
    <p>As páginas escaneadas na mesma sessão ficam juntas num PDF. Para enviá-lo, abra o menu do PDF anexado e use a opção de compartilhar. A Visualização Rápida abre o documento em tela cheia. A Apple descreve esses controles no <a href="https://support.apple.com/pt-br/guide/iphone/iph8958dd125/ios">guia de PDFs no Notas</a>.</p>
    <p>Compartilhe o arquivo escaneado se o destinatário precisa de todas as páginas. Ao exportar a nota inteira como PDF, o Notas inclui apenas a primeira página de um anexo com várias páginas. Veja <a href="/pt/blog/exportar-notas-iphone-pdf">como exportar uma nota em PDF</a>.</p>
    <h2 id="texto">Escaneie palavras para editar</h2>
    <MenuPaths rows={[{on:"iPhone",steps:["Anexos","Escanear Texto","Inserir"]}]} />
    <p>Na nota, toque em Anexos e Escanear Texto. Aponte a câmera, selecione as palavras e toque em Inserir. O texto entra na nota. A Apple diz que a função depende do idioma. Essas etapas não transformam um PDF já digitalizado em texto editável. Confira o resultado com o papel.</p>
    <h2 id="mac">Escaneie para o Mac com o iPhone</h2>
    <p>Antes, ative Wi-Fi e Bluetooth nos dois aparelhos e entre na mesma Conta Apple com autenticação de dois fatores.</p>
    <Steps><li>Abra a nota no Mac e clique no ponto onde deseja o documento com a tecla Control pressionada.</li><li>Escolha a opção de escanear documentos pelo iPhone no menu que aparecer.</li><li>Capture e ajuste as páginas no iPhone.</li><li>Ao terminar, salve no iPhone. O PDF aparece na nota do Mac.</li></Steps>
    <p>Confira os <a href="https://support.apple.com/pt-br/102332">requisitos da Câmera de Continuidade</a> se a opção não aparecer. A Apple lista macOS Mojave 10.14 ou posterior em Macs compatíveis e iOS 12 ou posterior; recomenda manter o macOS atualizado.</p>
    <h2 id="tamanho">Diminua o tamanho do arquivo</h2>
    <p>Para um PDF grande, abra-o na Pré-Visualização do Mac. Escolha Arquivo &gt; Exportar e, em Filtro Quartz, escolha Reduzir Tamanho do Arquivo. Salve com outro nome para manter o original. A compressão pode reduzir a qualidade. Abra a cópia e confira as letras pequenas. Veja o <a href="https://support.apple.com/pt-br/guide/preview/prvw1509/mac">guia da Pré-Visualização</a>.</p>
    <h2 id="limites">Qual opção usar?</h2>
    <p>Escanear Documentos guarda a página em PDF. Escanear Texto insere palavras na nota. A opção Visualizar Como muda só o tamanho da prévia do PDF no Notas, não o tamanho do arquivo.</p>
    <h2 id="pinto">Guarde o PDF com suas notas</h2>
    <p>O Pinto Notes aceita fotos, PDFs e arquivos nas notas e pastas do iPhone, como mostra o <a href="/blog/pinto-notes-for-iphone" hrefLang="en">post sobre o app</a>. Use o scanner da Apple para criar o PDF. Depois, guarde-o ao lado das anotações sobre o documento. ChatGPT ou Claude podem editar o texto das notas após a <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão</a>, com versões anteriores preservadas. No Mac, você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas</a> sem alterá-lo.</p>
  </LocalPostPage>;
}
