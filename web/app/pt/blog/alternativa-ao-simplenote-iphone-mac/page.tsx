import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-simplenote-iphone-mac");

// Versão pt-BR de /blog/simplenote-alternative-for-iphone-and-mac, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "alternativa ao simplenote" e "simplenote alternativas" não trouxeram sugestões. Título descritivo, sem inferir demanda.
// Este artigo não usa nomes de menus da Apple. A captura mostra o menu do Pinto; os menus do Simplenote seguem as fontes inglesas e são descritos sem inventar nomes em pt-BR.
const ui = UI.pt;
const CHECK = `Conferência da mudança do Simplenote

- Guarde o ZIP original.
- Abra os arquivos de texto exportados e confira uma nota longa.
- Importe uma pasta pequena no Pinto Notes para Mac.
- Compare o texto inteiro e a formatação Markdown.
- Veja se precisa reorganizar as etiquetas antigas.
- Abra as notas importadas no iPhone.
- Mantenha o Simplenote até terminar a conferência.`;
const FAQ = [
  { q: "Há uma alternativa grátis ao Simplenote para iPhone e Mac?", a: ["O Pinto Notes é grátis nesses aparelhos. Parece com o Notas, importa pastas de texto ou Markdown no Mac e permite que ChatGPT ou Claude conectados leiam e editem suas notas."] },
  { q: "Por que não consigo exportar no Simplenote da Mac App Store?", a: ["Segundo a ajuda do Simplenote, essa versão não exporta notas. Use a exportação no app web ou na versão Electron para computador."] },
  { q: "Etiquetas e versões antigas são transferidas?", a: ["Esta mudança usa arquivos de texto. Ela não promete recriar etiquetas ou histórico do Simplenote. Guarde o ZIP e confira a importação. O Pinto guarda as versões criadas nele."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-simplenote-iphone-mac"
    intro={<>O Pinto Notes é uma alternativa ao Simplenote para iPhone e Mac se você quer um app parecido com o Notas e acesso para IA conectada. Exporte do Simplenote e importe os arquivos de texto no Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#escolher",label:"Decidir"},{href:"#exportar",label:"Exportar"},{href:"#importar",label:"Importar"},{href:"#conferir",label:"Conferir"}]}>
      <p>Escolha o Pinto Notes se usa iPhone e Mac e quer que ChatGPT ou Claude leiam e editem notas após a conexão. O Simplenote também funciona em Windows, Linux, Android e na web. A mudança por arquivos de texto não leva o histórico antigo.</p>
      <PostCta slug="pt/alternativa-ao-simplenote-iphone-mac" path="/pt/blog/alternativa-ao-simplenote-iphone-mac" position="answer" ui={ui.cta} title="Leve suas notas de texto para o Pinto Notes"><p>Importe os arquivos no Mac. Depois, conecte ChatGPT ou Claude para trabalhar com eles. O app está em inglês.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu Arquivo do Pinto Notes no Mac com a opção de importar Markdown ou texto." caption="Escolha a importação de Markdown ou texto para os arquivos exportados. Imagem: Pinto Notes para Mac." />}
    faq={FAQ}
  >
    <h2 id="escolher">O que você quer mudar no Simplenote?</h2>
    <p>O Simplenote tem etiquetas, busca, Markdown, notas compartilhadas, publicação na web e versões anteriores. São recursos úteis para um caderno de texto. Veja a <a href="https://simplenote.com/">visão geral do Simplenote</a>.</p>
    <p>O Pinto serve para quem prefere um app parecido com o Notas e quer permitir que uma IA trabalhe nas notas. Você continua escrevendo por conta própria e pode conectar a IA para uma tarefa específica.</p>
    <p>O Pinto Notes só funciona no iPhone e no Mac. Não tem app para Windows, Android ou web. O Simplenote atende mais aparelhos e permite editar offline depois de entrar na conta e baixar as notas.</p>
    <h2 id="exportar">Exporte pelo navegador</h2>
    <ol><li>Entre no <a href="https://app.simplenote.com/">app web do Simplenote</a>.</li><li>Abra o menu no canto superior esquerdo e acesse as configurações.</li><li>Na área de ferramentas, exporte as notas e salve o ZIP.</li></ol>
    <p>A versão Electron para computador também exporta pelo menu Arquivo. Segundo as <a href="https://simplenote.com/help/#export">instruções oficiais</a>, a versão da Mac App Store não oferece exportação. Se não achar a opção no Mac, use o navegador.</p>
    <p>A <a href="https://github.com/Automattic/simplenote-electron/blob/trunk/lib/utils/export/README.md">documentação da exportação</a> descreve um ZIP com um arquivo por nota. O código gera arquivos de texto e uma cópia JSON. Guarde o ZIP intacto e descompacte uma cópia para examinar os textos.</p>
    <h2 id="importar">Importe os arquivos de texto no Pinto</h2>
    <p>No menu Arquivo do Pinto Notes para Mac, escolha a importação de Markdown ou texto. Ele aceita uma pasta ou um ZIP desses arquivos; cada pasta vira uma pasta. Veja o <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>. O Simplenote original não muda.</p>
    <p>Para testar, copie alguns arquivos exportados para uma pasta separada. Inclua uma nota longa e outra com Markdown, se usa esse formato. Compare com os originais antes de importar o restante. O importador de texto não trata o backup JSON como notas.</p>
    <p>É uma importação de arquivos, sem conectar a conta do Simplenote. O código de exportação acrescenta nomes de etiquetas ao texto, mas isso não garante que virem etiquetas do Pinto. Confira se depende delas para encontrar notas. As versões antigas também não acompanham os arquivos.</p>
    <h2 id="conferir">Confira antes de deixar o Simplenote</h2>
    <Keep title="Lista para conferir a mudança" text={CHECK} note="Guarde a lista com a exportação e marque o que verificou." />
    <p>Abra uma nota importada no iPhone e no Mac. Compare o texto inteiro, inclusive o fim de listas longas e blocos de código. Confira links. Um título legível não garante que o restante veio como esperado.</p>
    <h2 id="pinto">Use as notas com IA</h2>
    <p>Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, peça para ler uma nota de projeto, listar perguntas pendentes e acrescentar uma decisão. Diga o título exato e confira a alteração.</p>
    <p>O Pinto guarda todas as versões anteriores feitas nele, mas a importação não traz as versões do Simplenote. Veja o <a href="/blog/apple-notes-version-history" hrefLang="en">guia de histórico</a>.</p>
  </LocalPostPage>;
}
