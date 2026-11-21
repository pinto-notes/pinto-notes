import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "widget-notas-iphone");

// Versão pt-BR de /blog/apple-notes-widget, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "widget notas iphone" apareceu como sugestão exata; "como colocar widget notas iphone" não trouxe essa forma.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/iphone/iphb8f1bf206/ios, iph92579feda/ios, iph4d0e6c351/ios; support.apple.com/pt-br/118610; support.apple.com/pt-br/guide/notes/apdc28344070/mac; support.apple.com/pt-br/guide/mac-help/mchl52be5da5/mac.
// Os guias não confirmam um widget do Notas abaixo do relógio na Tela Bloqueada; a página orienta a conferir a galeria, sem prometer essa opção.
const ui = UI.pt;

const FAQ = [
  { q: "Como adicionar o widget do Notas no iPhone?", a: ["Mantenha pressionado um espaço vazio na Tela de Início, toque em Editar e Adicionar Widget. Busque Notas, escolha tamanho, toque em Adicionar Widget e depois em OK."] },
  { q: "Posso pôr o Notas na Tela Bloqueada?", a: ["Confira as opções da galeria da Tela Bloqueada em Personalizar e Adicionar Widgets. Os guias consultados não confirmam um widget do Notas ali. Em Ajustes > Apps > Notas, Acessar Notas na Tela Bloqueada é uma função separada."] },
  { q: "Qual conta o widget usa para novas notas?", a: ["A opção Conta Padrão em Ajustes > Apps > Notas controla as notas criadas pelo widget e pela Siri."] },
  { q: "Posso usar vários widgets do Notas no Mac?", a: ["Sim. A Apple permite mais de um widget para abrir notas e pastas diferentes na mesa ou na Central de Notificações."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="widget-notas-iphone"
    intro={<>No iPhone, mantenha a Tela de Início pressionada, toque em Editar e Adicionar Widget. No Mac, clique na mesa com Control pressionado e escolha Editar Widgets.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#bloqueada",label:"Tela Bloqueada"},{href:"#mac",label:"Mac"},{href:"#problemas",label:"Problemas"}]}>
      <p>Adicione o Notas pela galeria de widgets da Tela de Início do iPhone. No Mac, há widgets de nota e pasta. A galeria da Tela Bloqueada é separada; confira o que ela oferece no seu aparelho.</p>
      <PostCta slug="pt/widget-notas-iphone" path="/pt/blog/widget-notas-iphone" position="answer" ui={ui.cta} title="Deixe a IA editar suas notas"><p>O Pinto Notes funciona no iPhone e no Mac. Depois da conexão, ChatGPT ou Claude pode ler e editar suas notas, com versões anteriores preservadas. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="iphone">Adicione o widget na Tela de Início</h2>
    <MenuPaths rows={[{on:"Tela de Início",steps:["Manter pressionado","Editar","Adicionar Widget","Notas"]}]} />
    <Steps><li>Abra a página da Tela de Início onde quer o widget.</li><li>Mantenha o fundo pressionado até os apps tremerem. Toque em Editar e Adicionar Widget.</li><li>Busque Notas e passe pelas opções de tamanho e estilo.</li><li>Toque em Adicionar Widget, posicione-o e toque em OK.</li></Steps>
    <p>Para mudar o conteúdo, mantenha o widget pressionado e toque em Editar Widget, se essa opção aparecer. Use as opções oferecidas para aquele tamanho. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iphb8f1bf206/ios">guia de widgets no iPhone</a>.</p>
    <h2 id="bloqueada">Notas e a Tela Bloqueada</h2>
    <p>A galeria da Tela Bloqueada tem opções próprias. Mantenha a Tela Bloqueada pressionada, toque em Personalizar e depois em Adicionar Widgets. Escolha entre os widgets disponíveis, toque ou arraste para posicionar e conclua. Se não houver espaço, remova um widget antes. O <a href="https://support.apple.com/pt-br/118610">guia da Apple</a> explica o processo, mas não confirma um widget do Notas nesse espaço.</p>
    <p>Há outra função em <strong>Ajustes &gt; Apps &gt; Notas &gt; Acessar Notas na Tela Bloqueada</strong>. Você pode escolher Sempre Criar Nova Nota, Retomar Última Nota ou desativar o acesso. Isso não adiciona um widget. Veja os <a href="https://support.apple.com/pt-br/guide/iphone/iph92579feda/ios">ajustes do Notas</a>.</p>
    <p>A Visualização Hoje abre ao deslizar para a direita a partir da Tela Bloqueada. Se não abrir com o iPhone bloqueado, confira Ajustes, Face ID e Código ou Touch ID e Código e ative Visualização Hoje e Busca em Permitir Acesso Quando Bloqueado.</p>
    <h2 id="mac">Adicione o widget no Mac</h2>
    <p>O Notas tem widget de nota e de pasta para a mesa ou a Central de Notificações. Você pode adicionar vários para conteúdos diferentes. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apdc28344070/mac">guia do Notas para Mac</a>.</p>
    <Steps><li>Clique na imagem de fundo da mesa com Control pressionado e escolha Editar Widgets.</li><li>Busque Notas na galeria e escolha um widget.</li><li>Clique para colocá-lo automaticamente ou arraste para a posição desejada.</li><li>Clique em Concluído.</li></Steps>
    <p>Para a Central de Notificações, clique na data e hora na barra de menus e depois em Editar Widgets. Clique no widget com Control pressionado para ver opções de tamanho e edição, se houver. Veja o <a href="https://support.apple.com/pt-br/guide/mac-help/mchl52be5da5/mac">guia de widgets do Mac</a>.</p>
    <h2 id="problemas">Se o widget não mostra o que você espera</h2>
    <ul><li>Conteúdo errado: no iPhone, mantenha o widget pressionado e toque em Editar Widget. No Mac, confira as opções de edição oferecidas.</li><li>Notas ausentes das sugestões: no iPhone, confira Ajustes &gt; Apps &gt; Notas &gt; Buscar.</li><li>Novas notas na conta errada: confira Conta Padrão nos ajustes do Notas.</li><li>Widgets ocultos na mesa do Mac: confira Ajustes do Sistema &gt; Mesa e Dock &gt; Widgets e a opção de mostrá-los na mesa.</li></ul>
    <p>Esses ajustes não prometem corrigir todo widget vazio. Se a nota também não aparecer na busca do app, veja <a href="/pt/blog/busca-notas-iphone-nao-funciona">as verificações da busca</a>. Para abrir notas rápido de outras maneiras, veja <a href="/pt/blog/dicas-app-notas-iphone">as dicas do Notas</a>.</p>
    <h2 id="pinto">Edite a nota com ChatGPT ou Claude</h2>
    <p>O widget ajuda a abrir a nota. No Pinto Notes, ChatGPT ou Claude pode ler e editar o conteúdo depois da <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão</a>. O app mantém as versões anteriores. No Mac, <a href="/blog/move-from-apple-notes" hrefLang="en">importa o Notas</a> sem alterar os originais.</p>
  </LocalPostPage>;
}
