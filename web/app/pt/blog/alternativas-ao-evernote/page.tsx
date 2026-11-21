import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativas-ao-evernote");

// Versão pt-BR de /blog/evernote-alternative, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "alternativa ao evernote" trouxe "alternativa gratuita ao
// evernote", "melhor alternativa ao evernote" e "alternativa evernote open source"; "alternativa
// evernote mac" não deu sugestões. O plural do título ajuda a apresentar as seis opções.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/102223 (ENEX, conteúdo incompatível omitido,
// Notas Importadas) e /guide/notes/not201900c07/mac (Arquivo > Importar para o app Notas, etiquetas no macOS 13+).
// Dados de migração dos demais apps vêm dos guias oficiais citados no original; não são testes de importação.
const ui = UI.pt;
const FAQ = [
  { q: "Quais alternativas grátis importam cadernos do Evernote?", a: ["Notas, Pinto Notes, Obsidian e Joplin aceitam arquivos .enex. O serviço Obsidian Sync é pago à parte. No Joplin, você escolhe como sincronizar. O Evernote informa que contas grátis também podem exportar."] },
  { q: "Posso importar um backup ENEX no Notion?", a: ["O importador oficial do Notion se conecta à sua conta Evernote. O guia não documenta o envio de um arquivo .enex. Se você só tem o backup, Notas, Pinto Notes, Obsidian, Bear e Joplin documentam importação de arquivo."] },
  { q: "Dá para sair do Evernote usando só um iPhone?", a: ["Segundo o Evernote, a exportação só funciona no app de computador para Mac ou Windows. O Bear aceita importar um .enex no iPhone, mas você ainda precisa obter esse arquivo. A importação do Notion por conta funciona no computador ou navegador, não no app móvel."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativas-ao-evernote"
    intro={<>O Notas é uma alternativa simples ao Evernote para notas pessoais no Mac e no iPhone. Considere Pinto Notes para acesso por IA, Obsidian para arquivos Markdown, Notion para equipes, Bear para escrita ou Joplin para um app de código aberto.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Seis opções" }, { href: "#exportar", label: "Exportar do Evernote" },
      { href: "#apple", label: "Caminhos de importação" }, { href: "#conferir", label: "Conferir o resultado" },
    ]}>
      <p>Notas, Pinto Notes, Obsidian e Joplin são opções grátis que aceitam exportações .enex. O Bear também aceita, mas a sincronização pelo iCloud exige Pro. O Notion serve para trabalho em equipe; seu importador oficial acessa a conta Evernote, em vez de ler o arquivo .enex.</p>
      <PostCta slug="pt/alternativas-ao-evernote" path="/pt/blog/alternativas-ao-evernote" position="answer" ui={ui.cta} title="Traga seus cadernos do Evernote">
        <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. Importe seus cadernos no Mac e conecte ChatGPT ou Claude para ler e editar as notas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menu File do Pinto Notes no Mac, com Import from Evernote e outras opções de importação." caption="No Mac, o Pinto Notes oferece importação do Evernote no menu File. Imagem: Pinto Notes." />}
    faq={FAQ}
  >
    <h2 id="comparar">Qual alternativa ao Evernote serve para você?</h2>
    <div className="tableWrap"><table>
      <thead><tr><th scope="col">App</th><th scope="col">Bom para</th><th scope="col">Importação do Evernote</th><th scope="col">Confira antes</th></tr></thead>
      <tbody>
        <tr><th scope="row">Notas</th><td>Notas pessoais em aparelhos Apple</td><td>.enex no Mac</td><td>Anexos ou recursos incompatíveis são omitidos</td></tr>
        <tr><th scope="row">Pinto Notes</th><td>Jeito do Notas com acesso por ChatGPT ou Claude</td><td>.enex no Mac; cadernos viram pastas</td><td>Só iPhone e Mac</td></tr>
        <tr><th scope="row">Obsidian</th><td>Arquivos Markdown locais e pesquisa com links</td><td>.enex pelo plugin oficial Importer</td><td>Sincronização é uma decisão à parte</td></tr>
        <tr><th scope="row">Notion</th><td>Páginas e bancos de dados de equipes</td><td>Conexão com a conta Evernote no computador ou navegador</td><td>Envio de .enex não documentado</td></tr>
        <tr><th scope="row">Bear</th><td>Escrita Markdown organizada por etiquetas</td><td>.enex no Mac ou iPhone</td><td>Sincronização pelo iCloud exige Pro</td></tr>
        <tr><th scope="row">Joplin</th><td>Cadernos de código aberto e recorte de páginas</td><td>.enex no app de computador</td><td>Escolha o serviço de sincronização e o formato de importação</td></tr>
      </tbody>
    </table></div>
    <p>Os caminhos de importação abaixo seguem os guias dos fabricantes, consultados em 21 de novembro de 2026.</p>

    <h2 id="exportar">Comece exportando o Evernote</h2>
    <p>No app Evernote para Mac ou Windows, selecione um caderno, escolha Exportar e depois ENEX. Mantenha marcadas as etiquetas e os outros atributos necessários. Exporte cada caderno separadamente e guarde os arquivos como backup. Segundo o Evernote, contas grátis podem exportar, mas o Evernote Web não oferece essa função. Veja o <a href="https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML">guia de exportação</a>.</p>

    <h2 id="apple">Notas para uso diário em aparelhos Apple</h2>
    <p>O Notas serve para notas pessoais, checklists e informações guardadas. Pastas e etiquetas ajudam a organizar; a busca encontra o conteúdo. O iCloud leva as notas aos aparelhos com a mesma Conta Apple.</p>
    <p>No Mac, selecione uma pasta do iCloud ou de Em Meu Mac. Escolha Arquivo, Importar para o app Notas e selecione os arquivos .enex. Use o iCloud se quiser as notas no iPhone. Segundo o <a href="https://support.apple.com/pt-br/guide/notes/not201900c07/mac">guia da Apple</a>, etiquetas são importadas no macOS 13 ou posterior. Anexos e recursos incompatíveis não entram. O <a href="/pt/blog/evernote-para-notas-iphone">guia de migração para o Notas</a> detalha os passos e as verificações com base nas <a href="https://support.apple.com/pt-br/102223">instruções da Apple</a>.</p>

    <h2 id="pinto">Pinto Notes para usar IA com suas notas</h2>
    <p>O Pinto Notes funciona como o Notas no iPhone e no Mac. As notas são arquivos Markdown e cada versão anterior fica no histórico. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a>, a IA pode ler e editar as notas. Isso permite trabalhar com a biblioteca importada do Evernote.</p>
    <p>No Mac, exporte cada caderno como .enex e solte todos os arquivos de uma vez. Cada caderno vira uma pasta; as etiquetas também são trazidas. Escolha Import from Evernote no menu File do Pinto Notes, como na imagem. <a href="/blog/import-your-notes" hrefLang="en">Veja os detalhes da importação</a>. O Evernote original não muda.</p>
    <p>O Pinto Notes funciona só em iPhone e Mac. Não tem app para Windows, Android ou web.</p>

    <h2 id="obsidian">Obsidian para arquivos Markdown e pesquisa com links</h2>
    <p>O Obsidian guarda notas como arquivos Markdown locais. Links, gráfico e plugins da comunidade ajudam a organizar uma biblioteca de pesquisa. Roda em Mac, iPhone, Windows, Linux e Android. O app é grátis. Obsidian Sync é um serviço pago opcional; decida como sincronizar antes de mudar.</p>
    <p>Instale e ative o Importer oficial em Settings, Community Plugins. Abra o Importer, escolha Evernote (.enex), selecione a exportação e use Import para prévia e depois para concluir. O <a href="https://obsidian.md/help/import/evernote">guia do Obsidian</a> explica como preservar pilhas de cadernos pelos nomes dos arquivos e hierarquias de etiquetas renomeando as etiquetas. Uma exportação comum não preserva essas estruturas.</p>

    <h2 id="notion">Notion para notas junto do trabalho da equipe</h2>
    <p>O Notion transforma cadernos do Evernote em páginas e notas em itens de banco de dados. Isso muda a organização da biblioteca e coloca as notas junto do trabalho da equipe. Funciona em Mac, iPhone, Windows, Android e web.</p>
    <p>No computador ou navegador, abra Settings, Import, Third party imports, Evernote. Entre na conta Evernote, autorize a conexão e escolha os cadernos. O <a href="https://www.notion.com/help/import-data-into-notion">guia oficial</a> documenta a conexão com a conta, não o envio de .enex. Evernote Teams fica de fora, e imagens podem exigir ajustes. Mantenha acesso à conta Evernote até conferir o resultado.</p>

    <h2 id="bear">Bear para escrita Markdown com etiquetas</h2>
    <p>O Bear combina um editor Markdown com tabelas e listas de tarefas. Funciona no Mac e no iPhone. A <a href="https://bear.app/">página de recursos</a> informa que a sincronização pelo iCloud exige Pro. Inclua essa assinatura na decisão se precisar das notas nos dois aparelhos.</p>
    <p>No Mac, escolha File, Import From, Evernote e selecione o .enex. No iPhone, abra o menu de três pontos da barra lateral e escolha Import. O <a href="https://bear.app/faq/migrate-from-evernote/">guia de migração do Bear</a> diz que .enex não contém os nomes dos cadernos. Ele sugere adicionar etiquetas antes da exportação para guardar essa referência. Planeje isso se usa muitos cadernos.</p>

    <h2 id="joplin">Joplin para cadernos de código aberto</h2>
    <p>O Joplin é grátis e de código aberto. Tem cadernos, etiquetas e recorte de páginas web. As notas ficam disponíveis offline. Roda em Mac, iPhone, Windows, Linux e Android. Você pode escolher Dropbox ou OneDrive para sincronizar, em vez do Joplin Cloud. Configure isso separadamente da importação.</p>
    <p>No app de computador, escolha File, Import, ENEX. O Joplin aceita um arquivo ou uma pasta de arquivos e cria um caderno por arquivo. Etiquetas e anexos são importados. Seu <a href="https://joplinapp.org/help/apps/import_export/">guia</a> explica a escolha entre Markdown e HTML. A conversão para Markdown pode perder cores e formatação da fonte. HTML ajuda quando isso importa. Links entre notas também podem precisar de reparo.</p>

    <h2 id="conferir">Teste um caderno pequeno antes de migrar tudo</h2>
    <p>Escolha um caderno com os tipos de nota que você realmente guarda. Antes de parar de usar o Evernote:</p>
    <ul>
      <li>Compare a quantidade de notas e abra exemplos com anexos ou tabelas.</li>
      <li>Confira etiquetas, organização dos cadernos e links entre notas.</li>
      <li>Busque uma nota conhecida e abra-a no iPhone depois de configurar a sincronização.</li>
      <li>Guarde os arquivos .enex originais até ficar satisfeito com a mudança.</li>
    </ul>
  </LocalPostPage>;
}
