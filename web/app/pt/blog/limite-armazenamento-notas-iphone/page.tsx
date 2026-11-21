import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "limite-armazenamento-notas-iphone");

// Versão pt-BR de /blog/apple-notes-storage-limit, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: armazenamento notas iphone; limite de armazenamento notas do iphone não teve sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/108047, support.apple.com/pt-br/108922, support.apple.com/pt-br/103188, support.apple.com/pt-br/108429.
// Ações sem nome confirmado foram descritas sem nome de menu.
const ui = UI.pt;

const FAQ = [
  { q: "O Notas tem limite total?", a: ["A Apple não publica um limite total próprio. Notas do iCloud usam a cota da conta, que começa com 5 GB grátis."] },
  { q: "Quantos anexos cabem numa nota?", a: ["A Apple não publica um número. O app mostra um aviso quando o limite é atingido."] },
  { q: "Notas do iCloud ocupam espaço?", a: ["Sim. Notas locais ficam no aparelho; notas de uma conta Gmail ficam nessa conta."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="limite-armazenamento-notas-iphone"
    intro={<> Se o iCloud está cheio ou o Notas recusa mais anexos, são limites diferentes. Veja o que a Apple informa e como medir o espaço usado. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#icloud",label:"Icloud"},{href:"#anexos",label:"Anexos"}]}>
      <p>A Apple não publica um limite total para o Notas. As notas do iCloud usam sua cota, que começa com 5 GB grátis. Há limites internos de anexos e tamanho sem números públicos.</p>
      <PostCta slug="pt/limite-armazenamento-notas-iphone" path="/pt/blog/limite-armazenamento-notas-iphone" position="answer" ui={ui.cta} title="Notas no Pinto Notes">
        <p>O Pinto Notes funciona no iPhone e no Mac, com suas notas criptografadas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="icloud">O Notas usa o espaço do iCloud</h2>
<PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250} alt="Ajustes do iCloud no iPhone mostrando o espaço usado e o app Notas." caption="O Notas aparece entre os dados salvos no iCloud. Imagem: Apple." />
<p>A Apple não publica um limite total exclusivo do Notas. A conta iCloud começa com 5 GB grátis; iCloud+ oferece 50 GB, 200 GB, 2 TB, 6 TB e 12 TB. As notas dividem espaço com fotos, backups, Mail e outros dados. Uma nota compartilhada usa o espaço do dono. Quando o iCloud enche, a sincronização de apps pode parar e os backups deixam de ser feitos. Veja <a href="/pt/blog/notas-iphone-nao-sincroniza">como verificar a sincronização</a>.</p>
<h2 id="anexos">Limites dentro de uma nota</h2>
<p>O app mostra avisos quando uma nota chega ao número máximo de anexos, quando um anexo é grande demais, quando a nota fica longa demais ou quando há muitos níveis de pastas. Também pode pedir para reduzir uma nota antes de bloqueá-la. A Apple não informa números gerais para esses limites nas páginas de suporte. Um valor visto em fórum não vale como limite oficial. Em conta Exchange, anexos de arquivo não estão disponíveis.</p>
<p>Se você chegou ao limite de anexos, abra outra nota para os próximos arquivos e crie um link entre as duas. Para ver os anexos, use a visualização de anexos na lista de notas do iPhone ou o navegador de anexos no Mac. Anexos de notas bloqueadas não aparecem nessa visão geral.</p>
<h2 id="medir">Veja quanto o Notas ocupa</h2>
<p>No iPhone, abra <strong>Ajustes &gt; Geral &gt; Armazenamento do iPhone &gt; Notas</strong> para ver o espaço local. Para o iCloud, abra Ajustes, seu nome, iCloud e armazenamento. No Mac, vá a Ajustes do Sistema, seu nome, iCloud e gerencie o espaço. Dados temporários podem não entrar no número local. O guia do iCloud agrupa dados do Notas em Documentos.</p>
<p>Só as notas sob iCloud usam essa cota. No Meu iPhone e Em Meu Mac ficam no aparelho; notas sob Gmail ficam nessa conta. <a href="/pt/blog/onde-ficam-salvas-notas-iphone">Veja onde cada nota está</a>.</p>
<h2 id="espaco">Libere espaço com cuidado</h2>
<p>Você pode apagar arquivos que não precisa em outros apps do iCloud ou ampliar o plano. Mover notas grandes para Em Meu Mac economiza espaço no iCloud, mas elas param de sincronizar; alguns anexos podem se perder na mudança de conta. Notas apagadas ficam em Apagadas por 30 dias. Faça uma cópia antes de excluir algo.</p>
<h2 id="pinto">Notas fora da cota do iCloud</h2>
<Figure shot={SHOTS.iphoneFiles} caption="Uma nota com PDF, CSV, foto e link no Pinto Notes para iPhone." />
<p>O Pinto Notes sincroniza por serviço próprio e criptografado, sem usar sua cota do iCloud. Aceita imagens, PDFs e arquivos nas notas. ChatGPT ou Claude podem lê-las e editá-las depois de conectados. A importação do Notas no Mac traz texto e imagens; PDFs e outros anexos ficam no Notas, que não é alterado. O app é grátis para Mac e iPhone.</p>


<p>Leia também: <a href="/blog/back-up-apple-notes" hrefLang="en">backup do Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, <a href="/pt/blog/passar-notas-iphone-para-icloud">mudança para o iCloud</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
