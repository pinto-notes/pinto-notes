import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-vs-evernote");

// Versão pt-BR de /blog/apple-notes-vs-evernote, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "evernote vs notas iphone" não teve sugestões; "apple notes vs evernote" trouxe "apple notes vs evernote 2026" e "apple notes vs evernote vs onenote". Usamos "Notas do iPhone" como nos posts locais.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/icloud/mm000b55f946/icloud, support.apple.com/pt-br/guide/notes/not201900c07/mac, support.apple.com/pt-br/102223.
// Não há caminho de menu do Evernote no post; suas funções seguem a fonte do post inglês.
const ui = UI.pt;

const FAQ = [
  { q: "Evernote ou Notas para iPhone e Windows?", a: ["O Evernote tem apps para os dois. O Notas abre as notas do iCloud no navegador do PC. Teste o iCloud.com antes de decidir; se precisa de um app para Windows todos os dias, escolha o Evernote."] },
  { q: "O Evernote grátis sincroniza celular e computador?", a: ["A página de planos do Evernote listava um aparelho para o plano grátis em 21 de novembro de 2026. Confira o limite do plano pago se usa os dois."] },
  { q: "O Evernote se conecta ao ChatGPT ou Claude?", a: ["Sim. A página de planos lista uma conexão MCP para Claude, ChatGPT e outras ferramentas compatíveis. O Evernote também tem um assistente de IA no app."] },
  { q: "Notas do iPhone e Apple Notes são o mesmo app?", a: ["Sim. Com o Notas ativado no iCloud, suas notas do iCloud também aparecem no Mac e no iCloud.com."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-vs-evernote"
    intro={<>O Notas é suficiente para textos, listas e checklists no iPhone e no Mac. O Evernote pode ser melhor se você usa Windows ou Android, salva páginas da web ou precisa de tarefas com prazo.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacao",label:"Comparação"},{href:"#notas",label:"Notas"},{href:"#evernote",label:"Evernote"},{href:"#migracao",label:"Migração"}]}>
      <p>O Notas tem checklists, tabelas e etiquetas nos aparelhos Apple. O Evernote tem Web Clipper, lembretes de tarefas e apps para Windows e Android. O plano grátis limita a biblioteca a 50 notas, um caderno e um aparelho.</p>
      <PostCta slug="pt/notas-iphone-vs-evernote" path="/pt/blog/notas-iphone-vs-evernote" position="answer" ui={ui.cta} title="Suas notas com ChatGPT ou Claude"><p>O Pinto Notes funciona no iPhone e no Mac, importa cadernos do Evernote como pastas com etiquetas e permite que ChatGPT ou Claude leia e edite suas notas. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="comparacao">Em resumo</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">O que importa</th><th scope="col">Notas</th><th scope="col">Evernote</th></tr></thead><tbody>
      <tr><th scope="row">Aparelhos</th><td>iPhone e Mac, mais iCloud.com no navegador</td><td>iPhone, Mac, Windows, Android e web</td></tr>
      <tr><th scope="row">Organização</th><td>Pastas, etiquetas e Pastas Inteligentes</td><td>Cadernos, etiquetas e buscas salvas</td></tr>
      <tr><th scope="row">Tarefas</th><td>Checklists com opção de mover itens marcados para baixo</td><td>Prazo, repetição e lembretes</td></tr>
      <tr><th scope="row">Pesquisa na web</th><td>Links e anotações escritos por você</td><td>Web Clipper salva artigos e PDFs</td></tr>
    </tbody></table></div>
    <p>Funções conferidas nas páginas dos apps em 21 de novembro de 2026. Veja os <a href="https://evernote.com/compare-plans">limites atuais do Evernote</a> antes de migrar. O plano grátis permite um aparelho.</p>
    <h2 id="notas">Quando o Notas é melhor</h2>
    <p>Uma lista de compras, uma ata e uma pasta de ideias cabem bem no Notas. Fixe a nota que abre todo dia, use checklist para tarefas e tabela para informações lado a lado. A busca encontra palavras nas notas.</p>
    <p>Digite # e uma palavra para criar uma etiqueta. Uma Pasta Inteligente reúne notas por critérios mesmo que estejam em pastas diferentes. Para editar com outra pessoa, todos precisam de Conta Apple.</p>
    <p>Ative o Notas no iCloud para manter as notas atualizadas no iPhone, no Mac e no <a href="https://support.apple.com/pt-br/guide/icloud/mm000b55f946/icloud">iCloud.com</a>. Se usa PC de vez em quando, teste uma nota real no navegador antes de trocar de app.</p>
    <h2 id="evernote">Quando o Evernote é melhor</h2>
    <p>O <a href="https://evernote.com/features/webclipper">Web Clipper</a> salva o conteúdo de artigos, páginas, PDFs e capturas de tela. Dá para anotar a captura e escolher o caderno e as etiquetas. Teste com as fontes que você costuma consultar.</p>
    <p>As <a href="https://evernote.com/features/tasks">tarefas ficam dentro das notas</a>. Podem ter prazo, repetição, lembrete e responsável. Você pode vê-las por nota ou data. Para bibliotecas grandes, a <a href="https://evernote.com/en-us/features/search">busca</a> filtra palavras, datas e o local em que a nota foi escrita, além de salvar consultas.</p>
    <h2 id="ia">O Evernote também tem IA</h2>
    <p>O <a href="https://evernote.com/en-us/features/ai-features">AI Assistant</a> encontra informações, cria conteúdo e organiza notas. A Busca Semântica encontra conteúdo relacionado. AI Meeting Notes grava, transcreve e resume conversas. O assistente tem limites mensais e por conversa.</p>
    <p>A página de planos também lista conexão com ChatGPT e Claude. Confira sua conta antes de migrar por causa disso; talvez a função já esteja disponível no seu plano.</p>
    <h2 id="onenote">E o OneNote?</h2>
    <p>O <a href="https://www.microsoft.com/en-us/microsoft-365/onenote/digital-note-taking-app">OneNote</a> tem cadernos digitais para trabalho compartilhado, escrita à mão e desenhos, além de apps para iPhone e Android. Veja a <a href="/pt/blog/notas-iphone-vs-onenote">comparação com o Notas</a>. Teste a mesma nota nos apps antes de escolher.</p>
    <h2 id="migracao">Antes de sair do Evernote</h2>
    <p>O Notas para Mac importa arquivos .enex. No macOS 13 ou posterior, também importa etiquetas. A Apple avisa que anexos ou funções incompatíveis ficam de fora. Veja o <a href="/pt/blog/evernote-para-notas-iphone">guia de migração</a>. Comece com um caderno e confira as notas importantes.</p>
    <h2 id="pinto">Onde entra o Pinto Notes</h2>
    <p>O Pinto Notes tem aparência parecida com a do Notas, guarda arquivos Markdown e mantém as versões anteriores. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, eles podem ler e editar suas notas.</p>
    <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu Arquivo do Pinto Notes no Mac, com Evernote entre as opções de importação." caption="No Mac, escolha Evernote no menu Arquivo para importar seus cadernos." />
    <p>Exporte cada caderno do Evernote como .enex e arraste todos de uma vez. Cada caderno vira uma pasta; as etiquetas também são importadas. Veja o <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>. O Evernote continua como estava.</p>
    <p>O Pinto funciona no iPhone e no Mac, mas não tem app para Windows ou Android nem versão web. Quem usa o Notas pode <a href="/blog/move-from-apple-notes" hrefLang="en">importá-lo no Mac</a> sem alterar as notas originais.</p>
  </LocalPostPage>;
}
