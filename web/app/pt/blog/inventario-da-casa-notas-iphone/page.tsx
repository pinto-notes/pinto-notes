import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("pt", "inventario-da-casa-notas-iphone");

// Versão pt-BR de /blog/apple-notes-home-inventory-template, 21 nov 2026. Autocomplete Google
// (hl=pt, gl=br): "inventário doméstico modelo" não trouxe sugestões. Optamos pelo termo
// corrente "inventário da casa". Apple pt-BR consultada em 21 nov:
// support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac (Formatar > Tabela),
// apd93c815aa0/mac (Lista de Verificação), not95edd2813/mac (anexos);
// support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios (Tabela, Formatação)
// e iph23f4d9aa9/ios (anexos). Sem imagem no original.

const ui = UI.pt;
const TEMPLATE = `Inventário da sala
Cômodo: sala
Última conferência: 21 de novembro de 2026

Item\tRegistro
S01: rádio portátil\tNúmero de série anotado; anexar nota fiscal e fotos
S02: mesa de centro\tSem número de série; falta comprovante; anexar foto

S01: rádio portátil
Cômodo e local: sala, estante perto da janela
Marca/modelo: Mondial BX-12
Número de série: EXEMPLO-S01-2047 (fictício)
Compra: 8 de março de 2025
Preço pago: R$ 259, não é valor atual de mercado
Nota fiscal: S01-nota.pdf, anexar abaixo deste registro
Fotos: S01-frente.jpg e S01-etiqueta.jpg, anexar abaixo
Estado: pequeno arranhão perto do botão de volume

S02: mesa de centro
Cômodo e local: sala, em frente ao sofá
Marca/modelo: sem marca, madeira maciça, 90 x 50 cm
Número de série: não tem marcação
Compra: 12 de junho de 2023, usada
Preço pago: R$ 180, não é valor atual de mercado
Comprovante: não tenho, comprei em dinheiro
Foto: S02-mesa.jpg, anexar abaixo deste registro
Estado: mancha de água no canto esquerdo

Ainda falta
Anexar a nota fiscal do rádio
Anexar as fotos da frente e da etiqueta do rádio
Anexar a foto da mesa
Conferir o número de série com a etiqueta do rádio
`;
const FAQ = [
  { q: "Posso fazer um inventário da casa no app Notas?", a: ["Sim. Use uma nota por cômodo, com número de série, comprovante e fotos de cada item. Copie o exemplo e substitua pelos seus bens."] },
  { q: "Como anexar fotos e comprovantes?", a: ["No iPhone, toque no botão de anexos da nota para escolher uma foto. Para um PDF no app Arquivos, abra o arquivo, toque em Compartilhar, escolha Notas e selecione a nota do cômodo. No Mac, arraste o arquivo do Finder para a nota."] },
  { q: "A nota calcula o valor de reposição?", a: ["Não. O modelo registra o que você tem e quanto pagou. Não calcula o valor atual nem o custo de reposição e não representa aprovação da seguradora."] },
  { q: "E se o item não tiver número de série?", a: ["Escreva Não tem marcação depois de conferir, ou Ainda não conferi se falta olhar. Mantenha descrição e fotos."] },
];
export default function Page() {
  return <LocalPostPage lang="pt" slug="inventario-da-casa-notas-iphone"
    intro={<>Copie este modelo de inventário da casa para uma nota por cômodo no app Notas. Cada item tem espaço para número de série, comprovante e fotos.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#modelo", label: "Copie o modelo" }, { href: "#configurar", label: "Tabela e checklist" },
      { href: "#fotos", label: "Comprovantes e fotos" }, { href: "#limites", label: "Limites" },
      { href: "#pinto-notes", label: "Use no Pinto Notes" },
    ]}><p>Uma nota por cômodo pode reunir uma tabela curta e os registros detalhados de cada item. Troque os dados do exemplo e anexe comprovantes e fotos junto ao registro certo. A nota não avalia seus bens nem substitui a exigência da seguradora.</p>
      <PostCta slug="pt/inventario-da-casa-notas-iphone" path="/pt/blog/inventario-da-casa-notas-iphone" position="answer" ui={ui.cta} title="Peça ajuda para atualizar os registros">
        <p>O Pinto Notes se parece e funciona como o app Notas no iPhone e no Mac. Depois de conectar ChatGPT ou Claude, você pode pedir que leiam e editem os registros com os dados que fornecer.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="modelo">Um cômodo por vez</h2>
    <p>A sala do exemplo tem um rádio e uma mesa usada. Número de série e nomes de arquivo são fictícios. Copiar o texto não anexa nenhum arquivo. Troque marcas, modelos e demais dados.</p>
    <Keep title="Inventário da casa para o app Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cole como texto. Transforme as três linhas de itens em tabela e Ainda falta em checklist." />
    <p>Repita o código do item no registro e nos anexos. S01 identifica o rádio mesmo se houver outro parecido. Use Ainda não conferi para algo pendente e Falta para um comprovante que você não encontrou.</p>
    <h2 id="configurar">Monte a tabela e a checklist</h2>
    <Paths rows={[{ on: "Mac", steps: ["Formatar", "Tabela"] }, { on: "iPhone", steps: ["botão Tabela"] }]} />
    <p>No Mac, selecione as três linhas, de Item até S02, e clique no botão Tabela. Cada Tab vira uma coluna. Também é possível escolher Formatar, Tabela e preencher as células. Tab na última célula cria outra linha. Veja o <a href="https://support.apple.com/pt-br/guide/notes/apd0a136b9cc/mac">guia da Apple</a>.</p>
    <p>No iPhone, toque no botão Tabela e preencha as duas colunas. Apague depois as linhas soltas. Para um título de seção, selecione o texto, toque em Formatação e escolha Cabeçalho. Veja a <a href="https://support.apple.com/pt-br/guide/iphone/iph1ac0b3a2/ios">formatação no iPhone</a>.</p>
    <p>No Mac, selecione as quatro tarefas em Ainda falta e clique em Lista de Verificação. No iPhone, inicie a lista com esse botão e digite um item por linha. Marque só depois de anexar ou conferir. Mantenha descrições longas fora da tabela. Há mais exemplos nos guias de <a href="/blog/apple-notes-tables" hrefLang="en">tabelas</a> e <a href="/blog/apple-notes-templates" hrefLang="en">modelos</a> (em inglês).</p>
    <h2 id="fotos">Anexe os arquivos no item certo</h2>
    <p>Fotografe o objeto inteiro e a etiqueta de série. Coloque os arquivos abaixo do registro escrito, fora da tabela. Digite também o número e compare com a foto antes de marcar a tarefa.</p>
    <p>No iPhone, use o botão de anexos da nota para adicionar a foto. Para uma nota fiscal em PDF no app Arquivos, abra o PDF, toque em Compartilhar, escolha Notas e selecione a nota existente. A Apple explica os <a href="https://support.apple.com/pt-br/guide/iphone/iph23f4d9aa9/ios">anexos no iPhone</a>.</p>
    <p>No Mac, arraste PDFs do Finder e fotos do app Fotos. Use uma nota do iCloud; a Apple informa que notas do Exchange não aceitam anexos de arquivos. Veja os <a href="https://support.apple.com/pt-br/guide/notes/not95edd2813/mac">anexos no Mac</a>.</p>
    <p>Quando vender, doar ou descartar algo, registre a data. Depois de uma compra, acrescente o item enquanto tem o comprovante. Deixe reparos e tarefas periódicas em uma <a href="/pt/blog/manutencao-da-casa-notas-iphone">checklist de manutenção da casa</a>.</p>
    <h2 id="limites">Onde o inventário para</h2>
    <p>O preço pago não é avaliação atual nem estimativa de reposição. Pergunte à seguradora quais documentos ela exige. Confira cada etiqueta e abra os anexos depois de incluí-los. Um nome de arquivo escrito não prova que ele foi anexado. Guarde também uma cópia dos originais.</p>
    <h2 id="pinto-notes">Mantenha o inventário no Pinto Notes</h2>
    <p>O Pinto Notes aceita tabelas e anexos. Não há um modelo pronto de inventário para este post; copie a estrutura acima. Depois de <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (guia em inglês) ou Claude, a IA pode ler e editar as notas. A autorização permite as duas ações. Peça uma lista dos itens com comprovante faltando ou série não conferida, sem adivinhar dados.</p>
    <p>O Pinto exporta as notas como arquivos Markdown em ZIP com os anexos que consegue recuperar. Confira o resumo: notas bloqueadas com senha, Face ID ou Touch ID podem ser puladas, e arquivos que não puderam ser baixados aparecem como ausentes. Abra os arquivos exportados antes de confiar na cópia.</p>
    <p>As notas do app Notas podem ser <a href="/blog/move-from-apple-notes" hrefLang="en">importadas de uma vez no Mac</a> (guia em inglês), sem alterar o original. O app está em inglês.</p>
  </LocalPostPage>;
}
