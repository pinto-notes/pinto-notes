import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, FigurePair, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "esqueci-senha-notas-iphone");

// Brazilian Portuguese version of /blog/forgot-apple-notes-password (language pilot, 17 Nov 2026). Apple's own
// pt-BR words for every menu and button, from support.apple.com/pt-br/102537 ("Como bloquear ou desbloquear notas
// no iPhone", read 17 Nov) and support.apple.com/pt-br/guide/notes/apdb021fd5a9/mac ("Altere a senha de notas
// bloqueadas", read 17 Nov), checked against the pt_BR strings in Notes on macOS 27.2 (Ver Nota, Redefinir Senha,
// Definir Senha, Atualizar Senha, Usar a Senha de Início de Sessão). On iPhone the last reset step is "botão OK"
// in Apple's pt-BR page, where English says Done. Slug and title from Google autocomplete (pt-BR): "esqueci a
// senha do notas iphone", "esqueci a senha das notas bloqueadas iphone". Facts are the English post's; the
// screenshots are its English ones, described in Portuguese.

const ui = UI.pt;

const FAQ = [
  { q: "A Apple consegue recuperar minhas notas bloqueadas se eu esquecer a senha?", a: [
    "Não. A Apple diz que não tem acesso às notas bloqueadas e que não pode ajudar você a abri-las se você esquecer a senha. As notas bloqueadas são criptografadas com uma chave criada a partir dessa senha.",
  ] },
  { q: "Redefinir a senha do Notas desbloqueia minhas notas antigas?", a: [
    "Não. Redefinir deixa você bloquear notas novas com uma senha nova. As notas que você bloqueou antes continuam com a senha antiga e precisam dela para abrir.",
  ] },
  { q: "Dá para abrir uma nota bloqueada com o Face ID ou o Touch ID?", a: [
    "Tente: se você ativou o Face ID ou o Touch ID para o Notas, a Apple cita isso como um jeito de ver uma nota bloqueada. Não serve para alterar a senha, que sempre pede a senha atual.",
  ] },
  { q: "Os apps que prometem desbloquear o Notas funcionam?", a: [
    "Eles não conseguem descriptografar uma nota bloqueada sem a senha. A chave vem da senha, então o máximo que uma ferramenta pode fazer é adivinhar. Desconfie de qualquer uma que peça a senha da sua Conta Apple.",
  ] },
  { q: "Como evito que isso aconteça de novo?", a: [
    "Use o código do dispositivo em vez de uma senha separada (iOS 16 ou posterior, com as Chaves do iCloud ativadas), ou guarde a senha das notas em um gerenciador de senhas.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="esqueci-senha-notas-iphone"
      intro={<>Esqueceu a senha das suas notas bloqueadas? Aqui está o que vale a pena tentar, na ordem em que eu tentaria, e a única coisa que não convém fazer primeiro.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#tente-primeiro", label: "Tente isto primeiro" },
          { href: "#redefinir-iphone", label: "Redefinir no iPhone" },
          { href: "#redefinir-mac", label: "Redefinir no Mac" },
          { href: "#da-proxima-vez", label: "Para não acontecer de novo" },
        ]}>
          <PostFigure src="/blog/macos27/notes-locked-hint" width={720} height={580} maxWidth={360}
            alt="Uma nota bloqueada no app Notas do macOS 27 pedindo a senha das notas, com a dica City and year of the trip embaixo do campo."
            caption="Depois de uma senha errada, o Notas mostra a dica que você definiu." />
          <p>
            Ninguém abre uma nota bloqueada sem a senha dela, nem a Apple, nem um app de desbloqueio. Tente primeiro o Face ID ou o
            Touch ID, a dica e o código do seu dispositivo. Se nada funcionar, redefina a senha: ela só muda para as notas que você
            bloquear daqui para a frente, e as antigas continuam com a senha antiga.
          </p>
          <PostCta slug="pt/esqueci-senha-notas-iphone" path="/pt/blog/esqueci-senha-notas-iphone" position="answer" ui={ui.cta}
            title="Quer notas que nunca fiquem trancadas?">
            <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac, guarda cada versão de cada nota, e o ChatGPT ou o Claude podem trabalhar nelas. Ele importa suas notas do app Notas em um passo.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760}
        phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }}
        alt="A janela do app Notas no macOS 27 com uma nota bloqueada selecionada: This note is locked. Embaixo do campo de senha, a dica City and year of the trip."
        caption="Uma nota bloqueada no Notas do macOS 27, depois de algumas tentativas erradas. A dica aparece embaixo do campo de senha. No iPhone é igual." />}
      faq={FAQ}
    >
      <h2 id="por-que">Por que ninguém consegue abrir por você</h2>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300}
        alt="Uma nota bloqueada no iPhone: um cadeado cinza, o texto This note is locked e um botão View Note."
        caption="Uma nota bloqueada no iPhone. Imagem: Apple." />
      <p>
        Uma nota bloqueada é criptografada com uma chave criada a partir da senha das suas notas. O guia de segurança da Apple descreve
        assim: a chave vem da sua senha, e a nota e os anexos dela são criptografados com essa chave. A Apple
        diz <a href="https://support.apple.com/pt-br/102537" rel="noopener">que não tem acesso às notas bloqueadas</a> e que não
        pode ajudar se você esquecer a senha. É para isso que serve bloquear uma nota, e é também por isso que redefinir a senha não traz
        as notas antigas de volta.
      </p>

      <h2 id="tente-primeiro">Tente isto primeiro</h2>
      <Steps>
        <li>
          <strong>Face ID ou Touch ID</strong>
          Se você ativou para o Notas, abra a nota bloqueada, toque em Ver Nota e use. A Apple cita isso como um jeito de ver uma nota
          bloqueada.
        </li>
        <li>
          <strong>A dica</strong>
          Digite uma senha errada duas vezes e o Notas mostra a dica de senha que você definiu, se tiver definido uma.
        </li>
        <li>
          <strong>O código do iPhone ou a senha do Mac</strong>
          Desde o iOS 16, dá para bloquear notas com o código do dispositivo em vez de uma senha separada. Se você escolheu isso, use o
          código do iPhone, ou a senha de início de sessão no Mac.
        </li>
        <li>
          <strong>Senhas antigas</strong>
          Se você já redefiniu a senha das notas alguma vez, as notas mais antigas continuam com a senha com que foram bloqueadas. Quando
          você digita a senha atual numa nota antiga, o Notas avisa que ela está errada e mostra a dica da senha antiga.
        </li>
        <li>
          <strong>Um gerenciador de senhas</strong>
          Se você usa um, procure por &ldquo;notas&rdquo;: talvez você tenha salvado a senha lá quando a criou.
        </li>
      </Steps>
      <p>
        Não redefina primeiro. Redefinir é seguro e não apaga nada, mas, depois que você tem duas senhas, fica mais difícil saber qual
        nota precisa de qual.
      </p>

      <h2 id="o-que-funciona">O que cada opção consegue fazer</h2>
      <PostFigure src="/blog/drawn/pw-keys" width={1200} height={750} maxWidth={560}
        alt="Um cadeado laranja desenhado com três jeitos de abri-lo em volta: um escaneamento de rosto, seis pontos de código e um campo de senha."
        caption="Três jeitos de entrar: Face ID, o seu código ou a própria senha das notas." />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Abre notas antigas?</th><th scope="col">Bom saber</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Face ID ou Touch ID</th><td>Sim, se estava ativado para o Notas</td><td>Não altera a senha; isso sempre pede a senha atual</td></tr>
            <tr><th scope="row">A dica</th><td>Só se refrescar a sua memória</td><td>Aparece depois de duas tentativas erradas, se você definiu uma</td></tr>
            <tr><th scope="row">Código do dispositivo</th><td>Sim, nas notas bloqueadas com ele</td><td>Opção desde o iOS 16, com as Chaves do iCloud ativadas</td></tr>
            <tr><th scope="row">Redefinir Senha</th><td>Não</td><td>Define uma senha para as notas que você bloquear daqui em diante</td></tr>
            <tr><th scope="row">Suporte da Apple</th><td>Não</td><td>A Apple não tem acesso às notas bloqueadas</td></tr>
            <tr><th scope="row">Apps de desbloqueio</th><td>Não</td><td>Só conseguem adivinhar senhas</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="redefinir">Redefinir a senha (para notas novas)</h2>
      <p>
        Se nada disso funcionar, redefina a senha para continuar bloqueando notas novas. As notas bloqueadas antigas ficam como estão e
        ainda abrem com a senha antiga, se um dia você lembrar dela.
      </p>
      <p className="label" id="redefinir-iphone"><strong>No iPhone</strong></p>
      <Steps>
        <li>Abra Ajustes, toque em Apps, depois em Notas e depois em Senha.</li>
        <li>Escolha a conta do Notas e toque em Redefinir Senha.</li>
        <li>Digite a senha da sua Conta Apple, toque em OK e toque em Redefinir Senha de novo.</li>
        <li>Use o código do dispositivo, ou digite uma senha nova e uma dica, e toque em OK.</li>
      </Steps>
      <p className="label" id="redefinir-mac"><strong>No Mac</strong></p>
      <Steps>
        <li>No Notas, escolha Notas, Ajustes, clique em Redefinir Senha e depois em OK.</li>
        <li>Digite a senha que o Notas pedir. No meu teste com o macOS 27, foi a senha de início de sessão do Mac; o guia da Apple diz que uma conta do iCloud pode pedir a senha do iCloud.</li>
        <li>Clique em Redefinir Senha de novo, digite a senha nova duas vezes e uma dica, e clique em Definir Senha.</li>
      </Steps>
      <p>
        Os passos são da Apple: <a href="https://support.apple.com/pt-br/102537" rel="noopener">Como bloquear ou desbloquear notas no
        iPhone</a> e <a href="https://support.apple.com/pt-br/guide/notes/apdb021fd5a9/mac" rel="noopener">Altere a senha de notas
        bloqueadas</a> no Mac. Se você ainda sabe a senha e só quer outra, escolha Alterar Senha: assim todas as notas bloqueadas passam
        para a senha nova e você não fica com duas.
      </p>
      <Capture src="/blog/macos27/notes27-reset-password-confirm" width={1148} height={1420} maxWidth={420}
        alt="O app Notas no macOS 27 pergunta Reset Notes Password? e explica que a senha nova vale para as notas que você bloquear daqui em diante e que as notas que já têm senha não mudam. Botões Cancel e OK."
        caption="Ao redefinir no macOS 27, a Apple diz com todas as letras: as notas que já têm senha não mudam." />

      <h2 id="testado">Redefini num Mac de teste para você não precisar</h2>
      <p>
        Bloqueei uma nota com uma senha, redefini e criei uma senha nova. Depois abri a nota antiga. A senha nova não funcionou, e a dica
        que apareceu era a antiga. Essa dica é a sua melhor pista: é a dica que você escreveu para a senha que esqueceu.
      </p>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-after-reset-old-note-rejects-new-password", width: 2000, height: 1320,
          alt: "Uma nota bloqueada antes da redefinição, no app Notas do macOS 27: a senha não é a correta para esta nota, e a dica ainda é a antiga." },
        { src: "/blog/macos27/notes27-old-password-update-prompt", width: 2000, height: 1320,
          alt: "A mesma nota aberta com a senha antiga: o Notas pergunta se você quer passar todas as notas com essa senha para a senha atual, com os botões Update Password e Not Now." },
      ]} caption="Depois de redefinir, a nota antiga recusa a senha nova e mostra a dica antiga. Digite a antiga e o Notas oferece passar todas essas notas para a sua senha atual." />
      <p>
        Então redefinir não faz você perder nada. Se a senha antiga voltar à memória mais tarde, o Notas oferece atualizar, em um passo,
        todas as notas que ainda usam essa senha.
      </p>

      <h2 id="apps-de-desbloqueio">Sobre os apps de desbloqueio</h2>
      <PostFigure src="/blog/drawn/pw-guess" width={1200} height={750} maxWidth={560}
        alt="Um cadeado laranja desenhado ao lado de uma pilha de chaves e um ponto de interrogação."
        caption="Um app de desbloqueio só consegue adivinhar, uma chave de cada vez." />
      <p>
        Os resultados de busca estão cheios de apps que prometem desbloquear o Notas. Nenhum deles consegue descriptografar uma nota
        bloqueada sem a senha; o máximo que fazem é testar senhas por você. Se algum pedir a senha da sua Conta Apple ou o seu backup,
        pense bem no que você está entregando.
      </p>

      <h2 id="da-proxima-vez">Para não acontecer de novo</h2>
      <ul>
        <li>Passe a usar o código do dispositivo: Ajustes, Apps, Notas, Senha, Usar o Código do Dispositivo. Precisa das Chaves do iCloud ativadas. No Mac, a mesma opção é Usar a Senha de Início de Sessão, no menu Notas Bloqueadas de Notas, Ajustes.</li>
        <li>Ou guarde a senha das notas em um gerenciador de senhas.</li>
        <li>Ative o Face ID ou o Touch ID para o Notas, para quase nunca precisar digitar a senha.</li>
        <li>Desbloqueie e exporte o que você não pode perder, e guarde uma cópia num lugar seguro.</li>
      </ul>
      <Capture src="/blog/macos27/notes-create-password" width={1006} height={622} maxWidth={503}
        alt="Criando a senha das notas no app Notas do macOS 27: campos Password, Verify e Password Hint, e o aviso de que, se você esquecer essa senha, não vai conseguir ver as notas bloqueadas."
        caption="Se você criar uma senha separada, preencha a dica. É a única pista que o Notas vai dar depois." />

      <h2 id="pinto-notes">Se você vai mudar de app</h2>
      <p>
        Notas bloqueadas não podem ser lidas sem a senha, então os exportadores e importadores deixam essas notas para trás. Isso inclui
        a importação do app Notas no Pinto Notes: desbloqueie antes as notas de que você precisa, ou elas ficam no Notas.
      </p>
      <p>
        O Pinto Notes, o app de notas para iPhone e Mac que eu faço, também tem notas bloqueadas, e elas funcionam do mesmo jeito:
        criptografadas com a senha das suas notas no seu dispositivo, ilegíveis para nós e para qualquer IA que você conectar, e
        impossíveis de recuperar se você esquecer a senha. Ele avisa isso quando você cria a senha. Todo o resto no Pinto Notes também é
        criptografado nos seus dispositivos, e o ChatGPT e o Claude ainda podem usar as suas outras notas depois que você aprovar. O app
        está em inglês.
      </p>
      <Figure shot={{ ...SHOTS.notesPassword, alt: "O Pinto Notes num Mac: Create a password for your locked notes, com os campos Password, Verify e Hint, e o aviso de que, se você esquecer essa senha, as notas bloqueadas não podem ser recuperadas, nem por nós." }}
        caption="Criando a senha das notas no Pinto Notes num Mac. Como a da Apple, ela não pode ser recuperada se você esquecer." />
    </LocalPostPage>
  );
}
