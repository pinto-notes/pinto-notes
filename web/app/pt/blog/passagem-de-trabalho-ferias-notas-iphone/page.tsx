import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "passagem-de-trabalho-ferias-notas-iphone");
// Versão pt-BR de /blog/apple-notes-work-handover-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "passagem de trabalho modelo" e "passagem de
// bastao modelo" não trouxeram sugestões; "handover de trabalho" e "modelo de passagem de serviço" trouxeram sugestões gerais.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (Formatação, Cabeçalho), apd0a136b9cc/mac (Tabela, Formatar > Tabela, Tab),
// apd93c815aa0/mac (Checklist), /guide/iphone/iph1ac0b3a2/ios (criação de nota,
// Formatação, Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar).
const ui = UI.pt;
const TEMPLATE = `Passagem do projeto Ipê, 30 de novembro a 4 de dezembro

Cobertura
Ausente: Camila, 30 de novembro a 4 de dezembro de 2026. Volta em 7 de dezembro.
Responsável pela cobertura: João. Oficina: 10 de dezembro.
Última atualização: 27 de novembro, 15:00, horário de Brasília.
Camila ficará offline nas férias. Decisões urgentes vão para Ana.

Trabalho em andamento
Item\tSituação, responsável e próxima ação
Página de inscrições\tTexto aprovado; página ainda não publicada. João: pedir a conferência final de Ana até 30 de novembro, 10:00, e publicar até 12:00.
Reserva da sala\t18 vagas reservadas; sinal não aprovado. João: pedir a aprovação de Ana até 1º de dezembro, 15:00.
E-mail aos participantes\tRascunho pronto. Lúcia: enviar após confirmar a sala, até 3 de dezembro, 10:00. Não enviar sem confirmação.

Documentos principais
Plano do projeto: Oficina Ipê, atualizado em 27 de novembro.
Orçamento da sala: R218, de 26 de novembro.
Rascunho de e-mail: Participantes da Oficina Ipê, versão 2.
Troque estes nomes pelos links usados pela sua equipe.

Acessos a providenciar
João precisa do perfil de editor de inscrições e de acesso à pasta da oficina.
Camila abriu o chamado TI-248 em 27 de novembro; aprovação pendente.
Processo de acesso: https://example.com/ti/acesso-temporario
João: cobrar a TI e testar os dois acessos até 27 de novembro, 16:00.
Use sua própria conta. Nunca coloque senhas, códigos de recuperação ou tokens nesta nota.

Contatos
Ana, aprovação de orçamento e urgências: ana@example.com
Lúcia, mensagens aos participantes: lucia@example.com
Pedro, reserva da sala e orçamento R218: pedro@example.com
Suporte de TI, chamado TI-248: ti@example.com

Riscos e perguntas em aberto
A reserva vence em 2 de dezembro, 12:00. João: se não houver aprovação até 1º de dezembro, 15:00, falar com Ana nesse dia. Não pagar sem aprovação.
Podemos aceitar 22 participantes? Ana decide até 30 de novembro, 15:00. Manter o limite de 18 até ela aprovar a mudança.
Os slides podem esperar Camila voltar. Nenhuma ação de cobertura necessária.

Conferência antes das férias
João: abrir cada link com sua própria conta
João: testar a edição de inscrições e o acesso à pasta
João e Lúcia: confirmar juntos ações e prazos
João: registrar dúvidas aqui antes de 27 de novembro, 16:30

Na volta
João: adicionar até 7 de dezembro, 09:00, um resumo datado do que foi feito e do que continua em aberto.
Camila: revisar o resumo com João antes de reassumir o trabalho.
`;
const PROMPT = `Leia minhas notas do Pinto Notes "Plano da Oficina Ipê", "Reserva da sala R218" e "E-mail aos participantes da Oficina Ipê".
Crie uma nota separada chamada "Passagem do projeto Ipê, 30 de novembro a 4 de dezembro" com o modelo que colo abaixo.
Camila sai de férias de 30 de novembro a 4 de dezembro de 2026 e volta em 7 de dezembro. João cobre o projeto.
Para cada item aberto, inclua situação, responsável, próxima ação, prazo e título da nota de origem.
Separe fatos confirmados de perguntas. Se faltar responsável, prazo ou aprovação, escreva "Precisa confirmar" e pergunte no chat.
Inclua pedidos de acesso e quem deve aprová-los. Não inclua senhas, códigos de recuperação ou tokens.
Não presuma que o acesso funciona ou que alguém aceitou uma tarefa. Deixe a checklist sem marcar.
Mantenha as notas de origem como estão. Vou conferir o rascunho e confirmar as responsabilidades com a equipe.`;
const FAQ = [
  { q: "O que incluir numa passagem de trabalho para férias?", a: ["Registre o período, o trabalho em andamento, quem assume cada item, a próxima ação, os documentos, acessos, contatos e riscos. Termine com uma checklist para a pessoa que fará a cobertura."] },
  { q: "Posso colocar senhas na nota de passagem?", a: ["Não. Anote o sistema, o perfil de acesso, quem aprova e o link para o processo da empresa. A pessoa deve usar sua própria conta. Deixe senhas, códigos de recuperação e tokens fora da nota."] },
  { q: "Como saber se a passagem está pronta?", a: ["Peça à pessoa responsável que abra os links e teste os acessos com a conta dela. Confirme ações e prazos com todos os envolvidos. Um pedido de acesso pendente não equivale a acesso concedido."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="passagem-de-trabalho-ferias-notas-iphone"
    intro={<>Copie este modelo de passagem de trabalho para férias no app Notas. Ele reúne o que está em andamento, quem assume cada tarefa e o que precisa de decisão antes da sua volta.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#montar", label: "Monte a nota" },
      { href: "#responsaveis", label: "Defina as ações" }, { href: "#conferir", label: "Confira a cobertura" },
      { href: "#limites", label: "Limites" }, { href: "#pinto", label: "Rascunhe com IA" },
    ]}>
      <p>Deixe datas, situação, responsável e próxima ação claros para cada item. Inclua os acessos a solicitar e links de trabalho, mas nunca senhas. Confirme o texto com quem vai cobrir suas férias.</p>
      <div id="modelo"><Keep title="Passagem de trabalho para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova. A seção Trabalho em andamento pode virar tabela; a conferência, uma checklist." /></div>
      <PostCta slug="pt/passagem-de-trabalho-ferias-notas-iphone" path="/pt/blog/passagem-de-trabalho-ferias-notas-iphone" position="answer" ui={ui.cta} title="Rascunhe a passagem a partir das suas notas"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Após conectar ChatGPT ou Claude, você pode pedir um rascunho baseado nas notas do projeto. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a passagem no app Notas</h2>
    <p>Use notas do iCloud ou guardadas no aparelho. Alguns recursos não funcionam em contas de outros provedores. Leia o texto antes de formatá-lo.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Formatação", "Cabeçalho"] },
      { on: "Mac", steps: ["Formatar", "Tabela"] },
      { on: "iPhone", steps: ["Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, cole o modelo, selecione um nome de seção e use Formatação, Cabeçalho. Selecione as quatro linhas de Item até E-mail aos participantes e clique em Tabela. Cada Tab separa as colunas. Também pode escolher Formatar, Tabela e preencher as células; Tab na última cria outra linha. Leia o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a> e <a href="/blog/apple-notes-tables" hrefLang="en">mais sobre tabelas</a> (em inglês).</p>
    <p>Selecione as quatro linhas da conferência e clique em Checklist. A pessoa que assume marca os círculos depois de testar cada item.</p>
    <p>No iPhone, crie uma nota e cole. Selecione os nomes das seções, toque em Formatação e escolha Cabeçalho. Para o trabalho, adicione uma tabela e preencha duas colunas; depois apague as linhas soltas. Para a conferência, toque em Checklist, digite cada ação e use Voltar para a próxima. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia da Apple</a>.</p>

    <h2 id="responsaveis">Dê uma próxima ação a cada item</h2>
    <p>Escreva o que a pessoa que cobre deve fazer. No exemplo, a sala está reservada, mas o sinal depende de aprovação. O prazo da aprovação fica junto da ação e o vencimento da reserva, em Riscos. As duas datas importam.</p>
    <p>Separe o que pode esperar. Os slides de Camila não exigem ação nas férias. Troque os nomes dos documentos por links reais e example.com pelo processo da sua equipe. As <a href="/pt/blog/ata-de-reuniao-notas-iphone">atas de reunião</a> podem servir como fonte das decisões.</p>

    <h2 id="conferir">Confira com quem vai assumir</h2>
    <p>Revise cada ação com João antes das férias. Ele precisa abrir o editor com a conta dele. Um chamado pendente ainda precisa de aprovação. Confirme também com Lúcia o prazo do e-mail.</p>
    <p>Deixe perguntas abertas até haver resposta. O limite segue em 18 enquanto Ana decide sobre 22 participantes. Anote a decisão e a data. Ao fim da cobertura, registre o que foi concluído e o que continua pendente.</p>

    <h2 id="limites">Onde a nota para</h2>
    <p>O modelo registra responsabilidades. Não concede acesso, não confirma que alguém aceitou a tarefa nem avisa quando a reserva vence. Use os processos da equipe e atualize a nota depois. Se a empresa exige um registro formal de passagem, siga esse processo.</p>

    <h2 id="pinto">Rascunhe a passagem com ChatGPT ou Claude</h2>
    <p>O modelo funciona no Pinto Notes com cabeçalhos, tabelas e checklists. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar notas. Peça que leia as notas indicadas e crie um rascunho separado. Use apenas informações de trabalho que sua organização permite compartilhar com essa IA.</p>
    <Keep title="Peça um rascunho de passagem" text={PROMPT} copyLabel={ui.copy} note="Troque títulos, nomes e datas. Cole o modelo depois do pedido e conecte o Pinto antes." />
    <p>Confira responsável, prazo e aprovação nas notas de origem e com as pessoas envolvidas. O sinal continua sem aprovação, o acesso pendente e o limite em 18. Marque cada conferência só depois que João a fizer.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
