import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-para-estudar");

// Brazilian Portuguese version of /blog/apple-notes-for-school (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apdb5106e334/mac ("Grave e transcreva áudio no app Notas no Mac": Gravar Áudio, editar
// a nota durante a gravação, Buscar na Transcrição, Adicionar Transcrição à Nota, clicar no texto para ouvir, Mac com M1 ou
// posterior, idiomas compatíveis incluindo português, apagar a gravação exclui a transcrição, o resumo com a Apple
// Intelligence), iPhone guide iphbe11247b5 ("Grave e transcreva áudio no app Notas do iPhone": Gravar Áudio, deslize para baixo
// desde a parte superior da tela, iPhone 12 e posteriores, Resumo, iPhone 15 Pro ou posterior, não disponível em todos os
// idiomas ou regiões), iph653f28965 ("Escaneie texto e documentos": Escanear Documentos, captura automática nas bordas da
// página, salvo como PDF, Escanear Texto), iphb8628c6b8 (a busca acha manuscritos e documentos escaneados), Mac guide
// apdd655f4242 (um documento escaneado se chama Documentos Escaneados, "Renomear Anexo"), apd558a85438 (Arquivo > Nova Pasta,
// arrastar uma pasta para cima de outra) and iPhone ipha61270292 (Nova Pasta, "Fixar Nota"), apda85974595 ("Resolva cálculos
// no app Notas do Mac": (27/3)^2=, a ordem padrão das operações, variáveis definidas acima, Return insere a resposta, Formatar >
// Resultados de Cálculos: Inserir Resultados, Sugerir Resultados, Desativado; variables must use the Latin alphabet, so the
// example names have no accents), apd4e6e2c9a6 and iphe4d04f674 (Compartilhar um Link, Compartilhar Pasta, editar ou só ver,
// Enviar uma Cópia, Conta Apple e Notas ativado no iCloud, sem notas bloqueadas, notas adicionadas a uma pasta compartilhada são
// compartilhadas, @ e o nome). Colar como Markdown, Adicionar Link, Duplicar Nota, Formatar > Tabela, Transcrição and Resumo
// are the pt_BR strings in Notes on macOS 27.2, as the earlier pt posts use them; the Smart Folder rule "Checklists com itens
// não marcados" follows ata-de-reuniao-notas-iphone. Apple's pt-BR pages name no attachments or transcription button, so the
// post says "o botão de anexos" and "o botão de transcrição". Slug and title from Google autocomplete (pt-BR, 21 Nov): "app de
// notas para estudar", "melhor app de notas para estudar", "como usar o notas do iphone para transcrever audio", "como usar o
// notas do iphone para escanear documentos", "como estudar pelo iphone"; nothing for "notas iphone para estudar", "notas
// iphone escola" or "notas iphone faculdade", so the slug pairs the app's common name with "para estudar". The class and
// lecture notes, timetable and sums are translated. Pinto's template names (Cornell notes, Study notes and flashcards, Cue,
// Notes, Cues to revisit) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

const CLASS_NOTE = `# Biologia

## Esta semana
- [ ] Ler o capítulo 4
- [ ] Relatório de laboratório sobre enzimas
- [ ] Flashcards de respiração celular

## Aulas
- Respiração celular, 3 de novembro
- Fotossíntese, 10 de novembro

## Provas
- Prova parcial, 12 de dezembro
`;

const LECTURE = `# Respiração celular, 3 de novembro

## Anotações
- A glicose é quebrada para produzir ATP, a energia da célula.
- Três etapas: glicólise, ciclo de Krebs, cadeia transportadora de elétrons.
- A maior parte do ATP vem da cadeia transportadora de elétrons, nas mitocôndrias.

## Para perguntar
- [ ] Em que parte da célula acontece a glicólise?

## Resumo
A glicose vira ATP em três etapas, e a maior parte dele é produzida nas mitocôndrias.
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TIMETABLE = `Dia\tMatéria\tSala
Segunda\tBiologia\tLab 2
Terça\tEconomia\tAuditório B
Quinta\tBiologia\tLab 2
Sexta\tEconomia\tSala 14
`;

const MATH = `km = 120
horas = 2
km / horas =
`;

const FAQ = [
  { q: "O app Notas é bom para estudar?", a: [
    "Para fazer e guardar anotações, sim. Ele é grátis no iPhone e no Mac, escaneia apostilas, grava aulas com transcrição e faz contas. É mais fraco para revisar: não tem modelos, flashcards nem testes, e uma nota compartilhada exige uma Conta Apple de todo mundo do grupo.",
  ] },
  { q: "O app Notas grava uma aula e transcreve?", a: [
    "Sim. Numa nota, abra o menu de anexos e escolha Gravar Áudio. O Notas escreve uma transcrição ao vivo em idiomas compatíveis, como o português, num iPhone 12 ou posterior ou num Mac com M1 ou posterior, e a Apple Intelligence pode resumir onde estiver disponível.",
  ] },
  { q: "Dá para revisar para as provas no app Notas?", a: [
    "Em parte. Uma tabela de duas colunas funciona como flashcards: uma pergunta à esquerda, a resposta à direita, e você cobre a coluna da direita para se testar. Nada agenda as suas revisões nem lembra quais cartões você errou.",
  ] },
  { q: "Dá para compartilhar notas do app Notas com os colegas?", a: [
    "Sim, uma nota ou uma pasta inteira, com Compartilhar um Link. Todo mundo precisa de uma Conta Apple com o Notas ativado no iCloud, e uma nota bloqueada não pode ser compartilhada. Para os outros, Enviar uma Cópia manda uma cópia que eles podem ler mas não editar.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="notas-iphone-para-estudar"
      intro={<>
        O app Notas já está no seu iPhone e no seu Mac, então é onde muita anotação da escola ou da faculdade acaba parando de qualquer
        jeito. Aqui está uma resposta sincera sobre se ele dá conta dos estudos, e depois uma organização que dura o semestre inteiro, de
        uma pasta por matéria até notas compartilhadas com o grupo de estudo.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#e-bom", label: "Ele é bom para estudar?" },
          { href: "#pastas", label: "Uma pasta por matéria" },
          { href: "#aulas", label: "Uma nota por aula" },
          { href: "#gravar", label: "Grave uma aula" },
          { href: "#revisar", label: "Método Cornell e flashcards" },
          { href: "#grupo", label: "Grupos de estudo" },
          { href: "#pinto-notes", label: "Notas que testam você" },
        ]}>
          <p>
            Sim, para fazer e guardar anotações, principalmente se o seu grupo de estudo também usa iPhone e Mac. Ele é grátis, escaneia
            apostilas, grava aulas com transcrição e faz contas. Onde ele deixa a desejar é na revisão: sem modelos, flashcards ou testes,
            então você monta isso sozinho.
          </p>
          <PostCta template="study-flashcards" slug="pt/notas-iphone-para-estudar" path="/pt/blog/notas-iphone-para-estudar" position="answer" ui={ui.cta}
            title="Quer anotações que testam você?">
            <p>O Pinto Notes funciona como o app Notas e tem modelos grátis de método Cornell e de flashcards. Cole as anotações da aula no ChatGPT ou no Claude e ele escreve as perguntas e depois testa você.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="e-bom">O app Notas é bom para estudar?</h2>
      <p>
        Para registrar as coisas, é muito bom. Ele é grátis, uma nota que você digita no Mac aparece no iPhone pelo iCloud, e a busca acha
        palavras em notas digitadas, em texto escrito à mão e em páginas escaneadas. Ele escaneia uma apostila em PDF, grava uma aula e
        escreve o que foi dito, e dá o resultado de uma conta quando você digita um sinal de igual.
      </p>
      <p>
        Para revisar, ele oferece menos. Não tem modelos, não tem flashcards e não tem nada que faça perguntas para você ou lembre o que
        você errou. As tabelas não ordenam nem somam. Um grupo de estudo só consegue trabalhar numa nota se todo mundo tiver uma Conta
        Apple. Se o seu curso é quase todo de decorar, como medicina, faça as anotações no Notas e planeje as revisões em algum lugar que
        agende isso.
      </p>

      <h2 id="pastas">Uma pasta por matéria</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="A lista de pastas do Notas no iPhone com o iOS 27: Quick Notes e Shared, pastas do iCloud como Notes, Gift Ideas e Grocery List, e uma seção Tags embaixo."
        caption="A lista de pastas no iPhone. Cada matéria ganha uma pasta aqui. Imagem: Apple." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Arquivo", "Nova Pasta"] },
        { on: "iPhone", steps: ["Lista de pastas", "Nova Pasta"] },
      ]} />
      <p>
        Crie uma pasta para cada matéria. Para manter um semestre junto, crie uma pasta para o semestre e arraste cada pasta de matéria para
        cima dela, o que transforma as matérias em subpastas. No semestre seguinte, comece uma nova e as matérias antigas ficam fora do
        caminho.
      </p>
      <p>
        Em cada pasta, mantenha uma nota da matéria com o que tem para entregar e uma lista das aulas, e fixe essa nota para ela ficar no
        topo (no iPhone, mantenha a nota pressionada e toque em Fixar Nota). Selecione o nome de uma aula e escolha Editar, Adicionar Link
        (Command + K) para ligar o nome à nota daquela aula.
      </p>
      <Keep title="Nota da matéria para o app Notas" text={CLASS_NOTE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <p>
        Num Mac com o macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e as
        tarefas numa checklist. Deixe uma palavra em cada linha da checklist, porque um item vazio não sobrevive à colagem. Uma Pasta
        Inteligente com a regra Checklists com itens não marcados lista então todas as notas com algo para marcar, inclusive as tarefas de
        casa; o guia <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês)
        mostra como criar uma.
      </p>

      <h2 id="aulas">Uma nota por aula</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="A parte de baixo do menu File do Notas no macOS 27: Export To, Pin Note, Lock Note, Duplicate Note com Command-D, destacado, e Print."
        caption="Arquivo, Duplicar Nota começa a próxima aula a partir da última." />
      <p>
        Dê a cada aula uma nota própria, com o assunto e a data no título. Notas curtas são mais fáceis de achar e de revisar do que uma
        nota comprida por matéria. No Mac, Arquivo, Duplicar Nota (Command + D) copia a nota da semana passada com os cabeçalhos, pronta
        para limpar e preencher.
      </p>
      <Keep title="Nota de aula para o app Notas" text={LECTURE} copyLabel={ui.copy} />
      <p>
        Na aula, escreva só embaixo de Anotações. As dúvidas vão em Para perguntar, numa checklist, para você marcar quando tiver a
        resposta. Escreva o resumo na mesma noite, em duas ou três frases com as suas palavras.
      </p>

      <h2 id="escanear">Escaneie as apostilas na nota da aula</h2>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Botão de anexos", "Escanear Documentos"] }]} />
      <p>
        Abra a nota da aula no iPhone, toque no botão de anexos, depois em Escanear Documentos, e mantenha a página na tela. O iPhone tira
        a foto quando encontra as bordas da página. Escaneie as outras páginas, toque no botão para terminar, e a apostila fica salva na
        nota como PDF. Depois, a busca acha as palavras dela. Para um trecho só de um livro, Escanear Texto, no mesmo menu, digita o texto
        na nota.
      </p>
      <p>
        Um documento escaneado se chama Documentos Escaneados. No Mac, clique na seta ao lado do nome e escolha Renomear Anexo para chamar
        de &ldquo;Apostila da semana 3&rdquo;.
      </p>

      <h2 id="gravar">Grave uma aula, com transcrição e resumo</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Botão de anexos", "Gravar Áudio"] },
        { on: "iPhone", steps: ["Botão de anexos", "Gravar Áudio"] },
      ]} />
      <p>
        Pergunte ao professor antes: muitas escolas e faculdades têm regras sobre gravar aulas. Depois abra a nota da aula, escolha Gravar
        Áudio no menu de anexos e toque no botão de gravar. Você pode continuar digitando enquanto grava (no iPhone, deslize para baixo
        desde a parte superior da tela para voltar à nota).
      </p>
      <p>
        Depois, abra a gravação e clique no botão de transcrição para ler o que foi dito. Clique numa frase para ouvir aquele momento. O
        botão de mais opções tem Buscar na Transcrição, para o trecho em que a prova foi mencionada, e Adicionar Transcrição à Nota.
        Depois clique em Resumo e a Apple Intelligence escreve um resumo curto da transcrição.
      </p>
      <p>
        A transcrição exige um iPhone 12 ou posterior ou um Mac com M1 ou posterior, num idioma compatível, e o português é um deles. O
        resumo exige a Apple Intelligence, o que no iPhone quer dizer um iPhone 15 Pro ou posterior, e ela não está disponível em todos os
        idiomas ou regiões. Apagar uma gravação apaga também a transcrição.
      </p>

      <h2 id="tabelas">Tabelas para o horário ou a lista de leitura</h2>
      <PostFigure src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="Uma nota chamada Reading list no app Notas do macOS 27, com uma tabela de três colunas, Book, Author e Started, e quatro livros. Os títulos longos quebram dentro das células."
        caption="Uma tabela no app Notas do macOS 27. O Notas escolhe a largura das colunas." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Botão Tabela"] },
      ]} />
      <Keep title="Horário de aulas para o app Notas" text={TIMETABLE} copyLabel={ui.copy}
        note="Cada linha tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />
      <p>
        Cole o horário numa nota nova, selecione as cinco linhas e toque no botão Tabela. Cada Tab vira uma coluna. Tab na última célula
        adiciona uma linha. As tabelas do Notas não ordenam, não somam e não mudam a largura de uma coluna, então digite os prazos já em
        ordem de data. O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) cobre o resto.
      </p>

      <h2 id="revisar">Método Cornell e flashcards</h2>
      <p>
        Uma tabela de duas colunas também é o jeito mais simples de revisar no Notas. Para o método Cornell, ponha uma pergunta curta à
        esquerda, sua anotação à direita e um resumo embaixo da tabela; cubra a coluna da direita e responda em voz alta. O{" "}
        <a href="/pt/blog/metodo-cornell-notas-iphone">método Cornell no Notas do iPhone</a> tem um modelo para colar.
      </p>
      <p>
        Os flashcards funcionam do mesmo jeito: uma linha por cartão, pergunta e resposta. O que o Notas não faz é decidir quais cartões você
        vê hoje, nem trazer de volta os que você errou. O guia de <a href="/pt/blog/flashcards-notas-iphone">flashcards no Notas do
        iPhone</a> mostra o formato e os jeitos de contornar isso.
      </p>

      <h2 id="contas">Resultados de Cálculos para as contas da lição</h2>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Uma nota chamada Sequoia Group Expenses no iPhone: cada gasto com nome na sua linha, os nomes somados em US$ 475, e US$ 475 dividido por 5 dando US$ 95 para cada um."
        caption="O próprio exemplo da Apple de Resultados de Cálculos no iPhone: dê nome aos números e depois use os nomes. Imagem: Apple." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Formatar", "Resultados de Cálculos"] }]} />
      <p>
        Digite uma conta e um sinal de igual, como (27/3)^2=, e o Notas sugere a resposta; pressione Return para manter. O Notas segue a
        ordem padrão das operações, então ponha parênteses onde precisar. Você também pode dar nome a um número numa linha de cima e usar o
        nome:
      </p>
      <Keep title="Números com nome para Resultados de Cálculos" text={MATH} copyLabel={ui.copy}
        note="O Notas oferece a resposta depois do último sinal de igual. Mude um número lá em cima e a resposta acompanha." />
      <p>
        Formatar, Resultados de Cálculos escolhe se as respostas são inseridas, sugeridas ou desativadas. Ele dá a resposta, não as
        contas, então serve melhor para conferir um resultado.
      </p>

      <h2 id="grupo">Compartilhe notas com o grupo de estudo</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Botão Compartilhar", "Menu pop-up", "Compartilhar um Link"] },
        { on: "iPhone", steps: ["Botão Compartilhar", "Menu abaixo do título", "Compartilhar Link"] },
      ]} />
      <p>
        Compartilhar um Link convida as pessoas para trabalhar na mesma nota, e todo mundo vê as alterações na hora. Escolha se elas podem
        editar ou só ver. Para compartilhar uma matéria inteira, clique na pasta dela com a tecla Control pressionada no Mac e escolha
        Compartilhar Pasta, ou abra a pasta no iPhone e toque no botão Compartilhar. Toda nota que você adiciona a uma pasta compartilhada
        fica compartilhada com todos nela, então guarde as suas notas pessoais em outro lugar. Digite @ e um nome para avisar alguém de que
        você precisa da pessoa.
      </p>
      <p>
        Todo mundo precisa de uma Conta Apple com o Notas ativado no iCloud, e notas bloqueadas não podem ser compartilhadas. Para um colega
        sem Conta Apple, Enviar uma Cópia, no mesmo menu, manda uma cópia que ele pode ler mas não editar.
      </p>

      <h2 id="limites">Onde o app Notas para nos estudos</h2>
      <ul>
        <li><strong>Cada nota é montada à mão.</strong> Não há modelos, então cada nota de matéria e de aula é colada ou duplicada.</li>
        <li><strong>Nada testa você.</strong> Cobrir uma coluna funciona, mas o Notas não faz as perguntas, não marca pontos e não traz de volta o que você errou.</li>
        <li><strong>As tabelas só guardam texto.</strong> Não dá para ordenar uma lista de prazos nem somar notas numa tabela.</li>
        <li><strong>Grupos precisam de Conta Apple.</strong> Um colega com outro tipo de celular recebe uma cópia, não a nota compartilhada.</li>
      </ul>

      <h2 id="pinto-notes">Anotações que testam você</h2>
      <Figure shot={{ ...SHOTS.flashcardsApp, alt: "O app de flashcards numa nota do Pinto Notes no Mac: 8 cartões para hoje, botões de assunto, um botão Study now, uma sequência de 11 dias com um calendário, o que vem nesta semana e quantos cartões há em cada caixa." }}
        caption="O modelo Study notes and flashcards no Pinto Notes no Mac, com dados de exemplo." />
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas notas
        a partir da conversa que você já usa. Dois dos modelos grátis dele são feitos para revisar, e um toque adiciona qualquer um dos dois
        às suas notas.
      </p>
      <p>
        O modelo <a href="/templates/cornell-notes">Cornell notes</a> guarda uma seção por aula com uma tabela Cue e Notes e um resumo.
        Cole as anotações da aula na sua IA e ela escreve uma pergunta para cada linha e o resumo. Diga &ldquo;me testa em oferta e
        demanda&rdquo; e ela faz as perguntas uma de cada vez sem mostrar as anotações, e depois guarda as que você errou em Cues to
        revisit.
      </p>
      <p>
        O modelo <a href="/templates/study-flashcards">Study notes and flashcards</a> é um pequeno app dentro de uma nota. Cole um capítulo
        e a sua IA faz de cinco a dez cartões com ele. Diga &ldquo;me testa em biologia, dez cartões&rdquo; e ela pergunta um cartão de
        cada vez, os que você sabe menos primeiro, e diz se você acertou. Os cartões que você erra voltam mais cedo, e os que você sabe
        esperam mais. Você pode adicionar, editar e apagar cartões no app sozinho, e cada versão anterior de uma nota fica guardada. A parte
        da IA funciona depois que você{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecta o ChatGPT</a> (em inglês) ou o Claude, o que leva um minuto. O
        app está em inglês.
      </p>
      <p>
        As anotações de aula que você já tem no app Notas vêm numa{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">importação só no seu Mac</a> (em inglês), e o app Notas não muda.
      </p>
    </LocalPostPage>
  );
}
