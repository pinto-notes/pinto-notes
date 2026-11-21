import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "flashcards-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-flashcards (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar > Tabela, botão
// Tabela) and apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão Checklist, Formatar > Mais > Desmarcar
// Tudo). Apple's pt-BR page gives no shortcut; Option-Command-T is from the English post, which tried it on macOS 27.
// Arquivo > Duplicar Nota and Buscar are the pt_BR strings in Notes on macOS 27.2. Slug and title from Google
// autocomplete (pt-BR, 21 Nov): "flashcards iphone", "flashcards para iphone", "flashcards gratis iphone", "flashcards
// para estudar", "como fazer flashcards no notion/goodnotes"; Brazilians say "flashcards", not "cartões", and nothing
// came up for "flashcards notas iphone". The Pinto template's own labels (Study now, Show answer, Again, Hard, Good,
// Easy) stay in English, as the app is. Facts are the English post's.

const ui = UI.pt;

// Tabs between the question and the answer: select those lines in Notes and press the Table button.
const TEMPLATE = `Flashcards de respiração celular

Pergunta\tResposta
A célula quebra a glicose para produzir o quê?\tATP, a energia da célula
Quais são as três etapas?\tGlicólise, ciclo de Krebs, cadeia respiratória
Qual etapa produz mais ATP?\tA cadeia respiratória
Onde acontece a cadeia respiratória?\tNas mitocôndrias

Errei desta vez
`;

const FAQ = [
  { q: "Dá para fazer flashcards no app Notas?", a: [
    "Sim, com uma tabela de duas colunas: a pergunta à esquerda, a resposta à direita, uma linha por cartão. O Notas não esconde a resposta nem vira o cartão, então você cobre a coluna da direita para se testar.",
  ] },
  { q: "O app Notas tem repetição espaçada?", a: [
    "Não. O Notas não sabe quais cartões estão para revisar nem quais você errou. Uma checklist dos cartões errados embaixo da tabela, estudada primeiro na próxima vez, é o mais perto que dá para chegar à mão.",
  ] },
  { q: "Dá para embaralhar os flashcards no Notas?", a: [
    "Não. As tabelas do Notas não ordenam nem embaralham, então os cartões vêm na ordem em que você digitou. Começar de vez em quando pela última linha é o jeito simples de contornar.",
  ] },
  { q: "Existe um app de flashcards que funciona como o app Notas?", a: [
    "O Pinto Notes tem a cara do app Notas, funciona como ele e tem um modelo grátis de anotações de estudo e flashcards, com um app de estudo próprio. Cole suas anotações no ChatGPT ou no Claude e ele faz os cartões; o app mostra os que estão para revisar, um por vez.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="flashcards-notas-iphone"
      intro={<>
        Flashcards funcionam porque obrigam você a responder antes de ver a resposta. O app Notas não tem modo de flashcards, mas uma
        tabela de duas colunas chega perto. Aqui está um modelo de flashcards para colar no Notas, como estudar com ele e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#estudar", label: "Estude com ele" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Cartões que voltam na hora certa" },
        ]}>
          <p>
            O app Notas não tem flashcards, mas uma tabela de duas colunas funciona: a pergunta à esquerda, a resposta à direita, uma
            linha por cartão. Cubra a coluna da direita para se testar e mantenha uma checklist curta dos cartões que você errou embaixo
            da tabela.
          </p>
          <PostCta template="study-flashcards" slug="pt/flashcards-notas-iphone" path="/pt/blog/flashcards-notas-iphone" position="answer" ui={ui.cta}
            title="Quer os cartões prontos, e na hora de revisar?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de flashcards com um app de estudo. Cole suas anotações no ChatGPT ou no Claude e ele faz os cartões; os que você erra voltam mais cedo.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/study-flashcards-note" width={1520} height={571} maxWidth={600}
        alt="Uma nota Study notes and flashcards no Pinto Notes no Mac: uma linha sobre como os cartões funcionam e um cabeçalho Notes com uma seção Cell respiration de três tópicos."
        caption="Anotações de estudo no Pinto Notes, a nota de onde saem os flashcards. Dados de exemplo. Cabeçalhos e tópicos funcionam igual no app Notas; o app de estudo não vem junto." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma tabela por assunto</h2>
      <p>
        Cada linha é um cartão. Deixe a pergunta curta e a resposta mais curta ainda: um cartão que pede um parágrafo de resposta são dois
        cartões. A linha embaixo da tabela é para onde vão os cartões errados, para a próxima sessão começar por eles.
      </p>
      <Keep title="Flashcards para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada linha da tabela tem um Tab entre a pergunta e a resposta. Cole e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole o modelo numa nota nova, selecione as cinco linhas de Pergunta até a última
          resposta e clique no botão Tabela. Cada Tab vira uma coluna, e Pergunta e Resposta ficam lado a lado.
        </li>
        <li>
          <strong>Ou comece do zero.</strong> Escolha Formatar, Tabela para ter duas linhas e duas colunas. Digite Pergunta e Resposta na
          primeira linha, e Tab na última célula adiciona o próximo cartão.
        </li>
        <li>
          <strong>Perguntas curtas.</strong> O Notas define a largura das colunas sozinho e não deixa arrastar, então uma pergunta longa
          espreme a resposta.
        </li>
        <li>
          <strong>Uma nota por assunto.</strong> Guarde todas numa pasta Estudos, ponha uma etiqueta como #biologia em cada uma e escolha
          Arquivo, Duplicar Nota para começar o próximo assunto com o mesmo formato.
        </li>
      </ul>
      <p>
        Uma lista de linhas &ldquo;pergunta: resposta&rdquo; também funciona, mas a resposta fica à vista, do lado da pergunta. A tabela
        deixa você esconder uma coluna inteira de uma vez. O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app
        Notas</a> (em inglês) mostra tudo o que uma tabela no Notas faz e não faz.
      </p>

      <h2 id="estudar">Estude com ele</h2>
      <ul>
        <li><strong>Cubra a coluna da direita.</strong> Ponha um cartão ou a mão sobre as respostas e diga cada uma em voz alta antes de olhar.</li>
        <li><strong>Anote o que errou.</strong> Digite a pergunta embaixo de Errei desta vez e toque no botão Checklist. Marque quando acertar numa sessão seguinte.</li>
        <li><strong>Comece pelos erros.</strong> Na próxima vez, passe pela checklist antes da tabela. São esses os cartões que precisam de treino.</li>
        <li><strong>Zere para a próxima rodada.</strong> Quando todos os erros estiverem marcados, escolha Formatar, Mais, Desmarcar Tudo, ou apague as linhas marcadas e comece de novo.</li>
        <li><strong>Ache um cartão por qualquer palavra.</strong> A busca lê cada palavra de cada nota, então &ldquo;mitocôndrias&rdquo; acha o cartão onde ele estiver.</li>
      </ul>
      <p>
        Se você faz anotações na aula, o <a href="/pt/blog/metodo-cornell-notas-iphone">método Cornell no Notas</a> põe as perguntas
        do lado das anotações, o que já é um baralho de flashcards feito enquanto você escreve. Mais notas para colar estão no guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde os flashcards no Notas param</h2>
      <ul>
        <li><strong>Nada fica para revisar.</strong> O Notas não sabe quando você viu um cartão pela última vez, então ou você estuda todos os cartões toda vez, ou controla isso sozinho.</li>
        <li><strong>Nada de virar o cartão.</strong> A resposta está sempre na página. Cobrir funciona, mas é fácil dar uma espiada.</li>
        <li><strong>Nada de embaralhar.</strong> As tabelas não ordenam, então você decora a ordem dos cartões junto com as respostas.</li>
        <li><strong>Fazer os cartões é a parte lenta.</strong> Transformar um capítulo em boas perguntas leva mais tempo do que estudar com elas.</li>
      </ul>
      <p>
        Para uma prova na semana que vem com vinte cartões, uma tabela no Notas basta. Para uma matéria inteira, o difícil é saber quais
        cartões estudar hoje, e o Notas deixa isso com você.
      </p>

      <h2 id="pinto-notes">Flashcards que voltam na hora de revisar</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e uma nota também pode ser um pequeno app. O modelo
        grátis de <a href="/templates/study-flashcards">anotações de estudo e flashcards</a> é um deles: suas anotações com um cabeçalho
        por assunto e um app de estudo que mostra quantos cartões estão para revisar hoje. Clique em Study now e ele pergunta um cartão
        por vez. Clique em Show answer e diga como foi (Again, Hard, Good ou Easy), e cada botão mostra quando o cartão volta. Os cartões
        que você erra voltam mais cedo; os que você sabe esperam mais.
      </p>
      <p>
        Você pode adicionar, editar e apagar cada cartão no próprio app, ou colar uma lista de linhas de pergunta e resposta e ele faz os
        cartões. Com o ChatGPT ou o Claude conectado, cole as anotações da aula ou um capítulo e ele faz de cinco a dez cartões ao lado dos
        seus. Diga &ldquo;me teste em biologia, dez cartões&rdquo; e ele pergunta na conversa, um por vez e sem a resposta, e atualiza
        cada cartão do mesmo jeito que o app. Pergunte &ldquo;quais cartões eu sempre erro?&rdquo; e ele lê o baralho para responder.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. As anotações de estudo que você já tem no app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
