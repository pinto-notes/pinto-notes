import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "modelo-de-metas-notas-iphone");
// Versão pt-BR de /blog/apple-notes-goal-template, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "modelo de metas" sugeriu "modelo de metas smart" e "modelo de metas pessoais"; "modelo de metas notas iphone" não retornou sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac, apd93c815aa0/mac, apd0a136b9cc/mac; support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
// Os ícones sem nome textual verificável são descritos pela ação, sem criar nomes de menu.
const ui = UI.pt;
const TEMPLATE = `Concluir A última balsa

Resultado
Terminar um conto com final até 18 de dezembro de 2026.

Ponto de partida
14 de novembro: 1.800 palavras. A abertura está pronta; o final ainda não foi decidido.

Meta
Cerca de 6.000 palavras, com todas as cenas escritas e nenhuma parte faltando.
Um rascunho completo tem todas as cenas e um final.

Evidências
Data\tO que mudou e onde conferir
14 de novembro\t1.800 palavras. Arquivo: A última balsa, 14 nov.
21 de novembro\t2.700 palavras. Cena na Estação da Luz acrescentada; final planejado. Arquivo: A última balsa, 21 nov.

Etapas
29 de novembro: chegar a 3.000 palavras e terminar a cena do meio
13 de dezembro: chegar a cerca de 6.000 palavras e escrever o final
18 de dezembro: reler tudo e preencher as partes faltantes

Próxima ação
Escrever a conversa na Estação da Luz antes de o trem partir.

Próxima revisão
29 de novembro de 2026. Comparar o rascunho atual com o ponto de partida.
Conferir se a cena do meio está pronta e escolher a próxima ação.
`;
const PROMPT = `Leia minha nota de meta "Concluir A última balsa" no Pinto Notes.
Acrescente esta evidência em 28 de novembro de 2026: o rascunho tem 3.200 palavras e a cena do meio está pronta. A fonte é meu arquivo "A última balsa, 28 nov".
Marque como concluída a etapa de 29 de novembro com base nessa evidência.
Preserve o ponto de partida, o resultado, a meta e as evidências anteriores.
Mude a próxima revisão para 6 de dezembro de 2026.
Sugira uma próxima ação aqui na conversa. Se algo não estiver claro, pergunte. Não invente progresso nem links para fontes.`;
const FAQ = [
  { q: "O que incluir numa nota de metas?", a: ["Anote um resultado, um ponto de partida com data, uma meta com prazo, evidências, etapas e a data da próxima revisão. Deixe também uma próxima ação."] },
  { q: "Devo reunir todas as metas numa nota?", a: ["Uma meta que leva semanas e acumula evidências merece uma nota própria. Assim, mudanças na meta ficam perto do plano original."] },
  { q: "A data da revisão cria um aviso?", a: ["Não. É apenas texto. Crie um lembrete separado se precisar de uma notificação."] },
  { q: "Qual a diferença entre meta e hábito?", a: ["A meta registra um resultado e provas do avanço. O hábito registra ações repetidas. Escrever todo dia é um hábito; terminar o conto até 18 de dezembro é uma meta."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="modelo-de-metas-notas-iphone"
    intro={<>Uma nota por meta guarda o ponto de partida, as etapas e as provas do avanço. Copie o modelo preenchido e marque uma data para rever o resultado.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modelo",label:"Modelo"},{href:"#preparar",label:"Preparar"},{href:"#revisar",label:"Revisar"},{href:"#limites",label:"Limites"},{href:"#pinto",label:"Usar IA"}]}>
      <p>Para uma meta de várias semanas, registre um resultado que possa conferir. O exemplo acompanha um conto até o rascunho final, com etapas numa checklist e evidências numa tabela.</p>
      <PostCta slug="pt/modelo-de-metas-notas-iphone" path="/pt/blog/modelo-de-metas-notas-iphone" position="answer" ui={ui.cta} title="Ajuda para atualizar sua meta"><p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois da conexão, ChatGPT ou Claude pode ler a nota e acrescentar as evidências que você fornecer. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modelo">Modelo de meta para copiar</h2>
    <Keep title="Modelo de metas para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota. As etapas podem virar checklist e as linhas com tabulações, uma tabela." />
    <h2 id="preparar">Prepare a nota</h2>
    <p>Use uma nota do iCloud ou armazenada no aparelho. Segundo a Apple, alguns recursos não estão disponíveis em contas de outros provedores. O texto continua legível antes da formatação.</p>
    <MenuPaths rows={[{on:"Mac",steps:["Botão de formatação","Cabeçalho"]},{on:"Mac",steps:["Formatar","Tabela"]},{on:"iPhone",steps:["Botão Formatação","Cabeçalho"]}]} />
    <p>No Mac, cole o modelo, selecione cada nome de seção e aplique Cabeçalho. Selecione as três linhas de Etapas e clique no botão Checklist. Para a tabela, selecione as linhas de Data até 21 de novembro e clique no botão Tabela. As tabulações separam as colunas. Você também pode escolher Formatar &gt; Tabela e preencher as células. Tab na última célula cria uma linha. Veja mais sobre <a href="/blog/apple-notes-tables" hrefLang="en">tabelas no Notas</a>.</p>
    <p>No iPhone, toque no botão Nova Nota e cole o texto. Formate os nomes das seções como Cabeçalho. Refaça as etapas com o botão Checklist e toque em Retorno para acrescentar cada item. Crie a tabela com o botão Adicionar Tabela, insira datas e evidências nas colunas e apague as linhas simples depois.</p>
    <h2>Troque o exemplo por um resultado</h2>
    <p>"Escrever mais" não mostra quando você terminou. "Concluir um conto até 18 de dezembro" permite conferir. Guarde o ponto de partida com data e nome do arquivo. Escolha etapas que deixem algo para verificar. Se o prazo mudar, anote o motivo sem apagar a meta original.</p>
    <h2 id="revisar">Confira as evidências antes de marcar</h2>
    <p>Em 29 de novembro, abra o arquivo e confira a contagem e a cena do meio. Acrescente uma linha com data e fonte. Marque a etapa somente se as duas partes estiverem prontas. Atualize a próxima ação e a data da revisão, preservando as evidências anteriores. Na data final, confira também o final do conto e as partes faltantes.</p>
    <p>A <a href="/pt/blog/revisao-semanal-notas-iphone">revisão semanal</a> ajuda a escolher qual meta merece atenção. O histórico e as evidências de cada meta continuam em sua própria nota.</p>
    <h2 id="limites">O que o modelo não faz</h2>
    <p>A nota registra o que você escreve. Ela não inspeciona o arquivo, mede o progresso nem avisa sobre a revisão. Confira cada etapa na fonte antes de marcá-la.</p>
    <h2 id="pinto">Atualize a nota com ChatGPT ou Claude</h2>
    <p>O Pinto Notes tem cabeçalhos, checklists e tabelas no Mac e no iPhone. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow, você permite que a IA leia e edite suas notas. Informe apenas um resultado que já conferiu.</p>
    <Keep title="Peça à IA para atualizar a meta" text={PROMPT} copyLabel={ui.copy} note="Confira o arquivo antes. Troque os dados, a fonte e as datas pelos seus." />
    <p>Depois, confira se a nova linha diz 3.200 palavras, se só a etapa de 29 de novembro foi marcada e se a revisão mudou. O Pinto guarda versões anteriores da nota. Você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar as notas da Apple no Mac</a> sem alterá-las.</p>
  </LocalPostPage>;
}
