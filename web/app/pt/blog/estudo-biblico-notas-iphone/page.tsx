import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "estudo-biblico-notas-iphone");
// Versão pt-BR de /blog/apple-notes-bible-study-template, 21 nov 2026.
// Google autocomplete pt-BR, 21 nov: "modelo estudo biblico" e "modelo de estudo biblico";
// "modelo estudo biblico notas iphone" não trouxe sugestões. Evidência do tema, não do app.
// Apple pt-BR, lida em 21 nov: support.apple.com/pt-br/guide/notes/apd1955d3b21/mac
// (botão Formatação, Cabeçalho), apd93c815aa0/mac (botão Checklist), apd0a136b9cc/mac
// (botão Tabela, Formatar > Tabela, Tab na última célula), not9474646a9/mac (Editar > Colar,
// Arquivo > Duplicar Nota), /guide/iphone/iph1ac0b3a2/ios (criação de nota, Formatação,
// Cabeçalho, criação de tabela) e /102296 (Checklist, Voltar). Sem citação bíblica:
// não foi verificada uma tradução portuguesa em domínio público ou com licença livre.
const ui = UI.pt;
const TEMPLATE = `Estudo bíblico: Tiago 1:19-25, 21 de novembro de 2026

Passagem
Tiago 1:19-25
Tradução: anote a edição que você usa
Trecho: Tiago 1:22. Leia o versículo na sua edição; não copie o texto sem verificar a licença.

Observações
O versículo 19 coloca o ouvir antes do falar e alerta sobre a ira.
Os versículos 23 e 24 comparam quem ouve e esquece com alguém que olha no espelho e logo esquece o que viu.

Perguntas
Como o exemplo do espelho liga o ouvir à ação?
A que se refere o verbo "perseverar" no versículo 25 na tradução que estou lendo?

Referências cruzadas
Referência\tRelação a examinar
Lucas 6:46-49\tComparar o ouvir e o praticar com Tiago 1:22.
Provérbios 15:1\tComparar a fala e a ira com Tiago 1:19.

Aplicação
Hoje, no jantar, deixar a Ana terminar de falar antes de responder.
Amanhã, anotar um momento em que ouvi ou interrompi alguém.

Oração
Deus, ajuda-me a ouvir com paciência e a praticar o que aprendo. Amém.
`;
const PROMPT = `Leia minha nota do Pinto Notes "Estudo bíblico: Tiago 1:19-25, 21 de novembro de 2026".
Busque nas outras notas de estudo perguntas anteriores sobre ouvir, falar ou praticar o que se ouviu.
No chat, copie as perguntas encontradas exatamente e informe o título e a data da nota de origem.
Se não encontrar nenhuma, diga isso. Não invente notas ou respostas anteriores.
Não altere minhas notas enquanto confiro os resultados.
Depois que eu escolher uma pergunta, acrescente só ela e sua fonte à seção Perguntas da nota sobre Tiago.
Mantenha a referência bíblica, as observações, a aplicação e a oração como estão.
Se sugerir uma interpretação, marque-a no chat como "Interpretação sugerida para conferir" e separe-a da passagem bíblica.`;
const FAQ = [
  { q: "O que incluir num modelo de estudo bíblico no Notas?", a: ["Anote a referência e a tradução usada. Separe observações, perguntas, referências cruzadas, aplicação e oração. Identifique qualquer trecho copiado para distingui-lo das suas palavras."] },
  { q: "Posso guardar referências cruzadas numa tabela?", a: ["Sim. Use uma coluna para a referência e outra para o motivo da comparação. No Mac, escolha Formatar, Tabela. No iPhone, toque no controle para adicionar uma tabela. Leia cada passagem no contexto."] },
  { q: "A checklist mede o entendimento do texto?", a: ["Não. Ela serve para ações concretas, como reler uma passagem ou voltar a uma pergunta. Marcar um item registra a ação, não a compreensão ou a fé."] },
  { q: "Posso reutilizar o modelo com outra passagem?", a: ["Sim. No Mac, selecione a nota e escolha Arquivo, Duplicar Nota. Troque a referência e a data e escreva as novas respostas. Guarde o estudo anterior como registro."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="estudo-biblico-notas-iphone"
    intro={<>Copie este modelo de estudo bíblico para o app Notas e use uma nota por passagem. O exemplo de Tiago 1:19-25 separa observações, perguntas, referências cruzadas, aplicação e oração.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#montar", label: "Monte a nota" },
      { href: "#estudar", label: "Estude a passagem" }, { href: "#limites", label: "Limites" },
      { href: "#pinto", label: "Busque perguntas antigas" },
    ]}>
      <p>Coloque a referência e a tradução acima das suas anotações. O exemplo funciona como texto comum. Transforme as referências cruzadas em tabela e as ações em checklist com os controles do Notas.</p>
      <div id="modelo"><Keep title="Modelo de estudo bíblico para o Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole numa nota nova e troque o exemplo pela sua passagem. Não há versículo citado aqui: confira o texto e a licença da tradução que você usa." /></div>
      <PostCta slug="pt/estudo-biblico-notas-iphone" path="/pt/blog/estudo-biblico-notas-iphone" position="answer" ui={ui.cta} title="Quer reencontrar perguntas de outros estudos?"><p>O Pinto Notes funciona como o Notas no Mac e no iPhone. Depois de conectar ChatGPT ou Claude, você pode pedir que busque perguntas nas suas notas. O app está em inglês.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="montar">Monte a nota no app Notas</h2>
    <p>Use uma nota do iCloud ou guardada no aparelho. Alguns recursos não funcionam em contas de outros provedores. O texto pode ser lido antes de receber formatação.</p>
    <MenuPaths rows={[
      { on: "Mac", steps: ["Formatação", "Cabeçalho"] },
      { on: "Mac", steps: ["Formatar", "Tabela"] },
      { on: "iPhone", steps: ["Formatação", "Cabeçalho"] },
    ]} />
    <p>No Mac, cole o texto numa nota nova com Editar, Colar. Clique no nome de uma seção, use o botão Formatação e escolha Cabeçalho. Selecione as duas linhas de Aplicação e clique no botão Checklist.</p>
    <p>Selecione as três linhas de Referência até Provérbios 15:1 e clique em Tabela. A tabulação separa as colunas. Você também pode escolher Formatar, Tabela e preencher as células. Tab na última célula cria outra linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia de tabelas da Apple</a> e <a href="/blog/apple-notes-tables" hrefLang="en">mais opções</a> (em inglês).</p>
    <p>No iPhone, crie uma nota e cole o texto. Selecione cada nome de seção, toque em Formatação e escolha Cabeçalho. Em Aplicação, toque em Checklist e digite cada ação, usando Voltar para a próxima. Apague as linhas comuns depois. Para as referências, toque no controle para adicionar uma tabela e preencha as duas colunas. A Apple mostra os controles no <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">guia do Notas no iPhone</a>.</p>

    <h2 id="estudar">Use o modelo com outra passagem</h2>
    <p>Troque a referência e anote qual tradução você está lendo. Este exemplo indica Tiago 1:22 sem reproduzir o versículo. Leia a passagem completa antes de escrever observações. Identifique palavras repetidas e a comparação com o espelho; deixe dúvidas em Perguntas.</p>
    <p>Na tabela, diga por que quer comparar cada texto e leia os versículos ao redor. Se consultar um comentário, registre título e página ou link. Assim você pode voltar à fonte.</p>
    <p>Escolha uma aplicação que consiga descrever. O jantar é apenas o exemplo de uma pessoa. Troque-o pela sua ação e escreva sua oração. Marque a checklist depois de agir e acrescente uma frase com data sobre o que aconteceu.</p>
    <p>No Mac, use Arquivo, Duplicar Nota para o estudo seguinte. Mude título e data e limpe as respostas antigas. No iPhone, copie o modelo para uma nota nova. O <a href="/blog/apple-notes-templates" hrefLang="en">guia de modelos</a> (em inglês) traz outros formatos.</p>

    <h2 id="limites">Onde o modelo para</h2>
    <p>Você preenche este registro. Ele não procura versículos nem verifica se uma citação corresponde à sua tradução. Uma referência na tabela ainda precisa ser lida. Deixe perguntas em aberto quando faltar contexto.</p>
    <h2 id="pinto">Busque perguntas antigas com ChatGPT ou Claude</h2>
    <p>Você pode usar o modelo no Pinto Notes, com cabeçalhos, checklists e tabelas. Ao <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT ou Claude</a> (guia em inglês) e escolher Allow, a IA pode ler e editar suas notas. Peça que procure perguntas anteriores sobre a passagem ou o assunto.</p>
    <Keep title="Peça à IA que encontre perguntas anteriores" text={PROMPT} copyLabel={ui.copy} note="Use depois de conectar o Pinto Notes. Troque o título e o assunto. A busca precisa de notas anteriores para encontrar algo." />
    <p>Confira as perguntas nas notas de origem, com data e texto exato. Se não houver nenhuma, não há o que acrescentar. Depois da edição, confira se suas observações e respostas continuam iguais. Leia qualquer interpretação sugerida à luz da passagem.</p>
    <p>Suas notas do app Notas entram por <a href="/blog/move-from-apple-notes" hrefLang="en">uma importação no Mac</a> (guia em inglês), sem alterar os originais.</p>
  </LocalPostPage>;
}
