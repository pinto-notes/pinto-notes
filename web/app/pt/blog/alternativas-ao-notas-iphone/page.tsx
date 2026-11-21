import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "alternativas-ao-notas-iphone");

// Versão pt-BR de /blog/apple-notes-alternatives, 21 nov 2026.
// Google autocomplete pt-BR, lido em 21 nov: alternativas ao notas do iphone e alternativas ao app notas não tiveram sugestões; melhor app de notas para iphone apareceu na busca ampliada.
// Apple pt-BR, lido em 21 nov: support.apple.com/pt-br/105119.
// Os passos sem nome confirmado são descritos sem inventar rótulos de menu.
const ui = UI.pt;

const FAQ = [
  { q: "Existe um app Notas para Windows?", a: ["Não há app nativo. Você pode abrir as notas do iCloud em icloud.com; Obsidian, Notion, Evernote e Joplin têm apps para Windows."] },
  { q: "Existe um app Notas para Android?", a: ["A Apple não oferece um app Notas para Android. Keep, Obsidian, Notion, Evernote e Joplin têm."] },
  { q: "Qual alternativa grátis é de código aberto?", a: ["Joplin é grátis e de código aberto em Mac, Windows, Linux, iPhone e Android. O Obsidian guarda Markdown aberto, mas o app não é apresentado como código aberto."] },
];

export default function Page() {
  return <LocalPostPage lang="pt" slug="alternativas-ao-notas-iphone"
    intro={<> Se você passou a usar Windows ou Android, ou precisa de outros recursos, vale comparar alternativas ao Notas. Esta lista mostra o que cada app oferece e onde funciona. </>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#opcoes",label:"Opcoes"},{href:"#codigo-aberto",label:"Codigo-aberto"}]}>
      <p>Para Windows e Android, comece por Obsidian, Google Keep ou Notion. Joplin é de código aberto. Se você fica no iPhone e Mac, Bear e Pinto Notes também entram na comparação.</p>
      <PostCta slug="pt/alternativas-ao-notas-iphone" path="/pt/blog/alternativas-ao-notas-iphone" position="answer" ui={ui.cta} title="Notas com ChatGPT ou Claude">
        <p>O Pinto Notes funciona no iPhone e no Mac e deixa ChatGPT ou Claude trabalhar nas notas. O app está em inglês.</p>
      </PostCta>
    </Answer>}
    faq={FAQ}
  >

<h2 id="opcoes">As opções</h2>
<p>O Notas funciona nos aparelhos Apple e abre notas do iCloud no navegador do Windows. A página da Apple não cita Android. Se você usa outras plataformas, compare estes apps. O Pinto Notes pertence ao mesmo projeto deste blog. As vantagens dos outros apps também importam.</p>
<h3>Obsidian</h3>
<PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} maxWidth={600} alt="Nota de compras no Obsidian para Mac, em arquivo Markdown." caption="No Obsidian, uma nota é um arquivo de texto numa pasta." />
<p>Grátis, sem cadastro, para Mac, Windows, Linux, iPhone e Android. Guarda Markdown local, funciona offline e oferece links, gráfico e plugins. Sync custa US$ 4 mensais no plano anual ou US$ 5 no mensal; você também pode configurar outro serviço. Exige mais trabalho para montar seu sistema. <a href="/pt/blog/notas-iphone-vs-obsidian">Compare com o Notas</a>.</p>
<h3>Google Keep</h3>
<p>Grátis no Android, iPhone e navegador. Organiza cartões com cores, notas fixadas e até 50 etiquetas; compartilha listas, oferece lembretes e versões anteriores do texto no computador. Não há pastas. Funciona melhor para listas rápidas do que para uma biblioteca longa. <a href="/pt/blog/notas-iphone-vs-google-keep">Veja a comparação</a>.</p>
<h3>Notion</h3>
<PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} maxWidth={600} alt="Página de reunião de equipe no Notion para Mac." caption="O Notion organiza trabalho em páginas e bancos de dados. Imagem: Notion." />
<p>Tem páginas, bancos de dados, modelos e colaboração no Mac, Windows, iPhone, Android e web. O plano Free guarda sete dias de histórico. Notion AI exige Business ou Enterprise depois do teste limitado. É mais app do que uma lista rápida precisa. <a href="/pt/blog/notas-iphone-vs-notion">Compare com o Notas</a>.</p>
<h3>Evernote</h3>
<p>Funciona nas principais plataformas e no navegador. O Web Clipper salva páginas. O plano Free limita a 50 notas, um bloco e um aparelho; uma biblioteca maior pede plano pago. É boa escolha para quem já arquiva muita coisa da web.</p>
<h3>Bear</h3>
<PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} maxWidth={600} alt="Bear no Mac e no iPhone, com etiquetas, texto destacado e tabela." caption="Bear organiza a escrita por etiquetas. Imagem: Bear." />
<p>App Markdown para Mac e iPhone. É grátis num aparelho; Bear Pro sincroniza pelo iCloud por US$ 2,99 ao mês ou US$ 29,99 ao ano, depois de sete dias de teste, e inclui temas e busca em PDFs e imagens. Para quem escreve muito e fica no ecossistema Apple.</p>
<h3>Pinto Notes</h3>
<PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} maxWidth={600} alt="ChatGPT editou uma nota no Pinto Notes e a alteração aparece destacada." caption="O Pinto Notes mostra a edição feita pela IA e oferece Desfazer." />
<p>Funciona como o Notas no iPhone e no Mac. ChatGPT, Claude, Claude Code e Codex podem ler e editar suas notas depois de conectados. Guarda versões e arquivos Markdown criptografados. Não tem Windows, Android ou web. Se você precisa dessas plataformas, escolha outro app.</p>
<h2 id="codigo-aberto">Se você quer código aberto</h2>
<p>O Joplin é grátis e de código aberto, com app para Windows, Mac, Linux, Android, iPhone e terminal. Guarda Markdown e sincroniza com criptografia por Nextcloud, Dropbox, OneDrive ou Joplin Cloud. Importa exportações do Evernote. O Obsidian usa arquivos Markdown abertos, mas o app não é apresentado como código aberto.</p>
<h2 id="mudanca">Como levar suas notas</h2>
<p>Exportar ou importar faz uma cópia; o Notas original continua como está. Obsidian tem importador no Mac, Notion aceita Markdown em ZIP e o Keep exige copiar nota por nota. O Pinto Notes importa no Mac: Notas com pastas e imagens; Obsidian com subpastas e links; arquivos ENEX do Evernote; download do Keep com etiquetas como pastas; exportação Markdown do Bear; ou pasta e ZIP de texto. Veja <a href="/blog/import-your-notes" hrefLang="en">os detalhes da importação</a> e <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">como sair do Notas</a>.</p>
<PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={460} kind="plain" alt="Menu Arquivo do Pinto Notes com as opções de importação." caption="No Mac, escolha o app de origem no menu Arquivo do Pinto Notes." />
<h2 id="escolha">Qual serve para você?</h2>
<ul><li>Arquivos próprios em várias plataformas: Obsidian.</li><li>Listas rápidas no Android: Google Keep.</li><li>Equipe e projetos: Notion.</li><li>Arquivo de páginas web: Evernote.</li><li>Escrita no iPhone e Mac: Bear.</li><li>Código aberto: Joplin.</li><li>Jeito do Notas com ChatGPT ou Claude: Pinto Notes.</li></ul>


<p>Leia também: <a href="/blog/apple-notes-version-history" hrefLang="en">histórico no Notas</a>, <a href="/blog/best-notes-app-for-mac" hrefLang="en">apps de notas para Mac</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conexão com ChatGPT ou Claude</a>, e <a href="/blog/move-from-apple-notes" hrefLang="en">importação do Notas</a>.</p>
  </LocalPostPage>;
}
