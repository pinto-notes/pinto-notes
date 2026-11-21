import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { PostCta } from "@/lib/PostCta";
import { Answer, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "notas-iphone-no-windows");

// Versão pt-BR de /blog/apple-notes-on-windows, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: "notas iphone no windows", "notas iphone para windows", "como acessar notas do iphone no windows".
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/105119; guide/icloud/mm000b55f946, mmc0cd6edf, mmcd9c9e9b71, mm198698c442, mmc8a8e49dbd, mm6be2394337, mm8685520792 (todos em support.apple.com/pt-br/guide/icloud/.../icloud).
// Os botões de ícone sem nome visível no guia do iCloud.com são descritos pela ação, sem nome inventado.
const ui = UI.pt;

const FAQ = [
  { q: "Como usar o Notas do iPhone no Windows 11?", a: ["Abra icloud.com/notes no navegador e entre com a Conta Apple usada no Notas. A Apple recomenda versões recentes do Firefox, Chrome, Edge ou Opera. Só aparecem notas guardadas no iCloud."] },
  { q: "Preciso instalar o iCloud para Windows?", a: ["Não. O acesso ao Notas no Windows é pelo navegador. O app iCloud para Windows tem outros recursos, mas a Apple não lista o Notas entre eles."] },
  { q: "Posso adicionar anexos pelo PC?", a: ["A Apple orienta a adicionar anexos no Notas do iPhone ou Mac. Depois, você pode abrir ou baixar esses arquivos no iCloud.com."] },
  { q: "Por que não abro uma nota bloqueada no PC?", a: ["Notas bloqueadas com o código do iPhone ou a senha de início de sessão do Mac não abrem no iCloud.com. Notas bloqueadas com uma senha própria do Notas podem abrir com essa senha. Anexos de notas bloqueadas aparecem como espaços reservados na web."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="notas-iphone-no-windows"
    intro={<>Para acessar o Notas no Windows, abra icloud.com/notes no navegador e entre com sua Conta Apple. As notas precisam estar guardadas no iCloud.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#abrir",label:"Abrir notas"},{href:"#faltando",label:"Notas ausentes"},{href:"#editar",label:"Editar"},{href:"#limites",label:"Limites"}]}>
      <p>O caminho da Apple para Windows, inclusive Windows 11, é o <a href="https://www.icloud.com/notes">Notas no iCloud.com</a>. Você pode ler e editar notas do iCloud no navegador. As mudanças aparecem nos aparelhos Apple com a sincronização ativada.</p>
      <PostCta slug="pt/notas-iphone-no-windows" path="/pt/blog/notas-iphone-no-windows" position="answer" ui={ui.cta} title="Também usa Mac ou iPhone?"><p>O Pinto Notes funciona no iPhone e no Mac e permite que ChatGPT ou Claude edite suas notas depois da conexão. Não funciona no Windows nem na web. O app está em inglês.</p></PostCta>
    </Answer>}
    faq={FAQ}
  >
    <h2 id="abrir">Abra suas notas no PC</h2>
    <Steps><li>Abra <a href="https://www.icloud.com/notes">icloud.com/notes</a> no navegador.</li><li>Entre com a Conta Apple usada para as notas do iCloud.</li><li>Escolha uma pasta e abra a nota que quer ler ou editar.</li></Steps>
    <p>A Apple lista o Notas entre os <a href="https://support.apple.com/pt-br/105119">recursos do iCloud.com no Windows</a>. Recomenda versões recentes de Firefox, Chrome, Edge ou Opera.</p>
    <h2 id="faltando">Se as notas do iPhone não aparecem</h2>
    <p>O iCloud.com mostra notas guardadas no iCloud, não as de outra conta, como Google ou Yahoo. No iPhone ou Mac, procure a nota na seção iCloud da lista de pastas. Veja <a href="/pt/blog/onde-ficam-salvas-notas-iphone">onde suas notas ficam salvas</a>.</p>
    <p>No iPhone, abra <strong>Ajustes &gt; seu nome &gt; iCloud &gt; Ver tudo ou Mostrar tudo &gt; Notas</strong> e ative a sincronização deste iPhone. No Mac, abra Ajustes do Sistema, seu nome, iCloud, Notas e ative a sincronização neste Mac. Use a mesma Conta Apple no PC. Veja o <a href="https://support.apple.com/pt-br/guide/icloud/mm8685520792/icloud">guia de configuração da Apple</a>.</p>
    <p>Se o iCloud.com disser que o acesso aos dados está desativado, verifique o acesso pela web no aparelho Apple. A Proteção Avançada de Dados o desativa inicialmente. Você pode reativá-lo e aprovar o acesso temporário em um aparelho confiável. A Apple explica isso no <a href="https://support.apple.com/pt-br/guide/icloud/mmc8a8e49dbd/icloud">guia de acesso ao iCloud.com</a>.</p>
    <h2 id="editar">Escreva e edite no navegador</h2>
    <Steps><li>Na barra de ferramentas do Notas, use o botão de criar uma nota no canto superior direito.</li><li>Digite. O iCloud.com salva automaticamente.</li><li>Selecione o texto e use a opção de formatação na barra de ferramentas.</li></Steps>
    <p>Para criar uma checklist, clique numa linha vazia ou selecione linhas existentes e use o botão de lista de verificação. Clique no círculo vazio para marcar um item. A opção de formatação também oferece listas com marcadores e numeradas. Veja os guias da Apple para <a href="https://support.apple.com/pt-br/guide/icloud/mmc0cd6edf/icloud">criar notas</a> e <a href="https://support.apple.com/pt-br/guide/icloud/mmcd9c9e9b71/icloud">editar listas</a>.</p>
    <h2 id="limites">O que muda no navegador</h2>
    <h3>Anexos e documentos digitalizados</h3>
    <p>Adicione anexos pelo Notas no iPhone ou Mac. No Windows, clique duas vezes no anexo para abri-lo ou baixá-lo. Para um documento digitalizado, abra a miniatura e use o botão de download. Veja o <a href="https://support.apple.com/pt-br/guide/icloud/mm198698c442/icloud">guia de anexos no iCloud.com</a>.</p>
    <h3>Notas bloqueadas</h3>
    <p>Nos aparelhos Apple, uma nota pode ser desbloqueada com senha, Face ID ou Touch ID. No iCloud.com, a Apple exige a senha própria criada para o Notas. Notas bloqueadas com o código do aparelho ou a senha de início de sessão não abrem na web. Os anexos de notas bloqueadas aparecem como espaços reservados.</p>
    <p>Para adicionar ou remover um bloqueio, ou redefinir a senha do Notas, use um aparelho Apple. Veja o <a href="https://support.apple.com/pt-br/guide/icloud/mm000b55f946/icloud">guia de notas bloqueadas no iCloud.com</a>.</p>
    <h2 id="app">Existe app Notas para Windows?</h2>
    <p>A Apple documenta o acesso pelo navegador. O <a href="https://support.apple.com/pt-br/guide/icloud/mm6be2394337/icloud">guia do iCloud para Windows</a> lista fotos, arquivos e outros dados, mas não o Notas. Instalar esse app não faz parte das etapas acima. Se precisa de um editor no Windows, compare <a href="/pt/blog/alternativas-ao-notas-iphone">alternativas ao Notas</a>.</p>
    <h2 id="pinto">Se também usa Mac ou iPhone</h2>
    <p>O Pinto Notes guarda notas em arquivos Markdown no iPhone e no Mac, com versões anteriores. Não oferece editor para Windows, Android ou web.</p>
    <Figure shot={SHOTS.welcome} caption="Nota de boas-vindas no Pinto Notes para Mac." />
    <p>ChatGPT ou Claude podem ler e editar suas notas depois da <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão</a>. No Mac, você pode <a href="/blog/move-from-apple-notes" hrefLang="en">importar o Notas</a> sem alterar os originais.</p>
  </LocalPostPage>;
}
