import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-craft-notas-pessoais");
// Versão pt-BR de /blog/craft-alternative-for-personal-notes, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "alternativa craft" trouxe resultados de artesanato, não do app; a consulta longa não sugeriu termos. O título especifica o app de notas e a intenção de troca.
// Sem instruções de menu do app Notas. Apple pt-BR consultada em support.apple.com/pt-br/guide/notes/welcome/mac e support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
// Fatos do Craft seguem o original; não há promessa de migrar Collections, cartões ou histórico.
const ui = UI.pt;
const CHECK = `Teste com notas pessoais do Craft
- [ ] Comparar o texto inteiro com o documento original
- [ ] Conferir cabeçalhos e itens marcados de checklist
- [ ] Ler todas as células de uma tabela pequena
- [ ] Abrir uma imagem e um anexo
- [ ] Seguir um link para outro documento importado
- [ ] Encontrar o conteúdo de uma página ou cartão aninhado
- [ ] Abrir e editar a nota importada no iPhone
- [ ] Guardar os originais do Craft e a exportação`;
const FAQ = [
  {q:"Qual alternativa ao Craft serve para notas pessoais?",a:["O Pinto pode servir no Mac e no iPhone se você quer edição parecida com o app Notas, pastas e ChatGPT ou Claude conectados. Teste alguns documentos Markdown primeiro. Mantenha o Craft se depende de Collections, cartões ou espaço compartilhado."]},
  {q:"O Pinto tem importador próprio para Craft?",a:["Não. Exporte documentos do Craft como Markdown e use o importador genérico do Pinto no Mac. Isso não garante reproduzir um espaço, links ou layout do Craft."]},
  {q:"Preciso sair do Craft para usar ChatGPT ou Claude?",a:["Não. O Craft documenta conexões para os dois por MCP e também tem seu próprio assistente de IA."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-craft-notas-pessoais"
    intro={<>O Pinto Notes pode substituir o Craft para notas pessoais no Mac e no iPhone, com edição parecida com o app Notas. Se você usa Collections ou documentos compartilhados, confira suas necessidades antes de mudar.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#escolher",label:"Escolher"},{href:"#manter",label:"Manter o Craft"},{href:"#exportar",label:"Testar"},{href:"#conferir",label:"Conferir"},{href:"#pinto",label:"Usar o Pinto"}]}>
      <p>Teste alguns documentos pessoais com exportação Markdown. O Craft já oferece IA e exportação, então avalie o editor e o que acontece com seus próprios documentos.</p>
      <PostCta slug="pt/alternativa-ao-craft-notas-pessoais" path="/pt/blog/alternativa-ao-craft-notas-pessoais" position="answer" ui={ui.cta} title="Teste suas notas pessoais no Pinto"><p>Baixe o Pinto Notes grátis no Mac e importe alguns arquivos Markdown. Conecte ChatGPT ou Claude se quiser que a IA leia e edite essas notas. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="escolher">Comece pelos documentos que usa</h2>
    <p>Uma lista de consertos de casa não exige o mesmo que um banco de projetos com registros relacionados. O Pinto Notes tem pastas, checklists, tabelas e links entre notas. Seu editor funciona como o app Notas no Mac e no iPhone. Não há app para Windows ou Android nem versão web. Para outras opções, veja a <a href="/blog/best-notes-app-for-mac" hrefLang="en">comparação de apps de notas para Mac</a>.</p>
    <h2 id="manter">Quando ficar no Craft</h2>
    <p>O Craft usa blocos e cartões. Suas <a href="https://support.craft.do/en/organize-and-find/collections">Collections</a> incluem propriedades e relações, com visualização em tabela, galeria e Kanban. Pastas e notas vinculadas do Pinto não recriam isso. A <a href="https://www.craft.do/pricing">tabela de planos do Craft</a> inclui espaços compartilhados em planos elegíveis e publicação de documentos. Se colegas usam um espaço, migre apenas notas particulares que você puder separar.</p>
    <p>O Craft tem assistente de IA e <a href="https://support.craft.do/en/integrate/mcp">conexões com ChatGPT e Claude</a>. Com as permissões adequadas, elas podem criar ou atualizar documentos. Teste essa opção se seu único motivo para mudar for acesso por IA.</p>
    <h2 id="exportar">Teste uma pequena exportação Markdown</h2>
    <p>Escolha um documento simples, por exemplo "Consertos do corredor", com checklist e texto sobre pintura. Inclua outro com anexo ou página aninhada.</p>
    <ol><li>No Craft, abra um documento e clique em Share no canto superior direito.</li><li>Escolha Export As e depois Markdown. Repita no outro documento.</li><li>Mantenha os arquivos e anexos juntos numa pasta.</li><li>No Mac, abra File no Pinto Notes, escolha Import Markdown or Text e selecione a pasta.</li></ol>
    <p>Os passos de exportação vêm do <a href="https://support.craft.do/en/import-and-export/export/document">guia do Craft</a>. O Pinto aceita pasta ou ZIP de Markdown ou texto; cada pasta vira uma pasta. Veja seu <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>. O Markdown leva estrutura e formatação básicas, sem garantia de reproduzir cartões ou links internos.</p>
    <h2 id="conferir">Compare as cópias</h2>
    <p>Abra o original ao lado da nota importada. Leia do começo ao fim e teste os links. Reconhecer o título na lista é só o início.</p>
    <Keep title="Conferência da exportação do Craft" text={CHECK} copyLabel={ui.copy} note="Itens para verificar, não uma promessa de que tudo será transferido." />
    <p>O Craft também exporta itens de Collections em Markdown com valores de propriedades como texto. Isso não confirma uma migração de Collections para o Pinto. Guarde-as no Craft até testar. Versões anteriores de documentos também não fazem parte desta transferência.</p>
    <h2 id="pinto">Escreva nas notas importadas</h2>
    <p>Se o teste funcionar, importe as notas pessoais que quiser. O Pinto guarda versões anteriores das edições feitas nele; esse histórico começa no Pinto. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, a IA pode ler e editar suas notas. Peça uma sugestão para os itens pendentes de "Consertos do corredor", confira-a e depois peça a edição. Abra a nota para revisar o resultado.</p>
  </LocalPostPage>;
}
