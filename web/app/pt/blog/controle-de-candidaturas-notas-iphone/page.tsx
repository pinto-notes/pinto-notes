import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "controle-de-candidaturas-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-job-search-tracker (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela, botão Tabela) and apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist, "Ordenar
// automaticamente os itens marcados"). Apple's pt-BR page gives no shortcut; Option-Command-T is from the English post,
// which tried it on macOS 27. Editar > Colar como Markdown (new in macOS 27) and Editar > Adicionar Link are the pt_BR
// strings in Notes on macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "planilha de controle de
// candidaturas", "planilha de candidaturas", "planilha de vagas de emprego", "planilha acompanhamento de vagas",
// "vagas aplicadas linkedin", "gupy vagas aplicadas"; nothing for "controle de vagas notas" ("controle de vagas" is
// about public school posts and parking). The Pinto template's own choices (Saved, Applied, Interview, Offer,
// Rejected, Withdrawn) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TABLE = `Busca de emprego

Empresa\tVaga\tEtapa\tPróximo passo
Tideway\tDesigner sênior\tEntrevista\tPrimeira entrevista, 12/11
Marlow Studio\tLíder de design\tEnviada\tCobrar retorno, 16/11
Finch Bikes\tProduct designer\tSalva\tEnviar até 18/11
Northlight\tUX designer\tRecusada\tPedi feedback
`;

const REST = `## Preparação para entrevistas
Tideway, primeira entrevista 12/11
1. Um projeto de que você se orgulha? O redesenho do onboarding.
2. Como você trabalha com engenharia? Revisões semanais, entregas pequenas.
3. Por que a Tideway? Gosto de desatar nós de logística.

Para perguntar a eles: como design e suporte compartilham o que ouvem dos clientes?

## Esta semana
- [ ] Mandar o link do portfólio para a Tideway
- [ ] Pôr o projeto de onboarding no currículo

## Pessoas com quem conversei
- Karin, gerente de design na Tideway: liga mais para protótipos simples do que para acabamento.
`;

const FAQ = [
  { q: "Dá para controlar candidaturas a vagas no app Notas?", a: [
    "Sim, com uma tabela. Faça uma linha por vaga com a empresa, a vaga, a etapa e o próximo passo, e mantenha os retornos a cobrar numa checklist embaixo. O app Notas não tem modelos, então cole o desta página numa nota nova.",
  ] },
  { q: "O Notas ordena minhas candidaturas por etapa?", a: [
    "Não. As tabelas do Notas não ordenam nem somam. Use sempre as mesmas palavras para a etapa (Salva, Enviada, Entrevista, Proposta, Recusada) para a coluna ser fácil de ler.",
  ] },
  { q: "Uma planilha é melhor para procurar emprego?", a: [
    "Uma planilha ordena e filtra, o que ajuda depois de algumas dezenas de candidaturas. Uma nota mantém a tabela junto da preparação para as entrevistas e das pessoas com quem você conversou, no celular, entre uma entrevista e outra.",
  ] },
  { q: "Existe um controle de candidaturas que se preenche sozinho?", a: [
    "O Pinto Notes tem um modelo grátis de busca de emprego. Cole o anúncio de uma vaga no ChatGPT ou no Claude e ele adiciona a linha, depois mantém a etapa e o próximo passo em dia conforme você conta o que aconteceu.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="controle-de-candidaturas-notas-iphone"
      intro={<>
        Quase todo controle de candidaturas é uma planilha, e uma planilha é mais uma coisa para abrir. Se você vive no app Notas, uma nota
        dá conta de todas as candidaturas e do que vem depois. Aqui está um modelo de controle de candidaturas para o Notas, como manter
        em dia e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#semana", label: "Semana a semana" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um controle que se atualiza" },
        ]}>
          <p>
            O app Notas não tem modelo de controle de candidaturas, mas uma nota com uma tabela resolve: uma linha por candidatura com a
            empresa, a vaga, a etapa e o próximo passo. Embaixo da tabela, guarde a preparação para as entrevistas, uma checklist dos
            retornos a cobrar na semana e as pessoas com quem você conversou.
          </p>
          <PostCta template="job-hunt" slug="pt/controle-de-candidaturas-notas-iphone" path="/pt/blog/controle-de-candidaturas-notas-iphone" position="answer" ui={ui.cta}
            title="Quer o controle em dia sem esforço?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de busca de emprego. Cole o anúncio de uma vaga no ChatGPT ou no Claude e ele adiciona a linha, depois ajuda você a se preparar para a entrevista.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/job-hunt-note" width={1520} height={1514} maxWidth={600}
        alt="Uma nota Job hunt no Pinto Notes no Mac: uma tabela Applications com quatro vagas, a Tideway em Interview, a preparação para a entrevista com três perguntas e pontos para falar, uma checklist This week com um item marcado e uma anotação sobre a Karin, da Tideway."
        caption="Um controle de candidaturas no Pinto Notes, com Stage como coluna de escolha. No app Notas, a mesma tabela funciona com a etapa digitada como palavra. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota, uma linha por vaga</h2>
      <p>
        A tabela responde à pergunta que você mais faz: em que pé está cada candidatura e o que eu faço agora. Ponha uma data em todo
        próximo passo, porque &ldquo;cobrar retorno&rdquo; sem dia costuma ficar sem fazer. Tudo o que não cabe numa linha vai embaixo da
        tabela.
      </p>
      <Keep title="Tabela de candidaturas para o app Notas" text={TABLE} copyLabel={ui.copy}
        note="Cada linha da tabela tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />
      <Keep title="Preparação e retornos para o app Notas" text={REST} copyLabel={ui.copy}
        note="No Mac, cole embaixo da tabela com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Editar", "Colar como Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole o modelo da tabela numa nota nova, selecione as cinco linhas de Empresa até
          Northlight e clique no botão Tabela. Cada Tab vira uma coluna, e Empresa, Vaga, Etapa e Próximo passo ficam lado a lado.
        </li>
        <li>
          <strong>Adicione o resto.</strong> Clique embaixo da tabela e escolha Editar, Colar como Markdown com o segundo modelo. No macOS
          27, cada linha com ## vira um cabeçalho e os retornos viram uma checklist. Um Command + V comum deixa os símbolos como texto.
          No iPhone, digite os cabeçalhos, selecione os retornos e toque no botão Checklist.
        </li>
        <li>
          <strong>Adicione uma vaga.</strong> Clique na última célula e pressione Tab para ter uma linha nova. O Notas define a largura
          das colunas sozinho e não deixa arrastar, então mantenha cada célula em poucas palavras.
        </li>
        <li>
          <strong>Fixe a nota.</strong> Fixe a nota no topo da pasta, para ela ser a primeira coisa que você vê quando um recrutador
          liga.
        </li>
      </ul>
      <p>
        O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra tudo o que uma tabela no
        Notas faz e não faz.
      </p>

      <h2 id="semana">Semana a semana</h2>
      <ul>
        <li>
          <strong>Use sempre as mesmas palavras para a etapa.</strong> Salva, Enviada, Entrevista, Proposta, Recusada, Desisti. A tabela
          não ordena, então são essas poucas palavras que deixam a coluna fácil de bater o olho.
        </li>
        <li>
          <strong>Mude a linha no dia em que algo acontece.</strong> Uma resposta, uma recusa, a data de uma entrevista: atualize Etapa e
          Próximo passo antes de fechar o e-mail.
        </li>
        <li>
          <strong>Planeje os retornos no domingo.</strong> Desça pela coluna Próximo passo e copie o que vence para Esta semana. Com
          Ordenar automaticamente os itens marcados ativado, os itens marcados descem para o fim.
        </li>
        <li>
          <strong>Preparação longa ganha nota própria.</strong> Quando a preparação para uma empresa passar de algumas perguntas, mova
          para uma nota só dela e faça um link para ela em Preparação para entrevistas com Editar, Adicionar Link (Command + K).
        </li>
        <li>
          <strong>Anote quem você conheceu.</strong> Uma linha sobre cada pessoa, e com o que ela se importava, é o que você vai querer
          antes da segunda entrevista. A busca lê cada palavra, então um nome acha a anotação.
        </li>
      </ul>
      <p>
        Para anotar as próprias entrevistas, você pode usar uma nota de reunião. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde um controle de candidaturas no Notas para</h2>
      <ul>
        <li><strong>Toda vaga é digitada à mão.</strong> A empresa, a vaga e o link do anúncio saem da página da vaga uma célula por vez.</li>
        <li><strong>Nada de ordenar ou filtrar.</strong> Com trinta linhas, achar as que estão em Entrevista significa descer lendo a coluna.</li>
        <li><strong>Datas são só texto.</strong> &ldquo;Cobrar retorno, 16/11&rdquo; fica parado numa célula. Perceber que hoje é dia 16 é com você.</li>
        <li><strong>A preparação começa numa página em branco.</strong> As perguntas prováveis de cada vaga, e as suas respostas, você escreve sozinho.</li>
      </ul>
      <p>
        Para meia dúzia de candidaturas, a nota é tudo de que você precisa. Quando são vinte ao mesmo tempo, manter a tabela em dia vira
        um trabalho à parte.
      </p>

      <h2 id="pinto-notes">Um controle de candidaturas que se atualiza sozinho</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/job-hunt">busca de emprego</a> é uma nota com
        uma tabela Applications, onde Stage é uma escolha entre Saved, Applied, Interview, Offer, Rejected ou Withdrawn, e seções para a
        preparação das entrevistas, os retornos da semana e as pessoas com quem você conversou.
      </p>
      <p>
        Cole o anúncio de uma vaga ou um link na sua IA e ela adiciona uma linha: a empresa, a vaga com o link do anúncio, Stage em Saved
        e o próximo passo. Conte que você se candidatou ou teve resposta e ela muda aquela linha. Diga &ldquo;tenho a primeira entrevista
        com a Tideway na quinta, me ajuda a me preparar&rdquo; e ela escreve cinco perguntas prováveis com seus pontos para falar,
        embaixo do nome da empresa. Pergunte &ldquo;o que eu preciso cobrar esta semana?&rdquo; e ela lista tudo numa checklist. Você
        ainda pode editar cada linha sozinho, e cada versão anterior da nota fica guardada. Essa parte funciona depois que o ChatGPT ou o
        Claude está conectado; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um
        minuto.
      </p>
      <p>
        O app está em inglês. As notas que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
