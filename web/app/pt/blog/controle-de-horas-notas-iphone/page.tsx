import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "controle-de-horas-notas-iphone");
// Versão pt-BR de /blog/apple-notes-time-log-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "controle de horas trabalhadas", "controle de horas
// trabalhadas excel" e "modelo de controle de horas trabalhadas"; "registro de horas modelo"
// trouxe "modelo registro de horas". Termos gerais, sem demanda comprovada por app Notas.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac
// (Tabela, Formatar > Tabela, Tab), apd93c815aa0/mac (Checklist), /guide/iphone/
// iph1ac0b3a2/ios (criação de nota, criação de tabela) e /102296 (Checklist, Voltar).
// O guia do iPhone não nomeia os ícones de nota nova e tabela; os passos descrevem a ação.
const ui = UI.pt;
const TEMPLATE = `Controle de horas, 16 a 20 de novembro de 2026

Escopo: sessões do site, da newsletter e da administração do projeto. Não representa a semana inteira.

Sessões
Data\tInício\tFim\tProjeto\tAtividade\tMinutos
16 nov.\t09:00\t10:10\tSite\tRascunhar página inicial\t70
16 nov.\t10:10\t10:25\tAdministração\tLigação sobre a entrega\t15
16 nov.\t10:25\t11:10\tSite\tRevisar página inicial\t45
17 nov.\t09:00\t09:40\tSite\tConferir visual no celular\t40
17 nov.\t14:00\t14:55\tSite\tAplicar retorno do cliente\t55
18 nov.\t10:00\t11:00\tSite\tPreparar revisão\t60
19 nov.\t09:15\t10:00\tNewsletter\tEscrever edição de novembro\t45
19 nov.\t10:10\t10:40\tAdministração\tResponder e-mails do projeto\t30
20 nov.\t09:00\t10:00\tSite\tPublicar alterações aprovadas\t60
20 nov.\t10:15\t10:45\tNewsletter\tRevisar assuntos\t30

Totais por dia, somados à mão
16 nov.: 130 minutos
17 nov.: 95 minutos
18 nov.: 60 minutos
19 nov.: 75 minutos
20 nov.: 90 minutos
Total da semana: 450 minutos, 7 horas e 30 minutos

Totais por projeto, somados à mão
Site: 330 minutos
Newsletter: 75 minutos
Administração: 45 minutos

Interrupções e tempo desconhecido
16 nov.: a ligação interrompeu o trabalho no site. Seus 15 minutos já estão em Administração.
19 nov., 10:40 a 11:00: atividade não registrada. 20 minutos desconhecidos, fora dos totais.

Conferência da semana
Conferir cada duração com os horários de início e fim
Conferir se as somas por dia e por projeto chegam ao mesmo total semanal
`;
const PROMPT = `Leia minha nota do Pinto Notes "Controle de horas, 16 a 20 de novembro de 2026".
Acrescente uma sessão em 20 de novembro, das 14:00 às 14:35, para Site: conferir os links publicados, 35 minutos.
Mantenha as sessões anteriores e o intervalo desconhecido. Não conte a ligação duas vezes.
Proponha no chat os novos totais do dia, do projeto e da semana. Não mude os totais salvos antes de eu conferir.
Pergunte sobre horários ausentes ou sobrepostos. Não invente sessões para preencher lacunas.`;
const FAQ = [
  { q: "Quais campos entram num controle de horas no Notas?", a: ["Registre data, início, fim, projeto, atividade e minutos por sessão. Some os dias e a semana abaixo da tabela. Diga qual trabalho está no registro para que uma amostra não pareça a semana completa."] },
  { q: "A coluna de minutos soma automaticamente?", a: ["Não. Você escreve e confere os valores. Nem a tabela do Notas nem este formato no Pinto Notes somam a coluna automaticamente."] },
  { q: "Como registrar uma interrupção sem contá-la duas vezes?", a: ["Encerre a primeira sessão quando ela começar. Registre a interrupção em linha própria e abra outra linha quando voltar à tarefa."] },
  { q: "O que faço com um intervalo que não lembro?", a: ["Marque-o como desconhecido e deixe-o fora dos totais por projeto. Se conseguir reconstruí-lo depois com uma fonte confiável, identifique o horário como estimado."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="controle-de-horas-notas-iphone"
    intro={<>Copie este modelo de controle de horas para o app Notas e registre trabalho concluído em uma tabela com datas. Preencha os minutos e some os dias para conferir o total da semana.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#montar", label: "Monte a tabela" },
      { href: "#registrar", label: "Registre o tempo" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Acrescente com IA" },
    ]}>
      <p>Use uma linha por sessão concluída, com data, início, fim, projeto, atividade e minutos. O exemplo soma 450 minutos em cinco dias, conta uma interrupção uma vez e deixa um intervalo desconhecido fora dos totais.</p>
      <div id="modelo"><Keep title="Controle de horas para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Copie o exemplo fictício e troque sessões e totais pelos seus. As linhas com tabulação podem virar tabela no Mac." /></div>
      <PostCta slug="pt/controle-de-horas-notas-iphone" path="/pt/blog/controle-de-horas-notas-iphone" position="answer" ui={ui.cta} title="Quer acrescentar sessões com sua IA?"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Após a conexão, ChatGPT ou Claude pode ler o registro e incluir as sessões que você informar. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a tabela e a checklist</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Cole o texto primeiro. Os títulos das seções e os totais ficam fora da tabela.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Selecione as linhas das sessões", "Formatar", "Tabela"] },
      { on: "iPhone", steps: ["Crie uma nota", "Crie uma tabela"] },
    ]} />
    <p>No Mac, selecione as onze linhas de Data até a última sessão e clique em Tabela ou escolha Formatar, Tabela. Cada Tab vira uma coluna. Tab na última célula cria outra linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a> e <a href="/blog/apple-notes-tables" hrefLang="en">os limites da tabela</a> (em inglês).</p>
    <p>No iPhone, crie uma nota e cole o texto. Para uma tabela mais estreita, toque no controle para adicionar uma tabela e use Sessão e Minutos como colunas. Em Sessão, reúna data, horários, projeto e atividade, por exemplo "16 nov., 09:00 a 10:10, Site, rascunhar página inicial". Digite 70 em Minutos. Transfira as outras linhas e apague o bloco de texto original. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia do iPhone</a>.</p>
    <p>No Mac, selecione as duas linhas em Conferência da semana e clique em Checklist. No iPhone, ponha o cursor abaixo do título, toque em Checklist e digite cada conferência, usando Voltar para a próxima. Apague as linhas antigas. Marque os círculos depois de conferir.</p>

    <h2 id="registrar">Registre o que aconteceu</h2>
    <p>Troque a amostra pela sua semana e diga o que está medindo. Uma tarde em branco não descreve o restante do trabalho. Deixe tarefas planejadas numa nota separada.</p>
    <p>Abra uma linha quando terminar ou trocar de atividade. Use sempre o mesmo nome para o projeto. A sessão das 09:00 às 10:10 tem 70 minutos. A ligação tem 15 minutos próprios em Administração; depois começa outra sessão do Site. Contar 09:00 a 11:10 como Site também duplicaria a ligação.</p>
    <p>Deixe a incerteza visível. Na quinta-feira há 20 minutos sem atividade anotada, fora dos totais. Se descobrir depois o que ocorreu, indique se o horário é exato ou estimado.</p>
    <h2>Confira as somas à mão</h2>
    <p>130 + 95 + 60 + 75 + 90 = 450 minutos, ou 7 horas e 30 minutos. Por projeto, 330 do Site + 75 da Newsletter + 45 de Administração também dão 450. Os 20 minutos desconhecidos ficam fora de ambas as contas.</p>
    <p>Marque as conferências após revisar cada linha e as duas somas. Se mudar uma sessão, refaça os totais afetados. Guarde a semana concluída como registro. Veja outros <a href="/blog/apple-notes-templates" hrefLang="en">modelos para o Notas</a> (em inglês).</p>

    <h2 id="limites">Onde este controle para</h2>
    <p>Não há cronômetro ou captura automática. Você escreve minutos e totais. Nem o Notas nem este formato no Pinto somam colunas. Para cálculos automáticos com muitas sessões, uma planilha com fórmulas pode servir melhor.</p>
    <p>O total descreve apenas as sessões registradas. Ele não explica o tempo desconhecido nem define o que pode ser cobrado de um cliente. Tome essa decisão à parte.</p>
    <h2 id="pinto">Peça ao ChatGPT ou Claude que acrescente uma sessão</h2>
    <p>O mesmo formato funciona como nota no Pinto Notes, com tabela e checklist. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar notas. Informe os dados reais da sessão e peça uma nova linha.</p>
    <Keep title="Pedido para a IA conectada" text={PROMPT} copyLabel={ui.copy} note="Use com o exemplo acima ou troque título e horários pelos seus." />
    <p>Confira se a nota ganhou só uma sessão de 35 minutos. Neste exemplo, sexta-feira passa a 125 minutos, Site a 365 e a semana a 485 minutos, ou 8 horas e 5 minutos. Verifique antes de substituir os totais salvos. O intervalo desconhecido continua de fora.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/import-your-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
