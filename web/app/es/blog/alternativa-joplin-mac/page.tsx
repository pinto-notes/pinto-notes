import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-joplin-mac");
// Spanish version of /blog/joplin-alternative-for-mac, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "alternativa joplin" suggests that exact phrase;
// "alternativa joplin mac" has no suggestions. No Apple menu steps.
// Joplin and Pinto facts and import limits are those of the English post. No picture.
const ui = UI.es;
const CHECK = `Revisión del traslado de Joplin a Pinto Notes
- [ ] Comparar cuántas notas hay en el cuaderno de prueba
- [ ] Leer una nota larga junto al original de Joplin
- [ ] Abrir una imagen y un archivo adjuntos
- [ ] Seguir un enlace entre dos notas importadas
- [ ] Revisar una tabla y una lista de comprobación
- [ ] Comprobar título, fechas y texto de etiquetas
- [ ] Conservar la copia JEX y la exportación Markdown`;
const FAQ = [
 {q:"¿Puede Pinto importar una copia JEX de Joplin?",a:["No por esta vía. Pinto admite una carpeta o ZIP de Markdown o texto. Conserva el JEX como copia que puedes volver a importar en Joplin y haz otra exportación Markdown para Pinto."]},
 {q:"¿Qué exportación de Joplin debo usar?",a:["Prueba Markdown + Front Matter. Joplin documenta título, fechas y etiquetas en ese formato. Pinto lee los campos y añade las etiquetas como texto. Conserva los adjuntos junto a los archivos y prueba un cuaderno pequeño."]},
 {q:"¿Puedo seguir usando Joplin en Linux?",a:["Sí, pero esta importación no conecta las apps. Pinto solo funciona en Mac y iPhone, sin Linux, Windows, Android ni web."]},
 {q:"¿Debo dejar Joplin para conectar Claude?",a:["No. Joplin documenta un servidor MCP local mediante Web Clipper para buscar y leer notas, y para crear o actualizar cuando se habilitan esas herramientas."]},
];
export default function Page() {
 return <LocalPostPage lang="es" slug="alternativa-joplin-mac"
 intro={<>Pinto Notes es una alternativa a Joplin para Mac y iPhone si quieres editar como en Notas de Apple. Si usas Windows, Linux o Android, sigue contando con Joplin.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#elegir",label:"Comparar las apps"},{href:"#seguir",label:"Cuándo seguir en Joplin"},{href:"#exportar",label:"Exportar e importar"},{href:"#revisar",label:"Revisar las notas"},{href:"#pinto",label:"Usar tu IA"}]}>
 <p>Prueba Pinto si tus notas viven en Mac y iPhone y prefieres el editor de Notas de Apple. Empieza por un cuaderno pequeño exportado como Markdown y guarda aparte una copia JEX para Joplin. Las dos apps pueden dar acceso a una IA.</p>
 <PostCta slug="es/alternativa-joplin-mac" path="/es/blog/alternativa-joplin-mac" position="answer" ui={ui.cta} title="Prueba un cuaderno de Joplin en Pinto"><p>Descarga Pinto Notes gratis en el Mac e importa una carpeta de notas Markdown. Conecta ChatGPT o Claude cuando quieras que las lea y edite.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="elegir">Elige según tus dispositivos y editor</h2>
 <div className="tableWrap"><table><thead><tr><th scope="col">Necesitas</th><th scope="col">Joplin</th><th scope="col">Pinto Notes</th></tr></thead><tbody>
 <tr><th scope="row">Mac y iPhone</th><td>Ambos</td><td>Ambos</td></tr>
 <tr><th scope="row">Windows, Linux o Android</th><td>Los tres</td><td>Sin app</td></tr>
 <tr><th scope="row">Edición</th><td>Markdown y texto enriquecido</td><td>Como Notas de Apple</td></tr>
 <tr><th scope="row">IA que trabaje en las notas</th><td>MCP local mediante Web Clipper</td><td>Conexión alojada para ChatGPT o Claude</td></tr>
 </tbody></table></div>
 <p>Joplin enumera sus sistemas en la <a href="https://joplinapp.org/help/install/">guía de instalación</a>. Pinto solo funciona en Mac y iPhone, sin app para Windows, Linux o Android ni versión web.</p>
 <h2 id="seguir">Motivos para seguir en Joplin</h2>
 <p>Joplin tiene editores de <a href="https://joplinapp.org/help/apps/rich_text_editor/">Markdown y texto enriquecido</a>. Si te molestan los símbolos de Markdown, prueba el segundo antes de mover tus notas.</p>
 <p>Su <a href="https://joplinapp.org/help/apps/sync/">guía de sincronización</a> incluye Nextcloud, WebDAV y Dropbox. Importar Markdown a Pinto no traslada esa configuración. Tampoco lleva los <a href="https://joplinapp.org/help/apps/plugins/">plugins</a>; revisa qué hace cada uno para ti.</p>
 <p>Joplin ofrece un <a href="https://joplinapp.org/help/apps/ai_mcp/">servidor MCP</a> local mediante Web Clipper. Permite buscar y leer notas y, con las herramientas activadas, crearlas o actualizarlas. Si solo quieres acceso desde Claude, pruébalo antes de cambiar.</p>
 <h2 id="exportar">Exporta Markdown para Pinto y conserva JEX</h2>
 <p>La <a href="https://joplinapp.org/help/apps/import_export/">guía de Joplin</a> describe JEX como copia para volver a importar notas y metadatos en Joplin. Guarda una antes de empezar. Para Pinto necesitas otra exportación.</p>
 <Steps><li>Exporta un cuaderno pequeño como Markdown + Front Matter a una carpeta propia. Incluye adjuntos y formatos que uses.</li><li>Conserva la carpeta entera, con sus recursos. Abre un archivo Markdown para comprobar el texto.</li><li>En Pinto para Mac, elige File, Import Markdown or Text. Selecciona la carpeta o un ZIP y revisa la importación.</li></Steps>
 <p>La <a href="https://joplinapp.org/help/dev/spec/interop_with_frontmatter/">guía de front matter</a> explica los títulos, fechas y etiquetas escritos antes del texto. Pinto lee esos datos y añade las etiquetas como texto. Comprueba el resultado.</p>
 <p>La <a href="/blog/import-your-notes" hrefLang="en">importación de Pinto</a> (en inglés) acepta carpetas o ZIP de Markdown o texto. Cada carpeta se convierte en carpeta. Importa imágenes y archivos enlazados que pueda encontrar. No modifica los archivos de origen ni importa JEX.</p>
 <h2 id="revisar">Comprueba lo que más usas</h2>
 <p>Compara las copias con Joplin. Abre enlaces y adjuntos; no te guíes solo por el número de notas.</p>
 <Keep title="Revisión de la importación de Joplin" text={CHECK} copyLabel={ui.copy} note="Es una lista para tus notas, no un informe de una importación ya comprobada." />
 <p>Los ajustes y versiones anteriores de Joplin no pasan por esta vía. Tampoco se prometen los plugins ni las alarmas de tareas. Resuelve los fallos de la muestra antes de importar el resto.</p>
 <h2 id="pinto">Trabaja con las notas importadas en Pinto</h2>
 <p>Pinto conserva las versiones anteriores de los cambios hechos allí, no las que quedaron en Joplin. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y elegir Allow, puede leer y editar tus notas. Pinto usa una conexión alojada; Joplin documenta una local.</p>
 <p>Pide a tu IA que encuentre una nota de proyecto importada, enumere el trabajo pendiente y muestre las líneas usadas. Comprueba la respuesta antes de pedir que añada otro paso. Escribe durante unos días en las copias y ábrelas en iPhone. Mueve el resto cuando la prueba te sirva, conservando la exportación original. La app está en inglés.</p>
 </LocalPostPage>;
}

