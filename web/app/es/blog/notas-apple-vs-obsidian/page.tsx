import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, FigurePair, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-apple-vs-obsidian");
// Versión de /blog/apple-notes-vs-obsidian. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "apple notes vs" ofrece "apple notes vs obsidian"; "notas iphone vs obsidian" no ofrece sugerencias.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/not201900c07/mac
// (Archivo > Importar a Notas, Importar formato Markdown, Exportar como); /apde615d29c2/mac (Edición > Añadir enlace).
// Los datos de Obsidian y los precios son los del artículo inglés. Las capturas están en inglés.
const ui = UI.es;
const FAQ = [
  { q: "¿Es mejor Notas de Apple que Obsidian?", a: ["Para apuntes rápidos en iPhone y Mac, suele ser más sencillo: ya está instalado y se sincroniza con iCloud. Obsidian conviene si quieres archivos Markdown, enlaces de vuelta, complementos o usar Windows, Linux y Android."] },
  { q: "¿Se sincronizan Obsidian y Notas?", a: ["No. El importador de Obsidian copia tus notas una vez en un Mac. Notas puede importar archivos Markdown. Después, cada app conserva su propia copia."] },
  { q: "¿Obsidian es gratis?", a: ["Sí. No exige registro. Obsidian Sync cuesta 4 USD al mes con pago anual o 5 USD con pago mensual. Publish cuesta 8 o 10 USD, respectivamente. También puedes sincronizar la carpeta con iCloud entre iPhone y Mac."] },
];
export default function Page() { return <LocalPostPage lang="es" slug="notas-apple-vs-obsidian"
  intro={<>Notas viene con el iPhone y el Mac. Obsidian guarda tus apuntes como archivos que puedes abrir con otras apps. La elección depende de dónde trabajas y de cuánto quieres organizar tus notas.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacion",label:"Comparación"},{href:"#notas",label:"Notas de Apple"},{href:"#obsidian",label:"Obsidian"},{href:"#pasar",label:"Pasar de una a otra"}]}>
    <p>Usa <strong>Notas de Apple</strong> para apuntar algo y encontrarlo en tu iPhone o Mac sin preparar nada. Usa <strong>Obsidian</strong> si prefieres archivos Markdown, enlaces entre notas con referencias de vuelta, gráficos, complementos y acceso en Windows, Linux o Android.</p>
    <PostCta slug="es/notas-apple-vs-obsidian" path="/es/blog/notas-apple-vs-obsidian" position="answer" ui={ui.cta} title="¿Quieres notas en Markdown con una app familiar?"><p>Pinto Notes tiene carpetas, listas y tablas como Notas. Guarda versiones anteriores, admite enlaces entre notas e importa Notas u Obsidian en un Mac.</p></PostCta>
  </Answer>}
  hero={<FigurePair items={[
    {src:"/blog/news/apple-notes-mac-groceries",width:1600,height:1000,alt:"Notas en un Mac, en inglés: carpetas y una lista de la compra con casillas marcadas."},
    {src:"/blog/news/obsidian-mac-groceries",width:1600,height:1000,alt:"Obsidian en un Mac, en inglés: carpetas y una lista de la compra en una pestaña."},
  ]} caption="La misma lista en Notas y Obsidian. En Obsidian es un archivo Markdown. Capturas: Pinto Notes." />}
  faq={FAQ}>
  <h2 id="comparacion">De un vistazo</h2>
  <div className="tableWrap"><table><thead><tr><th>Aspecto</th><th>Notas</th><th>Obsidian</th></tr></thead><tbody>
    <tr><th>Precio</th><td>Gratis</td><td>Gratis; Sync desde 4 USD al mes con pago anual</td></tr>
    <tr><th>Dispositivos</th><td>Apple; también iCloud.com</td><td>Mac, Windows, Linux, iPhone y Android</td></tr>
    <tr><th>Archivos</th><td>Dentro de Notas</td><td>Markdown en una carpeta normal</td></tr>
    <tr><th>Enlaces</th><td>Entre notas, sin referencias de vuelta</td><td>Enlaces, referencias de vuelta y gráfico</td></tr>
    <tr><th>Versiones</th><td>Sin historial</td><td>Copias locales durante 7 días; 1 o 12 meses con Sync</td></tr>
    <tr><th>Cifrado</th><td>Apple conserva las claves de iCloud por defecto; Protección de Datos Avanzada las deja en tus dispositivos</td><td>Sync está cifrado; sin Sync, los archivos están en tu disco</td></tr>
  </tbody></table></div>
  <h2 id="notas">Lo que hace mejor Notas</h2>
  <p>Se abre al instante y se sincroniza con iCloud sin pagar por otra app. Tiene tablas, etiquetas, carpetas inteligentes, listas que apartan lo marcado, búsqueda y notas fijadas. También puedes bloquear una nota con contraseña, Face ID o Touch ID. Apple Intelligence transcribe grabaciones y crea resúmenes en dispositivos compatibles.</p>
  <p>Puedes compartir con personas que tengan una Cuenta de Apple. En cambio, tus notas no aparecen como archivos sueltos. En un Mac puedes exportar la nota seleccionada con Archivo, Exportar como, en PDF o Markdown. Para crear un enlace entre notas usa Edición, Añadir enlace, o escribe &gt;&gt;. No muestra qué notas enlazan a la actual y no conserva versiones anteriores. Consulta <a href="/blog/apple-notes-backlinks" hrefLang="en">los enlaces de vuelta</a> y <a href="/blog/apple-notes-version-history" hrefLang="en">el historial de versiones</a>.</p>
  <h2 id="obsidian">Lo que hace mejor Obsidian</h2>
  <p>Cada bóveda es una carpeta de archivos Markdown que puedes abrir con cualquier editor. Los enlaces con [[ ]] se actualizan al cambiar el nombre de una nota. El panel de referencias de vuelta y el gráfico muestran las conexiones; Canvas deja distribuir ideas. Hay miles de complementos y temas.</p>
  <p>Sync es opcional, está cifrado y conserva versiones durante uno o doce meses según el plan. También puedes usar iCloud entre iPhone y Mac, pero Obsidian desaconseja sincronizar una bóveda con dos servicios a la vez. Sin Sync, sus copias locales duran siete días por defecto y no pasan a otros dispositivos. Su herramienta de línea de comandos requiere que Obsidian esté abierto; algunos complementos añaden servidores MCP. <a href="/blog/obsidian-mcp" hrefLang="en">Aquí se comparan</a>.</p>
  <p>La contrapartida es el tiempo de montar tu sistema y mantener los complementos. Si necesitas que otras personas editen una bóveda contigo, Obsidian lo ofrece mediante Sync.</p>
  <h2 id="pasar">Pasar notas de una app a otra</h2>
  <p>El importador oficial de Obsidian lee Notas en un Mac y copia tablas, imágenes, dibujos, escaneos y PDF. Omite las notas bloqueadas. <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">Estos son los pasos</a>. En sentido contrario, en Notas para Mac usa Archivo, Importar a Notas o Importar formato Markdown. Revisa luego los enlaces [[ ]], porque Notas usa otro formato. La importación no mantiene ambas bibliotecas sincronizadas.</p>
  <h2 id="pinto">Otra opción en iPhone y Mac</h2>
  <Figure shot={SHOTS.aiEdit} caption="ChatGPT añadió líneas a una nota en Pinto Notes. Los cambios aparecen resaltados y se pueden deshacer." />
  <p>Pinto Notes guarda notas en Markdown, muestra qué notas enlazan a cada una y conserva versiones anteriores. ChatGPT, Claude, Claude Code y Codex pueden leer y editar las notas que les permitas. Están cifradas. En un Mac importa una bóveda de Obsidian con sus carpetas, imágenes y enlaces, o tus Notas de Apple sin cambiarlas.</p>
  <PostFigure src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Dos pantallas de importación de Obsidian en Pinto Notes, en inglés: bóveda encontrada y notas importadas." caption="La importación copia la bóveda; el original permanece en su sitio." />
  <p>Pinto Notes solo funciona en iPhone y Mac. No tiene gráfico, complementos de Obsidian ni app para Windows, Android, Linux o web.</p>
 <p>También puedes consultar <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>; }
