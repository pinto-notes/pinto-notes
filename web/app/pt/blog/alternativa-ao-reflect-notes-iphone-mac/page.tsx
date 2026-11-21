import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-reflect-notes-iphone-mac");
// Versão pt-BR de /blog/reflect-notes-alternative-for-mac-and-iphone, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "alternativa ao reflect notes" e "reflect notes alternativa"
// não trouxeram sugestões; "reflect notes" trouxe "reflect notes" e "reflect notes alternative". Sem sugestão local para a comparação.
// Reflect: reflect.academy/moving-to-reflect-open e /import-export-backups, fontes do original.
// Os comandos em inglês abaixo são os do Reflect e do Pinto, não menus do app Notas da Apple.
// Não há instruções do Notas da Apple nem teste de migração recente neste post.
const ui = UI.pt;
const CHECK = `Conferência da importação do Reflect
- [ ] Ler uma nota longa inteira ao lado da original
- [ ] Conferir uma nota diária e sua data
- [ ] Seguir um link para outra nota importada
- [ ] Ver se os backlinks ainda ajudam a encontrar notas
- [ ] Comparar etiquetas e localização das notas
- [ ] Conferir uma tabela e uma checklist
- [ ] Abrir cada imagem e anexo da amostra
- [ ] Abrir as cópias importadas no iPhone
- [ ] Guardar o ZIP original e o acesso ao Reflect`;
const FAQ = [
  { q: "Há um prazo para sair do Reflect Classic?", a: ["Não. O guia de migração do Reflect, consultado em 21 de novembro de 2026, diz que não há prazo para mudar para o Reflect Open. Compare suas opções e confira a exportação antes de trocar de app."] },
  { q: "O Pinto Notes tem importador específico para Reflect?", a: ["Não. Exporte um ZIP Markdown do Reflect Classic e use a importação geral de Markdown e texto do Pinto no Mac. Teste poucas notas primeiro. Essa rota não foi testada aqui com uma exportação recente."] },
  { q: "Minhas notas diárias e backlinks funcionarão igual no Pinto?", a: ["Isso não foi verificado. Importe uma nota diária e duas notas ligadas. Compare datas, navegação, etiquetas e texto com o Reflect antes de levar o resto."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-reflect-notes-iphone-mac"
    intro={<>O Pinto Notes é uma alternativa grátis ao Reflect Notes para Mac e iPhone se você quer um editor parecido com o app Notas e acesso por ChatGPT ou Claude. O Reflect Open também é uma opção, e o Reflect diz que não há prazo para deixar o Classic.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#ficar", label: "Quando ficar" }, { href: "#exportar", label: "Exporte do Classic" },
      { href: "#importar", label: "Teste no Pinto" }, { href: "#conferir", label: "Confira as notas" },
      { href: "#ia", label: "Use sua IA" },
    ]}>
      <p>Escolha o Pinto pela edição parecida com a do Notas no Mac e no iPhone, com ChatGPT ou Claude capaz de ler e editar as notas após a conexão. Se quiser manter o fluxo do Reflect e arquivos Markdown numa pasta sua, teste o Reflect Open. Para experimentar o Pinto, exporte Markdown do Classic e confira uma amostra.</p>
      <PostCta slug="pt/alternativa-ao-reflect-notes-iphone-mac" path="/pt/blog/alternativa-ao-reflect-notes-iphone-mac" position="answer" ui={ui.cta} title="Teste suas notas do Reflect no Pinto Notes"><p>Baixe o Pinto Notes grátis no Mac. Importe poucas notas Markdown, compare as cópias e conecte ChatGPT ou Claude se quiser usar IA. O app está em inglês.</p></PostCta>
    </Answer>}
    hero={<></>} faq={FAQ}>
    <h2 id="ficar">Quando vale continuar no Reflect</h2>
    <p>Se notas diárias e backlinks fazem parte do seu trabalho, considere ficar. O <a href="https://reflect.academy/moving-to-reflect-open">guia do Reflect Open</a> descreve outro app, de código aberto, com notas Markdown numa pasta sua. A posse dos arquivos, sozinha, não é motivo para escolher o Pinto.</p>
    <p>O Reflect documenta uma importação para o Open que inclui notas diárias, backlinks e etiquetas, entre outros conteúdos. O histórico das notas fica de fora. Essa rota específica merece ser comparada com uma importação geral de Markdown. Você pode seguir no Classic enquanto decide.</p>
    <p>O Pinto faz sentido se você quer um editor parecido com o Notas e ChatGPT ou Claude conectados às suas notas. Ele funciona somente no Mac e no iPhone, sem app para Windows, Android ou web.</p>

    <h2 id="exportar">Exporte Markdown do Reflect Classic</h2>
    <p>O <a href="https://reflect.academy/import-export-backups">guia de exportação</a> lista Markdown zip. Use esse formato no teste. A exportação Reflect Open do guia de migração serve para o próprio Open; o caminho para o Pinto usa Markdown comum.</p>
    <Steps>
      <li>No Reflect Classic, abra as preferências do Graph com Command e vírgula e selecione o grafo na barra lateral.</li>
      <li>Escolha Markdown zip e clique em Export Reflect.</li>
      <li>Guarde o ZIP original e crie uma cópia de trabalho para o teste.</li>
    </Steps>
    <p>Extraia a cópia e separe uma nota diária, uma nota longa de projeto, duas notas ligadas entre si e algum anexo. Mantenha os arquivos nas pastas relativas aos anexos para não quebrar os links só por movê-los.</p>
    <p>Se você já usa Reflect Open, copie algumas notas Markdown e seus anexos da pasta escolhida para outra pasta de teste. Preserve o grafo de trabalho.</p>

    <h2 id="importar">Use a importação geral do Pinto no Mac</h2>
    <p>Abra o menu File do Pinto Notes, escolha Import Markdown or Text e selecione a pasta de amostra. O <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a> (em inglês) aceita pastas ou arquivos .zip com Markdown ou texto. Cada pasta vira uma pasta.</p>
    <p>Não há escolha específica para Reflect. A importação geral não garante que notas diárias, backlinks, etiquetas, anexos, datas ou histórico se comportem do mesmo modo. Este guia não testou uma exportação recente do Reflect num app em execução.</p>

    <h2 id="conferir">Confira o que você usa todos os dias</h2>
    <p>Compare cada nota da amostra com sua fonte no Reflect. Conte os arquivos, abra anexos e experimente os links.</p>
    <Keep title="Conferência da importação do Reflect" text={CHECK} copyLabel={ui.copy} note="Anote as diferenças antes de decidir sobre a biblioteca inteira." />
    <p>Uma nota com texto legível não comprova que seus backlinks ou datas foram preservados. Verifique o caminho que você usa para encontrar trabalho antigo. Guarde o ZIP original e o acesso ao Reflect até terminar a conferência.</p>
    <p>Se a amostra funcionar, teste um lote maior e repita a conferência antes de fazer do Pinto seu app diário. Se faltar um recurso essencial, continue no Reflect. Guarde a exportação para comparar detalhes depois.</p>

    <h2 id="ia">Conecte ChatGPT ou Claude depois do teste</h2>
    <p>Depois de conferir a amostra, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecte ChatGPT ou Claude</a> (guia em inglês) e escolha Allow no Pinto Notes. A autorização permite ler e editar notas. Peça para encontrar uma nota importada e resumir tarefas no chat. Compare a resposta com a nota antes de pedir uma edição.</p>
    <p>O Pinto guarda as versões anteriores das mudanças feitas nele. Isso não transfere o histórico do Reflect. Se uma parte da migração não estiver clara, mantenha os arquivos originais para comparação.</p>
  </LocalPostPage>;
}
