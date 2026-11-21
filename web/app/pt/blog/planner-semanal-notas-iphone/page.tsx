import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "planner-semanal-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-planner-template (21 Nov 2026). The English post's Apple Notes facts come
// from earlier posts tried in Notes on macOS 27; the pt-BR names are the ones the earlier pt template posts verified: Editar >
// Colar como Markdown (new in macOS 27; # and ## lines become a title and headings, "- [ ]" lines a checklist, an empty item
// doesn't survive), Arquivo > Duplicar Nota, Formatar > Mais > Desmarcar Tudo, Editar > Adicionar Link and Fixar Nota are the
// pt_BR strings in Notes on macOS 27.2; "Ordenar automaticamente os itens marcados" is the pt_BR string in Notes Settings on
// macOS 27.2 and the wording of support.apple.com/pt-br/guide/notes/apd93c815aa0/mac (read 21 Nov); the Smart Folder rule
// "Checklists com itens não marcados" follows ata-de-reuniao-notas-iphone; pinning a note to the top of its folder is from
// support.apple.com/pt-br/guide/iphone/ipha61270292/ios (read 21 Nov). Slug and title from Google autocomplete (pt-BR, 21 Nov):
// "planner semanal iphone", "planner semanal notas", "planner semanal bloco de notas", "modelo de planner semanal", "planner
// iphone", "agenda notas iphone", "lista de tarefas iphone"; nothing for "planner notas iphone" or "planner no notas do
// iphone". The templates are translated (24-hour times, local names). The Pinto template's own labels (Weekly planner, Top
// three this week, Later) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

const WEEKLY = `# Semana de 16 de novembro

## Três prioridades da semana
- [ ] Enviar o orçamento do 4º trimestre para o Jonas
- [ ] Comprar as passagens para casa no Natal
- [ ] Correr três vezes

## Segunda
- [ ] Reunião do time às 9h
- [ ] Terminar o rascunho do orçamento

## Terça
- [ ] Dentista às 8h30
- [ ] Correr 5 km

## Quarta
- [ ] Ligar para a mãe
- [ ] Devolver a encomenda

## Quinta
- [ ] Marcar a revisão do carro
- [ ] Jantar com a Sara às 19h

## Sexta
- [ ] Buscar a roupa na lavanderia

## Sábado
- [ ] Feira

## Domingo
- [ ] Planejar a próxima semana

## Depois
- [ ] Renovar o passaporte
- [ ] Consertar o farol da bicicleta
`;

const DAILY = `# Hoje

## Três prioridades
- [ ] Terminar o rascunho do orçamento
- [ ] Ligar para a mãe
- [ ] Correr 5 km

## Manhã
- [ ] Reunião do time às 9h
- [ ] Responder o e-mail do Jonas

## Tarde
- [ ] Revisar os slides da Emma
- [ ] Buscar a roupa na lavanderia

## Noite
- [ ] Jantar com a Sara às 19h

## Amanhã
- [ ] O que não deu para fazer hoje
`;

const FAQ = [
  { q: "O app Notas tem modelo de planner?", a: [
    "Não. O app Notas não tem modelos. Uma nota por semana, com um cabeçalho para cada dia e as tarefas do dia numa checklist, funciona como planner, e você pode colar direto o modelo desta página.",
  ] },
  { q: "Como usar o app Notas como planner?", a: [
    "Mantenha uma nota por semana numa pasta Planner e fixe a nota desta semana no topo. Ponha as três prioridades primeiro, cada tarefa embaixo do seu dia e o que não tem dia em Depois. No domingo, duplique a nota para a próxima semana e passe o que ficou.",
  ] },
  { q: "Dá para fazer um planner diário no Notas do iPhone?", a: [
    "Sim. Digite os cabeçalhos e as tarefas, selecione as tarefas e toque no botão de checklist. Colar como Markdown fica no Mac, então o jeito mais rápido é colar o modelo no Mac e deixar a nota sincronizar com o iPhone.",
  ] },
  { q: "Existe um app de planner que funciona como o app Notas?", a: [
    "O Pinto Notes tem a cara do app Notas e funciona como ele, e tem um modelo grátis de planner semanal. Diga ao ChatGPT ou ao Claude o que tem nesta semana e ele põe cada tarefa embaixo do seu dia e mantém as suas três prioridades.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="planner-semanal-notas-iphone"
      intro={<>
        Muita gente planeja a semana no app Notas: uma lista por dia, algumas coisas que importam mais e uma pilha de coisas para outro
        momento. Funciona bem quando toda semana tem a mesma cara. Aqui está um modelo de planner semanal para colar no app Notas, uma
        versão diária, como tocar uma semana com ele e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#semanal", label: "O planner semanal" },
          { href: "#diario", label: "Um planner diário" },
          { href: "#como-usar", label: "O Notas como planner" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Uma semana planejada para você" },
        ]}>
          <p>
            O app Notas não tem modelo de planner, mas uma nota por semana resolve: as três prioridades no topo, um cabeçalho para cada dia
            com as tarefas daquele dia numa checklist e uma lista Depois para o resto. Cole o modelo semanal abaixo numa nota nova, ou o
            diário se você planeja um dia de cada vez.
          </p>
          <PostCta template="weekly-planner" slug="pt/planner-semanal-notas-iphone" path="/pt/blog/planner-semanal-notas-iphone" position="answer" ui={ui.cta}
            title="Quer a semana planejada para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um planner semanal grátis. Diga ao ChatGPT ou ao Claude o que tem na semana e ele põe cada tarefa embaixo do seu dia e mantém as suas três prioridades.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="Uma nota Weekly planner no Pinto Notes no Mac: uma checklist Top three this week com um item marcado, um cabeçalho para cada dia de segunda a domingo com as tarefas do dia numa checklist, os dias até sexta já marcados e uma lista Later."
        caption="Uma semana no Pinto Notes, planejada com o modelo de planner semanal. O mesmo formato funciona no app Notas. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="semanal">O modelo de planner semanal</h2>
      <p>
        Uma nota guarda a semana inteira. As três prioridades vêm primeiro, então são a primeira coisa que você vê ao abrir. Cada dia ganha
        um cabeçalho e a própria checklist, e Depois guarda o que ainda não tem dia, para não lotar a segunda. Troque as tarefas pelas suas
        antes de colar, e deixe uma palavra em cada linha, porque um item vazio de checklist não sobrevive à colagem.
      </p>
      <Keep title="Planner semanal para o app Notas" text={WEEKLY} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com o macOS 27, Editar, Colar como Markdown transforma a linha com # no título, cada linha com ## num cabeçalho e as tarefas
        numa checklist. Um Command + V simples deixa os símbolos como texto. No iPhone, digite, selecione as tarefas e toque no botão de
        checklist.
      </p>

      <h2 id="diario">Uma versão de planner diário</h2>
      <p>
        Se você planeja um dia de cada vez, mantenha uma nota só chamada Hoje e fixe essa nota no topo da pasta. As três prioridades vêm
        primeiro de novo, depois o dia em três partes e uma lista Amanhã para o que não deu tempo de fazer.
      </p>
      <Keep title="Planner diário para o app Notas" text={DAILY} copyLabel={ui.copy} />
      <p>
        Toda manhã, apague o que você marcou ontem, suba as linhas de Amanhã para o dia e escolha três prioridades novas. Se algumas linhas
        se repetem todo dia, como uma corrida ou a caixa de entrada, clique na checklist e escolha Formatar, Mais, Desmarcar Tudo em vez de
        digitar de novo.
      </p>

      <h2 id="como-usar">Como usar o app Notas como planner</h2>
      <ul>
        <li>
          <strong>Uma nota por semana.</strong> Guarde as notas numa pasta Planner e fixe a nota desta semana no topo, para ela ficar a um
          toque no iPhone.
        </li>
        <li>
          <strong>Comece a próxima semana a partir desta.</strong> No domingo, escolha Arquivo, Duplicar Nota, mude a data no título, apague
          o que está marcado e passe o que ficou para segunda.
        </li>
        <li>
          <strong>Deixe o que está feito descer.</strong> Ative &ldquo;Ordenar automaticamente os itens marcados&rdquo;, e as tarefas
          marcadas descem para o fim de cada dia.
        </li>
        <li>
          <strong>Ache o que ainda está em aberto.</strong> Uma Pasta Inteligente com a regra Checklists com itens não marcados mostra
          todas as notas que ainda têm uma tarefa em aberto, em todas as suas pastas (mais no guia{" "}
          <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a>, em inglês).
        </li>
        <li>
          <strong>Ligue as coisas maiores.</strong> Selecione uma tarefa, escolha Editar, Adicionar Link (Command + K) e escolha a nota a
          que ela pertence, como a ata da reunião de segunda.
        </li>
      </ul>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Arquivo", "Duplicar Nota"] },
        { on: "Mac", steps: ["Editar", "Adicionar Link"], keys: "⌘K" },
      ]} />
      <p>
        O mesmo formato de uma nota por semana funciona para outras rotinas. O{" "}
        <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker no Notas</a> marca os hábitos dia a dia, o{" "}
        <a href="/pt/blog/cardapio-semanal-notas-iphone">cardápio semanal</a> planeja os jantares da semana, e o guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês) tem mais notas para colar.
      </p>

      <h2 id="limites">Onde um planner no Notas para</h2>
      <ul>
        <li><strong>Nada se move sozinho.</strong> Uma tarefa que você não fez na quarta fica na quarta até você recortar e colar embaixo de hoje.</li>
        <li><strong>Uma semana nova é à mão.</strong> Duplique a nota, mude a data, apague o que está feito e passe o resto. Pule isso uma vez e a semana continua na nota da semana passada.</li>
        <li><strong>O planejamento é com você.</strong> Uma lista de vinte coisas não se divide sozinha pelos dias, e as três prioridades não se escolhem sozinhas.</li>
        <li><strong>A busca acha palavras, não respostas.</strong> Ela acha o dentista. Não diz o que falta nesta semana nem o que vive sendo adiado.</li>
      </ul>
      <p>
        Para uma semana tranquila, uma nota e alguns minutos no domingo bastam. Para uma semana cheia, mover e organizar é o trabalho, e ele
        fica com você.
      </p>

      <h2 id="pinto-notes">Uma semana planejada para você</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas notas
        a partir da conversa que você já usa. O modelo grátis de <a href="/templates/weekly-planner">planner semanal</a> é uma nota com Top
        three this week, um cabeçalho para cada dia de segunda a domingo e Later.
      </p>
      <p>
        Diga à sua IA o que tem nesta semana, tudo numa mensagem só. Ela põe cada tarefa embaixo do seu dia numa checklist, guarda em Later o
        que não tem dia e mantém nas três prioridades as três coisas que você diz que importam mais. Peça para ela &ldquo;passar para hoje o
        que eu não terminei&rdquo; e as tarefas não marcadas dos dias anteriores vêm junto. No domingo, diga que começou uma semana nova:
        ela limpa o que está marcado, passa o que ficou para segunda e pergunta as três prioridades da próxima semana. Você ainda pode
        digitar e marcar tudo sozinho, e cada versão anterior de uma nota fica guardada. A parte da IA funciona depois que o ChatGPT ou o
        Claude estiverem conectados, e <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês)
        leva um minuto. O app está em inglês.
      </p>
      <p>
        Os planos que você já tem no app Notas vêm numa <a href="/blog/move-from-apple-notes" hrefLang="en">importação só no seu Mac</a>{" "}
        (em inglês), e o app Notas não muda.
      </p>
    </LocalPostPage>
  );
}
