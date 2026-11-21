import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "onde-ficam-salvas-notas-iphone");

// Versão pt-BR de /blog/where-are-apple-notes-stored, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: onde ficam salvas as notas do iphone.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/iphone/iph7262fd4fe/ios, support.apple.com/pt-br/guide/notes/not85d6f7b58/mac, support.apple.com/pt-br/guide/notes/apd97da26aed/mac, support.apple.com/pt-br/guide/iphone/iph92579feda/ios, support.apple.com/pt-br/guide/icloud/mm8685520792/icloud, support.apple.com/pt-br/102537, support.apple.com/pt-br/102476, support.apple.com/pt-br/108770, support.apple.com/pt-br/102651, support.apple.com/pt-br/guide/notes/not201900c07/mac.
// Etapas sem nome confirmado aparecem descritas sem nome de menu.
const ui = UI.pt;

const FAQ = [
  { q: "As notas ficam no aparelho ou no iCloud?", a: ["Depende da conta. Sob iCloud, ficam na nuvem e nos aparelhos conectados. Sob No Meu iPhone ou Em Meu Mac, ficam só naquele aparelho."] },
  { q: "Onde ficam notas da conta Gmail?", a: ["Na conta Google, sincronizadas por IMAP com o app Notas. O Keep não mostra essas notas."] },
  { q: "Posso abrir as notas como arquivos no Mac?", a: ["A Apple não indica uma pasta do Finder. Para obter um arquivo, exporte a nota em PDF ou Markdown pelo app Notas."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="onde-ficam-salvas-notas-iphone"
    intro={<> Cada nota fica numa conta. Ela pode estar no iCloud, só no aparelho ou numa conta de e-mail. O cabeçalho da pasta mostra qual é o caso. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#conta",label:"Conta"},{href:"#icloud",label:"Icloud"}]}>
      <p>Notas sob iCloud ficam na nuvem e nos aparelhos da sua Conta Apple. No Meu iPhone e Em Meu Mac ficam só no aparelho. Gmail e Yahoo guardam as notas na conta de e-mail.</p>
      <PostCta slug="pt/onde-ficam-salvas-notas-iphone" path="/pt/blog/onde-ficam-salvas-notas-iphone" position="answer" ui={ui.cta} title="Notas que a sua IA pode usar">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude trabalhar nas notas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="conta">Primeiro, veja a conta da nota</h2>
<PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280} alt="Lista de pastas do Notas no iPhone, com a seção iCloud." caption="O cabeçalho acima da pasta indica a conta onde a nota está. Imagem: Apple." />
<p>Na lista de pastas do iPhone, procure os cabeçalhos iCloud, No Meu iPhone, Gmail, Yahoo ou uma conta do trabalho. No Mac, veja a barra lateral. A nota fica na conta da pasta em que ela está. Para verificar as contas no iPhone, abra Ajustes, Apps, Notas e as contas do app; no Mac, abra Notas e Contas. Se uma conta sumiu, confira se o uso do Notas está ativado para ela.</p>
<h2 id="icloud">Notas do iCloud</h2>
<PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250} alt="Tela do iCloud nos Ajustes, com o app Notas entre os dados salvos." caption="Confira nos Ajustes se o Notas está sincronizando com o iCloud. Imagem: Apple." />
<p>As notas do iCloud aparecem nos aparelhos com a mesma Conta Apple e em icloud.com/notes. No iPhone, procure Ajustes, seu nome, iCloud e Notas; no Mac, Ajustes do Sistema, seu nome, iCloud e Notas. A Apple criptografa essas notas em trânsito e nos servidores. Na proteção padrão, ela mantém as chaves; com Proteção Avançada de Dados, as chaves ficam nos aparelhos confiáveis.</p>
<p>Sincronização não substitui backup. Uma nota apagada vai para Apagadas nos aparelhos da conta e some em definitivo depois de 30 dias. Veja <a href="/blog/back-up-apple-notes" hrefLang="en">como guardar uma cópia</a>.</p>
<h2 id="local">No Meu iPhone e Em Meu Mac</h2>
<PostFigure src="/blog/macos27/notes27-settings-default-account-on-my-mac" width={1148} height={1000} maxWidth={500} alt="Ajustes do Notas no Mac com Em Meu Mac como conta padrão." caption="As notas em Em Meu Mac ficam nesse computador." />
<p>Essas notas ficam só no aparelho indicado e não aparecem no iCloud.com nem em outros aparelhos. Notas locais podem ser bloqueadas com senha, Face ID ou Touch ID, conforme o aparelho. As do iPhone entram nos backups do iPhone; as do Mac dependem do backup do Mac. Se você não encontra a nota no outro aparelho, confira se ela está numa conta local. <a href="/pt/blog/notas-iphone-nao-sincroniza">Veja outras causas de falha de sincronização</a>.</p>
<p>A Apple não indica uma pasta do Finder para abrir essas notas como arquivos. No Mac, exporte a nota em Arquivo, Exportar Para, PDF ou Markdown.</p>
<h2 id="email">Gmail, Yahoo e outras contas</h2>
<PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300} alt="Ajustes de uma conta Gmail no iPhone, com Notas ativado." caption="Notas da conta Gmail ficam nessa conta, não no Google Keep. Imagem: Apple." />
<p>Notas criadas sob esses cabeçalhos ficam na conta de e-mail e sincronizam por IMAP. Elas aparecem nos aparelhos em que a conta e o Notas estão ativados. A Apple diz que notas da conta Google permanecem nela se você a remover do iPhone. Leia e edite no app Notas; a Apple não informa onde aparecem no Gmail. Alguns recursos não funcionam, e essas notas não podem ser bloqueadas. Ao apagar uma, verifique a lixeira da conta de e-mail.</p>
<h2 id="padrao">Confira a conta padrão</h2>
<p>Notas criadas pela Siri ou pelo widget vão para a conta padrão. Escolha a conta desejada nos ajustes do Notas no iPhone ou Mac. Para levar notas locais ou do Gmail ao iCloud, veja <a href="/pt/blog/passar-notas-iphone-para-icloud">como mudar de conta</a>.</p>
<h2 id="pinto">Onde o Pinto Notes guarda notas</h2>
<Figure shot={SHOTS.connectList} caption="No Mac, o Pinto Notes permite conectar ChatGPT, Claude, Claude Code e Codex." />
<p>No Pinto Notes, você entra uma vez e as notas sincronizam entre iPhone e Mac por um serviço criptografado. Cada nota é um arquivo Markdown em suas pastas, com versões anteriores guardadas. ChatGPT ou Claude podem ler e editar esses arquivos depois da conexão. Não há app para Windows, Android ou web. O app importa suas notas do Apple Notes no Mac sem alterá-las.</p>


<p>Leia também: <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>, e <a href="/blog/recover-deleted-apple-notes" hrefLang="en">recuperação de notas apagadas</a>.</p>
  </LocalPostPage>;
}
