import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-nao-sincroniza");

// Brazilian Portuguese version of /blog/apple-notes-not-syncing (language pilot, 17 Nov 2026). Apple's own pt-BR
// words, read 17 Nov: support.apple.com/pt-br/121669 ("Se você não vir as notas do iCloud no app Notas"),
// support.apple.com/pt-br/108922 (armazenamento do iCloud), support.apple.com/pt-br/102462 ("Se você não
// conseguir colaborar no app Notas": Compartilhar Link, Enviar Cópia, "Pessoas que você escolher podem editar"),
// support.apple.com/pt-br/guide/icloud/mm8685520792/icloud ("Configure o Notas do iCloud em todos os seus
// dispositivos": Ver tudo, Salvo no iCloud, Ajustes do Sistema), the Mac guide's "notas atualizadas do iCloud"
// (botão Atualizar, OS X 10.11, iOS 9) and apple.com/br/support/systemstatus ("Status do sistema", service
// "Notas do iCloud"). Apple's pages name the switch "Sincronizar este [dispositivo]" and also "Sincronize este" or
// "Sincronização neste Mac"; the post uses Sincronizar este iPhone and Sincronizar este Mac. The Mac app's own
// messages (recursos incompatíveis, the owner's full storage, "Melhore a segurança da sua conta", Ative o iCloud,
// Conta padrão, Em Meu Mac, Apagadas) are the pt_BR strings in Notes on macOS 27.2. Slug and title from Google
// autocomplete (pt-BR): "notas iphone não sincroniza", "notas nao sincroniza icloud", "como sincronizar notas do
// mac com iphone". Facts are the English post's; its SyncChooser is English-only and left out.

const ui = UI.pt;

const FAQ = [
  { q: "Por que minhas notas não sincronizam entre o iPhone e o Mac?", a: [
    "Na maioria das vezes, o Notas está desativado no iCloud num dos aparelhos, ou os dois estão com Contas Apple diferentes. Notas guardadas em No Meu iPhone ou no Gmail nunca sincronizam pelo iCloud, e um armazenamento do iCloud cheio também para a sincronização. A solução da própria Apple é verificar a opção Sincronizar este iPhone nos ajustes do iCloud e reiniciar o aparelho se as notas continuarem faltando.",
  ] },
  { q: "Como forçar o Notas a sincronizar?", a: [
    "A Apple não documenta um botão que force a sincronização. O que a Apple sugere é verificar se o Notas está ativado no iCloud e reiniciar o aparelho. Abrir icloud.com/notes num navegador mostra se a nota chegou ao iCloud.",
  ] },
  { q: "As notas em No Meu iPhone sincronizam com o Mac?", a: [
    "Não. No Meu iPhone é para notas que ficam só naquele iPhone, e Em Meu Mac é a mesma coisa no Mac. Passe as notas para uma pasta do iCloud e elas aparecem em todos os aparelhos com a mesma Conta Apple.",
  ] },
  { q: "Por que uma nota compartilhada não atualiza?", a: [
    "Verifique se todo mundo está com a Conta Apple e com o Notas ativado no iCloud, e se a nota não está bloqueada, porque notas bloqueadas não podem ser compartilhadas. Se o armazenamento do iCloud do dono estiver cheio, o Notas guarda as suas alterações no seu aparelho e envia quando o dono liberar espaço.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="notas-iphone-nao-sincroniza"
      intro={<>Uma nota que você escreveu no iPhone não aparece no Mac, ou o contrário. Uma olhada no icloud.com mostra qual dos dois aparelhos precisa de conserto.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#quais-sincronizam", label: "Quais notas sincronizam" },
          { href: "#verificacoes", label: "As verificações, em ordem" },
          { href: "#compartilhadas", label: "Notas compartilhadas" },
          { href: "#sumiram", label: "Se as notas sumiram" },
        ]}>
          <p>
            O app Notas sincroniza pelo iCloud. Uma nota só chega ao outro aparelho se estiver embaixo do título iCloud e se os dois
            aparelhos estiverem com a mesma Conta Apple e com o Notas ativado no iCloud. Confira essas três coisas primeiro. Depois vêm o
            armazenamento do iCloud cheio e um Mac com um macOS mais antigo que o iOS do iPhone.
          </p>
          <PostCta slug="pt/notas-iphone-nao-sincroniza" path="/pt/blog/notas-iphone-nao-sincroniza" position="answer" ui={ui.cta}
            title="Quer um app de notas que mostra quando sincronizou?">
            <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac e mostra quando sincronizou pela última vez. Ele importa suas notas do app Notas em um passo, sem mudar nada lá.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/notes-same-note-three-devices" width={814} height={412} maxWidth={600}
        alt="A mesma nota escrita à mão, Urban planner, aberta no Notas num MacBook, num tablet e num iPhone ao mesmo tempo."
        caption="Como deveria ser: uma nota, igual em todos os aparelhos. Imagem: Apple." />}
      faq={FAQ}
    >
      <h2 id="quais-sincronizam">Quais notas sincronizam, e para onde</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="A barra lateral do app Notas no macOS 27 só com a seção On My Mac: All on My Mac, Notes, uma pasta e Recently Deleted. Nenhuma seção iCloud."
        caption="Se as suas notas estão em Em Meu Mac (ou em No Meu iPhone, no celular), elas nunca saem daquele aparelho. É a primeira coisa a procurar." />
      <p>
        O Notas agrupa as pastas por conta, e o título embaixo do qual a nota está decide para onde ela vai. Notas novas vão para a conta
        padrão: no Mac é Conta padrão em Notas, Ajustes, e no iPhone é Conta Padrão em Ajustes, Apps, Notas. Escolha o iCloud, senão a
        próxima nota que a Siri criar pode cair no lugar errado de novo.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">A nota está em</th><th scope="col">Chega aos outros aparelhos?</th><th scope="col">Bom saber</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">iCloud</th><td>Sim</td><td>Em todo aparelho com a mesma Conta Apple e o Notas ativado no iCloud</td></tr>
            <tr><th scope="row">No Meu iPhone</th><td>Não</td><td>Fica naquele iPhone. <a href="/pt/blog/passar-notas-iphone-para-icloud">Passe para uma pasta do iCloud</a></td></tr>
            <tr><th scope="row">Em Meu Mac</th><td>Não</td><td>Fica naquele Mac</td></tr>
            <tr><th scope="row">Gmail ou outra conta de e-mail</th><td>Só por essa conta de e-mail</td><td>Nunca passa pelo iCloud</td></tr>
            <tr><th scope="row">Uma nota compartilhada com você</th><td>Sim</td><td>Fica no iCloud do dono, então conta o armazenamento do dono</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="verificacoes">As verificações, em ordem</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="O app Notas no macOS 27 sem iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botões System Settings e Cancel."
        caption="O que o Notas mostra num Mac com o iCloud desativado para o Notas (em português, Ative o iCloud). Não há status de sincronização em nenhum outro lugar do Notas no macOS 27; eu procurei." />
      <Steps>
        <li id="icloud-ativado">
          <strong>O Notas está ativado no iCloud, nos dois aparelhos</strong>
          A opção se chama Sincronizar este iPhone ou Sincronizar este Mac. A Apple diz que, se as notas continuarem faltando depois de
          ativar, você deve reiniciar o aparelho e verificar o ajuste de novo.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Seu nome", "iCloud", "Ver tudo", "Notas"] },
            { on: "iPhone, iOS 26", steps: ["Ajustes", "Seu nome", "iCloud", "Notas"] },
            { on: "Mac, macOS 15 ou posterior", steps: ["Ajustes do Sistema", "Seu nome", "iCloud", "Notas"] },
          ]} />
        </li>
        <li id="mesma-conta">
          <strong>Os dois aparelhos usam a mesma Conta Apple</strong>
          O nome no topo de Ajustes no iPhone, e no topo de Ajustes do Sistema no Mac, é a conta com que aquele aparelho sincroniza. Um
          Mac do trabalho com a Conta Apple da empresa não vai mostrar as notas do seu iPhone pessoal.
        </li>
        <li id="icloud-tem">
          <strong>O iCloud tem a nota</strong>
          Abra icloud.com/notes num navegador e entre com a mesma Conta Apple. Se a nota estiver lá, o problema é no aparelho onde ela
          falta. Se não estiver, o aparelho onde você escreveu ainda não enviou a nota, então comece por ele.
        </li>
        <li id="status">
          <strong>As Notas do iCloud estão funcionando</strong>
          A Apple lista as Notas do iCloud na página Status do sistema, em apple.com/br/support/systemstatus. Se aparecer uma falha,
          nenhum ajuste do seu lado vai resolver. Espere até a Apple marcar como resolvido.
        </li>
        <li id="armazenamento">
          <strong>O armazenamento do iCloud não está cheio</strong>
          A Apple diz que, quando o armazenamento do iCloud fica cheio, os apps do iCloud deixam de ficar atualizados nos seus
          aparelhos, e o Notas é um deles. Abra Ajustes, toque no seu nome e depois em iCloud para ver quanto você está usando. Liberar
          espaço ou mudar para um plano maior deixa a sincronização continuar.
        </li>
        <li id="atualizacao">
          <strong>Nenhum aparelho está com atualização atrasada</strong>
          Uma nota feita numa versão mais nova do Notas pode usar recursos que uma versão mais antiga não tem. No Mac, o Notas mostra
          essa nota com a mensagem &ldquo;Esta nota usa recursos incompatíveis. Para visualizá-la ou editá-la, atualize para a versão
          mais recente do macOS.&rdquo; A nota sincronizou, mas este Mac não consegue abrir. Desde que o iOS 27 saiu, em 14 de
          setembro, um iPhone com iOS 27 e um Mac ainda no macOS 26 é o caso mais provável, e atualizar o Mac para o macOS 27 resolve.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="A tela do iCloud nos Ajustes do iPhone: armazenamento em 4,1 de 50 GB e, em Saved to iCloud, Photos, Drive, Passwords, Notes com 29 itens, Messages e Mail."
        caption="Ajustes, seu nome, iCloud: quanto do armazenamento está ocupado e o que o Notas guarda lá. Imagem: Apple." />
      <p>
        A Apple não documenta um botão que force a sincronização, então não há nada para apertar. Para aparelhos bem mais antigos, o guia
        da Apple para o Mac diz que as notas atualizadas do iCloud não abrem em versões anteriores ao OS X 10.11 ou ao iOS 9, e que a
        barra lateral do Notas mostra um botão Atualizar ao lado do iCloud até você atualizar.
      </p>

      <h2 id="compartilhadas">Quando uma nota compartilhada não atualiza</h2>
      <PostFigure src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Dois ícones de notas desenhados, cada um com uma pessoa em cima, ligados por uma linha pontilhada com um sinal de pausa no meio."
        caption="Uma nota compartilhada espera quando um dos lados não consegue sincronizar." />
      <ul>
        <li>Todo mundo precisa estar com uma Conta Apple e com o Notas ativado no iCloud. O guia da Apple sobre colaborar no Notas também pede a versão mais recente do iOS.</li>
        <li>Não dá para colaborar numa nota bloqueada, nem numa pasta que tenha uma.</li>
        <li>Uma nota compartilhada fica no iCloud do dono. Quando o armazenamento do dono está cheio, o Notas no Mac diz que as suas alterações não puderam ser enviadas, estão salvas neste dispositivo e serão enviadas quando o proprietário criar espaço.</li>
        <li>Se o Notas pedir &ldquo;Melhore a segurança da sua conta para ver as edições em tempo real e usar os recursos de colaboração mais recentes&rdquo;, as edições dos outros não aparecem ao vivo até você fazer isso.</li>
      </ul>
      <p>
        No iOS 27, o compartilhamento mudou de lugar: toque no botão Compartilhar, depois em Compartilhar Link ou Enviar Cópia, e escolha
        quem pode editar em Pessoas que você escolher podem editar.
      </p>

      <h2 id="sumiram">Se as notas sumiram de todos os aparelhos</h2>
      <PostFigure src="/blog/macos27/notes-recently-deleted-window" width={1520} height={1003} maxWidth={560}
        alt="O app Notas no macOS 27 aberto em Recently Deleted com duas notas, Fresh pasta dough e Gift ideas, embaixo de uma linha dizendo que as notas apagadas são removidas dos seus dispositivos depois de 30 dias."
        caption="Uma nota apagada em qualquer aparelho espera aqui por 30 dias (em português, a pasta se chama Apagadas)." />
      <p>
        Apagar uma nota num aparelho apaga em todos, o que pode parecer um problema de sincronização. As notas apagadas ficam na pasta
        Apagadas por 30 dias em todos os aparelhos com a mesma Conta Apple. Guardar uma cópia sua também ajuda.
      </p>

      <h2 id="pinto-notes">Um app de notas que mostra a sincronização</h2>
      <PostFigure src="/blog/drawn/sync-ok" width={1200} height={750} maxWidth={560}
        alt="Uma nuvem branca desenhada com um visto verde e um pequeno relógio ao lado."
        caption="O Pinto Notes mostra quando sincronizou pela última vez e, quando não consegue, por quê." />
      <p>
        O app Notas não mostra quando sincronizou pela última vez, e é por isso que são necessárias seis verificações. O Pinto Notes, o
        app de notas para iPhone e Mac que eu faço, sincroniza pelo próprio serviço criptografado em vez do iCloud, então o armazenamento
        do iCloud não afeta. Os Ajustes dele mostram o status da sincronização, como &ldquo;last synced 9:41&rdquo; ou o motivo de não
        conseguir sincronizar agora, ao lado de um botão Sync Now. Se a mesma nota mudou em dois aparelhos antes de eles sincronizarem, a
        edição mais nova vence e a outra fica guardada como uma cópia em conflito, então nenhuma se perde.
      </p>
      <p>
        Ele não conserta o app Notas para você, e não tem versão para Windows, Android ou web. O app está em inglês. Mudar do Notas leva
        uma importação no seu Mac e deixa o app Notas como estava.
      </p>
    </LocalPostPage>
  );
}
