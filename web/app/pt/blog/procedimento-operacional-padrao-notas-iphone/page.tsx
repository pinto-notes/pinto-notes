import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "procedimento-operacional-padrao-notas-iphone");

// Versão pt-BR de /blog/apple-notes-sop-template, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "modelo procedimento operacional padrão" sugeriu o próprio termo,
// "modelo procedimento operacional padrão pop" e variantes Word/PDF.
// Apple pt-BR consultada em 21 nov: support.apple.com/pt-br/guide/notes/apd93c815aa0/mac
// (Lista de Verificação; Formatar > Mais > Desmarcar Tudo), apd0a136b9cc/mac
// (Formatar > Tabela), not9474646a9/mac (Arquivo > Duplicar Nota),
// support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios (Formatação, Cabeçalho, Tabela).
// Sem imagem no original.

const ui = UI.pt;
const TEMPLATE = `POP: enviar o relatório semanal do cliente

Gatilho: sexta-feira às 14h, depois de registrar o trabalho da semana.
Responsável: Maia, gerente da conta. Substituto: Léo.
Resultado: o Estúdio Rua Norte recebe um relatório correto até as 16h.
Entradas: registro de trabalho da semana e lista atual de contatos do cliente.
Versão: 1.2, atualizada em 20 de novembro de 2026.
Próxima revisão: 18 de dezembro de 2026. Maia é responsável.

Etapas
1. Abra o registro de trabalho do Estúdio Rua Norte. Use segunda a sexta desta semana.
2. Copie o trabalho concluído para um relatório novo. Coloque o restante em Próxima semana.
3. Some as horas de cada tarefa concluída. Compare o total com o registro de trabalho.
4. Exporte o relatório como PDF, com nome RuaNorte-semana-2026-11-20.pdf. Mude a data a cada semana.
5. Abra o PDF exportado. Leia todas as páginas e confira cliente e semana.
6. Faça as verificações abaixo. Envie o PDF por e-mail ao contato da lista atual.
7. Registre horário de envio e remetente em uma nota da execução com data. Anote exceções nela.

Exceções
Se\tFaça isto
As horas não batem com o registro\tPare. Peça a correção no registro original e exporte de novo.
Maia está ausente\tLéo executa o procedimento e assina a nota da execução.
O relatório não ficará pronto até as 16h\tAvise o cliente antes das 16h e dê novo prazo. Registre na nota da execução.

Verificações antes do envio
Cliente e semana conferem com o registro de trabalho.
As horas batem com a fonte, sem contar trabalho pendente como concluído.
O PDF exportado abre e contém todas as páginas.
Destinatário confere com a lista atual de contatos do cliente.

Registro da execução
20 de novembro de 2026, 15h42. Maia enviou o relatório. Sem exceções.

Histórico de alterações
20 de novembro de 2026, v1.2. Incluída a abertura do PDF após uma exportação vazia.
`;
const FAQ = [
  { q: "Posso escrever um POP no app Notas?", a: ["Sim. Use uma nota por procedimento, com gatilho, responsável, etapas numeradas, exceções, verificações e data de revisão. O exemplo desta página é gratuito para copiar."] },
  { q: "Etapas devem ser lista numerada ou checklist?", a: ["Use números quando a ordem importa. Deixe as verificações finais em uma checklist separada. Mantenha o procedimento principal desmarcado e registre cada execução em sua própria nota."] },
  { q: "Quando revisar um POP?", a: ["Escolha uma data adequada ao trabalho e nomeie quem fará a revisão. Antecipe se surgir uma exceção ou uma entrada mudar. Crie o lembrete separadamente."] },
  { q: "O Pinto Notes pode restaurar uma versão anterior?", a: ["Sim. Ele guarda versões da nota e permite restaurá-las. O texto substituído também fica guardado. Mantenha o histórico escrito para explicar o motivo da mudança."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="procedimento-operacional-padrao-notas-iphone"
    intro={<>Copie este modelo de procedimento operacional padrão, ou POP, para o app Notas. Ele reúne gatilho, responsável, etapas, exceções e verificações de uma tarefa recorrente.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o POP" }, { href: "#configurar", label: "Configure" },
      { href: "#uso", label: "Execute e revise" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Versões anteriores" },
    ]}><p>Use uma nota por procedimento, com etapas numeradas e uma checklist separada para conferir o resultado. Cole o exemplo, troque nomes e horários e teste numa execução real. Registre cada execução em outra nota.</p>
      <PostCta slug="pt/procedimento-operacional-padrao-notas-iphone" path="/pt/blog/procedimento-operacional-padrao-notas-iphone" position="answer" ui={ui.cta} title="Guarde as revisões do POP">
        <p>O Pinto Notes funciona como o app Notas no iPhone e no Mac e permite restaurar versões anteriores. Depois de conectado, o ChatGPT ou o Claude pode ler e editar o procedimento.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modelo">Um relatório semanal para o cliente</h2>
    <p>O exemplo é de uma gerente que envia o mesmo tipo de relatório toda sexta. Troque cliente, documentos e prazo. Se trabalhar sozinho, coloque seu nome como responsável e retire o substituto se ninguém puder cobri-lo.</p>
    <Keep title="POP para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota. Faça uma checklist com as quatro verificações e uma tabela com as quatro linhas de exceções." />
    <p>Cada etapa precisa de uma ação e um resultado verificável. Abrir o PDF exportado é mais claro que apenas conferir o relatório. Deixe as condições de parada perto das etapas.</p>
    <h2 id="configurar">Configure no app Notas</h2>
    <Paths rows={[{ on: "Mac, exceções", steps: ["Formatar", "Tabela"] }, { on: "iPhone, títulos", steps: ["Formatação", "Cabeçalho"] }]} />
    <ol>
      <li>Cole o texto em uma nota nova. No iPhone, toque no botão de nova nota. A primeira linha vira o título. Selecione cada seção, toque em Formatação e escolha Cabeçalho.</li>
      <li>No Mac, selecione os quatro parágrafos em Verificações antes do envio e clique no botão Lista de Verificação. No iPhone, use esse botão e digite os quatro itens. Mantenha as etapas numeradas.</li>
      <li>No Mac, selecione as quatro linhas de Se até a última exceção e clique no botão Tabela. Cada Tab vira uma coluna. Também pode escolher Formatar, Tabela.</li>
      <li>No iPhone, toque em Tabela e preencha as exceções em duas colunas. No Mac, Tab na última célula cria outra linha. Veja o <a href="/blog/apple-notes-tables" hrefLang="en">guia de tabelas</a> (em inglês).</li>
    </ol>
    <p>Para usar checklist no Mac, prefira uma nota do iCloud ou salva no Mac. Recursos podem faltar em contas de outros provedores. Outros formatos estão no <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos</a> (em inglês).</p>
    <h2 id="uso">Execute uma vez e corrija dúvidas</h2>
    <p>Teste com o registro real e o PDF exportado. Se alguém cobrir a tarefa, peça que siga a nota sem ajuda. Anote onde houver dúvida e esclareça antes da próxima execução.</p>
    <p>Deixe a nota principal como procedimento. Para registrar cada sexta, selecione-a no Mac e escolha Arquivo, Duplicar Nota. Dê à cópia um título com a data e apague o registro do exemplo. Antes de começar, use Formatar, Mais, Desmarcar Tudo na checklist. A cópia de uma nota compartilhada não é compartilhada.</p>
    <p>Registre quem executou e as exceções. Se a exceção puder se repetir, acrescente uma resposta ao procedimento principal, aumente o número da versão e explique a mudança. Na data de revisão, o responsável deve comparar as instruções com os documentos atuais.</p>
    <h2 id="limites">Onde o POP para</h2>
    <p>Um item marcado não prova que o arquivo estava correto nem que o cliente o recebeu. Guarde o e-mail enviado ou a prova necessária. A data de revisão escrita pede lembrete separado. Indique qual nota é a versão principal para não reutilizar uma execução antiga. O modelo não fornece aprovações formais nem registro de auditoria controlado.</p>
    <h2 id="pinto-notes">Revise sem perder versões anteriores</h2>
    <p>Você pode usar esta estrutura no Pinto Notes, que se parece e funciona como o app Notas no iPhone e no Mac. O <a href="/blog/apple-notes-version-history" hrefLang="en">histórico de versões</a> (em inglês) permite restaurar uma nota anterior e guarda também o texto substituído. O histórico escrito continua explicando por que cada etapa mudou.</p>
    <p>Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês), a IA pode ler e editar as notas. Peça que proponha uma exceção para atraso no registro de trabalho sem mudar o prazo, liste as suposições e só depois edite. Confira com a prática da equipe.</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
