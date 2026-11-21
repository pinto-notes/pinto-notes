import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "nao-consigo-colaborar-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-unable-to-start-collaboration (21 Nov 2026). Apple's own pt-BR words,
// read 21 Nov: support.apple.com/pt-br/102462 ("Se você não conseguir colaborar no app Notas", published 13 Nov 2026: a
// versão mais recente do iOS, Salvo no iCloud, "Sincronizar este [dispositivo]", a pasta Todos do iCloud, o botão
// Compartilhar, Compartilhar Link ou Enviar Cópia no iOS 27, "Pessoas que você escolher podem editar", o botão Colaborar,
// Gerenciar Nota Compartilhada, Adicionar Participante, Colaborar no iOS 18 a 26, "Apenas pessoas convidadas podem editar",
// Mensagens ou Mail, solicitação pendente, nota bloqueada, iOS 26 ou anterior só com aparelhos Apple, 100 pessoas);
// iPhone guide iphe4d04f674 ("Compartilhe notas e colabore no iPhone": Conta Apple e Notas ativado no iCloud, "Pessoas
// escolhidas" ou "Pessoas com o link", Editar ou Apenas Ver e Baixar, o e-mail para o dono, Parar de compartilhar apaga a nota
// dos outros participantes) and iphf177bb154 (Bloqueie notas: toque em [the note's menu] e toque em Remover; notas
// compartilhadas no iCloud não podem ser bloqueadas); Mac guide apd4e6e2c9a6 ("Compartilhe notas e colabore no app Notas do
// Mac": notas atualizadas do iCloud, "Compartilhar um Link", Compartilhar Pasta, "Pode editar" ou "Pode ver e baixar", clique
// no link e clique em Abrir, o endereço do convite precisa estar na sua Conta Apple, autenticação de dois fatores e Chaves do
// iCloud para ver as alterações na hora), apd881ec5518 (Parar Compartilhamento), glosedbd72f8 ("Notas atualizadas do iCloud":
// o botão Atualizar, não poderá adicionar pessoas a notas, OS X 10.11, iOS 9), apd5be85b5ce (etiqueta, menção ou link: iOS
// 14.5, macOS 11.3); Mac User Guide mchl267b6234 ("Enviar Link de Verificação"); iCloud guide mmc0cd6c83 (os participantes
// precisam de uma Conta Apple) and mmf181271571 (Aceitar Convite, peça ao proprietário para reenviar o convite). Apple's
// pt-BR iPhone pages give the lock menu button no name, so the post says "o menu da nota". The Mac app's messages (Ative o
// iCloud, the owner's full storage) follow notas-iphone-nao-sincroniza. Apple documents no pt-BR wording for "Unable to start
// collaboration", and macOS 27.2's Notes has no such string, so the post quotes the English and describes it in Portuguese.
// Slug and title from Google autocomplete (pt-BR, 21 Nov): "não consigo compartilhar notas no iphone", "erro ao compartilhar
// notas iphone", "colaborar notas iphone", "notas iphone colaborar", "nota compartilhada iphone nao atualiza"; nothing for
// "não foi possível iniciar a colaboração". The Pinto app's own labels (Share, Collaborate, Invite People, Join by Link, Can
// edit, Off) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

const FAQ = [
  { q: "O que quer dizer \"Unable to start collaboration\" no app Notas?", a: [
    "A Apple não explica essa mensagem. O artigo dela sobre problemas de colaboração lista o que verificar: as duas pessoas com o iOS mais recente, com sessão iniciada numa Conta Apple e com o Notas ativado no iCloud, a nota no iCloud e sem bloqueio, e menos de 100 pessoas nela.",
  ] },
  { q: "Por que não aparece a opção Colaborar no Notas do iOS 27?", a: [
    "No iOS 27 ela se chama Compartilhar Link. Toque no botão Compartilhar, depois no menu abaixo do título da nota, e escolha Compartilhar Link. A opção Colaborar é o que o iOS 18 ao iOS 26 mostram no mesmo lugar.",
  ] },
  { q: "Dá para colaborar numa nota com alguém que não tem iPhone?", a: [
    "A Apple diz que os participantes precisam de uma Conta Apple para ver e editar uma nota compartilhada. No iOS 26 ou anterior, a colaboração só funciona com alguém que tenha um aparelho Apple com sessão iniciada numa Conta Apple. Fora isso, envie uma cópia da nota por e-mail ou mensagem.",
  ] },
  { q: "Por que não consigo abrir uma nota que compartilharam comigo?", a: [
    "Na maioria das vezes, o convite foi para um e-mail ou número de telefone que não está na sua Conta Apple. Adicione esse endereço à sua conta quando o Notas pedir, ou peça ao dono para reenviar o convite para o endereço que a sua Conta Apple usa.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="nao-consigo-colaborar-notas-iphone"
      intro={<>Você toca em Compartilhar numa nota e o Notas diz que não dá para iniciar a colaboração (num iPhone em inglês, &ldquo;Unable to start collaboration&rdquo;), ou a opção Colaborar nem aparece. Aqui estão as verificações da Apple, da causa mais provável para a menos provável.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#verificacoes", label: "As verificações, em ordem" },
          { href: "#iphone", label: "Comece no iPhone" },
          { href: "#mac", label: "Comece no Mac" },
          { href: "#nao-abre", label: "Uma nota compartilhada não abre" },
        ]}>
          <p>
            Colaborar no app Notas exige uma nota no iCloud sem bloqueio, e todo mundo com sessão iniciada numa Conta Apple e com o Notas
            ativado no iCloud. A Apple também pede que as duas pessoas estejam com o iOS mais recente. No iOS 27 a opção se chama
            Compartilhar Link, então, se você está procurando Colaborar, é essa.
          </p>
          <PostCta slug="pt/nao-consigo-colaborar-notas-iphone" path="/pt/blog/nao-consigo-colaborar-notas-iphone" position="answer" ui={ui.cta}
            title="Quer compartilhar uma nota com um link só?">
            <p>O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac. Envie o link de uma nota, e as pessoas que você convidar escrevem nela com você, com o cursor de cada uma aparecendo enquanto digita. As notas compartilhadas são criptografadas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Dois ícones de notas desenhados, cada um com uma pessoa em cima, ligados por uma linha pontilhada com um sinal de pausa no meio."
        caption="Uma nota compartilhada precisa das mesmas poucas coisas dos dois lados antes de começar." />}
      faq={FAQ}
    >
      <h2 id="verificacoes">As verificações, em ordem</h2>
      <p>
        A Apple não documenta a mensagem &ldquo;Unable to start collaboration&rdquo;, então ninguém consegue dizer, só pela mensagem, qual
        verificação falhou. Estes são os requisitos que a Apple lista, na ordem em que vale a pena testar.
      </p>
      <Steps>
        <li id="opcao-certa">
          <strong>Você está escolhendo a opção certa</strong>{" "}
          No iOS 27, toque no botão Compartilhar, depois no menu abaixo do título da nota, e escolha Compartilhar Link. Enviar Cópia manda
          uma cópia que mais ninguém pode editar. No iOS 18 ao iOS 26, o mesmo menu mostra Colaborar ou Enviar Cópia.
        </li>
        <li id="no-icloud">
          <strong>A nota está no iCloud</strong>{" "}
          Os passos da Apple começam na pasta Todos do iCloud, e o guia da Apple para o Mac diz que você precisa usar as notas atualizadas
          do iCloud para colaborar. Uma nota em No Meu iPhone, em Em Meu Mac ou numa conta do Gmail não está no iCloud.{" "}
          <a href="/pt/blog/passar-notas-iphone-para-icloud">Passe a nota para uma pasta do iCloud</a> primeiro.
        </li>
        <li id="bloqueada">
          <strong>A nota não está bloqueada</strong>{" "}
          Não dá para colaborar numa nota bloqueada, nem numa pasta que tenha uma nota bloqueada. Abra a nota e desbloqueie com a senha, o
          Face ID ou o Touch ID, depois abra o menu da nota e toque em Remover.
        </li>
        <li id="icloud-ativado">
          <strong>Você está com a sessão iniciada e o Notas ativado no iCloud</strong>{" "}
          Abra Ajustes, toque no seu nome e depois em iCloud. Em Salvo no iCloud, toque em Notas e confira se Sincronizar este iPhone está
          ativado. A Apple diz que as pessoas que você convidar também precisam disso.
        </li>
        <li id="atualizar">
          <strong>Os dois estão com o iOS mais recente</strong>{" "}
          A Apple pede a versão mais recente do iOS no seu iPhone e no da outra pessoa. Os passos de Colaborar para o iOS 26 e anteriores
          exigem o iOS 18 ou posterior.
        </li>
        <li id="outra-pessoa">
          <strong>A outra pessoa tem uma Conta Apple</strong>{" "}
          Os participantes precisam de uma Conta Apple para ver e editar uma nota compartilhada. No iOS 26 ou anterior, a Apple diz que você
          só pode colaborar com alguém que tenha um aparelho Apple com sessão iniciada numa Conta Apple. Se não for o caso, envie uma cópia.
        </li>
        <li id="pendente">
          <strong>Seu pedido não está esperando</strong>{" "}
          Se você pediu acesso à nota de alguém no iOS 27, o pedido pode estar pendente. O dono vê o pedido no botão Colaborar, e a Apple
          diz que o pedido também manda um e-mail para o endereço da Conta Apple do dono.
        </li>
        <li id="limite">
          <strong>A nota tem espaço</strong>{" "}
          Até 100 pessoas podem colaborar numa nota.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="O menu More de uma nota desbloqueada no Notas do iPhone, com Remove destacado no topo, ao lado de Scan e Pin Note."
        caption="Remover tira o bloqueio de uma nota desbloqueada, para ela poder ser compartilhada. Imagem: Apple." />
      <p>
        O guia da Apple para o iPhone também diz que notas compartilhadas no iCloud não podem ser bloqueadas, então não dá para bloquear de
        novo enquanto ela estiver compartilhada.
      </p>

      <h2 id="iphone">Comece a colaborar no iPhone</h2>
      <p className="label" id="iphone-ios-27"><strong>iOS 27</strong></p>
      <Steps>
        <li>No Notas, vá até a pasta Todos do iCloud e abra a nota.</li>
        <li>Toque no botão Compartilhar no topo da tela.</li>
        <li>Abaixo do título da nota, escolha Compartilhar Link.</li>
        <li>Para mudar quem pode entrar, toque em &ldquo;Pessoas que você escolher podem editar&rdquo;. Escolha Pessoas escolhidas ou Pessoas com o link, e Editar ou Apenas Ver e Baixar.</li>
        <li>Escolha como enviar o convite. A primeira pessoa entra automaticamente. Para adicionar mais, toque no botão Colaborar, depois em Gerenciar Nota Compartilhada e depois em Adicionar Participante.</li>
      </Steps>
      <p className="label" id="iphone-ios-26"><strong>iOS 18 ao iOS 26</strong></p>
      <Steps>
        <li>No Notas, vá até a pasta Todos do iCloud e abra a nota.</li>
        <li>Toque no botão Compartilhar e escolha Colaborar abaixo do título da nota.</li>
        <li>Toque em &ldquo;Apenas pessoas convidadas podem editar&rdquo; para definir quem pode acessar, o que pode fazer e se pode convidar outras pessoas.</li>
        <li>Envie o convite pelo Mensagens ou pelo Mail.</li>
      </Steps>
      <p>
        Os passos são do artigo da Apple <a href="https://support.apple.com/pt-br/102462" rel="noopener">Se você não conseguir colaborar no
        app Notas</a> e da página <a href="https://support.apple.com/pt-br/guide/iphone/iphe4d04f674/ios" rel="noopener">Compartilhe notas e
        colabore no iPhone</a> do manual do iPhone.
      </p>

      <h2 id="mac">Comece a colaborar no Mac</h2>
      <Steps>
        <li>Abra a nota e clique no botão Compartilhar na barra de ferramentas.</li>
        <li>Clique no menu pop-up e escolha Compartilhar um Link.</li>
        <li>Clique em &ldquo;As pessoas que você escolher podem editar&rdquo; para definir quem pode acessar, e Pode editar ou Pode ver e baixar.</li>
        <li>Envie o link como preferir. Para compartilhar uma pasta inteira, clique nela com a tecla Control pressionada e escolha Compartilhar Pasta.</li>
      </Steps>
      <p>
        Se houver um botão Atualizar ao lado do iCloud na barra lateral do Notas, suas notas do iCloud ainda não foram atualizadas, e a
        Apple diz que você não pode adicionar pessoas a notas até atualizar. As notas atualizadas não abrem em aparelhos com versões
        anteriores ao OS X 10.11 ou ao iOS 9.
      </p>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="O app Notas no macOS 27 sem iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botões System Settings e Cancel."
        caption="O que o Notas mostra num Mac com o iCloud desativado para o Notas (em português, Ative o iCloud). Ative antes de compartilhar." />
      <Paths rows={[
        { on: "Mac, macOS 15 ou posterior", steps: ["Ajustes do Sistema", "Seu nome", "iCloud", "Notas"] },
      ]} />

      <h2 id="nao-abre">Quando você não consegue abrir uma nota compartilhada com você</h2>
      <ul>
        <li><strong>Abra pelo link.</strong> No Mac, clique no link que você recebeu e depois em Abrir. Em icloud.com/notes, selecione o link e depois Aceitar Convite. Depois da primeira vez, a nota fica na sua lista de notas em todo iPhone e Mac com a mesma Conta Apple.</li>
        <li><strong>Confira o endereço para onde o convite foi.</strong> Você só consegue abrir uma nota compartilhada se o e-mail ou o número de telefone que recebeu o convite estiver na sua Conta Apple. O Notas pede para você adicionar, e no Mac os Ajustes do Sistema mandam antes um link de verificação para ele. Ou peça ao dono para reenviar o convite para o endereço que você usa.</li>
        <li><strong>Atualize o aparelho.</strong> Uma nota com uma etiqueta, uma menção ou um link que mostra o título de outra nota só pode ser vista no iOS 14.5, no macOS 11.3 ou posterior. Nos aparelhos mais antigos ela fica oculta, para você e para todo mundo com quem ela é compartilhada.</li>
        <li><strong>Pergunte ao dono.</strong> Quando o dono para de compartilhar, a Apple diz que a nota é apagada dos aparelhos das outras pessoas.</li>
      </ul>

      <h2 id="nao-atualiza">Quando ela abre mas não atualiza</h2>
      <p>
        O guia da Apple para o Mac diz que quem tem a autenticação de dois fatores e as Chaves do iCloud ativadas vê as alterações dos
        outros na hora. Uma nota compartilhada fica no iCloud do dono, então, quando o armazenamento do dono está cheio, o Notas no Mac diz
        que as suas alterações estão salvas no seu aparelho e serão enviadas quando o dono liberar espaço.{" "}
        <a href="/pt/blog/notas-iphone-nao-sincroniza">Notas do iPhone não sincroniza com o Mac</a> tem o resto das verificações de
        sincronização.
      </p>

      <h2 id="pinto-notes">Compartilhar uma nota no Pinto Notes</h2>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="A tela Share do Pinto Notes no iPhone: o dono, Sara, que pode editar, e Jonas, que pode ver, um botão Invite People e Join by Link em Can edit."
        caption="Share e depois Collaborate, no Pinto Notes no iPhone." />
      <p>
        O Pinto Notes, um app de notas com a cara do app Notas e que funciona como ele no iPhone e no Mac, compartilha uma nota com um link.
        No iPhone, toque em Share, depois em Collaborate e depois em Invite People, e envie o link como quiser. Join by Link define se o link
        deixa as pessoas editar ou só ver, e Off quer dizer que só quem já está na nota consegue abrir. O cursor de cada pessoa aparece na
        nota com o nome dela enquanto ela digita, e a nota é criptografada com uma chave só dela. Se alguém na nota tiver{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectado o ChatGPT ou o Claude</a> (em inglês), a IA dessa pessoa
        também pode escrever nela, marcada com o nome de quem é a IA.
      </p>
      <p>
        Ele tem os próprios limites. Todo mundo escreve pelo Pinto Notes no iPhone ou no Mac; quem abre o link sem ter o app recebe as
        instruções para baixar e entrar. Uma nota com arquivos, fotos ou um app dentro ainda não pode ser compartilhada, e uma nota
        compartilhada não pode ser bloqueada. O guia <a href="/blog/share-a-note-and-edit-it-together" hrefLang="en">para compartilhar uma
        nota e editar junto</a> (em inglês) tem os detalhes. Suas notas do app Notas vêm numa importação só no seu Mac{" "}
        (<a href="/blog/move-from-apple-notes" hrefLang="en">mudar do app Notas</a>, em inglês), e o app Notas não muda. O app está em
        inglês.
      </p>
    </LocalPostPage>
  );
}
