import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "ata-de-reuniao-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-meeting-notes-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd58edc7964/mac "Use Pastas Inteligentes no app Notas do Mac" (Arquivo >
// Nova Pasta Inteligente, filtro Checklists, "todos ou qualquer um dos critérios"), apd93c815aa0/mac "Adicione listas
// no app Notas do Mac" (botão Checklist) and support.apple.com/pt-br/102462 "Se você não conseguir colaborar no app
// Notas" (Conta Apple). Editar > Colar como Markdown (new in macOS 27), Arquivo > Duplicar Nota, the Pastas filter,
// Etiquetas, Transcrição and Resumo are the pt_BR strings in Notes on macOS 27.2. Not verified: the pt-BR name of the
// Smart Folder option for unchecked items (Apple's pt-BR page shows only "Marcado"), so the text describes it instead
// of naming it. Slug and title from Google autocomplete (pt-BR, 21 Nov): "ata de reunião modelo", "ata de reunião
// exemplo", "anotações de reunião", "app para anotações de reunião", "pauta de reunião modelo"; nothing for "ata de
// reunião notas". Facts are the English post's.

const ui = UI.pt;

const TEMPLATE = `# Reunião de produto, 24 de novembro

Participantes: Sara, João, Ana

## Pauta
- Página de preços
- Design do checkout

## Anotações
- Vendas pediu os novos preços antes de dezembro
- Dois de três testadores não viram o total no checkout

## Decisões
- Continuam três planos, sem plano vitalício
- O total vai para cima dos dados do cartão

## Tarefas
- [ ] Sara: enviar os novos preços para vendas (sex)
- [ ] João: mudar o total de lugar no checkout (qua)
- [ ] Ana: ver as regras de imposto para vender no Chile (semana que vem)
`;

const FAQ = [
  { q: "O app Notas tem modelo de ata de reunião?", a: [
    "Não. O app Notas não tem modelos. Uma nota por reunião, com cabeçalhos para a pauta, as anotações, as decisões e as tarefas, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Como acompanho as tarefas das reuniões no app Notas?", a: [
    "Escreva as tarefas numa checklist com o nome da pessoa na frente. Depois crie uma Pasta Inteligente com duas regras, a sua pasta Reuniões e Checklists com itens não marcados, e toda reunião com algo em aberto aparece num lugar só.",
  ] },
  { q: "O app Notas grava e resume uma reunião?", a: [
    "Com a Apple Intelligence, uma gravação no Notas vira uma transcrição e um resumo. Ela não separa quem faz o quê e até quando; as tarefas você ainda escreve sozinho.",
  ] },
  { q: "Existe um app de ata de reunião que escreve as tarefas para mim?", a: [
    "O Pinto Notes tem um modelo grátis de ata de reunião. Cole suas anotações soltas ou uma transcrição no ChatGPT ou no Claude, e ele escreve o resumo, as decisões e cada tarefa com o responsável e a data.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="ata-de-reuniao-notas-iphone"
      intro={<>
        Uma ata de reunião só serve pela parte que quase todo mundo pula: o que foi decidido e quem faz o que depois. Aqui está um modelo
        de ata para o app Notas, um jeito de ver todas as tarefas em aberto num lugar só e onde o Notas deixa de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#tarefas", label: "Tarefas em aberto" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Uma ata que se escreve" },
        ]}>
          <p>
            O app Notas não tem modelo de ata de reunião, mas uma nota por reunião resolve: quem participou, a pauta, suas anotações, as
            decisões e as tarefas numa checklist com um nome em cada uma. Guarde as atas numa pasta Reuniões, e uma Pasta Inteligente mostra
            todas as tarefas que ainda estão em aberto.
          </p>
          <PostCta template="meeting-notes" slug="pt/ata-de-reuniao-notas-iphone" path="/pt/blog/ata-de-reuniao-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as tarefas escritas para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de ata de reunião. Cole suas anotações soltas no ChatGPT ou no Claude e ele escreve o resumo, as decisões e quem faz o quê.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/meeting-notes-note" width={1520} height={1110} maxWidth={620}
        alt="Uma nota Meeting notes no Pinto Notes no Mac: tarefas com um responsável e uma data em cada uma, uma delas marcada, e depois uma seção Pricing sync com um resumo de duas linhas e as decisões."
        caption="Atas de reunião no Pinto Notes: as tarefas em aberto no topo e cada reunião embaixo. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota por reunião</h2>
      <p>
        As decisões e as tarefas são as partes que você vai procurar depois, então elas ganham cabeçalhos próprios. Coloque um nome e um
        dia em cada tarefa; &ldquo;ver a questão do imposto&rdquo; sem responsável é como nada acontece. Deixe uma palavra em cada linha,
        porque um item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Ata de reunião para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
        { on: "Mac", steps: ["Arquivo", "Duplicar Nota"] },
      ]} />
      <ul>
        <li>
          <strong>Cole uma vez.</strong> Num Mac com macOS 27, crie uma nota e escolha Editar, Colar como Markdown. A linha com # vira o
          título, cada linha com ## um cabeçalho e as tarefas uma checklist. No iPhone, digite os cabeçalhos e toque no botão Checklist
          para as tarefas.
        </li>
        <li>
          <strong>Guarde uma cópia em branco.</strong> Apague as linhas de exemplo e guarde essa nota numa pasta Reuniões. Antes de cada
          reunião, escolha Arquivo, Duplicar Nota e mude o título.
        </li>
        <li>
          <strong>Use etiquetas nas reuniões fixas.</strong> Digite #semanal na nota de uma reunião e todas as reuniões semanais ficam a
          um toque na barra lateral.
        </li>
        <li>
          <strong>Grave se não der para digitar.</strong> Com a Apple Intelligence, uma gravação no Notas vira uma transcrição e um resumo.
          Copie as decisões e as tarefas de lá para o modelo.
        </li>
      </ul>

      <h2 id="tarefas">Veja todas as tarefas em aberto</h2>
      <Paths rows={[{ on: "Mac", steps: ["Arquivo", "Nova Pasta Inteligente"] }]} />
      <p>
        Tarefas espalhadas por vinte atas são tarefas que ninguém faz. No Mac, escolha Arquivo, Nova Pasta Inteligente, chame de Tarefas
        abertas e crie duas regras que precisam valer ao mesmo tempo: Pastas, com a sua pasta Reuniões, e Checklists, com a opção para os
        itens ainda não marcados. Toda reunião com algo em aberto fica nessa pasta, e uma reunião sai dela quando o último item é marcado.
      </p>
      <p>
        Se as pessoas da reunião também usam o app Notas, compartilhe a nota e permita que elas façam alterações, para cada pessoa marcar
        as próprias tarefas. Todo mundo precisa de uma Conta Apple. Para o fim da semana, o guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês) tem uma revisão semanal para colar,
        e o guia <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em inglês) passa por
        todas as regras que uma Pasta Inteligente pode usar.
      </p>

      <h2 id="limites">Onde uma ata de reunião no Notas para</h2>
      <ul>
        <li><strong>Passar a limpo é com você.</strong> Anotações soltas ou uma transcrição não viram decisões e responsáveis sozinhas.</li>
        <li><strong>Nada de lista por pessoa.</strong> Uma Pasta Inteligente mostra reuniões com itens em aberto, e não &ldquo;tudo o que a Sara deve&rdquo;.</li>
        <li><strong>Nada de respostas entre reuniões.</strong> &ldquo;O que decidimos sobre os preços no mês passado?&rdquo; significa abrir notas até achar.</li>
      </ul>
      <p>
        Para duas reuniões por semana, o modelo e uma Pasta Inteligente bastam. Com mais do que isso, passar a ata a limpo é o trabalho para
        o qual ninguém tem tempo.
      </p>

      <h2 id="pinto-notes">Uma ata de reunião que se escreve sozinha</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/meeting-notes">ata de reunião</a> é uma nota
        para todas as suas reuniões: as tarefas em aberto no topo e uma seção curta por reunião embaixo, da mais nova para a mais antiga.
      </p>
      <p>
        Depois de uma reunião, cole suas anotações soltas ou uma transcrição na sua IA. Ela escreve um resumo de duas linhas e as decisões,
        e adiciona cada tarefa como &ldquo;Sara: enviar os novos preços para vendas (sex)&rdquo;. Se algo não estiver claro, ela pergunta
        antes de escrever. Depois pergunte &ldquo;o que ainda está em aberto para mim?&rdquo;, ou diga que a revisão do João está feita e
        ela marca a linha. Você ainda pode digitar e marcar tudo sozinho, e cada versão anterior da nota fica guardada.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto, e suas notas do app
        Notas vêm junto em <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês). O app está em
        inglês.
      </p>
    </LocalPostPage>
  );
}
