import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativa-ao-upnote-iphone-mac");
// Versão pt-BR de /blog/upnote-alternative-for-iphone-and-mac, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "alternativa upnote" e a consulta longa com iPhone e Mac não retornaram sugestões; título usa a forma de busca "alternativa ao" confirmada para outros apps.
// Sem passos do app Notas; as páginas da Apple consultadas em pt-BR foram support.apple.com/pt-br/guide/notes/welcome/mac e support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
// A rota descrita é importação genérica de Markdown, não um teste novo de exportação do UpNote.
const ui = UI.pt;
const CHECK = `Teste de importação do UpNote
- [ ] Comparar o número de arquivos exportados com as notas importadas
- [ ] Ler uma nota longa até o fim
- [ ] Conferir uma tabela e uma checklist
- [ ] Abrir cada imagem e anexo da amostra
- [ ] Seguir um link para outra nota
- [ ] Ver onde ficaram as notas de cada caderno
- [ ] Conferir uma nota com seção recolhível
- [ ] Abrir as notas importadas no iPhone
- [ ] Guardar a exportação e a biblioteca original do UpNote`;
const FAQ = [
  {q:"O Pinto importa uma exportação do UpNote?",a:["Ele aceita no Mac uma pasta ou ZIP de arquivos Markdown ou texto. É uma importação genérica, sem ferramenta dedicada ao UpNote. Teste uma amostra antes de migrar tudo."]},
  {q:"A exportação Markdown está no UpNote grátis?",a:["O UpNote lista exportação de texto, PDF, HTML e Markdown no Premium. Confira seu plano antes de depender desse caminho."]},
  {q:"As seções recolhíveis continuam iguais?",a:["Isso não foi verificado. Compare uma nota que as usa, incluindo o texto dentro delas, e guarde o original."]},
  {q:"O Pinto substitui o UpNote no Windows?",a:["Não. O Pinto funciona apenas no Mac e no iPhone, sem app para Windows, Linux ou Android e sem versão web."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativa-ao-upnote-iphone-mac"
    intro={<>O Pinto Notes é uma alternativa grátis ao UpNote no Mac e no iPhone para quem prefere editar como no app Notas. Teste primeiro uma pequena exportação Markdown.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#manter",label:"Manter o UpNote"},{href:"#exportar",label:"Exportar"},{href:"#importar",label:"Importar"},{href:"#conferir",label:"Conferir"},{href:"#pinto",label:"Usar IA"}]}>
      <p>Se você usa Mac e iPhone, pode importar uma pasta de notas Markdown ou texto no Pinto e conferir as cópias. Se depende dos apps do UpNote no Windows, Linux ou Android, mantenha o UpNote.</p>
      <PostCta slug="pt/alternativa-ao-upnote-iphone-mac" path="/pt/blog/alternativa-ao-upnote-iphone-mac" position="answer" ui={ui.cta} title="Teste algumas notas no Pinto"><p>Baixe o Pinto Notes grátis no Mac, importe uma pequena amostra Markdown e confira o resultado antes de trazer o resto. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="manter">Quando vale manter o UpNote</h2>
    <p>O UpNote funciona no Mac e no iPhone, além de Windows, Linux e Android. O Pinto não tem app para esses sistemas nem versão web. O UpNote também oferece cadernos aninhados, seções recolhíveis e captura de páginas no Chrome, Safari e Firefox, como mostra sua <a href="https://getupnote.com/">página de recursos</a>. Uma importação Markdown não recria necessariamente essas formas de trabalho.</p>
    <h2 id="exportar">Exporte uma amostra do UpNote</h2>
    <p>Escolha uma nota longa, uma checklist e outra com anexo ou link para outra nota. Inclua uma seção recolhível se você usa esse recurso.</p>
    <Steps><li>No Mac, selecione as notas de teste na lista do UpNote.</li><li>Clique em Export no painel direito. Escolha Markdown e arquivos separados.</li><li>Guarde a pasta inteira, incluindo Files para imagens e anexos.</li></Steps>
    <p>Esses passos seguem o <a href="https://help.getupnote.com/import-and-export/export-notes">guia de exportação do UpNote</a>. Ele também permite exportar texto, mas lista a exportação como recurso Premium. Confira seu plano. Se a amostra passar, File &gt; Export all notes é o caminho para todas as notas no Mac.</p>
    <h2 id="importar">Importe Markdown ou texto no Pinto</h2>
    <p>No Mac, abra o menu File do Pinto Notes, escolha Import Markdown or Text e selecione a pasta. O <a href="/blog/import-your-notes" hrefLang="en">guia de importação</a> explica que o Pinto aceita uma pasta ou ZIP de Markdown ou texto, e cada pasta vira uma pasta. Isso não garante preservar todos os cadernos do UpNote. Guarde a biblioteca e a exportação originais.</p>
    <h2 id="conferir">Compare antes de mudar</h2>
    <p>Abra cada nota original ao lado da cópia. Leia até o final, abra anexos e siga links. Esta rota não foi testada aqui com uma exportação nova do UpNote.</p>
    <Keep title="Checklist do teste com UpNote" text={CHECK} copyLabel={ui.copy} note="Use com a amostra e repita nas partes mais importantes da sua biblioteca." />
    <p>Se links ou anexos falharem, mantenha a fonte disponível enquanto corrige a cópia. Se um recurso essencial não vier, continue no UpNote.</p>
    <h2 id="pinto">Trabalhe com suas notas e IA</h2>
    <p>O Pinto Notes funciona como o app Notas no Mac e no iPhone. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, a IA pode ler e editar notas. Peça primeiro um resumo de uma nota importada, confira-o e só depois peça uma alteração. O Pinto guarda versões anteriores a partir das edições nele, sem trazer o histórico do UpNote.</p>
    <h2>Guarde uma forma de exportar novamente</h2>
    <p>O Pinto exporta a biblioteca como arquivos Markdown em pastas dentro de um ZIP. Notas ainda bloqueadas, que você abre com senha, Face ID ou Touch ID, ficam de fora. O resumo informa arquivos que não conseguiu baixar. Confira o resumo e abra alguns arquivos. Guarde também a exportação original do UpNote.</p>
  </LocalPostPage>;
}
