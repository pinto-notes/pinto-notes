import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "mood-tracker-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-mood-tracker (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar > Tabela, botão
// Tabela) and the pilot's apda85974595/mac "Resolva cálculos no app Notas do Mac" (Resultados de Cálculos). Apple's
// pt-BR page gives no shortcut; Option-Command-T is from the English post, which tried it on macOS 27. Slug and title
// from Google autocomplete (pt-BR, 21 Nov): "mood tracker", "mood tracker app", "mood tracker iphone", "mood tracker
// widget iphone", "diário de humor", "registro de humor", "app humor diário", "tabela de humor diário"; Brazilians
// search the English "mood tracker" alongside "diário de humor", and nothing came up for "humor notas iphone". Facts
// are the English post's, including the line that this is not a health tool.

const ui = UI.pt;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TEMPLATE = `Registro de humor e energia

Data\tHumor (1 a 5)\tEnergia (1 a 5)\tSono (horas)\tNota
4/11\t4\t4\t7,5\tAcademia antes do trabalho
5/11\t3\t2\t6\tReunião o dia todo
6/11\t4\t3\t6,5\tAlmoço com a Maja
7/11\t4\t2\t5,5\tMudança da Maja
8/11\t4\t4\t8\tDormi até tarde

Padrões
`;

const FAQ = [
  { q: "O app Notas tem mood tracker?", a: [
    "Não. O app Notas não tem mood tracker nem modelos. Uma tabela com uma linha para cada noite, com humor, energia, sono e uma nota curta, funciona como um, e você pode colar o modelo desta página e transformar numa tabela.",
  ] },
  { q: "O que um mood tracker deve ter?", a: [
    "Mantenha pequeno o bastante para preencher toda noite: a data, humor e energia de 1 a 5, horas de sono e uma linha sobre o dia. A linha é o que mais importa, porque é ela que explica uma nota baixa depois.",
  ] },
  { q: "O app Notas faz um gráfico do meu humor?", a: [
    "Não. Uma tabela no Notas não ordena, não soma e não desenha gráfico. Você lê as colunas sozinho, ou copia as linhas para uma planilha quando quiser um gráfico.",
  ] },
  { q: "Existe um mood tracker que encontra padrões para mim?", a: [
    "O Pinto Notes tem um modelo grátis de registro de humor e energia. Conte ao ChatGPT ou ao Claude como foi o seu dia e ele registra as notas, e quando você pede, ele escreve o que percebe e em quantos dias isso se baseia.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="mood-tracker-notas-iphone"
      intro={<>
        Uma semana ruim parece ter vindo do nada até você olhar para as noites antes dela. Um mood tracker é como você olha. Aqui está um
        registro de humor e energia para colar no app Notas, um jeito de manter por mais de uma semana e onde uma nota para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#toda-noite", label: "Toda noite" },
          { href: "#olhar-para-tras", label: "Olhando para trás" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um registro que acha padrões" },
        ]}>
          <p>
            O app Notas não tem mood tracker, mas uma tabela resolve: uma linha para cada noite com a data, humor e energia de 1 a 5, horas
            de sono e uma linha sobre o dia. Depois de algumas semanas, desça pelas colunas para ver o que os seus dias bons têm em comum.
          </p>
          <PostCta template="mood-energy-log" slug="pt/mood-tracker-notas-iphone" path="/pt/blog/mood-tracker-notas-iphone" position="answer" ui={ui.cta}
            title="Quer os padrões encontrados para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um registro grátis de humor e energia. Conte ao ChatGPT ou ao Claude como foi o seu dia e ele registra a linha, e diz o que percebe quando você pergunta.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/mood-energy-log-note" width={1520} height={1057} maxWidth={600}
        alt="Uma nota Mood and energy log no Pinto Notes no Mac: uma tabela Check-ins com cinco noites, de 4 a 8 de novembro, cada uma com humor, energia, horas de sono e uma nota curta, e três padrões embaixo."
        caption="Um registro de humor e energia no Pinto Notes, onde humor e energia são escalas de 1 a 5. No app Notas, as mesmas colunas funcionam como uma tabela simples. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma linha por noite</h2>
      <p>
        Cinco colunas, e cada uma tem motivo para estar ali. Humor é como o dia pareceu. Energia é quanto você tinha, que não é a mesma
        coisa: um dia bom pode deixar você esgotado. Sono é o número que mais provavelmente explica os dois. A nota é uma linha sobre o
        dia, para um 3 ainda dizer algo daqui a duas semanas. Cinco noites de exemplo já estão preenchidas; troque pelas suas.
      </p>
      <Keep title="Registro de humor e energia para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada linha da tabela tem um Tab entre as colunas. Cole e depois transforme essas linhas numa tabela." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Cole e depois faça a tabela.</strong> Cole o modelo numa nota nova, selecione as seis linhas de Data até a última noite
          e clique no botão Tabela. Cada Tab vira uma coluna, e Data, Humor, Energia, Sono e Nota ficam lado a lado.
        </li>
        <li>
          <strong>Apague os exemplos e adicione suas linhas.</strong> Apague as noites de exemplo ou digite por cima. Tab na última célula
          adiciona a próxima linha.
        </li>
        <li>
          <strong>Nota curta.</strong> O Notas define a largura das colunas sozinho e não deixa arrastar, então uma nota longa espreme os
          números. Poucas palavras bastam.
        </li>
        <li>
          <strong>Fixe a nota.</strong> Fixe a nota no topo da pasta, para o registro da noite ficar a um toque.
        </li>
      </ul>
      <p>
        O guia <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra tudo o que uma tabela no
        Notas faz e não faz.
      </p>

      <h2 id="toda-noite">Toda noite</h2>
      <ul>
        <li><strong>Mesmo horário, todo dia.</strong> Preencha quando escovar os dentes ou puser o celular para carregar, para pegar carona em algo que você já faz.</li>
        <li><strong>Dê nota ao dia inteiro.</strong> O humor às 22h depois de um bom jantar diz pouco sobre uma tarde difícil. Pense no dia todo antes de escolher um número.</li>
        <li><strong>Use a escala inteira.</strong> Se todo dia é 3, o registro não mostra nada. Um 1 ou um 5 de vez em quando é honesto.</li>
        <li><strong>Escreva o que foi diferente.</strong> &ldquo;Reunião o dia todo&rdquo; ou &ldquo;dormi até tarde&rdquo; é o que você vai buscar depois.</li>
        <li><strong>Deixe de fora o dia que perdeu.</strong> Um buraco é melhor do que uma nota inventada três dias depois.</li>
      </ul>
      <p>
        Se você quer palavras além de números, você pode responder a quatro perguntas curtas por dia num diário no Notas, e o <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker</a> combina com esta nota para coisas
        como uma caminhada ou nada de tela depois das dez.
      </p>

      <h2 id="olhar-para-tras">Olhando para trás</h2>
      <p>
        Uma vez por semana, desça pela tabela e escreva o que você percebe em Padrões. A busca lê cada palavra de cada nota, então buscar
        &ldquo;reunião&rdquo; acha todos os dias em que você escreveu isso. Para um total rápido, os Resultados de Cálculos fazem as contas
        que você digita, então 4+3+4+4+4= embaixo da tabela soma o humor da semana.
      </p>
      <p>
        Dê algumas semanas antes de tirar conclusões; cinco dias são um começo. Isto é um diário de como você se sentiu, e não uma
        ferramenta de saúde. Se os dias ruins continuarem se acumulando, converse com um médico.
      </p>

      <h2 id="limites">Onde um mood tracker no Notas para</h2>
      <ul>
        <li><strong>Tabelas não contam.</strong> Uma tabela no Notas não põe seus melhores dias no topo, não tira a média de uma coluna e não desenha gráfico.</li>
        <li><strong>Padrões são no olho.</strong> Perceber que a energia cai depois de uma noite curta significa ler cada linha e guardar tudo na cabeça.</li>
        <li><strong>A linha é digitada.</strong> Numa noite cansada, cinco células bastam para você pular.</li>
      </ul>
      <p>
        Por um mês, uma tabela numa nota é tudo de que você precisa. Ao longo de meses, a parte útil, ver o que levanta você e o que
        esgota, fica com você.
      </p>

      <h2 id="pinto-notes">Um registro de humor que acha padrões</h2>
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas
        notas a partir da conversa que você já usa. O modelo grátis de <a href="/templates/mood-energy-log">registro de humor e
        energia</a> é uma nota com uma tabela Check-ins: a data, humor e energia como escalas de 1 a 5, o sono em horas e uma nota, com
        Patterns embaixo.
      </p>
      <p>
        Toda noite, conte à sua IA como foi o seu dia, do seu jeito. Ela adiciona a linha, com humor e energia de 1 (baixo) a 5 (ótimo), o
        seu sono e uma linha curta. Quando não tem certeza de uma nota, ela pergunta em vez de chutar. Depois de algumas semanas, pergunte
        &ldquo;o que os meus melhores dias têm em comum?&rdquo; ou &ldquo;uma noite curta muda a minha energia no dia seguinte?&rdquo; e
        ela escreve o que percebe em Patterns, com quantos dias sustentam isso. Ela não dá conselhos médicos. Você ainda pode adicionar e
        editar cada linha sozinho, e cada versão anterior da nota fica guardada. Isso funciona depois que o ChatGPT ou o Claude está
        conectado; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. Um registro que você já tem no app Notas vem junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
