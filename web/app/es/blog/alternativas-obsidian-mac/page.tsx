import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativas-obsidian-mac");

// Traducción de /blog/obsidian-alternative-for-mac, 21 Nov 2026. Autocomplete de Google,
// client=firefox, hl=es, gl=es: "alternativa a obsidian mac" no dio sugerencias;
// "alternativas a obsidian" dio esa frase, "alternativas a obsidian open source",
// "alternativas libres a obsidian" y "alternativas gratuitas a obsidian".
// Apple, guía en español leída el 21 Nov 2026: https://support.apple.com/es-es/guide/notes/not201900c07/mac
// confirma Archivo > Importar formato Markdown. Describe, sin inventar nombre, la opción para mantener
// la estructura de carpetas. Los datos sobre las otras apps y Pinto siguen el original inglés.

const ui = UI.es;
const CHECK = `Antes de mover una bóveda de Obsidian
- Guarda una copia de toda la bóveda, con los adjuntos y la carpeta oculta de ajustes.
- Abre una nota con una imagen y comprueba que se importó.
- Sigue un enlace entre notas, también uno que lleve a una subcarpeta.
- Revisa una nota incrustada y el contenido creado por plugins.
- Busca una nota cuyo título recuerdes.
- Prueba las notas importadas en el iPhone si lo usas.
- Abre un Markdown exportado en otro editor antes de cambiar de app.`;
const FAQ = [
  { q: "¿Qué app para Mac puede importar una bóveda de Obsidian?", a: ["Pinto Notes importa subcarpetas, imágenes y enlaces entre notas. Bear documenta la importación de una carpeta Markdown con adjuntos. Joplin importa un directorio Markdown como cuadernos y subcuadernos. Notas de Apple también importa carpetas Markdown. Revisa enlaces y adjuntos antes de mover todo."] },
  { q: "¿Pinto Notes edita la misma bóveda que tengo en Finder?", a: ["No. Importa una copia a su propia biblioteca y deja la bóveda original en su sitio. No sincroniza los cambios con ella. Puedes exportar la biblioteca de Pinto como archivos Markdown en un ZIP, por separado."] },
  { q: "¿Qué ocurre con las notas incrustadas de Obsidian?", a: ["Se convierten en enlaces a esas notas. Las imágenes y otros archivos enlazados se importan como adjuntos. Pinto omite la carpeta de ajustes de Obsidian y no traslada la configuración de los plugins."] },
  { q: "¿Qué alternativa funciona en Mac y Android?", a: ["Joplin funciona en ambos, admite notas Markdown y permite elegir un servicio de sincronización. Pinto Notes solo funciona en iPhone y Mac. Si quieres seguir editando los mismos archivos locales, también puedes quedarte en Obsidian."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="alternativas-obsidian-mac"
    intro={<>Pinto Notes puede sustituir a Obsidian en Mac si prefieres una interfaz parecida a Notas de Apple y quieres importar tu bóveda. Bear sirve para escribir en Markdown con etiquetas; Joplin, para usar cuadernos en varios sistemas.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#elegir", label: "Elegir una app" }, { href: "#quedarte", label: "Seguir con Obsidian" },
      { href: "#pinto", label: "Importar la bóveda" }, { href: "#comprobar", label: "Revisar la importación" },
    ]}>
      <p>Pinto Notes importa una bóveda con subcarpetas, imágenes y enlaces entre notas. Quédate en Obsidian si necesitas editar los mismos archivos desde Finder o dependes del grafo, Canvas o los plugins.</p>
      <PostCta slug="es/alternativas-obsidian-mac" path="/es/blog/alternativas-obsidian-mac" position="answer" ui={ui.cta} title="Trae tu bóveda a Pinto Notes"><p>Importa tus notas de Obsidian en un Mac y ábrelas en Pinto Notes desde el Mac o el iPhone. Conecta ChatGPT o Claude si quieres que puedan leerlas y editarlas.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640} alt="Pinto Notes encuentra una bóveda llamada Second brain con 27 notas y confirma la importación." caption="Una bóveda de Obsidian importada en Pinto Notes. La original sigue en su sitio. Captura: Pinto Notes." />}
    faq={FAQ}>
    <h2 id="elegir">Elige según lo que quieras cambiar</h2>
    <p>Piensa qué parte de Obsidian quieres dejar. Quizá baste con otro editor. Si también quieres organizar las notas de otra manera, empieza por una carpeta pequeña.</p>
    <ul>
      <li><strong>Pinto Notes:</strong> una interfaz parecida a Notas de Apple, importación de Obsidian y acceso para ChatGPT o Claude conectados. Solo iPhone y Mac.</li>
      <li><strong>Notas de Apple:</strong> carpetas, listas de comprobación y búsqueda para las notas del día a día.</li>
      <li><strong>Bear:</strong> Markdown, etiquetas y tablas. La sincronización con iCloud requiere Bear Pro.</li>
      <li><strong>Joplin:</strong> cuadernos y notas Markdown sin conexión. También funciona en Windows, Linux y Android.</li>
    </ul>
    <p>Notas de Apple puede importar una carpeta Markdown. En un Mac, elige Archivo &gt; Importar formato Markdown y selecciona la carpeta. Activa la opción para mantener su estructura si aparece en Opciones. Revisa imágenes y enlaces <code>[[así]]</code>. La <a href="https://support.apple.com/es-es/guide/notes/not201900c07/mac">guía de Apple</a> explica la importación, pero no promete reproducir una bóveda de Obsidian. Lee también <a href="/es/blog/notas-apple-vs-obsidian">Notas de Apple frente a Obsidian</a>.</p>
    <p>La <a href="https://bear.app/faq/import-your-notes/">guía de Bear</a> indica File, Import From, Markdown Folder para traer archivos y adjuntos de una carpeta y sus subcarpetas. <a href="https://bear.app/">Bear</a> puede encajarte si organizas lo que escribes con etiquetas.</p>
    <p><a href="https://joplinapp.org/help/">Joplin</a> admite varios sistemas. En su app de escritorio, File, Import, MD - Markdown (directory) conserva carpetas como cuadernos y subcuadernos. Consulta sus <a href="https://joplinapp.org/help/apps/import_export/">instrucciones</a> y elige un <a href="https://joplinapp.org/help/apps/sync/">servicio de sincronización</a>, como Dropbox o Nextcloud.</p>
    <h2 id="quedarte">Cuándo conviene seguir con Obsidian</h2>
    <p>Una <a href="https://obsidian.md/help/data-storage">bóveda de Obsidian es una carpeta local de archivos Markdown</a>. Otros editores pueden cambiarlos y Obsidian recoge esos cambios. Si usas scripts o varios editores sobre la misma carpeta, importar copias cambia tu forma de trabajar.</p>
    <p>Obsidian también tiene grafo, Canvas y plugins de la comunidad. Una consulta generada por un plugin necesita más que el texto Markdown que la rodea. Si dependes de esas funciones, quédate en Obsidian o guarda los resultados como texto normal antes de moverlos. Consulta sus <a href="https://obsidian.md/">funciones</a>.</p>
    <p>Si solo quieres acceso desde una IA, lee primero la <a href="/blog/obsidian-mcp" hrefLang="en">guía de MCP para Obsidian</a>. Puede que no necesites cambiar de app.</p>
    <h2 id="pinto">Pasa una bóveda a Pinto Notes</h2>
    <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac y conserva todas las versiones anteriores de cada nota. Importa la bóveda a su propia biblioteca. Los cambios posteriores en Pinto y Obsidian quedan separados. No hay app para Windows o Android ni versión web.</p>
    <ol>
      <li>Guarda una copia de toda la bóveda, incluidas las imágenes y los demás adjuntos.</li>
      <li>En el Mac, abre el menú File de Pinto Notes y elige Import from Obsidian.</li>
      <li>Pinto Notes busca la bóveda. Confirma la carpeta o elige otra.</li>
      <li>Importa las notas, abre unas cuantas y sigue sus enlaces antes de cambiar tu trabajo diario.</li>
    </ol>
    <p>Se importan subcarpetas, imágenes y enlaces entre notas; la bóveda original no cambia. La <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> explica las opciones de Pinto. Una nota incrustada pasa a ser un enlace. La carpeta oculta <code>.obsidian</code> se omite, así que los plugins y Canvas no se reproducen.</p>
    <p>Si <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectas ChatGPT o Claude</a>, pueden leer y editar las notas importadas. Pídeles que lean una nota concreta y añadan un resumen bajo un encabezado. Revisa el resultado; la versión anterior sigue en el historial.</p>
    <p>Puedes exportar la biblioteca como un ZIP con archivos Markdown, carpetas y adjuntos, y enlaces que apunten a las copias exportadas. Abre antes las notas bloqueadas con contraseña, Face ID o Touch ID, y revisa el informe por si algún archivo no pudo descargarse. Exportar no sincroniza los cambios con la bóveda original.</p>
    <h2 id="comprobar">Revisa la importación antes de moverlo todo</h2>
    <p>Prueba una carpeta con dos notas enlazadas y una imagen. Añade una nota que dependa de un plugin si lo usas. Compara el resultado con el original.</p>
    <Keep title="Lista para revisar una bóveda" text={CHECK} copyLabel={ui.copy} />
    <p>Conserva la bóveda y su copia de seguridad hasta revisar la importación y abrir un archivo exportado. Después, elige en qué app escribirás para que los nuevos cambios tengan un solo lugar.</p>
  </LocalPostPage>;
}
