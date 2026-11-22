import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "ficha-de-treino-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-workout-log-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão
// Checklist, Formatar > Mais > Desmarcar Tudo) and apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela). Editar > Colar como Markdown (new in macOS 27), Arquivo > Duplicar Nota and Fixar Nota are the pt_BR
// strings in Notes on macOS 27.2. Slug and title from Google autocomplete (pt-BR, 21 Nov): "ficha de treino academia",
// "planilha para anotar treino", "app para anotar treinos e cargas", "registro de treino academia"; nothing for
// "treino no notas do iphone". "Recorde pessoal" is how Brazilian gyms say personal best. Facts are the English
// post's; the picture is its English one, described in Portuguese.

const ui = UI.pt;

const TEMPLATE = `# Ficha de treino, semana de 23 de novembro

## Divisão
- Pernas: agachamento, avanço, panturrilha
- Empurrar: supino, desenvolvimento, paralelas
- Puxar: levantamento terra, remada, barra fixa

## Segunda: pernas
- [ ] Agachamento 3 x 5 com 100 kg
- [ ] Avanço 3 x 10 com 16 kg
- [ ] Panturrilha 3 x 15

## Quarta: empurrar
- [ ] Supino 3 x 6 com 70 kg
- [ ] Desenvolvimento 3 x 8 com 40 kg
- [ ] Paralelas 3 x 10

## Sexta: puxar
- [ ] Levantamento terra 3 x 3 com 120 kg
- [ ] Remada 3 x 8 com 60 kg
- [ ] Barra fixa 3 x 6

## Recordes pessoais
- Levantamento terra: 120 kg x 3 (6 nov)
- Agachamento: 100 kg x 5 (2 nov)
- Supino: 70 kg x 6 (4 nov)
- Corrida de 5 km: 29 min (5 nov)
`;

const FAQ = [
  { q: "O app Notas tem modelo de ficha de treino?", a: [
    "Não. O app Notas não tem modelos nem registro de treino. Uma nota por semana, com um cabeçalho para cada dia de treino e as séries numa checklist, funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "É melhor anotar o treino numa checklist ou numa tabela?", a: [
    "A checklist é mais rápida na academia: marque cada série e mude a carga se foi diferente. Uma tabela, em Formatar, Tabela, alinha datas e cargas, mas o Notas não ordena nem soma a tabela, então ela ajuda menos do que parece.",
  ] },
  { q: "Como acompanho meus recordes pessoais no Notas?", a: [
    "Mantenha uma lista de recordes pessoais no fim da nota e mude a linha quando bater um, com a data. O Notas não percebe um recorde novo por você, então confira a lista depois de cada treino.",
  ] },
  { q: "Existe um registro de treino que guarda meus recordes para mim?", a: [
    "O Pinto Notes tem um modelo grátis de registro de treino: uma linha por sessão e uma lista de recordes pessoais. Conte ao ChatGPT ou ao Claude o que você fez depois do treino e ele registra a sessão e atualiza seus recordes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="ficha-de-treino-notas-iphone"
      intro={<>
        Um app de academia quer uma conta, um plano e uma assinatura antes do seu primeiro agachamento. Uma nota só quer as séries. Aqui
        está um modelo de ficha de treino para o app Notas, como usar na academia e onde ele deixa de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#academia", label: "Na academia" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um registro que guarda seus recordes" },
        ]}>
          <p>
            O app Notas não tem registro de treino, mas uma nota por semana resolve. Coloque sua divisão no topo, um cabeçalho para cada dia
            de treino com as séries numa checklist e seus recordes pessoais no fim. Copie o modelo abaixo e duplique a nota toda semana.
          </p>
          <PostCta template="workout-log" slug="pt/ficha-de-treino-notas-iphone" path="/pt/blog/ficha-de-treino-notas-iphone" position="answer" ui={ui.cta}
            title="Quer seus recordes guardados para você?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de registro de treino. Conte ao ChatGPT ou ao Claude o que você fez depois do treino e ele registra a sessão e atualiza seus recordes pessoais.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/workout-log-note" width={1520} height={1020} maxWidth={640}
        alt="Uma nota Workout log no Pinto Notes no Mac: uma tabela Sessions com uma linha por sessão, de um dia de Pull com Deadlift 115 kg x 3 até Deadlift 120 kg x 3, e uma lista Personal bests embaixo."
        caption="O mesmo registro no Pinto Notes: uma linha por sessão, e seus recordes sempre atualizados. Dados de exemplo." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota por semana</h2>
      <p>
        Uma semana de pernas, empurrar e puxar, como exemplo. Mude a divisão e os exercícios para os seus, depois as cargas. Deixe uma
        palavra em cada linha, porque um item vazio da checklist não sobrevive à colagem.
      </p>
      <Keep title="Ficha de treino para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, crie uma nota nova e escolha Editar, Colar como Markdown. A linha com # vira o título, cada linha com ## um
        cabeçalho, e as séries viram checklists. Um Command + V comum deixa os símbolos como texto. No iPhone, digite as linhas, selecione
        as séries e toque no botão Checklist. Ponha a nota numa pasta Saúde e fixe a nota, para ela ser a primeira coisa que você vê ao
        abrir o Notas na academia.
      </p>

      <h2 id="academia">Na academia</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Arquivo", "Duplicar Nota"] },
        { on: "Mac", steps: ["Formatar", "Mais", "Desmarcar Tudo"] },
      ]} />
      <ul>
        <li>
          <strong>Marque cada série quando terminar.</strong> Se a carga ou as repetições foram diferentes, mude a linha na hora:
          &ldquo;Agachamento 3 x 5 com 102,5 kg&rdquo;. Essa linha editada é o seu registro.
        </li>
        <li>
          <strong>Anote como foi.</strong> Uma palavra depois da linha, como &ldquo;fácil&rdquo; ou &ldquo;última repetição lenta&rdquo;, diz ao
          você da semana que vem se dá para aumentar a carga.
        </li>
        <li>
          <strong>A próxima semana a partir desta.</strong> No domingo, escolha Arquivo, Duplicar Nota, mude a data e as cargas, clique em
          cada dia e escolha Formatar, Mais, Desmarcar Tudo.
        </li>
        <li>
          <strong>Um recorde novo vai para o fim.</strong> Quando uma série bater uma linha dos recordes pessoais, mude essa linha e a data.
        </li>
      </ul>
      <p>
        Se prefere ver as semanas numa grade, Formatar, Tabela cria uma; o guia{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra como, e o que elas não fazem. Para
        registrar hábitos em vez de séries, existe o <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker no Notas</a>, e mais notas
        para colar como esta no guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a> (em inglês).
      </p>

      <h2 id="limites">Onde uma ficha de treino no Notas para</h2>
      <ul>
        <li><strong>Cada semana é uma nota.</strong> Para ver como foi o seu supino neste mês, você abre quatro notas e lê lado a lado.</li>
        <li><strong>Os recordes são à mão.</strong> O Notas não percebe que 120 kg bateu 115 kg. Você confere a lista e muda sozinho, ou não muda.</li>
        <li><strong>Tabelas não fazem contas.</strong> Uma tabela no Notas não ordena por exercício nem soma o volume da semana.</li>
        <li><strong>Nada de respostas.</strong> &ldquo;O que eu fiz na quarta passada?&rdquo; significa rolar a tela.</li>
      </ul>
      <p>
        Para uma semana, uma nota é o registro mais rápido que existe. Ao longo de meses, a parte útil, ver que você está ficando mais
        forte, fica com você.
      </p>

      <h2 id="pinto-notes">Um registro de treino que guarda seus recordes</h2>
      <p>
        É para isso que existe o Pinto Notes. Ele tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude
        podem trabalhar nas suas notas a partir da conversa que você já usa. O modelo grátis de{" "}
        <a href="/templates/workout-log">registro de treino</a> é uma nota para todo o seu treino: uma tabela com uma linha por sessão, com
        a data, o treino, o exercício, o resultado e o esforço que você sentiu, de 1 a 10, e seus recordes pessoais embaixo.
      </p>
      <p>
        Depois do treino, conte à sua IA o que você fez: &ldquo;terra, 120 para três, pareceu um nove&rdquo;. Ela adiciona a linha e, quando
        é um recorde novo, muda essa linha também. Depois pergunte &ldquo;estou ficando mais forte no supino?&rdquo; ou &ldquo;o que eu fiz
        na quarta passada?&rdquo; e ela responde com base no registro inteiro. Você ainda pode adicionar e editar cada linha sozinho, e cada
        versão anterior da nota fica guardada. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em
        inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. Suas notas do app Notas vêm junto em{" "}
        <a href="/blog/import-your-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
