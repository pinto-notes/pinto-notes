import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-google-keep-iphone-mac");
// Versão pt-BR de /blog/google-keep-alternative-for-iphone-and-mac, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "alternativa google keep" sugeriu "alternativa ao google keep"; a consulta longa com iPhone e Mac não retornou sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/welcome/mac e support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios. Não há passos de menu do Notas neste post.
// Os fatos de Google Keep e Pinto seguem o original em inglês; nenhuma preservação completa da exportação é prometida.
const ui = UI.pt;
const CHECK = `Conferência da troca do Google Keep
- [ ] Comparar uma nota longa com a original no Keep
- [ ] Conferir itens marcados e desmarcados de uma lista
- [ ] Abrir uma imagem importada
- [ ] Conferir uma nota com duas etiquetas
- [ ] Comparar uma nota fixada e suas datas
- [ ] Conferir notas arquivadas se escolhi importá-las
- [ ] Registrar o significado das cores que usei
- [ ] Guardar desenhos importantes separadamente
- [ ] Criar em outro app os lembretes de que ainda preciso
- [ ] Manter listas compartilhadas no Keep até todos concordarem com a mudança
- [ ] Guardar o download original do Takeout`;
const FAQ = [
  {q:"O Pinto importa etiquetas do Keep como pastas?",a:["Sim. Por padrão, a primeira etiqueta vira pasta e as demais viram tags. Você também pode importar todas como tags. Teste uma nota com várias etiquetas antes de escolher."]},
  {q:"Cores e lembretes do Keep aparecem no Pinto?",a:["Não. O importador deixa de fora cores, desenhos e lembretes e informa quais notas os tinham. Guarde desenhos importantes e configure avisos em outro app."]},
  {q:"A importação mantém o Keep sincronizado?",a:["Não. Ela copia uma exportação. Edições posteriores não se propagam entre os apps, e as permissões de colaboradores não acompanham as notas."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-google-keep-iphone-mac"
    intro={<>O Pinto Notes é uma alternativa grátis ao Google Keep para iPhone e Mac, com importação direta do Google Takeout. Se você usa Android ou depende de listas compartilhadas, considere manter o Keep.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#escolher",label:"Escolher"},{href:"#manter",label:"Manter o Keep"},{href:"#dados",label:"O que vem"},{href:"#importar",label:"Importar"},{href:"#conferir",label:"Conferir"}]}>
      <p>Para editar como no app Notas no Mac e no iPhone, importe o Keep no Pinto pelo Mac. Texto, checklists, imagens, etiquetas, notas fixadas e datas podem vir. Cores, desenhos e lembretes ficam de fora.</p>
      <PostCta slug="pt/alternativa-ao-google-keep-iphone-mac" path="/pt/blog/alternativa-ao-google-keep-iphone-mac" position="answer" ui={ui.cta} title="Teste suas notas do Keep no Pinto"><p>Baixe o Pinto Notes grátis no Mac e importe seu arquivo do Google Keep. Depois da conexão, ChatGPT ou Claude pode ler e editar as notas importadas. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="escolher">Escolha pelo que você usa</h2>
    <p>O Pinto Notes funciona como o app Notas e serve para notas pessoais no Mac e no iPhone. Ele não tem app para Windows ou Android nem versão web. Se precisa editar pelo navegador, o Keep já oferece isso. O app Notas é outra opção com pastas, checklists e tabelas. Veja <a href="/pt/blog/notas-iphone-vs-google-keep">a comparação com Google Keep</a> ou <a href="/pt/blog/google-keep-para-notas-iphone">como passar do Keep para o Notas</a>. A importação abaixo é direta para o Pinto.</p>
    <h2 id="manter">Quando vale continuar no Google Keep</h2>
    <p>O Keep tem app para iPhone e Android e acesso pelo navegador, como mostra o <a href="https://support.google.com/keep/answer/2888240?hl=pt-BR">guia do Google</a>. O Pinto não cobre Android. O Keep também permite que colaboradores editem uma nota. A cópia importada não leva essas permissões. Você pode migrar notas pessoais e manter uma lista compartilhada no Keep até todos decidirem mudar.</p>
    <h2 id="dados">O que vem do download do Takeout</h2>
    <p>O <a href="https://support.google.com/keep/answer/10017039?hl=pt-BR">guia de exportação do Google</a> descreve o download; o app de destino decide o que consegue usar. No Pinto, o resultado é este:</p>
    <div className="tableWrap"><table><thead><tr><th scope="col">No Google Keep</th><th scope="col">Depois da importação</th></tr></thead><tbody>
      <tr><th scope="row">Texto e checklists</th><td>Texto e estado dos itens marcados ou desmarcados</td></tr>
      <tr><th scope="row">Etiquetas</th><td>Pastas por padrão, ou tags à sua escolha</td></tr>
      <tr><th scope="row">Notas fixadas e datas</th><td>Estado fixado e datas de criação e edição disponíveis</td></tr>
      <tr><th scope="row">Imagens</th><td>Anexos, se os arquivos estiverem no download</td></tr>
      <tr><th scope="row">Notas arquivadas</th><td>Fora por padrão; podem entrar numa pasta Arquivo</td></tr>
      <tr><th scope="row">Lixeira</th><td>Notas ignoradas</td></tr>
      <tr><th scope="row">Cores, desenhos e lembretes</th><td>Omitidos; o resumo indica as notas afetadas</td></tr>
      <tr><th scope="row">Permissões de colaboradores</th><td>Não são transferidas</td></tr>
    </tbody></table></div>
    <p>Com Pastas, a primeira etiqueta vira a pasta e as demais viram tags. Com Tags, todas viram tags. Se a primeira etiqueta for Casa e a segunda Reparos, a nota vai para Casa com a tag Reparos. Anote o significado de cores importantes, guarde desenhos e configure os avisos necessários em outro app.</p>
    <h2 id="importar">Importe no Mac</h2>
    <p>No Pinto Notes, abra o menu File e escolha Google Keep. O app abre a página do Google com apenas o Keep selecionado. No Takeout, escolha a próxima etapa, uma exportação única e ZIP. Crie e baixe o arquivo quando o Google avisar. A preparação pode levar de minutos a dias. <a href="https://support.google.com/accounts/answer/3024190?hl=pt-BR">Baixar os dados não os apaga do Google</a>.</p>
    <p>Arraste o ZIP, a pasta Takeout extraída ou a pasta Keep para o Pinto. Se extrair, mantenha as imagens ao lado das notas. Escolha Pastas ou Tags e se deseja incluir o arquivo de notas arquivadas. Revise o resumo. Veja o <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a>.</p>
    <h2 id="conferir">Confira antes de sair do Keep</h2>
    <p>Compare notas reais: uma longa, uma checklist, uma imagem e outra com várias etiquetas. Um total de notas igual não prova que tudo veio corretamente.</p>
    <Keep title="Conferência da importação do Keep" text={CHECK} copyLabel={ui.copy} note="Copie a lista e confira suas notas antes de decidir." />
    <p>A importação é uma cópia, sem conexão contínua. Escolha em qual app vai editar cada nota para que as versões não se afastem. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, a IA pode ler e editar as notas do Pinto. Confira tarefas e datas que ela sugerir. O histórico do Pinto começa nas edições feitas lá; ele não recupera versões antigas do Keep.</p>
  </LocalPostPage>;
}
