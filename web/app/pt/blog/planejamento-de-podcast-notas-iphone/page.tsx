import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "planejamento-de-podcast-notas-iphone");
// Versão pt-BR de /blog/apple-notes-podcast-planner-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "planejamento de podcast" e "roteiro de podcast
// modelo"; o termo com app Notas não trouxe sugestão. Evidência do tema geral.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (Formatação, Cabeçalho), apd93c815aa0/mac (Checklist), apd0a136b9cc/mac
// (Tabela, Formatar > Tabela, Tab), /guide/iphone/iph1ac0b3a2/ios (criação de nota,
// Formatação, Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar).
// O guia do iPhone não nomeia os ícones de nota nova e tabela; os passos descrevem a ação.
const ui = UI.pt;
const TEMPLATE = `Bancada de consertos 12: sua primeira visita a um café de reparos

Etapa: preparação
Próxima ação: Bia enviar as perguntas a Marina e confirmar autorização para gravar e publicar.
Gravação: 24 de novembro de 2026, 10:00, horário de Brasília
Duração prevista: 18 minutos

O que o ouvinte vai aprender
Ajudar quem vai pela primeira vez a decidir o que levar e o que esperar de um café de reparos.

Convidada e contexto
Marina Costa, coordenadora voluntária do café de reparos fictício da Rua das Flores, em São Paulo.
Pronúncia do nome: confirmar antes da gravação.
Autorização para gravar e publicar: aguardando confirmação.
Informação de Marina, 20 de novembro: visitantes reservam um horário e levam um objeto.
Link público de reserva: pedir a Marina e conferir antes de publicar.

Abertura
Você tem uma jaqueta rasgada e um horário marcado no café de reparos. O que acontece ao chegar?

Roteiro com tempo aproximado
1 minuto: abertura e apresentação da convidada.
4 minutos: reserva de horário e escolha do objeto.
6 minutos: acompanhar o conserto da jaqueta com uma história de Marina.
5 minutos: o que acontece se a equipe não terminar um reparo?
2 minutos: resumo e uma ação antes da primeira visita.

Perguntas para a convidada
O que alguém deve informar ao reservar um horário?
O que acontece entre chegar com uma jaqueta e sentar com uma pessoa voluntária?
Você pode contar sobre uma visita em que o objeto não pôde ser reparado no mesmo dia?
O que alguém deve confirmar com o café da sua cidade antes de ir?

Antes de gravar
Confirmar nome, função e autorização de Marina para gravar e publicar.
Enviar o roteiro e perguntar se há assuntos que Marina prefere evitar.
Gravar um teste curto no app de áudio e ouvi-lo.

Rascunho das notas do episódio, revisar depois da edição
Título provisório: Sua primeira visita a um café de reparos, com Marina Costa.
Descrição: conversa sobre reservar uma visita e levar um objeto para conserto.
Crédito: Marina Costa, coordenadora voluntária, café de reparos da Rua das Flores.
Links a incluir: página de reserva e orientações para visitantes, após conferência.
Marcas de tempo: inserir com base no áudio editado, se forem usadas.

Checklist de publicação
Ouvir todo o áudio editado no app de áudio.
Conferir crédito da convidada, autorizações e citações.
Revisar a descrição e cada link público.
Enviar áudio final e notas do episódio à plataforma de hospedagem.
Abrir o episódio publicado e registrar aqui seu link.
`;
const PIPELINE = `Bancada de consertos, episódios em andamento

Episódio\tEtapa e próxima ação
11: Remendo de mochila\tEdição. Alex vai tirar a abertura repetida.
12: Primeira visita a um café de reparos\tPreparação. Bia vai enviar perguntas a Marina e confirmar a autorização.
13: Cuidando de ferramentas emprestadas\tIdeia. Rafael vai procurar alguém de uma biblioteca de ferramentas.
`;
const PROMPT = `Leia minha nota de episódio no Pinto Notes "Bancada de consertos 12: sua primeira visita a um café de reparos".
Usando apenas a seção Convidada e contexto, sugira duas perguntas de acompanhamento para quem vai pela primeira vez.
Mostre-as no chat antes. Pergunte se faltar informação; não invente histórias da convidada nem regras de reserva.
Depois que eu aprovar o texto, acrescente as perguntas à seção Perguntas para a convidada.
Mantenha os tempos do roteiro e a autorização pendente. Deixe a checklist de publicação sem marcar.`;
const FAQ = [
  { q: "O que incluir num planejamento de podcast no Notas?", a: ["Deixe etapa e próxima ação acima da proposta ao ouvinte, dados da convidada e roteiro com tempos. Inclua perguntas, conferência antes de gravar, notas do episódio e checklist de publicação. Use outra tabela curta para os demais episódios."] },
  { q: "O roteiro precisa trazer cada palavra?", a: ["Para uma entrevista, escreva a abertura, as perguntas e o tempo previsto por bloco. Deixe espaço para perguntas de acompanhamento. Um episódio narrado pode pedir um roteiro completo à parte."] },
  { q: "Posso usar os tempos previstos como capítulos?", a: ["Use o áudio final editado. Os minutos do roteiro são estimativas; respostas, pausas e cortes mudam o início de cada assunto."] },
  { q: "Marcar a checklist publica o episódio?", a: ["Não. Você precisa enviar áudio e notas pela plataforma de hospedagem e conferir o episódio no ar antes de marcar o último item."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="planejamento-de-podcast-notas-iphone"
    intro={<>Copie este planejamento de podcast para uma nota por episódio no app Notas. Ele reúne perguntas, roteiro com tempos, rascunho das notas do episódio e checklist de publicação.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o plano" }, { href: "#montar", label: "Monte a nota" },
      { href: "#episodios", label: "Acompanhe episódios" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Prepare com IA" },
    ]}>
      <p>Use uma nota por episódio, com etapa e próxima ação no alto. O exemplo fictício planeja uma entrevista de 18 minutos. Troque programa e convidada pelos seus dados.</p>
      <div id="modelo"><Keep title="Plano de episódio de podcast para o Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova. Transforme nomes de seção em cabeçalhos e as conferências em checklists." /></div>
      <PostCta slug="pt/planejamento-de-podcast-notas-iphone" path="/pt/blog/planejamento-de-podcast-notas-iphone" position="answer" ui={ui.cta} title="Quer ajuda para preparar perguntas?"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Após conectar ChatGPT ou Claude, a IA pode ler o plano e sugerir perguntas com base no contexto que você registrou. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a nota do episódio no Mac ou iPhone</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Alguns recursos não funcionam em contas de outros provedores. O texto pode ser lido antes da formatação.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Formatação", "Cabeçalho"] },
      { on: "iPhone", steps: ["Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, cole o plano, selecione um nome de seção e use Formatação, Cabeçalho. Selecione as três linhas de Antes de gravar e clique em Checklist. Repita com as cinco linhas de Checklist de publicação. Marque círculos somente após cumprir cada tarefa. Veja os guias da Apple de <a href="https://support.apple.com/pt-br/guide/notes/apd1955d3b21/mac">formatação</a> e <a href="https://support.apple.com/pt-br/guide/notes/apd93c815aa0/mac">listas</a>.</p>
    <p>No iPhone, crie uma nota e cole. Selecione um nome de seção, toque em Formatação e escolha Cabeçalho. Sob cada checklist, toque em Checklist, digite as tarefas usando Voltar para a próxima e apague as linhas comuns. Veja as <a href="https://support.apple.com/pt-br/102296">instruções da Apple</a>.</p>

    <h2 id="episodios">Acompanhe os episódios em andamento</h2>
    <p>Guarde outra nota para os episódios atuais. Dê a cada um etapa, responsável e próxima ação. Atualize o texto ao passar por Ideia, Preparação, Gravado, Edição e Publicado.</p>
    <Keep title="Episódios em andamento no Notas" text={PIPELINE} copyLabel={ui.copy} note="Cada linha tem uma tabulação entre o episódio e a etapa. Mantenha o roteiro detalhado na nota do episódio." />
    <p>No Mac, selecione as quatro linhas de Episódio até o episódio 13 e clique em Tabela. Também pode escolher Formatar, Tabela e preencher as células. Tab na última acrescenta uma linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a> e <a href="/blog/apple-notes-tables" hrefLang="en">mais controles</a> (em inglês).</p>
    <p>No iPhone, toque no controle para adicionar uma tabela e preencha episódio e etapa em colunas separadas. Apague as linhas soltas depois. Guarde uma cópia limpa do plano para a próxima entrevista. O <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos</a> (em inglês) explica como reutilizar uma nota base.</p>
    <h2>Use o roteiro e revise as notas depois</h2>
    <p>Antes de gravar, confirme nome e autorização. Compare a proposta ao ouvinte com as perguntas. A história da jaqueta ajuda a imaginar a visita. A história da criação do café talvez mereça outro episódio.</p>
    <p>Os blocos somam 18 minutos. Use-os como guia, deixando espaço para aprofundar uma resposta. Depois, anote cortes para a edição. Revise as notas com o áudio final: retire assuntos cortados, acrescente os links citados e marque capítulos com os tempos finais.</p>

    <h2 id="limites">Onde o planejamento para</h2>
    <p>Você atualiza as etapas. O rótulo não confere o arquivo de áudio. A checklist registra tarefas feitas em outros apps e na hospedagem; colar o modelo não conecta essas ferramentas.</p>
    <p>Guarde gravação e áudio editado no seu fluxo de produção. Anote nomes ou locais dos arquivos para que a edição use a versão certa. Depois da publicação, adicione o link e atualize a etapa.</p>

    <h2 id="pinto">Prepare perguntas com ChatGPT ou Claude</h2>
    <p>O formato funciona no Pinto Notes com cabeçalhos, checklists e tabelas. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar notas. Peça perguntas com base no contexto da convidada antes de colocá-las no roteiro.</p>
    <Keep title="Peça perguntas de acompanhamento" text={PROMPT} copyLabel={ui.copy} note="Salve o plano no Pinto Notes e troque o contexto pelo que você conferiu antes de usar este pedido." />
    <p>Confira as sugestões com as informações de Marina. Reservar horário e levar um objeto são dados do exemplo. Taxa de reserva ou promessa de consertar tudo seriam invenções. Depois da edição, confira que a autorização segue pendente e a checklist continua sem marcar.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
