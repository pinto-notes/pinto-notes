import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "buscar-e-substituir-notas-iphone");

// Versão pt-BR de /blog/apple-notes-find-and-replace, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "buscar e substituir notas iphone" não trouxe sugestões; o título usa a
// expressão comum "buscar e substituir". Apple pt-BR consultada em 21 nov:
// support.apple.com/pt-br/guide/notes/not18ab658ed/mac (Command + F na nota),
// support.apple.com/pt-br/guide/iphone/iphb8628c6b8/ios (Buscar na Nota),
// iph1a9cae52c/ios (selecionar texto), support.apple.com/pt-br/guide/notes/
// not9474646a9/mac (editar), support.apple.com/pt-br/guide/textedit/txtef6cfde1a/mac
// (Editar > Buscar > Buscar, Substituir, Tudo, Concluído). Os guias do Notas não dão nome
// aos controles de substituição; não inventamos um caminho. Sem imagem no original.

const ui = UI.pt;
const RENAME = `Na minha pasta Lançamento no Pinto Notes, encontre as notas com "Projeto Porto".
Leia cada nota e mostre os trechos que você mudaria para "Projeto Pátio".
Não altere citações de reuniões antigas nem endereços web. Não edite ainda.
Depois que eu aprovar os trechos, atualize as notas e liste o que mudou.`;
const FAQ = [
  { q: "O que a Apple documenta sobre buscar e substituir no Notas?", a: ["Os guias mostram Command + F dentro de uma nota no Mac e Buscar na Nota no iPhone. Não explicam os controles de substituição. Essa lacuna não prova que o Notas não tenha o recurso."] },
  { q: "Como busco dentro de uma nota no Mac?", a: ["Abra a nota, pressione Command + F e digite o termo. A busca dentro da nota é diferente da busca em todas as notas da conta."] },
  { q: "Onde fica Buscar na Nota no iPhone?", a: ["Abra a nota, toque no botão de ações e escolha Buscar na Nota. O botão de busca nessa tela mostra opções. Digite o termo."] },
  { q: "Uma IA conectada pode trocar uma frase em várias notas do Pinto?", a: ["Sim. ChatGPT ou Claude pode buscar e ler as notas correspondentes e depois editar cada uma. A ferramenta do Pinto troca texto exato em uma nota por chamada. Várias notas exigem várias edições."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="buscar-e-substituir-notas-iphone"
    intro={<>Para buscar texto dentro de uma nota no Mac, pressione Command + F. No iPhone, abra as ações da nota e toque em Buscar na Nota. Os guias da Apple não detalham os controles de substituição no Notas.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Buscar no Mac" }, { href: "#iphone", label: "Buscar no iPhone" },
      { href: "#substituir", label: "Substituição em lote" }, { href: "#limites", label: "Várias notas" },
      { href: "#pinto-notes", label: "Renomear com IA" },
    ]}><p>Use Command + F na nota do Mac ou Buscar na Nota no iPhone. Você pode corrigir o trecho encontrado à mão. Para uma substituição em lote com passos documentados pela Apple, trabalhe com uma cópia do texto no Editor de Texto do Mac.</p>
      <PostCta slug="pt/buscar-e-substituir-notas-iphone" path="/pt/blog/buscar-e-substituir-notas-iphone" position="answer" ui={ui.cta} title="Troque um termo em várias notas">
        <p>No Pinto Notes, ChatGPT ou Claude conectado pode encontrar uma frase e editar cada nota correspondente. As versões anteriores ficam guardadas.</p>
      </PostCta></Answer>} hero={<></>} faq={FAQ}>
    <h2 id="mac">Busque texto dentro de uma nota no Mac</h2>
    <Steps><li>Abra a nota que quer verificar.</li><li>Pressione Command + F para abrir a busca nessa nota.</li><li>Digite a palavra ou expressão.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Abra uma nota", "Busque dentro dela"], keys: "⌘F" }]} />
    <p>Esse caminho está no <a href="https://support.apple.com/pt-br/guide/notes/not18ab658ed/mac">guia de busca do Notas no Mac</a>. Buscar dentro de uma nota é diferente de procurar notas na conta. Use a expressão completa que quer alterar, para não encontrar trechos sem relação.</p>
    <p>O guia não informa controles nem atalho de substituição. Isso não prova que o recurso não exista. Para poucas correções, edite os trechos encontrados. Para trocar muitas ocorrências, use uma cópia do texto no Editor de Texto, como explicado abaixo.</p>
    <h2 id="iphone">Busque texto no iPhone</h2>
    <Steps><li>Abra a nota e toque no botão de ações.</li><li>Toque em Buscar na Nota.</li><li>Digite o termo. O botão de busca nessa tela abre opções de pesquisa.</li></Steps>
    <Paths rows={[{ on: "iPhone", steps: ["Abra as ações da nota", "Buscar na Nota"] }]} />
    <p>A Apple descreve esse caminho no <a href="https://support.apple.com/pt-br/guide/iphone/iphb8628c6b8/ios">guia de busca no iPhone</a>, sem dar uma sequência de botões para substituir.</p>
    <p>Para corrigir à mão, volte à edição. Toque duas vezes numa palavra, ajuste as alças de seleção para incluir a frase e digite o novo texto. Confira o contexto antes de mudar. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1a9cae52c/ios">guia de edição de texto</a>.</p>
    <h2 id="substituir">Substituição em lote documentada no Mac</h2>
    <p>Para um trecho longo de texto comum, faça a troca no Editor de Texto e cole o resultado na nota. Mantenha a nota original até conferir. Esse caminho não transfere anexos nem preserva uma diagramação complexa.</p>
    <Steps><li>Copie o trecho do Notas para um documento do Editor de Texto.</li><li>Escolha Editar, Buscar, Buscar e digite a expressão antiga.</li><li>Marque Substituir perto de OK e digite a nova expressão no campo de baixo.</li><li>Clique em Substituir para uma ocorrência ou Tudo para todas no documento.</li><li>Clique em Concluído, leia o resultado e copie o trecho de volta ao lugar certo na nota.</li></Steps>
    <Paths rows={[{ on: "Editor de Texto no Mac", steps: ["Editar", "Buscar", "Buscar", "Substituir"] }]} />
    <p>Os nomes vêm do <a href="https://support.apple.com/pt-br/guide/textedit/txtef6cfde1a/mac">guia do Editor de Texto da Apple</a>. Tudo é o botão desse app, não do Notas.</p>
    <h2 id="limites">Alterar várias notas</h2>
    <p>Encontrar todas as notas com um nome e mudar esse nome são tarefas distintas. Os guias do Notas consultados aqui não documentam um comando único para substituir em várias notas. Procure a expressão, abra cada nota relevante e confira o contexto.</p>
    <p>O nome novo pode caber num plano atual, mas uma citação antiga de reunião deve manter o texto original. Anote quais notas mudar. Se uma nota conhecida não aparecer na busca, siga as <a href="/pt/blog/busca-notas-iphone-nao-funciona">verificações da busca</a>.</p>
    <h2 id="pinto-notes">Renomeie em várias notas com IA conectada</h2>
    <p>O Pinto Notes se parece e funciona como o app Notas no iPhone e no Mac. Com <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT ou Claude conectado</a> (guia em inglês), a IA pode buscar notas, ler os resultados e substituir texto em cada uma. Peça primeiro uma proposta.</p>
    <Keep title="Pedido de troca para sua IA" text={RENAME} copyLabel={ui.copy} note="Troque pasta e expressões pelos seus dados. É um pedido sugerido, não uma regra automática." />
    <p>A ferramenta de edição do Pinto substitui texto exato em uma nota identificada. Ela pode trocar todas as ocorrências naquela nota e exige a leitura da versão atual antes da edição. Para várias notas, há busca, leitura e edição separadas.</p>
    <p>Depois de aprovar os trechos, peça as mudanças. Leia as notas resultantes e confira as exceções. Cada versão anterior fica guardada, como explica o <a href="/blog/apple-notes-version-history" hrefLang="en">guia de histórico</a> (em inglês).</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
