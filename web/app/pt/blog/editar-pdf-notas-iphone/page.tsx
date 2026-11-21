import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "editar-pdf-notas-iphone");

// Versão pt-BR de /blog/apple-notes-annotate-pdf, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "como editar pdf no notas iphone" trouxe "como editar pdf no notas do iphone"; "anotar pdf notas iphone" não teve sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/iphone/iph8958dd125/ios, iph893c6f8bf/ios, iphdf551cfa2/ios; support.apple.com/pt-br/guide/notes/apdef7f74190/mac; support.apple.com/pt-br/guide/mac-help/mchl1fd88863/mac; support.apple.com/pt-br/guide/preview/prvw11580/mac.
// O guia do iPhone mostra ícones sem nome textual para abrir a Marcação no anexo. Descrevemos onde tocar, sem inventar nome de botão.
const ui = UI.pt;

const REVIEW = `Revisão do PDF

Documento:
Página:
Comentário:
Próximo passo:
`;

const FAQ = [
  { q: "Posso anotar um PDF no Notas do iPhone?", a: ["Sim. Se a prévia for pequena, abra o PDF e toque no botão de Marcação. Se for média ou grande, abra a Marcação direto na prévia. Use caneta, marcador ou lápis com o dedo."] },
  { q: "Posso mudar o texto original do PDF?", a: ["Os guias da Apple descrevem anotações e ações nas páginas, não a substituição do texto existente. No Mac, a ferramenta Texto põe uma caixa sobre a página. A Pré-Visualização também não edita o texto original do PDF."] },
  { q: "Onde fica a Marcação no Mac?", a: ["Abra a nota, clique na seta ao lado do título do PDF e escolha Marcação. Ao terminar, clique em Concluído."] },
  { q: "Compartilhar e Marcação alteram o PDF anexado?", a: ["No iPhone, usar Marcação no compartilhamento da nota inteira cria outro PDF da nota. Para anotar o anexo, abra a Marcação do próprio PDF. A exportação da nota inclui só a primeira página de um anexo com várias páginas."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="editar-pdf-notas-iphone"
    intro={<>O Notas permite escrever e desenhar sobre um PDF no iPhone e no Mac. No iPhone, abra a Marcação do anexo. No Mac, clique na seta ao lado do título do PDF e escolha Marcação.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#mac",label:"Mac"},{href:"#limites",label:"Limites"},{href:"#exportar",label:"Exportação"}]}>
      <p>No iPhone, abra um PDF com prévia pequena antes de tocar em Marcação. Com prévia média ou grande, a opção aparece na própria prévia. No Mac, escolha Marcação no menu do título do PDF e clique em Concluído ao terminar.</p>
      <PostCta slug="pt/editar-pdf-notas-iphone" path="/pt/blog/editar-pdf-notas-iphone" position="answer" ui={ui.cta} title="Guarde também os comentários escritos"><p>O Pinto Notes permite que ChatGPT ou Claude leia e edite as notas escritas sobre a revisão, depois da conexão. Guarda cada versão anterior da nota. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="iphone">Faça anotações num PDF no iPhone</h2>
    <p>Se o arquivo ainda estiver no Arquivos ou Mail, mantenha-o pressionado, toque em compartilhar, escolha Notas, selecione a nota e toque em Salvar.</p>
    <Steps><li>Encontre o PDF na nota.</li><li>Se a prévia for pequena, toque no PDF para abri-lo e use o botão de Marcação. Nas prévias média e grande, abra a Marcação diretamente.</li><li>Escolha caneta, marcador ou lápis e escreva com o dedo.</li><li>Toque outra vez na ferramenta selecionada para ajustar espessura ou opacidade. Use o seletor de cor para escolher uma cor.</li></Steps>
    <p>Para mudar a prévia, abra o menu do PDF, toque em Visualizar Como e escolha Pequeno, Médio ou Grande. Se a barra de Marcação estiver minimizada, toque nela para expandir. Veja os guias da Apple sobre <a href="https://support.apple.com/pt-br/guide/iphone/iph8958dd125/ios">PDFs no Notas</a> e <a href="https://support.apple.com/pt-br/guide/iphone/iph893c6f8bf/ios">desenho com Marcação</a>.</p>
    <h2 id="mac">Use a Marcação no Mac</h2>
    <MenuPaths rows={[{on:"Mac",steps:["Seta ao lado do título do PDF","Marcação","Concluído"]}]} />
    <Steps><li>Abra no Notas a nota que contém o PDF.</li><li>Clique na seta ao lado do título do arquivo e escolha Marcação.</li><li>Adicione seus comentários com as ferramentas.</li><li>Clique em Concluído.</li></Steps>
    <p>Texto adiciona uma caixa que você pode mover. Destacar Seleção marca o trecho selecionado. Desenho cria uma forma, e Assinar acrescenta uma assinatura. As ferramentas variam conforme o arquivo. Veja os guias de <a href="https://support.apple.com/pt-br/guide/notes/mark-up-attachments-apdef7f74190/mac">anexos no Notas</a> e <a href="https://support.apple.com/pt-br/guide/mac-help/mark-up-files-mchl1fd88863/mac">Marcação no Mac</a>.</p>
    <h2 id="limites">O que significa editar um PDF aqui</h2>
    <p>Você pode pôr comentários sobre a página, mas a caixa de texto não substitui as palavras originais do PDF. Os guias do Notas não descrevem essa alteração. A Apple também diz que a <a href="https://support.apple.com/pt-br/guide/preview/annotate-a-pdf-prvw11580/mac">Pré-Visualização não edita o texto existente</a>.</p>
    <p>No iPhone, prévias médias e grandes mostram miniaturas das páginas. Abra o menu de uma miniatura para girar a página. Filtros e Recortar Página são opções apenas para documentos escaneados.</p>
    <h2 id="exportar">Anote o anexo ou exporte a nota?</h2>
    <p>No iPhone, compartilhar a nota inteira e escolher Marcação cria um PDF novo da nota. Para escrever no PDF anexado, use a Marcação do próprio arquivo. A Apple diz que o PDF exportado da nota contém só a primeira página de um PDF ou documento escaneado com várias páginas. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iphdf551cfa2/ios">guia de exportação</a> e <a href="/pt/blog/exportar-notas-iphone-pdf">as etapas completas</a>.</p>
    <h2 id="pinto">Guarde a revisão por escrito</h2>
    <p>Um círculo na página 4 mostra o lugar de uma mudança. Uma nota ao lado explica o que mudar e quem deve fazer isso. Copie o modelo e repita as linhas para cada comentário.</p>
    <Keep title="Nota de revisão do PDF" text={REVIEW} />
    <p>Para esse texto, o Pinto Notes funciona no iPhone e no Mac. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, peça: "Transforme estes comentários em checklist. Mantenha os números das páginas." A IA usa o texto da nota, e o Pinto guarda as versões anteriores. No Mac, você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas</a> sem alterar os originais.</p>
  </LocalPostPage>;
}
