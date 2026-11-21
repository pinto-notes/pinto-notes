import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-joplin-mac");
// Versão pt-BR de /blog/joplin-alternative-for-mac, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "alternativa joplin" sugeriu "alternativa joplin"; a consulta com Mac não retornou sugestões.
// Sem passos do app Notas; Apple pt-BR consultada em support.apple.com/pt-br/guide/notes/welcome/mac e support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
// Menus Joplin e Pinto seguem o original; a importação não promete migrar JEX, plugins, sync ou histórico.
const ui = UI.pt;
const CHECK = `Conferência da migração do Joplin
- [ ] Comparar a quantidade de notas do caderno de teste
- [ ] Ler uma nota longa ao lado da original no Joplin
- [ ] Abrir uma imagem anexada e um arquivo
- [ ] Seguir um link entre duas notas importadas
- [ ] Conferir uma tabela e uma checklist
- [ ] Conferir título, datas e texto das tags
- [ ] Guardar o backup JEX e a exportação Markdown`;
const FAQ = [
  {q:"O Pinto importa um backup JEX do Joplin?",a:["Não por esta rota. Use uma pasta ou ZIP de Markdown ou texto. Guarde o JEX para restaurar no Joplin e faça outra exportação para a mudança."]},
  {q:"Qual exportação do Joplin usar?",a:["Teste Markdown + Front Matter. O Joplin guarda título, datas e tags ali. O Pinto lê esses campos e acrescenta tags como texto na nota. Mantenha anexos com os arquivos."]},
  {q:"Posso continuar no Joplin no Linux?",a:["Sim, mas a importação não sincroniza os apps. O Pinto funciona só no Mac e no iPhone. Se precisa da mesma biblioteca no Linux, Windows ou Android, mantenha o Joplin."]},
  {q:"Preciso sair do Joplin para usar Claude?",a:["Não. O Joplin documenta um servidor MCP local pelo Web Clipper para buscar e ler notas e, com as ferramentas habilitadas, criá-las ou editá-las."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-joplin-mac"
    intro={<>O Pinto Notes é uma alternativa ao Joplin no Mac e no iPhone para quem prefere editar como no app Notas. Se você precisa de Windows, Linux ou Android, mantenha o Joplin.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparar",label:"Comparar"},{href:"#manter",label:"Manter o Joplin"},{href:"#exportar",label:"Exportar"},{href:"#conferir",label:"Conferir"},{href:"#pinto",label:"Usar IA"}]}>
      <p>Teste um pequeno caderno em Markdown no Pinto e guarde um backup JEX para o Joplin. Os dois apps podem dar acesso a notas para IA; compare o editor e a conexão que prefere.</p>
      <PostCta slug="pt/alternativa-ao-joplin-mac" path="/pt/blog/alternativa-ao-joplin-mac" position="answer" ui={ui.cta} title="Teste um caderno do Joplin no Pinto"><p>Baixe o Pinto Notes grátis no Mac e importe uma pasta de notas Markdown. Conecte ChatGPT ou Claude se quiser que a IA leia e edite essas notas. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="comparar">Compare dispositivos e edição</h2>
    <div className="tableWrap"><table><thead><tr><th scope="col">Você precisa de</th><th scope="col">Joplin</th><th scope="col">Pinto Notes</th></tr></thead><tbody>
      <tr><th scope="row">Mac e iPhone</th><td>Disponível nos dois</td><td>Disponível nos dois</td></tr>
      <tr><th scope="row">Windows, Linux ou Android</th><td>Disponível nos três</td><td>Sem app para esses sistemas</td></tr>
      <tr><th scope="row">Edição</th><td>Editores Markdown e Rich Text</td><td>Funciona como o app Notas</td></tr>
      <tr><th scope="row">IA nas notas</th><td>MCP local pelo Web Clipper</td><td>Conexão hospedada para ChatGPT ou Claude</td></tr>
    </tbody></table></div>
    <p>O Joplin lista seus sistemas no <a href="https://joplinapp.org/help/install/">guia de instalação</a>. O Pinto não tem app para Windows, Linux ou Android nem versão web. Ter um Mac em casa não substitui o Joplin no computador do trabalho ou num celular Android.</p>
    <h2 id="manter">Motivos para ficar no Joplin</h2>
    <p>O Joplin tem editores <a href="https://joplinapp.org/help/apps/rich_text_editor/">Markdown e Rich Text</a>. Se os símbolos Markdown incomodam, teste o Rich Text antes de migrar. Seu <a href="https://joplinapp.org/help/apps/sync/">guia de sincronização</a> cita Nextcloud, WebDAV e Dropbox. A importação não transfere essa configuração. <a href="https://joplinapp.org/help/apps/plugins/">Plugins</a> também não migram com as notas.</p>
    <p>O Joplin oferece um <a href="https://joplinapp.org/help/apps/ai_mcp/">servidor MCP</a> pelo Web Clipper local. Apps de IA podem buscar e ler notas e, com ferramentas habilitadas, criar ou atualizar. Se você gosta do Joplin e só quer Claude nas notas, teste essa conexão primeiro.</p>
    <h2 id="exportar">Exporte Markdown e guarde JEX</h2>
    <p>O <a href="https://joplinapp.org/help/apps/import_export/">guia do Joplin</a> descreve JEX como backup para reimportação no próprio Joplin. Guarde um. Para o Pinto, faça outra exportação.</p>
    <Steps><li>Exporte um caderno pequeno como Markdown + Front Matter para uma pasta. Inclua anexos e formatos que você usa.</li><li>Guarde a pasta e os arquivos de recursos. Abra um Markdown num editor de texto para conferir o conteúdo.</li><li>No Mac, abra o Pinto Notes e escolha File, Import Markdown or Text. Selecione a pasta ou um ZIP dela e revise a importação.</li></Steps>
    <p>O <a href="https://joplinapp.org/help/dev/spec/interop_with_frontmatter/">guia de front matter</a> explica título, datas e tags. O Pinto lê esses campos e acrescenta as tags como texto na nota. A rota do <a href="/blog/import-your-notes" hrefLang="en">Pinto</a> aceita pasta ou ZIP de Markdown ou texto; cada pasta vira uma pasta. Anexos vinculados que estejam na exportação podem ser importados. Os arquivos de origem ficam intactos. JEX não entra por essa rota.</p>
    <h2 id="conferir">Confira o caderno de teste</h2>
    <p>Compare as cópias com o Joplin. Abra links e anexos; contar notas não basta.</p>
    <Keep title="Conferência das notas do Joplin" text={CHECK} copyLabel={ui.copy} note="Lista para usar na sua importação, não resultado de um teste com seus arquivos." />
    <p>Configurações, plugins, alarmes de tarefas e versões antigas do Joplin não estão prometidos nessa mudança. Resolva links ou anexos quebrados na amostra antes de importar o resto.</p>
    <h2 id="pinto">Trabalhe com as notas importadas</h2>
    <p>O Pinto guarda as versões anteriores das edições feitas nele, sem recuperar o histórico do Joplin. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, a IA pode ler e editar as notas. A conexão do Pinto é hospedada; a do Joplin descrita acima é local. Peça que encontre uma nota, liste tarefas pendentes e indique as linhas usadas. Confira antes de pedir uma edição. Use o caderno por alguns dias no Mac e no iPhone e guarde a exportação original.</p>
  </LocalPostPage>;
}
