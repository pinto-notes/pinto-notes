import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-vs-onenote");

// Versão pt-BR de /blog/apple-notes-vs-onenote, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: onenote ou notas iphone não teve sugestões; apple notes vs onenote, onenote vs apple notes.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/102223, support.apple.com/pt-br/102537, support.apple.com/pt-br/108047, support.apple.com/pt-br/guide/iphone/iphd939f0a1c/ios.
// Termos de menus usados apenas quando constam das páginas localizadas; os demais passos são descritos.
const ui = UI.pt;

const FAQ = [
  { q: "O OneNote é grátis no Mac e iPhone?", a: ["Sim, mas algumas funções do Mac exigem Microsoft 365. Uma conta Microsoft sincroniza as notas pelo OneDrive."] },
  { q: "Posso importar um bloco inteiro do OneNote no Notas?", a: ["Não há importação direta. O OneNote no Mac salva uma página por vez em PDF; para poucas páginas, copie e cole."] },
  { q: "Posso bloquear uma única página no OneNote?", a: ["Não. O OneNote no Mac protege seções inteiras com senha. O Notas protege cada nota separadamente."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-vs-onenote"
    intro={<> O Notas é direto para listas e registros. O OneNote permite escrever e desenhar em qualquer ponto da página. Compare os dois antes de mudar sua biblioteca. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacao",label:"Comparacao"},{href:"#notas",label:"Notas"}]}>
      <p>O Notas é simples no iPhone e Mac. O OneNote atende quem usa Microsoft 365, Windows ou Android e quer páginas livres para escrever e desenhar.</p>
      <PostCta slug="pt/notas-iphone-vs-onenote" path="/pt/blog/notas-iphone-vs-onenote" position="answer" ui={ui.cta} title="Notas com ChatGPT ou Claude">
        <p>O Pinto Notes funciona no iPhone e no Mac, importa suas notas no Mac e permite que ChatGPT ou Claude trabalhem nelas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="comparacao">Em resumo</h2>
<p>O Notas é mais simples para notas e listas no iPhone e no Mac. O OneNote é um fichário digital com blocos, seções e páginas em que você pode escrever e desenhar em qualquer ponto. Ele também funciona no Windows, Android e navegador.</p>
<h2 id="notas">Quando o Notas é melhor</h2>
<PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Lista de compras no Notas para Mac." caption="O app Notas é direto para listas e registros do dia a dia." />
<p>O app já vem nos aparelhos Apple e sincroniza pelo iCloud. Pastas, etiquetas, Pastas Inteligentes, busca em texto manuscrito e digitalizações, Resultados de Cálculos e gravações com transcrição ajudam a organizar sem montar um fichário. No iPhone, você pode desenhar com o dedo e selecionar a escrita para convertê-la em texto quando o idioma é compatível. Uma nota pode ser bloqueada com senha, Face ID ou Touch ID.</p>
<p>Não há caixas de texto livres em qualquer ponto da página nem histórico de versões. As notas apagadas ficam em Apagadas por 30 dias. Cada pessoa precisa de Conta Apple para compartilhar. Notas com etiqueta, PDF, áudio, vídeo, em pasta compartilhada ou em conta de e-mail não podem ser bloqueadas.</p>
<h2 id="onenote">Quando o OneNote é melhor</h2>
<p>O OneNote é grátis nas versões compatíveis para Mac, Windows, iPhone, Android e web. No Mac, você pode escrever, marcar e desenhar em qualquer lugar da página. É preciso ter conta Microsoft; as notas sincronizam pelo OneDrive e uma cópia fica no Mac para uso offline. A conta grátis oferece 5 GB compartilhados com outros produtos Microsoft; os planos Microsoft 365 Personal e Family incluem pelo menos 1 TB.</p>
<p>O OneNote guarda versões anteriores de páginas e mantém notas apagadas por 60 dias. Pode extrair texto de imagens, embora alguns resultados demorem de 24 a 48 horas. Compartilha o bloco por link com permissão para editar ou visualizar. O Copilot resume, cria tarefas e redige texto em planos Microsoft 365 elegíveis; confirme o plano antes de contar com ele no Mac.</p>
<p>No Mac, o OneNote não converte escrita à mão em texto. O bloqueio por senha vale para uma seção inteira, não para uma página ou bloco inteiro; a seção bloqueada fica fora da busca. A Microsoft não recupera uma senha esquecida. A exportação em PDF é página por página.</p>
<h2 id="mudanca">Migração entre os dois</h2>
<p>Nenhum dos apps importa diretamente o outro. O Notas no Mac aceita TXT, RTF, HTML, Markdown e ENEX em <strong>Arquivo &gt; Importar para o app Notas</strong>. O OneNote no Mac salva cada página como PDF. Para poucas páginas, copie e cole o texto; para centenas, considere manter os blocos antigos para consulta.</p>
<h2 id="alternativa">O Pinto Notes</h2>
<PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Alteração de uma nota pelo ChatGPT no Pinto Notes, com botão Desfazer." caption="O Pinto Notes mostra o que a IA alterou." />
<p>O Pinto Notes funciona no iPhone e no Mac como o Notas, mas guarda versões anteriores, arquivos Markdown criptografados e dá acesso ao ChatGPT, Claude, Claude Code e Codex. Importa Notas, Obsidian, Evernote, Google Keep, Bear e pastas de texto no Mac. Não importa OneNote diretamente: copie as páginas. Também não tem escrita à mão, Windows, Android ou web. Para páginas livres em que você desenha, o OneNote continua mais adequado. <a href="/pt/blog/alternativas-ao-notas-iphone">Compare outras opções</a>.</p>

<p>Leia também: <a href="/blog/apple-notes-version-history" hrefLang="en">histórico no Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, <a href="/blog/import-your-notes" hrefLang="en">importação de notas</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
