import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "lista-de-desejos-notas-iphone");
// Versão pt-BR de /blog/apple-notes-wishlist-template, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "lista de desejos" sugeriu "lista de desejos" e "lista de desejos amazon"; a busca longa com "notas iphone" não sugeriu termos.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/not9474646a9/mac, apd93c815aa0/mac, apd0a136b9cc/mac; support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
const ui = UI.pt;
const TEMPLATE = `Minha lista de desejos

Próxima revisão: 28 de novembro de 2026
Regra: esperar pelo menos sete dias antes de decidir. Conferir o preço novamente antes de comprar.

Luminária de mesa com braço ajustável
Link: https://example.com/luminaria
Preço visto: R$ 189,90, com entrega
Visto em: 21 de novembro de 2026
Motivo: a luz do teto deixa minha mesa escura depois do pôr do sol.
Esperar até: 28 de novembro de 2026
Decisão: aguardando. Medir o espaço ao lado do monitor primeiro.

Moedor manual de café
Link: https://example.com/moedor
Preço visto: R$ 279,90, com entrega
Visto em: 20 de novembro de 2026
Motivo: experimentar café moído na hora nos fins de semana.
Esperar até: 27 de novembro de 2026
Decisão: aguardando. Pegar um moedor emprestado por um fim de semana.

Suporte para notebook
Link: https://example.com/suporte
Preço visto: R$ 119,90, com entrega
Visto em: 12 de novembro de 2026
Motivo: elevar a tela nas videochamadas.
Esperar até: 19 de novembro de 2026
Decisão: não comprar, 21 de novembro. Os livros sob o notebook já resolvem.

Antes de decidir
Medir o espaço da luminária na mesa.
Pegar um moedor emprestado no fim de semana.
`;
const TABLE = `Item\tEsperar até / decisão
Luminária\t28 nov 2026 / Aguardando, medir a mesa
Moedor\t27 nov 2026 / Aguardando, testar um emprestado
Suporte\t19 nov 2026 / Não comprar, os livros resolvem
`;
const FAQ = [
  {q:"Como criar uma lista de desejos no Notas?",a:["Cole o modelo numa nota. Para cada produto, guarde link, preço com data, motivo, dia para decidir e decisão. Use uma checklist para verificações pendentes."]},
  {q:"É melhor tabela ou checklist?",a:["A tabela resume datas e decisões. A checklist serve para ações antes da compra. Deixe motivos e links nos registros completos."]},
  {q:"O que anotar antes de comprar?",a:["Escreva o que o produto resolveria, o que você já usa, preço com entrega e quando vai reconsiderar. Na revisão, registre comprar, esperar ou não comprar e explique por quê."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="lista-de-desejos-notas-iphone"
    intro={<>Guarde links, preços e motivos numa lista de desejos no Notas. Uma data para reconsiderar cada compra ajuda você a decidir sem pressa.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modelo",label:"Modelo"},{href:"#preparar",label:"Preparar"},{href:"#revisar",label:"Revisar"},{href:"#limites",label:"Limites"},{href:"#pinto",label:"Usar IA"}]}>
      <p>Uma nota pode guardar cada possível compra com o link, o preço visto, uma data e uma decisão. A checklist fica para o que ainda precisa conferir.</p>
      <PostCta slug="pt/lista-de-desejos-notas-iphone" path="/pt/blog/lista-de-desejos-notas-iphone" position="answer" ui={ui.cta} title="Revise sua lista no Pinto Notes"><p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Com sua permissão, ChatGPT ou Claude pode ler a lista e editar as observações que você pedir. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modelo">Modelo para compras que podem esperar</h2>
    <p>Dois itens ainda aguardam decisão e um foi descartado. Os preços em reais são exemplos inventados. Os links em example.com são espaços para substituir pelos produtos e preços reais, incluindo entrega.</p>
    <Keep title="Lista de desejos para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole como texto simples. Depois, transforme as duas últimas linhas numa checklist." />
    <p>Escreva por que quer o produto. "A mesa fica escura à noite" é algo que você pode conferir. Use outra <a href="/pt/blog/lista-de-presentes-notas-iphone">lista de ideias de presentes</a> para compras destinadas a outras pessoas.</p>
    <h2 id="preparar">Prepare no Mac ou iPhone</h2>
    <MenuPaths rows={[{on:"Mac",steps:["Editar","Colar"]},{on:"Mac",steps:["Selecionar as duas últimas linhas","Botão Checklist"]},{on:"iPhone",steps:["Botão Nova Nota","Digitar o texto"]}]} />
    <p>No Mac, crie uma nota e escolha Editar &gt; Colar. Selecione as duas ações finais e clique no botão Checklist. Marcar uma dessas ações não significa que o produto foi comprado. No iPhone, crie a nota, aplique Cabeçalho aos nomes dos itens e use o botão Checklist abaixo de Antes de decidir. Retorno acrescenta outro item. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia do Notas no iPhone</a>.</p>
    <h3>Tabela opcional para a próxima revisão</h3>
    <Keep title="Resumo da lista de desejos" text={TABLE} copyLabel={ui.copy} note="Cada linha tem uma tabulação entre o produto e sua situação. Cole abaixo dos registros completos." />
    <p>No Mac, selecione as quatro linhas do resumo e clique no botão Tabela. Ou escolha Formatar &gt; Tabela e preencha as células. Tab na última célula acrescenta uma linha. No iPhone, use Adicionar Tabela. Confira o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia de tabelas da Apple</a>. Se atualizar duas cópias da decisão der trabalho, deixe o resumo de fora.</p>
    <h2 id="revisar">Decida depois da espera</h2>
    <p>Sete dias são apenas um exemplo. Na data escolhida, releia o motivo e confira o preço atual. Meça a mesa ou teste o moedor antes de decidir. Anote comprar, esperar ou não comprar, com data e motivo. Se esperar, marque outra data. Mantenha os itens descartados como referência; se comprar, registre o valor pago e a data.</p>
    <h2 id="limites">O que a lista não faz</h2>
    <p>O preço registrado pode mudar. A nota não acompanha estoque nem preços e a data escrita não cria um lembrete. Se precisar de aviso, configure um separadamente. Para poucos produtos, atualizar tudo à mão pode ser suficiente.</p>
    <h2 id="pinto">Revise com ChatGPT ou Claude</h2>
    <p>O Pinto Notes tem cabeçalhos, links e checklists. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, você permite leitura e edição. Peça uma seção com itens cuja espera terminou, usando somente os preços e motivos anotados. Confira as datas e os preços atuais você mesmo antes de comprar.</p>
    <p>Você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar as notas da Apple no Mac</a> sem alterá-las.</p>
  </LocalPostPage>;
}
