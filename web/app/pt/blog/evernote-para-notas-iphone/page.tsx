import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "evernote-para-notas-iphone");

// Versão pt-BR de /blog/evernote-to-apple-notes, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: evernote apple notes; evernote import apple notes; migrar evernote para notas do iphone não teve sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/102223, support.apple.com/pt-br/guide/notes/not201900c07/mac.
// Não foi preciso inventar rótulos para etapas sem nome localizado.
const ui = UI.pt;

const FAQ = [
  { q: "O Notas importa arquivos do Evernote?", a: ["Sim, no Mac. Use Arquivo, Importar para o app Notas com arquivos ENEX. No macOS 13 ou posterior, etiquetas também podem ser importadas."] },
  { q: "Como as notas chegam ao iPhone?", a: ["Importe os arquivos numa pasta do iCloud no Mac. Depois da sincronização, elas aparecem no iPhone com a mesma Conta Apple."] },
  { q: "Posso exportar pelo site do Evernote?", a: ["Não. O Evernote diz que a exportação precisa do app para Mac ou Windows."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="evernote-para-notas-iphone"
    intro={<> O Notas no Mac consegue importar arquivos exportados pelo Evernote. Faça um caderno de cada vez e confira o resultado antes de abandonar o app antigo. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#antes",label:"Antes"},{href:"#exportar",label:"Exportar"}]}>
      <p>Exporte cada caderno do Evernote como ENEX no computador. No Mac, importe o arquivo para uma pasta do iCloud no Notas. Confira etiquetas e anexos antes de sair do Evernote.</p>
      <PostCta slug="pt/evernote-para-notas-iphone" path="/pt/blog/evernote-para-notas-iphone" position="answer" ui={ui.cta} title="Traga suas notas para o Pinto Notes">
        <p>O Pinto Notes importa suas notas no Mac, funciona no iPhone e deixa ChatGPT ou Claude trabalhar nelas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="antes">O que você precisa</h2>
<p>Use o app do Evernote no Mac ou Windows para exportar. A versão web não exporta. Depois, use o Notas num Mac com notas atualizadas do iCloud ou na conta Em Meu Mac. Se quiser ver tudo no iPhone, escolha uma pasta do iCloud. Se exportou no Windows, leve os arquivos ENEX ao Mac.</p>
<h2 id="exportar">1. Exporte cada caderno no Evernote</h2>
<ol><li>No app para computador, selecione um caderno. Para algumas notas, selecione até 100.</li><li>Clique com o botão direito e escolha exportar em ENEX.</li><li>Mantenha as etiquetas e a data de criação entre os atributos exportados.</li><li>Salve o arquivo e repita para os demais cadernos.</li></ol>
<p>O Evernote permite definir tamanho máximo de cada arquivo ENEX, de 300 MB a 2 GB. A conta grátis também pode exportar.</p>
<h2 id="importar">2. Importe no Notas do Mac</h2>
<ol><li>Abra o Notas e selecione uma pasta no iCloud, ou em Em Meu Mac para manter as notas só nesse computador.</li><li>Escolha <strong>Arquivo &gt; Importar para o app Notas</strong>, selecione um ENEX e confirme em Importar duas vezes.</li><li>As notas aparecem em <strong>Notas Importadas</strong>. Renomeie a pasta com o nome do caderno antes de importar o próximo.</li></ol>
<p>Importar um caderno por vez facilita a conferência. A opção <strong>Preservar a estrutura da pasta ao importar</strong> se refere a pastas de arquivos, e a Apple não diz que vários ENEX escolhidos juntos viram pastas separadas.</p>
<h2 id="conferencia">O que chega</h2>
<p>Cada nota ENEX vira uma nota nova. No macOS 13 ou posterior, as etiquetas do Evernote também podem virar etiquetas do Notas. A Apple diz que anexos e recursos sem suporte ficam de fora, sem listar todos eles. Teste um caderno pequeno, compare notas com checklist, tabela e anexo, conte as notas e confira as etiquetas antes de encerrar a conta do Evernote. O original permanece no Evernote.</p>
<h2 id="escolha">Vale a mudança?</h2>
<PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785} alt="Assistente de IA do Evernote movendo uma nota entre cadernos no Mac." caption="O Evernote mantém assistente de IA dentro do app. Imagem: Evernote." />
<p>Evernote tem apps para Windows e Android, Web Clipper, busca com filtros, digitalização, transcrição e assistente de IA, além de conexão para ferramentas externas. O Free limita a 50 notas, um caderno e um aparelho. O Notas já vem no iPhone e Mac, sincroniza pelo iCloud e usa Apple Intelligence para transcrições e resumos, mas não tem app para Windows ou Android nem histórico de versões. Se você só usa Apple, o Notas pode bastar; se depende do Web Clipper ou do assistente, mantenha o Evernote.</p>
<h2 id="pinto">Outra rota: Pinto Notes</h2>
<PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu de importação do Pinto Notes no Mac, incluindo Evernote." caption="O Pinto Notes importa vários arquivos ENEX de uma vez." />
<p>No Mac, o Pinto Notes recebe todos os ENEX juntos. Cada caderno vira pasta; etiquetas, anexos e datas acompanham as notas. O Evernote não é alterado. Depois, ChatGPT ou Claude podem ler e editar as notas, com versões anteriores para restaurar. O app é só para iPhone e Mac. Se você já foi para o Notas, veja <a href="/blog/move-from-apple-notes" hrefLang="en">como importá-lo</a>.</p>


<p>Leia também: <a href="/blog/apple-notes-version-history" hrefLang="en">histórico no Notas</a>, <a href="/blog/best-notes-app-for-mac" hrefLang="en">apps de notas para Mac</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, e <a href="/blog/import-your-notes" hrefLang="en">importação de notas</a>.</p>
  </LocalPostPage>;
}
