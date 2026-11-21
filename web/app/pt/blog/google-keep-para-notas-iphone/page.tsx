import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "google-keep-para-notas-iphone");

// Versão pt-BR de /blog/google-keep-to-apple-notes, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: google keep apple notes; google keep to apple notes transfer; migrar google keep para notas do iphone não teve sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/102223, support.apple.com/pt-br/guide/notes/not201900c07/mac.
// Não foi preciso inventar rótulos para etapas sem nome localizado.
const ui = UI.pt;

const FAQ = [
  { q: "O Notas importa Google Keep diretamente?", a: ["Não. No Mac, baixe os dados pelo Google Takeout e importe os arquivos HTML com Arquivo, Importar para o app Notas."] },
  { q: "Keep e Notas sincronizam?", a: ["Não. Adicionar uma conta Google ao Notas sincroniza notas do próprio app, não as notas do Keep."] },
  { q: "O Takeout apaga as notas do Keep?", a: ["Não. Ele cria uma cópia para download. Notas já apagadas no Keep não entram nela."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="google-keep-para-notas-iphone"
    intro={<> O Notas não importa o Keep diretamente, e os dois não sincronizam. Para poucas notas, copiar e colar resolve. Para uma biblioteca, use o Takeout e um Mac. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#antes",label:"Antes"},{href:"#poucas",label:"Poucas"}]}>
      <p>Para poucas notas, copie e cole. Para todas, baixe o Keep pelo Google Takeout e importe os arquivos HTML no Notas do Mac. Cores, etiquetas e lembretes não vêm como no Keep.</p>
      <PostCta slug="pt/google-keep-para-notas-iphone" path="/pt/blog/google-keep-para-notas-iphone" position="answer" ui={ui.cta} title="Traga suas notas para o Pinto Notes">
        <p>O Pinto Notes importa suas notas no Mac, funciona no iPhone e deixa ChatGPT ou Claude trabalhar nelas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="antes">Antes de começar</h2>
<p>Os apps não sincronizam. O Keep usa etiquetas e cores; o Notas usa pastas e etiquetas próprias. Faça um teste com checklist, imagem e etiqueta. Anote suas etiquetas, olhe também o arquivo do Keep e mantenha o original até conferir todas as notas.</p>
<h2 id="poucas">Poucas notas: copie e cole</h2>
<ol><li>Abra a nota no Keep, selecione o texto e copie.</li><li>Crie uma nota no Notas, ponha o título na primeira linha e cole o texto.</li><li>Se a checklist virar linhas comuns, selecione-as e toque no botão Checklist.</li><li>Salve e adicione à parte as imagens que não vierem com o texto.</li></ol>
<p>Isso funciona no iPhone. É prático para algumas dezenas de notas, mas lento para centenas.</p>
<h2 id="todas">Biblioteca inteira: Takeout e Mac</h2>
<ol><li>Em takeout.google.com, desmarque tudo menos Keep e peça o download em ZIP por link de e-mail.</li><li>Quando chegar, descompacte no Mac. O Google diz que o pedido pode levar de minutos a dias; o link dura cerca de sete dias e aceita cinco downloads.</li><li>Na pasta Keep, selecione os arquivos HTML. O download também pode ter JSON, que o Notas não importa.</li><li>No Notas, escolha uma pasta do iCloud e use <strong>Arquivo &gt; Importar para o app Notas</strong>. Confirme duas vezes. Os arquivos aparecem em <strong>Notas Importadas</strong>.</li></ol>
<p>O Takeout copia notas não apagadas, texto, listas, imagens, áudios, desenhos, cores, status de arquivo e notas fixadas, além de etiquetas. Não apaga nada no Keep. No iPhone, o app Arquivos permite compartilhar um arquivo por vez com Notas; para a biblioteca inteira, use o Mac.</p>
<h2 id="resultado">Confira o resultado</h2>
<p>O texto é importado. A Apple não especifica como cada lista ou imagem do HTML vai aparecer; confira a nota de teste. Etiquetas do Keep não viram etiquetas do Notas, cores e lembretes ficam para trás. Você pode criar pastas ou digitar uma etiqueta como #receitas em cada nota importante. Uma Pasta Inteligente reúne essas notas.</p>
<h2 id="sincronizacao">Conta Google não é Keep</h2>
<p>Adicionar Google às contas do Notas guarda notas do próprio app na conta por IMAP. Isso não mostra as notas no Keep. Alguns recursos do Notas não funcionam nessas contas; o iCloud é melhor para as notas importadas. Para ir do Notas ao Keep, copie uma por uma. <a href="/pt/blog/notas-iphone-vs-google-keep">Compare os dois apps</a>.</p>
<h2 id="pinto">Importar para o Pinto Notes</h2>
<PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} maxWidth={640} kind="plain" alt="Guia de importação do Google Keep no Pinto Notes no Mac." caption="O Pinto Notes abre a página do Google com Keep selecionado para download." />
<p>O Pinto Notes lê o download completo no Mac. Etiquetas viram pastas ou etiquetas; checklists mantêm as marcações, notas fixadas e imagens vêm junto. Notas arquivadas só entram se você marcar essa opção. Cores, desenhos e lembretes não entram, e um resumo mostra quantas notas tinham esses itens. ChatGPT ou Claude podem trabalhar nas notas depois da conexão, com histórico de versões. O app não funciona no Android, Windows ou web.</p>


<p>Leia também: <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas e Pastas Inteligentes</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, <a href="/blog/import-your-notes" hrefLang="en">importação de notas</a>, <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">migração para outros apps</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
