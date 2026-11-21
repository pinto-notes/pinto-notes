import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativas-ao-onenote-para-mac");

// Versão pt-BR de /blog/onenote-alternative-for-mac, 21 nov 2026.
// Google autocomplete hl=pt, gl=br, lido em 21 nov: "alternativa ao onenote mac" sem sugestões; "alternativas ao onenote" trouxe a própria expressão e "alternativas onenote linux".
// Este artigo não usa nomes de menus da Apple. Os comandos do OneNote são descritos sem inventar nomes de menu em pt-BR; fonte: páginas da Microsoft citadas.
const ui = UI.pt;
const CHECK = `Conferência da mudança do OneNote
Mantenha acesso ao caderno original.
Escolha cinco páginas digitadas usadas nesta semana.
Copie cada uma para uma nota ou arquivo de texto separado.
Confira a ordem de leitura e as tabelas.
Compare links, imagens e anexos com os originais.
Guarde desenhos e layouts no original ou em PDF.
Teste as novas notas no Mac e no iPhone antes de mover mais.`;
const FAQ = [
  { q: "O Pinto abre arquivos .one ou .onepkg?", a: ["Não. Não há importação direta do OneNote. O Pinto aceita pastas ou ZIPs de Markdown e texto, mas o download de um caderno do OneNote não tem esse formato. Copie as páginas digitadas ou prepare arquivos de texto."] },
  { q: "O que posso salvar do OneNote no Mac?", a: ["A Microsoft documenta salvar a página atual em PDF. A exportação de um caderno inteiro pela web só funciona para contas pessoais do OneDrive, não para contas de trabalho ou escola nem SharePoint. Nenhuma das duas opções cria notas editáveis no Pinto."] },
  { q: "Um PDF do OneNote vira nota editável?", a: ["Não. O importador de Markdown e texto não converte PDFs em notas editáveis. Guarde o PDF como referência. Para editar o texto no Pinto, copie as palavras ou prepare um arquivo Markdown ou de texto."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativas-ao-onenote-para-mac"
    intro={<>O Pinto Notes é uma alternativa ao OneNote no Mac para notas pessoais digitadas, com aparência do Notas e acesso para IA conectada. Não importa cadernos do OneNote diretamente. Comece com notas novas ou copie algumas páginas.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#escolher",label:"Escolher páginas"},{href:"#guardar",label:"Guardar originais"},{href:"#mover",label:"Mover texto"},{href:"#pinto",label:"Usar com IA"}]}>
      <p>Escolha o Pinto Notes para notas digitadas no Mac e no iPhone, que ChatGPT ou Claude podem ler e editar após a conexão. Mantenha no OneNote os cadernos que dependem de layout livre, desenhos ou páginas compartilhadas. O Pinto não importa os arquivos nativos do OneNote.</p>
      <PostCta slug="pt/alternativas-ao-onenote-para-mac" path="/pt/blog/alternativas-ao-onenote-para-mac" position="answer" ui={ui.cta} title="Teste sua próxima nota no Pinto Notes"><p>O download para Mac é grátis. Você pode conectar ChatGPT ou Claude para trabalhar nas notas. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="escolher">Escolha as páginas que ainda usa</h2>
    <p>Comece por um projeto atual ou algumas páginas pessoais de consulta. Deixe o arquivo no OneNote durante o teste. Copiar o texto de uma página com desenhos não preserva a posição dos elementos.</p>
    <p>O OneNote organiza cadernos em seções e páginas. No Mac, permite desenhar livremente com mouse ou trackpad e compartilhar cadernos. A Microsoft documenta a <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac">estrutura</a>, as <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">ferramentas de desenho</a> e o <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">compartilhamento</a>.</p>
    <p>O OneNote também funciona em Windows, Android e navegador, segundo o <a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions">guia de versões</a>. O Pinto só funciona no iPhone e no Mac. Veja <a href="/pt/blog/notas-iphone-vs-onenote">Notas vs. OneNote</a> se também está considerando o app da Apple.</p>
    <h2 id="guardar">Guarde os originais antes de mover o texto</h2>
    <p>No OneNote para Mac, abra uma página e salve uma cópia em PDF pelo menu Arquivo. O <a href="https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">guia da Microsoft</a> descreve uma cópia da página naquele momento. Alterações futuras não atualizam o PDF. Abra o arquivo e confira antes de usá-lo como referência.</p>
    <p>Para um caderno inteiro, a Microsoft descreve a exportação no OneNote para web: clique com o botão direito no caderno, escolha exportá-lo e confirme. O <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks">guia</a> limita essa opção a contas pessoais do OneDrive. Não funciona com OneDrive de trabalho ou escola nem SharePoint. Guarde o download como backup, não como arquivo para importar no Pinto.</p>
    <h2 id="mover">O que pode ser importado</h2>
    <p>O Pinto não abre <code>.one</code> nem <code>.onepkg</code>. Seu importador de Markdown e texto também não transforma PDFs em notas editáveis. Colocar um arquivo do OneNote em um ZIP não muda seu formato.</p>
    <p>Para poucas páginas, copie o texto digitado para notas novas, uma por página. Comece por uma página curta e compare. Confira a ordem dos blocos, tabelas e links. Traga imagens e anexos separadamente se precisar deles.</p>
    <p>Para mais páginas, prepare uma pasta de arquivos Markdown ou texto, um por nota. É um trabalho manual, não uma opção de exportação do OneNote descrita pela Microsoft. No Mac, use a importação de Markdown ou texto no menu Arquivo do Pinto. O <a href="/blog/import-your-notes" hrefLang="en">guia</a> explica que cada pasta vira uma pasta.</p>
    <Keep title="Confira algumas páginas antes de mover mais" text={CHECK} note="Esta lista é para uma mudança manual, não para uma conversão automática do caderno." />
    <p>Mantenha páginas com escrita à mão, digitalizações ou disposição livre no caderno original ou em PDFs conferidos. Esse processo move texto digitado; não recria esses elementos como conteúdo editável.</p>
    <h2 id="pinto">Use suas notas com ChatGPT ou Claude</h2>
    <p>O Pinto Notes se parece com o Notas no iPhone e no Mac. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, a aprovação permite ler e editar as notas. Todas as versões anteriores são guardadas.</p>
    <p>Faça um pedido específico sobre as páginas copiadas: “Leia minhas notas sobre a reforma da cozinha e acrescente uma checklist das decisões pendentes.” Confira o resultado. Conectar a IA não importa o restante do OneNote.</p>
    <p>Escreva as próximas notas pessoais no Pinto e veja se ele atende seu dia a dia. Você pode deixar cadernos compartilhados no OneNote e trazer mais páginas depois de conferir as primeiras.</p>
  </LocalPostPage>;
}
