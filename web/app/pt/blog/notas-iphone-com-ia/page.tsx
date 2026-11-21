import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-com-ia");

// Versão pt-BR de /blog/apple-notes-ai, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: inteligencia artificial no notas do iphone não teve sugestões; apple intelligence notas não teve sugestões.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/121115, support.apple.com/pt-br/guide/iphone/iphbe11247b5/ios, support.apple.com/pt-br/guide/iphone/iph6f08da1d2/ios, support.apple.com/pt-br/127893.
// Etapas sem nome confirmado aparecem descritas sem nome de menu.
const ui = UI.pt;

const FAQ = [
  { q: "O Notas faz resumo com IA?", a: ["Sim. O Apple Intelligence resume texto selecionado e transcrições de gravações em aparelhos compatíveis."] },
  { q: "Por que uma gravação não mostra transcrição?", a: ["O aparelho pode não atender aos requisitos ou o Notas pode não ter detectado um idioma compatível."] },
  { q: "Minhas notas são enviadas à Apple?", a: ["A Apple diz que muitos pedidos rodam no aparelho. Pedidos maiores podem usar Private Cloud Compute, sem armazenar os dados ou dar acesso a eles à Apple."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-com-ia"
    intro={<> O Notas reúne Ferramentas de Escrita, transcrição, resumos de gravações e Siri AI. Cada recurso tem requisitos diferentes de aparelho e idioma. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#recursos",label:"Recursos"},{href:"#audio",label:"Audio"}]}>
      <p>Apple Intelligence pode revisar e resumir texto selecionado e resumir transcrições. A transcrição simples funciona em mais aparelhos. ChatGPT e Claude não têm acesso livre à biblioteca do Notas pelo iPhone.</p>
      <PostCta slug="pt/notas-iphone-com-ia" path="/pt/blog/notas-iphone-com-ia" position="answer" ui={ui.cta} title="Notas que a sua IA pode usar">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude trabalhar nas notas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="recursos">O que a IA faz no Notas</h2>
<PostFigure src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Nota de uma aula no Mac com gravação de áudio, transcrição e resumo." caption="Uma gravação dentro do Notas, com a transcrição abaixo. Imagem: Apple." />
<p>As Ferramentas de Escrita revisam, reescrevem e resumem o texto selecionado, inclusive pontos principais. Uma gravação no Notas pode gerar transcrição e resumo; a transcrição em si funciona em aparelhos mais antigos que os exigidos pela IA. Em iOS 27 e macOS 27, Siri AI em beta também pode encontrar e editar notas. O Image Wand transforma um esboço ou texto em imagem no iPhone. Chamadas gravadas, onde esse recurso está disponível, ficam numa pasta própria com transcrição e resumo.</p>
<p>Para reescrever, selecione o texto e abra Ferramentas de Escrita. No Mac, clique com Control no texto selecionado e abra as ferramentas. Escolha revisar, reescrever, resumir ou extrair pontos principais. Com a extensão do ChatGPT ativada, a opção de redigir pode usar todo o texto ou só a seleção.</p>
<h2 id="audio">Gravar e resumir</h2>
<ol><li>Numa nota, toque ou clique no botão de anexos e escolha gravar áudio. Você pode continuar escrevendo.</li><li>Abra a gravação, veja a transcrição e, se quiser, adicione o texto à nota.</li><li>Nos aparelhos compatíveis com Apple Intelligence, abra o resumo da transcrição e copie ou compartilhe.</li></ol>
<p>Apagar a gravação apaga também a transcrição. Para chamadas, a outra pessoa ouve o aviso de gravação. A gravação de chamadas não está disponível na União Europeia e em alguns outros lugares.</p>
<h2 id="requisitos">Aparelhos e idiomas</h2>
<p>Apple Intelligence exige iPhone 15 Pro ou posterior entre os modelos compatíveis, ou Mac com M1 ou posterior, com iOS ou macOS 27. Idioma do aparelho e da Siri precisam ser iguais e compatíveis. A Apple inclui português; resumos de transcrição aceitam português do Brasil. É preciso espaço livre, de até 8 GB ou 14 GB em alguns modelos. Alguns recursos nos servidores têm limites diários. Na China continental, aparelhos comprados lá não têm Apple Intelligence. Siri AI está em beta em português, mas na UE só no Mac. A transcrição simples funciona desde o iPhone 12 em idiomas compatíveis.</p>
<p>A Apple lista para a transcrição no iPhone inglês, espanhol, português, italiano, francês, alemão, japonês, coreano e chinês simplificado e tradicional. Os resumos têm uma lista própria de idiomas e regiões, que inclui português do Brasil. Para Apple Intelligence em geral, a lista é mais ampla. Confira o idioma do aparelho e da Siri antes de procurar a opção.</p>
<h2 id="busca">Busca comum e busca com IA</h2>
<p>A busca do Notas encontra texto digitado e manuscrito, palavras em digitalizações, objetos em imagens e etiquetas. Notas bloqueadas mostram só o título no resultado. Dentro de uma nota, a busca pode incluir anexos. Com Siri AI no iOS 27, você pode pedir uma nota pelo assunto, mesmo sem lembrar o título.</p>
<h2 id="limites">O que ChatGPT e Claude podem acessar</h2>
<p>As Ferramentas de Escrita atuam no conteúdo que você seleciona. A extensão do ChatGPT recebe o texto que você escolhe enviar; Claude não tem extensão equivalente no Notas. No Mac, os apps do ChatGPT e Claude oferecem caminhos limitados para trabalhar na nota aberta. No celular ou na web, eles não têm acesso livre à sua biblioteca do Notas. A Apple diz que muitas solicitações de IA ficam no aparelho; as maiores podem ir ao Private Cloud Compute, que não armazena os dados nem os disponibiliza à Apple.</p>
<h2 id="pinto">ChatGPT ou Claude em todas as notas</h2>
<Figure shot={SHOTS.aiEdit} caption="O ChatGPT acrescentou itens a uma nota no Pinto Notes. Cada alteração pode ser desfeita." />
<p>O Pinto Notes não tem IA própria. Depois da conexão, ChatGPT, Claude, Claude Code e Codex podem buscar, ler e editar suas notas no iPhone, Mac ou pela conversa que você usa. O app destaca alterações, oferece Desfazer, guarda versões e mantém notas bloqueadas fora do alcance da IA. As notas são arquivos Markdown criptografados. A importação do Notas acontece no Mac e não altera o original. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Veja como conectar</a>.</p>


<p>Leia também: <a href="/blog/claude-and-apple-notes" hrefLang="en">Claude e Notas</a>, <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>, e <a href="/blog/siri-ai-apple-notes" hrefLang="en">Siri AI no Notas</a>.</p>
  </LocalPostPage>;
}
