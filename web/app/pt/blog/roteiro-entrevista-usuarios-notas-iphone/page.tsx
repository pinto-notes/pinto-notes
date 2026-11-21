import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "roteiro-entrevista-usuarios-notas-iphone");
// Versão pt-BR de /blog/apple-notes-user-interview-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "entrevista com usuario roteiro" e "roteiro de
// entrevista ux" não trouxeram sugestões; "entrevista com usuários" e "entrevista com usuário ux" apareceram em consultas mais amplas.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (Formatação, Cabeçalho), apd93c815aa0/mac (Checklist), apd0a136b9cc/mac
// (Tabela, Formatar > Tabela, Tab), /guide/iphone/iph1ac0b3a2/ios (criação de nota,
// Formatação, Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar).
// O guia do iPhone não nomeia os ícones de nota nova e tabela; os passos descrevem a ação.
const ui = UI.pt;
const TEMPLATE = `Entrevista com usuário, P07, troca de reserva

Data: 21 de novembro de 2026, 09:00
Entrevistadora: Marina. Anotações: Tiago.
Participante: P07, cliente que já participou de uma oficina. Exemplo fictício.

Objetivo
Descobrir se um cliente consegue mudar a reserva de uma oficina sem falar com o suporte.

Consentimento
09:00: P07 concordou com anotações escritas e citações anônimas para a análise interna do produto.
Sem gravação de áudio ou vídeo. Confirmar a permissão separadamente antes de usar IA.

Perguntas e anotações de respostas
P1. Conte como mudou sua última reserva de oficina.
Anotação: Mandou e-mail ao ateliê, esperou dois dias e recebeu uma nova confirmação.

P2. Sua aula de cerâmica no sábado coincide com o trabalho. Mostre como mudaria para domingo.
Anotação: Abriu Aulas, depois Conta. Procurou o link da reserva, abriu Ajuda e parou sem mudar a data.

P3. O que você esperava encontrar em Conta?
Anotação: Uma lista de reservas, cada uma com opção de mudar a data.

Registro de evidências
ID e horário\tO que foi observado ou dito
E1, 09:06\tP1, citação: "Mandei e-mail porque não achei onde mudar."
E2, 09:13\tP2, observação: abriu Aulas, Conta e Ajuda. Não concluiu a troca de data.
E3, 09:15\tP3, citação: "Eu esperava encontrar isso junto da reserva."

Interpretação a conferir
P07 talvez espere trocar datas perto da reserva em Conta. Base: E2 e E3.
Esta entrevista não mostra se outros clientes esperam o mesmo caminho.

Perguntas para depois
P07 perceberia um link Minhas reservas em Conta? Testar em outra tarefa.
A troca de data estava disponível para esta reserva? Conferir o cenário de teste.

Ações seguintes
Tiago: conferir as regras da reserva de teste até 23 de novembro
Marina: acrescentar uma tarefa sobre Minhas reservas ao roteiro seguinte até 24 de novembro
`;
const PROMPT = `Leia minha nota do Pinto Notes "Entrevista com usuário, P07, troca de reserva".
Crie outra nota chamada "Rascunho de achados, P07, troca de reserva". Não altere a nota de origem.
Use apenas esta entrevista. Separe relato da participante, ações observadas, citações exatas e interpretações possíveis.
Para cada achado, cite P07, o ID da evidência e os números das linhas da nota de origem retornados na leitura.
Preserve as citações literalmente. Não transforme anotações de resposta em citações.
Liste perguntas abertas e ações propostas à parte. Não invente respostas nem generalize para outros participantes.
Se faltar evidência para um achado, deixe-o de fora. Marque a nova nota como rascunho para eu conferir.`;
const FAQ = [
  { q: "O que incluir num roteiro de entrevista com usuário no Notas?", a: ["Registre objetivo, ID do participante, consentimento, perguntas e respostas, evidências e ações seguintes. Separe citações literais e ações observadas da sua interpretação. Use uma nota por sessão."] },
  { q: "Como identificar citações na entrevista?", a: ["Dê a cada fala um ID e horário e copie as palavras exatas. Escreva paráfrases nas anotações de resposta. Se não registrou o texto exato, não use aspas."] },
  { q: "Preciso gravar o áudio?", a: ["Não. O exemplo usa anotações escritas. Registre o que a pessoa autorizou antes de começar. Copiar a linha de consentimento do exemplo não obtém permissão para sua entrevista nem para uso com IA."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="roteiro-entrevista-usuarios-notas-iphone"
    intro={<>Copie este roteiro de entrevista com usuário para uma nota por sessão no app Notas. Ele separa respostas, citações exatas, ações observadas e perguntas para depois.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o roteiro" }, { href: "#montar", label: "Monte a nota" },
      { href: "#entrevista", label: "Durante a entrevista" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Rascunhe achados" },
    ]}>
      <p>Coloque objetivo e consentimento no alto, depois perguntas, registro de evidências e ações seguintes. O exemplo fictício acompanha uma cliente tentando mudar a reserva de uma aula de cerâmica.</p>
      <div id="modelo"><Keep title="Roteiro de entrevista para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova. As evidências podem virar tabela e as ações seguintes, checklist." /></div>
      <PostCta slug="pt/roteiro-entrevista-usuarios-notas-iphone" path="/pt/blog/roteiro-entrevista-usuarios-notas-iphone" position="answer" ui={ui.cta} title="Quer ajuda para rascunhar os achados?"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Depois de conectar ChatGPT ou Claude, você pode pedir um rascunho separado para conferir. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a nota no Mac ou iPhone</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Alguns recursos não funcionam em contas de outros provedores. Deixe perguntas e respostas como texto comum para anotar durante a conversa.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Formatação", "Cabeçalho"] },
      { on: "Mac", steps: ["Formatar", "Tabela"] },
      { on: "iPhone", steps: ["Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, cole o roteiro. Clique no nome de uma seção, use Formatação e escolha Cabeçalho. Selecione as duas ações finais e clique em Checklist. As instruções estão nos guias da Apple de <a href="https://support.apple.com/pt-br/guide/notes/apd1955d3b21/mac">formatação</a> e <a href="https://support.apple.com/pt-br/guide/notes/apd93c815aa0/mac">listas</a>.</p>
    <p>Selecione as quatro linhas de ID e horário até E3 e clique em Tabela. As tabulações separam as colunas. Também pode usar Formatar, Tabela e preencher as células. Tab na última célula acrescenta uma linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia de tabelas</a> e <a href="/blog/apple-notes-tables" hrefLang="en">mais controles</a> (em inglês).</p>
    <p>No iPhone, crie uma nota e cole. Selecione um nome de seção, toque em Formatação e escolha Cabeçalho. Adicione uma tabela para as evidências e apague as linhas originais após conferir. Use Checklist para as ações e Voltar para inserir o próximo item. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia do iPhone</a> e as <a href="https://support.apple.com/pt-br/102296">instruções de checklist</a>.</p>

    <h2 id="entrevista">Anote as respostas de cada pergunta</h2>
    <p>Antes da sessão, troque o objetivo, limpe respostas e interpretações e dê um ID à pessoa. Escreva na linha de consentimento o que ela realmente autorizou, inclusive o uso de notas e citações. Pergunte antes de começar.</p>
    <p>Anote respostas curtas sob cada pergunta. Só coloque uma fala entre aspas no registro de evidências se captou as palavras exatas. Se perdeu a frase, resuma sem aspas. Os horários do modelo são texto digitado por você.</p>
    <p>Ao observar uma tarefa, registre o que viu. Em E2, P07 abriu Aulas, Conta e Ajuda, depois parou. Dizer que ela ficou confusa seria interpretação. Deixe essa ideia na seção própria, com as evidências. Pergunte o que esperava encontrar sem sugerir onde tocar.</p>
    <h2>Revise antes de escrever achados</h2>
    <p>Leia respostas e evidências enquanto a conversa está recente. Marque lacunas como desconhecidas. E2 e E3 sugerem algo para testar, mas não comprovam que Minhas reservas resolveria o problema. As regras da reserva também precisam de conferência.</p>
    <p>Dê responsável e data a cada ação. Marque-a somente quando estiver pronta. Para outra pessoa, copie um roteiro limpo e mude o ID. O <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos</a> (em inglês) traz mais formatos. Guarde a entrevista original como fonte.</p>

    <h2 id="limites">Onde o roteiro para</h2>
    <p>Ele guarda o que você digita. Não recupera citações perdidas, verifica consentimento ou decide se a interpretação é sustentada. Uma sessão descreve aquela pessoa. Compare outras entrevistas antes de falar em padrão.</p>
    <h2 id="pinto">Rascunhe achados em outra nota no Pinto</h2>
    <p>O modelo funciona no Pinto Notes com cabeçalhos, checklists e tabelas. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar notas. Use primeiro o exemplo fictício. Para uma entrevista real, confirme se o consentimento e as regras da organização permitem compartilhar as notas com sua IA.</p>
    <Keep title="Peça um rascunho dos achados" text={PROMPT} copyLabel={ui.copy} note="Salve antes o roteiro fictício no Pinto Notes. Troque títulos e ID para usar com outra entrevista." />
    <p>Confira cada afirmação nas linhas citadas. O e-mail anterior é relato de P1. A sequência de telas é observação E2. A posição da opção de troca é expectativa citada em E3. Corrija citações e retire conclusões sem fonte antes de usar o rascunho.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
