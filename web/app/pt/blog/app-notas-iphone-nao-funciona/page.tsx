import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "app-notas-iphone-nao-funciona");

// Brazilian Portuguese version of /blog/apple-notes-not-working (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/119876 (about an iPhone app that "encerrar inesperadamente, parar de responder ou não abrir",
// published 31 Mar 2026: fechar e abrir o app novamente, reiniciar, o ícone do seu perfil na App Store e Atualizações de Apps,
// atualizar o software, apagar o app e baixar de novo), iPhone guide iph83bfec492 ("Encerre e reabra um app": Seletor de
// Apps, passe o dedo para cima no app, a Tela de Início ou a Biblioteca de Apps) and iph8903c3ee6 ("Force a reinicialização
// do iPhone": aumentar volume, diminuir volume, botão lateral, logotipo da Apple), support.apple.com/pt-br/118575
// ("Atualizar o iPhone", title shortened, published 15 Sep 2026: backup, alimentação, Wi-Fi, Ajustes > Geral > Atualização de
// Software), support.apple.com/pt-br/118582 ("Apagar apps integrados da Apple", published 23 Jun 2026: Notes is on the list,
// os dados de usuário relacionados são apagados, o nome exato na App Store, o botão Baixar Novamente), Mac guide
// support.apple.com/pt-br/guide/mac-help/mchlp2579/mac ("Se um app parar ou se encerrar inesperadamente no Mac": menu Apple >
// Forçar Encerrar, alterações não salvas, Reabrir, menu Apple > Reiniciar, abrir outro documento, desconectar periféricos,
// desinstalar plug-ins ou melhorias de outros fabricantes), support.apple.com/pt-br/102586 (Command + Q, Option + Command +
// Esc, o botão liga/desliga por até dez segundos), support.apple.com/pt-br/108382 ("Atualizar o macOS no Mac", published 14
// Sep 2026: backup primeiro, sem Repouso e sem fechar a tampa; as atualizações incluem apps como o Notas),
// support.apple.com/pt-br/116946 ("Inicializar o Mac no modo seguro": software que carrega quando o Mac é inicializado; Apple
// names no apps) and support.apple.com/pt-br/121669 (Sincronize este [Dispositivo], reiniciar, verificar de novo). From
// notas-iphone-nao-sincroniza: the iOS 27 and Mac iCloud paths, Sincronizar este iPhone or Mac, icloud.com/notes, "Status do
// sistema" at apple.com/br/support/systemstatus with Notas do iCloud, the Mac's "Esta nota usa recursos incompatíveis"
// message (pt_BR string in Notes on macOS 27.2) and Apagadas with its 30 days. Slug and title from Google autocomplete (pt-BR,
// 21 Nov): "app notas iphone nao funciona", "notas do iphone nao abre", "app notas iphone nao abre", "app notas nao abre no
// mac", "app notas travado", "notas iphone travando"; nothing for "notas iphone fecha sozinho". Facts are the English post's.

const ui = UI.pt;

const FAQ = [
  { q: "Por que o app Notas fica travando?", a: [
    "A Apple não documenta uma causa específica do Notas. Os passos dela são os de qualquer app: fechar e abrir de novo, reiniciar o aparelho e depois atualizar o software. No Mac, a Apple também sugere desconectar um aparelho que você acabou de ligar e remover plug-ins de outros fabricantes.",
  ] },
  { q: "Apagar o app Notas apaga minhas notas?", a: [
    "A Apple diz que apagar um app integrado também apaga os dados de usuário relacionados naquele aparelho. As notas do iCloud também ficam em icloud.com/notes, então confira lá antes. As notas em No Meu iPhone só existem naquele celular, então não apague o app enquanto tiver notas lá.",
  ] },
  { q: "Como forçar o encerramento do Notas no Mac?", a: [
    "Pressione Option + Command + Esc, ou escolha Forçar Encerrar no menu Apple, selecione o Notas e clique em Forçar Encerrar. A Apple avisa que você pode perder alterações não salvas.",
  ] },
  { q: "Por que uma nota não abre no Mac depois que atualizei o iPhone?", a: [
    "Uma nota feita numa versão mais nova do Notas pode usar recursos que uma versão mais antiga não tem. O Mac então diz que a nota usa recursos incompatíveis e pede para você atualizar para a versão mais recente do macOS. Atualizar o Mac faz a nota abrir.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="app-notas-iphone-nao-funciona"
      intro={<>O Notas trava, fecha sozinho ou nem abre. Aqui estão os passos da própria Apple, na ordem em que a Apple dá, para o iPhone e para o Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "No iPhone" },
          { href: "#mac", label: "No Mac" },
          { href: "#notas-nao-carregam", label: "As notas não carregam" },
          { href: "#depois-da-atualizacao", label: "Depois de uma atualização" },
        ]}>
          <p>
            Feche o Notas e abra de novo, depois reinicie o aparelho. Se ele continuar travando ou fechando, atualize o iOS ou o macOS.
            Esses são os passos da Apple para qualquer app que para de responder. Se o Notas abre mas as suas notas não aparecem, confira
            se o Notas está ativado no iCloud naquele aparelho.
          </p>
          <PostCta slug="pt/app-notas-iphone-nao-funciona" path="/pt/blog/app-notas-iphone-nao-funciona" position="answer" ui={ui.cta}
            title="Quer uma segunda cópia das suas notas?">
            <p>O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac. Ele importa suas notas do app Notas uma vez no Mac, como uma cópia, sem mudar nada lá. Cada versão anterior de uma nota fica guardada.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="seguras">Primeiro, confira se as suas notas estão seguras</h2>
      <p>
        Antes de tentar qualquer coisa maior que reiniciar, abra icloud.com/notes num navegador e entre com a sua Conta Apple. Se as suas
        notas estiverem lá, elas estão guardadas no iCloud, não importa o que o app esteja fazendo no seu aparelho. A Apple também lista as
        Notas do iCloud na página Status do sistema, em apple.com/br/support/systemstatus. Se aparecer uma falha, espere até a Apple marcar
        como resolvido.
      </p>

      <h2 id="iphone">No iPhone: o Notas fica travando ou não abre</h2>
      <Steps>
        <li id="fechar-iphone">
          <strong>Feche o Notas e abra de novo</strong>{" "}
          Abra o Seletor de Apps, passe o dedo até achar o Notas e passe o dedo para cima nele. Depois toque no Notas na Tela de Início ou
          na Biblioteca de Apps.
        </li>
        <li id="reiniciar-iphone">
          <strong>Reinicie o iPhone</strong>
          É o próximo passo da Apple se o app continuar sem responder. Se o próprio iPhone estiver travado e não desligar, force a
          reinicialização: pressione e solte o botão de aumentar volume, pressione e solte o de diminuir volume e mantenha o botão lateral
          pressionado até o logotipo da Apple aparecer.
        </li>
        <li id="atualizar-iphone">
          <strong>Atualize o iOS</strong>{" "}
          A Apple sugere olhar primeiro Atualizações de Apps na App Store e, se não houver nada para o app, atualizar o software do iPhone.
          Antes, faça backup do iPhone, ligue na energia e conecte ao Wi-Fi.
          <Paths rows={[
            { on: "iPhone", steps: ["Ajustes", "Geral", "Atualização de Software"] },
          ]} />
        </li>
        <li id="baixar-de-novo">
          <strong>Apague o Notas e baixe de novo, por último</strong>{" "}
          O Notas é um dos apps integrados que a Apple deixa apagar. A Apple diz que apagar um deles também apaga os dados de usuário
          relacionados no aparelho, então confira icloud.com/notes antes, e pule este passo se você guarda notas em No Meu iPhone. Para
          trazer de volta, busque Notas pelo nome exato na App Store e toque em Baixar Novamente.
        </li>
      </Steps>
      <p>
        Os passos são do <a href="https://support.apple.com/pt-br/119876" rel="noopener">artigo da Apple sobre um app no iPhone que encerra
        inesperadamente, para de responder ou não abre</a>, com os detalhes do Manual de Uso do iPhone e de{" "}
        <a href="https://support.apple.com/pt-br/118582" rel="noopener">Apagar apps integrados da Apple</a>.
      </p>

      <h2 id="mac">No Mac: o Notas fica travando ou fechando</h2>
      <Steps>
        <li id="forcar-encerrar">
          <strong>Encerre o Notas, ou force o encerramento</strong>{" "}
          Tente primeiro Command + Q. Se o Notas não responder, pressione Option + Command + Esc, ou escolha Forçar Encerrar no menu Apple,
          selecione o Notas e clique em Forçar Encerrar. A Apple avisa que você pode perder alterações não salvas. Se o Notas fechou
          sozinho, clique em Reabrir na janela que aparecer.
          <Paths rows={[
            { on: "Mac", steps: ["Menu Apple", "Forçar Encerrar"], keys: "⌥⌘⎋" },
          ]} />
        </li>
        <li id="reiniciar-mac">
          <strong>Reinicie o Mac</strong>{" "}
          Escolha Reiniciar no menu Apple. Se o Mac não reiniciar, a Apple manda manter pressionado o botão liga/desliga por até dez
          segundos, até ele desligar, e pressionar de novo para ligar.
        </li>
        <li id="outra-nota">
          <strong>Abra outra nota</strong>{" "}
          O guia da Apple sugere abrir outro documento, porque o que estava aberto pode ser a causa do problema. No Notas, isso é outra
          nota.
        </li>
        <li id="atualizar-mac">
          <strong>Atualize o macOS</strong>{" "}
          A Apple recomenda fazer backup do Mac antes. Não deixe o Mac entrar em repouso nem feche a tampa até a instalação terminar.
          <Paths rows={[
            { on: "Mac", steps: ["Ajustes do Sistema", "Geral", "Atualização de Software"] },
          ]} />
        </li>
        <li id="perifericos">
          <strong>Desconecte o que é novo e remova complementos</strong>{" "}
          A Apple sugere desconectar um aparelho que você acabou de ligar, como uma impressora, e desinstalar plug-ins ou melhorias de
          outros fabricantes, que podem parar de funcionar depois de uma atualização do app ou do macOS.
        </li>
      </Steps>
      <p>
        Os passos são da página da Apple <a href="https://support.apple.com/pt-br/guide/mac-help/mchlp2579/mac" rel="noopener">Se um app
        parar ou se encerrar inesperadamente no Mac</a> e do artigo <a href="https://support.apple.com/pt-br/102586" rel="noopener">Como
        forçar o encerramento de um app no Mac</a>. Se continuar acontecendo, o <a href="https://support.apple.com/pt-br/116946"
        rel="noopener">artigo da Apple sobre o modo seguro</a> mostra como verificar se um software que carrega quando o Mac é inicializado
        está causando o problema.
      </p>

      <h2 id="notas-nao-carregam">O Notas abre, mas as suas notas não carregam</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="O app Notas no macOS 27 sem iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botões System Settings e Cancel."
        caption="O que o Notas mostra num Mac com o iCloud desativado para o Notas (em português, Ative o iCloud)." />
      <p>
        Se o app funciona mas a lista está vazia, os passos da Apple são conferir se Sincronizar este iPhone (ou Sincronizar este Mac) está
        ativado para o Notas e depois olhar o app Notas. Se as notas ainda não aparecerem, reinicie o aparelho e verifique o ajuste de
        novo. A Apple diz que, quando a sincronização terminar, as notas que já estão no iCloud devem aparecer.
      </p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Ajustes", "Seu nome", "iCloud", "Ver tudo", "Notas"] },
        { on: "iPhone, iOS 26", steps: ["Ajustes", "Seu nome", "iCloud", "Notas"] },
        { on: "Mac, macOS 15 ou posterior", steps: ["Ajustes do Sistema", "Seu nome", "iCloud", "Notas"] },
      ]} />
      <p>
        Isso é do artigo <a href="https://support.apple.com/pt-br/121669" rel="noopener">Se você não vir as notas do iCloud no app
        Notas</a>. Se as notas aparecem num aparelho e não no outro, <a href="/pt/blog/notas-iphone-nao-sincroniza">Notas do iPhone não
        sincroniza com o Mac</a> passa pelo resto das verificações. Se uma nota falta em todos os aparelhos, olhe na pasta Apagadas, onde
        as notas apagadas ficam por 30 dias. O guia{" "}
        <a href="/blog/recover-deleted-apple-notes" hrefLang="en">para recuperar notas apagadas</a> (em inglês) mostra onde ela fica em
        cada aparelho.
      </p>

      <h2 id="depois-da-atualizacao">Não funciona depois de uma atualização</h2>
      <p>
        Quando um aparelho foi atualizado e o outro não, uma nota feita no mais novo pode usar recursos que o Notas mais antigo não tem. No
        Mac, o Notas então mostra &ldquo;Esta nota usa recursos incompatíveis. Para visualizá-la ou editá-la, atualize para a versão mais
        recente do macOS.&rdquo; A nota sincronizou, mas aquele Mac não consegue abrir. Atualizar o aparelho que está atrasado resolve.
      </p>
      <p>
        Se o próprio Notas começou a travar depois de uma atualização, os passos acima continuam sendo os que a Apple dá. Procure também
        uma atualização mais nova, já que a Apple lista as atualizações de software entre as soluções para um app que fecha sozinho.
      </p>

      <h2 id="da-proxima-vez">Guarde uma cópia, para a próxima vez</h2>
      <p>
        Uma cópia das suas notas fora do app Notas vale a pena, seja qual for o problema. O guia{" "}
        <a href="/blog/back-up-apple-notes" hrefLang="en">de backup do app Notas</a> (em inglês) mostra como manter uma.
      </p>

      <h2 id="pinto-notes">Um segundo lugar para as suas notas</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="A janela Import from Apple Notes no Pinto Notes no Mac: Copies the notes you pick. Nothing in Apple Notes changes. Cada nota aparece embaixo da sua pasta do app Notas, todas marcadas, com Import 8 Notes."
        caption="Import from Apple Notes no Pinto Notes no Mac. Ele copia suas notas e deixa o app Notas como estava." />
      <p>
        O Pinto Notes não conserta o app Notas. Ele é um app de notas com a cara do app Notas, que funciona como ele no iPhone e no Mac, e
        pode guardar uma segunda cópia das suas notas: <a href="/blog/move-from-apple-notes" hrefLang="en">mudar do app Notas</a> (em
        inglês) é uma importação no seu Mac, e o app Notas não muda. A importação lê suas notas pelo app Notas, então o Notas precisa abrir
        naquele Mac. Depois disso, cada versão anterior de cada nota fica guardada no Pinto Notes. O app está em inglês.
      </p>
    </LocalPostPage>
  );
}
