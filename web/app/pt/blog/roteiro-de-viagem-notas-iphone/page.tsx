import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "roteiro-de-viagem-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-trip-planner-template (21 Nov 2026). Apple's own pt-BR words, read
// 21 Nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac "Adicione listas no app Notas do Mac" (botão
// Checklist, Formatar > Mais > Desmarcar Tudo), apd0a136b9cc/mac "Adicione uma tabela no Notas do Mac" (Formatar >
// Tabela), and the iPhone User Guide, support.apple.com/pt-br/guide/iphone/iph908d1558b/ios "Adicione links no app
// Notas do iPhone" (Adicionar Link, Link para Seção). Editar > Colar como Markdown (new in macOS 27), Arquivo >
// Duplicar Nota and Anexar Arquivo are the pt_BR strings in Notes on macOS 27.2. Apple's pt-BR page gives the iPhone's
// edit menu no name, so the path says "menu de edição" as a description; the link dialog's field isn't named either.
// Slug and title from Google autocomplete (pt-BR, 21 Nov): "roteiro de viagem modelo", "roteiro de viagem modelo
// pronto", "checklist de viagem", "app roteiro de viagem iphone"; nothing for "roteiro de viagem no notas". Facts are
// the English post's; the example trip is the same Lisbon one, flying from São Paulo.

const ui = UI.pt;

const TEMPLATE = `# Lisboa, 22 a 26 de outubro

## Reservas
- [ ] Voo GRU para LIS, qui 22 out 06:55, código TP7XQ2
- [ ] Hotel no Príncipe Real, 22 a 26 out, código 88412093
- [ ] Jantar com fado, sáb 24 out 20:00
- [ ] Voo LIS para GRU, seg 26 out 17:40

## Quinta, 22 de outubro
- 06:55 Voo para Lisboa
- 13:00 Almoço no Time Out Market
- 15:00 Check-in no hotel
- 19:30 Pôr do sol no Miradouro da Senhora do Monte

## Sexta, 23 de outubro
- 09:30 Elétrico 28 até Alfama
- 12:00 Almoço perto do castelo
- Tarde livre

## Sábado, 24 de outubro
- 10:00 Bate-volta a Sintra
- 20:00 Jantar com fado

## Mala
- [ ] Passaporte ou RG
- [ ] Dados do seguro viagem
- [ ] Carregador do celular
- [ ] Adaptador de tomada
- [ ] Sapato confortável
- [ ] Capa de chuva
- [ ] Escova de dentes
- [ ] Protetor solar

## Ideias
- Trazer sardinha em lata
- Pedir para a Marina a lista de padarias dela
`;

const FAQ = [
  { q: "O app Notas tem modelo de roteiro de viagem?", a: [
    "Não. O app Notas não tem planejador de viagem nem modelos. Uma nota com um cabeçalho para as reservas, um cabeçalho para cada dia e uma checklist da mala funciona como um, e você pode colar o modelo desta página direto nela.",
  ] },
  { q: "Dá para guardar as passagens no app Notas?", a: [
    "Sim. No Mac, arraste o PDF para dentro da nota. No iPhone com iOS 27, Anexar Arquivo fica no menu de edição. Um porém: uma nota com um arquivo anexado não pode ser bloqueada.",
  ] },
  { q: "Como reaproveito a lista da mala na próxima viagem?", a: [
    "Duplique a nota com Arquivo, Duplicar Nota, depois clique na lista da mala e escolha Formatar, Mais, Desmarcar Tudo. Mude as datas e apague os dias antigos.",
  ] },
  { q: "Existe um planejador de viagem grátis que funciona como uma nota?", a: [
    "O Pinto Notes tem um modelo grátis de plano de viagem: uma nota que é um pequeno app, com contagem regressiva, cada dia como uma linha do tempo, as reservas com uma marcação de pago e a lista da mala. O ChatGPT ou o Claude podem adicionar nele uma reserva que você colar.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="roteiro-de-viagem-notas-iphone"
      intro={<>
        O voo está num e-mail, o hotel em outro, o plano de sábado numa conversa e a lista da mala na sua cabeça. O app Notas guarda tudo
        isso numa nota só. Aqui está um modelo de viagem para colar, três jeitos de deixar ele melhor e onde ele para.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#modelo", label: "O modelo" },
          { href: "#configurar", label: "Configure" },
          { href: "#melhor", label: "Deixe melhor" },
          { href: "#limites", label: "Onde ele para" },
          { href: "#pinto-notes", label: "Um plano que faz as contas" },
        ]}>
          <p>
            O app Notas não tem planejador de viagem, mas uma nota resolve. Coloque uma checklist das reservas que você marca quando estão
            pagas, um cabeçalho para cada dia com o horário na frente de cada plano e uma checklist da mala. Copie o modelo abaixo.
          </p>
          <PostCta template="trip-plan" slug="pt/roteiro-de-viagem-notas-iphone" path="/pt/blog/roteiro-de-viagem-notas-iphone" position="answer" ui={ui.cta}
            title="Quer a contagem regressiva e as reservas em dia?">
            <p>O Pinto Notes funciona como o app Notas e tem um modelo grátis de plano de viagem: quantos dias faltam, cada dia como uma linha do tempo, o que falta pagar e o que já está na mala. Cole um e-mail de reserva no ChatGPT ou no Claude e ele entra no plano.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/trip-booking" width={1200} height={750} maxWidth={560}
        alt="Um envelope desenhado com uma seta para um cartão de checklist, com dois itens marcados em laranja."
        caption="Cada e-mail de reserva vira uma linha no roteiro." />}
      faq={FAQ}
    >
      <h2 id="modelo">O modelo: uma nota por viagem</h2>
      <p>
        Quatro dias em Lisboa, como exemplo. Troque pela sua viagem antes de colar: as reservas com os códigos de confirmação, um
        cabeçalho por dia e o que você sempre esquece de levar. Deixe uma palavra em cada linha, porque um item vazio da checklist não
        sobrevive à colagem.
      </p>
      <Keep title="Roteiro de viagem para o app Notas" text={TEMPLATE} copyLabel={ui.copy}
        note="No Mac, cole numa nota nova com Editar, Colar como Markdown." />

      <h2 id="configurar">Configure</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="O mesmo Markdown colado duas vezes no app Notas do macOS 27: com Command + V os símbolos ficam como texto, e com Editar, Colar como Markdown ele vira um título, uma lista e texto em negrito."
        caption="Colagem comum à esquerda, Colar como Markdown à direita. As linhas da checklist funcionam do mesmo jeito." />
      <Paths rows={[{ on: "Mac", steps: ["Editar", "Colar como Markdown"] }]} />
      <p>
        Num Mac com macOS 27, crie uma nota nova e escolha Editar, Colar como Markdown. A linha com # vira o título, cada linha com ## um
        cabeçalho, as reservas e a mala viram checklists e os planos continuam como lista. Um Command + V comum deixa os símbolos como
        texto. No iPhone, digite as linhas, selecione as reservas e a mala e toque no botão Checklist.
      </p>
      <p>
        Marque uma reserva quando ela estiver paga, e as desmarcadas são o que você ainda deve. Se prefere ver as reservas numa tabela, com
        colunas para a data e o código, Formatar, Tabela cria uma; o guia{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">de tabelas no app Notas</a> (em inglês) mostra como, e o que elas não fazem.
      </p>

      <h2 id="melhor">Deixe melhor</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Editar", "Adicionar Link", "Link para Seção"], keys: "⌘K" },
        { on: "iPhone", steps: ["menu de edição", "Adicionar Link", "Link para Seção"] },
      ]} />
      <ul>
        <li>
          <strong>Um índice no topo.</strong> No macOS 27 e no iOS 27, um link pode apontar para um cabeçalho, então a nota pode começar
          com um link para cada dia. Digite o título da viagem no campo do link e os cabeçalhos dela aparecem. O post{" "}
          <a href="/blog/apple-notes-ios-27" hrefLang="en">sobre as novidades do Notas no iOS 27</a> (em inglês) tem os detalhes.
        </li>
        <li>
          <strong>As passagens dentro da nota.</strong> No Mac, arraste o PDF da passagem ou da confirmação do hotel para dentro da nota,
          embaixo da reserva. No iPhone com iOS 27, use Anexar Arquivo no menu de edição. Uma nota com arquivo não pode ser bloqueada, então
          deixe o número do passaporte fora dela.
        </li>
        <li>
          <strong>A mesma lista da próxima vez.</strong> Quando voltar, escolha Arquivo, Duplicar Nota, depois clique na lista da mala e
          escolha Formatar, Mais, Desmarcar Tudo. A cópia é o começo da próxima viagem.
        </li>
      </ul>
      <p>
        Se você planeja assim com frequência, o guia <a href="/blog/apple-notes-templates" hrefLang="en">de modelos para o app Notas</a>{" "}
        (em inglês) tem uma lista de mala e uma revisão semanal para colar do mesmo jeito.
      </p>

      <h2 id="limites">Onde um roteiro de viagem no Notas para</h2>
      <ul>
        <li><strong>Nada de contagem regressiva.</strong> As datas são só palavras. O Notas não sabe que a viagem é daqui a nove dias, nem que hoje é o segundo dia.</li>
        <li><strong>Reservas à mão.</strong> Cada e-mail de confirmação é copiado linha por linha: o horário, o código, o dia a que pertence.</li>
        <li><strong>Os dias não se organizam.</strong> Adicione um jantar na sexta e você mesmo procura o cabeçalho da sexta e o lugar certo nele. Passe para o sábado e é recortar e colar.</li>
        <li><strong>Nada de contagem.</strong> Saber quantas reservas ainda não foram pagas ou quanto falta pôr na mala significa contar marcações.</li>
      </ul>
      <p>
        Para um fim de semana fora, a nota sobra. Para uma semana com voos, trens e alguns jantares reservados, você acaba mantendo o plano
        em ordem à mão.
      </p>

      <h2 id="pinto-notes">Um plano de viagem que faz as contas</h2>
      <Figure shot={{ ...SHOTS.tripApp, alt: "O app de plano de viagem numa nota do Pinto Notes no Mac: Lisboa, faltam 9 dias, 3 de 5 reservas pagas, 5 de 14 itens na mala e o primeiro dia como uma linha do tempo com o voo e o hotel." }}
        caption="O modelo de plano de viagem no Pinto Notes num Mac, com dados de exemplo: faltam 9 dias, 3 de 5 reservas pagas, 5 de 14 itens na mala e o primeiro dia como linha do tempo." />
      <p>
        É para isso que existe o Pinto Notes. Ele tem a cara do app Notas e funciona como ele no iPhone e no Mac, e uma nota também pode
        ser um pequeno app. O modelo grátis de <a href="/templates/trip-plan">plano de viagem</a> é um deles. Você diz para onde vai e
        quando, e ele faz a contagem regressiva e depois mostra em que dia da viagem você está. Cada dia é uma linha do tempo com as reservas
        no lugar. As reservas têm um tipo, um horário, um código e uma marcação quando pagas, então ele diz o que falta pagar. A lista da
        mala é separada por grupos, um toque por item, e uma viagem nova a mantém.
      </p>
      <p>
        Você também pode colar uma confirmação de reserva no ChatGPT ou no Claude, na conversa que já usa, e ele adiciona a reserva no dia
        certo. Pergunte o que ainda falta reservar e ele lê o plano para responder.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar o ChatGPT</a> (em inglês) leva um minuto.
      </p>
      <p>
        O app está em inglês. Suas notas do app Notas vêm junto em{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no seu Mac</a> (em inglês), e o app Notas fica como estava.
      </p>
    </LocalPostPage>
  );
}
