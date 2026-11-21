import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "modelo-de-curriculo-notas-iphone");
// Versão pt-BR de /blog/apple-notes-resume-template, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "modelo de curriculo" sugeriu "modelo de currículo para editar" e "modelo de currículo simples"; a consulta com "notas iphone" não retornou sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac, apd93c815aa0/mac, apd0a136b9cc/mac, not9474646a9/mac; support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios.
const ui = UI.pt;
const TEMPLATE = `Marina Costa, histórico mestre para currículo
Atualizado: 21 de novembro de 2026

Contato
São Paulo, SP
marina.costa@example.com | (11) 99999-0142
Portfólio: https://example.com/marina

Resumo
Coordenadora de operações de atendimento com experiência desde 2020.
Mantém relatórios da equipe e escreve guias de integração para atendentes.

Experiência
Serra Suprimentos | Coordenadora de operações de atendimento
São Paulo, SP | janeiro de 2023 até o momento

12 de novembro de 2026: criei uma checklist de triagem usada por seis atendentes. O tempo mediano da primeira resposta da equipe caiu de 14 horas em setembro para 9 horas em outubro.
Evidência: relatório da fila de setembro e outubro, salvo em 2 de novembro de 2026.
Minha contribuição: escrevi a checklist e conduzi a revisão semanal. A equipe atendeu aos chamados.

28 de junho de 2026: escrevi um guia de integração e treinei quatro atendentes durante junho.
Evidência: guia de integração e registro de presença do treinamento de junho.
Exemplo do guia: https://example.com/marina/integracao

Casa do Porto | Atendente de clientes
São Paulo, SP | setembro de 2020 a dezembro de 2022

31 de março de 2022: resolvi de 35 a 45 chamados de clientes por semana durante março.
Evidência: relatório de chamados de março. É uma contagem individual, não da equipe.

Competências
Relatórios no Excel, triagem de chamados, treinamento de novos atendentes, redação de guias

Formação
Bacharelado em Comunicação Social | Universidade de São Paulo | maio de 2020

Fatos a conferir antes de usar
Confirmar os cargos exatos nos registros de trabalho
Conferir os tempos de resposta e os meses comparados
Substituir os dados de contato e links de exemplo
Retirar links de evidências internas do currículo enviado a empregadores
`;
const EVIDENCE = `Data da realização\tEvidência a guardar
12 de novembro de 2026\tRelatório da fila de setembro e outubro, salvo em 2 de novembro
28 de junho de 2026\tGuia de integração e presença no treinamento de junho
31 de março de 2022\tRelatório de chamados individuais de março
`;
const FAQ = [
  {q:"O que incluir no modelo de currículo no Notas?",a:["Guarde contato, resumo, cargos e datas, competências e formação. Sob cada trabalho, registre resultados com data e fonte. Esta é uma nota mestre para consultar ao escrever o currículo final."]},
  {q:"Posso enviar a nota mestre a um empregador?",a:["Mantenha a nota para você. Copie o que for relevante para um editor de documentos, retire evidências internas e confira o arquivo final no formato pedido."]},
  {q:"E se uma realização não tiver métrica?",a:["Escreva o que fez, quando e como pode comprovar. Não invente porcentagens sem uma fonte."]},
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="modelo-de-curriculo-notas-iphone"
    intro={<>Use o Notas para guardar seu histórico profissional completo, com datas e evidências. Depois, passe os dados relevantes para um editor de documentos e finalize o currículo.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#modelo",label:"Modelo"},{href:"#preparar",label:"Preparar"},{href:"#adaptar",label:"Adaptar"},{href:"#limites",label:"Limites"},{href:"#pinto",label:"Usar IA"}]}>
      <p>A nota mestre reúne contato, experiências e resultados comprováveis. Cole o exemplo, substitua pela sua trajetória e crie o currículo final em outro editor.</p>
      <PostCta slug="pt/modelo-de-curriculo-notas-iphone" path="/pt/blog/modelo-de-curriculo-notas-iphone" position="answer" ui={ui.cta} title="Escolha os resultados mais relevantes"><p>O Pinto Notes funciona como o app Notas no iPhone e no Mac. Depois da conexão, ChatGPT ou Claude pode ler seu histórico e salvar um rascunho separado para você conferir. O app está em inglês.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="modelo">Modelo para guardar toda a trajetória</h2>
    <p>Marina e os dados são fictícios. Substitua tudo, inclusive os links. Mantenha na nota mestre os empregos e resultados antigos, mesmo quando não entrarem no currículo atual.</p>
    <Keep title="Histórico mestre para currículo no Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova. Os cabeçalhos e itens de conferência começam como texto simples." />
    <h2 id="preparar">Formate e confira os fatos</h2>
    <p>Use uma nota do iCloud. A Apple informa que alguns recursos faltam em contas de outros provedores. Mantenha as datas junto das realizações.</p>
    <MenuPaths rows={[{on:"Mac",steps:["Botão de formatação","Cabeçalho"]},{on:"iPhone",steps:["Botão Formatação","Cabeçalho"]}]} />
    <p>Selecione nomes de seção como Experiência e aplique Cabeçalho. No Mac, selecione as quatro linhas sob Fatos a conferir e clique no botão Checklist. No iPhone, use o botão Checklist e Retorno para inserir cada item. Marque só depois de conferir. No Mac, Formatar &gt; Mais &gt; Desmarcar Tudo reinicia a lista para outra revisão. Veja <a href="/blog/apple-notes-templates" hrefLang="en">como guardar modelos</a>.</p>
    <h3>Guarde fontes que consiga reencontrar</h3>
    <p>Registre sua contribuição num resultado da equipe e o período de cada número. Guarde o título ou link da fonte, respeitando as regras sobre informações do trabalho em notas pessoais.</p>
    <Keep title="Índice opcional de evidências" text={EVIDENCE} copyLabel={ui.copy} note="Há uma tabulação entre data e fonte. Cole abaixo do histórico e transforme as linhas em tabela." />
    <MenuPaths rows={[{on:"Mac",steps:["Formatar","Tabela"]}]} />
    <p>No Mac, selecione as quatro linhas do índice e clique no botão Tabela. Ou use Formatar &gt; Tabela e preencha as células. Tab na última célula acrescenta outra linha. No iPhone, toque em Adicionar Tabela e preencha data e evidência. Veja <a href="/blog/apple-notes-tables" hrefLang="en">tabelas no Notas</a>.</p>
    <h2 id="adaptar">Escolha os dados para cada vaga</h2>
    <p>No Mac, selecione a nota mestre e escolha Arquivo &gt; Duplicar Nota. Dê à cópia o nome da vaga e a data. Para operações, Marina pode destacar a checklist de triagem e os relatórios. Para treinamento, o guia merece mais espaço.</p>
    <p>Confira cada frase na fonte. A queda no tempo de resposta foi da equipe; Marina não pode atribuir toda a mudança à sua checklist. Retire relatórios internos e itens de conferência da versão enviada. Acompanhe candidaturas num <a href="/pt/blog/controle-de-candidaturas-notas-iphone">controle separado</a>.</p>
    <h2 id="limites">Finalize em um editor de documentos</h2>
    <p>A nota mestre tem mais detalhes do que um empregador precisa. Num editor de documentos, confira páginas, espaçamento e o arquivo final. Siga o formato pedido e abra o arquivo antes de enviá-lo. O modelo não promete pontuação em filtros de seleção nem PDF de uma página.</p>
    <h2 id="pinto">Peça um rascunho separado à IA</h2>
    <p>Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> e escolher Allow no Pinto Notes, a IA pode ler e editar notas. Peça que leia o histórico e a descrição da vaga e salve outra nota com os resultados relevantes. Mande preservar a original e sinalizar fatos ausentes, sem inventar números ou competências.</p>
    <p>Confira datas, fontes e autoria dos resultados. O Pinto guarda versões anteriores, mas o currículo ainda deve ser finalizado num editor de documentos. Você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar as notas da Apple no Mac</a> sem alterá-las.</p>
  </LocalPostPage>;
}
