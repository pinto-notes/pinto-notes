import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import s from "@/lib/post-parts.module.css";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "passar-notas-iphone-para-icloud");

// Brazilian Portuguese version of /blog/move-apple-notes-to-icloud (language pilot, 17 Nov 2026). Apple's own
// pt-BR words, read 17 Nov: the iPhone User Guide, iOS 27 (support.apple.com/pt-br/guide/iphone/ipha61270292/ios
// "Organize suas notas em pastas no iPhone", iph7262fd4fe/ios "Adicione ou remova contas no app Notas do iPhone":
// No Meu iPhone, Contas de Notas, Ver tudo, Salvos no iCloud; iph92579feda/ios "Altere ajustes do app Notas":
// Conta Padrão), the Notes User Guide for Mac (notc3b2d538b/mac "Sobre contas e pastas", apd558a85438/mac "Adicione
// e remova pastas": Visualizar > Mostrar Barra Lateral on macOS 27, Mostrar Pastas on macOS 26, Option to copy;
// apd97da26aed/mac "Altere os ajustes do app Notas"), and support.apple.com/pt-br/102537, 102476 (pasta Lixo no
// app Mail) and 108770 (backup do iCloud). The Mac app's labels (Em Meu Mac, Mover para, Conta padrão, Ativar a
// conta Em Meu Mac, Apagadas, the IMAP messages) are the pt_BR strings in Notes on macOS 27.2. "Selecionar Notas"
// (Select Notes) isn't on an Apple pt-BR page; it is the iPhone's pt-BR label. Slug and title from Google
// autocomplete (pt-BR): "como passar as notas do iphone para o icloud", "como salvar notas no icloud". Facts are
// the English post's.

const ui = UI.pt;

const AFTER = "Depois de passar as notas para o iCloud";
const AFTER_ITEMS = [
  "Defina o iCloud como conta padrão, para a Siri e o widget pararem de usar a conta antiga",
  "Abra algumas notas que você passou e confira a formatação, os anexos e os desenhos",
  "Bloqueie de novo as notas que você desbloqueou para a mudança",
  "Desative o Notas na conta do Gmail, ou Em Meu Mac, quando estiver vazia",
];

const FAQ = [
  { q: "Por que algumas das minhas notas estão em No Meu iPhone?", a: [
    "No Meu iPhone é uma conta para notas que ficam só naquele iPhone. Ela aparece quando é ativada em Ajustes, Apps, Notas, e as notas novas que a Siri ou o widget do Notas criam vão para a conta escolhida como Conta Padrão ali.",
  ] },
  { q: "Passar as notas para o iCloud tira as notas do meu iPhone?", a: [
    "Não. As notas do iCloud continuam no seu iPhone e também aparecem em todos os outros aparelhos com a mesma Conta Apple e o Notas ativado no iCloud.",
  ] },
  { q: "Dá para passar as notas do Gmail para o iCloud?", a: [
    "Sim. As notas do Gmail aparecem como uma conta separada no Notas, e você move as notas para uma pasta do iCloud do mesmo jeito que as de No Meu iPhone. Depois, pode desativar o Notas na conta do Gmail.",
  ] },
  { q: "Por que não consigo bloquear as notas do Gmail?", a: [
    "A Apple diz que notas que sincronizam por IMAP, com contas como Gmail e Yahoo, não podem ser bloqueadas. Quando a nota está no iCloud, você pode bloquear, a não ser que ela tenha etiquetas ou um arquivo anexado, como um PDF ou uma gravação.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="passar-notas-iphone-para-icloud"
      intro={<>Algumas das suas notas estão em No Meu iPhone ou no Gmail, então nunca aparecem nos outros aparelhos. Passar essas notas para o iCloud leva alguns toques no iPhone ou um arraste no Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#onde", label: "Onde estão suas notas" },
          { href: "#antes", label: "O que pode se perder" },
          { href: "#iphone", label: "No iPhone" },
          { href: "#mac", label: "No Mac" },
          { href: "#gmail", label: "Notas do Gmail" },
          { href: "#depois", label: "Depois da mudança" },
        ]}>
          <p>
            No iPhone, abra a pasta em No Meu iPhone ou no Gmail, toque no botão Mais, toque em Selecionar Notas, escolha as notas, toque
            no botão de pasta e escolha uma pasta do iCloud. No Mac, arraste as notas para uma pasta do iCloud na barra lateral, e mantenha
            a tecla Option pressionada para copiar em vez de mover. Tire o bloqueio das notas bloqueadas antes, e depois defina o iCloud
            como conta padrão, senão as notas novas continuam caindo na conta antiga.
          </p>
          <PostCta slug="pt/passar-notas-iphone-para-icloud" path="/pt/blog/passar-notas-iphone-para-icloud" position="answer" ui={ui.cta}
            title="Quer notas sem contas para organizar?">
            <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Você entra uma vez e todas as notas sincronizam. Ele importa suas notas do app Notas em um passo, sem mudar nada lá.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="onde">Veja onde estão suas notas</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="A lista de pastas do Notas no iPhone com iOS 27: Quick Notes e Shared no topo, depois um título iCloud com as pastas dele, e Tags embaixo."
        caption="O título acima de uma pasta, aqui iCloud, é a conta em que as notas dela estão. Imagem: Apple." />
      <p>
        O Notas agrupa as pastas por conta, embaixo de títulos como iCloud, No Meu iPhone e Gmail. O título embaixo do qual a nota está
        decide se ela chega aos seus outros aparelhos: só as notas do iCloud chegam, com todos os recursos.
      </p>
      <p>No iPhone, volte para a lista de pastas do Notas. No Mac, os mesmos grupos ficam na barra lateral. Se ela estiver escondida:</p>
      <Paths rows={[
        { on: "Mac, macOS 27", steps: ["Visualizar", "Mostrar Barra Lateral"] },
        { on: "Mac, macOS 26", steps: ["Visualizar", "Mostrar Pastas"] },
      ]} />
      <p>Se não houver nenhum título iCloud, o Notas está desativado no iCloud. Ative aqui:</p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Ajustes", "Seu nome", "iCloud", "Ver tudo", "Notas"] },
        { on: "iPhone, iOS 26", steps: ["Ajustes", "Seu nome", "iCloud", "Notas"] },
      ]} />
      <p>
        Se as suas notas já estão no iCloud e mesmo assim não chegam aos outros aparelhos, o problema está em outro lugar:{" "}
        <a href="/pt/blog/notas-iphone-nao-sincroniza">Notas do iPhone não sincroniza com o Mac</a> ajuda a achar.
      </p>

      <h2 id="antes">Antes de mover qualquer coisa: o que pode se perder</h2>
      <p>
        O guia da Apple avisa que mover notas de uma conta para outra pode fazer você perder a formatação e os anexos para sempre. Então
        guarde os originais até conferir as notas movidas.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Na nota</th><th scope="col">O que a Apple diz</th><th scope="col">O que fazer antes</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Formatação e anexos</th><td>Podem se perder para sempre na mudança</td><td>No Mac, mantenha a tecla Option pressionada ao arrastar. O Notas copia em vez de mover</td></tr>
            <tr><th scope="row">Desenhos</th><td>Podem virar arquivos de imagem que não dá mais para editar como desenho</td><td>O mesmo: copie primeiro e depois confira</td></tr>
            <tr><th scope="row">Um bloqueio</th><td>Notas bloqueadas só se movem entre o iCloud e a conta do seu Mac, e pode ser preciso desbloquear antes</td><td>Tire o bloqueio, mova a nota e bloqueie de novo no iCloud</td></tr>
            <tr><th scope="row">Compartilhamento</th><td>Só notas do iCloud podem ser compartilhadas, então uma nota compartilhada já está lá</td><td>Nada</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        O guia da Apple para o iPhone só descreve mover, sem nenhum jeito de copiar. Então, no iPhone, faça um backup antes: as notas em
        No Meu iPhone entram no backup do iPhone.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="O menu Mais de uma nota desbloqueada no Notas do iPhone, com Remove destacado no topo ao lado de Scan e Pin Note."
        caption="Desbloqueie a nota e toque em Mais, Remover, antes de mover. Imagem: Apple." />
      <p>
        Para tirar o bloqueio de uma nota no iPhone, toque na nota bloqueada, toque em Ver Nota e desbloqueie, depois toque no botão Mais
        e escolha Remover. Cada conta pode ter a própria senha das notas. Se você perdeu a senha de uma nota bloqueada, ninguém consegue
        abrir, e <a href="/pt/blog/esqueci-senha-notas-iphone">o que fazer se você esqueceu a senha do Notas</a> explica por quê.
      </p>
      <p>
        Mais uma coisa, se você usa duas Contas Apple: o guia da Apple para o Mac diz que uma nota compartilhada só pode ser movida entre
        pastas da mesma conta do iCloud.
      </p>

      <h2 id="iphone">Mover notas no iPhone</h2>
      <Steps>
        <li>
          <strong>Abra a pasta que tem as notas</strong>{" "}
          Por exemplo, Notas em No Meu iPhone, ou Notas no Gmail.
        </li>
        <li>
          <strong>Toque no botão Mais e depois em Selecionar Notas</strong>{" "}
          Toque em cada nota que você quer mover.
        </li>
        <li>
          <strong>Toque no botão de pasta e escolha uma pasta do iCloud</strong>{" "}
          As notas saem da conta antiga e aparecem nessa pasta.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="O Notas no iPhone com iOS 27 no modo de seleção: 3 Selected, três notas marcadas e um botão de pasta no canto inferior esquerdo para movê-las."
        caption="Selecionar Notas e depois o botão de pasta, no canto inferior esquerdo. Imagem: Apple." />
      <p>
        Para uma nota só, mantenha a nota pressionada, toque em Mover e escolha a pasta. Para trazer uma pasta inteira, crie uma pasta com o
        mesmo nome no iCloud e mova as notas para ela.
      </p>

      <h2 id="mac">Mover notas no Mac</h2>
      <Steps>
        <li>
          <strong>Selecione as notas na lista</strong>{" "}
          Elas podem vir de Em Meu Mac, do Gmail ou de qualquer outra conta da barra lateral.
        </li>
        <li>
          <strong>Arraste para uma pasta do iCloud na barra lateral, ou clique com a tecla Control pressionada e escolha Mover para</strong>{" "}
          Mantenha a tecla Option pressionada ao soltar para fazer cópias e guardar os originais.
        </li>
      </Steps>
      <PostFigure src="/blog/macos27/notes27-note-context-move-to-submenu" width={1416} height={960} maxWidth={600}
        alt="O app Notas no macOS 27: clique com a tecla Control numa nota, Move to, e a lista de pastas para onde movê-la."
        caption="Sem arrastar: clique na nota com a tecla Control pressionada, escolha Mover para e depois a pasta." />
      <p>
        Em Meu Mac é a conta local do próprio Mac, como No Meu iPhone. Quando ela estiver vazia, você pode desativar desmarcando Ativar a
        conta Em Meu Mac em Notas, Ajustes. O Notas não desativa a conta enquanto ela ainda tem notas, e pede para você mover ou apagar
        essas notas antes.
      </p>

      <h2 id="gmail">As notas do Gmail são diferentes</h2>
      <p>
        As notas de uma conta do Gmail ficam na sua conta do Google e sincronizam com o Notas por IMAP, o protocolo que o Mail usa. A Apple
        diz que muitos recursos do Notas não funcionam ali. Na prática:
      </p>
      <ul>
        <li>Não podem ser bloqueadas.</li>
        <li>No macOS 26, o Notas recusa etiquetas e notas fixadas numa conta IMAP, com uma mensagem dizendo que não são compatíveis.</li>
        <li>Quando você apaga uma, o Gmail normalmente guarda a nota na pasta Lixo dessa conta no app Mail, e não em Apagadas.</li>
      </ul>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Os ajustes de uma conta do Gmail no iPhone, com as chaves Mail, Contacts, Calendars e Notes, todas ativadas."
        caption="Desative o Notas aqui quando a conta do Gmail não tiver mais notas. O Mail continua funcionando. Imagem: Apple." />
      <p>
        A Apple diz que as notas que você move de outra conta para o iCloud podem usar todos os recursos. Para a conta do Gmail parar de
        sincronizar notas quando estiver vazia, desative o Notas nela. O Mail continua funcionando, e as notas que ainda estiverem no Gmail
        ficam na sua conta do Google.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Contas de Notas", "Gmail", "Notas"] },
      ]} />

      <h2 id="depois">Depois da mudança</h2>
      <p>Quatro coisas, e a primeira é a que as pessoas esquecem.</p>
      <Keep title={AFTER} text={[AFTER, ...AFTER_ITEMS].join("\n")} copyLabel={ui.copy}
        note="Copiar dá linhas simples. No app Notas, selecione as linhas e toque no botão de checklist.">
        <ul className={s.ticks}>{AFTER_ITEMS.map((it) => <li key={it}>{it}</li>)}</ul>
      </Keep>
      <p>A conta padrão fica aqui:</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Conta Padrão"] },
        { on: "Mac", steps: ["Notas", "Ajustes", "Conta padrão"] },
      ]} />
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Os ajustes gerais do app Notas num Mac com macOS 26: Sort notes by Date Edited, New notes start with Title e Default account com iCloud, que a Siri usa ao criar notas." }}
        ground="sky" caption="Notas, Ajustes num Mac com macOS 26. Conta padrão é para onde vão as notas novas, e o Notas avisa que a Siri usa essa conta ao criar notas." />
      <p>
        A mudança também altera o que o backup do iCloud do seu iPhone guarda. As notas em No Meu iPhone fazem parte dele, e a Apple deixa
        de fora as notas que já estão no iCloud. Apagar uma nota no iCloud remove a nota de todos os aparelhos depois de 30 dias em
        Apagadas, então guarde também uma cópia sua.
      </p>

      <h2 id="pinto-notes">Um app de notas sem contas para organizar</h2>
      <Figure shot={{ ...SHOTS.consent, alt: "O Pinto Notes perguntando \"Allow ChatGPT to use your notes?\": as notas que o ChatGPT abre vão para a OpenAI, as notas bloqueadas continuam privadas, um número para comparar, e os botões Allow e Don't Allow." }}
        caption="Uma IA só recebe as suas notas depois que você permite no seu aparelho." />
      <p>
        O Pinto Notes, o app de notas para iPhone e Mac, não tem No Meu iPhone nem contas de e-mail. Você entra uma vez e todas
        as notas sincronizam entre os seus aparelhos. O ChatGPT e o Claude podem ler e editar essas notas depois que você aprovar.
      </p>
      <p>
        Ele não arruma o app Notas para você, e não tem versão para Windows, Android ou web. O app está em inglês. Mudar do Notas leva uma
        importação no seu Mac e deixa o app Notas como estava.
      </p>
    </LocalPostPage>
  );
}
