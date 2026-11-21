import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "segundo-cerebro-no-notas-iphone");

// Versão pt-BR de /blog/apple-notes-second-brain, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "segundo cérebro notas" sugeriu "segundo cerebro notas";
// "apple notes segundo cerebro" sugeriu "segundo cerebro apple notes"; "segundo cerebro notas iphone" não sugeriu termos.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd558a85438/mac (Arquivo > Nova Pasta),
// /guide/notes/not9474646a9/mac (nova nota, duplicação), /guide/notes/apdc88ed7f1d/mac (etiquetas),
// /guide/notes/apd58edc7964/mac (Arquivo > Nova Pasta Inteligente), /guide/notes/apdb54e469b6/mac
// (Arquivo > Fixar Nota), /guide/notes/apde615d29c2/mac (Editar > Adicionar Link),
// /guide/iphone/iph908d1558b/ios (links) e /102288 (Pastas Inteligentes no iPhone).
const ui = UI.pt;
const HOME = `Início

Esta semana
Escolher plantas para a varanda

Projetos atuais
Jardim da varanda

Referências úteis
Plantas para sombra
Cuidados com a rega

Revisão semanal
Ler as notas na Entrada
Guardar o que vale a pena
Escrever a próxima ação de cada projeto ativo
Mover projetos concluídos para Arquivo
`;
const FAQ = [
  { q: "Dá para usar o Notas como segundo cérebro?", a: ["Sim. Crie pastas para Entrada, Projetos, Referências e Arquivo. Fixe uma nota Início com links para o que importa nesta semana. Revise a Entrada para encontrar o que guardou."] },
  { q: "Existe um modelo para copiar?", a: ["Copie a nota Início desta página e troque os exemplos pelos seus projetos. Crie links reais com Editar > Adicionar Link no Mac ou digitando >> e o título da nota no iPhone ou Mac. O nome colado sozinho é só texto."] },
  { q: "Como reunir notas de um projeto em pastas diferentes?", a: ["Adicione a mesma etiqueta, como #jardim, às notas relacionadas. No Mac, crie uma Pasta Inteligente com a regra Etiquetas. As notas continuam nas pastas originais."] },
  { q: "Com que frequência revisar?", a: ["Teste uma revisão semanal. Guarde o que for útil, atualize a próxima ação de cada projeto e arquive o que acabou. Revise antes se a Entrada acumular notas para o trabalho de hoje."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="segundo-cerebro-no-notas-iphone"
    intro={<>O Notas pode guardar suas ideias e ajudar você a encontrá-las depois. Comece com uma pasta Entrada e uma nota Início fixada. Uma vez por semana, organize o que capturou.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#pastas", label: "Quatro pastas" }, { href: "#inicio", label: "Nota Início" }, { href: "#etiquetas", label: "Etiquetas" },
      { href: "#rotina", label: "Rotina" }, { href: "#pinto", label: "Links e IA" },
    ]}>
      <p>Crie Entrada, Projetos, Referências e Arquivo. Fixe uma nota Início com links para os projetos ativos. Use uma etiqueta e uma Pasta Inteligente quando um tema atravessar várias pastas. Revise a Entrada toda semana.</p>
      <PostCta slug="pt/segundo-cerebro-no-notas-iphone" path="/pt/blog/segundo-cerebro-no-notas-iphone" position="answer" ui={ui.cta} title="Deixe sua IA trabalhar com suas notas">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Linked From mostra quais notas apontam para a nota aberta. ChatGPT ou Claude podem ler e editar suas notas depois da conexão. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="pastas">Comece com quatro pastas</h2>
    <MenuPaths rows={[{ on: "Mac", steps: ["Arquivo", "Nova Pasta"] }]} />
    <p>No Mac, selecione uma pasta da conta iCloud na barra lateral e escolha Arquivo, Nova Pasta. Repita para as quatro pastas. Este sistema usa notas do iCloud porque alguns recursos do Notas não estão disponíveis em contas de outros provedores.</p>
    <ul>
      <li>Entrada recebe notas novas, antes de você decidir onde guardá-las.</li>
      <li>Projetos reúne trabalhos com um fim, como montar um jardim na varanda. Escreva o plano e a próxima ação numa nota.</li>
      <li>Referências guarda informações que você espera consultar de novo, como plantas para sombra.</li>
      <li>Arquivo recebe projetos concluídos que você talvez queira consultar depois.</li>
    </ul>
    <p>Comece pela próxima nota nova. Não precisa reorganizar toda a biblioteca antes. No Mac, arraste uma nota da lista para uma pasta na barra lateral. Crie subpastas só quando uma pasta ficar difícil de percorrer.</p>

    <h2 id="inicio">Copie e fixe uma nota Início</h2>
    <p>Guarde Início em Projetos. Cole o texto abaixo numa nota nova e substitua os exemplos pelos seus. Os nomes dos projetos ainda são texto simples; depois você criará os links.</p>
    <Keep title="Nota Início para o Notas" text={HOME} note="Cole como texto simples. Crie as notas dos projetos e das referências, depois transforme os nomes em links de verdade." />
    <MenuPaths rows={[{ on: "Mac", steps: ["Editar", "Adicionar Link"] }, { on: "Mac", steps: ["Arquivo", "Fixar Nota"] }]} />
    <p>Crie uma nota Jardim da varanda. Volte a Início, selecione esse nome, escolha Editar, Adicionar Link, digite o título e selecione a nota. Deixe “Usar Título da Nota” ativo para o nome do link acompanhar uma futura mudança de título. Faça o mesmo com as referências.</p>
    <p>No iPhone ou Mac, você também pode digitar <code>&gt;&gt;</code>, começar o título e escolher a nota. O <a href="https://support.apple.com/pt-br/guide/notes/apde615d29c2/mac">guia de links da Apple</a> explica os passos no Mac. Selecione Início na lista e escolha Arquivo, Fixar Nota para mantê-la no alto da pasta.</p>

    <h2 id="etiquetas">Use etiquetas para temas que atravessam pastas</h2>
    <p>Uma pasta mostra onde você guardou a nota. Uma etiqueta reúne notas de lugares diferentes. Adicione <code>#jardim</code> ao projeto Jardim da varanda e à referência Plantas para sombra. No iPhone, insira um espaço depois da etiqueta para ativá-la. Crie só etiquetas que você pretende reutilizar.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["Arquivo", "Nova Pasta Inteligente"] }]} />
    <p>No Mac, escolha Arquivo, Nova Pasta Inteligente. Dê o nome Jardim, escolha a regra Etiquetas, selecione #jardim e confirme. No iPhone, crie uma pasta na lista de pastas e use a opção de transformá-la em Pasta Inteligente; depois escolha o filtro da etiqueta. As notas aparecem juntas sem sair das pastas originais.</p>
    <p>O filtro não cria etiquetas por você. Se uma nota não aparecer, confira se ela tem a etiqueta e atende às regras da pasta.</p>

    <h2 id="rotina">Capture agora, organize na revisão</h2>
    <p>No Mac, selecione Entrada e clique no botão de nova nota. Escreva um título que você reconhecerá no mês seguinte, como Plantas para uma varanda sem sol. Guarde o detalhe útil e o link da fonte, se houver. Deixe a organização para a revisão, a menos que o destino já esteja claro.</p>
    <p>Uma vez por semana, abra Entrada. Mova referências úteis para Referências e trabalho ativo para Projetos. Anote a próxima ação de cada projeto e coloque em Início os links de que precisa nesta semana. Mova projetos terminados para Arquivo e tire seus links de Início.</p>
    <p>Se repetir sempre os mesmos cabeçalhos, guarde uma nota vazia como modelo. No Mac, o menu Arquivo permite duplicá-la. Prefira notas com decisões e próximas ações a uma pasta cheia de links ainda não lidos.</p>

    <h2 id="limites">O que exige manutenção</h2>
    <p>Um projeto novo não entra sozinho na nota Início. A Pasta Inteligente mostra apenas notas que cumprem suas regras. Você ainda decide o que guardar. O Notas também não lista os links recebidos por uma nota: um link do projeto para Plantas para sombra não faz o projeto aparecer na referência.</p>

    <h2 id="pinto">Links de volta e acesso por IA no Pinto Notes</h2>
    <p>No Pinto Notes, Linked From, no menu More da nota, lista as notas que apontam para ela. Assim você encontra os projetos que usam uma referência. Só links reais entram nessa lista. Veja <a href="/blog/apple-notes-backlinks" hrefLang="en">o guia de links de volta</a>.</p>
    <p>Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, a IA pode ler e editar suas notas. Na revisão semanal, peça um rascunho das próximas ações a partir das notas de um projeto. Confira e corrija o resultado. Você também pode ler e editar as notas escritas pela IA.</p>
    <p>Suas notas do Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a>. O conteúdo original não muda.</p>
  </LocalPostPage>;
}
