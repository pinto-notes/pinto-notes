import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure, Capture } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "bloquear-pasta-notas-iphone");

// Versão pt-BR de /blog/apple-notes-lock-folder, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: como bloquear uma pasta no notas do iphone.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/102537, support.apple.com/pt-br/guide/iphone/iphf177bb154/ios, support.apple.com/pt-br/guide/notes/not28c5f5468/mac, support.apple.com/pt-br/guide/notes/apd58edc7964/mac, support.apple.com/pt-br/guide/iphone/iph00f208d05/ios.
// Ações sem nome confirmado foram descritas sem nome de menu.
const ui = UI.pt;

const FAQ = [
  { q: "Posso colocar senha numa pasta do Notas?", a: ["Não. Bloqueie cada nota separadamente. Pastas Inteligentes também não podem ser bloqueadas."] },
  { q: "Por que uma nota não pode ser bloqueada?", a: ["Etiquetas, certos anexos, compartilhamento ou uma conta de e-mail podem impedir o bloqueio."] },
  { q: "O título da nota bloqueada fica visível?", a: ["Sim. A lista e a busca podem mostrar o título. Evite pôr informação privada na primeira linha."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="bloquear-pasta-notas-iphone"
    intro={<> O Notas não tem bloqueio para uma pasta inteira. Você pode proteger as notas uma por uma e, no iPhone, bloquear a abertura do app. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#pasta",label:"Pasta"},{href:"#senha",label:"Senha"}]}>
      <p>Não há bloqueio de pasta. Configure uma senha para a conta e bloqueie cada nota com senha, Face ID ou Touch ID. Novas notas na pasta começam desbloqueadas.</p>
      <PostCta slug="pt/bloquear-pasta-notas-iphone" path="/pt/blog/bloquear-pasta-notas-iphone" position="answer" ui={ui.cta} title="Notas no Pinto Notes">
        <p>O Pinto Notes funciona no iPhone e no Mac, com suas notas criptografadas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<Capture src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760} phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }} alt="Uma nota bloqueada dentro de uma pasta no Notas do Mac. O título continua visível." caption="O bloqueio protege a nota, não a pasta nem o título." />
<h2 id="pasta">O que pode ser bloqueado</h2>
<p>A Apple descreve bloqueio de notas individuais, não de pastas. Pastas Inteligentes também não podem ser bloqueadas. Para proteger uma pasta comum, bloqueie cada nota nela. O nome da pasta e o título de cada nota continuam visíveis. Notas novas entram desbloqueadas até você protegê-las.</p>
<h2 id="senha">Escolha a senha</h2>
<p>No iPhone, abra <strong>Ajustes &gt; Apps &gt; Notas &gt; Senha</strong>, escolha a conta e use o código do aparelho ou crie uma senha exclusiva. Você pode ativar Face ID ou Touch ID. No Mac, abra Notas, Ajustes e escolha a senha de início de sessão ou uma senha personalizada para notas bloqueadas. Se tiver Touch ID, também pode ativá-lo. A opção de usar o código do aparelho exige Chaves do iCloud e versões compatíveis do sistema. A Apple não recupera a senha personalizada esquecida nem desbloqueia notas antigas com uma senha redefinida.</p>
<h2 id="notas">Bloqueie cada nota</h2>
<ol><li>No iPhone, abra a nota, toque no botão Mais e em <strong>Bloquear</strong>. Repita nas demais notas da pasta.</li><li>No Mac, selecione a nota, abra o botão ao lado da busca e escolha <strong>Bloquear Nota</strong>. Digite a senha ou use Touch ID.</li></ol>
<PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300} alt="Nota bloqueada no iPhone, com ícone de cadeado e botão para visualizar." caption="O título continua na lista, mas o conteúdo fica bloqueado. Imagem: Apple." />
<h2 id="abrir">Abra e feche</h2>
<p>No iPhone, toque na nota e em <strong>Ver Nota</strong>, depois use senha, Face ID ou Touch ID. As notas bloqueadas da conta ficam abertas por alguns minutos; feche pelo cadeado ou ao sair do app. No Mac, desbloqueie uma nota e use o botão de cadeado para fechar todas. O app também as fecha depois de um período sem uso ou quando você o encerra.</p>
<h2 id="problemas">Se o botão de bloqueio não aparece</h2>
<p>A Apple não permite bloquear notas com etiquetas, PDF, áudio, vídeo, certos documentos, notas compartilhadas ou guardadas em Gmail e Yahoo. Notas Rápidas e algumas notas com recursos novos também podem ficar de fora. Use uma pasta comum, retire a etiqueta ou o anexo, pare de compartilhar ou <a href="/pt/blog/passar-notas-iphone-para-icloud">mova a nota para o iCloud</a>. Uma Conta Apple Gerenciada não permite esse bloqueio.</p>
<h2 id="app">Bloqueie o app inteiro no iPhone</h2>
<p>Na Tela de Início, toque e segure Notas e escolha a opção de exigir Face ID, Touch ID ou código, conforme o aparelho. Confirme. Isso protege a abertura do app e retira seu conteúdo das prévias de busca e notificações nesse iPhone. Não sincroniza com o Mac. O app Notas pode ser bloqueado, mas não ocultado.</p>
<h2 id="pinto">Notas bloqueadas no Pinto Notes</h2>
<Figure shot={SHOTS.notesPassword} caption="Definição da senha das notas bloqueadas no Pinto Notes para Mac." />
<p>O Pinto Notes também protege uma nota de cada vez com senha, Face ID ou Touch ID. A senha cria uma segunda chave de criptografia que fica nos seus aparelhos; se você a esquecer, a nota não pode ser recuperada. ChatGPT e Claude podem trabalhar nas outras notas, mas uma nota bloqueada fica fora do alcance deles. A importação do Notas no Mac não lê notas bloqueadas: desbloqueie as que quiser trazer e bloqueie de novo depois. Veja <a href="/pt/blog/esqueci-senha-notas-iphone">o que fazer com uma senha esquecida</a>.</p>


<p>Leia também: <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas e Pastas Inteligentes</a>, <a href="/blog/encrypted-notes-app-for-ai" hrefLang="en">criptografia e IA</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
