import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "ordenar-itens-marcados-notas-iphone");

// Brazilian Portuguese version of /blog/apple-notes-checklist-sort (21 Nov 2026). Apple's own pt-BR words, read 21 Nov:
// support.apple.com/pt-br/102296 ("Criar uma checklist com o app Notas", published 25 Feb 2025: Ajustes > Apps > Notas,
// "Ordenar Itens Marcados", Manualmente ou Automaticamente, arrastar para reordenar, deslizar para a direita para recuar e
// para a esquerda para reverter, o botão Checklist, o círculo em branco); the iOS 16 pt-BR iPhone guide "Crie e formate
// notas" (support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/16.0/ios/16.0: Ajustes > Notas > Ordenar Itens Marcados >
// Automaticamente; its in-note menu with "Mover Verificados para Parte Inferior" isn't in the current guides, so it's left
// out); Mac guide apd93c815aa0 ("Adicione listas": mantenha o clique e arraste, "Ordenar automaticamente os itens marcados"
// nos ajustes, Formatar > Mais > Marcar Todas ou Desmarcar Tudo, Command e clique em qualquer item, Tab e Shift + Tab,
// Control + Command + Seta Acima ou Abaixo), apd97da26aed ("Altere os ajustes do app Notas do Mac": Notas > Ajustes; moves
// checked items to the end and unchecked items back to the top) and apd46c25187e (atalhos: Shift + Command + L "Aplicar
// formato de checklist", Shift + Command + U "Marcar ou desmarcar um item da checklist", Control + Command + Seta para Cima ou
// para Baixo). Apple's pt-BR pages name the Mac setting two ways; the post uses "Ordenar automaticamente os itens marcados",
// the pt_BR string in Notes Settings on macOS 27.2, as the earlier pt posts do. The Format menu item is "Marcar Tudo" in
// Notes on macOS 27.2 (Apple's page says "Marcar Todas"). Arquivo > Duplicar Nota, Arquivo > Nova Pasta Inteligente and the
// Smart Folder rule Checklists with unchecked items follow the earlier pt posts (lista-de-compras, ata-de-reuniao). Slug and
// title from Google autocomplete (pt-BR, 21 Nov): "ordenar itens marcados notas iphone" (offered for "itens marcados" and
// "ordenar itens marcados"), "checklist notas iphone", "como fazer checklist notas iphone", "app notas checklist". Facts are
// the English post's.

const ui = UI.pt;

const FAQ = [
  { q: "Por que os itens marcados vão para o fim no app Notas?", a: [
    "Porque Ordenar Itens Marcados está em Automaticamente. No iPhone, vá em Ajustes, Apps, Notas, Ordenar Itens Marcados e toque em Manualmente para os itens marcados ficarem onde estão. No Mac, escolha Notas, Ajustes e desmarque \"Ordenar automaticamente os itens marcados\".",
  ] },
  { q: "Dá para ordenar os itens marcados numa nota só?", a: [
    "O ajuste vale para todas as checklists de todas as notas naquele aparelho. Para arrumar uma lista e deixar as outras como estão, deixe o ajuste desativado e arraste os itens marcados para baixo à mão.",
  ] },
  { q: "O app Notas coloca uma checklist em ordem alfabética?", a: [
    "Não. O Notas mantém os itens na ordem em que você digita, e a ordenação que a Apple descreve só leva os itens marcados para o fim. Arraste os itens à mão, ou no Mac pressione Control + Command + Seta para Cima ou para Baixo para mover uma linha de cada vez.",
  ] },
  { q: "Qual é o atalho de teclado para checklist no app Notas?", a: [
    "No Mac, Shift + Command + L transforma a linha numa checklist e Shift + Command + U marca ou desmarca o item onde você está. Command e clique em qualquer item marca todos.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="pt"
      slug="ordenar-itens-marcados-notas-iphone"
      intro={<>
        Marque um item numa checklist do app Notas e ele ou desce para o fim, ou fica onde está. Um ajuste decide qual dos dois, e ele fica
        num lugar diferente no iPhone e no Mac. Aqui está onde encontrar esse ajuste, como mover itens à mão e como zerar uma lista.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "No iPhone" },
          { href: "#mac", label: "No Mac" },
          { href: "#a-mao", label: "Mova itens à mão" },
          { href: "#desmarcar-tudo", label: "Desmarcar Tudo" },
          { href: "#atalhos", label: "Atalhos" },
          { href: "#pinto-notes", label: "Uma lista que se arruma sozinha" },
        ]}>
          <p>
            No iPhone, vá em Ajustes, Apps, Notas, toque em Ordenar Itens Marcados e depois em Automaticamente para mandar os itens
            marcados para o fim, ou em Manualmente para deixar onde estão. No Mac, escolha Notas, Ajustes e marque ou desmarque
            &ldquo;Ordenar automaticamente os itens marcados&rdquo;. É um ajuste só para todas as suas notas, então basta definir uma vez em
            cada aparelho.
          </p>
          <PostCta template="grocery-list" slug="pt/ordenar-itens-marcados-notas-iphone" path="/pt/blog/ordenar-itens-marcados-notas-iphone" position="answer" ui={ui.cta}
            title="Quer que os itens marcados sejam limpos para você?">
            <p>O Pinto Notes funciona como o app Notas e tem uma lista de compras grátis. Diga ao ChatGPT ou ao Claude o que você precisa e ele põe cada item no seu setor, e depois limpa as linhas marcadas quando você volta.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Uma nota Groceries no app Notas num Mac: oito itens não marcados, de Oat milk a Dark chocolate, e depois Sourdough, Eggs e Spinach marcados no fim."
        caption="Uma checklist de compras no app Notas num Mac, com os itens marcados no fim." />}
      faq={FAQ}
    >
      <h2 id="iphone">Mande os itens marcados para o fim no iPhone</h2>
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Ordenar Itens Marcados"] },
      ]} />
      <p>
        O ajuste fica no app Ajustes, não no Notas. Abra Ajustes, toque em Apps, depois em Notas, depois em Ordenar Itens Marcados, e
        escolha:
      </p>
      <ul>
        <li><strong>Automaticamente.</strong> Cada item que você marca desce para o fim da checklist, e o que falta fica em cima.</li>
        <li><strong>Manualmente.</strong> Os itens marcados ficam onde estão. Escolha isso se a sua lista tem uma ordem que você quer manter, como os passos de uma receita.</li>
      </ul>
      <p>
        Nas versões mais antigas do iOS, o mesmo ajuste fica um nível acima, em Ajustes, Notas, Ordenar Itens Marcados. De um jeito ou de
        outro, ele vale para todas as checklists de todas as notas naquele iPhone.
      </p>

      <h2 id="mac">Mande os itens marcados para o fim no Mac</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Notas", "Ajustes", "Ordenar automaticamente os itens marcados"] },
      ]} />
      <p>
        No Notas, escolha Notas, Ajustes e marque &ldquo;Ordenar automaticamente os itens marcados&rdquo;. Marque um item e ele desce para o
        fim da lista. Desmarque e ele volta para o topo. Desative o ajuste e os itens ficam onde estão quando você marca.
      </p>
      <p>
        O Mac tem o próprio ajuste, separado do iPhone, então defina nos dois se quiser que as suas listas se comportem igual em cada um.
      </p>

      <h2 id="a-mao">Mova um item da checklist à mão</h2>
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Arraste o item"] },
        { on: "Mac", steps: ["Mantenha o clique", "Arraste"] },
        { on: "Mac", steps: ["Mover item para cima"], keys: "⌃⌘↑" },
        { on: "Mac", steps: ["Mover item para baixo"], keys: "⌃⌘↓" },
      ]} />
      <p>
        Com a ordenação em Manualmente, a ordem é sua. No iPhone, arraste um item para onde você quiser. No Mac, mantenha o clique num item
        e arraste, ou ponha o cursor numa linha e pressione Control + Command + Seta para Cima ou para Baixo para mover uma posição de cada
        vez. O Notas não tem ordem alfabética para checklist, então arrastar também é o jeito de pôr os itens em ordem.
      </p>
      <p>
        Para agrupar itens, use o recuo. No iPhone, deslize um item para a direita para recuar e para a esquerda para desfazer. No Mac,
        pressione Tab para recuar e Shift + Tab para desfazer. Para o mercado, cabeçalhos funcionam melhor que a ordem: um cabeçalho por
        setor, como no modelo de <a href="/pt/blog/lista-de-compras-notas-iphone">lista de compras no Notas do iPhone</a>.
      </p>

      <h2 id="desmarcar-tudo">Desmarcar tudo, ou marcar tudo</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Formatar", "Mais", "Desmarcar Tudo"] },
        { on: "Mac", steps: ["Formatar", "Mais", "Marcar Tudo"] },
      ]} />
      <p>
        Para reaproveitar uma lista, clique nela e escolha Formatar, Mais, Desmarcar Tudo. Marcar Tudo marca todos os itens. Também há um
        jeito mais rápido: Command e clique em qualquer item. Se algum item estiver desmarcado, o Notas marca todos, e se todos estiverem
        marcados, ele desmarca todos.
      </p>
      <p>
        Desmarcar tudo apaga o registro do que você marcou. Para uma lista que você guarda pelo histórico, como um{" "}
        <a href="/pt/blog/habit-tracker-notas-iphone">habit tracker</a>, escolha Arquivo, Duplicar Nota antes e zere a cópia.
      </p>

      <h2 id="atalhos">Atalhos de teclado de checklist no Mac</h2>
      <MenuPaths rows={[
        { on: "Checklist", steps: ["Aplicar formato de checklist"], keys: "⇧⌘L" },
        { on: "Marcar", steps: ["Marcar ou desmarcar um item"], keys: "⇧⌘U" },
        { on: "Mover", steps: ["Item para cima ou para baixo"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        Shift + Command + L aplica o formato de checklist, o mesmo que o botão Checklist. Shift + Command + U marca ou desmarca o item onde
        está o cursor, então você nunca precisa do mouse. Shift + Return adiciona uma segunda linha dentro de um item. No iPhone, toque no
        botão Checklist, e cada Return começa o próximo item.
      </p>

      <h2 id="listas-abertas">Ache todas as listas com algo por fazer</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="A janela New Smart Folder no app Notas do macOS 27, com o nome Open to-dos e uma regra: Checklists, Unchecked."
        caption="Uma Pasta Inteligente com todas as notas que têm um item não marcado. App Notas no macOS 27." />
      <p>
        Ordenar arruma uma lista. Para ver todas, crie uma Pasta Inteligente com a regra Checklists com itens não marcados: ela lista todas
        as notas que ainda têm um item não marcado, de qualquer pasta. No Mac, escolha Arquivo, Nova Pasta Inteligente. Os passos para o
        iPhone estão no guia <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">de etiquetas e Pastas Inteligentes</a> (em
        inglês).
      </p>

      <h2 id="limites">Onde a ordenação da checklist para</h2>
      <ul>
        <li><strong>Todas as notas ou nenhuma.</strong> O ajuste cobre todas as checklists do aparelho, então uma lista de compras e uma receita se ordenam do mesmo jeito.</li>
        <li><strong>Os itens marcados se acumulam.</strong> Eles descem para o fim e ficam lá até você apagar ou desmarcar.</li>
        <li><strong>A ordem é à mão.</strong> O Notas não ordena por nome nem por setor, e um item novo fica onde você digitou.</li>
      </ul>
      <p>
        Para uma lista que você usa toda semana, tudo bem. Para uma lista que muda todo dia, arrumar vira um trabalho à parte.
      </p>

      <h2 id="pinto-notes">Uma lista que se arruma sozinha</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Uma nota Groceries no Pinto Notes no Mac. As cinco linhas que o ChatGPT acabou de adicionar estão destacadas, e uma barra embaixo diz que o ChatGPT mudou 5 linhas, com Undo." }}
        caption="Uma nota Groceries no Pinto Notes no Mac. As cinco linhas que o ChatGPT acabou de adicionar estão destacadas, com Undo embaixo." />
      <p>
        O Pinto Notes tem a cara do app Notas e funciona como ele no iPhone e no Mac, e o ChatGPT ou o Claude podem trabalhar nas suas notas
        a partir da conversa que você já usa. O modelo grátis de <a href="/templates/grocery-list">lista de compras</a> é uma lista só, com
        um cabeçalho para cada setor.
      </p>
      <p>
        Diga à sua IA o que você precisa, mesmo numa frase comprida, e ela põe cada item no setor certo e pula o que já está na lista.
        Marque os itens enquanto compra. Diga &ldquo;voltei do mercado&rdquo; e ela tira as linhas marcadas e diz o que ficou faltando.
        Você ainda pode adicionar, marcar e arrastar cada item sozinho, e cada versão anterior de uma nota fica guardada. Isso funciona
        depois que o ChatGPT ou o Claude estiverem conectados, e{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar o ChatGPT</a> (em inglês) leva um minuto. O app está em
        inglês.
      </p>
      <p>
        As checklists que você já tem no app Notas vêm numa <a href="/blog/move-from-apple-notes" hrefLang="en">importação só no seu
        Mac</a> (em inglês), e o app Notas não muda.
      </p>
    </LocalPostPage>
  );
}
