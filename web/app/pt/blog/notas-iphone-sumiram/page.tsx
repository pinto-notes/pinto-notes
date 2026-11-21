import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-sumiram");

// Brazilian Portuguese version of /blog/apple-notes-disappeared (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/102476 ("Se estiverem faltando algumas notas no iPhone": atualize todos os dispositivos, Ajustes >
// Apps > Notas > Contas de Notas, a pasta Apagadas, a pasta Lixo no app Mail, a barra Buscar com Todas as Contas, só o título
// das notas bloqueadas, ícone Voltar até a lista Pastas), support.apple.com/pt-br/121669 ("Se você não vir as notas do
// iCloud no app Notas": Sincronize este [Dispositivo], reiniciar, verificar os ajustes de novo), support.apple.com/pt-br/118582
// ("Apagar apps integrados da Apple": dados de usuário relacionados apagados, busque o nome exato na App Store, botão Baixar
// Novamente, abra na tela de Início); iPhone guide pages iph7262fd4fe (Contas de Notas; a conta No Meu iPhone só aparece no
// iPhone e entra nos backups do iCloud), iph904eee369 (Apagadas, 30 dias, passe o dedo para a esquerda e toque em Mover),
// iph92579feda (Ajustes > Apps > Notas: Conta Padrão para a Siri e o widget), ipha61270292 (pastas), iph87abad19a
// (Biblioteca de Apps: passe o dedo para a esquerda sobre todas as páginas, campo de busca, mantenha pressionado até os
// ícones tremerem), iph248b543ca (Remover App, dados no iCloud não são apagados); Mac guide pages not85d6f7b58 (Notas >
// Contas, desative a opção Notas: as notas da conta não ficam disponíveis), notc3b2d538b (sem notas atualizadas do iCloud
// não existe a pasta Apagadas), not5585d71a8 (arraste da pasta Apagadas para outra pasta; nota compartilhada apagada pelo
// dono some de todos os participantes; reabrir pelo link do convite), apd8b73d28be (Visualizar > Mostrar Barra Lateral;
// posicione o ponteiro sobre o nome da conta até o botão Mostrar aparecer); iCloud guide mm8685520792 (Ver tudo, Sincronizar
// este Mac, icloud.com/notes). Sincronizar este iPhone, Sincronizar este Mac and Conta Padrão follow
// notas-iphone-nao-sincroniza. Slug and title from Google autocomplete (pt-BR, 21 Nov): "notas do iphone sumiram", "notas do
// iphone sumiram como recuperar", "notas do iphone sumiram do nada", "todas as notas do iphone sumiram", "minhas notas
// sumiram do iphone o que fazer", "notas icloud sumiram", "app notas sumiu do iphone", "pastas notas iphone sumiram". Facts
// are the English post's; the pictures are its pictures, described in Portuguese.

const ui = UI.pt;

const FAQ = [
  { q: "Por que todas as minhas notas sumiram do iPhone?", a: [
    "A Apple diz que as notas que faltam podem ter sido apagadas sem querer, ou que um ajuste precisa mudar. Confira se o Notas está ativado no iCloud (Ajustes, seu nome, iCloud), olhe na pasta Apagadas e veja se o Notas está ativado em todas as outras contas, como Gmail ou Yahoo.",
  ] },
  { q: "Minhas notas sumiram depois de uma atualização. O que eu faço?", a: [
    "Os passos da Apple para notas que faltam começam com atualizar todos os aparelhos para a versão mais recente do iOS e do macOS. Depois, confira se o Notas continua ativado no iCloud e se você está com a mesma Conta Apple de antes. Se as notas ainda faltarem, a Apple manda reiniciar o iPhone e verificar o ajuste de novo.",
  ] },
  { q: "Como faço o app Notas voltar para o iPhone?", a: [
    "Passe o dedo para a esquerda depois da última página da tela de Início até a Biblioteca de Apps e busque Notas. Se ele estiver lá, mantenha pressionado para pôr de volta na tela de Início. Se ele foi apagado, abra a App Store, busque Notas e toque no botão Baixar Novamente.",
  ] },
  { q: "Apagar o app Notas apaga minhas notas?", a: [
    "A Apple diz que apagar um app integrado também apaga os dados relacionados naquele aparelho, mas os dados guardados no iCloud não são apagados quando você apaga o app. As notas do iCloud também ficam em icloud.com/notes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="notas-iphone-sumiram"
      intro={<>Suas notas estavam lá ontem, e agora a lista está vazia ou uma pasta sumiu. Para a própria Apple, notas que faltam ou foram apagadas sem querer, ou dependem de um ajuste que precisa mudar. Estas verificações passam pelas duas coisas, das mais rápidas para as mais demoradas.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#verificacoes", label: "As verificações, em ordem" },
          { href: "#no-mac", label: "No Mac" },
          { href: "#app-sumiu", label: "O app sumiu" },
          { href: "#pinto-notes", label: "Guarde uma segunda cópia" },
        ]}>
          <p>
            Primeiro confira se o Notas está ativado no iCloud, depois abra a pasta Apagadas, onde uma nota apagada espera por 30 dias.
            Em seguida, veja se o Notas está ativado nas suas outras contas, como o Gmail, e se todos os aparelhos estão com a mesma Conta
            Apple. Se o que sumiu foi o próprio app Notas, ele está na Biblioteca de Apps ou na App Store.
          </p>
          <PostCta slug="pt/notas-iphone-sumiram" path="/pt/blog/notas-iphone-sumiram" position="answer" ui={ui.cta}
            title="Quer cada versão das suas notas guardada?">
            <p>O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e guarda cada versão anterior de cada nota. No Mac, ele importa suas notas do app Notas uma vez, como uma segunda cópia, sem mudar nada lá.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="O app Notas no macOS 27 sem iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botões System Settings e Cancel."
        caption="O que o Notas mostra num Mac com o Notas desativado no iCloud (em português, Ative o iCloud). As notas continuam no iCloud; este Mac só não está mostrando." />}
      faq={FAQ}
    >
      <h2 id="verificacoes">As verificações, em ordem</h2>
      <p>
        O <a href="https://support.apple.com/pt-br/102476" rel="noopener">artigo da Apple sobre notas que faltam</a> começa com um passo
        antes de todos estes: atualize todos os aparelhos para a versão mais recente do iOS ou do macOS, para o problema não ser um
        software antigo. Depois, siga a lista.
      </p>
      <Steps>
        <li id="icloud-ativado">
          <strong>O Notas está ativado no iCloud</strong>{" "}
          Se as suas notas do iCloud não aparecem, a solução da Apple é conferir se Sincronizar este iPhone está ativado e depois olhar o
          app Notas. Se elas ainda não aparecerem, reinicie o iPhone e verifique o ajuste de novo. A Apple diz que as notas devem então
          aparecer e voltar a sincronizar, e que o que já tinha sido sincronizado com o iCloud aparece quando a sincronização terminar.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Seu nome", "iCloud", "Ver tudo", "Notas", "Sincronizar este iPhone"] },
            { on: "Mac, macOS 15 ou posterior", steps: ["Ajustes do Sistema", "Seu nome", "iCloud", "Notas", "Sincronizar este Mac"] },
          ]} />
        </li>
        <li id="apagadas">
          <strong>A pasta Apagadas</strong>{" "}
          Uma nota apagada vai para a pasta Apagadas no seu iPhone, no iCloud.com e nos outros aparelhos com a mesma Conta Apple, e fica
          lá por 30 dias. No iPhone, volte para a lista de pastas, toque em Apagadas, passe o dedo para a esquerda sobre a nota e toque em
          Mover. A pasta só aparece quando tem alguma coisa dentro. O guia <a href="/blog/recover-deleted-apple-notes" hrefLang="en">para
          recuperar notas apagadas</a> (em inglês) mostra todos os caminhos, inclusive depois dos 30 dias.
        </li>
        <li id="buscar">
          <strong>Busque com Todas as Contas selecionado</strong>{" "}
          Na lista de notas, toque na barra Buscar e digite uma palavra ou o título, com Todas as Contas selecionado. A busca só vê o
          título de uma nota bloqueada, então abra as notas bloqueadas uma por uma, com a senha, o Face ID ou o Touch ID. Se a busca não
          achar nada, toque no ícone Voltar até ver a lista Pastas e abra cada pasta: a nota pode estar numa que você não esperava.
        </li>
        <li id="outras-contas">
          <strong>O Notas está ativado no Gmail, no Yahoo e nas outras contas</strong>{" "}
          As notas guardadas numa conta de e-mail só aparecem enquanto o Notas estiver ativado nessa conta. Confira cada conta. As notas
          apagadas dessas contas não vão para a pasta Apagadas: procure na pasta Lixo dessa conta no app Mail e copie a nota para uma nota
          nova.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Apps", "Notas", "Contas de Notas", "A conta", "Notas"] },
            { on: "Mac", steps: ["Notas", "Contas", "A conta", "Notas"] },
          ]} />
        </li>
        <li id="mesma-conta">
          <strong>Todos os aparelhos usam a mesma Conta Apple</strong>{" "}
          A Apple diz que, num aparelho sem sessão iniciada na sua Conta Apple, você não consegue ver suas notas do iCloud. O nome no topo
          de Ajustes no iPhone, ou no topo da barra lateral de Ajustes do Sistema no Mac, é a conta que aquele aparelho usa. Para ver o
          que o iCloud guarda, entre em icloud.com/notes num navegador com a mesma conta.
        </li>
        <li id="no-meu-iphone">
          <strong>As notas ficaram num aparelho só</strong>{" "}
          As notas da conta No Meu iPhone só aparecem naquele iPhone, e as de Em Meu Mac só naquele Mac. Se uma nota falta no outro
          aparelho, olhe o título acima da pasta dela no aparelho onde ela está. <a href="/pt/blog/passar-notas-iphone-para-icloud">Passar
          as notas para o iCloud</a> põe todas em todos os aparelhos.
        </li>
        <li id="reiniciar">
          <strong>Reinicie e confira de novo</strong>{" "}
          Se as notas continuarem faltando depois dos ajustes acima, o próximo passo da Apple é reiniciar e verificar o ajuste do iCloud
          mais uma vez. Se as notas aparecem num aparelho e não no outro, veja <a href="/pt/blog/notas-iphone-nao-sincroniza">Notas do
          iPhone não sincroniza com o Mac</a>.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-recently-deleted" width={760} height={894} maxWidth={300}
        alt="A pasta Recently Deleted do Notas no iPhone com quatro notas, embaixo de uma linha dizendo que as notas apagadas são removidas depois de 30 dias e que a remoção definitiva do iCloud pode levar até mais 40 dias."
        caption="A pasta Apagadas no iPhone. Ela só aparece quando tem alguma nota. Imagem: Apple." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Os ajustes de uma conta do Gmail no iPhone, com as opções Mail, Contacts, Calendars e Notes, todas ativadas."
        caption="As notas de uma conta de e-mail só aparecem enquanto a opção Notas dela estiver ativada. Imagem: Apple." />

      <h2 id="no-mac">Notas ou pastas que faltam no Mac</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="A barra lateral do app Notas no macOS 27 só com a seção On My Mac: All on My Mac, Notes, uma pasta e Recently Deleted. Nenhuma seção iCloud."
        caption="Sem o título iCloud na barra lateral, este Mac não está mostrando suas notas do iCloud. Confira primeiro Sincronizar este Mac." />
      <ul>
        <li><strong>Sem barra lateral.</strong> Escolha Visualizar, Mostrar Barra Lateral.</li>
        <li><strong>Uma conta sem nenhuma pasta embaixo.</strong> Na barra lateral, deixe o ponteiro sobre o nome da conta até o botão Mostrar aparecer e clique nele.</li>
        <li><strong>Uma conta inteira faltando.</strong> Escolha Notas, Contas, selecione a conta e ative a opção Notas. A Apple diz que as notas de uma conta não ficam disponíveis enquanto o Notas estiver desativado nela.</li>
        <li><strong>Uma nota apagada.</strong> Clique em Apagadas e arraste a nota para outra pasta da barra lateral. Se as suas notas do iCloud não foram atualizadas, ou se a nota estava em outro tipo de conta, não existe pasta Apagadas, e a Apple diz que as notas apagadas são removidas de todos os aparelhos que usam aquela conta.</li>
        <li><strong>Uma nota compartilhada.</strong> Se o dono apagou uma nota que tinha compartilhado, a Apple diz que ela é apagada também dos aparelhos de todos os participantes. Se você apagou uma nota que alguém compartilhou com você, talvez consiga abrir de novo pelo link original, a menos que o dono tenha parado de compartilhar.</li>
      </ul>

      <h2 id="app-sumiu">Quando o que sumiu foi o app Notas</h2>
      <p>
        Um app removido da tela de Início não é apagado. Ele vai para a Biblioteca de Apps, e você continua podendo usar a partir de lá.
      </p>
      <Steps>
        <li>Na tela de Início, passe o dedo para a esquerda por todas as páginas até chegar à Biblioteca de Apps.</li>
        <li>Toque no campo de busca no topo e digite Notas.</li>
        <li>Para pôr de volta, mantenha o ícone pressionado até os ícones começarem a tremer e o app ir para a tela de Início, e então levante o dedo.</li>
      </Steps>
      <p>
        O Notas é um dos apps integrados que a Apple deixa apagar. Se ele não estiver na Biblioteca de Apps, abra a App Store, busque
        Notas pelo nome exato, toque no botão Baixar Novamente e abra o app na tela de Início quando terminar. A Apple diz que apagar um
        app integrado também apaga os dados relacionados no aparelho, mas os dados guardados no iCloud não são apagados junto com o app.
        As notas de No Meu iPhone entram nos backups do iPhone feitos no iCloud.
      </p>

      <h2 id="da-proxima-vez">Para não acontecer de novo</h2>
      <ul>
        <li>Escolha o iCloud como conta padrão em Ajustes, Apps, Notas, Conta Padrão. Ela decide para onde vão as notas criadas com a Siri e com o widget do Notas.</li>
        <li>Guarde uma cópia sua das notas que você não pode perder. O guia <a href="/blog/back-up-apple-notes" hrefLang="en">de backup do app Notas</a> (em inglês) tem uma rotina.</li>
      </ul>

      <h2 id="pinto-notes">Guarde uma segunda cópia, com todas as versões</h2>
      <p>
        A pasta Apagadas cobre uma nota que foi apagada. Ela não cobre uma nota que alguém mudou, porque o app Notas não guarda{" "}
        <a href="/blog/apple-notes-version-history" hrefLang="en">histórico de versões</a> (em inglês). O Pinto Notes, o app de notas
        para iPhone e Mac, guarda cada versão anterior de cada nota, então um parágrafo que sumiu de uma nota pode ser restaurado.
      </p>
      <p>
        Ele não traz de volta notas que já se perderam no app Notas. <a href="/blog/move-from-apple-notes" hrefLang="en">Importar do
        app Notas</a> (em inglês) leva uma importação no seu Mac e dá a você uma segunda cópia, sem mudar nada no app Notas. O app está
        em inglês.
      </p>
      <Figure shot={{ ...SHOTS.history, alt: "O histórico de versões de uma nota Groceries no Pinto Notes no Mac: versões feitas por você no iPhone e no Mac, pelo ChatGPT e pelo Claude Code, com as linhas que mudaram destacadas e um botão Restore This Version." }}
        caption="O histórico de versões no Pinto Notes no Mac: cada versão anterior, quem fez e Restore This Version." />
    </LocalPostPage>
  );
}
