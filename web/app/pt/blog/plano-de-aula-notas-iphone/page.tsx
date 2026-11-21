import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "plano-de-aula-notas-iphone");
// Versão pt-BR de /blog/apple-notes-lesson-plan-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "plano de aula modelo", "plano de aula modelo
// pronto", "plano de aula modelo bncc"; o termo com app Notas não trouxe sugestão.
// Evidência do tema geral, não de busca específica pelo app.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (Formatação, Cabeçalho), apd93c815aa0/mac (Checklist), apd0a136b9cc/mac
// (Tabela, Formatar > Tabela, Tab), /guide/iphone/iph1ac0b3a2/ios (criação de nota,
// Formatação, Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar).
const ui = UI.pt;
const TEMPLATE = `Comparação de frações, 20 de novembro de 2026
Aula de reforço de matemática de 40 minutos. Estudante fictício do 5º ano do ensino fundamental.

Objetivo
Comparar duas frações com denominadores diferentes e explicar usando inteiros do mesmo tamanho.

Sondagem do que já sabe
Perguntar: qual é maior, 1/4 ou 3/4? Desenhar as duas com retângulos do mesmo tamanho.
Se a ideia de quartos não estiver clara, praticar partes iguais antes de comparar outras frações.

Materiais
Tiras de frações cortadas de folhas do mesmo tamanho
Lápis e papel quadriculado
Quatro comparações com respostas conferidas antes da aula

Etapas e tempo
Minutos\tAtividade
0 a 5\tSondar o que sabe sobre quartos e pedir uma explicação.
5 a 12\tComparar 1/2 e 2/3 com as tiras, mantendo os inteiros do mesmo tamanho.
12 a 20\tMostrar no papel a mesma comparação em sextos e resolver uma questão juntos.
20 a 30\tPedir que compare 1/3 com 1/2, 2/5 com 3/5, 3/5 com 2/3 e 3/4 com 5/6. Solicitar desenho ou frações equivalentes.
30 a 36\tDiscutir uma resposta. Se houver dificuldade, voltar às tiras e reduzir as questões.
36 a 40\tFazer a pergunta final sem ajuda e anotar a explicação.

Exemplo resolvido
Qual é maior, 1/2 ou 2/3?
1/2 = 3/6 e 2/3 = 4/6; portanto, 2/3 é maior.
Os sextos precisam se referir a inteiros do mesmo tamanho.
Respostas das questões, fração maior em cada par: 1/2, 3/5, 2/3, 5/6.

Conferência da aprendizagem
Pergunta final: qual é maior, 2/3 ou 3/4? Explique sem as tiras.
Resposta para o professor: 2/3 = 8/12 e 3/4 = 9/12; portanto, 3/4 é maior.
Ouvir se a explicação fala de partes iguais, não apenas do denominador maior.

Depois da aula
20 de novembro: comparou meios e terços com as tiras sem ajuda.
No papel, escolheu 3/4 na pergunta final, mas não conseguiu explicar por quê.
Próxima aula: começar desenhando as duas frações em doze partes iguais antes de novas comparações.
`;
const PROMPT = `Leia meu plano de aula no Pinto Notes "Comparação de frações, 20 de novembro de 2026".
Use as observações em Depois da aula para rascunhar outro plano de 40 minutos para 27 de novembro.
Não mude o plano e as observações originais.
Comece com desenhos de 2/3 e 3/4 como doze partes de retângulos do mesmo tamanho.
Inclua objetivo, materiais, etapas com tempo, exemplo resolvido e pergunta final com resposta para o professor.
A soma deve dar 40 minutos. Não invente resultados do estudante nem afirme alinhamento curricular.
Mostre o rascunho no chat primeiro. Pergunte sobre dados ausentes antes de salvar outra nota.`;
const FAQ = [
  { q: "O que incluir num plano de aula no app Notas?", a: ["Coloque objetivo, sondagem, materiais, etapas com tempo, exemplo resolvido e pergunta final numa nota. Registre depois o que observou para planejar a aula seguinte."] },
  { q: "Posso transformar materiais em checklist?", a: ["No Mac, selecione as linhas de materiais e clique em Checklist. No iPhone, toque em Checklist, digite cada material e use Voltar para o próximo. Marque cada círculo quando estiver pronto."] },
  { q: "Como reutilizar o plano?", a: ["Copie o formato para outra nota e troque data, objetivo e exemplos. Limpe as observações antigas da cópia, mas guarde o original como registro daquela aula."] },
  { q: "A tabela inicia um cronômetro?", a: ["Não. Os tempos são texto. Use um relógio ou cronômetro separado e ajuste as atividades se a sondagem mostrar que o estudante precisa de mais prática."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="plano-de-aula-notas-iphone"
    intro={<>Copie este plano de aula para o app Notas. O exemplo de matemática para o 5º ano traz objetivo, materiais, etapas de 40 minutos, pergunta final e espaço para anotações depois da aula.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o plano" }, { href: "#montar", label: "Monte a nota" },
      { href: "#aula", label: "Use na aula" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Planeje a próxima" },
    ]}>
      <p>Use uma nota por aula e descreva algo que o estudante possa demonstrar. O exemplo planeja uma aula de reforço sobre frações e registra o que ainda precisa de prática. Troque o conteúdo pela sua turma.</p>
      <div id="modelo"><Keep title="Plano de aula para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova. Materiais podem virar checklist e as etapas, tabela de duas colunas." /></div>
      <PostCta slug="pt/plano-de-aula-notas-iphone" path="/pt/blog/plano-de-aula-notas-iphone" position="answer" ui={ui.cta} title="Rascunhe a próxima aula a partir das observações"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Depois de conectar ChatGPT ou Claude, você pode pedir um novo plano para conferir. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte o plano no app Notas</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Muitos recursos não funcionam em contas de outros provedores. Leia o texto antes de formatá-lo.</p>
    <MenuPaths rows={[
      { on: "Mac, cabeçalhos", steps: ["Selecione o texto", "Formatação", "Cabeçalho"] },
      { on: "Mac, tabela", steps: ["Formatar", "Tabela"] },
      { on: "iPhone, cabeçalhos", steps: ["Selecione o texto", "Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, selecione cada nome de seção, use Formatação e escolha Cabeçalho. Selecione as três linhas de Materiais e clique em Checklist. Marque os círculos quando preparar cada item.</p>
    <p>Selecione as sete linhas de Minutos até 36 a 40 e clique em Tabela. A tabulação separa Minutos e Atividade. Também pode escolher Formatar, Tabela, preencher as células e usar Tab na última para acrescentar outra linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a> e <a href="/blog/apple-notes-tables" hrefLang="en">mais sobre tabelas</a> (em inglês).</p>
    <p>No iPhone, crie uma nota e cole. Selecione nomes de seção, toque em Formatação e escolha Cabeçalho. Para Materiais, use Checklist e Voltar entre itens; apague as linhas originais. Em Etapas, adicione uma tabela e preencha tempo e atividade em colunas separadas. Veja os guias da Apple de <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">formatação</a> e <a href="https://support.apple.com/pt-br/102296">checklists</a>.</p>
    <p>Para outros formatos, veja os <a href="/blog/apple-notes-templates" hrefLang="en">modelos do app Notas</a> (em inglês).</p>

    <h2 id="aula">Use o plano durante a aula</h2>
    <p>O objetivo pede uma explicação, além de escolher a fração maior. Confira as respostas e resolva os exemplos antes de ensinar.</p>
    <p>Use os cinco minutos iniciais para avaliar se o plano cabe. Se o estudante ainda não consegue dividir um inteiro em quatro partes iguais, fique mais tempo nisso e reduza as comparações. Os intervalos orientam, mas podem mudar.</p>
    <p>Mantenha a resposta do professor abaixo da pergunta final. Faça a pergunta sem mostrar a resposta. Se compartilhar a tela, deixe essa parte fora da visão do estudante.</p>
    <p>Depois, registre o que a criança fez e quanta ajuda precisou. "Escolheu 3/4, mas não explicou" dá um ponto de partida concreto. Guarde as observações na nota original. Para as anotações do próprio estudante, veja o <a href="/pt/blog/metodo-cornell-notas-iphone">método Cornell</a>.</p>

    <h2 id="limites">Onde o plano para</h2>
    <p>A nota guarda seu plano e suas observações. A tabela não conduz a aula nem mede a aprendizagem. Você precisa conferir o conteúdo e decidir o que mudar depois de ouvir o estudante.</p>
    <p>Se sua escola exige um formulário próprio, use-o para a entrega. Este exemplo é uma nota de trabalho para aula de reforço.</p>

    <h2 id="pinto">Rascunhe a próxima aula com ChatGPT ou Claude</h2>
    <p>O mesmo formato funciona no Pinto Notes. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar suas notas. Peça um novo plano baseado nas observações.</p>
    <Keep title="Peça um plano para a próxima aula" text={PROMPT} copyLabel={ui.copy} note="Troque título, data e atividade inicial pelos seus. Este pedido usa o exemplo acima." />
    <p>Confira o rascunho antes de salvá-lo. Some os tempos e resolva cada conta. Veja se ele começa pela explicação que faltou ao estudante. Remova observações inventadas. O Pinto guarda versões anteriores se você precisar voltar a uma delas.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
