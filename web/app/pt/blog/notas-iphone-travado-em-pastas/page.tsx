import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-travado-em-pastas");

// Versão pt-BR de /blog/apple-notes-stuck-on-folders, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "app notas travado" sugeriu a mesma expressão;
// "notas iphone travando" sugeriu "notas iphone travando" e "bloco de notas iphone travando".
// "notas iphone travado em pastas" e "app notas preso em pastas" não deram sugestões; o título nomeia a tela afetada.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/121669, /118446, apple.com/br/support/systemstatus,
// support.apple.com/pt-br/guide/icloud/mm8685520792/icloud, /118575, /108382 e /121115. Os guias não dão
// uma causa específica para a tela Pastas nem um prazo de sincronização. A imagem é um aviso do iCloud.
const ui = UI.pt;
const FAQ = [
  { q: "O que conferir se o Notas não sai da tela Pastas?", a: ["Se as notas do iCloud não aparecem, confira o Status do sistema da Apple, a Conta Apple e a sincronização do Notas. A Apple orienta reiniciar o iPhone e conferir o controle outra vez. Se a tela não responde ao toque, siga os passos gerais para um app travado."] },
  { q: "“Preparando” na Apple Intelligence significa que as notas estão sincronizando?", a: ["Uma mensagem nos ajustes da Apple Intelligence diz respeito à configuração desse recurso. A Apple informa que, após mudar o idioma da Siri, a Apple Intelligence pode ficar indisponível até o idioma terminar de baixar e corresponder ao idioma do aparelho. Isso não confirma o envio de uma nota ao iCloud."] },
  { q: "A Apple informa quanto tempo o Notas leva para sincronizar?", a: ["As páginas de suporte citadas não dão um prazo. Um envio lento por si só não identifica a causa. Confira falhas no iCloud, a conexão, a mesma Conta Apple e a sincronização do Notas em cada aparelho."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-travado-em-pastas"
    intro={<>Se o Notas fica na tela Pastas e nenhuma nota carrega, confira o iCloud e a sincronização. Se a tela não responde a toques, siga os passos gerais para um app travado.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#pastas", label: "Tela Pastas" }, { href: "#icloud", label: "Conferir o iCloud" },
      { href: "#salvando", label: "Travado ao salvar" }, { href: "#preparando", label: "Mensagem Preparando" },
    ]}>
      <p>Confira o Status do sistema da Apple. Depois confirme que os aparelhos usam a mesma Conta Apple e que o Notas está ativado no iCloud. Verifique a conexão e as atualizações. Essas são verificações gerais da Apple, não uma correção específica para a tela Pastas.</p>
      <PostCta slug="pt/notas-iphone-travado-em-pastas" path="/pt/blog/notas-iphone-travado-em-pastas" position="answer" ui={ui.cta} title="Teste suas notas no Pinto Notes">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas no Mac</a>, sem alterar o original. Isso não corrige o app Notas. O Pinto Notes está em inglês.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Aviso para ativar o iCloud no Notas do Mac, com botões para abrir os Ajustes do Sistema ou cancelar." caption="Este aviso aparece quando o iCloud está desativado para o Notas. É diferente de uma tela Pastas que não responde." />}
    faq={FAQ}
  >
    <h2 id="pastas">Quando a tela Pastas não abre uma pasta</h2>
    <p>Tente selecionar Todas no iCloud ou uma pasta dentro de iCloud. É onde o <a href="https://support.apple.com/pt-br/guide/icloud/mm8685520792/icloud">guia da Apple</a> orienta procurar as notas sincronizadas. Se as pastas abrem, mas as notas não aparecem, siga as verificações abaixo.</p>
    <p>Se o Notas não responde a nenhum toque, veja <a href="/pt/blog/app-notas-iphone-nao-funciona">como fechar, reabrir, reiniciar e atualizar</a>. A tela congelada não mostra se as alterações recentes foram enviadas.</p>

    <h2 id="icloud">Confira o iCloud antes de mudar outros ajustes</h2>
    <Steps>
      <li id="status"><strong>Confira o Status do sistema.</strong> Abra a <a href="https://www.apple.com/br/support/systemstatus/">página da Apple</a> e procure Notas do iCloud. Se houver falha, acompanhe o estado do serviço antes de mudar seus ajustes.</li>
      <li id="conta"><strong>Confira a Conta Apple.</strong> Veja se todos os aparelhos usam a mesma conta. No iPhone e no Mac, ela aparece no alto dos ajustes.</li>
      <li id="sincronizacao"><strong>Confira a sincronização do Notas.</strong> Se estiver desligada, ative a sincronização no iPhone ou Mac. A Apple orienta reiniciar o iPhone se as notas ainda não aparecerem e conferir o ajuste de novo.
        <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "seu nome", "iCloud", "Ver tudo ou Mostrar tudo", "Notas", "sincronização deste iPhone"] }, { on: "Mac, macOS 15 ou posterior", steps: ["Ajustes do Sistema", "seu nome", "iCloud", "Notas", "sincronização deste Mac"] }]} />
      </li>
      <li id="rede"><strong>Confira a conexão.</strong> A Apple pede uma conexão estável. Sem Wi-Fi no iPhone, confira se os Dados Celulares estão ativados nos Ajustes. Com eles desligados, o iCloud pode ficar indisponível pela rede móvel.</li>
      <li id="atualizacoes"><strong>Procure atualizações.</strong> A Apple inclui iOS e macOS atualizados nos passos para problemas do iCloud. Faça backup antes de instalar.
        <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "Geral", "Atualização de Software"] }, { on: "Mac", steps: ["menu Apple", "Ajustes do Sistema", "Geral", "Atualização de Software"] }]} />
      </li>
    </Steps>
    <p>Esses passos vêm dos guias da Apple sobre <a href="https://support.apple.com/pt-br/118446">conexão com o iCloud</a>, <a href="https://support.apple.com/pt-br/121669">notas que não aparecem</a> e <a href="https://support.apple.com/pt-br/guide/icloud/mm8685520792/icloud">configuração do Notas</a>. Os caminhos para atualizar estão nos guias do <a href="https://support.apple.com/pt-br/118575">iPhone</a> e do <a href="https://support.apple.com/pt-br/108382">Mac</a>.</p>

    <h2 id="salvando">Se o Notas demora para salvar ou sincronizar</h2>
    <p>Abra <a href="https://www.icloud.com/notes">Notas no iCloud.com</a> com a mesma Conta Apple. Procure a nota e sua alteração mais recente. Se aparecer uma versão antiga, isso confirma apenas que o conteúdo antigo chegou ao iCloud. Guarde uma cópia separada de qualquer texto novo que ainda consiga ler.</p>
    <p>Os guias da Apple citados aqui não dão um prazo de sincronização nem uma correção específica para uma mensagem de salvamento. Para verificar armazenamento e notas que só aparecem num aparelho, veja <a href="/pt/blog/notas-iphone-nao-sincroniza">o guia de sincronização</a>.</p>

    <h2 id="preparando">Veja onde aparece “Preparando”</h2>
    <p>Se a mensagem estiver nos ajustes da Apple Intelligence, consulte o <a href="https://support.apple.com/pt-br/121115">guia de configuração da Apple</a>. Ele diz que, após mudar o idioma da Siri, o recurso pode ficar indisponível até o novo idioma terminar de baixar e corresponder ao idioma do aparelho. Isso não indica se uma nota foi enviada ao iCloud.</p>
    <p>Se “Preparando” aparece dentro do Notas ao lidar com uma digitalização ou PDF, esse guia não identifica a causa. Anote a mensagem exata e o que estava fazendo. Se as verificações não ajudarem, leve essas informações ao <a href="https://getsupport.apple.com/">Suporte da Apple</a>.</p>
  </LocalPostPage>;
}
