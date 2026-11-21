import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "bloco-de-codigo-notas-iphone");

// Versão pt-BR de /blog/apple-notes-code-block, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "bloco de codigo notas iphone", "codigo no app notas iphone" e "notas iphone codigo" não deram sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd46c25187e/mac (Estilo Fixo, Corpo,
// Citação em Bloco e atalhos); /guide/notes/apd1955d3b21/mac (estilos e destaque); /guide/iphone/iph1ac0b3a2/ios
// (botão de formatação). O guia do iPhone não nomeia Estilo Fixo; descrevemos como procurar o estilo sem afirmar o rótulo.
const ui = UI.pt;
const SNIPPET = `{
  "timeoutSeconds": 30,
  "retryCount": 2
}`;
const FAQ = [
  { q: "O Notas tem bloco de código?", a: ["O recurso mais próximo é Estilo Fixo, com fonte monoespaçada e fundo próprio. Nos guias consultados, a Apple não descreve um comando Bloco de Código nem destaque automático da sintaxe."] },
  { q: "Qual é o atalho no Mac?", a: ["Selecione o trecho e pressione Shift + Command + M para aplicar Estilo Fixo. Command + apóstrofo aplica Citação em Bloco; Shift + Command + B aplica Corpo. Os atalhos podem variar com o idioma do teclado."] },
  { q: "Por que alguns tutoriais dizem Monoespaçado?", a: ["O guia de recursos do iOS 17 informa que a Apple atualizou o antigo estilo monoespaçado. No guia atual do Mac em português, o nome é Estilo Fixo."] },
  { q: "Citação em Bloco colore código?", a: ["Não há destaque de sintaxe documentado para esse estilo. Ele serve para destacar uma citação; use Estilo Fixo para um trecho de código."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="bloco-de-codigo-notas-iphone"
    intro={<>Para guardar um trecho de código no Notas, use Estilo Fixo. Os guias da Apple descrevem esse estilo e Citação em Bloco, mas não um comando de bloco de código com destaque de sintaxe.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Atalho no Mac" }, { href: "#iphone", label: "No iPhone" },
      { href: "#citacao", label: "Citação em Bloco" }, { href: "#limites", label: "Limites" }, { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>No Mac, selecione o código e pressione Shift + Command + M para aplicar Estilo Fixo. No iPhone, selecione o trecho e abra as opções de formatação. O estilo separa o código do restante da nota, mas a Apple não documenta cores por linguagem.</p>
      <PostCta slug="pt/bloco-de-codigo-notas-iphone" path="/pt/blog/bloco-de-codigo-notas-iphone" position="answer" ui={ui.cta} title="Use um bloco de código no Pinto Notes">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Seu menu / tem Code Block e Callout. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="mac">Formate um trecho no Mac</h2>
    <p>Estilo Fixo usa fonte monoespaçada, recuo e fundo diferente. Funciona para uma configuração curta ou um comando que você quer explicar na nota.</p>
    <Steps>
      <li><strong>Cole o trecho numa nota.</strong> Deixe a explicação acima ou abaixo para selecionar só o código.</li>
      <li><strong>Selecione o código.</strong> Abra o botão de formatação e procure Estilo Fixo, ou pressione Shift + Command + M.</li>
      <li><strong>Formate a explicação como Corpo.</strong> Selecione o texto normal e pressione Shift + Command + B.</li>
    </Steps>
    <MenuPaths rows={[{ on: "Mac, código", steps: ["botão de formatação", "Estilo Fixo"], keys: "⇧⌘M" }, { on: "Mac, texto", steps: ["botão de formatação", "Corpo"], keys: "⇧⌘B" }]} />
    <p>Os atalhos estão no <a href="https://support.apple.com/pt-br/guide/notes/apd46c25187e/mac">guia da Apple para o Mac</a>. Eles podem variar com o idioma e o layout do teclado. Para usar estilos de parágrafo, a nota precisa estar no iCloud ou armazenada no Mac.</p>
    <Keep title="Trecho para testar" text={SNIPPET} code note="Cole no Notas, selecione e aplique Estilo Fixo. A aparência do código nesta página não é a aparência do app Notas." />

    <h2 id="iphone">Formate o código no iPhone</h2>
    <p>Selecione o trecho numa nota e toque no botão de formatação. Percorra as opções até encontrar o estilo de texto monoespaçado. O <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia da Apple para o iPhone</a> descreve o botão e a barra de estilos, mas não dá o nome desse estilo na página consultada.</p>
    <p>Se um tutorial antigo disser “Monoespaçado”, procure o estilo equivalente no seu aparelho. O <a href="https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf">guia de recursos do iOS 17</a> registra a mudança do nome em inglês para Monostyled.</p>

    <h2 id="citacao">Citação em Bloco serve para citar texto</h2>
    <p>Esse estilo separa uma passagem com uma barra de citação. Use para um trecho retirado da documentação, deixando sua explicação fora da citação. Para código, prefira Estilo Fixo.</p>
    <MenuPaths rows={[{ on: "Mac", steps: ["selecionar texto", "botão de formatação", "Citação em Bloco"], keys: "⌘'" }]} />
    <p>O <a href="https://support.apple.com/pt-br/guide/notes/apd1955d3b21/mac">guia de formatação do Mac</a> inclui citações nos estilos. O guia do iPhone mostra onde abrir os estilos, sem nomear Citação em Bloco na página consultada.</p>

    <h2 id="limites">O que o estilo não faz</h2>
    <p>Os guias de formatação e atalhos da Apple não documentam um comando Bloco de Código nem destaque de sintaxe que reconheça a linguagem. Estilo Fixo ajuda a guardar trechos curtos junto das explicações.</p>
    <p>O Notas também permite destacar texto manualmente com uma cor. Isso é diferente de colorir palavras e símbolos de código automaticamente. Mantenha a versão executável no projeto e use a nota para registrar o motivo do trecho.</p>

    <h2 id="pinto">Bloco de Código no Pinto Notes</h2>
    <p>No Pinto Notes, digite <code>/</code> no começo de uma linha e escolha Code Block para um trecho ou Callout para um aviso. Os dois comandos estão no iPhone e no Mac. O app está em inglês.</p>
    <p>Claude Code e Codex podem ler e editar suas notas depois da conexão. Veja <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">como conectar os agentes</a>. Você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar suas notas no Mac</a>; o conteúdo no app Notas não muda.</p>
  </LocalPostPage>;
}
