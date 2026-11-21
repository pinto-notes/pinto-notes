import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-volta-para-o-inicio");

// Versão pt-BR de /blog/apple-notes-keeps-jumping-to-top, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "notas iphone voltando para o início", "notas iphone sobe sozinho",
// "notas do iphone pula para o inicio" e "notas iphone rolando sozinho" não deram sugestões. A formulação local
// "notas iphone travando" apareceu na busca de problemas gerais; o título descreve o sintoma específico sem inventar demanda.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/119876 (app não responde), /guide/iphone/iph83bfec492/ios
// (Seletor de Apps), /118259 (reiniciar), /guide/mac-help/mchlp2579/mac (problemas com app),
// /guide/mac-help/mchlp2522/mac (Reiniciar), /118575 e /108382 (Atualização de Software),
// /121669 e /guide/icloud/mm8685520792/icloud (sincronização). Nenhuma dessas páginas documenta correção
// para a rolagem voltar ao início. A imagem mostra um aviso do iCloud, não o problema de rolagem.
const ui = UI.pt;
const SUPPORT_RECORD = `O Notas volta para o início
Aparelho e versão do iOS ou macOS:
Acontece em uma nota ou em várias?
O que fiz antes de a tela mudar:
A página sobe, o cursor muda de lugar ou os dois?
A digitação também fica lenta?
O que aconteceu depois de reiniciar:
O que aconteceu depois de atualizar:
O que ocorre com a mesma nota em outro aparelho:
`;
const FAQ = [
  { q: "A Apple publicou uma correção para o Notas voltar ao início?", a: ["As páginas de suporte consultadas não trazem uma correção para esse problema específico. A orientação geral é fechar e reabrir o app, reiniciar o aparelho e verificar atualizações. Isso não garante que a rolagem pare de saltar."] },
  { q: "Desativar o iCloud impede que a nota suba sozinha?", a: ["As páginas consultadas não apontam o iCloud como causa nem recomendam desligá-lo para corrigir a rolagem. A Apple orienta verificar a sincronização quando notas não aparecem em outro aparelho. É outro sintoma."] },
  { q: "O que tentar se o Notas fica lento e perco o ponto em que estava?", a: ["Escreva o próximo trecho numa nota nova, mantendo a original. Você também pode testar a mesma nota do iCloud em outro aparelho ou em icloud.com/notes. São alternativas para testar, sem garantia de resolver a lentidão ou o salto."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-volta-para-o-inicio"
    intro={<>A Apple não documenta uma correção para o Notas que volta ao início da nota. Comece pelos passos gerais de reinício e atualização. Se continuar, teste outra forma de terminar o texto.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#reiniciar", label: "Reiniciar o Notas" }, { href: "#atualizar", label: "Atualizações" },
      { href: "#icloud", label: "Conferir o iCloud" }, { href: "#continuar", label: "Continuar a escrever" },
    ]}>
      <p>Feche e reabra o Notas, reinicie o iPhone ou Mac e procure uma atualização do iOS ou macOS. São os passos gerais da Apple para apps com problemas, sem promessa de corrigir a rolagem. Se notas também sumiram de outro aparelho, confira a sincronização do iCloud.</p>
      <PostCta slug="pt/notas-iphone-volta-para-o-inicio" path="/pt/blog/notas-iphone-volta-para-o-inicio" position="answer" ui={ui.cta} title="Teste uma cópia no Pinto Notes">
        <p>O Pinto Notes <a href="/blog/move-from-apple-notes" hrefLang="en">importa o Notas no Mac</a> e deixa o original como estava. Teste uma cópia da nota afetada antes de decidir mudar. Não há promessa de que o mesmo problema não aconteça. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="reiniciar">Feche o Notas e reinicie o aparelho</h2>
    <p>No iPhone, abra o Seletor de Apps, encontre o Notas e passe o dedo para cima nele. Toque no app para reabri-lo. A Apple mostra o gesto no <a href="https://support.apple.com/pt-br/guide/iphone/iph83bfec492/ios">guia de encerrar e reabrir apps</a>. Se a página continuar saltando, <a href="https://support.apple.com/pt-br/118259">reinicie o iPhone</a> conforme o seu modelo.</p>
    <p>No Mac, encerre o Notas e abra de novo. Para reiniciar o computador, escolha Reiniciar no menu Apple. Esse passo está no <a href="https://support.apple.com/pt-br/guide/mac-help/mchlp2579/mac">guia para apps com problemas</a>. Depois, abra a nota afetada e repita a ação que fez a tela subir.</p>
    <p>Se o app congela ou fecha, veja <a href="/pt/blog/app-notas-iphone-nao-funciona">o que tentar quando o Notas não funciona</a>.</p>

    <h2 id="atualizar">Procure uma atualização</h2>
    <p>A Apple recomenda atualizar o software quando um app não funciona como esperado. Faça backup antes. No iPhone, conecte à energia e ao Wi-Fi. No Mac, as atualizações do macOS incluem o Notas.</p>
    <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "Geral", "Atualização de Software"] }, { on: "Mac", steps: ["menu Apple", "Ajustes do Sistema", "Geral", "Atualização de Software"] }]} />
    <p>Siga as instruções da Apple para <a href="https://support.apple.com/pt-br/118575">atualizar o iPhone</a> ou <a href="https://support.apple.com/pt-br/108382">atualizar o Mac</a>. Vale testar uma atualização disponível. Ela não prova que a Apple corrigiu esse problema específico.</p>

    <h2 id="icloud">Confira o iCloud se notas também sumiram</h2>
    <p>A tela subir durante a digitação não prova que a sincronização falhou. Se a nota também não aparece em outro aparelho, verifique se ambos usam a mesma Conta Apple e se a sincronização do Notas está ativada.</p>
    <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "seu nome", "iCloud", "Ver tudo ou Mostrar tudo", "Notas", "sincronização deste iPhone"] }, { on: "Mac, macOS 15 ou posterior", steps: ["Ajustes do Sistema", "seu nome", "iCloud", "Notas", "sincronização deste Mac"] }]} />
    <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Aviso no Notas do Mac para ativar o iCloud e acessar notas em outros aparelhos." caption="Este aviso trata de sincronização. Não é uma correção para a rolagem." />
    <p>O <a href="https://support.apple.com/pt-br/121669">artigo da Apple sobre notas ausentes</a> orienta reiniciar se elas ainda não aparecerem e conferir o ajuste de novo. O <a href="https://support.apple.com/pt-br/guide/icloud/mm8685520792/icloud">guia do iCloud</a> mostra onde ficam os controles. Veja também <a href="/pt/blog/notas-iphone-nao-sincroniza">como investigar a sincronização</a>.</p>

    <h2 id="continuar">Como continuar a escrever</h2>
    <p>Estas são alternativas para testar, não correções publicadas pela Apple. Guarde a nota original enquanto compara.</p>
    <ul>
      <li>Crie uma nota para o trecho que está escrevendo. Copie só a passagem necessária. Se funcionar melhor, termine ali e reúna o texto depois.</li>
      <li>Teste a mesma nota em outro aparelho, se tiver um. Compare a mesma edição.</li>
      <li>Se a nota estiver no iCloud, abra <a href="https://www.icloud.com/notes">icloud.com/notes</a> no navegador. O guia da Apple documenta esse acesso. Se conseguir editar, use essa opção por enquanto.</li>
    </ul>
    <p>Uma nota nova funcionar melhor não prova que o tamanho da antiga causou o problema. Conseguir escrever no navegador também não explica a falha no app. O teste serve para você terminar o texto.</p>

    <h2 id="ainda">Se a nota continuar saltando ou a digitação ficar lenta</h2>
    <p>Antes de apagar o app ou trocar de conta, guarde outra cópia das notas importantes. O <a href="https://support.apple.com/pt-br/119876">guia geral da Apple</a> avisa que apagar um app pode eliminar dados guardados nele. Veja <a href="/blog/back-up-apple-notes" hrefLang="en">como fazer backup do Notas</a>.</p>
    <p>Anote o que provoca o salto, inclusive se a página sobe ou se o cursor muda de lugar. Se persistir, leve as informações ao <a href="https://support.apple.com/pt-br/contact">Suporte da Apple</a>. Não precisa incluir o conteúdo da nota.</p>
    <Keep title="Registro para o Suporte da Apple" text={SUPPORT_RECORD} />
  </LocalPostPage>;
}
