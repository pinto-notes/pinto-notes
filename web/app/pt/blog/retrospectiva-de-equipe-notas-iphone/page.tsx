import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "retrospectiva-de-equipe-notas-iphone");
// Versão pt-BR de /blog/apple-notes-retrospective-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "modelo de retrospectiva" e "modelo de
// retrospectiva scrum"; "modelo retrospectiva equipe" não trouxe sugestões.
// Evidência do tema geral, não de busca pelo app Notas.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (Formatação, Cabeçalho), apd93c815aa0/mac (Checklist), apd0a136b9cc/mac
// (Tabela, Formatar > Tabela, Tab), /guide/iphone/iph1ac0b3a2/ios (criação de nota,
// Formatação, Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar).
// O guia do iPhone não nomeia os ícones de nota nova e tabela; os passos descrevem a ação.
const ui = UI.pt;
const TEMPLATE = `Retrospectiva da atualização da central de ajuda em novembro

Período: 9 a 20 de novembro de 2026
Revisão: 23 de novembro de 2026
Pessoas: Camila, redação; João, design

Resultados esperados e observados
Plano\tResultado e fonte
Publicar 8 páginas revisadas até 20 de novembro\t8 páginas no ar em 20 de novembro. Fonte: checklist de publicação da central.
Uma revisão por página\t3 das 8 páginas precisaram de segunda revisão. Fonte: registro de revisões.

O que funcionou
Camila testou as instruções antes de enviar cada rascunho a João.
A checklist de publicação indicava quem conferiria cada página.

O que não funcionou
Duas capturas de tela ainda mostravam a navegação antiga na primeira revisão.
O escopo da página de configurações da conta mudou depois que Camila a escreveu.

Causas ainda incertas
Acreditamos que combinar os roteiros antes pode reduzir segundas revisões.
O registro não diz por que cada página precisou de outra revisão.

O que repetir
Testar as instruções antes da revisão e manter uma pessoa responsável pela conferência final.

Próximo experimento
Combinar os roteiros das páginas antes de redigir a atualização de dezembro.
Responsável: João
Referência: 3 de 8 páginas precisaram de segunda revisão em novembro.
Meta de conferência: no máximo 1 das 6 páginas de dezembro precisa de segunda revisão.
Data da revisão: 7 de dezembro de 2026

Ações
João: combinar os seis roteiros com Camila até 25 de novembro de 2026.
Camila: registrar quantidade e motivos das segundas revisões até 4 de dezembro de 2026.

Resultado da revisão
Pendente. Em 7 de dezembro, comparar o registro com a meta acima.
`;
const PROMPT = `Leia minha nota do Pinto Notes "Retrospectiva da atualização da central de ajuda em novembro".
Sugira outro experimento com base em O que não funcionou.
Separe observações de causas possíveis. Não diga que a nota comprova uma causa.
Mostre a mudança proposta e como conferir o resultado no chat.
Se eu a escolher, peça responsável e data da revisão. Não invente nenhum dos dois.
Depois que eu escolher e informar os dados, substitua Próximo experimento e Ações na nota.
Mantenha resultados, observações e referência originais.`;
const FAQ = [
  { q: "O que incluir numa retrospectiva no Notas?", a: ["Identifique projeto e datas, compare plano e resultado, registre o que funcionou e o que não funcionou. Feche com um experimento, ações com responsáveis e data de revisão. Separe causas possíveis das observações."] },
  { q: "Serve para um projeto individual?", a: ["Sim. Coloque seu nome nas ações e revise um trabalho concluído. Você pode comparar a publicação de uma newsletter com o plano e testar uma mudança na edição seguinte."] },
  { q: "Quantas ações uma equipe pequena deve escolher?", a: ["Comece com uma mudança que possa testar no projeto seguinte. Dê responsável e data às ações necessárias. Registre outras sugestões separadamente se ninguém concordou em executá-las."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="retrospectiva-de-equipe-notas-iphone"
    intro={<>Copie este modelo de retrospectiva para o app Notas após um projeto ou ciclo de trabalho. Registre o que funcionou, o que falhou e as ações com responsáveis antes da próxima revisão.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#montar", label: "Monte a nota" },
      { href: "#revisao", label: "Faça a revisão" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Use com IA" },
    ]}>
      <p>Compare plano e resultado numa tabela. Anote observações em seções separadas e transforme as ações combinadas em checklist. O exemplo termina com uma mudança para testar no projeto seguinte.</p>
      <div id="modelo"><Keep title="Modelo de retrospectiva para o Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova. Os resultados podem virar tabela e as duas ações, checklist." /></div>
      <PostCta slug="pt/retrospectiva-de-equipe-notas-iphone" path="/pt/blog/retrospectiva-de-equipe-notas-iphone" position="answer" ui={ui.cta} title="Quer rascunhar outro experimento?"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Após conectar ChatGPT ou Claude, a IA pode ler sua retrospectiva e salvar a mudança que você escolher. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a retrospectiva no app Notas</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Alguns recursos não funcionam em contas de outros provedores.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Formatação", "Cabeçalho"] },
      { on: "Mac", steps: ["Formatar", "Tabela"] },
      { on: "iPhone", steps: ["Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, cole o texto, selecione cada nome de seção e use Formatação, Cabeçalho. Selecione as três linhas de Plano até Uma revisão por página e clique em Tabela. Tab separa as colunas. Também pode usar Formatar, Tabela e preencher as células; Tab na última cria outra linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a>.</p>
    <p>Selecione as duas linhas de Ações e clique em Checklist. Marque um círculo quando a ação estiver concluída.</p>
    <p>No iPhone, crie uma nota e cole. Selecione um nome de seção, toque em Formatação e escolha Cabeçalho. Adicione uma tabela para plano e resultado, depois apague as linhas de texto originais. Em Ações, use Checklist e Voltar para a segunda. Veja o <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia de formatação</a> e as <a href="https://support.apple.com/pt-br/102296">instruções de checklist</a>.</p>

    <h2 id="revisao">Revise um projeto concluído</h2>
    <p>Antes de discutir causas, compare o resultado com o plano. As oito páginas foram publicadas no prazo, mas três passaram por outra revisão. Guarde ambos os fatos e troque os nomes das fontes pelos documentos que conferiu. Veja o <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos</a> (em inglês) para reutilizar uma nota base.</p>
    <p>Dê alguns minutos para cada pessoa escrever observações. Nomeie um fato, como as duas capturas desatualizadas, em vez de julgar a pessoa. Se trabalhou sozinho, use as mesmas seções e seu nome nas ações.</p>
    <p>Deixe as causas incertas sob título próprio. A mudança de escopo pode ter aumentado o trabalho, mas o registro não prova isso. Camila anotará os motivos das novas revisões para reunir evidências. Use <a href="/pt/blog/ata-de-reuniao-notas-iphone">atas de reunião</a> para conversas recorrentes.</p>
    <h2>Escolha uma mudança para testar</h2>
    <p>A equipe vai combinar os roteiros antes de escrever. João cuida disso; Camila registra quais páginas precisaram de outra revisão. Peça a concordância de cada responsável antes de colocar nome e prazo.</p>
    <p>Em 7 de dezembro, preencha Resultado da revisão com os dados do registro, mesmo se não houver melhora. Menos revisões é algo a investigar, mas outro grupo de páginas não prova o motivo da diferença. Decida se mantém a mudança ou testa outra.</p>

    <h2 id="limites">Onde a retrospectiva para</h2>
    <p>Nomes e datas são texto. Não atribuem tarefas nem criam avisos. Coloque a revisão no calendário se precisar de alerta. A nota também não oferece votação anônima nem determina a causa de um atraso.</p>
    <h2 id="pinto">Rascunhe um experimento com ChatGPT ou Claude</h2>
    <p>O formato funciona no Pinto Notes com cabeçalhos, checklists e tabelas. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conecte ChatGPT ou Claude</a> (guia em inglês) e escolha Allow. A autorização permite ler e editar notas. Peça uma mudança para testar.</p>
    <Keep title="Peça outro experimento à sua IA" text={PROMPT} copyLabel={ui.copy} note="Troque o título da nota. Confira a proposta com as observações antes de escolher." />
    <p>Confira se a sugestão responde a algo registrado e trata causas como hipóteses. Depois de salvar, abra a nota e confira responsável, data, resultados e referência. A IA ajuda a redigir; a equipe precisa executar e medir.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
