import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "app-de-notas-para-escritores");

// Versão pt-BR de /blog/notes-app-for-writers, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "app de notas para escritores" e "notas para escritores"
// sugeriram "app de notas para escritores"; "aplicativo de notas para escrever" também apareceu.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not9474646a9/mac (salvamento automático,
// Arquivo > Duplicar Nota), /guide/notes/not201900c07/mac (Arquivo > Exportar Para > PDF ou Markdown)
// e /guide/notes/apde615d29c2/mac (Editar > Adicionar Link). As demais capacidades seguem as fontes do original.
const ui = UI.pt;
const FAQ = [
  { q: "Posso escrever um romance no Notas?", a: ["Sim. Use uma nota por cena e um índice com links. No Mac, Arquivo, Duplicar Nota cria um rascunho separado antes de reescrever. Se precisar de metas de palavras e montagem de capítulos, compare Ulysses e Scrivener."] },
  { q: "Quais apps mostram a contagem de palavras?", a: ["O Bear mostra a contagem no Info Panel. O Obsidian tem o plugin nativo Word count. Ulysses e Scrivener são apps de escrita com contagem e metas de palavras."] },
  { q: "Um app de notas basta para escrever artigos?", a: ["Pode bastar. Escreva e exporte um artigo completo antes de mudar toda a biblioteca. Veja como guardar rascunhos anteriores e se o arquivo exportado funciona no editor ou sistema em que você publica."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="app-de-notas-para-escritores"
    intro={<>O Notas serve para ideias e rascunhos curtos. Bear acrescenta estatísticas de escrita; Pinto Notes, histórico de versões e acesso por IA; Obsidian, pesquisa em arquivos ligados. Para um manuscrito inteiro, compare Ulysses e Scrivener.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Seis apps" }, { href: "#apple", label: "Escrever no Notas" },
      { href: "#pinto", label: "Pinto Notes" }, { href: "#escrita", label: "Ulysses e Scrivener" }, { href: "#teste", label: "Teste um rascunho" },
    ]}>
      <p>Notas é útil para guardar ideias e escrever no app que você já usa. Bear combina Markdown e contagem de palavras; Obsidian liga rascunhos a arquivos de pesquisa. Pinto Notes mantém o jeito do Notas com versões anteriores e acesso por IA. Ulysses e Scrivener têm ferramentas próprias para manuscritos.</p>
      <PostCta slug="pt/app-de-notas-para-escritores" path="/pt/blog/app-de-notas-para-escritores" position="answer" ui={ui.cta} title="Guarde seus rascunhos anteriores">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac, guarda versões anteriores e permite que ChatGPT ou Claude leiam e editem notas depois da conexão. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="comparar">Seis apps para tipos diferentes de escrita</h2>
    <div className="tableWrap"><table>
      <thead><tr><th scope="col">App</th><th scope="col">Bom para</th><th scope="col">Rascunhos e texto anterior</th><th scope="col">Como exportar</th></tr></thead>
      <tbody>
        <tr><th scope="row">Notas</th><td>Ideias e textos curtos</td><td>Duplicar uma nota antes de reescrever</td><td>Nota selecionada em PDF ou Markdown no Mac</td></tr>
        <tr><th scope="row">Pinto Notes</th><td>Jeito do Notas com acesso por IA</td><td>Histórico de versões com restauração</td><td>Biblioteca Markdown em ZIP; PDF no Mac</td></tr>
        <tr><th scope="row">Bear</th><td>Rascunhos Markdown com contagem de palavras</td><td>Backups manuais da biblioteca</td><td>Markdown; DOCX, PDF e ePub exigem Pro</td></tr>
        <tr><th scope="row">Obsidian</th><td>Pesquisa ligada aos rascunhos</td><td>Cópias locais de recuperação; Sync tem histórico próprio</td><td>As notas já são arquivos Markdown</td></tr>
        <tr><th scope="row">Ulysses</th><td>Escrita com metas</td><td>Backups locais automáticos da biblioteca</td><td>DOCX, PDF, ePub, HTML ou texto</td></tr>
        <tr><th scope="row">Scrivener</th><td>Capítulos e pesquisa no mesmo projeto</td><td>Snapshots antes de revisar</td><td>Compilação em Word, PDF ou ePub</td></tr>
      </tbody>
    </table></div>
    <p>São formas diferentes de guardar trabalho. Um backup da biblioteca, uma cópia de recuperação e uma duplicata feita antes de editar não substituem uns aos outros.</p>

    <h2 id="apple">Notas para começar a escrever</h2>
    <p>O Notas salva o texto enquanto você digita. Uma pasta por projeto e uma nota por cena ou artigo já dão uma organização inicial. Guarde a pesquisa em notas separadas para encontrar uma fonte sem percorrer o rascunho. Etiquetas e notas fixadas ajudam a manter o plano à vista.</p>
    <p>Para criar um índice no Mac, escreva os títulos das cenas numa nota. Selecione um título, escolha Editar, Adicionar Link e aponte para a nota correspondente. Antes de reescrever bastante, selecione o rascunho e escolha Arquivo, Duplicar Nota. Dê uma data e um nome claro à cópia. É uma forma manual de preservar o texto. O <a href="/blog/apple-notes-version-history" hrefLang="en">guia de histórico do Notas</a> explica os limites para recuperar versões anteriores.</p>
    <p>Para enviar um rascunho a outro editor no Mac, selecione a nota e escolha Arquivo, Exportar Para, PDF ou Markdown. O <a href="/blog/export-apple-notes-to-markdown" hrefLang="en">guia de exportação Markdown</a> mostra o que conferir no arquivo. Se precisa de meta de palavras ou exportação de livro, compare os apps de escrita abaixo.</p>

    <h2 id="pinto">Pinto Notes para rascunhos anteriores e IA</h2>
    <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Guarda notas em Markdown e mantém um histórico de versões. No Mac, abra File, Version History, selecione uma versão anterior e escolha Restore This Version para recuperar o texto. O texto substituído também fica guardado como outra versão. Os nomes dos comandos aparecem em inglês no app.</p>
    <Figure shot={SHOTS.history} caption="Histórico de versões de uma lista de compras no Pinto Notes para Mac. A tela mostra texto anterior e o botão Restore This Version." />
    <p>Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, a IA pode ler e editar suas notas. Você pode pedir que ela leia as notas de pesquisa antes de sugerir um plano, depois conferir o resultado. Guarde as fontes para verificar citações e fatos.</p>
    <p>No Mac, File, Export All Notes salva um ZIP com arquivos Markdown organizados em pastas. Desbloqueie antes as notas protegidas com senha, Face ID ou Touch ID para incluí-las. File, Export as PDF salva a nota aberta em PDF. Essas opções servem para continuar o rascunho em outro lugar. Ulysses e Scrivener exportam diretamente para Word ou ebook.</p>
    <p>O Pinto Notes funciona só em iPhone e Mac, sem app para Windows, Android ou web. Suas notas do Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a>, sem mudar o original.</p>

    <h2 id="bear">Bear para Markdown com contagem de palavras</h2>
    <p>O Bear combina Markdown e etiquetas. O Info Panel mostra o número de palavras e o tempo estimado de leitura. No Mac, Edit, Typewriter Mode mantém a linha atual no centro do editor. Você também pode ocultar a barra lateral e a lista de notas para dar mais espaço ao texto. Veja o <a href="https://blog.bear.app/2023/07/get-started-with-bear/">guia inicial</a> e as <a href="https://bear.app/faq/typewriter-mode/">instruções do modo de máquina de escrever</a>.</p>
    <p>A versão grátis exporta Markdown. DOCX, PDF e ePub exigem Pro. O Bear também documenta backup manual da biblioteca. Restaurar um deles substitui a biblioteca atual, algo diferente de recuperar um parágrafo. Confira os <a href="https://bear.app/faq/export-your-notes/">formatos de exportação</a> e o <a href="https://bear.app/faq/backup-restore/">guia de backup</a> antes de migrar.</p>

    <h2 id="obsidian">Obsidian para pesquisa em arquivos ligados</h2>
    <p>O Obsidian guarda notas como arquivos Markdown numa pasta comum. Você pode ligar uma fonte ao rascunho e abrir os arquivos em outro editor. O plugin nativo Word count mostra palavras e caracteres da nota aberta. Serve para quem quer cuidar também dos arquivos de pesquisa. O Obsidian documenta o <a href="https://obsidian.md/help/data-storage">armazenamento</a> e o <a href="https://obsidian.md/help/plugins/word-count">contador</a>.</p>
    <p>File recovery guarda cópias locais por sete dias por padrão. Elas ficam no aparelho que as criou e não são um backup completo, segundo o Obsidian. O Obsidian Sync tem um histórico separado. Leia os <a href="https://obsidian.md/help/plugins/file-recovery">limites da recuperação</a> e mantenha outro backup do trabalho.</p>

    <h2 id="escrita">Ulysses e Scrivener para textos longos</h2>
    <h3>Ulysses para rascunhos e metas de escrita</h3>
    <p>O Ulysses é um app de escrita. Seu editor com poucos elementos e a organização em projetos servem a artigos ou manuscritos divididos em partes. Você pode definir metas de palavras por folha, grupo ou projeto, inclusive metas diárias. Exporta DOCX, PDF, ePub, HTML e texto. Veja as <a href="https://help.ulysses.app/goals">metas</a> e o <a href="https://help.ulysses.app/export">guia de exportação</a>.</p>
    <p>Os backups automáticos preservam a biblioteca localmente. Não sincronizam entre aparelhos e não incluem External Folders. Isso importa se você guarda rascunhos fora da biblioteca. O <a href="https://help.ulysses.app/en_US/backups">guia de backup</a> explica como restaurar o trabalho.</p>
    <h3>Scrivener para montar um manuscrito</h3>
    <p>O Scrivener também é um app de escrita. Você escreve em seções, muda a ordem e mantém a pesquisa ao lado do rascunho. O modo de composição esconde o resto da interface. As metas de palavras podem valer para o manuscrito, uma seção ou uma sessão. Antes de reescrever, faça um Snapshot para comparar ou recuperar o texto.</p>
    <p>Compile reúne as seções num documento Word, PDF ou ePub. Isso ajuda quando as cenas separadas precisam virar um manuscrito. Experimente compilar uma amostra antes de levar o projeto inteiro. A <a href="https://www.literatureandlatte.com/scrivener/overview">visão geral do fabricante</a> descreve essas ferramentas.</p>

    <h2 id="teste">Teste um rascunho completo antes de mudar</h2>
    <p>Use um texto curto em andamento. Escreva por vinte minutos com o editor como prefere, revise um parágrafo e recupere a versão anterior. Exporte o texto e abra-o no lugar em que vai entregar ou publicar. Escolha o app em que essas etapas dão menos trabalho para o que você escreve.</p>
  </LocalPostPage>;
}
