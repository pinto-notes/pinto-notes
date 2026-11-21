import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "como-organizar-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-organize (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd558a85438/mac ("Adicione e remova pastas no Notas do Mac": Arquivo > Nova Pasta,
// arraste com a tecla Option para copiar, arraste a pasta para cima de outra para criar uma subpasta, Renomear Pasta, Apagar
// Pasta, a pasta Apagados por 30 dias, sem subpasta em "Todas [conta]" nem em Notas), apdb54e469b6 ("Ordene e fixe notas no
// Mac": Notas > Ajustes, "Ordenar notas por", Ordenar por numa pasta, as pastas "Todas [conta]" e Apagadas seguem o padrão,
// Arquivo > Fixar Nota, deslizar para a direita com dois dedos, arrastar entre Fixadas e Notas, a mesma Conta Apple, notas
// atualizadas do iCloud ou no Mac), apd000074a4e ("Personalize como as notas são exibidas": "Agrupar notas por data", Agrupar
// por Data numa pasta, não disponível com ordenação por Título, Hoje, Ontem); iPhone guide ipha61270292 ("Organize suas
// notas em pastas no iPhone": Nova Pasta, mantenha o toque e arraste para criar uma subpasta, Renomear, passe o dedo para a
// esquerda para apagar, Mover, Ordenar por, "Mais Antiga Primeiro", Decrescente, Ajustes > Notas > "Ordenar Notas por",
// Agrupar por Data, "Fixar Nota"); the three sort choices by name ("Data de Edição", "Data de Criação", Título) are from the
// iOS 15 pt-BR version of that page (support.apple.com/pt-br/guide/iphone/ipha61270292/15.0/ios/15.0). Mover para, Selecionar
// Notas, Mais, Colar como Markdown, Adicionar Link, Etiquetas, Checklists, Sem Etiqueta, Últimos 7 Dias and Formatar > Mais >
// Desmarcar Tudo are the pt_BR strings in Notes on macOS 27.2, as the earlier pt posts use them. Apple's pt-BR iPhone page
// names no button for the folder's sort menu or for the swipe-left move, so the post describes them (o botão de ações da
// pasta, o botão de pasta); the iPhone settings path follows iph92579feda (Ajustes > Apps > Notas). Smart Folder rules are
// described rather than named, beyond Etiquetas and Checklists. Slug and title from Google autocomplete (pt-BR, 21 Nov): "como
// organizar notas no iphone", "como organizar o notas do iphone", "organizar notas iphone", "como criar pastas no notas do
// iphone"; "como organizar notas" alone is mostly about notas fiscais, so the slug keeps iPhone. The tidy checklist is
// translated; Pinto's weekly review template keeps its English name. Facts are the English post's.

const ui = UI.pt;

const TIDY = `# Faxina semanal

- [ ] Arquivar cada nota da pasta Notas, ou apagar
- [ ] Pôr etiqueta nas notas de Sem etiqueta que precisam de uma
- [ ] Olhar Esta semana atrás de alguma nota na pasta errada
- [ ] Desafixar o que já terminou
- [ ] Limpar ou apagar as listas concluídas em Tarefas abertas
- [ ] Mover os projetos concluídos para Arquivo morto
`;

const FAQ = [
  { q: "Qual é a melhor forma de organizar o app Notas?", a: [
    "Algumas pastas amplas para as áreas da sua vida, etiquetas para assuntos que atravessam essas áreas, uma nota de índice fixada por pasta e dez minutos por semana para arquivar o que se acumulou. A busca acha qualquer palavra, então o sistema só precisa facilitar a navegação.",
  ] },
  { q: "Como ordenar as notas do iPhone em ordem alfabética?", a: [
    "Ordene por título. No iPhone, abra a pasta, toque no botão de ações da pasta, toque em Ordenar por e escolha Título. No Mac, clique no botão Mais da pasta e escolha Ordenar por, ou defina \"Ordenar notas por\" em Notas, Ajustes para todas as pastas. Uma pasta ordenada por título não pode ser agrupada por data.",
  ] },
  { q: "Dá para criar subpastas no app Notas?", a: [
    "Sim. Arraste uma pasta para cima de outra, no Mac ou no iPhone (no iPhone, mantenha o toque nela antes). As únicas pastas que não aceitam subpasta são a pasta Todas de uma conta e a pasta Notas.",
  ] },
  { q: "É melhor usar pastas ou etiquetas no app Notas?", a: [
    "As duas. Uma nota fica numa pasta só e pode ter várias etiquetas. A própria dica da Apple no Notas é usar pastas para áreas amplas, como trabalho, e etiquetas para assuntos específicos, como #impostos. Uma nota com etiqueta não pode ser bloqueada, então organize as notas bloqueadas por pasta.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="como-organizar-notas-iphone"
      intro={<>
        A maioria das bibliotecas do app Notas cresce do mesmo jeito: tudo cai na pasta Notas, ordenado pela última edição, até rolar a
        lista deixar de funcionar. Aqui está como organizar as notas no iPhone e no Mac com o que o Notas já tem, uma estrutura de pastas
        para copiar e uma faxina semanal que mantém tudo no lugar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#pastas", label: "Pastas" },
          { href: "#ordenar", label: "Ordenar" },
          { href: "#fixar", label: "Fixar" },
          { href: "#etiquetas", label: "Etiquetas e Pastas Inteligentes" },
          { href: "#estrutura", label: "Uma estrutura para copiar" },
          { href: "#links", label: "Links" },
          { href: "#faxina-semanal", label: "Faxina semanal" },
        ]}>
          <p>
            Crie algumas pastas amplas, com subpastas só onde uma pasta ficar cheia demais, e use etiquetas para assuntos que passam por
            várias pastas. Ordene cada pasta do jeito que você procura as coisas (por data de edição, data de criação ou título) e fixe as
            poucas notas que você abre todo dia. Depois, tire dez minutos por semana para arquivar o que caiu na pasta Notas.
          </p>
          <PostCta slug="pt/como-organizar-notas-iphone" path="/pt/blog/como-organizar-notas-iphone" position="answer" ui={ui.cta}
            title="Prefere não ter que arquivar?">
            <p>O Pinto Notes tem a cara do app Notas e funciona como ele. Conecte o ChatGPT ou o Claude, e eles movem as notas para as pastas certas, põem etiquetas e arrumam tudo quando você pedir.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="A lista de pastas do Notas no iPhone com o iOS 27: Quick Notes e Shared, pastas do iCloud como Notes, Gift Ideas, Grocery List e Sketches, e uma seção Tags embaixo."
        caption="Pastas para as áreas, etiquetas para os assuntos, as duas numa lista só. Imagem: Apple." />}
      faq={FAQ}
    >
      <h2 id="pastas">Pastas e subpastas</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Arquivo", "Nova Pasta"] },
        { on: "iPhone", steps: ["Pastas", "Nova Pasta"] },
      ]} />
      <p>
        No Mac, selecione uma pasta na conta que você quer, escolha Arquivo, Nova Pasta e digite um nome. No iPhone, toque em Nova Pasta na
        lista de pastas. Para criar uma subpasta, arraste uma pasta para cima de outra (no iPhone, mantenha o toque nela antes). Arraste
        para fora de novo para desfazer. A pasta Todas e a pasta Notas não aceitam subpastas, então monte a sua estrutura ao lado delas.
      </p>
      <p>
        Para mover uma nota no Mac, arraste a nota para uma pasta da barra lateral, ou clique nela com a tecla Control pressionada e escolha
        Mover para. Segure Option ao soltar para copiar em vez de mover. No iPhone, passe o dedo para a esquerda sobre a nota e toque no
        botão de pasta, ou mantenha a nota pressionada e toque em Mover.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="O Notas no iPhone com o iOS 27 no modo de seleção: 3 Selected, três notas marcadas e um botão Folder embaixo à esquerda para mover as notas."
        caption="Para arquivar várias notas de uma vez: Selecionar Notas e depois o botão de pasta. Imagem: Apple." />
      <p>
        Para uma pilha de notas no iPhone, abra a pasta, toque no botão Mais, depois em Selecionar Notas, marque as notas e toque no botão
        de pasta. Apagar uma pasta manda as notas dela para a pasta Apagadas, onde ficam por 30 dias, então um apagão por engano tem
        volta.
      </p>

      <h2 id="ordenar">Ordene as notas por data ou título</h2>
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Os ajustes gerais do app Notas num Mac com o macOS 26: Sort notes by em Date Edited, New notes start with em Title e Default account no iCloud, a conta que a Siri usa para criar notas." }}
        ground="sky" caption="Notas, Ajustes num Mac com o macOS 26. &ldquo;Ordenar notas por&rdquo; define a ordem de todas as pastas." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Notas", "Ajustes", "Ordenar notas por"] },
        { on: "Mac, uma pasta", steps: ["Botão Mais", "Ordenar por"] },
        { on: "iPhone, uma pasta", steps: ["Botão de ações da pasta", "Ordenar por"] },
        { on: "iPhone, todas as pastas", steps: ["Ajustes", "Apps", "Notas", "Ordenar Notas por"] },
      ]} />
      <p>
        Uma pasta pode ser ordenada por Data de Edição, Data de Criação ou Título. Título é como você ordena as notas em ordem alfabética, e
        combina com uma pasta de notas de consulta, como receitas ou manuais. Data de Edição combina com uma pasta de trabalho, onde o que
        você mexeu por último é o que você quer em seguida. No iPhone, Ordenar por também oferece Mais Antiga Primeiro para data e
        Decrescente para título.
      </p>
      <p>
        A ordem definida numa pasta vale só para ela. No Mac, as pastas Todas e a pasta Apagadas sempre seguem o padrão dos Ajustes. O Notas
        também agrupa a lista por datas como Hoje e Ontem; desative isso com Agrupar por Data no mesmo menu. Uma pasta ordenada por título
        não pode ser agrupada por data.
      </p>

      <h2 id="fixar">Fixe as notas que você abre todo dia</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Arquivo", "Fixar Nota"] },
        { on: "iPhone", steps: ["Mantenha a nota pressionada", "Fixar Nota"] },
      ]} />
      <p>
        Uma nota fixada fica no topo da pasta, qualquer que seja a ordem. No Mac, você também pode deslizar para a direita com dois dedos e
        clicar no alfinete, ou arrastar uma nota entre as seções Fixadas e Notas. No iPhone, passe o dedo para a direita e toque no
        alfinete. A nota fixada aparece assim em todos os aparelhos com a mesma Conta Apple. Isso exige notas do iCloud ou notas guardadas
        no Mac.
      </p>
      <p>
        Fixe pouca coisa. Duas ou três por pasta bastam: a lista de compras da vez, o plano da semana e uma nota de índice da pasta (mais
        sobre isso abaixo).
      </p>

      <h2 id="etiquetas">Etiquetas e Pastas Inteligentes</h2>
      <p>
        Uma nota fica numa pasta só, mas pode ter várias etiquetas. Digite # e uma palavra, como #impostos, em qualquer lugar da nota. A
        própria dica da Apple no Notas é pastas para áreas amplas e etiquetas para assuntos, e funciona: um recibo vai para Dinheiro com
        #impostos, e uma nota sobre o contador vai para Trabalho, também com #impostos.
      </p>
      <p>
        Uma Pasta Inteligente é um filtro salvo que lista notas de todas as pastas por regras como Etiquetas, Data de Edição ou
        Checklists. Três valem a pena para a faxina semanal abaixo: Sem etiqueta (uma regra de Etiquetas que mostra só as notas sem
        etiqueta), Esta semana (Data de Edição nos últimos 7 dias) e Tarefas abertas (Checklists com itens não marcados). As notas ficam
        onde estão. Todas as regras, e por que às vezes uma etiqueta não se forma, estão no guia{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês). Um detalhe: uma
        nota com etiqueta não pode ser bloqueada.
      </p>

      <h2 id="estrutura">Uma estrutura de pastas simples para copiar</h2>
      <p>
        Comece com pastas para os lugares onde você procuraria, e só crie uma subpasta quando uma pasta ficar comprida demais para ler de
        relance. Dois níveis bastam para quase todo mundo.
      </p>
      <ul>
        <li><strong>Notas.</strong> A pasta que já vem no app, usada como caixa de entrada. Anote aqui e arquive depois.</li>
        <li><strong>Casa.</strong> A casa, o carro, manuais e garantias.</li>
        <li><strong>Dinheiro.</strong> Orçamentos, recibos, assinaturas. Ponha #impostos em tudo o que for para a declaração do imposto de renda.</li>
        <li><strong>Saúde.</strong> Consultas, remédios, treino.</li>
        <li><strong>Trabalho.</strong> Com as subpastas Projetos, Reuniões e Consulta, se ficar cheio.</li>
        <li><strong>Viagens.</strong> Uma nota por viagem.</li>
        <li><strong>Receitas.</strong> Ordenada por título.</li>
        <li><strong>Ideias.</strong> Tudo o que você quer retomar.</li>
        <li><strong>Arquivo morto.</strong> Projetos concluídos e viagens antigas, fora do caminho e ainda na busca.</li>
      </ul>
      <p>
        Organizar o app Notas para o trabalho segue o mesmo padrão. Dê a cada projeto uma subpasta dentro de Trabalho, e ponha uma etiqueta
        para um cliente em várias pastas, como #acme. Reuniões ficam mais fáceis com uma nota por reunião, sempre no mesmo formato, que é o
        que o modelo de <a href="/pt/blog/ata-de-reuniao-notas-iphone">ata de reunião no Notas do iPhone</a> dá a você. Mais notas para
        colar estão no guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="links">Ligue as notas num índice</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Editar", "Adicionar Link"], keys: "⌘K" },
        { on: "iPhone", steps: ["menu de edição", "Adicionar Link"] },
      ]} />
      <p>
        As pastas ordenam as notas por data ou título. Uma nota de índice ordena por sentido. Faça uma nota para cada pasta movimentada,
        por exemplo Índice do trabalho, com um cabeçalho para cada projeto e um link para cada nota embaixo, e fixe a nota. Para criar o
        link, selecione o texto, escolha Adicionar Link e escolha a nota, ou digite <code>&gt;&gt;</code> e o título da nota. No iOS 27 e
        no macOS 27, um link também pode ir para um cabeçalho dentro de uma nota, o que o guia{" "}
        <a href="/blog/apple-notes-ios-27" hrefLang="en">do que há de novo no app Notas</a> (em inglês) explica.
      </p>

      <h2 id="faxina-semanal">Uma faxina semanal de dez minutos</h2>
      <p>
        Uma vez por semana (domingo à noite funciona), passe pela caixa de entrada e pelas três Pastas Inteligentes. Cole esta checklist numa
        nota e fixe a nota.
      </p>
      <Keep title="Faxina semanal para o app Notas" text={TIDY} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com o macOS 27, Editar, Colar como Markdown transforma as linhas numa checklist. No iPhone, digite as linhas, selecione e
        toque no botão de checklist. Quando terminar, clique na lista e escolha Formatar, Mais, Desmarcar Tudo, e ela está pronta para a
        próxima semana.
      </p>

      <h2 id="limites">Onde a organização do app Notas para</h2>
      <ul>
        <li><strong>Arquivar é à mão.</strong> Cada nota da caixa de entrada espera você mover.</li>
        <li><strong>As etiquetas são postas à mão</strong>, uma nota ou um grupo selecionado de cada vez.</li>
        <li><strong>As notas de índice ficam velhas.</strong> Uma nota nova só entra no índice quando você adiciona o link dela.</li>
        <li><strong>A busca acha palavras, não respostas.</strong> Ela acha todas as notas que dizem &ldquo;cozinha&rdquo;. Não diz qual delas decidiu o orçamento.</li>
      </ul>
      <p>
        Para algumas centenas de notas, pastas, notas fixadas e uma faxina semanal bastam. Passando disso, arrumar vira o trabalho, e ele
        fica com você.
      </p>

      <h2 id="pinto-notes">Notas que se arquivam sozinhas</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, com pastas, subpastas, notas fixadas e busca em cada
        palavra. Com o ChatGPT ou o Claude conectados, eles podem fazer a faxina por você. Peça &ldquo;arquive tudo o que está em Notas nas
        pastas certas&rdquo;, &ldquo;põe a etiqueta em toda nota sobre a reforma da cozinha&rdquo; ou &ldquo;move minhas viagens que já
        acabaram para Arquivo morto&rdquo;, e as notas mudam de lugar. Você ainda pode arquivar e editar tudo sozinho, e cada versão anterior de
        uma nota fica guardada. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um
        minuto.
      </p>
      <p>
        Para o hábito semanal, o modelo grátis de <a href="/templates/weekly-review">revisão semanal</a> faz a sua IA fazer cinco perguntas
        no domingo e escrever a semana numa nota, a semana mais nova em cima, com as suas três prioridades da próxima semana numa checklist.
        Há mais em <a href="/templates">modelos</a>. O app está em inglês.
      </p>
      <p>
        As notas que você já tem no app Notas vêm numa <a href="/blog/move-from-apple-notes" hrefLang="en">importação só no seu Mac</a>{" "}
        (em inglês), com as pastas, e o app Notas não muda.
      </p>
    </LocalPostPage>
  );
}
