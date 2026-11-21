import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "busca-notas-iphone-nao-funciona");

// Brazilian Portuguese version of /blog/apple-notes-search-not-working (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/iphone/iphb8628c6b8/ios ("Busque em notas no iPhone": etiqueta, texto manuscrito em idiomas
// compatíveis, objetos em imagens, documentos escaneados, só o título de uma nota bloqueada, Buscar na Nota, Incluir Anexos),
// support.apple.com/pt-br/guide/notes/not18ab658ed/mac ("Busque em suas notas no Mac": what search finds, Conta Atual, Todas
// as Contas, busca por linguagem natural with "notas criadas na semana passada" and "modificado hoje", Mais Relevantes, notas
// bloqueadas só pelo título mesmo desbloqueadas, a pasta Apagadas nos resultados, Command + F, Visualizar > Mostrar Navegador
// de Anexos, o Spotlight inclui as notas), support.apple.com/pt-br/102476 (Ajustes > Apps > Notas > Contas de Notas, a barra
// Buscar, Todas as Contas, rolar para achar a barra, a palavra certa), support.apple.com/pt-br/102321 ("Sobre a indexação do
// Spotlight", published 31 Aug 2026: horas ou até mesmo dias, Command + barra de espaço, the Ajustes notification, Ajustes >
// Buscar, Privacidade na Busca, for files on a disk or folder), support.apple.com/pt-br/guide/mac-help/mchl54d95e8a/mac
// (Resultados de apps), support.apple.com/pt-br/guide/iphone/iph3c511548/ios (Ajustes > Buscar > um app > Mostrar App na
// Busca), iph92579feda (Ajustes > Apps > Notas > Buscar), iph83bfec492 (Seletor de Apps, passe o dedo para cima no app),
// iph841379c3d (desligar e ligar), iph3e504502 (Geral > Atualização de Software), support.apple.com/pt-br/102586
// (Command + Q, Option + Command + Esc, Forçar Encerrar, menu Apple > Reiniciar) and
// support.apple.com/pt-br/guide/mac-help/mchlpx1065/mac (as atualizações incluem melhorias para apps integrados como o Notas).
// Sincronizar este iPhone and Sincronizar este Mac follow notas-iphone-nao-sincroniza. Apple's pt-BR iPhone page names no
// menu button for Buscar na Nota, so the post says "o menu da nota". Slug and title from Google autocomplete (pt-BR, 21 Nov):
// "buscar notas iphone", "como pesquisar no notas"; "busca notas iphone não funciona", "notas iphone pesquisa não funciona"
// and "pesquisar notas iphone" return nothing, so the slug uses Apple's word, Buscar, with the "não funciona" that pt-BR
// searches for the app use ("app notas iphone nao funciona"). Facts are the English post's.

const ui = UI.pt;

const FAQ = [
  { q: "Por que o Notas não acha uma nota que eu sei que existe?", a: [
    "A Apple aponta quatro motivos: a nota está bloqueada, então a busca só vê o título; a busca cobre uma conta só em vez de Todas as Contas; o Notas está desativado na conta onde a nota está; ou a palavra que você digitou não é a que está na nota. Uma nota que ainda não sincronizou com este aparelho também não aparece.",
  ] },
  { q: "A busca do Notas procura dentro de PDFs e documentos escaneados?", a: [
    "Sim. No Mac, a Apple lista os PDFs anexados, os nomes dos arquivos anexos, o texto de documentos escaneados, desenhos e texto escrito à mão e o que há dentro das imagens. No iPhone, a busca cobre texto escrito à mão em idiomas compatíveis, objetos em imagens e documentos escaneados. Dentro de uma nota, Buscar na Nota com Incluir Anexos também procura nos PDFs.",
  ] },
  { q: "Por que minhas notas não aparecem no Spotlight?", a: [
    "No iPhone, abra Ajustes, toque em Buscar e depois em Notas, e confira Mostrar App na Busca. Em Ajustes, Apps, Notas, o ajuste Buscar também decide se o conteúdo do Notas aparece na Busca. No Mac, os apps desativados em Resultados de apps, nos ajustes do Spotlight em Ajustes do Sistema, não aparecem nos resultados do Spotlight.",
  ] },
  { q: "Por que a busca do Notas parou de funcionar depois de uma atualização?", a: [
    "A Apple não documenta um problema da busca do Notas ligado a atualizações. Ela diz que o Spotlight refaz o índice depois de uma atualização de software e que isso pode levar horas ou até dias. O artigo da Apple sobre notas que faltam começa atualizando todos os aparelhos para o software mais recente e depois buscando com Todas as Contas selecionado.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="busca-notas-iphone-nao-funciona"
      intro={<>Você digitou uma palavra que com certeza está numa nota, e o Notas não achou nada. Na maioria das vezes, a nota está bloqueada, em outra conta ou ainda não chegou a este aparelho. Aqui estão as verificações da Apple, da causa mais provável para a menos provável.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#o-que-cobre", label: "O que a busca cobre" },
          { href: "#verificacoes", label: "As verificações, em ordem" },
          { href: "#numa-nota", label: "Dentro de uma nota ou PDF" },
          { href: "#spotlight", label: "Spotlight" },
          { href: "#depois-da-atualizacao", label: "Depois de uma atualização" },
        ]}>
          <p>
            Busque com Todas as Contas selecionado, e lembre que uma nota bloqueada só aparece pelo título. Depois confira se o Notas está
            ativado na conta onde a nota está e se a nota já sincronizou com este aparelho. Se a busca continuar sem achar, encerre e
            reabra o Notas, reinicie e atualize para o iOS ou o macOS mais recente.
          </p>
          <PostCta slug="pt/busca-notas-iphone-nao-funciona" path="/pt/blog/busca-notas-iphone-nao-funciona" position="answer" ui={ui.cta}
            title="Quer achar uma nota pelo assunto?">
            <p>O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e a busca dele lê cada palavra de cada nota. Conecte o ChatGPT ou o Claude e você pode pedir para ele achar uma nota pelo assunto.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-search-results" width={760} height={894} maxWidth={300}
        alt="O Notas no iPhone buscando Home: um resultado em Top Hits, Home renovation project, mais uma nota, Kitchen remodel ideas, com a etiqueta #Home, e nenhum anexo encontrado."
        caption="A busca do Notas no iPhone, com Mais Relevantes, Notas e Anexos. Imagem: Apple." />}
      faq={FAQ}
    >
      <h2 id="o-que-cobre">O que a busca do Notas cobre</h2>
      <p>
        Antes de concluir que a busca está quebrada, vale saber o que ela lê. No Mac, a Apple diz que a busca encontra conteúdo:
      </p>
      <ul>
        <li>no corpo de cada nota</li>
        <li>nos nomes dos arquivos anexos e nos PDFs anexados</li>
        <li>em desenhos e texto escrito à mão</li>
        <li>no que há dentro de uma imagem (busque &ldquo;bicicleta&rdquo; para achar a foto de uma)</li>
        <li>no texto de um documento escaneado</li>
      </ul>
      <p>
        No iPhone, a Apple lista etiquetas, texto digitado, texto escrito à mão em idiomas compatíveis, objetos em imagens e texto em
        documentos escaneados. Dois limites valem nos dois aparelhos. Uma nota bloqueada mostra só o título nos resultados, mesmo
        desbloqueada. E o guia da Apple para o Mac diz que alguns recursos não estão disponíveis em contas de outros provedores, como uma
        conta do Gmail. No Mac, as notas da pasta Apagadas aparecem nos resultados.
      </p>

      <h2 id="verificacoes">As verificações, em ordem</h2>
      <Steps>
        <li id="todas-as-contas">
          <strong>Busque em todas as contas</strong>
          No iPhone, toque em voltar até ver a lista de notas, toque na barra Buscar (talvez seja preciso rolar a tela para achar) e
          confira se Todas as Contas está selecionado. No Mac, clique no botão de busca, clique no menu ao lado da lupa e escolha Todas as
          Contas. Essa opção só aparece se você tiver mais de uma conta, como iCloud e Em Meu Mac.
        </li>
        <li id="bloqueada">
          <strong>A nota pode estar bloqueada</strong>
          A busca só vê o título de uma nota bloqueada. Se você buscou uma palavra do texto, abra suas notas bloqueadas com a senha, o Face
          ID ou o Touch ID e procure uma por uma. Esqueceu a senha? Veja <a href="/pt/blog/esqueci-senha-notas-iphone">esqueci a senha do
          Notas no iPhone</a>.
        </li>
        <li id="conta-ativada">
          <strong>O Notas está ativado em todas as contas</strong>
          Uma nota numa conta do Gmail, do Yahoo ou de outro serviço só aparece enquanto o Notas estiver ativado nessa conta. Toque na
          conta e confira se o Notas está ativado, e repita para cada conta.
          <MenuPaths rows={[{ on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Contas de Notas"] }]} />
        </li>
        <li id="outras-palavras">
          <strong>Tente outras palavras e depois procure à mão</strong>
          O próprio conselho da Apple é que talvez você não esteja usando a palavra, a frase ou o título que estão na nota. Tente outra, e
          depois abra cada pasta e role a lista. No Mac, você também pode digitar do jeito que falaria, como &ldquo;notas criadas na semana
          passada&rdquo; ou &ldquo;modificado hoje&rdquo;.
        </li>
        <li id="sincronizou">
          <strong>A nota já chegou a este aparelho</strong>
          Se você escreveu a nota em outro iPhone ou Mac, ela precisa chegar a este antes de a busca encontrar. Confira se Sincronizar este
          iPhone ou Sincronizar este Mac está ativado para o Notas nos ajustes do iCloud, nos dois aparelhos.{" "}
          <a href="/pt/blog/notas-iphone-nao-sincroniza">Notas do iPhone não sincroniza com o Mac</a> tem o resto dessas verificações.
          <MenuPaths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Seu nome", "iCloud", "Ver tudo", "Notas"] },
            { on: "Mac", steps: ["Ajustes do Sistema", "Seu nome", "iCloud", "Notas"] },
          ]} />
        </li>
        <li id="reiniciar">
          <strong>Encerre e reabra o Notas, depois reinicie</strong>
          No iPhone, abra o Seletor de Apps, passe o dedo para cima no Notas e abra o app de novo. Se não adiantar, a Apple sugere desligar
          e ligar o iPhone. No Mac, pressione Command + Q no Notas e abra de novo; se o Notas não responder, pressione Option + Command +
          Esc e clique em Forçar Encerrar. Se nem isso funcionar, escolha Reiniciar no menu Apple.
        </li>
        <li id="atualizar">
          <strong>Atualize para o software mais recente</strong>
          O artigo da Apple sobre notas que faltam começa aqui: atualize todos os aparelhos para o iOS e o macOS mais recentes. A Apple
          diz que as atualizações do macOS trazem melhorias para apps integrados como o Notas.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Ajustes", "Geral", "Atualização de Software"] },
            { on: "Mac", steps: ["Ajustes do Sistema", "Geral", "Atualização de Software"] },
          ]} />
        </li>
      </Steps>
      <p>
        Se a busca achar a nota na pasta Apagadas, mova de volta para uma pasta antes de passarem os 30 dias. O guia{" "}
        <a href="/blog/recover-deleted-apple-notes" hrefLang="en">para recuperar notas apagadas</a> (em inglês) tem os passos.
      </p>

      <h2 id="numa-nota">Busque dentro de uma nota, ou num PDF dentro dela</h2>
      <p>
        Notas longas e PDFs anexados têm a própria busca. No iPhone, abra a nota, abra o menu da nota e toque em Buscar na Nota. Para
        procurar também em PDFs e outros anexos, abra as opções de busca e selecione Incluir Anexos, e então digite o que procura. No Mac,
        abra a nota e pressione Command + F. Para notas no iCloud ou em Em Meu Mac, Visualizar, Mostrar Navegador de Anexos deixa você
        percorrer todos os anexos.
      </p>

      <h2 id="spotlight">Quando as notas não aparecem no Spotlight</h2>
      <p>
        O Spotlight é a busca do aparelho inteiro, e o guia da Apple para o Mac diz que as notas entram nos resultados dele. Se não
        estiverem entrando:
      </p>
      <ul>
        <li><strong>iPhone:</strong> abra Ajustes, toque em Buscar, role para baixo, toque em Notas e ative Mostrar App na Busca. Em Ajustes, Apps, Notas, o ajuste Buscar decide se o conteúdo do Notas aparece na Busca e nos widgets.</li>
        <li><strong>Mac:</strong> abra Ajustes do Sistema, clique em Spotlight e olhe Resultados de apps. Os apps desativados ali não aparecem nos resultados do Spotlight.</li>
      </ul>
      <p>
        A Apple também tem passos para reconstruir uma parte do índice do Spotlight no Mac, com o botão Privacidade na Busca. Eles foram
        escritos para arquivos num disco ou numa pasta, e a Apple não diz que ajudam o Notas.
      </p>

      <h2 id="depois-da-atualizacao">Se começou depois de uma atualização</h2>
      <p>
        A Apple diz que o Spotlight monta o índice de novo depois que você instala uma atualização de software, e que isso pode levar
        horas ou até dias. Fica mais rápido quando o aparelho não está em uso, está na energia e está no Wi-Fi. Enquanto isso, o iPhone
        mostra uma notificação em Ajustes dizendo que a busca e a Siri estão sendo otimizadas, e no Mac, pressionar Command + barra de
        espaço mostra um indicador de progresso no topo do Spotlight.
      </p>
      <p>
        A Apple não diz se a busca dentro do app Notas espera por esse índice, então as verificações acima continuam vindo primeiro.
      </p>

      <h2 id="pinto-notes">Achar uma nota pelo assunto</h2>
      <p>
        Todas as verificações acima supõem que você lembra uma palavra que está na nota. Quando você só lembra do assunto, uma busca por
        palavra não ajuda. O Pinto Notes, o app de notas para iPhone e Mac, tem a cara do app Notas e funciona como ele, e a busca dele lê
        cada palavra de cada nota. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT ou o
        Claude</a> (em inglês), o que leva um minuto, você também pode pedir para ele achar a nota pelo assunto, com as suas palavras.
      </p>
      <p>
        Ele não conserta a busca do app Notas. <a href="/blog/move-from-apple-notes" hrefLang="en">Mudar do app Notas</a> (em inglês)
        leva uma importação no seu Mac, e o app Notas não muda. O app está em inglês.
      </p>
    </LocalPostPage>
  );
}
