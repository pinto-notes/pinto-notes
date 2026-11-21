import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "checklist-mudanca-notas-iphone");

// Versão pt-BR de /blog/apple-notes-moving-checklist-template, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "checklist mudança casa" sugeriu "checklist mudança de casa".
// Apple pt-BR consultada em 21 nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac
// (Lista de Verificação), apd0a136b9cc/mac (Formatar > Tabela),
// support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios (Formatação, Cabeçalho, Tabela)
// e support.apple.com/pt-br/102296 (itens de checklist). Sem imagem no original.

const ui = UI.pt;
const TEMPLATE = `Mudança, 5 de dezembro de 2026

De: Rua das Acácias, 18, ap. 202, São Paulo
Para: Rua dos Ipês, 42, ap. 404, São Paulo
Chaves: retirar com o porteiro do prédio novo às 8h

Avisar a mudança de endereço
Marina: atualizar o endereço no banco até 28 de novembro
Teo: avisar o RH da empresa até 30 de novembro
Marina: falar com a seguradora residencial até 28 de novembro
Teo: pedir redirecionamento de correspondência aos Correios até 30 de novembro
Os dois: atualizar endereços de entrega antes da próxima compra

Contas e serviços
Teo: confirmar início da energia no endereço novo em 5 de dezembro
Marina: confirmar o último dia de energia no endereço antigo
Teo: confirmar instalação da internet em 7 de dezembro, das 9h às 12h
Marina: perguntar à companhia de água como encerrar a conta antiga
Os dois: anotar a leitura final dos medidores antes de devolver as chaves

Antes de o caminhão chegar
Marina: confirmar local de carga com a transportadora em 3 de dezembro
Teo: embalar C01 e Q01 e atualizar a lista de caixas
Marina: deixar a bolsa com a chaleira fora das caixas
Os dois: levar chaves e carregadores na bolsa do dia

Dia da mudança
8h Marina retira as chaves novas
9h Teo encontra o caminhão na Rua das Acácias
12h30 Os dois conferem o apartamento antigo e anotam os medidores
15h Marina devolve as chaves antigas ao zelador

Contatos do dia, exemplo fictício
Transportadora: Alex, (11) 5550-0147, reserva M0526
Porteiro do prédio novo: Robson, (11) 5550-0182, chaves às 8h
Zelador do prédio antigo: Samuel, (11) 5550-0114, chaves às 15h

Primeira noite
Achar C01 para pegar canecas e chaleira
Achar Q01 para pegar lençóis e toalhas
Abrir a bolsa do dia antes das outras caixas
`;
const BOXES = `Caixa\tCômodo\tConteúdo
C01\tCozinha\tChaleira, duas canecas, chá, colheres
C02\tCozinha\tPratos, tigelas, panos de prato
Q01\tQuarto\tLençóis, dois travesseiros, toalhas de banho
S01\tSala\tCabos da mesa, roteador, filtro de linha`;
const FAQ = [
  { q: "Como fazer uma checklist de mudança no Notas?", a: ["Copie a estrutura para uma nota. No Mac, selecione as tarefas de cada seção e clique em Lista de Verificação. Deixe horários e contatos como texto e use uma tabela para as caixas."] },
  { q: "Quem avisar da mudança de endereço?", a: ["Comece por banco, empregador, seguradora, Correios e entregas frequentes. Acrescente outras instituições que usam seu endereço e confira o procedimento de cada uma."] },
  { q: "Como identificar as caixas?", a: ["Use uma letra do cômodo e um número, como C01 para a primeira caixa da cozinha. Escreva o mesmo código na caixa e na nota, com cômodo de destino e conteúdo."] },
  { q: "O Claude pode atualizar a checklist no Pinto Notes?", a: ["Sim. Depois de conectado, ele pode ler e editar a nota quando você pedir. O modelo para copiar está nesta página; o Pinto não traz uma checklist de mudança pronta."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="checklist-mudanca-notas-iphone"
    intro={<>Copie esta checklist de mudança para o app Notas. Ela reúne avisos de endereço, serviços, contatos do dia e uma tabela para achar as caixas na casa nova.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "A checklist" }, { href: "#configurar", label: "Configure" },
      { href: "#caixas", label: "As caixas" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Atualize com IA" },
    ]}><p>Use uma nota com tarefas de endereço e serviços, horários e contatos. Dê um responsável a cada tarefa e repita na nota os códigos escritos nas caixas. Troque os dados fictícios antes de usar.</p>
      <PostCta slug="pt/checklist-mudanca-notas-iphone" path="/pt/blog/checklist-mudanca-notas-iphone" position="answer" ui={ui.cta} title="Quer que a IA atualize a nota?">
        <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois de conectar ChatGPT ou Claude, você pode pedir que leiam a nota e mudem tarefas ou o conteúdo das caixas.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modelo">Uma nota para a mudança</h2>
    <p>Marina e Teo se mudam em 5 de dezembro neste exemplo fictício. Cada aviso tem responsável e prazo. As tarefas de serviços continuam abertas até a confirmação do fornecedor.</p>
    <Keep title="Checklist de mudança para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole como texto. Transforme os grupos de tarefas em checklists." />
    <h2 id="configurar">Transforme as tarefas em checklists</h2>
    <p>Use uma nota do iCloud ou salva no aparelho. No Mac, selecione só as tarefas em Avisar a mudança de endereço e clique no botão Lista de Verificação. Repita nas demais seções de tarefas. Deixe os títulos fora da seleção e marque cada item ao concluí-lo.</p>
    <p>No iPhone, comece cada grupo com o botão Lista de Verificação e digite as tarefas. Return cria outro item. Para um título de seção, selecione o texto, toque em Formatação e escolha Cabeçalho. Veja o <a href="https://support.apple.com/pt-br/102296">guia de checklists da Apple</a>.</p>
    <p>Mantenha Dia da mudança e Contatos do dia como texto. O horário de retirar as chaves deve continuar visível. Outros formatos estão no <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos</a> (em inglês).</p>
    <h2 id="caixas">Uma lista para usar ao desempacotar</h2>
    <p>Escreva C01 na caixa e na nota. Acrescente o cômodo e detalhes suficientes para achar algo específico. Se mudar um objeto de caixa, atualize a linha.</p>
    <Keep title="Conteúdo das caixas" text={BOXES} copyLabel={ui.copy} note="Há Tab entre as colunas. No Mac, selecione as linhas e clique no botão Tabela." />
    <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"] }]} />
    <p>No Mac, selecione as cinco linhas, do cabeçalho até S01, e clique no botão Tabela. Cada Tab vira uma coluna; Tab na última célula cria outra linha. No iPhone, toque em Tabela e preencha as células. Também dá para deixar cada caixa em uma linha simples. Veja o <a href="/blog/apple-notes-tables" hrefLang="en">guia de tabelas</a> (em inglês).</p>
    <p>Deixe as caixas da primeira noite juntas no caminhão para encontrar os itens ao chegar.</p>
    <h2 id="limites">Onde o modelo para</h2>
    <p>As datas são texto. Se a mudança passar para 12 de dezembro, revise cada serviço e compromisso. Crie alertas separados. Marcar uma tarefa não avisa o fornecedor nem muda uma conta. Os códigos das caixas não geram etiquetas. Confira as caixas de verdade antes de o caminhão sair.</p>
    <h2 id="pinto-notes">Atualize a nota com IA</h2>
    <p>O Pinto Notes é um app grátis para iPhone e Mac que se parece e funciona como o app Notas. Você pode montar esta nota com cabeçalhos, checklists e tabela. Não há um modelo de mudança pronto no Pinto; copie o desta página.</p>
    <p>Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (guia em inglês) ou Claude, peça para mudar a instalação da internet para 8 de dezembro, das 10h às 13h, sem alterar o dia da mudança. Ou para mover o roteador de S01 para C02. Confira com a confirmação do serviço ou a caixa.</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
