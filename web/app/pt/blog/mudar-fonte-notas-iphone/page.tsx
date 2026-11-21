import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "mudar-fonte-notas-iphone");

// Versão pt-BR de /blog/apple-notes-font, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "mudar fonte notas iphone" e "mudar cor da fonte notas iphone"; "como mudar a fonte do iphone" também apareceu.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac, apd8b73d28be/mac, apd97da26aed/mac; support.apple.com/pt-br/guide/iphone/iph3c076905a/ios, iph1f48544ab/ios, iph1ac0b3a2/ios; support.apple.com/pt-br/guide/mac-help/mchlp2544/mac.
// O guia do iPhone não descreve um seletor de família de fontes como o do Mac. A página não inventa esse ajuste.
const ui = UI.pt;

const FAQ = [
  { q: "Como aumentar a letra do Notas no iPhone?", a: ["Abra Ajustes > Acessibilidade > Tela e Tamanho do Texto > Texto Maior e mova o controle. Tamanhos Maiores amplia as opções. Para ajustar só o Notas, use Ajustes por App."] },
  { q: "Posso escolher outra fonte no Notas do Mac?", a: ["Sim. Selecione o texto, clique com Control pressionado e escolha Fonte > Mostrar Fontes. A mudança vale para o texto selecionado. Tamanho de texto padrão controla a visualização geral."] },
  { q: "Como mudar a cor da fonte?", a: ["No Mac, selecione o texto e abra Fonte > Mostrar Fontes. Na janela Fontes, use Cor do Texto. O guia do iPhone documenta destaque, mas não esse seletor de cor."] },
  { q: "Por que uma nota nova começa com letra grande?", a: ["No Mac, confira Notas > Ajustes > Novas notas começam com. Esse ajuste escolhe o estilo do primeiro parágrafo; Tamanho de texto padrão é separado."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="mudar-fonte-notas-iphone"
    intro={<>No Mac, selecione o texto e abra Fonte &gt; Mostrar Fontes para trocar a fonte. No iPhone, use os estilos da nota ou aumente o texto nos ajustes de acessibilidade.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#fonte-mac",label:"Fonte no Mac"},{href:"#tamanho-mac",label:"Tamanho no Mac"},{href:"#iphone",label:"iPhone"},{href:"#cor",label:"Cor"}]}>
      <p>O Notas para Mac permite trocar a fonte do texto selecionado. Para aumentar todas as notas, use Tamanho de texto padrão no Mac ou Texto Maior nos ajustes do iPhone. Dentro da nota, use os estilos de cabeçalho, negrito e itálico.</p>
      <PostCta slug="pt/mudar-fonte-notas-iphone" path="/pt/blog/mudar-fonte-notas-iphone" position="answer" ui={ui.cta} title="Deixe a IA trabalhar nas suas notas"><p>O Pinto Notes funciona no iPhone e no Mac. Depois da conexão, ChatGPT ou Claude pode ler e editar suas notas, e cada versão anterior fica guardada. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="fonte-mac">Troque a fonte de um trecho no Mac</h2>
    <MenuPaths rows={[{on:"Texto selecionado",steps:["Clique com Control pressionado","Fonte","Mostrar Fontes"]}]} />
    <Steps><li>Abra a nota e selecione o texto que quer alterar.</li><li>Clique na seleção com Control pressionado e escolha Fonte &gt; Mostrar Fontes.</li><li>Escolha a família e o tamanho na janela Fontes.</li></Steps>
    <p>A mudança vale para a seleção. A Apple explica o caminho no <a href="https://support.apple.com/pt-br/guide/notes/apd1955d3b21/mac">guia de formatação do Notas</a>. Para um cabeçalho ou negrito, use o botão de formatação da nota.</p>
    <h2 id="tamanho-mac">Aumente todas as notas no Mac</h2>
    <MenuPaths rows={[{on:"Todas as notas",steps:["Notas","Ajustes","Tamanho de texto padrão"]},{on:"Uma nota",steps:["Visualizar","Ampliar"]}]} />
    <p>Abra Notas &gt; Ajustes e mova o controle Tamanho de texto padrão. Ele muda o tamanho de exibição de todas as notas. Para ver uma nota maior ou menor, use Visualizar &gt; Ampliar ou Visualizar &gt; Reduzir. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd8b73d28be/mac">guia de visualização</a>.</p>
    <p>Em Notas &gt; Ajustes, Novas notas começam com escolhe o estilo do primeiro parágrafo da nota. É um ajuste diferente do tamanho de texto padrão. Veja os <a href="https://support.apple.com/pt-br/guide/notes/apd97da26aed/mac">ajustes do Notas</a>.</p>
    <h2 id="iphone">Aumente o texto no iPhone</h2>
    <MenuPaths rows={[{on:"Texto maior",steps:["Ajustes","Acessibilidade","Tela e Tamanho do Texto","Texto Maior"]},{on:"Só o Notas",steps:["Ajustes","Acessibilidade","Ajustes por App","Adicionar App","Notas"]}]} />
    <Steps><li>Abra Ajustes &gt; Acessibilidade &gt; Tela e Tamanho do Texto.</li><li>Toque em Texto Maior e mova o controle.</li><li>Se precisar, ative Tamanhos Maiores.</li></Steps>
    <p>Isso define o tamanho preferido em apps compatíveis, inclusive o Notas. Texto em Negrito é outra opção no mesmo lugar. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph3c076905a/ios">guia de leitura da Apple</a>.</p>
    <p>Para ajustar o Notas separadamente, abra Ajustes &gt; Acessibilidade &gt; Ajustes por App. Toque em Adicionar App, escolha Notas e abra seus ajustes. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1f48544ab/ios">guia de ajustes por app</a>.</p>
    <h2 id="estilos">Use cabeçalhos no iPhone</h2>
    <p>Na nota, toque no botão de formatação para escolher Cabeçalho, negrito ou itálico. Para uma seção, selecione o texto e escolha Cabeçalho ou Subtítulo. A Apple explica isso no <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia de formatação no iPhone</a>. Veja também os <a href="/blog/apple-notes-templates" hrefLang="en">modelos de notas</a>.</p>
    <h2 id="cor">Mude a cor ou destaque texto</h2>
    <p>No Mac, selecione o texto e abra Fonte &gt; Mostrar Fontes. Na janela Fontes, clique em Cor do Texto e escolha uma cor. Veja o <a href="https://support.apple.com/pt-br/guide/mac-help/mchlp2544/mac">guia de fontes do Mac</a>.</p>
    <p>Para destacar no Mac, selecione o texto e use o botão de destaque na formatação da nota. O círculo colorido escolhe a cor. No iPhone, o guia lista destaque entre as opções de formatação, mas não oferece o mesmo caminho para mudar a cor da fonte.</p>
    <h2 id="limites">O que depende do aparelho</h2>
    <p>O guia do iPhone cobre estilos e tamanho de exibição, sem documentar um seletor de fonte como o do Mac. No Mac, alguns estilos de parágrafo exigem notas do iCloud ou guardadas no próprio Mac.</p>
    <h2 id="pinto">Se você também usa IA nas notas</h2>
    <p>O Pinto Notes guarda notas em Markdown e todas as versões anteriores. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, eles podem ler e editar o texto. No Mac, você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas</a> sem alterar as notas originais.</p>
  </LocalPostPage>;
}
