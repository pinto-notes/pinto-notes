import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-mem-ai-iphone-mac");
// Versão pt-BR de /blog/mem-ai-alternative-for-mac-and-iphone, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "alternativa ao mem ai" não trouxe sugestões;
// "mem ai" trouxe "mem ai" e "mem ai obsidian"; "alternativas ao mem" trouxe memória RAM. Sem sugestão local para a comparação.
// Mem: help.mem.ai/migration e /migration/save-a-copy, consultados no original em 21 nov.
// Os nomes de exportação abaixo são os da ajuda do Mem. Não há passos do app Notas da Apple neste post.
// A rota de importação é um teste por formato, não uma migração do Mem verificada.
const ui = UI.pt;
const CHECK = `Conferência da importação do Mem
- [ ] Comparar uma nota longa inteira com a original
- [ ] Conferir uma tabela e uma checklist
- [ ] Abrir um link para outra nota
- [ ] Abrir uma imagem e um PDF
- [ ] Comparar datas de criação e alteração
- [ ] Conferir uma nota que estava em duas coleções
- [ ] Achar a transcrição da reunião e reproduzir o áudio salvo à parte
- [ ] Identificar índices de coleções ou relatórios importados como notas extras
- [ ] Abrir as notas importadas no iPhone
- [ ] Guardar o ZIP original do Mem e a pasta extraída`;
const FAQ = [
  { q: "Quando as notas do Mem ficam somente para leitura?", a: ["O guia de migração do Mem, consultado em 21 de novembro de 2026, informa 18 de dezembro de 2026. Você pode ler e exportar as notas até o fechamento do serviço em 15 de janeiro de 2027. Salve a exportação antes disso."] },
  { q: "O Pinto Notes importa o Mem diretamente?", a: ["Não. No Mac, use Import Markdown or Text com uma pasta ou arquivo .zip de textos em Markdown. Como o Mem exporta Markdown, essa é uma rota para testar com poucas notas antes da biblioteca toda."] },
  { q: "As coleções do Mem serão preservadas?", a: ["Isso não foi verificado. O importador geral do Pinto acompanha as pastas da exportação. Confira uma nota que pertencia a mais de uma coleção e guarde os índices com o arquivo original."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-mem-ai-iphone-mac"
    intro={<>Segundo o Mem, as notas ficam somente para leitura em 18 de dezembro de 2026 e o serviço fecha em 15 de janeiro de 2027. Se você usa Mac e iPhone, pode testar o Pinto Notes com uma cópia da sua exportação Markdown.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#salvar", label: "Salve a exportação" }, { href: "#escolher", label: "Compare os apps" },
      { href: "#importar", label: "Teste a importação" }, { href: "#conferir", label: "Confira as notas" },
      { href: "#ia", label: "Conecte sua IA" },
    ]}>
      <p>Salve sua biblioteca antes do prazo indicado no <a href="https://help.mem.ai/migration">guia de migração do Mem</a>. O Pinto Notes oferece edição parecida com a do app Notas e acesso por ChatGPT ou Claude. Não há importador específico para Mem. Teste uma amostra e guarde o ZIP original.</p>
      <PostCta slug="pt/alternativa-ao-mem-ai-iphone-mac" path="/pt/blog/alternativa-ao-mem-ai-iphone-mac" position="answer" ui={ui.cta} title="Teste algumas notas do Mem no Pinto Notes"><p>Baixe o Pinto Notes grátis no Mac e importe primeiro uma cópia pequena. Se conectar ChatGPT ou Claude, a IA poderá ler e editar essas notas. O app está em inglês.</p></PostCta>
    </Answer>}
    hero={<></>} faq={FAQ}>
    <h2 id="salvar">Salve uma cópia antes de escolher outro app</h2>
    <p>Você pode exportar agora e decidir depois. Se continuar editando no Mem, exporte de novo antes de as notas ficarem somente para leitura. Anote a data de cada download.</p>
    <Steps>
      <li>No computador, entre no Mem e abra Settings, Exports.</li>
      <li>Clique em Start new export. Escolha My Computer, depois Next. Revise as opções e clique em Start export.</li>
      <li>Volte a Exports. Quando o arquivo estiver pronto, clique em Download e salve o ZIP.</li>
    </Steps>
    <p>O <a href="https://help.mem.ai/migration/save-a-copy">guia do Mem</a> descreve as pastas <code>notes/</code>, com um Markdown por nota, <code>collections/</code>, com índices, e <code>attachments/</code>, com arquivos referenciados disponíveis. Mantenha tudo junto. Leia <code>export-report.md</code>, se existir, para ver itens ausentes.</p>
    <p>As transcrições de reunião disponíveis entram por padrão. Marque a opção de gravações de áudio se quiser salvar também o som. Guarde o ZIP e a pasta extraída. A nota da reunião, sozinha, não comprova que o áudio foi salvo.</p>

    <h2 id="escolher">O que você gosta no Mem importa</h2>
    <p>O Mem já tem <a href="https://help.mem.ai/features/chat">chat para criar, editar e encontrar notas</a>. Uma nota pode pertencer a várias <a href="https://help.mem.ai/features/collections">coleções</a>. Ter acesso por IA, por si só, não distingue o Pinto. Escolha pelo editor parecido com o Notas e pela possibilidade de conectar ChatGPT ou Claude separadamente.</p>
    <p>Se seu trabalho depende do chat e das coleções do Mem, continue usando o app enquanto compara opções. Exporte agora e conclua a mudança antes do fechamento. Teste também suas tarefas diárias no novo app.</p>
    <p>O Pinto Notes funciona somente no Mac e no iPhone. Não tem app para Windows, Android ou web. Se você precisa desses aparelhos, escolha um destino compatível.</p>

    <h2 id="importar">Teste a importação Markdown no Mac</h2>
    <p>Extraia o ZIP e duplique a pasta. Na cópia de trabalho, deixe poucas notas e os anexos relacionados. Preserve as pastas e os caminhos relativos. Inclua uma nota com tabela e duas notas ligadas entre si.</p>
    <p>No Pinto Notes, abra o menu File e escolha Import Markdown or Text. Selecione a pasta de teste. O <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a> (em inglês) aceita uma pasta ou .zip de arquivos Markdown ou texto. Cada pasta vira uma pasta.</p>
    <p>Isso acompanha as pastas exportadas. Não confirma que as coleções do Mem serão preservadas. Índices em Markdown e o relatório da exportação podem virar notas extras. Compare a lista importada com os arquivos escolhidos. Não testamos aqui uma exportação recente do Mem no Pinto.</p>

    <h2 id="conferir">Compare as cópias antes de levar tudo</h2>
    <p>Abra no Mem uma nota conhecida ao lado da cópia importada. Leia até o fim e confira os elementos que você usa.</p>
    <Keep title="Conferência da importação do Mem" text={CHECK} copyLabel={ui.copy} note="Use os itens que fazem sentido para sua biblioteca. Anote problemas ao lado do nome do arquivo original." />
    <p>Texto importado não comprova que datas e anexos vieram corretamente. Confira cada um. Para coleções, use uma nota que estava em dois lugares. Para reuniões, confira transcrição e áudio separadamente. Guarde no arquivo original tudo que não conseguir confirmar.</p>

    <h2 id="ia">Use as notas importadas com ChatGPT ou Claude</h2>
    <p>Quando a amostra estiver certa, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecte ChatGPT ou Claude</a> (guia em inglês) e escolha Allow no Pinto Notes. Essa autorização permite ler e editar notas. Peça para encontrar uma nota de projeto importada e listar tarefas pendentes no chat, sem editá-la ainda.</p>
    <p>Compare a lista com a nota. Depois peça para acrescentar um próximo passo com as palavras que você indicar e confira a edição. O Pinto guarda versões anteriores da nota. Esse histórico cobre mudanças feitas no Pinto; ele não transfere as versões antigas do Mem.</p>
    <p>Guarde a exportação original depois da mudança. Você poderá comparar um detalhe ausente com o arquivo fonte mesmo após o fechamento do Mem. Mantenha exportações mais novas separadas das antigas.</p>
  </LocalPostPage>;
}
