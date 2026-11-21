import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "gravar-transcrever-audio-notas-iphone");

// Versão pt-BR de /blog/apple-notes-record-and-transcribe, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "transcrever audio notas iphone" e "transcrever audio no notas iphone" apareceram; a segunda também sugeriu "transcrever audio no iphone".
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/iphone/iphbe11247b5/ios, iph57c6590e9/ios; support.apple.com/pt-br/guide/notes/apdb5106e334/mac; support.apple.com/pt-br/121115.
// Botões que o guia identifica apenas por ícone são descritos pela função. Os nomes de comandos de transcrição constam dos guias localizados.
const ui = UI.pt;

const FOLLOW_UP = `Use minha nota "Ata de reunião" no Pinto Notes. Vou colar a transcrição abaixo.
Adicione o nome e a data da reunião, um resumo de duas linhas e as decisões em Reuniões, com a mais recente em cima.
Adicione cada tarefa em Tarefas como "Responsável: tarefa (prazo)", numa checklist.
Se algo não estiver claro, pergunte antes de escrever.`;

const FAQ = [
  { q: "Transcrever áudio exige Apple Intelligence?", a: ["Não. A transcrição funciona no iPhone 12 ou posterior ou em Mac com M1 ou posterior, com idioma compatível. O resumo da transcrição exige Apple Intelligence."] },
  { q: "Onde ficam as ligações gravadas?", a: ["Na pasta Gravações de Ligações do Notas. A gravação começa no app Telefone, e os dois participantes ouvem um aviso. A disponibilidade varia por região."] },
  { q: "Posso escrever na nota enquanto gravo?", a: ["Sim. No iPhone, deslize para baixo a partir do topo da tela de gravação. No Mac, edite a nota enquanto a gravação continua."] },
  { q: "Apagar a gravação apaga a transcrição?", a: ["Sim. Use Adicionar Transcrição à Nota ou Copiar Transcrição antes de apagar um áudio cujo texto você precisa guardar."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="gravar-transcrever-audio-notas-iphone"
    intro={<>Para gravar no Notas, abra uma nota, toque em Anexos e escolha Gravar Áudio. A transcrição exige iPhone 12 ou posterior, ou Mac com M1 ou posterior, e um idioma compatível.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#mac",label:"Mac"},{href:"#requisitos",label:"Requisitos"},{href:"#texto",label:"Transcrição"},{href:"#ligacoes",label:"Ligações"}]}>
      <p>Grave o áudio numa nota e abra a transcrição para copiar ou inserir o texto. A transcrição não precisa de Apple Intelligence. O resumo precisa.</p>
      <PostCta slug="pt/gravar-transcrever-audio-notas-iphone" path="/pt/blog/gravar-transcrever-audio-notas-iphone" position="answer" template="meeting-notes" ui={ui.cta} title="Transforme a transcrição em tarefas"><p>O Pinto Notes tem um modelo grátis de ata. Depois de conectar ChatGPT ou Claude, cole a transcrição para criar resumo, decisões e tarefas com responsável e prazo. O app está em inglês.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Nota no Mac com gravação de uma aula, prévia da transcrição e resumo do áudio no Notas." caption="Gravação de uma aula e prévia da transcrição no Notas para Mac. Imagem: Apple." />}
    faq={FAQ}
  >
    <h2 id="iphone">Grave e transcreva no iPhone</h2>
    <MenuPaths rows={[{on:"iPhone",steps:["Notas","Anexos","Gravar Áudio"]}]} />
    <Steps><li>Abra uma nota, toque em Anexos e escolha Gravar Áudio.</li><li>Toque no botão de gravação. Use o botão de transcrição para ver as palavras enquanto fala.</li><li>Deslize para baixo a partir do topo se quiser escrever na nota durante a gravação.</li><li>Ao terminar, pause e conclua a gravação.</li></Steps>
    <p>Essas são as etapas do <a href="https://support.apple.com/pt-br/guide/iphone/iphbe11247b5/ios">guia da Apple para iPhone</a>. Numa reunião, anote as decisões enquanto conversa e confira depois as palavras exatas no áudio.</p>
    <h2 id="mac">Grave no Notas do Mac</h2>
    <Steps><li>Na nota, clique no botão de anexos na barra de ferramentas e escolha Gravar Áudio.</li><li>Inicie a gravação. Você pode continuar editando a nota.</li><li>Abra a transcrição ao vivo. Ao terminar, pause e conclua.</li></Steps>
    <p>Para rever o texto, clique duas vezes na gravação e abra a transcrição. O <a href="https://support.apple.com/pt-br/guide/notes/apdb5106e334/mac">guia para Mac</a> diz que todos esses recursos funcionam com notas do iCloud; contas de outros provedores podem ter limitações.</p>
    <h2 id="requisitos">Aparelhos e idiomas compatíveis</h2>
    <p>Os guias do iOS 27 e macOS 27 exigem iPhone 12 ou posterior para transcrição, ou Mac com M1 ou posterior. Os idiomas do aparelho listados são inglês, espanhol, português, italiano, francês, alemão, japonês, coreano e chinês simplificado ou tradicional. No Mac, o inglês tem variantes específicas listadas pela Apple.</p>
    <p>Se o botão de transcrição não aparecer, confira aparelho e idioma. A transcrição de ligações tem requisitos próprios. Para resumir, a <a href="https://support.apple.com/pt-br/121115">Apple Intelligence</a> exige aparelho compatível, como iPhone 15 Pro, 15 Pro Max, modelos 16 ou posteriores compatíveis, iPhone Air ou Duo, ou Mac com M1 ou posterior ou MacBook Neo. Idioma do aparelho e da Siri precisam corresponder. Confira a lista atual de idiomas do resumo e o <a href="/blog/apple-notes-ai" hrefLang="en">guia de IA no Notas</a>.</p>
    <h2 id="texto">Use o texto da gravação</h2>
    <p>Abra a gravação e sua transcrição. No menu de opções, escolha <strong>Adicionar Transcrição à Nota</strong> ou <strong>Copiar Transcrição</strong>. Buscar na Transcrição encontra palavras dentro do áudio; selecionar um trecho reproduz aquela parte. Em aparelho compatível, abra Resumo para gerar uma síntese.</p>
    <p>Confira nomes e decisões no áudio antes de usar o texto. Apagar a gravação também apaga a transcrição.</p>
    <h2 id="ligacoes">Grave uma ligação</h2>
    <p>A gravação de ligações começa no app Telefone. Confira se a função está disponível na sua região e se a outra pessoa concorda. A Apple diz que não está disponível na União Europeia e em outros países.</p>
    <Steps><li>Durante a ligação, abra o menu de opções e escolha Gravação de Ligação. Os dois participantes ouvem um aviso.</li><li>Para terminar, use o botão de parar ou desligue. O áudio vai para a pasta Gravações de Ligações no Notas.</li><li>Abra a gravação para ver a transcrição, se disponível. Ela identifica os participantes.</li></Steps>
    <p>A transcrição pode demorar a aparecer. Para ver transcrições de ligações telefônicas e do FaceTime, a Apple exige iOS 18.1 ou posterior, além de idioma e região compatíveis. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph57c6590e9/ios">guia de ligações</a>. A transcrição pode conter erros.</p>
    <h2 id="pinto">Passe da transcrição para a ata</h2>
    <p>O <a href="/templates/meeting-notes">modelo de ata</a> do Pinto Notes coloca tarefas abertas no topo e reuniões abaixo, da mais recente para a mais antiga. Cole o texto que você conferiu no Notas. ChatGPT ou Claude, depois da <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão</a>, pode criar um resumo de duas linhas, decisões e tarefas com responsável e prazo. Se algo estiver confuso, peça que pergunte antes de escrever.</p>
    <Keep title="Pedido para a IA conectada" text={FOLLOW_UP} note="Adicione o modelo de ata antes de colar o pedido e a transcrição no ChatGPT ou Claude." />
    <p>Depois, pergunte "O que ainda está pendente para mim?" ou peça para marcar a revisão de design de Jonas como concluída. O Pinto guarda as versões anteriores da nota. No Mac, você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas</a> sem alterá-lo.</p>
    <p>Para montar a ata à mão, veja o <a href="/pt/blog/ata-de-reuniao-notas-iphone">modelo no Notas do iPhone</a>.</p>
  </LocalPostPage>;
}
