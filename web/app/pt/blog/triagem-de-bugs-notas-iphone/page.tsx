import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "triagem-de-bugs-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-bug-triage-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela, botão Tabela), apd93c815aa0/mac "Adicione listas no app Notas do Mac" ("Ordenar automaticamente os itens
// marcados") and support.apple.com/pt-br/102462 "Se você não conseguir colaborar no app Notas" (Conta Apple). Apple's
// pt-BR page gives no shortcut; Option-Command-T is from the English post, which tried it on macOS 27. Editar > Colar
// como Markdown (new in macOS 27) is the pt_BR string in Notes on macOS 27.2. Slug and title from Google autocomplete
// (pt-BR, 21 Nov): "bug triage", "bug triage meeting", "bug triage process" (English suggestions only), "modelo de bug
// report", "relatório de bugs exemplo"; nothing for "triagem de bugs" or "priorizar bugs". Brazilian developers say
// "triagem de bugs" and "severidade", so the slug uses those words. The Pinto template's own choices (New, Confirmed,
// In progress, Fixed, Won't fix) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TABLE = `Triagem de bugs

Bug\tSeveridade\tÁrea\tStatus\tReportado\tLink
Cartão salvo falha no checkout\tP1\tCheckout\tEm andamento\t04/11\t#412
Busca ignora ç, ã e é\tP2\tBusca\tCorrigido\t02/11\t#407
E-mail do pedido chega duas vezes\tP2\tE-mail\tNovo\t06/11\t#418
Logo do rodapé borrado no celular\tP3\tDesign\tConfirmado\t05/11\tnenhum
`;

const RULES = `## Severidade
- P0: perda de dados, falha de segurança ou todo mundo travado. Larga tudo.
- P1: um fluxo principal quebrado para muita gente. Nesta semana.
- P2: quebrado, mas tem um jeito de contornar. Agende.
- P3: acabamento. Quando der tempo.

## Detalhes
Cartão salvo falha no checkout
1. Entre numa conta com um cartão salvo.
2. Ponha qualquer coisa no carrinho e vá para o checkout.
3. Escolha o cartão salvo e toque em Pagar.
Esperado: o pedido é feito.
O que aconteceu: "Falha no pagamento", e nenhum pedido.
`;

const LIST = `# Bugs por severidade

## P1
- [ ] Cartão salvo falha no checkout (Checkout, #412)

## P2
- [ ] E-mail do pedido chega duas vezes (E-mail, #418)
- [x] Busca ignora ç, ã e é (Busca, #407)

## P3
- [ ] Logo do rodapé borrado no celular (Design)
`;

const FAQ = [
  { q: "O que é triagem de bugs?", a: [
    "É decidir, para cada bug novo reportado, quão grave ele é e quando vai ser corrigido. A maioria dos times dá a cada bug uma severidade de P0 a P3, uma área e um status, e passa pelos novos num dia fixo.",
  ] },
  { q: "O que entra num modelo de triagem de bugs?", a: [
    "Um título curto, a severidade, a área, o status, a data em que foi reportado e um link para o report. Depois, para cada bug que você consegue reproduzir, os passos, o que era esperado e o que aconteceu.",
  ] },
  { q: "Dá para controlar bugs no app Notas?", a: [
    "Para um projeto pequeno, sim: uma tabela com uma linha por bug, ou uma checklist embaixo de um cabeçalho por severidade. As tabelas do Notas não ordenam nem filtram, então com mais de duas dúzias de bugs um issue tracker funciona melhor.",
  ] },
  { q: "Existe um modelo de triagem de bugs que registra os reports para mim?", a: [
    "O Pinto Notes tem um modelo grátis de triagem de bugs. Cole um report ou uma issue do GitHub no ChatGPT, no Claude ou no Claude Code e ele adiciona uma linha seguindo as suas regras de severidade, com os passos para reproduzir.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="triagem-de-bugs-notas-iphone"
      intro={<>
        Nem todo time precisa de um issue tracker. Quem desenvolve sozinho ou um time de três pessoas pode guardar todos os bugs numa
        nota, se cada um ganhar uma severidade e os piores ficarem no topo. Aqui está um modelo de triagem de bugs para o app Notas, uma
        versão em checklist que se ordena melhor e onde uma nota para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#por-severidade", label: "Uma versão em checklist" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Bugs que se registram" },
        ]}>
          <p>
            O app Notas não tem modelo de triagem de bugs, mas uma nota resolve: uma tabela com uma linha por bug (título, severidade,
            área, status, data, link), as regras de severidade embaixo e os passos para reproduzir cada bug mais abaixo. Dê a todo bug uma
            severidade de P0 a P3 quando ele chegar e corrija de cima para baixo.
          </p>
          <PostCta template="bug-triage" slug="pt/triagem-de-bugs-notas-iphone" path="/pt/blog/triagem-de-bugs-notas-iphone" position="answer" ui={ui.cta}
            title="Quer os reports registrados para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de triagem de bugs. Cole um report no ChatGPT ou no Claude e ele adiciona uma linha seguindo as suas regras de severidade, com os passos para reproduzir.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/bug-triage-note" width={1520} height={1363} maxWidth={600}
        alt="Uma nota Bug triage no Pinto Notes no Mac: uma tabela de quatro bugs com severidade de P1 a P3, área, status, data e número da issue, os passos para reproduzir o bug do cartão salvo no checkout e as regras de severidade."
        caption="Uma nota de triagem de bugs no Pinto Notes, com Severity e Status como escolhas. No app Notas, a tabela, os detalhes e as regras vêm como texto simples." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma tabela e as regras</h2>
      <p>
        A tabela é a lista que você olha toda manhã. A severidade diz quando um bug vai ser corrigido, e as regras mantêm isso honesto: P1
        significa um fluxo principal quebrado para muita gente, e um cliente barulhento não muda isso. Mantenha os títulos curtos, já que
        seis colunas dividem a largura.
      </p>
      <Keep title="Tabela de triagem de bugs para o app Notas" text={TABLE} copyLabel={ui.copy}
        note="Cada linha da tabela tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />
      <Keep title="Regras de severidade e detalhes" text={RULES} copyLabel={ui.copy}
        note="Cole embaixo da tabela com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole o modelo da tabela numa nota nova, selecione as cinco linhas de Bug até o
          último bug e clique no botão Tabela. Cada Tab vira uma coluna, e as seis colunas ficam lado a lado.
        </li>
        <li>
          <strong>Ou comece do zero.</strong> Escolha Formatar, Tabela para ter duas linhas e duas colunas, e Tab na última célula
          adiciona a próxima linha.
        </li>
        <li>
          <strong>Adicione as regras e os detalhes.</strong> Clique embaixo da tabela e escolha Editar, Colar como Markdown. As linhas
          com ## viram cabeçalhos.
        </li>
        <li>
          <strong>Mude um status digitando por cima.</strong> De Em andamento para Corrigido é uma célula. Deixe os bugs corrigidos por
          uma semana, para as pessoas verem o que mudou.
        </li>
      </ul>
      <p>
        O Notas define a largura das colunas sozinho e não deixa arrastar, então um título longo espreme o resto. O guia{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra tudo o que uma tabela no Notas faz
        e não faz. Se outras pessoas também reportam bugs, compartilhe a nota e permita que elas façam alterações; cada pessoa precisa de
        uma Conta Apple.
      </p>

      <h2 id="por-severidade">Uma versão em checklist que se ordena sozinha</h2>
      <p>
        As tabelas do Notas não ordenam, então um P1 novo cai no fim. Se isso incomoda, dê um cabeçalho a cada severidade e uma linha de
        checklist a cada bug embaixo dele. Os piores bugs ficam sempre no topo, e marcar uma linha indica que foi corrigido.
      </p>
      <Keep title="Bugs por severidade para o app Notas" text={LIST} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />
      <p>
        Ative Ordenar automaticamente os itens marcados nos ajustes do Notas, e os bugs corrigidos descem para o fim do seu cabeçalho. A
        busca lê cada palavra de cada nota, então buscar &ldquo;checkout&rdquo; acha o bug e os detalhes. Mais notas para colar estão no
        guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde a triagem de bugs no Notas para</h2>
      <ul>
        <li><strong>Nada de ordenar ou filtrar.</strong> &ldquo;Todo P1 em aberto&rdquo; significa ler a tabela inteira.</li>
        <li><strong>Todo report é digitado de novo.</strong> Os bugs chegam por e-mail, chat e GitHub, e cada um é um título, uma severidade e passos que você escreve à mão.</li>
        <li><strong>A severidade é um julgamento toda vez.</strong> As regras estão na nota, mas você ainda compara cada report com elas.</li>
        <li><strong>Nada de ligação com o código.</strong> Achar em quais arquivos um bug mora continua sendo um trabalho à parte.</li>
      </ul>
      <p>
        Para um projeto paralelo ou um app pequeno, uma nota basta. Com um time registrando dezenas de bugs por semana, use um issue
        tracker.
      </p>

      <h2 id="pinto-notes">Bugs que se registram sozinhos</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/bug-triage">triagem de bugs</a> é uma nota com
        uma tabela Bugs, uma seção Details e as regras de severidade. Na tabela, Severity é uma escolha de P0 a P3 e Status uma escolha
        entre New, Confirmed, In progress, Fixed e Won&apos;t fix.
      </p>
      <p>
        Cole um report de bug na sua IA. Ela segue as regras de Severity e adiciona uma linha com um título curto, a severidade, a área,
        Status New, a data de hoje e o link, e mantém as linhas dos piores para os menores. Se o report diz como reproduzir, os passos, o
        que era esperado e o que aconteceu vão para Details. No Claude Code, o modelo tem instruções próprias: cole uma issue do GitHub e
        ele lê com gh issue view, registra a linha e depois procura no seu código a causa provável e adiciona aos detalhes os arquivos
        envolvidos. O guia <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">de notas no Claude Code e no Codex</a> (em
        inglês) tem o comando único para adicionar.
      </p>
      <p>
        Pergunte &ldquo;o que é P1 e ainda está aberto?&rdquo;, ou diga &ldquo;corrigimos o checkout com cartão salvo, marca aí&rdquo; e
        ela muda o status. Você ainda pode editar cada linha sozinho, e cada versão anterior da nota fica guardada. A parte da IA funciona
        depois que o ChatGPT ou o Claude está conectado; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o
        ChatGPT</a> (em inglês) leva um minuto. O app está em inglês. As notas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
