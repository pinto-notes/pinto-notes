import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "metodo-cornell-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-cornell-notes-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela, botão Tabela, Tab ou Return na última célula adiciona uma linha). Apple's pt-BR page gives no shortcut; the
// Option-Command-T one is from the English post, which tried it on macOS 27. Arquivo > Duplicar Nota is the pt_BR
// string in Notes on macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "método cornell",
// "método cornell de anotações", "metodo cornell notas", "método cornell digital", "método cornell samsung notes";
// nothing for "cornell notas iphone". Brazilian guides call the cue column the column of questions or key words, so
// the template heads it "Pergunta". The Pinto template's own labels (Cue, Notes, Cues to revisit) stay in English, as
// the app is. Facts are the English post's.

const ui = UI.pt;

// Tabs between the question and the note: select those lines in Notes and press the Table button.
const TEMPLATE = `Oferta e demanda, 5 de novembro

Pergunta\tAnotações
O que desloca a curva de demanda?\tRenda, gostos, preços de bens relacionados
O que move ao longo da curva?\tSó o preço do próprio bem
Qual é o preço de equilíbrio?\tOnde a demanda é igual à oferta
O que um preço máximo causa?\tEscassez, se ficar abaixo do equilíbrio

Resumo: O preço do próprio bem move você ao longo da curva de demanda; renda, gostos e preços relacionados deslocam a curva. O preço se acomoda onde a demanda é igual à oferta.
`;

const FAQ = [
  { q: "Dá para usar o método Cornell no app Notas?", a: [
    "Sim, com uma tabela. Crie uma tabela de duas colunas, ponha as perguntas na coluna da esquerda e suas anotações na da direita, e escreva um resumo de duas ou três frases embaixo. Para revisar, cubra a coluna da direita e responda às perguntas.",
  ] },
  { q: "Como faço uma tabela de duas colunas no Notas?", a: [
    "No Mac, escolha Formatar, Tabela, ou pressione Option + Command + T. Você ganha duas linhas e duas colunas, e Tab na última célula adiciona uma linha. Você também pode digitar as linhas com um Tab entre as duas partes, selecionar e clicar no botão Tabela.",
  ] },
  { q: "Dá para deixar a coluna das perguntas mais estreita?", a: [
    "Não. O Notas define a largura das colunas sozinho e não dá para arrastar. Mantenha as perguntas curtas, de poucas palavras, e a coluna das anotações fica com o espaço.",
  ] },
  { q: "Existe um app de método Cornell que me faz perguntas?", a: [
    "O Pinto Notes tem um modelo grátis de método Cornell. Cole suas anotações da aula no ChatGPT ou no Claude e ele escreve as perguntas e o resumo, depois faz as perguntas para você e guarda as que você errou.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="metodo-cornell-notas-iphone"
      intro={<>
        O método Cornell funciona porque transforma suas anotações em perguntas para você se testar. O app Notas não tem esse formato
        pronto, mas uma tabela de duas colunas chega lá. Aqui está um modelo do método Cornell para o app Notas, como revisar com ele e onde
        ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#revisar", label: "Revise com ele" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Anotações que fazem perguntas" },
        ]}>
          <p>
            O app Notas não tem modelo Cornell, mas uma tabela de duas colunas funciona: uma pergunta curta à esquerda, sua anotação à
            direita, uma linha por ideia e um resumo de duas ou três frases embaixo da tabela. Use uma nota por aula e cubra a coluna da
            direita para revisar.
          </p>
          <PostCta slug="pt/metodo-cornell-notas-iphone" path="/pt/blog/metodo-cornell-notas-iphone" position="answer" ui={ui.cta}
            title="Quer as perguntas prontas, e um teste?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de método Cornell. Cole suas anotações da aula no ChatGPT ou no Claude e ele escreve as perguntas e o resumo, depois testa você.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/cornell-notes-note" width={1520} height={1010} maxWidth={620}
        alt="Uma nota Cornell notes no Pinto Notes no Mac: uma aula Supply and demand com uma tabela Cue e Notes de quatro linhas, um resumo e uma checklist Cues to revisit."
        caption="Método Cornell no Pinto Notes: perguntas à esquerda, anotações à direita, um resumo e as perguntas que você errou. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: perguntas, anotações, resumo</h2>
      <p>
        A folha Cornell original tem três partes, e uma nota guarda todas. A coluna das anotações é o que você escreveu na aula, em linhas
        curtas. A coluna das perguntas tem uma pergunta que cada linha responde, escrita depois da aula. O resumo são duas ou três frases
        com as suas palavras, e é nele que acontece a maior parte da memorização.
      </p>
      <Keep title="Método Cornell para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada linha da tabela tem um Tab entre a pergunta e a anotação. Cole e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Cole e depois crie a tabela.</strong> Cole o modelo numa nota nova, selecione as cinco linhas de Pergunta até a última
          anotação e clique no botão Tabela. Cada Tab vira uma coluna, e você fica com Pergunta e Anotações lado a lado.
        </li>
        <li>
          <strong>Ou comece do zero.</strong> Escolha Formatar, Tabela para ter duas linhas e duas colunas. Digite Pergunta e Anotações na
          primeira linha, e Tab na última célula adiciona a próxima linha.
        </li>
        <li>
          <strong>Mantenha as perguntas curtas.</strong> O Notas define a largura das colunas sozinho e não dá para arrastar, então uma
          pergunta longa espreme suas anotações. Poucas palavras, em forma de pergunta.
        </li>
        <li>
          <strong>Uma nota por aula.</strong> Guarde as notas numa pasta por matéria e escolha Arquivo, Duplicar Nota para começar a
          próxima aula a partir da última.
        </li>
      </ul>
      <p>
        Na aula, preencha só a coluna das anotações. Escreva as perguntas e o resumo na mesma noite, enquanto ainda lembra o que a aula
        quis dizer. O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) cobre tudo o que uma
        tabela no Notas faz e não faz.
      </p>

      <h2 id="revisar">Revise com ele</h2>
      <ul>
        <li><strong>Cubra a coluna da direita.</strong> Ponha um cartão ou a mão sobre as anotações e responda cada pergunta em voz alta.</li>
        <li><strong>Marque o que você errou.</strong> Mantenha uma checklist curta embaixo do resumo com as perguntas que você errou, e marque cada uma quando acertar.</li>
        <li><strong>Leia os resumos primeiro.</strong> Antes de uma prova, os resumos de todas as aulas são o caminho mais rápido de volta para a matéria.</li>
      </ul>
      <p>
        Para outras notas que se colam do mesmo jeito, veja o guia{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês), e para manter uma semana de estudos
        nos trilhos, o <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker no Notas</a> também serve para as sessões de revisão.
      </p>

      <h2 id="limites">Onde o método Cornell no Notas para</h2>
      <ul>
        <li><strong>As perguntas são com você.</strong> Transformar cada linha das anotações numa boa pergunta é a parte lenta, e é a parte que as pessoas pulam.</li>
        <li><strong>Nada de teste.</strong> Cobrir uma coluna com a mão funciona, mas nada faz as perguntas para você nem lembra quais você errou.</li>
        <li><strong>As aulas ficam separadas.</strong> Revisar um assunto que ocupou três aulas significa abrir três notas.</li>
      </ul>

      <h2 id="pinto-notes">Anotações Cornell que fazem perguntas para você</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/cornell-notes">método Cornell</a> é uma nota
        por matéria: uma seção por aula com uma tabela Cue e Notes e um resumo, e uma lista de perguntas para revisar.
      </p>
      <p>
        Cole suas anotações da aula ou da leitura na sua IA. Ela põe as anotações à direita em linhas curtas, escreve uma pergunta para cada
        uma à esquerda e fecha com um resumo em frases simples. Diga &ldquo;me testa em oferta e demanda&rdquo; e ela faz as perguntas uma
        de cada vez sem mostrar as respostas, depois adiciona as que você errou em Cues to revisit e marca cada uma quando você acertar mais
        tarde. Você ainda pode escrever e editar cada linha sozinho, e cada versão anterior da nota fica guardada.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto. O app está em
        inglês.
      </p>
    </LocalPostPage>
  );
}
